import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [codes, setCodes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'users' | 'alerts' | 'codes' | 'prescriptions'>('stats');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newStructure, setNewStructure] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('50');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, u, a, c, p] = await Promise.all([
          apiFetch('/api/backoffice/stats', {}, token).catch(() => null),
          apiFetch('/api/backoffice/users', {}, token).catch(() => []),
          apiFetch('/api/backoffice/alerts', {}, token).catch(() => []),
          apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
          apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
        ]);
        setStats(s); setUsers(u); setAlerts(a); setCodes(c); setPrescriptions(p);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const createCode = async () => {
    if (!newStructure) return Alert.alert('Erreur', 'Nom de structure requis');
    setCreating(true);
    try {
      const r = await apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ structure_name: newStructure, max_uses: parseInt(newMaxUses) || 50 }) }, token);
      setCodes([r, ...codes]); setShowCodeModal(false); setNewStructure('');
      Alert.alert('Code créé', `Code: ${r.code}\nStructure: ${r.structure_name}`);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setCreating(false); }
  };

  const deactivateCode = async (id: string) => {
    try {
      await apiFetch(`/api/admin/activation-codes/${id}`, { method: 'DELETE' }, token);
      setCodes(codes.map(c => c.id === id ? { ...c, active: false } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const TABS = [
    { id: 'stats', label: 'Stats' }, { id: 'users', label: 'Utilisateurs' },
    { id: 'alerts', label: 'Alertes' }, { id: 'codes', label: 'Codes' }, { id: 'prescriptions', label: 'Presc.' },
  ] as const;

  return (
    <SafeAreaView style={s.safe} testID="backoffice-screen">
      <View style={s.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Back Office</Text><View style={{ width: 36 }} /></View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabScrollC}>
        {TABS.map(t => <TouchableOpacity key={t.id} testID={`bo-${t.id}`} style={[s.tabBtn, tab === t.id && s.tabBtnA]} onPress={() => setTab(t.id)}><Text style={[s.tabBtnT, tab === t.id && s.tabBtnTA]}>{t.label}</Text></TouchableOpacity>)}
      </ScrollView>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
          {tab === 'stats' && stats && (
            <View style={s.grid}>
              {[
                { l: 'Utilisateurs', v: stats.total_users, c: Colors.primary, i: 'people' },
                { l: 'Bénéficiaires', v: stats.beneficiaries, c: Colors.destructive, i: 'heart' },
                { l: 'Gardiens', v: stats.guardians, c: Colors.info, i: 'shield-checkmark' },
                { l: 'Prescripteurs', v: stats.prescribers, c: Colors.accent, i: 'document-text' },
                { l: 'Alertes actives', v: stats.active_alerts, c: Colors.destructive, i: 'alert-circle' },
                { l: 'Total alertes', v: stats.total_alerts, c: Colors.accent, i: 'notifications' },
                { l: 'Prescriptions', v: stats.prescriptions, c: Colors.primary, i: 'document-text' },
                { l: 'Souscrites', v: stats.subscribed_prescriptions, c: Colors.success, i: 'checkmark-circle' },
                { l: 'Interventions', v: stats.interventions, c: Colors.info, i: 'map' },
                { l: 'Téléconsults', v: stats.teleconsults, c: Colors.success, i: 'videocam' },
                { l: 'Appels TA', v: stats.teleassistance_calls, c: Colors.primary, i: 'call' },
                { l: 'Codes actifs', v: stats.activation_codes, c: Colors.accent, i: 'key' },
              ].map(st => (
                <View key={st.l} style={[s.statC, { borderLeftColor: st.c, borderLeftWidth: 3 }]}>
                  <Ionicons name={st.i as any} size={18} color={st.c} /><Text style={[s.statV, { color: st.c }]}>{st.v}</Text><Text style={s.statL}>{st.l}</Text></View>
              ))}
            </View>
          )}

          {tab === 'users' && users.map(u => (
            <View key={u.id} style={s.userR}>
              <View style={[s.userAv, { backgroundColor: (u.role === 'admin' ? Colors.accent : u.role === 'teleassistance' ? Colors.info : u.role === 'guardian' ? Colors.primary : Colors.destructive) + '15' }]}>
                <Text style={[s.userAvT, { color: u.role === 'admin' ? Colors.accent : u.role === 'teleassistance' ? Colors.info : u.role === 'guardian' ? Colors.primary : Colors.destructive }]}>{u.name?.charAt(0)?.toUpperCase()}</Text></View>
              <View style={s.userInfo}>
                <Text style={s.userName}>{u.name}</Text><Text style={s.userEmail}>{u.email} • {u.phone}</Text>
                {u.is_prescriber && <Text style={s.prescTag}>Prescripteur — {u.prescriber_structure}</Text>}
              </View>
              <View style={[s.roleBdg, { backgroundColor: (u.role === 'admin' ? Colors.accent : u.role === 'guardian' ? Colors.primary : Colors.info) + '15' }]}>
                <Text style={[s.roleBdgT, { color: u.role === 'admin' ? Colors.accent : u.role === 'guardian' ? Colors.primary : Colors.info }]}>{u.role}</Text></View>
            </View>
          ))}

          {tab === 'alerts' && alerts.slice(0, 30).map(a => (
            <View key={a.id} style={[s.alertR, { borderLeftColor: a.severity === 'critical' ? Colors.destructive : Colors.accent }]}>
              <View style={s.alertI}><Text style={s.alertM}>{a.message}</Text><Text style={s.alertMt}>{a.beneficiary_name} • {a.alert_type} • {new Date(a.created_at).toLocaleString('fr-FR')}</Text></View>
              <View style={[s.stBdg, { backgroundColor: (a.status === 'active' ? Colors.destructive : Colors.success) + '15' }]}>
                <Text style={[s.stBdgT, { color: a.status === 'active' ? Colors.destructive : Colors.success }]}>{a.status}</Text></View></View>
          ))}

          {tab === 'codes' && (
            <>
              <TouchableOpacity testID="create-code-btn" style={s.createBtn} onPress={() => setShowCodeModal(true)}>
                <Ionicons name="add-circle" size={18} color="#FFF" /><Text style={s.createBtnT}>Créer un code d'activation</Text></TouchableOpacity>
              {codes.map(c => (
                <View key={c.id} style={[s.codeC, !c.active && { opacity: 0.5 }]}>
                  <View style={s.codeTop}><Text style={s.codeVal}>{c.code}</Text>
                    <View style={[s.codeBdg, { backgroundColor: c.active ? Colors.success + '15' : Colors.textMuted + '15' }]}>
                      <Text style={[s.codeBdgT, { color: c.active ? Colors.success : Colors.textMuted }]}>{c.active ? 'Actif' : 'Désactivé'}</Text></View></View>
                  <Text style={s.codeSt}>{c.structure_name}</Text>
                  <Text style={s.codeMeta}>Utilisations: {c.uses_count}/{c.max_uses} • {new Date(c.created_at).toLocaleDateString('fr-FR')}</Text>
                  {c.active && <TouchableOpacity testID={`deactivate-${c.id}`} style={s.deactBtn} onPress={() => deactivateCode(c.id)}>
                    <Text style={s.deactBtnT}>Désactiver</Text></TouchableOpacity>}
                </View>
              ))}
            </>
          )}

          {tab === 'prescriptions' && prescriptions.map(p => (
            <View key={p.id} style={s.prescC}>
              <View style={s.prescTop}><Text style={s.prescName}>{p.beneficiary_name}</Text>
                <View style={[s.stBdg, { backgroundColor: (p.status === 'subscribed' ? Colors.success : Colors.accent) + '15' }]}>
                  <Text style={[s.stBdgT, { color: p.status === 'subscribed' ? Colors.success : Colors.accent }]}>{p.status === 'subscribed' ? 'Souscrit' : 'En attente'}</Text></View></View>
              <Text style={s.prescMeta}>{p.beneficiary_email} • {p.beneficiary_phone}</Text>
              <Text style={s.prescMeta}>Prescripteur: {p.guardian_name} ({p.prescriber_structure})</Text>
              <View style={s.prescFoot}><Text style={s.prescType}>{p.subscription_type}</Text><Text style={s.prescComm}>+{p.commission}€</Text></View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Code Modal */}
      <Modal visible={showCodeModal} transparent animationType="slide">
        <View style={s.modalO}><View style={s.modalC}>
          <Text style={s.modalT}>Nouveau code d'activation</Text>
          <Text style={s.inputL}>Nom de la structure</Text>
          <TextInput testID="code-structure" style={s.modalInp} placeholder="Ex: SAAD Aide à Domicile" placeholderTextColor={Colors.textMuted} value={newStructure} onChangeText={setNewStructure} />
          <Text style={s.inputL}>Nombre max d'utilisations</Text>
          <TextInput testID="code-max" style={s.modalInp} placeholder="50" placeholderTextColor={Colors.textMuted} value={newMaxUses} onChangeText={setNewMaxUses} keyboardType="numeric" />
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCodeModal(false)}><Text style={s.cancelBtnT}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity testID="confirm-code-btn" style={s.confirmBtn} onPress={createCode} disabled={creating}>
              {creating ? <ActivityIndicator color="#FFF" /> : <Text style={s.confirmBtnT}>Créer</Text>}</TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  tabScroll: { maxHeight: 40, marginBottom: 8 }, tabScrollC: { paddingHorizontal: 14, gap: 6 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.subtle },
  tabBtnA: { backgroundColor: Colors.primary }, tabBtnT: { fontSize: 12, fontWeight: '600', color: Colors.textMuted }, tabBtnTA: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, sc: { paddingHorizontal: 18, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statC: { width: '47%', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, alignItems: 'center', gap: 3 },
  statV: { fontSize: 24, fontWeight: '800' }, statL: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  userR: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 10, padding: 10, marginBottom: 5, gap: 8 },
  userAv: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }, userAvT: { fontSize: 14, fontWeight: '700' },
  userInfo: { flex: 1 }, userName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary }, userEmail: { fontSize: 11, color: Colors.textMuted },
  prescTag: { fontSize: 10, fontWeight: '600', color: Colors.accent, marginTop: 2 },
  roleBdg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }, roleBdgT: { fontSize: 9, fontWeight: '700' },
  alertR: { backgroundColor: Colors.paper, borderRadius: 10, padding: 10, marginBottom: 5, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertI: { flex: 1 }, alertM: { fontSize: 12, fontWeight: '500', color: Colors.textPrimary }, alertMt: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  stBdg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }, stBdgT: { fontSize: 9, fontWeight: '700' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, marginBottom: 14 },
  createBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  codeC: { backgroundColor: Colors.paper, borderRadius: 12, padding: 14, marginBottom: 8 },
  codeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  codeVal: { fontSize: 18, fontWeight: '800', color: Colors.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  codeBdg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }, codeBdgT: { fontSize: 10, fontWeight: '700' },
  codeSt: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary }, codeMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  deactBtn: { marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: Colors.destructive + '10' },
  deactBtnT: { fontSize: 12, fontWeight: '600', color: Colors.destructive },
  prescC: { backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6 },
  prescTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prescName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prescMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  prescFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  prescType: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary }, prescComm: { fontSize: 14, fontWeight: '700', color: Colors.success },
  modalO: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 36 },
  modalT: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  inputL: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  modalInp: { backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.subtle, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmBtnT: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
