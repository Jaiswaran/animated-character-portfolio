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

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLullabyPlaying, setIsLullabyPlaying] = useState(true);
  const [isChaosMode, setIsChaosMode] = useState(false);
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-cream text-warm-brown antialiased dark:bg-plum-dark dark:text-cream selection:bg-soft-blush selection:text-plum transition-colors duration-300">
      {/* Chaos Mode Particle Canvas */}
      <ChaosSparkles isActive={isChaosMode} />

      {/* Top Announcement Bar */}
      <AnnouncementMarquee />

      {/* Navigation Header */}
      <MainNavigation
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isLullabyPlaying={isLullabyPlaying}
        onToggleLullaby={() => setIsLullabyPlaying(!isLullabyPlaying)}
        isChaosMode={isChaosMode}
        onToggleChaosMode={() => setIsChaosMode(!isChaosMode)}
      />

      {/* Main Observatory Content */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. About Pip (Nursery Staff Dossier) */}
        <AboutSection />

        {/* 3. Project Showcase: Lullaby Lab */}
        <LullabyLabSection
          isPlaying={isLullabyPlaying}
          onTogglePlay={() => setIsLullabyPlaying(!isLullabyPlaying)}
        />

        {/* 4. Project Showcase: Nightlight Sanctuary */}
        <NightlightSection />

        {/* 5. Project Showcase: Dream Delivery Routes */}
        <DreamDeliverySection />

        {/* 6. Origin Story: How Pip Found His Wings */}
        <OriginStorySection />

        {/* 7. Starlight Ledger Guestbook & Mechanical Odometer */}
        <GuestbookSection onOpenEasterEgg={() => setIsEasterEggOpen(true)} />
      </main>

      {/* 8. Footer & Asset Credits */}
      <FooterSection onOpenEasterEgg={() => setIsEasterEggOpen(true)} />

      {/* 9. Secret Easter Egg Modal */}
      <EasterEggModal
        isOpen={isEasterEggOpen}
        onClose={() => setIsEasterEggOpen(false)}
      />
    </div>
  );
}
