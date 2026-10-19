/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pip 3D Scene (Three.js) — Photo-Faithful 3D Relief & Shader-Driven Eye/Head Rig.
 *
 * Built from Pip's official portrait (/assets/pip_avatar_cloud.png) sculpted onto a
 * high-density 3D relief mesh with real-time skeletal vertex deformation and a custom
 * WebGL fragment shader that renders live glowing golden pupils inside the matte cocoa sockets:
 *  - Appears 100% identical to the uploaded reference photo at rest.
 *  - Eyes & Head: glowing golden pupils glide smoothly inside the dark cocoa sockets toward
 *    the cursor anywhere on the page (never clipping or leaving the sockets), while the 3D
 *    sculpted head smoothly rotates (yaw, pitch, tilt) toward the pointer.
 *  - Click / Tap: tap Pip's head to boop it (squash, bounce & blink); tap his body/cloud to make
 *    him wave his raised hand and hop cheerfully; drag to spin him in 3D space.
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { clamp, damp, fitCameraDistance, limitToUnitCircle, pointerToGaze, type Gaze2D } from '../utils/gaze';

export interface Pip3DSceneProps {
  /** false = prefers-reduced-motion: render one still frame, no loops, no tracking. */
  motionAllowed: boolean;
  /** Set to true by the hero when the greeting is triggered (click / tap / Enter / Space). */
  isWaving: boolean;
  /** Called once the first frame has been drawn. */
  onReady?: () => void;
  /** Called if WebGL fails (context lost, shader error, ...). */
  onError?: () => void;
}

const CAMERA_FOV = 26;
const CONTENT_WIDTH = 4.35;
const MIN_CAMERA_DISTANCE = 10.6;
const IDLE_AFTER_MS = 4000;
const WAVE_SECONDS = 1.65;
const HOP_SECONDS = 0.55;

// World dimensions of the portrait relief mesh (matches 421:512 aspect ratio)
const MESH_W = 4.21;
const MESH_H = 5.12;
const GRID_X = 88;
const GRID_Y = 106;

// Exact measured UV coordinates (0..1, top-left origin) from /assets/pip_avatar_cloud.png (421x512)
const LEFT_PUPIL_REST = { u: 0.4375, v: 0.4045 };
const RIGHT_PUPIL_REST = { u: 0.5846, v: 0.3760 };
const LEFT_SOCKET_CENTER = { u: 0.4155, v: 0.3985 };
const RIGHT_SOCKET_CENTER = { u: 0.5985, v: 0.3695 };

interface ProcessedPortrait {
  baseTexture: THREE.CanvasTexture;
  socketMaskTexture: THREE.CanvasTexture;
  alphaGrid: Float32Array;
  gridW: number;
  gridH: number;
}

/* ------------------------------------------------------------------ */
/* Helpers & Image Processing                                          */
/* ------------------------------------------------------------------ */

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function gaussian2D(u: number, v: number, cu: number, cv: number, ru: number, rv: number): number {
  const du = (u - cu) / ru;
  const dv = (v - cv) / rv;
  const d2 = du * du + dv * dv;
  if (d2 >= 1) return 0;
  const t = 1 - d2;
  return t * t;
}

/**
 * Prepares the base portrait texture (with healed dark cocoa eye sockets and clean transparent
 * outer background) plus a socket mask texture so the WebGL shader can render live glowing
 * golden pupils inside the sockets with zero Z-clipping.
 */
