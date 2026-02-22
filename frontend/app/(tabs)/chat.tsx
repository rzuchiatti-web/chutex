import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';

/* ─── Typewriter component ─── */
function TypewriterText({ text, speed = 18, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  useEffect(() => {
    setDisplayed(''); idx.current = 0;
    const iv = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else { clearInterval(iv); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, transition: 'opacity 0.3s' } as any}>|</span></>;
}

export default function ChatScreen() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingId, setTypingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingId]);

  const loadHistory = async () => {
    try {
      const hist = await apiFetch('/api/chat/history', {}, token);
      setMessages(Array.isArray(hist) ? hist : []);
    } catch {} finally { setLoading(false); }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await apiFetch('/api/chat/message', {
        method: 'POST', body: JSON.stringify({ message: msg, session_id: `chat-${user?.id}` })
      }, token);
      const newMsg = { id: res.id, role: 'assistant', content: res.content, created_at: res.created_at };
      setMessages(prev => [...prev.filter(m => !m.id?.startsWith('temp-')), { id: 'u-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }, newMsg]);
      setTypingId(res.id);
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Desole, une erreur est survenue. Reessaie.', created_at: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' }}><Text style={{ color: '#FFF' }}>Chat</Text></View>;

  const hasMessages = messages.length > 0;
  const quickActions = [
    { icon: 'ri-heart-pulse-line', label: 'Mon bilan sante', msg: 'Fais-moi un bilan complet de ma sante aujourd\'hui' },
    { icon: 'ri-moon-line', label: 'Ameliorer mon sommeil', msg: 'Donne-moi des conseils personnalises pour mieux dormir' },
    { icon: 'ri-run-line', label: 'Objectif du jour', msg: 'Quel est mon objectif d\'activite pour aujourd\'hui ?' },
    { icon: 'ri-stethoscope-line', label: 'Comprendre mes donnees', msg: 'Explique-moi mes derniers resultats de sante en termes simples' },
  ];

  return (
    <div data-testid="chat-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" } as any}>
      {/* Violet/pastel background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(140% 140% at 10% 10%, #ffb187 0%, #f39c70 20%, #cc9fbe 50%, #a9b8ea 80%, #8b9fd4 100%)', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)', zIndex: 1 } as any} />

      {/* Header - glass */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 } as any}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <i className="ri-sparkling-2-fill" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', textShadow: '0 1px 8px rgba(0,0,0,0.15)' }}>Coach Sante IA</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Personnalise selon tes donnees</div>
        </div>
        {hasMessages && (
          <div data-testid="clear-chat" onClick={async () => { await apiFetch('/api/chat/clear', { method: 'DELETE' }, token).catch(() => {}); setMessages([]); setTypingId(null); }} style={{ padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' } as any}>Effacer</div>
        )}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', ...(hasMessages ? {} : { justifyContent: 'center' }) } as any}>

        {/* Empty state: centered title + quick actions */}
        {!hasMessages && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 20px', gap: 24 } as any}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-sparkling-2-fill" style={{ fontSize: 36, color: '#FFF' }} />
            </div>
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8, textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>Ton coach sante personnel</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>Pose-moi n'importe quelle question sur ta sante.<br/>Je connais tes donnees et je m'adapte a toi.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 } as any}>
              {quickActions.map((qa, i) => (
                <div key={i} data-testid={`quick-action-${i}`} onClick={() => sendMessage(qa.msg)} style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = ''; }}>
                  <i className={qa.icon} style={{ fontSize: 18, color: '#FFF', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{qa.label}</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 } as any}>
            {messages.map((msg, i) => (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, maxWidth: '88%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' } as any}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                    <i className="ri-sparkling-2-fill" style={{ fontSize: 13, color: '#FFF' }} />
                  </div>
                )}
                <div style={{
                  padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid rgba(255,255,255,${msg.role === 'user' ? '0.3' : '0.15'})`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                } as any}>
                  <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', textShadow: '0 1px 3px rgba(0,0,0,0.08)' } as any}>
                    {msg.role === 'assistant' && typingId === msg.id
                      ? <TypewriterText text={msg.content} speed={15} onDone={() => setTypingId(null)} />
                      : msg.content}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' } as any}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {sending && (
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' } as any}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-sparkling-2-fill" style={{ fontSize: 13, color: '#FFF' }} />
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)' } as any}>
                  <div style={{ display: 'flex', gap: 5 } as any}>
                    {[0, 1, 2].map(d => <div key={d} style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.5)', animation: `pulse 1.4s ease-in-out ${d * 0.2}s infinite` } as any} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef as any} />
          </div>
        )}
      </div>

      {/* Input - glass, centered when no messages */}
      <div style={{ padding: hasMessages ? '12px 16px 24px' : '0 24px 32px', position: 'relative', zIndex: 10, ...(hasMessages ? { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)' } : {}), flexShrink: 0, maxWidth: hasMessages ? undefined : 400, width: '100%', alignSelf: 'center' } as any}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' } as any}>
          <input ref={inputRef as any} data-testid="chat-input" value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Pose ta question..."
            style={{ flex: 1, padding: '14px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
          <div data-testid="chat-send" onClick={() => sendMessage()} style={{
            width: 48, height: 48, borderRadius: 16, cursor: input.trim() ? 'pointer' : 'default',
            background: input.trim() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
            border: `1px solid rgba(255,255,255,${input.trim() ? '0.35' : '0.1'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
          } as any}>
            <i className="ri-send-plane-fill" style={{ fontSize: 18, color: input.trim() ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
