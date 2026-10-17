/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Moon,
  Play,
  RotateCw,
  Send,
  Sparkles,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { LullabyControls } from './LullabyLabSection';
import { GLOW_OPTIONS, GlowMode } from '../utils/nightlight';
import { DELIVERY_WAYPOINTS } from '../utils/delivery';

type CaseId = 'nightlight' | 'routes' | 'toys';
type CaseFilter = 'all' | 'comfort' | 'journeys' | 'playroom';

interface CaseStudy {
  id: CaseId;
  number: string;
  category: Exclude<CaseFilter, 'all'>;
  classification: string;
  title: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  details: string[];
  accent: string;
  cta: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'nightlight',
    number: '01',
    category: 'comfort',
    classification: 'AMBIENT COMFORT',
    title: 'Nightlight Collection',
    tagline: 'A little light. A much softer night.',
    description: 'A mood-responsive dream lantern that turns a bedtime routine into a tiny, calming ritual.',
    challenge: 'Dark rooms can feel intimidating when it is time to sleep.',
    solution: 'A live glow palette and day/night previews let the room shift from cosy sunset to quiet starlight.',
    details: ['4 live colour moods', 'Day / night ambience', 'Shared state with the full sanctuary'],
    accent: '#d9c8ef',
    cta: 'Explore the collection',
  },
  {
    id: 'routes',
    number: '02',
    category: 'journeys',
    classification: 'STORY-DRIVEN MOTION',
    title: 'Dream Delivery Routes',
    tagline: 'Every dream deserves a safe landing.',
    description: 'A star-powered courier route where destinations, progress, and dispatch states feel alive.',
    challenge: 'A route map should feel like a journey, not a static diagram.',
    solution: 'A curved SVG flight path, named dream ports, clear dispatch feedback, and reduced-motion support create a readable little story.',
    details: ['3 illustrated destinations', 'Live dispatch integration', 'Smooth path animation'],
    accent: '#f3cf75',
    cta: 'Explore the route',
  },
  {
    id: 'toys',
    number: '03',
    category: 'playroom',
    classification: 'PLAYFUL INTERACTION',
    title: 'Rattle & Block Toys',
    tagline: 'Small blocks. Big midnight ideas.',
    description: 'A tiny playroom where every click adds a piece, changes the palette, and builds a new bedtime toy.',
    challenge: 'A showcase should reward curiosity instead of asking visitors to only look.',
    solution: 'A hands-on block builder gives visitors a simple, immediate interaction with satisfying visual feedback.',
    details: ['Live block stacking', 'Three colour palettes', 'Reset and rebuild controls'],
    accent: '#f1c9d6',
    cta: 'Build with Pip',
  },
];

const FILTERS: Array<{ id: CaseFilter; label: string }> = [
  { id: 'all', label: 'All case files' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'journeys', label: 'Journeys' },
  { id: 'playroom', label: 'Playroom' },
];

const TOY_PALETTES = [
  ['#a34063', '#f3cf75', '#d9c8ef', '#7aa2f7', '#f1c9d6', '#a8d5ba'],
  ['#635b9a', '#a7c7e7', '#f4d58d', '#e8a4a4', '#9fc9b6', '#fff8f1'],
  ['#f3cf75', '#e89ba7', '#a7c7e7', '#b7a0d8', '#9fc9b6', '#fff8f1'],
];

interface ProjectShowcaseSectionProps {
  lullaby: LullabyControls;
  activeGlow: GlowMode;
  onSelectGlow: (glow: GlowMode) => void;
  onQuickDispatch: () => void;
  deliveryStatus: string;
}

