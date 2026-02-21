import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    const tempMsg = { id: 'temp', role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setSending(true);
    try {
      const res = await apiFetch('/api/chat/message', {
        method: 'POST', body: JSON.stringify({ message: text, session_id: `chat-${user?.id}` })
      }, token);
      setMessages(prev => [...prev.filter(m => m.id !== 'temp'), { id: 'temp-user', role: 'user', content: text, created_at: new Date().toISOString() }, { id: res.id, role: 'assistant', content: res.content, created_at: res.created_at }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Desole, une erreur est survenue. Reessaie.', created_at: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' }}><Text style={{ color: '#FFF' }}>Chat disponible sur web</Text></View>;

  const quickActions = [
    { label: 'Mon bilan du jour', msg: 'Fais-moi un bilan de ma sante aujourd\'hui' },
    { label: 'Conseils sommeil', msg: 'Donne-moi des conseils pour mieux dormir ce soir' },
    { label: 'Mon programme', msg: 'Ou en suis-je dans mon programme ?' },
    { label: 'Comprendre mes donnees', msg: 'Explique-moi mes derniers resultats de sante' },
  ];

  return (
    <div data-testid="chat-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0f1a' } as any}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 } as any}>
        <div onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #0E7490, #22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <i className="ri-sparkling-2-fill" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Coach Sante IA</div>
          <div style={{ fontSize: 10, color: 'rgba(34,211,238,0.6)', fontWeight: 600 }}>Repond selon tes donnees de sante</div>
        </div>
        <div data-testid="clear-chat" onClick={async () => { await apiFetch('/api/chat/clear', { method: 'DELETE' }, token).catch(() => {}); setMessages([]); }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)' } as any}>Effacer</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 } as any}>
        {messages.length === 0 && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 20px' } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, rgba(14,116,144,0.2), rgba(34,211,238,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34,211,238,0.15)' } as any}>
              <i className="ri-sparkling-2-fill" style={{ fontSize: 28, color: '#22D3EE' }} />
            </div>
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Bonjour {user?.name?.split(' ')[0]} !</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Je suis ton coach sante personnel.<br/>Pose-moi n'importe quelle question.</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 340 } as any}>
              {quickActions.map((qa, i) => (
                <div key={i} data-testid={`quick-action-${i}`} onClick={() => { setInput(qa.msg); }} style={{ padding: '8px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', transition: 'background 0.2s' } as any}
                  onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                  {qa.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' } as any}>
            {msg.role === 'assistant' && (
              <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #0E7490, #22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                <i className="ri-sparkling-2-fill" style={{ fontSize: 14, color: '#FFF' }} />
              </div>
            )}
            <div style={{
              padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #0E7490, #0891B2)' : 'rgba(255,255,255,0.06)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
              maxWidth: '100%',
            } as any}>
              <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } as any}>{msg.content}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' } as any}>
                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', maxWidth: '85%' } as any}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #0E7490, #22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-sparkling-2-fill" style={{ fontSize: 14, color: '#FFF' }} />
            </div>
            <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ display: 'flex', gap: 4 } as any}>
                {[0, 1, 2].map(d => <div key={d} style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(34,211,238,0.4)', animation: `pulse 1.4s ease-in-out ${d * 0.2}s infinite` } as any} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef as any} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 } as any}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' } as any}>
          <input data-testid="chat-input" value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Pose ta question..."
            style={{ flex: 1, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none' } as any} />
          <div data-testid="chat-send" onClick={sendMessage} style={{
            width: 46, height: 46, borderRadius: 14, cursor: input.trim() ? 'pointer' : 'default',
            background: input.trim() ? 'linear-gradient(135deg, #0E7490, #22D3EE)' : 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
          } as any}>
            <i className="ri-send-plane-fill" style={{ fontSize: 18, color: input.trim() ? '#FFF' : 'rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
