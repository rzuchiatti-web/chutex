import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertBanner from '../../src/components/dashboard/AlertBanner';
import VitalsRow from '../../src/components/dashboard/VitalsRow';
import ActivityCard from '../../src/components/dashboard/ActivityCard';
import CopilotCard from '../../src/components/dashboard/CopilotCard';
import DeviceCards from '../../src/components/dashboard/DeviceCards';
import Loader from '../../src/components/Loader';
import WeighingFlow from '../../src/components/dashboard/WeighingFlow';
import GuardianHome from '../../src/components/dashboard/GuardianHome';
import TeleassistanceHome from '../../src/components/dashboard/TeleassistanceHome';
import AdminHome from '../../src/components/dashboard/AdminHome';
import CompanyHome from '../../src/components/dashboard/CompanyHome';
import { Card, HeroCard, StatusBadge, PillButton, IconBtn, QuickAction, SectionHeader, LanguageFlagButton } from '../../src/components/dashboard/SharedUI';
import { HEALTH_IMAGES, REMINDER_IMAGES, isDarkMode, CHX, webShadow, webGlass, BG_IMAGES } from '../../src/components/dashboard/constants';
import { NotificationsPopup, LanguagePopup, ReminderCRUDPopup, ReminderNotifPopup, AddGuardianPopup, CheckinPopup, GuardianActivationPopup } from '../../src/components/dashboard/BeneficiaryPopups';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Image, TextInput } from 'react-native';
import { ContextualTip, OnboardingChecklist, MiniTuto } from '../../src/components/HelpSystem';
import { DoctorCard } from '../../src/components/DoctorCard';
import { Icon } from '../../src/components/WebIcon';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';
import { apiFetch } from '../../src/services/api';
import { requestNotificationPermission, startReminderChecker, notifyAlert } from '../../src/services/notifications';
import { SubscriptionBanner, SubscriptionGate } from '../../src/components/SubscriptionGate';

/* ═══════════════════════════════════════════════════════ */
/*              WEIGHT GOAL CARD ON DASHBOARD              */
/* ═══════════════════════════════════════════════════════ */
const WEIGHT_BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';
const TAPE_MEASURE_IMG = 'https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/d7demq52_img_objectif_poids.png';
const NORA_VIDEO_URL = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';
const IMG_KCAL = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/385muol8_img_kcal.png';
const IMG_GUARDIANS = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/ashlkedd_img_gardians.png';

/* ── Objective icon images ── */
const OBJ_IMAGES: Record<string, string> = {
  calories_intake: IMG_KCAL,
  hydration: REMINDER_IMAGES.hydration,
  steps: HEALTH_IMAGES.physical,
  sleep: HEALTH_IMAGES.sleep,
};

function WeightGoalDashCard({ token }: { token: string }) {
  const router = useRouter();
  const [goal, setGoal] = React.useState<any>(null);
  React.useEffect(() => {
    // Use lightweight DB queries, not the heavy weight-details endpoint
    Promise.all([
      apiFetch('/api/minceur/weight-goal-status', {}, token).catch(() => null),
    ]).then(([g]) => { if (g && g.target_kg) setGoal(g); });
  }, [token]);

  if (!goal) return null;

  const diff = (goal.current || 0) - goal.target_kg;
  const remaining = Math.abs(diff).toFixed(1);
  const progressPct = diff > 0 ? Math.max(5, Math.min(95, 100 - (diff / (diff + 2)) * 100)) : 50;

  return (
    <div data-testid="weight-goal-dash-card" className="dash-slide-up cl-press" onClick={() => router.push('/minceur' as any)}
      style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', position: 'relative', height: 100, transition: 'transform 0.15s' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      <img src={WEIGHT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
      {/* Tape measure — natural colors, no filter, centered-right */}
      <img src={TAPE_MEASURE_IMG} alt="" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 80, height: 80, objectFit: 'contain', zIndex: 2 } as any} />
      <div style={{ position: 'relative', zIndex: 3, padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Objectif poids en cours</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 } as any}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{goal.current > 0 ? goal.current : '--'}</span>
          <i className="ri-arrow-right-line" style={{ fontSize: 14, color: '#60A5FA' }} />
          <span style={{ fontSize: 26, fontWeight: 900, color: '#60A5FA' }}>{goal.target_kg}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>kg</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>· {goal.weeks} sem</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: 200 } as any}>
          {Array.from({ length: 12 }, (_, i) => {
            const filled = i < Math.round(progressPct / 100 * 12);
            return <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: filled ? '#60A5FA' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' } as any} />;
          })}
          <span style={{ fontSize: 9, fontWeight: 700, color: '#60A5FA', marginLeft: 6 }}>{diff > 0 ? `-${remaining}` : `+${remaining}`}kg</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*               NORA PILL BADGE + TYPEWRITER TITLE        */
