/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Music,
  Moon,
  Send,
  Sparkles,
  ArrowRight,
  Shield,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
} from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { LullabyControls } from './LullabyLabSection';
import { MELODY_PATTERNS } from '../utils/audioSynthesizer';
import { GLOW_OPTIONS, GlowMode } from '../utils/nightlight';
import { DELIVERY_WAYPOINTS } from '../utils/delivery';

interface ProjectShowcaseSectionProps {
  lullaby: LullabyControls;
  activeGlow: GlowMode;
  onSelectGlow: (glow: GlowMode) => void;
  onQuickDispatch: () => void;
  deliveryStatus: string;
}

export const ProjectShowcaseSection: React.FC<ProjectShowcaseSectionProps> = ({
  lullaby,
  activeGlow,
  onSelectGlow,
  onQuickDispatch,
  deliveryStatus,
}) => {
  const { play } = useSoundEffects();
  const [activeCategory, setActiveCategory] = useState<'all' | 'acoustics' | 'lighting' | 'routes'>('all');

  const { isPlaying, isMuted, play: playLullaby, pause: pauseLullaby, windUp, windup, activePatternIndex, setPattern } =
    lullaby;

  const currentPattern = MELODY_PATTERNS[activePatternIndex];
  const currentGlow = GLOW_OPTIONS.find((g) => g.id === activeGlow) || GLOW_OPTIONS[0];

  const handleLullabyToggle = () => {
    play('button-click');
    if (isPlaying) {
      pauseLullaby();
    } else {
      lullaby.setMuted(false);
      playLullaby();
    }
  };

  const handleQuickWind = (e: React.MouseEvent) => {
    e.stopPropagation();
    play('wind-key');
    windUp(25);
    if (!isPlaying) {
      lullaby.setMuted(false);
      playLullaby();
    }
  };

  const handleGlowPick = (glowId: GlowMode, e: React.MouseEvent) => {
    e.stopPropagation();
    play('nightlight-change');
    onSelectGlow(glowId);
  };

  const handleDispatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickDispatch();
  };

  return (
    <section
      id="projects"
      className="py-16 md:py-24 relative overflow-hidden"
      aria-label="Pip's Celestial Dreamwork Portfolio"
      data-project-showcase="true"
    >
      {/* Decorative Star Constellation Background Accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 dark:opacity-20">
        <div className="absolute top-10 left-10 text-star-gold text-2xl animate-pulse">✦</div>
        <div className="absolute top-1/2 right-12 text-star-gold text-xl animate-pulse" style={{ animationDelay: '1s' }}>✧</div>
        <div className="absolute bottom-16 left-1/4 text-soft-blush text-3xl animate-floating-slow">☁️</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Showcase Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-star-gold/25 dark:bg-plum border border-star-gold/40 text-warm-brown dark:text-star-gold font-bubbly text-xs uppercase tracking-widest font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-star-gold" aria-hidden="true" />
            <span>Sector 9 Laboratory • Master Inventions</span>
          </div>

          <h2 className="font-serif-headline text-3xl sm:text-5xl lg:text-6xl font-extrabold text-plum dark:text-star-gold tracking-tight">
            Dreamwork Showcase
          </h2>

          <p className="font-bubbly text-warm-brown/85 dark:text-cream/80 text-sm sm:text-lg mt-3 leading-relaxed">
            Every slumber artifact in Pip's Midnight Observatory is hand-crafted with care. Hover any card to activate celestial focus, or launch the interactive lab controls directly.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
            {[
              { id: 'all', label: 'All Inventions (3)' },
              { id: 'acoustics', label: '♫ Acoustics & Lullabies' },
              { id: 'lighting', label: '🌙 Luminescent Defense' },
              { id: 'routes', label: '⭐ Starlight Logistics' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  play('button-click');
                  setActiveCategory(cat.id as any);
                }}
                className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-bubbly text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-rich-berry text-white shadow-md scale-102'
                    : 'bg-white/80 dark:bg-plum/70 text-warm-brown dark:text-cream/80 hover:bg-soft-blush/40 border border-rich-berry/15'
                }`}
                aria-pressed={activeCategory === cat.id}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Premium Imaginative Showcase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* ======================================================== */}
          {/* CARD 1: LULLABY LAB (Acoustics & Synthesis)             */}
          {/* ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'acoustics') && (
            <article
              data-project-card="true"
              className="project-card group relative bg-white/95 dark:bg-plum rounded-[32px] p-6 sm:p-7 border-2 border-rich-berry/20 dark:border-star-gold/25 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
              aria-label="Project 1: Pip's Lullaby Lab"
            >
              {/* Background Glow Backdrop */}
              <div
                className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 bg-pink-200/40 dark:bg-pink-900/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500"
                aria-hidden="true"
              />

              {/* Top Tag & Classification */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-bubbly text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-soft-blush/60 dark:bg-plum-dark text-rich-berry dark:text-soft-blush border border-rich-berry/20">
                    #01 • ACOUSTIC LAB
                  </span>

                  {/* Live Equalizer Mini Indicator */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream dark:bg-plum-dark border border-rich-berry/10">
                    <span className="text-[10px] font-bubbly font-semibold text-warm-brown/70 dark:text-cream/70">
                      {isPlaying && !isMuted ? 'PLAYING' : 'IDLE'}
                    </span>
                    <div className="flex items-end gap-0.5 h-3 w-4">
                      <span className={`w-1 bg-rich-berry dark:bg-star-gold rounded-full ${isPlaying && !isMuted ? 'eq-bar-1' : 'h-1'}`} />
                      <span className={`w-1 bg-rich-berry dark:bg-star-gold rounded-full ${isPlaying && !isMuted ? 'eq-bar-2' : 'h-1.5'}`} />
                      <span className={`w-1 bg-rich-berry dark:bg-star-gold rounded-full ${isPlaying && !isMuted ? 'eq-bar-3' : 'h-1'}`} />
                    </div>
                  </div>
                </div>

                {/* Card Artwork Showcase Container */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-rich-berry/20 bg-cream dark:bg-plum-dark p-3.5 mb-5 group-hover:border-rich-berry/40 transition-colors shadow-inner">
                  <img
                    src="/assets/pip_lullaby_box.png"
                    alt="Pip's pastel unicorn music box with wind-up mechanism"
                    className="w-full h-44 object-contain rounded-xl transform group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Floating Windup Spring Pill */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-plum/90 backdrop-blur-sm rounded-xl p-2 border border-rich-berry/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold" />
                      <span className="font-bubbly text-xs font-semibold text-warm-brown dark:text-cream">
                        Spring: {windup}%
                      </span>
                    </div>
                    <button
                      onClick={handleQuickWind}
                      className="px-2 py-0.5 rounded-md bg-star-gold hover:bg-amber-300 text-warm-brown font-bubbly text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                      title="Quick wind-up spring +25%"
                    >
                      + Wind Up
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold group-hover:text-rich-berry transition-colors">
                  Harmonic Lullaby Lab
                </h3>

                <p className="font-bubbly text-xs sm:text-sm text-warm-brown/85 dark:text-cream/80 mt-2 leading-relaxed">
                  Real Web Audio music box tones with soft oscillator bells, gentle BPM cadences, and anti-overlap frequency envelopes.
                </p>

                {/* Interactive Melody Quick-Selector */}
                <div className="mt-4 pt-3 border-t border-rich-berry/10">
                  <span className="font-bubbly text-[10px] uppercase font-bold text-warm-brown/60 dark:text-cream/60 tracking-wider block mb-1.5">
                    Selectable Melodies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {MELODY_PATTERNS.map((p, idx) => (
                      <button
                        key={p.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          play('tune-select');
                          setPattern(idx);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bubbly text-[11px] font-medium transition-all ${
                          activePatternIndex === idx
                            ? 'bg-rich-berry text-white shadow-xs'
                            : 'bg-soft-blush/30 dark:bg-plum-dark text-warm-brown/80 dark:text-cream/80 hover:bg-soft-blush/60'
                        }`}
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-rich-berry/15 flex items-center justify-between gap-3">
                <button
                  onClick={handleLullabyToggle}
                  className="px-3.5 py-2 rounded-xl bg-star-gold/30 hover:bg-star-gold/50 text-warm-brown dark:text-star-gold font-bubbly text-xs font-bold border border-star-gold/50 flex items-center gap-1.5 active:scale-95 transition-all"
                  aria-label={isPlaying ? 'Pause lullaby playback' : 'Play lullaby playback'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Tune</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Preview Tune</span>
                    </>
                  )}
                </button>

                <a
                  href="#lullaby"
                  onClick={() => play('nav-click')}
                  className="inline-flex items-center gap-1.5 text-xs font-bubbly font-bold text-rich-berry dark:text-star-gold hover:underline group-hover:translate-x-1 transition-transform"
                >
                  <span>Open Full Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          )}

          {/* ======================================================== */}
          {/* CARD 2: NIGHTLIGHT SANCTUARY (Luminescent Defense)      */}
          {/* ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'lighting') && (
            <article
              data-project-card="true"
              className="project-card group relative bg-white/95 dark:bg-plum rounded-[32px] p-6 sm:p-7 border-2 border-rich-berry/20 dark:border-star-gold/25 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
              aria-label="Project 2: Nightlight Sanctuary"
            >
              {/* Dynamic Glow Aura Backdrop based on active mood */}
              <div
                className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl group-hover:scale-125 transition-all duration-500 opacity-40 dark:opacity-30"
                style={{ backgroundColor: currentGlow.hex }}
                aria-hidden="true"
              />

              {/* Top Tag & Classification */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-bubbly text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-soft-blush/60 dark:bg-plum-dark text-rich-berry dark:text-soft-blush border border-rich-berry/20">
                    #02 • LUMEN SANCTUARY
                  </span>

                  {/* Active Mood Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream dark:bg-plum-dark border border-rich-berry/10">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: currentGlow.hex }}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-bubbly font-bold text-warm-brown/80 dark:text-cream/80">
                      {currentGlow.name}
                    </span>
                  </div>
                </div>

                {/* Card Artwork Showcase Container */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-rich-berry/20 bg-cream dark:bg-plum-dark p-3.5 mb-5 group-hover:border-rich-berry/40 transition-colors shadow-inner flex items-center justify-center">
                  <div
                    className="relative w-full h-44 flex items-center justify-center rounded-xl transition-all duration-500"
                    style={{
                      background: `radial-gradient(circle, ${currentGlow.hex}25 0%, transparent 70%)`,
                    }}
                  >
                    <img
                      src="/assets/pip_dream_lantern.png"
                      alt="Pip's official crescent moon dream lantern glowing warmly"
                      className="h-40 w-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
                      style={{
                        filter: `drop-shadow(0 0 16px ${currentGlow.hex})`,
                      }}
                    />
                  </div>

                  {/* Live Glow Palette Swatches Bar */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-plum/90 backdrop-blur-sm rounded-xl p-2 border border-rich-berry/15 flex items-center justify-between">
                    <span className="font-bubbly text-xs font-semibold text-warm-brown dark:text-cream">
                      Mood:
                    </span>
                    <div className="flex items-center gap-2">
                      {GLOW_OPTIONS.map((g) => (
                        <button
                          key={g.id}
                          onClick={(e) => handleGlowPick(g.id, e)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            activeGlow === g.id
                              ? 'border-warm-brown dark:border-white scale-125 shadow-md'
                              : 'border-transparent hover:scale-110 opacity-70'
                          }`}
                          style={{ backgroundColor: g.hex }}
                          aria-label={`Select ${g.name} lantern glow`}
                          title={g.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold group-hover:text-rich-berry transition-colors">
                  Nightlight Sanctuary
                </h3>

                <p className="font-bubbly text-xs sm:text-sm text-warm-brown/85 dark:text-cream/80 mt-2 leading-relaxed">
                  Pip's official crescent moon dream lantern with dynamic SVG glow filters, 4 emotional color moods, and day/night ambience previews.
                </p>

                {/* Key Spec Badges */}
                <div className="mt-4 pt-3 border-t border-rich-berry/10 flex flex-wrap gap-2 text-[11px] font-bubbly">
                  <span className="px-2.5 py-1 rounded-lg bg-soft-blush/30 dark:bg-plum-dark text-warm-brown/80 dark:text-cream/80">
                    🌙 Day/Night Preview
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-soft-blush/30 dark:bg-plum-dark text-warm-brown/80 dark:text-cream/80">
                    ⏳ 4 Slumber Timers
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-soft-blush/30 dark:bg-plum-dark text-warm-brown/80 dark:text-cream/80">
                    🛡️ Night Terror Ward
                  </span>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-rich-berry/15 flex items-center justify-between gap-3">
                <span className="text-xs font-bubbly text-warm-brown/70 dark:text-cream/70 italic">
                  “Casts away bad dreams”
                </span>

                <a
                  href="#nightlight"
                  onClick={() => play('nav-click')}
                  className="inline-flex items-center gap-1.5 text-xs font-bubbly font-bold text-rich-berry dark:text-star-gold hover:underline group-hover:translate-x-1 transition-transform"
                >
                  <span>Adjust Sanctuary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          )}

          {/* ======================================================== */}
          {/* CARD 3: DREAM DELIVERY ROUTES (Starlight Navigation)    */}
          {/* ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'routes') && (
            <article
              data-project-card="true"
              className="project-card group relative bg-white/95 dark:bg-plum rounded-[32px] p-6 sm:p-7 border-2 border-rich-berry/20 dark:border-star-gold/25 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
              aria-label="Project 3: Dream Delivery Routes"
            >
              {/* Star Gold Backdrop */}
              <div
                className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 bg-star-gold/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500"
                aria-hidden="true"
              />

              {/* Top Tag & Classification */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-bubbly text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-soft-blush/60 dark:bg-plum-dark text-rich-berry dark:text-soft-blush border border-rich-berry/20">
                    #03 • SKY LOGISTICS
                  </span>

                  {/* Route Status Mini Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream dark:bg-plum-dark border border-rich-berry/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-bubbly font-bold text-warm-brown/80 dark:text-cream/80 uppercase">
                      {deliveryStatus === 'dispatching' ? 'IN FLIGHT' : 'WAYPOINTS READY'}
                    </span>
                  </div>
                </div>

                {/* Card Artwork Showcase Container */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-rich-berry/20 bg-cream dark:bg-plum-dark p-3.5 mb-5 group-hover:border-rich-berry/40 transition-colors shadow-inner flex items-center justify-center">
                  <div className="relative w-full h-44 bg-gradient-to-br from-indigo-950/20 to-purple-950/30 rounded-xl flex items-center justify-center p-3">
                    {/* Mini SVG Route Silhouette */}
                    <svg viewBox="0 0 400 150" className="w-full h-full opacity-70">
                      <path
                        d="M 40 80 Q 140 20 220 70 T 360 40"
                        fill="none"
                        stroke="#f3cf75"
                        strokeWidth="3"
                        strokeDasharray="6 4"
                      />
                      <circle cx="40" cy="80" r="7" fill="#a34063" />
                      <circle cx="220" cy="70" r="7" fill="#d9c8ef" />
                      <circle cx="360" cy="40" r="7" fill="#f3cf75" />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl filter drop-shadow-[0_0_12px_#f3cf75] animate-floating">
                        ⭐
                      </span>
                    </div>
                  </div>

                  {/* Quick Dispatch Pill Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-plum/90 backdrop-blur-sm rounded-xl p-2 border border-rich-berry/15 flex items-center justify-between">
                    <span className="font-bubbly text-xs font-semibold text-warm-brown dark:text-cream">
                      Destinations: 3 Ports
                    </span>
                    <button
                      onClick={handleDispatchClick}
                      className="px-2.5 py-1 rounded-lg bg-rich-berry hover:bg-rich-berry/90 text-white font-bubbly text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="Launch dream dispatch"
                    >
                      <Send className="w-3 h-3" />
                      <span>Deliver Dream</span>
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold group-hover:text-rich-berry transition-colors">
                  Dream Delivery Routes
                </h3>

                <p className="font-bubbly text-xs sm:text-sm text-warm-brown/85 dark:text-cream/80 mt-2 leading-relaxed">
                  Interactive SVG starlight courier route connecting 3 dreamy waypoints. Features smooth cubic curve motion physics and reduced-motion support.
                </p>

                {/* Destination Waypoint Badges */}
                <div className="mt-4 pt-3 border-t border-rich-berry/10 flex flex-wrap gap-1.5 text-[10px] font-bubbly">
                  {DELIVERY_WAYPOINTS.map((wp) => (
                    <span
                      key={wp.id}
                      className="px-2 py-0.5 rounded-md bg-soft-blush/30 dark:bg-plum-dark text-warm-brown/80 dark:text-cream/80"
                    >
                      {wp.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-rich-berry/15 flex items-center justify-between gap-3">
                <span className="text-xs font-bubbly text-warm-brown/70 dark:text-cream/70 italic">
                  “Zero teleportation”
                </span>

                <a
                  href="#map"
                  onClick={() => play('nav-click')}
                  className="inline-flex items-center gap-1.5 text-xs font-bubbly font-bold text-rich-berry dark:text-star-gold hover:underline group-hover:translate-x-1 transition-transform"
                >
                  <span>Explore Route Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
};
