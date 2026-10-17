/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sun, Moon, ShieldCheck, Sparkles } from 'lucide-react';
import { GLOW_OPTIONS, SLUMBER_TIMERS, GlowMode } from '../utils/nightlight';
import { useSoundEffects } from '../hooks/useSoundEffects';

const PIP_LANTERN_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCn5BPwRSRzfkgVPKbx9s5hXocpGDPjMIZmHZY82gBnIP51tt9T5HLkzsY95sokvCOW8PfUQ7X2hFteJ8NfXX9tQ4vm-xjeUxzsGb3HDh1BfJTHsHTTCSJjRBF7VJ7-TD45hll0TbhKvD8AIwteT2endf9EjzoCvWohPEMzYEAwaJ57T-FLCMr1CibqBeBRUudEVl-fXWH4tgE9xKhGFBdRT8rjQrU3k-u_zKw60G3i6Ueo6iInCrer9qKW9JUn6sNVQA';

export const NightlightSection: React.FC = () => {
  const { play } = useSoundEffects();
  const [activeGlow, setActiveGlow] = useState<GlowMode>('amber');
  const [activeTimer, setActiveTimer] = useState<string>('15m');
  const [isNightAmbience, setIsNightAmbience] = useState(true);

  const currentGlow = GLOW_OPTIONS.find((g) => g.id === activeGlow) || GLOW_OPTIONS[0];

  const handleGlowSelect = (glowId: GlowMode) => {
    play('nightlight-change');
    setActiveGlow(glowId);
  };

  const handleTimerSelect = (timerId: string) => {
    play('button-click');
    setActiveTimer(timerId);
  };

  const handleAmbienceToggle = (night: boolean) => {
    play('button-click');
    setIsNightAmbience(night);
  };

  return (
    <section
      id="nightlight"
      className="py-16 md:py-20 bg-soft-blush/20 dark:bg-plum/40 border-y border-rich-berry/10 relative transition-colors duration-500"
      aria-label="Nightlight Sanctuary"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-soft-blush dark:bg-plum px-3.5 py-1 rounded-full border border-rich-berry/20">
            Luminescent Defense System
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-3">
            Nightlight Sanctuary
          </h2>
          <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
            Equipped with Pip’s official glowing crescent moon dream lantern to banish shadows and soothe restless thoughts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Lantern Visual Showcase with Dynamic Glow */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md flex justify-center">
              {/* Dynamic Radiance Glow Aura */}
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-75 transition-all duration-700 pointer-events-none"
                style={{
                  backgroundColor: currentGlow.hex,
                  transform: isNightAmbience ? 'scale(1.2)' : 'scale(0.9)',
                }}
                aria-hidden="true"
              />

              <div
                className={`relative z-10 p-5 rounded-[40px] border-4 border-rich-berry/20 shadow-2xl w-full transition-colors duration-500 ${
                  isNightAmbience
                    ? 'bg-plum-night text-cream border-plum-card'
                    : 'bg-white text-warm-brown'
                }`}
              >
                {/* Ambience Mode Selector Bar */}
                <div className="flex items-center justify-between pb-3 px-2 border-b border-rich-berry/10 dark:border-white/10 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🏮</span>
                    <span className="font-bubbly text-xs font-bold text-rich-berry dark:text-star-gold">
                      Invention II: Nightlight Collection
                    </span>
                  </div>

                  {/* Day / Night Ambience Toggle with distinct selected state */}
                  <div
                    className="flex items-center gap-1 bg-cream/80 dark:bg-plum-card p-1 rounded-full border border-rich-berry/20 shadow-inner"
                    role="group"
                    aria-label="Room ambience preview"
                  >
                    <button
                      onClick={() => handleAmbienceToggle(false)}
                      aria-pressed={!isNightAmbience}
                      className={`px-3 py-1 rounded-full text-xs font-bubbly font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        !isNightAmbience
                          ? 'bg-star-gold text-plum font-bold shadow-md scale-102'
                          : 'text-warm-brown/70 dark:text-cream/70 hover:text-plum'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Day Preview</span>
                    </button>

                    <button
                      onClick={() => handleAmbienceToggle(true)}
                      aria-pressed={isNightAmbience}
                      className={`px-3 py-1 rounded-full text-xs font-bubbly font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isNightAmbience
                          ? 'bg-rich-berry text-white font-bold shadow-md scale-102'
                          : 'text-warm-brown/70 dark:text-cream/70 hover:text-plum'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-star-gold" />
                      <span>Night Preview</span>
                    </button>
                  </div>
                </div>

                {/* Lantern Viewport Card */}
                <div
                  className={`overflow-hidden rounded-[32px] p-4 transition-all duration-700 relative flex items-center justify-center ${
                    isNightAmbience
                      ? 'bg-gradient-to-b from-plum-dark to-[#1d152b] border border-white/10'
                      : 'bg-gradient-to-b from-[#fffaf4] to-cream border border-rich-berry/15'
                  }`}
                >
                  {/* Starlight floating speckles in night mode */}
                  {isNightAmbience && (
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <span className="absolute top-4 left-6 text-xs text-star-gold animate-pulse">✦</span>
                      <span className="absolute bottom-6 right-8 text-xs text-star-gold animate-pulse" style={{ animationDelay: '1s' }}>✧</span>
                      <span className="absolute top-1/2 right-4 text-xs text-soft-blush animate-pulse" style={{ animationDelay: '1.5s' }}>✦</span>
                    </div>
                  )}

                  <img
                    src="/assets/pip_dream_lantern.png"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = PIP_LANTERN_FALLBACK;
                    }}
                    alt="Pip's official dream lantern featuring a smiling crescent moon glowing warmly with carved star accents"
                    className="w-full max-h-[290px] object-contain transform hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
                  />
                </div>

                {/* Status Pill on Lantern */}
                <div className="mt-3.5 flex items-center justify-between px-3 py-1 font-bubbly text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full animate-ping ${currentGlow.badgeDot}`}
                    />
                    <span>
                      Active Beam: <b>{currentGlow.name}</b>
                    </span>
                  </span>
                  <span className="text-warm-brown/70 dark:text-cream/70">
                    Battery: Infinite Stardust ✨
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Glow Selector & Sleep Timer Interactive Deck */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-plum rounded-3xl p-6 sm:p-8 border-2 border-rich-berry/20 shadow-md">
              <h3 className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold mb-2">
                Dream Lantern Radiance Controller
              </h3>
              <p className="font-bubbly text-xs text-warm-brown/80 dark:text-cream/70 mb-6">
                Change hue spectrum according to sleeper anxiety levels:
              </p>

              {/* Color Palette Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {GLOW_OPTIONS.map((opt) => {
                  const isSelected = activeGlow === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleGlowSelect(opt.id)}
                      aria-pressed={isSelected}
                      className={`p-3.5 rounded-2xl border-2 font-bubbly text-xs flex items-center gap-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-star-gold bg-star-gold/25 shadow-md scale-102 ring-2 ring-star-gold/40'
                          : 'border-rich-berry/20 hover:border-rich-berry/50 bg-cream/50 dark:bg-plum-dark'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-full shadow-md border-2 border-white flex-shrink-0"
                        style={{ backgroundColor: opt.hex }}
                        aria-hidden="true"
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="block font-bold text-warm-brown dark:text-cream truncate">
                            {opt.name}
                          </span>
                          {isSelected && (
                            <Sparkles className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-warm-brown/60 dark:text-cream/60 truncate block">
                          {opt.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Automatic Slumber Timer Presets */}
              <div className="border-t border-rich-berry/15 pt-5 space-y-3">
                <span className="block font-bubbly text-xs uppercase text-rich-berry dark:text-star-gold font-bold">
                  Automatic Slumber Timer
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {SLUMBER_TIMERS.map((timer) => {
                    const isSelected = activeTimer === timer.id;
                    return (
                      <button
                        key={timer.id}
                        onClick={() => handleTimerSelect(timer.id)}
                        aria-pressed={isSelected}
                        className={`px-4 py-2.5 rounded-xl font-bubbly text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rich-berry text-white shadow-md scale-102'
                            : 'bg-cream dark:bg-plum-dark border border-rich-berry/20 text-warm-brown dark:text-cream hover:bg-soft-blush/30'
                        }`}
                      >
                        <span>{timer.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secret Safety Stamp */}
              <div className="mt-6 p-3.5 bg-star-gold/20 rounded-2xl flex items-center gap-3 border border-star-gold/40 text-xs font-bubbly">
                <ShieldCheck className="w-5 h-5 text-rich-berry dark:text-star-gold flex-shrink-0" />
                <span className="text-warm-brown dark:text-cream leading-relaxed">
                  <strong>Nightmare Protection Active:</strong> High-grade starlight filament neutralizes bad dreams within a 15-meter radius.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
