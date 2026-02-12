import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

export default function SubscriptionScreen() {
  const { colors: themeColors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [s, g, a] = await Promise.all([
        apiFetch('/api/subscriptions/my', {}, token).catch(() => null),
        apiFetch('/api/guardians/my', {}, token).catch(() => []),
        apiFetch('/api/alerts/my?limit=10', {}, token).catch(() => []),
      ]);
      setSub(s);
      setGuardians(Array.isArray(g) ? g : []);
      setAlerts(Array.isArray(a) ? a : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const moveGuardian = async (guardianId: string, direction: 'up' | 'down') => {
    const idx = guardians.findIndex(g => g.id === guardianId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === guardians.length - 1) return;
    const newOrder = [...guardians];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setGuardians(newOrder);
    try {
      await apiFetch('/api/guardians/reorder', {
        method: 'POST',
        body: JSON.stringify({ order: newOrder.map(g => g.id) }),
      }, token);
    } catch {}
  };

  const removeGuardian = async (guardianId: string) => {
    try {
      await apiFetch(`/api/guardians/${guardianId}/unlink`, { method: 'POST' }, token);
      setGuardians(guardians.filter(g => g.id !== guardianId));
    } catch {}
  };

  const addGuardian = async () => {
    if (!guardianPhone.trim()) return;
    setAdding(true);
    setAddResult(null);
    try {
      const r = await apiFetch('/api/guardians/invite', {
        method: 'POST',
        body: JSON.stringify({ phone: guardianPhone.trim() }),
      }, token);
      setAddResult(r);
      if (r?.linked) {
        setGuardians([...guardians, r.guardian]);
        setGuardianPhone('');
        setTimeout(() => { setShowAddGuardian(false); setAddResult(null); }, 2000);
      }
    } catch (e: any) { setAddResult({ error: e.message }); } finally { setAdding(false); }
  };

  if (loading) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  const isCare = sub?.subscription_type === 'care';
  const hasSubscription = sub?.has_subscription;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mon Abonnement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>

        {/* Subscription Card */}
        <View style={[s.subCard, { backgroundColor: isCare ? '#7B1FA2' : hasSubscription ? Colors.primary : Colors.textMuted }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.subIcon}>
              <Ionicons name={hasSubscription ? "shield-checkmark" : "shield-outline"} size={32} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.subType}>
                {isCare ? 'Abonnement Care' : hasSubscription ? 'Abonnement Standard' : 'Aucun abonnement'}
              </Text>
              <Text style={s.subDesc}>
                {isCare ? 'Bracelet + App + Teleassistance IA' : hasSubscription ? 'Bracelet + App complete' : 'Gilet et balance uniquement'}
              </Text>
            </View>
          </View>
          {isCare && (
            <View style={s.careFeature}>
              <Ionicons name="call" size={16} color="#FFF" />
              <Text style={s.careFeatureT}>Teleassistance IA active</Text>
            </View>
          )}
        </View>

        {/* Guardians */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={s.sectionTitle}>Mes gardiens</Text>
            <TouchableOpacity style={s.addGuardianBtn} onPress={() => { setShowAddGuardian(true); setAddResult(null); setGuardianPhone(''); }} data-testid="add-guardian-btn">
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={s.addGuardianBtnT}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {guardians.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={s.emptyText}>Aucun gardien configure</Text>
              <Text style={s.emptyDesc}>Demandez a un proche de s'inscrire en tant que gardien et de vous ajouter.</Text>
            </View>
          ) : (
            guardians.map((g, idx) => (
              <View key={g.id} style={[s.guardianRow, idx === 0 && { borderColor: Colors.success, borderWidth: 1.5 }]} data-testid={`guardian-${g.id}`}>
                <View style={[s.orderBadge, idx === 0 && { backgroundColor: Colors.success }]}>
                  <Text style={s.orderBadgeT}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.guardianName}>{g.name}</Text>
                  <Text style={s.guardianPhone}>{g.phone || g.email || 'Pas de telephone'}</Text>
                  {idx === 0 && <Text style={s.firstGuardian}>Appele en premier</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {idx > 0 && (
                    <TouchableOpacity style={s.orderBtn} onPress={() => moveGuardian(g.id, 'up')} data-testid={`move-up-${g.id}`}>
                      <Ionicons name="chevron-up" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  {idx < guardians.length - 1 && (
                    <TouchableOpacity style={s.orderBtn} onPress={() => moveGuardian(g.id, 'down')} data-testid={`move-down-${g.id}`}>
                      <Ionicons name="chevron-down" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.orderBtn, { backgroundColor: Colors.destructive + '10' }]} onPress={() => removeGuardian(g.id)} data-testid={`remove-${g.id}`}>
                    <Ionicons name="close" size={18} color={Colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {isCare && guardians.length > 0 && (
            <View style={s.protocolInfo}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={s.protocolText}>
                En cas d'alerte, l'IA vous appelle d'abord. Si pas de reponse, elle appelle vos gardiens dans l'ordre ci-dessus.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Alerts */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Dernieres alertes</Text>
          {alerts.length === 0 ? (
            <Text style={s.emptyText}>Aucune alerte recente</Text>
          ) : (
            alerts.slice(0, 5).map(a => (
              <View key={a.id} style={s.alertRow}>
                <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : a.alert_type === 'anomaly' ? 'pulse' : 'warning'} size={18}
                  color={a.status === 'active' ? Colors.destructive : a.status === 'resolved' ? Colors.success : Colors.textMuted} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={s.alertMsg}>{a.message?.substring(0, 60) || a.alert_type}</Text>
                  <Text style={s.alertDate}>{new Date(a.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={[s.alertStatus, { backgroundColor: a.status === 'active' ? Colors.destructive + '15' : a.status === 'resolved' ? Colors.success + '15' : Colors.textMuted + '15' }]}>
                  <Text style={[s.alertStatusT, { color: a.status === 'active' ? Colors.destructive : a.status === 'resolved' ? Colors.success : Colors.textMuted }]}>
                    {a.status === 'active' ? 'Active' : a.status === 'resolved' ? 'Resolue' : a.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* SOS Button */}
        <TouchableOpacity style={s.sosBtn} onPress={async () => {
          try {
            await apiFetch('/api/alerts/sos', { method: 'POST' }, token);
          } catch {}
        }} data-testid="subscription-sos-btn">
          <Ionicons name="alert-circle" size={24} color="#FFF" />
          <Text style={s.sosBtnT}>SOS Urgence</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Guardian Modal */}
      {showAddGuardian && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Ajouter un gardien</Text>
            <Text style={s.modalDesc}>Renseignez le numero de telephone de votre proche. S'il a deja un compte, il recevra une notification. Sinon, un SMS d'invitation lui sera envoye.</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <input
                  data-testid="guardian-phone-input"
                  type="tel"
                  style={{ width: '100%', fontSize: 16, padding: '14px 12px', borderRadius: 12, border: `1.5px solid ${Colors.border}`, outline: 'none', backgroundColor: Colors.subtle, fontFamily: 'inherit', boxSizing: 'border-box' as any }}
                  placeholder="+33 6 12 34 56 78"
                  value={guardianPhone}
                  onChange={(e: any) => setGuardianPhone(e.target.value)}
                />
              </div>
            ) : (
              <View style={{ marginTop: 12, marginBottom: 12 }}>
                <View style={{ backgroundColor: Colors.subtle, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12 }}>
                  <TextInput
                    testID="guardian-phone-input"
                    style={{ fontSize: 16, paddingVertical: 14, color: Colors.textPrimary }}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor={Colors.textMuted}
                    value={guardianPhone}
                    onChangeText={setGuardianPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}
            {addResult && (
              <View style={[s.resultBox, { backgroundColor: addResult.error ? Colors.destructive + '10' : addResult.linked ? Colors.success + '10' : '#FF9800' + '10' }]}>
                <Ionicons name={addResult.error ? "alert-circle" : addResult.linked ? "checkmark-circle" : "send"} size={18} color={addResult.error ? Colors.destructive : addResult.linked ? Colors.success : '#FF9800'} />
                <Text style={[s.resultText, { color: addResult.error ? Colors.destructive : addResult.linked ? Colors.success : '#FF9800' }]}>
                  {addResult.error || addResult.message || 'OK'}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowAddGuardian(false)}>
                <Text style={s.modalCancelBtnT}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirmBtn} onPress={addGuardian} disabled={adding || !guardianPhone.trim()} data-testid="confirm-add-guardian">
                {adding ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.modalConfirmBtnT}>Ajouter</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  sc: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Subscription card
  subCard: { borderRadius: 16, padding: 20 },
  subIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  subType: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  subDesc: { fontSize: 13, color: '#FFF', opacity: 0.8, marginTop: 2 },
  careFeature: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, marginTop: 14 },
  careFeatureT: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  // Guardians
  guardianCount: { fontSize: 12, color: Colors.textMuted },
  guardianRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  orderBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  orderBadgeT: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  guardianName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  guardianPhone: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  firstGuardian: { fontSize: 10, fontWeight: '700', color: Colors.success, marginTop: 2 },
  orderBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  protocolInfo: { flexDirection: 'row', gap: 8, backgroundColor: Colors.primary + '08', borderRadius: 10, padding: 12, marginTop: 8 },
  protocolText: { flex: 1, fontSize: 12, color: Colors.primary, lineHeight: 18 },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  emptyDesc: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  // Alerts
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  alertMsg: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  alertDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  alertStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  alertStatusT: { fontSize: 10, fontWeight: '700' },
  // SOS
  sosBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.destructive, borderRadius: 14, paddingVertical: 16 },
  sosBtnT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  addGuardianBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  addGuardianBtnT: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.background, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginTop: 6 },
  resultBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 8 },
  resultText: { flex: 1, fontSize: 13, fontWeight: '600' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  modalCancelBtnT: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  modalConfirmBtnT: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
