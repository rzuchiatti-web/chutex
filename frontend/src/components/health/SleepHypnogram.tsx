import React from 'react';

/* ══════════════════════════════════════════════════════
   SleepHypnogram V3 — Refonte complète, labels lisibles
   ══════════════════════════════════════════════════════ */

type SleepStage = 'awake' | 'rem' | 'light' | 'deep' | 'unknown';
type SleepPoint = { timestamp: string; stage: SleepStage };
type SleepSession = { startTime: string; endTime: string; points: SleepPoint[] };
type Segment = { start: number; end: number; stage: SleepStage };

const COLORS: Record<SleepStage, string> = {
  awake: '#F87171', rem: '#C4B5FD', light: '#818CF8', deep: '#4338CA', unknown: 'rgba(255,255,255,0.06)',
};
const GLOW: Record<SleepStage, string> = {
  awake: 'rgba(248,113,113,0.45)', rem: 'rgba(196,181,253,0.35)', light: 'rgba(129,140,248,0.3)', deep: 'rgba(67,56,202,0.45)', unknown: 'transparent',
};
const Y_POS: Record<SleepStage, number> = { awake: 0.06, rem: 0.32, light: 0.58, deep: 0.88, unknown: 0.58 };
const STAGES: SleepStage[] = ['awake', 'rem', 'light', 'deep'];
const LABELS: Record<SleepStage, string> = { awake: 'Eveil', rem: 'REM', light: 'Leger', deep: 'Profond', unknown: '' };

function parseDate(s: string): number { const d = new Date(s); return isNaN(d.getTime()) ? 0 : d.getTime(); }

function buildSegments(session: SleepSession): Segment[] {
  const start = parseDate(session.startTime);
  const end = parseDate(session.endTime);
  if (!start || !end || end <= start) return [];
  const pts = session.points
    .map(p => ({ ts: parseDate(p.timestamp), stage: p.stage }))
    .filter(p => p.ts >= start && p.ts <= end)
    .sort((a, b) => a.ts - b.ts);
  if (pts.length === 0) return [];
  const segs: Segment[] = [];
  for (let i = 0; i < pts.length; i++) {
    const segEnd = i < pts.length - 1 ? pts[i + 1].ts : end;
    if (segs.length > 0 && segs[segs.length - 1].stage === pts[i].stage) {
      segs[segs.length - 1].end = segEnd;
    } else {
      segs.push({ start: pts[i].ts, end: segEnd, stage: pts[i].stage });
    }
  }
  // Smooth out very short spikes
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < segs.length - 1; i++) {
      if (segs[i].end - segs[i].start < 3 * 60000) {
        const prev = segs[i - 1];
        prev.end = segs[i + 1]?.stage === prev.stage ? segs[i + 1].end : segs[i].end;
        if (segs[i + 1]?.stage === prev.stage) segs.splice(i, 2); else segs.splice(i, 1);
        changed = true; break;
      }
    }
  }
  return segs;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fromBraceletStages(
  stages: number[], startHour = 22, startMin = 30,
  stageMap: Record<number, SleepStage> = { 0: 'awake', 1: 'deep', 2: 'light', 3: 'rem' }
): SleepSession {
  if (!stages || stages.length === 0) {
    const now = new Date();
    return { startTime: now.toISOString(), endTime: now.toISOString(), points: [] };
  }
  const now = new Date();
  const start = new Date(now);
  start.setHours(startHour, startMin, 0, 0);
  if (start.getTime() > now.getTime()) start.setDate(start.getDate() - 1);
  const points: SleepPoint[] = stages.map((s, i) => ({
    timestamp: new Date(start.getTime() + i * 60000).toISOString(),
    stage: stageMap[s] || 'unknown',
  }));
  return { startTime: start.toISOString(), endTime: new Date(start.getTime() + stages.length * 60000).toISOString(), points };
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
};

