/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Compass,
  Sparkles,
  RotateCcw,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import {
  DeliveryStatus,
  calculateProgress,
  computeSectionScrollProgress,
  getPointOnRoute,
  getReachedStationCount,
  ROUTE_SVG_PATH,
  STATION_THRESHOLDS,
} from '../utils/routePath';
import { useSoundEffects } from '../hooks/useSoundEffects';

export interface RooftopStation {
  id: string;
  name: string;
  childName: string;
  childAge: number;
  dreamTitle: string;
  storySubtitle: string;
  emoji: string;
  x: number; // SVG coordinates 0-800
  y: number; // SVG coordinates 0-450
  routeY: number; // Exact route curve Y above rooftop
  chimneyX: number;
  chimneyY: number;
  labelOffsetY: number; // Prevents SVG label overlap
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
    storySubtitle: 'Deliver a peaceful clover dream.',
    emoji: '🐰',
    x: 130,
    y: 310,
    routeY: 265,
    chimneyX: 130,
    chimneyY: 280,
    labelOffsetY: 16,
    color: '#a34063',
    delivered: false,
    notes: 'Requested extra snuggly ears and starry dandelion puffs.',
  },
  {
    id: 'clocktower',
    name: 'Copper Clocktower',
    childName: 'Oliver',
    childAge: 7,
    dreamTitle: 'Pocketwatch of Shooting Stars 🕰️',
    storySubtitle: 'Deliver a magical starlight adventure.',
    emoji: '🕰️',
    x: 320,
    y: 195,
    routeY: 150,
    chimneyX: 320,
    chimneyY: 165,
    labelOffsetY: 16,
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
    storySubtitle: 'Deliver a calm moonlit voyage.',
    emoji: '⛵',
    x: 490,
    y: 175,
    routeY: 130,
    chimneyX: 490,
    chimneyY: 145,
    labelOffsetY: 16,
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
    storySubtitle: 'Deliver a cozy cloud castle dream.',
    emoji: '☁️',
    x: 650,
    y: 220,
    routeY: 175,
    chimneyX: 650,
    chimneyY: 190,
    labelOffsetY: 16,
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
    storySubtitle: 'Deliver a gentle bedtime lullaby.',
    emoji: '🐋',
    x: 735,
    y: 340,
    routeY: 295,
    chimneyX: 735,
    chimneyY: 310,
    labelOffsetY: 16,
    color: '#a8d5ba',
    delivered: false,
    notes: 'Gentle ripples and cozy lantern hum on midnight water.',
  },
];

const SKY_STARS = [
  { id: 's1', cx: 65, cy: 52, r: 2.2, delay: 0.04 },
  { id: 's2', cx: 148, cy: 42, r: 1.8, delay: 0.1 },
  { id: 's3', cx: 235, cy: 68, r: 2.6, delay: 0.16 },
  { id: 's4', cx: 310, cy: 48, r: 1.9, delay: 0.22 },
  { id: 's5', cx: 398, cy: 62, r: 2.4, delay: 0.28 },
  { id: 's6', cx: 462, cy: 38, r: 1.7, delay: 0.34 },
  { id: 's7', cx: 548, cy: 56, r: 2.5, delay: 0.4 },
  { id: 's8', cx: 615, cy: 44, r: 1.9, delay: 0.46 },
  { id: 's9', cx: 58, cy: 145, r: 1.8, delay: 0.52 },
  { id: 's10', cx: 760, cy: 155, r: 2.1, delay: 0.58 },
];

