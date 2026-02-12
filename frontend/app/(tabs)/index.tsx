import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';

/* ===== Animated Vital Card ===== */
function VitalCard({ icon, label, value, unit, color, onPress, colors, testID }: any) {
  return (
    <TouchableOpacity testID={testID} style={[st.vCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[st.vIconWrap, { backgroundColor: (color || colors.primary) + '15' }]}>
        <Ionicons name={icon} size={18} color={color || colors.primary} />
      </View>
      <Text style={[st.vLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[st.vVal, { color: colors.textPrimary }]}>{value || '--'}</Text>
      <Text style={[st.vUnit, { color: colors.textMuted }]}>{unit}</Text>
    </TouchableOpacity>
  );
}

/* ===== Device Status Card ===== */
function DeviceCard({ icon, title, connected, battery, extra, onPress, colors, testID }: any) {
  return (
    <TouchableOpacity testID={testID} style={[st.devCard, { backgroundColor: colors.surface, borderColor: connected ? colors.primary + '40' : colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[st.devIcon, { backgroundColor: connected ? colors.primaryGlow : colors.surfaceHighlight }]}>
        <Ionicons name={icon} size={22} color={connected ? colors.primary : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.devTitle, { color: colors.textPrimary }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <View style={[st.devDot, { backgroundColor: connected ? colors.success : colors.textMuted }]} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: connected ? colors.success : colors.textMuted }}>{connected ? 'Connecte' : 'Deconnecte'}</Text>
        </View>
      </View>
      {battery > 0 && (
        <View style={{ alignItems: 'center', marginRight: 8 }}>
          <Ionicons name={battery > 50 ? 'battery-full' : battery > 20 ? 'battery-half' : 'battery-dead'} size={20} color={battery > 20 ? colors.success : colors.danger} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textPrimary }}>{battery}%</Text>
        </View>
      )}
      {extra}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

/* ───── BENEFICIARY ───── */
function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [vitals, setVitals] = useState<any>(null);
  const [rec, setRec] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [vestData, setVestData] = useState<any>(null);
  const [braceletData, setBraceletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const sosPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [r, rc, rem, vest, brac] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/ai/recommendations/latest', {}, token).catch(() => ({ recommendation: '' })),
        apiFetch('/api/reminders', {}, token).catch(() => []),
        apiFetch('/api/vest/status', {}, token).catch(() => null),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
      ]);
      if (brac && (brac.heart_rate > 0 || brac.steps > 0)) {
        setVitals({ heart_rate: brac.heart_rate || 0, spo2: brac.spo2 || 0, blood_pressure_systolic: brac.systolic || 0, blood_pressure_diastolic: brac.diastolic || 0, temperature: brac.temperature || 0, steps: brac.steps || 0 });
      }
      if (rc.recommendation) setRec(rc.recommendation);
      setReminders(rem);
      setVestData(vest);
      setBraceletData(brac);
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={[st.greeting, { color: colors.textMuted }]}>Bonjour,</Text>
          <Text style={[st.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        </View>
        <View style={[st.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[st.dot, { backgroundColor: colors.success }]} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>En ligne</Text>
        </View>
      </View>

      {/* SOS Button */}
      <Animated.View style={{ transform: [{ scale: sosPulse }] }}>
        <TouchableOpacity testID="sos-button" style={[st.sosBtn, { backgroundColor: colors.danger }]} onPress={handleSOS} disabled={sosLoading} activeOpacity={0.8}>
          {sosLoading ? <ActivityIndicator color="#FFF" size="large" /> : (
            <>
              <View style={st.sosIconRing}>
                <Ionicons name="alert-circle" size={36} color="#FFF" />
              </View>
              <Text style={st.sosText}>SOS</Text>
              <Text style={st.sosSub}>Appuyez en cas d'urgence</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Device Cards */}
      <DeviceCard testID="vest-status-card" icon={vestData?.battery > 0 ? 'shield-checkmark' : 'shield-outline'} title="Gilet Anti-Chute" connected={vestData?.connected} battery={vestData?.battery || 0} onPress={() => router.push('/vest-connect')} colors={colors} />
      <DeviceCard testID="bracelet-status-card" icon={braceletData?.paired ? 'watch' : 'watch-outline'} title="Bracelet Elio" connected={braceletData?.connected} battery={braceletData?.battery || 0} onPress={() => router.push('/bracelet-connect')} colors={colors}
        extra={braceletData?.heart_rate > 0 ? <View style={{ alignItems: 'center', marginRight: 8 }}><Ionicons name="heart" size={14} color="#EF4444" /><Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>{braceletData.heart_rate}</Text></View> : null} />

      {/* Vitals */}
      <View style={st.secRow}>
        <Text style={[st.secTitle, { color: colors.textPrimary }]}>Constantes cles</Text>
        <TouchableOpacity testID="see-all-health" onPress={() => router.push('/(tabs)/health')}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {vitals ? (
        <View style={st.vitalsGrid}>
          <VitalCard testID="vital-heart_rate" icon="heart" label="Pouls" value={vitals.heart_rate} unit="bpm" color="#EF4444" onPress={() => router.push({ pathname: '/health-detail', params: { metricId: 'heart_rate' } })} colors={colors} />
          <VitalCard testID="vital-spo2" icon="water" label="SpO2" value={vitals.spo2} unit="%" color="#3B82F6" onPress={() => router.push({ pathname: '/health-detail', params: { metricId: 'spo2' } })} colors={colors} />
          <VitalCard testID="vital-blood_pressure_systolic" icon="pulse" label="Tension" value={`${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`} unit="mmHg" color="#8B5CF6" onPress={() => router.push({ pathname: '/health-detail', params: { metricId: 'blood_pressure_systolic' } })} colors={colors} />
          <VitalCard testID="vital-temperature" icon="thermometer" label="Temp." value={vitals.temperature} unit="C" color="#F59E0B" onPress={() => router.push({ pathname: '/health-detail', params: { metricId: 'temperature' } })} colors={colors} />
          <VitalCard testID="vital-steps" icon="footsteps" label="Pas" value={vitals.steps} unit="pas" color="#10B981" onPress={() => router.push({ pathname: '/health-detail', params: { metricId: 'steps' } })} colors={colors} />
        </View>
      ) : (
        <View style={[st.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="bluetooth-off" size={32} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, fontWeight: '600' }}>Synchronisez vos appareils</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Connectez votre bracelet pour voir vos donnees</Text>
        </View>
      )}

      {/* AI Recommendation */}
      {rec ? (
        <View style={[st.aiCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={[st.aiIconWrap, { backgroundColor: colors.primaryGlow }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Recommandation IA</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }} numberOfLines={4}>{rec}</Text>
        </View>
      ) : null}

      {/* Reminders */}
      <View style={st.secRow}>
        <Text style={[st.secTitle, { color: colors.textPrimary }]}>Rappels du jour</Text>
        <TouchableOpacity testID="go-reminders" onPress={() => router.push('/reminders')}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Gerer</Text>
        </TouchableOpacity>
      </View>
      {reminders.length > 0 ? (
        <View style={st.remGrid}>
          {reminders.filter((r: any) => r.active).slice(0, 4).map((r: any) => {
            const today = new Date().toISOString().split('T')[0];
            const done = r.completions?.includes(today);
            const typeColor = r.reminder_type === 'hydration' ? '#3B82F6' : r.reminder_type === 'medication' ? '#EF4444' : '#F59E0B';
            return (
              <View key={r.id} style={[st.remCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: done ? 0.5 : 1 }]}>
                <View style={[st.remDot, { backgroundColor: typeColor }]} />
                <Text style={[st.remTitle, { color: colors.textPrimary }, done && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{r.title}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{r.time}{r.dosage ? ` - ${r.dosage}` : ''}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity style={[st.addRemBtn, { borderColor: colors.border }]} onPress={() => router.push('/reminders')}>
          <Ionicons name="alarm-outline" size={18} color={colors.textMuted} />
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Configurer vos rappels quotidiens</Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <Text style={[st.secTitle, { color: colors.textPrimary, marginTop: 4 }]}>Actions rapides</Text>
      <View style={st.quickGrid}>
        {[
          { icon: 'pulse-outline', label: 'ECG', route: '/ecg' },
          { icon: 'moon-outline', label: 'Sommeil', route: '/sleep' },
          { icon: 'locate-outline', label: 'Zones securite', route: '/geofencing' },
          { icon: 'card-outline', label: 'Abonnement', route: '/subscription' },
          { icon: 'shield-checkmark-outline', label: 'Partage', route: '/data-sharing' },
          { icon: 'qr-code-outline', label: 'Code QR', route: '/link-code' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={[st.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(a.route as any)} activeOpacity={0.7}>
            <Ionicons name={a.icon as any} size={20} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginTop: 6 }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={st.header}>
        <View>
          <Text style={[st.greeting, { color: colors.textMuted }]}>Bonjour,</Text>
          <Text style={[st.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        </View>
        <View style={[st.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{user.is_prescriber ? 'Prescripteur' : 'Gardien'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={st.statsRow}>
        <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[st.statVal, { color: colors.textPrimary }]}>{bens.length}</Text>
          <Text style={[st.statLabel, { color: colors.textMuted }]}>Beneficiaires</Text>
        </View>
        <View style={[st.statCard, { backgroundColor: active.length > 0 ? colors.dangerGlow : colors.surface, borderColor: active.length > 0 ? colors.danger + '40' : colors.border }]}>
          <Text style={[st.statVal, { color: active.length > 0 ? colors.danger : colors.textPrimary }]}>{active.length}</Text>
          <Text style={[st.statLabel, { color: colors.textMuted }]}>Alertes</Text>
        </View>
      </View>

      <TouchableOpacity style={[st.addBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primaryGlow }]} onPress={() => router.push('/link-code')}>
        <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>Ajouter un beneficiaire</Text>
      </TouchableOpacity>

      <Text style={[st.secTitle, { color: colors.textPrimary }]}>Beneficiaires</Text>
      {bens.length > 0 ? bens.map((b: any) => (
        <TouchableOpacity key={b.id} style={[st.benCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })}>
          <View style={[st.benAvatar, { backgroundColor: colors.primary }]}><Text style={st.benAvatarT}>{b.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={[st.benName, { color: colors.textPrimary }]}>{b.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate} bpm - ${b.latest_vitals.temperature}C` : 'Pas de donnees'}</Text>
          </View>
          {b.active_alerts > 0 && <View style={[st.alertBadge, { backgroundColor: colors.danger }]}><Text style={st.alertBadgeT}>{b.active_alerts}</Text></View>}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )) : (
        <View style={[st.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={32} color={colors.textMuted} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, fontWeight: '600' }}>Aucun beneficiaire lie</Text>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.push('/link-code')}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Ajouter via code / QR</Text>
          </TouchableOpacity>
        </View>
      )}

      {active.length > 0 && <>
        <Text style={[st.secTitle, { color: colors.textPrimary, marginTop: 16 }]}>Alertes recentes</Text>
        {active.slice(0, 3).map((a: any) => (
          <View key={a.id} style={[st.alertRow, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: a.severity === 'critical' ? colors.danger : colors.border }]}>
            <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={18} color={a.severity === 'critical' ? colors.danger : colors.textMuted} />
            <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{a.message}</Text><Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{a.beneficiary_name}</Text></View>
          </View>
        ))}
      </>}
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={st.header}>
        <View>
          <Text style={[st.greeting, { color: colors.textMuted }]}>Plateau d'ecoute</Text>
          <Text style={[st.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        </View>
        <View style={[st.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="headset" size={12} color={colors.primary} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>Teleassistance</Text>
        </View>
      </View>

      <View style={st.statsRow}>
        <View style={[st.statCard, { backgroundColor: active.length > 0 ? colors.dangerGlow : colors.surface, borderColor: active.length > 0 ? colors.danger + '40' : colors.border }]}>
          <Text style={[st.statVal, { color: active.length > 0 ? colors.danger : colors.textPrimary }]}>{active.length}</Text>
          <Text style={[st.statLabel, { color: colors.textMuted }]}>Alertes</Text>
        </View>
        <View style={[st.statCard, { backgroundColor: activeEscalations.length > 0 ? colors.primaryGlow : colors.surface, borderColor: activeEscalations.length > 0 ? colors.primary + '40' : colors.border }]}>
          <Text style={[st.statVal, { color: activeEscalations.length > 0 ? colors.primary : colors.textPrimary }]}>{activeEscalations.length}</Text>
          <Text style={[st.statLabel, { color: colors.textMuted }]}>Escalades</Text>
        </View>
        <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[st.statVal, { color: colors.textPrimary }]}>{subs.length}</Text>
          <Text style={[st.statLabel, { color: colors.textMuted }]}>Abonnes</Text>
        </View>
      </View>

      {activeEscalations.length > 0 && <>
        <Text style={[st.secTitle, { color: colors.textPrimary }]}>Protocoles IA en cours</Text>
        {activeEscalations.map((esc: any) => (
          <TouchableOpacity key={esc.id} style={[st.escCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30', borderLeftColor: esc.status === 'dispatched' ? colors.danger : colors.primary }]} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: esc.alert_id } })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={[st.escPulse, { backgroundColor: esc.status === 'dispatched' ? colors.danger : colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{esc.beneficiary_name}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                  {esc.current_step === 'calling_beneficiary' ? 'Appel beneficiaire...' :
                   esc.current_step === 'doubt_lifting' ? 'Levee de doute...' :
                   esc.current_step === 'calling_guardian' ? `Appel gardien ${esc.current_target?.name}...` :
                   esc.current_step === 'dispatched' ? 'Intervention dispatchee' :
                   esc.current_step === 'guardian_handling' ? 'Gardien prend en charge' : esc.current_step}
                </Text>
              </View>
              {esc.calls?.length > 0 && <View style={[st.callCountBadge, { backgroundColor: colors.surfaceHighlight }]}><Text style={{ fontSize: 10, color: colors.textMuted }}>{esc.calls.length} appels</Text></View>}
            </View>
            {esc.timeline?.slice(-2).map((t: any, i: number) => (
              <Text key={i} style={{ fontSize: 11, color: colors.textMuted, marginLeft: 18, lineHeight: 16 }}>  {t.note}</Text>
            ))}
          </TouchableOpacity>
        ))}
      </>}

      {active.length > 0 && <>
        <Text style={[st.secTitle, { color: colors.textPrimary }]}>Alertes en attente</Text>
        {active.slice(0, 5).map((a: any) => (
          <TouchableOpacity key={a.id} style={[st.alertRow, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: a.severity === 'critical' ? colors.danger : colors.border }]} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={18} color={a.severity === 'critical' ? colors.danger : colors.textMuted} />
            <View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{a.message}</Text><Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{a.beneficiary_name} - {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text></View>
            <View style={[st.sevBadge, { backgroundColor: a.severity === 'critical' ? colors.dangerGlow : colors.surfaceHighlight }]}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: a.severity === 'critical' ? colors.danger : colors.textMuted, textTransform: 'uppercase' }}>{a.severity}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </>}

      <Text style={[st.secTitle, { color: colors.textPrimary, marginTop: 16 }]}>Abonnes</Text>
      {subs.slice(0, 10).map((su: any) => (
        <TouchableOpacity key={su.id} style={[st.benCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })}>
          <View style={[st.benAvatar, { backgroundColor: colors.primary }]}><Text style={st.benAvatarT}>{su.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}><Text style={[st.benName, { color: colors.textPrimary }]}>{su.name}</Text><Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text></View>
          {su.active_alerts > 0 && <View style={[st.alertBadge, { backgroundColor: colors.danger }]}><Text style={st.alertBadgeT}>{su.active_alerts}</Text></View>}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={st.header}>
        <View>
          <Text style={[st.greeting, { color: colors.textMuted }]}>Administration</Text>
          <Text style={[st.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        </View>
        <View style={[st.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="settings" size={12} color={colors.primary} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>Admin</Text>
        </View>
      </View>

      {stats && <>
        <View style={st.statsRow}>
          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.statVal, { color: colors.textPrimary }]}>{stats.total_users}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Utilisateurs</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: stats.active_alerts > 0 ? colors.dangerGlow : colors.surface, borderColor: stats.active_alerts > 0 ? colors.danger + '40' : colors.border }]}>
            <Text style={[st.statVal, { color: stats.active_alerts > 0 ? colors.danger : colors.textPrimary }]}>{stats.active_alerts}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Alertes</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.statVal, { color: colors.textPrimary }]}>{stats.prescriptions}</Text>
            <Text style={[st.statLabel, { color: colors.textMuted }]}>Prescriptions</Text>
          </View>
        </View>

        <View style={st.vitalsGrid}>
          {[
            { l: 'Beneficiaires', v: stats.beneficiaries },
            { l: 'Gardiens', v: stats.guardians },
            { l: 'Prescripteurs', v: stats.prescribers },
            { l: 'Codes actifs', v: stats.activation_codes },
            { l: 'Interventions', v: stats.interventions },
            { l: 'Abonnements', v: stats.subscribed_prescriptions },
          ].map(x => (
            <View key={x.l} style={[st.miniStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary }}>{x.v}</Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>{x.l}</Text>
            </View>
          ))}
        </View>
      </>}

      <TouchableOpacity style={[st.boBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push('/backoffice')}>
        <Ionicons name="settings-outline" size={20} color={colors.primary} />
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Ouvrir le Back Office complet</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
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

const st = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 },
  greeting: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '500' },
  userName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, borderWidth: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  sosBtn: { borderRadius: 20, paddingVertical: 28, alignItems: 'center', marginBottom: 16 },
  sosIconRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  sosText: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 4, marginTop: 8 },
  sosSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },

  devCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, gap: 12 },
  devIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  devTitle: { fontSize: 15, fontWeight: '700' },
  devDot: { width: 6, height: 6, borderRadius: 3 },

  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  secTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 12 },

  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  vCard: { width: '31%', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, gap: 2 },
  vIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  vLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  vVal: { fontSize: 22, fontWeight: '800' },
  vUnit: { fontSize: 10 },

  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 16, borderWidth: 1 },

  aiCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  aiIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  remGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  remCard: { width: '48%', borderRadius: 12, padding: 12, gap: 4, borderWidth: 1 },
  remDot: { width: 8, height: 8, borderRadius: 4 },
  remTitle: { fontSize: 13, fontWeight: '600' },

  addRemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickBtn: { width: '31%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1 },
  statVal: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 16 },

  benCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1 },
  benAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  benAvatarT: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  benName: { fontSize: 15, fontWeight: '600' },

  alertBadge: { borderRadius: 10, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  alertBadgeT: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  alertRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, gap: 10, borderWidth: 1, borderLeftWidth: 3 },

  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  escCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderLeftWidth: 3 },
  escPulse: { width: 10, height: 10, borderRadius: 5 },
  callCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  miniStat: { width: '31%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },

  boBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 18, marginTop: 12, borderWidth: 1 },
});
