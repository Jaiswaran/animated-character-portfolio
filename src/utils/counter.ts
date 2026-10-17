/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DreamEntry {
  id: string;
  name: string;
  message: string;
  stamp: string;
  timestamp: string;
}

export function formatOdometerDigits(value: number, totalDigits: number = 6): string[] {
  const safeVal = Math.max(0, Math.floor(value));
  const str = safeVal.toString().padStart(totalDigits, '0');
  return str.slice(-totalDigits).split('');
}

export function validateDreamInput(name: string, message: string): { isValid: boolean; error?: string } {
  const trimmedName = name.trim();
  const trimmedMessage = message.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Please enter your name or dreamer handle.' };
  }
  if (!trimmedMessage) {
    return { isValid: false, error: 'Please share your bedtime thought or wish.' };
  }
  if (trimmedName.length > 40) {
    return { isValid: false, error: 'Dreamer handle must be 40 characters or fewer.' };
  }
  if (trimmedMessage.length > 280) {
    return { isValid: false, error: 'Bedtime thought must be 280 characters or fewer.' };
  }
  return { isValid: true };
}
