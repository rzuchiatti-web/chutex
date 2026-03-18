import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Correlation {
  metric_a: string;
  metric_b: string;
  label: string;
  r: number;
  strength: string;
  direction: string;
  impact_pct: number;
  insight: string;
  data_points: number;
  category: string;
}

interface Trend {
  label: string;
  sparkline: (number | null)[];
  delta_pct: number;
  direction: string;
  direction_label: string;
  direction_color: string;
}

/* Simple French labels for the general public */
const SIMPLE_LABELS: Record<string, { text: string; icon: string; color: string }> = {
  'sleep_quality|heart_rate': { text: 'Bien dormir calme votre coeur', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'sleep_quality|hrv': { text: 'Le sommeil renforce votre coeur', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'sleep_quality|stress': { text: 'Bien dormir reduit votre stress', icon: 'ri-mental-health-line', color: '#F59E0B' },
  'sleep_quality|steps': { text: 'Le sommeil influence votre activite', icon: 'ri-walk-line', color: '#10B981' },
  'steps|heart_rate': { text: 'Marcher entraine votre coeur', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'steps|stress': { text: 'L\'activite reduit votre stress', icon: 'ri-mental-health-line', color: '#F59E0B' },
  'steps|calories': { text: 'Les pas brulent des calories', icon: 'ri-fire-line', color: '#F59E0B' },
  'hrv|stress': { text: 'Votre coeur reagit au stress', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'hrv|spo2': { text: 'Coeur et oxygenation sont lies', icon: 'ri-lungs-line', color: '#EF4444' },
  'weight|heart_rate': { text: 'Le poids impacte votre coeur', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'weight|steps': { text: 'Le poids influence votre activite', icon: 'ri-walk-line', color: '#10B981' },
  'body_fat_pct|heart_rate': { text: 'La graisse impacte votre coeur', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'body_fat_pct|muscle_pct': { text: 'Graisse et muscles evoluent ensemble', icon: 'ri-body-scan-line', color: '#F97316' },
  'muscle_pct|basal_metabolism': { text: 'Le muscle accelere le metabolisme', icon: 'ri-fire-line', color: '#F59E0B' },
  'visceral_fat|heart_rate': { text: 'La graisse abdominale impacte le coeur', icon: 'ri-heart-pulse-line', color: '#EF4444' },
  'water_pct|weight': { text: 'L\'hydratation agit sur le poids', icon: 'ri-drop-line', color: '#3B82F6' },
  'deep_sleep_min|recovery_score': { text: 'Le sommeil profond aide la recuperation', icon: 'ri-moon-line', color: '#A78BFA' },
  'sleep_quality|blood_glucose': { text: 'Le sommeil agit sur la glycemie', icon: 'ri-test-tube-line', color: '#F59E0B' },
  'steps|blood_glucose': { text: 'Marcher aide a reguler la glycemie', icon: 'ri-test-tube-line', color: '#F59E0B' },
};

function getSimpleLabel(corr: Correlation) {
  const key = `${corr.metric_a}|${corr.metric_b}`;
  return SIMPLE_LABELS[key] || { text: corr.label, icon: 'ri-links-line', color: '#F59E0B' };
}

/* Mini sparkline — same SVG style as HeroScore gauge */
function MiniSparkline({ data, color }: { data: (number | null)[]; color: string }) {
  const valid = data.filter((v): v is number => v !== null);
  if (valid.length < 2) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 0.1;
  const w = 40, h = 16, pad = 2;
  const pts = data.map((v, i) => {
    if (v === null) return null;
    return { x: pad + (i / (data.length - 1)) * (w - pad * 2), y: pad + (1 - (v - min) / range) * (h - pad * 2) };
  }).filter(Boolean) as { x: number; y: number }[];
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill={color} />
    </svg>
  );
}

export default function CorrelationsCard() {
  const { token } = useAuth();
  const [insights, setInsights] = useState<string[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/health/correlations', {}, token).catch(() => null),
      apiFetch('/api/health/correlations/trends', {}, token).catch(() => null),
    ]).then(([corrData, trendData]) => {
      if (!corrData || corrData.no_data) { setNoData(true); return; }
      setInsights(corrData.insights || []);
      setCorrelations(corrData.correlations || []);
      if (trendData && !trendData.no_data) setTrends(trendData.trends || []);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div data-testid="correlations-loading" style={{ borderRadius: 18, background: '#272a30', padding: '20px 16px', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-links-line" style={{ fontSize: 17, color: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Liens entre vos mesures</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Analyse en cours...</div>
          </div>
        </div>
      </div>
    );
  }

  if (noData || correlations.length === 0) {
    return (
      <div data-testid="correlations-no-data" style={{ borderRadius: 18, background: '#272a30', padding: '20px 16px', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-links-line" style={{ fontSize: 17, color: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Liens entre vos mesures</div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 8 }}>
          Portez vos appareils quelques jours pour decouvrir comment vos mesures s'influencent entre elles.
        </div>
      </div>
    );
  }

  // Match trends to correlations
  const trendMap: Record<string, Trend> = {};
  trends.forEach(t => { trendMap[t.label] = t; });

  const visible = expanded ? correlations : correlations.slice(0, 4);

  return (
    <div data-testid="correlations-card" style={{ borderRadius: 18, background: '#272a30', overflow: 'hidden', marginBottom: 14 } as any}>

      {/* Header — same as HeroScore subscores title */}
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 } as any}>
          Ce que Nora observe
        </div>
      </div>

      {/* Insights — simple text with check icons, like factors_positive in HeroScore */}
      {insights.length > 0 && (
        <div style={{ padding: '8px 16px 0' } as any}>
          {insights.map((text, i) => (
            <div key={i} data-testid={`correlation-insight-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < insights.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <i className="ri-lightbulb-line" style={{ fontSize: 14, color: '#F59E0B', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '12px 16px 4px' } as any} />

      {/* Correlation rows — exact same pattern as HeroScore subscores */}
      <div style={{ padding: '4px 16px 6px' } as any}>
        {visible.map((corr, i) => {
          const info = getSimpleLabel(corr);
          const trend = trendMap[corr.label];
          const trendColor = trend ? trend.direction_color : null;
          const trendIcon = trend ? (trend.direction === 'up' ? 'ri-arrow-right-up-line' : trend.direction === 'down' ? 'ri-arrow-right-down-line' : 'ri-arrow-right-line') : null;

          return (
            <div key={i} data-testid={`correlation-item-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            } as any}>
              {/* Icon box — same as HeroScore */}
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${info.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={info.icon} style={{ fontSize: 17, color: info.color }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', lineHeight: 1.3 }}>{info.text}</div>
                {/* Trend label */}
                {trend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 } as any}>
                    <i className={trendIcon!} style={{ fontSize: 10, color: trendColor! }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: trendColor! }}>
                      {trend.direction_label}
                    </span>
                  </div>
                )}
              </div>

              {/* Right side — sparkline or simple bar */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 } as any}>
                {trend && trend.sparkline.length > 1 ? (
                  <MiniSparkline data={trend.sparkline} color={trendColor || info.color} />
                ) : (
                  /* Simple strength bar — like SleepCard progress */
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' } as any}>
                    <div style={{ height: 4, borderRadius: 2, width: `${Math.max(15, corr.impact_pct)}%`, background: `linear-gradient(90deg, ${info.color}80, ${info.color})` } as any} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand — same style as SleepCard footer */}
      {correlations.length > 4 && (
        <div data-testid="correlations-toggle" onClick={() => setExpanded(!expanded)}
          style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.15)', textAlign: 'right', cursor: 'pointer' } as any}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
            {expanded ? 'Voir moins' : `${correlations.length - 4} autres liens`}{' '}
            <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-right-s-line'} style={{ fontSize: 10 }} />
          </span>
        </div>
      )}
    </div>
  );
}
