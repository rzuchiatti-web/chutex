import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';

const portalMount = (node: React.ReactNode) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};

interface Props { onClose: () => void; d?: any; weighings?: any[]; }

const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
const VIDEO_BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/8h3820je_dna%281%29.webm';
const SCALE_SVCS = ['0000fff0-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb'];

function parseWeight(bytes: Uint8Array): { weight: number; impedance: number; stable: boolean; hasImpedance: boolean; rawHex: string } | null {
  if (bytes.length < 3) return null;
  const rawHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
  let weight = 0;
  let impedance = 0;
  let stable = false;
  let hasImpedance = false;

  // CF597/Lefu 8-electrode protocol: weight at bytes[3-4] LITTLE-ENDIAN / 100
  if (bytes.length >= 10 && bytes[0] === 0xCF) {
    const raw = bytes[3] | (bytes[4] << 8); // little-endian
    const w = raw / 100;
    if (w >= 3 && w <= 250) {
      weight = Math.round(w * 10) / 10;
    }
    stable = bytes[4] !== 0 || (bytes[0] & 0x20) !== 0;
    // Impedance data comes in longer packets (>20 bytes) when handle is held
    if (bytes.length >= 20) {
      hasImpedance = true;
      impedance = (bytes[10] << 8) | bytes[11];
    }
  }
  // Fallback for other Lefu models: try bytes[8-9] / 5 first
  else if (bytes.length >= 10) {
    const raw89 = (bytes[8] << 8) | bytes[9];
    const w89 = raw89 / 5;
    if (w89 >= 3 && w89 <= 250) {
      weight = Math.round(w89 * 10) / 10;
    }
  }

  // Generic fallback: scan all positions
  if (weight < 3 || weight > 300) {
    for (let i = 1; i <= bytes.length - 2; i++) {
      const be = (bytes[i] << 8) | bytes[i + 1];
      for (const div of [5, 10, 100]) {
        const w = be / div;
        if (w >= 10 && w <= 250) {
          weight = Math.round(w * 10) / 10;
          break;
        }
      }
      if (weight >= 10) break;
    }
  }

  if (weight < 3 || weight > 300) return null;
  return { weight, impedance, stable, hasImpedance, rawHex };
}

