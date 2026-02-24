import React from 'react';
import { useRouter } from 'expo-router';

interface Props { br: any; }

export default function VitalsRow({ br }: Props) {
  const router = useRouter();

  const vitals = [
    {
      val: br.heart_rate, unit: 'bpm', label: 'Cardiac',
      color: '#EF4444', accent: 'rgba(239,68,68,0.35)',
      route: '/health-detail', params: { metricId: 'heart_rate' },
    },
    {
      val: `${br.spo2}`, unit: '%', label: 'SpO2',
      color: '#38BDF8', accent: 'rgba(56,189,248,0.35)',
      route: '/health-detail', params: { metricId: 'spo2' },
    },
    {
      val: `${br.blood_pressure?.systolic || 125}/${br.blood_pressure?.diastolic || 78}`, unit: '', label: 'Tension',
      color: '#A78BFA', accent: 'rgba(167,139,250,0.35)',
      route: '/health-detail', params: { metricId: 'blood_pressure' },
    },
    {
      val: `${br.temperature}`, unit: '°', label: 'Temp',
      color: '#F59E0B', accent: 'rgba(245,158,11,0.35)',
      route: '/health-detail', params: { metricId: 'temperature' },
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
      {vitals.map((v, i) => (
        <div key={i} data-testid={`vital-card-${i}`}
          onClick={() => router.push({ pathname: v.route as any, params: v.params })}
          style={{
            padding: '18px 16px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.04)',
            borderLeft: `3px solid ${v.accent}`,
            cursor: 'pointer',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            transition: 'transform 0.15s, background 0.15s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: v.color, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>{v.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 } as any}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1, fontFamily: "'Inter', system-ui, sans-serif" }}>{v.val}</span>
            {v.unit && <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.25)', marginLeft: 2 }}>{v.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
