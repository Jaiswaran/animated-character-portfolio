/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Shield, Heart } from 'lucide-react';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard accessibility: ESC key handler & focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Focus the primary dismiss button on mount
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Mini starry burst celebration on canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#f3cf75', '#f1c9d6', '#d9c8ef', '#ffffff', '#ffd1dc'];
    const stars = Array.from({ length: 36 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      return {
        x: canvas.width / 2,
        y: canvas.height / 2 - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      };
    });

    let frameId: number;
    const renderCelebration = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      stars.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.015;
        if (s.alpha > 0) {
          alive = true;
          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.max(0, s.alpha);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      if (alive) {
        frameId = requestAnimationFrame(renderCelebration);
      }
    };

    renderCelebration();
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="easter-egg-title"
      className="fixed inset-0 z-50 bg-plum/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-cream dark:bg-plum border-4 border-dashed border-star-gold rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Starlight Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full z-0"
          aria-hidden="true"
        />

        {/* Close Button with ESC key label */}
        <button
          onClick={onClose}
          aria-label="Close secret dialog (Press Escape)"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-soft-blush/60 dark:bg-plum-dark text-warm-brown dark:text-cream font-bold text-sm flex items-center justify-center hover:bg-soft-blush transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative z-10">
          <div className="text-4xl mb-2 flex items-center justify-center gap-2" aria-hidden="true">
            <Sparkles className="w-6 h-6 text-star-gold animate-bounce" />
            <span>👶</span>
            <Sparkles className="w-6 h-6 text-star-gold animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>

          <h3
            id="easter-egg-title"
            className="font-serif-headline text-2xl font-bold text-plum dark:text-star-gold mb-2"
          >
            You Found Pip's Secret Pillow!
          </h3>

          <p className="font-body text-xs text-warm-brown/90 dark:text-cream/90 leading-relaxed mb-4">
            Pip peeked out of his blanket fort to whisper:{' '}
            <em className="font-serif-headline text-rich-berry dark:text-soft-blush block mt-1">
              “Thank you for visiting my observatory! May your bugs be few and your slumber be sweet.”
            </em>
          </p>

          <div className="p-3 bg-star-gold/25 rounded-2xl text-xs font-bubbly text-rich-berry dark:text-star-gold mb-5 border border-star-gold/50 flex items-center justify-center gap-2 shadow-inner">
            <Shield className="w-4 h-4 text-star-gold" />
            <span className="font-bold">Special Buff: +100 Sleepiness &amp; Dream Shield 🛡️</span>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-rich-berry hover:bg-rich-berry/90 text-white font-bubbly text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Tuck Pip Back In 💤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
