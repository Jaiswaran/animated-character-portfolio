/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, damp, fitCameraDistance, limitToUnitCircle, pointerToGaze } from './gaze.ts';

const rect = { left: 100, top: 100, width: 200, height: 250 };

test('gaze: pointer at the centre of the character looks straight ahead', () => {
  const gaze = pointerToGaze(200, 225, rect);
  assert.equal(gaze.x, 0);
  assert.equal(gaze.y, 0);
});

test('gaze: pointer to the right/below gives positive x/y, left/above gives negative', () => {
  const rightDown = pointerToGaze(260, 300, rect);
  assert.ok(rightDown.x > 0 && rightDown.y > 0);
  const leftUp = pointerToGaze(140, 150, rect);
  assert.ok(leftUp.x < 0 && leftUp.y < 0);
});

test('gaze: far-away pointers are clamped inside the unit circle', () => {
  for (const [x, y] of [[5000, 5000], [-5000, 5000], [5000, -5000], [-5000, -5000], [0, 0]]) {
    const gaze = pointerToGaze(x, y, rect);
    assert.ok(Math.hypot(gaze.x, gaze.y) <= 1 + 1e-9, `(${x}, ${y}) escaped the unit circle`);
  }
});

test('gaze: degenerate rectangles and reach values fall back to centre', () => {
  assert.deepEqual(pointerToGaze(10, 10, { left: 0, top: 0, width: 0, height: 100 }), { x: 0, y: 0 });
  assert.deepEqual(pointerToGaze(10, 10, rect, 0), { x: 0, y: 0 });
});

test('gaze: limitToUnitCircle leaves inner vectors alone and normalises outer ones', () => {
  assert.deepEqual(limitToUnitCircle({ x: 0.3, y: -0.4 }), { x: 0.3, y: -0.4 });
  const limited = limitToUnitCircle({ x: 3, y: 4 });
  assert.ok(Math.abs(limited.x - 0.6) < 1e-9);
  assert.ok(Math.abs(limited.y - 0.8) < 1e-9);
});

test('gaze: clamp and damp behave', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(damp(0, 10, 8, 0), 0);
  const step = damp(0, 10, 8, 1 / 60);
  assert.ok(step > 0 && step < 10);
  assert.ok(damp(0, 10, 8, 100) > 9.999);
});

test('gaze: fitCameraDistance never goes closer than the minimum and grows for narrow canvases', () => {
  const wide = fitCameraDistance(5.4, 30, 1.2, 13);
  const narrow = fitCameraDistance(5.4, 30, 0.5, 13);
  assert.equal(wide, 13);
  assert.ok(narrow > 13);
  assert.equal(fitCameraDistance(5.4, 30, 0, 13), 13);
});
