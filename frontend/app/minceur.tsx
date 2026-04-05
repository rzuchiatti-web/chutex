import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NoraCard from '../src/components/shared/NoraCard';
import { BG_IMAGES } from '../src/components/dashboard/constants';
import { HorizontalCalendar } from '../src/components/dashboard/pro/ProCalendar';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';
const BLUE_BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';

function NoraAnalysisOverlay({ text: initialText, onClose, history, current, bodyComp }: { text: string; onClose: () => void; history?: any[]; current?: any; bodyComp?: any }) {
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
        <div onClick={onClose} style={{ position: 'fixed', top: 70, left: 20, width: 40, height: 40, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100001, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#111' }} /></div>
        <video autoPlay loop muted playsInline style={{ width: phase === 'intro' ? 140 : 90, height: phase === 'intro' ? 140 : 90, borderRadius: phase === 'intro' ? 50 : 30, objectFit: 'contain', animation: phase === 'intro' ? 'noraPulse 2.2s ease infinite' : 'none', marginBottom: phase === 'intro' ? 20 : 24, transition: 'all 1s cubic-bezier(0.22,0.61,0.36,1)', boxShadow: '0 0 60px rgba(167,139,250,0.15)' } as any} src={NORA_VIDEO} />
        {phase === 'intro' && (<div style={{ textAlign: 'center', animation: 'noraTextIn 0.6s ease 0.3s both' } as any}><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Nora analyse...</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Votre bilan nutritionnel personnalise</div></div>)}
        {(phase === 'typing' || phase === 'done') && (<div style={{ width: '100%', maxWidth: 380, animation: 'noraTextIn 0.5s ease both' } as any}><div style={{ textAlign: 'center', marginBottom: 20 } as any}><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Analyse de Nora</div><div style={{ height: 2, width: 40, borderRadius: 1, background: 'rgba(167,139,250,0.4)', margin: '10px auto 0' } as any} /></div>{formatText(typed).map((para, i) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' } as any} />}<div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.85, textAlign: 'center' }}>{para}</div></div>))}{phase === 'typing' && <span style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 13 }}>|</span>}
          {/* ── Weekly Summary ── */}
          {phase === 'done' && history && history.length >= 2 && (() => {
            const sorted = [...history].reverse();
            const latest = sorted[0];
            const weekAgo = sorted.find((h: any) => {
              const diff = (Date.now() - new Date(h.date).getTime()) / 86400000;
              return diff >= 6;
            }) || sorted[Math.min(sorted.length - 1, 7)];
            const metrics = [
              { label: 'Poids', key: 'weight', unit: 'kg', color: '#F59E0B', icon: 'ri-scales-3-line' },
              { label: 'Graisse', key: 'body_fat_pct', unit: '%', color: '#F97316', icon: 'ri-fire-line' },
              { label: 'Muscle', key: 'muscle_pct', unit: '%', color: '#10B981', icon: 'ri-body-scan-line' },
            ];
            return (
              <div style={{ marginTop: 28 } as any}>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 } as any} />
                <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Bilan hebdomadaire</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Evolution sur les 7 derniers jours</div>
                </div>
                <div style={{ display: 'flex', gap: 8 } as any}>
                  {metrics.map(m => {
                    const cur = latest?.[m.key] || 0;
                    const prev = weekAgo?.[m.key] || 0;
                    const diff = cur && prev ? cur - prev : 0;
                    const isUp = diff > 0;
                    const diffColor = m.key === 'weight' ? (isUp ? '#EF4444' : '#10B981') : (isUp ? '#10B981' : '#EF4444');
                    return (
                      <div key={m.key} style={{ flex: 1, padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                        <i className={m.icon} style={{ fontSize: 16, color: m.color, display: 'block', marginBottom: 6 }} />
                        <div style={{ fontSize: 18, fontWeight: 900, color: cur > 0 ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>{cur > 0 ? cur : '--'}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{m.label}</div>
                        {diff !== 0 && cur > 0 && prev > 0 && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 4, padding: '2px 6px', borderRadius: 999, background: `${diffColor}15` } as any}>
                            <i className={isUp ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 10, color: diffColor }} />
                            <span style={{ fontSize: 9, fontWeight: 800, color: diffColor }}>{Math.abs(diff).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>)}
      </div>
      {phase === 'done' && (<div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 36px', background: 'linear-gradient(0deg, #000 60%, transparent)', zIndex: 100000 } as any}><div data-testid="nora-back-btn" onClick={onClose} style={{ width: '100%', maxWidth: 380, margin: '0 auto', padding: '16px', borderRadius: 999, background: '#FFF', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-arrow-left-line" style={{ fontSize: 16, color: '#111' }} /><span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Retour</span></div></div>)}
    </div>
  );
}

const A = '#F59E0B', G = '#10B981', R = '#EF4444', B = '#60A5FA', P = '#A78BFA';
const MM: Record<string, { icon: string; grad: string }> = { breakfast: { icon: 'ri-cup-line', grad: 'linear-gradient(135deg, #F59E0B22, #F59E0B08)' }, lunch: { icon: 'ri-restaurant-2-line', grad: 'linear-gradient(135deg, #10B98122, #10B98108)' }, snack: { icon: 'ri-apple-line', grad: 'linear-gradient(135deg, #A78BFA22, #A78BFA08)' }, dinner: { icon: 'ri-moon-line', grad: 'linear-gradient(135deg, #60A5FA22, #60A5FA08)' } };
const MC: Record<string, string> = { breakfast: A, lunch: G, snack: P, dinner: B };
const MI: Record<string, string> = { breakfast: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png', lunch: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png', snack: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png', dinner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png' };

type MK = 'weight' | 'body_fat_pct' | 'muscle_pct';
const CFG: Record<MK, { color: string; unit: string; label: string; gid: string }> = { weight: { color: A, unit: 'kg', label: 'Poids', gid: 'gw' }, body_fat_pct: { color: '#F97316', unit: '%', label: 'Graisse', gid: 'gf' }, muscle_pct: { color: G, unit: '%', label: 'Muscle', gid: 'gm' } };

function Chart({ history, metric }: { history: any[]; metric: MK }) {
  const c = CFG[metric];
  const f = [...history].reverse().filter(d => d[metric] > 0).slice(-14);
  if (f.length < 2) return <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#9CA3AF' }}>Pas assez de mesures</div>;
  const vals = f.map(d => d[metric]);
  const mn = Math.min(...vals) - (metric === 'weight' ? 1 : 0.5), mx = Math.max(...vals) + (metric === 'weight' ? 1 : 0.5);
  const rng = mx - mn || 1, W = 360, H = 160, LM = 38, RM = 8, TM = 20, BM = 28;
  const pW = W - LM - RM, pH = H - TM - BM;
  const step = pW / (f.length - 1);
  const pts = f.map((d, i) => ({ x: LM + i * step, y: TM + pH - ((d[metric] - mn) / rng) * pH, v: d[metric], dt: d.date }));
  const fmtD = (s: string) => { try { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; } catch { return ''; } };

  // Smooth bezier path
  const smooth = (points: typeof pts): string => {
    if (points.length < 2) return '';
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[Math.max(0, i - 1)], b = points[i], cc = points[i + 1], e = points[Math.min(points.length - 1, i + 2)];
      d += `C${b.x + (cc.x - a.x) * 0.25},${b.y + (cc.y - a.y) * 0.25},${cc.x - (e.x - b.x) * 0.25},${cc.y - (e.y - b.y) * 0.25},${cc.x},${cc.y}`;
    }
    return d;
  };
  const lp = smooth(pts);
  const ap = lp + ` L${pts[pts.length - 1].x},${H - BM} L${pts[0].x},${H - BM} Z`;
  const yLabels = [mn, mn + rng * 0.33, mn + rng * 0.66, mx].map(v => ({ v: Math.round(v * 10) / 10, y: TM + pH - ((v - mn) / rng) * pH }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 170, display: 'block' }}>
      <defs>
        <linearGradient id={`${c.gid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.color} stopOpacity="0.2" /><stop offset="100%" stopColor={c.color} stopOpacity="0" /></linearGradient>
        <linearGradient id={`${c.gid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c.color} stopOpacity="0.3" /><stop offset="100%" stopColor={c.color} stopOpacity="1" /></linearGradient>
      </defs>
      {yLabels.map((yl, i) => <g key={i}><line x1={LM} x2={W - RM} y1={yl.y} y2={yl.y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="3,3" /><text x={LM - 6} y={yl.y + 3} textAnchor="end" fill="#9CA3AF" fontSize="9" fontWeight="600">{yl.v}</text></g>)}
      {/* Date labels */}
      {f.length > 1 && (() => {
        const labelStep = Math.max(1, Math.floor(f.length / 5));
        return f.map((d, i) => (i === 0 || i === f.length - 1 || i % labelStep === 0) ? <text key={i} x={pts[i].x} y={H - 8} textAnchor="middle" fill="#9CA3AF" fontSize="9" fontWeight="600">{fmtD(d.date)}</text> : null);
      })()}
      <path d={ap} fill={`url(#${c.gid}a)`}><animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" /></path>
      <path d={lp} fill="none" stroke={`url(#${c.gid}l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dashoffset" from={pW * 3} to="0" dur="1s" fill="freeze" />
      </path>
      {pts.map((p, i) => <g key={i}>
        {i === pts.length - 1 && <>
          <circle cx={p.x} cy={p.y} r="6" fill={c.color} opacity="0.12"><animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx={p.x} cy={p.y} r="4" fill={c.color} stroke="#FFF" strokeWidth="2" />
          <rect x={Math.min(p.x - 24, W - 52)} y={p.y - 22} width={48} height={18} rx={6} fill="#111" />
          <text x={Math.min(p.x, W - 28)} y={p.y - 10} textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="800">{p.v}{c.unit}</text>
        </>}
        {i > 0 && i < pts.length - 1 && <circle cx={p.x} cy={p.y} r="2" fill={c.color} opacity="0.2" />}
        {i === 0 && <circle cx={p.x} cy={p.y} r="2.5" fill={c.color} opacity="0.3" />}
      </g>)}
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [explainMetric, setExplainMetric] = useState<string | null>(null);
  const [mAvgs, setMAvgs] = useState<Record<string, any>>({});

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
    if (!token) return;
    apiFetch('/api/health/metric-averages?keys=weight,body_fat_pct,muscle_pct', {}, token).catch(() => ({})).then((a: any) => { if (a && typeof a === 'object') setMAvgs(a); });
  }, [token]);

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;

  useEffect(() => {
    const sync = () => { if (token && data) { apiFetch(`/api/minceur/today-tracking?date=${selectedDateStr}`, {}, token).then(t => { if (t?.completed) setTracked(t.completed); else setTracked({}); if (t?.streak) setStreak(t.streak); }).catch(() => {}); } };
    // Refetch tracking when date changes
    sync();
    window.addEventListener('focus', sync);
    return () => { window.removeEventListener('focus', sync); };
  }, [token, data, selectedDateStr]);

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
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 } as any}>
              <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ flex: 1 } as any} />
              {recs && total > 0 && (
                <div data-testid="daily-progress" onClick={() => setShowStreakInfo(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: done === total ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${done === total ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' } as any}>
                  {streak > 0 && <><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 10, fontWeight: 800, color: A }}>{streak}j</span><span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.08)' } as any} /></>}
                  <span style={{ fontSize: 10, fontWeight: 800, color: done === total ? G : '#FFF' }}>{done}/{total}</span>
                </div>
              )}
              {!isReadonly && <div data-testid="refresh-button" onClick={refreshRecs} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-refresh-line" style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /></div>}
            </div>

            {/* Centered title */}
            <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>Poids & Nutrition</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{isReadonly ? 'Vue gardien (lecture seule)' : 'Suivi personnalise'}</div>
            </div>

            {/* Centered weight */}
            {!loading && data && (
              <div style={{ textAlign: 'center', marginBottom: 4 } as any}>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 } as any}>
                  <span style={{ fontSize: 52, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{cr.weight > 0 ? cr.weight : '--'}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>kg</span>
                </div>
              </div>
            )}

            {/* Calendar — identical to activity-detail / ProCalendar */}
            <HorizontalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} accent={A} />
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

              {/* ══ GOAL SECTION (above IMC) ══ */}
              <div data-testid="goal-card" style={{ borderRadius: 18, background: '#F4F4F5', padding: 16, marginBottom: 12 } as any}>
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
                        {[{ l: 'KCAL/JOUR', v: recs?.daily_calories || '--' }, { l: 'SEMAINES', v: goal.weeks || 0 }, { l: 'REPAS', v: recs?.meals?.length || 4 }].map((s, i) => (
                          <div key={i} style={{ flex: 1, padding: '6px 4px', borderRadius: 8, background: '#FFF', textAlign: 'center' } as any}><div style={{ fontSize: 13, fontWeight: 900, color: '#111' }}>{s.v}</div><div style={{ fontSize: 7, color: '#9CA3AF', fontWeight: 700 }}>{s.l}</div></div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {data.last_reading_date && <div style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'right', marginTop: 8 }}>Pesee : {new Date(data.last_reading_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>}
              </div>

              {/* ══ IMC CARD (dedicated) — clickable ══ */}
              {cr.bmi > 0 && (
                <div data-testid="bmi-card" onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: 'bmi' } })} style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12, cursor: 'pointer', transition: 'transform 0.15s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-body-scan-line" style={{ fontSize: 14, color: P }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Indice de Masse Corporelle</span></div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#9CA3AF' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                    <div style={{ textAlign: 'center' } as any}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: cr.bmi_info?.color || A, lineHeight: 1 }}>{cr.bmi}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: cr.bmi_info?.color || A, marginTop: 4 }}>{cr.bmi_info?.label}</div>
                    </div>
                    <div style={{ flex: 1 } as any}><BMIBar bmi={cr.bmi} info={cr.bmi_info} /></div>
                  </div>
                </div>
              )}

              {/* ══ 3 SEPARATE CHARTS ══ */}
              {history.length >= 2 && (
                <>
                  {history.some((h: any) => h.weight > 0) && (
                    <div data-testid="chart-weight" onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: 'weight' } })} style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12, cursor: 'pointer' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                        <i className="ri-scales-3-line" style={{ fontSize: 14, color: A }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Evolution du poids</span>
                        {cr.weight > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: A, marginLeft: 'auto' }}>{cr.weight}kg</span>}
                        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#9CA3AF' }} />
                      </div>
                      <Chart history={history} metric="weight" />
                      {mAvgs.weight?.['7j'] != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: '#FFF', marginTop: 4 } as any}>
                          <i className="ri-line-chart-line" style={{ fontSize: 12, color: A }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Moy. 7j</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: A, marginLeft: 'auto' }}>{mAvgs.weight['7j']} kg</span>
                        </div>
                      )}
                    </div>
                  )}
                  {history.some((h: any) => h.body_fat_pct > 0) && (
                    <div data-testid="chart-fat" onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: 'body_fat_pct' } })} style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12, cursor: 'pointer' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                        <i className="ri-fire-line" style={{ fontSize: 14, color: '#F97316' }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Masse grasse</span>
                        {bc.body_fat_pct > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: '#F97316', marginLeft: 'auto' }}>{bc.body_fat_pct}%</span>}
                        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#9CA3AF' }} />
                      </div>
                      <Chart history={history} metric="body_fat_pct" />
                      <Insight metric="body_fat_pct" value={bc.body_fat_pct} gender={data?.profile?.gender || ''} weight={cr.weight || 0} />
                      {mAvgs.body_fat_pct?.['7j'] != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: '#FFF', marginTop: 4 } as any}>
                          <i className="ri-line-chart-line" style={{ fontSize: 12, color: '#F97316' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Moy. 7j</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#F97316', marginLeft: 'auto' }}>{mAvgs.body_fat_pct['7j']}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  {history.some((h: any) => h.muscle_pct > 0) && (
                    <div data-testid="chart-muscle" onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: 'muscle_pct' } })} style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 20px', marginBottom: 12, cursor: 'pointer' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                        <i className="ri-body-scan-line" style={{ fontSize: 14, color: G }} /><span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Masse musculaire</span>
                        {bc.muscle_pct > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: G, marginLeft: 'auto' }}>{bc.muscle_pct}%</span>}
                        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#9CA3AF' }} />
                      </div>
                      <Chart history={history} metric="muscle_pct" />
                      <Insight metric="muscle_pct" value={bc.muscle_pct} gender={data?.profile?.gender || ''} weight={cr.weight || 0} />
                      {mAvgs.muscle_pct?.['7j'] != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: '#FFF', marginTop: 4 } as any}>
                          <i className="ri-line-chart-line" style={{ fontSize: 12, color: G }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Moy. 7j</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: G, marginLeft: 'auto' }}>{mAvgs.muscle_pct['7j']}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {history.length === 0 && <div style={{ textAlign: 'center', padding: '20px', borderRadius: 18, background: '#F4F4F5', marginBottom: 12 } as any}><i className="ri-scales-3-line" style={{ fontSize: 24, color: '#D1D5DB', display: 'block', marginBottom: 4 }} /><span style={{ fontSize: 12, color: '#9CA3AF' }}>Pesez-vous pour commencer le suivi</span></div>}

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

                  {/* ══ MEALS — with title, subtitle, separator ══ */}
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '14px 0 24px' } as any} />
                  <div style={{ marginBottom: 6 } as any}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>Vos repas du jour</div>
                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 4, lineHeight: '1.45' }}>Repas personnalises par Nora selon votre objectif et vos besoins nutritionnels.</div>
                  </div>
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
                </>
              )}
              {!recs && !loading && <div style={{ padding: 28, borderRadius: 20, background: '#F4F4F5', textAlign: 'center' } as any}><div style={{ width: 32, height: 32, margin: '0 auto 10px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: P, animation: 'spin 0.8s linear infinite' } as any} /><div style={{ fontSize: 12, color: '#9CA3AF' }}>Generation des recommandations...</div></div>}
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes popIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}` }} />

      {/* ══ STREAK POPUP — clean dark ══ */}
      {showStreakInfo && (
        <div data-testid="streak-popup" onClick={() => setShowStreakInfo(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.8)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
            <div onClick={() => setShowStreakInfo(false)} style={{ position: 'absolute', top: 70, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
            <div style={{ textAlign: 'center', marginBottom: 40, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
              <i className="ri-fire-fill" style={{ fontSize: 48, color: A }} />
              <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', lineHeight: 1, marginTop: 12 }}>{streak}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: 600 }}>jours consecutifs</div>
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 40, animation: 'slideUp 0.4s ease 0.2s both' } as any}>
              <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 32, fontWeight: 900, color: done === total ? G : '#FFF' }}>{done}/{total}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>valides aujourd'hui</div></div>
            </div>
            {recs && (
              <div style={{ animation: 'slideUp 0.4s ease 0.3s both' } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>Detail du jour</div>
                {recs.meals?.map((meal: any, i: number) => { const dk = tracked[`meal_${i}`]; return (
                  <div key={`m${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
                    <i className={dk ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 18, color: dk ? G : 'rgba(255,255,255,0.12)' }} />
                    <span style={{ fontSize: 14, color: '#FFF', fontWeight: dk ? 400 : 600, textDecoration: dk ? 'line-through' : 'none', opacity: dk ? 0.4 : 1, flex: 1 }}>{meal.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{meal.calories}kcal</span>
                  </div>
                ); })}
                {recs.exercises?.map((ex: any, i: number) => { const dk = tracked[`exercise_${i}`]; return (
                  <div key={`e${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
                    <i className={dk ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 18, color: dk ? G : 'rgba(255,255,255,0.12)' }} />
                    <span style={{ fontSize: 14, color: '#FFF', fontWeight: dk ? 400 : 600, textDecoration: dk ? 'line-through' : 'none', opacity: dk ? 0.4 : 1, flex: 1 }}>{ex.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{ex.duration}</span>
                  </div>
                ); })}
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7, textAlign: 'center', marginTop: 24 }}>Validez vos repas chaque jour pour maintenir votre serie.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ GOAL FORM POPUP — clean dark ══ */}
      {showGoalForm && !isReadonly && (() => {
        const diff = cr.weight > 0 ? cr.weight - targetKg : 0;
        const kgPerWeek = goalWeeks > 0 ? Math.abs(diff) / goalWeeks : 0;
        const tooFast = diff > 0 && kgPerWeek > 0.7;
        const tooSlow = diff > 0 && kgPerWeek < 0.2 && goalWeeks < 24;
        const baseW = cr.weight > 0 ? cr.weight : 75;
        const wOpts: number[] = []; for (let w = Math.max(40, Math.round(baseW) - 15); w <= Math.round(baseW) + 5; w++) wOpts.push(w);
        const dOpts: number[] = []; for (let w = 2; w <= 24; w++) dOpts.push(w);
        return (
          <div data-testid="goal-form-popup" onClick={() => setShowGoalForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.8)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
              <div onClick={() => setShowGoalForm(false)} style={{ position: 'absolute', top: 70, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
              <div style={{ textAlign: 'center', marginBottom: 36, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
                <i className="ri-scales-3-line" style={{ fontSize: 40, color: A }} />
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginTop: 12 }}>Objectif de poids</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Definissez votre cible et Nora s'adapte</div>
              </div>
              <div style={{ animation: 'slideUp 0.4s ease 0.2s both' } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' }}>Poids cible</div>
                <SwipePicker values={wOpts} selected={targetKg} onChange={setTargetKg} unit="kg" color={A} />
                {cr.weight > 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'center' }}>{diff > 0 ? `-${diff.toFixed(1)}` : `+${Math.abs(diff).toFixed(1)}`}kg par rapport a aujourd'hui</div>}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0' } as any} />
              <div style={{ animation: 'slideUp 0.4s ease 0.3s both' } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' }}>Duree</div>
                <SwipePicker values={dOpts} selected={goalWeeks} onChange={setGoalWeeks} unit="sem" color={G} />
              </div>
              {diff > 0 && (
                <div style={{ textAlign: 'center', marginTop: 20, animation: 'slideUp 0.4s ease 0.35s both' } as any}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tooFast ? R : tooSlow ? B : G }}>{tooFast ? 'Rythme trop rapide' : tooSlow ? 'Tres progressif' : 'Rythme ideal'}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{kgPerWeek.toFixed(1)}kg/sem</span>
                </div>
              )}
              <div style={{ marginTop: 28, display: 'flex', gap: 10, animation: 'slideUp 0.4s ease 0.4s both' } as any}>
                <div data-testid="save-goal" onClick={() => setShowGoalConfirm(true)} style={{ flex: 1, padding: 16, borderRadius: 999, background: tooFast ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${A}, #D97706)`, cursor: saving ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#FFF', opacity: saving ? 0.6 : 1 } as any}>{saving ? '...' : "Valider"}</div>
                <div onClick={() => setShowGoalForm(false)} style={{ padding: '16px 20px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' } as any}>Annuler</div>
              </div>
              {goal && <div data-testid="remove-goal" onClick={removeGoal} style={{ textAlign: 'center', padding: 12, marginTop: 8, fontSize: 12, color: 'rgba(239,68,68,0.5)', cursor: 'pointer' } as any}>Supprimer l'objectif</div>}
            </div>
          </div>
        );
      })()}

      {/* ══ GOAL CONFIRM POPUP — clean dark ══ */}
      {showGoalConfirm && (
        <div data-testid="goal-confirm-popup" onClick={() => setShowGoalConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 10000, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.85)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
            <div onClick={() => setShowGoalConfirm(false)} style={{ position: 'absolute', top: 70, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
            <div style={{ textAlign: 'center', marginBottom: 36, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
              <i className="ri-rocket-2-line" style={{ fontSize: 44, color: A }} />
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginTop: 14 }}>Lancer l'objectif ?</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{targetKg}kg en {goalWeeks} semaines</div>
            </div>
            <div style={{ animation: 'slideUp 0.4s ease 0.2s both' } as any}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 28 }}>Nora va adapter pour vous :</div>
              {[
                { icon: 'ri-fire-line', color: A, text: 'Apport calorique ajuste a votre objectif' },
                { icon: 'ri-restaurant-2-line', color: G, text: 'Repas personnalises chaque jour' },
                { icon: 'ri-drop-line', color: B, text: "Hydratation adaptee a votre profil" },
                { icon: 'ri-checkbox-circle-line', color: P, text: 'Suivi quotidien de votre progression' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, animation: `slideUp 0.4s ease ${0.25 + i * 0.06}s both` } as any}>
                  <i className={item.icon} style={{ fontSize: 20, color: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#FFF', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div onClick={() => { setShowGoalConfirm(false); saveGoal(); }} style={{ marginTop: 20, padding: 18, borderRadius: 999, background: `linear-gradient(135deg, ${A}, #D97706)`, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#FFF', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, animation: 'slideUp 0.4s ease 0.5s both' } as any}>{saving ? 'Lancement...' : "Confirmer"}</div>
          </div>
        </div>
      )}

      {/* ══ NORA ANALYSIS OVERLAY ══ */}
      {showNoraAnalysis && recs?.nora_insight && (() => {
        const fullText = `${recs.nora_insight}${recs.tip_of_the_day ? ` ${recs.tip_of_the_day}` : ''}`;
        return <NoraAnalysisOverlay text={fullText} onClose={() => setShowNoraAnalysis(false)} history={history} current={cr} bodyComp={bc} />;
      })()}

      {/* ══ METRIC EXPLAIN POPUP — clean dark ══ */}
      {explainMetric && (() => {
        const explanations: Record<string, { icon: string; color: string; title: string; desc: string; ranges: { label: string; value: string; color: string }[]; tip: string }> = {
          bmi: { icon: 'ri-body-scan-line', color: P, title: 'IMC', desc: "L'Indice de Masse Corporelle met en relation votre poids et votre taille pour evaluer votre corpulence.", ranges: [{ label: 'Maigreur', value: '< 18.5', color: B }, { label: 'Normal', value: '18.5 - 25', color: G }, { label: 'Surpoids', value: '25 - 30', color: A }, { label: 'Obesite', value: '> 30', color: R }], tip: "L'IMC ne distingue pas masse grasse et masse musculaire. Un sportif muscle peut avoir un IMC eleve sans exces de graisse." },
          weight: { icon: 'ri-scales-3-line', color: A, title: 'Poids', desc: 'Le suivi regulier du poids permet de detecter les tendances. Les variations quotidiennes sont normales (eau, repas, hormones).', ranges: [{ label: 'Perte saine', value: '0.3-0.7 kg/sem', color: G }, { label: 'Maintien', value: '+/- 0.5 kg', color: B }, { label: 'Prise', value: 'selon objectif', color: A }], tip: 'Pesez-vous toujours au meme moment, le matin a jeun, pour des mesures comparables.' },
          body_fat: { icon: 'ri-fire-line', color: '#F97316', title: 'Masse grasse', desc: 'Le pourcentage de masse grasse indique la proportion de graisse dans votre corps. Un taux equilibre est essentiel.', ranges: [{ label: 'Homme normal', value: '14-25%', color: G }, { label: 'Femme normal', value: '20-33%', color: G }, { label: 'Eleve', value: '> 30% / > 39%', color: R }], tip: "La masse grasse protege les organes et regule les hormones. Un taux trop bas est aussi risque qu'un taux trop eleve." },
          muscle: { icon: 'ri-body-scan-line', color: G, title: 'Masse musculaire', desc: 'La proportion de muscles dans votre composition corporelle. Essentielle pour le metabolisme, la mobilite et la prevention des chutes.', ranges: [{ label: 'Homme normal', value: '33-39%', color: G }, { label: 'Femme normal', value: '24-30%', color: G }, { label: 'Faible', value: '< 33% / < 24%', color: R }], tip: "La masse musculaire diminue avec l'age. L'exercice de resistance et les proteines aident a la maintenir." },
        };
        const e = explanations[explainMetric] || explanations.weight;
        return (
          <div data-testid="explain-popup" onClick={() => setExplainMetric(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.82)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
            <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
              <div onClick={() => setExplainMetric(null)} style={{ position: 'absolute', top: 70, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
              <div style={{ textAlign: 'center', marginBottom: 32, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
                <i className={e.icon} style={{ fontSize: 44, color: e.color }} />
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginTop: 14 }}>{e.title}</div>
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: 32, animation: 'slideUp 0.4s ease 0.2s both' } as any}>{e.desc}</div>
              <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease 0.3s both' } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Valeurs de reference</div>
                {e.ranges.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < e.ranges.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                    <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 14, color: r.color, fontWeight: 800 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'slideUp 0.4s ease 0.4s both' } as any}>
                <i className="ri-lightbulb-line" style={{ fontSize: 20, color: A, flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{e.tip}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
