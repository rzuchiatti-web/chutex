import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

// ==================== BENEFICIARY: QCM ====================
function BeneficiaryTeleconsult({ token }: { token: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [callInfo, setCallInfo] = useState<any>(null);
  const [freeText, setFreeText] = useState('');
  const [painLevel, setPainLevel] = useState(3);

  useEffect(() => { (async () => { try { const q = await apiFetch('/api/teleconsult/questions', {}, token); setQuestions(q); } catch {} finally { setLoading(false); } })(); }, []);

  const submitQCM = async () => {
    try {
      const a = questions.map(q => ({ question_id: q.id, question: q.question, answer: answers[q.id] || '' }));
      const r = await apiFetch('/api/teleconsult/submit', { method: 'POST', body: JSON.stringify({ answers: a, notes: freeText }) }, token);
      setCallInfo(r); setSubmitted(true);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (submitted && callInfo) return (
    <ScrollView contentContainerStyle={s.sc}>
      <View style={s.successCard}><Ionicons name="checkmark-circle" size={48} color={Colors.success} /><Text style={s.successT}>Demande envoyée !</Text><Text style={s.successSub}>Un médecin vous rappellera sous peu</Text>
        <View style={s.callCard}><Ionicons name="call" size={20} color={Colors.primary} /><Text style={s.callNum}>{callInfo.call_number}</Text></View>
        <Text style={s.callNote}>Appelez ce numéro 24/7</Text>
        <TouchableOpacity testID="new-consult-btn" style={s.newBtn} onPress={() => { setSubmitted(false); setStep(0); setAnswers({}); }}><Text style={s.newBtnT}>Nouvelle consultation</Text></TouchableOpacity></View></ScrollView>);

  const q = questions[step];
  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      <View style={s.prog}>{questions.map((_, i) => <View key={i} style={[s.progDot, i <= step && { backgroundColor: Colors.primary }]} />)}</View>
      <Text style={s.stepL}>Question {step + 1} / {questions.length}</Text>
      {q && <View style={s.qCard}><Text style={s.qText}>{q.question}</Text>
        {q.type === 'choice' && q.options?.map((o: string, i: number) => (
          <TouchableOpacity key={i} testID={`opt-${i}`} style={[s.optBtn, answers[q.id] === o && s.optBtnA]} onPress={() => setAnswers({ ...answers, [q.id]: o })}>
            <View style={[s.radio, answers[q.id] === o && s.radioA]}>{answers[q.id] === o && <View style={s.radioI} />}</View><Text style={[s.optT, answers[q.id] === o && s.optTA]}>{o}</Text></TouchableOpacity>))}
        {q.type === 'scale' && <View style={s.scaleC}><Text style={s.scaleV}>{painLevel}</Text><View style={s.scaleR}>
          {[0,1,2,3,4,5,6,7,8,9,10].map(n => <TouchableOpacity key={n} testID={`sc-${n}`} style={[s.scaleB, painLevel === n && { backgroundColor: n <= 3 ? Colors.success : n <= 6 ? Colors.accent : Colors.destructive }]}
            onPress={() => { setPainLevel(n); setAnswers({ ...answers, [q.id]: n.toString() }); }}><Text style={[s.scaleBT, painLevel === n && { color: '#FFF' }]}>{n}</Text></TouchableOpacity>)}</View></View>}
        {q.type === 'text' && <TextInput testID="qcm-text" style={s.textInp} placeholder="Décrivez..." placeholderTextColor={Colors.textMuted} value={freeText} onChangeText={v => { setFreeText(v); setAnswers({ ...answers, [q.id]: v }); }} multiline />}
      </View>}
      <View style={s.navR}>{step > 0 && <TouchableOpacity testID="prev-btn" style={s.prevB} onPress={() => setStep(step - 1)}><Ionicons name="chevron-back" size={16} color={Colors.textSecondary} /><Text style={s.prevBT}>Précédent</Text></TouchableOpacity>}
        <View style={{ flex: 1 }} />{step < questions.length - 1 ? <TouchableOpacity testID="next-btn" style={s.nextB} onPress={() => setStep(step + 1)}><Text style={s.nextBT}>Suivant</Text><Ionicons name="chevron-forward" size={16} color="#FFF" /></TouchableOpacity>
          : <TouchableOpacity testID="submit-qcm" style={s.submitB} onPress={submitQCM}><Ionicons name="send" size={14} color="#FFF" /><Text style={s.submitBT}>Envoyer</Text></TouchableOpacity>}</View>
    </ScrollView>);
}

// ==================== TELEASSISTANCE: AI CALL SIMULATION ====================
function TeleassistanceDashboard({ token }: { token: string }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [protocol, setProtocol] = useState<any[]>([]);
  const [callStep, setCallStep] = useState(0);
  const [callAnswers, setCallAnswers] = useState<any>({});
  const [callNotes, setCallNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<'alerts' | 'calls'>('alerts');

  const fetchData = useCallback(async () => {
    try {
      const [a, c, p] = await Promise.all([
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/calls', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/protocol/beneficiary', {}, token).catch(() => []),
      ]);
      setAlerts(a.filter((x: any) => x.status === 'active')); setCalls(c); setProtocol(p);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startCall = (alert: any) => { setActiveCall(alert); setCallStep(0); setCallAnswers({}); setCallNotes(''); };

  const resolveCall = async (resolution: string) => {
    if (!activeCall) return;
    setProcessing(true);
    try {
      const ans = protocol.map(p => ({ question_id: p.id, question: p.question, answer: callAnswers[p.id] || 'Pas de réponse' }));
      const r = await apiFetch('/api/teleassistance/call', { method: 'POST',
        body: JSON.stringify({ alert_id: activeCall.id, step: 'doubt_resolution', answers: ans, notes: callNotes, resolution }) }, token);
      Alert.alert('Appel traité', r.ai_analysis || 'Traitement terminé');
      setActiveCall(null); fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setProcessing(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  // Active call simulation
  if (activeCall) {
    const q = protocol[callStep];
    return (
      <ScrollView contentContainerStyle={s.sc}>
        <View style={s.callHeader}>
          <View style={s.callPulse}><Ionicons name="call" size={28} color="#FFF" /></View>
          <Text style={s.callTitle}>Appel en cours</Text>
          <Text style={s.callSub}>{activeCall.beneficiary_name} — {activeCall.message}</Text>
        </View>
        <View style={s.prog}>{protocol.map((_, i) => <View key={i} style={[s.progDot, i <= callStep && { backgroundColor: Colors.info }]} />)}</View>
        {q && <View style={s.qCard}><Text style={s.qText}>{q.question}</Text>
          {q.options?.map((o: string, i: number) => (
            <TouchableOpacity key={i} testID={`call-opt-${i}`} style={[s.optBtn, callAnswers[q.id] === o && s.optBtnA]}
              onPress={() => setCallAnswers({ ...callAnswers, [q.id]: o })}>
              <View style={[s.radio, callAnswers[q.id] === o && s.radioA]}>{callAnswers[q.id] === o && <View style={s.radioI} />}</View>
              <Text style={[s.optT, callAnswers[q.id] === o && s.optTA]}>{o}</Text></TouchableOpacity>))}
        </View>}
        <TextInput testID="call-notes" style={s.textInp} placeholder="Notes de l'opérateur..." placeholderTextColor={Colors.textMuted} value={callNotes} onChangeText={setCallNotes} multiline />
        <View style={s.navR}>{callStep > 0 && <TouchableOpacity style={s.prevB} onPress={() => setCallStep(callStep - 1)}><Text style={s.prevBT}>Précédent</Text></TouchableOpacity>}
          <View style={{ flex: 1 }} />{callStep < protocol.length - 1 && <TouchableOpacity style={s.nextB} onPress={() => setCallStep(callStep + 1)}><Text style={s.nextBT}>Suivant</Text></TouchableOpacity>}</View>
        <Text style={[s.secTitle, { marginTop: 16 }]}>Résolution</Text>
        <TouchableOpacity testID="resolve-ok" style={[s.resBtn, { backgroundColor: Colors.success }]} onPress={() => resolveCall('resolved')} disabled={processing}>
          <Ionicons name="checkmark-circle" size={18} color="#FFF" /><Text style={s.resBT}>Levée de doute — Tout va bien</Text></TouchableOpacity>
        <TouchableOpacity testID="resolve-guardian" style={[s.resBtn, { backgroundColor: Colors.accent }]} onPress={() => resolveCall('escalate_guardian')} disabled={processing}>
          <Ionicons name="call" size={18} color="#FFF" /><Text style={s.resBT}>Appeler les gardiens</Text></TouchableOpacity>
        <TouchableOpacity testID="resolve-intervention" style={[s.resBtn, { backgroundColor: Colors.destructive }]} onPress={() => resolveCall('dispatch_intervention')} disabled={processing}>
          <MaterialCommunityIcons name="ambulance" size={18} color="#FFF" /><Text style={s.resBT}>Dispatcher intervention</Text></TouchableOpacity>
        <TouchableOpacity style={s.cancelCall} onPress={() => setActiveCall(null)}><Text style={s.cancelCallT}>Annuler l'appel</Text></TouchableOpacity>
      </ScrollView>);
  }

  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      <View style={s.tabRow}>
        <TouchableOpacity testID="ta-tab-alerts" style={[s.tabBtn, tab === 'alerts' && s.tabBtnA]} onPress={() => setTab('alerts')}><Text style={[s.tabBtnT, tab === 'alerts' && s.tabBtnTA]}>Alertes ({alerts.length})</Text></TouchableOpacity>
        <TouchableOpacity testID="ta-tab-calls" style={[s.tabBtn, tab === 'calls' && s.tabBtnA]} onPress={() => setTab('calls')}><Text style={[s.tabBtnT, tab === 'calls' && s.tabBtnTA]}>Historique appels</Text></TouchableOpacity>
      </View>
      {tab === 'alerts' && (alerts.length > 0 ? alerts.map(a => (
        <View key={a.id} style={[s.alertCard, a.severity === 'critical' && s.alertCrit]}>
          <View style={s.alertTop}><Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={20} color={a.severity === 'critical' ? Colors.destructive : Colors.accent} />
            <View style={s.alertInfo}><Text style={s.alertMsg}>{a.message}</Text><Text style={s.alertMeta}>{a.beneficiary_name} • {new Date(a.created_at).toLocaleString('fr-FR')}</Text></View>
            <View style={[s.taBadge, { backgroundColor: (a.teleassistance_status === 'pending' ? Colors.accent : Colors.info) + '15' }]}>
              <Text style={[s.taBadgeT, { color: a.teleassistance_status === 'pending' ? Colors.accent : Colors.info }]}>{a.teleassistance_status || 'pending'}</Text></View></View>
          <TouchableOpacity testID={`call-${a.id}`} style={s.callBtn} onPress={() => startCall(a)}>
            <Ionicons name="call" size={16} color="#FFF" /><Text style={s.callBtnT}>Lancer l'appel IA</Text></TouchableOpacity>
        </View>
      )) : <View style={s.emptyC}><Ionicons name="checkmark-circle" size={36} color={Colors.success} /><Text style={s.emptyT}>Aucune alerte active</Text></View>)}
      {tab === 'calls' && (calls.length > 0 ? calls.map(c => (
        <View key={c.id} style={s.callLogCard}>
          <View style={[s.clDot, { backgroundColor: c.resolution === 'resolved' ? Colors.success : c.resolution === 'escalate_guardian' ? Colors.accent : Colors.destructive }]} />
          <View style={s.clInfo}><Text style={s.clName}>{c.beneficiary_name}</Text><Text style={s.clRes}>{c.resolution === 'resolved' ? 'Résolu' : c.resolution === 'escalate_guardian' ? 'Gardien appelé' : 'Intervention'}</Text></View>
          <Text style={s.clDate}>{new Date(c.created_at).toLocaleString('fr-FR')}</Text>
        </View>
      )) : <View style={s.emptyC}><Text style={s.emptyT}>Aucun appel</Text></View>)}
    </ScrollView>);
}

// ==================== GUARDIAN: INTERVENTIONS ====================
function GuardianInterventions({ token }: { token: string }) {
  const router = useRouter();
  const [ivs, setIvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setIvs(await apiFetch('/api/interventions', {}, token)); } catch {} finally { setLoading(false); } })(); }, []);
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  return (
    <ScrollView contentContainerStyle={s.sc}>
      {ivs.length > 0 ? ivs.map(iv => (
        <TouchableOpacity key={iv.id} testID={`iv-${iv.id}`} style={s.ivCard} onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: iv.id } })}>
          <View style={[s.ivDot, { backgroundColor: iv.status === 'completed' ? Colors.success : Colors.accent }]} />
          <View style={s.ivInfo}><Text style={s.ivName}>{iv.beneficiary_name}</Text><Text style={s.ivSt}>{iv.status === 'en_route' ? 'En route' : iv.status === 'completed' ? 'Terminé' : iv.status}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /></TouchableOpacity>
      )) : <View style={s.emptyC}><MaterialCommunityIcons name="map-marker-radius" size={32} color={Colors.textMuted} /><Text style={s.emptyT}>Aucune intervention</Text></View>}
    </ScrollView>);
}

