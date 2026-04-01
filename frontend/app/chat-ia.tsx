import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import { useI18n } from '../src/context/I18nContext';
import NativePageView from '../src/components/NativePageView';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

function TypewriterText({ text, speed = 15, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed(''); idx.current = 0;
    const iv = setInterval(() => {
      if (idx.current < text.length) { setDisplayed(text.slice(0, idx.current + 1)); idx.current++; }
      else { clearInterval(iv); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, transition: 'opacity 0.3s' } as any}>|</span></>;
}

export default function ChatIAScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [typedGreeting, setTypedGreeting] = useState('');
  const [typedDesc, setTypedDesc] = useState('');
  const [greetingDone, setGreetingDone] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedBen, setSelectedBen] = useState<string>('');
  const [showBenPicker, setShowBenPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const role = user?.active_role || user?.role || 'beneficiary';
  const isGuardian = role === 'guardian' || role === 'professional';
  const firstName = user?.name?.split(' ')[0] || '';
  const hasMessages = messages.length > 0;
  const selectedBenName = beneficiaries.find(b => b.id === selectedBen)?.name?.split(' ')[0] || '';
  const descText = isGuardian
    ? `Selectionnez un beneficiaire et posez vos questions sur sa sante.`
    : 'Votre assistante sante personnelle. Comment puis-je vous aider aujourd\'hui ?';

  const presetQuestions = isGuardian
    ? [
        `Comment va ${selectedBenName || 'mon proche'} aujourd'hui ?`,
        `Y a-t-il eu des alertes pour ${selectedBenName || 'mon proche'} ?`,
        `Fais-moi un bilan sante de ${selectedBenName || 'mon proche'}`,
      ]
    : [
        'Comment ai-je dormi cette nuit ?',
        'Peux-tu me faire un bilan de sante ?',
        'Quels exercices me recommandes-tu ?',
        'Ajuste mes calories pour la journee',
      ];

  useEffect(() => { loadHistory(); setTimeout(() => setEntered(true), 100); setTimeout(() => setShowText(true), 1400); }, [role]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingId]);

  // Fetch beneficiaries for guardian role
  useEffect(() => {
    if (!isGuardian || !token) return;
    apiFetch('/api/guardian/beneficiaries', {}, token).then((bens: any) => {
      if (Array.isArray(bens) && bens.length > 0) {
        setBeneficiaries(bens);
        setSelectedBen(bens[0].id);
      }
    }).catch(() => {});
  }, [isGuardian, token]);

  // Typewriter for greeting (after video entrance)
  useEffect(() => {
    if (!showText || hasMessages) return;
    const greeting = `Bonjour ${firstName},`;
    let i = 0;
    setTypedGreeting('');
    const iv = setInterval(() => {
      if (i <= greeting.length) { setTypedGreeting(greeting.slice(0, i)); i++; }
      else { clearInterval(iv); setGreetingDone(true); }
    }, 40);
    return () => clearInterval(iv);
  }, [showText, hasMessages]);

  // Typewriter for description (after greeting done)
  useEffect(() => {
    if (!greetingDone || hasMessages) return;
    let i = 0;
    setTypedDesc('');
    const iv = setInterval(() => {
      if (i <= descText.length) { setTypedDesc(descText.slice(0, i)); i++; }
      else { clearInterval(iv); }
    }, 18);
    return () => clearInterval(iv);
  }, [greetingDone, hasMessages]);

  const chatSessionId = user?.id ? (isGuardian && selectedBen ? `chat-${user.id}-${role}-${selectedBen}` : `chat-${user.id}-${role}`) : '';

  const loadHistory = async () => {
    setLoading(true);
    try { const h = await apiFetch(`/api/chat/history?session_id=${chatSessionId}`, {}, token); setMessages(Array.isArray(h) ? h : []); }
    catch {} finally { setLoading(false); }
  };

  const clearChat = async () => {
    if (clearing) return; setClearing(true);
    try { await apiFetch(`/api/chat/clear?session_id=${chatSessionId}`, { method: 'DELETE' }, token); setMessages([]); }
    catch {} finally { setClearing(false); }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await apiFetch('/api/chat/message', { method: 'POST', body: JSON.stringify({ message: msg, session_id: chatSessionId, beneficiary_id: isGuardian ? selectedBen : undefined }) }, token);
      setMessages(prev => [...prev.filter(m => !m.id?.startsWith('temp-')), { id: 'u-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }, { id: res.id, role: 'assistant', content: res.content, created_at: res.created_at, actions: res.actions }]);
      setTypingId(res.id);
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Desole, une erreur est survenue.', created_at: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/chat-ia" />;

  return (
    <div data-testid="chat-ia-screen" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000', zIndex: 9999 } as any}>

      {/* Nora video — always visible, premium entrance + animates position */}
      <video autoPlay loop muted playsInline style={{
        position: 'absolute', left: '50%',
        top: hasMessages ? '70px' : '28%',
        transform: hasMessages ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -50%) scale(1)',
        width: hasMessages ? 90 : 200, height: hasMessages ? 90 : 200,
        objectFit: 'contain', borderRadius: hasMessages ? 45 : 100,
        opacity: entered ? (hasMessages ? 0.6 : 1) : 0,
        filter: entered ? 'none' : 'blur(20px)',
        zIndex: 1,
        transition: 'top 1s cubic-bezier(0.22,0.61,0.36,1), width 1s cubic-bezier(0.22,0.61,0.36,1), height 1s cubic-bezier(0.22,0.61,0.36,1), transform 1s cubic-bezier(0.22,0.61,0.36,1), border-radius 1s ease, opacity 1.2s ease 0.2s, filter 1.2s ease 0.2s',
      } as any} src={NORA_VIDEO} />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 10, padding: '16px 20px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
        <div onClick={() => router.back()} data-testid="chat-back" style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#FFF' }} />
        </div>
        {/* Guardian: centered beneficiary picker glass button */}
        {isGuardian && beneficiaries.length > 0 && (
          <div style={{ position: 'relative' } as any}>
            <div onClick={() => setShowBenPicker(!showBenPicker)} data-testid="ben-picker-btn" style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <div style={{ width: 22, height: 22, borderRadius: 99, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{(selectedBenName || '?')[0]}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{selectedBenName || 'Choisir'}</span>
              <i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
            </div>
            {showBenPicker && (
              <div onClick={(e: any) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8, minWidth: 220, borderRadius: 16, background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '6px', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' } as any}>
                {beneficiaries.map((ben: any) => (
                  <div key={ben.id} data-testid={`ben-pick-${ben.id}`} onClick={() => { setSelectedBen(ben.id); setShowBenPicker(false); setMessages([]); loadHistory(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', background: selectedBen === ben.id ? 'rgba(167,139,250,0.15)' : 'transparent', transition: 'background 0.15s' } as any}
                    onMouseEnter={(e: any) => { if (selectedBen !== ben.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e: any) => { if (selectedBen !== ben.id) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: 28, height: 28, borderRadius: 99, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#FFF' }}>{(ben.name || '?')[0]}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>{ben.name}</span>
                    {selectedBen === ben.id && <i className="ri-check-line" style={{ fontSize: 14, color: '#A78BFA' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          {hasMessages && (
            <div data-testid="chat-clear" onClick={clearChat} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: clearing ? 0.5 : 1 } as any}>
              <i className="ri-delete-bin-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          )}
        </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', ...(hasMessages ? {} : { justifyContent: 'center' }) } as any}>

        {/* Empty state — text below video */}
        {!hasMessages && !loading && (
          <div style={{ textAlign: 'center', padding: '0 32px', marginTop: 80 } as any}>
            {showText && <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>
              {typedGreeting}<span style={{ opacity: greetingDone ? 0 : 1, color: 'rgba(255,255,255,0.3)', transition: 'opacity 0.3s' } as any}>|</span>
            </div>}
            {greetingDone && <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
              {typedDesc}<span style={{ opacity: typedDesc.length < descText.length ? 1 : 0, color: 'rgba(255,255,255,0.2)', transition: 'opacity 0.3s' } as any}>|</span>
            </div>}
            {/* Preset questions */}
            {greetingDone && typedDesc.length >= descText.length && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, maxWidth: 300, margin: '20px auto 0' } as any}>
                {presetQuestions.map((q, i) => (
                  <div key={i} data-testid={`preset-q-${i}`} onClick={() => sendMessage(q)} style={{ padding: '11px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textAlign: 'left', transition: 'all 0.2s', opacity: 0, animation: `chatMsgIn 0.4s ease ${0.1 + i * 0.12}s forwards` } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                    <i className="ri-chat-3-line" style={{ fontSize: 12, marginRight: 8, color: 'rgba(255,255,255,0.25)' }} />{q}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div style={{ padding: '100px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 } as any}>
            {messages.map((msg, i) => (
              msg.role === 'user' ? (
                <div key={msg.id || i} style={{ display: 'flex', justifyContent: 'flex-end', animation: 'chatMsgIn 0.35s ease both', animationDelay: `${Math.min(i * 0.05, 0.3)}s` } as any}>
                  <div style={{ padding: '12px 16px', borderRadius: '18px 18px 4px 18px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', maxWidth: '80%' } as any}>
                    <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 5, textAlign: 'right' }}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </div>
                </div>
              ) : (
                <div key={msg.id || i} style={{ animation: 'chatMsgIn 0.35s ease both', animationDelay: `${Math.min(i * 0.05, 0.3)}s` } as any}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {typingId === msg.id ? <TypewriterText text={msg.content} speed={15} onDone={() => setTypingId(null)} /> : msg.content}
                  </div>
                  {/* Action confirmation cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 } as any}>
                      {msg.actions.filter((act: any) => ['UPDATE_CALORIES','ADJUST_MACROS','ADD_EXERCISE','CHECK_WEIGHT_GOAL','DELETE_EXERCISE','UPDATE_MEAL_PLAN'].includes(act.action)).map((act: any, ai: number) => {
                        const r = act.result || {};
                        const success = r.success !== false;
                        let icon = 'ri-checkbox-circle-line';
                        let label = '';
                        let detail = '';
                        if (act.action === 'UPDATE_CALORIES') {
                          icon = success ? 'ri-restaurant-line' : 'ri-error-warning-line';
                          label = success ? 'Calories mises a jour' : 'Modification refusee';
                          detail = success ? `${r.daily_calories} kcal/jour` : (r.message || '');
                        } else if (act.action === 'ADJUST_MACROS') {
                          icon = success ? 'ri-scales-3-line' : 'ri-error-warning-line';
                          label = success ? 'Macros ajustees' : 'Modification refusee';
                          detail = success && r.macros ? `P:${r.macros.proteines_g}g G:${r.macros.glucides_g}g L:${r.macros.lipides_g}g` : (r.message || '');
                        } else if (act.action === 'ADD_EXERCISE') {
                          icon = success ? 'ri-run-line' : 'ri-error-warning-line';
                          label = success ? 'Exercice ajoute' : 'Erreur';
                          detail = success ? `${r.title} (${r.sets}x${r.repetitions})` : (r.message || '');
                        } else if (act.action === 'DELETE_EXERCISE') {
                          icon = success ? 'ri-delete-bin-line' : 'ri-error-warning-line';
                          label = success ? 'Exercice supprime' : 'Suppression refusee';
                          detail = success ? r.title : (r.message || '');
                        } else if (act.action === 'UPDATE_MEAL_PLAN') {
                          icon = success ? 'ri-bowl-line' : 'ri-error-warning-line';
                          label = success ? 'Plan repas sauvegarde' : 'Erreur';
                          detail = success ? `${r.meal_count} repas · ${r.total_calories} kcal` : (r.message || '');
                        } else if (act.action === 'CHECK_WEIGHT_GOAL') {
                          icon = r.has_goal ? 'ri-scales-line' : 'ri-checkbox-circle-line';
                          label = r.has_goal ? 'Objectif de poids actif' : 'Pas d\'objectif de poids';
                          detail = r.has_goal ? `Cible: ${r.target_kg}kg` : '';
                        }
                        return (
                          <div key={ai} data-testid={`action-card-${act.action}`} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            borderRadius: 12, border: `1px solid ${success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            background: success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          } as any}>
                            <i className={icon} style={{ fontSize: 18, color: success ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                            <div style={{ flex: 1 } as any}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: success ? '#10B981' : '#EF4444' }}>{label}</div>
                              {detail && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{detail}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', marginTop: 4 }}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
              )
            ))}
            {sending && (
              <div style={{ animation: 'chatMsgIn 0.3s ease both' } as any}>
                <div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.3)', animation: `chatpulse 1.4s ease-in-out ${d * 0.2}s infinite` } as any} />)}</div>
              </div>
            )}
            <div ref={bottomRef as any} />
          </div>
        )}
      </div>

      {/* Input bar — glass white blur */}
      <div style={{ padding: '12px 16px 28px', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 6px 6px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.15)' } as any}>
          <input data-testid="chat-input" value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Posez votre question a Nora..."
            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
          <div data-testid="chat-send" onClick={() => sendMessage()} style={{ width: 42, height: 42, borderRadius: '50%', cursor: input.trim() ? 'pointer' : 'default', background: input.trim() ? '#FFF' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', flexShrink: 0 } as any}>
            <i className="ri-send-plane-fill" style={{ fontSize: 16, color: input.trim() ? '#000' : 'rgba(255,255,255,0.2)', transform: 'rotate(-45deg)' }} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes chatpulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}} @keyframes chatMsgIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}' }} />
    </div>
  );
}
