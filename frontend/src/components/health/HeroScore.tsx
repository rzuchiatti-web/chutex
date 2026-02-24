import React from 'react';

interface Props { bioAge?: number; realAge?: number; status: string; statusColor: string; ai: any; subs: any; showDetail: boolean; setShowDetail: (v: boolean) => void; d: any; }

export default function HeroScore({ bioAge, realAge, status, statusColor, ai, subs, showDetail, setShowDetail, d }: Props) {
  const ba = bioAge || 63;
  const ra = realAge || 68;
  const diff = ra - ba;
  return (
    <>
      {/* Bio age info — no card, floating on background */}
      <div style={{ textAlign: 'center', padding: '20px 20px 14px' } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Age biologique</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ba}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>ans</span></div>
        {diff !== 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 999, background: diff > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${diff > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, marginTop: 10 } as any}>
            <i className={diff > 0 ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} style={{ fontSize: 12, color: diff > 0 ? '#10B981' : '#EF4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: diff > 0 ? '#10B981' : '#EF4444' }}>{Math.abs(diff)} ans {diff > 0 ? 'de moins' : 'de plus'} que votre age reel</span>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 1.5 }}>{ai.hero_line || ''}</div>
        {/* Glass button */}
        <div onClick={() => setShowDetail(true)} style={{ marginTop: 14, padding: '12px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
          <i className="ri-body-scan-line" style={{ fontSize: 16, color: '#FFF' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Comprendre mon corps</span>
        </div>
      </div>

      {showDetail && (
        <div onClick={() => setShowDetail(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => setShowDetail(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-body-scan-line" style={{ fontSize: 26, color: '#A78BFA' }} /></div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Comprendre mon corps</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Analyse detaillee de vos indicateurs</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' } as any}>
              {Object.values(subs).map((s: any) => (
                <div key={s.label} style={{ padding: '8px 14px', borderRadius: 14, background: `${s.color}10`, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', gap: 6 } as any}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: s.score >= 80 ? '#10B981' : s.score >= 60 ? '#F59E0B' : '#EF4444' } as any} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: s.score >= 80 ? '#10B981' : s.score >= 60 ? '#F59E0B' : '#EF4444' }}>{s.score}</span>
                </div>
              ))}
            </div>
            {ai.analysis && <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Analyse IA</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{ai.analysis}</div></div>}
            {ai.recommendations && <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Recommandations</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{ai.recommendations}</div></div>}
          </div>
        </div>
      )}
    </>
  );
}
