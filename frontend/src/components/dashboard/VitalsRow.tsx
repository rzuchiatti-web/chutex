import React from 'react';
import { useRouter } from 'expo-router';

interface Props { br: any; }

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/* Mini area chart (heart rate, spo2, temp) */
function AreaChart({ data, color, w = 90, h = 36 }: { data: number[]; color: string; w?: number; h?: number }) {
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(' ');
  const area = `M0,${h} L${line} L${w},${h} Z`;
  const cid = `ag-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs><linearGradient id={cid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
      <path d={area} fill={`url(#${cid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

/* Mini vertical bar chart (blood pressure style) */
function BarChart({ data, color, w = 90, h = 36 }: { data: [number, number][]; color: string; w?: number; h?: number }) {
  const allVals = data.flatMap(d => d);
  const min = Math.min(...allVals) - 5;
  const max = Math.max(...allVals) + 5;
  const range = max - min || 1;
  const barW = 3;
  const gap = (w - data.length * barW) / (data.length + 1);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {data.map(([lo, hi], i) => {
        const x = gap + i * (barW + gap);
        const y1 = h - ((hi - min) / range) * h;
        const y2 = h - ((lo - min) / range) * h;
        const bgY = h - ((max - min) / range) * h;
        return (
          <g key={i}>
            <rect x={x} y={bgY} width={barW} height={h - bgY} rx={1.5} fill={color} opacity="0.1" />
            <rect x={x} y={y1} width={barW} height={Math.max(y2 - y1, 2)} rx={1.5} fill={color} opacity="0.7" />
          </g>
        );
      })}
    </svg>
  );
}

export default function VitalsRow({ br }: Props) {
  const router = useRouter();

  const vitals = [
    {
      label: 'Rythme cardiaque', icon: 'ri-heart-pulse-line', color: '#EF4444',
      val: br.heart_rate, unit: 'bpm', status: 'Au repos',
      chart: 'area', chartData: [72, 74, 71, 76, 73, 75, br.heart_rate],
      route: '/health-detail', params: { metricId: 'heart_rate' },
    },
    {
      label: 'Saturation O2', icon: 'ri-drop-line', color: '#6366F1',
      val: `${br.spo2}`, unit: '%', status: 'Normal',
      chart: 'area', chartData: [96, 97, 97, 98, 97, 96, br.spo2],
      route: '/health-detail', params: { metricId: 'spo2' },
    },
    {
      label: 'Pression arterielle', icon: 'ri-water-flash-line', color: '#8B5CF6',
      val: `${br.blood_pressure?.systolic || 125}/${br.blood_pressure?.diastolic || 78}`, unit: 'mmHg', status: 'Stable',
      chart: 'bar', chartData: [[74,120],[78,125],[76,122],[80,128],[75,124],[77,126],[br.blood_pressure?.diastolic||78, br.blood_pressure?.systolic||125]] as [number,number][],
      route: '/health-detail', params: { metricId: 'blood_pressure' },
    },
    {
      label: 'Temperature', icon: 'ri-temp-hot-line', color: '#F59E0B',
      val: `${br.temperature}`, unit: '°C', status: 'Normale',
      chart: 'area', chartData: [36.5, 36.6, 36.4, 36.7, 36.5, 36.6, br.temperature],
      route: '/health-detail', params: { metricId: 'temperature' },
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
      {vitals.map((v, i) => (
        <div key={i} data-testid={`vital-card-${i}`}
          onClick={() => router.push({ pathname: v.route as any, params: v.params })}
          style={{
            padding: '14px 14px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            transition: 'transform 0.15s, background 0.15s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}
        >
          {/* Top: icon + label ... "Aujourd'hui >" */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
              <i className={v.icon} style={{ fontSize: 14, color: v.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{v.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 } as any}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>Aujourd'hui</span>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>

          {/* Bottom: value+status (left) | chart (right) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' } as any}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 } as any}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -0.5 }}>{v.val}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: v.color, opacity: 0.7 }}>{v.status}</div>
            </div>
            <div style={{ flexShrink: 0 } as any}>
              {v.chart === 'area'
                ? <AreaChart data={v.chartData as number[]} color={v.color} />
                : <BarChart data={v.chartData as [number,number][]} color={v.color} />
              }
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, padding: '0 1px' } as any}>
                {DAYS.map((d, di) => <span key={di} style={{ fontSize: 7, fontWeight: 600, color: 'rgba(255,255,255,0.15)', width: `${90 / 7}px`, textAlign: 'center' }}>{d}</span>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
