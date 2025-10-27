import * as THREE from 'three';
import { DEFAULTS } from '../config/defaults.js';
import { Renderer } from './Renderer.js';
import { ShaderManager } from './ShaderManager.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';
import { ZoomController } from './ZoomController.js';

import { GUIManager } from '../ui/GUIManager.js';

import { PerformanceTest } from '../core/PerformanceTest.js';

/**
 * Fractal Explorer - Main Entry Point
 * Phase 2: Ray marching with flight controls
 */

export class FractalExplorer {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.renderer = new Renderer(this);
    this.shaderManager = new ShaderManager(this, this.renderer);
    this.controls = new Controls(this);
    this.ui = new UI(this);
    this.zoomController = new ZoomController(this);
    this.clock = new THREE.Clock();
    this.time = 0;
    this.hasShaderError = false; // gate loading fade-out on shader errors
    this.initComplete = false; // mark when init reached end
    this._animationStarted = false;
    this.running = true; // ensure RAF schedules continuously
    this._rafId = null;
    // Track applied palette to force updates if GUI events are missed
    this._lastAppliedPalette = DEFAULTS.palette | 0;

    // Auto-resolution scaling (FPS-based)
    this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderScale = 1.0; // 0.5–1.0
    this.autoResolutionEnabled = false;
    this._fpsEma = 0;
    this._fpsAlpha = 0.1; // EMA factor
    this._framesSinceAdjust = 0;
    this._adjustCooldownFrames = 45; // ~0.75s at 60fps
    // Instant FPS (1-second window) for overlay parity with Stats.js
    this._fpsWindowStart = performance.now();
    this._fpsFrameCount = 0;
    this._fpsInstant = 0;
    // Auto-res hysteresis state
    this._framesSinceResChange = 9999;
    this._minResHold = DEFAULTS.autoResHoldFrames || 120; // ~2s at 60fps
    this._sustainLow = 0;
    this._sustainHigh = 0;

    // Frustum budget drop (hysteresis + baselines)
    this._frustumDropActive = false;
    this._wasFrustumDropActive = false;
    this._frustumDropFrames = 0;
    this._frustumRestoreFrames = 0;
    this._budgetBaseline = null; // { maxSteps, aoMin, shMin }
    // World auto-integrator hysteresis
    this._worldAutoSeg = false;

    // Morph base snapshot (captured on first enable)
    this._morphBase = null;
    // Track previous fractal type to restore when exiting DEC preview
    this._prevFractalType = null;

    // Animation state
    this.animationEnabled = false;
    this.rotationSpeed = new THREE.Vector3(0.2, 0.15, 0.1); // Per-axis rotation speeds
    this.rotation = new THREE.Vector3(0, 0, 0); // Current rotation angles
    // Camera movement
    this.speed = DEFAULTS.movementSpeed;
    this.flyMode = !!DEFAULTS.flyMode;
    this._moveVelocity = new THREE.Vector3();
    // Fractal manual-rotate via mouse while space is held
    this.spaceMouseRotate = false;
    // Optional manual-rotate mode removed; PointerLockControls handles mouse look
    this.onMouseRotate = () => {};

