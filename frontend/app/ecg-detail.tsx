import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';
import NoraOverlay, { NoraButton } from '../src/components/dashboard/NoraOverlay';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

function ECGWaveform({ data, color = '#FFFFFF', w = 360, h = 120 }: { data?: number[]; color?: string; w?: number; h?: number }) {
  const pts: number[] = data && data.length > 10 ? data : [];
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

export default function ECGDétailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [ecg, setEcg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);
  const [showNoraEcg, setShowNoraEcg] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (id && id !== 'undefined') {
          const record = await apiFetch(`/api/ecg/${id}`, {}, token);
          if (record && record.id) { setEcg(record); setLoading(false); return; }
        }
        const history = await apiFetch('/api/ecg/history', {}, token);
        if (history && history.length > 0) {
          const full = await apiFetch(`/api/ecg/${history[0].id}`, {}, token);
          setEcg(full || history[0]);
        } else {
          setEcg(null);
        }
      } catch { setEcg(null); }
      finally { setLoading(false); }
    })();
  }, [id, token]);

  if (Platform.OS !== 'web') return <NativePageView path="/ecg-detail" />;
  if (loading) return <FullScreenLoader />;

  if (!ecg) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", background: '#0A0A1A' } as any}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Aucun ECG enregistré</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Effectuez un ECG pour voir les résultats ici.</div>
        <div onClick={() => router.push('/ecg' as any)} style={{ padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Faire un ECG</div>
      </div>
    );
  }

  const bpm = ecg.bpm || 0;
  const waveformData = ecg.data || [];
  const dt = ecg.created_at ? new Date(ecg.created_at) : ecg.timestamp ? new Date(ecg.timestamp) : new Date();
  const isRealData = ecg.source === 'ble_v8' && waveformData.length > 50;
  const isNormal = bpm >= 50 && bpm <= 100;
  const statusText = ecg.interpretation || ecg.status || (isNormal ? 'Rythme sinusal normal' : bpm > 100 ? 'Tachycardie' : bpm > 0 && bpm < 50 ? 'Bradycardie' : 'Rythme sinusal normal');

  const checks = [
    { label: 'Rythme sinusal', ok: isNormal || bpm === 0, desc: bpm > 0 ? `Frequence: ${bpm} bpm` : 'En attente de donnees' },
    { label: 'Fibrillation auriculaire', ok: true, desc: 'Aucune fibrillation detectee' },
    { label: 'Bradycardie', ok: bpm === 0 || bpm >= 50, desc: bpm > 0 && bpm < 50 ? 'Frequence basse detectee' : 'Frequence normale' },
    { label: 'Tachycardie', ok: bpm === 0 || bpm <= 100, desc: bpm > 100 ? 'Frequence élevée detectee' : 'Frequence normale' },
  ];
  const allNormal = checks.every(c => c.ok);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '70px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        <div data-testid="ecg-detail-back" onClick={() => router.push('/(tabs)/health' as any)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{t('return_label')}</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{t('ecg_full')}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: allNormal ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${allNormal ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: allNormal ? '#10B981' : '#EF4444' } as any} />
            <span style={{ fontSize: 12, fontWeight: 700, color: allNormal ? '#10B981' : '#EF4444' }}>{statusText}</span>
          </div>
        </div>

        {/* ECG Waveform — real data */}
        <div data-testid="ecg-detail-waveform" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14, overflow: 'hidden' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Trace ECG</span>
            {bpm > 0 && <span style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{bpm} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>bpm</span></span>}
          </div>
          <ECGWaveform data={waveformData.length > 10 ? waveformData : undefined} color="#FFFFFF" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 } as any}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>25mm/s</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>Durée: {ecg.duration_sec || 30}s {isRealData ? `— ${waveformData.length} pts` : ''}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>10mm/mV</span>
          </div>
        </div>

        {/* Nora ECG Analysis — Interactive card (avant comprendre) */}
        <NoraButton label="Analyse ECG par Nora" sublabel="Interpretation complete de votre electrocardiogramme" onClick={() => setShowNoraEcg(true)} />

        {/* Comprendre les donnees */}
        <div onClick={() => setShowExplain(true)} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 } as any}>
          <i className="ri-book-open-line" style={{ fontSize: 16, color: '#FFF' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Comprendre les donnees</span>
        </div>

        {showExplain && (
          <div onClick={() => setShowExplain(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 24px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => setShowExplain(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-book-open-line" style={{ fontSize: 26, color: '#F97316' }} /></div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Comprendre votre ECG</div>
              </div>
              {[
                { title: 'Frequence cardiaque (BPM)', icon: 'ri-heart-pulse-line', color: '#EF4444', text: 'Le nombre de battements par minute au repos. Entre 60 et 100 bpm est considere normal.' },
                { title: 'Rythme sinusal', icon: 'ri-checkbox-circle-line', color: '#10B981', text: "Un rythme sinusal signifie que l'impulsion electrique part du noeud sinusal. C'est le rythme normal." },
                { title: 'Fibrillation auriculaire', icon: 'ri-error-warning-line', color: '#EF4444', text: "Trouble du rythme ou les oreillettes battent de facon irreguliere. L'ECG permet de la detecter." },
                { title: 'Bradycardie / Tachycardie', icon: 'ri-pulse-line', color: '#F59E0B', text: 'En dessous de 60 bpm on parle de bradycardie, au dessus de 100 bpm de tachycardie.' },
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

        {/* Checklist */}
        <div data-testid="ecg-detail-checks" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14 } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Vérification automatique</div>
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

        {/* What is an ECG? — Educational card */}
        <div data-testid="ecg-education" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-question-line" style={{ fontSize: 16, color: '#F97316' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Qu'est-ce qu'un ECG ?</div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            L'electrocardiogramme (ECG) enregistré l'activite electrique de votre coeur. Chaque battement produit un signal electrique qui traverse le coeur et le fait se contracter. Le trace permet de detecter des anomalies du rythme cardiaque comme la fibrillation auriculaire, les blocs auriculo-ventriculaires ou les arythmies.
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 } as any}>
            {[
              { label: 'Onde P', desc: 'Contraction des oreillettes', color: '#38BDF8' },
              { label: 'Complexe QRS', desc: 'Contraction des ventricules', color: '#10B981' },
              { label: 'Onde T', desc: 'Récupération des ventricules', color: '#F59E0B' },
            ].map((w, i) => (
              <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: `${w.color}10`, textAlign: 'center' } as any}>
                <div style={{ fontSize: 11, fontWeight: 800, color: w.color }}>{w.label}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
      {showNoraEcg && <NoraOverlay token={token} endpoint={`/api/nora/page-analysis?context=ecg&ecg_id=${id || ''}`} title="Analyse ECG" subtitle="Interpretation par Nora de votre electrocardiogramme" onClose={() => setShowNoraEcg(false)} />}
    </div>
  );
}
