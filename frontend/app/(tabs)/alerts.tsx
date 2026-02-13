import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import { useRouter } from 'expo-router';

export default function AlertsScreen() {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [trigLoading, setTrigLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try { setAlerts(await apiFetch('/api/alerts', {}, token)); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = async (alertId: string) => {
    try { await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token); fetchAlerts(); } catch {}
  };

  const triggerTestAlert = async (type: string, severity: string) => {
    setTrigLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: type, severity, message: type === 'sos' ? 'SOS - Urgence!' : type === 'fall' ? 'Chute detectee' : 'Anomalie cardiaque detectee', device_type: 'bracelet' }) }, token);
      Alert.alert('Alerte test creee', `Type: ${type}`);
      fetchAlerts();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setTrigLoading(false); }
  };

  const filtered = alerts.filter((a) => filter === 'active' ? a.status === 'active' : filter === 'resolved' ? a.status === 'resolved' : true);
  const activeCount = alerts.filter(a => a.status === 'active').length;

  const renderAlert = ({ item }: { item: any }) => (
    <TouchableOpacity testID={`alert-card-${item.id}`} style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderLeftWidth: 3, borderLeftColor: item.severity === 'critical' ? '#E53935' : 'rgba(255,255,255,0.7)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {}) }}
      onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: item.severity === 'critical' ? colors.dangerGlow : colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={item.alert_type === 'sos' ? 'alert-circle' : item.alert_type === 'fall' ? 'trending-down' : 'warning'} size={16} color={item.severity === 'critical' ? colors.danger : colors.textMuted} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>
          {item.alert_type === 'sos' ? 'SOS' : item.alert_type === 'fall' ? 'Chute' : item.alert_type === 'anomaly' ? 'Anomalie' : 'Alerte'}
        </Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: item.severity === 'critical' ? colors.dangerGlow : colors.surfaceHighlight }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: item.severity === 'critical' ? colors.danger : colors.textMuted, textTransform: 'uppercase' }}>
            {item.severity === 'critical' ? 'Critique' : item.severity === 'high' ? 'Eleve' : item.severity === 'medium' ? 'Moyen' : 'Faible'}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>{item.message}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{item.beneficiary_name || user?.name} - {new Date(item.created_at).toLocaleString('fr-FR')}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {item.status === 'active' && (
          <>
            <TouchableOpacity testID={`resolve-alert-${item.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1.5, borderColor: colors.success + '40' }} onPress={() => resolveAlert(item.id)}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} /><Text style={{ fontSize: 12, fontWeight: '600', color: colors.success }}>Cloturer</Text>
            </TouchableOpacity>
            {(user?.role === 'guardian' || user?.role === 'teleassistance') && (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, backgroundColor: colors.primary }} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })}>
                <Ionicons name="navigate" size={14} color="#FFF" /><Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}>Intervenir</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {item.status === 'resolved' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="checkmark" size={14} color={colors.success} /><Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>Resolu</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} testID="alerts-screen">
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>Alertes</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{activeCount} active(s)</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 }}>
        {(['all', 'active', 'resolved'] as const).map((f) => (
          <TouchableOpacity key={f} testID={`filter-${f}`} style={[{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9999, borderWidth: 1.5, borderColor: filter === f ? colors.primary : colors.border }, filter === f && { backgroundColor: colors.primary }]} onPress={() => setFilter(f)}>
            <Text style={[{ fontSize: 13, fontWeight: '600' }, filter === f ? { color: '#FFF' } : { color: colors.textMuted }]}>
              {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'Resolues'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {user?.role === 'beneficiary' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Test:</Text>
          <TouchableOpacity testID="test-sos" style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, backgroundColor: colors.danger }} onPress={() => triggerTestAlert('sos', 'critical')} disabled={trigLoading}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="test-fall" style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, backgroundColor: colors.primary }} onPress={() => triggerTestAlert('fall', 'high')} disabled={trigLoading}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>Chute</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="test-anomaly" style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, backgroundColor: colors.warning }} onPress={() => triggerTestAlert('anomaly', 'medium')} disabled={trigLoading}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>Anomalie</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Aucune alerte</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Tout va bien pour le moment</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