// ==================== ADMIN: MANAGEMENT ====================
function AdminManagement({ token }: { token: string }) {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={s.sc}>
      {[
        { label: 'Back Office complet', icon: 'settings', desc: 'Stats, utilisateurs, alertes', route: '/backoffice' },
      ].map(item => (
        <TouchableOpacity key={item.label} testID={`admin-${item.label}`} style={s.adminCard} onPress={() => router.push(item.route as any)}>
          <Ionicons name={item.icon as any} size={22} color={Colors.primary} /><View style={s.adminInfo}><Text style={s.adminLabel}>{item.label}</Text><Text style={s.adminDesc}>{item.desc}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /></TouchableOpacity>
      ))}
    </ScrollView>);
}

// ==================== MAIN ====================
export default function TeleconsultScreen() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  const r = user.role;
  return (
    <SafeAreaView style={s.safe} testID="teleconsult-screen">
      <View style={s.header}><Text style={s.title}>{r === 'teleassistance' ? 'Téléassistance IA' : r === 'guardian' ? 'Interventions' : r === 'admin' ? 'Gestion' : 'Téléconsultation'}</Text>
        {r === 'teleassistance' && <Text style={s.subtitle}>Plateau d'écoute IA — Levée de doute</Text>}
        {r === 'beneficiary' && <Text style={s.subtitle}>Questionnaire avant consultation</Text>}</View>
      {r === 'teleassistance' ? <TeleassistanceDashboard token={token} /> : r === 'guardian' ? <GuardianInterventions token={token} /> : r === 'admin' ? <AdminManagement token={token} /> : <BeneficiaryTeleconsult token={token} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary }, subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sc: { paddingHorizontal: 18, paddingBottom: 24 },
  secTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  prog: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 4 },
  progDot: { width: 22, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  stepL: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 10 },
  qCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 16, marginBottom: 12 },
  qText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14, lineHeight: 22 },
  optBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 6, gap: 10 },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioA: { borderColor: Colors.primary }, radioI: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
  optT: { fontSize: 14, color: Colors.textSecondary, flex: 1 }, optTA: { color: Colors.primary, fontWeight: '600' },
  scaleC: { alignItems: 'center' }, scaleV: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  scaleR: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  scaleB: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  scaleBT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  textInp: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  navR: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  prevB: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.subtle },
  prevBT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  nextB: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.primary },
  nextBT: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  submitB: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.success },
  submitBT: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  successCard: { backgroundColor: Colors.paper, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 16 },
  successT: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 10 },
  successSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  callCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary + '10', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  callNum: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  callNote: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  newBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.subtle },
  newBtnT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  // Teleassistance
  callHeader: { alignItems: 'center', marginBottom: 14 },
  callPulse: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  callTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  callSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  resBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, marginBottom: 8 },
  resBT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cancelCall: { alignItems: 'center', paddingVertical: 12 }, cancelCallT: { fontSize: 13, color: Colors.textMuted },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.subtle },
  tabBtnA: { backgroundColor: Colors.primary },
  tabBtnT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted }, tabBtnTA: { color: '#FFF' },
  alertCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  alertCrit: { borderLeftColor: Colors.destructive },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  alertInfo: { flex: 1 }, alertMsg: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary }, alertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  taBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }, taBadgeT: { fontSize: 10, fontWeight: '700' },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.info },
  callBtnT: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  callLogCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  clDot: { width: 10, height: 10, borderRadius: 5 }, clInfo: { flex: 1 },
  clName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary }, clRes: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  clDate: { fontSize: 11, color: Colors.textMuted },
  emptyC: { alignItems: 'center', paddingVertical: 36 }, emptyT: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
  ivCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  ivDot: { width: 10, height: 10, borderRadius: 5 }, ivInfo: { flex: 1 },
  ivName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary }, ivSt: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  adminCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 14, padding: 16, marginBottom: 10, gap: 12 },
  adminInfo: { flex: 1 }, adminLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary }, adminDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