/* ═══════════════════════════════════════════════════════ */
function NoraPill() {
  return (
    <div className="dash-slide-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 } as any}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', borderRadius: 999, padding: '6px 16px 6px 6px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' } as any}>
        <video src={NORA_VIDEO_URL} autoPlay loop muted playsInline style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' } as any} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF', letterSpacing: -0.2 }}>Nora recommandation journaliere</span>
      </div>
    </div>
  );
}

function TypewriterTitle({ text }: { text: string; delay?: number }) {
  return (
    <div className="dash-slide-up" style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: -0.5, marginBottom: 20, textAlign: 'center' } as any}>
      {text}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*               DAILY OBJECTIVES ON DASHBOARD             */
/* ═══════════════════════════════════════════════════════ */
function DailyObjectivesOnDashboard({ token }: { token: string }) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    apiFetch('/api/health/daily-report', {}, token)
      .then(d => setPlan(d?.daily_plan || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding: '12px 0', textAlign: 'center' } as any}><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.04)', borderTopColor: '#0F766E', animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>;
  if (!plan.length) return null;

  const items = plan.filter((p: any) => p.key !== 'connect');
  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 20 } as any}>
      <NoraPill />
      <TypewriterTitle text="Voici vos objectifs journaliers." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        {items.map((p: any, idx: number) => {
          const objImg = OBJ_IMAGES[p.key];
          return (
            <div key={p.key} className="dash-slide-up" onClick={() => {
              if (p.key === 'steps') router.push({ pathname: '/metric-detail' as any, params: { key: 'steps' } });
              else if (p.key === 'sleep') router.push('/sleep' as any);
              else if (p.key === 'calories_intake') router.push('/minceur' as any);
              else if (p.key === 'hydration') router.push('/minceur' as any);
            }} style={{
              padding: '12px', borderRadius: 16,
              background: '#EDEDF0',
              cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s',
              animationDelay: `${idx * 0.1}s`,
              display: 'flex', alignItems: 'center', gap: 10,
            } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
              {objImg && <img src={objImg} alt="" style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 } as any} />}
              {!objImg && (
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={p.icon} style={{ fontSize: 16, color: p.color }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 } as any}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: -1 }}>{p.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.4)' }}>{p.unit}</span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontWeight: 500, lineHeight: 1.3 }}>{p.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                    BENEFICIARY HOME                     */
/* ═══════════════════════════════════════════════════════ */
function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t, lang, setLang, flags: langFlags } = useI18n();
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
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });
      const latitude = pos?.coords?.latitude;
      const longitude = pos?.coords?.longitude;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        await apiFetch('/api/location/update', {
          method: 'POST',
          body: JSON.stringify({ latitude, longitude }),
        }, token);
      }
    } catch {
      // Permission refusee ou geolocalisation indisponible
    }
  }, [token]);

  useEffect(() => {
    syncBeneficiaryLocation();
    const intervalId = setInterval(() => { syncBeneficiaryLocation(); }, 60000);
    return () => clearInterval(intervalId);
  }, [syncBeneficiaryLocation]);

  const fetchData = useCallback(async () => {
    try {
      const [dd, rem, guards, greqs, hs, scaleHistory] = await Promise.all([
        apiFetch('/api/devices/dashboard-summary', {}, token).catch(() => null),
        apiFetch('/api/reminders', {}, token).catch(() => []),
        apiFetch('/api/guardians/my', {}, token).catch(() => []),
        apiFetch('/api/beneficiary/guardian-requests', {}, token).catch(() => []),
        apiFetch('/api/health/summary', {}, token).catch(() => null),
        apiFetch('/api/devices/scale/history', {}, token).catch(() => []),
      ]);
      setDashData(dd);
      setReminders(rem);
      setGuardians(Array.isArray(guards) ? guards : []);
      setGuardianRequests(Array.isArray(greqs) ? greqs : []);
      if (hs) setHealthSummary(hs);
      apiFetch('/api/subscriptions/my', {}, token).then(setSubscription).catch(() => {});
      if (Array.isArray(scaleHistory)) {
        const mapped = scaleHistory
          .map((r: any) => {
            const data = r?.data || r;
            return {
              id: r?.id || '',
              date: r?.timestamp || r?.date || r?.created_at || '',
              weight: data?.weight || 0,
              bmi: data?.bmi || 0,
              body_fat_pct: data?.body_fat_pct || 0,
              muscle_pct: data?.muscle_pct || 0,
              water_pct: data?.water_pct || 0,
              status: data?.health_evaluation || '--',
            };
          })
          .filter((w: any) => w.weight > 0)
          .slice(0, 20);
        setWeighings(mapped);
      }
      try {
        const [prog, cat] = await Promise.all([
          apiFetch('/api/programs/active', {}, token).catch(() => null),
          apiFetch('/api/programs/catalog', {}, token).catch(() => null),
        ]);
        if (prog) {
          setActiveProgram(prog);
          if (prog.active && !prog.today_checkin) {
            // Don't show popup — checkin is done inside the program page
          }
        }
        if (cat?.programs) setProgramCatalog(cat.programs);
        // Fetch team invitations
        apiFetch('/api/programs/team/invitations', {}, token).then(inv => { if (Array.isArray(inv)) setTeamInvitations(inv); }).catch(() => {});
        // Daily checkin + streak + predictive alerts + activity streak
        apiFetch('/api/nora/checkin-daily', { method: 'POST' }, token).then(s => { if (s) setStreakData(s); }).catch(() => {});
        apiFetch('/api/nora/predictive-check', {}, token).then(p => {
          if (p?.alerts) {
            setPredictiveAlerts(p.alerts);
          }
        }).catch(() => {});
        apiFetch('/api/health/activity-streak', {}, token).then(s => { if (s) setActivityStreakData(s); }).catch(() => {});
      } catch {}
    } catch {} finally { setLoading(false); setRefreshing(false); }
    // Fetch alerts separately to ensure it always runs
    try {
      const aa = await apiFetch('/api/alerts/active-with-interventions', {}, token);
      setActiveAlerts(Array.isArray(aa) ? aa : []);
    } catch { setActiveAlerts([]); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { requestNotificationPermission(); }, []);
  // Morning briefing — only once per day (not per session)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const today = new Date().toISOString().split('T')[0];
      const lastSeen = localStorage.getItem('briefing_last_date');
      if (lastSeen !== today) { router.push('/morning-briefing' as any); }
    }
  }, []);
  useEffect(() => { if (reminders.length > 0) { const cleanup = startReminderChecker(reminders); return cleanup; } }, [reminders]);

  // Check for due reminders on load
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
      // Get geolocation if available
      let lat = null, lng = null;
      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          const pos: any = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
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
      if (user.has_guardian_space) {
        switchToGuardian();
      } else {
        setShowGuardianActivation(true);
        setGuardianActivationStep(0);
      }
    }
    setActiveTab(tab);
  };

  const activateGuardianMode = async () => {
    setActivatingGuardian(true);
    try {
      await apiFetch('/api/auth/activate-guardian', { method: 'POST', body: JSON.stringify({
        guardian_type: 'particular', alert_sms: alertSms, alert_email: alertEmail,
      }) }, token);
      await refreshUser();
      setShowGuardianActivation(false);
      setActiveTab('beneficiary');
      Alert.alert('Espace aidant active', 'Vous pouvez maintenant basculer vers votre espace aidant.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setActivatingGuardian(false); }
  };

  if (loading) return Platform.OS === 'web' ? <Loader /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}><ActivityIndicator size="large" color="#111" /></View>;

  const br = dashData?.bracelet || { heart_rate: 0, spo2: 0, steps: 0, blood_pressure: { systolic: 0, diastolic: 0 }, temperature: 0, battery: 0, connected: false, calories: 0, distance_km: 0, heart_rate_history: [], paired: false };
  const sc = dashData?.scale || { weight: 0, bmi: 0, body_fat: 0, muscle_mass: 0, water_pct: 0, battery: 0, connected: false, paired: false };
  const vs = dashData?.vest || { fall_detected: false, posture_score: 0, chest_temp: 0, battery: 0, connected: false, wearing_hours_today: 0, alerts_today: 0, paired: false };
  const sl = dashData?.sleep || null;

  /* Card helper — Gray card */
  const GC = ({ children, style, onClick, testId }: any) => (
    <div data-testid={testId} onClick={onClick} className="dash-slide-up" style={{ padding: '20px', borderRadius: 20, background: '#EDEDF0', marginBottom: 20, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.18s', ...style } as any}
      onMouseEnter={(e: any) => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      {children}
    </div>
  );

  /* ─── WEB: Redesigned beneficiary dashboard ─── */
  // Dark mode toggle
  const [isDark, setIsDark] = useState(() => typeof localStorage !== 'undefined' && localStorage.getItem('chutex_dark') === '1');
  if (Platform.OS === 'web') {
    const BG_IMG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
    const toggleDark = () => { const next = !isDark; setIsDark(next); localStorage.setItem('chutex_dark', next ? '1' : '0'); };
    const C = isDark ? { bg: '#000', card: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', text: '#FFF', sub: 'rgba(255,255,255,0.4)', sep: 'rgba(255,255,255,0.06)', headerBg: 'rgba(255,255,255,0.06)', btnBg: 'rgba(255,255,255,0.08)', arrow: 'rgba(255,255,255,0.2)', pill: '#FFF' } : { bg: '#FFF', card: '#EDEDF0', border: 'none', text: '#111', sub: 'rgba(0,0,0,0.4)', sep: 'rgba(0,0,0,0.06)', headerBg: '#EDEDF0', btnBg: '#FFF', arrow: 'rgba(0,0,0,0.2)', pill: '#111' };
    return (
      <div data-testid="beneficiary-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: 'hidden', background: C.bg } as any}>
        {isDark && <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />}
        {isDark && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />}

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 0 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* ══════ HEADER — Full width gray rounded ══════ */}
          <div data-testid="dashboard-header" className="dash-slide-up" style={{ padding: '16px 20px', margin: '8px 16px 0', borderRadius: 22, background: C.headerBg, backdropFilter: isDark ? 'blur(20px)' : 'none', WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none', border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div onClick={() => router.push('/(tabs)/profile' as any)} style={{ width: 44, height: 44, borderRadius: 22, background: isDark ? 'rgba(255,255,255,0.1)' : '#D8D8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' } as any}>
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
                <div data-testid="dark-mode-toggle" onClick={toggleDark} style={{ width: 36, height: 36, borderRadius: 18, background: C.btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                  <i className={isDark ? 'ri-sun-line' : 'ri-moon-line'} style={{ fontSize: 16, color: C.sub }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px', marginTop: 16 } as any}>

          <NotificationsPopup show={showNotifs} onClose={() => setShowNotifs(false)} activeAlerts={activeAlerts} guardianRequests={guardianRequests} predictiveAlerts={predictiveAlerts} token={token} onRefresh={fetchData} />

          <LanguagePopup show={langOpen} onClose={() => setLangOpen(false)} lang={lang} setLang={setLang} />
          {/* ── SOS Button ── */}
          <div data-testid="sos-button" className="dash-slide-up" onClick={handleSOS} style={{
            padding: '16px 20px', borderRadius: 18, cursor: 'pointer', marginBottom: 20,
            background: '#EDEDF0',
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'transform 0.18s, box-shadow 0.18s',
          } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.12)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
            {sosLoading ? <div style={{ color: '#EF4444', fontSize: 14, flex: 1, textAlign: 'center' }}>Envoi en cours...</div> : (
              <>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-alarm-warning-line" style={{ fontSize: 24, color: '#FFF' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: 2 }}>SOS</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{t('sos_sub')}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(0,0,0,0.2)' }} />
              </>
            )}
          </div>


          {/* ── 1. ALERTES EN HAUT (toujours visible) ── */}
          <AlertBanner activeAlerts={activeAlerts} />

          {/* ── PREDICTIVE ALERTS (Nora) ── */}
          {/* Predictive alerts moved to notifications popup only */}

          {/* ── SUBSCRIPTION BANNER (si pas d'abo bracelet) ── */}
          {/* Health data shown even without subscription — values show -- when no data */}

          <div style={{ height: 0 } as any} />

          {/* ── 2. OBJECTIFS JOURNALIERS (remplace VitalsRow + ActivityCard) ── */}
          <DailyObjectivesOnDashboard token={token} />

          <div style={{ height: 0 } as any} />

          {/* ── TEAM INVITATIONS ── */}
          {teamInvitations.length > 0 && teamInvitations.map((inv: any) => (
            <div key={inv.id} data-testid={`team-invite-${inv.id}`} style={{ borderRadius: 18, background: '#FFF', border: '1px solid rgba(0,0,0,0.04)', padding: '16px 18px', marginBottom: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-team-line" style={{ fontSize: 20, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Invitation programme en equipe</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{inv.inviter_name} vous invite a faire "{inv.program_title}" ensemble</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div data-testid={`accept-team-${inv.id}`} onClick={async () => {
                  try {
                    await apiFetch(`/api/programs/team/invitations/${inv.id}/accept`, { method: 'POST' }, token);
                    setTeamInvitations(prev => prev.filter(i => i.id !== inv.id));
                    fetchData();
                  } catch {}
                }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#10B981' } as any}>Accepter</div>
                <div data-testid={`reject-team-${inv.id}`} onClick={async () => {
                  try {
                    await apiFetch(`/api/programs/team/invitations/${inv.id}/reject`, { method: 'POST' }, token);
                    setTeamInvitations(prev => prev.filter(i => i.id !== inv.id));
                  } catch {}
                }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.4)' } as any}>Refuser</div>
              </div>
            </div>
          ))}

          {/* ── 4. PROGRAMME EN COURS ── */}
          {activeProgram?.active ? (
            <div data-testid="active-program-card" className="dash-slide-up cl-press" onClick={() => router.push('/(tabs)/chat' as any)} style={{ borderRadius: 18, background: '#EDEDF0', padding: '16px', marginBottom: 20, cursor: 'pointer', transition: 'transform 0.18s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={activeProgram.program.icon} style={{ fontSize: 26, color: activeProgram.program.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111' }}>{activeProgram.program.title}</div>
                  <div style={{ fontSize: 12, color: activeProgram.program.color, fontWeight: 700 }}>{activeProgram.current_phase?.name || 'Phase en cours'} · Jour {activeProgram.current_day}/{activeProgram.program.duration_days}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#111' }}>{activeProgram.progress_pct}%</div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#FFF', overflow: 'hidden', marginBottom: 14 } as any}>
                <div style={{ height: 8, borderRadius: 4, width: `${activeProgram.progress_pct}%`, background: activeProgram.program.color, transition: 'width 0.5s' } as any} />
              </div>
              {activeProgram.today_tasks && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 2 }}>{activeProgram.today_tasks.focus}</div>
                  <div style={{ fontSize: 11, color: activeProgram.program.color, fontWeight: 700 }}>{activeProgram.today_tasks.tasks?.length || 0} taches · {activeProgram.today_checkin ? 'Check-in fait' : 'A valider aujourd\'hui'}</div>
                </div>
              )}
            </div>
          ) : (
            <div data-testid="discover-programs" className="dash-slide-up cl-press" onClick={() => router.push('/(tabs)/chat' as any)} style={{ borderRadius: 18, background: '#EDEDF0', padding: '14px 16px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'transform 0.18s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(167,139,250,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-road-map-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Programmes prevention</div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)' }}>Decouvrez nos parcours personnalises</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(0,0,0,0.2)' }} />
            </div>
          )}

          {/* ── WEIGHT GOAL CARD (si objectif en cours) ── */}
          <WeightGoalDashCard token={token} />

          <div style={{ height: 0 } as any} />

          {/* ── 5. NORA IA ── */}
          <CopilotCard />

          <div style={{ height: 0 } as any} />

          {/* ── 6. DISPOSITIFS ── */}
          <DeviceCards br={br} sc={sc} vs={vs} weighings={weighings} onStartWeighing={() => setShowWeighing(true)} onRefresh={fetchData} subscription={subscription} />

          {showWeighing && <WeighingFlow onClose={() => setShowWeighing(false)} d={dashData?.scale || {}} weighings={weighings} />}

          {/* Les alertes sont affichées en haut du dashboard */}

          <div style={{ height: 0 } as any} />


          {/* ── Rappels — inside a single gray card ── */}
          <div data-testid="reminders-section" className="dash-slide-up" style={{ padding: '16px', borderRadius: 20, background: '#EDEDF0', marginBottom: 20 } as any}>
            {[
              { type: 'hydration', label: 'Hydratation', img: REMINDER_IMAGES.hydration, color: '#38BDF8' },
              { type: 'medication', label: 'Traitement', img: REMINDER_IMAGES.medication, color: '#F59E0B' },
              { type: 'alarm', label: 'Alarmes', img: REMINDER_IMAGES.alarm, color: '#EF4444' },
            ].map((cat, idx) => {
              const catRems = reminders.filter((r: any) => r.reminder_type === cat.type);
              const activeCount = catRems.filter((r: any) => r.active).length;
              const nextTime = activeCount > 0 ? getNextReminderTime(catRems.find((r: any) => r.active)) : '';
              return (
                <div key={cat.type} data-testid={`reminder-cat-${cat.type}`} onClick={() => { setEditReminder({ _type: cat.type }); setShowReminderCRUD(true); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' } as any}>
                  <img src={cat.img} alt={cat.label} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 } as any} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: activeCount > 0 ? cat.color : 'rgba(0,0,0,0.35)', fontWeight: 600 }}>
                      {activeCount > 0 ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}${nextTime ? ` · dans ${nextTime}` : ''}` : 'Non configure'}
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(0,0,0,0.2)' }} />
                </div>
              );
            })}
          </div>

          {/* ── Rappels — directly on background ── */}
          <GC testId="guardians-section">
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111', textAlign: 'center', marginBottom: 20 }}>Mes gardiens</div>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <img src={IMG_GUARDIANS} alt="" style={{ width: 180, height: 80, objectFit: 'contain', margin: '0 auto' } as any} />
            </div>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 20 } as any} />
            {guardians.map((g: any, i: number) => (
              <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 } as any}>
                  {g.avatar_url ? <img src={g.avatar_url} style={{ width: 44, height: 44, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 18, fontWeight: 800, color: '#C7C7CC' }}>{g.name?.charAt(0)}</span>}
                </div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{g.name}</div><div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{g.relationship || t('guardian')}</div></div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(0,0,0,0.25)' }} />
              </div>
            ))}
            {guardians.length === 0 && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', textAlign: 'center', padding: '6px 0' }}>Aucun gardien</div>}
            <div data-testid="add-guardian-btn" onClick={() => setShowAddGuardianPopup(true)} style={{ marginTop: 12, padding: '14px', borderRadius: 14, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}>
              <i className="ri-heart-add-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Ajouter un gardien</span>
            </div>
          </GC>

          {/* ── Teleconsultation (sous les gardiens) ── */}
          <DoctorCard onPress={() => router.push('/(tabs)/teleconsult')} />

          <ReminderCRUDPopup show={showReminderCRUD} editReminder={editReminder} setEditReminder={setEditReminder} onClose={() => { setShowReminderCRUD(false); setEditReminder(null); }} reminders={reminders} reminderMeta={reminderMeta} token={token} fetchData={fetchData} deleteReminder={deleteReminder} />

          <ReminderNotifPopup reminderNotif={reminderNotif} setReminderNotif={setReminderNotif} reminderMeta={reminderMeta} token={token} fetchData={fetchData} />

          <AddGuardianPopup show={showAddGuardianPopup} onClose={() => { setShowAddGuardianPopup(false); setInviteGuardPhone(""); setInviteGuardRelationship(""); setInviteGuardMsg(""); }} phone={inviteGuardPhone} setPhone={setInviteGuardPhone} relationship={inviteGuardRelationship} setRelationship={setInviteGuardRelationship} msg={inviteGuardMsg} setMsg={setInviteGuardMsg} loading={inviteGuardLoading} setLoading={setInviteGuardLoading} token={token} fetchData={fetchData} />

          <CheckinPopup show={showCheckin} onClose={() => setShowCheckin(false)} activeProgram={activeProgram} mood={checkinMood} setMood={setCheckinMood} note={checkinNote} setNote={setCheckinNote} sending={checkinSending} setSending={setCheckinSending} feedback={checkinFeedback} setFeedback={setCheckinFeedback} token={token} fetchData={fetchData} />

          <GuardianActivationPopup show={showGuardianActivation} onClose={() => { setShowGuardianActivation(false); setActiveTab("beneficiary"); }} step={guardianActivationStep} setStep={setGuardianActivationStep} alertSms={alertSms} setAlertSms={setAlertSms} alertEmail={alertEmail} setAlertEmail={setAlertEmail} activating={activatingGuardian} onActivate={activateGuardianMode} />

          </div> {/* end padding wrapper */}
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseRing{0%{transform:scale(1);opacity:0.3}100%{transform:scale(1.5);opacity:0}} @keyframes twBlink{0%,100%{opacity:1}50%{opacity:0}} @keyframes dashSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} .dash-slide-up{animation:dashSlideUp 0.5s ease-out both} .dash-slide-up:nth-child(1){animation-delay:0s} .dash-slide-up:nth-child(2){animation-delay:0.08s} .dash-slide-up:nth-child(3){animation-delay:0.16s} .dash-slide-up:nth-child(4){animation-delay:0.24s} .dash-slide-up:nth-child(5){animation-delay:0.32s} .dash-slide-up:nth-child(6){animation-delay:0.4s} .tw-cursor{animation:twBlink 1s step-end infinite}` }} />
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
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
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
      <Animated.View style={{ transform: [{ scale: sosPulse }], marginBottom: 20 }}>
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'heart', title: t('heart_health'), img: HEALTH_IMAGES.heart, route: '/health-detail', params: { metricId: 'heart_rate' }, bg: 'rgba(239,68,68,0.06)' },
          { key: 'blood', title: t('blood_health'), img: HEALTH_IMAGES.blood, route: '/health-detail', params: { metricId: 'spo2' }, bg: 'rgba(0,0,0,0.06)' },
          { key: 'sleep', title: t('sleep_health'), img: HEALTH_IMAGES.sleep, route: '/sleep', bg: 'rgba(124,92,255,0.06)' },
          { key: 'physical', title: t('physical_health'), img: HEALTH_IMAGES.physical, route: '/health-detail', params: { metricId: 'temperature' }, bg: 'rgba(16,185,129,0.06)' },
        ].map(cat => (
          <TouchableOpacity key={cat.key} testID={`health-cat-${cat.key}`} style={{ width: '48%', backgroundColor: CHX.bg, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', ...webShadow }} onPress={() => {
            if (!br.connected && !sc.connected) { setShowConnectDevice('bracelet'); return; }
            router.push(cat.params ? { pathname: cat.route as any, params: cat.params } : cat.route as any);
          }}>
            <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: cat.bg }}>
              <Image source={{ uri: cat.img }} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: CHX.fg, textAlign: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── QUICK VITALS ─── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'spo2', label: t('spo2'), val: vitals?.spo2 || '--', unit: '%', icon: 'water-outline', color: CHX.fg },
          { id: 'heart_rate', label: t('pulse'), val: vitals?.heart_rate || '--', unit: t('bpm'), icon: 'heart-outline', color: '#EF4444' },
          { id: 'sleep', label: t('sleep'), val: '--', unit: '', icon: 'moon-outline', color: '#7C5CFF' },
          { id: 'temperature', label: t('temperature'), val: vitals?.temperature || '--', unit: '', icon: 'thermometer-outline', color: '#10B981' },
        ].map(v => (
          <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={{ width: '48%', ...webShadow }} onPress={() => {
            if (!br.connected && !sc.connected) { setShowConnectDevice(v.id === 'weight' || v.id === 'bmi' ? 'scale' : 'bracelet'); return; }
            router.push({ pathname: '/health-detail', params: { metricId: v.id } });
          }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
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
      {/* Connect Device Glass Popup */}
      {Platform.OS === 'web' && showConnectDevice && (
        <div onClick={() => setShowConnectDevice(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '90%', maxWidth: 380, padding: '28px 24px', borderRadius: 24, background: 'rgba(20,20,30,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: showConnectDevice === 'scale' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${showConnectDevice === 'scale' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                <i className={showConnectDevice === 'scale' ? 'ri-scales-3-line' : 'ri-watch-line'} style={{ fontSize: 30, color: showConnectDevice === 'scale' ? '#10B981' : '#3B82F6' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>{showConnectDevice === 'scale' ? 'Balance non connectee' : 'Bracelet non connecte'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Pour acceder a vos donnees de sante, vous devez d'abord associer votre {showConnectDevice === 'scale' ? 'balance connectee' : 'bracelet Elio'} via Bluetooth.</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 } as any}>
              {[
                { icon: 'ri-bluetooth-line', text: 'Activez le Bluetooth sur votre telephone' },
                { icon: showConnectDevice === 'scale' ? 'ri-scales-3-line' : 'ri-watch-line', text: `Allumez votre ${showConnectDevice === 'scale' ? 'balance' : 'bracelet'}` },
                { icon: 'ri-smartphone-line', text: 'Ouvrez l\'app Chutex sur votre iPhone' },
                { icon: 'ri-link', text: 'Allez dans Appareils > Associer' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={s.icon} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} /><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{s.text}</span></div>
                </div>
              ))}
            </div>
            <div onClick={() => { setShowConnectDevice(null); router.push('/(tabs)/devices' as any); }} style={{ padding: '15px', borderRadius: 999, background: '#FFF', color: '#111', cursor: 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, marginBottom: 10 } as any}>Aller dans Appareils</div>
            <div onClick={() => setShowConnectDevice(null)} style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 8 } as any}>Fermer</div>
          </div>
        </div>
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
    case 'prescriber_company':
    case 'company': return <CompanyHome token={token} user={user} />;
    default: return <BeneficiaryHome token={token} user={user} />;
  }
}

// ═══ REMAINING CODE BELOW IS NOW IN EXTRACTED COMPONENTS ═══
// GuardianHome → src/components/dashboard/GuardianHome.tsx
// TeleassistanceHome → src/components/dashboard/TeleassistanceHome.tsx
// AdminHome → src/components/dashboard/AdminHome.tsx
// CompanyHome → src/components/dashboard/CompanyHome.tsx
// END_OF_REFACTORED_FILE
