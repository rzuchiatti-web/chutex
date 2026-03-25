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
import { DailyObjectivesOnDashboard } from './DailyObjectives';

const IMG_GUARDIANS = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/ashlkedd_img_gardians.png';

export function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t, lang, setLang, flags: langFlags } = useI18n();
  const [isDark, setIsDark] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('chutex_dark') !== '0';
    }
    return true;
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
  const [checkinNote, setCheckinNote] = useState('');
  const [checkinSending, setCheckinSending] = useState(false);
  const [checkinFeedback, setCheckinFeedback] = useState('');
  const [editReminder, setEditReminder] = useState<any>(null);
  const [showReminderCRUD, setShowReminderCRUD] = useState(false);
  const [reminderNotif, setReminderNotif] = useState<any>(null);
  const [remForm, setRemForm] = useState({ title: '', time: '08:00', reminder_type: 'hydration', notes: '', days: ['lun','mar','mer','jeu','ven','sam','dim'] });
  const sosPulse = useRef(new Animated.Value(1)).current;
  const { refreshUser } = useAuth();

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
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 60000); return () => clearInterval(iv); }, [fetchData]);
  // Independent fetch for today's exercises (coach-prescribed)
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/pro/beneficiary-today-exercises', {}, token)
      .then(e => { if (Array.isArray(e)) setTodayExercises(e); })
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
  useEffect(() => { if (reminders.length > 0) { const cleanup = startReminderChecker(reminders); return cleanup; } }, [reminders]);

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
      : { card: '#E8E8EA', text: '#1A1A2E', sub: 'rgba(0,0,0,0.45)', arrow: 'rgba(0,0,0,0.3)', border: 'rgba(0,0,0,0.04)', sep: 'rgba(0,0,0,0.06)' };
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
            <div style={{ position: 'relative', zIndex: 2, padding: '22px 20px 28px' } as any}>
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
                  <div data-testid="notif-bell" onClick={() => setShowNotifs(!showNotifs)} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}>
                    <i className="ri-notification-4-line" style={{ fontSize: 18, color: '#FFF' }} />
                    {(guardianRequests.length > 0 || activeAlerts.length > 0 || predictiveAlerts.length > 0) && <div style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, background: '#EF4444', border: '2px solid rgba(0,0,0,0.3)' } as any} />}
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
          </div>

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

          <DailyObjectivesOnDashboard token={token} isDark={isDark} />

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

          {/* ── PROGRAMME EN COURS ── */}
          {activeProgram?.active && (() => {
            const ap = activeProgram;
            const clr = ap.program?.color || '#A78BFA';
            const tasks = ap.today_tasks?.tasks || [];
            const doneCount = ap.task_progress?.tasks_done_indices?.length || 0;
            const totalTasks = tasks.length;
            const allDone = totalTasks > 0 && doneCount >= totalTasks;
            return (
              <div data-testid="active-program-card" className="dash-slide-up cl-press" onClick={() => router.push('/(tabs)/chat' as any)}
                style={{ borderRadius: 14, background: `linear-gradient(135deg, ${clr}10, ${clr}05)`, border: `1px solid ${clr}20`, padding: '18px', marginBottom: 20, cursor: 'pointer', transition: 'transform 0.18s', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', position: 'relative', overflow: 'hidden' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <style dangerouslySetInnerHTML={{ __html: `@keyframes dash-prog-glow { 0%,100% { box-shadow: 0 0 20px ${clr}10; } 50% { box-shadow: 0 0 40px ${clr}25; } }` }} />
                <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${clr}08 0%, transparent 70%)` } as any} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 } as any}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: `${clr}12`, border: `1.5px solid ${clr}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'dash-prog-glow 3s ease-in-out infinite', flexShrink: 0 } as any}>
                    <i className={ap.program.icon} style={{ fontSize: 22, color: clr }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{ap.program.title}</div>
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
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 14 } as any}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${ap.progress_pct}%`, background: `linear-gradient(90deg, ${clr}, ${clr}80)`, transition: 'width 0.8s ease', boxShadow: `0 0 12px ${clr}40` } as any} />
                </div>
                {ap.today_tasks && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                      <div style={{ display: 'flex', gap: 3 } as any}>
                        {tasks.slice(0, 5).map((_: any, ti: number) => (
                          <div key={ti} style={{ width: 8, height: 8, borderRadius: 4, background: ti < doneCount ? '#10B981' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: allDone ? '#10B981' : 'rgba(255,255,255,0.35)' }}>
                        {allDone ? 'Tout fait !' : `${doneCount}/${totalTasks} actions`}
                      </span>
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: ap.today_checkin ? 'rgba(16,185,129,0.08)' : `${clr}08`, border: `1px solid ${ap.today_checkin ? 'rgba(16,185,129,0.15)' : `${clr}12`}`, fontSize: 10, fontWeight: 700, color: ap.today_checkin ? '#10B981' : clr }}>
                      {ap.today_checkin ? 'Bilan fait' : 'Continuer'}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <WeightGoalDashCard token={token} />

          {(br.connected || br.paired || ((sc.connected || sc.paired) && weighings.length > 0) || vs.connected || vs.paired) && (
            <DeviceCards br={br} sc={sc} vs={vs} weighings={weighings} onStartWeighing={() => setShowWeighing(true)} onRefresh={fetchData} subscription={subscription} />
          )}

          {showWeighing && <WeighingFlow onClose={() => setShowWeighing(false)} d={dashData?.scale || {}} weighings={weighings} />}

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          {/* ── Abonnement Pro en attente ── */}
          {/* ── Exercices du jour (prescrit par le coach) ── */}
          {todayExercises.length > 0 && (
            <div data-testid="today-exercises-dashboard" className="dash-slide-up" style={{ marginBottom: 20 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-run-line" style={{ fontSize: 20, color: '#EF4444' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Exercices du jour</div>
                  <div style={{ fontSize: 11, color: C.sub }}>Prescrit par votre coach</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#9CA3AF', background: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB', padding: '3px 10px', borderRadius: 999 }}>{todayExercises.length}</span>
              </div>
              {todayExercises.map((ex: any, i: number) => (
                <div key={ex.id || i} data-testid={`dash-exercise-${i}`}
                  onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18, background: C.card, marginBottom: 8, cursor: 'pointer',
                    border: ex.completed_today ? '1px solid rgba(16,185,129,0.2)' : `1px solid ${C.border}`,
                    transition: 'transform 0.15s', ...glass } as any}
                  onMouseEnter={(e: any) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e: any) => e.currentTarget.style.transform = ''}>
                  {ex.image ? (
                    <div style={{ width: 50, height: 50, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
                      <img src={ex.image.startsWith('/') ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${ex.image}` : ex.image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                    </div>
                  ) : (
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className="ri-run-line" style={{ fontSize: 22, color: '#EF4444' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{ex.title}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                      {ex.sets > 0 && `${ex.sets} series x ${ex.repetitions} reps`}
                      {ex.rest_seconds > 0 && ` - ${ex.rest_seconds}s repos`}
                    </div>
                  </div>
                  {ex.completed_today ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.08)' } as any}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: '#10B981' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Fait</span>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 16px', borderRadius: 999, background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', fontSize: 12, fontWeight: 700, color: '#10B981' }}>Faire</div>
                  )}
                </div>
              ))}
              <div style={{ height: 1, background: C.sep, margin: '10px 0 0' } as any} />
            </div>
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

          {/* ── Messages Pro (si conversation existe) ── */}
          {(proConvo || (proSub && proSub.professional_id)) && (
            <div data-testid="pro-messages-shortcut" className="dash-slide-up" onClick={() => {
              const pid = proConvo?.professional_id || proSub?.professional_id;
              if (pid) router.push({ pathname: '/pro-chat' as any, params: { proId: pid } });
            }} style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 20, background: C.card, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', ...glass } as any}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-chat-3-fill" style={{ fontSize: 18, color: '#3B82F6' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Messages avec {proConvo?.professional_name || proSub?.professional_name || 'votre pro'}</div>
                <div style={{ fontSize: 11, color: C.sub }}>Discutez avec votre professionnel</div>
              </div>
              {unreadMsgs > 0 && (
                <div style={{ width: 22, height: 22, borderRadius: 999, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#FFF' }}>{unreadMsgs}</span>
                </div>
              )}
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}

          {/* ── Rappels ── */}
          <div data-testid="reminders-section" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mes rappels</div>
              <div style={{ display: 'flex', gap: 0 } as any}>
                {[
                  { bg: '#38BDF8', icon: 'ri-drop-fill' },
                  { bg: '#F59E0B', icon: 'ri-capsule-fill' },
                  { bg: '#EF4444', icon: 'ri-alarm-fill' },
                ].map((a, ai) => (
                  <div key={ai} style={{ width: 32, height: 32, borderRadius: 999, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: ai > 0 ? -8 : 0, border: `2.5px solid ${isDark ? '#1a1a24' : '#FFF'}`, zIndex: 3 - ai } as any}>
                    <i className={a.icon} style={{ fontSize: 14, color: '#FFF' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Gerez vos rappels quotidiens pour rester en bonne sante et ne rien oublier.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
              {[
                { type: 'hydration', label: 'Hydratation', img: REMINDER_IMAGES.hydration, color: '#38BDF8', desc: 'Pensez a boire regulierement' },
                { type: 'medication', label: 'Traitement', img: REMINDER_IMAGES.medication, color: '#F59E0B', desc: 'Suivi de votre traitement' },
                { type: 'alarm', label: 'Alarmes', img: REMINDER_IMAGES.alarm, color: '#EF4444', desc: 'Vos alarmes personnalisees' },
              ].map((cat) => {
                const catRems = reminders.filter((r: any) => r.reminder_type === cat.type);
                const activeCount = catRems.filter((r: any) => r.active).length;
                const nextTime = activeCount > 0 ? getNextReminderTime(catRems.find((r: any) => r.active)) : '';
                return (
                  <div key={cat.type} data-testid={`reminder-cat-${cat.type}`} onClick={() => { setEditReminder({ _type: cat.type }); setShowReminderCRUD(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: C.card, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <img src={cat.img} alt={cat.label} style={{ width: 46, height: 46, objectFit: 'contain', flexShrink: 0 } as any} />
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cat.label}</div>
                      <div style={{ fontSize: 12, color: activeCount > 0 ? cat.color : C.sub, fontWeight: 500, marginTop: 2 }}>
                        {activeCount > 0 ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}${nextTime ? ` · dans ${nextTime}` : ''}` : cat.desc}
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          {/* ── Gardiens ── */}
          <div data-testid="guardians-section" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mes gardiens</div>
              <img src={IMG_GUARDIANS} alt="" style={{ width: 90, height: 45, objectFit: 'contain' } as any} />
            </div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Retrouvez l'ensemble de vos gardiens qui veillent sur vous au quotidien.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
              {guardians.map((g: any, i: number) => {
                return (
                  <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: C.card, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <div style={{ width: 50, height: 50, borderRadius: 999, background: g.avatar_url ? 'transparent' : '#3A3A42', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 } as any}>
                      {g.avatar_url ? <img src={g.avatar_url} style={{ width: 50, height: 50, borderRadius: 999, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{g.name?.charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{g.relationship || t('guardian')}</div>
                    </div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
                  </div>
                );
              })}
              {guardians.length === 0 && <div style={{ padding: '20px', borderRadius: 18, background: C.card, textAlign: 'center', ...glass } as any}><div style={{ fontSize: 13, color: C.sub }}>Aucun gardien pour le moment</div></div>}
            </div>
            <div data-testid="add-guardian-btn" onClick={() => setShowAddGuardianPopup(true)} style={{ marginTop: 14, padding: '15px', borderRadius: 999, background: isDark ? '#FFF' : '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'opacity 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>
              <i className="ri-heart-add-line" style={{ fontSize: 18, color: isDark ? '#111' : '#FFF' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#111' : '#FFF' }}>Ajouter un gardien</span>
            </div>
          </div>

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          <DoctorCard onPress={() => router.push('/(tabs)/teleconsult')} />

          </div>{/* end gradient content card */}
        </div>{/* end scroll container */}

        {/* ═══ POPUPS — outside scroll/content card to avoid stacking context ═══ */}
        <ReminderCRUDPopup show={showReminderCRUD} editReminder={editReminder} setEditReminder={setEditReminder} onClose={() => { setShowReminderCRUD(false); setEditReminder(null); }} reminders={reminders} reminderMeta={reminderMeta} token={token} fetchData={fetchData} deleteReminder={deleteReminder} setReminders={setReminders} onCrudDone={onCrudDone} />
        <ReminderNotifPopup reminderNotif={reminderNotif} setReminderNotif={setReminderNotif} reminderMeta={reminderMeta} token={token} fetchData={fetchData} />
        <AddGuardianPopup show={showAddGuardianPopup} onClose={() => { setShowAddGuardianPopup(false); setInviteGuardPhone(""); setInviteGuardRelationship(""); setInviteGuardMsg(""); }} phone={inviteGuardPhone} setPhone={setInviteGuardPhone} relationship={inviteGuardRelationship} setRelationship={setInviteGuardRelationship} msg={inviteGuardMsg} setMsg={setInviteGuardMsg} loading={inviteGuardLoading} setLoading={setInviteGuardLoading} token={token} fetchData={fetchData} />
        <CheckinPopup show={showCheckin} onClose={() => setShowCheckin(false)} activeProgram={activeProgram} mood={checkinMood} setMood={setCheckinMood} note={checkinNote} setNote={setCheckinNote} sending={checkinSending} setSending={setCheckinSending} feedback={checkinFeedback} setFeedback={setCheckinFeedback} token={token} fetchData={fetchData} />
        <GuardianActivationPopup show={showGuardianActivation} onClose={() => { setShowGuardianActivation(false); setActiveTab("beneficiary"); }} step={guardianActivationStep} setStep={setGuardianActivationStep} alertSms={alertSms} setAlertSms={setAlertSms} alertEmail={alertEmail} setAlertEmail={setAlertEmail} activating={activatingGuardian} onActivate={activateGuardianMode} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseRing{0%{transform:scale(1);opacity:0.3}100%{transform:scale(1.5);opacity:0}} @keyframes twBlink{0%,100%{opacity:1}50%{opacity:0}} @keyframes dashSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} .dash-slide-up{animation:dashSlideUp 0.5s ease-out both} .dash-slide-up:nth-child(1){animation-delay:0s} .dash-slide-up:nth-child(2){animation-delay:0.08s} .dash-slide-up:nth-child(3){animation-delay:0.16s} .dash-slide-up:nth-child(4){animation-delay:0.24s} .dash-slide-up:nth-child(5){animation-delay:0.32s} .dash-slide-up:nth-child(6){animation-delay:0.4s} .tw-cursor{animation:twBlink 1s step-end infinite}` }} />
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
