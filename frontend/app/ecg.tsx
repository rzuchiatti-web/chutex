import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

const W = Dimensions.get('window').width;

export default function ECGScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => { (async () => { try { setHistory(await apiFetch('/api/ecg/history', {}, token)); } catch {} finally { setLoading(false); } })(); }, [token]);

  const startECG = async () => {
    setRecording(true); setResult(null); setProgress(0);
    // Simulate 30s recording with progress
    const iv = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 3.3; }), 1000);
    try {
      const r = await apiFetch('/api/ecg/start', { method: 'POST' }, token);
      clearInterval(iv); setProgress(100); setResult(r);
      setHistory(prev => [r, ...prev.filter(h => h.id !== r.id)]);
    } catch (e: any) { clearInterval(iv); Alert.alert('Erreur', e.message); } finally { setRecording(false); }
  };

  const statusColor = (s: string) => s === 'normal' ? Colors.success : s === 'attention' ? '#FF9800' : Colors.destructive;

  return (
    <SafeAreaView style={[s.c, { backgroundColor: themeColors.background }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
        <Text style={s.headerT}>Électrocardiogramme</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* ECG Launch Card */}
        <View style={s.launchCard}>
          <View style={s.ecgIcon}>
            <Ionicons name="pulse" size={40} color={recording ? Colors.destructive : Colors.primary} />
          </View>
          <Text style={s.launchTitle}>{recording ? 'Enregistrement en cours...' : 'Lancer un ECG'}</Text>
          <Text style={s.launchDesc}>Placez votre doigt sur le capteur du bracelet et restez immobile pendant 30 secondes.</Text>

          {recording && (
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
          )}

          {!recording && !result && (
            <TouchableOpacity testID="start-ecg-btn" style={s.startBtn} onPress={startECG}>
              <Ionicons name="pulse" size={18} color="#FFF" /><Text style={s.startBtnT}>Démarrer l'ECG</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Result */}
        {result && (
          <View style={[s.resultCard, { borderLeftColor: statusColor(result.status) }]}>
            <View style={s.resultHeader}>
              <Ionicons name={result.status === 'normal' ? 'checkmark-circle' : 'warning'} size={22} color={statusColor(result.status)} />
              <Text style={[s.resultStatus, { color: statusColor(result.status) }]}>
                {result.status === 'normal' ? 'Normal' : 'Attention'}
              </Text>
            </View>
            <Text style={s.resultInterp}>{result.interpretation}</Text>
            <View style={s.metricsGrid}>
              {[
                { l: 'BPM', v: result.bpm, u: 'bpm' },
                { l: 'Rythme', v: result.rhythm, u: '' },
                { l: 'PR', v: result.pr_interval_ms, u: 'ms' },
                { l: 'QRS', v: result.qrs_duration_ms, u: 'ms' },
                { l: 'QT', v: result.qt_interval_ms, u: 'ms' },
                { l: 'Durée', v: result.duration_sec, u: 's' },
              ].map(m => (
                <View key={m.l} style={s.metricBox}>
                  <Text style={s.metricLabel}>{m.l}</Text>
                  <Text style={s.metricVal}>{m.v}{m.u ? ` ${m.u}` : ''}</Text>
                </View>
              ))}
            </View>

            {/* Simple ECG waveform visualization */}
            {result.samples && result.samples.length > 0 && (
              <View style={s.waveContainer}>
                <Text style={s.waveLabel}>Tracé ECG</Text>
                <View style={s.wave}>
                  {result.samples.slice(0, 200).map((v: number, i: number) => (
                    <View key={i} style={[s.waveLine, { height: Math.max(1, Math.abs(v) * 30), backgroundColor: v > 0.5 ? Colors.destructive : Colors.primary, bottom: v > 0 ? 20 : 20 - Math.abs(v) * 30 }]} />
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={s.newEcgBtn} onPress={() => { setResult(null); startECG(); }}>
              <Text style={s.newEcgBtnT}>Nouveau ECG</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History */}
        <Text style={s.secTitle}>Historique ({history.length})</Text>
        {history.map(h => (
          <View key={h.id} style={[s.histCard, { borderLeftColor: statusColor(h.status) }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.histBpm}>{h.bpm} bpm — {h.rhythm}</Text>
              <Text style={s.histInterp}>{h.interpretation}</Text>
              <Text style={s.histDate}>{new Date(h.created_at).toLocaleString('fr-FR')}</Text>
            </View>
            <View style={[s.histBadge, { backgroundColor: statusColor(h.status) + '18' }]}>
              <Text style={[s.histBadgeT, { color: statusColor(h.status) }]}>{h.status === 'normal' ? 'Normal' : 'Attention'}</Text>
            </View>
          </View>
        ))}
        {history.length === 0 && !loading && <View style={s.empty}><Text style={s.emptyT}>Aucun ECG enregistré</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: Colors.paper },
  backBtn: { padding: 4, marginRight: 12 },
  headerT: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  scroll: { padding: 16, paddingBottom: 60 },
  launchCard: { backgroundColor: Colors.paper, borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  ecgIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  launchTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  launchDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  progressBar: { width: '100%', height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  startBtnT: { fontSize: 16, fontWeight: '700', color: '#000' },
  resultCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 20, marginBottom: 16, borderLeftWidth: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  resultStatus: { fontSize: 18, fontWeight: '800' },
  resultInterp: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricBox: { width: '31%', backgroundColor: Colors.subtle, borderRadius: 8, padding: 10, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricVal: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 2 },
  waveContainer: { marginTop: 16 },
  waveLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  wave: { flexDirection: 'row', height: 50, alignItems: 'flex-end', overflow: 'hidden', backgroundColor: Colors.subtle, borderRadius: 8, padding: 4 },
  waveLine: { width: 1, marginRight: 0.5 },
  newEcgBtn: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  newEcgBtnT: { fontSize: 14, fontWeight: '600', color: Colors.text },
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  histCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 10, padding: 14, marginBottom: 6, borderLeftWidth: 3, gap: 10 },
  histBpm: { fontSize: 14, fontWeight: '600', color: Colors.text },
  histInterp: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  histDate: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  histBadgeT: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 30 },
  emptyT: { fontSize: 13, color: Colors.textMuted },
});
