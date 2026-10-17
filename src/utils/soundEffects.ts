/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SoundEffectType =
  | 'button-click'
  | 'nav-click'
  | 'tune-select'
  | 'wind-key'
  | 'nightlight-change'
  | 'dream-dispatch'
  | 'easter-egg-open'
  | 'easter-egg-close'
  | 'guestbook-submit'
  | 'chaos-toggle';

export interface SoundEffectsManager {
  play: (type: SoundEffectType) => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  destroy: () => void;
}

export class WebAudioSoundEffects implements SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private muted: boolean = false;
  private lastPlayTimes: Map<string, number> = new Map();

  constructor(initialMuted: boolean = false) {
    this.muted = initialMuted;
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) return false;

      try {
        this.ctx = new AudioCtxClass();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('SFX AudioContext initialization failed:', err);
        return false;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.sfxGain) {
      const target = muted ? 0 : 0.28;
      this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, this.ctx.currentTime);
      this.sfxGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.03);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public play(type: SoundEffectType) {
    if (this.muted) return;

    // Rate limiting to prevent overwhelming bursts
    const nowMs = performance.now();
    const last = this.lastPlayTimes.get(type) || 0;
    if (nowMs - last < 45) return;
    this.lastPlayTimes.set(type, nowMs);

    const ready = this.initContext();
    if (!ready || !this.ctx || !this.sfxGain) return;

    const t0 = this.ctx.currentTime;

    try {
      switch (type) {
        case 'button-click':
        case 'nav-click': {
          // Soft rounded wooden/bubble click (sine pop at 587Hz dropping to 440Hz)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, t0);
          osc.frequency.exponentialRampToValueAtTime(440, t0 + 0.05);

          gain.gain.setValueAtTime(0.18, t0);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);

          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t0);
          osc.stop(t0 + 0.07);
          break;
        }

        case 'tune-select': {
          // Gentle ascending double chime (E5 -> G5)
          const notes = [659.25, 783.99];
          notes.forEach((freq, idx) => {
            const start = t0 + idx * 0.06;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.14, start + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(start);
            osc.stop(start + 0.38);
          });
          break;
        }

        case 'wind-key': {
          // Antique mechanical winding click with metallic ping
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(900, t0);
          osc.frequency.exponentialRampToValueAtTime(1400, t0 + 0.04);

          gain.gain.setValueAtTime(0.2, t0);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.055);

          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t0);
          osc.stop(t0 + 0.06);
          break;
        }

        case 'nightlight-change': {
          // Luminescent soft bell chord (A4 + C#5 + E5 soft wash)
          const freqs = [440, 554.37, 659.25];
          freqs.forEach((f) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t0);

            gain.gain.setValueAtTime(0.08, t0);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(t0);
            osc.stop(t0 + 0.48);
          });
          break;
        }

        case 'dream-dispatch': {
          // Celestial ascending star chime (C5 -> E5 -> G5 -> C6)
          const arpeggio = [523.25, 659.25, 783.99, 1046.5];
          arpeggio.forEach((freq, idx) => {
            const start = t0 + idx * 0.07;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.12, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(start);
            osc.stop(start + 0.52);
          });
          break;
        }

        case 'easter-egg-open': {
          // Whimsical magical star chime
          const notes = [783.99, 987.77, 1318.51];
          notes.forEach((freq, idx) => {
            const start = t0 + idx * 0.08;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.12, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(start);
            osc.stop(start + 0.62);
          });
          break;
        }

        case 'easter-egg-close': {
          // Warm soothing bedtime descent (E5 -> C5)
          const notes = [659.25, 523.25];
          notes.forEach((freq, idx) => {
            const start = t0 + idx * 0.09;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.1, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(start);
            osc.stop(start + 0.42);
          });
          break;
        }

        case 'guestbook-submit': {
          // Cheerful warm starlight sparkle ding (G5 -> C6)
          const chord = [783.99, 1046.5];
          chord.forEach((freq) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t0);

            gain.gain.setValueAtTime(0.14, t0);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(t0);
            osc.stop(t0 + 0.72);
          });
          break;
        }

        case 'chaos-toggle': {
          // Quick sparkling cosmic twinkle
          const sparkles = [880, 1046.5, 1318.51, 1567.98];
          sparkles.forEach((freq, i) => {
            const start = t0 + i * 0.04;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain!);
            osc.start(start);
            osc.stop(start + 0.28);
          });
          break;
        }
      }
    } catch {
      // Audio scheduling protection
    }
  }

  public destroy() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
