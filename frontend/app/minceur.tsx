import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NoraCard from '../src/components/shared/NoraCard';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';
const BLUE_BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';
const BALANCE_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';

function NoraAnalysisOverlay({ text: initialText, onClose }: { text: string; onClose: () => void }) {
  const { token } = useAuth();
  const [phase, setPhase] = useState<'intro' | 'typing' | 'done'>('intro');
  const [typed, setTyped] = useState('');
  const [analysisText, setAnalysisText] = useState(initialText);

  useEffect(() => {
    document.body.classList.add('nora-active');
    if (token) {
      apiFetch('/api/nora/minceur-analysis', {}, token)
        .then((r: any) => { if (r?.insight) setAnalysisText(`${r.insight}${r.tip ? ` ${r.tip}` : ''}`); })
        .catch(() => {});
    }
    const t1 = setTimeout(() => setPhase('typing'), 2800);
    return () => { clearTimeout(t1); document.body.classList.remove('nora-active'); };
  }, [token]);

  useEffect(() => {
    if (phase !== 'typing' || !analysisText) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i <= analysisText.length) { setTyped(analysisText.slice(0, i)); i++; }
      else { clearInterval(iv); setPhase('done'); }
    }, 12);
    return () => clearInterval(iv);
  }, [phase, analysisText]);

  const formatText = (t: string) => {
    const sentences = t.split(/(?<=\.)\s+/);
    const paragraphs: string[][] = [[]];
    sentences.forEach((s, i) => {
      paragraphs[paragraphs.length - 1].push(s);
      if ((i + 1) % 2 === 0 && i < sentences.length - 1) paragraphs.push([]);
    });
    return paragraphs.map(p => p.join(' '));
  };

  return (
    <div data-testid="nora-analysis-overlay" style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'noraFadeIn 0.4s ease' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes noraFadeIn{from{opacity:0}to{opacity:1}}@keyframes noraPulse{0%,100%{transform:scale(1);opacity:0.85}50%{transform:scale(1.08);opacity:1}}@keyframes noraTextIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}` }} />
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: phase === 'intro' ? '30vh' : 40, paddingLeft: 28, paddingRight: 28, paddingBottom: 120, transition: 'padding-top 1s cubic-bezier(0.22,0.61,0.36,1)' } as any}>
        <div onClick={onClose} style={{ position: 'fixed', top: 20, left: 20, width: 40, height: 40, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100001, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#111' }} /></div>
        <video autoPlay loop muted playsInline style={{ width: phase === 'intro' ? 140 : 90, height: phase === 'intro' ? 140 : 90, borderRadius: phase === 'intro' ? 50 : 30, objectFit: 'contain', animation: phase === 'intro' ? 'noraPulse 2.2s ease infinite' : 'none', marginBottom: phase === 'intro' ? 20 : 24, transition: 'all 1s cubic-bezier(0.22,0.61,0.36,1)', boxShadow: '0 0 60px rgba(167,139,250,0.15)' } as any} src={NORA_VIDEO} />
        {phase === 'intro' && (<div style={{ textAlign: 'center', animation: 'noraTextIn 0.6s ease 0.3s both' } as any}><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Nora analyse...</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Votre bilan nutritionnel personnalise</div></div>)}
        {(phase === 'typing' || phase === 'done') && (<div style={{ width: '100%', maxWidth: 380, animation: 'noraTextIn 0.5s ease both' } as any}><div style={{ textAlign: 'center', marginBottom: 20 } as any}><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Analyse de Nora</div><div style={{ height: 2, width: 40, borderRadius: 1, background: 'rgba(167,139,250,0.4)', margin: '10px auto 0' } as any} /></div>{formatText(typed).map((para, i) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' } as any} />}<div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.85, textAlign: 'center' }}>{para}</div></div>))}{phase === 'typing' && <span style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 13 }}>|</span>}</div>)}
      </div>
      {phase === 'done' && (<div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 36px', background: 'linear-gradient(0deg, #000 60%, transparent)', zIndex: 100000 } as any}><div data-testid="nora-back-btn" onClick={onClose} style={{ width: '100%', maxWidth: 380, margin: '0 auto', padding: '16px', borderRadius: 999, background: '#FFF', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-arrow-left-line" style={{ fontSize: 16, color: '#111' }} /><span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Retour</span></div></div>)}
    </div>
  );
}

const A = '#F59E0B', G = '#10B981', R = '#EF4444', B = '#60A5FA', P = '#A78BFA';
const MM: Record<string, { icon: string; grad: string }> = { breakfast: { icon: 'ri-cup-line', grad: 'linear-gradient(135deg, #F59E0B22, #F59E0B08)' }, lunch: { icon: 'ri-restaurant-2-line', grad: 'linear-gradient(135deg, #10B98122, #10B98108)' }, snack: { icon: 'ri-apple-line', grad: 'linear-gradient(135deg, #A78BFA22, #A78BFA08)' }, dinner: { icon: 'ri-moon-line', grad: 'linear-gradient(135deg, #60A5FA22, #60A5FA08)' } };
const MC: Record<string, string> = { breakfast: A, lunch: G, snack: P, dinner: B };
const MI: Record<string, string> = { breakfast: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png', lunch: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png', snack: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png', dinner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png' };
const EX_IMG: Record<string, string> = { cardio: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png', renforcement: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/b50d815f482c848c380f0e911d719876a2f9f0ff00967feef900297d858f39ef.png' };

type MK = 'weight' | 'body_fat_pct' | 'muscle_pct';
const CFG: Record<MK, { color: string; unit: string; label: string; gid: string }> = { weight: { color: A, unit: 'kg', label: 'Poids', gid: 'gw' }, body_fat_pct: { color: '#F97316', unit: '%', label: 'Graisse', gid: 'gf' }, muscle_pct: { color: G, unit: '%', label: 'Muscle', gid: 'gm' } };

function Chart({ history, metric }: { history: any[]; metric: MK }) {
  const c = CFG[metric];
  const f = [...history].reverse().filter(d => d[metric] > 0).slice(-14);
  if (f.length < 2) return <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#9CA3AF' }}>Pas assez de mesures</div>;
  const vals = f.map(d => d[metric]);
  const mn = Math.min(...vals) - (metric === 'weight' ? 1 : 0.3), mx = Math.max(...vals) + (metric === 'weight' ? 1 : 0.3);
  const rng = mx - mn || 1, W = 440, H = 130, LM = 32, RM = 6, TM = 18, BM = 22;
  const pW = W - LM - RM, pH = H - TM - BM;
  const step = pW / (f.length - 1);
  const pts = f.map((d, i) => ({ x: LM + i * step, y: TM + pH - ((d[metric] - mn) / rng) * pH, v: d[metric], dt: d.date }));
  const lp = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const ap = lp + ` L${pts[pts.length - 1].x},${H - BM} L${pts[0].x},${H - BM} Z`;
  const yLabels = [mn, mn + rng / 2, mx].map(v => ({ v: Math.round(v * 10) / 10, y: TM + pH - ((v - mn) / rng) * pH }));
  const fmtD = (s: string) => { try { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; } catch { return ''; } };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 'calc(100% + 40px)', height: 140, display: 'block', margin: '0 -20px' }}>
      <defs><linearGradient id={`${c.gid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.color} stopOpacity="0.18" /><stop offset="100%" stopColor={c.color} stopOpacity="0" /></linearGradient><linearGradient id={`${c.gid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c.color} stopOpacity="0.3" /><stop offset="100%" stopColor={c.color} stopOpacity="1" /></linearGradient></defs>
      {yLabels.map((yl, i) => <g key={i}><line x1={LM} x2={W - RM} y1={yl.y} y2={yl.y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" /><text x={LM - 4} y={yl.y + 3} textAnchor="end" fill="#9CA3AF" fontSize="8" fontWeight="600">{yl.v}</text></g>)}
      {f.length > 1 && <><text x={pts[0].x} y={H - 6} textAnchor="start" fill="#9CA3AF" fontSize="8">{fmtD(f[0].date)}</text><text x={pts[pts.length - 1].x} y={H - 6} textAnchor="end" fill="#9CA3AF" fontSize="8">{fmtD(f[f.length - 1].date)}</text></>}
      <path d={ap} fill={`url(#${c.gid}a)`}><animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" /></path>
      <path d={lp} fill="none" stroke={`url(#${c.gid}l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <g key={i}>{i === pts.length - 1 && <><circle cx={p.x} cy={p.y} r="5" fill={c.color} opacity="0.15"><animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" /></circle><circle cx={p.x} cy={p.y} r="3.5" fill={c.color} stroke="#FFF" strokeWidth="2" /><text x={Math.min(p.x, W - 30)} y={p.y - 10} textAnchor={p.x > W - 40 ? 'end' : 'middle'} fill={c.color} fontSize="10" fontWeight="800">{p.v}{c.unit}</text></>}{i > 0 && i < pts.length - 1 && <circle cx={p.x} cy={p.y} r="1.5" fill="rgba(0,0,0,0.08)" />}</g>)}
    </svg>
  );
}

function BMIBar({ bmi, info }: { bmi: number; info: any }) {
  if (!bmi) return null;
  const pct = Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100));
  return (
    <div data-testid="bmi-gauge" style={{ marginTop: 8 } as any}>
      <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' } as any}>
        {[{ w: 14, c: B }, { w: 26, c: G }, { w: 20, c: A }, { w: 40, c: R }].map((z, i) => <div key={i} style={{ width: `${z.w}%`, height: '100%', background: z.c, opacity: 0.5 } as any} />)}
      </div>
      <div style={{ position: 'relative', height: 12, marginTop: -9 } as any}><div style={{ position: 'absolute', left: `calc(${pct}% - 5px)`, width: 10, height: 10, borderRadius: '50%', background: info?.color || A, border: '2px solid #FFF', boxShadow: `0 0 8px ${info?.color || A}50`, transition: 'left 1s ease' } as any} /></div>
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
        <span style={{ fontSize: 9, color: '#9CA3AF' }}>Ref: {info.ref}</span>
        <span style={{ fontSize: 9, color: '#6B7280' }}>{info.desc}</span>
      </div>
    </div>
  );
}

/* ═══ Swipe Picker — Glass transparent design (used in dark popups) ═══ */
function SwipePicker({ values, selected, onChange, unit, color }: { values: number[]; selected: number; onChange: (v: number) => void; unit: string; color: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const IW = 54;
  const isTouching = useRef(false);
  const lastUserValue = useRef(selected);
  const scrollToSelected = useCallback((val: number) => { const el = itemRefs.current[val]; const container = containerRef.current; if (el && container) { container.scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2; } }, []);
  const isInit = useRef(true);
  useEffect(() => { isInit.current = true; const go = () => scrollToSelected(selected); go(); const t1 = setTimeout(go, 50); const t2 = setTimeout(go, 200); const t3 = setTimeout(() => { go(); isInit.current = false; }, 800); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }; }, [values.length]);
  useEffect(() => { if (!isInit.current && !isTouching.current && selected !== lastUserValue.current) { scrollToSelected(selected); lastUserValue.current = selected; } }, [selected]);
  const snapTimer = useRef<any>(null);
  const onScroll = () => { if (isInit.current || !isTouching.current) return; clearTimeout(snapTimer.current); snapTimer.current = setTimeout(() => { if (!containerRef.current || isInit.current) return; const cx = containerRef.current.scrollLeft + containerRef.current.clientWidth / 2; let best = 0, md = Infinity; values.forEach((_, i) => { const d = Math.abs(i * IW + IW / 2 - cx); if (d < md) { md = d; best = i; } }); if (values[best] !== selected) { lastUserValue.current = values[best]; onChange(values[best]); } isTouching.current = false; }, 250); };
  return (
    <div style={{ position: 'relative', height: 64, margin: '0 -18px' } as any}>
      <div style={{ position: 'absolute', left: '50%', top: 6, bottom: 6, width: IW - 4, marginLeft: -(IW - 4) / 2, zIndex: 2, borderRadius: 14, background: `${color}10`, border: `1.5px solid ${color}30`, pointerEvents: 'none' } as any} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 70, zIndex: 3, background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 100%)', pointerEvents: 'none', borderRadius: '20px 0 0 20px' } as any} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 70, zIndex: 3, background: 'linear-gradient(270deg, rgba(0,0,0,0.3) 0%, transparent 100%)', pointerEvents: 'none', borderRadius: '0 20px 20px 0' } as any} />
      <div ref={containerRef} onScroll={onScroll} onTouchStart={() => { isTouching.current = true; }} onMouseDown={() => { isTouching.current = true; }} style={{ display: 'flex', height: '100%', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', cursor: 'grab', userSelect: 'none' } as any}>
        <div style={{ minWidth: `calc(50% - ${IW / 2}px)`, flexShrink: 0 } as any} />
        {values.map(v => { const sel = v === selected; return (
          <div key={v} ref={el => { itemRefs.current[v] = el; }} onClick={() => { isTouching.current = true; lastUserValue.current = v; onChange(v); setTimeout(() => { scrollToSelected(v); isTouching.current = false; }, 10); }} style={{ width: IW, flexShrink: 0, textAlign: 'center', cursor: 'pointer', padding: '8px 0' } as any}>
            <div style={{ fontSize: sel ? 24 : 14, fontWeight: sel ? 900 : 400, color: sel ? '#FFF' : 'rgba(255,255,255,0.15)', transition: 'all 0.15s', textShadow: sel ? `0 0 20px ${color}40` : 'none', lineHeight: 1.2 }}>{Number.isInteger(v) ? v : v.toFixed(1)}</div>
            {sel && <div style={{ fontSize: 8, fontWeight: 700, color: `${color}80`, marginTop: 1 }}>{unit}</div>}
          </div>
        ); })}
        <div style={{ minWidth: `calc(50% - ${IW / 2}px)`, flexShrink: 0 } as any} />
      </div>
    </div>
  );
}

export default function MinceurPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const beneficiaryId = (params.beneficiaryId as string) || null;
  const isReadonly = !!beneficiaryId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [targetKg, setTargetKg] = useState(75);
  const [goalWeeks, setGoalWeeks] = useState(12);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNoraAnalysis, setShowNoraAnalysis] = useState(false);
  const [showGoalConfirm, setShowGoalConfirm] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
      const url = beneficiaryId ? `/api/minceur/weight-details?beneficiary_id=${beneficiaryId}` : '/api/minceur/weight-details';
      const d = await apiFetch(url, {}, token);
      setData(d);
      if (d.tracking?.completed) setTracked(d.tracking.completed);
      if (d.tracking?.streak) setStreak(d.tracking.streak);
      if (d.current?.weight > 0 && !d.goal) setTargetKg(Math.round(d.current.weight - 3));
      if (d.goal?.target_kg) { setTargetKg(d.goal.target_kg); if (d.goal.weeks) setGoalWeeks(d.goal.weeks); }
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchData(); }, [token]);

  useEffect(() => {
    const sync = () => { if (token && data) { apiFetch('/api/minceur/today-tracking', {}, token).then(t => { if (t?.completed) setTracked(t.completed); if (t?.streak) setStreak(t.streak); }).catch(() => {}); } };
    window.addEventListener('focus', sync);
    window.addEventListener('popstate', sync);
    const intervals = [2000, 4000, 6000, 8000, 10000].map(ms => setTimeout(sync, ms));
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('popstate', sync); intervals.forEach(clearTimeout); };
  }, [token, data]);

  const saveGoal = async () => {
    setSaving(true);
    try {
      const result = await apiFetch('/api/minceur/weight-goal', { method: 'POST', body: JSON.stringify({ target_kg: targetKg, weeks: goalWeeks }) }, token);
      setShowGoalForm(false);
      if (data && result.daily_calories) { setData((prev: any) => ({ ...prev, goal: { target_kg: targetKg, weeks: goalWeeks }, recommendations: prev.recommendations ? { ...prev.recommendations, daily_calories: result.daily_calories } : null })); }
      fetchData();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };
  const removeGoal = async () => { try { await apiFetch('/api/minceur/weight-goal', { method: 'DELETE' }, token); setShowGoalForm(false); setLoading(true); await fetchData(); } catch {} };
  const refreshRecs = async () => { setRefreshing(true); try { await apiFetch('/api/minceur/refresh-recommendations', { method: 'POST' }, token); await fetchData(); } catch { setRefreshing(false); } };
  const toggleTrack = async (type: 'meal' | 'exercise', index: number) => { const k = `${type}_${index}`, w = tracked[k]; setTracked(p => ({ ...p, [k]: !w })); if (!w) setStreak(s => Math.max(s, 1)); try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type, index }) }, token); } catch { setTracked(p => ({ ...p, [k]: w })); } };

  if (Platform.OS !== 'web') return null;
  const cr = data?.current || {}, bc = data?.body_composition || {}, recs = data?.recommendations, history = data?.weight_history || [], goal = data?.goal;
  const total = recs ? (recs.meals?.length || 0) + (recs.exercises?.length || 0) : 0;
  const done = Object.values(tracked).filter(Boolean).length;

  return (
    <div data-testid="minceur-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ═══ HEADER with blue BG image ═══ */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 300 } as any}>
          <img src={BLUE_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 } as any}>
              <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>Poids & Nutrition</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{isReadonly ? 'Vue gardien (lecture seule)' : 'Suivi personnalise'}</div></div>
              {recs && total > 0 && (
                <div data-testid="daily-progress" onClick={() => setShowStreakInfo(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: done === total ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${done === total ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' } as any}>
                  {streak > 0 && <><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 10, fontWeight: 800, color: A }}>{streak}j</span><span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.08)' } as any} /></>}
                  <span style={{ fontSize: 10, fontWeight: 800, color: done === total ? G : '#FFF' }}>{done}/{total}</span>
                </div>
              )}
              {!isReadonly && <div data-testid="refresh-button" onClick={refreshRecs} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-refresh-line" style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /></div>}
            </div>

            {/* Weight display + Balance image */}
            {!loading && data && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Poids actuel</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 } as any}><span style={{ fontSize: 52, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{cr.weight > 0 ? cr.weight : '--'}</span><span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>kg</span></div>
                  {cr.bmi > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: cr.bmi_info?.color || A, marginTop: 4 }}>IMC {cr.bmi} · {cr.bmi_info?.label}</div>}
                </div>
                <img src={BALANCE_IMG} alt="" style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' } as any} />
              </div>
            )}
            {!loading && cr.bmi > 0 && <BMIBar bmi={cr.bmi} info={cr.bmi_info} />}
          </div>
        </div>

        {/* ═══ WHITE CONTENT CARD ═══ */}
        <div style={{ padding: '24px 16px 120px', marginTop: -24, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-24px auto 0', width: '100%' } as any}>

          {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 0' } as any}>{[1,2,3].map(i => (<div key={i} style={{ padding: 20, borderRadius: 20, background: '#F4F4F5', animation: 'pulse 1.5s ease infinite' } as any}><div style={{ width: '40%', height: 10, borderRadius: 5, background: '#E5E7EB', marginBottom: 8 } as any} /><div style={{ width: '60%', height: 24, borderRadius: 5, background: '#E5E7EB' } as any} /></div>))}</div>}
          {error && !loading && <div style={{ padding: 24, borderRadius: 20, background: '#F4F4F5', textAlign: 'center' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, color: R }} /><div style={{ fontSize: 14, color: '#111', fontWeight: 700, marginTop: 8 }}>{error}</div></div>}

          {!loading && data && (
            <>
              {/* ══ NORA ANALYSIS BUTTON (at top) ══ */}
              {recs?.nora_insight && (
                <div data-testid="nora-analysis-btn" onClick={() => setShowNoraAnalysis(true)} style={{ borderRadius: 16, background: '#000', padding: '14px 16px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'opacity 0.15s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }} onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>
                  <video autoPlay loop muted playsInline style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'contain', flexShrink: 0 } as any} src={NORA_VIDEO} />
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Voir l'analyse de Nora</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Analyse personnalisee de votre nutrition</div></div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
                </div>
              )}

              {/* ══ 3 SEPARATE CHARTS ══ */}
              {history.length >= 2 && (
                <>
                  {history.some((h: any) => h.weight > 0) && (
                    <div data-testid="chart-weight" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}><i className="ri-scales-3-line" style={{ fontSize: 14, color: A }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Evolution du poids</span>{cr.weight > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: A, marginLeft: 'auto' }}>{cr.weight}kg</span>}</div>
                      <Chart history={history} metric="weight" />
                    </div>
                  )}
                  {history.some((h: any) => h.body_fat_pct > 0) && (
                    <div data-testid="chart-fat" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}><i className="ri-fire-line" style={{ fontSize: 14, color: '#F97316' }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Masse grasse</span>{bc.body_fat_pct > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: '#F97316', marginLeft: 'auto' }}>{bc.body_fat_pct}%</span>}</div>
                      <Chart history={history} metric="body_fat_pct" />
                      <Insight metric="body_fat_pct" value={bc.body_fat_pct} gender={data?.profile?.gender || ''} weight={cr.weight || 0} />
                    </div>
                  )}
                  {history.some((h: any) => h.muscle_pct > 0) && (
                    <div data-testid="chart-muscle" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}><i className="ri-body-scan-line" style={{ fontSize: 14, color: G }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Masse musculaire</span>{bc.muscle_pct > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: G, marginLeft: 'auto' }}>{bc.muscle_pct}%</span>}</div>
                      <Chart history={history} metric="muscle_pct" />
                      <Insight metric="muscle_pct" value={bc.muscle_pct} gender={data?.profile?.gender || ''} weight={cr.weight || 0} />
                    </div>
                  )}
                </>
              )}
              {history.length === 0 && <div style={{ textAlign: 'center', padding: '20px', borderRadius: 18, background: '#F4F4F5', marginBottom: 12 } as any}><i className="ri-scales-3-line" style={{ fontSize: 24, color: '#D1D5DB', display: 'block', marginBottom: 4 }} /><span style={{ fontSize: 12, color: '#9CA3AF' }}>Pesez-vous pour commencer le suivi</span></div>}

              {/* ══ GOAL SECTION ══ */}
              <div data-testid="goal-card" style={{ borderRadius: 18, background: '#F4F4F5', padding: 16, marginBottom: 14 } as any}>
                {!goal && !isReadonly && (
                  <div data-testid="set-goal-button" onClick={() => setShowGoalForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' } as any}>
                    <img src="https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/d7demq52_img_objectif_poids.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 } as any} />
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Definir un objectif de poids</div><div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Nora adaptera vos repas et apports caloriques</div></div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: A }} />
                  </div>
                )}
                {goal && (() => {
                  const diff = cr.weight > 0 ? cr.weight - goal.target_kg : 0;
                  const kpw = goal.weeks > 0 ? Math.abs(diff) / goal.weeks : 0;
                  const progressPct = diff > 0 ? Math.max(0, Math.min(100, (1 - (cr.weight - goal.target_kg) / (diff || 1)) * 100)) : 0;
                  const goalDays = goal.created_at ? Math.max(1, Math.floor((Date.now() - new Date(goal.created_at).getTime()) / 86400000)) : 1;
                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><img src="https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/d7demq52_img_objectif_poids.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' } as any} /><span style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Votre objectif</span></div>
                        <span data-testid="edit-goal" onClick={() => setShowGoalForm(true)} style={{ fontSize: 10, color: A, cursor: 'pointer', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${A}10` } as any}>Modifier</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 } as any}>
                        <div style={{ flex: 1 } as any}><div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}><span style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{cr.weight > 0 ? cr.weight : '--'}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>kg</span><i className="ri-arrow-right-line" style={{ fontSize: 12, color: '#D1D5DB', margin: '0 2px' }} /><span style={{ fontSize: 24, fontWeight: 900, color: A }}>{goal.target_kg}</span><span style={{ fontSize: 10, color: `${A}50` }}>kg</span></div></div>
                        <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 20, fontWeight: 900, color: G }}>{goalDays}<span style={{ fontSize: 9, color: `${G}60` }}> j</span></div><div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 700 }}>ACTIF</div></div>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden', marginBottom: 3 } as any}><div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${A}, ${G})`, width: `${progressPct}%`, transition: 'width 1s ease' } as any} /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 } as any}><span style={{ fontSize: 9, color: '#9CA3AF' }}>{diff > 0 ? `-${diff.toFixed(1)}kg` : `+${Math.abs(diff).toFixed(1)}kg`} · {kpw.toFixed(1)}kg/sem</span><span style={{ fontSize: 9, color: A, fontWeight: 700 }}>{Math.round(progressPct)}%</span></div>
                      <div style={{ display: 'flex', gap: 6 } as any}>
                        {[{ l: 'KCAL/JOUR', v: recs?.daily_calories || '--' }, { l: 'SEMAINES', v: goal.weeks || 0 }, { l: 'REPAS', v: recs?.meals?.length || 4 }, { l: 'EXERCICES', v: recs?.exercises?.length || 2 }].map((s, i) => (
                          <div key={i} style={{ flex: 1, padding: '6px 4px', borderRadius: 8, background: '#FFF', textAlign: 'center' } as any}><div style={{ fontSize: 13, fontWeight: 900, color: '#111' }}>{s.v}</div><div style={{ fontSize: 7, color: '#9CA3AF', fontWeight: 700 }}>{s.l}</div></div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {data.last_reading_date && <div style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'right', marginTop: 8 }}>Pesee : {new Date(data.last_reading_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
              </div>

              {/* ══ CALORIES + MACROS ══ */}
              {recs && (
                <>
                  <div data-testid="calories-summary" style={{ borderRadius: 18, background: '#F4F4F5', padding: 0, marginBottom: 14, overflow: 'hidden' } as any}>
                    <div style={{ padding: '18px 18px 14px' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                        <div><div style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Apport calorique journalier</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 } as any}><span style={{ fontSize: 38, fontWeight: 900, color: '#111', lineHeight: 1, letterSpacing: -1 }}>{recs.daily_calories}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>kcal</span></div></div>
                        {recs.water_ml && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', borderRadius: 14, background: `${B}10` } as any}><i className="ri-drop-fill" style={{ fontSize: 18, color: B }} /><span style={{ fontSize: 14, fontWeight: 900, color: B, marginTop: 2 }}>{(recs.water_ml / 1000).toFixed(1)}L</span></div>)}
                      </div>
                    </div>
                    {recs.macros && (<div style={{ display: 'flex', borderTop: '1px solid #E5E7EB' } as any}>{[{ l: 'Proteines', v: recs.macros.proteines_g, c: G }, { l: 'Glucides', v: recs.macros.glucides_g, c: A }, { l: 'Lipides', v: recs.macros.lipides_g, c: R }].map((m, i) => (<div key={i} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' } as any}><div style={{ fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1 }}>{m.v}<span style={{ fontSize: 9, color: '#9CA3AF' }}>g</span></div><div style={{ fontSize: 8, color: m.c, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.l}</div></div>))}</div>)}
                  </div>

                  {/* ══ MEALS — uniform card design ══ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}><i className="ri-restaurant-2-line" style={{ fontSize: 14, color: G }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Vos repas du jour</span></div>
                  {recs.meals && <div data-testid="meals-section" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 } as any}>
                    {recs.meals.map((meal: any, i: number) => { const tp = meal.type || ['breakfast', 'lunch', 'snack', 'dinner'][i] || 'lunch'; const col = MC[tp] || G; const dn = tracked[`meal_${i}`]; const isProMeal = meal.source === 'pro' && meal.assignment_id; return (
                      <div key={i} data-testid={`meal-${tp}`} onClick={() => router.push({ pathname: '/meal-detail' as any, params: isProMeal ? { mode: 'assigned', assignmentId: meal.assignment_id } : { index: i } })}
                        style={{ borderRadius: 14, background: dn ? `${G}08` : '#F4F4F5', overflow: 'hidden', cursor: 'pointer', opacity: dn ? 0.65 : 1, display: 'flex', minHeight: 72 } as any}>
                        <div style={{ width: 80, flexShrink: 0, position: 'relative', overflow: 'hidden' } as any}><img src={MI[tp] || MI.lunch} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>
                        <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}><span style={{ fontSize: 8, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: 0.6 }}>{meal.label} {meal.time ? `· ${meal.time}` : ''}</span><span style={{ fontSize: 12, fontWeight: 900, color: '#9CA3AF' }}>{meal.calories}<span style={{ fontSize: 7 }}>kcal</span></span></div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#111', textDecoration: dn ? 'line-through' : 'none' }}>{meal.name}</div>
                          <span style={{ fontSize: 9, color: col, fontWeight: 700, marginTop: 3 }}>Voir la recette <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span>
                        </div>
                        <div data-testid={`track-meal-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack('meal', i); }} style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' } as any}><i className="ri-check-line" style={{ fontSize: 16, color: dn ? G : '#D1D5DB' }} /></div>
                      </div>
                    ); })}
                  </div>}

                  {/* ══ EXERCISES — uniform card design ══ */}
                  {recs.exercises && recs.exercises.length > 0 && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 14, color: R }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Vos exercices du jour</span></div>
                      {recs.exercises.map((ex: any, i: number) => { const int = ex.intensity || 'modere'; const intC = int === 'leger' ? G : int === 'modere' ? A : R; const dn = tracked[`exercise_${i}`]; const catKey = (ex.category || 'cardio').toLowerCase(); const img = EX_IMG[catKey] || EX_IMG.cardio; return (
                        <div key={i} data-testid={`exercise-${i}`} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })}
                          style={{ borderRadius: 14, background: dn ? `${G}08` : '#F4F4F5', overflow: 'hidden', cursor: 'pointer', opacity: dn ? 0.65 : 1, display: 'flex', minHeight: 80, marginBottom: 8 } as any}>
                          <div style={{ width: 88, flexShrink: 0, position: 'relative', overflow: 'hidden' } as any}><img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>
                          <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}><span style={{ fontSize: 8, fontWeight: 700, color: intC, textTransform: 'uppercase', letterSpacing: 0.6 }}>{int} {ex.duration ? `· ${ex.duration}` : ''}</span>{ex.calories_burned > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: '#9CA3AF' }}>{ex.calories_burned}<span style={{ fontSize: 7 }}>kcal</span></span>}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textDecoration: dn ? 'line-through' : 'none', marginTop: 2 }}>{ex.name}</div>
                            <span style={{ fontSize: 9, color: R, fontWeight: 700, marginTop: 3 }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span>
                          </div>
                          <div data-testid={`track-ex-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack('exercise', i); }} style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-check-line" style={{ fontSize: 16, color: dn ? G : '#D1D5DB' }} /></div>
                        </div>
                      ); })}
                    </>
                  )}
                </>
              )}
              {!recs && !loading && <div style={{ padding: 28, borderRadius: 20, background: '#F4F4F5', textAlign: 'center' } as any}><div style={{ width: 32, height: 32, margin: '0 auto 10px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: P, animation: 'spin 0.8s linear infinite' } as any} /><div style={{ fontSize: 12, color: '#9CA3AF' }}>Generation des recommandations...</div></div>}
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}` }} />

      {/* ══ STREAK INFO POPUP ══ */}
      {showStreakInfo && (
        <div data-testid="streak-popup" onClick={() => setShowStreakInfo(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowStreakInfo(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}><div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-fire-fill" style={{ fontSize: 26, color: A }} /></div><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Votre suivi quotidien</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Suivez votre regularite et vos progres</div></div>
            <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 } as any}><div style={{ display: 'flex', gap: 16 } as any}><div style={{ flex: 1, textAlign: 'center', padding: '12px 0' } as any}><i className="ri-fire-fill" style={{ fontSize: 28, color: A, display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 36, fontWeight: 900, color: A }}>{streak}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>jours consecutifs</div></div><div style={{ width: 1, background: 'rgba(255,255,255,0.08)' } as any} /><div style={{ flex: 1, textAlign: 'center', padding: '12px 0' } as any}><i className="ri-check-double-line" style={{ fontSize: 28, color: done === total ? G : '#FFF', display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 36, fontWeight: 900, color: done === total ? G : '#FFF' }}>{done}/{total}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>valides aujourd'hui</div></div></div></div>
            {recs && (<div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '14px 16px', marginBottom: 16 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Detail du jour</div>{recs.meals?.map((meal: any, i: number) => { const dk = tracked[`meal_${i}`]; return (<div key={`m${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}><i className={dk ? 'ri-check-line' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 14, color: dk ? G : 'rgba(255,255,255,0.15)' }} /><span style={{ fontSize: 13, color: dk ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)', textDecoration: dk ? 'line-through' : 'none', flex: 1 }}>{meal.name}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{meal.calories}kcal</span></div>); })}{recs.exercises?.map((ex: any, i: number) => { const dk = tracked[`exercise_${i}`]; return (<div key={`e${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}><i className={dk ? 'ri-check-line' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 14, color: dk ? G : 'rgba(255,255,255,0.15)' }} /><span style={{ fontSize: 13, color: dk ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)', textDecoration: dk ? 'line-through' : 'none', flex: 1 }}>{ex.name}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{ex.duration}</span></div>); })}</div>)}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, textAlign: 'center', padding: '0 16px' }}>Validez vos repas et exercices chaque jour. Nora adapte ses recommandations selon votre regularite.</div>
          </div>
        </div>
      )}

      {/* ══ GOAL FORM POPUP ══ */}
      {showGoalForm && !isReadonly && (() => {
        const diff = cr.weight > 0 ? cr.weight - targetKg : 0;
        const kgPerWeek = goalWeeks > 0 ? Math.abs(diff) / goalWeeks : 0;
        const tooFast = diff > 0 && kgPerWeek > 0.7;
        const tooSlow = diff > 0 && kgPerWeek < 0.2 && goalWeeks < 24;
        const baseW = cr.weight > 0 ? cr.weight : 75;
        const wOpts: number[] = []; for (let w = Math.max(40, Math.round(baseW) - 15); w <= Math.round(baseW) + 5; w++) wOpts.push(w);
        const dOpts: number[] = []; for (let w = 2; w <= 24; w++) dOpts.push(w);
        return (
          <div data-testid="goal-form-popup" onClick={() => setShowGoalForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowGoalForm(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
              <div style={{ textAlign: 'center', marginBottom: 28 } as any}><img src="https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/d7demq52_img_objectif_poids.png" alt="" style={{ width: 64, height: 64, objectFit: 'contain', display: 'block', margin: '0 auto 12px' } as any} /><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Objectif de poids</div></div>
              <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>Poids cible</div>
                <SwipePicker values={wOpts} selected={targetKg} onChange={setTargetKg} unit="kg" color={A} />
                {cr.weight > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, textAlign: 'center' }}>{diff > 0 ? `-${diff.toFixed(1)}` : `+${Math.abs(diff).toFixed(1)}`}kg par rapport a aujourd'hui</div>}
              </div>
              <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>Duree de l'objectif</div>
                <SwipePicker values={dOpts} selected={goalWeeks} onChange={setGoalWeeks} unit="sem" color={G} />
              </div>
              {diff > 0 && (<div style={{ textAlign: 'center', marginBottom: 12, padding: '8px 14px', borderRadius: 12, background: tooFast ? 'rgba(239,68,68,0.08)' : tooSlow ? 'rgba(96,165,250,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${tooFast ? 'rgba(239,68,68,0.15)' : tooSlow ? 'rgba(96,165,250,0.15)' : 'rgba(16,185,129,0.15)'}` } as any}><div style={{ fontSize: 11, fontWeight: 700, color: tooFast ? R : tooSlow ? B : G }}>{tooFast ? 'Rythme trop rapide' : tooSlow ? 'Rythme tres progressif' : 'Rythme recommande'}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{kgPerWeek.toFixed(1)}kg/semaine {tooFast ? '· max 0.7kg/sem recommande' : ''}</div></div>)}
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div data-testid="save-goal" onClick={() => setShowGoalConfirm(true)} style={{ flex: 1, padding: 14, borderRadius: 999, background: tooFast ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${A}, #D97706)`, cursor: saving ? 'wait' : 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: saving ? 0.6 : 1, boxShadow: tooFast ? 'none' : `0 8px 24px ${A}30` } as any}>{saving ? '...' : "Valider l'objectif"}</div>
                <div onClick={() => setShowGoalForm(false)} style={{ padding: '14px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' } as any}>Annuler</div>
              </div>
              {goal && <div data-testid="remove-goal" onClick={removeGoal} style={{ textAlign: 'center', padding: 10, marginTop: 6, fontSize: 11, color: 'rgba(239,68,68,0.4)', cursor: 'pointer' } as any}>Supprimer l'objectif</div>}
            </div>
          </div>
        );
      })()}

      {/* ══ GOAL CONFIRMATION POPUP ══ */}
      {showGoalConfirm && (
        <div data-testid="goal-confirm-popup" onClick={() => setShowGoalConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowGoalConfirm(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}><img src="https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/d7demq52_img_objectif_poids.png" alt="" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto 16px' } as any} /><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Lancer votre objectif ?</div><div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Objectif : {targetKg}kg en {goalWeeks} semaines</div></div>
            <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 } as any}><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>En lancant cet objectif, Nora va adapter pour vous :</div><div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 } as any}>{[{ icon: 'ri-fire-line', color: A, text: "Votre apport calorique quotidien sera ajuste pour atteindre votre poids cible dans le delai choisi." }, { icon: 'ri-restaurant-2-line', color: G, text: 'Des repas personnalises avec les bons macronutriments seront generes chaque jour.' }, { icon: 'ri-drop-line', color: B, text: "Votre consommation d'eau sera adaptee a votre profil et votre activite." }, { icon: 'ri-checkbox-circle-line', color: P, text: 'Validez vos repas chaque jour pour suivre votre progression.' }].map((item, i) => (<div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' } as any}><i className={item.icon} style={{ fontSize: 16, color: item.color, marginTop: 2, flexShrink: 0 }} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.text}</div></div>))}</div></div>
            <div onClick={() => { setShowGoalConfirm(false); saveGoal(); }} style={{ padding: 16, borderRadius: 999, background: `linear-gradient(135deg, ${A}, #D97706)`, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#FFF', cursor: saving ? 'wait' : 'pointer', boxShadow: `0 8px 24px ${A}30`, opacity: saving ? 0.6 : 1 } as any}>{saving ? 'Lancement en cours...' : "Confirmer et lancer l'objectif"}</div>
          </div>
        </div>
      )}

      {/* ══ NORA ANALYSIS OVERLAY ══ */}
      {showNoraAnalysis && recs?.nora_insight && (() => {
        const fullText = `${recs.nora_insight}${recs.tip_of_the_day ? ` ${recs.tip_of_the_day}` : ''}`;
        return <NoraAnalysisOverlay text={fullText} onClose={() => setShowNoraAnalysis(false)} />;
      })()}
    </div>
  );
}
