import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

/* ===== ADMIN: CLIENTS ===== */
function AdminClients({ token }: { token: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'beneficiary'|'guardian'>('beneficiary');

  const fetchUsers = useCallback(async () => {
    try { setUsers(await apiFetch('/api/backoffice/users', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const bens = users.filter(u => u.role === 'beneficiary');
  const guards = users.filter(u => u.role === 'guardian' || (u.role === 'beneficiary' && u.has_guardian_space));
  const displayed = tab === 'beneficiary' ? bens : guards;

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: -0.5 }}>Clients</Text>
        <Text style={{ fontSize: 12, color: '#888' }}>{users.length} utilisateurs au total</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'beneficiary' && { backgroundColor: '#000' }]} onPress={() => setTab('beneficiary')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'beneficiary' ? '#FFF' : '#888' }}>Beneficiaires ({bens.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'guardian' && { backgroundColor: '#000' }]} onPress={() => setTab('guardian')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'guardian' ? '#FFF' : '#888' }}>Gardiens ({guards.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#000" />}>
        {displayed.map(u => (
          <TouchableOpacity key={u.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: u.id } })} activeOpacity={0.7}>
            <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tab === 'beneficiary' ? '#4FC3F7' : '#FFD54F', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{u.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#000' }}>{u.name}</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{u.email}</Text>
                {u.phone && <Text style={{ fontSize: 11, color: '#AAA' }}>{u.phone}</Text>}
                {u.is_prescriber && <Text style={{ fontSize: 10, fontWeight: '700', color: '#9C27B0', marginTop: 2 }}>Prescripteur - {u.prescriber_structure}</Text>}
                {u.is_intervention_provider && <Text style={{ fontSize: 10, fontWeight: '700', color: '#4CAF50', marginTop: 2 }}>Intervenant Care</Text>}
                {u.subscription_type && u.subscription_type !== 'none' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: u.subscription_type === 'care' ? '#9C27B0' : '#2196F3' }} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: u.subscription_type === 'care' ? '#9C27B0' : '#2196F3' }}>Abonnement {u.subscription_type.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </GlassCard>
          </TouchableOpacity>
        ))}
        {displayed.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="people-outline" size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Aucun {tab === 'beneficiary' ? 'beneficiaire' : 'gardien'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function HealthScreen() {
  const { token, user } = useAuth();
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

  // Admin sees Clients page
  const effectiveRole = user?.active_role || user?.role;
  if (effectiveRole === 'admin' && token) {
    return <AdminClients token={token} />;
  }

  const metrics = vitals ? [
    { id: 'heart_rate', label: 'Frequence cardiaque', value: vitals.heart_rate, unit: 'bpm', icon: 'heart', color: '#EF4444', range: '60-100' },
    { id: 'spo2', label: 'Saturation O2', value: vitals.spo2, unit: '%', icon: 'water', color: '#3B82F6', range: '95-100' },
    { id: 'blood_pressure', label: 'Tension arterielle', value: `${vitals.systolic || vitals.blood_pressure_systolic || 0}/${vitals.diastolic || vitals.blood_pressure_diastolic || 0}`, unit: 'mmHg', icon: 'pulse', color: '#8B5CF6', range: '120/80' },
    { id: 'temperature', label: 'Temperature', value: vitals.temperature, unit: 'C', icon: 'thermometer', color: '#F59E0B', range: '36.5-37.5' },
    { id: 'steps', label: 'Pas aujourd\'hui', value: vitals.steps, unit: 'pas', icon: 'footsteps', color: '#10B981', range: '> 6000' },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="health-screen">
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
    </View>
  );
}
