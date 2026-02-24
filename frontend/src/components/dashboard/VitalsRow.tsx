import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

interface Props { br: any; }

function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) {
    const fakeData = Array.from({ length: 12 }, (_, i) => 40 + Math.sin(i * 0.8) * 20 + Math.random() * 15);
    data = fakeData;
  }
  const min = Math.min(...data);
  const max = Math.max(...data) || 1;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const areaPath = `M0,${height} L${pts.join(' L')} L${width},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}

export default function VitalsRow({ br }: Props) {
  const router = useRouter();
  const { t } = useI18n();

  const hrHistory = br.heart_rate_history?.length > 2 ? br.heart_rate_history : null;

  const vitals = [
    {
      val: br.heart_rate, unit: '', label: 'BPM', sublabel: 'Rythme cardiaque',
      icon: 'ri-heart-pulse-line', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',
      sparkData: hrHistory || [72, 74, 71, 75, 73, 76, 74, 72, 75, 73, 74, br.heart_rate],
      route: '/health-detail', params: { metricId: 'heart_rate' },
    },
    {
      val: `${br.spo2}%`, unit: '', label: 'SpO2', sublabel: 'Saturation O2',
      icon: 'ri-drop-line', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',
      sparkData: [96, 97, 97, 98, 97, 96, 97, 98, 97, 98, 97, br.spo2],
      route: '/health-detail', params: { metricId: 'spo2' },
    },
    {
      val: `${br.blood_pressure?.systolic || 125}`, unit: `/${br.blood_pressure?.diastolic || 78}`,
      label: 'TENSION', sublabel: 'Pression arterielle',
      icon: 'ri-pulse-line', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)',
      sparkData: [122, 125, 120, 128, 124, 126, 123, 127, 125, 124, 126, br.blood_pressure?.systolic || 125],
      route: '/health-detail', params: { metricId: 'blood_pressure' },
    },
    {
      val: `${br.temperature}`, unit: '°C', label: 'TEMP.', sublabel: 'Temperature',
      icon: 'ri-temp-hot-line', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',
      sparkData: [36.5, 36.6, 36.4, 36.7, 36.5, 36.6, 36.5, 36.7, 36.6, 36.5, 36.6, br.temperature],
      route: '/health-detail', params: { metricId: 'temperature' },
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
      {vitals.map((v, i) => (
        <div key={i} data-testid={`vital-card-${i}`}
          onClick={() => router.push({ pathname: v.route as any, params: v.params })}
          style={{
            padding: '14px 16px 12px', borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            transition: 'transform 0.2s, background 0.2s',
            overflow: 'hidden',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}
        >
          {/* Top row: icon+label left, value right */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={v.icon} style={{ fontSize: 14, color: v.color }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', lineHeight: 1 }}>{v.label}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{v.sublabel}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{v.val}</span>
              {v.unit && <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>}
            </div>
          </div>
          {/* Sparkline */}
          <MiniSparkline data={v.sparkData} color={v.color} width={140} height={28} />
        </div>
      ))}
    </div>
  );
}
