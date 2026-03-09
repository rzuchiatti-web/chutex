import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const ACCENT = '#F59E0B';
const GREEN = '#10B981';
const RED = '#EF4444';
const BLUE = '#60A5FA';
const PURPLE = '#A78BFA';
const C: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const MEAL_META: Record<string, { icon: string; gradient: string }> = {
  breakfast: { icon: 'ri-cup-line', gradient: 'linear-gradient(135deg, #F59E0B22, #F59E0B08)' },
  lunch: { icon: 'ri-restaurant-2-line', gradient: 'linear-gradient(135deg, #10B98122, #10B98108)' },
  snack: { icon: 'ri-apple-line', gradient: 'linear-gradient(135deg, #A78BFA22, #A78BFA08)' },
  dinner: { icon: 'ri-moon-line', gradient: 'linear-gradient(135deg, #60A5FA22, #60A5FA08)' },
};
const MEAL_COLORS: Record<string, string> = { breakfast: '#F59E0B', lunch: '#10B981', snack: '#A78BFA', dinner: '#60A5FA' };
const MEAL_IMGS: Record<string, string> = {
  breakfast: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png',
  lunch: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png',
  snack: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png',
  dinner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png',
};
const EX_ICONS: Record<string, string> = { cardio: 'ri-heart-pulse-line', renforcement: 'ri-boxing-line', souplesse: 'ri-body-scan-line', equilibre: 'ri-walk-line' };

type MK = 'weight' | 'body_fat_pct' | 'muscle_pct';
const MCFG: Record<MK, { color: string; unit: string; label: string; gid: string }> = {
  weight: { color: ACCENT, unit: 'kg', label: 'Poids', gid: 'gw' },
  body_fat_pct: { color: '#F97316', unit: '%', label: 'Graisse', gid: 'gf' },
  muscle_pct: { color: GREEN, unit: '%', label: 'Muscle', gid: 'gm' },
};

