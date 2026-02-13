import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};

const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255, 255, 255, 0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.7)', padding: 16, marginBottom: 12, ...glassStyle }, style]}>{children}</View>
);

const HealthBadge = ({ status }: { status: string }) => (
  <View style={{ backgroundColor: '#C8E6C9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: 0.5 }}>{status}</Text>
  </View>
);

const BlackButton = ({ label, icon, onPress, testID }: any) => (
  <TouchableOpacity testID={testID} style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }) }} onPress={onPress}>
    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    {icon && <Ionicons name={icon} size={18} color="#FFF" />}
  </TouchableOpacity>
);

/* ───── LANGUAGE FLAG PICKER ───── */
function LanguageFlagButton() {
  const { lang, setLang, flags } = useI18n();
  const [open, setOpen] = useState(false);
  const current = flags.find(f => f.code === lang) || flags[0];
  return (
    <View style={{ position: 'relative', zIndex: 9999 }}>
      <TouchableOpacity
        testID="lang-flag-btn"
        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: current.color, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' }}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF' }}>{current.code}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ position: 'absolute', top: 38, right: 0, backgroundColor: '#FFF', borderRadius: 14, padding: 6, minWidth: 120, zIndex: 99999, ...( Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10 }) }}>
          {flags.map(f => (
            <TouchableOpacity key={f.code} testID={`lang-option-${f.code}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: lang === f.code ? 'rgba(0,0,0,0.04)' : 'transparent', zIndex: 99999 }}
              onPress={() => { setLang(f.code); setOpen(false); }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: f.color, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#FFF' }}>{f.code}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: lang === f.code ? '700' : '500', color: '#000' }}>{f.code}</Text>
              {lang === f.code && <Ionicons name="checkmark" size={14} color="#000" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ───── BENEFICIARY ───── */
function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors } = useTheme();
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
  const sosPulse = useRef(new Animated.Value(1)).current;
  const { refreshUser } = useAuth();

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
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
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => {
    if (reminders.length > 0) { const cleanup = startReminderChecker(reminders); return cleanup; }
  }, [reminders]);

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS - Aide requise immediatement!', device_type: 'bracelet' }) }, token);
      notifyAlert('sos', 'SOS envoye ! Vos gardiens et la teleassistance ont ete alertes.');
      Alert.alert('SOS Envoye', 'Vos gardiens et la teleassistance ont ete alertes.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSosLoading(false); }
  };

  const switchToGuardian = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      if (user.has_guardian_space) {
        await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'guardian' }) }, token);
        await refreshUser();
      } else {
        router.push('/activate-guardian' as any);
      }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSwitching(false); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;

  const activeReminders = reminders.filter((r: any) => r.active);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F0EB' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
        <TouchableOpacity testID="beneficiary-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToGuardian}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
            {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#000' }}>{user.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: '#4CAF50', width: 6, height: 6, borderRadius: 3 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.5 }}>{t('beneficiary').toUpperCase()}</Text>
              {user.has_guardian_space && <Text style={{ fontSize: 10, color: '#AAA' }}> | {t('guardian')}</Text>}
            </View>
          </View>
        </TouchableOpacity>
        <LanguageFlagButton />
        <TouchableOpacity testID="notification-bell" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginLeft: 8, ...glassStyle }}>
          <Ionicons name="notifications-outline" size={18} color="#000" />
          {guardianRequests.length > 0 && <View style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935', borderWidth: 2, borderColor: '#F5F0EB' }} />}
        </TouchableOpacity>
      </View>

      {/* Devices Status */}
      <GlassCard style={{ padding: 14 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => router.push('/bracelet-connect')}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Ionicons name="watch-outline" size={22} color="#000" />
            {braceletData?.connected && <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' }} />}
          </View>
          {braceletData?.battery > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="battery-dead" size={16} color="#E53935" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#E53935', marginLeft: 2 }}>{braceletData.battery}%</Text>
            </View>
          )}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#000', flex: 1 }}>Bracelet Elio</Text>
          <Ionicons name="chevron-forward" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/vest-connect')}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Ionicons name="shield-outline" size={22} color="#000" />
            {vestData?.connected && <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' }} />}
          </View>
          <Text style={{ fontSize: 12, color: '#888', fontWeight: '600', flex: 1 }}>Gilet Anti-Chute</Text>
          <Ionicons name="chevron-forward" size={16} color="#888" />
        </TouchableOpacity>
      </GlassCard>

      {/* Guardians Card */}
      <GlassCard style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: guardians.length > 0 ? 10 : 0 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Ionicons name="people" size={22} color="#000" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', flex: 1 }}>{guardians.length} {t('guardians')}</Text>
          <TouchableOpacity onPress={() => router.push('/link-code')} style={{ padding: 4 }}>
            <Ionicons name="add-circle-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>
        {guardians.map((g: any, i: number) => (
          <TouchableOpacity key={g.id || i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: 'rgba(0,0,0,0.06)' }} onPress={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ['#FFB74D', '#4FC3F7', '#AED581', '#FF8A65', '#CE93D8'][i % 5], justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>{g.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#000' }}>{g.name}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>{g.relationship || g.profession || g.guardian_type || t('guardian')}{g.structure_name ? ` - ${g.structure_name}` : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
        ))}
        {guardians.length === 0 && <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', paddingVertical: 8 }}>Aucun gardien</Text>}
      </GlassCard>

      {/* Guardian Requests */}
      {guardianRequests.length > 0 && guardianRequests.map((req: any) => (
        <GlassCard key={req.id} style={{ borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF9800', textTransform: 'uppercase', letterSpacing: 1 }}>{t('guardian_request')}</Text>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', marginTop: 4 }}>{req.guardian_name}</Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Souhaite devenir votre gardien</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity testID={`accept-guardian-${req.id}`} style={{ flex: 1, backgroundColor: '#4CAF50', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', `${req.guardian_name} est maintenant votre gardien.`); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
              onPress={async () => { try { await apiFetch(`/api/beneficiary/guardian-requests/${req.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: '#888', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>{t('reject')}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}

      {/* SOS Button */}
      <Animated.View style={{ transform: [{ scale: sosPulse }], marginBottom: 16 }}>
        <TouchableOpacity testID="sos-button" style={{ backgroundColor: '#E53935', borderRadius: 20, paddingVertical: 20, alignItems: 'center' }} onPress={handleSOS} disabled={sosLoading} activeOpacity={0.8}>
          {sosLoading ? <ActivityIndicator color="#FFF" size="large" /> : (
            <>
              <Ionicons name="alert-circle" size={32} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 4 }}>{t('sos')}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{t('sos_sub')}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Health Categories Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'heart', title: t('heart_health'), img: HEALTH_IMAGES.heart, route: '/health-detail', params: { metricId: 'heart_rate' } },
          { key: 'blood', title: t('blood_health'), img: HEALTH_IMAGES.blood, route: '/health-detail', params: { metricId: 'spo2' } },
          { key: 'sleep', title: t('sleep_health'), img: HEALTH_IMAGES.sleep, route: '/sleep' },
          { key: 'physical', title: t('physical_health'), img: HEALTH_IMAGES.physical, route: '/health-detail', params: { metricId: 'temperature' } },
        ].map(cat => (
          <TouchableOpacity key={cat.key} testID={`health-cat-${cat.key}`} style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', overflow: 'hidden', ...glassStyle }} onPress={() => router.push(cat.params ? { pathname: cat.route as any, params: cat.params } : cat.route as any)}>
            <View style={{ height: 110, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,235,238,0.3)' }}>
              <Image source={{ uri: cat.img }} style={{ width: 90, height: 90, resizeMode: 'contain' }} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', textAlign: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Vitals */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { id: 'spo2', label: t('spo2'), val: vitals?.spo2 || '--', unit: '%', icon: 'water-outline' },
          { id: 'heart_rate', label: t('pulse'), val: vitals?.heart_rate || '--', unit: t('bpm'), icon: 'heart-outline' },
          { id: 'sleep', label: t('sleep'), val: '--', unit: '', icon: 'moon-outline' },
          { id: 'temperature', label: t('temperature'), val: vitals?.temperature || '--', unit: '', icon: 'thermometer-outline' },
        ].map(v => (
          <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 14, ...glassStyle }}
            onPress={() => router.push({ pathname: '/health-detail', params: { metricId: v.id } })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }}>{v.label}</Text>
                <Text style={{ fontSize: 14, color: '#888', marginTop: 2 }}>{v.val}{v.unit ? ` ${v.unit}` : ''}</Text>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={v.icon as any} size={14} color="#FFF" />
              </View>
            </View>
            <HealthBadge status={t('good_health')} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity */}
      <GlassCard>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Image source={{ uri: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/mdk4g3eq_Muscle.png' }} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{t('physical_activity')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          {[
            { val: vitals?.steps || '0', label: t('steps') },
            { val: '0', label: t('kcal') },
            { val: '0', label: t('km') },
          ].map((s, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderColor: 'rgba(0,0,0,0.08)' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#000' }}>{s.val}</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('daily_goal')} | <Text style={{ color: '#E53935' }}>500 KCAL</Text></Text>
            <View style={{ height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, marginTop: 6, overflow: 'hidden' }}>
              <View style={{ height: 24, backgroundColor: '#4CAF50', borderRadius: 12, width: '40%', justifyContent: 'center', paddingLeft: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>0 KCAL</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('daily_goal')} | <Text style={{ color: '#E53935' }}>2000 {t('steps').toUpperCase()}</Text></Text>
            <View style={{ height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, marginTop: 6, overflow: 'hidden' }}>
              <View style={{ height: 24, backgroundColor: '#4CAF50', borderRadius: 12, width: `${Math.min(100, ((vitals?.steps || 0) / 2000) * 100)}%`, justifyContent: 'center', paddingLeft: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>{vitals?.steps || 0} {t('steps').toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Reminders */}
      <View style={{ marginBottom: 16 }}>
        {[
          { key: 'hydration', title: t('hydration'), img: REMINDER_IMAGES.hydration, count: activeReminders.filter((r: any) => r.reminder_type === 'hydration').length },
          { key: 'medication', title: t('treatments'), img: REMINDER_IMAGES.medication, count: activeReminders.filter((r: any) => r.reminder_type === 'medication').length },
          { key: 'alarm', title: t('alarms'), img: REMINDER_IMAGES.alarm, count: activeReminders.filter((r: any) => r.reminder_type !== 'hydration' && r.reminder_type !== 'medication').length },
        ].map(cat => (
          <TouchableOpacity key={cat.key} onPress={() => router.push('/reminders')} activeOpacity={0.7}>
            <GlassCard style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>{cat.title}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{cat.count} rappel{cat.count !== 1 ? 's' : ''} par jour</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#000', marginTop: 8 }}>{t('time_remaining')} | --:--</Text>
              </View>
              <Image source={{ uri: cat.img }} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>

      <BlackButton label={t('manage_reminders')} icon="time-outline" onPress={() => router.push('/reminders')} testID="go-reminders" />

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        {[
          { icon: 'pulse-outline', label: 'ECG', route: '/ecg' },
          { icon: 'locate-outline', label: 'Zones', route: '/geofencing' },
          { icon: 'qr-code-outline', label: 'QR', route: '/link-code' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glassStyle }} onPress={() => router.push(a.route as any)}>
            <Ionicons name={a.icon as any} size={22} color="#000" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#000', marginTop: 4 }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Recommendation */}
      {rec ? (
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="sparkles" size={16} color="#000" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#000' }}>Recommandation IA</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#555', lineHeight: 18 }} numberOfLines={4}>{rec}</Text>
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

/* ───── GUARDIAN DASHBOARD (REDESIGNED) ───── */
function GuardianHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const [bens, setBens] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [pendingInterventions, setPendingInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a, inv, piv] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/guardian/invitations', {}, token).catch(() => []),
        apiFetch('/api/interventions/pending', {}, token).catch(() => []),
      ]);
      setBens(Array.isArray(b) ? b : []);
      setAlerts(Array.isArray(a) ? a : []);
      setInvitations(Array.isArray(inv) ? inv : []);
      setPendingInterventions(Array.isArray(piv) ? piv : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
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
      } else {
        router.push('/activate-beneficiary' as any);
      }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSwitching(false); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;

  const roleName = user.is_prescriber ? 'PRESCRIPTEUR' : user.guardian_type === 'professional' ? (user.profession?.toUpperCase() || 'PROFESSIONNEL') : t('guardian').toUpperCase();
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F0EB' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
        <TouchableOpacity testID="guardian-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToBeneficiary}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD54F', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
            {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 20, fontWeight: '800', color: '#000' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#000' }}>{user.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: '#FFD54F', width: 6, height: 6, borderRadius: 3 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.5 }}>{roleName}</Text>
              {(user.has_beneficiary_space || user.role === 'beneficiary') && <Text style={{ fontSize: 10, color: '#AAA' }}> | {t('beneficiary')}</Text>}
            </View>
          </View>
        </TouchableOpacity>
        <LanguageFlagButton />
        <TouchableOpacity testID="guardian-notification-bell" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginLeft: 8, ...glassStyle }}>
          <Ionicons name="notifications-outline" size={18} color="#000" />
          {(invitations.length > 0 || pendingInterventions.length > 0) && <View style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935', borderWidth: 2, borderColor: '#F5F0EB' }} />}
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <GlassCard style={{ padding: 24, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', lineHeight: 28 }}>
          {t('hello')} {user.name?.split(' ')[0]},
        </Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4 }}>
          {bens.length > 0 ? `Vos ${bens.length} beneficiaire${bens.length > 1 ? 's' : ''} ${bens.length > 1 ? 'sont' : 'est'} en bonne sante` : 'Aucun beneficiaire pour le moment'}
        </Text>
      </GlassCard>

      {/* Stats overview */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        {[
          { val: bens.length, label: 'Beneficiaires', color: '#4FC3F7' },
          { val: activeAlerts.length, label: 'Alertes', color: activeAlerts.length > 0 ? '#E53935' : '#4CAF50' },
          { val: pendingInterventions.length, label: 'Interventions', color: '#FF9800' },
        ].map((s, i) => (
          <GlassCard key={i} style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: s.color }}>{s.val}</Text>
            <Text style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Pending Interventions */}
      {pendingInterventions.length > 0 && pendingInterventions.map((piv: any) => (
        <TouchableOpacity key={piv.id} testID={`intervention-${piv.id}`} onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: piv.id } })}>
          <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#E53935', backgroundColor: 'rgba(255,205,210,0.4)' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#E53935', textTransform: 'uppercase', letterSpacing: 1 }}>{t('intervention_required')}</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', marginTop: 4 }}>{piv.alert_message || piv.notes || 'Alerte'}</Text>
            <Text style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{piv.beneficiary_name} {piv.distance_km ? `- ${piv.distance_km}km` : ''}</Text>
            {piv.status === 'pending_acceptance' && (
              <View style={{ backgroundColor: '#4CAF50', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>{t('i_intervene')}</Text>
              </View>
            )}
            {piv.status === 'in_progress' && piv.assigned_to === user.id && (
              <View style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' }}>VOIR L'INTERVENTION</Text>
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>
      ))}

      {/* Pending Invitations */}
      {invitations.length > 0 && invitations.map((inv: any) => (
        <GlassCard key={inv.id} style={{ borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF9800', textTransform: 'uppercase', letterSpacing: 1 }}>INVITATION</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#000', marginTop: 4 }}>{inv.beneficiary_name} vous invite</Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Souhaite que vous deveniez son gardien</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity testID={`accept-inv-${inv.id}`} style={{ flex: 1, backgroundColor: '#4CAF50', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', 'Vous etes maintenant gardien.'); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: '#888', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>{t('reject')}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}

      {/* Beneficiary Cards */}
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
        Mes beneficiaires
      </Text>
      {bens.map((b: any) => (
        <TouchableOpacity key={b.id} testID={`beneficiary-card-${b.id}`} onPress={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })}>
          <GlassCard style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#000' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#000', textTransform: 'uppercase' }}>{b.name}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate || '--'} bpm | SpO2 ${b.latest_vitals.spo2 || '--'}%` : 'Pas de donnees'}</Text>
                {b.active_alerts > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="warning" size={12} color="#E53935" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#E53935' }}>{b.active_alerts} alerte{b.active_alerts > 1 ? 's' : ''} active{b.active_alerts > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </View>
            <HealthBadge status={b.active_alerts > 0 ? t('attention') : t('good_health')} />
          </GlassCard>
        </TouchableOpacity>
      ))}

      {bens.length === 0 && (
        <GlassCard style={{ alignItems: 'center', padding: 32 }}>
          <Ionicons name="people-outline" size={40} color="#888" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#000', marginTop: 12 }}>Aucun beneficiaire lie</Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' }}>Ajoutez un beneficiaire pour commencer a veiller sur lui</Text>
        </GlassCard>
      )}

      <BlackButton label={t('add_beneficiary')} icon="heart-outline" onPress={() => router.push('/link-code')} testID="add-beneficiary-btn" />

      {/* Prescriber Section */}
      {user.is_prescriber && (
        <GlassCard style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="document-text" size={20} color="#000" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>Prescriptions</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#888' }}>{user.prescriber_structure || 'Structure'}</Text>
          <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 12 }} onPress={() => router.push({ pathname: '/(tabs)/devices' })}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' }}>VOIR MES PRESCRIPTIONS</Text>
          </TouchableOpacity>
        </GlassCard>
      )}
    </ScrollView>
  );
}

/* ───── TELEASSISTANCE ───── */
function TeleassistanceHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors } = useTheme();
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

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const iv = setInterval(fetchData, 5000); return () => clearInterval(iv); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F0EB' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Plateau d'ecoute</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>{user.name}</Text>
        </View>
        <LanguageFlagButton />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {[
          { val: active.length, label: 'Alertes', danger: active.length > 0 },
          { val: activeEscalations.length, label: 'Escalades' },
          { val: subs.length, label: 'Abonnes' },
        ].map((s, i) => (
          <GlassCard key={i} style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: s.danger ? '#E53935' : '#000' }}>{s.val}</Text>
            <Text style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</Text>
          </GlassCard>
        ))}
      </View>
      {active.length > 0 && <>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', marginBottom: 10 }}>Alertes en attente</Text>
        {active.slice(0, 3).map((a: any) => (
          <TouchableOpacity key={a.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <GlassCard style={{ borderLeftWidth: 3, borderLeftColor: a.severity === 'critical' ? '#E53935' : '#000' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#000' }}>{a.message}</Text>
              <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{a.beneficiary_name} - {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </>}
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', marginBottom: 10, marginTop: 8 }}>Abonnes</Text>
      {subs.slice(0, 10).map((su: any) => (
        <TouchableOpacity key={su.id} onPress={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })}>
          <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 6 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>{su.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#000' }}>{su.name}</Text>
              <Text style={{ fontSize: 11, color: '#888' }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </GlassCard>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ───── ADMIN ───── */
function AdminHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setStats(await apiFetch('/api/backoffice/stats', {}, token)); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F0EB' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Administration</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>{user.name}</Text>
        </View>
        <LanguageFlagButton />
      </View>
      {stats && <>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          {[
            { val: stats.total_users, label: 'Utilisateurs' },
            { val: stats.active_alerts, label: 'Alertes', danger: stats.active_alerts > 0 },
            { val: stats.prescriptions, label: 'Prescriptions' },
          ].map((s, i) => (
            <GlassCard key={i} style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: s.danger ? '#E53935' : '#000' }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Beneficiaires', v: stats.beneficiaries },
            { l: 'Gardiens', v: stats.guardians },
            { l: 'Prescripteurs', v: stats.prescribers },
            { l: 'Codes actifs', v: stats.activation_codes },
            { l: 'Interventions', v: stats.interventions },
            { l: 'Abonnements', v: stats.subscribed_prescriptions },
          ].map(x => (
            <GlassCard key={x.l} style={{ width: '31%', alignItems: 'center', padding: 12, marginBottom: 0 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#000' }}>{x.v}</Text>
              <Text style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 4, textAlign: 'center' }}>{x.l}</Text>
            </GlassCard>
          ))}
        </View>
      </>}
      <BlackButton label="OUVRIR LE BACK OFFICE" icon="settings-outline" onPress={() => router.push('/backoffice')} testID="open-backoffice" />
    </ScrollView>
  );
}

/* ───── MAIN ───── */
export default function Dashboard() {
  const { user, token } = useAuth();
  if (!user || !token) return null;

  const effectiveRole = user.active_role || user.role;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }} testID="dashboard-screen">
      {effectiveRole === 'guardian' ? <GuardianHome token={token} user={user} />
      : effectiveRole === 'teleassistance' ? <TeleassistanceHome token={token} user={user} />
      : effectiveRole === 'admin' ? <AdminHome token={token} user={user} />
      : <BeneficiaryHome token={token} user={user} />}
    </View>
  );
}
