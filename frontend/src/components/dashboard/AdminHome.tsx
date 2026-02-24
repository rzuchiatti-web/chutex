import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import { BG_IMAGES } from './constants';

const BG = BG_IMAGES.beneficiary;
const BG_RED = BG_IMAGES.red;
const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const SectionTitle = ({ children }: any) => <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 } as any}>{children}</div>;
const InfoRow = ({ icon, label, value, color }: any) => value ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}>
    <i className={icon} style={{ fontSize: 13, color: color || 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
    <div style={{ flex: 1 } as any}><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{String(value)}</div></div>
  </div>
) : null;

type Tab = 'dashboard' | 'users' | 'alerts' | 'analytics' | 'settings';
const ROLE_LABELS: any = { beneficiary: 'Beneficiaire', guardian: 'Gardien', admin: 'Admin', teleassistance: 'Teleassistance', prescriber_company: 'SAAD' };
const ROLE_COLORS: any = { beneficiary: '#38BDF8', guardian: '#10B981', admin: '#A78BFA', teleassistance: '#F59E0B', prescriber_company: '#F97316' };

export default function AdminHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, users, alerts, interventions, actCodes, ivCodes, subs, invites, kpi, prescriptions, rgpd, emails, shopify] = await Promise.all([
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
      setData({ stats, users: Array.isArray(users) ? users : [], alerts: Array.isArray(alerts) ? alerts : [], interventions: Array.isArray(interventions) ? interventions : [], actCodes: Array.isArray(actCodes) ? actCodes : [], ivCodes: Array.isArray(ivCodes) ? ivCodes : [], subs: Array.isArray(subs) ? subs : [], invites: Array.isArray(invites) ? invites : [], kpi, prescriptions: Array.isArray(prescriptions) ? prescriptions : [], rgpd: Array.isArray(rgpd) ? rgpd : [], emails: Array.isArray(emails) ? emails : [], shopify });
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openUser = async (u: any) => {
    setSelectedUser(u);
    setDetailLoading(true);
    try { setUserDetail(await apiFetch(`/api/backoffice/user/${u.id}`, {}, token)); } catch { setUserDetail(null); } finally { setDetailLoading(false); }
  };
  const closeUser = () => { setSelectedUser(null); setUserDetail(null); };

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  const { stats = {}, users = [], alerts = [], interventions = [], actCodes = [], ivCodes = [], subs = [], invites = [], kpi = {}, prescriptions = [], rgpd = [], emails = [], shopify } = data;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const filteredUsers = users.filter((u: any) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) { const s = search.toLowerCase(); return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s); }
    return true;
  });

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
    { key: 'users', icon: 'ri-group-line', label: 'Utilisateurs' },
    { key: 'alerts', icon: 'ri-alarm-warning-line', label: 'Alertes' },
    { key: 'analytics', icon: 'ri-pie-chart-line', label: 'Donnees' },
    { key: 'settings', icon: 'ri-settings-3-line', label: 'Systeme' },
  ];

  return (
    <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 16px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Header + Logout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(167,139,250,0.3)' } as any}><i className="ri-shield-check-line" style={{ fontSize: 20, color: '#A78BFA' }} /></div>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{user.name}</div><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Administration CARE WATCH</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8 } as any}>
            <div onClick={fetchAll} style={{ width: 36, height: 36, borderRadius: 10, ...G, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-refresh-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div>
            <div data-testid="admin-logout-btn" onClick={logout} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-logout-box-r-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>
          </div>
        </div>

        {/* ═══════ DASHBOARD ═══════ */}
        {tab === 'dashboard' && (<>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 } as any}>
            {[
              { val: users.length, label: 'Utilisateurs', icon: 'ri-group-line', color: '#38BDF8' },
              { val: activeAlerts.length, label: 'Alertes actives', icon: 'ri-alarm-warning-line', color: activeAlerts.length > 0 ? '#EF4444' : '#10B981' },
              { val: subs.filter((s: any) => s.status === 'active').length, label: 'Abonnements actifs', icon: 'ri-vip-crown-line', color: '#A78BFA' },
              { val: interventions.length, label: 'Interventions', icon: 'ri-map-pin-range-line', color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} style={{ ...G, padding: '14px', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={s.icon} style={{ fontSize: 18, color: s.color }} /></div>
                <div><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{s.val}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Active alerts */}
          {activeAlerts.length > 0 && (<div style={{ marginBottom: 14 } as any}><SectionTitle>Alertes actives</SectionTitle>
            {activeAlerts.slice(0, 3).map((a: any) => (<div key={a.id} style={{ ...G, borderColor: 'rgba(239,68,68,0.2)', padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#EF4444', flexShrink: 0 } as any} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{a.type} - {a.message?.substring(0, 50)}</div></div></div>))}
          </div>)}

          {/* Users by role */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 14 } as any}><SectionTitle>Repartition des utilisateurs</SectionTitle>
            {Object.entries(ROLE_LABELS).map(([role, label]: any) => {
              const count = users.filter((u: any) => u.role === role).length;
              return (<div key={role} onClick={() => { setRoleFilter(role); setTab('users'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: ROLE_COLORS[role] } as any} /><span style={{ flex: 1, fontSize: 13, color: '#FFF', fontWeight: 600 }}>{label}</span><span style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{count}</span></div>);
            })}
          </div>

          {/* Quick invite SAAD */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 14 } as any}><SectionTitle>Inviter un SAAD</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 } as any}>
              <input id="inv-email" placeholder="Email" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} />
              <input id="inv-name" placeholder="Nom" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} />
              <input id="inv-struct" placeholder="Structure" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} />
            </div>
            <div onClick={async () => { const e = (document.getElementById('inv-email') as HTMLInputElement)?.value; if (!e) return; try { await apiFetch('/api/admin/saad-invitation', { method: 'POST', body: JSON.stringify({ email: e, name: (document.getElementById('inv-name') as HTMLInputElement)?.value, structure_name: (document.getElementById('inv-struct') as HTMLInputElement)?.value }) }, token); alert('Invitation envoyee'); fetchAll(); } catch (err: any) { alert(err.message); } }} style={{ padding: '10px', borderRadius: 10, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#A78BFA' } as any}>Envoyer</div>
          </div>
        </>)}

        {/* ═══════ USERS ═══════ */}
        {tab === 'users' && (<>
          <input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 } as any} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' } as any}>
            {[{ k: 'all', l: 'Tous' }, ...Object.entries(ROLE_LABELS).map(([k, l]) => ({ k, l: l as string }))].map(r => (
              <div key={r.k} onClick={() => setRoleFilter(r.k)} style={{ padding: '5px 12px', borderRadius: 999, background: roleFilter === r.k ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${roleFilter === r.k ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 10, fontWeight: 700, color: roleFilter === r.k ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{r.l}</div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>{filteredUsers.length} resultat(s)</div>
          {filteredUsers.map((u: any, i: number) => (
            <div key={u.id || i} onClick={() => openUser(u)} style={{ ...G, padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: `${ROLE_COLORS[u.role] || '#666'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: ROLE_COLORS[u.role] || '#FFF' }}>{u.name?.charAt(0)}</span></div>
              <div style={{ flex: 1, minWidth: 0 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{u.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{u.phone || u.email}</div></div>
              <span style={{ fontSize: 9, fontWeight: 700, color: ROLE_COLORS[u.role], padding: '3px 8px', borderRadius: 999, background: `${ROLE_COLORS[u.role]}12` }}>{ROLE_LABELS[u.role] || u.role}</span>
            </div>
          ))}
        </>)}

        {/* ═══════ ALERTS ═══════ */}
        {tab === 'alerts' && (<>
          <SectionTitle>Alertes actives ({activeAlerts.length})</SectionTitle>
          {activeAlerts.map((a: any) => (<div key={a.id} style={{ ...G, borderColor: 'rgba(239,68,68,0.15)', padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: '#EF4444' } as any} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{a.type} - {a.message?.substring(0, 50)}</div></div><span style={{ fontSize: 9, color: '#EF4444', fontWeight: 700 }}>Active</span></div>))}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '12px 0' } as any} />
          <SectionTitle>Historique alertes ({alerts.length})</SectionTitle>
          {alerts.slice(0, 15).map((a: any, i: number) => (<div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: a.status === 'active' ? '#EF4444' : '#10B981' } as any} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{a.beneficiary_name}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{a.type}</span></div><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}</span></div>))}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '12px 0' } as any} />
          <SectionTitle>Interventions ({interventions.length})</SectionTitle>
          {interventions.slice(0, 10).map((iv: any, i: number) => (<div key={iv.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><i className="ri-map-pin-range-line" style={{ fontSize: 12, color: '#F59E0B' }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{iv.intervenant_name || 'Intervenant'}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{iv.beneficiary_name}</span></div><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{iv.status}</span></div>))}
        </>)}

        {/* ═══════ DONNEES ═══════ */}
        {tab === 'analytics' && (<>
          {/* Abonnements */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}><SectionTitle>Abonnements ({subs.length})</SectionTitle>
              <div onClick={() => { const ph = prompt('Telephone beneficiaire'); if (ph) apiFetch('/api/admin/subscriptions', { method: 'POST', body: JSON.stringify({ beneficiary_phone: ph, subscription_type: 'care', source: 'admin' }) }, token).then(() => { alert('Cree'); fetchAll(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#10B981' } as any}>+ Creer</div>
            </div>
            {subs.slice(0, 8).map((s: any, i: number) => (<div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><i className="ri-vip-crown-line" style={{ fontSize: 12, color: s.status === 'active' ? '#A78BFA' : 'rgba(255,255,255,0.2)' }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{s.beneficiary_phone}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>{s.subscription_type} - {s.source}</span></div><span style={{ fontSize: 9, fontWeight: 700, color: s.status === 'active' ? '#10B981' : '#EF4444' }}>{s.status}</span><div onClick={(e: any) => { e.stopPropagation(); if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/subscriptions/${s.id}`, { method: 'DELETE' }, token).then(() => fetchAll()); }} style={{ cursor: 'pointer', padding: 4 } as any}><i className="ri-close-line" style={{ fontSize: 12, color: 'rgba(239,68,68,0.4)' }} /></div></div>))}
          </div>

          {/* Prescriptions */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}><SectionTitle>Prescriptions ({prescriptions.length})</SectionTitle>
            {prescriptions.slice(0, 8).map((p: any, i: number) => (<div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><i className="ri-file-list-line" style={{ fontSize: 12, color: '#38BDF8' }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{p.beneficiary_name || p.beneficiary_phone}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>par {p.guardian_name || 'Prescripteur'}</span></div><span style={{ fontSize: 9, fontWeight: 700, color: p.status === 'active' ? '#10B981' : '#F59E0B' }}>{p.status}</span></div>))}
          </div>

          {/* Invitations SAAD */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}><SectionTitle>Invitations SAAD ({invites.length})</SectionTitle>
            {invites.map((inv: any, i: number) => (<div key={inv.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><i className="ri-mail-send-line" style={{ fontSize: 12, color: '#A78BFA' }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{inv.name || inv.email}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>{inv.structure_name}</span></div><span style={{ fontSize: 9, fontWeight: 700, color: inv.status === 'pending' ? '#F59E0B' : '#10B981' }}>{inv.status}</span></div>))}
          </div>

          {/* RGPD */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}><SectionTitle>Demandes RGPD ({rgpd.length})</SectionTitle>
            {rgpd.length === 0 ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center', padding: 8 }}>Aucune demande</div> : rgpd.slice(0, 8).map((r: any, i: number) => (<div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><i className="ri-shield-check-line" style={{ fontSize: 12, color: '#38BDF8' }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{r.user_name}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>{r.right_label}</span></div><span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'pending' ? '#F59E0B' : '#10B981' }}>{r.status}</span></div>))}
          </div>

          {/* Emails */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}><SectionTitle>Emails envoyes ({emails.length})</SectionTitle>
            {emails.slice(0, 6).map((e: any, i: number) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><i className="ri-mail-line" style={{ fontSize: 12, color: '#38BDF8' }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 11, fontWeight: 600, color: '#FFF' }}>{e.subject?.substring(0, 35)}</span><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>A: {e.to}</div></div></div>))}
          </div>
        </>)}

        {/* ═══════ SYSTEME ═══════ */}
        {tab === 'settings' && (<>
          {/* Codes activation */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}><SectionTitle>Codes d'activation ({actCodes.length})</SectionTitle>
              <div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, max_uses: 50 }) }, token).then(() => fetchAll()).catch((e: any) => alert(e.message)); }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#10B981' } as any}>+ Ajouter</div>
            </div>
            {actCodes.map((c: any, i: number) => (<div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: c.active ? '#10B981' : '#EF4444' } as any} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 700, color: '#FFF', fontFamily: 'monospace' }}>{c.code}</span><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{c.structure_name} - {c.uses_count || 0}/{c.max_uses}</div></div><div onClick={() => apiFetch(`/api/admin/activation-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => fetchAll())} style={{ padding: '3px 8px', borderRadius: 6, background: c.active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', cursor: 'pointer', fontSize: 8, fontWeight: 700, color: c.active ? '#EF4444' : '#10B981' } as any}>{c.active ? 'Off' : 'On'}</div><div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/activation-codes/${c.id}`, { method: 'DELETE' }, token).then(() => fetchAll()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 12, color: 'rgba(239,68,68,0.3)' }} /></div></div>))}
          </div>

          {/* Codes intervention */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}><SectionTitle>Codes intervention ({ivCodes.length})</SectionTitle>
              <div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, default_radius_km: 30 }) }, token).then(() => fetchAll()).catch((e: any) => alert(e.message)); }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#F59E0B' } as any}>+ Ajouter</div>
            </div>
            {ivCodes.map((c: any, i: number) => (<div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: c.active ? '#F59E0B' : '#EF4444' } as any} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 700, color: '#FFF', fontFamily: 'monospace' }}>{c.code}</span><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{c.structure_name} - Rayon {c.default_radius_km}km</div></div><div onClick={() => apiFetch(`/api/admin/intervention-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => fetchAll())} style={{ padding: '3px 8px', borderRadius: 6, background: c.active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', cursor: 'pointer', fontSize: 8, fontWeight: 700, color: c.active ? '#EF4444' : '#10B981' } as any}>{c.active ? 'Off' : 'On'}</div></div>))}
          </div>

          {/* Shopify */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}><SectionTitle>Shopify</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Statut: {shopify?.connected ? 'Connecte' : 'Non configure'}</span><div onClick={() => apiFetch('/api/admin/shopify/sync', { method: 'POST' }, token).then(() => alert('Sync OK')).catch(() => {})} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#10B981' } as any}>Sync</div></div>
          </div>

          {/* System info */}
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}><SectionTitle>Informations systeme</SectionTitle>
            {[{ l: 'Version', v: 'CARE WATCH v3.0' }, { l: 'Editeur', v: 'Chutex Innovation SAS' }, { l: 'DPO', v: 'contact@chutex-innovation.com' }, { l: 'Stack', v: 'FastAPI + MongoDB + Expo' }, { l: 'IA', v: 'GPT-4.1 (Emergent)' }].map((s, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.l}</span><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{s.v}</span></div>))}
          </div>
        </>)}

        {/* ═══════ USER DETAIL POPUP ═══════ */}
        {selectedUser && (
          <div onClick={closeUser} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', overflowY: 'auto' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '32px 20px 100px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 } as any}><div onClick={closeUser} style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div></div>

              {detailLoading ? <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Chargement...</div> : (() => {
                const d = userDetail?.user || selectedUser;
                const guards = userDetail?.guardians || [];
                const bens = userDetail?.beneficiaries || [];
                const devices = userDetail?.devices || [];
                const als = userDetail?.alerts || [];
                const sub = userDetail?.subscription;
                const col = ROLE_COLORS[d.role] || '#A78BFA';
                return (<>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                    <div style={{ width: 56, height: 56, borderRadius: 999, background: `${col}20`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, border: `2px solid ${col}40` } as any}><span style={{ fontSize: 22, fontWeight: 800, color: col }}>{d.name?.charAt(0)}</span></div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{d.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 6 } as any}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, padding: '2px 10px', borderRadius: 999, background: `${col}12` }}>{ROLE_LABELS[d.role] || d.role}</span>
                      {sub && <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', padding: '2px 10px', borderRadius: 999, background: 'rgba(167,139,250,0.1)' }}>Abonne {sub.subscription_type}</span>}
                    </div>
                  </div>
                  {/* Identity */}
                  <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Identite</SectionTitle>
                    <InfoRow icon="ri-phone-line" label="Telephone" value={d.phone} /><InfoRow icon="ri-mail-line" label="Email" value={d.email} /><InfoRow icon="ri-map-pin-line" label="Adresse" value={d.address} /><InfoRow icon="ri-calendar-line" label="Naissance" value={d.date_of_birth} /><InfoRow icon="ri-user-line" label="Genre" value={d.gender} /><InfoRow icon="ri-time-line" label="Inscription" value={d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} /><InfoRow icon="ri-id-card-line" label="ID" value={d.id} />
                  </div>
                  {/* Medical */}
                  {d.role === 'beneficiary' && <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Dossier medical</SectionTitle>
                    <InfoRow icon="ri-drop-line" label="Groupe sanguin" value={d.blood_type} /><InfoRow icon="ri-heart-pulse-line" label="Pathologies" value={d.medical_conditions} /><InfoRow icon="ri-alert-line" label="Allergies" value={d.allergies} /><InfoRow icon="ri-stethoscope-line" label="Medecin" value={d.doctor_name} /><InfoRow icon="ri-ruler-line" label="Taille" value={d.height_cm ? `${d.height_cm} cm` : null} /><InfoRow icon="ri-scales-3-line" label="Poids" value={d.weight_kg ? `${d.weight_kg} kg` : null} /><InfoRow icon="ri-phone-line" label="Contact urgence" value={d.emergency_contact_name ? `${d.emergency_contact_name} (${d.emergency_contact_phone})` : null} />
                  </div>}
                  {/* Guardian/SAAD info */}
                  {(d.role === 'guardian' || d.role === 'prescriber_company') && <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Informations {d.role === 'guardian' ? 'gardien' : 'SAAD'}</SectionTitle>
                    <InfoRow icon="ri-shield-line" label="Type" value={d.guardian_type} /><InfoRow icon="ri-heart-line" label="Lien" value={d.relationship} /><InfoRow icon="ri-stethoscope-line" label="Profession" value={d.profession} /><InfoRow icon="ri-building-line" label="Structure" value={d.structure_name} /><InfoRow icon="ri-barcode-line" label="SIRET" value={d.siret} /><InfoRow icon="ri-key-line" label="Code prescripteur" value={d.prescriber_code_used} />
                  </div>}
                  {/* Devices */}
                  {devices.length > 0 && <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Appareils ({devices.length})</SectionTitle>
                    {devices.map((dev: any, i: number) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' } as any}><i className={dev.device_type === 'bracelet' ? 'ri-heart-pulse-line' : dev.device_type === 'scale' ? 'ri-scales-3-line' : 'ri-t-shirt-line'} style={{ fontSize: 12, color: dev.connected ? '#10B981' : 'rgba(255,255,255,0.2)' }} /><span style={{ fontSize: 12, color: '#FFF', flex: 1 }}>{dev.name}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{dev.battery}%</span></div>))}
                  </div>}
                  {/* Linked users */}
                  {guards.length > 0 && <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Gardiens lies ({guards.length})</SectionTitle>
                    {guards.map((g: any, i: number) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' } as any}><div style={{ width: 24, height: 24, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#10B981' }}>{g.name?.charAt(0)}</span></div><span style={{ fontSize: 12, color: '#FFF', flex: 1 }}>{g.name}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{g.phone}</span></div>))}
                  </div>}
                  {bens.length > 0 && <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Beneficiaires lies ({bens.length})</SectionTitle>
                    {bens.map((b: any, i: number) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' } as any}><div style={{ width: 24, height: 24, borderRadius: 999, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#38BDF8' }}>{b.name?.charAt(0)}</span></div><span style={{ fontSize: 12, color: '#FFF', flex: 1 }}>{b.name}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{b.phone}</span></div>))}
                  </div>}
                  {/* Alerts */}
                  {als.length > 0 && <div style={{ ...G, padding: '12px 14px', marginBottom: 8 } as any}><SectionTitle>Alertes ({als.length})</SectionTitle>
                    {als.slice(0, 5).map((a: any, i: number) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0' } as any}><div style={{ width: 5, height: 5, borderRadius: 3, background: a.status === 'active' ? '#EF4444' : '#10B981' } as any} /><span style={{ fontSize: 11, color: '#FFF', flex: 1 }}>{a.type} - {a.message?.substring(0, 30)}</span><span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{a.status}</span></div>))}
                  </div>}
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 } as any}>
                    <div onClick={closeUser} style={{ flex: 1, padding: '12px', borderRadius: 999, ...G, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
                    <div onClick={() => { if (window.confirm(`Supprimer ${d.name} ?`)) apiFetch(`/api/admin/user/${d.id}`, { method: 'DELETE' }, token).then(() => { closeUser(); fetchAll(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#EF4444' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 13 }} /></div>
                  </div>
                </>);
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ TAB BAR ═══════ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '8px 12px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8) 30%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 420, margin: '0 auto' } as any}>
          {tabs.map(t => (
            <div key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '6px 0', opacity: tab === t.key ? 1 : 0.4, transition: 'opacity 0.2s' } as any}>
              <i className={t.icon} style={{ fontSize: 20, color: tab === t.key ? '#A78BFA' : '#FFF' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: tab === t.key ? '#A78BFA' : '#FFF' }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
