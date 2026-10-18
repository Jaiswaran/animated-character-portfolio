/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Use the portfolio's polished, production character artwork as the visible model.
 * Layered eye highlights provide a light 2.5D gaze effect without the rough sphere mesh.
 */
import React, { useEffect, useRef, useState } from 'react';

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

const RESTING_GAZE: Gaze = { x: 0, y: 0, tiltX: 0, tiltY: 0 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const Pip3DCharacter: React.FC<Pip3DCharacterProps> = ({ motionAllowed, isWaving }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [gaze, setGaze] = useState<Gaze>(RESTING_GAZE);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!motionAllowed || event.pointerType === 'touch') return;
      const bounds = stage.getBoundingClientRect();
      const nx = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width) * 2 - 1, -1, 1);
      const ny = clamp((event.clientY - bounds.top) / Math.max(1, bounds.height) * 2 - 1, -1, 1);
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

  const eyeVars = {
    '--pip-gaze-x': `${gaze.x * 17}%`,
    '--pip-gaze-y': `${gaze.y * 17}%`,
  } as React.CSSProperties;

  return (
    <div
      ref={stageRef}
      className={`pip-realistic-stage${motionAllowed ? ' is-motion-enabled' : ' is-motion-reduced'}${isWaving ? ' is-greeting' : ''}`}
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
          draggable={false}
          fetchPriority="high"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="pip-realistic-fallback" aria-hidden="true">
          <span>☾</span><strong>✦</strong><i>☁</i>
        </div>
      )}

      {!imageFailed && (
        <div className="pip-eye-tracking" style={eyeVars}>
          <span className="pip-eye-mask pip-eye-mask--left"><i className="pip-eye-iris"><b /></i></span>
          <span className="pip-eye-mask pip-eye-mask--right"><i className="pip-eye-iris"><b /></i></span>
        </div>
      )}
      <span className="pip-realistic-aura" />
    </div>
  );
};
