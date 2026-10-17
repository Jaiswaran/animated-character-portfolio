/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DELIVERY_WAYPOINTS, getNextWaypointIndex } from '../utils/delivery';

export const DreamDeliverySection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    'Hover or click "Dispatch Next Dream" to deploy star packets!'
  );
  const [isDispatched, setIsDispatched] = useState(false);

  const activeWaypoint = DELIVERY_WAYPOINTS[currentStep];

  const handleDispatch = () => {
    const nextStep = getNextWaypointIndex(currentStep, DELIVERY_WAYPOINTS.length);
    setCurrentStep(nextStep);
    setIsDispatched(true);

    const target = DELIVERY_WAYPOINTS[nextStep];
    setStatusMessage(`🚀 Step ${nextStep + 1}: Dispatched to ${target.name} (${target.tagline})`);

    setTimeout(() => {
      setIsDispatched(false);
    }, 1800);
  };

  return (
    <section
      id="map"
      className="py-16 md:py-20 relative"
      aria-label="Dream Delivery Route Map"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-soft-blush dark:bg-plum px-3.5 py-1 rounded-full border border-rich-berry/20">
            Real-Time Constellation Dispatch
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-3">
            Dream Delivery Route Map
          </h2>
          <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
            Watch Pip journey across midnight rooftops and cloud spires to drop off sweet dreams.
          </p>
        </div>

        {/* SVG Map Container */}
        <div className="bg-plum dark:bg-plum-dark rounded-3xl p-5 sm:p-10 border-4 border-rich-berry/30 shadow-2xl relative text-cream overflow-hidden">
          {/* Background Star Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#f3cf75 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />

          {/* Top Dispatch Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6 font-bubbly text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                SLUMBER PIPELINE: <strong className="text-emerald-300">ALL ROUTES CLEAR</strong>
              </span>
            </div>

            <button
              onClick={handleDispatch}
              className="px-5 py-2.5 rounded-xl bg-star-gold hover:bg-amber-300 text-warm-brown font-bold flex items-center gap-2 shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Dispatch dream to next constellation waypoint"
            >
              <span>{isDispatched ? '✨ Star Packet In Flight!' : '🚀 Dispatch Next Dream'}</span>
            </button>
          </div>

          {/* Illustrated SVG Map Canvas */}
          <div className="relative w-full aspect-[16/9] max-h-[460px] bg-plum-dark/90 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="0 0 800 450"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Celestial dream delivery flight map"
            >
              {/* Moon in Sky */}
              <circle cx="700" cy="80" r="35" fill="#f3cf75" opacity="0.9" />
              <circle cx="685" cy="70" r="32" fill="#171123" />

              {/* Distant Twinkling Stars */}
              <circle cx="100" cy="80" r="2" fill="#fff" opacity="0.6" />
              <circle cx="250" cy="60" r="2" fill="#f3cf75" opacity="0.8" />
              <circle cx="390" cy="110" r="2.5" fill="#f1c9d6" opacity="0.7" />
              <circle cx="580" cy="90" r="2" fill="#fff" opacity="0.5" />

              {/* Curved Flight Path SVG */}
              <path
                d="M 120 320 C 240 140, 360 380, 480 200 C 580 80, 680 180, 700 320"
                stroke="#f3cf75"
                strokeWidth="3"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />

              {/* Rooftop & Nursery Silhouettes */}
              <path d="M 40 450 L 40 370 L 100 320 L 160 370 L 160 450 Z" fill="#241b35" />
              <path d="M 220 450 L 220 360 L 290 300 L 360 360 L 360 450 Z" fill="#1f172e" />
              <path d="M 440 450 L 440 340 L 510 390 L 580 340 L 580 450 Z" fill="#241b35" />
              <path d="M 640 450 L 640 350 L 710 310 L 780 350 L 780 450 Z" fill="#1f172e" />

              {/* Destination 1: The Whispering Attic */}
              <g
                className="cursor-pointer"
                transform="translate(120, 320)"
                onClick={() => {
                  setCurrentStep(0);
                  setStatusMessage('Selected: Whispering Attic (8:30 PM) - Bunny Dreams 🐰');
                }}
              >
                <circle cx="0" cy="0" r="14" fill="#a34063" className="animate-ping opacity-40" />
                <circle cx="0" cy="0" r="10" fill="#a34063" stroke="#fff8f1" strokeWidth="2" />
                <text
                  x="0"
                  y="-18"
                  textAnchor="middle"
                  fill="#fff8f1"
                  fontFamily="Fredoka"
                  fontSize="12"
                  fontWeight="bold"
                >
                  Whispering Attic
                </text>
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill="#f1c9d6"
                  fontFamily="Quicksand"
                  fontSize="10"
                >
                  Bunny Dreams 🐰
                </text>
              </g>

              {/* Destination 2: Lighthouse Nursery */}
              <g
                className="cursor-pointer"
                transform="translate(480, 200)"
                onClick={() => {
                  setCurrentStep(1);
                  setStatusMessage('Selected: Lighthouse Nursery (9:15 PM) - Sailor Lullabies ⛵');
                }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill="#7aa2f7"
                  className="animate-ping opacity-40"
                  style={{ animationDelay: '0.5s' }}
                />
                <circle cx="0" cy="0" r="10" fill="#7aa2f7" stroke="#fff8f1" strokeWidth="2" />
                <text
                  x="0"
                  y="-18"
                  textAnchor="middle"
                  fill="#fff8f1"
                  fontFamily="Fredoka"
                  fontSize="12"
                  fontWeight="bold"
                >
                  Lighthouse Nursery
                </text>
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill="#d9c8ef"
                  fontFamily="Quicksand"
                  fontSize="10"
                >
                  Sailor Lullabies ⛵
                </text>
              </g>

              {/* Destination 3: Cloud Nine Slumber Spire */}
              <g
                className="cursor-pointer"
                transform="translate(700, 320)"
                onClick={() => {
                  setCurrentStep(2);
                  setStatusMessage("Selected: Cloud Nine Spire (10:00 PM) - Pip's Hammock 💤");
                }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill="#f3cf75"
                  className="animate-ping opacity-40"
                  style={{ animationDelay: '1s' }}
                />
                <circle cx="0" cy="0" r="10" fill="#f3cf75" stroke="#241b35" strokeWidth="2" />
                <text
                  x="0"
                  y="-18"
                  textAnchor="middle"
                  fill="#fff8f1"
                  fontFamily="Fredoka"
                  fontSize="12"
                  fontWeight="bold"
                >
                  Cloud Nine Spire
                </text>
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill="#f3cf75"
                  fontFamily="Quicksand"
                  fontSize="10"
                >
                  Pip's Hammock 💤
                </text>
              </g>

              {/* Animated Traveling Pip Star Courier */}
              <g
                className="transition-transform duration-1000 ease-out"
                transform={`translate(${activeWaypoint.x}, ${activeWaypoint.y})`}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill="#f3cf75"
                  filter="drop-shadow(0px 0px 10px #f3cf75)"
                />
                <text x="0" y="6" textAnchor="middle" fontSize="16">
                  👶
                </text>
              </g>
            </svg>
          </div>

          {/* Interactive Waypoints List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {DELIVERY_WAYPOINTS.map((wp, idx) => {
              const isActive = currentStep === idx;
              return (
                <button
                  key={wp.id}
                  onClick={() => {
                    setCurrentStep(idx);
                    setStatusMessage(`Viewing waypoint ${idx + 1}: ${wp.name}`);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/15 border-star-gold shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bubbly text-xs font-bold text-star-gold">
                      {idx + 1}. {wp.name}
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                      {wp.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-cream/70 font-bubbly">{wp.tagline}</p>
                </button>
              );
            })}
          </div>

          {/* Bottom Status Telemetry */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-bubbly text-cream/70 gap-2">
            <div>
              Current Carrier:{' '}
              <span className="text-star-gold font-semibold">
                Pip (Flight Clearance: Sector 04 • {activeWaypoint.name})
              </span>
            </div>
            <div className="text-soft-blush italic">{statusMessage}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
