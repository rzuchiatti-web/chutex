import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

interface Props { onClose: () => void; d?: any; weighings?: any[]; }

export default function WeighingFlow({ onClose, d = {}, weighings = [] }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (step !== 3) return;
    setCountdown(15);
    const iv = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(iv); setStep(4); return 0; } return c - 1; }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, overflow: 'hidden' } as any}>
      <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>

        {step === 1 && (
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(167,139,250,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any}><i className="ri-scales-3-line" style={{ fontSize: 34, color: '#A78BFA' }} /></div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>{t('weighing_title')}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>{t('weighing_subtitle')}</div>
            {[
              { icon: 'ri-layout-bottom-line', text: t('weighing_step1') },
              { icon: 'ri-footprint-line', text: t('weighing_step2') },
              { icon: 'ri-hand-heart-line', text: t('weighing_step3') },
              { icon: 'ri-timer-line', text: t('weighing_step4') },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 8, textAlign: 'left' } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={s.icon} style={{ fontSize: 18, color: '#A78BFA' }} /></div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.text}</span>
              </div>
            ))}
            <div onClick={() => setStep(3)} style={{ marginTop: 20, padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF' } as any}>{t('weighing_ready')}</div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 20 }}>{t('weighing_searching')}</div>
            <div style={{ width: 60, height: 60, borderRadius: 999, border: '3px solid rgba(56,189,248,0.3)', borderTopColor: '#38BDF8', margin: '0 auto 20px', animation: 'spin 1s linear infinite' } as any} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Activez le Bluetooth et montez sur la balance</div>
            <div onClick={onClose} style={{ marginTop: 24, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
          </div>
        )}

        {step === 3 && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
            <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/8h3820je_dna%281%29.webm" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>{t('weighing_measuring')}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>{t('weighing_stay_still')}</div>
              {/* Timer ring 15s with real-time countdown */}
              <div style={{ width: 140, height: 140, borderRadius: 70, border: '3px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' } as any}>
                <svg width="140" height="140" style={{ position: 'absolute', top: -1.5, left: -1.5, transform: 'rotate(-90deg)', animation: 'weighTimer 15s linear forwards' }}>
                  <circle cx="70" cy="70" r="68" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="0 427" strokeLinecap="round">
                    <animate attributeName="stroke-dasharray" from="0 427" to="427 427" dur="15s" fill="freeze" />
                  </circle>
                </svg>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>
                  {countdown}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>s</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 } as any}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: '#FFF', opacity: 0.4, animation: `pulse 1.2s ${i*0.3}s infinite` } as any} />)}
              </div>
              <div onClick={() => { setStep(1); }} style={{ marginTop: 32, padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Annuler la pesee</div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}' }} />
          </div>
        )}

        {step === 4 && (() => {
          const w = d.weight || 72.4;
          const historyData = [...weighings.slice(0, 9).map((h: any) => h.weight || 0).reverse(), w];
          const hasHistory = historyData.length > 1;
          return (
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 28, color: '#10B981' }} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 16 }}>{t('weighing_done')}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{w}<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}> kg</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20, marginBottom: 20 } as any}>
                {[{ label: 'Graisse', value: `${d.body_fat_pct || 22.3}%`, color: '#F59E0B' }, { label: 'Muscle', value: `${d.muscle_pct || 33.8}%`, color: '#10B981' }, { label: 'Hydratation', value: `${d.water_pct || 55.2}%`, color: '#38BDF8' }, { label: 'Metabolisme', value: `${d.basal_metabolism || 1550} kcal`, color: '#A78BFA' }].map((m, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{m.label}</div><div style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div></div>
                ))}
              </div>

              {/* Mini weight trend chart */}
              {hasHistory && (() => {
                const chartW = 320;
                const chartH = 90;
                const min = Math.min(...historyData) - 0.5;
                const max = Math.max(...historyData) + 0.5;
                const range = max - min || 1;
                const pts = historyData.map((v, i) => `${(i / (historyData.length - 1)) * chartW},${chartH - 8 - ((v - min) / range) * (chartH - 16)}`).join(' ');
                const fillPts = `0,${chartH} ${pts} ${chartW},${chartH}`;
                const lastIdx = historyData.length - 1;
                const lastX = chartW;
                const lastY = chartH - 8 - ((historyData[lastIdx] - min) / range) * (chartH - 16);
                const prevWeight = historyData.length > 1 ? historyData[lastIdx - 1] : w;
                const diff = w - prevWeight;
                return (
                  <div data-testid="weight-trend-chart" style={{ padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <i className="ri-line-chart-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>Tendance</span>
                      </div>
                      {Math.abs(diff) > 0.05 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: diff > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' } as any}>
                          <i className={diff > 0 ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 12, color: diff > 0 ? '#EF4444' : '#10B981' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: diff > 0 ? '#EF4444' : '#10B981' }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)} kg</span>
                        </div>
                      )}
                    </div>
                    <div style={{ width: '100%', maxWidth: chartW, margin: '0 auto' } as any}>
                      <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points={fillPts} fill="url(#wg)" />
                        <polyline points={pts} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={lastX} cy={lastY} r="5" fill="#A78BFA" stroke="#FFF" strokeWidth="2" />
                        {historyData.map((v, i) => i < lastIdx ? (
                          <circle key={i} cx={(i / (historyData.length - 1)) * chartW} cy={chartH - 8 - ((v - min) / range) * (chartH - 16)} r="2.5" fill="rgba(167,139,250,0.4)" />
                        ) : null)}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 } as any}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{historyData.length - 1} pesee{historyData.length > 2 ? 's' : ''} precedente{historyData.length > 2 ? 's' : ''}</span>
                      <span style={{ fontSize: 9, color: '#A78BFA', fontWeight: 700 }}>Aujourd'hui</span>
                    </div>
                  </div>
                );
              })()}

              <div onClick={() => { onClose(); router.push({ pathname: '/weighing-report' as any, params: { id: 'w-0' } }); }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF' } as any}>{t('weighing_report')}</div>
            </div>
          );
        })()}
      </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
