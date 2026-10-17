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
    return `Ready for departure to ${destinationName}. Click "Deliver a Dream" to launch!`;
  }
  if (status === 'dispatching') {
    const pct = Math.round(progress * 100);
    return `🚀 Gliding through starlight toward ${destinationName}... (${pct}%)`;
  }
  return `✨ Dream safely tucked into bed at ${destinationName}! Rest well.`;
}
