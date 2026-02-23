import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';

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

import { useI18n } from '../src/context/I18nContext';

export default function ChatIAScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
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

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF' }}>Chat</Text></View>;

  const hasMessages = messages.length > 0;
  const { t } = useI18n();
  const firstName = user?.name?.split(' ')[0] || '';
  const VIDEO_BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/ufilgqml_banner_mobile_chat_ia_bakcground.mp4';

  return (
    <div data-testid="chat-ia-screen" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000', zIndex: 9999 } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src={VIDEO_BG} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)', zIndex: 1 } as any} />

      {/* Back button */}
      <div style={{ position: 'relative', zIndex: 10, padding: '16px 20px', flexShrink: 0 } as any}>
        <div onClick={() => router.back()} data-testid="chat-back" style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#FFF' }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', ...(hasMessages ? {} : { justifyContent: 'flex-end' }) } as any}>
        {!hasMessages && !loading && (
          <div style={{ padding: '0 24px 24px' } as any}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1.2, marginBottom: 6 }}>Bonjour {firstName},</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Je suis Nora, votre assistante medicale. Je connais votre dossier de sante et vos donnees en temps reel. Posez-moi vos questions.</div>
            </div>
          </div>
        )}

        {hasMessages && (
          <div style={{ padding: '8px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 } as any}>
            {messages.map((msg, i) => (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' } as any}>
                {msg.role === 'assistant' && <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}><i className="ri-sparkling-2-fill" style={{ fontSize: 11, color: '#FFF' }} /></div>}
                <div style={{ padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: `rgba(255,255,255,${msg.role === 'user' ? '0.15' : '0.08'})`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid rgba(255,255,255,${msg.role === 'user' ? '0.2' : '0.1'})` } as any}>
                  <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } as any}>
                    {msg.role === 'assistant' && typingId === msg.id ? <TypewriterText text={msg.content} speed={15} onDone={() => setTypingId(null)} /> : msg.content}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5, textAlign: msg.role === 'user' ? 'right' : 'left' } as any}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' } as any}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-sparkling-2-fill" style={{ fontSize: 11, color: '#FFF' }} /></div>
                <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
                  <div style={{ display: 'flex', gap: 5 } as any}>{[0, 1, 2].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.4)', animation: `chatpulse 1.4s ease-in-out ${d * 0.2}s infinite` } as any} />)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef as any} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 16px 24px', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 6px 6px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' } as any}>
          <input data-testid="chat-input" value={input} onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Commencez a saisir..."
            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
          <div data-testid="chat-send" onClick={() => sendMessage()} style={{ width: 42, height: 42, borderRadius: '50%', cursor: input.trim() ? 'pointer' : 'default', background: input.trim() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,${input.trim() ? '0.3' : '0.1'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 } as any}>
            <i className="ri-send-plane-fill" style={{ fontSize: 16, color: input.trim() ? '#FFF' : 'rgba(255,255,255,0.25)', transform: 'rotate(-45deg)' }} />
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes chatpulse { 0%,80%,100% { opacity:.3; transform:scale(.8) } 40% { opacity:1; transform:scale(1) } }' }} />
    </div>
  );
}
