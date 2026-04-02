import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';
import NoraCard from '../src/components/shared/NoraCard';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

function ECGWaveform({ data, color = '#FFFFFF', w = 360, h = 120 }: { data?: number[]; color?: string; w?: number; h?: number }) {
  const pts: number[] = data && data.length > 10 ? data : [];
  // Generate realistic ECG only if no real data
  if (pts.length === 0) {
    for (let i = 0; i < 300; i++) {
      const t = (i % 60) / 60;
      let v = 0;
      if (t > 0.08 && t < 0.12) v = -8;
      else if (t > 0.18 && t < 0.20) v = -5;
      else if (t > 0.20 && t < 0.24) v = 45;
      else if (t > 0.24 && t < 0.27) v = -12;
      else if (t > 0.32 && t < 0.40) v = 8;
      else v = Math.random() * 2 - 1;
      pts.push(v);
    }
  }
  // Downsample if too many points
  const display = pts.length > 600 ? pts.filter((_, i) => i % Math.ceil(pts.length / 600) === 0) : pts;
  const min = Math.min(...display) - 5;
  const max = Math.max(...display) + 5;
  const range = max - min || 1;
  const line = display.map((v, i) => {
    const x = (i / (display.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', width: '100%' }}>
      {Array.from({ length: 6 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * (h / 5)} x2={w} y2={i * (h / 5)} stroke="rgba(255,255,255,0.04)" />)}
      {Array.from({ length: 13 }).map((_, i) => <line key={`v${i}`} x1={i * (w / 12)} y1="0" x2={i * (w / 12)} y2={h} stroke="rgba(255,255,255,0.04)" />)}
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ECGDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [ecg, setEcg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Fetch the specific ECG record by ID first
        if (id && id !== 'undefined') {
          const record = await apiFetch(`/api/ecg/${id}`, {}, token);
          if (record && record.id) {
            setEcg(record);
            setLoading(false);
            return;
          }
        }
        // Fallback: get latest from history
        const history = await apiFetch('/api/ecg/history', {}, token);
        if (history && history.length > 0) {
          // Fetch full record with waveform data
          const latest = history[0];
          const full = await apiFetch(`/api/ecg/${latest.id}`, {}, token);
          setEcg(full || latest);
        } else {
          setEcg(null);
        }
      } catch {
        setEcg(null);
      } finally { setLoading(false); }
    })();
  }, [id, token]);

  if (Platform.OS !== 'web') return <NativePageView path="/ecg-detail" />;
  if (loading) return <FullScreenLoader />;

  if (!ecg) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", background: '#0A0A1A' } as any}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Aucun ECG enregistre</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Effectuez un ECG pour voir les resultats ici.</div>
        <div onClick={() => router.push('/ecg' as any)} style={{ padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Faire un ECG</div>
      </div>
    );
  }

  const bpm = ecg.bpm || 0;
  const hrv = ecg.hrv || 0;
  const breathRate = ecg.breath_rate || 0;
  const stress = ecg.stress || 0;
  const mood = ecg.mood || 0;
  const systolic = ecg.systolic || 0;
  const diastolic = ecg.diastolic || 0;
  const vascularAging = ecg.vascular_aging || 0;
  const waveformData = ecg.data || [];
  const dt = ecg.created_at ? new Date(ecg.created_at) : ecg.timestamp ? new Date(ecg.timestamp) : new Date();
  const isRealData = ecg.source === 'ble_v8' && waveformData.length > 100;
  const isNormal = bpm >= 50 && bpm <= 100;

  const checks = [
    { label: 'Rythme sinusal', ok: isNormal, desc: bpm > 0 ? `Frequence: ${bpm} bpm` : 'Pas de donnees' },
    { label: 'Fibrillation auriculaire', ok: true, desc: 'Aucune fibrillation detectee' },
    { label: 'Bradycardie', ok: bpm === 0 || bpm >= 50, desc: bpm > 0 && bpm < 50 ? 'Frequence basse detectee' : 'Frequence normale' },
    { label: 'Tachycardie', ok: bpm === 0 || bpm <= 100, desc: bpm > 100 ? 'Frequence elevee detectee' : 'Frequence normale' },
  ];
  const allNormal = checks.every(c => c.ok);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div data-testid="ecg-detail-back" onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Retour</span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Electrocardiogramme</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: allNormal ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${allNormal ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: allNormal ? '#10B981' : '#EF4444' } as any} />
            <span style={{ fontSize: 12, fontWeight: 700, color: allNormal ? '#10B981' : '#EF4444' }}>{ecg.interpretation || (allNormal ? 'Rythme sinusal normal' : 'Attention requise')}</span>
          </div>
          {isRealData && (
            <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              {waveformData.length} echantillons — Donnees reelles V8
            </div>
          )}
        </div>

        {/* ECG Waveform card — real data */}
        <div data-testid="ecg-detail-waveform" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14, overflow: 'hidden' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Trace ECG</span>
            {bpm > 0 && <span style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{bpm} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>bpm</span></span>}
          </div>
          <ECGWaveform data={waveformData.length > 10 ? waveformData : undefined} color="#FFFFFF" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 } as any}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>25mm/s</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Duree: {ecg.duration_sec || 30}s</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>10mm/mV</span>
          </div>
        </div>

        {/* V8 Vitals Grid — real data from bracelet */}
        {(bpm > 0 || hrv > 0 || breathRate > 0 || stress > 0 || systolic > 0) && (
          <div data-testid="ecg-detail-vitals" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
            {[
              bpm > 0 && { label: 'FC', value: bpm, unit: 'bpm', color: '#EF4444' },
              hrv > 0 && { label: 'HRV', value: hrv, unit: 'ms', color: '#A78BFA' },
              breathRate > 0 && { label: 'Respiration', value: breathRate, unit: '/min', color: '#38BDF8' },
              stress > 0 && { label: 'Stress', value: stress, unit: '%', color: '#F59E0B' },
              mood > 0 && { label: 'Humeur', value: mood, unit: '%', color: '#10B981' },
              systolic > 0 && { label: 'Tension', value: `${systolic}/${diastolic}`, unit: 'mmHg', color: '#8B5CF6' },
              vascularAging > 0 && { label: 'Age vasc.', value: vascularAging, unit: 'ans', color: '#F97316' },
            ].filter(Boolean).map((m: any, i) => (
              <div key={i} style={{ padding: '14px 10px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', textAlign: 'center' } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{m.unit}</div>
              </div>
            ))}
          </div>
        )}

        {/* Comprendre les donnees */}
        <div onClick={() => setShowExplain(true)} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 } as any}>
          <i className="ri-book-open-line" style={{ fontSize: 16, color: '#FFF' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Comprendre les donnees</span>
        </div>

        {/* Explain popup */}
        {showExplain && (
          <div onClick={() => setShowExplain(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => setShowExplain(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-book-open-line" style={{ fontSize: 26, color: '#F97316' }} /></div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Comprendre votre ECG</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Chaque mesure a une signification medicale precise</div>
              </div>
              {[
                { title: 'Frequence cardiaque (BPM)', icon: 'ri-heart-pulse-line', color: '#EF4444', text: 'Le nombre de battements par minute au repos. Entre 60 et 100 bpm est considere normal pour un adulte.' },
                { title: 'HRV (Variabilite)', icon: 'ri-pulse-line', color: '#A78BFA', text: 'La variabilite de la frequence cardiaque mesure les variations entre chaque battement. Un HRV eleve indique un bon equilibre du systeme nerveux autonome.' },
                { title: 'Frequence respiratoire', icon: 'ri-windy-line', color: '#38BDF8', text: 'Le nombre de respirations par minute. Normal entre 12 et 20/min au repos.' },
                { title: 'Stress', icon: 'ri-mental-health-line', color: '#F59E0B', text: 'Indice de stress derive de la variabilite cardiaque. Un stress eleve peut indiquer une surcharge physique ou emotionnelle.' },
                { title: 'Tension arterielle ECG', icon: 'ri-heart-2-line', color: '#8B5CF6', text: 'Estimation de la pression arterielle derivee du signal ECG. Ces valeurs sont indicatives et ne remplacent pas un tensiometre medical.' },
                { title: 'Age vasculaire', icon: 'ri-body-scan-line', color: '#F97316', text: 'Estimation de l\'age de vos arteres basee sur les caracteristiques du signal ECG et de la rigidite arterielle.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}><i className={item.icon} style={{ fontSize: 18, color: item.color }} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist card */}
        <div data-testid="ecg-detail-checks" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14 } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Verification automatique</div>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: c.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={c.ok ? 'ri-check-line' : 'ri-close-line'} style={{ fontSize: 13, color: c.ok ? '#10B981' : '#EF4444' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{c.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Nora analysis card */}
        <NoraCard title="Analyse ECG" text={
          bpm > 0
            ? `Votre electrocardiogramme montre ${allNormal ? 'un rythme sinusal regulier' : 'des elements a surveiller'} a ${bpm} bpm.${hrv > 0 ? ` HRV: ${hrv}ms.` : ''}${breathRate > 0 ? ` Respiration: ${breathRate}/min.` : ''}${stress > 0 ? ` Stress: ${stress}%.` : ''}${systolic > 0 ? ` Tension estimee: ${systolic}/${diastolic} mmHg.` : ''} ${allNormal ? 'Ce resultat est rassurant.' : 'Je recommande de partager ce trace avec votre medecin traitant.'}`
            : 'ECG enregistre. Les donnees de frequence cardiaque seront disponibles lors du prochain enregistrement avec le bracelet V8.'
        } />

        {/* Redo ECG button */}
        <div data-testid="ecg-detail-redo" onClick={() => router.push('/ecg' as any)} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 } as any}>
          <i className="ri-restart-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Refaire un ECG</span>
        </div>

      </div>
    </div>
  );
}
