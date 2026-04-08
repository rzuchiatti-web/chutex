import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

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
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const textColor = isDark ? '#FFF' : '#111';
  const subColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const sepColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const metricBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);

  const metrics = [
    { label: t('steps'), value: steps, goal: stepGoal, unit: '', color: '#10B981', icon: 'ri-footprint-line' },
    { label: t('calories_burned'), value: calories, goal: calGoal, unit: 'kcal', color: '#F59E0B', icon: 'ri-fire-line' },
    { label: t('distance'), value: distance, goal: 4, unit: 'km', color: '#38BDF8', icon: 'ri-route-line' },
  ];

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{ borderRadius: 18, background: cardBg, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', marginBottom: 14, overflow: 'hidden', transition: 'transform 0.15s' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-run-line" style={{ fontSize: 18, color: '#10B981' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: textColor }}>{t('activity')}</div>
            {st.current_streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 } as any}>
                <i className="ri-fire-fill" style={{ fontSize: 10, color: '#F59E0B' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>{st.current_streak} {t('days_label')}</span>
              </div>
            )}
          </div>
        </div>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: subColor }} />
      </div>

      <div style={{ height: 1, background: sepColor, margin: '0 16px' } as any} />

      {/* 3 Metrics row */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 } as any}>
        {metrics.map((m, i) => {
          const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
          const hasData = m.value > 0;
          return (
            <div key={i} style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: metricBg, textAlign: 'center' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 } as any}>
                <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: subColor, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: hasData ? textColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'), lineHeight: 1 }}>
                {hasData ? (typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}
              </div>
              {m.unit && <div style={{ fontSize: 9, color: subColor, marginTop: 2 }}>{m.unit}</div>}
              <div style={{ height: 3, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: 6 } as any}>
                <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color, transition: 'width 0.5s' } as any} />
              </div>
              <div style={{ fontSize: 8, color: subColor, marginTop: 3 }}>{pct}%</div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: sepColor, margin: '0 16px' } as any} />

      {/* Recovery bar */}
      <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } as any}>
          <i className="ri-battery-charge-line" style={{ fontSize: 16, color: ri.color }} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: subColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recuperation</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: ri.color, lineHeight: 1.1 }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</div>
          </div>
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' } as any}>
            <div style={{ height: '100%', borderRadius: 3, width: `${ri.pct}%`, background: ri.color, transition: 'width 0.5s' } as any} />
          </div>
          <div style={{ fontSize: 9, color: ri.color, fontWeight: 700, marginTop: 2, textAlign: 'right' }}>{ri.label}</div>
        </div>
      </div>
    </div>
  );
}
