import * as THREE from 'three';
import { makeMetalMaterial, makeDarkPanelMaterial, makeEmberMaterial } from '../materials.js';

export function buildHeroScene(group, perf) {
  group.clear();

  // --- Subtle industrial skyline (low, distant, dark) ---
  const structMat = makeMetalMaterial(0x0d2528);
  structMat.roughness = 0.7;
  structMat.metalness = 0.3;

  const count = perf.tier === 'low' ? 4 : perf.tier === 'medium' ? 7 : 10;
  for (let i = 0; i < count; i++) {
    const h = 3 + Math.random() * 6;
    const w = 0.5 + Math.random() * 0.8;
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), structMat);
    const a = (i / count) * Math.PI * 2 + 0.3;
    const r = 14 + Math.random() * 10;
    s.position.set(Math.cos(a) * r, h / 2 - 5, Math.sin(a) * r - 6);
    s.castShadow = perf.shadows;
    group.add(s);
  }

  // --- Central solar panel cluster (the hero focal point) ---
  const panelMat = makeDarkPanelMaterial();

  const panelCount = 3;
  for (let i = 0; i < panelCount; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), panelMat);
    p.position.set((i - 1) * 3.4, -1.5 + i * 0.5, -3);
    p.rotation.x = -Math.PI / 2.4;
    p.rotation.z = (i - 1) * 0.12;
    p.castShadow = perf.shadows;
    p.userData.isHeroPanel = true;
    group.add(p);

    // Support strut
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 1.6, 5),
      makeMetalMaterial(0x1a3a3e)
    );
    strut.position.set(p.position.x, p.position.y - 1.0, p.position.z + 0.3);
    strut.rotation.x = 0.4;
    group.add(strut);
  }

  // --- Controlled energy flow lines (subtle, restrained) ---
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.25,
  });
  const lineCount = perf.tier === 'low' ? 2 : 4;
  for (let i = 0; i < lineCount; i++) {
    const pts = [];
    for (let j = 0; j < 20; j++) {
      pts.push(
        new THREE.Vector3(
          -10 + j * 1.0,
          Math.sin(j * 0.4 + i * 1.2) * 0.5 - 2.5,
          -5 + Math.cos(j * 0.3 + i) * 1.0
        )
      );
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, lineMat);
    line.userData.isEnergyLine = true;
    group.add(line);
  }

  // --- Atmospheric depth particles (very subtle) ---
  const pCount = perf.tier === 'low' ? 30 : perf.tier === 'medium' ? 80 : 150;
  const pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(pCount * 3);
  const velocities = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 36;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
    velocities[i] = 0.02 + Math.random() * 0.04;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x3a6a6e,
    size: 0.04,
    transparent: true,
    opacity: 0.3,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.userData.isAtmosphere = true;
  points.userData.velocities = velocities;
  group.add(points);

  // --- Ember accent points (very few, subtle glow) ---
  const emberCount = perf.tier === 'low' ? 3 : 6;
  const emberGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const emberMat = makeEmberMaterial(0.6);
  for (let i = 0; i < emberCount; i++) {
    const e = new THREE.Mesh(emberGeo, emberMat);
    e.position.set(
      (Math.random() - 0.5) * 16,
      -2 + Math.random() * 4,
      -4 + (Math.random() - 0.5) * 8
    );
    e.userData.isEmber = true;
    e.userData.phase = Math.random() * Math.PI * 2;
    group.add(e);
  }
}

export function updateHeroScene(group, sectionProgress, time) {
  // Very slow rotation — barely perceptible
  group.rotation.y = time * 0.015;

  group.traverse((o) => {
    const m = o;

    // Atmosphere drift
    if (m.userData.isAtmosphere) {
      m.rotation.y = time * 0.01;
      const pos = m.geometry.attributes.position;
      const vel = m.userData.velocities;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + vel[i] * 0.016;
        if (y > 8) y = -8;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Ember pulse
    if (m.userData.isEmber) {
      const mat = m.material;
      const phase = m.userData.phase;
      mat.emissiveIntensity = 0.4 + Math.sin(time * 0.8 + phase) * 0.2;
      m.position.y += Math.sin(time * 0.3 + phase) * 0.003;
    }

    // Panel subtle emissive pulse
    if (m.userData.isHeroPanel) {
      const mat = m.material;
      mat.emissiveIntensity = 0.15 + Math.sin(time * 0.5 + m.position.x) * 0.08;
    }
  });
}
