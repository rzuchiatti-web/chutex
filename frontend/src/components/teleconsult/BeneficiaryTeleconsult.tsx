import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../services/api';
import { s, BG_BLUE } from './teleconsultStyles';

export function BeneficiaryTeleconsult({ token }: { token: string }) {
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

  if (loading) return <FullScreenLoader />;

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
          <div style={{ width: '100%', maxWidth: 340, height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 20, touchAction: 'none', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}
            onMouseDown={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); window.location.href = `tel:${callInfo.call_number}`; } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
            onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); window.location.href = `tel:${callInfo.call_number}`; } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
            <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour appeler</div>
          </div>

          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{callInfo.call_number}</div>

          <div onClick={() => { setSubmitted(false); setStep(0); setAnswers({}); }} style={{ padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>Nouvelle consultation</div>
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

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {/* Header title + pill */}
          <div style={{ textAlign: 'center', marginBottom: 22 } as any}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 10 }}>Teleconsultation</div>
            <div data-testid="doctor-available-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Medecin disponible 24/7</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 18 } as any}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 6 } as any}>
              {questions.map((_, i) => <div key={i} style={{ width: i <= step ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i <= step ? '#FFF' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Etape {step + 1} / {questions.length}</div>
          </div>
          {q && (
            <>
              <div style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#FFF', lineHeight: 1.4 }}>{q.question}</div>
              </div>

              {q.type === 'choice' && q.options?.map((o: string, i: number) => (
                <div key={i} onClick={() => setAnswers({ ...answers, [q.id]: o })} style={{
                  padding: '14px 18px', borderRadius: 16, marginBottom: 8, cursor: 'pointer',
                  background: answers[q.id] === o ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${answers[q.id] === o ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
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
                  style={{ width: '100%', minHeight: 120, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any} />
              )}
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 10 } as any}>
            {step > 0 ? (
              <div onClick={() => setStep(step - 1)} style={{ padding: '14px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
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
