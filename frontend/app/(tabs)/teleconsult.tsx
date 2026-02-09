import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

function BeneficiaryTeleconsult({ token }: { token: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [callInfo, setCallInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [freeText, setFreeText] = useState('');
  const [painLevel, setPainLevel] = useState(3);

  useEffect(() => {
    (async () => {
      try {
        const [q, h] = await Promise.all([
          apiFetch('/api/teleconsult/questions', {}, token).catch(() => []),
          apiFetch('/api/teleconsult/history', {}, token).catch(() => []),
        ]);
        setQuestions(q); setHistory(h);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  const submitQCM = async () => {
    try {
      const answerList = questions.map(q => ({ question_id: q.id, question: q.question, answer: answers[q.id] || '' }));
      const res = await apiFetch('/api/teleconsult/submit', {
        method: 'POST', body: JSON.stringify({ answers: answerList, notes: freeText }),
      }, token);
      setCallInfo(res); setSubmitted(true);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (submitted && callInfo) {
    return (
      <ScrollView contentContainerStyle={s.sc}>
        <View style={s.successCard}>
          <View style={s.successIc}><Ionicons name="checkmark-circle" size={48} color={Colors.success} /></View>
          <Text style={s.successTitle}>Demande envoyée !</Text>
          <Text style={s.successSub}>Un médecin vous rappellera sous peu</Text>
          <View style={s.callCard}>
            <Ionicons name="call" size={22} color={Colors.primary} />
            <Text style={s.callNum}>{callInfo.call_number}</Text>
          </View>
          <Text style={s.callNote}>Vous pouvez aussi appeler directement ce numéro 24/7</Text>
          <TouchableOpacity testID="new-consult-btn" style={s.newBtn} onPress={() => { setSubmitted(false); setStep(0); setAnswers({}); }}>
            <Text style={s.newBtnT}>Nouvelle consultation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const q = questions[step];

  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      {/* Progress */}
      <View style={s.progress}>
        {questions.map((_, i) => (
          <View key={i} style={[s.progDot, i <= step && { backgroundColor: Colors.primary }]} />
        ))}
      </View>
      <Text style={s.stepLabel}>Question {step + 1} / {questions.length}</Text>

      {q && (
        <View style={s.questionCard}>
          <Text style={s.questionText}>{q.question}</Text>

          {q.type === 'choice' && q.options?.map((opt: string, i: number) => (
            <TouchableOpacity key={i} testID={`qcm-opt-${i}`}
              style={[s.optBtn, answers[q.id] === opt && s.optBtnA]}
              onPress={() => setAnswers({ ...answers, [q.id]: opt })}>
              <View style={[s.optRadio, answers[q.id] === opt && s.optRadioA]}>
                {answers[q.id] === opt && <View style={s.optRadioInner} />}
              </View>
              <Text style={[s.optText, answers[q.id] === opt && s.optTextA]}>{opt}</Text>
            </TouchableOpacity>
          ))}

          {q.type === 'scale' && (
            <View style={s.scaleC}>
              <Text style={s.scaleVal}>{painLevel}</Text>
              <View style={s.scaleRow}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <TouchableOpacity key={n} testID={`scale-${n}`}
                    style={[s.scaleBtn, painLevel === n && { backgroundColor: n <= 3 ? Colors.success : n <= 6 ? Colors.accent : Colors.destructive }]}
                    onPress={() => { setPainLevel(n); setAnswers({ ...answers, [q.id]: n.toString() }); }}>
                    <Text style={[s.scaleBtnT, painLevel === n && { color: '#FFF' }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {q.type === 'text' && (
            <TextInput testID="qcm-text" style={s.textInput} placeholder="Décrivez vos symptômes..." placeholderTextColor={Colors.textMuted}
              value={freeText} onChangeText={v => { setFreeText(v); setAnswers({ ...answers, [q.id]: v }); }} multiline />
          )}
        </View>
      )}

      {/* Navigation */}
      <View style={s.navRow}>
        {step > 0 && (
          <TouchableOpacity testID="prev-btn" style={s.prevBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} /><Text style={s.prevBtnT}>Précédent</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {step < questions.length - 1 ? (
          <TouchableOpacity testID="next-btn" style={s.nextBtn} onPress={() => setStep(step + 1)}>
            <Text style={s.nextBtnT}>Suivant</Text><Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity testID="submit-qcm-btn" style={s.submitBtn} onPress={submitQCM}>
            <Ionicons name="send" size={16} color="#FFF" /><Text style={s.submitBtnT}>Envoyer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* History */}
      {history.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={s.histTitle}>Historique</Text>
          {history.slice(0, 5).map((h: any) => (
            <View key={h.id} style={s.histCard}>
              <Ionicons name="videocam" size={18} color={Colors.primary} />
              <View style={s.histInfo}>
                <Text style={s.histSt}>{h.status === 'pending' ? 'En attente' : 'Terminé'}</Text>
                <Text style={s.histDate}>{new Date(h.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function GuardianInterventions({ token }: { token: string }) {
  const router = useRouter();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch('/api/interventions', {}, token);
      setInterventions(data);
    } catch (e) {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      {interventions.length > 0 ? interventions.map((iv: any) => (
        <TouchableOpacity key={iv.id} testID={`intervention-${iv.id}`} style={s.ivCard}
          onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: iv.id } })}>
          <View style={[s.ivStatusDot, { backgroundColor: iv.status === 'completed' ? Colors.success : iv.status === 'en_route' ? Colors.accent : Colors.info }]} />
          <View style={s.ivInfo}>
            <Text style={s.ivName}>{iv.beneficiary_name}</Text>
            <Text style={s.ivSt}>{iv.status === 'en_route' ? 'En route' : iv.status === 'on_site' ? 'Sur place' : iv.status === 'completed' ? 'Terminé' : iv.status}</Text>
          </View>
          <View style={s.ivRight}>
            <Text style={s.ivDate}>{new Date(iv.created_at).toLocaleDateString('fr-FR')}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      )) : (
        <View style={s.emptyC}>
          <MaterialCommunityIcons name="map-marker-radius" size={36} color={Colors.textMuted} />
          <Text style={s.emptyT}>Aucune intervention</Text>
        </View>
      )}
    </ScrollView>
  );
}

export default function TeleconsultScreen() {
  const { user, token } = useAuth();
  if (!user || !token) return null;

  return (
    <SafeAreaView style={s.safe} testID="teleconsult-screen">
      <View style={s.header}>
        <Text style={s.title}>{user.role === 'guardian' ? 'Interventions' : 'Téléconsultation'}</Text>
        {user.role !== 'guardian' && <Text style={s.subtitle}>Questionnaire avant consultation</Text>}
      </View>
      {user.role === 'guardian' ? <GuardianInterventions token={token} /> : <BeneficiaryTeleconsult token={token} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary }, subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  sc: { paddingHorizontal: 18, paddingBottom: 24 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 },
  progDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  stepLabel: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginBottom: 14 },
  questionCard: { backgroundColor: Colors.paper, borderRadius: 16, padding: 18, marginBottom: 16 },
  questionText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16, lineHeight: 24 },
  optBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 8, gap: 12 },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  optRadioA: { borderColor: Colors.primary }, optRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  optText: { fontSize: 15, color: Colors.textSecondary, flex: 1 }, optTextA: { color: Colors.primary, fontWeight: '600' },
  scaleC: { alignItems: 'center' }, scaleVal: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  scaleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  scaleBtnT: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  textInput: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.textPrimary, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: Colors.subtle },
  prevBtnT: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Colors.primary },
  nextBtnT: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Colors.success },
  submitBtnT: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  successCard: { backgroundColor: Colors.paper, borderRadius: 18, padding: 28, alignItems: 'center', marginTop: 20 },
  successIc: { marginBottom: 12 }, successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  successSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  callCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primary + '10', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  callNum: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  callNote: { fontSize: 12, color: Colors.textMuted, marginTop: 10, textAlign: 'center' },
  newBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.subtle },
  newBtnT: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  histTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  histCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  histInfo: { flex: 1 }, histSt: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  histDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ivCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  ivStatusDot: { width: 10, height: 10, borderRadius: 5 },
  ivInfo: { flex: 1 }, ivName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  ivSt: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  ivRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ivDate: { fontSize: 12, color: Colors.textMuted },
  emptyC: { alignItems: 'center', paddingVertical: 40 }, emptyT: { fontSize: 15, color: Colors.textMuted, marginTop: 10 },
});
