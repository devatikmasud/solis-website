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
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.35,
    transparent: true,
    opacity,
  });
}

export function makeGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x2a4a4e,
    metalness: 0.2,
    roughness: 0.08,
    transmission: 0.7,
    thickness: 0.5,
    transparent: true,
    opacity: 0.3,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });
}

export function makeFrameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x3a4a4e,
    metalness: 0.85,
    roughness: 0.3,
    emissive: 0x1a2a2e,
    emissiveIntensity: 0.2,
  });
}

export function makeCellMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x1a3a4e,
    metalness: 0.7,
    roughness: 0.25,
    emissive: 0x0a2a2e,
    emissiveIntensity: 0.3,
  });
}

export function makeEncapsulantMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x2a5a5e,
    metalness: 0.1,
    roughness: 0.4,
    transparent: true,
    opacity: 0.25,
    transmission: 0.5,
    thickness: 0.3,
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

export function makeMetalMaterial(color = 0x1a3a3e) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.9,
    roughness: 0.35,
  });
}

export function makeDarkPanelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x0d2528,
    metalness: 0.5,
    roughness: 0.5,
    emissive: 0x071719,
    emissiveIntensity: 0.1,
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
