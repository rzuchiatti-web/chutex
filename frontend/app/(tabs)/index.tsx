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

const webShadow = Platform.OS === 'web' ? { boxShadow: '0 2px 20px rgba(20,20,30,0.05), 0 0 0 1px rgba(20,20,30,0.02)' } : { shadowColor: '#1E1F24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 };
const webGlass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {};

/* ─── PREMIUM CARD ─── */
const Card = ({ children, style, testID }: any) => (
  <View testID={testID} style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(20,20,30,0.06)', padding: 18, marginBottom: 14, ...webShadow }, style]}>{children}</View>
);

/* ─── HERO GRADIENT CARD (web only renders as warm bg) ─── */
const HeroCard = ({ children, style }: any) => (
  <View style={[{
    borderRadius: 28, padding: 24, marginBottom: 16, overflow: 'hidden',
    backgroundColor: '#D4845A',
    ...(Platform.OS === 'web' ? {
      background: 'linear-gradient(135deg, #D4845A 0%, #E8A87C 40%, #F5CBA7 100%)',
      backgroundSize: '200% 200%',
      boxShadow: '0 8px 32px rgba(212,132,90,0.2)',
    } : {}),
  }, style]}>{children}</View>
);

/* ─── WARM STATUS BADGE ─── */
const StatusBadge = ({ label, color }: { label: string; color?: string }) => (
  <View style={{ backgroundColor: color ? `${color}15` : 'rgba(16,185,129,0.10)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, alignSelf: 'flex-start', marginTop: 6 }}>
    <Text style={{ fontSize: 10, fontWeight: '700', color: color || '#10B981', letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

/* ─── PILL BUTTON (primary dark) ─── */
const PillButton = ({ label, icon, onPress, testID, variant = 'dark' }: any) => {
  const bg = variant === 'warm' ? '#D4845A' : '#1E1F24';
  return (
    <TouchableOpacity testID={testID} activeOpacity={0.85} style={{
      backgroundColor: bg, borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 24,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14,
      ...(Platform.OS === 'web' ? { boxShadow: `0 4px 16px ${variant === 'warm' ? 'rgba(212,132,90,0.25)' : 'rgba(20,20,30,0.15)'}`, transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' } : { shadowColor: bg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }),
    }} onPress={onPress}>
      {icon && <Icon name={icon} size={18} color="#FFF" />}
      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ─── QUICK ACTION CIRCLE ─── */
const QuickAction = ({ icon, label, onPress, color = '#F3EDE6' }: any) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
    <View style={{
      width: 56, height: 56, borderRadius: 20, backgroundColor: color, justifyContent: 'center', alignItems: 'center',
      marginBottom: 8, borderWidth: 1, borderColor: 'rgba(20,20,30,0.04)',
      ...(Platform.OS === 'web' ? { transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' } : {}),
    }}>
      <Icon name={icon} size={22} color="#1E1F24" />
    </View>
    <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7084', textAlign: 'center' }}>{label}</Text>
  </TouchableOpacity>
);

/* ─── SECTION HEADER ─── */
const SectionHeader = ({ title, action, onAction }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
    <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E1F24', letterSpacing: -0.3 }}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#D4845A' }}>{action}</Text>
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
        <View style={{ position: 'absolute', top: 40, right: 0, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 8, minWidth: 130, zIndex: 99999, ...webShadow, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(20,20,30,0.12)' } : {}) }}>
          {flags.map(f => (
            <TouchableOpacity key={f.code} testID={`lang-option-${f.code}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: lang === f.code ? 'rgba(212,132,90,0.08)' : 'transparent' }} onPress={() => { setLang(f.code); setOpen(false); }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: f.color, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#FFF' }}>{f.code}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: lang === f.code ? '700' : '500', color: '#1E1F24' }}>{f.code}</Text>
              {lang === f.code && <Icon name="checkmark" size={14} color="#D4845A" />}
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color="#D4845A" /></View>;
  const activeReminders = reminders.filter((r: any) => r.active);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F6F8' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4845A" />} showsVerticalScrollIndicator={false}>

      {/* ─── HERO GRADIENT ─── */}
      <HeroCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity testID="beneficiary-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToGuardian}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}) }}>
              {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{t('beneficiary')}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LanguageFlagButton />
            <TouchableOpacity testID="notification-bell" onPress={() => setShowNotifs(!showNotifs)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="notifications-outline" size={18} color="#FFF" />
              {(guardianRequests.length > 0 || activeAlerts.length > 0) && <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline vitals summary */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: vitals?.heart_rate || '--', label: 'BPM', icon: 'heart-pulse' },
            { val: vitals?.spo2 ? `${vitals.spo2}%` : '--', label: 'SpO2', icon: 'water-outline' },
            { val: vitals?.steps || '0', label: t('steps'), icon: 'pulse-outline' },
          ].map((v, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12, alignItems: 'center', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } : {}) }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF' }}>{v.val}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 }}>{v.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {/* ─── NOTIFICATIONS DROPDOWN ─── */}
      {showNotifs && (
        <Card style={{ borderLeftWidth: 3, borderLeftColor: '#D4845A' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1F24' }}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifs(false)}><Icon name="close" size={18} color="#9CA3B0" /></TouchableOpacity>
          </View>
          {activeAlerts.length === 0 && guardianRequests.length === 0 && (
            <Text style={{ fontSize: 12, color: '#6B7084', textAlign: 'center', paddingVertical: 8 }}>Aucune notification</Text>
          )}
          {activeAlerts.map((a: any) => (
            <TouchableOpacity key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(20,20,30,0.04)' }}
              onPress={() => { setShowNotifs(false); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="alert-circle" size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1F24' }}>{a.message}</Text>
                <Text style={{ fontSize: 11, color: '#6B7084' }}>{a.incident_state || a.teleassistance_status}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {guardianRequests.map((req: any) => (
            <View key={req.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="person-add" size={16} color="#F59E0B" />
              </View>
              <Text style={{ fontSize: 13, color: '#1E1F24', flex: 1 }}>{req.guardian_name} veut devenir gardien</Text>
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
                <Text style={{ fontSize: 13, color: '#1E1F24', marginTop: 2 }}>{a.message}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7084', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {a.incident_state === 'CARE_DISPATCHED' ? 'INTERVENANT EN ROUTE' : a.incident_state === 'CALLING_PATIENT' ? 'APPEL EN COURS' : a.incident_state === 'RESOLVED' ? 'RESOLUE' : a.teleassistance_status || 'EN COURS'}
              </Text>
              {a.intervener_info && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}><Icon name="person" size={14} color="#FFF" /></View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1F24' }}>{a.intervener_info.name}</Text>
                </View>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {/* ─── QUICK ACTIONS ─── */}
      <SectionHeader title="Actions rapides" />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <QuickAction icon="pulse-outline" label="ECG" onPress={() => router.push('/ecg')} color="rgba(212,132,90,0.10)" />
        <QuickAction icon="locate-outline" label="Zones" onPress={() => router.push('/geofencing')} color="rgba(16,185,129,0.10)" />
        <QuickAction icon="qr-code-outline" label="QR Code" onPress={() => router.push('/link-code')} color="rgba(124,92,255,0.10)" />
        <QuickAction icon="time" label="Rappels" onPress={() => router.push('/reminders')} color="rgba(245,158,11,0.10)" />
      </View>

      {/* ─── DEVICES STATUS ─── */}
      <Card style={{ padding: 16 }}>
        <TouchableOpacity data-testid="device-bracelet" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }} onPress={() => router.push('/bracelet-connect')}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(212,132,90,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Icon name="watch-outline" size={22} color="#D4845A" />
            {braceletData?.connected && <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>Bracelet Elio</Text>
            {braceletData?.battery > 0 && <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>{braceletData.battery}% batterie</Text>}
          </View>
          <Icon name="chevron-forward" size={16} color="#9CA3B0" />
        </TouchableOpacity>
        <View style={{ height: 1, backgroundColor: 'rgba(20,20,30,0.04)', marginBottom: 12 }} />
        <TouchableOpacity data-testid="device-vest" style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/vest-connect')}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Icon name="shield-outline" size={22} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>Gilet Anti-Chute</Text>
            <Text style={{ fontSize: 11, color: '#6B7084' }}>{vestData?.connected ? 'Connecte' : 'Non connecte'}</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#9CA3B0" />
        </TouchableOpacity>
      </Card>

      {/* ─── GUARDIANS ─── */}
      <SectionHeader title={`${guardians.length} ${t('guardians')}`} action="Ajouter" onAction={() => router.push('/link-code')} />
      <Card style={{ padding: 16 }}>
        {guardians.map((g: any, i: number) => (
          <TouchableOpacity key={g.id || i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: 'rgba(20,20,30,0.06)' }} onPress={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: ['rgba(212,132,90,0.12)', 'rgba(79,195,247,0.12)', 'rgba(174,213,129,0.12)', 'rgba(255,138,101,0.12)', 'rgba(206,147,216,0.12)'][i % 5], justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: ['#D4845A', '#4FC3F7', '#66BB6A', '#FF8A65', '#CE93D8'][i % 5] }}>{g.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{g.name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7084' }}>{g.relationship || g.profession || t('guardian')}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3B0" />
          </TouchableOpacity>
        ))}
        {guardians.length === 0 && <Text style={{ fontSize: 13, color: '#6B7084', textAlign: 'center', paddingVertical: 12 }}>Aucun gardien pour le moment</Text>}
      </Card>

      {/* ─── GUARDIAN REQUESTS ─── */}
      {guardianRequests.map((req: any) => (
        <Card key={req.id} style={{ borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>{t('guardian_request')}</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E1F24', marginTop: 4 }}>{req.guardian_name}</Text>
          <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 2 }}>Souhaite devenir votre gardien</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity testID={`accept-guardian-${req.id}`} style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', `${req.guardian_name} est maintenant votre gardien.`); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#F3EDE6', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: '#6B7084', fontSize: 13, fontWeight: '700' }}>{t('reject')}</Text>
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
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{t('sos_sub')}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ─── HEALTH CATEGORIES ─── */}
      <SectionHeader title={t('heart_health')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'heart', title: t('heart_health'), img: HEALTH_IMAGES.heart, route: '/health-detail', params: { metricId: 'heart_rate' }, bg: 'rgba(239,68,68,0.06)' },
          { key: 'blood', title: t('blood_health'), img: HEALTH_IMAGES.blood, route: '/health-detail', params: { metricId: 'spo2' }, bg: 'rgba(212,132,90,0.06)' },
          { key: 'sleep', title: t('sleep_health'), img: HEALTH_IMAGES.sleep, route: '/sleep', bg: 'rgba(124,92,255,0.06)' },
          { key: 'physical', title: t('physical_health'), img: HEALTH_IMAGES.physical, route: '/health-detail', params: { metricId: 'temperature' }, bg: 'rgba(16,185,129,0.06)' },
        ].map(cat => (
          <TouchableOpacity key={cat.key} testID={`health-cat-${cat.key}`} style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(20,20,30,0.06)', overflow: 'hidden', ...webShadow }} onPress={() => router.push(cat.params ? { pathname: cat.route as any, params: cat.params } : cat.route as any)}>
            <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: cat.bg }}>
              <Image source={{ uri: cat.img }} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1F24', textAlign: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── QUICK VITALS ─── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { id: 'spo2', label: t('spo2'), val: vitals?.spo2 || '--', unit: '%', icon: 'water-outline', color: '#D4845A' },
          { id: 'heart_rate', label: t('pulse'), val: vitals?.heart_rate || '--', unit: t('bpm'), icon: 'heart-outline', color: '#EF4444' },
          { id: 'sleep', label: t('sleep'), val: '--', unit: '', icon: 'moon-outline', color: '#7C5CFF' },
          { id: 'temperature', label: t('temperature'), val: vitals?.temperature || '--', unit: '', icon: 'thermometer-outline', color: '#10B981' },
        ].map(v => (
          <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={{ width: '48%', ...webShadow }} onPress={() => router.push({ pathname: '/health-detail', params: { metricId: v.id } })}>
            <Card style={{ marginBottom: 0, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7084', textTransform: 'uppercase', letterSpacing: 0.5 }}>{v.label}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E1F24', marginTop: 4 }}>{v.val}<Text style={{ fontSize: 13, color: '#9CA3B0' }}> {v.unit}</Text></Text>
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
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1F24', textAlign: 'center', marginBottom: 14 }}>{t('physical_activity')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          {[
            { val: vitals?.steps || '0', label: t('steps') },
            { val: '0', label: t('kcal') },
            { val: '0', label: t('km') },
          ].map((s, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderColor: 'rgba(20,20,30,0.06)' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#1E1F24' }}>{s.val}</Text>
              <Text style={{ fontSize: 12, color: '#6B7084' }}>{s.label}</Text>
            </View>
          ))}
        </View>
        {/* Progress bars */}
        {[
          { label: '500 KCAL', current: '0 KCAL', pct: '0%', color: '#D4845A' },
          { label: `2000 ${t('steps').toUpperCase()}`, current: `${vitals?.steps || 0} ${t('steps').toUpperCase()}`, pct: `${Math.min(100, ((vitals?.steps || 0) / 2000) * 100)}%`, color: '#10B981' },
        ].map((bar, i) => (
          <View key={i} style={{ backgroundColor: '#F5F6F8', borderRadius: 16, padding: 14, marginBottom: i === 0 ? 8 : 0 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7084', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{t('daily_goal')} | <Text style={{ color: bar.color }}>{bar.label}</Text></Text>
            <View style={{ height: 22, backgroundColor: '#F3EDE6', borderRadius: 11, overflow: 'hidden' }}>
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
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E1F24' }}>{cat.title}</Text>
              <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 2 }}>{cat.count} rappel{cat.count !== 1 ? 's' : ''} par jour</Text>
            </View>
            <Image source={{ uri: cat.img }} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
          </Card>
        </TouchableOpacity>
      ))}

      {/* ─── AI RECOMMENDATION ─── */}
      {rec ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(212,132,90,0.10)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="sparkles" size={16} color="#D4845A" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>Recommandation IA</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7084', lineHeight: 20 }} numberOfLines={4}>{rec}</Text>
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeAlertsG, setActiveAlertsG] = useState<any[]>([]);
  const [showNotifsG, setShowNotifsG] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a, inv, piv] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/guardian/invitations', {}, token).catch(() => []),
        apiFetch('/api/interventions/pending', {}, token).catch(() => []),
      ]);
      const aa = await apiFetch('/api/alerts/active-with-interventions', {}, token).catch(() => []);
      setActiveAlertsG(Array.isArray(aa) ? aa : []);
      setBens(Array.isArray(b) ? b : []);
      setAlerts(Array.isArray(a) ? a : []);
      setInvitations(Array.isArray(inv) ? inv : []);
      setPendingInterventions(Array.isArray(piv) ? piv : []);
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color="#D4845A" /></View>;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F6F8' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4845A" />} showsVerticalScrollIndicator={false}>

      {/* ─── HERO GRADIENT ─── */}
      <HeroCard style={{ backgroundColor: '#C06B40', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #9A5533 0%, #D4845A 40%, #E8A87C 100%)', backgroundSize: '200% 200%', boxShadow: '0 8px 32px rgba(154,85,51,0.25)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity testID="guardian-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToBeneficiary}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
              {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{t('guardian')}{user.is_prescriber ? ' | Prescripteur' : ''}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LanguageFlagButton />
            <TouchableOpacity testID="guardian-notification-bell" onPress={() => setShowNotifsG(!showNotifsG)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="notifications-outline" size={18} color="#FFF" />
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
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {/* ─── NOTIFICATIONS ─── */}
      {showNotifsG && (
        <Card style={{ borderLeftWidth: 3, borderLeftColor: '#D4845A' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1F24' }}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifsG(false)}><Icon name="close" size={18} color="#9CA3B0" /></TouchableOpacity>
          </View>
          {activeAlertsG.length === 0 && invitations.length === 0 && pendingInterventions.length === 0 && (
            <Text style={{ fontSize: 12, color: '#6B7084', textAlign: 'center', paddingVertical: 8 }}>Aucune notification</Text>
          )}
          {activeAlertsG.map((a: any) => (
            <TouchableOpacity key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
              onPress={() => { setShowNotifsG(false); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
              <Icon name="alert-circle" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#1E1F24', flex: 1 }}>{a.beneficiary_name}: {a.message}</Text>
            </TouchableOpacity>
          ))}
          {pendingInterventions.map((p: any) => (
            <TouchableOpacity key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
              onPress={() => { setShowNotifsG(false); router.push({ pathname: '/intervention-detail', params: { interventionId: p.id } }); }}>
              <Icon name="navigate" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#1E1F24', flex: 1 }}>Intervention: {p.beneficiary_name}</Text>
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
                    <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 2 }}>{a.message}</Text>
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
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1F24', marginTop: 4 }}>{piv.alert_message || piv.notes || 'Alerte'}</Text>
            <Text style={{ fontSize: 13, color: '#6B7084', marginTop: 4 }}>{piv.beneficiary_name} {piv.distance_km ? `- ${piv.distance_km}km` : ''}</Text>
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
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1F24', marginTop: 4 }}>{inv.beneficiary_name} vous invite</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity testID={`accept-inv-${inv.id}`} style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', 'Vous etes maintenant gardien.'); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#F3EDE6', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: '#6B7084', fontSize: 13, fontWeight: '700' }}>{t('reject')}</Text>
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
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(212,132,90,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(212,132,90,0.15)' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#D4845A' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1F24' }}>{b.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate || '--'} bpm | SpO2 ${b.latest_vitals.spo2 || '--'}%` : 'Pas de donnees'}</Text>
                {b.active_alerts > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Icon name="warning" size={12} color="#EF4444" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>{b.active_alerts} alerte{b.active_alerts > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>
              <Icon name="chevron-forward" size={18} color="#9CA3B0" />
            </View>
            <StatusBadge label={b.active_alerts > 0 ? t('attention') : t('good_health')} color={b.active_alerts > 0 ? '#EF4444' : undefined} />
          </Card>
        </TouchableOpacity>
      ))}
      {bens.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 32 }}>
          <Icon name="people-outline" size={40} color="#9CA3B0" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E1F24', marginTop: 12 }}>Aucun beneficiaire</Text>
          <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 4, textAlign: 'center' }}>Ajoutez un beneficiaire pour veiller sur lui</Text>
        </Card>
      )}

      <PillButton label={t('add_beneficiary')} icon="heart-outline" onPress={() => router.push('/link-code')} testID="add-beneficiary-btn" variant="warm" />

      {/* Help system */}
      <ContextualTip id="guardian-welcome" icon="people-outline" text="Bienvenue dans votre espace gardien ! Suivez la sante de vos proches en temps reel." color="#D4845A" />
      <MiniTuto id="guardian-intro" triggerLabel="Guide du gardien" steps={[
        { title: 'Votre role', text: 'Vous veillez sur vos proches a distance avec des notifications instantanees.', icon: 'shield-outline' },
        { title: 'Alertes', text: 'Quand une alerte se declenche, vous pouvez intervenir ou suivre l\'intervenant.', icon: 'alert-circle-outline' },
        { title: 'Ajouter', text: 'Demandez le code de liaison de votre proche pour le surveiller.', icon: 'person-add-outline' },
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color="#D4845A" /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F6F8' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4845A" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#7C5CFF', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #6B4FD8 0%, #7C5CFF 40%, #A78BFA 100%)', boxShadow: '0 8px 32px rgba(124,92,255,0.25)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Plateau d'ecoute</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: active.length, label: 'Alertes' },
            { val: activeEscalations.length, label: 'Escalades' },
            { val: subs.length, label: 'Abonnes' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {active.length > 0 && <>
        <SectionHeader title="Alertes en attente" />
        {active.slice(0, 5).map((a: any) => (
          <TouchableOpacity key={a.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <Card style={{ borderLeftWidth: 3, borderLeftColor: a.severity === 'critical' ? '#EF4444' : '#D4845A' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{a.message}</Text>
              <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 4 }}>{a.beneficiary_name} - {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text>
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{su.name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7084' }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3B0" />
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
    <Card style={{ borderWidth: 1.5, borderColor: 'rgba(212,132,90,0.2)', backgroundColor: 'rgba(212,132,90,0.03)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#D4845A', justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="trophy" size={22} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1F24' }}>Recompenses {monthLabel}</Text>
          <Text style={{ fontSize: 11, color: '#6B7084' }}>Top 3 prescripteurs</Text>
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={{ padding: 6 }}>
          <Icon name={editing ? 'close' : 'create-outline'} size={20} color="#D4845A" />
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
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1F24' }}>{t.prize}EUR</Text>
              <Text style={{ fontSize: 10, color: '#6B7084' }}>{t.pos}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {['prize_1', 'prize_2', 'prize_3'].map((k, i) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7084', width: 30 }}>{i + 1}e</Text>
              <TextInput value={(form as any)[k]} onChangeText={(v: string) => setForm({ ...form, [k]: v })} keyboardType="numeric" style={{ flex: 1, backgroundColor: '#F5F6F8', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(20,20,30,0.08)' }} />
              <Text style={{ fontSize: 12, color: '#6B7084' }}>EUR</Text>
            </View>
          ))}
          <TouchableOpacity onPress={save} style={{ backgroundColor: '#D4845A', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 4 }}>
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color="#D4845A" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F6F8' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4845A" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#1E1F24', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #0C0A09 0%, #1E1F24 40%, #44403C 100%)', boxShadow: '0 8px 32px rgba(20,20,30,0.3)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Administration</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: stats.total_users || 0, label: 'Utilisateurs' },
            { val: stats.total_alerts || 0, label: 'Alertes' },
            { val: stats.active_alerts || 0, label: 'Actives' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
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
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3EDE6', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: i < 3 ? '#FFF' : '#6B7084' }}>#{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7084' }}>{p.prescriptions_count || 0} prescriptions</Text>
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
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(212,132,90,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="business-outline" size={20} color="#D4845A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{c.name || c.company_name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7084' }}>{c.email}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3B0" />
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [st, iv, pr, intr, pres, al, rk, rw] = await Promise.all([
        apiFetch('/api/company/stats', {}, token).catch(() => ({})),
        apiFetch('/api/company/intervenants', {}, token).catch(() => []),
        apiFetch('/api/company/prescribers', {}, token).catch(() => []),
        apiFetch('/api/company/interventions', {}, token).catch(() => []),
        apiFetch('/api/company/prescriptions', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/company/ranking', {}, token).catch(() => []),
        apiFetch('/api/company/rewards/current', {}, token).catch(() => null),
      ]);
      setStats(st); setIntervenants(iv); setPrescribers(pr); setInterventions(intr); setPrescriptions(pres); setAlerts(al); setRanking(rk); setReward(rw);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color="#D4845A" /></View>;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F6F8' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#D4845A" />} showsVerticalScrollIndicator={false}>

      <HeroCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{user.company_name || 'Entreprise'}</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: stats.total_intervenants || intervenants.length, label: 'Intervenants' },
            { val: stats.total_prescribers || prescribers.length, label: 'Prescripteurs' },
            { val: activeAlerts.length, label: 'Alertes' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <QuickAction icon="people-outline" label="Intervenants" onPress={() => router.push('/(tabs)/teleconsult')} color="rgba(212,132,90,0.10)" />
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
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3EDE6', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: i < 3 ? '#FFF' : '#6B7084' }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{p.name}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7084' }}>{p.prescriptions_count || 0} prescriptions</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#9CA3B0" />
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
              <Card style={{ borderLeftWidth: 3, borderLeftColor: iv.status === 'completed' ? '#10B981' : iv.status === 'in_progress' ? '#D4845A' : '#F59E0B' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1F24' }}>{iv.beneficiary_name || 'Intervention'}</Text>
                <Text style={{ fontSize: 12, color: '#6B7084', marginTop: 2 }}>{iv.status === 'completed' ? 'Terminee' : iv.status === 'in_progress' ? 'En cours' : 'En attente'}</Text>
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
