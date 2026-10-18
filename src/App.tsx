/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MainNavigation } from './components/MainNavigation';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { OriginStorySection } from './components/OriginStorySection';
import { GuestbookSection } from './components/GuestbookSection';
import { FooterSection } from './components/FooterSection';
import { EasterEggModal } from './components/EasterEggModal';
import { ChaosSparkles } from './components/ChaosSparkles';
import { CustomCursor } from './components/CustomCursor';
import { SoundEffectsProvider } from './context/SoundEffectsContext';
import { ProjectShowcaseSection } from './components/ProjectShowcaseSection';
import { GlowMode } from './utils/nightlight';
import { useLullabyAudio } from './hooks/useLullabyAudio';

const THEME_STORAGE_KEY = 'pip_observatory_theme';
const CURSOR_STORAGE_KEY = 'pip_cursor_enabled';

function ObservatoryContent() {
  // Theme state persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return false;
    }
    return false;
  });

  // Custom Cursor state persisted in localStorage (default enabled on desktop)
  const [isCursorEnabled, setIsCursorEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CURSOR_STORAGE_KEY);
      if (saved === 'false') return false;
      return true;
    }
    return true;
  });

  // Start muted by default as requested in Phase 2
  const lullaby = useLullabyAudio(true);

  // Synchronized Project Showcase States
  const [activeGlow, setActiveGlow] = useState<GlowMode>('amber');
  const [deliveryStatus, setDeliveryStatus] = useState<string>('idle');

  const [isChaosMode, setIsChaosMode] = useState(false);
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);

  // Sync dark mode class on <html> and persist preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
      } catch {}
    }
  }, [isDarkMode]);

  const handleToggleCursor = useCallback(() => {
    setIsCursorEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CURSOR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleLullaby = useCallback(() => {
    if (!lullaby.isPlaying) {
      lullaby.setMuted(false);
      lullaby.play();
    } else {
      lullaby.setMuted(!lullaby.isMuted);
    }
  }, [lullaby]);

  return (
    <div className="min-h-screen bg-cream text-warm-brown antialiased dark:bg-plum-dark dark:text-cream selection:bg-soft-blush selection:text-plum transition-colors duration-300">
      {/* Magical Celestial Custom Cursor */}
      <CustomCursor enabled={isCursorEnabled} />

      {/* Chaos Mode Particle Canvas */}
      <ChaosSparkles isActive={isChaosMode} />

      {/* Navigation Header with Lullaby, SFX, Cursor, Chaos, and Theme controls */}
      <MainNavigation
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        isLullabyMuted={lullaby.isMuted}
        isLullabyPlaying={lullaby.isPlaying}
        onToggleLullaby={handleToggleLullaby}
        isChaosMode={isChaosMode}
        onToggleChaosMode={() => setIsChaosMode((prev) => !prev)}
        isCursorEnabled={isCursorEnabled}
        onToggleCursor={handleToggleCursor}
      />

      {/* Main Observatory Content */}
      <main>
        {/* 1. Hero Section with pointer-responsive character reaction */}
        <HeroSection />

        {/* 2. Pip's complete five-scene story is the heart of the portfolio. */}
        <OriginStorySection />

        {/* 3. About Pip: the junior dream engineer behind the journey. */}
        <AboutSection />

        {/* 4. Explore the interactive inventions that bring the story to life. */}
        <ProjectShowcaseSection
          lullaby={lullaby}
          activeGlow={activeGlow}
          onSelectGlow={setActiveGlow}
          deliveryStatus={deliveryStatus}
          onDeliveryStatusChange={setDeliveryStatus}
        />

        {/* 7. Starlight Ledger Guestbook & Mechanical Odometer */}
        <GuestbookSection onOpenEasterEgg={() => setIsEasterEggOpen(true)} />
      </main>

      {/* 8. Footer & Asset Credits with Secret Constellation */}
      <FooterSection onOpenEasterEgg={() => setIsEasterEggOpen(true)} />

      {/* 9. Secret Easter Egg Modal with celebration burst and keyboard accessibility */}
      <EasterEggModal
        isOpen={isEasterEggOpen}
        onClose={() => setIsEasterEggOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <SoundEffectsProvider>
      <ObservatoryContent />
    </SoundEffectsProvider>
  );
}
