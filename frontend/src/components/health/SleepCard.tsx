import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import SleepHypnogram, { fromBraceletStages } from './SleepHypnogram';

interface Props { d: any; }

export default function SleepCard({ d }: Props) {
  const router = useRouter();

  // ONLY use real data — no fake fallbacks
  const slD = d.sleep_duration_min || 0;
  const slQ = d.sleep_quality || 0;
  const deep = d.deep_sleep_min || 0;
  const light = d.light_sleep_min || 0;
  const rem = d.rem_sleep_min || 0;
  const inter = d.sleep_interruptions || 0;
  const total = deep + light + rem;
  const hasRealData = slD > 0 || slQ > 0 || total > 0;

  const sleepSession = useMemo(() => {
    if (!hasRealData) return null;
    if (d.sleep_stages && Array.isArray(d.sleep_stages) && d.sleep_stages.length > 0) {
      return fromBraceletStages(d.sleep_stages);
    }
    // Build from real duration data only
    const stages: number[] = [];
    const cycles = Math.max(1, Math.round(total / 90));
    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < Math.round(light / cycles); i++) stages.push(2);
      for (let i = 0; i < Math.round(deep / cycles); i++) stages.push(1);
      for (let i = 0; i < Math.round(rem / cycles); i++) stages.push(3);
      if (c < cycles - 1) stages.push(0);
    }
    return stages.length > 0 ? fromBraceletStages(stages) : null;
  }, [d.sleep_stages, deep, light, rem, hasRealData, total]);

  // No data state
  if (!hasRealData) {
    return (
      <div data-testid="sleep-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'sleep' } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '20px 18px', cursor: 'pointer', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-moon-line" style={{ fontSize: 16, color: '#A78BFA' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Sommeil</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>Portez votre bracelet Elio la nuit pour obtenir une analyse detaillee de votre sommeil.</div>
      </div>
    );
  }

  const apneaRisk = Math.min(100, Math.max(5, inter * 12 + (slQ < 70 ? 20 : 0)));

  return (
    <div data-testid="sleep-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'sleep' } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden', cursor: 'pointer', marginBottom: 14 } as any}>
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Sommeil</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{Math.floor(slD / 60)}h{String(slD % 60).padStart(2, '0')}</div>
        </div>
        {sleepSession && <SleepHypnogram session={sleepSession} width={640} height={160} showLabels={true} compact={false} timeLabelCount={4} />}
      </div>
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 } as any}>
        {[
          { l: 'Profond', v: deep > 0 ? `${Math.floor(deep / 60)}h${String(deep % 60).padStart(2, '0')}` : '--', pct: total > 0 ? Math.round(deep / total * 100) : 0, c: '#3A4099' },
          { l: 'Leger', v: light > 0 ? `${Math.floor(light / 60)}h${String(light % 60).padStart(2, '0')}` : '--', pct: total > 0 ? Math.round(light / total * 100) : 0, c: '#6B7BD9' },
          { l: 'REM', v: rem > 0 ? `${Math.floor(rem / 60)}h${String(rem % 60).padStart(2, '0')}` : '--', pct: total > 0 ? Math.round(rem / total * 100) : 0, c: '#A8B4F0' },
          { l: 'Qualite', v: slQ > 0 ? `${slQ}%` : '--', c: slQ >= 80 ? '#10B981' : '#F59E0B' },
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
