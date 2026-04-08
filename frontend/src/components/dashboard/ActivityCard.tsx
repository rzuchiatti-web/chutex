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

function getRecoveryPct(recovery: number, stress: number, sleepQuality: number, heartRate: number) {
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
  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryPct(recovery, stress, sleepQuality, heartRate);
  const stepPct = stepGoal > 0 ? Math.min(100, Math.round((steps / stepGoal) * 100)) : 0;

  const C = {
    bg: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    pillBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
    txt: isDark ? '#F1F5F9' : '#0F172A',
    sub: isDark ? '#94A3B8' : '#64748B',
    muted: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
    border: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    barBg: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
  };

  return (
    <div data-testid="activity-card"
      onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{
        borderRadius: 18, backgroundColor: C.bg, cursor: 'pointer', marginBottom: 14,
        transition: 'transform 0.2s ease',
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* ── Top: Muscle hero + steps big number ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 14px', gap: 14 } as any}>
        {/* Muscle in a soft green circle */}
        <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <img src={MUSCLE_IMG} alt="" style={{ width: 36, height: 36, objectFit: 'contain' } as any} />
        </div>
        {/* Steps big */}
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: 'uppercase' as any, letterSpacing: 0.5, marginBottom: 2 }}>{t('activity')}{st.current_streak > 0 && <span style={{ color: '#F59E0B', marginLeft: 6 }}><i className="ri-fire-fill" style={{ fontSize: 10 }} /> {st.current_streak}j</span>}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 } as any}>
            <span style={{ fontSize: 30, fontWeight: 800, color: steps > 0 ? C.txt : C.muted, lineHeight: 1, letterSpacing: -1.5 }}>{steps > 0 ? steps.toLocaleString() : '--'}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: C.sub, paddingBottom: 2 }}>pas</span>
          </div>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 } as any}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.barBg, overflow: 'hidden' } as any}>
              <div style={{ height: '100%', borderRadius: 2, width: `${stepPct}%`, backgroundColor: '#10B981', transition: 'width 0.4s ease' } as any} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>{stepPct}%</span>
          </div>
        </div>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: C.muted, flexShrink: 0 }} />
      </div>

      {/* ── Bottom: 3 pills — Calories · Distance · Recovery ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 14px' } as any}>
        {/* Calories pill */}
        <div style={{ flex: 1, padding: '10px 10px', borderRadius: 12, backgroundColor: C.pillBg } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 } as any}>
            <i className="ri-fire-line" style={{ fontSize: 12, color: '#F59E0B' }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: C.sub, textTransform: 'uppercase' as any, letterSpacing: 0.3 }}>{t('calories_burned')}</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: calories > 0 ? C.txt : C.muted, lineHeight: 1 }}>{calories > 0 ? (calories % 1 !== 0 ? calories.toFixed(1) : calories) : '--'}</span>
          <span style={{ fontSize: 9, color: C.sub, marginLeft: 2 }}>kcal</span>
        </div>
        {/* Distance pill */}
        <div style={{ flex: 1, padding: '10px 10px', borderRadius: 12, backgroundColor: C.pillBg } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 } as any}>
            <i className="ri-route-line" style={{ fontSize: 12, color: '#0EA5E9' }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: C.sub, textTransform: 'uppercase' as any, letterSpacing: 0.3 }}>{t('distance')}</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: distance > 0 ? C.txt : C.muted, lineHeight: 1 }}>{distance > 0 ? (distance % 1 !== 0 ? distance.toFixed(1) : distance) : '--'}</span>
          <span style={{ fontSize: 9, color: C.sub, marginLeft: 2 }}>km</span>
        </div>
        {/* Recovery pill */}
        <div style={{ flex: 1, padding: '10px 10px', borderRadius: 12, backgroundColor: C.pillBg } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 } as any}>
            <i className="ri-battery-charge-line" style={{ fontSize: 12, color: ri.color }} />
            <span style={{ fontSize: 9, fontWeight: 600, color: C.sub, textTransform: 'uppercase' as any, letterSpacing: 0.3 }}>Recup.</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: ri.pct > 0 ? ri.color : C.muted, lineHeight: 1 }}>{ri.pct > 0 ? ri.pct : '--'}</span>
          <span style={{ fontSize: 9, color: ri.color, marginLeft: 2, fontWeight: 600 }}>{ri.pct > 0 ? '%' : ''}</span>
          {ri.pct > 0 && <div style={{ fontSize: 8, color: ri.color, fontWeight: 600, marginTop: 2 }}>{ri.label}</div>}
        </div>
      </div>
    </div>
  );
}
