import React, { useState, useEffect, useCallback } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
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
  const [resolvedBid, setResolvedBid] = useState('');
  const [loading, setLoading] = useState(true);

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
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Beneficiaire non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <NativePageView path={`/beneficiary-detail?beneficiaryId=${activeBid || ''}`} />;

  const v = data.latest_vitals || {};
  const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'pending');
  const historyAlerts = alerts.filter((a: any) => a.status !== 'active' && a.status !== 'pending');
  const bracelet = devices?.bracelet || null;
  const scale = devices?.scale || null;
  const vest = devices?.vest || null;
  const Sep = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0' } as any} />;

  const GlassCard = ({ children, style }: any) => (
    <div
      style={{
        padding: '16px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        marginBottom: 12,
        animation: 'beneficiary-fade-in 280ms ease both',
        transition: 'transform 220ms ease, border-color 220ms ease',
        ...style,
      } as any}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = style?.border || 'rgba(255,255,255,0.08)';
      }}
    >
      {children}
    </div>
  );

  const SectionTitle = ({ icon, label, color }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 2 } as any}>
      <i className={icon} style={{ fontSize: 15, color }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
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
  const profileWeight = data.weight_kg || (d.weight && d.weight > 0 ? d.weight : null);

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
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
      <style>{`
        @keyframes beneficiary-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes beneficiary-popup-in {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: 1200, margin: '0 auto' } as any}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 } as any}>
          <div data-testid="beneficiary-detail-back-button" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1.05 }} data-testid="beneficiary-firstname-value">{firstName}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.92)', lineHeight: 1.1 }} data-testid="beneficiary-lastname-value">{lastName}</div>
        </div>

        {/* ── ALERTE ACTIVE ── */}
        {activeAlerts.length > 0 && (
          <div data-testid="beneficiary-active-alert-card" onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: activeAlerts[0].id } })} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#EF4444' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Alerte active</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{activeAlerts[0].message || 'Intervention en cours'}</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}

        {/* ── NORA ANALYSE ── */}
        {noraAnalysis && (
          <GlassCard style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(139,92,246,0.03))', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-sparkling-2-line" style={{ fontSize: 14, color: '#A78BFA' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Analyse Nora</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{noraAnalysis}</div>
          </GlassCard>
        )}

        {/* ── CONSTANTES VITALES ── */}
        <SectionTitle icon="ri-heart-pulse-line" label="Constantes vitales" color="#EF4444" />
        <GlassCard>
          {metrics.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 } as any}>
              {metrics.map((m, i) => (
                <div key={i} data-testid={`beneficiary-vital-card-${m.label.toLowerCase().replace(/\s+/g, '-')}`} style={{ padding: '12px 10px', borderRadius: 16, background: `${m.color}08`, border: `1px solid ${m.color}18` } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 } as any}>
                    <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
                    <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 600 }}>{m.unit}</div>
                </div>
              ))}
            </div>
          ) : (
            <div data-testid="beneficiary-vitals-empty" style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Aucune constante disponible</div>
          )}
        </GlassCard>

        {/* ── PROFIL + DOSSIER MEDICAL ── */}
        <SectionTitle icon="ri-file-medical-line" label="Profil & Dossier medical" color="#A78BFA" />
        <GlassCard>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
            {[
              { label: 'Adresse', val: addressDisplay, color: '#FFF', testid: 'beneficiary-profile-address-value' },
              { label: 'Age', val: ageYears != null ? `${ageYears} ans` : 'N/A', color: '#FFF', testid: 'beneficiary-profile-age-value' },
              { label: 'Genre', val: genderLabel, color: '#FFF', testid: 'beneficiary-profile-gender-value' },
              data.blood_type && { label: 'Groupe sanguin', val: data.blood_type, color: '#EF4444', testid: 'beneficiary-profile-blood-value' },
              (data.height_cm || profileWeight) && { label: 'Taille / Poids', val: [data.height_cm && `${data.height_cm} cm`, profileWeight && `${profileWeight} kg`].filter(Boolean).join(' · '), color: '#FFF', testid: 'beneficiary-profile-size-weight-value' },
            ].filter(Boolean).map((item: any, i: number) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                <div data-testid={item.testid} style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
          {data.medical_conditions && <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 6 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 3 }}>Pathologies</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>{data.medical_conditions}</div></div>}
          {data.allergies && <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 6 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: 3 }}>Allergies</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>{data.allergies}</div></div>}
        </GlassCard>

        {/* ── DISPOSITIFS ── */}
        <SectionTitle icon="ri-bluetooth-connect-line" label="Dispositifs" color="#22D3EE" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 } as any}>
          {devList.map((dev, i) => {
            const isVest = dev.type === 'vest';
            const vestAct = isVest && dev.d?.last_sync && (Date.now() - new Date(dev.d.last_sync).getTime()) < 30000;
            const statusLabel = !dev.d ? 'Non associe' : isVest ? (vestAct ? 'Actif' : 'Veille') : (dev.d?.connected ? 'OK' : 'Off');
            const statusColor = !dev.d ? '#6B7280' : isVest ? (vestAct ? '#10B981' : '#F59E0B') : (dev.d?.connected ? '#10B981' : '#6B7280');
            const bat = dev.d?.battery_level ?? 0;
            return (
              <div key={i} data-testid={`beneficiary-device-card-${dev.type}`} style={{ flex: '1 1 120px', minWidth: 110, padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
                <img src={dev.img} alt="" style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto 6px', display: 'block', opacity: dev.d ? 1 : 0.25 } as any} />
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{dev.label}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: `${statusColor}18` } as any}>
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: statusColor } as any} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
                </div>
                {bat > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: bat > 30 ? '#10B981' : '#EF4444', marginTop: 4 }}>{bat}%</div>}
              </div>
            );
          })}
        </div>

        {/* ── GARDIENS ── */}
        <SectionTitle icon="ri-team-line" label="Liste des gardiens" color="#34D399" />
        <GlassCard>
          {guardiansList.length > 0 ? guardiansList.map((g: any, i: number) => (
            <div key={g.id || i} data-testid={`beneficiary-guardian-card-${g.id || i}`} onClick={() => setSelectedGuardian(g)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < guardiansList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer' } as any}>
              <div style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(52,211,153,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#34D399' }}>{g.name?.charAt(0)}</span>
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{g.relationship || g.guardian_type || 'Gardien'}{g.phone ? ` · ${g.phone}` : ''}</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ color: 'rgba(255,255,255,0.35)' }} />
            </div>
          )) : (
            <div data-testid="beneficiary-guardians-empty" style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '10px 0' } as any}>Aucun gardien associe</div>
          )}
        </GlassCard>

        {/* ── SAFE ZONES ── */}
        <SectionTitle icon="ri-shield-check-line" label="Safe zones" color="#34D399" />
        <GlassCard>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 10 } as any}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }} data-testid="beneficiary-safezone-count">
              {geoLoading ? 'Chargement...' : `${geoZones.length} zone(s) configuree(s)`}
            </div>
            <div data-testid="beneficiary-safezone-open-create-popup-btn" onClick={openCreateZonePopup} style={{ padding: '9px 12px', borderRadius: 999, cursor: geoLocation?.latitude != null ? 'pointer' : 'not-allowed', textAlign: 'center', background: geoLocation?.latitude != null ? 'rgba(16,185,129,0.14)' : 'rgba(107,114,128,0.12)', border: geoLocation?.latitude != null ? '1px solid rgba(16,185,129,0.28)' : '1px solid rgba(107,114,128,0.28)', fontSize: 11, fontWeight: 700, color: geoLocation?.latitude != null ? '#34D399' : '#9CA3AF' } as any}>
              Definir une zone depuis la localisation
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Position beneficiaire</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }} data-testid="beneficiary-safezone-location-value">
              {geoLocation?.latitude != null && geoLocation?.longitude != null
                ? `${Number(geoLocation.latitude).toFixed(5)}, ${Number(geoLocation.longitude).toFixed(5)}${geoLocation?.updated_at ? ` · MAJ ${new Date(geoLocation.updated_at).toLocaleString('fr-FR')}` : ''}`
                : 'Localisation non disponible. Le beneficiaire doit autoriser la localisation en mode Toujours.'}
            </div>
          </div>

          <div data-testid="beneficiary-safezone-map" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', marginBottom: 10, minHeight: 210 } as any}>
            {geoLocation?.latitude != null && geoLocation?.longitude != null ? (
              <iframe
                title="beneficiary-safezone-map"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(geoLocation.longitude) - 0.01},${Number(geoLocation.latitude) - 0.01},${Number(geoLocation.longitude) + 0.01},${Number(geoLocation.latitude) + 0.01}&layer=mapnik&marker=${Number(geoLocation.latitude)},${Number(geoLocation.longitude)}`}
                style={{ width: '100%', height: 210, border: 'none' } as any}
              />
            ) : (
              <div style={{ minHeight: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: 6 } as any}>
                <i className="ri-map-pin-off-line" style={{ fontSize: 24 }} />
                <div style={{ fontSize: 12 }} data-testid="beneficiary-safezone-map-empty">Carte indisponible sans localisation beneficiaire.</div>
              </div>
            )}
          </div>

          {geoZones.map((zone: any) => (
            <div key={zone.id} data-testid={`beneficiary-safezone-row-${zone.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' } as any}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: '#10B981' } as any} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{zone.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{Math.round(Number(zone.radius_m || 0))}m · {Number(zone.latitude).toFixed(4)}, {Number(zone.longitude).toFixed(4)}</div>
              </div>
              <div data-testid={`beneficiary-safezone-edit-btn-${zone.id}`} onClick={() => startGeoEdit(zone)} style={{ padding: '5px 8px', borderRadius: 999, cursor: 'pointer', background: 'rgba(59,130,246,0.15)', fontSize: 10, fontWeight: 700, color: '#93C5FD' } as any}>
                Modifier
              </div>
              <div data-testid={`beneficiary-safezone-delete-btn-${zone.id}`} onClick={() => deleteGeoZone(zone.id)} style={{ padding: '5px 7px', borderRadius: 999, cursor: geoBusyId === zone.id ? 'wait' : 'pointer', background: 'rgba(239,68,68,0.12)', fontSize: 10, fontWeight: 700, color: '#F87171', opacity: geoBusyId === zone.id ? 0.5 : 1 } as any}>
                Suppr.
              </div>
            </div>
          ))}

          {!geoLoading && geoZones.length === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '8px 0' } as any}>Aucune safe zone configuree.</div>
          )}
        </GlassCard>

        {/* ── HISTORIQUE ALERTES ── */}
        {historyAlerts.length > 0 && (<>
          <Sep />
          <SectionTitle icon="ri-alarm-line" label={`Historique alertes (${historyAlerts.length})`} color="#F59E0B" />
          {historyAlerts.slice(0, 8).map((alert: any) => (
            <div key={alert.id} onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: alert.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6, cursor: 'pointer' } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: alert.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={alert.status === 'resolved' ? 'ri-checkbox-circle-line' : 'ri-alarm-warning-line'} style={{ fontSize: 15, color: alert.status === 'resolved' ? '#10B981' : '#F59E0B' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{alert.message || alert.alert_type}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{new Date(alert.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: 99, background: alert.status === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' } as any}>
                <span style={{ fontSize: 9, fontWeight: 700, color: alert.status === 'resolved' ? '#10B981' : '#F59E0B' }}>{alert.status === 'resolved' ? 'Resolue' : 'Cloturee'}</span>
              </div>
            </div>
          ))}
        </>)}

        {/* ── CONTRAT (EN BAS) ── */}
        <SectionTitle icon="ri-shield-star-line" label="Contrat" color="#7C3AED" />
        <div
          data-testid="beneficiary-contract-card"
          onClick={() => subscription && setShowContractPopup(true)}
          style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, height: 90, cursor: subscription ? 'pointer' : 'default', transition: 'transform 0.15s', opacity: subscription ? 1 : 0.8, marginBottom: 12 } as any}
          onMouseEnter={(e: any) => { if (subscription) e.currentTarget.style.transform = 'scale(1.01)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {subscription ? (
            <img
              src={subscription.subscription_type === 'care'
                ? 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png'
                : 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png'}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22 } as any}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.26), rgba(2,6,23,0.7))' } as any} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', borderRadius: 22 } as any} />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 22px' } as any}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', letterSpacing: -0.3 }} data-testid="beneficiary-contract-status-title">
                {subscription ? (subscription.subscription_type === 'care' ? 'Contrat Care' : 'Contrat Standard') : 'Aucun contrat'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }} data-testid="beneficiary-contract-status-subtitle">
                {subscription ? 'Touchez pour voir les details' : 'Aucune souscription enregistree'}
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: hasActiveContract ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.25)', border: `1px solid ${hasActiveContract ? 'rgba(16,185,129,0.4)' : 'rgba(107,114,128,0.45)'}` } as any}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: hasActiveContract ? '#10B981' : '#9CA3AF' } as any} />
              <span style={{ fontSize: 11, fontWeight: 700, color: hasActiveContract ? '#10B981' : '#D1D5DB' }}>{hasActiveContract ? 'Actif' : 'Inactif'}</span>
            </div>
          </div>
        </div>

        {selectedGuardian && (() => {
          const activity = getGuardianActivity(selectedGuardian);
          const extra = getGuardianContractDetails(selectedGuardian);
          return (
            <div data-testid="guardian-detail-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1190, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
              <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div data-testid="guardian-detail-close-btn" onClick={() => setSelectedGuardian(null)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>

                <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: 16, animation: 'beneficiary-popup-in 220ms ease both' } as any}>
                  <div data-testid="guardian-detail-name" style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 3 }}>{selectedGuardian.name}</div>
                  <div data-testid="guardian-detail-role" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>{selectedGuardian.relationship || selectedGuardian.guardian_type || 'Gardien'}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
                    <div style={{ padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' } as any}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Telephone</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }} data-testid="guardian-detail-phone">{selectedGuardian.phone || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' } as any}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Type</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }} data-testid="guardian-detail-type">{selectedGuardian.guardian_type || 'particular'}</div>
                    </div>
                  </div>

                  {extra?.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }} data-testid="guardian-detail-email">Email: {extra.email}</div>}
                  {extra?.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }} data-testid="guardian-detail-address">Adresse: {extra.address}{extra.city ? `, ${extra.city}` : ''}{extra.postal_code ? ` ${extra.postal_code}` : ''}</div>}

                  <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)' } as any}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#A5B4FC', textTransform: 'uppercase', marginBottom: 6 }}>Historique d activite</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 } as any}>
                      <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)' }} data-testid="guardian-detail-activity-count">Actions: {activity.count}</div>
                      <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)' }} data-testid="guardian-detail-last-action">Derniere: {activity.lastActionAt ? new Date(activity.lastActionAt).toLocaleString('fr-FR') : 'Aucune'}</div>
                    </div>
                    {activity.recentAlerts.length > 0 ? activity.recentAlerts.map((a: any) => (
                      <div key={a.id} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }} data-testid={`guardian-detail-activity-item-${a.id}`}>{a.message || a.alert_type} · {new Date(a.created_at).toLocaleDateString('fr-FR')}</div>
                    )) : <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }} data-testid="guardian-detail-activity-empty">Aucune action enregistree pour ce gardien.</div>}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {showContractPopup && subscription && (
          <div data-testid="contract-detail-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1185, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div data-testid="contract-detail-close-btn" onClick={() => setShowContractPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>

              <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: 16, animation: 'beneficiary-popup-in 220ms ease both' } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 3 }} data-testid="contract-detail-title">Contrat {subscription.subscription_type === 'care' ? 'Care' : 'Standard'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }} data-testid="contract-detail-status">Statut: {subscription.status || 'N/A'}</div>

                <div style={{ display: 'grid', gap: 8 } as any}>
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Date de souscription</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }} data-testid="contract-detail-created-at">{subscription.created_at ? new Date(subscription.created_at).toLocaleDateString('fr-FR') : 'N/A'}</div></div>
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Offre</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }} data-testid="contract-detail-plan">{contract?.plan_label || (subscription.subscription_type === 'care' ? 'Chutex Care' : 'Standard')}</div></div>
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Paiement</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }} data-testid="contract-detail-payment">{contract?.price_monthly ? `${contract.price_monthly} EUR / mois` : 'N/A'}</div></div>
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Numero contrat</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }} data-testid="contract-detail-number">{contract?.contract_number || 'N/A'}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {geoFormOpen && (
          <div data-testid="safezone-form-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div data-testid="safezone-form-close-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>

              <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: 16, animation: 'beneficiary-popup-in 220ms ease both' } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 4 }} data-testid="safezone-form-modal-title">{geoEditingId ? 'Modifier la safe zone' : 'Definir une safe zone'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }} data-testid="safezone-form-center-info">
                  Centre: {Number(geoFormLat || 0).toFixed(5)}, {Number(geoFormLng || 0).toFixed(5)}
                </div>

                <div style={{ display: 'grid', gap: 8 } as any}>
                  <input data-testid="safezone-form-name-input" value={geoFormName} onChange={(e: any) => setGeoFormName(e.target.value)} placeholder="Nom de la zone" style={{ padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#FFF' } as any} />
                  <input data-testid="safezone-form-radius-input" value={geoFormRadius} onChange={(e: any) => setGeoFormRadius(e.target.value)} placeholder="Rayon en metres" style={{ padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#FFF' } as any} />
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 } as any}>
                  <div data-testid="safezone-form-cancel-btn" onClick={() => { setGeoFormOpen(false); setGeoEditingId(null); }} style={{ flex: 1, padding: '10px 12px', borderRadius: 999, cursor: 'pointer', textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', fontSize: 12, fontWeight: 700, color: '#FFF' } as any}>Annuler</div>
                  <div data-testid="safezone-form-save-btn" onClick={saveGeoForm} style={{ flex: 1, padding: '10px 12px', borderRadius: 999, cursor: geoFormSaving ? 'wait' : 'pointer', textAlign: 'center', background: 'rgba(16,185,129,0.22)', border: '1px solid rgba(16,185,129,0.35)', fontSize: 12, fontWeight: 800, color: '#34D399', opacity: geoFormSaving ? 0.6 : 1 } as any}>{geoFormSaving ? 'Enregistrement...' : (geoEditingId ? 'Enregistrer' : 'Creer')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
