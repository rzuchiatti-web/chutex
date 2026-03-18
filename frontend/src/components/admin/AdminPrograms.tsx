import React from 'react';

export default function AdminPrograms({ programs, token, mob }: any) {
  const active = programs.filter((p: any) => p.status === 'active');
  const completed = programs.filter((p: any) => p.status === 'completed');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 24 } as any}>
        <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-flag-line" style={{ fontSize: 19, color: '#3B82F6' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{programs.length}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Total inscriptions</div></div>
        </div>
        <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-play-circle-line" style={{ fontSize: 19, color: '#10B981' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{active.length}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>En cours</div></div>
        </div>
        <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-check-double-line" style={{ fontSize: 19, color: '#7C3AED' }} /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{completed.length}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Termines</div></div>
        </div>
      </div>

      {programs.length === 0 ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
          <i className="ri-flag-line" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.4 }} />
          Aucune inscription programme
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 600 : 'auto' } as any}>
              <thead><tr><th>Programme</th><th>Utilisateur</th><th>Mode</th><th>Progression</th><th>Statut</th><th>Date debut</th></tr></thead>
              <tbody>
                {programs.slice(0, 30).map((p: any, i: number) => {
                  const sc: any = { active: ['#10B981', '#F0FDF4'], completed: ['#7C3AED', '#F5F3FF'], abandoned: ['#94A3B8', '#F8FAFC'] };
                  const [c, bg] = sc[p.status] || ['#64748B', '#F8FAFC'];
                  const pct = p.duration_days > 0 ? Math.min(100, Math.round((p.current_day || 0) / p.duration_days * 100)) : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.program_title || p.program_id}</td>
                      <td style={{ color: '#64748B' }}>{p.user_name || p.user_id?.substring(0, 8)}</td>
                      <td><span className="adm-badge" style={{ background: p.mode === 'solo' ? '#F8FAFC' : '#EFF6FF', color: p.mode === 'solo' ? '#64748B' : '#3B82F6' }}>{p.mode || 'solo'}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' } as any}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: c, transition: 'width 0.5s' } as any} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', minWidth: 30 }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span className="adm-badge" style={{ background: bg, color: c }}>{p.status}</span></td>
                      <td style={{ fontSize: 12, color: '#94A3B8' }}>{p.started_at ? new Date(p.started_at).toLocaleDateString('fr-FR') : ''}</td>
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
