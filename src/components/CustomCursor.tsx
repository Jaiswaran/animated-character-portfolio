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
  const [isOverInput, setIsOverInput] = useState(false);
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

    document.documentElement.classList.add('has-custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Check if hovering over text inputs or textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        setIsOverInput(true);
      } else {
        setIsOverInput(false);
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);

      // Add 4-5 tiny short-lived sparkles on click
      const colors = ['#f3cf75', '#d9c8ef', '#f1c9d6', '#ffffff'];
      const newSparkles: ClickSparkle[] = Array.from({ length: 4 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
        const speed = Math.random() * 2 + 1.2;
        return {
          id: Date.now() + i,
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 2,
          opacity: 1,
          color: colors[i % colors.length],
        };
      });

      setSparkles((prev) => [...prev, ...newSparkles]);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // RAF loop for smooth 60fps cursor follow
    const updateCursor = () => {
      if (cursorRef.current && posRef.current.x >= 0) {
        // Stay within viewport
        const clampedX = Math.max(0, Math.min(window.innerWidth - 8, posRef.current.x));
        const clampedY = Math.max(0, Math.min(window.innerHeight - 8, posRef.current.y));
        cursorRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
      }

      // Decay sparkles
      setSparkles((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            opacity: s.opacity - 0.045,
          }))
          .filter((s) => s.opacity > 0)
      );

      animFrameRef.current = requestAnimationFrame(updateCursor);
    };

    animFrameRef.current = requestAnimationFrame(updateCursor);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
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
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Click Sparkles */}
      {sparkles.map((sp) => (
        <div
          key={sp.id}
          className="pointer-events-none fixed rounded-full transition-opacity"
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

      {/* Main Cursor Element: Warm-gold star with soft lavender halo (hidden over text inputs) */}
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed top-0 left-0 -ml-3 -mt-3 w-6 h-6 flex items-center justify-center will-change-transform transition-opacity duration-150 ${
          isOverInput ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Soft Lavender Halo */}
        <div
          className={`absolute inset-0 rounded-full bg-[#d9c8ef]/45 blur-xs transition-transform duration-200 ${
            isClicking ? 'scale-75' : 'scale-100'
          }`}
        />

        {/* Tiny Rotating Star (Warm Gold Center) */}
        <svg
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 text-[#f3cf75] fill-current animate-spin-slow transition-transform duration-150 ${
            isClicking ? 'scale-85' : 'scale-100'
          }`}
          style={{ filter: 'drop-shadow(0 0 3px rgba(243, 207, 117, 0.8))' }}
        >
          <path d="M12 2l2.4 6.6L21 9.5l-5 4.5 1.5 6.8-5.5-3.5-5.5 3.5 1.5-6.8-5-4.5 6.6-.9z" />
        </svg>
      </div>
    </div>
  );
};
