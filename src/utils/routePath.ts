/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeliveryStatus = 'idle' | 'dispatching' | 'delivered';

export interface RouteProgress {
  status: DeliveryStatus;
  progress: number; // 0 to 1
  destinationIndex: number;
}

export interface RoutePoint {
  x: number;
  y: number;
  angle: number;
  progress: number;
  segmentIndex: number;
}

export interface CubicSegment {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
}

/**
 * The canonical winding midnight flight path across the 5 rooftop stations
 * in SVG coordinates (viewBox 0 0 800 450).
 * Waypoints:
 * 0: Whispering Gable (130, 265)
 * 1: Copper Clocktower (320, 150)
 * 2: Beacon Point (490, 130)
 * 3: Cloud Nine Spire (650, 175)
 * 4: Harbor Tugboat (735, 295)
 */
export const ROUTE_SEGMENTS: CubicSegment[] = [
  {
    p0: { x: 130, y: 265 },
    p1: { x: 195, y: 145 },
    p2: { x: 255, y: 120 },
    p3: { x: 320, y: 150 },
  },
  {
    p0: { x: 320, y: 150 },
    p1: { x: 380, y: 178 },
    p2: { x: 430, y: 100 },
    p3: { x: 490, y: 130 },
  },
  {
    p0: { x: 490, y: 130 },
    p1: { x: 550, y: 160 },
    p2: { x: 600, y: 135 },
    p3: { x: 650, y: 175 },
  },
  {
    p0: { x: 650, y: 175 },
    p1: { x: 695, y: 210 },
    p2: { x: 712, y: 255 },
    p3: { x: 735, y: 295 },
  },
];

export const ROUTE_SVG_PATH =
  'M 130 265 C 195 145, 255 120, 320 150 C 380 178, 430, 100, 490 130 C 550 160, 600 135, 650 175 C 695 210, 712 255, 735 295';

/**
 * Normalized scroll progress thresholds [0..1] where Pip reaches each of the 5 stations.
 */
export const STATION_THRESHOLDS: readonly number[] = [0.02, 0.29, 0.53, 0.76, 0.95];

function evalCubicPoint(seg: CubicSegment, t: number): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * seg.p0.x + 3 * uu * t * seg.p1.x + 3 * u * tt * seg.p2.x + ttt * seg.p3.x,
    y: uuu * seg.p0.y + 3 * uu * t * seg.p1.y + 3 * u * tt * seg.p2.y + ttt * seg.p3.y,
  };
}

function evalCubicTangent(seg: CubicSegment, t: number): { dx: number; dy: number } {
  const u = 1 - t;
  const dx =
    3 * u * u * (seg.p1.x - seg.p0.x) +
    6 * u * t * (seg.p2.x - seg.p1.x) +
    3 * t * t * (seg.p3.x - seg.p2.x);
  const dy =
    3 * u * u * (seg.p1.y - seg.p0.y) +
    6 * u * t * (seg.p2.y - seg.p1.y) +
    3 * t * t * (seg.p3.y - seg.p2.y);
  return { dx, dy };
}

interface ArcSample {
  s: number; // normalized arc length 0..1
  x: number;
  y: number;
  angle: number;
  segmentIndex: number;
}

const ARC_SAMPLES: ArcSample[] = (() => {
  const stepsPerSeg = 60;
  const raw: { dist: number; x: number; y: number; angle: number; segmentIndex: number }[] = [];
  let totalDist = 0;
  let prev = evalCubicPoint(ROUTE_SEGMENTS[0], 0);

  for (let segIdx = 0; segIdx < ROUTE_SEGMENTS.length; segIdx++) {
    const seg = ROUTE_SEGMENTS[segIdx];
    const startStep = segIdx === 0 ? 0 : 1;
    for (let i = startStep; i <= stepsPerSeg; i++) {
      const t = i / stepsPerSeg;
      const pt = evalCubicPoint(seg, t);
      const tan = evalCubicTangent(seg, t);
      const d = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      totalDist += d;
      prev = pt;
      const rawAngle = (Math.atan2(tan.dy, tan.dx) * 180) / Math.PI;
      const clampedAngle = Math.max(-24, Math.min(24, rawAngle * 0.42));
      raw.push({
        dist: totalDist,
        x: pt.x,
        y: pt.y,
        angle: clampedAngle,
        segmentIndex: segIdx,
      });
    }
  }

  const safeTotal = totalDist > 0 ? totalDist : 1;
  return raw.map((item) => ({
    s: item.dist / safeTotal,
    x: item.x,
    y: item.y,
    angle: item.angle,
    segmentIndex: item.segmentIndex,
  }));
})();

/**
 * Evaluates Pip's exact (x, y) SVG coordinates and subtle banking angle along
 * the dream delivery route for any normalized progress in [0, 1].
 */
export function getPointOnRoute(progress: number): RoutePoint {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  if (clamped <= 0) {
    const first = ARC_SAMPLES[0];
    return { x: first.x, y: first.y, angle: first.angle, progress: 0, segmentIndex: 0 };
  }
  if (clamped >= 1) {
    const last = ARC_SAMPLES[ARC_SAMPLES.length - 1];
    return { x: last.x, y: last.y, angle: 0, progress: 1, segmentIndex: last.segmentIndex };
  }

  // Binary search in ARC_SAMPLES
  let lo = 0;
  let hi = ARC_SAMPLES.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (ARC_SAMPLES[mid].s <= clamped) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const a = ARC_SAMPLES[lo];
  const b = ARC_SAMPLES[hi];
  const span = Math.max(1e-6, b.s - a.s);
  const alpha = Math.min(1, Math.max(0, (clamped - a.s) / span));

  return {
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
    angle: a.angle + (b.angle - a.angle) * alpha,
    progress: clamped,
    segmentIndex: b.segmentIndex,
  };
}

/**
 * Returns how many stations (0..5) have been reached at a given normalized progress [0..1].
 */
export function getReachedStationCount(progress: number): number {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  let count = 0;
  for (let i = 0; i < STATION_THRESHOLDS.length; i++) {
    if (clamped >= STATION_THRESHOLDS[i]) {
      count = i + 1;
    }
  }
  return count;
}

/**
 * Maps a section's bounding-rect top & height relative to the viewport height
 * into a normalized scroll progress value in [0, 1].
 */
export function computeSectionScrollProgress(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number
): number {
  if (viewportHeight <= 0 || rectHeight <= 0) return 0;
  const startTop = viewportHeight * 0.58;
  const endTop = -Math.min(70, Math.max(20, (rectHeight - viewportHeight) * 0.35));
  const span = Math.max(120, startTop - endTop);
  const raw = (startTop - rectTop) / span;
  return Math.min(1, Math.max(0, raw));
}

export function calculateProgress(elapsedMs: number, totalDurationMs: number): number {
  if (totalDurationMs <= 0) return 1;
  const raw = elapsedMs / totalDurationMs;
  return Math.min(1, Math.max(0, raw));
}

export function getDeliveryMessage(
  status: DeliveryStatus,
  destinationName: string,
  progress: number
): string {
  if (status === 'idle') {
    return `Ready for departure to ${destinationName}. Scroll or click a rooftop to launch!`;
  }
  if (status === 'dispatching') {
    const pct = Math.round(progress * 100);
    return `🚀 Gliding through starlight toward ${destinationName}... (${pct}%)`;
  }
  return `✨ Dream safely tucked into bed at ${destinationName}! Rest well.`;
}
