/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Music box pentatonic / diatonic frequencies (in Hz)
export const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  REST: 0,
};

export interface MelodyNote {
  note: keyof typeof NOTE_FREQUENCIES;
  durationBeats: number;
}

export interface LullabyPattern {
  id: string;
  name: string;
  bpm: number;
  notes: MelodyNote[];
}

export const MELODY_PATTERNS: LullabyPattern[] = [
  {
    id: 'cloudburst-waltz',
    name: 'Cloudburst Waltz',
    bpm: 42,
    notes: [
      { note: 'E5', durationBeats: 1 },
      { note: 'G5', durationBeats: 1 },
      { note: 'A5', durationBeats: 1 },
      { note: 'C6', durationBeats: 1.5 },
      { note: 'B5', durationBeats: 0.5 },
      { note: 'G5', durationBeats: 1 },
      { note: 'A5', durationBeats: 1 },
      { note: 'E5', durationBeats: 2 },
      { note: 'REST', durationBeats: 0.5 },
      { note: 'D5', durationBeats: 1 },
      { note: 'E5', durationBeats: 1 },
      { note: 'G5', durationBeats: 2 },
    ],
  },
  {
    id: 'starlight-lullaby',
    name: 'Starlight Lullaby',
    bpm: 38,
    notes: [
      { note: 'G5', durationBeats: 1 },
      { note: 'E5', durationBeats: 1 },
      { note: 'D5', durationBeats: 1 },
      { note: 'C5', durationBeats: 1.5 },
      { note: 'A4', durationBeats: 0.5 },
      { note: 'G4', durationBeats: 1.5 },
      { note: 'C5', durationBeats: 1 },
      { note: 'D5', durationBeats: 1.5 },
      { note: 'E5', durationBeats: 1 },
      { note: 'C5', durationBeats: 2 },
      { note: 'REST', durationBeats: 0.5 },
    ],
  },
  {
    id: 'sleepy-meadow',
    name: 'Sleepy Meadow',
    bpm: 40,
    notes: [
      { note: 'C5', durationBeats: 1 },
      { note: 'E5', durationBeats: 1 },
      { note: 'G5', durationBeats: 1 },
      { note: 'A5', durationBeats: 1.5 },
      { note: 'G5', durationBeats: 1 },
      { note: 'E5', durationBeats: 1 },
      { note: 'D5', durationBeats: 1 },
      { note: 'C5', durationBeats: 2 },
      { note: 'D5', durationBeats: 1 },
      { note: 'E5', durationBeats: 1 },
      { note: 'C5', durationBeats: 2 },
      { note: 'REST', durationBeats: 0.5 },
    ],
  },
];

export function getPatternTotalBeats(pattern: LullabyPattern): number {
  return pattern.notes.reduce((sum, n) => sum + n.durationBeats, 0);
}

export function calculateRealDurationSeconds(pattern: LullabyPattern, bpm: number): number {
  const safeBpm = Math.max(20, bpm);
  const totalBeats = getPatternTotalBeats(pattern);
  return Math.round((totalBeats * (60 / safeBpm)) * 10) / 10;
}

