/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure math helpers for Pip's 3D gaze. Kept free of Three.js so they can be unit-tested with node --test.
 */

export interface Gaze2D {
  /** -1 (far left) … 1 (far right) */
  x: number;
  /** -1 (far above) … 1 (far below), screen-space like CSS */
  y: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Convert a pointer position into a normalised gaze direction relative to the centre of `rect`.
 * `reach` is how many rect-widths/heights away the pointer must be before the gaze saturates,
 * so Pip keeps following the cursor well outside his own box but never spins out of range.
 */
export function pointerToGaze(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  reach: number = 0.9,
): Gaze2D {
  if (rect.width <= 0 || rect.height <= 0 || reach <= 0) return { x: 0, y: 0 };

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const x = (clientX - cx) / (rect.width * reach);
  const y = (clientY - cy) / (rect.height * reach);

  return limitToUnitCircle({ x: clamp(x, -1, 1), y: clamp(y, -1, 1) });
}

/**
 * Keep a gaze vector inside the unit circle so a pupil placed at (x, y) * radius
 * can never leave a round eye socket, even in the corners of the screen.
 */
export function limitToUnitCircle(gaze: Gaze2D): Gaze2D {
  const length = Math.hypot(gaze.x, gaze.y);
  if (length <= 1 || length === 0) return gaze;
  return { x: gaze.x / length, y: gaze.y / length };
}

/**
 * Frame-rate independent exponential smoothing. Larger `lambda` = snappier.
 */
export function damp(current: number, target: number, lambda: number, deltaSeconds: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * Math.max(0, deltaSeconds)));
}

/**
 * Distance the camera must sit from the model so `contentWidth` fits horizontally
 * for the given vertical field of view (degrees) and canvas aspect ratio (width / height).
 */
export function fitCameraDistance(
  contentWidth: number,
  fovDegrees: number,
  aspect: number,
  minDistance: number,
): number {
  if (aspect <= 0) return minDistance;
  const halfFov = (fovDegrees * Math.PI) / 360;
  return Math.max(minDistance, contentWidth / (2 * Math.tan(halfFov) * aspect));
}
