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

  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);
  const stepPct = stepGoal > 0 ? Math.min(100, Math.round((steps / stepGoal) * 100)) : 0;

  // Use exact same bg as the 4 vital cards in health.tsx line 232
  const BG = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{
        borderRadius: 18,
        backgroundColor: BG,
        cursor: 'pointer',
        marginBottom: 14,
        overflow: 'hidden',
        transition: 'transform 0.15s',
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* ── Header row ── */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 10 } as any}>
        <img src={MUSCLE_IMG} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 } as any} />
        <div style={{ flex: 1 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <span style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#FFF' : '#111' }}>{t('activity')}</span>
            {st.current_streak > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>
                <i className="ri-fire-fill" style={{ fontSize: 10, marginRight: 2 }} />{st.current_streak}j
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', marginTop: 1 }}>Suivi quotidien</div>
        </div>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
      </div>

      {/* ── Big steps value ── */}
      <div style={{ padding: '14px 16px 0' } as any}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 } as any}>
          <span style={{ fontSize: 32, fontWeight: 900, color: isDark ? '#FFF' : '#111', lineHeight: 1, letterSpacing: -1 }}>{steps > 0 ? steps.toLocaleString() : '--'}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', paddingBottom: 3 }}>pas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 } as any}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' } as any}>
            <div style={{ height: '100%', borderRadius: 2, width: `${stepPct}%`, backgroundColor: '#10B981', transition: 'width 0.5s' } as any} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', flexShrink: 0 }}>{stepPct}%</span>
        </div>
      </div>

      {/* ── Calories + Distance row ── */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 0 } as any}>
        {/* Calories */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className="ri-fire-line" style={{ fontSize: 14, color: '#F59E0B' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 } as any}>
              <span style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#FFF' : '#111', lineHeight: 1 }}>{calories > 0 ? (calories % 1 !== 0 ? calories.toFixed(1) : calories) : '--'}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', paddingBottom: 1 }}>kcal</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#F59E0B', marginTop: 1 }}>{t('calories_burned')}</div>
          </div>
        </div>
        {/* Distance */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className="ri-route-line" style={{ fontSize: 14, color: '#38BDF8' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 } as any}>
              <span style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#FFF' : '#111', lineHeight: 1 }}>{distance > 0 ? (distance % 1 !== 0 ? distance.toFixed(1) : distance) : '--'}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', paddingBottom: 1 }}>km</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#38BDF8', marginTop: 1 }}>{t('distance')}</div>
          </div>
        </div>
      </div>

      {/* ── Recovery bar ── */}
      <div style={{ padding: '14px 16px', marginTop: 4, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className="ri-battery-charge-line" style={{ fontSize: 14, color: ri.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', flexShrink: 0 }}>Recuperation</span>
          <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' } as any}>
            <div style={{ height: '100%', borderRadius: 2, width: `${ri.pct}%`, backgroundColor: ri.color, transition: 'width 0.5s' } as any} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: ri.pct > 0 ? ri.color : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), flexShrink: 0 }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: ri.color, flexShrink: 0 }}>{ri.label}</span>
        </div>
      </div>
    </div>
  );
}
