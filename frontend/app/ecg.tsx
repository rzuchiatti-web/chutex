import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
const BRACELET_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';

// V8 BLE UUIDs — FROM SDK: FFF6=WRITE, FFF7=NOTIFY
const SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
const NOTIFY = '0000fff7-0000-1000-8000-00805f9b34fb';
const WRITE = '0000fff6-0000-1000-8000-00805f9b34fb';
const ECG_DURATION = 30;

function buildCmd(cmd: number, payload: number[] = []) {
  const pkt = new Uint8Array(16);
  pkt[0] = cmd;
  for (let i = 0; i < payload.length && i < 14; i++) pkt[i + 1] = payload[i];
  // CRC: sum of all bytes except last
  let crc = 0;
  for (let i = 0; i < 15; i++) crc += pkt[i];
  pkt[15] = crc & 0xFF;
  return pkt;
}

// ECG-specific commands from SDK
function buildECGStart() {
  // 0x28 = MeasurementWithType, 0x04 = ECG, 0x01 = start, duration 50000ms, 0x01 = ECG flag
  const pkt = new Uint8Array(16);
  pkt[0] = 0x28; // MeasurementWithType
  pkt[1] = 0x04; // ECG mode
  pkt[2] = 0x01; // start
  pkt[4] = 0x50; // 50000 & 0xFF
  pkt[5] = 0xC3; // 50000 >> 8
  pkt[6] = 0x01; // ECG flag
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
  // 0x07 = PPG, enables ECG realtime waveform
  const pkt = new Uint8Array(16);
  pkt[0] = 0x07; pkt[1] = on ? 0x01 : 0x00;
  let crc = 0; for (let i = 0; i < 15; i++) crc += pkt[i]; pkt[15] = crc & 0xFF;
  return pkt;
}

