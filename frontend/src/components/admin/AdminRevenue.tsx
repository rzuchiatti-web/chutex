import React from 'react';

const MONTH_LABELS: Record<string, string> = { Jan: 'Jan', Feb: 'Fev', Mar: 'Mar', Apr: 'Avr', May: 'Mai', Jun: 'Juin', Jul: 'Juil', Aug: 'Aout', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dec' };
const formatLabel = (m: string) => { const parts = m.split(' '); return (MONTH_LABELS[parts[0]] || parts[0]) + (parts[1] ? ` ${parts[1]}` : ''); };

export default function AdminRevenue({ data, mob }: { data: any; mob: boolean }) {
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' } as any}><i className="ri-loader-4-line ri-spin" style={{ fontSize: 24 }} /></div>;

  const months = data.revenue_by_month || [];
  const maxMonth = Math.max(...months.map((m: any) => m.total_ht), 1);
  const topPros = data.top_pros || [];
  const payments = data.recent_payments || [];

  return (
    <div data-testid="admin-revenue" style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 } as any}>
        <KPI icon="ri-money-euro-circle-line" label="Revenus Total HT" value={`${data.total_revenue_ht || 0} EUR`} color="#10B981" bg="#ECFDF5" />
        <KPI icon="ri-calendar-check-line" label="Revenus ce mois HT" value={`${data.monthly_revenue_ht || 0} EUR`} color="#3B82F6" bg="#EFF6FF" />
        <KPI icon="ri-group-line" label="Abonnements actifs" value={data.active_subscriptions || 0} color="#7C3AED" bg="#F5F3FF" />
        <KPI icon="ri-file-list-3-line" label="Paiements effectues" value={data.total_payments || 0} color="#F59E0B" bg="#FFFBEB" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 } as any}>
        {/* Revenue Chart */}
        <div className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Revenus HT (6 mois)</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{data.total_revenue_ht || 0} EUR total</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 } as any}>
            {months.map((m: any, i: number) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } as any}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B' }}>{m.total_ht > 0 ? `${m.total_ht}` : ''}</span>
                <div style={{ width: '100%', height: `${Math.max(4, (m.total_ht / maxMonth) * 90)}px`, borderRadius: 6, background: m.total_ht > 0 ? 'linear-gradient(180deg, #10B981, #059669)' : '#E2E8F0', transition: 'height 0.3s ease' } as any} />
                <span style={{ fontSize: 8, color: '#94A3B8', whiteSpace: 'nowrap' }}>{formatLabel(m.month)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Pros */}
        <div className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Top Professionnels</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{topPros.length} pro{topPros.length > 1 ? 's' : ''}</span>
          </div>
          {topPros.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: 12 }}>Aucun professionnel</div>}
          {topPros.map((p: any, i: number) => (
            <div key={p.id} data-testid={`pro-row-${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < topPros.length - 1 ? '1px solid #F1F5F9' : 'none' } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: p.professional_type === 'coach' ? '#FEE2E2' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={p.professional_type === 'coach' ? 'ri-run-line' : 'ri-stethoscope-line'} style={{ fontSize: 15, color: p.professional_type === 'coach' ? '#DC2626' : '#3B82F6' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{p.active_subs} abo. actif{p.active_subs > 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{p.total_ht} EUR</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="adm-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Derniers paiements</span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>{payments.length} affiche{payments.length > 1 ? 's' : ''}</span>
        </div>
        <div style={{ overflowX: 'auto' } as any}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 } as any}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#64748B', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#64748B', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Beneficiaire</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748B', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>HT</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748B', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>TTC</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: '#64748B', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '10px', color: '#475569', whiteSpace: 'nowrap' }}>{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td style={{ padding: '10px', color: '#1E293B', fontWeight: 600 }}>{p.beneficiary_name || p.beneficiary_id?.slice(0, 8) || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#1E293B', fontWeight: 700 }}>{p.amount_ht || 0} EUR</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#64748B' }}>{p.amount_ttc || 0} EUR</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: p.status === 'paid' ? '#ECFDF5' : '#FEF2F2', color: p.status === 'paid' ? '#059669' : '#DC2626' }}>{p.status === 'paid' ? 'Paye' : p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, color, bg }: { icon: string; label: string; value: any; color: string; bg: string }) {
  return (
    <div data-testid={`kpi-${label}`} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
        <i className={icon} style={{ fontSize: 22, color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 } as any}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
