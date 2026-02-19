import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContextualTip, OnboardingChecklist, HelpBubble, MiniTuto, PageExplainer } from '../../src/components/HelpSystem';
import { DoctorCard } from '../../src/components/DoctorCard';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useI18n } from '../../src/context/I18nContext';
import { apiFetch } from '../../src/services/api';
import { requestNotificationPermission, startReminderChecker, notifyAlert, notifyIntervention } from '../../src/services/notifications';

const HEALTH_IMAGES = {
  heart: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/u3ch46l8_hearth%20red%20app%20healthbeat%20Chutex.png',
  blood: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  sleep: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tide9bdl_Moon%20sleep%20analys%20app%20health%20Chutex.png',
  physical: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
};

const REMINDER_IMAGES = {
  hydration: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png',
  medication: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/y3xje768_traitement.png',
  alarm: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/hzoi0qcr_alarmes.png',
};

const isDarkMode = true; // Will be connected to theme context later
const CHX = {
  bg: isDarkMode ? '#0b0f16' : '#f5f7fa',
  fg: isDarkMode ? '#f4f7ff' : '#0f172a',
  fgSub: isDarkMode ? 'rgba(255,255,255,.68)' : 'rgba(0,0,0,.58)',
  fgMuted: isDarkMode ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.35)',
  border: isDarkMode ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)',
  cardBg: isDarkMode ? 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))' : 'linear-gradient(180deg, rgba(255,255,255,.76), rgba(255,255,255,.54))',
  headerBg: isDarkMode
    ? 'linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.04)), radial-gradient(120% 120% at 12% 10%, #35507f 0%, #23355b 45%, #1a2742 100%)'
    : 'linear-gradient(145deg, rgba(255,255,255,.25), rgba(255,255,255,.18)), radial-gradient(140% 140% at 10% 10%, #ffb187 0%, #f39c70 30%, #cc9fbe 64%, #a9b8ea 100%)',
  bgClass: isDarkMode ? 'chx-bg-dark' : 'chx-bg-light',
  cardClass: isDarkMode ? 'chx-card-dark' : 'chx-card-light',
  headerClass: isDarkMode ? 'chx-header-dark' : 'chx-header-light',
  btnClass: isDarkMode ? 'chx-btn chx-btn-dark-primary' : 'chx-btn chx-btn-light-primary',
  btnDangerClass: isDarkMode ? 'chx-btn chx-btn-dark-danger' : 'chx-btn chx-btn-light-danger',
};

