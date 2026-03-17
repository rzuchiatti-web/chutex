import React from 'react';

/* ══════════════════════════════════════════════════════
   SleepHypnogram V2 — Premium Whoop-style sleep visualization
   Renders a filled area step-chart with gradient fills,
   smooth transitions, and animated entrance.
   ══════════════════════════════════════════════════════ */

type SleepStage = 'awake' | 'rem' | 'light' | 'deep' | 'unknown';

type SleepPoint = {
  timestamp: string;
  stage: SleepStage;
};

type SleepSession = {
  startTime: string;
  endTime: string;
  points: SleepPoint[];
};

type Segment = {
  start: number;
  end: number;
  stage: SleepStage;
};

type SleepHypnogramProps = {
  session: SleepSession;
  width?: number;
  height?: number;
  showLabels?: boolean;
  timeLabelCount?: number;
  smoothShortSpikes?: boolean;
  minStageDurationMinutes?: number;
  compact?: boolean;
};

const STAGE_COLORS: Record<SleepStage, string> = {
  awake: '#F87171',
  rem: '#C4B5FD',
  light: '#818CF8',
  deep: '#4338CA',
  unknown: 'rgba(255,255,255,0.06)',
};

const STAGE_GLOW: Record<SleepStage, string> = {
  awake: 'rgba(248,113,113,0.5)',
  rem: 'rgba(196,181,253,0.4)',
  light: 'rgba(129,140,248,0.35)',
  deep: 'rgba(67,56,202,0.5)',
  unknown: 'transparent',
};

const STAGE_Y: Record<SleepStage, number> = {
  awake: 0.04,
  rem: 0.30,
  light: 0.58,
  deep: 0.88,
  unknown: 0.58,
};

const STAGE_ORDER: SleepStage[] = ['awake', 'rem', 'light', 'deep'];
const STAGE_LABELS: Record<SleepStage, string> = { awake: 'Eveil', rem: 'REM', light: 'Leger', deep: 'Profond', unknown: '' };

function safeParseDate(s: string): number {
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function parseAndNormalizePoints(session: SleepSession): { ts: number; stage: SleepStage }[] {
  const start = safeParseDate(session.startTime);
  const end = safeParseDate(session.endTime);
  if (!start || !end || end <= start) return [];
  const valid = session.points
    .map(p => ({ ts: safeParseDate(p.timestamp), stage: p.stage }))
    .filter(p => p.ts > 0 && p.ts >= start && p.ts <= end && (STAGE_ORDER.includes(p.stage) || p.stage === 'unknown'))
    .sort((a, b) => a.ts - b.ts);
  const deduped: typeof valid = [];
  for (const p of valid) {
    if (deduped.length > 0 && deduped[deduped.length - 1].ts === p.ts) {
      deduped[deduped.length - 1] = p;
    } else {
      deduped.push(p);
    }
  }
  return deduped;
}

function buildSegments(points: { ts: number; stage: SleepStage }[], startMs: number, endMs: number): Segment[] {
  if (points.length === 0) return [];
  const segments: Segment[] = [];
  for (let i = 0; i < points.length; i++) {
    const segEnd = i < points.length - 1 ? points[i + 1].ts : endMs;
    segments.push({ start: points[i].ts, end: segEnd, stage: points[i].stage });
  }
  return segments;
}

function mergeConsecutiveSegments(segments: Segment[]): Segment[] {
  if (segments.length === 0) return [];
  const merged: Segment[] = [{ ...segments[0] }];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    if (segments[i].stage === last.stage) {
      last.end = segments[i].end;
    } else {
      merged.push({ ...segments[i] });
    }
  }
  return merged;
}

