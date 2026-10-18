/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { DreamEntry, formatOdometerDigits, validateDreamInput } from '../utils/counter';
import { useSoundEffects } from '../hooks/useSoundEffects';

const INITIAL_ENTRIES: DreamEntry[] = [];

export const GuestbookSection: React.FC = () => {
  const { play } = useSoundEffects();
  const GUESTBOOK_STORAGE_KEY = 'pip_guestbook_ledger';
  const VISIT_STORAGE_KEY = 'pip_observatory_local_visits';

  const [entries, setEntries] = useState<DreamEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_ENTRIES;
  });
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedStamp, setSelectedStamp] = useState('⭐');
  const [formError, setFormError] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = Number.parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || '0', 10);
        return Number.isFinite(saved) ? Math.max(0, saved) : 0;
      } catch {}
    }
    return 0;
  });
  const visitCountedRef = useRef(false);

  useEffect(() => {
    // Count each Observatory page visit once per mounted app, not guestbook submissions.
    if (visitCountedRef.current || typeof window === 'undefined') return;
    visitCountedRef.current = true;
    try {
      const next = Math.min(999999, visitCount + 1);
      localStorage.setItem(VISIT_STORAGE_KEY, String(next));
      setVisitCount(next);
    } catch {
      setVisitCount((current) => Math.min(999999, current + 1));
    }
  }, []);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  const stamps = ['⭐', '☁️', '🦄', '🎀'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateDreamInput(name, message);
    if (!validation.isValid) {
      setFormError(validation.error || 'Please fill in both fields.');
      return;
    }
    setFormError(null);

    play('guestbook-submit');

    const newId = `entry-${Date.now()}`;
    const newEntry: DreamEntry = {
      id: newId,
      name: name.trim(),
      message: message.trim(),
      stamp: selectedStamp,
      timestamp: 'Just now',
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setJustSubmittedId(newId);

    try {
      localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(updatedEntries.slice(0, 50)));
    } catch {}

    setName('');
    setMessage('');
  };

  const handleSelectStamp = (stamp: string) => {
    play('button-click');
    setSelectedStamp(stamp);
  };

  const odometerDigits = formatOdometerDigits(visitCount, 6);

  return (
    <section
      id="guestbook"
      className="py-16 md:py-20 relative"
      aria-label="Pip's Bedtime Guestbook Ledger"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-star-gold/30 dark:bg-plum px-3.5 py-1 rounded-full border border-star-gold/40">
            Starlight Ledger
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-3">
            Leave Pip a Little Dream
          </h2>
          <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
            Sign Pip’s cozy bedtime ledger before you drift off to sleep.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Guestbook Input Form */}
          <div className="lg:col-span-5 bg-white dark:bg-plum rounded-3xl p-6 sm:p-8 border-2 border-rich-berry/20 shadow-xl">
            <h3 className="font-serif-headline text-xl font-bold text-plum dark:text-star-gold mb-2">
              Drop Pip a Bedtime Thought
            </h3>
            <p className="font-bubbly text-xs text-warm-brown/70 dark:text-cream/70 mb-5">
              Leave a whisper for Pip's dream journal.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 font-bubbly text-xs">
              <div>
                <label
                  htmlFor="sleeper-name"
                  className="block font-bold text-warm-brown dark:text-cream mb-1"
                >
                  Your Name / Dreamer Handle
                </label>
                <input
                  id="sleeper-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Luna_Coder99"
                  className="w-full rounded-xl border-2 border-rich-berry/20 bg-cream/50 dark:bg-plum-dark text-warm-brown dark:text-cream focus:border-rich-berry focus:outline-none px-3.5 py-2.5 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="dream-message"
                  className="block font-bold text-warm-brown dark:text-cream mb-1"
                >
                  Drop a Bedtime Thought
                </label>
                <textarea
                  id="dream-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="May your build pass and your pillows stay cold on both sides..."
                  className="w-full rounded-xl border-2 border-rich-berry/20 bg-cream/50 dark:bg-plum-dark text-warm-brown dark:text-cream focus:border-rich-berry focus:outline-none px-3.5 py-2.5 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-warm-brown dark:text-cream mb-1.5">
                  Choose a Dream Stamp
                </label>
                <div className="flex gap-2">
                  {stamps.map((stamp) => (
                    <button
                      key={stamp}
                      type="button"
                      onClick={() => handleSelectStamp(stamp)}
                      className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition-all cursor-pointer ${
                        selectedStamp === stamp
                          ? 'border-rich-berry bg-soft-blush/60 shadow-sm scale-105'
                          : 'border-rich-berry/20 bg-cream dark:bg-plum-dark hover:bg-soft-blush/30'
                      }`}
                      aria-label={`Select stamp ${stamp}`}
                    >
                      {stamp}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-red-500 font-semibold text-xs animate-shake">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-rich-berry hover:bg-rich-berry/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Pin into Pip's Dream Journal</span>
                <span aria-hidden="true">✨</span>
              </button>
            </form>
          </div>

          {/* Dynamic Messages Stream */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between font-bubbly text-xs text-warm-brown/70 dark:text-cream/70">
              <span className="font-bold tracking-wider uppercase">
                Recent Observatory Entries
              </span>
              <span className="text-rich-berry dark:text-star-gold font-medium">
                Saved on this browser · not shared across visitors 🛰️
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/60 dark:bg-plum/60 border border-dashed border-rich-berry/20 text-center">
                  <span className="text-3xl block mb-2">📜</span>
                  <p className="font-bubbly text-sm text-warm-brown/70 dark:text-cream/70">
                    The ledger is waiting for its first starlight whisper tonight.
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-plum border transition-all shadow-sm flex items-start gap-3.5 ${
                      justSubmittedId === entry.id
                        ? 'border-star-gold ring-2 ring-star-gold/40 animate-pulse'
                        : 'border-rich-berry/15'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0 select-none" aria-hidden="true">
                      {entry.stamp}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="font-bubbly text-xs text-rich-berry dark:text-star-gold truncate">
                          {entry.name}
                        </strong>
                        <span className="text-[10px] text-warm-brown/40 dark:text-cream/40 whitespace-nowrap">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="font-body text-xs text-warm-brown/90 dark:text-cream/80 mt-1 leading-relaxed break-words">
                        {entry.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Mechanical Visitor Counter */}
        <div className="mt-16 pt-8 border-t border-rich-berry/15 flex justify-center">
          {/* Early Web Mechanical LED Visitor Counter */}
          <div className="flex items-center gap-3">
            <span className="font-bubbly text-xs font-bold text-warm-brown dark:text-cream tracking-wide">
              LOCAL VISITS:
            </span>
            <div
              className="flex items-center gap-1 bg-black p-1.5 rounded-lg border-2 border-warm-brown/40 font-mono text-sm tracking-wider font-bold text-emerald-400 shadow-inner"
              aria-label={`Local visit count for this browser: ${visitCount}`}
            >
              {odometerDigits.map((digit, i) => (
                <span
                  key={i}
                  className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800"
                >
                  {digit}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
