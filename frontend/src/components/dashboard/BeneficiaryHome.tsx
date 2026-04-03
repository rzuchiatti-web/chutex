import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertBanner from './AlertBanner';
// CopilotCard removed per user request
import DeviceCards from './DeviceCards';
import FullScreenLoader from '../FullScreenLoader';
import WeighingFlow from './WeighingFlow';
import { HEALTH_IMAGES, REMINDER_IMAGES, isDarkMode, CHX, webShadow, webGlass } from './constants';
import TeamActivityToast from '../programs/TeamActivityToast';
import { NotificationsPopup, LanguagePopup, ReminderCRUDPopup, ReminderNotifPopup, AddGuardianPopup, CheckinPopup, GuardianActivationPopup } from './BeneficiaryPopups';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Image, TextInput } from 'react-native';
import { ContextualTip, OnboardingChecklist, MiniTuto } from '../HelpSystem';
import { DoctorCard } from '../DoctorCard';
import { Icon } from '../WebIcon';
import { HeroCard, StatusBadge, Card, SectionHeader, IconBtn, QuickAction, LanguageFlagButton } from './SharedUI';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { apiFetch, clearApiCache } from '../../services/api';
import { requestNotificationPermission, startReminderChecker, notifyAlert } from '../../services/notifications';
import { SubscriptionBanner, SubscriptionGate } from '../SubscriptionGate';
import WeightGoalDashCard from './WeightGoalDashCard';
import NoraHealthOverlay from './NoraHealthOverlay';
import { useNotifications, NotificationBanner, NotificationCenter } from './NotificationCenter';
import { SleepAlarmSection, TodayExercisesSection, RemindersSection, GuardiansSection } from './sections';
import { useAutoReconnect } from '../../hooks/useAutoReconnect';

const portalMount = (node: React.ReactNode) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};

