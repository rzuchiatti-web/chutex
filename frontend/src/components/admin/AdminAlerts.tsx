import React, { useState } from 'react';

export default function AdminAlerts({ alerts, active, ivs, analytics, token, mob }: any) {
  const [view, setView] = useState<'active' | 'history' | 'interventions'>('active');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 20 } as any}>
        {[
          { v: active.length, l: 'Alertes actives', c: '#EF4444', bg: '#FEF2F2', i: 'ri-alarm-warning-fill' },
          { v: alerts.length, l: 'Total alertes', c: '#64748B', bg: '#F8FAFC', i: 'ri-history-line' },
          { v: ivs.length, l: 'Interventions', c: '#F59E0B', bg: '#FFFBEB', i: 'ri-map-pin-range-line' },
          { v: `${analytics?.resolution_rate || 0}%`, l: 'Taux resolution', c: '#10B981', bg: '#F0FDF4', i: 'ri-check-double-line' },
        ].map((k, i) => (
          <div key={i} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={k.i} style={{ fontSize: 19, color: k.c }} /></div>
            <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{k.v}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{k.l}</div></div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 } as any}>
        {([['active', 'Actives', active.length], ['history', 'Historique', alerts.length], ['interventions', 'Interventions', ivs.length]] as any).map(([k, l, n]: any) => (
          <div key={k} onClick={() => setView(k)} style={{
            padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: view === k ? '#7C3AED' : '#FFF', color: view === k ? '#FFF' : '#64748B',
            border: `1.5px solid ${view === k ? '#7C3AED' : '#E2E8F0'}`, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          } as any}>{l} <span style={{ opacity: 0.7, fontSize: 10 }}>({n})</span></div>
        ))}
      </div>

      {/* Active alerts */}
      {view === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
          {active.length === 0 && <div className="adm-card" style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Aucune alerte active</div>}
          {active.map((a: any, i: number) => (
            <div key={i} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #EF4444' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={a.type === 'sos' ? 'ri-phone-line' : a.type === 'fall' ? 'ri-arrow-down-circle-line' : 'ri-alert-line'} style={{ fontSize: 19, color: '#EF4444' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{a.beneficiary_name || 'Beneficiaire'}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{a.message || a.type}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                <span className="adm-badge" style={{ background: '#FEF2F2', color: '#EF4444' }}>{a.type?.toUpperCase()}</span>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {view === 'history' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 600 : 'auto' } as any}>
              <thead><tr><th>Beneficiaire</th><th>Type</th><th>Message</th><th>Date</th><th>Statut</th></tr></thead>
              <tbody>
                {alerts.slice(0, 30).map((a: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.beneficiary_name}</td>
                    <td><span className="adm-badge" style={{ background: a.type === 'sos' ? '#FEF2F2' : '#FFF7ED', color: a.type === 'sos' ? '#EF4444' : '#F59E0B' }}>{a.type}</span></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{a.message}</td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}</td>
                    <td><span className="adm-badge" style={{ background: a.status === 'active' ? '#FEF2F2' : '#F0FDF4', color: a.status === 'active' ? '#EF4444' : '#10B981' }}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interventions */}
      {view === 'interventions' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 600 : 'auto' } as any}>
              <thead><tr><th>Intervenant</th><th>Beneficiaire</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {ivs.slice(0, 30).map((iv: any, i: number) => {
                  const sc: any = { pending_acceptance: ['#F59E0B', '#FFFBEB'], en_route: ['#3B82F6', '#EFF6FF'], completed: ['#10B981', '#F0FDF4'], cancelled: ['#94A3B8', '#F8FAFC'] };
                  const [c, bg] = sc[iv.status] || ['#64748B', '#F8FAFC'];
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{iv.intervenant_name || iv.assigned_name || 'Intervenant'}</td>
                      <td>{iv.beneficiary_name || '--'}</td>
                      <td><span className="adm-badge" style={{ background: bg, color: c }}>{iv.status}</span></td>
                      <td style={{ fontSize: 12, color: '#94A3B8' }}>{iv.created_at ? new Date(iv.created_at).toLocaleDateString('fr-FR') : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