export default function WeighingFlow({ onClose, d = {}, weighings = [] }: Props) {
  const { t } = useI18n();
  const { token } = useAuth();
  const router = useRouter();
  // Steps: 1=instructions, 2=scanning/connecting, 3=stabilizing weight (live), 4=handle popup, 5=analyzing (countdown), 6=results
  const [step, setStep] = useState(1);
  const [bleStatus, setBleStatus] = useState<'idle' | 'scanning' | 'connecting' | 'connected' | 'error'>('idle');
  const [bleError, setBleError] = useState('');
  const [liveWeight, setLiveWeight] = useState(0);
  const [stableWeight, setStableWeight] = useState(0);
  const [impedance, setImpedance] = useState(0);
  const [hasImpedance, setHasImpedance] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [rawDebug, setRawDebug] = useState('');
  const deviceRef = useRef<any>(null);
  const weightsRef = useRef<number[]>([]);
  const stableTimerRef = useRef<any>(null);
  const lastWeightRef = useRef(0);
  const lastPacketTimeRef = useRef(Date.now());
  const stableCountRef = useRef(0);

  // Detect weight stabilization (step 3 → step 5 auto-analysis)
  useEffect(() => {
    if (step !== 3) return;
    stableCountRef.current = 0;
    const iv = setInterval(() => {
      const w = lastWeightRef.current;
      if (w > 3) {
        const prevW = weightsRef.current.length >= 2 ? weightsRef.current[weightsRef.current.length - 2] : 0;
        const diff = Math.abs(w - prevW);
        if (diff < 0.3 && prevW > 0) {
          stableCountRef.current++;
          if (stableCountRef.current >= 3) { // stable for 3 seconds
            clearInterval(iv);
            setStableWeight(w);
            setStep(5); // auto-launch body analysis
          }
        } else {
          stableCountRef.current = 0;
        }
      }
    }, 1000);
    // Fallback: after 45s force stabilize
    const timeout = setTimeout(() => {
      clearInterval(iv);
      if (lastWeightRef.current > 3) {
        setStableWeight(lastWeightRef.current);
        setStep(5);
      }
    }, 45000);
    return () => { clearInterval(iv); clearTimeout(timeout); };
  }, [step]);

  // Analysis phase (step 5): wait for BLE disconnection OR packet silence
  useEffect(() => {
    if (step !== 5) return;
    lastPacketTimeRef.current = Date.now();
    const startTime = Date.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(iv);
      finalizeMeasurement();
    };

    // Listen for device disconnection (balance turns off)
    const bd = deviceRef.current;
    const onDisconnect = () => setTimeout(finish, 500);
    if (bd?.addEventListener) {
      try { bd.addEventListener('gattserverdisconnected', onDisconnect); } catch {}
    }

    // Also check for packet silence (balance finished but stayed connected)
    const iv = setInterval(() => {
      if (done) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const silenceMs = Date.now() - lastPacketTimeRef.current;
      setCountdown(elapsed);
      // After 30s minimum, if 20s without any BLE packet = balance done
      if (elapsed > 30 && silenceMs > 20000) { finish(); return; }
      // Hard timeout 180s
      if (elapsed >= 180) finish();
    }, 500);

    return () => {
      clearInterval(iv);
      if (bd?.removeEventListener) {
        try { bd.removeEventListener('gattserverdisconnected', onDisconnect); } catch {}
      }
    };
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
                  lastWeightRef.current = parsed.weight;
                  weightsRef.current.push(parsed.weight);
                  if (parsed.impedance > 0) setImpedance(parsed.impedance);
                  if (parsed.hasImpedance) setHasImpedance(true);
                  if (parsed.stable) setStableWeight(parsed.weight);
                  setRawDebug(`${bytes.length}B: ${parsed.rawHex} → ${parsed.weight}kg${parsed.hasImpedance ? ' +IMP' : ''}`);
                  lastPacketTimeRef.current = Date.now();
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
        setStep(3); // Go to weight stabilization phase
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
      setStep(6);
    } catch (e: any) {
      setResult({ weight: finalWeight });
      setStep(6);
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

  return portalMount(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99990, overflow: 'hidden' } as any}>
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
            <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg" alt="Balance Vita" style={{ width: 100, height: 100, objectFit: 'contain', display: 'block', margin: '0 auto 20px', filter: 'drop-shadow(0 8px 24px rgba(167,139,250,0.3))' } as any} />
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

        {/* ── STEP 3: Weight Stabilization (live weight) ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Stabilisation du poids...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Restez immobile sur la balance</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1, minHeight: 90 } as any}>
              {liveWeight > 0 ? <>{liveWeight}<span style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}> kg</span></> : <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.3)' }}>En attente...</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 } as any}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: '#A78BFA', opacity: 0.5, animation: `pulse 1.2s ${i*0.3}s infinite` } as any} />)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Le poids se stabilise automatiquement...</div>
            <div onClick={closeAndCleanup} style={{ marginTop: 24, padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Annuler</div>
            {rawDebug && <div style={{ marginTop: 12, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-all', maxWidth: 340, margin: '12px auto 0' } as any}>DEBUG: {rawDebug}</div>}
          </div>
        )}

        {/* ── STEP 5: Full Body Analysis ── */}
        {step === 5 && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
            <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src={VIDEO_BG} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px' } as any}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Analyse corporelle</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Maintenez le manche et restez immobile</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', marginBottom: 28 }}>{stableWeight}<span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }}> kg</span></div>

              {/* Pulsing scan circle */}
              <div style={{ width: 100, height: 100, margin: '0 auto 28px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '2px solid rgba(255,255,255,0.15)', animation: 'scanPulse 2s ease-out infinite' } as any} />
                <div style={{ position: 'absolute', inset: 10, borderRadius: 999, border: '2px solid rgba(255,255,255,0.1)', animation: 'scanPulse 2s ease-out infinite 0.5s' } as any} />
                <div style={{ position: 'absolute', inset: 20, borderRadius: 999, border: '2px solid rgba(255,255,255,0.08)', animation: 'scanPulse 2s ease-out infinite 1s' } as any} />
                <div style={{ width: 10, height: 10, borderRadius: 5, background: '#FFF' } as any} />
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Analyse en cours...</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 28 }}>{countdown}s</div>

              <div onClick={closeAndCleanup} style={{ padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Annuler</div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes scanPulse{0%{transform:scale(1);opacity:0.4}100%{transform:scale(1.8);opacity:0}}' }} />
          </div>
        )}

        {/* ── STEP 6: Results ── */}
        {step === 6 && (() => {
          const w = result?.weight || stableWeight || liveWeight || 0;
          const r = result?.data || result || {};
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 20, marginBottom: 20 } as any}>
                {[
                  { label: 'IMC', value: r.bmi || result?.bmi, unit: '', color: '#6366F1', icon: 'ri-scales-2-line' },
                  { label: 'Graisse', value: r.body_fat_pct || result?.body_fat_pct, unit: '%', color: '#F59E0B', icon: 'ri-drop-line' },
                  { label: 'Muscle', value: r.muscle_pct || (result?.muscle_mass ? Math.round(result.muscle_mass / w * 100 * 10) / 10 : 0), unit: '%', color: '#10B981', icon: 'ri-heart-pulse-line' },
                  { label: 'Hydratation', value: r.water_pct || result?.hydration_pct, unit: '%', color: '#38BDF8', icon: 'ri-drop-fill' },
                  { label: 'Masse osseuse', value: r.bone_mass_kg || result?.bone_mass, unit: 'kg', color: '#A78BFA', icon: 'ri-shield-line' },
                  { label: 'Graisse visc.', value: r.visceral_fat || result?.visceral_fat, unit: '', color: '#EF4444', icon: 'ri-fire-line' },
                  { label: 'Metabolisme', value: r.basal_metabolism || result?.basal_metabolism, unit: 'kcal', color: '#F97316', icon: 'ri-flashlight-line' },
                  { label: 'Proteines', value: r.protein_pct || result?.protein_pct, unit: '%', color: '#14B8A6', icon: 'ri-leaf-line' },
                  { label: 'Age corporel', value: r.body_age || result?.body_age, unit: 'ans', color: '#8B5CF6', icon: 'ri-time-line', nora: true },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '10px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' } as any}>
                    <i className={m.icon} style={{ fontSize: 14, color: m.color, display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 16, fontWeight: 900, color: m.value ? m.color : 'rgba(255,255,255,0.15)' }}>{m.value || '--'}{m.value ? <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span> : ''}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{m.label}</div>
                    {(m as any).nora && !m.value && (
                      <div style={{ position: 'absolute', top: 4, right: 4, padding: '1px 5px', borderRadius: 4, background: 'rgba(167,139,250,0.15)', fontSize: 7, fontWeight: 700, color: '#A78BFA' }}>Nora</div>
                    )}
                  </div>
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
