/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="easter-egg-title"
      className="fixed inset-0 z-50 bg-plum/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-cream dark:bg-plum border-4 border-dashed border-star-gold rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close secret popup"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-soft-blush/60 dark:bg-plum-dark text-warm-brown dark:text-cream font-bold text-sm flex items-center justify-center hover:bg-soft-blush transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="text-4xl mb-3" aria-hidden="true">
          ✨👶✨
        </div>

        <h3
          id="easter-egg-title"
          className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold mb-2"
        >
          You Found Pip's Secret Pillow!
        </h3>

        <p className="font-body text-xs text-warm-brown/90 dark:text-cream/90 leading-relaxed mb-4">
          Pip peeked out of his blanket fort to whisper:{' '}
          <em className="font-serif-headline">
            “Thank you for stopping by my observatory! Always remember to keep your head cozy and your code tidy.”
          </em>
        </p>

        <div className="p-3 bg-star-gold/20 rounded-xl text-[11px] font-bubbly text-rich-berry dark:text-star-gold mb-4 border border-star-gold/40">
          Special Buff Unlocked: +100 Sleepiness &amp; Dream Shield 🛡️
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-rich-berry text-white font-bubbly text-xs font-bold hover:bg-rich-berry/90 transition-all shadow cursor-pointer active:scale-95"
        >
          Tuck Pip Back In 💤
        </button>
      </div>
    </div>
  );
};
