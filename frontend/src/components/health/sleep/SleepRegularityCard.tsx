import React from 'react';

interface Props {
  sleepData: any[];
  onExplain: (key: string) => void;
}

export default function SleepRegularityCard({ sleepData, onExplain }: Props) {
  const last7 = sleepData.slice(-7);
  const W = 380, H = 160, LM = 40, RM = 10, TM = 20, BM = 28;
  const gW = W - LM - RM, gH = H - TM - BM;

  const toHour = (d: any) => {
    try {
      const dt = new Date(d.date + 'T12:00:00');
      // Use real start_time from bracelet if available
      let bed = 22;
      if (d.start_time) {
        const parts = d.start_time.split(':');
        bed = parseInt(parts[0]) || 22;
        if (parts[1]) bed += (parseInt(parts[1]) || 0) / 60;
      }
      const durationH = d.duration || 0; // duration in hours from API
      const wake = bed + (durationH > 0 ? durationH : 7.5);
      // Normalize wake to 24h format
      const wakeNorm = wake >= 24 ? wake - 24 : wake;
      return {
        day: `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`,
        bed,
        wake: wakeNorm,
      };
    } catch { return null; }
  };

  const pts = last7.map(toHour).filter(Boolean) as { day: string; bed: number; wake: number }[];
  if (pts.length < 2) return null;

  const normY = (h: number) => { const n = h >= 18 ? h - 18 : h + 6; return TM + gH - (n / 15) * gH; };
  const step = gW / (pts.length - 1);

  return (
    <div data-testid="sleep-regularity-card" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px', marginBottom: 12 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
        <i className="ri-time-line" style={{ fontSize: 14, color: '#A78BFA' }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Regularite du sommeil</span>
        <div onClick={() => onExplain('regularity')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' } as any}>
          <i className="ri-information-line" style={{ fontSize: 14, color: '#A78BFA' }} />
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160, display: 'block' }}>
        {[20, 22, 0, 2, 4, 6, 8].map(h => {
          const y = normY(h);
          return <g key={h}><line x1={LM} x2={W - RM} y1={y} y2={y} stroke="rgba(0,0,0,0.04)" /><text x={LM - 6} y={y + 4} textAnchor="end" fill="#9CA3AF" fontSize="9" fontWeight="600">{h}h</text></g>;
        })}
        {/* Bedtime line */}
        <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${LM + i * step} ${normY(p.bed)}`).join(' ')} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Wake line */}
        <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${LM + i * step} ${normY(p.wake)}`).join(' ')} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots + day labels */}
        {pts.map((p, i) => {
          const x = LM + i * step;
          return <g key={i}>
            <circle cx={x} cy={normY(p.bed)} r="4" fill="#6366F1" stroke="#FFF" strokeWidth="1.5" />
            <circle cx={x} cy={normY(p.wake)} r="4" fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
            <text x={x} y={H - 6} textAnchor="middle" fill="#9CA3AF" fontSize="9" fontWeight="600">{p.day}</text>
          </g>;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#6366F1' } as any} /><span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Coucher</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#F59E0B' } as any} /><span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Réveil</span></div>
      </div>
    </div>
  );
}
