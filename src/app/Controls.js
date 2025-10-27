import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class Controls {
  constructor(app) {
    this.app = app;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.shiftPressed = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
  }

  setupControls() {
    // Use the canvas element for more predictable pointer lock behavior
    // Use document.body for widest browser compatibility (matches original main.js)
    const dom = document.body;
    this.controls = new PointerLockControls(this.app.renderer.camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    const clickTarget = instructions || this.app.canvas || document.body;

    // Enter pointer lock when the user clicks anywhere reasonable
    if (clickTarget && clickTarget.addEventListener) {
      clickTarget.addEventListener('click', () => {
        try {
          this.controls.lock();
        } catch (_) {}
      });
    }

    this.controls.addEventListener('lock', () => {
      if (instructions) instructions.style.display = 'none';
      if (blocker) blocker.style.display = 'none';
      if (this.app.reticle) this.app.reticle.style.display = 'block';
      try {
        if (dom && typeof dom.focus === 'function') dom.focus();
      } catch (_) {}
    });

    this.controls.addEventListener('unlock', () => {
      if (blocker) blocker.style.display = 'block';
      if (instructions) instructions.style.display = '';
      if (this.app.reticle) this.app.reticle.style.display = 'none';
    });

    // NOTE: In newer Three.js (r158+), PointerLockControls.object is the camera itself,
    // not a wrapper object. We should NOT add the camera to the scene.
    // The controls work directly by modifying the camera's rotation.
    // No scene.add() needed for PointerLockControls.

    // Clear movement on window blur to avoid sticky keys on macOS
    window.addEventListener('blur', () => {
      this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false;
      this.moveUp = this.moveDown = this.shiftPressed = false;
    });

    // Capture at window level so GUI widgets can't swallow events
    window.addEventListener('keydown', (event) => this.onKeyDown(event), true);
    window.addEventListener('keyup', (event) => this.onKeyUp(event), true);
    // Do not install a global mousemove interceptor; PointerLockControls handles mouse look.
    // If a temporary manual-rotate mode is desired, wire it explicitly when enabled.

    // Expose for quick diagnostics
    try {
      window.__controls__ = this;
    } catch (_) {}
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'KeyQ':
        this.moveDown = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'KeyE':
        this.moveUp = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.shiftPressed = true;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'Space':
        if (this.controls.isLocked) {
          this.app.spaceMouseRotate = true;
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'KeyQ':
        this.moveDown = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'KeyE':
        this.moveUp = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.shiftPressed = false;
        event.preventDefault();
        event.stopPropagation();
        break;
      case 'Space':
        this.app.spaceMouseRotate = false;
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }
}
