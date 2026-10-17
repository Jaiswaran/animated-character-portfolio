/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Sparkles, Moon, Sun } from 'lucide-react';

interface MainNavigationProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isLullabyPlaying: boolean;
  onToggleLullaby: () => void;
  isChaosMode: boolean;
  onToggleChaosMode: () => void;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({
  isDarkMode,
  onToggleDarkMode,
  isLullabyPlaying,
  onToggleLullaby,
  isChaosMode,
  onToggleChaosMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'About Pip', href: '#about' },
    { label: 'Lullaby Lab', href: '#lullaby' },
    { label: 'Nightlights', href: '#nightlight' },
    { label: 'Dream Delivery', href: '#map' },
    { label: 'Origin Story', href: '#origin' },
    { label: 'Guestbook', href: '#guestbook' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b-2 border-rich-berry/20 dark:bg-plum/95 dark:border-star-gold/20 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and branding */}
        <a
          href="#"
          className="flex items-center gap-2 sm:gap-3 group focus:outline-none flex-shrink-0"
          aria-label="Pip's Midnight Observatory home"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-soft-blush/60 border-2 border-rich-berry flex items-center justify-center text-rich-berry shadow-sm group-hover:rotate-12 transition-transform dark:bg-plum-dark dark:border-star-gold dark:text-star-gold flex-shrink-0">
            <span className="text-base sm:text-lg leading-none select-none" aria-hidden="true">
              🌙
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {/* Responsive Title: "Pip's Observatory" on mobile, full name on sm+ */}
              <span className="font-serif-headline text-lg sm:hidden font-bold tracking-tight text-rich-berry dark:text-star-gold leading-none">
                Pip's Observatory
              </span>
              <span className="font-serif-headline text-xl lg:text-2xl hidden sm:inline font-bold tracking-tight text-rich-berry dark:text-star-gold leading-none">
                Pip's Midnight Observatory
              </span>
              <span className="text-star-gold text-xs hidden md:inline" aria-hidden="true">
                ★
              </span>
            </div>
            <span className="font-bubbly text-[9px] sm:text-[11px] text-warm-brown/70 dark:text-soft-blush/70 tracking-widest uppercase mt-0.5">
              Dept. of Starlight &amp; Slumber
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-5 xl:gap-7 font-bubbly text-xs tracking-wide uppercase font-semibold"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-warm-brown/80 hover:text-rich-berry dark:text-cream/80 dark:hover:text-star-gold transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Lullaby Audio Control */}
          <button
            onClick={onToggleLullaby}
            aria-label={isLullabyPlaying ? 'Pause Lullaby Music' : 'Play Lullaby Music'}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-soft-blush/40 hover:bg-soft-blush border border-rich-berry/20 flex items-center gap-1.5 sm:gap-2 text-xs font-bubbly dark:bg-plum-dark dark:border-star-gold/40 dark:text-cream transition-all cursor-pointer"
          >
            <div className="flex items-end gap-0.5 h-3.5 w-3.5" aria-hidden="true">
              <span
                className={`w-0.5 sm:w-1 bg-rich-berry dark:bg-star-gold rounded-t ${
                  isLullabyPlaying ? 'eq-bar-1' : 'h-1'
                }`}
              />
              <span
                className={`w-0.5 sm:w-1 bg-rich-berry dark:bg-star-gold rounded-t ${
                  isLullabyPlaying ? 'eq-bar-2' : 'h-1.5'
                }`}
              />
              <span
                className={`w-0.5 sm:w-1 bg-rich-berry dark:bg-star-gold rounded-t ${
                  isLullabyPlaying ? 'eq-bar-3' : 'h-2'
                }`}
              />
              <span
                className={`w-0.5 sm:w-1 bg-rich-berry dark:bg-star-gold rounded-t ${
                  isLullabyPlaying ? 'eq-bar-4' : 'h-1'
                }`}
              />
            </div>
            <span className="hidden sm:inline font-medium">
              Lullaby: {isLullabyPlaying ? 'ON' : 'MUTED'}
            </span>
          </button>

          {/* Chaos Mode Toggle (Hidden on extra small, accessible via mobile drawer) */}
          <button
            onClick={onToggleChaosMode}
            aria-label={isChaosMode ? 'Turn Chaos Mode Off' : 'Turn Chaos Mode On'}
            className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-full bg-star-gold/20 hover:bg-star-gold/40 border border-warm-brown/20 items-center gap-1.5 text-xs font-bubbly text-warm-brown dark:text-cream dark:border-star-gold/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-star-gold animate-spin-slow" aria-hidden="true" />
            <span className="font-medium">
              Chaos: <b>{isChaosMode ? 'ON' : 'OFF'}</b>
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to Starlight Cream Day mode' : 'Switch to Velvet Plum Slumber mode'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rich-berry text-star-gold flex items-center justify-center hover:scale-105 shadow transition-transform cursor-pointer"
          >
            {isDarkMode ? (
              <Moon className="w-4 h-4 text-star-gold" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4 text-amber-light" aria-hidden="true" />
            )}
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-soft-blush/50 dark:bg-plum-dark text-rich-berry dark:text-star-gold flex items-center justify-center border border-rich-berry/20 dark:border-star-gold/30 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden bg-cream dark:bg-plum border-b-2 border-rich-berry/20 dark:border-star-gold/20 px-4 py-4 space-y-2 shadow-lg animate-fadeIn"
          aria-label="Mobile Navigation Drawer"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl font-bubbly text-sm font-semibold text-warm-brown hover:bg-soft-blush/40 dark:text-cream dark:hover:bg-plum-dark transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-rich-berry/10 dark:border-white/10 flex items-center justify-between text-xs font-bubbly text-warm-brown/70 dark:text-cream/70">
            <button
              onClick={onToggleChaosMode}
              className="px-3 py-1.5 rounded-full bg-star-gold/20 border border-warm-brown/20 flex items-center gap-1.5 text-xs text-warm-brown dark:text-cream cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-star-gold" aria-hidden="true" />
              <span>Chaos Sparkles:</span>
              <b>{isChaosMode ? 'ON' : 'OFF'}</b>
            </button>
            <span className="text-rich-berry dark:text-star-gold font-semibold">
              Wind-Up: 100%
            </span>
          </div>
        </nav>
      )}
    </header>
  );
};
