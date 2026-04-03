import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../services/api';
import { sendLocalNotification, requestNotificationPermission } from '../../services/notifications';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string;
  color: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveBanner, setLiveBanner] = useState<Notification | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bannerTimer = useRef<any>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const [notifs, countData] = await Promise.all([
        apiFetch('/api/notifications', {}, token),
        apiFetch('/api/notifications/unread-count', {}, token),
      ]);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setUnreadCount(countData?.count || 0);
    } catch {}
  }, [token]);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;
    const wsBase = API.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocol = API.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${wsBase}/api/ws/beneficiary?token=${token}`;

    let ws: WebSocket | null = null;
    let retryTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification' && data.notification) {
              const notif = data.notification as Notification;
              setNotifications(prev => [notif, ...prev].slice(0, 50));
              setUnreadCount(prev => prev + 1);
              // Show live banner
              setLiveBanner(notif);
              if (bannerTimer.current) clearTimeout(bannerTimer.current);
              bannerTimer.current = setTimeout(() => setLiveBanner(null), 6000);
              // Browser notification
              sendLocalNotification(notif.title, notif.body);
            }
          } catch {}
        };
        ws.onclose = () => {
          retryTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => { ws?.close(); };
      } catch {}
    };

    connect();
    fetchNotifications();

    // Request browser notification permission
    requestNotificationPermission();

    return () => {
      ws?.close();
      wsRef.current = null;
      clearTimeout(retryTimeout);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [token, fetchNotifications]);

  const markRead = async (notifId: string) => {
    if (!token) return;
    try {
      await apiFetch(`/api/notifications/${notifId}/read`, { method: 'PUT' }, token);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PUT' }, token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const dismissBanner = () => setLiveBanner(null);

  return { notifications, unreadCount, liveBanner, markRead, markAllRead, dismissBanner, fetchNotifications };
}

/* ── Live Banner (slide from top) ── */
export function NotificationBanner({ notification, onDismiss }: { notification: Notification | null; onDismiss: () => void }) {
  if (!notification) return null;

  return (
    <div data-testid="notification-banner" style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 99999,
      width: '90%', maxWidth: 380,
      animation: 'notif-slide-in 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes notif-slide-in { from { opacity: 0; transform: translateX(-50%) translateY(-60px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes notif-shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-3px)} 30%{transform:translateX(3px)} 45%{transform:translateX(-2px)} 60%{transform:translateX(0)} }
      ` }} />
      <div onClick={onDismiss} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '70px 16px 14px',
        borderRadius: 18, background: 'rgba(10,10,20,0.88)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${notification.color}30`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)`,
        cursor: 'pointer', animation: 'notif-shake 0.5s ease 0.4s',
      } as any}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${notification.color}15`, border: `1px solid ${notification.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        } as any}>
          <i className={notification.icon} style={{ fontSize: 18, color: notification.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 } as any}>
          <div style={{ fontSize: 12, fontWeight: 800, color: notification.color, marginBottom: 2 }}>{notification.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{notification.body}</div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <i className="ri-close-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Notification Bell + Dropdown ── */
export function NotificationCenter({
  notifications, unreadCount, onMarkRead, onMarkAllRead, onClose, isOpen, onToggle,
}: {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'A l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  };

  return (
    <div style={{ position: 'relative' } as any}>
      {/* Bell button */}
      <div data-testid="notification-bell" onClick={onToggle} style={{
        width: 36, height: 36, borderRadius: 18,
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      } as any}>
        <i className="ri-notification-4-line" style={{ fontSize: 18, color: '#FFF' }} />
        {unreadCount > 0 && (
          <div data-testid="notification-badge" style={{
            position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
            borderRadius: 999, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#FFF', padding: '0 4px',
            boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
          } as any}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998 } as any} />
          <div data-testid="notification-dropdown" style={{
            position: 'absolute', top: 48, right: 0, zIndex: 9999,
            width: 340, maxHeight: 420,
            borderRadius: 20, overflow: 'hidden',
            background: 'rgba(10,10,20,0.92)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          } as any}>
            {/* Header */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Notifications</div>
              {unreadCount > 0 && (
                <div data-testid="mark-all-read-btn" onClick={onMarkAllRead} style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', cursor: 'pointer' }}>
                  Tout marquer lu
                </div>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 360, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
              {notifications.length === 0 && (
                <div style={{ padding: '40px 16px', textAlign: 'center' } as any}>
                  <i className="ri-notification-off-line" style={{ fontSize: 28, color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Aucune notification</div>
                </div>
              )}
              {notifications.map(n => (
                <div key={n.id} data-testid={`notif-item-${n.id}`}
                  onClick={() => { if (!n.read) onMarkRead(n.id); }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  } as any}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: `${n.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  } as any}>
                    <i className={n.icon} style={{ fontSize: 14, color: n.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: n.read ? 'rgba(255,255,255,0.5)' : '#FFF' }}>{n.title}</span>
                      {!n.read && <div style={{ width: 6, height: 6, borderRadius: 3, background: n.color, flexShrink: 0 } as any} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{n.body}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
