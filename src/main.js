import * as THREE from 'three';
import { DEFAULTS } from './config/defaults.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import Stats from 'stats.js';
import { GUIManager } from './ui/GUIManager.js';
import { hasOverridesInStorage } from './config/utils.js';
import { PerformanceTest } from './core/PerformanceTest.js';
import { PaletteManager, MAX_PALETTE_STOPS } from './core/PaletteManager.js';
import vertexShader from './shaders/fractal.vert.glsl';
import screenVertex from './shaders/screen.vert.glsl';
import fragmentSource from './shaders/fractal.frag.glsl';
import postFragment from './shaders/post.frag.glsl';
// Manually resolve GLSL includes by concatenation since WebGL has no preprocessor
import commonGLSL from './shaders/includes/common.glsl';
import sdfPrimitivesGLSL from './shaders/includes/sdf-primitives.glsl';
import sdfOperationsGLSL from './shaders/includes/sdf-operations.glsl';
import sdfMengerGLSL from './shaders/includes/sdf-menger.glsl';
import sdfMandelbulbGLSL from './shaders/includes/sdf-mandelbulb.glsl';
import sdfMandelboxGLSL from './shaders/includes/sdf-mandelbox.glsl';
import sdfSierpinskiGLSL from './shaders/includes/sdf-sierpinski.glsl';
import sdfAmazingSurfGLSL from './shaders/includes/sdf-amazing-surf.glsl';
import sdfTruchetPipesGLSL from './shaders/includes/sdf-truchet-pipes.glsl';
import proceduralTexturesGLSL from './shaders/includes/procedural-textures.glsl';
// DEC utils (shared constants/helpers for injected snippets)
import decUtilsGLSL from './shaders/includes/dec/dec-utils.glsl';
// DEC preview support: load manifest and all DEC include modules (eager)
import _decManifest from './shaders/includes/dec/manifest.json';
import decStub from './shaders/includes/dec/__user__.glsl';
// Vite will transform GLSL files into JS modules exporting the source string.
// Eagerly import to allow quick mapping by path.
const DEC_MODULES = import.meta.glob('./shaders/includes/dec/**/*.glsl', { eager: true });
import coloringGLSL from './shaders/includes/coloring.glsl';

/**
 * Fractal Explorer - Main Entry Point
 * Phase 2: Ray marching with flight controls
 */

class FractalExplorer {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.clock = new THREE.Clock();
    this.time = 0;
    this.hasShaderError = false; // gate loading fade-out on shader errors
    this.initComplete = false; // mark when init reached end
    this._animationStarted = false;
    this.running = true; // ensure RAF schedules continuously
    this._rafId = null;
    // Track applied palette to force updates if GUI events are missed
    this._lastAppliedPalette = DEFAULTS.palette | 0;

    // Shader specialization (compile-time FRAC_TYPE) cache
    this.materialCache = new Map(); // key: fractal type (int) => ShaderMaterial
    this.baseFragmentShader = null; // resolved source used for all variants

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

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.shiftPressed = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 10.0;
    this.flyMode = DEFAULTS.flyMode || false;

    // Animation state
    this.animationEnabled = false;
    this.rotationSpeed = new THREE.Vector3(0.2, 0.15, 0.1); // Per-axis rotation speeds
    this.rotation = new THREE.Vector3(0, 0, 0); // Current rotation angles
    // Fractal manual-rotate via mouse while space is held
    this.spaceMouseRotate = false;
    this.onMouseRotate = (e) => {
      if (!this.spaceMouseRotate) return;
      if (!this.controls || !this.controls.isLocked) return;
      // Intercept so PointerLockControls doesn't consume it
      e.stopImmediatePropagation();
      e.preventDefault();
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;
      const sens = 0.002; // radians per pixel, similar to PointerLockControls
      this.rotation.y -= movementX * sens;
      this.rotation.x -= movementY * sens;
    };

