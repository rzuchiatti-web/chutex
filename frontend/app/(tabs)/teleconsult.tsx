import { Icon, MCIcon } from '../../src/components/WebIcon';
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
import { PageExplainer } from '../../src/components/HelpSystem';

/* Clean alert/intervention type label */
const getCleanLabel = (alertType: string, message?: string) => {
  if (alertType === 'fall') return 'Chute detectee';
  if (alertType === 'sos') return 'SOS';
  if (alertType === 'heart_rate' || alertType === 'health_anomaly') return 'Anomalie de sante detectee';
  if (alertType === 'spo2') return 'Anomalie de sante detectee';
  if (alertType === 'inactivity') return 'Inactivite detectee';
  // Fallback: clean the message
  if (message) {
    if (message.toLowerCase().includes('chute')) return 'Chute detectee';
    if (message.toLowerCase().includes('sos')) return 'SOS';
  }
  return alertType || 'Alerte';
};

/* ===== BENEFICIARY: QCM ===== */
const BG_BLUE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';

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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}><ActivityIndicator size="large" color="#111" /></View>;

  /* ─── SUCCESS PAGE ─── */
  if (submitted && callInfo && Platform.OS === 'web') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_BLUE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5, padding: '0 28px' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Demande envoyee</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32, textAlign: 'center' }}>Un medecin vous rappellera sous peu</div>

          {/* Slide to call */}
          <div style={{ width: '100%', maxWidth: 340, height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 20, touchAction: 'none' } as any}
            onMouseDown={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); window.location.href = `tel:${callInfo.call_number}`; } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
            onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); window.location.href = `tel:${callInfo.call_number}`; } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
            <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour appeler</div>
          </div>

          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{callInfo.call_number}</div>

          <div onClick={() => { setSubmitted(false); setStep(0); setAnswers({}); }} style={{ padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as any}>Nouvelle consultation</div>
        </div>
      </div>
    );
  }

  /* ─── QCM PAGE — full screen blue satin ─── */
  if (Platform.OS === 'web') {
    const q = questions[step];
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_BLUE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />

        {/* Header */}
        <div style={{ position: 'relative', padding: '20px 20px 16px', zIndex: 5, textAlign: 'center' } as any}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12, transition: 'all 0.3s ease' } as any}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>Medecin disponible 24/7</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Teleconsultation</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Questionnaire pre-consultation</div>
          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 } as any}>
            {questions.map((_, i) => <div key={i} style={{ width: i <= step ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i <= step ? '#FFF' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Etape {step + 1} / {questions.length}</div>
        </div>

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {q && (
            <>
              <div style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 } as any}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#FFF', lineHeight: 1.4 }}>{q.question}</div>
              </div>

              {q.type === 'choice' && q.options?.map((o: string, i: number) => (
                <div key={i} onClick={() => setAnswers({ ...answers, [q.id]: o })} style={{
                  padding: '14px 18px', borderRadius: 16, marginBottom: 8, cursor: 'pointer',
                  background: answers[q.id] === o ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${answers[q.id] === o ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                } as any}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, border: `2px solid ${answers[q.id] === o ? '#FFF' : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    {answers[q.id] === o && <div style={{ width: 10, height: 10, borderRadius: 999, background: '#FFF' }} />}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#FFF' }}>{o}</span>
                </div>
              ))}

              {q.type === 'scale' && (
                <div style={{ textAlign: 'center', marginTop: 8 } as any}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>{painLevel}</div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' } as any}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                      <div key={n} onClick={() => { setPainLevel(n); setAnswers({ ...answers, [q.id]: n.toString() }); }}
                        style={{ width: 38, height: 38, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          background: painLevel === n ? '#FFF' : 'rgba(255,255,255,0.06)', border: `1px solid ${painLevel === n ? '#FFF' : 'rgba(255,255,255,0.1)'}`, color: painLevel === n ? '#111' : '#FFF', fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                        } as any}>{n}</div>
                    ))}
                  </div>
                </div>
              )}

              {q.type === 'text' && (
                <textarea value={freeText} onChange={(e: any) => { setFreeText(e.target.value); setAnswers({ ...answers, [q.id]: e.target.value }); }}
                  placeholder="Decrivez vos symptomes..."
                  style={{ width: '100%', minHeight: 120, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none' } as any} />
              )}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 10 } as any}>
            {step > 0 ? (
              <div onClick={() => setStep(step - 1)} style={{ padding: '14px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 } as any}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                Precedent
              </div>
            ) : <div />}
            {step < questions.length - 1 ? (
              <div onClick={() => setStep(step + 1)} style={{ padding: '14px 24px', borderRadius: 999, background: '#FFF', color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' } as any}>
                Suivant
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ) : (
              <div onClick={submitQCM} style={{ padding: '14px 24px', borderRadius: 999, background: '#FFF', color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' } as any}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Envoyer
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  const q = questions[step];
  return (
    <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
      <View style={s.prog}>{questions.map((_, i) => <View key={i} style={[s.progDot, i <= step && { backgroundColor: Colors.primary }]} />)}</View>
      <Text style={s.stepL}>Etape {step + 1} / {questions.length}</Text>
      {q && <View style={s.qCard}><Text style={s.qText}>{q.question}</Text>
        {q.type === 'choice' && q.options?.map((o: string, i: number) => (
          <TouchableOpacity key={i} style={[s.optBtn, answers[q.id] === o && s.optBtnA]} onPress={() => setAnswers({ ...answers, [q.id]: o })}>
            <View style={[s.radio, answers[q.id] === o && s.radioA]}>{answers[q.id] === o && <View style={s.radioI} />}</View>
            <Text style={[s.optT, answers[q.id] === o && s.optTA]}>{o}</Text></TouchableOpacity>))}
        {q.type === 'scale' && <View style={s.scaleC}><Text style={s.scaleV}>{painLevel}</Text><View style={s.scaleR}>
          {[0,1,2,3,4,5,6,7,8,9,10].map(n => <TouchableOpacity key={n} style={[s.scaleB, painLevel === n && { backgroundColor: Colors.primary }]}
            onPress={() => { setPainLevel(n); setAnswers({ ...answers, [q.id]: n.toString() }); }}><Text style={[s.scaleBT, painLevel === n && { color: '#FFF' }]}>{n}</Text></TouchableOpacity>)}</View></View>}
        {q.type === 'text' && <TextInput style={s.textInp} placeholder="Decrivez..." placeholderTextColor={Colors.textMuted} value={freeText} onChangeText={v => { setFreeText(v); setAnswers({ ...answers, [q.id]: v }); }} multiline />}
      </View>}
      <View style={s.navR}>{step > 0 && <TouchableOpacity style={s.prevB} onPress={() => setStep(step - 1)}><Icon name="chevron-back" size={16} color={Colors.textSecondary} /><Text style={s.prevBT}>Precedent</Text></TouchableOpacity>}
        <View style={{ flex: 1 }} />{step < questions.length - 1 ? <TouchableOpacity style={s.nextB} onPress={() => setStep(step + 1)}><Text style={s.nextBT}>Suivant</Text><Icon name="chevron-forward" size={16} color="#111827" /></TouchableOpacity>
          : <TouchableOpacity testID="submit-qcm" style={s.submitB} onPress={submitQCM}><Icon name="send" size={14} color="#111827" /><Text style={s.submitBT}>Envoyer</Text></TouchableOpacity>}</View>
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;

  const BG_TA = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const BG_RED_TA = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

  if (Platform.OS === 'web') {
    return (
      <div data-testid="teleassistance-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_TA} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '24px 20px 14px', zIndex: 5, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Teleassistance IA</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Plateau d'ecoute — Protocole d'escalade</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 14 } as any}>
            <div onClick={() => setTab('active')} style={{ padding: '10px 20px', borderRadius: 999, cursor: 'pointer', background: tab === 'active' ? '#FFF' : 'transparent', color: tab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 } as any}>En cours ({activeIncidents.length})</div>
            <div onClick={() => setTab('all')} style={{ padding: '10px 20px', borderRadius: 999, cursor: 'pointer', background: tab === 'all' ? '#FFF' : 'transparent', color: tab === 'all' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 } as any}>Tous ({incidents.length})</div>
            <div onClick={() => setTab('stats')} style={{ padding: '10px 20px', borderRadius: 999, cursor: 'pointer', background: tab === 'stats' ? '#FFF' : 'transparent', color: tab === 'stats' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 } as any}>Stats</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {stats && <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>{[{ val: activeIncidents.length, label: 'En cours', color: activeIncidents.length > 0 ? '#EF4444' : '#10B981' }, { val: stats.resolved_incidents || 0, label: 'Resolus', color: '#10B981' }, { val: stats.care_dispatched || 0, label: 'Dispatches', color: '#A78BFA' }, { val: `${stats.patient_response_rate || 0}%`, label: 'Reponse', color: '#3B82F6' }].map((st2, i) => (<div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: st2.color }}>{st2.val}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{st2.label}</div></div>))}</div>}
          {tab === 'stats' && stats && <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Statistiques</div>{[{ l: 'Temps moyen resolution', v: stats.avg_resolution_time || '-' }, { l: 'Taux reponse patient', v: `${stats.patient_response_rate || 0}%` }, { l: 'Interventions Care', v: stats.care_dispatched || 0 }, { l: 'Incidents resolus', v: stats.resolved_incidents || 0 }].map((item, i) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}<div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.l}</div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{item.v}</div></div>))}</div>}
          {tab !== 'stats' && displayed.map((inc: any) => { const isAct = !['RESOLVED','FAILED'].includes(inc.state); return (
            <div key={inc.id} onClick={() => setSelectedIncident(selectedIncident?.id === inc.id ? null : inc)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 10, cursor: 'pointer' } as any}>{isAct && <img src={BG_RED_TA} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />}{!isAct && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', zIndex: 0 } as any} />}<div style={{ position: 'absolute', inset: 0, background: isAct ? 'rgba(0,0,0,0.2)' : 'transparent', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any}><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{inc.beneficiary_name || 'Incident'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{new Date(inc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: `${stateColor(inc.state)}30`, flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: stateColor(inc.state) } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{stateLabel(inc.state)}</span></div></div>{inc.care_provider && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Care: {inc.care_provider}</div>}{selectedIncident?.id === inc.id && (<div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' } as any}>{inc.timeline?.map((t: any, ti: number) => (<div key={ti} style={{ display: 'flex', gap: 8, marginBottom: 6 } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: stateColor(t.state || 'RESOLVED'), marginTop: 5, flexShrink: 0 } as any} /><div><div style={{ fontSize: 11, fontWeight: 600, color: '#FFF' }}>{t.note || stateLabel(t.state || '')}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{new Date(t.time).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div></div>))}{isAct && <div onClick={(e: any) => { e.stopPropagation(); resolveIncident(inc.id); }} style={{ padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 } as any}>Cloturer</div>}</div>)}</div></div>
          ); })}
          {tab !== 'stats' && displayed.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-headphone-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucun incident</div></div>}
        </div>
      </div>
    );
  }

  /* NATIVE FALLBACK */
  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
      <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 }}>Plateau d'ecoute IA</Text>
      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>CARE WATCH - Teleassistance automatisee</Text>

      {/* Stats Cards */}
      {stats && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { val: activeIncidents.length, label: 'En cours', color: activeIncidents.length > 0 ? '#E53935' : '#4CAF50' },
            { val: stats.resolved_incidents || 0, label: 'Resolus', color: '#10B981' },
            { val: stats.care_dispatched || 0, label: 'Dispatches', color: '#9C27B0' },
            { val: `${stats.patient_response_rate || 0}%`, label: 'Reponse', color: '#2196F3' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#F0F1F3', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        {[
          { key: 'active', label: `En cours (${activeIncidents.length})` },
          { key: 'all', label: `Historique (${incidents.length})` },
        ].map(t => (
          <TouchableOpacity key={t.key} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === t.key && { backgroundColor: '#FFFFFF' }]}
            onPress={() => setTab(t.key as any)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.key ? '#FFF' : '#888' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: stateColor(selectedIncident.state) + '40' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Incident #{selectedIncident.id?.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setSelectedIncident(null)}><Icon name="close-circle" size={24} color="#888" /></TouchableOpacity>
          </View>

          {/* Beneficiary */}
          <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Beneficiaire</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{selectedIncident.beneficiary_name}</Text>
            <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{selectedIncident.beneficiary_phone}</Text>
            {selectedIncident.beneficiary_address && <Text style={{ fontSize: 11, color: '#555' }}>{selectedIncident.beneficiary_address}</Text>}
            {selectedIncident.beneficiary_medical && <Text style={{ fontSize: 10, color: '#E53935', marginTop: 4 }}>Pathologies: {selectedIncident.beneficiary_medical}</Text>}
          </View>

          {/* Transcriptions */}
          {selectedIncident.transcriptions?.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Transcriptions</Text>
              {selectedIncident.transcriptions.map((t: any, i: number) => (
                <View key={i} style={{ backgroundColor: t.type === 'patient' ? 'rgba(33,150,243,0.06)' : 'rgba(255,152,0,0.06)', borderRadius: 10, padding: 10, marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: t.type === 'patient' ? '#1565C0' : '#E65100' }}>{t.type === 'patient' ? 'Patient' : `Gardien ${t.guardian_name || ''}`}</Text>
                  <Text style={{ fontSize: 12, color: '#111827', fontStyle: 'italic', marginTop: 2 }}>"{t.text}"</Text>
                  {t.classification && <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>Intent: {t.classification.intent} ({(t.classification.confidence * 100).toFixed(0)}%)</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Timeline */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Timeline</Text>
            {selectedIncident.timeline?.slice(-8).map((t: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor(t.state), marginTop: 5 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#111827' }}>{t.detail?.slice(0, 100)}</Text>
                  <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{new Date(t.timestamp).toLocaleTimeString('fr-FR')}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 10, fontSize: 12 }}
              placeholder="Note operateur..." value={noteText} onChangeText={setNoteText} />
            <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}
              onPress={() => addNote(selectedIncident.id)}>
              <Icon name="send" size={14} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          {!['RESOLVED', 'FAILED'].includes(selectedIncident.state) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                onPress={() => { resolveIncident(selectedIncident.id); setSelectedIncident(null); }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>CLOTURER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, borderWidth: 2, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: selectedIncident.alert_id } })}>
                <Text style={{ color: '#111827', fontSize: 12, fontWeight: '800' }}>FICHE ALERTE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Incidents List */}
      {displayed.length > 0 ? displayed.map(inc => (
        <TouchableOpacity key={inc.id} testID={`incident-${inc.id}`} onPress={() => setSelectedIncident(inc)}>
          <View style={{ backgroundColor: '#F0F1F3', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 10, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: stateColor(inc.state) }}>
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: stateColor(inc.state) + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={inc.state.includes('CALLING') ? 'call' : inc.state === 'RESOLVED' ? 'checkmark' : inc.state === 'CARE_DISPATCHED' ? 'navigate' : 'alert-circle'} size={16} color={stateColor(inc.state)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{inc.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>{inc.alert_type?.toUpperCase()} - {new Date(inc.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={{ backgroundColor: stateColor(inc.state) + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: stateColor(inc.state), textTransform: 'uppercase' }}>{stateLabel(inc.state)}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{inc.alert_message?.slice(0, 80)}</Text>
              {inc.care_provider && <Text style={{ fontSize: 10, color: '#9C27B0', fontWeight: '600', marginTop: 4 }}>Care: {inc.care_provider}</Text>}
              {inc.assigned_guardian && <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 4 }}>Gardien: {inc.assigned_guardian.name}</Text>}
              {inc.guardians_contacted?.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                  {inc.guardians_contacted.map((g: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: g.answered ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Icon name={g.answered ? 'checkmark-circle' : 'close-circle'} size={10} color={g.answered ? '#4CAF50' : '#888'} />
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
          <Icon name="checkmark-circle-outline" size={40} color="#CCC" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 10 }}>{tab === 'active' ? 'Aucun incident en cours' : 'Aucun historique'}</Text>
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
    if (!ivCode.trim()) { setCareError('Entrez un code intervenant'); return; }
    setActivating(true); setCareError('');
    try {
      await apiFetch('/api/guardian/activate-intervention-provider', { method: 'POST', body: JSON.stringify({ code: ivCode.trim().toUpperCase() }) }, token);
      Alert.alert('Active', 'Vous etes maintenant intervenant Care.');
      setIvCode(''); await refreshUser();
    } catch (e: any) { setCareError(e.message || 'Code invalide'); } finally { setActivating(false); }
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

  const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
  const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_RED = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_HEADER = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
  const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';

  const [slideActivated, setSlideActivated] = useState(false);
  const [careError, setCareError] = useState('');
  const [selectedIv, setSelectedIv] = useState<any>(null);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showStructurePopup, setShowStructurePopup] = useState(false);

  const selectIntervention = async (iv: any) => {
    setSelectedIv(iv);
    setLoadingDetail(true);
    try {
      const detail = await apiFetch(`/api/interventions/${iv.id}/detail`, {}, token);
      const enriched = { ...iv };
      if (detail.beneficiary) {
        enriched.beneficiary_info = detail.beneficiary;
        enriched.beneficiary_name = detail.beneficiary.name || iv.beneficiary_name;
      }
      if (detail.intervenant) {
        enriched.assigned_name = detail.intervenant.name || iv.assigned_name;
        enriched.structure_name = detail.intervenant.structure_name || detail.intervenant.intervention_structure;
        enriched.intervener_phone = detail.intervenant.phone;
        enriched.intervener_email = detail.intervenant.email;
        enriched.intervener_address = detail.intervenant.address;
        enriched.intervener_profession = detail.intervenant.profession;
        enriched.intervener_guardian_type = detail.intervenant.guardian_type;
        enriched.intervener_is_prescriber = detail.intervenant.is_prescriber;
        enriched.intervener_radius_km = detail.intervenant.intervention_radius_km;
        enriched.distance_km = detail.intervenant.distance_km || iv.distance_km;
      }
      if (detail.intervention) {
        enriched.report = detail.intervention.report || iv.report;
        enriched.timeline = detail.intervention.timeline || iv.timeline;
        enriched.accepted_at = detail.intervention.accepted_at || iv.accepted_at;
        enriched.completed_at = detail.intervention.completed_at || iv.completed_at;
        enriched.alert_message = detail.alert?.message || detail.intervention.notes || iv.notes;
        enriched.recipients = detail.intervention.recipients || iv.recipients || [];
      }
      if (detail.alert) {
        enriched.alert_message = detail.alert.message || enriched.alert_message;
      }
      setSelectedIv(enriched);
    } catch (e) { console.warn('Detail fetch failed', e); }
    finally { setLoadingDetail(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#9C27B0" /></View>;

  /* ─── INACTIF: écran plein avec fond violet + slide ─── */
  if (!user?.is_intervention_provider && Platform.OS === 'web') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 5 } as any}>
        <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />

        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 28px', width: '100%', maxWidth: 400 } as any}>
          {!slideActivated ? (
            <>
              <img src={LOGO_URL} alt="Chutex" className="anim-up" style={{ height: 60, marginTop: -30, marginBottom: 24, filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.15))' } as any} />
              <div className="anim-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 className="anim-up d2" style={{ fontSize: 28, fontWeight: 800, color: '#FFF', margin: '0 0 12px', textAlign: 'center' } as any}>Intervention Care</h2>
              <p className="anim-up d3" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 40px' } as any}>
                Activer votre espace d'intervenant pour etre missionne par la teleassistance Chutex Care.
              </p>

              {/* Slide button */}
              <div className="anim-up d4" style={{ width: '100%' } as any}>
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' } as any}
                  onMouseDown={(e: any) => {
                    const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
                    if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52;
                    const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - e.clientX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { thumb.style.transform = `translateX(${maxX}px)`; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); setSlideActivated(true); } };
                    const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                  }}
                  onTouchStart={(e: any) => {
                    const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
                    if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX;
                    const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); setSlideActivated(true); } };
                    const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
                    bar.addEventListener('touchmove', onMove, { passive: true }); bar.addEventListener('touchend', onUp);
                  }}>
                  <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour commencer</div>
                </div>
              </div>
            </>
          ) : (
            /* Code input — 6 circles PIN style */
            <div className="anim-up" style={{ width: '100%', textAlign: 'center' } as any}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>Activation</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' } as any}>Renseigner votre code.</p>

              {/* Glass red error */}
              {careError && (
                <div className="anim-up" style={{ width: '100%', padding: '12px 18px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 20, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#FCA5A5' } as any} onClick={() => setCareError('')}>
                  {careError}
                </div>
              )}

              {/* 6 digit circles */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32 } as any}>
                {[0,1,2,3,4,5].map(i => (
                  <input key={i} id={`pin-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={ivCode[i] || ''}
                    onChange={(e: any) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      const arr = ivCode.split('');
                      arr[i] = v;
                      const newCode = arr.join('').slice(0, 6);
                      setIvCode(newCode);
                      if (v && i < 5) { const next = document.getElementById(`pin-${i+1}`); if (next) (next as HTMLInputElement).focus(); }
                    }}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Backspace' && !ivCode[i] && i > 0) { const prev = document.getElementById(`pin-${i-1}`); if (prev) (prev as HTMLInputElement).focus(); }
                    }}
                    style={{
                      width: 48, height: 48, borderRadius: '50%', textAlign: 'center',
                      fontSize: 20, fontWeight: 700, color: '#FFF',
                      background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                      outline: 'none', caretColor: '#FFF', fontFamily: 'inherit',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    } as any}
                    onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = '0 0 12px rgba(255,255,255,0.15)'; }}
                    onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>

              <button onClick={() => activateCare()} disabled={activating || ivCode.length < 6}
                style={{
                  width: '100%', padding: '16px 32px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: '#FFF', color: '#111', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                  opacity: (activating || ivCode.length < 6) ? 0.5 : 1,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  transition: 'all 0.25s ease',
                } as any}>
                {activating ? 'Activation...' : 'Confirmer le code'}
              </button>
              <button onClick={() => setSlideActivated(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16, padding: 8 } as any}>Retour</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── INACTIF NATIVE ─── */
  if (!user?.is_intervention_provider) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1a0a2e' }}>
        <Icon name="shield-checkmark-outline" size={36} color="#9C27B0" />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 12 }}>Intervention Care</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 24 }}>Activez votre espace pour etre missionne.</Text>
        <TextInput testID="care-code-input" style={{ fontSize: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', textAlign: 'center', letterSpacing: 4, marginBottom: 16 }}
          placeholder="CODE INTERVENANT" placeholderTextColor="rgba(255,255,255,0.3)" value={ivCode} onChangeText={setIvCode} autoCapitalize="characters" />
        <TouchableOpacity testID="care-activate-btn" style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }} onPress={activateCare} disabled={activating}>
          {activating ? <ActivityIndicator color="#111" /> : <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>Activer</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ─── DETAIL PAGE: intervention (replaces entire view) ─── */
  if (selectedIv && Platform.OS === 'web') {
    const isDone = ['completed', 'resolved'].includes(selectedIv.status);
    const b = selectedIv.beneficiary_info || {};
    const isCare = !!selectedIv.structure_name;
    const benRows = [
      b.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: b.date_of_birth },
      b.gender && { icon: 'ri-user-line', label: 'Genre', value: b.gender },
      b.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: b.blood_type, color: '#EF4444' },
      (b.height_cm || b.weight_kg) && { icon: 'ri-ruler-line', label: 'Morphologie', value: [b.height_cm && `${b.height_cm} cm`, b.weight_kg && `${b.weight_kg} kg`].filter(Boolean).join(' - ') },
      b.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: b.medical_conditions, color: '#F59E0B', highlight: true },
      b.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: b.allergies, color: '#EF4444', highlight: true },
      b.doctor_name && { icon: 'ri-stethoscope-line', label: 'Medecin traitant', value: b.doctor_name + (b.doctor_phone ? ` — ${b.doctor_phone}` : ''), phone: b.doctor_phone },
      b.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact d\'urgence', value: b.emergency_contact_name + (b.emergency_contact_phone ? ` — ${b.emergency_contact_phone}` : ''), phone: b.emergency_contact_phone },
      b.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: b.address },
    ].filter(Boolean);

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={isDone ? BG_GREEN : BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />

        {/* Header */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setSelectedIv(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isDone ? 'Terminee' : 'En cours'}</span></div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{getCleanLabel(selectedIv.alert_type, selectedIv.alert_message)}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(selectedIv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          {/* FICHE BENEFICIAIRE */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Fiche beneficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(b.name || selectedIv.beneficiary_name || '?').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{b.name || selectedIv.beneficiary_name}</div>{b.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.phone}</div>}{b.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.email}</div>}</div>
            </div>
            {benRows.map((item: any, i: number) => (
              <div key={i}>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
                {item.highlight ? (
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}25` } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color }} /><div style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.label}</div></div><div style={{ fontSize: 13, color: '#FFF', marginTop: 4, lineHeight: 1.4 }}>{item.value}</div></div>
                ) : (
                  <div onClick={() => item.phone && (window.location.href = `tel:${item.phone}`)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color || 'rgba(255,255,255,0.35)', marginTop: 2, flexShrink: 0 }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981', marginTop: 2 }} />}</div>
                )}
              </div>
            ))}
            {b.phone && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} /><div onClick={() => window.location.href = `tel:${b.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler {(b.name || selectedIv.beneficiary_name)?.split(' ')[0]}</span></div></>)}
          </div>

          {/* FICHE INTERVENANT — cliquable pour popup */}
          {selectedIv.assigned_name && (
            <div onClick={() => setShowIntervenantPopup(true)} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: 'pointer' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</div>
                <div style={{ display: 'flex', gap: 6 } as any}>
                  {isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedIv.assigned_name}</div>{selectedIv.structure_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedIv.structure_name}</div>}<div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{selectedIv.status === 'completed' ? 'Terminee' : 'En cours'}{selectedIv.distance_km ? ` · ${selectedIv.distance_km} km` : ''}</div></div>
              </div>
            </div>
          )}

          {/* SLIDE BUTTON — Lancer navigation si assigné à moi, Suivre sinon */}
          {!isDone && selectedIv.id && (() => {
            const iAmThisIntervenant = selectedIv.assigned_to === user?.id;
            const slideLabel = iAmThisIntervenant ? 'Lancer la navigation' : 'Suivre l\'intervention';
            const slideIcon = iAmThisIntervenant ? 'ri-navigation-line' : 'ri-heart-line';
            const thumbBg = iAmThisIntervenant ? '#FFF' : 'rgba(255,255,255,0.15)';
            const thumbBorder = iAmThisIntervenant ? 'none' : '1px solid rgba(255,255,255,0.2)';
            const iconColor = iAmThisIntervenant ? '#111' : '#FFF';
            return (
              <div style={{ width: '100%', height: 52, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 10, touchAction: 'none' } as any}
                onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 46, height: 46, borderRadius: 999, background: thumbBg, border: thumbBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: iAmThisIntervenant ? '0 2px 8px rgba(0,0,0,0.15)' : 'none', willChange: 'transform', touchAction: 'none' } as any}><i className={slideIcon} style={{ fontSize: 20, color: iconColor }} /></div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700, pointerEvents: 'none', paddingLeft: 32 } as any}>{slideLabel}</div>
              </div>
            );
          })()}

          {/* RAPPORT */}
          {selectedIv.report && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Rapport d'intervention</div>
              {[
                selectedIv.report.description && { label: 'Description', value: selectedIv.report.description },
                selectedIv.report.actions_taken && { label: 'Actions realisees', value: selectedIv.report.actions_taken },
                selectedIv.report.patient_condition && { label: 'Etat du patient', value: selectedIv.report.patient_condition === 'stable' ? 'Stable' : selectedIv.report.patient_condition },
                selectedIv.report.follow_up_notes && { label: 'Suivi necessaire', value: selectedIv.report.follow_up_notes, warn: true },
              ].filter(Boolean).map((e: any, i: number, arr: any[]) => (
                <div key={i}>{e.warn ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', margin: '6px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.4 }}>{e.value}</div></div>) : (<div style={{ padding: '10px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{e.value}</div></div>)}{i < arr.length - 1 && !e.warn && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}</div>
              ))}
              {selectedIv.report.completed_by && <><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} /><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Redige par {selectedIv.report.completed_by}</div></>}
            </div>
          )}

          {/* CHRONOLOGIE */}
          {selectedIv.timeline && selectedIv.timeline.length > 0 && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Chronologie</div>
              {selectedIv.timeline.map((t: any, i: number) => (
                <div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} />}<div style={{ display: 'flex', gap: 10 } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: i === selectedIv.timeline.length - 1 ? '#10B981' : 'rgba(255,255,255,0.25)', marginTop: 5, flexShrink: 0 } as any} /><div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{t.note}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(t.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div></div></div>
              ))}
            </div>
          )}
        </div>

        {/* POPUP FICHE INTERVENANT — GLASS */}
        {showIntervenantPopup && selectedIv.assigned_name && (
          <div onClick={() => setShowIntervenantPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>Fiche intervenant</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                  {isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}
                  <div onClick={() => setShowIntervenantPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as any}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: isCare ? 'rgba(124,92,255,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isCare ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 26, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name}</div>{selectedIv.intervener_profession && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{selectedIv.intervener_profession}</div>}{!selectedIv.intervener_profession && selectedIv.structure_name && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{selectedIv.structure_name}</div>}</div>
              </div>
              {[
                selectedIv.intervener_phone && { icon: 'ri-phone-line', label: 'Telephone', value: selectedIv.intervener_phone, phone: true },
                selectedIv.intervener_email && { icon: 'ri-mail-line', label: 'Email', value: selectedIv.intervener_email },
                selectedIv.intervener_profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: selectedIv.intervener_profession },
                selectedIv.structure_name && { icon: 'ri-building-line', label: 'Structure', value: selectedIv.structure_name },
                selectedIv.intervener_address && { icon: 'ri-map-pin-line', label: 'Adresse', value: selectedIv.intervener_address },
                selectedIv.intervener_radius_km && { icon: 'ri-map-pin-range-line', label: 'Rayon', value: `${selectedIv.intervener_radius_km} km` },
                selectedIv.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${selectedIv.distance_km} km` },
                selectedIv.accepted_at && { icon: 'ri-time-line', label: 'Accepte a', value: new Date(selectedIv.accepted_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) },
                selectedIv.completed_at && { icon: 'ri-check-double-line', label: 'Termine a', value: new Date(selectedIv.completed_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) },
              ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
                <div key={i}>
                  <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── ACTIF: page interventions plein ecran ─── */
  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div onClick={() => setShowStructurePopup(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginBottom: 10 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {user.intervention_structure || user.structure_name || 'Structure'}</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Intervention Care</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setIvTab('active')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'active' ? '#FFF' : 'transparent', color: ivTab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours</div>
              <div onClick={() => setIvTab('done')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'done' ? '#FFF' : 'transparent', color: ivTab === 'done' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Cloturees</div>
            </div>
          </div>
          {/* Cards glass */}
          {user?.is_intervention_provider && (displayedIvs.length > 0 ? displayedIvs.map(iv => {
            const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
            const hasAssigned = !!iv.assigned_to;
            const iAmAssigned = iv.assigned_to === user?.id;
            const isPending = iv.status === 'pending_acceptance';
            return (
              <div key={iv.id} data-testid={`iv-${iv.id}`} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, minHeight: 110, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any} data-glass-card>
                <div onClick={() => selectIntervention(iv)} style={{ cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                    <div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.beneficiary_name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Le {new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isActive ? 'rgba(124,92,255,0.25)' : 'rgba(16,185,129,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: isActive ? '#A78BFA' : '#10B981' } as any} data-pulse-dot /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{isActive ? 'En cours' : 'Terminee'}</span></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 12 : 0 } as any}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{iv.alert_message || 'Intervention'}</div>
                    {iv.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{iv.distance_km} Km</span></div>}
                  </div>
                </div>
                {/* Slide: Lancer navigation (assigned to me) */}
                {isActive && iAmAssigned && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-navigation-line" style={{ fontSize: 18, color: '#111' }} /></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Lancer la navigation</div>
                  </div>
                )}
                {/* Slide: Suivre (assigned to someone else) */}
                {isActive && hasAssigned && !iAmAssigned && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-heart-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Suivre l'intervention</div>
                  </div>
                )}
                {/* Slide: Intervenir (pending, not yet assigned) */}
                {isActive && isPending && !hasAssigned && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); apiFetch(`/api/interventions/${iv.id}/accept`, { method: 'POST' }, token).then(() => { fetchIvs(); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); }).catch(() => {}); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); apiFetch(`/api/interventions/${iv.id}/accept`, { method: 'POST' }, token).then(() => { fetchIvs(); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); }).catch(() => {}); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-shield-check-line" style={{ fontSize: 18, color: '#111' }} /></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Intervenir</div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-map-pin-range-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Aucune intervention {ivTab === 'active' ? 'en cours' : 'terminee'}</div></div>
          ))}
        </div>
        {/* POPUP STRUCTURE CARE — SANS CARTE, DIRECT SUR BLUR */}
        {showStructurePopup && (
          <div onClick={() => setShowStructurePopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => setShowStructurePopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>
              {/* Title */}
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Structure d'intervention</div>
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 } as any}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 28, color: '#A78BFA' }} /></div>
                <div><div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', letterSpacing: -0.5 }}>{user.intervention_structure || user.structure_name || 'Structure'}</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Intervenant actif</span></div></div>
              </div>
              {/* Info rows */}
              {[
                user.intervention_structure && { icon: 'ri-building-line', label: 'Structure', value: user.intervention_structure },
                user.intervention_radius_km && { icon: 'ri-map-pin-range-line', label: 'Rayon d\'intervention', value: `${user.intervention_radius_km} km` },
                user.phone && { icon: 'ri-phone-line', label: 'Telephone', value: user.phone, phone: true },
                user.email && { icon: 'ri-mail-line', label: 'Email', value: user.email },
                user.name && { icon: 'ri-user-line', label: 'Intervenant', value: user.name },
              ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
                <div key={i}>
                  <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}
                </div>
              ))}
              {/* Deactivate button */}
              <div onClick={() => { deactivateCare(); setShowStructurePopup(false); }} style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 14, fontWeight: 700, marginTop: 20, transition: 'all 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>Desactiver mon espace Care</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#111' }} contentContainerStyle={{ paddingBottom: 80, padding: 16 }}>
      {user?.is_intervention_provider && (displayedIvs.length > 0 ? displayedIvs.map(iv => {
        const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
        return (
          <TouchableOpacity key={iv.id} testID={`iv-${iv.id}`} onPress={() => selectIntervention(iv)}>
            <View style={{ borderRadius: 20, overflow: 'hidden', padding: 18, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.beneficiary_name}</Text></View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{iv.alert_message || 'Intervention'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }) : (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#888' }}>Aucune intervention</Text>
        </View>
      ))}
    </ScrollView>
  );
}


/* ====================== ADMIN INTERVENANTS ====================== */
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;

  const BG_ADM_IV = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
  if (Platform.OS === 'web') {
    const activeIvsAdm = interventions.filter((iv: any) => ['pending_acceptance','in_progress','en_route'].includes(iv.status));
    return (
      <div data-testid="admin-intervenants" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_ADM_IV} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '24px 20px 14px', zIndex: 5, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Intervenants Care</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{codes.length} codes · {providers.length} actifs · {interventions.length} missions</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 14 } as any}>
            {([['codes', `Codes (${codes.length})`], ['providers', `Actifs (${providers.length})`], ['interventions', `Missions (${interventions.length})`]] as const).map(([k, l]) => (
              <div key={k} onClick={() => setTab(k)} style={{ padding: '10px 18px', borderRadius: 999, cursor: 'pointer', background: tab === k ? '#FFF' : 'transparent', color: tab === k ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 } as any}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {tab === 'codes' && (<>
            <div onClick={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' }); setShowModal(true); }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-add-circle-line" style={{ fontSize: 16 }} />Creer un code</div>
            {codes.map((c: any) => (<div key={c.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: 2 }}>{c.code}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.structure_name}</div></div><div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => openEdit(c)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-edit-line" style={{ fontSize: 14, color: '#FFF' }} /></div><div onClick={() => toggleCode(c.id)} style={{ width: 32, height: 32, borderRadius: 999, background: c.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className={c.active ? 'ri-toggle-line' : 'ri-toggle-fill'} style={{ fontSize: 14, color: c.active ? '#10B981' : '#EF4444' }} /></div></div></div><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} /><div style={{ display: 'flex', gap: 12 } as any}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Rayon: {c.default_radius_km || 30}km</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.uses_count || 0}/{c.max_uses} uses</span><span style={{ fontSize: 11, color: c.active ? '#10B981' : '#EF4444' }}>{c.active ? 'Actif' : 'Desactive'}</span></div></div>))}
          </>)}
          {tab === 'providers' && providers.map((p: any) => (<div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{p.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.intervention_structure || p.structure_name || ''}</div></div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{p.total_interventions || 0} missions</div></div>))}
          {tab === 'interventions' && interventions.map((iv: any) => { const isAct = ['pending_acceptance','in_progress','en_route'].includes(iv.status); return (<div key={iv.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{iv.beneficiary_name || 'Intervention'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.assigned_name || 'En attente'}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isAct ? 'rgba(124,92,255,0.2)' : 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 5, height: 5, borderRadius: 3, background: isAct ? '#A78BFA' : '#10B981' } as any} /><span style={{ fontSize: 9, fontWeight: 600, color: '#FFF' }}>{isAct ? 'En cours' : 'Terminee'}</span></div></div></div>); })}
        </div>
        {showModal && (<div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowModal(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Intervenants Care</div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>{editCode ? 'Modifier' : 'Nouveau code'}</div>{['structure_name','raison_sociale','siret','adresse','telephone','email_contact','radius_km'].map(k => (<div key={k} style={{ marginBottom: 12 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div><input value={(form as any)[k]} onChange={(e: any) => setForm({...form, [k]: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div>))}<div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}><div onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={saveCode} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Enregistrer'}</div></div></div></div>)}
      </div>
    );
  }

  /* NATIVE FALLBACK */
  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        {([['codes', `Codes (${codes.length})`], ['providers', `Actifs (${providers.length})`], ['interventions', `Missions (${interventions.length})`]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === k && { backgroundColor: '#FFFFFF' }]}
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
            <Icon name="add" size={16} color="#111827" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
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
              <TouchableOpacity onPress={() => openEdit(c)} style={{ padding: 6 }}><Icon name="create-outline" size={16} color={Colors.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => toggleCode(c.id)} style={{ padding: 6 }}><Icon name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={c.active ? Colors.textMuted : Colors.success} /></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCode(c.id)} style={{ padding: 6 }}><Icon name="trash-outline" size={16} color={Colors.destructive} /></TouchableOpacity>
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
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{p.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ivName}>{p.name}</Text>
                  <Text style={s.ivSt}>{p.structure_name || p.intervention_structure} · {p.radius_km || p.intervention_radius_km || 30}km</Text>
                  {p.email && <Text style={{ fontSize: 10, color: Colors.textMuted }}>{p.email}</Text>}
                  {p.phone && <Text style={{ fontSize: 10, color: Colors.textMuted }}>{p.phone}</Text>}
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#4CAF5015' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981' }}>ACTIF</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {providers.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 36 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(76,175,80,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="medkit-outline" size={28} color="#A5D6A7" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Aucun intervenant inscrit</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }}>Creez un code d'intervention dans l'onglet "Codes" pour permettre aux intervenants de s'inscrire.</Text>
        </View>}
      </>}

      {/* INTERVENTIONS TAB - Redesigned */}
      {tab === 'interventions' && <>
        {interventions.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { val: interventions.filter((i: any) => ['pending_acceptance', 'dispatched'].includes(i.status)).length, label: 'En attente', color: '#FF9800' },
              { val: interventions.filter((i: any) => ['in_progress', 'en_route'].includes(i.status)).length, label: 'En cours', color: '#2196F3' },
              { val: interventions.filter((i: any) => i.status === 'completed').length, label: 'Terminees', color: '#10B981' },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: '#F0F1F3', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.val}</Text>
                <Text style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
        {interventions.map((iv: any) => {
          const sc: any = { pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' };
          const sl: any = { pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' };
          const statusIcon: any = { pending_acceptance: 'time', in_progress: 'navigate', en_route: 'car', completed: 'checkmark-circle', dispatched: 'send' };
          const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
          return (
            <TouchableOpacity key={iv.id} onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: iv.id } })} activeOpacity={0.7}
              data-testid={`admin-intervention-${iv.id}`}>
              <View style={{ backgroundColor: '#F0F1F3', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: sc[iv.status] || '#888' }}>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: (sc[iv.status] || '#888') + '12', justifyContent: 'center', alignItems: 'center' }}>
                      <Icon name={(statusIcon[iv.status] || 'medical') as any} size={20} color={sc[iv.status] || '#888'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{iv.beneficiary_name}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>{iv.alert_message || iv.notes || 'Intervention'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ backgroundColor: (sc[iv.status] || '#888') + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: sc[iv.status] || '#888' }}>{(sl[iv.status] || iv.status).toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                  {iv.assigned_name && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: 'rgba(76,175,80,0.04)', borderRadius: 10, padding: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>{iv.assigned_name?.charAt(0)?.toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2E7D32' }}>{iv.assigned_name}</Text>
                        <Text style={{ fontSize: 10, color: '#6B7280' }}>{iv.structure_name || 'Intervenant'}</Text>
                      </View>
                      {isActive && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />}
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)', backgroundColor: 'rgba(0,0,0,0.015)' }}>
                  <Icon name="time-outline" size={12} color="#AAA" />
                  <Text style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>{new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#2196F3' }}>Voir le detail</Text>
                  <Icon name="chevron-forward" size={14} color="#2196F3" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {interventions.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 24 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(33,150,243,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Icon name="medkit-outline" size={28} color="#90CAF9" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Aucune intervention</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }}>
              Les interventions apparaitront ici quand une alerte sera dispatchee a un SAAD partenaire.
            </Text>
          </View>
        )}
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
                {saving ? <ActivityIndicator color="#111827" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>{editCode ? 'Modifier' : 'Créer'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

/* ===== COMPANY: PRESCRIPTIONS LIST ===== */
function CompanyPrescriptions({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'pending'|'subscribed'>('pending');
  const [selectedPresc, setSelectedPresc] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch('/api/company/dashboard', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#111827" /></View>;
  if (!data) return null;

  const allPrescs = data.prescriptions || [];
  const pending = allPrescs.filter((p: any) => p.status === 'pending');
  const subscribed = allPrescs.filter((p: any) => p.status === 'subscribed');
  const displayed = tab === 'pending' ? pending : subscribed;
  const total = displayed.reduce((s: number, p: any) => s + (p.commission || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Prescriptions</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{allPrescs.length} prescriptions au total</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setTab('pending')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'pending' ? '#FFF' : '#888' }}>En cours ({pending.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'subscribed' && { backgroundColor: '#10B981' }]} onPress={() => setTab('subscribed')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'subscribed' ? '#FFF' : '#888' }}>Validees ({subscribed.length})</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 }}>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Total commissions</Text>
        <Text style={{ fontSize: 16, fontWeight: '900', color: tab === 'pending' ? '#FF9800' : '#4CAF50' }}>{total} EUR</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {displayed.map((p: any) => (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => setSelectedPresc(p)}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={p.status === 'subscribed' ? 'checkmark-circle' : 'time'} size={16} color={p.status === 'subscribed' ? '#4CAF50' : '#FF9800'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>Par: {p.guardian_name}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{p.commission}EUR</Text>
                <Icon name="chevron-forward" size={14} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {displayed.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name={tab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Aucune prescription {tab === 'pending' ? 'en cours' : 'validee'}</Text>
          </View>
        )}
      </ScrollView>
      {/* Detail modal - Premium Design */}
      <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
            {selectedPresc && <>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ padding: 4, marginRight: 12 }}>
                  <Icon name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' }}>Fiche Prescription</Text>
                <TouchableOpacity onPress={() => setSelectedPresc(null)}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Identity Card */}
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 24, marginBottom: 12, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {}) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF' }}>{selectedPresc.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>{selectedPresc.beneficiary_name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: selectedPresc.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPresc.status === 'subscribed' ? '#2E7D32' : '#E65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>{selectedPresc.status === 'subscribed' ? 'Souscrit' : 'En attente'}</Text>
                        </View>
                        <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#1565C0', textTransform: 'uppercase' }}>{selectedPresc.subscription_type}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {[
                    { icon: 'mail-outline', label: 'Email', value: selectedPresc.beneficiary_email },
                    { icon: 'call-outline', label: 'Telephone', value: selectedPresc.beneficiary_phone },
                    { icon: 'person-circle-outline', label: 'Prescripteur', value: selectedPresc.guardian_name },
                    { icon: 'cash-outline', label: 'Commission', value: `${selectedPresc.commission} EUR` },
                    { icon: 'calendar-outline', label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleDateString('fr-FR') : '' },
                  ].map(({ icon, label, value }) => value ? (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                      <Icon name={icon as any} size={16} color="#888" />
                      <Text style={{ fontSize: 12, color: '#6B7280', width: 100 }}>{label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }}>{value}</Text>
                    </View>
                  ) : null)}
                </View>
                {/* Commission highlight */}
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{selectedPresc.commission} EUR</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Commission {selectedPresc.status === 'subscribed' ? 'validee' : 'en attente'}</Text>
                </View>
              </ScrollView>
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===== COMPANY: INTERVENTIONS TAB (with intervenants sub-section) ===== */
function CompanyInterventionsTab({ token }: { token: string }) {
  const router = useRouter();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ivTab, setIvTab] = useState<'active' | 'done'>('active');
  const [selectedIv, setSelectedIv] = useState<any>(null);
  const [ivDetail, setIvDetail] = useState<any>(null);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);
  const [showAllIntervenants, setShowAllIntervenants] = useState(false);
  const [search, setSearch] = useState('');
  const [searchIv, setSearchIv] = useState('');

  const selectIv = useCallback(async (iv: any) => {
    setSelectedIv(iv);
    setIvDetail(null);
    try { const d = await apiFetch(`/api/interventions/${iv.id}/detail`, {}, token); setIvDetail(d); } catch {}
  }, [token]);

  const fetchData = useCallback(async () => {
    try {
      const [ivs, ivants] = await Promise.all([
        apiFetch('/api/company/interventions', {}, token),
        apiFetch('/api/company/intervenants', {}, token),
      ]);
      setInterventions(Array.isArray(ivs) ? ivs : []);
      setIntervenants(Array.isArray(ivants) ? ivants : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); const t = setInterval(fetchData, 10000); return () => clearInterval(t); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#FFF" /></View>;

  const activeIvs = interventions.filter((iv: any) => ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status));
  const doneIvs = interventions.filter((iv: any) => iv.status === 'completed');
  const displayedIvs = ivTab === 'active' ? activeIvs : doneIvs;
  const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
  const BG_GREEN_IV = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_HEADER = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';

  /* ─── ALL INTERVENANTS: full-screen list (early return) ─── */
  if (showAllIntervenants && Platform.OS === 'web') {
    const filtered = search.trim() ? intervenants.filter((iv: any) => iv.name?.toLowerCase().includes(search.toLowerCase())) : intervenants;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' } as any} /></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => { setShowAllIntervenants(false); setSearch(''); }} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Tous les intervenants ({intervenants.length})</div>
        </div>
        <div style={{ position: 'relative', zIndex: 5, padding: '12px 20px 0' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un intervenant..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '12px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {filtered.map((iv: any) => (
            <div key={iv.id} onClick={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{iv.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.profession || 'Intervenant Care'} · {iv.agency_name || ''}</div></div>
              <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.total_interventions || 0} missions</div>{iv.active_interventions > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>{iv.active_interventions} actives</div>}</div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-group-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>{search ? 'Aucun resultat' : 'Aucun intervenant'}</div></div>}
        </div>
      </div>
    );
  }

  /* ─── DETAIL PAGE: copie exacte du gardien ─── */
  if (selectedIv && Platform.OS === 'web') {
    const isDone = ['completed', 'resolved'].includes(selectedIv.status);
    const b = selectedIv.beneficiary_info || {};
    const isCare = !!selectedIv.structure_name;
    const benRows = [
      b.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: b.date_of_birth },
      b.gender && { icon: 'ri-user-line', label: 'Genre', value: b.gender },
      b.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: b.blood_type, color: '#EF4444' },
      (b.height_cm || b.weight_kg) && { icon: 'ri-ruler-line', label: 'Morphologie', value: [b.height_cm && `${b.height_cm} cm`, b.weight_kg && `${b.weight_kg} kg`].filter(Boolean).join(' - ') },
      b.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: b.medical_conditions, color: '#F59E0B', highlight: true },
      b.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: b.allergies, color: '#EF4444', highlight: true },
      b.doctor_name && { icon: 'ri-stethoscope-line', label: 'Medecin traitant', value: b.doctor_name + (b.doctor_phone ? ` — ${b.doctor_phone}` : ''), phone: b.doctor_phone },
      b.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact d\'urgence', value: b.emergency_contact_name + (b.emergency_contact_phone ? ` — ${b.emergency_contact_phone}` : ''), phone: b.emergency_contact_phone },
      b.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: b.address },
    ].filter(Boolean);
    const ivDur = selectedIv.accepted_at && (selectedIv.completed_at || (isDone ? selectedIv.resolved_at : null)) ? Math.round((new Date(selectedIv.completed_at || selectedIv.resolved_at).getTime() - new Date(selectedIv.accepted_at).getTime()) / 60000) : null;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={isDone ? BG_GREEN_IV : BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setSelectedIv(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isDone ? 'Terminee' : 'En cours'}</span></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{selectedIv.alert_message || 'Intervention'}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(selectedIv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
          {/* BENEFICIAIRE */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Fiche beneficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(b.name || selectedIv.beneficiary_name || '?').charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{b.name || selectedIv.beneficiary_name}</div>{b.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.phone}</div>}{b.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.email}</div>}</div></div>
            {benRows.map((item: any, i: number) => (<div key={i}><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />{item.highlight ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}25` } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color }} /><div style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.label}</div></div><div style={{ fontSize: 13, color: '#FFF', marginTop: 4, lineHeight: 1.4 }}>{item.value}</div></div>) : (<div onClick={() => item.phone && (window.location.href = `tel:${item.phone}`)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color || 'rgba(255,255,255,0.35)', marginTop: 2, flexShrink: 0 }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981', marginTop: 2 }} />}</div>)}</div>))}
            {b.phone && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} /><div onClick={() => window.location.href = `tel:${b.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler {(b.name || selectedIv.beneficiary_name)?.split(' ')[0]}</span></div></>)}
          </div>
          {/* INTERVENANT — enriched from detail API */}
          {selectedIv.assigned_name && (() => {
            const p = ivDetail?.intervenant || {};
            const ivPhone = p.phone || '';
            const ivEmail = p.email || '';
            const ivProfession = p.profession || '';
            const ivStructure = p.structure_name || selectedIv.intervenant_structure || selectedIv.structure_name || '';
            const ivAddress = p.address || '';
            return (<div onClick={() => setShowIntervenantPopup(true)} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: 'pointer' } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</div><div style={{ display: 'flex', gap: 6 } as any}>{isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}<i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedIv.assigned_name}</div>{ivProfession && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{ivProfession}</div>}{ivStructure && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{ivStructure}</div>}<div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{isDone ? 'Terminee' : 'En cours'}{selectedIv.distance_km ? ` · ${selectedIv.distance_km} km` : ''}{ivDur ? ` · ${ivDur >= 60 ? `${Math.floor(ivDur/60)}h${ivDur%60>0?String(ivDur%60).padStart(2,'0'):''}` : `${ivDur} min`}` : ''}</div></div></div></div>);
          })()}
          {/* SUIVRE */}
          {/* SLIDE BUTTON — Suivre l'intervention */}
          {!isDone && selectedIv.id && (
            <div style={{ width: '100%', height: 52, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 10, touchAction: 'none' } as any}
              onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
              onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
              <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 46, height: 46, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-heart-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700, pointerEvents: 'none', paddingLeft: 32 } as any}>Suivre l'intervention</div>
            </div>
          )}
          {/* RAPPORT */}
          {selectedIv.report && (<div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Rapport d'intervention</div>{[selectedIv.report.description && { label: 'Description', value: selectedIv.report.description }, selectedIv.report.actions_taken && { label: 'Actions realisees', value: selectedIv.report.actions_taken }, selectedIv.report.patient_condition && { label: 'Etat du patient', value: selectedIv.report.patient_condition === 'stable' ? 'Stable' : selectedIv.report.patient_condition }, selectedIv.report.follow_up_notes && { label: 'Suivi necessaire', value: selectedIv.report.follow_up_notes, warn: true }].filter(Boolean).map((e: any, i: number, arr: any[]) => (<div key={i}>{e.warn ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', margin: '6px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.4 }}>{e.value}</div></div>) : (<div style={{ padding: '10px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{e.value}</div></div>)}{i < arr.length - 1 && !e.warn && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}</div>))}{selectedIv.report.completed_by && <><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} /><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Redige par {selectedIv.report.completed_by}</div></>}</div>)}
          {/* TIMELINE */}
          {selectedIv.timeline && selectedIv.timeline.length > 0 && (<div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Chronologie</div>{selectedIv.timeline.map((t: any, ti: number) => (<div key={ti}>{ti > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} />}<div style={{ display: 'flex', gap: 10 } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: ti === selectedIv.timeline.length - 1 ? '#10B981' : 'rgba(255,255,255,0.25)', marginTop: 5, flexShrink: 0 } as any} /><div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{t.note}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(t.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div></div></div>))}</div>)}
        </div>
        {/* POPUP INTERVENANT — enriched */}
        {showIntervenantPopup && selectedIv.assigned_name && (() => {
          const p = ivDetail?.intervenant || {};
          const pPhone = p.phone || '';
          const pEmail = p.email || '';
          const pProfession = p.profession || '';
          const pStructure = p.structure_name || selectedIv.intervenant_structure || selectedIv.structure_name || '';
          const pAddress = p.address || '';
          return <div onClick={() => setShowIntervenantPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Fiche intervenant</span><div onClick={() => setShowIntervenantPopup(false)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}><div style={{ width: 56, height: 56, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div><div><div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name}</div>{pProfession && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{pProfession}</div>}</div></div>{[pPhone && { icon: 'ri-phone-line', label: 'Telephone', value: pPhone, phone: true }, pEmail && { icon: 'ri-mail-line', label: 'Email', value: pEmail }, pProfession && { icon: 'ri-stethoscope-line', label: 'Profession', value: pProfession }, pStructure && { icon: 'ri-building-line', label: 'Structure', value: pStructure }, pAddress && { icon: 'ri-map-pin-line', label: 'Adresse', value: pAddress }, selectedIv.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${selectedIv.distance_km} km` }, selectedIv.accepted_at && { icon: 'ri-time-line', label: 'Accepte a', value: new Date(selectedIv.accepted_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) }, selectedIv.completed_at && { icon: 'ri-check-double-line', label: 'Termine a', value: new Date(selectedIv.completed_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) }, { icon: 'ri-pulse-line', label: 'Statut', value: isDone ? 'Terminee' : selectedIv.status === 'in_progress' ? 'En cours' : selectedIv.status }].filter(Boolean).map((item: any, i: number) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}<div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '4px 0' } as any}><div style={{ width: 34, height: 34, borderRadius: 10, background: item.phone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.08)', border: `1px solid ${item.phone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div></div>))}</div></div>;
        })()}
      </div>
    );
  }

  /* ─── LIST: copie exacte du design gardien ─── */
  if (Platform.OS === 'web') {
    const filteredIvs = searchIv.trim() ? displayedIvs.filter((iv: any) => iv.beneficiary_name?.toLowerCase().includes(searchIv.toLowerCase()) || iv.assigned_name?.toLowerCase().includes(searchIv.toLowerCase())) : displayedIvs;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        {/* Everything scrolls together */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.25)', marginBottom: 12 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>Actif</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Intervention Care</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 14 } as any}>
              <div onClick={() => setIvTab('active')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'active' ? '#FFF' : 'transparent', color: ivTab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours ({activeIvs.length})</div>
              <div onClick={() => setIvTab('done')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'done' ? '#FFF' : 'transparent', color: ivTab === 'done' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Cloturees ({doneIvs.length})</div>
            </div>
            <div><div onClick={() => setShowAllIntervenants(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
              <div style={{ display: 'flex' } as any}>{intervenants.slice(0, 3).map((iv2: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.3)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{iv2.name?.charAt(0)}</span></div>))}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Voir les {intervenants.length} intervenants</span>
            </div></div>
          </div>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12, transition: 'all 0.3s ease' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} /><input value={searchIv} onChange={(e: any) => setSearchIv(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div>
          {/* Cards */}
          {filteredIvs.map((iv: any) => { const isActive = ['pending_acceptance','in_progress','en_route','dispatched'].includes(iv.status); const hasAssigned = !!iv.assigned_to; return (
            <div key={iv.id} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, minHeight: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div onClick={() => selectIv(iv)} style={{ cursor: 'pointer' } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                  <div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.beneficiary_name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Le {new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isActive ? 'rgba(124,92,255,0.25)' : 'rgba(16,185,129,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: isActive ? '#A78BFA' : '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{isActive ? 'En cours' : 'Terminee'}</span></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 12 : 0 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{iv.alert_message || (hasAssigned ? iv.assigned_name : 'En attente') || 'Intervention'}</div>
                  {iv.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{iv.distance_km} Km</span></div>}
                </div>
              </div>
              {isActive && hasAssigned && (
                <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                  onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                  <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-heart-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Suivre l'intervention</div>
                </div>
              )}
            </div>
          ); })}
          {filteredIvs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-map-pin-range-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>{searchIv ? 'Aucun resultat' : `Aucune intervention ${ivTab === 'active' ? 'en cours' : 'terminee'}`}</div></div>}
        </div>
      </div>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Interventions</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{interventions.length} interventions · {intervenants.length} intervenants</Text>
      </View>

      {/* Main tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'interventions' && { backgroundColor: '#FFFFFF' }]} onPress={() => setTab('interventions')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'interventions' ? '#FFF' : '#888' }}>Missions ({interventions.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'intervenants' && { backgroundColor: '#FFFFFF' }]} onPress={() => setTab('intervenants')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'intervenants' ? '#FFF' : '#888' }}>Intervenants ({intervenants.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>

        {/* INTERVENTIONS SUB */}
        {tab === 'interventions' && <>
          <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 11 }, ivTab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setIvTab('pending')}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: ivTab === 'pending' ? '#FFF' : '#888' }}>En attente ({pendingIvs.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 11 }, ivTab === 'active' && { backgroundColor: '#2196F3' }]} onPress={() => setIvTab('active')}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: ivTab === 'active' ? '#FFF' : '#888' }}>En cours ({activeIvs.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 11 }, ivTab === 'completed' && { backgroundColor: '#10B981' }]} onPress={() => setIvTab('completed')}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: ivTab === 'completed' ? '#FFF' : '#888' }}>Terminees ({completedIvs.length})</Text>
            </TouchableOpacity>
          </View>
          {displayedIvs.map((iv: any) => (
            <TouchableOpacity key={iv.id} activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: iv.id } })}>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: stColor(iv.status), ...glass }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: stColor(iv.status) + '15', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={iv.status === 'completed' ? 'checkmark-circle' : iv.status === 'pending_acceptance' ? 'time' : 'navigate'} size={22} color={stColor(iv.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{iv.beneficiary_name}</Text>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{iv.alert_message || 'Intervention'}</Text>
                  </View>
                  {iv.distance_km && (
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: stColor(iv.status) }}>{iv.distance_km}</Text>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: '#6B7280' }}>KM</Text>
                    </View>
                  )}
                  <Icon name="chevron-forward" size={16} color="#888" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}>
                  <Icon name="person" size={12} color="#9C27B0" />
                  <Text style={{ fontSize: 11, color: '#9C27B0', fontWeight: '600', flex: 1 }}>{iv.intervenant_name || iv.assigned_name || 'En attente d\'acceptation'}</Text>
                  <View style={{ backgroundColor: stColor(iv.status) + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: stColor(iv.status) }}>{stLabel(iv.status).toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {displayedIvs.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF', borderRadius: 24, ...glass }}>
              <Icon name={ivTab === 'pending' ? 'time-outline' : ivTab === 'active' ? 'navigate-outline' : 'checkmark-circle-outline'} size={40} color="#CCC" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#6B7280', marginTop: 12 }}>
                {ivTab === 'pending' ? 'Aucune intervention en attente' : ivTab === 'active' ? 'Aucune intervention en cours' : 'Aucune intervention terminee'}
              </Text>
            </View>
          )}
        </>}

        {/* INTERVENANTS SUB */}
        {tab === 'intervenants' && <>
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
              <Icon name="search-outline" size={16} color="#888" />
              <TextInput style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
                placeholder="Rechercher..." placeholderTextColor="#AAA" value={search} onChangeText={setSearch} />
            </View>
          </View>
          {filteredIntervenants.map((iv: any) => (
            <TouchableOpacity key={iv.id} activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })}>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, ...glass }}>
                <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{iv.name}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.profession || 'Intervenant Care'} · {iv.agency_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.total_interventions} missions</Text>
                  {iv.active_interventions > 0 && (
                    <View style={{ backgroundColor: '#FF980015', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF9800' }}>{iv.active_interventions} actives</Text>
                    </View>
                  )}
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </View>
            </TouchableOpacity>
          ))}
        </>}
      </ScrollView>
    </View>
  );
}

