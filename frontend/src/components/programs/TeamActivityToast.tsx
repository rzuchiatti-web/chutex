import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { apiFetch } from '../../services/api';

interface Activity {
  id: string;
  user_name: string;
  action_type: string;
  detail: string;
  icon: string;
  color: string;
  created_at: string;
}

interface Props { token: string | null; }

export default function TeamActivityToast({ token }: Props) {
  const [queue, setQueue] = useState<Activity[]>([]);
  const [current, setCurrent] = useState<Activity | null>(null);
  const [visible, setVisible] = useState(false);
  const seenRef = useRef(new Set<string>());
  const intervalRef = useRef<any>(null);

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/programs/team/feed', {}, token);
      const feed: Activity[] = res?.feed || [];
      const newOnes = feed.filter(a => !seenRef.current.has(a.id));
      if (newOnes.length > 0) {
        newOnes.forEach(a => seenRef.current.add(a.id));
        setQueue(prev => [...prev, ...newOnes.slice(0, 3)]);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchFeed();
    intervalRef.current = setInterval(fetchFeed, 30000);
    return () => clearInterval(intervalRef.current);
  }, [token, fetchFeed]);

  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrent(next);
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setVisible(true), 50);
    });
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setCurrent(null), 500);
    }, 5500);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [queue, current]);

  if (!current) return null;

  const initials = current.user_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const timeAgo = (() => {
    const diff = (Date.now() - new Date(current.created_at).getTime()) / 1000;
    if (diff < 60) return "a l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    return `il y a ${Math.floor(diff / 3600)}h`;
  })();

  const toastContent = (
    <div data-testid="team-activity-toast" style={{
      position: 'fixed', top: 16, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : -80}px)`,
      zIndex: 99998, opacity: visible ? 1 : 0,
      transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease',
      pointerEvents: visible ? 'auto' : 'none',
      maxWidth: 'calc(100vw - 32px)', width: 380,
    } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes toast-ring { 0%,100% { box-shadow: 0 0 0 0 ${current.color}30; } 50% { box-shadow: 0 0 0 6px ${current.color}00; } }
      `}} />
      <div onClick={() => { setVisible(false); setTimeout(() => setCurrent(null), 400); }}
        style={{
          padding: '14px 16px', borderRadius: 18,
          background: 'rgba(20,22,26,0.92)',
          border: `1px solid ${current.color}25`,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)`,
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        } as any}>
        <div style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
          background: `${current.color}12`, border: `1.5px solid ${current.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'toast-ring 2s ease-in-out infinite',
        } as any}>
          <span style={{ fontSize: 14, fontWeight: 900, color: current.color }}>{initials}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 } as any}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{current.user_name}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>{timeAgo}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>
            {current.detail}
          </div>
        </div>

        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: `${current.color}10`, border: `1px solid ${current.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        } as any}>
          <i className={current.icon} style={{ fontSize: 16, color: current.color }} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 20, right: 20, height: 2, borderRadius: 1, overflow: 'hidden' } as any}>
        <div style={{
          height: '100%', borderRadius: 1,
          background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
          backgroundSize: '200% 100%',
          animation: 'toast-shimmer 2s linear infinite',
          width: visible ? '0%' : '100%',
          transition: 'width 4.5s linear',
        } as any} />
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(toastContent, document.body);
  }
  return toastContent;
}
