import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

export default function AlertsScreen() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

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
    } catch (e: any) {
      console.error(e);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.status === 'active';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sos': return 'alert-circle';
      case 'fall': return 'trending-down';
      case 'anomaly': return 'warning';
      case 'medication_missed': return 'medical';
      default: return 'notifications';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return Colors.destructive;
      case 'high': return Colors.accent;
      case 'medium': return Colors.info;
      default: return Colors.textMuted;
    }
  };

  const renderAlert = ({ item }: { item: any }) => (
    <View
      testID={`alert-card-${item.id}`}
      style={[styles.alertCard, { borderLeftColor: getSeverityColor(item.severity) }]}
    >
      <View style={[styles.iconBg, { backgroundColor: getSeverityColor(item.severity) + '15' }]}>
        <Ionicons name={getAlertIcon(item.alert_type) as any} size={22} color={getSeverityColor(item.severity)} />
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertTop}>
          <Text style={styles.alertType}>
            {item.alert_type === 'sos' ? 'SOS' : item.alert_type === 'fall' ? 'Chute' : item.alert_type === 'anomaly' ? 'Anomalie' : 'Alerte'}
          </Text>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '15' }]}>
            <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
              {item.severity === 'critical' ? 'Critique' : item.severity === 'high' ? 'Élevé' : item.severity === 'medium' ? 'Moyen' : 'Faible'}
            </Text>
          </View>
        </View>
        <Text style={styles.alertMessage}>{item.message}</Text>
        <Text style={styles.alertMeta}>
          {item.beneficiary_name} • {new Date(item.created_at).toLocaleString('fr-FR')}
        </Text>
        {item.status === 'active' && (
          <TouchableOpacity
            testID={`resolve-alert-${item.id}`}
            style={styles.resolveBtn}
            onPress={() => resolveAlert(item.id)}
          >
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.resolveBtnText}>Résoudre</Text>
          </TouchableOpacity>
        )}
        {item.status === 'resolved' && (
          <View style={styles.resolvedBadge}>
            <Ionicons name="checkmark" size={14} color={Colors.success} />
            <Text style={styles.resolvedText}>Résolu</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} testID="alerts-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Alertes</Text>
        <Text style={styles.subtitle}>{alerts.filter(a => a.status === 'active').length} active(s)</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f}`}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'Résolues'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.emptyTitle}>Aucune alerte</Text>
              <Text style={styles.emptyText}>Tout va bien pour le moment</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.subtle },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  alertCard: {
    flexDirection: 'row', backgroundColor: Colors.paper, borderRadius: 16,
    padding: 14, marginBottom: 10, borderLeftWidth: 3, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  alertContent: { flex: 1 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertType: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 11, fontWeight: '700' },
  alertMessage: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  alertMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.success + '10' },
  resolveBtnText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  resolvedText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
});
