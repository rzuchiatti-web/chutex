import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const GL: any = { borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' };
const C = { bg: '#0A0A12', text: '#FFF', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.25)', faint: 'rgba(255,255,255,0.06)', accent: '#3B82F6', green: '#10B981' };

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

  const fetchConvo = useCallback(async () => {
    if (!token || !proId) return;
    try {
      const c = await apiFetch(`/api/pro/conversations/${proId}`, {}, token);
      setConvo(c);
      if (c?.id) {
        const msgs = await apiFetch(`/api/pro/messages/${c.id}`, {}, token);
        setMessages(msgs);
      }
    } catch {}
    finally { setLoading(false); }
  }, [token, proId]);

  useEffect(() => { fetchConvo(); }, [fetchConvo]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Poll
  useEffect(() => {
    if (!convo?.id) return;
    const iv = setInterval(async () => {
      try {
        const msgs = await apiFetch(`/api/pro/messages/${convo.id}`, {}, token);
        setMessages(msgs);
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
    } catch {}
    finally { setSending(false); }
  };

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  return (
    <div data-testid="pro-chat-page" style={{ position: 'absolute', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' } as any}>
      {/* Header */}
      <div style={{ padding: '16px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
        <div onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: C.faint, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: C.sub }} />
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <i className="ri-stethoscope-line" style={{ fontSize: 20, color: C.accent }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{convo?.professional_name || 'Professionnel'}</div>
          <div style={{ fontSize: 11, color: C.sub }}>Votre professionnel de sante</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' } as any}>
        {messages.length === 0 && (
          <div style={{ ...GL, padding: '40px 20px', textAlign: 'center', margin: 'auto 0' } as any}>
            <i className="ri-chat-3-line" style={{ fontSize: 32, color: C.muted, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>Commencez la conversation</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Envoyez un message a votre professionnel</div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 } as any}>
              <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isMe ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}` } as any}>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{msg.content}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 4, textAlign: 'right' } as any}>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
        <div ref={msgEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 20px 24px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center' } as any}>
        <input data-testid="chat-msg-input" value={newMsg} onChange={(e: any) => setNewMsg(e.target.value)}
          onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Votre message..."
          style={{ flex: 1, padding: '14px 18px', borderRadius: 999, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 15, outline: 'none' } as any} />
        <div data-testid="chat-send-btn" onClick={sending ? undefined : send}
          style={{ width: 48, height: 48, borderRadius: 999, background: newMsg.trim() ? C.accent : C.faint, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.5 : 1 } as any}>
          <i className="ri-send-plane-fill" style={{ fontSize: 20, color: newMsg.trim() ? '#FFF' : C.muted }} />
        </div>
      </div>
    </div>
  );
}
