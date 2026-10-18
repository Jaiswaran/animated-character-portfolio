/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Moon,
  Play,
  RotateCw,
  Sparkles,
  Sun,
  Volume2,
  X,
  Maximize2,
  Minimize2,
  Layers,
  Send,
  Compass,
} from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { LullabyControls } from './LullabyLabSection';
import { MELODY_PATTERNS } from '../utils/audioSynthesizer';
import { GLOW_OPTIONS, GlowMode } from '../utils/nightlight';
import { DreamDeliverySection } from './DreamDeliverySection';
import { RattleBlockToys } from './RattleBlockToys';

type ProjectId = 'nightlight' | 'routes' | 'toys';

interface ProjectCase {
  id: ProjectId;
  number: string;
  label: string;
  title: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  capabilities: string[];
  accent: string;
  action: string;
}

const PROJECTS: ProjectCase[] = [
  {
    id: 'nightlight',
    number: '01',
    label: 'THE COMFORT ENGINE',
    title: 'Nightlight Collection',
    tagline: 'Make the dark feel kind.',
    description: 'A mood-responsive dream lantern with living colour, a softer night scene, and a real music-box soundscape.',
    challenge: 'Bedtime should feel safe, personal, and gently magical—not like switching off a room.',
    solution: 'Change the lantern’s colour and ambience, then tune a soft synthesized lullaby with a wind-up key.',
    capabilities: ['4 reactive light moods', 'Day / night scenes', 'Live Web Audio music box'],
    accent: '#d9c8ef',
    action: 'Enter the sanctuary',
  },
  {
    id: 'routes',
    number: '02',
    label: 'THE DREAM COURIER',
    title: 'Dream Delivery Routes',
    tagline: 'A star on a mission.',
    description: 'A tiny night courier flies across midnight rooftops and cloud spires to drop sweet dreams into warm chimneys.',
    challenge: 'A map is easier to love when you can fly through a living city, drop parcels, and see dreams come alive.',
    solution: 'Dispatch Pip to five cozy rooftops, trigger chimney parcel drops, and watch sweet dream bubbles float into the sky.',
    capabilities: ['5 interactive rooftops', 'Dynamic curved flight arcs', 'Chimney parcels & dream bubbles'],
    accent: '#f3cf75',
    action: 'Launch a dream',
  },
  {
    id: 'toys',
    number: '03',
    label: 'THE MIDNIGHT PLAYROOM',
    title: 'Rattle & Block Toys',
    tagline: 'Build a little impossible.',
    description: 'A tactile nursery playroom where visitors stack blocks, arrange shapes into towers, and shake chime rattles.',
    challenge: 'The best portfolio moments invite people to play, arrange real shapes, test stability, and build high.',
    solution: 'Arrange cubes, arches, steeples, and rattles across 5 building columns to build towers and test stability.',
    capabilities: ['8 tactile wooden shapes', '5-column stacking workbench', 'Stability test & chime rattles'],
    accent: '#f1c9d6',
    action: 'Build something lovely',
  },
];

interface ProjectShowcaseSectionProps {
  lullaby: LullabyControls;
  activeGlow: GlowMode;
  onSelectGlow: (glow: GlowMode) => void;
  deliveryStatus: string;
  onDeliveryStatusChange: (status: string) => void;
}