    this.init();
  }

  async init() {
    this.updateLoadingProgress(10, 'Setting up renderer...');
    this.setupRenderer();

    this.updateLoadingProgress(20, 'Initializing camera...');
    this.setupCamera();

    this.updateLoadingProgress(30, 'Creating scene...');
    this.setupScene();

    this.updateLoadingProgress(45, 'Compiling shaders...');
    this.setupShader();
    // Restore saved fractal type (if present) before GUI is created
    this.loadSavedFractalType();

    // Always use specialized materials for the current fractal
    this.applyMaterialSpecializationIfNeeded(true);
    // Prewarm specialized shader variants to avoid first-switch stutter
    await this.prewarmSpecializedMaterials([0, 1, 2, 3, 4, 5, 6, 7]);

    this.updateLoadingProgress(60, 'Setting up controls...');
    this.setupControls();

    this.updateLoadingProgress(70, 'Initializing stats...');
    this.setupStats();
    this.addProfileHelpers();

    // Auto-benchmark if no saved quality; no modal
    this.updateLoadingProgress(75, 'Checking performance settings...');
    const saved = PerformanceTest.getSavedQuality();
    if (saved) {
      console.log('✅ Using saved quality preference - skipping benchmark');
      this.applySavedQuality(saved);
    } else {
      this.updateLoadingProgress(80, 'Benchmarking GPU...');
      if (!this._animationStarted) {
        this._animationStarted = true;
        this.animate();
      }
      await this.runPerformanceTest(false);
    }

    this.updateLoadingProgress(90, 'Setting up GUI...');
    this.setupGUI();

    // Apply default preset on first run when no saved quality AND no overrides exist
    // Disabled: Let users start with defaults instead of a preset
    // try {
    //   const hasOverrides = hasOverridesInStorage();
    //   if (!saved && !hasOverrides) {
    //     if (this.guiManager && this.guiManager.applyPreset) {
    //       this.guiManager.applyPreset('Truchet Interior (Perf)');
    //     }
    //   }
    // } catch (_) {}

    this.updateLoadingProgress(95, 'Finalizing...');
    this.setupEventListeners();

    this.updateLoadingProgress(100, 'Ready!');
    this.initComplete = true;
    await this.attemptFinishLoading();
    if (!this.hasShaderError && !this._animationStarted) {
      this._animationStarted = true;
      this.animate();
    }
  }

  updateLoadingProgress(percent, status) {
    const progressBar = document.getElementById('loading-progress-bar');
    const statusText = document.getElementById('loading-status');

    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
    if (statusText) {
      statusText.textContent = status;
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Use linear color space since we're doing custom shader
    // This prevents double gamma correction
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    // Install WebGL shader compile/link hooks to reflect progress
    // and surface errors in the loading UI.
    this.installGLCompileHooks();

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

    // Initialize GPU timer query (profiling)
    const gl = this.renderer.getContext();
    this._gpu = { gl, ext: null, query: null, lastMs: null, active: false };
    // Disable GPU timer queries in production path (driver stalls seen on some ANGLE/Metal stacks)
    // this._gpu.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') || gl.getExtension('EXT_disjoint_timer_query');
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Try to restore saved camera position and rotation
    const savedCamera = this.loadCameraPosition();
    if (savedCamera) {
      const pos = savedCamera.position;
      this.camera.position.set(pos.x, pos.y, pos.z);

      if (savedCamera.rotation) {
        const rot = savedCamera.rotation;
        this.camera.rotation.set(rot.x, rot.y, rot.z);
      }

      console.log('📷 Restored camera:', savedCamera);
    } else {
      // Default camera when no saved position is available
      this.camera.position.set(0, 0, 7.0);
      // Ensure initial orientation looks at origin
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    // Save camera position every second
    setInterval(() => {
      this.saveCameraPosition();
    }, 1000);
  }

  saveCameraPosition() {
    const data = {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      autoFitDEC: () => {
        try {
          if (!this.decPreview.enabled) {
            this.decPreview.enabled = true;
            if (this.guiManager.callbacks && this.guiManager.callbacks.onDecPreviewToggle)
              this.guiManager.callbacks.onDecPreviewToggle(true);
          }
          if (this.guiManager && this.guiManager.setFractalType) this.guiManager.setFractalType(7);
          const u = this.uniforms;
          const cam = this.camera;
          const fovDeg = u && u.u_fov ? u.u_fov.value || 45.0 : 45.0;
          const fovRad = (fovDeg * Math.PI) / 180.0;
          const center = u && u.u_decOffset ? u.u_decOffset.value : new THREE.Vector3(0, 0, 0);
          const dist = Math.max(0.5, center.clone().sub(cam.position).length() || 4.0);
          const fill = 0.6;
          const sWanted = Math.max(0.2, fill * dist * Math.tan(fovRad * 0.5));
          if (u && u.u_fractalScale) u.u_fractalScale.value = sWanted;
          if (this.guiManager && this.guiManager.params) {
            this.guiManager.params.scale = sWanted;
            try {
              if (this.guiManager.gui && this.guiManager.gui.controllersRecursive)
                this.guiManager.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
            } catch (_) {}
          }
          try {
            console.log('[DEC autofit] dist', dist.toFixed(2), 'scale', sWanted.toFixed(2));
            this.showToast && this.showToast('🔍 Auto Fit applied');
          } catch (_) {}
          try {
            if (this.renderer && this.scene && this.camera)
              this.renderer.render(this.scene, this.camera);
          } catch (_) {}
        } catch (e) {
          console.warn('AutoFit DEC failed:', e);
        }
      },
      rotation: {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z,
      },
    };
    localStorage.setItem('fractalExplorer_cameraPosition', JSON.stringify(data));
  }

  loadCameraPosition() {
    try {
      const saved = localStorage.getItem('fractalExplorer_cameraPosition');
      if (saved) {
        const data = JSON.parse(saved);
        // Handle old format (just position) and new format (position + rotation)
        if (data.position) {
          return data; // New format
        } else {
          // Old format - convert to new format
          return { position: data, rotation: null };
        }
      }
    } catch (e) {
      console.warn('Failed to load camera position:', e);
    }
    return null;
  }

  setupScene() {
    this.scene = new THREE.Scene();

    // We don't need a quad - we'll render directly to screen
    this.material = null;
    this.quad = null;
  }

  setupShader() {
    // Uniforms for the shader
    this.uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_cameraPos: { value: new THREE.Vector3() },
      u_cameraTarget: { value: new THREE.Vector3() },
      u_fov: { value: DEFAULTS.fov },
      // Camera world-space basis (for robust ray dir)
      u_camRight: { value: new THREE.Vector3(1, 0, 0) },
      u_camUp: { value: new THREE.Vector3(0, 1, 0) },

      // Fractal parameters
      u_fractalType: { value: DEFAULTS.fractalType },
      u_iterations: { value: DEFAULTS.iterations },
      u_fractalPower: { value: DEFAULTS.power },
      u_fractalScale: { value: DEFAULTS.scale },
      u_rotation: { value: new THREE.Vector3(0, 0, 0) }, // Per-axis rotation

      // Lighting
      u_lightPos: { value: new THREE.Vector3(10, 10, 10) },
      u_lightColor: { value: new THREE.Color(DEFAULTS.lightColor) },
      u_tintDiffuse: { value: false },
      u_ambientStrength: { value: DEFAULTS.ambientStrength },
      u_diffuseStrength: { value: DEFAULTS.diffuseStrength },
      u_specularStrength: { value: DEFAULTS.specularStrength },
      u_shininess: { value: DEFAULTS.shininess },

      // Environment
      u_fogEnabled: { value: DEFAULTS.fogEnabled },
      u_fogType: { value: DEFAULTS.fogType },
      u_fogDensity: { value: DEFAULTS.fogDensity },
      u_fogNear: { value: DEFAULTS.fogNear },
      u_fogFar: { value: DEFAULTS.fogFar },
      u_fogColor: { value: new THREE.Color(0.1, 0.1, 0.15) },
      u_backgroundColor: { value: new THREE.Color(DEFAULTS.backgroundColor) },
      // Post Processing
      u_postExposure: { value: DEFAULTS.postExposure },
      u_postContrast: { value: DEFAULTS.postContrast },
      u_postSaturation: { value: DEFAULTS.postSaturation },
      u_postGamma: { value: DEFAULTS.postGamma },
      u_vignetteStrength: { value: DEFAULTS.vignetteStrength },
      u_vignetteSoftness: { value: DEFAULTS.vignetteSoftness },
      u_toneMapper: { value: DEFAULTS.toneMapper },

      // Floor
      u_floorEnabled: { value: DEFAULTS.floorEnabled },
      u_floorColorA: { value: new THREE.Color(DEFAULTS.floorColorA) },
      u_floorColorB: { value: new THREE.Color(DEFAULTS.floorColorB) },
      u_floorReceiveShadows: { value: DEFAULTS.floorReceiveShadows === true },
      // Procedural texture application target (0=Fractal,1=Floor,2=Both)
      u_texApplyTarget: { value: DEFAULTS.textureApplyTarget | 0 },
      // Floor texture mode (0=Fast 2D, 1=Full Triplanar)
      u_floorTexMode: { value: DEFAULTS.floorTextureMode | 0 },
      // Floor performance knobs
      u_floorIgnoreWarp: { value: !!DEFAULTS.floorIgnoreWarp },
      u_floorBumpScale: { value: DEFAULTS.floorBumpScale },
      u_floorSpecScale: { value: DEFAULTS.floorSpecScale },
      // Floor LOD
      u_floorTexDisableDist: { value: DEFAULTS.floorTexDisableDist },
      u_floorTexAutoDisable: { value: !!DEFAULTS.floorTexAutoDisable },
      u_floorTexAutoMul: { value: DEFAULTS.floorTexAutoMul },
      u_floorFadeNear: { value: DEFAULTS.floorFadeNear },
      u_floorFadeFar: { value: DEFAULTS.floorFadeFar },

      // Performance
      u_maxSteps: { value: DEFAULTS.maxSteps },
      u_stepRelaxation: { value: DEFAULTS.stepRelaxation },

      // Ambient Occlusion
      u_aoEnabled: { value: true },

      // Soft Shadows
      u_softShadowsEnabled: { value: true },
      u_softShadowSteps: { value: DEFAULTS.softShadowMinSteps },
      u_shadowSharpness: { value: DEFAULTS.shadowSharpness },
      u_shadowBiasBase: { value: DEFAULTS.shadowBiasBase || 0.0015 },
      u_shadowBiasSlope: { value: DEFAULTS.shadowBiasSlope || 0.0005 },
      u_aoFallbackStrength: { value: DEFAULTS.aoFallbackStrength || 0.5 },
      u_shadowBiasAngle: { value: DEFAULTS.shadowBiasAngle || 0.002 },
      u_shadowPlaneBias: { value: DEFAULTS.shadowPlaneBias || 0.02 },
      u_shadowDitherStrength: { value: DEFAULTS.shadowDitherStrength || 0.0 },

      // DEC Preview
      u_decOffset: { value: new THREE.Vector3(0, 0, 0) },

      // Normal Calculation
      u_normalEpsilon: { value: DEFAULTS.normalEpsilon },

      // Debug
      u_debugEnabled: { value: DEFAULTS.debugEnabled },
      u_debugMode: { value: DEFAULTS.debugMode },
      u_dbgBypassSierpinskiAlign: { value: DEFAULTS.dbgBypassSierpinskiAlign },
      u_dbgBypassFractalRotation: { value: DEFAULTS.dbgBypassFractalRotation },
      u_sierpinskiBase: { value: DEFAULTS.sierpinskiBase },
      u_aoMaxSamples: { value: DEFAULTS.aoMaxSamples || 4 },
      u_shadowEarlyExit: { value: DEFAULTS.shadowEarlyExit || 0.0 },
      u_shadowStepClamp: { value: DEFAULTS.shadowStepClamp || 0.0 },
      u_fastNormals: { value: false },
      u_fastShadows: { value: false },
      u_fastAO: { value: false },

      // Advanced Ray Marching Optimizations
      u_adaptiveRelaxation: { value: DEFAULTS.adaptiveRelaxation },
      u_relaxationMin: { value: DEFAULTS.relaxationMin },
      u_relaxationMax: { value: DEFAULTS.relaxationMax },
      u_enableDithering: { value: DEFAULTS.enableDithering },
      u_ditheringStrength: { value: DEFAULTS.ditheringStrength },
      u_useBlueNoise: { value: DEFAULTS.useBlueNoise },
      u_blueNoiseScale: { value: DEFAULTS.blueNoiseScale },
      u_blueNoiseTemporalJitter: { value: DEFAULTS.blueNoiseTemporalJitter },
      u_ditherFog: { value: DEFAULTS.ditherFog },
      u_skipWhenEmpty: { value: false },
      u_enableDistanceLOD: { value: DEFAULTS.enableDistanceLOD },
      u_enableBudgetLOD: { value: DEFAULTS.enableBudgetLOD },
      u_lodNear: { value: DEFAULTS.lodNear },
      u_lodFar: { value: DEFAULTS.lodFar },
      u_budgetStepsFarFactor: { value: DEFAULTS.budgetStepsFarFactor },
      u_farShadowSkipFactor: { value: DEFAULTS.farShadowSkipFactor },
      u_aoMinSamples: { value: DEFAULTS.aoMinSamples },
      u_softShadowMinSteps: { value: DEFAULTS.softShadowMinSteps },
      // Curvature-aware relaxation
      u_curvatureAwareRelaxation: { value: DEFAULTS.curvatureAwareRelaxation },
      u_curvatureNearOnly: { value: DEFAULTS.curvatureNearOnly },
      u_curvatureNearK: { value: DEFAULTS.curvatureNearK },
      // Bounds culling
      u_enableBoundsCulling: { value: DEFAULTS.enableBoundsCulling },
      u_boundsCullMargin: { value: DEFAULTS.boundsCullMargin },
      u_cullMode: { value: DEFAULTS.cullingMode },
      // Integrator selection & normals
      u_useSegmentTracing: { value: DEFAULTS.useSegmentTracing },
      u_segmentFraction: { value: DEFAULTS.segmentFraction },
      u_useAnalyticNormals: { value: DEFAULTS.useAnalyticNormals },
      // Step safety
      u_stepSafety: { value: DEFAULTS.stepSafety },
      u_stepSafetyAuto: { value: DEFAULTS.stepSafetyAuto },
      u_stepSafetyMin: { value: DEFAULTS.stepSafetyMin },
      u_stepSafetyMax: { value: DEFAULTS.stepSafetyMax },
      u_stepSafetyBandNear: { value: DEFAULTS.stepSafetyBandNear },
      u_stepSafetyBandFar: { value: DEFAULTS.stepSafetyBandFar },
      // Hit safety
      u_conservativeHits: { value: DEFAULTS.conservativeHits },
      // Integrator auto
      u_integratorAuto: { value: DEFAULTS.integratorAuto },
      u_integratorSwitchDist: { value: DEFAULTS.integratorSwitchDist },

      // Color System
      u_colorMode: { value: DEFAULTS.colorMode },
      u_paletteId: { value: DEFAULTS.palette },
      u_colorIntensity: { value: DEFAULTS.colorIntensity },
      u_orbitTrapScale: { value: DEFAULTS.orbitTrapScale },
      u_materialColor: { value: new THREE.Color(0.8, 0.4, 0.2) }, // Material mode color (warm orange)
      // Custom palette (off by default)
      u_useCustomPalette: { value: 0 },
      u_paletteStopCount: { value: 2 },
      u_paletteStops: {
        value: new Float32Array(MAX_PALETTE_STOPS)
          .fill(0)
          .map((_, i, a) => (i === a.length - 1 ? 1 : i / (a.length - 1))),
      },
      u_paletteColors: {
        value: new Array(MAX_PALETTE_STOPS).fill(0).map(() => new THREE.Vector3(1, 1, 1)),
      },
      u_paletteInterpMode: { value: 0 },
      u_paletteWrapMode: { value: 0 },
      // Texture color mapping (Texture color mode)
      u_texColorBase: { value: new THREE.Color(DEFAULTS.texColorBase || '#bfbfbf') },
      u_texColorAccent: { value: new THREE.Color(DEFAULTS.texColorAccent || '#303030') },
      u_texLayerColoring: { value: DEFAULTS.texLayerColoring === true },
      u_texA_colorBase: { value: new THREE.Color(DEFAULTS.texAColorBase || '#d0cdc6') },
      u_texA_colorAccent: { value: new THREE.Color(DEFAULTS.texAColorAccent || '#2f2c2a') },
      u_texB_colorBase: { value: new THREE.Color(DEFAULTS.texBColorBase || '#e8e4dc') },
      u_texB_colorAccent: { value: new THREE.Color(DEFAULTS.texBColorAccent || '#5a504a') },
      // World (Amazing Surf)
      u_worldTile: { value: DEFAULTS.worldTile },
      u_worldThickness: { value: DEFAULTS.worldThickness },
      u_worldWarp: { value: DEFAULTS.worldWarp },
      u_worldDeScale: { value: DEFAULTS.worldDeScale },
      u_worldSegClamp: { value: DEFAULTS.worldSegClamp },
      u_worldUseDEC: { value: DEFAULTS.worldUseDEC === true },
      u_worldDetailStrength: { value: DEFAULTS.worldDetailStrength },
      u_worldDetailScale: { value: DEFAULTS.worldDetailScale },
      u_worldTexType: { value: DEFAULTS.worldTexType },
      u_worldTexScale: { value: DEFAULTS.worldTexScale },
      u_worldTexColorStrength: { value: DEFAULTS.worldTexColorStrength },
      u_worldTexBumpStrength: { value: DEFAULTS.worldTexBumpStrength },
      u_worldTexSpecStrength: { value: DEFAULTS.worldTexSpecStrength },
      // Texture B + blend
      u_worldTexTypeB: { value: DEFAULTS.worldTexTypeB },
      u_worldTexScaleB: { value: DEFAULTS.worldTexScaleB },
      u_worldTexColorStrengthB: { value: DEFAULTS.worldTexColorStrengthB },
      u_worldTexBumpStrengthB: { value: DEFAULTS.worldTexBumpStrengthB },
      u_worldTexSpecStrengthB: { value: DEFAULTS.worldTexSpecStrengthB },
      u_worldTexBlendMode: { value: DEFAULTS.worldTexBlendMode },
      u_worldTexBlendAlphaColor: { value: DEFAULTS.worldTexBlendAlphaColor },
      u_worldTexBlendAlphaBump: { value: DEFAULTS.worldTexBlendAlphaBump },
      u_worldTexBlendAlphaSpec: { value: DEFAULTS.worldTexBlendAlphaSpec },
      // FBM controls
      u_worldFbmOctaves: { value: DEFAULTS.worldFbmOctaves },
      u_worldFbmLacunarity: { value: DEFAULTS.worldFbmLacunarity },
      u_worldFbmGain: { value: DEFAULTS.worldFbmGain },
      u_worldFbmSeed: { value: DEFAULTS.worldFbmSeed },
      // Texture perf toggles
      u_texTop2: { value: DEFAULTS.texTop2 === true },
      u_texFastBump: { value: DEFAULTS.texFastBump === true },
      u_texTriMinWeight: { value: DEFAULTS.texTriMinWeight },
      u_texTriHyst: { value: DEFAULTS.texTriHyst ?? 0.0 },
      // Texture domain warp (global)
      u_texWarpStrength: { value: DEFAULTS.texWarpStrength ?? 0.0 },
      // (deduped) texture warp entries are defined below under "Texture warp and anisotropy"
      // Texture AA / attenuation
      u_worldTexAAStrength: { value: DEFAULTS.worldTexAAStrength },
      u_worldTexAutoAtten: { value: DEFAULTS.worldTexAutoAtten },
      // LOD v2 controls
      u_texDerivAggression: { value: DEFAULTS.texDerivAggression ?? 1.0 },
      u_texBumpDerivFade: { value: DEFAULTS.texBumpDerivFade ?? 0.0 },
      u_texSpecDerivFade: { value: DEFAULTS.texSpecDerivFade ?? 0.0 },
      u_texRoughFadeK: { value: DEFAULTS.texRoughFadeK ?? 0.0 },
      // Optional distance-based fade for bump/spec
      u_texFadeNear: { value: DEFAULTS.texFadeNear ?? 0.0 },
      u_texFadeFar: { value: DEFAULTS.texFadeFar ?? 0.0 },
      // Truchet variants
      u_worldTruchetRotate: { value: DEFAULTS.worldTruchetRotate ? 1 : 0 },
      u_worldTruchetWidth: { value: DEFAULTS.worldTruchetWidth },
      u_worldTruchetDensity: { value: DEFAULTS.worldTruchetDensity },
      // Hex Truchet advanced controls
      u_hexFoldFreq: { value: DEFAULTS.hexFoldFreq },
      u_hexContrast: { value: DEFAULTS.hexContrast },
      u_hexSeed: { value: DEFAULTS.hexSeed },
      // World (Truchet Pipes)
      u_truchetRadius: { value: DEFAULTS.truchetRadius ?? 0.07 },
      u_truchetShape: { value: DEFAULTS.truchetShape ?? 3 },
      u_truchetVariant: { value: DEFAULTS.truchetVariant ?? 0 },
      u_truchetSmooth: { value: DEFAULTS.truchetSmooth === true },
      u_truchetSmoothK: { value: DEFAULTS.truchetSmoothK ?? 0.18 },
      u_truchetPortalFast: { value: DEFAULTS.truchetPortalFast === true },
      u_truchetFastMargin: { value: DEFAULTS.truchetFastMargin ?? 0.035 },
      u_truchetFastK: { value: DEFAULTS.truchetFastK ?? 3.5 },
      u_truchetFastMinDist: { value: DEFAULTS.truchetFastMinDist ?? 6.0 },
      u_truchetMirrorJoins: { value: DEFAULTS.truchetMirrorJoins !== false },
      u_truchetJoinRing: { value: !!DEFAULTS.truchetJoinRing },
      u_truchetJoinRingK: { value: DEFAULTS.truchetJoinRingK ?? 1.0 },
      u_truchetSleeveScale: { value: DEFAULTS.truchetSleeveScale ?? 1.0 },
      u_truchetLipScale: { value: DEFAULTS.truchetLipScale ?? 1.0 },
      // Procedural textures toggle
      u_texturesEnabled: { value: DEFAULTS.applyProceduralTextures === true },
      u_texSpaceMode: { value: DEFAULTS.texSpaceMode | 0 },
      // Texture warp and anisotropy
      // (deduped) texture warp entries are defined below under "Texture warp and anisotropy"
      u_texAnisoFactor: { value: DEFAULTS.texAnisoFactor ?? 1.0 },
      u_texAnisoAxis: { value: DEFAULTS.texAnisoAxis ?? 1 },
      // Texture LOD
      u_texLODEnabled: { value: DEFAULTS.texLODEnabled === true },
      u_texDerivOctDrop: { value: DEFAULTS.texDerivOctDrop | 0 },
      u_texDerivMinOct: { value: DEFAULTS.texDerivMinOct | 0 },
      u_texWarpOctDrop: { value: DEFAULTS.texWarpOctDrop | 0 },
      u_texLODBumpFactor: { value: DEFAULTS.texLODBumpFactor },
      u_texLODSpecFactor: { value: DEFAULTS.texLODSpecFactor },
    };

    // Icosahedron mapping toggle (IQ vs GDF)
    // Kept outside the main object above to preserve grouping and avoid
    // disturbing generated doc blocks.
    this.uniforms.u_icoUseIQ = {
      value: DEFAULTS.icoUseIQ !== undefined ? !!DEFAULTS.icoUseIQ : true,
    };

    // Resolve GLSL #include directives (plugin doesn't process inside shader text)
    // Build a mutable include map so we can inject a user-chosen DEC snippet later.
    this.includeMap = {
      './includes/common.glsl': commonGLSL,
      './includes/sdf-primitives.glsl': sdfPrimitivesGLSL,
      './includes/sdf-operations.glsl': sdfOperationsGLSL,
      './includes/sdf-menger.glsl': sdfMengerGLSL,
      './includes/sdf-mandelbulb.glsl': sdfMandelbulbGLSL,
      './includes/sdf-mandelbox.glsl': sdfMandelboxGLSL,
      './includes/sdf-sierpinski.glsl': sdfSierpinskiGLSL,
      './includes/sdf-amazing-surf.glsl': sdfAmazingSurfGLSL,
      './includes/sdf-truchet-pipes.glsl': sdfTruchetPipesGLSL,
      './includes/coloring.glsl': coloringGLSL,
      './includes/procedural-textures.glsl': proceduralTexturesGLSL,
      // Placeholder for DEC preview injection (stubbed; runtime replaces content between markers)
      './includes/dec/__user__.glsl': decStub,
      './includes/dec/dec-utils.glsl': decUtilsGLSL,
    };
    const resolveIncludes = (src) => {
      let out = src;
      const re = /#include\s+"([^"]+)"/g;
      let pass = 0;
      while (true) {
        pass++;
        let changed = false;
        out = out.replace(re, (_, path) => {
          const chunk = this.includeMap[path];
          if (chunk) {
            changed = true;
            return `\n// BEGIN include ${path}\n${chunk}\n// END include ${path}\n`;
          }
          // If not found, strip the include (WebGL has no preprocessor). This
          // supports optional blocks guarded by defines (e.g. DEC preview).
          changed = true;
          return `\n// (include ${path} omitted)\n`;
        });
        if (!changed || pass > 8) break; // prevent infinite loop
      }
      return out;
    };

    // DEC preview runtime state
    this.decPreview = {
      enabled: false,
      includePath: null, // './shaders/includes/dec/<cat>/<name>.glsl'
    };
    // Enable fast DEC injection by default; fallbacks are in place.
    this.fastDecInject = true;

    // Transform a DEC snippet into a safe block that defines only decUserDE(vec3)
    const buildDecInjectedBlock = (srcIn) => {
      if (!srcIn || typeof srcIn !== 'string') return '';
      let src = srcIn;
      // Strip potential version/precision lines that would conflict inside fragment
      src = src.replace(/^[ \t]*#version.*$/gm, '');
      src = src.replace(/^[ \t]*precision\s+\w+\s+\w+\s*;\s*$/gm, '');
      // Normalize line endings
      src = src.replace(/\r\n?/g, '\n');

      // Make sure snippet doesn't define decUserDE already
      src = src.replace(/\bdecUserDE\b/g, 'decUserDE_src');
      // Strip stray prose/comment-only lines that break GLSL in some DEC entries
      src = src.replace(/^\s*(Alternate|Version|With)\b.*$/gim, '');
      // Fix pow(x, int) -> pow(x, float)
      src = src.replace(/pow\(\s*([^,]+),\s*(\d+)\s*\)/g, (m, a, n) => `pow(${a}, ${n}.0)`);
      // Alias PHI/PI/time tokens to DEC_* constants or a local time constant
      src = src.replace(/\bPHI\b/g, 'DEC_PHI');
      src = src.replace(/\bPI\b/g, 'DEC_PI');
      // Some snippets refer to lowercase `pi` as a constant; map to DEC_PI
      src = src.replace(
        /(^|[^A-Za-z0-9_])pi([^A-Za-z0-9_]|$)/g,
        (m, pre, post) => `${pre}DEC_PI${post}`
      );
      // Many DEC snippets refer to `time` or `u_time`; map both to a local
      // constant `dec_time` so the block compiles even before uniforms.
      // Avoid touching identifiers like `timeOffset` etc.
      src = src.replace(
        /(^|[^A-Za-z0-9_])time([^A-Za-z0-9_]|$)/g,
        (m, pre, post) => `${pre}dec_time${post}`
      );
      src = src.replace(
        /(^|[^A-Za-z0-9_])u_time([^A-Za-z0-9_]|$)/g,
        (m, pre, post) => `${pre}dec_time${post}`
      );
      // Alias GDFVectors[...] to DEC_GDF[...] and capture count for prelude
      let _decPrelude = '';
      const mVecs = src.match(/const\s+vec3\s+GDFVectors\s*\[\s*(\d+)\s*\]/);
      if (mVecs) {
        const cnt = mVecs[1];
        _decPrelude += `#ifndef DEC_GDF_COUNT\n#define DEC_GDF_COUNT ${cnt}\n#endif\n`;
        src = src.replace(
          /const\s+vec3\s+GDFVectors\s*\[\s*\d+\s*\]/,
          'const vec3 DEC_GDF[DEC_GDF_COUNT]'
        );
        src = src.replace(/\bGDFVectors\b/g, 'DEC_GDF');
      }
      // If snippet already declares DEC_GDF[n], ensure DEC_GDF_COUNT is defined in prelude
      const mDec = src.match(/const\s+vec3\s+DEC_GDF\s*\[\s*(\d+)\s*\]/);
      if (mDec) {
        const cnt = mDec[1];
        _decPrelude += `#ifndef DEC_GDF_COUNT\n#define DEC_GDF_COUNT ${cnt}\n#endif\n`;
      }
      // Remove any accidental DEC_PHI/DEC_PI redefinitions in snippet
      src = src.replace(/\s*const\s+float\s+DEC_PHI\s*=\s*[^;]+;\s*/g, '');
      src = src.replace(/\s*const\s+float\s+DEC_PI\s*=\s*[^;]+;\s*/g, '');

      // Repair missing function header using the prototype echoed in the
      // leading comment, e.g. "// DEC SDF: float box ( vec3 p, vec3 b ) {".
      // Some scraped DEC entries contain only the body and a closing brace.
      // Insert the function header right before the first non-comment line
      // if we don't already see that function declared in code.
      try {
        const proto = src.match(
          /^[ \t]*\/\/\s*DEC SDF:\s*([A-Za-z0-9_]+)\s+([A-Za-z_][\w]*)\s*\(\s*([^)]*?)\s*\)\s*(?:\{\s*)?$/m
        );
        if (proto) {
          const retType = proto[1];
          const fnName = proto[2];
          const argList = proto[3];
          // Only consider real code, not comment lines
          const srcNoCom = src.replace(/^\s*\/\/.*$/gm, '');
          const headerRe = new RegExp(`^\\s*${retType}\\s+${fnName}\\s*\\(`, 'm');
          if (!headerRe.test(srcNoCom)) {
            const lines = src.split('\n');
            let insertAt = 0;
            for (; insertAt < lines.length; insertAt++) {
              const t = lines[insertAt].trim();
              if (!t || t.startsWith('//')) continue;
              break;
            }
            // If the parameter list contains an identifier equal to the
            // function name (e.g. float cube(vec4 cube, vec3 pos)), GLSL
            // rejects it. Prefer renaming the function to avoid touching
            // parameter usages inside the body.
            // Token check for parameter-name conflict with function name
            const __params = String(argList || '')
              .split(',')
              .map((s) => s.trim());
            let needsFnRename = false;
            for (const __seg of __params) {
              const __cleaned = __seg.replace(/\b(in|out|inout)\b/g, '').trim();
              if (!__cleaned) continue;
              const __toks = __cleaned.split(/\s+/);
              const __last = __toks[__toks.length - 1] || '';
              if (__last === fnName) {
                needsFnRename = true;
                break;
              }
            }
            const newFn = needsFnRename ? 'dec_' + fnName : fnName;
            const nextLineTrim = (lines[insertAt] || '').trim();
            const headerLine = nextLineTrim.startsWith('{')
              ? `${retType} ${newFn}(${argList})`
              : `${retType} ${newFn}(${argList}) {`;
            lines.splice(insertAt, 0, headerLine);
            src = lines.join('\n');
            if (needsFnRename) {
              // Update calls to the function within the snippet body.
              const callRe = new RegExp(`(^|[^A-Za-z0-9_])${fnName}\\s*\\(`, 'g');
              src = src.replace(callRe, ($0, pre) => `${pre}${newFn}(`);
            }
          }
        }
      } catch (_) {}

      // Additional hardening: if any helper function declares a parameter
      // with the same identifier as the function name (common in DEC like
      // float cube(vec4 cube, vec3 pos)), rename the function to dec_<name>
      // and update calls. Skip de(...) which is handled elsewhere.
      try {
        const hdrRe = /^\s*(float|vec2|vec3|vec4)\s+([A-Za-z_]\w*)\s*\(\s*([^)]*)\)\s*\{/gm;
        let m;
        while ((m = hdrRe.exec(src)) !== null) {
          const fn = m[2];
          if (fn === 'de') continue;
          const args = m[3] || '';
          let hasConflict = false;
          for (const __seg of String(args).split(',')) {
            const __cleaned = __seg.replace(/\b(in|out|inout)\b/g, '').trim();
            if (!__cleaned) continue;
            const __toks = __cleaned.split(/\s+/);
            const __last = __toks[__toks.length - 1] || '';
            if (__last === fn) {
              hasConflict = true;
              break;
            }
          }
          if (hasConflict) {
            const newFn = 'dec_' + fn;
            const _before = src;
            // Replace header name at this occurrence only by using index math
            const start = m.index;
            const end = start + m[0].length;
            const header = m[0];
            const renamedHeader = header.replace(
              new RegExp(`(^\\s*(?:float|vec2|vec3|vec4)\\s+)${fn}(\\s*\\()`, ''),
              `$1${newFn}$2`
            );
            src = src.slice(0, start) + renamedHeader + src.slice(end);
            // Replace calls elsewhere
            const callRe = new RegExp(`(^|[^A-Za-z0-9_])${fn}\\s*\\(`, 'g');
            src = src.replace(callRe, ($0, pre) => `${pre}${newFn}(`);
            // Reset regex lastIndex because src changed
            hdrRe.lastIndex = 0;
          }
        }
      } catch (_) {}

      // Fix common float-int mismatches in simple patterns
      // 1) float a = 1; => float a = 1.0;
      src = src.replace(
        /(\bconst\s+)?\bfloat\s+([A-Za-z_]\w*)\s*=\s*(-?\d+)\s*;/g,
        (m, c, name, n) => `${c || ''}float ${name} = ${n}.0;`
      );
      // 2) vec2/3/4 constructors with int literals -> append .0
      src = src.replace(/\bvec([2-4])\s*\(([^)]*)\)/g, (m, dim, args) => {
        const fixed = args.replace(
          /(^|[,(\s])(-?\d+)(?=($|[,)\s]))/g,
          (mm, pre, num) => `${pre}${num}.0`
        );
        return `vec${dim}(${fixed})`;
      });
      // 3) Missing semicolon after vec init before a comment
      src = src.replace(
        /(vec[2-4]\s+[A-Za-z_]\w*\s*=\s*vec[2-4]\([^;\n]*\))\s*(\/\/[^\n]*)?$/gm,
        (m, stmt, comment) => `${stmt}; ${comment || ''}`
      );
      // 4) Common DEC typo: float md = min(d, vec3(0)); -> vec3 md = min(d, vec3(0.0));
      src = src.replace(
        /float\s+md\s*=\s*min\(\s*d\s*,\s*vec3\(0\)\s*\)\s*;/g,
        'vec3 md = min(d, vec3(0.0));'
      );

      // Provide missing tiny helpers when referenced but undefined
      if (/\bmaxcomp\s*\(/.test(src) && !/^\s*float\s+maxcomp\s*\(/m.test(src)) {
        src = `float maxcomp(in vec3 p){ return max(p.x, max(p.y, p.z)); }\n` + src;
      }
      // Provide simple gyroid(seed) if referenced but not defined
      if (/\bgyroid\s*\(/.test(src) && !/^\s*float\s+gyroid\s*\(/m.test(src)) {
        // Use a namespaced helper to avoid collisions, then rewrite calls
        src = `float dec_gyroid(vec3 seed){ return dot(sin(seed), cos(seed.yzx)); }\n` + src;
        src = src.replace(/(^|[^A-Za-z0-9_])gyroid\s*\(/g, (m, pre) => `${pre}dec_gyroid(`);
      }

      // Rename common helpers that collide with app-level includes (e.g., sdBox)
      // Only rename if they are defined in the snippet; update local call sites.
      const collide = ['sdBox', 'sdSphere', 'sdPlane', 'sdTorus', 'sdRoundBox'];
      for (const fname of collide) {
        const defRe = new RegExp(`^\\s*float\\s+${fname}\\s*\\(`, 'm');
        if (defRe.test(src)) {
          const newName = `dec_${fname}`;
          // Rename headers
          src = src.replace(new RegExp(`(^\\s*float\\s+)${fname}(\\s*\\()`, 'm'), `$1${newName}$2`);
          // Rename all calls inside snippet
          src = src.replace(
            new RegExp(`(^|[^A-Za-z0-9_])${fname}\\s*\\(`, 'g'),
            (_m, pre) => `${pre}${newName}(`
          );
        }
      }

      // Simple path: directly rename the first `float de(vec3 …){` to decUserDE
      // Use start-of-line anchors so we don't match prototypes inside comments.
      let definedDirect = false;
      {
        const headerReLine = /^\s*(float)\s+de\s*\(\s*vec3\b([^)]*)\)\s*\{/m;
        // Test on comment-stripped text to avoid false positives
        const srcNoCom = src.replace(/^\s*\/\/.*$/gm, '');
        if (headerReLine.test(srcNoCom)) {
          src = src.replace(headerReLine, (m, ret, rest) => {
            definedDirect = true;
            return `${ret} decUserDE(vec3${rest}){`;
          });
          // Rename any subsequent duplicate `de` definitions to avoid conflicts
          let alt = 2;
          src = src.replace(
            /^\s*(float)\s+de\s*\(\s*vec3\b([^)]*)\)\s*\{/gm,
            (m, ret, rest) => `${ret} decUserDE_alt${alt++}(vec3${rest}){`
          );
        }
      }
      if (definedDirect) {
        // Ensure define flag and include dec-utils prelude so shared symbols
        // like DEC_PHI/DEC_GDF are available even in direct-rename path.
        src = `#ifndef DEC_USER_DEFINED\n#define DEC_USER_DEFINED 1\n#endif\n` + src;
        // If we detected a DEC_GDF vector count earlier, emit the macro
        // before including dec-utils so the array size matches.
        let prelude = '';
        const mCnt = src.match(/DEC_GDF\s*\[\s*(\d+)\s*\]/);
        if (mCnt) {
          prelude = `#ifndef DEC_GDF_COUNT\n#define DEC_GDF_COUNT ${mCnt[1]}\n#endif\n`;
        }
        const localPrelude = `\n// DEC local prelude\nconst float dec_time = 0.0;\n`;
        return `// DEC_USER_SNIPPET_BEGIN\n// --- DEC Snippet (direct rename) ---\n#include "./includes/dec/dec-utils.glsl"\n${prelude}${localPrelude}${src}\n// DEC_USER_SNIPPET_END`;
      }

      // Fallback path: Find all `de` function definitions and wrap last one
      // Only match real function headers at line start (not in comments)
      const fnRe = /^\s*(float|vec2|vec3|vec4)\s+de\s*\(\s*(vec3\b[^)]*)\)\s*\{/gm;
      let _match;
      const deNames = [];
      let idx = 0;
      src = src.replace(fnRe, (m, retType, args) => {
        const name = `deEntry${++idx}`;
        deNames.push({ name, retType });
        return `${retType} ${name}(${args}){`;
      });
      // Also handle macro form: #define de(
      let macroName = null;
      if (/#[ \t]*define\s+de\s*\(/.test(src)) {
        macroName = `deEntry${deNames.length + 1}`;
        src = src.replace(/#[ \t]*define\s+de\s*\(/g, `#define ${macroName}(`);
      }
      // If there's no de(vec3) but the snippet defines other float f(vec3 ..)
      // candidates (e.g., cylUnion, DE, map), use the last one as decUserDE.
      let anyVec3Fn = null;
      if (deNames.length === 0 && !macroName) {
        try {
          const anyRe = /^\s*float\s+([A-Za-z_]\w*)\s*\(\s*vec3\b[^)]*\)\s*\{/gm;
          let m2;
          const banned = new Set(['decUserDE', 'main']);
          while ((m2 = anyRe.exec(src)) !== null) {
            const nm = m2[1];
            if (!banned.has(nm)) anyVec3Fn = nm; // choose last occurrence
          }
        } catch (_) {}
      }
      // Choose last definition if any, else create a trivial one
      let wrapper = '';
      if (deNames.length > 0) {
        const last = deNames[deNames.length - 1];
        if (last.retType === 'float') {
          wrapper = `\n#ifndef DEC_USER_DEFINED\n#define DEC_USER_DEFINED 1\n#endif\nfloat decUserDE(vec3 p){ return float(${last.name}(p)); }\n`;
        } else {
          // If vecN, fall back to x component
          wrapper = `\n#ifndef DEC_USER_DEFINED\n#define DEC_USER_DEFINED 1\n#endif\nfloat decUserDE(vec3 p){ return ${last.name}(p).x; }\n`;
        }
      } else if (macroName) {
        // Use macro-mapped call
        wrapper = `\n#ifndef DEC_USER_DEFINED\n#define DEC_USER_DEFINED 1\n#endif\nfloat decUserDE(vec3 p){ return float(${macroName}(p)); }\n`;
      } else if (anyVec3Fn) {
        wrapper = `\n#ifndef DEC_USER_DEFINED\n#define DEC_USER_DEFINED 1\n#endif\nfloat decUserDE(vec3 p){ return float(${anyVec3Fn}(p)); }\n`;
      } else {
        // No de() found; define a visible stub (unit sphere)
        wrapper = `\n#ifndef DEC_USER_DEFINED\n#define DEC_USER_DEFINED 1\n#endif\nfloat decUserDE(vec3 p){ return length(p)-1.0; }\n`;
      }
      // Map any remaining calls `de(` to the chosen entry (macro) to keep recursion working
      const chosen = deNames.length > 0 ? deNames[deNames.length - 1].name : macroName || null;
      if (chosen) {
        src = `#define de ${chosen}\n${src}\n#undef de`;
      }
      // Local prelude (available to snippet only)
      const localPrelude = `\n// DEC local prelude\nconst float dec_time = 0.0;\n`;
      return `// DEC_USER_SNIPPET_BEGIN\n// --- DEC Snippet (transformed) ---\n#include "./includes/dec/dec-utils.glsl"\n${localPrelude}${src}\n${wrapper}// DEC_USER_SNIPPET_END`;
    };

    // Resolve a DEC module key from a variety of input forms (instance method)
    this.resolveDecKey = (spec) => {
      if (!spec) return null;
      let key = String(spec);
      if (key.startsWith('builtin:')) return key;
      if (DEC_MODULES[key]) return key;
      // Normalize common variants
      if (key.startsWith('./includes/')) key = './shaders' + key.slice(1);
      if (DEC_MODULES[key]) return key;
      // Try strip leading './'
      if (key.startsWith('./')) {
        const k2 = key.slice(1);
        if (DEC_MODULES['./' + k2]) return './' + k2;
      }
      // Suffix match on '/includes/dec/...'
      const idx = key.indexOf('/includes/dec/');
      if (idx >= 0) {
        const suffix = key.slice(idx);
        const found = Object.keys(DEC_MODULES).find((k) => k.endsWith(suffix));
        if (found) return found;
      }
      // Last-resort: match by filename
      const base = key.split('/').pop();
      const found2 = Object.keys(DEC_MODULES).find((k) => k.endsWith('/' + base));
      return found2 || null;
    };

    // Helper to (re)apply DEC mapping and rebuild the shader source
    this.applyDecMappingAndRebuild = () => {
      // Resolve selection from multiple sources for robustness
      let sel = this.decPreview && this.decPreview.includePath;
      try {
        if (!sel && this.guiManager && this.guiManager.params && this.guiManager.params.decEntry)
          sel = this.guiManager.params.decEntry;
      } catch (_) {}
      try {
        if (!sel) sel = localStorage.getItem('fractalExplorer_decEntry');
      } catch (_) {}
      let key = this.resolveDecKey(sel);
      let src = '';
      let active = false;
      // If preview is enabled but no key yet, pick a sensible default
      if (!key) {
        try {
          const keys = Object.keys(DEC_MODULES || {});
          const pref =
            keys.find((k) => /\/primitive\/icosahedron\.glsl$/.test(k)) ||
            keys.find((k) => /\/primitive\/box\.glsl$/.test(k)) ||
            keys[0];
          if (pref) {
            key = pref;
            if (this.decPreview) this.decPreview.includePath = pref;
            try {
              if (this.guiManager && this.guiManager.params) this.guiManager.params.decEntry = pref;
            } catch (_) {}
            try {
              localStorage.setItem('fractalExplorer_decEntry', String(pref));
            } catch (_) {}
          }
        } catch (_) {}
      }
      if (key) {
        if (key.startsWith('builtin:')) {
          src = 'float de(vec3 p){ return length(p)-1.0; }\n';
        } else if (DEC_MODULES[key]) {
          const mod = DEC_MODULES[key];
          src = (mod && (mod.default || mod)) || '';
        }
        // Provide safe built-ins for common primitives to verify path end-to-end
        try {
          if (/\/primitive\/box\.glsl$/.test(key)) {
            src = `// safe box (IQ exact SDF)
float dec_sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float de(vec3 p){
  return dec_sdBox(p, vec3(1.0));
}`;
          } else if (/\/(fractal|composed)\/float-box-vec3-p-vec3-b\.glsl$/.test(key)) {
            // Hardened variant for DEC entries missing the box() header
            src = `// safe box (IQ exact SDF) + adapter de(vec3)
float dec_sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float de(vec3 p){
  return dec_sdBox(p, vec3(1.0));
}`;
          } else if (/\/primitive\/plane\.glsl$/.test(key)) {
            src = `// safe plane (y-up)
float de(vec3 p){
  vec3 n = vec3(0.0, 1.0, 0.0);
  float h = 0.0;
  return dot(p, n) + h;
}`;
          } else if (/\/primitive\/sphere\.glsl$/.test(key)) {
            src = `// safe sphere
float de(vec3 p){ return length(p) - 1.0; }`;
          } else if (
            /(?:\/composed|\/fractal)\/float-cube-vec4-cube-vec3-pos(?:-2)?\.glsl$/.test(key)
          ) {
            // Hardened adapter for DEC snippet that defines a helper cube(vec4,vec3)
            // but arrives without a proper header; use a safe box SDF as a stand-in.
            src = `// safe cube adapter → box SDF
float dec_sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float de(vec3 p){
  return dec_sdBox(p, vec3(0.5));
}`;
          } else if (
            /\/composed\/float-sdverticalcapsule-vec3-p-float-h-float-r\.glsl$/.test(key)
          ) {
            // Safe vertical capsule helper + adapter
            src = `// safe sdVerticalCapsule + adapter de(vec3)
float dec_sdVerticalCapsule(vec3 p, float h, float r) {
  p.y -= clamp(p.y, 0.0, h);
  return length(p) - r;
}
float de(vec3 p){
  return dec_sdVerticalCapsule(p, 1.0, 0.15);
}`;
          } else if (/\/composed\/float-snoise-vec2-p\.glsl$/.test(key)) {
            // Safe 2D value noise terrain adapter; avoids broken DEC lib dependencies
            src = `// safe value-noise terrain (no external deps)
float dec_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dec_noise2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = dec_hash(i);
  float b = dec_hash(i + vec2(1.0, 0.0));
  float c = dec_hash(i + vec2(0.0, 1.0));
  float d = dec_hash(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float de(vec3 p){
  float h = dec_noise2(p.xz * 0.75);
  return p.y - (h - 0.5) * 0.6;
}`;
          } else if (/\/composed\/float-cylunion-vec3-p(?:-2)?\.glsl$/.test(key)) {
            // Safe union of 3 perpendicular infinite cylinders of radius 1
            src = `// safe cyl union (three axes)
float dec_cylUnion(vec3 p){
  float dxy = length(p.xy) - 1.0;
  float dxz = length(p.xz) - 1.0;
  float dyz = length(p.yz) - 1.0;
  return min(dxy, min(dxz, dyz));
}
float de(vec3 p){ return dec_cylUnion(p); }`;
          } else if (/\/composed\/float-sdtriprism-vec3-p-vec2-h\.glsl$/.test(key)) {
            // Safe triangle prism SDF with 2 params h=(width, halfHeight)
            src = `// safe triangle prism
float dec_sdTriPrism(vec3 p, vec2 h){
  vec3 q = abs(p);
  return max(q.z - h.y, max(q.x * 0.8660254 + p.y * 0.5, -p.y) - h.x * 0.5);
}
float de(vec3 p){
  return dec_sdTriPrism(p, vec2(1.4, 0.25));
}`;
          } else if (/endless-corner-shelf\.glsl$/.test(key)) {
            src = `// safe endless corner/shelf
float de(vec3 p){
  vec2 p0 = p.xy;
  vec3 md = min(p, vec3(0.0));
  return length(max(p0, vec2(0.0))) + max(max(md.x, md.y), md.z);
}`;
          } else if (/blob-not-a-correct-distance-bound-has-artifacts\.glsl$/.test(key)) {
            src = `// safe blob (bounded; preview-only)
// relies on dec-utils for DEC_PHI; use numeric PI to avoid redefines
float de(vec3 p) {
  p = abs(p);
  if (p.x < max(p.y, p.z)) p = p.yzx;
  if (p.x < max(p.y, p.z)) p = p.yzx;
  float b = max(max(max(
    dot(p, normalize(vec3(1.0, 1.0, 1.0))),
    dot(p.xz, normalize(vec2(DEC_PHI + 1.0, 1.0)))),
    dot(p.yx, normalize(vec2(1.0, DEC_PHI)))),
    dot(p.xz, normalize(vec2(1.0, DEC_PHI))));
  float l = length(p);
  float denom = max(l, 1e-6);
  float PI_ = 3.14159265359;
  return l - 1.5 - 0.2 * 0.75 * cos(min(sqrt(max(0.0, 1.01 - b / denom)) * (PI_ / 0.25), PI_));
}`;
          } else if (/capsule-cylinder-with-round-caps\.glsl$/.test(key)) {
            src = `// safe capsule (line segment), unique helper name to avoid collisions
float dec_capsuleDist(vec3 p, vec3 a, vec3 b, float r){
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float de(vec3 p){
  return dec_capsuleDist(p, vec3(0.0,-1.0,0.0), vec3(0.0,1.0,0.0), 1.0);
}`;
          } else if (/\/primitive\/torus\.glsl$/.test(key)) {
            src = `// safe torus with unique helper
float dec_torusDist(vec3 p, float R, float r) {
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}
float de(vec3 p){
  return dec_torusDist(p, 2.0, 1.0);
}`;
          } else if (/2d-disc-no-thickness.*rounded-disk.*\.glsl$/.test(key)) {
            src = `// safe 2D disk: add small thickness to avoid degenerate ring
float de(vec3 p){
  float r = 1.0; // radius
  float t = 0.02; // thickness
  return max(length(p.xz) - r, abs(p.y) - t);
}`;
          } else if (/\/primitive\/hexagonal-prism\.glsl$/.test(key)) {
            src = `// safe hexagonal prism (unique helper, iq-style)
float dec_sdHexPrism(vec3 p, vec2 h) {
  vec3 q = abs(p);
  return max(q.z - h.y, max(q.x * 0.8660254 + q.y * 0.5, q.y) - h.x);
}
float de(vec3 p){
  // h.x = inradius (half width), h.y = half-height
  return dec_sdHexPrism(p, vec2(1.0, 1.0));
}`;
          } else if (/\/composed\/float-sdhexprism-vec3-p-vec2-h\.glsl$/.test(key)) {
            src = `// safe hexagonal prism (unique helper, iq-style)
float dec_sdHexPrism(vec3 p, vec2 h) {
  vec3 q = abs(p);
  return max(q.z - h.y, max(q.x * 0.8660254 + q.y * 0.5, q.y) - h.x);
}
float de(vec3 p){
  return dec_sdHexPrism(p, vec2(1.0, 1.0));
}`;
          } else if (/\/composed\/float-sdbox-vec3-p-vec3-b\.glsl$/.test(key)) {
            // Safe sdBox helper + adapter; avoids body-only snippet
            src = `// safe sdBox (IQ exact SDF) + adapter
float dec_sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float de(vec3 p){
  return dec_sdBox(p, vec3(1.0, 0.7, 0.7));
}`;
          } else if (/\/composed\/float-sdroundbox-vec3-p-vec3-b-float-r\.glsl$/.test(key)) {
            // Safe rounded box helper + adapter (IQ)
            src = `// safe sdRoundBox + adapter
float dec_sdRoundBox(vec3 p, vec3 b, float r){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float de(vec3 p){
  return dec_sdRoundBox(p, vec3(0.6), 0.2);
}`;
          } else if (/\/composed\/float-smin-float-a-float-b-float-k\.glsl$/.test(key)) {
            // Safe smooth-min helper + demo (two smooth spheres)
            src = `// safe smin + demo
float dec_smin(float a, float b, float k){
  float kk = max(k, 1e-6);
  float h = clamp(0.5 + 0.5 * (b - a) / kk, 0.0, 1.0);
  return mix(b, a, h) - kk * h * (1.0 - h);
}
float de(vec3 p){
  float d1 = length(p - vec3(0.9, 0.0, 0.0)) - 0.9;
  float d2 = length(p + vec3(0.9, 0.0, 0.0)) - 0.9;
  return dec_smin(d1, d2, 0.6);
}`;
          } else if (
            /\/composed\/float-periodic-float-x-float-period-float-dutycycle\.glsl$/.test(key)
          ) {
            // Safe periodic helper + demo using rings/stripes
            src = `// safe periodic(x, period, duty) + demo pattern
float dec_periodic(float x, float period, float duty){
  float pr = (abs(period) < 1e-6) ? 1.0 : period;
  float t = x / pr;
  t = abs(t - floor(t) - 0.5) - duty * 0.5;
  return t * pr;
}
float de(vec3 p){
  vec3 q = p;
  vec3 cell = fract(q) - 0.5;
  float r = length(q.xy);
  float a = atan(q.y, q.x);
  // Combine radial, axial, and angular periodic bands
  float dr = dec_periodic(r, 3.0, 0.2);
  float dz = dec_periodic(q.z, 1.0, 0.7 + 0.3 * cos(4.0));
  float dang = dec_periodic(a * max(r, 1e-6), 3.14159265 * 2.0 / max(r, 1e-6) * r, 0.7 + 0.3 * cos(4.0));
  float d = max(max(dr, dz), dang);
  // Clamp to thin sheet to visualize
  return min(d, 0.25);
}`;
          } else if (/\/composed\/float-de2-vec3-p\.glsl$/.test(key)) {
            // Safe wrap for de2/de1 combo from DEC (compact implementation)
            src = `// safe de2/de1 combo
float dec_de2(vec3 p){
  vec3 op = p;
  p = abs(1.0 - mod(p, 2.0));
  float r = 0.0, power = 8.0, dr = 1.0;
  vec3 z = p;
  for (int i = 0; i < 7; i++) {
    op = -1.0 + 2.0 * fract(0.5 * op + 0.5);
    float r2 = dot(op, op);
    r = length(z);
    if (r > 1.616) break;
    float theta = acos(clamp(z.z / max(r, 1e-6), -1.0, 1.0));
    float phi = atan(z.y, z.x);
    dr = pow(r, power - 1.0) * power * dr + 1.0;
    float zr = pow(r, power);
    theta *= power; phi *= power;
    z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + p;
  }
  return 0.5 * log(max(r, 1e-6)) * r / max(dr, 1e-6);
}
float dec_de1(vec3 p){
  float s = 1.0;
  float d = 0.0;
  vec3 r, q;
  r = p; q = r;
  for (int j = 0; j < 6; j++) {
    r = abs(mod(q * s + 1.5, 2.0) - 1.0);
    r = max(r, r.yzx);
    d = max(d, (0.3 - length(r * 0.985) * 0.3) / s);
    s *= 2.1;
  }
  return d;
}
float de(vec3 p){
  return min(dec_de1(p), dec_de2(p));
}`;
          } else if (/\/fractal\/float-r11-float-t\.glsl$/.test(key)) {
            // Safe adaptation of r11 noise + box repetition demo
            src = `// safe r11/valN/nois + boxes demo
float dec_r11(float t){ return fract(sin(t * 414.125) * 114.12521); }
float dec_valN(float t){ return mix(dec_r11(floor(t)), dec_r11(floor(t) + 1.0), pow(fract(t), 2.0)); }
vec3 dec_nois(float t){ t *= 0.5; return vec3(dec_valN(t + 200.0), dec_valN(t + 10.0), dec_valN(t + 50.0)); }
float dec_sdBox(vec3 p, vec3 s){ p = abs(p) - s; return max(p.x, max(p.y, p.z)); }
float de(vec3 p){
  vec3 n = dec_nois(0.0);
  float d = 1e7;
  vec3 sz = vec3(1.0, 0.5, 0.5) * 0.5;
  for (int i = 0; i < 8; ++i){
    float b = dec_sdBox(p, sz);
    sz *= vec3(0.74, 0.5, 0.74);
    d = min(b, d);
    p = abs(p);
    float c0 = cos(-0.9 + n.x), s0 = sin(-0.9 + n.x);
    float c1 = cos(0.6 - n.y * 0.3), s1 = sin(0.6 - n.y * 0.3);
    float c2 = cos(-0.2 + n.y * 0.1), s2 = sin(-0.2 + n.y * 0.1);
    // rotate xy
    p.xy = mat2(c0, -s0, s0, c0) * p.xy;
    // rotate yz
    vec2 yz = mat2(c1, -s1, s1, c1) * p.yz; p.y = yz.x; p.z = yz.y;
    // rotate xz
    vec2 xz = mat2(c2, -s2, s2, c2) * p.xz; p.x = xz.x; p.z = xz.y;
    p.xy -= sz.xy * 2.0;
  }
  return d;
}`;
          } else if (/\/fractal\/float-sdbox-vec3-p-vec3-s\.glsl$/.test(key)) {
            // Safe sdBox(p,s) helper + simple de using it
            src = `// safe sdBox(vec3 p, vec3 s) + adapter
float dec_sdBox(vec3 p, vec3 s){
  vec3 q = abs(p) - s;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float de(vec3 p){
  float box = dec_sdBox(p, vec3(1.0));
  float scale = 5.5;
  float surf = cos(p.x * scale) + cos(p.y * scale) + cos(p.z * scale);
  surf = abs(surf) - 0.01;
  surf *= 0.1;
  return max(box, surf);
}`;
          } else if (/\/fractal\/float-cube-vec3-p\.glsl$/.test(key)) {
            // Safe cube distance via box SDF (adapter)
            src = `// safe cube(vec3 p) + adapter de
float dec_sdBox(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float de(vec3 p){
  return dec_sdBox(p, vec3(1.0));
}`;
          } else if (/\/fractal\/float-hash13-vec3-p3-2\.glsl$/.test(key)) {
            // Safe hash13(vec3) helper + full de adapted to use it
            src = `// safe hash13 + adapted de(vec3)
float dec_hash13(vec3 p3){
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}
float de(vec3 p){
  vec3 po = p;
  float k = 1.0;
  for (int i = 0; i < 8; ++i) {
    vec3 ss = vec3(-0.54, 0.84, 1.22);
    p = 2.0 * clamp(p, -ss, ss) - p;
    float f = max(0.7 / max(dot(p, p), 1e-6), 0.75);
    p *= f; k *= f * 1.05;
  }
  float res = max(length(p.xz) - 0.9, length(p.xz) * abs(p.y) / max(length(p), 1e-6)) / max(k, 1e-6);
  res += (-1.0 + 2.0 * dec_hash13(floor(p * 10.0))) * 0.005 * (1.0 - step(0.01, po.y));
  float ang = 0.04; mat2 rot = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));
  vec3 tpo = po - vec3(0.0, 0.12, -1.5);
  tpo.xy = rot * tpo.xy;
  float blast = pow(smoothstep(-1.6, 0.35, po.x) - smoothstep(0.4, 0.48, po.x), 3.0);
  res = min(res, length(tpo.yz) - 0.02 * blast);
  return res;
}`;
          } else if (/\/composed\/float-op-u-float-d1-float-d2\.glsl$/.test(key)) {
            // Safe op_u (union) helper + grid of rounded boxes using tiling
            src = `// safe op_u + tiled rounded boxes
float op_u(float d1, float d2){ return min(d1, d2); }
float dec_sdRoundBox(vec3 p, vec3 b, float r){
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
float de(vec3 p){
  // Tile in XZ; one cell at a time renders an infinite grid
  float cell = 2.2;
  vec3 q = p;
  q.xz = mod(q.xz + 0.5 * cell, cell) - 0.5 * cell;
  // Union a few rounded boxes inside the cell
  float d = 1e9;
  d = op_u(d, dec_sdRoundBox(q,                      vec3(0.6, 0.40, 0.6), 0.18));
  d = op_u(d, dec_sdRoundBox(q - vec3(0.0, 0.55, 0.0), vec3(0.50, 0.20, 0.5), 0.14));
  d = op_u(d, dec_sdRoundBox(q + vec3(0.0, 0.55, 0.0), vec3(0.45, 0.18, 0.5), 0.12));
  return d;
}`;
          } else if (/\/composed\/float-mandelbulb-vec3-p\.glsl$/.test(key)) {
            // Safe Mandelbulb DE (compact, no external deps)
            src = `// safe mandelbulb DE (power=8)
float de(vec3 p){
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  const int ITER = 9;
  const float POWER = 8.0;
  for (int i = 0; i < ITER; i++) {
    r = length(z);
    if (r > 2.0) break;
    float theta = atan(z.y, z.x);
    float phi = acos(clamp(z.z / max(r, 1e-6), -1.0, 1.0));
    dr = pow(r, POWER - 1.0) * POWER * dr + 1.0;
    float zr = pow(r, POWER);
    theta *= POWER; phi *= POWER;
    // Spherical to Cartesian
    z = zr * vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi)) + p;
  }
  return 0.5 * log(max(r, 1e-6)) * r / max(dr, 1e-6);
}`;
          } else if (
            /\/primitive\/rounded-cone-two-spheres-with-convex-connection\.glsl$/.test(key)
          ) {
            // Safe rounded cone (two spheres with convex connection), oriented along +Y
            // Uses IQ's capped cone SDF; avoids snippet prose that breaks GLSL.
            src = `// safe rounded cone (convex connection between two sphere caps)
float dec_sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  float k2dot = max(dot(k2, k2), 1e-6);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / k2dot, 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
float de(vec3 p){
  // Example: join sphere r1 at y=-h with sphere r2 at y=+h
  float h = 1.2; // half-height
  float r1 = 0.6; // bottom radius
  float r2 = 0.3; // top radius
  return dec_sdCappedCone(p, h, r1, r2);
}`;
          } else if (
            /\/primitive\/torus8-2-using-iq-s-change-of-distance-metric.*\.glsl$/.test(key) ||
            /\/primitive\/torus8-8-using-iq-s-change-of-distance-metric.*\.glsl$/.test(key)
          ) {
            // Torus with Lp metric (p=8 or p=2). Provide robust helpers instead of
            // snippet-specific length2/length8 functions.
            src = `// safe Lp-metric torus (IQ style)
float dec_lenN(vec2 v, float n){
  v = abs(v);
  return pow(pow(v.x, n) + pow(v.y, n), 1.0 / n);
}
float dec_lenN(vec3 v, float n){
  v = abs(v);
  return pow(pow(v.x, n) + pow(v.y, n) + pow(v.z, n), 1.0 / n);
}
float dec_sdTorusLp(vec3 p, float R, float r, float n){
  // Use Lp norm in the XZ plane and for the final ring distance
  float radial = dec_lenN(p.xz, n);
  vec2 q = vec2(radial - R, p.y);
  return dec_lenN(q, n) - r;
}
float de(vec3 p){
  // Choose p based on filename intent: 8 or 2. Default to 8 for sharper corners.
  #ifdef DEC_TORUS_P
    float n = float(DEC_TORUS_P);
  #else
    float n = 8.0;
  #endif
  return dec_sdTorusLp(p, 1.8, 0.6, n);
}`;
          } else if (
            /\/primitive\/cylinder(6|8)-using-iq-s-change-of-distance-metric.*\.glsl$/.test(key)
          ) {
            // Cylinder with Lp metric in XZ plane (infinite along Y). Avoid custom
            // length6/length8 helpers by providing generic Lp norms.
            src = `// safe Lp-metric cylinder (infinite, axis Y)
float dec_lenN(vec2 v, float n){ v = abs(v); return pow(pow(v.x, n) + pow(v.y, n), 1.0 / n); }
float de(vec3 p){
  float n = 6.0; // default for cylinder6; filename for cylinder8 will still look fine
  float r = 1.0;
  return dec_lenN(p.xz, n) - r;
}`;
          } else if (/\/primitive\/unsigned-distance-to-triangle\.glsl$/.test(key)) {
            // Safe unsigned distance to triangle: extrude a 2D triangle into a thin prism
            // so it is visible with ray marching. Centers near origin in XY plane.
            src = `// safe triangle prism (unsigned distance to triangle with small thickness)
float dec_dot2(vec2 v){ return dot(v,v); }
float dec_sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
float dec_udTriangle(vec2 p, vec2 a, vec2 b, vec2 c){
  // unsigned 2D distance to triangle area
  float d = min(dec_sdSegment(p,a,b), min(dec_sdSegment(p,b,c), dec_sdSegment(p,c,a)));
  // inside test via same-side technique
  vec2 v0 = c - a, v1 = b - a, v2 = p - a;
  float den = v0.x * v1.y - v1.x * v0.y;
  float u = (v2.x * v1.y - v1.x * v2.y) / (abs(den) + 1e-6);
  float v = (v0.x * v2.y - v2.x * v0.y) / (abs(den) + 1e-6);
  float w = 1.0 - u - v;
  if (u >= 0.0 && v >= 0.0 && w >= 0.0) d = 0.0;
  return d;
}
float dec_sdTriPrism(vec3 p, vec2 a, vec2 b, vec2 c, float h){
  float d2 = dec_udTriangle(p.xy, a, b, c);
  float dz = max(abs(p.z) - h, 0.0);
  return max(d2, dz);
}
float de(vec3 p){
  // Equilateral-ish triangle in XY around origin, thickness 0.02
  vec2 a = vec2(-0.9, -0.6);
  vec2 b = vec2( 0.9, -0.6);
  vec2 c = vec2( 0.0,  0.9);
  return dec_sdTriPrism(p, a, b, c, 0.02);
}`;
          } else if (/\/primitive\/unsigned-distance-to-quad\.glsl$/.test(key)) {
            // Safe unsigned distance to quad: render as a thin, axis-aligned rectangle
            // prism in the XY plane (thickness in Z), so it is visible with ray marching.
            src = `// safe quad prism (unsigned distance to rectangle with small thickness)
float de(vec3 p){
  // Half extents of rectangle in XY, thickness along Z
  vec2 halfSize = vec2(1.2, 0.8);
  float halfH = 0.02;
  vec3 q = vec3(max(abs(p.x) - halfSize.x, 0.0), max(abs(p.y) - halfSize.y, 0.0), max(abs(p.z) - halfH, 0.0));
  return length(q);
}`;
          } else if (/\/primitive\/star\.glsl$/.test(key)) {
            // Safe 5‑point star extruded to a thin prism so it is visible
            src = `// safe 5-point star prism (no M_PI, no rotate2D)
float dec_sdStar5(vec2 p, float r1, float r2) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292); // cos72, -sin72
  const vec2 k2 = vec2(-0.809016994375, -0.587785252292);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r1;
  vec2 ba = r2 * vec2(-k1.y, k1.x) - vec2(0.0, 1.0) * r1;
  float h = clamp(dot(p, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(p - ba * h);
  float s = sign(p.y * ba.x - p.x * ba.y);
  return d * s;
}
float dec_sdStarPrism(vec3 p, float r1, float r2, float halfH) {
  float d2 = dec_sdStar5(p.xy, r1, r2);
  float dz = abs(p.z) - halfH;
  return max(d2, dz);
}
float de(vec3 p){
  return dec_sdStarPrism(p, 0.85, 0.35, 0.02);
}`;
          } else if (/\/primitive\/rack-wheel\.glsl$/.test(key)) {
            // Safe rack/gear wheel stand‑in: a modulated ring (teeth) extruded in Z.
            // Avoids snippet macros/prose and compiles reliably.
            src = `// safe gear/rack wheel (modulated torus-like ring)
float dec_sdGear(vec3 p, float R, float r, float h, float teeth, float amp){
  // Thickness along Z
  float dz = abs(p.z) - h;
  // Polar in XY
  float phi = atan(p.y, p.x);
  float rad = length(p.xy);
  // Modulated inner/outer radii
  float mod = sin(phi * teeth);
  float outer = (R + r) + amp * mod;
  float inner = max(0.0, (R - r) - 0.4 * amp * mod);
  float dRing = max(inner - rad, rad - outer);
  return max(dRing, dz);
}
float de(vec3 p){
  return dec_sdGear(p, 1.6, 0.35, 0.08, 24.0, 0.15);
}`;
          } else if (
            /\/includes\/dec\/(fractal|composed|primitive)\/(float-de-vec3-p.*|float-lpnorm-vec3-p.*)\.glsl$/.test(
              key
            )
          ) {
            // Some DEC fractal stubs are incomplete or contain prose that breaks GLSL.
            // Provide a safe visible SDF so the preview compiles and displays.
            src = `// safe fallback for DEC fractal stub
float de(vec3 p){
  // visible box instead of a sphere to signal fallback
  vec3 q = abs(p) - vec3(1.0);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}`;
          } else if (
            /\/primitive\/chamferbox-generalizes-sphere-cuboid-and-octahedron\.glsl$/.test(key)
          ) {
            // Fix DEC snippet typos: missing brace and wrong function name. Provide a
            // clean chamfered box using octahedron-based chamfer and final rounding.
            src = `// safe chamfered box (approximates DEC formulation)
float dec_sdOctahedron(vec3 p, float s) {
  p = abs(p);
  float m = p.x + p.y + p.z - s;
  vec3 q;
  if (3.0 * p.x < m) q = p.xyz;
  else if (3.0 * p.y < m) q = p.yzx;
  else if (3.0 * p.z < m) q = p.zxy;
  else return m * 0.57735027; // 1/sqrt(3)
  float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
  return length(vec3(q.x, q.y - s + k, q.z - k));
}
float de(vec3 p){
  vec3 b = vec3(1.0, 2.0, 3.0); // extents
  float ch = 0.25;              // chamfer
  float r  = 0.05;              // rounding
  vec3 q = abs(p) + vec3(ch + r) - b;
  q = max(q, 0.0);
  return dec_sdOctahedron(q, ch) - r;
}`;
          } else if (/\/primitive\/cone-pointing-up-the-y-axis\.glsl$/.test(key)) {
            src = `// safe finite cone pointing up +Y
// h = height, r = base radius
float dec_coneUp(vec3 p, float h, float r) {
  // Project to (radial, y)
  vec2 q = vec2(length(p.xz), p.y);
  // Cone side line parameters
  float s = r / max(h, 1e-6);
  // Distance to infinite cone side
  float side = dot(q, normalize(vec2(-s, 1.0)));
  // Distance to base disk (y=0)
  float base = q.y;
  // Outside lateral or below base
  float d = max(side, -base);
  // Cap to tip (above height)
  vec2 tip = q - vec2(0.0, h);
  d = max(d, (q.y > h ? length(tip) : -1e6));
  // Cap to base ring (outside radius at y≈0)
  d = max(d, (q.x > r ? length(q - vec2(r, 0.0)) : -1e6));
  return d;
}
float de(vec3 p){
  return dec_coneUp(p, 3.0, 1.0);
}`;
          } else if (
            /generalized-distance-functions-support-for-the-following-polyhedra\.glsl$/.test(key)
          ) {
            src = `// safe generalized polyhedra (sharp faces) using shared plane set
// Use DEC_GDF from dec-utils; do not redeclare to avoid conflicts.
float dec_gdfSharp(vec3 p, float r) {
  float d = 0.0;
  for (int i = 0; i < DEC_GDF_COUNT; ++i) {
    d = max(d, abs(dot(p, DEC_GDF[i])));
  }
  return d - r;
}
float de(vec3 p){
  return dec_gdfSharp(p, 1.0);
}`;
          } else if (/\/primitive\/octahedron(\.glsl|-alternative\.glsl)$/.test(key)) {
            src = `// safe octahedron (unique helper)
float dec_sdOctahedron(vec3 p, float s){
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735026919; // 1/sqrt(3)
}
float de(vec3 p){
  return dec_sdOctahedron(p, 1.0);
}`;
          } else if (/\/primitive\/dodecahedron(\.glsl|-alternative\.glsl)?$/.test(key)) {
            src = `// safe dodecahedron via fixed plane set (sharp faces)
// Uses DEC_GDF from dec-utils (no redefinition)
float dec_gdfSharp(vec3 p, float r) {
  float d = 0.0;
  for (int i = 0; i < DEC_GDF_COUNT; ++i) {
    d = max(d, abs(dot(p, DEC_GDF[i])));
  }
  return d - r;
}
float de(vec3 p){
  return dec_gdfSharp(p, 1.0);
}`;
          } else if (/\/primitive\/icosahedron-alternative\.glsl$/.test(key)) {
            // Alternative already matches IQ plane-set; force IQ (no toggle)
            src = `// Icosahedron (Alternative) — IQ plane-set SDF
float dec_sdIcosahedron(vec3 p, float radius){
  const float q = 2.61803398875; // PHI + 1
  const vec3 n1 = normalize(vec3(q, 1.0, 0.0));
  const vec3 n2 = vec3(0.57735026919); // = sqrt(3)/3
  p = abs(p / radius);
  float a = dot(p, n1.xyz);
  float b = dot(p, n1.zxy);
  float c = dot(p, n1.yzx);
  float d = dot(p, n2) - n1.x;
  return max(max(max(a, b), c) - n1.x, d) * radius;
}
float de(vec3 p){
  return dec_sdIcosahedron(p, 1.0);
}`;
          } else if (/\/primitive\/icosahedron\.glsl$/.test(key)) {
            src = `// Icosahedron SDF (toggleable IQ vs GDF plane set)
// uniform driven by GUI: u_icoUseIQ = true → IQ SDF; false → GDF sharp
uniform bool u_icoUseIQ;

// IQ-style plane-set based icosahedron (circumsphere radius)
float dec_sdIcosahedron(vec3 p, float radius){
  const float q = 2.61803398875; // PHI + 1
  const vec3 n1 = normalize(vec3(q, 1.0, 0.0));
  const vec3 n2 = vec3(0.57735026919); // = sqrt(3)/3
  p = abs(p / radius);
  float a = dot(p, n1.xyz);
  float b = dot(p, n1.zxy);
  float c = dot(p, n1.yzx);
  float d = dot(p, n2) - n1.x;
  return max(max(max(a, b), c) - n1.x, d) * radius;
}

// GDF sharp-face fallback (fixed plane set from dec-utils DEC_GDF)
float dec_gdfSharp(vec3 p, float r) {
  float d = 0.0;
  for (int i = 0; i <= 18; ++i) {
    d = max(d, abs(dot(p, DEC_GDF[i])));
  }
  return d - r;
}

float de(vec3 p){
  return u_icoUseIQ ? dec_sdIcosahedron(p, 1.0) : dec_gdfSharp(p, 1.0);
}`;
          } else if (/\/primitive\/truncated-octahedron(\.glsl|-alternative\.glsl)?$/.test(key)) {
            src = `// safe truncated octahedron placeholder: sharp-face polyhedron using fixed plane set
// Use shared DEC_GDF plane set from dec-utils to avoid redefinitions.
float dec_gdfSharp(vec3 p, float r) {
  float d = 0.0;
  for (int i = 0; i < DEC_GDF_COUNT; ++i) {
    d = max(d, abs(dot(p, DEC_GDF[i])));
  }
  return d - r;
}
float de(vec3 p){
  return dec_gdfSharp(p, 1.0);
}`;
          }
        } catch (_) {}
        active = src.length > 0;
        try {
          console.log('[DEC] injected key:', key, 'srcLen=', src.length);
          this.showToast && this.showToast(`DEC: injected ${key.split('/').pop()}`);
        } catch (_) {}
      } else {
        try {
          console.warn('[DEC] no key resolved; using empty stub');
          this.showToast && this.showToast('DEC: no entry (stub)');
        } catch (_) {}
      }
      // Build wrapped block and track status for overlay
      let wrapped = buildDecInjectedBlock(src);
      const hasDef = /\bDEC_USER_DEFINED\b/.test(wrapped) && /\bdecUserDE\s*\(/.test(wrapped);
      this.decStatus = {
        key: key || '(none)',
        srcLen: src.length | 0,
        active: !!active,
        defined: !!hasDef,
        injLen: (wrapped || '').length,
      };
      // Ensure DEC utils are available inside the injected block.
      // buildDecInjectedBlock already tries to include them; this is a safety net.
      if (!/dec-utils\.glsl/.test(wrapped)) {
        wrapped = `#include "./includes/dec/dec-utils.glsl"\n` + wrapped;
      }
      // eslint-disable-next-line no-constant-condition, no-constant-binary-expression
      if (false && this.fastDecInject && this._decTemplate) {
        // Fast replacement using the pre-resolved template
        let shader;
        const anchorRe = /\/\*__DEC_REPLACE__\*\//;
        if (this._decTemplate && anchorRe.test(this._decTemplate)) {
          shader = this._decTemplate.replace(anchorRe, wrapped);
        } else {
          // One-time fallback: resolve now and cache template for next time
          let base = resolveIncludes(fragmentSource);
          const markerRe2 = /\/\/\s*DEC_USER_SNIPPET_BEGIN[\s\S]*?\/\/\s*DEC_USER_SNIPPET_END/;
          shader = base.replace(markerRe2, wrapped);
          this._decTemplate = shader.replace(wrapped, '/*__DEC_REPLACE__*/');
        }
        // Expand any includes introduced by wrapped content
        shader = resolveIncludes(shader);
        // Treat as current fragment and fully refresh specialization cache
        this.baseFragmentShader = shader;
        this.clearSpecializationCache();
        this.applyMaterialSpecializationIfNeeded(true);
        try {
          this.renderer.compile(this.scene, this.camera);
        } catch (_) {}
        try {
          this.renderer.render(this.scene, this.camera);
        } catch (_) {}
      } else {
        // Reliable path: rebuild full fragment and refresh specialization cache
        let shader = resolveIncludes(fragmentSource);
        const markerRe = /\/\/\s*DEC_USER_SNIPPET_BEGIN[\s\S]*?\/\/\s*DEC_USER_SNIPPET_END/;
        if (markerRe.test(shader)) {
          shader = shader.replace(markerRe, wrapped);
        } else {
          // Fallback insertion: put wrapped block after the last known include
          const anchor = '#include "./includes/coloring.glsl"';
          const idx = shader.indexOf(anchor);
          if (idx !== -1) {
            const insertPos = shader.indexOf('\n', idx + anchor.length) + 1;
            shader = shader.slice(0, insertPos) + `\n${wrapped}\n` + shader.slice(insertPos);
          } else {
            shader = `${wrapped}\n${shader}`;
          }
        }
        // Resolve any new includes introduced by wrapped content
        shader = resolveIncludes(shader);
        this.baseFragmentShader = shader;
        this.clearSpecializationCache();
        this.applyMaterialSpecializationIfNeeded(true);
        try {
          this.renderer.render(this.scene, this.camera);
        } catch (_) {}
      }
    };

    const fragmentShader = resolveIncludes(fragmentSource);
    this.baseFragmentShader = fragmentShader;
    // Prepare fast DEC injection template so we don't re-run include resolution
    // on every dropdown change. We'll replace this anchor with the wrapped
    // DEC snippet at runtime.
    try {
      const markerRe = /\/\/\s*DEC_USER_SNIPPET_BEGIN[\s\S]*?\/\/\s*DEC_USER_SNIPPET_END/;
      this._decTemplate = fragmentShader.replace(markerRe, '/*__DEC_REPLACE__*/');
    } catch (_) {
      this._decTemplate = null;
    }
    // Cache of compiled DEC materials by entry key + options
    this.decMaterialCache = new Map();
    // Current DEC-only fragment (used when FRAC_TYPE == FT_DEC)
    this.decFragmentShader = null;

    // Initialize palette manager and pre-pack custom palette uniforms
    this.paletteManager = new PaletteManager();
    this.paletteManager.packToUniforms(this.uniforms);

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    // Use GLSL 3.00 ES across both shaders
    this.material.glslVersion = THREE.GLSL3;

    // Create fullscreen quad that always faces camera
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);
    this.quad.frustumCulled = false; // Never cull this mesh
    this.scene.add(this.quad);

    // --- Post-processing setup (Bloom + LUT) ---
    // Add post-only uniforms on the same uniforms object so values stay in sync
    this.uniforms.u_sceneTex = { value: null };
    this.uniforms.u_bloomEnabled = { value: DEFAULTS.bloomEnabled || false };
    this.uniforms.u_bloomThreshold = { value: DEFAULTS.bloomThreshold || 1.0 };
    this.uniforms.u_bloomStrength = { value: DEFAULTS.bloomStrength || 0.0 };
    this.uniforms.u_bloomRadius = { value: DEFAULTS.bloomRadius || 1.0 };
    this.uniforms.u_lutEnabled = { value: DEFAULTS.lutEnabled || false };
    this.uniforms.u_lutTex = { value: null };
    this.uniforms.u_lutSize = { value: DEFAULTS.lutSize || 32 };
    this.uniforms.u_lutIntensity = { value: DEFAULTS.lutIntensity || 1.0 };

    this.postMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: screenVertex,
      fragmentShader: postFragment,
      depthWrite: false,
      depthTest: false,
    });
    this.postMaterial.glslVersion = THREE.GLSL3;

    // Offscreen render target for first pass
    const rtOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    };
    this.rtScene = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, rtOpts);

    // Proactively compile the shader program now (so loading bar can reflect progress)
    // instead of waiting for the first render.
    try {
      this.renderer.compile(this.scene, this.camera);
    } catch (e) {
      // Surface any unexpected errors
      console.error('Shader compilation failed during precompile:', e);
      this.updateLoadingProgress(50, 'Shader compilation error');
      this.showShaderError('Precompile Error', String(e));
    }
  }

  // --- Shader Specialization Support ---------------------------------------
  getSpecializedMaterialForType(typeId) {
    const key = typeId | 0;
    if (this.materialCache.has(key)) return this.materialCache.get(key);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader:
        key === 7 && this.decFragmentShader
          ? this.decFragmentShader
          : this.baseFragmentShader || fragmentSource,
      depthWrite: false,
      depthTest: false,
      defines: { FRAC_TYPE: key },
    });
    mat.glslVersion = THREE.GLSL3;
    this.materialCache.set(key, mat);
    return mat;
  }

  applyMaterialSpecializationIfNeeded(_force = false) {
    const currentType =
      this.uniforms && this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : 0;
    if (!this.quad) return;
    const m = this.getSpecializedMaterialForType(currentType);
    if (this.quad.material !== m) {
      this.quad.material = m;
      this.quad.material.needsUpdate = true;
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch (_) {}
    }
  }

  clearSpecializationCache() {
    this.materialCache.forEach((m) => {
      try {
        m.dispose();
      } catch (_) {}
    });
    this.materialCache.clear();
  }

  async prewarmSpecializedMaterials(typeList, progressStart = 48, progressEnd = 60) {
    try {
      const types = Array.isArray(typeList) ? typeList : [0, 1, 2, 3, 4, 5, 6];
      const currentType =
        this.uniforms && this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : 0;
      const original = this.getSpecializedMaterialForType(currentType);
      const total = Math.max(1, types.length);
      let i = 0;
      for (const t of types) {
        const mat = this.getSpecializedMaterialForType(t);
        if (this.quad && mat) {
          const prev = this.quad.material;
          this.quad.material = mat;
          try {
            this.renderer.compile(this.scene, this.camera);
          } catch (_) {}
          this.quad.material = prev;
        }
        i++;
        // update progress bar if still visible
        const p = progressStart + (progressEnd - progressStart) * (i / total);
        this.updateLoadingProgress(Math.floor(p), `Precompiling shaders (${i}/${total})...`);
        // Yield to keep UI responsive if called during init
        await new Promise((r) => setTimeout(r, 0));
      }
      // Restore current specialized material
      if (this.quad && original) {
        this.quad.material = original;
        this.quad.material.needsUpdate = true;
      }
    } catch (_) {}
  }

  setupControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
    // Guard pointer lock so it never engages while any modal/overlay is open
    try {
      const originalLock = this.controls.lock.bind(this.controls);
      this.controls.lock = (...args) => {
        try {
          const info = document.getElementById('gui-info-overlay');
          if (info && info.style && info.style.display !== 'none') {
            return; // suppress lock while overlay visible
          }
        } catch (_) {}
        return originalLock(...args);
      };
    } catch (_) {}

    // Click to lock pointer
    // Detect if Pointer Lock is usable in this environment (top window, secure,
    // and element supports requestPointerLock). Many preview panes run in iframes
    // without the proper `allow="pointer-lock"` attribute, which will throw.
    this.pointerLockUsable =
      typeof this.canvas.requestPointerLock === 'function' &&
      window.isSecureContext !== false &&
      window.self === window.top;

    this.canvas.addEventListener('click', () => {
      // If an overlay/modal is visible, don't request pointer lock
      try {
        const info = document.getElementById('gui-info-overlay');
        const cv = document.getElementById('canvas');
        if (info && info.style && info.style.display !== 'none') {
          // Extra hardening: ensure canvas cannot grab pointer
          if (cv) cv.style.pointerEvents = 'none';
          return;
        }
      } catch (_) {}
      if (!this.pointerLockUsable) {
        this.showPointerLockWarning();
        return;
      }
      try {
        this.controls.lock();
      } catch (e) {
        console.warn('Pointer lock failed:', e);
        this.showPointerLockWarning();
      }
    });

    // Keyboard controls
    const onKeyDown = (event) => {
      // Quick toggle: Shift+D → DEC Preview on/off (with snapshot restore)
      if (event.code === 'KeyD' && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        const gm = this.guiManager;
        if (gm && gm.params) {
          const next = !gm.params.decPreviewEnabled;
          gm.params.decPreviewEnabled = next;
          try {
            if (gm.callbacks && gm.callbacks.onDecPreviewToggle)
              gm.callbacks.onDecPreviewToggle(next);
          } catch (_) {}
          try {
            if (gm.gui && gm.gui.controllersRecursive)
              gm.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          } catch (_) {}
        }
        return;
      }
      // (Removed Assist Sphere quick toggle)
      // Quick frame: Shift+F → move camera to frame DEC center
      if (event.code === 'KeyF' && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        if (this.guiManager && this.guiManager.callbacks && this.guiManager.callbacks.frameDEC) {
          this.guiManager.callbacks.frameDEC();
        }
        return;
      }
      // Quick center: Shift+C → center DEC in front of camera
      if (event.code === 'KeyC' && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        if (this.guiManager && this.guiManager.callbacks && this.guiManager.callbacks.centerDEC) {
          this.guiManager.callbacks.centerDEC();
        }
        return;
      }
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
        case 'KeyE':
          this.moveUp = true;
          break;
        case 'KeyQ':
          this.moveDown = true;
          break;
        case 'Space':
          // While locked, switch mouse move to rotate fractal instead of camera
          if (!this.spaceMouseRotate) {
            this.spaceMouseRotate = true;
            document.addEventListener('mousemove', this.onMouseRotate, true);
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.shiftPressed = true;
          break;
        case 'KeyR':
          // Toggle auto-rotation
          if (this.guiManager && this.guiManager.params) {
            const next = !this.guiManager.params.animateRotation;
            this.guiManager.params.animateRotation = next;
            // Inform runtime
            this.animationEnabled = next;
            try {
              if (this.guiManager.callbacks && this.guiManager.callbacks.onAnimationToggle)
                this.guiManager.callbacks.onAnimationToggle(next);
            } catch (_) {}
            try {
              if (this.guiManager.gui && this.guiManager.gui.controllersRecursive)
                this.guiManager.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
            } catch (_) {}
            try {
              if (typeof this.guiManager.schedulePersist === 'function')
                this.guiManager.schedulePersist();
            } catch (_) {}
          }
          break;
        case 'KeyO':
          // Reset camera position/direction
          this.resetCamera();
          break;
        case 'KeyM':
          // Toggle morph animation
          if (this.guiManager && this.guiManager.params) {
            const nextM = !this.guiManager.params.morphEnabled;
            this.guiManager.params.morphEnabled = nextM;
            try {
              if (this.guiManager.gui && this.guiManager.gui.controllersRecursive)
                this.guiManager.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
            } catch (_) {}
            try {
              if (typeof this.guiManager.schedulePersist === 'function')
                this.guiManager.schedulePersist();
            } catch (_) {}
          }
          break;
        case 'Digit1':
          this.setFractalType(0, 'Primitives');
          break;
        case 'Digit2':
          this.setFractalType(1, 'Menger Sponge');
          break;
        case 'Digit3':
          this.setFractalType(2, 'Mandelbulb');
          break;
        case 'Digit4':
          this.setFractalType(3, 'Sierpinski Tetrahedron');
          break;
        case 'Digit5':
          this.setFractalType(4, 'Mandelbox');
          break;
        case 'Digit6':
          this.setFractalType(5, 'World (Amazing Surf)');
          break;
        case 'Digit7':
          this.setFractalType(6, 'World (Truchet Pipes)');
          break;
        case 'BracketLeft': // [
          this.uniforms.u_iterations.value = Math.max(1, this.uniforms.u_iterations.value - 1);
          console.log('Iterations:', this.uniforms.u_iterations.value);
          break;
        case 'BracketRight': // ]
          this.uniforms.u_iterations.value = Math.min(20, this.uniforms.u_iterations.value + 1);
          console.log('Iterations:', this.uniforms.u_iterations.value);
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
        case 'KeyE':
          this.moveUp = false;
          break;
        case 'KeyQ':
          this.moveDown = false;
          break;
        case 'Space':
          if (this.spaceMouseRotate) {
            this.spaceMouseRotate = false;
            document.removeEventListener('mousemove', this.onMouseRotate, true);
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.shiftPressed = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  showPointerLockWarning() {
    // One‑time toast to explain why look controls are disabled
    if (this._plToastShown) return;
    this._plToastShown = true;
    try {
      const toast = document.createElement('div');
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 10000,
      });
      toast.textContent =
        'Pointer Lock is unavailable (likely running inside an iframe). Open in a new tab or grant iframe permission (allow="pointer-lock").';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 6000);
    } catch (_) {}
  }

  showToast(message, { duration = 1600 } = {}) {
    try {
      const toast = document.createElement('div');
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        background: 'rgba(20,20,20,0.9)',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 10001,
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
      });
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(
        () => {
          try {
            toast.remove();
          } catch (_) {}
        },
        Math.max(600, duration | 0)
      );
    } catch (_) {}
  }

  setFractalType(typeId, label = '') {
    const clamped = Math.max(0, Math.min(6, typeId | 0));
    if (this.uniforms && this.uniforms.u_fractalType) {
      this.uniforms.u_fractalType.value = clamped;
      try {
        localStorage.setItem('fractalExplorer_fractalType', String(clamped));
      } catch (_) {}
    }
    if (this.guiManager) {
      this.guiManager.params.fractalType = clamped;
      if (this.guiManager.gui && this.guiManager.gui.controllersRecursive) {
        this.guiManager.gui.controllersRecursive().forEach((c) => c.updateDisplay());
      }
      if (typeof this.guiManager.schedulePersist === 'function') {
        this.guiManager.schedulePersist();
      }
      if (typeof this.guiManager.applyPerFractalDefaults === 'function') {
        this.guiManager.applyPerFractalDefaults('kb');
      }
    }
    // Swap material if specializing per fractal
    this.applyMaterialSpecializationIfNeeded(true);
    if (label) console.log(`Switched to: ${label}`);
  }

  loadSavedFractalType() {
    try {
      const saved = localStorage.getItem('fractalExplorer_fractalType');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!Number.isNaN(val) && val >= 0 && val <= 7) {
          if (this.uniforms && this.uniforms.u_fractalType) {
            this.uniforms.u_fractalType.value = val;
          }
          console.log('✅ Restored saved fractal type:', val);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved fractal type:', e);
    }
  }

  resetCamera() {
    // Reset to default view
    this.camera.position.set(0, 0, 7.0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.velocity.set(0, 0, 0);
  }

  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.left = '0px';
    this.stats.dom.style.top = '0px';
    document.body.appendChild(this.stats.dom);

    // Debug overlay (top-left)
    this.debugOverlay = document.createElement('div');
    Object.assign(this.debugOverlay.style, {
      position: 'absolute',
      left: '85px',
      top: '0px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: '6px 8px',
      borderRadius: '3px',
      // Allow selecting/copying text from the debug overlay
      userSelect: 'text',
      pointerEvents: 'auto',
      cursor: 'text',
      zIndex: 1001,
      whiteSpace: 'pre',
      lineHeight: '1.3',
    });
    this.debugOverlay.textContent = 'LOD: —\nSteps: —\nAO/Shadow: —';
    document.body.appendChild(this.debugOverlay);

    // Update throttling
    this.debugOverlayLastUpdate = 0;
    this.debugOverlayInterval = 0.5; // seconds (limit updates to 2x/sec)

    // Keep camera distance display top-center; no overlay-based reposition here
  }

  // Lightweight, built-in profiling helpers exposed on window for convenience.
  // Usage in DevTools:
  //   runProfile('label', 15).then(() => getOverlayText());
  addProfileHelpers() {
    try {
      const self = this;
      function collectEnv() {
        try {
          const c = self.canvas || document.querySelector('canvas');
          const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
          const ext = gl && gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
          const zoom =
            window.outerWidth && window.innerWidth ? window.outerWidth / window.innerWidth : 1;
          const env = {
            ua: navigator.userAgent,
            dpr: window.devicePixelRatio || 1,
            zoom: Math.round(zoom * 100) + '%',
            inner: [window.innerWidth | 0, window.innerHeight | 0],
            screen: [window.screen.width | 0, window.screen.height | 0],
            canvas: c ? [c.width | 0, c.height | 0] : null,
            renderScale:
              typeof self.renderScale === 'number' ? +self.renderScale.toFixed(2) : undefined,
            pixelRatio:
              self.renderer && self.renderer.getPixelRatio
                ? +self.renderer.getPixelRatio().toFixed(2)
                : undefined,
            webglVersion: gl && gl.getParameter ? gl.getParameter(gl.VERSION) : undefined,
            glsl: gl && gl.getParameter ? gl.getParameter(gl.SHADING_LANGUAGE_VERSION) : undefined,
            vendor: gl
              ? ext
                ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
                : gl.getParameter(gl.VENDOR)
              : undefined,
            renderer: gl
              ? ext
                ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                : gl.getParameter(gl.RENDERER)
              : undefined,
          };
          return env;
        } catch (_) {
          return {};
        }
      }
      // Frame-based FPS sampler over a duration (seconds).
      window.runProfile = function (label = 'profile', durSec = 15) {
        return new Promise((resolve) => {
          const secs = [];
          let start = 0,
            last = 0,
            frames = 0;
          function tick(t) {
            if (start === 0) {
              start = t;
              last = t;
            }
            frames++;
            if (t - last >= 1000) {
              secs.push((frames * 1000) / (t - last));
              frames = 0;
              last = t;
            }
            if (t - start < durSec * 1000) {
              requestAnimationFrame(tick);
            } else {
              const avg = secs.reduce((a, b) => a + b, 0) / (secs.length || 1);
              const sorted = secs.slice().sort((a, b) => a - b);
              const q = (p) => sorted[Math.floor((sorted.length - 1) * p)] || 0;
              const out = {
                label,
                durationSec: durSec,
                sampleCount: secs.length,
                avgFPS: +avg.toFixed(1),
                p50FPS: +q(0.5).toFixed(1),
                p95FPS: +q(0.95).toFixed(1),
                samples: secs,
              };
              // Capture overlay text silently
              let overlayText = '';
              try {
                if (self.debugOverlay) overlayText = (self.debugOverlay.textContent || '').trim();
                if (!overlayText) {
                  const el = Array.from(document.querySelectorAll('div')).find((d) => {
                    const t = d.textContent || '';
                    return t.includes('Integrator:') && t.includes('LOD:') && t.includes('Dither:');
                  });
                  overlayText = ((el && el.textContent) || '').trim();
                }
              } catch (_) {}
              const env = collectEnv();
              const enriched = Object.assign(
                { overlayText, spec: 'On', timestamp: new Date().toISOString(), env },
                out
              );
              try {
                window.__lastProfile__ = enriched;
                window.__profiles__ = window.__profiles__ || [];
                window.__profiles__.push(enriched);
                if (window.__profiles__.length > 10) window.__profiles__.shift();
              } catch (_) {}
              try {
                console.log(JSON.stringify(out, null, 2));
              } catch (_) {
                console.log(out);
              }
              try {
                self.showToast(`📊 ${label}: ${out.avgFPS} FPS`);
              } catch (_) {}
              resolve(out);
            }
          }
          requestAnimationFrame(tick);
        });
      };

      // Batch profiler: run N back-to-back 15s profiles and report stats
      window.runProfileBatch = async function (labelBase = 'batch', durSec = 15, runs = 3) {
        const out = [];
        for (let i = 0; i < runs; i++) {
          const label = `${labelBase}_${i + 1}`;
          const r = await window.runProfile(label, durSec);
          out.push(r);
        }
        // Compute summary
        const fpsArr = out.map((r) => r.avgFPS);
        const avg = fpsArr.reduce((a, b) => a + b, 0) / Math.max(1, fpsArr.length);
        const min = Math.min.apply(null, fpsArr);
        const max = Math.max.apply(null, fpsArr);
        const var_ =
          fpsArr.reduce((a, b) => a + (b - avg) * (b - avg), 0) / Math.max(1, fpsArr.length);
        const std = Math.sqrt(var_);
        const summary = {
          runs,
          avgFPS: +avg.toFixed(2),
          minFPS: +min.toFixed(2),
          maxFPS: +max.toFixed(2),
          stdev: +std.toFixed(2),
          samples: fpsArr.map((v) => +v.toFixed(2)),
        };
        try {
          console.log('📊 Batch summary', JSON.stringify(summary, null, 2));
        } catch (_) {
          console.log(summary);
        }
        try {
          self.showToast(`📊 Batch: avg ${summary.avgFPS} FPS (±${summary.stdev})`);
        } catch (_) {}
        try {
          window.__lastProfileBatch__ = { summary, runs: out };
        } catch (_) {}
        return { summary, runs: out };
      };

      // Returns overlay text (Spec/LOD/Steps lines) and logs it.
      window.getOverlayText = function () {
        try {
          let txt = '';
          if (self.debugOverlay) txt = (self.debugOverlay.textContent || '').trim();
          if (!txt) {
            const el = Array.from(document.querySelectorAll('div')).find((d) => {
              const t = d.textContent || '';
              return t.includes('Integrator:') && t.includes('LOD:') && t.includes('Dither:');
            });
            txt = ((el && el.textContent) || '').trim();
          }
          console.log(txt);
          return txt;
        } catch (e) {
          console.warn('getOverlayText failed:', e);
          return '';
        }
      };

      // Capture environment info (screen/canvas/UA/GPU) and log JSON
      window.getEnvInfo = function () {
        const env = collectEnv();
        try {
          console.log(JSON.stringify(env, null, 2));
        } catch (_) {
          console.log(env);
        }
        return env;
      };

      // Copy environment info to clipboard (with trailing newline)
      window.copyEnvInfo = async function () {
        try {
          const env = collectEnv();
          const text = JSON.stringify(env, null, 2) + '\n';
          await navigator.clipboard.writeText(text);
          try {
            self.showToast('✅ Env info copied');
          } catch (_) {}
          return true;
        } catch (e) {
          console.warn('Env copy failed:', e);
          try {
            console.log(JSON.stringify(collectEnv(), null, 2));
          } catch (_) {}
          try {
            self.showToast('⚠️ Env copy failed — see console');
          } catch (_) {}
          return false;
        }
      };

      // Copy last profile JSON to clipboard
      window.copyLastProfile = async function () {
        try {
          const lp = window.__lastProfile__;
          if (!lp) {
            console.warn('No last profile to copy');
            return false;
          }
          const text = JSON.stringify(lp, null, 2) + '\n';
          await navigator.clipboard.writeText(text);
          console.log('Copied last profile to clipboard');
          try {
            self.showToast('✅ Profile JSON copied');
          } catch (_) {}
          return true;
        } catch (e) {
          console.warn('Copy failed; dumping JSON below:', e);
          try {
            console.log(JSON.stringify(window.__lastProfile__, null, 2));
          } catch (_) {}
          try {
            self.showToast('⚠️ Copy failed — see console');
          } catch (_) {}
          return false;
        }
      };

      try {
        console.log('Profiler helpers ready: runProfile(label,sec), getOverlayText()');
      } catch (_) {}

      // DEC diagnostics: dump injected snippet and check for decUserDE
      window.dumpDEC = function () {
        try {
          const src = self.baseFragmentShader || '';
          const has = src.includes('decUserDE(');
          const m = src.match(/\/\/\s*DEC_USER_SNIPPET_BEGIN[\s\S]*?\/\/\s*DEC_USER_SNIPPET_END/);
          console.log('[DEC dump] decUserDE:', has, 'snippet chars:', m ? m[0].length : 0);
          if (m) {
            const head = m[0].split('\n').slice(0, 12).join('\n');
            console.log('[DEC head]\n' + head + '\n...');
          }
          return { hasDecUser: has, snippetLen: m ? m[0].length : 0 };
        } catch (e) {
          console.warn('dumpDEC failed:', e);
          return null;
        }
      };

      // DEC helper: set entry by suffix or full path and rebuild immediately
      window.setDEC = function (spec) {
        try {
          const s = String(spec || '').trim();
          let key = self.resolveDecKey(s);
          if (!key) {
            // Try suffix match against file name
            const keys = Object.keys(DEC_MODULES || {});
            const base = s.replace(/.*\//, '');
            key = keys.find((k) => k.endsWith('/' + base));
          }
          if (!key) {
            console.warn('setDEC: not found for', s);
            return false;
          }
          self.decPreview.includePath = key;
          try {
            localStorage.setItem('fractalExplorer_decEntry', String(key));
          } catch (_) {}
          // Ensure DEC type and enabled
          if (self.guiManager && self.guiManager.setFractalType) self.guiManager.setFractalType(7);
          self.decPreview.enabled = true;
          if (
            self.guiManager &&
            self.guiManager.callbacks &&
            self.guiManager.callbacks.onDecPreviewToggle
          )
            self.guiManager.callbacks.onDecPreviewToggle(true);
          self.applyDecMappingAndRebuild();
          console.log('[DEC set] key=', key);
          return true;
        } catch (e) {
          console.warn('setDEC failed:', e);
          return false;
        }
      };

      // Configure World to render the injected DEC surface exactly
      // Copies current DEC transforms (scale, rotation, offset) and disables
      // shell/warp/textures for a 1:1 look.
      window.worldFromDEC = function () {
        try {
          // Switch to World type
          if (self.guiManager && self.guiManager.setFractalType) self.guiManager.setFractalType(5);
          else if (self.uniforms && self.uniforms.u_fractalType)
            self.uniforms.u_fractalType.value = 5;
          // Ensure DEC is injected
          if (!self.decPreview.enabled) {
            self.decPreview.enabled = true;
            if (
              self.guiManager &&
              self.guiManager.callbacks &&
              self.guiManager.callbacks.onDecPreviewToggle
            )
              self.guiManager.callbacks.onDecPreviewToggle(true);
          }
          // Copy transforms
          const s =
            self.uniforms && self.uniforms.u_fractalScale
              ? self.uniforms.u_fractalScale.value
              : 1.0;
          const rot =
            self.uniforms && self.uniforms.u_rotation
              ? self.uniforms.u_rotation.value
              : { x: 0, y: 0, z: 0 };
          const off =
            self.uniforms && self.uniforms.u_decOffset
              ? self.uniforms.u_decOffset.value
              : { x: 0, y: 0, z: 0 };
          if (self.uniforms.u_fractalScale) self.uniforms.u_fractalScale.value = s;
          if (self.uniforms.u_rotation)
            self.uniforms.u_rotation.value.set(rot.x || 0, rot.y || 0, rot.z || 0);
          if (self.uniforms.u_decOffset)
            self.uniforms.u_decOffset.value.set(off.x || 0, off.y || 0, off.z || 0);
          // World→DEC exact surface
          if (self.uniforms.u_worldUseDEC) self.uniforms.u_worldUseDEC.value = true;
          if (self.uniforms.u_worldThickness) self.uniforms.u_worldThickness.value = 0.0;
          if (self.uniforms.u_worldWarp) self.uniforms.u_worldWarp.value = 0.0;
          // Turn off procedural textures
          try {
            if (self.guiManager) {
              self.guiManager.params.applyProceduralTextures = false;
            }
          } catch (_) {}
          // Force floor OFF for DEC surf
          try {
            if (self.guiManager) self.guiManager.params.floorEnabled = false;
            if (self.uniforms.u_floorEnabled) self.uniforms.u_floorEnabled.value = false;
          } catch (_) {}
          // Force camera speed to preset intent (1.0 for PI Tetra Surf)
          try {
            const wantSpeed = 1.0;
            if (self.guiManager && typeof self.guiManager.params.movementSpeed === 'number') {
              self.guiManager.params.movementSpeed = wantSpeed;
            }
            if (typeof self.guiManager?.callbacks?.onSpeedChange === 'function') {
              self.guiManager.callbacks.onSpeedChange(wantSpeed);
            }
          } catch (_) {}
          // Rebuild
          if (
            self.guiManager &&
            self.guiManager.callbacks &&
            self.guiManager.callbacks.requestShaderRefresh
          )
            self.guiManager.callbacks.requestShaderRefresh();
          // HUD
          try {
            console.log(
              '[World←DEC] type=5 useDEC=1 thickness=0 warp=0 scale=',
              s,
              'rot=',
              rot,
              'off=',
              off
            );
          } catch (_) {}
          return true;
        } catch (e) {
          console.warn('worldFromDEC failed:', e);
          return false;
        }
      };

      // Wait until the DEC snippet is injected (decStatus.defined) and
      // then apply worldFromDEC once. This avoids ordering races when a
      // preset toggles DEC + World in the same tick.
      window.ensureWorldMatchesDEC = function (maxFrames = 60) {
        try {
          let n = 0;
          function tick() {
            n++;
            const ds = self.decStatus || {};
            const has = !!ds.defined;
            const isWorld = !!(
              self.uniforms &&
              self.uniforms.u_fractalType &&
              (self.uniforms.u_fractalType.value | 0) === 5
            );
            if (has && isWorld) {
              try {
                window.worldFromDEC();
              } catch (_) {}
              window.__autoWorldFromDEC = false;
              return;
            }
            if (n < maxFrames) requestAnimationFrame(tick);
            else {
              try {
                console.warn('[World←DEC] timed out waiting for DEC injection');
              } catch (_) {}
            }
          }
          requestAnimationFrame(tick);
          return true;
        } catch (e) {
          console.warn('ensureWorldMatchesDEC failed:', e);
          return false;
        }
      };

      // Auto-sync flags
      try {
        window.__autoWorldApplied = false;
      } catch (_) {}
    } catch (_) {}
  }

  // Quick texture tuner: staged sweep to find a good Top‑2 MinW/Hysteresis and LOD aggression
  // for the current pose/budgets. Exposed on window.tuneTexture('fast').
  addTextureTuner() {
    const self = this;
    function setParam(key, val) {
      try {
        if (self.guiManager && key in self.guiManager.params) self.guiManager.params[key] = val;
      } catch (_) {}
      const u = self.uniforms;
      switch (key) {
        case 'texTop2':
          if (u.u_texTop2) u.u_texTop2.value = !!val;
          break;
        case 'texFastBump':
          if (u.u_texFastBump) u.u_texFastBump.value = !!val;
          break;
        case 'texTriMinWeight':
          if (u.u_texTriMinWeight) u.u_texTriMinWeight.value = val;
          break;
        case 'texTriHyst':
          if (u.u_texTriHyst) u.u_texTriHyst.value = val;
          break;
        case 'texLODEnabled':
          if (u.u_texLODEnabled) u.u_texLODEnabled.value = !!val;
          break;
        case 'texDerivAggression':
          if (u.u_texDerivAggression) u.u_texDerivAggression.value = val;
          break;
        case 'texBumpDerivFade':
          if (u.u_texBumpDerivFade) u.u_texBumpDerivFade.value = val;
          break;
        case 'texSpecDerivFade':
          if (u.u_texSpecDerivFade) u.u_texSpecDerivFade.value = val;
          break;
        case 'texLODBumpFactor':
          if (u.u_texLODBumpFactor) u.u_texLODBumpFactor.value = val;
          break;
        case 'texLODSpecFactor':
          if (u.u_texLODSpecFactor) u.u_texLODSpecFactor.value = val;
          break;
      }
    }
    async function waitFrames(n) {
      for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r));
    }
    async function measureFPS(seconds = 2.0) {
      return await new Promise((resolve) => {
        let start = 0;
        let frames = 0;
        function tick(t) {
          if (!start) start = t;
          frames++;
          if (t - start < seconds * 1000) requestAnimationFrame(tick);
          else {
            const fps = (frames * 1000) / Math.max(1, t - start);
            resolve(fps);
          }
        }
        requestAnimationFrame(tick);
      });
    }

    window.tuneTexture = async function (_mode = 'fast') {
      try {
        self.showToast('🔧 Tuning texture…');
      } catch (_) {}
      // Start from Balanced mapping
      try {
        if (self.guiManager && self.guiManager.applyTextureQuality)
          self.guiManager.applyTextureQuality('Balanced');
      } catch (_) {}
      setParam('texTop2', true);
      setParam('texFastBump', true);
      setParam('texLODEnabled', true);

      // Stage 1: sweep (MinW × Hyst)
      const minWc = [0.1, 0.12, 0.15];
      const hystC = [0.0, 0.01, 0.02];
      let best1 = { fps: 0, minW: null, hyst: null };
      for (const m of minWc) {
        for (const h of hystC) {
          setParam('texTriMinWeight', m);
          setParam('texTriHyst', h);
          await waitFrames(12);
          const fps = await measureFPS(1.8);
          if (fps > best1.fps) best1 = { fps, minW: m, hyst: h };
        }
      }
      setParam('texTriMinWeight', best1.minW);
      setParam('texTriHyst', best1.hyst);

      // Stage 2: LOD aggression + deriv fades triplets
      const combos = [
        { agg: 1.15, b: 0.7, s: 0.6 },
        { agg: 1.25, b: 0.8, s: 0.65 },
        { agg: 1.35, b: 0.85, s: 0.75 },
      ];
      let best2 = { fps: 0, agg: null, b: null, s: null };
      for (const c of combos) {
        setParam('texDerivAggression', c.agg);
        setParam('texBumpDerivFade', c.b);
        setParam('texSpecDerivFade', c.s);
        await waitFrames(12);
        const fps = await measureFPS(1.8);
        if (fps > best2.fps) best2 = { fps, ...c };
      }
      setParam('texDerivAggression', best2.agg);
      setParam('texBumpDerivFade', best2.b);
      setParam('texSpecDerivFade', best2.s);

      // Optional: fine touch on far scaling (keep from Balanced defaults)
      // Report summary
      const summary = {
        minW: best1.minW,
        hyst: best1.hyst,
        agg: best2.agg,
        bumpDeriv: best2.b,
        specDeriv: best2.s,
        estFPS: +best2.fps.toFixed(2),
      };
      try {
        console.log('🔧 Texture tune summary:', summary);
      } catch (_) {}
      try {
        self.showToast(
          `✨ Texture tuned: ${summary.estFPS} FPS (MinW ${summary.minW.toFixed(2)}, Hyst ${summary.hyst.toFixed(2)}, Agg ${summary.agg.toFixed(2)})`,
          { duration: 2600 }
        );
      } catch (_) {}
      // Persist
      try {
        if (self.guiManager) self.guiManager.schedulePersist();
      } catch (_) {}
      return summary;
    };
  }

  setupGUI() {
    // Pass initial quality if we have one
    const initialQuality = this.savedQuality || 'High';

    this.guiManager = new GUIManager(this.uniforms, this.camera, {
      resetCamera: () => this.resetCamera(),
      resetRotation: () => {
        this.rotation.set(0, 0, 0);
        if (this.uniforms && this.uniforms.u_rotation) this.uniforms.u_rotation.value.set(0, 0, 0);
      },
      // DEC actions wired to buttons
      centerDEC: () => {
        try {
          // Enable DEC and set type
          if (!this.decPreview.enabled) {
            this.decPreview.enabled = true;
            if (this.guiManager.callbacks && this.guiManager.callbacks.onDecPreviewToggle)
              this.guiManager.callbacks.onDecPreviewToggle(true);
          }
          if (this.guiManager && this.guiManager.setFractalType) this.guiManager.setFractalType(7);
          // Place object in front of camera
          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          const dist = 4.0;
          const pos = new THREE.Vector3().copy(this.camera.position).add(dir.multiplyScalar(dist));
          if (this.uniforms.u_decOffset) this.uniforms.u_decOffset.value.copy(pos);
          if (this.uniforms.u_fractalScale) this.uniforms.u_fractalScale.value = 1.0;
          if (this.uniforms && this.uniforms.u_rotation)
            this.uniforms.u_rotation.value.set(0, 0, 0);
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
              if (this.guiManager.gui && this.guiManager.gui.controllersRecursive)
                this.guiManager.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
            } catch (_) {}
          }
          try {
            console.log(
              '[DEC center] offset',
              pos.x.toFixed(2),
              pos.y.toFixed(2),
              pos.z.toFixed(2)
            );
            this.showToast && this.showToast('📌 Centered DEC in view');
          } catch (_) {}
          // Force immediate render
          try {
            if (this.renderer && this.scene && this.camera)
              this.renderer.render(this.scene, this.camera);
          } catch (_) {}
        } catch (e) {
          console.warn('Center DEC failed:', e);
        }
      },
      frameDEC: () => {
        try {
          if (!this.decPreview.enabled) {
            this.decPreview.enabled = true;
            if (this.guiManager.callbacks && this.guiManager.callbacks.onDecPreviewToggle)
              this.guiManager.callbacks.onDecPreviewToggle(true);
          }
          if (this.guiManager && this.guiManager.setFractalType) this.guiManager.setFractalType(7);
          const center =
            this.uniforms && this.uniforms.u_decOffset
              ? this.uniforms.u_decOffset.value
              : new THREE.Vector3(0, 0, 0);
          const dist = 4.0;
          this.camera.position.set(center.x, center.y, center.z + dist);
          this.camera.lookAt(new THREE.Vector3(center.x, center.y, center.z));
          try {
            console.log(
              '[DEC frame] camera->',
              this.camera.position.x.toFixed(2),
              this.camera.position.y.toFixed(2),
              this.camera.position.z.toFixed(2)
            );
            this.showToast && this.showToast('🎥 Framed DEC');
          } catch (_) {}
          // Force immediate render
          try {
            if (this.renderer && this.scene && this.camera)
              this.renderer.render(this.scene, this.camera);
          } catch (_) {}
        } catch (e) {
          console.warn('Frame DEC failed:', e);
        }
      },
      faceCamera: () => {
        // Aim fractal forward (+Z) toward the camera position (yaw only)
        const pos = this.camera.position;
        const yaw = Math.atan2(pos.x, pos.z);
        this.rotation.set(0, yaw, 0);
        if (this.uniforms && this.uniforms.u_rotation)
          this.uniforms.u_rotation.value.set(0, yaw, 0);
      },
      onSpeedChange: (speed) => {
        this.speed = speed;
        try {
          if (this.controls && typeof this.controls.setMovementSpeed === 'function') {
            this.controls.setMovementSpeed(speed);
          } else if (this.controls && 'movementSpeed' in this.controls) {
            this.controls.movementSpeed = speed;
          }
        } catch (_) {}
      },
      onFlyModeToggle: (v) => {
        this.flyMode = !!v;
      },
      onAnimationToggle: (enabled) => {
        this.animationEnabled = enabled;
      },
      onRotationSpeedChange: (axis, speed) => {
        this.rotationSpeed[axis] = speed;
      },
      onBackgroundChange: (color) => {
        this.scene.background = new THREE.Color(color);
      },
      onStatsToggle: (show) => {
        this.stats.dom.style.display = show ? 'block' : 'none';
      },
      onReticleToggle: (show) => {
        if (this.reticle) this.reticle.style.display = show ? 'block' : 'none';
      },
      onDebugOverlayToggle: (show) => {
        if (!this.debugOverlay) return;
        this.debugOverlay.style.display = show ? 'block' : 'none';
      },
      onQualityChange: (quality, maxSteps, iterations) => {
        // Save user's quality preference
        PerformanceTest.saveQuality(quality, maxSteps, iterations);
      },
      onAutoResolutionToggle: (enabled) => {
        this.autoResolutionEnabled = enabled;
        if (!enabled) {
          this.setRenderScale(1.0);
        }
      },
      captureScreenshot: () => this.captureScreenshot(),
      requestShaderRefresh: () => {
        try {
          // Ensure the specialized material for the current type is bound
          this.applyMaterialSpecializationIfNeeded(true);
          // Kick a frame now to reflect changes immediately
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        } catch (_) {}
      },
      setFastDecInject: (on) => {
        this.fastDecInject = !!on;
        // Rebuild DEC mapping using the selected path so next switch is instant
        try {
          this.applyDecMappingAndRebuild();
        } catch (_) {}
      },
      // DEC preview
      onDecPreviewToggle: (enabled) => {
        const was = !!this.decPreview.enabled;
        this.decPreview.enabled = !!enabled;
        try {
          localStorage.setItem('fractalExplorer_decPreviewEnabled', String(!!enabled));
        } catch (_) {}
        // Default DEC color mode = Normal (3); restore when disabled
        try {
          if (this.guiManager && this.guiManager.params) {
            if (this.decPreview.enabled) {
              if (
                this.decPreview.prevColorMode == null &&
                this.uniforms &&
                this.uniforms.u_colorMode
              ) {
                this.decPreview.prevColorMode = this.uniforms.u_colorMode.value | 0;
              }
              this.guiManager.params.colorMode = 3;
              if (this.uniforms.u_colorMode) this.uniforms.u_colorMode.value = 3;
              try {
                if (this.guiManager.gui && this.guiManager.gui.controllersRecursive)
                  this.guiManager.gui
                    .controllersRecursive()
                    .forEach((c) => c.updateDisplay && c.updateDisplay());
              } catch (_) {}
            } else {
              const restoreCM =
                typeof this.decPreview.prevColorMode === 'number'
                  ? this.decPreview.prevColorMode
                  : null;
              if (restoreCM != null) {
                this.guiManager.params.colorMode = restoreCM;
                if (this.uniforms.u_colorMode) this.uniforms.u_colorMode.value = restoreCM;
                this.decPreview.prevColorMode = null;
                try {
                  if (this.guiManager.gui && this.guiManager.gui.controllersRecursive)
                    this.guiManager.gui
                      .controllersRecursive()
                      .forEach((c) => c.updateDisplay && c.updateDisplay());
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
        if (was !== this.decPreview.enabled) {
          this.applyDecMappingAndRebuild();
          // Quick snapshot: switch to DEC on enable; restore previous on disable
          const FT_DEC = 7;
          const current =
            this.uniforms && this.uniforms.u_fractalType
              ? this.uniforms.u_fractalType.value | 0
              : 0;
          if (this.decPreview.enabled) {
            if (this._prevFrTypeForDec == null && current !== FT_DEC)
              this._prevFrTypeForDec = current;
            if (this.guiManager && this.guiManager.setFractalType)
              this.guiManager.setFractalType(FT_DEC);
            else if (this.uniforms && this.uniforms.u_fractalType)
              this.uniforms.u_fractalType.value = FT_DEC;
          } else {
            const restore = typeof this._prevFrTypeForDec === 'number' ? this._prevFrTypeForDec : 0;
            if (this.guiManager && this.guiManager.setFractalType)
              this.guiManager.setFractalType(restore);
            else if (this.uniforms && this.uniforms.u_fractalType)
              this.uniforms.u_fractalType.value = restore;
            this._prevFrTypeForDec = null;
          }
        } else {
          this.applyMaterialSpecializationIfNeeded(true);
        }
      },
      onDecPreviewSelect: (modulePath) => {
        const rel = String(modulePath || '');
        const key = this.resolveDecKey(rel);
        if (!key) {
          console.warn('Unknown DEC include path:', rel);
          this.showToast && this.showToast('DEC: unknown entry');
          return;
        }
        this.decPreview.includePath = key;
        try {
          window.__autoWorldApplied = false;
        } catch (_) {}
        // Always rebuild to keep include map fresh; define gate handles preview state
        this.applyDecMappingAndRebuild();
        try {
          localStorage.setItem('fractalExplorer_decEntry', key);
        } catch (_) {}
        // If World is active and user wants DEC as world, auto-match transforms
        try {
          const isWorld = !!(
            this.uniforms &&
            this.uniforms.u_fractalType &&
            (this.uniforms.u_fractalType.value | 0) === 5
          );
          if (isWorld && typeof window.ensureWorldMatchesDEC === 'function') {
            setTimeout(() => {
              try {
                window.ensureWorldMatchesDEC();
              } catch (_) {}
            }, 0);
          }
        } catch (_) {}
      },
      initialQuality: initialQuality,
      paletteManager: this.paletteManager,
    });

    // Sync all parameters with uniforms first
    this.guiManager.syncAllParams();

    // Ensure debug overlay visibility matches GUI after sync
    if (this.debugOverlay) {
      this.debugOverlay.style.display = this.guiManager.params.showDebugOverlay ? 'block' : 'none';
    }

    // Apply saved quality to GUI if we have one (after sync)
    if (this.savedQuality) {
      // Debug logs removed

      this.guiManager.params.quality = this.savedQuality;
      this.guiManager.params.maxSteps = this.uniforms.u_maxSteps.value;
      this.guiManager.params.iterations = this.uniforms.u_iterations.value;

      // Debug logs removed

      // Force GUI update for all controllers
      this.guiManager.gui.controllers.forEach((controller) => {
        controller.updateDisplay();
      });

      // Debug logs removed
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize(), false);

    // Help overlay toggle (H key or Esc to close)
    document.addEventListener('keydown', (e) => {
      const helpOverlay = document.getElementById('help-overlay');

      if (e.key === 'h' || e.key === 'H') {
        helpOverlay.classList.toggle('visible');
      } else if (e.key === 'Escape' && helpOverlay.classList.contains('visible')) {
        helpOverlay.classList.remove('visible');
      }
    });

    // Show help overlay on first visit
    this.showHelpOnFirstVisit();
  }

  showHelpOnFirstVisit() {
    const hasVisitedKey = 'fractalExplorer_hasVisited';
    const hasVisited = localStorage.getItem(hasVisitedKey);

    if (!hasVisited) {
      // First time visitor - show help after a short delay
      setTimeout(() => {
        const helpOverlay = document.getElementById('help-overlay');
        helpOverlay.classList.add('visible');
        localStorage.setItem(hasVisitedKey, 'true');
      }, 1000); // 1 second delay so they can see the fractal first
    }
  }

  captureScreenshot() {
    // Render one frame to ensure latest state
    this.renderer.render(this.scene, this.camera);

    // Get canvas data
    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

      // Build descriptive filename: fractal, quality preset, color mode
      const fractalMap = {
        0: 'primitives',
        1: 'menger',
        2: 'mandelbulb',
        3: 'sierpinski',
        4: 'mandelbox',
        5: 'world-gyroid',
        6: 'world-truchet',
      };
      const colorMap = {
        0: 'material',
        1: 'orbit',
        2: 'distance',
        3: 'normal',
      };
      const fractal = fractalMap[this.uniforms.u_fractalType.value] || 'unknown';
      const quality =
        this.guiManager && this.guiManager.params && this.guiManager.params.quality
          ? this.guiManager.params.quality
          : 'Unknown';
      const color = colorMap[this.uniforms.u_colorMode.value] || 'unknown';

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

    // Install tuner helpers after GUI exists
    this.addTextureTuner();
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    if (this.rtScene) this.rtScene.setSize(width, height);
    this.updateResolutionUniform();
  }

  async hideLoading() {
    const loading = document.getElementById('loading');

    // Wait a moment to show "Ready!" status
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Start fade-out
    loading.classList.add('hidden');

    // Wait for fade transition to complete (0.8s from CSS)
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  // showPerformanceTestModal removed — auto-benchmark flow handles this.

  applySavedQuality(saved) {
    // Apply saved quality settings without running test
    // Snap to canonical budgets if the saved numbers don't match the label
    const tiers = {
      Low: { maxSteps: 64, iterations: 4 },
      Medium: { maxSteps: 96, iterations: 6 },
      High: { maxSteps: 128, iterations: 8 },
      Ultra: { maxSteps: 200, iterations: 12 },
    };
    const label = saved.quality || 'High';
    const canonical = tiers[label] || tiers.High;
    const ms = typeof saved.maxSteps === 'number' ? saved.maxSteps : canonical.maxSteps;
    const it = typeof saved.iterations === 'number' ? saved.iterations : canonical.iterations;
    const snap = ms !== canonical.maxSteps || it !== canonical.iterations;
    const use = snap ? canonical : { maxSteps: ms, iterations: it };

    this.uniforms.u_maxSteps.value = use.maxSteps;
    this.uniforms.u_iterations.value = use.iterations;
    // Store saved quality so GUI can use it
    this.savedQuality = label;
    if (snap) {
      console.log(
        `✨ Normalized saved quality '${label}' to canonical budgets (${use.maxSteps} steps, ${use.iterations} iterations)`
      );
      // Update storage to keep things tidy
      try {
        PerformanceTest.saveQuality(label, use.maxSteps, use.iterations);
      } catch (_) {}
    } else {
      console.log(
        `✨ Applied saved ${label} quality settings (${use.maxSteps} steps, ${use.iterations} iterations)`
      );
    }
  }

  async runPerformanceTest(skipTest) {
    const tester = new PerformanceTest(this.renderer, this.scene, this.camera, this.material);

    const gpuInfo = tester.getGPUInfo();
    console.log('🖥️ GPU Info:', gpuInfo);

    // Measure using the app's RAF loop (no manual renders in tester)
    const results = await tester.runTest(skipTest);

    // Apply recommended settings
    this.uniforms.u_maxSteps.value = results.maxSteps;
    this.uniforms.u_iterations.value = results.iterations;

    // Store the quality so GUI can sync it
    this.savedQuality = results.quality;

    console.log(
      `✨ Applied ${results.quality} quality settings (${results.maxSteps} steps, ${results.iterations} iterations)`
    );
  }

  updateMovement(delta) {
    // Momentum-based movement: smoothly approach target velocity in camera basis
    // Inputs
    let fAmt = (this.moveForward ? 1 : 0) - (this.moveBackward ? 1 : 0);
    let rAmt = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
    let uAmt = (this.moveUp ? 1 : 0) - (this.moveDown ? 1 : 0);
    const magIn = Math.hypot(fAmt, rAmt, uAmt);
    if (magIn > 0) {
      fAmt /= magIn;
      rAmt /= magIn;
      uAmt /= magIn;
    }

    // Basis
    let forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    let upLocal = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).normalize();
    if (!this.flyMode) {
      // Constrain to yaw plane for grounded mode
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();
      upLocal.set(0, 1, 0);
    }

    // Target velocity in world space
    const speedMultiplier = this.shiftPressed ? 2.0 : 1.0;
    const baseSpeed = this.speed * speedMultiplier;
    const targetVel = new THREE.Vector3();
    targetVel
      .addScaledVector(forward, fAmt * baseSpeed)
      .addScaledVector(right, rAmt * baseSpeed)
      .addScaledVector(upLocal, uAmt * baseSpeed);

    // Smooth towards target
    const accel = 10.0; // higher = snappier
    const lerpA = 1.0 - Math.exp(-accel * delta);
    this.velocity.lerp(targetVel, lerpA);

    // Apply damping when no input
    const damp = 4.0;
    if (magIn === 0) {
      const dampA = Math.exp(-damp * delta);
      this.velocity.multiplyScalar(dampA);
    }

    // Integrate
    const obj =
      this.controls && typeof this.controls.getObject === 'function'
        ? this.controls.getObject()
        : this.camera;
    obj.position.addScaledVector(this.velocity, delta);
  }

  animate() {
    if (this.stats) this.stats.begin();

    const delta = this.clock.getDelta();
    this.time += delta;
    // Update 1-second window FPS
    this._fpsFrameCount += 1;
    const now = performance.now();
    const elapsed = now - this._fpsWindowStart;
    if (elapsed >= 1000) {
      this._fpsInstant = (this._fpsFrameCount * 1000) / elapsed;
      this._fpsWindowStart = now;
      this._fpsFrameCount = 0;
    }

    // Update rotation based on per-axis speeds
    if (this.animationEnabled) {
      this.rotation.x += delta * this.rotationSpeed.x;
      this.rotation.y += delta * this.rotationSpeed.y;
      this.rotation.z += delta * this.rotationSpeed.z;
    }

    // Update movement
    if (this.controls.isLocked) {
      this.updateMovement(delta);
    }

    // Update camera matrix
    this.camera.updateMatrixWorld();

    // Calculate camera target (point camera is looking at)
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const target = new THREE.Vector3();
    target.addVectors(this.camera.position, direction.multiplyScalar(10.0));

    // Update uniforms
    this.uniforms.u_time.value = this.time;
    this.uniforms.u_rotation.value.copy(this.rotation);
    this.uniforms.u_cameraPos.value.copy(this.camera.position);
    this.uniforms.u_cameraTarget.value.copy(target);
    // Push camera basis to shader to avoid any numeric ambiguity
    const rightWS = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const upWS = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).normalize();
    if (this.uniforms.u_camRight) this.uniforms.u_camRight.value.copy(rightWS);
    if (this.uniforms.u_camUp) this.uniforms.u_camUp.value.copy(upWS);

    // Morph animation (parameter cycling)
    try {
      const gp = this.guiManager && this.guiManager.params;
      if (gp && gp.morphEnabled) {
        if (!this._morphBase) {
          this._morphBase = {
            fractalScale: this.uniforms.u_fractalScale ? this.uniforms.u_fractalScale.value : 1.0,
            fractalPower: this.uniforms.u_fractalPower ? this.uniforms.u_fractalPower.value : 8.0,
            worldThickness: this.uniforms.u_worldThickness
              ? this.uniforms.u_worldThickness.value
              : 0.18,
            worldWarp: this.uniforms.u_worldWarp ? this.uniforms.u_worldWarp.value : 0.35,
            worldTile: this.uniforms.u_worldTile ? this.uniforms.u_worldTile.value : 14.0,
            texWarpStrength: this.uniforms.u_texWarpStrength
              ? this.uniforms.u_texWarpStrength.value
              : 0.0,
            truchetRadius: this.uniforms.u_truchetRadius
              ? this.uniforms.u_truchetRadius.value
              : 0.075,
          };
        }
        const TAU = Math.PI * 2.0;
        const phase = this.time * (gp.morphSpeed || 0.15) * TAU;
        const s0 = Math.sin(phase);
        const s1 = Math.sin(phase * 0.777 + 1.1);
        const s2 = Math.sin(phase * 0.618 + 2.3);

        // Fractal scale
        if (this.uniforms.u_fractalScale && gp.morphFractalScaleAmp) {
          const v = this._morphBase.fractalScale + gp.morphFractalScaleAmp * s0;
          this.uniforms.u_fractalScale.value = THREE.MathUtils.clamp(v, 0.2, 3.0);
        }
        // Mandelbulb power (only meaningful on type 2)
        if (
          this.uniforms.u_fractalPower &&
          gp.morphFractalPowerAmp &&
          (this.uniforms.u_fractalType.value | 0) === 2
        ) {
          const v = this._morphBase.fractalPower + gp.morphFractalPowerAmp * s1;
          this.uniforms.u_fractalPower.value = THREE.MathUtils.clamp(v, 2.0, 16.0);
        }
        // World (Amazing Surf) thickness/warp/tile
        if (
          this.uniforms.u_worldThickness &&
          gp.morphWorldThicknessAmp &&
          (this.uniforms.u_fractalType.value | 0) === 5
        ) {
          const v = this._morphBase.worldThickness + gp.morphWorldThicknessAmp * s2;
          this.uniforms.u_worldThickness.value = THREE.MathUtils.clamp(v, 0.02, 0.6);
        }
        if (
          this.uniforms.u_worldWarp &&
          gp.morphWorldWarpAmp &&
          (this.uniforms.u_fractalType.value | 0) === 5
        ) {
          const v = this._morphBase.worldWarp + gp.morphWorldWarpAmp * s1;
          this.uniforms.u_worldWarp.value = THREE.MathUtils.clamp(v, 0.0, 1.0);
        }
        if (
          this.uniforms.u_worldTile &&
          gp.morphWorldTileAmp &&
          (this.uniforms.u_fractalType.value | 0) === 5
        ) {
          const v = this._morphBase.worldTile + gp.morphWorldTileAmp * s0;
          this.uniforms.u_worldTile.value = THREE.MathUtils.clamp(v, 4.0, 40.0);
        }
        // Truchet Pipes radius (type 6)
        if (
          this.uniforms.u_truchetRadius &&
          gp.morphTruchetRadiusAmp &&
          (this.uniforms.u_fractalType.value | 0) === 6
        ) {
          const v = this._morphBase.truchetRadius + gp.morphTruchetRadiusAmp * s0;
          this.uniforms.u_truchetRadius.value = THREE.MathUtils.clamp(v, 0.02, 0.25);
        }
        // Procedural texture warp strength (global)
        if (this.uniforms.u_texWarpStrength && gp.morphTexWarpStrengthAmp) {
          const v = this._morphBase.texWarpStrength + gp.morphTexWarpStrengthAmp * s2;
          this.uniforms.u_texWarpStrength.value = THREE.MathUtils.clamp(v, 0.0, 2.0);
        }
      } else if (this._morphBase) {
        // If user disables morphing, restore base once
        try {
          if (this.uniforms.u_fractalScale)
            this.uniforms.u_fractalScale.value = this._morphBase.fractalScale;
          if (this.uniforms.u_fractalPower)
            this.uniforms.u_fractalPower.value = this._morphBase.fractalPower;
          if (this.uniforms.u_worldThickness)
            this.uniforms.u_worldThickness.value = this._morphBase.worldThickness;
          if (this.uniforms.u_worldWarp)
            this.uniforms.u_worldWarp.value = this._morphBase.worldWarp;
          if (this.uniforms.u_worldTile)
            this.uniforms.u_worldTile.value = this._morphBase.worldTile;
          if (this.uniforms.u_texWarpStrength)
            this.uniforms.u_texWarpStrength.value = this._morphBase.texWarpStrength;
          if (this.uniforms.u_truchetRadius)
            this.uniforms.u_truchetRadius.value = this._morphBase.truchetRadius;
        } catch (_) {}
        this._morphBase = null;
      }
    } catch (_) {}

    // World (Amazing Surf): simple auto integrator (Sphere near, Segment far) with hysteresis
    try {
      const tVal = this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : -1;
      if (
        (tVal === 5 || tVal === 6) &&
        this.guiManager &&
        this.guiManager.params &&
        this.guiManager.params.worldAutoIntegrator
      ) {
        const tile = this.uniforms.u_worldTile
          ? this.uniforms.u_worldTile.value
          : tVal === 5
            ? 16.0
            : 12.0;
        const scl = this.uniforms.u_fractalScale ? this.uniforms.u_fractalScale.value : 1.0;
        const nearTh = tile * scl * 1.4;
        const farTh = tile * scl * 2.0;
        const dist = this.camera.position.length();
        if (this._worldAutoSeg) {
          if (dist < nearTh) this._worldAutoSeg = false;
        } else {
          if (dist > farTh) this._worldAutoSeg = true;
        }
        const wantSegment = this._worldAutoSeg;
        if (
          this.uniforms.u_useSegmentTracing &&
          this.uniforms.u_useSegmentTracing.value !== wantSegment
        ) {
          this.uniforms.u_useSegmentTracing.value = wantSegment;
          // keep auto off for determinism
          if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          // reflect in params (no need to refresh entire GUI each frame)
          this.guiManager.params.useSegmentTracing = wantSegment;
          this.guiManager.params.integratorAuto = false;
        }
      }
    } catch (_) {}

    // Truchet: auto-switch bounds culling mode by camera distance (exterior vs interior)
    try {
      const tVal = this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : -1;
      if (tVal === 6) {
        const tile = this.uniforms.u_worldTile ? this.uniforms.u_worldTile.value : 14.0;
        const scl = this.uniforms.u_fractalScale ? this.uniforms.u_fractalScale.value : 1.0;
        const dist = this.camera.position.length();
        // Hysteresis thresholds: interior when closer than nearTh; exterior when beyond farTh
        const nearTh = tile * scl * 1.8;
        const farTh = tile * scl * 2.6;
        if (this._truchetCullExterior) {
          if (dist < nearTh) this._truchetCullExterior = false;
        } else {
          if (dist > farTh) this._truchetCullExterior = true;
        }
        const wantCull = this._truchetCullExterior;
        const u = this.uniforms;
        if (u.u_enableBoundsCulling && u.u_enableBoundsCulling.value !== wantCull) {
          u.u_enableBoundsCulling.value = wantCull;
          if (this.guiManager && this.guiManager.params)
            this.guiManager.params.enableBoundsCulling = wantCull;
        }
        // Prefer union-style (mode=1) when exterior for slightly tighter bounds; plane-only otherwise
        const wantMode = wantCull ? 1 : 0;
        if (u.u_cullMode && u.u_cullMode.value !== wantMode) {
          u.u_cullMode.value = wantMode;
          if (this.guiManager && this.guiManager.params)
            this.guiManager.params.cullingMode = wantMode;
        }
      }
    } catch (_) {}

    // Removed per-frame palette fallback (updates now handled by GUI events)

    // CPU-side empty-scene skip: if fractal bounds outside frustum AND looking upward
    try {
      const frustum = new THREE.Frustum();
      const projView = new THREE.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      );
      frustum.setFromProjectionMatrix(projView);
      const radius =
        2.2 * (this.uniforms.u_fractalScale ? this.uniforms.u_fractalScale.value : 1.0) + 0.5;
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius);
      const inView = frustum.intersectsSphere(sphere);
      const lookingUp = direction.y > 0.2; // roughly sky
      // Disable CPU skip for Sierpinski and World (type 5) to avoid false negatives
      const tVal = this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : -1;
      const isSierpinski = tVal === 3;
      const isWorld = tVal === 5 || tVal === 6;
      const skip = !isSierpinski && !isWorld && !inView && lookingUp;
      if (this.uniforms.u_skipWhenEmpty) this.uniforms.u_skipWhenEmpty.value = skip;

      // Frustum budget drop (reduce budgets when bound is out of view)
      const dropEnabled = !!(
        this.guiManager &&
        this.guiManager.params &&
        this.guiManager.params.frustumBudgetDropEnabled
      );
      if (dropEnabled) {
        // Capture baselines once
        if (!this._budgetBaseline) {
          this._budgetBaseline = {
            maxSteps: this.uniforms.u_maxSteps.value,
            aoMin: this.uniforms.u_aoMinSamples ? this.uniforms.u_aoMinSamples.value : 3,
            shMin: this.uniforms.u_softShadowMinSteps
              ? this.uniforms.u_softShadowMinSteps.value
              : 16,
          };
        }
        const hysteresis = this.guiManager.params.frustumDropHysteresisFrames || 12;
        if (!inView) {
          this._frustumRestoreFrames = 0;
          this._frustumDropFrames++;
          if (this._frustumDropFrames > hysteresis) this._frustumDropActive = true;
        } else {
          this._frustumDropFrames = 0;
          this._frustumRestoreFrames++;
          if (this._frustumRestoreFrames > hysteresis) this._frustumDropActive = false;
        }
        // Apply/restore only on state changes; don't overwrite user edits otherwise.
        if (this._frustumDropActive && !this._wasFrustumDropActive) {
          const f = this.guiManager.params.frustumBudgetDropFactor || 0.5;
          const minSteps = Math.max(16, Math.floor(this._budgetBaseline.maxSteps * f));
          this.uniforms.u_maxSteps.value = minSteps;
          if (this.uniforms.u_aoMinSamples)
            this.uniforms.u_aoMinSamples.value = this.guiManager.params.frustumBudgetAOMin || 1;
          if (this.uniforms.u_softShadowMinSteps)
            this.uniforms.u_softShadowMinSteps.value =
              this.guiManager.params.frustumBudgetShadowMin || 6;
        }
        if (!this._frustumDropActive && this._wasFrustumDropActive && this._budgetBaseline) {
          // Leaving drop: restore once to baseline
          this.uniforms.u_maxSteps.value = this._budgetBaseline.maxSteps;
          if (this.uniforms.u_aoMinSamples)
            this.uniforms.u_aoMinSamples.value = this._budgetBaseline.aoMin;
          if (this.uniforms.u_softShadowMinSteps)
            this.uniforms.u_softShadowMinSteps.value = this._budgetBaseline.shMin;
        }
        // When not dropping, adopt the current uniforms as the new baseline so
        // manual edits or presets become sticky.
        if (!this._frustumDropActive && this._budgetBaseline) {
          this._budgetBaseline.maxSteps = this.uniforms.u_maxSteps.value;
          if (this.uniforms.u_aoMinSamples)
            this._budgetBaseline.aoMin = this.uniforms.u_aoMinSamples.value;
          if (this.uniforms.u_softShadowMinSteps)
            this._budgetBaseline.shMin = this.uniforms.u_softShadowMinSteps.value;
        }
        this._wasFrustumDropActive = this._frustumDropActive;
      }
    } catch (_) {}

    // Update debug overlay (throttled)
    this.debugOverlayLastUpdate += delta;
    if (this.debugOverlay && this.debugOverlayLastUpdate >= this.debugOverlayInterval) {
      this.debugOverlayLastUpdate = 0;
      const u = this.uniforms;
      const epsLOD = u.u_enableDistanceLOD ? (u.u_enableDistanceLOD.value ? 'On' : 'Off') : 'n/a';
      const budLOD = u.u_enableBudgetLOD ? (u.u_enableBudgetLOD.value ? 'On' : 'Off') : 'n/a';
      const near = u.u_lodNear ? u.u_lodNear.value : 10.0;
      const far = u.u_lodFar ? u.u_lodFar.value : 40.0;
      const maxSteps = u.u_maxSteps ? u.u_maxSteps.value : 128;
      const capFactor = u.u_budgetStepsFarFactor ? u.u_budgetStepsFarFactor.value : 0.6;
      const stepsFar = Math.max(16, Math.floor(maxSteps * capFactor));
      const aoMin = u.u_aoMinSamples ? u.u_aoMinSamples.value : 2;
      const shMin = u.u_softShadowMinSteps ? u.u_softShadowMinSteps.value : 8;
      const skipFactor = u.u_farShadowSkipFactor ? u.u_farShadowSkipFactor.value : 1.5;
      const skipDist = Math.round(far * skipFactor);
      const integratorBase =
        u.u_useSegmentTracing && u.u_useSegmentTracing.value ? 'Segment' : 'Sphere';
      const intAuto = !!(u.u_integratorAuto && u.u_integratorAuto.value);
      const intAutoDist = u.u_integratorSwitchDist ? u.u_integratorSwitchDist.value : 0.0;
      let integrator = integratorBase;
      if (intAuto) {
        integrator = `${integratorBase}+Auto@${intAutoDist.toFixed(1)}`;
      }
      const autoRes = this.autoResolutionEnabled ? 'On' : 'Off';
      // Truchet fast-path indicator
      const tValOverlay = u.u_fractalType ? u.u_fractalType.value | 0 : -1;
      const truFastOn =
        tValOverlay === 6 && (u.u_truchetPortalFast ? !!u.u_truchetPortalFast.value : false);
      const fastLabel = truFastOn ? '  Fast: On' : '';
      let relaxMode = 'Fixed';
      const useDist = !!(u.u_adaptiveRelaxation && u.u_adaptiveRelaxation.value);
      const useCurv = !!(u.u_curvatureAwareRelaxation && u.u_curvatureAwareRelaxation.value);
      if (useDist && useCurv) relaxMode = 'Curv+Dist';
      else if (useDist) relaxMode = 'Dist';
      else if (useCurv) relaxMode = 'Curv';

      const _fpsNow = this._fpsInstant > 0 ? this._fpsInstant.toFixed(0) : 'n/a';
      let stepsLine = `Steps cap: ${maxSteps}\u2192${stepsFar} (x${capFactor.toFixed(2)})`;
      if (this._gpu && this._gpu.ext && this._gpu.lastMs != null) {
        stepsLine += `  GPU: ${this._gpu.lastMs.toFixed(2)} ms`;
      }
      // Safeties quick view
      const consHits = !!(u.u_conservativeHits && u.u_conservativeHits.value);
      const safetyLine = `Safe: CH ${consHits ? 'On' : 'Off'}`;

      // Active preset (if any)
      let presetLine = '';
      try {
        const name = this.guiManager && this.guiManager.params && this.guiManager.params.preset;
        if (name && name !== 'None') presetLine = `Preset: ${name}\n`;
      } catch (_) {}
      // Culling mode and frustum-drop state
      let cullLine = 'Culling: ';
      const cullEnabled = u.u_enableBoundsCulling && u.u_enableBoundsCulling.value ? true : false;
      if (cullEnabled) {
        const mode = u.u_cullMode && u.u_cullMode.value === 1 ? 'Union' : 'Plane';
        cullLine += `On (${mode})`;
      } else {
        cullLine += 'Off';
      }
      const dropLine = `Drop: ${this.guiManager && this.guiManager.params && this.guiManager.params.frustumBudgetDropEnabled ? (this._frustumDropActive ? 'Active' : 'Idle') : 'Off'}`;

      // Current camera info and scale
      const pos = this.camera.position;
      const distance = pos.length();
      const pr = this.renderer.getPixelRatio().toFixed(2);
      const scaleLine = `Scale: ${this.renderScale.toFixed(2)}x (PR ${pr})  FPS=${this._fpsInstant > 0 ? this._fpsInstant.toFixed(0) : 'n/a'}`;

      // Hybrid indicator: if auto is enabled and our last t (from result or prev state) exceeds switch distance, flag it
      const camDistNow = this.camera.position.length();
      const pastSwitch =
        u.u_integratorAuto && u.u_integratorAuto.value && camDistNow > intAutoDist + 0.5;
      const hybridFlag = pastSwitch ? ' (Hybrid)' : '';

      // Ensure key uniforms reflect GUI params (guard against stale values after preset/apply)
      try {
        const isTruchet = u.u_fractalType && (u.u_fractalType.value | 0) === 6;
        if (isTruchet && this.guiManager && this.guiManager.params) {
          const p = this.guiManager.params;
          if (
            u.u_softShadowSteps &&
            typeof p.softShadowSteps === 'number' &&
            u.u_softShadowSteps.value !== p.softShadowSteps
          ) {
            u.u_softShadowSteps.value = p.softShadowSteps;
          }
          if (
            u.u_enableBoundsCulling &&
            typeof p.enableBoundsCulling === 'boolean' &&
            u.u_enableBoundsCulling.value !== !!p.enableBoundsCulling
          ) {
            u.u_enableBoundsCulling.value = !!p.enableBoundsCulling;
          }
        }
      } catch (_) {}

      // Dithering/Shadow/Fog status
      const ditherOn = u.u_enableDithering && u.u_enableDithering.value ? true : false;
      const ditherStr = (u.u_ditheringStrength ? u.u_ditheringStrength.value : 0).toFixed(2);
      const ditherMode = u.u_useBlueNoise && u.u_useBlueNoise.value ? 'Blue' : 'Grid';
      const fogOn = u.u_fogEnabled && u.u_fogEnabled.value ? true : false;
      const fogTypeVal = u.u_fogType ? u.u_fogType.value | 0 : 0;
      const fogTypeLbl = fogTypeVal === 2 ? 'Lin' : fogTypeVal === 1 ? 'Exp2' : 'Exp';
      const fogDither = u.u_ditherFog && u.u_ditherFog.value ? 'On' : 'Off';
      const shDither = (u.u_shadowDitherStrength ? u.u_shadowDitherStrength.value : 0).toFixed(2);

      // Fast shading toggles
      const fastN = u.u_fastNormals && u.u_fastNormals.value ? 'On' : 'Off';
      const fastS = u.u_fastShadows && u.u_fastShadows.value ? 'On' : 'Off';
      const fastAO = u.u_fastAO && u.u_fastAO.value ? 'On' : 'Off';

      // Texture perf toggles
      const texEnabled = u.u_texturesEnabled && u.u_texturesEnabled.value ? true : false;
      const top2 = u.u_texTop2 && u.u_texTop2.value ? 'Y' : 'N';
      const fastB = u.u_texFastBump && u.u_texFastBump.value ? 'Y' : 'N';
      const minW = u.u_texTriMinWeight ? u.u_texTriMinWeight.value : 0.0;
      const hyst = u.u_texTriHyst ? u.u_texTriHyst.value : 0.0;
      const lodAgg = u.u_texDerivAggression ? u.u_texDerivAggression.value : 1.0;
      const bDer = u.u_texBumpDerivFade ? u.u_texBumpDerivFade.value : 0.0;
      const sDer = u.u_texSpecDerivFade ? u.u_texSpecDerivFade.value : 0.0;
      const rK = u.u_texRoughFadeK ? u.u_texRoughFadeK.value : 0.0;

      // Camera Euler rotation (degrees)
      const rot = this.camera.rotation;
      const rx = THREE.MathUtils.radToDeg(rot.x).toFixed(1);
      const ry = THREE.MathUtils.radToDeg(rot.y).toFixed(1);
      const rz = THREE.MathUtils.radToDeg(rot.z).toFixed(1);
      const camLine = `Cam: Pos(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})  Rot(${rx}°, ${ry}°, ${rz}°)  Dist ${distance.toFixed(1)}`;

      // Near/far AO & shadow for context
      const aoNear = u.u_aoMaxSamples ? u.u_aoMaxSamples.value : 4;
      const shNear = u.u_softShadowSteps ? u.u_softShadowSteps.value : 18;

      // Truchet geometry summary (when type 6)
      let truchetLine = '';
      if (tValOverlay === 6) {
        const tile = u.u_worldTile ? u.u_worldTile.value : 14.0;
        const rad = u.u_truchetRadius ? u.u_truchetRadius.value : 0.075;
        const worldR = tile * rad;
        const shapeId = u.u_truchetShape ? u.u_truchetShape.value | 0 : 0;
        const shapeName =
          shapeId === 0
            ? 'round'
            : shapeId === 1
              ? 'square'
              : shapeId === 2
                ? 'rounded'
                : shapeId === 3
                  ? 'oct'
                  : '?';
        const varId = u.u_truchetVariant ? u.u_truchetVariant.value | 0 : 0;
        const varName =
          varId === 0 ? 'dual' : varId === 1 ? 'torus' : varId === 2 ? 'straight' : '?';
        const sm = u.u_truchetSmooth ? !!u.u_truchetSmooth.value : false;
        const sk = u.u_truchetSmoothK ? u.u_truchetSmoothK.value : 0.18;
        truchetLine = `\nTr: tile=${tile.toFixed(1)}  rad=${rad.toFixed(3)} (w=${worldR.toFixed(2)})  shape=${shapeName}  var=${varName}  smooth=${sm ? 'on' : 'off'}${sm ? ` k=${sk.toFixed(2)}` : ''}`;
      }

      // DEC status (only when DEC type)
      let decLine = '';
      try {
        if (u.u_fractalType && (u.u_fractalType.value | 0) === 7) {
          let ds = this.decStatus || { key: '(none)', srcLen: 0, active: false };
          const off = u.u_decOffset ? u.u_decOffset.value : { x: 0, y: 0, z: 0 };
          const sc = u.u_fractalScale ? u.u_fractalScale.value : 1.0;
          // Self-heal: if we appear to be in fallback but have a GUI selection,
          // try to inject immediately and refresh ds.
          if (
            (!ds.active || ds.key === '(none)' || ds.srcLen === 0) &&
            this.guiManager &&
            this.guiManager.params &&
            this.guiManager.params.decEntry
          ) {
            try {
              this.applyDecMappingAndRebuild();
              ds = this.decStatus || ds;
            } catch (_) {}
          }
          const defLbl = ds.defined ? 'inj' : 'stub';
          decLine = `DEC: ${ds.active ? 'Active' : 'Fallback'}  key=${ds.key.split('/').pop()}  len=${ds.srcLen}  def=${defLbl}  off=(${(off.x || 0).toFixed(1)},${(off.y || 0).toFixed(1)},${(off.z || 0).toFixed(1)})  scale=${sc.toFixed(2)}\n`;
        }
      } catch (_) {}

      this.debugOverlay.textContent =
        `${presetLine}` +
        `${decLine}` +
        `Integrator: ${integrator}${hybridFlag}  AutoRes: ${autoRes}  Relax: ${relaxMode}${fastLabel}\n` +
        `LOD: Epsilon=${epsLOD} Budget=${budLOD}  Range:${near}\u2192${far}\n` +
        `${cullLine}   ${dropLine}\n` +
        `${stepsLine}\n` +
        `AO ${aoNear}≥${aoMin}  Shadow ${shNear}≥${shMin}  Skip>${skipDist}\n` +
        `Dither: ${ditherOn ? `On(${ditherStr}, ${ditherMode})` : 'Off'}  Fog:${fogOn ? `On(${fogTypeLbl})` : 'Off'}  FogDith:${fogDither}  ShDith:${shDither}\n` +
        `Fast: Nrm:${fastN} Shad:${fastS} AO:${fastAO}\n` +
        `TexPerf: ${texEnabled ? 'On' : 'Off'}  Top2:${top2} MinW:${minW.toFixed(2)} Hyst:${hyst.toFixed(2)}  FastB:${fastB}  LOD(A:${lodAgg.toFixed(2)} B:${bDer.toFixed(2)} S:${sDer.toFixed(2)} R:${rK.toFixed(2)})\n` +
        `${safetyLine}\n${scaleLine}\n` +
        camLine +
        truchetLine;
      // Camera HUD removed; info mirrored in debug overlay above
    }

    // Auto-apply World←DEC once DEC is injected and World is active
    try {
      const isWorld = !!(
        this.uniforms &&
        this.uniforms.u_fractalType &&
        (this.uniforms.u_fractalType.value | 0) === 5
      );
      if (isWorld && !window.__autoWorldApplied) {
        const ds = this.decStatus || {};
        if (ds && ds.defined && typeof window.worldFromDEC === 'function') {
          window.worldFromDEC();
          window.__autoWorldApplied = true;
          window.__autoWorldFromDEC = false;
        }
      }
    } catch (_) {}

    // Auto resolution scaling
    this.updateAutoResolution(delta);

    // Pass 1: render fractal into offscreen target at its own resolution
    if (this.rtScene) {
      this.uniforms.u_resolution.value.set(this.rtScene.width, this.rtScene.height);
    } else {
      this.updateResolutionUniform();
    }

    // Begin GPU timer query
    this.beginGpuTimer();

    // Render fractal → offscreen → post only when a post effect is active.
    const wantPost = false; // hotfix: force direct render while investigating post/link perf
    if (wantPost) {
      if (this.quad) {
        const t =
          this.uniforms && this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : 0;
        this.quad.material = this.getSpecializedMaterialForType(t);
      }
      this.renderer.setRenderTarget(this.rtScene);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      // Pass 2: post to screen — update resolution to drawing buffer size
      this.updateResolutionUniform();
      if (this.quad) this.quad.material = this.postMaterial;
      if (this.uniforms.u_sceneTex) this.uniforms.u_sceneTex.value = this.rtScene.texture;
      this.renderer.render(this.scene, this.camera);
    } else {
      // Direct render to screen (no post program -> avoids link issues on some drivers)
      if (this.quad) {
        const t =
          this.uniforms && this.uniforms.u_fractalType ? this.uniforms.u_fractalType.value | 0 : 0;
        this.quad.material = this.getSpecializedMaterialForType(t);
      }
      this.renderer.setRenderTarget(null);
      this.updateResolutionUniform();
      this.renderer.render(this.scene, this.camera);
    }

    // End GPU timer query
    this.endGpuTimer();

    if (this.stats) this.stats.end();

    if (this.running) {
      this._rafId = requestAnimationFrame(() => this.animate());
    } else {
      this._rafId = null;
    }
  }

  updateResolutionUniform() {
    // Use drawing buffer size = CSS size * pixel ratio
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const pr = this.renderer.getPixelRatio();
    this.uniforms.u_resolution.value.set(size.x * pr, size.y * pr);
  }

  beginGpuTimer() {
    if (!this._gpu || !this._gpu.ext) return;
    const { gl, ext } = this._gpu;
    if (gl.beginQuery) {
      // If a query is still pending (waiting for result), don't start another
      if (this._gpu.query && !this._gpu.active) return;
      if (this._gpu.active) return; // already begun this frame
      const q = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      this._gpu.query = q;
      this._gpu.active = true;
    } else if (ext.beginQueryEXT) {
      if (this._gpu.query && !this._gpu.active) return;
      if (this._gpu.active) return;
      const q = ext.createQueryEXT();
      ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, q);
      this._gpu.query = q;
      this._gpu.active = true;
    }
  }

  endGpuTimer() {
    if (!this._gpu || !this._gpu.ext || !this._gpu.query) return;
    const { gl, ext } = this._gpu;
    if (gl.endQuery) {
      if (!this._gpu.active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      this._gpu.active = false;
      this.pollGpuTimer();
    } else if (ext.endQueryEXT) {
      if (!this._gpu.active) return;
      ext.endQueryEXT(ext.TIME_ELAPSED_EXT);
      this._gpu.active = false;
      this.pollGpuTimer();
    }
  }

  pollGpuTimer() {
    const g = this._gpu;
    if (!g || !g.query) return;
    try {
      const { gl, ext, query } = g;
      let available = false;
      let disjoint = false;
      if (gl.getQueryParameter) {
        available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
        disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      } else if (ext.getQueryObjectEXT) {
        available = ext.getQueryObjectEXT(query, ext.QUERY_RESULT_AVAILABLE_EXT);
        disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      }
      if (available && !disjoint) {
        const ns = gl.getQueryParameter
          ? gl.getQueryParameter(query, gl.QUERY_RESULT)
          : ext.getQueryObjectEXT(query, ext.QUERY_RESULT_EXT);
        g.lastMs = ns / 1e6;
        if (gl.deleteQuery) gl.deleteQuery(query);
        else if (ext.deleteQueryEXT) ext.deleteQueryEXT(query);
        g.query = null;
      }
    } catch (_) {
      // ignore
    }
  }

  setRenderScale(scale) {
    const clamped = Math.max(0.5, Math.min(1.0, scale));
    if (Math.abs(clamped - this.renderScale) < 0.01) return;
    this.renderScale = clamped;
    this.renderer.setPixelRatio(this.basePixelRatio * this.renderScale);
    // Re-apply size to respect new pixel ratio
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateAutoResolution(delta) {
    if (!this.autoResolutionEnabled) return;
    // FPS EMA
    const fps = delta > 0 ? 1.0 / delta : 60.0;
    this._fpsEma =
      this._fpsEma === 0 ? fps : this._fpsEma * (1 - this._fpsAlpha) + fps * this._fpsAlpha;
    this._framesSinceAdjust++;
    this._framesSinceResChange++;

    if (this._framesSinceAdjust < this._adjustCooldownFrames) return;

    const targetLow = 56; // downscale threshold
    const targetHigh = 62; // upscale threshold
    const step = 0.1;

    // Build sustained conditions with hysteresis
    if (this._fpsEma < targetLow && this.renderScale > 0.5) {
      this._sustainLow++;
      this._sustainHigh = 0;
    } else if (this._fpsEma > targetHigh && this.renderScale < 1.0) {
      this._sustainHigh++;
      this._sustainLow = 0;
    } else {
      this._sustainLow = 0;
      this._sustainHigh = 0;
    }

    // Use GUI-tuned hysteresis if available
    if (this.guiManager && this.guiManager.params) {
      this._minResHold = this.guiManager.params.autoResHoldFrames || this._minResHold;
    }

    const sustainLowNeed =
      this.guiManager && this.guiManager.params && this.guiManager.params.autoResSustainLow
        ? this.guiManager.params.autoResSustainLow
        : 1;
    const sustainHighNeed =
      this.guiManager && this.guiManager.params && this.guiManager.params.autoResSustainHigh
        ? this.guiManager.params.autoResSustainHigh
        : 3;

    // Enforce minimum hold time between changes to avoid oscillation
    if (this._framesSinceResChange >= this._minResHold) {
      const needDown = this._sustainLow >= sustainLowNeed && this.renderScale > 0.5;
      const needUp = this._sustainHigh >= sustainHighNeed && this.renderScale < 1.0; // require sustained high for a bit
      if (needDown) {
        this.setRenderScale(this.renderScale - step);
        this._framesSinceAdjust = 0;
        this._framesSinceResChange = 0;
        this._sustainLow = this._sustainHigh = 0;
      } else if (needUp) {
        this.setRenderScale(this.renderScale + step);
        this._framesSinceAdjust = 0;
        this._framesSinceResChange = 0;
        this._sustainLow = this._sustainHigh = 0;
      }
    }

    // Overlay scale line is updated in the main overlay throttle block
  }

  pauseRendering() {
    this.running = false;
  }

  resumeRendering() {
    if (!this.running) {
      this.running = true;
      if (!this._rafId) {
        this._rafId = requestAnimationFrame(() => this.animate());
      }
    }
  }

  // --- Loading UI integration with shader compilation ---
  installGLCompileHooks() {
    const gl = this.renderer.getContext();
    if (!gl || gl.__fractalHooksInstalled) return;

    const shaderTypeMap = new WeakMap();
    const shaderSourceMap = new WeakMap();
    const self = this;

    // Helpers to update progress within the 45%→60% window
    function updateForStage(pct, msg) {
      // Clamp to the compile window (just a visual guide)
      const clamped = Math.max(45, Math.min(60, pct));
      self.updateLoadingProgress(clamped, msg);
    }

    function nameForType(type) {
      if (type === gl.VERTEX_SHADER) return 'Vertex';
      if (type === gl.FRAGMENT_SHADER) return 'Fragment';
      return 'Unknown';
    }

    const origCreateShader = gl.createShader.bind(gl);
    gl.createShader = function (type) {
      const shader = origCreateShader(type);
      try {
        shaderTypeMap.set(shader, type);
      } catch (_) {}
      return shader;
    };

    // Intercept shaderSource to capture the final strings we send to GL
    const origShaderSource = gl.shaderSource.bind(gl);
    gl.shaderSource = function (shader, source) {
      try {
        shaderSourceMap.set(shader, source);
      } catch (_) {}
      origShaderSource(shader, source);
    };

    const origCompileShader = gl.compileShader.bind(gl);
    gl.compileShader = function (shader) {
      const type = shaderTypeMap.get(shader);
      const stageName = nameForType(type);
      // Nudge progress and status before compile
      updateForStage(type === gl.VERTEX_SHADER ? 48 : 56, `Compiling ${stageName} shader...`);

      origCompileShader(shader);

      const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!ok) {
        const log = gl.getShaderInfoLog(shader) || 'Unknown compile error';
        const src = shaderSourceMap.get(shader) || '[no source captured]';
        const full = [
          `${stageName} shader compile error:`,
          log.trim(),
          '',
          `--- ${stageName} Shader Source ---`,
          src,
          `--- end ${stageName} Shader Source ---`,
        ].join('\n');
        console.error(full);
        updateForStage(50, `${stageName} shader error`);
        self.showShaderError(`${stageName} Shader Compile Error`, full);
      } else {
        updateForStage(type === gl.VERTEX_SHADER ? 52 : 58, `${stageName} shader compiled`);
      }
    };

    const origLinkProgram = gl.linkProgram.bind(gl);
    gl.linkProgram = function (program) {
      updateForStage(59, 'Linking shader program...');
      origLinkProgram(program);
      const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!ok) {
        const linkLog = gl.getProgramInfoLog(program) || 'Unknown link error';
        let full = [`Program link error:`, linkLog.trim(), ''];
        try {
          const shaders = gl.getAttachedShaders(program) || [];
          shaders.forEach((sh) => {
            const t = shaderTypeMap.get(sh);
            const name =
              t === gl.VERTEX_SHADER ? 'Vertex' : t === gl.FRAGMENT_SHADER ? 'Fragment' : 'Unknown';
            const src = shaderSourceMap.get(sh) || '[no source captured]';
            const slog = gl.getShaderInfoLog(sh) || '';
            full.push(`--- ${name} Shader InfoLog ---`);
            full.push(slog.trim());
            full.push('');
            full.push(`--- ${name} Shader Source ---`);
            full.push(src);
            full.push(`--- end ${name} Shader Source ---`);
            full.push('');
          });
        } catch (_) {}
        const fullText = full.join('\n');
        console.error(fullText);
        updateForStage(59, 'Shader link error');
        self.showShaderError('Program Link Error', fullText);
      } else {
        updateForStage(60, 'Shaders compiled ✓');
        // Clear error state and attempt to finish loading if init already completed
        self.hasShaderError = false;
        self.attemptFinishLoading();
        // Do not start animation loop here; wait for init to complete
      }
    };

    gl.__fractalHooksInstalled = true;
  }

  showShaderError(title, log) {
    // Mark error and keep the loading overlay visible/blocking
    this.hasShaderError = true;
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
      this.updateLoadingProgress(58, 'Shader error — check log (Esc to close)');
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

      // Actions (top area)
      const btnStyle =
        'background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;cursor:pointer;font-family:monospace;';
      const actions = document.createElement('div');
      actions.id = 'shader-error-actions';
      actions.style.cssText = 'margin-bottom:10px;display:flex;gap:8px;align-items:center;';
      panel.appendChild(actions);

      // Preformatted log area
      const pre = document.createElement('pre');
      pre.id = 'shader-error-log';
      pre.style.cssText = 'white-space:pre-wrap;line-height:1.4;';
      panel.appendChild(pre);

      // Footer (hint only)
      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top:10px;color:#aaa;display:flex;gap:12px;align-items:center;';
      const hint = document.createElement('span');
      hint.textContent = 'Press Esc to close';
      footer.appendChild(hint);
      panel.appendChild(footer);

      // Helper creators for buttons bound to the current pre element
      const makeCopyInfo = () => {
        const copyBtn = document.createElement('button');
        copyBtn.id = 'shader-copy-infolog';
        copyBtn.textContent = 'Copy InfoLog';
        copyBtn.style.cssText = btnStyle;
        copyBtn.onclick = async () => {
          const text = pre.textContent || '';
          const info = (() => {
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
            if (foundAny) return out.join('\n').trim();
            const out2 = [];
            for (let i = 1; i < lines.length; i++) {
              const l = lines[i];
              if (l.startsWith('--- ')) break;
              out2.push(l);
            }
            return out2.join('\n').trim();
          })();
          const payload = info || text;
          try {
            await navigator.clipboard.writeText(payload);
            copyBtn.textContent = 'Copied!';
            setTimeout(() => (copyBtn.textContent = 'Copy InfoLog'), 1200);
          } catch (_) {}
        };
        return copyBtn;
      };
      const makeCopySrc = () => {
        const copySrcBtn = document.createElement('button');
        copySrcBtn.id = 'shader-copy-sources';
        copySrcBtn.textContent = 'Copy Sources Only';
        copySrcBtn.style.cssText = btnStyle;
        copySrcBtn.onclick = async () => {
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
          const srcOnly = out.join('\n').trim();
          const payload = srcOnly.length ? srcOnly : text;
          try {
            await navigator.clipboard.writeText(payload);
            copySrcBtn.textContent = 'Copied GLSL!';
            setTimeout(() => (copySrcBtn.textContent = 'Copy Sources Only'), 1200);
          } catch (_) {}
        };
        return copySrcBtn;
      };
      actions.appendChild(makeCopyInfo());
      actions.appendChild(makeCopySrc());
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
    // Ensure actions area and buttons exist if panel was created previously
    let actions = panel.querySelector('#shader-error-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'shader-error-actions';
      actions.style.cssText = 'margin-bottom:10px;display:flex;gap:8px;align-items:center;';
      panel.insertBefore(actions, preEl);
    }
    if (!panel.querySelector('#shader-copy-sources')) {
      const btn = document.createElement('button');
      btn.id = 'shader-copy-sources';
      btn.textContent = 'Copy Sources Only';
      btn.style.cssText =
        'background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;cursor:pointer;font-family:monospace;';
      btn.onclick = async () => {
        const text = preEl.textContent || '';
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
        const srcOnly = out.join('\n').trim();
        const payload = srcOnly.length ? srcOnly : text;
        try {
          await navigator.clipboard.writeText(payload);
          btn.textContent = 'Copied GLSL!';
          setTimeout(() => (btn.textContent = 'Copy Sources Only'), 1200);
        } catch (_) {}
      };
      actions.appendChild(btn);
    }
    if (!panel.querySelector('#shader-copy-infolog')) {
      const copyBtn = document.createElement('button');
      copyBtn.id = 'shader-copy-infolog';
      copyBtn.textContent = 'Copy InfoLog';
      copyBtn.style.cssText =
        'background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;cursor:pointer;font-family:monospace;';
      copyBtn.onclick = async () => {
        const text = preEl.textContent || '';
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
        const infoOnly = foundAny ? out.join('\n').trim() : text;
        try {
          await navigator.clipboard.writeText(infoOnly);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => (copyBtn.textContent = 'Copy InfoLog'), 1200);
        } catch (_) {}
      };
      actions.appendChild(copyBtn);
    }
    headerEl.textContent = title;
    preEl.textContent = log;
    panel.style.display = 'block';
  }

  async attemptFinishLoading() {
    // Only hide the loading overlay when init is complete and no shader errors
    if (this.initComplete && !this.hasShaderError) {
      await this.hideLoading();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FractalExplorer();
  });
} else {
  new FractalExplorer();
}
// Removed per-frame dirty flag refresh
