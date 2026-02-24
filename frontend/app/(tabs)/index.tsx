import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertBanner from '../../src/components/dashboard/AlertBanner';
import VitalsRow from '../../src/components/dashboard/VitalsRow';
import ActivitySleep from '../../src/components/dashboard/ActivitySleep';
import CopilotCard from '../../src/components/dashboard/CopilotCard';
import DeviceCards from '../../src/components/dashboard/DeviceCards';
import FullScreenLoader from '../../src/components/FullScreenLoader';
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
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAddGuardianPopup, setShowAddGuardianPopup] = useState(false);
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

  const fetchData = useCallback(async () => {
    try {
      const [dd, rem, guards, greqs, hs] = await Promise.all([
        apiFetch('/api/devices/dashboard-summary', {}, token).catch(() => null),
        apiFetch('/api/reminders', {}, token).catch(() => []),
        apiFetch('/api/guardians/my', {}, token).catch(() => []),
        apiFetch('/api/beneficiary/guardian-requests', {}, token).catch(() => []),
        apiFetch('/api/health/summary', {}, token).catch(() => null),
      ]);
      setDashData(dd);
      setReminders(rem);
      setGuardians(Array.isArray(guards) ? guards : []);
      setGuardianRequests(Array.isArray(greqs) ? greqs : []);
      if (hs) setHealthSummary(hs);
      if (report?.weighings) setWeighings(report.weighings);
      try {
        const [prog, cat] = await Promise.all([
          apiFetch('/api/programs/active', {}, token).catch(() => null),
          apiFetch('/api/programs/catalog', {}, token).catch(() => null),
        ]);
        if (prog) {
          setActiveProgram(prog);
          if (prog.active && !prog.today_checkin) setShowCheckin(true);
        }
        if (cat?.programs) setProgramCatalog(cat.programs);
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
  // Morning briefing — only once per session
  useEffect(() => {
    if (Platform.OS === 'web') {
      const seen = sessionStorage.getItem('briefing_seen');
      if (!seen) { router.push('/morning-briefing' as any); }
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
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS - Aide requise immediatement!', device_type: 'bracelet' }) }, token);
      notifyAlert('sos', 'SOS envoye ! Vos gardiens et la teleassistance ont ete alertes.');
      Alert.alert('Alerte SOS envoyee', 'Nous avons bien recu votre alerte.\n\n1. Vos gardiens sont alertes\n2. La teleassistance IA vous appelle\n3. Un intervenant sera envoye si besoin');
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

  if (loading) return Platform.OS === 'web' ? <FullScreenLoader /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#040E1A' }}><ActivityIndicator size="large" color="#4FC3F7" /></View>;

  const br = dashData?.bracelet || { heart_rate: 72, spo2: 97, steps: 3842, blood_pressure: { systolic: 125, diastolic: 78 }, temperature: 36.6, battery: 78, connected: true, calories: 154, distance_km: 2.7, heart_rate_history: [] };
  const sc = dashData?.scale || { weight: 72.4, bmi: 24.1, body_fat: 22.3, muscle_mass: 33.8, water_pct: 55.2, battery: 92, connected: true };
  const vs = dashData?.vest || { fall_detected: false, posture_score: 87, chest_temp: 36.7, battery: 65, connected: true, wearing_hours_today: 6.2, alerts_today: 0 };
  const sl = dashData?.sleep || { duration: '7h 23min', quality: 82, deep: '2h 10min', light: '4h 05min', rem: '1h 08min' };

  const BG_VIDEO = BG_IMAGES.beneficiary;

  /* Glass card helper */
  const GC = ({ children, style, onClick, testId }: any) => (
    <div data-testid={testId} onClick={onClick} style={{ padding: '16px', borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 12, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s, background 0.2s', ...style } as any}
      onMouseEnter={(e: any) => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={(e: any) => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
      {children}
    </div>
  );

  /* ─── WEB: Redesigned beneficiary dashboard ─── */
  // Morning briefing effect — runs once on mount
  if (Platform.OS === 'web') {
    return (
      <div data-testid="beneficiary-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: 'hidden' } as any}>
        <img src={BG_VIDEO} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* ── NEW HEADER: AI Summary + Tabs + Lang ── */}
          <div data-testid="dashboard-header" style={{ marginBottom: 16, width: '100%', position: 'relative', zIndex: 50 } as any}>
            {/* Top row: avatar (click→profil), name+tabs, lang, notif */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div onClick={() => router.push('/(tabs)/profile' as any)} style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #0E7490, #22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(34,211,238,0.4)', boxShadow: '0 4px 16px rgba(14,116,144,0.35)', flexShrink: 0, cursor: 'pointer' } as any}>
                  {user.avatar_url ? <img src={user.avatar_url} style={{ width: 46, height: 46, borderRadius: 14, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', letterSpacing: -0.3, marginBottom: 2 }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(79,195,247,0.6)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{activeTab === 'beneficiary' ? t('space_beneficiary') : t('space_guardian')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                {/* Language flag */}
                <div data-testid="lang-picker-btn" onClick={() => setLangOpen(!langOpen)} style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, lineHeight: 1 } as any}>
                  {lang === 'FR' ? '\u{1F1EB}\u{1F1F7}' : lang === 'EN' ? '\u{1F1EC}\u{1F1E7}' : lang === 'ES' ? '\u{1F1EA}\u{1F1F8}' : lang === 'DE' ? '\u{1F1E9}\u{1F1EA}' : lang === 'IT' ? '\u{1F1EE}\u{1F1F9}' : lang === 'PT' ? '\u{1F1F5}\u{1F1F9}' : lang === 'NL' ? '\u{1F1F3}\u{1F1F1}' : '\u{1F30D}'}
                </div>
                <div data-testid="notif-bell" onClick={() => setShowNotifs(!showNotifs)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}>
                  <i className="ri-notification-3-line" style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)' }} />
                  {(guardianRequests.length > 0 || activeAlerts.length > 0) && <div style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: 5, background: '#EF4444', border: '2px solid rgba(4,14,26,0.8)' } as any} />}
                </div>
              </div>
            </div>
          </div>

          <NotificationsPopup show={showNotifs} onClose={() => setShowNotifs(false)} activeAlerts={activeAlerts} guardianRequests={guardianRequests} />

          <LanguagePopup show={langOpen} onClose={() => setLangOpen(false)} lang={lang} setLang={setLang} />
          {/* ── SOS Button (top) ── */}
          <div data-testid="sos-button" onClick={handleSOS} style={{
            padding: '18px', borderRadius: 18, textAlign: 'center', cursor: 'pointer', marginBottom: 16,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 0 30px rgba(239,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          } as any}>
            {sosLoading ? <div style={{ color: '#FFF', fontSize: 14 }}>Envoi en cours...</div> : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 } as any}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239,68,68,0.3)' } as any}>
                  <i className="ri-alarm-warning-line" style={{ fontSize: 26, color: '#EF4444' }} />
                </div>
                <div style={{ textAlign: 'left' } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: 3 }}>SOS</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{t('sos_sub')}</div>
                </div>
              </div>
            )}
          </div>


          {/* ── 1. ALERTES EN HAUT (toujours visible) ── */}
          <AlertBanner activeAlerts={activeAlerts} />

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* ── 2. VITALS ── */}
          <VitalsRow br={br} />

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* ── 3. ACTIVITE + SOMMEIL ── */}
          <ActivitySleep br={br} sl={sl} />

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* ── 4. PROGRAMME EN COURS (si actif, avant Nora) ── */}
          {activeProgram?.active && (
            <div data-testid="active-program-card" onClick={() => router.push('/(tabs)/chat' as any)} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: `1px solid ${activeProgram.program.color}25`, padding: '16px 18px', marginBottom: 16, cursor: 'pointer', transition: 'transform 0.2s', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}
              onMouseEnter={(e: any) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e: any) => e.currentTarget.style.transform = ''}>
              <div style={{ marginBottom: 10 } as any}>
                <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: `${activeProgram.program.color}15`, border: `1px solid ${activeProgram.program.color}25`, fontSize: 9, fontWeight: 700, color: activeProgram.program.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('program_running')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeProgram.program.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={activeProgram.program.icon} style={{ fontSize: 20, color: activeProgram.program.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{activeProgram.program.title}</div>
                  <div style={{ fontSize: 10, color: activeProgram.program.color, fontWeight: 600 }}>Jour {activeProgram.current_day}/{activeProgram.program.duration_days}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: activeProgram.program.color }}>{activeProgram.progress_pct}%</div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                <div style={{ height: 4, borderRadius: 2, width: `${activeProgram.progress_pct}%`, background: activeProgram.program.color, transition: 'width 0.5s' } as any} />
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* ── 5. NORA IA ── */}
          <CopilotCard />

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* ── 6. DISPOSITIFS ── */}
          <DeviceCards br={br} sc={sc} vs={vs} weighings={weighings} onStartWeighing={() => setShowWeighing(true)} onRefresh={fetchData} />

          {showWeighing && <WeighingFlow onClose={() => setShowWeighing(false)} d={dashData?.scale || {}} weighings={weighings} />}

          {/* Les alertes sont affichées en haut du dashboard */}

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />


          {/* ── Rappels — directly on background ── */}
          <div data-testid="reminders-section" style={{ marginBottom: 16 } as any}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>{t('my_reminders')}</div>
            {[
              { type: 'hydration', label: 'Hydratation', img: REMINDER_IMAGES.hydration, color: '#38BDF8' },
              { type: 'medication', label: 'Traitement', img: REMINDER_IMAGES.medication, color: '#F59E0B' },
              { type: 'alarm', label: 'Alarmes', img: REMINDER_IMAGES.alarm, color: '#EF4444' },
            ].map((cat) => {
              const catRems = reminders.filter((r: any) => r.reminder_type === cat.type);
              const activeCount = catRems.filter((r: any) => r.active).length;
              const nextTime = activeCount > 0 ? getNextReminderTime(catRems.find((r: any) => r.active)) : '';
              return (
                <div key={cat.type} data-testid={`reminder-cat-${cat.type}`} onClick={() => { setEditReminder({ _type: cat.type }); setShowReminderCRUD(true); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, cursor: 'pointer', transition: 'background 0.2s', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                  <img src={cat.img} alt={cat.label} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 } as any} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: activeCount > 0 ? cat.color : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                      {activeCount > 0 ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}${nextTime ? ` · dans ${nextTime}` : ''}` : 'Non configure'}
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }} />
                </div>
              );
            })}
          </div>

          {/* ── Teleconsultation ── */}
          <DoctorCard onPress={() => router.push('/(tabs)/teleconsult')} />

          {/* ── Guardians ── */}
          <GC testId="guardians-section">
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Mes gardiens</div>
            {guardians.map((g: any, i: number) => (
              <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,195,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#4FC3F7' }}>{g.name?.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{g.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.relationship || t('guardian')}</div></div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
              </div>
            ))}
            {guardians.length === 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '6px 0' }}>Aucun gardien</div>}
            <div data-testid="add-guardian-btn" onClick={() => setShowAddGuardianPopup(true)} style={{ marginTop: 12, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
              <i className="ri-heart-add-line" style={{ fontSize: 18, color: '#FFF' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Ajouter un gardien</span>
            </div>
          </GC>

          <ReminderCRUDPopup show={showReminderCRUD} editReminder={editReminder} setEditReminder={setEditReminder} onClose={() => { setShowReminderCRUD(false); setEditReminder(null); }} reminders={reminders} reminderMeta={reminderMeta} token={token} fetchData={fetchData} deleteReminder={deleteReminder} />

          <ReminderNotifPopup reminderNotif={reminderNotif} setReminderNotif={setReminderNotif} reminderMeta={reminderMeta} token={token} fetchData={fetchData} />
            const editingId = editReminder._editingId || null;
            const editingData = editReminder._editingData || null;
            return (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
                <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                    <div onClick={() => { setShowReminderCRUD(false); setEditReminder(null); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                    <img src={meta.img} alt="" style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' } as any} />
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{meta.label}</div>
                  </div>

                  {/* List of reminders */}
                  {typeRems.map((r: any) => {
                    const isEditing = editingId === r.id;
                    const daysStr = (!r.days || r.days.length === 0 || r.days.length === 7) ? 'Tous les jours' : r.days.join(', ').toUpperCase();
                    return (
                      <div key={r.id} style={{ borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${isEditing ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 10, overflow: 'hidden' } as any}>
                        {!isEditing ? (
                          /* View mode */
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px' } as any}>
                            <div onClick={() => setEditReminder({ ...editReminder, _editingId: r.id, _editingData: { time: r.time, notes: r.notes || '', days: r.days || ['lun','mar','mer','jeu','ven','sam','dim'] } })} style={{ cursor: 'pointer', flex: 1 } as any}>
                              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{r.time}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{daysStr}{r.notes ? ` · ${r.notes}` : ''}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                              <div onClick={async () => { try { await apiFetch(`/api/reminders/${r.id}/toggle`, { method: 'PUT' }, token); fetchData(); } catch {} }} style={{ width: 44, height: 24, borderRadius: 12, background: r.active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${r.active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative' } as any}>
                                <div style={{ width: 18, height: 18, borderRadius: 9, background: r.active ? '#10B981' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: r.active ? 22 : 2, transition: 'left 0.2s' } as any} />
                              </div>
                              <div onClick={async () => { await deleteReminder(r.id); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 16, color: 'rgba(239,68,68,0.5)' }} /></div>
                            </div>
                          </div>
                        ) : (
                          /* Edit mode */
                          <div style={{ padding: '16px 18px' } as any}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Heure</div>
                            <input type="time" value={editingData?.time || ''} onChange={(e: any) => setEditReminder({ ...editReminder, _editingData: { ...editingData, time: e.target.value } })} style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 20, fontWeight: 800, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 12, colorScheme: 'dark' } as any} />
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Notes</div>
                            <input value={editingData?.notes || ''} onChange={(e: any) => setEditReminder({ ...editReminder, _editingData: { ...editingData, notes: e.target.value } })} placeholder="Ex: 2 verres d'eau..." style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 14 } as any} />
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>Frequence</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 14 } as any}>
                              {[{ key: 'lun', l: 'L' },{ key: 'mar', l: 'M' },{ key: 'mer', l: 'Me' },{ key: 'jeu', l: 'J' },{ key: 'ven', l: 'V' },{ key: 'sam', l: 'S' },{ key: 'dim', l: 'D' }].map(d => {
                                const sel = (editingData?.days || []).includes(d.key);
                                return <div key={d.key} onClick={() => { const days = editingData?.days || []; setEditReminder({ ...editReminder, _editingData: { ...editingData, days: sel ? days.filter((x: string) => x !== d.key) : [...days, d.key] } }); }} style={{ padding: '10px', borderRadius: 10, background: sel ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: sel ? 800 : 500, color: sel ? '#FFF' : 'rgba(255,255,255,0.2)' } as any}>{d.l}</div>;
                              })}
                            </div>
                            <div style={{ display: 'flex', gap: 8 } as any}>
                              <div onClick={async () => { try { await apiFetch(`/api/reminders/${r.id}`, { method: 'PUT', body: JSON.stringify({ ...editingData, reminder_type: popupType, title: editingData.notes || meta.label }) }, token); fetchData(); setEditReminder({ ...editReminder, _editingId: null, _editingData: null, _saved: r.id }); setTimeout(() => setEditReminder((p: any) => ({ ...p, _saved: null })), 2000); } catch {} }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Sauvegarder</div>
                              <div onClick={() => setEditReminder({ ...editReminder, _editingId: null, _editingData: null })} style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                            </div>
                          </div>
                        )}
                        {editReminder._saved === r.id && <div style={{ padding: '8px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Sauvegarde !</span></div>}
                      </div>
                    );
                  })}

                  {typeRems.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Aucun rappel configure</div>}
                  <div onClick={async () => { try { await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify({ reminder_type: popupType, title: meta.label, time: '08:00', days: ['lun','mar','mer','jeu','ven','sam','dim'], notes: '', active: true }) }, token); fetchData(); } catch {} }} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                    <i className="ri-add-line" style={{ fontSize: 16, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Ajouter un rappel</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── REMINDER NOTIFICATION POPUP (glass like mockup) ── */}
          {reminderNotif && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', background: 'rgba(200,190,210,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <div style={{ width: '100%', maxWidth: 360, padding: '40px 30px 30px', textAlign: 'center', position: 'relative' } as any}>
                <div onClick={() => setReminderNotif(null)} style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Rappel</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', marginBottom: 20 }}>{reminderMeta[reminderNotif.reminder_type]?.label || reminderNotif.title}</div>
                <img src={reminderMeta[reminderNotif.reminder_type]?.img || REMINDER_IMAGES.alarm} alt="" style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto 16px', display: 'block' } as any} />
                {reminderNotif.notes && <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>[{reminderNotif.notes}]</div>}
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 28, fontStyle: 'italic', lineHeight: 1.4 }}>{reminderMeta[reminderNotif.reminder_type]?.question}</div>
                <div onClick={async () => { try { await apiFetch(`/api/reminders/${reminderNotif.id}/complete`, { method: 'PUT' }, token); } catch {} setReminderNotif(null); fetchData(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', marginBottom: 12 } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-check-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Confirmer le rappel</span>
                </div>
                <div onClick={() => setReminderNotif(null)} style={{ padding: '12px', borderRadius: 999, border: '2px solid rgba(239,68,68,0.4)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1 } as any}>Refuser</div>
              </div>
            </div>
          )}

          {/* ── POPUP AJOUTER UN GARDIEN ── */}
          {showAddGuardianPopup && (
            <div onClick={() => { setShowAddGuardianPopup(false); setInviteGuardPhone(''); setInviteGuardRelationship(''); setInviteGuardMsg(''); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.6)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => { setShowAddGuardianPopup(false); setInviteGuardPhone(''); setInviteGuardRelationship(''); setInviteGuardMsg(''); }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} /></div>
                </div>
                <div style={{ marginBottom: 24 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Beneficiaire · Gardien</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1.1 }}>Ajouter un<br/>gardien</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Entrez le numero de telephone de votre gardien.</div>
                </div>
                <div style={{ marginBottom: 24 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numero de telephone</div>
                  <input value={inviteGuardPhone} onChange={(e: any) => setInviteGuardPhone(e.target.value)} placeholder="06 12 34 56 78" type="tel" style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
                {(() => {
                  const PROS_G = ['Auxiliaire de vie', 'Aide soignant(e)', 'Aide a domicile', 'Professionnel de sante', 'Infirmier(e) liberale', 'Coach sportif', 'Preparateur physique'];
                  const PERSO_G = ['Mere', 'Pere', 'Fils', 'Fille', 'Petit-enfant', 'Conjoint(e)', 'Frere', 'Soeur', 'Ami(e)', 'Voisin(e)', 'Autre'];
                  const isPro = PROS_G.includes(inviteGuardRelationship);
                  const isPerso = PERSO_G.includes(inviteGuardRelationship);
                  return (
                    <div style={{ marginBottom: 24 } as any}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Lien avec le gardien</div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 } as any}>
                        <div onClick={() => { if (!isPro) setInviteGuardRelationship(PROS_G[0]); }} style={{ flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer', background: isPro ? 'rgba(79,195,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isPro ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' } as any}>
                          <i className="ri-briefcase-line" style={{ fontSize: 20, color: isPro ? '#4FC3F7' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: isPro ? '#4FC3F7' : 'rgba(255,255,255,0.5)' }}>Professionnel</div>
                        </div>
                        <div onClick={() => { if (!isPerso) setInviteGuardRelationship(PERSO_G[0]); }} style={{ flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer', background: isPerso ? 'rgba(79,195,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isPerso ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' } as any}>
                          <i className="ri-heart-line" style={{ fontSize: 20, color: isPerso ? '#4FC3F7' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }} />
                          <div style={{ fontSize: 12, fontWeight: 700, color: isPerso ? '#4FC3F7' : 'rgba(255,255,255,0.5)' }}>Particulier</div>
                        </div>
                      </div>
                      {(isPro || isPerso) && (
                        <select value={inviteGuardRelationship} onChange={(e: any) => setInviteGuardRelationship(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' } as any}>
                          {(isPro ? PROS_G : PERSO_G).map(r => <option key={r} value={r} style={{ background: '#0a1929', color: '#FFF' }}>{r}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })()}
                {inviteGuardMsg && (
                  <div style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 14, background: inviteGuardMsg.startsWith('Erreur') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${inviteGuardMsg.startsWith('Erreur') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` } as any}>
                    <div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>{inviteGuardMsg}</div>
                  </div>
                )}
                <div onClick={async () => {
                  if (!inviteGuardPhone.trim() || inviteGuardLoading) return;
                  setInviteGuardLoading(true); setInviteGuardMsg('');
                  try {
                    const res = await apiFetch('/api/beneficiary/invite-guardian', {
                      method: 'POST', body: JSON.stringify({ phone: inviteGuardPhone.trim(), relationship: inviteGuardRelationship.trim() })
                    }, token);
                    setInviteGuardMsg(res.message || 'Invitation envoyee !');
                    if (res.status !== 'error') { fetchData(); setTimeout(() => { setShowAddGuardianPopup(false); setInviteGuardPhone(''); setInviteGuardRelationship(''); setInviteGuardMsg(''); }, 2000); }
                  } catch (e: any) { setInviteGuardMsg(`Erreur : ${(e as any).message}`); } finally { setInviteGuardLoading(false); }
                }} style={{ padding: '14px', borderRadius: 12, textAlign: 'center', cursor: inviteGuardPhone.trim() ? 'pointer' : 'not-allowed', background: inviteGuardPhone.trim() ? 'linear-gradient(135deg, rgba(14,116,144,0.4), rgba(34,211,238,0.2))' : 'rgba(255,255,255,0.03)', border: `1px solid ${inviteGuardPhone.trim() ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`, color: inviteGuardPhone.trim() ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                  {inviteGuardLoading ? 'Envoi...' : <><i className="ri-send-plane-line" style={{ fontSize: 15 }} />Envoyer l'invitation</>}
                </div>
              </div>
            </div>
          )}

          {/* ── DAILY CHECK-IN POPUP ── */}
          {showCheckin && activeProgram?.active && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10002, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: '28px 24px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 } as any}>
                  <div data-testid="close-checkin" onClick={() => setShowCheckin(false)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                </div>
                {!checkinFeedback ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>
                        {activeProgram.program?.icon ? <i className={activeProgram.program.icon} style={{ fontSize: 36, color: activeProgram.program.color }} /> : null}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Jour {activeProgram.current_day}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{activeProgram.today_tasks?.focus}</div>
                    </div>
                    {/* Mood selector */}
                    <div style={{ marginBottom: 20 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10, textAlign: 'center' }}>Comment te sens-tu ?</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 } as any}>
                        {[1, 2, 3, 4, 5].map(m => (
                          <div key={m} data-testid={`mood-${m}`} onClick={() => setCheckinMood(m)} style={{
                            width: 48, height: 48, borderRadius: 14, cursor: 'pointer',
                            background: checkinMood === m ? `${['#EF4444','#F59E0B','#A78BFA','#22D3EE','#10B981'][m-1]}20` : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${checkinMood === m ? ['#EF4444','#F59E0B','#A78BFA','#22D3EE','#10B981'][m-1] : 'rgba(255,255,255,0.06)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.2s',
                          } as any}>
                            {['😔','😐','🙂','😊','😄'][m-1]}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Note */}
                    <div style={{ marginBottom: 20 } as any}>
                      <input data-testid="checkin-note" value={checkinNote} onChange={(e: any) => setCheckinNote(e.target.value)} placeholder="Une note sur ta journee... (optionnel)"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                    </div>
                    {/* Submit */}
                    <div data-testid="submit-checkin" onClick={async () => {
                      if (checkinSending) return;
                      setCheckinSending(true);
                      try {
                        const res = await apiFetch('/api/programs/checkin', { method: 'POST', body: JSON.stringify({ mood: checkinMood, note: checkinNote }) }, token);
                        setCheckinFeedback(res.feedback || 'Bravo !');
                        fetchData();
                      } catch {} finally { setCheckinSending(false); }
                    }} style={{
                      padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${activeProgram.program?.color || '#22D3EE'}40, ${activeProgram.program?.color || '#22D3EE'}20)`,
                      border: `1px solid ${activeProgram.program?.color || '#22D3EE'}30`,
                      fontSize: 14, fontWeight: 700, color: '#FFF',
                    } as any}>
                      {checkinSending ? 'Envoi...' : 'Valider mon check-in'}
                    </div>
                  </>
                ) : (
                  /* Feedback after check-in */
                  <div style={{ textAlign: 'center', padding: '20px 0' } as any}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 12 }}>Check-in valide !</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 20, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
                      "{checkinFeedback}"
                    </div>
                    <div onClick={() => { setShowCheckin(false); setCheckinFeedback(''); setCheckinNote(''); setCheckinMood(3); }} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FLOATING CHAT BUTTON ── */}
          {/* ── GUARDIAN ACTIVATION POPUP ── */}
          {showGuardianActivation && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.7)', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, padding: '32px 24px', boxSizing: 'border-box' } as any}>
                {/* Close */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                  <div data-testid="close-guardian-activation" onClick={() => { setShowGuardianActivation(false); setActiveTab('beneficiary'); }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
                  </div>
                </div>

                {guardianActivationStep === 0 ? (
                  /* Step 0: Presentation */
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(167,139,250,0.2)' } as any}>
                        <i className="ri-shield-user-line" style={{ fontSize: 32, color: '#A78BFA' }} />
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Devenez Aidant</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Activez votre espace aidant pour veiller sur vos proches</div>
                    </div>

                    {/* Features list */}
                    {[
                      { icon: 'ri-eye-line', color: '#22D3EE', title: 'Suivi en temps reel', desc: 'Consultez les donnees de sante et la localisation de vos proches' },
                      { icon: 'ri-alarm-warning-line', color: '#EF4444', title: 'Alertes instantanees', desc: 'Recevez les alertes SOS, chutes et anomalies par SMS et email' },
                      { icon: 'ri-heart-pulse-line', color: '#10B981', title: 'Rapports de sante', desc: 'Acces aux rapports detailles et recommandations du Coach IA' },
                      { icon: 'ri-route-line', color: '#F59E0B', title: 'Interventions coordonnees', desc: 'Participez a la chaine de secours en cas d\'alerte' },
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className={f.icon} style={{ fontSize: 18, color: f.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 2 }}>{f.title}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}

                    <div data-testid="guardian-activation-next" onClick={() => setGuardianActivationStep(1)} style={{ marginTop: 24, padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(167,139,250,0.25)', fontSize: 14, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s' } as any}
                      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                      <span>Continuer</span>
                      <i className="ri-arrow-right-line" style={{ fontSize: 16 }} />
                    </div>
                  </>
                ) : (
                  /* Step 1: Alert configuration + activation */
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Configurer vos alertes</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Choisissez comment recevoir les notifications d'alerte de vos proches</div>
                    </div>

                    {/* SMS Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          <i className="ri-message-2-line" style={{ fontSize: 18, color: '#10B981' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alertes SMS</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Recevoir les urgences par SMS</div>
                        </div>
                      </div>
                      <div data-testid="toggle-sms" onClick={() => setAlertSms(!alertSms)} style={{ width: 48, height: 26, borderRadius: 13, background: alertSms ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${alertSms ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' } as any}>
                        <div style={{ width: 20, height: 20, borderRadius: 10, background: alertSms ? '#10B981' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: alertSms ? 24 : 2, transition: 'left 0.2s' } as any} />
                      </div>
                    </div>

                    {/* Email Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          <i className="ri-mail-line" style={{ fontSize: 18, color: '#38BDF8' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alertes Email</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Recevoir les rapports par email</div>
                        </div>
                      </div>
                      <div data-testid="toggle-email" onClick={() => setAlertEmail(!alertEmail)} style={{ width: 48, height: 26, borderRadius: 13, background: alertEmail ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${alertEmail ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' } as any}>
                        <div style={{ width: 20, height: 20, borderRadius: 10, background: alertEmail ? '#38BDF8' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: alertEmail ? 24 : 2, transition: 'left 0.2s' } as any} />
                      </div>
                    </div>

                    {/* Activate Button (slide-style) */}
                    <div data-testid="activate-guardian-btn" onClick={activateGuardianMode} style={{
                      padding: '16px', borderRadius: 14, textAlign: 'center', cursor: activatingGuardian ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(139,92,246,0.15))',
                      border: '1px solid rgba(167,139,250,0.3)',
                      boxShadow: '0 4px 20px rgba(139,92,246,0.2)',
                      fontSize: 15, fontWeight: 800, color: '#FFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    } as any}
                      onMouseEnter={(e: any) => { if (!activatingGuardian) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139,92,246,0.35)'; } }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.2)'; }}>
                      {activatingGuardian ? (
                        <span>Activation en cours...</span>
                      ) : (
                        <>
                          <i className="ri-shield-check-line" style={{ fontSize: 18 }} />
                          <span>Activer l'espace aidant</span>
                        </>
                      )}
                    </div>

                    <div onClick={() => setGuardianActivationStep(0)} style={{ marginTop: 12, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' } as any}>
                      <i className="ri-arrow-left-line" style={{ marginRight: 4 }} />Retour
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

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

// ═══ REMAINING CODE BELOW IS NOW IN EXTRACTED COMPONENTS ═══
// GuardianHome → src/components/dashboard/GuardianHome.tsx
// TeleassistanceHome → src/components/dashboard/TeleassistanceHome.tsx
// AdminHome → src/components/dashboard/AdminHome.tsx
// CompanyHome → src/components/dashboard/CompanyHome.tsx
// END_OF_REFACTORED_FILE
