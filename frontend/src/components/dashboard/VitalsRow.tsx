import React from 'react';
import { useRouter } from 'expo-router';

interface Props { br: any; }

export default function VitalsRow({ br }: Props) {
  const router = useRouter();

  const hasData = br.heart_rate > 0 || br.spo2 > 0;
  const fmt = (v: any) => (v && v !== 0) ? v : '--';
  const fmtBp = () => {
    const s = br.blood_pressure?.systolic;
    const d = br.blood_pressure?.diastolic;
    return (s && s > 0 && d && d > 0) ? `${s}/${d}` : '--';
  };
  const fmtTemp = () => (br.temperature && br.temperature > 0) ? `${br.temperature}` : '--';

  const vitals = [
    {
      label: 'Rythme cardiaque', icon: 'ri-heart-pulse-line', color: '#EF4444',
      val: fmt(br.heart_rate), unit: 'bpm', status: hasData ? 'Au repos' : 'Non connecte',
      route: '/health-detail', params: { metricId: 'heart_rate' },
    },
    {
      label: 'Saturation O2', icon: 'ri-drop-line', color: '#6366F1',
      val: fmt(br.spo2), unit: '%', status: hasData ? 'Normal' : 'Non connecte',
      route: '/health-detail', params: { metricId: 'spo2' },
    },
    {
      label: 'Pression arterielle', icon: 'ri-water-flash-line', color: '#8B5CF6',
      val: fmtBp(), unit: 'mmHg', status: hasData ? 'Stable' : 'Non connecte',
      route: '/health-detail', params: { metricId: 'blood_pressure' },
    },
    {
      label: 'Temperature', icon: 'ri-temp-hot-line', color: '#F59E0B',
      val: fmtTemp(), unit: '°C', status: hasData ? 'Normale' : 'Non connecte',
      route: '/health-detail', params: { metricId: 'temperature' },
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
      {vitals.map((v, i) => (
        <div key={i} data-testid={`vital-card-${i}`}
          onClick={() => router.push({ pathname: v.route as any, params: v.params })}
          style={{
            padding: '12px 14px 10px', borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            transition: 'transform 0.15s, background 0.15s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}
        >
          {/* Top: icon + label ... chevron */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
              <i className={v.icon} style={{ fontSize: 13, color: v.color }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{v.label}</span>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.15)' }} />
          </div>
          {/* Value + unit */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 2 } as any}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -0.5 }}>{v.val}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>
          </div>
          {/* Status */}
          <div style={{ fontSize: 10, fontWeight: 600, color: v.color, opacity: 0.7 }}>{v.status}</div>
        </div>
      ))}
    </div>
  );
}
