import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
  const [tab, setTab] = useState<'stats'|'users'|'alerts'|'codes'|'prescriptions'|'interventions'>('stats');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newStructure, setNewStructure] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('50');
  const [creating, setCreating] = useState(false);
  const [interventionCodes, setInterventionCodes] = useState<any[]>([]);
  const [showIvCodeModal, setShowIvCodeModal] = useState(false);
  const [ivStructure, setIvStructure] = useState('');
  const [ivRadius, setIvRadius] = useState('30');

  useEffect(() => {
    (async () => {
      try {
        const [s, u, a, c, p, ic] = await Promise.all([
          apiFetch('/api/backoffice/stats', {}, token).catch(() => null),
          apiFetch('/api/backoffice/users', {}, token).catch(() => []),
          apiFetch('/api/backoffice/alerts', {}, token).catch(() => []),
          apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
          apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
          apiFetch('/api/admin/intervention-codes', {}, token).catch(() => []),
        ]);
        setStats(s); setUsers(u); setAlerts(a); setCodes(c); setPrescriptions(p); setInterventionCodes(ic);
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
    { id: 'stats', label: 'Stats' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'alerts', label: 'Alertes' },
    { id: 'codes', label: 'Codes' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'interventions', label: 'Intervenants' },
  ] as const;

  return (
    <SafeAreaView style={bs.safe} testID="backoffice-screen">
      <View style={bs.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={bs.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={bs.topTitle}>Back Office</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={bs.tabScroll} contentContainerStyle={bs.tabScrollC}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} testID={`bo-${t.id}`} style={[bs.tabBtn, tab === t.id && bs.tabBtnA]} onPress={() => setTab(t.id)}>
            <Text style={[bs.tabBtnT, tab === t.id && bs.tabBtnTA]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <View style={bs.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <ScrollView contentContainerStyle={bs.sc} showsVerticalScrollIndicator={false}>

          {tab === 'stats' && stats && (
            <View style={bs.grid}>
              {[
                { l: 'Utilisateurs', v: stats.total_users },
                { l: 'Bénéficiaires', v: stats.beneficiaries },
                { l: 'Gardiens', v: stats.guardians },
                { l: 'Prescripteurs', v: stats.prescribers },
                { l: 'Alertes actives', v: stats.active_alerts },
                { l: 'Total alertes', v: stats.total_alerts },
                { l: 'Prescriptions', v: stats.prescriptions },
                { l: 'Souscrites', v: stats.subscribed_prescriptions },
                { l: 'Interventions', v: stats.interventions },
                { l: 'Téléconsults', v: stats.teleconsults },
                { l: 'Appels TA', v: stats.teleassistance_calls },
                { l: 'Codes actifs', v: stats.activation_codes },
              ].map(st => (
                <View key={st.l} style={bs.statC}>
                  <Text style={bs.statV}>{st.v}</Text>
                  <Text style={bs.statL}>{st.l}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'users' && users.map(u => (
            <View key={u.id} style={bs.userR}>
              <View style={bs.userAv}><Text style={bs.userAvT}>{u.name?.charAt(0)?.toUpperCase()}</Text></View>
              <View style={bs.userInfo}>
                <Text style={bs.userName}>{u.name}</Text>
                <Text style={bs.userEmail}>{u.email}</Text>
                {u.is_prescriber && <Text style={bs.prescTag}>Prescripteur — {u.prescriber_structure}</Text>}
              </View>
              <View style={bs.roleBdg}><Text style={bs.roleBdgT}>{u.role}</Text></View>
            </View>
          ))}

          {tab === 'alerts' && alerts.slice(0, 30).map(a => (
            <View key={a.id} style={[bs.alertR, a.severity === 'critical' && { borderLeftColor: Colors.destructive }]}>
              <View style={bs.alertI}><Text style={bs.alertM}>{a.message}</Text>
                <Text style={bs.alertMt}>{a.beneficiary_name} · {a.alert_type} · {new Date(a.created_at).toLocaleString('fr-FR')}</Text></View>
              <View style={[bs.stBdg, a.status === 'active' && { backgroundColor: Colors.destructive + '12' }]}>
                <Text style={[bs.stBdgT, a.status === 'active' && { color: Colors.destructive }]}>{a.status}</Text>
              </View>
            </View>
          ))}

          {tab === 'codes' && (
            <>
              <TouchableOpacity testID="create-code-btn" style={bs.createBtn} onPress={() => setShowCodeModal(true)}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={bs.createBtnT}>Créer un code d'activation</Text>
              </TouchableOpacity>
              {codes.map(c => (
                <View key={c.id} style={[bs.codeC, !c.active && { opacity: 0.4 }]}>
                  <View style={bs.codeTop}>
                    <Text style={bs.codeVal}>{c.code}</Text>
                    <View style={[bs.codeBdg, c.active && { backgroundColor: Colors.success + '15' }]}>
                      <Text style={[bs.codeBdgT, c.active && { color: Colors.success }]}>{c.active ? 'Actif' : 'Désactivé'}</Text>
                    </View>
                  </View>
                  <Text style={bs.codeSt}>{c.structure_name}</Text>
                  <Text style={bs.codeMeta}>Utilisations: {c.uses_count}/{c.max_uses} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</Text>
                  {c.active && <TouchableOpacity testID={`deactivate-${c.id}`} style={bs.deactBtn} onPress={() => deactivateCode(c.id)}>
                    <Text style={bs.deactBtnT}>Désactiver</Text></TouchableOpacity>}
                </View>
              ))}
            </>
          )}

          {tab === 'prescriptions' && prescriptions.map(p => (
            <View key={p.id} style={bs.prescC}>
              <View style={bs.prescTop}>
                <Text style={bs.prescName}>{p.beneficiary_name}</Text>
                <View style={[bs.stBdg, p.status === 'subscribed' && { backgroundColor: Colors.success + '12' }]}>
                  <Text style={[bs.stBdgT, p.status === 'subscribed' && { color: Colors.success }]}>{p.status === 'subscribed' ? 'Souscrit' : 'En attente'}</Text>
                </View>
              </View>
              <Text style={bs.prescMeta}>{p.beneficiary_email} · {p.beneficiary_phone}</Text>
              <Text style={bs.prescMeta}>Par: {p.guardian_name} ({p.prescriber_structure})</Text>
              <View style={bs.prescFoot}>
                <Text style={bs.prescType}>{p.subscription_type}</Text>
                <Text style={bs.prescComm}>+{p.commission}€</Text>
              </View>
            </View>
          ))}

        </ScrollView>
      )}

      <Modal visible={showCodeModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={bs.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={bs.modalO}>
              <TouchableWithoutFeedback>
                <View style={bs.modalC}>
                  <Text style={bs.modalT}>Nouveau code d'activation</Text>
                  <Text style={bs.inputL}>Nom de la structure</Text>
                  <TextInput testID="code-structure" style={bs.modalInp} placeholder="Ex: SAAD Aide à Domicile" placeholderTextColor={Colors.textMuted} value={newStructure} onChangeText={setNewStructure} blurOnSubmit={false} />
                  <Text style={bs.inputL}>Nombre max d'utilisations</Text>
                  <TextInput testID="code-max" style={bs.modalInp} placeholder="50" placeholderTextColor={Colors.textMuted} value={newMaxUses} onChangeText={setNewMaxUses} keyboardType="numeric" blurOnSubmit={false} />
                  <View style={bs.modalBtns}>
                    <TouchableOpacity style={bs.cancelBtn} onPress={() => setShowCodeModal(false)}>
                      <Text style={bs.cancelBtnT}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="confirm-code-btn" style={bs.confirmBtn} onPress={createCode} disabled={creating}>
                      {creating ? <ActivityIndicator color="#FFF" /> : <Text style={bs.confirmBtnT}>Créer</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const bs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  tabScroll: { maxHeight: 40, marginBottom: 8 },
  tabScrollC: { paddingHorizontal: 16, gap: 6 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.subtle },
  tabBtnA: { backgroundColor: Colors.primary },
  tabBtnT: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabBtnTA: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 20, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statC: { width: '47%', backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  statV: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  statL: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  userR: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, marginBottom: 5, gap: 8 },
  userAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  userAvT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: 11, color: Colors.textMuted },
  prescTag: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  roleBdg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  roleBdgT: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  alertR: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertI: { flex: 1 },
  alertM: { fontSize: 12, fontWeight: '500', color: Colors.textPrimary },
  alertMt: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  stBdg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.subtle },
  stBdgT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  createBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  codeC: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 8 },
  codeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  codeVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  codeBdg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.subtle },
  codeBdgT: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  codeSt: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  codeMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  deactBtn: { marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: Colors.destructive + '10' },
  deactBtnT: { fontSize: 12, fontWeight: '600', color: Colors.destructive },
  prescC: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 12, marginBottom: 6 },
  prescTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prescName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prescMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  prescFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  prescType: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  prescComm: { fontSize: 14, fontWeight: '700', color: Colors.success },
  modalO: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalT: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  inputL: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInp: { backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmBtnT: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
