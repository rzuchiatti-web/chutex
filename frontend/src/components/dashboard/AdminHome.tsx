import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import AdminDashboard from '../admin/AdminDashboard';
import AdminUsers from '../admin/AdminUsers';
import AdminAlerts from '../admin/AdminAlerts';
import AdminSubscriptions from '../admin/AdminSubscriptions';
import AdminDevices from '../admin/AdminDevices';
import AdminHealth from '../admin/AdminHealth';
import AdminPrograms from '../admin/AdminPrograms';
import DocumentsTab from '../admin/DocumentsTab';
import AdminSystem from '../admin/AdminSystem';
import AdminRevenue from '../admin/AdminRevenue';

type Page = 'dashboard' | 'users' | 'alerts' | 'subscriptions' | 'revenue' | 'devices' | 'health' | 'programs' | 'docs' | 'system';

const NAV: { key: Page; icon: string; label: string; group: string }[] = [
  { key: 'dashboard', icon: 'ri-dashboard-3-line', label: 'Tableau de bord', group: 'Principal' },
  { key: 'users', icon: 'ri-group-line', label: 'Utilisateurs', group: 'Principal' },
  { key: 'alerts', icon: 'ri-alarm-warning-line', label: 'Alertes & SOS', group: 'Principal' },
  { key: 'revenue', icon: 'ri-money-euro-circle-line', label: 'Revenus', group: 'Principal' },
  { key: 'devices', icon: 'ri-cpu-line', label: 'Appareils', group: 'Monitoring' },
  { key: 'health', icon: 'ri-heart-pulse-line', label: 'Sante', group: 'Monitoring' },
  { key: 'subscriptions', icon: 'ri-file-list-3-line', label: 'Contrats', group: 'Gestion' },
  { key: 'programs', icon: 'ri-flag-line', label: 'Programmes', group: 'Gestion' },
  { key: 'docs', icon: 'ri-book-2-line', label: 'Documents', group: 'Systeme' },
  { key: 'system', icon: 'ri-settings-4-line', label: 'Configuration', group: 'Systeme' },
];

