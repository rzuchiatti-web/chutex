import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';

type MainTab = 'dashboard' | 'users' | 'alerts' | 'data' | 'system';
type DataSub = 'subscriptions' | 'prescriptions' | 'saad' | 'rgpd' | 'emails';
type SysSub = 'activation' | 'intervention' | 'shopify' | 'info';
const ROLES: any = { beneficiary: 'Beneficiaire', guardian: 'Gardien', admin: 'Admin', teleassistance: 'Teleassistance', prescriber_company: 'SAAD' };
const RCOL: any = { beneficiary: '#2563EB', guardian: '#059669', admin: '#7C3AED', teleassistance: '#D97706', prescriber_company: '#EA580C' };

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

  const Card = ({ children, ...props }: any) => <div {...props} style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, ...props.style }}>{children}</div>;
  const Badge = ({ color, children }: any) => <span style={{ fontSize: 10, fontWeight: 600, color, padding: '2px 8px', borderRadius: 999, background: `${color}12`, border: `1px solid ${color}25` }}>{children}</span>;
  const Pill = ({ active: a, onClick, children, count }: any) => <div onClick={onClick} style={{ padding: '6px 14px', borderRadius: 8, background: a ? '#7C3AED' : '#F9FAFB', border: `1px solid ${a ? '#7C3AED' : '#E5E7EB'}`, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: a ? '#FFF' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.15s' } as any}>{children}{count != null && <span style={{ fontSize: 9, opacity: 0.7 }}>({count})</span>}</div>;
  const SH = ({ children }: any) => <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3, marginBottom: 12 }}>{children}</div>;

  const Table = ({ headers, rows }: { headers: string[]; rows: any[][] }) => (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFF' } as any}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: mob ? 11 : 12, minWidth: mob ? 480 : 'auto' } as any}>
        <thead><tr style={{ background: '#F9FAFB' } as any}>{headers.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' } as any}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri} style={{ borderBottom: '1px solid #F3F4F6' } as any}>{row.map((cell, ci) => <td key={ci} style={{ padding: '10px 12px', color: '#1F2937', verticalAlign: 'middle' } as any}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  const InfoRow = ({ icon, label, value }: any) => value ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F3F4F6' } as any}>
      <i className={icon} style={{ fontSize: 14, color: '#9CA3AF' }} />
      <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div><div style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{String(value)}</div></div>
    </div>
  ) : null;

  return (
    <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F4F6', overflow: 'hidden' } as any}>

      {/* ══ TOP BAR ══ */}
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

      {/* ══ CONTENT ══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: mob ? 12 : 20, WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: mob ? 8 : 12, marginBottom: 16 } as any}>
            {[
              { v: users.length, l: 'Utilisateurs', i: 'ri-group-line', c: '#2563EB', bg: '#EFF6FF' },
              { v: active.length, l: 'Alertes actives', i: 'ri-alarm-warning-line', c: active.length > 0 ? '#DC2626' : '#059669', bg: active.length > 0 ? '#FEF2F2' : '#ECFDF5' },
              { v: subs.filter((s: any) => s.status === 'active').length, l: 'Abonnes actifs', i: 'ri-vip-crown-line', c: '#7C3AED', bg: '#F5F3FF' },
              { v: ivs.length, l: 'Interventions', i: 'ri-map-pin-range-line', c: '#D97706', bg: '#FFFBEB' },
            ].map((k, i) => (
              <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: mob ? 10 : 14, padding: mob ? 12 : 16 }}>
                <div style={{ width: mob ? 36 : 44, height: mob ? 36 : 44, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={k.i} style={{ fontSize: mob ? 16 : 20, color: k.c }} /></div>
                <div><div style={{ fontSize: mob ? 20 : 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{k.v}</div><div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{k.l}</div></div>
              </Card>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 } as any}>
            <Card><SH>Repartition par role</SH>
              {Object.entries(ROLES).map(([r, l]: any) => { const n = users.filter((u: any) => u.role === r).length; return (
                <div key={r} onClick={() => { setRoleFilter(r); setTab('users'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: RCOL[r] } as any} /><span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{l}</span><span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{n}</span><i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: '#D1D5DB' }} /></div>
              ); })}
            </Card>
            <Card><SH>Inviter un dirigeant SAAD</SH>
              {['Email', 'Nom', 'Structure'].map((p, i) => <input key={i} id={`inv-${i}`} placeholder={p} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 6 } as any} />)}
              <div onClick={async () => { const e = (document.getElementById('inv-0') as HTMLInputElement)?.value; if (!e) return; try { await apiFetch('/api/admin/saad-invitation', { method: 'POST', body: JSON.stringify({ email: e, name: (document.getElementById('inv-1') as HTMLInputElement)?.value, structure_name: (document.getElementById('inv-2') as HTMLInputElement)?.value }) }, token); alert('Invitation envoyee'); load(); } catch (err: any) { alert(err.message); } }} style={{ padding: '10px', borderRadius: 8, background: '#7C3AED', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#FFF' } as any}>Envoyer l'invitation</div>
            </Card>
          </div>
        </>)}

        {/* ── USERS ── */}
        {tab === 'users' && (<>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: mob ? 'wrap' : 'nowrap' } as any}>
            <input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." style={{ flex: 1, minWidth: 180, padding: '10px 14px', borderRadius: 8, background: '#FFF', border: '1px solid #E5E7EB', color: '#111827', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
            <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' } as any}>{filtered.length} resultat(s)</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
            <Pill active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} count={users.length}>Tous</Pill>
            {Object.entries(ROLES).map(([k, l]: any) => <Pill key={k} active={roleFilter === k} onClick={() => setRoleFilter(k)} count={users.filter((u: any) => u.role === k).length}>{l}</Pill>)}
          </div>
          <Table headers={['', 'Nom', 'Telephone', 'Email', 'Role', '']} rows={filtered.map((u: any) => [
            <div style={{ width: 30, height: 30, borderRadius: 999, background: `${RCOL[u.role] || '#6B7280'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: RCOL[u.role] }}>{u.name?.charAt(0)}</span></div>,
            <span style={{ fontWeight: 600, color: '#111827' }}>{u.name}</span>,
            <span style={{ color: '#6B7280' }}>{u.phone}</span>,
            <span style={{ color: '#9CA3AF', fontSize: 11 }}>{u.email || '--'}</span>,
            <Badge color={RCOL[u.role]}>{ROLES[u.role] || u.role}</Badge>,
            <div onClick={() => openUser(u)} style={{ padding: '5px 12px', borderRadius: 6, background: '#F3F4F6', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#374151' } as any}>Voir</div>,
          ])} />
        </>)}

        {/* ── ALERTS ── */}
        {tab === 'alerts' && (<>
          {active.length > 0 && (<div style={{ marginBottom: 16 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>Alertes actives ({active.length})</div>
            <Table headers={['Beneficiaire', 'Type', 'Message', 'Date', 'Statut']} rows={active.map((a: any) => [<span style={{ fontWeight: 600 }}>{a.beneficiary_name}</span>, a.type, <span style={{ fontSize: 11 }}>{a.message?.substring(0, 40)}</span>, a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '', <Badge color="#DC2626">Active</Badge>])} />
          </div>)}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Historique ({alerts.length})</div>
          <Table headers={['Beneficiaire', 'Type', 'Date', 'Statut']} rows={alerts.slice(0, 20).map((a: any) => [a.beneficiary_name, a.type, a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '', <Badge color={a.status === 'active' ? '#DC2626' : '#059669'}>{a.status}</Badge>])} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginTop: 16, marginBottom: 8 }}>Interventions ({ivs.length})</div>
          <Table headers={['Intervenant', 'Beneficiaire', 'Statut']} rows={ivs.slice(0, 15).map((iv: any) => [iv.intervenant_name || 'Intervenant', iv.beneficiary_name || '--', <Badge color="#D97706">{iv.status}</Badge>])} />
        </>)}

        {/* ── DATA ── */}
        {tab === 'data' && (<>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
            {([['subscriptions', 'Abonnements', subs.length], ['prescriptions', 'Prescriptions', prescs.length], ['saad', 'Invitations SAAD', invites.length], ['rgpd', 'RGPD', rgpd.length], ['emails', 'Emails', emails.length]] as any).map(([k, l, n]: any) => <Pill key={k} active={dataSub === k} onClick={() => setDataSub(k)} count={n}>{l}</Pill>)}
          </div>
          {dataSub === 'subscriptions' && (<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}><SH>Abonnements ({subs.length})</SH><div onClick={() => { const ph = prompt('Telephone beneficiaire'); if (ph) apiFetch('/api/admin/subscriptions', { method: 'POST', body: JSON.stringify({ beneficiary_phone: ph, subscription_type: 'care', source: 'admin' }) }, token).then(() => { alert('Cree'); load(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '6px 14px', borderRadius: 6, background: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>+ Creer</div></div>
            <Table headers={['Telephone', 'Type', 'Source', 'Statut', '']} rows={subs.map((s: any) => [s.beneficiary_phone, s.subscription_type, s.source, <Badge color={s.status === 'active' ? '#059669' : '#DC2626'}>{s.status}</Badge>, <div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/subscriptions/${s.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#DC2626' }} /></div>])} />
          </>)}
          {dataSub === 'prescriptions' && <Table headers={['Beneficiaire', 'Prescripteur', 'Statut', 'Date']} rows={prescs.slice(0, 20).map((p: any) => [p.beneficiary_name || p.beneficiary_phone, p.guardian_name || 'Prescripteur', <Badge color={p.status === 'active' ? '#059669' : '#D97706'}>{p.status}</Badge>, p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''])} />}
          {dataSub === 'saad' && <Table headers={['Nom', 'Email', 'Structure', 'Statut', 'Date']} rows={invites.map((inv: any) => [inv.name || '--', inv.email, inv.structure_name, <Badge color={inv.status === 'pending' ? '#D97706' : '#059669'}>{inv.status}</Badge>, inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : ''])} />}
          {dataSub === 'rgpd' && <Table headers={['Utilisateur', 'Email', 'Droit', 'Message', 'Statut', 'Date']} rows={rgpd.map((r: any) => [r.user_name, <span style={{ fontSize: 10 }}>{r.user_email}</span>, r.right_label, <span style={{ fontSize: 10, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' } as any}>{r.message || '--'}</span>, <Badge color={r.status === 'pending' ? '#D97706' : '#059669'}>{r.status}</Badge>, r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''])} />}
          {dataSub === 'emails' && <Table headers={['Destinataire', 'Objet', 'Date']} rows={emails.slice(0, 20).map((e: any) => [e.to, <span style={{ fontSize: 11 }}>{e.subject?.substring(0, 45)}</span>, e.sent_at ? new Date(e.sent_at).toLocaleDateString('fr-FR') : ''])} />}
        </>)}

        {/* ── SYSTEM ── */}
        {tab === 'system' && (<>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
            {([['activation', 'Codes activation', actC.length], ['intervention', 'Codes intervention', ivC.length], ['shopify', 'Shopify', null], ['info', 'Systeme', null]] as any).map(([k, l, n]: any) => <Pill key={k} active={sysSub === k} onClick={() => setSysSub(k)} count={n}>{l}</Pill>)}
          </div>
          {sysSub === 'activation' && (<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}><SH>Codes d'activation ({actC.length})</SH><div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, max_uses: 50 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} style={{ padding: '6px 14px', borderRadius: 6, background: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>+ Ajouter</div></div>
            <Table headers={['Code', 'Structure', 'Utilisations', 'Statut', '']} rows={actC.map((c: any) => [<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</span>, c.structure_name, `${c.uses_count || 0}/${c.max_uses}`, <Badge color={c.active ? '#059669' : '#DC2626'}>{c.active ? 'Actif' : 'Inactif'}</Badge>, <div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => apiFetch(`/api/admin/activation-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 10, fontWeight: 600, color: '#6B7280' } as any}>{c.active ? 'Desactiver' : 'Activer'}</div><div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/activation-codes/${c.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#DC2626' }} /></div></div>])} />
          </>)}
          {sysSub === 'intervention' && (<>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}><SH>Codes intervention ({ivC.length})</SH><div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, default_radius_km: 30 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} style={{ padding: '6px 14px', borderRadius: 6, background: '#D97706', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>+ Ajouter</div></div>
            <Table headers={['Code', 'Structure', 'Rayon', 'Statut', '']} rows={ivC.map((c: any) => [<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</span>, c.structure_name, `${c.default_radius_km} km`, <Badge color={c.active ? '#059669' : '#DC2626'}>{c.active ? 'Actif' : 'Inactif'}</Badge>, <div onClick={() => apiFetch(`/api/admin/intervention-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 10, fontWeight: 600, color: '#6B7280' } as any}>{c.active ? 'Desactiver' : 'Activer'}</div>])} />
          </>)}
          {sysSub === 'shopify' && <Card><SH>Integration Shopify</SH><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}><span style={{ fontSize: 13, color: '#6B7280' }}>Statut : {shop?.connected ? 'Connecte' : 'Non configure'}</span><div onClick={() => apiFetch('/api/admin/shopify/sync', { method: 'POST' }, token).then(() => alert('Sync OK')).catch(() => {})} style={{ padding: '6px 14px', borderRadius: 6, background: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>Synchroniser</div></div></Card>}
          {sysSub === 'info' && <Card><SH>Informations systeme</SH>{[['Version', 'CARE WATCH v3.0'], ['Editeur', 'Chutex Innovation SAS'], ['Contact DPO', 'contact@chutex-innovation.com'], ['Stack', 'FastAPI + MongoDB + Expo'], ['IA', 'GPT-4.1 via Emergent'], ['Utilisateurs', String(users.length)], ['Alertes totales', String(alerts.length)]].map(([l, v], i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' } as any}><span style={{ fontSize: 12, color: '#6B7280' }}>{l}</span><span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{v}</span></div>)}</Card>}
        </>)}

        {/* ══ USER DETAIL ══ */}
        {sel && (
          <div onClick={() => { setSel(null); setDetail(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', justifyContent: 'center' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, margin: '32px auto', padding: mob ? 12 : 20, boxSizing: 'border-box' } as any}>
              <Card style={{ padding: mob ? 16 : 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}><span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Fiche utilisateur</span><div onClick={() => { setSel(null); setDetail(null); }} style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#6B7280' }} /></div></div>
                {detailLoad ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Chargement...</div> : (() => {
                  const u = detail?.user || sel; const guards = detail?.guardians || []; const bens = detail?.beneficiaries || []; const devs = detail?.devices || []; const als = detail?.alerts || []; const sub = detail?.subscription; const c = RCOL[u.role] || '#7C3AED';
                  return (<>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #E5E7EB', marginBottom: 14 } as any}>
                      <div style={{ width: 48, height: 48, borderRadius: 999, background: `${c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${c}30` } as any}><span style={{ fontSize: 20, fontWeight: 800, color: c }}>{u.name?.charAt(0)}</span></div>
                      <div style={{ flex: 1 } as any}><div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{u.name}</div><div style={{ display: 'flex', gap: 6, marginTop: 4 } as any}><Badge color={c}>{ROLES[u.role] || u.role}</Badge>{sub && <Badge color="#7C3AED">Abonne {sub.subscription_type}</Badge>}</div></div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>Identite</div>
                    <InfoRow icon="ri-phone-line" label="Telephone" value={u.phone} /><InfoRow icon="ri-mail-line" label="Email" value={u.email} /><InfoRow icon="ri-map-pin-line" label="Adresse" value={u.address} /><InfoRow icon="ri-calendar-line" label="Naissance" value={u.date_of_birth} /><InfoRow icon="ri-user-line" label="Genre" value={u.gender} /><InfoRow icon="ri-id-card-line" label="ID" value={u.id} /><InfoRow icon="ri-time-line" label="Inscription" value={u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                    {u.role === 'beneficiary' && (<><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Medical</div><InfoRow icon="ri-drop-line" label="Sang" value={u.blood_type} /><InfoRow icon="ri-heart-pulse-line" label="Pathologies" value={u.medical_conditions} /><InfoRow icon="ri-alert-line" label="Allergies" value={u.allergies} /><InfoRow icon="ri-stethoscope-line" label="Medecin" value={u.doctor_name} /><InfoRow icon="ri-ruler-line" label="Taille" value={u.height_cm ? `${u.height_cm} cm` : null} /><InfoRow icon="ri-scales-3-line" label="Poids" value={u.weight_kg ? `${u.weight_kg} kg` : null} /><InfoRow icon="ri-phone-line" label="Urgence" value={u.emergency_contact_name ? `${u.emergency_contact_name} (${u.emergency_contact_phone})` : null} /></>)}
                    {(u.role === 'guardian' || u.role === 'prescriber_company') && (<><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>{u.role === 'guardian' ? 'Gardien' : 'SAAD'}</div><InfoRow icon="ri-shield-line" label="Type" value={u.guardian_type} /><InfoRow icon="ri-heart-line" label="Lien" value={u.relationship} /><InfoRow icon="ri-building-line" label="Structure" value={u.structure_name} /><InfoRow icon="ri-barcode-line" label="SIRET" value={u.siret} /><InfoRow icon="ri-key-line" label="Code" value={u.prescriber_code_used} /></>)}
                    {devs.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Appareils ({devs.length})</div>{devs.map((dv: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><i className={dv.device_type === 'bracelet' ? 'ri-heart-pulse-line' : dv.device_type === 'scale' ? 'ri-scales-3-line' : 'ri-t-shirt-line'} style={{ fontSize: 14, color: dv.connected ? '#059669' : '#D1D5DB' }} /><span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{dv.name}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>{dv.battery}%</span></div>)}</>)}
                    {guards.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Gardiens ({guards.length})</div>{guards.map((g: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><span style={{ fontSize: 12, color: '#111827', flex: 1, fontWeight: 600 }}>{g.name}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>{g.phone}</span></div>)}</>)}
                    {bens.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Beneficiaires ({bens.length})</div>{bens.map((b: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><span style={{ fontSize: 12, color: '#111827', flex: 1, fontWeight: 600 }}>{b.name}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>{b.phone}</span></div>)}</>)}
                    {als.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Alertes ({als.length})</div>{als.slice(0, 5).map((a: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: a.status === 'active' ? '#DC2626' : '#059669' } as any} /><span style={{ fontSize: 11, color: '#374151', flex: 1 }}>{a.type}</span><span style={{ fontSize: 9, color: '#9CA3AF' }}>{a.status}</span></div>)}</>)}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 } as any}>
                      <div onClick={() => { setSel(null); setDetail(null); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#374151' } as any}>Fermer</div>
                      <div onClick={() => { if (window.confirm(`Supprimer ${u.name} ?`)) apiFetch(`/api/admin/user/${u.id}`, { method: 'DELETE' }, token).then(() => { setSel(null); setDetail(null); load(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '10px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-delete-bin-line" style={{ fontSize: 12 }} />Supprimer</div>
                    </div>
                  </>);
                })()}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