const ROUTE_WAYPOINT_SPARKLES = [
  { id: 'wp1', progress: 0.14, x: 220, y: 158 },
  { id: 'wp2', progress: 0.41, x: 405, y: 138 },
  { id: 'wp3', progress: 0.65, x: 575, y: 148 },
  { id: 'wp4', progress: 0.86, x: 702, y: 232 },
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const routeCanvasRef = useRef<HTMLDivElement | null>(null);
  const wheelControlledRef = useRef(false);
  const activeRoutePathRef = useRef<SVGPathElement | null>(null);
  const glowRoutePathRef = useRef<SVGPathElement | null>(null);
  const pipGroupRef = useRef<SVGGElement | null>(null);
  const pipTrailGroupRef = useRef<SVGGElement | null>(null);
  const progressBarFillRef = useRef<HTMLDivElement | null>(null);
  const progressLabelRef = useRef<HTMLSpanElement | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const parcelAnimationFrameRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDispatchingRef = useRef(false);
  const manualModeRef = useRef(false);
  const currentProgressRef = useRef(0);
  const targetScrollProgressRef = useRef(0);
  const lastMilestoneRef = useRef(-1);
  const hasCelebratedRef = useRef(false);

  // Reduced motion preference
  const [motionAllowed, setMotionAllowed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });

  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setMotionAllowed(!media.matches);
    handleChange();
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter((item) => item !== timer);
      callback();
    }, delay);
    timeoutRefs.current.push(timer);
    return timer;
  }, []);

  const [stations, setStations] = useState<RooftopStation[]>(() =>
    ROOFTOP_STATIONS.map((station) => ({ ...station, delivered: false }))
  );
  const [activeStationIndex, setActiveStationIndex] = useState(0);
  const [status, setStatus] = useState<DeliveryStatus>('idle');
  const [progressFraction, setProgressFraction] = useState(0);
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);

  const [droppingParcel, setDroppingParcel] = useState<{
    x: number;
    startY: number;
    targetY: number;
    progress: number;
  } | null>(null);

  const [smokePuffs, setSmokePuffs] = useState<{ id: number; x: number; y: number }[]>([]);
  const [activeBubble, setActiveBubble] = useState<RooftopStation | null>(null);
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

  /**
   * Updates the SVG route strokeDashoffset, Pip's (x, y, angle) transform,
   * trailing sparkles, and HUD progress bar directly via DOM refs to avoid
   * 60Hz React state re-renders during scrolling.
   */
  const applyRouteProgressToDOM = useCallback((rawProgress: number) => {
    const p = Math.min(1, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
    currentProgressRef.current = p;

    const pt = getPointOnRoute(p);
    const trailPt = getPointOnRoute(Math.max(0, p - 0.035));

    if (activeRoutePathRef.current) {
      activeRoutePathRef.current.style.strokeDashoffset = `${1 - p}`;
    }
    if (glowRoutePathRef.current) {
      glowRoutePathRef.current.style.strokeDashoffset = `${1 - p}`;
    }
    if (pipGroupRef.current) {
      pipGroupRef.current.setAttribute(
        'transform',
        `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) rotate(${pt.angle.toFixed(2)})`
      );
      pipGroupRef.current.setAttribute('data-route-progress', p.toFixed(3));
      pipGroupRef.current.setAttribute('data-route-x', pt.x.toFixed(1));
      pipGroupRef.current.setAttribute('data-route-y', pt.y.toFixed(1));
    }
    if (pipTrailGroupRef.current) {
      pipTrailGroupRef.current.setAttribute(
        'transform',
        `translate(${trailPt.x.toFixed(2)}, ${trailPt.y.toFixed(2)})`
      );
      pipTrailGroupRef.current.style.opacity = p > 0.02 ? '1' : '0';
    }
    if (progressBarFillRef.current) {
      progressBarFillRef.current.style.width = `${Math.round(p * 100)}%`;
    }
    if (progressLabelRef.current) {
      progressLabelRef.current.textContent = `${Math.round(p * 100)}%`;
    }
  }, []);

  /**
   * Synchronizes discrete station delivery milestones when scroll progress crosses
   * any station threshold (0..5), triggering at most 6 React state updates across
   * the entire scroll range.
   */
  const syncScrollMilestones = useCallback((rawProgress: number) => {
    const p = Math.min(1, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
    applyRouteProgressToDOM(p);

    const reachedCount = getReachedStationCount(p);
    const completed = p >= STATION_THRESHOLDS[STATION_THRESHOLDS.length - 1];

    if (reachedCount === lastMilestoneRef.current && completed === hasCelebratedRef.current) {
      return;
    }

    lastMilestoneRef.current = reachedCount;
    hasCelebratedRef.current = completed;

    setStations((prev) =>
      prev.map((st, idx) => ({
        ...st,
        delivered: idx < reachedCount,
      }))
    );

    const nextActiveIdx = Math.min(
      ROOFTOP_STATIONS.length - 1,
      Math.max(0, reachedCount > 0 ? reachedCount - 1 : 0)
    );
    setActiveStationIndex(nextActiveIdx);
    setProgressFraction(p);
    setIsJourneyComplete(completed);

    if (completed) {
      setStatus('delivered');
      setActiveBubble(ROOFTOP_STATIONS[ROOFTOP_STATIONS.length - 1]);
    } else if (reachedCount > 0 && p > 0.03) {
      setStatus('dispatching');
      setActiveBubble(ROOFTOP_STATIONS[reachedCount - 1]);
    } else {
      setStatus('idle');
      setActiveBubble(null);
    }
  }, [applyRouteProgressToDOM]);

  // IntersectionObserver for night-sky entrance + scroll-driven progress loop
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    if (!motionAllowed) {
      setIsInView(true);
      applyRouteProgressToDOM(1);
      setStations(ROOFTOP_STATIONS.map((st) => ({ ...st, delivered: true })));
      setActiveStationIndex(ROOFTOP_STATIONS.length - 1);
      setProgressFraction(1);
      setIsJourneyComplete(true);
      setStatus('delivered');
      return;
    }

    let isVisible = true;
    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  setIsInView(true);
                  isVisible = true;
                } else {
                  isVisible = false;
                }
              });
            },
            { threshold: [0, 0.12], rootMargin: '120px 0px 120px 0px' }
          )
        : null;

    observer?.observe(sectionEl);

    const measureTargetScrollProgress = (): number => {
      const dialogContainer = sectionEl.closest('[role="dialog"]');
      if (dialogContainer) {
        const maxScroll = dialogContainer.scrollHeight - dialogContainer.clientHeight;
        if (maxScroll > 20) {
          return Math.min(1, Math.max(0, dialogContainer.scrollTop / maxScroll));
        }
      }
      const rect = sectionEl.getBoundingClientRect();
      return computeSectionScrollProgress(rect.top, rect.height, window.innerHeight);
    };

    const stepSmoothScroll = () => {
      scrollRafRef.current = null;
      if (isDispatchingRef.current || manualModeRef.current) return;

      const target = targetScrollProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.003) {
        syncScrollMilestones(target);
        return;
      }

      // Ease both small and large wheel deltas instead of jumping on fast scrolls.
      const next = current + diff * 0.42;
      syncScrollMilestones(next);
      scrollRafRef.current = requestAnimationFrame(stepSmoothScroll);
    };

    const scheduleScrollSync = (fromUserScroll: boolean) => {
      // Once a visitor scrolls directly over the route, the map owns that gesture.
      // Normal page/dialog scrolling resumes at route boundaries or after Reset.
      if (wheelControlledRef.current) return;
      if (isDispatchingRef.current) return;
      if (fromUserScroll && manualModeRef.current) {
        manualModeRef.current = false;
      }
      if (manualModeRef.current || !isVisible) return;

      targetScrollProgressRef.current = measureTargetScrollProgress();
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(stepSmoothScroll);
      }
    };

    // Initial measurement
    const initialP = measureTargetScrollProgress();
    targetScrollProgressRef.current = initialP;
    if (initialP > 0) setIsInView(true);
    syncScrollMilestones(initialP);

    const onScroll = () => scheduleScrollSync(true);
    const onResize = () => scheduleScrollSync(false);

    const dialogEl = sectionEl.closest('[role="dialog"]');
    const routeCanvas = routeCanvasRef.current;

    const onRouteWheel = (event: WheelEvent) => {
      if (!motionAllowed) return;

      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 32
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * window.innerHeight
          : event.deltaY;
      if (Math.abs(delta) < 0.5) return;

      const base = Math.min(1, Math.max(0, targetScrollProgressRef.current));
      const atStart = delta < 0 && base <= 0.001;
      const atEnd = delta > 0 && base >= 0.999;

      // Release route ownership at the boundaries so page/modal scrolling and its
      // progress synchronizer can resume immediately.
      if (atStart || atEnd) {
        wheelControlledRef.current = false;
        return;
      }

      // While over the actual rooftop map, use the wheel to advance the route
      // rather than scrolling the document/dialog at the same time.
      if (isDispatchingRef.current || manualModeRef.current) {
        wheelControlledRef.current = false;
        return;
      }
      event.preventDefault();
      wheelControlledRef.current = true;

      const clampedDelta = Math.max(-220, Math.min(220, delta));
      targetScrollProgressRef.current = Math.min(
        1,
        Math.max(0, base + clampedDelta / 1400)
      );
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(stepSmoothScroll);
      }
    };

    let lastTouchY: number | null = null;
    const onRouteTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        lastTouchY = null;
        return;
      }
      lastTouchY = event.touches[0].clientY;
    };

    const onRouteTouchMove = (event: TouchEvent) => {
      if (!motionAllowed || event.touches.length !== 1 || lastTouchY === null) return;

      const touchY = event.touches[0].clientY;
      const delta = lastTouchY - touchY;
      lastTouchY = touchY;
      if (Math.abs(delta) < 0.5) return;

      const base = Math.min(1, Math.max(0, targetScrollProgressRef.current));
      const atStart = delta < 0 && base <= 0.001;
      const atEnd = delta > 0 && base >= 0.999;
      if (atStart || atEnd) {
        wheelControlledRef.current = false;
        return;
      }

      // A non-passive listener lets a swipe over the map drive Pip, not the page.
      if (isDispatchingRef.current || manualModeRef.current) {
        wheelControlledRef.current = false;
        return;
      }
      event.preventDefault();
      wheelControlledRef.current = true;

      const clampedDelta = Math.max(-110, Math.min(110, delta));
      targetScrollProgressRef.current = Math.min(
        1,
        Math.max(0, base + clampedDelta / 550)
      );
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(stepSmoothScroll);
      }
    };

    const onRouteTouchEnd = () => {
      lastTouchY = null;
      // A touch gesture is over; subsequent document scrolling must be allowed
      // to synchronize the route again instead of remaining permanently locked.
      wheelControlledRef.current = false;
    };

    const onRoutePointerLeave = () => {
      wheelControlledRef.current = false;
      if (isDispatchingRef.current || manualModeRef.current) return;
      targetScrollProgressRef.current = measureTargetScrollProgress();
      if (scrollRafRef.current === null) {
        scrollRafRef.current = requestAnimationFrame(stepSmoothScroll);
      }
    };

    routeCanvas?.addEventListener('wheel', onRouteWheel, { passive: false });
    routeCanvas?.addEventListener('pointerleave', onRoutePointerLeave, { passive: true });
    routeCanvas?.addEventListener('touchstart', onRouteTouchStart, { passive: true });
    routeCanvas?.addEventListener('touchmove', onRouteTouchMove, { passive: false });
    routeCanvas?.addEventListener('touchend', onRouteTouchEnd, { passive: true });
    routeCanvas?.addEventListener('touchcancel', onRouteTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    dialogEl?.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      routeCanvas?.removeEventListener('wheel', onRouteWheel);
      routeCanvas?.removeEventListener('pointerleave', onRoutePointerLeave);
      routeCanvas?.removeEventListener('touchstart', onRouteTouchStart);
      routeCanvas?.removeEventListener('touchmove', onRouteTouchMove);
      routeCanvas?.removeEventListener('touchend', onRouteTouchEnd);
      routeCanvas?.removeEventListener('touchcancel', onRouteTouchEnd);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      dialogEl?.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [motionAllowed, applyRouteProgressToDOM, syncScrollMilestones]);

  useEffect(() => {
    if (dispatchTrigger && dispatchTrigger > 0) {
      const nextIdx = (activeStationIndex + 1) % stations.length;
      flyToStation(nextIdx);
    }
  }, [dispatchTrigger]);

  // Clean up RAF and timers on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      if (parcelAnimationFrameRef.current !== null) cancelAnimationFrame(parcelAnimationFrameRef.current);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      timeoutRefs.current.forEach((timer) => clearTimeout(timer));
      timeoutRefs.current = [];
      tourTimerRef.current = null;
      animationFrameRef.current = null;
      parcelAnimationFrameRef.current = null;
      scrollRafRef.current = null;
      isDispatchingRef.current = false;
    };
  }, []);

  // Direct interactive flight to a specific station along the route curve
  const flyToStation = (targetIndex: number, isTour = false) => {
    if (isDispatchingRef.current || targetIndex < 0 || targetIndex >= stations.length) return;
    if (!isTour && tourTimerRef.current !== null) {
      clearTimeout(tourTimerRef.current);
      timeoutRefs.current = timeoutRefs.current.filter((timer) => timer !== tourTimerRef.current);
      tourTimerRef.current = null;
      setIsTouring(false);
    }

    manualModeRef.current = true;
    isDispatchingRef.current = true;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (parcelAnimationFrameRef.current !== null) {
      cancelAnimationFrame(parcelAnimationFrameRef.current);
      parcelAnimationFrameRef.current = null;
    }

    play('dream-dispatch');
    setActiveStationIndex(targetIndex);
    setStatus('dispatching');
    setActiveBubble(null);

    const targetStation = stations[targetIndex];
    const startProgress = currentProgressRef.current;
    const targetProgress =
      targetIndex === 0 ? 0.02 : STATION_THRESHOLDS[targetIndex] ?? 1;

    if (!motionAllowed) {
      applyRouteProgressToDOM(targetProgress);
      setProgressFraction(targetProgress);
      isDispatchingRef.current = false;
      setStations((prev) =>
        prev.map((s, idx) => (idx <= targetIndex ? { ...s, delivered: true } : s))
      );
      setStatus('delivered');
      setActiveBubble(targetStation);
      setIsJourneyComplete(targetIndex === stations.length - 1);
      return;
    }

    const durationMs = 1100;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = calculateProgress(elapsed, durationMs);
      const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const interpProgress = startProgress + (targetProgress - startProgress) * easedT;

      applyRouteProgressToDOM(interpProgress);

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        applyRouteProgressToDOM(targetProgress);
        setProgressFraction(targetProgress);
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
      startY: station.routeY,
      targetY: station.chimneyY,
      progress: 0,
    });

    const dropStartTime = performance.now();
    const dropDuration = 480;

    const animateDrop = (now: number) => {
      const elapsed = now - dropStartTime;
      const t = Math.min(1, elapsed / dropDuration);

      if (t < 1) {
        setDroppingParcel((prev) => (prev ? { ...prev, progress: t } : null));
        parcelAnimationFrameRef.current = requestAnimationFrame(animateDrop);
      } else {
        parcelAnimationFrameRef.current = null;
        setDroppingParcel(null);
        isDispatchingRef.current = false;
        play('nightlight-change');

        const puffId = Date.now();
        setSmokePuffs((prev) => [...prev, { id: puffId, x: station.chimneyX, y: station.chimneyY }]);
        scheduleTimeout(() => {
          setSmokePuffs((prev) => prev.filter((p) => p.id !== puffId));
        }, 1400);

        setStations((prev) =>
          prev.map((s, idx) => (idx <= targetIndex ? { ...s, delivered: true } : s))
        );

        const allDone = targetIndex === stations.length - 1;
        setIsJourneyComplete(allDone);
        setStatus('delivered');
        setActiveBubble(station);

        if (isTour) {
          const nextIdx = (targetIndex + 1) % stations.length;
          if (nextIdx !== 0) {
            tourTimerRef.current = scheduleTimeout(() => {
              tourTimerRef.current = null;
              flyToStation(nextIdx, true);
            }, 950);
          } else {
            setIsTouring(false);
          }
        }
      }
    };

    parcelAnimationFrameRef.current = requestAnimationFrame(animateDrop);
  };

  const startGrandTour = () => {
    if (isDispatchingRef.current || status === 'dispatching') return;
    manualModeRef.current = true;
    setIsTouring(true);
    setIsJourneyComplete(false);
    applyRouteProgressToDOM(0);
    setStations((prev) => prev.map((station) => ({ ...station, delivered: false })));
    flyToStation(0, true);
  };

  const resetRoute = () => {
    if (isDispatchingRef.current) return;
    play('button-click');
    wheelControlledRef.current = false;
    targetScrollProgressRef.current = 0;
    manualModeRef.current = true;
    lastMilestoneRef.current = 0;
    hasCelebratedRef.current = false;
    applyRouteProgressToDOM(0);
    setStations((prev) => prev.map((station) => ({ ...station, delivered: false })));
    setActiveStationIndex(0);
    setProgressFraction(0);
    setIsJourneyComplete(false);
    setStatus('idle');
    setIsTouring(false);
    setActiveBubble(null);
    setDroppingParcel(null);
    timeoutRefs.current.forEach((timer) => clearTimeout(timer));
    timeoutRefs.current = [];
    tourTimerRef.current = null;
    setSmokePuffs([]);
    isDispatchingRef.current = false;
  };

  const activeStation = stations[activeStationIndex] || stations[0];
  const deliveredCount = stations.filter((s) => s.delivered).length;
  const initialPoint = getPointOnRoute(motionAllowed ? 0 : 1);
  const entranceReady = !motionAllowed || isInView;

  return (
    <section
      ref={sectionRef}
      id={compact ? undefined : 'map'}
      data-testid={compact ? 'dream-delivery-modal-section' : 'dream-delivery-scroll-section'}
      className={
        compact
          ? 'ultimate-route-embed relative w-full'
          : 'py-12 md:py-20 relative w-full'
      }
      aria-label="Dream Delivery Route Map"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {!compact && (
          <div
            className={`text-center max-w-3xl mx-auto mb-8 transition-all duration-700 ease-out ${
              entranceReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold font-semibold">
              Celestial Courier Map · Scroll-Driven Midnight Route
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-2">
              Dream Delivery Across the Rooftops
            </h2>
            <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
              Scroll through the night sky to guide Pip along the starlight route, or click any rooftop to dispatch a dream parcel directly.
            </p>
          </div>
        )}

        {/* The Main Map Card Container */}
        <div
          data-project-card="true"
          className={`bg-plum dark:bg-plum-dark rounded-3xl p-4 sm:p-7 border-3 border-rich-berry/30 dark:border-star-gold/25 shadow-2xl relative text-cream overflow-hidden transition-all duration-700 ease-out ${
            entranceReady ? 'opacity-100 scale-100 translate-y-0' : 'opacity-40 scale-98 translate-y-3'
          }`}
        >
          {/* Top Control & Slumber Dispatch HUD */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4 font-bubbly text-xs">
            {/* Status Indicator */}
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-star-gold flex-shrink-0" aria-hidden="true" />
              <div role="status" aria-live="polite">
                <span className="text-[11px] opacity-75 uppercase tracking-wider block">
                  {isTouring ? 'Grand Midnight Tour' : "Pip's Slumber Status"}
                </span>
                <strong className="text-emerald-300 text-sm">
                  {isJourneyComplete
                    ? 'Another dream safely delivered!'
                    : status === 'dispatching'
                    ? `Flying to ${activeStation.name}...`
                    : status === 'delivered'
                    ? `Dream Delivered to ${activeStation.childName}!`
                    : 'Scroll or Choose a Rooftop'}
                </strong>
              </div>
            </div>

            {/* Delivered Counter Metric */}
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 tabular-nums">
              <Heart className="w-3.5 h-3.5 text-rose-300 fill-current" aria-hidden="true" />
              <span>
                <strong data-testid="delivered-station-count">{deliveredCount}</strong> / {stations.length} Dreams Tucked In Tonight
              </span>
            </div>

            {/* Actions: Dispatch, Grand Tour, and Reset/Replay */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={startGrandTour}
                disabled={status === 'dispatching' && isDispatchingRef.current}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-cream border border-white/20 font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Compass className="w-3.5 h-3.5 text-star-gold" aria-hidden="true" />
                <span>Grand Midnight Tour</span>
              </button>

              <button
                type="button"
                onClick={() => flyToStation((activeStationIndex + 1) % stations.length)}
                disabled={status === 'dispatching' && isDispatchingRef.current}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer whitespace-nowrap ${
                  status === 'dispatching' && isDispatchingRef.current
                    ? 'bg-amber-300 text-warm-brown opacity-85 cursor-wait'
                    : 'bg-star-gold hover:bg-amber-300 text-warm-brown hover:scale-105 active:scale-95'
                }`}
                aria-label="Send Next Dream — dispatch dream to next rooftop"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>
                  {status === 'dispatching' && isDispatchingRef.current
                    ? 'Pip is Flying...'
                    : 'Send Next Dream ✨'}
                </span>
              </button>
              <button
                type="button"
                onClick={resetRoute}
                disabled={isDispatchingRef.current || (deliveredCount === 0 && progressFraction <= 0.02)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-cream font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                aria-label="Reset all dream deliveries"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Live Scroll / Flight Progress Bar */}
          <div
            className="mb-4"
            role="progressbar"
            aria-label={`Dream route progress toward ${activeStation.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressFraction * 100)}
          >
            <div className="flex items-center justify-between text-[11px] text-cream/75 mb-1.5 tabular-nums">
              <span>MIDNIGHT FLIGHT ROUTE PROGRESS</span>
              <span ref={progressLabelRef} data-testid="route-progress-label">
                {Math.round((motionAllowed ? progressFraction : 1) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                ref={progressBarFillRef}
                className="h-full rounded-full bg-gradient-to-r from-soft-blush via-star-gold to-lavender transition-[width] duration-75"
                style={{ width: `${Math.round((motionAllowed ? progressFraction : 1) * 100)}%` }}
              />
            </div>
          </div>

          {/* Panoramic Rooftop SVG Canvas */}
          <div
            ref={routeCanvasRef}
            data-testid="dream-delivery-route-canvas"
            className="dream-delivery-route-canvas relative w-full aspect-[16/9] min-h-[240px] sm:min-h-[320px] max-h-[490px] bg-gradient-to-b from-[#0f0a1c] via-[#1a1228] to-[#241938] rounded-2xl border border-white/15 overflow-hidden select-none"
            aria-label="Scroll here to guide Pip along the rooftop route"
          >
            {/* Ambient Starfield Pattern */}
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
                  <stop offset="0%" stopColor="#f1c9d6" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#f3cf75" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d9c8ef" stopOpacity="0.95" />
                </linearGradient>

                {/* Chimney smoke gradient */}
                <radialGradient id="smoke-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f3cf75" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#f3cf75" stopOpacity="0" />
                </radialGradient>

                {/* Soft route trail glow filter */}
                <filter id="route-glow-blur" x="-15%" y="-25%" width="130%" height="150%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                </filter>

                {/* Circular medallion clip for Pip courier avatar */}
                <clipPath id="pip-courier-clip">
                  <circle cx="0" cy="-4" r="26" />
                </clipPath>
              </defs>

              {/* Drifting Lavender Night Clouds */}
              <g
                className={motionAllowed ? 'animate-floating-slow' : ''}
                opacity="0.22"
                fill="#d9c8ef"
                aria-hidden="true"
              >
                <g transform="translate(110, 92)">
                  <ellipse cx="0" cy="0" rx="46" ry="14" />
                  <ellipse cx="-20" cy="-6" rx="24" ry="12" />
                  <ellipse cx="18" cy="-5" rx="28" ry="11" />
                </g>
                <g transform="translate(415, 76)">
                  <ellipse cx="0" cy="0" rx="54" ry="15" />
                  <ellipse cx="-24" cy="-7" rx="26" ry="12" />
                  <ellipse cx="22" cy="-6" rx="30" ry="12" />
                </g>
                <g transform="translate(610, 110)">
                  <ellipse cx="0" cy="0" rx="40" ry="12" />
                  <ellipse cx="15" cy="-5" rx="22" ry="10" />
                </g>
              </g>

              {/* Staggered Entrance Stars in the Night Sky */}
              <g aria-hidden="true">
                {SKY_STARS.map((star) => (
                  <circle
                    key={star.id}
                    cx={star.cx}
                    cy={star.cy}
                    r={star.r}
                    fill={star.r > 2.1 ? '#f3cf75' : '#fff8f1'}
                    opacity={entranceReady ? 0.85 : 0.15}
                    style={{
                      transition: `opacity 600ms ease ${star.delay}s`,
                    }}
                  />
                ))}
              </g>

              {/* Distant Mountain Silhouettes & Nebula */}
              <path
                d="M 0 380 Q 200 320 400 360 T 800 340 L 800 450 L 0 450 Z"
                fill="#130d20"
                opacity="0.85"
              />

              {/* Glowing Crescent Moon */}
              <g transform="translate(690, 65)">
                <circle cx="0" cy="0" r="32" fill="#f3cf75" opacity="0.95" />
                <circle cx="-10" cy="-8" r="28" fill="#150e24" />
                <circle cx="0" cy="0" r="48" fill="#f3cf75" opacity="0.09" />
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

              {/* 1. Faint Dotted Guide Route Underneath */}
              <path
                d={ROUTE_SVG_PATH}
                stroke="url(#flight-arc-glow)"
                strokeWidth="2"
                strokeDasharray="5 7"
                strokeLinecap="round"
                opacity="0.32"
              />

              {/* 2. Scroll-Driven Glowing Aura Trail */}
              <path
                ref={glowRoutePathRef}
                d={ROUTE_SVG_PATH}
                pathLength={1}
                stroke="url(#flight-arc-glow)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={motionAllowed ? 1 - progressFraction : 0}
                filter="url(#route-glow-blur)"
                opacity="0.45"
              />

              {/* 3. Scroll-Driven Progressive Golden Delivery Route */}
              <path
                ref={activeRoutePathRef}
                data-testid="dream-route-active-path"
                d={ROUTE_SVG_PATH}
                pathLength={1}
                stroke="url(#flight-arc-glow)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={motionAllowed ? 1 - progressFraction : 0}
              />

              {/* Small Sparkle Waypoints Along the Route */}
              {ROUTE_WAYPOINT_SPARKLES.map((wp) => {
                const isLit = !motionAllowed || progressFraction >= wp.progress;
                return (
                  <g
                    key={wp.id}
                    transform={`translate(${wp.x}, ${wp.y})`}
                    opacity={isLit ? 0.95 : 0.25}
                    className="transition-opacity duration-300"
                  >
                    <circle r={isLit ? 5 : 2.5} fill="#f3cf75" opacity="0.3" />
                    <circle r="2.2" fill="#fff8f1" />
                  </g>
                );
              })}

              {/* ROOFTOP ARCHITECTURE */}

              {/* House 1: Whispering Gable */}
              <g
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onClick={() => flyToStation(0)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    flyToStation(0);
                  }
                }}
                aria-label="Fly to Whispering Gable"
              >
                <polygon points="60,450 60,370 130,310 200,370 200,450" fill="#2d203f" />
                <polygon points="50,375 130,305 210,375 130,312" fill="#3a2a52" />
                <rect x="122" y="280" width="16" height="32" fill="#a34063" rx="2" />
                <rect x="118" y="276" width="24" height="6" fill="#bf4d75" rx="2" />
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
                <line x1="130" y1="345" x2="130" y2="379" stroke="#2d203f" strokeWidth="2" />
                <line x1="115" y1="362" x2="145" y2="362" stroke="#2d203f" strokeWidth="2" />
                <text x="130" y="270" textAnchor="middle" fontSize="12" fill="#f1c9d6">
                  🐰
                </text>
              </g>

              {/* House 2: Copper Clocktower */}
              <g
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onClick={() => flyToStation(1)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    flyToStation(1);
                  }
                }}
                aria-label="Fly to Copper Clocktower"
              >
                <rect x="285" y="240" width="70" height="210" fill="#261b36" />
                <polygon points="275,245 320,165 365,245" fill="#325458" />
                <polygon points="270,248 320,162 370,248 320,168" fill="#467379" />
                <rect x="314" y="160" width="12" height="20" fill="#467379" rx="2" />
                <circle
                  cx="320"
                  cy="275"
                  r="20"
                  fill={stations[1].delivered ? '#f3cf75' : '#ffeebb'}
                  opacity="0.9"
                  stroke="#5c4033"
                  strokeWidth="3"
                />
                <line x1="320" y1="275" x2="320" y2="263" stroke="#5c4033" strokeWidth="2" />
                <line x1="320" y1="275" x2="330" y2="275" stroke="#5c4033" strokeWidth="2" />
              </g>

              {/* House 3: Beacon Point Lighthouse */}
              <g
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onClick={() => flyToStation(2)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    flyToStation(2);
                  }
                }}
                aria-label="Fly to Beacon Point"
              >
                <polygon points="465,450 472,210 508,210 515,450" fill="#2d2242" />
                <polygon points="468,360 470,320 510,320 512,360" fill="#a34063" opacity="0.6" />
                <polygon points="471,280 472,240 508,240 509,280" fill="#a34063" opacity="0.6" />
                <rect x="473" y="180" width="34" height="30" fill="#3a2a52" rx="4" />
                <rect x="484" y="145" width="12" height="35" fill="#5a4278" rx="2" />
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
                role="button"
                tabIndex={0}
                onClick={() => flyToStation(3)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    flyToStation(3);
                  }
                }}
                aria-label="Fly to Cloud Nine Spire"
              >
                <polygon points="620,450 635,270 665,270 680,450" fill="#231735" />
                <polygon points="625,275 650,190 675,275" fill="#4d3b68" />
                <polygon points="620,278 650,186 680,278 650,193" fill="#67508a" />
                <rect x="644" y="190" width="12" height="24" fill="#67508a" rx="2" />
                <ellipse
                  cx="650"
                  cy="320"
                  rx="14"
                  ry="20"
                  fill={stations[3].delivered ? '#d9c8ef' : '#392552'}
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>

              {/* House 5: Harbor Tugboat */}
              <g
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onClick={() => flyToStation(4)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    flyToStation(4);
                  }
                }}
                aria-label="Fly to Harbor Tugboat"
              >
                <path
                  d="M 680 410 L 700 375 L 770 375 L 790 410 Q 735 425 680 410 Z"
                  fill="#332447"
                />
                <rect x="710" y="340" width="50" height="35" fill="#422f5c" rx="4" />
                <rect x="730" y="310" width="10" height="30" fill="#e8c96d" rx="2" />
                <rect x="727" y="306" width="16" height="5" fill="#f3cf75" rx="2" />
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
                  <path
                    d="M -12 -12 Q 0 -22 12 -12 Z"
                    fill="#f3cf75"
                    stroke="#fff"
                    strokeWidth="1"
                  />
                  <line x1="-10" y1="-12" x2="0" y2="0" stroke="#f1c9d6" strokeWidth="1" />
                  <line x1="10" y1="-12" x2="0" y2="0" stroke="#f1c9d6" strokeWidth="1" />
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

              {/* Station Delivery Markers, Revealed Dream Parcels & Non-Overlapping Labels */}
              {stations.map((st, idx) => {
                const isActive = activeStationIndex === idx;
                return (
                  <g
                    key={st.id}
                    data-testid={`station-marker-${st.id}`}
                    data-delivered={st.delivered ? 'true' : 'false'}
                    transform={`translate(${st.x}, ${st.y})`}
                    className="cursor-pointer"
                    onClick={() => flyToStation(idx)}
                  >
                    <g
                      style={{
                        transform: st.delivered ? 'scale(1.06)' : isActive ? 'scale(1.02)' : 'scale(0.96)',
                        opacity: st.delivered || isActive ? 1 : 0.85,
                        transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 380ms ease',
                      }}
                    >
                      {/* Soft glow halo when destination is reached */}
                      <circle
                        cx="0"
                        cy="0"
                        r={st.delivered ? 20 : 13}
                        fill={st.delivered ? '#f3cf75' : st.color}
                        opacity={st.delivered ? 0.38 : isActive ? 0.42 : 0.18}
                        className={st.delivered && motionAllowed ? 'animate-pulse' : ''}
                      />
                      {/* Badge circle */}
                      <circle
                        cx="0"
                        cy="0"
                        r={st.delivered ? 11 : 9.5}
                        fill={st.color}
                        stroke="#fff8f1"
                        strokeWidth="2.5"
                      />
                      {st.delivered ? (
                        <path
                          d="M -3.8 0.4 L -1.1 3.1 L 4.2 -2.4"
                          stroke="#fff8f1"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ) : (
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill="#fff8f1"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {idx + 1}
                        </text>
                      )}

                      {/* Delivered Dream Parcel & Sparkles on Rooftop */}
                      {st.delivered && (
                        <g transform="translate(18, -16)">
                          <rect
                            x="-5.5"
                            y="-5.5"
                            width="11"
                            height="11"
                            rx="2.2"
                            fill="#f3cf75"
                            stroke="#a34063"
                            strokeWidth="1.3"
                          />
                          <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#a34063" strokeWidth="1.3" />
                          <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="#a34063" strokeWidth="1.3" />
                          <path
                            d="M 0 -5.5 C -3 -8.5, -5 -6.5, 0 -5.5 C 5 -6.5, 3 -8.5, 0 -5.5"
                            stroke="#a34063"
                            strokeWidth="1.1"
                            fill="none"
                          />
                          <circle cx="9" cy="-7" r="2.2" fill="#fff8f1" />
                          <circle cx="-9" cy="-6" r="1.8" fill="#f1c9d6" />
                          <circle cx="7" cy="6" r="1.5" fill="#f3cf75" />
                        </g>
                      )}

                      {/* Rooftop Station Label (positioned cleanly below marker) */}
                      <rect
                        x="-56"
                        y={st.labelOffsetY}
                        width="112"
                        height="26"
                        rx="8"
                        fill="#1b1228"
                        stroke={st.delivered ? '#f3cf75' : st.color}
                        strokeWidth="1.5"
                        opacity="0.96"
                      />
                      <text
                        x="0"
                        y={st.labelOffsetY + 11}
                        textAnchor="middle"
                        fill="#fff8f1"
                        fontFamily="Fredoka, sans-serif"
                        fontSize="9.5"
                        fontWeight="bold"
                      >
                        {st.name}
                      </text>
                      <text
                        x="0"
                        y={st.labelOffsetY + 20.5}
                        textAnchor="middle"
                        fill={st.delivered ? '#a8d5ba' : '#f1c9d6'}
                        fontFamily="Quicksand, sans-serif"
                        fontSize="7.8"
                        fontWeight="bold"
                      >
                        {st.delivered ? 'Dream Delivered!' : `For ${st.childName}`}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Final Destination Starburst Celebration when Journey Completes */}
              {isJourneyComplete && (
                <g
                  transform="translate(735, 275)"
                  data-testid="final-route-starburst"
                  aria-hidden="true"
                >
                  <circle cx="0" cy="0" r="36" fill="#f3cf75" opacity="0.16" />
                  <circle cx="-28" cy="-18" r="3" fill="#f3cf75" />
                  <circle cx="30" cy="-16" r="2.8" fill="#fff8f1" />
                  <circle cx="-22" cy="14" r="2.2" fill="#f1c9d6" />
                  <circle cx="25" cy="16" r="2.5" fill="#d9c8ef" />
                  <path
                    d="M 0 -30 L 2.2 -23 L 9 -20.8 L 2.2 -18.6 L 0 -12 L -2.2 -18.6 L -9 -20.8 L -2.2 -23 Z"
                    fill="#f3cf75"
                  />
                  <path
                    d="M -34 -2 L -32.5 2.5 L -28 4 L -32.5 5.5 L -34 10 L -35.5 5.5 L -40 4 L -35.5 2.5 Z"
                    fill="#fff8f1"
                  />
                  <path
                    d="M 34 -4 L 35.5 0.5 L 40 2 L 35.5 3.5 L 34 8 L 32.5 3.5 L 28 2 L 32.5 0.5 Z"
                    fill="#f1c9d6"
                  />
                </g>
              )}

              {/* Sparkle Wake Trail Behind Pip */}
              <g
                ref={pipTrailGroupRef}
                transform={`translate(${initialPoint.x}, ${initialPoint.y})`}
                style={{ opacity: motionAllowed ? 0 : 1 }}
                aria-hidden="true"
              >
                <circle cx="-22" cy="6" r="4.5" fill="#f3cf75" opacity="0.75" />
                <circle cx="-34" cy="10" r="3.2" fill="#f1c9d6" opacity="0.65" />
                <circle cx="-45" cy="4" r="2.2" fill="#d9c8ef" opacity="0.55" />
                <path
                  d="M -28 -6 L -26.8 -2.5 L -23.3 -1.3 L -26.8 -0.1 L -28 3.4 L -29.2 -0.1 L -32.7 -1.3 L -29.2 -2.5 Z"
                  fill="#f3cf75"
                  opacity="0.8"
                />
              </g>

              {/* ANIMATED PIP COURIER CHARACTER ON THE ROUTE */}
              <g
                ref={pipGroupRef}
                data-testid="pip-route-courier"
                data-route-progress={motionAllowed ? '0.000' : '1.000'}
                data-route-x={initialPoint.x.toFixed(1)}
                data-route-y={initialPoint.y.toFixed(1)}
                transform={`translate(${initialPoint.x}, ${initialPoint.y}) rotate(${initialPoint.angle})`}
              >
                <g className={motionAllowed ? 'animate-floating-slow' : ''}>
                  {/* Soft Starlight Halo */}
                  <circle cx="0" cy="-4" r="30" fill="#f3cf75" opacity="0.18" />
                  <circle cx="0" cy="-4" r="22" fill="#d9c8ef" opacity="0.14" />

                  {/* Dream Parcel Satchel Tucked on the Cloud */}
                  <g transform="translate(15, 3) rotate(10)">
                    <rect
                      x="-6"
                      y="-6"
                      width="12"
                      height="11"
                      rx="2.5"
                      fill="#f3cf75"
                      stroke="#a34063"
                      strokeWidth="1.4"
                    />
                    <line x1="-6" y1="-0.5" x2="6" y2="-0.5" stroke="#a34063" strokeWidth="1.4" />
                    <line x1="0" y1="-6" x2="0" y2="5" stroke="#a34063" strokeWidth="1.4" />
                  </g>

                  {/* Pip's Cozy Berry Robe & Scarf */}
                  <path
                    d="M -10 4 Q 0 -2 10 4 L 12 14 Q 0 17 -12 14 Z"
                    fill="#a34063"
                  />
                  <path
                    d="M -9 3 Q 0 6 9 3"
                    stroke="#f3cf75"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Pip's Rounded Ivory Skull Head */}
                  <ellipse cx="0" cy="-6" rx="14.5" ry="13" fill="#fffaf3" stroke="#e7dccf" strokeWidth="1" />
                  <rect x="-6.5" y="2" width="13" height="5.5" rx="2.5" fill="#fffaf3" />

                  {/* Drooping Lavender Nightcap with Ribbed Brim & Golden Pom-Pom */}
                  <path
                    d="M -13.5 -11 C -10 -24, 6 -25, 16 -14 C 19 -11, 22 -6, 20 -3 C 15 -5, 10 -9, 3 -11 Z"
                    fill="#c8b2e8"
                    stroke="#9f86c6"
                    strokeWidth="1"
                  />
                  <path
                    d="M -14 -10.5 Q 0 -15.5 14 -10.5"
                    stroke="#fff8f1"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="20.5" cy="-2.5" r="4" fill="#f3cf75" stroke="#fff8f1" strokeWidth="1" />

                  {/* Pip's Expressive Dark Eye Sockets with Warm Berry Crescents & Starlight Catchlights */}
                  <g transform="translate(-5.5, -5.5)">
                    <ellipse cx="0" cy="0" rx="4.2" ry="4.5" fill="#140d1c" />
                    <path d="M -3.2 1.6 Q 0 3.8 3.2 1.6" stroke="#a34063" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    <circle cx="-1.3" cy="-1.4" r="1.45" fill="#ffffff" />
                    <circle cx="1.5" cy="1.1" r="0.7" fill="#ffffff" />
                  </g>
                  <g transform="translate(5.5, -5.5)">
                    <ellipse cx="0" cy="0" rx="4.2" ry="4.5" fill="#140d1c" />
                    <path d="M -3.2 1.6 Q 0 3.8 3.2 1.6" stroke="#a34063" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    <circle cx="-1.3" cy="-1.4" r="1.45" fill="#ffffff" />
                    <circle cx="1.5" cy="1.1" r="0.7" fill="#ffffff" />
                  </g>

                  {/* Tiny Nasal Cavity & Gentle Bedtime Smile */}
                  <ellipse cx="0" cy="-1.8" rx="1.2" ry="1.5" fill="#3d2938" />
                  <path
                    d="M -2.5 1.8 Q 0 3.4 2.5 1.8"
                    stroke="#5c4033"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Rosy Blush Cheeks */}
                  <ellipse cx="-9.8" cy="-2" rx="2.6" ry="1.5" fill="#f49cbb" opacity="0.65" />
                  <ellipse cx="9.8" cy="-2" rx="2.6" ry="1.5" fill="#f49cbb" opacity="0.65" />

                  {/* Fluffy Multi-Puff Cloud Courier Sleigh Underneath */}
                  <g transform="translate(0, 13)">
                    <ellipse cx="-13" cy="2" rx="10" ry="6.5" fill="#f1c9d6" opacity="0.85" />
                    <ellipse cx="14" cy="2" rx="10" ry="6.5" fill="#d9c8ef" opacity="0.85" />
                    <circle cx="-10" cy="-1" r="7.5" fill="#fff8f1" />
                    <circle cx="10" cy="-1" r="7.5" fill="#fff8f1" />
                    <ellipse cx="0" cy="1" rx="16" ry="7.5" fill="#fff8f1" />
                    <circle cx="0" cy="-2" r="8.5" fill="#ffffff" />
                  </g>

                  {/* Leading Starlight Sparkle */}
                  <circle cx="24" cy="-16" r="2.6" fill="#f3cf75" />
                  <circle cx="-22" cy="-14" r="1.8" fill="#fff8f1" />
                </g>
              </g>
            </svg>

            {/* Accessible HTML Button Overlays directly over each rooftop */}
            {stations.map((st, idx) => (
              <button
                key={'btn-overlay-' + st.id}
                type="button"
                onClick={() => flyToStation(idx)}
                style={{
                  position: 'absolute',
                  left: `${(st.x / 800) * 100}%`,
                  top: `${(st.y / 450) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`Fly Pip to ${st.name}`}
                className="z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full cursor-pointer hover:bg-star-gold/20 focus-visible:ring-2 focus-visible:ring-star-gold transition-all flex items-center justify-center"
              >
                <span className="sr-only">Fly to {st.name}</span>
              </button>
            ))}

            {/* Floating Dream Cloud Pop-Up when delivered (placed in the upper night sky above the route arc so it never overlaps rooftops or labels) */}
            {activeBubble && (
              <div
                className="hidden sm:flex absolute top-3.5 left-1/2 -translate-x-1/2 z-30 bg-cream/95 backdrop-blur-sm text-plum px-4 py-2 rounded-2xl border-2 border-rich-berry/30 shadow-2xl items-center gap-3 font-bubbly pointer-events-auto max-w-sm"
              >
                <span className="text-2xl flex-shrink-0">{activeBubble.emoji}</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-rich-berry tracking-wider truncate">
                    {activeBubble.childName}’s Dream Delivered! ({activeBubble.name})
                  </div>
                  <div className="font-bold text-xs text-plum truncate">{activeBubble.dreamTitle}</div>
                  <div className="text-[10px] text-warm-brown/75 line-clamp-1">{activeBubble.storySubtitle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBubble(null)}
                  aria-label="Dismiss dream delivery note"
                  className="w-5 h-5 rounded-full bg-soft-blush text-rich-berry font-bold text-xs flex items-center justify-center hover:bg-rich-berry hover:text-white transition-colors flex-shrink-0 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Final Delivery Celebration Banner */}
          {isJourneyComplete && (
            <div
              data-testid="dream-delivery-celebration"
              role="status"
              aria-live="polite"
              className="mt-4 rounded-2xl bg-gradient-to-r from-star-gold/20 via-soft-blush/20 to-lavender/20 border border-star-gold/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-star-gold flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-serif-headline text-sm sm:text-base font-bold text-star-gold">
                    Another dream safely delivered!
                  </p>
                  <p className="font-bubbly text-xs text-cream/85">
                    Pip has tucked all 5 midnight dreams safely beneath the stars.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetRoute}
                className="px-3.5 py-1.5 rounded-xl bg-star-gold text-warm-brown font-bubbly font-bold text-xs hover:bg-amber-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                Replay Journey
              </button>
            </div>
          )}

          {/* Bottom Dispatch Ledger & Destination Story Cards */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {stations.map((st, idx) => {
              const isTarget = activeStationIndex === idx;
              return (
                <button
                  key={st.id}
                  type="button"
                  data-testid={`station-card-${st.id}`}
                  onClick={() => flyToStation(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    st.delivered
                      ? 'bg-white/15 border-star-gold/70 shadow-md'
                      : isTarget
                      ? 'bg-white/20 border-star-gold shadow-md ring-2 ring-star-gold/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-lg">{st.emoji}</span>
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        st.delivered ? 'text-emerald-300' : 'text-cream/65'
                      }`}
                    >
                      {st.delivered ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 inline-block" aria-hidden="true" />
                          <span>Delivered</span>
                        </>
                      ) : (
                        `Stop 0${idx + 1}`
                      )}
                    </span>
                  </div>
                  <div className="font-serif-headline text-sm font-bold text-cream mt-1 truncate">
                    {st.name}
                  </div>
                  <div className="text-[11px] font-bubbly text-star-gold/90 font-semibold truncate">
                    {st.storySubtitle}
                  </div>
                  <div className="text-[10px] font-bubbly text-cream/70 mt-0.5 truncate">
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
