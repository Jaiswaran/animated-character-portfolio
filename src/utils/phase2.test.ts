/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NOTE_FREQUENCIES,
  MELODY_PATTERNS,
  calculateRealDurationSeconds,
  getPatternTotalBeats,
} from './audioSynthesizer.ts';
import {
  calculateProgress,
  computeSectionScrollProgress,
  getDeliveryMessage,
  getPointOnRoute,
  getReachedStationCount,
  STATION_THRESHOLDS,
} from './routePath.ts';
import { calculateTilt } from './tilt.ts';
import { WebAudioSoundEffects } from './soundEffects.ts';
import type { SoundEffectType } from './soundEffects.ts';

test('audio: music box frequencies are defined and positive', () => {
  assert.equal(NOTE_FREQUENCIES.C5, 523.25);
  assert.equal(NOTE_FREQUENCIES.A4, 440.0);
  assert.ok(NOTE_FREQUENCIES.C6 > NOTE_FREQUENCIES.C5);
  assert.equal(NOTE_FREQUENCIES.REST, 0);
});

test('audio: melody patterns contain 3 gentle lullabies with notes', () => {
  assert.equal(MELODY_PATTERNS.length, 3);
  assert.equal(MELODY_PATTERNS[0].name, 'Cloudburst Waltz');
  assert.equal(MELODY_PATTERNS[1].name, 'Starlight Lullaby');
  assert.equal(MELODY_PATTERNS[2].name, 'Sleepy Meadow');
  for (const pattern of MELODY_PATTERNS) {
    assert.ok(pattern.notes.length > 5);
    assert.ok(pattern.bpm >= 30 && pattern.bpm <= 60);
  }
});

test('audio: calculateRealDurationSeconds returns valid positive durations', () => {
  const pattern = MELODY_PATTERNS[0];
  const beats = getPatternTotalBeats(pattern);
  assert.ok(beats > 10);
  const dur = calculateRealDurationSeconds(pattern, 42);
  assert.ok(dur > 15 && dur < 60);
});

test('soundEffects: WebAudioSoundEffects supports mute toggling and safe destruction in non-DOM environments', () => {
  const sfx = new WebAudioSoundEffects(true);
  assert.equal(sfx.isMuted(), true);
  sfx.setMuted(false);
  assert.equal(sfx.isMuted(), false);

  // Calling play in Node environment does not crash
  const sampleTypes: SoundEffectType[] = [
    'button-click',
    'nav-click',
    'tune-select',
    'wind-key',
    'nightlight-change',
    'dream-dispatch',
    'easter-egg-open',
    'easter-egg-close',
    'guestbook-submit',
    'chaos-toggle',
  ];

  sampleTypes.forEach((t) => {
    assert.doesNotThrow(() => sfx.play(t));
  });

  assert.doesNotThrow(() => sfx.destroy());
});

test('routePath: calculateProgress bounds between 0 and 1', () => {
  assert.equal(calculateProgress(0, 3000), 0);
  assert.equal(calculateProgress(1500, 3000), 0.5);
  assert.equal(calculateProgress(3000, 3000), 1);
  assert.equal(calculateProgress(4500, 3000), 1);
  assert.equal(calculateProgress(-500, 3000), 0);
});

test('routePath: getDeliveryMessage reflects status correctly', () => {
  const idleMsg = getDeliveryMessage('idle', 'Whispering Attic', 0);
  assert.ok(idleMsg.includes('Ready for departure'));

  const dispatchMsg = getDeliveryMessage('dispatching', 'Lighthouse Nursery', 0.5);
  assert.ok(dispatchMsg.includes('Gliding through starlight'));
  assert.ok(dispatchMsg.includes('50%'));

  const deliveredMsg = getDeliveryMessage('delivered', 'Cloud Nine Spire', 1);
  assert.ok(deliveredMsg.includes('safely tucked into bed'));
});

test('routePath: getPointOnRoute moves smoothly along the SVG route from start to end', () => {
  const start = getPointOnRoute(0);
  const mid = getPointOnRoute(0.5);
  const end = getPointOnRoute(1);

  assert.equal(start.x, 130);
  assert.equal(start.y, 265);
  assert.equal(end.x, 735);
  assert.equal(end.y, 295);
  assert.ok(mid.x > start.x && mid.x < end.x);
  assert.ok(mid.angle >= -24 && mid.angle <= 24);
});

test('routePath: getReachedStationCount advances monotonically across STATION_THRESHOLDS', () => {
  assert.equal(getReachedStationCount(0), 0);
  assert.equal(getReachedStationCount(STATION_THRESHOLDS[0]), 1);
  assert.equal(getReachedStationCount(STATION_THRESHOLDS[2]), 3);
  assert.equal(getReachedStationCount(1), 5);
});

test('routePath: computeSectionScrollProgress maps viewport scroll position to 0..1 and reverses cleanly', () => {
  assert.equal(computeSectionScrollProgress(800, 750, 900), 0);
  const mid = computeSectionScrollProgress(300, 750, 900);
  assert.ok(mid > 0.3 && mid < 0.8);
  assert.equal(computeSectionScrollProgress(-50, 750, 900), 1);
});

test('tilt: calculateTilt returns 0 at center and stays bounded within maxDegrees', () => {
  const rect = { left: 100, top: 100, width: 200, height: 200 };

  // Center (200, 200) -> 0 tilt
  const centerTilt = calculateTilt(200, 200, rect, 7);
  assert.equal(centerTilt.rotateX, 0);
  assert.equal(centerTilt.rotateY, 0);

  // Top right corner (300, 100) -> max tilt bounded
  const cornerTilt = calculateTilt(300, 100, rect, 7);
  assert.ok(cornerTilt.rotateX <= 7 && cornerTilt.rotateX >= -7);
  assert.ok(cornerTilt.rotateY <= 7 && cornerTilt.rotateY >= -7);
});
