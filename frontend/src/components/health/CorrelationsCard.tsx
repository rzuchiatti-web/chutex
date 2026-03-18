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

interface Trend {
  pair_key: string;
  label: string;
  category: string;
  sparkline: (number | null)[];
  current_strength: number;
  delta_pct: number;
  direction: string;
  direction_label: string;
  direction_color: string;
  weeks_tracked: number;
}

interface TrendsData {
  trends: Trend[];
  weeks: number;
  week_labels: string[];
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

const TREND_DIRECTION_ICONS: Record<string, string> = {
  up: 'ri-arrow-up-line',
  down: 'ri-arrow-down-line',
  stable: 'ri-subtract-line',
};

/* Mini SVG Sparkline */
function Sparkline({ data, color, width = 56, height = 20 }: { data: (number | null)[]; color: string; width?: number; height?: number }) {
  const valid = data.filter((v): v is number => v !== null);
  if (valid.length < 2) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 0.1;
  const pad = 2;
  const points = data.map((v, i) => {
    if (v === null) return null;
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return { x, y };
  }).filter(Boolean) as { x: number; y: number }[];

  if (points.length < 2) return null;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0 }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* Dot on last point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

export default function CorrelationsCard() {
  const { token } = useAuth();
  const [data, setData] = useState<CorrelationsData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'now' | 'trends'>('now');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/health/correlations', {}, token).catch(() => null),
      apiFetch('/api/health/correlations/trends', {}, token).catch(() => null),
    ]).then(([c, t]) => {
      setData(c);
      setTrends(t);
    }).finally(() => setLoading(false));
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
  const hasTrends = trends && !trends.no_data && trends.trends.length > 0;

  return (
    <div data-testid="correlations-card" style={{ borderRadius: 18, background: '#272a30', overflow: 'hidden', marginBottom: 14 } as any}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasTrends ? 10 : 4 } as any}>
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

        {/* Tab switcher — only if trends available */}
        {hasTrends && (
          <div data-testid="correlations-tabs" style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 10, background: 'rgba(0,0,0,0.2)' } as any}>
            {[
              { key: 'now' as const, label: 'Actuelles', icon: 'ri-links-line' },
              { key: 'trends' as const, label: 'Tendances', icon: 'ri-line-chart-line' },
            ].map(t => (
              <div key={t.key} data-testid={`tab-${t.key}`}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t.key ? 'rgba(34,211,238,0.12)' : 'transparent',
                  border: tab === t.key ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                } as any}
              >
                <i className={t.icon} style={{ fontSize: 10, color: tab === t.key ? '#22D3EE' : 'rgba(255,255,255,0.3)', marginRight: 4 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.key ? '#22D3EE' : 'rgba(255,255,255,0.35)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ TAB: Actuelles ═══ */}
      {tab === 'now' && (
        <>
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
                    style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 } as any}>
                        <i className={dir.icon} style={{ fontSize: 10, color: dir.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{corr.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: barColor, flexShrink: 0, marginLeft: 8 }}>{corr.impact_pct}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${barWidth}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`, transition: 'width 0.6s ease-out' } as any} />
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
            <div data-testid="correlations-toggle" onClick={() => setExpanded(!expanded)}
              style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22D3EE' }}>
                {expanded ? 'Voir moins' : `Voir les ${correlations.length - 4} autres`}
              </span>
              <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 12, color: '#22D3EE' }} />
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: Tendances ═══ */}
      {tab === 'trends' && hasTrends && (
        <div style={{ padding: '14px 16px 10px' } as any}>
          {/* Week labels */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 10, paddingRight: 4 } as any}>
            {trends!.week_labels.map((wl, i) => (
              <span key={i} style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', width: `${56 / trends!.week_labels.length}px`, textAlign: 'center' } as any}>{wl}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
            {trends!.trends.map((trend, i) => {
              const catColor = CATEGORY_COLORS[trend.category] || '#6B7280';
              const dirIcon = TREND_DIRECTION_ICONS[trend.direction] || 'ri-subtract-line';
              return (
                <div key={i} data-testid={`trend-item-${i}`}
                  style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    {/* Left: label + badge */}
                    <div style={{ flex: 1, minWidth: 0 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 } as any}>
                        {trend.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        {/* Direction badge */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '2px 7px', borderRadius: 999,
                          background: `${trend.direction_color}15`,
                          border: `1px solid ${trend.direction_color}30`,
                        } as any}>
                          <i className={dirIcon} style={{ fontSize: 9, color: trend.direction_color }} />
                          <span style={{ fontSize: 8, fontWeight: 700, color: trend.direction_color }}>
                            {trend.direction_label}
                          </span>
                        </div>
                        {/* Delta */}
                        <span style={{ fontSize: 9, fontWeight: 800, color: trend.direction_color }}>
                          {trend.delta_pct > 0 ? '+' : ''}{trend.delta_pct}%
                        </span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
                          {trend.weeks_tracked}sem
                        </span>
                      </div>
                    </div>
                    {/* Right: sparkline */}
                    <div style={{ flexShrink: 0, marginLeft: 8 } as any}>
                      <Sparkline data={trend.sparkline} color={trend.direction_color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
            {[
              { label: 'Renforce', color: '#10B981', icon: 'ri-arrow-up-line' },
              { label: 'Stable', color: '#6B7280', icon: 'ri-subtract-line' },
              { label: 'Affaibli', color: '#F59E0B', icon: 'ri-arrow-down-line' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 } as any}>
                <i className={l.icon} style={{ fontSize: 8, color: l.color }} />
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
