/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  Compass,
  Sparkles,
  MapPin,
  Moon,
  Sun,
  RotateCcw,
  Wind,
  Heart,
  Volume2,
} from 'lucide-react';
import { DELIVERY_WAYPOINTS, DeliveryWaypoint } from '../utils/delivery';
import { DeliveryStatus, calculateProgress, getDeliveryMessage } from '../utils/routePath';
import { useSoundEffects } from '../hooks/useSoundEffects';

export interface RooftopStation {
  id: string;
  name: string;
  childName: string;
  childAge: number;
  dreamTitle: string;
  emoji: string;
  x: number; // SVG coordinates 0-800
  y: number; // SVG coordinates 0-450
  chimneyX: number;
  chimneyY: number;
  color: string;
  delivered: boolean;
  notes: string;
}

export const ROOFTOP_STATIONS: RooftopStation[] = [
  {
    id: 'attic',
    name: 'Whispering Gable',
    childName: 'Maya',
    childAge: 5,
    dreamTitle: 'Bunny Meadows & Sweet Clover 🐰',
    emoji: '🐰',
    x: 130,
    y: 310,
    chimneyX: 130,
    chimneyY: 280,
    color: '#a34063',
    delivered: true,
    notes: 'Requested extra snuggly ears and starry dandelion puffs.',
  },
  {
    id: 'clocktower',
    name: 'Copper Clocktower',
    childName: 'Oliver',
    childAge: 7,
    dreamTitle: 'Pocketwatch of Shooting Stars 🕰️',
    emoji: '🕰️',
    x: 320,
    y: 195,
    chimneyX: 320,
    chimneyY: 165,
    color: '#f3cf75',
    delivered: false,
    notes: 'Loves ticking gears that wind up sweet bedtime melodies.',
  },
  {
    id: 'lighthouse',
    name: 'Beacon Point',
    childName: 'Noah',
    childAge: 4,
    dreamTitle: 'Sailboat Across the Milky Way ⛵',
    emoji: '⛵',
    x: 490,
    y: 175,
    chimneyX: 490,
    chimneyY: 145,
    color: '#7aa2f7',
    delivered: false,
    notes: 'Navigating friendly moonlit waves guided by the North Star.',
  },
  {
    id: 'spire',
    name: 'Cloud Nine Spire',
    childName: 'Luna',
    childAge: 6,
    dreamTitle: 'Castle in Cotton Clouds ☁️',
    emoji: '☁️',
    x: 650,
    y: 220,
    chimneyX: 650,
    chimneyY: 190,
    color: '#d9c8ef',
    delivered: false,
    notes: 'Where stars sleep before floating down to the nursery.',
  },
  {
    id: 'houseboat',
    name: 'Harbor Tugboat',
    childName: 'Leo',
    childAge: 3,
    dreamTitle: 'Song of the Luminous Whales 🐋',
    emoji: '🐋',
    x: 735,
    y: 340,
    chimneyX: 735,
    chimneyY: 310,
    color: '#a8d5ba',
    delivered: false,
    notes: 'Gentle ripples and cozy lantern hum on midnight water.',
  },
];

interface DreamDeliverySectionProps {
  dispatchTrigger?: number;
  onStatusChange?: (status: DeliveryStatus) => void;
  compact?: boolean;
}

