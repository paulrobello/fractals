import * as THREE from 'three';

/**
 * ZoomController manages infinite fractal zoom with scale wrapping.
 *
 * Pure scale-based zoom approach:
 * 1. Increase fractal scale (u_fractalScale) to zoom in
 * 2. Gradually increase iterations (u_iterations) to reveal detail
 * 3. Camera stays in place (zoom is purely scale-based)
 * 4. Scale wrapping: divide scale to reset, maintain iterations for performance
 * 5. Auto-rotation for cinematic effect (optional)
 *
 * Zoom center modes:
 * - 'origin': Zoom toward fractal origin (0,0,0) - legacy behavior
 * - 'view': Zoom toward point along camera view ray - Mandelbrot-set-like exploration
 *
 * Key insight: Larger u_fractalScale makes fractal appear bigger/closer.
 * The u_zoomCenter uniform controls where zoom is centered in world space.
 * Wrapping exploits self-similarity to reset scale while maintaining visual continuity.
 *
 * @class ZoomController
 */
export class ZoomController {
  /**
   * Creates a new ZoomController instance.
   *
   * @param {Object} app - Reference to FractalExplorer instance
   */
  constructor(app) {
    this.app = app;

    // Zoom state
    this.enabled = false;
    this.speed = 1.0; // Scale growth rate multiplier
    this.autoRotate = false; // Disabled by default
    this.rotationSpeed = 0.3; // Radians per second
    this.cameraMoveEnabled = false; // Disabled - zoom is pure scale-based
    this.cameraMoveSpeed = 0.02; // Slow movement multiplier

    // Zoom center mode
    this.zoomCenterMode = 'view'; // 'origin' or 'view'
    this.zoomCenterDistance = 5.0; // Distance along view ray for 'view' mode

    // Scale wrapping state
    this.cumulativeScale = 1.0; // Tracks total zoom depth
    this.wrapThreshold = 100.0; // Reset when scale exceeds this
    this.wrapInProgress = false;
    this.wrapDuration = 0.5; // Seconds for smooth transition
    this.wrapT = 0.0; // Transition interpolation parameter [0, 1]

    // Iteration management
    this.baseIterations = 0; // Cached initial iteration count
    this.iterationIncreaseThreshold = 1.5; // Increase iterations every 1.5x scale (more responsive)
    this.lastIterationScale = 1.0; // Track when we last increased iterations
    this.maxIterations = 16; // Safety limit (reduced for performance)
    this.minIterations = 4; // Minimum iterations

    // Transition state (stored during wrapping)
    this.wrapStartPos = new THREE.Vector3();
    this.wrapTargetPos = new THREE.Vector3();
    this.wrapStartScale = 1.0;
    this.wrapTargetScale = 1.0;
    this.wrapStartIterations = 0;
    this.wrapTargetIterations = 0;

    // Per-fractal configuration
    this.fractalConfigs = {
      0: {
        // Primitives - not self-similar
        name: 'Primitives',
        scaleFactor: 1.0,
        enabled: false,
      },
      1: {
        // Menger Sponge
        name: 'Menger Sponge',
        scaleFactor: 3.0, // Divides into 27 cubes, removing 7
        enabled: true,
      },
      2: {
        // Mandelbulb
        name: 'Mandelbulb',
        scaleFactor: 8.0, // Power 8 default (will be dynamic)
        enabled: true,
      },
      3: {
        // Sierpinski Tetrahedron
        name: 'Sierpinski',
        scaleFactor: 2.0, // Divides into 4 tetrahedra
        enabled: true,
      },
      4: {
        // Mandelbox
        name: 'Mandelbox',
        scaleFactor: 2.0, // Box folding scale
        enabled: true,
      },
      5: {
        // World/Gyroid - tiling-based, not self-similar
        name: 'World/Gyroid',
        scaleFactor: 1.0,
        enabled: false,
      },
      6: {
        // Truchet Pipes - tiling-based, not self-similar
        name: 'Truchet Pipes',
        scaleFactor: 1.0,
        enabled: false,
      },
      7: {
        // DEC Preview - varies
        name: 'DEC Preview',
        scaleFactor: 1.0,
        enabled: false,
      },
    };

    // Safety limits
    this.safeScaleMin = 0.01;
    this.safeScaleMax = 1000.0;
  }

  /**
   * Updates the zoom center uniform based on current mode.
   *
   * In 'origin' mode, zoom is centered at fractal origin (0,0,0).
   * In 'view' mode, zoom is centered at a point along the camera's view ray.
   */
  updateZoomCenter() {
    if (this.zoomCenterMode === 'origin') {
      // Origin-centered zoom (legacy behavior)
      this.app.uniforms.u_zoomCenter.value.set(0, 0, 0);
    } else {
      // View-centered zoom: point along camera view ray
      const cam = this.app.renderer.camera;

      // Get camera forward direction
      const forward = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(cam.quaternion)
        .normalize();

      // Compute zoom center at distance along view ray
      const zoomCenter = cam.position
        .clone()
        .addScaledVector(forward, this.zoomCenterDistance);

      this.app.uniforms.u_zoomCenter.value.copy(zoomCenter);
    }
  }

