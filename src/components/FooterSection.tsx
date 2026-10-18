/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Sparkles } from 'lucide-react';
export const FooterSection: React.FC = () => {

  return (
    <footer
      className="bg-plum text-cream/80 py-12 border-t-4 border-rich-berry text-xs font-bubbly relative"
      aria-label="Observatory Colophon and Credits"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-serif-headline text-lg font-bold text-star-gold block">
              Pip's Midnight Observatory
            </span>
            <span className="text-cream/70">
              Official Track 1 Entry for haX.baby 48-Hour Hackathon
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="retro-border bg-rich-berry/80 text-white px-2.5 py-1 rounded">
              BEST VIEWED IN BED
            </span>
            <span className="retro-border bg-star-gold text-warm-brown px-2.5 py-1 rounded">
              COOKIE FREE • 100% SNOOZE
            </span>
            <div className="inline-block px-3 py-1 rounded-full bg-soft-blush/20 border border-soft-blush/40 text-soft-blush font-bubbly text-[11px]">
              ★ Best viewed tucked under a warm blanket ★
            </div>
          </div>
        </div>

        {/* Decorative constellation; the only hidden secret is in the final story scene. */}
        <div className="flex items-center justify-center gap-3 py-2 text-star-gold/60 text-sm select-none" aria-hidden="true">
          <Sparkles className="w-4 h-4" />
          <span>•</span>
          <Star className="w-4 h-4 fill-star-gold/40" />
          <span>•</span>
          <Sparkles className="w-5 h-5 text-star-gold" />
          <span>•</span>
          <Star className="w-4 h-4 fill-star-gold/40" />
          <span>•</span>
          <Sparkles className="w-4 h-4" />
        </div>

        <p className="text-cream/50 text-[11px] leading-relaxed text-center sm:text-left">
          Crafted with warmth, starlight, and gentle whimsy. Character design and visual imagery property of the haX.baby challenge repository. Official assets: Pip Avatar Cloud, Pip Lullaby Music Box, Pip Crescent Dream Lantern, and Pip Staff Portrait. No nightmares were harmed in the making of this observatory.
        </p>
      </div>
    </footer>
  );
};
