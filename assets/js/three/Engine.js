import * as THREE from 'three';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutputPass.js';
import { detectPerformanceTier } from './performance.js';
import { CameraController } from './CameraController.js';
import { SceneManager, sectionForProgress, sectionProgress, CHAPTERS } from './SceneManager.js';
import { buildHeroScene, updateHeroScene } from './scenes/hero.js';
import { buildManufacturingScene, updateManufacturing } from './scenes/manufacturing.js';
import { buildPowerScene, updatePowerScene } from './scenes/power.js';
import { buildDataCenterScene, updateDataCenterScene } from './scenes/datacenter.js';
import { buildRecyclingScene, updateRecyclingScene } from './scenes/recycling.js';
import { buildSolisScene, updateSolisScene } from './scenes/solis.js';
import { buildClosingScene, updateClosingScene } from './scenes/closing.js';

export class Engine {
  constructor(canvas, cb = {}) {
    this.cb = cb;
    this.raf = 0;
    this.clock = new THREE.Clock();
    this.progress = 0;
    this.targetProgress = 0;
    this.currentSection = -1;

    this.perf = detectPerformanceTier();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.perf.antialias,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.perf.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.perf.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.sceneMgr = new SceneManager(this.perf);
    this.cameraCtrl = new CameraController(window.innerWidth / window.innerHeight, this.perf);

    // Environment map — without this, metalness/roughness/transmission on the
    // panel, frame and glass materials have nothing to reflect and render as
    // flat, dull color regardless of their PBR settings. A neutral studio
    // environment gives every metal/glass surface real specular highlights
    // and is what makes the solar panels read as glossy/reflective instead
    // of matte cardboard cutouts against the fog.
    if (this.perf.tier !== 'low') {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();
      this.sceneMgr.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    this.solarLayers = [];
    this.recycleParticles = [];
    this.buildScenes();

    // Bloom post-processing — the single biggest lever for the "premium,
    // cinematic" look the reference site (mont-fort.com) has. Restrained
    // threshold/strength so only genuinely bright pixels (ember lights,
    // LEDs, sunlit highlights) glow — everything else stays crisp rather
    // than turning into a soft haze. Skipped on low-tier devices, where
    // an extra full-screen render pass isn't worth the frame-rate cost.
    this.useBloom = this.perf.tier !== 'low';
    if (this.useBloom) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.sceneMgr.scene, this.cameraCtrl.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.perf.tier === 'high' ? 0.55 : 0.4, // strength
        0.4,                                     // radius
        0.22                                     // threshold — only bright accents bloom
      );
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  buildScenes() {
    buildHeroScene(this.sceneMgr.heroGroup, this.perf);
    this.solarLayers = buildManufacturingScene(this.sceneMgr.manufacturingGroup, this.perf);
    buildPowerScene(this.sceneMgr.powerGroup, this.perf);
    buildDataCenterScene(this.sceneMgr.dataCenterGroup, this.perf);
    this.recycleParticles = buildRecyclingScene(this.sceneMgr.recyclingGroup, this.perf);
    buildSolisScene(this.sceneMgr.solisGroup, this.perf);
    buildClosingScene(this.sceneMgr.closingGroup, this.perf);
  }

  setProgress(p) {
    this.targetProgress = Math.max(0, Math.min(1, p));
  }

  updateCameraForSection(state) {
    const c = sectionForProgress(state.progress);
    const sp = sectionProgress(state.progress, c);
    const time = this.clock.elapsedTime;
    const cam = this.cameraCtrl.camera;

    switch (c.index) {
      case 0: // hero — slow push in
        this.cameraCtrl.setTarget(new THREE.Vector3(0, 1, 12 - sp * 2), new THREE.Vector3(0, 0, -2), 48);
        break;
      case 1: { // manufacturing — slow orbit around module
        const angle = sp * Math.PI * 0.5 - 0.25;
        const r = 9 - sp * 2;
        this.cameraCtrl.setTarget(
          new THREE.Vector3(Math.sin(angle) * r, 2 + sp * 1.5, Math.cos(angle) * r),
          new THREE.Vector3(0, 0.5, 0),
          44
        );
        break;
      }
      case 2: // power — sweep across solar field
        this.cameraCtrl.setTarget(
          new THREE.Vector3(-6 + sp * 12, -1 + sp * 3, 6 - sp * 2),
          new THREE.Vector3(0, -2, -10),
          48
        );
        break;
      case 3: // data center — move down corridor
        this.cameraCtrl.setTarget(new THREE.Vector3(0, sp * 1.5, 8 - sp * 6), new THREE.Vector3(0, 0, -8), 52);
        break;
      case 4: { // recycling — slow orbit of ring
        const a = sp * Math.PI * 0.6;
        this.cameraCtrl.setTarget(
          new THREE.Vector3(Math.sin(a) * 8, 1, Math.cos(a) * 8 - 2),
          new THREE.Vector3(0, -1, -2),
          48
        );
        break;
      }
      case 5: // solis — aerial descent
        this.cameraCtrl.setTarget(new THREE.Vector3(0, 8 - sp * 6, 8 - sp * 2), new THREE.Vector3(0, -2, -2), 48);
        break;
      case 6: // closing — approach monolith
        this.cameraCtrl.setTarget(new THREE.Vector3(0, 0.5, 10 - sp * 6), new THREE.Vector3(0, 0, -2), 46);
        break;
    }

    // Subtle parallax — disabled on reduced motion
    if (!this.reducedMotion) {
      cam.position.x += Math.sin(time * 0.25) * 0.12;
      cam.position.y += Math.cos(time * 0.18) * 0.08;
    }
  }

  loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;

    if (this.reducedMotion) {
      this.progress = this.targetProgress;
    } else {
      this.progress += (this.targetProgress - this.progress) * Math.min(1, dt * 3);
    }

    const c = sectionForProgress(this.progress);
    const sp = sectionProgress(this.progress, c);
    const state = { progress: this.progress, sectionProgress: sp, section: c.index };

    if (c.index !== this.currentSection) {
      this.currentSection = c.index;
      this.cb.onSectionChange?.(c.index, c.id);
    }
    this.cb.onProgress?.(this.progress);

    this.updateCameraForSection(state);
    this.cameraCtrl.update(dt);
    this.sceneMgr.update(state, time);

    updateHeroScene(this.sceneMgr.heroGroup, sp, time);
    updateManufacturing(this.sceneMgr.manufacturingGroup, this.solarLayers, sp, time);
    updatePowerScene(this.sceneMgr.powerGroup, sp, time);
    updateDataCenterScene(this.sceneMgr.dataCenterGroup, sp, time);
    updateRecyclingScene(this.sceneMgr.recyclingGroup, this.recycleParticles, sp, time);
    updateSolisScene(this.sceneMgr.solisGroup, sp, time);
    updateClosingScene(this.sceneMgr.closingGroup, sp, time);

    if (this.useBloom) {
      this.composer.render();
    } else {
      this.renderer.render(this.sceneMgr.scene, this.cameraCtrl.camera);
    }
  };

  start() {
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  onResize() {
    this.cameraCtrl.setAspect(window.innerWidth / window.innerHeight);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.perf.pixelRatio);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.sceneMgr.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((x) => x.dispose());
        else o.material.dispose();
      }
    });
  }

  get chapterCount() {
    return CHAPTERS.length;
  }
}
