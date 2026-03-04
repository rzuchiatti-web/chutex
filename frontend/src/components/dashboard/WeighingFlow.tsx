import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';

interface Props { onClose: () => void; d?: any; weighings?: any[]; }

const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
const VIDEO_BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/8h3820je_dna%281%29.webm';
const SCALE_SVCS = ['0000fff0-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb'];

function parseWeight(bytes: Uint8Array): { weight: number; impedance: number; stable: boolean } | null {
  if (bytes.length < 3) return null;
  let weight = 0;
  let impedance = 0;
  let stable = false;

  // Try multiple byte positions and divisors
  const candidates: { w: number; imp: number; s: boolean }[] = [];

  // Position: bytes 15-16 (QN-Scale long packet)
  if (bytes.length >= 17) {
    const raw = (bytes[15] << 8) | bytes[16];
    candidates.push({ w: raw / 10, imp: 0, s: (bytes[0] & 0x20) !== 0 || (bytes[0] & 0x10) !== 0 });
    candidates.push({ w: raw / 100, imp: 0, s: (bytes[0] & 0x20) !== 0 });
    if (bytes.length >= 19) {
      const imp = (bytes[17] << 8) | bytes[18];
      if (imp >= 100 && imp <= 2000) {
        candidates[0].imp = imp;
        candidates[1].imp = imp;
      }
    }
  }
  // Position: bytes 3-4
  if (bytes.length >= 5) {
    const raw = (bytes[3] << 8) | bytes[4];
    candidates.push({ w: raw / 10, imp: 0, s: (bytes[0] & 0x20) !== 0 });
    candidates.push({ w: raw / 100, imp: 0, s: (bytes[0] & 0x20) !== 0 });
  }
  // Position: bytes 1-2
  if (bytes.length >= 3) {
    const raw = (bytes[1] << 8) | bytes[2];
    candidates.push({ w: raw / 10, imp: 0, s: true });
    candidates.push({ w: raw / 100, imp: 0, s: true });
  }

  // Pick the best candidate: weight in 20-250 kg range
  for (const c of candidates) {
    if (c.w >= 20 && c.w <= 250) {
      weight = Math.round(c.w * 10) / 10;
      impedance = c.imp;
      stable = c.s;
      break;
    }
  }

  if (weight < 2 || weight > 300) return null;
  return { weight, impedance, stable };
}

