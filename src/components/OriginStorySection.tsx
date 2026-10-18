/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pip's five-scene story. Each scene is intentionally short enough to be read
 * on a phone, with the same story available as plain text when motion is reduced.
 */
import React, { useEffect, useRef, useState } from 'react';

const SCENES = [
  {
    number: '01',
    title: 'The Little Observatory',
    place: 'A window above the sleeping world',
    story: 'Pip wakes beneath a sky full of sleepy stars. Between two drifting constellations, a tiny dream flickers—bright with possibility, but too fragile to travel alone. Pip cups it carefully in both hands and promises to find a way to keep it glowing until it reaches someone who needs it.',
    cue: 'A little light is worth looking after.',
    kind: 'observatory',
    icon: '✧',
  },
  {
    number: '02',
    title: 'The Lullaby Lab',
    place: 'Where music mends wobbly dreams',
    story: 'In the Lullaby Lab, Pip finds the old music box and gives its brass key a gentle turn. The first notes wobble like a sleepy moth. Pip listens, adjusts the tune, and tries again. At last, a soft repeating melody settles around the dream, steadying its shimmer with every beat.',
    cue: 'Listen closely. Even small things have a rhythm.',
    kind: 'lullaby',
    icon: '♫',
  },
  {
    number: '03',
    title: 'The Nightlight Workshop',
    place: 'Warmth, carefully made',
    story: 'The tune is steady, but the night is chilly. Pip gathers moon-glass, a copper handle, and a pinch of stardust to build a little lantern. The music-box melody slips inside. Its golden glow wraps around the dream—not to hide its sparkle, but to keep it warm and safe on the journey ahead.',
    cue: 'Gentleness can be built, one piece at a time.',
    kind: 'workshop',
    icon: '☼',
  },
  {
    number: '04',
    title: 'The Rooftop Delivery',
    place: 'Five rooftops. One very important parcel.',
    story: 'Pip lifts off and follows a silver route over five rooftops: the crooked chimney, the clockmaker’s gable, the blue slate roof, the ivy tower, and the cloud-bright attic. At the last stop, a little creature waits beneath a blanket. Pip lowers the lantern, and the dream floats gently into its waiting paws.',
    cue: 'The best journeys end with sharing.',
    kind: 'delivery',
    icon: '⌁',
  },
  {
    number: '05',
    title: 'The Nursery Sleeps',
    place: 'The quiet after the wish comes true',
    story: 'The little creature’s eyes close as the dream blooms into a soft sky of its own. Rooftops grow still; the stars settle into their places. Pip follows the moonlit route home and curls up in the observatory, certain the night is finally safe. Then one tiny star winks awake. It remembers the way—and seems to know a secret Pip has yet to discover.',
    cue: 'Some stories leave one light on.',
    kind: 'nursery',
    icon: '✦',
  },
] as const;