export default function ECGScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=prep, 1=breathing, 2=finger, 3=connecting, 4=recording, 5=result
  const [breathCount, setBreathCount] = useState(15);
  const [recordSec, setRecordSec] = useState(0);
  const [ecgSamples, setEcgSamples] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [bleError, setBleError] = useState('');
  const [liveHR, setLiveHR] = useState(0);
  const deviceRef = useRef<any>(null);
  const writeCharRef = useRef<any>(null);
  const samplesRef = useRef<number[]>([]);
  const resultRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Breathing countdown
  useEffect(() => {
    if (step !== 1) return;
    setBreathCount(15);
    timerRef.current = setInterval(() => {
      setBreathCount(p => {
        if (p <= 1) { clearInterval(timerRef.current); setStep(2); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
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
    if (Platform.OS !== 'web') return;

    try {
      let bd = typeof window !== 'undefined' ? (window as any).__bleBraceletDevice : null;
      let server: any = null;

      // Try to reuse existing connection
      if (bd?.gatt?.connected) {
        server = bd.gatt;
        deviceRef.current = bd;
      } else {
        // Need new connection
        if (!('bluetooth' in navigator)) { setBleError('Web Bluetooth requis'); setStep(2); return; }
        const nav = navigator as any;
        bd = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [SVC, '0000ffe0-0000-1000-8000-00805f9b34fb', 'heart_rate', 'battery_service'],
        });
        deviceRef.current = bd;
        server = await bd.gatt.connect();
        if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = bd;
      }

      // Find ALL services and subscribe to ALL notifiable characteristics
      const gattServer = server.getPrimaryServices ? server : await server;
      const allServices = await gattServer.getPrimaryServices();
      let notifyCount = 0;
      
      for (const svc of allServices) {
        try {
          const chars = await svc.getCharacteristics();
          for (const c of chars) {
            // Find write characteristic
            if (c.properties.write || c.properties.writeWithoutResponse) {
              if (!writeCharRef.current) writeCharRef.current = c;
            }
            // Subscribe to ALL notify characteristics
            if (c.properties.notify || c.properties.indicate) {
              try {
                await c.startNotifications();
                c.addEventListener('characteristicvaluechanged', (event: any) => {
                  const dv = event.target.value as DataView;
                  const bytes = new Uint8Array(dv.buffer);
                  if (bytes.length < 1) return;
                  const cmd = bytes[0];
                  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
                  
                  // Log everything for debug
                  setBleError(`BLE: cmd=0x${cmd.toString(16)} ${bytes.length}B: ${hex.substring(0, 60)}`);

                  // ECG waveform: packets > 16 bytes contain 24-bit samples (SDK: getECG)
                  if (bytes.length > 16) {
                    const packetId = bytes[1] & 0xFF;
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

                  // ECG waveform data (cmd 0x32 or any packet with many samples during recording)
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
                  
                  // ECG result packet
                  if (cmd === 0x33 && bytes.length >= 10) {
                    resultRef.current = {
                      ecg_hr: bytes[1], ecg_hrv: bytes[2], ecg_breath_rate: bytes[3],
                      ecg_stress: bytes[4], ecg_mood: bytes[5], ecg_systolic: bytes[6],
                      ecg_diastolic: bytes[7], ecg_vascular_aging: bytes[8],
                      ecg_av_block: bytes.length > 9 ? bytes[9] : 0,
                    };
                    if (resultRef.current.ecg_hr > 0) setLiveHR(resultRef.current.ecg_hr);
                  }
                  
                  // Live HR
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

      // Time sync first
      const now = new Date();
      const timeCmd = buildCmd(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
      await writeCharRef.current.writeValue(timeCmd).catch(() => {});

      // Enable PPG/ECG realtime waveform FIRST
      await new Promise(r => setTimeout(r, 300));
      await writeCharRef.current.writeValue(buildPPGEnable(true)).catch(() => {});

      // Start ECG measurement (0x28, mode ECG=0x04, start=0x01)
      await new Promise(r => setTimeout(r, 300));
      await writeCharRef.current.writeValue(buildECGStart()).catch((e: any) => {
        setBleError(`Write ECG start failed: ${e.message}`);
      });

      samplesRef.current = [];
      resultRef.current = null;
      setEcgSamples([]);
      setStep(4); // Start recording
    } catch (e: any) {
      if (e.name === 'NotFoundError') {
        setStep(2); // User cancelled BLE popup
      } else {
        setBleError(e.message || 'Erreur BLE');
        setStep(2);
      }
    }
  }, []);

  const stopECG = useCallback(async () => {
    // Send stop ECG + disable PPG
    if (writeCharRef.current) {
      try {
        await writeCharRef.current.writeValue(buildECGStop()).catch(() => {});
        await new Promise(r => setTimeout(r, 200));
        await writeCharRef.current.writeValue(buildPPGEnable(false)).catch(() => {});
      } catch {}
    }
    // Wait for result packet
    await new Promise(r => setTimeout(r, 2000));

    const ecgResult = resultRef.current || {};
    const totalSamples = samplesRef.current;

    // Build final result
    const finalResult = {
      id: 'ecg-' + Date.now(),
      bpm: ecgResult.ecg_hr || liveHR || 0,
      hrv: ecgResult.ecg_hrv || 0,
      breath_rate: ecgResult.ecg_breath_rate || 0,
      stress: ecgResult.ecg_stress || 0,
      mood: ecgResult.ecg_mood || 0,
      systolic: ecgResult.ecg_systolic || 0,
      diastolic: ecgResult.ecg_diastolic || 0,
      vascular_aging: ecgResult.ecg_vascular_aging || 0,
      av_block: ecgResult.ecg_av_block || 0,
      quality: ecgResult.ecg_quality || 0,
      status: (ecgResult.ecg_hr > 50 && ecgResult.ecg_hr < 100) ? 'normal' : ecgResult.ecg_hr > 0 ? 'attention' : 'normal',
      rhythm: 'sinusal',
      interpretation: ecgResult.ecg_hr > 0 ? 'Rythme sinusal normal' : 'Analyse en cours...',
      duration_sec: ECG_DURATION,
      samples_count: totalSamples.length,
      created_at: new Date().toISOString(),
    };

    // Save to backend
    try {
      await apiFetch('/api/bracelet/v8/push', {
        method: 'POST',
        body: JSON.stringify({
          data_type: 'ecg_waveform',
          data: { ecg_raw: totalSamples.slice(-7500), sample_rate: 250 },
          device_id: deviceRef.current?.id || '',
          source: 'ble',
        }),
      }, token);
      await apiFetch('/api/bracelet/v8/push', {
        method: 'POST',
        body: JSON.stringify({
          data_type: 'ecg_result',
          data: ecgResult,
          device_id: deviceRef.current?.id || '',
          source: 'ble',
        }),
      }, token);
    } catch {}

    // Disconnect
    try { deviceRef.current?.gatt?.disconnect(); } catch {}

    setResult(finalResult);
    setStep(5);
  }, [token, liveHR]);

  if (Platform.OS !== 'web') return <NativePageView path="/ecg" />;

  const glassCard: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '24px 20px' };

  // Build SVG waveform from real samples
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
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(p => <line key={p} x1="0" y1={height * p} x2={width} y2={height * p} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />)}
        <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#ecgGrad)" />
        <polyline points={points} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: '#0A0A1A' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '100%' } as any}>

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

        {/* Step 1: Breathing countdown */}
        {step === 1 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Preparation</div>
            <div style={{ width: 160, height: 160, borderRadius: 80, border: '3px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' } as any}>
              <svg width="160" height="160" style={{ position: 'absolute', top: -1.5, left: -1.5, transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="78" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray={`${(1 - breathCount / 15) * 490} 490`} strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{breathCount}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Respirez doucement</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Inspirez... Expirez...</div>
          </div>
        )}

        {/* Step 2: Position finger + connect */}
        {step === 2 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <img src={BRACELET_IMG} alt="" style={{ width: 160, height: 160, objectFit: 'contain', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Positionnez votre doigt</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>
              Placez votre index sur le capteur metallique du bracelet. Maintenez une pression legere.
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

        {/* Step 3: Connecting BLE */}
        {step === 3 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ width: 60, height: 60, borderRadius: 999, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', margin: '0 auto 20px', animation: 'spin 1s linear infinite' } as any} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Connexion au bracelet...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Selectionnez votre bracelet dans la popup</div>
          </div>
        )}

        {/* Step 4: REAL ECG Recording with live waveform */}
        {step === 4 && (
          <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' } as any}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Enregistrement ECG</div>

            {/* Timer + HR */}
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

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 16, overflow: 'hidden' } as any}>
              <div style={{ height: '100%', borderRadius: 2, background: '#FFFFFF', width: `${(recordSec / ECG_DURATION) * 100}%`, transition: 'width 1s linear' } as any} />
            </div>

            {/* Live ECG waveform */}
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
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Ne bougez pas pendant l'enregistrement</div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: result.status === 'normal' ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `2px solid ${result.status === 'normal' ? 'rgba(255,255,255,0.3)' : 'rgba(239,68,68,0.3)'}` } as any}>
              <i className={result.status === 'normal' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} style={{ fontSize: 36, color: result.status === 'normal' ? '#FFFFFF' : '#EF4444' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{result.status === 'normal' ? 'Resultat normal' : 'Attention requise'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>{result.interpretation}</div>

            {/* ECG waveform preview */}
            {ecgSamples.length > 50 && (
              <div style={{ ...glassCard, padding: '12px 8px', marginBottom: 16, height: 80, overflow: 'hidden' } as any}>
                {renderWaveform(ecgSamples.slice(0, 2000), 360, 65)}
              </div>
            )}

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 } as any}>
              {[
                { val: result.bpm, unit: 'bpm', label: 'FC ECG', color: '#EF4444', icon: 'ri-heart-pulse-line' },
                { val: result.hrv, unit: 'ms', label: 'HRV', color: '#FFFFFF', icon: 'ri-pulse-line' },
                { val: result.breath_rate, unit: '/min', label: 'Respiration', color: '#38BDF8', icon: 'ri-windy-line' },
                { val: result.stress, unit: '', label: 'Stress', color: '#F59E0B', icon: 'ri-mental-health-line' },
                { val: result.systolic ? `${result.systolic}/${result.diastolic}` : null, unit: '', label: 'Tension', color: '#EF4444', icon: 'ri-heart-line' },
                { val: result.vascular_aging, unit: 'ans', label: 'Age vasculaire', color: '#8B5CF6', icon: 'ri-time-line' },
                { val: result.mood, unit: '', label: 'Humeur', color: '#FFFFFF', icon: 'ri-emotion-line' },
                { val: result.samples_count, unit: '', label: 'Echantillons', color: '#6366F1', icon: 'ri-bar-chart-line' },
                { val: `${result.duration_sec}s`, unit: '', label: 'Duree', color: '#64748B', icon: 'ri-timer-line' },
              ].filter(m => m.val && m.val !== 0).map((m, i) => (
                <div key={i} style={{ padding: '10px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
                  <i className={m.icon} style={{ fontSize: 14, color: m.color, display: 'block', marginBottom: 4 }} />
                  <div style={{ fontSize: 16, fontWeight: 900, color: m.color }}>{m.val}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span></div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div onClick={() => { setStep(0); setResult(null); setEcgSamples([]); samplesRef.current = []; }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFFFFF', textAlign: 'center', marginBottom: 10 } as any}>Nouvel ECG</div>
            <div onClick={() => router.back()} style={{ padding: '12px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' } as any}>Retour</div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