export default function SleepHypnogram({ session, compact = false }: Props) {
  const W = 500;
  const H = compact ? 160 : 340;
  const LEFT = compact ? 0 : 80;
  const RIGHT = 16;
  const TOP = 24;
  const BOTTOM = compact ? 8 : 50;
  const GH = H - TOP - BOTTOM;
  const GW = W - LEFT - RIGHT;

  const startMs = parseDate(session.startTime);
  const endMs = parseDate(session.endTime);

  if (!startMs || !endMs || endMs <= startMs || session.points.length === 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="16" fontFamily="Inter, system-ui, sans-serif">
          Aucune donnee
        </text>
      </svg>
    );
  }

  const segments = buildSegments(session);
  const toX = (ts: number) => LEFT + ((ts - startMs) / (endMs - startMs)) * GW;
  const toY = (stage: SleepStage) => TOP + Y_POS[stage] * GH;

  // Time labels
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

  // Line path
  let line = '';
  segments.forEach((seg, i) => {
    if (seg.stage === 'unknown') return;
    const cmd = i === 0 ? 'M' : 'L';
    line += `${cmd} ${toX(seg.start)} ${toY(seg.stage)} L ${toX(seg.end)} ${toY(seg.stage)} `;
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.3" />
          <stop offset="45%" stopColor="#818CF8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4338CA" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="glow3">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Y-axis labels + grid */}
      {!compact && STAGES.map(stage => {
        const y = toY(stage);
        return (
          <g key={stage}>
            <line x1={LEFT} y1={y} x2={W - RIGHT} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,5" />
            <text x={LEFT - 12} y={y + 5} textAnchor="end" fill={COLORS[stage]} fontSize="14" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
              {LABELS[stage]}
            </text>
          </g>
        );
      })}

      {/* Filled area */}
      <path d={area} fill="url(#areaFill)" />

      {/* Stage bars with glow */}
      {segments.map((seg, i) => {
        if (seg.stage === 'unknown') return null;
        const x1 = toX(seg.start);
        const x2 = toX(seg.end);
        const y = toY(seg.stage);
        const w = Math.max(2, x2 - x1);
        return (
          <g key={`s${i}`}>
            <rect x={x1} y={y - 4} width={w} height={8} rx={4} fill={GLOW[seg.stage]} filter="url(#glow3)" />
            <rect x={x1} y={y - 3} width={w} height={6} rx={3} fill={COLORS[seg.stage]} opacity={0.85} />
          </g>
        );
      })}

      {/* Edge line */}
      <path d={line} fill="none" stroke="url(#lineStroke)" strokeWidth="2" opacity="0.4" />

      {/* Vertical connectors */}
      {segments.map((seg, i) => {
        if (i >= segments.length - 1 || seg.stage === 'unknown') return null;
        const next = segments[i + 1];
        if (next.stage === 'unknown') return null;
        const x = toX(seg.end);
        const y1 = toY(seg.stage);
        const y2 = toY(next.stage);
        if (Math.abs(y2 - y1) < 4) return null;
        return <line key={`c${i}`} x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />;
      })}

      {/* X-axis time labels */}
      {!compact && timeLabels.map((tl, i) => {
        const x = toX(tl.ts);
        return (
          <g key={`t${i}`}>
            <line x1={x} y1={TOP + GH} x2={x} y2={TOP + GH + 6} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text
              x={x}
              y={H - 10}
              fill="rgba(255,255,255,0.45)"
              fontSize="14"
              fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif"
              textAnchor="middle"
            >
              {tl.label}
            </text>
          </g>
        );
      })}

      {/* Left axis line */}
      {!compact && <line x1={LEFT} y1={TOP} x2={LEFT} y2={TOP + GH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />}
      {/* Bottom axis line */}
      {!compact && <line x1={LEFT} y1={TOP + GH} x2={W - RIGHT} y2={TOP + GH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />}
    </svg>
  );
}
