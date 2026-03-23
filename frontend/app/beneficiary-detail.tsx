import React, { useState, useEffect, useCallback } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NoraCard from '../src/components/shared/NoraCard';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
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
    } catch {
      return '';
    }
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
  const [showContractPopup, setShowContractPopup] = useState(false);
  const [guardianPerms, setGuardianPerms] = useState<any>(null);
  const [expandedPerm, setExpandedPerm] = useState<string | null>(null);
  const [permSaving, setPermSaving] = useState(false);
  const [resolvedBid, setResolvedBid] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'sante' | 'profil' | 'localisation'>('sante');

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
        setData(null);
        setAlerts([]);
        setDevices(null);
        setGeoZones([]);
        setGeoLocation(null);
        setGeoLoading(false);
        setResolvedBid('');
        return;
      }

      setResolvedBid(targetBid);

      const [alts, devs, geo] = await Promise.all([
        apiFetch(`/api/guardian/beneficiary/${targetBid}/alerts`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${targetBid}/devices`, {}, token).catch(() => null),
        apiFetch(`/api/guardian/beneficiary/${targetBid}/geofence`, {}, token).catch(() => null),
      ]);

      const ben = (bens || []).find((b: any) => b.id === targetBid) || (Array.isArray(bens) ? bens[0] : null) || null;
      setData(ben);
      setAlerts(Array.isArray(alts) ? alts : []);
      setDevices(devs);
      setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []);
      setGeoLocation(geo?.current_location || null);
      setGeoLoading(false);
      // Fetch Nora analysis + subscription
      if (ben) {
        apiFetch(`/api/guardian/beneficiary/${targetBid}/ai-report`, {}, token)
          .then((r: any) => setNoraAnalysis(r?.summary || r?.report || ''))
          .catch(() => setNoraAnalysis(''));
        apiFetch(`/api/guardian/beneficiary/${targetBid}/subscription`, {}, token)
          .then((r: any) => setSubInfo(r))
          .catch(() => {});
        if (user?.id) {
          apiFetch(`/api/guardian-permissions/${user.id}/${targetBid}`, {}, token)
            .then((p: any) => setGuardianPerms(p))
            .catch(() => {});
        }
      }
    } catch {
      setGeoLoading(false);
    } finally { setLoading(false); }
  }, [bid, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!activeBid) return;
    const interval = setInterval(async () => {
      try {
        const geo = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, {}, token);
        setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []);
        setGeoLocation(geo?.current_location || null);
      } catch {
      }
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
    ? { bg: '#000', overlay: 'rgba(0,0,0,0.55)', card: 'rgba(255,255,255,0.05)', cardSolid: 'rgba(70,70,78,0.85)', text: '#FFF', sub: 'rgba(255,255,255,0.4)', muted: 'rgba(255,255,255,0.3)', faint: 'rgba(255,255,255,0.35)', sep: 'rgba(255,255,255,0.08)', sepLight: 'rgba(255,255,255,0.06)', cellBg: 'rgba(255,255,255,0.03)', cellBorder: 'rgba(255,255,255,0.04)', label: 'rgba(255,255,255,0.25)', initBg: '#FFF', initText: '#111', toggleBg: 'rgba(255,255,255,0.08)', hoverBg: 'rgba(255,255,255,0.1)', btnBg: 'rgba(255,255,255,0.06)', btnBorder: 'rgba(255,255,255,0.1)', valueTxt: 'rgba(255,255,255,0.75)', addressTxt: 'rgba(255,255,255,0.7)', tagBg: 'rgba(255,255,255,0.04)', mapEmptyTxt: 'rgba(255,255,255,0.4)', zoneDot: '#10B981' }
    : { bg: '#F5F5F5', overlay: 'rgba(245,245,250,0.75)', card: 'rgba(0,0,0,0.03)', cardSolid: '#E8E8EA', text: '#1A1A2E', sub: 'rgba(0,0,0,0.4)', muted: 'rgba(0,0,0,0.3)', faint: 'rgba(0,0,0,0.35)', sep: 'rgba(0,0,0,0.06)', sepLight: 'rgba(0,0,0,0.04)', cellBg: 'rgba(0,0,0,0.02)', cellBorder: 'rgba(0,0,0,0.04)', label: 'rgba(0,0,0,0.25)', initBg: '#1A1A2E', initText: '#FFF', toggleBg: 'rgba(0,0,0,0.06)', hoverBg: 'rgba(0,0,0,0.06)', btnBg: 'rgba(0,0,0,0.04)', btnBorder: 'rgba(0,0,0,0.08)', valueTxt: 'rgba(0,0,0,0.65)', addressTxt: 'rgba(0,0,0,0.6)', tagBg: 'rgba(0,0,0,0.03)', mapEmptyTxt: 'rgba(0,0,0,0.35)', zoneDot: '#10B981' };

  const Sep = () => <div style={{ height: 1, background: C.sepLight, margin: '18px 0' } as any} />;

  const GlassCard = ({ children, style }: any) => (
    <div
      style={{
        padding: '16px',
        borderRadius: 20,
        background: C.card,
        border: `1px solid ${C.sep}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        marginBottom: 12,
        animation: 'beneficiary-fade-in 280ms ease both',
        transition: 'transform 220ms ease, border-color 220ms ease',
        ...style,
      } as any}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = style?.border || C.sep;
      }}
    >
      {children}
    </div>
  );

  const SectionTitle = ({ icon, label, color }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 2 } as any}>
      <i className={icon} style={{ fontSize: 15, color }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  const InfoCell = ({ label, value, highlight, color, ...rest }: any) => (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: highlight ? `${color || '#F59E0B'}08` : C.cellBg, border: highlight ? `1px solid ${color || '#F59E0B'}20` : `1px solid ${C.cellBorder}` } as any} {...rest}>
      <div style={{ fontSize: 9, fontWeight: 700, color: highlight ? (color || '#F59E0B') : C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.valueTxt, lineHeight: 1.4 }}>{value}</div>
    </div>
  );

  const devList = [
    { label: 'Bracelet Elio', img: IMG_BRACELET, d: bracelet, type: 'bracelet' },
    { label: 'Balance Vita', img: IMG_SCALE, d: scale, type: 'scale' },
    { label: 'Gilet Elder', img: IMG_VEST, d: vest, type: 'vest' },
  ];

  // All health metrics
  const metrics = [
    { label: 'Freq. cardiaque', val: v.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444' },
    { label: 'SpO2', val: v.spo2, unit: '%', icon: 'ri-drop-line', color: '#60A5FA' },
    { label: 'Tension', val: v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null, unit: 'mmHg', icon: 'ri-pulse-line', color: '#C084FC' },
    { label: 'Temperature', val: v.temperature && v.temperature > 30 ? v.temperature : null, unit: '°C', icon: 'ri-temp-hot-line', color: '#FB923C' },
    { label: 'Pas', val: v.steps, unit: 'pas', icon: 'ri-footprint-line', color: '#10B981' },
    { label: 'Calories', val: v.calories, unit: 'kcal', icon: 'ri-fire-line', color: '#F59E0B' },
    { label: 'Stress', val: v.stress_level, unit: '/100', icon: 'ri-mental-health-line', color: '#A78BFA' },
    { label: 'Recuperation', val: v.recovery_score, unit: '/100', icon: 'ri-heart-add-line', color: '#22D3EE' },
    { label: 'HRV', val: v.hrv, unit: 'ms', icon: 'ri-rhythm-line', color: '#818CF8' },
    { label: 'Poids', val: v.weight, unit: 'kg', icon: 'ri-scales-3-line', color: '#3B82F6' },
    { label: 'Sommeil', val: v.sleep_quality, unit: '%', icon: 'ri-moon-line', color: '#A78BFA' },
  ].filter(m => m.val && m.val !== 0);

  const guardiansList = Array.isArray(subInfo?.guardians) ? subInfo.guardians : [];
  const subscription = subInfo?.subscription || null;
  const contract = subInfo?.contract || null;
  const hasActiveContract = subscription?.status === 'active';
  const nameParts = (data.name || '').trim().split(' ').filter(Boolean);
  const firstName = nameParts[0] || data.name || '-';
  const lastName = nameParts.slice(1).join(' ') || '-';
  const ageYears = data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / 31557600000) : null;
  const genderLabel = data.gender === 'male' ? 'Homme' : data.gender === 'female' ? 'Femme' : (data.gender || 'N/A');
  const addressDisplay = [data.address, data.postal_code, data.city].filter(Boolean).join(' ') || 'Adresse non renseignee';
  const profileWeight = data.weight_kg || null;

  const getGuardianContractDetails = (guardian: any) => {
    const contractGuardians = Array.isArray(contract?.guardians) ? contract.guardians : [];
    const normalize = (value: string) => (value || '').replace(/\D/g, '');
    return contractGuardians.find((g: any) => normalize(g.phone || '') === normalize(guardian?.phone || '')) || null;
  };

  const getGuardianActivity = (guardian: any) => {
    const related = alerts.filter((a: any) =>
      a?.resolved_by === guardian?.id ||
      a?.acknowledged_by === guardian?.id ||
      a?.assigned_to === guardian?.id
    );
    const latest = related.sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0];
    return {
      count: related.length,
      lastActionAt: latest?.updated_at || latest?.created_at || null,
      recentAlerts: related.slice(0, 4),
    };
  };

  const refreshGeofences = async () => {
    if (!activeBid) return;
    try {
      const geo = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, {}, token);
      setGeoZones(Array.isArray(geo?.zones) ? geo.zones : []);
      setGeoLocation(geo?.current_location || null);
    } catch {
    }
  };

  const openCreateZonePopup = () => {
    if (geoLocation?.latitude == null || geoLocation?.longitude == null) return;
    setGeoEditingId(null);
    setGeoFormName(`Zone ${geoZones.length + 1}`);
    setGeoFormLat(String(geoLocation.latitude));
    setGeoFormLng(String(geoLocation.longitude));
    setGeoFormRadius('300');
    setGeoFormOpen(true);
  };

  const startGeoEdit = (zone: any) => {
    setGeoEditingId(zone.id);
    setGeoFormName(zone.name || 'Zone');
    setGeoFormLat(String(zone.latitude));
    setGeoFormLng(String(zone.longitude));
    setGeoFormRadius(String(zone.radius_m ?? zone.radius_meters ?? 300));
    setGeoFormOpen(true);
  };

  const saveGeoForm = async () => {
    if (!activeBid) return;
    const latitude = parseFloat(geoFormLat);
    const longitude = parseFloat(geoFormLng);
    const radius_m = parseFloat(geoFormRadius);
    if (!geoFormName.trim()) return;
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;
    if (Number.isNaN(radius_m) || radius_m < 50) return;

    setGeoFormSaving(true);
    try {
      const payload = { name: geoFormName.trim(), latitude, longitude, radius_m };
      if (geoEditingId) {
        const updated = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence/${geoEditingId}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
        setGeoZones(prev => prev.map((z: any) => z.id === geoEditingId ? updated : z));
      } else {
        const created = await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence`, { method: 'POST', body: JSON.stringify(payload) }, token);
        setGeoZones(prev => [created, ...prev]);
      }
      setGeoFormOpen(false);
      setGeoEditingId(null);
      await refreshGeofences();
    } catch {
    } finally {
      setGeoFormSaving(false);
    }
  };

  const deleteGeoZone = async (zoneId: string) => {
    if (!activeBid) return;
    const ok = typeof window !== 'undefined' ? window.confirm('Supprimer cette safe zone ?') : true;
    if (!ok) return;
    setGeoBusyId(zoneId);
    try {
      await apiFetch(`/api/guardian/beneficiary/${activeBid}/geofence/${zoneId}`, { method: 'DELETE' }, token);
      setGeoZones(prev => prev.filter((z: any) => z.id !== zoneId));
    } catch {
    } finally {
      setGeoBusyId(null);
    }
  };


  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: isDark ? '#0A0A12' : '#F2F2F7' } as any}>
      {isDark && <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.4 } as any} />}
      <div style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(10,10,18,0.7)' : 'transparent', zIndex: 1 } as any} />
      <style>{`
        @keyframes bd-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bd-pop { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bd-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
      `}</style>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: 480, margin: '0 auto' } as any}>

        {/* HERO HEADER */}
        <div style={{ position: 'relative', padding: '16px 20px 0' } as any}>
          <div data-testid="beneficiary-detail-back-button" onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 12, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 20 } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: C.text }} />
          </div>
          <div style={{ textAlign: 'center', marginBottom: 20, animation: 'bd-fade 400ms ease both' } as any}>
            <div style={{ width: 82, height: 82, borderRadius: 22, background: `linear-gradient(135deg, ${isDark ? '#1E293B' : '#E2E8F0'}, ${isDark ? '#334155' : '#CBD5E1'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `3px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)' } as any}>
              <span style={{ fontSize: 28, fontWeight: 900, color: isDark ? '#FFF' : '#1A1A2E', letterSpacing: -1 }}>{firstName?.charAt(0)}{lastName?.charAt(0)}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 6 }} data-testid="beneficiary-firstname-value">{firstName} <span data-testid="beneficiary-lastname-value">{lastName}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 } as any}>
              {ageYears && <div style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>{ageYears} ans</span></div>}
              <div style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>{genderLabel}</span></div>
              {data.blood_type && <div style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{data.blood_type}</span></div>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '0 10px' } as any}>
              {data.phone && (
                <div data-testid="beneficiary-call-btn" onClick={() => window.open(`tel:${data.phone}`, '_self')} style={{ flex: 1, maxWidth: 140, padding: '10px 0', borderRadius: 14, cursor: 'pointer', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'transform 0.15s' } as any}
                  onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}>
                  <i className="ri-phone-fill" style={{ fontSize: 15, color: '#10B981' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Appeler</span>
                </div>
              )}
              <div data-testid="view-health-page-btn" onClick={() => router.push({ pathname: '/health-readonly' as any, params: { beneficiaryId: activeBid } })} style={{ flex: 1, maxWidth: 140, padding: '10px 0', borderRadius: 14, cursor: 'pointer', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'transform 0.15s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="ri-heart-pulse-line" style={{ fontSize: 15, color: '#60A5FA' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>Sante</span>
              </div>
            </div>
          </div>
        </div>

        {/* ALERT BANNER */}
        {activeAlerts.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 16 } as any}>
            <div data-testid="beneficiary-active-alert-card" onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: activeAlerts[0].id } })} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, animation: 'bd-pulse 2s ease-in-out infinite' } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 20, color: '#EF4444' }} /></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Alerte en cours</div><div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{activeAlerts[0].message || 'Intervention necessaire'}</div></div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: '#EF4444' }} />
            </div>
          </div>
        )}

        {/* VITALS STRIP */}
        {metrics.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 20, animation: 'bd-fade 500ms ease both' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 13, color: '#EF4444' }} />Constantes vitales</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' } as any}>
              {metrics.slice(0, 6).map((m, i) => (
                <div key={i} data-testid={`beneficiary-vital-card-${m.label.toLowerCase().replace(/\s+/g, '-')}`} style={{ minWidth: 100, flex: '0 0 auto', padding: '14px 12px', borderRadius: 18, background: `${m.color}0A`, border: `1px solid ${m.color}1A`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 } as any}><i className={m.icon} style={{ fontSize: 13, color: m.color }} /><span style={{ fontSize: 9, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span></div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: m.color, lineHeight: 1, letterSpacing: -1 }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 3, fontWeight: 600 }}>{m.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {metrics.length === 0 && (<div style={{ padding: '0 20px', marginBottom: 20 } as any}><div data-testid="beneficiary-vitals-empty" style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: C.muted, borderRadius: 16, background: C.card, border: `1px solid ${C.sep}` }}>Aucune constante disponible</div></div>)}

        {/* NORA */}
        {noraAnalysis && (<div style={{ padding: '0 20px', marginBottom: 20 } as any}><NoraCard title={`Analyse de Nora`} text={noraAnalysis} /></div>)}

        {/* TABS */}
        <div style={{ padding: '0 20px', marginBottom: 16 } as any}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.sepLight}` } as any}>
            {([{ id: 'sante' as const, label: 'Dispositifs', icon: 'ri-bluetooth-connect-line' }, { id: 'profil' as const, label: 'Profil', icon: 'ri-user-3-line' }, { id: 'localisation' as const, label: 'Localisation', icon: 'ri-map-pin-line' }]).map(tab => (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px 0', textAlign: 'center', cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid #10B981' : '2px solid transparent', transition: 'border-color 0.2s' } as any}>
                <i className={tab.icon} style={{ fontSize: 15, color: activeTab === tab.id ? '#10B981' : C.muted, display: 'block', marginBottom: 3 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: activeTab === tab.id ? C.text : C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TAB: DISPOSITIFS */}
        {activeTab === 'sante' && (
          <div style={{ padding: '0 20px', marginBottom: 24, animation: 'bd-fade 300ms ease both' } as any}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 } as any}>
              {devList.map((dev, i) => {
                const isVest = dev.type === 'vest'; const vestAct = isVest && dev.d?.last_sync && (Date.now() - new Date(dev.d.last_sync).getTime()) < 30000;
                const statusLabel = !dev.d ? 'Non associe' : isVest ? (vestAct ? 'Actif' : 'Veille') : (dev.d?.connected ? 'OK' : 'Off');
                const statusColor = !dev.d ? '#6B7280' : isVest ? (vestAct ? '#10B981' : '#F59E0B') : (dev.d?.connected ? '#10B981' : '#6B7280');
                const bat = dev.d?.battery_level ?? 0;
                return (<div key={i} data-testid={`beneficiary-device-card-${dev.type}`} style={{ padding: '16px 8px 12px', borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, textAlign: 'center', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'transform 0.15s' } as any} onMouseEnter={(e: any) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e: any) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <img src={dev.img} alt="" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto 8px', display: 'block', opacity: dev.d ? 1 : 0.25 } as any} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 6 }}>{dev.label}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, background: `${statusColor}14` } as any}><span style={{ width: 5, height: 5, borderRadius: 99, background: statusColor } as any} /><span style={{ fontSize: 9, fontWeight: 700, color: statusColor }}>{statusLabel}</span></div>
                  {bat > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: bat > 30 ? '#10B981' : '#EF4444', marginTop: 6 }}>{bat}%</div>}
                </div>);
              })}
            </div>
            {/* Guardians */}
            <div style={{ marginTop: 20 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-team-line" style={{ fontSize: 13, color: '#34D399' }} />Gardiens ({guardiansList.length})</div>
              <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, overflow: 'hidden', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
                {guardiansList.length > 0 ? guardiansList.map((g: any, i: number) => (
                  <div key={g.id || i} data-testid={`beneficiary-guardian-card-${g.id || i}`} onClick={() => setSelectedGuardian(g)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < guardiansList.length - 1 ? `1px solid ${C.sepLight}` : 'none', cursor: 'pointer', transition: 'background 0.15s' } as any} onMouseEnter={(e: any) => e.currentTarget.style.background = C.hoverBg} onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#34D399' }}>{g.name?.charAt(0)}</span></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{g.name}</div><div style={{ fontSize: 10, color: C.sub, marginTop: 1 }}>{g.relationship || g.guardian_type || 'Gardien'}{g.phone ? ` · ${g.phone}` : ''}</div></div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: C.muted }} />
                  </div>
                )) : (<div data-testid="beneficiary-guardians-empty" style={{ textAlign: 'center', fontSize: 12, color: C.sub, padding: '16px 0' } as any}>Aucun gardien associe</div>)}
              </div>
            </div>
            {/* Contract */}
            <div style={{ marginTop: 20 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-shield-star-line" style={{ fontSize: 13, color: '#7C3AED' }} />Contrat</div>
              <div data-testid="beneficiary-contract-card" onClick={() => subscription && setShowContractPopup(true)} style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, height: 80, cursor: subscription ? 'pointer' : 'default', transition: 'transform 0.15s' } as any} onMouseEnter={(e: any) => { if (subscription) e.currentTarget.style.transform = 'scale(1.01)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                {subscription ? (<img src={subscription.subscription_type === 'care' ? 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png' : 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png'} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 } as any} />) : (<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.26), rgba(2,6,23,0.7))' } as any} />)}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: 18 } as any} />
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 18px' } as any}>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', letterSpacing: -0.3 }} data-testid="beneficiary-contract-status-title">{subscription ? (subscription.subscription_type === 'care' ? 'Contrat Care' : 'Contrat Standard') : 'Aucun contrat'}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }} data-testid="beneficiary-contract-status-subtitle">{subscription ? 'Touchez pour details' : 'Aucune souscription'}</div></div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: hasActiveContract ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.25)', border: `1px solid ${hasActiveContract ? 'rgba(16,185,129,0.4)' : 'rgba(107,114,128,0.4)'}` } as any}><span style={{ width: 5, height: 5, borderRadius: '50%', background: hasActiveContract ? '#10B981' : '#9CA3AF' } as any} /><span style={{ fontSize: 10, fontWeight: 700, color: hasActiveContract ? '#10B981' : '#D1D5DB' }}>{hasActiveContract ? 'Actif' : 'Inactif'}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFIL */}
        {activeTab === 'profil' && (
          <div style={{ padding: '0 20px', marginBottom: 24, animation: 'bd-fade 300ms ease both' } as any}>
            <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, padding: '16px', marginBottom: 12, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-user-3-line" style={{ fontSize: 13, color: '#60A5FA' }} />Identite</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                {ageYears && <div style={{ padding: '10px 12px', borderRadius: 12, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Age</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ageYears} ans</div></div>}
                <div style={{ padding: '10px 12px', borderRadius: 12, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Genre</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{genderLabel}</div></div>
                {data.date_of_birth && <div style={{ padding: '10px 12px', borderRadius: 12, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Naissance</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{new Date(data.date_of_birth).toLocaleDateString('fr-FR')}</div></div>}
                {data.phone && <div style={{ padding: '10px 12px', borderRadius: 12, background: C.cellBg } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Telephone</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{data.phone}</div></div>}
              </div>
            </div>
            <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, padding: '16px', marginBottom: 12, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-map-pin-line" style={{ fontSize: 13, color: '#F59E0B' }} />Adresse</div>
              <div data-testid="beneficiary-profile-address-value" style={{ fontSize: 14, color: C.addressTxt, lineHeight: 1.6, fontWeight: 500 }}>{data.address || '-'}{(data.postal_code || data.city) && <><br />{[data.postal_code, data.city].filter(Boolean).join(' ')}</>}</div>
            </div>
            {(data.height_cm || profileWeight) && (
              <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, padding: '16px', marginBottom: 12, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-body-scan-line" style={{ fontSize: 13, color: '#10B981' }} />Physique</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 } as any}>
                  {data.height_cm && <div data-testid="beneficiary-profile-height-value" style={{ padding: '10px', borderRadius: 12, background: C.cellBg, textAlign: 'center' } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Taille</div><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{data.height_cm}<span style={{ fontSize: 10, color: C.muted }}> cm</span></div></div>}
                  {profileWeight && <div data-testid="beneficiary-profile-weight-value" style={{ padding: '10px', borderRadius: 12, background: C.cellBg, textAlign: 'center' } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Poids</div><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{profileWeight}<span style={{ fontSize: 10, color: C.muted }}> kg</span></div></div>}
                  {data.height_cm && profileWeight && <div style={{ padding: '10px', borderRadius: 12, background: C.cellBg, textAlign: 'center' } as any}><div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>IMC</div><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{(profileWeight / Math.pow(data.height_cm / 100, 2)).toFixed(1)}</div></div>}
                </div>
              </div>
            )}
            <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, padding: '16px', marginBottom: 12, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-stethoscope-line" style={{ fontSize: 13, color: '#F59E0B' }} />Dossier medical</div>
              <div style={{ display: 'grid', gap: 8 } as any}>
                <div style={{ padding: '12px', borderRadius: 14, background: data.blood_type ? 'rgba(239,68,68,0.06)' : C.cellBg, border: data.blood_type ? '1px solid rgba(239,68,68,0.12)' : `1px solid ${C.cellBorder}` } as any}><div style={{ fontSize: 9, color: data.blood_type ? '#EF4444' : C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Groupe sanguin</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{data.blood_type || 'Non renseigne'}</div></div>
                <div style={{ padding: '12px', borderRadius: 14, background: (data.medical_conditions && data.medical_conditions !== 'Aucune') ? 'rgba(245,158,11,0.06)' : C.cellBg, border: (data.medical_conditions && data.medical_conditions !== 'Aucune') ? '1px solid rgba(245,158,11,0.12)' : `1px solid ${C.cellBorder}` } as any}><div style={{ fontSize: 9, color: (data.medical_conditions && data.medical_conditions !== 'Aucune') ? '#F59E0B' : C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Pathologies</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{data.medical_conditions || 'Aucune'}</div></div>
                <div style={{ padding: '12px', borderRadius: 14, background: (data.allergies && data.allergies !== 'Aucune') ? 'rgba(239,68,68,0.06)' : C.cellBg, border: (data.allergies && data.allergies !== 'Aucune') ? '1px solid rgba(239,68,68,0.12)' : `1px solid ${C.cellBorder}` } as any}><div style={{ fontSize: 9, color: (data.allergies && data.allergies !== 'Aucune') ? '#EF4444' : C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Allergies</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{data.allergies || 'Aucune'}</div></div>
              </div>
            </div>
            {/* Permissions */}
            {guardianPerms && (
              <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, padding: '16px', marginBottom: 12, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-notification-3-line" style={{ fontSize: 13, color: '#F59E0B' }} />Mes preferences</div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>Notifications pour {firstName}.</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.sepLight}` } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 16, color: guardianPerms.guardian_alerts_enabled ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Alertes</span></div>
                  <div onClick={() => { const next = !guardianPerms.guardian_alerts_enabled; setGuardianPerms((p: any) => ({ ...p, guardian_alerts_enabled: next })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_alerts_enabled: next }) }, token).catch(() => {}); }} style={{ width: 44, height: 26, borderRadius: 13, background: guardianPerms.guardian_alerts_enabled ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 20, height: 20, borderRadius: 10, background: '#FFF', position: 'absolute', top: 3, left: guardianPerms.guardian_alerts_enabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } as any} /></div>
                </div>
                {guardianPerms.guardian_alerts_enabled && guardianPerms.alerts_enabled && (<>
                  <div onClick={() => setExpandedPerm(expandedPerm === 'alerts' ? null : 'alerts')} style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className={expandedPerm === 'alerts' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 14 }} />{expandedPerm === 'alerts' ? 'Masquer' : 'Personnaliser les alertes'}</div>
                  {expandedPerm === 'alerts' && (<div style={{ paddingLeft: 4 } as any}>{Object.entries(guardianPerms.guardian_alert_types || {}).map(([key, val]: [string, any]) => { const labels: Record<string, string> = { fall: 'Chute', heart_rate: 'Freq. cardiaque', inactivity: 'Inactivite', sos_manual: 'SOS manuel', temperature: 'Temperature', spo2: 'SpO2', blood_pressure: 'Tension', weight: 'Poids', pulse: 'Pouls' }; const benGranted = guardianPerms.alert_types?.[key]; return (<div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.sepLight}` } as any}><span style={{ flex: 1, fontSize: 12, color: benGranted ? C.text : C.label, fontWeight: 500 }}>{labels[key] || key}{!benGranted ? ' (non partage)' : ''}</span><div onClick={() => { if (!benGranted) return; const next2 = { ...guardianPerms.guardian_alert_types, [key]: !val }; setGuardianPerms((p: any) => ({ ...p, guardian_alert_types: next2 })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_alert_types: next2 }) }, token).catch(() => {}); }} style={{ width: 38, height: 22, borderRadius: 11, background: (val && benGranted) ? '#10B981' : C.toggleBg, cursor: benGranted ? 'pointer' : 'default', position: 'relative', transition: 'background 0.2s', opacity: benGranted ? 1 : 0.3 } as any}><div style={{ width: 16, height: 16, borderRadius: 8, background: '#FFF', position: 'absolute', top: 3, left: (val && benGranted) ? 19 : 3, transition: 'left 0.2s' } as any} /></div></div>); })}</div>)}
                </>)}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.sepLight}` } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 16, color: guardianPerms.guardian_health_enabled ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Donnees de sante</span></div>
                  <div onClick={() => { const next = !guardianPerms.guardian_health_enabled; setGuardianPerms((p: any) => ({ ...p, guardian_health_enabled: next })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_health_enabled: next }) }, token).catch(() => {}); }} style={{ width: 44, height: 26, borderRadius: 13, background: guardianPerms.guardian_health_enabled ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 20, height: 20, borderRadius: 10, background: '#FFF', position: 'absolute', top: 3, left: guardianPerms.guardian_health_enabled ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } as any} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-map-pin-line" style={{ fontSize: 16, color: guardianPerms.guardian_location_accepted ? '#10B981' : C.muted }} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Localisation</span></div>
                  <div onClick={() => { const next = !guardianPerms.guardian_location_accepted; setGuardianPerms((p: any) => ({ ...p, guardian_location_accepted: next })); apiFetch(`/api/guardian-permissions/${user?.id}/${activeBid}/guardian`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardian_location_accepted: next }) }, token).catch(() => {}); }} style={{ width: 44, height: 26, borderRadius: 13, background: guardianPerms.guardian_location_accepted ? '#10B981' : C.toggleBg, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}><div style={{ width: 20, height: 20, borderRadius: 10, background: '#FFF', position: 'absolute', top: 3, left: guardianPerms.guardian_location_accepted ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } as any} /></div>
                </div>
                {guardianPerms.location_mode !== 'never' && guardianPerms.guardian_location_accepted && (<div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>Mode: {guardianPerms.location_mode === 'always' ? 'Tout le temps' : "En cas d'alerte uniquement"}</div>)}
              </div>
            )}
            {/* Alert History */}
            {historyAlerts.length > 0 && (<div style={{ marginTop: 4 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-alarm-line" style={{ fontSize: 13, color: '#F59E0B' }} />Historique ({historyAlerts.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                {historyAlerts.slice(0, 6).map((alert: any) => (
                  <div key={alert.id} onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: alert.id } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.sep}`, cursor: 'pointer' } as any}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: alert.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={alert.status === 'resolved' ? 'ri-checkbox-circle-line' : 'ri-alarm-warning-line'} style={{ fontSize: 14, color: alert.status === 'resolved' ? '#10B981' : '#F59E0B' }} /></div>
                    <div style={{ flex: 1, minWidth: 0 } as any}><div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{alert.message || alert.alert_type}</div><div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{new Date(alert.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div>
                    <div style={{ padding: '2px 8px', borderRadius: 99, background: alert.status === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', flexShrink: 0 } as any}><span style={{ fontSize: 9, fontWeight: 700, color: alert.status === 'resolved' ? '#10B981' : '#F59E0B' }}>{alert.status === 'resolved' ? 'Resolue' : 'Cloturee'}</span></div>
                  </div>
                ))}
              </div>
            </div>)}
          </div>
        )}

        {/* TAB: LOCALISATION */}
        {activeTab === 'localisation' && (
          <div style={{ padding: '0 20px', marginBottom: 24, animation: 'bd-fade 300ms ease both' } as any}>
            <div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, padding: '14px', marginBottom: 12, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', marginBottom: 6 }}>Position du beneficiaire</div>
              <div style={{ fontSize: 13, color: C.addressTxt, lineHeight: 1.5 }} data-testid="beneficiary-safezone-location-value">{geoLocation?.latitude != null && geoLocation?.longitude != null ? `${Number(geoLocation.latitude).toFixed(5)}, ${Number(geoLocation.longitude).toFixed(5)}${geoLocation?.updated_at ? ` · MAJ ${new Date(geoLocation.updated_at).toLocaleString('fr-FR')}` : ''}` : 'Localisation non disponible.'}</div>
            </div>
            <div data-testid="beneficiary-safezone-map" style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.sep}`, background: C.cellBg, marginBottom: 14, minHeight: 220 } as any}>
              {geoLocation?.latitude != null && geoLocation?.longitude != null ? (<iframe title="beneficiary-safezone-map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(geoLocation.longitude) - 0.01},${Number(geoLocation.latitude) - 0.01},${Number(geoLocation.longitude) + 0.01},${Number(geoLocation.latitude) + 0.01}&layer=mapnik&marker=${Number(geoLocation.latitude)},${Number(geoLocation.longitude)}`} style={{ width: '100%', height: 220, border: 'none' } as any} />) : (<div style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.mapEmptyTxt, gap: 8 } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 28 }} /><div style={{ fontSize: 12 }} data-testid="beneficiary-safezone-map-empty">Carte indisponible</div></div>)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-shield-check-line" style={{ fontSize: 13, color: '#34D399' }} /><span data-testid="beneficiary-safezone-count">{geoLoading ? 'Chargement...' : `Safe zones (${geoZones.length})`}</span></div>
              <div data-testid="beneficiary-safezone-open-create-popup-btn" onClick={openCreateZonePopup} style={{ padding: '5px 12px', borderRadius: 99, cursor: geoLocation?.latitude != null ? 'pointer' : 'not-allowed', background: geoLocation?.latitude != null ? 'rgba(16,185,129,0.14)' : 'rgba(107,114,128,0.12)', border: geoLocation?.latitude != null ? '1px solid rgba(16,185,129,0.28)' : '1px solid rgba(107,114,128,0.28)', fontSize: 10, fontWeight: 700, color: geoLocation?.latitude != null ? '#34D399' : '#9CA3AF' } as any}>+ Ajouter</div>
            </div>
            {geoZones.length > 0 ? (<div style={{ borderRadius: 18, background: C.card, border: `1px solid ${C.sep}`, overflow: 'hidden', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              {geoZones.map((zone: any, zi: number) => (<div key={zone.id} data-testid={`beneficiary-safezone-row-${zone.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: zi < geoZones.length - 1 ? `1px solid ${C.sepLight}` : 'none' } as any}><div style={{ width: 8, height: 8, borderRadius: 99, background: '#10B981', flexShrink: 0 } as any} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{zone.name}</div><div style={{ fontSize: 10, color: C.sub }}>{Math.round(Number(zone.radius_m || 0))}m</div></div><div data-testid={`beneficiary-safezone-edit-btn-${zone.id}`} onClick={() => startGeoEdit(zone)} style={{ padding: '4px 10px', borderRadius: 99, cursor: 'pointer', background: 'rgba(59,130,246,0.12)', fontSize: 10, fontWeight: 700, color: '#93C5FD' } as any}>Modifier</div><div data-testid={`beneficiary-safezone-delete-btn-${zone.id}`} onClick={() => deleteGeoZone(zone.id)} style={{ padding: '4px 8px', borderRadius: 99, cursor: geoBusyId === zone.id ? 'wait' : 'pointer', background: 'rgba(239,68,68,0.1)', fontSize: 10, fontWeight: 700, color: '#F87171', opacity: geoBusyId === zone.id ? 0.5 : 1 } as any}>Suppr.</div></div>))}
            </div>) : !geoLoading && (<div style={{ fontSize: 12, color: C.sub, textAlign: 'center', padding: '16px 0' }}>Aucune safe zone configuree.</div>)}
          </div>
        )}

        <div style={{ height: 90 } as any} />

        {/* MODALS */}
        {selectedGuardian && (() => {
          const activity = getGuardianActivity(selectedGuardian); const extra = getGuardianContractDetails(selectedGuardian);
          const gName = selectedGuardian.name || ''; const gInitials = gName.split(' ').map((w: string) => w.charAt(0)).join('').toUpperCase().slice(0, 2);
          const gPhone = selectedGuardian.phone || extra?.phone || ''; const gEmail = extra?.email || selectedGuardian.email || '';
          const gAddress = [extra?.address, extra?.postal_code, extra?.city].filter(Boolean).join(', ');
          const gRelation = selectedGuardian.relationship || selectedGuardian.guardian_type || 'Gardien';
          return (
            <div data-testid="guardian-detail-modal" onClick={() => setSelectedGuardian(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1190, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.3)', overflowY: 'auto', WebkitOverflowScrolling: 'touch', animation: 'bd-fade 200ms ease' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}><div data-testid="guardian-detail-close-btn" onClick={() => setSelectedGuardian(null)} style={{ width: 38, height: 38, borderRadius: 12, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: C.sub }} /></div></div>
                <div style={{ borderRadius: 22, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', border: `1px solid ${C.sep}`, padding: 24, animation: 'bd-pop 220ms ease both', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                  <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #34D399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '2px solid rgba(52,211,153,0.4)', boxShadow: '0 8px 24px rgba(52,211,153,0.2)' } as any}><span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{gInitials}</span></div>
                    <div data-testid="guardian-detail-name" style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>{gName}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 99, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' } as any}><i className="ri-shield-user-line" style={{ fontSize: 11, color: '#34D399' }} /><span data-testid="guardian-detail-role" style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>{gRelation}</span></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } as any}>
                    {gPhone && <div data-testid="guardian-detail-phone" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: C.cellBg, border: `1px solid ${C.sep}` } as any}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-phone-line" style={{ fontSize: 15, color: '#60A5FA' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Telephone</div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{gPhone}</div></div></div>}
                    {gEmail && <div data-testid="guardian-detail-email" onClick={() => window.open(`mailto:${gEmail}`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: C.cellBg, border: `1px solid ${C.sep}`, cursor: 'pointer' } as any}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-mail-line" style={{ fontSize: 15, color: '#A78BFA' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Email</div><div style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA' }}>{gEmail}</div></div></div>}
                    {gAddress && <div data-testid="guardian-detail-address" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: C.cellBg, border: `1px solid ${C.sep}` } as any}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-map-pin-line" style={{ fontSize: 15, color: '#F59E0B' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Adresse</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{gAddress}</div></div></div>}
                    <div data-testid="guardian-detail-type" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: C.cellBg, border: `1px solid ${C.sep}` } as any}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-user-star-line" style={{ fontSize: 15, color: '#22D3EE' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Type</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{selectedGuardian.guardian_type === 'saad' ? 'SAAD' : selectedGuardian.guardian_type === 'company' ? 'Entreprise' : 'Particulier'}</div></div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
                    {gPhone && <div data-testid="guardian-call-btn" onClick={() => window.open(`tel:${gPhone}`, '_self')} style={{ flex: 1, padding: '14px', borderRadius: 14, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#10B981' } as any}><i className="ri-phone-fill" style={{ fontSize: 16 }} />Appeler</div>}
                    {gPhone && <div data-testid="guardian-sms-btn" onClick={() => window.open(`sms:${gPhone}`, '_self')} style={{ flex: 1, padding: '14px', borderRadius: 14, cursor: 'pointer', background: C.btnBg, border: `1px solid ${C.btnBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.text } as any}><i className="ri-message-3-line" style={{ fontSize: 16 }} />SMS</div>}
                  </div>
                  <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}><i className="ri-history-line" style={{ fontSize: 13, color: '#A5B4FC' }} /><span style={{ fontSize: 10, fontWeight: 800, color: '#A5B4FC', textTransform: 'uppercase', letterSpacing: 1 }}>Activite</span></div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}><div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>Actions</div><div data-testid="guardian-detail-activity-count" style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{activity.count}</div></div><div style={{ flex: 2, padding: '8px 10px', borderRadius: 10, background: C.cellBg } as any}><div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>Derniere</div><div data-testid="guardian-detail-last-action" style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{activity.lastActionAt ? new Date(activity.lastActionAt).toLocaleString('fr-FR') : 'Aucune'}</div></div></div>
                    {activity.recentAlerts.length > 0 ? activity.recentAlerts.map((a: any) => (<div key={a.id} data-testid={`guardian-detail-activity-item-${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: `1px solid ${C.sepLight}` } as any}><div style={{ width: 5, height: 5, borderRadius: 3, background: '#A5B4FC', flexShrink: 0 } as any} /><span style={{ fontSize: 11, color: C.sub, flex: 1 }}>{a.message || a.alert_type}</span><span style={{ fontSize: 9, color: C.muted }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>)) : <div data-testid="guardian-detail-activity-empty" style={{ fontSize: 11, color: C.faint, textAlign: 'center', padding: '6px 0' }}>Aucune action enregistree</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {showContractPopup && subscription && (
          <div data-testid="contract-detail-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1185, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div data-testid="contract-detail-close-btn" onClick={() => setShowContractPopup(false)} style={{ width: 38, height: 38, borderRadius: 12, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: C.sub }} /></div></div>
              <div style={{ borderRadius: 22, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', border: `1px solid ${C.sep}`, padding: 20, animation: 'bd-pop 220ms ease both', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 3 }} data-testid="contract-detail-title">Contrat {subscription.subscription_type === 'care' ? 'Care' : 'Standard'}</div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }} data-testid="contract-detail-status">Statut: {subscription.status || 'N/A'}</div>
                <div style={{ display: 'grid', gap: 8 } as any}>
                  <div style={{ padding: '12px', borderRadius: 14, background: C.card } as any}><div style={{ fontSize: 9, color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Souscription</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 3 }} data-testid="contract-detail-created-at">{subscription.created_at ? new Date(subscription.created_at).toLocaleDateString('fr-FR') : 'N/A'}</div></div>
                  <div style={{ padding: '12px', borderRadius: 14, background: C.card } as any}><div style={{ fontSize: 9, color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Offre</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 3 }} data-testid="contract-detail-plan">{contract?.plan_label || (subscription.subscription_type === 'care' ? 'Chutex Care' : 'Standard')}</div></div>
                  <div style={{ padding: '12px', borderRadius: 14, background: C.card } as any}><div style={{ fontSize: 9, color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>Paiement</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 3 }} data-testid="contract-detail-payment">{contract?.price_monthly ? `${contract.price_monthly} EUR / mois` : 'N/A'}</div></div>
                  <div style={{ padding: '12px', borderRadius: 14, background: C.card } as any}><div style={{ fontSize: 9, color: C.faint, fontWeight: 700, textTransform: 'uppercase' }}>N contrat</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 3 }} data-testid="contract-detail-number">{contract?.contract_number || 'N/A'}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {geoFormOpen && (
          <div data-testid="safezone-form-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div data-testid="safezone-form-close-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ width: 38, height: 38, borderRadius: 12, background: C.card, border: `1px solid ${C.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: C.sub }} /></div></div>
              <div style={{ borderRadius: 22, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', border: `1px solid ${C.sep}`, padding: 20, animation: 'bd-pop 220ms ease both', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }} data-testid="safezone-form-modal-title">{geoEditingId ? 'Modifier la safe zone' : 'Nouvelle safe zone'}</div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 14 }} data-testid="safezone-form-center-info">Centre: {Number(geoFormLat || 0).toFixed(5)}, {Number(geoFormLng || 0).toFixed(5)}</div>
                <div style={{ display: 'grid', gap: 10 } as any}>
                  <input data-testid="safezone-form-name-input" value={geoFormName} onChange={(e: any) => setGeoFormName(e.target.value)} placeholder="Nom de la zone" style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.sep}`, background: C.toggleBg, color: C.text, fontSize: 14, outline: 'none' } as any} />
                  <input data-testid="safezone-form-radius-input" value={geoFormRadius} onChange={(e: any) => setGeoFormRadius(e.target.value)} placeholder="Rayon en metres" style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${C.sep}`, background: C.toggleBg, color: C.text, fontSize: 14, outline: 'none' } as any} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 } as any}>
                  <div data-testid="safezone-form-cancel-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', background: C.toggleBg, border: `1px solid ${C.sep}`, fontSize: 13, fontWeight: 700, color: C.text } as any}>Annuler</div>
                  <div data-testid="safezone-form-save-btn" onClick={saveGeoForm} style={{ flex: 1, padding: '12px', borderRadius: 14, cursor: geoFormSaving ? 'wait' : 'pointer', textAlign: 'center', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 13, fontWeight: 800, color: '#34D399', opacity: geoFormSaving ? 0.6 : 1 } as any}>{geoFormSaving ? 'Enregistrement...' : (geoEditingId ? 'Enregistrer' : 'Creer')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
