import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { getKeyMetrics } from '../../src/constants/metrics';

function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [vitals, setVitals] = useState<any>(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [r, rec] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/ai/recommendations/latest', {}, token).catch(() => ({ recommendation: '' })),
      ]);
      if (r.bracelet) setVitals(r.bracelet.data);
      if (rec.recommendation) setRecommendation(rec.recommendation);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS - Aide requise immédiatement!', device_type: 'bracelet' }) }, token);
      Alert.alert('SOS Envoyé', 'Vos gardiens ont été alertés.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSosLoading(false); }
  };

  const keyMetrics = getKeyMetrics();
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={s.sv} contentContainerStyle={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={s.greet}>
        <View><Text style={s.hi}>Bonjour,</Text><Text style={s.name}>{user.name}</Text></View>
        <View style={s.badge}><View style={[s.dot, { backgroundColor: Colors.success }]} /><Text style={s.badgeT}>En ligne</Text></View>
      </View>

      {/* SOS Button */}
      <TouchableOpacity testID="sos-button" style={s.sos} onPress={handleSOS} disabled={sosLoading} activeOpacity={0.8}>
        {sosLoading ? <ActivityIndicator color="#FFF" size="large" /> : (
          <><Ionicons name="alert-circle" size={32} color="#FFF" /><Text style={s.sosT}>SOS</Text><Text style={s.sosSub}>Appuyez en cas d'urgence</Text></>
        )}
      </TouchableOpacity>

      {/* Key Vitals */}
      <View style={s.secRow}><Text style={s.secTitle}>Constantes clés</Text>
        <TouchableOpacity testID="see-all-health" onPress={() => router.push('/(tabs)/health')}><Text style={s.seeAll}>Tout voir</Text></TouchableOpacity>
      </View>
      {vitals ? (
        <View style={s.grid}>
          {[
            { id: 'heart_rate', icon: 'heart', label: 'Pouls', val: vitals.heart_rate, unit: 'bpm', color: '#DC2626' },
            { id: 'spo2', icon: 'water', label: 'SpO2', val: vitals.spo2, unit: '%', color: '#4A7C59' },
            { id: 'blood_pressure_systolic', icon: 'pulse', label: 'Tension', val: `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`, unit: 'mmHg', color: '#7C3AED' },
            { id: 'temperature', icon: 'thermometer', label: 'Temp.', val: vitals.temperature, unit: '°C', color: '#F97316' },
            { id: 'steps', icon: 'footsteps', label: 'Pas', val: vitals.steps, unit: 'pas', color: '#22C55E' },
            { id: 'stress', icon: 'flash', label: 'Stress', val: vitals.stress, unit: '', color: '#F59E0B' },
          ].map(v => (
            <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={[s.vCard, { borderLeftColor: v.color, borderLeftWidth: 3 }]}
              onPress={() => router.push({ pathname: '/health-detail', params: { metricId: v.id } })}>
              <View style={[s.vIconBg, { backgroundColor: v.color + '15' }]}><Ionicons name={v.icon as any} size={18} color={v.color} /></View>
              <Text style={s.vLabel}>{v.label}</Text>
              <View style={s.vRow}><Text style={[s.vVal, { color: v.color }]}>{v.val}</Text><Text style={s.vUnit}>{v.unit}</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={s.empty}><MaterialCommunityIcons name="bluetooth-off" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Synchronisez vos appareils</Text></View>
      )}

      {/* AI Recommendation */}
      {recommendation ? (
        <View style={s.aiCard}>
          <View style={s.aiH}><View style={s.aiIc}><Ionicons name="sparkles" size={18} color={Colors.primary} /></View><Text style={s.aiTitle}>Recommandation IA</Text></View>
          <Text style={s.aiText} numberOfLines={4}>{recommendation}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function GuardianHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
      ]);
      setBeneficiaries(b); setAlerts(a);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={s.sv} contentContainerStyle={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={s.greet}><View><Text style={s.hi}>Bonjour,</Text><Text style={s.name}>{user.name}</Text></View>
        <View style={s.gbadge}><Ionicons name="shield-checkmark" size={14} color={Colors.primary} /><Text style={s.gbadgeT}>Gardien</Text></View></View>

      <View style={s.statsRow}>
        <View style={[s.stat, { backgroundColor: Colors.primary + '10' }]}><Text style={[s.statV, { color: Colors.primary }]}>{beneficiaries.length}</Text><Text style={s.statL}>Bénéficiaires</Text></View>
        <View style={[s.stat, { backgroundColor: active.length > 0 ? Colors.destructive + '10' : Colors.success + '10' }]}>
          <Text style={[s.statV, { color: active.length > 0 ? Colors.destructive : Colors.success }]}>{active.length}</Text><Text style={s.statL}>Alertes actives</Text></View>
      </View>

      <Text style={s.secTitle}>Bénéficiaires</Text>
      {beneficiaries.length > 0 ? beneficiaries.map((b: any) => (
        <View key={b.id} style={s.benCard} testID={`ben-${b.id}`}>
          <View style={s.benAv}><Text style={s.benAvT}>{b.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={s.benInfo}><Text style={s.benName}>{b.name}</Text>
            <Text style={s.benSt}>{b.latest_vitals ? `❤️ ${b.latest_vitals.heart_rate} bpm • 🌡 ${b.latest_vitals.temperature}°C` : 'Pas de données'}</Text></View>
          <View style={s.benR}>{b.active_alerts > 0 && <View style={s.alertBadge}><Text style={s.alertBadgeT}>{b.active_alerts}</Text></View>}
            <View style={[s.dot, { backgroundColor: b.latest_vitals ? Colors.success : Colors.textMuted }]} /></View>
        </View>
      )) : (
        <View style={s.empty}><Ionicons name="people-outline" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Aucun bénéficiaire lié</Text><Text style={s.emptySub}>Allez dans Profil pour en ajouter</Text></View>
      )}

      {active.length > 0 && <>
        <Text style={[s.secTitle, { marginTop: 16 }]}>Alertes récentes</Text>
        {active.slice(0, 3).map((a: any) => (
          <View key={a.id} style={[s.alertC, a.severity === 'critical' && s.alertCrit]}>
            <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={20} color={a.severity === 'critical' ? Colors.destructive : Colors.accent} />
            <View style={s.alertInfo}><Text style={s.alertMsg}>{a.message}</Text><Text style={s.alertMeta}>{a.beneficiary_name}</Text></View>
          </View>
        ))}
      </>}
    </ScrollView>
  );
}

export default function Dashboard() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  return (
    <SafeAreaView style={s.safe} testID="dashboard-screen">
      {user.role === 'guardian' ? <GuardianHome token={token} user={user} /> : <BeneficiaryHome token={token} user={user} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background }, sv: { flex: 1 }, sc: { paddingHorizontal: 18, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greet: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 18 },
  hi: { fontSize: 14, color: Colors.textSecondary }, name: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 }, badgeT: { fontSize: 12, fontWeight: '600', color: Colors.success },
  gbadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 5 },
  gbadgeT: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  sos: { backgroundColor: Colors.destructive, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 18, shadowColor: Colors.destructive, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  sosT: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 2 }, sosSub: { color: '#FFF', fontSize: 12, opacity: 0.8, marginTop: 2 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  vCard: { width: '47%', backgroundColor: Colors.paper, borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  vIconBg: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  vLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  vRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  vVal: { fontSize: 22, fontWeight: '800' }, vUnit: { fontSize: 11, color: Colors.textMuted },
  aiCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.primary + '20' },
  aiH: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  aiIc: { width: 28, height: 28, borderRadius: 7, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  aiTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary }, aiText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  empty: { backgroundColor: Colors.paper, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyT: { fontSize: 14, color: Colors.textMuted, marginTop: 6 }, emptySub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statV: { fontSize: 26, fontWeight: '800' }, statL: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  benCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 14, padding: 12, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  benAv: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  benAvT: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  benInfo: { flex: 1 }, benName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary }, benSt: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  benR: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertBadge: { backgroundColor: Colors.destructive, borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  alertBadgeT: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  alertC: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 8, gap: 10, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  alertCrit: { borderLeftColor: Colors.destructive, backgroundColor: Colors.destructive + '05' },
  alertInfo: { flex: 1 }, alertMsg: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  alertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
