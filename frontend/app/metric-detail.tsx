import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';
import NoraOverlay, { NoraButton } from '../src/components/dashboard/NoraOverlay';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

const GAUGE_KEYS = new Set(['bmi', 'visceral_fat', 'waist_hip_ratio', 'body_age', 'ideal_weight', 'bone_mass_kg', 'protein_pct', 'skeletal_muscle_pct', 'basal_metabolism', 'recommended_calories', 'subcutaneous_fat_pct', 'trunk_fat_kg']);
const OBJECTIVE_KEYS = new Set(['steps', 'calories', 'distance_km', 'stress_level', 'recovery_score', 'sleep_quality', 'vo2_max']);

const ZONES: Record<string, { min: number; max: number; label: string; color: string }[]> = {
  bmi: [{ min: 0, max: 18.5, label: 'Maigreur', color: '#38BDF8' }, { min: 18.5, max: 25, label: 'Normal', color: '#10B981' }, { min: 25, max: 30, label: 'Surpoids', color: '#F59E0B' }, { min: 30, max: 45, label: 'Obesite', color: '#EF4444' }],
  visceral_fat: [{ min: 0, max: 10, label: 'Normal', color: '#10B981' }, { min: 10, max: 15, label: 'Eleve', color: '#F59E0B' }, { min: 15, max: 25, label: 'Tres eleve', color: '#EF4444' }],
  waist_hip_ratio: [{ min: 0.5, max: 0.85, label: 'Sain', color: '#10B981' }, { min: 0.85, max: 0.95, label: 'Modere', color: '#F59E0B' }, { min: 0.95, max: 1.2, label: 'Eleve', color: '#EF4444' }],
  body_fat_pct: [{ min: 5, max: 20, label: 'Bas', color: '#38BDF8' }, { min: 20, max: 30, label: 'Normal', color: '#10B981' }, { min: 30, max: 45, label: 'Eleve', color: '#F59E0B' }],
};

