/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pip's hero character.
 *
 * The real 3D model (Three.js, see Pip3DScene) is loaded lazily so it never blocks first paint:
 * the preloaded character artwork shows instantly and fades out once the 3D model has drawn its first frame.
 * If WebGL is unavailable, the chunk fails to load, or the GPU context is lost, the artwork with its
 * pointer-tracking CSS eyes stays on screen as a graceful fallback.
 */
import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '../utils/gaze';

interface Pip3DCharacterProps {
  motionAllowed: boolean;
  isWaving: boolean;
}

interface Gaze {
  x: number;
  y: number;
  tiltX: number;
  tiltY: number;
}

type SceneComponent = React.ComponentType<{
  motionAllowed: boolean;
  isWaving: boolean;
  onReady?: () => void;
  onError?: () => void;
}>;

const RESTING_GAZE: Gaze = { x: 0, y: 0, tiltX: 0, tiltY: 0 };

export const Pip3DCharacter: React.FC<Pip3DCharacterProps> = ({ motionAllowed, isWaving }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [gaze, setGaze] = useState<Gaze>(RESTING_GAZE);
  const [imageFailed, setImageFailed] = useState(false);
  const [Scene, setScene] = useState<SceneComponent | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);

  // Keep the lightweight portrait for first paint. Load Three.js on the first genuine
  // user interaction so mobile startup stays fast, then keep the 2D portrait as the fallback.
  // Do not create and destroy a probe WebGL context: mobile browsers limit GPU contexts,
  // and that probe can starve the real renderer before the 3D scene starts.
  useEffect(() => {
    if (Scene || sceneFailed) return;

    let cancelled = false;
    let loading = false;

    const loadScene = () => {
      if (cancelled || loading || Scene || sceneFailed) return;
      loading = true;

      // Let the actual renderer decide whether WebGL is supported. Its initialization
      // reports failures without replacing or hiding the preloaded portrait.
      import('./Pip3DScene')
        .then((module) => {
          if (!cancelled) setScene(() => module.Pip3DScene);
        })
        .catch(() => {
          if (!cancelled) setSceneFailed(true);
        });
    };

    const stage = stageRef.current;
    if (!stage) return;

    stage.addEventListener('pointerenter', loadScene, { passive: true, once: true });
    stage.addEventListener('click', loadScene, { passive: true, once: true });
    stage.addEventListener('focusin', loadScene, { passive: true, once: true });

    // A mouse moving elsewhere or a keyboard/touch interaction should also wake Pip;
    // Lighthouse's no-interaction page-load audit does not pull in the expensive 3D chunk.
    window.addEventListener('pointermove', loadScene, { passive: true, once: true });
    window.addEventListener('pointerdown', loadScene, { passive: true, once: true });
    window.addEventListener('keydown', loadScene, { passive: true, once: true });

    return () => {
      cancelled = true;
      stage.removeEventListener('pointerenter', loadScene);
      stage.removeEventListener('click', loadScene);
      stage.removeEventListener('focusin', loadScene);
      window.removeEventListener('pointermove', loadScene);
      window.removeEventListener('pointerdown', loadScene);
      window.removeEventListener('keydown', loadScene);
    };
  }, [Scene, sceneFailed]);

  // Fallback behaviour: the 2D artwork's CSS eyes follow the pointer while the 3D model is unavailable.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!motionAllowed || event.pointerType === 'touch') return;
      const bounds = stage.getBoundingClientRect();
      const nx = clamp(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1, -1, 1);
      const ny = clamp(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1, -1, 1);
      setGaze({ x: nx, y: ny, tiltX: -ny * 2.1, tiltY: nx * 3.1 });
    };

    const reset = () => setGaze(RESTING_GAZE);
    stage.addEventListener('pointermove', handlePointerMove, { passive: true });
    stage.addEventListener('pointerleave', reset, { passive: true });
    return () => {
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', reset);
    };
  }, [motionAllowed]);

  const show3D = sceneReady && !sceneFailed;

  const eyeVars = {
    '--pip-gaze-x': `${gaze.x * 17}%`,
    '--pip-gaze-y': `${gaze.y * 17}%`,
  } as React.CSSProperties;

  return (
    <div
      ref={stageRef}
      className={`pip-realistic-stage${motionAllowed ? ' is-motion-enabled' : ' is-motion-reduced'}${isWaving ? ' is-greeting' : ''}${show3D ? ' is-3d-ready' : ''}`}
      data-stage-ready={show3D ? 'true' : 'false'}
      style={{
        '--pip-tilt-x': motionAllowed ? `${gaze.tiltX}deg` : '0deg',
        '--pip-tilt-y': motionAllowed ? `${gaze.tiltY}deg` : '0deg',
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {!imageFailed ? (
        <img
          className="pip-realistic-art"
          src="/assets/pip_avatar_cloud.png"
          alt=""
          width={421}
          height={512}
          draggable={false}
          fetchPriority="high"
          decoding="sync"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="pip-realistic-fallback" aria-hidden="true">
          <span>☾</span><strong>✦</strong><i>☁</i>
        </div>
      )}

      {!imageFailed && !show3D && (
        <div className="pip-eye-tracking" style={eyeVars}>
          <span className="pip-eye-mask pip-eye-mask--left"><i className="pip-eye-iris"><b /></i></span>
          <span className="pip-eye-mask pip-eye-mask--right"><i className="pip-eye-iris"><b /></i></span>
        </div>
      )}

      {Scene && !sceneFailed && (
        <Scene
          motionAllowed={motionAllowed}
          isWaving={isWaving}
          onReady={() => setSceneReady(true)}
          onError={() => {
            setSceneFailed(true);
            setSceneReady(false);
          }}
        />
      )}

      <span className="pip-realistic-aura" />
    </div>
  );
};
