import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const A = '#F59E0B', G = '#10B981', R = '#EF4444', B = '#60A5FA', P = '#A78BFA';
const CD: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const MM: Record<string, { icon: string; grad: string }> = { breakfast: { icon: 'ri-cup-line', grad: 'linear-gradient(135deg, #F59E0B22, #F59E0B08)' }, lunch: { icon: 'ri-restaurant-2-line', grad: 'linear-gradient(135deg, #10B98122, #10B98108)' }, snack: { icon: 'ri-apple-line', grad: 'linear-gradient(135deg, #A78BFA22, #A78BFA08)' }, dinner: { icon: 'ri-moon-line', grad: 'linear-gradient(135deg, #60A5FA22, #60A5FA08)' } };
const MC: Record<string, string> = { breakfast: A, lunch: G, snack: P, dinner: B };
const MI: Record<string, string> = { breakfast: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png', lunch: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png', snack: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png', dinner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png' };
const EI: Record<string, string> = { cardio: 'ri-heart-pulse-line', renforcement: 'ri-boxing-line', souplesse: 'ri-body-scan-line', equilibre: 'ri-walk-line' };
const EX_IMG: Record<string, string> = { cardio: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png', renforcement: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/b50d815f482c848c380f0e911d719876a2f9f0ff00967feef900297d858f39ef.png' };

type MK = 'weight' | 'body_fat_pct' | 'muscle_pct';
const CFG: Record<MK, { color: string; unit: string; label: string; gid: string }> = { weight: { color: A, unit: 'kg', label: 'Poids', gid: 'gw' }, body_fat_pct: { color: '#F97316', unit: '%', label: 'Graisse', gid: 'gf' }, muscle_pct: { color: G, unit: '%', label: 'Muscle', gid: 'gm' } };