export const ProjectShowcaseSection: React.FC<ProjectShowcaseSectionProps> = ({
  lullaby,
  activeGlow,
  onSelectGlow,
  onQuickDispatch,
  deliveryStatus,
}) => {
  const { play } = useSoundEffects();
  const [activeFilter, setActiveFilter] = useState<CaseFilter>('all');
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [isNightPreview, setIsNightPreview] = useState(true);
  const [blockCount, setBlockCount] = useState(3);
  const [toyPaletteIndex, setToyPaletteIndex] = useState(0);
  const [activeWaypoint, setActiveWaypoint] = useState(0);
  const [dispatchQueued, setDispatchQueued] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentGlow = GLOW_OPTIONS.find((glow) => glow.id === activeGlow) || GLOW_OPTIONS[0];
  const visibleCases = CASE_STUDIES.filter((item) => activeFilter === 'all' || item.category === activeFilter);
  const isLullabyAudible = lullaby.isPlaying && !lullaby.isMuted;

  const closeCase = () => setSelectedCase(null);

  const toggleSoundscape = () => {
    play('button-click');
    if (isLullabyAudible) {
      lullaby.pause();
    } else {
      lullaby.setMuted(false);
      lullaby.play();
    }
  };

  const chooseGlow = (glowId: GlowMode) => {
    play('nightlight-change');
    onSelectGlow(glowId);
  };

  const launchDispatch = () => {
    if (deliveryStatus === 'dispatching') return;
    play('dream-dispatch');
    onQuickDispatch();
    setDispatchQueued(true);
  };

  const addBlock = () => {
    play('button-click');
    setBlockCount((count) => Math.min(6, count + 1));
  };

  useEffect(() => {
    if (!selectedCase) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedCase(null);
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
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
      previousFocus?.focus();
    };
  }, [selectedCase]);

  const renderNightlightArtwork = (large = false) => (
    <div
      className={'case-night-scene ' + (large ? 'case-night-scene-large' : '') + (isNightPreview ? ' is-night' : ' is-day')}
      style={{ '--case-glow': currentGlow.hex } as React.CSSProperties}
    >
      <span className="case-scene-orb case-orb-one" aria-hidden="true" />
      <span className="case-scene-orb case-orb-two" aria-hidden="true" />
      <span className="case-scene-moon" aria-hidden="true">{isNightPreview ? '☾' : '☼'}</span>
      <img
        src="/assets/pip_dream_lantern.png"
        alt="Pip's crescent moon dream lantern"
        className="case-lantern-art"
        onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
      />
      <span className="case-scene-caption">{isNightPreview ? 'NIGHT MODE · SOFT GLOW' : 'DAY MODE · WARM LIGHT'}</span>
    </div>
  );

  const renderRouteArtwork = (large = false) => (
    <div className={'case-route-scene ' + (large ? 'case-route-scene-large' : '')}>
      <div className="case-route-stars" aria-hidden="true">✦　·　✧　·　✦　·　✧</div>
      <svg viewBox="0 0 520 220" role="img" aria-label="A curved starlight path joining three dream destinations">
        <defs>
          <linearGradient id={large ? 'route-gradient-large' : 'route-gradient'} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f1c9d6" />
            <stop offset="50%" stopColor="#d9c8ef" />
            <stop offset="100%" stopColor="#f3cf75" />
          </linearGradient>
        </defs>
        <path d="M45 155 C105 30 170 45 235 115 S360 195 475 55" fill="none" stroke="rgba(255,248,241,.13)" strokeWidth="13" strokeLinecap="round" />
        <path className="case-route-path" d="M45 155 C105 30 170 45 235 115 S360 195 475 55" fill="none" stroke={'url(#' + (large ? 'route-gradient-large' : 'route-gradient') + ')'} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="8 11" />
        {[{x:45,y:155},{x:235,y:115},{x:475,y:55}].map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r={activeWaypoint === index ? 19 : 13} fill={index === 0 ? '#a34063' : index === 1 ? '#7aa2f7' : '#f3cf75'} opacity={activeWaypoint === index ? 0.3 : 0.15} />
            <circle cx={point.x} cy={point.y} r="7" fill={index === 0 ? '#f1c9d6' : index === 1 ? '#d9c8ef' : '#f3cf75'} stroke="#fff8f1" strokeWidth="2" />
            <text x={point.x} y={point.y + 31} fill="#fff8f1" fontSize="11" textAnchor="middle">{['ATTIC', 'NURSERY', 'CLOUD SPIRE'][index]}</text>
          </g>
        ))}
        <g className="case-route-star">
          <path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z" fill="#f3cf75" />
        </g>
      </svg>
      <span className="case-route-caption">3 DREAM PORTS · 1 VERY DEDICATED STAR</span>
    </div>
  );

  const renderToyArtwork = (large = false) => {
    const colors = TOY_PALETTES[toyPaletteIndex];
    return (
      <div className={'case-toy-scene ' + (large ? 'case-toy-scene-large' : '')}>
        <div className="case-toy-sticker">PIP'S PLAYROOM</div>
        <div className="case-toy-sparkle" aria-hidden="true">✦</div>
        <div className="case-toy-tower" aria-label={blockCount + ' blocks in the current tower'}>
          {Array.from({ length: blockCount }, (_, index) => {
            const blockIndex = blockCount - 1 - index;
            return (
              <span
                key={blockIndex}
                className={'case-toy-block case-toy-block-' + (blockIndex % 3)}
                style={{ backgroundColor: colors[blockIndex % colors.length], animationDelay: (blockIndex * 55) + 'ms' }}
              >
                {blockIndex === 0 ? '✦' : blockIndex % 2 === 0 ? '☾' : '•'}
              </span>
            );
          })}
        </div>
        <div className="case-toy-floor" />
        <span className="case-toy-counter">{blockCount} / 6 BLOCKS BUILT</span>
      </div>
    );
  };

  return (
    <section
      id="projects"
      className="case-showcase-section relative overflow-hidden py-20 md:py-28"
      aria-labelledby="case-showcase-title"
      data-project-showcase="true"
    >
      <div className="case-showcase-orbit case-orbit-left" aria-hidden="true" />
      <div className="case-showcase-orbit case-orbit-right" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="case-showcase-heading mx-auto mb-10 max-w-4xl text-center md:mb-14">
          <div className="case-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>PIP'S MIDNIGHT OBSERVATORY</span>
            <span className="case-eyebrow-dot" aria-hidden="true">✦</span>
            <span>INTERACTIVE CASE FILES</span>
          </div>
          <h2 id="case-showcase-title" className="case-showcase-title">
            Tiny inventions. <span>Huge dreams.</span>
          </h2>
          <p className="case-showcase-intro">
            Three little worlds from Pip's workshop. Explore the thinking behind each invention, change the controls, and see what happens.
          </p>
          <div className="case-heading-footer">
            <div className="case-filter-row" role="group" aria-label="Filter case studies">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    play('button-click');
                    setActiveFilter(filter.id);
                  }}
                  aria-pressed={activeFilter === filter.id}
                  className={'case-filter-chip' + (activeFilter === filter.id ? ' is-active' : '')}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleSoundscape}
              className="case-sound-toggle"
              aria-pressed={isLullabyAudible}
              aria-label={isLullabyAudible ? 'Pause the observatory lullaby' : 'Play the observatory lullaby'}
            >
              <span className={'case-sound-indicator' + (isLullabyAudible ? ' is-playing' : '')} aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              <span>{isLullabyAudible ? 'Soundscape on' : 'Try the soundscape'}</span>
              {isLullabyAudible ? <Volume2 className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="case-study-grid">
          {visibleCases.map((item, index) => (
            <article
              key={item.id}
              className="case-study-card"
              data-project-card="true"
              style={{ animationDelay: (index * 110) + 'ms', '--case-accent': item.accent } as React.CSSProperties}
            >
              <div className="case-card-topline">
                <span className="case-number">{item.number} <span aria-hidden="true">/</span> 03</span>
                <span className="case-classification">{item.classification}</span>
              </div>

              <div className="case-art-frame">
                {item.id === 'nightlight' && (
                  <>
                    {renderNightlightArtwork()}
                    <div className="case-glow-swatches" role="group" aria-label="Change nightlight colour">
                      {GLOW_OPTIONS.map((glow) => (
                        <button
                          key={glow.id}
                          type="button"
                          className={'case-glow-swatch' + (activeGlow === glow.id ? ' is-selected' : '')}
                          style={{ backgroundColor: glow.hex }}
                          aria-label={'Choose ' + glow.name}
                          aria-pressed={activeGlow === glow.id}
                          title={glow.name}
                          onClick={() => chooseGlow(glow.id)}
                        />
                      ))}
                    </div>
                  </>
                )}
                {item.id === 'routes' && (
                  <>
                    {renderRouteArtwork()}
                    <div className="case-route-status">
                      <span className={'case-status-dot' + (deliveryStatus === 'dispatching' ? ' is-moving' : '')} />
                      <span>{deliveryStatus === 'dispatching' ? 'STAR COURIER IN FLIGHT' : deliveryStatus === 'delivered' ? 'DREAM DELIVERED' : 'ALL DREAM PORTS READY'}</span>
                    </div>
                  </>
                )}
                {item.id === 'toys' && (
                  <>
                    {renderToyArtwork()}
                    <button
                      type="button"
                      className="case-toy-quick-add"
                      onClick={addBlock}
                      disabled={blockCount >= 6}
                      aria-label="Add a block to the preview tower"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {blockCount >= 6 ? 'Tower complete' : 'Add a block'}
                    </button>
                  </>
                )}
              </div>

              <div className="case-card-copy">
                <div className="case-title-row">
                  <span className="case-category-marker" aria-hidden="true">{item.id === 'nightlight' ? '☾' : item.id === 'routes' ? '✧' : '▦'}</span>
                  <h3>{item.title}</h3>
                </div>
                <p className="case-tagline">{item.tagline}</p>
                <p className="case-description">{item.description}</p>

                <div className="case-card-tags">
                  {item.details.slice(0, 2).map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              </div>

              <div className="case-card-footer">
                <span className="case-footer-note">
                  {item.id === 'nightlight' ? currentGlow.name : item.id === 'routes' ? DELIVERY_WAYPOINTS.length + ' magical stops' : 'Your build: ' + blockCount + ' blocks'}
                </span>
                <button
                  type="button"
                  className="case-open-button"
                  onClick={() => {
                    play('button-click');
                    setSelectedCase(item);
                    setDispatchQueued(false);
                  }}
                  aria-haspopup="dialog"
                  aria-label={'Open case study: ' + item.title}
                >
                  <span>{item.cta}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="case-showcase-bottom">
          <div className="case-bottom-star" aria-hidden="true">✦</div>
          <p>Made with moonlight, a little mischief, and an unreasonable number of tiny details.</p>
          <a href="#origin" onClick={() => play('nav-click')}>
            Meet the dreamer behind it <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      {selectedCase && (
        <div
          className="case-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCase();
          }}
        >
          <div
            ref={modalRef}
            className="case-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-dialog-title"
            aria-describedby="case-dialog-description"
            style={{ '--case-accent': selectedCase.accent } as React.CSSProperties}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="case-modal-close"
              onClick={closeCase}
              aria-label="Close case study"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="case-modal-scroll">
              <div className="case-modal-header">
                <span className="case-modal-kicker">CASE FILE {selectedCase.number} · {selectedCase.classification}</span>
                <h2 id="case-dialog-title">{selectedCase.title}</h2>
                <p id="case-dialog-description">{selectedCase.description}</p>
              </div>

              {selectedCase.id === 'nightlight' && (
                <div className="case-modal-content">
                  {renderNightlightArtwork(true)}
                  <div className="case-control-card">
                    <div className="case-control-heading">
                      <div>
                        <span className="case-control-label">LIVE CONTROL</span>
                        <h3>Choose the night's colour</h3>
                      </div>
                      <span className="case-live-pill"><span /> LIVE</span>
                    </div>
                    <div className="case-modal-glow-grid">
                      {GLOW_OPTIONS.map((glow) => (
                        <button
                          key={glow.id}
                          type="button"
                          className={'case-modal-glow-option' + (activeGlow === glow.id ? ' is-selected' : '')}
                          onClick={() => chooseGlow(glow.id)}
                          aria-pressed={activeGlow === glow.id}
                        >
                          <span className="case-modal-glow-dot" style={{ backgroundColor: glow.hex }} />
                          <span><b>{glow.name}</b><small>{glow.subtitle}</small></span>
                          {activeGlow === glow.id && <Check className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                    <div className="case-day-night-toggle" role="group" aria-label="Preview lighting">
                      <button type="button" className={!isNightPreview ? 'is-selected' : ''} aria-pressed={!isNightPreview} onClick={() => setIsNightPreview(false)}>
                        <Sun className="h-4 w-4" /> Day preview
                      </button>
                      <button type="button" className={isNightPreview ? 'is-selected' : ''} aria-pressed={isNightPreview} onClick={() => setIsNightPreview(true)}>
                        <Moon className="h-4 w-4" /> Night preview
                      </button>
                    </div>
                  </div>
                  <div className="case-story-grid">
                    <div><span>THE CHALLENGE</span><p>{selectedCase.challenge}</p></div>
                    <div><span>THE SOLUTION</span><p>{selectedCase.solution}</p></div>
                  </div>
                  <a className="case-modal-primary" href="#nightlight" onClick={() => { play('nav-click'); closeCase(); }}>
                    Open the full Nightlight Sanctuary <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}

              {selectedCase.id === 'routes' && (
                <div className="case-modal-content">
                  {renderRouteArtwork(true)}
                  <div className="case-control-card">
                    <div className="case-control-heading">
                      <div>
                        <span className="case-control-label">ROUTE INTEL</span>
                        <h3>{DELIVERY_WAYPOINTS[activeWaypoint].name}</h3>
                      </div>
                      <span className="case-waypoint-emoji">{DELIVERY_WAYPOINTS[activeWaypoint].emoji}</span>
                    </div>
                    <p className="case-waypoint-tagline">{DELIVERY_WAYPOINTS[activeWaypoint].tagline} <span>·</span> {DELIVERY_WAYPOINTS[activeWaypoint].time}</p>
                    <div className="case-waypoint-picker" role="group" aria-label="Explore dream destinations">
                      {DELIVERY_WAYPOINTS.map((waypoint, index) => (
                        <button
                          key={waypoint.id}
                          type="button"
                          onClick={() => { setActiveWaypoint(index); setDispatchQueued(false); }}
                          className={activeWaypoint === index ? 'is-selected' : ''}
                          aria-pressed={activeWaypoint === index}
                        >
                          <span>{waypoint.emoji}</span><b>{waypoint.name}</b><small>Port 0{index + 1}</small>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="case-modal-primary case-dispatch-button"
                      onClick={launchDispatch}
                      disabled={deliveryStatus === 'dispatching'}
                    >
                      <Send className="h-4 w-4" />
                      {deliveryStatus === 'dispatching' ? 'Star courier is in flight…' : 'Dispatch the next dream'}
                    </button>
                    {dispatchQueued && <p className="case-inline-confirmation" role="status"><Check className="h-4 w-4" /> Dispatch started. Follow the live route below.</p>}
                  </div>
                  <div className="case-story-grid">
                    <div><span>THE CHALLENGE</span><p>{selectedCase.challenge}</p></div>
                    <div><span>THE SOLUTION</span><p>{selectedCase.solution}</p></div>
                  </div>
                  <a className="case-modal-secondary" href="#map" onClick={() => { play('nav-click'); closeCase(); }}>
                    Watch the full live route map <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}

              {selectedCase.id === 'toys' && (
                <div className="case-modal-content">
                  {renderToyArtwork(true)}
                  <div className="case-control-card">
                    <div className="case-control-heading">
                      <div>
                        <span className="case-control-label">BUILD STATION</span>
                        <h3>Your tiny tower</h3>
                      </div>
                      <span className="case-build-count">{blockCount} / 6</span>
                    </div>
                    <p className="case-waypoint-tagline">Stack a new piece or switch the toy's colour story.</p>
                    <div className="case-build-actions">
                      <button type="button" className="case-build-add" onClick={addBlock} disabled={blockCount >= 6}>
                        <Sparkles className="h-4 w-4" /> {blockCount >= 6 ? 'Tower complete!' : 'Add a block'}
                      </button>
                      <button
                        type="button"
                        className="case-build-reset"
                        onClick={() => { play('button-click'); setBlockCount(3); }}
                      >
                        <RotateCw className="h-4 w-4" /> Rebuild
                      </button>
                    </div>
                    <div className="case-palette-picker" role="group" aria-label="Choose toy colour palette">
                      {TOY_PALETTES.map((palette, index) => (
                        <button
                          key={index}
                          type="button"
                          className={'case-palette-option' + (toyPaletteIndex === index ? ' is-selected' : '')}
                          onClick={() => { play('button-click'); setToyPaletteIndex(index); }}
                          aria-pressed={toyPaletteIndex === index}
                          aria-label={'Choose palette ' + (index + 1)}
                        >
                          {palette.slice(0, 4).map((color) => <span key={color} style={{ backgroundColor: color }} />)}
                        </button>
                      ))}
                    </div>
                    <div className="case-build-progress" role="progressbar" aria-label="Tower build progress" aria-valuemin={0} aria-valuemax={6} aria-valuenow={blockCount}>
                      <span style={{ width: ((blockCount / 6) * 100) + '%' }} />
                    </div>
                    <p className="case-inline-confirmation" role="status"><Check className="h-4 w-4" /> {blockCount === 6 ? 'Perfect tower! Pip approves.' : 'Looking good — ' + (6 - blockCount) + ' block' + (6 - blockCount === 1 ? '' : 's') + ' left until the tower is complete.'}</p>
                  </div>
                  <div className="case-story-grid">
                    <div><span>THE CHALLENGE</span><p>{selectedCase.challenge}</p></div>
                    <div><span>THE SOLUTION</span><p>{selectedCase.solution}</p></div>
                  </div>
                  <button type="button" className="case-modal-secondary case-modal-full-button" onClick={closeCase}>
                    Keep this build and return to the case files <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
