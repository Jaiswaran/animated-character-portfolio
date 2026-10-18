/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A small procedural WebGL character, drawn locally with sphere geometry.
 * No remote model files, 3D packages, or external runtime assets are required.
 */
import React, { useEffect, useRef, useState } from 'react';

interface Pip3DCharacterProps {
  motionAllowed: boolean;
  isWaving: boolean;
}

type Vec3 = [number, number, number];
type Mat4 = Float32Array;

interface Part {
  position: Vec3;
  scale: Vec3;
  color: Vec3;
  rotationZ?: number;
  gaze?: 'left' | 'right';
  group?: 'hand';
  emissive?: number;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

function identity(): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b[col * 4] +
        a[4 + row] * b[col * 4 + 1] +
        a[8 + row] * b[col * 4 + 2] +
        a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function translation(x: number, y: number, z: number): Mat4 {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

function scaling(x: number, y: number, z: number): Mat4 {
  const m = identity();
  m[0] = x;
  m[5] = y;
  m[10] = z;
  return m;
}

function rotateX(angle: number): Mat4 {
  const m = identity();
  const c = Math.cos(angle), s = Math.sin(angle);
  m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
  return m;
}

function rotateY(angle: number): Mat4 {
  const m = identity();
  const c = Math.cos(angle), s = Math.sin(angle);
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  return m;
}

function rotateZ(angle: number): Mat4 {
  const m = identity();
  const c = Math.cos(angle), s = Math.sin(angle);
  m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
  return m;
}

function perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
  let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let length = Math.hypot(zx, zy, zz) || 1;
  zx /= length; zy /= length; zz /= length;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  length = Math.hypot(xx, xy, xz) || 1;
  xx /= length; xy /= length; xz /= length;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
  ]);
}

