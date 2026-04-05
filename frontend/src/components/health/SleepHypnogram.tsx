import React from 'react';

type SleepStage = 'awake' | 'rem' | 'light' | 'deep' | 'unknown';
type SleepSession = {
  startTime: string;
  endTime: string;
  points: { time: string; stage: SleepStage }[];
};

const STAGES: SleepStage[] = ['awake', 'rem', 'light', 'deep'];
const Y_POS: Record<SleepStage, number> = { awake: 0, rem: 0.28, light: 0.58, deep: 1, unknown: 0 };
const COLORS: Record<SleepStage, string> = { awake: '#E87C8A', rem: '#A8B4F0', light: '#6B7BD9', deep: '#3A4099', unknown: '#555' };
const LABELS: Record<SleepStage, string> = { awake: 'Eveil', rem: 'REM', light: 'Leger', deep: 'Profond', unknown: '' };
const GLOW: Record<SleepStage, string> = { awake: '#E87C8A40', rem: '#A8B4F040', light: '#6B7BD940', deep: '#3A409940', unknown: 'transparent' };

const STAGE_MAP: Record<number, SleepStage> = { 0: 'awake', 1: 'deep', 2: 'light', 3: 'rem' };

export function fromBraceletStages(stages: number[], startHour = 22, startMinute = 30): SleepSession {
  // Determine interval: if >200 stages, they're per-minute; otherwise per-5-min
  const INTERVAL = stages.length > 200 ? 1 : 5;
  const base = new Date();
  base.setHours(startHour, startMinute, 0, 0);
  if (startHour >= 18) base.setDate(base.getDate() - 1);
  const points = stages.map((s, i) => ({
    time: new Date(base.getTime() + i * INTERVAL * 60000).toISOString(),
    stage: STAGE_MAP[s] || 'unknown' as SleepStage,
  }));
  return {
    startTime: points[0]?.time || base.toISOString(),
    endTime: new Date(base.getTime() + stages.length * INTERVAL * 60000).toISOString(),
    points,
  };
}


