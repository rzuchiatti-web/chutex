import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
const BRACELET_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';

const SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
const ECG_DURATION = 30;

function buildCmd(cmd: number, payload: number[] = []) {
  const pkt = new Uint8Array(16);
  pkt[0] = cmd;
  for (let i = 0; i < payload.length && i < 14; i++) pkt[i + 1] = payload[i];
  let crc = 0;
  for (let i = 0; i < 15; i++) crc += pkt[i];
  pkt[15] = crc & 0xFF;
  return pkt;
}

function buildECGStart() {
  const pkt = new Uint8Array(16);
  pkt[0] = 0x28; pkt[1] = 0x04; pkt[2] = 0x01;
  pkt[4] = 0x50; pkt[5] = 0xC3; pkt[6] = 0x01;
  let crc = 0; for (let i = 0; i < 15; i++) crc += pkt[i]; pkt[15] = crc & 0xFF;
  return pkt;
}
function buildECGStop() {
  const pkt = new Uint8Array(16);
  pkt[0] = 0x28; pkt[1] = 0x04; pkt[2] = 0x00; pkt[6] = 0x01;
  let crc = 0; for (let i = 0; i < 15; i++) crc += pkt[i]; pkt[15] = crc & 0xFF;
  return pkt;
}
function buildPPGEnable(on: boolean) {
  const pkt = new Uint8Array(16);
  pkt[0] = 0x07; pkt[1] = on ? 0x01 : 0x00;
  let crc = 0; for (let i = 0; i < 15; i++) crc += pkt[i]; pkt[15] = crc & 0xFF;
  return pkt;
}