function Chart({ history, metric }: { history: any[]; metric: MK }) {
  const cfg = MCFG[metric];
  const f = [...history].reverse().filter(d => d[metric] > 0).slice(-14);
  if (f.length < 2) return <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Pas assez de mesures</div>;
  const vals = f.map(d => d[metric]);
  const mn = Math.min(...vals) - (metric === 'weight' ? 1 : 0.3), mx = Math.max(...vals) + (metric === 'weight' ? 1 : 0.3);
  const rng = mx - mn || 1, W = 440, H = 120, PX = 2, PY = 16, pW = W - PX * 2, pH = H - PY * 2;
  const step = pW / (f.length - 1);
  const pts = f.map((d, i) => ({ x: PX + i * step, y: PY + pH - ((d[metric] - mn) / rng) * pH, v: d[metric] }));
  const lp = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const ap = lp + ` L${pts[pts.length - 1].x},${H - PY} L${pts[0].x},${H - PY} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'calc(100% + 40px)', height: 130, display: 'block', margin: '0 -20px' }}>
      <defs>
        <linearGradient id={`${cfg.gid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.color} stopOpacity="0.2" /><stop offset="100%" stopColor={cfg.color} stopOpacity="0" /></linearGradient>
        <linearGradient id={`${cfg.gid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={cfg.color} stopOpacity="0.3" /><stop offset="100%" stopColor={cfg.color} stopOpacity="1" /></linearGradient>
      </defs>
      {[0, 0.5, 1].map((v, i) => <line key={i} x1={0} x2={W} y1={PY + pH * (1 - v)} y2={PY + pH * (1 - v)} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />)}
      <path d={ap} fill={`url(#${cfg.gid}a)`}><animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" /></path>
      <path d={lp} fill="none" stroke={`url(#${cfg.gid}l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <g key={i}>
        {i === pts.length - 1 && <><circle cx={p.x} cy={p.y} r="5" fill={cfg.color} opacity="0.15"><animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" /></circle><circle cx={p.x} cy={p.y} r="3.5" fill={cfg.color} stroke="#1a1a2e" strokeWidth="2" /><text x={Math.min(p.x, W - 30)} y={p.y - 10} textAnchor={p.x > W - 40 ? 'end' : 'middle'} fill={cfg.color} fontSize="10" fontWeight="800">{p.v}{cfg.unit}</text></>}
        {i === 0 && f.length > 2 && <text x={Math.max(p.x, 25)} y={p.y - 8} textAnchor="start" fill="rgba(255,255,255,0.18)" fontSize="9" fontWeight="600">{p.v}</text>}
        {i > 0 && i < pts.length - 1 && <circle cx={p.x} cy={p.y} r="1.5" fill="rgba(255,255,255,0.08)" />}
      </g>)}
    </svg>
  );
}

function MetricInsight({ metric, value, gender, weight }: { metric: MK; value: number; gender: string; weight: number }) {
  if (!value || value <= 0) return null;
  const isFemale = gender?.toLowerCase().includes('femme') || gender?.toLowerCase().includes('f');
  const info = (() => {
    if (metric === 'weight') return null; // IMC already handles weight interpretation
    if (metric === 'body_fat_pct') {
      const ranges = isFemale
        ? [{ max: 20, label: 'Faible', color: '#60A5FA', desc: 'Taux de graisse bas' }, { max: 33, label: 'Normal', color: GREEN, desc: 'Taux de graisse sain pour une femme' }, { max: 39, label: 'Eleve', color: ACCENT, desc: 'Legere surcharge graisseuse' }, { max: 100, label: 'Tres eleve', color: RED, desc: 'Surcharge graisseuse importante' }]
        : [{ max: 14, label: 'Faible', color: '#60A5FA', desc: 'Taux de graisse bas' }, { max: 25, label: 'Normal', color: GREEN, desc: 'Taux de graisse sain pour un homme' }, { max: 30, label: 'Eleve', color: ACCENT, desc: 'Legere surcharge graisseuse' }, { max: 100, label: 'Tres eleve', color: RED, desc: 'Surcharge graisseuse importante' }];
      const r = ranges.find(r => value <= r.max) || ranges[ranges.length - 1];
      const ref = isFemale ? '20-33%' : '14-25%';
      const kgFat = weight > 0 ? Math.round(value / 100 * weight * 10) / 10 : 0;
      return { ...r, ref, equiv: kgFat > 0 ? `Soit ${kgFat}kg de masse grasse sur ${weight}kg` : '' };
    }
    if (metric === 'muscle_pct') {
      const ranges = isFemale
        ? [{ max: 24, label: 'Faible', color: RED, desc: 'Masse musculaire insuffisante' }, { max: 30, label: 'Normal', color: ACCENT, desc: 'Masse musculaire correcte' }, { max: 100, label: 'Excellent', color: GREEN, desc: 'Tres bonne masse musculaire, protectrice contre les chutes' }]
        : [{ max: 33, label: 'Faible', color: RED, desc: 'Masse musculaire insuffisante' }, { max: 39, label: 'Normal', color: ACCENT, desc: 'Masse musculaire correcte' }, { max: 100, label: 'Excellent', color: GREEN, desc: 'Excellente masse musculaire' }];
      const r = ranges.find(r => value <= r.max) || ranges[ranges.length - 1];
      const ref = isFemale ? '24-30%+' : '33-39%+';
      return { ...r, ref, equiv: `Inclut tous les muscles : coeur, dos, membres, organes` };
    }
    return null;
  })();
  if (!info) return null;
  return (
    <div data-testid="metric-insight" style={{ padding: '10px 0 2px', animation: 'fadeSlideIn 0.35s ease' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
        <span style={{ padding: '3px 8px', borderRadius: 6, background: `${info.color}15`, border: `1px solid ${info.color}25`, fontSize: 10, fontWeight: 800, color: info.color }}>{info.label}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Ref: {info.ref}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{info.desc}. {info.equiv}.</div>
    </div>
  );
}

function BMIBar({ bmi, info }: { bmi: number; info: any }) {
  if (!bmi) return null;
  const pct = Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100));
  return (
    <div data-testid="bmi-gauge" style={{ marginTop: 8 } as any}>
      <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' } as any}>
        {[{ w: 14, c: '#60A5FA' }, { w: 26, c: '#10B981' }, { w: 20, c: '#F59E0B' }, { w: 40, c: '#EF4444' }].map((z, i) =>
          <div key={i} style={{ width: `${z.w}%`, height: '100%', background: z.c, opacity: 0.4 } as any} />
        )}
      </div>
      <div style={{ position: 'relative', height: 12, marginTop: -9 } as any}>
        <div style={{ position: 'absolute', left: `calc(${pct}% - 5px)`, width: 10, height: 10, borderRadius: '50%', background: info?.color || ACCENT, border: '2px solid rgba(0,0,0,0.5)', boxShadow: `0 0 8px ${info?.color || ACCENT}50`, transition: 'left 1s ease' } as any} />
      </div>
    </div>
  );
}

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
  const [chartMetric, setChartMetric] = useState<MK>('weight');
  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  const [trackStreak, setTrackStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
      const d = await apiFetch('/api/minceur/weight-details', {}, token);
      setData(d);
      if (d.tracking?.completed) setTracked(d.tracking.completed);
      if (d.tracking?.streak) setTrackStreak(d.tracking.streak);
      if (d.current?.weight > 0 && !d.goal) setTargetKg(Math.round(d.current.weight - 3));
      if (d.goal?.target_kg) { setTargetKg(d.goal.target_kg); if (d.goal.weeks) setGoalWeeks(d.goal.weeks); }
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchData(); }, [token]);

  // Refetch tracking when page gains focus (coming back from detail pages)
  useEffect(() => {
    const onFocus = () => { if (token && data) {
      apiFetch('/api/minceur/today-tracking', {}, token).then(t => {
        if (t?.completed) setTracked(t.completed);
        if (t?.streak) setTrackStreak(t.streak);
      }).catch(() => {});
    }};
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [token, data]);

  const saveGoal = async () => { setSaving(true); try { await apiFetch('/api/minceur/weight-goal', { method: 'POST', body: JSON.stringify({ target_kg: targetKg, weeks: goalWeeks }) }, token); setShowGoalForm(false); setLoading(true); await fetchData(); } catch (e: any) { alert(e.message); } finally { setSaving(false); } };
  const removeGoal = async () => { try { await apiFetch('/api/minceur/weight-goal', { method: 'DELETE' }, token); setShowGoalForm(false); setLoading(true); await fetchData(); } catch {} };
  const refreshRecs = async () => { setRefreshing(true); try { await apiFetch('/api/minceur/refresh-recommendations', { method: 'POST' }, token); await fetchData(); } catch { setRefreshing(false); } };
  const toggleTrack = async (type: 'meal' | 'exercise', index: number) => {
    const key = `${type}_${index}`;
    const was = tracked[key];
    setTracked(prev => ({ ...prev, [key]: !was }));
    if (!was) setTrackStreak(s => Math.max(s, 1));
    try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type, index }) }, token); } catch { setTracked(prev => ({ ...prev, [key]: was })); }
  };

  if (Platform.OS !== 'web') return null;
  const cr = data?.current || {};
  const bc = data?.body_composition || {};
  const recs = data?.recommendations;
  const history = data?.weight_history || [];
  const goal = data?.goal;
  const fade = (d: number) => mounted ? { opacity: 1, transform: 'translateY(0)', transition: `opacity 0.5s ${d}s ease, transform 0.5s ${d}s ease` } : { opacity: 0, transform: 'translateY(12px)' };

  const totalItems = recs ? (recs.meals?.length || 0) + (recs.exercises?.length || 0) : 0;
  const doneCount = Object.values(tracked).filter(Boolean).length;
  const pctDone = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <div data-testid="minceur-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, ...fade(0) } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>Poids & Nutrition</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Tableau de bord sante</div>
            </div>
            {/* Daily progress pill */}
            {recs && totalItems > 0 && (
              <div data-testid="daily-progress" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: pctDone === 100 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${pctDone === 100 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}` } as any}>
                {trackStreak > 0 && <><i className="ri-fire-fill" style={{ fontSize: 12, color: ACCENT }} /><span style={{ fontSize: 11, fontWeight: 800, color: ACCENT }}>{trackStreak}j</span><span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' } as any} /></>}
                <span style={{ fontSize: 11, fontWeight: 800, color: pctDone === 100 ? GREEN : '#FFF' }}>{doneCount}/{totalItems}</span>
                {pctDone === 100 && <i className="ri-check-double-line" style={{ fontSize: 13, color: GREEN }} />}
              </div>
            )}
            <div data-testid="refresh-button" onClick={refreshRecs} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-refresh-line" style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </div>
          </div>

          {loading && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 14 } as any}><div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' } as any} /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Analyse en cours...</div></div>}
          {error && !loading && <div style={{ ...C, padding: 24, textAlign: 'center' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, color: RED }} /><div style={{ fontSize: 14, color: '#FFF', fontWeight: 700, marginTop: 8 }}>{error}</div></div>}

          {!loading && data && (
            <>
              {/* ══ CARD 1: BODY STATS (Weight + Graph + IMC + Goal) ══ */}
              <div data-testid="weight-hero" style={{ ...C, padding: 20, marginBottom: 14, ...fade(0.1) } as any}>

                {/* Row: Weight + IMC */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 } as any}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1 }}>Poids actuel</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 } as any}>
                      <span style={{ fontSize: 42, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{cr.weight > 0 ? cr.weight : '--'}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>kg</span>
                    </div>
                  </div>
                  {cr.bmi > 0 && (
                    <div style={{ textAlign: 'right' } as any}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{cr.bmi}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: cr.bmi_info?.color || 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>IMC · {cr.bmi_info?.label}</div>
                    </div>
                  )}
                </div>
                {cr.bmi > 0 && <BMIBar bmi={cr.bmi} info={cr.bmi_info} />}

                {/* Chart Tabs */}
                {history.length >= 2 && (
                  <div style={{ marginTop: 14 } as any}>
                    <div data-testid="chart-tabs" style={{ display: 'flex', gap: 2, marginBottom: 6, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 2 } as any}>
                      {([
                        { key: 'weight' as MK, label: 'Poids', icon: 'ri-scales-3-line', color: ACCENT, val: cr.weight, unit: 'kg' },
                        { key: 'body_fat_pct' as MK, label: 'Graisse', icon: 'ri-fire-line', color: '#F97316', val: bc.body_fat_pct, unit: '%' },
                        { key: 'muscle_pct' as MK, label: 'Muscle', icon: 'ri-boxing-line', color: GREEN, val: bc.muscle_pct, unit: '%' },
                      ]).map(t => {
                        const a = chartMetric === t.key, has = history.some((h: any) => h[t.key] > 0);
                        return (
                          <div key={t.key} data-testid={`chart-tab-${t.key}`} onClick={() => has && setChartMetric(t.key)} style={{
                            flex: 1, padding: '7px 4px', borderRadius: 8, textAlign: 'center', cursor: has ? 'pointer' : 'default',
                            background: a ? 'rgba(255,255,255,0.07)' : 'transparent', border: a ? `1px solid ${t.color}25` : '1px solid transparent', opacity: has ? 1 : 0.25, transition: 'all 0.2s',
                          } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 } as any}>
                              <i className={t.icon} style={{ fontSize: 9, color: a ? t.color : 'rgba(255,255,255,0.2)' }} />
                              <span style={{ fontSize: 8, fontWeight: 700, color: a ? t.color : 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{t.label}</span>
                            </div>
                            {t.val > 0 && <div style={{ fontSize: 13, fontWeight: 900, color: a ? '#FFF' : 'rgba(255,255,255,0.25)', lineHeight: 1, marginTop: 2 }}>{t.val}<span style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)' }}>{t.unit}</span></div>}
                          </div>
                        );
                      })}
                    </div>
                    <Chart history={history} metric={chartMetric} />
                    <MetricInsight metric={chartMetric} value={chartMetric === 'weight' ? cr.weight : chartMetric === 'body_fat_pct' ? bc.body_fat_pct : bc.muscle_pct} gender={data?.profile?.gender || ''} weight={cr.weight || 0} />
                  </div>
                )}

                {history.length === 0 && <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 12, color: 'rgba(255,255,255,0.15)' }}><i className="ri-scales-3-line" style={{ fontSize: 22, display: 'block', marginBottom: 4, opacity: 0.25 }} />Pesez-vous pour commencer le suivi</div>}

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '14px 0' } as any} />

                {/* Goal: inline */}
                {!goal && !showGoalForm && (
                  <div data-testid="set-goal-button" onClick={() => setShowGoalForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-focus-3-line" style={{ fontSize: 15, color: ACCENT }} /></div>
                    <div style={{ flex: 1 } as any}><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Definir un objectif de poids</span></div>
                    <i className="ri-add-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.12)' }} />
                  </div>
                )}
                {goal && !showGoalForm && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                    <i className="ri-focus-3-line" style={{ fontSize: 15, color: ACCENT }} />
                    <div style={{ flex: 1 } as any}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 } as any}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Objectif</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: ACCENT }}>{goal.target_kg}kg</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>en {goal.weeks}s</span>
                      </div>
                      {cr.weight > 0 && (
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', marginTop: 4 } as any}>
                          {(() => { const diff = cr.weight - goal.target_kg; const total = (history[history.length - 1]?.weight || cr.weight) - goal.target_kg; const p = total > 0 ? Math.max(2, Math.min(100, ((total - diff) / total) * 100)) : 0; return <div style={{ height: '100%', borderRadius: 2, width: `${p}%`, background: `linear-gradient(90deg, ${ACCENT}, ${GREEN})`, transition: 'width 0.8s ease' } as any} />; })()}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 } as any}>
                      <span data-testid="edit-goal" onClick={() => setShowGoalForm(true)} style={{ fontSize: 9, color: ACCENT, cursor: 'pointer', fontWeight: 700 }}>Modifier</span>
                      <span data-testid="remove-goal" onClick={removeGoal} style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontWeight: 700 }}>Retirer</span>
                    </div>
                  </div>
                )}
                {showGoalForm && (
                  <div style={{ paddingTop: 4 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 12 } as any}>
                      <div data-testid="goal-minus" onClick={() => setTargetKg(Math.max(30, targetKg - 0.5))} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#FFF' } as any}>-</div>
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>{targetKg}<span style={{ fontSize: 14, color: `${ACCENT}50` }}>kg</span></div>
                        {cr.weight > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{targetKg < cr.weight ? '-' : '+'}{Math.abs(cr.weight - targetKg).toFixed(1)}kg</div>}
                      </div>
                      <div data-testid="goal-plus" onClick={() => setTargetKg(targetKg + 0.5)} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#FFF' } as any}>+</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 } as any}>
                      {[4, 8, 12, 16, 24].map(w => <div key={w} data-testid={`weeks-${w}`} onClick={() => setGoalWeeks(w)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: goalWeeks === w ? `${ACCENT}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${goalWeeks === w ? `${ACCENT}40` : 'rgba(255,255,255,0.05)'}`, fontSize: 11, fontWeight: 800, color: goalWeeks === w ? ACCENT : 'rgba(255,255,255,0.25)' } as any}>{w}s</div>)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div data-testid="save-goal" onClick={saveGoal} style={{ flex: 1, padding: 12, borderRadius: 999, background: ACCENT, cursor: saving ? 'wait' : 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#FFF', opacity: saving ? 0.6 : 1 } as any}>{saving ? '...' : 'Valider'}</div>
                      <div onClick={() => setShowGoalForm(false)} style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' } as any}>Annuler</div>
                    </div>
                  </div>
                )}

                {data.last_reading_date && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', textAlign: 'right', marginTop: 10 }}>Pesee : {new Date(data.last_reading_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
              </div>

              {/* ══ RECOMMENDATIONS ══ */}
              {recs && (
                <div style={{ ...fade(0.2) } as any}>
                  {/* Calories + Macros */}
                  <div data-testid="calories-summary" style={{ ...C, padding: 16, marginBottom: 14 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1 }}>Budget calorique</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 } as any}>
                          <span style={{ fontSize: 30, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{recs.daily_calories}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>kcal/jour</span>
                        </div>
                      </div>
                      {recs.water_ml && <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: 10, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)' } as any}><i className="ri-drop-fill" style={{ fontSize: 14, color: BLUE }} /><div style={{ fontSize: 11, fontWeight: 800, color: BLUE }}>{(recs.water_ml / 1000).toFixed(1)}L</div></div>}
                    </div>
                    {recs.macros && <div style={{ display: 'flex', gap: 6 } as any}>{[{ l: 'Prot.', v: recs.macros.proteines_g, c: GREEN }, { l: 'Gluc.', v: recs.macros.glucides_g, c: ACCENT }, { l: 'Lip.', v: recs.macros.lipides_g, c: RED }].map((m, i) => <div key={i} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', textAlign: 'center' } as any}><div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{m.v}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>g</span></div><div style={{ fontSize: 8, color: m.c, fontWeight: 700, marginTop: 1 }}>{m.l}</div></div>)}</div>}
                  </div>

                  {/* Tabs: Repas / Exercices */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 3 } as any}>
                    {(['meals', 'exercises'] as const).map(tab => (
                      <div key={tab} data-testid={`tab-${tab}`} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: activeTab === tab ? 'rgba(255,255,255,0.07)' : 'transparent', color: activeTab === tab ? '#FFF' : 'rgba(255,255,255,0.25)', transition: 'all 0.2s' } as any}>
                        <i className={tab === 'meals' ? 'ri-restaurant-2-line' : 'ri-heart-pulse-line'} style={{ marginRight: 6 }} />
                        {tab === 'meals' ? 'Repas' : 'Exercices'}
                      </div>
                    ))}
                  </div>

                  {/* Meals */}
                  {activeTab === 'meals' && recs.meals && (
                    <div data-testid="meals-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 } as any}>
                      {recs.meals.map((meal: any, i: number) => {
                        const type = meal.type || ['breakfast', 'lunch', 'snack', 'dinner'][i] || 'lunch';
                        const meta = MEAL_META[type] || MEAL_META.lunch;
                        const color = MEAL_COLORS[type] || '#FFF';
                        const done = tracked[`meal_${i}`];
                        return (
                          <div key={i} data-testid={`meal-${type}`} onClick={() => router.push({ pathname: '/meal-detail' as any, params: { index: i } })} style={{ ...C, padding: 0, background: meta.gradient, border: `1px solid ${done ? GREEN + '25' : color + '12'}`, cursor: 'pointer', opacity: done ? 0.65 : 1, transition: 'all 0.25s', overflow: 'hidden' } as any} onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                            <div style={{ display: 'flex', alignItems: 'stretch' } as any}>
                              <img src={MEAL_IMGS[type] || MEAL_IMGS.lunch} alt="" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 } as any} />
                              <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                                  <span style={{ fontSize: 8, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.6 }}>{meal.label} {meal.time ? `· ${meal.time}` : ''}</span>
                                  <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{meal.calories}<span style={{ fontSize: 7 }}>kcal</span></span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(255,255,255,0.15)' }}>{meal.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 } as any}>
                                  {meal.prep_time && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}><i className="ri-timer-line" style={{ fontSize: 8 }} /> {meal.prep_time}</span>}
                                  <span style={{ fontSize: 9, color, fontWeight: 700 }}>Voir la recette <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span>
                                </div>
                              </div>
                              <div data-testid={`track-meal-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack('meal', i); }} style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: done ? GREEN : 'rgba(255,255,255,0.03)', border: `1.5px solid ${done ? GREEN : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' } as any}>
                                <i className="ri-check-line" style={{ fontSize: 15, color: done ? '#FFF' : 'rgba(255,255,255,0.12)' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Exercises */}
                  {activeTab === 'exercises' && recs.exercises && (
                    <div data-testid="exercises-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 } as any}>
                      {recs.exercises.map((ex: any, i: number) => {
                        const icon = EX_ICONS[ex.category] || 'ri-heart-pulse-line';
                        const int = ex.intensity || 'modere';
                        const ic = int === 'leger' ? GREEN : int === 'modere' ? ACCENT : RED;
                        const done = tracked[`exercise_${i}`];
                        return (
                          <div key={i} data-testid={`exercise-${i}`} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })} style={{ ...C, padding: '14px 16px', border: `1px solid ${done ? GREEN + '25' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', opacity: done ? 0.65 : 1, transition: 'all 0.25s' } as any} onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${GREEN}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className={icon} style={{ fontSize: 17, color: GREEN }} /></div>
                              <div style={{ flex: 1 } as any}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF', textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(255,255,255,0.15)' }}>{ex.name}</span>
                                  <span style={{ fontSize: 7, fontWeight: 700, color: ic, padding: '2px 5px', borderRadius: 5, background: `${ic}12`, textTransform: 'uppercase' }}>{int}</span>
                                </div>
                                {ex.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{ex.description}</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: GREEN }}><i className="ri-timer-line" style={{ fontSize: 9, marginRight: 2 }} />{ex.duration}</span>
                                  {ex.calories_burned > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}><i className="ri-fire-line" style={{ fontSize: 9, marginRight: 2 }} />{ex.calories_burned}kcal</span>}
                                  <span style={{ fontSize: 9, color: GREEN, fontWeight: 700 }}>Details <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span>
                                </div>
                              </div>
                              <div data-testid={`track-exercise-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack('exercise', i); }} style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: done ? GREEN : 'rgba(255,255,255,0.03)', border: `1.5px solid ${done ? GREEN : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' } as any}>
                                <i className="ri-check-line" style={{ fontSize: 15, color: done ? '#FFF' : 'rgba(255,255,255,0.12)' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ══ NORA ANALYSIS — at the bottom ══ */}
                  {recs.nora_insight && (
                    <div data-testid="nora-insight" style={{ ...C, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' } as any}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: PURPLE }}>N</span>
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: PURPLE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Analyse de Nora</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{recs.nora_insight}{recs.tip_of_the_day ? ` ${recs.tip_of_the_day}` : ''}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!recs && !loading && <div style={{ ...C, padding: 28, textAlign: 'center', ...fade(0.2) } as any}><div style={{ width: 32, height: 32, margin: '0 auto 10px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)', borderTopColor: PURPLE, animation: 'spin 0.8s linear infinite' } as any} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Generation des recommandations...</div></div>}
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }` }} />
    </div>
  );
}
