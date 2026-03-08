import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

/* ── Design tokens ── */
const ACCENT = '#F59E0B';
const ACCENT_DIM = 'rgba(245,158,11,0.12)';
const GREEN = '#10B981';
const RED = '#EF4444';
const BLUE = '#60A5FA';
const PURPLE = '#A78BFA';
const CARD: any = {
  borderRadius: 20,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};
const MEAL_META: Record<string, { icon: string; gradient: string }> = {
  breakfast: { icon: 'ri-cup-line', gradient: 'linear-gradient(135deg, #F59E0B22, #F59E0B08)' },
  lunch: { icon: 'ri-restaurant-2-line', gradient: 'linear-gradient(135deg, #10B98122, #10B98108)' },
  snack: { icon: 'ri-apple-line', gradient: 'linear-gradient(135deg, #A78BFA22, #A78BFA08)' },
  dinner: { icon: 'ri-moon-line', gradient: 'linear-gradient(135deg, #60A5FA22, #60A5FA08)' },
};
const MEAL_COLORS: Record<string, string> = { breakfast: '#F59E0B', lunch: '#10B981', snack: '#A78BFA', dinner: '#60A5FA' };
const EX_ICONS: Record<string, string> = { cardio: 'ri-heart-pulse-line', renforcement: 'ri-boxing-line', souplesse: 'ri-body-scan-line', equilibre: 'ri-walk-line' };

