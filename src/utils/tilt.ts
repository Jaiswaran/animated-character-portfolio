/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TiltValues {
  rotateX: number; // degrees
  rotateY: number; // degrees
}

export function calculateTilt(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  maxDegrees: number = 7
): TiltValues {
  if (rect.width <= 0 || rect.height <= 0) {
    return { rotateX: 0, rotateY: 0 };
  }

  // Calculate normalized coordinate from -1 to 1 centered on rect
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;

  const normX = Math.min(1, Math.max(0, x)) * 2 - 1;
  const normY = Math.min(1, Math.max(0, y)) * 2 - 1;

  // Invert rotateX so hovering top tilts backwards
  let rotateX = Math.round(-normY * maxDegrees * 10) / 10;
  let rotateY = Math.round(normX * maxDegrees * 10) / 10;

  // Avoid -0 in strict checks
  if (Object.is(rotateX, -0)) rotateX = 0;
  if (Object.is(rotateY, -0)) rotateY = 0;

  return { rotateX, rotateY };
}