export class MusicBoxSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = true; // start muted by default
  private isPlaying: boolean = false;
  private currentPatternIndex: number = 0;
  private currentNoteIndex: number = 0;
  private loopTimeoutId: number | null = null;
  private bpm: number = 42;
  private resonanceFactor: number = 0.94; // 0 to 1 (94% default)
  private windupSpring: number = 100; // 0 to 100%
  private elapsedSeconds: number = 0;
  private onNoteCallback?: (note: string, elapsedSeconds: number, windup: number) => void;
  private onStateChangeCallback?: (isPlaying: boolean, windup: number) => void;

  constructor() {
    this.isMuted = true;
    this.windupSpring = 100;
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) {
        return false;
      }

      try {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('AudioContext failed to initialize:', err);
        return false;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  public setCallbacks(
    onNote: (note: string, elapsedSeconds: number, windup: number) => void,
    onStateChange: (isPlaying: boolean, windup: number) => void
  ) {
    this.onNoteCallback = onNote;
    this.onStateChangeCallback = onStateChange;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const targetGain = muted ? 0 : 0.35;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getWindup(): number {
    return this.windupSpring;
  }

  public getElapsedSeconds(): number {
    return Math.round(this.elapsedSeconds);
  }

  public windUp(amount: number = 25): number {
    this.windupSpring = Math.min(100, this.windupSpring + amount);
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.isPlaying, this.windupSpring);
    }
    return this.windupSpring;
  }

  public setResonance(factor: number) {
    // Clamped 0.1 to 1.0
    this.resonanceFactor = Math.max(0.1, Math.min(1.0, factor));
  }

  public getResonance(): number {
    return this.resonanceFactor;
  }

  public setPattern(patternIndex: number) {
    if (patternIndex >= 0 && patternIndex < MELODY_PATTERNS.length) {
      this.currentPatternIndex = patternIndex;
      this.currentNoteIndex = 0;
      this.elapsedSeconds = 0;
      this.bpm = MELODY_PATTERNS[patternIndex].bpm;
    }
  }

  public setTempo(bpm: number) {
    this.bpm = Math.max(25, Math.min(100, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public play() {
    if (this.isPlaying) return;

    // Check wind-up spring
    if (this.windupSpring <= 0) {
      this.windUp(50);
    }

    const initialized = this.initContext();
    if (!initialized) return;

    this.isPlaying = true;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(true, this.windupSpring);
    }
    this.scheduleNextNote();
  }

  public pause() {
    this.isPlaying = false;
    if (this.loopTimeoutId !== null) {
      window.clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false, this.windupSpring);
    }
  }

  public stop() {
    this.pause();
    this.currentNoteIndex = 0;
    this.elapsedSeconds = 0;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false, this.windupSpring);
    }
  }

  private playTone(frequency: number, durationSeconds: number) {
    if (!this.ctx || !this.masterGain || frequency <= 0) return;

    try {
      const now = this.ctx.currentTime;

      // Primary tone: warm sine wave
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, now);

      // Overtone: metallic bell chime harmonic (2.02x harmonic)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(frequency * 2.02, now);

      // Low-pass filter with Q resonance directly connected to resonanceFactor
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      // Cutoff increases with resonance
      const cutoff = 1600 + this.resonanceFactor * 1400; // 1600Hz to 3000Hz
      filter.frequency.setValueAtTime(cutoff, now);
      // Q resonance factor (bell ringing quality)
      filter.Q.setValueAtTime(1.0 + this.resonanceFactor * 7.0, now);

      // Note Gain envelope
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.28, now + 0.015);

      const decayDuration = Math.max(1.1, durationSeconds * 1.4);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

      // Secondary overtone gain wired to resonanceFactor
      const overtoneGain = this.ctx.createGain();
      const overtoneVol = 0.03 + this.resonanceFactor * 0.12;
      overtoneGain.gain.setValueAtTime(overtoneVol, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      // Route audio nodes
      osc1.connect(filter);
      osc2.connect(overtoneGain);
      overtoneGain.connect(filter);

      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      // Trigger
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + decayDuration + 0.05);
      osc2.stop(now + decayDuration + 0.05);
    } catch {
      // Audio node scheduling guard
    }
  }

  private scheduleNextNote() {
    if (!this.isPlaying) return;

    // Check spring unwinding: decay by 2% per note
    this.windupSpring = Math.max(0, this.windupSpring - 2);

    // If spring runs out completely, music stops!
    if (this.windupSpring <= 0) {
      this.pause();
      return;
    }

    const pattern = MELODY_PATTERNS[this.currentPatternIndex];
    if (!pattern || pattern.notes.length === 0) return;

    const current = pattern.notes[this.currentNoteIndex];
    const freq = NOTE_FREQUENCIES[current.note] || 0;

    // Real tempo calculation: slight slowdown when spring < 15%
    const slowdownFactor = this.windupSpring < 15 ? 0.75 : 1.0;
    const effectiveBpm = this.bpm * slowdownFactor;
    const secondsPerBeat = 60 / effectiveBpm;
    const noteDuration = current.durationBeats * secondsPerBeat;

    this.elapsedSeconds += noteDuration;
    const totalDuration = calculateRealDurationSeconds(pattern, this.bpm);
    if (this.elapsedSeconds > totalDuration) {
      this.elapsedSeconds = this.elapsedSeconds % totalDuration;
    }

    if (freq > 0) {
      this.playTone(freq, noteDuration);
      if (this.onNoteCallback) {
        this.onNoteCallback(current.note, this.elapsedSeconds, this.windupSpring);
      }
    }

    // Advance note index
    this.currentNoteIndex = (this.currentNoteIndex + 1) % pattern.notes.length;

    // Schedule next beat
    this.loopTimeoutId = window.setTimeout(() => {
      this.scheduleNextNote();
    }, noteDuration * 1000);
  }

  public destroy() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
