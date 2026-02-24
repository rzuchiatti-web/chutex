import React from 'react';

/* ══════════════════════════════════════════════════════
   SleepHypnogram — Dynamic sleep stage visualization
   Renders a step-chart hypnogram from bracelet sleep data.
   Designed for dark backgrounds (CARE WATCH app).
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
  start: number; // ms since epoch
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
  /** Compact mode for card preview (no Y labels, less padding) */
  compact?: boolean;
};

/* ── Stage colors (dark theme optimized) ── */
const STAGE_COLORS: Record<SleepStage, string> = {
  awake: '#E87C8A',
  rem: '#A8B4F0',
  light: '#6B7BD9',
  deep: '#3A4099',
  unknown: 'rgba(255,255,255,0.06)',
};

/* ── Stage Y levels (0 = top, 1 = bottom) ── */
const STAGE_Y: Record<SleepStage, number> = {
  awake: 0,
  rem: 0.28,
  light: 0.58,
  deep: 0.92,
  unknown: 0.58,
};

const STAGE_ORDER: SleepStage[] = ['awake', 'rem', 'light', 'deep'];

/* ── Helper: parse and validate ISO date ── */
function safeParseDate(s: string): number {
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/* ── Parse raw points into sorted, valid points ── */
function parseAndNormalizePoints(session: SleepSession): { ts: number; stage: SleepStage }[] {
  const start = safeParseDate(session.startTime);
  const end = safeParseDate(session.endTime);
  if (!start || !end || end <= start) return [];

  const valid = session.points
    .map(p => ({ ts: safeParseDate(p.timestamp), stage: p.stage }))
    .filter(p => p.ts > 0 && p.ts >= start && p.ts <= end && STAGE_ORDER.includes(p.stage) || p.stage === 'unknown')
    .sort((a, b) => a.ts - b.ts);

  // Deduplicate: keep last point per timestamp
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

/* ── Build segments from points ── */
function buildSegments(points: { ts: number; stage: SleepStage }[], startMs: number, endMs: number): Segment[] {
  if (points.length === 0) return [];
  const segments: Segment[] = [];
  for (let i = 0; i < points.length; i++) {
    const segEnd = i < points.length - 1 ? points[i + 1].ts : endMs;
    segments.push({ start: points[i].ts, end: segEnd, stage: points[i].stage });
  }
  return segments;
}

/* ── Merge consecutive same-stage segments ── */
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

/* ── Smooth short spikes ── */
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
        // Merge with neighbor that has same stage, or with longer neighbor
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

/* ── Time to X coordinate ── */
function timeToX(ts: number, startMs: number, endMs: number, innerWidth: number): number {
  const range = endMs - startMs;
  if (range <= 0) return 0;
  return ((ts - startMs) / range) * innerWidth;
}

/* ── Stage to Y coordinate ── */
function stageToY(stage: SleepStage, graphTop: number, graphHeight: number): number {
  return graphTop + STAGE_Y[stage] * graphHeight;
}

/* ── Format time label ── */
function formatTimeLabel(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}:${String(m).padStart(2, '0')}`;
}

/* ── Generate evenly spaced time labels ── */
function generateTimeLabels(startMs: number, endMs: number, count: number): { ts: number; label: string }[] {
  if (count < 2) count = 2;
  const labels: { ts: number; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const ts = startMs + (i / (count - 1)) * (endMs - startMs);
    labels.push({ ts, label: formatTimeLabel(ts) });
  }
  return labels;
}

/* ── Transform bracelet raw stages to SleepSession ── */
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

/* ══════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════ */

export default function SleepHypnogram({
  session,
  width = 640,
  height = 180,
  showLabels = true,
  timeLabelCount = 4,
  smoothShortSpikes = true,
  minStageDurationMinutes = 3,
  compact = false,
}: SleepHypnogramProps) {

  const startMs = safeParseDate(session.startTime);
  const endMs = safeParseDate(session.endTime);

  // Empty state
  if (!startMs || !endMs || endMs <= startMs || session.points.length === 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="11">
          Aucune donnee de sommeil
        </text>
      </svg>
    );
  }

  // Layout constants
  const labelAreaWidth = compact ? 0 : 50;
  const labelAreaBottom = 20;
  const graphTop = 6;
  const graphHeight = height - graphTop - labelAreaBottom - 10;
  const innerWidth = width - labelAreaWidth - 10;
  const barThickness = compact ? 3 : 4;
  const connectorWidth = compact ? 2 : 3;

  // Process data
  const rawPoints = parseAndNormalizePoints(session);
  const rawSegments = buildSegments(rawPoints, startMs, endMs);
  const merged = mergeConsecutiveSegments(rawSegments);
  const segments = smoothShortSpikes
    ? smoothSegments(merged, minStageDurationMinutes * 60 * 1000)
    : merged;

  // Time labels
  const timeLabels = generateTimeLabels(startMs, endMs, timeLabelCount);

  // Render segments
  const renderSegments = () => {
    const els: React.ReactElement[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.stage === 'unknown') continue;

      const x1 = labelAreaWidth + timeToX(seg.start, startMs, endMs, innerWidth);
      const x2 = labelAreaWidth + timeToX(seg.end, startMs, endMs, innerWidth);
      const y = stageToY(seg.stage, graphTop, graphHeight);
      const segWidth = Math.max(1, x2 - x1);
      const color = STAGE_COLORS[seg.stage];
      const fillHeight = graphTop + graphHeight - y;

      // Filled area from stage level to bottom
      els.push(
        <rect
          key={`fill-${i}`}
          x={x1}
          y={y}
          width={segWidth}
          height={Math.max(0, fillHeight)}
          fill={color}
          opacity={seg.stage === 'awake' ? 0.25 : 0.2}
          rx={1}
        />
      );

      // Horizontal step bar
      els.push(
        <rect
          key={`bar-${i}`}
          x={x1}
          y={y - barThickness / 2}
          width={segWidth}
          height={barThickness}
          fill={color}
          rx={barThickness / 2}
        />
      );

      // Vertical connector to next segment
      if (i < segments.length - 1) {
        const nextSeg = segments[i + 1];
        if (nextSeg.stage !== 'unknown') {
          const ny = stageToY(nextSeg.stage, graphTop, graphHeight);
          const cy = Math.min(y, ny);
          const ch = Math.abs(ny - y);
          if (ch > 1) {
            // Gradient connector: blend from current to next color
            const nextColor = STAGE_COLORS[nextSeg.stage];
            const connX = x2 - connectorWidth / 2;
            els.push(
              <rect
                key={`conn-${i}`}
                x={connX}
                y={cy - barThickness / 2}
                width={connectorWidth}
                height={ch + barThickness}
                fill={ny > y ? nextColor : color}
                rx={connectorWidth / 2}
                opacity={0.7}
              />
            );
          }
        }
      }
    }

    return els;
  };

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>

      {/* Y-axis labels (non-compact) */}
      {showLabels && !compact && (
        <>
          <text x="0" y={stageToY('awake', graphTop, graphHeight) + 4} fill="rgba(255,255,255,0.25)" fontSize="9">Eveil</text>
          <text x="0" y={stageToY('rem', graphTop, graphHeight) + 4} fill="rgba(255,255,255,0.25)" fontSize="9">REM</text>
          <text x="0" y={stageToY('light', graphTop, graphHeight) + 4} fill="rgba(255,255,255,0.25)" fontSize="9">Leger</text>
          <text x="0" y={stageToY('deep', graphTop, graphHeight) + 4} fill="rgba(255,255,255,0.25)" fontSize="9">Profond</text>
        </>
      )}

      {/* Horizontal grid lines */}
      {STAGE_ORDER.map(stage => (
        <line
          key={stage}
          x1={labelAreaWidth}
          y1={stageToY(stage, graphTop, graphHeight)}
          x2={width - 5}
          y2={stageToY(stage, graphTop, graphHeight)}
          stroke="rgba(255,255,255,0.04)"
        />
      ))}

      {/* Segments */}
      {renderSegments()}

      {/* X-axis time labels */}
      {showLabels && timeLabels.map((tl, i) => {
        const x = labelAreaWidth + timeToX(tl.ts, startMs, endMs, innerWidth);
        const isEdge = i === 0 || i === timeLabels.length - 1;
        return (
          <text
            key={i}
            x={Math.max(labelAreaWidth, Math.min(width - 20, x))}
            y={height - 4}
            fill={isEdge ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)'}
            fontSize="9"
            fontWeight={isEdge ? '700' : '400'}
            textAnchor={i === 0 ? 'start' : i === timeLabels.length - 1 ? 'end' : 'middle'}
          >
            {tl.label}
          </text>
        );
      })}
    </svg>
  );
}