    // Create a simple reticle (crosshair) overlay at screen center
    this.reticle = document.createElement('div');
    this.reticle.id = 'reticle';
    Object.assign(this.reticle.style, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '20px',
      height: '20px',
      pointerEvents: 'none',
      zIndex: 10002,
      display: 'none',
    });
    const h = document.createElement('div');
    const v = document.createElement('div');
    const common = {
      position: 'absolute',
      background: '#9ad',
      opacity: 0.85,
      borderRadius: '1px',
    };
    Object.assign(h.style, common, {
      left: '0',
      top: '50%',
      width: '100%',
      height: '2px',
      transform: 'translateY(-50%)',
    });
    Object.assign(v.style, common, {
      top: '0',
      left: '50%',
      height: '100%',
      width: '2px',
      transform: 'translateX(-50%)',
    });
    this.reticle.appendChild(h);
    this.reticle.appendChild(v);
    document.body.appendChild(this.reticle);

    this.init();
  }

  async init() {
    this.ui.updateLoadingProgress(45, 'Compiling shaders...');
    this.shaderManager.setupShader();
    // Expose uniforms at app level for modules that still read `app.uniforms`
    this.uniforms = this.shaderManager.uniforms;
    // Restore saved fractal type (if present) before GUI is created
    this.loadSavedFractalType();

    // Always use specialized materials for the current fractal
    this.shaderManager.applyMaterialSpecializationIfNeeded(true);
    // Prewarm specialized shader variants to avoid first-switch stutter
    await this.shaderManager.prewarmSpecializedMaterials([0, 1, 2, 3, 4, 5, 6, 7]);

    // Ensure the render loop starts early even when a saved quality exists
    if (!this._animationStarted) {
      this._animationStarted = true;
      this.animate();
    }

    // Auto-benchmark if no saved quality; no modal
    this.ui.updateLoadingProgress(75, 'Checking performance settings...');
    const saved = PerformanceTest.getSavedQuality();
    if (saved) {
      console.log('✅ Using saved quality preference - skipping benchmark');
      this.applySavedQuality(saved);
    } else {
      this.ui.updateLoadingProgress(80, 'Benchmarking GPU...');
      if (!this._animationStarted) {
        this._animationStarted = true;
        this.animate();
      }
      await this.runPerformanceTest(false);
    }

    this.ui.updateLoadingProgress(90, 'Setting up GUI...');
    // Pass saved quality to GUI so it doesn't override benchmark results
    const savedQuality = PerformanceTest.getSavedQuality();
    this.setupGUI(savedQuality ? savedQuality.quality : null);
    this.controls.setupControls();
    try {
      window.__app__ = this;
    } catch (_) {}

    // CRITICAL: If DEC Preview is enabled after GUI setup, rebuild shaders to inject DEC code
    // This handles the case where DEC state is restored from localStorage
    if (this.shaderManager.decPreview && this.shaderManager.decPreview.enabled) {
      this.shaderManager.applyDecMappingAndRebuild();
    }

    this.ui.updateLoadingProgress(95, 'Finalizing...');

    this.ui.updateLoadingProgress(100, 'Ready!');
    this.initComplete = true;
    await this.attemptFinishLoading();
    if (!this.hasShaderError && !this._animationStarted) {
      this._animationStarted = true;
      this.animate();
    }
  }

  // Removed duplicate - now handled by UI class

  // --- Runtime ------------------------------------------------------------
  animate = () => {
    if (!this.running) return;

    // Begin stats tracking
    if (this.ui && this.ui.stats) this.ui.stats.begin();

    const delta = this.clock.getDelta();
    this.time += delta;

    // Update time uniform
    if (this.shaderManager?.uniforms?.u_time) {
      this.shaderManager.uniforms.u_time.value = this.time;
    }

    // Animate rotation if enabled
    if (this.animationEnabled) {
      this.rotation.x += this.rotationSpeed.x * delta;
      this.rotation.y += this.rotationSpeed.y * delta;
      this.rotation.z += this.rotationSpeed.z * delta;
    }
    if (this.shaderManager?.uniforms?.u_rotation) {
      this.shaderManager.uniforms.u_rotation.value.copy(this.rotation);
    }

    // Update movement only when pointer lock is active
    try {
      if (this.controls && this.controls.controls && this.controls.controls.isLocked) {
        this.updateMovement(delta);
      }
    } catch (_) {}

    // Update infinite zoom controller
    if (this.zoomController) {
      this.zoomController.update(delta);
    }

    // Sync camera uniforms (use world transforms in case camera is parented to controls)
    const cam = this.renderer.camera;
    cam.updateMatrixWorld();
    const uniforms = this.shaderManager.uniforms;
    if (uniforms.u_cameraPos) {
      const wp = new THREE.Vector3();
      cam.getWorldPosition(wp);
      uniforms.u_cameraPos.value.copy(wp);
    }
    if (uniforms.u_cameraTarget) {
      const dir = new THREE.Vector3();
      const wp = new THREE.Vector3();
      cam.getWorldDirection(dir);
      cam.getWorldPosition(wp);
      uniforms.u_cameraTarget.value.copy(wp).add(dir);
    }
    if (uniforms.u_camRight || uniforms.u_camUp) {
      const m = cam.matrixWorld;
      const right = new THREE.Vector3(m.elements[0], m.elements[1], m.elements[2]).normalize();
      const up = new THREE.Vector3(m.elements[4], m.elements[5], m.elements[6]).normalize();
      if (uniforms.u_camRight) uniforms.u_camRight.value.copy(right);
      if (uniforms.u_camUp) uniforms.u_camUp.value.copy(up);
    }

    // Render using ShaderManager's two-pass pipeline (post when enabled)
    this.shaderManager.renderFrame();

    // Stats / auto-resolution tracker from original main.js split
    this.updateFpsAndResolution(delta);

    // End stats tracking
    if (this.ui && this.ui.stats) this.ui.stats.end();

    // Next frame
    this._rafId = requestAnimationFrame(this.animate);
  };

  // Smooth movement based on Controls flags; moves the PointerLockControls object if present
  updateMovement(delta) {
    const ctl = this.controls;
    if (!ctl) return;

    // Calculate input amounts
    let fAmt = (ctl.moveForward ? 1 : 0) - (ctl.moveBackward ? 1 : 0);
    let rAmt = (ctl.moveRight ? 1 : 0) - (ctl.moveLeft ? 1 : 0);
    let uAmt = (ctl.moveUp ? 1 : 0) - (ctl.moveDown ? 1 : 0);
    const magIn = Math.hypot(fAmt, rAmt, uAmt);
    if (magIn > 0) {
      fAmt /= magIn;
      rAmt /= magIn;
      uAmt /= magIn;
    }

    const cam = this.renderer.camera;

    // Calculate basis vectors from camera
    let forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion).normalize();
    let upLocal = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion).normalize();

    if (!this.flyMode) {
      // Constrain to yaw plane for grounded mode
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();
      upLocal.set(0, 1, 0);
    }

    // Target velocity in world space
    const speedMultiplier = ctl.shiftPressed ? 2.0 : 1.0;
    const baseSpeed =
      (typeof this.speed === 'number' ? this.speed : DEFAULTS.movementSpeed) * speedMultiplier;
    const targetVel = new THREE.Vector3();
    targetVel
      .addScaledVector(forward, fAmt * baseSpeed)
      .addScaledVector(right, rAmt * baseSpeed)
      .addScaledVector(upLocal, uAmt * baseSpeed);

    // Smooth towards target
    const accel = 10.0; // higher = snappier
    const lerpA = 1.0 - Math.exp(-accel * delta);
    this._moveVelocity.lerp(targetVel, lerpA);

    // Apply damping when no input
    const damp = 4.0;
    if (magIn === 0) {
      const dampA = Math.exp(-damp * delta);
      this._moveVelocity.multiplyScalar(dampA);
    }

    // Integrate position
    // Note: Newer Three.js uses controls.object property instead of getObject() method
    const obj = ctl.controls && ctl.controls.object ? ctl.controls.object : cam;
    obj.position.addScaledVector(this._moveVelocity, delta);
  }

  async runPerformanceTest(_modal = false) {
    try {
      const tester = new PerformanceTest(
        this.renderer.renderer,
        this.renderer.scene,
        this.renderer.camera,
        this.shaderManager.material
      );
      const rec = await tester.runTest(false);
      this.applySavedQuality(rec);
      return rec;
    } catch (e) {
      console.warn('Performance test failed:', e);
      return null;
    }
  }

  applySavedQuality(saved) {
    if (!saved) return;
    const u = this.shaderManager.uniforms;
    if (u.u_maxSteps && typeof saved.maxSteps === 'number') u.u_maxSteps.value = saved.maxSteps;
    if (u.u_iterations && typeof saved.iterations === 'number')
      u.u_iterations.value = saved.iterations;
    try {
      localStorage.setItem('fractalExplorer_quality', JSON.stringify(saved));
    } catch (_) {}
  }

  async attemptFinishLoading() {
    // Hide loading overlay once init complete and no shader error
    if (!this.initComplete || this.hasShaderError) return;
    const el = document.getElementById('loading');
    if (el) el.classList.add('hidden');
  }

  updateFpsAndResolution(delta) {
    // EMA FPS calculation
    const frameFps = 1 / delta;
    this._fpsEma = this._fpsAlpha * frameFps + (1 - this._fpsAlpha) * this._fpsEma;

    // Instant FPS (1-second window)
    this._fpsFrameCount++;
    const now = performance.now();
    if (now - this._fpsWindowStart >= 1000) {
      this._fpsInstant = this._fpsFrameCount;
      this._fpsFrameCount = 0;
      this._fpsWindowStart = now;
    }

    // Stats panels update removed - only FPS panel is active
    // GPU and RES custom panels were removed for cleaner UI

    // Auto-resolution adjustment logic
    this._framesSinceAdjust++;
    this._framesSinceResChange++;

    if (
      this.autoResolutionEnabled &&
      this._framesSinceAdjust > this._adjustCooldownFrames &&
      this._framesSinceResChange > this._minResHold
    ) {
      const targetFps = DEFAULTS.autoResTargetFps || 58;
      const hyst = DEFAULTS.autoResHysteresis || 3; // +/- FPS
      const upper = targetFps + hyst;
      const lower = targetFps - hyst;
      const sustainFrames = DEFAULTS.autoResSustainFrames || 30; // ~0.5s

      if (this._fpsEma < lower) {
        this._sustainLow++;
        this._sustainHigh = 0;
      } else if (this._fpsEma > upper) {
        this._sustainHigh++;
        this._sustainLow = 0;
      } else {
        this._sustainLow = 0;
        this._sustainHigh = 0;
      }

      if (this._sustainLow >= sustainFrames) {
        this.adjustResolution(-1); // Decrease resolution
        this._sustainLow = 0;
      } else if (this._sustainHigh >= sustainFrames) {
        this.adjustResolution(1); // Increase resolution
        this._sustainHigh = 0;
      }
    }
  }

  adjustResolution(direction) {
    const oldScale = this.renderScale;
    const step = DEFAULTS.autoResStep || 0.125;
    const minScale = DEFAULTS.autoResMinScale || 0.5;

    this.renderScale = THREE.MathUtils.clamp(this.renderScale + direction * step, minScale, 1.0);

    if (this.renderScale !== oldScale) {
      this.renderer.renderer.setPixelRatio(this.basePixelRatio * this.renderScale);
      console.log(
        `Resolution scale changed: ${(oldScale * 100).toFixed(0)}% -> ${(
          this.renderScale * 100
        ).toFixed(0)}% (FPS: ${this._fpsEma.toFixed(1)})`
      );
      this.ui.showToast(`Resolution: ${(this.renderScale * 100).toFixed(0)}%`, 1500);
      this._framesSinceResChange = 0;
    }
    this._framesSinceAdjust = 0;
  }

  // Rich shader error panel (compile/link hooks call this)
  showShaderError(title, log) {
    // Keep loading overlay up and reflect status
    this.hasShaderError = true;
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
      this.ui.updateLoadingProgress(58, 'Shader error — check log (Esc to close)');
    }

    let panel = document.getElementById('shader-error');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'shader-error';
      panel.style.cssText = [
        'position:fixed',
        'top:10%',
        'left:50%',
        'transform:translateX(-50%)',
        'max-width:90%',
        'max-height:70%',
        'overflow:auto',
        'background:rgba(30,0,0,0.95)',
        'color:#fff',
        'border:1px solid #ff6b6b',
        'border-radius:6px',
        'padding:14px 16px',
        'z-index:10001',
        'font-family:monospace',
        'font-size:12px',
        'box-shadow:0 10px 24px rgba(0,0,0,0.6)',
      ].join(';');

      const header = document.createElement('div');
      header.id = 'shader-error-title';
      header.style.cssText = 'font-weight:bold;color:#ff6b6b;margin-bottom:8px;';
      panel.appendChild(header);

      const actions = document.createElement('div');
      actions.id = 'shader-error-actions';
      actions.style.cssText = 'margin-bottom:10px;display:flex;gap:8px;align-items:center;';
      panel.appendChild(actions);

      const pre = document.createElement('pre');
      pre.id = 'shader-error-log';
      pre.style.cssText = 'white-space:pre-wrap;line-height:1.4;';
      panel.appendChild(pre);

      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top:10px;color:#aaa;display:flex;gap:12px;align-items:center;';
      const hint = document.createElement('span');
      hint.textContent = 'Press Esc to close';
      footer.appendChild(hint);
      panel.appendChild(footer);

      // Copy InfoLog button
      const copyInfo = document.createElement('button');
      copyInfo.id = 'shader-copy-infolog';
      copyInfo.textContent = 'Copy InfoLog';
      copyInfo.style.cssText =
        'background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;cursor:pointer;font-family:monospace;';
      copyInfo.onclick = async () => {
        const text = pre.textContent || '';
        // Extract InfoLogs if present, else copy all
        const lines = text.split('\n');
        const out = [];
        let collecting = false;
        let foundAny = false;
        for (const line of lines) {
          if (line.startsWith('--- ') && line.includes('Shader InfoLog ---')) {
            collecting = true;
            foundAny = true;
            continue;
          }
          if (
            line.startsWith('--- ') &&
            (line.includes('Shader Source ---') || line.includes('Shader InfoLog ---'))
          ) {
            if (collecting) {
              collecting = false;
              out.push('');
            }
            continue;
          }
          if (collecting) out.push(line);
        }
        const payload = (foundAny ? out.join('\n').trim() : text) || '';
        try {
          await navigator.clipboard.writeText(payload);
          copyInfo.textContent = 'Copied!';
          setTimeout(() => (copyInfo.textContent = 'Copy InfoLog'), 1200);
        } catch (_) {}
      };

      // Copy GLSL Sources button
      const copySrc = document.createElement('button');
      copySrc.id = 'shader-copy-sources';
      copySrc.textContent = 'Copy Sources Only';
      copySrc.style.cssText =
        'background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;cursor:pointer;font-family:monospace;';
      copySrc.onclick = async () => {
        const text = pre.textContent || '';
        const lines = text.split('\n');
        let collecting = false;
        const out = [];
        for (const line of lines) {
          if (line.startsWith('--- ') && line.includes('Shader Source ---')) {
            collecting = true;
            continue;
          }
          if (line.startsWith('--- end ') && line.includes('Shader Source ---')) {
            collecting = false;
            out.push('\n');
            continue;
          }
          if (collecting) out.push(line);
        }
        const payload = out.join('\n').trim() || text;
        try {
          await navigator.clipboard.writeText(payload);
          copySrc.textContent = 'Copied GLSL!';
          setTimeout(() => (copySrc.textContent = 'Copy Sources Only'), 1200);
        } catch (_) {}
      };

      actions.appendChild(copyInfo);
      actions.appendChild(copySrc);
      document.body.appendChild(panel);

      // Dismiss with Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel && panel.style.display !== 'none') {
          panel.style.display = 'none';
        }
      });
    }

    const headerEl = panel.querySelector('#shader-error-title');
    const preEl = panel.querySelector('#shader-error-log');
    headerEl.textContent = title;
    preEl.textContent = log;
    panel.style.display = 'block';
  }

  // --- GUI Integration -----------------------------------------------------
  setupGUI(initialQuality = null) {
    this.guiManager = new GUIManager(this.shaderManager.uniforms, this.renderer.camera, {
      initialQuality: initialQuality || 'High',
      getApp: () => this, // Allow GUI to access ZoomController and other app components
      onFractalTypeChange: (type) => {
        this.shaderManager.uniforms.u_fractalType.value = type;
        this.shaderManager.applyMaterialSpecializationIfNeeded();
        this.saveFractalType(type); // Persist selection
      },
      onAnimationToggle: (enabled) => {
        this.animationEnabled = enabled;
      },
      onFlyModeToggle: (enabled) => {
        this.flyMode = enabled;
      },
      onSpeedChange: (newSpeed) => {
        this.speed = newSpeed;
      },
      onRotationSpeedChange: (axis, speed) => {
        this.rotationSpeed[axis] = speed;
      },
      onReticleToggle: (show) => {
        if (this.reticle) this.reticle.style.display = show ? 'block' : 'none';
      },
      onBackgroundChange: (color) => {
        this.renderer.scene.background = new THREE.Color(color);
      },
      onStatsToggle: (show) => {
        if (this.ui && this.ui.stats) {
          this.ui.stats.dom.style.display = show ? 'block' : 'none';
        }
      },
      onDebugOverlayToggle: (show) => {
        const debugOverlay = document.getElementById('debug-overlay');
        if (debugOverlay) {
          debugOverlay.style.display = show ? 'block' : 'none';
        }
      },
      onQualityChange: (quality, maxSteps, iterations) => {
        // Save user's quality preference
        PerformanceTest.saveQuality(quality, maxSteps, iterations);
      },
      onAutoResolutionToggle: (enabled) => {
        this.autoResolutionEnabled = enabled;
        if (!enabled) {
          // Reset to full resolution
          this.renderScale = 1.0;
          this.renderer.renderer.setPixelRatio(this.basePixelRatio);
        }
      },
      resetCamera: () => {
        this.renderer.camera.position.set(0, 0, 7);
        this.renderer.camera.lookAt(new THREE.Vector3(0, 0, 0));
        // Update uniform to reflect new camera position
        if (this.shaderManager.uniforms.u_cameraPos) {
          this.shaderManager.uniforms.u_cameraPos.value.copy(this.renderer.camera.position);
        }
        // Update camera target uniform
        if (this.shaderManager.uniforms.u_cameraTarget) {
          this.shaderManager.uniforms.u_cameraTarget.value.set(0, 0, 0);
        }
        // Update controls if using PointerLockControls
        if (this.controls && this.controls.getObject) {
          this.controls.getObject().position.copy(this.renderer.camera.position);
        }
      },
      resetRotation: () => {
        this.rotation.set(0, 0, 0);
        if (this.shaderManager.uniforms.u_rotation) {
          this.shaderManager.uniforms.u_rotation.value.set(0, 0, 0);
        }
      },
      // DEC action callbacks
      centerDEC: () => {
        try {
          const u = this.shaderManager.uniforms;
          // Enable DEC and set type
          if (!this.shaderManager.decPreview.enabled) {
            this.shaderManager.decPreview.enabled = true;
            if (this.guiManager.callbacks && this.guiManager.callbacks.onDecPreviewToggle) {
              this.guiManager.callbacks.onDecPreviewToggle(true);
            }
          }
          if (this.guiManager && this.guiManager.setFractalType) {
            this.guiManager.setFractalType(7);
          }
          // Place object in front of camera
          const dir = new THREE.Vector3();
          this.renderer.camera.getWorldDirection(dir);
          const dist = 4.0;
          const pos = new THREE.Vector3()
            .copy(this.renderer.camera.position)
            .add(dir.multiplyScalar(dist));
          if (u.u_decOffset) u.u_decOffset.value.copy(pos);
          if (u.u_fractalScale) u.u_fractalScale.value = 1.0;
          if (u.u_rotation) u.u_rotation.value.set(0, 0, 0);
          this.rotation.set(0, 0, 0);
          if (this.guiManager && this.guiManager.params) {
            this.guiManager.params.decOffsetX = pos.x;
            this.guiManager.params.decOffsetY = pos.y;
            this.guiManager.params.decOffsetZ = pos.z;
            this.guiManager.params.scale = 1.0;
            this.guiManager.params.rotationSpeedX = 0;
            this.guiManager.params.rotationSpeedY = 0;
            this.guiManager.params.rotationSpeedZ = 0;
            try {
              if (this.guiManager.gui && this.guiManager.gui.controllersRecursive) {
                this.guiManager.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
              }
            } catch (_) {}
          }
          console.log('[DEC center] offset', pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
          this.ui.showToast && this.ui.showToast('📌 Centered DEC in view');
          // Force immediate render
          if (this.shaderManager && this.renderer.scene && this.renderer.camera) {
            this.shaderManager.renderFrame();
          }
        } catch (e) {
          console.warn('Center DEC failed:', e);
        }
      },
      frameDEC: () => {
        try {
          const u = this.shaderManager.uniforms;
          if (!this.shaderManager.decPreview.enabled) {
            this.shaderManager.decPreview.enabled = true;
            if (this.guiManager.callbacks && this.guiManager.callbacks.onDecPreviewToggle) {
              this.guiManager.callbacks.onDecPreviewToggle(true);
            }
          }
          if (this.guiManager && this.guiManager.setFractalType) {
            this.guiManager.setFractalType(7);
          }
          const center = u.u_decOffset ? u.u_decOffset.value : new THREE.Vector3(0, 0, 0);
          const dist = 4.0;
          this.renderer.camera.position.set(center.x, center.y, center.z + dist);
          this.renderer.camera.lookAt(new THREE.Vector3(center.x, center.y, center.z));
          console.log(
            '[DEC frame] camera->',
            this.renderer.camera.position.x.toFixed(2),
            this.renderer.camera.position.y.toFixed(2),
            this.renderer.camera.position.z.toFixed(2)
          );
          this.ui.showToast && this.ui.showToast('🎥 Framed DEC');
          // Force immediate render
          if (this.shaderManager && this.renderer.scene && this.renderer.camera) {
            this.shaderManager.renderFrame();
          }
        } catch (e) {
          console.warn('Frame DEC failed:', e);
        }
      },
      faceCamera: () => {
        // Aim fractal forward (+Z) toward the camera position (yaw only)
        const pos = this.renderer.camera.position;
        const yaw = Math.atan2(pos.x, pos.z);
        this.rotation.set(0, yaw, 0);
        if (this.shaderManager.uniforms.u_rotation) {
          this.shaderManager.uniforms.u_rotation.value.set(0, yaw, 0);
        }
      },
      captureScreenshot: () => {
        // Render one frame to ensure latest state
        if (this.shaderManager) {
          this.shaderManager.renderFrame();
        }
        // Get canvas data
        this.canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          // Build descriptive filename
          const fractalMap = {
            0: 'primitives',
            1: 'menger',
            2: 'mandelbulb',
            3: 'sierpinski',
            4: 'mandelbox',
            5: 'world-gyroid',
            6: 'world-truchet',
            7: 'dec',
          };
          const colorMap = { 0: 'material', 1: 'orbit', 2: 'distance', 3: 'normal' };
          const u = this.shaderManager.uniforms;
          const fractal = fractalMap[u.u_fractalType.value] || 'unknown';
          const quality =
            this.guiManager && this.guiManager.params ? this.guiManager.params.quality : 'Unknown';
          const color = colorMap[u.u_colorMode.value] || 'unknown';
          const filename = `fractal-explorer-${fractal}_${quality}_${color}-${timestamp}.png`;
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          // Cleanup
          URL.revokeObjectURL(url);
          console.log('📸 Screenshot saved:', filename);
        });
      },
      requestShaderRefresh: () => {
        try {
          // Ensure the specialized material for the current type is bound
          this.shaderManager.applyMaterialSpecializationIfNeeded(true);
          // Kick a frame now to reflect changes immediately
          if (this.shaderManager && this.renderer.scene && this.renderer.camera) {
            this.shaderManager.renderFrame();
          }
        } catch (_) {}
      },
      setFastDecInject: (on) => {
        if (this.shaderManager) {
          this.shaderManager.fastDecInject = !!on;
          // Rebuild DEC mapping using the selected path so next switch is instant
          try {
            this.shaderManager.applyDecMappingAndRebuild();
          } catch (_) {}
        }
      },
      // DEC preview integration
      onDecPreviewToggle: (enabled) => {
        if (this.shaderManager.decPreview) this.shaderManager.decPreview.enabled = !!enabled;
        try {
          localStorage.setItem('fractalExplorer_decPreviewEnabled', String(!!enabled));
        } catch (_) {}
        const u = this.shaderManager.uniforms;
        if (enabled) {
          // Remember previous type if not already DEC
          const cur = u && u.u_fractalType ? u.u_fractalType.value | 0 : 1;
          if (this._prevFractalType == null && cur !== 7) this._prevFractalType = cur;
          // Switch to DEC (7) and sync GUI
          if (this.guiManager && this.guiManager.setFractalType) this.guiManager.setFractalType(7);
          if (u && u.u_fractalType) u.u_fractalType.value = 7;
          this.saveFractalType(7);
        } else {
          // Restore previous type or default to Menger (1)
          const restore = this._prevFractalType == null ? 1 : this._prevFractalType;
          if (this.guiManager && this.guiManager.setFractalType)
            this.guiManager.setFractalType(restore);
          if (u && u.u_fractalType) u.u_fractalType.value = restore;
          this.saveFractalType(restore);
        }
        this.shaderManager.applyDecMappingAndRebuild();
      },
      onDecPreviewSelect: (entryPath) => {
        if (this.shaderManager.decPreview) this.shaderManager.decPreview.includePath = entryPath;
        try {
          localStorage.setItem('fractalExplorer_decEntry', String(entryPath));
        } catch (_) {}
        if (this.shaderManager.decPreview.enabled) this.shaderManager.applyDecMappingAndRebuild();
      },
    });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // D key: Toggle debug overlay
      if (e.key === 'd' || e.key === 'D') {
        if (this.guiManager && this.guiManager.params) {
          this.guiManager.params.showDebugOverlay = !this.guiManager.params.showDebugOverlay;
          const debugOverlay = document.getElementById('debug-overlay');
          if (debugOverlay) {
            debugOverlay.style.display = this.guiManager.params.showDebugOverlay ? 'block' : 'none';
          }
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });
  }

  // --- Persistence ---------------------------------------------------------
  saveFractalType(type) {
    try {
      localStorage.setItem('fractalExplorer_fractalType', type);
    } catch (e) {
      console.warn('Could not save fractal type to localStorage:', e);
    }
  }

  loadSavedFractalType() {
    try {
      const savedType = localStorage.getItem('fractalExplorer_fractalType');
      if (savedType !== null) {
        const type = parseInt(savedType, 10);
        if (!isNaN(type)) {
          this.shaderManager.uniforms.u_fractalType.value = type;
          console.log(`🎨 Restored fractal type: ${type}`);
        }
      }
    } catch (e) {
      console.warn('Could not load fractal type from localStorage:', e);
    }
  }
}
