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
  Sparkles,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { LullabyControls } from './LullabyLabSection';
import { MELODY_PATTERNS } from '../utils/audioSynthesizer';
import { GLOW_OPTIONS, GlowMode } from '../utils/nightlight';
import { DELIVERY_WAYPOINTS } from '../utils/delivery';
import { DreamDeliverySection } from './DreamDeliverySection';

type ProjectId = 'nightlight' | 'routes' | 'toys';
type ToyBuild = 'tower' | 'rocket' | 'house';

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
    description: 'A tiny night courier follows a glowing flight path to deliver the right dream to the right rooftop.',
    challenge: 'A map is easier to love when you can see a journey unfold instead of reading a static diagram.',
    solution: 'Choose a dream port, launch the courier, and follow the animated star while delivery status updates in real time.',
    capabilities: ['3 interactive dream ports', 'Animated SVG flight path', 'Live delivery feedback'],
    accent: '#f3cf75',
    action: 'Launch a dream',
  },
  {
    id: 'toys',
    number: '03',
    label: 'THE MIDNIGHT PLAYROOM',
    title: 'Rattle & Block Toys',
    tagline: 'Build a little impossible.',
    description: 'A tactile little toy studio where colourful pieces become towers, tiny houses, or a rocket for the moon.',
    challenge: 'The best portfolio moments invite people to play, not just admire a screenshot.',
    solution: 'Build a toy piece by piece, change the colour story, and switch designs without leaving the page.',
    capabilities: ['3 toy blueprints', 'Live block builder', 'Colour palette mixer'],
    accent: '#f1c9d6',
    action: 'Build something lovely',
  },
];

