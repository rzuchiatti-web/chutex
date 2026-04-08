import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

const MUSCLE_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png';

interface ActivityCardProps {
  steps: number; calories: number; distance: number; recovery?: number; stress?: number;
  sleepQuality?: number; heartRate?: number;
  streak?: { current_streak: number; max_streak: number; badge: any; objectives_today: string[] };
  stepGoal?: number; calGoal?: number; beneficiaryId?: string;
}

function getRecoveryInfo(recovery: number, stress: number, sleepQuality: number, heartRate: number) {
  const hasAnyData = recovery > 0 || stress > 0 || sleepQuality > 0 || heartRate > 0;
  if (!hasAnyData) return { pct: 0, color: '#6B7280', label: 'Inconnue' };
  let pct = recovery;
  if (pct === 0) {
    let score = 50;
    if (sleepQuality >= 80) score += 20; else if (sleepQuality >= 60) score += 10; else if (sleepQuality > 0 && sleepQuality < 50) score -= 15;
    if (stress > 70) score -= 25; else if (stress > 50) score -= 10; else if (stress > 0 && stress <= 30) score += 10;
    if (heartRate > 0 && heartRate <= 65) score += 15; else if (heartRate > 85) score -= 10;
    pct = Math.max(10, Math.min(100, score));
  }
  if (pct >= 80) return { pct, color: '#10B981', label: 'Optimale' };
  if (pct >= 60) return { pct, color: '#22D3EE', label: 'Bonne' };
  if (pct >= 40) return { pct, color: '#F59E0B', label: 'Moyenne' };
  return { pct, color: '#EF4444', label: 'Faible' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak, stepGoal = 6000, calGoal = 300, beneficiaryId }: ActivityCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const isDark = colors.background !== '#FFFFFF';
  const txt = isDark ? '#FFF' : '#111';
  const sub = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const dim = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);
  const pct = (v: number, g: number) => g > 0 ? Math.min(100, Math.round((v / g) * 100)) : 0;
  const fmt = (v: number) => v % 1 !== 0 ? v.toFixed(1) : v.toLocaleString();

  const stepPct = pct(steps, stepGoal);
  const calPct = pct(calories, calGoal);
  const distPct = pct(distance, 4);

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{ borderRadius: 18, background: '#2A2A3E', cursor: 'pointer', marginBottom: 14, overflow: 'hidden', transition: 'transform 0.15s', border: '1px solid rgba(255,255,255,0.06)' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* Hero section — muscle + big step count */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', gap: 16 } as any}>
        <img src={MUSCLE_IMG} alt="" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0, marginTop: 2 } as any} />
        <div style={{ flex: 1 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('activity')}</div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 } as any}>
            <span style={{ fontSize: 34, fontWeight: 900, color: steps > 0 ? '#FFF' : 'rgba(255,255,255,0.12)', lineHeight: 1, letterSpacing: -1 }}>{steps > 0 ? steps.toLocaleString() : '--'}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>pas</span>
          </div>
          {/* Step progress arc */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: '100%', borderRadius: 2, width: `${stepPct}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', transition: 'width 0.5s' } as any} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#10B981', flexShrink: 0 }}>{stepPct}%</span>
          </div>
          {st.current_streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.1)' } as any}>
              <i className="ri-fire-fill" style={{ fontSize: 9, color: '#F59E0B' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B' }}>{st.current_streak}j</span>
            </div>
          )}
        </div>
      </div>

      {/* Calories + Distance — two compact pills */}
      <div style={{ padding: '0 18px 14px', display: 'flex', gap: 8 } as any}>
        {[
          { icon: 'ri-fire-line', label: t('calories_burned'), value: calories, goal: calGoal, unit: 'kcal', color: '#F59E0B', p: calPct },
          { icon: 'ri-route-line', label: t('distance'), value: distance, goal: 4, unit: 'km', color: '#38BDF8', p: distPct },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}>
              <span style={{ fontSize: 20, fontWeight: 900, color: m.value > 0 ? '#FFF' : 'rgba(255,255,255,0.12)', lineHeight: 1 }}>{m.value > 0 ? fmt(m.value) : '--'}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 6 } as any}>
              <div style={{ height: '100%', borderRadius: 2, width: `${m.p}%`, background: m.color, transition: 'width 0.5s' } as any} />
            </div>
          </div>
        ))}
      </div>

      {/* Recovery — bottom bar */}
      <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 } as any}>
        <i className="ri-battery-charge-line" style={{ fontSize: 16, color: ri.color, flexShrink: 0 }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Recuperation</div>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
          <div style={{ height: '100%', borderRadius: 2, width: `${ri.pct}%`, background: ri.color, transition: 'width 0.5s' } as any} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, color: ri.pct > 0 ? ri.color : 'rgba(255,255,255,0.12)', flexShrink: 0 }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</span>
      </div>
    </div>
  );
}
