import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const G: any = { borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

/* ── Metrics that display a gauge instead of a time chart ── */
const GAUGE_KEYS = new Set(['bmi', 'visceral_fat', 'waist_hip_ratio', 'body_age', 'ideal_weight', 'bone_mass_kg', 'protein_pct', 'skeletal_muscle_pct', 'basal_metabolism', 'recommended_calories', 'subcutaneous_fat_pct', 'trunk_fat_kg']);

/* ── Gauge zone definitions ── */
const ZONES: Record<string, { min: number; max: number; label: string; color: string }[]> = {
  bmi: [
    { min: 0, max: 18.5, label: 'Maigreur', color: '#38BDF8' },
    { min: 18.5, max: 25, label: 'Normal', color: '#10B981' },
    { min: 25, max: 30, label: 'Surpoids', color: '#F59E0B' },
    { min: 30, max: 45, label: 'Obesite', color: '#EF4444' },
  ],
  visceral_fat: [
    { min: 0, max: 10, label: 'Normal', color: '#10B981' },
    { min: 10, max: 15, label: 'Eleve', color: '#F59E0B' },
    { min: 15, max: 25, label: 'Tres eleve', color: '#EF4444' },
  ],
  waist_hip_ratio: [
    { min: 0.5, max: 0.85, label: 'Sain', color: '#10B981' },
    { min: 0.85, max: 0.95, label: 'Modere', color: '#F59E0B' },
    { min: 0.95, max: 1.2, label: 'Eleve', color: '#EF4444' },
  ],
  body_fat_pct: [
    { min: 5, max: 20, label: 'Bas', color: '#38BDF8' },
    { min: 20, max: 30, label: 'Normal', color: '#10B981' },
    { min: 30, max: 45, label: 'Eleve', color: '#F59E0B' },
  ],
};

/* ── Smooth SVG cubic bezier path from points ── */
function smooth(pts: { x: number; y: number }[], t = 0.3): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], e = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${b.x + (c.x - a.x) * t},${b.y + (c.y - a.y) * t},${c.x - (e.x - b.x) * t},${c.y - (e.y - b.y) * t},${c.x},${c.y}`;
  }
  return d;
}

/* ── Nora text per metric ── */
function noraText(key: string, m: any, val: any, avg: string, isNormal: boolean, stats: any): string {
  const title = (m.title || '').toLowerCase();
  const unit = m.unit || '';
  const nMin = m.normal_min;
  const nMax = m.normal_max;
  const trend = stats.trend;

  // Gauge-specific texts
  if (GAUGE_KEYS.has(key)) {
    const zones = ZONES[key];
    if (zones) {
      let zn = zones[zones.length - 1];
      for (const z of zones) { if (val < z.max) { zn = z; break; } }
      const adviceMap: Record<string, Record<string, string>> = {
        bmi: { 'Maigreur': 'Un IMC bas peut indiquer une denutrition. Je vous conseille de consulter votre medecin pour un bilan nutritionnel.', 'Normal': 'Votre IMC est dans la zone ideale. Maintenez votre equilibre alimentaire et votre activite physique.', 'Surpoids': 'Un IMC legerement eleve peut etre ameliore par une activite physique reguliere et une alimentation equilibree.', 'Obesite': 'Je vous recommande de consulter votre medecin pour un accompagnement personnalise.' },
        visceral_fat: { 'Normal': 'Votre graisse viscerale est dans une zone saine. Continuez a maintenir votre mode de vie actuel.', 'Eleve': 'Un exces de graisse viscerale augmente les risques cardiovasculaires. L\'activite physique reguliere aide a la reduire.', 'Tres eleve': 'Un niveau eleve de graisse viscerale necessite une attention medicale. Consultez votre medecin.' },
        waist_hip_ratio: { 'Sain': 'Votre ratio taille-hanche indique une bonne repartition des graisses.', 'Modere': 'Votre ratio est moderement eleve. L\'activite physique peut aider a ameliorer ce ratio.', 'Eleve': 'Ce ratio eleve indique un exces de graisse abdominale. Parlez-en a votre medecin.' },
      };
      const advice = adviceMap[key]?.[zn.label] || '';
      return `Votre ${title} est de ${val} ${unit}, zone "${zn.label}". ${advice}`;
    }
    if (key === 'body_age') return `Votre age corporel estime est de ${val} ans. Ce chiffre prend en compte votre composition corporelle et vos constantes. Un age corporel inferieur a votre age reel est un excellent signe de sante globale.`;
    if (key === 'ideal_weight') return `Votre poids ideal calcule est de ${val} kg, base sur votre taille et votre morphologie. L'objectif n'est pas un chiffre exact mais une plage saine pour votre profil.`;
    if (key === 'basal_metabolism') return `Votre metabolisme de base est de ${val} kcal/jour. C'est l'energie que votre corps depense au repos pour fonctionner. Plus votre masse musculaire est elevee, plus ce chiffre augmente.`;
    if (key === 'recommended_calories') return `Votre apport calorique recommande est de ${val} kcal/jour, en tenant compte de votre metabolisme et de votre activite. Ce chiffre vous aide a maintenir votre poids actuel.`;
    if (nMin != null) {
      return isNormal
        ? `Votre ${title} de ${val} ${unit} se situe dans la zone normale (${nMin}-${nMax} ${unit}). C'est un bon indicateur.`
        : `Votre ${title} de ${val} ${unit} est ${val < nMin ? 'en dessous' : 'au-dessus'} de la norme (${nMin}-${nMax} ${unit}). Parlez-en a votre medecin si cette tendance persiste.`;
    }
    return `Votre ${title} est de ${val} ${unit}.`;
  }

  // Chart metric texts
  const trendText = trend != null ? (Math.abs(trend) < 0.5 ? ' La tendance est stable.' : trend > 0 ? ` Tendance en hausse de +${trend} sur la periode.` : ` Tendance en baisse de ${trend} sur la periode.`) : '';
  const adviceByKey: Record<string, string> = {
    heart_rate: isNormal ? 'Votre rythme cardiaque est sain. Le repos, une bonne hydratation et le sommeil sont vos meilleurs allies.' : val < (nMin || 0) ? 'Une frequence basse peut etre normale si vous etes sportif. Sinon, parlez-en a votre medecin.' : 'Le stress, la deshydratation ou la cafeïne peuvent elever le pouls. Privilegiez le calme et l\'hydratation.',
    spo2: isNormal ? 'Votre saturation en oxygene est optimale.' : 'En dessous de 92%, consultez rapidement votre medecin. Assurez-vous d\'etre bien ventile.',
    blood_pressure: isNormal ? 'Votre tension est equilibree. Continuez a limiter le sel et a pratiquer une activite physique douce.' : 'Une tension elevee necessite un suivi medical regulier. Reduisez le sel et le stress.',
    temperature: isNormal ? 'Votre temperature corporelle est normale.' : val > (nMax || 0) ? 'Une temperature elevee peut indiquer une infection ou une inflammation. Surveillez et consultez si cela persiste.' : 'Une temperature basse peut indiquer une fatigue. Couvrez-vous et restez au chaud.',
    steps: val >= 6000 ? `Bravo ! Vous etes actif aujourd\'hui avec ${val} pas.` : `${val} pas, c'est un debut. L'objectif recommande est 6000 pas minimum. Chaque pas compte.`,
    calories: `Vous avez depense ${val} kcal en activite.${val > 200 ? ' Bonne depense energetique.' : ' Essayez de bouger un peu plus.'}`,
    stress_level: isNormal ? 'Votre niveau de stress est bas, c\'est excellent pour votre recuperation.' : 'Votre stress est eleve. La respiration profonde et la marche en plein air peuvent aider.',
    recovery_score: isNormal ? 'Votre corps recupere bien. Vous etes pret pour une journee active.' : 'Votre recuperation est faible. Privilegiez le repos et un sommeil de qualite.',
    weight: 'Votre poids est une donnee globale. Croisez-le avec votre composition corporelle pour une analyse complete.',
    glycemia: isNormal ? 'Votre glycemie est dans la plage normale.' : 'Une glycemie hors norme merite une attention medicale. Consultez votre medecin.',
    hrv: isNormal ? 'Votre variabilite cardiaque est bonne, signe d\'une bonne capacite d\'adaptation au stress.' : 'Un HRV bas peut indiquer du stress ou de la fatigue. Privilegiez le repos.',
  };
  const advice = adviceByKey[key] || (isNormal ? 'Cette valeur est dans la plage normale.' : 'Parlez-en a votre medecin si cela persiste.');

  if (nMin != null) {
    return `Votre ${title} est de ${val} ${unit}, ${isNormal ? 'dans la zone normale' : val < nMin ? 'en dessous de la norme' : 'au-dessus de la norme'} (${nMin}-${nMax} ${unit}). Moyenne sur la periode : ${avg} ${unit}.${trendText} ${advice}`;
  }
  return `Votre ${title} est de ${val} ${unit}. Moyenne sur la periode : ${avg} ${unit}.${trendText} ${advice}`;
}

