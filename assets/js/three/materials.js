import * as THREE from 'three';

export function makeGridTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#071719';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(249,115,22,0.06)';
  ctx.lineWidth = 1;
  const step = size / 16;
  for (let i = 0; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

export function makeEmberMaterial(opacity = 0.9) {
  return new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.6,
    metalness: 0.4,
    roughness: 0.3,
    envMapIntensity: 1,
    transparent: true,
    opacity,
  });
}

export function makeGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x9fd4de,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.92,
    thickness: 0.4,
    transparent: true,
    opacity: 0.55,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
  });
}

export function makeFrameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8a97a0,
    metalness: 0.9,
    roughness: 0.28,
    emissive: 0x0d1216,
    emissiveIntensity: 0.08,
    envMapIntensity: 1.3,
  });
}

export function makeCellMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x0e2a52,
    metalness: 0.75,
    roughness: 0.2,
    emissive: 0x081c3a,
    emissiveIntensity: 0.35,
    envMapIntensity: 1.3,
  });
}

export function makeEncapsulantMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xbfe6ee,
    metalness: 0,
    roughness: 0.3,
    transparent: true,
    opacity: 0.22,
    transmission: 0.6,
    thickness: 0.3,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
}

export function makeConcreteMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x122a2e,
    metalness: 0.2,
    roughness: 0.85,
  });
}

export function makeMetalMaterial(color = 0x2a4650) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.9,
    roughness: 0.32,
    envMapIntensity: 1.2,
  });
}

export function makeDarkPanelMaterial() {
  // Photovoltaic-glass blue — deliberately shifted away from the ink/teal
  // background+fog hue so panels read as a distinct object instead of
  // dissolving into the environment. metalness+envMapIntensity give it a
  // real specular sheen once scene.environment is set (see Engine.js).
  return new THREE.MeshStandardMaterial({
    color: 0x14335f,
    metalness: 0.65,
    roughness: 0.22,
    emissive: 0x040d1c,
    emissiveIntensity: 0.12,
    envMapIntensity: 1.2,
  });
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