function processPortraitImage(img: HTMLImageElement): ProcessedPortrait {
  const w = img.naturalWidth || 421;
  const h = img.naturalHeight || 512;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Create socket mask canvas (R channel = 1 inside dark cocoa eye sockets, 0 outside)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskImgData = maskCtx.createImageData(w, h);
  const maskData = maskImgData.data;
  const rawMask = new Float32Array(w * h);

  // 1. Build the exact dark eye socket mask for left and right eyes
  for (let y = Math.floor(h * 0.29); y <= Math.ceil(h * 0.46); y++) {
    for (let x = Math.floor(w * 0.33); x <= Math.ceil(w * 0.67); x++) {
      const u = x / w;
      const v = y / h;
      const inLeftBox = Math.hypot((u - LEFT_SOCKET_CENTER.u) / 0.064, (v - LEFT_SOCKET_CENTER.v) / 0.050) < 1.0;
      const inRightBox = Math.hypot((u - RIGHT_SOCKET_CENTER.u) / 0.064, (v - RIGHT_SOCKET_CENTER.v) / 0.050) < 1.0;
      if (!inLeftBox && !inRightBox) continue;

      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Inside the socket, pixels are either dark cocoa OR inside the yellow pupil rest orb (where g > b + 15)
      const distLeftPupil = Math.hypot((u - LEFT_PUPIL_REST.u) / 0.032, (v - LEFT_PUPIL_REST.v) / 0.028);
      const distRightPupil = Math.hypot((u - RIGHT_PUPIL_REST.u) / 0.032, (v - RIGHT_PUPIL_REST.v) / 0.028);
      const inPupilOrb = (distLeftPupil < 1.0 || distRightPupil < 1.0) && g > b + 15;
      const darkness = 1 - smoothstep(120, 185, (r + g + b) / 3);
      rawMask[y * w + x] = inPupilOrb ? 1 : darkness;
    }
  }

  // Smooth the socket mask by 1.5px for silky anti-aliased socket rims
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const m =
        (rawMask[idx] * 4 +
          rawMask[idx - 1] +
          rawMask[idx + 1] +
          rawMask[idx - w] +
          rawMask[idx + w]) /
        8;
      const byte = Math.round(clamp(m * 255, 0, 255));
      const p = idx * 4;
      maskData[p] = byte;
      maskData[p + 1] = byte;
      maskData[p + 2] = byte;
      maskData[p + 3] = 255;
    }
  }
  maskCtx.putImageData(maskImgData, 0, 0);

  // 2. Seamlessly heal the static yellow pupils and their entire warm halo inside each dark cocoa
  //    socket so no ghost glow remains when the live pupil moves across the socket.
  const healSocket = (su: number, sv: number, pu: number, pv: number) => {
    const sx = su * w;
    const sy = sv * h;
    const px = pu * w;
    const py = pv * h;
    const rx = w * 0.064;
    const ry = h * 0.050;

    const x0 = Math.max(0, Math.floor(sx - rx));
    const x1 = Math.min(w - 1, Math.ceil(sx + rx));
    const y0 = Math.max(0, Math.floor(sy - ry));
    const y1 = Math.min(h - 1, Math.ceil(sy + ry));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const m = rawMask[y * w + x];
        if (m < 0.12) continue;

        const normDist = Math.hypot((x - sx) / (rx * 0.85), (y - sy) / (ry * 0.85));
        const rimFactor = clamp(normDist * normDist, 0, 1);

        // Natural matte cocoa socket shading: deep cocoa in the cavity, slightly warmer near the socket rim
        const targetR = 60 + rimFactor * 22;
        const targetG = 35 + rimFactor * 15;
        const targetB = 32 + rimFactor * 13;

        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distToPupil = Math.hypot(x - px, y - py);
        const pupilZone = 1 - smoothstep(w * 0.036, w * 0.058, distToPupil);
        const warmExcess = g > b + 10 ? clamp((r - targetR) / 14, 0, 1) : 0;
        const blend = clamp(Math.max(pupilZone, warmExcess) * smoothstep(0.12, 0.70, m), 0, 1);

        data[i] = Math.round(r + (targetR - r) * blend);
        data[i + 1] = Math.round(g + (targetG - g) * blend);
        data[i + 2] = Math.round(b + (targetB - b) * blend);
      }
    }
  };

  healSocket(LEFT_SOCKET_CENTER.u, LEFT_SOCKET_CENTER.v, LEFT_PUPIL_REST.u, LEFT_PUPIL_REST.v);
  healSocket(RIGHT_SOCKET_CENTER.u, RIGHT_SOCKET_CENTER.v, RIGHT_PUPIL_REST.u, RIGHT_PUPIL_REST.v);

  // 3. Outer border flood-fill with tightly fitted interior protection so 100% of the hat crown,
  //    cloud puffs, bow, pom-pom, moon, and stars are preserved with zero waist halo.
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  const isProtectedInterior = (u: number, v: number): boolean => {
    // Nightcap top dome & crown (reaches right up to v=0.138)
    if (Math.hypot((u - 0.468) / 0.212, (v - 0.295) / 0.158) < 1.0) return true;
    // Lower face & chubby skull cheeks
    if (Math.hypot((u - 0.492) / 0.192, (v - 0.388) / 0.105) < 1.0) return true;
    // Narrower torso & seated legs (tightly inside waist u=0.39..0.61)
    if (Math.hypot((u - 0.50) / 0.112, (v - 0.575) / 0.125) < 1.0) return true;
    // Main cloud cushion body
    if (Math.hypot((u - 0.50) / 0.305, (v - 0.752) / 0.112) < 1.0) return true;
    // Upper-left & upper-right cloud puffs behind Pip's hips
    if (Math.hypot((u - 0.335) / 0.076, (v - 0.665) / 0.052) < 1.0) return true;
    if (Math.hypot((u - 0.688) / 0.082, (v - 0.665) / 0.056) < 1.0) return true;
    return false;
  };

  const visited = new Uint8Array(w * h);
  const isBg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  const enqueue = (x: number, y: number) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue[qTail++] = idx;
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % w;
    const y = (idx - x) / w;
    const u = x / w;
    const v = y / h;

    if (isProtectedInterior(u, v)) continue;

    const p = idx * 4;
    const dr = data[p] - bgR;
    const dg = data[p + 1] - bgG;
    const db = data[p + 2] - bgB;
    const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (colorDist > 11.0) continue;

    isBg[idx] = 1;

    if (x > 0) enqueue(x - 1, y);
    if (x < w - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < h - 1) enqueue(x, y + 1);
  }

  // Smooth 2px alpha feathering along the outer contour
  const alphaBuf = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alphaBuf[i] = isBg[i] ? 0 : 1;
  }
  const smoothedAlpha = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += alphaBuf[ny * w + nx];
          count++;
        }
      }
      const a = sum / count;
      smoothedAlpha[y * w + x] = a;
      data[(y * w + x) * 4 + 3] = Math.round(clamp(a * 255, 0, 255));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const baseTexture = new THREE.CanvasTexture(canvas);
  baseTexture.colorSpace = THREE.SRGBColorSpace;
  baseTexture.minFilter = THREE.LinearMipmapLinearFilter;
  baseTexture.magFilter = THREE.LinearFilter;
  baseTexture.generateMipmaps = true;

  const socketMaskTexture = new THREE.CanvasTexture(maskCanvas);
  socketMaskTexture.minFilter = THREE.LinearFilter;
  socketMaskTexture.magFilter = THREE.LinearFilter;

  return {
    baseTexture,
    socketMaskTexture,
    alphaGrid: smoothedAlpha,
    gridW: w,
    gridH: h,
  };
}

