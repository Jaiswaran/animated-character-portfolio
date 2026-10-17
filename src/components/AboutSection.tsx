/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const PIP_PORTRAIT_FALLBACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1XDG3rpJQyJJ7pQ7o8TgEabgHL7ROOX6YQUaXSV8h9OAJNgx9dkAiCE0OPVXLnGuibW5EIr1A2C3n-RWy3jYkodcpLrI7Rosz8S67C3ub2RP4eHAs2bm0AGORyztopL6XMoP6i0KDCZD8t1j30X55ExiVN9HTf1QbZpTJ-CNMqoVLvYpiR4HIOrHO0cXmv-pncNclQHXOXLBmsC7WRqxnnTvX12eu3MhmlPQ12vX5gOrwcQaOCTSTq79ec1hJmbqA-w';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="py-16 md:py-20 bg-soft-blush/20 dark:bg-plum/40 border-y border-rich-berry/10 relative"
      aria-label="About Pip Nursery Staff Dossier"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-soft-blush dark:bg-plum px-3.5 py-1 rounded-full border border-rich-berry/20">
            Official Personnel Record
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-3">
            Nursery Staff Dossier
          </h2>
          <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
            Laminated credentials issued under the starry seal of Sector 9 Slumber Directorate.
          </p>
        </div>

        {/* ID Card Dossier Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Staff Laminated Badge */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-white dark:bg-plum-dark rounded-3xl p-6 border-4 border-dashed border-rich-berry shadow-2xl relative">
              {/* Badge Lanyard Hole Punch */}
              <div
                className="w-16 h-3 bg-warm-brown/20 rounded-full mx-auto mb-4 border border-warm-brown/40"
                aria-hidden="true"
              />

              {/* Laminated Photo Container with Official Portrait */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-rich-berry/30 bg-cream">
                <img
                  src="/assets/pip_portrait.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PIP_PORTRAIT_FALLBACK;
                  }}
                  alt="Official portrait of Pip holding the glowing dream lantern and unicorn music box while perched on a cloud"
                  className="w-full h-auto object-cover hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-plum/90 backdrop-blur-sm rounded-lg p-2 text-center border border-rich-berry/20">
                  <p className="font-serif-headline font-bold text-rich-berry dark:text-star-gold text-lg">
                    Pip
                  </p>
                  <p className="font-bubbly text-[11px] text-warm-brown/80 dark:text-cream/80">
                    Badge #SL-0091 • Certified Dream Crafter
                  </p>
                </div>
              </div>

              {/* Holo Sticker Stamp */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t-2 border-dashed border-rich-berry/20">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center text-xs shadow-inner"
                    aria-hidden="true"
                  >
                    ✨
                  </div>
                  <span className="font-bubbly text-xs text-warm-brown/70 dark:text-cream/70 font-semibold">
                    AUTHENTIC SLUMBER ID
                  </span>
                </div>
                <div className="font-serif-headline text-xs italic text-rich-berry dark:text-star-gold font-semibold">
                  Valid Forever &amp; Ever
                </div>
              </div>
            </div>
          </div>

          {/* Right: Detailed Character Sheet Attributes */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-plum rounded-3xl p-6 sm:p-8 border-2 border-rich-berry/20 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rich-berry/15 pb-4">
                <div>
                  <h3 className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold">
                    Pip (The Skull Baby)
                  </h3>
                  <p className="font-bubbly text-xs sm:text-sm text-rich-berry dark:text-soft-blush">
                    Official Classification: Level 1 Slumbertician
                  </p>
                </div>
                <span className="px-3 py-1 bg-star-gold/30 text-warm-brown rounded-full font-bubbly text-xs border border-star-gold font-semibold">
                  🌙 100% Cozy Certified
                </span>
              </div>

              {/* Spec Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm font-bubbly">
                <div className="bg-cream/60 dark:bg-plum-dark/60 p-4 rounded-xl border border-warm-brown/10">
                  <span className="text-xs uppercase text-rich-berry dark:text-star-gold font-bold block mb-1">
                    Visual Anatomy
                  </span>
                  <p className="text-warm-brown/90 dark:text-cream/80 leading-relaxed text-xs">
                    Smooth ivory ceramic-like skull, wide gentle eye sockets with a soft ember amber glow, warm blush cheeks, and a signature sleepy star-print nightcap with pink knot bow.
                  </p>
                </div>

                <div className="bg-cream/60 dark:bg-plum-dark/60 p-4 rounded-xl border border-warm-brown/10">
                  <span className="text-xs uppercase text-rich-berry dark:text-star-gold font-bold block mb-1">
                    Wardrobe Details
                  </span>
                  <p className="text-warm-brown/90 dark:text-cream/80 leading-relaxed text-xs">
                    Snug cream pajama onesie patterned with faint pastel peach hearts, lavender felt padded booties, and cozy oversized nightcap pom-pom.
                  </p>
                </div>

                <div className="bg-cream/60 dark:bg-plum-dark/60 p-4 rounded-xl border border-warm-brown/10">
                  <span className="text-xs uppercase text-rich-berry dark:text-star-gold font-bold block mb-1">
                    Favorite Things
                  </span>
                  <ul className="text-warm-brown/90 dark:text-cream/80 space-y-1 text-xs">
                    <li>🍼 Warm honeyed almond milk</li>
                    <li>🎶 Wind-up lullaby key clicks</li>
                    <li>☁️ Tucking restless stray clouds into bed</li>
                    <li>✨ Watching fireflies rest on the nursery ledge</li>
                  </ul>
                </div>

                <div className="bg-cream/60 dark:bg-plum-dark/60 p-4 rounded-xl border border-warm-brown/10">
                  <span className="text-xs uppercase text-rich-berry dark:text-star-gold font-bold block mb-1">
                    Quirks &amp; Habits
                  </span>
                  <ul className="text-warm-brown/90 dark:text-cream/80 space-y-1 text-xs">
                    <li>🕯️ Cannot sleep in pitch silence (requires music)</li>
                    <li>⚡ Trips over pajama cuff when carrying lantern</li>
                    <li>💤 Speaks fluent “Sleep-murmur” to pillow spirits</li>
                  </ul>
                </div>
              </div>

              {/* Official Slumber Motto */}
              <div className="mt-6 pt-4 border-t border-rich-berry/15 flex items-center gap-3">
                <span className="text-2xl select-none" aria-hidden="true">
                  🧸
                </span>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-rich-berry dark:text-star-gold font-bold block">
                    Official Motto:
                  </span>
                  <span className="font-serif-headline text-base sm:text-lg italic text-plum dark:text-cream font-medium">
                    “No nightmare left behind. Every wandering sleeper gets a warm blanket.”
                  </span>
                </div>
              </div>

              {/* Quick stats swipe bar from character sheet */}
              <div className="mt-4 pt-3 border-t border-rich-berry/10 grid grid-cols-3 text-center gap-2">
                <div className="bg-cream/50 dark:bg-plum-dark/50 py-2 px-1 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-warm-brown/70 dark:text-cream/60 font-bold">
                    Sleep Power
                  </div>
                  <div className="font-bubbly font-bold text-sm text-plum dark:text-star-gold">
                    99.8%
                  </div>
                </div>
                <div className="bg-cream/50 dark:bg-plum-dark/50 py-2 px-1 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-warm-brown/70 dark:text-cream/60 font-bold">
                    Dream Yarn
                  </div>
                  <div className="font-bubbly font-bold text-sm text-rich-berry dark:text-soft-blush">
                    100% Cotton
                  </div>
                </div>
                <div className="bg-cream/50 dark:bg-plum-dark/50 py-2 px-1 rounded-xl">
                  <div className="text-[10px] uppercase tracking-wider text-warm-brown/70 dark:text-cream/60 font-bold">
                    Mood
                  </div>
                  <div className="font-bubbly font-bold text-sm text-amber-500 dark:text-amber-300">
                    Snuggly
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
