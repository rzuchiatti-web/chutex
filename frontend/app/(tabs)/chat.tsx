import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';

export default function ChatScreen() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadHistory = async () => {
    try {
      const hist = await apiFetch('/api/chat/history', {}, token);
      setMessages(Array.isArray(hist) ? hist : []);
    } catch {} finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: 'temp', role: 'user', content: text, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await apiFetch('/api/chat/message', {
        method: 'POST', body: JSON.stringify({ message: text, session_id: `chat-${user?.id}` })
      }, token);
      setMessages(prev => [...prev.filter(m => m.id !== 'temp'), { id: 'u-' + Date.now(), role: 'user', content: text, created_at: new Date().toISOString() }, { id: res.id, role: 'assistant', content: res.content, created_at: res.created_at }]);
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Desole, une erreur est survenue. Reessaie.', created_at: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' }}><Text style={{ color: '#FFF' }}>Chat</Text></View>;

  const quickActions = [
    { label: 'Mon bilan du jour', msg: 'Fais-moi un bilan de ma sante aujourd\'hui' },
    { label: 'Conseils sommeil', msg: 'Donne-moi des conseils pour mieux dormir ce soir' },
    { label: 'Mon programme', msg: 'Ou en suis-je dans mon programme ?' },
    { label: 'Mes donnees', msg: 'Explique-moi mes derniers resultats de sante' },
  ];

  return (
    <div data-testid="chat-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" } as any}>
      {/* Violet/pastel background - same as guardian page */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(140% 140% at 10% 10%, #ffb187 0%, #f39c70 20%, #cc9fbe 50%, #a9b8ea 80%, #8b9fd4 100%)', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />

      {/* Header - glass effect */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.12)' } as any}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <i className="ri-sparkling-2-fill" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', textShadow: '0 1px 8px rgba(0,0,0,0.15)' }}>Coach Sante IA</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Repond selon tes donnees de sante</div>
        </div>
        <div data-testid="clear-chat" onClick={async () => { await apiFetch('/api/chat/clear', { method: 'DELETE' }, token).catch(() => {}); setMessages([]); }} style={{ padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' } as any}>Effacer</div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 10 } as any}>
        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '30px 20px' } as any}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-sparkling-2-fill" style={{ fontSize: 32, color: '#FFF' }} />
            </div>
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>Bonjour {user?.name?.split(' ')[0]} !</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Je suis ton coach sante personnel.<br/>Pose-moi n'importe quelle question.</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 340 } as any}>
              {quickActions.map((qa, i) => (
                <div key={i} data-testid={`quick-action-${i}`} onClick={() => { setInput(qa.msg); }} style={{ padding: '10px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#FFF', transition: 'all 0.2s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = ''; }}>
                  {qa.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, maxWidth: '88%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' } as any}>
            {msg.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                <i className="ri-sparkling-2-fill" style={{ fontSize: 14, color: '#FFF' }} />
              </div>
            )}
            <div style={{
              padding: '14px 18px',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.role === 'user'
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid rgba(255,255,255,${msg.role === 'user' ? '0.3' : '0.15'})`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            } as any}>
              <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', textShadow: '0 1px 4px rgba(0,0,0,0.1)' } as any}>{msg.content}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' } as any}>
                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', maxWidth: '85%' } as any}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-sparkling-2-fill" style={{ fontSize: 14, color: '#FFF' }} />
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

      {/* Input area - glass effect */}
      <div style={{ padding: '12px 16px 24px', position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)' } as any}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' } as any}>
          <input data-testid="chat-input" value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Pose ta question..."
            style={{ flex: 1, padding: '14px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
          <div data-testid="chat-send" onClick={sendMessage} style={{
            width: 48, height: 48, borderRadius: 16, cursor: input.trim() ? 'pointer' : 'default',
            background: input.trim() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid rgba(255,255,255,${input.trim() ? '0.35' : '0.1'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
            boxShadow: input.trim() ? '0 4px 16px rgba(0,0,0,0.1)' : 'none',
          } as any}>
            <i className="ri-send-plane-fill" style={{ fontSize: 18, color: input.trim() ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