/* ------------------------------------------------------------------ */
/* 3D Relief Depth & Smooth Skeletal Weights                           */
/* ------------------------------------------------------------------ */

function uvToWorld(u: number, v: number): [number, number] {
  return [(u - 0.5) * MESH_W, (0.5 - v) * MESH_H];
}

function computeReliefZ(u: number, v: number): number {
  let z = 0;
  // Head & nightcap 3D spherical dome
  z += 0.56 * gaussian2D(u, v, 0.48, 0.34, 0.24, 0.20);
  // Chubby lower cheeks
  z += 0.15 * gaussian2D(u, v, 0.39, 0.43, 0.09, 0.07);
  z += 0.15 * gaussian2D(u, v, 0.63, 0.39, 0.09, 0.07);
  // Pink bow & pom-pom relief
  z += 0.16 * gaussian2D(u, v, 0.35, 0.28, 0.08, 0.06);
  z += 0.24 * gaussian2D(u, v, 0.21, 0.37, 0.065, 0.06);
  // Torso, tummy & seated knees
  z += 0.42 * gaussian2D(u, v, 0.50, 0.58, 0.17, 0.15);
  z += 0.22 * gaussian2D(u, v, 0.41, 0.67, 0.08, 0.065);
  z += 0.22 * gaussian2D(u, v, 0.57, 0.68, 0.08, 0.065);
  // Waving right arm
  z += 0.28 * gaussian2D(u, v, 0.68, 0.49, 0.10, 0.08);
  // Fluffy cloud cushion puffs
  z += 0.48 * gaussian2D(u, v, 0.50, 0.76, 0.33, 0.13);
  z += 0.16 * gaussian2D(u, v, 0.36, 0.77, 0.12, 0.07);
  z += 0.18 * gaussian2D(u, v, 0.55, 0.78, 0.13, 0.07);
  // Floating moon 3D depth separation
  if ((u > 0.695 && v < 0.265) || (u > 0.655 && v < 0.205)) {
    z += 0.22;
  }
  return z;
}

