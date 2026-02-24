import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import SleepHypnogram, { fromBraceletStages } from './SleepHypnogram';

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

  /* Build sleep session from bracelet data or simulate */
  const sleepSession = useMemo(() => {
    if (d.sleep_stages && Array.isArray(d.sleep_stages) && d.sleep_stages.length > 0) {
      return fromBraceletStages(d.sleep_stages);
    }
    // Simulate realistic stages from duration data
    const totalMin = deep + light + rem + Math.max(0, slD - total);
    const stages: number[] = [];
    let minute = 0;
    const awakeMins = Math.max(0, slD - total);
    // Fall asleep
    for (let i = 0; i < Math.min(5, awakeMins); i++) { stages.push(0); minute++; }
    // Sleep cycles (4-5)
    const cycles = Math.max(3, Math.round(totalMin / 90));
    const deepPerCycle = Math.round(deep / cycles);
    const lightPerCycle = Math.round(light / cycles);
    const remPerCycle = Math.round(rem / cycles);
    for (let c = 0; c < cycles && minute < totalMin; c++) {
      for (let i = 0; i < lightPerCycle && minute < totalMin; i++) { stages.push(2); minute++; }
      const deepDur = c < 2 ? deepPerCycle + 5 : Math.max(5, deepPerCycle - 5);
      for (let i = 0; i < deepDur && minute < totalMin; i++) { stages.push(1); minute++; }
      for (let i = 0; i < Math.round(lightPerCycle * 0.4) && minute < totalMin; i++) { stages.push(2); minute++; }
      const remDur = c < 2 ? Math.max(5, remPerCycle - 5) : remPerCycle + 5;
      for (let i = 0; i < remDur && minute < totalMin; i++) { stages.push(3); minute++; }
      if (c < cycles - 1 && Math.random() > 0.5) {
        for (let i = 0; i < 2 && minute < totalMin; i++) { stages.push(0); minute++; }
      }
    }
    // Wake up
    for (let i = 0; i < Math.min(3, awakeMins) && minute < totalMin; i++) { stages.push(0); minute++; }
    return fromBraceletStages(stages);
  }, [d.sleep_stages, deep, light, rem, slD, total]);

  return (
    <div data-testid="sleep-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'sleep' } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden', cursor: 'pointer', marginBottom: 14 } as any}>
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Sommeil</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{Math.floor(slD / 60)}h{String(slD % 60).padStart(2, '0')}</div>
        </div>
        <SleepHypnogram session={sleepSession} width={640} height={160} showLabels={true} compact={false} timeLabelCount={4} />
      </div>
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 } as any}>
        {[
          { l: 'Profond', v: `${Math.floor(deep / 60)}h${String(deep % 60).padStart(2, '0')}`, pct: Math.round(deep / total * 100), c: '#3A4099' },
          { l: 'Leger', v: `${Math.floor(light / 60)}h${String(light % 60).padStart(2, '0')}`, pct: Math.round(light / total * 100), c: '#6B7BD9' },
          { l: 'REM', v: `${Math.floor(rem / 60)}h${String(rem % 60).padStart(2, '0')}`, pct: Math.round(rem / total * 100), c: '#A8B4F0' },
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
