import * as THREE from 'three';
import { makeMetalMaterial, makeGlassMaterial, makeCellMaterial } from '../materials.js';

export function buildRecyclingScene(group, perf) {
  group.clear();

  // --- Central circular ring (circularity symbol) ---
  const ringMat = makeMetalMaterial(0x3a4a4e);
  ringMat.emissive = new THREE.Color(0xea580c);
  ringMat.emissiveIntensity = 0.3;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.08, 12, 64), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.userData.isRing = true;
  group.add(ring);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.04, 10, 64), makeMetalMaterial(0x2a4a4e));
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);

  // --- Solar module entering the process (top of scene) ---
  const moduleGroup = new THREE.Group();
  moduleGroup.userData.isInputModule = true;

  const modW = 3.0;
  const modD = 1.8;
  const modMat = makeGlassMaterial();
  const modFrame = makeMetalMaterial(0x3a4a4e);
  modFrame.metalness = 0.85;

  const modGlass = new THREE.Mesh(new THREE.BoxGeometry(modW, 0.08, modD), modMat);
  moduleGroup.add(modGlass);

  const modCell = new THREE.Mesh(new THREE.BoxGeometry(modW - 0.2, 0.04, modD - 0.2), makeCellMaterial());
  modCell.position.y = -0.06;
  moduleGroup.add(modCell);

  const fb = 0.12;
  const fLong = new THREE.Mesh(new THREE.BoxGeometry(modW + fb * 2, 0.15, fb), modFrame);
  fLong.position.z = modD / 2 + fb / 2;
  const fLong2 = new THREE.Mesh(new THREE.BoxGeometry(modW + fb * 2, 0.15, fb), modFrame);
  fLong2.position.z = -modD / 2 - fb / 2;
  const fShort = new THREE.Mesh(new THREE.BoxGeometry(fb, 0.15, modD + fb * 2), modFrame);
  fShort.position.x = modW / 2 + fb / 2;
  const fShort2 = new THREE.Mesh(new THREE.BoxGeometry(fb, 0.15, modD + fb * 2), modFrame);
  fShort2.position.x = -modW / 2 - fb / 2;
  moduleGroup.add(fLong, fLong2, fShort, fShort2);

  moduleGroup.position.set(0, 4, -2);
  moduleGroup.rotation.x = -0.3;
  group.add(moduleGroup);

  // --- Separation streams (3 material streams) ---
  const count = perf.tier === 'low' ? 30 : perf.tier === 'medium' ? 80 : 140;
  const particles = [];
  const pGeo = new THREE.SphereGeometry(0.07, 6, 6);

  const streamColors = [0x2a5a5e, 0x1a3a4e, 0x3a4a4e];
  const streamEmissive = [0x0a2a2e, 0x0a2a2e, 0x1a2a2e];

  for (let i = 0; i < count; i++) {
    const stream = i % 3;
    const pMat = new THREE.MeshStandardMaterial({
      color: streamColors[stream],
      emissive: streamEmissive[stream],
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const m = new THREE.Mesh(pGeo, pMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.5 + Math.random() * 3.5;
    const yBase = 2 + Math.random() * 2;
    m.position.set(Math.cos(angle) * radius, yBase, Math.sin(angle) * radius - 2);
    m.userData.streamColor = streamColors[stream];
    group.add(m);
    particles.push({ mesh: m, angle, radius, yBase, speed: 0.2 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2, stream });
  }

  // --- Recovery vessel at bottom ---
  const vessel = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.5, 2, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1a3a3e, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })
  );
  vessel.position.set(0, -3.5, -2);
  group.add(vessel);

  // --- Collected material at base (recovered) ---
  const collectedMat = makeMetalMaterial(0x2a4a4e);
  collectedMat.emissive = new THREE.Color(0x0a2a2e);
  collectedMat.emissiveIntensity = 0.15;
  for (let i = 0; i < 4; i++) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), collectedMat);
    block.position.set((i - 1.5) * 1.2, -3.2, -2 + (i % 2) * 0.5);
    block.userData.isCollected = true;
    group.add(block);
  }

  return particles;
}

export function updateRecyclingScene(group, particles, sectionProgress, time) {
  group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, time * 0.06, 0.05);

  group.traverse((o) => {
    if (o.userData.isInputModule) {
      const mod = o;
      const targetY = 4 - sectionProgress * 6;
      mod.position.y = THREE.MathUtils.lerp(mod.position.y, targetY, 0.04);
      mod.rotation.x = THREE.MathUtils.lerp(mod.rotation.x, -0.3 + sectionProgress * 0.5, 0.04);
      mod.traverse((child) => {
        if (child.isMesh && child.material) {
          const mat = child.material;
          if (mat.transparent && typeof mat.opacity === 'number') {
            mat.opacity = Math.max(0.1, 1 - sectionProgress * 0.8);
          }
        }
      });
    }

    if (o.userData.isRing) {
      const mat = o.material;
      mat.emissiveIntensity = 0.25 + Math.sin(time * 0.5) * 0.15;
    }

    if (o.userData.isCollected) {
      const mat = o.material;
      mat.emissiveIntensity = 0.1 + sectionProgress * 0.3 + Math.sin(time * 0.6 + o.position.x) * 0.05;
    }
  });

  particles.forEach((p) => {
    p.angle += p.speed * 0.008;
    const yTarget = p.yBase - sectionProgress * (p.yBase + 3);
    const y = yTarget + Math.sin(time * 0.4 + p.phase) * 0.4;
    p.mesh.position.set(Math.cos(p.angle) * p.radius, y, Math.sin(p.angle) * p.radius - 2);
    const scale = 0.5 + sectionProgress * 0.5 + Math.sin(time + p.phase) * 0.2;
    p.mesh.scale.setScalar(scale);

    const mat = p.mesh.material;
    mat.opacity = 0.4 + Math.sin(time * 0.5 + p.phase) * 0.2 + sectionProgress * 0.3;
  });
}
