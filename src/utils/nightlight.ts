/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GlowMode = 'amber' | 'lavender' | 'blush' | 'starlight';

export interface GlowOption {
  id: GlowMode;
  name: string;
  subtitle: string;
  hex: string;
  glowClass: string;
  badgeDot: string;
}

export const GLOW_OPTIONS: GlowOption[] = [
  {
    id: 'amber',
    name: 'Amber Warmth',
    subtitle: 'Restful & Mellow',
    hex: '#f3cf75',
    glowClass: 'bg-amber-300/40',
    badgeDot: 'bg-amber-400',
  },
  {
    id: 'lavender',
    name: 'Lavender Mist',
    subtitle: 'Anxiety Banishment',
    hex: '#d9c8ef',
    glowClass: 'bg-purple-300/40',
    badgeDot: 'bg-purple-300',
  },
  {
    id: 'blush',
    name: 'Blush Twilight',
    subtitle: 'Nursery Cradle',
    hex: '#f1c9d6',
    glowClass: 'bg-pink-300/40',
    badgeDot: 'bg-pink-300',
  },
  {
    id: 'starlight',
    name: 'Deep Cosmos',
    subtitle: 'Lucid Dreaming',
    hex: '#7aa2f7',
    glowClass: 'bg-blue-400/40',
    badgeDot: 'bg-blue-400',
  },
];

export function getGlowOption(mode: GlowMode): GlowOption {
  const found = GLOW_OPTIONS.find((opt) => opt.id === mode);
  return found || GLOW_OPTIONS[0];
}

export interface SlumberTimer {
  id: string;
  label: string;
  sublabel: string;
  durationMinutes: number;
}

export const SLUMBER_TIMERS: SlumberTimer[] = [
  { id: '15m', label: '15 Min Nap', sublabel: 'Power Snooze', durationMinutes: 15 },
  { id: '30m', label: '30 Min Deep Sleep', sublabel: 'Deep Rest', durationMinutes: 30 },
  { id: 'dawn', label: 'Until Dawn Sunrise ☀️', sublabel: 'All Night', durationMinutes: 480 },
];
