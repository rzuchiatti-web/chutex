import React from 'react';

interface Props { bioAge?: number; realAge?: number; status: string; statusColor: string; ai: any; subs: any; showDetail: boolean; setShowDetail: (v: boolean) => void; d: any; }

export default function HeroScore({ bioAge, realAge, status, statusColor, ai, subs, showDetail, setShowDetail, d }: Props) {
  const ba = bioAge || 63;
  const ra = realAge || 68;
  const diff = ra - ba;
  return (
    <>
      <div style={{ textAlign: 'center', padding: '24px 20px 18px', borderRadius: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Age biologique</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ba}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>ans</span></div>
        {diff !== 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 999, background: diff > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${diff > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, marginTop: 10 } as any}>
            <i className={diff > 0 ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} style={{ fontSize: 12, color: diff > 0 ? '#10B981' : '#EF4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: diff > 0 ? '#10B981' : '#EF4444' }}>{Math.abs(diff)} ans {diff > 0 ? 'de moins' : 'de plus'} que votre age reel</span>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 1.5 }}>{ai.hero_line || ''}</div>
        <div onClick={() => setShowDetail(true)} style={{ marginTop: 14, padding: '12px 20px', borderRadius: 999, background: '#FFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 } as any}>
          <i className="ri-body-scan-line" style={{ fontSize: 16, color: '#111' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Comprendre mon corps</span>
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
                  <i className={s.icon} style={{ fontSize: 13, color: s.color }} /><span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label} {s.score}/100</span>
                </div>
              ))}
            </div>
            {ai.score_explain_up && (<div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 8 } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } as any}><i className="ri-arrow-up-circle-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Points forts</span></div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{ai.score_explain_up}</div></div>)}
            {ai.score_explain_down && (<div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', marginBottom: 8 } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } as any}><i className="ri-alert-line" style={{ fontSize: 14, color: '#F59E0B' }} /><span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>A surveiller</span></div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{ai.score_explain_down}</div></div>)}
            {ai.correlations && ai.correlations.length > 0 && (<div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Correlations</div>{ai.correlations.map((c: string, i: number) => (<div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}><i className="ri-links-line" style={{ fontSize: 13, color: 'rgba(167,139,250,0.4)', marginTop: 2, flexShrink: 0 }} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{c}</div></div>))}</div>)}
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Donnees detaillees</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
              {[
                { label: 'FC', value: `${d.heart_rate || 72} bpm`, color: '#EF4444', icon: 'ri-heart-pulse-line' },
                { label: 'SpO2', value: `${d.spo2 || 97}%`, color: '#38BDF8', icon: 'ri-drop-line' },
                { label: 'Tension', value: `${d.blood_pressure?.systolic || 125}/${d.blood_pressure?.diastolic || 78}`, color: '#A78BFA', icon: 'ri-pulse-line' },
                { label: 'HRV', value: `${d.hrv || 48} ms`, color: '#22D3EE', icon: 'ri-rhythm-line' },
                { label: 'Stress', value: `${d.stress_level || 35}/100`, color: '#F59E0B', icon: 'ri-mental-health-line' },
                { label: 'Recuperation', value: `${d.recovery_score || 78}/100`, color: '#10B981', icon: 'ri-battery-charge-line' },
                { label: 'VO2max', value: `${d.vo2_max || 32}`, color: '#F97316', icon: 'ri-run-line' },
                { label: 'Temperature', value: `${d.temperature || 36.6}C`, color: '#F59E0B', icon: 'ri-temp-hot-line' },
              ].map((m, i) => (<div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } as any}><i className={m.icon} style={{ fontSize: 12, color: m.color }} /><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{m.label}</span></div><div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{m.value}</div></div>))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
