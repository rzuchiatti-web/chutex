import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Correlation {
  metric_a: string;
  metric_b: string;
  label: string;
  r: number;
  strength: string;
  strength_icon: string;
  direction: string;
  impact_pct: number;
  insight: string;
  data_points: number;
  category: string;
}

interface CorrelationsData {
  correlations: Correlation[];
  insights: string[];
  data_points: number;
  period_days: number;
  total_readings: number;
  no_data: boolean;
  message?: string;
}

const STRENGTH_COLORS: Record<string, string> = {
  faible: '#6B7280',
  moderee: '#F59E0B',
  forte: '#10B981',
  tres_forte: '#22D3EE',
};

const DIRECTION_ICONS: Record<string, { icon: string; color: string }> = {
  positive: { icon: 'ri-arrow-up-line', color: '#10B981' },
  negative: { icon: 'ri-arrow-down-line', color: '#F59E0B' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'cardio-sommeil': '#A78BFA',
  'cardio-stress': '#EF4444',
  'cardio': '#EF4444',
  'sommeil-stress': '#818CF8',
  'sommeil-activite': '#8B5CF6',
  'sommeil-metabolisme': '#C084FC',
  'sommeil': '#A78BFA',
  'activite-cardio': '#34D399',
  'activite-stress': '#10B981',
  'activite-metabolisme': '#6EE7B7',
  'activite': '#10B981',
  'composition-cardio': '#FB923C',
  'composition-activite': '#F97316',
  'composition': '#F97316',
};

export default function CorrelationsCard() {
  const { token } = useAuth();
  const [data, setData] = useState<CorrelationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    apiFetch('/api/health/correlations', {}, token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div data-testid="correlations-loading" style={{ borderRadius: 18, background: '#272a30', padding: '20px 16px', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
          <i className="ri-links-line" style={{ fontSize: 16, color: '#22D3EE' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Correlations</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' } as any}>
          <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#22D3EE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } as any} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || data.no_data) {
    return (
      <div data-testid="correlations-no-data" style={{ borderRadius: 18, background: '#272a30', padding: '20px 16px', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
          <i className="ri-links-line" style={{ fontSize: 16, color: '#22D3EE' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Correlations</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          {data?.message || 'Portez vos appareils quelques jours pour decouvrir les liens entre vos metriques.'}
        </div>
      </div>
    );
  }

  const { correlations, insights, period_days } = data;
  const visible = expanded ? correlations : correlations.slice(0, 4);

  return (
    <div data-testid="correlations-card" style={{ borderRadius: 18, background: '#272a30', overflow: 'hidden', marginBottom: 14 } as any}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-links-line" style={{ fontSize: 14, color: '#22D3EE' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Correlations sante</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{period_days} jours d'analyse</div>
            </div>
          </div>
          <div style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' } as any}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#22D3EE' }}>{correlations.length} liens</span>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div style={{ padding: '12px 16px 0' } as any}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
            {insights.map((insight, i) => (
              <div key={i} data-testid={`correlation-insight-${i}`} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 12px', borderRadius: 12,
                background: i === 0
                  ? 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(167,139,250,0.06) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: i === 0 ? '1px solid rgba(34,211,238,0.15)' : '1px solid rgba(255,255,255,0.04)',
              } as any}>
                <i className={i === 0 ? 'ri-lightbulb-flash-line' : 'ri-arrow-right-s-line'}
                  style={{ fontSize: 12, color: i === 0 ? '#22D3EE' : 'rgba(255,255,255,0.25)', marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Bars */}
      <div style={{ padding: '14px 16px 6px' } as any}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
          {visible.map((corr, i) => {
            const barColor = CATEGORY_COLORS[corr.category] || STRENGTH_COLORS[corr.strength] || '#6B7280';
            const dir = DIRECTION_ICONS[corr.direction] || DIRECTION_ICONS.positive;
            const barWidth = Math.max(12, corr.impact_pct);

            return (
              <div key={i} data-testid={`correlation-item-${i}`}
                style={{
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.15s',
                } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 } as any}>
                    <i className={dir.icon} style={{ fontSize: 10, color: dir.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{corr.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 } as any}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: barColor }}>{corr.impact_pct}%</span>
                  </div>
                </div>
                {/* Bar */}
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`,
                    transition: 'width 0.6s ease-out',
                  } as any} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 } as any}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'capitalize' } as any}>{corr.strength.replace('_', ' ')}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>{corr.data_points} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse */}
      {correlations.length > 4 && (
        <div data-testid="correlations-toggle"
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.15)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
            cursor: 'pointer', transition: 'background 0.15s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: '#22D3EE' }}>
            {expanded ? 'Voir moins' : `Voir les ${correlations.length - 4} autres`}
          </span>
          <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 12, color: '#22D3EE' }} />
        </div>
      )}
    </div>
  );
}
