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
      return <MaterialCommunityIcons name={metric.icon as any} size={18} color={Colors.textMuted} />;
    }
    return <Ionicons name={metric.icon as any} size={18} color={Colors.textMuted} />;
  };

  return (
    <SafeAreaView style={h.safe} testID="health-screen">
      <View style={h.header}><Text style={h.title}>Données de Santé</Text></View>

      <View style={h.tabs}>
        <TouchableOpacity testID="tab-bracelet" style={[h.tab, activeTab === 'bracelet' && h.tabA]} onPress={() => setActiveTab('bracelet')}>
          <MaterialCommunityIcons name="watch" size={14} color={activeTab === 'bracelet' ? '#FFF' : Colors.textMuted} />
          <Text style={[h.tabT, activeTab === 'bracelet' && h.tabTA]}>Bracelet</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-scale" style={[h.tab, activeTab === 'scale' && h.tabA]} onPress={() => setActiveTab('scale')}>
          <MaterialCommunityIcons name="scale-bathroom" size={14} color={activeTab === 'scale' ? '#FFF' : Colors.textMuted} />
          <Text style={[h.tabT, activeTab === 'scale' && h.tabTA]}>Balance</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={h.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={h.sc}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}>
          {activeTab === 'bracelet' && vestDevice && (
            <View style={h.vestCard}>
              <MaterialCommunityIcons name="tshirt-crew" size={18} color={vestDevice.connected ? Colors.primary : Colors.textMuted} />
              <View style={h.vestInfo}><Text style={h.vestName}>Gilet Anti-Chute</Text>
                <Text style={[h.vestSt, { color: vestDevice.connected ? Colors.success : Colors.textMuted }]}>
                  {vestDevice.connected ? 'Connecté' : 'Déconnecté'} · {vestDevice.battery}%</Text></View>
            </View>
          )}

          {Object.entries(categories).map(([catName, metrics]) => (
            <View key={catName}>
              <Text style={h.catTitle}>{catName}</Text>
              {metrics.map((m) => {
                const val = latestData[m.id];
                return (
                  <TouchableOpacity key={m.id} testID={`metric-${m.id}`} style={h.metricRow}
                    onPress={() => router.push({ pathname: '/health-detail', params: { metricId: m.id } })}>
                    <View style={h.metricIc}>{renderIcon(m)}</View>
                    <View style={h.metricInfo}><Text style={h.metricName}>{m.name}</Text><Text style={h.metricUnit}>{m.unit}</Text></View>
                    <Text style={[h.metricVal, val !== undefined && { color: Colors.textPrimary }]}>
                      {val !== undefined ? (typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val) : '—'}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {Object.keys(latestData).length === 0 && (
            <View style={h.emptyC}>
              <MaterialCommunityIcons name="bluetooth-off" size={32} color={Colors.textMuted} />
              <Text style={h.emptyT}>Aucune donnée disponible</Text>
              <Text style={h.emptySub}>Synchronisez vos appareils dans l'onglet Appareils</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const h = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.subtle, borderRadius: 10, padding: 3, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8, gap: 5 },
  tabA: { backgroundColor: Colors.primary },
  tabT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTA: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 20, paddingBottom: 24 },
  vestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, marginBottom: 12, gap: 10, borderWidth: 1, borderColor: Colors.border },
  vestInfo: { flex: 1 },
  vestName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  vestSt: { fontSize: 11, marginTop: 2 },
  catTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 4, gap: 10 },
  metricIc: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border },
  metricInfo: { flex: 1 },
  metricName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  metricUnit: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  metricVal: { fontSize: 16, fontWeight: '800', color: Colors.textMuted, marginRight: 4 },
  emptyC: { alignItems: 'center', paddingVertical: 40 },
  emptyT: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 10 },
  emptySub: { fontSize: 12, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
