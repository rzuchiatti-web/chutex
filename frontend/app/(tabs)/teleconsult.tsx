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
        <div style={{ position: 'relative', padding: '20px 20px 16px', zIndex: 10, textAlign: 'center' } as any}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12 } as any}>
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

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

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

  const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/qgy38yhz_banner_mobile_intervention_care.jpg';
  const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_RED = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_HEADER = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/n96e8u48_Banner_Care.jpg';
  const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';

  const [slideActivated, setSlideActivated] = useState(false);
  const [careError, setCareError] = useState('');
  const [selectedIv, setSelectedIv] = useState<any>(null);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#9C27B0" /></View>;

  /* ─── INACTIF: écran plein avec fond violet + slide ─── */
  if (!user?.is_intervention_provider && Platform.OS === 'web') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 10 } as any}>
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setSelectedIv(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isDone ? 'Terminee' : 'En cours'}</span></div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{selectedIv.alert_message || 'Intervention'}</div>
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

        {/* POPUP FICHE INTERVENANT */}
        {showIntervenantPopup && selectedIv.assigned_name && (
          <div onClick={() => setShowIntervenantPopup(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 28, padding: 24, width: '100%', maxWidth: 380, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', overflowY: 'auto' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                  {isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}
                  <div onClick={() => setShowIntervenantPopup(false)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name}</div>{selectedIv.structure_name && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{selectedIv.structure_name}</div>}</div>
              </div>
              {[
                selectedIv.intervener_phone && { icon: 'ri-phone-line', label: 'Telephone', value: selectedIv.intervener_phone, phone: true },
                selectedIv.intervener_email && { icon: 'ri-mail-line', label: 'Email', value: selectedIv.intervener_email },
                selectedIv.structure_name && { icon: 'ri-building-line', label: 'Structure', value: selectedIv.structure_name },
                selectedIv.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${selectedIv.distance_km} km` },
                selectedIv.accepted_at && { icon: 'ri-time-line', label: 'Accepte a', value: new Date(selectedIv.accepted_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) },
                selectedIv.completed_at && { icon: 'ri-check-double-line', label: 'Termine a', value: new Date(selectedIv.completed_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) },
                { icon: 'ri-pulse-line', label: 'Statut', value: selectedIv.status === 'completed' ? 'Terminee' : selectedIv.status === 'in_progress' ? 'En cours' : selectedIv.status },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i}>
                  {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}
                  <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default', padding: '4px 0' } as any}>
                    <i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 1 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── ACTIF: page interventions avec header violet ─── */
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchIvs(); }} />}>
      {/* Header violet avec image, pilule, titre ET toggle */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 } as any}>
          <img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2 } as any}>
            <div onClick={() => setShowCareModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', cursor: 'pointer', marginBottom: 10 } as any}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {user.intervention_structure || user.structure_name || 'Structure'}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Intervention Care</div>
            {/* Toggle En cours / Cloturées - glass pill ON the violet header */}
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setIvTab('active')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'active' ? '#FFF' : 'transparent', color: ivTab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s', boxShadow: ivTab === 'active' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' } as any}>En cours</div>
              <div onClick={() => setIvTab('done')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'done' ? '#FFF' : 'transparent', color: ivTab === 'done' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s', boxShadow: ivTab === 'done' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' } as any}>Cloturees</div>
            </div>
          </div>
        </div>
      ) : (
        <View style={{ backgroundColor: '#2d1050', padding: 20, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowCareModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, marginBottom: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Actif - {user.intervention_structure || user.structure_name || 'Structure'}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 14 }}>Intervention Care</Text>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 4 }}>
            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, ivTab === 'active' && { backgroundColor: '#FFF' }]} onPress={() => setIvTab('active')}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: ivTab === 'active' ? '#111' : 'rgba(255,255,255,0.8)' }}>En cours</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, ivTab === 'done' && { backgroundColor: '#FFF' }]} onPress={() => setIvTab('done')}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: ivTab === 'done' ? '#111' : 'rgba(255,255,255,0.8)' }}>Cloturees</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* White rounded container for cards */}
      <View style={{ padding: 16, paddingTop: 12 }}>

      {/* Interventions List — INSIDE white container */}
      {user?.is_intervention_provider && (displayedIvs.length > 0 ? displayedIvs.map(iv => {
        const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
        const bgImg = isActive ? BG_VIOLET : BG_GREEN;
        return Platform.OS === 'web' ? (
          <div key={iv.id} data-testid={`iv-${iv.id}`} onClick={() => { setSelectedIv(iv); }}
            style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '18px 16px', marginBottom: 12, cursor: 'pointer', minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.25s ease, box-shadow 0.25s ease', boxShadow: '0 8px 24px rgba(0,0,0,.15)' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,.22)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.15)'; }}>
            <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.beneficiary_name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {iv.distance_km && (
                  <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 12, padding: '6px 12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.2)' } as any}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{iv.distance_km} Km</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{iv.alert_message || 'Intervention'}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)', backdropFilter: 'blur(6px)' } as any}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <TouchableOpacity key={iv.id} testID={`iv-${iv.id}`} onPress={() => setSelectedIv(iv)}>
            <View style={{ borderRadius: 20, overflow: 'hidden', padding: 18, marginBottom: 12, backgroundColor: isActive ? '#0a3a2a' : '#5a1020' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.beneficiary_name}</Text><Text style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text></View>
                {iv.distance_km && <View style={{ backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{iv.distance_km} Km</Text></View>}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{iv.alert_message || 'Intervention'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 }}>
                  <Icon name="heart-outline" size={16} color="#FFF" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Consulter</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }) : (
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 40, alignItems: 'center', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}) }}>
          <Icon name={ivTab === 'active' ? 'time-outline' : 'checkmark-circle-outline'} size={40} color="#CCC" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#6B7280', marginTop: 12 }}>{ivTab === 'active' ? 'Aucune intervention en cours' : 'Aucune intervention terminee'}</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>{ivTab === 'active' ? 'Vous serez notifie des que vous recevrez une mission d\'intervention' : 'Vos missions completees s\'afficheront ici avec le rapport'}</Text>
        </View>
      ))}

      </View>{/* End white container */}


      {/* Care Detail Modal — GLASS DARK */}
      <Modal visible={showCareModal} transparent animationType="fade" onRequestClose={() => setShowCareModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', ...(Platform.OS === 'web' ? { backgroundColor: 'rgba(0,0,0,0.5)' } : { backgroundColor: 'rgba(0,0,0,0.6)' }) } as any}>
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%',
            backgroundColor: '#111',
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)', borderTop: '1px solid rgba(255,255,255,0.1)' } : {}),
          } as any}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>Espace Intervenant Care</Text>
              <TouchableOpacity onPress={() => setShowCareModal(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="shield-checkmark" size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{user.intervention_structure || user.structure_name || 'Structure'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>ACTIF</Text>
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
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={icon as any} size={14} color="rgba(255,255,255,0.5)" />
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 80 }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', flex: 1 }}>{value}</Text>
                </View>
              ) : null)}
              <TouchableOpacity style={{
                marginTop: 24, borderRadius: 999, paddingVertical: 16, alignItems: 'center',
                backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
              } as any}
                onPress={() => confirmAction('Desactiver', 'Vous ne recevrez plus de missions. Confirmez ?', deactivateCare)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FCA5A5' }}>Desactiver mon espace intervenant</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  const [tab, setTab] = useState<'interventions' | 'intervenants'>('interventions');
  const [ivTab, setIvTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [search, setSearch] = useState('');

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

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#111827" /></View>;

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
  const pendingIvs = interventions.filter((iv: any) => iv.status === 'pending_acceptance');
  const activeIvs = interventions.filter((iv: any) => ['in_progress', 'en_route', 'dispatched'].includes(iv.status));
  const completedIvs = interventions.filter((iv: any) => iv.status === 'completed');
  const displayedIvs = ivTab === 'pending' ? pendingIvs : ivTab === 'active' ? activeIvs : completedIvs;
  const filteredIntervenants = search.trim()
    ? intervenants.filter((iv: any) => iv.name?.toLowerCase().includes(search.toLowerCase()))
    : intervenants;

  const stColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');
  const stLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);

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
    return <CompanyInterventionsTab token={token} />;
  }

  // Guardian + Beneficiary: full screen, no wrapper header
  if (r === 'guardian') {
    return <GuardianInterventions token={token} user={user} />;
  }
  if (r === 'beneficiary') {
    return <BeneficiaryTeleconsult token={token} />;
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
