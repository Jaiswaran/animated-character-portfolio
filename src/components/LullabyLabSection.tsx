/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, RotateCw } from 'lucide-react';
import {
  MusicBoxSynthesizer,
  MELODY_PATTERNS,
} from '../utils/audioSynthesizer';
import { getTempoLabel } from '../utils/lullaby';

const PIP_LULLABY_BOX_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIBVXnFXJnjntUvPP1v6XekDoyi3xTXGmh7TEWMNQyMTdhZ3KGyG4bEdcGYryjcMBqlCynfm0hfpluvWPfnwYvMZ7PMxr8pnKVWJr3zOD4u96sK_Dh_BVeP-yRLSFnDOSB4fVNDBzjVmjdV873qV802fQuX8cOOnd64LEbE5lNl_IxMrcOVA84ANSVpu-Re56F3QVGuzfOSbcHpRQCV6rlg2j1kxioj-R6__sqUVFhGBVSqiF2HzUMyh_DlR2CltzdUA';

interface LullabyLabSectionProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const LullabyLabSection: React.FC<LullabyLabSectionProps> = ({
  isMuted,
  onToggleMute,
}) => {
  const synthRef = useRef<MusicBoxSynthesizer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePatternIndex, setActivePatternIndex] = useState(0);
  const [tempo, setTempo] = useState(42);
  const [windupTime, setWindupTime] = useState(100);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [keyRotated, setKeyRotated] = useState(false);

  // Initialize synthesizer lazily
  useEffect(() => {
    const synth = new MusicBoxSynthesizer();
    synth.setMuted(isMuted);
    synth.setOnNote((note) => {
      setActiveNote(note);
      setTimeout(() => setActiveNote(null), 400);
    });
    synthRef.current = synth;

    return () => {
      synth.destroy();
      synthRef.current = null;
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  // Handle Play
  const handlePlay = () => {
    if (!synthRef.current) return;
    synthRef.current.play();
    setIsPlaying(true);
  };

  // Handle Pause
  const handlePause = () => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsPlaying(false);
  };

  // Handle Stop
  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.stop();
    setIsPlaying(false);
    setActiveNote(null);
  };

  // Handle Tune Selection
  const handleSelectTune = (index: number) => {
    setActivePatternIndex(index);
    if (synthRef.current) {
      synthRef.current.setPattern(index);
      setTempo(MELODY_PATTERNS[index].bpm);
    }
  };

  // Handle Tempo Change
  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
    if (synthRef.current) {
      synthRef.current.setTempo(newTempo);
    }
  };

  // Handle Wind Up Key (+25%)
  const handleWindUp = () => {
    setWindupTime((prev) => Math.min(100, prev + 25));
    setKeyRotated(true);
    setTimeout(() => setKeyRotated(false), 500);

    // If currently stopped, play automatically after gesture
    if (!isPlaying && synthRef.current) {
      handlePlay();
    }
  };

  const currentPattern = MELODY_PATTERNS[activePatternIndex];

  return (
    <section
      id="lullaby"
      className="py-16 md:py-20 relative"
      aria-label="Pip's Interactive Lullaby Lab"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-star-gold/30 dark:bg-plum px-3.5 py-1 rounded-full border border-star-gold/40">
            Harmonic Acoustics &amp; Snooze Frequencies
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-3">
            Pip's Interactive Lullaby Lab
          </h2>
          <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
            The heart of bedtime engineering: gentle Web Audio music box tones with soft oscillator bells and relaxing cadences.
          </p>
        </div>

        {/* Interactive Lab Showcase Container */}
        <div className="bg-white/80 dark:bg-plum rounded-3xl p-6 sm:p-10 border-2 border-rich-berry/20 shadow-xl relative overflow-hidden">
          {/* Animated Musical Floating Notes in Background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <span
              className={`absolute text-rich-berry dark:text-star-gold font-bold text-xl opacity-0 ${
                isPlaying ? 'animate-sparkle-note' : ''
              } top-1/2 left-1/3`}
            >
              ♪
            </span>
            <span
              className={`absolute text-soft-blush font-bold text-2xl opacity-0 ${
                isPlaying ? 'animate-sparkle-note' : ''
              } top-1/3 left-1/2`}
              style={{ animationDelay: '1.2s' }}
            >
              ♫
            </span>
            <span
              className={`absolute text-dream-lavender font-bold text-lg opacity-0 ${
                isPlaying ? 'animate-sparkle-note' : ''
              } top-2/3 left-2/5`}
              style={{ animationDelay: '0.7s' }}
            >
              ♬
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Music Box Visual Showcase */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative group w-full max-w-md">
                <div className="w-full rounded-3xl overflow-hidden border-4 border-soft-blush bg-cream p-4 shadow-lg">
                  <img
                    src="/assets/pip_lullaby_box.png"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = PIP_LULLABY_BOX_FALLBACK;
                    }}
                    alt="Pip's official pastel pink and cream unicorn carousel music box with golden accents"
                    className={`w-full h-auto object-cover rounded-2xl transform transition-transform duration-500 group-hover:scale-105 ${
                      isPlaying ? 'scale-[1.02]' : ''
                    }`}
                  />
                </div>

                {/* Wind-up key spinning indicator */}
                <div
                  className={`absolute -bottom-4 right-6 bg-star-gold border-2 border-warm-brown text-warm-brown px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-md ${
                    isPlaying ? 'animate-bounce' : ''
                  }`}
                >
                  <span
                    className={`text-base inline-block transition-transform duration-500 ${
                      keyRotated ? 'rotate-[360deg]' : ''
                    }`}
                    aria-hidden="true"
                  >
                    🔑
                  </span>
                  <span className="font-bubbly text-xs font-bold">
                    Key: Wound {windupTime}%
                  </span>
                </div>

                {/* Harmonizing Badge & Note Live Chime */}
                {isPlaying && (
                  <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rich-berry text-white text-xs font-bubbly font-bold animate-pulse shadow-md">
                    <span>♫ {activeNote ? `Chiming: ${activeNote}` : 'Harmonizing'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Deck Controls */}
            <div className="lg:col-span-6 space-y-6">
              {/* Currently Playing Header & Master Mute */}
              <div className="border-b border-rich-berry/15 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bubbly text-[11px] uppercase tracking-wider text-rich-berry dark:text-star-gold font-bold block">
                      Currently Selected Melody:
                    </span>
                    <span className="font-serif-headline font-bold text-plum dark:text-soft-blush text-xl">
                      “{currentPattern.name}”
                    </span>
                  </div>

                  {/* Visible Master Mute Switch */}
                  <button
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Unmute music box audio' : 'Mute music box audio'}
                    aria-pressed={!isMuted}
                    className={`px-3.5 py-2 rounded-2xl border-2 flex items-center gap-2 font-bubbly text-xs font-bold transition-all cursor-pointer ${
                      isMuted
                        ? 'border-rich-berry/30 bg-cream/70 dark:bg-plum-dark text-warm-brown/80 dark:text-cream/80'
                        : 'border-rich-berry bg-rich-berry text-white shadow-sm'
                    }`}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-4 h-4 text-rich-berry dark:text-star-gold" />
                        <span>Sound: MUTED</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-star-gold animate-pulse" />
                        <span>Sound: ON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="w-full bg-cream dark:bg-plum-dark h-2 rounded-full mt-3 overflow-hidden border border-rich-berry/20">
                  <div
                    className="bg-rich-berry dark:bg-star-gold h-full transition-all duration-300"
                    style={{ width: isPlaying ? '65%' : '20%' }}
                  />
                </div>
              </div>

              {/* 3 Selectable Melody Patterns */}
              <div>
                <label className="block font-bubbly text-xs text-warm-brown/70 dark:text-cream/70 mb-2 font-bold tracking-wider uppercase">
                  Select Gentle Melody Pattern
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {MELODY_PATTERNS.map((pattern, index) => {
                    const isSelected = activePatternIndex === index;
                    return (
                      <button
                        key={pattern.id}
                        onClick={() => handleSelectTune(index)}
                        className={`p-3 rounded-2xl border-2 font-bubbly text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-rich-berry bg-rich-berry text-white shadow-sm'
                            : 'border-rich-berry/30 bg-cream/70 dark:bg-plum-dark hover:border-rich-berry text-warm-brown dark:text-cream'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{index + 1}. {pattern.name}</span>
                          <span>♪</span>
                        </div>
                        <span
                          className={`text-[10px] block ${
                            isSelected ? 'text-star-gold' : 'text-warm-brown/60 dark:text-cream/60'
                          }`}
                        >
                          {pattern.bpm} BPM Cadence
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Playback Action Buttons: Play, Pause, Stop, Wind Up */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <button
                  onClick={handlePlay}
                  disabled={isPlaying}
                  className={`py-3 px-3 rounded-2xl font-bubbly text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-rich-berry text-white hover:bg-rich-berry/90'
                  }`}
                  aria-label="Play Lullaby"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>

                <button
                  onClick={handlePause}
                  disabled={!isPlaying}
                  className={`py-3 px-3 rounded-2xl font-bubbly text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer ${
                    !isPlaying
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-star-gold text-plum font-bold hover:bg-star-gold/90'
                  }`}
                  aria-label="Pause Lullaby"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>

                <button
                  onClick={handleStop}
                  className="py-3 px-3 rounded-2xl border border-rich-berry/30 bg-cream dark:bg-plum-dark text-warm-brown dark:text-cream hover:bg-soft-blush/30 font-bubbly text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  aria-label="Stop Lullaby"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>

                <button
                  onClick={handleWindUp}
                  className="py-3 px-3 rounded-2xl bg-star-gold/30 hover:bg-star-gold/50 border border-star-gold/60 text-warm-brown dark:text-cream font-bubbly text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  aria-label="Wind up music box spring (+25%)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Wind (+25%)</span>
                </button>
              </div>

              {/* Sliders for Tempo & Chime Resonance */}
              <div className="bg-cream/60 dark:bg-plum-dark/50 p-4 rounded-2xl border border-rich-berry/15 space-y-3 font-bubbly text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>
                      Tempo: <strong>{tempo} BPM ({getTempoLabel(tempo)})</strong>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={90}
                    value={tempo}
                    onChange={(e) => handleTempoChange(Number(e.target.value))}
                    aria-label="Tempo slider in beats per minute"
                    className="w-full accent-rich-berry dark:accent-star-gold cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Chime Resonance: <strong>Pure Brass &amp; Velvet Envelope</strong></span>
                    <span className="text-rich-berry dark:text-star-gold font-semibold">94%</span>
                  </div>
                  <div className="h-1.5 w-full bg-rich-berry/10 dark:bg-star-gold/10 rounded-full overflow-hidden">
                    <div className="bg-rich-berry dark:bg-star-gold h-full w-[94%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
