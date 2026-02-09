import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { BRACELET_METRICS, SCALE_METRICS, getMetricCategories } from '../../src/constants/metrics';

export default function HealthScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [latestData, setLatestData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bracelet' | 'scale'>('bracelet');
  const [devices, setDevices] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [readings, devs] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/devices', {}, token).catch(() => []),
      ]);
      const data: any = {};
      if (readings.bracelet) Object.assign(data, readings.bracelet.data);
      if (readings.scale) Object.assign(data, readings.scale.data);
      setLatestData(data);
      setDevices(devs);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = getMetricCategories(activeTab);
  const vestDevice = devices.find((d: any) => d.device_type === 'vest');

  const renderIcon = (metric: any) => {
    if (metric.iconLib === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={metric.icon as any} size={20} color={metric.color} />;
    }
    return <Ionicons name={metric.icon as any} size={20} color={metric.color} />;
  };

  return (
    <SafeAreaView style={s.safe} testID="health-screen">
      <View style={s.header}>
        <Text style={s.title}>Données de Santé</Text>
      </View>

      {/* Device Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity testID="tab-bracelet" style={[s.tab, activeTab === 'bracelet' && s.tabA]} onPress={() => setActiveTab('bracelet')}>
          <MaterialCommunityIcons name="watch" size={16} color={activeTab === 'bracelet' ? '#FFF' : Colors.textMuted} />
          <Text style={[s.tabT, activeTab === 'bracelet' && s.tabTA]}>Bracelet</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-scale" style={[s.tab, activeTab === 'scale' && s.tabA]} onPress={() => setActiveTab('scale')}>
          <MaterialCommunityIcons name="scale-bathroom" size={16} color={activeTab === 'scale' ? '#FFF' : Colors.textMuted} />
          <Text style={[s.tabT, activeTab === 'scale' && s.tabTA]}>Balance</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={s.sc}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Vest Status (shown at top when on bracelet tab) */}
          {activeTab === 'bracelet' && vestDevice && (
            <View style={s.vestCard}>
              <MaterialCommunityIcons name="tshirt-crew" size={22} color={vestDevice.connected ? Colors.primary : Colors.textMuted} />
              <View style={s.vestInfo}>
                <Text style={s.vestName}>Gilet Anti-Chute</Text>
                <Text style={[s.vestSt, { color: vestDevice.connected ? Colors.success : Colors.textMuted }]}>
                  {vestDevice.connected ? 'Connecté' : 'Déconnecté'} • {vestDevice.battery}%
                </Text>
              </View>
              <Ionicons name="battery-half" size={18} color={vestDevice.battery > 30 ? Colors.success : Colors.destructive} />
            </View>
          )}

          {/* Metric Categories */}
          {Object.entries(categories).map(([catName, metrics]) => (
            <View key={catName}>
              <Text style={s.catTitle}>{catName}</Text>
              {metrics.map((m) => {
                const val = latestData[m.id];
                return (
                  <TouchableOpacity
                    key={m.id}
                    testID={`metric-${m.id}`}
                    style={s.metricRow}
                    onPress={() => router.push({ pathname: '/health-detail', params: { metricId: m.id } })}
                  >
                    <View style={[s.metricIc, { backgroundColor: m.color + '15' }]}>{renderIcon(m)}</View>
                    <View style={s.metricInfo}>
                      <Text style={s.metricName}>{m.name}</Text>
                      <Text style={s.metricUnit}>{m.unit}</Text>
                    </View>
                    <Text style={[s.metricVal, { color: val !== undefined ? m.color : Colors.textMuted }]}>
                      {val !== undefined ? (typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val) : '—'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {Object.keys(latestData).length === 0 && (
            <View style={s.emptyC}>
              <MaterialCommunityIcons name="bluetooth-off" size={36} color={Colors.textMuted} />
              <Text style={s.emptyT}>Aucune donnée disponible</Text>
              <Text style={s.emptySub}>Synchronisez vos appareils dans l'onglet Appareils</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  tabs: { flexDirection: 'row', marginHorizontal: 18, backgroundColor: Colors.subtle, borderRadius: 12, padding: 3, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabA: { backgroundColor: Colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabT: { fontSize: 14, fontWeight: '600', color: Colors.textMuted }, tabTA: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 18, paddingBottom: 20 },
  vestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  vestInfo: { flex: 1 }, vestName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  vestSt: { fontSize: 12, marginTop: 2 },
  catTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, marginTop: 14, marginBottom: 8, marginLeft: 2 },
  metricRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  metricIc: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  metricInfo: { flex: 1 }, metricName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  metricUnit: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  metricVal: { fontSize: 16, fontWeight: '700', marginRight: 4 },
  emptyC: { alignItems: 'center', paddingVertical: 40 },
  emptyT: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 10 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