function computeHeadWeight(u: number, v: number): number {
  // Exclude moon & upper-right small star without touching the right tip of the nightcap brim (u~0.68, v~0.26)
  if (u > 0.695 && v < 0.265) return 0;
  if (u > 0.655 && v < 0.205) return 0;
  if (u > 0.74) return 0; // Right floating stars

  // Smoothly exclude left floating stars (u < 0.295, v > 0.43) without touching Pip's left cheek (u > 0.32)
  const leftStarMask = smoothstep(0.422, 0.445, v) * (1 - smoothstep(0.288, 0.316, u));

  // Smoothly exclude the raised waving right hand
  const handMask = gaussian2D(u, v, 0.71, 0.48, 0.075, 0.065);

  const neckLineV = 0.478 - (u - 0.5) * 0.16;
  const verticalWeight = 1 - smoothstep(neckLineV - 0.035, neckLineV + 0.035, v);
  const horizontalMask = 1 - smoothstep(0.695, 0.745, u);

  return clamp(verticalWeight * horizontalMask * (1 - handMask) * (1 - leftStarMask), 0, 1);
}

function computeWaveArmWeight(u: number, v: number): number {
  if (u < 0.55 || v < 0.41 || v > 0.59) return 0;
  return clamp(gaussian2D(u, v, 0.69, 0.49, 0.12, 0.085) * 1.35, 0, 1);
}

function computeFloaterWeight(u: number, v: number): { weight: number; phase: number } {
  if ((u > 0.695 && v < 0.265) || (u > 0.655 && v < 0.205)) return { weight: 1, phase: 0.5 };
  if (u > 0.74 && v >= 0.26 && v < 0.64) return { weight: 1, phase: 1.8 + v * 4 };
  if (u < 0.298 && v > 0.425 && v < 0.66) return { weight: 1, phase: 3.1 + v * 4 };
  return { weight: 0, phase: 0 };
}

/* ------------------------------------------------------------------ */
/* Custom WebGL Shader for Photo-Exact Glowing Pupils inside Sockets   */
/* ------------------------------------------------------------------ */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uBaseMap;
  uniform sampler2D uSocketMask;
  uniform vec2 uLeftPupil;
  uniform vec2 uRightPupil;
  uniform float uPupilScale;
  uniform float uBlink;

  varying vec2 vUv;

  // Renders the exact warm cream-yellow core + soft golden-amber radial glow from pip_avatar_cloud.jpg
  vec3 computePupilLight(vec2 imgUv, vec2 pupilCenter, float scale) {
    // Distance in original 421x512 pixel space
    vec2 diffPx = (imgUv - pupilCenter) * vec2(421.0, 512.0);
    float d = length(diffPx) / max(0.25, scale);

    // 1. Soft warm golden-amber aura illuminating the surrounding dark cocoa socket
    float halo = exp(-(d * d) / 115.0) * 0.72 + exp(-(d * d) / 36.0) * 0.45;
    vec3 haloColor = vec3(0.58, 0.34, 0.10) * halo;

    // 2. Crisp, anti-aliased warm cream-yellow glowing orb core (radius ~5.6px in 421x512 photo)
    float coreMask = 1.0 - smoothstep(4.2, 6.8, d);
    vec3 coreCenter = vec3(1.0, 0.955, 0.76);
    vec3 coreEdge = vec3(0.97, 0.78, 0.42);
    vec3 coreColor = mix(coreCenter, coreEdge, smoothstep(0.0, 5.8, d));

    return mix(haloColor, coreColor, coreMask * 0.97);
  }

  void main() {
    vec4 base = texture2D(uBaseMap, vUv);
    if (base.a < 0.01) discard;

    // Convert Three.js UV (bottom-left origin) to image UV (top-left origin 0..1)
    vec2 imgUv = vec2(vUv.x, 1.0 - vUv.y);
    float socketMask = texture2D(uSocketMask, vUv).r;

    vec3 color = base.rgb;

    if (socketMask > 0.005) {
      vec3 leftGlow = computePupilLight(imgUv, uLeftPupil, uPupilScale);
      vec3 rightGlow = computePupilLight(imgUv, uRightPupil, uPupilScale);
      vec3 totalGlow = leftGlow + rightGlow;

      // Screen-like warm additive blend inside the dark cocoa eye socket
      float coreStrength = clamp(max(totalGlow.r, totalGlow.g), 0.0, 1.0);
      vec3 litSocket = mix(color + totalGlow * 0.90, max(color, totalGlow), coreStrength * 0.78);

      // Natural dark-cocoa eyelid blink sweep
      vec3 blinkColor = vec3(0.235, 0.14, 0.125);
      litSocket = mix(litSocket, blinkColor, clamp(uBlink, 0.0, 1.0));

      color = mix(color, clamp(litSocket, 0.0, 1.0), socketMask);
    }

    gl_FragColor = vec4(color, base.a);
    #include <colorspace_fragment>
  }
