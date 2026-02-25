import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const TYPE_LABELS: any = { manual_app: 'Bouton SOS (application)', manual_bracelet: 'Pression manuelle (bracelet)', health_anomaly: 'Anomalie de sante', fall: 'Chute detectee (gilet)', sos: 'Bouton SOS', threshold: 'Depassement de seuil' };
const TYPE_ICONS: any = { manual_app: 'ri-hand-heart-line', manual_bracelet: 'ri-remote-control-line', health_anomaly: 'ri-pulse-line', fall: 'ri-walk-line', sos: 'ri-hand-heart-line', threshold: 'ri-alert-line' };
const STATUS_LABELS: any = { active: 'Active', intervention: 'En cours d\'intervention', resolved: 'Resolue' };
const STATUS_COLORS: any = { active: '#EF4444', intervention: '#F59E0B', resolved: '#10B981' };

function MapEmbed({ lat, lng, ivLat, ivLng, benName, ivName }: any) {
  if (Platform.OS !== 'web' || !lat) return null;
  const markers = ivLat && ivLng
    ? `L.marker([${lat},${lng}],{icon:L.divIcon({className:'',html:'<div style="background:#EF4444;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#7C3AED;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(ivName||'I').charAt(0)}</div>'})}).addTo(map);L.polyline([[${ivLat},${ivLng}],[${lat},${lng}]],{color:'#7C3AED',weight:3,dashArray:'8,8'}).addTo(map);map.fitBounds([[${lat},${lng}],[${ivLat},${ivLng}]],{padding:[30,30]});`
    : `L.marker([${lat},${lng}],{icon:L.divIcon({className:'',html:'<div style="background:#EF4444;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);map.setView([${lat},${lng}],14);`;
  const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><style>body{margin:0}#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:''}).addTo(map);${markers}<\/script></body></html>`;
  return <div style={{ height: 180, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' } as any}><iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' } as any} /></div>;
}

export default function AlertDetailScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); }
  }, [alertId, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>Web uniquement</Text></View>;
  if (loading) return <FullScreenLoader />;
  if (!data?.alert) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.3)' }}>Alerte non trouvee</Text></View>;

  const a = data.alert;
  const ben = data.beneficiary || {};
  const guards = data.guardians || [];
  const ivs = data.interventions || [];
  const timeline = data.timeline || [];
  const loc = a.location || data.location || {};
  const status = ivs.length > 0 && a.status === 'active' ? 'intervention' : a.status;
  const sc = STATUS_COLORS[status] || '#EF4444';
  const assignedIv = ivs.find((iv: any) => iv.status === 'accepted' || iv.status === 'en_route');

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 16px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back + Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
          <div onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, ...G, cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Retour</span>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 999, background: `${sc}18`, border: `1px solid ${sc}35` } as any}>
            <span style={{ fontSize: 11, fontWeight: 700, color: sc }}>{STATUS_LABELS[status] || status}</span>
          </div>
        </div>

        {/* Alert Header */}
        <div style={{ ...G, padding: '18px', marginBottom: 12 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${sc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={TYPE_ICONS[a.alert_type] || 'ri-alarm-warning-line'} style={{ fontSize: 22, color: sc }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{TYPE_LABELS[a.alert_type] || a.alert_type}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {new Date(a.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          {/* Anomaly data */}
          {a.alert_type === 'health_anomaly' && a.threshold_data && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>Donnee declencheur</div>
              <div style={{ fontSize: 14, color: '#FFF', fontWeight: 700, marginTop: 4 }}>{a.threshold_data.metric} : {a.threshold_data.value} {a.threshold_data.unit || ''}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Seuil configure : {a.threshold_data.threshold_max || a.threshold_data.threshold_min}</div>
            </div>
          )}
        </div>

        {/* Carte (localisation) */}
        {loc.latitude && (
          <div style={{ marginBottom: 12 } as any}>
            <MapEmbed lat={loc.latitude} lng={loc.longitude} ivLat={assignedIv?.location?.latitude} ivLng={assignedIv?.location?.longitude} benName={ben.name} ivName={assignedIv?.intervenant_name} />
          </div>
        )}

        {/* Vitals - 2x2 grid same as dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
          {[
            { val: ben.heart_rate || '72', unit: 'bpm', label: 'Rythme cardiaque', icon: 'ri-heart-pulse-line', color: '#EF4444' },
            { val: ben.spo2 || '97', unit: '%', label: 'Saturation O2', icon: 'ri-drop-line', color: '#6366F1' },
            { val: ben.blood_pressure ? `${ben.blood_pressure.systolic}/${ben.blood_pressure.diastolic}` : '125/78', unit: 'mmHg', label: 'Tension', icon: 'ri-water-flash-line', color: '#8B5CF6' },
            { val: ben.temperature || '36.6', unit: '°C', label: 'Temperature', icon: 'ri-temp-hot-line', color: '#F59E0B' },
          ].map((v, i) => (
            <div key={i} style={{ ...G, padding: '12px 14px' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                <i className={v.icon} style={{ fontSize: 12, color: v.color }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{v.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{v.val}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Beneficiary info */}
        <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Beneficiaire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>{ben.name?.charAt(0)}</span></div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{ben.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{ben.date_of_birth} - {ben.gender}</div>
            </div>
            {ben.phone && <a href={`tel:${ben.phone}`} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 18, color: '#10B981' }} /></a>}
          </div>
          {[
            ben.phone && { icon: 'ri-phone-line', label: 'Telephone', value: ben.phone },
            ben.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: ben.address },
            ben.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: ben.blood_type },
            ben.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: ben.medical_conditions },
            ben.allergies && { icon: 'ri-alert-line', label: 'Allergies', value: ben.allergies },
            ben.emergency_contact_name && { icon: 'ri-phone-line', label: 'Contact urgence', value: `${ben.emergency_contact_name} (${ben.emergency_contact_phone})` },
          ].filter(Boolean).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
              <i className={item.icon} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }} />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{item.label}</div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 500 }}>{item.value}</div></div>
            </div>
          ))}
        </div>

        {/* Guardians */}
        <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Gardiens ({guards.length})</div>
          {guards.map((g: any, i: number) => (
            <div key={g.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>{g.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.relationship || g.guardian_type} - {g.phone}</div>
              </div>
              {g.phone && <a href={`tel:${g.phone}`} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></a>}
            </div>
          ))}
        </div>

        {/* Assigned Intervenant */}
        {assignedIv && (
          <div style={{ ...G, padding: '16px', marginBottom: 12, borderColor: 'rgba(124,92,255,0.2)' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Intervenant assigne</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#A78BFA' }}>{(assignedIv.intervenant_name || 'I').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{assignedIv.intervenant_name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Statut : {assignedIv.status}</div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Chronologie</div>
          {timeline.map((ev: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < timeline.length - 1 ? 0 : 0 } as any}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 } as any}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: i === 0 ? sc : 'rgba(255,255,255,0.15)', flexShrink: 0 } as any} />
                {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' } as any} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 14 } as any}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{ev.detail || ev.event}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{ev.time ? new Date(ev.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {a.status === 'active' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
            <div onClick={async () => {
              try {
                await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT', body: JSON.stringify({ resolution_type: 'manual', notes: 'Resolue manuellement' }) }, token);
                load();
              } catch (e: any) { Alert.alert('Erreur', e.message); }
            }} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#10B981' } as any}>Cloturer l'alerte</div>
          </div>
        )}
      </div>
    </div>
  );
}
