import React from 'react';
import { Card, Table, Badge, Pill, SH } from './AdminUI';
import { apiFetch } from '../../services/api';

export default function SystemTab({ sysSub, setSysSub, actC, ivC, shop, users, alerts, token, load, mob }: any) {
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
        {([['activation', 'Codes activation', actC.length], ['intervention', 'Codes intervention', ivC.length], ['shopify', 'Shopify', null], ['info', 'Systeme', null]] as any).map(([k, l, n]: any) => <Pill key={k} active={sysSub === k} onClick={() => setSysSub(k)} count={n}>{l}</Pill>)}
      </div>
      {sysSub === 'activation' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
            <SH>Codes d'activation ({actC.length})</SH>
            <div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, max_uses: 50 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} style={{ padding: '6px 14px', borderRadius: 6, background: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>+ Ajouter</div>
          </div>
          <Table mob={mob} headers={['Code', 'Structure', 'Utilisations', 'Statut', '']} rows={actC.map((c: any) => [<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</span>, c.structure_name, `${c.uses_count || 0}/${c.max_uses}`, <Badge color={c.active ? '#059669' : '#DC2626'}>{c.active ? 'Actif' : 'Inactif'}</Badge>, <div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => apiFetch(`/api/admin/activation-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 10, fontWeight: 600, color: '#6B7280' } as any}>{c.active ? 'Desactiver' : 'Activer'}</div><div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/activation-codes/${c.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#DC2626' }} /></div></div>])} />
        </>
      )}
      {sysSub === 'intervention' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
            <SH>Codes intervention ({ivC.length})</SH>
            <div onClick={() => { const c = prompt('Code'); const s = prompt('Structure'); if (c && s) apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, default_radius_km: 30 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} style={{ padding: '6px 14px', borderRadius: 6, background: '#D97706', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>+ Ajouter</div>
          </div>
          <Table mob={mob} headers={['Code', 'Structure', 'Rayon', 'Statut', '']} rows={ivC.map((c: any) => [<span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</span>, c.structure_name, `${c.default_radius_km} km`, <Badge color={c.active ? '#059669' : '#DC2626'}>{c.active ? 'Actif' : 'Inactif'}</Badge>, <div onClick={() => apiFetch(`/api/admin/intervention-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 10, fontWeight: 600, color: '#6B7280' } as any}>{c.active ? 'Desactiver' : 'Activer'}</div>])} />
        </>
      )}
      {sysSub === 'shopify' && <Card><SH>Integration Shopify</SH><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}><span style={{ fontSize: 13, color: '#6B7280' }}>Statut : {shop?.connected ? 'Connecte' : 'Non configure'}</span><div onClick={() => apiFetch('/api/admin/shopify/sync', { method: 'POST' }, token).then(() => alert('Sync OK')).catch(() => {})} style={{ padding: '6px 14px', borderRadius: 6, background: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>Synchroniser</div></div></Card>}
      {sysSub === 'info' && <Card><SH>Informations systeme</SH>{[['Version', 'CARE WATCH v3.0'], ['Editeur', 'Chutex Innovation SAS'], ['Contact DPO', 'contact@chutex-innovation.com'], ['Stack', 'FastAPI + MongoDB + Expo'], ['IA', 'GPT-4.1 via Emergent'], ['Utilisateurs', String(users.length)], ['Alertes totales', String(alerts.length)]].map(([l, v], i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' } as any}><span style={{ fontSize: 12, color: '#6B7280' }}>{l}</span><span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{v}</span></div>)}</Card>}
    </>
  );
}
