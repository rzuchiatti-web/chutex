import React from 'react';
import { useRouter } from 'expo-router';

const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
const SHOE_IMG = 'https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/ei43qs8n_img_activity.png';

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
  if (!hasAnyData) return { level: 'unknown', pct: 0, color: '#6B7280', barColor: 'rgba(255,255,255,0.08)', note: 'Connectez votre bracelet Elio.' };
  let pct = recovery;
  if (pct === 0) {
    let score = 50;
    if (sleepQuality >= 80) score += 20; else if (sleepQuality >= 60) score += 10; else if (sleepQuality > 0 && sleepQuality < 50) score -= 15;
    if (stress > 70) score -= 25; else if (stress > 50) score -= 10; else if (stress > 0 && stress <= 30) score += 10;
    if (heartRate > 0 && heartRate <= 65) score += 15; else if (heartRate > 85) score -= 10;
    pct = Math.max(10, Math.min(100, score));
  }
  if (pct >= 80) return { level: 'optimal', pct, color: '#10B981', barColor: '#10B981', note: 'Excellente recuperation.' };
  if (pct >= 60) return { level: 'bon', pct, color: '#22D3EE', barColor: '#22D3EE', note: 'Bonne recuperation.' };
  if (pct >= 40) return { level: 'modere', pct, color: '#F59E0B', barColor: '#F59E0B', note: 'Recuperation moyenne.' };
  return { level: 'faible', pct, color: '#EF4444', barColor: '#EF4444', note: 'Repos recommande.' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak }: ActivityCardProps) {
  const router = useRouter();
  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const metrics = [
    { label: 'Pas', value: steps, goal: 6000, unit: 'Nombre', color: '#10B981' },
    { label: 'Calories', value: calories, goal: 300, unit: 'kcal', color: '#F59E0B' },
    { label: 'Distance', value: distance, goal: 4, unit: 'km', color: '#38BDF8' },
  ];
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);

  return (
    <div data-testid="activity-card" onClick={() => router.push('/activity-detail' as any)} style={{ borderRadius: 18, overflow: 'hidden', cursor: 'pointer', marginBottom: 14, position: 'relative', transition: 'transform 0.15s' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      <img src={BG_GREEN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 2 } as any}>
        {/* Hero image */}
        <div style={{ textAlign: 'center', paddingTop: 12 } as any}>
          <img src={SHOE_IMG} alt="" style={{ width: 100, height: 100, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' } as any} />
        </div>
        <div style={{ padding: '8px 16px 12px' } as any}>
          {/* Title + streak */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>Activite physique</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: st.current_streak > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${st.current_streak > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}` } as any}>
              <i className="ri-fire-fill" style={{ fontSize: 11, color: st.current_streak > 0 ? '#F59E0B' : 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: st.current_streak > 0 ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}>{st.current_streak}j</span>
            </div>
          </div>
          {/* Metrics */}
          <div style={{ display: 'flex', gap: 6 } as any}>
            {metrics.map((m, i) => {
              const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
              const hasData = m.value > 0;
              return (
                <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: hasData ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                    {hasData ? (typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}
                  </div>
                  <div style={{ fontSize: 8, color: m.color, fontWeight: 700, marginTop: 2 }}>{m.label}</div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 4 } as any}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color, opacity: 0.7 } as any} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Recovery mini */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 } as any}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Recuperation</span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: '100%', borderRadius: 2, width: `${ri.pct}%`, background: ri.barColor, opacity: 0.7 } as any} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: ri.color }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</span>
          </div>
        </div>
        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{ri.note}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981' }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 10 }} /></span>
        </div>
      </div>
    </div>
  );
}
