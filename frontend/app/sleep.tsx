import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import SleepHypnogram, { fromBraceletStages } from '../src/components/health/SleepHypnogram';

const STAGE_COLORS: Record<number, string> = { 0: '#F87171', 1: '#4338CA', 2: '#818CF8', 3: '#C4B5FD' };
const STAGE_LABELS: Record<number, string> = { 0: 'Eveil', 1: 'Profond', 2: 'Leger', 3: 'REM' };

/* ── Circular Arc Component ── */
function ArcGauge({ value, max, size, stroke, color, bg, children }: { value: number; max: number; size: number; stroke: number; color: string; bg: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r * 0.75; // 270 degrees
  const pct = Math.min(value / Math.max(max, 1), 1);
  const dash = circ * pct;
  const gap = circ - dash;
  return (
    <div style={{ position: 'relative', width: size, height: size } as any}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circ} ${2 * Math.PI * r - circ}`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${gap + (2 * Math.PI * r - circ)}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>{children}</div>
    </div>
  );
}

/* ── Mini Bar for sub-metrics ── */
function MetricBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div style={{ marginBottom: 10 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
          <i className={icon} style={{ fontSize: 12, color }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
        <div style={{ height: 6, borderRadius: 3, width: `${value}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, transition: 'width 1s ease' } as any} />
      </div>
    </div>
  );
}

/* ── Format minutes to Xh:MM ── */
function fmtMin(m: number) { return `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}`; }