const webShadow = Platform.OS === 'web' ? { boxShadow: '0 12px 28px rgba(0,0,0,.18)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 4 };
const webGlass = Platform.OS === 'web' ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {};

/* ─── GLASS CARD (Chutex style) ─── */
const Card = ({ children, style, testID }: any) => {
  if (Platform.OS === 'web') {
    return <div data-testid={testID} className={CHX.cardClass} style={{ padding: 14, marginBottom: 12, ...style }}>{children}</div>;
  }
  return <View testID={testID} style={[{ backgroundColor: CHX.bg, borderRadius: 22, borderWidth: 1, borderColor: CHX.border, padding: 14, marginBottom: 12, ...webShadow, ...webGlass }, style]}>{children}</View>;
};

/* ─── HEADER ACCOUNT CARD (Chutex style) ─── */
const HeroCard = ({ children, style }: any) => {
  if (Platform.OS === 'web') {
    return <div className={CHX.headerClass} style={{ padding: 14, marginBottom: 14, ...style }}>{children}</div>;
  }
  return <View style={[{ borderRadius: 24, padding: 14, marginBottom: 14, overflow: 'hidden', backgroundColor: '#23355b' }, style]}>{children}</View>;
};

/* ─── STATUS BADGE ─── */
const StatusBadge = ({ label, color }: { label: string; color?: string }) => (
  <View style={{ backgroundColor: color ? `${color}20` : 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start', marginTop: 4 }}>
    <Text style={{ fontSize: 10, fontWeight: '600', color: color || '#10B981', letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

/* ─── CHUTEX BUTTON (scan + halo) ─── */
const PillButton = ({ label, icon, onPress, testID, variant = 'dark', isIA }: any) => {
  if (Platform.OS === 'web') {
    const cls = isIA ? 'chx-btn chx-btn-ia has-glare' : variant === 'danger' ? CHX.btnDangerClass : CHX.btnClass;
    return (
      <button data-testid={testID} className={`${cls} has-glare`} onClick={onPress} style={{ marginBottom: 12, width: '100%' } as any}>
        {isIA && <span className="chx-btn-icon" style={{ width:18,height:18,borderRadius:99,display:'grid',placeItems:'center',fontSize:11,fontWeight:800,border:'1px solid rgba(31,41,55,.14)',background:'rgba(255,255,255,.52)',color:'#1f2937' } as any}>AI</span>}
        {icon && !isIA && <span style={{ position:'relative',zIndex:4 }}><Icon name={icon} size={16} color={variant === 'danger' ? '#FFF' : (isDarkMode ? '#0b0f17' : '#FFF')} /></span>}
        <span className="chx-btn-label">{label}</span>
        <span className="chx-btn-scan"></span><span className="chx-btn-halo"></span>
      </button>
    );
  }
  return (
    <TouchableOpacity testID={testID} activeOpacity={0.85} style={{
      backgroundColor: isIA ? '#e8c4f0' : variant === 'danger' ? '#e93f5d' : '#111827',
      borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
    }} onPress={onPress}>
      {icon && <Icon name={icon} size={16} color={isIA ? '#1a2030' : '#FFF'} />}
      <Text style={{ color: isIA ? '#1a2030' : '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ─── ICON BUTTON (round gray, Chutex style) ─── */
const IconBtn = ({ icon, onPress, testID, badge }: any) => (
  <TouchableOpacity testID={testID} activeOpacity={0.85} onPress={onPress} style={{
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#eef2f6', borderWidth: 1, borderColor: '#d8e2ef',
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.96)' } : {}),
  }}>
    <Icon name={icon} size={18} color="#111827" />
    {badge && <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#eef2f6' }} />}
  </TouchableOpacity>
);

/* ─── QUICK ACTION ─── */
const QuickAction = ({ icon, label, onPress }: any) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
    <View style={{
      width: 48, height: 48, borderRadius: 14, backgroundColor: isDarkMode ? 'rgba(255,255,255,.06)' : '#eef2f6',
      justifyContent: 'center', alignItems: 'center', marginBottom: 6,
      borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,.10)' : '#d8e2ef',
    }}>
      <Icon name={icon} size={20} color={isDarkMode ? '#f4f7ff' : '#111827'} />
    </View>
    <Text style={{ fontSize: 11, fontWeight: '500', color: CHX.fgSub, textAlign: 'center' }}>{label}</Text>
  </TouchableOpacity>
);

/* ─── SECTION HEADER ─── */
const SectionHeader = ({ title, action, onAction }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: CHX.fgMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: CHX.fgSub }}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ───── LANGUAGE FLAG PICKER ───── */
function LanguageFlagButton() {
  const { lang, setLang, flags } = useI18n();
  const [open, setOpen] = useState(false);
  const current = flags.find(f => f.code === lang) || flags[0];
  return (
    <View style={{ position: 'relative', zIndex: 9999 }}>
      <TouchableOpacity testID="lang-flag-btn" style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: current.color, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }} onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF' }}>{current.code}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ position: 'absolute', top: 40, right: 0, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 8, minWidth: 130, zIndex: 99999, ...webShadow, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } : {}) }}>
          {flags.map(f => (
            <TouchableOpacity key={f.code} testID={`lang-option-${f.code}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: lang === f.code ? 'rgba(0,0,0,0.08)' : 'transparent' }} onPress={() => { setLang(f.code); setOpen(false); }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: f.color, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#FFF' }}>{f.code}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: lang === f.code ? '700' : '500', color: '#111827' }}>{f.code}</Text>
              {lang === f.code && <Icon name="checkmark" size={14} color="#111827" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                    BENEFICIARY HOME                     */
/* ═══════════════════════════════════════════════════════ */
function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t } = useI18n();
  const [vitals, setVitals] = useState<any>(null);
  const [rec, setRec] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [vestData, setVestData] = useState<any>(null);
  const [braceletData, setBraceletData] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [guardianRequests, setGuardianRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const sosPulse = useRef(new Animated.Value(1)).current;
  const { refreshUser } = useAuth();

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [r, rc, rem, vest, brac, guards, greqs] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/ai/recommendations/latest', {}, token).catch(() => ({ recommendation: '' })),
        apiFetch('/api/reminders', {}, token).catch(() => []),
        apiFetch('/api/vest/status', {}, token).catch(() => null),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
        apiFetch('/api/guardians/my', {}, token).catch(() => []),
        apiFetch('/api/beneficiary/guardian-requests', {}, token).catch(() => []),
      ]);
      if (brac && (brac.heart_rate > 0 || brac.steps > 0)) {
        setVitals({ heart_rate: brac.heart_rate || 0, spo2: brac.spo2 || 0, blood_pressure_systolic: brac.systolic || 0, blood_pressure_diastolic: brac.diastolic || 0, temperature: brac.temperature || 0, steps: brac.steps || 0 });
      }
      if (rc.recommendation) setRec(rc.recommendation);
      setReminders(rem);
      setVestData(vest);
      setBraceletData(brac);
      setGuardians(Array.isArray(guards) ? guards : []);
      setGuardianRequests(Array.isArray(greqs) ? greqs : []);
      try {
        const aa = await apiFetch('/api/alerts/active-with-interventions', {}, token);
        setActiveAlerts(Array.isArray(aa) ? aa : []);
      } catch { setActiveAlerts([]); }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => { if (reminders.length > 0) { const cleanup = startReminderChecker(reminders); return cleanup; } }, [reminders]);

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS - Aide requise immediatement!', device_type: 'bracelet' }) }, token);
      notifyAlert('sos', 'SOS envoye ! Vos gardiens et la teleassistance ont ete alertes.');
      Alert.alert('Alerte SOS envoyee', 'Nous avons bien recu votre alerte.\n\n1. Vos gardiens sont alertes\n2. La teleassistance IA vous appelle\n3. Un intervenant sera envoye si besoin');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSosLoading(false); }
  };

  const switchToGuardian = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      if (user.has_guardian_space) {
        await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'guardian' }) }, token);
        await refreshUser();
      } else { router.push('/activate-guardian' as any); }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSwitching(false); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  const activeReminders = reminders.filter((r: any) => r.active);
  const simVitals = vitals || { heart_rate: 72, spo2: 97, steps: 3842, temperature: 36.6 };
  const BG_DASH = 'https://static.prod-images.emergentagent.com/jobs/8afdc991-0ab2-4687-a2a5-438b9a5f0711/images/df76213cf8e83ebc2df01c203a9433129a2a5ad870f7b25bd74b875565d329e1.png';

  /* ─── WEB: Full-page beneficiary dashboard ─── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="beneficiary-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>

          {/* Header — Name + role toggle + notifications */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 46, height: 46, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' } as any}>
                {user.avatar_url ? <img src={user.avatar_url} style={{ width: 46, height: 46, borderRadius: 999, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t('beneficiary')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 } as any}>
              {user.has_guardian_space && (
                <div onClick={switchToGuardian} style={{ padding: '7px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>{t('guardian')}</div>
              )}
              <div onClick={() => setShowNotifs(!showNotifs)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}>
                <i className="ri-notification-3-line" style={{ fontSize: 18, color: '#FFF' }} />
                {(guardianRequests.length > 0 || activeAlerts.length > 0) && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, background: '#EF4444', border: '2px solid rgba(255,255,255,0.5)' } as any} />}
              </div>
            </div>
          </div>

          {/* Notifications dropdown — web bénéficiaire */}
          {showNotifs && (
            <div style={{ borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Notifications</span>
                <div onClick={() => setShowNotifs(false)} style={{ cursor: 'pointer', fontSize: 18, color: 'rgba(255,255,255,0.5)' } as any}><i className="ri-close-line" /></div>
              </div>
              {activeAlerts.length === 0 && guardianRequests.length === 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px 0' }}>Aucune notification</div>
              )}
              {activeAlerts.map((a: any) => (
                <div key={a.id} onClick={() => { setShowNotifs(false); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{a.message}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{a.teleassistance_status || 'En cours'}</div></div>
                </div>
              ))}
              {guardianRequests.map((req: any) => (
                <div key={req.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-user-line" style={{ fontSize: 16, color: '#F59E0B' }} /></div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{req.guardian_name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Souhaite devenir votre gardien{req.relationship ? ` (${req.relationship})` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/accept`, { method: 'POST' }, token); setShowNotifs(false); fetchData(); } catch {} }} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#10B981' } as any}>Accepter</div>
                    <div onClick={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/reject`, { method: 'POST' }, token); setShowNotifs(false); fetchData(); } catch {} }} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Refuser</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alert card — SAAD style */}
          <div onClick={() => router.push('/(tabs)/alerts' as any)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px 18px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, filter: 'hue-rotate(-30deg) saturate(2)' } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(180,30,30,0.4)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{activeAlerts.length}</div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alerte{activeAlerts.length !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{activeAlerts.length > 0 ? `${activeAlerts.length} en cours` : 'Aucune alerte'}</div></div>
            </div>
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 6 } as any}>
              {activeAlerts.length > 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div> : <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>Aucune alerte</span></div>}
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>

          {/* Vitals — compact row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
            {[
              { val: simVitals.heart_rate || '--', label: 'BPM', icon: 'ri-heart-pulse-line', color: '#EF4444' },
              { val: simVitals.spo2 ? `${simVitals.spo2}%` : '--', label: 'SpO2', icon: 'ri-drop-line', color: '#3B82F6' },
              { val: simVitals.steps || '0', label: t('steps'), icon: 'ri-footprint-line', color: '#10B981' },
            ].map((v, i) => (
              <div key={i} onClick={() => router.push('/(tabs)/health')} style={{ flex: 1, padding: '14px 10px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', textAlign: 'center', cursor: 'pointer' } as any}>
                <i className={v.icon} style={{ fontSize: 18, color: v.color, marginBottom: 4, display: 'block' }} />
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{v.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{v.label}</div>
              </div>
            ))}
          </div>

          {/* SOS Button */}
          <div data-testid="sos-button" data-sos-btn onClick={handleSOS} style={{
            padding: '20px', borderRadius: 22, textAlign: 'center', cursor: 'pointer', marginBottom: 14,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(239,68,68,0.2)',
          } as any}>
            {sosLoading ? <div style={{ color: '#FFF' }}>...</div> : <>
              <i className="ri-alarm-warning-line" style={{ fontSize: 32, color: '#EF4444', display: 'block', marginBottom: 4 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: 4 }}>SOS</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t('sos_sub')}</div>
            </>}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
            {[
              { icon: 'ri-pulse-line', label: 'ECG', route: '/ecg' },
              { icon: 'ri-focus-3-line', label: 'Zones', route: '/geofencing' },
              { icon: 'ri-qr-code-line', label: 'QR Code', route: '/link-code' },
              { icon: 'ri-time-line', label: 'Rappels', route: '/reminders' },
            ].map((a, i) => (
              <div key={i} onClick={() => router.push(a.route as any)} style={{ padding: '14px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                <i className={a.icon} style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{a.label}</div>
              </div>
            ))}
          </div>

          {/* Guardians */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', marginBottom: 12 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{guardians.length} {t('guardians')}</div>
            {guardians.map((g: any, i: number) => (
              <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer' } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{g.name?.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{g.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{g.relationship || t('guardian')}</div></div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
            {guardians.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px 0' }}>Aucun gardien</div>}
          </div>

          {/* Teleconsultation card */}
          <DoctorCard onPress={() => router.push('/(tabs)/teleconsult')} />

          {/* Devices status */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', marginBottom: 12 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Appareils</div>
            {[
              { label: 'Bracelet Elio', icon: 'ri-pulse-line', connected: braceletData?.connected, route: '/bracelet-connect' },
              { label: 'Gilet Anti-Chute', icon: 'ri-shield-check-line', connected: vestData?.connected, route: '/vest-connect' },
            ].map((d, i) => (
              <div key={i} onClick={() => router.push(d.route as any)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer' } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className={d.icon} style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} /></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{d.label}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: d.connected ? '#10B981' : 'rgba(255,255,255,0.2)' } as any} /><span style={{ fontSize: 11, color: d.connected ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{d.connected ? 'Actif' : 'Inactif'}</span></div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <ScrollView className={Platform.OS === 'web' ? CHX.bgClass : undefined} style={{ flex: 1, backgroundColor: CHX.bg }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96, position: 'relative', zIndex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={CHX.fg} />} showsVerticalScrollIndicator={false}>

      {/* ─── CHUTEX HEADER ACCOUNT ─── */}
      <HeroCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity testID="beneficiary-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToGuardian}>
            <View style={{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden', marginRight: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', ...(Platform.OS === 'web' ? { boxShadow: '0 8px 16px rgba(0,0,0,.24)' } : {}) }}>
              {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 46, height: 46 }} /> : <View style={{ width: 46, height: 46, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text></View>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>{user.name}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>Role : {t('beneficiary')}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setDarkMode(!darkMode)} style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
              backgroundColor: darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
              borderWidth: 1, borderColor: darkMode ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.08)',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: darkMode ? 'rgba(255,255,255,.65)' : 'rgba(0,0,0,.5)' }}>{darkMode ? 'Light' : 'Dark'}</Text>
            </TouchableOpacity>
            <IconBtn icon="notifications-outline" onPress={() => setShowNotifs(!showNotifs)} testID="notification-bell" badge={guardianRequests.length > 0 || activeAlerts.length > 0} />
            <IconBtn icon="settings-outline" onPress={() => router.push('/(tabs)/profile')} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.46)' }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: CHX.fg }}>{t('beneficiary')}</Text>
            </View>
            {user.has_guardian_space && (
              <TouchableOpacity onPress={switchToGuardian} style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>{t('guardian')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <LanguageFlagButton />
        </View>
      </HeroCard>

      {/* ─── VITALS CARD ─── */}
      <Card>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: vitals?.heart_rate || '--', label: 'BPM' },
            { val: vitals?.spo2 ? `${vitals.spo2}%` : '--', label: 'SpO2' },
            { val: vitals?.steps || '0', label: t('steps') },
          ].map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRightWidth: i < 2 ? 1 : 0, borderColor: CHX.border }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: CHX.fg }}>{v.val}</Text>
              <Text style={{ fontSize: 10, color: CHX.fgMuted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{v.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* ─── NOTIFICATIONS DROPDOWN ─── */}
      {showNotifs && (
        <Card style={{ borderLeftWidth: 3, borderLeftColor: '#111827' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: CHX.fg }}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifs(false)}><Icon name="close" size={18} color="#9CA3AF" /></TouchableOpacity>
          </View>
          {activeAlerts.length === 0 && guardianRequests.length === 0 && (
            <Text style={{ fontSize: 12, color: CHX.fgSub, textAlign: 'center', paddingVertical: 8 }}>Aucune notification</Text>
          )}
          {activeAlerts.map((a: any) => (
            <TouchableOpacity key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}
              onPress={() => { setShowNotifs(false); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: CHX.fg }}>{a.message}</Text>
                <Text style={{ fontSize: 11, color: CHX.fgSub }}>{a.incident_state || a.teleassistance_status}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {guardianRequests.map((req: any) => (
            <View key={req.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="person-add" size={16} color="#F59E0B" />
              </View>
              <Text style={{ fontSize: 13, color: CHX.fg, flex: 1 }}>{req.guardian_name} veut devenir gardien</Text>
            </View>
          ))}
        </Card>
      )}

      {/* ─── ACTIVE ALERTS ─── */}
      {activeAlerts.map((a: any) => (
        <TouchableOpacity key={a.id} testID={`active-alert-${a.id}`} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
          <Card style={{ backgroundColor: 'rgba(239,68,68,0.04)', borderLeftWidth: 3, borderLeftColor: '#EF4444', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="alert-circle" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>ALERTE EN COURS</Text>
                <Text style={{ fontSize: 13, color: CHX.fg, marginTop: 2 }}>{a.message}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: CHX.fgSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {a.incident_state === 'CARE_DISPATCHED' ? 'INTERVENANT EN ROUTE' : a.incident_state === 'CALLING_PATIENT' ? 'APPEL EN COURS' : a.incident_state === 'RESOLVED' ? 'RESOLUE' : a.teleassistance_status || 'EN COURS'}
              </Text>
              {a.intervener_info && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}><Icon name="person" size={14} color="#FFF" /></View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: CHX.fg }}>{a.intervener_info.name}</Text>
                </View>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {/* ─── QUICK ACTIONS ─── */}
      <SectionHeader title="Actions rapides" />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <QuickAction icon="pulse-outline" label="ECG" onPress={() => router.push('/ecg')} color="rgba(0,0,0,0.10)" />
        <QuickAction icon="locate-outline" label="Zones" onPress={() => router.push('/geofencing')} color="rgba(16,185,129,0.10)" />
        <QuickAction icon="qr-code-outline" label="QR Code" onPress={() => router.push('/link-code')} color="rgba(124,92,255,0.10)" />
        <QuickAction icon="time" label="Rappels" onPress={() => router.push('/reminders')} color="rgba(245,158,11,0.10)" />
      </View>

      {/* ─── DEVICES STATUS ─── */}
      <Card style={{ padding: 16 }}>
        <TouchableOpacity data-testid="device-bracelet" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }} onPress={() => router.push('/bracelet-connect')}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Icon name="watch-outline" size={22} color="#111827" />
            {braceletData?.connected && <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: CHX.fg }}>Bracelet Elio</Text>
            {braceletData?.battery > 0 && <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>{braceletData.battery}% batterie</Text>}
          </View>
          <Icon name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.04)', marginBottom: 12 }} />
        <TouchableOpacity data-testid="device-vest" style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/vest-connect')}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Icon name="shield-outline" size={22} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: CHX.fg }}>Gilet Anti-Chute</Text>
            <Text style={{ fontSize: 11, color: CHX.fgSub }}>{vestData?.connected ? 'Connecte' : 'Non connecte'}</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Card>

      {/* ─── GUARDIANS ─── */}
      <SectionHeader title={`${guardians.length} ${t('guardians')}`} action="Ajouter" onAction={() => router.push('/link-code')} />
      <Card style={{ padding: 16 }}>
        {guardians.map((g: any, i: number) => (
          <TouchableOpacity key={g.id || i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: 'rgba(0,0,0,0.06)' }} onPress={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: ['rgba(0,0,0,0.12)', 'rgba(79,195,247,0.12)', 'rgba(174,213,129,0.12)', 'rgba(255,138,101,0.12)', 'rgba(206,147,216,0.12)'][i % 5], justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: ['#111827', '#4FC3F7', '#66BB6A', '#FF8A65', '#CE93D8'][i % 5] }}>{g.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: CHX.fg }}>{g.name}</Text>
              <Text style={{ fontSize: 11, color: CHX.fgSub }}>{g.relationship || g.profession || t('guardian')}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
        {guardians.length === 0 && <Text style={{ fontSize: 13, color: CHX.fgSub, textAlign: 'center', paddingVertical: 12 }}>Aucun gardien pour le moment</Text>}
      </Card>

      {/* ─── GUARDIAN REQUESTS ─── */}
      {guardianRequests.map((req: any) => (
        <Card key={req.id} style={{ borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>{t('guardian_request')}</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: CHX.fg, marginTop: 4 }}>{req.guardian_name}</Text>
          <Text style={{ fontSize: 12, color: CHX.fgSub, marginTop: 2 }}>Souhaite devenir votre gardien</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity testID={`accept-guardian-${req.id}`} style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', `${req.guardian_name} est maintenant votre gardien.`); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: isDarkMode ? 'rgba(255,255,255,.06)' : '#F3F4F6', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: CHX.fgSub, fontSize: 13, fontWeight: '700' }}>{t('reject')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* ─── SOS BUTTON ─── */}
      <Animated.View style={{ transform: [{ scale: sosPulse }], marginBottom: 16 }}>
        <TouchableOpacity testID="sos-button" activeOpacity={0.85} style={{
          backgroundColor: '#EF4444', borderRadius: 24, paddingVertical: 22, alignItems: 'center',
          ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(239,68,68,0.3)' } : { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }),
        }} onPress={handleSOS} disabled={sosLoading}>
          {sosLoading ? <ActivityIndicator color="#FFF" size="large" /> : (
            <>
              <Icon name="alert-circle" size={32} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 4 }}>{t('sos')}</Text>
              <Text style={{ color: CHX.fgMuted, fontSize: 11, marginTop: 2 }}>{t('sos_sub')}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ─── HEALTH CATEGORIES ─── */}
      <SectionHeader title={t('heart_health')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'heart', title: t('heart_health'), img: HEALTH_IMAGES.heart, route: '/health-detail', params: { metricId: 'heart_rate' }, bg: 'rgba(239,68,68,0.06)' },
          { key: 'blood', title: t('blood_health'), img: HEALTH_IMAGES.blood, route: '/health-detail', params: { metricId: 'spo2' }, bg: 'rgba(0,0,0,0.06)' },
          { key: 'sleep', title: t('sleep_health'), img: HEALTH_IMAGES.sleep, route: '/sleep', bg: 'rgba(124,92,255,0.06)' },
          { key: 'physical', title: t('physical_health'), img: HEALTH_IMAGES.physical, route: '/health-detail', params: { metricId: 'temperature' }, bg: 'rgba(16,185,129,0.06)' },
        ].map(cat => (
          <TouchableOpacity key={cat.key} testID={`health-cat-${cat.key}`} style={{ width: '48%', backgroundColor: CHX.bg, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', ...webShadow }} onPress={() => router.push(cat.params ? { pathname: cat.route as any, params: cat.params } : cat.route as any)}>
            <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: cat.bg }}>
              <Image source={{ uri: cat.img }} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: CHX.fg, textAlign: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── QUICK VITALS ─── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { id: 'spo2', label: t('spo2'), val: vitals?.spo2 || '--', unit: '%', icon: 'water-outline', color: CHX.fg },
          { id: 'heart_rate', label: t('pulse'), val: vitals?.heart_rate || '--', unit: t('bpm'), icon: 'heart-outline', color: '#EF4444' },
          { id: 'sleep', label: t('sleep'), val: '--', unit: '', icon: 'moon-outline', color: '#7C5CFF' },
          { id: 'temperature', label: t('temperature'), val: vitals?.temperature || '--', unit: '', icon: 'thermometer-outline', color: '#10B981' },
        ].map(v => (
          <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={{ width: '48%', ...webShadow }} onPress={() => router.push({ pathname: '/health-detail', params: { metricId: v.id } })}>
            <Card style={{ marginBottom: 0, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: CHX.fgSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{v.label}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: CHX.fg, marginTop: 4 }}>{v.val}<Text style={{ fontSize: 13, color: CHX.fgMuted }}> {v.unit}</Text></Text>
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${v.color}15`, justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={v.icon as any} size={16} color={v.color} />
                </View>
              </View>
              <StatusBadge label={t('good_health')} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── ACTIVITY CARD ─── */}
      <Card>
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Image source={{ uri: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/mdk4g3eq_Muscle.png' }} style={{ width: 50, height: 50, resizeMode: 'contain' }} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '800', color: CHX.fg, textAlign: 'center', marginBottom: 14 }}>{t('physical_activity')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          {[
            { val: vitals?.steps || '0', label: t('steps') },
            { val: '0', label: t('kcal') },
            { val: '0', label: t('km') },
          ].map((s, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: CHX.fg }}>{s.val}</Text>
              <Text style={{ fontSize: 12, color: CHX.fgSub }}>{s.label}</Text>
            </View>
          ))}
        </View>
        {/* Progress bars */}
        {[
          { label: '500 KCAL', current: '0 KCAL', pct: '0%', color: CHX.fg },
          { label: `2000 ${t('steps').toUpperCase()}`, current: `${vitals?.steps || 0} ${t('steps').toUpperCase()}`, pct: `${Math.min(100, ((vitals?.steps || 0) / 2000) * 100)}%`, color: '#10B981' },
        ].map((bar, i) => (
          <View key={i} style={{ backgroundColor: CHX.bg, borderRadius: 16, padding: 14, marginBottom: i === 0 ? 8 : 0 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: CHX.fgSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('daily_goal')} | <Text style={{ color: bar.color }}>{bar.label}</Text></Text>
            <View style={{ height: 22, backgroundColor: isDarkMode ? 'rgba(255,255,255,.06)' : '#F3F4F6', borderRadius: 11, overflow: 'hidden' }}>
              <View style={{ height: 22, backgroundColor: bar.color, borderRadius: 11, width: bar.pct, justifyContent: 'center', paddingLeft: 10, minWidth: 40 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFF' }}>{bar.current}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      {/* ─── TELECONSULTATION ─── */}
      <DoctorCard onPress={() => router.push('/(tabs)/teleconsult')} />

      {/* ─── REMINDERS ─── */}
      <SectionHeader title="Rappels" action={t('manage_reminders')} onAction={() => router.push('/reminders')} />
      {[
        { key: 'hydration', title: t('hydration'), img: REMINDER_IMAGES.hydration, count: activeReminders.filter((r: any) => r.reminder_type === 'hydration').length },
        { key: 'medication', title: t('treatments'), img: REMINDER_IMAGES.medication, count: activeReminders.filter((r: any) => r.reminder_type === 'medication').length },
        { key: 'alarm', title: t('alarms'), img: REMINDER_IMAGES.alarm, count: activeReminders.filter((r: any) => r.reminder_type !== 'hydration' && r.reminder_type !== 'medication').length },
      ].map(cat => (
        <TouchableOpacity key={cat.key} onPress={() => router.push('/reminders')} activeOpacity={0.8}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: CHX.fg }}>{cat.title}</Text>
              <Text style={{ fontSize: 12, color: CHX.fgSub, marginTop: 2 }}>{cat.count} rappel{cat.count !== 1 ? 's' : ''} par jour</Text>
            </View>
            <Image source={{ uri: cat.img }} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
          </Card>
        </TouchableOpacity>
      ))}

      {/* ─── AI RECOMMENDATION ─── */}
      {rec ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.10)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="sparkles" size={16} color="#111827" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: CHX.fg }}>Recommandation IA</Text>
          </View>
          <Text style={{ fontSize: 13, color: CHX.fgSub, lineHeight: 20 }} numberOfLines={4}>{rec}</Text>
        </Card>
      ) : null}

      {/* ─── HELP SYSTEM ─── */}
      <ContextualTip id="sos-tip" icon="shield-checkmark-outline" text="En cas d'urgence, appuyez sur le bouton SOS. Vos gardiens seront alertes et la teleassistance vous appellera." color="#EF4444" />
      <MiniTuto id="beneficiary-intro" triggerLabel="Comment utiliser l'application ?" steps={[
        { title: 'Bienvenue sur Care Watch', text: 'Votre espace personnel pour surveiller votre sante au quotidien.', icon: 'home-outline' },
        { title: 'Bouton SOS', text: 'Appuyez sur le bouton rouge SOS en cas de chute ou malaise.', icon: 'alert-circle-outline' },
        { title: 'Suivi sante', text: 'Consultez vos constantes vitales mises a jour en temps reel.', icon: 'heart-outline' },
        { title: 'Gardiens', text: 'Vos proches recoivent les alertes et suivent votre etat.', icon: 'people-outline' },
      ]} />
      <OnboardingChecklist title="Configurez votre espace" items={[
        { label: 'Completer votre profil medical', done: !!(user.medical_conditions || user.allergies || user.blood_type), action: () => router.push('/profile') },
        { label: 'Ajouter au moins un gardien', done: (guardians || []).length > 0 },
        { label: 'Connecter un appareil', done: false, action: () => router.push('/(tabs)/devices') },
        { label: 'Verifier vos seuils d\'alerte', done: false, action: () => router.push('/(tabs)/health') },
      ]} />
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                    GUARDIAN HOME                         */
/* ═══════════════════════════════════════════════════════ */
function GuardianHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const [bens, setBens] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [pendingInterventions, setPendingInterventions] = useState<any[]>([]);
  const [saadInvitations, setSaadInvitations] = useState<any[]>([]);
  const [saadLink, setSaadLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeAlertsG, setActiveAlertsG] = useState<any[]>([]);
  const [showNotifsG, setShowNotifsG] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a, inv, piv, saadInv, saadLk] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/guardian/invitations', {}, token).catch(() => []),
        apiFetch('/api/interventions/pending', {}, token).catch(() => []),
        apiFetch('/api/guardian/saad-invitations', {}, token).catch(() => []),
        apiFetch('/api/guardian/saad-link', {}, token).catch(() => null),
      ]);
      const aa = await apiFetch('/api/alerts/active-with-interventions', {}, token).catch(() => []);
      setActiveAlertsG(Array.isArray(aa) ? aa : []);
      setBens(Array.isArray(b) ? b : []);
      setAlerts(Array.isArray(a) ? a : []);
      setInvitations(Array.isArray(inv) ? inv : []);
      setPendingInterventions(Array.isArray(piv) ? piv : []);
      setSaadInvitations(Array.isArray(saadInv) ? saadInv : []);
      setSaadLink(saadLk || null);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 10000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => {
    if (pendingInterventions.length > 0) pendingInterventions.forEach((piv: any) => { if (piv.status === 'pending_acceptance') notifyIntervention(piv.beneficiary_name, piv.distance_km); });
    if (invitations.length > 0) invitations.forEach((inv: any) => notifyAlert('guardian_request', `${inv.beneficiary_name} vous demande comme gardien`));
  }, [pendingInterventions.length, invitations.length]);

  const switchToBeneficiary = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      if (user.has_beneficiary_space || user.role === 'beneficiary') {
        await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'beneficiary' }) }, token);
        await refreshUser();
      } else { router.push('/activate-beneficiary' as any); }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSwitching(false); }
  };

  const [showAddBenPopup, setShowAddBenPopup] = useState(false);
  const [linkPhone, setLinkPhone] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('');
  const [linkingBen, setLinkingBen] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const BG_GUARD = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const BG_RED_G = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

  if (Platform.OS === 'web') {
    return (
      <div data-testid="guardian-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_GUARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 46, height: 46, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span></div><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{user.name}</div><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t('guardian')}{user.is_prescriber ? ' | Prescripteur' : ''}</span></div></div>
            <div style={{ display: 'flex', gap: 8 } as any}><div onClick={switchToBeneficiary} style={{ padding: '7px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>{t('beneficiary')}</div><div onClick={() => setShowNotifsG(!showNotifsG)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}><i className="ri-notification-3-line" style={{ fontSize: 18, color: '#FFF' }} />{(invitations.length > 0 || activeAlertsG.length > 0) && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, background: '#EF4444' } as any} />}</div></div>
          </div>
          {/* Alert card — SAAD style */}
          <div onClick={() => router.push('/(tabs)/alerts' as any)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px 18px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <img src={BG_RED_G} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{activeAlerts.length}</div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alerte{activeAlerts.length !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{activeAlerts.length > 0 ? `${activeAlerts.length} en cours` : 'Aucune alerte'}</div></div>
            </div>
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 6 } as any}>
              {activeAlerts.length > 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div> : <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>Aucune alerte</span></div>}
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Mes beneficiaires</div>
          {/* SAAD affiliation card */}
          {saadLink && (
            <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 10, backdropFilter: 'blur(12px)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-4-line" style={{ fontSize: 18, color: '#10B981' }} /></div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{saadLink.company_name}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '2px 7px', borderRadius: 99, letterSpacing: 0.5, textTransform: 'uppercase' }}>Rattache</div>
                  </div>
                  {saadLink.company_address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{saadLink.company_address}</div>}
                </div>
              </div>
            </div>
          )}
          {/* SAAD pending invitations */}
          {saadInvitations.map((inv: any) => (
            <div key={inv.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 10 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-building-4-line" style={{ fontSize: 18, color: '#F59E0B' }} /></div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{inv.company_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Souhaite vous rattacher comme gardien professionnel</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div onClick={async () => { try { await apiFetch(`/api/guardian/saad-invitations/${inv.id}/accept`, { method: 'POST' }, token); fetchData(); } catch {} }} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#10B981' } as any}>Accepter</div>
                <div onClick={async () => { try { await apiFetch(`/api/guardian/saad-invitations/${inv.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Refuser</div>
              </div>
            </div>
          ))}
          {bens.map((b: any) => (<div key={b.id} onClick={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })} style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, cursor: 'pointer' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}><div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{b.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{b.name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate || '--'} bpm` : 'Pas de donnees'}</div>{b.active_alerts > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{b.active_alerts} alerte(s)</span></div>}</div><i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.25)' }} /></div></div>))}
          {bens.length === 0 && <div style={{ textAlign: 'center', padding: '30px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', marginBottom: 10 } as any}><i className="ri-group-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucun beneficiaire</div></div>}
          <div onClick={() => setShowAddBenPopup(true)} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 } as any}><i className="ri-heart-line" style={{ fontSize: 16, color: '#FFF' }} /><span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{t('add_beneficiary')}</span></div>
        </div>
        {/* POPUP AJOUTER BENEFICIAIRE — par numero de telephone */}
        {showAddBenPopup && (
          <div onClick={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                  <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Ajouter un beneficiaire</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Inviter par telephone</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
                Entrez le numero de telephone de votre proche. S'il a deja un compte, il recevra une notification pour accepter. Sinon, un SMS lui sera envoye.
              </div>

              {/* Phone field */}
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numero de telephone</div>
                <div style={{ position: 'relative' } as any}>
                  <i className="ri-phone-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' } as any} />
                  <input value={linkPhone} onChange={(e: any) => setLinkPhone(e.target.value)} placeholder="06 12 34 56 78" type="tel" style={{ width: '100%', padding: '15px 16px 15px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
              </div>

              {/* Relationship dropdown */}
              <div style={{ marginBottom: 28 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Votre lien avec le beneficiaire</div>
                {/* Professional group */}
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(16,185,129,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>Professionnel</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 } as any}>
                  {['Auxiliaire de vie', 'Aide soignant(e)', 'Aide à domicile', 'Professionnel de santé'].map(r => (
                    <div key={r} onClick={() => setLinkRelationship(r)} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: linkRelationship === r ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)', border: `1px solid ${linkRelationship === r ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`, color: linkRelationship === r ? '#10B981' : 'rgba(255,255,255,0.6)', transition: 'all 0.15s' } as any}>{r}</div>
                  ))}
                </div>
                {/* Personal group */}
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>Personnel / Familial</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
                  {['Mère', 'Père', 'Fils', 'Fille', 'Conjoint(e)', 'Frère', 'Sœur', 'Voisin(e)', 'Autre'].map(r => (
                    <div key={r} onClick={() => setLinkRelationship(r)} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: linkRelationship === r ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${linkRelationship === r ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`, color: linkRelationship === r ? '#FFF' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' } as any}>{r}</div>
                  ))}
                </div>
                {linkRelationship && <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Selectionne : <span style={{ fontWeight: 700, color: ['Auxiliaire de vie','Aide soignant(e)','Aide à domicile','Professionnel de santé'].includes(linkRelationship) ? '#10B981' : 'rgba(255,255,255,0.7)' }}>{linkRelationship}</span>{['Auxiliaire de vie','Aide soignant(e)','Aide à domicile','Professionnel de santé'].includes(linkRelationship) ? ' → Les alertes remonteront dans l\'espace SAAD' : ''}</div>}
              </div>

              {/* Success/error message */}
              {linkMessage !== '' && (
                <div style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 16, background: linkMessage.startsWith('Erreur') ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${linkMessage.startsWith('Erreur') ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` } as any}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 } as any}>
                    <i className={linkMessage.startsWith('Erreur') ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 18, color: linkMessage.startsWith('Erreur') ? '#EF4444' : '#10B981', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{linkMessage}</span>
                  </div>
                </div>
              )}

              {/* Send button */}
              <div
                onClick={async () => {
                  if (!linkPhone.trim() || linkingBen) return;
                  setLinkingBen(true);
                  setLinkMessage('');
                  try {
                    const res = await apiFetch('/api/guardian/link-with-phone', { method: 'POST', body: JSON.stringify({ phone: linkPhone.trim(), relationship: linkRelationship.trim() }) }, token);
                    setLinkMessage(res.message || 'Demande envoyee avec succes !');
                    if (res.status === 'pending' || res.status === 'already_linked') {
                      fetchData();
                      setTimeout(() => { setShowAddBenPopup(false); setLinkPhone(''); setLinkRelationship(''); setLinkMessage(''); }, 2000);
                    }
                  } catch (e: any) {
                    setLinkMessage(`Erreur : ${e.message}`);
                  } finally { setLinkingBen(false); }
                }}
                style={{ padding: '17px', borderRadius: 999, textAlign: 'center', cursor: linkPhone.trim() && !linkingBen ? 'pointer' : 'not-allowed', background: linkPhone.trim() && !linkingBen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${linkPhone.trim() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, color: linkPhone.trim() ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}
              >
                {linkingBen ? (
                  <><i className="ri-loader-4-line" style={{ fontSize: 16 }} /><span>Envoi en cours...</span></>
                ) : (
                  <><i className="ri-send-plane-line" style={{ fontSize: 16 }} /><span>Envoyer l'invitation</span></>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      {/* ─── HERO GRADIENT ─── */}
      <HeroCard style={{ backgroundColor: '#111827', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #9A5533 0%, #111827 40%, #6B7280 100%)', backgroundSize: '200% 200%', boxShadow: '0 8px 32px rgba(154,85,51,0.25)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity testID="guardian-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToBeneficiary}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
              {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{t('guardian')}{user.is_prescriber ? ' | Prescripteur' : ''}</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LanguageFlagButton />
            <TouchableOpacity testID="guardian-notification-bell" onPress={() => setShowNotifsG(!showNotifsG)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="notifications-outline" size={18} color="#111827" />
              {(invitations.length > 0 || pendingInterventions.length > 0 || activeAlertsG.length > 0) && <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats inline */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: bens.length, label: 'Beneficiaires' },
            { val: activeAlerts.length, label: 'Alertes' },
            { val: pendingInterventions.length, label: 'Interventions' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {/* ─── NOTIFICATIONS ─── */}
      {showNotifsG && (
        <Card style={{ borderLeftWidth: 3, borderLeftColor: '#111827' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifsG(false)}><Icon name="close" size={18} color="#9CA3AF" /></TouchableOpacity>
          </View>
          {activeAlertsG.length === 0 && invitations.length === 0 && pendingInterventions.length === 0 && (
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', paddingVertical: 8 }}>Aucune notification</Text>
          )}
          {activeAlertsG.map((a: any) => (
            <TouchableOpacity key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
              onPress={() => { setShowNotifsG(false); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
              <Icon name="alert-circle" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#111827', flex: 1 }}>{a.beneficiary_name}: {a.message}</Text>
            </TouchableOpacity>
          ))}
          {pendingInterventions.map((p: any) => (
            <TouchableOpacity key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
              onPress={() => { setShowNotifsG(false); router.push({ pathname: '/intervention-detail', params: { interventionId: p.id } }); }}>
              <Icon name="navigate" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#111827', flex: 1 }}>Intervention: {p.beneficiary_name}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* ─── ACTIVE ALERTS ─── */}
      {activeAlertsG.map((a: any) => {
        const myIntervention = a.intervention?.assigned_to === user.id;
        const hasIntervenant = a.intervener_info || a.intervention?.assigned_to;
        const isDispatch = a.incident_state === 'CARE_DISPATCHED' || a.teleassistance_status === 'CARE_DISPATCHED';
        const interventionId = a.intervention?.id;
        return (
          <View key={a.id}>
            <TouchableOpacity onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
              <Card style={{ backgroundColor: 'rgba(239,68,68,0.04)', borderLeftWidth: 3, borderLeftColor: '#EF4444', padding: 16, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name="alert-circle" size={22} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>ALERTE - {a.beneficiary_name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.message}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
            {myIntervention ? (
              <PillButton label="VOUS ETES EN INTERVENTION" icon="shield-checkmark" variant="warm" onPress={() => interventionId ? router.push({ pathname: '/company-intervention-detail', params: { interventionId } }) : router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} />
            ) : hasIntervenant && a.intervener_info && interventionId ? (
              <PillButton label={`SUIVRE ${a.intervener_info.name?.split(' ')[0]?.toUpperCase()}`} icon="navigate" variant="warm" onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId } })} />
            ) : isDispatch ? (
              <PillButton label="EN ATTENTE D'UN INTERVENANT" icon="time" variant="warm" onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} />
            ) : (
              <PillButton label="VOIR L'ALERTE" icon="shield-checkmark" onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} />
            )}
          </View>
        );
      })}

      {/* ─── PENDING INTERVENTIONS ─── */}
      {pendingInterventions.map((piv: any) => (
        <TouchableOpacity key={piv.id} testID={`intervention-${piv.id}`} onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: piv.id } })}>
          <Card style={{ borderLeftWidth: 3, borderLeftColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.03)' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1 }}>{t('intervention_required')}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 4 }}>{piv.alert_message || piv.notes || 'Alerte'}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{piv.beneficiary_name} {piv.distance_km ? `- ${piv.distance_km}km` : ''}</Text>
            {piv.status === 'pending_acceptance' && (
              <View style={{ backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 }}>{t('i_intervene')}</Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>
      ))}

      {/* ─── INVITATIONS ─── */}
      {invitations.map((inv: any) => (
        <Card key={inv.id} style={{ borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>INVITATION</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 4 }}>{inv.beneficiary_name} vous invite</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity testID={`accept-inv-${inv.id}`} style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', 'Vous etes maintenant gardien.'); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '700' }}>{t('reject')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* ─── BENEFICIARY CARDS ─── */}
      <SectionHeader title="Mes beneficiaires" />
      {bens.map((b: any) => (
        <TouchableOpacity key={b.id} testID={`beneficiary-card-${b.id}`} onPress={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })}>
          <Card style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{b.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate || '--'} bpm | SpO2 ${b.latest_vitals.spo2 || '--'}%` : 'Pas de donnees'}</Text>
                {b.active_alerts > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Icon name="warning" size={12} color="#EF4444" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>{b.active_alerts} alerte{b.active_alerts > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>
              <Icon name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            <StatusBadge label={b.active_alerts > 0 ? t('attention') : t('good_health')} color={b.active_alerts > 0 ? '#EF4444' : undefined} />
          </Card>
        </TouchableOpacity>
      ))}
      {bens.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 32 }}>
          <Icon name="people-outline" size={40} color="#9CA3AF" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 12 }}>Aucun beneficiaire</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>Ajoutez un beneficiaire pour veiller sur lui</Text>
        </Card>
      )}

      <PillButton label={t('add_beneficiary')} icon="heart-outline" onPress={() => setShowAddBenPopup(true)} testID="add-beneficiary-btn" variant="warm" />

      {/* ─── MODAL AJOUTER BENEFICIAIRE (natif) ─── */}
      {Platform.OS !== 'web' && showAddBenPopup && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 9999 }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }} />
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Inviter par telephone</Text>
              <TouchableOpacity onPress={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }}>
                <Icon name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 20 }}>Entrez le numero de telephone de votre proche. S'il a un compte, il recevra une notification pour accepter.</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Numero de telephone</Text>
            <TextInput
              value={linkPhone}
              onChangeText={setLinkPhone}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 14 }}
            />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Lien de parente (optionnel)</Text>
            <TextInput
              value={linkRelationship}
              onChangeText={setLinkRelationship}
              placeholder="Ex: Fils, Fille, Voisin..."
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 20 }}
            />
            {linkMessage !== '' && (
              <View style={{ padding: 14, borderRadius: 12, marginBottom: 14, backgroundColor: linkMessage.startsWith('Erreur') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)' }}>
                <Text style={{ fontSize: 13, color: linkMessage.startsWith('Erreur') ? '#EF4444' : '#10B981' }}>{linkMessage}</Text>
              </View>
            )}
            <TouchableOpacity
              style={{ backgroundColor: linkPhone.trim() ? '#111827' : '#E5E7EB', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}
              disabled={!linkPhone.trim() || linkingBen}
              onPress={async () => {
                if (!linkPhone.trim() || linkingBen) return;
                setLinkingBen(true); setLinkMessage('');
                try {
                  const res = await apiFetch('/api/guardian/link-with-phone', { method: 'POST', body: JSON.stringify({ phone: linkPhone.trim(), relationship: linkRelationship.trim() }) }, token);
                  setLinkMessage(res.message || 'Demande envoyee !');
                  if (res.status === 'pending' || res.status === 'already_linked') {
                    fetchData();
                    setTimeout(() => { setShowAddBenPopup(false); setLinkPhone(''); setLinkRelationship(''); setLinkMessage(''); }, 2000);
                  }
                } catch (e: any) { setLinkMessage(`Erreur : ${e.message}`); } finally { setLinkingBen(false); }
              }}
            >
              <Text style={{ color: linkPhone.trim() ? '#FFF' : '#9CA3AF', fontSize: 15, fontWeight: '700' }}>
                {linkingBen ? 'Envoi...' : "Envoyer l'invitation"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Help system */}
      <ContextualTip id="guardian-welcome" icon="people-outline" text="Bienvenue dans votre espace gardien ! Suivez la sante de vos proches en temps reel." color="#111827" />
      <MiniTuto id="guardian-intro" triggerLabel="Guide du gardien" steps={[
        { title: 'Votre role', text: 'Vous veillez sur vos proches a distance avec des notifications instantanees.', icon: 'shield-outline' },
        { title: 'Alertes', text: 'Quand une alerte se declenche, vous pouvez intervenir ou suivre l\'intervenant.', icon: 'alert-circle-outline' },
        { title: 'Ajouter', text: 'Entrez le numero de telephone de votre proche pour lui envoyer une invitation a rejoindre votre espace gardien.', icon: 'person-add-outline' },
      ]} />
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                   TELEASSISTANCE HOME                   */
/* ═══════════════════════════════════════════════════════ */
function TeleassistanceHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [activeEscalations, setActiveEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [a, su, esc] = await Promise.all([
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/subscribers', {}, token).catch(() => []),
        apiFetch('/api/escalation/active', {}, token).catch(() => []),
      ]);
      setAlerts(a); setSubs(su); setActiveEscalations(esc);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 5000); return () => clearInterval(iv); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');
  const BG_DASH = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

  if (Platform.OS === 'web') {
    return (
      <div data-testid="teleassistance-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 46, height: 46, borderRadius: 999, background: 'rgba(124,92,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(124,92,255,0.3)' } as any}><i className="ri-headphone-line" style={{ fontSize: 20, color: '#A78BFA' }} /></div><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Plateau d'ecoute</div><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{user.name}</span></div></div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>{[{ val: active.length, label: 'Alertes actives', icon: 'ri-alarm-warning-line', color: active.length > 0 ? '#EF4444' : 'rgba(255,255,255,0.4)' }, { val: activeEscalations.length, label: 'Escalades', icon: 'ri-arrow-up-circle-line', color: '#F59E0B' }, { val: subs.length, label: 'Abonnes', icon: 'ri-group-line', color: 'rgba(255,255,255,0.4)' }].map((s, i) => (<div key={i} style={{ flex: 1, padding: '14px 10px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', textAlign: 'center' } as any}><i className={s.icon} style={{ fontSize: 18, color: s.color, display: 'block', marginBottom: 4 }} /><div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{s.val}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div></div>))}</div>
          {/* Active alerts — red cards */}
          {active.map((a: any) => (<div key={a.id} onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 10, cursor: 'pointer', minHeight: 80 } as any}><img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a.message} - {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.25)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div></div></div>))}
          {/* Subscribers */}
          {subs.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>Abonnes ({subs.length})</div>}
          {subs.slice(0, 10).map((su: any) => (<div key={su.id} onClick={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,92,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#A78BFA' }}>{su.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{su.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>))}
        </div>
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#7C5CFF', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #6B4FD8 0%, #7C5CFF 40%, #A78BFA 100%)', boxShadow: '0 8px 32px rgba(124,92,255,0.25)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Plateau d'ecoute</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: active.length, label: 'Alertes' },
            { val: activeEscalations.length, label: 'Escalades' },
            { val: subs.length, label: 'Abonnes' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {active.length > 0 && <>
        <SectionHeader title="Alertes en attente" />
        {active.slice(0, 5).map((a: any) => (
          <TouchableOpacity key={a.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <Card style={{ borderLeftWidth: 3, borderLeftColor: a.severity === 'critical' ? '#EF4444' : '#111827' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{a.message}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{a.beneficiary_name} - {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </>}

      <SectionHeader title="Abonnes" action="Voir tout" />
      {subs.slice(0, 10).map((su: any) => (
        <TouchableOpacity key={su.id} onPress={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(124,92,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#7C5CFF' }}>{su.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{su.name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                    REWARDS ADMIN                        */
/* ═══════════════════════════════════════════════════════ */
function RewardsAdminCard({ token }: { token: string }) {
  const [reward, setReward] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ prize_1: '100', prize_2: '70', prize_3: '30' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/api/company/rewards/current', {}, token).then(r => {
      setReward(r);
      setForm({ prize_1: String(r.prize_1 || 100), prize_2: String(r.prize_2 || 70), prize_3: String(r.prize_3 || 30) });
    }).catch(() => {});
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/rewards', { method: 'POST', body: JSON.stringify({ prize_1: parseInt(form.prize_1) || 100, prize_2: parseInt(form.prize_2) || 70, prize_3: parseInt(form.prize_3) || 30 }) }, token);
      setEditing(false);
      setReward({ ...reward, prize_1: parseInt(form.prize_1), prize_2: parseInt(form.prize_2), prize_3: parseInt(form.prize_3) });
    } catch {} finally { setSaving(false); }
  };

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <Card style={{ borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', backgroundColor: 'rgba(0,0,0,0.03)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="trophy" size={22} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Recompenses {monthLabel}</Text>
          <Text style={{ fontSize: 11, color: '#6B7280' }}>Top 3 prescripteurs</Text>
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={{ padding: 6 }}>
          <Icon name={editing ? 'close' : 'create-outline'} size={20} color="#111827" />
        </TouchableOpacity>
      </View>
      {!editing ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            { pos: '1er', prize: reward?.prize_1 || 100, color: '#FFD700' },
            { pos: '2e', prize: reward?.prize_2 || 70, color: '#C0C0C0' },
            { pos: '3e', prize: reward?.prize_3 || 30, color: '#CD7F32' },
          ].map(t => (
            <View key={t.pos} style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.color, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Icon name="trophy" size={18} color="#FFF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{t.prize}EUR</Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>{t.pos}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {['prize_1', 'prize_2', 'prize_3'].map((k, i) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', width: 30 }}>{i + 1}e</Text>
              <TextInput value={(form as any)[k]} onChangeText={(v: string) => setForm({ ...form, [k]: v })} keyboardType="numeric" style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>EUR</Text>
            </View>
          ))}
          <TouchableOpacity onPress={save} style={{ backgroundColor: '#111827', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 4 }}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                      ADMIN HOME                         */
/* ═══════════════════════════════════════════════════════ */
function AdminHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ranking, setRanking] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [st, al, us, co, rk] = await Promise.all([
        apiFetch('/api/admin/stats', {}, token).catch(() => ({})),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/admin/users', {}, token).catch(() => []),
        apiFetch('/api/admin/companies', {}, token).catch(() => []),
        apiFetch('/api/company/ranking', {}, token).catch(() => []),
      ]);
      setStats(st); setAlerts(al); setUsers(us); setCompanies(co); setRanking(rk);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const BG_DASH = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

  if (Platform.OS === 'web') {
    return (
      <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 46, height: 46, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)' } as any}><i className="ri-shield-check-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{user.name}</div><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Administration CARE WATCH</span></div></div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>{[{ val: stats.total_users || 0, label: 'Utilisateurs', icon: 'ri-group-line' }, { val: stats.total_alerts || 0, label: 'Alertes', icon: 'ri-alarm-warning-line' }, { val: activeAlerts.length, label: 'Actives', icon: 'ri-pulse-line', color: activeAlerts.length > 0 ? '#EF4444' : undefined }, { val: stats.total_interventions || 0, label: 'Interventions', icon: 'ri-map-pin-range-line' }].map((s: any, i) => (<div key={i} style={{ padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } as any}><i className={s.icon} style={{ fontSize: 16, color: s.color || 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }} /><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{s.val}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div></div>))}</div>
          {/* Quick actions */}
          <div onClick={() => router.push('/backoffice')} data-testid="admin-backoffice-btn" style={{ padding: '14px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-settings-3-line" style={{ fontSize: 18, color: '#FFF' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Back-Office</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Gestion complete du systeme</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>
          {/* Active alerts */}
          {activeAlerts.map((a: any) => (<div key={a.id} onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 10, cursor: 'pointer', minHeight: 70 } as any}><img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#FFF' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{a.message}</div></div><div style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.25)' } as any}><span style={{ fontSize: 9, fontWeight: 600, color: '#FFF' }}>Active</span></div></div></div>))}
          {/* Rewards */}
          <RewardsAdminCard token={token} />
          {/* Ranking */}
          {ranking.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 }}>Classement prescripteurs</div>{ranking.slice(0, 5).map((p: any, i: number) => (<div key={p.id || i} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 6, cursor: 'pointer' } as any}><div style={{ width: 30, height: 30, borderRadius: 10, background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 800, color: i < 3 ? '#FFF' : 'rgba(255,255,255,0.5)' }}>#{i + 1}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.prescriptions_count || 0} prescriptions</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }} /></div>))}</>)}
        </div>
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#111827', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #0C0A09 0%, #111827 40%, #44403C 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Administration</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: stats.total_users || 0, label: 'Utilisateurs' },
            { val: stats.total_alerts || 0, label: 'Alertes' },
            { val: stats.active_alerts || 0, label: 'Actives' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      <PillButton label="Back-Office" icon="settings-outline" onPress={() => router.push('/backoffice')} testID="admin-backoffice-btn" />

      <RewardsAdminCard token={token} />

      {/* Ranking */}
      {ranking.length > 0 && (
        <>
          <SectionHeader title="Classement prescripteurs" />
          {ranking.slice(0, 5).map((p: any, i: number) => (
            <Card key={p.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: i < 3 ? '#FFF' : '#6B7280' }}>#{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{p.prescriptions_count || 0} prescriptions</Text>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Companies */}
      <SectionHeader title="Entreprises" />
      {companies.slice(0, 5).map((c: any) => (
        <TouchableOpacity key={c.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: c.id } })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="business-outline" size={20} color="#111827" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{c.name || c.company_name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{c.email}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                    COMPANY HOME                         */
/* ═══════════════════════════════════════════════════════ */
function CompanyHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [st, iv, pr, intr, pres, al, rk, rw, ag] = await Promise.all([
        apiFetch('/api/company/stats', {}, token).catch(() => ({})),
        apiFetch('/api/company/intervenants', {}, token).catch(() => []),
        apiFetch('/api/company/prescribers', {}, token).catch(() => []),
        apiFetch('/api/company/interventions', {}, token).catch(() => []),
        apiFetch('/api/company/dashboard', {}, token).catch(() => ({})),
        apiFetch('/api/company/alerts', {}, token).catch(() => []),
        apiFetch('/api/company/ranking', {}, token).catch(() => []),
        apiFetch('/api/company/rewards/current', {}, token).catch(() => null),
        apiFetch('/api/company/agencies', {}, token).catch(() => []),
      ]);
      const dashPrescs = pres?.prescriptions || [];
      setStats(st); setIntervenants(iv); setPrescribers(pr); setInterventions(intr); setPrescriptions(dashPrescs); setAlerts(al); setRanking(rk); setReward(rw); setAgencies(Array.isArray(ag) ? ag : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const activeIvs = interventions.filter((iv: any) => ['in_progress', 'en_route', 'pending_acceptance'].includes(iv.status));
  const BG_DASH = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
  const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
  const BG_ORANGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

  if (Platform.OS === 'web') {
    return (
      <div data-testid="company-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header — Structure info (cliquable → page agence) */}
          <div onClick={() => router.push('/(tabs)/health' as any)} style={{ padding: '16px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 } as any}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(212,132,90,0.3)', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 24, color: '#D4845A' }} /></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{user.structure_name || user.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{user.address || 'Structure SAAD'}</div>
                {user.siret && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>SIRET: {user.siret}</div>}
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }} />
            </div>
            {/* Stats inline */}
            <div style={{ display: 'flex', gap: 8 } as any}>
              {[
                { val: agencies.length, label: 'Agences', color: '#D4845A' },
                { val: intervenants.length, label: 'Intervenants', color: '#A78BFA' },
                { val: stats.total_prescribers || 0, label: 'Prescripteurs', color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Alerte card — enrichie avec KPIs résolution */}
          {(() => {
            const totalA = alerts.length;
            const resolvedA = alerts.filter((a: any) => a.status === 'resolved' || a.status === 'closed').length;
            const resRate = totalA > 0 ? Math.round((resolvedA / totalA) * 100) : 0;
            return (
              <div onClick={() => router.push('/(tabs)/alerts' as any)} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '18px', marginBottom: 12, cursor: 'pointer' } as any}>
                <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{totalA}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Alerte{totalA > 1 ? 's' : ''}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{activeAlerts.length} en cours · {resolvedA} résolue{resolvedA > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#FFF' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{activeAlerts.length > 0 ? 'Active' : 'RAS'}</span></div>
                      <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                    </div>
                  </div>
                  {totalA > 0 && (<>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 12 } as any} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as any}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Taux de résolution</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{resRate}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' } as any}>
                          <div style={{ height: '100%', borderRadius: 99, background: '#FFF', width: `${resRate}%` } as any} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 } as any}>
                        {[{ val: activeAlerts.length, label: 'Actives' }, { val: resolvedA, label: 'Résolues' }].map((s, i) => (
                          <div key={i} style={{ textAlign: 'center', minWidth: 44 } as any}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>)}
                </div>
              </div>
            );
          })()}

          {/* INTERVENTION CARE — disponibilité intervenants (barres vertes/violettes, texte blanc) */}
          {(() => {
            const completedIvs = interventions.filter((iv: any) => iv.status === 'completed').length;
            const inMission = intervenants.filter((iv: any) => (iv.active_interventions || 0) > 0).length;
            const available = intervenants.length - inMission;
            const ivMax = Math.max(intervenants.length, 1);
            return (
              <div onClick={() => router.push('/(tabs)/teleconsult' as any)} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '20px', marginBottom: 12, cursor: 'pointer' } as any}>
                <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>Intervention Care</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
                    {[{ val: activeIvs.length, label: 'En cours' }, { val: completedIvs, label: 'Terminees' }, { val: intervenants.length, label: 'Intervenants' }].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                        <div style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', marginTop: 4 } as any}><span style={{ fontSize: 9, fontWeight: 700, color: '#FFF' }}>{s.label}</span></div>
                      </div>
                    ))}
                  </div>
                  {intervenants.length > 0 && (<>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 14 } as any} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Disponibilité des intervenants</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
                      {[
                        { val: available, label: 'Disponibles', barColor: '#10B981', pct: (available / ivMax) * 100 },
                        { val: inMission, label: 'En intervention', barColor: '#A78BFA', pct: (inMission / ivMax) * 100 },
                      ].map((s, i) => (
                        <div key={i} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', textAlign: 'center' } as any}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>{s.val}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' } as any}>
                            <div style={{ height: '100%', borderRadius: 99, background: s.barColor, width: `${s.pct}%` } as any} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>)}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                    <div style={{ display: 'flex' } as any}>{intervenants.slice(0, 3).map((iv: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.3)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{iv.name?.charAt(0)}</span></div>))}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Voir les {intervenants.length} intervenants</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PRESCRIPTIONS — taux de conversion + top performeurs, tout en blanc */}
          {(() => {
            const validatedP = prescriptions.filter((p: any) => p.status === 'validated' || p.status === 'subscribed');
            const pendingP = prescriptions.filter((p: any) => p.status === 'pending');

            // Mois en cours — souscriptions validées uniquement
            const now2 = new Date();
            const currentMonthValidated = validatedP.filter((p: any) => {
              const d = new Date(p.created_at || p.date || '');
              return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
            });
            const currentMonthAmount = currentMonthValidated.reduce((s: number, p: any) => s + (p.commission || 0), 0);
            // Total depuis toujours
            const allTimeValidated = validatedP.reduce((s: number, p: any) => s + (p.commission || 0), 0);

            const convRate = prescriptions.length > 0 ? Math.round((validatedP.length / prescriptions.length) * 100) : 0;
            const nextM = new Date(); nextM.setMonth(nextM.getMonth() + 1);
            const nextPay = `01/${String(nextM.getMonth() + 1).padStart(2, '0')}/${nextM.getFullYear()}`;
            const topP = [...ranking].slice(0, 3);
            const maxP = Math.max(topP[0]?.prescriptions_count || 1, 1);
            return (
              <div onClick={() => router.push('/(tabs)/devices' as any)} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '20px', marginBottom: 12, cursor: 'pointer' } as any}>
                <img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Prescriptions</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>+{totalValidated + totalPending} EUR</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 14 }}>Prochain versement de {totalValidated} EUR le {nextPay}</div>
                  {/* Stats en blanc */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
                    {[{ val: validatedP.length, label: 'Validees' }, { val: pendingP.length, label: 'En attente' }, { val: prescribers.length, label: 'Prescripteurs' }].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                        <div style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', marginTop: 4 } as any}><span style={{ fontSize: 9, fontWeight: 700, color: '#FFF' }}>{s.label}</span></div>
                      </div>
                    ))}
                  </div>
                  {/* Taux de conversion — tout blanc */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 12 } as any} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Taux de conversion</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{convRate}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: topP.length > 0 ? 20 : 10 } as any}>
                    <div style={{ height: '100%', borderRadius: 99, background: '#FFF', width: `${convRate}%` } as any} />
                  </div>
                  {/* Top performeurs — séparés visuellement */}
                  {topP.length > 0 && (<>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 14 } as any} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, textAlign: 'left' }}>Top prescripteurs</div>
                    {topP.map((p: any, i: number) => (
                      <div key={p.id || i} style={{ marginBottom: i < topP.length - 1 ? 10 : 0, textAlign: 'left' } as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>#{i+1}</span></div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{p.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{p.prescriptions_count || 0} presc.</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' } as any}>
                          <div style={{ height: '100%', borderRadius: 99, background: 'rgba(255,255,255,0.7)', width: `${Math.round(((p.prescriptions_count || 0) / maxP) * 100)}%` } as any} />
                        </div>
                      </div>
                    ))}
                  </>)}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' } as any} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                    <div style={{ display: 'flex' } as any}>{prescribers.slice(0, 3).map((p: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.2)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{p.name?.charAt(0)}</span></div>))}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Voir les {prescribers.length} prescripteurs</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CHALLENGE RECOMPENSES — gold card */}
          <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '20px', marginBottom: 12 } as any}>
            <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
                <i className="ri-trophy-line" style={{ fontSize: 22, color: '#FFF' }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>Challenge prescripteurs</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Classement du mois — {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
              {ranking.slice(0, 5).map((p: any, i: number) => (
                <div key={p.id || i} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ cursor: 'pointer' } as any}>
                  {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '6px 0' } as any} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' } as any}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>#{i + 1}</span></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{p.name}</div></div>
                    <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{p.prescriptions_count || 0}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>prescriptions</div></div>
                  </div>
                </div>
              ))}
              {ranking.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '10px 0' }}>Aucun prescripteur ce mois</div>}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{user.company_name || 'Entreprise'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: stats.total_intervenants || intervenants.length, label: 'Intervenants' },
            { val: stats.total_prescribers || prescribers.length, label: 'Prescripteurs' },
            { val: activeAlerts.length, label: 'Alertes' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <QuickAction icon="people-outline" label="Intervenants" onPress={() => router.push('/(tabs)/teleconsult')} color="rgba(0,0,0,0.10)" />
        <QuickAction icon="document-text-outline" label="Prescriptions" onPress={() => router.push('/(tabs)/devices')} color="rgba(16,185,129,0.10)" />
        <QuickAction icon="notifications-outline" label="Alertes" onPress={() => router.push('/(tabs)/alerts')} color="rgba(239,68,68,0.08)" />
      </View>

      {/* Ranking */}
      {ranking.length > 0 && (
        <>
          <SectionHeader title="Classement prescripteurs" />
          {ranking.slice(0, 5).map((p: any, i: number) => (
            <TouchableOpacity key={p.id || i} onPress={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: i < 3 ? '#FFF' : '#6B7280' }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.name}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{p.prescriptions_count || 0} prescriptions</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#9CA3AF" />
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Recent Interventions */}
      {interventions.length > 0 && (
        <>
          <SectionHeader title="Interventions recentes" action="Voir tout" onAction={() => router.push('/(tabs)/teleconsult')} />
          {interventions.slice(0, 3).map((iv: any) => (
            <TouchableOpacity key={iv.id} onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: iv.id } })}>
              <Card style={{ borderLeftWidth: 3, borderLeftColor: iv.status === 'completed' ? '#10B981' : iv.status === 'in_progress' ? '#111827' : '#F59E0B' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{iv.beneficiary_name || 'Intervention'}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{iv.status === 'completed' ? 'Terminee' : iv.status === 'in_progress' ? 'En cours' : 'En attente'}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                   MAIN DASHBOARD ROUTER                 */
/* ═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  const r = user.active_role || user.role;

  switch (r) {
    case 'beneficiary': return <BeneficiaryHome token={token} user={user} />;
    case 'guardian': return <GuardianHome token={token} user={user} />;
    case 'teleassistance': return <TeleassistanceHome token={token} user={user} />;
    case 'admin': return <AdminHome token={token} user={user} />;
    case 'prescriber_company': return <CompanyHome token={token} user={user} />;
    default: return <BeneficiaryHome token={token} user={user} />;
  }
}
