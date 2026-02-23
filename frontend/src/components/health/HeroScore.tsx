import React from 'react';

interface Props { score: number; status: string; statusColor: string; ai: any; subs: any; showDetail: boolean; setShowDetail: (v: boolean) => void; }

export default function HeroScore({ score, status, statusColor, ai, subs, showDetail, setShowDetail }: Props) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px', borderRadius: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14 } as any}>
        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 } as any}>
          <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}><circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" /><circle cx="45" cy="45" r="38" fill="none" stroke={statusColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * 239} 239`} style={{ transition: 'stroke-dasharray 1s' }} /></svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}><div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{score}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>/100</div></div>
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${statusColor}20`, border: `1px solid ${statusColor}40`, marginBottom: 6 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: statusColor } as any} /><span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{status}</span></div>
          <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600, lineHeight: 1.4 }}>{ai.hero_line || ''}</div>
          <div onClick={() => setShowDetail(!showDetail)} style={{ marginTop: 8, fontSize: 11, color: 'rgba(79,195,247,0.7)', cursor: 'pointer', fontWeight: 600 } as any}><i className="ri-information-line" style={{ marginRight: 4 }} />Pourquoi ce score ?</div>
        </div>
      </div>
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
