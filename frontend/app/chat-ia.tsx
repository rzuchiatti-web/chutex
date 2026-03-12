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
  const bottomRef = useRef<HTMLDivElement>(null);
  const role = user?.active_role || user?.role || 'beneficiary';
  const firstName = user?.name?.split(' ')[0] || '';
  const descText = role === 'guardian'
    ? 'Je suis Nora, votre assistante medicale. Posez-moi vos questions sur vos beneficiaires.'
    : 'Je suis Nora, votre assistante medicale. Je connais votre dossier de sante. Posez-moi vos questions.';

  useEffect(() => { loadHistory(); setTimeout(() => setEntered(true), 100); setTimeout(() => setShowText(true), 1400); }, [role]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingId]);

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

  const loadHistory = async () => {
    setLoading(true);
    try { const h = await apiFetch('/api/chat/history', {}, token); setMessages(Array.isArray(h) ? h : []); }
    catch {} finally { setLoading(false); }
  };

  const clearChat = async () => {
    if (clearing) return; setClearing(true);
    try { await apiFetch('/api/chat/clear', { method: 'DELETE' }, token); setMessages([]); }
    catch {} finally { setClearing(false); }
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await apiFetch('/api/chat/message', { method: 'POST', body: JSON.stringify({ message: msg, session_id: `chat-${user?.id}-${role}` }) }, token);
      setMessages(prev => [...prev.filter(m => !m.id?.startsWith('temp-')), { id: 'u-' + Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }, { id: res.id, role: 'assistant', content: res.content, created_at: res.created_at }]);
      setTypingId(res.id);
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Desole, une erreur est survenue.', created_at: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/chat-ia" />;

  const hasMessages = messages.length > 0;

  return (
    <div data-testid="chat-ia-screen" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000', zIndex: 9999 } as any}>

      {/* Nora video — always visible, premium entrance + animates position */}
      <video autoPlay loop muted playsInline style={{
        position: 'absolute', left: '50%',
        top: hasMessages ? '12px' : '28%',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
          {role === 'guardian' && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 0.5 }}>Espace Gardien</span></div>}
          {hasMessages && (
            <div data-testid="chat-clear" onClick={clearChat} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: clearing ? 0.5 : 1 } as any}>
              <i className="ri-delete-bin-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          )}
        </div>
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
