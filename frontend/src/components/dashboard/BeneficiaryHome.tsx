import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertBanner from './AlertBanner';
import CopilotCard from './CopilotCard';
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
import { apiFetch } from '../../services/api';
import { requestNotificationPermission, startReminderChecker, notifyAlert } from '../../services/notifications';
import { SubscriptionBanner, SubscriptionGate } from '../SubscriptionGate';
import WeightGoalDashCard from './WeightGoalDashCard';
import { DailyObjectivesOnDashboard } from './DailyObjectives';

const IMG_GUARDIANS = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/ashlkedd_img_gardians.png';

export function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t, lang, setLang, flags: langFlags } = useI18n();
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return;
    const existing = document.getElementById('chutex-particles');
    if (existing) return;
    const wrap = document.createElement('div');
    wrap.id = 'chutex-particles';
    wrap.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;';
    const cvs = document.createElement('canvas');
    cvs.style.cssText = 'width:100%;height:100%;display:block;';
    wrap.appendChild(cvs);
    document.body.prepend(wrap);
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0;
    const resize = () => { W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    // Purple aurora orbs — large, bright, moving
    const orbs = [
      { x: W * 0.3, y: H * 0.2, r: 280, vx: 0.25, vy: 0.15, hue: 270, sat: 65, a: 0.14, phase: 0 },
      { x: W * 0.7, y: H * 0.6, r: 320, vx: -0.2, vy: 0.18, hue: 285, sat: 55, a: 0.12, phase: 2 },
      { x: W * 0.5, y: H * 0.8, r: 250, vx: 0.15, vy: -0.12, hue: 260, sat: 70, a: 0.1, phase: 4 },
      { x: W * 0.15, y: H * 0.7, r: 200, vx: 0.18, vy: 0.1, hue: 295, sat: 50, a: 0.09, phase: 1.5 },
      { x: W * 0.85, y: H * 0.3, r: 230, vx: -0.15, vy: -0.13, hue: 275, sat: 60, a: 0.11, phase: 3.5 },
    ];

    // Small glowing particles (purple/violet tones)
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.25,
      hue: 255 + Math.random() * 50, a: 0.25 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2, freq: 0.002 + Math.random() * 0.005,
      glowR: 10 + Math.random() * 20
    }));

    let t = 0, raf = 0;
    const draw = () => {
      t++;
      // Dark grey gradient background
      const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
      bg.addColorStop(0, '#1e1e30'); bg.addColorStop(0.5, '#1a1a2a'); bg.addColorStop(1, '#18182a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Draw purple aurora orbs (bright & visible)
      for (const o of orbs) {
        o.x += o.vx + Math.sin(t * 0.0015 + o.phase) * 0.5;
        o.y += o.vy + Math.cos(t * 0.001 + o.phase) * 0.4;
        if (o.x < -o.r * 0.5) o.x = W + o.r * 0.3; if (o.x > W + o.r * 0.5) o.x = -o.r * 0.3;
        if (o.y < -o.r * 0.5) o.y = H + o.r * 0.3; if (o.y > H + o.r * 0.5) o.y = -o.r * 0.3;
        const pulse = 1 + Math.sin(t * 0.002 + o.phase) * 0.2;
        const rr = o.r * pulse;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rr);
        g.addColorStop(0, `hsla(${o.hue}, ${o.sat}%, 50%, ${o.a * pulse})`);
        g.addColorStop(0.3, `hsla(${o.hue}, ${o.sat}%, 40%, ${o.a * 0.6})`);
        g.addColorStop(0.7, `hsla(${o.hue}, ${o.sat - 10}%, 30%, ${o.a * 0.2})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, rr, 0, Math.PI * 2); ctx.fill();
      }

      // Draw glowing particles
      for (const p of pts) {
        p.x += p.vx + Math.sin(t * p.freq + p.phase) * 0.5;
        p.y += p.vy + Math.cos(t * p.freq * 0.7 + p.phase) * 0.4;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const flicker = 0.7 + Math.sin(t * 0.015 + p.phase) * 0.3;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowR);
        glow.addColorStop(0, `hsla(${p.hue}, 70%, 70%, ${p.a * 0.3 * flicker})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, p.glowR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * flicker, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 85%, ${p.a * flicker})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    (window as any).__chutexParticlesCleanup = () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); wrap.remove(); };
    return () => { (window as any).__chutexParticlesCleanup?.(); delete (window as any).__chutexParticlesCleanup; };
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
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 60000); return () => clearInterval(iv); }, [fetchData]);
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
      setShowReminderCRUD(false); setEditReminder(null); fetchData();
    } catch {}
  };

  const deleteReminder = async (id: string) => {
    try { await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' }, token); fetchData(); } catch {}
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

  /* ─── WEB: Clinical dashboard — inspired by myhealthprac.com ─── */
  if (Platform.OS === 'web') {
    const C = { bg: 'transparent', card: 'rgba(8,8,16,0.6)', text: '#FAFAFA', sub: 'rgba(255,255,255,0.5)', headerBg: 'rgba(8,8,16,0.65)', btnBg: 'rgba(255,255,255,0.08)', arrow: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.12)', sep: 'rgba(255,255,255,0.1)' };
    const glass = { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${C.border}` };

    const GC = ({ children, style, onClick, testId }: any) => (
      <div data-testid={testId} onClick={onClick} className="dash-slide-up" style={{ padding: '20px', borderRadius: 14, background: C.card, marginBottom: 20, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.18s', ...glass, ...style } as any}
        onMouseEnter={(e: any) => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
        {children}
      </div>
    );
    return (
      <div data-testid="beneficiary-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: 'hidden', '--card-bg': C.card, '--card-text': C.text, '--card-sub': C.sub, '--card-arrow': C.arrow, '--card-sep': C.sep, '--card-blur': 'none', '--card-border': 'none' } as any}>
        {/* Video Background */}
        {/* Particle background injected via useEffect into document.body (tiwis.fr style) */}
        {Platform.OS === 'web' && <TeamActivityToast token={token} />}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 0 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* ══════ HEADER ══════ */}
          <div data-testid="dashboard-header" className="dash-slide-up" style={{ padding: '14px 20px', margin: '8px 16px 0', borderRadius: 14, background: C.headerBg, ...glass } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div onClick={() => router.push('/(tabs)/profile' as any)} style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' } as any}>
                  {user.avatar_url ? <img src={user.avatar_url} style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{user.name?.charAt(0)?.toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{activeTab === 'beneficiary' ? t('space_beneficiary') : t('space_guardian')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                <div data-testid="lang-picker-btn" onClick={() => setLangOpen(!langOpen)} style={{ width: 36, height: 36, borderRadius: 18, background: C.btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, lineHeight: 1 } as any}>
                  {lang === 'FR' ? '\u{1F1EB}\u{1F1F7}' : lang === 'EN' ? '\u{1F1EC}\u{1F1E7}' : lang === 'ES' ? '\u{1F1EA}\u{1F1F8}' : lang === 'DE' ? '\u{1F1E9}\u{1F1EA}' : lang === 'IT' ? '\u{1F1EE}\u{1F1F9}' : lang === 'PT' ? '\u{1F1F5}\u{1F1F9}' : lang === 'NL' ? '\u{1F1F3}\u{1F1F1}' : '\u{1F30D}'}
                </div>
                <div data-testid="notif-bell" onClick={() => setShowNotifs(!showNotifs)} style={{ width: 36, height: 36, borderRadius: 18, background: C.btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}>
                  <i className="ri-notification-4-line" style={{ fontSize: 18, color: C.sub }} />
                  {(guardianRequests.length > 0 || activeAlerts.length > 0 || predictiveAlerts.length > 0) && <div style={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, background: '#EF4444', border: `2px solid ${C.headerBg}` } as any} />}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px', marginTop: 16 } as any}>

          <NotificationsPopup show={showNotifs} onClose={() => setShowNotifs(false)} activeAlerts={activeAlerts} guardianRequests={guardianRequests} predictiveAlerts={predictiveAlerts} token={token} onRefresh={fetchData} />
          <LanguagePopup show={langOpen} onClose={() => setLangOpen(false)} lang={lang} setLang={setLang} />

          {/* ── SOS Button ── */}
          <div data-testid="sos-button" className="dash-slide-up" onClick={handleSOS} style={{
            padding: '16px 20px', borderRadius: 14, cursor: 'pointer', marginBottom: 20,
            background: C.card, display: 'flex', alignItems: 'center', gap: 14,
            transition: 'transform 0.18s, box-shadow 0.18s', ...glass,
          } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.12)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
            {sosLoading ? <div style={{ color: '#EF4444', fontSize: 14, flex: 1, textAlign: 'center' }}>Envoi en cours...</div> : (
              <>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-alarm-warning-line" style={{ fontSize: 24, color: '#FFF' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text, letterSpacing: 2 }}>SOS</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{t('sos_sub')}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
              </>
            )}
          </div>

          <AlertBanner activeAlerts={activeAlerts} />

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          <DailyObjectivesOnDashboard token={token} />

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

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
                }} style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#10B981' } as any}>Accepter</div>
                <div data-testid={`reject-team-${inv.id}`} onClick={async () => {
                  try { await apiFetch(`/api/programs/team/invitations/${inv.id}/reject`, { method: 'POST' }, token); setTeamInvitations(prev => prev.filter(i => i.id !== inv.id)); } catch {}
                }} style={{ flex: 1, padding: '12px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.sub } as any}>Refuser</div>
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

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          <CopilotCard />

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          {(br.connected || br.paired || ((sc.connected || sc.paired) && weighings.length > 0) || vs.connected || vs.paired) && (
            <DeviceCards br={br} sc={sc} vs={vs} weighings={weighings} onStartWeighing={() => setShowWeighing(true)} onRefresh={fetchData} subscription={subscription} />
          )}

          {showWeighing && <WeighingFlow onClose={() => setShowWeighing(false)} d={dashData?.scale || {}} weighings={weighings} />}

          <div style={{ height: 1, background: C.sep, margin: "10px 0 24px" } as any} />

          {/* ── Rappels ── */}
          <div data-testid="reminders-section" className="dash-slide-up" style={{ padding: '16px', borderRadius: 14, background: C.card, marginBottom: 20, ...glass } as any}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 12 }}>Rappels</div>
            {[
              { type: 'hydration', label: 'Hydratation', img: REMINDER_IMAGES.hydration, color: '#38BDF8' },
              { type: 'medication', label: 'Traitement', img: REMINDER_IMAGES.medication, color: '#F59E0B' },
              { type: 'alarm', label: 'Alarmes', img: REMINDER_IMAGES.alarm, color: '#EF4444' },
            ].map((cat, idx) => {
              const catRems = reminders.filter((r: any) => r.reminder_type === cat.type);
              const activeCount = catRems.filter((r: any) => r.active).length;
              const nextTime = activeCount > 0 ? getNextReminderTime(catRems.find((r: any) => r.active)) : '';
              return (
                <div key={cat.type} data-testid={`reminder-cat-${cat.type}`} onClick={() => { setEditReminder({ _type: cat.type }); setShowReminderCRUD(true); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', cursor: 'pointer' } as any}>
                  <img src={cat.img} alt={cat.label} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 } as any} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: activeCount > 0 ? cat.color : 'rgba(0,0,0,0.35)', fontWeight: 600 }}>
                      {activeCount > 0 ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}${nextTime ? ` · dans ${nextTime}` : ''}` : 'Non configure'}
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: C.arrow }} />
                </div>
              );
            })}
          </div>

          {/* ── Gardiens ── */}
          <GC testId="guardians-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Mes gardiens</div>
              <img src={IMG_GUARDIANS} alt="" style={{ width: 100, height: 50, objectFit: 'contain' } as any} />
            </div>
            {guardians.map((g: any, i: number) => (
              <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', cursor: 'pointer' } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 } as any}>
                  {g.avatar_url ? <img src={g.avatar_url} style={{ width: 44, height: 44, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 18, fontWeight: 800, color: '#C7C7CC' }}>{g.name?.charAt(0)}</span>}
                </div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{g.name}</div><div style={{ fontSize: 12, color: C.sub }}>{g.relationship || t('guardian')}</div></div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
              </div>
            ))}
            {guardians.length === 0 && <div style={{ fontSize: 11, color: C.sub, textAlign: 'center', padding: '6px 0' }}>Aucun gardien</div>}
            <div data-testid="add-guardian-btn" onClick={() => setShowAddGuardianPopup(true)} style={{ marginTop: 12, padding: '14px', borderRadius: 10, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(167,139,250,0.04)'; }}>
              <i className="ri-heart-add-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Ajouter un gardien</span>
            </div>
          </GC>

          <DoctorCard onPress={() => router.push('/(tabs)/teleconsult')} />

          <ReminderCRUDPopup show={showReminderCRUD} editReminder={editReminder} setEditReminder={setEditReminder} onClose={() => { setShowReminderCRUD(false); setEditReminder(null); }} reminders={reminders} reminderMeta={reminderMeta} token={token} fetchData={fetchData} deleteReminder={deleteReminder} />
          <ReminderNotifPopup reminderNotif={reminderNotif} setReminderNotif={setReminderNotif} reminderMeta={reminderMeta} token={token} fetchData={fetchData} />
          <AddGuardianPopup show={showAddGuardianPopup} onClose={() => { setShowAddGuardianPopup(false); setInviteGuardPhone(""); setInviteGuardRelationship(""); setInviteGuardMsg(""); }} phone={inviteGuardPhone} setPhone={setInviteGuardPhone} relationship={inviteGuardRelationship} setRelationship={setInviteGuardRelationship} msg={inviteGuardMsg} setMsg={setInviteGuardMsg} loading={inviteGuardLoading} setLoading={setInviteGuardLoading} token={token} fetchData={fetchData} />
          <CheckinPopup show={showCheckin} onClose={() => setShowCheckin(false)} activeProgram={activeProgram} mood={checkinMood} setMood={setCheckinMood} note={checkinNote} setNote={setCheckinNote} sending={checkinSending} setSending={setCheckinSending} feedback={checkinFeedback} setFeedback={setCheckinFeedback} token={token} fetchData={fetchData} />
          <GuardianActivationPopup show={showGuardianActivation} onClose={() => { setShowGuardianActivation(false); setActiveTab("beneficiary"); }} step={guardianActivationStep} setStep={setGuardianActivationStep} alertSms={alertSms} setAlertSms={setAlertSms} alertEmail={alertEmail} setAlertEmail={setAlertEmail} activating={activatingGuardian} onActivate={activateGuardianMode} />

          </div>
        </div>
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
