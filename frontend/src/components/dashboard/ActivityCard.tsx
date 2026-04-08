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
  if (!(recovery > 0 || stress > 0 || sleepQuality > 0 || heartRate > 0)) return { pct: 0, color: '#64748B' };
  let p = recovery;
  if (p === 0) {
    let s = 50;
    if (sleepQuality >= 80) s += 20; else if (sleepQuality >= 60) s += 10; else if (sleepQuality > 0 && sleepQuality < 50) s -= 15;
    if (stress > 70) s -= 25; else if (stress > 50) s -= 10; else if (stress > 0 && stress <= 30) s += 10;
    if (heartRate > 0 && heartRate <= 65) s += 15; else if (heartRate > 85) s -= 10;
    p = Math.max(10, Math.min(100, s));
  }
  if (p >= 80) return { pct: p, color: '#10B981' };
  if (p >= 60) return { pct: p, color: '#0EA5E9' };
  if (p >= 40) return { pct: p, color: '#F59E0B' };
  return { pct: p, color: '#EF4444' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak, stepGoal = 6000, calGoal = 300, beneficiaryId }: ActivityCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const isDark = colors.background !== '#FFFFFF';
  const ri = calcRecovery(recovery, stress, sleepQuality, heartRate);
  const st = streak || { current_streak: 0 };
  const stepPct = stepGoal > 0 ? Math.min(100, Math.round((steps / stepGoal) * 100)) : 0;

  // Whoop-inspired ring
  const SIZE = 72, R = 30, SW = 4.5;
  const C = 2 * Math.PI * R;
  const off = C - (stepPct / 100) * C;

  return (
    <div data-testid="activity-card"
      onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{ borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', cursor: 'pointer', marginBottom: 14, overflow: 'hidden' } as any}>

      {/* ── Main section ── */}
      <div style={{ padding: '18px 18px 16px', display: 'flex', gap: 16, alignItems: 'center' } as any}>

        {/* Ring + muscle */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 } as any}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'} strokeWidth={SW} />
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#10B981" strokeWidth={SW}
              strokeDasharray={C} strokeDashoffset={off} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <img src={MUSCLE_IMG} alt="" style={{ width: 32, height: 32, objectFit: 'contain' } as any} />
          </div>
        </div>

        {/* Right: steps hero */}
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#94A3B8' : '#64748B', letterSpacing: 0.8, textTransform: 'uppercase' as any, marginBottom: 4 }}>
            {t('activity')}
            {st.current_streak > 0 && <span style={{ marginLeft: 8, color: '#F59E0B', fontWeight: 700, letterSpacing: 0 }}><i className="ri-fire-fill" style={{ fontSize: 9 }} /> {st.current_streak}j</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 } as any}>
            <span style={{ fontSize: 32, fontWeight: 900, color: isDark ? '#FFF' : '#0F172A', lineHeight: 1, letterSpacing: -1.5, fontVariantNumeric: 'tabular-nums' }}>{steps > 0 ? steps.toLocaleString() : '—'}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#64748B' : '#94A3B8' }}>pas</span>
          </div>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 4 }}>{stepPct}% de l'objectif</div>
        </div>

        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1' }} />
      </div>

      {/* ── Bottom metrics bar ── */}
      <div style={{ display: 'flex', borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' } as any}>
        {[
          { icon: 'ri-fire-line', label: 'Calories', val: calories > 0 ? (calories % 1 !== 0 ? calories.toFixed(1) : String(calories)) : '—', unit: 'kcal', color: '#F59E0B' },
          { icon: 'ri-route-line', label: 'Distance', val: distance > 0 ? (distance % 1 !== 0 ? distance.toFixed(1) : String(distance)) : '—', unit: 'km', color: '#0EA5E9' },
          { icon: 'ri-battery-charge-line', label: 'Recup.', val: ri.pct > 0 ? String(ri.pct) : '—', unit: '%', color: ri.color },
        ].map((m, i, arr) => (
          <div key={i} style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRight: i < arr.length - 1 ? (isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)') : 'none' } as any}>
            <div style={{ fontSize: 9, fontWeight: 600, color: isDark ? '#64748B' : '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.5, marginBottom: 4 }}>
              <i className={m.icon} style={{ fontSize: 10, color: m.color, marginRight: 3 }} />{m.label}
            </div>
            <div>
              <span style={{ fontSize: 17, fontWeight: 800, color: isDark ? '#E2E8F0' : '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{m.val}</span>
              <span style={{ fontSize: 9, fontWeight: 500, color: isDark ? '#64748B' : '#94A3B8', marginLeft: 2 }}>{m.val !== '—' ? m.unit : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
