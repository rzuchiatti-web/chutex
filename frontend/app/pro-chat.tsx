import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const BG_IMAGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const accentColor = '#3B82F6';

export default function ProChatPage() {
  const { proId } = useLocalSearchParams<{ proId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [convo, setConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchConvo = useCallback(async () => {
    if (!token || !proId) return;
    try {
      const c = await apiFetch(`/api/pro/conversations/${proId}`, {}, token);
      setConvo(c);
      if (c?.id) {
        const msgs = await apiFetch(`/api/pro/messages/${c.id}`, {}, token);
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [token, proId]);

  useEffect(() => { fetchConvo(); }, [fetchConvo]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!convo?.id) return;
    const iv = setInterval(async () => {
      try {
        const msgs = await apiFetch(`/api/pro/messages/${convo.id}`, {}, token);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch {}
    }, 4000);
    return () => clearInterval(iv);
  }, [convo?.id, token]);

  const send = async () => {
    if (!newMsg.trim() || !convo?.id) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/api/pro/messages/${convo.id}`, { method: 'POST', body: JSON.stringify({ content: newMsg }) }, token);
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
      inputRef.current?.focus();
    } catch {}
    finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  const proName = convo?.professional_name || 'Professionnel';

  return (
    <div data-testid="pro-chat-page" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>

      {/* Header with red BG matching ProMessaging */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 } as any}>
        <img src={BG_IMAGE} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 16px 24px', display: 'flex', alignItems: 'center', gap: 12 } as any}>
          <div data-testid="back-btn" onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' } as any}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{proName.charAt(0)}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{proName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Votre professionnel de sante</div>
          </div>
        </div>
      </div>

      {/* Messages area - light background matching ProMessaging */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', background: '#F9FAFB', display: 'flex', flexDirection: 'column', marginTop: -12, borderRadius: '16px 16px 0 0', position: 'relative', zIndex: 10 } as any}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto 0', padding: '40px 20px' } as any}>
            <i className="ri-chat-smile-2-line" style={{ fontSize: 40, color: '#D1D5DB', display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>Commencez la conversation</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Envoyez un message a votre professionnel</div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 } as any}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? accentColor : '#FFF',
                color: isMe ? '#FFF' : '#111',
                boxShadow: isMe ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
              } as any}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.content}</div>
                <div style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.6)' : '#9CA3AF', marginTop: 4, textAlign: 'right' } as any}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <i className="ri-check-double-line" style={{ marginLeft: 4, fontSize: 10 }} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={msgEndRef} />
      </div>

      {/* Input bar - matching ProMessaging style */}
      <div style={{ padding: '12px 16px 100px', flexShrink: 0, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, alignItems: 'center', background: '#FFF' } as any}>
        <input ref={inputRef} data-testid="chat-msg-input" value={newMsg} onChange={(e: any) => setNewMsg(e.target.value)}
          onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Votre message..."
          style={{ flex: 1, padding: '13px 18px', borderRadius: 999, background: '#F3F4F6', border: '1.5px solid #E5E7EB', color: '#111', fontSize: 15, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' } as any} />
        <div data-testid="chat-send-btn" onClick={sending ? undefined : send}
          style={{ width: 46, height: 46, borderRadius: '50%', background: newMsg.trim() ? accentColor : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.5 : 1, transition: 'background 0.15s' } as any}>
          <i className="ri-send-plane-fill" style={{ fontSize: 18, color: newMsg.trim() ? '#FFF' : '#9CA3AF' }} />
        </div>
      </div>
    </div>
  );
}