const TOY_PALETTES = [
  ['#a34063', '#f3cf75', '#d9c8ef', '#7aa2f7', '#f1c9d6', '#a8d5ba'],
  ['#635b9a', '#a7c7e7', '#f4d58d', '#e8a4a4', '#9fc9b6', '#fff8f1'],
  ['#ed9d8b', '#e8c96d', '#9fc9b6', '#b7a0d8', '#f5dbe4', '#fff8f1'],
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
  const [isNightPreview, setIsNightPreview] = useState(true);
  const [toyCount, setToyCount] = useState(4);
  const [toyBuild, setToyBuild] = useState<ToyBuild>('tower');
  const [toyPaletteIndex, setToyPaletteIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const glow = GLOW_OPTIONS.find((item) => item.id === activeGlow) || GLOW_OPTIONS[0];
  const isLullabyAudible = lullaby.isPlaying && !lullaby.isMuted;
  const toyColors = TOY_PALETTES[toyPaletteIndex];

  const openProject = (project: ProjectCase) => {
    play('button-click');
    setSelectedProject(project);
  };

  const closeProject = () => setSelectedProject(null);

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

  const addToyPiece = () => {
    if (toyCount >= 9) return;
    play('button-click');
    setToyCount((count) => Math.min(9, count + 1));
  };

  const selectToyBuild = (build: ToyBuild) => {
    play('button-click');
    setToyBuild(build);
  };

  const resetToy = () => {
    play('button-click');
    setToyCount(4);
    setToyBuild('tower');
    setToyPaletteIndex(0);
  };

  useEffect(() => {
    if (!selectedProject) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedProject(null);
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
      previousFocus?.focus();
    };
  }, [selectedProject]);

  const renderNightlightArtwork = (large = false) => (
    <div
      className={'ultimate-lantern-scene' + (large ? ' ultimate-art-large' : '') + (isNightPreview ? ' is-night' : ' is-day')}
      style={{ '--project-glow': glow.hex } as React.CSSProperties}
    >
      <div className="ultimate-lantern-halo ultimate-halo-one" aria-hidden="true" />
      <div className="ultimate-lantern-halo ultimate-halo-two" aria-hidden="true" />
      <span className="ultimate-lantern-moon" aria-hidden="true">{isNightPreview ? '☾' : '☼'}</span>
      <span className="ultimate-lantern-star ultimate-lantern-star-one" aria-hidden="true">✦</span>
      <span className="ultimate-lantern-star ultimate-lantern-star-two" aria-hidden="true">✧</span>
      <img
        src="/assets/pip_dream_lantern.png"
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

  const renderRouteArtwork = (large = false) => (
    <div className={'ultimate-route-art' + (large ? ' ultimate-art-large' : '')}>
      <div className="ultimate-route-sky" aria-hidden="true">
        <span>✦</span><span>·</span><span>✧</span><span>·</span><span>✦</span><span>·</span><span>✧</span>
      </div>
      <div className="ultimate-route-label ultimate-route-label-left">WHISPERING ATTIC</div>
      <div className="ultimate-route-label ultimate-route-label-mid">LIGHTHOUSE NURSERY</div>
      <div className="ultimate-route-label ultimate-route-label-right">CLOUD NINE SPIRE</div>
      <svg viewBox="0 0 520 230" role="img" aria-label="A golden star moves along a curved route between three dream destinations">
        <defs>
          <linearGradient id={large ? 'ultimate-route-gradient-large' : 'ultimate-route-gradient'} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f1c9d6" />
            <stop offset="52%" stopColor="#d9c8ef" />
            <stop offset="100%" stopColor="#f3cf75" />
          </linearGradient>
        </defs>
        <path d="M38 145 C95 8 170 48 240 110 S365 207 482 47" fill="none" stroke="rgba(255,248,241,.1)" strokeWidth="14" strokeLinecap="round" />
        <path d="M38 145 C95 8 170 48 240 110 S365 207 482 47" fill="none" stroke={'url(#' + (large ? 'ultimate-route-gradient-large' : 'ultimate-route-gradient') + ')'} strokeWidth="3" strokeLinecap="round" strokeDasharray="5 12" className="ultimate-flight-line" />
        {[{x:38,y:145},{x:240,y:110},{x:482,y:47}].map((point,index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="19" fill={index === 0 ? '#a34063' : index === 1 ? '#9f91da' : '#f3cf75'} opacity=".15" />
            <circle cx={point.x} cy={point.y} r="7" fill={index === 0 ? '#f1c9d6' : index === 1 ? '#d9c8ef' : '#f3cf75'} stroke="#fff8f1" strokeWidth="2" />
          </g>
        ))}
        <g className="ultimate-flying-star">
          <path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z" fill="#f3cf75" />
          <circle r="16" fill="#f3cf75" opacity=".12" />
        </g>
      </svg>
      <div className={'ultimate-flight-status' + (deliveryStatus === 'dispatching' ? ' is-moving' : '')}>
        <span className="ultimate-live-dot" />
        {deliveryStatus === 'dispatching' ? 'COURIER IN FLIGHT' : deliveryStatus === 'delivered' ? 'DREAM DELIVERED SAFELY' : 'ROUTES CLEAR · READY TO FLY'}
      </div>
    </div>
  );

  const renderToyArtwork = (large = false) => (
    <div className={'ultimate-toy-art' + (large ? ' ultimate-art-large' : '')}>
      <div className="ultimate-toy-stamp">PIP’S PLAYROOM <span>✦</span></div>
      <div className={'ultimate-toy-builder ultimate-build-' + toyBuild} aria-label={toyBuild + ' toy with ' + toyCount + ' pieces'}>
        {toyBuild === 'rocket' && <div className="ultimate-rocket-nose" aria-hidden="true" />}
        {toyBuild === 'house' && <div className="ultimate-house-roof" aria-hidden="true" />}
        <div className="ultimate-toy-stack">
          {Array.from({ length: toyCount }, (_, index) => (
            <span
              key={index}
              className={'ultimate-toy-piece ultimate-piece-' + (index % 3)}
              style={{
                backgroundColor: toyColors[index % toyColors.length],
                animationDelay: (index * 45) + 'ms',
              }}
            >
              {index % 3 === 0 ? '✦' : index % 3 === 1 ? '☾' : '•'}
            </span>
          ))}
        </div>
        {toyBuild === 'rocket' && <div className="ultimate-rocket-fins" aria-hidden="true"><i /><i /></div>}
        {toyBuild === 'house' && <div className="ultimate-house-door" aria-hidden="true" />}
      </div>
      <div className="ultimate-toy-floor" />
      <div className="ultimate-toy-counter">{toyCount} / 9 PIECES · {toyBuild.toUpperCase()} BUILD</div>
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
        <header className="ultimate-showcase-heading">
          <div className="ultimate-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>PIP’S MIDNIGHT OBSERVATORY</span>
            <span className="ultimate-eyebrow-separator">✦</span>
            <span>THREE WORLDS TO EXPLORE</span>
          </div>
          <h2 id="ultimate-showcase-title" className="ultimate-showcase-title">
            Tiny inventions.<br /><span>Huge dreams.</span>
          </h2>
          <p className="ultimate-showcase-subtitle">Choose a world. Touch the details. Make a little magic.</p>
        </header>

        <div className="ultimate-project-grid">
          {PROJECTS.map((project, index) => (
            <article
              key={project.id}
              className={'ultimate-project-card ultimate-project-' + project.id}
              style={{ '--project-accent': project.accent, animationDelay: (index * 120) + 'ms' } as React.CSSProperties}
              data-project-card="true"
              aria-labelledby={'ultimate-project-title-' + project.id}
            >
              <div className="ultimate-project-meta">
                <span className="ultimate-project-number">{project.number}<i> / 03</i></span>
                <span className="ultimate-project-class">{project.label}</span>
              </div>

              <div className="ultimate-project-visual">
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
                  <>
                    {renderToyArtwork()}
                    <div className="ultimate-art-controls ultimate-toy-quick-controls">
                      <div className="ultimate-mini-palette" role="group" aria-label="Toy colour palette">
                        {TOY_PALETTES.map((palette, paletteIndex) => (
                          <button key={paletteIndex} type="button" aria-label={'Choose toy palette ' + (paletteIndex + 1)} aria-pressed={toyPaletteIndex === paletteIndex} className={toyPaletteIndex === paletteIndex ? 'is-selected' : ''} onClick={() => setToyPaletteIndex(paletteIndex)}>
                            {palette.slice(0, 3).map((color) => <i key={color} style={{ backgroundColor: color }} />)}
                          </button>
                        ))}
                      </div>
                      <button type="button" className="ultimate-mini-add" onClick={addToyPiece} disabled={toyCount >= 9}>
                        <Sparkles className="h-3.5 w-3.5" /> {toyCount >= 9 ? 'Max pieces' : 'Add piece +'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="ultimate-project-copy">
                <div className="ultimate-project-title-row">
                  <span className="ultimate-project-glyph" aria-hidden="true">{project.id === 'nightlight' ? '☾' : project.id === 'routes' ? '✦' : '▧'}</span>
                  <h3 id={'ultimate-project-title-' + project.id}>{project.title}</h3>
                  <span className="ultimate-project-arrow" aria-hidden="true"><ArrowUpRight className="h-5 w-5" /></span>
                </div>
                <p className="ultimate-project-tagline">{project.tagline}</p>
                <p className="ultimate-project-description">{project.description}</p>
                <div className="ultimate-capability-list">
                  {project.capabilities.map((capability) => <span key={capability}><Check className="h-3.5 w-3.5" />{capability}</span>)}
                </div>
              </div>

              <div className="ultimate-project-footer">
                <span className="ultimate-project-live">
                  <i />
                  {project.id === 'nightlight' ? glow.name : project.id === 'routes' ? (deliveryStatus === 'dispatching' ? 'IN FLIGHT' : deliveryStatus === 'delivered' ? 'DELIVERED' : 'READY TO DISPATCH') : toyCount === 9 ? 'MASTER BUILDER' : toyCount + ' PIECES BUILT'}
                </span>
                <button type="button" onClick={() => openProject(project)} className="ultimate-project-cta" aria-haspopup="dialog" aria-label={'Open ' + project.title}>
                  <span>{project.action}</span><ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="ultimate-showcase-signoff">
          <span aria-hidden="true">✦</span>
          <p>Made with moonlight, a little mischief, and a lot of love.</p>
          <span aria-hidden="true">✦</span>
        </div>
      </div>

      {selectedProject && (
        <div
          className="ultimate-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProject();
          }}
        >
          <section
            ref={modalRef}
            className="ultimate-project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ultimate-modal-title"
            aria-describedby="ultimate-modal-description"
            style={{ '--project-accent': selectedProject.accent } as React.CSSProperties}
          >
            <button ref={closeButtonRef} type="button" className="ultimate-modal-close" onClick={closeProject} aria-label="Close project">
              <X className="h-5 w-5" />
            </button>
            <div className="ultimate-modal-scroll">
              <div className="ultimate-modal-heading">
                <span className="ultimate-modal-kicker">PROJECT {selectedProject.number} · {selectedProject.label}</span>
                <h2 id="ultimate-modal-title">{selectedProject.title}</h2>
                <p id="ultimate-modal-description">{selectedProject.description}</p>
              </div>

              {selectedProject.id === 'nightlight' && (
                <div className="ultimate-modal-content">
                  {renderNightlightArtwork(true)}
                  <div className="ultimate-control-panel">
                    <div className="ultimate-control-heading">
                      <div><span>LIGHT ENGINE</span><h3>Set the mood</h3></div>
                      <span className="ultimate-live-badge"><i /> LIVE</span>
                    </div>
                    <div className="ultimate-mood-grid" role="group" aria-label="Select lantern mood">
                      {GLOW_OPTIONS.map((item) => (
                        <button key={item.id} type="button" onClick={() => selectGlow(item.id)} className={activeGlow === item.id ? 'is-selected' : ''} aria-pressed={activeGlow === item.id}>
                          <i style={{ backgroundColor: item.hex }} />
                          <span><b>{item.name}</b><small>{item.subtitle}</small></span>
                          {activeGlow === item.id && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                    <div className="ultimate-daynight-switch ultimate-daynight-modal" role="group" aria-label="Preview lighting">
                      <button type="button" onClick={() => setIsNightPreview(false)} aria-pressed={!isNightPreview} className={!isNightPreview ? 'is-active' : ''}><Sun className="h-4 w-4" /> Day preview</button>
                      <button type="button" onClick={() => setIsNightPreview(true)} aria-pressed={isNightPreview} className={isNightPreview ? 'is-active' : ''}><Moon className="h-4 w-4" /> Night preview</button>
                    </div>
                    <div className="ultimate-sound-panel">
                      <div className="ultimate-control-heading">
                        <div><span>SOUND DESIGN</span><h3>Wind the music box</h3></div>
                        <Volume2 className="h-5 w-5 ultimate-sound-icon" />
                      </div>
                      <p>Soft synthesized bell tones, generated live in your browser.</p>
                      <div className="ultimate-melody-options" role="group" aria-label="Choose lullaby melody">
                        {MELODY_PATTERNS.map((pattern, index) => (
                          <button key={pattern.id} type="button" onClick={() => { play('tune-select'); lullaby.setPattern(index); }} className={lullaby.activePatternIndex === index ? 'is-selected' : ''} aria-pressed={lullaby.activePatternIndex === index}>
                            {pattern.name}
                          </button>
                        ))}
                      </div>
                      <div className="ultimate-sound-actions">
                        <button type="button" onClick={toggleLullaby} className="ultimate-sound-play">
                          {isLullabyAudible ? <><span className="ultimate-pause-icon">Ⅱ</span> Pause lullaby</> : <><Play className="h-4 w-4 fill-current" /> Play lullaby</>}
                        </button>
                        <button type="button" onClick={() => { play('wind-key'); lullaby.windUp(25); }} className="ultimate-wind-key">
                          <RotateCw className="h-4 w-4" /> Wind key +25%
                        </button>
                      </div>
                      <div className="ultimate-wind-meter">
                        <div><span>SPRING POWER</span><b>{lullaby.windup}%</b></div>
                        <div className="ultimate-wind-track"><span style={{ width: Math.max(0, Math.min(100, lullaby.windup)) + '%' }} /></div>
                      </div>
                    </div>
                  </div>
                  <div className="ultimate-project-story">
                    <div><span>THE IDEA</span><p>{selectedProject.challenge}</p></div>
                    <div><span>THE MAGIC</span><p>{selectedProject.solution}</p></div>
                  </div>
                </div>
              )}

              {selectedProject.id === 'routes' && (
                <div className="ultimate-modal-content ultimate-route-modal-content">
                  <DreamDeliverySection compact onStatusChange={onDeliveryStatusChange} />
                  <div className="ultimate-project-story ultimate-route-story">
                    <div><span>THE IDEA</span><p>{selectedProject.challenge}</p></div>
                    <div><span>THE MAGIC</span><p>{selectedProject.solution}</p></div>
                  </div>
                  <p className="ultimate-modal-note"><span>✦</span> Pick a destination on the map or send a dream to the next stop. Pip will do the rest.</p>
                </div>
              )}

              {selectedProject.id === 'toys' && (
                <div className="ultimate-modal-content">
                  {renderToyArtwork(true)}
                  <div className="ultimate-control-panel">
                    <div className="ultimate-control-heading">
                      <div><span>TOY WORKSHOP</span><h3>Build your dream toy</h3></div>
                      <span className="ultimate-build-count">{toyCount} / 9</span>
                    </div>
                    <div className="ultimate-build-picker" role="group" aria-label="Choose toy blueprint">
                      <button type="button" className={toyBuild === 'tower' ? 'is-selected' : ''} aria-pressed={toyBuild === 'tower'} onClick={() => selectToyBuild('tower')}><span>▥</span><b>Star tower</b><small>Stack it tall</small></button>
                      <button type="button" className={toyBuild === 'house' ? 'is-selected' : ''} aria-pressed={toyBuild === 'house'} onClick={() => selectToyBuild('house')}><span>⌂</span><b>Cloud house</b><small>Build a home</small></button>
                      <button type="button" className={toyBuild === 'rocket' ? 'is-selected' : ''} aria-pressed={toyBuild === 'rocket'} onClick={() => selectToyBuild('rocket')}><span>♢</span><b>Moon rocket</b><small>Fly away</small></button>
                    </div>
                    <div className="ultimate-toy-control-actions">
                      <button type="button" onClick={addToyPiece} disabled={toyCount >= 9}><Sparkles className="h-4 w-4" />{toyCount >= 9 ? 'Build complete!' : 'Add a piece'}</button>
                      <button type="button" onClick={resetToy}><RotateCw className="h-4 w-4" />Start again</button>
                    </div>
                    <div className="ultimate-palette-picker" role="group" aria-label="Choose toy palette">
                      {TOY_PALETTES.map((palette, index) => (
                        <button key={index} type="button" aria-label={'Choose colour palette ' + (index + 1)} aria-pressed={toyPaletteIndex === index} className={toyPaletteIndex === index ? 'is-selected' : ''} onClick={() => { play('button-click'); setToyPaletteIndex(index); }}>
                          {palette.slice(0, 4).map((color) => <i key={color} style={{ backgroundColor: color }} />)}
                        </button>
                      ))}
                    </div>
                    <div className="ultimate-build-progress" role="progressbar" aria-label="Toy building progress" aria-valuemin={0} aria-valuemax={9} aria-valuenow={toyCount}>
                      <span style={{ width: (toyCount / 9 * 100) + '%' }} />
                    </div>
                    <p className="ultimate-build-message" role="status"><Check className="h-4 w-4" />{toyCount === 9 ? 'You built a masterpiece. Pip approves!' : 'A lovely start. ' + (9 - toyCount) + ' piece' + (9 - toyCount === 1 ? '' : 's') + ' left to finish this toy.'}</p>
                  </div>
                  <div className="ultimate-project-story">
                    <div><span>THE IDEA</span><p>{selectedProject.challenge}</p></div>
                    <div><span>THE MAGIC</span><p>{selectedProject.solution}</p></div>
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