export default function SleepScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [sleep, setSleep] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/health/sleep', {}, token).catch(() => null),
      apiFetch('/api/health/sleep/analysis', {}, token).catch(() => null),
      apiFetch('/api/health/sleep/history', {}, token).catch(() => []),
    ]).then(([s, a, h]) => { setSleep(s); setAnalysis(a); setHistory(Array.isArray(h) ? h : []); }).finally(() => setLoading(false));
  }, []);

  const sleepSession = useMemo(() => {
    if (!sleep?.stages?.length) return null;
    return fromBraceletStages(sleep.stages);
  }, [sleep?.stages]);

  // Compute analysis from sleep data if backend analysis has no data
  const rawAn = analysis || {};
  const computedAnalysis = (() => {
    if (rawAn.has_data) return rawAn;
    if (!sleep || !sleep.stages || sleep.stages.length === 0) return rawAn;

    const totalMin = sleep.total_minutes || 0;
    const quality = sleep.sleep_quality || 0;
    const deep = sleep.deep_minutes || 0;
    const light = sleep.light_minutes || 0;
    const rem = sleep.rem_minutes || 0;
    const awake = sleep.awake_minutes || 0;
    const baseNeed = 480;

    const suffPct = Math.min(100, Math.round(totalMin / baseNeed * 100));
    const effPct = totalMin > 0 ? Math.round(totalMin / (totalMin + awake) * 100) : 0;
    const stressScore = Math.max(0, Math.min(100, 100 - (awake * 8)));
    const consistencyScore = quality >= 80 ? 85 : quality >= 60 ? 65 : 40;
    const perfScore = Math.round(suffPct * 0.40 + consistencyScore * 0.20 + effPct * 0.25 + stressScore * 0.15);
    const debtMin = Math.max(0, baseNeed - totalMin);
    const recoveryScore = Math.round(Math.min(100, perfScore * 0.6 + quality * 0.4));
    const recoveryZone = recoveryScore >= 67 ? 'green' : recoveryScore >= 34 ? 'yellow' : 'red';
    const totalStages = deep + light + rem + awake;

    return {
      has_data: true,
      performance_score: perfScore,
      sufficiency: { score: suffPct, actual_min: totalMin, need_min: baseNeed, pct: suffPct },
      consistency: { score: consistencyScore, detail: `Qualite ${quality}%` },
      efficiency: { score: effPct, pct: effPct },
      sleep_stress: { score: stressScore, level: stressScore >= 70 ? 'faible' : stressScore >= 40 ? 'modere' : 'eleve' },
      debt: { total_min: debtMin, days: debtMin > 0 ? [{ date: new Date().toISOString().split('T')[0], deficit_min: debtMin, actual: totalMin, need: baseNeed }] : [] },
      recovery: { score: recoveryScore, zone: recoveryZone, hrv: 0, rhr: 0 },
      stages_avg: totalStages > 0 ? {
        deep_pct: Math.round(deep / totalStages * 100),
        light_pct: Math.round(light / totalStages * 100),
        rem_pct: Math.round(rem / totalStages * 100),
        awake_pct: Math.round(awake / totalStages * 100),
      } : { deep_pct: 0, light_pct: 0, rem_pct: 0, awake_pct: 0 },
      sleep_need_min: baseNeed,
      recommended_bedtime: '22:30',
      weekly_trend: [],
    };
  })();

  if (loading) return <FullScreenLoader />;

  const a = computedAnalysis;
  const hasData = sleep && sleep.stages && sleep.stages.length > 0;
  const perf = a.performance_score || 0;
  const suf = a.sufficiency || {};
  const con = a.consistency || {};
  const eff = a.efficiency || {};
  const stress = a.sleep_stress || {};
  const debt = a.debt || {};
  const rec = a.recovery || {};
  const stg = a.stages_avg || {};
  const trend = a.weekly_trend || [];
  const perfColor = perf >= 75 ? '#10B981' : perf >= 50 ? '#F59E0B' : perf >= 25 ? '#F97316' : '#EF4444';
  const recZoneColor = rec.zone === 'green' ? '#10B981' : rec.zone === 'yellow' ? '#F59E0B' : rec.zone === 'red' ? '#EF4444' : 'rgba(255,255,255,0.2)';

  return (
    <div data-testid="sleep-screen" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <style>{`@keyframes sl-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'linear-gradient(180deg, #0C0C14 0%, #111118 50%, #0C0C14 100%)' } as any}>

        {/* ── HEADER ── */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <div data-testid="sleep-back-btn" onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Sommeil</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Analyse detaillee</div>
          </div>
          <i className="ri-moon-fill" style={{ fontSize: 20, color: '#A78BFA' }} />
        </div>

        <div style={{ padding: '16px 20px 120px' } as any}>

          {/* ══════ NO DATA STATE ══════ */}
          {!hasData && (
            <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'sl-fade 0.5s ease' } as any}>
              <i className="ri-moon-line" style={{ fontSize: 64, color: 'rgba(167,139,250,0.2)' }} />
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginTop: 16 }}>Aucune donnee de sommeil</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8, lineHeight: 1.5 }}>Portez votre bracelet Elio pendant la nuit pour enregistrer votre sommeil</div>

              {/* Sleep Planner (always shown) */}
              <div style={{ marginTop: 32, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', textAlign: 'left' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-calendar-schedule-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Planificateur de sommeil</span>
                </div>
                <div style={{ display: 'flex', gap: 12 } as any}>
                  <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Coucher recommande</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#A78BFA' }}>{a.recommended_bedtime || '22:30'}</div>
                  </div>
                  <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>Besoin de sommeil</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{fmtMin(a.sleep_need_min || 480)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════ DATA PRESENT ══════ */}
          {hasData && (<>

            {/* ── 1. PERFORMANCE SCORE (Arc Gauge) ── */}
            <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px 20px', marginBottom: 14, animation: 'sl-fade 0.5s ease', textAlign: 'center' } as any}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 } as any}>
                <ArcGauge value={perf} max={100} size={160} stroke={10} color={perfColor} bg="rgba(255,255,255,0.06)">
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{perf}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>PERFORMANCE</div>
                </ArcGauge>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: perfColor, marginBottom: 4 }}>
                {perf >= 85 ? 'Sommeil optimal' : perf >= 70 ? 'Bon sommeil' : perf >= 50 ? 'Sommeil moyen' : 'Sommeil insuffisant'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {fmtMin(sleep?.total_minutes || 0)} de sommeil · {sleep?.cycles || 0} cycles
              </div>

              {/* Sub-metrics bars */}
              <div style={{ marginTop: 20 } as any}>
                <MetricBar label="Suffisance" value={suf.score || 0} color="#818CF8" icon="ri-battery-charge-line" />
                <MetricBar label="Regularite" value={con.score || 0} color="#38BDF8" icon="ri-rhythm-line" />
                <MetricBar label="Efficacite" value={eff.score || 0} color="#10B981" icon="ri-speed-line" />
                <MetricBar label="Stress nocturne" value={stress.score || 0} color="#F59E0B" icon="ri-mental-health-line" />
              </div>
            </div>

            {/* ── 2. HYPNOGRAM ── */}
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 0.6s ease' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                <i className="ri-bar-chart-horizontal-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hypnogramme</span>
              </div>
              {sleepSession && <SleepHypnogram session={sleepSession} width={500} height={340} showLabels={true} compact={false} />}
              {!sleepSession && <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Pas de donnees de phases</div>}
            </div>

            {/* ── 3. STAGES BREAKDOWN (Donut-style) ── */}
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 0.7s ease' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                <i className="ri-pie-chart-2-line" style={{ fontSize: 14, color: '#818CF8' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Repartition des phases</span>
              </div>

              {/* Stacked bar */}
              <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 14 } as any}>
                {[
                  { pct: sleep?.deep_minutes || 0, color: '#4338CA', label: 'Profond' },
                  { pct: sleep?.light_minutes || 0, color: '#818CF8', label: 'Leger' },
                  { pct: sleep?.rem_minutes || 0, color: '#C4B5FD', label: 'REM' },
                  { pct: sleep?.awake_minutes || 0, color: '#F87171', label: 'Eveil' },
                ].map((s, i) => {
                  const total = (sleep?.total_minutes || 1);
                  return <div key={i} style={{ flex: s.pct, background: s.color, minWidth: s.pct > 0 ? 2 : 0, transition: 'flex 0.6s ease' } as any} />;
                })}
              </div>

              {/* Stage cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                {[
                  { label: 'Profond', min: sleep?.deep_minutes || 0, color: '#4338CA', icon: 'ri-zzz-line', desc: 'Reparation physique' },
                  { label: 'Leger', min: sleep?.light_minutes || 0, color: '#818CF8', icon: 'ri-cloud-line', desc: 'Repos de base' },
                  { label: 'REM', min: sleep?.rem_minutes || 0, color: '#C4B5FD', icon: 'ri-brain-line', desc: 'Memoire, emotions' },
                  { label: 'Eveil', min: sleep?.awake_minutes || 0, color: '#F87171', icon: 'ri-alarm-line', desc: 'Interruptions' },
                ].map((item, i) => {
                  const total = sleep?.total_minutes || 1;
                  const pct = Math.round(item.min / total * 100);
                  return (
                    <div key={i} style={{ padding: '12px', borderRadius: 14, background: `${item.color}08`, border: `1px solid ${item.color}20` } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
                        <i className={item.icon} style={{ fontSize: 12, color: item.color }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: item.color }}>{item.label}</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{fmtMin(item.min)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 } as any}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{item.desc}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: item.color }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 4. SLEEP NEED & DEBT ── */}
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 0.8s ease' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                <i className="ri-battery-2-charge-line" style={{ fontSize: 14, color: '#38BDF8' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Besoin & dette de sommeil</span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
                {/* Actual vs Need comparison */}
                <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Obtenu</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{fmtMin(suf.actual_min || 0)}</div>
                  <div style={{ fontSize: 10, color: suf.pct >= 100 ? '#10B981' : suf.pct >= 85 ? '#F59E0B' : '#EF4444', fontWeight: 700, marginTop: 2 }}>{suf.pct || 0}% du besoin</div>
                </div>
                <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Besoin</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>{fmtMin(suf.need_min || 480)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginTop: 2 }}>Base + activite</div>
                </div>
              </div>

              {/* Debt tracker */}
              {(debt.total_min || 0) > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-error-warning-line" style={{ fontSize: 13, color: '#EF4444' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5' }}>Dette de sommeil</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#EF4444' }}>{fmtMin(debt.total_min)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Accumulee sur les {(debt.days || []).length} dernieres nuits</div>
                </div>
              )}
              {(debt.total_min || 0) === 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    <i className="ri-check-line" style={{ fontSize: 13, color: '#10B981' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6EE7B7' }}>Aucune dette de sommeil</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── 5. RECOVERY ── */}
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 0.9s ease' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                <i className="ri-heart-pulse-line" style={{ fontSize: 14, color: recZoneColor }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recuperation</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                {/* Recovery gauge */}
                <ArcGauge value={rec.score || 0} max={100} size={90} stroke={7} color={recZoneColor} bg="rgba(255,255,255,0.06)">
                  <div style={{ fontSize: 24, fontWeight: 900, color: recZoneColor }}>{rec.score || 0}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>%</div>
                </ArcGauge>

                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: recZoneColor, marginBottom: 6 }}>
                    {rec.zone === 'green' ? 'Pret pour l\'effort' : rec.zone === 'yellow' ? 'Effort modere' : rec.zone === 'red' ? 'Repos recommande' : '--'}
                  </div>
                  <div style={{ display: 'flex', gap: 12 } as any}>
                    {rec.hrv > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>VFC</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{rec.hrv} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>ms</span></div>
                      </div>
                    )}
                    {rec.rhr > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>FC repos</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{rec.rhr} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>bpm</span></div>
                      </div>
                    )}
                  </div>
                  {/* Zone indicator */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 } as any}>
                    {['red', 'yellow', 'green'].map(z => (
                      <div key={z} style={{ flex: 1, height: 4, borderRadius: 2, background: z === 'red' ? (rec.zone === 'red' ? '#EF4444' : 'rgba(239,68,68,0.15)') : z === 'yellow' ? (rec.zone === 'yellow' ? '#F59E0B' : 'rgba(245,158,11,0.15)') : (rec.zone === 'green' ? '#10B981' : 'rgba(16,185,129,0.15)') } as any} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 6. SLEEP PLANNER ── */}
            <div style={{ borderRadius: 18, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.10)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 1s ease' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                <i className="ri-calendar-schedule-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Planificateur de sommeil</span>
              </div>
              <div style={{ display: 'flex', gap: 10 } as any}>
                <div style={{ flex: 1, padding: '16px 12px', borderRadius: 14, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', textAlign: 'center' } as any}>
                  <i className="ri-moon-line" style={{ fontSize: 20, color: '#A78BFA', marginBottom: 6, display: 'block' }} />
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Coucher ideal</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#A78BFA' }}>{a.recommended_bedtime || '22:30'}</div>
                </div>
                <div style={{ flex: 1, padding: '16px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                  <i className="ri-sun-line" style={{ fontSize: 20, color: '#FCD34D', marginBottom: 6, display: 'block' }} />
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Reveil cible</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>07:00</div>
                </div>
                <div style={{ flex: 1, padding: '16px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                  <i className="ri-time-line" style={{ fontSize: 20, color: '#38BDF8', marginBottom: 6, display: 'block' }} />
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Besoin</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{fmtMin(a.sleep_need_min || 480)}</div>
                </div>
              </div>
            </div>

            {/* ── 7. WEEKLY TREND ── */}
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 1.1s ease' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                <i className="ri-line-chart-line" style={{ fontSize: 14, color: '#38BDF8' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>7 derniers jours</span>
              </div>

              {/* Bar chart with stacked stages */}
              {history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                  {history.map((h: any, i: number) => {
                    const total = (h.deep || 0) + (h.light || 0) + (h.rem || 0) + (h.awake || 0);
                    const maxDur = Math.max(...history.map((x: any) => x.duration || 0), 1);
                    const durPct = ((h.duration || 0) / maxDur) * 100;
                    const qualColor = (h.quality || 0) >= 80 ? '#10B981' : (h.quality || 0) >= 60 ? '#F59E0B' : '#EF4444';
                    const dayLabel = h.date ? new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short' }) : `J${i + 1}`;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                        <div style={{ width: 32, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textAlign: 'right', textTransform: 'capitalize' }}>{dayLabel}</div>
                        <div style={{ flex: 1, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', display: 'flex' } as any}>
                          <div style={{ width: `${durPct}%`, display: 'flex', borderRadius: 8, overflow: 'hidden', transition: 'width 0.6s ease' } as any}>
                            {total > 0 ? (<>
                              <div style={{ flex: h.deep || 0, background: '#4338CA', minWidth: h.deep ? 1 : 0 } as any} />
                              <div style={{ flex: h.light || 0, background: '#818CF8', minWidth: h.light ? 1 : 0 } as any} />
                              <div style={{ flex: h.rem || 0, background: '#C4B5FD', minWidth: h.rem ? 1 : 0 } as any} />
                              <div style={{ flex: Math.max(h.awake || 0, 0.5), background: '#F87171', minWidth: h.awake ? 1 : 0 } as any} />
                            </>) : (
                              <div style={{ flex: 1, background: 'rgba(167,139,250,0.3)' } as any} />
                            )}
                          </div>
                        </div>
                        <div style={{ width: 34, fontSize: 11, fontWeight: 800, color: '#FFF', textAlign: 'right' }}>{h.duration ? `${h.duration}h` : '--'}</div>
                        <div style={{ width: 28, fontSize: 10, fontWeight: 800, color: qualColor, textAlign: 'right' }}>{h.quality || 0}%</div>
                      </div>
                    );
                  })}

                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 8 } as any}>
                    {[
                      { label: 'Profond', color: '#4338CA' },
                      { label: 'Leger', color: '#818CF8' },
                      { label: 'REM', color: '#C4B5FD' },
                      { label: 'Eveil', color: '#F87171' },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 } as any}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: l.color } as any} />
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>Pas encore d'historique</div>
              )}
            </div>

            {/* ── 8. APNEA RISK ── */}
            {(() => {
              const inter = sleep?.awake_minutes || 0;
              const slQ = sleep?.sleep_quality || 0;
              const apneaRisk = Math.min(100, Math.max(5, inter * 12 + (slQ < 70 ? 20 : 0)));
              const apColor = apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444';
              return (
                <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px 16px', marginBottom: 14, animation: 'sl-fade 1.2s ease' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                    <i className="ri-lungs-line" style={{ fontSize: 14, color: apColor }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Risque d'apnee du sommeil</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: apColor }}>{apneaRisk < 30 ? 'Faible' : apneaRisk < 60 ? 'Modere' : 'Eleve'}</div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                        <div style={{ height: 8, borderRadius: 4, width: `${apneaRisk}%`, background: `linear-gradient(90deg, ${apColor}60, ${apColor})`, transition: 'width 1s ease' } as any} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 } as any}>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>0</span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>100</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Base sur {inter} interruption{inter > 1 ? 's' : ''} et la qualite du sommeil ({slQ}%)</div>
                </div>
              );
            })()}

          </>)}
        </div>
      </div>
    </div>
  );
}
