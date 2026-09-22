import * as THREE from 'three';
import { makeGlassMaterial, makeMetalMaterial, makeCellMaterial, makeEncapsulantMaterial } from '../materials.js';

export function buildManufacturingScene(group, perf) {
  group.clear();
  const layers = [];

  const moduleW = 7.2;
  const moduleD = 4.0;
  const layerT = 0.16;

  // 1. Front glass
  const frontGlass = new THREE.Mesh(
    new THREE.BoxGeometry(moduleW, layerT, moduleD),
    makeGlassMaterial()
  );
  frontGlass.castShadow = perf.shadows;
  frontGlass.userData.layerName = 'Front Glass';
  layers.push({ mesh: frontGlass, name: 'Front Glass', baseY: 0.5, explodeY: 3.4 });

  // 2. Front encapsulant
  const frontEncap = new THREE.Mesh(
    new THREE.BoxGeometry(moduleW - 0.1, layerT * 0.6, moduleD - 0.1),
    makeEncapsulantMaterial()
  );
  frontEncap.castShadow = perf.shadows;
  frontEncap.userData.layerName = 'Front Encapsulant';
  layers.push({ mesh: frontEncap, name: 'Front Encapsulant', baseY: 0.35, explodeY: 2.2 });

  // 3. HJT cell matrix
  const cellGroup = new THREE.Group();
  cellGroup.userData.layerName = 'HJT Cell Matrix';

  const cellSlab = new THREE.Mesh(
    new THREE.BoxGeometry(moduleW - 0.3, layerT * 0.5, moduleD - 0.3),
    makeCellMaterial()
  );
  cellSlab.castShadow = perf.shadows;
  cellGroup.add(cellSlab);

  const cols = perf.tier === 'low' ? 6 : 12;
  const rows = perf.tier === 'low' ? 4 : 8;
  const cw = (moduleW - 0.5) / cols;
  const cd = (moduleD - 0.5) / rows;
  const cellGeo = new THREE.PlaneGeometry(cw * 0.88, cd * 0.88);
  const cellMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a4e,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x0a2a2e,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
  });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const m = new THREE.Mesh(cellGeo, cellMat);
      m.position.set(
        -moduleW / 2 + 0.25 + cw * c + cw / 2,
        0,
        -moduleD / 2 + 0.25 + cd * r + cd / 2
      );
      m.rotation.x = -Math.PI / 2;
      m.userData.isCell = true;
      cellGroup.add(m);
    }
  }
  cellGroup.position.y = 0.2;
  layers.push({ mesh: cellGroup, name: 'HJT Cell Matrix', baseY: 0.2, explodeY: 1.0 });

  // 4. Rear encapsulant
  const rearEncap = new THREE.Mesh(
    new THREE.BoxGeometry(moduleW - 0.1, layerT * 0.6, moduleD - 0.1),
    makeEncapsulantMaterial()
  );
  rearEncap.castShadow = perf.shadows;
  rearEncap.userData.layerName = 'Rear Encapsulant';
  layers.push({ mesh: rearEncap, name: 'Rear Encapsulant', baseY: 0.05, explodeY: -0.8 });

  // 5. Rear glass
  const rearGlass = new THREE.Mesh(
    new THREE.BoxGeometry(moduleW, layerT, moduleD),
    makeGlassMaterial()
  );
  rearGlass.castShadow = perf.shadows;
  rearGlass.userData.layerName = 'Rear Glass';
  layers.push({ mesh: rearGlass, name: 'Rear Glass', baseY: -0.1, explodeY: -2.0 });

  // 6. Aluminum frame (4 bars)
  const frameGroup = new THREE.Group();
  frameGroup.userData.layerName = 'Aluminum Frame';
  const frameMat = makeMetalMaterial(0x3a4a4e);
  frameMat.metalness = 0.85;
  frameMat.roughness = 0.3;
  const fh = 0.34;
  const ft = 0.16;
  const longBar = new THREE.BoxGeometry(moduleW + ft * 2, fh, ft);
  const shortBar = new THREE.BoxGeometry(ft, fh, moduleD + ft * 2);
  const f1 = new THREE.Mesh(longBar, frameMat);
  f1.position.set(0, 0.1, moduleD / 2 + ft / 2);
  const f2 = new THREE.Mesh(longBar, frameMat);
  f2.position.set(0, 0.1, -moduleD / 2 - ft / 2);
  const f3 = new THREE.Mesh(shortBar, frameMat);
  f3.position.set(moduleW / 2 + ft / 2, 0.1, 0);
  const f4 = new THREE.Mesh(shortBar, frameMat);
  f4.position.set(-moduleW / 2 - ft / 2, 0.1, 0);
  frameGroup.add(f1, f2, f3, f4);
  if (perf.shadows) frameGroup.traverse((o) => (o.castShadow = true));
  group.add(frameGroup);
  layers.push({ mesh: frameGroup, name: 'Aluminum Frame', baseY: 0.1, explodeY: -3.2 });

  // Position layers at base
  layers.forEach((l) => {
    l.mesh.position.y = l.baseY;
    group.add(l.mesh);
  });

  group.position.set(0, 0, 0);
  return layers;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function updateManufacturing(group, layers, sectionProgress, time) {
  // Phase 1 (0..0.45): explode layers apart
  // Phase 2 (0.45..0.55): hold exploded for inspection
  // Phase 3 (0.55..1.0): reassemble
  let explode;
  if (sectionProgress < 0.45) {
    const t = sectionProgress / 0.45;
    explode = easeInOutCubic(t);
  } else if (sectionProgress < 0.55) {
    explode = 1;
  } else {
    const t = (1.0 - sectionProgress) / 0.45;
    explode = easeInOutCubic(Math.max(0, t));
  }

  layers.forEach((l, i) => {
    const targetY = THREE.MathUtils.lerp(l.baseY, l.baseY + l.explodeY, explode);
    l.mesh.position.y = THREE.MathUtils.lerp(l.mesh.position.y, targetY, 0.08);
    if (explode > 0.1) {
      l.mesh.position.y += Math.sin(time * 0.4 + i * 0.7) * 0.015 * explode;
    }
  });

  // Controlled rotation: slow drift + slight tilt, never random
  const rotTarget = sectionProgress * 0.5 - 0.1;
  group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, rotTarget, 0.05);
  group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, Math.sin(time * 0.1) * 0.03, 0.05);

  // Cell emissive pulse — subtle, only when visible
  group.traverse((o) => {
    if (o.userData.isCell) {
      const mat = o.material;
      mat.emissiveIntensity = 0.25 + Math.sin(time * 0.6 + o.position.x * 0.2) * 0.1;
    }
  });
}
