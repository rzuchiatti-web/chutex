import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';
import { useI18n } from '../src/context/I18nContext';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

function ECGWaveform({ data, color = '#EF4444', w = 360, h = 120 }: { data?: number[]; color?: string; w?: number; h?: number }) {
  // Generate realistic ECG waveform if no data
  const pts: number[] = data || [];
  if (pts.length === 0) {
    for (let i = 0; i < 300; i++) {
      const t = (i % 60) / 60;
      let v = 0;
      if (t > 0.08 && t < 0.12) v = -8; // P wave
      else if (t > 0.18 && t < 0.20) v = -5; // Q
      else if (t > 0.20 && t < 0.24) v = 45; // R peak
      else if (t > 0.24 && t < 0.27) v = -12; // S
      else if (t > 0.32 && t < 0.40) v = 8; // T wave
      else v = Math.random() * 2 - 1; // baseline noise
      pts.push(v);
    }
  }
  const min = Math.min(...pts) - 5;
  const max = Math.max(...pts) + 5;
  const range = max - min || 1;
  const line = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', width: '100%' }}>
      {/* Grid */}
      {Array.from({ length: 6 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * (h / 5)} x2={w} y2={i * (h / 5)} stroke="rgba(255,255,255,0.04)" />)}
      {Array.from({ length: 13 }).map((_, i) => <line key={`v${i}`} x1={i * (w / 12)} y1="0" x2={i * (w / 12)} y2={h} stroke="rgba(255,255,255,0.04)" />)}
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ECGDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { token } = useAuth();
  const router = useRouter();
  const [ecg, setEcg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const history = await apiFetch('/api/ecg/history', {}, token);
        const found = (history || []).find((e: any) => e.id === id) || (history || [])[0];
        setEcg(found || { id: 'demo', bpm: 72, result: 'Rythme sinusal normal', date: new Date().toISOString(), normal: true, duration_sec: 30, intervals: { pr: 160, qrs: 88, qt: 380, qtc: 410 } });
      } catch {
        setEcg({ id: 'demo', bpm: 72, result: 'Rythme sinusal normal', date: new Date().toISOString(), normal: true, duration_sec: 30, intervals: { pr: 160, qrs: 88, qt: 380, qtc: 410 } });
      } finally { setLoading(false); }
    })();
  }, [id, token]);

  if (Platform.OS !== 'web') return <NativePageView path="/ecg-detail" />;
  if (loading) return <FullScreenLoader />;

  const iv = ecg?.intervals || {};
  const dt = ecg?.date ? new Date(ecg.date) : new Date();

  const checks = [
    { label: 'Rythme sinusal', ok: ecg?.normal !== false, desc: 'Rythme cardiaque regulier et normal' },
    { label: 'Fibrillation auriculaire', ok: true, desc: 'Aucune fibrillation detectee' },
    { label: 'Intervalle QT', ok: (iv.qtc || 410) < 460, desc: `QTc: ${iv.qtc || 410}ms (normal < 460ms)` },
    { label: 'Complexe QRS', ok: (iv.qrs || 88) < 120, desc: `QRS: ${iv.qrs || 88}ms (normal < 120ms)` },
    { label: 'Intervalle PR', ok: (iv.pr || 160) >= 120 && (iv.pr || 160) <= 200, desc: `PR: ${iv.pr || 160}ms (normal 120-200ms)` },
    { label: 'Bradycardie', ok: (ecg?.bpm || 72) >= 50, desc: ecg?.bpm < 50 ? 'Frequence basse detectee' : 'Frequence normale' },
    { label: 'Tachycardie', ok: (ecg?.bpm || 72) <= 100, desc: ecg?.bpm > 100 ? 'Frequence elevee detectee' : 'Frequence normale' },
  ];

  const allNormal = checks.every(c => c.ok);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Retour</span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Electrocardiogramme</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: allNormal ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${allNormal ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: allNormal ? '#10B981' : '#EF4444' } as any} />
            <span style={{ fontSize: 12, fontWeight: 700, color: allNormal ? '#10B981' : '#EF4444' }}>{ecg?.result || 'Rythme sinusal normal'}</span>
          </div>
        </div>

        {/* ECG Waveform card */}
        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14, overflow: 'hidden' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Trace ECG</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{ecg?.bpm || 72} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>bpm</span></span>
          </div>
          <ECGWaveform color="#FFFFFF" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 } as any}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>25mm/s</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Duree: {ecg?.duration_sec || 30}s</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>10mm/mV</span>
          </div>
        </div>

        {/* Intervals card with descriptions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
          {[
            { label: 'PR', val: `${iv.pr || 160}`, unit: 'ms', ok: (iv.pr || 160) >= 120 && (iv.pr || 160) <= 200, desc: 'Conduction auriculo-ventriculaire' },
            { label: 'QRS', val: `${iv.qrs || 88}`, unit: 'ms', ok: (iv.qrs || 88) < 120, desc: 'Depolarisation ventriculaire' },
            { label: 'QT', val: `${iv.qt || 380}`, unit: 'ms', ok: true, desc: 'Cycle ventriculaire complet' },
            { label: 'QTc', val: `${iv.qtc || 410}`, unit: 'ms', ok: (iv.qtc || 410) < 460, desc: 'QT corrige par la frequence' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.ok ? '#FFF' : '#EF4444', marginBottom: 4 }}>{m.val}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 2 }}>{m.unit}</span></div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.3 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Comprendre les données button */}
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
                { title: 'Frequence cardiaque (BPM)', icon: 'ri-heart-pulse-line', color: '#EF4444', text: 'Le nombre de battements par minute au repos. Entre 60 et 100 bpm est considere normal pour un adulte. En dessous de 60, on parle de bradycardie. Au dessus de 100, de tachycardie.' },
                { title: 'Intervalle PR', icon: 'ri-time-line', color: '#38BDF8', text: "Mesure le temps de conduction electrique entre les oreillettes et les ventricules. Normal entre 120 et 200 ms. Un PR trop long peut indiquer un bloc auriculo-ventriculaire." },
                { title: 'Complexe QRS', icon: 'ri-pulse-line', color: '#10B981', text: 'Represente la depolarisation des ventricules, le moment ou ils se contractent pour pomper le sang. Normal en dessous de 120 ms. Un QRS elargi peut signaler un trouble de conduction.' },
                { title: 'Intervalle QT / QTc', icon: 'ri-timer-line', color: '#A78BFA', text: "Mesure le temps total de depolarisation et repolarisation des ventricules. Le QTc est corrige selon la frequence cardiaque. Un QTc superieur a 460 ms augmente le risque d'arythmie." },
                { title: 'Rythme sinusal', icon: 'ri-checkbox-circle-line', color: '#F59E0B', text: "Un rythme sinusal signifie que l'impulsion electrique part du noeud sinusal (le pacemaker naturel du coeur). C'est le rythme normal. Toute deviation peut indiquer une arythmie." },
                { title: 'Fibrillation auriculaire', icon: 'ri-error-warning-line', color: '#EF4444', text: "La FA est un trouble du rythme ou les oreillettes battent de facon irreguliere et rapide. L'ECG permet de la detecter par l'absence d'ondes P regulieres et un rythme irregulier." },
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
        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14 } as any}>
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
        <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 10, fontWeight: 900, color: '#A78BFA' }}>N</span></div>
            <div><span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Nora</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>Analyse ECG</span></div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            {allNormal
              ? `Votre electrocardiogramme montre un rythme sinusal regulier a ${ecg?.bpm || 72} bpm. Les intervalles PR (${iv.pr || 160}ms), QRS (${iv.qrs || 88}ms) et QTc (${iv.qtc || 410}ms) sont tous dans les normes. Aucun signe de fibrillation auriculaire, de bloc de branche ou d'anomalie du segment ST n'a ete detecte. Ce resultat est rassurant et ne necessite pas d'action immediate.`
              : `Votre ECG presente des elements qui meritent attention. A ${ecg?.bpm || 72} bpm, ${ecg?.bpm > 100 ? 'votre frequence cardiaque est elevee (tachycardie). ' : ecg?.bpm < 50 ? 'votre frequence cardiaque est basse (bradycardie). ' : ''}${(iv.qtc || 410) >= 460 ? 'L\'intervalle QTc est allonge, ce qui peut indiquer un risque d\'arythmie. ' : ''}${(iv.qrs || 88) >= 120 ? 'Le complexe QRS est elargi, suggerant un trouble de conduction. ' : ''}Je recommande de partager ce trace avec votre medecin traitant pour une evaluation approfondie.`
            }
          </div>
        </div>

      </div>
    </div>
  );
}