export const DreamDeliverySection: React.FC<DreamDeliverySectionProps> = ({
  dispatchTrigger,
  onStatusChange,
  compact = false,
}) => {
  const { play } = useSoundEffects();
  const animationFrameRef = useRef<number | null>(null);

  // Stations state with delivery marks
  const [stations, setStations] = useState<RooftopStation[]>(ROOFTOP_STATIONS);
  const [activeStationIndex, setActiveStationIndex] = useState(1);
  const [status, setStatus] = useState<DeliveryStatus>('idle');
  const [progressFraction, setProgressFraction] = useState(0);

  // Pip position in SVG coordinates (0-800 x 0-450)
  const [pipPos, setPipPos] = useState<{ x: number; y: number; angle: number }>({
    x: ROOFTOP_STATIONS[0].x,
    y: ROOFTOP_STATIONS[0].y - 50,
    angle: 0,
  });

  // Falling parcel animation state
  const [droppingParcel, setDroppingParcel] = useState<{
    x: number;
    startY: number;
    targetY: number;
    progress: number;
  } | null>(null);

  // Chimney puffs state: array of coordinates where smoke is rising
  const [smokePuffs, setSmokePuffs] = useState<{ id: number; x: number; y: number }[]>([]);

  // Dream bubble preview popup over active station
  const [activeBubble, setActiveBubble] = useState<RooftopStation | null>(null);

  // Tour mode state: whether Pip is doing the multi-stop automated tour
  const [isTouring, setIsTouring] = useState(false);

  const lastStatus = useRef<DeliveryStatus | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  });

  useEffect(() => {
    if (lastStatus.current !== status) {
      lastStatus.current = status;
      onStatusChangeRef.current?.(status);
    }
  }, [status]);

  useEffect(() => {
    if (dispatchTrigger && dispatchTrigger > 0) {
      const nextIdx = (activeStationIndex + 1) % stations.length;
      flyToStation(nextIdx);
    }
  }, [dispatchTrigger]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Dispatch flight to a specific station
  const flyToStation = (targetIndex: number, isTour = false) => {
    if (status === 'dispatching') return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    play('dream-dispatch');
    setActiveStationIndex(targetIndex);
    setStatus('dispatching');
    setActiveBubble(null);

    const targetStation = stations[targetIndex];
    const startX = pipPos.x;
    const startY = pipPos.y;
    const destX = targetStation.x;
    const destY = targetStation.y - 45;

    // Control point for curved flight arc through sky
    // Arch up above both points
    const midX = (startX + destX) / 2;
    const arcHeight = Math.min(startX, destX) === startX ? 80 : 70;
    const controlY = Math.min(startY, destY) - arcHeight;

    const durationMs = 2000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = calculateProgress(elapsed, durationMs);

      // Smooth easeInOutCubic
      const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgressFraction(easedT);

      // Quadratic Bezier Formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
      const curX =
        (1 - easedT) * (1 - easedT) * startX +
        2 * (1 - easedT) * easedT * midX +
        easedT * easedT * destX;
      const curY =
        (1 - easedT) * (1 - easedT) * startY +
        2 * (1 - easedT) * easedT * controlY +
        easedT * easedT * destY;

      // Tangent for banking angle: B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
      const dx = 2 * (1 - easedT) * (midX - startX) + 2 * easedT * (destX - midX);
      const dy = 2 * (1 - easedT) * (controlY - startY) + 2 * easedT * (destY - controlY);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      setPipPos({ x: curX, y: curY, angle: Math.max(-35, Math.min(35, angle * 0.5)) });

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        setPipPos({ x: destX, y: destY, angle: 0 });

        // Trigger parcel drop into chimney
        triggerParcelDrop(targetStation, isTour, targetIndex);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Animate parcel dropping into chimney, then mark delivered
  const triggerParcelDrop = (station: RooftopStation, isTour: boolean, targetIndex: number) => {
    play('parcel-drop');
    setDroppingParcel({
      x: station.chimneyX,
      startY: station.y - 40,
      targetY: station.chimneyY,
      progress: 0,
    });

    const dropStartTime = performance.now();
    const dropDuration = 600;

    const animateDrop = (now: number) => {
      const elapsed = now - dropStartTime;
      const t = Math.min(1, elapsed / dropDuration);

      if (t < 1) {
        setDroppingParcel((prev) => (prev ? { ...prev, progress: t } : null));
        requestAnimationFrame(animateDrop);
      } else {
        setDroppingParcel(null);
        // Play chiming celebration
        play('nightlight-change');

        // Add chimney smoke puff
        const puffId = Date.now();
        setSmokePuffs((prev) => [...prev, { id: puffId, x: station.chimneyX, y: station.chimneyY }]);
        setTimeout(() => {
          setSmokePuffs((prev) => prev.filter((p) => p.id !== puffId));
        }, 1500);

        // Mark station as delivered
        setStations((prev) =>
          prev.map((s, idx) => (idx === targetIndex ? { ...s, delivered: true } : s))
        );

        setStatus('delivered');
        setActiveBubble(station);

        // If in tour mode, continue to next station after a cozy pause
        if (isTour) {
          const nextIdx = (targetIndex + 1) % stations.length;
          if (nextIdx !== 0) {
            setTimeout(() => {
              flyToStation(nextIdx, true);
            }, 1400);
          } else {
            setIsTouring(false);
          }
        }
      }
    };

    requestAnimationFrame(animateDrop);
  };

  // Launch Grand Midnight Tour
  const startGrandTour = () => {
    if (status === 'dispatching') return;
    setIsTouring(true);
    // Reset deliveries for excitement
    setStations((prev) => prev.map((s) => ({ ...s, delivered: false })));
    flyToStation(0, true);
  };

  // Click on chimney to puff smoke
  const triggerChimneySmoke = (x: number, y: number) => {
    play('button-click');
    const puffId = Date.now();
    setSmokePuffs((prev) => [...prev, { id: puffId, x, y }]);
    setTimeout(() => {
      setSmokePuffs((prev) => prev.filter((p) => p.id !== puffId));
    }, 1500);
  };

  const activeStation = stations[activeStationIndex];
  const deliveredCount = stations.filter((s) => s.delivered).length;

  return (
    <section
      id={compact ? undefined : 'map'}
      className={compact ? 'ultimate-route-embed relative w-full' : 'py-12 md:py-16 relative w-full'}
      aria-label="Dream Delivery Route Map"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {!compact && (
          <div className="text-center max-w-3xl mx-auto mb-8">
            <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-soft-blush dark:bg-plum px-3.5 py-1 rounded-full border border-rich-berry/20">
              ✦ Celestial Courier Map · Live Dispatches
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-2">
              Dream Delivery Across the Rooftops
            </h2>
            <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
              Click any rooftop below to launch Pip directly there, or send Pip on the full midnight flight!
            </p>
          </div>
        )}

        {/* The Main Map Card Container */}
        <div
          data-project-card="true"
          className="bg-plum dark:bg-plum-dark rounded-3xl p-4 sm:p-7 border-3 border-rich-berry/30 dark:border-star-gold/25 shadow-2xl relative text-cream overflow-hidden"
        >
          {/* Top Control & Slumber Dispatch HUD */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4 font-bubbly text-xs">
            {/* Status Indicator */}
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
              <div>
                <span className="text-[11px] opacity-75 uppercase tracking-wider block">
                  Pip's Slumber Status
                </span>
                <strong className="text-emerald-300 text-sm">
                  {status === 'dispatching'
                    ? `Flying to ${activeStation.name}...`
                    : status === 'delivered'
                    ? `Dream Delivered to ${activeStation.childName}!`
                    : 'Awaiting Destination'}
                </strong>
              </div>
            </div>

            {/* Delivered Counter Metric */}
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
              <Heart className="w-3.5 h-3.5 text-rose-300 fill-current" />
              <span>
                <strong>{deliveredCount}</strong> / {stations.length} Dreams Tucked In Tonight
              </span>
            </div>

            {/* Actions: Dispatch & Grand Tour */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={startGrandTour}
                disabled={status === 'dispatching'}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-cream border border-white/20 font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Compass className="w-3.5 h-3.5 text-star-gold" />
                <span>Grand Midnight Tour</span>
              </button>

              <button
                type="button"
                onClick={() => flyToStation((activeStationIndex + 1) % stations.length)}
                disabled={status === 'dispatching'}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                  status === 'dispatching'
                    ? 'bg-amber-300 text-warm-brown opacity-85 cursor-wait'
                    : 'bg-star-gold hover:bg-amber-300 text-warm-brown hover:scale-105 active:scale-95'
                }`}
                aria-label="Dispatch dream to next rooftop"
              >
                <Send className="w-4 h-4" />
                <span>{status === 'dispatching' ? 'Pip is Flying...' : 'Send Next Dream ✨'}</span>
              </button>
            </div>
          </div>

          {/* Panoramic Rooftop SVG Canvas */}
          <div className="relative w-full aspect-[16/9] min-h-[300px] max-h-[490px] bg-gradient-to-b from-[#0f0a1c] via-[#1a1228] to-[#241938] rounded-2xl border border-white/15 overflow-hidden select-none">
            {/* Ambient Starfield & Crescent Moon */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#f3cf75 1.2px, transparent 1.2px)',
                backgroundSize: '28px 28px',
              }}
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 800 450"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Panoramic rooftop dream flight map"
            >
              <defs>
                {/* Glowing flight path gradient */}
                <linearGradient id="flight-arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f1c9d6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f3cf75" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d9c8ef" stopOpacity="0.8" />
                </linearGradient>

                {/* Chimney smoke gradient */}
                <radialGradient id="smoke-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f3cf75" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f3cf75" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Distant Mountain Silhouettes & Nebula */}
              <path
                d="M 0 380 Q 200 320 400 360 T 800 340 L 800 450 L 0 450 Z"
                fill="#130d20"
                opacity="0.8"
              />

              {/* Glowing Crescent Moon */}
              <g transform="translate(690, 65)">
                <circle cx="0" cy="0" r="32" fill="#f3cf75" opacity="0.95" />
                <circle cx="-10" cy="-8" r="28" fill="#150e24" />
                {/* Soft moon glow aura */}
                <circle cx="0" cy="0" r="48" fill="#f3cf75" opacity="0.08" />
              </g>

              {/* Distant Constellation Lines */}
              <g opacity="0.4" stroke="#d9c8ef" strokeWidth="1" strokeDasharray="3 4">
                <line x1="80" y1="70" x2="140" y2="90" />
                <line x1="140" y1="90" x2="210" y2="60" />
                <line x1="210" y1="60" x2="270" y2="100" />
                <circle cx="80" cy="70" r="2.5" fill="#fff" />
                <circle cx="140" cy="90" r="2" fill="#fff" />
                <circle cx="210" cy="60" r="3" fill="#f3cf75" />
                <circle cx="270" cy="100" r="2.5" fill="#fff" />
              </g>

              {/* Inter-rooftop Dotted Flight Path */}
              <path
                d="M 130 310 C 200 180, 260 160, 320 195 C 380 230, 430 140, 490 175 C 550 200, 600 180, 650 220 C 690 250, 710 300, 735 340"
                stroke="url(#flight-arc-glow)"
                strokeWidth="2.5"
                strokeDasharray="5 7"
                strokeLinecap="round"
                opacity="0.65"
              />

              {/* ROOFTOP ARCHITECTURE */}

              {/* House 1: Whispering Gable (Left Gable Cottage) */}
              <g
                className="cursor-pointer group"
                onClick={() => flyToStation(0)}
                aria-label="Fly to Whispering Gable"
              >
                {/* Roof Gable */}
                <polygon points="60,450 60,370 130,310 200,370 200,450" fill="#2d203f" />
                {/* Roof tiles trim */}
                <polygon points="50,375 130,305 210,375 130,312" fill="#3a2a52" />
                {/* Chimney */}
                <rect x="122" y="280" width="16" height="32" fill="#a34063" rx="2" />
                <rect x="118" y="276" width="24" height="6" fill="#bf4d75" rx="2" />
                {/* Cozy Attic Window */}
                <rect
                  x="115"
                  y="345"
                  width="30"
                  height="34"
                  rx="15"
                  fill={stations[0].delivered ? '#f3cf75' : '#45325f'}
                  stroke="#fff"
                  strokeWidth="2"
                  className="transition-colors duration-500"
                />
                {/* Crossbars */}
                <line x1="130" y1="345" x2="130" y2="379" stroke="#2d203f" strokeWidth="2" />
                <line x1="115" y1="362" x2="145" y2="362" stroke="#2d203f" strokeWidth="2" />
                {/* Bunny Weathervane */}
                <text x="130" y="270" textAnchor="middle" fontSize="12" fill="#f1c9d6">
                  🐰
                </text>
              </g>

              {/* House 2: Copper Clocktower */}
              <g
                className="cursor-pointer group"
                onClick={() => flyToStation(1)}
                aria-label="Fly to Copper Clocktower"
              >
                {/* Tower shaft */}
                <rect x="285" y="240" width="70" height="210" fill="#261b36" />
                {/* Copper Pyramidal Spire Roof */}
                <polygon points="275,245 320,165 365,245" fill="#325458" />
                <polygon points="270,248 320,162 370,248 320,168" fill="#467379" />
                {/* Chimney */}
                <rect x="314" y="160" width="12" height="20" fill="#467379" rx="2" />
                {/* Stained Glass Clock Face */}
                <circle
                  cx="320"
                  cy="275"
                  r="20"
                  fill={stations[1].delivered ? '#f3cf75' : '#ffeebb'}
                  opacity="0.9"
                  stroke="#5c4033"
                  strokeWidth="3"
                />
                {/* Clock hands */}
                <line x1="320" y1="275" x2="320" y2="263" stroke="#5c4033" strokeWidth="2" />
                <line x1="320" y1="275" x2="330" y2="275" stroke="#5c4033" strokeWidth="2" />
                <text x="320" y="152" textAnchor="middle" fontSize="11" fill="#f3cf75">
                  ✦
                </text>
              </g>

              {/* House 3: Beacon Point Lighthouse */}
              <g
                className="cursor-pointer group"
                onClick={() => flyToStation(2)}
                aria-label="Fly to Beacon Point"
              >
                {/* Stone tower */}
                <polygon points="465,450 472,210 508,210 515,450" fill="#2d2242" />
                {/* Alternating striped bands */}
                <polygon points="468,360 470,320 510,320 512,360" fill="#a34063" opacity="0.6" />
                <polygon points="471,280 472,240 508,240 509,280" fill="#a34063" opacity="0.6" />
                {/* Beacon Cupola */}
                <rect x="473" y="180" width="34" height="30" fill="#3a2a52" rx="4" />
                {/* Chimney / Vent */}
                <rect x="484" y="145" width="12" height="35" fill="#5a4278" rx="2" />
                {/* Sweeping Light Beam */}
                <polygon
                  points="490,195 380,100 420,70"
                  fill="#f3cf75"
                  opacity={stations[2].delivered ? '0.45' : '0.2'}
                  className="transition-opacity duration-700"
                />
                <circle
                  cx="490"
                  cy="195"
                  r="10"
                  fill="#fff8f1"
                  stroke="#f3cf75"
                  strokeWidth="3"
                />
                <text x="490" y="137" textAnchor="middle" fontSize="12" fill="#7aa2f7">
                  ⛵
                </text>
              </g>

              {/* House 4: Cloud Nine Spire */}
              <g
                className="cursor-pointer group"
                onClick={() => flyToStation(3)}
                aria-label="Fly to Cloud Nine Spire"
              >
                {/* Floating Turret */}
                <polygon points="620,450 635,270 665,270 680,450" fill="#231735" />
                {/* Celestial Spire Conical Roof */}
                <polygon points="625,275 650,190 675,275" fill="#4d3b68" />
                <polygon points="620,278 650,186 680,278 650,193" fill="#67508a" />
                {/* Chimney */}
                <rect x="644" y="190" width="12" height="24" fill="#67508a" rx="2" />
                {/* Cozy Oval Skylight */}
                <ellipse
                  cx="650"
                  cy="320"
                  rx="14"
                  ry="20"
                  fill={stations[3].delivered ? '#d9c8ef' : '#392552'}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text x="650" y="180" textAnchor="middle" fontSize="12" fill="#f3cf75">
                  ★
                </text>
              </g>

              {/* House 5: Harbor Tugboat */}
              <g
                className="cursor-pointer group"
                onClick={() => flyToStation(4)}
                aria-label="Fly to Harbor Tugboat"
              >
                {/* Boat Hull */}
                <path
                  d="M 680 410 L 700 375 L 770 375 L 790 410 Q 735 425 680 410 Z"
                  fill="#332447"
                />
                {/* Cabin */}
                <rect x="710" y="340" width="50" height="35" fill="#422f5c" rx="4" />
                {/* Brass Smokestack Chimney */}
                <rect x="730" y="310" width="10" height="30" fill="#e8c96d" rx="2" />
                <rect x="727" y="306" width="16" height="5" fill="#f3cf75" rx="2" />
                {/* Porch Lamp */}
                <circle
                  cx="722"
                  cy="355"
                  r="6"
                  fill={stations[4].delivered ? '#f3cf75' : '#45325f'}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <circle
                  cx="748"
                  cy="355"
                  r="6"
                  fill={stations[4].delivered ? '#f3cf75' : '#45325f'}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <text x="735" y="298" textAnchor="middle" fontSize="12" fill="#a8d5ba">
                  🐋
                </text>
              </g>

              {/* Interactive Chimney Smoke Puffs */}
              {smokePuffs.map((puff) => (
                <g key={puff.id} transform={`translate(${puff.x}, ${puff.y})`}>
                  <circle cx="0" cy="-10" r="8" fill="url(#smoke-glow)" className="animate-ping" />
                  <circle cx="3" cy="-22" r="12" fill="url(#smoke-glow)" className="animate-pulse" />
                  <circle cx="-4" cy="-35" r="16" fill="url(#smoke-glow)" opacity="0.4" />
                </g>
              ))}

              {/* Dropping Dream Parcel with Golden Parachute */}
              {droppingParcel && (
                <g
                  transform={`translate(${droppingParcel.x}, ${
                    droppingParcel.startY +
                    (droppingParcel.targetY - droppingParcel.startY) * droppingParcel.progress
                  })`}
                >
                  {/* Miniature Starlight Parachute */}
                  <path
                    d="M -12 -12 Q 0 -22 12 -12 Z"
                    fill="#f3cf75"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                  <line x1="-10" y1="-12" x2="0" y2="0" stroke="#f1c9d6" strokeWidth="1" />
                  <line x1="10" y1="-12" x2="0" y2="0" stroke="#f1c9d6" strokeWidth="1" />
                  {/* Parcel Box */}
                  <rect
                    x="-6"
                    y="0"
                    width="12"
                    height="12"
                    fill="#a34063"
                    stroke="#fff"
                    strokeWidth="1"
                    rx="2"
                  />
                  <line x1="-6" y1="6" x2="6" y2="6" stroke="#f3cf75" strokeWidth="1.5" />
                  <line x1="0" y1="0" x2="0" y2="12" stroke="#f3cf75" strokeWidth="1.5" />
                </g>
              )}

              {/* Station Delivery Markers with Child Names */}
              {stations.map((st, idx) => {
                const isActive = activeStationIndex === idx;
                return (
                  <g
                    key={st.id}
                    transform={`translate(${st.x}, ${st.y})`}
                    className="cursor-pointer"
                    onClick={() => flyToStation(idx)}
                  >
                    {/* Pulsing delivery radar ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r={st.delivered ? 16 : 12}
                      fill={st.color}
                      className={isActive ? 'animate-ping opacity-60' : 'opacity-25'}
                    />
                    {/* Badge circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r="10"
                      fill={st.color}
                      stroke="#fff8f1"
                      strokeWidth="2.5"
                    />
                    {/* Checkmark or Star */}
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#fff8f1"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {st.delivered ? '✓' : '✦'}
                    </text>

                    {/* Rooftop Station Label */}
                    <rect
                      x="-55"
                      y="14"
                      width="110"
                      height="24"
                      rx="8"
                      fill="#1b1228"
                      stroke={st.color}
                      strokeWidth="1.5"
                      opacity="0.95"
                    />
                    <text
                      x="0"
                      y="26"
                      textAnchor="middle"
                      fill="#fff8f1"
                      fontFamily="Fredoka"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {st.name}
                    </text>
                    <text
                      x="0"
                      y="35"
                      textAnchor="middle"
                      fill={st.delivered ? '#a8d5ba' : '#f1c9d6'}
                      fontFamily="Quicksand"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      {st.delivered ? 'Dream Delivered ✓' : `For ${st.childName}`}
                    </text>
                  </g>
                );
              })}

              {/* ANIMATED PIP COURIER CHARACTER */}
              <g
                transform={`translate(${pipPos.x}, ${pipPos.y}) rotate(${pipPos.angle})`}
                className="transition-transform duration-75"
              >
                {/* Golden Starlight Engine Glow */}
                <circle cx="-10" cy="5" r="18" fill="#f3cf75" opacity="0.3" className="animate-pulse" />
                <circle cx="-16" cy="7" r="8" fill="#f1c9d6" opacity="0.4" />
                <circle cx="-22" cy="9" r="4" fill="#fff" opacity="0.6" />

                {/* Official Pip Avatar Floating on His Cloud */}
                <image
                  href="/assets/pip_avatar_cloud.png"
                  x="-35"
                  y="-40"
                  width="70"
                  height="70"
                  preserveAspectRatio="xMidYMid meet"
                />

                {/* Starlight Satchel sparkle */}
                <text x="18" y="-15" fontSize="14" fill="#f3cf75" className="animate-bounce">
                  ✨
                </text>
              </g>
            </svg>

            {/* Floating Dream Cloud Pop-Up when delivered */}
            {activeBubble && (
              <div
                className="absolute z-30 bg-cream text-plum px-4 py-2.5 rounded-2xl border-2 border-rich-berry/30 shadow-2xl flex items-center gap-3 animate-fade-in font-bubbly pointer-events-auto"
                style={{
                  left: `${(activeBubble.x / 800) * 100}%`,
                  top: `${Math.max(12, (activeBubble.y / 450) * 100 - 24)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <span className="text-2xl">{activeBubble.emoji}</span>
                <div>
                  <div className="text-[10px] uppercase font-bold text-rich-berry tracking-wider">
                    {activeBubble.childName}’s Dream Delivered!
                  </div>
                  <div className="font-bold text-xs text-plum">{activeBubble.dreamTitle}</div>
                  <div className="text-[10px] text-warm-brown/70">{activeBubble.notes}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBubble(null)}
                  className="w-5 h-5 rounded-full bg-soft-blush text-rich-berry font-bold text-xs flex items-center justify-center hover:bg-rich-berry hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Bottom Dispatch Ledger & Station Roster */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {stations.map((st, idx) => {
              const isTarget = activeStationIndex === idx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => flyToStation(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isTarget
                      ? 'bg-white/20 border-star-gold shadow-md scale-102 ring-2 ring-star-gold/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{st.emoji}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.delivered ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-cream/70'
                      }`}
                    >
                      {st.delivered ? 'Delivered ✓' : 'Queued'}
                    </span>
                  </div>
                  <div className="font-serif-headline text-sm font-bold text-cream mt-1 truncate">
                    {st.name}
                  </div>
                  <div className="text-[11px] font-bubbly text-cream/70 truncate">
                    For {st.childName} (Age {st.childAge})
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
