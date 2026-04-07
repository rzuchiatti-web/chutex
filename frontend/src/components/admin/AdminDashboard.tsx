import { useI18n } from '../../context/I18nContext';
import React from 'react';

const RCOL: any = { beneficiary: '#3B82F6', guardian: '#10B981', admin: '#7C3AED', téléassistance: '#F59E0B', prescriber_company: '#F97316' };
const RLAB: any = { beneficiary: 'Bénéficiaire', guardian: 'Gardien', admin: 'Admin', teleassistance: 'Téléassistance', prescriber_company: 'SAAD' };

function KPI({ icon, label, value, color, bg, sub, onClick }: any) {
  return (
    <div data-testid={`kpi-${label}`} onClick={onClick} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: onClick ? 'pointer' : 'default' } as any}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
        <i className={icon} style={{ fontSize: 22, color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 } as any}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{label}</div>
      </div>
      {sub && <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textAlign: 'right' } as any}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 } as any}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } as any}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B' }}>{d.value}</span>
          <div style={{ width: '100%', height: `${Math.max(4, (d.value / max) * 60)}px`, borderRadius: 4, background: color, opacity: 0.8, transition: 'height 0.3s ease' } as any} />
          <span style={{ fontSize: 8, color: '#94A3B8', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ users, active, subs, ivs, kpi, analytics, token, load, mob, setPage }: any) {
  const alertsByDay = (kpi?.alerts_by_day || []).map((d: any) => ({
    label: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    value: d.count,
  }));
  const ivsByMonth = (analytics?.interventions_by_month || []).map((d: any) => ({ label: d.month?.replace(' 20', '\n'), value: d.count }));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 } as any}>
        <KPI icon="ri-group-line" label="Utilisateurs" value={users.length} color="#3B82F6" bg="#EFF6FF" onClick={() => setPage('users')} />
        <KPI icon="ri-alarm-warning-line" label="Alertes actives" value={active.length} color={active.length > 0 ? '#EF4444' : '#10B981'} bg={active.length > 0 ? '#FEF2F2' : '#ECFDF5'} onClick={() => setPage('alerts')} />
        <KPI icon="ri-vip-crown-line" label="Abonnes actifs" value={kpi?.active_subscriptions || subs.filter((s: any) => s.status === 'active').length} color="#7C3AED" bg="#F5F3FF" onClick={() => setPage('subscriptions')} />
        <KPI icon="ri-map-pin-range-line" label="Interventions" value={ivs.length} color="#F59E0B" bg="#FFFBEB" sub={analytics?.avg_intervention_time_min ? `Moy. ${analytics.avg_intervention_time_min} min` : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 } as any}>
        {/* Alerts chart */}
        <div className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Alertes (7 jours)</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{kpi?.total_alerts || 0} total</span>
          </div>
          <MiniBar data={alertsByDay} color="#EF4444" />
        </div>

        {/* Interventions chart */}
        <div className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Interventions (6 mois)</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>Taux resolution: {analytics?.resolution_rate || 0}%</span>
          </div>
          <MiniBar data={ivsByMonth} color="#F59E0B" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16 } as any}>
        {/* Users by role */}
        <div className="adm-card">
          <div className="adm-section-title">Repartition par role</div>
          {Object.entries(RLAB).map(([r, l]: any) => {
            const n = users.filter((u: any) => u.role === r).length;
            const pct = users.length > 0 ? Math.round((n / users.length) * 100) : 0;
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' } as any}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: RCOL[r], flexShrink: 0 } as any} />
                <span style={{ flex: 1, fontSize: 13, color: '#475569', fontWeight: 500 }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', minWidth: 24, textAlign: 'right' }}>{n}</span>
                <div style={{ width: 60, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' } as any}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: RCOL[r], transition: 'width 0.5s ease' } as any} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert types */}
        <div className="adm-card">
          <div className="adm-section-title">Types d'alertes</div>
          {Object.entries(kpi?.alert_types || {}).map(([type, count]: any) => {
            const icons: any = { sos: 'ri-phone-line', fall: 'ri-arrow-down-circle-line', anomaly: 'ri-error-warning-line', inactivity: 'ri-zzz-line' };
            const labels: any = { sos: 'SOS', fall: 'Chute', anomaly: 'Anomalie', inactivity: 'Inactivité' };
            const colors: any = { sos: '#EF4444', fall: '#F97316', anomaly: '#F59E0B', inactivity: '#6366F1' };
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' } as any}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${colors[type]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={icons[type] || 'ri-alert-line'} style={{ fontSize: 15, color: colors[type] }} />
                </div>
                <span style={{ flex: 1, fontSize: 13, color: '#475569', fontWeight: 500 }}>{labels[type] || type}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>{count}</span>
              </div>
            );
          })}
          {analytics?.avg_resolution_minutes > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0' } as any}>
              <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Temps moyen de resolution</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>{kpi?.avg_resolution_minutes || 0} <span style={{ fontSize: 12, fontWeight: 500 }}>min</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
