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
  const W = 340, H = 220, padL = 0, padR = 0, padT = 30, padB = 40;
  const chartW = W, chartH = H - padT - padB;
  const rg = mx - mn || 1;
  // For bar charts, always start Y from 0 so bars are proportional
  const isBarType = (m.graph_type === 'bars' || m.graph_type === 'bars_threshold');
  const dMn = isBarType ? 0 : Math.max(0, mn - rg * 0.05);
  const dMx = isBarType ? mx * 1.12 : mx + rg * 0.08;
  const dRg = dMx - dMn || 1;
  const barGap = sliced.length > 0 ? chartW / sliced.length : chartW;
  const barW = Math.min(36, Math.max(12, barGap * 0.55));
  const toBarX = (i: number) => barGap * i + barGap / 2;
  const toY = (v: number) => padT + chartH - ((v - dMn) / dRg) * chartH;
  const toCurveX = (i: number) => padL + 20 + (i / Math.max(sliced.length - 1, 1)) * (chartW - 40);
  const pts = sliced.map((h: any, i: number) => ({ x: toCurveX(i), y: toY(h.value) }));

  /* ── Clean Y-axis labels (rounded) ── */
  const niceStep = (range: number, ticks: number) => {
    const rough = range / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const res = rough / mag;
    const nice = res <= 1.5 ? 1 : res <= 3 ? 2 : res <= 7 ? 5 : 10;
    return nice * mag;
  };
  const yStep = niceStep(dRg, 4);
  const yStart = Math.floor(dMn / yStep) * yStep;
  const yLabels: { v: number; y: number }[] = [];
  for (let v = yStart; v <= dMx + yStep * 0.1; v += yStep) {
    if (v >= dMn - yStep * 0.1) yLabels.push({ v: Math.round(v * 100) / 100, y: toY(v) });
  }

  /* ── Day labels ── */
  const DAY_NAMES_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const getDayLabel = (dateStr: string) => {
    try { const d = new Date(dateStr + 'T12:00:00'); return DAY_NAMES_SHORT[d.getDay()]; } catch { return ''; }
  };

  /* ── Touch/click handler for chart ── */
  const handleChartInteraction = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const ratio = x / rect.width;
    const idx = Math.round(ratio * (sliced.length - 1));
    if (idx >= 0 && idx < sliced.length) setSel(idx);
  };

  const renderChart = () => {
    if (!sliced.length) return <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>Aucune donnee pour cette periode</div>;

    const isBarChart = graphType === 'bars' || graphType === 'bars_threshold';

    return (
      <div ref={chartRef} onClick={handleChartInteraction} onTouchMove={handleChartInteraction}
        style={{ touchAction: 'none', position: 'relative', cursor: 'default' } as any}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <defs>
            <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id={`bar-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Y-axis labels — clean integers, right-aligned, no grid clutter */}
          {yLabels.map((yl, i) => (
            <g key={i}>
              <line x1={0} y1={yl.y} x2={W} y2={yl.y} stroke="rgba(0,0,0,0.04)" />
              <text x={W - 4} y={yl.y - 6} textAnchor="end" fill="#C8C8CC" fontSize="10" fontWeight="500">
                {Number.isInteger(yl.v) ? yl.v.toLocaleString() : yl.v.toFixed(1)}
              </text>
            </g>
          ))}

          {isBP ? (
            /* ── BLOOD PRESSURE DUAL BARS ── */
            sliced.map((h: any, i: number) => {
              const bw = barW * 0.45;
              const sys = h.systolic || h.value, dia = h.diastolic || h.value * 0.62;
              const sY = toY(sys), dY = toY(dia), baseY = padT + chartH;
              const cx = toBarX(i);
              const isSel = sel === i;
              return <g key={i}>
                <rect x={cx - bw - 2} y={sY} width={bw} height={Math.max(2, baseY - sY)} rx={bw / 2} fill="#8B5CF6" opacity={isSel ? 1 : 0.5}>
                  <animate attributeName="height" from="0" to={Math.max(2, baseY - sY)} dur="0.5s" fill="freeze" begin={`${i * 0.06}s`} />
                  <animate attributeName="y" from={baseY} to={sY} dur="0.5s" fill="freeze" begin={`${i * 0.06}s`} />
                </rect>
                <rect x={cx + 2} y={dY} width={bw} height={Math.max(2, baseY - dY)} rx={bw / 2} fill="#C4B5FD" opacity={isSel ? 1 : 0.5}>
                  <animate attributeName="height" from="0" to={Math.max(2, baseY - dY)} dur="0.5s" fill="freeze" begin={`${i * 0.06}s`} />
                  <animate attributeName="y" from={baseY} to={dY} dur="0.5s" fill="freeze" begin={`${i * 0.06}s`} />
                </rect>
                {isSel && <><rect x={cx - 26} y={sY - 22} width={52} height={18} rx={9} fill="#111" /><text x={cx} y={sY - 10} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{sys}/{dia}</text></>}
                <text x={cx} y={H - 10} textAnchor="middle" fill={isSel ? '#111' : '#B0B0B4'} fontSize="10" fontWeight={isSel ? '800' : '500'}>{getDayLabel(h.date)}</text>
                <text x={cx} y={H - 0} textAnchor="middle" fill="#D0D0D4" fontSize="8">{h.label}</text>
              </g>;
            })
          ) : isBarChart ? (
            /* ── BAR CHART (Steps, Calories, etc.) ── */
            sliced.map((h: any, i: number) => {
              const barH = Math.max(3, ((h.value - dMn) / dRg) * chartH);
              const barY = padT + chartH - barH;
              const cx = toBarX(i);
              const isSel = sel === i;
              return <g key={i}>
                <rect x={cx - barW / 2} y={padT + chartH} width={barW} height={0} rx={barW / 2.5} fill={isSel ? color : `url(#bar-grad-${key})`} opacity={isSel ? 1 : 0.7}>
                  <animate attributeName="y" from={padT + chartH} to={barY} dur="0.6s" fill="freeze" begin={`${i * 0.07}s`} calcMode="spline" keySplines="0.34 1.56 0.64 1" />
                  <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" begin={`${i * 0.07}s`} calcMode="spline" keySplines="0.34 1.56 0.64 1" />
                </rect>
                {isSel && <>
                  <rect x={cx - 28} y={barY - 24} width={56} height={20} rx={10} fill="#111" />
                  <text x={cx} y={barY - 11} fill="#FFF" fontSize="11" fontWeight="800" textAnchor="middle">{typeof h.value === 'number' && h.value >= 100 ? Math.round(h.value).toLocaleString() : h.value}</text>
                </>}
                <text x={cx} y={H - 10} textAnchor="middle" fill={isSel ? '#111' : '#B0B0B4'} fontSize="10" fontWeight={isSel ? '800' : '500'}>{getDayLabel(h.date)}</text>
                <text x={cx} y={H - 0} textAnchor="middle" fill="#D0D0D4" fontSize="8">{h.label}</text>
              </g>;
            })
          ) : graphType === 'scatter' ? (
            /* ── SCATTER ── */
            <>
              {pts.length >= 2 && <path d={smooth(pts, 0.2)} fill="none" stroke={color} strokeWidth={1.5} opacity={0.12} strokeDasharray="4,4" />}
              {sliced.map((h: any, i: number) => {
                const isSel = sel === i;
                return <g key={i}>
                  <circle cx={pts[i].x} cy={pts[i].y} r={isSel ? 8 : 5} fill={isSel ? '#FFF' : color} stroke={isSel ? color : 'none'} strokeWidth={2.5} opacity={isSel ? 1 : 0.55} />
                  {isSel && <><rect x={pts[i].x - 22} y={pts[i].y - 26} width={44} height={20} rx={10} fill="#111" /><text x={pts[i].x} y={pts[i].y - 13} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{h.value}</text></>}
                  <text x={pts[i].x} y={H - 10} textAnchor="middle" fill={isSel ? '#111' : '#B0B0B4'} fontSize="10" fontWeight={isSel ? '800' : '500'}>{getDayLabel(h.date)}</text>
                </g>;
              })}
            </>
          ) : (
            /* ── SMOOTH CURVE (Heart rate, Temperature, etc.) ── */
            <>
              {pts.length >= 2 && (
                <>
                  <path d={`${smooth(pts)}L${pts[pts.length - 1].x},${padT + chartH}L${pts[0].x},${padT + chartH}Z`} fill={`url(#grad-${key})`} style={{ opacity: chartReady ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }} />
                  <path d={smooth(pts)} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
                    strokeDasharray={W * 3} strokeDashoffset={chartReady ? 0 : W * 3}
                    style={{ transition: 'stroke-dashoffset 1s ease 0.1s' }} />
                </>
              )}
              {sliced.map((h: any, i: number) => {
                const isSel = sel === i;
                return <g key={i}>
                  <circle cx={pts[i].x} cy={pts[i].y} r={isSel ? 7 : 3.5} fill={isSel ? '#FFF' : color} stroke={isSel ? color : 'none'} strokeWidth={2.5}
                    style={{ opacity: chartReady ? 1 : 0, transition: `opacity 0.3s ease ${0.3 + i * 0.05}s` }} />
                  {isSel && <><rect x={pts[i].x - 24} y={pts[i].y - 26} width={48} height={20} rx={10} fill="#111" /><text x={pts[i].x} y={pts[i].y - 13} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{typeof h.value === 'number' ? (Number.isInteger(h.value) ? h.value : h.value.toFixed(1)) : h.value}</text></>}
                  <text x={pts[i].x} y={H - 10} textAnchor="middle" fill={isSel ? '#111' : '#B0B0B4'} fontSize="10" fontWeight={isSel ? '800' : '500'}>{getDayLabel(h.date)}</text>
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
              <div data-testid="chart-card" style={{ padding: '8px 12px 4px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14, overflow: 'hidden' } as any}>
                {renderChart()}
                {isBP && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '4px 0 6px' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5CF6' } as any} /><span style={{ fontSize: 10, color: '#6B7280' }}>Systolique</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#C4B5FD' } as any} /><span style={{ fontSize: 10, color: '#6B7280' }}>Diastolique</span></div>
                  </div>
                )}
              </div>

              {/* Selected data point — rich card */}
              {selData && (() => {
                const selVal = selData.value;
                const inNorm = nMin != null ? (selVal >= nMin && selVal <= nMax) : true;
                const normColor = nMin != null ? (inNorm ? '#10B981' : selVal < nMin ? '#38BDF8' : '#EF4444') : '#10B981';
                const normLabel = nMin != null ? (inNorm ? 'Dans la norme' : selVal < nMin ? 'Sous la norme' : 'Au-dessus') : 'Normal';
                const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                let dayName = '';
                try { const dd = new Date(selData.date + 'T12:00:00'); dayName = dayNames[dd.getDay()]; } catch {}
                const diffAvg = typeof selVal === 'number' && avg !== '--' ? selVal - parseFloat(avg as string) : 0;
                const diffPct = typeof selVal === 'number' && parseFloat(avg as string) > 0 ? Math.round((diffAvg / parseFloat(avg as string)) * 100) : 0;
                return (
                  <div data-testid="selected-point" style={{ padding: '16px 18px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14, borderLeft: `4px solid ${normColor}`, animation: 'fadeSlideIn 0.25s ease' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{dayName} {selData.label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 } as any}>
                          <span style={{ fontSize: 30, fontWeight: 900, color: '#111' }}>{isBP ? `${selData.systolic}/${selData.diastolic}` : (typeof selVal === 'number' && selVal >= 100 ? Math.round(selVal).toLocaleString() : selVal)}</span>
                          <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>{m.unit}</span>
                        </div>
                      </div>
                      <div style={{ padding: '6px 14px', borderRadius: 12, background: `${normColor}12`, border: `1px solid ${normColor}25` } as any}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: normColor }}>{normLabel}</span>
                      </div>
                    </div>
                    {/* Comparison with average */}
                    {typeof diffAvg === 'number' && avg !== '--' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 } as any}>
                        <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', gap: 8 } as any}>
                          <i className={diffAvg >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} style={{ fontSize: 13, color: diffAvg >= 0 ? '#10B981' : '#EF4444' }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{diffAvg > 0 ? '+' : ''}{typeof diffAvg === 'number' && Math.abs(diffAvg) >= 100 ? Math.round(diffAvg).toLocaleString() : diffAvg.toFixed(1)}</div>
                            <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>vs moyenne ({diffPct > 0 ? '+' : ''}{diffPct}%)</div>
                          </div>
                        </div>
                        {nMin != null && (
                          <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', gap: 8 } as any}>
                            <i className="ri-shield-check-line" style={{ fontSize: 13, color: normColor }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{nMin} — {nMax}</div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>plage normale ({m.unit})</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

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

          {/* Explain — rich card always open */}
          {(() => {
            const RICH_EXPLAIN: Record<string, { desc: string; why: string; ranges: { label: string; range: string; color: string }[]; tip: string; source: string }> = {
              heart_rate: { desc: "La frequence cardiaque au repos mesure le nombre de battements de votre coeur par minute lorsque vous etes calme et au repos. C'est un indicateur fondamental de votre sante cardiovasculaire.", why: "Un coeur en bonne sante bat moins souvent car il pompe plus de sang a chaque battement. Les athletes ont souvent une FC au repos plus basse.", ranges: [{ label: 'Bradycardie', range: '< 60 bpm', color: '#38BDF8' }, { label: 'Normal', range: '60 — 80 bpm', color: '#10B981' }, { label: 'Eleve', range: '80 — 100 bpm', color: '#F59E0B' }, { label: 'Tachycardie', range: '> 100 bpm', color: '#EF4444' }], tip: "Mesurez toujours au repos, le matin au reveil. Evitez la cafeine avant. Une FC regulierement basse est signe de bonne forme.", source: "OMS, American Heart Association" },
              spo2: { desc: "La saturation en oxygene (SpO2) indique le pourcentage d'hemoglobine transportant de l'oxygene dans votre sang. Elle reflete l'efficacite de vos poumons.", why: "Vos organes ont besoin d'un apport constant en oxygene. Une SpO2 basse peut indiquer des problemes respiratoires ou cardiaques.", ranges: [{ label: 'Critique', range: '< 90%', color: '#EF4444' }, { label: 'Bas', range: '90 — 94%', color: '#F59E0B' }, { label: 'Normal', range: '95 — 100%', color: '#10B981' }], tip: "En altitude, la SpO2 baisse naturellement. Si elle descend sous 92% au repos a basse altitude, consultez rapidement.", source: "Pulse Oximetry Guidelines, WHO" },
              blood_pressure: { desc: "La pression arterielle mesure la force exercee par le sang sur les parois de vos arteres. La systolique (haute) correspond a la contraction du coeur, la diastolique (basse) a son repos.", why: "L'hypertension non traitee endommage silencieusement les arteres, le coeur, les reins et le cerveau sur des annees.", ranges: [{ label: 'Basse', range: '< 90/60', color: '#38BDF8' }, { label: 'Optimale', range: '90-120 / 60-80', color: '#10B981' }, { label: 'Elevee', range: '120-140 / 80-90', color: '#F59E0B' }, { label: 'Hypertension', range: '> 140/90', color: '#EF4444' }], tip: "Mesurez au calme, assis depuis 5 min. La tension varie dans la journee — plus haute le matin. Reduisez le sel et le stress.", source: "ESC/ESH Guidelines 2023" },
              temperature: { desc: "La temperature corporelle fluctue naturellement au cours de la journee. Le matin elle est plus basse (~36.2) et atteint un pic l'apres-midi (~37.0).", why: "La fievre est une reponse immunitaire. Suivre sa temperature aide a detecter precocement infections et inflammations.", ranges: [{ label: 'Hypothermie', range: '< 35°C', color: '#38BDF8' }, { label: 'Normal', range: '36.1 — 37.5°C', color: '#10B981' }, { label: 'Fievre legere', range: '37.5 — 38.5°C', color: '#F59E0B' }, { label: 'Fievre', range: '> 38.5°C', color: '#EF4444' }], tip: "Apres l'exercice, la temperature monte naturellement. Attendez 30 min avant de mesurer.", source: "Medecine interne, Harrison's" },
              steps: { desc: "Le nombre de pas quotidien est le meilleur indicateur simple de votre niveau d'activite physique. L'OMS recommande 150 min d'activite moderee par semaine, soit environ 7 000 a 8 000 pas/jour.", why: "Marcher reduit le risque cardiovasculaire de 31%, le diabete de 33%, et ameliore l'humeur via la liberation d'endorphines.", ranges: [{ label: 'Sedentaire', range: '< 3 000 pas', color: '#EF4444' }, { label: 'Peu actif', range: '3 000 — 5 000', color: '#F59E0B' }, { label: 'Actif', range: '5 000 — 8 000', color: '#10B981' }, { label: 'Tres actif', range: '> 8 000 pas', color: '#3B82F6' }], tip: "Pour les seniors (65+), 6 000 pas/jour suffisent pour reduire la mortalite de 50%. Augmentez de 500 pas par semaine.", source: "Etude JAMA 2022, Lee et al." },
              calories: { desc: "Les calories brulees par l'activite physique (hors metabolisme de base). Cette depense varie selon l'intensite, la duree et votre poids corporel.", why: "Bruler des calories par l'activite aide a maintenir un poids sain, renforce le systeme immunitaire et ameliore le sommeil.", ranges: [{ label: 'Faible', range: '< 150 kcal', color: '#EF4444' }, { label: 'Modere', range: '150 — 300 kcal', color: '#F59E0B' }, { label: 'Actif', range: '> 300 kcal', color: '#10B981' }], tip: "30 min de marche rapide = ~150 kcal. La regularite est plus importante que l'intensite pour la sante a long terme.", source: "ACSM Guidelines" },
              distance_km: { desc: "La distance parcourue dans la journee reflete votre mobilite globale. C'est un indicateur de votre autonomie et de votre capacite fonctionnelle.", why: "Maintenir sa mobilite est essentiel pour prevenir les chutes, l'isolement social et le deconditionnement physique.", ranges: [{ label: 'Faible', range: '< 2 km', color: '#EF4444' }, { label: 'Modere', range: '2 — 4 km', color: '#F59E0B' }, { label: 'Bon', range: '4 — 6 km', color: '#10B981' }, { label: 'Excellent', range: '> 6 km', color: '#3B82F6' }], tip: "Variez les parcours pour stimuler l'equilibre et la coordination. La marche en nature reduit le cortisol de 15%.", source: "Journal of Aging & Physical Activity" },
              hrv: { desc: "La variabilite de la frequence cardiaque (HRV) mesure les variations entre chaque battement. Un HRV eleve indique que votre systeme nerveux s'adapte bien au stress.", why: "Le HRV reflete l'equilibre entre systeme sympathique (stress) et parasympathique (repos). C'est un marqueur de recuperation.", ranges: [{ label: 'Bas', range: '< 20 ms', color: '#EF4444' }, { label: 'Moyen', range: '20 — 40 ms', color: '#F59E0B' }, { label: 'Bon', range: '40 — 60 ms', color: '#10B981' }, { label: 'Excellent', range: '> 60 ms', color: '#3B82F6' }], tip: "Le HRV se mesure idealement le matin au reveil. La meditation et la respiration profonde l'ameliorent.", source: "European Society of Cardiology" },
              stress_level: { desc: "Le niveau de stress est estime a partir du HRV, de la frequence cardiaque et de la conductance cutanee. Il refllete l'activation de votre systeme nerveux sympathique.", why: "Le stress chronique eleve augmente l'inflammation, la tension arterielle et le risque de depression.", ranges: [{ label: 'Detendu', range: '0 — 25', color: '#10B981' }, { label: 'Modere', range: '25 — 50', color: '#F59E0B' }, { label: 'Eleve', range: '50 — 75', color: '#EF4444' }, { label: 'Tres eleve', range: '> 75', color: '#991B1B' }], tip: "Pratiquez la coherence cardiaque (5 min, 6 respirations/min) pour faire baisser le stress en 3 minutes.", source: "HeartMath Institute" },
              recovery_score: { desc: "Le score de recuperation combine la qualite du sommeil, le HRV, la frequence cardiaque au repos et le stress pour evaluer votre capacite a l'effort.", why: "S'entrainer quand la recuperation est basse augmente le risque de blessure et ralentit la progression.", ranges: [{ label: 'Faible', range: '< 40%', color: '#EF4444' }, { label: 'Modere', range: '40 — 70%', color: '#F59E0B' }, { label: 'Bon', range: '70 — 90%', color: '#10B981' }, { label: 'Optimal', range: '> 90%', color: '#3B82F6' }], tip: "Si < 50%, privilegiez la marche douce ou le yoga. Au-dessus de 80%, vous pouvez faire un effort intense.", source: "Sports Science, WHOOP Research" },
              sleep_quality: { desc: "La qualite du sommeil evalue la duree, la profondeur (sommeil profond + REM) et la continuite de vos nuits.", why: "Le sommeil profond repare les tissus et consolide la memoire. Le sommeil REM gere les emotions et la creativite.", ranges: [{ label: 'Mauvais', range: '< 50%', color: '#EF4444' }, { label: 'Moyen', range: '50 — 75%', color: '#F59E0B' }, { label: 'Bon', range: '75 — 90%', color: '#10B981' }, { label: 'Excellent', range: '> 90%', color: '#3B82F6' }], tip: "Couchez-vous et levez-vous a la meme heure. Evitez les ecrans 1h avant. La chambre doit etre fraiche (18-19°C).", source: "National Sleep Foundation" },
              weight: { desc: "Le poids corporel seul ne suffit pas a evaluer la sante. Il doit etre croise avec la composition corporelle (graisse, muscle, eau).", why: "Les variations quotidiennes (0.5-1.5 kg) sont normales et liees a l'hydratation, la digestion et le sel.", ranges: [], tip: "Pesez-vous toujours le matin, a jeun, dans les memes conditions. Suivez la tendance sur 2 semaines, pas les variations quotidiennes.", source: "Endocrine Society" },
            };
            const info = RICH_EXPLAIN[key || ''] || { desc: m.explain || '', why: '', ranges: [], tip: '', source: '' };
            return (
              <div data-testid="explain-section" style={{ borderRadius: 18, background: '#F4F4F5', marginBottom: 14, overflow: 'hidden' } as any}>
                <div onClick={() => setShowExplain(!showExplain)} style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <i className="ri-stethoscope-line" style={{ fontSize: 16, color }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Comprendre {(m.title || '').toLowerCase()}</span>
                  </div>
                  <i className={showExplain ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: '#9CA3AF' }} />
                </div>
                {showExplain && (
                  <div style={{ padding: '0 18px 18px' } as any}>
                    {/* Description */}
                    <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, marginBottom: 14 }}>{info.desc}</div>
                    {/* Why it matters */}
                    {info.why && (
                      <div style={{ padding: '12px 14px', borderRadius: 14, background: '#FFF', marginBottom: 12, display: 'flex', gap: 10 } as any}>
                        <i className="ri-lightbulb-line" style={{ fontSize: 16, color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pourquoi c'est important</div>
                          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{info.why}</div>
                        </div>
                      </div>
                    )}
                    {/* Ranges */}
                    {info.ranges.length > 0 && (
                      <div style={{ marginBottom: 12 } as any}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Echelle de reference</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 } as any}>
                          {info.ranges.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: '#FFF' } as any}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 } as any} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#111', flex: 1 }}>{r.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>{r.range}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Tip */}
                    {info.tip && (
                      <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', display: 'flex', gap: 10 } as any}>
                        <i className="ri-heart-pulse-line" style={{ fontSize: 16, color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Conseil</div>
                          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{info.tip}</div>
                        </div>
                      </div>
                    )}
                    {info.source && <div style={{ fontSize: 9, color: '#C8C8CC', marginTop: 10, textAlign: 'right' }}>Source : {info.source}</div>}
                  </div>
                )}
              </div>
            );
          })()}

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
