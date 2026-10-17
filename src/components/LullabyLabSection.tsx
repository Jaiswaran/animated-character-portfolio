/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TUNES, Tune, getTempoLabel } from '../utils/lullaby';

const PIP_LULLABY_BOX_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIBVXnFXJnjntUvPP1v6XekDoyi3xTXGmh7TEWMNQyMTdhZ3KGyG4bEdcGYryjcMBqlCynfm0hfpluvWPfnwYvMZ7PMxr8pnKVWJr3zOD4u96sK_Dh_BVeP-yRLSFnDOSB4fVNDBzjVmjdV873qV802fQuX8cOOnd64LEbE5lNl_IxMrcOVA84ANSVpu-Re56F3QVGuzfOSbcHpRQCV6rlg2j1kxioj-R6__sqUVFhGBVSqiF2HzUMyh_DlR2CltzdUA';

interface LullabyLabSectionProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const LullabyLabSection: React.FC<LullabyLabSectionProps> = ({
  isPlaying,
  onTogglePlay,
}) => {
  const [selectedTune, setSelectedTune] = useState<Tune>(TUNES[0]);
  const [windupTime, setWindupTime] = useState(100);
  const [tempo, setTempo] = useState(42);
  const [keyRotated, setKeyRotated] = useState(false);

  const handleWindUp = () => {
    setWindupTime((prev) => Math.min(100, prev + 25));
    setKeyRotated(true);
    setTimeout(() => setKeyRotated(false), 500);
  };

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
            The heart of bedtime engineering: wind up the pastel unicorn music box to generate comforting tones.
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
            {/* Music Box Asset Showcase */}
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

                {/* Harmonizing Badge */}
                {isPlaying && (
                  <div className="absolute top-6 right-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rich-berry text-white text-xs font-bubbly font-bold animate-pulse shadow-md">
                    <span>♫ Harmonizing</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Deck Controls */}
            <div className="lg:col-span-6 space-y-6">
              {/* Currently Playing Header */}
              <div className="border-b border-rich-berry/15 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-bubbly text-xs uppercase tracking-wider text-rich-berry dark:text-star-gold font-bold">
                    Currently Playing Tune:
                  </span>
                  <span className="font-serif-headline font-bold text-plum dark:text-soft-blush text-lg">
                    “{selectedTune.title}”
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-warm-brown/70 dark:text-cream/70 mt-2">
                  <span>01:18</span>
                  <span className="italic">{selectedTune.description}</span>
                  <span>03:45</span>
                </div>
                <div className="w-full bg-cream dark:bg-plum-dark h-2 rounded-full mt-2 overflow-hidden border border-rich-berry/20">
                  <div
                    className="bg-rich-berry dark:bg-star-gold h-full transition-all duration-300"
                    style={{ width: isPlaying ? '58%' : '35%' }}
                  />
                </div>
              </div>

              {/* Tune Selection Buttons */}
              <div>
                <label className="block font-bubbly text-xs text-warm-brown/70 dark:text-cream/70 mb-2 font-bold tracking-wider uppercase">
                  Select Snooze Frequency
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TUNES.map((tune, index) => {
                    const isSelected = selectedTune.id === tune.id;
                    return (
                      <button
                        key={tune.id}
                        onClick={() => setSelectedTune(tune)}
                        className={`px-3.5 py-2.5 rounded-xl border-2 font-bubbly text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-rich-berry bg-rich-berry text-white shadow-sm'
                            : 'border-rich-berry/30 bg-cream/70 dark:bg-plum-dark hover:border-rich-berry text-warm-brown dark:text-cream'
                        }`}
                      >
                        <span className="truncate">
                          {index + 1}. {tune.title}
                        </span>
                        <span aria-hidden="true">{tune.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deck Action Buttons: Play/Pause and Wind Up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <button
                  onClick={onTogglePlay}
                  className="w-full py-3.5 px-4 rounded-2xl bg-rich-berry hover:bg-rich-berry/90 text-white font-bubbly text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  aria-label={isPlaying ? 'Pause Music Box' : 'Play Lullaby Box'}
                >
                  <span aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
                  <span>{isPlaying ? 'Pause Music Box' : 'Play Lullaby Box'}</span>
                </button>

                <button
                  onClick={handleWindUp}
                  className="w-full py-3.5 px-4 rounded-2xl bg-star-gold hover:bg-star-gold/90 text-warm-brown font-bubbly text-sm font-semibold flex items-center justify-center gap-2 shadow border border-warm-brown/20 transition-all cursor-pointer"
                  aria-label="Wind up music box spring"
                >
                  <span aria-hidden="true">🌀</span>
                  <span>Wind Up Spring (+30s)</span>
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
                    min={30}
                    max={90}
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    aria-label="Tempo slider in beats per minute"
                    className="w-full accent-rich-berry dark:accent-star-gold cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Chime Resonance: <strong>Pure Brass &amp; Velvet</strong></span>
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
