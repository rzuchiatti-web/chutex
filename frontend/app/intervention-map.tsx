import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

const TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

export default function InterventionMapScreen() {
  const { interventionId, alertId } = useLocalSearchParams<{ interventionId?: string; alertId?: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [iv, setIv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(50);
  const [darkMap, setDarkMap] = useState(true);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const leafletLoaded = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      if (interventionId) {
        setIv(await apiFetch(`/api/interventions/${interventionId}`, {}, token));
      } else if (alertId) {
        const alerts = await apiFetch('/api/alerts/active-with-interventions', {}, token);
        const alert = (alerts || []).find((a: any) => a.id === alertId);
        if (alert?.intervention?.id) setIv(await apiFetch(`/api/interventions/${alert.intervention.id}`, {}, token));
      }
    } catch {} finally { setLoading(false); }
  }, [interventionId, alertId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setInterval(fetchData, 10000); return () => clearInterval(t); }, [fetchData]);

  // Toggle map theme
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    const L = require('leaflet');
    mapRef.current.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(darkMap ? TILES.dark : TILES.light).addTo(mapRef.current);
  }, [darkMap]);

  // Init Leaflet
  useEffect(() => {
    if (!iv || Platform.OS !== 'web' || leafletLoaded.current) return;
    const benLoc = iv.beneficiary_location || iv.beneficiary_info || {};
    if (!benLoc.latitude) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    setTimeout(() => {
      try {
        const L = require('leaflet');
        const container = document.getElementById('intervention-map-container');
        if (!container || mapRef.current) return;

        const map = L.map(container, { zoomControl: false, attributionControl: false }).setView([benLoc.latitude, benLoc.longitude], 14);
        tileRef.current = L.tileLayer(TILES.dark).addTo(map);

        // Beneficiary marker
        const benIcon = L.divIcon({
          html: '<div style="width:40px;height:40px;border-radius:50%;background:#EF4444;border:3px solid #FFF;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(239,68,68,0.6)"><i class="ri-user-heart-line" style="font-size:18px;color:#FFF"></i></div>',
          className: '', iconSize: [40, 40], iconAnchor: [20, 20],
        });
        L.marker([benLoc.latitude, benLoc.longitude], { icon: benIcon }).addTo(map).bindPopup(`<b>${iv.beneficiary_name || 'Beneficiaire'}</b>`);

        // Intervener marker
        const intLoc = iv.intervener_location || {};
        if (intLoc.latitude) {
          const intIcon = L.divIcon({
            html: '<div style="width:40px;height:40px;border-radius:50%;background:#3B82F6;border:3px solid #FFF;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(59,130,246,0.6)"><i class="ri-map-pin-user-line" style="font-size:18px;color:#FFF"></i></div>',
            className: '', iconSize: [40, 40], iconAnchor: [20, 20],
          });
          L.marker([intLoc.latitude, intLoc.longitude], { icon: intIcon }).addTo(map).bindPopup(`<b>${iv.assigned_name || 'Intervenant'}</b>`);

          // Fetch real driving route from OSRM
          fetch(`https://router.project-osrm.org/route/v1/driving/${intLoc.longitude},${intLoc.latitude};${benLoc.longitude},${benLoc.latitude}?overview=full&geometries=geojson`)
            .then(r => r.json())
            .then(data => {
              if (data.routes?.[0]?.geometry) {
                const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                L.polyline(coords, { color: '#3B82F6', weight: 5, opacity: 0.8 }).addTo(map);
              }
            })
            .catch(() => {
              // Fallback: straight dashed line
              L.polyline([[intLoc.latitude, intLoc.longitude], [benLoc.latitude, benLoc.longitude]], {
                color: '#3B82F6', weight: 3, opacity: 0.5, dashArray: '10, 8',
              }).addTo(map);
            });

          map.fitBounds([[benLoc.latitude, benLoc.longitude], [intLoc.latitude, intLoc.longitude]], { padding: [60, 60] });
        }

        mapRef.current = map;
        leafletLoaded.current = true;
      } catch (e) { console.error('Leaflet error:', e); }
    }, 500);
  }, [iv]);

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 100);
  }, [sheetHeight]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!iv) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Intervention non trouvee</Text></SafeAreaView>;

  const ben = iv.beneficiary_info || {};
  const alertInfo = iv.alert_info || {};
  const intervener = iv.intervener_full || {};
  const benLoc = iv.beneficiary_location || {};
  const intLoc = iv.intervener_location || {};
  const isCare = intervener.role === 'care_provider' || iv.intervener_type === 'care';
  const isMyIntervention = iv.assigned_to === user?.id;
  const distKm = iv.distance_km || (benLoc.latitude && intLoc.latitude ? Math.round(Math.sqrt(Math.pow((benLoc.latitude - intLoc.latitude) * 111, 2) + Math.pow((benLoc.longitude - intLoc.longitude) * 85, 2)) * 10) / 10 : null);
  const etaMin = distKm ? Math.ceil(distKm * 2.5) : null;
  const etaTime = etaMin ? new Date(Date.now() + etaMin * 60000) : null;

  if (Platform.OS !== 'web') {
    return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Suivi intervention</Text></SafeAreaView>;
  }

  // Min sheet = 8% so it never disappears
  const clampSheet = (pct: number) => Math.max(8, Math.min(92, pct));

  return (
    <div data-testid="intervention-map-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: '#0a0a0a' } as any}>

      {/* MAP — fills entire screen */}
      <div style={{ position: 'absolute', inset: 0 } as any}>
        <div id="intervention-map-container" style={{ width: '100%', height: '100%' } as any} />
        {/* Back button */}
        <div onClick={() => router.back()} data-testid="map-back-btn" style={{ position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 1000 } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#111' }} />
        </div>
        {/* Dark/Light toggle */}
        <div onClick={() => setDarkMap(!darkMap)} style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 999, background: darkMap ? '#FFF' : '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 1000 } as any}>
          <i className={darkMap ? 'ri-sun-line' : 'ri-moon-line'} style={{ fontSize: 20, color: darkMap ? '#111' : '#FFF' }} />
        </div>
      </div>

      {/* BOTTOM SHEET */}
      <div data-testid="bottom-sheet" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${sheetHeight}%`, minHeight: 60,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        display: 'flex', flexDirection: 'column', zIndex: 20,
      } as any}>
        <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28 } as any} />

        {/* Drag handle */}
        <div data-testid="drag-handle" style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', padding: '12px 0 6px', cursor: 'ns-resize', touchAction: 'none', flexShrink: 0 } as any}
          onMouseDown={(e: any) => {
            e.preventDefault();
            const startY = e.clientY;
            const startPct = sheetHeight;
            const pageH = window.innerHeight;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            const onMove = (ev: any) => { setSheetHeight(clampSheet(startPct + ((startY - ev.clientY) / pageH) * 100)); };
            const onUp = () => { document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }}
          onTouchStart={(e: any) => {
            const startY = e.touches[0].clientY;
            const startPct = sheetHeight;
            const pageH = window.innerHeight;
            const onMove = (ev: any) => { ev.preventDefault(); setSheetHeight(clampSheet(startPct + ((startY - ev.touches[0].clientY) / pageH) * 100)); };
            const onUp = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
          }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.4)' } as any} />
        </div>

        {/* Sheet content — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 30px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Status + ETA */}
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', marginBottom: 8 } as any}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Intervention en cours</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Heure d'arrivee</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>{etaTime ? `${etaTime.getHours()}h${String(etaTime.getMinutes()).padStart(2, '0')}` : '--:--'}</div>
            {distKm && <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', marginTop: 4 } as any}><span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{distKm} km restant</span></div>}
          </div>

          {/* FICHE ALERTE */}
          <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } as any}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche alerte</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.2)' } as any}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444' } as any} /><span style={{ fontSize: 9, fontWeight: 600, color: '#EF4444' }}>Active</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 } as any}>
              {[{ l: 'Type', v: alertInfo.alert_type === 'fall' ? 'Chute' : alertInfo.alert_type === 'sos' ? 'SOS' : alertInfo.alert_type || '-' }, { l: 'Severite', v: alertInfo.severity === 'critical' ? 'Critique' : '-' }, { l: 'Appareil', v: alertInfo.device_type || '-' }, { l: 'Heure', v: alertInfo.created_at ? new Date(alertInfo.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-' }].map((item, i) => (
                <div key={i} style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' } as any}><div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{item.l}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{item.v}</div></div>
              ))}
            </div>
          </div>

          {/* FICHE BENEFICIAIRE */}
          <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Fiche beneficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 } as any}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{(ben.name || iv.beneficiary_name || '?').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{ben.name || iv.beneficiary_name}</div>{ben.date_of_birth && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Ne(e) le {ben.date_of_birth}</div>}</div>
            </div>
            {ben.medical_conditions && <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', marginBottom: 4 } as any}><div style={{ fontSize: 8, fontWeight: 600, color: '#EF4444', textTransform: 'uppercase' }}>Pathologies</div><div style={{ fontSize: 11, color: '#FFF', marginTop: 1 }}>{ben.medical_conditions}</div></div>}
            {ben.allergies && <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)', marginBottom: 4 } as any}><div style={{ fontSize: 8, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase' }}>Allergies</div><div style={{ fontSize: 11, color: '#FFF', marginTop: 1 }}>{ben.allergies}</div></div>}
            {ben.phone && <div onClick={() => window.location.href = `tel:${ben.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', marginTop: 4 } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>Appeler {ben.name?.split(' ')[0]}</span></div>}
          </div>

          {/* FICHE INTERVENANT */}
          {iv.assigned_name && (
            <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } as any}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</span>
                {isCare && <div style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{iv.assigned_name.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{iv.assigned_name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{intervener.structure_name || (iv.intervener_type === 'guardian' ? 'Gardien' : 'Intervenant')}</div></div>
              </div>
            </div>
          )}

          {/* Navigate button — ONLY for assigned intervener */}
          {isMyIntervention && benLoc.latitude && (
            <div data-testid="navigate-btn" onClick={() => {
              setSheetHeight(8);
              setTimeout(() => { if (mapRef.current) { mapRef.current.invalidateSize(); mapRef.current.setView([benLoc.latitude, benLoc.longitude], 16, { animate: true }); } }, 200);
            }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: '#FFF', color: '#111', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', marginTop: 4 } as any}>
              <i className="ri-navigation-line" style={{ fontSize: 18 }} />
              Lancer la navigation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
