/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tune {
  id: string;
  title: string;
  symbol: string;
  durationSeconds: number;
  frequencyHz: number;
  description: string;
}

export const TUNES: Tune[] = [
  {
    id: 'cloudburst-waltz',
    title: 'Cloudburst Waltz',
    symbol: '♪',
    durationSeconds: 225,
    frequencyHz: 432,
    description: 'Gentle raindrops dancing on marshmallow clouds',
  },
  {
    id: 'starlight-lullaby',
    title: 'Starlight Lullaby',
    symbol: '♫',
    durationSeconds: 195,
    frequencyHz: 528,
    description: 'Soft twinkles steering restless thoughts into velvet peace',
  },
  {
    id: 'sleepy-meadow',
    title: 'Sleepy Meadow',
    symbol: '♩',
    durationSeconds: 240,
    frequencyHz: 396,
    description: 'Lavender breeze rustling across moonlit valleys',
  },
  {
    id: 'lavender-slumber',
    title: 'Lavender Slumber',
    symbol: '♬',
    durationSeconds: 210,
    frequencyHz: 440,
    description: 'Calming rhythm wrapped in warm flannel notes',
  },
];

export function getTempoLabel(bpm: number): string {
  if (bpm <= 36) return 'Deepest Slumber';
  if (bpm <= 48) return 'Extra Drowsy';
  if (bpm <= 65) return 'Gentle Waltz';
  return 'Brisk Snooze';
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateWindupPercentage(current: number, max: number = 100): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / max) * 100)));
}
