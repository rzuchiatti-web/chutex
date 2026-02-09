import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

/* ===== BENEFICIARY: QCM ===== */
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
      <View style={s.successCard}>
        <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
        <Text style={s.successT}>Demande envoyée</Text>
        <Text style={s.successSub}>Un médecin vous rappellera sous peu</Text>
        <View style={s.callCard}><Ionicons name="call" size={18} color={Colors.textPrimary} /><Text style={s.callNum}>{callInfo.call_number}</Text></View>
        <TouchableOpacity testID="new-consult-btn" style={s.newBtn} onPress={() => { setSubmitted(false); setStep(0); setAnswers({}); }}>
          <Text style={s.newBtnT}>Nouvelle consultation</Text></TouchableOpacity>
      </View>
    </ScrollView>);

  const q = questions[step];
  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      <View style={s.prog}>{questions.map((_, i) => <View key={i} style={[s.progDot, i <= step && { backgroundColor: Colors.primary }]} />)}</View>
      <Text style={s.stepL}>Étape {step + 1} / {questions.length}</Text>
      {q && <View style={s.qCard}><Text style={s.qText}>{q.question}</Text>
        {q.type === 'choice' && q.options?.map((o: string, i: number) => (
          <TouchableOpacity key={i} testID={`opt-${i}`} style={[s.optBtn, answers[q.id] === o && s.optBtnA]} onPress={() => setAnswers({ ...answers, [q.id]: o })}>
            <View style={[s.radio, answers[q.id] === o && s.radioA]}>{answers[q.id] === o && <View style={s.radioI} />}</View>
            <Text style={[s.optT, answers[q.id] === o && s.optTA]}>{o}</Text></TouchableOpacity>))}
        {q.type === 'scale' && <View style={s.scaleC}><Text style={s.scaleV}>{painLevel}</Text><View style={s.scaleR}>
          {[0,1,2,3,4,5,6,7,8,9,10].map(n => <TouchableOpacity key={n} testID={`sc-${n}`} style={[s.scaleB, painLevel === n && { backgroundColor: Colors.primary }]}
            onPress={() => { setPainLevel(n); setAnswers({ ...answers, [q.id]: n.toString() }); }}><Text style={[s.scaleBT, painLevel === n && { color: '#FFF' }]}>{n}</Text></TouchableOpacity>)}</View></View>}
        {q.type === 'text' && <TextInput testID="qcm-text" style={s.textInp} placeholder="Décrivez..." placeholderTextColor={Colors.textMuted} value={freeText} onChangeText={v => { setFreeText(v); setAnswers({ ...answers, [q.id]: v }); }} multiline />}
      </View>}
      <View style={s.navR}>{step > 0 && <TouchableOpacity style={s.prevB} onPress={() => setStep(step - 1)}><Ionicons name="chevron-back" size={16} color={Colors.textSecondary} /><Text style={s.prevBT}>Précédent</Text></TouchableOpacity>}
        <View style={{ flex: 1 }} />{step < questions.length - 1 ? <TouchableOpacity style={s.nextB} onPress={() => setStep(step + 1)}><Text style={s.nextBT}>Suivant</Text><Ionicons name="chevron-forward" size={16} color="#FFF" /></TouchableOpacity>
          : <TouchableOpacity testID="submit-qcm" style={s.submitB} onPress={submitQCM}><Ionicons name="send" size={14} color="#FFF" /><Text style={s.submitBT}>Envoyer</Text></TouchableOpacity>}</View>
    </ScrollView>);
}

