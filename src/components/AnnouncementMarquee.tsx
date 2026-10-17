/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AnnouncementMarquee: React.FC = () => {
  return (
    <aside
      className="bg-rich-berry text-white text-xs md:text-sm font-bubbly py-1.5 px-4 overflow-hidden border-b border-plum/20"
      aria-label="Hackathon Announcement"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <svg className="w-3.5 h-3.5 text-star-gold animate-pulse flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="tracking-wide font-medium text-[11px] sm:text-xs">
            HAX.BABY 48H HACKATHON WINNER • TRACK 1: PIP THE SKULL BABY
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-star-gold font-semibold text-xs">
          <span className="flex items-center gap-1">
            <span>🌙</span> DREAM STATUS: 82% SLEEPY
          </span>
          <span aria-hidden="true">•</span>
          <span className="flex items-center gap-1">
            <span>🔑</span> WIND-UP KEY: 100% READY
          </span>
          <span aria-hidden="true">•</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] text-white font-normal">
            BEST VIEWED AT 800x600 IN BED
          </span>
        </div>
      </div>
    </aside>
  );
};
