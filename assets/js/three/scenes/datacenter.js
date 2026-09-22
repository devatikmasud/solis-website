import * as THREE from 'three';
import { makeMetalMaterial } from '../materials.js';

export function buildDataCenterScene(group, perf) {
  group.clear();

  const rackMat = makeMetalMaterial(0x122a2e);
  rackMat.roughness = 0.5;

  const serverMat = new THREE.MeshStandardMaterial({
    color: 0x0d2528,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0x0a2a2e,
    emissiveIntensity: 0.25,
  });

  const rows = perf.tier === 'low' ? 2 : perf.tier === 'medium' ? 3 : 4;
  const racksPerRow = perf.tier === 'low' ? 4 : perf.tier === 'medium' ? 6 : 8;
  const serversPerRack = perf.tier === 'low' ? 4 : 6;

  const rackW = 1.2;
  const rackH = 4;
  const rackD = 1.0;
  const aisleWidth = 2.2;

  for (let r = 0; r < rows; r++) {
    const z = (r - rows / 2) * (rackD + aisleWidth);
    for (let i = 0; i < racksPerRow; i++) {
      const x = (i - racksPerRow / 2) * (rackW + 0.3);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(rackW, rackH, rackD), rackMat);
      frame.position.set(x, rackH / 2 - 4, z);
      frame.castShadow = perf.shadows;
      group.add(frame);

      for (let s = 0; s < serversPerRack; s++) {
        const server = new THREE.Mesh(
          new THREE.BoxGeometry(rackW * 0.85, 0.18, rackD * 0.85),
          serverMat
        );
        server.position.set(x, 0.3 + s * 0.55 - 4 + rackH / 2, z + rackD / 2 + 0.01);
        server.userData.isServer = true;
        group.add(server);

        const led = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0x4ab8a0 })
        );
        led.position.set(x + rackW * 0.35, server.position.y, z + rackD / 2 + 0.03);
        led.userData.isLed = true;
        group.add(led);
      }
    }
  }

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: 0x0a1f22, metalness: 0.3, roughness: 0.6 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  if (perf.shadows) floor.receiveShadow = true;
  group.add(floor);

  // Ceiling cable trays
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x1a3a3e, metalness: 0.8, roughness: 0.4 });
  const trayCount = perf.tier === 'low' ? 3 : 6;
  for (let i = 0; i < trayCount; i++) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 50), cableMat);
    tray.position.set((i - trayCount / 2) * 1.5, 2, -10);
    group.add(tray);
  }

  // Cooling units (end of corridors)
  const coolerMat = new THREE.MeshStandardMaterial({
    color: 0x1a4a4e,
    metalness: 0.6,
    roughness: 0.4,
    emissive: 0x0a2a2e,
    emissiveIntensity: 0.2,
  });
  for (let i = 0; i < 2; i++) {
    const cu = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.8), coolerMat);
    cu.position.set(0, -1.5, -12 - i * 4);
    cu.userData.isCooler = true;
    group.add(cu);
  }

  // --- Data flow lines (connectivity visualization) ---
  const flowMat = new THREE.LineBasicMaterial({ color: 0x4ab8a0, transparent: true, opacity: 0.25 });
  const flowCount = perf.tier === 'low' ? 3 : 6;
  for (let i = 0; i < flowCount; i++) {
    const pts = [];
    for (let j = 0; j < 30; j++) {
      pts.push(new THREE.Vector3(
        -12 + j * 0.8,
        -1 + Math.sin(j * 0.3 + i * 1.5) * 0.4,
        -4 + (i - flowCount / 2) * 2.2
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, flowMat);
    line.userData.isFlowLine = true;
    group.add(line);
  }

  // --- Power connection from outside (conduit) ---
  const conduitMat = makeMetalMaterial(0x1a3a3e);
  conduitMat.roughness = 0.5;
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 16, 8), conduitMat);
  conduit.rotation.z = Math.PI / 2;
  conduit.position.set(8, -2, -4);
  group.add(conduit);
}

export function updateDataCenterScene(group, sectionProgress, time) {
  // No rotation — corridor feel, camera moves through
  group.traverse((o) => {
    if (o.userData.isServer) {
      const mat = o.material;
      mat.emissiveIntensity = 0.2 + Math.sin(time * 1.2 + o.position.x + o.position.y) * 0.15;
    }
    if (o.userData.isLed) {
      const mat = o.material;
      const phase = (o.position.x + o.position.y + time * 1.5) % 3;
      mat.color.setHex(phase < 0.3 ? 0x4ab8a0 : phase < 1.5 ? 0x3a8a8e : 0xf97316);
    }
    if (o.userData.isCooler) {
      const mat = o.material;
      mat.emissiveIntensity = 0.15 + Math.sin(time * 0.8 + o.position.z) * 0.1;
    }
  });
}
