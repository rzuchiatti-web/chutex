import React, { useState, useEffect, useCallback } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NoraCard from '../src/components/shared/NoraCard';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const IMG_BRACELET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
const IMG_SCALE = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
const IMG_VEST = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';

export default function BeneficiaryDetailScreen() {
  const localParams = useLocalSearchParams<{ beneficiaryId: string | string[] }>();
  const globalParams = useGlobalSearchParams<{ beneficiaryId?: string | string[] }>();
  const webBeneficiaryId = (() => {
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        return new URLSearchParams(window.location.search).get('beneficiaryId') || '';
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any)?.location?.search) {
        return new URLSearchParams((globalThis as any).location.search).get('beneficiaryId') || '';
      }
    } catch { return ''; }
    return '';
  })();
  const normalizeBid = (value?: string) => (value || '').split('&')[0].split('#')[0].trim();
  const localBeneficiaryIdRaw = Array.isArray(localParams?.beneficiaryId) ? localParams.beneficiaryId[0] : localParams?.beneficiaryId;
  const globalBeneficiaryIdRaw = Array.isArray(globalParams?.beneficiaryId) ? globalParams.beneficiaryId[0] : globalParams?.beneficiaryId;
  const localBeneficiaryId = normalizeBid(localBeneficiaryIdRaw);
  const globalBeneficiaryId = normalizeBid(globalBeneficiaryIdRaw);
  const bid = localBeneficiaryId || globalBeneficiaryId || normalizeBid(webBeneficiaryId) || '';
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

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const check = () => setIsDark(localStorage.getItem('chutex_dark') !== '0');
      check();
      const iv = setInterval(check, 400);
      return () => clearInterval(iv);
    }
  }, []);

  const activeBid = resolvedBid || bid;

  const fetchAll = useCallback(async () => {
    try {
      const bens = await apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []);
      const fallbackBid = Array.isArray(bens) && bens.length > 0 ? bens[0].id : '';
      const targetBid = bid || fallbackBid;
      if (!targetBid) {
        setData(null); setAlerts([]); setDevices(null); setGeoZones([]); setGeoLocation(null); setGeoLoading(false); setResolvedBid('');
        return;
      }
      setResolvedBid(targetBid);
      const [alts, devs, geo] = await Promise.all([
        apiFetch(`/api/guardian/beneficiary/${targetBid}/alerts`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${targetBid}/devices`, {}, token).catch(() => null),
        apiFetch(`/api/guardian/beneficiary/${targetBid}/geofence`, {}, token).catch(() => null),
      ]);
      const ben = (bens || []).find((b: any) => b.id === targetBid) || (Array.isArray(bens) ? bens[0] : null) || null;
      setData(ben); setAlerts(Array.isArray(alts) ? alts : []); setDevices(devs);
      setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []); setGeoLocation(geo?.current_location || null); setGeoLoading(false);
      if (ben) {
        apiFetch(`/api/guardian/beneficiary/${targetBid}/ai-report`, {}, token).then((r: any) => setNoraAnalysis(r?.summary || r?.report || '')).catch(() => setNoraAnalysis(''));
        apiFetch(`/api/guardian/beneficiary/${targetBid}/subscription`, {}, token).then((r: any) => setSubInfo(r)).catch(() => {});
        if (user?.id) { apiFetch(`/api/guardian-permissions/${user.id}/${targetBid}`, {}, token).then((p: any) => setGuardianPerms(p)).catch(() => {}); }
      }
    } catch { setGeoLoading(false); } finally { setLoading(false); }
  }, [bid, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!activeBid) return;
    const interval = setInterval(async () => {
      try {
        const geo = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, {}, token);
        setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []); setGeoLocation(geo?.current_location || null);
      } catch {}
    }, 25000);
    return () => clearInterval(interval);
  }, [activeBid, token]);

  if (loading) return <FullScreenLoader />;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>Beneficiaire non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <NativePageView path={`/beneficiary-detail?beneficiaryId=${activeBid || ''}`} />;

  const v = data.latest_vitals || {};
  const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'pending');
  const historyAlerts = alerts.filter((a: any) => a.status !== 'active' && a.status !== 'pending');
  const bracelet = devices?.bracelet || null;
  const scale = devices?.scale || null;
  const vest = devices?.vest || null;

  const C = isDark
    ? { bg: '#0A0A12', card: 'rgba(255,255,255,0.04)', text: '#FFF', sub: 'rgba(255,255,255,0.45)', muted: 'rgba(255,255,255,0.3)', faint: 'rgba(255,255,255,0.35)', sep: 'rgba(255,255,255,0.07)', sepLight: 'rgba(255,255,255,0.05)', cellBg: 'rgba(255,255,255,0.03)', label: 'rgba(255,255,255,0.25)', toggleBg: 'rgba(255,255,255,0.08)', hoverBg: 'rgba(255,255,255,0.06)' }
    : { bg: '#F2F2F7', card: 'rgba(0,0,0,0.025)', text: '#1A1A2E', sub: 'rgba(0,0,0,0.45)', muted: 'rgba(0,0,0,0.3)', faint: 'rgba(0,0,0,0.35)', sep: 'rgba(0,0,0,0.06)', sepLight: 'rgba(0,0,0,0.04)', cellBg: 'rgba(0,0,0,0.02)', label: 'rgba(0,0,0,0.25)', toggleBg: 'rgba(0,0,0,0.06)', hoverBg: 'rgba(0,0,0,0.04)' };

  const metrics = [
    { label: 'Freq. cardiaque', val: v.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444' },
    { label: 'SpO2', val: v.spo2, unit: '%', icon: 'ri-drop-line', color: '#60A5FA' },
    { label: 'Tension', val: v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null, unit: 'mmHg', icon: 'ri-pulse-line', color: '#A78BFA' },
    { label: 'Temperature', val: v.temperature && v.temperature > 30 ? v.temperature : null, unit: '\u00b0C', icon: 'ri-temp-hot-line', color: '#FB923C' },
    { label: 'Pas', val: v.steps, unit: 'pas', icon: 'ri-footprint-line', color: '#10B981' },
    { label: 'Calories', val: v.calories, unit: 'kcal', icon: 'ri-fire-line', color: '#F59E0B' },
    { label: 'Stress', val: v.stress_level, unit: '/100', icon: 'ri-mental-health-line', color: '#A78BFA' },
    { label: 'Recuperation', val: v.recovery_score, unit: '/100', icon: 'ri-heart-add-line', color: '#22D3EE' },
    { label: 'HRV', val: v.hrv, unit: 'ms', icon: 'ri-rhythm-line', color: '#818CF8' },
    { label: 'Poids', val: v.weight, unit: 'kg', icon: 'ri-scales-3-line', color: '#3B82F6' },
    { label: 'Sommeil', val: v.sleep_quality, unit: '%', icon: 'ri-moon-line', color: '#A78BFA' },
  ].filter(m => m.val && m.val !== 0);

  const guardiansList = Array.isArray(subInfo?.guardians) ? subInfo.guardians : [];
  const contract = subInfo?.contract || null;
  const nameParts = (data.name || '').trim().split(' ').filter(Boolean);
  const firstName = nameParts[0] || data.name || '-';
  const lastName = nameParts.slice(1).join(' ') || '-';
  const ageYears = data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / 31557600000) : null;
  const genderLabel = data.gender === 'male' ? 'Homme' : data.gender === 'female' ? 'Femme' : (data.gender || 'N/A');
  const profileWeight = data.weight_kg || null;

  const devList = [
    { label: 'Bracelet Elio', img: IMG_BRACELET, d: bracelet, type: 'bracelet' },
    { label: 'Balance Vita', img: IMG_SCALE, d: scale, type: 'scale' },
    { label: 'Gilet Elder', img: IMG_VEST, d: vest, type: 'vest' },
  ];

  const getGuardianContractDetails = (guardian: any) => {
    const contractGuardians = Array.isArray(contract?.guardians) ? contract.guardians : [];
    const normalize = (value: string) => (value || '').replace(/\D/g, '');
    return contractGuardians.find((g: any) => normalize(g.phone || '') === normalize(guardian?.phone || '')) || null;
  };

  const getGuardianActivity = (guardian: any) => {
    const related = alerts.filter((a: any) => a?.resolved_by === guardian?.id || a?.acknowledged_by === guardian?.id || a?.assigned_to === guardian?.id);
    const latest = related.sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0];
    return { count: related.length, lastActionAt: latest?.updated_at || latest?.created_at || null, recentAlerts: related.slice(0, 4) };
  };

  const refreshGeofences = async () => {
    if (!activeBid) return;
    try { const geo = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, {}, token); setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []); setGeoLocation(geo?.current_location || null); } catch {}
  };

  const openCreateZonePopup = () => {
    if (geoLocation?.latitude == null || geoLocation?.longitude == null) return;
    setGeoEditingId(null); setGeoFormName(`Zone ${geoZones.length + 1}`); setGeoFormLat(String(geoLocation.latitude)); setGeoFormLng(String(geoLocation.longitude)); setGeoFormRadius('300'); setGeoFormOpen(true);
  };

  const startGeoEdit = (zone: any) => {
    setGeoEditingId(zone.id); setGeoFormName(zone.name || 'Zone'); setGeoFormLat(String(zone.latitude)); setGeoFormLng(String(zone.longitude)); setGeoFormRadius(String(zone.radius_m ?? zone.radius_meters ?? 300)); setGeoFormOpen(true);
  };

  const saveGeoForm = async () => {
    if (!activeBid) return;
    const latitude = parseFloat(geoFormLat); const longitude = parseFloat(geoFormLng); const radius_m = parseFloat(geoFormRadius);
    if (!geoFormName.trim() || Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radius_m) || radius_m < 50) return;
    setGeoFormSaving(true);
    try {
      const payload = { name: geoFormName.trim(), latitude, longitude, radius_m };
      if (geoEditingId) { const updated = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence/${geoEditingId}`, { method: 'PUT', body: JSON.stringify(payload) }, token); setGeoZones(prev => prev.map((z: any) => z.id === geoEditingId ? updated : z)); }
      else { const created = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, { method: 'POST', body: JSON.stringify(payload) }, token); setGeoZones(prev => [created, ...prev]); }
      setGeoFormOpen(false); setGeoEditingId(null); await refreshGeofences();
    } catch {} finally { setGeoFormSaving(false); }
  };

  const deleteGeoZone = async (zoneId: string) => {
    if (!activeBid) return;
    const ok = typeof window !== 'undefined' ? window.confirm('Supprimer cette safe zone ?') : true;
    if (!ok) return;
    setGeoBusyId(zoneId);
    try { await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence/${zoneId}`, { method: 'DELETE' }, token); setGeoZones(prev => prev.filter((z: any) => z.id !== zoneId)); } catch {} finally { setGeoBusyId(null); }
  };

  /* ─────────────────── RENDER ─────────────────── */
  const SL = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10 };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: C.bg } as any}>
      {isDark && <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.35 } as any} />}
      {isDark && <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,18,0.72)', zIndex: 1 } as any} />}
      <style>{`@keyframes bd-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes bd-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes bd-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}`}</style>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: 480, margin: '0 auto', height: '100%' } as any}>

        {/* ── BACK ── */}
        <div style={{ padding: '16px 20px 0' } as any}>
          <div data-testid="beneficiary-detail-back-button" onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 18, color: C.text }} />
          </div>
        </div>

        {/* ── HERO ── */}
        <div style={{ textAlign: 'center', padding: '20px 20px 24px', animation: 'bd-fade 350ms ease both' } as any}>
          <div style={{ width: 68, height: 68, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: `2px solid ${C.sep}` } as any}>
            <span style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{firstName?.charAt(0)}{lastName?.charAt(0)}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 8 } as any} data-testid="beneficiary-firstname-value">{firstName} <span data-testid="beneficiary-lastname-value">{lastName}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 } as any}>
            {ageYears && <span style={{ padding: '3px 10px', borderRadius: 99, background: C.card, border: `1px solid ${C.sep}`, fontSize: 11, fontWeight: 600, color: C.sub }}>{ageYears} ans</span>}
            <span style={{ padding: '3px 10px', borderRadius: 99, background: C.card, border: `1px solid ${C.sep}`, fontSize: 11, fontWeight: 600, color: C.sub }}>{genderLabel}</span>
            {data.blood_type && <span style={{ padding: '3px 10px', borderRadius: 99, background: C.card, border: `1px solid ${C.sep}`, fontSize: 11, fontWeight: 600, color: C.sub }}>{data.blood_type}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' } as any}>
            {data.phone && <div data-testid="beneficiary-call-btn" onClick={() => window.open(`tel:${data.phone}`, '_self')} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-phone-fill" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Appeler</span></div>}
            <div data-testid="view-health-page-btn" onClick={() => router.push({ pathname: '/health-readonly' as any, params: { beneficiaryId: activeBid } })} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 14, color: C.sub }} /><span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Sante</span></div>
          </div>
        </div>

        {/* ── ALERT ── */}
        {activeAlerts.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 20 } as any}>
            <div data-testid="beneficiary-active-alert-card" onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: activeAlerts[0].id } })} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, animation: 'bd-pulse 2s ease-in-out infinite' } as any}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 17, color: '#EF4444' }} /></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>Alerte en cours</div><div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{activeAlerts[0].message || 'Intervention necessaire'}</div></div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 17, color: '#EF4444' }} />
            </div>
          </div>
        )}

        {/* ── CONSTANTES VITALES ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
          <div style={SL}>Constantes vitales</div>
          {metrics.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 } as any}>
              {metrics.map((m, i) => (
                <div key={i} data-testid={`beneficiary-vital-card-${m.label.toLowerCase().replace(/\s+/g, '-')}`} style={{ padding: '12px 10px', borderRadius: 14, background: C.card, border: `1px solid ${C.sep}` } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 } as any}>
                    <i className={m.icon} style={{ fontSize: 12, color: m.color, opacity: 0.7 }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: -0.5 }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{m.unit}</div>
                </div>
              ))}
            </div>
          ) : (
            <div data-testid="beneficiary-vitals-empty" style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: C.muted, borderRadius: 14, background: C.card, border: `1px solid ${C.sep}` }}>Aucune constante disponible</div>
          )}
        </div>

        {/* ── NORA ── */}
        {noraAnalysis && <div style={{ padding: '0 20px', marginBottom: 24 } as any}><NoraCard title="Analyse de Nora" text={noraAnalysis} /></div>}

        {/* ── DISPOSITIFS ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
          <div style={SL}>Dispositifs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 } as any}>
            {devList.map((dev, i) => {
              const isVest = dev.type === 'vest';
              const vestAct = isVest && dev.d?.last_sync && (Date.now() - new Date(dev.d.last_sync).getTime()) < 30000;
              const sLabel = !dev.d ? 'Non associe' : isVest ? (vestAct ? 'Actif' : 'Veille') : (dev.d?.connected ? 'OK' : 'Off');
              const sColor = !dev.d ? '#6B7280' : isVest ? (vestAct ? '#10B981' : '#F59E0B') : (dev.d?.connected ? '#10B981' : '#6B7280');
              const bat = dev.d?.battery_level ?? 0;
              return (
                <div key={i} data-testid={`beneficiary-device-card-${dev.type}`} style={{ padding: '14px 8px 12px', borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, textAlign: 'center' } as any}>
                  <img src={dev.img} alt="" style={{ width: 38, height: 38, objectFit: 'contain', margin: '0 auto 6px', display: 'block', opacity: dev.d ? 1 : 0.25 } as any} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.text, marginBottom: 5 }}>{dev.label}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: `${sColor}10` } as any}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: sColor } as any} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: sColor }}>{sLabel}</span>
                  </div>
                  {bat > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: bat > 30 ? '#10B981' : '#EF4444', marginTop: 4 }}>{bat}%</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── GARDIENS ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
          <div style={SL}>Gardiens ({guardiansList.length})</div>
          <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, overflow: 'hidden' } as any}>
            {guardiansList.length > 0 ? guardiansList.map((g: any, i: number) => (
              <div key={g.id || i} data-testid={`beneficiary-guardian-card-${g.id || i}`} onClick={() => setSelectedGuardian(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < guardiansList.length - 1 ? `1px solid ${C.sepLight}` : 'none', cursor: 'pointer', transition: 'background 0.15s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = C.hoverBg} onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: C.cellBg, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{g.name?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{g.name}</div>
                  <div style={{ fontSize: 10, color: C.sub, marginTop: 1 }}>{g.relationship || g.guardian_type || 'Gardien'}{g.phone ? ` \u00b7 ${g.phone}` : ''}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: C.muted }} />
              </div>
            )) : <div data-testid="beneficiary-guardians-empty" style={{ textAlign: 'center', fontSize: 12, color: C.sub, padding: '16px 0' }}>Aucun gardien associe</div>}
          </div>
        </div>

        {/* ── INFORMATIONS ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
          <div style={SL}>Informations</div>
          <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, padding: 14, marginBottom: 8 } as any}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
              {ageYears && <div style={{ padding: '8px 10px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Age</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ageYears} ans</div></div>}
              <div style={{ padding: '8px 10px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Genre</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{genderLabel}</div></div>
              {data.date_of_birth && <div style={{ padding: '8px 10px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Naissance</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{new Date(data.date_of_birth).toLocaleDateString('fr-FR')}</div></div>}
              {data.phone && <div style={{ padding: '8px 10px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Telephone</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{data.phone}</div></div>}
            </div>
          </div>
          <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, padding: 14, marginBottom: 8 } as any}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Adresse</div>
            <div data-testid="beneficiary-profile-address-value" style={{ fontSize: 13, color: C.text, lineHeight: 1.5, fontWeight: 500 }}>{data.address || '-'}{(data.postal_code || data.city) && <><br />{[data.postal_code, data.city].filter(Boolean).join(' ')}</>}</div>
          </div>
          {(data.height_cm || profileWeight) && (
            <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, padding: 14, marginBottom: 8 } as any}>
              <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Physique</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 } as any}>
                {data.height_cm && <div data-testid="beneficiary-profile-height-value" style={{ padding: 8, borderRadius: 10, background: C.cellBg, textAlign: 'center' } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Taille</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{data.height_cm}<span style={{ fontSize: 10, color: C.muted }}> cm</span></div></div>}
                {profileWeight && <div data-testid="beneficiary-profile-weight-value" style={{ padding: 8, borderRadius: 10, background: C.cellBg, textAlign: 'center' } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Poids</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{profileWeight}<span style={{ fontSize: 10, color: C.muted }}> kg</span></div></div>}
                {data.height_cm && profileWeight && <div style={{ padding: 8, borderRadius: 10, background: C.cellBg, textAlign: 'center' } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>IMC</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{(profileWeight / Math.pow(data.height_cm / 100, 2)).toFixed(1)}</div></div>}
              </div>
            </div>
          )}
          <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, padding: 14 } as any}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Dossier medical</div>
            <div style={{ display: 'grid', gap: 6 } as any}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Groupe sanguin</div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{data.blood_type || 'Non renseigne'}</div></div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Pathologies</div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{data.medical_conditions || 'Aucune'}</div></div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Allergies</div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{data.allergies || 'Aucune'}</div></div>
            </div>
          </div>
        </div>

        {/* ── PREFERENCES ── */}
        {guardianPerms && (
          <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
            <div style={SL}>Mes preferences</div>
            <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, padding: 14 } as any}>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 12, lineHeight: 1.5 }}>Notifications pour {firstName}.</div>
              {/* Alertes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.sepLight}` } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 15, color: guardianPerms.guardian_alerts_enabled ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Alertes</span></div>
                <div onClick={() => { const n = !guardianPerms.guardian_alerts_enabled; setGuardianPerms((p: any) => ({ ...p, guardian_alerts_enabled: n })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_alerts_enabled: n }) }, token).catch(() => {}); }} style={{ width: 42, height: 24, borderRadius: 12, background: guardianPerms.guardian_alerts_enabled ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#FFF', position: 'absolute', top: 3, left: guardianPerms.guardian_alerts_enabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' } as any} /></div>
              </div>
              {guardianPerms.guardian_alerts_enabled && guardianPerms.alerts_enabled && (<>
                <div onClick={() => setExpandedPerm(expandedPerm === 'alerts' ? null : 'alerts')} style={{ fontSize: 11, color: C.sub, fontWeight: 600, cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className={expandedPerm === 'alerts' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 14 }} />{expandedPerm === 'alerts' ? 'Masquer' : 'Personnaliser les alertes'}</div>
                {expandedPerm === 'alerts' && <div style={{ paddingLeft: 4 } as any}>{Object.entries(guardianPerms.guardian_alert_types || {}).map(([key, val]: [string, any]) => { const labels: Record<string, string> = { fall: 'Chute', heart_rate: 'Freq. cardiaque', inactivity: 'Inactivite', sos_manual: 'SOS manuel', temperature: 'Temperature', spo2: 'SpO2', blood_pressure: 'Tension', weight: 'Poids', pulse: 'Pouls' }; const bg = guardianPerms.alert_types?.[key]; return (<div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.sepLight}` } as any}><span style={{ flex: 1, fontSize: 12, color: bg ? C.text : C.label, fontWeight: 500 }}>{labels[key] || key}{!bg ? ' (non partage)' : ''}</span><div onClick={() => { if (!bg) return; const n2 = { ...guardianPerms.guardian_alert_types, [key]: !val }; setGuardianPerms((p: any) => ({ ...p, guardian_alert_types: n2 })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_alert_types: n2 }) }, token).catch(() => {}); }} style={{ width: 36, height: 20, borderRadius: 10, background: (val && bg) ? '#10B981' : C.toggleBg, cursor: bg ? 'pointer' : 'default', position: 'relative', transition: 'background 0.2s', opacity: bg ? 1 : 0.3 } as any}><div style={{ width: 14, height: 14, borderRadius: 7, background: '#FFF', position: 'absolute', top: 3, left: (val && bg) ? 19 : 3, transition: 'left 0.2s' } as any} /></div></div>); })}</div>}
              </>)}
              {/* Sante */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.sepLight}` } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 15, color: guardianPerms.guardian_health_enabled ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Donnees de sante</span></div>
                <div onClick={() => { const n = !guardianPerms.guardian_health_enabled; setGuardianPerms((p: any) => ({ ...p, guardian_health_enabled: n })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_health_enabled: n }) }, token).catch(() => {}); }} style={{ width: 42, height: 24, borderRadius: 12, background: guardianPerms.guardian_health_enabled ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#FFF', position: 'absolute', top: 3, left: guardianPerms.guardian_health_enabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' } as any} /></div>
              </div>
              {/* Localisation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-map-pin-line" style={{ fontSize: 15, color: guardianPerms.guardian_location_accepted ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Localisation</span></div>
                <div onClick={() => { const n = !guardianPerms.guardian_location_accepted; setGuardianPerms((p: any) => ({ ...p, guardian_location_accepted: n })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_location_accepted: n }) }, token).catch(() => {}); }} style={{ width: 42, height: 24, borderRadius: 12, background: guardianPerms.guardian_location_accepted ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 18, height: 18, borderRadius: 9, background: '#FFF', position: 'absolute', top: 3, left: guardianPerms.guardian_location_accepted ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' } as any} /></div>
              </div>
              {guardianPerms.location_mode !== 'never' && guardianPerms.guardian_location_accepted && <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>Mode: {guardianPerms.location_mode === 'always' ? 'Tout le temps' : "En cas d'alerte uniquement"}</div>}
            </div>
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {historyAlerts.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
            <div style={SL}>Historique ({historyAlerts.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
              {historyAlerts.slice(0, 6).map((al: any) => (
                <div key={al.id} onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: al.id } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.card, border: `1px solid ${C.sep}`, cursor: 'pointer' } as any}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: al.status === 'resolved' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={al.status === 'resolved' ? 'ri-checkbox-circle-line' : 'ri-alarm-warning-line'} style={{ fontSize: 13, color: al.status === 'resolved' ? '#10B981' : '#F59E0B' }} /></div>
                  <div style={{ flex: 1, minWidth: 0 } as any}><div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{al.message || al.alert_type}</div><div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{new Date(al.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
                  <span style={{ padding: '2px 8px', borderRadius: 99, background: al.status === 'resolved' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', fontSize: 9, fontWeight: 600, color: al.status === 'resolved' ? '#10B981' : '#F59E0B', flexShrink: 0 }}>{al.status === 'resolved' ? 'Resolue' : 'Cloturee'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOCALISATION ── */}
        <div style={{ padding: '0 20px', marginBottom: 24 } as any}>
          <div style={SL}>Localisation</div>
          <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, padding: 14, marginBottom: 8 } as any}>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Position du beneficiaire</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }} data-testid="beneficiary-safezone-location-value">{geoLocation?.latitude != null && geoLocation?.longitude != null ? `${Number(geoLocation.latitude).toFixed(5)}, ${Number(geoLocation.longitude).toFixed(5)}${geoLocation?.updated_at ? ` \u00b7 MAJ ${new Date(geoLocation.updated_at).toLocaleString('fr-FR')}` : ''}` : 'Localisation non disponible.'}</div>
          </div>
          <div data-testid="beneficiary-safezone-map" style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.sep}`, background: C.cellBg, marginBottom: 10, minHeight: 200 } as any}>
            {geoLocation?.latitude != null && geoLocation?.longitude != null ? <iframe title="map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(geoLocation.longitude) - 0.01},${Number(geoLocation.latitude) - 0.01},${Number(geoLocation.longitude) + 0.01},${Number(geoLocation.latitude) + 0.01}&layer=mapnik&marker=${Number(geoLocation.latitude)},${Number(geoLocation.longitude)}`} style={{ width: '100%', height: 200, border: 'none' } as any} /> : <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, gap: 6 } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 24 }} /><div style={{ fontSize: 12 }} data-testid="beneficiary-safezone-map-empty">Carte indisponible</div></div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
            <span data-testid="beneficiary-safezone-count" style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{geoLoading ? 'Chargement...' : `Safe zones (${geoZones.length})`}</span>
            <div data-testid="beneficiary-safezone-open-create-popup-btn" onClick={openCreateZonePopup} style={{ padding: '4px 12px', borderRadius: 99, cursor: geoLocation?.latitude != null ? 'pointer' : 'not-allowed', background: geoLocation?.latitude != null ? 'rgba(16,185,129,0.1)' : C.cellBg, border: geoLocation?.latitude != null ? '1px solid rgba(16,185,129,0.18)' : `1px solid ${C.sep}`, fontSize: 10, fontWeight: 600, color: geoLocation?.latitude != null ? '#10B981' : C.muted } as any}>+ Ajouter</div>
          </div>
          {geoZones.length > 0 ? (
            <div style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, overflow: 'hidden' } as any}>
              {geoZones.map((zone: any, zi: number) => (
                <div key={zone.id} data-testid={`beneficiary-safezone-row-${zone.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: zi < geoZones.length - 1 ? `1px solid ${C.sepLight}` : 'none' } as any}>
                  <div style={{ width: 6, height: 6, borderRadius: 99, background: '#10B981', flexShrink: 0 } as any} />
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{zone.name}</div><div style={{ fontSize: 10, color: C.sub }}>{Math.round(Number(zone.radius_m || 0))}m</div></div>
                  <div data-testid={`beneficiary-safezone-edit-btn-${zone.id}`} onClick={() => startGeoEdit(zone)} style={{ padding: '3px 10px', borderRadius: 99, cursor: 'pointer', background: C.cellBg, border: `1px solid ${C.sep}`, fontSize: 10, fontWeight: 600, color: C.sub } as any}>Modifier</div>
                  <div data-testid={`beneficiary-safezone-delete-btn-${zone.id}`} onClick={() => deleteGeoZone(zone.id)} style={{ padding: '3px 8px', borderRadius: 99, cursor: geoBusyId === zone.id ? 'wait' : 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)', fontSize: 10, fontWeight: 600, color: '#EF4444', opacity: geoBusyId === zone.id ? 0.5 : 1 } as any}>Suppr.</div>
                </div>
              ))}
            </div>
          ) : !geoLoading && <div style={{ fontSize: 12, color: C.sub, textAlign: 'center', padding: '14px 0' }}>Aucune safe zone configuree.</div>}
        </div>

        <div style={{ height: 100 } as any} />

        {/* ── MODAL: GUARDIAN ── */}
        {selectedGuardian && (() => {
          const activity = getGuardianActivity(selectedGuardian); const extra = getGuardianContractDetails(selectedGuardian);
          const gName = selectedGuardian.name || ''; const gInitials = gName.split(' ').map((w: string) => w.charAt(0)).join('').toUpperCase().slice(0, 2);
          const gPhone = selectedGuardian.phone || extra?.phone || ''; const gEmail = extra?.email || selectedGuardian.email || '';
          const gAddress = [extra?.address, extra?.postal_code, extra?.city].filter(Boolean).join(', ');
          const gRelation = selectedGuardian.relationship || selectedGuardian.guardian_type || 'Gardien';
          return (
            <div data-testid="guardian-detail-modal" onClick={() => setSelectedGuardian(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1190, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)', overflowY: 'auto', WebkitOverflowScrolling: 'touch', animation: 'bd-fade 200ms ease' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 } as any}><div data-testid="guardian-detail-close-btn" onClick={() => setSelectedGuardian(null)} style={{ width: 34, height: 34, borderRadius: 10, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: C.sub }} /></div></div>
                <div style={{ borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)', border: `1px solid ${C.sep}`, padding: 20, animation: 'bd-pop 220ms ease both', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                  <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: `2px solid ${C.sep}` } as any}><span style={{ fontSize: 19, fontWeight: 800, color: C.text }}>{gInitials}</span></div>
                    <div data-testid="guardian-detail-name" style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 4 }}>{gName}</div>
                    <span data-testid="guardian-detail-role" style={{ padding: '3px 12px', borderRadius: 99, background: C.cellBg, border: `1px solid ${C.sep}`, fontSize: 11, fontWeight: 600, color: C.sub }}>{gRelation}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 } as any}>
                    {gPhone && <div data-testid="guardian-detail-phone" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.cellBg, border: `1px solid ${C.sep}` } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: C.muted }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Telephone</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{gPhone}</div></div></div>}
                    {gEmail && <div data-testid="guardian-detail-email" onClick={() => window.open(`mailto:${gEmail}`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.cellBg, border: `1px solid ${C.sep}`, cursor: 'pointer' } as any}><i className="ri-mail-line" style={{ fontSize: 14, color: C.muted }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Email</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{gEmail}</div></div></div>}
                    {gAddress && <div data-testid="guardian-detail-address" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.cellBg, border: `1px solid ${C.sep}` } as any}><i className="ri-map-pin-line" style={{ fontSize: 14, color: C.muted }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Adresse</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{gAddress}</div></div></div>}
                    <div data-testid="guardian-detail-type" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: C.cellBg, border: `1px solid ${C.sep}` } as any}><i className="ri-user-star-line" style={{ fontSize: 14, color: C.muted }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Type</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{selectedGuardian.guardian_type === 'saad' ? 'SAAD' : selectedGuardian.guardian_type === 'company' ? 'Entreprise' : 'Particulier'}</div></div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
                    {gPhone && <div data-testid="guardian-call-btn" onClick={() => window.open(`tel:${gPhone}`, '_self')} style={{ flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#10B981' } as any}><i className="ri-phone-fill" style={{ fontSize: 14 }} />Appeler</div>}
                    {gPhone && <div data-testid="guardian-sms-btn" onClick={() => window.open(`sms:${gPhone}`, '_self')} style={{ flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', background: C.cellBg, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.text } as any}><i className="ri-message-3-line" style={{ fontSize: 14 }} />SMS</div>}
                  </div>
                  <div style={{ padding: '12px', borderRadius: 12, background: C.cellBg, border: `1px solid ${C.sep}` } as any}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Activite</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 } as any}>
                      <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: C.card } as any}><div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>Actions</div><div data-testid="guardian-detail-activity-count" style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{activity.count}</div></div>
                      <div style={{ flex: 2, padding: '6px 8px', borderRadius: 8, background: C.card } as any}><div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>Derniere</div><div data-testid="guardian-detail-last-action" style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{activity.lastActionAt ? new Date(activity.lastActionAt).toLocaleString('fr-FR') : 'Aucune'}</div></div>
                    </div>
                    {activity.recentAlerts.length > 0 ? activity.recentAlerts.map((a: any) => (
                      <div key={a.id} data-testid={`guardian-detail-activity-item-${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderTop: `1px solid ${C.sepLight}` } as any}><div style={{ width: 4, height: 4, borderRadius: 2, background: C.muted, flexShrink: 0 } as any} /><span style={{ fontSize: 11, color: C.sub, flex: 1 }}>{a.message || a.alert_type}</span><span style={{ fontSize: 9, color: C.muted }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>
                    )) : <div data-testid="guardian-detail-activity-empty" style={{ fontSize: 11, color: C.faint, textAlign: 'center', padding: '6px 0' }}>Aucune action enregistree</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── MODAL: SAFE ZONE FORM ── */}
        {geoFormOpen && (
          <div data-testid="safezone-form-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 } as any}><div data-testid="safezone-form-close-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ width: 34, height: 34, borderRadius: 10, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: C.sub }} /></div></div>
              <div style={{ borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)', border: `1px solid ${C.sep}`, padding: 20, animation: 'bd-pop 220ms ease both', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                <div style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 4 }} data-testid="safezone-form-modal-title">{geoEditingId ? 'Modifier la safe zone' : 'Nouvelle safe zone'}</div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }} data-testid="safezone-form-center-info">Centre: {Number(geoFormLat || 0).toFixed(5)}, {Number(geoFormLng || 0).toFixed(5)}</div>
                <div style={{ display: 'grid', gap: 8 } as any}>
                  <input data-testid="safezone-form-name-input" value={geoFormName} onChange={(e: any) => setGeoFormName(e.target.value)} placeholder="Nom de la zone" style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.sep}`, background: C.toggleBg, color: C.text, fontSize: 13, outline: 'none' } as any} />
                  <input data-testid="safezone-form-radius-input" value={geoFormRadius} onChange={(e: any) => setGeoFormRadius(e.target.value)} placeholder="Rayon en metres" style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.sep}`, background: C.toggleBg, color: C.text, fontSize: 13, outline: 'none' } as any} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 } as any}>
                  <div data-testid="safezone-form-cancel-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: C.toggleBg, border: `1px solid ${C.sep}`, fontSize: 13, fontWeight: 600, color: C.text } as any}>Annuler</div>
                  <div data-testid="safezone-form-save-btn" onClick={saveGeoForm} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: geoFormSaving ? 'wait' : 'pointer', textAlign: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 13, fontWeight: 700, color: '#10B981', opacity: geoFormSaving ? 0.6 : 1 } as any}>{geoFormSaving ? 'Enregistrement...' : (geoEditingId ? 'Enregistrer' : 'Creer')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
