import React from 'react';

export default function AdminHealth({ data, token, mob }: any) {
  const bens = data?.beneficiaries || [];

  const zones: any = { normale: { c: '#10B981', bg: '#F0FDF4' }, normale_haute: { c: '#84CC16', bg: '#F7FEE7' }, vigilance: { c: '#F59E0B', bg: '#FFFBEB' }, pre_alerte: { c: '#F97316', bg: '#FFF7ED' }, alerte: { c: '#EF4444', bg: '#FEF2F2' } };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr 1fr', gap: 14, marginBottom: 24 } as any}>
        <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-user-heart-line" style={{ fontSize: 19, color: '#3B82F6' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{bens.length}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Beneficiaires suivis</div></div>
        </div>
        <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 19, color: '#10B981' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{bens.filter((b: any) => b.latest_reading).length}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Avec donnees recentes</div></div>
        </div>
        <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-flask-line" style={{ fontSize: 19, color: '#7C3AED' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{bens.filter((b: any) => b.latest_glycemia).length}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Estimation glycemie</div></div>
        </div>
      </div>

      {bens.length === 0 ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
          <i className="ri-heart-pulse-line" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.4 }} />
          Aucun beneficiaire
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 700 : 'auto' } as any}>
              <thead><tr><th>Beneficiaire</th><th>FC</th><th>HRV</th><th>SpO2</th><th>Pas</th><th>Glycemie</th><th>Zone</th><th>Confiance</th></tr></thead>
              <tbody>
                {bens.map((b: any, i: number) => {
                  const r = b.latest_reading?.data || {};
                  const g = b.latest_glycemia;
                  const z = g?.zone || '';
                  const zs = zones[z] || { c: '#94A3B8', bg: '#F8FAFC' };
                  return (
                    <tr key={i}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><div style={{ width: 32, height: 32, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>{b.name?.charAt(0)}</span></div><div><div style={{ fontWeight: 600, color: '#1E293B', fontSize: 13 }}>{b.name}</div><div style={{ fontSize: 10, color: '#94A3B8' }}>{b.phone}</div></div></div></td>
                      <td>{r.heart_rate ? <span style={{ fontWeight: 600 }}>{r.heart_rate} <span style={{ fontSize: 10, color: '#94A3B8' }}>bpm</span></span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
                      <td>{r.hrv ? <span style={{ fontWeight: 600 }}>{r.hrv} <span style={{ fontSize: 10, color: '#94A3B8' }}>ms</span></span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
                      <td>{r.spo2 ? <span style={{ fontWeight: 600, color: r.spo2 < 95 ? '#EF4444' : '#1E293B' }}>{r.spo2}%</span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
                      <td>{r.steps != null ? <span style={{ fontWeight: 600 }}>{r.steps?.toLocaleString()}</span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
                      <td>{g?.estimated_glycemia ? <span style={{ fontWeight: 700, color: zs.c }}>{g.estimated_glycemia.toFixed(2)} <span style={{ fontSize: 10 }}>g/L</span></span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
                      <td>{z ? <span className="adm-badge" style={{ background: zs.bg, color: zs.c }}>{z.replace('_', ' ')}</span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
                      <td>{g?.confidence_pct != null ? <span style={{ fontWeight: 600 }}>{g.confidence_pct}%</span> : <span style={{ color: '#CBD5E1' }}>--</span>}</td>
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
