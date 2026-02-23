import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';

function TypewriterText({ text, speed = 18, onDone }: { text: string; speed?: number; onDone?: () => void }) {
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

export default function ChatScreen() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingId, setTypingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingId]);

  const loadHistory = async () => {
    try { const h = await apiFetch('/api/chat/history', {}, token); setMessages(Array.isArray(h) ? h : []); }
    catch {} finally { setLoading(false); }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await apiFetch('/api/chat/message', { method: 'POST', body: JSON.stringify({ message: msg, session_id: `chat-${user?.id}` }) }, token);
      setMessages(prev => [...prev.filter(m => !m.id?.startsWith('temp-')), { id: 'u-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }, { id: res.id, role: 'assistant', content: res.content, created_at: res.created_at }]);
      setTypingId(res.id);
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Desole, une erreur est survenue.', created_at: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><Text style={{ color: '#FFF' }}>Chat</Text></View>;

  const hasMessages = messages.length > 0;
  const firstName = user?.name?.split(' ')[0] || 'Robert';
  const VIDEO_BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/6ru31eh9_background_chat_ia.mp4';

  return (
    <div data-testid="chat-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000' } as any}>
      {/* Video background */}
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.7 } as any} src={VIDEO_BG} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 100%)', zIndex: 1 } as any} />

      {/* Header - minimal */}
      {hasMessages && (
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Copilot IA</div>
          <div data-testid="clear-chat" onClick={async () => { await apiFetch('/api/chat/clear', { method: 'DELETE' }, token).catch(() => {}); setMessages([]); setTypingId(null); }} style={{ padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' } as any}>Effacer</div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', ...(hasMessages ? {} : { justifyContent: 'center' }) } as any}>

        {/* Empty state */}
        {!hasMessages && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 20px', gap: 20 } as any}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1.2, marginBottom: 6 }}>Bonjour {firstName},</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>Comment puis-je vous aider aujourd'hui ?</div>
            </div>
            {/* Suggestion bubble */}
            <div style={{ alignSelf: 'flex-end', maxWidth: '75%' } as any}>
              <div onClick={() => sendMessage("J'ai besoin de savoir quelle action mettre en place pour augmenter ma longevite des maintenant !")} style={{ padding: '14px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'background 0.2s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background='rgba(255,255,255,0.2)'}
                onMouseLeave={(e: any) => e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>J'ai besoin de savoir quelle action mettre en place pour augmenter ma longevite des maintenant !</div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 } as any}>
            {messages.map((msg, i) => (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, maxWidth: '88%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' } as any}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                    <i className="ri-sparkling-2-fill" style={{ fontSize: 12, color: '#FFF' }} />
                  </div>
                )}
                <div style={{
                  padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid rgba(255,255,255,${msg.role === 'user' ? '0.2' : '0.1'})`,
                } as any}>
                  <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } as any}>
                    {msg.role === 'assistant' && typingId === msg.id ? <TypewriterText text={msg.content} speed={15} onDone={() => setTypingId(null)} /> : msg.content}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' } as any}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' } as any}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-sparkling-2-fill" style={{ fontSize: 12, color: '#FFF' }} />
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
                  <div style={{ display: 'flex', gap: 5 } as any}>{[0, 1, 2].map(d => <div key={d} style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.4)', animation: `pulse 1.4s ease-in-out ${d * 0.2}s infinite` } as any} />)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef as any} />
          </div>
        )}
      </div>

      {/* Input bar - pill style at bottom */}
      <div style={{ padding: '12px 16px 28px', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 6px 6px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' } as any}>
          <input data-testid="chat-input" value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Commencez a saisir..."
            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
          <div data-testid="chat-send" onClick={() => sendMessage()} style={{
            width: 42, height: 42, borderRadius: '50%', cursor: input.trim() ? 'pointer' : 'default',
            background: input.trim() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid rgba(255,255,255,${input.trim() ? '0.3' : '0.1'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
          } as any}>
            <i className="ri-send-plane-fill" style={{ fontSize: 16, color: input.trim() ? '#FFF' : 'rgba(255,255,255,0.25)', transform: 'rotate(-45deg)' }} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }' }} />
    </div>
  );
}
