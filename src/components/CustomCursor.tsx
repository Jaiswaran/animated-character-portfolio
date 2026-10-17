/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';

interface ClickSparkle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface CustomCursorProps {
  enabled: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ enabled }) => {
  const [visible, setVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isProjectCard, setIsProjectCard] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [sparkles, setSparkles] = useState<ClickSparkle[]>([]);

  const posRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if device supports fine pointer and motion is allowed
    const hasFinePointer =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setIsFinePointer(hasFinePointer);

    if (!hasFinePointer || !enabled) {
      document.documentElement.classList.remove('has-custom-cursor');
      return;
    }

    // Authoritative global cursor suppression class
    document.documentElement.classList.add('has-custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Check if hovering over interactive elements or project cards
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveMatch = target.closest(
          'button, a, input, textarea, select, [role="button"], [role="link"], [role="tab"], label, summary, [onclick], .cursor-pointer'
        );
        setIsInteractive(Boolean(interactiveMatch));

        const projectCardMatch = target.closest(
          '[data-project-card], .project-card, [data-project-showcase]'
        );
        setIsProjectCard(Boolean(projectCardMatch));
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);

      // Add 4-5 tiny short-lived sparkles on click with gentle pastel & gold hues
      const colors = ['#f3cf75', '#d9c8ef', '#f1c9d6', '#ffffff', '#ffd166'];
      const newSparkles: ClickSparkle[] = Array.from({ length: 5 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 5 + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * 2.2 + 1.2;
        return {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 2,
          opacity: 1,
          color: colors[i % colors.length],
        };
      });

      setSparkles((prev) => [...prev.slice(-15), ...newSparkles]);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // High performance RAF loop for smooth 60fps cursor follow without React re-renders
    const updateCursor = () => {
      if (cursorRef.current && posRef.current.x >= 0) {
        // Clamp to viewport bounds
        const clampedX = Math.max(0, Math.min(window.innerWidth, posRef.current.x));
        const clampedY = Math.max(0, Math.min(window.innerHeight, posRef.current.y));
        cursorRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
      }

      // Decay sparkles smoothly
      setSparkles((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            opacity: s.opacity - 0.05,
          }))
          .filter((s) => s.opacity > 0);
      });

      animFrameRef.current = requestAnimationFrame(updateCursor);
    };

    animFrameRef.current = requestAnimationFrame(updateCursor);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [enabled, visible]);

  if (!enabled || !isFinePointer || !visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Click Sparkles Burst */}
      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className="pointer-events-none fixed rounded-full transition-opacity will-change-transform"
          style={{
            left: `${sp.x}px`,
            top: `${sp.y}px`,
            width: `${sp.size}px`,
            height: `${sp.size}px`,
            backgroundColor: sp.color,
            opacity: sp.opacity,
            boxShadow: `0 0 6px ${sp.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Main Cursor Anchor - Centered on Mouse via -translate-x-1/2 -translate-y-1/2 */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center will-change-transform"
      >
        {/* Soft Lavender Halo - gently expands on hover, brightens on project card */}
        <div
          className={`absolute rounded-full transition-all duration-200 ease-out ${
            isClicking
              ? 'w-10 h-10 bg-soft-blush/60 scale-125'
              : isProjectCard
              ? 'w-8 h-8 bg-dream-lavender/50 ring-2 ring-star-gold/60 scale-125 shadow-lg'
              : isInteractive
              ? 'w-7 h-7 bg-dream-lavender/40 ring-1 ring-dream-lavender/70 scale-115'
              : 'w-5 h-5 bg-dream-lavender/25 scale-100'
          }`}
        />

        {/* Orbiting Sparkle on Project Card Hover */}
        {isProjectCard && !isClicking && (
          <div className="absolute inset-0 animate-spin-slow pointer-events-none">
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-1.5 h-1.5 rounded-full bg-star-gold shadow-[0_0_6px_#f3cf75]"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Five-Pointed Magical Star SVG (Warm Gold Center) */}
        <svg
          viewBox="0 0 24 24"
          className={`fill-current text-star-gold will-change-transform transition-all duration-150 ease-out ${
            isClicking
              ? 'w-6 h-6 scale-135 rotate-12'
              : isProjectCard
              ? 'w-5 h-5 scale-120 animate-spin-slow'
              : isInteractive
              ? 'w-4.5 h-4.5 scale-115'
              : 'w-4 h-4 scale-100'
          }`}
          style={{
            filter: isClicking
              ? 'drop-shadow(0 0 10px rgba(243, 207, 117, 1)) drop-shadow(0 0 4px #a34063)'
              : isProjectCard
              ? 'drop-shadow(0 0 8px rgba(243, 207, 117, 0.95))'
              : isInteractive
              ? 'drop-shadow(0 0 6px rgba(243, 207, 117, 0.85))'
              : 'drop-shadow(0 0 3px rgba(243, 207, 117, 0.7))',
          }}
        >
          {/* Classical 5-pointed star path */}
          <path d="M12 2l2.6 6.9L22 9.6l-5.3 4.8 1.6 7.2L12 17.8l-6.3 3.8 1.6-7.2L2 9.6l7.4-.7L12 2z" />
        </svg>
      </div>
    </div>
  );
};
