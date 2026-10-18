/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pip, built as a real 3D character with Three.js.
 *
 *  - Eyes: the glowing pupils follow the cursor anywhere on the page (and the finger on touch devices).
 *  - Head: turns and nods toward the pointer, a little slower than the eyes so the gaze leads.
 *  - Touch / click: tap Pip to wave and hop, tap his head to boop it, drag sideways to spin him (he springs back).
 *  - Idle: breathing, floating cloud, random blinks, a slow look-around when nobody is pointing.
 *
 * With prefers-reduced-motion the same model is rendered once as a still frame.
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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

type V3 = [number, number, number];

const CAMERA_FOV = 30;
const CONTENT_WIDTH = 5.6;
const MIN_CAMERA_DISTANCE = 13.8;
const EYE_REACH_X = 0.15;
const EYE_REACH_Y = 0.17;
const IDLE_AFTER_MS = 4000;
const WAVE_SECONDS = 1.6;
const HOP_SECONDS = 0.5;

interface Eye {
  group: THREE.Group;
  pupil: THREE.Group;
  rest: Gaze2D;
}

interface PipRig {
  root: THREE.Group;
  body: THREE.Group;
  cloud: THREE.Group;
  headPivot: THREE.Group;
  headContent: THREE.Group;
  eyes: Eye[];
  rightArm: THREE.Group;
  rightHand: THREE.Group;
  leftArm: THREE.Group;
  hitTargets: THREE.Object3D[];
  floaters: { object: THREE.Object3D; baseY: number; phase: number; spin: number }[];
  dispose: () => void;
}

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

