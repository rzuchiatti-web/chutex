import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { getMetricById } from '../src/constants/metrics';

const W = Dimensions.get('window').width;

export default function HealthDetailScreen() {
  const { metricId } = useLocalSearchParams<{ metricId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const metric = getMetricById(metricId || '');
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [threshold, setThreshold] = useState<any>({ min_val: '', max_val: '', goal: '' });
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    if (!metricId) return;
    fetchData();
  }, [metricId]);

  const fetchData = async () => {
    try {
      const [histRes, threshRes] = await Promise.all([
        apiFetch(`/api/health/history/${metricId}`, {}, token).catch(() => ({ history: [], stats: {} })),
        apiFetch(`/api/health/thresholds/${metricId}`, {}, token).catch(() => ({})),
      ]);
      setHistory(histRes.history || []);
      setStats(histRes.stats || {});
      if (threshRes.min_val !== undefined) setThreshold({
        min_val: threshRes.min_val?.toString() || '',
        max_val: threshRes.max_val?.toString() || '',
        goal: threshRes.goal?.toString() || '',
      });
    } catch (e) {} finally { setLoading(false); }
  };

  const getAIAdvice = async () => {
    if (!metric) return;
    setAdviceLoading(true);
    try {
      const res = await apiFetch('/api/ai/metric-advice', {
        method: 'POST',
        body: JSON.stringify({ metric_id: metricId, current_value: stats.current, metric_name: metric.name }),
      }, token);
      setAdvice(res.advice);
    } catch (e: any) { setAdvice('Conseil non disponible pour le moment.'); } finally { setAdviceLoading(false); }
  };

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await apiFetch('/api/health/thresholds', {
        method: 'POST',
        body: JSON.stringify({
          metric_id: metricId,
          min_val: threshold.min_val ? parseFloat(threshold.min_val) : null,
          max_val: threshold.max_val ? parseFloat(threshold.max_val) : null,
          goal: threshold.goal ? parseFloat(threshold.goal) : null,
        }),
      }, token);
      Alert.alert('Sauvegardé', 'Seuils mis à jour avec succès');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSavingThreshold(false); }
  };

  if (!metric) return <SafeAreaView style={s.safe}><Text style={s.err}>Métrique non trouvée</Text></SafeAreaView>;

  const renderIcon = () => {
    if (metric.iconLib === 'MaterialCommunityIcons')
      return <MaterialCommunityIcons name={metric.icon as any} size={24} color={metric.color} />;
    return <Ionicons name={metric.icon as any} size={24} color={metric.color} />;
  };

  const chartData = history.length > 0 ? {
    labels: history.map((h, i) => {
      const d = new Date(h.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [{ data: history.map(h => h.value), color: () => metric.color, strokeWidth: 2 }],
  } : null;

  return (
    <SafeAreaView style={s.safe} testID="health-detail-screen">
      <View style={s.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{metric.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
          {/* Current Value */}
          <View style={[s.currentCard, { borderColor: metric.color + '30' }]}>
            <View style={[s.curIcBg, { backgroundColor: metric.color + '15' }]}>{renderIcon()}</View>
            <Text style={[s.curVal, { color: metric.color }]}>{stats.current ?? '—'}</Text>
            <Text style={s.curUnit}>{metric.unit}</Text>
            <Text style={s.curLabel}>Valeur actuelle</Text>
          </View>

          {/* Chart */}
          {chartData && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Évolution (7 jours)</Text>
              <LineChart
                data={chartData}
                width={W - 56}
                height={180}
                chartConfig={{
                  backgroundColor: Colors.paper,
                  backgroundGradientFrom: Colors.paper,
                  backgroundGradientTo: Colors.paper,
                  decimalCount: 1,
                  color: () => metric.color,
                  labelColor: () => Colors.textMuted,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: metric.color },
                  propsForBackgroundLines: { stroke: Colors.border },
                }}
                bezier
                style={s.chart}
              />
            </View>
          )}

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}><Text style={s.statLabel}>Moyenne</Text><Text style={[s.statVal, { color: Colors.primary }]}>{stats.average ?? '—'}</Text></View>
            <View style={s.statBox}><Text style={s.statLabel}>Min</Text><Text style={[s.statVal, { color: Colors.info }]}>{stats.min ?? '—'}</Text></View>
            <View style={s.statBox}><Text style={s.statLabel}>Max</Text><Text style={[s.statVal, { color: Colors.destructive }]}>{stats.max ?? '—'}</Text></View>
          </View>

          {/* Normal Range */}
          <View style={s.rangeCard}>
            <Text style={s.rangeLbl}>Plage normale</Text>
            <Text style={s.rangeVal}>{metric.normalRange.min} — {metric.normalRange.max} {metric.unit}</Text>
          </View>

          {/* Description */}
          <View style={s.descCard}>
            <Ionicons name="information-circle" size={18} color={Colors.info} />
            <Text style={s.descText}>{metric.description}</Text>
          </View>

          {/* AI Advice */}
          <View style={s.aiCard}>
            <View style={s.aiH}>
              <Ionicons name="sparkles" size={18} color={Colors.primary} />
              <Text style={s.aiTitle}>Conseil IA</Text>
            </View>
            {advice ? <Text style={s.aiText}>{advice}</Text> : (
              <TouchableOpacity testID="get-advice-btn" style={s.aiBtn} onPress={getAIAdvice} disabled={adviceLoading}>
                {adviceLoading ? <ActivityIndicator size="small" color={Colors.primary} /> :
                  <Text style={s.aiBtnT}>Obtenir un conseil personnalisé</Text>}
              </TouchableOpacity>
            )}
          </View>

          {/* Threshold Editor */}
          <View style={s.threshCard}>
            <Text style={s.threshTitle}>Seuils d'alerte / Objectif</Text>
            <View style={s.threshRow}>
              <View style={s.threshItem}>
                <Text style={s.threshLbl}>Min</Text>
                <TextInput testID="thresh-min" style={s.threshInput} value={threshold.min_val} onChangeText={v => setThreshold({ ...threshold, min_val: v })} keyboardType="numeric" placeholder="—" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={s.threshItem}>
                <Text style={s.threshLbl}>Max</Text>
                <TextInput testID="thresh-max" style={s.threshInput} value={threshold.max_val} onChangeText={v => setThreshold({ ...threshold, max_val: v })} keyboardType="numeric" placeholder="—" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={s.threshItem}>
                <Text style={s.threshLbl}>Objectif</Text>
                <TextInput testID="thresh-goal" style={[s.threshInput, { borderColor: Colors.primary + '40' }]} value={threshold.goal} onChangeText={v => setThreshold({ ...threshold, goal: v })} keyboardType="numeric" placeholder="—" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>
            <TouchableOpacity testID="save-threshold-btn" style={s.saveBtn} onPress={saveThreshold} disabled={savingThreshold}>
              {savingThreshold ? <ActivityIndicator size="small" color="#FFF" /> :
                <Text style={s.saveBtnT}>Sauvegarder</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 18, paddingBottom: 30 },
  err: { fontSize: 16, color: Colors.destructive, textAlign: 'center', marginTop: 40 },
  currentCard: { alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1 },
  curIcBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  curVal: { fontSize: 36, fontWeight: '900' }, curUnit: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  curLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  chartCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  chart: { borderRadius: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: Colors.paper, borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  rangeCard: { backgroundColor: Colors.success + '08', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.success + '20' },
  rangeLbl: { fontSize: 13, fontWeight: '600', color: Colors.success }, rangeVal: { fontSize: 14, fontWeight: '700', color: Colors.success },
  descCard: { flexDirection: 'row', backgroundColor: Colors.info + '08', borderRadius: 12, padding: 12, marginBottom: 14, gap: 8, borderWidth: 1, borderColor: Colors.info + '15' },
  descText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  aiCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.primary + '20' },
  aiH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  aiText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  aiBtn: { paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.primary + '10' },
  aiBtnT: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  threshCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 14 },
  threshTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  threshRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  threshItem: { flex: 1 },
  threshLbl: { fontSize: 11, color: Colors.textMuted, marginBottom: 4, textAlign: 'center' },
  threshInput: { backgroundColor: Colors.subtle, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 15, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center', borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
