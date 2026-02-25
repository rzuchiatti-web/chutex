import React from 'react';
import { Card, ROLES, RCOL, SH } from './AdminUI';
import { apiFetch } from '../../services/api';

export default function DashboardTab({ users, active, subs, ivs, token, load, setRoleFilter, setTab, mob }: any) {
  return (
    <>
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
    </>
  );
}