function SceneIllustration({ kind, index }: { kind: string; index: number }) {
  const roofXs = [55, 150, 245, 340, 435];
  return (
    <div className={`pip-story-art pip-story-art--${kind}`} aria-hidden="true">
      <div className="pip-story-moon">☾</div>
      <span className="pip-story-star star-a">✦</span>
      <span className="pip-story-star star-b">✧</span>
      <span className="pip-story-star star-c">·</span>
      {kind === 'delivery' ? (
        <svg className="pip-route-svg" viewBox="0 0 500 230" role="img" aria-label="" focusable="false">
          <path className="pip-route-base" d="M30 155 C70 40 115 46 150 125 S225 190 245 105 S320 25 340 112 S420 190 470 70" />
          <path className="pip-route-flow" d="M30 155 C70 40 115 46 150 125 S225 190 245 105 S320 25 340 112 S420 190 470 70" />
          {roofXs.map((x, i) => (
            <g key={x} transform={`translate(${x},${[155, 125, 105, 112, 70][i]})`}>
              <circle r="13" className={i === 4 ? 'pip-route-stop is-destination' : 'pip-route-stop'} />
              <text y="4" textAnchor="middle" className="pip-route-number">{i + 1}</text>
            </g>
          ))}
          <g className="pip-route-courier"><text x="0" y="0" textAnchor="middle">☁</text><text x="0" y="-7" textAnchor="middle" className="pip-route-pip">✦</text></g>
        </svg>
      ) : (
        <svg className="pip-scene-svg" viewBox="0 0 500 230" focusable="false">
          <path className="pip-art-hill" d="M0 205 Q115 155 220 196 T500 182 V230 H0Z" />
          {kind === 'observatory' && <g className="pip-observatory"><path d="M118 187 V115 Q118 80 155 80 Q192 80 192 115 V187Z"/><path d="M108 117 Q155 42 202 117Z"/><circle cx="155" cy="112" r="22"/><path d="M155 88 V135 M131 112 H179"/></g>}
          {kind === 'lullaby' && <g className="pip-music-box"><rect x="125" y="118" width="145" height="75" rx="12"/><path d="M139 118 L152 82 H243 L257 118Z"/><circle cx="198" cy="151" r="20"/><path d="M198 140 V161 M188 151 H208"/><path className="pip-note note-one" d="M295 90 V55 Q316 48 316 66 V80 M295 60 L316 66"/><path className="pip-note note-two" d="M340 115 V80 Q361 73 361 91 V105 M340 85 L361 91"/></g>}
          {kind === 'workshop' && <g className="pip-lantern"><path d="M150 95 L175 70 H230 L255 95 L244 178 H161Z"/><path d="M175 70 Q175 31 202 31 Q230 31 230 70"/><path d="M168 109 H247 M164 156 H250"/><circle cx="202" cy="130" r="23" className="pip-lantern-light"/><path d="M202 104 L209 123 L229 130 L209 137 L202 156 L195 137 L175 130 L195 123Z" className="pip-lantern-spark"/></g>}
          {kind === 'nursery' && <g className="pip-sleeper"><path d="M105 188 Q145 152 200 184 T300 184 V207 H105Z"/><circle cx="193" cy="158" r="23"/><path d="M173 151 Q193 116 214 151Z"/><path d="M180 161 Q193 170 206 161" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></g>}
          <g className="pip-little-character" transform={`translate(${kind === 'nursery' ? 315 : 330}, ${kind === 'nursery' ? 164 : 157})`}>
            <path d="M-20 4 Q-25 -20 0 -25 Q25 -20 20 4 L17 29 H-17Z"/>
            <circle cx="-7" cy="-8" r="2.7" className="pip-character-eye"/><circle cx="7" cy="-8" r="2.7" className="pip-character-eye"/>
            <path d="M-5 1 Q0 6 5 1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M-14 -24 L-17 -39 L-4 -29 M14 -24 L17 -39 L4 -29"/>
          </g>
          {kind === 'observatory' && <g className="pip-dream-spark"><circle cx="286" cy="90" r="25"/><path d="M286 55 L295 82 L321 90 L295 98 L286 125 L277 98 L251 90 L277 82Z"/></g>}
          {kind === 'lullaby' && <g className="pip-melody-wave"><path d="M290 140 Q310 112 330 140 T370 140 T410 140"/></g>}
          {kind === 'workshop' && <g className="pip-workshop-glow"><circle cx="202" cy="130" r="58"/><circle cx="202" cy="130" r="74"/></g>}
        </svg>
      )}
      <div className="pip-art-caption"><span>{String(index + 1).padStart(2, '0')}</span><i /> {kind === 'delivery' ? 'ROOFTOP ROUTE' : kind.toUpperCase()}</div>
    </div>
  );
}

