import { Icon, MCIcon } from '../src/components/WebIcon';
import FullScreenLoader from '../src/components/FullScreenLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

const STAGE_COLORS: Record<number, string> = { 0: '#EF5350', 1: '#1565C0', 2: '#42A5F5', 3: '#AB47BC' };
const STAGE_LABELS: Record<number, string> = { 0: 'Eveil', 1: 'Profond', 2: 'Leger', 3: 'REM' };
const STAGE_HEIGHTS: Record<number, number> = { 0: 15, 1: 100, 2: 55, 3: 80 };

export default function SleepScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [sleep, setSleep] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/health/sleep', {}, token).catch(() => null),
      apiFetch('/api/health/sleep/history', {}, token).catch(() => []),
    ]).then(([s, h]) => { setSleep(s); setHistory(h); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  // No sleep data available
  if (!sleep || !sleep.stages || sleep.stages.length === 0) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
          <Text style={s.topTitle}>Sommeil</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Icon name="moon-outline" size={80} color={Colors.textMuted} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 20 }}>Aucune donnee de sommeil</Text>
          <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 }}>Portez votre bracelet Elio pendant la nuit pour enregistrer votre sommeil. Les donnees apparaitront ici automatiquement.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stages = sleep.stages;
  const qualityColor = (sleep?.sleep_quality || 0) >= 80 ? Colors.success : (sleep?.sleep_quality || 0) >= 60 ? '#FF9800' : Colors.destructive;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Sommeil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Score */}
        <View style={s.scoreCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={[s.scoreCircle, { borderColor: qualityColor }]}>
              <Text style={[s.scoreVal, { color: qualityColor }]}>{sleep?.sleep_quality || 0}</Text>
              <Text style={s.scoreUnit}>%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.scoreLabel}>Qualite du sommeil</Text>
              <Text style={s.scoreDuration}>{sleep?.sleep_duration || 0}h de sommeil</Text>
              <Text style={s.scoreCycles}>{sleep?.cycles || 0} cycles</Text>
            </View>
            <Icon name="moon" size={28} color={Colors.textMuted} />
          </View>
        </View>

        {/* Hypnogram */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Hypnogramme</Text>
          <View style={s.legend}>
            {[1, 2, 3, 0].map(st => (
              <View key={st} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: STAGE_COLORS[st] }]} />
                <Text style={s.legendText}>{STAGE_LABELS[st]}</Text>
              </View>
            ))}
          </View>

          {/* Y axis labels */}
          <View style={s.hypnoContainer}>
            <View style={s.yAxis}>
              <Text style={s.yLabel}>Eveil</Text>
              <Text style={s.yLabel}>REM</Text>
              <Text style={s.yLabel}>Leger</Text>
              <Text style={s.yLabel}>Profond</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hypnoScroll}>
              <View style={s.hypnoChart}>
                {stages.map((stage: number, i: number) => (
                  <View key={i} style={[s.hypnoBar, {
                    height: STAGE_HEIGHTS[stage] || 15,
                    backgroundColor: STAGE_COLORS[stage] || '#EF5350',
                    alignSelf: 'flex-end',
                  }]} />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Time axis */}
          <View style={s.timeAxis}>
            <Text style={s.timeLabel}>22:00</Text>
            <Text style={s.timeLabel}>00:00</Text>
            <Text style={s.timeLabel}>02:00</Text>
            <Text style={s.timeLabel}>04:00</Text>
            <Text style={s.timeLabel}>06:00</Text>
          </View>
        </View>

        {/* Duration breakdown */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Repartition</Text>
          <View style={s.breakdownRow}>
            {[
              { label: 'Profond', min: sleep?.deep_minutes || 0, color: '#1565C0', icon: 'bed' },
              { label: 'Leger', min: sleep?.light_minutes || 0, color: '#42A5F5', icon: 'cloudy-night' },
              { label: 'REM', min: sleep?.rem_minutes || 0, color: '#AB47BC', icon: 'eye' },
              { label: 'Eveil', min: sleep?.awake_minutes || 0, color: '#EF5350', icon: 'alert-circle' },
            ].map(item => {
              const total = (sleep?.total_minutes || 1);
              const pct = Math.round(item.min / total * 100);
              return (
                <View key={item.label} style={s.breakdownItem}>
                  <Icon name={item.icon as any} size={20} color={item.color} />
                  <Text style={[s.breakdownVal, { color: item.color }]}>{Math.floor(item.min / 60)}h{String(item.min % 60).padStart(2, '0')}</Text>
                  <Text style={s.breakdownLabel}>{item.label}</Text>
                  <Text style={s.breakdownPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>

          {/* Bar chart */}
          <View style={s.barChart}>
            {[
              { label: 'Profond', min: sleep?.deep_minutes || 0, color: '#1565C0' },
              { label: 'Leger', min: sleep?.light_minutes || 0, color: '#42A5F5' },
              { label: 'REM', min: sleep?.rem_minutes || 0, color: '#AB47BC' },
              { label: 'Eveil', min: sleep?.awake_minutes || 0, color: '#EF5350' },
            ].map(item => {
              const total = (sleep?.total_minutes || 1);
              const pct = Math.round(item.min / total * 100);
              return (
                <View key={item.label} style={s.barRow}>
                  <Text style={s.barLabel}>{item.label}</Text>
                  <View style={s.barBg}>
                    <View style={[s.bar, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={s.barVal}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7 day history */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>7 derniers jours</Text>
          {history.map((h, i) => (
            <View key={i} style={s.histRow}>
              <Text style={s.histDate}>{new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })}</Text>
              <View style={s.histBars}>
                <View style={[s.histBar, { flex: h.deep, backgroundColor: '#1565C0' }]} />
                <View style={[s.histBar, { flex: h.light, backgroundColor: '#42A5F5' }]} />
                <View style={[s.histBar, { flex: h.rem, backgroundColor: '#AB47BC' }]} />
                <View style={[s.histBar, { flex: Math.max(h.awake, 1), backgroundColor: '#EF5350' }]} />
              </View>
              <Text style={s.histDur}>{h.duration}h</Text>
              <Text style={[s.histQual, { color: h.quality >= 80 ? Colors.success : h.quality >= 60 ? '#FF9800' : Colors.destructive }]}>{h.quality}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  sc: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Score
  scoreCard: { backgroundColor: '#1A237E', borderRadius: 16, padding: 20 },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreVal: { fontSize: 26, fontWeight: '900' },
  scoreUnit: { fontSize: 11, fontWeight: '600', color: '#FFF', opacity: 0.7, marginTop: -4 },
  scoreLabel: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  scoreDuration: { fontSize: 13, color: '#FFF', opacity: 0.8, marginTop: 2 },
  scoreCycles: { fontSize: 12, color: '#FFF', opacity: 0.6, marginTop: 1 },
  // Legend
  legend: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMuted },
  // Hypnogram
  hypnoContainer: { flexDirection: 'row', height: 120 },
  yAxis: { width: 50, justifyContent: 'space-between', paddingVertical: 2 },
  yLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'right' },
  hypnoScroll: { flex: 1 },
  hypnoChart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 0.5 },
  hypnoBar: { width: 2, borderRadius: 1, minHeight: 2 },
  timeAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingLeft: 50 },
  timeLabel: { fontSize: 9, color: Colors.textMuted },
  // Breakdown
  breakdownRow: { flexDirection: 'row', gap: 6 },
  breakdownItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 10, paddingVertical: 12, gap: 2 },
  breakdownVal: { fontSize: 14, fontWeight: '800' },
  breakdownLabel: { fontSize: 10, color: Colors.textMuted },
  breakdownPct: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  // Bar chart
  barChart: { marginTop: 14, gap: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 55, fontSize: 11, color: Colors.textSecondary, textAlign: 'right' },
  barBg: { flex: 1, height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 6 },
  barVal: { width: 30, fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  // History
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  histDate: { width: 45, fontSize: 11, color: Colors.textSecondary },
  histBars: { flex: 1, flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  histBar: { height: '100%' },
  histDur: { width: 30, fontSize: 12, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  histQual: { width: 30, fontSize: 11, fontWeight: '700', textAlign: 'right' },
});
