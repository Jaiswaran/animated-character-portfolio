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

  // Paint the portrait first, then initialize the real 3D scene automatically.
  // Pointer, tap, or keyboard interaction can start it sooner. A short idle delay avoids
  // competing with the hero image during first paint, while preventing a refresh from
  // leaving Pip in the fallback artwork until the visitor moves the cursor.
  useEffect(() => {
    if (Scene || sceneFailed) return;

    let cancelled = false;
    let loading = false;
    let idleTimer: number | null = null;

    const loadScene = () => {
      if (cancelled || loading || Scene || sceneFailed) return;
      loading = true;
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }

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
    window.addEventListener('pointermove', loadScene, { passive: true, once: true });
    window.addEventListener('pointerdown', loadScene, { passive: true, once: true });
    window.addEventListener('keydown', loadScene, { passive: true, once: true });

    // Automatically hydrate the 3D model after the hero has had time to paint.
    // Keep the delay modest so refreshes don't leave the fallback visible indefinitely.
    idleTimer = window.setTimeout(loadScene, 5000);

    return () => {
      cancelled = true;
      if (idleTimer !== null) window.clearTimeout(idleTimer);
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
