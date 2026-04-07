import React, { useState, useEffect, useRef } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const ALERT_LABELS: Record<string, string> = {
  fall: 'Chute détectée', heart_rate: 'Frequence cardiaque', inactivity: 'Inactivité prolongee',
  sos_manual: 'SOS manuel', temperature: 'Température', spo2: 'SpO2',
  blood_pressure: 'Tension arterielle', weight: 'Poids', pulse: 'Pouls',
};
const ALERT_ICONS: Record<string, string> = {
  fall: 'ri-walk-line', heart_rate: 'ri-heart-pulse-line', inactivity: 'ri-zzz-line',
  sos_manual: 'ri-alarm-warning-line', temperature: 'ri-temp-hot-line', spo2: 'ri-lungs-line',
  blood_pressure: 'ri-pulse-line', weight: 'ri-scales-3-line', pulse: 'ri-heart-line',
};
const HEALTH_LABELS: Record<string, string> = {
  heart_rate: 'Frequence cardiaque', blood_pressure: 'Tension arterielle', sleep: 'Sommeil',
  activity: 'Activité physique', weight: 'Poids', temperature: 'Température', spo2: 'SpO2',
};
const LOC_OPTIONS = [
  { value: 'never', label: 'Jamais', icon: 'ri-eye-off-line', color: '#EF4444' },
  { value: 'alert_only', label: 'En cas d\'alerte', icon: 'ri-alarm-line', color: '#F59E0B' },
  { value: 'always', label: 'Tout le temps', icon: 'ri-map-pin-line', color: '#10B981' },
];

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