/* ── SVG Weight Chart ── */
function WeightChart({ history }: { history: any[] }) {
  if (history.length < 2) return null;
  const data = [...history].reverse().slice(-14);
  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;
  const W = 340, H = 120, PX = 12, PY = 16;
  const plotW = W - PX * 2, plotH = H - PY * 2;
  const step = plotW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: PX + i * step,
    y: PY + plotH - ((d.weight - minW) / range) * plotH,
    w: d.weight,
    date: d.date,
  }));

  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${H - PY} L${points[0].x},${H - PY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 130, display: 'block' }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.4" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="1" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={PX} x2={W - PX} y1={PY + plotH * (1 - f)} y2={PY + plotH * (1 - f)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#wg)">
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
      </path>
      <path d={linePath} fill="none" stroke="url(#wl)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.2s" fill="freeze" />
        <animate attributeName="stroke-dasharray" from="1000" to="1000" dur="0.01s" fill="freeze" />
      </path>
      {points.map((p, i) => (
        <g key={i}>
          {i === points.length - 1 && (
            <>
              <circle cx={p.x} cy={p.y} r="6" fill={ACCENT} opacity="0.2">
                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={p.x} cy={p.y} r="4" fill={ACCENT} stroke="#1a1a2e" strokeWidth="2" />
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill={ACCENT} fontSize="11" fontWeight="800">{p.w}kg</text>
            </>
          )}
          {i === 0 && points.length > 2 && (
            <text x={p.x} y={p.y - 10} textAnchor="start" fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="600">{p.w}kg</text>
          )}
          {i > 0 && i < points.length - 1 && (
            <circle cx={p.x} cy={p.y} r="2" fill="rgba(255,255,255,0.15)" />
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── BMI Gauge ── */
function BMIGauge({ bmi, info }: { bmi: number; info: any }) {
  if (!bmi || bmi <= 0) return null;
  const min = 15, max = 40;
  const pct = Math.max(0, Math.min(100, ((bmi - min) / (max - min)) * 100));
  const zones = [
    { start: 0, end: ((18.5 - min) / (max - min)) * 100, color: '#60A5FA' },
    { start: ((18.5 - min) / (max - min)) * 100, end: ((25 - min) / (max - min)) * 100, color: '#10B981' },
    { start: ((25 - min) / (max - min)) * 100, end: ((30 - min) / (max - min)) * 100, color: '#F59E0B' },
    { start: ((30 - min) / (max - min)) * 100, end: 100, color: '#EF4444' },
  ];

  return (
    <div data-testid="bmi-gauge" style={{ position: 'relative', padding: '0 4px' } as any}>
      <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' } as any}>
        {zones.map((z, i) => (
          <div key={i} style={{ width: `${z.end - z.start}%`, height: '100%', background: z.color, opacity: 0.5 } as any} />
        ))}
      </div>
      <div style={{
        position: 'absolute', top: -3, left: `calc(${pct}% - 7px)`,
        width: 14, height: 14, borderRadius: '50%',
        background: info?.color || ACCENT, border: '2px solid rgba(0,0,0,0.6)',
        boxShadow: `0 0 12px ${info?.color || ACCENT}60`,
        transition: 'left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      } as any} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 } as any}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>15</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>18.5</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>25</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>30</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>40</span>
      </div>
    </div>
  );
}

/* ── Body Composition Ring ── */
function CompositionRing({ value, max, color, label, unit }: { value: number; max: number; color: string; label: string; unit: string }) {
  if (!value || value <= 0) return null;
  const pct = Math.min(100, (value / max) * 100);
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } as any}>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
        <text x="34" y="32" textAnchor="middle" fill="#FFF" fontSize="14" fontWeight="900">{value}</text>
        <text x="34" y="43" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">{unit}</text>
      </svg>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

/* ── Main Page ── */
export default function MinceurPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [targetKg, setTargetKg] = useState(75);
  const [goalWeeks, setGoalWeeks] = useState(12);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'meals' | 'exercises'>('meals');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
      const d = await apiFetch('/api/minceur/weight-details', {}, token);
      setData(d);
      if (d.current?.weight > 0 && !d.goal) {
        setTargetKg(Math.round(d.current.weight - 3));
      }
      if (d.goal?.target_kg) {
        setTargetKg(d.goal.target_kg);
        if (d.goal.weeks) setGoalWeeks(d.goal.weeks);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const saveGoal = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/minceur/weight-goal', {
        method: 'POST',
        body: JSON.stringify({ target_kg: targetKg, weeks: goalWeeks }),
      }, token);
      setShowGoalForm(false);
      setLoading(true);
      await fetchData();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const removeGoal = async () => {
    try {
      await apiFetch('/api/minceur/weight-goal', { method: 'DELETE' }, token);
      setShowGoalForm(false);
      setLoading(true);
      await fetchData();
    } catch {}
  };

  const refreshRecs = async () => {
    setRefreshing(true);
    try {
      await apiFetch('/api/minceur/refresh-recommendations', { method: 'POST' }, token);
      await fetchData();
    } catch { setRefreshing(false); }
  };

  if (Platform.OS !== 'web') return null;

  const c = data?.current || {};
  const bc = data?.body_composition || {};
  const recs = data?.recommendations;
  const history = data?.weight_history || [];
  const stats = data?.weight_stats || {};
  const goal = data?.goal;

  const fadeIn = (delay: number) => mounted ? {
    opacity: 1, transform: 'translateY(0)',
    transition: `opacity 0.6s ${delay}s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s ${delay}s cubic-bezier(0.16, 1, 0.3, 1)`,
  } : { opacity: 0, transform: 'translateY(16px)' };

  return (
    <div data-testid="minceur-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, ...fadeIn(0) } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>Poids & Nutrition</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Tableau de bord sante</div>
            </div>
            <div data-testid="refresh-button" onClick={refreshRecs} style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
              <i className="ri-refresh-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </div>
          </div>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16 } as any}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' } as any} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Analyse en cours...</div>
            </div>
          )}

          {error && !loading && (
            <div style={{ ...CARD, padding: 24, textAlign: 'center' } as any}>
              <i className="ri-error-warning-line" style={{ fontSize: 32, color: RED, marginBottom: 8 }} />
              <div style={{ fontSize: 14, color: '#FFF', fontWeight: 700 }}>{error}</div>
            </div>
          )}

          {!loading && data && (
            <>
              {/* ══════ 1. WEIGHT HERO CARD ══════ */}
              <div data-testid="weight-hero" style={{ ...CARD, padding: 20, marginBottom: 12, ...fadeIn(0.1) } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 } as any}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>Poids actuel</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 } as any}>
                      <span style={{ fontSize: 44, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{c.weight > 0 ? c.weight : '--'}</span>
                      <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>kg</span>
                    </div>
                    {stats.total_change != null && history.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 } as any}>
                        <i className={stats.total_change <= 0 ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} style={{ fontSize: 11, color: stats.total_change <= 0 ? GREEN : RED }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: stats.total_change <= 0 ? GREEN : RED }}>{Math.abs(stats.total_change)}kg</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>depuis le debut</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 } as any}>
                    {c.bmi > 0 && (
                      <div style={{ textAlign: 'right' } as any}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{c.bmi}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: c.bmi_info?.color || 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>IMC - {c.bmi_info?.label || ''}</div>
                      </div>
                    )}
                    {c.bmr > 0 && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
                        MB: {c.bmr}kcal · DET: {c.tdee}kcal
                      </div>
                    )}
                  </div>
                </div>

                {/* BMI Gauge */}
                {c.bmi > 0 && <BMIGauge bmi={c.bmi} info={c.bmi_info} />}

                {/* Weight chart */}
                {history.length >= 2 && (
                  <div style={{ marginTop: 16 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Evolution du poids</div>
                    <WeightChart history={history} />
                  </div>
                )}

                {history.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                    <i className="ri-scales-3-line" style={{ fontSize: 24, display: 'block', marginBottom: 6, opacity: 0.3 }} />
                    Pesez-vous sur la Balance Vita pour commencer le suivi
                  </div>
                )}

                {data.last_reading_date && (
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'right', marginTop: 8 }}>
                    Derniere pesee : {new Date(data.last_reading_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* ══════ 2. BODY COMPOSITION ══════ */}
              {(bc.body_fat_pct || bc.muscle_pct || bc.water_pct) && (
                <div data-testid="body-composition" style={{ ...CARD, padding: '18px 12px', marginBottom: 12, ...fadeIn(0.2) } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14, paddingLeft: 6 }}>Composition corporelle</div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 } as any}>
                    <CompositionRing value={bc.body_fat_pct} max={50} color="#F97316" label="Graisse" unit="%" />
                    <CompositionRing value={bc.muscle_pct} max={60} color="#10B981" label="Muscle" unit="%" />
                    <CompositionRing value={bc.water_pct} max={70} color="#60A5FA" label="Hydratation" unit="%" />
                    <CompositionRing value={bc.visceral_fat} max={20} color="#EF4444" label="Viscerale" unit="" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 } as any}>
                    {bc.bone_mass_kg > 0 && (
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{bc.bone_mass_kg}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>kg</span></div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>Masse osseuse</div>
                      </div>
                    )}
                    {bc.body_age > 0 && (
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: PURPLE }}>{bc.body_age}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}> ans</span></div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>Age corporel</div>
                      </div>
                    )}
                    {bc.protein_pct > 0 && (
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{bc.protein_pct}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>%</span></div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>Proteines</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════ 3. OPTIONAL GOAL ══════ */}
              <div data-testid="goal-section" style={{ ...CARD, marginBottom: 12, overflow: 'hidden', ...fadeIn(0.25) } as any}>
                {!showGoalForm && !goal && (
                  <div data-testid="set-goal-button" onClick={() => setShowGoalForm(true)} style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    transition: 'background 0.2s',
                  } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className="ri-focus-3-line" style={{ fontSize: 18, color: ACCENT }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Definir un objectif</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Personnaliser les recommandations</div>
                    </div>
                    <i className="ri-add-circle-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                )}

                {goal && !showGoalForm && (
                  <div style={{ padding: '14px 16px' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                        <i className="ri-focus-3-line" style={{ fontSize: 16, color: ACCENT }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>Objectif</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 } as any}>
                        <span data-testid="edit-goal" onClick={() => setShowGoalForm(true)} style={{ fontSize: 10, color: ACCENT, cursor: 'pointer', fontWeight: 700 }}>Modifier</span>
                        <span data-testid="remove-goal" onClick={removeGoal} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontWeight: 700 }}>Retirer</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: ACCENT }}>{goal.target_kg}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>kg</span></div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                          {c.weight > 0 && goal.target_kg > 0 && (() => {
                            const diff = c.weight - goal.target_kg;
                            const total = (data?.weight_history?.[data.weight_history.length - 1]?.weight || c.weight) - goal.target_kg;
                            const pct = total > 0 ? Math.max(2, Math.min(100, ((total - diff) / total) * 100)) : 0;
                            return <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg, ${ACCENT}, ${GREEN})`, transition: 'width 1s ease' } as any} />;
                          })()}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 } as any}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>-{Math.max(0, c.weight - goal.target_kg).toFixed(1)}kg restant</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{goal.weeks} semaines</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showGoalForm && (
                  <div style={{ padding: 18 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Objectif de poids</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 18 } as any}>
                      <div data-testid="goal-minus" onClick={() => setTargetKg(Math.max(30, targetKg - 0.5))} style={{
                        width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 22, fontWeight: 700, color: '#FFF', transition: 'all 0.15s',
                      } as any}
                      onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>-</div>
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 42, fontWeight: 900, color: ACCENT, lineHeight: 1, letterSpacing: -1 }}>{targetKg}<span style={{ fontSize: 16, color: `${ACCENT}60` }}>kg</span></div>
                        {c.weight > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{targetKg < c.weight ? '-' : '+'}{Math.abs(c.weight - targetKg).toFixed(1)}kg</div>}
                      </div>
                      <div data-testid="goal-plus" onClick={() => setTargetKg(targetKg + 0.5)} style={{
                        width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 22, fontWeight: 700, color: '#FFF', transition: 'all 0.15s',
                      } as any}
                      onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>+</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 8 }}>Duree</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 18 } as any}>
                      {[4, 8, 12, 16, 24].map(w => (
                        <div key={w} data-testid={`weeks-${w}`} onClick={() => setGoalWeeks(w)} style={{
                          flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                          background: goalWeeks === w ? `${ACCENT}18` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${goalWeeks === w ? `${ACCENT}50` : 'rgba(255,255,255,0.06)'}`,
                          fontSize: 12, fontWeight: 800,
                          color: goalWeeks === w ? ACCENT : 'rgba(255,255,255,0.3)',
                          transition: 'all 0.2s',
                        } as any}>{w}s</div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div data-testid="save-goal" onClick={saveGoal} style={{
                        flex: 1, padding: 14, borderRadius: 999, background: ACCENT,
                        cursor: saving ? 'wait' : 'pointer', textAlign: 'center',
                        fontSize: 14, fontWeight: 800, color: '#FFF', opacity: saving ? 0.6 : 1,
                        transition: 'all 0.2s',
                      } as any}>{saving ? 'Enregistrement...' : 'Valider'}</div>
                      <div onClick={() => setShowGoalForm(false)} style={{
                        padding: '14px 20px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                      } as any}>Annuler</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ══════ 4. AI RECOMMENDATIONS ══════ */}
              {recs && (
                <div style={{ ...fadeIn(0.3) } as any}>
                  {/* Nora Insight */}
                  {recs.nora_insight && (
                    <div data-testid="nora-insight" style={{ ...CARD, padding: '14px 16px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' } as any}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      } as any}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: PURPLE }}>N</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: PURPLE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Analyse Nora</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{recs.nora_insight}</div>
                      </div>
                    </div>
                  )}

                  {/* Calories + Macros summary */}
                  <div data-testid="calories-summary" style={{ ...CARD, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1 }}>Budget calorique</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 } as any}>
                          <span style={{ fontSize: 32, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{recs.daily_calories}</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>kcal/jour</span>
                        </div>
                      </div>
                      {recs.water_ml && (
                        <div style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 12, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' } as any}>
                          <i className="ri-drop-fill" style={{ fontSize: 16, color: BLUE }} />
                          <div style={{ fontSize: 12, fontWeight: 800, color: BLUE }}>{(recs.water_ml / 1000).toFixed(1)}L</div>
                          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>EAU</div>
                        </div>
                      )}
                    </div>
                    {recs.macros && (
                      <div style={{ display: 'flex', gap: 6 } as any}>
                        {[
                          { label: 'Proteines', value: recs.macros.proteines_g, unit: 'g', color: '#10B981' },
                          { label: 'Glucides', value: recs.macros.glucides_g, unit: 'g', color: '#F59E0B' },
                          { label: 'Lipides', value: recs.macros.lipides_g, unit: 'g', color: '#EF4444' },
                        ].map((m, i) => (
                          <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                            <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', marginBottom: 6, overflow: 'hidden' } as any}>
                              <div style={{ height: '100%', borderRadius: 2, width: '60%', background: m.color, transition: 'width 1s ease' } as any} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>{m.value}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{m.unit}</span></div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginTop: 1 }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tabs: Meals / Exercises */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 3 } as any}>
                    {(['meals', 'exercises'] as const).map(tab => (
                      <div key={tab} data-testid={`tab-${tab}`} onClick={() => setActiveTab(tab)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: activeTab === tab ? '#FFF' : 'rgba(255,255,255,0.3)',
                        transition: 'all 0.25s',
                      } as any}>
                        <i className={tab === 'meals' ? 'ri-restaurant-2-line' : 'ri-heart-pulse-line'} style={{ marginRight: 6 }} />
                        {tab === 'meals' ? 'Repas' : 'Exercices'}
                      </div>
                    ))}
                  </div>

                  {/* Meals */}
                  {activeTab === 'meals' && recs.meals && (
                    <div data-testid="meals-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 } as any}>
                      {recs.meals.map((meal: any, i: number) => {
                        const type = meal.type || ['breakfast', 'lunch', 'snack', 'dinner'][i] || 'lunch';
                        const meta = MEAL_META[type] || MEAL_META.lunch;
                        const color = MEAL_COLORS[type] || '#FFF';
                        return (
                          <div key={i} data-testid={`meal-${type}`} style={{
                            ...CARD, padding: '14px 16px', background: meta.gradient,
                            border: `1px solid ${color}15`,
                            transition: 'transform 0.15s',
                          } as any}
                          onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                              <div style={{
                                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                                background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              } as any}>
                                <i className={meta.icon} style={{ fontSize: 18, color }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 } as any}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 } as any}>
                                  <div style={{ fontSize: 8, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.8 }}>{meal.label || meal.type} {meal.time ? `· ${meal.time}` : ''}</div>
                                  <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{meal.calories}<span style={{ fontSize: 8 }}>kcal</span></div>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{meal.name}</div>
                                {meal.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{meal.description}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Exercises */}
                  {activeTab === 'exercises' && recs.exercises && (
                    <div data-testid="exercises-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 } as any}>
                      {recs.exercises.map((ex: any, i: number) => {
                        const icon = EX_ICONS[ex.category] || 'ri-heart-pulse-line';
                        const intensity = ex.intensity || 'modere';
                        const intColor = intensity === 'leger' ? GREEN : intensity === 'modere' ? ACCENT : RED;
                        return (
                          <div key={i} data-testid={`exercise-${i}`} style={{
                            ...CARD, padding: '14px 16px',
                            transition: 'transform 0.15s',
                          } as any}
                          onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                              <div style={{
                                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                                background: `${GREEN}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              } as any}>
                                <i className={icon} style={{ fontSize: 18, color: GREEN }} />
                              </div>
                              <div style={{ flex: 1 } as any}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
                                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{ex.name}</span>
                                  <span style={{
                                    fontSize: 8, fontWeight: 700, color: intColor,
                                    padding: '2px 6px', borderRadius: 6, background: `${intColor}15`,
                                    textTransform: 'uppercase',
                                  }}>{intensity}</span>
                                </div>
                                {ex.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 4 }}>{ex.description}</div>}
                                <div style={{ display: 'flex', gap: 12 } as any}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}><i className="ri-timer-line" style={{ fontSize: 10, marginRight: 3 }} />{ex.duration}</span>
                                  {ex.calories_burned > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}><i className="ri-fire-line" style={{ fontSize: 10, marginRight: 3 }} />{ex.calories_burned}kcal</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tip of the day */}
                  {recs.tip_of_the_day && (
                    <div data-testid="tip-of-day" style={{ ...CARD, padding: '14px 16px', marginBottom: 12, display: 'flex', gap: 10 } as any}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ACCENT}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className="ri-lightbulb-line" style={{ fontSize: 16, color: ACCENT }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Conseil du jour</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{recs.tip_of_the_day}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading recommendations */}
              {!recs && !loading && (
                <div style={{ ...CARD, padding: 32, textAlign: 'center', ...fadeIn(0.3) } as any}>
                  <div style={{ width: 36, height: 36, margin: '0 auto 12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: PURPLE, animation: 'spin 0.8s linear infinite' } as any} />
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Generation des recommandations...</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Nora analyse votre profil</div>
                </div>
              )}

            </>
          )}
        </div>
      </div>

      {/* Global CSS for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
