import React from 'react';
import { useRouter } from 'expo-router';

interface Props { br: any; sl: any; }

export default function ActivitySleep({ br, sl }: Props) {
  const router = useRouter();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
      <div data-testid="activity-card" onClick={() => router.push('/(tabs)/health')} style={{ padding: '16px', borderRadius: 22, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-footprint-line" style={{ fontSize: 14, color: '#10B981' }} /></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Activite</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>{br.steps?.toLocaleString()}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>pas aujourd'hui</div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 } as any}><div style={{ height: 4, borderRadius: 2, width: `${Math.min(100, (br.steps / 8000) * 100)}%`, background: 'linear-gradient(90deg, #10B981, #22D3EE)' } as any} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' } as any}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{br.calories} kcal</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{br.distance_km} km</span></div>
      </div>
      <div data-testid="sleep-card-dash" onClick={() => router.push('/sleep' as any)} style={{ padding: '16px', borderRadius: 22, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-moon-line" style={{ fontSize: 14, color: '#A78BFA' }} /></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sommeil</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>{sl.duration}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 } as any}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Qualite</span><span style={{ fontSize: 12, fontWeight: 800, color: '#A78BFA' }}>{sl.quality}%</span></div>
        <div style={{ display: 'flex', gap: 3, height: 6, borderRadius: 3, overflow: 'hidden' } as any}><div style={{ flex: 30, background: '#6D28D9', borderRadius: '3px 0 0 3px' } as any} /><div style={{ flex: 55, background: '#A78BFA' } as any} /><div style={{ flex: 15, background: '#C4B5FD', borderRadius: '0 3px 3px 0' } as any} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 } as any}>{[{ l: 'Prof.', c: '#6D28D9' }, { l: 'Leger', c: '#A78BFA' }, { l: 'REM', c: '#C4B5FD' }].map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 } as any}><span style={{ width: 5, height: 5, borderRadius: '50%', background: s.c } as any} /><span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{s.l}</span></div>))}</div>
      </div>
    </div>
  );
}
