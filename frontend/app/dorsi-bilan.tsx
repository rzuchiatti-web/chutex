import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useDorsiBLE } from '../src/hooks/useDorsiBLE';

const BG_IMG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
const G: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '24px 20px' };
const BTN: any = { padding: '16px 40px', borderRadius: 999, background: '#FFF', cursor: 'pointer', color: '#1a1a2e', fontSize: 15, fontWeight: 800, textAlign: 'center', display: 'inline-block' };

const DIRS = [
  { key: 'forward', label: 'Anteversion', desc: 'Inclinez le bassin vers l\'avant', icon: 'ri-arrow-up-line', axis: 'y' as const, sign: -1 },
  { key: 'backward', label: 'Retroversion', desc: 'Inclinez le bassin vers l\'arriere', icon: 'ri-arrow-down-line', axis: 'y' as const, sign: 1 },
  { key: 'left', label: 'Flexion gauche', desc: 'Inclinez le bassin vers la gauche', icon: 'ri-arrow-left-line', axis: 'x' as const, sign: -1 },
  { key: 'right', label: 'Flexion droite', desc: 'Inclinez le bassin vers la droite', icon: 'ri-arrow-right-line', axis: 'x' as const, sign: 1 },
];

// ── Stepper ──
function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 24 } as any}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ height: 4, borderRadius: 2, width: i === current ? 32 : 10, background: i < current ? 'rgba(255,255,255,0.6)' : i === current ? '#FFF' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s' } as any} />
      ))}
    </div>
  );
}