export function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  useAutoReconnect(token);
  const { t, lang, setLang, flags: langFlags } = useI18n();
  const [isDark, setIsDark] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('chutex_dark') === '1';
    }
    return false;
  });
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chutex_dark', next ? '1' : '0');
      }
      return next;
    });
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return;
    // Clean up any old canvas particles
    const old = document.getElementById('chutex-particles');
    if (old) old.remove();
  }, []);
  const [dashData, setDashData] = useState<any>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [guardianRequests, setGuardianRequests] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showConnectDevice, setShowConnectDevice] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAddGuardianPopup, setShowAddGuardianPopup] = useState(false);
  const [teamInvitations, setTeamInvitations] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any>(null);
  const [activityStreakData, setActivityStreakData] = useState<any>({ current_streak: 0, max_streak: 0, objectives_today: [], badge: null });
  const [predictiveAlerts, setPredictiveAlerts] = useState<any[]>([]);
  const [inviteGuardPhone, setInviteGuardPhone] = useState('');
  const [inviteGuardRelationship, setInviteGuardRelationship] = useState('');
  const [inviteGuardMsg, setInviteGuardMsg] = useState('');
  const [inviteGuardLoading, setInviteGuardLoading] = useState(false);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [weighings, setWeighings] = useState<any[]>([]);
  const [showWeighing, setShowWeighing] = useState(false);
  const [activeTab, setActiveTab] = useState<'beneficiary' | 'guardian'>('beneficiary');
  const [showGuardianActivation, setShowGuardianActivation] = useState(false);
  const [guardianActivationStep, setGuardianActivationStep] = useState(0);
  const [alertSms, setAlertSms] = useState(true);
  const [alertEmail, setAlertEmail] = useState(true);
  const [activatingGuardian, setActivatingGuardian] = useState(false);
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [programCatalog, setProgramCatalog] = useState<any[]>([]);
  const [showCheckin, setShowCheckin] = useState(false);
  const [checkinMood, setCheckinMood] = useState(3);
  const [subscription, setSubscription] = useState<any>(null);
  const [proSub, setProSub] = useState<any>(null);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [proConvo, setProConvo] = useState<any>(null);
  const [todayExercises, setTodayExercises] = useState<any[]>([]);
  const [sleepAlarm, setSleepAlarm] = useState<any>(null);
  const [editingAlarm, setEditingAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinSending, setCheckinSending] = useState(false);
  const [checkinFeedback, setCheckinFeedback] = useState('');
  const [editReminder, setEditReminder] = useState<any>(null);
  const [showReminderCRUD, setShowReminderCRUD] = useState(false);
  const [reminderNotif, setReminderNotif] = useState<any>(null);
  const [remForm, setRemForm] = useState({ title: '', time: '08:00', reminder_type: 'hydration', notes: '', days: ['lun','mar','mer','jeu','ven','sam','dim'] });
  const sosPulse = useRef(new Animated.Value(1)).current;
  const { refreshUser } = useAuth();

  // Real-time notifications via WebSocket
  const { notifications: liveNotifs, unreadCount: liveUnread, liveBanner, markRead, markAllRead, dismissBanner } = useNotifications(token);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [showNoraHealth, setShowNoraHealth] = useState(false);
  const [minceurData, setMinceurData] = useState<any>(null);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  const syncBeneficiaryLocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    try {
      const pos: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 12000, maximumAge: 0,
        });
      });
      const latitude = pos?.coords?.latitude;
      const longitude = pos?.coords?.longitude;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        await apiFetch('/api/location/update', { method: 'POST', body: JSON.stringify({ latitude, longitude }) }, token);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    syncBeneficiaryLocation();
    const intervalId = setInterval(() => { syncBeneficiaryLocation(); }, 60000);
    return () => clearInterval(intervalId);
  }, [syncBeneficiaryLocation]);

  const fetchData = useCallback(async () => {
    try {
      const batch = await apiFetch('/api/dashboard/batch', {}, token).catch(() => null);
      if (batch) {
        setDashData(batch.dashboard_summary);
        setReminders(Array.isArray(batch.reminders) ? batch.reminders : []);
        setGuardians(Array.isArray(batch.guardians) ? batch.guardians : []);
        setGuardianRequests(Array.isArray(batch.guardian_requests) ? batch.guardian_requests : []);
        if (batch.subscription) setSubscription(batch.subscription);
        if (batch.health_summary) setHealthSummary(batch.health_summary);
        setActiveAlerts(Array.isArray(batch.active_alerts) ? batch.active_alerts : []);
        if (Array.isArray(batch.scale_history)) {
          const mapped = batch.scale_history
            .map((r: any) => {
              const data = r?.data || r;
              return {
                id: r?.id || '', date: r?.timestamp || r?.date || r?.created_at || '',
                weight: data?.weight || 0, bmi: data?.bmi || 0, body_fat_pct: data?.body_fat_pct || 0,
                muscle_pct: data?.muscle_pct || 0, water_pct: data?.water_pct || 0,
                status: data?.health_evaluation || '--',
              };
            })
            .filter((w: any) => w.weight > 0)
            .slice(0, 20);
          setWeighings(mapped);
        }
      }
      const [prog, cat] = await Promise.all([
        apiFetch('/api/programs/active', {}, token).catch(() => null),
        apiFetch('/api/programs/catalog', {}, token).catch(() => null),
      ]);
      if (prog) setActiveProgram(prog);
      if (cat?.programs) setProgramCatalog(cat.programs);
      apiFetch('/api/programs/team/invitations', {}, token).then(inv => { if (Array.isArray(inv)) setTeamInvitations(inv); }).catch(() => {});
      apiFetch('/api/nora/checkin-daily', { method: 'POST' }, token).then(s => { if (s) setStreakData(s); }).catch(() => {});
      apiFetch('/api/nora/predictive-check', {}, token).then(p => { if (p?.alerts) setPredictiveAlerts(p.alerts); }).catch(() => {});
      apiFetch('/api/health/activity-streak', {}, token).then(s => { if (s) setActivityStreakData(s); }).catch(() => {});
      apiFetch('/api/pro/my-subscription', {}, token).then(s => { if (s?.id) setProSub(s); }).catch(() => {});
      apiFetch('/api/pro/unread-count', {}, token).then(u => { if (u) setUnreadMsgs(u.unread || 0); }).catch(() => {});
      apiFetch('/api/pro/conversations', {}, token).then(c => { if (c?.length > 0) setProConvo(c[0]); }).catch(() => {});
      apiFetch('/api/minceur/weight-details', {}, token).then(d => { if (d) setMinceurData(d); }).catch(() => {});
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 60000); return () => clearInterval(iv); }, [fetchData]);
  // Independent fetch for today's exercises (coach-prescribed)
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/pro/beneficiary-today-exercises', {}, token)
      .then(e => { if (Array.isArray(e)) setTodayExercises(e); })
      .catch(() => {});
    // Fetch sleep alarm
    apiFetch('/api/health/sleep-alarm', {}, token)
      .then(d => { if (d) { setSleepAlarm(d); setAlarmTime(d.wake_time || '07:00'); } })
      .catch(() => {});
  }, [token]);
  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const today = new Date().toISOString().split('T')[0];
      const lastSeen = localStorage.getItem('briefing_last_date');
      if (lastSeen !== today) { router.push('/morning-briefing' as any); }
    }
  }, []);
  useEffect(() => { if (reminders.length > 0) { const cleanup = startReminderChecker(reminders, token); return cleanup; } }, [reminders, token]);

  useEffect(() => {
    if (reminders.length === 0 || Platform.OS !== 'web') return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowTime = `${hh}:${mm}`;
    const dayNames = ['dim','lun','mar','mer','jeu','ven','sam'];
    const today = dayNames[now.getDay()];
    const due = reminders.find((r: any) => r.active && !r.completed && r.time === nowTime && (!r.days?.length || r.days.includes(today)));
    if (due && !reminderNotif) setReminderNotif(due);
  }, [reminders]);

  const getNextReminderTime = (rem: any) => {
    if (!rem.time || !rem.active) return '';
    const now = new Date();
    const [rh, rm] = rem.time.split(':').map(Number);
    const target = new Date(now); target.setHours(rh, rm, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const diff = target.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const reminderMeta: Record<string, { label: string; img: string; question: string }> = {
    hydration: { label: 'Hydratation', img: REMINDER_IMAGES.hydration, question: 'Avez-vous bien pense a vous hydrater ?' },
    medication: { label: 'Traitement', img: REMINDER_IMAGES.medication, question: 'Avez-vous bien pense a prendre votre traitement ?' },
    alarm: { label: 'Alarmes', img: REMINDER_IMAGES.alarm, question: 'Avez-vous bien pense a votre rappel ?' },
  };

  const saveReminder = async () => {
    try {
      if (editReminder?.id) {
        await apiFetch(`/api/reminders/${editReminder.id}`, { method: 'PUT', body: JSON.stringify(remForm) }, token);
      } else {
        await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify(remForm) }, token);
      }
      clearApiCache(); await fetchData();
      setShowReminderCRUD(false); setEditReminder(null);
    } catch {}
  };

  const deleteReminder = async (id: string) => {
    try {
      await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' }, token);
      clearApiCache(); await fetchData();
    } catch {}
  };

  const onCrudDone = async (type: string) => {
    clearApiCache();
    await fetchData();
  };

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      let lat = null, lng = null;
      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          const pos: any = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
          lat = pos.coords.latitude; lng = pos.coords.longitude;
        }
      } catch {}
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'manual_app', message: 'Bouton SOS active depuis l\'application', device_type: 'app', latitude: lat, longitude: lng }) }, token);
      notifyAlert('sos', 'SOS envoye ! Vos gardiens ont ete alertes.');
      Alert.alert('Alerte envoyee', 'Nous avons bien recu votre alerte.\n\n1. Vos gardiens sont notifies par SMS et push\n2. Votre position est transmise\n3. Un intervenant sera envoye si besoin');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSosLoading(false); }
  };

  const switchToGuardian = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      if (user.has_guardian_space) {
        await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'guardian' }) }, token);
        await refreshUser();
      } else { setShowGuardianActivation(true); setGuardianActivationStep(0); }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSwitching(false); }
  };

  const handleTabSwitch = (tab: 'beneficiary' | 'guardian') => {
    if (tab === 'guardian') {
      if (user.has_guardian_space) { switchToGuardian(); } else { setShowGuardianActivation(true); setGuardianActivationStep(0); }
    }
    setActiveTab(tab);
  };

  const activateGuardianMode = async () => {
    setActivatingGuardian(true);
    try {
      await apiFetch('/api/auth/activate-guardian', { method: 'POST', body: JSON.stringify({ guardian_type: 'particular', alert_sms: alertSms, alert_email: alertEmail }) }, token);
      await refreshUser();
      setShowGuardianActivation(false); setActiveTab('beneficiary');
      Alert.alert('Espace aidant active', 'Vous pouvez maintenant basculer vers votre espace aidant.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setActivatingGuardian(false); }
  };

  if (loading) return Platform.OS === 'web' ? <FullScreenLoader /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}><ActivityIndicator size="large" color="#111" /></View>;

  const br = dashData?.bracelet || { heart_rate: 0, spo2: 0, steps: 0, blood_pressure: { systolic: 0, diastolic: 0 }, temperature: 0, battery: 0, connected: false, calories: 0, distance_km: 0, heart_rate_history: [], paired: false };
  const sc = dashData?.scale || { weight: 0, bmi: 0, body_fat: 0, muscle_mass: 0, water_pct: 0, battery: 0, connected: false, paired: false };
  const vs = dashData?.vest || { fall_detected: false, posture_score: 0, chest_temp: 0, battery: 0, connected: false, wearing_hours_today: 0, alerts_today: 0, paired: false };
  const sl = dashData?.sleep || null;

  /* ─── WEB: Dashboard with light/dark mode ─── */
  if (Platform.OS === 'web') {
    const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
    const C = isDark
      ? { card: 'rgba(70,70,78,0.85)', text: '#FFF', sub: 'rgba(255,255,255,0.55)', arrow: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)', sep: 'rgba(255,255,255,0.08)' }
      : { card: '#F4F4F5', text: '#1A1A2E', sub: 'rgba(0,0,0,0.45)', arrow: 'rgba(0,0,0,0.3)', border: 'rgba(0,0,0,0.04)', sep: 'rgba(0,0,0,0.06)' };
    const glass = { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${C.border}` };

    const GC = ({ children, style, onClick, testId }: any) => (
      <div data-testid={testId} onClick={onClick} className="dash-slide-up" style={{ padding: '20px', borderRadius: 14, background: C.card, marginBottom: 20, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.18s', ...glass, ...style } as any}
        onMouseEnter={(e: any) => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
        {children}
      </div>
    );
    return (
      <div data-testid="beneficiary-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: 'hidden' } as any}>

        {/* ═══ FULL SCROLL CONTAINER ═══ */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

          {/* ═══ HEADER with red BG — scrolls, NO rounded corners, BEHIND content card ═══ */}
          <div style={{ position: 'relative', zIndex: 1 } as any}>
            <img src={BG_RED} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 28px' } as any}>
              {/* Header row */}
              <div data-testid="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                  <div onClick={() => router.push('/(tabs)/profile' as any)} style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' } as any}>
                    {user.avatar_url ? <img src={user.avatar_url} style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 17, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', letterSpacing: -0.5 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{activeTab === 'beneficiary' ? t('space_beneficiary') : t('space_guardian')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                  <div data-testid="theme-toggle-btn" onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className={isDark ? 'ri-sun-line' : 'ri-moon-line'} style={{ fontSize: 18, color: '#FFF' }} />
                  </div>
                  <div data-testid="notification-bell" onClick={() => setNotifCenterOpen(!notifCenterOpen)} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}>
                    <i className="ri-notification-4-line" style={{ fontSize: 18, color: '#FFF' }} />
                    {liveUnread > 0 && <div style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 999, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#FFF', padding: '0 3px', border: '2px solid rgba(0,0,0,0.3)' } as any}>{liveUnread > 9 ? '9+' : liveUnread}</div>}
                  </div>
                  <div data-testid="lang-picker-btn" onClick={() => setLangOpen(!langOpen)} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, lineHeight: 1 } as any}>
                    {lang === 'FR' ? '\u{1F1EB}\u{1F1F7}' : lang === 'EN' ? '\u{1F1EC}\u{1F1E7}' : lang === 'ES' ? '\u{1F1EA}\u{1F1F8}' : lang === 'DE' ? '\u{1F1E9}\u{1F1EA}' : lang === 'IT' ? '\u{1F1EE}\u{1F1F9}' : lang === 'PT' ? '\u{1F1F5}\u{1F1F9}' : lang === 'NL' ? '\u{1F1F3}\u{1F1F1}' : '\u{1F30D}'}
                  </div>
                </div>
              </div>
              {/* Alert banner — always white text on red bg */}
              <AlertBanner activeAlerts={activeAlerts} />
            </div>
            <NotificationsPopup show={showNotifs} onClose={() => setShowNotifs(false)} activeAlerts={activeAlerts} guardianRequests={guardianRequests} predictiveAlerts={predictiveAlerts} token={token} onRefresh={fetchData} />
            <LanguagePopup show={langOpen} onClose={() => setLangOpen(false)} lang={lang} setLang={setLang} />
            {/* Notification Center Glass Popup */}
            {notifCenterOpen && portalMount(
              <div onClick={() => setNotifCenterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)', overflowY: 'auto' } as any}>
                <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 24px 120px', boxSizing: 'border-box' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                    <div onClick={() => setNotifCenterOpen(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-notification-4-line" style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)' }} /></div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Notifications</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{liveUnread > 0 ? `${liveUnread} non lue${liveUnread > 1 ? 's' : ''}` : 'Toutes lues'}</div>
                  </div>
                  {liveUnread > 0 && <div onClick={markAllRead} style={{ textAlign: 'center', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#3B82F6', cursor: 'pointer' }}>Tout marquer comme lu</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                    {liveNotifs.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Aucune notification</div>}
                    {liveNotifs.map((n: any) => (
                      <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 18, cursor: n.read ? 'default' : 'pointer', background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)', border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.2s' } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${n.color || '#3B82F6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                          <i className={n.icon || 'ri-notification-3-line'} style={{ fontSize: 16, color: n.color || '#3B82F6' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: n.read ? 'rgba(255,255,255,0.4)' : '#FFF' }}>{n.title}</span>
                            {!n.read && <div style={{ width: 6, height: 6, borderRadius: 3, background: n.color || '#3B82F6', flexShrink: 0 } as any} />}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{n.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live notification banner */}
          <NotificationBanner notification={liveBanner} onDismiss={dismissBanner} />

          {Platform.OS === 'web' && <TeamActivityToast token={token} />}

          {/* ═══ CONTENT CARD — overlaps header, IN FRONT ═══ */}
          <div style={{
            padding: '24px 16px 120px', marginTop: -16,
            borderRadius: '24px 24px 0 0',
            background: isDark ? 'linear-gradient(to bottom, #000 0%, #3A3A3C 100%)' : '#FFF',
            transition: 'background 0.4s ease',
            position: 'relative', zIndex: 10,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          } as any}>

          <div data-testid="nora-health-btn" onClick={() => setShowNoraHealth(true)}
            style={{ borderRadius: 16, background: '#000', padding: '14px 16px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'opacity 0.15s' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>
            <video autoPlay loop muted playsInline style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'contain', flexShrink: 0 } as any}
              src="https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4" />
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Analyse & Objectifs</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Analyse personnalisee de votre etat de sante</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>

          {/* ── Sommeil (right after Nora) ── */}
          <SleepAlarmSection sleepAlarm={sleepAlarm} alarmTime={alarmTime} setAlarmTime={setAlarmTime} editingAlarm={editingAlarm} setEditingAlarm={setEditingAlarm} setSleepAlarm={setSleepAlarm} token={token} C={C} glass={glass} isDark={isDark} />

          <div style={{ height: 1, background: C.sep, margin: '4px 0 16px' } as any} />

          {/* ── CALORIE + WEIGHT GOAL COMBINED CARD ── */}
          {minceurData?.recommendations?.daily_calories > 0 && (() => {
            const recs = minceurData.recommendations;
            const wg = minceurData.goal;
            const hasGoal = wg && wg.target_kg;
            return (
              <div data-testid="calorie-intake-card" onClick={() => router.push('/minceur' as any)}
                style={{ borderRadius: 18, background: '#F4F4F5', padding: 0, marginBottom: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <div style={{ padding: '18px 18px 14px' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Apport calorique journalier</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 } as any}>
                        <span style={{ fontSize: 38, fontWeight: 900, color: '#111', lineHeight: 1, letterSpacing: -1 }}>{recs.daily_calories}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>kcal</span>
                      </div>
                    </div>
                    {recs.water_ml > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', borderRadius: 14, background: 'rgba(96,165,250,0.1)' } as any}>
                        <i className="ri-drop-fill" style={{ fontSize: 18, color: '#60A5FA' }} />
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#60A5FA', marginTop: 2 }}>{(recs.water_ml / 1000).toFixed(1)}L</span>
                      </div>
                    )}
                  </div>
                </div>
                {recs.macros && (
                  <div style={{ display: 'flex', borderTop: '1px solid #E5E7EB' } as any}>
                    {[{ l: 'Proteines', v: recs.macros.proteines_g, c: '#10B981' }, { l: 'Glucides', v: recs.macros.glucides_g, c: '#F59E0B' }, { l: 'Lipides', v: recs.macros.lipides_g, c: '#EF4444' }].map((m, i) => (
                      <div key={i} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' } as any}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1 }}>{m.v}<span style={{ fontSize: 9, color: '#9CA3AF' }}>g</span></div>
                        <div style={{ fontSize: 8, color: m.c, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                )}
                {hasGoal && (() => {
                  const currentW = minceurData.current_weight || 0;
                  const diff = currentW - wg.target_kg;
                  const lost = diff > 0 ? diff : 0;
                  const progressPct = diff > 0 ? Math.max(5, Math.min(95, 100 - (diff / (diff + 2)) * 100)) : (diff < 0 ? Math.max(5, 50) : 100);
                  const createdDate = wg.created_at ? new Date(wg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
                  return (
                  <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 18px' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <i className="ri-scales-line" style={{ fontSize: 14, color: '#3B82F6' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.5 }}>Objectif poids</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        {createdDate && <span style={{ fontSize: 9, color: '#9CA3AF' }}>depuis {createdDate}</span>}
                        <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.08)', fontSize: 9, fontWeight: 700, color: '#3B82F6' }}>{wg.weeks} sem</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 } as any}>
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#111', lineHeight: 1 }}>{currentW > 0 ? currentW : '--'}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Actuel</div>
                      </div>
                      <div style={{ flex: 1, position: 'relative', height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden' } as any}>
                        <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #60A5FA, #3B82F6)', width: `${progressPct}%`, transition: 'width 0.8s ease' } as any} />
                      </div>
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#3B82F6', lineHeight: 1 }}>{wg.target_kg}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', marginTop: 2 }}>Cible</div>
                      </div>
                    </div>
                    {lost > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 } as any}>
                        <i className="ri-arrow-down-line" style={{ fontSize: 12, color: '#10B981' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>-{lost.toFixed(1)}kg restants</span>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* ── TEAM INVITATIONS ── */}
          {teamInvitations.length > 0 && teamInvitations.map((inv: any) => (
            <div key={inv.id} data-testid={`team-invite-${inv.id}`} style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, padding: '16px 18px', marginBottom: 12, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-team-line" style={{ fontSize: 20, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Invitation programme en equipe</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{inv.inviter_name} vous invite a faire "{inv.program_title}" ensemble</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div data-testid={`accept-team-${inv.id}`} onClick={async () => {
                  try { await apiFetch(`/api/programs/team/invitations/${inv.id}/accept`, { method: 'POST' }, token); setTeamInvitations(prev => prev.filter(i => i.id !== inv.id)); fetchData(); } catch {}
                }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#10B981' } as any}>Accepter</div>
                <div data-testid={`reject-team-${inv.id}`} onClick={async () => {
                  try { await apiFetch(`/api/programs/team/invitations/${inv.id}/reject`, { method: 'POST' }, token); setTeamInvitations(prev => prev.filter(i => i.id !== inv.id)); } catch {}
                }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.sub } as any}>Refuser</div>
              </div>
            </div>
          ))}

          {/* ── Weight goal now inside calorie card ── */}

          {showWeighing && <WeighingFlow onClose={() => setShowWeighing(false)} d={dashData?.scale || {}} weighings={weighings} />}

          {/* ── PROGRAMME EN COURS (after weight goal) ── */}
          {activeProgram?.active && (() => {
            const ap = activeProgram;
            const clr = ap.program?.color || '#A78BFA';
            const tasks = ap.today_tasks?.tasks || [];
            const doneCount = ap.task_progress?.tasks_done_indices?.length || 0;
            const totalTasks = tasks.length;
            const allDone = totalTasks > 0 && doneCount >= totalTasks;
            return (
              <>
              <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />
              <div data-testid="program-section" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mon programme</div>
                  <div style={{ width: 36, height: 36, borderRadius: 999, background: clr, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={ap.program.icon || 'ri-calendar-todo-line'} style={{ fontSize: 16, color: '#FFF' }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Suivez votre progression quotidienne et restez motive.</div>
                <div data-testid="active-program-card" className="cl-press" onClick={() => router.push('/(tabs)/chat' as any)}
                  style={{ borderRadius: 18, background: '#F4F4F5', padding: '18px', cursor: 'pointer', transition: 'transform 0.18s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 } as any}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: `${clr}15`, border: `1.5px solid ${clr}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={ap.program.icon} style={{ fontSize: 22, color: clr }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 } as any}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{ap.program.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: clr }}>Jour {ap.current_day}/{ap.program.duration_days}</span>
                        {ap.streak > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: '#FBBF24', padding: '1px 6px', borderRadius: 6, background: 'rgba(251,191,36,0.08)' }}>
                            <i className="ri-fire-fill" style={{ fontSize: 10 }} />{ap.streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: clr }}>{ap.progress_pct}%</div>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden', marginBottom: 14 } as any}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${ap.progress_pct}%`, background: `linear-gradient(90deg, ${clr}, ${clr}80)`, transition: 'width 0.8s ease' } as any} />
                  </div>
                  {ap.today_tasks && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                        <div style={{ display: 'flex', gap: 3 } as any}>
                          {tasks.slice(0, 5).map((_: any, ti: number) => (
                            <div key={ti} style={{ width: 8, height: 8, borderRadius: 4, background: ti < doneCount ? '#10B981' : '#D1D5DB', transition: 'background 0.3s' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: allDone ? '#10B981' : C.sub }}>
                          {allDone ? 'Tout fait !' : `${doneCount}/${totalTasks} actions`}
                        </span>
                      </div>
                      <div style={{ padding: '4px 10px', borderRadius: 8, background: ap.today_checkin ? 'rgba(16,185,129,0.08)' : `${clr}08`, border: `1px solid ${ap.today_checkin ? 'rgba(16,185,129,0.15)' : `${clr}15`}`, fontSize: 10, fontWeight: 700, color: ap.today_checkin ? '#10B981' : clr }}>
                        {ap.today_checkin ? 'Bilan fait' : 'Continuer'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </>
            );
          })()}

          {/* ── Abonnement Pro en attente ── */}
          {/* ── Exercices du jour ── */}
          {todayExercises.length > 0 && (
            <>
              <div style={{ height: 1, background: C.sep, margin: '10px 0 24px' } as any} />
              <TodayExercisesSection todayExercises={todayExercises} C={C} glass={glass} />
            </>
          )}

          {/* ── Abonnement Pro en attente ── */}
          {proSub && proSub.status === 'pending' && (
            <div data-testid="pro-subscription-offer" className="dash-slide-up" style={{ marginBottom: 20, padding: '20px', borderRadius: 20, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', ...glass } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-vip-crown-fill" style={{ fontSize: 22, color: '#D4AF37' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Offre de {proSub.professional_name}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>Abonnement {proSub.type === 'sport' ? 'Sport' : 'Physio'} · {proSub.price_ttc}€/mois</div>
                </div>
              </div>
              {proSub.description && <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>{proSub.description}</div>}
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div data-testid="accept-sub-btn" onClick={async () => {
                  try {
                    const res = await apiFetch(`/api/pro/subscriptions/${proSub.id}/accept`, { method: 'POST' }, token);
                    if (res?.checkout_url) { window.open(res.checkout_url, '_blank'); }
                    else { await apiFetch(`/api/pro/subscriptions/${proSub.id}/simulate-payment`, { method: 'POST' }, token); fetchData(); }
                  } catch (e: any) { Alert.alert('Erreur', e.message); }
                }} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', fontSize: 13, fontWeight: 800, color: '#D4AF37' } as any}>
                  Accepter · {proSub.price_ttc}€/mois
                </div>
                <div data-testid="decline-sub-btn" onClick={async () => {
                  try { await apiFetch(`/api/pro/subscriptions/${proSub.id}/cancel`, { method: 'POST' }, token); setProSub(null); } catch {}
                }} style={{ padding: '12px 16px', borderRadius: 999, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)', fontSize: 13, fontWeight: 600, color: 'rgba(239,68,68,0.6)' } as any}>
                  Refuser
                </div>
              </div>
            </div>
          )}

          {/* ── Abonnement Pro actif ── */}
          {proSub && proSub.status === 'active' && (
            <div data-testid="pro-subscription-active" className="dash-slide-up" style={{ marginBottom: 20, padding: '16px 18px', borderRadius: 20, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', gap: 12, ...glass } as any}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-vip-crown-fill" style={{ fontSize: 18, color: '#10B981' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Abo {proSub.type === 'sport' ? 'Sport' : 'Physio'} actif</div>
                <div style={{ fontSize: 11, color: C.sub }}>{proSub.professional_name} · {proSub.price_ttc}€/mois</div>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>Actif</span>
              </div>
            </div>
          )}

          {/* ── Messages Pro removed from dashboard — now accessible via navbar Messages tab ── */}

          {/* ── Dispositifs connectes ── */}
          {(() => {
            const deviceList = [
              { show: br.connected || br.paired, name: 'Bracelet Elio', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', battery: br.battery, connected: br.connected, color: '#22D3EE' },
              { show: (sc.connected || sc.paired) && weighings.length > 0, name: 'Balance Vita', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', battery: sc.battery, connected: sc.connected, color: '#A78BFA' },
              { show: vs.connected || vs.paired, name: 'Elder', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', battery: vs.battery, connected: vs.connected, color: '#F59E0B' },
            ];
            const visibleDevices = deviceList.filter(d => d.show);
            return (
            <>
              <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />
              <div data-testid="devices-section" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mes dispositifs</div>
                  <div onClick={() => router.push('/(tabs)/devices' as any)} style={{ width: 34, height: 34, borderRadius: 999, background: isDark ? '#FFF' : '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <i className="ri-add-line" style={{ fontSize: 18, color: isDark ? '#111' : '#FFF' }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Vos appareils connectes pour le suivi de votre sante au quotidien.</div>
                {visibleDevices.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
                    {visibleDevices.map((d, i) => (
                      <div key={i} data-testid={`device-card-${i}`} onClick={() => router.push('/(tabs)/devices' as any)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: C.card, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
                        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                        <img src={d.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 } as any} />
                        <div style={{ flex: 1, minWidth: 0 } as any}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>{d.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: d.connected ? '#10B981' : '#F59E0B' } as any} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: d.connected ? '#10B981' : '#F59E0B' }}>{d.connected ? 'Connecte' : 'En veille'}</span>
                          </div>
                          {d.battery > 0 && (
                            <div style={{ height: 4, borderRadius: 2, background: C.sep, overflow: 'hidden', marginTop: 6 } as any}>
                              <div style={{ height: 4, borderRadius: 2, width: `${d.battery}%`, background: d.battery > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : d.battery > 25 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)' } as any} />
                            </div>
                          )}
                        </div>
                        {d.battery > 0 && <div style={{ fontSize: 14, fontWeight: 900, color: d.battery > 50 ? '#10B981' : d.battery > 25 ? '#F59E0B' : '#EF4444', flexShrink: 0 }}>{d.battery}%</div>}
                        <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div data-testid="no-devices-card" onClick={() => router.push('/(tabs)/devices' as any)}
                    style={{ padding: '24px 16px', borderRadius: 18, background: C.card, cursor: 'pointer', textAlign: 'center', ...glass } as any}>
                    <i className="ri-bluetooth-line" style={{ fontSize: 28, color: C.sub, marginBottom: 8, display: 'block' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Aucun dispositif connecte</div>
                    <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>Ajoutez votre bracelet, balance ou gilet</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: isDark ? '#FFF' : '#111', fontSize: 13, fontWeight: 700, color: isDark ? '#111' : '#FFF' } as any}>
                      <i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter un dispositif
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />
            </>
          );})()}

          {/* ── Rappels ── */}
          <RemindersSection reminders={reminders} C={C} glass={glass} isDark={isDark} setEditReminder={setEditReminder} setShowReminderCRUD={setShowReminderCRUD} />

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          {/* ── Gardiens ── */}
          <GuardiansSection guardians={guardians} C={C} glass={glass} isDark={isDark} setShowAddGuardianPopup={setShowAddGuardianPopup} />

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          <DoctorCard onPress={() => router.push('/teleconsult-doctor' as any)} />

          </div>{/* end gradient content card */}
        </div>{/* end scroll container */}

        {/* ═══ POPUPS — outside scroll/content card to avoid stacking context ═══ */}
        <ReminderCRUDPopup show={showReminderCRUD} editReminder={editReminder} setEditReminder={setEditReminder} onClose={() => { setShowReminderCRUD(false); setEditReminder(null); }} reminders={reminders} reminderMeta={reminderMeta} token={token} fetchData={fetchData} deleteReminder={deleteReminder} setReminders={setReminders} onCrudDone={onCrudDone} />
        <ReminderNotifPopup reminderNotif={reminderNotif} setReminderNotif={setReminderNotif} reminderMeta={reminderMeta} token={token} fetchData={fetchData} />
        <AddGuardianPopup show={showAddGuardianPopup} onClose={() => { setShowAddGuardianPopup(false); setInviteGuardPhone(""); setInviteGuardRelationship(""); setInviteGuardMsg(""); }} phone={inviteGuardPhone} setPhone={setInviteGuardPhone} relationship={inviteGuardRelationship} setRelationship={setInviteGuardRelationship} msg={inviteGuardMsg} setMsg={setInviteGuardMsg} loading={inviteGuardLoading} setLoading={setInviteGuardLoading} token={token} fetchData={fetchData} />
        <CheckinPopup show={showCheckin} onClose={() => setShowCheckin(false)} activeProgram={activeProgram} mood={checkinMood} setMood={setCheckinMood} note={checkinNote} setNote={setCheckinNote} sending={checkinSending} setSending={setCheckinSending} feedback={checkinFeedback} setFeedback={setCheckinFeedback} token={token} fetchData={fetchData} />
        <GuardianActivationPopup show={showGuardianActivation} onClose={() => { setShowGuardianActivation(false); setActiveTab("beneficiary"); }} step={guardianActivationStep} setStep={setGuardianActivationStep} alertSms={alertSms} setAlertSms={setAlertSms} alertEmail={alertEmail} setAlertEmail={setAlertEmail} activating={activatingGuardian} onActivate={activateGuardianMode} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseRing{0%{transform:scale(1);opacity:0.3}100%{transform:scale(1.5);opacity:0}} @keyframes twBlink{0%,100%{opacity:1}50%{opacity:0}} @keyframes dashSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} .dash-slide-up{animation:dashSlideUp 0.5s ease-out both} .dash-slide-up:nth-child(1){animation-delay:0s} .dash-slide-up:nth-child(2){animation-delay:0.08s} .dash-slide-up:nth-child(3){animation-delay:0.16s} .dash-slide-up:nth-child(4){animation-delay:0.24s} .dash-slide-up:nth-child(5){animation-delay:0.32s} .dash-slide-up:nth-child(6){animation-delay:0.4s} .tw-cursor{animation:twBlink 1s step-end infinite} @keyframes noraFadeIn{from{opacity:0}to{opacity:1}} @keyframes noraPulse{0%,100%{transform:scale(1);opacity:0.85}50%{transform:scale(1.08);opacity:1}} @keyframes noraTextIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}` }} />

        {/* ═══ NORA HEALTH OVERLAY ═══ */}
        {showNoraHealth && <NoraHealthOverlay token={token} onClose={() => setShowNoraHealth(false)} />}
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center' }}>Dashboard disponible uniquement sur la version web.</Text>
    </View>
  );
}
