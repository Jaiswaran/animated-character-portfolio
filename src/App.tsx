/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnnouncementMarquee } from './components/AnnouncementMarquee';
import { MainNavigation } from './components/MainNavigation';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { LullabyLabSection } from './components/LullabyLabSection';
import { NightlightSection } from './components/NightlightSection';
import { DreamDeliverySection } from './components/DreamDeliverySection';
import { OriginStorySection } from './components/OriginStorySection';
import { GuestbookSection } from './components/GuestbookSection';
import { FooterSection } from './components/FooterSection';
import { EasterEggModal } from './components/EasterEggModal';
import { ChaosSparkles } from './components/ChaosSparkles';

const THEME_STORAGE_KEY = 'pip_observatory_theme';

export default function App() {
  // Theme state persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      // Default to cream light mode matching Stitch designs
      return false;
    }
    return false;
  });

  // Start muted by default as requested in Phase 2
  const [isMuted, setIsMuted] = useState(true);
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

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-cream text-warm-brown antialiased dark:bg-plum-dark dark:text-cream selection:bg-soft-blush selection:text-plum transition-colors duration-300">
      {/* Chaos Mode Particle Canvas */}
      <ChaosSparkles isActive={isChaosMode} />

      {/* Top Announcement Bar */}
      <AnnouncementMarquee />

      {/* Navigation Header */}
      <MainNavigation
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isChaosMode={isChaosMode}
        onToggleChaosMode={() => setIsChaosMode((prev) => !prev)}
      />

      {/* Main Observatory Content */}
      <main>
        {/* 1. Hero Section with pointer-responsive character reaction */}
        <HeroSection />

        {/* 2. About Pip (Nursery Staff Dossier) */}
        <AboutSection />

        {/* 3. Project Showcase I: Lullaby Lab with Web Audio API Synthesizer */}
        <LullabyLabSection
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />

        {/* 4. Project Showcase II: Nightlight Sanctuary with live glow and day/night preview */}
        <NightlightSection />

        {/* 5. Project Showcase III: Dream Delivery Route Map with animated SVG star flight */}
        <DreamDeliverySection />

        {/* 6. Origin Story with Viewport IntersectionObserver Reveal */}
        <OriginStorySection />

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
