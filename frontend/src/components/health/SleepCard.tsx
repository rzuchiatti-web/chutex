import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import SleepHypnogram, { fromBraceletStages } from './SleepHypnogram';

const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';

interface Props { d: any; beneficiaryId?: string; }

export default function SleepCard({ d, beneficiaryId }: Props) {
  const router = useRouter();
  const slQ = d.sleep_quality || 0;
  const deep = d.deep_sleep_min || 0;
  const light = d.light_sleep_min || 0;
  const rem = d.rem_sleep_min || 0;
  const inter = d.sleep_interruptions || 0;
  const total = deep + light + rem;
  // Use phase sum if available and reasonable, else fall back to sleep_duration_min
  const rawSlD = d.sleep_duration_min || 0;
  const slD = (total > 0 && total <= 720) ? total : rawSlD;
  const hasRealData = slD > 0 || slQ > 0 || total > 0;

  const sleepSession = useMemo(() => {
    if (!hasRealData) return null;
    if (d.sleep_stages && Array.isArray(d.sleep_stages) && d.sleep_stages.length > 0) {
      return fromBraceletStages(d.sleep_stages);
    }
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

  if (!hasRealData) {
    return (
      <div data-testid="sleep-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'sleep', ...(beneficiaryId ? { beneficiaryId } : {}) } })} style={{ borderRadius: 18, overflow: 'hidden', cursor: 'pointer', marginBottom: 14, position: 'relative', transition: 'transform 0.15s', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)' } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
        <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', zIndex: 2 } as any}>
          <div style={{ textAlign: 'center', paddingTop: 16 } as any}><img src="https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/xtzgjs5s_sommeil.png" alt="" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' } as any} /></div>
          <div style={{ padding: '10px 16px 14px', textAlign: 'center' } as any}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Sommeil</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Portez votre bracelet Elio la nuit</div>
          </div>
          <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'center' } as any}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA' }}>Voir le detail</span>
          </div>
        </div>
      </div>
    );
  }

  const apneaRisk = Math.min(100, Math.max(5, inter * 5 + (slQ < 70 ? 15 : 0) + (slQ < 50 ? 10 : 0)));

  return (
    <div data-testid="sleep-card" onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: 'sleep', ...(beneficiaryId ? { beneficiaryId } : {}) } })} style={{ borderRadius: 18, overflow: 'hidden', cursor: 'pointer', marginBottom: 14, position: 'relative', transition: 'transform 0.15s', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 2 } as any}>
        <div style={{ textAlign: 'center', paddingTop: 14 } as any}><img src="https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/xtzgjs5s_sommeil.png" alt="" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' } as any} /></div>
        <div style={{ padding: '8px 16px 0' } as any}>
          <div style={{ textAlign: 'center', marginBottom: 8 } as any}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>Sommeil</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1, marginTop: 4 }}>{Math.floor(slD / 60)}h{String(slD % 60).padStart(2, '0')}</div>
          </div>
          {sleepSession && <SleepHypnogram session={sleepSession} width={640} height={160} showLabels={true} compact={false} timeLabelCount={4} />}
        </div>
        <div style={{ padding: '8px 16px 0', display: 'flex', gap: 8 } as any}>
          {[
            { l: 'Profond', v: deep > 0 ? `${Math.floor(deep / 60)}h${String(deep % 60).padStart(2, '0')}` : '--', pct: total > 0 ? Math.round(deep / total * 100) : 0, c: '#3A4099' },
            { l: 'Leger', v: light > 0 ? `${Math.floor(light / 60)}h${String(light % 60).padStart(2, '0')}` : '--', pct: total > 0 ? Math.round(light / total * 100) : 0, c: '#6B7BD9' },
            { l: 'REM', v: rem > 0 ? `${Math.floor(rem / 60)}h${String(rem % 60).padStart(2, '0')}` : '--', pct: total > 0 ? Math.round(rem / total * 100) : 0, c: '#A8B4F0' },
            { l: 'Qualite', v: slQ > 0 ? `${slQ}%` : '--', c: slQ >= 80 ? '#10B981' : '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: s.c, margin: '0 auto 3px' } as any} />
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{s.v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>{s.l}{s.pct ? ` ${s.pct}%` : ''}</div>
            </div>
          ))}
        </div>
        {/* Apnea risk — full width bar */}
        <div style={{ padding: '10px 16px 12px' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
              <i className="ri-lungs-line" style={{ fontSize: 12, color: apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Risque d'apnée</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444' }}>{apneaRisk < 30 ? 'Faible' : apneaRisk < 60 ? 'Modéré' : 'Élevé'}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
            <div style={{ height: 6, borderRadius: 3, width: `${apneaRisk}%`, background: `linear-gradient(90deg, ${apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444'}80, ${apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444'})` } as any} />
          </div>
        </div>
        <div style={{ padding: '6px 16px 8px', background: 'rgba(0,0,0,0.15)', textAlign: 'right' } as any}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA' }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 10 }} /></span>
        </div>
      </div>
    </div>
  );
}