/* ===== TELEASSISTANCE: ESCALATION FLOW ===== */
function TeleassistanceDashboard({ token }: { token: string }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEsc, setActiveEsc] = useState<any>(null);
  const [protocol, setProtocol] = useState<any[]>([]);
  const [callStep, setCallStep] = useState(0);
  const [callAnswers, setCallAnswers] = useState<any>({});
  const [callNotes, setCallNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<'alerts'|'escalations'>('alerts');

  const fetchData = useCallback(async () => {
    try {
      const [a, e, p] = await Promise.all([
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/escalations', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/protocol/beneficiary', {}, token).catch(() => []),
      ]);
      setAlerts(a.filter((x: any) => x.status === 'active')); setEscalations(e); setProtocol(p);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Auto-refresh every 5 seconds for real-time monitoring
  useEffect(() => { const iv = setInterval(fetchData, 5000); return () => clearInterval(iv); }, [fetchData]);

  const startEscalation = async (alert: any) => {
    setProcessing(true);
    try {
      const esc = await apiFetch('/api/teleassistance/escalation/start', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token);
      setActiveEsc(esc); setCallStep(0); setCallAnswers({}); setCallNotes('');
      // Trigger real Twilio call to beneficiary
      try {
        const callRes = await apiFetch('/api/twilio/call/beneficiary', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token);
        Alert.alert('📞 Appel lancé', `Appel en cours vers ${esc.beneficiary_name}...\nSID: ${callRes.call_sid?.slice(0,12)}...`);
      } catch (callErr: any) { Alert.alert('⚠️ Appel', `Escalade démarrée mais appel échoué: ${callErr.message}`); }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setProcessing(false); }
  };

  const advanceStep = async (response: string) => {
    if (!activeEsc) return;
    setProcessing(true);
    try {
      const ans = protocol.map(p => ({ question_id: p.id, question: p.question, answer: callAnswers[p.id] || '' }));
      const updated = await apiFetch('/api/teleassistance/escalation/step', { method: 'POST',
        body: JSON.stringify({ escalation_id: activeEsc.id, response, answers: ans, notes: callNotes }) }, token);
      setActiveEsc(updated);
      if (['resolved', 'dispatched', 'guardian_handling'].includes(updated.status)) {
        Alert.alert('Terminé', getStepMessage(updated));
        setActiveEsc(null); fetchData();
      }
      setCallAnswers({}); setCallNotes(''); setCallStep(0);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setProcessing(false); }
  };

  const getStepMessage = (esc: any) => {
    if (esc.status === 'resolved') return 'Levée de doute réussie. Alerte résolue.';
    if (esc.status === 'guardian_handling') return `Gardien ${esc.current_target?.name} prend en charge.`;
    if (esc.status === 'dispatched') return `Intervention #${esc.intervention_id?.slice(0,8)} créée et dispatchée.`;
    return '';
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  /* ACTIVE ESCALATION UI */
  if (activeEsc) {
    const step = activeEsc.current_step;
    const target = activeEsc.current_target;
    const isCallingBen = step === 'calling_beneficiary';
    const isDoubt = step === 'doubt_lifting';
    const isCallingGuardian = step === 'calling_guardian';
    const isDispatchNeeded = step === 'dispatch_needed';

    return (
      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Call Header */}
        <View style={s.escHeader}>
          <View style={[s.escPulse, isCallingBen && { backgroundColor: Colors.primary }, isCallingGuardian && { backgroundColor: '#555' }, isDispatchNeeded && { backgroundColor: Colors.destructive }]}>
            <Ionicons name={isDispatchNeeded ? 'warning' : 'call'} size={28} color="#FFF" />
          </View>
          <Text style={s.escTitle}>
            {isCallingBen ? 'Appel bénéficiaire' : isDoubt ? 'Levée de doute' : isCallingGuardian ? `Appel gardien` : isDispatchNeeded ? 'Dispatcher intervention' : step}
          </Text>
          <Text style={s.escSub}>{target?.name} — {activeEsc.beneficiary_name}</Text>
        </View>

        {/* Timeline */}
        <View style={s.tlCard}>
          <Text style={s.tlTitle}>Chronologie</Text>
          {activeEsc.timeline?.map((t: any, i: number) => (
            <View key={i} style={s.tlRow}>
              <View style={[s.tlDot, i === activeEsc.timeline.length - 1 && { backgroundColor: Colors.primary }]} />
              <Text style={s.tlText}>{t.note}</Text>
            </View>
          ))}
        </View>

        {/* Doubt Lifting Questions */}
        {isDoubt && protocol.length > 0 && (
          <View style={s.qCard}>
            <Text style={s.qLabel}>Protocole de levée de doute</Text>
            {protocol.map((q: any, qi: number) => (
              <View key={q.id} style={s.qItem}>
                <Text style={s.qText}>{q.question}</Text>
                {q.options?.map((o: string, oi: number) => (
                  <TouchableOpacity key={oi} testID={`doubt-${qi}-${oi}`} style={[s.optBtn, callAnswers[q.id] === o && s.optBtnA]} onPress={() => setCallAnswers({ ...callAnswers, [q.id]: o })}>
                    <View style={[s.radio, callAnswers[q.id] === o && s.radioA]}>{callAnswers[q.id] === o && <View style={s.radioI} />}</View>
                    <Text style={[s.optT, callAnswers[q.id] === o && s.optTA]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        <TextInput testID="esc-notes" style={s.textInp} placeholder="Notes de l'opérateur..." placeholderTextColor={Colors.textMuted} value={callNotes} onChangeText={setCallNotes} multiline />

        {/* Action Buttons based on step */}
        <Text style={s.actionTitle}>Actions</Text>

        {isCallingBen && (
          <>
            <TouchableOpacity testID="ben-answered" style={[s.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => advanceStep('answered')} disabled={processing}>
              <Ionicons name="call" size={16} color="#FFF" /><Text style={s.actionBtnT}>Bénéficiaire a répondu</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="ben-no-answer" style={[s.actionBtn, { backgroundColor: Colors.textSecondary }]} onPress={() => advanceStep('no_answer')} disabled={processing}>
              <Ionicons name="call-outline" size={16} color="#FFF" /><Text style={s.actionBtnT}>Pas de réponse → Appeler gardien</Text>
            </TouchableOpacity>
          </>
        )}

        {isDoubt && (
          <>
            <TouchableOpacity testID="doubt-resolved" style={[s.actionBtn, { backgroundColor: Colors.success }]} onPress={() => advanceStep('resolved')} disabled={processing}>
              <Ionicons name="checkmark-circle" size={16} color="#FFF" /><Text style={s.actionBtnT}>Tout va bien — Résolu</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="doubt-not-resolved" style={[s.actionBtn, { backgroundColor: Colors.textSecondary }]} onPress={() => advanceStep('not_resolved')} disabled={processing}>
              <Ionicons name="alert-circle" size={16} color="#FFF" /><Text style={s.actionBtnT}>Non concluant → Escalader</Text>
            </TouchableOpacity>
          </>
        )}

        {isCallingGuardian && (
          <>
            <TouchableOpacity testID="call-guardian-real" style={[s.actionBtn, { backgroundColor: Colors.primary }]} onPress={async () => {
              if (!activeEsc?.current_target?.id) return;
              try {
                const r = await apiFetch('/api/twilio/call/guardian', { method: 'POST', body: JSON.stringify({
                  alert_id: activeEsc.alert_id, guardian_id: activeEsc.current_target.id, phone_number: activeEsc.current_target.phone || ''
                }) }, token);
                Alert.alert('📞 Appel gardien', `Appel en cours vers ${activeEsc.current_target.name}...`);
              } catch (e: any) { Alert.alert('Appel échoué', e.message); }
            }} disabled={processing}>
              <Ionicons name="call" size={16} color="#FFF" /><Text style={s.actionBtnT}>Appeler {activeEsc?.current_target?.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="guardian-answered" style={[s.actionBtn, { backgroundColor: Colors.success }]} onPress={() => advanceStep('answered')} disabled={processing}>
              <Ionicons name="checkmark-circle" size={16} color="#FFF" /><Text style={s.actionBtnT}>Gardien prend en charge</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="guardian-no-answer" style={[s.actionBtn, { backgroundColor: Colors.textSecondary }]} onPress={() => advanceStep('no_answer')} disabled={processing}>
              <Ionicons name="call-outline" size={16} color="#FFF" /><Text style={s.actionBtnT}>Pas de réponse → Gardien suivant</Text>
            </TouchableOpacity>
          </>
        )}

        {isDispatchNeeded && (
          <TouchableOpacity testID="dispatch" style={[s.actionBtn, { backgroundColor: Colors.destructive }]} onPress={() => advanceStep('dispatch')} disabled={processing}>
            <MaterialCommunityIcons name="ambulance" size={16} color="#FFF" /><Text style={s.actionBtnT}>Dispatcher intervention d'urgence</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.cancelBtn} onPress={() => { setActiveEsc(null); fetchData(); }}>
          <Text style={s.cancelBtnT}>Annuler l'escalade</Text>
        </TouchableOpacity>

        {processing && <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />}
      </ScrollView>
    );
  }

  /* DASHBOARD */
  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      <View style={s.tabRow}>
        <TouchableOpacity testID="ta-tab-alerts" style={[s.tabBtn, tab === 'alerts' && s.tabBtnA]} onPress={() => setTab('alerts')}>
          <Text style={[s.tabBtnT, tab === 'alerts' && s.tabBtnTA]}>Alertes ({alerts.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="ta-tab-escalations" style={[s.tabBtn, tab === 'escalations' && s.tabBtnA]} onPress={() => setTab('escalations')}>
          <Text style={[s.tabBtnT, tab === 'escalations' && s.tabBtnTA]}>Escalades ({escalations.length})</Text>
        </TouchableOpacity>
      </View>

      {tab === 'alerts' && (alerts.length > 0 ? alerts.map(a => (
        <View key={a.id} style={[s.taAlertCard, a.severity === 'critical' && { borderLeftColor: Colors.destructive }]}>
          <View style={s.taAlertTop}>
            <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={18} color={a.severity === 'critical' ? Colors.destructive : Colors.textMuted} />
            <View style={s.taAlertInfo}><Text style={s.taAlertMsg}>{a.message}</Text><Text style={s.taAlertMeta}>{a.beneficiary_name} · {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text></View>
            <View style={[s.taBadge, a.teleassistance_status !== 'pending' && { backgroundColor: Colors.primary + '12' }]}>
              <Text style={[s.taBadgeT, a.teleassistance_status !== 'pending' && { color: Colors.primary }]}>{a.teleassistance_status || 'pending'}</Text>
            </View>
          </View>
          <TouchableOpacity testID={`start-esc-${a.id}`} style={s.startEscBtn} onPress={() => startEscalation(a)} disabled={processing}>
            <Ionicons name="call" size={14} color="#FFF" /><Text style={s.startEscBtnT}>Lancer protocole d'appel IA</Text>
          </TouchableOpacity>
        </View>
      )) : <View style={s.emptyC}><Ionicons name="checkmark-circle" size={36} color={Colors.textMuted} /><Text style={s.emptyT}>Aucune alerte active</Text></View>)}

      {tab === 'escalations' && (escalations.length > 0 ? escalations.map(e => (
        <View key={e.id} style={s.escLogCard}>
          <View style={[s.escLogDot, { backgroundColor: e.status === 'resolved' ? Colors.success : e.status === 'dispatched' ? Colors.destructive : Colors.primary }]} />
          <View style={s.escLogInfo}>
            <Text style={s.escLogName}>{e.beneficiary_name}</Text>
            <Text style={s.escLogRes}>{e.status === 'resolved' ? 'Résolu' : e.status === 'dispatched' ? 'Intervention dispatchée' : e.status === 'guardian_handling' ? 'Gardien' : 'En cours'}</Text>
          </View>
          <Text style={s.escLogDate}>{new Date(e.created_at).toLocaleString('fr-FR')}</Text>
          {e.intervention_id && (
            <TouchableOpacity onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: e.intervention_id } })}>
              <Ionicons name="map-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )) : <View style={s.emptyC}><Text style={s.emptyT}>Aucune escalade</Text></View>)}
    </ScrollView>
  );
}

/* ===== GUARDIAN: INTERVENTIONS ===== */
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
          <View style={[s.ivDot, { backgroundColor: iv.status === 'completed' ? Colors.success : Colors.primary }]} />
          <View style={s.ivInfo}><Text style={s.ivName}>{iv.beneficiary_name}</Text><Text style={s.ivSt}>{iv.status === 'en_route' ? 'En route' : iv.status === 'dispatched' ? 'Dispatché' : iv.status === 'completed' ? 'Terminé' : iv.status}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /></TouchableOpacity>
      )) : <View style={s.emptyC}><MaterialCommunityIcons name="map-marker-radius" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Aucune intervention</Text></View>}
    </ScrollView>);
}

/* ===== ADMIN: MANAGEMENT ===== */
function AdminManagement({ token }: { token: string }) {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={s.sc}>
      <TouchableOpacity style={s.adminCard} onPress={() => router.push('/backoffice')}>
        <Ionicons name="settings-outline" size={20} color={Colors.primary} />
        <View style={s.adminInfo}><Text style={s.adminLabel}>Back Office complet</Text><Text style={s.adminDesc}>Stats, utilisateurs, codes, alertes</Text></View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>);
}

/* ===== MAIN ===== */
export default function TeleconsultScreen() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  const r = user.role;
  return (
    <SafeAreaView style={s.safe} testID="teleconsult-screen">
      <View style={s.header}>
        <Text style={s.title}>{r === 'teleassistance' ? 'Téléassistance IA' : r === 'guardian' ? 'Interventions' : r === 'admin' ? 'Gestion' : 'Téléconsultation'}</Text>
        {r === 'teleassistance' && <Text style={s.subtitle}>Plateau d'écoute — Protocole d'escalade</Text>}
        {r === 'beneficiary' && <Text style={s.subtitle}>Questionnaire pré-consultation</Text>}
      </View>
      {r === 'teleassistance' ? <TeleassistanceDashboard token={token} />
        : r === 'guardian' ? <GuardianInterventions token={token} />
        : r === 'admin' ? <AdminManagement token={token} />
        : <BeneficiaryTeleconsult token={token} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.3 },
  sc: { paddingHorizontal: 20, paddingBottom: 30 },
  // QCM
  prog: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 4 },
  progDot: { width: 24, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  stepL: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 12 },
  qCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 12 },
  qLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  qItem: { marginBottom: 16 },
  qText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, lineHeight: 22 },
  optBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 6, gap: 10 },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioA: { borderColor: Colors.primary },
  radioI: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
  optT: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  optTA: { color: Colors.textPrimary, fontWeight: '600' },
  scaleC: { alignItems: 'center' },
  scaleV: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  scaleR: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  scaleB: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  scaleBT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  textInp: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  navR: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  prevB: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.subtle },
  prevBT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  nextB: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.primary },
  nextBT: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  submitB: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.primary },
  submitBT: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  successCard: { backgroundColor: Colors.subtle, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 16 },
  successT: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 10 },
  successSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  callCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  callNum: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  newBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  newBtnT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  // Teleassistance
  escHeader: { alignItems: 'center', marginBottom: 16 },
  escPulse: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  escTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  escSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  tlCard: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 14 },
  tlTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tlDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, backgroundColor: Colors.border },
  tlText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  actionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  actionBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelBtnT: { fontSize: 13, color: Colors.textMuted },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.subtle },
  tabBtnA: { backgroundColor: Colors.primary },
  tabBtnT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabBtnTA: { color: '#FFF' },
  taAlertCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.border },
  taAlertTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  taAlertInfo: { flex: 1 },
  taAlertMsg: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  taAlertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  taBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  taBadgeT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  startEscBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary },
  startEscBtnT: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  escLogCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  escLogDot: { width: 10, height: 10, borderRadius: 5 },
  escLogInfo: { flex: 1 },
  escLogName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  escLogRes: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  escLogDate: { fontSize: 10, color: Colors.textMuted },
  emptyC: { alignItems: 'center', paddingVertical: 36 },
  emptyT: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  ivCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  ivDot: { width: 10, height: 10, borderRadius: 5 },
  ivInfo: { flex: 1 },
  ivName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ivSt: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  adminCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 10, gap: 12 },
  adminInfo: { flex: 1 },
  adminLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  adminDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
