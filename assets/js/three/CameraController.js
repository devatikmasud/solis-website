import * as THREE from 'three';

export class CameraController {
  constructor(aspect, perf) {
    this.targetPos = new THREE.Vector3(0, 0, 10);
    this.targetLook = new THREE.Vector3(0, 0, 0);
    this.currentPos = new THREE.Vector3(0, 0, 10);
    this.currentLook = new THREE.Vector3(0, 0, 0);

    this.baseFov = perf.tier === 'low' ? 60 : 48;
    this.targetFov = this.baseFov;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 200);
    this.currentPos.copy(this.targetPos);
    this.currentLook.copy(this.targetLook);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setTarget(pos, look, fov) {
    this.targetPos.copy(pos);
    this.targetLook.copy(look);
    if (fov !== undefined) this.targetFov = fov;
  }

  update(dt) {
    // Frame-rate independent damping — slower for cinematic feel
    const lerpAmt = 1 - Math.pow(0.005, dt);
    this.currentPos.lerp(this.targetPos, lerpAmt);
    this.currentLook.lerp(this.targetLook, lerpAmt);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLook);
    if (Math.abs(this.camera.fov - this.targetFov) > 0.01) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, lerpAmt);
      this.camera.updateProjectionMatrix();
    }
  }

  get position() {
    return this.currentPos;
  }
}