`;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface AnimationApi {
  greet: () => void;
}

export const Pip3DScene: React.FC<Pip3DSceneProps> = ({ motionAllowed, isWaving, onReady, onError }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<AnimationApi | null>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        // Avoid the extra multisample buffer on dense mobile displays.
        antialias: (window.devicePixelRatio || 1) <= 1.5,
        alpha: true,
        // Animation never needs a preserved drawing buffer; this saves GPU memory.
        preserveDrawingBuffer: false,
        powerPreference: window.matchMedia('(max-width: 700px)').matches ? 'low-power' : 'high-performance',
      });
    } catch {
      onErrorRef.current?.();
      return;
    }

    let shaderCompilationFailed = false;
    let shaderFailureReported = false;
    // A shader-link failure can leave a blank WebGL canvas without throwing. Keep the
    // 2D portrait as the visible fallback instead of cross-fading to an empty canvas.
    renderer.debug.onShaderError = () => {
      shaderCompilationFailed = true;
    };

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'pan-y';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 0.82, 0.1, 100);

    const root = new THREE.Group();
    scene.add(root);

    const disposables: { dispose: () => void }[] = [];

    const state = {
      time: 0,
      gazeTarget: { x: 0, y: 0 } as Gaze2D,
      eyeGaze: { x: 0, y: 0 } as Gaze2D,
      headGaze: { x: 0, y: 0 } as Gaze2D,
      lastPointerAt: -Infinity,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragStartYaw: 0,
      yawTarget: 0,
      yaw: 0,
      pitchTarget: 0,
      pitch: 0,
      waveT: 99,
      hopT: 99,
      boopT: 99,
      widenT: 99,
      blinkT: 99,
      nextBlinkAt: 2.6,
    };

    const greet = () => {
      if (state.waveT < 0.5) return;
      state.waveT = 0;
      state.hopT = 0;
      state.widenT = 0;
    };
    const boop = () => {
      state.boopT = 0;
      state.widenT = 0;
      state.blinkT = 0;
    };
    apiRef.current = { greet };

    let frameId = 0;
    let running = false;
    let last = 0;
    let firstFrameDrawn = false;
    let updateDeformation: ((dt: number) => void) | null = null;

    const drawFrame = () => {
      renderer.render(scene, camera);
      if (shaderCompilationFailed) {
        if (!shaderFailureReported) {
          shaderFailureReported = true;
          onErrorRef.current?.();
        }
        return;
      }
      if (!firstFrameDrawn) {
        firstFrameDrawn = true;
        onReadyRef.current?.();
      }
    };

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      const elapsedMs = now - last;
      if (isHeadless && elapsedMs < 55) return;
      const dt = Math.min(0.05, elapsedMs / 1000);
      last = now;
      state.time += dt;
      if (updateDeformation) {
        updateDeformation(dt);
        drawFrame();
      }
    };

    const start = () => {
      if (running || !motionAllowed || !updateDeformation) return;
      running = true;
      last = performance.now();
      frameId = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const distance = fitCameraDistance(CONTENT_WIDTH, CAMERA_FOV, camera.aspect, MIN_CAMERA_DISTANCE);
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      if (updateDeformation && !motionAllowed) {
        updateDeformation(0);
        drawFrame();
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let onScreen = true;
    const syncRunning = () => (onScreen && !document.hidden ? start() : stop());
    const intersection = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      syncRunning();
    });
    intersection.observe(container);
    document.addEventListener('visibilitychange', syncRunning);

    // Load portrait & initialize 3D relief mesh + custom eye shader
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;

      try {
      let processed: ProcessedPortrait;
      try {
        processed = processPortraitImage(img);
      } catch {
        onErrorRef.current?.();
        return;
      }
      disposables.push(processed.baseTexture, processed.socketMaskTexture);

      const geo = new THREE.PlaneGeometry(MESH_W, MESH_H, GRID_X, GRID_Y);
      disposables.push(geo);

      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
      const vCount = posAttr.count;

      const baseX = new Float32Array(vCount);
      const baseY = new Float32Array(vCount);
      const baseZ = new Float32Array(vCount);
      const headW = new Float32Array(vCount);
      const armW = new Float32Array(vCount);
      const floatW = new Float32Array(vCount);
      const floatPhase = new Float32Array(vCount);
      const vAlpha = new Float32Array(vCount);

      for (let i = 0; i < vCount; i++) {
        const u = uvAttr.getX(i);
        const v = 1 - uvAttr.getY(i);
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = computeReliefZ(u, v);

        baseX[i] = x;
        baseY[i] = y;
        baseZ[i] = z;
        posAttr.setXYZ(i, x, y, z);

        headW[i] = computeHeadWeight(u, v);
        armW[i] = computeWaveArmWeight(u, v);
        const fl = computeFloaterWeight(u, v);
        floatW[i] = fl.weight;
        floatPhase[i] = fl.phase;

        const px = clamp(Math.round(u * (processed.gridW - 1)), 0, processed.gridW - 1);
        const py = clamp(Math.round(v * (processed.gridH - 1)), 0, processed.gridH - 1);
        vAlpha[i] = processed.alphaGrid[py * processed.gridW + px];
      }

      // Cull transparent background triangles
      const oldIndex = geo.getIndex();
      if (oldIndex) {
        const oldArr = oldIndex.array;
        const keptIndices: number[] = [];
        for (let i = 0; i < oldArr.length; i += 3) {
          const a = oldArr[i];
          const b = oldArr[i + 1];
          const c = oldArr[i + 2];
          if (vAlpha[a] > 0.01 || vAlpha[b] > 0.01 || vAlpha[c] > 0.01) {
            keptIndices.push(a, b, c);
          }
        }
        geo.setIndex(keptIndices);
      }

      const uniforms = {
        uBaseMap: { value: processed.baseTexture },
        uSocketMask: { value: processed.socketMaskTexture },
        uLeftPupil: { value: new THREE.Vector2(LEFT_PUPIL_REST.u, LEFT_PUPIL_REST.v) },
        uRightPupil: { value: new THREE.Vector2(RIGHT_PUPIL_REST.u, RIGHT_PUPIL_REST.v) },
        uPupilScale: { value: 1.0 },
        uBlink: { value: 0.0 },
      };

      const shaderMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      });
      disposables.push(shaderMat);

      const reliefMesh = new THREE.Mesh(geo, shaderMat);
      root.add(reliefMesh);

      const [neckX, neckY] = uvToWorld(0.49, 0.48);
      const neckZ = computeReliefZ(0.49, 0.48);
      const [shoulderX, shoulderY] = uvToWorld(0.58, 0.52);

      const headEuler = new THREE.Euler();
      const headQuat = new THREE.Quaternion();
      const vTemp = new THREE.Vector3();

      updateDeformation = (dt: number) => {
        const t = state.time;
        const now = performance.now();

        let target = state.gazeTarget;
        if (now - state.lastPointerAt > IDLE_AFTER_MS) {
          target = {
            x: Math.sin(t * 0.55) * 0.45,
            y: Math.sin(t * 0.8 + 1) * 0.18,
          };
        }

        state.eyeGaze.x = damp(state.eyeGaze.x, target.x, 16, dt);
        state.eyeGaze.y = damp(state.eyeGaze.y, target.y, 16, dt);
        state.headGaze.x = damp(state.headGaze.x, target.x, 5.5, dt);
        state.headGaze.y = damp(state.headGaze.y, target.y, 5.5, dt);
        state.yaw = damp(state.yaw, state.yawTarget, 8, dt);
        state.pitch = damp(state.pitch, state.pitchTarget, 8, dt);

        state.waveT += dt;
        state.hopT += dt;
        state.boopT += dt;
        state.widenT += dt;
        if (state.blinkT < 0.15) state.blinkT += dt;
        else if (t >= state.nextBlinkAt) {
          state.blinkT = 0;
          state.nextBlinkAt = t + (Math.random() < 0.2 ? 0.26 : 2.6 + Math.random() * 3.0);
        }

        const wave = state.waveT < WAVE_SECONDS ? Math.sin((Math.PI * state.waveT) / WAVE_SECONDS) : 0;
        const hop = state.hopT < HOP_SECONDS ? Math.sin((Math.PI * state.hopT) / HOP_SECONDS) * 0.18 : 0;
        const widen = state.widenT < 0.55 ? Math.sin((Math.PI * state.widenT) / 0.55) : 0;
        const blink = state.blinkT < 0.15 ? Math.sin((Math.PI * state.blinkT) / 0.15) : 0;
        const boopAmp = Math.exp(-5.5 * state.boopT);
        const squash = Math.sin(state.boopT * 18) * boopAmp * 0.085;

        // Whole-character float, hop, breathing, and separate idle vs user-drag 3D rotation
        const breathY = Math.sin(t * 1.15) * 0.035;
        const idleYaw = state.dragging ? 0 : Math.sin(t * 0.65) * 0.055;
        const breathScale = 1 + Math.sin(t * 1.4) * 0.006;
        root.position.y = breathY + hop;
        root.scale.set(breathScale, 2 - breathScale, 1);
        root.rotation.y = state.yaw + idleYaw + state.headGaze.x * 0.08;
        root.rotation.x = state.pitch + state.headGaze.y * 0.05;

        // 3D Head rotation around neck pivot
        const headPitch = state.headGaze.y * 0.24 + Math.sin(t * 0.9) * 0.012;
        const headYaw = state.headGaze.x * 0.36;
        const headRoll = -state.headGaze.x * 0.09 + Math.sin(t * 0.8) * 0.014;
        headEuler.set(headPitch, headYaw, headRoll, 'YXZ');
        headQuat.setFromEuler(headEuler);

        // Waving right arm angle
        const waveAngle = Math.sin(t * 1.4) * 0.025 + Math.sin(t * 12) * 0.20 * wave;
        const cosWave = Math.cos(waveAngle);
        const sinWave = Math.sin(waveAngle);

        for (let i = 0; i < vCount; i++) {
          let x = baseX[i];
          let y = baseY[i];
          let z = baseZ[i];

          const hw = headW[i];
          if (hw > 0.0001) {
            vTemp.set(x - neckX, y - neckY, z - neckZ);
            vTemp.x *= 1 + squash * 0.65 * hw;
            vTemp.y *= 1 - squash * 0.85 * hw;
            vTemp.applyQuaternion(headQuat);
            x = x + (neckX + vTemp.x - x) * hw;
            y = y + (neckY + vTemp.y - y) * hw;
            z = z + (neckZ + vTemp.z - z) * hw;
          }

          const aw = armW[i];
          if (aw > 0.0001) {
            const dx = x - shoulderX;
            const dy = y - shoulderY;
            const rx = dx * cosWave - dy * sinWave;
            const ry = dx * sinWave + dy * cosWave;
            x = x + (shoulderX + rx - x) * aw;
            y = y + (shoulderY + ry - y) * aw;
          }

          const fw = floatW[i];
          if (fw > 0.0001) {
            const ph = floatPhase[i];
            y += Math.sin(t * 1.3 + ph) * 0.04 * fw;
            z += Math.cos(t * 1.1 + ph) * 0.05 * fw;
          }

          posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;

        // Update shader pupil UV positions inside the dark cocoa sockets
        const g = limitToUnitCircle(state.eyeGaze);
        // Reach in UV space so the pupils can travel across the entire dark cocoa socket
        const reachU = 0.026;
        const reachV = 0.020;

        const clampToSocket = (u: number, v: number, su: number, sv: number): [number, number] => {
          const maxRu = 0.033;
          const maxRv = 0.024;
          const du = (u - su) / maxRu;
          const dv = (v - sv) / maxRv;
          const len = Math.hypot(du, dv);
          if (len <= 1) return [u, v];
          return [su + (du / len) * maxRu, sv + (dv / len) * maxRv];
        };

        const [lu, lv] = clampToSocket(
          LEFT_PUPIL_REST.u + g.x * reachU,
          LEFT_PUPIL_REST.v + g.y * reachV,
          LEFT_SOCKET_CENTER.u,
          LEFT_SOCKET_CENTER.v,
        );
        const [ru, rv] = clampToSocket(
          RIGHT_PUPIL_REST.u + g.x * reachU,
          RIGHT_PUPIL_REST.v + g.y * reachV,
          RIGHT_SOCKET_CENTER.u,
          RIGHT_SOCKET_CENTER.v,
        );

        const ambientGlowPulse = 1 + Math.sin(t * 2.2) * 0.035;
        uniforms.uLeftPupil.value.set(lu, lv);
        uniforms.uRightPupil.value.set(ru, rv);
        uniforms.uPupilScale.value = ambientGlowPulse + 0.24 * widen;
        uniforms.uBlink.value = blink * 0.95;
      };

      updateDeformation(0);
      drawFrame();
      syncRunning();
      } catch {
        // If canvas/image/shader setup fails, let the parent retain the portrait fallback.
        if (!cancelled) onErrorRef.current?.();
      }
    };

    img.onerror = () => {
      if (!cancelled) onErrorRef.current?.();
    };
    img.src = '/assets/pip_avatar_cloud.png';

    // Pointer & Click Interactions ----------------------------------------
    const onWindowPointerMove = (event: PointerEvent) => {
      state.gazeTarget = pointerToGaze(event.clientX, event.clientY, canvas.getBoundingClientRect(), 0.9);
      state.lastPointerAt = performance.now();

      if (state.dragging) {
        state.yawTarget = clamp(state.dragStartYaw + (event.clientX - state.dragStartX) * 0.008, -0.55, 0.55);
        state.pitchTarget = clamp((event.clientY - state.dragStartY) * 0.004, -0.25, 0.25);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.dragStartX = event.clientX;
      state.dragStartY = event.clientY;
      state.dragStartYaw = state.yawTarget;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {}

      const bounds = canvas.getBoundingClientRect();
      const u = (event.clientX - bounds.left) / Math.max(1, bounds.width);
      const v = (event.clientY - bounds.top) / Math.max(1, bounds.height);

      if (computeHeadWeight(u, v) > 0.35) {
        boop();
      } else {
        greet();
      }
    };

    const releaseDrag = () => {
      state.dragging = false;
      state.yawTarget = 0;
      state.pitchTarget = 0;
    };

    const onDocumentLeave = () => {
      state.gazeTarget = { x: 0, y: 0 };
      state.lastPointerAt = performance.now() - IDLE_AFTER_MS + 1500;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      onErrorRef.current?.();
    };

    if (motionAllowed) {
      window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', releaseDrag);
      canvas.addEventListener('pointercancel', releaseDrag);
      canvas.addEventListener('lostpointercapture', releaseDrag);
      document.documentElement.addEventListener('mouseleave', onDocumentLeave);
    }
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelled = true;
      apiRef.current = null;
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', syncRunning);
      window.removeEventListener('pointermove', onWindowPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', releaseDrag);
      canvas.removeEventListener('pointercancel', releaseDrag);
      canvas.removeEventListener('lostpointercapture', releaseDrag);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.documentElement.removeEventListener('mouseleave', onDocumentLeave);

      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [motionAllowed]);

  useEffect(() => {
    if (isWaving) apiRef.current?.greet();
  }, [isWaving]);

  return <div ref={containerRef} className="pip-3d-canvas" aria-hidden="true" />;
};

export default Pip3DScene;
