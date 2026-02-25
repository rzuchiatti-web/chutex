import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import DashboardTab from '../admin/DashboardTab';
import UsersTab from '../admin/UsersTab';
import AlertsTab from '../admin/AlertsTab';
import DataTab from '../admin/DataTab';
import SystemTab from '../admin/SystemTab';
import UserDetailModal from '../admin/UserDetailModal';

type MainTab = 'dashboard' | 'users' | 'alerts' | 'data' | 'system';
type DataSub = 'subscriptions' | 'prescriptions' | 'saad' | 'rgpd' | 'emails';
type SysSub = 'activation' | 'intervention' | 'shopify' | 'info';

export default function AdminHome({ token, user }: { token: string; user: any }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState<MainTab>('dashboard');
  const [dataSub, setDataSub] = useState<DataSub>('subscriptions');
  const [sysSub, setSysSub] = useState<SysSub>('activation');
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState<any>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sel, setSel] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 400);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  const mob = w < 520;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, users, alerts, ivs, actC, ivC, subs, invites, kpi, prescs, rgpd, emails, shop] = await Promise.all([
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
      ]);
      setD({ stats, users: Array.isArray(users) ? users : [], alerts: Array.isArray(alerts) ? alerts : [], ivs: Array.isArray(ivs) ? ivs : [], actC: Array.isArray(actC) ? actC : [], ivC: Array.isArray(ivC) ? ivC : [], subs: Array.isArray(subs) ? subs : [], invites: Array.isArray(invites) ? invites : [], kpi, prescs: Array.isArray(prescs) ? prescs : [], rgpd: Array.isArray(rgpd) ? rgpd : [], emails: Array.isArray(emails) ? emails : [], shop });
    } catch {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const openUser = async (u: any) => { setSel(u); setDetailLoad(true); try { setDetail(await apiFetch(`/api/backoffice/user/${u.id}`, {}, token)); } catch { setDetail(null); } finally { setDetailLoad(false); } };
  const closeDetail = () => { setSel(null); setDetail(null); };

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  const { users = [], alerts = [], ivs = [], actC = [], ivC = [], subs = [], invites = [], prescs = [], rgpd = [], emails = [], shop } = d;
  const active = alerts.filter((a: any) => a.status === 'active');
  const filtered = users.filter((u: any) => { if (roleFilter !== 'all' && u.role !== roleFilter) return false; if (search) { const s = search.toLowerCase(); return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s); } return true; });

  const tabs: { key: MainTab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: 'ri-dashboard-line', label: 'Tableau de bord' },
    { key: 'users', icon: 'ri-group-line', label: 'Utilisateurs' },
    { key: 'alerts', icon: 'ri-alarm-warning-line', label: 'Alertes' },
    { key: 'data', icon: 'ri-database-2-line', label: 'Donnees' },
    { key: 'system', icon: 'ri-settings-3-line', label: 'Systeme' },
  ];

  return (
    <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F4F6', overflow: 'hidden' } as any}>
      {/* Top Bar */}
      <div style={{ background: '#FFF', borderBottom: '1px solid #E5E7EB', padding: mob ? '10px 12px' : '10px 20px', flexShrink: 0 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-check-line" style={{ fontSize: 16, color: '#FFF' }} /></div>
          <div style={{ flex: 1, minWidth: 0 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>CARE WATCH</span>{!mob && <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Administration</span>}</div>
          {!mob && <span style={{ fontSize: 12, color: '#6B7280', marginRight: 10 }}>{user.name}</span>}
          <div onClick={load} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-refresh-line" style={{ fontSize: 14, color: '#6B7280' }} /></div>
          <div data-testid="admin-logout-btn" onClick={logout} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-logout-box-r-line" style={{ fontSize: 14, color: '#DC2626' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as any}>
          {tabs.map(t => (
            <div key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)} style={{ padding: mob ? '8px 10px' : '8px 16px', borderBottom: tab === t.key ? '2px solid #7C3AED' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 } as any}>
              <i className={t.icon} style={{ fontSize: 14, color: tab === t.key ? '#7C3AED' : '#9CA3AF' }} />
              {!mob && <span style={{ fontSize: 12, fontWeight: 600, color: tab === t.key ? '#7C3AED' : '#6B7280' }}>{t.label}</span>}
              {t.key === 'alerts' && active.length > 0 && <span style={{ width: 18, height: 18, borderRadius: 999, background: '#DC2626', fontSize: 10, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{active.length}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: mob ? 12 : 20, WebkitOverflowScrolling: 'touch' } as any}>
        {tab === 'dashboard' && <DashboardTab users={users} active={active} subs={subs} ivs={ivs} token={token} load={load} setRoleFilter={setRoleFilter} setTab={setTab} mob={mob} />}
        {tab === 'users' && <UsersTab users={users} filtered={filtered} search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} openUser={openUser} mob={mob} />}
        {tab === 'alerts' && <AlertsTab alerts={alerts} active={active} ivs={ivs} mob={mob} />}
        {tab === 'data' && <DataTab dataSub={dataSub} setDataSub={setDataSub} subs={subs} prescs={prescs} invites={invites} rgpd={rgpd} emails={emails} token={token} load={load} mob={mob} />}
        {tab === 'system' && <SystemTab sysSub={sysSub} setSysSub={setSysSub} actC={actC} ivC={ivC} shop={shop} users={users} alerts={alerts} token={token} load={load} mob={mob} />}
        <UserDetailModal sel={sel} detail={detail} detailLoad={detailLoad} token={token} load={load} onClose={closeDetail} mob={mob} />
      </div>
    </div>
  );
}
