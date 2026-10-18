/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, getTempoLabel, calculateWindupPercentage, TUNES } from './lullaby.ts';
import { getGlowOption, GLOW_OPTIONS } from './nightlight.ts';
import { getNextWaypointIndex, DELIVERY_WAYPOINTS } from './delivery.ts';
import { formatOdometerDigits, validateDreamInput } from './counter.ts';
import { calculateTilt } from './tilt.ts';

test('lullaby: formatTime formats minutes and seconds correctly', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(225), '03:45');
});

test('lullaby: getTempoLabel categorizes tempos appropriately', () => {
  assert.equal(getTempoLabel(30), 'Deepest Slumber');
  assert.equal(getTempoLabel(42), 'Extra Drowsy');
  assert.equal(getTempoLabel(55), 'Gentle Waltz');
  assert.equal(getTempoLabel(80), 'Brisk Snooze');
});

test('lullaby: calculateWindupPercentage stays bounded between 0 and 100', () => {
  assert.equal(calculateWindupPercentage(50, 100), 50);
  assert.equal(calculateWindupPercentage(120, 100), 100);
  assert.equal(calculateWindupPercentage(-10, 100), 0);
  assert.equal(calculateWindupPercentage(0, 0), 0);
});

test('nightlight: getGlowOption falls back gracefully', () => {
  assert.equal(getGlowOption('amber').name, 'Amber Warmth');
  assert.equal(getGlowOption('lavender').name, 'Lavender Mist');
  assert.equal(getGlowOption('blush').name, 'Blush Twilight');
  assert.equal(getGlowOption('starlight').name, 'Deep Cosmos');
});

test('delivery: getNextWaypointIndex cycles smoothly', () => {
  assert.equal(getNextWaypointIndex(0, 3), 1);
  assert.equal(getNextWaypointIndex(1, 3), 2);
  assert.equal(getNextWaypointIndex(2, 3), 0);
});

test('counter: formatOdometerDigits formats numbers into fixed digit arrays', () => {
  assert.deepEqual(formatOdometerDigits(4829, 6), ['0', '0', '4', '8', '2', '9']);
  assert.deepEqual(formatOdometerDigits(0, 4), ['0', '0', '0', '0']);
});

test('counter: validateDreamInput catches empty or overlength submissions', () => {
  assert.equal(validateDreamInput('', 'Some thought').isValid, false);
  assert.equal(validateDreamInput('Pip', '').isValid, false);
  assert.equal(validateDreamInput('  ', '  ').isValid, false);
  assert.equal(validateDreamInput('Luna', 'Wishing sweet dreams!').isValid, true);
});


test('character tilt: all four card corners stay within the requested angle', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };

  assert.deepEqual(calculateTilt(100, 50, rect, 7), { rotateX: 7, rotateY: -7 });
  assert.deepEqual(calculateTilt(300, 50, rect, 7), { rotateX: 7, rotateY: 7 });
  assert.deepEqual(calculateTilt(100, 150, rect, 7), { rotateX: -7, rotateY: -7 });
  assert.deepEqual(calculateTilt(300, 150, rect, 7), { rotateX: -7, rotateY: 7 });
});

test('character tilt: pointer positions beyond the card are clamped and invalid sizes reset', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };

  assert.deepEqual(calculateTilt(900, -200, rect, 5), { rotateX: 5, rotateY: 5 });
  assert.deepEqual(calculateTilt(0, 0, { left: 0, top: 0, width: 0, height: 100 }), {
    rotateX: 0,
    rotateY: 0,
  });
});