function smoothSegments(segments: Segment[], minMs: number): Segment[] {
  if (segments.length <= 2) return segments;
  const result = [...segments];
  let changed = true;
  let passes = 0;
  while (changed && passes < 3) {
    changed = false;
    passes++;
    for (let i = 1; i < result.length - 1; i++) {
      const dur = result[i].end - result[i].start;
      if (dur < minMs && result[i].stage !== 'unknown') {
        const prev = result[i - 1];
        const next = result[i + 1];
        if (prev.stage === next.stage) {
          prev.end = next.end;
          result.splice(i, 2);
          changed = true;
          i--;
        } else {
          const prevDur = prev.end - prev.start;
          const nextDur = next.end - next.start;
          if (prevDur >= nextDur) {
            prev.end = result[i].end;
            result.splice(i, 1);
          } else {
            next.start = result[i].start;
            result.splice(i, 1);
          }
          changed = true;
          i--;
        }
      }
    }
  }
  return mergeConsecutiveSegments(result);
}

function timeToX(ts: number, startMs: number, endMs: number, innerWidth: number): number {
  const range = endMs - startMs;
  if (range <= 0) return 0;
  return ((ts - startMs) / range) * innerWidth;
}

function stageToY(stage: SleepStage, graphTop: number, graphHeight: number): number {
  return graphTop + STAGE_Y[stage] * graphHeight;
}

function formatTimeLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function generateTimeLabels(startMs: number, endMs: number, count: number): { ts: number; label: string }[] {
  if (count < 2) count = 2;
  const labels: { ts: number; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const ts = startMs + (i / (count - 1)) * (endMs - startMs);
    labels.push({ ts, label: formatTimeLabel(ts) });
  }
  return labels;
}

export function fromBraceletStages(
  stages: number[],
  startHour = 22,
  startMin = 30,
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
  const points: SleepPoint[] = [];
  for (let i = 0; i < stages.length; i++) {
    const ts = new Date(start.getTime() + i * 60 * 1000);
    const stage = stageMap[stages[i]] || 'unknown';
    points.push({ timestamp: ts.toISOString(), stage });
  }
  const endTime = new Date(start.getTime() + stages.length * 60 * 1000);
  return { startTime: start.toISOString(), endTime: endTime.toISOString(), points };
}

