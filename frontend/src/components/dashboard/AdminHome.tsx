import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import { BG_IMAGES } from './constants';

const BG = BG_IMAGES.beneficiary;
const G: any = { borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const ROLES: any = { beneficiary: 'Beneficiaire', guardian: 'Gardien', admin: 'Admin', teleassistance: 'Teleassistance', prescriber_company: 'SAAD' };
const RCOL: any = { beneficiary: '#38BDF8', guardian: '#10B981', admin: '#A78BFA', teleassistance: '#F59E0B', prescriber_company: '#F97316' };

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
  const mobile = w < 500;

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

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  const { users = [], alerts = [], ivs = [], actC = [], ivC = [], subs = [], invites = [], prescs = [], rgpd = [], emails = [], shop } = d;
  const active = alerts.filter((a: any) => a.status === 'active');
  const filtered = users.filter((u: any) => { if (roleFilter !== 'all' && u.role !== roleFilter) return false; if (search) { const s = search.toLowerCase(); return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s); } return true; });

  const mainTabs: { key: MainTab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: 'ri-dashboard-line', label: 'Tableau de bord' },
    { key: 'users', icon: 'ri-group-line', label: 'Utilisateurs' },
    { key: 'alerts', icon: 'ri-alarm-warning-line', label: 'Alertes & Interventions' },
    { key: 'data', icon: 'ri-database-2-line', label: 'Donnees' },
    { key: 'system', icon: 'ri-settings-3-line', label: 'Configuration' },
  ];

  const Pill = ({ active: a, onClick, children, count }: any) => (
    <div onClick={onClick} style={{ padding: '6px 14px', borderRadius: 10, background: a ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${a ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: a ? '#A78BFA' : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' } as any}>
      {children}{count != null && <span style={{ fontSize: 9, opacity: 0.6 }}>({count})</span>}
    </div>
  );

  const Table = ({ headers, rows }: { headers: string[]; rows: any[][] }) => (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: mobile ? 11 : 12, minWidth: mobile ? 500 : 'auto' } as any}>
        <thead><tr>{headers.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: mobile ? '6px 8px' : '8px 10px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' } as any}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}>{row.map((cell, j) => <td key={j} style={{ padding: mobile ? '6px 8px' : '8px 10px', color: '#FFF', verticalAlign: 'middle' } as any}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  const Badge = ({ color, children }: any) => <span style={{ fontSize: 9, fontWeight: 700, color, padding: '2px 8px', borderRadius: 999, background: `${color}15` }}>{children}</span>;

  return (
    <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />

      {/* ══ TOP BAR ══ */}
      <div style={{ position: 'relative', zIndex: 10, padding: mobile ? '10px 12px' : '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(0,0,0,0.2)' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 12, marginBottom: 8 } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-check-line" style={{ fontSize: 16, color: '#A78BFA' }} /></div>
          <div style={{ flex: 1, minWidth: 0 } as any}><span style={{ fontSize: mobile ? 12 : 14, fontWeight: 800, color: '#FFF' }}>CARE WATCH</span>{!mobile && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>Administration</span>}</div>
          {!mobile && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>{user.name}</span>}
          <div onClick={load} style={{ width: 30, height: 30, borderRadius: 8, ...G, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-refresh-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} /></div>
          <div data-testid="admin-logout-btn" onClick={logout} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-logout-box-r-line" style={{ fontSize: 14, color: '#EF4444' }} /></div>
        </div>
        {/* Main tabs - scrollable on mobile */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as any}>
          {mainTabs.map(t => (
            <div key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)} style={{ padding: mobile ? '7px 10px' : '8px 14px', borderRadius: '10px 10px 0 0', background: tab === t.key ? 'rgba(167,139,250,0.12)' : 'transparent', borderBottom: tab === t.key ? '2px solid #A78BFA' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 } as any}>
              <i className={t.icon} style={{ fontSize: 14, color: tab === t.key ? '#A78BFA' : 'rgba(255,255,255,0.3)' }} />
              {!mobile && <span style={{ fontSize: 11, fontWeight: 700, color: tab === t.key ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{t.label}</span>}
              {t.key === 'alerts' && active.length > 0 && <span style={{ width: 16, height: 16, borderRadius: 999, background: '#EF4444', fontSize: 9, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{active.length}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ══ CONTENT ══ */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: mobile ? '12px' : '16px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: mobile ? 8 : 10, marginBottom: 14 } as any}>
            {[
              { v: users.length, l: 'Utilisateurs', i: 'ri-group-line', c: '#38BDF8' },
              { v: active.length, l: 'Alertes actives', i: 'ri-alarm-warning-line', c: active.length > 0 ? '#EF4444' : '#10B981' },
              { v: subs.filter((s: any) => s.status === 'active').length, l: 'Abonnes actifs', i: 'ri-vip-crown-line', c: '#A78BFA' },
              { v: ivs.length, l: 'Interventions', i: 'ri-map-pin-range-line', c: '#F59E0B' },
            ].map((k, i) => (
              <div key={i} style={{ ...G, padding: mobile ? '12px' : '16px', display: 'flex', alignItems: 'center', gap: mobile ? 10 : 14 } as any}>
                <div style={{ width: mobile ? 36 : 44, height: mobile ? 36 : 44, borderRadius: 12, background: `${k.c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={k.i} style={{ fontSize: mobile ? 16 : 20, color: k.c }} /></div>
                <div><div style={{ fontSize: mobile ? 20 : 26, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{k.v}</div><div style={{ fontSize: mobile ? 9 : 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{k.l}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 12 } as any}>
            {/* Users by role */}
            <div style={{ ...G, padding: '16px' } as any}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Repartition par role</div>
              {Object.entries(ROLES).map(([r, l]: any) => { const n = users.filter((u: any) => u.role === r).length; return (
                <div key={r} onClick={() => { setRoleFilter(r); setTab('users'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: RCOL[r] } as any} /><span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{l}</span><span style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{n}</span></div>
              ); })}
            </div>
            {/* Invite SAAD */}
            <div style={{ ...G, padding: '16px' } as any}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Inviter un dirigeant SAAD</div>
              {['Email', 'Nom', 'Structure'].map((p, i) => <input key={i} id={`inv-${i}`} placeholder={p} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 6 } as any} />)}
              <div onClick={async () => { const e = (document.getElementById('inv-0') as HTMLInputElement)?.value; if (!e) return; try { await apiFetch('/api/admin/saad-invitation', { method: 'POST', body: JSON.stringify({ email: e, name: (document.getElementById('inv-1') as HTMLInputElement)?.value, structure_name: (document.getElementById('inv-2') as HTMLInputElement)?.value }) }, token); alert('Invitation envoyee'); load(); } catch (err: any) { alert(err.message); } }} style={{ padding: '9px', borderRadius: 10, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#A78BFA' } as any}>Envoyer l'invitation</div>
            </div>
          </div>
        </>)}

        {/* ── USERS ── */}
        {tab === 'users' && (<>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' } as any}>
            <input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' } as any}>{filtered.length} resultat(s)</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' } as any}>
            <Pill active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} count={users.length}>Tous</Pill>
            {Object.entries(ROLES).map(([k, l]: any) => <Pill key={k} active={roleFilter === k} onClick={() => setRoleFilter(k)} count={users.filter((u: any) => u.role === k).length}>{l}</Pill>)}
          </div>
          <div style={{ ...G, overflow: 'hidden' } as any}>
            <Table headers={['', 'Nom', 'Telephone', 'Email', 'Role', '']} rows={filtered.map((u: any) => [
              <div style={{ width: 28, height: 28, borderRadius: 999, background: `${RCOL[u.role] || '#666'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 800, color: RCOL[u.role] }}>{u.name?.charAt(0)}</span></div>,
              <span style={{ fontWeight: 700 }}>{u.name}</span>,
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{u.phone}</span>,
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{u.email}</span>,
              <Badge color={RCOL[u.role]}>{ROLES[u.role] || u.role}</Badge>,
              <div onClick={() => openUser(u)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Voir</div>,
            ])} />
          </div>
        </>)}

        {/* ── ALERTS ── */}
        {tab === 'alerts' && (<>
          {active.length > 0 && (<div style={{ marginBottom: 14 } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444', marginBottom: 8 }}>Alertes actives ({active.length})</div>
            <div style={{ ...G, overflow: 'hidden' } as any}><Table headers={['Beneficiaire', 'Type', 'Message', 'Date', 'Statut']} rows={active.map((a: any) => [<span style={{ fontWeight: 700 }}>{a.beneficiary_name}</span>, a.type, <span style={{ fontSize: 11 }}>{a.message?.substring(0, 40)}</span>, a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '', <Badge color="#EF4444">Active</Badge>])} /></div>
          </div>)}
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Historique alertes ({alerts.length})</div>
          <div style={{ ...G, overflow: 'hidden', marginBottom: 14 } as any}><Table headers={['Beneficiaire', 'Type', 'Date', 'Statut']} rows={alerts.slice(0, 20).map((a: any) => [a.beneficiary_name, a.type, a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '', <Badge color={a.status === 'active' ? '#EF4444' : '#10B981'}>{a.status}</Badge>])} /></div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Interventions ({ivs.length})</div>
          <div style={{ ...G, overflow: 'hidden' } as any}><Table headers={['Intervenant', 'Beneficiaire', 'Statut']} rows={ivs.slice(0, 15).map((iv: any) => [iv.intervenant_name || 'Intervenant', iv.beneficiary_name || '--', <Badge color="#F59E0B">{iv.status}</Badge>])} /></div>
        </>)}

        {/* ── DATA ── */}
        {tab === 'data' && (<>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' } as any}>
            {([['subscriptions', 'Abonnements', subs.length], ['prescriptions', 'Prescriptions', prescs.length], ['saad', 'Invitations SAAD', invites.length], ['rgpd', 'Demandes RGPD', rgpd.length], ['emails', 'Emails envoyes', emails.length]] as any).map(([k, l, n]: any) => <Pill key={k} active={dataSub === k} onClick={() => setDataSub(k)} count={n}>{l}</Pill>)}
          </div>
          {dataSub === 'subscriptions' && (<div style={{ ...G, overflow: 'hidden' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}><span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Abonnements ({subs.length})</span><div onClick={() => { const ph = prompt('Telephone beneficiaire'); if (ph) apiFetch('/api/admin/subscriptions', { method: 'POST', body: JSON.stringify({ beneficiary_phone: ph, subscription_type: 'care', source: 'admin' }) }, token).then(() => { alert('Cree'); load(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#10B981' } as any}>+ Creer</div></div>
            <Table headers={['Telephone', 'Type', 'Source', 'Statut', '']} rows={subs.map((s: any) => [s.beneficiary_phone, s.subscription_type, s.source, <Badge color={s.status === 'active' ? '#10B981' : '#EF4444'}>{s.status}</Badge>, <div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/subscriptions/${s.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 12, color: 'rgba(239,68,68,0.4)' }} /></div>])} />
          </div>)}
          {dataSub === 'prescriptions' && (<div style={{ ...G, overflow: 'hidden' } as any}><Table headers={['Beneficiaire', 'Prescripteur', 'Statut', 'Date']} rows={prescs.slice(0, 20).map((p: any) => [p.beneficiary_name || p.beneficiary_phone, p.guardian_name || 'Prescripteur', <Badge color={p.status === 'active' ? '#10B981' : '#F59E0B'}>{p.status}</Badge>, p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''])} /></div>)}
          {dataSub === 'saad' && (<div style={{ ...G, overflow: 'hidden' } as any}><Table headers={['Nom', 'Email', 'Structure', 'Statut', 'Date']} rows={invites.map((inv: any) => [inv.name || '--', inv.email, inv.structure_name, <Badge color={inv.status === 'pending' ? '#F59E0B' : '#10B981'}>{inv.status}</Badge>, inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : ''])} /></div>)}
          {dataSub === 'rgpd' && (<div style={{ ...G, overflow: 'hidden' } as any}><Table headers={['Utilisateur', 'Email', 'Droit', 'Message', 'Statut', 'Date']} rows={rgpd.map((r: any) => [r.user_name, <span style={{ fontSize: 10 }}>{r.user_email}</span>, r.right_label, <span style={{ fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' } as any}>{r.message || '--'}</span>, <Badge color={r.status === 'pending' ? '#F59E0B' : '#10B981'}>{r.status}</Badge>, r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''])} /></div>)}
          {dataSub === 'emails' && (<div style={{ ...G, overflow: 'hidden' } as any}><Table headers={['Destinataire', 'Objet', 'Date']} rows={emails.slice(0, 20).map((e: any) => [e.to, <span style={{ fontSize: 11 }}>{e.subject?.substring(0, 45)}</span>, e.sent_at ? new Date(e.sent_at).toLocaleDateString('fr-FR') : ''])} /></div>)}
        </>)}

        {/* ── SYSTEM ── */}
        {tab === 'system' && (<>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' } as any}>
            {([['activation', 'Codes activation', actC.length], ['intervention', 'Codes intervention', ivC.length], ['shopify', 'Shopify', null], ['info', 'Systeme', null]] as any).map(([k, l, n]: any) => <Pill key={k} active={sysSub === k} onClick={() => setSysSub(k)} count={n}>{l}</Pill>)}
          </div>
          {sysSub === 'activation' && (<div style={{ ...G, overflow: 'hidden' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}><span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Codes d'activation ({actC.length})</span><div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, max_uses: 50 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#10B981' } as any}>+ Ajouter</div></div>
            <Table headers={['Code', 'Structure', 'Utilisations', 'Actif', '']} rows={actC.map((c: any) => [<span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</span>, c.structure_name, `${c.uses_count || 0}/${c.max_uses}`, <Badge color={c.active ? '#10B981' : '#EF4444'}>{c.active ? 'Actif' : 'Inactif'}</Badge>, <div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => apiFetch(`/api/admin/activation-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} style={{ cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>{c.active ? 'Off' : 'On'}</div><div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/activation-codes/${c.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 12, color: 'rgba(239,68,68,0.3)' }} /></div></div>])} />
          </div>)}
          {sysSub === 'intervention' && (<div style={{ ...G, overflow: 'hidden' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}><span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Codes intervention ({ivC.length})</span><div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, default_radius_km: 30 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#F59E0B' } as any}>+ Ajouter</div></div>
            <Table headers={['Code', 'Structure', 'Rayon', 'Actif', '']} rows={ivC.map((c: any) => [<span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</span>, c.structure_name, `${c.default_radius_km} km`, <Badge color={c.active ? '#10B981' : '#EF4444'}>{c.active ? 'Actif' : 'Inactif'}</Badge>, <div onClick={() => apiFetch(`/api/admin/intervention-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} style={{ cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>{c.active ? 'Off' : 'On'}</div>])} />
          </div>)}
          {sysSub === 'shopify' && (<div style={{ ...G, padding: '20px' } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Integration Shopify</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Statut : {shop?.connected ? 'Connecte' : 'Non configure'}</div><div onClick={() => apiFetch('/api/admin/shopify/sync', { method: 'POST' }, token).then(() => alert('Sync OK')).catch(() => {})} style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#10B981' } as any}>Synchroniser</div></div>)}
          {sysSub === 'info' && (<div style={{ ...G, padding: '20px' } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Informations systeme</div>{[['Version', 'CARE WATCH v3.0'], ['Editeur', 'Chutex Innovation SAS'], ['Contact DPO', 'contact@chutex-innovation.com'], ['Stack technique', 'FastAPI + MongoDB + Expo'], ['IA', 'GPT-4.1 via Emergent'], ['Utilisateurs', String(users.length)], ['Alertes totales', String(alerts.length)], ['Abonnements', String(subs.length)]].map(([l, v], i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } as any}><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{l}</span><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{v}</span></div>)}</div>)}
        </>)}

        {/* ══ USER DETAIL POPUP ══ */}
        {sel && (
          <div onClick={() => { setSel(null); setDetail(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', overflowY: 'auto' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, margin: '0 auto', padding: '32px 20px 60px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Fiche utilisateur</span><div onClick={() => { setSel(null); setDetail(null); }} style={{ width: 32, height: 32, borderRadius: 999, ...G, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div></div>
              {detailLoad ? <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>Chargement...</div> : (() => {
                const u = detail?.user || sel; const guards = detail?.guardians || []; const bens = detail?.beneficiaries || []; const devs = detail?.devices || []; const als = detail?.alerts || []; const sub = detail?.subscription; const c = RCOL[u.role] || '#A78BFA';
                return (<>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '14px', ...G } as any}>
                    <div style={{ width: 48, height: 48, borderRadius: 999, background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${c}40` } as any}><span style={{ fontSize: 20, fontWeight: 800, color: c }}>{u.name?.charAt(0)}</span></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{u.name}</div><div style={{ display: 'flex', gap: 6, marginTop: 4 } as any}><Badge color={c}>{ROLES[u.role] || u.role}</Badge>{sub && <Badge color="#A78BFA">Abonne {sub.subscription_type}</Badge>}</div></div>
                  </div>
                  {/* Identity */}
                  <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Identite</div><InfoRow icon="ri-phone-line" label="Telephone" value={u.phone} /><InfoRow icon="ri-mail-line" label="Email" value={u.email} /><InfoRow icon="ri-map-pin-line" label="Adresse" value={u.address} /><InfoRow icon="ri-calendar-line" label="Naissance" value={u.date_of_birth} /><InfoRow icon="ri-user-line" label="Genre" value={u.gender} /><InfoRow icon="ri-id-card-line" label="ID" value={u.id} /><InfoRow icon="ri-time-line" label="Inscription" value={u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} /></div>
                  {u.role === 'beneficiary' && <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Medical</div><InfoRow icon="ri-drop-line" label="Sang" value={u.blood_type} /><InfoRow icon="ri-heart-pulse-line" label="Pathologies" value={u.medical_conditions} /><InfoRow icon="ri-alert-line" label="Allergies" value={u.allergies} /><InfoRow icon="ri-stethoscope-line" label="Medecin" value={u.doctor_name} /><InfoRow icon="ri-ruler-line" label="Taille" value={u.height_cm ? `${u.height_cm} cm` : null} /><InfoRow icon="ri-scales-3-line" label="Poids" value={u.weight_kg ? `${u.weight_kg} kg` : null} /><InfoRow icon="ri-phone-line" label="Urgence" value={u.emergency_contact_name ? `${u.emergency_contact_name} (${u.emergency_contact_phone})` : null} /></div>}
                  {(u.role === 'guardian' || u.role === 'prescriber_company') && <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{u.role === 'guardian' ? 'Gardien' : 'SAAD'}</div><InfoRow icon="ri-shield-line" label="Type" value={u.guardian_type} /><InfoRow icon="ri-heart-line" label="Lien" value={u.relationship} /><InfoRow icon="ri-stethoscope-line" label="Profession" value={u.profession} /><InfoRow icon="ri-building-line" label="Structure" value={u.structure_name} /><InfoRow icon="ri-barcode-line" label="SIRET" value={u.siret} /><InfoRow icon="ri-key-line" label="Code prescripteur" value={u.prescriber_code_used} /></div>}
                  {devs.length > 0 && <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Appareils ({devs.length})</div>{devs.map((dv: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><i className={dv.device_type === 'bracelet' ? 'ri-heart-pulse-line' : dv.device_type === 'scale' ? 'ri-scales-3-line' : 'ri-t-shirt-line'} style={{ fontSize: 12, color: dv.connected ? '#10B981' : 'rgba(255,255,255,0.2)' }} /><span style={{ fontSize: 12, color: '#FFF', flex: 1 }}>{dv.name}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{dv.battery}%</span></div>)}</div>}
                  {guards.length > 0 && <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Gardiens ({guards.length})</div>{guards.map((g: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><span style={{ fontSize: 12, color: '#FFF', flex: 1, fontWeight: 600 }}>{g.name}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.phone}</span></div>)}</div>}
                  {bens.length > 0 && <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Beneficiaires ({bens.length})</div>{bens.map((b: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><span style={{ fontSize: 12, color: '#FFF', flex: 1, fontWeight: 600 }}>{b.name}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{b.phone}</span></div>)}</div>}
                  {als.length > 0 && <div style={{ ...G, padding: '14px', marginBottom: 8 } as any}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Alertes ({als.length})</div>{als.slice(0, 5).map((a: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' } as any}><div style={{ width: 5, height: 5, borderRadius: 3, background: a.status === 'active' ? '#EF4444' : '#10B981' } as any} /><span style={{ fontSize: 11, color: '#FFF', flex: 1 }}>{a.type}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{a.status}</span></div>)}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 } as any}>
                    <div onClick={() => { setSel(null); setDetail(null); }} style={{ flex: 1, padding: '11px', borderRadius: 12, ...G, cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
                    <div onClick={() => { if (window.confirm(`Supprimer ${u.name} ?`)) apiFetch(`/api/admin/user/${u.id}`, { method: 'DELETE' }, token).then(() => { setSel(null); setDetail(null); load(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-delete-bin-line" style={{ fontSize: 12 }} />Supprimer</div>
                  </div>
                </>);
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
