import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';

const HEALTH_IMAGES = {
  heart: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/u3ch46l8_hearth%20red%20app%20healthbeat%20Chutex.png',
  blood: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  sleep: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tide9bdl_Moon%20sleep%20analys%20app%20health%20Chutex.png',
  physical: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
};

const GlassCard = ({ children, style, colors }: any) => (
  <View style={[{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder, padding: 16, marginBottom: 12, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}) }, style]}>{children}</View>
);

const HealthBadge = ({ status }: { status: string }) => (
  <View style={{ backgroundColor: '#C8E6C9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: 0.5 }}>{status}</Text>
  </View>
);

const BlackButton = ({ label, icon, onPress, testID }: any) => (
  <TouchableOpacity testID={testID} style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }} onPress={onPress}>
    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    {icon && <Ionicons name={icon} size={18} color="#FFF" />}
  </TouchableOpacity>
);

/* ───── BENEFICIARY ───── */
function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [vitals, setVitals] = useState<any>(null);
  const [rec, setRec] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [vestData, setVestData] = useState<any>(null);
  const [braceletData, setBraceletData] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const sosPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [r, rc, rem, vest, brac, guards] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/ai/recommendations/latest', {}, token).catch(() => ({ recommendation: '' })),
        apiFetch('/api/reminders', {}, token).catch(() => []),
        apiFetch('/api/vest/status', {}, token).catch(() => null),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
        apiFetch('/api/guardians/my', {}, token).catch(() => []),
      ]);
      if (brac && (brac.heart_rate > 0 || brac.steps > 0)) {
        setVitals({ heart_rate: brac.heart_rate || 0, spo2: brac.spo2 || 0, blood_pressure_systolic: brac.systolic || 0, blood_pressure_diastolic: brac.diastolic || 0, temperature: brac.temperature || 0, steps: brac.steps || 0 });
      }
      if (rc.recommendation) setRec(rc.recommendation);
      setReminders(rem);
      setVestData(vest);
      setBraceletData(brac);
      setGuardians(Array.isArray(guards) ? guards : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS - Aide requise immediatement!', device_type: 'bracelet' }) }, token);
      Alert.alert('SOS Envoye', 'Vos gardiens et la teleassistance ont ete alertes.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSosLoading(false); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color="#000" /></View>;

  const activeReminders = reminders.filter((r: any) => r.active);
  const hydroReminder = activeReminders.find((r: any) => r.reminder_type === 'hydration');
  const medReminder = activeReminders.find((r: any) => r.reminder_type === 'medication');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#000' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>{user.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600', letterSpacing: 1 }}>CHUTEX</Text>
        </View>
        <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginRight: 8 }}>
          <Ionicons name="headset-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Devices Status */}
      <GlassCard colors={colors} style={{ padding: 14 }}>
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
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {guardians.slice(0, 4).map((g: any, i: number) => (
              <View key={g.id || i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ['#FFB74D', '#4FC3F7', '#AED581', '#FF8A65'][i % 4], justifyContent: 'center', alignItems: 'center', marginLeft: i > 0 ? -6 : 0, borderWidth: 2, borderColor: '#FFF' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>{g.name?.charAt(0)}</Text>
              </View>
            ))}
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary, marginLeft: 8, textTransform: 'uppercase' }}>{guardians.length} GARDIEN{guardians.length > 1 ? 'S' : ''} CONNECTE{guardians.length > 1 ? 'S' : ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/vest-connect')}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Ionicons name="shield-outline" size={22} color="#000" />
            {vestData?.connected && <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' }} />}
          </View>
          {vestData?.battery > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="battery-dead" size={16} color="#E53935" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#E53935', marginLeft: 2 }}>{vestData.battery}%</Text>
            </View>
          )}
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600', flex: 1 }}>Gilet Anti-Chute</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </GlassCard>

      {/* SOS Button */}
      <Animated.View style={{ transform: [{ scale: sosPulse }], marginBottom: 16 }}>
        <TouchableOpacity testID="sos-button" style={{ backgroundColor: '#E53935', borderRadius: 20, paddingVertical: 20, alignItems: 'center' }} onPress={handleSOS} disabled={sosLoading} activeOpacity={0.8}>
          {sosLoading ? <ActivityIndicator color="#FFF" size="large" /> : (
            <>
              <Ionicons name="alert-circle" size={32} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 4 }}>SOS</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>Appuyez en cas d'urgence</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Health Categories Grid - 2x2 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'heart', title: 'Sante cardiaque', img: HEALTH_IMAGES.heart, route: '/health-detail', params: { metricId: 'heart_rate' } },
          { key: 'blood', title: 'Sante du sang', img: HEALTH_IMAGES.blood, route: '/health-detail', params: { metricId: 'spo2' } },
          { key: 'sleep', title: 'Sante du sommeil', img: HEALTH_IMAGES.sleep, route: '/sleep' },
          { key: 'physical', title: 'Sante physique', img: HEALTH_IMAGES.physical, route: '/health-detail', params: { metricId: 'temperature' } },
        ].map(cat => (
          <TouchableOpacity key={cat.key} testID={`health-cat-${cat.key}`} style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : {}) }} onPress={() => router.push(cat.params ? { pathname: cat.route as any, params: cat.params } : cat.route as any)}>
            <View style={{ height: 110, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,235,238,0.3)' }}>
              <Image source={{ uri: cat.img }} style={{ width: 90, height: 90, resizeMode: 'contain' }} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>{cat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Vitals */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          { id: 'spo2', label: 'SpO2 du sang', val: vitals?.spo2 || '--', unit: '%', icon: 'water-outline' },
          { id: 'heart_rate', label: 'Pouls', val: vitals?.heart_rate || '--', unit: 'bpm', icon: 'heart-outline' },
          { id: 'sleep', label: 'Sommeil', val: '--', unit: '', icon: 'moon-outline' },
          { id: 'temperature', label: 'Temperature', val: vitals?.temperature || '--', unit: '', icon: 'thermometer-outline' },
        ].map(v => (
          <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, padding: 14, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } : {}) }}
            onPress={() => router.push({ pathname: '/health-detail', params: { metricId: v.id } })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{v.label}</Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2 }}>{v.val}{v.unit ? ` ${v.unit}` : ''}</Text>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={v.icon as any} size={14} color="#FFF" />
              </View>
            </View>
            <HealthBadge status="BONNE SANTE" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity */}
      <GlassCard colors={colors}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Activite physique</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          {[
            { val: vitals?.steps || '0', label: 'Pas' },
            { val: '0', label: 'kcal' },
            { val: '0', label: 'km' },
          ].map((s, i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1, borderRightWidth: i < 2 ? 1 : 0, borderColor: colors.border }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}>{s.val}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Objectives */}
        <View style={{ backgroundColor: colors.surfaceGlass, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>OBJECTIF JOURNALIER | <Text style={{ color: '#E53935' }}>500 KCAL</Text></Text>
          <View style={{ height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, marginTop: 6, overflow: 'hidden' }}>
            <View style={{ height: 24, backgroundColor: '#4CAF50', borderRadius: 12, width: '40%', justifyContent: 'center', paddingLeft: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>0 KCAL</Text>
            </View>
          </View>
        </View>
        <View style={{ backgroundColor: colors.surfaceGlass, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 }}>OBJECTIF JOURNALIER | <Text style={{ color: '#E53935' }}>2000 PAS</Text></Text>
          <View style={{ height: 24, backgroundColor: '#E0E0E0', borderRadius: 12, marginTop: 6, overflow: 'hidden' }}>
            <View style={{ height: 24, backgroundColor: '#4CAF50', borderRadius: 12, width: `${Math.min(100, ((vitals?.steps || 0) / 2000) * 100)}%`, justifyContent: 'center', paddingLeft: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>{vitals?.steps || 0} PAS</Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Reminders */}
      <GlassCard colors={colors}>
        {hydroReminder && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>HYDRATATION</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>TEMPS RESTANT | {hydroReminder.time || '00:00'}</Text>
          </View>
        )}
        {medReminder && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>TRAITEMENTS</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>TEMPS RESTANT | {medReminder.time || '00:00'}</Text>
          </View>
        )}
        {!hydroReminder && !medReminder && (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>Configurez vos rappels quotidiens</Text>
        )}
      </GlassCard>

      <BlackButton label="GERER MES RAPPELS" icon="time-outline" onPress={() => router.push('/reminders')} testID="go-reminders" />
      <BlackButton label="VOIR MES GARDIENS" icon="people-outline" onPress={() => router.push('/(tabs)/profile')} testID="go-guardians" />

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        {[
          { icon: 'pulse-outline', label: 'ECG', route: '/ecg' },
          { icon: 'locate-outline', label: 'Zones', route: '/geofencing' },
          { icon: 'qr-code-outline', label: 'QR', route: '/link-code' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder }} onPress={() => router.push(a.route as any)}>
            <Ionicons name={a.icon as any} size={22} color={colors.textPrimary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Recommendation */}
      {rec ? (
        <GlassCard colors={colors}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="sparkles" size={16} color="#000" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>Recommandation IA</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={4}>{rec}</Text>
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

/* ───── GUARDIAN ───── */
function GuardianHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [bens, setBens] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
      ]);
      setBens(b); setAlerts(a);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color="#000" /></View>;

  const roleName = user.is_prescriber ? 'PRESCRIPTEUR' : user.guardian_type === 'professional' ? user.profession?.toUpperCase() || 'PROFESSIONNEL' : 'GARDIEN';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD54F', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#000' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>{user.name}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{roleName}</Text>
        </View>
        <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="headset-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 20, lineHeight: 28 }}>
        Bonjour {user.name?.split(' ')[0]},{'\n'}
        <Text style={{ color: colors.textSecondary }}>vos beneficiaires sont en {bens.length > 0 ? 'excellente' : 'bonne'} sante aujourd'hui !</Text>
      </Text>

      {/* Beneficiary Cards */}
      {bens.map((b: any) => (
        <GlassCard key={b.id} colors={colors} style={{ padding: 20 }}>
          <HealthBadge status="BONNE SANTE" />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 14 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.glassBorder }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#000' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.textPrimary, textTransform: 'uppercase' }}>{b.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text>
            </View>
          </View>
          <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }} onPress={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>INFORMATION</Text>
            <Ionicons name="open-outline" size={16} color="#FFF" />
          </TouchableOpacity>
        </GlassCard>
      ))}

      {bens.length === 0 && (
        <GlassCard colors={colors} style={{ alignItems: 'center', padding: 32 }}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 12 }}>Aucun beneficiaire lie</Text>
        </GlassCard>
      )}

      <BlackButton label="AJOUTER UN BENEFICIAIRE" icon="heart-outline" onPress={() => router.push('/link-code')} testID="add-beneficiary-btn" />
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color="#000" /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Plateau d'ecoute</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>{user.name}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {[
          { val: active.length, label: 'Alertes', danger: active.length > 0 },
          { val: activeEscalations.length, label: 'Escalades' },
          { val: subs.length, label: 'Abonnes' },
        ].map((s, i) => (
          <GlassCard key={i} colors={colors} style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: s.danger ? '#E53935' : colors.textPrimary }}>{s.val}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</Text>
          </GlassCard>
        ))}
      </View>

      {active.length > 0 && <>
        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 10 }}>Alertes en attente</Text>
        {active.slice(0, 3).map((a: any) => (
          <TouchableOpacity key={a.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <GlassCard colors={colors} style={{ borderLeftWidth: 3, borderLeftColor: a.severity === 'critical' ? '#E53935' : '#000' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{a.message}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{a.beneficiary_name} - {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </>}

      <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary, marginBottom: 10, marginTop: 8 }}>Abonnes</Text>
      {subs.slice(0, 10).map((su: any) => (
        <TouchableOpacity key={su.id} onPress={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })}>
          <GlassCard colors={colors} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 6 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>{su.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{su.name}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color="#000" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />} showsVerticalScrollIndicator={false}>
      <View style={{ marginTop: 12, marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Administration</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{user.name}</Text>
      </View>

      {stats && <>
        {/* Main KPIs */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          {[
            { val: stats.total_users, label: 'Utilisateurs' },
            { val: stats.active_alerts, label: 'Alertes', danger: stats.active_alerts > 0 },
            { val: stats.prescriptions, label: 'Prescriptions' },
          ].map((s, i) => (
            <GlassCard key={i} colors={colors} style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: s.danger ? '#E53935' : colors.textPrimary }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Detailed Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Beneficiaires', v: stats.beneficiaries },
            { l: 'Gardiens', v: stats.guardians },
            { l: 'Prescripteurs', v: stats.prescribers },
            { l: 'Codes actifs', v: stats.activation_codes },
            { l: 'Interventions', v: stats.interventions },
            { l: 'Abonnements', v: stats.subscribed_prescriptions },
          ].map(x => (
            <GlassCard key={x.l} colors={colors} style={{ width: '31%', alignItems: 'center', padding: 12, marginBottom: 0 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{x.v}</Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 4, textAlign: 'center' }}>{x.l}</Text>
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
  const { colors } = useTheme();
  if (!user || !token) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} testID="dashboard-screen">
      {user.role === 'guardian' ? <GuardianHome token={token} user={user} />
      : user.role === 'teleassistance' ? <TeleassistanceHome token={token} user={user} />
      : user.role === 'admin' ? <AdminHome token={token} user={user} />
      : <BeneficiaryHome token={token} user={user} />}
    </SafeAreaView>
  );
}
