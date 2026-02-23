import React from 'react';

interface Props { score: number; status: string; statusColor: string; ai: any; subs: any; showDetail: boolean; setShowDetail: (v: boolean) => void; bioAge?: number; realAge?: number; }

export default function HeroScore({ score, status, statusColor, ai, subs, showDetail, setShowDetail, bioAge, realAge }: Props) {
  const ba = bioAge || 63;
  const ra = realAge || 68;
  const diff = ra - ba;
  return (
    <>
      {/* Score + BioAge header */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
        {/* Score circle */}
        <div style={{ flex: 1, padding: '18px', borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16 } as any}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 } as any}>
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}><circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" /><circle cx="36" cy="36" r="30" fill="none" stroke={statusColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(score / 100) * 188} 188`} style={{ transition: 'stroke-dasharray 1s' }} /></svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{score}</div><div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>score</div></div>
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: `${statusColor}18`, border: `1px solid ${statusColor}30`, marginBottom: 6 } as any}><span style={{ width: 5, height: 5, borderRadius: 3, background: statusColor } as any} /><span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{status}</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{ai.hero_line || ''}</div>
          </div>
        </div>
        {/* BioAge */}
        <div style={{ width: 110, padding: '18px 14px', borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Age biologique</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ba}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>ans</div>
          {diff > 0 && <div style={{ marginTop: 6, fontSize: 9, fontWeight: 700, color: '#10B981', padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.12)' }}>-{diff} ans vs reel</div>}
        </div>
      </div>

      <div onClick={() => setShowDetail(!showDetail)} style={{ textAlign: 'center', marginBottom: 14, fontSize: 11, color: 'rgba(79,195,247,0.6)', cursor: 'pointer', fontWeight: 600 } as any}><i className="ri-information-line" style={{ marginRight: 4 }} />Comprendre mon score</div>

      {showDetail && (
        <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 } as any}>
            {Object.values(subs).map((s: any) => (
              <div key={s.label} style={{ padding: '6px 12px', borderRadius: 999, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', gap: 6 } as any}>
                <i className={s.icon} style={{ fontSize: 12, color: s.color }} /><span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label} {s.score}</span>
              </div>
            ))}
          </div>
          {ai.score_explain_up && <div style={{ fontSize: 12, color: 'rgba(16,185,129,0.7)', marginBottom: 4 } as any}><i className="ri-arrow-up-line" style={{ marginRight: 4 }} />{ai.score_explain_up}</div>}
          {ai.score_explain_down && <div style={{ fontSize: 12, color: 'rgba(245,158,11,0.7)' } as any}><i className="ri-arrow-down-line" style={{ marginRight: 4 }} />{ai.score_explain_down}</div>}
        </div>
      )}
    </>
  );
}
