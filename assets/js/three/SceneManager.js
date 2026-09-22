import * as THREE from 'three';
import { makeGridTexture } from './materials.js';

export const CHAPTERS = [
  { index: 0, id: 'hero', bounds: { start: 0.0, end: 0.12 } },
  { index: 1, id: 'manufacturing', bounds: { start: 0.12, end: 0.34 } },
  { index: 2, id: 'power', bounds: { start: 0.34, end: 0.52 } },
  { index: 3, id: 'datacenter', bounds: { start: 0.52, end: 0.68 } },
  { index: 4, id: 'recycling', bounds: { start: 0.68, end: 0.82 } },
  { index: 5, id: 'solis', bounds: { start: 0.82, end: 0.9 } },
  { index: 6, id: 'closing', bounds: { start: 0.9, end: 1.0 } },
];

export function sectionForProgress(p) {
  for (const c of CHAPTERS) {
    if (p >= c.bounds.start && p <= c.bounds.end) return c;
  }
  return CHAPTERS[CHAPTERS.length - 1];
}

export function sectionProgress(p, c) {
  const span = c.bounds.end - c.bounds.start;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (p - c.bounds.start) / span));
}

export class SceneManager {
  constructor(perf) {
    this.perf = perf;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x071719);
    this.fog = new THREE.FogExp2(0x071719, 0.022);
    this.scene.fog = this.fog;

    this.heroGroup = new THREE.Group();
    this.manufacturingGroup = new THREE.Group();
    this.powerGroup = new THREE.Group();
    this.dataCenterGroup = new THREE.Group();
    this.recyclingGroup = new THREE.Group();
    this.solisGroup = new THREE.Group();
    this.closingGroup = new THREE.Group();

    this.groups = [
      this.heroGroup,
      this.manufacturingGroup,
      this.powerGroup,
      this.dataCenterGroup,
      this.recyclingGroup,
      this.solisGroup,
      this.closingGroup,
    ];
    this.groups.forEach((g) => this.scene.add(g));

    // Lighting
    this.ambient = new THREE.AmbientLight(0x1a3a3e, 0.45);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xb0c4c8, 0.85);
    this.keyLight.position.set(8, 12, 10);
    if (perf.shadows) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 60;
      this.keyLight.shadow.camera.left = -20;
      this.keyLight.shadow.camera.right = 20;
      this.keyLight.shadow.camera.top = 20;
      this.keyLight.shadow.camera.bottom = -20;
    }
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x2a6a6e, 0.6);
    this.rimLight.position.set(-10, 6, -8);
    this.scene.add(this.rimLight);

    this.emberLight = new THREE.PointLight(0xf97316, 1.4, 30, 1.6);
    this.emberLight.position.set(0, 2, 6);
    this.scene.add(this.emberLight);

    this.buildGroundGrid();
  }

  buildGroundGrid() {
    const tex = makeGridTexture();
    tex.repeat.set(40, 40);
    const geo = new THREE.PlaneGeometry(200, 200);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: 0x0d2528,
      metalness: 0.2,
      roughness: 0.9,
      transparent: true,
      opacity: 0.4,
    });
    this.groundMesh = new THREE.Mesh(geo, mat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -6;
    if (this.perf.shadows) this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  update(state, time) {
    const c = sectionForProgress(state.progress);
    // Fade groups based on proximity to current section — smoother transitions
    this.groups.forEach((g, i) => {
      const dist = Math.abs(i - c.index);
      const targetOpacity = dist === 0 ? 1 : dist === 1 ? 0.25 : 0;
      g.traverse((obj) => {
        const mesh = obj;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material;
          if (mat.transparent && typeof mat.opacity === 'number') {
            const base = mesh.userData.baseOpacity ?? mat.opacity;
            if (!mesh.userData.baseOpacity) mesh.userData.baseOpacity = base;
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity * base, 0.04);
          }
        }
      });
      g.visible = targetOpacity > 0.001 || dist <= 1;
    });

    // Ember light subtle pulse — restrained
    this.emberLight.intensity = 1.0 + Math.sin(time * 0.5) * 0.2;
    this.emberLight.position.x = Math.sin(time * 0.15) * 3;
    this.emberLight.position.z = 5 + Math.cos(time * 0.15) * 1.5;
  }
}
