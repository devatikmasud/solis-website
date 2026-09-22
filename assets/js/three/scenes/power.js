import * as THREE from 'three';
import { makeMetalMaterial, makeDarkPanelMaterial } from '../materials.js';

export function buildPowerScene(group, perf) {
  group.clear();

  // --- Solar field: rows of tilted panels ---
  const panelGeo = new THREE.PlaneGeometry(2.4, 1.4);
  const panelMat = makeDarkPanelMaterial();

  const rows = perf.tier === 'low' ? 3 : perf.tier === 'medium' ? 5 : 7;
  const cols = perf.tier === 'low' ? 6 : perf.tier === 'medium' ? 10 : 14;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = new THREE.Mesh(panelGeo, panelMat);
      p.position.set(
        (c - cols / 2) * 3.0,
        -3.5 + r * -1.2,
        (r - rows / 2) * 2.4 - 10
      );
      p.rotation.x = -Math.PI / 2.4;
      p.castShadow = perf.shadows;
      p.receiveShadow = perf.shadows;
      p.userData.isFieldPanel = true;
      group.add(p);

      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6),
        makeMetalMaterial(0x1a3a3e)
      );
      post.position.set(p.position.x, p.position.y - 1.0, p.position.z);
      group.add(post);
    }
  }

  // --- Transmission towers ---
  const towerCount = perf.tier === 'low' ? 2 : 4;
  for (let i = 0; i < towerCount; i++) {
    const tower = buildTransmissionTower();
    tower.position.set((i - towerCount / 2) * 14 + 4, -4, -6 - i * 3);
    tower.scale.setScalar(0.8);
    group.add(tower);
  }

  // --- Energy flow lines (restrained orange) ---
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.35 });
  const linePts = [];
  for (let i = 0; i < 24; i++) {
    linePts.push(new THREE.Vector3(-20 + i * 1.8, -2 + Math.sin(i * 0.4) * 0.3, -8));
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
  const line = new THREE.Line(lineGeo, lineMat);
  line.userData.isEnergyLine = true;
  group.add(line);

  const linePts2 = [];
  for (let i = 0; i < 24; i++) {
    linePts2.push(new THREE.Vector3(-20 + i * 1.8, 0 + Math.cos(i * 0.35) * 0.3, -9));
  }
  const lineGeo2 = new THREE.BufferGeometry().setFromPoints(linePts2);
  const line2 = new THREE.Line(lineGeo2, lineMat.clone());
  line2.userData.isEnergyLine = true;
  group.add(line2);

  // --- Distant terrain blocks ---
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x0d2528,
    metalness: 0.1,
    roughness: 0.95,
    flatShading: true,
  });
  const terrainCount = perf.tier === 'low' ? 4 : 8;
  for (let i = 0; i < terrainCount; i++) {
    const h = 1 + Math.random() * 3;
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(4 + Math.random() * 6, h, 4 + Math.random() * 6),
      terrainMat
    );
    b.position.set((Math.random() - 0.5) * 60, -4 - h / 2, -20 - Math.random() * 30);
    group.add(b);
  }

  // --- Power infrastructure: inverter boxes between field and towers ---
  const invMat = makeMetalMaterial(0x1a3a3e);
  invMat.roughness = 0.5;
  for (let i = 0; i < 3; i++) {
    const inv = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.8), invMat);
    inv.position.set(-4 + i * 4, -3.2, -6);
    inv.castShadow = perf.shadows;
    group.add(inv);

    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    led.position.set(inv.position.x, inv.position.y + 0.7, inv.position.z + 0.41);
    led.userData.isInvLed = true;
    group.add(led);
  }
}

function buildTransmissionTower() {
  const g = new THREE.Group();
  const mat = makeMetalMaterial(0x1a3a3e);
  mat.metalness = 0.8;
  const h = 6;
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, h, 5), mat);
    const a = (i / 4) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.7, h / 2 - 4, Math.sin(a) * 0.7);
    leg.rotation.x = Math.sin(a) * 0.12;
    leg.rotation.z = Math.cos(a) * 0.12;
    g.add(leg);
  }
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 0.1), mat);
    arm.position.y = h - 4 + i * 1.4;
    g.add(arm);
  }
  return g;
}

export function updatePowerScene(group, sectionProgress, time) {
  const rotTarget = sectionProgress * 0.3;
  group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, rotTarget, 0.04);

  group.traverse((o) => {
    if (o.userData.isFieldPanel) {
      const mat = o.material;
      mat.emissiveIntensity = 0.15 + Math.sin(time * 0.6 + o.position.x * 0.2 + o.position.z * 0.15) * 0.1;
    }
    if (o.userData.isInvLed) {
      const mat = o.material;
      mat.color.setHex(0xf97316);
      const phase = (time * 1.5 + o.position.x) % 2;
      o.scale.setScalar(phase < 0.2 ? 1.3 : 1.0);
    }
  });
}
