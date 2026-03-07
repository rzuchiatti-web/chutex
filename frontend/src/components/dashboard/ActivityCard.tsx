import React from 'react';
import { useRouter } from 'expo-router';

interface ActivityCardProps {
  steps: number;
  calories: number;
  distance: number;
  recovery?: number;
  stress?: number;
  sleepQuality?: number;
  heartRate?: number;
  streak?: { current_streak: number; max_streak: number; badge: any; objectives_today: string[] };
}

function getRecoveryInfo(recovery: number, stress: number, sleepQuality: number, heartRate: number) {
  const hasAnyData = recovery > 0 || stress > 0 || sleepQuality > 0 || heartRate > 0;
  if (!hasAnyData) return { level: 'unknown', pct: 0, color: '#6B7280', barColor: 'rgba(255,255,255,0.08)', note: 'Connectez votre bracelet Elio pour obtenir votre score de recuperation et un avis personnalise sur votre aptitude a l\'effort.' };

  // Use recovery_score directly if available (from bracelet)
  let pct = recovery;
  if (pct === 0) {
    // Estimate from available vitals
    let score = 50;
    if (sleepQuality >= 80) score += 20;
    else if (sleepQuality >= 60) score += 10;
    else if (sleepQuality > 0 && sleepQuality < 50) score -= 15;
    if (stress > 70) score -= 25;
    else if (stress > 50) score -= 10;
    else if (stress > 0 && stress <= 30) score += 10;
    if (heartRate > 0 && heartRate <= 65) score += 15;
    else if (heartRate > 85) score -= 10;
    pct = Math.max(10, Math.min(100, score));
  }

  if (pct >= 80) return { level: 'optimal', pct, color: '#10B981', barColor: '#10B981', note: 'Excellente recuperation. Seance de sport intense recommandee : course, musculation ou HIIT. Votre corps est pret a l\'effort.' };
  if (pct >= 60) return { level: 'bon', pct, color: '#22D3EE', barColor: '#22D3EE', note: 'Bonne recuperation. Activite moderee conseillee : marche rapide, yoga dynamique ou velo. Evitez les efforts maximaux.' };
  if (pct >= 40) return { level: 'modere', pct, color: '#F59E0B', barColor: '#F59E0B', note: 'Recuperation moyenne. Privilegiez le repos actif : stretching, marche douce ou mobilite articulaire.' };
  return { level: 'faible', pct, color: '#EF4444', barColor: '#EF4444', note: 'Recuperation insuffisante. Reposez-vous aujourd\'hui. Hydratez-vous et couchez-vous tot ce soir.' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak }: ActivityCardProps) {
  const router = useRouter();
  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const metrics = [
    { label: 'Pas', value: steps, goal: 6000, unit: 'Nombre', icon: 'ri-footprint-line', color: '#10B981' },
    { label: 'Calories', value: calories, goal: 300, unit: 'kcal', icon: 'ri-fire-line', color: '#F59E0B' },
    { label: 'Distance', value: distance, goal: 4, unit: 'km', icon: 'ri-route-line', color: '#38BDF8' },
  ];
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'activity' } })} style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 18px', cursor: 'pointer', transition: 'transform 0.15s, background 0.15s' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}>
      {/* Header with streak */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-run-line" style={{ fontSize: 16, color: '#10B981' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Activite physique</span>
        </div>
        <div data-testid="activity-streak" style={{ display: 'flex', alignItems: 'center', gap: 6 } as any} onClick={(e: any) => e.stopPropagation()}>
          {st.badge && (
            <div style={{ padding: '3px 8px', borderRadius: 999, background: `${st.badge.color}15`, border: `1px solid ${st.badge.color}30` } as any}>
              <i className={st.badge.icon} style={{ fontSize: 10, color: st.badge.color }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: st.current_streak > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${st.current_streak > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}` } as any}>
            <i className="ri-fire-fill" style={{ fontSize: 12, color: st.current_streak > 0 ? '#F59E0B' : 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, fontWeight: 900, color: st.current_streak > 0 ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}>{st.current_streak}</span>
          </div>
          {st.max_streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, opacity: 0.5 } as any}>
              <i className="ri-trophy-line" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{st.max_streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 } as any}>
        {metrics.map((m, i) => {
          const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
          const hasData = m.value > 0;
          return (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 } as any}>
                <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{m.label}</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 2 } as any}>
                <span style={{ fontSize: 22, fontWeight: 900, color: hasData ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                  {hasData ? (typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}
                </span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>{m.unit}</div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                <div style={{ height: 6, borderRadius: 3, width: hasData ? `${pct}%` : '0%', background: `linear-gradient(90deg, ${m.color}80, ${m.color})`, transition: 'width 0.8s ease', boxShadow: pct > 0 ? `0 0 8px ${m.color}40` : 'none' } as any} />
              </div>
              <div style={{ textAlign: 'center', fontSize: 8, fontWeight: 700, color: hasData ? (pct >= 100 ? '#10B981' : 'rgba(255,255,255,0.25)') : 'rgba(255,255,255,0.1)', marginTop: 4 }}>{hasData ? `${pct}%` : `0 / ${m.goal.toLocaleString()}`}</div>
            </div>
          );
        })}
      </div>

      {/* Recovery bar + Nora workout note */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-battery-charge-line" style={{ fontSize: 13, color: ri.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Recuperation</span>
          </div>
          {recovery > 0 && (
            <span style={{ fontSize: 13, fontWeight: 900, color: ri.color }}>{recovery}/100</span>
          )}
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 } as any}>
          <div style={{ height: 8, borderRadius: 4, width: ri.pct > 0 ? `${ri.pct}%` : '0%', background: `linear-gradient(90deg, ${ri.barColor}60, ${ri.barColor})`, transition: 'width 0.8s ease', boxShadow: ri.pct > 0 ? `0 0 10px ${ri.barColor}30` : 'none' } as any} />
        </div>
        {/* Nora note */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 } as any}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#A78BFA' }}>N</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{ri.note}</div>
        </div>
      </div>
    </div>
  );
}
