/**
 * PerformanceTest - GPU capability detection and quality preset recommendation
 * Runs a brief benchmark to determine optimal settings
 */

export class PerformanceTest {
  constructor(renderer, scene, camera, material) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.material = material;
    this.STORAGE_KEY = 'fractalExplorer_perfTest';
    this._snapshot = null;
  }

  /**
   * Get saved quality preference
   * @returns {Object|null} Saved quality settings or null
   */
  static getSavedQuality() {
    try {
      const saved = localStorage.getItem('fractalExplorer_quality');
      if (saved) {
        const data = JSON.parse(saved);
        console.log('📦 Found saved quality preference:', data.quality);
        return data;
      }
    } catch (e) {
      console.warn('Failed to read saved quality:', e);
    }
    return null;
  }

  /**
   * Save quality preference
   * @param {string} quality - Quality level (Low, Medium, High, Ultra)
   * @param {number} maxSteps - Ray marching steps
   * @param {number} iterations - Fractal iterations
   */
  static saveQuality(quality, maxSteps, iterations) {
    try {
      localStorage.setItem(
        'fractalExplorer_quality',
        JSON.stringify({
          quality,
          maxSteps,
          iterations,
          timestamp: Date.now(),
        })
      );
      console.log(`💾 Saved quality preference: ${quality}`);
    } catch (e) {
      console.warn('Failed to save quality:', e);
    }
  }

  /**
   * Run performance test
   * @param {boolean} skipTest - Skip test and use medium quality
   * @returns {Promise<Object>} Recommended settings
   */
  async runTest(skipTest = false) {
    if (skipTest) {
      const skippedResults = {
        quality: 'Medium',
        fps: 60,
        maxSteps: 96,
        iterations: 6,
        skipped: true,
      };
      PerformanceTest.saveQuality('Medium', 96, 6);
      return skippedResults;
    }

    console.log('🔍 Running GPU performance test...');

    // Take a snapshot of important state so we can restore it exactly after testing.
    this._snapshot = this.snapshotState();

    // Measure in-situ (use current scene settings) to match observed FPS
    // We still snapshot and restore to be safe.

    // Warm-up GPU for consistent clocks/caches.
    await this.warmup(document.visibilityState === 'hidden' ? 3 : 20);

    // Measure canonical quality tiers so labels match budgets
    const tiers = {
      Low: { maxSteps: 64, iterations: 4 },
      Medium: { maxSteps: 96, iterations: 6 },
      High: { maxSteps: 128, iterations: 8 },
      Ultra: { maxSteps: 200, iterations: 12 },
    };

    const low = await this.testQualityLevel(tiers.Low.maxSteps, tiers.Low.iterations);
    const medium = await this.testQualityLevel(tiers.Medium.maxSteps, tiers.Medium.iterations);
    const high = await this.testQualityLevel(tiers.High.maxSteps, tiers.High.iterations);
    const ultra = await this.testQualityLevel(tiers.Ultra.maxSteps, tiers.Ultra.iterations);

    const results = { low, medium, high, ultra };

    // Restore prior state so the app resumes exactly how it was.
    this.restoreState(this._snapshot);
    this._snapshot = null;

    console.log('📊 Test Results:', results);

    // Determine best quality level; then snap to canonical budgets
    let tier = 'Low';
    if (results.ultra.fps >= 60) tier = 'Ultra';
    else if (results.high.fps >= 55) tier = 'High';
    else if (results.medium.fps >= 45) tier = 'Medium';
    else tier = 'Low';

    const canonical = tiers[tier];
    const measured = results[tier.toLowerCase()];
    const recommended = {
      quality: tier,
      fps: measured.fps,
      frameTime: measured.frameTime,
      maxSteps: canonical.maxSteps,
      iterations: canonical.iterations,
    };

    console.log(
      '✅ Recommended Quality:',
      recommended.quality,
      `(${recommended.fps.toFixed(1)} FPS)`
    );
    console.log('📊 All FPS Results:', {
      low: results.low.fps.toFixed(1),
      medium: results.medium.fps.toFixed(1),
      high: results.high.fps.toFixed(1),
      ultra: results.ultra.fps.toFixed(1),
    });

    // Save the quality preference (canonical budgets)
    PerformanceTest.saveQuality(recommended.quality, recommended.maxSteps, recommended.iterations);

    return recommended;
  }

  /**
   * Test a specific quality level
   * @param {number} maxSteps - Ray marching steps
   * @param {number} iterations - Fractal iterations
   * @returns {Promise<Object>} Performance metrics
   */
  async testQualityLevel(maxSteps, iterations) {
    const u = this.material.uniforms;
    // Apply test parameters
    u.u_maxSteps.value = maxSteps;
    u.u_iterations.value = iterations;

    // Let the app render a handful of frames with the new settings
    await this.waitFrames(10);

    // Measure delivered frame rate using the app's RAF (no manual renders)
    const frameCount = document.visibilityState === 'hidden' ? 45 : 180; // shorter when backgrounded
    const t0 = performance.now();
    await this.waitFrames(frameCount);
    const t1 = performance.now();

    const totalTime = t1 - t0;
    const fps = (frameCount / Math.max(totalTime, 1)) * 1000;
    return { maxSteps, iterations, fps, frameTime: totalTime / frameCount };
  }

  /**
   * Measure FPS for current on-screen settings without changing uniforms.
   */
  async testCurrentSettings() {
    const u = this.material.uniforms;
    const dbg = {
      maxSteps: u.u_maxSteps ? u.u_maxSteps.value : undefined,
      iterations: u.u_iterations ? u.u_iterations.value : undefined,
      enableBudgetLOD: u.u_enableBudgetLOD ? u.u_enableBudgetLOD.value : undefined,
      enableDistanceLOD: u.u_enableDistanceLOD ? u.u_enableDistanceLOD.value : undefined,
      aoEnabled: u.u_aoEnabled ? u.u_aoEnabled.value : undefined,
      softShadowsEnabled: u.u_softShadowsEnabled ? u.u_softShadowsEnabled.value : undefined,
      lodNear: u.u_lodNear ? u.u_lodNear.value : undefined,
      lodFar: u.u_lodFar ? u.u_lodFar.value : undefined,
      budgetStepsFarFactor: u.u_budgetStepsFarFactor ? u.u_budgetStepsFarFactor.value : undefined,
      farShadowSkipFactor: u.u_farShadowSkipFactor ? u.u_farShadowSkipFactor.value : undefined,
      softShadowSteps: u.u_softShadowSteps ? u.u_softShadowSteps.value : undefined,
      aoMinSamples: u.u_aoMinSamples ? u.u_aoMinSamples.value : undefined,
      visibility: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    };
    console.log('🧪 Ultra uniforms at measure:', dbg);

    // Warm-up in-place
    await this.waitFrames(10);
    const frameCount = document.visibilityState === 'hidden' ? 60 : 240; // shorter when backgrounded
    const t0 = performance.now();
    await this.waitFrames(frameCount);
    const t1 = performance.now();
    const totalTime = t1 - t0;

    const fps = (frameCount / Math.max(totalTime, 1)) * 1000;
    console.log('🧪 Ultra FPS (RAF-timed):', fps.toFixed(1));
    return {
      maxSteps: dbg.maxSteps,
      iterations: dbg.iterations,
      fps,
      frameTime: totalTime / frameCount,
    };
  }

  /**
   * Wait for next animation frame
   * @returns {Promise<void>}
   */
  waitFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }

  async warmup(frames = 10) {
    for (let i = 0; i < frames; i++) {
      await this.waitFrame();
    }
  }

  async waitFrames(n) {
    for (let i = 0; i < n; i++) {
      await this.waitFrame();
    }
  }

  snapshotState() {
    const u = this.material.uniforms;
    const cam = this.camera;
    return {
      uniforms: {
        u_maxSteps: u.u_maxSteps.value,
        u_iterations: u.u_iterations.value,
        u_enableBudgetLOD: u.u_enableBudgetLOD ? u.u_enableBudgetLOD.value : undefined,
        u_enableDistanceLOD: u.u_enableDistanceLOD ? u.u_enableDistanceLOD.value : undefined,
        u_aoEnabled: u.u_aoEnabled ? u.u_aoEnabled.value : undefined,
        u_softShadowsEnabled: u.u_softShadowsEnabled ? u.u_softShadowsEnabled.value : undefined,
      },
      camera: {
        position: cam.position.clone(),
        rotation: cam.rotation.clone(),
      },
    };
  }

  restoreState(snapshot) {
    if (!snapshot) return;
    const u = this.material.uniforms;
    const s = snapshot.uniforms;
    if (u.u_maxSteps) u.u_maxSteps.value = s.u_maxSteps;
    if (u.u_iterations) u.u_iterations.value = s.u_iterations;
    if (u.u_enableBudgetLOD && s.u_enableBudgetLOD !== undefined)
      u.u_enableBudgetLOD.value = s.u_enableBudgetLOD;
    if (u.u_enableDistanceLOD && s.u_enableDistanceLOD !== undefined)
      u.u_enableDistanceLOD.value = s.u_enableDistanceLOD;
    if (u.u_aoEnabled && s.u_aoEnabled !== undefined) u.u_aoEnabled.value = s.u_aoEnabled;
    if (u.u_softShadowsEnabled && s.u_softShadowsEnabled !== undefined)
      u.u_softShadowsEnabled.value = s.u_softShadowsEnabled;

    // Restore camera pose
    this.camera.position.copy(snapshot.camera.position);
    this.camera.rotation.copy(snapshot.camera.rotation);
  }

  setTestOverrides({ enableBudgetLOD, enableDistanceLOD, aoEnabled, softShadowsEnabled }) {
    const u = this.material.uniforms;
    if (u.u_enableBudgetLOD) u.u_enableBudgetLOD.value = !!enableBudgetLOD;
    if (u.u_enableDistanceLOD) u.u_enableDistanceLOD.value = !!enableDistanceLOD;
    if (u.u_aoEnabled) u.u_aoEnabled.value = !!aoEnabled;
    if (u.u_softShadowsEnabled) u.u_softShadowsEnabled.value = !!softShadowsEnabled;
  }

  /**
   * Get GPU info (if available)
   * @returns {Object} GPU information
   */
  getGPUInfo() {
    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    let vendor = 'Unknown';
    let renderer = 'Unknown';

    if (debugInfo) {
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    return {
      vendor,
      renderer,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    };
  }
}
