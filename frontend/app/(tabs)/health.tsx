import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';

export default function HealthScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [latest, bracelet] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
      ]);
      if (bracelet && (bracelet.heart_rate > 0 || bracelet.steps > 0)) {
        setVitals({
          heart_rate: bracelet.heart_rate || 0, spo2: bracelet.spo2 || 0,
          systolic: bracelet.systolic || 0, diastolic: bracelet.diastolic || 0,
          temperature: bracelet.temperature || 0, steps: bracelet.steps || 0,
        });
      } else if (latest?.heart_rate) {
        setVitals(latest);
      }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const metrics = vitals ? [
    { id: 'heart_rate', label: 'Frequence cardiaque', value: vitals.heart_rate, unit: 'bpm', icon: 'heart', color: '#EF4444', range: '60-100' },
    { id: 'spo2', label: 'Saturation O2', value: vitals.spo2, unit: '%', icon: 'water', color: '#3B82F6', range: '95-100' },
    { id: 'blood_pressure', label: 'Tension arterielle', value: `${vitals.systolic || vitals.blood_pressure_systolic || 0}/${vitals.diastolic || vitals.blood_pressure_diastolic || 0}`, unit: 'mmHg', icon: 'pulse', color: '#8B5CF6', range: '120/80' },
    { id: 'temperature', label: 'Temperature', value: vitals.temperature, unit: 'C', icon: 'thermometer', color: '#F59E0B', range: '36.5-37.5' },
    { id: 'steps', label: 'Pas aujourd\'hui', value: vitals.steps, unit: 'pas', icon: 'footsteps', color: '#10B981', range: '> 6000' },
  ] : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} testID="health-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginTop: 16, marginBottom: 8, letterSpacing: -0.5 }}>Sante</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 24 }}>Suivi de vos constantes en temps reel</Text>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : vitals ? (
          <>
            {metrics.map(m => (
              <TouchableOpacity key={m.id} testID={`health-metric-${m.id}`}
                style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 16 }}
                onPress={() => router.push({ pathname: '/health-detail', params: { metricId: m.id } })}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: m.color + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={m.icon as any} size={22} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>{m.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary }}>{m.value}</Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>{m.unit}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Normal: {m.range}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}

            {/* Quick links */}
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginTop: 12, marginBottom: 12, letterSpacing: -0.3 }}>Examens</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8 }} onPress={() => router.push('/ecg')}>
                <Ionicons name="pulse-outline" size={28} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>ECG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8 }} onPress={() => router.push('/sleep')}>
                <Ionicons name="moon-outline" size={28} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Sommeil</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <MaterialCommunityIcons name="bluetooth-off" size={40} color={colors.textMuted} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginTop: 16 }}>Aucune donnee</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>Connectez votre bracelet pour suivre vos constantes</Text>
            <TouchableOpacity style={{ marginTop: 20, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 9999 }} onPress={() => router.push('/bracelet-connect')}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Connecter le bracelet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