function Chart({ history, metric }: { history: any[]; metric: MK }) {
  const c = CFG[metric];
  const f = [...history].reverse().filter(d => d[metric] > 0).slice(-14);
  if (f.length < 2) return <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Pas assez de mesures</div>;
  const vals = f.map(d => d[metric]);
  const mn = Math.min(...vals) - (metric === 'weight' ? 1 : 0.3), mx = Math.max(...vals) + (metric === 'weight' ? 1 : 0.3);
  const rng = mx - mn || 1, W = 440, H = 130, LM = 32, RM = 6, TM = 18, BM = 22;
  const pW = W - LM - RM, pH = H - TM - BM;
  const step = pW / (f.length - 1);
  const pts = f.map((d, i) => ({ x: LM + i * step, y: TM + pH - ((d[metric] - mn) / rng) * pH, v: d[metric], dt: d.date }));
  const lp = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const ap = lp + ` L${pts[pts.length - 1].x},${H - BM} L${pts[0].x},${H - BM} Z`;
  // Y axis labels
  const yLabels = [mn, mn + rng / 2, mx].map(v => ({ v: Math.round(v * 10) / 10, y: TM + pH - ((v - mn) / rng) * pH }));
  // X axis: first and last date
  const fmtD = (s: string) => { try { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; } catch { return ''; } };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'calc(100% + 40px)', height: 140, display: 'block', margin: '0 -20px' }}>
      <defs>
        <linearGradient id={`${c.gid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.color} stopOpacity="0.18" /><stop offset="100%" stopColor={c.color} stopOpacity="0" /></linearGradient>
        <linearGradient id={`${c.gid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c.color} stopOpacity="0.3" /><stop offset="100%" stopColor={c.color} stopOpacity="1" /></linearGradient>
      </defs>
      {/* Grid lines + Y labels */}
      {yLabels.map((yl, i) => <g key={i}><line x1={LM} x2={W - RM} y1={yl.y} y2={yl.y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" /><text x={LM - 4} y={yl.y + 3} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="8" fontWeight="600">{yl.v}</text></g>)}
      {/* X labels */}
      {f.length > 1 && <><text x={pts[0].x} y={H - 6} textAnchor="start" fill="rgba(255,255,255,0.12)" fontSize="8">{fmtD(f[0].date)}</text><text x={pts[pts.length - 1].x} y={H - 6} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="8">{fmtD(f[f.length - 1].date)}</text></>}
      <path d={ap} fill={`url(#${c.gid}a)`}><animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" /></path>
      <path d={lp} fill="none" stroke={`url(#${c.gid}l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <g key={i}>
        {i === pts.length - 1 && <><circle cx={p.x} cy={p.y} r="5" fill={c.color} opacity="0.15"><animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" /></circle><circle cx={p.x} cy={p.y} r="3.5" fill={c.color} stroke="#1a1a2e" strokeWidth="2" /><text x={Math.min(p.x, W - 30)} y={p.y - 10} textAnchor={p.x > W - 40 ? 'end' : 'middle'} fill={c.color} fontSize="10" fontWeight="800">{p.v}{c.unit}</text></>}
        {i > 0 && i < pts.length - 1 && <circle cx={p.x} cy={p.y} r="1.5" fill="rgba(255,255,255,0.08)" />}
      </g>)}
    </svg>
  );
}

function BMIBar({ bmi, info }: { bmi: number; info: any }) {
  if (!bmi) return null;
  const pct = Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100));
  return (
    <div data-testid="bmi-gauge" style={{ marginTop: 8 } as any}>
      <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' } as any}>
        {[{ w: 14, c: B }, { w: 26, c: G }, { w: 20, c: A }, { w: 40, c: R }].map((z, i) => <div key={i} style={{ width: `${z.w}%`, height: '100%', background: z.c, opacity: 0.4 } as any} />)}
      </div>
      <div style={{ position: 'relative', height: 12, marginTop: -9 } as any}><div style={{ position: 'absolute', left: `calc(${pct}% - 5px)`, width: 10, height: 10, borderRadius: '50%', background: info?.color || A, border: '2px solid rgba(0,0,0,0.5)', boxShadow: `0 0 8px ${info?.color || A}50`, transition: 'left 1s ease' } as any} /></div>
    </div>
  );
}

function Insight({ metric, value, gender, weight }: { metric: MK; value: number; gender: string; weight: number }) {
  if (!value || metric === 'weight') return null;
  const fem = gender?.toLowerCase().includes('femme');
  const info = metric === 'body_fat_pct'
    ? (() => { const rs = fem ? [{ m: 20, l: 'Faible', c: B }, { m: 33, l: 'Normal', c: G }, { m: 39, l: 'Eleve', c: A }, { m: 100, l: 'Tres eleve', c: R }] : [{ m: 14, l: 'Faible', c: B }, { m: 25, l: 'Normal', c: G }, { m: 30, l: 'Eleve', c: A }, { m: 100, l: 'Tres eleve', c: R }]; const r = rs.find(r => value <= r.m) || rs[rs.length - 1]; return { ...r, ref: fem ? '20-33%' : '14-25%', desc: `Soit ${Math.round(value / 100 * weight * 10) / 10}kg de masse grasse` }; })()
    : (() => { const rs = fem ? [{ m: 24, l: 'Faible', c: R }, { m: 30, l: 'Normal', c: A }, { m: 100, l: 'Excellent', c: G }] : [{ m: 33, l: 'Faible', c: R }, { m: 39, l: 'Normal', c: A }, { m: 100, l: 'Excellent', c: G }]; const r = rs.find(r => value <= r.m) || rs[rs.length - 1]; return { ...r, ref: fem ? '24-30%+' : '33-39%+', desc: 'Inclut coeur, dos, membres, organes' }; })();
  return (
    <div data-testid="metric-insight" style={{ padding: '8px 0 0', animation: 'fadeSlide 0.35s ease' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
        <span style={{ padding: '2px 7px', borderRadius: 6, background: `${info.c}15`, border: `1px solid ${info.c}20`, fontSize: 9, fontWeight: 800, color: info.c }}>{info.l}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>Ref: {info.ref}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>· {info.desc}</span>
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
  const [tab, setTab] = useState<'meals' | 'exercises'>('meals');
  const [cm, setCm] = useState<MK>('weight');
  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
      const d = await apiFetch('/api/minceur/weight-details', {}, token);
      setData(d);
      if (d.tracking?.completed) setTracked(d.tracking.completed);
      if (d.tracking?.streak) setStreak(d.tracking.streak);
      if (d.current?.weight > 0 && !d.goal) setTargetKg(Math.round(d.current.weight - 3));
      if (d.goal?.target_kg) { setTargetKg(d.goal.target_kg); if (d.goal.weeks) setGoalWeeks(d.goal.weeks); }
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchData(); }, [token]);

  // Refetch tracking on focus AND on route change (popstate)
  useEffect(() => {
    const sync = () => { if (token && data) { apiFetch('/api/minceur/today-tracking', {}, token).then(t => { if (t?.completed) setTracked(t.completed); if (t?.streak) setStreak(t.streak); }).catch(() => {}); } };
    window.addEventListener('focus', sync);
    window.addEventListener('popstate', sync);
    // Also poll every 2s for 10s after mount (catches SPA navigation)
    const intervals = [2000, 4000, 6000, 8000, 10000].map(ms => setTimeout(sync, ms));
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('popstate', sync); intervals.forEach(clearTimeout); };
  }, [token, data]);

  const saveGoal = async () => { setSaving(true); try { await apiFetch('/api/minceur/weight-goal', { method: 'POST', body: JSON.stringify({ target_kg: targetKg, weeks: goalWeeks }) }, token); setShowGoalForm(false); setLoading(true); await fetchData(); } catch (e: any) { alert(e.message); } finally { setSaving(false); } };
  const removeGoal = async () => { try { await apiFetch('/api/minceur/weight-goal', { method: 'DELETE' }, token); setShowGoalForm(false); setLoading(true); await fetchData(); } catch {} };
  const refreshRecs = async () => { setRefreshing(true); try { await apiFetch('/api/minceur/refresh-recommendations', { method: 'POST' }, token); await fetchData(); } catch { setRefreshing(false); } };
  const toggleTrack = async (type: 'meal' | 'exercise', index: number) => { const k = `${type}_${index}`, w = tracked[k]; setTracked(p => ({ ...p, [k]: !w })); if (!w) setStreak(s => Math.max(s, 1)); try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type, index }) }, token); } catch { setTracked(p => ({ ...p, [k]: w })); } };

  if (Platform.OS !== 'web') return null;
  const cr = data?.current || {}, bc = data?.body_composition || {}, recs = data?.recommendations, history = data?.weight_history || [], goal = data?.goal;
  const fade = (d: number) => mounted ? { opacity: 1, transform: 'translateY(0)', transition: `opacity 0.5s ${d}s ease, transform 0.5s ${d}s ease` } : { opacity: 0, transform: 'translateY(12px)' };
  const total = recs ? (recs.meals?.length || 0) + (recs.exercises?.length || 0) : 0;
  const done = Object.values(tracked).filter(Boolean).length;

  return (
    <div data-testid="minceur-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, ...fade(0) } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
            <div style={{ flex: 1 } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>Poids & Nutrition</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Tableau de bord sante</div></div>
            {/* Streak pill with popup */}
            {recs && total > 0 && (
              <div style={{ position: 'relative' } as any}>
                <div data-testid="daily-progress" onClick={() => setShowStreakInfo(!showStreakInfo)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: done === total ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${done === total ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' } as any}>
                  {streak > 0 && <><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 10, fontWeight: 800, color: A }}>{streak}j</span><span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.08)' } as any} /></>}
                  <span style={{ fontSize: 10, fontWeight: 800, color: done === total ? G : '#FFF' }}>{done}/{total}</span>
                  {done === total && <i className="ri-check-double-line" style={{ fontSize: 12, color: G }} />}
                </div>
                {showStreakInfo && (
                  <div data-testid="streak-popup" style={{ position: 'fixed', inset: 0, zIndex: 999, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 } as any} onClick={() => setShowStreakInfo(false)}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF', marginBottom: 24 }}>Votre suivi quotidien</div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 } as any}>
                      <div style={{ textAlign: 'center' } as any}>
                        <i className="ri-fire-fill" style={{ fontSize: 28, color: A, display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 36, fontWeight: 900, color: A }}>{streak}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>jours consecutifs</div>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' } as any} />
                      <div style={{ textAlign: 'center' } as any}>
                        <i className="ri-check-double-line" style={{ fontSize: 28, color: done === total ? G : '#FFF', display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 36, fontWeight: 900, color: done === total ? G : '#FFF' }}>{done}/{total}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>valides aujourd'hui</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, textAlign: 'center', maxWidth: 280 }}>Validez vos repas et exercices chaque jour. Nora adapte ses recommandations selon votre regularite.</div>
                    <div style={{ marginTop: 20, padding: '10px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' } as any}>Fermer</div>
                  </div>
                )}
              </div>
            )}
            <div data-testid="refresh-button" onClick={refreshRecs} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-refresh-line" style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /></div>
          </div>

          {loading && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 14 } as any}><div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: A, animation: 'spin 0.8s linear infinite' } as any} /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Analyse en cours...</div></div>}
          {error && !loading && <div style={{ ...CD, padding: 24, textAlign: 'center' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, color: R }} /><div style={{ fontSize: 14, color: '#FFF', fontWeight: 700, marginTop: 8 }}>{error}</div></div>}

          {!loading && data && (
            <>
              {/* ══ CARD 1: Weight + Graph + IMC + Goal ══ */}
              <div data-testid="weight-hero" style={{ ...CD, padding: 20, marginBottom: 14, ...fade(0.1) } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 } as any}>
                  <div><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1 }}>Poids actuel</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 2 } as any}><span style={{ fontSize: 42, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{cr.weight > 0 ? cr.weight : '--'}</span><span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>kg</span></div></div>
                  {cr.bmi > 0 && <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{cr.bmi}</div><div style={{ fontSize: 9, fontWeight: 700, color: cr.bmi_info?.color || 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>IMC · {cr.bmi_info?.label}</div></div>}
                </div>
                {cr.bmi > 0 && <BMIBar bmi={cr.bmi} info={cr.bmi_info} />}

                {/* Pill tabs */}
                {history.length >= 2 && (
                  <div style={{ marginTop: 14 } as any}>
                    <div data-testid="chart-tabs" style={{ display: 'inline-flex', gap: 4, padding: 3, borderRadius: 999, background: 'rgba(255,255,255,0.04)', marginBottom: 8 } as any}>
                      {([{ key: 'weight' as MK, label: 'Poids', color: A, val: cr.weight, unit: 'kg' }, { key: 'body_fat_pct' as MK, label: 'Graisse', color: '#F97316', val: bc.body_fat_pct, unit: '%' }, { key: 'muscle_pct' as MK, label: 'Muscle', color: G, val: bc.muscle_pct, unit: '%' }]).map(t => {
                        const act = cm === t.key, has = history.some((h: any) => h[t.key] > 0);
                        return (
                          <div key={t.key} data-testid={`chart-tab-${t.key}`} onClick={() => has && setCm(t.key)} style={{ padding: '6px 14px', borderRadius: 999, cursor: has ? 'pointer' : 'default', background: act ? `${t.color}18` : 'transparent', border: act ? `1px solid ${t.color}30` : '1px solid transparent', opacity: has ? 1 : 0.25, transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 5 } as any}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: act ? t.color : 'rgba(255,255,255,0.25)' }}>{t.label}</span>
                            {t.val > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: act ? '#FFF' : 'rgba(255,255,255,0.2)' }}>{t.val}<span style={{ fontSize: 7, color: 'rgba(255,255,255,0.12)' }}>{t.unit}</span></span>}
                          </div>
                        );
                      })}
                    </div>
                    <Chart history={history} metric={cm} />
                    <Insight metric={cm} value={cm === 'weight' ? cr.weight : cm === 'body_fat_pct' ? bc.body_fat_pct : bc.muscle_pct} gender={data?.profile?.gender || ''} weight={cr.weight || 0} />
                  </div>
                )}
                {history.length === 0 && <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 12, color: 'rgba(255,255,255,0.15)' }}><i className="ri-scales-3-line" style={{ fontSize: 22, display: 'block', marginBottom: 4, opacity: 0.25 }} />Pesez-vous pour commencer le suivi</div>}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '14px 0' } as any} />

                {/* Goal */}
                {!goal && !showGoalForm && (
                  <div data-testid="set-goal-button" onClick={() => setShowGoalForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0' } as any}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: `${A}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-focus-3-line" style={{ fontSize: 16, color: A }} /></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Definir un objectif</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Personnalise vos recommandations</div></div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.1)' }} />
                  </div>
                )}
                {goal && !showGoalForm && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: `${A}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-focus-3-line" style={{ fontSize: 16, color: A }} /></div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 } as any}><span style={{ fontSize: 18, fontWeight: 900, color: A }}>{goal.target_kg}kg</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>en {goal.weeks} semaines</span></div>
                      {cr.weight > 0 && <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', marginTop: 4 } as any}>{(() => { const d = cr.weight - goal.target_kg; const t = (history[history.length - 1]?.weight || cr.weight) - goal.target_kg; const p = t > 0 ? Math.max(2, Math.min(100, ((t - d) / t) * 100)) : 0; return <div style={{ height: '100%', borderRadius: 2, width: `${p}%`, background: `linear-gradient(90deg, ${A}, ${G})`, transition: 'width 0.8s ease' } as any} />; })()}</div>}
                    </div>
                    <span data-testid="edit-goal" onClick={() => setShowGoalForm(true)} style={{ fontSize: 9, color: A, cursor: 'pointer', fontWeight: 700 }}>Modifier</span>
                  </div>
                )}
                {showGoalForm && (
                  <div style={{ padding: '12px 0', animation: 'fadeSlide 0.3s ease' } as any}>
                    <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Poids cible</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 } as any}>
                        <div data-testid="goal-minus" onClick={() => setTargetKg(Math.max(30, targetKg - 0.5))} style={{ width: 52, height: 52, borderRadius: 999, background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, fontWeight: 300, color: '#FFF', transition: 'all 0.15s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' } as any}>-</div>
                        <div style={{ textAlign: 'center', minWidth: 120, padding: '8px 0' } as any}>
                          <div style={{ fontSize: 52, fontWeight: 900, color: A, lineHeight: 1, letterSpacing: -2, textShadow: `0 0 40px ${A}30` }}>{targetKg}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: `${A}60`, marginTop: 2 }}>kg</div>
                          {cr.weight > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{targetKg < cr.weight ? '' : '+'}{(targetKg - cr.weight).toFixed(1)}kg vs actuel</div>}
                        </div>
                        <div data-testid="goal-plus" onClick={() => setTargetKg(targetKg + 0.5)} style={{ width: 52, height: 52, borderRadius: 999, background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, fontWeight: 300, color: '#FFF', transition: 'all 0.15s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' } as any}>+</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Duree</div>
                      <div style={{ display: 'inline-flex', gap: 4, padding: 3, borderRadius: 999, background: 'rgba(255,255,255,0.03)' } as any}>
                        {[4, 8, 12, 16, 24].map(w => <div key={w} data-testid={`weeks-${w}`} onClick={() => setGoalWeeks(w)} style={{ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', background: goalWeeks === w ? `${A}18` : 'transparent', border: `1px solid ${goalWeeks === w ? `${A}35` : 'transparent'}`, fontSize: 12, fontWeight: 800, color: goalWeeks === w ? A : 'rgba(255,255,255,0.25)', transition: 'all 0.2s' } as any}>{w}s</div>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div data-testid="save-goal" onClick={saveGoal} style={{ flex: 1, padding: 14, borderRadius: 999, background: `linear-gradient(135deg, ${A}, #D97706)`, cursor: saving ? 'wait' : 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: saving ? 0.6 : 1, boxShadow: `0 8px 24px ${A}30` } as any}>{saving ? '...' : 'Valider l\'objectif'}</div>
                      <div onClick={() => setShowGoalForm(false)} style={{ padding: '14px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' } as any}>Annuler</div>
                    </div>
                    {goal && <div data-testid="remove-goal" onClick={removeGoal} style={{ textAlign: 'center', padding: 10, marginTop: 6, fontSize: 11, color: 'rgba(239,68,68,0.4)', cursor: 'pointer' } as any}>Supprimer l'objectif</div>}
                  </div>
                )}
                {data.last_reading_date && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)', textAlign: 'right', marginTop: 8 }}>Pesee : {new Date(data.last_reading_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
              </div>

              {/* ══ RECOMMENDATIONS ══ */}
              {recs && (
                <div style={{ ...fade(0.2) } as any}>
                  {/* Budget calorique — futuristic */}
                  <div data-testid="calories-summary" style={{ ...CD, padding: 0, marginBottom: 14, overflow: 'hidden' } as any}>
                    <div style={{ padding: '18px 18px 14px', background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(16,185,129,0.04))' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                        <div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Budget calorique journalier</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 } as any}>
                            <span style={{ fontSize: 38, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{recs.daily_calories}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>kcal</span>
                          </div>
                        </div>
                        {recs.water_ml && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', borderRadius: 14, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)' } as any}>
                            <i className="ri-drop-fill" style={{ fontSize: 18, color: B }} />
                            <span style={{ fontSize: 14, fontWeight: 900, color: B, marginTop: 2 }}>{(recs.water_ml / 1000).toFixed(1)}L</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {recs.macros && (
                      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                        {[{ l: 'Proteines', v: recs.macros.proteines_g, c: G, icon: 'ri-leaf-line' }, { l: 'Glucides', v: recs.macros.glucides_g, c: A, icon: 'ri-seedling-line' }, { l: 'Lipides', v: recs.macros.lipides_g, c: R, icon: 'ri-drop-line' }].map((m, i) => (
                          <div key={i} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{m.v}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>g</span></div>
                            <div style={{ fontSize: 8, color: m.c, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pill tabs: Repas / Exercices — alert page style */}
                  <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 14 } as any}>
                    {(['meals', 'exercises'] as const).map(t => (
                      <div key={t} data-testid={`tab-${t}`} onClick={() => setTab(t)} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: tab === t ? '#FFF' : 'transparent', color: tab === t ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <i className={t === 'meals' ? 'ri-restaurant-2-line' : 'ri-heart-pulse-line'} style={{ fontSize: 14 }} />
                        {t === 'meals' ? 'Repas' : 'Exercices'}
                      </div>
                    ))}
                  </div>

                  {/* Meals */}
                  {tab === 'meals' && recs.meals && <div data-testid="meals-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 } as any}>
                    {recs.meals.map((meal: any, i: number) => { const tp = meal.type || ['breakfast', 'lunch', 'snack', 'dinner'][i] || 'lunch'; const meta = MM[tp] || MM.lunch; const col = MC[tp] || '#FFF'; const dn = tracked[`meal_${i}`]; return (
                      <div key={i} data-testid={`meal-${tp}`} onClick={() => router.push({ pathname: '/meal-detail' as any, params: { index: i } })} style={{ ...CD, padding: 0, background: meta.grad, border: `1px solid ${dn ? G + '25' : col + '12'}`, cursor: 'pointer', opacity: dn ? 0.65 : 1, transition: 'all 0.25s', overflow: 'hidden' } as any} onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                        <div style={{ display: 'flex', alignItems: 'stretch' } as any}>
                          <img src={MI[tp] || MI.lunch} alt="" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 } as any} />
                          <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}><span style={{ fontSize: 8, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: 0.6 }}>{meal.label} {meal.time ? `· ${meal.time}` : ''}</span><span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{meal.calories}<span style={{ fontSize: 7 }}>kcal</span></span></div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', textDecoration: dn ? 'line-through' : 'none', textDecorationColor: 'rgba(255,255,255,0.15)' }}>{meal.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 } as any}><span style={{ fontSize: 9, color: col, fontWeight: 700 }}>Voir la recette <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span></div>
                          </div>
                          <div data-testid={`track-meal-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack('meal', i); }} style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: dn ? `${G}15` : 'transparent', cursor: 'pointer', transition: 'all 0.3s' } as any}><i className="ri-check-line" style={{ fontSize: 16, color: dn ? G : 'rgba(255,255,255,0.1)' }} /></div>
                        </div>
                      </div>
                    ); })}
                  </div>}

                  {/* Exercises */}
                  {tab === 'exercises' && recs.exercises && <div data-testid="exercises-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 } as any}>
                    {recs.exercises.map((ex: any, i: number) => { const ic = EI[ex.category] || 'ri-heart-pulse-line'; const int = ex.intensity || 'modere'; const intC = int === 'leger' ? G : int === 'modere' ? A : R; const dn = tracked[`exercise_${i}`]; const img = EX_IMG[ex.category] || EX_IMG.cardio; return (
                      <div key={i} data-testid={`exercise-${i}`} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })} style={{ ...CD, padding: 0, border: `1px solid ${dn ? G + '25' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', opacity: dn ? 0.65 : 1, transition: 'all 0.25s', overflow: 'hidden' } as any} onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                        <div style={{ display: 'flex', alignItems: 'stretch' } as any}>
                          <img src={img} alt="" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 } as any} />
                          <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><span style={{ fontSize: 13, fontWeight: 800, color: '#FFF', textDecoration: dn ? 'line-through' : 'none', textDecorationColor: 'rgba(255,255,255,0.15)' }}>{ex.name}</span><span style={{ fontSize: 7, fontWeight: 700, color: intC, padding: '2px 5px', borderRadius: 5, background: `${intC}12`, textTransform: 'uppercase' }}>{int}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 } as any}><span style={{ fontSize: 10, fontWeight: 700, color: G }}><i className="ri-timer-line" style={{ fontSize: 9 }} /> {ex.duration}</span>{ex.calories_burned > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{ex.calories_burned}kcal</span>}<span style={{ fontSize: 9, color: G, fontWeight: 700 }}>Details <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span></div>
                          </div>
                          <div data-testid={`track-exercise-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack('exercise', i); }} style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: dn ? `${G}15` : 'transparent', cursor: 'pointer', transition: 'all 0.3s' } as any}><i className="ri-check-line" style={{ fontSize: 16, color: dn ? G : 'rgba(255,255,255,0.1)' }} /></div>
                        </div>
                      </div>
                    ); })}
                  </div>}

                  {/* Nora at bottom */}
                  {recs.nora_insight && <div data-testid="nora-insight" style={{ ...CD, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' } as any}><div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 11, fontWeight: 900, color: P }}>N</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Analyse de Nora</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{recs.nora_insight}{recs.tip_of_the_day ? ` ${recs.tip_of_the_day}` : ''}</div></div></div>}
                </div>
              )}
              {!recs && !loading && <div style={{ ...CD, padding: 28, textAlign: 'center', ...fade(0.2) } as any}><div style={{ width: 32, height: 32, margin: '0 auto 10px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)', borderTopColor: P, animation: 'spin 0.8s linear infinite' } as any} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Generation des recommandations...</div></div>}
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}` }} />
    </div>
  );
}
