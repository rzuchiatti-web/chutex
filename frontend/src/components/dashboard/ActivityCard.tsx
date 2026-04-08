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

function calcRecovery(recovery: number, stress: number, sleepQuality: number, heartRate: number) {
  if (!(recovery > 0 || stress > 0 || sleepQuality > 0 || heartRate > 0)) return { pct: 0, color: '#94A3B8', label: '--' };
  let p = recovery;
  if (p === 0) {
    let s = 50;
    if (sleepQuality >= 80) s += 20; else if (sleepQuality >= 60) s += 10; else if (sleepQuality > 0 && sleepQuality < 50) s -= 15;
    if (stress > 70) s -= 25; else if (stress > 50) s -= 10; else if (stress > 0 && stress <= 30) s += 10;
    if (heartRate > 0 && heartRate <= 65) s += 15; else if (heartRate > 85) s -= 10;
    p = Math.max(10, Math.min(100, s));
  }
  if (p >= 80) return { pct: p, color: '#10B981', label: 'Optimale' };
  if (p >= 60) return { pct: p, color: '#0EA5E9', label: 'Bonne' };
  if (p >= 40) return { pct: p, color: '#F59E0B', label: 'Moyenne' };
  return { pct: p, color: '#EF4444', label: 'Faible' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak, stepGoal = 6000, calGoal = 300, beneficiaryId }: ActivityCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const isDark = colors.background !== '#FFFFFF';
  const ri = calcRecovery(recovery, stress, sleepQuality, heartRate);
  const st = streak || { current_streak: 0 };
  const stepPct = stepGoal > 0 ? Math.min(100, Math.round((steps / stepGoal) * 100)) : 0;

  // Ring SVG for steps
  const R = 38, STROKE = 5, CIRC = 2 * Math.PI * R;
  const offset = CIRC - (stepPct / 100) * CIRC;

  return (
    <div data-testid="activity-card"
      onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{ borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', cursor: 'pointer', marginBottom: 14, padding: 16, transition: 'transform 0.2s ease' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* Main layout: ring left, data right */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' } as any}>

        {/* Circular progress ring with muscle inside */}
        <div style={{ position: 'relative', width: 86, height: 86, flexShrink: 0 } as any}>
          <svg width="86" height="86" viewBox="0 0 86 86" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="43" cy="43" r={R} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'} strokeWidth={STROKE} />
            <circle cx="43" cy="43" r={R} fill="none" stroke="#10B981" strokeWidth={STROKE}
              strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <img src={MUSCLE_IMG} alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 38, height: 38, objectFit: 'contain' } as any} />
        </div>

        {/* Right side: all data */}
        <div style={{ flex: 1, minWidth: 0 } as any}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#E2E8F0' : '#334155' }}>{t('activity')}</span>
              {st.current_streak > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 99 }}><i className="ri-fire-fill" style={{ fontSize: 8 }} /> {st.current_streak}j</span>}
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }} />
          </div>

          {/* Steps big */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 10 } as any}>
            <span style={{ fontSize: 26, fontWeight: 900, color: isDark ? '#FFF' : '#0F172A', lineHeight: 1, letterSpacing: -1 }}>{steps > 0 ? steps.toLocaleString() : '--'}</span>
            <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', paddingBottom: 1 }}>pas</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', marginLeft: 'auto' }}>{stepPct}%</span>
          </div>

          {/* 3 mini stats inline */}
          <div style={{ display: 'flex', gap: 0 } as any}>
            {[
              { icon: 'ri-fire-line', val: calories, unit: 'kcal', color: '#F59E0B' },
              { icon: 'ri-route-line', val: distance, unit: 'km', color: '#0EA5E9' },
              { icon: 'ri-battery-charge-line', val: ri.pct, unit: '%', color: ri.color },
            ].map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 } as any}>
                <i className={m.icon} style={{ fontSize: 11, color: m.color }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B' }}>
                  {m.val > 0 ? (typeof m.val === 'number' && m.val % 1 !== 0 ? m.val.toFixed(1) : m.val) : '--'}
                </span>
                <span style={{ fontSize: 9, color: isDark ? '#64748B' : '#94A3B8' }}>{m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
