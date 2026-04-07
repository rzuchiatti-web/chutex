import React from 'react';
import SleepHypnogram from '../SleepHypnogram';

interface Props {
  sleepSession: any;
  nightDeepMin: number;
  nightLightMin: number;
  nightRemMin: number;
  nightAwakeMin: number;
  nightTotalSleep: number;
  nightInterruptions: number;
  onExplain: (key: string) => void;
}

export default function SleepHypnogramCard({ sleepSession, nightDeepMin, nightLightMin, nightRemMin, nightAwakeMin, nightTotalSleep, nightInterruptions, onExplain }: Props) {
  const stages = [
    { l: 'Profond', v: nightDeepMin, pct: nightTotalSleep > 0 ? Math.round(nightDeepMin / nightTotalSleep * 100) : 0, c: '#3A4099' },
    { l: 'Leger', v: nightLightMin, pct: nightTotalSleep > 0 ? Math.round(nightLightMin / nightTotalSleep * 100) : 0, c: '#6B7BD9' },
    { l: 'REM', v: nightRemMin, pct: nightTotalSleep > 0 ? Math.round(nightRemMin / nightTotalSleep * 100) : 0, c: '#A8B4F0' },
    { l: 'Eveil', v: nightAwakeMin, pct: 0, c: '#E87C8A' },
  ];

  return (
    <div data-testid="sleep-hypnogram-card" style={{ borderRadius: 18, background: '#F4F4F5', marginBottom: 12, overflow: 'hidden' } as any}>
      <div style={{ padding: '16px 16px 0' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
          <i className="ri-moon-line" style={{ fontSize: 14, color: '#A78BFA' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Cycles du sommeil</span>
          <div style={{ marginLeft: 'auto' } as any} />
          <div onClick={() => onExplain('hypnogram')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-information-line" style={{ fontSize: 14, color: '#A78BFA' }} />
          </div>
        </div>
        <SleepHypnogram session={sleepSession} width={700} height={200} showLabels={true} timeLabelCount={5} light={true} />
      </div>
      {/* Stages breakdown */}
      <div style={{ display: 'flex', borderTop: '1px solid #E5E7EB' } as any}>
        {stages.map((s, si) => (
          <div key={si} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', borderRight: si < 3 ? '1px solid #E5E7EB' : 'none' } as any}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.c, margin: '0 auto 4px' } as any} />
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', lineHeight: 1 }}>{Math.floor(s.v / 60)}h{String(s.v % 60).padStart(2, '0')}</div>
            <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>{s.l}{s.pct > 0 ? ` ${s.pct}%` : ''}</div>
          </div>
        ))}
      </div>
      {/* Interruptions row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #E5E7EB', gap: 10 } as any}>
        <i className="ri-alarm-line" style={{ fontSize: 14, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>Interruptions</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444', marginLeft: 'auto' }}>{nightInterruptions}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444' }}>
          {nightInterruptions <= 2 ? 'Bon' : nightInterruptions <= 4 ? 'Modéré' : 'Élevé'}
        </span>
        <div onClick={() => onExplain('interruptions')} style={{ width: 24, height: 24, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
          <i className="ri-information-line" style={{ fontSize: 12, color: '#9CA3AF' }} />
        </div>
      </div>
    </div>
  );
}
