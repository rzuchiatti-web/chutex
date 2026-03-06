import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useDorsiBLE, DorsiAngles } from '../src/hooks/useDorsiBLE';

const ACCENT = '#F97316';
const BG = 'linear-gradient(135deg, #0A0A0F 0%, #141420 50%, #0A0A0F 100%)';

const DIRECTIONS = [
  { key: 'forward', label: 'Anteversion', desc: 'Inclinez le bassin vers l\'avant', icon: 'ri-arrow-up-line', axis: 'y', sign: -1 },
  { key: 'backward', label: 'Retroversion', desc: 'Inclinez le bassin vers l\'arriere', icon: 'ri-arrow-down-line', axis: 'y', sign: 1 },
  { key: 'left', label: 'Flexion gauche', desc: 'Inclinez le bassin vers la gauche', icon: 'ri-arrow-left-line', axis: 'x', sign: -1 },
  { key: 'right', label: 'Flexion droite', desc: 'Inclinez le bassin vers la droite', icon: 'ri-arrow-right-line', axis: 'x', sign: 1 },
];

function RadarChart({ measurements }: { measurements: Record<string, { mobility: number; pain: number }> }) {
  const size = 280, cx = size / 2, cy = size / 2, maxR = 110;
  const labels = ['Avant', 'Droite', 'Arriere', 'Gauche'];
  const keys = ['forward', 'right', 'backward', 'left'];
  const angles = keys.map((_, i) => (Math.PI * 2 * i) / 4 - Math.PI / 2);
  const pt = (a: number, v: number) => ({ x: cx + Math.cos(a) * (v / 100) * maxR, y: cy + Math.sin(a) * (v / 100) * maxR });
  const mPts = keys.map((k, i) => pt(angles[i], measurements[k]?.mobility || 0));
  const pPts = keys.map((k, i) => pt(angles[i], measurements[k]?.pain * 10 || 0));
  const path = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {[20, 40, 60, 80, 100].map(v => <polygon key={v} points={angles.map(a => `${cx + Math.cos(a) * (v / 100) * maxR},${cy + Math.sin(a) * (v / 100) * maxR}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />)}
      {angles.map((a, i) => <g key={i}><line x1={cx} y1={cy} x2={cx + Math.cos(a) * maxR} y2={cy + Math.sin(a) * maxR} stroke="rgba(255,255,255,0.1)" strokeWidth={1} /><text x={cx + Math.cos(a) * (maxR + 20)} y={cy + Math.sin(a) * (maxR + 20)} fill="rgba(255,255,255,0.5)" fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{labels[i]}</text></g>)}
      <path d={path(mPts)} fill={`${ACCENT}25`} stroke={ACCENT} strokeWidth={2.5} />
      {mPts.map((p, i) => <circle key={`m${i}`} cx={p.x} cy={p.y} r={4} fill={ACCENT} stroke="#FFF" strokeWidth={1.5} />)}
      <path d={path(pPts)} fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth={2} strokeDasharray="6,3" />
      {pPts.map((p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r={3.5} fill="#EF4444" stroke="#FFF" strokeWidth={1.5} />)}
    </svg>
  );
}

function GyroMeasure({ direction, bleConnected, angles, onCapture }: {
  direction: typeof DIRECTIONS[0]; bleConnected: boolean; angles: DorsiAngles; onCapture: (val: number) => void;
}) {
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [maxAngle, setMaxAngle] = useState(0);
  const [liveAngle, setLiveAngle] = useState(0);
  const baseRef = useRef<number>(0);
  const maxRef = useRef<number>(0);

  useEffect(() => {
    if (!capturing) return;
    const axis = direction.axis as 'x' | 'y';
    const raw = angles[axis];
    const delta = (raw - baseRef.current) * direction.sign;
    const clamped = Math.max(0, delta);
    setLiveAngle(Math.round(clamped * 10) / 10);
    if (clamped > maxRef.current) {
      maxRef.current = clamped;
      setMaxAngle(Math.round(clamped * 10) / 10);
    }
  }, [angles, capturing, direction]);

  const startCapture = () => {
    const axis = direction.axis as 'x' | 'y';
    baseRef.current = angles[axis];
    maxRef.current = 0;
    setMaxAngle(0);
    setLiveAngle(0);
    setCapturing(true);
    setCaptured(false);
  };

  const stopCapture = () => {
    setCapturing(false);
    setCaptured(true);
  };

  // Simulate for non-BLE mode
  const [simValue, setSimValue] = useState(0);
  const startSimCapture = () => {
    setCapturing(true);
    setCaptured(false);
    let v = 0;
    const iv = setInterval(() => {
      v += Math.random() * 5 + 1;
      if (v > 45) v = 45;
      setMaxAngle(Math.round(v * 10) / 10);
      setLiveAngle(Math.round(v * 10) / 10);
      setSimValue(v);
    }, 80);
    setTimeout(() => { clearInterval(iv); setCapturing(false); setCaptured(true); }, 3000);
  };

  // Convert max angle to mobility % (0-45° → 0-100%)
  const mobilityPct = Math.min(100, Math.round((maxAngle / 45) * 100));
  const ringPct = capturing ? (liveAngle / 45) * 100 : (maxAngle / 45) * 100;

  return (
    <div style={{ textAlign: 'center' } as any}>
      <div style={{ width: 160, height: 160, borderRadius: '50%', border: `3px solid ${capturing ? ACCENT : 'rgba(255,255,255,0.15)'}`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `conic-gradient(${ACCENT}40 ${Math.min(360, ringPct * 3.6)}deg, rgba(255,255,255,0.03) ${ringPct * 3.6}deg)`, transition: 'all 0.15s' } as any}>
        <div style={{ textAlign: 'center' } as any}>
          <i className={direction.icon} style={{ fontSize: 28, color: ACCENT, display: 'block', marginBottom: 4 }} />
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{maxAngle.toFixed(1)}°</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{mobilityPct}% mobilite</div>
        </div>
      </div>
      {!captured ? (
        capturing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' } as any}>
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>Inclinez au maximum... {liveAngle.toFixed(1)}°</div>
            <div data-testid={`stop-${direction.key}`} onClick={stopCapture} style={{ padding: '14px 32px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', color: '#EF4444', fontSize: 14, fontWeight: 700 } as any}>
              Arreter la mesure
            </div>
          </div>
        ) : (
          <div data-testid={`capture-${direction.key}`} onClick={bleConnected ? startCapture : startSimCapture} style={{ padding: '14px 32px', borderRadius: 999, background: ACCENT, cursor: 'pointer', color: '#FFF', fontSize: 14, fontWeight: 700, display: 'inline-block' } as any}>
            {bleConnected ? 'Mesurer' : 'Mesurer (simulation)'}
          </div>
        )
      ) : (
        <div onClick={() => onCapture(mobilityPct)} data-testid={`confirm-${direction.key}`} style={{ padding: '14px 32px', borderRadius: 999, background: '#10B981', cursor: 'pointer', color: '#FFF', fontSize: 14, fontWeight: 700, display: 'inline-block' } as any}>
          Valider ({maxAngle.toFixed(1)}° — {mobilityPct}%)
        </div>
      )}
    </div>
  );
}

export default function DorsiBilanPage() {
  const { token } = useAuth();
  const router = useRouter();
  const ble = useDorsiBLE();
  const [step, setStep] = useState(0);
  const [measurements, setMeasurements] = useState<Record<string, { mobility: number; pain: number }>>({});
  const [currentMobility, setCurrentMobility] = useState<Record<string, number>>({});
  const [painValues, setPainValues] = useState<Record<string, number>>({ forward: 0, backward: 0, left: 0, right: 0 });
  const [saving, setSaving] = useState(false);
  const [bilanResult, setBilanResult] = useState<any>(null);
  const [programCreated, setProgramCreated] = useState(false);

  const handleMobilityCapture = (dirKey: string, val: number) => {
    setCurrentMobility(prev => ({ ...prev, [dirKey]: val }));
    const dirIdx = DIRECTIONS.findIndex(d => d.key === dirKey);
    if (dirIdx < DIRECTIONS.length - 1) setTimeout(() => setStep(dirIdx + 3), 500);
    else setTimeout(() => setStep(6), 500);
  };

  const submitBilan = useCallback(async () => {
    setSaving(true);
    const m: Record<string, { mobility: number; pain: number }> = {};
    DIRECTIONS.forEach(d => { m[d.key] = { mobility: currentMobility[d.key] || 50, pain: painValues[d.key] || 0 }; });
    setMeasurements(m);
    try {
      const result = await apiFetch('/api/dorsi/bilan', { method: 'POST', body: JSON.stringify({ measurements: m }) }, token);
      setBilanResult(result);
      setStep(7);
    } catch (e: any) { alert(e.message || 'Erreur'); } finally { setSaving(false); }
  }, [currentMobility, painValues, token]);

  const createProgram = useCallback(async () => {
    if (!bilanResult?.id) return;
    try {
      await apiFetch('/api/dorsi/program', { method: 'POST', body: JSON.stringify({ bilan_id: bilanResult.id }) }, token);
      setProgramCreated(true);
      setTimeout(() => router.push('/dorsi-program' as any), 1000);
    } catch (e: any) { alert(e.message || 'Erreur'); }
  }, [bilanResult, token, router]);

  if (Platform.OS !== 'web') return null;

  const renderStep = () => {
    // Step 0: Introduction + BLE connection
    if (step === 0) return (
      <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' } as any}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' } as any}>
          <i className="ri-body-scan-line" style={{ fontSize: 36, color: ACCENT }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>Bilan de mobilite lombaire</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 24px' }}>
          Ce bilan evalue votre mobilite lombaire dans 4 directions via le capteur gyroscopique du coussin HeloKine.
        </p>

        {/* BLE Connection status */}
        <div style={{ background: ble.connected ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${ble.connected ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: 20, marginBottom: 20 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ble.connected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${ble.connected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={ble.connected ? 'ri-bluetooth-connect-fill' : 'ri-bluetooth-line'} style={{ fontSize: 22, color: ble.connected ? '#10B981' : 'rgba(255,255,255,0.4)' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{ble.connected ? ble.deviceName : 'Coussin non connecte'}</div>
              <div style={{ fontSize: 11, color: ble.connected ? '#10B981' : 'rgba(255,255,255,0.35)' }}>
                {ble.connected ? `Connecte — Batterie ${ble.battery}%` : 'Connectez votre coussin HeloKine'}
              </div>
            </div>
            {!ble.connected && (
              <div data-testid="ble-connect-btn" onClick={ble.connect} style={{ padding: '8px 16px', borderRadius: 999, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, cursor: ble.connecting ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap' } as any}>
                {ble.connecting ? 'Recherche...' : 'Connecter'}
              </div>
            )}
            {ble.connected && (
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' } as any} />
            )}
          </div>
          {ble.error && <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 10, textAlign: 'left' } as any}>{ble.error}</div>}
        </div>

        {!ble.connected && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' } as any}>
            <div style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-information-line" style={{ fontSize: 16, flexShrink: 0 }} />
              <span>Sans coussin connecte, les mesures seront simulees. Vous pourrez refaire le bilan avec le coussin plus tard.</span>
            </div>
          </div>
        )}

        <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
            <i className="ri-information-line" style={{ fontSize: 18, color: ACCENT }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Instructions</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 2 }}>
            <li>Asseyez-vous au centre du coussin</li>
            <li>Gardez le dos droit contre le dossier</li>
            <li>Pieds a plat au sol, ecartement des hanches</li>
            <li>Respirez normalement pendant les mesures</li>
          </ul>
        </div>
        <div data-testid="start-bilan-btn" onClick={() => setStep(1)} style={{ padding: '16px 40px', borderRadius: 999, background: ACCENT, cursor: 'pointer', color: '#FFF', fontSize: 15, fontWeight: 800, display: 'inline-block' } as any}>
          Commencer le bilan
        </div>
      </div>
    );

    // Step 1: Taring
    if (step === 1) return (
      <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' } as any}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' } as any}>
          <i className="ri-compass-3-line" style={{ fontSize: 36, color: '#10B981' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>Tarage du gyroscope</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 24px' }}>
          Restez immobile dans votre position de depart. {ble.connected ? 'Le capteur du HeloKine va se calibrer.' : 'Simulation du calibrage.'}
        </p>
        {ble.connected && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 20 } as any}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Angles actuels</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF', fontFamily: 'monospace' }}>
              X: {ble.angles.x.toFixed(1)}° Y: {ble.angles.y.toFixed(1)}° Z: {ble.angles.z.toFixed(1)}°
            </div>
          </div>
        )}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 28px' } as any}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(16,185,129,0.3)', animation: 'pulseRing 2s ease-out infinite' } as any} />
          <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-checkbox-circle-line" style={{ fontSize: 28, color: '#10B981' }} />
          </div>
        </div>
        <div data-testid="tare-done-btn" onClick={() => { ble.tare(); setStep(2); }} style={{ padding: '16px 40px', borderRadius: 999, background: '#10B981', cursor: 'pointer', color: '#FFF', fontSize: 15, fontWeight: 800, display: 'inline-block' } as any}>
          Tarage termine — Continuer
        </div>
      </div>
    );

    // Steps 2-5: Measure directions
    if (step >= 2 && step <= 5) {
      const dirIdx = step - 2;
      const dir = DIRECTIONS[dirIdx];
      return (
        <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 } as any}>
            {DIRECTIONS.map((_, i) => <div key={i} style={{ height: 4, borderRadius: 2, width: i === dirIdx ? 28 : 12, background: i === dirIdx ? ACCENT : i < dirIdx ? `${ACCENT}66` : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' } as any} />)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: `${ACCENT}80`, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Direction {dirIdx + 1}/4</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>{dir.label}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>{dir.desc}</p>
          <GyroMeasure direction={dir} bleConnected={ble.connected} angles={ble.angles} onCapture={(val) => handleMobilityCapture(dir.key, val)} />
          {currentMobility[dir.key] !== undefined && (
            <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              <i className="ri-check-line" style={{ color: '#10B981', marginRight: 4 }} />Capture: {currentMobility[dir.key]}%
            </div>
          )}
        </div>
      );
    }

    // Step 6: Pain levels
    if (step === 6) return (
      <div style={{ maxWidth: 420, margin: '0 auto' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
            <i className="ri-hearts-line" style={{ fontSize: 28, color: '#EF4444' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>Niveau de douleur</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Indiquez votre niveau de douleur pour chaque direction.</p>
        </div>
        {DIRECTIONS.map(dir => (
          <div key={dir.key} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className={dir.icon} style={{ fontSize: 18, color: ACCENT }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{dir.label}</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: painValues[dir.key] > 6 ? '#EF4444' : painValues[dir.key] > 3 ? '#F59E0B' : '#10B981' }}>{painValues[dir.key]}</span>
            </div>
            <input data-testid={`pain-slider-${dir.key}`} type="range" min={0} max={10} step={1} value={painValues[dir.key]} onChange={(e: any) => setPainValues(prev => ({ ...prev, [dir.key]: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: ACCENT, height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 } as any}><span>Aucune</span><span>Maximale</span></div>
          </div>
        ))}
        <div data-testid="submit-bilan-btn" onClick={submitBilan} style={{ marginTop: 20, padding: '16px', borderRadius: 999, background: ACCENT, cursor: saving ? 'default' : 'pointer', color: '#FFF', fontSize: 15, fontWeight: 800, textAlign: 'center', opacity: saving ? 0.6 : 1 } as any}>
          {saving ? 'Analyse en cours...' : 'Voir les resultats'}
        </div>
      </div>
    );

    // Step 7: Results
    if (step === 7) return (
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' } as any}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
          <i className="ri-bar-chart-box-line" style={{ fontSize: 28, color: ACCENT }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>Resultats du bilan</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>Diagramme de Kiviat — Mobilite et douleur lombaire</p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20 } as any}>
          <RadarChart measurements={measurements} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 12, height: 3, borderRadius: 2, background: ACCENT } as any} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Mobilite</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 12, height: 3, borderRadius: 2, background: '#EF4444' } as any} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Douleur</span></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 } as any}>
          {DIRECTIONS.map(dir => { const m = measurements[dir.key]; if (!m) return null; return (
            <div key={dir.key} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, textAlign: 'left' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}><i className={dir.icon} style={{ fontSize: 14, color: ACCENT }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{dir.label}</span></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Mobilite: <strong style={{ color: '#FFF' }}>{m.mobility}%</strong></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Douleur: <strong style={{ color: m.pain > 6 ? '#EF4444' : m.pain > 3 ? '#F59E0B' : '#10B981' }}>{m.pain}/10</strong></div>
            </div>
          ); })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' } as any}>
          {!programCreated ? (
            <div data-testid="create-program-btn" onClick={createProgram} style={{ padding: '16px 28px', borderRadius: 999, background: ACCENT, cursor: 'pointer', color: '#FFF', fontSize: 14, fontWeight: 800 } as any}>
              <i className="ri-calendar-check-line" style={{ marginRight: 8 }} />Generer un programme
            </div>
          ) : (
            <div style={{ padding: '16px 28px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: 14, fontWeight: 800 } as any}>
              <i className="ri-check-line" style={{ marginRight: 8 }} />Programme cree !
            </div>
          )}
          <div data-testid="play-games-btn" onClick={() => router.push('/dorsi-program' as any)} style={{ padding: '16px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: '#FFF', fontSize: 14, fontWeight: 700 } as any}>
            <i className="ri-gamepad-line" style={{ marginRight: 8 }} />Jouer aux jeux
          </div>
        </div>
      </div>
    );
    return null;
  };

  return (
    <div data-testid="dorsi-bilan-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: BG, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 24px', gap: 12 } as any}>
          <div data-testid="back-btn" onClick={() => step > 0 && step < 7 ? setStep(step - 1) : router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Bilan Dorsi</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {ble.connected ? `${ble.deviceName} connecte` : 'Mode simulation'}
            </div>
          </div>
          {ble.connected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' } as any} />}
        </div>
        {renderStep()}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes pulseRing{0%{transform:scale(1);opacity:0.4}100%{transform:scale(2);opacity:0}} input[type="range"]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.08);border-radius:4px;outline:none} input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:${ACCENT};cursor:pointer;border:2px solid #FFF}` }} />
    </div>
  );
}
