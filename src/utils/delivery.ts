/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DeliveryWaypoint {
  id: string;
  name: string;
  tagline: string;
  time: string;
  emoji: string;
  x: number;
  y: number;
  color: string;
  bgBadge: string;
}

export const DELIVERY_WAYPOINTS: DeliveryWaypoint[] = [
  {
    id: 'attic',
    name: 'Whispering Attic',
    tagline: 'Bunny Dreams 🐰',
    time: '8:30 PM',
    emoji: '🐰',
    x: 120,
    y: 320,
    color: '#a34063',
    bgBadge: 'bg-berry text-white',
  },
  {
    id: 'lighthouse',
    name: 'Lighthouse Nursery',
    tagline: 'Sailor Lullabies ⛵',
    time: '9:15 PM',
    emoji: '⛵',
    x: 480,
    y: 200,
    color: '#7aa2f7',
    bgBadge: 'bg-star-gold text-plum font-bold',
  },
  {
    id: 'spire',
    name: 'Cloud Nine Spire',
    tagline: "Pip's Hammock 💤",
    time: '10:00 PM',
    emoji: '💤',
    x: 700,
    y: 320,
    color: '#f3cf75',
    bgBadge: 'bg-dream-lavender text-plum font-bold',
  },
];

export function getNextWaypointIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}
