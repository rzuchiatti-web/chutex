import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import { useRouter } from 'expo-router';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};

const ALERT_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  sos: { icon: 'alert-circle', color: '#E53935', bg: 'rgba(229,57,53,0.1)' },
  fall: { icon: 'trending-down', color: '#FF6F00', bg: 'rgba(255,111,0,0.1)' },
  anomaly: { icon: 'pulse', color: '#7B1FA2', bg: 'rgba(123,31,162,0.1)' },
};

export default function AlertsScreen() {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'resolved'>('active');

  const fetchAlerts = useCallback(async () => {
    try { setAlerts(await apiFetch('/api/alerts', {}, token)); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = async (alertId: string) => {
    try { await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token); fetchAlerts(); } catch {}
  };

  const active = alerts.filter(a => a.status === 'active');
  const resolved = alerts.filter(a => a.status === 'resolved');
  const filtered = tab === 'active' ? active : resolved;

  const renderAlert = ({ item }: { item: any }) => {
    const cfg = ALERT_ICONS[item.alert_type] || ALERT_ICONS.sos;
    const isActive = item.status === 'active';
    const severityLabel = item.severity === 'critical' ? 'CRITIQUE' : item.severity === 'high' ? 'ELEVE' : item.severity === 'medium' ? 'MOYEN' : 'FAIBLE';
    const severityColor = item.severity === 'critical' ? '#E53935' : item.severity === 'high' ? '#FF6F00' : '#888';

    return (
      <TouchableOpacity style={[{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, isActive && { borderLeftWidth: 4, borderLeftColor: cfg.color }]}
        onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cfg.bg, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>
                {item.alert_type === 'sos' ? 'SOS - Urgence' : item.alert_type === 'fall' ? 'Chute detectee' : 'Anomalie'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {new Date(item.created_at).toLocaleDateString('fr-FR')} a {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: severityColor + '15' }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: severityColor }}>{severityLabel}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 8 }}>{item.message}</Text>
        {item.beneficiary_name && <Text style={{ fontSize: 12, color: '#888' }}>{item.beneficiary_name}</Text>}

        {isActive && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#000', borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }} onPress={() => resolveAlert(item.id)}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>RESOUDRE</Text>
            </TouchableOpacity>
            {(user?.role === 'guardian' || user?.role === 'teleassistance') && (
              <TouchableOpacity style={{ flex: 1, backgroundColor: cfg.color, borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })}>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>INTERVENIR</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!isActive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#4CAF50' }}>Resolu le {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString('fr-FR') : '--'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }} testID="alerts-screen">
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -0.5 }}>Alertes</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, tab === 'active' && { backgroundColor: '#000' }]} onPress={() => setTab('active')}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tab === 'active' ? '#FFF' : '#888' }}>Actives ({active.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, tab === 'resolved' && { backgroundColor: '#000' }]} onPress={() => setTab('resolved')}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tab === 'resolved' ? '#FFF' : '#888' }}>Resolues ({resolved.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor="#000" />}
          ListEmptyComponent={
            <View style={[{ alignItems: 'center', paddingVertical: 48, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }]}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(76,175,80,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name={tab === 'active' ? 'checkmark-circle' : 'archive-outline'} size={32} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#000' }}>{tab === 'active' ? 'Aucune alerte active' : 'Aucune alerte resolue'}</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{tab === 'active' ? 'Tout va bien !' : 'Les alertes resolues apparaitront ici'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