export const OriginStorySection: React.FC = () => {
  const [activeScene, setActiveScene] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(true);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setMotionAllowed(!media.matches);
    syncMotion();
    media.addEventListener?.('change', syncMotion);
    return () => media.removeEventListener?.('change', syncMotion);
  }, []);

  useEffect(() => {
    const nodes = sceneRefs.current.filter(Boolean) as HTMLElement[];
    if (!('IntersectionObserver' in window) || nodes.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number((entry.target as HTMLElement).dataset.sceneIndex);
          setActiveScene(index);
        }
      });
    }, { threshold: 0.48, rootMargin: '-12% 0px -18% 0px' });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const jumpToScene = (index: number) => {
    sceneRefs.current[index]?.scrollIntoView({
      behavior: motionAllowed ? 'smooth' : 'auto',
      block: 'center',
    });
  };

  return (
    <section id="origin" className="pip-story-section" aria-labelledby="pip-story-title">
      <div className="pip-story-intro">
        <span className="pip-story-eyebrow">CHRONICLES OF THE MIDNIGHT NURSERY</span>
        <h2 id="pip-story-title">Pip and the Little Dream</h2>
        <p>One flicker of wonder. Five small adventures. A secret waiting in the stars.</p>
        <a className="pip-story-start" href="#pip-scene-1" onClick={(event) => {
          event.preventDefault();
          jumpToScene(0);
        }}>Begin the story <span aria-hidden="true">↓</span></a>
      </div>

      <div className="pip-story-layout">
        <aside className="pip-story-progress" aria-label="Story navigation">
          <div className="pip-progress-heading"><span>YOUR JOURNEY</span><strong>{String(activeScene + 1).padStart(2, '0')} <i>/</i> 05</strong></div>
          <div className="pip-progress-track" aria-hidden="true"><span style={{ width: `${((activeScene + 1) / SCENES.length) * 100}%` }} /></div>
          <nav aria-label="Jump to a story scene">
            {SCENES.map((scene, index) => (
              <button
                type="button"
                key={scene.number}
                className={activeScene === index ? 'pip-progress-link is-active' : 'pip-progress-link'}
                aria-current={activeScene === index ? 'step' : undefined}
                onClick={() => jumpToScene(index)}
              >
                <span className="pip-progress-number">{scene.number}</span>
                <span className="pip-progress-label">{scene.title}</span>
                <span className="pip-progress-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </nav>
          <p className="pip-progress-note">Scroll, tap a chapter, or use your keyboard to wander through Pip’s night.</p>
          {!motionAllowed && <p className="pip-reduced-note">Reduced motion is on: scenes are shown without moving effects.</p>}
        </aside>

        <div className="pip-story-scenes" ref={progressRef}>
          {SCENES.map((scene, index) => (
            <article
              className={`pip-story-scene pip-story-scene--${scene.kind}${activeScene === index ? ' is-active' : ''}`}
              id={`pip-scene-${index + 1}`}
              key={scene.number}
              data-scene-index={index}
              ref={(node) => { sceneRefs.current[index] = node; }}
              aria-labelledby={`pip-scene-title-${index + 1}`}
            >
              <div className="pip-story-card">
                <div className="pip-story-copy">
                  <span className="pip-scene-kicker">SCENE {scene.number} <span aria-hidden="true">✦</span> {scene.place}</span>
                  <h3 id={`pip-scene-title-${index + 1}`}>{scene.title}</h3>
                  <p>{scene.story}</p>
                  <blockquote>{scene.cue}</blockquote>
                  <div className="pip-scene-controls">
                    {index > 0 && <button type="button" className="pip-scene-previous" onClick={() => jumpToScene(index - 1)}><span aria-hidden="true">←</span> Previous</button>}
                    {index < SCENES.length - 1 ? (
                      <button type="button" className="pip-scene-next" onClick={() => jumpToScene(index + 1)}>Next scene <span aria-hidden="true">→</span></button>
                    ) : (
                      <button type="button" className="pip-scene-next" onClick={() => jumpToScene(0)}>Read again <span aria-hidden="true">↺</span></button>
                    )}
                  </div>
                </div>
                <SceneIllustration kind={scene.kind} index={index} />
              </div>
            </article>
          ))}
          <p className="pip-story-ending"><span aria-hidden="true">✦</span> The end? Keep one eye on the smallest star.</p>
        </div>
      </div>
    </section>
  );
};