function parseDate(s: string): number | null {
  if (!s) return null;
  const t = new Date(s).getTime();
  return isNaN(t) ? null : t;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Segment = { start: number; end: number; stage: SleepStage };
function buildSegments(session: SleepSession): Segment[] {
  const segs: Segment[] = [];
  const pts = session.points;
  if (pts.length === 0) return segs;
  const startMs = parseDate(session.startTime) || parseDate(pts[0].time) || 0;
  const endMs = parseDate(session.endTime) || parseDate(pts[pts.length - 1].time) || 0;
  for (let i = 0; i < pts.length; i++) {
    const t = parseDate(pts[i].time) || 0;
    const next = i + 1 < pts.length ? (parseDate(pts[i + 1].time) || 0) : endMs;
    segs.push({ start: t, end: next, stage: pts[i].stage });
  }
  return segs;
}

type Props = {
  session: SleepSession;
  width?: number;
  height?: number;
  showLabels?: boolean;
  timeLabelCount?: number;
  smoothShortSpikes?: boolean;
  minStageDurationMinutes?: number;
  compact?: boolean;
  light?: boolean;
};

export default function SleepHypnogram({ session, compact = false, light = false }: Props) {
  const W = 480;
  const H = compact ? 120 : 220;
  const LEFT = compact ? 0 : 64;
  const RIGHT = 10;
  const TOP = 12;
  const BOTTOM = compact ? 4 : 30;
  const GH = H - TOP - BOTTOM;
  const GW = W - LEFT - RIGHT;

  const startMs = parseDate(session.startTime);
  const endMs = parseDate(session.endTime);

  if (!startMs || !endMs || endMs <= startMs || session.points.length === 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fill={light ? '#9CA3AF' : 'rgba(255,255,255,0.2)'} fontSize="14" fontFamily="Inter, system-ui, sans-serif">
          Aucune donnee
        </text>
      </svg>
    );
  }

  const segments = buildSegments(session);
  const toX = (ts: number) => LEFT + ((ts - startMs) / (endMs - startMs)) * GW;
  const toY = (stage: SleepStage) => TOP + Y_POS[stage] * GH;

  const gridColor = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const axisTextColor = light ? '#9CA3AF' : 'rgba(255,255,255,0.45)';
  const connectorColor = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const barH = light ? 12 : 8;
  const barR = light ? 5 : 4;

  const labelCount = compact ? 3 : 6;
  const timeLabels = Array.from({ length: labelCount }, (_, i) => {
    const ts = startMs + (i / (labelCount - 1)) * (endMs - startMs);
    return { ts, label: formatTime(ts) };
  });

  // Area path
  let area = `M ${toX(segments[0].start)} ${TOP + GH} `;
  for (const seg of segments) {
    if (seg.stage === 'unknown') continue;
    area += `L ${toX(seg.start)} ${toY(seg.stage)} L ${toX(seg.end)} ${toY(seg.stage)} `;
  }
  area += `L ${toX(segments[segments.length - 1].end)} ${TOP + GH} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaFillL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E87C8A" stopOpacity="0.04" />
          <stop offset="30%" stopColor="#A8B4F0" stopOpacity="0.08" />
          <stop offset="60%" stopColor="#6B7BD9" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3A4099" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="areaFillD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.3" />
          <stop offset="45%" stopColor="#818CF8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4338CA" stopOpacity="0.12" />
        </linearGradient>
        {!light && <filter id="glow3"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>}
      </defs>

      {/* Y-axis labels + grid lines */}
      {!compact && STAGES.map(stage => {
        const y = toY(stage);
        return (
          <g key={stage}>
            <line x1={LEFT} y1={y} x2={W - RIGHT} y2={y} stroke={gridColor} strokeDasharray="4,6" />
            <text x={LEFT - 8} y={y + 4} textAnchor="end" fill={light ? COLORS[stage] : COLORS[stage]} fontSize="10" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
              {LABELS[stage]}
            </text>
          </g>
        );
      })}

      {/* Filled area behind bars */}
      <path d={area} fill={light ? 'url(#areaFillL)' : 'url(#areaFillD)'} />

      {/* Stage bars — thick rounded colored bars */}
      {segments.map((seg, i) => {
        if (seg.stage === 'unknown') return null;
        const x1 = toX(seg.start);
        const x2 = toX(seg.end);
        const y = toY(seg.stage);
        const w = Math.max(2, x2 - x1);
        return (
          <g key={`s${i}`}>
            {!light && <rect x={x1} y={y - barH / 2 - 2} width={w} height={barH + 4} rx={barR + 1} fill={GLOW[seg.stage]} filter="url(#glow3)" />}
            <rect x={x1} y={y - barH / 2} width={w} height={barH} rx={barR} fill={COLORS[seg.stage]} opacity={light ? 0.9 : 0.85} />
          </g>
        );
      })}

      {/* Vertical connectors between stages */}
      {segments.map((seg, i) => {
        if (i >= segments.length - 1 || seg.stage === 'unknown') return null;
        const next = segments[i + 1];
        if (next.stage === 'unknown') return null;
        const x = toX(seg.end);
        const y1 = toY(seg.stage);
        const y2 = toY(next.stage);
        if (Math.abs(y2 - y1) < 4) return null;
        return <line key={`c${i}`} x1={x} y1={y1} x2={x} y2={y2} stroke={connectorColor} strokeWidth="1.5" strokeLinecap="round" />;
      })}

      {/* X-axis time labels */}
      {!compact && timeLabels.map((tl, i) => {
        const x = toX(tl.ts);
        return (
          <g key={`t${i}`}>
            <line x1={x} y1={TOP + GH} x2={x} y2={TOP + GH + 5} stroke={gridColor} strokeWidth="1" />
            <text x={x} y={H - 6} fill={axisTextColor} fontSize="10" fontWeight="600" fontFamily="Inter, system-ui, sans-serif" textAnchor="middle">{tl.label}</text>
          </g>
        );
      })}

      {/* Axes */}
      {!compact && <line x1={LEFT} y1={TOP} x2={LEFT} y2={TOP + GH} stroke={gridColor} strokeWidth="1" />}
      {!compact && <line x1={LEFT} y1={TOP + GH} x2={W - RIGHT} y2={TOP + GH} stroke={gridColor} strokeWidth="1" />}
    </svg>
  );
}