/* ===== COMPANY: INTERVENANTS LIST (kept for backward compat) ===== */
function CompanyIntervenants({ token }: { token: string }) {
  const router = useRouter();
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try { setIntervenants(await apiFetch('/api/company/intervenants', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#111827" /></View>;

  const filtered = search.trim()
    ? intervenants.filter((iv: any) => iv.name?.toLowerCase().includes(search.toLowerCase()) || iv.email?.toLowerCase().includes(search.toLowerCase()))
    : intervenants;

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Intervenants</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{intervenants.length} intervenants Care</Text>
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
          <Icon name="search-outline" size={16} color="#888" />
          <TextInput style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
            placeholder="Rechercher un intervenant..." placeholderTextColor="#AAA" value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" size={16} color="#AAA" /></TouchableOpacity>}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {filtered.map((iv: any) => (
          <TouchableOpacity key={iv.id} activeOpacity={0.7} data-testid={`intervenant-card-${iv.id}`}
            onPress={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, ...glass }}>
              <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{iv.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.profession || 'Intervenant Care'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Icon name="business-outline" size={11} color="#FF9800" />
                  <Text style={{ fontSize: 10, color: '#FF9800', fontWeight: '600' }}>{iv.agency_name}</Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>· {iv.intervention_radius_km}km</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.total_interventions} missions</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                  {iv.active_interventions > 0 && (
                    <View style={{ backgroundColor: '#FF980015', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF9800' }}>{iv.active_interventions} actives</Text>
                    </View>
                  )}
                  <View style={{ backgroundColor: '#4CAF5015', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>{iv.completed_interventions} term.</Text>
                  </View>
                </View>
              </View>
              <Icon name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="medkit-outline" size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>{search ? 'Aucun resultat' : 'Aucun intervenant'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ===== MAIN ===== */
export default function TeleconsultScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  
  if (!user || !token) return null;
  const r = user.active_role || user.role;

  // Company sees interventions with intervenants
  if (r === 'prescriber_company') {
    if (Platform.OS === 'web') return <CompanyInterventionsTab token={token} />;
    return <CompanyInterventionsTab token={token} />;
  }

  // Guardian + Beneficiary: full screen, no wrapper header
  if (r === 'guardian') {
    return <GuardianInterventions token={token} user={user} />;
  }
  if (r === 'beneficiary') {
    return <BeneficiaryTeleconsult token={token} />;
  }

  // Teleassistance + Admin: full screen web
  if (Platform.OS === 'web') {
    if (r === 'teleassistance') return <TeleassistanceDashboard token={token} />;
    if (r === 'admin') return <AdminIntervenants token={token} />;
  }

  return (
    <View key={r} style={[s.safe, { backgroundColor: '#FFFFFF' }]} testID="teleconsult-screen">
      <View style={s.header}>
        <Text style={[s.title, { color: '#111827' }]}>{r === 'teleassistance' ? 'Teleassistance IA' : r === 'admin' ? 'Intervenants' : 'Teleconsultation'}</Text>
        {r === 'teleassistance' && <Text style={[s.subtitle, { color: '#9CA3AF' }]}>Plateau d'ecoute — Protocole d'escalade</Text>}
      </View>
      {r === 'teleassistance' ? <TeleassistanceDashboard token={token} />
        : r === 'admin' ? <AdminIntervenants token={token} />
        : <BeneficiaryTeleconsult token={token} />}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
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