const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function smooth(pts: { x: number; y: number }[], t = 0.3): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], e = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${b.x + (c.x - a.x) * t},${b.y + (c.y - a.y) * t},${c.x - (e.x - b.x) * t},${c.y - (e.y - b.y) * t},${c.x},${c.y}`;
  }
  return d;
}

/* ── Horizontal Calendar ── */
function HorizontalCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const dates = useMemo(() => {
    const arr: Date[] = [];
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= dim; i++) arr.push(new Date(viewYear, viewMonth, i));
    return arr;
  }, [viewMonth, viewYear]);
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };
  const todayStr = toDateStr(new Date());
  const selStr = toDateStr(selectedDate);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const container = document.getElementById('metric-cal-scroll');
        const el = document.getElementById(`mcal-${selStr}`);
        if (container && el) {
          container.scrollLeft = Math.max(0, el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2);
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [selStr, viewMonth, viewYear]);

  return (
    <div data-testid="metric-horizontal-calendar" style={{ width: '100%', marginTop: 16 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 } as any}>
        <div data-testid="cal-prev" onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 16, color: '#FFF' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', textTransform: 'capitalize', letterSpacing: 0.5, minWidth: 140, textAlign: 'center' }}>{MONTHS_FR[viewMonth]} {viewYear}</div>
        <div data-testid="cal-next" onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#FFF' }} />
        </div>
      </div>
      <div id="metric-cal-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' } as any}>
        {dates.map(d => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
          const isSel = ds === selStr;
          const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
          return (
            <div key={ds} id={`mcal-${ds}`} data-testid={`mcal-day-${ds}`} onClick={() => onSelect(d)} style={{
              minWidth: 48, padding: '8px 4px 10px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', flexShrink: 0,
              background: isSel ? 'rgba(255,255,255,0.18)' : isToday ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: isSel ? '1.5px solid rgba(255,255,255,0.35)' : isToday ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid transparent',
              boxShadow: isSel ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.25s ease',
            } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isSel ? '#FFF' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{DAYS_SHORT[dayIdx]}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: isSel ? '#FFF' : isToday ? '#FFF' : 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{d.getDate()}</div>
              {isToday && !isSel && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#F59E0B', margin: '4px auto 0' } as any} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MetricDetailScreen() {
  const params = useLocalSearchParams<{ key: string; beneficiaryId?: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const webBeneficiaryId = (() => { try { if (typeof window !== 'undefined' && window.location?.search) return new URLSearchParams(window.location.search).get('beneficiaryId') || ''; } catch {} return ''; })();
  const key = params.key;
  const beneficiaryId = params.beneficiaryId || webBeneficiaryId || undefined;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7j');
  const [sel, setSel] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<any>(null);
  const [thEdit, setThEdit] = useState(false);
  const [thMin, setThMin] = useState('');
  const [thMax, setThMax] = useState('');
  const [thSaving, setThSaving] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showNoraMetric, setShowNoraMetric] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartReady, setChartReady] = useState(false);
  const isReadonly = !!beneficiaryId;
  const chartRef = useRef<HTMLDivElement>(null);

  const load = async (r: string) => {
    setLoading(true); setChartReady(false);
    try {
      const historyUrl = beneficiaryId
        ? `/api/guardian/beneficiary/${beneficiaryId}/metric-history/${key}?period=${r}`
        : `/api/health/metric-history/${key}?period=${r}`;
      const [d, th] = await Promise.all([
        apiFetch(historyUrl, {}, token),
        beneficiaryId ? Promise.resolve(null) : apiFetch(`/api/health/thresholds/${key}`, {}, token).catch(() => null),
      ]);
      setData(d);
      if (th) { setThreshold(th); setThMin(th.min_val != null ? String(th.min_val) : ''); setThMax(th.max_val != null ? String(th.max_val) : ''); }
    } catch {} finally { setLoading(false); setTimeout(() => setChartReady(true), 50); }
  };

  useEffect(() => { load(range); }, [key, token]);
  const changeRange = (r: string) => { setRange(r); setSel(null); load(r); };

  const handleDateSelect = useCallback((d: Date) => {
    setSelectedDate(d);
    const ds = toDateStr(d);
    if (data?.history) {
      const idx = data.history.findIndex((h: any) => h.date === ds);
      if (idx >= 0) setSel(idx);
    }
  }, [data]);

  if (Platform.OS !== 'web') return <NativePageView path="/metric-detail" />;
  if (loading) return <FullScreenLoader />;

  const m = data?.meta || {};
  const history = data?.history || [];
  const stats = data?.stats || {};
  const color = m.color || '#A78BFA';
  const isGauge = GAUGE_KEYS.has(key || '');
  const isObjective = OBJECTIVE_KEYS.has(key || '');
  const sliced = history;
  const vals = sliced.map((h: any) => h.value);
  const currentVal = vals.length ? vals[vals.length - 1] : '--';
  const avg = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '--';
  const mn = vals.length ? Math.min(...vals) : 0;
  const mx = vals.length ? Math.max(...vals) : 1;
  const nMin = m.normal_min;
  const nMax = m.normal_max;
  const isNormal = nMin != null ? (currentVal >= nMin && currentVal <= nMax) : true;
  const selData = sel !== null && sliced[sel] ? sliced[sel] : null;
  const graphType = m.graph_type || 'smooth_curve';
  const isBP = graphType === 'bp_dual';

  /* ── Chart dimensions ── */
  const W = 360, H = 200, padL = 36, padR = 8, padT = 14, padB = 14;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const rg = mx - mn || 1;
  const dMn = mn - rg * 0.1, dMx = mx + rg * 0.1, dRg = dMx - dMn || 1;
  const toX = (i: number) => padL + (i / Math.max(sliced.length - 1, 1)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - dMn) / dRg) * chartH;
  const pts = sliced.map((h: any, i: number) => ({ x: toX(i), y: toY(h.value) }));

  /* ── Touch/click handler for chart ── */
  const handleChartInteraction = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const ratio = x / rect.width;
    const idx = Math.round(ratio * (sliced.length - 1));
    if (idx >= 0 && idx < sliced.length) setSel(idx);
  };

  const animDelay = chartReady ? '0s' : '0.3s';

  const renderChart = () => {
    if (!sliced.length) return <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>Aucune donnee pour cette periode</div>;

    return (
      <div ref={chartRef} onClick={handleChartInteraction} onTouchMove={handleChartInteraction}
        style={{ cursor: 'crosshair', touchAction: 'none', position: 'relative' } as any}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const yVal = dMx - (dMx - dMn) * p;
            const yPos = padT + chartH * p;
            return <g key={i}>
              <line x1={padL} y1={yPos} x2={W - padR} y2={yPos} stroke="rgba(0,0,0,0.04)" strokeDasharray="3,3" />
              <text x={padL - 6} y={yPos + 3} textAnchor="end" fill="#9CA3AF" fontSize="8" fontWeight="600">{Number.isInteger(yVal) ? yVal : yVal.toFixed(1)}</text>
            </g>;
          })}

          {/* Normal zone */}
          {nMin != null && !isBP && (
            <rect x={padL} y={toY(nMax)} width={chartW} height={Math.max(1, Math.abs(toY(nMin) - toY(nMax)))} fill="rgba(16,185,129,0.06)" rx={4} />
          )}

          {isBP ? (
            sliced.map((h: any, i: number) => {
              const bw = Math.max(6, chartW / sliced.length * 0.35);
              const sys = h.systolic || h.value, dia = h.diastolic || h.value * 0.62;
              const sY = toY(sys), dY = toY(dia), baseY = padT + chartH;
              const isSel = sel === i;
              return <g key={i} style={{ opacity: chartReady ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.03}s` }}>
                <rect x={toX(i) - bw - 1} y={sY} width={bw} height={Math.max(2, baseY - sY)} rx={4} fill="#8B5CF6" opacity={isSel ? 0.9 : 0.35} />
                <rect x={toX(i) + 1} y={dY} width={bw} height={Math.max(2, baseY - dY)} rx={4} fill="#C4B5FD" opacity={isSel ? 0.9 : 0.35} />
                {isSel && <>
                  <line x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + chartH} stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.3} />
                  <rect x={toX(i) - 28} y={sY - 20} width={56} height={18} rx={6} fill="#111" />
                  <text x={toX(i)} y={sY - 8} fill="#FFF" fontSize="9" fontWeight="800" textAnchor="middle">{sys}/{dia}</text>
                </>}
              </g>;
            })
          ) : graphType === 'bars' || graphType === 'bars_threshold' ? (
            sliced.map((h: any, i: number) => {
              const bw = Math.max(6, chartW / sliced.length * 0.65);
              const barY = toY(h.value), baseY = padT + chartH;
              const isSel = sel === i;
              const barH = Math.max(2, baseY - barY);
              return <g key={i}>
                <rect x={toX(i) - bw / 2} y={baseY} width={bw} height={0} rx={5} fill={color} opacity={isSel ? 0.9 : 0.4}>
                  <animate attributeName="y" from={baseY} to={barY} dur="0.5s" fill="freeze" begin={`${i * 0.04}s`} calcMode="spline" keySplines="0.25 0.1 0.25 1" />
                  <animate attributeName="height" from="0" to={barH} dur="0.5s" fill="freeze" begin={`${i * 0.04}s`} calcMode="spline" keySplines="0.25 0.1 0.25 1" />
                </rect>
                {isSel && <>
                  <line x1={toX(i)} y1={padT} x2={toX(i)} y2={baseY} stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.3} />
                  <rect x={toX(i) - 24} y={barY - 22} width={48} height={18} rx={6} fill="#111" />
                  <text x={toX(i)} y={barY - 10} fill="#FFF" fontSize="9" fontWeight="800" textAnchor="middle">{typeof h.value === 'number' && h.value > 100 ? Math.round(h.value) : h.value}</text>
                  <circle cx={toX(i)} cy={barY} r={4} fill="#FFF" stroke={color} strokeWidth={2} />
                </>}
              </g>;
            })
          ) : graphType === 'scatter' ? (
            <>
              {pts.length >= 2 && <path d={smooth(pts, 0.2)} fill="none" stroke={color} strokeWidth={1.5} opacity={0.15} strokeDasharray="4,4" />}
              {sliced.map((h: any, i: number) => {
                const isSel = sel === i;
                return <g key={i} style={{ opacity: chartReady ? 1 : 0, transition: `opacity 0.3s ease ${i * 0.04}s` }}>
                  <circle cx={toX(i)} cy={toY(h.value)} r={isSel ? 8 : 4.5} fill={isSel ? '#FFF' : color} stroke={isSel ? color : 'none'} strokeWidth={2.5} opacity={isSel ? 1 : 0.5} filter={isSel ? 'url(#glow)' : undefined} />
                  {isSel && <>
                    <line x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + chartH} stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.3} />
                    <rect x={toX(i) - 22} y={toY(h.value) - 24} width={44} height={18} rx={6} fill="#111" />
                    <text x={toX(i)} y={toY(h.value) - 12} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{h.value}</text>
                  </>}
                </g>;
              })}
            </>
          ) : (
            <>
              {/* Area fill with animation */}
              {pts.length >= 2 && (
                <>
                  <path d={`${smooth(pts)}L${pts[pts.length - 1].x},${padT + chartH}L${pts[0].x},${padT + chartH}Z`} fill={`url(#grad-${key})`} style={{ opacity: chartReady ? 1 : 0, transition: 'opacity 0.6s ease 0.2s' }} />
                  <path d={smooth(pts)} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
                    strokeDasharray={chartW * 3} strokeDashoffset={chartReady ? 0 : chartW * 3}
                    style={{ transition: 'stroke-dashoffset 1.2s ease 0.1s' }} />
                </>
              )}
              {/* Data points */}
              {sliced.length <= 50 && sliced.map((h: any, i: number) => {
                const isSel = sel === i;
                return <g key={i}>
                  <circle cx={toX(i)} cy={toY(h.value)} r={isSel ? 7 : 3.5} fill={isSel ? '#FFF' : color} stroke={isSel ? color : 'none'} strokeWidth={2.5}
                    style={{ opacity: chartReady ? 1 : 0, transition: `opacity 0.3s ease ${0.3 + i * 0.02}s, r 0.15s ease` }} filter={isSel ? 'url(#glow)' : undefined} />
                  {isSel && <>
                    <line x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + chartH} stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.3} />
                    <rect x={toX(i) - 24} y={toY(h.value) - 26} width={48} height={20} rx={7} fill="#111" />
                    <text x={toX(i)} y={toY(h.value) - 13} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{typeof h.value === 'number' ? (Number.isInteger(h.value) ? h.value : h.value.toFixed(1)) : h.value}</text>
                  </>}
                </g>;
              })}
            </>
          )}
        </svg>
      </div>
    );
  };

  /* ── Gauge ── */
  const renderGauge = () => {
    const zones = ZONES[key || ''];
    const gMin = zones ? zones[0].min : (nMin != null ? nMin * 0.7 : mn * 0.8);
    const gMax = zones ? zones[zones.length - 1].max : (nMax != null ? nMax * 1.3 : mx * 1.2);
    const gRange = gMax - gMin || 1;
    const val = typeof currentVal === 'number' ? currentVal : parseFloat(String(currentVal)) || 0;
    const clamped = Math.max(gMin, Math.min(gMax, val));
    const pct = (clamped - gMin) / gRange;
    const cx = 150, cy = 130, r = 105, sw = 14;
    const angle = Math.PI * (1 - pct);
    const dx = cx + r * Math.cos(angle), dy = cy - r * Math.sin(angle);
    let zoneColor = color, zoneLabel = '';
    if (zones) { for (const z of zones) { if (val >= z.min && val < z.max) { zoneColor = z.color; zoneLabel = z.label; break; } } if (val >= zones[zones.length - 1].min) { zoneColor = zones[zones.length - 1].color; zoneLabel = zones[zones.length - 1].label; } }
    else if (nMin != null) { zoneColor = isNormal ? '#10B981' : '#EF4444'; zoneLabel = isNormal ? 'Normal' : val < nMin ? 'Bas' : 'Eleve'; }
    const arcPath = (a1: number, a2: number) => { const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1), x2 = cx + r * Math.cos(a2), y2 = cy - r * Math.sin(a2); return `M${x1},${y1} A${r},${r} 0 ${Math.abs(a1 - a2) > Math.PI ? 1 : 0} 1 ${x2},${y2}`; };
    return (
      <div data-testid="gauge-container" style={{ padding: '24px 16px 20px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14, textAlign: 'center' } as any}>
        <svg width="100%" viewBox="0 0 300 145" style={{ maxWidth: 300, margin: '0 auto', display: 'block' }}>
          <path d={arcPath(Math.PI, 0)} fill="none" stroke="#E5E7EB" strokeWidth={sw} strokeLinecap="round" />
          {zones ? zones.map((z, i) => <path key={i} d={arcPath(Math.PI * (1 - (Math.max(z.min, gMin) - gMin) / gRange), Math.PI * (1 - (Math.min(z.max, gMax) - gMin) / gRange))} fill="none" stroke={z.color} strokeWidth={sw} opacity={0.3} />) : nMin != null && <path d={arcPath(Math.PI * (1 - (nMin - gMin) / gRange), Math.PI * (1 - (nMax - gMin) / gRange))} fill="none" stroke="#10B981" strokeWidth={sw} opacity={0.3} />}
          <path d={arcPath(Math.PI, angle)} fill="none" stroke={zoneColor} strokeWidth={sw} strokeLinecap="round" />
          <circle cx={dx} cy={dy} r={9} fill="#FFF" stroke={zoneColor} strokeWidth={3} />
          <text x={cx} y={cy - 18} textAnchor="middle" fill="#111" fontSize="34" fontWeight="900">{typeof currentVal === 'number' ? (Number.isInteger(currentVal) ? currentVal : currentVal.toFixed(1)) : currentVal}</text>
          <text x={cx} y={cy + 2} textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="600">{m.unit}</text>
        </svg>
        {zoneLabel && <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 99, background: `${zoneColor}18`, border: `1px solid ${zoneColor}35`, fontSize: 12, fontWeight: 700, color: zoneColor, marginTop: 6 }}>{zoneLabel}</div>}
      </div>
    );
  };

  const renderSparkline = () => {
    if (sliced.length < 2) return null;
    const sW = 400, sH = 50;
    const sPts = sliced.map((h: any, i: number) => ({ x: (i / Math.max(sliced.length - 1, 1)) * sW, y: 4 + (sH - 8) - ((h.value - mn) / (rg || 1)) * (sH - 8) }));
    return (
      <div style={{ padding: '14px 16px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 10 }}>Evolution recente</div>
        <svg width="100%" viewBox={`0 0 ${sW} ${sH}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs><linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.12" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d={`${smooth(sPts)}L${sPts[sPts.length - 1].x},${sH}L${sPts[0].x},${sH}Z`} fill="url(#spark-fill)" />
          <path d={smooth(sPts)} fill="none" stroke={color} strokeWidth={2} />
          <circle cx={sPts[sPts.length - 1].x} cy={sPts[sPts.length - 1].y} r={4} fill={color} />
        </svg>
        {stats.trend != null && <div style={{ fontSize: 12, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B', marginTop: 8 }}>Tendance : {stats.trend > 0 ? '+' : ''}{stats.trend} sur la periode</div>}
      </div>
    );
  };

  const defaultGoals: Record<string, { value: string; label: string }> = {
    steps: { value: '6000', label: 'pas/jour' }, calories: { value: '300', label: 'kcal/jour' },
    distance_km: { value: '4', label: 'km/jour' }, stress_level: { value: '40', label: 'maximum /100' },
    recovery_score: { value: '75', label: 'minimum /100' }, sleep_quality: { value: '80', label: 'minimum %' },
    vo2_max: { value: '30', label: 'ml/kg/min' },
  };

  return (
    <div data-testid="metric-detail-screen" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: '#FFF' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 220 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 20px', maxWidth: 480, margin: '0 auto' } as any}>
            <div data-testid="back-btn" onClick={() => {
              if (isReadonly && beneficiaryId) router.push({ pathname: '/health-readonly' as any, params: { beneficiaryId } });
              else router.push('/(tabs)/health' as any);
            }} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 } as any}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>{m.title || key}</div>
              {!isGauge && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 } as any}>
                    <span data-testid="current-value" style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{isBP && selData ? `${selData.systolic}/${selData.diastolic}` : selData ? selData.value : currentVal}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{m.unit}</span>
                  </div>
                  {nMin != null && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: isNormal ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', marginTop: 6 } as any}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isNormal ? '#10B981' : '#EF4444' }}>{isNormal ? 'Normal' : currentVal < nMin ? 'Bas' : 'Eleve'}</span>
                    </div>
                  )}
                  {stats.trend != null && <div style={{ fontSize: 12, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B', marginTop: 4 }}>{stats.trend > 0 ? '+' : ''}{stats.trend} sur {range}</div>}
                </>
              )}
            </div>
            {/* Horizontal Calendar */}
            <HorizontalCalendar selectedDate={selectedDate} onSelect={handleDateSelect} />
          </div>
        </div>

        {/* WHITE CONTENT */}
        <div style={{ padding: '24px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-16px auto 0', width: '100%' } as any}>

          <NoraButton label={`Analyse ${m.title?.toLowerCase() || key}`} sublabel={`Analyse par Nora de votre ${m.title?.toLowerCase() || key}`} onClick={() => setShowNoraMetric(true)} />

          {isGauge && <>{renderGauge()}{renderSparkline()}</>}

          {!isGauge && (
            <>
              {/* Period selector (no date picker) */}
              <div data-testid="period-selector" style={{ display: 'flex', gap: 6, marginBottom: 14 } as any}>
                {['24h', '7j', '30j', '90j'].map(r => (
                  <div key={r} data-testid={`period-${r}`} onClick={() => changeRange(r)} style={{ padding: '8px 14px', borderRadius: 10, background: range === r ? '#111' : '#F4F4F5', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: range === r ? '#FFF' : '#9CA3AF', transition: 'all 0.2s' } as any}>{r}</div>
                ))}
              </div>

              {/* Chart */}
              <div data-testid="chart-card" style={{ padding: '16px 12px 10px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14, overflow: 'hidden' } as any}>
                {renderChart()}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px 0 36px' } as any}>
                  {sliced.filter((_: any, i: number) => { const step = Math.max(1, Math.floor(sliced.length / 5)); return i === 0 || i === sliced.length - 1 || i % step === 0; }).map((h: any, i: number) => <span key={i} style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{h.label}</span>)}
                </div>
                {isBP && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '8px 0 2px' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5CF6' } as any} /><span style={{ fontSize: 10, color: '#6B7280' }}>Systolique</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#C4B5FD' } as any} /><span style={{ fontSize: 10, color: '#6B7280' }}>Diastolique</span></div>
                  </div>
                )}
              </div>

              {/* Selected data point tooltip */}
              {selData && (
                <div data-testid="selected-point" style={{ padding: '14px 18px', borderRadius: 18, background: `${color}08`, marginBottom: 14, borderLeft: `3px solid ${color}`, animation: 'fadeSlideIn 0.2s ease' } as any}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{selData.label || selData.date}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 } as any}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#111' }}>{isBP ? `${selData.systolic}/${selData.diastolic}` : selData.value}</span>
                    <span style={{ fontSize: 14, color: '#9CA3AF' }}>{m.unit}</span>
                    {nMin != null && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: selData.value >= nMin && selData.value <= nMax ? '#10B981' : '#EF4444' }}>
                        {selData.value >= nMin && selData.value <= nMax ? 'Dans la norme' : selData.value < nMin ? 'Sous la norme' : 'Au-dessus'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div data-testid="stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
                {[
                  { label: 'Moyenne', value: avg, icon: 'ri-bar-chart-box-line', c: color },
                  { label: 'Plus bas', value: vals.length ? (mn % 1 === 0 ? mn : mn.toFixed(1)) : '--', icon: 'ri-arrow-down-line', c: '#38BDF8' },
                  { label: 'Plus haut', value: vals.length ? (mx % 1 === 0 ? mx : mx.toFixed(1)) : '--', icon: 'ri-arrow-up-line', c: '#EF4444' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '14px 10px', borderRadius: 16, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className={s.icon} style={{ fontSize: 16, color: s.c, display: 'block', marginBottom: 6 }} />
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#111' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Explain */}
          <div data-testid="explain-section" onClick={() => setShowExplain(!showExplain)} style={{ padding: '16px 18px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14, cursor: 'pointer' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                <i className="ri-book-open-line" style={{ fontSize: 16, color }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Qu'est-ce que {(m.title || '').toLowerCase()} ?</span>
              </div>
              <i className={showExplain ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: '#9CA3AF' }} />
            </div>
            {showExplain && (
              <div style={{ marginTop: 12 } as any}>
                <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 10 }}>{m.explain || ''}</div>
                {nMin != null && (
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(56,189,248,0.08)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Min normal</div><div style={{ fontSize: 16, fontWeight: 900, color: '#38BDF8' }}>{nMin} <span style={{ fontSize: 9, color: '#9CA3AF' }}>{m.unit}</span></div></div>
                    <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Zone ideale</div><div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>{nMin}-{nMax}</div></div>
                    <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Max normal</div><div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444' }}>{nMax} <span style={{ fontSize: 9, color: '#9CA3AF' }}>{m.unit}</span></div></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Objectives (sport metrics) OR Alert Thresholds (health metrics) */}
          {!isReadonly && isObjective && (() => {
            const goal = defaultGoals[key || ''];
            return (
              <div data-testid="objectives-section" style={{ padding: '16px 18px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                  <i className="ri-flag-line" style={{ fontSize: 16, color: '#10B981' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Objectif journalier</span>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, lineHeight: 1.5 }}>Fixez un objectif personnalise pour suivre votre progression quotidienne.</div>
                {!thEdit ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 12 } as any}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className="ri-trophy-line" style={{ fontSize: 20, color: '#10B981' }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 }}>Objectif</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{threshold?.goal || threshold?.max_val || goal?.value || '--'} <span style={{ fontSize: 12, color: '#9CA3AF' }}>{goal?.label || m.unit}</span></div>
                      </div>
                      {typeof currentVal === 'number' && (
                        <div style={{ textAlign: 'center' } as any}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: currentVal >= parseFloat(threshold?.goal || threshold?.max_val || goal?.value || '0') ? '#10B981' : '#F59E0B' }}>
                            {currentVal >= parseFloat(threshold?.goal || threshold?.max_val || goal?.value || '0') ? 'Atteint' : 'En cours'}
                          </div>
                          <div style={{ fontSize: 9, color: '#9CA3AF' }}>{Math.round((currentVal / parseFloat(threshold?.goal || threshold?.max_val || goal?.value || '1')) * 100)}%</div>
                        </div>
                      )}
                    </div>
                    <div onClick={() => { setThEdit(true); setThMax(threshold?.goal || threshold?.max_val?.toString() || goal?.value || ''); }} style={{ padding: '12px', borderRadius: 999, background: '#FFF', border: '1px solid #E5E7EB', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6B7280' } as any}>Modifier l'objectif</div>
                  </>
                ) : (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: 6 }}>Nouvel objectif ({goal?.label || m.unit})</div>
                    <input type="number" step="1" value={thMax} onChange={(e: any) => setThMax(e.target.value)} placeholder={goal?.value || '0'} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#FFF', border: '1px solid #E5E7EB', color: '#111', fontSize: 20, fontWeight: 800, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', textAlign: 'center', marginBottom: 12 } as any} />
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div onClick={async () => { setThSaving(true); try { await apiFetch('/api/health/thresholds', { method: 'POST', body: JSON.stringify({ metric_id: key, goal: thMax ? parseFloat(thMax) : null, max_val: thMax ? parseFloat(thMax) : null }) }, token); setThreshold({ metric_id: key, goal: thMax ? parseFloat(thMax) : null, max_val: thMax ? parseFloat(thMax) : null }); setThEdit(false); } catch {} finally { setThSaving(false); } }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: '#10B981', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF' } as any}>{thSaving ? '...' : 'Sauvegarder'}</div>
                      <div onClick={() => setThEdit(false)} style={{ padding: '12px 16px', borderRadius: 999, background: '#F4F4F5', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9CA3AF' } as any}>Annuler</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {!isReadonly && !isObjective && (
            <div data-testid="thresholds-section" style={{ padding: '16px 18px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                  <i className="ri-alarm-warning-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Seuils d'alerte</span>
                </div>
                {!thEdit && <div data-testid="configure-threshold-btn" onClick={() => {
                  setThEdit(true);
                  const defs: Record<string, { min: string; max: string }> = { heart_rate: { min: '50', max: '100' }, spo2: { min: '92', max: '' }, blood_pressure: { min: '90', max: '140' }, temperature: { min: '35.5', max: '38.5' }, hrv: { min: '20', max: '' } };
                  const d = defs[key || '']; if (d) { if (!thMin) setThMin(d.min); if (!thMax) setThMax(d.max); } else { if (!thMin && nMin != null) setThMin(String(nMin)); if (!thMax && nMax != null) setThMax(String(nMax)); }
                }} style={{ padding: '6px 14px', borderRadius: 999, background: '#FFF', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#111' } as any}>{threshold?.min_val != null ? 'Modifier' : 'Configurer'}</div>}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>Vos gardiens seront alertes si cette donnee depasse les seuils definis.</div>
              {!thEdit ? (
                threshold?.min_val != null || threshold?.max_val != null ? (
                  <div style={{ display: 'flex', gap: 10 } as any}>
                    {threshold.min_val != null && <div style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(56,189,248,0.06)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Seuil bas</div><div style={{ fontSize: 22, fontWeight: 900, color: '#38BDF8' }}>{threshold.min_val} <span style={{ fontSize: 10, color: '#9CA3AF' }}>{m.unit}</span></div></div>}
                    {threshold.max_val != null && <div style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.06)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Seuil haut</div><div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{threshold.max_val} <span style={{ fontSize: 10, color: '#9CA3AF' }}>{m.unit}</span></div></div>}
                  </div>
                ) : <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: '#9CA3AF' }}>Aucun seuil configure</div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 } as any}>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', marginBottom: 4 }}>Seuil bas</div><input type="number" step="0.1" value={thMin} onChange={(e: any) => setThMin(e.target.value)} placeholder="Min" style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#FFF', border: '1px solid #E5E7EB', color: '#111', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: 4 }}>Seuil haut</div><input type="number" step="0.1" value={thMax} onChange={(e: any) => setThMax(e.target.value)} placeholder="Max" style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#FFF', border: '1px solid #E5E7EB', color: '#111', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div data-testid="save-threshold-btn" onClick={async () => { setThSaving(true); try { await apiFetch('/api/health/thresholds', { method: 'POST', body: JSON.stringify({ metric_id: key, min_val: thMin ? parseFloat(thMin) : null, max_val: thMax ? parseFloat(thMax) : null }) }, token); setThreshold({ metric_id: key, min_val: thMin ? parseFloat(thMin) : null, max_val: thMax ? parseFloat(thMax) : null }); setThEdit(false); } catch {} finally { setThSaving(false); } }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: color, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF' } as any}>{thSaving ? '...' : 'Sauvegarder'}</div>
                    <div onClick={() => setThEdit(false)} style={{ padding: '12px 16px', borderRadius: 999, background: '#F4F4F5', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#9CA3AF' } as any}>Annuler</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showNoraMetric && <NoraOverlay token={token} endpoint={`/api/nora/page-analysis?context=${key}`} title={`Analyse ${m.title?.toLowerCase()}`} subtitle={`Analyse detaillee de votre ${m.title?.toLowerCase()}`} onClose={() => setShowNoraMetric(false)} />}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}` }} />
    </div>
  );
}