export default function SleepHypnogram({
  session,
  width = 640,
  height = 200,
  showLabels = true,
  timeLabelCount = 5,
  smoothShortSpikes = true,
  minStageDurationMinutes = 3,
  compact = false,
}: SleepHypnogramProps) {

  const startMs = safeParseDate(session.startTime);
  const endMs = safeParseDate(session.endTime);

  if (!startMs || !endMs || endMs <= startMs || session.points.length === 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="11">
          Aucune donnee de sommeil
        </text>
      </svg>
    );
  }

  const labelW = compact ? 0 : 54;
  const padRight = 8;
  const graphTop = compact ? 4 : 8;
  const graphBottom = compact ? 4 : 24;
  const graphHeight = height - graphTop - graphBottom;
  const innerWidth = width - labelW - padRight;

  const rawPoints = parseAndNormalizePoints(session);
  const rawSegments = buildSegments(rawPoints, startMs, endMs);
  const merged = mergeConsecutiveSegments(rawSegments);
  const segments = smoothShortSpikes ? smoothSegments(merged, minStageDurationMinutes * 60 * 1000) : merged;
  const timeLabels = generateTimeLabels(startMs, endMs, timeLabelCount);

  // Build SVG path: filled area from stage level down to bottom
  const buildAreaPath = (): string => {
    if (segments.length === 0) return '';
    let d = '';
    const bottom = graphTop + graphHeight;
    const firstX = labelW + timeToX(segments[0].start, startMs, endMs, innerWidth);
    d += `M ${firstX} ${bottom} `;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.stage === 'unknown') continue;
      const x1 = labelW + timeToX(seg.start, startMs, endMs, innerWidth);
      const x2 = labelW + timeToX(seg.end, startMs, endMs, innerWidth);
      const y = stageToY(seg.stage, graphTop, graphHeight);
      d += `L ${x1} ${y} L ${x2} ${y} `;
    }

    const lastSeg = segments[segments.length - 1];
    const lastX = labelW + timeToX(lastSeg.end, startMs, endMs, innerWidth);
    d += `L ${lastX} ${bottom} Z`;
    return d;
  };

  // Build the step line path (top edge only)
  const buildLinePath = (): string => {
    if (segments.length === 0) return '';
    let d = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.stage === 'unknown') continue;
      const x1 = labelW + timeToX(seg.start, startMs, endMs, innerWidth);
      const x2 = labelW + timeToX(seg.end, startMs, endMs, innerWidth);
      const y = stageToY(seg.stage, graphTop, graphHeight);
      d += i === 0 ? `M ${x1} ${y}` : `L ${x1} ${y}`;
      d += ` L ${x2} ${y}`;
    }
    return d;
  };

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sleepAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#818CF8" stopOpacity="0.25" />
          <stop offset="75%" stopColor="#4338CA" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4338CA" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="sleepLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="sleepGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Horizontal grid lines with stage labels */}
      {STAGE_ORDER.map(stage => {
        const y = stageToY(stage, graphTop, graphHeight);
        return (
          <g key={stage}>
            <line x1={labelW} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4,6" />
            {showLabels && !compact && (
              <text x={labelW - 8} y={y + 4} textAnchor="end" fill={STAGE_COLORS[stage]} fontSize="9" fontWeight="600" opacity="0.7">
                {STAGE_LABELS[stage]}
              </text>
            )}
          </g>
        );
      })}

      {/* Filled area */}
      <path d={buildAreaPath()} fill="url(#sleepAreaGrad)" />

      {/* Colored segment bars */}
      {segments.map((seg, i) => {
        if (seg.stage === 'unknown') return null;
        const x1 = labelW + timeToX(seg.start, startMs, endMs, innerWidth);
        const x2 = labelW + timeToX(seg.end, startMs, endMs, innerWidth);
        const y = stageToY(seg.stage, graphTop, graphHeight);
        const w = Math.max(1, x2 - x1);
        const color = STAGE_COLORS[seg.stage];
        return (
          <g key={`seg-${i}`}>
            {/* Glow bar */}
            <rect x={x1} y={y - 2.5} width={w} height={5} rx={2.5} fill={STAGE_GLOW[seg.stage]} filter="url(#sleepGlow)" />
            {/* Solid bar */}
            <rect x={x1} y={y - 2} width={w} height={4} rx={2} fill={color} opacity={0.9} />
          </g>
        );
      })}

      {/* Top edge glow line */}
      <path d={buildLinePath()} fill="none" stroke="url(#sleepLineGrad)" strokeWidth="1.5" opacity="0.5" />

      {/* Vertical connectors between stages */}
      {segments.map((seg, i) => {
        if (i >= segments.length - 1 || seg.stage === 'unknown') return null;
        const next = segments[i + 1];
        if (next.stage === 'unknown') return null;
        const x = labelW + timeToX(seg.end, startMs, endMs, innerWidth);
        const y1 = stageToY(seg.stage, graphTop, graphHeight);
        const y2 = stageToY(next.stage, graphTop, graphHeight);
        if (Math.abs(y2 - y1) < 2) return null;
        return (
          <line key={`conn-${i}`} x1={x} y1={y1} x2={x} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round" />
        );
      })}

      {/* X-axis time labels */}
      {showLabels && !compact && timeLabels.map((tl, i) => {
        const x = labelW + timeToX(tl.ts, startMs, endMs, innerWidth);
        return (
          <text
            key={i}
            x={Math.max(labelW, Math.min(width - padRight - 10, x))}
            y={height - 4}
            fill="rgba(255,255,255,0.3)"
            fontSize="9"
            fontWeight={i === 0 || i === timeLabels.length - 1 ? '700' : '400'}
            textAnchor={i === 0 ? 'start' : i === timeLabels.length - 1 ? 'end' : 'middle'}
          >
            {tl.label}
          </text>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sleepFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </svg>
  );
}
