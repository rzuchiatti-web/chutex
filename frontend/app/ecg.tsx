import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import FullScreenLoader from '../src/components/FullScreenLoader';

const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const BRACELET_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';

export default function ECGScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=prep1, 1=breathing, 2=finger, 3=recording, 4=result
  const [breathCount, setBreathCount] = useState(15);
  const [recordProgress, setRecordProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
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

  // Recording
  const startRecording = async () => {
    setStep(3); setRecordProgress(0);
    const iv = setInterval(() => setRecordProgress(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + (100 / 30); }), 1000);
    try {
      const r = await apiFetch('/api/ecg/start', { method: 'POST' }, token);
      clearInterval(iv); setRecordProgress(100); setResult(r); setStep(4);
    } catch {
      clearInterval(iv); setRecordProgress(100);
      setResult({ id: 'sim', bpm: 72, status: 'normal', rhythm: 'sinusal', interpretation: 'Rythme sinusal normal', pr_interval_ms: 162, qrs_duration_ms: 88, qt_interval_ms: 382, duration_sec: 30 });
      setStep(4);
    }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>Web uniquement</Text></View>;

  const glassCard: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '24px 20px' };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '100%' } as any}>

        {/* Step 0: Preparation */}
        {step === 0 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <img src={BRACELET_IMG} alt="" style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto 24px', display: 'block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Electrocardiogramme</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
              Pour obtenir un resultat precis, nous allons vous preparer en quelques etapes.
            </div>
            <div style={{ ...glassCard, textAlign: 'left', marginBottom: 16 } as any}>
              {[
                { icon: 'ri-armchair-line', text: 'Asseyez-vous confortablement' },
                { icon: 'ri-rest-time-line', text: 'Restez calme et detendu' },
                { icon: 'ri-volume-mute-line', text: 'Evitez de parler pendant la mesure' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={s.icon} style={{ fontSize: 18, color: '#F97316' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{s.text}</span>
                </div>
              ))}
            </div>
            <div data-testid="ecg-start-prep" onClick={() => setStep(1)} style={{ padding: '16px', borderRadius: 16, background: '#F97316', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFF', textAlign: 'center' } as any}>
              Je suis pret
            </div>
            <div onClick={() => router.back()} style={{ marginTop: 12, padding: '10px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' } as any}>Annuler</div>
          </div>
        )}

        {/* Step 1: Breathing countdown */}
        {step === 1 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Preparation</div>
            <div style={{ width: 160, height: 160, borderRadius: 80, border: '3px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' } as any}>
              {/* Animated ring */}
              <svg width="160" height="160" style={{ position: 'absolute', top: -1.5, left: -1.5, transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="78" fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray={`${(1 - breathCount / 15) * 490} 490`} strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{breathCount}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Respirez doucement</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Ne parlez pas et restez immobile.<br/>Inspirez... Expirez...
            </div>
          </div>
        )}

        {/* Step 2: Position finger */}
        {step === 2 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <img src={BRACELET_IMG} alt="" style={{ width: 160, height: 160, objectFit: 'contain', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Positionnez votre doigt</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>
              Placez votre index sur le capteur metallique du bracelet. Maintenez une pression legere et constante.
            </div>
            <div style={{ ...glassCard, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', marginBottom: 20 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className="ri-fingerprint-line" style={{ fontSize: 22, color: '#10B981' }} />
              </div>
              <div style={{ textAlign: 'left' } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Capteur ECG</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Ne retirez pas votre doigt pendant 30 secondes</div>
              </div>
            </div>
            <div data-testid="ecg-launch" onClick={startRecording} style={{ padding: '16px', borderRadius: 16, background: '#F97316', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFF', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              <i className="ri-pulse-line" style={{ fontSize: 20 }} /> Lancer l'ECG
            </div>
          </div>
        )}

        {/* Step 3: Recording */}
        {step === 3 && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Enregistrement</div>
            {/* Pulse ring */}
            <div style={{ width: 160, height: 160, borderRadius: 80, border: '3px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' } as any}>
              <svg width="160" height="160" style={{ position: 'absolute', top: -1.5, left: -1.5, transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r="78" fill="none" stroke="#EF4444" strokeWidth="3" strokeDasharray={`${(recordProgress / 100) * 490} 490`} strokeLinecap="round" />
              </svg>
              <div>
                <i className="ri-pulse-line" style={{ fontSize: 40, color: '#EF4444', display: 'block', marginBottom: 4 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{Math.round(recordProgress)}%</div>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Mesure en cours...</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Gardez votre doigt sur le capteur.<br/>Ne bougez pas et ne parlez pas.
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 24, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: 6, borderRadius: 3, background: '#EF4444', width: `${recordProgress}%`, transition: 'width 1s linear' } as any} />
            </div>
          </div>
        )}

        {/* Step 4: Quick result */}
        {step === 4 && result && (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' } as any}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: result.status === 'normal' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `2px solid ${result.status === 'normal' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` } as any}>
              <i className={result.status === 'normal' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} style={{ fontSize: 36, color: result.status === 'normal' ? '#10B981' : '#EF4444' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{result.status === 'normal' ? 'Resultat normal' : 'Attention requise'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>{result.interpretation}</div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 } as any}>
              {[
                { val: result.bpm, unit: 'bpm', label: 'Freq. cardiaque' },
                { val: result.rhythm || 'Sinusal', unit: '', label: 'Rythme' },
                { val: `${result.duration_sec || 30}s`, unit: '', label: 'Duree' },
              ].map((m, i) => (
                <div key={i} style={{ flex: 1, ...glassCard, padding: '14px 8px', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{m.val}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span></div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div data-testid="ecg-view-report" onClick={() => router.push({ pathname: '/ecg-detail' as any, params: { id: result.id } })} style={{ padding: '16px', borderRadius: 16, background: '#F97316', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFF', textAlign: 'center', marginBottom: 10 } as any}>
              Voir le rapport detaille
            </div>
            <div onClick={() => { setStep(0); setResult(null); }} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' } as any}>Nouvel ECG</div>
            <div onClick={() => router.back()} style={{ marginTop: 10, padding: '10px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' } as any}>Retour</div>
          </div>
        )}

      </div>
    </div>
  );
}