function createSphere(stacks = 14, slices = 18) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let stack = 0; stack <= stacks; stack++) {
    const phi = Math.PI * stack / stacks;
    const y = Math.cos(phi);
    const ring = Math.sin(phi);
    for (let slice = 0; slice <= slices; slice++) {
      const theta = 2 * Math.PI * slice / slices;
      const x = ring * Math.cos(theta);
      const z = ring * Math.sin(theta);
      positions.push(x, y, z);
      normals.push(x, y, z);
    }
  }

  for (let stack = 0; stack < stacks; stack++) {
    for (let slice = 0; slice < slices; slice++) {
      const first = stack * (slices + 1) + slice;
      const second = first + slices + 1;
      // Counter-clockwise outward winding keeps the sphere visible with back-face culling.
      indices.push(first, first + 1, second, second, first + 1, second + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create the character shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uProjection;
    uniform mat4 uView;
    uniform mat4 uModel;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vWorldPosition = world.xyz;
      vNormal = normalize(mat3(uModel) * aNormal);
      gl_Position = uProjection * uView * world;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec3 uColor;
    uniform vec3 uLightPosition;
    uniform float uEmissive;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
      vec3 viewDirection = normalize(vec3(0.0, 0.25, 5.6) - vWorldPosition);
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 24.0) * 0.22;
      float lighting = 0.46 + diffuse * 0.63;
      vec3 color = uColor * lighting + vec3(specular);
      color += uColor * uEmissive;
      gl_FragColor = vec4(min(color, vec3(1.0)), 1.0);
    }
  `;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create the character program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Character program linking failed.';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

const cream: Vec3 = [0.98, 0.91, 0.80];
const porcelain: Vec3 = [1.00, 0.965, 0.90];
const blush: Vec3 = [0.94, 0.62, 0.68];
const pink: Vec3 = [0.91, 0.54, 0.65];
const cocoa: Vec3 = [0.22, 0.12, 0.105];
const gold: Vec3 = [1.00, 0.72, 0.22];
const lavender: Vec3 = [0.77, 0.66, 0.84];
const pajama: Vec3 = [0.96, 0.84, 0.70];
const white: Vec3 = [1.00, 0.98, 0.92];

function makePart(position: Vec3, scale: Vec3, color: Vec3, extra: Partial<Part> = {}): Part {
  return { position, scale, color, ...extra };
}

function makeCharacterParts(): Part[] {
  const parts: Part[] = [];
  const add = (position: Vec3, scale: Vec3, color: Vec3, extra: Partial<Part> = {}) =>
    parts.push(makePart(position, scale, color, extra));

  // Puffy cloud cushion behind Pip.
  add([0, -1.02, -0.08], [0.58, 0.24, 0.28], white);
  add([-0.43, -0.98, 0.00], [0.34, 0.24, 0.25], white);
  add([0.43, -0.98, 0.00], [0.34, 0.24, 0.25], white);
  add([-0.71, -1.04, -0.01], [0.24, 0.17, 0.20], white);
  add([0.70, -1.03, -0.01], [0.25, 0.18, 0.20], white);
  add([-0.25, -0.83, -0.02], [0.37, 0.20, 0.23], white);
  add([0.25, -0.83, -0.02], [0.37, 0.20, 0.23], white);

  // Pajamas, seated legs, and tiny feet.
  add([0, -0.43, 0.00], [0.47, 0.51, 0.33], pajama);
  add([-0.25, -0.73, 0.17], [0.27, 0.22, 0.28], pajama);
  add([0.25, -0.73, 0.17], [0.27, 0.22, 0.28], pajama);
  add([-0.25, -0.79, 0.40], [0.15, 0.12, 0.035], blush);
  add([0.25, -0.79, 0.40], [0.15, 0.12, 0.035], blush);
  // Heart-like pajama buttons and gentle pattern marks.
  add([0.00, -0.28, 0.335], [0.052, 0.052, 0.018], pink);
  add([0.10, -0.52, 0.31], [0.045, 0.04, 0.018], blush);
  add([-0.15, -0.39, 0.31], [0.042, 0.035, 0.018], blush);
  add([0.22, -0.34, 0.30], [0.038, 0.035, 0.018], blush);
  add([-0.27, -0.55, 0.25], [0.04, 0.032, 0.018], blush);

  // Left arm rests over Pip's tummy; right arm is the waving arm.
  add([-0.43, -0.37, 0.03], [0.19, 0.16, 0.22], pajama, { rotationZ: -0.65 });
  add([-0.49, -0.49, 0.20], [0.15, 0.12, 0.14], porcelain);
  add([0.43, -0.26, 0.04], [0.20, 0.15, 0.22], pajama, { rotationZ: -0.62 });
  add([0.56, -0.08, 0.12], [0.15, 0.18, 0.16], pajama, { rotationZ: -0.66 });
  add([0.67, 0.10, 0.18], [0.145, 0.14, 0.10], porcelain, { group: 'hand' });
  add([0.60, 0.20, 0.20], [0.052, 0.09, 0.055], porcelain, { rotationZ: -0.28, group: 'hand' });
  add([0.66, 0.23, 0.22], [0.052, 0.095, 0.055], porcelain, { rotationZ: -0.12, group: 'hand' });
  add([0.72, 0.21, 0.20], [0.05, 0.085, 0.05], porcelain, { rotationZ: 0.12, group: 'hand' });
  add([0.76, 0.15, 0.18], [0.045, 0.07, 0.05], porcelain, { rotationZ: 0.35, group: 'hand' });

  // Large porcelain skull, eye sockets, luminous eyes, blush, nose, and smile.
  add([0, 0.68, 0.00], [0.76, 0.78, 0.54], porcelain);
  add([-0.31, 0.78, 0.475], [0.205, 0.255, 0.085], cocoa);
  add([0.31, 0.78, 0.475], [0.205, 0.255, 0.085], cocoa);
  // Eye positions are adjusted at draw time, while sockets remain still.
  add([-0.31, 0.78, 0.548], [0.095, 0.12, 0.042], gold, { gaze: 'left', emissive: 0.20 });
  add([0.31, 0.78, 0.548], [0.095, 0.12, 0.042], gold, { gaze: 'right', emissive: 0.20 });
  add([-0.31, 0.785, 0.584], [0.038, 0.052, 0.018], cocoa, { gaze: 'left' });
  add([0.31, 0.785, 0.584], [0.038, 0.052, 0.018], cocoa, { gaze: 'right' });
  add([-0.34, 0.835, 0.602], [0.022, 0.028, 0.012], white, { gaze: 'left', emissive: 0.12 });
  add([0.28, 0.835, 0.602], [0.022, 0.028, 0.012], white, { gaze: 'right', emissive: 0.12 });
  add([-0.52, 0.53, 0.42], [0.12, 0.07, 0.035], blush);
  add([0.52, 0.53, 0.42], [0.12, 0.07, 0.035], blush);
  add([-0.55, 0.53, 0.456], [0.014, 0.032, 0.012], pink, { rotationZ: 0.25 });
  add([-0.51, 0.51, 0.456], [0.014, 0.032, 0.012], pink, { rotationZ: 0.25 });
  add([0.51, 0.51, 0.456], [0.014, 0.032, 0.012], pink, { rotationZ: -0.25 });
  add([0.55, 0.53, 0.456], [0.014, 0.032, 0.012], pink, { rotationZ: -0.25 });
  add([-0.04, 0.62, 0.545], [0.028, 0.036, 0.026], cocoa);
  add([0.04, 0.62, 0.545], [0.028, 0.036, 0.026], cocoa);

  // A curved smile built from tiny connected 3D beads.
  const smilePoints: Vec3[] = [
    [-0.12, 0.43, 0.505], [-0.08, 0.405, 0.523], [-0.03, 0.392, 0.535],
    [0.03, 0.392, 0.535], [0.08, 0.405, 0.523], [0.12, 0.43, 0.505],
  ];
  smilePoints.forEach((point) => add(point, [0.018, 0.018, 0.014], cocoa));

  // Soft nightcap and floppy tassel.
  add([0, 1.35, -0.015], [0.70, 0.27, 0.51], cream);
  add([0, 1.22, 0.04], [0.69, 0.10, 0.53], [1.0, 0.95, 0.84]);
  add([-0.52, 1.36, 0.02], [0.29, 0.14, 0.28], cream, { rotationZ: -0.38 });
  add([-0.75, 1.17, 0.02], [0.16, 0.15, 0.16], [0.83, 0.75, 0.64]);
  add([-0.85, 1.12, 0.03], [0.11, 0.12, 0.12], [0.89, 0.82, 0.71]);
  // Tiny star-like gold embroidery on the cap.
  [[-0.44, 1.48], [-0.18, 1.54], [0.08, 1.54], [0.32, 1.48], [0.51, 1.40], [0.02, 1.38]].forEach(([x, y]) => {
    add([x, y, 0.40], [0.038, 0.044, 0.018], gold, { emissive: 0.08 });
  });

  // A plush pink bow above the left eye.
  add([-0.43, 1.13, 0.49], [0.15, 0.09, 0.045], pink, { rotationZ: -0.52 });
  add([-0.23, 1.15, 0.49], [0.15, 0.09, 0.045], pink, { rotationZ: 0.48 });
  add([-0.33, 1.15, 0.53], [0.065, 0.065, 0.045], blush);

  // Crescent moon, sleepy stars and floating dream motes.
  add([1.02, 1.47, -0.08], [0.29, 0.34, 0.12], [0.98, 0.76, 0.39], { emissive: 0.06 });
  add([1.12, 1.59, 0.015], [0.25, 0.29, 0.13], [0.98, 0.91, 0.80]);
  add([0.98, 1.50, 0.063], [0.035, 0.012, 0.012], cocoa, { rotationZ: -0.18 });
  add([1.05, 1.49, 0.063], [0.035, 0.012, 0.012], cocoa, { rotationZ: 0.18 });
  add([-1.03, 0.10, -0.08], [0.12, 0.13, 0.08], gold, { emissive: 0.08 });
  add([1.12, 0.13, -0.08], [0.13, 0.14, 0.08], gold, { emissive: 0.08 });
  add([-0.93, -0.40, -0.08], [0.085, 0.09, 0.07], lavender);
  add([1.13, 0.78, -0.08], [0.08, 0.09, 0.07], lavender);
  add([-0.75, 0.78, -0.08], [0.055, 0.06, 0.05], gold, { emissive: 0.10 });
  add([0.79, -0.49, -0.08], [0.06, 0.065, 0.05], gold);
  return parts;
}

export const Pip3DCharacter: React.FC<Pip3DCharacterProps> = ({ motionAllowed, isWaving }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<(time: number) => void>(() => undefined);
  const startRef = useRef<() => void>(() => undefined);
  const stopRef = useRef<() => void>(() => undefined);
  const reducedRef = useRef(!motionAllowed);
  const wavingRef = useRef(isWaving);
  const waveStartedRef = useRef(0);
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    reducedRef.current = !motionAllowed;
    if (motionAllowed) startRef.current();
    else {
      stopRef.current();
      drawRef.current(performance.now());
    }
  }, [motionAllowed]);

  useEffect(() => {
    wavingRef.current = isWaving;
    if (isWaving) waveStartedRef.current = performance.now();
    drawRef.current(performance.now());
    if (!reducedRef.current) startRef.current();
    else window.setTimeout(() => drawRef.current(performance.now()), 500);
  }, [isWaving]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let gl: WebGLRenderingContext | null = null;
    let frameId: number | null = null;
    let disposed = false;
    let gazeX = 0;
    let gazeY = 0;
    let targetX = 0;
    let targetY = 0;
    let currentTime = 0;
    let lastDrawAt = 0;
    let isInView = true;
    let resizeObserver: ResizeObserver | null = null;
    let visibilityObserver: IntersectionObserver | null = null;

    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL is unavailable on this device.');

      const program = createProgram(gl);
      const sphere = createSphere();
      const positionBuffer = gl.createBuffer();
      const normalBuffer = gl.createBuffer();
      const indexBuffer = gl.createBuffer();
      if (!positionBuffer || !normalBuffer || !indexBuffer) throw new Error('Could not allocate the character geometry.');

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'aPosition');
      const normalLocation = gl.getAttribLocation(program, 'aNormal');
      const projectionLocation = gl.getUniformLocation(program, 'uProjection');
      const viewLocation = gl.getUniformLocation(program, 'uView');
      const modelLocation = gl.getUniformLocation(program, 'uModel');
      const colorLocation = gl.getUniformLocation(program, 'uColor');
      const lightLocation = gl.getUniformLocation(program, 'uLightPosition');
      const emissiveLocation = gl.getUniformLocation(program, 'uEmissive');

      const parts = makeCharacterParts();
      const projection = perspective(42 * Math.PI / 180, 0.82, 0.1, 30);
      const view = lookAt([0, 0.20, 5.65], [0, 0.20, 0], [0, 1, 0]);

      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.clearColor(0, 0, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.enableVertexAttribArray(normalLocation);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

      const resize = () => {
        if (!gl || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      const drawScene = (time: number) => {
        if (!gl || disposed) return;
        resize();
        currentTime = time * 0.001;
        const amount = reducedRef.current ? 1 : 0.16;
        gazeX += (targetX - gazeX) * amount;
        gazeY += (targetY - gazeY) * amount;

        const rect = canvas.getBoundingClientRect();
        const aspect = rect.width / Math.max(1, rect.height);
        const projectionMatrix = perspective(42 * Math.PI / 180, aspect, 0.1, 30);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(viewLocation, false, view);
        gl.uniform3f(lightLocation, -2.5, 3.0, 4.2);

        const bob = reducedRef.current ? 0 : Math.sin(currentTime * 1.55) * 0.025;
        const yaw = reducedRef.current ? 0 : gazeX * 0.10;
        const pitch = reducedRef.current ? 0 : -gazeY * 0.06;
        let global = translation(0, bob, 0);
        global = multiply(global, rotateY(yaw));
        global = multiply(global, rotateX(pitch));

        const waving = wavingRef.current;
        const waveProgress = clamp((time - waveStartedRef.current) / 420, 0, 1);
        const waveAngle = waving
          ? reducedRef.current ? 0.22 : Math.sin(waveProgress * Math.PI * 2) * 0.18
          : 0;
        let handGroup = translation(0.62, 0.08, 0.16);
        handGroup = multiply(handGroup, rotateZ(waveAngle));
        handGroup = multiply(handGroup, translation(-0.62, -0.08, -0.16));

        for (const part of parts) {
          let x = part.position[0];
          let y = part.position[1];
          let z = part.position[2];
          if (part.gaze) {
            const side = part.gaze === 'left' ? -1 : 1;
            x += gazeX * 0.048;
            y -= gazeY * 0.045;
            z += Math.max(0, Math.abs(gazeX) * 0.006);
            // Tiny inward tracking keeps both pupils looking toward the same point.
            x += side * (gazeX * 0.004);
          }

          let local = translation(x, y, z);
          if (part.rotationZ) local = multiply(local, rotateZ(part.rotationZ));
          local = multiply(local, scaling(part.scale[0], part.scale[1], part.scale[2]));
          let model = global;
          if (part.group === 'hand') model = multiply(model, handGroup);
          model = multiply(model, local);

          gl.uniformMatrix4fv(modelLocation, false, model);
          gl.uniform3f(colorLocation, part.color[0], part.color[1], part.color[2]);
          gl.uniform1f(emissiveLocation, part.emissive ?? 0);
          gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
        }
      };

      drawRef.current = drawScene;

      const animate = (time: number) => {
        if (disposed || reducedRef.current || !isInView) {
          frameId = null;
          return;
        }
        // Cap the decorative motion to ~30 FPS to reduce GPU/battery use on phones.
        if (time - lastDrawAt >= 1000 / 30) {
          drawScene(time);
          lastDrawAt = time;
        }
        frameId = window.requestAnimationFrame(animate);
      };
      startRef.current = () => {
        if (disposed || frameId !== null || reducedRef.current || !isInView) return;
        frameId = window.requestAnimationFrame(animate);
      };
      stopRef.current = () => {
        if (frameId !== null) window.cancelAnimationFrame(frameId);
        frameId = null;
      };

      const handlePointerMove = (event: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        targetX = clamp(((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2, -1, 1);
        targetY = clamp((0.5 - (event.clientY - rect.top) / Math.max(1, rect.height)) * 2, -1, 1);
        if (reducedRef.current) drawScene(performance.now());
      };
      const resetGaze = () => {
        targetX = 0;
        targetY = 0;
        if (reducedRef.current) drawScene(performance.now());
      };
      stage.addEventListener('pointermove', handlePointerMove, { passive: true });
      stage.addEventListener('pointerleave', resetGaze, { passive: true });

      visibilityObserver = new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView && !reducedRef.current) startRef.current();
        else {
          stopRef.current();
          if (reducedRef.current) drawScene(performance.now());
        }
      }, { threshold: 0.01 });
      visibilityObserver.observe(stage);

      const handleContextLost = (event: Event) => {
        event.preventDefault();
        setWebglReady(false);
        stopRef.current();
      };
      canvas.addEventListener('webglcontextlost', handleContextLost, false);

      resizeObserver = new ResizeObserver(() => {
        resize();
        if (reducedRef.current) drawScene(performance.now());
      });
      resizeObserver.observe(stage);
      window.addEventListener('resize', resize, { passive: true });

      drawScene(performance.now());
      setWebglReady(true);
      if (!reducedRef.current) startRef.current();

      return () => {
        disposed = true;
        stopRef.current();
        resizeObserver?.disconnect();
        visibilityObserver?.disconnect();
        canvas.removeEventListener('webglcontextlost', handleContextLost, false);
        window.removeEventListener('resize', resize);
        stage.removeEventListener('pointermove', handlePointerMove);
        stage.removeEventListener('pointerleave', resetGaze);
        gl?.deleteBuffer(positionBuffer);
        gl?.deleteBuffer(normalBuffer);
        gl?.deleteBuffer(indexBuffer);
        gl?.deleteProgram(program);
        drawRef.current = () => undefined;
        startRef.current = () => undefined;
        stopRef.current = () => undefined;
      };
    } catch {
      setWebglReady(false);
      return () => {
        disposed = true;
      };
    }
  }, []);

  return (
    <div ref={stageRef} className="pip-3d-stage" aria-hidden="true">
      {!webglReady && (
        <img
          src="/assets/pip_avatar_cloud.png"
          alt=""
          className="pip-3d-fallback"
          loading="eager"
          decoding="async"
        />
      )}
      <canvas ref={canvasRef} className={`pip-3d-canvas${webglReady ? ' is-ready' : ''}`} />
      <div className="pip-3d-orbit pip-3d-orbit-one" />
      <div className="pip-3d-orbit pip-3d-orbit-two" />
    </div>
  );
};
