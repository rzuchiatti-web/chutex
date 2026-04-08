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
  const has = recovery > 0 || stress > 0 || sleepQuality > 0 || heartRate > 0;
  if (!has) return { pct: 0, color: '#6B7280', label: 'Inconnue' };
  let p = recovery;
  if (p === 0) {
    let s = 50;
    if (sleepQuality >= 80) s += 20; else if (sleepQuality >= 60) s += 10; else if (sleepQuality > 0 && sleepQuality < 50) s -= 15;
    if (stress > 70) s -= 25; else if (stress > 50) s -= 10; else if (stress > 0 && stress <= 30) s += 10;
    if (heartRate > 0 && heartRate <= 65) s += 15; else if (heartRate > 85) s -= 10;
    p = Math.max(10, Math.min(100, s));
  }
  if (p >= 80) return { pct: p, color: '#10B981', label: 'Optimale' };
  if (p >= 60) return { pct: p, color: '#22D3EE', label: 'Bonne' };
  if (p >= 40) return { pct: p, color: '#F59E0B', label: 'Moyenne' };
  return { pct: p, color: '#EF4444', label: 'Faible' };
}

export default function ActivityCard({ steps, calories, distance, recovery = 0, stress = 0, sleepQuality = 0, heartRate = 0, streak, stepGoal = 6000, calGoal = 300, beneficiaryId }: ActivityCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const isDark = colors.background !== '#FFFFFF';
  // SAME cardBg as the 4 vital cards in health.tsx
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const textColor = isDark ? '#FFF' : '#111';
  const subColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);
  const pct = (v: number, g: number) => g > 0 ? Math.min(100, Math.round((v / g) * 100)) : 0;
  const fv = (v: number) => v % 1 !== 0 ? v.toFixed(1) : v.toLocaleString();

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{ borderRadius: 18, background: cardBg, cursor: 'pointer', marginBottom: 14, padding: '14px 16px', transition: 'transform 0.15s' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* Row 1: icon + label + muscle image + arrow — same layout as vital cards header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
          <i className="ri-run-line" style={{ fontSize: 13, color: '#10B981' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: subColor }}>{t('activity')}</span>
          {st.current_streak > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', marginLeft: 4 }}><i className="ri-fire-fill" style={{ fontSize: 9, color: '#F59E0B' }} /> {st.current_streak}j</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <img src={MUSCLE_IMG} alt="" style={{ width: 28, height: 28, objectFit: 'contain' } as any} />
          <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
        </div>
      </div>

      {/* Row 2: Big steps number — same style as vital card big value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 } as any}>
        <span style={{ fontSize: 28, fontWeight: 900, color: textColor, lineHeight: 1, letterSpacing: -0.5 }}>{steps > 0 ? steps.toLocaleString() : '--'}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: subColor }}>pas</span>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', marginLeft: 10 } as any}>
          <div style={{ height: '100%', borderRadius: 2, width: `${pct(steps, stepGoal)}%`, background: '#10B981', transition: 'width 0.5s' } as any} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginLeft: 4 }}>{pct(steps, stepGoal)}%</span>
      </div>

      {/* Row 3: Calories + Distance — two small metrics side by side */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 } as any}>
        {[
          { icon: 'ri-fire-line', label: t('calories_burned'), value: calories, unit: 'kcal', color: '#F59E0B', p: pct(calories, calGoal) },
          { icon: 'ri-route-line', label: t('distance'), value: distance, unit: 'km', color: '#38BDF8', p: pct(distance, 4) },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
            <div style={{ flex: 1 } as any}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}>
                <span style={{ fontSize: 16, fontWeight: 900, color: m.value > 0 ? textColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), lineHeight: 1 }}>{m.value > 0 ? fv(m.value) : '--'}</span>
                <span style={{ fontSize: 9, color: subColor }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: 9, color: m.color, fontWeight: 600, marginTop: 1 }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 4: Recovery — subtle bottom line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' } as any}>
        <i className="ri-battery-charge-line" style={{ fontSize: 12, color: ri.color }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: subColor }}>Recuperation</span>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' } as any}>
          <div style={{ height: '100%', borderRadius: 2, width: `${ri.pct}%`, background: ri.color, transition: 'width 0.5s' } as any} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 900, color: ri.pct > 0 ? ri.color : subColor }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: ri.color }}>{ri.label}</span>
      </div>
    </div>
  );
}