  /**
   * Updates zoom state and applies scale/iteration changes.
   *
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  update(delta) {
    if (!this.enabled) return;

    const fractalType = this.app.uniforms.u_fractalType.value;
    const config = this.fractalConfigs[fractalType];

    // Check if current fractal supports zoom
    if (!config || !config.enabled) {
      return;
    }

    // Update zoom center based on mode
    this.updateZoomCenter();

    // Cache base iterations on first run
    if (this.baseIterations === 0) {
      this.baseIterations = this.app.uniforms.u_iterations.value;
      this.minIterations = Math.max(4, this.baseIterations);
      this.maxIterations = Math.min(20, this.baseIterations + 8);
    }

    // Handle scale wrapping transition
    if (this.wrapInProgress) {
      this.updateScaleWrapTransition(delta);
      return;
    }

    // ZOOM IN: Increase fractal scale (makes fractal appear bigger/closer)
    const scaleGrowth = 1.0 + this.speed * delta * 0.05;
    const currentScale = this.app.uniforms.u_fractalScale.value;
    const newScale = currentScale * scaleGrowth;
    this.app.uniforms.u_fractalScale.value = newScale;

    // Track cumulative zoom depth
    this.cumulativeScale *= scaleGrowth;

    // REVEAL DETAIL: Gradually increase iterations as we zoom in (conservative)
    // But don't increase too aggressively to maintain performance
    if (newScale / this.lastIterationScale >= this.iterationIncreaseThreshold) {
      const currentIterations = this.app.uniforms.u_iterations.value;
      // Only increase if we're below a safe limit
      const safeIterationLimit = Math.min(this.maxIterations, this.baseIterations + 4);
      if (currentIterations < safeIterationLimit) {
        this.app.uniforms.u_iterations.value = currentIterations + 1;
        this.lastIterationScale = newScale;
        console.log(
          `🔍 Increased iterations: ${currentIterations} → ${currentIterations + 1} (scale: ${newScale.toFixed(2)})`
        );
      }
    }

    // OPTIONAL: Move camera slowly toward origin for visual variety
    if (this.cameraMoveEnabled) {
      this.applyCameraMovement(delta);
    }

    // Auto-rotate fractal for cinematic effect
    if (this.autoRotate) {
      this.applyAutoRotation(delta);
    }

    // WRAP: When scale gets too large, reset to exploit self-similarity
    if (newScale > this.wrapThreshold) {
      this.performScaleWrap(config.scaleFactor);
    }
  }

  /**
   * Applies slow camera movement along view direction.
   * DISABLED BY DEFAULT - zoom is purely scale-based.
   *
   * This is optional and can create additional motion during zoom,
   * but it's not necessary for the zoom effect (which is scale-based).
   *
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  applyCameraMovement(delta) {
    const cam = this.app.renderer.camera;

    // Get camera forward direction
    const forward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(cam.quaternion)
      .normalize();

    // Move camera slowly forward (optional additional motion)
    const moveAmount = this.cameraMoveSpeed * this.speed * delta;
    cam.position.addScaledVector(forward, moveAmount);

    // Update camera uniform
    this.app.uniforms.u_cameraPos.value.copy(cam.position);
  }

  /**
   * Applies auto-rotation to fractal for cinematic effect.
   *
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  applyAutoRotation(delta) {
    const rot = this.app.rotation;
    rot.y += this.rotationSpeed * delta;
    this.app.uniforms.u_rotation.value.copy(rot);
  }

  /**
   * Performs scale wrapping to exploit fractal self-similarity.
   *
   * Key insight: Fractals look similar at different scales.
   * When scale gets too large:
   * 1. DIVIDE fractal scale by scaleFactor (reset to smaller value)
   * 2. Camera stays in place (no movement needed)
   * 3. RESET iterations to base level (maintain performance)
   *
   * Example for Menger Sponge (scaleFactor = 3.0):
   * - Scale 100 → 33.3 (divide by 3)
   * - Camera stays at same position
   * - Iterations reset to baseIterations + 2
   * - Result: Fractal appears similar due to self-similarity, ready for next zoom cycle
   *
   * Note: Zoom center is controlled by u_zoomCenter uniform (origin or view-based).
   *
   * @param {number} scaleFactor - Fractal-specific scale factor
   */
  performScaleWrap(scaleFactor) {
    const cam = this.app.renderer.camera;
    const currentScale = this.app.uniforms.u_fractalScale.value;
    const currentIterations = this.app.uniforms.u_iterations.value;

    // CORRECT: Divide scale to reset (not multiply!)
    const newScale = currentScale / scaleFactor;

    // Safety check: prevent scale from becoming too small
    if (newScale < this.safeScaleMin) {
      console.warn(
        `⚠️ Scale wrap would go below minimum (${newScale.toFixed(4)}). Emergency reset.`
      );
      this.app.uniforms.u_fractalScale.value = 1.0;
      this.cumulativeScale = 1.0;
      this.lastIterationScale = 1.0;
      return;
    }

    // Camera stays in place during wrapping
    // The zoom is purely scale-based, centered at fractal origin
    // Visual continuity maintained by scale relationship alone
    const newCameraPos = cam.position.clone();

    // CRITICAL: Reset iterations to base level during wrapping
    // This maintains performance for infinite zoom (iterations don't accumulate)
    // The fractal still looks detailed because we're at a new scale level
    const newIterations = Math.max(
      this.minIterations,
      Math.min(this.baseIterations + 2, currentIterations)
    );

    // Store transition state
    this.wrapStartPos.copy(cam.position);
    this.wrapTargetPos.copy(newCameraPos);
    this.wrapStartScale = currentScale;
    this.wrapTargetScale = newScale;
    this.wrapStartIterations = currentIterations;
    this.wrapTargetIterations = newIterations;

    // Start transition
    this.wrapInProgress = true;
    this.wrapT = 0.0;

    // Reset cumulative scale tracker
    this.cumulativeScale = newScale;
    this.lastIterationScale = newScale;

    const iterationChange = newIterations > currentIterations ? '↑' :
                           newIterations < currentIterations ? '↓' : '=';
    console.log(
      `🔄 Scale wrap: ${currentScale.toFixed(2)} → ${newScale.toFixed(2)} ` +
      `(÷${scaleFactor}), camera stays, ` +
      `iterations: ${currentIterations} ${iterationChange} ${newIterations}`
    );
  }

