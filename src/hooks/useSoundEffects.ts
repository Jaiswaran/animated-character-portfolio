/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSound } from '../context/SoundEffectsContext';

export function useSoundEffects() {
  return useSound();
}

export type { SoundEffectType } from '../utils/soundEffects';
