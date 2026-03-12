import React, { useState, useEffect, useRef } from 'react';
import NoraCard from '../../components/shared/NoraCard';

interface Props {
  bioAge?: number;
  realAge?: number;
  status: string;
  statusColor: string;
  ai: any;
  subs: any;
  showDetail: boolean;
  setShowDetail: (v: boolean) => void;
  d: any;
  bodyAgeNora?: any;
  agingRate?: { rate: number; label: string; color: string; bio_age?: number; real_age?: number; diff?: number } | null;
}

export default function HeroScore({ bioAge, realAge, status, statusColor, ai, subs, showDetail, setShowDetail, d, bodyAgeNora, agingRate }: Props) {
  const ba = bioAge || 0;
  const ra = realAge || 0;
  const diff = ra > 0 && ba > 0 ? ra - ba : 0;
  const isNoraComputed = bodyAgeNora?.status === 'computed';
  const ar = agingRate;

  return (
    <>
      {/* ═══ BIO AGE ═══ */}
      <div style={{ textAlign: 'center', padding: '24px 20px 8px' } as any}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px 6px 6px', borderRadius: 999, background: '#000', marginBottom: 14 } as any}>
          <video autoPlay loop muted playsInline src="https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4" style={{ width: 26, height: 26, borderRadius: 13, objectFit: 'cover', flexShrink: 0 } as any} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#FFF', textTransform: 'uppercase', letterSpacing: 1.2 }}>Age biologique</span>
        </div>
        {ba > 0 ? (
          <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ba}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>ans</span></div>
        ) : (
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>En cours d'analyse...</div>
        )}
        {diff !== 0 && ba > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 999, background: diff > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${diff > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, marginTop: 10 } as any}>
            <i className={diff > 0 ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} style={{ fontSize: 12, color: diff > 0 ? '#10B981' : '#EF4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: diff > 0 ? '#10B981' : '#EF4444' }}>{Math.abs(diff)} ans {diff > 0 ? 'de moins' : 'de plus'}</span>
          </div>
        )}
      </div>

      {/* ═══ AGING RATE GAUGE ═══ */}
      {ar && ar.rate > 0 && (
        <div style={{ padding: '20px 24px 16px' } as any}>
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Rythme de vieillissement</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ar.rate.toFixed(1).replace('.', ',')}x</div>
          </div>
          <div style={{ position: 'relative', margin: '0 6px' } as any}>
            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)' } as any} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Lent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Rapide</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' } as any} />
              </div>
            </div>
            {/* Tick marks */}
            <svg viewBox="0 0 400 28" style={{ width: '100%', height: 28, display: 'block' }}>
              {Array.from({ length: 60 }, (_, i) => {
                const x = 6 + (i / 59) * 388;
                const distFromCenter = Math.abs(i - 29.5) / 29.5;
                const h = 8 + (1 - distFromCenter) * 12;
                const opacity = 0.12 + (1 - distFromCenter) * 0.22;
                return <rect key={i} x={x - 1} y={14 - h / 2} width={2} height={h} rx={1} fill={`rgba(255,255,255,${opacity})`} />;
              })}
              {(() => {
                const pct = ar.rate <= 1.0
                  ? ((ar.rate - 0.1) / 0.9) * 50
                  : 50 + ((ar.rate - 1.0) / 2.0) * 50;
                const cx = 6 + Math.max(0, Math.min(100, pct)) / 100 * 388;
                return <rect x={cx - 2} y={0} width={4} height={28} rx={2} fill="#FFF" />;
              })()}
            </svg>
            {/* Scale */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 } as any}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>-0,1x</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>1,0x</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>3,0x</span>
            </div>
          </div>
        </div>
      )}

      {/* Button only — no text below */}
      <div style={{ textAlign: 'center', padding: '6px 20px 20px' } as any}>
        <div onClick={() => setShowDetail(true)} style={{ padding: '12px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
          <i className="ri-body-scan-line" style={{ fontSize: 16, color: '#FFF' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Comprendre mon corps</span>
        </div>
      </div>

      {/* ═══ POPUP "Comprendre mon corps" — refonte ═══ */}
      {showDetail && (
        <div onClick={() => setShowDetail(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.5)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
              <div onClick={() => setShowDetail(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ba}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>ans</span></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Age biologique · {ra} ans age reel</div>
              {ar && ar.rate > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: `${ar.color}15`, border: `1px solid ${ar.color}25`, marginTop: 10 } as any}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: ar.color }}>{ar.rate.toFixed(1).replace('.', ',')}x</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{ar.label}</span>
                </div>
              )}
            </div>

            {/* Subscores — unique design, 1 per row, no cards */}
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Vos indicateurs</div>
              {Object.values(subs).map((s: any) => {
                const sc = s.score;
                const col = sc >= 80 ? '#10B981' : sc >= 60 ? '#F59E0B' : '#EF4444';
                const label = sc >= 80 ? 'Excellent' : sc >= 60 ? 'Bon' : sc < 40 ? 'Faible' : 'A surveiller';
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: `${col}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={s.icon} style={{ fontSize: 17, color: col }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{s.label}</div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', marginTop: 6, overflow: 'hidden' } as any}>
                        <div style={{ height: 4, borderRadius: 2, width: `${sc}%`, background: `linear-gradient(90deg, ${col}80, ${col})` } as any} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: col, lineHeight: 1 }}>{sc}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nora explanation — fond noir, video premium */}
            {isNoraComputed && bodyAgeNora?.explanation && (
              <NoraCard text={bodyAgeNora.explanation} />
            )}

            {/* Positive/Negative factors */}
            {bodyAgeNora?.factors_positive?.length > 0 && (
              <div style={{ borderRadius: 20, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', padding: '16px', marginBottom: 14 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Points forts</div>
                {bodyAgeNora.factors_positive.map((f: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' } as any}>
                    <i className="ri-check-line" style={{ fontSize: 14, color: '#10B981' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {bodyAgeNora?.factors_negative?.length > 0 && (
              <div style={{ borderRadius: 20, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)', padding: '16px', marginBottom: 14 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>A ameliorer</div>
                {bodyAgeNora.factors_negative.map((f: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' } as any}>
                    <i className="ri-alert-line" style={{ fontSize: 14, color: '#F59E0B' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI hero line */}
            {ai.hero_line && (
              <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{ai.hero_line}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