  /**
   * Updates smooth transition during scale wrapping.
   *
   * Uses ease-in-out cubic interpolation for smooth visual continuity.
   * Interpolates camera position, fractal scale, and iterations.
   *
   * @param {number} delta - Time elapsed since last frame (seconds)
   */
  updateScaleWrapTransition(delta) {
    // Advance transition parameter
    this.wrapT += delta / this.wrapDuration;

    if (this.wrapT >= 1.0) {
      // Transition complete
      this.wrapInProgress = false;
      this.wrapT = 0.0;

      // Snap to final values
      const cam = this.app.renderer.camera;
      cam.position.copy(this.wrapTargetPos);
      this.app.uniforms.u_cameraPos.value.copy(cam.position);
      this.app.uniforms.u_fractalScale.value = this.wrapTargetScale;
      this.app.uniforms.u_iterations.value = this.wrapTargetIterations;

      return;
    }

    // Smooth ease-in-out cubic interpolation
    const t = this.wrapT;
    const smoothT = t * t * (3.0 - 2.0 * t);

    // Interpolate camera position
    const cam = this.app.renderer.camera;
    cam.position.lerpVectors(this.wrapStartPos, this.wrapTargetPos, smoothT);
    this.app.uniforms.u_cameraPos.value.copy(cam.position);

    // Interpolate fractal scale
    const scale = THREE.MathUtils.lerp(
      this.wrapStartScale,
      this.wrapTargetScale,
      smoothT
    );
    this.app.uniforms.u_fractalScale.value = scale;

    // Iterations change instantly (integer value, no need for smooth interpolation)
    // Use threshold to switch cleanly at halfway point
    if (smoothT >= 0.5 && this.app.uniforms.u_iterations.value !== this.wrapTargetIterations) {
      this.app.uniforms.u_iterations.value = this.wrapTargetIterations;
    }
  }

  /**
   * Gets configuration for current fractal type.
   *
   * @returns {Object|null} Fractal config or null if not found
   */
  getCurrentConfig() {
    const fractalType = this.app.uniforms.u_fractalType.value;
    return this.fractalConfigs[fractalType] || null;
  }

  /**
   * Gets dynamic scale factor for Mandelbulb based on power uniform.
   *
   * @returns {number} Scale factor based on current power setting
   */
  getMandelbulbScaleFactor() {
    const power = this.app.uniforms.u_fractalPower?.value || 8.0;
    return power; // Power N Mandelbulb has roughly N^N self-similarity
  }

  /**
   * Resets zoom state to defaults.
   */
  reset() {
    this.cumulativeScale = 1.0;
    this.wrapInProgress = false;
    this.wrapT = 0.0;
    this.lastIterationScale = 1.0;
    this.baseIterations = 0; // Will be re-cached on next enable
    this.app.uniforms.u_fractalScale.value = 1.0;
    // Note: We don't reset u_iterations here - user may have custom value
  }

  /**
   * Gets current zoom depth as a string (for debugging/UI).
   *
   * @returns {string} Human-readable zoom depth
   */
  getZoomDepthString() {
    if (this.cumulativeScale < 1000) {
      return `${this.cumulativeScale.toFixed(1)}×`;
    } else if (this.cumulativeScale < 1000000) {
      return `${(this.cumulativeScale / 1000).toFixed(1)}k×`;
    } else {
      return `${(this.cumulativeScale / 1000000).toFixed(1)}M×`;
    }
  }
}
