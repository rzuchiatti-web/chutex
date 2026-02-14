import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, RefreshControl, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', style: 'destructive', onPress: onConfirm }]);
  }
};
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/context/ThemeContext';

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

/* ===== TELEASSISTANCE: CARE WATCH DASHBOARD ===== */
function TeleassistanceDashboard({ token }: { token: string }) {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active'|'all'|'stats'>('active');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [inc, st] = await Promise.all([
        apiFetch('/api/carewatch/incidents', {}, token).catch(() => []),
        apiFetch('/api/carewatch/stats', {}, token).catch(() => ({})),
      ]);
      setIncidents(Array.isArray(inc) ? inc : []);
      setStats(st);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const resolveIncident = async (iid: string) => {
    try {
      await apiFetch(`/api/carewatch/incident/${iid}/resolve`, { method: 'POST', body: JSON.stringify({ motif: 'Cloture operateur' }) }, token);
      Alert.alert('Incident cloture');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const addNote = async (iid: string) => {
    if (!noteText.trim()) return;
    try {
      await apiFetch(`/api/carewatch/incident/${iid}/note`, { method: 'POST', body: JSON.stringify({ note: noteText }) }, token);
      setNoteText(''); fetchData();
    } catch {}
  };

  const activeIncidents = incidents.filter(i => !['RESOLVED', 'FAILED'].includes(i.state));
  const displayed = tab === 'active' ? activeIncidents : tab === 'all' ? incidents : [];

  const stateColor = (st: string) => ({ NEW_ALERT: '#E53935', CALLING_PATIENT: '#FF9800', PATIENT_CONFIRMED_OK: '#4CAF50', PATIENT_NEEDS_HELP: '#E53935', PATIENT_NO_RESPONSE: '#FF5722', CALLING_GUARDIAN_1: '#2196F3', CALLING_GUARDIAN_2: '#2196F3', GUARDIAN_INTERVENTION_ACCEPTED: '#4CAF50', GUARDIAN_UNREACHABLE: '#FF5722', CARE_DISPATCHED: '#9C27B0', RESOLVED: '#4CAF50', FAILED: '#888' }[st] || '#888');
  const stateLabel = (st: string) => ({
    NEW_ALERT: 'Nouvelle alerte', CALLING_PATIENT: 'Appel patient', PATIENT_CONFIRMED_OK: 'Patient OK',
    PATIENT_NEEDS_HELP: 'Patient en detresse', PATIENT_NO_RESPONSE: 'Pas de reponse', PATIENT_AMBIGUOUS: 'Reponse ambigue',
    CALLING_GUARDIAN_1: 'Appel gardien 1', CALLING_GUARDIAN_2: 'Appel gardien 2', CALLING_GUARDIAN_N: 'Appel gardien',
    GUARDIAN_INTERVENTION_ACCEPTED: 'Gardien intervient', GUARDIAN_UNREACHABLE: 'Gardien injoignable',
    CARE_DISPATCHED: 'Care dispatche', RESOLVED: 'Resolu', FAILED: 'Echoue',
  }[st] || st);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
      <Text style={{ fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 4 }}>Plateau d'ecoute IA</Text>
      <Text style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>CARE WATCH - Teleassistance automatisee</Text>

      {/* Stats Cards */}
      {stats && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { val: activeIncidents.length, label: 'En cours', color: activeIncidents.length > 0 ? '#E53935' : '#4CAF50' },
            { val: stats.resolved_incidents || 0, label: 'Resolus', color: '#4CAF50' },
            { val: stats.care_dispatched || 0, label: 'Dispatches', color: '#9C27B0' },
            { val: `${stats.patient_response_rate || 0}%`, label: 'Reponse', color: '#2196F3' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }}>
        {[
          { key: 'active', label: `En cours (${activeIncidents.length})` },
          { key: 'all', label: `Historique (${incidents.length})` },
        ].map(t => (
          <TouchableOpacity key={t.key} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === t.key && { backgroundColor: '#000' }]}
            onPress={() => setTab(t.key as any)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.key ? '#FFF' : '#888' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: stateColor(selectedIncident.state) + '40' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }}>Incident #{selectedIncident.id?.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setSelectedIncident(null)}><Ionicons name="close-circle" size={24} color="#888" /></TouchableOpacity>
          </View>

          {/* Beneficiary */}
          <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Beneficiaire</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#000' }}>{selectedIncident.beneficiary_name}</Text>
            <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{selectedIncident.beneficiary_phone}</Text>
            {selectedIncident.beneficiary_address && <Text style={{ fontSize: 11, color: '#555' }}>{selectedIncident.beneficiary_address}</Text>}
            {selectedIncident.beneficiary_medical && <Text style={{ fontSize: 10, color: '#E53935', marginTop: 4 }}>Pathologies: {selectedIncident.beneficiary_medical}</Text>}
          </View>

          {/* Transcriptions */}
          {selectedIncident.transcriptions?.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Transcriptions</Text>
              {selectedIncident.transcriptions.map((t: any, i: number) => (
                <View key={i} style={{ backgroundColor: t.type === 'patient' ? 'rgba(33,150,243,0.06)' : 'rgba(255,152,0,0.06)', borderRadius: 10, padding: 10, marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: t.type === 'patient' ? '#1565C0' : '#E65100' }}>{t.type === 'patient' ? 'Patient' : `Gardien ${t.guardian_name || ''}`}</Text>
                  <Text style={{ fontSize: 12, color: '#333', fontStyle: 'italic', marginTop: 2 }}>"{t.text}"</Text>
                  {t.classification && <Text style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Intent: {t.classification.intent} ({(t.classification.confidence * 100).toFixed(0)}%)</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Timeline */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Timeline</Text>
            {selectedIncident.timeline?.slice(-8).map((t: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor(t.state), marginTop: 5 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#333' }}>{t.detail?.slice(0, 100)}</Text>
                  <Text style={{ fontSize: 9, color: '#AAA' }}>{new Date(t.timestamp).toLocaleTimeString('fr-FR')}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 10, fontSize: 12 }}
              placeholder="Note operateur..." value={noteText} onChangeText={setNoteText} />
            <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}
              onPress={() => addNote(selectedIncident.id)}>
              <Ionicons name="send" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          {!['RESOLVED', 'FAILED'].includes(selectedIncident.state) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#4CAF50', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                onPress={() => { resolveIncident(selectedIncident.id); setSelectedIncident(null); }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>CLOTURER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, borderWidth: 2, borderColor: '#000', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: selectedIncident.alert_id } })}>
                <Text style={{ color: '#000', fontSize: 12, fontWeight: '800' }}>FICHE ALERTE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Incidents List */}
      {displayed.length > 0 ? displayed.map(inc => (
        <TouchableOpacity key={inc.id} testID={`incident-${inc.id}`} onPress={() => setSelectedIncident(inc)}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', marginBottom: 10, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: stateColor(inc.state) }}>
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: stateColor(inc.state) + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={inc.state.includes('CALLING') ? 'call' : inc.state === 'RESOLVED' ? 'checkmark' : inc.state === 'CARE_DISPATCHED' ? 'navigate' : 'alert-circle'} size={16} color={stateColor(inc.state)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#000' }}>{inc.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#888' }}>{inc.alert_type?.toUpperCase()} - {new Date(inc.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={{ backgroundColor: stateColor(inc.state) + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: stateColor(inc.state), textTransform: 'uppercase' }}>{stateLabel(inc.state)}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{inc.alert_message?.slice(0, 80)}</Text>
              {inc.care_provider && <Text style={{ fontSize: 10, color: '#9C27B0', fontWeight: '600', marginTop: 4 }}>Care: {inc.care_provider}</Text>}
              {inc.assigned_guardian && <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: '600', marginTop: 4 }}>Gardien: {inc.assigned_guardian.name}</Text>}
              {inc.guardians_contacted?.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                  {inc.guardians_contacted.map((g: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: g.answered ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Ionicons name={g.answered ? 'checkmark-circle' : 'close-circle'} size={10} color={g.answered ? '#4CAF50' : '#888'} />
                      <Text style={{ fontSize: 9, color: g.answered ? '#4CAF50' : '#888' }}>{g.name?.split(' ')[0]}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )) : (
        <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 18 }}>
          <Ionicons name="checkmark-circle-outline" size={40} color="#CCC" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#888', marginTop: 10 }}>{tab === 'active' ? 'Aucun incident en cours' : 'Aucun historique'}</Text>
        </View>
      )}
    </ScrollView>);
}


/* ===== GUARDIAN: INTERVENTIONS ===== */
function GuardianInterventions({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [ivs, setIvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ivCode, setIvCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [showCareModal, setShowCareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIvs = async () => {
    try { setIvs(await apiFetch('/api/interventions', {}, token)); } catch {} finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchIvs(); const t = setInterval(fetchIvs, 15000); return () => clearInterval(t); }, []);

  const activateCare = async () => {
    if (!ivCode.trim()) return Alert.alert('Erreur', 'Entrez un code intervenant');
    setActivating(true);
    try {
      await apiFetch('/api/guardian/activate-intervention-provider', { method: 'POST', body: JSON.stringify({ code: ivCode.trim().toUpperCase() }) }, token);
      Alert.alert('Active', 'Vous etes maintenant intervenant Care.');
      setIvCode(''); await refreshUser();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setActivating(false); }
  };

  const deactivateCare = async () => {
    try {
      await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ is_intervention_provider: false }) }, token);
      await refreshUser();
      setShowCareModal(false);
    } catch {}
  };

  const statusLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);
  const statusColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');

  const activeIvs = ivs.filter(iv => ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status));
  const doneIvs = ivs.filter(iv => ['completed', 'cancelled'].includes(iv.status));
  const [ivTab, setIvTab] = useState<'active'|'done'>('active');
  const displayedIvs = ivTab === 'active' ? activeIvs : doneIvs;

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchIvs(); }} />}>
      {/* Intervention Care Card */}
      {!user?.is_intervention_provider ? (
        <View style={s.careCard}>
          <Ionicons name="shield-checkmark-outline" size={36} color={Colors.primary} />
          <Text style={s.careTitle}>Devenir Intervenant Care</Text>
          <Text style={s.careDesc}>Activez votre espace pour etre missionne par la teleassistance IA.</Text>
          <View style={{ width: '100%', gap: 8 }}>
            <TextInput testID="care-code-input" style={[s.careInput, { width: '100%' }]} placeholder="CODE INTERVENANT" placeholderTextColor={Colors.textMuted}
              value={ivCode} onChangeText={setIvCode} autoCapitalize="characters" />
            <TouchableOpacity testID="care-activate-btn" style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={activateCare} disabled={activating}>
              {activating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Activer mon espace</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Intervenant Care card - clean, violet */}
          <TouchableOpacity onPress={() => setShowCareModal(true)} activeOpacity={0.7}>
            <View style={{ backgroundColor: 'rgba(156,39,176,0.06)', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(156,39,176,0.15)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(156,39,176,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark" size={24} color="#9C27B0" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#000' }}>Intervenant Care</Text>
                    <View style={{ backgroundColor: '#9C27B0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>Actif</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 3 }} numberOfLines={1}>{user.intervention_structure || user.structure_name || 'Structure'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9C27B0" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Tabs En cours / Terminees */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }}>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, ivTab === 'active' && { backgroundColor: '#2196F3' }]} onPress={() => setIvTab('active')}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: ivTab === 'active' ? '#FFF' : '#888' }}>En cours ({activeIvs.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, ivTab === 'done' && { backgroundColor: '#4CAF50' }]} onPress={() => setIvTab('done')}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: ivTab === 'done' ? '#FFF' : '#888' }}>Terminees ({doneIvs.length})</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Care Detail Modal - violet theme */}
      <Modal visible={showCareModal} transparent animationType="fade" onRequestClose={() => setShowCareModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#7B1FA2' }}>Espace Intervenant Care</Text>
              <TouchableOpacity onPress={() => setShowCareModal(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(156,39,176,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark" size={24} color="#9C27B0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>{user.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{ backgroundColor: '#9C27B0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>Actif</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#888' }}>{user.intervention_structure || user.structure_name}</Text>
                  </View>
                </View>
              </View>
              {[
                { icon: 'business-outline', label: 'Structure', value: user.intervention_structure || user.structure_name || '-' },
                { icon: 'briefcase-outline', label: 'Profession', value: user.profession || '-' },
                { icon: 'card-outline', label: 'SIRET', value: user.siret || '-' },
                { icon: 'location-outline', label: 'Adresse', value: user.address || '-' },
                { icon: 'call-outline', label: 'Telephone', value: user.phone || '-' },
                { icon: 'navigate-outline', label: 'Rayon', value: `${user.intervention_radius_km || 30} km` },
              ].map(({ icon, label, value }) => value !== '-' ? (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                  <Ionicons name={icon as any} size={16} color="#888" />
                  <Text style={{ fontSize: 12, color: '#888', width: 85 }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#000', flex: 1 }}>{value}</Text>
                </View>
              ) : null)}
              <TouchableOpacity testID="deactivate-care-modal-btn" style={{ borderWidth: 1.5, borderColor: '#E53935', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => confirmAction('Desactiver', 'Vous ne recevrez plus de missions d\'intervention. Confirmez ?', deactivateCare)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#E53935' }}>Desactiver mon espace</Text>
                <Ionicons name="close-circle-outline" size={16} color="#E53935" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Interventions List filtered by tab */}
      {user?.is_intervention_provider && (displayedIvs.length > 0 ? displayedIvs.map(iv => (
        <TouchableOpacity key={iv.id} testID={`iv-${iv.id}`} onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: iv.id } })}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: statusColor(iv.status) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: statusColor(iv.status) + '15', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={iv.status === 'completed' ? 'checkmark-circle' : iv.status === 'pending_acceptance' ? 'time' : 'navigate'} size={18} color={statusColor(iv.status)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#000' }}>{iv.beneficiary_name}</Text>
                <Text style={{ fontSize: 11, color: '#888' }}>{iv.alert_message || iv.notes || 'Intervention'}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: statusColor(iv.status) }}>{iv.distance_km ? `${iv.distance_km}km` : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}>
              <Ionicons name="time-outline" size={12} color="#888" />
              <Text style={{ fontSize: 11, color: '#888', flex: 1 }}>{new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={{ backgroundColor: statusColor(iv.status) + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor(iv.status) }}>{statusLabel(iv.status)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#888" />
            </View>
          </View>
        </TouchableOpacity>
      )) : (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 18, padding: 32, alignItems: 'center' }}>
          <Ionicons name={ivTab === 'active' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#888', marginTop: 10 }}>{ivTab === 'active' ? 'Aucune intervention en cours' : 'Aucune intervention terminee'}</Text>
        </View>
      ))}
    </ScrollView>);
}

/* ===== ADMIN: INTERVENANTS MANAGEMENT ===== */
function AdminIntervenants({ token }: { token: string }) {
  const router = useRouter();
  const [codes, setCodes] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<any>(null);
  const [form, setForm] = useState({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'codes'|'providers'|'interventions'>('codes');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, p, iv] = await Promise.all([
        apiFetch('/api/admin/intervention-codes', {}, token).catch(() => []),
        apiFetch('/api/admin/intervention-providers', {}, token).catch(() => []),
        apiFetch('/api/backoffice/interventions', {}, token).catch(() => []),
      ]);
      setCodes(c); setProviders(p); setInterventions(iv);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCode = async () => {
    if (!form.structure_name) return Alert.alert('Erreur', 'Nom de structure requis');
    setSaving(true);
    try {
      if (editCode) {
        await apiFetch(`/api/admin/intervention-codes/${editCode.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
        setCodes(codes.map(c => c.id === editCode.id ? { ...c, ...form } : c));
      } else {
        const r = await apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ ...form, radius_km: parseFloat(form.radius_km) || 30 }) }, token);
        setCodes([r, ...codes]);
      }
      setShowModal(false); setEditCode(null);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/intervention-codes/${id}/toggle`, { method: 'PUT' }, token);
      setCodes(codes.map(c => c.id === id ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteCode = (id: string) => {
    confirmAction('Supprimer', 'Supprimer définitivement ce code intervenant ?', async () => {
      await apiFetch(`/api/admin/intervention-codes/${id}`, { method: 'DELETE' }, token);
      setCodes(codes.filter(c => c.id !== id));
    });
  };

  const openEdit = (c: any) => {
    setEditCode(c);
    setForm({ structure_name: c.structure_name || '', raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '', adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '', radius_km: String(c.default_radius_km || 30) });
    setShowModal(true);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }}>
        {([['codes', `Codes (${codes.length})`], ['providers', `Actifs (${providers.length})`], ['interventions', `Missions (${interventions.length})`]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === k && { backgroundColor: '#000' }]}
            onPress={() => setTab(k)}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: tab === k ? '#FFF' : '#888' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CODES TAB */}
      {tab === 'codes' && <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{codes.length} structure(s)</Text>
          <TouchableOpacity testID="add-intervenant-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' }); setShowModal(true); }}>
            <Ionicons name="add" size={16} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
          </TouchableOpacity>
        </View>

        {codes.map(c => (
          <View key={c.id} style={[s.ivCard, !c.active && { opacity: 0.5 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={s.ivName}>{c.structure_name}</Text>
                <View style={{ backgroundColor: Colors.subtle, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: Colors.primary }}>{c.code}</Text>
                </View>
              </View>
              {c.raison_sociale ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.raison_sociale}</Text> : null}
              {c.siret ? <Text style={{ fontSize: 10, color: Colors.textMuted }}>SIRET: {c.siret} {c.tva ? `· TVA: ${c.tva}` : ''}</Text> : null}
              <Text style={s.ivSt}>Rayon: {c.default_radius_km || 30}km · {c.uses_count}/{c.max_uses} util. · {c.active ? 'Actif' : 'Desactive'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity onPress={() => openEdit(c)} style={{ padding: 6 }}><Ionicons name="create-outline" size={16} color={Colors.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => toggleCode(c.id)} style={{ padding: 6 }}><Ionicons name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={c.active ? Colors.textMuted : Colors.success} /></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCode(c.id)} style={{ padding: 6 }}><Ionicons name="trash-outline" size={16} color={Colors.destructive} /></TouchableOpacity>
            </View>
          </View>
        ))}
      </>}

      {/* PROVIDERS TAB */}
      {tab === 'providers' && <>
        {providers.map((p: any) => (
          <TouchableOpacity key={p.user_id || p.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: p.user_id || p.id } })} activeOpacity={0.7}>
            <View style={s.ivCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{p.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ivName}>{p.name}</Text>
                  <Text style={s.ivSt}>{p.structure_name || p.intervention_structure} · {p.radius_km || p.intervention_radius_km || 30}km</Text>
                  {p.email && <Text style={{ fontSize: 10, color: Colors.textMuted }}>{p.email}</Text>}
                  {p.phone && <Text style={{ fontSize: 10, color: Colors.textMuted }}>{p.phone}</Text>}
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#4CAF5015' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#4CAF50' }}>ACTIF</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {providers.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 36 }}><Ionicons name="medkit-outline" size={36} color="#CCC" /><Text style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Aucun intervenant inscrit</Text></View>}
      </>}

      {/* INTERVENTIONS TAB */}
      {tab === 'interventions' && <>
        {interventions.map((iv: any) => {
          const sc: any = { pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' };
          const sl: any = { pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' };
          return (
            <TouchableOpacity key={iv.id} onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: iv.id } })} activeOpacity={0.7}>
              <View style={s.ivCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sc[iv.status] || '#888' }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 }}>{iv.beneficiary_name}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: (sc[iv.status] || '#888') + '15' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: sc[iv.status] || '#888' }}>{sl[iv.status] || iv.status}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: Colors.textMuted }}>{iv.alert_message || iv.notes || 'Intervention'}</Text>
                {iv.assigned_name && <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600', marginTop: 4 }}>Intervenant: {iv.assigned_name}</Text>}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: Colors.textMuted }}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#888" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {interventions.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 36 }}><Ionicons name="checkmark-circle-outline" size={36} color="#CCC" /><Text style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Aucune intervention</Text></View>}
      </>}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalO}><View style={s.modalC}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.modalTitle}>{editCode ? 'Modifier la structure' : 'Nouvelle structure d\'intervention'}</Text>
            {[
              { k: 'structure_name', l: 'Nom commercial', p: 'Ex: Ambulances du Sud' },
              { k: 'raison_sociale', l: 'Raison sociale', p: 'Ex: SARL Ambulances du Sud' },
              { k: 'siret', l: 'SIRET', p: '12345678900000' },
              { k: 'tva', l: 'N° TVA', p: 'FR12345678900' },
              { k: 'adresse', l: 'Adresse', p: '12 rue des Chênes, 75001 Paris' },
              { k: 'telephone', l: 'Téléphone', p: '+33 1 23 45 67 89' },
              { k: 'email_contact', l: 'Email contact', p: 'contact@structure.fr' },
              { k: 'radius_km', l: 'Rayon d\'intervention (km)', p: '30' },
            ].map(f => (
              <View key={f.k}>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 2 }}>{f.l}</Text>
                <TextInput style={s.modalInput} placeholder={f.p} placeholderTextColor={Colors.textMuted}
                  value={(form as any)[f.k]} onChangeText={(v: string) => setForm({ ...form, [f.k]: v })} keyboardType={f.k === 'radius_km' ? 'numeric' : 'default'} />
              </View>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveCode} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>{editCode ? 'Modifier' : 'Créer'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

/* ===== MAIN ===== */
export default function TeleconsultScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  
  if (!user || !token) return null;
  const r = user.active_role || user.role;
  // key={r} forces complete remount when role changes (Expo Router tab caching fix)
  return (
    <View key={r} style={[s.safe, { backgroundColor: colors.background }]} testID="teleconsult-screen">
      <View style={s.header}>
        <Text style={[s.title, { color: colors.textPrimary }]}>{r === 'teleassistance' ? 'Téléassistance IA' : r === 'guardian' ? 'Interventions' : r === 'admin' ? 'Intervenants' : 'Téléconsultation'}</Text>
        {r === 'teleassistance' && <Text style={[s.subtitle, { color: colors.textMuted }]}>Plateau d'écoute — Protocole d'escalade</Text>}
        {r === 'beneficiary' && <Text style={[s.subtitle, { color: colors.textMuted }]}>Questionnaire pré-consultation</Text>}
      </View>
      {r === 'teleassistance' ? <TeleassistanceDashboard token={token} />
        : r === 'guardian' ? <GuardianInterventions token={token} user={user} />
        : r === 'admin' ? <AdminIntervenants token={token} />
        : <BeneficiaryTeleconsult token={token} />}
    </View>
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
  escPulseSmall: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
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
  // Intervention Care
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  careCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  careTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 10 },
  careDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 16 },
  careRow: { flexDirection: 'row', gap: 8, width: '100%' },
  careInput: { flex: 1, backgroundColor: Colors.paper, borderRadius: 10, padding: 14, fontSize: 15, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', letterSpacing: 2 },
  careBtn: { paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center' },
  careBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  careActive: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.success + '12', borderRadius: 10, padding: 14, marginBottom: 14 },
  careActiveT: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  careActiveSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  modalO: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  modalInput: { backgroundColor: Colors.subtle, borderRadius: 8, padding: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
});