export default function GuardianDétailScreen() {
  const params = useLocalSearchParams<{ guardianId: string; gName?: string; gPhone?: string; gEmail?: string; gRelationship?: string; gType?: string; gAddress?: string; gPostalCode?: string; gCity?: string; gCountry?: string; fromBeneficiary?: string }>();
  const { token, user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  // Expo Router web fallback
  const webParams = (() => { try { if (typeof window !== 'undefined' && window.location?.search) { const u = new URLSearchParams(window.location.search); return { guardianId: u.get('guardianId') || '', gName: u.get('gName') || '', gPhone: u.get('gPhone') || '', gEmail: u.get('gEmail') || '', gRelationship: u.get('gRelationship') || '', gType: u.get('gType') || '', gAddress: u.get('gAddress') || '', gPostalCode: u.get('gPostalCode') || '', gCity: u.get('gCity') || '', gCountry: u.get('gCountry') || '', fromBeneficiary: u.get('fromBeneficiary') || '' }; } } catch {} return { guardianId: '', gName: '', gPhone: '', gEmail: '', gRelationship: '', gType: '', gAddress: '', gPostalCode: '', gCity: '', gCountry: '', fromBeneficiary: '' }; })();

  const guardianId = params.guardianId || webParams.guardianId;
  const fromBeneficiary = params.fromBeneficiary || webParams.fromBeneficiary;
  const isFromBeneficiary = !!fromBeneficiary;

  const [guardian, setGuardian] = useState<any>(null);
  const [perms, setPerms] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* slide-to-call state */
  const [slideX, setSlideX] = useState(0);
  const [sliding, setSliding] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const slideStartX = useRef(0);
  const slideTrackW = useRef(0);
  const THUMB = 48;
  const THRESHOLD = 0.75;

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const check = () => setIsDark(localStorage.getItem('chutex_dark') === '1');
      check();
      const iv = setInterval(check, 400);
      return () => clearInterval(iv);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Try loading from beneficiary's guardians API first
        const guards = await apiFetch('/api/guardians/my', {}, token).catch(() => []);
        let found = (guards || []).find((g: any) => g.id === guardianId);
        if (!found) {
          const res = await apiFetch(`/api/company/prescriber/${guardianId}`, {}, token).catch(() => null);
          if (res?.prescriber) found = { ...res.prescriber, agency: res.agency };
          else if (res?.id || res?.name) found = res;
        }
        // Fallback: use URL params (when accessed from beneficiary-detail by a guardian)
        if (!found && isFromBeneficiary) {
          const fallbackName = params.gName || webParams.gName;
          const fallbackPhone = params.gPhone || webParams.gPhone;
          if (fallbackName) {
            found = {
              id: guardianId,
              name: decodeURIComponent(fallbackName),
              phone: decodeURIComponent(fallbackPhone || ''),
              email: decodeURIComponent(params.gEmail || webParams.gEmail || ''),
              relationship: decodeURIComponent(params.gRelationship || webParams.gRelationship || ''),
              guardian_type: decodeURIComponent(params.gType || webParams.gType || ''),
              address: decodeURIComponent(params.gAddress || webParams.gAddress || ''),
              postal_code: decodeURIComponent(params.gPostalCode || webParams.gPostalCode || ''),
              city: decodeURIComponent(params.gCity || webParams.gCity || ''),
              country: decodeURIComponent(params.gCountry || webParams.gCountry || ''),
            };
          }
        }
        setGuardian(found || null);
        // Load permissions only when beneficiary is viewing their own guardian
        if (found && user?.id && !isFromBeneficiary) {
          const p = await apiFetch(`/api/guardian-permissions/${guardianId}/${user.id}`, {}, token).catch(() => null);
          setPerms(p);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [guardianId, token]);

  const savePerms = async (updates: any) => {
    if (!user?.id || saving || isFromBeneficiary) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/guardian-permissions/${guardianId}/${user.id}/beneficiary`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
      }, token);
      setPerms(res);
    } catch {} finally { setSaving(false); }
  };

  /* slide handlers */
  const lastDxRef = useRef(0);
  const onSlideStart = (e: any) => {
    const el = slideRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    slideTrackW.current = rect.width - THUMB;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    slideStartX.current = clientX;
    lastDxRef.current = 0;
    setSliding(true);
    const move = (ev: any) => { const cx = ev.touches ? ev.touches[0].clientX : ev.clientX; const dx = Math.max(0, Math.min(cx - slideStartX.current, slideTrackW.current)); lastDxRef.current = dx; setSlideX(dx); };
    const end = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end);
      setSliding(false);
      if (lastDxRef.current / slideTrackW.current >= THRESHOLD && guardian?.phone) { window.open(`tel:${guardian.phone}`, '_self'); }
      setSlideX(0);
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move); document.addEventListener('touchend', end);
  };
  const slideProgress = slideTrackW.current > 0 ? slideX / slideTrackW.current : 0;

  if (loading) return <FullScreenLoader />;
  if (!guardian) return <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>Gardien non trouve</Text></SafeAreaView>;

  const isPro = guardian.guardian_type === 'professional' || guardian.guardian_type === 'saad' || guardian.guardian_type === 'company';
  if (Platform.OS !== 'web') return <NativePageView path="/guardian-detail" />;

  const C = isDark
    ? { text: '#FFF', sub: 'rgba(255,255,255,0.4)', muted: 'rgba(255,255,255,0.28)', faint: 'rgba(255,255,255,0.15)', sep: 'rgba(255,255,255,0.04)', label: 'rgba(255,255,255,0.3)', toggleBg: 'rgba(255,255,255,0.08)', toggleActive: '#10B981', contentBg: 'linear-gradient(180deg, #0C0C14 0%, #1C1C24 100%)', border: 'rgba(255,255,255,0.07)', card: 'rgba(70,70,78,0.85)', grey: 'rgba(255,255,255,0.05)', cardGrey: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.10)' }
    : { text: '#111827', sub: 'rgba(0,0,0,0.4)', muted: 'rgba(0,0,0,0.28)', faint: 'rgba(0,0,0,0.08)', sep: 'rgba(0,0,0,0.06)', label: 'rgba(0,0,0,0.3)', toggleBg: 'rgba(0,0,0,0.06)', toggleActive: '#10B981', contentBg: '#FAFAFA', border: 'rgba(0,0,0,0.06)', card: '#E8E8EA', grey: 'rgba(0,0,0,0.04)', cardGrey: '#ECEDF0', cardBorder: '#DDDEE2' };
  const guardianFirstName = (guardian.name || '').split(' ')[0] || guardian.name || '';

  const Toggle = ({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) => (
    <div onClick={disabled ? undefined : onToggle} style={{ width: 44, height: 26, borderRadius: 13, background: on ? C.toggleActive : C.toggleBg, cursor: disabled ? 'default' : 'pointer', position: 'relative', transition: 'background 0.2s', opacity: disabled ? 0.4 : 1, flexShrink: 0 } as any}>
      <div style={{ width: 20, height: 20, borderRadius: 10, background: '#FFF', position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } as any} />
    </div>
  );

  const SectionCard = ({ title, icon, expanded, onToggle, children, masterOn, onMasterToggle }: any) => (
    <div style={{ borderRadius: 16, background: C.cardGrey, border: `1px solid ${C.cardBorder}`, marginBottom: 14, overflow: 'hidden' } as any}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' } as any}>
        <i className={icon} style={{ fontSize: 18, color: masterOn ? '#10B981' : C.sub }} />
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
          <div style={{ fontSize: 11, color: masterOn ? '#10B981' : C.sub, marginTop: 1 }}>{masterOn ? t('active') : 'Désactivé'}</div>
        </div>
        <Toggle on={masterOn} onToggle={(e: any) => { e?.stopPropagation?.(); onMasterToggle(); }} />
        <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: C.sub, marginLeft: 4 }} />
      </div>
      {expanded && masterOn && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${C.sep}` } as any}>{children}</div>
      )}
    </div>
  );

  return (
    <div data-testid="guardian-detail-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <style>{`@keyframes gd-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes gd-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes gd-chevron{0%,100%{transform:translateX(0);opacity:.4}50%{transform:translateX(6px);opacity:1}}`}</style>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch', height: '100%' } as any}>

        {/* ══ HEADER with BG image ══ */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG_RED} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 44px' } as any}>
            {/* Back button */}
            <div data-testid="guardian-back-btn" onClick={() => {
              try { router.back(); } catch { router.push('/(tabs)' as any); }
            }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 18 } as any}>
              <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
            </div>

            {/* Avatar + Name */}
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <div style={{ width: 68, height: 68, borderRadius: 999, background: guardian.avatar_url ? 'transparent' : 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto 10px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                {guardian.avatar_url
                  ? <img src={guardian.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                  : <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{guardian.name?.charAt(0)}</span>
                }
              </div>
              <div data-testid="guardian-detail-name" style={{ fontSize: 24, fontWeight: 800, color: '#FFF', letterSpacing: -0.5, lineHeight: 1.15 }}>{guardian.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginTop: 4 }}>Fiche gardien</div>
              {/* Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 } as any}>
                <div style={{ padding: '4px 12px', borderRadius: 999, background: isPro ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.12)', border: `1px solid ${isPro ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.15)'}` } as any}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isPro ? '#C4B5FD' : 'rgba(255,255,255,0.7)' }}>{isPro ? 'Professionnel' : 'Particulier'}</span>
                </div>
                {guardian.relationship && (
                  <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' } as any}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6EE7B7' }}>{guardian.relationship}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SLIDE TO CALL */}
            {guardian.phone && (
              <div ref={slideRef} data-testid="guardian-slide-call-btn" style={{ position: 'relative', width: '100%', height: THUMB + 4, borderRadius: THUMB / 2 + 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' } as any}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${slideX + THUMB}px`, borderRadius: THUMB / 2 + 2, background: `rgba(16,185,129,${0.15 + slideProgress * 0.5})`, transition: sliding ? 'none' : 'width 0.3s ease, background 0.3s ease' } as any} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 1 - slideProgress * 1.5, transition: sliding ? 'none' : 'opacity 0.3s' } as any}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 }}>Glisser pour appeler {guardianFirstName}</span>
                  <i className="ri-arrow-right-double-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', animation: 'gd-chevron 1.5s ease-in-out infinite' }} />
                </div>
                <div onMouseDown={onSlideStart} onTouchStart={onSlideStart} style={{ position: 'absolute', top: 2, left: 2 + slideX, width: THUMB, height: THUMB, borderRadius: THUMB / 2, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', cursor: 'grab', transition: sliding ? 'none' : 'left 0.3s ease', zIndex: 2 } as any}>
                  <i className="ri-phone-fill" style={{ fontSize: 20, color: '#10B981' }} />
                </div>
                {slideProgress >= THRESHOLD && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.35)', borderRadius: THUMB / 2 + 2 } as any}><span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Appel en cours...</span></div>}
              </div>
            )}
          </div>
        </div>

        {/* ══ CONTENT (overlapping card) ══ */}
        <div style={{ padding: '0 20px 120px', marginTop: -16, borderRadius: '22px 22px 0 0', background: C.contentBg, position: 'relative', zIndex: 10, borderTop: `1px solid ${C.border}` } as any}>

          {/* Coordonnées */}
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, padding: '20px 0 10px' }}>Coordonnées</div>
          <div style={{ borderRadius: 16, background: C.cardGrey, border: `1px solid ${C.cardBorder}`, padding: '4px 16px', marginBottom: 4 } as any}>
            {[
              guardian.phone && { icon: 'ri-phone-line', label: t('phone_label'), value: guardian.phone, color: '#10B981' },
              guardian.email && { icon: 'ri-mail-line', label: t('email_label'), value: guardian.email, color: '#38BDF8' },
              guardian.address && { icon: 'ri-map-pin-line', label: t('address'), value: guardian.address, color: '#F59E0B' },
              guardian.postal_code && { icon: 'ri-hashtag', label: t('postal_code'), value: guardian.postal_code, color: '#F59E0B' },
              guardian.city && { icon: 'ri-building-line', label: t('city'), value: guardian.city, color: '#F59E0B' },
              guardian.country && { icon: 'ri-earth-line', label: 'Pays', value: guardian.country, color: '#F59E0B' },
            ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.sep}` : 'none' } as any}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={item.icon} style={{ fontSize: 14, color: item.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase', marginBottom: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SMS button removed per user request */}

          <div style={{ height: 1, background: C.sep, margin: '8px 0' } as any} />

          {/* ─── AUTORISATIONS (only for beneficiary viewing their own guardian) ─── */}
          {!isFromBeneficiary && perms && (<>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.2, padding: '20px 0 10px' }}>Autorisations</div>

            {/* Alertes */}
            <SectionCard title="Alertes" icon="ri-alarm-warning-line"
              expanded={expandedSection === 'alerts'} onToggle={() => setExpandedSection(expandedSection === 'alerts' ? null : 'alerts')}
              masterOn={perms.alerts_enabled} onMasterToggle={() => savePerms({ alerts_enabled: !perms.alerts_enabled })}>
              <div style={{ paddingTop: 12 } as any}>
                {Object.keys(ALERT_LABELS).map((key) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.sep}` } as any}>
                    <i className={ALERT_ICONS[key]} style={{ fontSize: 16, color: perms.alert_types?.[key] ? '#10B981' : C.sub, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{ALERT_LABELS[key]}</span>
                    <Toggle on={perms.alert_types?.[key] ?? true} onToggle={() => savePerms({ alert_types: { ...perms.alert_types, [key]: !perms.alert_types?.[key] } })} />
                  </div>
                ))}
                {!perms.guardian_alerts_enabled && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' } as any}>
                    <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}><i className="ri-information-line" style={{ marginRight: 6 }} />{guardianFirstName} a désactivé la reception des alertes de son cote</div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Données de santé */}
            <SectionCard title="Données de santé" icon="ri-heart-pulse-line"
              expanded={expandedSection === 'health'} onToggle={() => setExpandedSection(expandedSection === 'health' ? null : 'health')}
              masterOn={perms.health_data_enabled} onMasterToggle={() => savePerms({ health_data_enabled: !perms.health_data_enabled })}>
              <div style={{ paddingTop: 12 } as any}>
                {Object.keys(HEALTH_LABELS).map((key) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.sep}` } as any}>
                    <span style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{HEALTH_LABELS[key]}</span>
                    <Toggle on={perms.health_data_types?.[key] ?? true} onToggle={() => savePerms({ health_data_types: { ...perms.health_data_types, [key]: !perms.health_data_types?.[key] } })} />
                  </div>
                ))}
                {!perms.guardian_health_enabled && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' } as any}>
                    <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}><i className="ri-information-line" style={{ marginRight: 6 }} />{guardianFirstName} ne souhaite pas consulter vos donnees de sante</div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Localisation */}
            <div style={{ borderRadius: 16, background: C.cardGrey, border: `1px solid ${C.cardBorder}`, padding: '16px 18px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
                <i className="ri-map-pin-line" style={{ fontSize: 18, color: LOC_OPTIONS.find(o => o.value === perms.location_mode)?.color || C.sub }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t('location')}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>Qui peut voir votre position</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                {LOC_OPTIONS.map((opt) => (
                  <div key={opt.value} onClick={() => savePerms({ location_mode: opt.value })}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: perms.location_mode === opt.value ? `${opt.color}12` : 'transparent', border: `1px solid ${perms.location_mode === opt.value ? `${opt.color}30` : C.sep}`, transition: 'all 0.2s' } as any}>
                    <i className={opt.icon} style={{ fontSize: 16, color: perms.location_mode === opt.value ? opt.color : C.sub }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: perms.location_mode === opt.value ? opt.color : C.text }}>{opt.label}</span>
                    <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${perms.location_mode === opt.value ? opt.color : C.sub}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      {perms.location_mode === opt.value && <div style={{ width: 10, height: 10, borderRadius: 5, background: opt.color } as any} />}
                    </div>
                  </div>
                ))}
              </div>
              {!perms.guardian_location_accepted && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' } as any}>
                  <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}><i className="ri-information-line" style={{ marginRight: 6 }} />{guardianFirstName} a refuse l'acces a votre localisation</div>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: C.sep, margin: '8px 0' } as any} />
          </>)}

          {/* Lien depuis */}
          <div style={{ borderRadius: 16, background: C.cardGrey, border: `1px solid ${C.cardBorder}`, padding: '14px 18px', marginBottom: 14, marginTop: 10 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-links-line" style={{ fontSize: 14, color: C.sub }} />
              <div style={{ fontSize: 12, color: C.sub }}>Gardien depuis le <span style={{ color: C.text, fontWeight: 700 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
            </div>
          </div>

          {/* Delete — only for beneficiary managing their own guardian */}
          {!isFromBeneficiary && (
            <div onClick={() => { if (window.confirm(`Supprimer ${guardian.name} comme gardien ?`)) { apiFetch(`/api/guardians/${guardian.id}/unlink`, { method: 'POST' }, token).then(() => router.back()).catch(() => {}); } }}
              data-testid="guardian-delete-btn"
              style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />Supprimer ce gardien
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
