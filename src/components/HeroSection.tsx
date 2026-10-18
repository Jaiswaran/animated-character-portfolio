/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowDown } from 'lucide-react';
import { calculateTilt, TiltValues } from '../utils/tilt';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { Pip3DCharacter } from './Pip3DCharacter';

export const HeroSection: React.FC = () => {
  const { play } = useSoundEffects();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<TiltValues>({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [touchBounce, setTouchBounce] = useState(false);

  // Respect the OS motion preference, including when it changes while the page is open.
  const [motionAllowed, setMotionAllowed] = useState(true);
  const bounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncMotionPreference = () => {
      const allowed = !motionPreference.matches;
      setMotionAllowed(allowed);

      if (!allowed) {
        setIsHovered(false);
        setTilt({ rotateX: 0, rotateY: 0 });
        setTouchBounce(false);
        if (bounceTimerRef.current !== null) {
          window.clearTimeout(bounceTimerRef.current);
          bounceTimerRef.current = null;
        }
      }
    };

    syncMotionPreference();
    motionPreference.addEventListener?.('change', syncMotionPreference);

    return () => {
      motionPreference.removeEventListener?.('change', syncMotionPreference);
      if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch input should tap to greet, not make the character chase a finger.
    if (!motionAllowed || e.pointerType === 'touch' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    // calculateTilt clamps all edges, so the rotation can never run away.
    const newTilt = calculateTilt(e.clientX, e.clientY, rect, 5);
    setTilt(newTilt);
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const handleHello = () => {
    play('button-click');
    if (!motionAllowed) return;

    if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current);
    setTouchBounce(true);
    bounceTimerRef.current = window.setTimeout(() => {
      setTouchBounce(false);
      bounceTimerRef.current = null;
    }, 420);
  };

  const handleCharacterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHello();
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-8 pb-14 md:py-24"
      aria-label="Hero Introduction"
    >
      {/* Decorative dashed orbits and celestial stars */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] border border-dashed border-rich-berry/15 rounded-full dark:border-star-gold/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[900px] h-[900px] border border-dashed border-rich-berry/10 rounded-full dark:border-star-gold/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/12 text-star-gold opacity-60 text-lg animate-pulse"
        aria-hidden="true"
      >
        ✦
      </div>
      <div
        className="pointer-events-none absolute top-1/3 right-1/4 text-star-gold opacity-40 text-base animate-pulse"
        style={{ animationDelay: '1.5s' }}
        aria-hidden="true"
      >
        ✧
      </div>
      <div
        className="pointer-events-none absolute bottom-1/4 left-1/3 text-soft-blush opacity-50 text-2xl animate-floating-slow"
        aria-hidden="true"
      >
        ☁️
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center pt-2 pb-6 sm:pb-12">
          {/* Left Column: Typography, Tagline, CTAs */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            {/* Status Sticker */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-soft-blush/40 border border-rich-berry/20 shadow-sm max-w-full">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
              <span className="font-bubbly text-[10px] sm:text-xs tracking-wider uppercase text-rich-berry dark:text-soft-blush font-semibold truncate">
                MIDNIGHT NURSERY / DREAM ENGINEERING DEPT.
              </span>
            </div>

            {/* Editorial Serif Headline */}
            <h1 className="font-serif-headline text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-plum dark:text-star-gold">
              Little Baby.
              <br />
              <span className="italic font-normal text-rich-berry dark:text-soft-blush">
                Big Dreams.
              </span>
            </h1>

            {/* Subheading / Character Canon Bio */}
            <p className="font-bubbly text-base sm:text-xl text-warm-brown/90 dark:text-cream/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Meet <strong className="text-rich-berry dark:text-star-gold font-bold">Pip</strong>, Junior Dream Engineer at the Midnight Nursery. He crafts soft clouds, spins lullaby music boxes, and ensures every wandering nightmare is tucked into a warm blanket.
            </p>

            {/* Stitched Tagline Quote Box */}
            <div className="border-stitch bg-white/85 dark:bg-plum/70 p-3.5 sm:p-5 rounded-2xl max-w-lg mx-auto lg:mx-0 transform -rotate-1 hover:rotate-0 transition-transform shadow-md">
              <div className="flex items-center gap-2 sm:gap-3">
                <span
                  className="text-2xl sm:text-3xl text-rich-berry dark:text-star-gold select-none leading-none font-serif-headline"
                  aria-hidden="true"
                >
                  “
                </span>
                <p className="font-serif-headline italic text-rich-berry dark:text-star-gold font-medium text-sm sm:text-lg leading-snug">
                  I build the dreams you fall asleep inside.
                </p>
                <span className="text-[10px] sm:text-xs font-bubbly text-warm-brown/60 dark:text-cream/60 ml-auto whitespace-nowrap">
                  — Pip, 9:45 PM
                </span>
              </div>
            </div>

            {/* Action Buttons & Status Pill */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#projects"
                onClick={() => play('button-click')}
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-rich-berry hover:bg-rich-berry/90 text-white font-bubbly text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 active:scale-98"
              >
                <span>Explore the Three Worlds</span>
                <span className="text-star-gold text-lg leading-none" aria-hidden="true">
                  ♫
                </span>
              </a>
              <a
                href="#projects"
                onClick={() => play('button-click')}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-plum text-warm-brown dark:text-star-gold hover:bg-soft-blush/30 font-bubbly text-sm sm:text-base font-semibold border-2 border-rich-berry/20 shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Choose a Dream Adventure</span>
                <Sparkles className="w-4 h-4 text-star-gold flex-shrink-0" aria-hidden="true" />
              </a>
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-star-gold/20 border border-star-gold/40 text-warm-brown dark:text-cream font-bubbly text-xs shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>currently dreaming...</span>
                <Sparkles className="w-3.5 h-3.5 text-star-gold" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Right Column: Pip's Official Cloud Avatar Artwork with subtle pointer-responsive movement */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center">
            <div
              ref={cardRef}
              role="button"
              tabIndex={0}
              aria-label="Say hello to Pip. The floating character's eyes follow your pointer."
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onClick={handleHello}
              onKeyDown={handleCharacterKeyDown}
              className={`pip-character-hit-area relative w-full max-w-[360px] sm:max-w-[520px] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-star-gold focus-visible:ring-offset-4 ${motionAllowed ? 'transition-transform duration-200 ease-out' : ''}`}
              style={{
                transform: !motionAllowed
                  ? 'none'
                  : touchBounce
                  ? 'translateY(-5px) scale(1.015)'
                  : isHovered
                  ? `perspective(1000px) rotateX(${tilt.rotateX * 0.35}deg) rotateY(${tilt.rotateY * 0.35}deg) scale3d(1.01, 1.01, 1.01)`
                  : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              }}
              title="Move the pointer to guide Pip's eyes. Click, tap, or press Enter to wave hello."
            >
              {/* Dynamic Aura Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr from-soft-blush via-star-gold/40 to-dream-lavender rounded-[48px] blur-2xl opacity-75 -z-10 ${motionAllowed ? 'animate-soft-glow' : ''}`}
                aria-hidden="true"
              />
              <Pip3DCharacter motionAllowed={motionAllowed} isWaving={touchBounce} />
            </div>
          </div>
        </div>

        {/* Scroll Invitation Link */}
        <div className="pt-2 pb-2 flex justify-center">
          <a
            href="#about"
            onClick={() => play('nav-click')}
            className="inline-flex items-center gap-1.5 text-xs font-bubbly font-semibold text-warm-brown/70 dark:text-cream/70 hover:text-rich-berry dark:hover:text-star-gold tracking-wide transition-colors animate-bounce"
          >
            <span>Scroll to enter the observatory</span>
            <ArrowDown className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};