export default function WeighingFlow({ onClose, d = {}, weighings = [] }: Props) {
  const { t } = useI18n();
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bleStatus, setBleStatus] = useState<'idle' | 'scanning' | 'connecting' | 'connected' | 'error'>('idle');
  const [bleError, setBleError] = useState('');
  const [liveWeight, setLiveWeight] = useState(0);
  const [stableWeight, setStableWeight] = useState(0);
  const [impedance, setImpedance] = useState(0);
  const [countdown, setCountdown] = useState(15);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const deviceRef = useRef<any>(null);
  const weightsRef = useRef<number[]>([]);

  // Countdown timer when connected (step 3)
  useEffect(() => {
    if (step !== 3) return;
    setCountdown(15);
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(iv);
          finalizeMeasurement();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [step]);

  const startBleScan = async () => {
    setStep(2);
    setBleStatus('scanning');
    setBleError('');

    const hasWebBle = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    if (!hasWebBle) {
      setBleStatus('error');
      setBleError('Web Bluetooth non disponible. Utilisez Chrome sur ordinateur ou l\'app mobile.');
      return;
    }

    try {
      const nav = navigator as any;
      const bd = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SCALE_SVCS });
      setBleStatus('connecting');
      setBleError(`Connexion a ${bd.name || 'balance'}...`);

      const server = await bd.gatt.connect();
      deviceRef.current = bd;
      let notifyStarted = false;

      for (const svcUuid of SCALE_SVCS) {
        try {
          const svc = await server.getPrimaryService(svcUuid);
          const chars = await svc.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) {
              await c.startNotifications();
              c.addEventListener('characteristicvaluechanged', (event: any) => {
                const dv = event.target.value as DataView;
                const bytes = new Uint8Array(dv.buffer);
                const parsed = parseWeight(bytes);
                if (parsed && parsed.weight >= 2) {
                  setLiveWeight(parsed.weight);
                  weightsRef.current.push(parsed.weight);
                  if (parsed.impedance > 0) setImpedance(parsed.impedance);
                  if (parsed.stable) setStableWeight(parsed.weight);
                }
              });
              notifyStarted = true;
            }
          }
        } catch {}
      }

      if (notifyStarted) {
        setBleStatus('connected');
        setBleError('');
        setStep(3); // Start countdown with live weight
      } else {
        setBleStatus('error');
        setBleError('Service de pesee non trouve sur cet appareil.');
      }
    } catch (e: any) {
      if (e.name === 'NotFoundError' || e.message?.includes('cancelled')) {
        setBleStatus('idle');
        setStep(1);
      } else {
        setBleStatus('error');
        setBleError(e.message || 'Erreur de connexion Bluetooth');
      }
    }
  };

  const finalizeMeasurement = async () => {
    const weights = weightsRef.current;
    const finalWeight = stableWeight > 0 ? stableWeight : (weights.length > 0 ? weights[weights.length - 1] : liveWeight);

    if (finalWeight < 2) {
      setBleStatus('error');
      setBleError('Aucune mesure recue. Montez sur la balance pieds nus.');
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/devices/scale/ble-measurement', {
        method: 'POST',
        body: JSON.stringify({ weight: finalWeight, impedance }),
      }, token);

      // Associate scale device
      if (deviceRef.current?.id) {
        await apiFetch('/api/devices/associate', {
          method: 'POST',
          body: JSON.stringify({ device_type: 'scale', mac_address: deviceRef.current.id }),
        }, token).catch(() => {});
      }

      setResult(res || { weight: finalWeight });
      setStep(4);
    } catch (e: any) {
      setResult({ weight: finalWeight });
      setStep(4);
    } finally {
      setSaving(false);
      // Disconnect
      try { deviceRef.current?.gatt?.disconnect(); } catch {}
    }
  };

  const closeAndCleanup = () => {
    try { deviceRef.current?.gatt?.disconnect(); } catch {}
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, overflow: 'hidden' } as any}>
      <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={closeAndCleanup} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>

        {/* ── STEP 1: Instructions ── */}
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
            <div data-testid="weighing-ready-btn" onClick={startBleScan} style={{ marginTop: 20, padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF' } as any}>{t('weighing_ready')}</div>
          </div>
        )}

        {/* ── STEP 2: Scanning / Connecting ── */}
        {step === 2 && (
          <div style={{ textAlign: 'center' } as any}>
            {bleStatus === 'error' ? (
              <>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}><i className="ri-error-warning-line" style={{ fontSize: 30, color: '#EF4444' }} /></div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Erreur de connexion</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>{bleError}</div>
                <div onClick={startBleScan} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 10 } as any}><i className="ri-refresh-line" style={{ marginRight: 8 }} />Reessayer</div>
                <div onClick={() => { setStep(1); setBleStatus('idle'); }} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' } as any}>Retour</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 20 }}>{bleStatus === 'connecting' ? 'Connexion...' : 'Recherche de la balance...'}</div>
                <div style={{ width: 60, height: 60, borderRadius: 999, border: '3px solid rgba(167,139,250,0.3)', borderTopColor: '#A78BFA', margin: '0 auto 20px', animation: 'spin 1s linear infinite' } as any} />
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{bleError || 'Selectionnez votre balance dans la popup Bluetooth'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 24 }}>Assurez-vous que la balance est allumee et a proximite</div>
                <div onClick={closeAndCleanup} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Live Measurement (15s countdown) ── */}
        {step === 3 && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
            <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src={VIDEO_BG} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>{t('weighing_measuring')}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>{t('weighing_stay_still')}</div>

              {/* Live weight display */}
              <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', marginBottom: 6, lineHeight: 1, minHeight: 80 } as any}>
                {liveWeight > 0 ? (
                  <>{liveWeight}<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}> kg</span></>
                ) : (
                  <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.3)' }}>En attente...</span>
                )}
              </div>
              {liveWeight > 0 && stableWeight > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', marginBottom: 16 } as any}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Poids stable</span>
                </div>
              )}

              {/* Timer ring */}
              <div style={{ width: 100, height: 100, borderRadius: 50, border: '3px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto 20px', position: 'relative' } as any}>
                <svg width="100" height="100" style={{ position: 'absolute', top: -1.5, left: -1.5, transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="48" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray={`${(1 - countdown / 15) * 301} 301`} strokeLinecap="round" />
                </svg>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>
                  {countdown}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>s</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 } as any}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: '#FFF', opacity: 0.4, animation: `pulse 1.2s ${i*0.3}s infinite` } as any} />)}
              </div>
              <div onClick={closeAndCleanup} style={{ marginTop: 24, padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Annuler la pesee</div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}' }} />
          </div>
        )}

        {/* ── STEP 4: Results ── */}
        {step === 4 && (() => {
          const w = result?.weight || stableWeight || liveWeight || 0;
          const r = result || {};
          const historyData = [...weighings.slice(0, 9).map((h: any) => h.weight || 0).reverse(), w].filter(v => v > 0);
          const hasHistory = historyData.length > 1;
          const prevWeight = weighings.length > 0 ? weighings[0].weight : 0;
          const diff = prevWeight > 0 ? w - prevWeight : 0;
          return (
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 28, color: '#10B981' }} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 16 }}>{t('weighing_done')}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{w}<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}> kg</span></div>
              {Math.abs(diff) > 0.05 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 14px', borderRadius: 999, background: diff > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', marginBottom: 8 } as any}>
                  <i className={diff > 0 ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 14, color: diff > 0 ? '#EF4444' : '#10B981' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: diff > 0 ? '#EF4444' : '#10B981' }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)} kg</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20, marginBottom: 20 } as any}>
                {[
                  { label: 'Graisse', value: r.body_fat_pct ? `${r.body_fat_pct}%` : '--', color: '#F59E0B' },
                  { label: 'Muscle', value: r.muscle_pct ? `${r.muscle_pct}%` : '--', color: '#10B981' },
                  { label: 'Hydratation', value: r.water_pct ? `${r.water_pct}%` : '--', color: '#38BDF8' },
                  { label: 'IMC', value: r.bmi ? `${r.bmi}` : '--', color: '#A78BFA' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } as any}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{m.label}</div><div style={{ fontSize: 18, fontWeight: 900, color: m.value === '--' ? 'rgba(255,255,255,0.2)' : m.color }}>{m.value}</div></div>
                ))}
              </div>

              {/* Mini trend chart */}
              {hasHistory && (() => {
                const cW = 320, cH = 80;
                const min = Math.min(...historyData) - 0.5, max = Math.max(...historyData) + 0.5;
                const range = max - min || 1;
                const pts = historyData.map((v, i) => `${(i / (historyData.length - 1)) * cW},${cH - 6 - ((v - min) / range) * (cH - 12)}`).join(' ');
                const lastX = cW, lastY = cH - 6 - ((historyData[historyData.length - 1] - min) / range) * (cH - 12);
                return (
                  <div data-testid="weight-trend-chart" style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                      <i className="ri-line-chart-line" style={{ fontSize: 13, color: '#A78BFA' }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Tendance</span>
                    </div>
                    <svg width="100%" viewBox={`0 0 ${cW} ${cH}`} style={{ overflow: 'visible' }}>
                      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A78BFA" stopOpacity="0.2" /><stop offset="100%" stopColor="#A78BFA" stopOpacity="0" /></linearGradient></defs>
                      <polygon points={`0,${cH} ${pts} ${cW},${cH}`} fill="url(#wg)" />
                      <polyline points={pts} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={lastX} cy={lastY} r="4" fill="#A78BFA" stroke="#FFF" strokeWidth="2" />
                    </svg>
                  </div>
                );
              })()}

              <div onClick={() => { closeAndCleanup(); router.push({ pathname: '/weighing-report' as any, params: { id: 'w-0' } }); }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF' } as any}>{t('weighing_report')}</div>
            </div>
          );
        })()}
      </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
