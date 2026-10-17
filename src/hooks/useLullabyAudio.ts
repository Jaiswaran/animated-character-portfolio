/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MusicBoxSynthesizer,
  MELODY_PATTERNS,
  calculateRealDurationSeconds,
} from '../utils/audioSynthesizer';

export function useLullabyAudio(initialMuted: boolean = true) {
  const synthRef = useRef<MusicBoxSynthesizer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [activePatternIndex, setActivePatternIndex] = useState(0);
  const [tempo, setTempoState] = useState(42);
  const [resonance, setResonanceState] = useState(0.94); // 94%
  const [windup, setWindup] = useState(100);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const noteTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const synth = new MusicBoxSynthesizer();
    synth.setMuted(initialMuted);
    synth.setCallbacks(
      (note, elapsed, currentWindup) => {
        setActiveNote(note);
        setElapsedSeconds(elapsed);
        setWindup(currentWindup);
        if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
        noteTimerRef.current = setTimeout(() => setActiveNote(null), 380);
      },
      (playingState, currentWindup) => {
        setIsPlaying(playingState);
        setWindup(currentWindup);
      }
    );
    synthRef.current = synth;

    return () => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
      synth.destroy();
      synthRef.current = null;
    };
  }, []);

  // Sync mute changes
  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (synthRef.current) {
      synthRef.current.setMuted(muted);
    }
  }, []);

  const play = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.stop();
      setIsPlaying(false);
      setElapsedSeconds(0);
      setActiveNote(null);
    }
  }, []);

  const windUp = useCallback((amount: number = 25) => {
    if (synthRef.current) {
      const next = synthRef.current.windUp(amount);
      setWindup(next);
      return next;
    }
    return 100;
  }, []);

  const setPattern = useCallback((index: number) => {
    if (synthRef.current) {
      synthRef.current.setPattern(index);
      setActivePatternIndex(index);
      setTempoState(MELODY_PATTERNS[index].bpm);
      setElapsedSeconds(0);
    }
  }, []);

  const setTempo = useCallback((newTempo: number) => {
    setTempoState(newTempo);
    if (synthRef.current) {
      synthRef.current.setTempo(newTempo);
    }
  }, []);

  const setResonance = useCallback((newResonance: number) => {
    setResonanceState(newResonance);
    if (synthRef.current) {
      synthRef.current.setResonance(newResonance);
    }
  }, []);

  const currentPattern = MELODY_PATTERNS[activePatternIndex];
  const totalDuration = calculateRealDurationSeconds(currentPattern, tempo);

  return {
    isPlaying,
    isMuted,
    setMuted,
    play,
    pause,
    stop,
    togglePlay,
    windUp,
    windup,
    activePatternIndex,
    setPattern,
    tempo,
    setTempo,
    resonance,
    setResonance,
    elapsedSeconds,
    totalDuration,
    activeNote,
    currentPattern,
  };
}