export default function ECGScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=prep, 1=breathing, 2=finger, 3=connecting, 4=recording
  const [breathSec, setBreathSec] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale'|'exhale'>('inhale');
  const [recordSec, setRecordSec] = useState(0);
  const [ecgSamples, setEcgSamples] = useState<number[]>([]);
  const [bleError, setBleError] = useState('');
  const [liveHR, setLiveHR] = useState(0);
  const [braceletConnected, setBraceletConnected] = useState<boolean | null>(null);
  const deviceRef = useRef<any>(null);
  const writeCharRef = useRef<any>(null);
  const samplesRef = useRef<number[]>([]);
  const resultRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Check bracelet connection status via API on mount
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/bracelet/status', {}, token).then(data => {
      const connected = data?.connected || data?.paired || false;
      setBraceletConnected(connected);
    }).catch(() => setBraceletConnected(false));
  }, [token]);

  // Breathing animation (30s)
  useEffect(() => {
    if (step !== 1) return;
    setBreathSec(0);
    setBreathPhase('inhale');
    const iv = setInterval(() => {
      setBreathSec(p => {
        const next = p + 0.05;
        if (next >= 30) { clearInterval(iv); setStep(2); return 30; }
        const inCycle = next % 10;
        setBreathPhase(inCycle < 4 ? 'inhale' : 'exhale');
        return next;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [step]);

  // Recording timer
  useEffect(() => {
    if (step !== 4) return;
    setRecordSec(0);
    const iv = setInterval(() => {
      setRecordSec(p => {
        if (p >= ECG_DURATION) {
          clearInterval(iv);
          stopECG();
          return ECG_DURATION;
        }
        return p + 1;
      });
    }, 1000);
    timerRef.current = iv;
    return () => clearInterval(iv);
  }, [step]);

  const connectAndStartECG = useCallback(async () => {
    setStep(3);
    setBleError('');

    // Use native BLE bridge via postMessage (Web Bluetooth is NOT available in WKWebView)
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      // Native iOS: send ECG start command via native BLE bridge
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ action: 'ble_ecg_start' }));
      
      // Listen for ECG data from native layer
      const ecgHandler = (event: any) => {
        const detail = event.detail;
        if (!detail) return;
        
        if (detail.ecg_samples && Array.isArray(detail.ecg_samples)) {
          samplesRef.current = [...samplesRef.current, ...detail.ecg_samples];
          setEcgSamples([...samplesRef.current]);
        }
        if (detail.ecg_hr) setLiveHR(detail.ecg_hr);
        if (detail.ecg_result) {
          resultRef.current = detail.ecg_result;
        }
      };
      window.addEventListener('ble_ecg_data', ecgHandler);
      
      // Start recording after brief connection delay
      setTimeout(() => setStep(4), 1500);
      return;
    }

    // Web fallback: try Web Bluetooth (only works on Chrome desktop, not WKWebView)
    if (Platform.OS !== 'web') return;

    try {
      let bd = typeof window !== 'undefined' ? (window as any).__bleBraceletDevice : null;
      let server: any = null;

      if (bd?.gatt?.connected) {
        server = bd.gatt;
        deviceRef.current = bd;
      } else {
        if (!('bluetooth' in navigator)) { setBleError('Connectez le bracelet depuis la page Dispositifs d\'abord'); setStep(2); return; }
        const nav = navigator as any;
        bd = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [SVC, '0000ffe0-0000-1000-8000-00805f9b34fb', 'heart_rate', 'battery_service'],
        });
        deviceRef.current = bd;
        server = await bd.gatt.connect();
        if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = bd;
      }

      const gattServer = server.getPrimaryServices ? server : await server;
      const allServices = await gattServer.getPrimaryServices();
      let notifyCount = 0;

      for (const svc of allServices) {
        try {
          const chars = await svc.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              if (!writeCharRef.current) writeCharRef.current = c;
            }
            if (c.properties.notify || c.properties.indicate) {
              try {
                await c.startNotifications();
                c.addEventListener('characteristicvaluechanged', (event: any) => {
                  const dv = event.target.value as DataView;
                  const bytes = new Uint8Array(dv.buffer);
                  if (bytes.length < 1) return;
                  const cmd = bytes[0];

                  // ECG waveform: packets > 16 bytes = 24-bit samples
                  if (bytes.length > 16) {
                    const newSamples: number[] = [];
                    const count = Math.floor((bytes.length - 2) / 3);
                    for (let i = 0; i < count; i++) {
                      const idx = 2 + 3 * i;
                      const sample = (bytes[idx] & 0xFF) | ((bytes[idx + 1] & 0xFF) << 8) | ((bytes[idx + 2] & 0xFF) << 16);
                      newSamples.push(sample);
                    }
                    if (newSamples.length > 0) {
                      samplesRef.current = [...samplesRef.current, ...newSamples];
                      setEcgSamples([...samplesRef.current]);
                    }
                  }

                  if (cmd === 0x32 || (bytes.length >= 6 && bytes.length <= 16)) {
                    const newSamples: number[] = [];
                    const startByte = (cmd === 0x32 || cmd === 0x33) ? 1 : 0;
                    for (let i = startByte; i + 1 < bytes.length; i += 2) {
                      const sample = (bytes[i] | (bytes[i + 1] << 8));
                      const signed = sample > 32767 ? sample - 65536 : sample;
                      newSamples.push(signed);
                    }
                    if (newSamples.length > 0) {
                      samplesRef.current = [...samplesRef.current, ...newSamples];
                      setEcgSamples([...samplesRef.current]);
                    }
                  }

                  if (cmd === 0x33 && bytes.length >= 10) {
                    resultRef.current = {
                      ecg_hr: bytes[1], ecg_hrv: bytes[2], ecg_breath_rate: bytes[3],
                      ecg_stress: bytes[4], ecg_mood: bytes[5], ecg_systolic: bytes[6],
                      ecg_diastolic: bytes[7], ecg_vascular_aging: bytes[8],
                      ecg_av_block: bytes.length > 9 ? bytes[9] : 0,
                    };
                    if (resultRef.current.ecg_hr > 0) setLiveHR(resultRef.current.ecg_hr);
                  }

                  if (cmd === 0x28 && bytes.length >= 4 && bytes[2] > 0 && bytes[2] < 255) {
                    setLiveHR(bytes[2]);
                  }
                });
                notifyCount++;
              } catch {}
            }
          }
        } catch {}
      }

      if (notifyCount === 0 || !writeCharRef.current) {
        setBleError(`Services: ${allServices.length}, Notify: ${notifyCount}, Write: ${!!writeCharRef.current}`);
        setStep(2);
        return;
      }

      const now = new Date();
      const timeCmd = buildCmd(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
      await writeCharRef.current.writeValue(timeCmd).catch(() => {});

      await new Promise(r => setTimeout(r, 300));
      await writeCharRef.current.writeValue(buildPPGEnable(true)).catch(() => {});

      await new Promise(r => setTimeout(r, 300));
      await writeCharRef.current.writeValue(buildECGStart()).catch((e: any) => {
        setBleError(`Write ECG start failed: ${e.message}`);
      });

      samplesRef.current = [];
      resultRef.current = null;
      setEcgSamples([]);
      setStep(4);
    } catch (e: any) {
      if (e.name === 'NotFoundError') {
        setStep(2);
      } else {
        setBleError(e.message || 'Erreur BLE');
        setStep(2);
      }
    }
  }, []);

  const stopECG = useCallback(async () => {
    if (writeCharRef.current) {
      try {
        await writeCharRef.current.writeValue(buildECGStop()).catch(() => {});
        await new Promise(r => setTimeout(r, 200));
        await writeCharRef.current.writeValue(buildPPGEnable(false)).catch(() => {});
      } catch {}
    }
    await new Promise(r => setTimeout(r, 2000));

    const ecgResult = resultRef.current || {};
    const totalSamples = samplesRef.current;

    // Determine rhythm and interpretation from bracelet ECG analysis
    const avBlock = ecgResult.av_block || ecgResult.ecg_av_block || 0;
    const resultVal = ecgResult.result_value || 0;
    let rhythm = 'sinusal';
    let status = 'normal';
    let interpretation = 'Rythme sinusal normal';
    
    if (avBlock > 0) {
      rhythm = 'av_block';
      status = 'anomaly';
      interpretation = `Bloc auriculo-ventriculaire detecte (grade ${avBlock}). Consultez un medecin.`;
    } else if (resultVal === 1) {
      status = 'low';
      interpretation = 'Rythme cardiaque bas detecte. Surveillance recommandée.';
    } else if (resultVal === 3) {
      status = 'high';
      interpretation = 'Rythme cardiaque élevé detecte. Reposez-vous et consultez si persistant.';
    }

    let ecgId = 'ecg-' + Date.now();
    try {
      const res = await apiFetch('/api/ecg/start', {
        method: 'POST',
        body: JSON.stringify({
          ecg_raw: totalSamples.slice(-7500),
          sample_rate: 250,
          bpm: ecgResult.heart_rate || ecgResult.ecg_hr || liveHR || 0,
          hrv: ecgResult.hrv || ecgResult.ecg_hrv || 0,
          breath_rate: ecgResult.breath_rate || ecgResult.ecg_breath_rate || 0,
          stress: ecgResult.stress || ecgResult.ecg_stress || 0,
          mood: ecgResult.mood || ecgResult.ecg_mood || 0,
          systolic: ecgResult.systolic || ecgResult.ecg_systolic || 0,
          diastolic: ecgResult.diastolic || ecgResult.ecg_diastolic || 0,
          vascular_aging: ecgResult.vascular_aging || ecgResult.ecg_vascular_aging || 0,
          av_block: avBlock,
          status,
          rhythm,
          interpretation,
          duration_sec: ECG_DURATION,
        }),
      }, token);
      if (res?.id) ecgId = res.id;
    } catch {}

    if (totalSamples.length > 0) {
      apiFetch('/api/bracelet/v8/push', {
        method: 'POST',
        body: JSON.stringify({ data_type: 'ecg_waveform', data: { ecg_raw: totalSamples.slice(-7500), sample_rate: 250 }, device_id: deviceRef.current?.id || '', source: 'ble' }),
      }, token).catch(() => {});
    }

    router.push({ pathname: '/ecg-detail' as any, params: { id: ecgId } });
  }, [token, liveHR]);

  if (Platform.OS !== 'web') return <NativePageView path="/ecg" />;

  const glassCard: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '24px 20px' };

  const renderWaveform = (samples: number[], width: number, height: number) => {
    if (samples.length < 10) return null;
    const displaySamples = samples.slice(-width);
    const min = Math.min(...displaySamples);
    const max = Math.max(...displaySamples);
    const range = max - min || 1;
    const points = displaySamples.map((v, i) => {
      const x = (i / (displaySamples.length - 1)) * width;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ecgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => <line key={p} x1="0" y1={height * p} x2={width} y2={height * p} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />)}
        <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#ecgGrad)" />
        <polyline points={points} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  // Not connected → redirect to devices page
  if (braceletConnected === false) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: '#0A0A1A' } as any}>
        <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
        <div style={{ flex: 1, position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' } as any}>
          <img src={BRACELET_IMG} alt="" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8, textAlign: 'center' }}>Bracelet non connecte</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, textAlign: 'center', maxWidth: 300, marginBottom: 28 }}>
            Connectez votre bracelet depuis l'onglet Dispositifs pour lancer un ECG.
          </div>
          <div data-testid="ecg-go-devices" onClick={() => router.push('/(tabs)/devices' as any)} style={{ padding: '14px 32px', borderRadius: 16, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFFFFF', textAlign: 'center' } as any}>
            Aller aux Dispositifs
          </div>
          <div onClick={() => router.back()} style={{ marginTop: 12, padding: '10px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' } as any}>Annuler</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (braceletConnected === null) return <FullScreenLoader />;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: '#0A0A1A' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 20px 20px', minHeight: '100%' } as any}>

        {/* Step 0: Preparation */}
        {step === 0 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <img src={BRACELET_IMG} alt="" style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto 24px', display: 'block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Electrocardiogramme</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
              Mesure reelle via le capteur ECG de votre bracelet V8.
            </div>
            <div style={{ ...glassCard, textAlign: 'left', marginBottom: 16 } as any}>
              {[
                { icon: 'ri-armchair-line', text: 'Asseyez-vous confortablement' },
                { icon: 'ri-rest-time-line', text: 'Restez calme et detendu' },
                { icon: 'ri-bluetooth-connect-line', text: 'Bracelet V8 allume et a proximite' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={s.icon} style={{ fontSize: 18, color: '#FFFFFF' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{s.text}</span>
                </div>
              ))}
            </div>
            <div data-testid="ecg-start-prep" onClick={() => setStep(1)} style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFFFFF', textAlign: 'center' } as any}>
              Je suis pret
            </div>
            <div onClick={() => router.back()} style={{ marginTop: 12, padding: '10px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' } as any}>Annuler</div>
          </div>
        )}

        {/* Step 1: Breathing animation (30s) */}
        {step === 1 && (() => {
          const inCycle = breathSec % 10;
          const isInhale = inCycle < 4;
          const progress = isInhale ? (inCycle / 4) : (1 - (inCycle - 4) / 6);
          const scale = 0.5 + progress * 0.5;
          const remaining = Math.ceil(30 - breathSec);
          const circleColor = isInhale ? 'rgba(255,160,100,0.6)' : 'rgba(120,200,255,0.5)';
          const glowColor = isInhale ? 'rgba(255,140,80,0.3)' : 'rgba(100,180,255,0.25)';
          return (
            <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Preparation ECG</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 40 }}>00:{remaining < 10 ? '0' : ''}{remaining}</div>
              <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                {[140, 120, 95].map((r, i) => (
                  <div key={i} style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: '50%', border: `1px dashed rgba(255,255,255,${0.08 + i * 0.03})`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as any} />
                ))}
                <div style={{ width: 180, height: 180, borderRadius: '50%', transform: `scale(${scale})`, transition: 'transform 0.15s ease-out', background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.4) 0%, ${circleColor} 70%, transparent 100%)`, border: `2px solid ${circleColor}`, boxShadow: `0 0 60px ${glowColor}, 0 0 120px ${glowColor}` } as any} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 } as any}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: isInhale ? '#FFA064' : '#78C8FF' } as any} />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFF', lineHeight: 1.5 }}>
                  {isInhale ? 'Inspirez par le nez.' : 'Expirez lentement par la bouche.'}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Step 2: Position finger */}
        {step === 2 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <img src={BRACELET_IMG} alt="" style={{ width: 160, height: 160, objectFit: 'contain', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Positionnez votre doigt</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>
              Placez votre index sur le capteur metallique du bracelet. Maintenez une pression légère.
            </div>
            {bleError && (
              <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16, fontSize: 12, color: '#EF4444' } as any}>{bleError}</div>
            )}
            <div data-testid="ecg-launch" onClick={connectAndStartECG} style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFFFFF', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              <i className="ri-pulse-line" style={{ fontSize: 20 }} /> Lancer l'ECG
            </div>
            <div onClick={() => router.back()} style={{ marginTop: 12, padding: '10px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' } as any}>Annuler</div>
          </div>
        )}

        {/* Step 3: Connecting */}
        {step === 3 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ width: 60, height: 60, borderRadius: 999, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', margin: '0 auto 20px', animation: 'spin 1s linear infinite' } as any} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Demarrage de l'ECG...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Preparation des capteurs</div>
          </div>
        )}

        {/* Step 4: Recording */}
        {step === 4 && (
          <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' } as any}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Enregistrément ECG</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 } as any}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{ECG_DURATION - recordSec}s</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Restant</div>
              </div>
              {liveHR > 0 && (
                <div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#EF4444', lineHeight: 1 }}>{liveHR}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>bpm</div>
                </div>
              )}
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 16, overflow: 'hidden' } as any}>
              <div style={{ height: '100%', borderRadius: 2, background: '#FFFFFF', width: `${(recordSec / ECG_DURATION) * 100}%`, transition: 'width 1s linear' } as any} />
            </div>
            <div style={{ ...glassCard, padding: '12px 8px', marginBottom: 16, height: 120, overflow: 'hidden' } as any}>
              {ecgSamples.length > 10 ? (
                renderWaveform(ecgSamples, 400, 100)
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>En attente du signal ECG...</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{ecgSamples.length} echantillons</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginTop: 8, marginBottom: 4 }}>Gardez votre doigt sur le capteur</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Ne bougez pas pendant l'enregistrément</div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
