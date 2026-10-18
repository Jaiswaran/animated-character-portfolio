/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A quiet, replayable secret-star reveal. The interaction is visual and textual:
 * it never requires audio, canvas confetti, or another animation dependency.
 */
import React, { useEffect, useRef } from 'react';
import { X, Heart, Sparkles } from 'lucide-react';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const close = () => onCloseRef.current();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => onCloseRef.current();

  return (
    <div
      className="pip-secret-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={modalRef}
        className="pip-secret-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pip-secret-title"
        aria-describedby="pip-secret-copy"
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          className="pip-secret-close"
          aria-label="Close Pip's secret star message"
        >
          <X aria-hidden="true" size={18} />
        </button>

        <div className="pip-secret-sky" aria-hidden="true">
          <span className="pip-secret-orbit orbit-one" />
          <span className="pip-secret-orbit orbit-two" />
          <span className="pip-secret-waking-star">✦</span>
          <span className="pip-secret-sleeper">☾</span>
          <Sparkles className="pip-secret-sparkle sparkle-one" size={20} />
          <Sparkles className="pip-secret-sparkle sparkle-two" size={16} />
        </div>

        <p className="pip-secret-eyebrow">A LITTLE SECRET, JUST FOR YOU</p>
        <h2 id="pip-secret-title">You found Pip's Secret Star</h2>
        <p id="pip-secret-copy" className="pip-secret-copy">
          The last star stayed awake to keep watch over every dream. Your visit makes it glow a little brighter.
        </p>
        <div className="pip-secret-whisper" role="note">
          <span className="pip-secret-waking-pip" aria-hidden="true">☁️</span>
          <p>
            Pip stirs, opens one sleepy eye, and whispers:
            <em>“May your heart feel warm, your dreams feel safe, and tomorrow bring you something wonderful.”</em>
          </p>
        </div>
        <button type="button" className="pip-secret-done" onClick={close}>
          <Heart size={15} aria-hidden="true" />
          Let Pip sleep again
        </button>
        <p className="pip-secret-replay">The star will be waiting if you want to visit again.</p>
      </section>
    </div>
  );
};
