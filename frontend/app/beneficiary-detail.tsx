import React, { useState, useEffect, useCallback, useRef } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NoraCard from '../src/components/shared/NoraCard';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const IMG_BRACELET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
const IMG_SCALE = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
const IMG_VEST = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';

export default function BeneficiaryDetailScreen() {
  const localParams = useLocalSearchParams<{ beneficiaryId: string | string[] }>();
  const globalParams = useGlobalSearchParams<{ beneficiaryId?: string | string[] }>();
  const webBeneficiaryId = (() => { try { if (typeof window !== 'undefined' && window.location?.search) return new URLSearchParams(window.location.search).get('beneficiaryId') || ''; if (typeof globalThis !== 'undefined' && (globalThis as any)?.location?.search) return new URLSearchParams((globalThis as any).location.search).get('beneficiaryId') || ''; } catch { return ''; } return ''; })();
  const normalizeBid = (v?: string) => (v || '').split('&')[0].split('#')[0].trim();
  const localBid = normalizeBid(Array.isArray(localParams?.beneficiaryId) ? localParams.beneficiaryId[0] : localParams?.beneficiaryId);
  const globalBid = normalizeBid(Array.isArray(globalParams?.beneficiaryId) ? globalParams.beneficiaryId[0] : globalParams?.beneficiaryId);
  const bid = localBid || globalBid || normalizeBid(webBeneficiaryId) || '';
  const { token, user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [devices, setDevices] = useState<any>(null);
  const [noraAnalysis, setNoraAnalysis] = useState('');
  const [subInfo, setSubInfo] = useState<any>(null);
  const [geoZones, setGeoZones] = useState<any[]>([]);
  const [geoLocation, setGeoLocation] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoBusyId, setGeoBusyId] = useState<string | null>(null);
  const [geoFormOpen, setGeoFormOpen] = useState(false);
  const [geoEditingId, setGeoEditingId] = useState<string | null>(null);
  const [geoFormName, setGeoFormName] = useState('');
  const [geoFormLat, setGeoFormLat] = useState('');
  const [geoFormLng, setGeoFormLng] = useState('');
  const [geoFormRadius, setGeoFormRadius] = useState('500');
  const [geoFormSaving, setGeoFormSaving] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any | null>(null);
  const [guardianPerms, setGuardianPerms] = useState<any>(null);
  const [expandedPerm, setExpandedPerm] = useState<string | null>(null);
  const [resolvedBid, setResolvedBid] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [showZoneHelp, setShowZoneHelp] = useState(false);
  /* slide-to-call */
  const [slideX, setSlideX] = useState(0);
  const [sliding, setSliding] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const slideStartX = useRef(0);
  const slideTrackW = useRef(0);

  useEffect(() => { if (typeof localStorage !== 'undefined') { const c = () => setIsDark(localStorage.getItem('chutex_dark') !== '0'); c(); const iv = setInterval(c, 400); return () => clearInterval(iv); } }, []);

  const activeBid = resolvedBid || bid;

  const fetchAll = useCallback(async () => {
    try {
      const bens = await apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []);
      const fb = Array.isArray(bens) && bens.length > 0 ? bens[0].id : '';
      const tb = bid || fb;
      if (!tb) { setData(null); setAlerts([]); setDevices(null); setGeoZones([]); setGeoLocation(null); setGeoLoading(false); setResolvedBid(''); return; }
      setResolvedBid(tb);
      const [alts, devs, geo] = await Promise.all([
        apiFetch(`/api/guardian/beneficiary/${tb}/alerts`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${tb}/devices`, {}, token).catch(() => null),
        apiFetch(`/api/guardian/beneficiary/${tb}/geofence`, {}, token).catch(() => null),
      ]);
      const ben = (bens || []).find((b: any) => b.id === tb) || (Array.isArray(bens) ? bens[0] : null) || null;
      setData(ben); setAlerts(Array.isArray(alts) ? alts : []); setDevices(devs);
      setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []); setGeoLocation(geo?.current_location || null); setGeoLoading(false);
      if (ben) {
        apiFetch(`/api/guardian/beneficiary/${tb}/ai-report`, {}, token).then((r: any) => setNoraAnalysis(r?.summary || r?.report || '')).catch(() => setNoraAnalysis(''));
        apiFetch(`/api/guardian/beneficiary/${tb}/subscription`, {}, token).then((r: any) => setSubInfo(r)).catch(() => {});
        if (user?.id) apiFetch(`/api/guardian-permissions/${user.id}/${tb}`, {}, token).then((p: any) => setGuardianPerms(p)).catch(() => {});
      }
    } catch { setGeoLoading(false); } finally { setLoading(false); }
  }, [bid, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (!activeBid) return; const iv = setInterval(async () => { try { const g = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, {}, token); setGeoZones(Array.isArray(g?.zones) ? g.zones : []); setGeoLocation(g?.current_location || null); } catch {} }, 25000); return () => clearInterval(iv); }, [activeBid, token]);

  if (loading) return <FullScreenLoader />;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>Beneficiaire non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <NativePageView path={`/beneficiary-detail?beneficiaryId=${activeBid || ''}`} />;

  const v = data.latest_vitals || {};
  const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'pending');
  const historyAlerts = alerts.filter((a: any) => a.status !== 'active' && a.status !== 'pending');
  const bracelet = devices?.bracelet || null; const scale = devices?.scale || null; const vest = devices?.vest || null;

  const C = isDark
    ? { text: '#FFF', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.28)', faint: 'rgba(255,255,255,0.15)', sep: 'rgba(255,255,255,0.07)', row: 'rgba(255,255,255,0.03)', toggleBg: 'rgba(255,255,255,0.08)', contentBg: 'linear-gradient(180deg, #0C0C14 0%, #1C1C24 100%)', border: 'rgba(255,255,255,0.07)', grey: 'rgba(255,255,255,0.05)' }
    : { text: '#111827', sub: 'rgba(0,0,0,0.5)', muted: 'rgba(0,0,0,0.28)', faint: 'rgba(0,0,0,0.08)', sep: 'rgba(0,0,0,0.06)', row: 'rgba(0,0,0,0.02)', toggleBg: 'rgba(0,0,0,0.06)', contentBg: '#FAFAFA', border: 'rgba(0,0,0,0.06)', grey: 'rgba(0,0,0,0.04)' };

  const guardiansList = Array.isArray(subInfo?.guardians) ? subInfo.guardians : [];
  const contract = subInfo?.contract || null;
  const nameParts = (data.name || '').trim().split(' ').filter(Boolean);
  const firstName = nameParts[0] || data.name || '-';
  const lastName = nameParts.slice(1).join(' ') || '-';
  const ageYears = data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / 31557600000) : null;
  const genderLabel = data.gender === 'male' ? 'Homme' : data.gender === 'female' ? 'Femme' : (data.gender || 'N/A');
  const profileWeight = data.weight_kg || null;

  const tensionVal = v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null;
  const healthVitals = [
    { label: 'Pouls', val: v.heart_rate || null, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444' },
    { label: 'SpO2', val: v.spo2 || null, unit: '%', icon: 'ri-drop-line', color: '#3B82F6' },
    { label: 'Tension', val: tensionVal, unit: 'mmHg', icon: 'ri-pulse-line', color: '#8B5CF6' },
    { label: 'Temperature', val: (v.temperature && v.temperature > 30) ? v.temperature : null, unit: '\u00b0C', icon: 'ri-temp-hot-line', color: '#F97316' },
  ];

  const activityMetrics = [
    { label: 'Pas', val: v.steps || null, unit: 'pas', icon: 'ri-footprint-line', color: '#10B981' },
    { label: 'Calories', val: v.calories || null, unit: 'kcal', icon: 'ri-fire-line', color: '#F59E0B' },
    { label: 'Distance', val: v.distance_km || (v.steps ? (v.steps * 0.0007).toFixed(1) : null), unit: 'km', icon: 'ri-route-line', color: '#3B82F6' },
  ].filter(m => m.val != null && m.val !== 0);

  const devList = [
    { label: 'Bracelet Elio', img: IMG_BRACELET, d: bracelet, type: 'bracelet' },
    { label: 'Balance Vita', img: IMG_SCALE, d: scale, type: 'scale' },
    { label: 'Gilet Elder', img: IMG_VEST, d: vest, type: 'vest' },
  ];

  const getGuardianContractDetails = (g: any) => { const cg = Array.isArray(contract?.guardians) ? contract.guardians : []; const n = (s: string) => (s || '').replace(/\D/g, ''); return cg.find((x: any) => n(x.phone || '') === n(g?.phone || '')) || null; };
  const getGuardianActivity = (g: any) => { const r = alerts.filter((a: any) => a?.resolved_by === g?.id || a?.acknowledged_by === g?.id || a?.assigned_to === g?.id); const l = r.sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0]; return { count: r.length, lastActionAt: l?.updated_at || l?.created_at || null, recentAlerts: r.slice(0, 4) }; };

  const refreshGeofences = async () => { if (!activeBid) return; try { const g = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, {}, token); setGeoZones(Array.isArray(g?.zones) ? g.zones : []); setGeoLocation(g?.current_location || null); } catch {} };
  const openCreateZonePopup = () => { if (geoLocation?.latitude == null || geoLocation?.longitude == null) return; setGeoEditingId(null); setGeoFormName(`Zone ${geoZones.length + 1}`); setGeoFormLat(String(geoLocation.latitude)); setGeoFormLng(String(geoLocation.longitude)); setGeoFormRadius('300'); setGeoFormOpen(true); };
  const startGeoEdit = (z: any) => { setGeoEditingId(z.id); setGeoFormName(z.name || 'Zone'); setGeoFormLat(String(z.latitude)); setGeoFormLng(String(z.longitude)); setGeoFormRadius(String(z.radius_m ?? z.radius_meters ?? 300)); setGeoFormOpen(true); };
  const saveGeoForm = async () => { if (!activeBid) return; const la = parseFloat(geoFormLat); const lo = parseFloat(geoFormLng); const ra = parseFloat(geoFormRadius); if (!geoFormName.trim() || Number.isNaN(la) || Number.isNaN(lo) || Number.isNaN(ra) || ra < 50) return; setGeoFormSaving(true); try { const p = { name: geoFormName.trim(), latitude: la, longitude: lo, radius_m: ra }; if (geoEditingId) { const u = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence/${geoEditingId}`, { method: 'PUT', body: JSON.stringify(p) }, token); setGeoZones(prev => prev.map((z: any) => z.id === geoEditingId ? u : z)); } else { const c = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, { method: 'POST', body: JSON.stringify(p) }, token); setGeoZones(prev => [c, ...prev]); } setGeoFormOpen(false); setGeoEditingId(null); await refreshGeofences(); } catch {} finally { setGeoFormSaving(false); } };
  const deleteGeoZone = async (zId: string) => { if (!activeBid) return; const ok = typeof window !== 'undefined' ? window.confirm('Supprimer cette zone ?') : true; if (!ok) return; setGeoBusyId(zId); try { await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence/${zId}`, { method: 'DELETE' }, token); setGeoZones(prev => prev.filter((z: any) => z.id !== zId)); } catch {} finally { setGeoBusyId(null); } };

  /* slide handlers */
  const THUMB = 48; const THRESHOLD = 0.75;
  const onSlideStart = (e: any) => {
    const el = slideRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    slideTrackW.current = rect.width - THUMB;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    slideStartX.current = clientX;
    setSliding(true);
    const move = (ev: any) => { const cx = ev.touches ? ev.touches[0].clientX : ev.clientX; const dx = Math.max(0, Math.min(cx - slideStartX.current, slideTrackW.current)); setSlideX(dx); };
    const end = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end);
      setSliding(false);
      if (slideX / slideTrackW.current >= THRESHOLD && data.phone) { window.open(`tel:${data.phone}`, '_self'); }
      setSlideX(0);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move); document.addEventListener('touchend', end);
  };
  const slideProgress = slideTrackW.current > 0 ? slideX / slideTrackW.current : 0;

  const SL = { fontSize: 11, fontWeight: 700 as const, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 1.2, padding: '20px 0 10px' };
  const rowS = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${C.sep}` } as any;
  const lbS = { fontSize: 12, color: C.sub, fontWeight: 500 as const };
  const vlS = { fontSize: 13, color: C.text, fontWeight: 600 as const, textAlign: 'right' as const };
  const greyCard = { padding: '14px 16px', borderRadius: 16, background: C.grey, border: `1px solid ${C.sep}` } as any;

  const hasGeo = geoLocation?.latitude != null && geoLocation?.longitude != null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <style>{`@keyframes bd-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes bd-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes bd-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}@keyframes bd-chevron{0%,100%{transform:translateX(0);opacity:.4}50%{transform:translateX(6px);opacity:1}}`}</style>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch', height: '100%' } as any}>

        {/* ══ HEADER ══ */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG_RED} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '18px 20px 44px' } as any}>
            <div data-testid="beneficiary-detail-back-button" onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 18 } as any}>
              <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', letterSpacing: -0.5, lineHeight: 1.15 }} data-testid="beneficiary-firstname-value">{firstName} <span data-testid="beneficiary-lastname-value">{lastName}</span></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginTop: 4 }}>Fiche beneficiaire</div>
            </div>
            {/* SLIDE TO CALL */}
            {data.phone && (
              <div ref={slideRef} data-testid="beneficiary-call-btn" style={{ position: 'relative', width: '100%', height: THUMB + 4, borderRadius: THUMB / 2 + 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' } as any}>
                {/* progress fill */}
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${slideX + THUMB}px`, borderRadius: THUMB / 2 + 2, background: `rgba(16,185,129,${0.15 + slideProgress * 0.5})`, transition: sliding ? 'none' : 'width 0.3s ease, background 0.3s ease' } as any} />
                {/* label */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 1 - slideProgress * 1.5, transition: sliding ? 'none' : 'opacity 0.3s' } as any}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 }}>Glisser pour appeler {firstName}</span>
                  <i className="ri-arrow-right-double-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', animation: 'bd-chevron 1.5s ease-in-out infinite' }} />
                </div>
                {/* thumb */}
                <div onMouseDown={onSlideStart} onTouchStart={onSlideStart} style={{ position: 'absolute', top: 2, left: 2 + slideX, width: THUMB, height: THUMB, borderRadius: THUMB / 2, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', cursor: 'grab', transition: sliding ? 'none' : 'left 0.3s ease', zIndex: 2 } as any}>
                  <i className="ri-phone-fill" style={{ fontSize: 20, color: '#10B981' }} />
                </div>
                {/* end state */}
                {slideProgress >= THRESHOLD && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.35)', borderRadius: THUMB / 2 + 2 } as any}><span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Appel en cours...</span></div>}
              </div>
            )}
            {/* Alert */}
            {activeAlerts.length > 0 && (
              <div data-testid="beneficiary-active-alert-card" onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: activeAlerts[0].id } })} style={{ marginTop: 12, padding: '11px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, animation: 'bd-pulse 2s ease-in-out infinite' } as any}>
                <i className="ri-alarm-warning-line" style={{ fontSize: 17, color: '#FFF' }} />
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Alerte en cours</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{activeAlerts[0].message || 'Intervention necessaire'}</div></div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
              </div>
            )}
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ padding: '0 20px 120px', marginTop: -16, borderRadius: '22px 22px 0 0', background: C.contentBg, position: 'relative', zIndex: 10, borderTop: `1px solid ${C.border}` } as any}>

          {/* ── 1. INFOS PERSONNELLES ── */}
          <div style={SL}>Informations personnelles</div>
          <div style={rowS}><span style={lbS}>Prenom</span><span style={vlS}>{firstName}</span></div>
          <div style={rowS}><span style={lbS}>Nom</span><span style={vlS}>{lastName}</span></div>
          {ageYears && <div style={rowS}><span style={lbS}>Age</span><span style={vlS}>{ageYears} ans</span></div>}
          <div style={rowS}><span style={lbS}>Genre</span><span style={vlS}>{genderLabel}</span></div>
          {data.date_of_birth && <div style={rowS}><span style={lbS}>Date de naissance</span><span style={vlS}>{new Date(data.date_of_birth).toLocaleDateString('fr-FR')}</span></div>}
          {data.phone && <div style={rowS}><span style={lbS}>Telephone</span><span style={vlS}>{data.phone}</span></div>}
          <div style={{ ...rowS, flexDirection: 'column', alignItems: 'flex-start', gap: 2 } as any}><span style={lbS}>Adresse</span><span data-testid="beneficiary-profile-address-value" style={{ fontSize: 13, color: C.text, fontWeight: 600, marginTop: 2 }}>{data.address || '-'}{(data.postal_code || data.city) ? `, ${[data.postal_code, data.city].filter(Boolean).join(' ')}` : ''}</span></div>
          {data.height_cm && <div style={rowS}><span style={lbS}>Taille</span><span data-testid="beneficiary-profile-height-value" style={vlS}>{data.height_cm} cm</span></div>}
          {profileWeight && <div style={rowS}><span style={lbS}>Poids</span><span data-testid="beneficiary-profile-weight-value" style={vlS}>{profileWeight} kg</span></div>}
          {data.height_cm && profileWeight && <div style={rowS}><span style={lbS}>IMC</span><span style={vlS}>{(profileWeight / Math.pow(data.height_cm / 100, 2)).toFixed(1)}</span></div>}

          {/* ── 2. DOSSIER MEDICAL ── */}
          <div style={SL}>Dossier medical</div>
          <div style={rowS}><span style={lbS}>Groupe sanguin</span><span style={vlS}>{data.blood_type || '--'}</span></div>
          <div style={{ ...rowS, flexDirection: 'column', alignItems: 'flex-start', gap: 2 } as any}><span style={lbS}>Pathologies</span><span style={{ fontSize: 13, color: C.text, fontWeight: 600, marginTop: 2 }}>{data.medical_conditions || 'Aucune'}</span></div>
          <div style={{ ...rowS, flexDirection: 'column', alignItems: 'flex-start', gap: 2 } as any}><span style={lbS}>Allergies</span><span style={{ fontSize: 13, color: C.text, fontWeight: 600, marginTop: 2 }}>{data.allergies || 'Aucune'}</span></div>

          {/* ── 3. DONNEES DE SANTE (4 vitales) ── */}
          <div style={SL}>Donnees de sante</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.sep}`, marginBottom: 12 } as any}>
            {healthVitals.map((m, i) => (
              <div key={i} data-testid={`beneficiary-vital-card-${m.label.toLowerCase().replace(/\s+/g, '-')}`} style={{ padding: '16px 14px', background: C.row, borderRight: i % 2 === 0 ? `1px solid ${C.sep}` : 'none', borderBottom: i < 2 ? `1px solid ${C.sep}` : 'none' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                  <i className={m.icon} style={{ fontSize: 14, color: m.color }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: m.val != null ? C.text : C.faint, lineHeight: 1, letterSpacing: -1 }}>{m.val != null ? m.val : '--'}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{m.unit}</div>
              </div>
            ))}
          </div>

          {/* Nora */}
          {noraAnalysis && <div style={{ marginBottom: 12 } as any}><NoraCard title="Analyse de Nora" text={noraAnalysis} /></div>}

          {/* ── 4. ACTIVITE PHYSIQUE ── */}
          {activityMetrics.length > 0 && (<>
            <div style={SL}>Activite physique</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activityMetrics.length}, 1fr)`, gap: 1, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.sep}`, marginBottom: 12 } as any}>
              {activityMetrics.map((m, i) => (
                <div key={i} data-testid={`beneficiary-activity-card-${m.label.toLowerCase()}`} style={{ padding: '14px 10px', background: C.row, textAlign: 'center', borderRight: i < activityMetrics.length - 1 ? `1px solid ${C.sep}` : 'none' } as any}>
                  <i className={m.icon} style={{ fontSize: 16, color: m.color, marginBottom: 6, display: 'block' }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 3, fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* CTA: voir page sante — NOIR + icone ADN blanc */}
          <div data-testid="view-health-page-btn" onClick={() => router.push({ pathname: '/health-readonly' as any, params: { beneficiaryId: activeBid } })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 0', borderRadius: 14, background: isDark ? '#FFF' : '#111', cursor: 'pointer', marginBottom: 4, transition: 'opacity 0.15s' } as any}
            onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.85'} onMouseLeave={(e: any) => e.currentTarget.style.opacity = '1'}>
            <i className="ri-dna-line" style={{ fontSize: 18, color: isDark ? '#111' : '#FFF' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#111' : '#FFF', letterSpacing: 0.2 }}>Voir la page sante</span>
          </div>

          {/* ── 5. DISPOSITIFS ── */}
          <div style={SL}>Dispositifs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.sep}`, marginBottom: 4 } as any}>
            {devList.map((dev, i) => {
              const isV = dev.type === 'vest'; const vA = isV && dev.d?.last_sync && (Date.now() - new Date(dev.d.last_sync).getTime()) < 30000;
              const sL = !dev.d ? 'Non associe' : isV ? (vA ? 'Actif' : 'Veille') : (dev.d?.connected ? 'OK' : 'Off');
              const sC = !dev.d ? '#6B7280' : isV ? (vA ? '#10B981' : '#F59E0B') : (dev.d?.connected ? '#10B981' : '#6B7280');
              const bat = dev.d?.battery_level ?? 0;
              return (<div key={i} data-testid={`beneficiary-device-card-${dev.type}`} style={{ padding: '16px 8px 14px', background: C.row, textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.sep}` : 'none' } as any}>
                <img src={dev.img} alt="" style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto 6px', display: 'block', opacity: dev.d ? 1 : 0.2 } as any} />
                <div style={{ fontSize: 10, fontWeight: 600, color: C.text, marginBottom: 4 }}>{dev.label}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 } as any}><span style={{ width: 5, height: 5, borderRadius: 99, background: sC } as any} /><span style={{ fontSize: 9, fontWeight: 600, color: sC }}>{sL}</span></div>
                {bat > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: bat > 30 ? '#10B981' : '#EF4444', marginTop: 3 }}>{bat}%</div>}
              </div>);
            })}
          </div>

          {/* ── 6. PREFERENCES ── */}
          {guardianPerms && (<>
            <div style={SL}>Mes preferences</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>Notifications pour {firstName}.</div>
            {[
              { key: 'guardian_alerts_enabled', icon: 'ri-alarm-warning-line', label: 'Alertes' },
              { key: 'guardian_health_enabled', icon: 'ri-heart-pulse-line', label: 'Donnees de sante' },
              { key: 'guardian_location_accepted', icon: 'ri-map-pin-line', label: 'Localisation' },
            ].map((pf, pi) => (
              <div key={pf.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: pi < 2 ? `1px solid ${C.sep}` : 'none' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={pf.icon} style={{ fontSize: 15, color: (guardianPerms as any)[pf.key] ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pf.label}</span></div>
                <div onClick={() => { const n = !(guardianPerms as any)[pf.key]; setGuardianPerms((p: any) => ({ ...p, [pf.key]: n })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [pf.key]: n }) }, token).catch(() => {}); }} style={{ width: 44, height: 24, borderRadius: 12, background: (guardianPerms as any)[pf.key] ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#FFF', position: 'absolute', top: 3, left: (guardianPerms as any)[pf.key] ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' } as any} /></div>
              </div>
            ))}
            {guardianPerms.guardian_alerts_enabled && guardianPerms.alerts_enabled && (<>
              <div onClick={() => setExpandedPerm(expandedPerm === 'alerts' ? null : 'alerts')} style={{ fontSize: 11, color: C.sub, fontWeight: 600, cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className={expandedPerm === 'alerts' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 14 }} />{expandedPerm === 'alerts' ? 'Masquer' : 'Personnaliser les alertes'}</div>
              {expandedPerm === 'alerts' && <div>{Object.entries(guardianPerms.guardian_alert_types || {}).map(([k, val]: [string, any]) => { const lbl: Record<string, string> = { fall: 'Chute', heart_rate: 'Freq. cardiaque', inactivity: 'Inactivite', sos_manual: 'SOS', temperature: 'Temperature', spo2: 'SpO2', blood_pressure: 'Tension', weight: 'Poids', pulse: 'Pouls' }; const bg = guardianPerms.alert_types?.[k]; return (<div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.sep}` } as any}><span style={{ flex: 1, fontSize: 12, color: bg ? C.text : C.muted, fontWeight: 500 }}>{lbl[k] || k}{!bg ? ' (non partage)' : ''}</span><div onClick={() => { if (!bg) return; const n2 = { ...guardianPerms.guardian_alert_types, [k]: !val }; setGuardianPerms((p: any) => ({ ...p, guardian_alert_types: n2 })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_alert_types: n2 }) }, token).catch(() => {}); }} style={{ width: 36, height: 20, borderRadius: 10, background: (val && bg) ? '#10B981' : C.toggleBg, cursor: bg ? 'pointer' : 'default', position: 'relative', transition: 'background 0.2s', opacity: bg ? 1 : 0.3 } as any}><div style={{ width: 14, height: 14, borderRadius: 7, background: '#FFF', position: 'absolute', top: 3, left: (val && bg) ? 19 : 3, transition: 'left 0.2s' } as any} /></div></div>); })}</div>}
            </>)}
          </>)}

          {/* ── 7. GARDIENS — grey card ── */}
          <div style={SL}>Gardiens ({guardiansList.length})</div>
          <div style={{ ...greyCard, padding: 0, overflow: 'hidden' }}>
            {guardiansList.length > 0 ? guardiansList.map((g: any, i: number) => (
              <div key={g.id || i} data-testid={`beneficiary-guardian-card-${g.id || i}`} onClick={() => setSelectedGuardian(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < guardiansList.length - 1 ? `1px solid ${C.sep}` : 'none', cursor: 'pointer', transition: 'opacity 0.15s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e: any) => e.currentTarget.style.opacity = '1'}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{g.name?.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{g.name}</div><div style={{ fontSize: 10, color: C.sub, marginTop: 1 }}>{g.relationship || g.guardian_type || 'Gardien'}{g.phone ? ` \u00b7 ${g.phone}` : ''}</div></div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: C.muted }} />
              </div>
            )) : <div data-testid="beneficiary-guardians-empty" style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: C.sub }}>Aucun gardien associe</div>}
          </div>

          {/* Historique — grey card */}
          {historyAlerts.length > 0 && (<>
            <div style={SL}>Historique ({historyAlerts.length})</div>
            <div style={{ ...greyCard, padding: 0, overflow: 'hidden' }}>
              {historyAlerts.slice(0, 6).map((al: any, i: number) => (
                <div key={al.id} onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: al.id } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < Math.min(historyAlerts.length, 6) - 1 ? `1px solid ${C.sep}` : 'none', cursor: 'pointer' } as any}>
                  <i className={al.status === 'resolved' ? 'ri-checkbox-circle-line' : 'ri-alarm-warning-line'} style={{ fontSize: 14, color: al.status === 'resolved' ? '#10B981' : '#F59E0B', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 } as any}><div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{al.message || al.alert_type}</div></div>
                  <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{new Date(al.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
              ))}
            </div>
          </>)}

          {/* ── 8. ZONES DE SECURITE — refonte complete ── */}
          <div style={{ ...SL, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <span>Zones de securite</span>
            <div data-testid="zone-help-btn" onClick={() => setShowZoneHelp(true)} style={{ width: 20, height: 20, borderRadius: 10, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-question-line" style={{ fontSize: 11, color: C.muted }} /></div>
          </div>

          {/* explainer */}
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6, marginBottom: 14 }}>
            Les zones sont centrees sur la position actuelle de {firstName}. Pour creer une zone autour du domicile, activez-la lorsque {firstName} s'y trouve. Vous serez alerte si {firstName} sort du perimetre.
          </div>

          {/* map — large + prominent */}
          <div data-testid="beneficiary-safezone-map" style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.sep}`, marginBottom: 14, minHeight: 200, background: C.grey } as any}>
            {hasGeo ? <iframe title="map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(geoLocation.longitude) - 0.01},${Number(geoLocation.latitude) - 0.01},${Number(geoLocation.longitude) + 0.01},${Number(geoLocation.latitude) + 0.01}&layer=mapnik&marker=${Number(geoLocation.latitude)},${Number(geoLocation.longitude)}`} style={{ width: '100%', height: 200, border: 'none' } as any} /> : <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, gap: 8 } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 28 }} /><div style={{ fontSize: 12, fontWeight: 500 }} data-testid="beneficiary-safezone-map-empty">Position non disponible</div><div style={{ fontSize: 11, color: C.faint }}>Le bracelet doit etre connecte pour localiser {firstName}</div></div>}
          </div>

          {/* position info */}
          {hasGeo && <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 } as any} data-testid="beneficiary-safezone-location-value"><i className="ri-map-pin-2-line" style={{ fontSize: 13 }} />{Number(geoLocation.latitude).toFixed(4)}, {Number(geoLocation.longitude).toFixed(4)}{geoLocation?.updated_at && <span style={{ color: C.faint }}> \u00b7 {new Date(geoLocation.updated_at).toLocaleString('fr-FR')}</span>}</div>}

          {/* zones list */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
            <span data-testid="beneficiary-safezone-count" style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{geoLoading ? 'Chargement...' : geoZones.length === 0 ? 'Aucune zone definie' : `${geoZones.length} zone${geoZones.length > 1 ? 's' : ''} active${geoZones.length > 1 ? 's' : ''}`}</span>
          </div>

          {geoZones.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 } as any}>
              {geoZones.map((zone: any) => (
                <div key={zone.id} data-testid={`beneficiary-safezone-row-${zone.id}`} style={{ ...greyCard, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-check-line" style={{ fontSize: 18, color: '#10B981' }} /></div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{zone.name}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Rayon : {Math.round(Number(zone.radius_m || 0))}m</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 } as any}>
                    <div data-testid={`beneficiary-safezone-edit-btn-${zone.id}`} onClick={() => startGeoEdit(zone)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-edit-line" style={{ fontSize: 14, color: C.sub }} /></div>
                    <div data-testid={`beneficiary-safezone-delete-btn-${zone.id}`} onClick={() => deleteGeoZone(zone.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: geoBusyId === zone.id ? 'wait' : 'pointer', opacity: geoBusyId === zone.id ? 0.5 : 1 } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#EF4444' }} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* add zone CTA */}
          <div data-testid="beneficiary-safezone-open-create-popup-btn" onClick={openCreateZonePopup} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 14, border: `1.5px dashed ${hasGeo ? 'rgba(16,185,129,0.4)' : C.sep}`, cursor: hasGeo ? 'pointer' : 'not-allowed', opacity: hasGeo ? 1 : 0.4, transition: 'background 0.15s' } as any}
            onMouseEnter={(e: any) => { if (hasGeo) e.currentTarget.style.background = 'rgba(16,185,129,0.04)'; }} onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}>
            <i className="ri-add-circle-line" style={{ fontSize: 18, color: hasGeo ? '#10B981' : C.muted }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: hasGeo ? '#10B981' : C.muted }}>Ajouter une zone de securite</span>
          </div>
          {!hasGeo && <div style={{ fontSize: 11, color: C.faint, textAlign: 'center', marginTop: 6 }}>Localisation requise pour creer une zone</div>}

        </div>
      </div>

      {/* ══ MODALS ══ */}

      {/* zone help — elements directly on blurred backdrop */}
      {showZoneHelp && (
        <div data-testid="zone-help-modal" onClick={() => setShowZoneHelp(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, animation: 'bd-pop 220ms ease both' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 } as any}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-shield-check-line" style={{ fontSize: 20, color: '#10B981' }} /></div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Comment ca marche ?</div>
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>La zone est centree sur la position actuelle de votre proche. Pour proteger un lieu (domicile, parc...), creez la zone lorsque votre proche s'y trouve.</div>

            {[
              { icon: 'ri-crosshair-2-line', c: '#3B82F6', t: 'Position actuelle', d: 'La zone se cree autour de la ou se trouve votre proche en ce moment.' },
              { icon: 'ri-notification-3-line', c: '#F59E0B', t: 'Alertes automatiques', d: 'Vous etes prevenu immediatement si votre proche sort du perimetre.' },
              { icon: 'ri-settings-4-line', c: '#10B981', t: 'Rayon ajustable', d: 'Adaptez la taille selon le lieu : 300m a 2km recommande.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none' } as any}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${item.c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}><i className={item.icon} style={{ fontSize: 14, color: item.c }} /></div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}><strong style={{ color: '#FFF', fontWeight: 700 }}>{item.t}</strong> — {item.d}</div>
              </div>
            ))}

            <div data-testid="zone-help-close-btn" onClick={() => setShowZoneHelp(false)} style={{ width: '100%', padding: '13px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 20, transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'} onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>Compris</div>
          </div>
        </div>
      )}

      {/* guardian modal */}
      {selectedGuardian && (() => {
        const activity = getGuardianActivity(selectedGuardian); const extra = getGuardianContractDetails(selectedGuardian);
        const gN = selectedGuardian.name || ''; const gI = gN.split(' ').map((w: string) => w.charAt(0)).join('').toUpperCase().slice(0, 2);
        const gP = selectedGuardian.phone || extra?.phone || ''; const gE = extra?.email || selectedGuardian.email || '';
        const gA = [extra?.address, extra?.postal_code, extra?.city].filter(Boolean).join(', ');
        const gR = selectedGuardian.relationship || selectedGuardian.guardian_type || 'Gardien';
        return (
          <div data-testid="guardian-detail-modal" onClick={() => setSelectedGuardian(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1190, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)', overflowY: 'auto', animation: 'bd-fade 200ms ease' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 } as any}><div data-testid="guardian-detail-close-btn" onClick={() => setSelectedGuardian(null)} style={{ width: 34, height: 34, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: C.sub }} /></div></div>
              <div style={{ borderRadius: 18, background: isDark ? 'rgba(30,30,38,0.95)' : 'rgba(255,255,255,0.97)', border: `1px solid ${C.border}`, padding: '24px 20px', animation: 'bd-pop 220ms ease both' } as any}>
                <div style={{ textAlign: 'center', marginBottom: 16 } as any}><div style={{ width: 52, height: 52, borderRadius: 14, background: C.row, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' } as any}><span style={{ fontSize: 19, fontWeight: 800, color: C.text }}>{gI}</span></div><div data-testid="guardian-detail-name" style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 4 }}>{gN}</div><div data-testid="guardian-detail-role" style={{ fontSize: 12, color: C.sub }}>{gR}</div></div>
                {gP && <div data-testid="guardian-detail-phone" style={rowS}><span style={lbS}>Telephone</span><span style={vlS}>{gP}</span></div>}
                {gE && <div data-testid="guardian-detail-email" style={{ ...rowS, cursor: 'pointer' }} onClick={() => window.open(`mailto:${gE}`, '_blank')}><span style={lbS}>Email</span><span style={vlS}>{gE}</span></div>}
                {gA && <div data-testid="guardian-detail-address" style={{ ...rowS, flexDirection: 'column', alignItems: 'flex-start', gap: 2 } as any}><span style={lbS}>Adresse</span><span style={{ fontSize: 13, color: C.text, fontWeight: 600, marginTop: 2 }}>{gA}</span></div>}
                <div data-testid="guardian-detail-type" style={rowS}><span style={lbS}>Type</span><span style={vlS}>{selectedGuardian.guardian_type === 'saad' ? 'SAAD' : selectedGuardian.guardian_type === 'company' ? 'Entreprise' : 'Particulier'}</span></div>
                <div style={{ display: 'flex', gap: 8, margin: '16px 0 14px' } as any}>
                  {gP && <div data-testid="guardian-call-btn" onClick={() => window.open(`tel:${gP}`, '_self')} style={{ flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#10B981' } as any}><i className="ri-phone-fill" style={{ fontSize: 14 }} />Appeler</div>}
                  {gP && <div data-testid="guardian-sms-btn" onClick={() => window.open(`sms:${gP}`, '_self')} style={{ flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.text } as any}><i className="ri-message-3-line" style={{ fontSize: 14 }} />SMS</div>}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Activite</div>
                <div style={rowS}><span style={lbS}>Actions</span><span data-testid="guardian-detail-activity-count" style={vlS}>{activity.count}</span></div>
                <div style={rowS}><span style={lbS}>Derniere</span><span data-testid="guardian-detail-last-action" style={vlS}>{activity.lastActionAt ? new Date(activity.lastActionAt).toLocaleString('fr-FR') : 'Aucune'}</span></div>
                {activity.recentAlerts.length > 0 ? activity.recentAlerts.map((a: any) => (<div key={a.id} data-testid={`guardian-detail-activity-item-${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', borderBottom: `1px solid ${C.sep}` } as any}><div style={{ width: 4, height: 4, borderRadius: 2, background: C.muted, flexShrink: 0 } as any} /><span style={{ fontSize: 11, color: C.sub, flex: 1 }}>{a.message || a.alert_type}</span><span style={{ fontSize: 9, color: C.muted }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>)) : <div data-testid="guardian-detail-activity-empty" style={{ fontSize: 11, color: C.faint, padding: '8px 0' }}>Aucune action</div>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* safe zone form — elements directly on blurred backdrop */}
      {geoFormOpen && (
        <div data-testid="safezone-form-modal" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, animation: 'bd-pop 220ms ease both' } as any}>
            {/* close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 } as any}>
              <div data-testid="safezone-form-close-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /></div>
            </div>
            {/* title */}
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }} data-testid="safezone-form-modal-title">{geoEditingId ? 'Modifier la zone' : 'Nouvelle zone de securite'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, lineHeight: 1.5 }} data-testid="safezone-form-center-info">Centree sur la position actuelle de {firstName}.</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 24, lineHeight: 1.5 }}>Pour proteger un lieu precis, assurez-vous que {firstName} s'y trouve avant de creer la zone.</div>
            {/* name */}
            <div style={{ marginBottom: 16 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Nom de la zone</div>
              <input data-testid="safezone-form-name-input" value={geoFormName} onChange={(e: any) => setGeoFormName(e.target.value)} placeholder="Ex: Domicile, Parc..." style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontWeight: 500 } as any} />
            </div>
            {/* radius */}
            <div style={{ marginBottom: 28 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Rayon du perimetre (metres)</div>
              <input data-testid="safezone-form-radius-input" value={geoFormRadius} onChange={(e: any) => setGeoFormRadius(e.target.value)} placeholder="300" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontWeight: 500 } as any} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Recommande : 300m a 2000m selon les habitudes</div>
            </div>
            {/* actions */}
            <div style={{ display: 'flex', gap: 10 } as any}>
              <div data-testid="safezone-form-cancel-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ flex: 1, padding: '13px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', transition: 'background 0.15s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}>Annuler</div>
              <div data-testid="safezone-form-save-btn" onClick={saveGeoForm} style={{ flex: 1, padding: '13px', borderRadius: 14, cursor: geoFormSaving ? 'wait' : 'pointer', textAlign: 'center', background: '#FFF', fontSize: 14, fontWeight: 700, color: '#111', opacity: geoFormSaving ? 0.6 : 1, transition: 'opacity 0.15s' } as any}>{geoFormSaving ? '...' : (geoEditingId ? 'Enregistrer' : 'Creer la zone')}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