function buildPip(): PipRig {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const geo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const mat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const unit = geo(new THREE.SphereGeometry(1, 40, 28));

  // Materials -----------------------------------------------------------
  const white = mat(new THREE.MeshPhysicalMaterial({ color: 0xfffaf4, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.4 }));
  const cream = mat(new THREE.MeshStandardMaterial({ color: 0xf8ebcc, roughness: 0.85 }));
  const capCream = mat(new THREE.MeshStandardMaterial({ color: 0xf5ecd2, roughness: 0.9, side: THREE.DoubleSide }));
  const cuffCream = mat(new THREE.MeshStandardMaterial({ color: 0xf1e2c0, roughness: 0.9 }));
  const pink = mat(new THREE.MeshStandardMaterial({ color: 0xf0b0c6, roughness: 0.6 }));
  const bowPink = mat(new THREE.MeshStandardMaterial({ color: 0xf5a6c1, roughness: 0.45 }));
  const socketDark = mat(new THREE.MeshPhysicalMaterial({ color: 0x2c1815, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 }));
  const feature = mat(new THREE.MeshStandardMaterial({ color: 0x3a2320, roughness: 0.5 }));
  const cheek = mat(new THREE.MeshStandardMaterial({ color: 0xf59db3, roughness: 0.8, transparent: true, opacity: 0.8 }));
  const glow = mat(new THREE.MeshBasicMaterial({ color: 0xffc552 }));
  const glowCore = mat(new THREE.MeshBasicMaterial({ color: 0xfff4c4 }));
  const halo = mat(new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  const gold = mat(new THREE.MeshStandardMaterial({ color: 0xe9c777, roughness: 0.55 }));
  const moonGold = mat(new THREE.MeshStandardMaterial({ color: 0xf6d98e, roughness: 0.55 }));
  const lavender = mat(new THREE.MeshStandardMaterial({ color: 0xcdb9e6, roughness: 0.55 }));
  const cloudWhite = mat(new THREE.MeshStandardMaterial({ color: 0xfaf0f6, roughness: 1 }));
  const pom = mat(new THREE.MeshStandardMaterial({ color: 0xcdb08c, roughness: 1 }));

  // Helpers -------------------------------------------------------------
  const add = (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: V3 = [0, 0, 0],
    scale: V3 = [1, 1, 1],
    rotation: V3 = [0, 0, 0],
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    parent.add(mesh);
    return mesh;
  };

  const onEllipsoid = (center: V3, radii: V3, lon: number, lat: number) => {
    const p = new THREE.Vector3(
      center[0] + radii[0] * Math.cos(lat) * Math.sin(lon),
      center[1] + radii[1] * Math.sin(lat),
      center[2] + radii[2] * Math.cos(lat) * Math.cos(lon),
    );
    const n = new THREE.Vector3(
      (p.x - center[0]) / (radii[0] * radii[0]),
      (p.y - center[1]) / (radii[1] * radii[1]),
      (p.z - center[2]) / (radii[2] * radii[2]),
    ).normalize();
    return { p, n };
  };

  /** Put `object` at p, with its +Z axis pointing along n (parents are still at identity here, so this is local). */
  const faceOutward = (object: THREE.Object3D, p: THREE.Vector3, n: THREE.Vector3) => {
    object.position.copy(p);
    object.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
  };

  const makeStarGeometry = (outer: number, inner: number, depth: number) => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.12,
      bevelThickness: 0.1,
      bevelSegments: 4,
      curveSegments: 8,
    });
    g.center();
    return geo(g);
  };

  const starGeo = makeStarGeometry(1, 0.52, 0.18);

  const root = new THREE.Group();

  // Cloud ---------------------------------------------------------------
  const cloud = new THREE.Group();
  cloud.position.set(0, -2.55, 0);
  root.add(cloud);
  const puffs: [number, number, number, number][] = [
    [0, 0.05, 0.1, 1.25],
    [-1.25, -0.15, 0.15, 0.85],
    [1.25, -0.15, 0.1, 0.85],
    [-0.65, -0.1, 0.75, 0.8],
    [0.65, -0.1, 0.75, 0.8],
    [-1.65, -0.3, -0.2, 0.6],
    [1.65, -0.3, -0.2, 0.6],
    [0, -0.1, -0.8, 1.0],
    [-0.9, -0.1, -0.6, 0.8],
    [0.9, -0.1, -0.6, 0.8],
    [0, -0.25, 0.9, 0.7],
  ];
  for (const [x, y, z, r] of puffs) add(cloud, unit, cloudWhite, [x, y, z], [r, r * 0.72, r]);

  // Body ----------------------------------------------------------------
  const body = new THREE.Group();
  root.add(body);

  const torsoCenter: V3 = [0, -0.55, 0];
  const torsoRadii: V3 = [0.78, 0.85, 0.7];
  add(body, unit, cream, torsoCenter, torsoRadii);

  // Pink buttons down the front
  for (const lat of [0.5, 0.2, -0.1, -0.4]) {
    const { p, n } = onEllipsoid(torsoCenter, torsoRadii, 0, lat);
    const button = add(body, unit, pink, [0, 0, 0], [0.05, 0.05, 0.035]);
    faceOutward(button, p.clone().addScaledVector(n, 0.005), n);
  }

  // Little pink hearts on the pyjamas
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0.25, 0.25);
  heartShape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
  heartShape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
  heartShape.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
  heartShape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
  heartShape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
  heartShape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
  const heartGeo = geo(new THREE.ShapeGeometry(heartShape, 12));
  heartGeo.translate(-0.25, -0.47, 0);
  heartGeo.scale(0.17, 0.17, 0.17);
  const hearts: [number, number][] = [
    [-0.75, 0.35], [-0.5, -0.05], [-0.9, -0.35], [-0.3, -0.6],
    [0.55, 0.3], [0.8, -0.1], [0.45, -0.45], [0.95, 0.5],
  ];
  hearts.forEach(([lon, lat], i) => {
    const { p, n } = onEllipsoid(torsoCenter, torsoRadii, lon, lat);
    const heart = new THREE.Mesh(heartGeo, pink);
    faceOutward(heart, p.clone().addScaledVector(n, 0.01), n);
    heart.rotateZ((i % 2 === 0 ? 1 : -1) * 0.25);
    body.add(heart);
  });

  // Legs with pink soles
  for (const side of [-1, 1]) {
    add(body, unit, cream, [side * 0.48, -1.28, 0.62], [0.34, 0.33, 0.62], [0, side * 0.15, 0]);
    add(body, geo(new THREE.TorusGeometry(0.3, 0.05, 12, 28)), pink, [side * 0.56, -1.28, 1.02], [1, 1, 1], [0, side * 0.15, 0]);
    add(body, unit, pink, [side * 0.6, -1.27, 1.22], [0.27, 0.28, 0.1], [-0.12, side * 0.15, 0]);
  }

  // Arms ----------------------------------------------------------------
  const makeArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.72, -0.02, 0.05);
    add(arm, unit, cream, [side * 0.42, 0, 0], [0.5, 0.2, 0.2]);
    add(arm, geo(new THREE.TorusGeometry(0.19, 0.055, 12, 28)), pink, [side * 0.86, 0, 0], [1, 1, 1], [0, Math.PI / 2, 0]);
    const hand = new THREE.Group();
    hand.position.set(side * 1.04, 0, 0);
    add(hand, unit, white, [0, 0, 0], [0.24, 0.2, 0.17]);
    add(hand, unit, white, [side * 0.02, 0.13, 0.1], [0.09, 0.09, 0.09]);
    arm.add(hand);
    body.add(arm);
    return { arm, hand };
  };
  const right = makeArm(1);
  const left = makeArm(-1);
  right.arm.rotation.z = 0.95; // raised, waving
  left.arm.rotation.z = 1.25; // resting on the lap
  left.arm.rotation.y = 0.5;

  // Head ----------------------------------------------------------------
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.2, 0);
  root.add(headPivot);
  const headContent = new THREE.Group();
  headContent.position.set(0, 0.75, 0);
  headPivot.add(headContent);

  const headMesh = add(headContent, unit, white, [0, 0, 0], [1.08, 0.98, 1.0]);
  const jaw = add(headContent, unit, white, [0, -0.42, 0.04], [0.93, 0.58, 0.88]);

  // Eyes: dark sockets with glowing pupils
  const eyes: Eye[] = [];
  for (const side of [-1, 1]) {
    const group = new THREE.Group();
    group.position.set(side * 0.5, -0.06, 0.735);
    group.rotation.y = side * 0.48;
    add(group, unit, socketDark, [0, 0, 0], [0.52, 0.6, 0.26]);

    const pupil = new THREE.Group();
    add(pupil, unit, glow, [0, 0, 0], [0.1, 0.1, 0.055]);
    add(pupil, unit, glowCore, [-0.03, 0.035, 0.03], [0.032, 0.032, 0.02]);
    add(pupil, unit, halo, [0, 0, 0], [0.22, 0.22, 0.09]);
    group.add(pupil);
    headContent.add(group);
    eyes.push({ group, pupil, rest: { x: 0, y: side < 0 ? -0.12 : 0.02 } });
  }

  // Nose, smile, blush
  add(headContent, unit, feature, [0, -0.3, 0.95], [0.05, 0.075, 0.04]);
  add(headContent, geo(new THREE.TorusGeometry(0.15, 0.018, 8, 28, Math.PI)), feature, [0.05, -0.5, 0.875], [1, 1, 1], [0, 0, Math.PI]);
  for (const side of [-1, 1]) {
    add(headContent, unit, cheek, [side * 0.66, -0.33, 0.75], [0.2, 0.13, 0.05], [0.05, side * 0.62, 0]);
  }

  // Nightcap ------------------------------------------------------------
  const cap = new THREE.Group();
  cap.position.set(0, 0.05, 0);
  cap.rotation.set(-0.18, 0, 0.1);
  headContent.add(cap);

  const capRadius = 1.1;
  const capPolar = 1.15;
  const dome = add(cap, geo(new THREE.SphereGeometry(capRadius, 48, 32, 0, Math.PI * 2, 0, capPolar)), capCream);
  const brimY = capRadius * Math.cos(capPolar);
  const brimR = capRadius * Math.sin(capPolar);
  add(cap, geo(new THREE.TorusGeometry(brimR, 0.11, 16, 72)), cuffCream, [0, brimY, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

  // Gold stars and tiny dots printed on the cap
  const capSpots: [number, number, number][] = [
    [0.3, 0.6, 0.13], [0.5, 2.0, 0.12], [0.6, 3.6, 0.14], [0.8, 5.0, 0.13], [0.9, 1.0, 0.12],
    [0.95, 2.8, 0.14], [0.45, 4.2, 0.11], [0.75, 0.2, 0.12], [1.0, 4.0, 0.12], [1.05, 5.6, 0.11], [0.62, 5.8, 0.1],
  ];
  for (const [theta, phi, size] of capSpots) {
    const p = new THREE.Vector3(
      Math.sin(theta) * Math.sin(phi) * (capRadius + 0.012),
      Math.cos(theta) * (capRadius + 0.012),
      Math.sin(theta) * Math.cos(phi) * (capRadius + 0.012),
    );
    const star = new THREE.Mesh(starGeo, gold);
    star.scale.set(size, size, size * 0.6);
    faceOutward(star, p, p.clone().normalize());
    star.rotateZ(phi * 1.7);
    cap.add(star);
  }
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 16; i++) {
    const theta = 0.2 + rand() * 0.95;
    const phi = rand() * Math.PI * 2;
    const p = new THREE.Vector3(
      Math.sin(theta) * Math.sin(phi) * (capRadius + 0.005),
      Math.cos(theta) * (capRadius + 0.005),
      Math.sin(theta) * Math.cos(phi) * (capRadius + 0.005),
    );
    const dot = add(cap, unit, gold, [0, 0, 0], [0.035, 0.035, 0.012]);
    faceOutward(dot, p, p.clone().normalize());
  }

  // Drooping tail with a fuzzy pom-pom
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.0, -0.05),
    new THREE.Vector3(-0.55, 1.2, -0.2),
    new THREE.Vector3(-1.05, 1.05, -0.25),
    new THREE.Vector3(-1.35, 0.7, -0.2),
    new THREE.Vector3(-1.45, 0.35, -0.1),
  ]);
  const tailSegments = 12;
  for (let i = 0; i <= tailSegments; i++) {
    const t = i / tailSegments;
    const point = tailCurve.getPoint(t);
    const radius = 0.36 + (0.17 - 0.36) * t;
    add(cap, unit, capCream, [point.x, point.y, point.z], [radius, radius, radius]);
  }
  const pomGeo = geo(new THREE.IcosahedronGeometry(0.25, 3));
  const pomPositions = pomGeo.attributes.position;
  for (let i = 0; i < pomPositions.count; i++) {
    const jitter = 1 + (rand() - 0.5) * 0.09;
    pomPositions.setXYZ(i, pomPositions.getX(i) * jitter, pomPositions.getY(i) * jitter, pomPositions.getZ(i) * jitter);
  }
  pomGeo.computeVertexNormals();
  add(cap, pomGeo, pom, [-1.5, 0.18, -0.05]);

  // Pink bow on the cuff
  {
    const bow = new THREE.Group();
    const bowPoint = new THREE.Vector3(-0.89, brimY, 0.63);
    faceOutward(bow, bowPoint, new THREE.Vector3(-0.82, 0.1, 0.58).normalize());
    bow.rotateZ(0.4);
    add(bow, unit, bowPink, [0, 0, 0], [0.1, 0.1, 0.08]);
    add(bow, unit, bowPink, [0.24, 0, 0], [0.26, 0.15, 0.08], [0, 0, 0.4]);
    add(bow, unit, bowPink, [-0.24, 0, 0], [0.26, 0.15, 0.08], [0, 0, -0.4]);
    add(bow, unit, bowPink, [0.08, -0.17, 0], [0.07, 0.2, 0.05], [0, 0, 0.25]);
    add(bow, unit, bowPink, [-0.08, -0.17, 0], [0.07, 0.2, 0.05], [0, 0, -0.25]);
    cap.add(bow);
  }

  // Floating moon (with a sleepy face) and stars --------------------------
  const floaters: PipRig['floaters'] = [];

  const moonShape = new THREE.Shape();
  moonShape.absarc(0, 0, 0.5, Math.PI / 2, -Math.PI / 2, true);
  moonShape.absarc(-0.22, 0, 0.5463, -1.1555, 1.1555, false);
  const moonGeo = new THREE.ExtrudeGeometry(moonShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 4,
    curveSegments: 32,
  });
  moonGeo.translate(0, 0, -0.07);
  geo(moonGeo);
  const moon = new THREE.Group();
  moon.position.set(2.0, 2.55, -0.4);
  moon.scale.set(1.15, 1.15, 1.15);
  moon.rotation.z = 0.25;
  add(moon, moonGeo, moonGold);
  add(moon, geo(new THREE.TorusGeometry(0.07, 0.012, 8, 20, Math.PI)), feature, [0.4, 0.07, 0.115], [1, 1, 1], [0, 0, Math.PI]);
  add(moon, unit, cheek, [0.4, -0.07, 0.1], [0.06, 0.045, 0.02]);
  root.add(moon);
  floaters.push({ object: moon, baseY: moon.position.y, phase: 0.4, spin: 0.15 });

  const floatingStars: [number, number, number, number, 'gold' | 'lav'][] = [
    [2.25, 0.85, 0.2, 0.26, 'gold'],
    [2.1, 1.85, -0.3, 0.18, 'lav'],
    [-2.3, -0.35, 0.3, 0.27, 'gold'],
    [-2.15, -1.2, 0.1, 0.22, 'lav'],
    [2.3, -0.55, 0.1, 0.2, 'lav'],
    [-1.7, 0.55, -0.2, 0.1, 'lav'],
    [1.85, -0.15, 0.2, 0.08, 'gold'],
    [-2.0, 0.05, 0.2, 0.07, 'gold'],
    [1.6, 2.15, 0.0, 0.12, 'gold'],
  ];
  floatingStars.forEach(([x, y, z, size, tint], i) => {
    const star = new THREE.Mesh(starGeo, tint === 'gold' ? gold : lavender);
    star.position.set(x, y, z);
    star.scale.set(size, size, size * 0.8);
    root.add(star);
    floaters.push({ object: star, baseY: y, phase: i * 1.3, spin: 0.4 + (i % 3) * 0.15 });
  });

  return {
    root,
    body,
    cloud,
    headPivot,
    headContent,
    eyes,
    rightArm: right.arm,
    rightHand: right.hand,
    leftArm: left.arm,
    hitTargets: [headMesh, jaw, dome],
    floaters,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onErrorRef.current?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.style.touchAction = 'pan-y';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envTexture = pmrem.fromScene(environment, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.85;

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.5);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xc7b6ff, 0.9);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 0.8, 0.1, 100);

    const rig = buildPip();
    scene.add(rig.root);

    // Animation state ---------------------------------------------------
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
      nextBlinkAt: 2.5,
    };

    const greet = () => {
      if (state.waveT < 0.6) return; // a tap fires both pointerdown and click; only wave once
      state.waveT = 0;
      state.hopT = 0;
      state.widenT = 0;
    };
    const boop = () => {
      state.boopT = 0;
      state.widenT = 0;
      state.blinkT = 99;
    };
    apiRef.current = { greet };

    const applyPose = (dt: number) => {
      const t = state.time;
      const now = performance.now();

      // Where is Pip looking?
      let target = state.gazeTarget;
      if (now - state.lastPointerAt > IDLE_AFTER_MS) {
        target = { x: Math.sin(t * 0.55) * 0.5, y: Math.sin(t * 0.8 + 1) * 0.18 };
      }
      state.eyeGaze.x = damp(state.eyeGaze.x, target.x, 14, dt);
      state.eyeGaze.y = damp(state.eyeGaze.y, target.y, 14, dt);
      state.headGaze.x = damp(state.headGaze.x, target.x, 4.5, dt);
      state.headGaze.y = damp(state.headGaze.y, target.y, 4.5, dt);
      state.yaw = damp(state.yaw, state.yawTarget, 8, dt);
      state.pitch = damp(state.pitch, state.pitchTarget, 8, dt);

      // Timers
      state.waveT += dt;
      state.hopT += dt;
      state.boopT += dt;
      state.widenT += dt;
      if (state.blinkT < 0.16) state.blinkT += dt;
      else if (t >= state.nextBlinkAt) {
        state.blinkT = 0;
        state.nextBlinkAt = t + (Math.random() < 0.2 ? 0.25 : 2.5 + Math.random() * 3);
      }

      const wave = state.waveT < WAVE_SECONDS ? Math.sin((Math.PI * state.waveT) / WAVE_SECONDS) : 0;
      const hop = state.hopT < HOP_SECONDS ? Math.sin((Math.PI * state.hopT) / HOP_SECONDS) * 0.32 : 0;
      const widen = state.widenT < 0.55 ? Math.sin((Math.PI * state.widenT) / 0.55) : 0;
      const blink = state.blinkT < 0.16 ? Math.sin((Math.PI * state.blinkT) / 0.16) : 0;
      const boopAmp = Math.exp(-5 * state.boopT);
      const squash = Math.sin(state.boopT * 18) * boopAmp * 0.12;

      // Whole character: float, hop, spin when dragged
      rig.root.position.y = Math.sin(t * 1.1) * 0.09 + hop;
      rig.root.rotation.y = state.yaw;
      rig.root.rotation.x = state.pitch;
      rig.cloud.position.y = -2.55 + Math.sin(t * 1.1 + 0.6) * 0.03;
      rig.body.scale.y = 1 + Math.sin(t * 1.6) * 0.012 - hop * 0.05;

      // Head follows the cursor a little behind the eyes
      rig.headPivot.rotation.set(
        state.headGaze.y * 0.3 + Math.sin(t * 0.9) * 0.015,
        state.headGaze.x * 0.5,
        -state.headGaze.x * 0.06 + Math.sin(t * 0.8) * 0.02,
      );
      rig.headContent.scale.set(1 + squash * 0.7, 1 - squash, 1 + squash * 0.7);

      // Eyes: pupils slide inside the sockets toward the cursor
      for (const eye of rig.eyes) {
        const g = limitToUnitCircle({
          x: state.eyeGaze.x * 0.9 + eye.rest.x,
          y: state.eyeGaze.y * 0.9 + eye.rest.y,
        });
        const px = g.x * EYE_REACH_X;
        const py = -g.y * EYE_REACH_Y;
        const nx = px / 0.52;
        const ny = py / 0.6;
        const surfaceZ = 0.26 * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        eye.pupil.position.set(px, py, surfaceZ - 0.02);
        const pupilScale = 1 + 0.35 * widen;
        eye.pupil.scale.set(pupilScale, pupilScale, pupilScale);
        eye.group.scale.set(1 + 0.06 * widen, (1 + 0.08 * widen) * (1 - blink * 0.92), 1);
      }

      // Arms
      rig.rightArm.rotation.z = 0.95 + Math.sin(t * 1.4) * 0.05 + Math.sin(t * 11) * 0.28 * wave;
      rig.rightHand.rotation.z = Math.sin(t * 11 + 1) * 0.5 * wave + Math.sin(t * 1.4) * 0.05;
      rig.leftArm.rotation.z = 1.25 + Math.sin(t * 1.6) * 0.015;

      // Moon and stars drift
      rig.floaters.forEach((f, i) => {
        f.object.position.y = f.baseY + Math.sin(t * 1.2 + f.phase) * 0.07;
        f.object.rotation.y = Math.sin(t * 0.7 + f.phase) * f.spin;
        if (i > 0) f.object.rotation.z = Math.sin(t * 0.9 + f.phase) * 0.18;
      });
    };

    // Rendering ---------------------------------------------------------
    let frameId = 0;
    let running = false;
    let last = 0;
    let firstFrameDrawn = false;

    const drawFrame = () => {
      renderer.render(scene, camera);
      if (!firstFrameDrawn) {
        firstFrameDrawn = true;
        onReadyRef.current?.();
      }
    };

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      state.time += dt;
      applyPose(dt);
      drawFrame();
    };

    const start = () => {
      if (running || !motionAllowed) return;
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
      camera.position.set(0, -0.15, distance);
      camera.lookAt(0, -0.15, 0);
      camera.updateProjectionMatrix();
      if (!motionAllowed) drawFrame();
    };

    resize();
    applyPose(0);
    drawFrame();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Visibility: don't burn battery while Pip is off-screen or the tab is hidden
    let onScreen = true;
    const syncRunning = () => (onScreen && !document.hidden ? start() : stop());
    const intersection = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      syncRunning();
    });
    intersection.observe(container);
    document.addEventListener('visibilitychange', syncRunning);
    syncRunning();

    // Input -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const onWindowPointerMove = (event: PointerEvent) => {
      state.gazeTarget = pointerToGaze(event.clientX, event.clientY, canvas.getBoundingClientRect(), 0.9);
      state.lastPointerAt = performance.now();

      if (state.dragging) {
        state.yawTarget = clamp(state.dragStartYaw + (event.clientX - state.dragStartX) * 0.012, -1.1, 1.1);
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
      } catch {
        /* pointer capture is a nicety, not a requirement */
      }

      const bounds = canvas.getBoundingClientRect();
      pointerNdc.set(
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
        -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1),
      );
      raycaster.setFromCamera(pointerNdc, camera);
      const hitHead = raycaster.intersectObjects(rig.hitTargets, false).length > 0;
      if (hitHead) boop();
      else greet();
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

      rig.dispose();
      envTexture.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [motionAllowed]);

  // The hero's own greeting (click, tap, Enter, Space) also makes the 3D Pip wave.
  useEffect(() => {
    if (isWaving) apiRef.current?.greet();
  }, [isWaving]);

  return <div ref={containerRef} className="pip-3d-canvas" aria-hidden="true" />;
};

export default Pip3DScene;
