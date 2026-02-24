import React from 'react';
import { useRouter } from 'expo-router';

interface Props { d: any; }

export default function SleepCard({ d }: Props) {
  const router = useRouter();
  const slD = d.sleep_duration_min || 443;
  const slQ = d.sleep_quality || 82;
  const deep = d.deep_sleep_min || 130;
  const light = d.light_sleep_min || 245;
  const rem = d.rem_sleep_min || 68;
  const inter = d.sleep_interruptions || 2;
  const total = deep + light + rem;
  const apneaRisk = Math.min(100, Math.max(5, inter * 12 + (slQ < 70 ? 20 : 0)));

  const phases: number[] = [];
  for (let i = 0; i < 32; i++) {
    const t = i / 32;
    if (t < 0.05 || t > 0.95) phases.push(0);
    else if (t < 0.15) phases.push(3);
    else if (t < 0.25) phases.push(2);
    else if (t < 0.35) phases.push(1);
    else if (t < 0.45) phases.push(2 + Math.floor(Math.random() * 2));
    else if (t < 0.55) phases.push(2);
    else if (t < 0.65) phases.push(1);
    else if (t < 0.75) phases.push(2);
    else if (t < 0.85) phases.push(1 + Math.floor(Math.random() * 2));
    else phases.push(2);
  }
  const phaseColors = ['rgba(255,255,255,0.4)', '#7CB3E8', '#4A90D9', '#2D5F8A'];
  const phaseH = [15, 55, 100, 140];

  return (
    <div data-testid="sleep-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'sleep' } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden', cursor: 'pointer', marginBottom: 14 } as any}>
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Sommeil</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{Math.floor(slD / 60)}h{String(slD % 60).padStart(2, '0')}</div>
        </div>
        <svg width="100%" viewBox="0 0 640 160" style={{ display: 'block' }}>
          <text x="0" y="18" fill="rgba(255,255,255,0.2)" fontSize="9">Eveil</text>
          <text x="0" y="58" fill="rgba(255,255,255,0.2)" fontSize="9">REM</text>
          <text x="0" y="103" fill="rgba(255,255,255,0.2)" fontSize="9">Leger</text>
          <text x="0" y="143" fill="rgba(255,255,255,0.2)" fontSize="9">Profond</text>
          {[15, 55, 100, 140].map(y => <line key={y} x1="50" y1={y} x2="630" y2={y} stroke="rgba(255,255,255,0.04)" />)}
          {phases.map((p, i) => {
            const x = 50 + (i / phases.length) * 580;
            const w = 580 / phases.length;
            const y = phaseH[p];
            const nextY = i < phases.length - 1 ? phaseH[phases[i + 1]] : y;
            return <g key={i}><rect x={x} y={Math.min(y, nextY)} width={w + 1} height={Math.abs(nextY - y) || 4} fill={phaseColors[p]} opacity="0.4" /><rect x={x} y={y - 2} width={w + 1} height={4} fill={phaseColors[p]} /></g>;
          })}
          <text x="50" y="156" fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="700">22:30</text>
          <text x="340" y="156" fill="rgba(255,255,255,0.2)" fontSize="9">2h</text>
          <text x="600" y="156" fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="700">6:30</text>
        </svg>
      </div>
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 } as any}>
        {[
          { l: 'Profond', v: `${Math.floor(deep / 60)}h${String(deep % 60).padStart(2, '0')}`, pct: Math.round(deep / total * 100), c: '#2D5F8A' },
          { l: 'Leger', v: `${Math.floor(light / 60)}h${String(light % 60).padStart(2, '0')}`, pct: Math.round(light / total * 100), c: '#4A90D9' },
          { l: 'REM', v: `${Math.floor(rem / 60)}h${String(rem % 60).padStart(2, '0')}`, pct: Math.round(rem / total * 100), c: '#7CB3E8' },
          { l: 'Qualite', v: `${slQ}%`, c: slQ >= 80 ? '#10B981' : '#F59E0B' },
          { l: 'Interruptions', v: `${inter}`, c: inter <= 2 ? '#10B981' : '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.c, margin: '0 auto 4px' } as any} />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{s.l}{s.pct ? ` ${s.pct}%` : ''}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 16px 14px' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 } as any}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Estimation risque apnee</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444' }}>{apneaRisk < 30 ? 'Faible' : apneaRisk < 60 ? 'Modere' : 'Eleve'}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
          <div style={{ height: 6, borderRadius: 3, width: `${apneaRisk}%`, background: apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? 'linear-gradient(90deg, #10B981, #F59E0B)' : 'linear-gradient(90deg, #F59E0B, #EF4444)' } as any} />
        </div>
      </div>
    </div>
  );
}