export default function AdminHome({ token, user }: { token: string; user: any }) {
  const { logout } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState<any>({});
  const [collapsed, setCollapsed] = useState(false);
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // WebSocket for real-time alerts
  useEffect(() => {
    if (!token) return;
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '';
    const wsBase = backendUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${wsBase}/api/ws/admin-alerts?token=${token}`;

    let ws: WebSocket | null = null;
    let retryTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => { setWsConnected(true); };
        ws.onclose = () => {
          setWsConnected(false);
          retryTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => { ws?.close(); };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_alert') {
              const alert = data.alert;
              setLiveAlerts(prev => [{ ...alert, _ts: Date.now() }, ...prev].slice(0, 10));
              // Auto-dismiss after 12s
              setTimeout(() => {
                setLiveAlerts(prev => prev.filter(a => a._ts !== alert._ts));
              }, 12000);
            }
          } catch {}
        };
      } catch {}
    };

    connect();
    return () => { ws?.close(); clearTimeout(retryTimeout); };
  }, [token]);

  const dismissAlert = (ts: number) => setLiveAlerts(prev => prev.filter(a => a._ts !== ts));

  const mob = w < 768;
  const sideW = mob ? 0 : collapsed ? 64 : 220;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, users, alerts, ivs, actC, ivC, subs, invites, kpi, prescs, rgpd, emails, shop, analytics, programs, devices, health, revenue] = await Promise.all([
        apiFetch('/api/backoffice/stats', {}, token).catch(() => ({})),
        apiFetch('/api/backoffice/users', {}, token).catch(() => []),
        apiFetch('/api/backoffice/alerts', {}, token).catch(() => []),
        apiFetch('/api/backoffice/interventions', {}, token).catch(() => []),
        apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
        apiFetch('/api/admin/intervention-codes', {}, token).catch(() => []),
        apiFetch('/api/admin/subscriptions', {}, token).catch(() => []),
        apiFetch('/api/admin/saad-invitations', {}, token).catch(() => []),
        apiFetch('/api/backoffice/kpi', {}, token).catch(() => ({})),
        apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
        apiFetch('/api/admin/rgpd-requests', {}, token).catch(() => []),
        apiFetch('/api/admin/emails', {}, token).catch(() => []),
        apiFetch('/api/admin/shopify/status', {}, token).catch(() => null),
        apiFetch('/api/backoffice/analytics', {}, token).catch(() => ({})),
        apiFetch('/api/admin/programs', {}, token).catch(() => []),
        apiFetch('/api/admin/devices-overview', {}, token).catch(() => ({ devices: [], summary: {} })),
        apiFetch('/api/admin/health-overview', {}, token).catch(() => ({ beneficiaries: [] })),
        apiFetch('/api/backoffice/revenue', {}, token).catch(() => null),
      ]);
      setD({
        stats, users: Array.isArray(users) ? users : [], alerts: Array.isArray(alerts) ? alerts : [],
        ivs: Array.isArray(ivs) ? ivs : [], actC: Array.isArray(actC) ? actC : [],
        ivC: Array.isArray(ivC) ? ivC : [], subs: Array.isArray(subs) ? subs : [],
        invites: Array.isArray(invites) ? invites : [], kpi, prescs: Array.isArray(prescs) ? prescs : [],
        rgpd: Array.isArray(rgpd) ? rgpd : [], emails: Array.isArray(emails) ? emails : [],
        shop, analytics, programs: Array.isArray(programs) ? programs : [], devices, health, revenue,
      });
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  const { users = [], alerts = [], ivs = [], actC = [], ivC = [], subs = [], invites = [], prescs = [], rgpd = [], emails = [], shop, kpi = {}, analytics = {}, programs = [], devices = {}, health = {}, revenue } = d;
  const active = alerts.filter((a: any) => a.status === 'active');
  const groups = [...new Set(NAV.map(n => n.group))];

  return (
    <div data-testid="admin-dashboard" style={{ position: 'absolute', inset: 0, display: 'flex', fontFamily: "'Inter', system-ui, sans-serif", background: '#F1F5F9', overflow: 'hidden' } as any}>
      <style>{`
        .adm-nav:hover { background: rgba(124,58,237,0.08) !important; }
        .adm-nav.active { background: rgba(124,58,237,0.12) !important; color: #7C3AED !important; }
        .adm-card { background: #FFF; border-radius: 14px; border: 1px solid #E2E8F0; padding: 20px; transition: box-shadow 0.2s; }
        .adm-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
        .adm-table { width: 100%; border-collapse: collapse; }
        .adm-table th { text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 2px solid #F1F5F9; background: #F8FAFC; }
        .adm-table td { padding: 12px 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
        .adm-table tr:hover td { background: #F8FAFC; }
        .adm-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .adm-btn { padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
        .adm-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #E2E8F0; background: #FFF; font-size: 13px; font-family: inherit; color: #1E293B; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
        .adm-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .adm-section-title { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        @keyframes adm-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes adm-shake { 0%,100% { transform: translateX(0); } 10%,30%,50% { transform: translateX(-4px); } 20%,40% { transform: translateX(4px); } 60% { transform: translateX(0); } }
        @keyframes adm-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
        .adm-animate { animation: adm-fade 0.3s ease both; }
      `}</style>

      {/* Sidebar - Desktop only */}
      {!mob && (
        <div style={{
          width: sideW, flexShrink: 0, background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease', overflow: 'hidden',
        } as any}>
          {/* Logo */}
          <div style={{ padding: collapsed ? '16px 12px' : '20px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-shield-check-fill" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' } as any}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', letterSpacing: -0.3 }}>CARE WATCH</div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Administration</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' } as any}>
            {groups.map(g => (
              <div key={g} style={{ marginBottom: 16 } as any}>
                {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: 1.2, padding: '0 10px', marginBottom: 6 }}>{g}</div>}
                {NAV.filter(n => n.group === g).map(n => (
                  <div key={n.key} data-testid={`admin-nav-${n.key}`}
                    className={`adm-nav ${page === n.key ? 'active' : ''}`}
                    onClick={() => setPage(n.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: collapsed ? '10px 0' : '9px 12px', borderRadius: 10,
                      cursor: 'pointer', marginBottom: 2,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      color: page === n.key ? '#7C3AED' : '#64748B',
                      fontWeight: page === n.key ? 700 : 500,
                      fontSize: 13, transition: 'all 0.15s',
                      position: 'relative',
                    } as any}>
                    <i className={n.icon} style={{ fontSize: 17, flexShrink: 0 }} />
                    {!collapsed && <span>{n.label}</span>}
                    {n.key === 'alerts' && active.length > 0 && (
                      <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: 999, background: '#EF4444', fontSize: 10, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{active.length}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Collapse toggle */}
          <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px', flexShrink: 0 } as any}>
            <div onClick={() => setCollapsed(!collapsed)} style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: '#94A3B8', fontSize: 12, fontWeight: 500 } as any}>
              <i className={collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} style={{ fontSize: 16 }} />
              {!collapsed && <span>Replier</span>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 } as any}>
        {/* Top bar */}
        <div style={{
          height: 56, flexShrink: 0, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        } as any}>
          {mob && (
            <select data-testid="admin-mobile-nav" value={page} onChange={(e: any) => setPage(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#F8FAFC',
              fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'inherit', outline: 'none', flex: 1,
            } as any}>
              {NAV.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
            </select>
          )}
          {!mob && (
            <div style={{ flex: 1 } as any}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                {NAV.find(n => n.key === page)?.label}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
            {/* WS status */}
            <div data-testid="ws-status" title={wsConnected ? 'Temps reel actif' : 'Reconnexion...'} style={{
              width: 8, height: 8, borderRadius: 4,
              background: wsConnected ? '#10B981' : '#F59E0B',
              boxShadow: wsConnected ? '0 0 6px #10B981' : 'none',
              transition: 'all 0.3s',
            } as any} />
            {!mob && <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{user.name}</span>}
            <div data-testid="admin-refresh-btn" onClick={load} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FFF' } as any}>
              <i className="ri-refresh-line" style={{ fontSize: 15, color: '#64748B' }} />
            </div>
            <div data-testid="admin-logout-btn" onClick={logout} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-logout-box-r-line" style={{ fontSize: 15, color: '#EF4444' }} />
            </div>
          </div>
        </div>

        {/* Live Alert Notifications */}
        {liveAlerts.length > 0 && (
          <div data-testid="live-alerts-container" style={{
            position: 'fixed', top: 12, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380,
          } as any}>
            {liveAlerts.map((a, i) => {
              const sevC: any = { critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#3B82F6' };
              const typeI: any = { sos: 'ri-phone-fill', fall: 'ri-arrow-down-circle-fill', anomaly: 'ri-error-warning-fill', inactivity: 'ri-zzz-fill' };
              const c = sevC[a.severity] || '#EF4444';
              return (
                <div key={a._ts} data-testid={`live-alert-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: '#FFFFFF', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                  border: `2px solid ${c}40`, animation: 'adm-shake 0.5s ease, adm-fade 0.3s ease',
                  cursor: 'pointer', transition: 'all 0.2s',
                } as any} onClick={() => { dismissAlert(a._ts); setPage('alerts'); load(); }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: `${c}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    animation: 'adm-pulse-ring 1.5s ease infinite',
                  } as any}>
                    <i className={typeI[a.alert_type] || 'ri-alarm-warning-fill'} style={{ fontSize: 20, color: c }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {a.alert_type === 'sos' ? 'ALERTE SOS' : a.alert_type === 'fall' ? 'CHUTE DETECTEE' : 'NOUVELLE ALERTE'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{a.beneficiary_name}</div>
                    {a.message && <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{a.message}</div>}
                  </div>
                  <div onClick={(e: any) => { e.stopPropagation(); dismissAlert(a._ts); }} style={{
                    width: 24, height: 24, borderRadius: 8, background: '#F8FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                  } as any}>
                    <i className="ri-close-line" style={{ fontSize: 12, color: '#94A3B8' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: mob ? 12 : 24, WebkitOverflowScrolling: 'touch' } as any}>
          <div className="adm-animate" key={page}>
            {page === 'dashboard' && <AdminDashboard users={users} active={active} subs={subs} ivs={ivs} kpi={kpi} analytics={analytics} token={token} load={load} mob={mob} setPage={setPage} />}
            {page === 'users' && <AdminUsers users={users} token={token} load={load} mob={mob} />}
            {page === 'alerts' && <AdminAlerts alerts={alerts} active={active} ivs={ivs} analytics={analytics} token={token} mob={mob} />}
            {page === 'subscriptions' && <AdminSubscriptions subs={subs} prescs={prescs} invites={invites} rgpd={rgpd} emails={emails} token={token} load={load} mob={mob} />}
            {page === 'revenue' && <AdminRevenue data={revenue} mob={mob} />}
            {page === 'devices' && <AdminDevices data={devices} token={token} mob={mob} />}
            {page === 'health' && <AdminHealth data={health} token={token} mob={mob} />}
            {page === 'programs' && <AdminPrograms programs={programs} token={token} mob={mob} />}
            {page === 'docs' && <DocumentsTab token={token} mob={mob} />}
            {page === 'system' && <AdminSystem actC={actC} ivC={ivC} shop={shop} users={users} alerts={alerts} token={token} load={load} mob={mob} />}
          </div>
        </div>
      </div>
    </div>
  );
}
