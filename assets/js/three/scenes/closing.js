import * as THREE from 'three';
import { makeMetalMaterial } from '../materials.js';

export function buildClosingScene(group, perf) {
  group.clear();

  // Convergence: a single ember monolith
  const mono = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 8, 0.8),
    new THREE.MeshStandardMaterial({
      color: 0x0d2528,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0xf97316,
      emissiveIntensity: 0.55,
    })
  );
  mono.position.set(0, 0, -2);
  mono.castShadow = perf.shadows;
  group.add(mono);

  // Ember ring at base
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.05, 10, 48), makeMetalMaterial(0xf97316));
  ring.material.emissive = new THREE.Color(0xea580c);
  ring.material.emissiveIntensity = 1.1;
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -3.5;
  ring.position.z = -2;
  group.add(ring);

  // Outward radiating lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.3 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pts = [
      new THREE.Vector3(0, -3.5, -2),
      new THREE.Vector3(Math.cos(a) * 12, -3.5, Math.sin(a) * 12 - 2),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, lineMat));
  }
}

export function updateClosingScene(group, sectionProgress, time) {
  group.rotation.y = time * 0.05;
  group.traverse((o) => {
    if (o.isMesh && o.geometry instanceof THREE.BoxGeometry) {
      const mat = o.material;
      mat.emissiveIntensity = 0.45 + Math.sin(time * 0.8) * 0.25;
    }
  });
}
