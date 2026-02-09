import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';

export default function BackofficeScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'users' | 'alerts'>('stats');

  useEffect(() => {
    (async () => {
      try {
        const [s, u, a] = await Promise.all([
          apiFetch('/api/backoffice/stats', {}, token).catch(() => null),
          apiFetch('/api/backoffice/users', {}, token).catch(() => []),
          apiFetch('/api/backoffice/alerts', {}, token).catch(() => []),
        ]);
        setStats(s); setUsers(u); setAlerts(a);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={s.safe} testID="backoffice-screen">
      <View style={s.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Back Office</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['stats', 'users', 'alerts'] as const).map(t => (
          <TouchableOpacity key={t} testID={`bo-tab-${t}`} style={[s.tab, tab === t && s.tabA]} onPress={() => setTab(t)}>
            <Text style={[s.tabT, tab === t && s.tabTA]}>{t === 'stats' ? 'Statistiques' : t === 'users' ? 'Utilisateurs' : 'Alertes'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
          {tab === 'stats' && stats && (
            <>
              <View style={s.statsGrid}>
                {[
                  { label: 'Utilisateurs', value: stats.total_users, icon: 'people', color: Colors.primary },
                  { label: 'Bénéficiaires', value: stats.beneficiaries, icon: 'heart', color: Colors.destructive },
                  { label: 'Gardiens', value: stats.guardians, icon: 'shield-checkmark', color: Colors.info },
                  { label: 'Alertes totales', value: stats.total_alerts, icon: 'notifications', color: Colors.accent },
                  { label: 'Alertes actives', value: stats.active_alerts, icon: 'alert-circle', color: Colors.destructive },
                  { label: 'Prescriptions', value: stats.prescriptions, icon: 'document-text', color: Colors.primary },
                  { label: 'Interventions', value: stats.interventions, icon: 'map', color: Colors.info },
                  { label: 'Téléconsultations', value: stats.teleconsults, icon: 'videocam', color: Colors.success },
                ].map(st => (
                  <View key={st.label} style={[s.statCard, { borderLeftColor: st.color, borderLeftWidth: 3 }]}>
                    <Ionicons name={st.icon as any} size={20} color={st.color} />
                    <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
                    <Text style={s.statLabel}>{st.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'users' && (
            users.map(u => (
              <View key={u.id} style={s.userRow}>
                <View style={[s.userAv, { backgroundColor: u.role === 'guardian' ? Colors.info + '15' : Colors.primary + '15' }]}>
                  <Text style={[s.userAvT, { color: u.role === 'guardian' ? Colors.info : Colors.primary }]}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={s.userInfo}>
                  <Text style={s.userName}>{u.name}</Text>
                  <Text style={s.userEmail}>{u.email}</Text>
                </View>
                <View style={[s.roleBadge, { backgroundColor: u.role === 'guardian' ? Colors.info + '15' : Colors.primary + '15' }]}>
                  <Text style={[s.roleText, { color: u.role === 'guardian' ? Colors.info : Colors.primary }]}>
                    {u.role === 'guardian' ? 'Gardien' : 'Bénéf.'}
                  </Text>
                </View>
              </View>
            ))
          )}

          {tab === 'alerts' && (
            alerts.slice(0, 30).map(a => (
              <View key={a.id} style={[s.alertRow, { borderLeftColor: a.severity === 'critical' ? Colors.destructive : Colors.accent }]}>
                <View style={s.alertInfo}>
                  <Text style={s.alertMsg}>{a.message}</Text>
                  <Text style={s.alertMeta}>{a.beneficiary_name} • {a.alert_type} • {new Date(a.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <View style={[s.stBadge, { backgroundColor: a.status === 'active' ? Colors.destructive + '15' : Colors.success + '15' }]}>
                  <Text style={[s.stBadgeT, { color: a.status === 'active' ? Colors.destructive : Colors.success }]}>
                    {a.status === 'active' ? 'Actif' : 'Résolu'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 18, backgroundColor: Colors.subtle, borderRadius: 12, padding: 3, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabA: { backgroundColor: Colors.primary },
  tabT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted }, tabTA: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 18, paddingBottom: 30 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: Colors.paper, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  userAv: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  userAvT: { fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: 12, color: Colors.textMuted },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '700' },
  alertRow: { backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertInfo: { flex: 1 },
  alertMsg: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  alertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  stBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stBadgeT: { fontSize: 10, fontWeight: '700' },
});
