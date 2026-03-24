import React from 'react';
import { useRouter } from 'expo-router';

const BG_GREEN = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
const MUSCLE_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png';

interface ActivityCardProps {
  steps: number;
  calories: number;
  distance: number;
  recovery?: number;
  stress?: number;
  sleepQuality?: number;
  heartRate?: number;
  streak?: { current_streak: number; max_streak: number; badge: any; objectives_today: string[] };
  stepGoal?: number;
  calGoal?: number;
  beneficiaryId?: string;
}

function getRecoveryInfo(recovery: number, stress: number, sleepQuality: number, heartRate: number) {
  const hasAnyData = recovery > 0 || stress > 0 || sleepQuality > 0 || heartRate > 0;
  if (!hasAnyData) return { level: 'unknown', pct: 0, color: '#6B7280', barColor: 'rgba(255,255,255,0.08)', label: 'Inconnue', note: 'Connectez votre bracelet' };
  let pct = recovery;
  if (pct === 0) {
    let score = 50;
    if (sleepQuality >= 80) score += 20; else if (sleepQuality >= 60) score += 10; else if (sleepQuality > 0 && sleepQuality < 50) score -= 15;
    if (stress > 70) score -= 25; else if (stress > 50) score -= 10; else if (stress > 0 && stress <= 30) score += 10;
    if (heartRate > 0 && heartRate <= 65) score += 15; else if (heartRate > 85) score -= 10;
    pct = Math.max(10, Math.min(100, score));
  }
  if (pct >= 80) return { level: 'optimal', pct, color: '#10B981', barColor: '#10B981', label: 'Optimale', note: 'Pret pour l\'effort' };
  if (pct >= 60) return { level: 'bon', pct, color: '#22D3EE', barColor: '#22D3EE', label: 'Bonne', note: 'En bonne forme' };
  if (pct >= 40) return { level: 'modere', pct, color: '#F59E0B', barColor: '#F59E0B', label: 'Moyenne', note: 'Activite moderee' };
  return { level: 'faible', pct, color: '#EF4444', barColor: '#EF4444', label: 'Faible', note: 'Repos conseille' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak, stepGoal = 6000, calGoal = 300, beneficiaryId }: ActivityCardProps) {
  const router = useRouter();
  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })} style={{ borderRadius: 18, overflow: 'hidden', cursor: 'pointer', marginBottom: 14, position: 'relative', transition: 'transform 0.15s', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      <img src={BG_GREEN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 2 } as any}>
        {/* Hero image centered */}
        <div style={{ textAlign: 'center', paddingTop: 14 } as any}>
          <img src={MUSCLE_IMG} alt="" style={{ width: 90, height: 90, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' } as any} />
        </div>
        <div style={{ padding: '10px 16px 14px' } as any}>
          {/* Title centered */}
          <div style={{ textAlign: 'center', marginBottom: 12 } as any}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Activite Physique</div>
            {st.current_streak > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' } as any}>
                <i className="ri-fire-fill" style={{ fontSize: 11, color: '#F59E0B' }} />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#F59E0B' }}>{st.current_streak} jours</span>
              </div>
            )}
          </div>

          {/* 3 metrics with icons */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 } as any}>
            {[
              { label: 'Pas', value: steps, goal: stepGoal, color: '#10B981', icon: 'ri-footprint-line' },
              { label: 'Calories', value: calories, goal: calGoal, color: '#F59E0B', icon: 'ri-fire-line' },
              { label: 'Distance', value: distance, goal: 4, unit: 'km', color: '#38BDF8', icon: 'ri-route-line' },
            ].map((m, i) => {
              const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
              const hasData = m.value > 0;
              return (
                <div key={i} style={{ flex: 1, padding: '10px 6px', borderRadius: 12, background: 'rgba(0,0,0,0.25)', textAlign: 'center' } as any}>
                  <i className={m.icon} style={{ fontSize: 13, color: m.color, marginBottom: 3, display: 'block' }} />
                  <div style={{ fontSize: 20, fontWeight: 900, color: hasData ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                    {hasData ? (typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}
                  </div>
                  <div style={{ fontSize: 9, color: m.color, fontWeight: 700, marginTop: 3 }}>{m.label}</div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 5 } as any}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color, transition: 'width 0.5s' } as any} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recovery bar — with battery icon */}
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10 } as any}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 } as any}>
              <i className="ri-battery-charge-line" style={{ fontSize: 16, color: ri.color }} />
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recuperation</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: ri.color, lineHeight: 1.1 }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</div>
              </div>
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                <div style={{ height: '100%', borderRadius: 3, width: `${ri.pct}%`, background: `linear-gradient(90deg, ${ri.barColor}80, ${ri.barColor})`, transition: 'width 0.5s' } as any} />
              </div>
              <div style={{ fontSize: 9, color: ri.color, fontWeight: 700, marginTop: 3, textAlign: 'right' }}>{ri.label}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{ri.note}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981' }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 10 }} /></span>
        </div>
      </div>
    </div>
  );
}
