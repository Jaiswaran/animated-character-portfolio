/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { WebAudioSoundEffects, SoundEffectType } from '../utils/soundEffects';

const SFX_STORAGE_KEY = 'pip_sfx_muted';

interface SoundEffectsContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  play: (type: SoundEffectType) => void;
}

const SoundEffectsContext = createContext<SoundEffectsContextValue>({
  isMuted: false,
  toggleMute: () => {},
  play: () => {},
});

export const SoundEffectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sfxRef = useRef<WebAudioSoundEffects | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SFX_STORAGE_KEY);
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    const sfx = new WebAudioSoundEffects(isMuted);
    sfxRef.current = sfx;

    return () => {
      sfx.destroy();
      sfxRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (sfxRef.current) {
        sfxRef.current.setMuted(next);
      }
      try {
        localStorage.setItem(SFX_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const play = useCallback(
    (type: SoundEffectType) => {
      if (isMuted || !sfxRef.current) return;
      sfxRef.current.play(type);
    },
    [isMuted]
  );

  return (
    <SoundEffectsContext.Provider value={{ isMuted, toggleMute, play }}>
      {children}
    </SoundEffectsContext.Provider>
  );
};

export const useSound = () => useContext(SoundEffectsContext);