export const ProjectShowcaseSection: React.FC<ProjectShowcaseSectionProps> = ({
  lullaby,
  activeGlow,
  onSelectGlow,
  deliveryStatus,
  onDeliveryStatusChange,
}) => {
  const { play } = useSoundEffects();
  const [selectedProject, setSelectedProject] = useState<ProjectCase | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(true); // Default to full screen as requested
  const [isNightPreview, setIsNightPreview] = useState(true);

  // Toys summary state for the card
  const [toyStats, setToyStats] = useState({ height: 4, total: 8 });

  const handleToyHeightChange = React.useCallback((height: number, total: number) => {
    setToyStats((prev) => {
      if (prev.height === height && prev.total === total) return prev;
      return { height, total };
    });
  }, []);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const glow = GLOW_OPTIONS.find((item) => item.id === activeGlow) || GLOW_OPTIONS[0];
  const isLullabyAudible = lullaby.isPlaying && !lullaby.isMuted;

  // Keep the browser Back button and mobile back gesture in sync with the open invention.
  const openProject = (project: ProjectCase) => {
    play('button-click');
    setIsFullScreen(true);
    if (typeof window !== 'undefined') {
      const current = window.history.state;
      const safeState = current && typeof current === 'object' ? current : {};
      window.history.pushState(
        { ...safeState, pipInventionModal: project.id },
        '',
        window.location.href,
      );
    }
    setSelectedProject(project);
  };

  const closeProject = () => {
    play('button-click');
    if (typeof window !== 'undefined' && window.history.state?.pipInventionModal) {
      window.history.back();
      return;
    }
    setSelectedProject(null);
  };

  const toggleFullScreen = () => {
    play('button-click');
    setIsFullScreen((prev) => !prev);
  };

  const toggleLullaby = () => {
    play('button-click');
    if (isLullabyAudible) {
      lullaby.pause();
    } else {
      lullaby.setMuted(false);
      lullaby.play();
    }
  };

  const selectGlow = (mode: GlowMode) => {
    play('nightlight-change');
    onSelectGlow(mode);
  };

  // Keyboard navigation and backdrop lock
  useEffect(() => {
    if (!selectedProject) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handlePopState = (event: PopStateEvent) => {
      const projectId = event.state?.pipInventionModal as ProjectId | undefined;
      const project = PROJECTS.find((item) => item.id === projectId);
      if (project) {
        setIsFullScreen(true);
        setSelectedProject(project);
      } else {
        setSelectedProject(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeProject();
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
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selectedProject]);

  // Card Artwork 1: Nightlight
  const renderNightlightArtwork = (large = false) => (
    <div
      className={'ultimate-lantern-scene' + (large ? ' ultimate-art-large' : '') + (isNightPreview ? ' is-night' : ' is-day')}
      style={{
        '--project-glow': glow.hex,
        '--project-hue': ({ amber: '0deg', lavender: '245deg', blush: '320deg', starlight: '205deg' } as const)[glow.id],
      } as React.CSSProperties}
    >
      <div className="ultimate-lantern-halo ultimate-halo-one" aria-hidden="true" />
      <div className="ultimate-lantern-halo ultimate-halo-two" aria-hidden="true" />
      <span className="ultimate-lantern-moon" aria-hidden="true">{isNightPreview ? '☾' : '☼'}</span>
      <span className="ultimate-lantern-star ultimate-lantern-star-one" aria-hidden="true">✦</span>
      <span className="ultimate-lantern-star ultimate-lantern-star-two" aria-hidden="true">✧</span>
      <img
        src="/assets/pip_dream_lantern.png"
        loading="lazy"
        decoding="async"
        alt="Pip’s crescent moon dream lantern"
        className="ultimate-lantern-image"
        onError={(event) => { event.currentTarget.style.opacity = '0'; }}
      />
      <div className="ultimate-lantern-footer">
        <span className="ultimate-live-dot" />
        <span>{glow.name}</span>
        <span className="ultimate-lantern-divider">/</span>
        <span>{isNightPreview ? 'NIGHT GLOW' : 'DAYLIGHT'}</span>
      </div>
    </div>
  );

  // Card Artwork 2: Rooftop Map preview
  const renderRouteArtwork = () => (
    <div className="ultimate-route-art relative overflow-hidden flex flex-col justify-between p-3">
      <div className="ultimate-route-sky" aria-hidden="true">
        <span>✦</span><span>·</span><span>✧</span><span>·</span><span>✦</span><span>·</span><span>✧</span>
      </div>
      <div className="flex justify-between items-center text-[11px] font-bubbly font-bold text-cream/70 z-10 px-2 pt-1">
        <span>WHISPERING GABLE</span>
        <span>BEACON POINT</span>
        <span>CLOUD SPIRE</span>
      </div>
      <svg viewBox="0 0 520 200" className="w-full h-36" role="img" aria-label="Curved flight route across rooftops">
        <defs>
          <linearGradient id="card-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f1c9d6" />
            <stop offset="50%" stopColor="#f3cf75" />
            <stop offset="100%" stopColor="#d9c8ef" />
          </linearGradient>
        </defs>
        {/* Silhouette rooftops */}
        <polygon points="20,200 40,150 90,120 140,150 160,200" fill="#2d203f" />
        <polygon points="210,200 230,130 260,80 290,130 310,200" fill="#261b36" />
        <polygon points="380,200 400,140 440,90 480,140 500,200" fill="#2d2242" />

        {/* Flight path curve */}
        <path
          d="M 90 120 C 170 30, 200 50, 260 80 C 320 110, 390 40, 440 90"
          fill="none"
          stroke="url(#card-route-grad)"
          strokeWidth="3.5"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />

        {/* Delivery waypoints */}
        {[
          { x: 90, y: 120, label: '🐰' },
          { x: 260, y: 80, label: '🕰️' },
          { x: 440, y: 90, label: '⛵' },
        ].map((pt, idx) => (
          <g key={idx} transform={`translate(${pt.x}, ${pt.y})`}>
            <circle r="14" fill="#f3cf75" opacity="0.2" className="animate-ping" />
            <circle r="8" fill="#a34063" stroke="#fff8f1" strokeWidth="2" />
            <text x="0" y="-12" textAnchor="middle" fontSize="11" fill="#fff">
              {pt.label}
            </text>
          </g>
        ))}

        {/* Flying Pip avatar preview */}
        <g transform="translate(260, 50)" className="animate-bounce">
          <circle r="12" fill="#f3cf75" opacity="0.3" />
          <image
            href="/assets/pip_avatar_cloud.png"
            x="-18"
            y="-18"
            width="36"
            height="36"
          />
        </g>
      </svg>
      <div className="ultimate-flight-status z-10 flex items-center justify-between text-xs px-2 pb-1 font-bubbly">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <span className="ultimate-live-dot" />
          ROOFTOP COURIER ACTIVE
        </span>
        <span className="text-cream/70 text-[11px]">Click to open full map →</span>
      </div>
    </div>
  );

  return (
    <section
      id="projects"
      className="ultimate-showcase relative overflow-hidden"
      aria-labelledby="ultimate-showcase-title"
      data-project-showcase="true"
    >
      <div className="ultimate-background-glow ultimate-background-glow-left" aria-hidden="true" />
      <div className="ultimate-background-glow ultimate-background-glow-right" aria-hidden="true" />
      <div className="ultimate-showcase-inner">
        <header className="ultimate-showcase-heading text-center">
          <div className="ultimate-eyebrow inline-flex items-center">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>PIP’S MIDNIGHT OBSERVATORY</span>
            <span className="ultimate-eyebrow-separator">✦</span>
            <span>THREE INTERACTIVE INVENTIONS</span>
          </div>
          <h2 id="ultimate-showcase-title" className="ultimate-showcase-title">
            Tiny inventions.<br /><span>Huge dreams.</span>
          </h2>
          <p className="ultimate-showcase-subtitle">
            Click any invention to step inside in full screen. Stack towers, dispatch midnight dreams, and wind the lullaby engine.
          </p>
        </header>

        {/* 3-Column Showcase Grid */}
        <div className="ultimate-project-grid">
          {PROJECTS.map((project, index) => (
            <article
              key={project.id}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('button, a, input, select, textarea, [role="button"]')) return;
                openProject(project);
              }}
              className={'ultimate-project-card ultimate-project-' + project.id + ' group'}
              style={{ '--project-accent': project.accent, animationDelay: (index * 120) + 'ms' } as React.CSSProperties}
              data-project-card="true"
              aria-label={'Open ' + project.title + ' in full screen'}
            >
              <div className="ultimate-project-meta">
                <span className="ultimate-project-number">{project.number}<i> / 03</i></span>
                <span className="ultimate-project-class">{project.label}</span>
              </div>

              {/* Visual Card Artwork */}
              <div
                className="ultimate-project-visual"
                onClick={(e) => {
                  // Prevent nested button clicks inside controls from propagating to openProject if user interacted with quick buttons
                  if ((e.target as HTMLElement).closest('button')) {
                    e.stopPropagation();
                  }
                }}
              >
                {project.id === 'nightlight' && (
                  <>
                    {renderNightlightArtwork()}
                    <div className="ultimate-art-controls ultimate-light-controls">
                      <div className="ultimate-daynight-switch" role="group" aria-label="Preview lighting">
                        <button type="button" onClick={() => setIsNightPreview(false)} aria-pressed={!isNightPreview} className={!isNightPreview ? 'is-active' : ''}><Sun className="h-3.5 w-3.5" /> Day</button>
                        <button type="button" onClick={() => setIsNightPreview(true)} aria-pressed={isNightPreview} className={isNightPreview ? 'is-active' : ''}><Moon className="h-3.5 w-3.5" /> Night</button>
                      </div>
                      <div className="ultimate-color-swatches" role="group" aria-label="Choose lantern glow">
                        {GLOW_OPTIONS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            title={item.name}
                            aria-label={'Choose ' + item.name}
                            aria-pressed={activeGlow === item.id}
                            className={'ultimate-color-swatch' + (activeGlow === item.id ? ' is-selected' : '')}
                            style={{ backgroundColor: item.hex }}
                            onClick={() => selectGlow(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {project.id === 'routes' && renderRouteArtwork()}

                {project.id === 'toys' && (
                  <div className="p-2">
                    <RattleBlockToys
                      compact={true}
                      onHeightChange={handleToyHeightChange}
                    />
                  </div>
                )}
              </div>

              {/* Copy */}
              <div className="ultimate-project-copy">
                <div className="ultimate-project-title-row">
                  <span className="ultimate-project-glyph" aria-hidden="true">
                    {project.id === 'nightlight' ? '☾' : project.id === 'routes' ? '✦' : '▧'}
                  </span>
                  <h3 id={'ultimate-project-title-' + project.id}>{project.title}</h3>
                  <span className="ultimate-project-arrow group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" aria-hidden="true">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
                <p className="ultimate-project-tagline">{project.tagline}</p>
                <p className="ultimate-project-description">{project.description}</p>
                <div className="ultimate-capability-list">
                  {project.capabilities.map((capability) => (
                    <span key={capability}>
                      <Check className="h-3.5 w-3.5 text-rich-berry dark:text-star-gold" />
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer with Full Screen Trigger */}
              <div className="ultimate-project-footer">
                <span className="ultimate-project-live">
                  <i />
                  {project.id === 'nightlight'
                    ? glow.name
                    : project.id === 'routes'
                    ? (deliveryStatus === 'dispatching' ? 'IN FLIGHT' : 'ROOFTOPS CLEAR')
                    : `${toyStats.height} Stories High`}
                </span>
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  className="ultimate-project-cta group-hover:scale-102 transition-transform"
                  aria-label={project.action + ' in full screen'}
                >
                  <span>{project.action} (Full Screen)</span>
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="ultimate-showcase-signoff">
          <span aria-hidden="true">✦</span>
          <p>Click any invention above to open in the full screen experience.</p>
          <span aria-hidden="true">✦</span>
        </div>
      </div>

      {/* FULL-SCREEN DEDICATED INVENTION MODAL */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto overflow-x-hidden overscroll-contain"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeProject();
          }}
        >
          <section
            ref={modalRef}
            onClick={(event) => {
              // The default dialog is full-screen, so its empty surface acts as the backdrop.
              if (event.target === event.currentTarget) closeProject();
            }}
            className={`pip-project-dialog relative bg-cream dark:bg-[#1a1226] text-warm-brown dark:text-cream shadow-2xl transition-all duration-300 flex flex-col ${
              isFullScreen
                ? 'fixed inset-0 w-full max-w-full h-[100dvh] rounded-none z-50 p-3 sm:p-8 overflow-y-auto'
                : 'w-full max-w-5xl max-h-[92dvh] rounded-3xl p-4 sm:p-8 overflow-y-auto border-3 border-rich-berry/30 dark:border-star-gold/25'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ultimate-modal-title"
            aria-describedby="ultimate-modal-description"
            style={{ '--project-accent': selectedProject.accent } as React.CSSProperties}
          >
            {/* Top Modal Navigation Header */}
            <header className="pip-project-dialog-header flex items-center justify-between border-b border-rich-berry/15 dark:border-white/10 pb-4 mb-6">
              <div className="pip-project-dialog-brand flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-soft-blush dark:bg-plum border border-rich-berry/20 text-xs font-bubbly font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold">
                  INVENTION {selectedProject.number} · {selectedProject.label}
                </span>
                <h2 id="ultimate-modal-title" className="font-serif-headline text-xl sm:text-3xl font-bold text-plum dark:text-cream break-words">
                  {selectedProject.title}
                </h2>
              </div>

              {/* Action Buttons: Fullscreen Toggle & Close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeProject}
                  className="min-h-11 px-3 py-2.5 rounded-xl border border-rich-berry/20 dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-rich-berry/10 dark:hover:bg-white/20 text-plum dark:text-cream transition-all shadow-sm inline-flex items-center gap-1.5"
                  title="Back to inventions"
                  aria-label="Back to inventions"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs font-bold">Back</span>
                </button>
                <button
                  type="button"
                  onClick={toggleFullScreen}
                  className="min-h-11 min-w-11 p-2.5 rounded-xl border border-rich-berry/20 dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-rich-berry/10 dark:hover:bg-white/20 text-plum dark:text-cream transition-all shadow-sm"
                  title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                  aria-label={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                  {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeProject}
                  className="min-h-11 min-w-11 p-2.5 rounded-xl border border-rich-berry/20 dark:border-white/15 bg-rich-berry text-white hover:bg-rich-berry/90 transition-all shadow-sm"
                  title="Close Invention (Esc)"
                  aria-label="Close project"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Modal Body Based on Project */}
            <div className="flex-1 w-full space-y-6">
              {/* Description */}
              <p id="ultimate-modal-description" className="text-base sm:text-lg font-bubbly text-warm-brown/80 dark:text-cream/80 max-w-3xl">
                {selectedProject.description}
              </p>

              {/* PROJECT A: NIGHTLIGHT COLLECTION */}
              {selectedProject.id === 'nightlight' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7">
                      {renderNightlightArtwork(true)}
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                      {/* Light Engine Controls */}
                      <div className="bg-soft-blush/40 dark:bg-plum/40 border border-rich-berry/15 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold font-bubbly">
                              LIGHT ENGINE
                            </span>
                            <h3 className="font-serif-headline text-lg font-bold text-plum dark:text-cream">
                              Set Lantern Glow
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                          </span>
                        </div>

                        {/* Mood selector buttons */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {GLOW_OPTIONS.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => selectGlow(item.id)}
                              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                                activeGlow === item.id
                                  ? 'border-rich-berry dark:border-star-gold bg-white dark:bg-plum-dark shadow-md font-bold'
                                  : 'border-rich-berry/10 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full shadow-inner flex-shrink-0" style={{ backgroundColor: item.hex }} />
                              <div className="truncate">
                                <b className="text-xs block text-plum dark:text-cream">{item.name}</b>
                                <small className="text-[10px] text-warm-brown/70 dark:text-cream/60">{item.subtitle}</small>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Day / Night preview */}
                        <div className="flex gap-2 pt-2 border-t border-rich-berry/10 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => setIsNightPreview(false)}
                            className={`flex-1 py-2 px-3 rounded-xl font-bubbly text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              !isNightPreview ? 'bg-amber-100 text-warm-brown border border-amber-300' : 'bg-white/20'
                            }`}
                          >
                            <Sun className="h-4 w-4 text-amber-500" /> Day Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsNightPreview(true)}
                            className={`flex-1 py-2 px-3 rounded-xl font-bubbly text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isNightPreview ? 'bg-plum text-cream border border-star-gold' : 'bg-white/20'
                            }`}
                          >
                            <Moon className="h-4 w-4 text-star-gold" /> Night Preview
                          </button>
                        </div>
                      </div>

                      {/* Music Box Synthesizer */}
                      <div className="bg-soft-blush/40 dark:bg-plum/40 border border-rich-berry/15 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-rich-berry dark:text-star-gold font-bubbly">
                              SOUND DESIGN
                            </span>
                            <h3 className="font-serif-headline text-lg font-bold text-plum dark:text-cream">
                              Live Music Box
                            </h3>
                          </div>
                          <Volume2 className="h-5 w-5 text-rich-berry dark:text-star-gold" />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {MELODY_PATTERNS.map((pattern, idx) => (
                            <button
                              key={pattern.id}
                              type="button"
                              onClick={() => {
                                play('tune-select');
                                lullaby.setPattern(idx);
                              }}
                              className={`p-2 rounded-xl border text-xs font-bubbly font-bold truncate transition-all ${
                                lullaby.activePatternIndex === idx
                                  ? 'bg-rich-berry text-white border-rich-berry'
                                  : 'bg-white/60 dark:bg-white/10 text-plum dark:text-cream border-rich-berry/15'
                              }`}
                            >
                              {pattern.name}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={toggleLullaby}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-star-gold hover:bg-amber-300 text-warm-brown font-bubbly font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                          >
                            {isLullabyAudible ? 'Pause Lullaby' : <><Play className="h-4 w-4 fill-current" /> Play Lullaby</>}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              play('wind-key');
                              lullaby.windUp(25);
                            }}
                            className="py-2.5 px-3 rounded-xl border border-rich-berry/20 bg-cream dark:bg-plum-dark text-plum dark:text-cream font-bubbly font-bold text-xs flex items-center gap-1.5"
                          >
                            <RotateCw className="h-4 w-4" /> Wind +25%
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invention Story Footnotes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-rich-berry/15 dark:border-white/10">
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border-l-4 border-rich-berry">
                      <span className="text-xs font-bold text-rich-berry dark:text-star-gold uppercase tracking-wider">
                        THE IDEA
                      </span>
                      <p className="text-sm font-bubbly mt-1 text-warm-brown/80 dark:text-cream/80">
                        {selectedProject.challenge}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border-l-4 border-star-gold">
                      <span className="text-xs font-bold text-rich-berry dark:text-star-gold uppercase tracking-wider">
                        THE MAGIC
                      </span>
                      <p className="text-sm font-bubbly mt-1 text-warm-brown/80 dark:text-cream/80">
                        {selectedProject.solution}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROJECT B: DREAM DELIVERY ROUTES */}
              {selectedProject.id === 'routes' && (
                <div className="space-y-6">
                  {/* Reconstructed Panoramic Rooftop Map Component */}
                  <DreamDeliverySection compact={false} onStatusChange={onDeliveryStatusChange} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-rich-berry/15 dark:border-white/10">
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border-l-4 border-rich-berry">
                      <span className="text-xs font-bold text-rich-berry dark:text-star-gold uppercase tracking-wider">
                        THE CONCEPT
                      </span>
                      <p className="text-sm font-bubbly mt-1 text-warm-brown/80 dark:text-cream/80">
                        Pip uses an interactive celestial dispatch map to fly across midnight rooftops, delivering custom dreams to sleeping children through cozy chimneys.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border-l-4 border-star-gold">
                      <span className="text-xs font-bold text-rich-berry dark:text-star-gold uppercase tracking-wider">
                        HOW TO FLY
                      </span>
                      <p className="text-sm font-bubbly mt-1 text-warm-brown/80 dark:text-cream/80">
                        Click on any house or rooftop station to calculate a smooth curved trajectory for Pip, drop a golden dream parcel into the chimney, and watch the dream bubble unfold!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROJECT C: RATTLE & BLOCK TOYS */}
              {selectedProject.id === 'toys' && (
                <div className="space-y-6">
                  {/* Full Interactive Rattle & Block Toys Workbench */}
                  <RattleBlockToys compact={false} onHeightChange={handleToyHeightChange} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-rich-berry/15 dark:border-white/10">
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border-l-4 border-rich-berry">
                      <span className="text-xs font-bold text-rich-berry dark:text-star-gold uppercase tracking-wider">
                        TACTILE BUILDING
                      </span>
                      <p className="text-sm font-bubbly mt-1 text-warm-brown/80 dark:text-cream/80">
                        Choose wooden shapes from the tray—alphabet cubes, Roman arches, spires, and chime rattles. Drop them into any column to arrange towers or castles of your own design.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border-l-4 border-star-gold">
                      <span className="text-xs font-bold text-rich-berry dark:text-star-gold uppercase tracking-wider">
                        PLAYFUL FEEDBACK
                      </span>
                      <p className="text-sm font-bubbly mt-1 text-warm-brown/80 dark:text-cream/80">
                        Click the rattles to shake them with gentle sound and sparkles, test the tower's balance with spring physics, or load classic blueprints to inspire your creations!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
};
