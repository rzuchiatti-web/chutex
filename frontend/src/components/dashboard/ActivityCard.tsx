import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

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
  const txt = isDark ? '#FFF' : '#111';
  const sub = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const sep = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const dim = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  const st = streak || { current_streak: 0, max_streak: 0, badge: null, objectives_today: [] };
  const ri = getRecoveryInfo(recovery, stress, sleepQuality, heartRate);

  const fmt = (v: number) => v % 1 !== 0 ? v.toFixed(1) : v.toLocaleString();
  const pct = (v: number, g: number) => g > 0 ? Math.min(100, Math.round((v / g) * 100)) : 0;

  return (
    <div data-testid="activity-card" onClick={() => router.push({ pathname: '/activity-detail' as any, params: beneficiaryId ? { beneficiaryId } : {} })}
      style={{ borderRadius: 18, background: cardBg, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', marginBottom: 14, overflow: 'hidden', transition: 'transform 0.15s' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* Top: image + title + arrow */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px', gap: 14 } as any}>
        <img src={MUSCLE_IMG} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 } as any} />
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 16, fontWeight: 900, color: txt, lineHeight: 1.2 }}>{t('activity')}</div>
          <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>
            {st.current_streak > 0 ? (<><i className="ri-fire-fill" style={{ fontSize: 10, color: '#F59E0B', marginRight: 3 }} /><span style={{ color: '#F59E0B', fontWeight: 700 }}>{st.current_streak} {t('days_label')}</span></>) : 'Suivi quotidien'}
          </div>
        </div>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: sub }} />
      </div>

      <div style={{ height: 1, background: sep } as any} />

      {/* Metrics: 3 rows — clean aligned list */}
      <div style={{ padding: '0' } as any}>
        {[
          { icon: 'ri-footprint-line', label: t('steps'), value: steps, goal: stepGoal, unit: '', color: '#10B981' },
          { icon: 'ri-fire-line', label: t('calories_burned'), value: calories, goal: calGoal, unit: 'kcal', color: '#F59E0B' },
          { icon: 'ri-route-line', label: t('distance'), value: distance, goal: 4, unit: 'km', color: '#38BDF8' },
        ].map((m, i) => {
          const p = pct(m.value, m.goal);
          const has = m.value > 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderTop: i > 0 ? `1px solid ${sep}` : 'none', gap: 12 } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={m.icon} style={{ fontSize: 15, color: m.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ fontSize: 11, fontWeight: 600, color: sub }}>{m.label}</div>
                <div style={{ height: 3, borderRadius: 2, background: sep, overflow: 'hidden', marginTop: 4 } as any}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${p}%`, background: m.color, transition: 'width 0.5s' } as any} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                <span style={{ fontSize: 18, fontWeight: 900, color: has ? txt : dim, lineHeight: 1 }}>{has ? fmt(m.value) : '--'}</span>
                {m.unit && <span style={{ fontSize: 9, color: sub, marginLeft: 2 }}>{m.unit}</span>}
                <div style={{ fontSize: 9, color: m.color, fontWeight: 700, marginTop: 1 }}>{p}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: sep } as any} />

      {/* Recovery row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', gap: 12 } as any}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ri.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <i className="ri-battery-charge-line" style={{ fontSize: 15, color: ri.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 } as any}>
          <div style={{ fontSize: 11, fontWeight: 600, color: sub }}>Recuperation</div>
          <div style={{ height: 3, borderRadius: 2, background: sep, overflow: 'hidden', marginTop: 4 } as any}>
            <div style={{ height: '100%', borderRadius: 2, width: `${ri.pct}%`, background: ri.color, transition: 'width 0.5s' } as any} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
          <span style={{ fontSize: 18, fontWeight: 900, color: ri.pct > 0 ? ri.color : dim, lineHeight: 1 }}>{ri.pct > 0 ? `${ri.pct}%` : '--'}</span>
          <div style={{ fontSize: 9, color: ri.color, fontWeight: 700, marginTop: 1 }}>{ri.label}</div>
        </div>
      </div>
    </div>
  );
}