export default function MetricDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { token } = useAuth();
  const router = useRouter();
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

  const load = async (r: string) => {
    setLoading(true);
    try {
      const [d, th] = await Promise.all([
        apiFetch(`/api/health/metric-history/${key}?period=${r}`, {}, token),
        apiFetch(`/api/health/thresholds/${key}`, {}, token).catch(() => null),
      ]);
      setData(d);
      if (th) { setThreshold(th); setThMin(th.min_val != null ? String(th.min_val) : ''); setThMax(th.max_val != null ? String(th.max_val) : ''); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(range); }, [key, token]);
  const changeRange = (r: string) => { setRange(r); setSel(null); load(r); };

  if (Platform.OS !== 'web') return <NativePageView path="/metric-detail" />;
  if (loading) return <FullScreenLoader />;

  const m = data?.meta || {};
  const history = data?.history || [];
  const stats = data?.stats || {};
  const color = m.color || '#A78BFA';
  const isGauge = GAUGE_KEYS.has(key || '');
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

  /* ── Chart SVG helpers ── */
  const W = 400, H = 180, mV = 12;
  const rg = mx - mn || 1;
  const dMn = mn - rg * 0.08, dMx = mx + rg * 0.08, dRg = dMx - dMn || 1;
  const toX = (i: number) => (i / Math.max(sliced.length - 1, 1)) * W;
  const toY = (v: number) => mV + (H - mV * 2) - ((v - dMn) / dRg) * (H - mV * 2);
  const pts = sliced.map((h: any, i: number) => ({ x: toX(i), y: toY(h.value) }));

  /* ── Render CHART ── */
  const renderChart = () => {
    if (!sliced.length) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Aucune donnee</div>;
    const handleClick = (e: any) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const idx = Math.round((x / rect.width) * (sliced.length - 1));
      if (idx >= 0 && idx < sliced.length) setSel(sel === idx ? null : idx);
    };
    return (
      <div onClick={handleClick} style={{ cursor: 'crosshair' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          {/* Grid lines with Y-axis values */}
          {[0.25, 0.5, 0.75].map((p, i) => {
            const yVal = dMx - (dMx - dMn) * p;
            return <g key={i}>
              <line x1={32} y1={mV + (H - mV * 2) * p} x2={W} y2={mV + (H - mV * 2) * p} stroke="rgba(255,255,255,0.04)" />
              <text x={28} y={mV + (H - mV * 2) * p + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="8" fontWeight="600">{Number.isInteger(yVal) ? yVal : yVal.toFixed(1)}</text>
            </g>;
          })}
          {/* Normal zone band */}
          {nMin != null && !isBP && (
            <rect x={0} y={toY(nMax)} width={W} height={Math.max(1, Math.abs(toY(nMin) - toY(nMax)))} fill="rgba(16,185,129,0.06)" rx={4} />
          )}

          {isBP ? (
            /* Blood Pressure: side-by-side bars */
            sliced.map((h: any, i: number) => {
              const bw = Math.max(3, W / sliced.length * 0.28);
              const sys = h.systolic || h.value;
              const dia = h.diastolic || h.value * 0.62;
              const sH = Math.max(2, ((sys - dMn) / dRg) * (H - mV * 2));
              const dH = Math.max(2, ((dia - dMn) / dRg) * (H - mV * 2));
              const isSel = sel === i;
              return <g key={i}>
                <rect x={toX(i) - bw - 1} y={H - mV - sH} width={bw} height={sH} rx={3} fill="#8B5CF6" opacity={isSel ? 0.9 : 0.4} />
                <rect x={toX(i) + 1} y={H - mV - dH} width={bw} height={dH} rx={3} fill="#C4B5FD" opacity={isSel ? 0.9 : 0.4} />
                {isSel && <text x={toX(i)} y={H - mV - sH - 8} fill="#FFF" fontSize="9" fontWeight="800" textAnchor="middle">{sys}/{dia}</text>}
              </g>;
            })
          ) : graphType === 'bars' || graphType === 'bars_threshold' ? (
            /* Vertical bars (steps, calories, distance, water) */
            sliced.map((h: any, i: number) => {
              const bw = Math.max(3, W / sliced.length * 0.55);
              const bh = Math.max(2, ((h.value - dMn) / dRg) * (H - mV * 2));
              const isSel = sel === i;
              return <g key={i}>
                <rect x={toX(i) - bw / 2} y={H - mV - bh} width={bw} height={bh} rx={4} fill={color} opacity={isSel ? 0.85 : 0.3} />
                {isSel && <text x={toX(i)} y={H - mV - bh - 8} fill="#FFF" fontSize="9" fontWeight="800" textAnchor="middle">{typeof h.value === 'number' && h.value > 100 ? Math.round(h.value) : h.value}</text>}
              </g>;
            })
          ) : graphType === 'scatter' ? (
            /* Scatter (HRV) with trend line */
            <>
              {pts.length >= 2 && <path d={smooth(pts, 0.2)} fill="none" stroke={color} strokeWidth={1.5} opacity={0.2} strokeDasharray="4,4" />}
              {sliced.map((h: any, i: number) => {
                const isSel = sel === i;
                return <g key={i}>
                  <circle cx={toX(i)} cy={toY(h.value)} r={isSel ? 7 : 4} fill={color} opacity={isSel ? 1 : 0.45} stroke={isSel ? '#FFF' : 'none'} strokeWidth={2} />
                  {isSel && <text x={toX(i)} y={toY(h.value) - 14} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{h.value}</text>}
                </g>;
              })}
            </>
          ) : (
            /* Default: smooth area + line + dots */
            <>
              <defs>
                <linearGradient id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {pts.length >= 2 && (
                <>
                  <path d={`${smooth(pts)}L${pts[pts.length - 1].x},${H}L${pts[0].x},${H}Z`} fill={`url(#g-${key})`} />
                  <path d={smooth(pts)} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
                </>
              )}
              {sliced.length <= 31 && sliced.map((h: any, i: number) => {
                const isSel = sel === i;
                return <g key={i}>
                  <circle cx={toX(i)} cy={toY(h.value)} r={isSel ? 6 : 3} fill={isSel ? '#FFF' : color} stroke={isSel ? color : 'none'} strokeWidth={2} />
                  {isSel && <text x={toX(i)} y={toY(h.value) - 14} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{h.value}</text>}
                </g>;
              })}
            </>
          )}
        </svg>
      </div>
    );
  };

  /* ── Render GAUGE ── */
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
    const dx = cx + r * Math.cos(angle);
    const dy = cy - r * Math.sin(angle);

    let zoneColor = color, zoneLabel = '';
    if (zones) {
      for (const z of zones) { if (val >= z.min && val < z.max) { zoneColor = z.color; zoneLabel = z.label; break; } }
      if (val >= zones[zones.length - 1].min) { zoneColor = zones[zones.length - 1].color; zoneLabel = zones[zones.length - 1].label; }
    } else if (nMin != null) {
      zoneColor = isNormal ? '#10B981' : '#EF4444';
      zoneLabel = isNormal ? 'Normal' : val < nMin ? 'Bas' : 'Eleve';
    }

    const arcPath = (a1: number, a2: number) => {
      const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy - r * Math.sin(a2);
      const large = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
      return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
    };

    return (
      <div data-testid="gauge-container" style={{ ...G, padding: '24px 16px 20px', marginBottom: 14, textAlign: 'center' } as any}>
        <svg width="100%" viewBox="0 0 300 145" style={{ maxWidth: 300, margin: '0 auto', display: 'block' }}>
          {/* Background arc */}
          <path d={arcPath(Math.PI, 0)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} strokeLinecap="round" />
          {/* Zone arcs */}
          {zones ? zones.map((z, i) => {
            const a1 = Math.PI * (1 - (Math.max(z.min, gMin) - gMin) / gRange);
            const a2 = Math.PI * (1 - (Math.min(z.max, gMax) - gMin) / gRange);
            return <path key={i} d={arcPath(a1, a2)} fill="none" stroke={z.color} strokeWidth={sw} opacity={0.3} />;
          }) : nMin != null ? (
            <path d={arcPath(Math.PI * (1 - (nMin - gMin) / gRange), Math.PI * (1 - (nMax - gMin) / gRange))} fill="none" stroke="#10B981" strokeWidth={sw} opacity={0.3} />
          ) : null}
          {/* Active progress */}
          <path d={arcPath(Math.PI, angle)} fill="none" stroke={zoneColor} strokeWidth={sw} strokeLinecap="round" />
          {/* Indicator dot */}
          <circle cx={dx} cy={dy} r={9} fill="#FFF" stroke={zoneColor} strokeWidth={3} />
          {/* Value */}
          <text x={cx} y={cy - 18} textAnchor="middle" fill="#FFF" fontSize="34" fontWeight="900" fontFamily="Inter, system-ui">{typeof currentVal === 'number' ? (Number.isInteger(currentVal) ? currentVal : currentVal.toFixed(1)) : currentVal}</text>
          <text x={cx} y={cy + 2} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="12" fontWeight="600">{m.unit}</text>
          {/* Min/Max */}
          <text x={cx - r - 2} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">{zones ? zones[0].min : gMin.toFixed?.(1) || gMin}</text>
          <text x={cx + r + 2} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9">{zones ? zones[zones.length - 1].max : gMax.toFixed?.(1) || gMax}</text>
        </svg>
        {/* Zone label badge */}
        {zoneLabel && (
          <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 99, background: `${zoneColor}18`, border: `1px solid ${zoneColor}35`, fontSize: 12, fontWeight: 700, color: zoneColor, marginTop: 6 }}>{zoneLabel}</div>
        )}
        {/* Zone legend */}
        {zones && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' } as any}>
            {zones.map((z, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: z.color, opacity: 0.6 } as any} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{z.label} ({z.min}-{z.max})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ── Mini sparkline for gauge metrics ── */
  const renderSparkline = () => {
    if (sliced.length < 2) return null;
    const sW = 400, sH = 50;
    const sPts = sliced.map((h: any, i: number) => {
      const x = (i / Math.max(sliced.length - 1, 1)) * sW;
      const y = 4 + (sH - 8) - ((h.value - mn) / (rg || 1)) * (sH - 8);
      return { x, y };
    });
    return (
      <div style={{ ...G, padding: '14px 16px', marginBottom: 14 } as any}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Evolution recente</div>
        <svg width="100%" viewBox={`0 0 ${sW} ${sH}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs><linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d={`${smooth(sPts)}L${sPts[sPts.length - 1].x},${sH}L${sPts[0].x},${sH}Z`} fill="url(#spark-fill)" />
          <path d={smooth(sPts)} fill="none" stroke={color} strokeWidth={2} />
          <circle cx={sPts[sPts.length - 1].x} cy={sPts[sPts.length - 1].y} r={4} fill={color} />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 } as any}>
          {sliced.filter((_: any, i: number) => i === 0 || i === sliced.length - 1).map((h: any, i: number) => <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{h.label}</span>)}
        </div>
        {stats.trend != null && (
          <div style={{ fontSize: 12, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B', marginTop: 8 }}>
            Tendance : {stats.trend > 0 ? '+' : ''}{stats.trend} sur la periode
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-testid="metric-detail-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ─── Back ─── */}
        <div data-testid="back-btn" onClick={() => router.push('/(tabs)/health' as any)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, ...G, cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Retour</span>
        </div>

        {/* ─── Hero: title + value (chart mode only) ─── */}
        <div style={{ marginBottom: isGauge ? 8 : 20 } as any}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>{m.title || key}</div>
          {!isGauge && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 } as any}>
                <span data-testid="current-value" style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{isBP && selData ? `${selData.systolic}/${selData.diastolic}` : currentVal}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{m.unit}</span>
                {nMin != null && (
                  <span data-testid="status-badge" style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 99, background: isNormal ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isNormal ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 11, fontWeight: 700, color: isNormal ? '#10B981' : '#EF4444' }}>
                    {isNormal ? 'Normal' : currentVal < nMin ? 'Bas' : 'Eleve'}
                  </span>
                )}
              </div>
              {stats.trend != null && <div style={{ fontSize: 13, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B', marginTop: 6 }}>{stats.trend > 0 ? '+' : ''}{stats.trend} sur {range}</div>}
            </>
          )}
        </div>

        {/* ══════════ GAUGE VIEW ══════════ */}
        {isGauge && (
          <>
            {renderGauge()}
            {renderSparkline()}
          </>
        )}

        {/* ══════════ CHART VIEW ══════════ */}
        {!isGauge && (
          <>
            {/* Period selector + date picker */}
            <div data-testid="period-selector" style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' } as any}>
              {['24h', '7j', '30j', '90j'].map(r => (
                <div key={r} data-testid={`period-${r}`} onClick={() => changeRange(r)} style={{ padding: '8px 14px', borderRadius: 10, background: range === r ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${range === r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: range === r ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{r}</div>
              ))}
              <div style={{ flex: 1 } as any} />
              <input data-testid="date-picker" type="date" onChange={(e: any) => {
                if (e.target.value) {
                  const d = new Date(e.target.value);
                  const label = `${d.getDate()}/${d.getMonth()+1}`;
                  const found = sliced.findIndex((h: any) => h.label === label || h.date === e.target.value);
                  if (found >= 0) setSel(found);
                }
              }} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 11, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' } as any} />
            </div>

            {/* Chart card */}
            <div data-testid="chart-card" style={{ ...G, padding: '12px 0', marginBottom: 14, overflow: 'hidden' } as any}>
              {renderChart()}
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px 0' } as any}>
                {sliced.filter((_: any, i: number) => {
                  const step = Math.max(1, Math.floor(sliced.length / 5));
                  return i === 0 || i === sliced.length - 1 || i % step === 0;
                }).map((h: any, i: number) => <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{h.label}</span>)}
              </div>
              {/* BP Legend */}
              {isBP && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '8px 0 2px' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5CF6' } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Systolique</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#C4B5FD' } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Diastolique</span></div>
                </div>
              )}
            </div>

            {/* Selected point detail */}
            {selData && (
              <div data-testid="selected-point" style={{ ...G, padding: '14px 18px', marginBottom: 14, borderColor: `${color}30` } as any}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{selData.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 } as any}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{isBP ? `${selData.systolic}/${selData.diastolic}` : selData.value}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span>
                  {nMin != null && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: selData.value >= nMin && selData.value <= nMax ? '#10B981' : '#EF4444' }}>
                      {selData.value >= nMin && selData.value <= nMax ? 'Dans la norme' : selData.value < nMin ? 'Sous la norme' : 'Au-dessus'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats: avg, min, max */}
            <div data-testid="stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
              {[
                { label: 'Moyenne', value: avg, icon: 'ri-bar-chart-box-line', c: color },
                { label: 'Plus bas', value: vals.length ? (mn % 1 === 0 ? mn : mn.toFixed(1)) : '--', icon: 'ri-arrow-down-line', c: '#38BDF8' },
                { label: 'Plus haut', value: vals.length ? (mx % 1 === 0 ? mx : mx.toFixed(1)) : '--', icon: 'ri-arrow-up-line', c: '#EF4444' },
              ].map((s, i) => (
                <div key={i} style={{ ...G, padding: '14px 10px', textAlign: 'center' } as any}>
                  <i className={s.icon} style={{ fontSize: 16, color: s.c, display: 'block', marginBottom: 6 }} />
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── Nora analysis ─── */}
        <div data-testid="nora-analysis" style={{ ...G, padding: '18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#A78BFA' }}>N</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>Nora</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Analyse {m.title?.toLowerCase()}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
            {noraText(key || '', m, currentVal, avg, isNormal, stats)}
          </div>
          {!isGauge && stats.trend != null && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: stats.trend <= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${stats.trend <= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`, marginTop: 12 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B' }}>Tendance : {stats.trend > 0 ? '+' : ''}{stats.trend} sur la periode</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{stats.trend <= 0 ? 'Evolution stable ou en amelioration.' : 'Legere augmentation, a suivre.'}</div>
            </div>
          )}
        </div>

        {/* ─── What is this metric? (Expandable) ─── */}
        <div data-testid="explain-section" onClick={() => setShowExplain(!showExplain)} style={{ ...G, padding: '16px 18px', marginBottom: 14, cursor: 'pointer' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-book-open-line" style={{ fontSize: 16, color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Qu'est-ce que {(m.title || '').toLowerCase()} ?</span>
            </div>
            <i className={showExplain ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>
          {showExplain && (
            <div style={{ marginTop: 12 } as any}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 10 }}>{m.explain || ''}</div>
              {nMin != null && (
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Min normal</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#38BDF8' }}>{nMin} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Zone ideale</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>{nMin}-{nMax}</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Max normal</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444' }}>{nMax} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Objectives (activity) or Alert thresholds (health) ─── */}
        {(() => {
          const OBJECTIVE_KEYS = new Set(['steps', 'calories', 'distance_km', 'stress_level', 'recovery_score', 'sleep_quality', 'vo2_max']);
          const isObjective = OBJECTIVE_KEYS.has(key || '');
          const defaultGoals: Record<string, { value: string; label: string }> = {
            steps: { value: '6000', label: 'pas/jour' },
            calories: { value: '300', label: 'kcal/jour' },
            distance_km: { value: '4', label: 'km/jour' },
            stress_level: { value: '40', label: 'maximum /100' },
            recovery_score: { value: '75', label: 'minimum /100' },
            sleep_quality: { value: '80', label: 'minimum %' },
            vo2_max: { value: '30', label: 'ml/kg/min' },
          };
          const goal = defaultGoals[key || ''];

          if (isObjective) return (
            <div data-testid="objectives-section" style={{ ...G, padding: '16px 18px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                <i className="ri-flag-line" style={{ fontSize: 16, color: '#10B981' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Objectif journalier</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>Fixez un objectif personnalise pour suivre votre progression quotidienne.</div>
              {!thEdit ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 12 } as any}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className="ri-trophy-line" style={{ fontSize: 20, color: '#10B981' }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>Objectif</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{threshold?.goal || threshold?.max_val || goal?.value || '--'} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{goal?.label || m.unit}</span></div>
                    </div>
                    {typeof currentVal === 'number' && (
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: currentVal >= parseFloat(threshold?.goal || threshold?.max_val || goal?.value || '0') ? '#10B981' : '#F59E0B' }}>
                          {currentVal >= parseFloat(threshold?.goal || threshold?.max_val || goal?.value || '0') ? 'Atteint' : 'En cours'}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{Math.round((currentVal / parseFloat(threshold?.goal || threshold?.max_val || goal?.value || '1')) * 100)}%</div>
                      </div>
                    )}
                  </div>
                  <div onClick={() => { setThEdit(true); setThMax(threshold?.goal || threshold?.max_val?.toString() || goal?.value || ''); }} style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Modifier l'objectif</div>
                </>
              ) : (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(16,185,129,0.7)', textTransform: 'uppercase', marginBottom: 6 }}>Nouvel objectif ({goal?.label || m.unit})</div>
                  <input type="number" step="1" value={thMax} onChange={(e: any) => setThMax(e.target.value)} placeholder={goal?.value || '0'} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', color: '#FFF', fontSize: 20, fontWeight: 800, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', textAlign: 'center', marginBottom: 12 } as any} />
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={async () => { setThSaving(true); try { await apiFetch('/api/health/thresholds', { method: 'POST', body: JSON.stringify({ metric_id: key, goal: thMax ? parseFloat(thMax) : null, max_val: thMax ? parseFloat(thMax) : null }) }, token); setThreshold({ metric_id: key, goal: thMax ? parseFloat(thMax) : null, max_val: thMax ? parseFloat(thMax) : null }); setThEdit(false); } catch {} finally { setThSaving(false); } }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#10B981', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF' } as any}>{thSaving ? '...' : 'Sauvegarder'}</div>
                    <div onClick={() => setThEdit(false)} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}
            </div>
          );

          // Default: alert thresholds for health metrics
          return (
        <div data-testid="thresholds-section" style={{ ...G, padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-alarm-warning-line" style={{ fontSize: 16, color: '#F59E0B' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Seuils d'alerte</span>
            </div>
            {!thEdit && (
              <div data-testid="configure-threshold-btn" onClick={() => {
                setThEdit(true);
                // Smart medical defaults per metric (not naive math)
                const smartDefaults: Record<string, { min: string; max: string; minOnly?: boolean; maxOnly?: boolean }> = {
                  heart_rate: { min: '50', max: '100' },
                  spo2: { min: '92', max: '' },      // SpO2 max is always 100 — only low threshold matters
                  blood_pressure: { min: '90', max: '140' },
                  temperature: { min: '35.5', max: '38.5' },
                  hrv: { min: '20', max: '' },         // Only low HRV is concerning
                  stress_level: { min: '', max: '70' }, // Only high stress matters
                  recovery_score: { min: '40', max: '' },
                };
                const defaults = smartDefaults[key || ''];
                if (defaults) {
                  if (!thMin) setThMin(defaults.min);
                  if (!thMax) setThMax(defaults.max);
                } else {
                  if (!thMin && nMin != null) setThMin(String(nMin));
                  if (!thMax && nMax != null) setThMax(String(nMax));
                }
              }} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#FFF' } as any}>
                {threshold?.min_val != null ? 'Modifier' : 'Configurer'}
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>Vos gardiens seront alertes si cette donnee depasse les seuils definis.</div>
          {nMin != null && !thEdit && !(threshold?.min_val != null) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 12 } as any}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}><span style={{ fontSize: 8, fontWeight: 900, color: '#A78BFA' }}>N</span></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                {(() => {
                  const suggestions: Record<string, string> = {
                    heart_rate: `Je vous suggere un seuil bas a <strong style="color:#38BDF8">50 bpm</strong> et haut a <strong style="color:#EF4444">100 bpm</strong>.`,
                    spo2: `Pour la SpO2, seul le seuil bas compte. Je recommande <strong style="color:#38BDF8">92%</strong>. En dessous, contactez votre medecin.`,
                    blood_pressure: `Je vous suggere un seuil bas a <strong style="color:#38BDF8">90 mmHg</strong> et haut a <strong style="color:#EF4444">140 mmHg</strong> (systolique).`,
                    temperature: `Je vous suggere un seuil bas a <strong style="color:#38BDF8">35.5°C</strong> et haut a <strong style="color:#EF4444">38.5°C</strong>.`,
                    hrv: `Pour le HRV, seul le seuil bas est pertinent. Je recommande <strong style="color:#38BDF8">20 ms</strong>.`,
                    stress_level: `Pour le stress, seul le seuil haut compte. Je recommande <strong style="color:#EF4444">70/100</strong>.`,
                    recovery_score: `Pour la recuperation, seul le seuil bas compte. Je recommande <strong style="color:#38BDF8">40/100</strong>.`,
                  };
                  const text = suggestions[key || ''] || `Je vous suggere un seuil bas a <strong style="color:#38BDF8">${nMin} ${m.unit}</strong> et haut a <strong style="color:#EF4444">${nMax} ${m.unit}</strong>.`;
                  return <span dangerouslySetInnerHTML={{ __html: text + ' Cliquez sur Configurer pour appliquer ou ajuster.' }} />;
                })()}
              </div>
            </div>
          )}
          {!thEdit ? (
            threshold?.min_val != null || threshold?.max_val != null ? (
              <div style={{ display: 'flex', gap: 10 } as any}>
                {threshold.min_val != null && <div style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil bas</div><div style={{ fontSize: 22, fontWeight: 900, color: '#38BDF8' }}>{threshold.min_val} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div></div>}
                {threshold.max_val != null && <div style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil haut</div><div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{threshold.max_val} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div></div>}
              </div>
            ) : <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Aucun seuil configure</div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 } as any}>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(56,189,248,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil bas</div>
                  <input type="number" step="0.1" value={thMin} onChange={(e: any) => setThMin(e.target.value)} placeholder="Min" style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil haut</div>
                  <input type="number" step="0.1" value={thMax} onChange={(e: any) => setThMax(e.target.value)} placeholder="Max" style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.2)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div data-testid="save-threshold-btn" onClick={async () => {
                  setThSaving(true);
                  try {
                    await apiFetch('/api/health/thresholds', { method: 'POST', body: JSON.stringify({ metric_id: key, min_val: thMin ? parseFloat(thMin) : null, max_val: thMax ? parseFloat(thMax) : null }) }, token);
                    setThreshold({ metric_id: key, min_val: thMin ? parseFloat(thMin) : null, max_val: thMax ? parseFloat(thMax) : null });
                    setThEdit(false);
                  } catch {} finally { setThSaving(false); }
                }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: color, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF' } as any}>{thSaving ? '...' : 'Sauvegarder'}</div>
                <div onClick={() => setThEdit(false)} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
              </div>
            </div>
          )}
        </div>
          );
        })()}

      </div>
    </div>
  );
}