// ── Radar Chart with overlay support ──
function RadarChart({ allBilans }: { allBilans: { measurements: Record<string, { mobility: number; pain: number }>; created_at: string }[] }) {
  const size = 300, cx = size / 2, cy = size / 2, maxR = 120;
  const labels = ['Avant', 'Droite', 'Arriere', 'Gauche'];
  const keys = ['forward', 'right', 'backward', 'left'];
  const angles = keys.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const pt = (a: number, v: number) => ({ x: cx + Math.cos(a) * (v / 100) * maxR, y: cy + Math.sin(a) * (v / 100) * maxR });
  const path = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  const colors = ['#F97316', '#22D3EE', '#10B981', '#A78BFA', '#EF4444'];
  const painColor = '#EF4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid */}
      {[20, 40, 60, 80, 100].map(v => <polygon key={v} points={angles.map(a => `${cx + Math.cos(a) * (v / 100) * maxR},${cy + Math.sin(a) * (v / 100) * maxR}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />)}
      {angles.map((a, i) => <g key={i}><line x1={cx} y1={cy} x2={cx + Math.cos(a) * maxR} y2={cy + Math.sin(a) * maxR} stroke="rgba(255,255,255,0.12)" strokeWidth={1} /><text x={cx + Math.cos(a) * (maxR + 22)} y={cy + Math.sin(a) * (maxR + 22)} fill="#FFF" fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="middle">{labels[i]}</text></g>)}
      {/* Scale labels */}
      {[20, 40, 60, 80, 100].map(v => <text key={v} x={cx + 4} y={cy - (v / 100) * maxR + 4} fill="rgba(255,255,255,0.25)" fontSize={8}>{v}%</text>)}
      {/* Bilan overlays */}
      {allBilans.map((bilan, bi) => {
        const m = bilan.measurements;
        const c = colors[bi % colors.length];
        const opacity = bi === 0 ? 1 : 0.4;
        const mPts = keys.map((k, i) => pt(angles[i], m[k]?.mobility || 0));
        const pPts = keys.map((k, i) => pt(angles[i], m[k]?.pain * 10 || 0));
        return (
          <g key={bi} opacity={opacity}>
            <path d={path(mPts)} fill={`${c}20`} stroke={c} strokeWidth={bi === 0 ? 3 : 1.5} />
            {mPts.map((p, i) => <circle key={`m${i}`} cx={p.x} cy={p.y} r={bi === 0 ? 5 : 3} fill={c} stroke="#FFF" strokeWidth={1.5} />)}
            {bi === 0 && <>
              <path d={path(pPts)} fill={`${painColor}15`} stroke={painColor} strokeWidth={2} strokeDasharray="6,3" />
              {pPts.map((p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r={4} fill={painColor} stroke="#FFF" strokeWidth={1.5} />)}
            </>}
          </g>
        );
      })}
    </svg>
  );
}

// ── Gauge for measurement ──
function MeasureGauge({ direction, onComplete }: { direction: typeof DIRS[0]; onComplete: (mobility: number) => void }) {
  const [pct, setPct] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const maxRef = useRef(0);

  const start = () => {
    setRunning(true); setDone(false); setPct(0); maxRef.current = 0;
    let v = 0;
    const iv = setInterval(() => {
      v += Math.random() * 4 + 1;
      if (v > 100) v = 100;
      if (v > maxRef.current) maxRef.current = Math.round(v);
      setPct(Math.round(v));
      if (v >= 100) { clearInterval(iv); setRunning(false); setDone(true); }
    }, 60);
    setTimeout(() => { clearInterval(iv); setRunning(false); setDone(true); }, 4000);
  };

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ textAlign: 'center' } as any}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ display: 'block', margin: '0 auto 16px' }}>
        <circle cx={90} cy={90} r={70} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle cx={90} cy={90} r={70} fill="none" stroke={done ? '#10B981' : '#F97316'} strokeWidth={8} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 90 90)" style={{ transition: 'stroke-dashoffset 0.1s' }} />
        <text x={90} y={78} fill="#FFF" fontSize={32} fontWeight={900} textAnchor="middle">{pct}%</text>
        <text x={90} y={100} fill="rgba(255,255,255,0.5)" fontSize={11} textAnchor="middle">mobilite</text>
      </svg>
      {!done && !running && <div onClick={start} style={{ ...BTN }} data-testid={`measure-${direction.key}`}>Mesurer</div>}
      {running && <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>Inclinez au maximum...</div>}
      {done && <div onClick={() => onComplete(maxRef.current)} style={{ ...BTN, background: '#10B981', color: '#FFF' }} data-testid={`next-${direction.key}`}>Valider {maxRef.current}%</div>}
    </div>
  );
}

// ── Pain Slider ──
function PainSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ ...G, marginTop: 16 } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Niveau de douleur</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: value > 6 ? '#EF4444' : value > 3 ? '#F59E0B' : '#10B981' }}>{value}/10</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value} onChange={(e: any) => onChange(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FFF', height: 6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 } as any}><span>Aucune</span><span>Maximale</span></div>
    </div>
  );
}

export default function DorsiBilanPage() {
  const { token } = useAuth();
  const router = useRouter();
  const ble = useDorsiBLE();
  // Steps: 0=intro, 1=connect, 2=tare, 3-6=direction+pain (4 dirs), 7=results
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, { mobility: number; pain: number }>>({});
  const [currentPain, setCurrentPain] = useState(0);
  const [saving, setSaving] = useState(false);
  const [bilanResult, setBilanResult] = useState<any>(null);
  const [allBilans, setAllBilans] = useState<any[]>([]);
  const [dirMeasured, setDirMeasured] = useState(false);

  // Fetch previous bilans for overlay
  useEffect(() => {
    if (token) apiFetch('/api/dorsi/bilans', {}, token).then(setAllBilans).catch(() => {});
  }, [token]);

  const handleMeasured = (dirKey: string, mobility: number) => {
    setData(prev => ({ ...prev, [dirKey]: { ...prev[dirKey], mobility, pain: 0 } }));
    setDirMeasured(true);
    setCurrentPain(0);
  };

  const confirmPainAndNext = () => {
    const dirIdx = step - 3;
    const dir = DIRS[dirIdx];
    setData(prev => ({ ...prev, [dir.key]: { ...prev[dir.key], pain: currentPain } }));
    setDirMeasured(false);
    setCurrentPain(0);
    if (dirIdx < 3) setStep(step + 1);
    else submitBilan();
  };

  const submitBilan = useCallback(async () => {
    setSaving(true);
    const dirIdx = step - 3;
    const dir = DIRS[dirIdx];
    const finalData = { ...data, [dir.key]: { ...data[dir.key], pain: currentPain } };
    try {
      const result = await apiFetch('/api/dorsi/bilan', { method: 'POST', body: JSON.stringify({ measurements: finalData }) }, token);
      setBilanResult(result);
      setData(finalData);
      setStep(7);
      // Refresh bilans for overlay
      apiFetch('/api/dorsi/bilans', {}, token).then(setAllBilans).catch(() => {});
    } catch (e: any) { alert(e.message || 'Erreur'); } finally { setSaving(false); }
  }, [data, currentPain, step, token]);

  const createProgram = useCallback(async () => {
    if (!bilanResult?.id) return;
    try {
      await apiFetch('/api/dorsi/program', { method: 'POST', body: JSON.stringify({ bilan_id: bilanResult.id }) }, token);
      router.push('/dorsi-program' as any);
    } catch (e: any) { alert(e.message || 'Erreur'); }
  }, [bilanResult, token, router]);

  if (Platform.OS !== 'web') return null;

  const totalSteps = 8; // intro, connect, tare, 4 dirs, results

  const renderStep = () => {
    // ── Step 0: Introduction ──
    if (step === 0) return (
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' } as any}>
        <div style={{ ...G, marginBottom: 20, padding: '32px 24px' } as any}>
          <i className="ri-body-scan-line" style={{ fontSize: 44, color: '#FFF', display: 'block', marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>Bilan lombaire</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>Evaluez votre mobilite dans 4 directions.</p>
        </div>
        <div style={{ ...G, textAlign: 'left', marginBottom: 20 } as any}>
          {[
            { icon: 'ri-armchair-line', text: 'Asseyez-vous au centre du coussin' },
            { icon: 'ri-user-line', text: 'Dos droit contre le dossier' },
            { icon: 'ri-footprint-line', text: 'Pieds a plat au sol' },
            { icon: 'ri-lungs-line', text: 'Respirez normalement' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
              <i className={s.icon} style={{ fontSize: 18, color: '#FFF', opacity: 0.7 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{s.text}</span>
            </div>
          ))}
        </div>
        <div onClick={() => setStep(1)} style={BTN} data-testid="start-bilan-btn">Commencer</div>
      </div>
    );

    // ── Step 1: BLE Connect ──
    if (step === 1) return (
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' } as any}>
        <div style={{ ...G, marginBottom: 20 } as any}>
          <i className={ble.connected ? 'ri-bluetooth-connect-fill' : 'ri-bluetooth-line'} style={{ fontSize: 40, color: '#FFF', display: 'block', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>{ble.connected ? `${ble.deviceName} connecte` : 'Connexion coussin'}</h2>
          {!ble.connected && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>Connectez votre coussin HeloKine ou continuez en simulation.</p>}
          {!ble.connected && <div onClick={ble.connect} style={{ ...BTN, marginBottom: 12 }} data-testid="ble-connect-btn">{ble.connecting ? 'Recherche...' : 'Connecter le coussin'}</div>}
          {ble.connected && <div style={{ fontSize: 13, color: '#10B981', marginBottom: 16 }}>Batterie {ble.battery}%</div>}
        </div>
        <div onClick={() => setStep(2)} style={{ ...BTN, background: ble.connected ? '#FFF' : 'rgba(255,255,255,0.15)', color: ble.connected ? '#1a1a2e' : '#FFF' } as any} data-testid="skip-ble-btn">
          {ble.connected ? 'Continuer' : 'Continuer sans coussin'}
        </div>
      </div>
    );

    // ── Step 2: Taring ──
    if (step === 2) return (
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' } as any}>
        <div style={{ ...G, marginBottom: 20 } as any}>
          <i className="ri-compass-3-line" style={{ fontSize: 40, color: '#FFF', display: 'block', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>Calibration</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>Restez immobile, dos droit. Le capteur se calibre.</p>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseRing 2s ease-out infinite', position: 'relative' } as any}>
            <i className="ri-check-line" style={{ fontSize: 32, color: '#FFF' }} />
          </div>
        </div>
        <div onClick={() => { ble.tare(); setStep(3); }} style={BTN} data-testid="tare-done-btn">Tarage OK — Continuer</div>
      </div>
    );

    // ── Steps 3-6: Direction measurement + pain ──
    if (step >= 3 && step <= 6) {
      const dirIdx = step - 3;
      const dir = DIRS[dirIdx];
      return (
        <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Direction {dirIdx + 1}/4</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFF', margin: '0 0 4px' }}>{dir.label}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>{dir.desc}</p>

          <div style={{ ...G, marginBottom: 12 } as any}>
            {!dirMeasured ? (
              <MeasureGauge direction={dir} onComplete={(v) => handleMeasured(dir.key, v)} />
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 8 }}>Mobilite: {data[dir.key]?.mobility}%</div>
                <PainSlider value={currentPain} onChange={setCurrentPain} />
                <div onClick={confirmPainAndNext} style={{ ...BTN, marginTop: 16, width: '100%' } as any} data-testid={`confirm-${dir.key}`}>
                  {saving ? 'Analyse...' : dirIdx < 3 ? 'Direction suivante' : 'Voir les resultats'}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // ── Step 7: Results with superimposed radar ──
    if (step === 7) {
      const bilanForChart = bilanResult ? [{ measurements: data, created_at: bilanResult.created_at }, ...allBilans.filter(b => b.id !== bilanResult.id).slice(0, 3)] : allBilans.slice(0, 4);
      return (
        <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' } as any}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>Resultats</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>
            {allBilans.length > 1 ? `${allBilans.length} bilans superposes — Comparez votre evolution` : 'Diagramme de mobilite et douleur'}
          </p>

          <div style={{ ...G, marginBottom: 16, padding: 20 } as any}>
            <RadarChart allBilans={bilanForChart} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 12, height: 3, borderRadius: 2, background: '#F97316' } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Mobilite</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 12, height: 3, borderRadius: 2, background: '#EF4444' } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Douleur</span></div>
              {allBilans.length > 1 && <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 12, height: 3, borderRadius: 2, background: '#22D3EE', opacity: 0.5 } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Precedent</span></div>}
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 } as any}>
            {DIRS.map(dir => { const m = data[dir.key]; if (!m) return null; return (
              <div key={dir.key} style={{ ...G, padding: 14, textAlign: 'left' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
                  <i className={dir.icon} style={{ fontSize: 14, color: '#FFF' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>{dir.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{m.mobility}%</div>
                <div style={{ fontSize: 10, color: m.pain > 6 ? '#EF4444' : m.pain > 3 ? '#F59E0B' : 'rgba(255,255,255,0.4)' }}>Douleur {m.pain}/10</div>
              </div>
            ); })}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' } as any}>
            <div onClick={createProgram} style={BTN} data-testid="create-program-btn">Generer un programme</div>
            <div onClick={() => router.push('/dorsi-program' as any)} style={{ ...BTN, background: 'rgba(255,255,255,0.15)', color: '#FFF' } as any} data-testid="play-games-btn">Jouer</div>
          </div>

          {allBilans.length > 0 && (
            <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              Prochain bilan recommande dans 10 jours
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div data-testid="dorsi-bilan-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch', zIndex: 5 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 12px', gap: 12 } as any}>
          <div data-testid="back-btn" onClick={() => step > 0 && step < 7 ? setStep(Math.max(0, step - 1)) : router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Bilan Dorsi</div>
          </div>
        </div>
        <Stepper current={step} total={totalSteps} />
        {renderStep()}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes pulseRing{0%{transform:scale(1);opacity:0.4}100%{transform:scale(1.5);opacity:0}} input[type="range"]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.12);border-radius:4px;outline:none} input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:#FFF;cursor:pointer;border:none}` }} />
    </div>
  );
}
