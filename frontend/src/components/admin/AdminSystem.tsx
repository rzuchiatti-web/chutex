import React, { useState } from 'react';
import { apiFetch } from '../../services/api';

export default function AdminSystem({ actC, ivC, shop, users, alerts, token, load, mob }: any) {
  const [tab, setTab] = useState<'activation' | 'intervention' | 'shopify' | 'info'>('activation');

  const tabs = [
    { key: 'activation', label: 'Codes activation', count: actC.length, icon: 'ri-key-2-line' },
    { key: 'intervention', label: 'Codes intervention', count: ivC.length, icon: 'ri-map-pin-range-line' },
    { key: 'shopify', label: 'Shopify', count: null, icon: 'ri-shopping-bag-line' },
    { key: 'info', label: 'Système', count: null, icon: 'ri-information-line' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as any}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === t.key ? '#7C3AED' : '#FFF', color: tab === t.key ? '#FFF' : '#64748B',
            border: `1.5px solid ${tab === t.key ? '#7C3AED' : '#E2E8F0'}`, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          } as any}>
            <i className={t.icon} style={{ fontSize: 14 }} />{t.label} {t.count != null && <span style={{ opacity: 0.7, fontSize: 10 }}>({t.count})</span>}
          </div>
        ))}
      </div>

      {tab === 'activation' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Codes d'activation ({actC.length})</span>
            <div onClick={() => { const c = prompt('Code'); const s = prompt(t('structure')); if (c && s) apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, max_uses: 50 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} className="adm-btn" style={{ background: '#7C3AED', color: '#FFF' }}>
              <i className="ri-add-line" style={{ fontSize: 14 }} />Ajouter
            </div>
          </div>
          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' } as any}>
              <table className="adm-table" style={{ minWidth: mob ? 500 : 'auto' } as any}>
                <thead><tr><th>Code</th><th>Structure</th><th>Utilisations</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {actC.map((c: any, i: number) => (
                    <tr key={i}>
                      <td><code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: 6 }}>{c.code}</code></td>
                      <td>{c.structure_name}</td>
                      <td><span style={{ fontWeight: 700 }}>{c.uses_count || 0}</span> / {c.max_uses}</td>
                      <td><span className="adm-badge" style={{ background: c.active ? '#F0FDF4' : '#FEF2F2', color: c.active ? '#10B981' : '#EF4444' }}>{c.active ? 'Actif' : 'Inactif'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 } as any}>
                          <div onClick={() => apiFetch(`/api/admin/activation-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} className="adm-btn" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 10px', fontSize: 10 }}>{c.active ? 'Désactivér' : 'Activer'}</div>
                          <div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/activation-codes/${c.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 15, color: '#EF4444' }} /></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'intervention' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Codes intervention ({ivC.length})</span>
            <div onClick={() => { const c = prompt('Code'); const s = prompt(t('structure')); if (c && s) apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ code: c, structure_name: s, default_radius_km: 30 }) }, token).then(() => load()).catch((e: any) => alert(e.message)); }} className="adm-btn" style={{ background: '#F59E0B', color: '#FFF' }}>
              <i className="ri-add-line" style={{ fontSize: 14 }} />Ajouter
            </div>
          </div>
          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' } as any}>
              <table className="adm-table" style={{ minWidth: mob ? 500 : 'auto' } as any}>
                <thead><tr><th>Code</th><th>Structure</th><th>Rayon</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {ivC.map((c: any, i: number) => (
                    <tr key={i}>
                      <td><code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#F59E0B', background: '#FFFBEB', padding: '2px 8px', borderRadius: 6 }}>{c.code}</code></td>
                      <td>{c.structure_name}</td>
                      <td>{c.default_radius_km} km</td>
                      <td><span className="adm-badge" style={{ background: c.active ? '#F0FDF4' : '#FEF2F2', color: c.active ? '#10B981' : '#EF4444' }}>{c.active ? 'Actif' : 'Inactif'}</span></td>
                      <td>
                        <div onClick={() => apiFetch(`/api/admin/intervention-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => load())} className="adm-btn" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 10px', fontSize: 10 }}>{c.active ? 'Désactivér' : 'Activer'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'shopify' && (
        <div className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Integration Shopify</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Statut : {shop?.connected ? t('connected') : 'Non configure'}</div>
            </div>
            <div onClick={() => apiFetch('/api/admin/shopify/sync', { method: 'POST' }, token).then(() => alert('Synchronisation OK')).catch(() => {})} className="adm-btn" style={{ background: '#10B981', color: '#FFF' }}>
              <i className="ri-refresh-line" style={{ fontSize: 14 }} />Synchroniser
            </div>
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="adm-card">
          <div className="adm-section-title">Informations système</div>
          {[
            ['Version', 'CARE WATCH v3.0'],
            ['Editeur', 'Chutex Innovation SAS'],
            ['Contact DPO', 'contact@chutex-innovation.com'],
            ['Stack', 'FastAPI + MongoDB + Expo'],
            ['IA', 'GPT-5.2 via Emergent + ML Glycémie V3'],
            ['ML Model', 'GradientBoostingRegressor (scikit-learn)'],
            ['Utilisateurs', String(users.length)],
            ['Alertes totales', String(alerts.length)],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' } as any}>
              <span style={{ fontSize: 13, color: '#64748B' }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
