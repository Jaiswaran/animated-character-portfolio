/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Music,
  MousePointer2,
  Bell,
  BellOff,
} from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface MainNavigationProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isLullabyMuted: boolean;
  isLullabyPlaying: boolean;
  onToggleLullaby: () => void;
  isChaosMode: boolean;
  onToggleChaosMode: () => void;
  isCursorEnabled: boolean;
  onToggleCursor: () => void;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({
  isDarkMode,
  onToggleDarkMode,
  isLullabyMuted,
  isLullabyPlaying,
  onToggleLullaby,
  isChaosMode,
  onToggleChaosMode,
  isCursorEnabled,
  onToggleCursor,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { play, isMuted: isSfxMuted, toggleMute: onToggleSfx } = useSoundEffects();

  const navLinks = [
    { label: 'About Pip', href: '#about' },
    { label: 'Lullaby Lab', href: '#lullaby' },
    { label: 'Nightlights', href: '#nightlight' },
    { label: 'Dream Delivery', href: '#map' },
    { label: 'Origin Story', href: '#origin' },
    { label: 'Guestbook', href: '#guestbook' },
  ];

  const handleNavClick = () => {
    play('nav-click');
    setMobileMenuOpen(false);
  };

  const handleLullabyToggle = () => {
    play('button-click');
    onToggleLullaby();
  };

  const handleSfxToggle = () => {
    // If about to unmute, play button click right after unmuting
    play('button-click');
    onToggleSfx();
  };

  const handleCursorToggle = () => {
    play('button-click');
    onToggleCursor();
  };

  const handleChaosToggle = () => {
    play('chaos-toggle');
    onToggleChaosMode();
  };

  const handleThemeToggle = () => {
    play('button-click');
    onToggleDarkMode();
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b-2 border-rich-berry/20 dark:bg-plum/95 dark:border-star-gold/20 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and branding */}
        <a
          href="#"
          onClick={() => play('nav-click')}
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
              {/* Responsive Title: "Pip's Observatory" on small mobile, full name on sm+ */}
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
          className="hidden xl:flex items-center gap-5 font-bubbly text-xs tracking-wide uppercase font-semibold"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className="text-warm-brown/80 hover:text-rich-berry dark:text-cream/80 dark:hover:text-star-gold transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Header Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Lullaby Music Box Toggle */}
          <button
            onClick={handleLullabyToggle}
            aria-label={
              isLullabyPlaying && !isLullabyMuted
                ? 'Lullaby playing. Click to mute'
                : 'Lullaby muted. Click to play music box'
            }
            aria-pressed={isLullabyPlaying && !isLullabyMuted}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-bubbly transition-all cursor-pointer ${
              isLullabyPlaying && !isLullabyMuted
                ? 'bg-rich-berry text-white border-rich-berry shadow-sm'
                : 'bg-soft-blush/40 hover:bg-soft-blush border-rich-berry/20 text-warm-brown dark:bg-plum-dark dark:border-star-gold/40 dark:text-cream'
            }`}
          >
            {isLullabyPlaying && !isLullabyMuted ? (
              <Music className="w-3.5 h-3.5 text-star-gold animate-bounce" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold" />
            )}
            <span className="hidden sm:inline font-medium">
              Lullaby: {isLullabyPlaying && !isLullabyMuted ? 'ON' : 'MUTED'}
            </span>
          </button>

          {/* UI Sound Effects Mute Toggle */}
          <button
            onClick={handleSfxToggle}
            aria-label={
              isSfxMuted
                ? 'Interface sound effects muted. Click to turn sound effects on'
                : 'Interface sound effects active. Click to mute sound effects'
            }
            aria-pressed={!isSfxMuted}
            className={`px-2 sm:px-2.5 py-1.5 rounded-full border flex items-center gap-1 text-xs font-bubbly transition-all cursor-pointer ${
              !isSfxMuted
                ? 'bg-star-gold/30 hover:bg-star-gold/50 border-star-gold/60 text-warm-brown dark:text-cream shadow-xs'
                : 'bg-gray-200/60 dark:bg-plum-dark border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400'
            }`}
            title={!isSfxMuted ? 'Sound Effects: Active' : 'Sound Effects: Muted'}
          >
            {!isSfxMuted ? (
              <Bell className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold" />
            ) : (
              <BellOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline font-medium">
              SFX: {!isSfxMuted ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Star Cursor Toggle (Desktop Only) */}
          <button
            onClick={handleCursorToggle}
            aria-label={isCursorEnabled ? 'Disable celestial star cursor' : 'Enable celestial star cursor'}
            aria-pressed={isCursorEnabled}
            className={`hidden md:flex px-2 sm:px-2.5 py-1.5 rounded-full border items-center gap-1 text-xs font-bubbly transition-all cursor-pointer ${
              isCursorEnabled
                ? 'bg-soft-blush/60 hover:bg-soft-blush border-rich-berry/30 text-warm-brown dark:bg-plum-card dark:text-cream'
                : 'bg-gray-200/60 dark:bg-plum-dark border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400'
            }`}
            title="Toggle celestial star cursor"
          >
            <MousePointer2 className="w-3.5 h-3.5 text-rich-berry dark:text-star-gold" />
            <span className="font-medium">
              Cursor: {isCursorEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Chaos Mode Toggle (Hidden on extra small, accessible via mobile drawer) */}
          <button
            onClick={handleChaosToggle}
            aria-label={isChaosMode ? 'Turn Chaos Mode Off' : 'Turn Chaos Mode On'}
            aria-pressed={isChaosMode}
            className="hidden lg:flex px-2.5 sm:px-3 py-1.5 rounded-full bg-star-gold/20 hover:bg-star-gold/40 border border-warm-brown/20 items-center gap-1 text-xs font-bubbly text-warm-brown dark:text-cream dark:border-star-gold/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-star-gold animate-spin-slow" aria-hidden="true" />
            <span className="font-medium">
              Chaos: <b>{isChaosMode ? 'ON' : 'OFF'}</b>
            </span>
          </button>

          {/* Day/Night Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            role="switch"
            aria-checked={isDarkMode}
            aria-label={
              isDarkMode
                ? 'Velvet Plum Night mode active. Click for Starlight Cream Day mode'
                : 'Starlight Cream Day mode active. Click for Velvet Plum Night mode'
            }
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
            onClick={() => {
              play('button-click');
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="xl:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-soft-blush/50 dark:bg-plum-dark text-rich-berry dark:text-star-gold flex items-center justify-center border border-rich-berry/20 dark:border-star-gold/30 cursor-pointer"
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
          className="xl:hidden bg-cream dark:bg-plum border-b-2 border-rich-berry/20 dark:border-star-gold/20 px-4 py-4 space-y-2 shadow-lg animate-fadeIn"
          aria-label="Mobile Navigation Drawer"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className="block px-3 py-2 rounded-xl font-bubbly text-sm font-semibold text-warm-brown hover:bg-soft-blush/40 dark:text-cream dark:hover:bg-plum-dark transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-rich-berry/10 dark:border-white/10 flex flex-wrap gap-2 items-center justify-between text-xs font-bubbly text-warm-brown/70 dark:text-cream/70">
            <button
              onClick={handleSfxToggle}
              className="px-3 py-1.5 rounded-full bg-star-gold/20 border border-warm-brown/20 flex items-center gap-1.5 text-xs text-warm-brown dark:text-cream cursor-pointer"
            >
              {!isSfxMuted ? (
                <Bell className="w-3 h-3 text-rich-berry dark:text-star-gold" />
              ) : (
                <BellOff className="w-3 h-3" />
              )}
              <span>SFX: {!isSfxMuted ? 'ON' : 'MUTED'}</span>
            </button>

            <button
              onClick={handleChaosToggle}
              className="px-3 py-1.5 rounded-full bg-star-gold/20 border border-warm-brown/20 flex items-center gap-1.5 text-xs text-warm-brown dark:text-cream cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-star-gold" aria-hidden="true" />
              <span>Chaos Sparkles: <b>{isChaosMode ? 'ON' : 'OFF'}</b></span>
            </button>

            <button
              onClick={handleCursorToggle}
              className="px-3 py-1.5 rounded-full bg-soft-blush/40 border border-rich-berry/20 flex items-center gap-1.5 text-xs text-warm-brown dark:text-cream cursor-pointer"
            >
              <MousePointer2 className="w-3 h-3 text-rich-berry dark:text-star-gold" />
              <span>Cursor: <b>{isCursorEnabled ? 'ON' : 'OFF'}</b></span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
