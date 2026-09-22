import * as THREE from 'three';
import { makeMetalMaterial, makeDarkPanelMaterial } from '../materials.js';

export function buildSolisScene(group, perf) {
  group.clear();

  // --- Terrain massing ---
  const terrainMat = new THREE.MeshStandardMaterial({ color: 0x0d2528, metalness: 0.1, roughness: 0.95, flatShading: true });
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20, perf.tier === 'low' ? 8 : 20, perf.tier === 'low' ? 6 : 14),
    terrainMat
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -4;
  const pos = terrain.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = Math.sin(x * 0.3) * 0.4 + Math.cos(y * 0.4) * 0.3;
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  if (perf.shadows) terrain.receiveShadow = true;
  group.add(terrain);

  // --- Campus buildings (manufacturing + power) ---
  const buildMat = makeMetalMaterial(0x1a3a3e);
  buildMat.roughness = 0.6;
  const buildings = [
    [0, -3.5, 0, 4, 2.5],
    [5, -3.5, 1, 3, 2],
    [-4, -3.5, -1, 2.5, 1.8],
    [3, -3.5, -3, 2, 1.5],
  ];
  buildings.forEach(([x, y, z, w, h]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), buildMat);
    b.position.set(x, y + h / 2, z);
    b.castShadow = perf.shadows;
    b.receiveShadow = perf.shadows;
    group.add(b);

    const roof = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.9), makeDarkPanelMaterial());
    roof.rotation.x = -Math.PI / 2.2;
    roof.position.set(x, y + h + 0.05, z);
    roof.userData.isSolisPanel = true;
    group.add(roof);
  });

  // --- Solar field surrounding campus ---
  const panelMat = makeDarkPanelMaterial();
  panelMat.emissive = new THREE.Color(0x0a2a2e);
  panelMat.emissiveIntensity = 0.2;
  panelMat.metalness = 0.7;
  panelMat.roughness = 0.25;

  const fieldCount = perf.tier === 'low' ? 12 : 30;
  for (let i = 0; i < fieldCount; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), panelMat);
    const a = (i / fieldCount) * Math.PI * 2;
    const r = 8 + (i % 3) * 2;
    p.position.set(Math.cos(a) * r, -3.2, Math.sin(a) * r);
    p.rotation.x = -Math.PI / 2.2;
    p.userData.isSolisPanel = true;
    group.add(p);
  }

  // --- Pathway / road ---
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x0a1f22, metalness: 0.1, roughness: 0.9 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 16), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -3.8, -2);
  group.add(road);

  // --- Water/reuse basin concept ---
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4e, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.6 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-6, -3.7, 3);
  water.userData.isWater = true;
  group.add(water);

  // --- Energy connection lines (campus to field) ---
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.2 });
  const lineCount = perf.tier === 'low' ? 2 : 4;
  for (let i = 0; i < lineCount; i++) {
    const pts = [];
    for (let j = 0; j < 16; j++) {
      const t = j / 15;
      pts.push(new THREE.Vector3(
        THREE.MathUtils.lerp(0, Math.cos(i * 1.5) * 10, t),
        -3 + Math.sin(t * Math.PI) * 0.5,
        THREE.MathUtils.lerp(0, Math.sin(i * 1.5) * 10, t) - 2
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, lineMat);
    line.userData.isSolisLine = true;
    group.add(line);
  }
}

export function updateSolisScene(group, sectionProgress, time) {
  const rotTarget = sectionProgress * 0.4;
  group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, rotTarget, 0.04);

  group.traverse((o) => {
    if (o.userData.isSolisPanel) {
      const mat = o.material;
      mat.emissiveIntensity = 0.15 + Math.sin(time * 0.5 + o.position.x * 0.2) * 0.08;
    }
    if (o.userData.isWater) {
      const mat = o.material;
      mat.opacity = 0.5 + Math.sin(time * 0.3) * 0.1;
    }
  });
}
