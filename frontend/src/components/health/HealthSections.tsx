import React from 'react';
import { useRouter } from 'expo-router';

interface Props { d: any; subs: any; beneficiaryId?: string; }

export default function HealthSections({ d, subs, beneficiaryId }: Props) {
  const router = useRouter();
  const isDark = typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') === '1' : false;

  const sections = [
    { id: 'cardio', label: 'Cardiologie', sub: 'Rythme, tension, SpO2', icon: 'ri-heart-pulse-line', color: '#EF4444', metrics: [
      { k: 'heart_rate', l: 'FC', u: 'bpm' }, { k: 'spo2', l: 'SpO2', u: '%' }, { k: 'temperature', l: 'Temp', u: '°C' }
    ]},
    { id: 'metabolism', label: 'Métabolisme', sub: 'Glycémie, IMC, BMR', icon: 'ri-flask-line', color: '#F59E0B', metrics: [
      { k: 'glycemia', l: 'Glyc.', u: 'g/L' }, { k: 'bmi', l: 'IMC', u: '' }, { k: 'basal_metabolism', l: 'BMR', u: 'kcal' }
    ]},
    { id: 'activity', label: 'Condition physique', sub: 'VO2 max, stress, récupération', icon: 'ri-run-line', color: '#10B981', metrics: [
      { k: 'vo2_max', l: 'VO2', u: '' }, { k: 'stress_level', l: 'Stress', u: '' }, { k: 'recovery_score', l: 'Récup.', u: '' }
    ]},
    { id: 'composition', label: 'Composition corporelle', sub: 'Graisse, muscle, hydratation', icon: 'ri-body-scan-line', color: '#F97316', metrics: [
      { k: 'body_fat_pct', l: 'Graisse', u: '%' }, { k: 'muscle_pct', l: 'Muscle', u: '%' }, { k: 'water_pct', l: 'Eau', u: '%' }
    ]},
  ];

  const fmtVal = (key: string) => {
    const v = d[key];
    if (v === undefined || v === null || v === 0) return '--';
    return typeof v === 'number' ? (v % 1 === 0 ? String(v) : v.toFixed(1)) : String(v);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 } as any}>
      {sections.map((sec) => (
        <div key={sec.id} data-testid={`health-section-${sec.id}`}
          onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: sec.id, ...(beneficiaryId ? { beneficiaryId } : {}) } })}
          style={{
            borderRadius: 20, padding: '16px 18px',
            background: isDark ? 'rgba(255,255,255,0.04)' : '#F4F4F5',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
            cursor: 'pointer', transition: 'transform 0.15s, background 0.2s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : '#ECECEE'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#F4F4F5'; }}
        >
          {/* Top row: icon + label + arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 } as any}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${sec.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={sec.icon} style={{ fontSize: 18, color: sec.color }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#FFF' : '#111', letterSpacing: -0.2 }}>{sec.label}</div>
              <div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', marginTop: 1 }}>{sec.sub}</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
          </div>
          {/* Bottom: metric chips */}
          <div style={{ display: 'flex', gap: 6 } as any}>
            {sec.metrics.map((m) => {
              const val = fmtVal(m.k);
              const hasVal = val !== '--';
              return (
                <div key={m.k} style={{ flex: 1, padding: '8px 6px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: hasVal ? (isDark ? '#FFF' : '#111') : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'), lineHeight: 1.1 }}>
                    {val}{hasVal && m.u && <span style={{ fontSize: 8, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', marginLeft: 1 }}>{m.u}</span>}
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: sec.color, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.l}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
