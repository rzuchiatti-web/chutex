import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

export default function AlertsScreen() {
  const { token, user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [trigLoading, setTrigLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiFetch('/api/alerts', {}, token);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = async (alertId: string) => {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token);
      fetchAlerts();
    } catch (e: any) { console.error(e); }
  };

  const triggerTestAlert = async (type: string, severity: string) => {
    setTrigLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({
        alert_type: type, severity, message: type === 'sos' ? 'SOS - Urgence!' : type === 'fall' ? 'Chute d\u00e9tect\u00e9e' : 'Anomalie cardiaque d\u00e9tect\u00e9e',
        device_type: 'bracelet',
      }) }, token);
      Alert.alert('Alerte test cr\u00e9\u00e9e', `Type: ${type}, S\u00e9v\u00e9rit\u00e9: ${severity}`);
      fetchAlerts();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setTrigLoading(false); }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.status === 'active';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const renderAlert = ({ item }: { item: any }) => (
    <View testID={`alert-card-${item.id}`} style={[st.alertCard, item.severity === 'critical' && { borderLeftColor: Colors.destructive }]}>
      <View style={st.alertContent}>
        <View style={st.alertTop}>
          <Ionicons name={item.alert_type === 'sos' ? 'alert-circle' : item.alert_type === 'fall' ? 'trending-down' : 'warning'}
            size={16} color={item.severity === 'critical' ? Colors.destructive : Colors.textMuted} />
          <Text style={st.alertType}>
            {item.alert_type === 'sos' ? 'SOS' : item.alert_type === 'fall' ? 'Chute' : item.alert_type === 'anomaly' ? 'Anomalie' : 'Alerte'}
          </Text>
          <View style={[st.sevBdg, item.severity === 'critical' && { backgroundColor: Colors.destructive + '12' }]}>
            <Text style={[st.sevBdgT, item.severity === 'critical' && { color: Colors.destructive }]}>
              {item.severity === 'critical' ? 'Critique' : item.severity === 'high' ? '\u00c9lev\u00e9' : item.severity === 'medium' ? 'Moyen' : 'Faible'}
            </Text>
          </View>
        </View>
        <Text style={st.alertMessage}>{item.message}</Text>
        <Text style={st.alertMeta}>{item.beneficiary_name} \u00b7 {new Date(item.created_at).toLocaleString('fr-FR')}</Text>
        {item.status === 'active' && (
          <TouchableOpacity testID={`resolve-alert-${item.id}`} style={st.resolveBtn} onPress={() => resolveAlert(item.id)}>
            <Ionicons name="checkmark" size={14} color={Colors.success} /><Text style={st.resolveBtnText}>R\u00e9soudre</Text>
          </TouchableOpacity>
        )}
        {item.status === 'resolved' && (
          <View style={st.resolvedBadge}><Ionicons name="checkmark" size={12} color={Colors.success} /><Text style={st.resolvedText}>R\u00e9solu</Text></View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={st.safeArea} testID="alerts-screen">
      <View style={st.header}>
        <Text style={st.title}>Alertes</Text>
        <Text style={st.subtitle}>{alerts.filter(a => a.status === 'active').length} active(s)</Text>
      </View>

      <View style={st.filterRow}>
        {(['all', 'active', 'resolved'] as const).map((f) => (
          <TouchableOpacity key={f} testID={`filter-${f}`} style={[st.filterTab, filter === f && st.filterTabActive]} onPress={() => setFilter(f)}>
            <Text style={[st.filterText, filter === f && st.filterTextActive]}>
              {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'R\u00e9solues'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test alert triggers for beneficiary */}
      {user?.role === 'beneficiary' && (
        <View style={st.testRow}>
          <Text style={st.testLabel}>Test:</Text>
          <TouchableOpacity testID="test-sos" style={[st.testBtn, {backgroundColor: Colors.destructive}]} onPress={() => triggerTestAlert('sos', 'critical')} disabled={trigLoading}>
            <Text style={st.testBtnT}>SOS</Text></TouchableOpacity>
          <TouchableOpacity testID="test-fall" style={st.testBtn} onPress={() => triggerTestAlert('fall', 'high')} disabled={trigLoading}>
            <Text style={st.testBtnT}>Chute</Text></TouchableOpacity>
          <TouchableOpacity testID="test-anomaly" style={st.testBtn} onPress={() => triggerTestAlert('anomaly', 'medium')} disabled={trigLoading}>
            <Text style={st.testBtnT}>Anomalie</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={st.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={st.emptyCard}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.textMuted} />
              <Text style={st.emptyTitle}>Aucune alerte</Text>
              <Text style={st.emptyText}>Tout va bien pour le moment</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.subtle },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: '#FFF' },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 6, marginBottom: 10 },
  testLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  testBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: Colors.primary },
  testBtnT: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  alertCard: {
    backgroundColor: Colors.subtle, borderRadius: 12,
    padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: Colors.border,
  },
  alertContent: {},
  alertTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  alertType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  sevBdg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  sevBdgT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  alertMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  alertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.success + '30' },
  resolveBtnText: { fontSize: 12, fontWeight: '600', color: Colors.success },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  resolvedText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  emptyText: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});
