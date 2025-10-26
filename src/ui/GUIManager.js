import GUI from 'lil-gui';
import * as THREE from 'three';
import { getPresetNames, getPreset } from '../config/presets.js';
import { DEFAULTS } from '../config/defaults.js';
import decManifest from '../shaders/includes/dec/manifest.json';
import {
  buildOverrides,
  applyOverrides,
  loadOverridesFromStorage,
  saveOverridesToStorage,
} from '../config/utils.js';

/**
 * GUIManager - lil-gui configuration and state synchronization
 * Phase 7: Complete parameter control interface
 */
export class GUIManager {
  constructor(uniforms, camera, callbacks = {}) {
    this.uniforms = uniforms;
    this.camera = camera;
    this.callbacks = callbacks;

    // Use initial quality from callbacks or default to 'High'
    const initialQuality = callbacks.initialQuality || 'High';

    // Load saved AO preference
    let savedAO = true;
    try {
      const saved = localStorage.getItem('fractalExplorer_aoEnabled');
      if (saved !== null) {
        savedAO = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load AO preference:', e);
    }

    // Load saved soft shadows preference
    let savedSoftShadows = true;
    try {
      const saved = localStorage.getItem('fractalExplorer_softShadowsEnabled');
      if (saved !== null) {
        savedSoftShadows = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load soft shadows preference:', e);
    }

    // Build params from centralized DEFAULTS with ordered grouping
    const fogTypeLabel = (val) =>
      val === 2 ? 'Linear' : val === 1 ? 'Exponential Squared' : 'Exponential';
    this.params = {
      // Fractal
      fractalType: DEFAULTS.fractalType,
      iterations: DEFAULTS.iterations,
      power: DEFAULTS.power,
      scale: DEFAULTS.scale,
      // World (Amazing Surf)
      worldTile: DEFAULTS.worldTile,
      worldThickness: DEFAULTS.worldThickness,
      worldWarp: DEFAULTS.worldWarp,
      worldDeScale: DEFAULTS.worldDeScale,
      worldSegClamp: DEFAULTS.worldSegClamp,
      worldDetailStrength: DEFAULTS.worldDetailStrength,
      worldDetailScale: DEFAULTS.worldDetailScale,
      worldFogAuto: DEFAULTS.worldFogAuto,
      worldAutoIntegrator: DEFAULTS.worldAutoIntegrator,
      worldTexType: DEFAULTS.worldTexType,
      worldTexScale: DEFAULTS.worldTexScale,
      worldTexColorStrength: DEFAULTS.worldTexColorStrength,
      worldTexBumpStrength: DEFAULTS.worldTexBumpStrength,
      worldTexSpecStrength: DEFAULTS.worldTexSpecStrength,
      // Texture B + blend
      worldTexTypeB: DEFAULTS.worldTexTypeB,
      worldTexScaleB: DEFAULTS.worldTexScaleB,
      worldTexColorStrengthB: DEFAULTS.worldTexColorStrengthB,
      worldTexBumpStrengthB: DEFAULTS.worldTexBumpStrengthB,
      worldTexSpecStrengthB: DEFAULTS.worldTexSpecStrengthB,
      worldTexBlendMode: DEFAULTS.worldTexBlendMode,
      worldTexBlendAlphaColor: DEFAULTS.worldTexBlendAlphaColor,
      worldTexBlendAlphaBump: DEFAULTS.worldTexBlendAlphaBump,
      worldTexBlendAlphaSpec: DEFAULTS.worldTexBlendAlphaSpec,
      // FBM/AA/Truchet
      worldFbmOctaves: DEFAULTS.worldFbmOctaves,
      worldFbmLacunarity: DEFAULTS.worldFbmLacunarity,
      worldFbmGain: DEFAULTS.worldFbmGain,
      worldFbmSeed: DEFAULTS.worldFbmSeed,
      worldTexAAStrength: DEFAULTS.worldTexAAStrength,
      worldTexAutoAtten: DEFAULTS.worldTexAutoAtten,
      // Scale link (A→B)
      texScaleLinkEnabled: DEFAULTS.texScaleLinkEnabled,
      texScaleLinkK: DEFAULTS.texScaleLinkK,
      // Strength links (A→B)
      texColorLinkEnabled: DEFAULTS.texColorLinkEnabled,
      texColorLinkK: DEFAULTS.texColorLinkK,
      texBumpLinkEnabled: DEFAULTS.texBumpLinkEnabled,
      texBumpLinkK: DEFAULTS.texBumpLinkK,
      texSpecLinkEnabled: DEFAULTS.texSpecLinkEnabled,
      texSpecLinkK: DEFAULTS.texSpecLinkK,
      // Texture warp (global)
      texWarpStrength: DEFAULTS.texWarpStrength,
      texWarpScale: DEFAULTS.texWarpScale,
      texWarpOctaves: DEFAULTS.texWarpOctaves,
      texWarpType: DEFAULTS.texWarpType,
      // Texture perf toggles
      texTop2: DEFAULTS.texTop2,
      texFastBump: DEFAULTS.texFastBump,
      texTriMinWeight: DEFAULTS.texTriMinWeight,
      texTriHyst: DEFAULTS.texTriHyst,
      textureQuality: DEFAULTS.textureQuality,
      // Texture anisotropy
      texAnisoFactor: DEFAULTS.texAnisoFactor,
      texAnisoAxis: DEFAULTS.texAnisoAxis,
      // Texture color mapping
      texColorBase: DEFAULTS.texColorBase,
      texColorAccent: DEFAULTS.texColorAccent,
      texLayerColoring: DEFAULTS.texLayerColoring,
      texAColorBase: DEFAULTS.texAColorBase,
      texAColorAccent: DEFAULTS.texAColorAccent,
      texBColorBase: DEFAULTS.texBColorBase,
      texBColorAccent: DEFAULTS.texBColorAccent,
      // Texture LOD
      texLODEnabled: DEFAULTS.texLODEnabled,
      texDerivOctDrop: DEFAULTS.texDerivOctDrop,
      texDerivMinOct: DEFAULTS.texDerivMinOct,
      texWarpOctDrop: DEFAULTS.texWarpOctDrop,
      texLODBumpFactor: DEFAULTS.texLODBumpFactor,
      texLODSpecFactor: DEFAULTS.texLODSpecFactor,
      // Optional distance fade for bump/spec
      texFadeNear: DEFAULTS.texFadeNear,
      texFadeFar: DEFAULTS.texFadeFar,
      worldTruchetRotate: DEFAULTS.worldTruchetRotate,
      worldTruchetWidth: DEFAULTS.worldTruchetWidth,
      worldTruchetDensity: DEFAULTS.worldTruchetDensity,
      // Truchet Pipes (World)
      truchetRadius: DEFAULTS.truchetRadius ?? 0.07,
      truchetShape: DEFAULTS.truchetShape ?? 3,
      truchetVariant: DEFAULTS.truchetVariant ?? 0,
      truchetSmooth: DEFAULTS.truchetSmooth === true,
      truchetSmoothK: DEFAULTS.truchetSmoothK ?? 0.18,
      truchetSleeveScale: DEFAULTS.truchetSleeveScale ?? 1.0,
      truchetLipScale: DEFAULTS.truchetLipScale ?? 1.0,
      truchetMirrorJoins: DEFAULTS.truchetMirrorJoins !== false,
      truchetJoinRing: !!DEFAULTS.truchetJoinRing,
      truchetJoinRingK: DEFAULTS.truchetJoinRingK ?? 1.0,
      // Hex Truchet advanced
      hexFoldFreq: DEFAULTS.hexFoldFreq,
      hexContrast: DEFAULTS.hexContrast,
      applyProceduralTextures: DEFAULTS.applyProceduralTextures,
      textureApplyTarget: DEFAULTS.textureApplyTarget,
      floorTextureMode: DEFAULTS.floorTextureMode,
      floorIgnoreWarp: DEFAULTS.floorIgnoreWarp,
      floorBumpScale: DEFAULTS.floorBumpScale,
      floorSpecScale: DEFAULTS.floorSpecScale,
      floorTexDisableDist: DEFAULTS.floorTexDisableDist,
      floorTexAutoDisable: DEFAULTS.floorTexAutoDisable,
      floorTexAutoMul: DEFAULTS.floorTexAutoMul,
      floorFadeNear: DEFAULTS.floorFadeNear,
      floorFadeFar: DEFAULTS.floorFadeFar,

      // Animation
      animateRotation: DEFAULTS.animateRotation,
      rotationSpeedX: DEFAULTS.rotationSpeedX,
      rotationSpeedY: DEFAULTS.rotationSpeedY,
      rotationSpeedZ: DEFAULTS.rotationSpeedZ,

      // Camera
      movementSpeed: DEFAULTS.movementSpeed,
      fov: DEFAULTS.fov,
      reticleEnabled: DEFAULTS.reticleEnabled,
      flyMode: DEFAULTS.flyMode,
      resetCamera: () => {
        if (callbacks.resetCamera) callbacks.resetCamera();
      },

      // Lighting
      lightPosX: DEFAULTS.lightPosX,
      lightPosY: DEFAULTS.lightPosY,
      lightPosZ: DEFAULTS.lightPosZ,
      lightColor: DEFAULTS.lightColor,
      ambientStrength: DEFAULTS.ambientStrength,
      diffuseStrength: DEFAULTS.diffuseStrength,
      specularStrength: DEFAULTS.specularStrength,
      shininess: DEFAULTS.shininess,

      // Environment
      fogEnabled: DEFAULTS.fogEnabled,
      fogType: fogTypeLabel(DEFAULTS.fogType),
      fogDensity: DEFAULTS.fogDensity,
      fogNear: DEFAULTS.fogNear,
      fogFar: DEFAULTS.fogFar,
      fogColor: '#1a1a26',
      backgroundColor: DEFAULTS.backgroundColor,
      // Post Processing (global)
      postExposure: DEFAULTS.postExposure,
      postContrast: DEFAULTS.postContrast,
      postSaturation: DEFAULTS.postSaturation,
      postGamma: DEFAULTS.postGamma,
      vignetteStrength: DEFAULTS.vignetteStrength,
      vignetteSoftness: DEFAULTS.vignetteSoftness,
      toneMapper: DEFAULTS.toneMapper,
      // Morph animation
      morphEnabled: DEFAULTS.morphEnabled,
      morphSpeed: DEFAULTS.morphSpeed,
      morphFractalScaleAmp: DEFAULTS.morphFractalScaleAmp,
      morphFractalPowerAmp: DEFAULTS.morphFractalPowerAmp,
      morphWorldThicknessAmp: DEFAULTS.morphWorldThicknessAmp,
      morphWorldWarpAmp: DEFAULTS.morphWorldWarpAmp,
      morphWorldTileAmp: DEFAULTS.morphWorldTileAmp,
      morphTexWarpStrengthAmp: DEFAULTS.morphTexWarpStrengthAmp,
      morphTruchetRadiusAmp: DEFAULTS.morphTruchetRadiusAmp,
      floorEnabled: DEFAULTS.floorEnabled,
      floorColorA: DEFAULTS.floorColorA,
      floorColorB: DEFAULTS.floorColorB,

      // Performance (core)
      maxSteps: DEFAULTS.maxSteps,
      stepRelaxation: DEFAULTS.stepRelaxation,

      // Integrator & normals
      useSegmentTracing: DEFAULTS.useSegmentTracing,
      segmentFraction: DEFAULTS.segmentFraction,
      useAnalyticNormals: DEFAULTS.useAnalyticNormals,
      integratorAuto: DEFAULTS.integratorAuto,
      integratorSwitchDist: DEFAULTS.integratorSwitchDist,

      // Advanced
      adaptiveRelaxation: DEFAULTS.adaptiveRelaxation,
      relaxationMin: DEFAULTS.relaxationMin,
      relaxationMax: DEFAULTS.relaxationMax,
      enableDithering: DEFAULTS.enableDithering,
      ditheringStrength: DEFAULTS.ditheringStrength,
      useBlueNoise: DEFAULTS.useBlueNoise,
      blueNoiseScale: DEFAULTS.blueNoiseScale,
      blueNoiseTemporalJitter: DEFAULTS.blueNoiseTemporalJitter,
      ditherFog: DEFAULTS.ditherFog,
      enableBoundsCulling: DEFAULTS.enableBoundsCulling,
      boundsCullMargin: DEFAULTS.boundsCullMargin,
      cullingMode: DEFAULTS.cullingMode,
      frustumBudgetDropEnabled: DEFAULTS.frustumBudgetDropEnabled,
      frustumBudgetDropFactor: DEFAULTS.frustumBudgetDropFactor,
      frustumBudgetAOMin: DEFAULTS.frustumBudgetAOMin,
      frustumBudgetShadowMin: DEFAULTS.frustumBudgetShadowMin,
      frustumDropHysteresisFrames: DEFAULTS.frustumDropHysteresisFrames,
      enableDistanceLOD: DEFAULTS.enableDistanceLOD,
      enableBudgetLOD: DEFAULTS.enableBudgetLOD,
      lodNear: DEFAULTS.lodNear,
      lodFar: DEFAULTS.lodFar,
      budgetStepsFarFactor: DEFAULTS.budgetStepsFarFactor,
      farShadowSkipFactor: DEFAULTS.farShadowSkipFactor,
      aoMinSamples: DEFAULTS.aoMinSamples,
      softShadowMinSteps: DEFAULTS.softShadowMinSteps,
      curvatureAwareRelaxation: DEFAULTS.curvatureAwareRelaxation,
      curvatureNearOnly: DEFAULTS.curvatureNearOnly,
      curvatureNearK: DEFAULTS.curvatureNearK,

      // Safeties
      stepSafety: DEFAULTS.stepSafety,
      stepSafetyAuto: DEFAULTS.stepSafetyAuto,
      stepSafetyMin: DEFAULTS.stepSafetyMin,
      stepSafetyMax: DEFAULTS.stepSafetyMax,
      stepSafetyBandNear: DEFAULTS.stepSafetyBandNear,
      stepSafetyBandFar: DEFAULTS.stepSafetyBandFar,
      ringSafeClamp: DEFAULTS.ringSafeClamp,
      ringSafeClampMax: DEFAULTS.ringSafeClampMax,
      conservativeHits: DEFAULTS.conservativeHits,

      // Core toggles
      quality: initialQuality,
      showStats: true,
      budgetPreset: 'Quality',
      budgetEstimate: '',
      showDebugOverlay: false,
      autoResolutionEnabled: false,
      autoResHoldFrames: DEFAULTS.autoResHoldFrames,
      autoResSustainLow: DEFAULTS.autoResSustainLow,
      autoResSustainHigh: DEFAULTS.autoResSustainHigh,

      // AO/Soft Shadows
      aoEnabled: DEFAULTS.aoEnabled ?? true,
      softShadowsEnabled: DEFAULTS.softShadowsEnabled ?? true,
      softShadowSteps: DEFAULTS.softShadowMinSteps,
      shadowSharpness: DEFAULTS.shadowSharpness,

      // Normals
      normalEpsilon: DEFAULTS.normalEpsilon,

      // Color System
      colorMode: DEFAULTS.colorMode,
      palette: DEFAULTS.palette,
      colorIntensity: DEFAULTS.colorIntensity,
      orbitTrapScale: DEFAULTS.orbitTrapScale,
      materialColor: DEFAULTS.materialColor,

      // Debug
      debugEnabled: DEFAULTS.debugEnabled,
      debugMode: DEFAULTS.debugMode,
      dbgBypassSierpinskiAlign: DEFAULTS.dbgBypassSierpinskiAlign,
      dbgBypassFractalRotation: DEFAULTS.dbgBypassFractalRotation,
      sierpinskiBase: DEFAULTS.sierpinskiBase,

      // Presets
      preset: 'None',
      // Texture perf params (Phase A+B)
      // (deduped: texTop2/texFastBump/texTri* already defined above)
      texDerivAggression: DEFAULTS.texDerivAggression,
      texBumpDerivFade: DEFAULTS.texBumpDerivFade,
      texSpecDerivFade: DEFAULTS.texSpecDerivFade,
      texRoughFadeK: DEFAULTS.texRoughFadeK,
      // DEC Preview (off by default)
      decPreviewEnabled: false,
      decEntry: '',
      // Icosahedron mapping toggle (only relevant for Icosahedron entries)
      icoUseIQ: DEFAULTS.icoUseIQ,
    };

    // Track last built-in palette to support quick reset from custom
    this._lastBuiltInPaletteId =
      typeof DEFAULTS.palette === 'number' && DEFAULTS.palette >= 0 ? DEFAULTS.palette : 0;

    // Overlay centralized DEFAULTS onto initial params so GUI mirrors single source of truth
    Object.keys(DEFAULTS).forEach((k) => {
      if (k in this.params) this.params[k] = DEFAULTS[k];
    });

    // Load minimal overrides (non-default settings) from storage and apply
    const storedOverrides = loadOverridesFromStorage();
    if (storedOverrides) {
      applyOverrides(this.params, storedOverrides, DEFAULTS);
    }
    // Track if specific keys were explicitly overridden by the user
    this._useSegOverridden = !!(
      storedOverrides && Object.prototype.hasOwnProperty.call(storedOverrides, 'useSegmentTracing')
    );
    this._relaxMinOverridden = !!(
      storedOverrides && Object.prototype.hasOwnProperty.call(storedOverrides, 'relaxationMin')
    );
    this._curvOverridden = !!(
      storedOverrides &&
      Object.prototype.hasOwnProperty.call(storedOverrides, 'curvatureAwareRelaxation')
    );
    this._iterationsOverridden = !!(
      storedOverrides && Object.prototype.hasOwnProperty.call(storedOverrides, 'iterations')
    );
    this._texSpaceOverridden = !!(
      storedOverrides && Object.prototype.hasOwnProperty.call(storedOverrides, 'texSpaceMode')
    );
    this._moveSpeedOverridden = !!(
      storedOverrides && Object.prototype.hasOwnProperty.call(storedOverrides, 'movementSpeed')
    );

    // Back-compat for separately-stored AO/Soft Shadow flags
    if (storedOverrides == null || storedOverrides.aoEnabled === undefined) {
      this.params.aoEnabled = savedAO;
    }
    if (storedOverrides == null || storedOverrides.softShadowsEnabled === undefined) {
      this.params.softShadowsEnabled = savedSoftShadows;
    }

    // Defaults source for resets
    this._defaults = DEFAULTS;

    // Push initial AO/Shadow flags to uniforms from params
    if (uniforms.u_aoEnabled) uniforms.u_aoEnabled.value = this.params.aoEnabled;
    if (uniforms.u_softShadowsEnabled)
      uniforms.u_softShadowsEnabled.value = this.params.softShadowsEnabled;

    this.gui = new GUI({ title: 'PAR Fractal Explorer', width: 300 });
    // Anchor GUI flush-right: remove default margin and pin to right:0
    try {
      const el = this.gui.domElement;
      el.style.position = 'fixed';
      el.style.top = '0px';
      el.style.right = '0px';
      el.style.left = 'auto';
      el.style.marginRight = '0px';
      // Append into our fixed container to ensure stacking above canvas
      const container = document.getElementById('gui-container');
      if (container && el.parentElement !== container) {
        container.appendChild(el);
      }
    } catch (_) {}
    // Prepare info overlay/dictionary before building controls so addInfo() has data
    this.initInfoOverlay();
    this.setupFolders();

    // Persist folder open/close states
    this.initFolderPersistence();

    // Ensure uniforms and GUI reflect any overrides applied before GUI creation
    this.syncAllUniforms();
    if (this.gui && this.gui.controllersRecursive) {
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
    }
    this.attachPersistHooks();

    // Apply per-fractal integrator defaults (e.g., Mandelbulb → segment tracing) if
    // the user hasn't explicitly overridden the choice.
    this.applyPerFractalDefaults('init');

    // Ensure info buttons are present after initial render
    setTimeout(() => this.ensureAllInfoButtons(), 0);

    // Defensive: ensure any legacy dev buttons are removed if present in DOM
    // (e.g., "View Saved Quality", "Clear & Re-test"). These were used during
    // development but should not appear in production.
    setTimeout(() => {
      try {
        const labelsToRemove = ['View Saved Quality', 'Clear & Re-test'];
        const root = document.querySelector('.lil-gui');
        if (!root) return;
        // Search for any elements in the GUI whose text matches target labels
        const nodes = root.querySelectorAll('*');
        nodes.forEach((node) => {
          const text = (node.textContent || '').trim();
          if (labelsToRemove.includes(text)) {
            // Remove the row/controller element
            const row = node.closest('.controller, .cr, li');
            if (row && row.parentElement) {
              row.parentElement.removeChild(row);
            } else {
              // Fallback: hide the node
              node.style.display = 'none';
            }
          }
        });
      } catch (e) {
        // Non-fatal if DOM structure changes
        console.warn('GUI cleanup skipped:', e);
      }
    }, 0);

    // Apply saved preset selection (UI state) and optionally preset values
    try {
      const savedPreset = localStorage.getItem('fractalExplorer_visualPreset');
      if (savedPreset && savedPreset !== 'None') {
        // Reflect in UI selector
        this.params.preset = savedPreset;
        if (this.gui && this.gui.controllersRecursive)
          this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
        const hasOverrides = !!loadOverridesFromStorage();
        if (!hasOverrides) {
          this.applyPreset(savedPreset);
          if (this.refreshFolderPersistenceStates) this.refreshFolderPersistenceStates();
        } else {
          // Deterministic startup for World presets (5/6): apply preset even when overrides exist,
          // then let overrides win through normal persistence afterward as the user changes values.
          const p = getPreset(savedPreset);
          const isWorldPreset = !!(p && (p.fractalType === 5 || p.fractalType === 6));
          if (isWorldPreset) {
            this.applyPreset(savedPreset);
            if (this.refreshFolderPersistenceStates) this.refreshFolderPersistenceStates();
          }
        }
        if ((this.params.fractalType | 0) === 4) {
          // Mandelbox: Segment by default; reduce far budgets if not tuned
          if (this.params.useSegmentTracing !== true) {
            this.params.useSegmentTracing = true;
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = true;
          }
          if (this.params.integratorAuto !== false) {
            this.params.integratorAuto = false;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          }
          if (this.params.segmentFraction === DEFAULTS.segmentFraction) {
            this.params.segmentFraction = 0.6;
            if (this.uniforms.u_segmentFraction) this.uniforms.u_segmentFraction.value = 0.6;
          }
          if (this.params.enableBudgetLOD !== true) {
            this.params.enableBudgetLOD = true;
            if (this.uniforms.u_enableBudgetLOD) this.uniforms.u_enableBudgetLOD.value = true;
          }
          if (this.params.budgetStepsFarFactor === DEFAULTS.budgetStepsFarFactor) {
            this.params.budgetStepsFarFactor = 0.6;
            if (this.uniforms.u_budgetStepsFarFactor)
              this.uniforms.u_budgetStepsFarFactor.value = 0.6;
          }
          if (this.params.aoMinSamples === DEFAULTS.aoMinSamples) {
            this.params.aoMinSamples = 1;
            if (this.uniforms.u_aoMinSamples) this.uniforms.u_aoMinSamples.value = 1;
          }
          if (this.params.softShadowMinSteps === DEFAULTS.softShadowMinSteps) {
            this.params.softShadowMinSteps = 6;
            if (this.uniforms.u_softShadowMinSteps) this.uniforms.u_softShadowMinSteps.value = 6;
          }
          if (this.params.farShadowSkipFactor === DEFAULTS.farShadowSkipFactor) {
            this.params.farShadowSkipFactor = 3.0;
            if (this.uniforms.u_farShadowSkipFactor)
              this.uniforms.u_farShadowSkipFactor.value = 3.0;
          }
          // If user hasn't decided on AO/SS yet, default them off for Mandelbox speed
          if (
            !('aoEnabled' in (this._defaults || {})) ||
            this._defaults.aoEnabled === this.params.aoEnabled
          ) {
            this.params.aoEnabled = false;
            if (this.uniforms.u_aoEnabled) this.uniforms.u_aoEnabled.value = false;
          }
          if (
            !('softShadowsEnabled' in (this._defaults || {})) ||
            this._defaults.softShadowsEnabled === this.params.softShadowsEnabled
          ) {
            this.params.softShadowsEnabled = false;
            if (this.uniforms.u_softShadowsEnabled)
              this.uniforms.u_softShadowsEnabled.value = false;
          }
        }
      }
    } catch (_) {}
  }
  importLUT() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg';
      input.style.display = 'none';
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.needsUpdate = true;
          // Infer LUT size from height (strip layout has height = size)
          const size = Math.max(2, img.height | 0);
          if (this.uniforms.u_lutTex) this.uniforms.u_lutTex.value = tex;
          if (this.uniforms.u_lutSize) this.uniforms.u_lutSize.value = size;
          this.params.lutEnabled = true;
          if (this.uniforms.u_lutEnabled) this.uniforms.u_lutEnabled.value = true;
          // Persist overrides for enabled/intensity
          this.schedulePersist();
        };
        img.src = URL.createObjectURL(file);
      });
      document.body.appendChild(input);
      input.click();
      setTimeout(() => {
        try {
          document.body.removeChild(input);
        } catch (_) {}
      }, 0);
    } catch (e) {
      console.warn('LUT import failed:', e);
    }
  }

  // Apply a quick texture preset (affects only Texture params)
  applyTexturePreset(kind) {
    const p = this.params;
    switch (kind) {
      case 'floor_perf':
        Object.assign(p, {
          // Ensure textures are active and applied to both
          applyProceduralTextures: true,
          textureApplyTarget: 2, // Both
          // Fast floor path
          floorTextureMode: 0, // Fast (2D)
          floorIgnoreWarp: true,
          floorBumpScale: 0.45,
          floorSpecScale: 0.6,
          // Floor LOD: auto disable beyond LOD Far × k
          floorTexAutoDisable: true,
          floorTexAutoMul: 1.35,
          floorTexDisableDist: 0.0,
          floorFadeNear: 0.0,
          floorFadeFar: 0.0,
          // Helpful AA for extreme floor scales
          worldTexAAStrength: Math.max(0.7, p.worldTexAAStrength || 0.0),
        });
        break;
      case 'floor_quality':
        Object.assign(p, {
          // Ensure textures are active and applied to both
          applyProceduralTextures: true,
          textureApplyTarget: 2, // Both
          // Full-quality floor path
          floorTextureMode: 1, // Full (Triplanar)
          floorIgnoreWarp: false,
          floorBumpScale: 1.0,
          floorSpecScale: 1.0,
          // Disable floor-only LOD so textures always render on floor
          floorTexAutoDisable: false,
          floorTexDisableDist: 0.0,
          floorFadeNear: 0.0,
          floorFadeFar: 0.0,
        });
        break;
      case 'hextruchet':
        Object.assign(p, {
          // Primary layer: Hex Truchet
          worldTexType: 4,
          worldTexScale: 9.0,
          worldTexColorStrength: 0.22,
          worldTexBumpStrength: 0.38,
          worldTexSpecStrength: 0.5,
          // Secondary layer: subtle FBM toning
          worldTexTypeB: 1,
          worldTexScaleB: 6.0,
          worldTexColorStrengthB: 0.1,
          worldTexBumpStrengthB: 0.18,
          worldTexSpecStrengthB: 0.25,
          worldTexBlendMode: 0,
          worldTexBlendAlphaColor: 0.45,
          worldTexBlendAlphaBump: 0.45,
          worldTexBlendAlphaSpec: 0.45,
          // AA + seed
          worldFbmOctaves: 5,
          worldFbmLacunarity: 2.0,
          worldFbmGain: 0.52,
          worldFbmSeed: 7.0,
          worldTexAAStrength: 0.75,
          worldTexAutoAtten: true,
          // Truchet (square) settings kept neutral since type 4 ignores them
          worldTruchetRotate: true,
          worldTruchetWidth: 0.12,
          worldTruchetDensity: 1.0,
          // Hex advanced
          hexFoldFreq: 1.1,
          hexContrast: 1.35,
          hexSeed: 11.0,
          // New: a touch of smooth warp and brushed anisotropy for richer glints
          texWarpStrength: 0.2,
          texWarpScale: 4.0,
          texWarpOctaves: 2,
          texWarpType: 1,
          texAnisoFactor: 1.35,
          texAnisoAxis: 0,
          // Keep color mapping global for gold look
          texLayerColoring: false,
        });
        break;
      case 'rock':
        Object.assign(p, {
          worldTexType: 1,
          worldTexScale: 4.2,
          worldTexColorStrength: 0.28,
          worldTexBumpStrength: 0.55,
          worldTexSpecStrength: 0.1,
          worldTexTypeB: 2,
          worldTexScaleB: 6.5,
          worldTexColorStrengthB: 0.12,
          worldTexBumpStrengthB: 0.25,
          worldTexSpecStrengthB: 0.06,
          worldTexBlendMode: 1,
          worldTexBlendAlphaColor: 0.5,
          worldTexBlendAlphaBump: 0.5,
          worldTexBlendAlphaSpec: 0.5,
          worldFbmOctaves: 5,
          worldFbmLacunarity: 2.1,
          worldFbmGain: 0.52,
          worldFbmSeed: 12.0,
          worldTexAAStrength: 0.7,
          worldTexAutoAtten: true,
          worldTruchetRotate: true,
          worldTruchetWidth: 0.18,
          worldTruchetDensity: 1.0,
          // New: gentle warp and slight anisotropy for bedding
          texWarpStrength: 0.18,
          texWarpScale: 3.0,
          texWarpOctaves: 2,
          texWarpType: 1,
          texAnisoFactor: 0.85,
          texAnisoAxis: 1,
          texLayerColoring: false,
          // Links
          texScaleLinkEnabled: true,
          texScaleLinkK: 6.5 / 4.2,
          texColorLinkEnabled: true,
          texColorLinkK: 0.12 / 0.28,
          texBumpLinkEnabled: true,
          texBumpLinkK: 0.25 / 0.55,
          texSpecLinkEnabled: true,
          texSpecLinkK: 0.06 / 0.1,
        });
        break;
      case 'rock_warped':
        Object.assign(p, {
          // Layer A: FBM base strata
          worldTexType: 1,
          worldTexScale: 4.5,
          worldTexColorStrength: 0.22,
          worldTexBumpStrength: 0.5,
          worldTexSpecStrength: 0.12,
          // Layer B: value noise grain
          worldTexTypeB: 2,
          worldTexScaleB: 7.0,
          worldTexColorStrengthB: 0.12,
          worldTexBumpStrengthB: 0.25,
          worldTexSpecStrengthB: 0.08,
          // Multiply blend for aggregate look
          worldTexBlendMode: 1,
          worldTexBlendAlphaColor: 0.5,
          worldTexBlendAlphaBump: 0.5,
          worldTexBlendAlphaSpec: 0.5,
          // FBM stack
          worldFbmOctaves: 5,
          worldFbmLacunarity: 2.1,
          worldFbmGain: 0.54,
          worldFbmSeed: 9.0,
          // AA & attenuation
          worldTexAAStrength: 0.75,
          worldTexAutoAtten: true,
          // Domain warp: smooth turbulence
          texWarpStrength: 0.35,
          texWarpScale: 3.2,
          texWarpOctaves: 3,
          texWarpType: 1,
          // Anisotropy: compress along Y to align sedimentary layers
          texAnisoFactor: 0.7,
          texAnisoAxis: 1,
          // Neutral Truchet params
          worldTruchetRotate: true,
          worldTruchetWidth: 0.16,
          worldTruchetDensity: 1.0,
          // Links
          texScaleLinkEnabled: true,
          texScaleLinkK: 7.0 / 4.5,
          texColorLinkEnabled: true,
          texColorLinkK: 0.12 / 0.22,
          texBumpLinkEnabled: true,
          texBumpLinkK: 0.25 / 0.5,
          texSpecLinkEnabled: true,
          texSpecLinkK: 0.08 / 0.12,
        });
        break;
      case 'marble':
        Object.assign(p, {
          // Base FBM veins + Truchet banding as subtle filler
          worldTexType: 1,
          worldTexScale: 2.0,
          worldTexColorStrength: 0.28,
          worldTexBumpStrength: 0.4,
          worldTexSpecStrength: 0.28,
          worldTexTypeB: 3,
          worldTexScaleB: 1.4,
          worldTexColorStrengthB: 0.16,
          worldTexBumpStrengthB: 0.18,
          worldTexSpecStrengthB: 0.12,
          worldTexBlendMode: 0,
          worldTexBlendAlphaColor: 0.4,
          worldTexBlendAlphaBump: 0.45,
          worldTexBlendAlphaSpec: 0.4,
          // FBM stack
          worldFbmOctaves: 6,
          worldFbmLacunarity: 2.0,
          worldFbmGain: 0.5,
          worldFbmSeed: -5.0,
          // AA
          worldTexAAStrength: 0.6,
          worldTexAutoAtten: true,
          // Truchet params used by layer B (subtle)
          worldTruchetRotate: true,
          worldTruchetWidth: 0.1,
          worldTruchetDensity: 0.9,
          // Domain warp for natural marble curvature
          texWarpStrength: 0.45,
          texWarpScale: 2.6,
          texWarpOctaves: 3,
          texWarpType: 2,
          texAnisoFactor: 0.35,
          texAnisoAxis: 1,
          // Per-layer colors for richer marble
          texLayerColoring: true,
          texAColorBase: '#d8d4cc',
          texAColorAccent: '#2e2c2a',
          texBColorBase: '#eeeae2',
          texBColorAccent: '#60564e',
          // Links
          texScaleLinkEnabled: true,
          texScaleLinkK: 1.4 / 2.0,
          texColorLinkEnabled: true,
          texColorLinkK: 0.16 / 0.28,
          texBumpLinkEnabled: true,
          texBumpLinkK: 0.18 / 0.4,
          texSpecLinkEnabled: true,
          texSpecLinkK: 0.12 / 0.28,
        });
        break;
      case 'cloud':
        Object.assign(p, {
          worldTexType: 1,
          worldTexScale: 1.0,
          worldTexColorStrength: 0.26,
          worldTexBumpStrength: 0.0,
          worldTexSpecStrength: 0.0,
          worldTexTypeB: 2,
          worldTexScaleB: 1.5,
          worldTexColorStrengthB: 0.18,
          worldTexBumpStrengthB: 0.0,
          worldTexSpecStrengthB: 0.0,
          worldTexBlendMode: 0,
          worldTexBlendAlphaColor: 0.6,
          worldTexBlendAlphaBump: 0.5,
          worldTexBlendAlphaSpec: 0.5,
          worldFbmOctaves: 5,
          worldFbmLacunarity: 1.9,
          worldFbmGain: 0.58,
          worldFbmSeed: 7.0,
          worldTexAAStrength: 0.8,
          worldTexAutoAtten: true,
          worldTruchetRotate: false,
          worldTruchetWidth: 0.2,
          worldTruchetDensity: 0.6,
          // New: smooth warp, no anisotropy for soft puffs
          texWarpStrength: 0.28,
          texWarpScale: 1.8,
          texWarpOctaves: 2,
          texWarpType: 1,
          texAnisoFactor: 1.0,
          texAnisoAxis: 1,
          texLayerColoring: false,
        });
        break;
      case 'metal':
        Object.assign(p, {
          worldTexType: 3,
          worldTexScale: 3.0,
          worldTexColorStrength: 0.12,
          worldTexBumpStrength: 0.28,
          worldTexSpecStrength: 0.5,
          worldTexTypeB: 1,
          worldTexScaleB: 8.0,
          worldTexColorStrengthB: 0.06,
          worldTexBumpStrengthB: 0.18,
          worldTexSpecStrengthB: 0.3,
          worldTexBlendMode: 1,
          worldTexBlendAlphaColor: 0.35,
          worldTexBlendAlphaBump: 0.35,
          worldTexBlendAlphaSpec: 0.35,
          worldFbmOctaves: 4,
          worldFbmLacunarity: 2.3,
          worldFbmGain: 0.55,
          worldFbmSeed: 21.0,
          worldTexAAStrength: 0.7,
          worldTexAutoAtten: true,
          worldTruchetRotate: true,
          worldTruchetWidth: 0.12,
          worldTruchetDensity: 1.4,
          // New: brushed anisotropy and subtle warp
          texWarpStrength: 0.12,
          texWarpScale: 6.0,
          texWarpOctaves: 1,
          texWarpType: 1,
          texAnisoFactor: 1.5,
          texAnisoAxis: 0,
          // Optional per-layer tint (kept off by default)
          texLayerColoring: false,
        });
        break;
      case 'slate':
        Object.assign(p, {
          // Layer A: FBM plates/cleavage
          worldTexType: 1,
          worldTexScale: 2.8,
          worldTexColorStrength: 0.22,
          worldTexBumpStrength: 0.45,
          worldTexSpecStrength: 0.18,
          // Layer B: fine noise speckle
          worldTexTypeB: 2,
          worldTexScaleB: 10.0,
          worldTexColorStrengthB: 0.08,
          worldTexBumpStrengthB: 0.12,
          worldTexSpecStrengthB: 0.08,
          // Blend
          worldTexBlendMode: 0,
          worldTexBlendAlphaColor: 0.4,
          worldTexBlendAlphaBump: 0.45,
          worldTexBlendAlphaSpec: 0.4,
          // FBM stack
          worldFbmOctaves: 6,
          worldFbmLacunarity: 2.0,
          worldFbmGain: 0.5,
          worldFbmSeed: 5.0,
          worldTexAAStrength: 0.7,
          worldTexAutoAtten: true,
          // Warp: ridged for crisp fissures; slight Y anisotropy for layering
          texWarpStrength: 0.5,
          texWarpScale: 3.0,
          texWarpOctaves: 3,
          texWarpType: 2,
          texAnisoFactor: 0.6,
          texAnisoAxis: 1,
          // Per‑layer colors (used when Color Mode = Texture)
          texLayerColoring: true,
          texAColorBase: '#3a3e45',
          texAColorAccent: '#d3d5d7',
          texBColorBase: '#2c3036',
          texBColorAccent: '#7a7f87',
          // Links
          texScaleLinkEnabled: true,
          texScaleLinkK: 10.0 / 2.8,
          texColorLinkEnabled: true,
          texColorLinkK: 0.08 / 0.22,
          texBumpLinkEnabled: true,
          texBumpLinkK: 0.12 / 0.45,
          texSpecLinkEnabled: true,
          texSpecLinkK: 0.08 / 0.18,
        });
        break;
      case 'rust':
        Object.assign(p, {
          // Corroded metal: coarse noise + FBM patches
          worldTexType: 2,
          worldTexScale: 5.0,
          worldTexColorStrength: 0.22,
          worldTexBumpStrength: 0.35,
          worldTexSpecStrength: 0.1,
          worldTexTypeB: 1,
          worldTexScaleB: 3.0,
          worldTexColorStrengthB: 0.2,
          worldTexBumpStrengthB: 0.3,
          worldTexSpecStrengthB: 0.15,
          // Add blend lifts oxidation spots; mix alphas still affect bump/spec
          worldTexBlendMode: 2,
          worldTexBlendAlphaColor: 0.5,
          worldTexBlendAlphaBump: 0.5,
          worldTexBlendAlphaSpec: 0.45,
          worldFbmOctaves: 5,
          worldFbmLacunarity: 2.2,
          worldFbmGain: 0.54,
          worldFbmSeed: 17.0,
          worldTexAAStrength: 0.75,
          worldTexAutoAtten: true,
          // Warp: smooth turbulence; no anisotropy
          texWarpStrength: 0.32,
          texWarpScale: 2.4,
          texWarpOctaves: 3,
          texWarpType: 1,
          texAnisoFactor: 1.0,
          texAnisoAxis: 1,
          // Per‑layer colors for oxide vs base metal (Texture mode)
          texLayerColoring: true,
          texAColorBase: '#6b4a2e',
          texAColorAccent: '#2e1c12',
          texBColorBase: '#725d1e',
          texBColorAccent: '#a35d2a',
          // Links
          texScaleLinkEnabled: true,
          texScaleLinkK: 3.0 / 5.0,
          texColorLinkEnabled: true,
          texColorLinkK: 0.2 / 0.22,
          texBumpLinkEnabled: true,
          texBumpLinkK: 0.3 / 0.35,
          texSpecLinkEnabled: true,
          texSpecLinkK: 0.15 / 0.1,
        });
        break;
      default:
        // none: disable both layers
        Object.assign(p, {
          worldTexType: 0,
          worldTexColorStrength: 0.0,
          worldTexBumpStrength: 0.0,
          worldTexSpecStrength: 0.0,
          worldTexTypeB: 0,
          worldTexColorStrengthB: 0.0,
          worldTexBumpStrengthB: 0.0,
          worldTexSpecStrengthB: 0.0,
          // Reset new globals
          texWarpStrength: 0.0,
          texWarpScale: 2.0,
          texWarpOctaves: 3,
          texWarpType: 0,
          texAnisoFactor: 1.0,
          texAnisoAxis: 1,
          texLayerColoring: false,
        });
    }
    // Enforce link-derived B values when links are enabled
    try {
      if (p.texScaleLinkEnabled) {
        p.worldTexScaleB = (p.worldTexScale || 1.0) * (p.texScaleLinkK || 1.0);
      }
      if (p.texColorLinkEnabled) {
        p.worldTexColorStrengthB = (p.worldTexColorStrength || 0.0) * (p.texColorLinkK || 1.0);
      }
      if (p.texBumpLinkEnabled) {
        p.worldTexBumpStrengthB = (p.worldTexBumpStrength || 0.0) * (p.texBumpLinkK || 1.0);
      }
      if (p.texSpecLinkEnabled) {
        p.worldTexSpecStrengthB = (p.worldTexSpecStrength || 0.0) * (p.texSpecLinkK || 1.0);
      }
    } catch (_) {}
    // Push to uniforms and refresh controllers
    this.syncAllUniforms();
    if (this.gui && this.gui.controllersRecursive)
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
    this.schedulePersist();
  }

  // Macro preset for texture performance dials
  applyTextureQuality(kind) {
    const p = this.params;
    const set = (obj) => {
      Object.assign(p, obj);
      // Push immediately to uniforms when present
      if (this.uniforms.u_texTop2 && obj.texTop2 !== undefined)
        this.uniforms.u_texTop2.value = !!obj.texTop2;
      if (this.uniforms.u_texFastBump && obj.texFastBump !== undefined)
        this.uniforms.u_texFastBump.value = !!obj.texFastBump;
      if (this.uniforms.u_texTriMinWeight && obj.texTriMinWeight !== undefined)
        this.uniforms.u_texTriMinWeight.value = obj.texTriMinWeight;
      if (this.uniforms.u_texTriHyst && obj.texTriHyst !== undefined)
        this.uniforms.u_texTriHyst.value = obj.texTriHyst;
      if (this.uniforms.u_texLODEnabled && obj.texLODEnabled !== undefined)
        this.uniforms.u_texLODEnabled.value = !!obj.texLODEnabled;
      if (this.uniforms.u_texDerivAggression && obj.texDerivAggression !== undefined)
        this.uniforms.u_texDerivAggression.value = obj.texDerivAggression;
      if (this.uniforms.u_texBumpDerivFade && obj.texBumpDerivFade !== undefined)
        this.uniforms.u_texBumpDerivFade.value = obj.texBumpDerivFade;
      if (this.uniforms.u_texSpecDerivFade && obj.texSpecDerivFade !== undefined)
        this.uniforms.u_texSpecDerivFade.value = obj.texSpecDerivFade;
      if (this.uniforms.u_texRoughFadeK && obj.texRoughFadeK !== undefined)
        this.uniforms.u_texRoughFadeK.value = obj.texRoughFadeK;
      if (this.uniforms.u_texLODBumpFactor && obj.texLODBumpFactor !== undefined)
        this.uniforms.u_texLODBumpFactor.value = obj.texLODBumpFactor;
      if (this.uniforms.u_texLODSpecFactor && obj.texLODSpecFactor !== undefined)
        this.uniforms.u_texLODSpecFactor.value = obj.texLODSpecFactor;
    };
    switch (kind) {
      case 'Performance':
        set({
          texTop2: true,
          texTriMinWeight: 0.15,
          texTriHyst: 0.02,
          texFastBump: true,
          texLODEnabled: true,
          texDerivAggression: 1.35,
          texBumpDerivFade: 0.85,
          texSpecDerivFade: 0.75,
          texRoughFadeK: 0.0,
          texLODBumpFactor: Math.max(0.4, this.params.texLODBumpFactor || 0.4),
          texLODSpecFactor: Math.max(0.5, this.params.texLODSpecFactor || 0.5),
        });
        break;
      case 'Crisp':
        set({
          texTop2: false,
          texTriMinWeight: 0.08,
          texTriHyst: 0.0,
          texFastBump: false,
          texLODEnabled: true,
          texDerivAggression: 1.15,
          texBumpDerivFade: 0.7,
          texSpecDerivFade: 0.6,
          texRoughFadeK: 0.0,
          texLODBumpFactor: 0.85,
          texLODSpecFactor: 0.9,
        });
        break;
      default: // Balanced
        set({
          texTop2: true,
          texTriMinWeight: 0.12,
          texTriHyst: 0.01,
          texFastBump: true,
          texLODEnabled: true,
          texDerivAggression: 1.25,
          texBumpDerivFade: 0.8,
          texSpecDerivFade: 0.65,
          texRoughFadeK: 0.0,
          texLODBumpFactor: 0.65,
          texLODSpecFactor: 0.75,
        });
        break;
    }
    // Update GUI display without clobbering open states
    if (this.gui && this.gui.controllersRecursive) {
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
    }
    this.schedulePersist();
  }

  /**
   * Apply a visual preset configuration
   */
  applyPreset(presetName) {
    const preset = getPreset(presetName);
    if (!preset) return;
    // Record the active preset name for overlay/reporting
    try {
      this.params.preset = presetName;
    } catch (_) {}

    // Apply all preset values to params
    Object.keys(preset).forEach((key) => {
      if (key === 'camera') return; // Handle camera separately
      if (Object.prototype.hasOwnProperty.call(this.params, key)) {
        this.params[key] = preset[key];
      }
    });

    // Note explicit overrides from the preset BEFORE changing fractal type,
    // so per‑fractal defaults (applied by setFractalType → applyPerFractalDefaults)
    // will not stomp user/preset intent.
    try {
      if (Object.prototype.hasOwnProperty.call(preset, 'conservativeHits'))
        this._consHitsOverridden = true;
      if (Object.prototype.hasOwnProperty.call(preset, 'enableBudgetLOD'))
        this._budgetLODOverridden = true;
      if (Object.prototype.hasOwnProperty.call(preset, 'movementSpeed'))
        this._moveSpeedOverridden = true;
      if (Object.prototype.hasOwnProperty.call(preset, 'floorEnabled'))
        this._floorOverridden = true;
    } catch (_) {}

    // If this is our profiling preset, ensure the intended Texture Quality
    try {
      if (presetName === 'Test Settings') {
        // Force Balanced texture mapping to avoid stale UI overrides
        this.applyTextureQuality('Balanced');
      }
    } catch (_) {}

    // Apply fractal type early if provided so uniforms/UI stay in sync
    try {
      if (typeof preset.fractalType === 'number' && this.setFractalType) {
        this.setFractalType(preset.fractalType | 0);
      }
    } catch (_) {}

    // DEC preview wiring: apply entry/toggle if present in preset
    try {
      // Track explicit overrides so per-fractal defaults won't flip them later
      if (Object.prototype.hasOwnProperty.call(preset, 'conservativeHits'))
        this._consHitsOverridden = true;
      if (Object.prototype.hasOwnProperty.call(preset, 'enableBudgetLOD'))
        this._budgetLODOverridden = true;
      if (Object.prototype.hasOwnProperty.call(preset, 'movementSpeed'))
        this._moveSpeedOverridden = true;
      if (typeof preset.decEntry === 'string' && preset.decEntry.length) {
        this.params.decEntry = preset.decEntry;
        if (this.callbacks && this.callbacks.onDecPreviewSelect)
          this.callbacks.onDecPreviewSelect(preset.decEntry);
        try {
          localStorage.setItem('fractalExplorer_decEntry', String(preset.decEntry));
        } catch (_) {}
      }
      if (typeof preset.decPreviewEnabled === 'boolean') {
        this.params.decPreviewEnabled = !!preset.decPreviewEnabled;
        if (this.callbacks && this.callbacks.onDecPreviewToggle)
          this.callbacks.onDecPreviewToggle(!!preset.decPreviewEnabled);
        try {
          localStorage.setItem(
            'fractalExplorer_decPreviewEnabled',
            String(!!preset.decPreviewEnabled)
          );
        } catch (_) {}
      }
    } catch (_) {}

    // Push key uniforms immediately so overlay/uniforms don't lag behind params
    try {
      if (this.uniforms) {
        if (this.uniforms.u_floorEnabled && typeof this.params.floorEnabled === 'boolean') {
          this.uniforms.u_floorEnabled.value = !!this.params.floorEnabled;
        }
        if (this.uniforms.u_worldUseDEC && typeof this.params.worldUseDEC === 'boolean') {
          this.uniforms.u_worldUseDEC.value = !!this.params.worldUseDEC;
        }
        if (this.uniforms.u_softShadowSteps && typeof this.params.softShadowSteps === 'number') {
          this.uniforms.u_softShadowSteps.value = this.params.softShadowSteps;
        }
        if (
          this.uniforms.u_softShadowMinSteps &&
          typeof this.params.softShadowMinSteps === 'number'
        ) {
          this.uniforms.u_softShadowMinSteps.value = this.params.softShadowMinSteps;
        }
        if (
          this.uniforms.u_budgetStepsFarFactor &&
          typeof this.params.budgetStepsFarFactor === 'number'
        ) {
          this.uniforms.u_budgetStepsFarFactor.value = this.params.budgetStepsFarFactor;
        }
        if (
          this.uniforms.u_farShadowSkipFactor &&
          typeof this.params.farShadowSkipFactor === 'number'
        ) {
          this.uniforms.u_farShadowSkipFactor.value = this.params.farShadowSkipFactor;
        }
        if (
          this.uniforms.u_enableBoundsCulling &&
          typeof this.params.enableBoundsCulling === 'boolean'
        ) {
          this.uniforms.u_enableBoundsCulling.value = !!this.params.enableBoundsCulling;
        }
        if (this.uniforms.u_conservativeHits && typeof this.params.conservativeHits === 'boolean') {
          this.uniforms.u_conservativeHits.value = !!this.params.conservativeHits;
        }
        if (
          this.uniforms.u_truchetPortalFast !== undefined &&
          this.uniforms.u_truchetPortalFast &&
          typeof this.params.truchetPortalFast === 'boolean'
        ) {
          this.uniforms.u_truchetPortalFast.value = !!this.params.truchetPortalFast;
        }
        // Fast shading toggles from preset
        if (this.uniforms.u_fastNormals && typeof this.params.fastNormals === 'boolean') {
          this.uniforms.u_fastNormals.value = !!this.params.fastNormals;
        }
        if (this.uniforms.u_fastShadows && typeof this.params.fastShadows === 'boolean') {
          this.uniforms.u_fastShadows.value = !!this.params.fastShadows;
        }
        if (this.uniforms.u_fastAO && typeof this.params.fastAO === 'boolean') {
          this.uniforms.u_fastAO.value = !!this.params.fastAO;
        }
        if (this.uniforms.u_shadowEarlyExit && typeof this.params.shadowEarlyExit === 'number') {
          this.uniforms.u_shadowEarlyExit.value = this.params.shadowEarlyExit;
        }
        if (this.uniforms.u_shadowStepClamp && typeof this.params.shadowStepClamp === 'number') {
          this.uniforms.u_shadowStepClamp.value = this.params.shadowStepClamp;
        }
        // Texture perf/LOD uniforms (explicit push to avoid stale state)
        if (this.uniforms.u_texLODEnabled && typeof this.params.texLODEnabled !== 'undefined')
          this.uniforms.u_texLODEnabled.value = !!this.params.texLODEnabled;
        if (this.uniforms.u_texTop2 && typeof this.params.texTop2 !== 'undefined')
          this.uniforms.u_texTop2.value = !!this.params.texTop2;
        if (this.uniforms.u_texFastBump && typeof this.params.texFastBump !== 'undefined')
          this.uniforms.u_texFastBump.value = !!this.params.texFastBump;
        if (this.uniforms.u_texTriMinWeight && typeof this.params.texTriMinWeight === 'number')
          this.uniforms.u_texTriMinWeight.value = this.params.texTriMinWeight;
        if (this.uniforms.u_texTriHyst && typeof this.params.texTriHyst === 'number')
          this.uniforms.u_texTriHyst.value = this.params.texTriHyst;
        if (
          this.uniforms.u_texDerivAggression &&
          typeof this.params.texDerivAggression === 'number'
        )
          this.uniforms.u_texDerivAggression.value = this.params.texDerivAggression;
        if (this.uniforms.u_texBumpDerivFade && typeof this.params.texBumpDerivFade === 'number')
          this.uniforms.u_texBumpDerivFade.value = this.params.texBumpDerivFade;
        if (this.uniforms.u_texSpecDerivFade && typeof this.params.texSpecDerivFade === 'number')
          this.uniforms.u_texSpecDerivFade.value = this.params.texSpecDerivFade;
        if (this.uniforms.u_texRoughFadeK && typeof this.params.texRoughFadeK === 'number')
          this.uniforms.u_texRoughFadeK.value = this.params.texRoughFadeK;
        if (this.uniforms.u_texLODBumpFactor && typeof this.params.texLODBumpFactor === 'number')
          this.uniforms.u_texLODBumpFactor.value = this.params.texLODBumpFactor;
        if (this.uniforms.u_texLODSpecFactor && typeof this.params.texLODSpecFactor === 'number')
          this.uniforms.u_texLODSpecFactor.value = this.params.texLODSpecFactor;
        // Camera speed (non-uniform): apply via callback so movement updates immediately
        try {
          if (this.callbacks.onSpeedChange && typeof this.params.movementSpeed === 'number')
            this.callbacks.onSpeedChange(this.params.movementSpeed);
        } catch (_) {}
      }
    } catch (_) {}

    // Persist overrides immediately so startup auto-load picks up preset speed (and other flags)
    try {
      this.persistOverrides();
    } catch (_) {}

    // If the preset intends to render the DEC surface in World mode, run the
    // helper to mirror DEC transforms and disable shell/warp/textures so it
    // matches DEC visually without extra manual steps.
    try {
      if (this.params.fractalType === 5) {
        // Ask main to wait for DEC injection and then mirror transforms
        if (typeof window.ensureWorldMatchesDEC === 'function') {
          window.__autoWorldFromDEC = true;
          setTimeout(() => {
            try {
              window.ensureWorldMatchesDEC();
            } catch (_) {}
          }, 0);
        } else if (typeof window.worldFromDEC === 'function') {
          setTimeout(() => {
            try {
              window.worldFromDEC();
            } catch (_) {}
          }, 0);
        }
      }
    } catch (_) {}

    // Belt-and-suspenders: re-push on next tick in case any late clamps ran
    try {
      setTimeout(() => {
        try {
          if (this.uniforms.u_softShadowSteps && typeof this.params.softShadowSteps === 'number') {
            this.uniforms.u_softShadowSteps.value = this.params.softShadowSteps;
          }
          // Also re-apply camera speed in case any later defaults bumped it
          if (
            this.callbacks &&
            this.callbacks.onSpeedChange &&
            typeof this.params.movementSpeed === 'number'
          ) {
            try {
              this.callbacks.onSpeedChange(this.params.movementSpeed);
            } catch (_) {}
          }
        } catch (_) {}
      }, 0);
    } catch (_) {}

    // World-specific toggles (apply regardless of integrator overrides)
    try {
      const type = this.params.fractalType | 0;
      if (type === 5 || type === 6) {
        if (this.params.flyMode !== true) {
          this.params.flyMode = true;
          if (this.callbacks && this.callbacks.onFlyModeToggle)
            this.callbacks.onFlyModeToggle(true);
        }
        // World presets should disable auto rotate for steadier navigation
        if (this.params.animateRotation !== false) {
          this.params.animateRotation = false;
          if (this.callbacks && this.callbacks.onAnimationToggle)
            this.callbacks.onAnimationToggle(false);
        }
        // Apply auto fog if enabled
        this.applyWorldFogAuto();
      }
    } catch (_) {}

    // Update all GUI controllers
    this.gui.controllersRecursive().forEach((controller) => {
      controller.updateDisplay();
    });

    // Handle optional custom palette reference in presets
    try {
      const mgr = this.callbacks && this.callbacks.paletteManager;
      if (mgr) {
        if (preset.paletteCustomName || preset.paletteCustom) {
          // Switch to custom palette mode
          this.params.palette = -1;
          if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = -1;
          if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 1;
          if (preset.paletteCustomName) {
            mgr.setCurrent(String(preset.paletteCustomName));
          }
          if (preset.paletteCustom) {
            // Ensure it exists by importing (JSON style object)
            const data = JSON.stringify(preset.paletteCustom);
            try {
              mgr.importPaletteFromJSON(data);
            } catch (_) {}
          }
          mgr.packToUniforms(this.uniforms);
        }
      }
    } catch (_) {}

    // Ensure fog uniforms reflect params (presets may change them)
    try {
      if (this.uniforms.u_fogEnabled) this.uniforms.u_fogEnabled.value = !!this.params.fogEnabled;
      if (this.uniforms.u_fogType) {
        let ft = this.params.fogType;
        if (typeof ft === 'string') {
          ft = ft === 'Linear' ? 2 : ft === 'Exponential Squared' ? 1 : 0;
        }
        this.uniforms.u_fogType.value = ft | 0;
      }
      if (this.uniforms.u_fogDensity && typeof this.params.fogDensity === 'number')
        this.uniforms.u_fogDensity.value = this.params.fogDensity;
      if (this.uniforms.u_fogNear && typeof this.params.fogNear === 'number')
        this.uniforms.u_fogNear.value = this.params.fogNear;
      if (this.uniforms.u_fogFar && typeof this.params.fogFar === 'number')
        this.uniforms.u_fogFar.value = this.params.fogFar;
      if (this.uniforms.u_fogColor && this.params.fogColor) {
        const fc = new THREE.Color(this.params.fogColor);
        this.uniforms.u_fogColor.value.copy(fc);
      }
    } catch (_) {}

    // Sync uniforms
    this.syncAllUniforms();

    // Persist fractal type if preset changed it
    try {
      if (typeof this.params.fractalType === 'number') {
        localStorage.setItem('fractalExplorer_fractalType', String(this.params.fractalType));
      }
      // Persist selected preset name for UI state
      localStorage.setItem('fractalExplorer_visualPreset', String(presetName));
    } catch (_) {}

    // Apply camera if specified
    if (preset.camera && this.camera) {
      const { position, rotation } = preset.camera;
      if (position) {
        this.camera.position.set(position.x, position.y, position.z);
      }
      if (rotation) {
        this.camera.rotation.set(rotation.x, rotation.y, rotation.z);
      }
    }

    // If preset did not explicitly choose integrator, apply per-fractal default
    const presetOverridesIntegrator = Object.prototype.hasOwnProperty.call(
      preset,
      'useSegmentTracing'
    );
    if (!presetOverridesIntegrator) {
      this.applyPerFractalDefaults('preset');
    }

    // Force-apply explicit preset overrides that can be stomped by per‑fractal defaults
    try {
      if (Object.prototype.hasOwnProperty.call(preset, 'movementSpeed')) {
        this._moveSpeedOverridden = true;
        if (this.callbacks && this.callbacks.onSpeedChange) {
          this.callbacks.onSpeedChange(this.params.movementSpeed);
        }
      }
      if (Object.prototype.hasOwnProperty.call(preset, 'floorEnabled')) {
        if (this.uniforms.u_floorEnabled)
          this.uniforms.u_floorEnabled.value = !!this.params.floorEnabled;
      }
    } catch (_) {}

    // Re-apply saved folder open states so preset changes don't collapse UI
    if (this.refreshFolderPersistenceStates) this.refreshFolderPersistenceStates();

    // Persist minimal overrides after applying preset
    this.schedulePersist();
  }

  /**
   * Sync all uniforms with current param values
   */
  syncAllUniforms() {
    // Fractal
    if (this.uniforms.u_fractalType) this.uniforms.u_fractalType.value = this.params.fractalType;
    if (this.uniforms.u_iterations) this.uniforms.u_iterations.value = this.params.iterations;
    if (this.uniforms.u_fractalPower) this.uniforms.u_fractalPower.value = this.params.power;
    if (this.uniforms.u_fractalScale) this.uniforms.u_fractalScale.value = this.params.scale;

    // Lighting
    if (this.uniforms.u_lightPos) {
      this.uniforms.u_lightPos.value.set(
        this.params.lightPosX,
        this.params.lightPosY,
        this.params.lightPosZ
      );
    }
    if (this.uniforms.u_ambientStrength)
      this.uniforms.u_ambientStrength.value = this.params.ambientStrength;
    if (this.uniforms.u_diffuseStrength)
      this.uniforms.u_diffuseStrength.value = this.params.diffuseStrength;
    if (this.uniforms.u_specularStrength)
      this.uniforms.u_specularStrength.value = this.params.specularStrength;
    if (this.uniforms.u_shininess) this.uniforms.u_shininess.value = this.params.shininess;
    if (this.uniforms.u_lightColor) {
      const lc = new THREE.Color(this.params.lightColor || '#ffffff');
      this.uniforms.u_lightColor.value.copy(lc);
    }
    if (this.uniforms.u_tintDiffuse) this.uniforms.u_tintDiffuse.value = !!this.params.tintDiffuse;
    if (this.uniforms.u_aoMaxSamples)
      this.uniforms.u_aoMaxSamples.value = this.params.aoMaxSamples | 0 || 4;
    if (this.uniforms.u_shadowEarlyExit)
      this.uniforms.u_shadowEarlyExit.value = this.params.shadowEarlyExit || 0.0;
    if (this.uniforms.u_shadowStepClamp)
      this.uniforms.u_shadowStepClamp.value = this.params.shadowStepClamp || 0.0;
    if (this.uniforms.u_shadowBiasBase)
      this.uniforms.u_shadowBiasBase.value = this.params.shadowBiasBase || 0.0015;
    if (this.uniforms.u_shadowBiasSlope)
      this.uniforms.u_shadowBiasSlope.value = this.params.shadowBiasSlope || 0.0005;
    if (this.uniforms.u_aoFallbackStrength)
      this.uniforms.u_aoFallbackStrength.value = this.params.aoFallbackStrength || 0.5;

    if (this.uniforms.u_aoEnabled) this.uniforms.u_aoEnabled.value = this.params.aoEnabled;
    if (this.uniforms.u_softShadowsEnabled)
      this.uniforms.u_softShadowsEnabled.value = this.params.softShadowsEnabled;
    if (this.uniforms.u_softShadowSteps)
      this.uniforms.u_softShadowSteps.value = this.params.softShadowSteps;
    if (this.uniforms.u_shadowSharpness)
      this.uniforms.u_shadowSharpness.value = this.params.shadowSharpness;
    if (this.uniforms.u_fastNormals && typeof this.params.fastNormals === 'boolean')
      this.uniforms.u_fastNormals.value = !!this.params.fastNormals;
    if (this.uniforms.u_fastShadows && typeof this.params.fastShadows === 'boolean')
      this.uniforms.u_fastShadows.value = !!this.params.fastShadows;
    if (this.uniforms.u_fastAO && typeof this.params.fastAO === 'boolean')
      this.uniforms.u_fastAO.value = !!this.params.fastAO;
    if (this.uniforms.u_shadowEarlyExit && typeof this.params.shadowEarlyExit === 'number')
      this.uniforms.u_shadowEarlyExit.value = this.params.shadowEarlyExit;
    if (this.uniforms.u_shadowStepClamp && typeof this.params.shadowStepClamp === 'number')
      this.uniforms.u_shadowStepClamp.value = this.params.shadowStepClamp;
    if (this.uniforms.u_normalEpsilon)
      this.uniforms.u_normalEpsilon.value = this.params.normalEpsilon;

    // Colors
    if (this.uniforms.u_colorMode) this.uniforms.u_colorMode.value = this.params.colorMode;
    if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = this.params.palette;
    if (this.uniforms.u_useCustomPalette)
      this.uniforms.u_useCustomPalette.value = Number(this.params.palette) < 0 ? 1 : 0;
    if (this.uniforms.u_colorIntensity)
      this.uniforms.u_colorIntensity.value = this.params.colorIntensity;
    if (this.uniforms.u_orbitTrapScale)
      this.uniforms.u_orbitTrapScale.value = this.params.orbitTrapScale;
    if (this.uniforms.u_materialColor) {
      const color = new THREE.Color(this.params.materialColor);
      this.uniforms.u_materialColor.value.copy(color);
    }
    // Ensure camera fly mode callback mirrors current param (helps after resets/type changes)
    if (this.callbacks && this.callbacks.onFlyModeToggle) {
      try {
        this.callbacks.onFlyModeToggle(!!this.params.flyMode);
      } catch (_) {}
    }
    if (this.callbacks && this.callbacks.onReticleToggle) {
      try {
        this.callbacks.onReticleToggle(!!this.params.reticleEnabled);
      } catch (_) {}
    }
    // World uniforms
    if (this.uniforms.u_worldTile && this.params.worldTile !== undefined)
      this.uniforms.u_worldTile.value = this.params.worldTile;
    if (this.uniforms.u_worldThickness && this.params.worldThickness !== undefined)
      this.uniforms.u_worldThickness.value = this.params.worldThickness;
    if (this.uniforms.u_worldWarp && this.params.worldWarp !== undefined)
      this.uniforms.u_worldWarp.value = this.params.worldWarp;
    if (this.uniforms.u_worldDeScale && this.params.worldDeScale !== undefined)
      this.uniforms.u_worldDeScale.value = this.params.worldDeScale;
    if (this.uniforms.u_worldSegClamp && this.params.worldSegClamp !== undefined)
      this.uniforms.u_worldSegClamp.value = this.params.worldSegClamp;
    if (this.uniforms.u_worldDetailStrength && this.params.worldDetailStrength !== undefined)
      this.uniforms.u_worldDetailStrength.value = this.params.worldDetailStrength;
    if (this.uniforms.u_worldDetailScale && this.params.worldDetailScale !== undefined)
      this.uniforms.u_worldDetailScale.value = this.params.worldDetailScale;
    if (this.uniforms.u_worldTexType && this.params.worldTexType !== undefined)
      this.uniforms.u_worldTexType.value = this.params.worldTexType | 0;
    if (this.uniforms.u_worldTexScale && this.params.worldTexScale !== undefined)
      this.uniforms.u_worldTexScale.value = this.params.worldTexScale;
    if (this.uniforms.u_worldTexColorStrength && this.params.worldTexColorStrength !== undefined)
      this.uniforms.u_worldTexColorStrength.value = this.params.worldTexColorStrength;
    if (this.uniforms.u_worldTexBumpStrength && this.params.worldTexBumpStrength !== undefined)
      this.uniforms.u_worldTexBumpStrength.value = this.params.worldTexBumpStrength;
    if (this.uniforms.u_worldTexSpecStrength && this.params.worldTexSpecStrength !== undefined)
      this.uniforms.u_worldTexSpecStrength.value = this.params.worldTexSpecStrength;
    // Texture B + blend
    if (this.uniforms.u_worldTexTypeB && this.params.worldTexTypeB !== undefined)
      this.uniforms.u_worldTexTypeB.value = this.params.worldTexTypeB | 0;
    if (this.uniforms.u_worldTexScaleB && this.params.worldTexScaleB !== undefined)
      this.uniforms.u_worldTexScaleB.value = this.params.worldTexScaleB;
    if (this.uniforms.u_worldTexColorStrengthB && this.params.worldTexColorStrengthB !== undefined)
      this.uniforms.u_worldTexColorStrengthB.value = this.params.worldTexColorStrengthB;
    if (this.uniforms.u_worldTexBumpStrengthB && this.params.worldTexBumpStrengthB !== undefined)
      this.uniforms.u_worldTexBumpStrengthB.value = this.params.worldTexBumpStrengthB;
    if (this.uniforms.u_worldTexSpecStrengthB && this.params.worldTexSpecStrengthB !== undefined)
      this.uniforms.u_worldTexSpecStrengthB.value = this.params.worldTexSpecStrengthB;
    if (this.uniforms.u_worldTexBlendMode && this.params.worldTexBlendMode !== undefined)
      this.uniforms.u_worldTexBlendMode.value = this.params.worldTexBlendMode | 0;
    // Per-attribute mix alphas
    if (
      this.uniforms.u_worldTexBlendAlphaColor &&
      this.params.worldTexBlendAlphaColor !== undefined
    )
      this.uniforms.u_worldTexBlendAlphaColor.value = this.params.worldTexBlendAlphaColor;
    if (this.uniforms.u_worldTexBlendAlphaBump && this.params.worldTexBlendAlphaBump !== undefined)
      this.uniforms.u_worldTexBlendAlphaBump.value = this.params.worldTexBlendAlphaBump;
    if (this.uniforms.u_worldTexBlendAlphaSpec && this.params.worldTexBlendAlphaSpec !== undefined)
      this.uniforms.u_worldTexBlendAlphaSpec.value = this.params.worldTexBlendAlphaSpec;
    // FBM + AA + truchet
    if (this.uniforms.u_worldFbmOctaves && this.params.worldFbmOctaves !== undefined)
      this.uniforms.u_worldFbmOctaves.value = this.params.worldFbmOctaves | 0;
    if (this.uniforms.u_worldFbmLacunarity && this.params.worldFbmLacunarity !== undefined)
      this.uniforms.u_worldFbmLacunarity.value = this.params.worldFbmLacunarity;
    if (this.uniforms.u_worldFbmGain && this.params.worldFbmGain !== undefined)
      this.uniforms.u_worldFbmGain.value = this.params.worldFbmGain;
    if (this.uniforms.u_worldFbmSeed && this.params.worldFbmSeed !== undefined)
      this.uniforms.u_worldFbmSeed.value = this.params.worldFbmSeed;
    if (this.uniforms.u_worldTexAAStrength && this.params.worldTexAAStrength !== undefined)
      this.uniforms.u_worldTexAAStrength.value = this.params.worldTexAAStrength;
    if (this.uniforms.u_worldTexAutoAtten && this.params.worldTexAutoAtten !== undefined)
      this.uniforms.u_worldTexAutoAtten.value = !!this.params.worldTexAutoAtten;
    if (this.uniforms.u_worldTruchetRotate && this.params.worldTruchetRotate !== undefined)
      this.uniforms.u_worldTruchetRotate.value = this.params.worldTruchetRotate ? 1 : 0;
    if (this.uniforms.u_worldTruchetWidth && this.params.worldTruchetWidth !== undefined)
      this.uniforms.u_worldTruchetWidth.value = this.params.worldTruchetWidth;
    if (this.uniforms.u_worldTruchetDensity && this.params.worldTruchetDensity !== undefined)
      this.uniforms.u_worldTruchetDensity.value = this.params.worldTruchetDensity;
    if (this.uniforms.u_truchetSleeveScale && this.params.truchetSleeveScale !== undefined)
      this.uniforms.u_truchetSleeveScale.value = this.params.truchetSleeveScale;
    if (this.uniforms.u_truchetLipScale && this.params.truchetLipScale !== undefined)
      this.uniforms.u_truchetLipScale.value = this.params.truchetLipScale;
    if (this.uniforms.u_truchetMirrorJoins && this.params.truchetMirrorJoins !== undefined)
      this.uniforms.u_truchetMirrorJoins.value = !!this.params.truchetMirrorJoins;
    if (this.uniforms.u_truchetJoinRing && this.params.truchetJoinRing !== undefined)
      this.uniforms.u_truchetJoinRing.value = !!this.params.truchetJoinRing;
    if (this.uniforms.u_truchetJoinRingK && this.params.truchetJoinRingK !== undefined)
      this.uniforms.u_truchetJoinRingK.value = this.params.truchetJoinRingK;
    if (this.uniforms.u_hexFoldFreq && this.params.hexFoldFreq !== undefined)
      this.uniforms.u_hexFoldFreq.value = this.params.hexFoldFreq;
    if (this.uniforms.u_hexContrast && this.params.hexContrast !== undefined)
      this.uniforms.u_hexContrast.value = this.params.hexContrast;
    if (this.uniforms.u_texturesEnabled && this.params.applyProceduralTextures !== undefined)
      this.uniforms.u_texturesEnabled.value = !!this.params.applyProceduralTextures;
    if (this.uniforms.u_texApplyTarget && this.params.textureApplyTarget !== undefined)
      this.uniforms.u_texApplyTarget.value = this.params.textureApplyTarget | 0;
    if (this.uniforms.u_floorTexMode && this.params.floorTextureMode !== undefined)
      this.uniforms.u_floorTexMode.value = this.params.floorTextureMode | 0;
    if (this.uniforms.u_floorIgnoreWarp !== undefined && this.uniforms.u_floorIgnoreWarp)
      this.uniforms.u_floorIgnoreWarp.value = !!this.params.floorIgnoreWarp;
    if (this.uniforms.u_floorBumpScale)
      this.uniforms.u_floorBumpScale.value = this.params.floorBumpScale;
    if (this.uniforms.u_floorSpecScale)
      this.uniforms.u_floorSpecScale.value = this.params.floorSpecScale;
    if (this.uniforms.u_floorTexDisableDist)
      this.uniforms.u_floorTexDisableDist.value = this.params.floorTexDisableDist;
    if (this.uniforms.u_floorTexAutoDisable !== undefined && this.uniforms.u_floorTexAutoDisable)
      this.uniforms.u_floorTexAutoDisable.value = !!this.params.floorTexAutoDisable;
    if (this.uniforms.u_floorTexAutoMul)
      this.uniforms.u_floorTexAutoMul.value = this.params.floorTexAutoMul;
    if (this.uniforms.u_floorFadeNear)
      this.uniforms.u_floorFadeNear.value = this.params.floorFadeNear;
    if (this.uniforms.u_floorFadeFar) this.uniforms.u_floorFadeFar.value = this.params.floorFadeFar;
    if (this.uniforms.u_texSpaceMode && this.params.texSpaceMode !== undefined)
      this.uniforms.u_texSpaceMode.value = this.params.texSpaceMode | 0;
    // Texture LOD sync
    if (this.uniforms.u_texLODEnabled)
      this.uniforms.u_texLODEnabled.value = !!this.params.texLODEnabled;
    if (this.uniforms.u_texDerivOctDrop)
      this.uniforms.u_texDerivOctDrop.value = this.params.texDerivOctDrop | 0;
    if (this.uniforms.u_texDerivMinOct)
      this.uniforms.u_texDerivMinOct.value = this.params.texDerivMinOct | 0;
    if (this.uniforms.u_texWarpOctDrop)
      this.uniforms.u_texWarpOctDrop.value = this.params.texWarpOctDrop | 0;
    if (this.uniforms.u_texLODBumpFactor)
      this.uniforms.u_texLODBumpFactor.value = this.params.texLODBumpFactor;
    if (this.uniforms.u_texLODSpecFactor)
      this.uniforms.u_texLODSpecFactor.value = this.params.texLODSpecFactor;
    // Texture warp + anisotropy
    if (this.uniforms.u_texWarpStrength && this.params.texWarpStrength !== undefined)
      this.uniforms.u_texWarpStrength.value = this.params.texWarpStrength;
    if (this.uniforms.u_texWarpScale && this.params.texWarpScale !== undefined)
      this.uniforms.u_texWarpScale.value = this.params.texWarpScale;
    if (this.uniforms.u_texWarpOctaves && this.params.texWarpOctaves !== undefined)
      this.uniforms.u_texWarpOctaves.value = this.params.texWarpOctaves | 0;
    if (this.uniforms.u_texWarpType && this.params.texWarpType !== undefined)
      this.uniforms.u_texWarpType.value = this.params.texWarpType | 0;
    if (this.uniforms.u_texAnisoFactor && this.params.texAnisoFactor !== undefined)
      this.uniforms.u_texAnisoFactor.value = this.params.texAnisoFactor;
    if (this.uniforms.u_texAnisoAxis && this.params.texAnisoAxis !== undefined)
      this.uniforms.u_texAnisoAxis.value = this.params.texAnisoAxis | 0;
    // Texture color mapping uniforms
    if (this.uniforms.u_texLayerColoring && this.params.texLayerColoring !== undefined)
      this.uniforms.u_texLayerColoring.value = !!this.params.texLayerColoring;
    if (this.uniforms.u_texA_colorBase && this.params.texAColorBase) {
      const cA0 = new THREE.Color(this.params.texAColorBase);
      this.uniforms.u_texA_colorBase.value.copy(cA0);
    }
    if (this.uniforms.u_texA_colorAccent && this.params.texAColorAccent) {
      const cA1 = new THREE.Color(this.params.texAColorAccent);
      this.uniforms.u_texA_colorAccent.value.copy(cA1);
    }
    if (this.uniforms.u_texB_colorBase && this.params.texBColorBase) {
      const cB0 = new THREE.Color(this.params.texBColorBase);
      this.uniforms.u_texB_colorBase.value.copy(cB0);
    }
    if (this.uniforms.u_texB_colorAccent && this.params.texBColorAccent) {
      const cB1 = new THREE.Color(this.params.texBColorAccent);
      this.uniforms.u_texB_colorAccent.value.copy(cB1);
    }

    // Debug
    if (this.uniforms.u_debugEnabled)
      this.uniforms.u_debugEnabled.value = !!this.params.debugEnabled;
    if (this.uniforms.u_debugMode) this.uniforms.u_debugMode.value = this.params.debugMode | 0;
    if (this.uniforms.u_dbgBypassSierpinskiAlign)
      this.uniforms.u_dbgBypassSierpinskiAlign.value = !!this.params.dbgBypassSierpinskiAlign;
    if (this.uniforms.u_dbgBypassFractalRotation)
      this.uniforms.u_dbgBypassFractalRotation.value = !!this.params.dbgBypassFractalRotation;
    if (this.uniforms.u_sierpinskiBase)
      this.uniforms.u_sierpinskiBase.value = this.params.sierpinskiBase;

    // Environment
    if (this.uniforms.u_fogEnabled) this.uniforms.u_fogEnabled.value = this.params.fogEnabled;
    if (this.uniforms.u_fogDensity) this.uniforms.u_fogDensity.value = this.params.fogDensity;
    if (this.uniforms.u_fogColor) {
      const color = new THREE.Color(this.params.fogColor);
      this.uniforms.u_fogColor.value.copy(color);
    }
    if (this.uniforms.u_floorEnabled) this.uniforms.u_floorEnabled.value = this.params.floorEnabled;
    if (this.uniforms.u_floorColorA) {
      const ca = new THREE.Color(this.params.floorColorA);
      this.uniforms.u_floorColorA.value.copy(ca);
    }
    if (this.uniforms.u_floorColorB) {
      const cb = new THREE.Color(this.params.floorColorB);
      this.uniforms.u_floorColorB.value.copy(cb);
    }
    if (this.uniforms.u_backgroundColor) {
      const bg = new THREE.Color(this.params.backgroundColor);
      this.uniforms.u_backgroundColor.value.copy(bg);
    }
    // Post-processing uniforms
    if (this.uniforms.u_postExposure) this.uniforms.u_postExposure.value = this.params.postExposure;
    if (this.uniforms.u_postContrast) this.uniforms.u_postContrast.value = this.params.postContrast;
    if (this.uniforms.u_postSaturation)
      this.uniforms.u_postSaturation.value = this.params.postSaturation;
    if (this.uniforms.u_postGamma) this.uniforms.u_postGamma.value = this.params.postGamma;
    if (this.uniforms.u_vignetteStrength)
      this.uniforms.u_vignetteStrength.value = this.params.vignetteStrength;
    if (this.uniforms.u_vignetteSoftness)
      this.uniforms.u_vignetteSoftness.value = this.params.vignetteSoftness;
    if (this.uniforms.u_toneMapper) this.uniforms.u_toneMapper.value = this.params.toneMapper | 0;
    if (this.callbacks.onBackgroundChange) {
      this.callbacks.onBackgroundChange(this.params.backgroundColor);
    }

    // Performance
    if (this.uniforms.u_maxSteps) this.uniforms.u_maxSteps.value = this.params.maxSteps;
    if (this.uniforms.u_stepRelaxation)
      this.uniforms.u_stepRelaxation.value = this.params.stepRelaxation;
    // Bounds culling + mode (ensure uniforms match params on preset/apply)
    if (this.uniforms.u_enableBoundsCulling)
      this.uniforms.u_enableBoundsCulling.value = !!this.params.enableBoundsCulling;
    if (this.uniforms.u_cullMode) this.uniforms.u_cullMode.value = this.params.cullingMode | 0;
    // Truchet fast-path uniforms (for preset application)
    if (this.uniforms.u_truchetPortalFast !== undefined && this.uniforms.u_truchetPortalFast)
      this.uniforms.u_truchetPortalFast.value = !!this.params.truchetPortalFast;
    if (this.uniforms.u_truchetFastMargin)
      this.uniforms.u_truchetFastMargin.value =
        this.params.truchetFastMargin !== undefined
          ? this.params.truchetFastMargin
          : this.uniforms.u_truchetFastMargin.value;
    if (this.uniforms.u_truchetFastK)
      this.uniforms.u_truchetFastK.value =
        this.params.truchetFastK !== undefined
          ? this.params.truchetFastK
          : this.uniforms.u_truchetFastK.value;
    if (this.uniforms.u_truchetFastMinDist)
      this.uniforms.u_truchetFastMinDist.value =
        this.params.truchetFastMinDist !== undefined
          ? this.params.truchetFastMinDist
          : this.uniforms.u_truchetFastMinDist.value;
    if (this.uniforms.u_useSegmentTracing)
      this.uniforms.u_useSegmentTracing.value = this.params.useSegmentTracing;
    if (this.uniforms.u_segmentFraction)
      this.uniforms.u_segmentFraction.value = this.params.segmentFraction;
    if (this.uniforms.u_useAnalyticNormals)
      this.uniforms.u_useAnalyticNormals.value = this.params.useAnalyticNormals;
    if (this.uniforms.u_integratorAuto)
      this.uniforms.u_integratorAuto.value = this.params.integratorAuto;
    if (this.uniforms.u_integratorSwitchDist)
      this.uniforms.u_integratorSwitchDist.value = this.params.integratorSwitchDist;
    if (this.uniforms.u_adaptiveRelaxation)
      this.uniforms.u_adaptiveRelaxation.value = this.params.adaptiveRelaxation;
    if (this.uniforms.u_relaxationMin)
      this.uniforms.u_relaxationMin.value = this.params.relaxationMin;
    if (this.uniforms.u_relaxationMax)
      this.uniforms.u_relaxationMax.value = this.params.relaxationMax;
    if (this.uniforms.u_enableDithering)
      this.uniforms.u_enableDithering.value = this.params.enableDithering;
    if (this.uniforms.u_ditheringStrength)
      this.uniforms.u_ditheringStrength.value = this.params.ditheringStrength;
    if (this.uniforms.u_enableDistanceLOD)
      this.uniforms.u_enableDistanceLOD.value = this.params.enableDistanceLOD;
    if (this.uniforms.u_ditherFog) this.uniforms.u_ditherFog.value = !!this.params.ditherFog;
    if (this.uniforms.u_enableBudgetLOD)
      this.uniforms.u_enableBudgetLOD.value = this.params.enableBudgetLOD;
    if (this.uniforms.u_lodNear) this.uniforms.u_lodNear.value = this.params.lodNear;
    if (this.uniforms.u_lodFar) this.uniforms.u_lodFar.value = this.params.lodFar;
    if (this.uniforms.u_budgetStepsFarFactor)
      this.uniforms.u_budgetStepsFarFactor.value = this.params.budgetStepsFarFactor;
    if (this.uniforms.u_farShadowSkipFactor)
      this.uniforms.u_farShadowSkipFactor.value = this.params.farShadowSkipFactor;
    if (this.uniforms.u_aoMinSamples) this.uniforms.u_aoMinSamples.value = this.params.aoMinSamples;
    if (this.uniforms.u_softShadowMinSteps)
      this.uniforms.u_softShadowMinSteps.value = this.params.softShadowMinSteps;
    if (this.uniforms.u_curvatureAwareRelaxation)
      this.uniforms.u_curvatureAwareRelaxation.value = this.params.curvatureAwareRelaxation;
    if (this.uniforms.u_curvatureNearOnly)
      this.uniforms.u_curvatureNearOnly.value = this.params.curvatureNearOnly;
    if (this.uniforms.u_curvatureNearK)
      this.uniforms.u_curvatureNearK.value = this.params.curvatureNearK;
    if (this.uniforms.u_stepSafety) this.uniforms.u_stepSafety.value = this.params.stepSafety;
    if (this.uniforms.u_stepSafetyAuto)
      this.uniforms.u_stepSafetyAuto.value = this.params.stepSafetyAuto;
    if (this.uniforms.u_stepSafetyMin)
      this.uniforms.u_stepSafetyMin.value = this.params.stepSafetyMin;
    if (this.uniforms.u_stepSafetyMax)
      this.uniforms.u_stepSafetyMax.value = this.params.stepSafetyMax;
    if (this.uniforms.u_stepSafetyBandNear)
      this.uniforms.u_stepSafetyBandNear.value = this.params.stepSafetyBandNear;
    if (this.uniforms.u_stepSafetyBandFar)
      this.uniforms.u_stepSafetyBandFar.value = this.params.stepSafetyBandFar;
    if (this.uniforms.u_conservativeHits)
      this.uniforms.u_conservativeHits.value = this.params.conservativeHits;
    if (this.uniforms.u_curvatureNearOnly)
      this.uniforms.u_curvatureNearOnly.value = this.params.curvatureNearOnly;
    if (this.uniforms.u_curvatureNearK)
      this.uniforms.u_curvatureNearK.value = this.params.curvatureNearK;

    // Animation (trigger callback if exists)
    if (this.callbacks.onAnimationToggle) {
      this.callbacks.onAnimationToggle(this.params.animateRotation);
    }
    if (this.callbacks.onRotationSpeedChange) {
      this.callbacks.onRotationSpeedChange('x', this.params.rotationSpeedX);
      this.callbacks.onRotationSpeedChange('y', this.params.rotationSpeedY);
      this.callbacks.onRotationSpeedChange('z', this.params.rotationSpeedZ);
    }

    // Re-apply saved folder open states so preset changes don't collapse UI
    if (this.refreshFolderPersistenceStates) this.refreshFolderPersistenceStates();
  }

  // Attach a lightweight persistence hook to all controllers
  attachPersistHooks() {
    if (!this.gui || !this.gui.controllersRecursive) return;
    const controllers = this.gui.controllersRecursive();
    controllers.forEach((c) => {
      if (typeof c.onFinishChange === 'function') {
        c.onFinishChange(() => this.schedulePersist());
      } else if (typeof c.onChange === 'function') {
        c.onChange(() => this.schedulePersist());
      }
    });
  }

  // Force re-apply palette uniforms and preview based on current params
  forcePaletteRefresh() {
    try {
      const v = Number(this.params.palette) | 0;
      if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = v;
      if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = v < 0 ? 1 : 0;
      const mgr = this.callbacks && this.callbacks.paletteManager;
      if (mgr && v < 0) mgr.packToUniforms(this.uniforms);
      if (typeof this._renderPreview === 'function') this._renderPreview();
      if (this.callbacks && this.callbacks.requestShaderRefresh)
        this.callbacks.requestShaderRefresh();
    } catch (_) {}
  }

  schedulePersist() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => this.persistOverrides(), 150);
  }

  // Persist only non-default values to localStorage
  persistOverrides() {
    try {
      const overrides = buildOverrides(this.params, DEFAULTS);
      saveOverridesToStorage(overrides);
    } catch (e) {
      console.warn('Failed to persist overrides:', e);
    }
  }

  // --- Info overlay and tooltips ---
  initInfoOverlay() {
    // Create overlay once
    if (document.getElementById('gui-info-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'gui-info-overlay';
    overlay.className = 'gui-info-overlay';
    // Start hidden; shown via showInfo() when an info button is clicked
    overlay.style.display = 'none';
    try {
      overlay.setAttribute('aria-hidden', 'true');
    } catch (_) {}
    // Ensure overlay layers above canvas and allows selection
    try {
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.5)',
        zIndex: '10002',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
      });
    } catch (_) {}
    overlay.innerHTML = `
      <div class="gui-info-modal" role="dialog" aria-modal="true" aria-labelledby="gui-info-title" aria-describedby="gui-info-text" tabindex="-1">
        <h3 id="gui-info-title"></h3>
        <p id="gui-info-text"></p>
        <div class="gui-info-close"><button id="gui-info-close">Close</button></div>
      </div>`;
    document.body.appendChild(overlay);
    // Modal readability + text selection
    try {
      const modalEl = overlay.querySelector('.gui-info-modal');
      Object.assign(modalEl.style, {
        background: '#1b1e24',
        color: '#fff',
        padding: '16px 18px',
        borderRadius: '8px',
        width: 'min(92vw, 720px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica, Arial, sans-serif',
        lineHeight: '1.5',
        userSelect: 'text',
        cursor: 'text',
      });
      const titleEl = overlay.querySelector('#gui-info-title');
      if (titleEl) Object.assign(titleEl.style, { margin: '0 0 8px 0', fontSize: '16px' });
      const textEl = overlay.querySelector('#gui-info-text');
      if (textEl) Object.assign(textEl.style, { margin: '0 0 12px 0', whiteSpace: 'pre-wrap' });
      const closeBtn = overlay.querySelector('#gui-info-close');
      if (closeBtn)
        Object.assign(closeBtn.style, {
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          padding: '4px 10px',
          cursor: 'pointer',
        });
    } catch (_) {}
    const close = overlay.querySelector('#gui-info-close');
    close.addEventListener('click', () => this.hideInfoOverlay());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideInfoOverlay();
    });
    // Release any element-level pointer capture on press to ensure selection works
    overlay.addEventListener(
      'pointerdown',
      (e) => {
        try {
          if (e.target && e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId))
            e.target.releasePointerCapture(e.pointerId);
        } catch (_) {}
      },
      true
    );
    // Close on Esc when visible
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.style.display !== 'none') {
        e.preventDefault();
        this.hideInfoOverlay();
      }
    });
    // Prevent app hotkeys while modal is open; Esc closes the dialog
    overlay.addEventListener(
      'keydown',
      (e) => {
        if (overlay.style.display === 'none') return;
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hideInfoOverlay();
          return;
        }
        e.stopPropagation();
      },
      true
    );

    this._infoOverlay = overlay;
    this._infoTitle = overlay.querySelector('#gui-info-title');
    this._infoText = overlay.querySelector('#gui-info-text');
    this._infoModal = overlay.querySelector('.gui-info-modal');

    // Info dictionary (concise explanations)
    this._INFO = {
      floorEnabled: ['Floor Enabled', 'Show/hide the ground plane under the fractal.'],
      floorColorA: ['Floor Color A', 'Primary color for the checkerboard floor.'],
      floorColorB: ['Floor Color B', 'Secondary color for the checkerboard floor.'],
      autoResHoldFrames: [
        'Hold Frames (min)',
        'Minimum frames to wait after a res change before changing again.',
      ],
      autoResSustainLow: [
        'Sustain Low (down)',
        'Consecutive checks under target FPS before downscaling.',
      ],
      autoResSustainHigh: [
        'Sustain High (up)',
        'Consecutive checks over target FPS before upscaling.',
      ],
      // Debug
      debugEnabled: [
        'Debug View',
        'Overrides normal shading with selected diagnostic visualizations.',
      ],
      debugMode: [
        'Debug Mode',
        'Steps, Travel Distance, Orbit Trap, Normal, Map@Hit, Local Bound Mask, Fractal Distance Only, Local Tetra Probe, Local Axes.',
      ],
      dbgBypassSierpinskiAlign: [
        'Bypass Sierpinski Align',
        'Skips the Sierpinski pre‑alignment to troubleshoot transforms.',
      ],
      dbgBypassFractalRotation: [
        'Bypass Fractal Rotation',
        'Skips applying user rotation when evaluating the Sierpinski SDF.',
      ],
      sierpinskiBase: [
        'Sierpinski Base Size',
        'Base tetra size used by the Sierpinski DE. Higher = flatter faces, thinner ridges.',
      ],
      // Presets
      preset: [
        'Visual Preset',
        'Applies a curated set of visual parameters (color, lighting, textures). Some presets also adjust performance‑related defaults for best results.',
      ],
      // Fractal
      fractalType: ['Fractal Type', 'Choose the signed‑distance scene to render.'],
      iterations: [
        'Iterations',
        'Fractal subdivision/detail level (higher = more detail, slower).',
      ],
      power: ['Power (Mandelbulb)', 'Exponent used by Mandelbulb; affects shape and complexity.'],
      scale: ['Scale', 'Uniform fractal scale (also affects tightness near the origin).'],
      // Animation
      animateRotation: ['Auto Rotate', 'Continuously rotate the fractal for inspection.'],
      rotationSpeedX: ['Rotation Speed X', 'Rotation rate around X axis.'],
      rotationSpeedY: ['Rotation Speed Y', 'Rotation rate around Y axis.'],
      rotationSpeedZ: ['Rotation Speed Z', 'Rotation rate around Z axis.'],
      // Camera
      movementSpeed: ['Movement Speed', 'WASD/E/Q navigation speed (Shift doubles it).'],
      showCameraInfo: ['Show Camera Info', 'Displays camera position and distance overlay.'],
      fov: ['Field of View', 'Perspective FOV in degrees.'],
      // Lighting
      lightPosX: ['Light X', 'Directional light position X.'],
      lightPosY: ['Light Y', 'Directional light position Y.'],
      lightPosZ: ['Light Z', 'Directional light position Z.'],
      lightColor: [
        'Light Color',
        'Color for direct and specular light. Use with “Tint Diffuse” to color the lambert term; otherwise only specular is tinted.',
      ],
      ambientStrength: ['Ambient', 'Base ambient light amount (soft floor lighting).'],
      diffuseStrength: ['Diffuse', 'Lambert diffuse intensity (direct light).'],
      specularStrength: ['Specular', 'Specular highlight intensity.'],
      shininess: ['Shininess', 'Phong exponent (higher = tighter specular).'],
      aoEnabled: ['Ambient Occlusion', 'Darkens crevices via multi‑ray ambient occlusion.'],
      softShadowsEnabled: [
        'Soft Shadows',
        'Ray‑marched penumbra shadows (costly). Shadow sample jitter is angle‑gated to avoid flat‑wall grain.',
      ],
      softShadowSteps: ['Shadow Quality', 'Number of ray steps for shadow rays.'],
      shadowSharpness: ['Shadow Sharpness', 'Bias/contrast of specular and shadow.'],
      normalEpsilon: [
        'Normal Precision',
        'Finite‑difference epsilon for normals (smaller = crisper, noisier).',
      ],
      // Color
      colorMode: ['Color Mode', 'Material / Orbit Trap / Distance / Normal visualization.'],
      palette: ['Palette', 'Color palette used by the chosen color mode.'],
      colorIntensity: ['Intensity', 'Brightness multiplier for final color.'],
      orbitTrapScale: ['Orbit Trap Scale', 'Controls banding frequency for orbit trap coloring.'],
      materialColor: ['Material Color', 'Base material color in Material mode.'],
      applyProceduralTextures: [
        'Enabled',
        'Enable procedural textures for the current fractal. When OFF, textures are disabled globally.',
      ],
      texSpaceMode: [
        'Texture Space',
        'World: textures are anchored to world coordinates. Local: textures follow the object’s local fractal space.',
      ],
      // Post
      postExposure: [
        'Exposure',
        'Global brightness multiplier applied after shading (linear space).',
      ],
      postContrast: ['Contrast', 'Global contrast around mid gray. 1.0 = neutral.'],
      postSaturation: [
        'Saturation',
        'Global saturation; 0 = grayscale, 1 = neutral, >1 increases vibrance.',
      ],
      postGamma: ['Gamma', 'Power curve applied after tone mapping. 1.0 = neutral.'],
      vignetteStrength: ['Vignette Strength', 'Darkens the screen edges. 0 = off.'],
      vignetteSoftness: ['Vignette Softness', 'Controls how soft the vignette edge is.'],
      toneMapper: ['Tone Mapper', 'Curve applied after exposure: None, ACES fitted, or Filmic.'],
      // Bloom
      bloomEnabled: [
        'Enable Bloom',
        'Adds a glow around bright areas by blurring and compositing highlights. Costs GPU time.',
      ],
      bloomThreshold: [
        'Bloom Threshold',
        'Minimum brightness that contributes to bloom. Raise to limit glow to only the brightest pixels.',
      ],
      bloomStrength: ['Bloom Strength', 'Intensity of the glow added back to the scene.'],
      bloomRadius: [
        'Bloom Radius',
        'Blur radius (in pixels) used for the glow. Larger = softer, wider halo.',
      ],
      // LUT
      lutEnabled: [
        'Enable LUT',
        'Applies a 3D color look‑up table to remap colors for a specific grade/look.',
      ],
      lutIntensity: ['LUT Intensity', 'Blend factor for the LUT (0 = off, 1 = full).'],
      // Environment
      fogEnabled: ['Fog Enabled', 'Enables distance fog.'],
      fogType: ['Fog Type', 'Exponential, Exp2, or Linear fog falloff.'],
      fogDensity: ['Fog Density', 'Fog density (Exp/Exp2 modes).'],
      fogNear: ['Fog Near', 'Linear fog start distance.'],
      fogFar: ['Fog Far', 'Linear fog end distance.'],
      fogColor: ['Fog Color', 'Fog tint color.'],
      backgroundColor: ['Background', 'Scene background color.'],
      // Performance (core)
      quality: ['Quality Preset', 'Applies canonical step/iteration budgets (Low/Med/High/Ultra).'],
      maxSteps: ['Max Ray Steps', 'Sphere‑tracing step cap (higher = fewer misses, slower).'],
      autoResolutionEnabled: [
        'Auto Resolution (FPS)',
        'Scales render resolution to target 60 FPS.',
      ],
      stepRelaxation: [
        'Step Size (Fixed)',
        'Baseline step multiplier. Affects both fixed and adaptive/curvature modes.',
      ],
      useSegmentTracing: [
        'Segment Tracing',
        'Steps by a fraction of remaining range; very stable silhouettes, good for far distances.',
      ],
      segmentFraction: [
        'Segment Fraction',
        'Larger = bigger steps in segment mode. 0.5 is a balanced default.',
      ],
      integratorAuto: [
        'Integrator Auto',
        'Uses segment tracing beyond a distance to avoid overshoot; keeps sphere tracing nearby.',
      ],
      integratorSwitchDist: [
        'Integrator Switch Distance',
        'Distance where auto integrator switches to segment tracing.',
      ],
      integratorPreset: [
        'Integrator Preset',
        'Pick a ray‑marcher: • Sphere (Plain) = classic sphere tracing (stable near surfaces; best for World). • Sphere (Hybrid) = sphere tracing, auto‑caps by distance. • Segment (Robust) = fixed‑fraction steps (very stable silhouettes; can alias thin shells).',
      ],
      // Camera extras
      flyMode: [
        'Fly Mode (Pitch Forward)',
        'When enabled, W/S move along the camera’s true forward (includes pitch). Off = slide on XZ only.',
      ],
      // World (Amazing Surf)
      worldTile: ['Tile Period', 'Period of the XZ tiling (larger = bigger rooms and arches).'],
      worldThickness: [
        'Shell Thickness',
        'Gyroid shell thickness; smaller values open the structure (more void).',
      ],
      worldWarp: [
        'Domain Warp',
        'Adds organic variation to the periodic surface (0 = strict repeat).',
      ],
      // (deduped entries; defined below once)
      worldDetailStrength: [
        'Detail Strength',
        'Amount of triplanar FBM color detail on the surface (0..1).',
      ],
      worldDetailScale: [
        'Detail Scale',
        'Texel scale for triplanar FBM detail (smaller = bigger features).',
      ],
      worldFogAuto: ['Auto Fog (World)', 'If enabled, sets Linear fog Near/Far from Tile × Scale.'],
      worldAutoIntegrator: [
        'Auto Integrator (World)',
        'Sphere near, Segment far with hysteresis based on Tile × Scale.',
      ],
      worldDeScale: [
        'DE Safety',
        'Distance-estimator safety scale (0.75–1.0). Lower = safer (reduces holes), but slower.',
      ],
      worldSegClamp: [
        'Segment Clamp',
        'Extra clamp for Segment integrator step size in World. Lower reduces banded aliasing on thin shells.',
      ],
      useAnalyticNormals: [
        'Mandelbulb DE Normals',
        'Analytic derivative normals for Mandelbulb; improves detail and stability.',
      ],
      // Truchet
      truchetSmooth: [
        'Smooth Band Union',
        'Uses a soft-min to union the main tube and band. Reduces sharp kinks and “fan” aliasing at portals. Slightly rounds the seam.',
      ],
      truchetSmoothK: [
        'Smooth K (×Radius)',
        'Strength of the soft union. Effective smoothing radius ≈ radius × (0.02 + K). Increase to reduce artifacts; decrease to keep edges crisper. 0.10–0.25 works well.',
      ],
      adaptiveRelaxation: [
        'Adaptive Step Size',
        'Scales step size by distance/curvature to speed up marching while avoiding misses.',
      ],
      relaxationMin: [
        'Min Relaxation',
        'Minimum step multiplier near surfaces/high curvature (safer = lower).',
      ],
      relaxationMax: [
        'Max Relaxation',
        'Maximum step multiplier far from surfaces (higher = faster but riskier).',
      ],
      enableDithering: [
        'Dithering',
        'Adds small threshold noise near the hit threshold to reduce banding. Masked to near‑surface and further attenuated at head‑on angles to avoid large‑area grain.',
      ],
      ditherFog: [
        'Dither Fog',
        'Adds tiny noise to the fog blend to hide banding. Can create visible grain on wide gradients; recommended OFF for World.',
      ],
      shadowDitherStrength: [
        'Shadow Dither Strength',
        'Amount of per‑sample jitter in soft‑shadow rays. Angle‑gated to reduce wall grain. Use 0.0–0.3 for interiors; 0 reduces grain the most.',
      ],
      tintDiffuse: [
        'Tint Diffuse With Light',
        'When ON, the light color tints diffuse as well as specular. When OFF, only specular is tinted.',
      ],

      aoFallbackStrength: [
        'AO Fallback Strength',
        'When AO is OFF, a cheap two‑tap occlusion approximation. 0 disables; higher darkens crevices slightly.',
      ],
      shadowEarlyExit: [
        'Shadow Early Exit',
        'Stop shadow marching when enough occlusion is accumulated (speeds up soft shadows).',
      ],
      shadowStepClamp: [
        'Shadow Step Clamp',
        'Upper bound on each shadow step length. Lower values reduce banding but cost more.',
      ],
      shadowBiasBase: [
        'Shadow Bias Base',
        'Small constant bias per shadow sample to avoid self‑shadow bands.',
      ],
      shadowBiasSlope: [
        'Shadow Bias Slope',
        'Bias grows with distance along the shadow ray; helps large flat regions.',
      ],
      shadowBiasAngle: [
        'Shadow Bias Angle',
        'Extra bias at grazing angles (vs light) to suppress stripe artifacts.',
      ],
      shadowPlaneBias: [
        'Shadow Plane Bias',
        'Extra clamp near the ground plane to reduce floor self‑shadowing bands.',
      ],
      cullingMode: [
        'Culling Mode',
        'Plane Only returns the ground when outside bounds (avoids halos). Union returns max(bound, plane) for compat.',
      ],
      // Procedural texture controls
      worldTexType: [
        'Texture Type',
        'Procedural texture type: FBM, Noise, Truchet (square), Hex Truchet, or Checker.',
      ],
      worldTexScale: ['Texture Scale', 'Texel scale for the selected procedural texture.'],
      worldTexColorStrength: ['Texture → Color', 'How much the texture modulates base color.'],
      worldTexBumpStrength: [
        'Texture → Bump',
        'How much the texture perturbs shading normals (fake bump).',
      ],
      worldTexSpecStrength: [
        'Texture → Specular',
        'How much the texture modulates specular intensity.',
      ],
      worldTexBlendMode: [
        'Blend Mode',
        'How A and B textures are combined: Mix, Multiply, or Add.',
      ],
      worldTexBlendAlphaColor: [
        'Mix Alpha (Color)',
        'Mix weight for color when Blend=Mix (0=A, 1=B). Hidden for Multiply/Add.',
      ],
      worldTexBlendAlphaBump: [
        'Mix Alpha (Bump)',
        'Mix weight for bump when Blend=Mix (0=A, 1=B). Hidden for Multiply/Add.',
      ],
      worldTexBlendAlphaSpec: [
        'Mix Alpha (Spec)',
        'Mix weight for specular when Blend=Mix (0=A, 1=B). Hidden for Multiply/Add.',
      ],
      worldFbmOctaves: ['FBM Octaves', 'Number of fractal noise layers (1–8).'],
      worldFbmLacunarity: ['FBM Lacunarity', 'Frequency multiplier per octave (≈2.0).'],
      worldFbmGain: ['FBM Gain', 'Amplitude multiplier per octave (≈0.5).'],
      worldFbmSeed: ['FBM Seed', 'Offsets noise hashing for variations.'],
      worldTexAAStrength: [
        'Texture AA Strength',
        'Derivative‑based fade of high frequencies to reduce shimmer at extreme scales.',
      ],
      worldTexAutoAtten: [
        'Auto Atten (bump/spec)',
        'Automatically reduces bump/spec modulation at extreme scales.',
      ],
      worldTruchetRotate: ['Truchet Rotate', 'Random 90° per‑tile rotation to vary orientation.'],
      worldTruchetWidth: ['Truchet Width', 'Band width of the truchet stripe.'],
      worldTruchetDensity: [
        'Truchet Density',
        'Tile density multiplier (scales the grid frequency).',
      ],
      hexFoldFreq: [
        'Hex Fold Freq',
        'Frequency multiplier for the hex Truchet folds (affects both harmonics).',
      ],
      hexContrast: [
        'Hex Contrast',
        'Contrast scale applied to the folded hex Truchet before clamping (higher = punchier).',
      ],
      hexSeed: [
        'Hex Seed',
        'Randomization seed for hex flip orientation; independent from FBM seed.',
      ],
      ditheringStrength: ['Dithering Strength', 'Amplitude of the near-surface threshold noise.'],
      useBlueNoise: [
        'Blue‑Noise Mode',
        'Uses blue‑noise hash; reduces structure vs interleaved grid.',
      ],
      blueNoiseScale: ['Blue‑Noise Scale', 'Tiling scale for the blue‑noise pattern.'],
      blueNoiseTemporalJitter: [
        'Temporal Jitter',
        'Animates blue‑noise slightly over time (can add shimmer).',
      ],
      enableBoundsCulling: [
        'Bounds Culling',
        'Skips fractal eval outside an inflated bound; primary rays only to avoid artifacts.',
      ],
      // (deduped) cullingMode help defined above
      frustumBudgetDropEnabled: [
        'Frustum Budget Drop',
        'Reduces steps/AO/shadows when object is out of view; restores with hysteresis.',
      ],
      frustumBudgetDropFactor: [
        'Drop Factor',
        'How aggressively to reduce step budget when out of view.',
      ],
      frustumBudgetAOMin: ['AO Min (Drop)', 'AO floor when out of view.'],
      frustumBudgetShadowMin: ['Shadow Min (Drop)', 'Shadow step floor when out of view.'],
      frustumDropHysteresisFrames: [
        'Drop Hysteresis',
        'Frames to wait before applying/restoring the drop.',
      ],
      enableDistanceLOD: [
        'Distance LOD',
        'Increases epsilon by distance to reduce iterations on far surfaces.',
      ],
      enableBudgetLOD: [
        'Budget LOD',
        'Scales steps/AO/shadows by distance; maintains quality nearby.',
      ],
      lodNear: ['LOD Near', 'Start distance for LOD transitions.'],
      lodFar: ['LOD Far', 'End distance for LOD transitions.'],
      budgetStepsFarFactor: ['Step Cap Far Factor', 'Fraction of Max Steps used at far distances.'],
      farShadowSkipFactor: [
        'Shadow Far Skip',
        'Skip distance for far shadows (multiplier of LOD far).',
      ],
      aoMinSamples: ['AO Min Samples', 'Minimum AO rays used at far distances.'],
      softShadowMinSteps: ['Shadow Min Steps', 'Minimum shadow steps used at far distances.'],
      stepSafety: [
        'Step Safety Scale',
        'Global clamp on step length to prevent misses (lower = safer).',
      ],
      stepSafetyAuto: [
        'Step Safety Auto',
        'Automatically tightens safety near mid distances/high curvature.',
      ],
      stepSafetyMin: ['Safety Min', 'Lower bound used by Auto safety.'],
      stepSafetyMax: ['Safety Max', 'Upper bound used by Auto safety.'],
      stepSafetyBandNear: [
        'Safety Band Near',
        'Start of mid‑distance band where Auto safety tightens.',
      ],
      stepSafetyBandFar: ['Safety Band Far', 'End of mid‑distance band.'],
      conservativeHits: [
        'Conservative Hits',
        'Stricter hit threshold + deeper refinement; removes rare early stops.',
      ],
      ringSafeClamp: [
        'Ring‑Safe Clamp (Menger)',
        'When ON and Curvature is enabled on Menger, caps Step Safety and enables Auto to avoid concentric rings.',
      ],
      ringSafeClampMax: [
        'Ring‑Safe Max Safety',
        'Upper bound for Step Safety applied on Menger when Ring‑Safe Clamp is ON.',
      ],
    };
  }

  addInfo(controller, key) {
    if (!controller || !key) return;
    const info = this._INFO && this._INFO[key];
    if (!info) return;
    const [title, text] = info;
    const row = controller.domElement;
    try {
      row.title = `${title}: ${text}`;
      row.dataset.infoKey = key;
      row.dataset.infoTitle = title;
      row.dataset.infoText = text;
      this.ensureInfoButton(row);
      if (!row._infoObserver) {
        const mo = new MutationObserver(() => this.ensureInfoButton(row));
        mo.observe(row, { childList: true });
        row._infoObserver = mo;
      }
    } catch (_) {}
  }

  showInfo(title, text) {
    if (!this._infoOverlay) this.initInfoOverlay();
    this._infoTitle.textContent = title || 'Info';
    this._infoText.textContent = text || '';
    // Exit pointer lock to enable text selection
    try {
      if (document.pointerLockElement) document.exitPointerLock();
    } catch (_) {}
    // Disable canvas pointer events while modal is open (belt-and-suspenders)
    try {
      const cv = document.getElementById('canvas');
      if (cv) cv.style.pointerEvents = 'none';
    } catch (_) {}
    // Save previous focus to restore on close
    try {
      this._prevFocus = document.activeElement;
    } catch (_) {
      this._prevFocus = null;
    }
    // Show overlay and mark as active
    this._infoOverlay.style.display = 'flex';
    try {
      this._infoOverlay.setAttribute('aria-hidden', 'false');
    } catch (_) {}
    // Trap focus within the modal
    const modal = this._infoModal || this._infoOverlay.querySelector('.gui-info-modal');
    const focusables = () =>
      Array.from(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );
    this._trapFocusHandler = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = focusables();
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !modal.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    this._infoOverlay.addEventListener('keydown', this._trapFocusHandler);
    // Initial focus: Close button, else the dialog container
    setTimeout(() => {
      try {
        const btn = this._infoOverlay.querySelector('#gui-info-close');
        btn && btn.focus ? btn.focus() : modal && modal.focus && modal.focus();
      } catch (_) {}
    }, 0);
  }

  hideInfoOverlay() {
    if (!this._infoOverlay) return;
    this._infoOverlay.style.display = 'none';
    try {
      this._infoOverlay.setAttribute('aria-hidden', 'true');
    } catch (_) {}
    try {
      if (this._trapFocusHandler)
        this._infoOverlay.removeEventListener('keydown', this._trapFocusHandler);
    } catch (_) {}
    this._trapFocusHandler = null;
    // Re-enable canvas pointer events
    try {
      const cv = document.getElementById('canvas');
      if (cv) cv.style.pointerEvents = 'auto';
    } catch (_) {}
    // Restore focus
    try {
      if (this._prevFocus && this._prevFocus.focus) this._prevFocus.focus();
    } catch (_) {}
    this._prevFocus = null;
  }

  // Compute and apply Linear fog Near/Far from World params
  applyWorldFogAuto() {
    try {
      if ((this.params.fractalType | 0) !== 5) return;
      if (!this.params.worldFogAuto) return;
      const tile = Number(this.params.worldTile || 16);
      const scl = Number(this.params.scale || 1);
      const near = Math.max(2, tile * scl * 0.8);
      const far = Math.max(near + 5, tile * scl * 5.0);
      this.params.fogType = 2; // Linear
      this.params.fogNear = near;
      this.params.fogFar = far;
      if (this.uniforms.u_fogType) this.uniforms.u_fogType.value = 2;
      if (this.uniforms.u_fogNear) this.uniforms.u_fogNear.value = near;
      if (this.uniforms.u_fogFar) this.uniforms.u_fogFar.value = far;
      if (this.gui && this.gui.controllersRecursive)
        this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
    } catch (_) {}
  }

  // Per-fractal defaults for integrator selection
  applyPerFractalDefaults(_source = '') {
    try {
      const type = this.params.fractalType | 0;

      // 1) Integrator default:
      //    Mandelbulb => Segment; Sierpinski => Segment; Mandelbox => Sphere
      if (!this._useSegOverridden || type === 5) {
        if (type === 2) {
          if (this.params.useSegmentTracing !== true) {
            this.params.useSegmentTracing = true;
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = true;
          }
          if (this.params.integratorAuto !== false) {
            this.params.integratorAuto = false;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          }
          // Default Mandelbulb iterations to 10 if user hasn't overridden
          if (!this._iterationsOverridden && this.params.iterations !== 10) {
            this.params.iterations = 10;
            if (this.uniforms.u_iterations) this.uniforms.u_iterations.value = 10;
          }
        } else if (type === 1) {
          // Menger: default to 5 iterations if user hasn't overridden
          if (!this._iterationsOverridden && this.params.iterations !== 5) {
            this.params.iterations = 5;
            if (this.uniforms.u_iterations) this.uniforms.u_iterations.value = 5;
          }
        } else if (type === 4) {
          // Mandelbox: prefer Sphere integrator by default
          if (this.params.useSegmentTracing !== false) {
            this.params.useSegmentTracing = false;
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = false;
          }
          if (this.params.integratorAuto !== false) {
            this.params.integratorAuto = false;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          }
        } else if (type === 3) {
          // Sierpinski: segment tracing by default
          if (this.params.useSegmentTracing !== true) {
            this.params.useSegmentTracing = true;
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = true;
          }
          if (this.params.integratorAuto !== false) {
            this.params.integratorAuto = false;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          }
          if (this.params.segmentFraction === DEFAULTS.segmentFraction) {
            this.params.segmentFraction = 0.55;
            if (this.uniforms.u_segmentFraction) this.uniforms.u_segmentFraction.value = 0.55;
          }
          // Disable bounds culling for Sierpinski to avoid curved clips at small scales
          if (this.params.enableBoundsCulling !== false) {
            this.params.enableBoundsCulling = false;
            if (this.uniforms.u_enableBoundsCulling)
              this.uniforms.u_enableBoundsCulling.value = false;
          }
        } else if (type === 5 || type === 6) {
          // World (Amazing Surf): always prefer Sphere (no auto) regardless of prior user toggle
          this.params.useSegmentTracing = false;
          if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = false;
          this.params.integratorAuto = false;
          if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          // Also disable auto-rotate for World by default
          if (this.params.animateRotation !== false) {
            this.params.animateRotation = false;
            if (this.callbacks && this.callbacks.onAnimationToggle)
              this.callbacks.onAnimationToggle(false);
          }
        }

        // World modes: ensure brisk camera speed for large spaces (unless preset/user overrode)
        if (type === 5 || type === 6) {
          const targetSpeed = 30.0;
          if (!this._moveSpeedOverridden && this.params.movementSpeed < targetSpeed) {
            this.params.movementSpeed = targetSpeed;
            if (this.callbacks && this.callbacks.onSpeedChange) {
              try {
                this.callbacks.onSpeedChange(targetSpeed);
              } catch (_) {}
            }
            // Refresh GUI display for the slider
            try {
              if (this.gui && this.gui.controllersRecursive)
                this.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
            } catch (_) {}
            this.schedulePersist();
          }
        }

        // Truchet Pipes (type 6) performance defaults
        if (type === 6) {
          // Turn off floor for enclosed pipes; it's the biggest extra cost
          if (this.params.floorEnabled !== false) {
            this.params.floorEnabled = false;
            if (this.uniforms.u_floorEnabled) this.uniforms.u_floorEnabled.value = false;
          }
          // Disable dithering (minor cost, little benefit in pipes)
          if (this.params.enableDithering !== false) {
            this.params.enableDithering = false;
            if (this.uniforms.u_enableDithering) this.uniforms.u_enableDithering.value = false;
          }
          if (this.params.ditherFog !== false) {
            this.params.ditherFog = false;
            if (this.uniforms.u_ditherFog) this.uniforms.u_ditherFog.value = false;
          }
          if (
            typeof this.params.shadowDitherStrength === 'number' &&
            this.params.shadowDitherStrength !== 0
          ) {
            this.params.shadowDitherStrength = 0.0;
            if (this.uniforms.u_shadowDitherStrength)
              this.uniforms.u_shadowDitherStrength.value = 0.0;
          }
          if (this.params.useBlueNoise !== false) {
            this.params.useBlueNoise = false;
            if (this.uniforms.u_useBlueNoise) this.uniforms.u_useBlueNoise.value = false;
          }

          // Bounds culling: leave OFF by default for Truchet; in close, enclosed
          // scenes its overhead can outweigh wins. Users can enable manually.
          if (this.params.enableBoundsCulling !== false) {
            this.params.enableBoundsCulling = false;
            if (this.uniforms.u_enableBoundsCulling)
              this.uniforms.u_enableBoundsCulling.value = false;
          }
          // Frustum drop OFF
          if (this.params.frustumBudgetDropEnabled !== false) {
            this.params.frustumBudgetDropEnabled = false;
          }
          // Cap steps and shadows a bit tighter for stability/perf
          const wantSteps = 160;
          if (this.params.maxSteps > wantSteps) {
            this.params.maxSteps = wantSteps;
            if (this.uniforms.u_maxSteps) this.uniforms.u_maxSteps.value = wantSteps;
          }
          // Near shadow cost: if user/preset provided a value, respect it; otherwise default to 18
          if (typeof this.params.softShadowSteps !== 'number') {
            const ss = 18;
            this.params.softShadowSteps = ss;
            if (this.uniforms.u_softShadowSteps) this.uniforms.u_softShadowSteps.value = ss;
          } else {
            // Push current param to uniform to avoid stale state
            if (this.uniforms.u_softShadowSteps)
              this.uniforms.u_softShadowSteps.value = this.params.softShadowSteps;
          }
          // Ensure Budget LOD and far shadow skip are active (unless preset overrode)
          if (!this._budgetLODOverridden && this.params.enableBudgetLOD !== true) {
            this.params.enableBudgetLOD = true;
            if (this.uniforms.u_enableBudgetLOD) this.uniforms.u_enableBudgetLOD.value = true;
          }
          if (typeof this.params.farShadowSkipFactor === 'number') {
            const fs = Math.max(this.params.farShadowSkipFactor || 2.0, 2.5);
            this.params.farShadowSkipFactor = fs;
            if (this.uniforms.u_farShadowSkipFactor) this.uniforms.u_farShadowSkipFactor.value = fs;
          }
        }
      }

      // 1b) Curvature default: now ON by default for all fractals (unless user override)
      if (!this._curvOverridden) {
        const curvDefault = DEFAULTS.curvatureAwareRelaxation;
        if (this.params.curvatureAwareRelaxation !== curvDefault) {
          this.params.curvatureAwareRelaxation = curvDefault;
          if (this.uniforms.u_curvatureAwareRelaxation)
            this.uniforms.u_curvatureAwareRelaxation.value = curvDefault;
        }
      }

      // World types → default to Fly Mode for better navigation
      if (type === 5 || type === 6) {
        if (this.params.flyMode !== true) {
          this.params.flyMode = true;
          if (this.callbacks && this.callbacks.onFlyModeToggle)
            this.callbacks.onFlyModeToggle(true);
          // Refresh GUI so the toggle reflects state
          if (this.gui && this.gui.controllersRecursive) {
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          }
        }
        // Safer defaults for World (only when user hasn't tuned)
        if (!this._useSegOverridden) {
          // Prefer sphere tracing with auto safety
          if (this.params.useSegmentTracing !== false) {
            this.params.useSegmentTracing = false;
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = false;
          }
          if (this.params.integratorAuto !== false) {
            this.params.integratorAuto = false;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
          }
        }
        // Conservative step and hit
        if (this.params.stepSafetyAuto !== true) {
          this.params.stepSafetyAuto = true;
          if (this.uniforms.u_stepSafetyAuto) this.uniforms.u_stepSafetyAuto.value = true;
        }
        if (this.params.stepSafety > 0.88) {
          this.params.stepSafety = 0.88;
          if (this.uniforms.u_stepSafety) this.uniforms.u_stepSafety.value = 0.88;
        }
        if (!this._consHitsOverridden && this.params.conservativeHits !== true) {
          this.params.conservativeHits = true;
          if (this.uniforms.u_conservativeHits) this.uniforms.u_conservativeHits.value = true;
        }
        // Dithering defaults: only apply for Amazing Surf (type 5). Truchet (6) keeps dithering OFF by default.
        if (type === 5) {
          // Dithering helps banding on broad surfaces
          if (this.params.enableDithering !== true) {
            this.params.enableDithering = true;
            if (this.uniforms.u_enableDithering) this.uniforms.u_enableDithering.value = true;
          }
          if (this.params.ditheringStrength !== undefined) {
            this.params.ditheringStrength = Math.min(
              0.1,
              Math.max(0.04, this.params.ditheringStrength)
            );
            if (this.uniforms.u_ditheringStrength)
              this.uniforms.u_ditheringStrength.value = this.params.ditheringStrength;
          }
          // Turn off fog dithering by default for World to avoid visible grain in smooth gradients
          if (this.params.ditherFog !== false) {
            this.params.ditherFog = false;
            if (this.uniforms.u_ditherFog) this.uniforms.u_ditherFog.value = false;
          }
          // Softer shadow jitter on World to reduce large-area grain
          if (typeof this.params.shadowDitherStrength === 'number') {
            const target = 0.25;
            if (this.params.shadowDitherStrength > target) {
              this.params.shadowDitherStrength = target;
              if (this.uniforms.u_shadowDitherStrength)
                this.uniforms.u_shadowDitherStrength.value = target;
            }
          }
        }
      }

      // Texture space defaults: non‑World → Local, World → World (unless user override)
      if (!this._texSpaceOverridden) {
        const want = type === 5 ? 0 : 1;
        if (this.params.texSpaceMode !== want) {
          this.params.texSpaceMode = want;
          if (this.uniforms.u_texSpaceMode) this.uniforms.u_texSpaceMode.value = want;
        }
      }

      // 2) Relaxation Min defaults by fractal
      if (!this._relaxMinOverridden) {
        let relaxMin = DEFAULTS.relaxationMin;
        switch (type) {
          case 2: // Mandelbulb
            relaxMin = 0.5;
            break;
          case 1: // Menger
            relaxMin = 0.55;
            break;
          case 4: // Mandelbox
            relaxMin = 0.5;
            break;
          case 3: // Sierpinski
            relaxMin = 0.5;
            break;
          default: // Primitives
            relaxMin = 0.45;
            break;
        }
        if (this.params.relaxationMin !== relaxMin) {
          this.params.relaxationMin = relaxMin;
          if (this.uniforms.u_relaxationMin) this.uniforms.u_relaxationMin.value = relaxMin;
        }
      }

      // 4) Ring-safe clamp for Menger: if curvature relax is ON, cap Step Safety
      //    Very high stepSafety values with curvature can re-introduce bands.
      if (
        this.params.enablePerFractalSafetyTweaks &&
        type === 1 &&
        this.params.curvatureAwareRelaxation &&
        this.params.ringSafeClamp
      ) {
        const safeMax = Math.min(0.98, Math.max(0.7, this.params.ringSafeClampMax || 0.87));
        if (this.params.stepSafety > safeMax) {
          this.params.stepSafety = safeMax;
          if (this.uniforms.u_stepSafety) this.uniforms.u_stepSafety.value = safeMax;
        }
        // Prefer automatic safety on Menger to help near mid-distances
        if (this.params.stepSafetyAuto !== true) {
          this.params.stepSafetyAuto = true;
          if (this.uniforms.u_stepSafetyAuto) this.uniforms.u_stepSafetyAuto.value = true;
        }
      }

      // Refresh controller displays
      if (this.gui && this.gui.controllersRecursive) {
        this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
      }

      // Lightweight per-fractal performance tweaks (only if user hasn't tuned yet)
      if (type === 3) {
        // Sierpinski
        // If still at the default far factor, make it a bit more aggressive for Sierpinski
        if (this.params.budgetStepsFarFactor === DEFAULTS.budgetStepsFarFactor) {
          this.params.budgetStepsFarFactor = 0.6;
          if (this.uniforms.u_budgetStepsFarFactor)
            this.uniforms.u_budgetStepsFarFactor.value = 0.6;
        }
        // Ensure Budget LOD stays enabled (default is ON now)
        if (this.params.enableBudgetLOD !== true) {
          this.params.enableBudgetLOD = true;
          if (this.uniforms.u_enableBudgetLOD) this.uniforms.u_enableBudgetLOD.value = true;
        }
        // Keep Step Safety modest for Sierpinski unless the user chose otherwise
        const sSafe = this.params.stepSafety;
        if (sSafe > 0.92) {
          const safer = 0.9;
          this.params.stepSafety = safer;
          if (this.uniforms.u_stepSafety) this.uniforms.u_stepSafety.value = safer;
        }

        // Slightly brighten ambient if still at global default
        if (this.params.ambientStrength === DEFAULTS.ambientStrength) {
          this.params.ambientStrength = Math.min(0.4, DEFAULTS.ambientStrength + 0.1);
          if (this.uniforms.u_ambientStrength)
            this.uniforms.u_ambientStrength.value = this.params.ambientStrength;
        }
        // Reduce fog density a bit if at default to avoid darkening
        if (this.params.fogDensity === DEFAULTS.fogDensity) {
          this.params.fogDensity = Math.max(0.0, DEFAULTS.fogDensity * 0.75);
          if (this.uniforms.u_fogDensity) this.uniforms.u_fogDensity.value = this.params.fogDensity;
        }
      }

      // Persist migrated values so reloads stay stable
      this.schedulePersist();
    } catch (_) {}

    // No per-frame dirty flags; updates are event-driven
    this._paletteUpdating = false;
  }

  ensureInfoButton(row) {
    try {
      if (!row) return;
      if (row.querySelector('.gui-info-btn')) return;
      const title = row.dataset?.infoTitle || 'Info';
      const text = row.dataset?.infoText || '';
      const btn = document.createElement('button');
      btn.className = 'gui-info-btn';
      btn.type = 'button';
      btn.textContent = 'i';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showInfo(title, text);
      });
      row.style.position = row.style.position || 'relative';
      row.appendChild(btn);
    } catch (_) {}
  }

  ensureAllInfoButtons() {
    try {
      if (!this.gui || !this.gui.controllersRecursive) return;
      this.gui.controllersRecursive().forEach((c) => {
        const row = c && c.domElement;
        if (row && row.dataset && row.dataset.infoTitle) {
          this.ensureInfoButton(row);
        }
      });
    } catch (_) {}
  }

  // --- Folder open/close persistence ---
  initFolderPersistence() {
    const key = 'fractalExplorer_guiFolders_v1';
    const load = () => {
      try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : {};
      } catch (_) {
        return {};
      }
    };
    const save = (state) => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (_) {}
    };

    const state = load();
    // Apply saved state
    const setOpen = (folder, open) => {
      try {
        open ? folder.open() : folder.close();
      } catch (_) {}
    };
    Object.entries(this._folders || {}).forEach(([name, folder]) => {
      if (Object.prototype.hasOwnProperty.call(state, name)) setOpen(folder, !!state[name]);
    });

    // Attach listeners to title buttons
    const root = this.gui && this.gui.domElement;
    if (!root) return;
    const update = () => {
      const cur = load();
      Object.entries(this._folders || {}).forEach(([name, folder]) => {
        try {
          const btn = folder.domElement.querySelector('button.title');
          const expanded = btn ? btn.getAttribute('aria-expanded') === 'true' : true;
          cur[name] = expanded;
        } catch (_) {}
      });
      save(cur);
    };
    // Click listeners on all titles (event delegation fallback)
    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('title')) {
        setTimeout(update, 50);
      }
    });
    // Initial save (ensures keys exist)
    setTimeout(update, 0);
  }

  refreshFolderPersistenceStates() {
    try {
      const s = localStorage.getItem('fractalExplorer_guiFolders_v1');
      if (!s) return;
      const state = JSON.parse(s);
      Object.entries(this._folders || {}).forEach(([name, folder]) => {
        try {
          const open = Object.prototype.hasOwnProperty.call(state, name)
            ? !!state[name]
            : undefined;
          if (open === undefined) return;
          const btn = folder.domElement.querySelector('button.title');
          const expanded = btn ? btn.getAttribute('aria-expanded') === 'true' : undefined;
          if (expanded === undefined) return;
          if (open && expanded === false) folder.open();
          if (!open && expanded === true) folder.close();
        } catch (_) {}
      });
    } catch (_) {}
  }

  setupFolders() {
    const resetSection = (keys) => {
      keys.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(this._defaults, k)) {
          this.params[k] = this._defaults[k];
        }
      });
      this.syncAllUniforms();
      // Refresh all controllers to reflect changes
      if (this.gui && this.gui.controllersRecursive) {
        this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
      }
      this.updateBudgetEstimate();
      this.schedulePersist();
    };
    // Visual Presets Selector (at top level, before folders)
    const presetNames = ['None', ...getPresetNames()];
    const presetOptions = {};
    presetNames.forEach((name) => {
      presetOptions[name] = name;
    });

    const c_preset = this.gui
      .add(this.params, 'preset', presetOptions)
      .name('🎨 Visual Preset')
      .onChange((value) => {
        if (value !== 'None') {
          this.applyPreset(value);
        }
        try {
          localStorage.setItem('fractalExplorer_visualPreset', String(value));
        } catch (_) {}
      });
    this.addInfo(c_preset, 'preset');

    // Fractal Controls Folder
    const fractalFolder = this.gui.addFolder('Fractal');

    const typeOptions = {
      Primitives: 0,
      'Menger Sponge': 1,
      Mandelbulb: 2,
      'Sierpinski Tetrahedron': 3,
      Mandelbox: 4,
      'World (Amazing Surf)': 5,
      'World (Truchet Pipes)': 6,
      'DEC Preview (Experimental)': 7,
    };
    const c_frType = fractalFolder
      .add(this.params, 'fractalType', typeOptions)
      .name('Type')
      .onChange((value) => {
        const v = Number(value) | 0;
        this.uniforms.u_fractalType.value = v;
        try {
          localStorage.setItem('fractalExplorer_fractalType', String(v));
        } catch (_) {}
        this.applyPerFractalDefaults('ui');
        this.schedulePersist();
        // Mirror fly mode state to runtime in case defaults toggled it
        if (this.callbacks && this.callbacks.onFlyModeToggle) {
          try {
            this.callbacks.onFlyModeToggle(!!this.params.flyMode);
          } catch (_) {}
        }
        // Force shader refresh to ensure branch switch is applied immediately
        if (this.callbacks && this.callbacks.requestShaderRefresh) {
          this.callbacks.requestShaderRefresh();
        }
        // Auto-enable DEC preview when switching to DEC type, and choose a
        // sensible default entry if none is selected.
        if ((v | 0) === 7) {
          try {
            if (
              !this.params.decPreviewEnabled &&
              this.callbacks &&
              this.callbacks.onDecPreviewToggle
            ) {
              this.params.decPreviewEnabled = true;
              this.callbacks.onDecPreviewToggle(true);
            }
            if (!this.params.decEntry) {
              const values = Object.values(decOptions || {});
              const pick =
                values.find((m) => /\/primitive\/icosahedron\.glsl$/.test(m)) || values[0];
              if (pick) {
                this.params.decEntry = pick;
                if (this.callbacks.onDecPreviewSelect) this.callbacks.onDecPreviewSelect(pick);
              }
            }
          } catch (_) {}
        }
      });
    // Expose controller for external updates (e.g., DEC preview quick toggle)
    this._ctrlFractalType = c_frType;
    this.addInfo(c_frType, 'fractalType');

    // --- DEC Preview (Experimental) ---------------------------------------
    const decFolder = this.gui.addFolder('DEC Preview');
    decFolder.close();

    // Build entry options map: label -> modulePath used by Vite glob
    const decOptions = {};
    // Built-in test entry to verify path + injection regardless of filesystem
    decOptions['builtin: Test Sphere (internal)'] = 'builtin:test-sphere';
    try {
      const sanitizeTitle = (t) => {
        let s = String(t == null ? '' : t);
        // Drop anything after '{' or '//' (code or comments leaked into titles)
        s = s.split('{')[0];
        s = s.split('//')[0];
        // Remove stray braces and semicolons
        s = s.replace(/[{};]/g, '');
        // Collapse whitespace inside parentheses and around
        s = s.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
        // Collapse multiple spaces
        s = s.replace(/\s+/g, ' ').trim();
        // Fallback
        return s.length ? s : '(untitled)';
      };
      const denyList = new Set([
        // Path as referenced in manifest
        './includes/dec/composed/rack-wheel.glsl',
      ]);
      const isStubEntry = (entry) => {
        const inc = String((entry && entry.include) || '');
        if (denyList.has(inc)) return true;
        const base = inc.split('/').pop().toLowerCase();
        const title = sanitizeTitle((entry && entry.title) || '').toLowerCase();
        if (base.includes('rack-wheel')) return true;
        if (title.includes('rack wheel')) return true;
        // Heuristics: code-like names or function snippets (but keep float-sd* shapes)
        if (/^float[-_]?de[-_]?vec3[-_]?p/.test(base)) return true;
        if (/\/operator\/wip\.glsl$/i.test(inc)) return true;
        if (
          /^mat[234]-/.test(base) ||
          /^vec[234]-/.test(base) ||
          /^define-/.test(base) ||
          /^void-/.test(base)
        )
          return true;
        if (/float\s*de\s*\(\s*vec3\s*p\s*\)/i.test(title)) return true;
        if (/\b(untitled|wip)\b/.test(title)) return true;
        return false;
      };
      if (decManifest && Array.isArray(decManifest.entries)) {
        decManifest.entries.forEach((e) => {
          if (isStubEntry(e)) return; // skip stub-like entries
          // Drop author attribution and sanitize code-like titles
          const label = `${e.category}: ${sanitizeTitle(e.title)}`;
          // Vite module path (relative to src/ui/ import site)
          // Our manifest include is './includes/dec/...'; convert to './shaders/includes/dec/...'
          const modulePath = String(e.include || './includes/dec/unknown.glsl').replace(
            './',
            './shaders/'
          );
          decOptions[label] = modulePath;
        });
      }
    } catch (_) {}

    const c_decEnabled = decFolder
      .add(this.params, 'decPreviewEnabled')
      .name('Enable Preview')
      .onChange((v) => {
        try {
          localStorage.setItem('fractalExplorer_decPreviewEnabled', String(!!v));
        } catch (_) {}
        if (this.callbacks.onDecPreviewToggle) this.callbacks.onDecPreviewToggle(!!v);
      });

    // Restore saved entry if available; otherwise default to first
    // Prefer Icosahedron as the default DEC entry (for parity with current task)
    const keys = Object.keys(decOptions);
    let firstKey = keys[0];
    try {
      const wanted = keys.find((k) => /\/primitive\/icosahedron\.glsl$/.test(decOptions[k] || ''));
      if (wanted) firstKey = wanted;
    } catch (_) {}
    try {
      const savedEntry0 = localStorage.getItem('fractalExplorer_decEntry');
      const values = Object.values(decOptions);
      if (savedEntry0 && values.includes(savedEntry0)) {
        this.params.decEntry = savedEntry0;
      } else if (savedEntry0) {
        // Fallback: suffix match after '/includes/dec/'
        const idx = savedEntry0.indexOf('/includes/dec/');
        const suffix = idx >= 0 ? savedEntry0.slice(idx) : savedEntry0.split('/').pop();
        const match = values.find((v) => v.endsWith(suffix));
        if (match) this.params.decEntry = match;
        else if (firstKey) this.params.decEntry = decOptions[firstKey];
      } else if (firstKey) {
        this.params.decEntry = decOptions[firstKey];
      }
    } catch (_) {
      if (firstKey) this.params.decEntry = decOptions[firstKey];
    }

    const c_decEntry = decFolder
      .add(this.params, 'decEntry', decOptions)
      .name('Entry')
      .onChange((v) => {
        // lil-gui should pass the value, but defensively map labels to values
        const value = decOptions && decOptions[v] ? decOptions[v] : v;
        this.params.decEntry = value;
        try {
          localStorage.setItem('fractalExplorer_decEntry', String(value));
        } catch (_) {}
        // Auto-enable preview on selection so user doesn't end up with stub
        if (!this.params.decPreviewEnabled) {
          this.params.decPreviewEnabled = true;
          try {
            c_decEnabled.setValue(true);
            c_decEnabled.updateDisplay();
          } catch (_) {}
          if (this.callbacks.onDecPreviewToggle) this.callbacks.onDecPreviewToggle(true);
        }
        if (this.callbacks.onDecPreviewSelect) this.callbacks.onDecPreviewSelect(value);
        // If GUI gave us a label, reflect back the value into the dropdown
        try {
          if (value !== v) {
            c_decEntry.setValue(value);
            c_decEntry.updateDisplay();
          }
        } catch (_) {}
        try {
          updateIcoCtrlVisibility();
        } catch (_) {}
      });
    // Initialize preview selection in runtime
    try {
      if (this.callbacks.onDecPreviewSelect && this.params.decEntry)
        this.callbacks.onDecPreviewSelect(this.params.decEntry);
    } catch (_) {}

    // Restore persisted DEC toggle after entry is set
    try {
      const savedDecOn = localStorage.getItem('fractalExplorer_decPreviewEnabled');
      if (savedDecOn !== null) {
        const on = savedDecOn === 'true';
        this.params.decPreviewEnabled = on;
        if (this.callbacks.onDecPreviewToggle) this.callbacks.onDecPreviewToggle(on);
        try {
          c_decEnabled.setValue(on);
          c_decEnabled.updateDisplay();
        } catch (_) {}
      }
    } catch (_) {}

    // DEC placement helpers
    // (Assist Sphere removed)

    const decPosFolder = decFolder.addFolder('Offset');
    decPosFolder.close();
    this.params.decOffsetX = 0.0;
    this.params.decOffsetY = 0.0;
    this.params.decOffsetZ = 0.0;
    const applyOffset = () => {
      if (!this.uniforms || !this.uniforms.u_decOffset) return;
      this.uniforms.u_decOffset.value.set(
        this.params.decOffsetX,
        this.params.decOffsetY,
        this.params.decOffsetZ
      );
    };
    decPosFolder.add(this.params, 'decOffsetX', -5.0, 5.0, 0.01).name('X').onChange(applyOffset);
    decPosFolder.add(this.params, 'decOffsetY', -5.0, 5.0, 0.01).name('Y').onChange(applyOffset);
    decPosFolder.add(this.params, 'decOffsetZ', -5.0, 5.0, 0.01).name('Z').onChange(applyOffset);
    // Initialize uniforms for these controls
    // no-op (assist sphere removed)
    applyOffset();

    // Icosahedron mapping toggle (IQ vs GDF)
    if (this.uniforms && this.uniforms.u_icoUseIQ) {
      this.uniforms.u_icoUseIQ.value = !!this.params.icoUseIQ;
    }
    const c_icoIQ = decFolder
      .add(this.params, 'icoUseIQ')
      .name('Icosahedron: IQ SDF')
      .onChange((v) => {
        if (this.uniforms.u_icoUseIQ) this.uniforms.u_icoUseIQ.value = !!v;
      });
    // Show only when selected DEC entry is an Icosahedron variant
    const isIcoEntry = () => {
      const e = String(this.params.decEntry || '');
      // Only show for the standard Icosahedron entry; alt uses IQ always
      return /\/primitive\/icosahedron\.glsl$/.test(e);
    };
    const updateIcoCtrlVisibility = () => {
      try {
        const row = c_icoIQ && c_icoIQ.domElement;
        if (!row) return;
        row.style.display = isIcoEntry() ? '' : 'none';
      } catch (_) {}
    };
    updateIcoCtrlVisibility();

    // Fast switching (beta) toggle
    this.params.fastDecSwitch = true;
    const _c_fastDec = decFolder
      .add(this.params, 'fastDecSwitch')
      .name('Fast Switching (Beta)')
      .onChange((v) => {
        if (this.callbacks.setFastDecInject) this.callbacks.setFastDecInject(!!v);
      });

    // Center DEC in front of camera
    decFolder
      .add(
        {
          center: () => {
            if (this.callbacks.centerDEC) this.callbacks.centerDEC();
          },
        },
        'center'
      )
      .name('🎯 Center In View');
    // Force DEC at origin (offset=0, scale=1)
    decFolder
      .add(
        {
          origin: () => {
            try {
              this.params.decOffsetX = 0.0;
              this.params.decOffsetY = 0.0;
              this.params.decOffsetZ = 0.0;
              if (this.uniforms && this.uniforms.u_decOffset)
                this.uniforms.u_decOffset.value.set(0, 0, 0);
              this.params.scale = 1.0;
              if (this.uniforms && this.uniforms.u_fractalScale)
                this.uniforms.u_fractalScale.value = 1.0;
              if (this.gui && this.gui.controllersRecursive)
                this.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
            } catch (_) {}
          },
        },
        'origin'
      )
      .name('⟲ Force Origin (scale=1)');
    // Frame DEC by moving the camera
    decFolder
      .add(
        {
          frame: () => {
            if (this.callbacks.frameDEC) this.callbacks.frameDEC();
          },
        },
        'frame'
      )
      .name('🎥 Frame (move camera)');
    // Auto Fit DEC (scale to ~60% height at current distance)
    decFolder
      .add(
        {
          fit: () => {
            if (this.callbacks.autoFitDEC) this.callbacks.autoFitDEC();
          },
        },
        'fit'
      )
      .name('🔍 Auto Fit');

    // Exact match: copy DEC transforms into World, render DEC surface as world
    decFolder
      .add(
        {
          makeWorld: () => {
            try {
              if (typeof window.worldFromDEC === 'function') {
                // Defer slightly to ensure any pending DEC injection has landed
                requestAnimationFrame(() => {
                  try {
                    window.worldFromDEC();
                  } catch (_) {}
                });
              }
            } catch (_) {}
          },
        },
        'makeWorld'
      )
      .name('🌍 Make World from DEC (Exact)');

    // Public method: allow host to change fractal type and sync GUI
    this.setFractalType = (v) => {
      const val = Number(v) | 0;
      this.params.fractalType = val;
      if (this.uniforms && this.uniforms.u_fractalType) this.uniforms.u_fractalType.value = val;
      try {
        localStorage.setItem('fractalExplorer_fractalType', String(val));
      } catch (_) {}
      try {
        this.applyPerFractalDefaults('ui');
      } catch (_) {}
      try {
        this.schedulePersist();
      } catch (_) {}
      try {
        if (this._ctrlFractalType) {
          this._ctrlFractalType.setValue(val);
          this._ctrlFractalType.updateDisplay();
        }
      } catch (_) {}
      try {
        if (this.callbacks && this.callbacks.requestShaderRefresh)
          this.callbacks.requestShaderRefresh();
      } catch (_) {}
    };

    // Defensive DOM hook to ensure the select always drives uniforms (Chrome/macOS quirk)
    try {
      const installTypeDomHook = () => {
        const row = c_frType && c_frType.domElement;
        if (!row) return;
        const sel = row.querySelector('select');
        if (!sel || sel.__parTypeHooked) return;
        // Ensure numeric values for options
        try {
          sel.querySelectorAll('option').forEach((opt) => {
            const label = (opt.textContent || '').trim();
            if (label in typeOptions) opt.value = String(typeOptions[label]);
          });
        } catch (_) {}
        sel.__parTypeHooked = true;
        const handler = () => {
          const parsed = parseInt(sel.value, 10);
          const v = Number.isFinite(parsed) ? parsed : 0;
          this.params.fractalType = v;
          if (this.uniforms.u_fractalType) this.uniforms.u_fractalType.value = v;
          try {
            localStorage.setItem('fractalExplorer_fractalType', String(v));
          } catch (_) {}
          this.applyPerFractalDefaults('ui');
          if (this.callbacks && this.callbacks.requestShaderRefresh)
            this.callbacks.requestShaderRefresh();
          try {
            c_frType.setValue(v);
            c_frType.updateDisplay();
          } catch (_) {}
        };
        sel.addEventListener('change', handler, true);
        sel.addEventListener('input', handler, true);
      };
      installTypeDomHook();
      setTimeout(installTypeDomHook, 0);
      const rowType = c_frType && c_frType.domElement;
      if (rowType && window.MutationObserver) {
        const mo = new MutationObserver(() => installTypeDomHook());
        mo.observe(rowType, { childList: true, subtree: true });
      }
    } catch (_) {}

    this.iterationsController = fractalFolder
      .add(this.params, 'iterations', 1, 20, 1)
      .name('Iterations')
      .onChange((value) => {
        this.uniforms.u_iterations.value = value;
      });
    this.addInfo(this.iterationsController, 'iterations');

    const c_power = fractalFolder
      .add(this.params, 'power', 2.0, 16.0, 0.1)
      .name('Power (Mandelbulb)')
      .onChange((value) => {
        this.uniforms.u_fractalPower.value = value;
      });
    this.addInfo(c_power, 'power');

    const c_scale = fractalFolder
      .add(this.params, 'scale', 0.1, 3.0, 0.1)
      .name('Scale')
      .onChange((value) => {
        this.uniforms.u_fractalScale.value = value;
      });
    this.addInfo(c_scale, 'scale');

    // World (Amazing Surf) controls
    const worldFolder = fractalFolder.addFolder('World');
    const c_wtile = worldFolder
      .add(this.params, 'worldTile', 4.0, 40.0, 0.5)
      .name('Tile Period')
      .onChange((v) => {
        if (this.uniforms.u_worldTile) this.uniforms.u_worldTile.value = v;
      });
    this.addInfo(c_wtile, 'worldTile');
    const c_wth = worldFolder
      .add(this.params, 'worldThickness', 0.02, 0.6, 0.01)
      .name('Shell Thickness')
      .onChange((v) => {
        if (this.uniforms.u_worldThickness) this.uniforms.u_worldThickness.value = v;
      });
    this.addInfo(c_wth, 'worldThickness');
    const c_wwarp = worldFolder
      .add(this.params, 'worldWarp', 0.0, 1.0, 0.01)
      .name('Domain Warp')
      .onChange((v) => {
        if (this.uniforms.u_worldWarp) this.uniforms.u_worldWarp.value = v;
      });
    this.addInfo(c_wwarp, 'worldWarp');
    const c_wdes = worldFolder
      .add(this.params, 'worldDeScale', 0.6, 1.0, 0.01)
      .name('DE Safety')
      .onChange((v) => {
        if (this.uniforms.u_worldDeScale) this.uniforms.u_worldDeScale.value = v;
      });
    this.addInfo(c_wdes, 'worldDeScale');
    const c_wseg = worldFolder
      .add(this.params, 'worldSegClamp', 0.6, 1.0, 0.01)
      .name('Segment Clamp')
      .onChange((v) => {
        if (this.uniforms.u_worldSegClamp) this.uniforms.u_worldSegClamp.value = v;
      });
    this.addInfo(c_wseg, 'worldSegClamp');
    const c_wdstr = worldFolder
      .add(this.params, 'worldDetailStrength', 0.0, 1.0, 0.01)
      .name('Detail Strength')
      .onChange((v) => {
        if (this.uniforms.u_worldDetailStrength) this.uniforms.u_worldDetailStrength.value = v;
      });
    this.addInfo(c_wdstr, 'worldDetailStrength');
    const c_wdsc = worldFolder
      .add(this.params, 'worldDetailScale', 0.2, 3.0, 0.05)
      .name('Detail Scale')
      .onChange((v) => {
        if (this.uniforms.u_worldDetailScale) this.uniforms.u_worldDetailScale.value = v;
      });
    this.addInfo(c_wdsc, 'worldDetailScale');
    const c_wfog = worldFolder
      .add(this.params, 'worldFogAuto')
      .name('Auto Fog (Linear)')
      .onChange((_v) => {
        this.applyWorldFogAuto();
      });
    this.addInfo(c_wfog, 'worldFogAuto');
    const c_wautoInt = worldFolder
      .add(this.params, 'worldAutoIntegrator')
      .name('Auto Integrator (World)')
      .onChange((_v) => {
        /* runtime reacts in main.animate */
      });
    this.addInfo(c_wautoInt, 'worldAutoIntegrator');

    // Procedural Texture (Global)
    const texFolder = this.gui.addFolder('Procedural Texture');
    // Texture Quality macro preset (maps to perf + LOD dials)
    const texQualityOptions = { Performance: 'Performance', Balanced: 'Balanced', Crisp: 'Crisp' };
    texFolder
      .add(this.params, 'textureQuality', texQualityOptions)
      .name('Texture Quality')
      .onChange((v) => this.applyTextureQuality(v));
    const c_applyTex = texFolder
      .add(this.params, 'applyProceduralTextures')
      .name('Enabled')
      .onChange((v) => {
        if (this.uniforms.u_texturesEnabled) this.uniforms.u_texturesEnabled.value = !!v;
      });
    this.addInfo(c_applyTex, 'applyProceduralTextures');
    // Apply target: Fractal, Floor, or Both
    const applyOptions = { Fractal: 0, Floor: 1, Both: 2 };
    const c_applyTarget = texFolder
      .add(this.params, 'textureApplyTarget', applyOptions)
      .name('Apply To')
      .onChange((v) => {
        if (this.uniforms.u_texApplyTarget) this.uniforms.u_texApplyTarget.value = Number(v) | 0;
      });
    this._INFO.textureApplyTarget = [
      'Apply To',
      'Select where the procedural textures are applied: Fractal only, Floor only, or Both.',
    ];
    this.addInfo(c_applyTarget, 'textureApplyTarget');
    // Floor options
    // Floor mode selector (Fast vs Full)
    const floorModeOptions = { 'Fast (2D)': 0, 'Full (Triplanar)': 1 };
    const c_floorMode = texFolder
      .add(this.params, 'floorTextureMode', floorModeOptions)
      .name('Floor Mode')
      .onChange((v) => {
        if (this.uniforms.u_floorTexMode) this.uniforms.u_floorTexMode.value = Number(v) | 0;
      });
    this._INFO.floorTextureMode = [
      'Floor Mode',
      'Fast (2D) uses a single XZ projection with a cheaper gradient; typically ~3–5× faster. Full (Triplanar) matches fractal texturing exactly but is heavier.',
    ];
    this.addInfo(c_floorMode, 'floorTextureMode');

    const c_floorWarp = texFolder
      .add(this.params, 'floorIgnoreWarp')
      .name('Ignore Warp (Floor)')
      .onChange((v) => {
        if (this.uniforms.u_floorIgnoreWarp) this.uniforms.u_floorIgnoreWarp.value = !!v;
      });
    this._INFO.floorIgnoreWarp = [
      'Ignore Warp (Floor)',
      'Skips the global domain warp when sampling floor textures. Great for speed; small change in look for warped presets.',
    ];
    this.addInfo(c_floorWarp, 'floorIgnoreWarp');

    const c_floorBump = texFolder
      .add(this.params, 'floorBumpScale', 0.0, 1.0, 0.01)
      .name('Floor Bump Scale')
      .onChange((v) => {
        if (this.uniforms.u_floorBumpScale) this.uniforms.u_floorBumpScale.value = v;
      });
    this._INFO.floorBumpScale = [
      'Floor Bump Scale',
      'Scales the bump/normal perturbation on the floor. 0 disables floor bump.',
    ];
    this.addInfo(c_floorBump, 'floorBumpScale');

    const c_floorSpec = texFolder
      .add(this.params, 'floorSpecScale', 0.0, 1.0, 0.01)
      .name('Floor Spec Scale')
      .onChange((v) => {
        if (this.uniforms.u_floorSpecScale) this.uniforms.u_floorSpecScale.value = v;
      });
    this._INFO.floorSpecScale = [
      'Floor Spec Scale',
      'Scales how much the floor textures modulate specular. 0 disables spec modulation on floor.',
    ];
    this.addInfo(c_floorSpec, 'floorSpecScale');

    // Floor LOD controls
    const floorLODFolder = texFolder.addFolder('Floor LOD');
    const c_autoLOD = floorLODFolder
      .add(this.params, 'floorTexAutoDisable')
      .name('Auto Disable (LOD Far×k)')
      .onChange((v) => {
        if (this.uniforms.u_floorTexAutoDisable) this.uniforms.u_floorTexAutoDisable.value = !!v;
      });
    const c_autoMul = floorLODFolder
      .add(this.params, 'floorTexAutoMul', 0.8, 3.0, 0.05)
      .name('k (Disable Dist = LOD Far×k)')
      .onChange((v) => {
        if (this.uniforms.u_floorTexAutoMul) this.uniforms.u_floorTexAutoMul.value = v;
      });
    const c_disableDist = floorLODFolder
      .add(this.params, 'floorTexDisableDist', 0.0, 200.0, 0.5)
      .name('Disable Dist (Manual)')
      .onChange((v) => {
        if (this.uniforms.u_floorTexDisableDist) this.uniforms.u_floorTexDisableDist.value = v;
      });
    const c_fadeN = floorLODFolder
      .add(this.params, 'floorFadeNear', 0.0, 200.0, 0.5)
      .name('Fade Near (Bump/Spec)')
      .onChange((v) => {
        if (this.uniforms.u_floorFadeNear) this.uniforms.u_floorFadeNear.value = v;
      });
    const c_fadeF = floorLODFolder
      .add(this.params, 'floorFadeFar', 0.0, 200.0, 0.5)
      .name('Fade Far (Bump/Spec)')
      .onChange((v) => {
        if (this.uniforms.u_floorFadeFar) this.uniforms.u_floorFadeFar.value = v;
      });
    this._INFO.floorTexAutoDisable = [
      'Auto Disable Floor Textures',
      'Disables floor texturing beyond LOD Far×k to save GPU when the ground is far.',
    ];
    this._INFO.floorTexAutoMul = [
      'k (Disable Dist = LOD Far×k)',
      'Multiplier against LOD Far used when Auto Disable is ON.',
    ];
    this._INFO.floorTexDisableDist = [
      'Disable Dist (Manual)',
      'Manual distance to disable floor texturing. 0 turns off manual disable.',
    ];
    this._INFO.floorFadeNear = [
      'Fade Near (Bump/Spec)',
      'Start distance for fading floor bump/spec to 0.',
    ];
    this._INFO.floorFadeFar = [
      'Fade Far (Bump/Spec)',
      'End distance for fading floor bump/spec to 0.',
    ];
    this.addInfo(c_autoLOD, 'floorTexAutoDisable');
    this.addInfo(c_autoMul, 'floorTexAutoMul');
    this.addInfo(c_disableDist, 'floorTexDisableDist');
    this.addInfo(c_fadeN, 'floorFadeNear');
    this.addInfo(c_fadeF, 'floorFadeFar');
    // Quick presets for texture looks
    const texPresets = {
      None: 'none',
      Rock: 'rock',
      'Rock (Warped)': 'rock_warped',
      Marble: 'marble',
      Cloud: 'cloud',
      'Worn Metal': 'metal',
      'Hex Truchet (Gold)': 'hextruchet',
      'Floor Performance': 'floor_perf',
      'Floor Quality': 'floor_quality',
    };
    const texPresetProxy = { preset: 'none' };
    const c_texPreset = texFolder
      .add(texPresetProxy, 'preset', texPresets)
      .name('Preset')
      .onChange((v) => this.applyTexturePreset(v));
    this.addInfo(c_texPreset, 'worldTexType');
    const texTypeOptions = { None: 0, FBM: 1, Noise: 2, Truchet: 3, 'Hex Truchet': 4, Checker: 5 };
    const c_texType = texFolder
      .add(this.params, 'worldTexType', texTypeOptions)
      .name('Type')
      .onChange((v) => {
        if (this.uniforms.u_worldTexType) this.uniforms.u_worldTexType.value = Number(v) | 0;
      });
    this.addInfo(c_texType, 'worldTexType');
    const c_texScale = texFolder
      .add(this.params, 'worldTexScale', 0.2, 50.0, 0.05)
      .name('Scale')
      .onChange((v) => {
        if (this.uniforms.u_worldTexScale) this.uniforms.u_worldTexScale.value = v;
        // If link is enabled, drive B from A
        if (this.params.texScaleLinkEnabled) {
          const nb = v * (this.params.texScaleLinkK || 1.0);
          this.params.worldTexScaleB = nb;
          if (this.uniforms.u_worldTexScaleB) this.uniforms.u_worldTexScaleB.value = nb;
          try {
            c_texScaleB.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texScale, 'worldTexScale');
    const c_texCol = texFolder
      .add(this.params, 'worldTexColorStrength', 0.0, 1.0, 0.01)
      .name('Color Strength')
      .onChange((v) => {
        if (this.uniforms.u_worldTexColorStrength) this.uniforms.u_worldTexColorStrength.value = v;
        if (this.params.texColorLinkEnabled) {
          const nb = v * (this.params.texColorLinkK || 1.0);
          this.params.worldTexColorStrengthB = nb;
          if (this.uniforms.u_worldTexColorStrengthB)
            this.uniforms.u_worldTexColorStrengthB.value = nb;
          try {
            c_texColB.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texCol, 'worldTexColorStrength');
    const c_texBump = texFolder
      .add(this.params, 'worldTexBumpStrength', 0.0, 1.0, 0.01)
      .name('Bump Strength')
      .onChange((v) => {
        if (this.uniforms.u_worldTexBumpStrength) this.uniforms.u_worldTexBumpStrength.value = v;
        if (this.params.texBumpLinkEnabled) {
          const nb = v * (this.params.texBumpLinkK || 1.0);
          this.params.worldTexBumpStrengthB = nb;
          if (this.uniforms.u_worldTexBumpStrengthB)
            this.uniforms.u_worldTexBumpStrengthB.value = nb;
          try {
            c_texBumpB.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texBump, 'worldTexBumpStrength');
    const c_texSpec = texFolder
      .add(this.params, 'worldTexSpecStrength', 0.0, 1.0, 0.01)
      .name('Specular Mod')
      .onChange((v) => {
        if (this.uniforms.u_worldTexSpecStrength) this.uniforms.u_worldTexSpecStrength.value = v;
        if (this.params.texSpecLinkEnabled) {
          const nb = v * (this.params.texSpecLinkK || 1.0);
          this.params.worldTexSpecStrengthB = nb;
          if (this.uniforms.u_worldTexSpecStrengthB)
            this.uniforms.u_worldTexSpecStrengthB.value = nb;
          try {
            c_texSpecB.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texSpec, 'worldTexSpecStrength');

    // Domain warp controls (global)
    const warpFolder = texFolder.addFolder('Warp');
    const c_warpStr = warpFolder
      .add(this.params, 'texWarpStrength', 0.0, 2.0, 0.01)
      .name('Warp Strength')
      .onChange((v) => {
        if (this.uniforms.u_texWarpStrength) this.uniforms.u_texWarpStrength.value = v;
      });
    const c_warpScale = warpFolder
      .add(this.params, 'texWarpScale', 0.05, 12.0, 0.05)
      .name('Warp Scale')
      .onChange((v) => {
        if (this.uniforms.u_texWarpScale) this.uniforms.u_texWarpScale.value = v;
      });
    const c_warpOct = warpFolder
      .add(this.params, 'texWarpOctaves', 1, 6, 1)
      .name('Warp Octaves')
      .onChange((v) => {
        if (this.uniforms.u_texWarpOctaves) this.uniforms.u_texWarpOctaves.value = v | 0;
      });
    const c_warpType = warpFolder
      .add(this.params, 'texWarpType', { None: 0, FBM: 1, Ridged: 2 })
      .name('Warp Type')
      .onChange((v) => {
        if (this.uniforms.u_texWarpType) this.uniforms.u_texWarpType.value = Number(v) | 0;
      });
    // Tooltips
    this._INFO.texWarpStrength = [
      'Warp Strength',
      'Amount of domain warp applied to texture coordinates (0–2). Higher values increase vein curvature/distortion.',
    ];
    this._INFO.texWarpScale = [
      'Warp Scale',
      'Spatial scale of the warp field (higher = finer turbulence).',
    ];
    this._INFO.texWarpOctaves = [
      'Warp Octaves',
      'Number of FBM octaves used to build the warp field (1–6).',
    ];
    this._INFO.texWarpType = [
      'Warp Type',
      'FBM = smooth. Ridged = sharper creased turbulence; great for marble veins.',
    ];
    this.addInfo(c_warpStr, 'texWarpStrength');
    this.addInfo(c_warpScale, 'texWarpScale');
    this.addInfo(c_warpOct, 'texWarpOctaves');
    this.addInfo(c_warpType, 'texWarpType');

    // Texture LOD (derivative-based)
    const texLodFolder = texFolder.addFolder('Texture LOD');
    const c_texLODOn = texLodFolder
      .add(this.params, 'texLODEnabled')
      .name('Enable Texture LOD')
      .onChange((v) => {
        if (this.uniforms.u_texLODEnabled) this.uniforms.u_texLODEnabled.value = !!v;
      });
    const c_octDrop = texLodFolder
      .add(this.params, 'texDerivOctDrop', 0, 6, 1)
      .name('Drop FBM Octaves (max)')
      .onChange((v) => {
        if (this.uniforms.u_texDerivOctDrop) this.uniforms.u_texDerivOctDrop.value = v | 0;
      });
    const c_minOct = texLodFolder
      .add(this.params, 'texDerivMinOct', 1, 8, 1)
      .name('Min FBM Octaves')
      .onChange((v) => {
        if (this.uniforms.u_texDerivMinOct) this.uniforms.u_texDerivMinOct.value = v | 0;
      });
    const c_warpDrop = texLodFolder
      .add(this.params, 'texWarpOctDrop', 0, 4, 1)
      .name('Drop Warp Octaves (max)')
      .onChange((v) => {
        if (this.uniforms.u_texWarpOctDrop) this.uniforms.u_texWarpOctDrop.value = v | 0;
      });
    const c_bumpL = texLodFolder
      .add(this.params, 'texLODBumpFactor', 0.0, 1.0, 0.01)
      .name('Far Bump Factor')
      .onChange((v) => {
        if (this.uniforms.u_texLODBumpFactor) this.uniforms.u_texLODBumpFactor.value = v;
      });
    const c_specL = texLodFolder
      .add(this.params, 'texLODSpecFactor', 0.0, 1.0, 0.01)
      .name('Far Spec Factor')
      .onChange((v) => {
        if (this.uniforms.u_texLODSpecFactor) this.uniforms.u_texLODSpecFactor.value = v;
      });
    const _c_lodAgg = texLodFolder
      .add(this.params, 'texDerivAggression', 0.5, 2.0, 0.05)
      .name('LOD Aggression')
      .onChange((v) => {
        if (this.uniforms.u_texDerivAggression) this.uniforms.u_texDerivAggression.value = v;
      });
    const _c_bDeriv = texLodFolder
      .add(this.params, 'texBumpDerivFade', 0.0, 1.0, 0.05)
      .name('Bump Deriv Fade')
      .onChange((v) => {
        if (this.uniforms.u_texBumpDerivFade) this.uniforms.u_texBumpDerivFade.value = v;
      });
    const _c_sDeriv = texLodFolder
      .add(this.params, 'texSpecDerivFade', 0.0, 1.0, 0.05)
      .name('Spec Deriv Fade')
      .onChange((v) => {
        if (this.uniforms.u_texSpecDerivFade) this.uniforms.u_texSpecDerivFade.value = v;
      });
    const _c_rFade = texLodFolder
      .add(this.params, 'texRoughFadeK', 0.0, 4.0, 0.05)
      .name('Roughness Fade K')
      .onChange((v) => {
        if (this.uniforms.u_texRoughFadeK) this.uniforms.u_texRoughFadeK.value = v;
      });
    this._INFO.texLODEnabled = [
      'Enable Texture LOD',
      'Couple procedural textures to LOD: drop FBM/warp octaves and reduce bump/spec at high derivatives (far/oblique).',
    ];
    this._INFO.texDerivOctDrop = [
      'Drop FBM Octaves (max)',
      'Maximum number of FBM octaves to remove at high derivatives.',
    ];
    this._INFO.texDerivMinOct = ['Min FBM Octaves', 'Lower bound for FBM octaves after LOD drops.'];
    this._INFO.texWarpOctDrop = [
      'Drop Warp Octaves',
      'Reduces warp FBM octaves at high derivatives to save cost.',
    ];
    this._INFO.texLODBumpFactor = [
      'Far Bump Factor',
      'Scale for bump at high derivatives (0 disables bump when far).',
    ];
    this._INFO.texLODSpecFactor = [
      'Far Spec Factor',
      'Scale for spec modulation at high derivatives (0 disables when far).',
    ];
    this.addInfo(c_texLODOn, 'texLODEnabled');
    this.addInfo(c_octDrop, 'texDerivOctDrop');
    this.addInfo(c_minOct, 'texDerivMinOct');
    this.addInfo(c_warpDrop, 'texWarpOctDrop');
    this.addInfo(c_bumpL, 'texLODBumpFactor');
    this.addInfo(c_specL, 'texLODSpecFactor');
    // Optional distance-based fade (bump/spec)
    const distFadeFolder = texLodFolder.addFolder('Distance Fade');
    const c_texFadeNear = distFadeFolder
      .add(this.params, 'texFadeNear', 0.0, 200.0, 0.5)
      .name('Fade Near')
      .onChange((v) => {
        if (this.uniforms.u_texFadeNear) this.uniforms.u_texFadeNear.value = v;
      });
    const c_texFadeFar = distFadeFolder
      .add(this.params, 'texFadeFar', 0.0, 400.0, 0.5)
      .name('Fade Far')
      .onChange((v) => {
        if (this.uniforms.u_texFadeFar) this.uniforms.u_texFadeFar.value = v;
      });
    this._INFO.texFadeNear = [
      'Fade Near',
      'Start distance where procedural bump/spec begin to fade out on fractal surfaces (0 disables).',
    ];
    this._INFO.texFadeFar = [
      'Fade Far',
      'End distance where procedural bump/spec are fully faded (must be > Near).',
    ];
    this.addInfo(c_texFadeNear, 'texFadeNear');
    this.addInfo(c_texFadeFar, 'texFadeFar');

    // Layer color mapping (Texture color mode)
    const layerColorFolder = texFolder.addFolder('Layer Colors (Texture Mode)');
    const c_layerOn = layerColorFolder
      .add(this.params, 'texLayerColoring')
      .name('Enable Per-Layer Colors')
      .onChange((v) => {
        if (this.uniforms.u_texLayerColoring) this.uniforms.u_texLayerColoring.value = !!v;
        // If enabling per-layer colors, default blend to Mix for intuitive results
        if (v && this.params.worldTexBlendMode !== 0) {
          this.params.worldTexBlendMode = 0;
          if (this.uniforms.u_worldTexBlendMode) this.uniforms.u_worldTexBlendMode.value = 0;
          // Nudge alphas to balanced defaults
          this.params.worldTexBlendAlphaColor = 0.45;
          this.params.worldTexBlendAlphaBump = 0.45;
          this.params.worldTexBlendAlphaSpec = 0.45;
          if (this.uniforms.u_worldTexBlendAlphaColor)
            this.uniforms.u_worldTexBlendAlphaColor.value = 0.45;
          if (this.uniforms.u_worldTexBlendAlphaBump)
            this.uniforms.u_worldTexBlendAlphaBump.value = 0.45;
          if (this.uniforms.u_worldTexBlendAlphaSpec)
            this.uniforms.u_worldTexBlendAlphaSpec.value = 0.45;
        }
      });
    const c_aBase = layerColorFolder
      .addColor(this.params, 'texAColorBase')
      .name('Layer A Base')
      .onChange((v) => {
        if (this.uniforms.u_texA_colorBase) {
          const c = new THREE.Color(v);
          this.uniforms.u_texA_colorBase.value.copy(c);
        }
      });
    const c_aAcc = layerColorFolder
      .addColor(this.params, 'texAColorAccent')
      .name('Layer A Accent')
      .onChange((v) => {
        if (this.uniforms.u_texA_colorAccent) {
          const c = new THREE.Color(v);
          this.uniforms.u_texA_colorAccent.value.copy(c);
        }
      });
    const c_bBase = layerColorFolder
      .addColor(this.params, 'texBColorBase')
      .name('Layer B Base')
      .onChange((v) => {
        if (this.uniforms.u_texB_colorBase) {
          const c = new THREE.Color(v);
          this.uniforms.u_texB_colorBase.value.copy(c);
        }
      });
    const c_bAcc = layerColorFolder
      .addColor(this.params, 'texBColorAccent')
      .name('Layer B Accent')
      .onChange((v) => {
        if (this.uniforms.u_texB_colorAccent) {
          const c = new THREE.Color(v);
          this.uniforms.u_texB_colorAccent.value.copy(c);
        }
      });
    this._INFO.texLayerColoring = [
      'Per-Layer Colors',
      'When Color Mode = Texture, color Layer A and Layer B independently, then blend using the texture Blend Mode.',
    ];
    this._INFO.texAColorBase = ['Layer A Base', 'Base color for Layer A in Texture color mode.'];
    this._INFO.texAColorAccent = [
      'Layer A Accent',
      'Accent/vein color for Layer A; mixed by its texture value.',
    ];
    this._INFO.texBColorBase = ['Layer B Base', 'Base color for Layer B in Texture color mode.'];
    this._INFO.texBColorAccent = [
      'Layer B Accent',
      'Accent/vein color for Layer B; mixed by its texture value.',
    ];
    this.addInfo(c_layerOn, 'texLayerColoring');
    this.addInfo(c_aBase, 'texAColorBase');
    this.addInfo(c_aAcc, 'texAColorAccent');
    this.addInfo(c_bBase, 'texBColorBase');
    this.addInfo(c_bAcc, 'texBColorAccent');

    // Convenience actions for per-layer color mapping
    const layerActions = {
      copyAtoB: () => {
        try {
          this.params.texBColorBase = this.params.texAColorBase;
          this.params.texBColorAccent = this.params.texAColorAccent;
          if (this.uniforms.u_texB_colorBase) {
            const c = new THREE.Color(this.params.texBColorBase);
            this.uniforms.u_texB_colorBase.value.copy(c);
          }
          if (this.uniforms.u_texB_colorAccent) {
            const c2 = new THREE.Color(this.params.texBColorAccent);
            this.uniforms.u_texB_colorAccent.value.copy(c2);
          }
          // Refresh GUI rows
          if (layerColorFolder && layerColorFolder.controllersRecursive) {
            layerColorFolder
              .controllersRecursive()
              .forEach((ctrl) => ctrl.updateDisplay && ctrl.updateDisplay());
          }
          this.schedulePersist();
        } catch (_) {}
      },
      swapAB: () => {
        try {
          const aB = this.params.texAColorBase;
          const aA = this.params.texAColorAccent;
          this.params.texAColorBase = this.params.texBColorBase;
          this.params.texAColorAccent = this.params.texBColorAccent;
          this.params.texBColorBase = aB;
          this.params.texBColorAccent = aA;
          if (this.uniforms.u_texA_colorBase) {
            const cA0 = new THREE.Color(this.params.texAColorBase);
            this.uniforms.u_texA_colorBase.value.copy(cA0);
          }
          if (this.uniforms.u_texA_colorAccent) {
            const cA1 = new THREE.Color(this.params.texAColorAccent);
            this.uniforms.u_texA_colorAccent.value.copy(cA1);
          }
          if (this.uniforms.u_texB_colorBase) {
            const cB0 = new THREE.Color(this.params.texBColorBase);
            this.uniforms.u_texB_colorBase.value.copy(cB0);
          }
          if (this.uniforms.u_texB_colorAccent) {
            const cB1 = new THREE.Color(this.params.texBColorAccent);
            this.uniforms.u_texB_colorAccent.value.copy(cB1);
          }
          if (layerColorFolder && layerColorFolder.controllersRecursive) {
            layerColorFolder
              .controllersRecursive()
              .forEach((ctrl) => ctrl.updateDisplay && ctrl.updateDisplay());
          }
          this.schedulePersist();
        } catch (_) {}
      },
    };
    layerColorFolder.add(layerActions, 'copyAtoB').name('Copy A→B Colors');
    layerColorFolder.add(layerActions, 'swapAB').name('Swap A↔B Colors');

    // Layer param convenience
    const layerParamActions = {
      copyParamsAToB: () => {
        const keys = [
          'worldTexType',
          'worldTexScale',
          'worldTexColorStrength',
          'worldTexBumpStrength',
          'worldTexSpecStrength',
        ];
        const map = {
          worldTexType: 'worldTexTypeB',
          worldTexScale: 'worldTexScaleB',
          worldTexColorStrength: 'worldTexColorStrengthB',
          worldTexBumpStrength: 'worldTexBumpStrengthB',
          worldTexSpecStrength: 'worldTexSpecStrengthB',
        };
        keys.forEach((k) => {
          const kb = map[k];
          this.params[kb] = this.params[k];
        });
        if (this.uniforms.u_worldTexTypeB)
          this.uniforms.u_worldTexTypeB.value = this.params.worldTexTypeB | 0;
        if (this.uniforms.u_worldTexScaleB)
          this.uniforms.u_worldTexScaleB.value = this.params.worldTexScaleB;
        if (this.uniforms.u_worldTexColorStrengthB)
          this.uniforms.u_worldTexColorStrengthB.value = this.params.worldTexColorStrengthB;
        if (this.uniforms.u_worldTexBumpStrengthB)
          this.uniforms.u_worldTexBumpStrengthB.value = this.params.worldTexBumpStrengthB;
        if (this.uniforms.u_worldTexSpecStrengthB)
          this.uniforms.u_worldTexSpecStrengthB.value = this.params.worldTexSpecStrengthB;
        this.schedulePersist();
      },
      copyParamsBToA: () => {
        const keys = [
          'worldTexTypeB',
          'worldTexScaleB',
          'worldTexColorStrengthB',
          'worldTexBumpStrengthB',
          'worldTexSpecStrengthB',
        ];
        const map = {
          worldTexTypeB: 'worldTexType',
          worldTexScaleB: 'worldTexScale',
          worldTexColorStrengthB: 'worldTexColorStrength',
          worldTexBumpStrengthB: 'worldTexBumpStrength',
          worldTexSpecStrengthB: 'worldTexSpecStrength',
        };
        keys.forEach((k) => {
          const ka = map[k];
          this.params[ka] = this.params[k];
        });
        if (this.uniforms.u_worldTexType)
          this.uniforms.u_worldTexType.value = this.params.worldTexType | 0;
        if (this.uniforms.u_worldTexScale)
          this.uniforms.u_worldTexScale.value = this.params.worldTexScale;
        if (this.uniforms.u_worldTexColorStrength)
          this.uniforms.u_worldTexColorStrength.value = this.params.worldTexColorStrength;
        if (this.uniforms.u_worldTexBumpStrength)
          this.uniforms.u_worldTexBumpStrength.value = this.params.worldTexBumpStrength;
        if (this.uniforms.u_worldTexSpecStrength)
          this.uniforms.u_worldTexSpecStrength.value = this.params.worldTexSpecStrength;
        this.schedulePersist();
      },
      swapLayers: () => {
        const a = {
          t: this.params.worldTexType,
          s: this.params.worldTexScale,
          c: this.params.worldTexColorStrength,
          b: this.params.worldTexBumpStrength,
          p: this.params.worldTexSpecStrength,
        };
        this.params.worldTexType = this.params.worldTexTypeB;
        this.params.worldTexScale = this.params.worldTexScaleB;
        this.params.worldTexColorStrength = this.params.worldTexColorStrengthB;
        this.params.worldTexBumpStrength = this.params.worldTexBumpStrengthB;
        this.params.worldTexSpecStrength = this.params.worldTexSpecStrengthB;
        this.params.worldTexTypeB = a.t;
        this.params.worldTexScaleB = a.s;
        this.params.worldTexColorStrengthB = a.c;
        this.params.worldTexBumpStrengthB = a.b;
        this.params.worldTexSpecStrengthB = a.p;
        if (this.uniforms.u_worldTexType)
          this.uniforms.u_worldTexType.value = this.params.worldTexType | 0;
        if (this.uniforms.u_worldTexScale)
          this.uniforms.u_worldTexScale.value = this.params.worldTexScale;
        if (this.uniforms.u_worldTexTypeB)
          this.uniforms.u_worldTexTypeB.value = this.params.worldTexTypeB | 0;
        if (this.uniforms.u_worldTexScaleB)
          this.uniforms.u_worldTexScaleB.value = this.params.worldTexScaleB;
        if (this.gui && this.gui.controllersRecursive)
          this.gui
            .controllersRecursive()
            .forEach((ctrl) => ctrl.updateDisplay && ctrl.updateDisplay());
        this.schedulePersist();
      },
      forceMixBlend: () => {
        this.params.worldTexBlendMode = 0;
        this.params.worldTexBlendAlphaColor = 0.45;
        this.params.worldTexBlendAlphaBump = 0.45;
        this.params.worldTexBlendAlphaSpec = 0.45;
        if (this.uniforms.u_worldTexBlendMode) this.uniforms.u_worldTexBlendMode.value = 0;
        if (this.uniforms.u_worldTexBlendAlphaColor)
          this.uniforms.u_worldTexBlendAlphaColor.value = 0.45;
        if (this.uniforms.u_worldTexBlendAlphaBump)
          this.uniforms.u_worldTexBlendAlphaBump.value = 0.45;
        if (this.uniforms.u_worldTexBlendAlphaSpec)
          this.uniforms.u_worldTexBlendAlphaSpec.value = 0.45;
        this.schedulePersist();
      },
    };
    layerColorFolder.add(layerParamActions, 'copyParamsAToB').name('Copy A→B Params');
    layerColorFolder.add(layerParamActions, 'copyParamsBToA').name('Copy B→A Params');
    layerColorFolder.add(layerParamActions, 'swapLayers').name('Swap A↔B Params');
    layerColorFolder.add(layerParamActions, 'forceMixBlend').name('Use Mix Blend');

    // Directional anisotropy
    const anisoFolder = texFolder.addFolder('Anisotropy');
    const c_anisoF = anisoFolder
      .add(this.params, 'texAnisoFactor', 0.2, 2.0, 0.02)
      .name('Directional Stretch')
      .onChange((v) => {
        if (this.uniforms.u_texAnisoFactor) this.uniforms.u_texAnisoFactor.value = v;
      });
    const c_anisoAxis = anisoFolder
      .add(this.params, 'texAnisoAxis', { X: 0, Y: 1, Z: 2 })
      .name('Axis')
      .onChange((v) => {
        if (this.uniforms.u_texAnisoAxis) this.uniforms.u_texAnisoAxis.value = Number(v) | 0;
      });
    this._INFO.texAnisoFactor = [
      'Directional Stretch',
      'Scales texture coordinates along the selected axis. <1 compresses (veins align along axis), >1 stretches.',
    ];
    this._INFO.texAnisoAxis = [
      'Axis',
      'Axis along which to apply the directional stretch (e.g., Y for vertical veins).',
    ];
    this.addInfo(c_anisoF, 'texAnisoFactor');
    this.addInfo(c_anisoAxis, 'texAnisoAxis');

    // Layer B + Blend
    const c_texTypeB = texFolder
      .add(this.params, 'worldTexTypeB', texTypeOptions)
      .name('Type B')
      .onChange((v) => {
        if (this.uniforms.u_worldTexTypeB) this.uniforms.u_worldTexTypeB.value = Number(v) | 0;
      });
    this.addInfo(c_texTypeB, 'worldTexType');
    const c_texScaleB = texFolder
      .add(this.params, 'worldTexScaleB', 0.2, 50.0, 0.05)
      .name('Scale B')
      .onChange((v) => {
        if (this.uniforms.u_worldTexScaleB) this.uniforms.u_worldTexScaleB.value = v;
        // If link is enabled, update ratio k from user’s B edit (A drives B)
        if (this.params.texScaleLinkEnabled) {
          const a = Math.max(0.001, this.params.worldTexScale || 1.0);
          this.params.texScaleLinkK = v / a;
          try {
            c_linkK.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texScaleB, 'worldTexScale');
    const c_texColB = texFolder
      .add(this.params, 'worldTexColorStrengthB', 0.0, 1.0, 0.01)
      .name('Color Strength B')
      .onChange((v) => {
        if (this.uniforms.u_worldTexColorStrengthB)
          this.uniforms.u_worldTexColorStrengthB.value = v;
        if (this.params.texColorLinkEnabled) {
          const a = Math.max(0.001, this.params.worldTexColorStrength || 1.0);
          this.params.texColorLinkK = v / a;
          try {
            c_linkColorK.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texColB, 'worldTexColorStrength');
    const c_texBumpB = texFolder
      .add(this.params, 'worldTexBumpStrengthB', 0.0, 1.0, 0.01)
      .name('Bump Strength B')
      .onChange((v) => {
        if (this.uniforms.u_worldTexBumpStrengthB) this.uniforms.u_worldTexBumpStrengthB.value = v;
        if (this.params.texBumpLinkEnabled) {
          const a = Math.max(0.001, this.params.worldTexBumpStrength || 1.0);
          this.params.texBumpLinkK = v / a;
          try {
            c_linkBumpK.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texBumpB, 'worldTexBumpStrength');
    const c_texSpecB = texFolder
      .add(this.params, 'worldTexSpecStrengthB', 0.0, 1.0, 0.01)
      .name('Specular Mod B')
      .onChange((v) => {
        if (this.uniforms.u_worldTexSpecStrengthB) this.uniforms.u_worldTexSpecStrengthB.value = v;
        if (this.params.texSpecLinkEnabled) {
          const a = Math.max(0.001, this.params.worldTexSpecStrength || 1.0);
          this.params.texSpecLinkK = v / a;
          try {
            c_linkSpecK.updateDisplay();
          } catch (_) {}
        }
      });
    this.addInfo(c_texSpecB, 'worldTexSpecStrength');

    // Scale Link controls
    const linkFolder = texFolder.addFolder('Scale Link');
    const c_link = linkFolder
      .add(this.params, 'texScaleLinkEnabled')
      .name('Link A→B')
      .onChange((v) => {
        if (v) {
          // Force B to current linked value
          const nb = (this.params.worldTexScale || 1.0) * (this.params.texScaleLinkK || 1.0);
          this.params.worldTexScaleB = nb;
          if (this.uniforms.u_worldTexScaleB) this.uniforms.u_worldTexScaleB.value = nb;
          try {
            c_texScaleB.updateDisplay();
          } catch (_) {}
        }
      });
    const c_linkK = linkFolder
      .add(this.params, 'texScaleLinkK', 0.1, 5.0, 0.05)
      .name('Ratio (B = A×k)')
      .onChange((v) => {
        if (!this.params.texScaleLinkEnabled) return;
        const nb = (this.params.worldTexScale || 1.0) * v;
        this.params.worldTexScaleB = nb;
        if (this.uniforms.u_worldTexScaleB) this.uniforms.u_worldTexScaleB.value = nb;
        try {
          c_texScaleB.updateDisplay();
        } catch (_) {}
      });
    this._INFO.texScaleLinkEnabled = [
      'Link A→B',
      'When enabled, Layer B Scale follows A using the ratio k. Editing B updates k.',
    ];
    this._INFO.texScaleLinkK = [
      'Ratio (B = A×k)',
      'Multiplier between Layer A and B scales when Link is enabled.',
    ];
    this.addInfo(c_link, 'texScaleLinkEnabled');
    this.addInfo(c_linkK, 'texScaleLinkK');

    // Strength link controls
    const strLink = texFolder.addFolder('Strength Links');
    const c_linkColor = strLink
      .add(this.params, 'texColorLinkEnabled')
      .name('Link Color A→B')
      .onChange((v) => {
        if (v) {
          const nb =
            (this.params.worldTexColorStrength || 0.0) * (this.params.texColorLinkK || 1.0);
          this.params.worldTexColorStrengthB = nb;
          if (this.uniforms.u_worldTexColorStrengthB)
            this.uniforms.u_worldTexColorStrengthB.value = nb;
          try {
            c_texColB.updateDisplay();
          } catch (_) {}
        }
      });
    const c_linkColorK = strLink
      .add(this.params, 'texColorLinkK', 0.0, 3.0, 0.01)
      .name('Color k (B=A×k)')
      .onChange((v) => {
        if (!this.params.texColorLinkEnabled) return;
        const nb = (this.params.worldTexColorStrength || 0.0) * v;
        this.params.worldTexColorStrengthB = nb;
        if (this.uniforms.u_worldTexColorStrengthB)
          this.uniforms.u_worldTexColorStrengthB.value = nb;
        try {
          c_texColB.updateDisplay();
        } catch (_) {}
      });
    const c_linkBump = strLink
      .add(this.params, 'texBumpLinkEnabled')
      .name('Link Bump A→B')
      .onChange((v) => {
        if (v) {
          const nb = (this.params.worldTexBumpStrength || 0.0) * (this.params.texBumpLinkK || 1.0);
          this.params.worldTexBumpStrengthB = nb;
          if (this.uniforms.u_worldTexBumpStrengthB)
            this.uniforms.u_worldTexBumpStrengthB.value = nb;
          try {
            c_texBumpB.updateDisplay();
          } catch (_) {}
        }
      });
    const c_linkBumpK = strLink
      .add(this.params, 'texBumpLinkK', 0.0, 3.0, 0.01)
      .name('Bump k (B=A×k)')
      .onChange((v) => {
        if (!this.params.texBumpLinkEnabled) return;
        const nb = (this.params.worldTexBumpStrength || 0.0) * v;
        this.params.worldTexBumpStrengthB = nb;
        if (this.uniforms.u_worldTexBumpStrengthB) this.uniforms.u_worldTexBumpStrengthB.value = nb;
        try {
          c_texBumpB.updateDisplay();
        } catch (_) {}
      });
    const c_linkSpec = strLink
      .add(this.params, 'texSpecLinkEnabled')
      .name('Link Spec A→B')
      .onChange((v) => {
        if (v) {
          const nb = (this.params.worldTexSpecStrength || 0.0) * (this.params.texSpecLinkK || 1.0);
          this.params.worldTexSpecStrengthB = nb;
          if (this.uniforms.u_worldTexSpecStrengthB)
            this.uniforms.u_worldTexSpecStrengthB.value = nb;
          try {
            c_texSpecB.updateDisplay();
          } catch (_) {}
        }
      });
    const c_linkSpecK = strLink
      .add(this.params, 'texSpecLinkK', 0.0, 3.0, 0.01)
      .name('Spec k (B=A×k)')
      .onChange((v) => {
        if (!this.params.texSpecLinkEnabled) return;
        const nb = (this.params.worldTexSpecStrength || 0.0) * v;
        this.params.worldTexSpecStrengthB = nb;
        if (this.uniforms.u_worldTexSpecStrengthB) this.uniforms.u_worldTexSpecStrengthB.value = nb;
        try {
          c_texSpecB.updateDisplay();
        } catch (_) {}
      });
    this._INFO.texColorLinkEnabled = [
      'Link Color',
      'When enabled, Layer B Color Strength follows A (B=A×k).',
    ];
    this._INFO.texBumpLinkEnabled = [
      'Link Bump',
      'When enabled, Layer B Bump Strength follows A (B=A×k).',
    ];
    this._INFO.texSpecLinkEnabled = [
      'Link Spec',
      'When enabled, Layer B Spec Strength follows A (B=A×k).',
    ];
    this._INFO.texColorLinkK = ['Color k', 'Multiplier for Color Strength link (B=A×k).'];
    this._INFO.texBumpLinkK = ['Bump k', 'Multiplier for Bump Strength link (B=A×k).'];
    this._INFO.texSpecLinkK = ['Spec k', 'Multiplier for Spec Strength link (B=A×k).'];
    this.addInfo(c_linkColor, 'texColorLinkEnabled');
    this.addInfo(c_linkBump, 'texBumpLinkEnabled');
    this.addInfo(c_linkSpec, 'texSpecLinkEnabled');
    this.addInfo(c_linkColorK, 'texColorLinkK');
    this.addInfo(c_linkBumpK, 'texBumpLinkK');
    this.addInfo(c_linkSpecK, 'texSpecLinkK');

    const blendModes = { Mix: 0, Multiply: 1, Add: 2 };
    const c_blendMode = texFolder
      .add(this.params, 'worldTexBlendMode', blendModes)
      .name('Blend Mode')
      .onChange((v) => {
        if (this.uniforms.u_worldTexBlendMode)
          this.uniforms.u_worldTexBlendMode.value = Number(v) | 0;
      });
    this.addInfo(c_blendMode, 'worldTexType');
    const c_blendAlphaC = texFolder
      .add(this.params, 'worldTexBlendAlphaColor', 0.0, 1.0, 0.01)
      .name('Mix Alpha (Color)')
      .onChange((v) => {
        if (this.uniforms.u_worldTexBlendAlphaColor)
          this.uniforms.u_worldTexBlendAlphaColor.value = v;
      });
    const c_blendAlphaN = texFolder
      .add(this.params, 'worldTexBlendAlphaBump', 0.0, 1.0, 0.01)
      .name('Mix Alpha (Bump)')
      .onChange((v) => {
        if (this.uniforms.u_worldTexBlendAlphaBump)
          this.uniforms.u_worldTexBlendAlphaBump.value = v;
      });
    const c_blendAlphaS = texFolder
      .add(this.params, 'worldTexBlendAlphaSpec', 0.0, 1.0, 0.01)
      .name('Mix Alpha (Spec)')
      .onChange((v) => {
        if (this.uniforms.u_worldTexBlendAlphaSpec)
          this.uniforms.u_worldTexBlendAlphaSpec.value = v;
      });
    this.addInfo(c_blendAlphaC, 'worldTexBlendAlphaColor');
    this.addInfo(c_blendAlphaN, 'worldTexBlendAlphaBump');
    this.addInfo(c_blendAlphaS, 'worldTexBlendAlphaSpec');

    const toggleMixAlphas = () => {
      const isMix = (Number(this.params.worldTexBlendMode) | 0) === 0;
      const disp = isMix ? '' : 'none';
      try {
        c_blendAlphaC.domElement.style.display = disp;
      } catch (_) {}
      try {
        c_blendAlphaN.domElement.style.display = disp;
      } catch (_) {}
      try {
        c_blendAlphaS.domElement.style.display = disp;
      } catch (_) {}
    };
    toggleMixAlphas();
    c_blendMode.onChange(() => {
      toggleMixAlphas();
    });

    // FBM controls (used when either layer uses FBM)
    const fbmFolder = texFolder.addFolder('FBM');
    const c_fbmOct = fbmFolder
      .add(this.params, 'worldFbmOctaves', 1, 8, 1)
      .name('Octaves')
      .onChange((v) => {
        if (this.uniforms.u_worldFbmOctaves) this.uniforms.u_worldFbmOctaves.value = v | 0;
      });
    const c_fbmLac = fbmFolder
      .add(this.params, 'worldFbmLacunarity', 1.1, 4.0, 0.01)
      .name('Lacunarity')
      .onChange((v) => {
        if (this.uniforms.u_worldFbmLacunarity) this.uniforms.u_worldFbmLacunarity.value = v;
      });
    const c_fbmGain = fbmFolder
      .add(this.params, 'worldFbmGain', 0.1, 0.95, 0.01)
      .name('Gain')
      .onChange((v) => {
        if (this.uniforms.u_worldFbmGain) this.uniforms.u_worldFbmGain.value = v;
      });
    const c_fbmSeed = fbmFolder
      .add(this.params, 'worldFbmSeed', -100.0, 100.0, 0.1)
      .name('Seed')
      .onChange((v) => {
        if (this.uniforms.u_worldFbmSeed) this.uniforms.u_worldFbmSeed.value = v;
      });
    this.addInfo(c_fbmOct, 'worldTexType');
    this.addInfo(c_fbmLac, 'worldTexType');
    this.addInfo(c_fbmGain, 'worldTexType');
    this.addInfo(c_fbmSeed, 'worldTexType');

    // Anti‑aliasing and Truchet options
    const aaFolder = texFolder.addFolder('AA & Variants');
    const c_aa = aaFolder
      .add(this.params, 'worldTexAAStrength', 0.0, 1.0, 0.01)
      .name('AA Strength')
      .onChange((v) => {
        if (this.uniforms.u_worldTexAAStrength) this.uniforms.u_worldTexAAStrength.value = v;
      });
    const c_autoAtt = aaFolder
      .add(this.params, 'worldTexAutoAtten')
      .name('Auto Atten (bump/spec)')
      .onChange((v) => {
        if (this.uniforms.u_worldTexAutoAtten) this.uniforms.u_worldTexAutoAtten.value = !!v;
      });
    const c_trRot = aaFolder
      .add(this.params, 'worldTruchetRotate')
      .name('Truchet Rotate 90°')
      .onChange((v) => {
        if (this.uniforms.u_worldTruchetRotate)
          this.uniforms.u_worldTruchetRotate.value = v ? 1 : 0;
      });
    const c_trWidth = aaFolder
      .add(this.params, 'worldTruchetWidth', 0.02, 0.6, 0.01)
      .name('Truchet Width')
      .onChange((v) => {
        if (this.uniforms.u_worldTruchetWidth) this.uniforms.u_worldTruchetWidth.value = v;
      });
    const c_trDensity = aaFolder
      .add(this.params, 'worldTruchetDensity', 0.2, 2.5, 0.05)
      .name('Truchet Density')
      .onChange((v) => {
        if (this.uniforms.u_worldTruchetDensity) this.uniforms.u_worldTruchetDensity.value = v;
      });
    this.addInfo(c_aa, 'worldTexType');
    this.addInfo(c_autoAtt, 'worldTexType');
    this.addInfo(c_trRot, 'worldTexType');
    this.addInfo(c_trWidth, 'worldTexType');
    this.addInfo(c_trDensity, 'worldTexType');
    // Perf toggles
    const c_top2 = aaFolder
      .add(this.params, 'texTop2')
      .name('Top‑2 Projections')
      .onChange((v) => {
        if (this.uniforms.u_texTop2) this.uniforms.u_texTop2.value = !!v;
      });
    const c_fastBump = aaFolder
      .add(this.params, 'texFastBump')
      .name('Fast Bump (3‑tap)')
      .onChange((v) => {
        if (this.uniforms.u_texFastBump) this.uniforms.u_texFastBump.value = !!v;
      });
    const c_triMin = aaFolder
      .add(this.params, 'texTriMinWeight', 0.0, 0.2, 0.005)
      .name('Top‑2 Min Weight')
      .onChange((v) => {
        if (this.uniforms.u_texTriMinWeight) this.uniforms.u_texTriMinWeight.value = v;
      });
    const c_triHyst = aaFolder
      .add(this.params, 'texTriHyst', 0.0, 0.05, 0.005)
      .name('Top‑2 Hysteresis')
      .onChange((v) => {
        if (this.uniforms.u_texTriHyst) this.uniforms.u_texTriHyst.value = v;
      });
    this.addInfo(c_top2, 'worldTexType');
    this.addInfo(c_fastBump, 'worldTexType');
    this.addInfo(c_triMin, 'worldTexType');
    this._INFO.texTriHyst = [
      'Top‑2 Hysteresis',
      'Soft deadband around the Top‑2 cutoff to reduce rare projection switches (0 disables).',
    ];
    this.addInfo(c_triHyst, 'texTriHyst');
    // Hex Truchet advanced controls
    const c_hexFreq = aaFolder
      .add(this.params, 'hexFoldFreq', 0.5, 4.0, 0.05)
      .name('Hex Fold Freq')
      .onChange((v) => {
        if (this.uniforms.u_hexFoldFreq) this.uniforms.u_hexFoldFreq.value = v;
      });
    const c_hexContrast = aaFolder
      .add(this.params, 'hexContrast', 0.25, 2.5, 0.01)
      .name('Hex Contrast')
      .onChange((v) => {
        if (this.uniforms.u_hexContrast) this.uniforms.u_hexContrast.value = v;
      });
    this.addInfo(c_hexFreq, 'hexFoldFreq');
    this.addInfo(c_hexContrast, 'hexContrast');
    // Reset button for Texture only (covers all controls in this drawer)
    texFolder
      .add(
        {
          reset: () => {
            resetSection([
              // Macro + global
              'textureQuality',
              'applyProceduralTextures',
              'texSpaceMode',
              'textureApplyTarget',
              // Floor texture options
              'floorTextureMode',
              'floorIgnoreWarp',
              'floorBumpScale',
              'floorSpecScale',
              'floorTexAutoDisable',
              'floorTexAutoMul',
              'floorTexDisableDist',
              'floorFadeNear',
              'floorFadeFar',
              // Layer A
              'worldTexType',
              'worldTexScale',
              'worldTexColorStrength',
              'worldTexBumpStrength',
              'worldTexSpecStrength',
              // Layer B
              'worldTexTypeB',
              'worldTexScaleB',
              'worldTexColorStrengthB',
              'worldTexBumpStrengthB',
              'worldTexSpecStrengthB',
              // Blend
              'worldTexBlendMode',
              'worldTexBlendAlphaColor',
              'worldTexBlendAlphaBump',
              'worldTexBlendAlphaSpec',
              // FBM
              'worldFbmOctaves',
              'worldFbmLacunarity',
              'worldFbmGain',
              'worldFbmSeed',
              // AA & Variants
              'worldTexAAStrength',
              'worldTexAutoAtten',
              'worldTruchetRotate',
              'worldTruchetWidth',
              'worldTruchetDensity',
              // Performance toggles
              'texTop2',
              'texFastBump',
              'texTriMinWeight',
              'texTriHyst',
              // Warp
              'texWarpStrength',
              'texWarpScale',
              'texWarpOctaves',
              'texWarpType',
              // Texture LOD
              'texLODEnabled',
              'texDerivOctDrop',
              'texDerivMinOct',
              'texWarpOctDrop',
              'texLODBumpFactor',
              'texLODSpecFactor',
              'texDerivAggression',
              'texBumpDerivFade',
              'texSpecDerivFade',
              'texRoughFadeK',
              // Anisotropy
              'texAnisoFactor',
              'texAnisoAxis',
              // Links
              'texScaleLinkEnabled',
              'texScaleLinkK',
              'texColorLinkEnabled',
              'texColorLinkK',
              'texBumpLinkEnabled',
              'texBumpLinkK',
              'texSpecLinkEnabled',
              'texSpecLinkK',
              // Distance fade
              'texFadeNear',
              'texFadeFar',
              // Hex Truchet
              'hexFoldFreq',
              'hexContrast',
              'hexSeed',
            ]);
            // Re-apply texture quality macro to sync derived dials with the selected preset
            try {
              this.applyTextureQuality(this.params.textureQuality || 'Balanced');
            } catch (_) {}
          },
        },
        'reset'
      )
      .name('↺ Reset Texture');
    // Auto-open when world is selected (Amazing Surf or Truchet)
    const toggleWorldFolder = (val) => {
      try {
        (val | 0) === 5 || (val | 0) === 6 ? worldFolder.open() : worldFolder.close();
      } catch (_) {}
    };
    toggleWorldFolder(this.params.fractalType);
    c_frType.onChange(toggleWorldFolder);
    // Apply auto fog if enabled when world params change
    const applyFogFromWorld = () => {
      this.applyWorldFogAuto();
    };
    c_wtile.onChange(applyFogFromWorld);
    c_scale.onChange(applyFogFromWorld);

    // Reset button for Fractal (includes World + Texture)
    fractalFolder
      .add(
        {
          reset: () =>
            resetSection([
              'fractalType',
              'iterations',
              'power',
              'scale',
              'worldTile',
              'worldThickness',
              'worldWarp',
              'worldDeScale',
              'worldSegClamp',
              'worldDetailStrength',
              'worldDetailScale',
              'worldFogAuto',
              'worldAutoIntegrator',
              // Procedural texture (global) defaults
              'applyProceduralTextures',
              'texSpaceMode',
              'worldTexType',
              'worldTexScale',
              'worldTexColorStrength',
              'worldTexBumpStrength',
              'worldTexSpecStrength',
              'worldTexTypeB',
              'worldTexScaleB',
              'worldTexColorStrengthB',
              'worldTexBumpStrengthB',
              'worldTexSpecStrengthB',
              'worldTexBlendMode',
              'worldTexBlendAlphaColor',
              'worldTexBlendAlphaBump',
              'worldTexBlendAlphaSpec',
              'worldFbmOctaves',
              'worldFbmLacunarity',
              'worldFbmGain',
              'worldFbmSeed',
              'worldTexAAStrength',
              'worldTexAutoAtten',
              'worldTruchetRotate',
              'worldTruchetWidth',
              'worldTruchetDensity',
              'hexFoldFreq',
              'hexContrast',
              'hexSeed',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Fractal');
    fractalFolder.open();

    // World (Truchet Pipes) controls
    const truchetFolder = fractalFolder.addFolder('Truchet Pipes');
    // Uses World → Tile Period slider (worldTile); no separate tile control here.
    const _c_trad = truchetFolder
      .add(this.params, 'truchetRadius', 0.04, 0.16, 0.002)
      .name('Tube Radius')
      .onChange((v) => {
        if (this.uniforms.u_truchetRadius) this.uniforms.u_truchetRadius.value = v;
      });
    const shapeOpts = { Round: 0, Square: 1, Rounded: 2, Octagon: 3 };
    const _c_tshape = truchetFolder
      .add(this.params, 'truchetShape', shapeOpts)
      .name('Cross-Section')
      .onChange((v) => {
        if (this.uniforms.u_truchetShape) this.uniforms.u_truchetShape.value = Number(v) | 0;
      });
    const variantOpts = { 'Dual (Mixed)': 0, 'Torus Only': 1, 'Straight Only': 2 };
    const _c_tvar = truchetFolder
      .add(this.params, 'truchetVariant', variantOpts)
      .name('Variant')
      .onChange((v) => {
        if (this.uniforms.u_truchetVariant) this.uniforms.u_truchetVariant.value = Number(v) | 0;
      });

    const c_tsmooth = truchetFolder
      .add(this.params, 'truchetSmooth')
      .name('Smooth Band Union')
      .onChange((v) => {
        if (this.uniforms.u_truchetSmooth) this.uniforms.u_truchetSmooth.value = !!v;
      });
    this.addInfo(c_tsmooth, 'truchetSmooth');
    const c_tsk = truchetFolder
      .add(this.params, 'truchetSmoothK', 0.0, 0.5, 0.01)
      .name('Smooth K (×Radius)')
      .onChange((v) => {
        if (this.uniforms.u_truchetSmoothK) this.uniforms.u_truchetSmoothK.value = v;
      });
    this.addInfo(c_tsk, 'truchetSmoothK');

    const _c_sleeveScale = truchetFolder
      .add(this.params, 'truchetSleeveScale', 0.5, 1.2, 0.01)
      .name('Sleeve Scale')
      .onChange((v) => {
        if (this.uniforms.u_truchetSleeveScale) this.uniforms.u_truchetSleeveScale.value = v;
      });
    const _c_lipScale = truchetFolder
      .add(this.params, 'truchetLipScale', 0.5, 1.5, 0.01)
      .name('Portal Lip Scale')
      .onChange((v) => {
        if (this.uniforms.u_truchetLipScale) this.uniforms.u_truchetLipScale.value = v;
      });
    // Mirror Joins (experimental) hidden to avoid confusion; join ring replaces it
    const _c_joinRing = truchetFolder
      .add(this.params, 'truchetJoinRing')
      .name('Join Ring (cheap)')
      .onChange((v) => {
        if (this.uniforms.u_truchetJoinRing) this.uniforms.u_truchetJoinRing.value = !!v;
      });
    const _c_joinRingK = truchetFolder
      .add(this.params, 'truchetJoinRingK', 0.5, 1.8, 0.01)
      .name('Ring Thickness')
      .onChange((v) => {
        if (this.uniforms.u_truchetJoinRingK) this.uniforms.u_truchetJoinRingK.value = v;
      });

    // Reset helper for Truchet geometry + texture subset (uses Pipe Catacombs preset defaults)
    truchetFolder
      .add(
        {
          reset: () => {
            try {
              const d = DEFAULTS;
              const preset = getPreset('Pipe Catacombs (Truchet)') || {};
              // Geometry
              this.params.truchetRadius =
                preset.truchetRadius !== undefined ? preset.truchetRadius : d.truchetRadius;
              this.params.truchetShape =
                preset.truchetShape !== undefined ? preset.truchetShape : d.truchetShape;
              this.params.truchetVariant =
                preset.truchetVariant !== undefined ? preset.truchetVariant : d.truchetVariant;
              this.params.truchetSmooth =
                preset.truchetSmooth !== undefined ? preset.truchetSmooth : d.truchetSmooth;
              this.params.truchetSmoothK =
                preset.truchetSmoothK !== undefined ? preset.truchetSmoothK : d.truchetSmoothK;
              if (this.uniforms.u_truchetRadius)
                this.uniforms.u_truchetRadius.value = this.params.truchetRadius;
              if (this.uniforms.u_truchetShape)
                this.uniforms.u_truchetShape.value = this.params.truchetShape | 0;
              if (this.uniforms.u_truchetVariant)
                this.uniforms.u_truchetVariant.value = this.params.truchetVariant | 0;
              if (this.uniforms.u_truchetSmooth)
                this.uniforms.u_truchetSmooth.value = !!this.params.truchetSmooth;
              if (this.uniforms.u_truchetSmoothK)
                this.uniforms.u_truchetSmoothK.value = this.params.truchetSmoothK;

              // Procedural texture subset used by the preset
              const apply = (key, fallback) =>
                preset[key] !== undefined ? preset[key] : d[key] !== undefined ? d[key] : fallback;
              this.params.applyProceduralTextures = apply('applyProceduralTextures', true);
              this.params.texSpaceMode = apply('texSpaceMode', 0);
              this.params.worldFbmSeed = apply('worldFbmSeed', 11.0);
              this.params.worldTexType = apply('worldTexType', 2);
              this.params.worldTexScale = apply('worldTexScale', 8.0);
              this.params.worldTexColorStrength = apply('worldTexColorStrength', 0.18);
              this.params.worldTexBumpStrength = apply('worldTexBumpStrength', 0.32);
              this.params.worldTexSpecStrength = apply('worldTexSpecStrength', 0.45);
              this.params.worldTexTypeB = apply('worldTexTypeB', 1);
              this.params.worldTexScaleB = apply('worldTexScaleB', 3.5);
              this.params.worldTexColorStrengthB = apply('worldTexColorStrengthB', 0.1);
              this.params.worldTexBumpStrengthB = apply('worldTexBumpStrengthB', 0.18);
              this.params.worldTexSpecStrengthB = apply('worldTexSpecStrengthB', 0.25);
              this.params.worldTexBlendMode = apply('worldTexBlendMode', 0);
              this.params.worldTexBlendAlphaColor = apply('worldTexBlendAlphaColor', 0.4);
              this.params.worldTexBlendAlphaBump = apply('worldTexBlendAlphaBump', 0.5);
              this.params.worldTexBlendAlphaSpec = apply('worldTexBlendAlphaSpec', 0.45);
              this.params.worldTexAAStrength = apply('worldTexAAStrength', 0.7);
              this.params.worldTexAutoAtten = apply('worldTexAutoAtten', true);

              // Push texture subset uniforms
              if (this.uniforms.u_texturesEnabled)
                this.uniforms.u_texturesEnabled.value = !!this.params.applyProceduralTextures;
              if (this.uniforms.u_texSpaceMode)
                this.uniforms.u_texSpaceMode.value = this.params.texSpaceMode | 0;
              if (this.uniforms.u_worldFbmSeed)
                this.uniforms.u_worldFbmSeed.value = this.params.worldFbmSeed;
              if (this.uniforms.u_worldTexType)
                this.uniforms.u_worldTexType.value = this.params.worldTexType | 0;
              if (this.uniforms.u_worldTexScale)
                this.uniforms.u_worldTexScale.value = this.params.worldTexScale;
              if (this.uniforms.u_worldTexColorStrength)
                this.uniforms.u_worldTexColorStrength.value = this.params.worldTexColorStrength;
              if (this.uniforms.u_worldTexBumpStrength)
                this.uniforms.u_worldTexBumpStrength.value = this.params.worldTexBumpStrength;
              if (this.uniforms.u_worldTexSpecStrength)
                this.uniforms.u_worldTexSpecStrength.value = this.params.worldTexSpecStrength;
              if (this.uniforms.u_worldTexTypeB)
                this.uniforms.u_worldTexTypeB.value = this.params.worldTexTypeB | 0;
              if (this.uniforms.u_worldTexScaleB)
                this.uniforms.u_worldTexScaleB.value = this.params.worldTexScaleB;
              if (this.uniforms.u_worldTexColorStrengthB)
                this.uniforms.u_worldTexColorStrengthB.value = this.params.worldTexColorStrengthB;
              if (this.uniforms.u_worldTexBumpStrengthB)
                this.uniforms.u_worldTexBumpStrengthB.value = this.params.worldTexBumpStrengthB;
              if (this.uniforms.u_worldTexSpecStrengthB)
                this.uniforms.u_worldTexSpecStrengthB.value = this.params.worldTexSpecStrengthB;
              if (this.uniforms.u_worldTexBlendMode)
                this.uniforms.u_worldTexBlendMode.value = this.params.worldTexBlendMode | 0;
              if (this.uniforms.u_worldTexBlendAlphaColor)
                this.uniforms.u_worldTexBlendAlphaColor.value = this.params.worldTexBlendAlphaColor;
              if (this.uniforms.u_worldTexBlendAlphaBump)
                this.uniforms.u_worldTexBlendAlphaBump.value = this.params.worldTexBlendAlphaBump;
              if (this.uniforms.u_worldTexBlendAlphaSpec)
                this.uniforms.u_worldTexBlendAlphaSpec.value = this.params.worldTexBlendAlphaSpec;
              if (this.uniforms.u_worldTexAAStrength)
                this.uniforms.u_worldTexAAStrength.value = this.params.worldTexAAStrength;
              if (this.uniforms.u_worldTexAutoAtten)
                this.uniforms.u_worldTexAutoAtten.value = !!this.params.worldTexAutoAtten;
              if (this.uniforms.u_texDerivAggression)
                this.uniforms.u_texDerivAggression.value = this.params.texDerivAggression;
              if (this.uniforms.u_texBumpDerivFade)
                this.uniforms.u_texBumpDerivFade.value = this.params.texBumpDerivFade;
              if (this.uniforms.u_texSpecDerivFade)
                this.uniforms.u_texSpecDerivFade.value = this.params.texSpecDerivFade;
              if (this.uniforms.u_texRoughFadeK)
                this.uniforms.u_texRoughFadeK.value = this.params.texRoughFadeK;
              if (this.uniforms.u_texTriHyst)
                this.uniforms.u_texTriHyst.value = this.params.texTriHyst;
              if (this.uniforms.u_texFadeNear)
                this.uniforms.u_texFadeNear.value = this.params.texFadeNear;
              if (this.uniforms.u_texFadeFar)
                this.uniforms.u_texFadeFar.value = this.params.texFadeFar;
              if (this.uniforms.u_texTop2) this.uniforms.u_texTop2.value = !!this.params.texTop2;
              if (this.uniforms.u_texFastBump)
                this.uniforms.u_texFastBump.value = !!this.params.texFastBump;
              if (this.uniforms.u_texTriMinWeight)
                this.uniforms.u_texTriMinWeight.value = this.params.texTriMinWeight;

              // Refresh GUI + uniforms and persist
              this.syncAllUniforms();
              if (this.gui && this.gui.controllersRecursive)
                this.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
              this.schedulePersist();
            } catch (e) {
              console.warn('Reset Truchet failed:', e);
            }
          },
        },
        'reset'
      )
      .name('↺ Reset Truchet');

    // Reset to DEFAULTS instead of preset values
    truchetFolder
      .add(
        {
          resetDefaults: () => {
            try {
              const d = DEFAULTS;
              // Geometry
              this.params.truchetRadius = d.truchetRadius;
              this.params.truchetShape = d.truchetShape;
              this.params.truchetVariant = d.truchetVariant;
              this.params.truchetSmooth = d.truchetSmooth === true;
              this.params.truchetSmoothK = d.truchetSmoothK != null ? d.truchetSmoothK : 0.18;
              if (this.uniforms.u_truchetRadius)
                this.uniforms.u_truchetRadius.value = this.params.truchetRadius;
              if (this.uniforms.u_truchetShape)
                this.uniforms.u_truchetShape.value = this.params.truchetShape | 0;
              if (this.uniforms.u_truchetVariant)
                this.uniforms.u_truchetVariant.value = this.params.truchetVariant | 0;
              if (this.uniforms.u_truchetSmooth)
                this.uniforms.u_truchetSmooth.value = !!this.params.truchetSmooth;
              if (this.uniforms.u_truchetSmoothK)
                this.uniforms.u_truchetSmoothK.value = this.params.truchetSmoothK;

              // Procedural textures (DEFAULTS)
              const keys = [
                'applyProceduralTextures',
                'texSpaceMode',
                'worldFbmSeed',
                'worldTexType',
                'worldTexScale',
                'worldTexColorStrength',
                'worldTexBumpStrength',
                'worldTexSpecStrength',
                'worldTexTypeB',
                'worldTexScaleB',
                'worldTexColorStrengthB',
                'worldTexBumpStrengthB',
                'worldTexSpecStrengthB',
                'worldTexBlendMode',
                'worldTexBlendAlphaColor',
                'worldTexBlendAlphaBump',
                'worldTexBlendAlphaSpec',
                'worldTexAAStrength',
                'worldTexAutoAtten',
              ];
              keys.forEach((k) => {
                if (d[k] !== undefined) this.params[k] = d[k];
              });

              if (this.uniforms.u_texturesEnabled)
                this.uniforms.u_texturesEnabled.value = !!this.params.applyProceduralTextures;
              if (this.uniforms.u_texSpaceMode && this.params.texSpaceMode !== undefined)
                this.uniforms.u_texSpaceMode.value = this.params.texSpaceMode | 0;
              if (this.uniforms.u_worldFbmSeed && this.params.worldFbmSeed !== undefined)
                this.uniforms.u_worldFbmSeed.value = this.params.worldFbmSeed;
              if (this.uniforms.u_worldTexType)
                this.uniforms.u_worldTexType.value = this.params.worldTexType | 0;
              if (this.uniforms.u_worldTexScale)
                this.uniforms.u_worldTexScale.value = this.params.worldTexScale;
              if (this.uniforms.u_worldTexColorStrength)
                this.uniforms.u_worldTexColorStrength.value = this.params.worldTexColorStrength;
              if (this.uniforms.u_worldTexBumpStrength)
                this.uniforms.u_worldTexBumpStrength.value = this.params.worldTexBumpStrength;
              if (this.uniforms.u_worldTexSpecStrength)
                this.uniforms.u_worldTexSpecStrength.value = this.params.worldTexSpecStrength;
              if (this.uniforms.u_worldTexTypeB)
                this.uniforms.u_worldTexTypeB.value = this.params.worldTexTypeB | 0;
              if (this.uniforms.u_worldTexScaleB)
                this.uniforms.u_worldTexScaleB.value = this.params.worldTexScaleB;
              if (this.uniforms.u_worldTexColorStrengthB)
                this.uniforms.u_worldTexColorStrengthB.value = this.params.worldTexColorStrengthB;
              if (this.uniforms.u_worldTexBumpStrengthB)
                this.uniforms.u_worldTexBumpStrengthB.value = this.params.worldTexBumpStrengthB;
              if (this.uniforms.u_worldTexSpecStrengthB)
                this.uniforms.u_worldTexSpecStrengthB.value = this.params.worldTexSpecStrengthB;
              if (this.uniforms.u_worldTexBlendMode)
                this.uniforms.u_worldTexBlendMode.value = this.params.worldTexBlendMode | 0;
              if (this.uniforms.u_worldTexBlendAlphaColor)
                this.uniforms.u_worldTexBlendAlphaColor.value = this.params.worldTexBlendAlphaColor;
              if (this.uniforms.u_worldTexBlendAlphaBump)
                this.uniforms.u_worldTexBlendAlphaBump.value = this.params.worldTexBlendAlphaBump;
              if (this.uniforms.u_worldTexBlendAlphaSpec)
                this.uniforms.u_worldTexBlendAlphaSpec.value = this.params.worldTexBlendAlphaSpec;
              if (this.uniforms.u_worldTexAAStrength)
                this.uniforms.u_worldTexAAStrength.value = this.params.worldTexAAStrength;
              if (this.uniforms.u_worldTexAutoAtten)
                this.uniforms.u_worldTexAutoAtten.value = !!this.params.worldTexAutoAtten;

              // Refresh + persist
              this.syncAllUniforms();
              if (this.gui && this.gui.controllersRecursive)
                this.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
              this.schedulePersist();
            } catch (e) {
              console.warn('Reset Truchet Defaults failed:', e);
            }
          },
        },
        'resetDefaults'
      )
      .name('↺ Reset Truchet to Defaults');

    // Auto-open the appropriate world folder based on type selection
    const toggleTruchetFolder = (val) => {
      try {
        (val | 0) === 6 ? truchetFolder.open() : truchetFolder.close();
      } catch (_) {}
    };
    toggleTruchetFolder(this.params.fractalType);
    c_frType.onChange(toggleTruchetFolder);

    // Debug Folder
    const debugFolder = this.gui.addFolder('Debug');
    const c_dbgOn = debugFolder
      .add(this.params, 'debugEnabled')
      .name('Enable Debug View')
      .onChange((v) => {
        if (this.uniforms.u_debugEnabled) this.uniforms.u_debugEnabled.value = v;
      });
    this.addInfo(c_dbgOn, 'debugEnabled');

    const c_dbgMode = debugFolder
      .add(this.params, 'debugMode', {
        Off: 0,
        Steps: 1,
        'Travel Distance': 2,
        'Orbit Trap': 3,
        'Normal (Hit)': 4,
        'Map@Hit (|d|)': 5,
        'Local Bound Mask': 6,
        'Fractal Distance Only': 7,
        'Local Tetra Probe': 8,
        'Local Axes (Normal→RGB)': 9,
      })
      .name('Mode')
      .onChange((v) => {
        if (this.uniforms.u_debugMode) this.uniforms.u_debugMode.value = v;
      });
    this.addInfo(c_dbgMode, 'debugMode');

    const c_sierpBase = debugFolder
      .add(this.params, 'sierpinskiBase', 0.3, 4.0, 0.01)
      .name('Sierpinski Base Size')
      .onChange((v) => {
        if (this.uniforms.u_sierpinskiBase) this.uniforms.u_sierpinskiBase.value = v;
      });
    this.addInfo(c_sierpBase, 'sierpinskiBase');

    // Integrator quick presets (for debugging)
    debugFolder
      .add(
        {
          sphereIntegrator: () => {
            this.params.useSegmentTracing = false;
            this.params.integratorAuto = true;
            this.params.integratorSwitchDist = 2.6;
            // Push to uniforms
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = false;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = true;
            if (this.uniforms.u_integratorSwitchDist)
              this.uniforms.u_integratorSwitchDist.value = 2.6;
            // Refresh GUI + persist
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
            this.schedulePersist();
          },
        },
        'sphereIntegrator'
      )
      .name('Integrator: Sphere');

    debugFolder
      .add(
        {
          segmentIntegrator: () => {
            this.params.useSegmentTracing = true;
            this.params.integratorAuto = false;
            if (this.params.segmentFraction === undefined || this.params.segmentFraction <= 0)
              this.params.segmentFraction = 0.55;
            // Push to uniforms
            if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = true;
            if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
            if (this.uniforms.u_segmentFraction) this.uniforms.u_segmentFraction.value = 0.55;
            // Refresh GUI + persist
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
            this.schedulePersist();
          },
        },
        'segmentIntegrator'
      )
      .name('Integrator: Segment');

    const c_bypassAlign = debugFolder
      .add(this.params, 'dbgBypassSierpinskiAlign')
      .name('Bypass Sierpinski Align')
      .onChange((v) => {
        if (this.uniforms.u_dbgBypassSierpinskiAlign)
          this.uniforms.u_dbgBypassSierpinskiAlign.value = v;
      });
    this.addInfo(c_bypassAlign, 'dbgBypassSierpinskiAlign');

    const c_bypassRot = debugFolder
      .add(this.params, 'dbgBypassFractalRotation')
      .name('Bypass Fractal Rotation')
      .onChange((v) => {
        if (this.uniforms.u_dbgBypassFractalRotation)
          this.uniforms.u_dbgBypassFractalRotation.value = v;
      });
    this.addInfo(c_bypassRot, 'dbgBypassFractalRotation');

    // Morph (animated parameter cycles)
    const morphFolder = this.gui.addFolder('Morph');
    const c_morphOn = morphFolder
      .add(this.params, 'morphEnabled')
      .name('Enable Morph')
      .onChange((_v) => {
        /* runtime handled in main.animate() */ this.schedulePersist();
      });
    const c_morphSpeed = morphFolder
      .add(this.params, 'morphSpeed', 0.02, 2.0, 0.01)
      .name('Speed (cycles/sec)')
      .onChange((_v) => {
        this.schedulePersist();
      });
    const c_morphScale = morphFolder
      .add(this.params, 'morphFractalScaleAmp', 0.0, 0.6, 0.01)
      .name('Fractal Scale Amp');
    const c_morphPower = morphFolder
      .add(this.params, 'morphFractalPowerAmp', 0.0, 6.0, 0.1)
      .name('Mandelbulb Power Amp');
    const c_morphThick = morphFolder
      .add(this.params, 'morphWorldThicknessAmp', 0.0, 0.3, 0.005)
      .name('World Thickness Amp');
    const c_morphWarp = morphFolder
      .add(this.params, 'morphWorldWarpAmp', 0.0, 0.8, 0.01)
      .name('World Warp Amp');
    const c_morphTile = morphFolder
      .add(this.params, 'morphWorldTileAmp', 0.0, 10.0, 0.1)
      .name('World Tile Amp');
    const c_morphTexWarp = morphFolder
      .add(this.params, 'morphTexWarpStrengthAmp', 0.0, 1.0, 0.01)
      .name('Tex Warp Strength Amp');
    const c_morphTruchet = morphFolder
      .add(this.params, 'morphTruchetRadiusAmp', 0.0, 0.12, 0.005)
      .name('Truchet Radius Amp');
    this._INFO.morphEnabled = [
      'Enable Morph',
      'Cycles selected parameters over time to create a morphing effect. Values are clamped to safe ranges per parameter.',
    ];
    this._INFO.morphSpeed = [
      'Morph Speed',
      'How fast the morph cycles repeat (in cycles per second).',
    ];
    this._INFO.morphFractalScaleAmp = [
      'Fractal Scale Amplitude',
      'Amount to modulate the global fractal scale around its base value.',
    ];
    this._INFO.morphFractalPowerAmp = [
      'Mandelbulb Power Amplitude',
      'Amount to modulate the Mandelbulb power (only applies to Bulb).',
    ];
    this._INFO.morphWorldThicknessAmp = [
      'World Thickness Amplitude',
      'Modulation of Amazing Surf shell thickness.',
    ];
    this._INFO.morphWorldWarpAmp = [
      'World Warp Amplitude',
      'Modulation of the domain warp in the World scene.',
    ];
    this._INFO.morphWorldTileAmp = [
      'World Tile Amplitude',
      'Modulation of World tiling period (can subtly “breathe” room size).',
    ];
    this._INFO.morphTexWarpStrengthAmp = [
      'Texture Warp Strength Amplitude',
      'Cycles the global texture warp amount for drifting vein patterns.',
    ];
    this._INFO.morphTruchetRadiusAmp = [
      'Truchet Radius Amplitude',
      'Modulation of Truchet Pipes tube radius.',
    ];
    this.addInfo(c_morphOn, 'morphEnabled');
    this.addInfo(c_morphSpeed, 'morphSpeed');
    this.addInfo(c_morphScale, 'morphFractalScaleAmp');
    this.addInfo(c_morphPower, 'morphFractalPowerAmp');
    this.addInfo(c_morphThick, 'morphWorldThicknessAmp');
    this.addInfo(c_morphWarp, 'morphWorldWarpAmp');
    this.addInfo(c_morphTile, 'morphWorldTileAmp');
    this.addInfo(c_morphTexWarp, 'morphTexWarpStrengthAmp');
    this.addInfo(c_morphTruchet, 'morphTruchetRadiusAmp');

    // Reset Morph button
    morphFolder
      .add(
        {
          reset: () => {
            try {
              const keys = [
                'morphEnabled',
                'morphSpeed',
                'morphFractalScaleAmp',
                'morphFractalPowerAmp',
                'morphWorldThicknessAmp',
                'morphWorldWarpAmp',
                'morphWorldTileAmp',
                'morphTexWarpStrengthAmp',
                'morphTruchetRadiusAmp',
              ];
              keys.forEach((k) => {
                if (DEFAULTS[k] !== undefined) this.params[k] = DEFAULTS[k];
              });
              // Refresh GUI rows
              if (this.gui && this.gui.controllersRecursive) {
                this.gui
                  .controllersRecursive()
                  .forEach((c) => c.updateDisplay && c.updateDisplay());
              }
              this.schedulePersist();
            } catch (_) {}
          },
        },
        'reset'
      )
      .name('↺ Reset Morph');

    debugFolder
      .add(
        {
          isolate: () => {
            // Quick isolate: disable floor, AO, shadows
            this.params.floorEnabled = false;
            this.params.aoEnabled = false;
            this.params.softShadowsEnabled = false;
            this.syncAllUniforms();
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          },
        },
        'isolate'
      )
      .name('🧪 Isolate Fractal');

    debugFolder
      .add(
        {
          restore: () => {
            // Restore key visual defaults
            this.params.floorEnabled = DEFAULTS.floorEnabled;
            this.params.aoEnabled = DEFAULTS.aoEnabled;
            this.params.softShadowsEnabled = DEFAULTS.softShadowsEnabled;
            this.syncAllUniforms();
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          },
        },
        'restore'
      )
      .name('↺ Restore Visuals');

    // Animation Controls Folder
    const animationFolder = this.gui.addFolder('Animation');

    const c_autoRot = animationFolder
      .add(this.params, 'animateRotation')
      .name('Auto Rotate')
      .onChange((value) => {
        if (this.callbacks.onAnimationToggle) {
          this.callbacks.onAnimationToggle(value);
        }
      });
    this.addInfo(c_autoRot, 'animateRotation');

    const c_rotX = animationFolder
      .add(this.params, 'rotationSpeedX', -2.0, 2.0, 0.01)
      .name('Rotation Speed X')
      .onChange((value) => {
        if (this.callbacks.onRotationSpeedChange) {
          this.callbacks.onRotationSpeedChange('x', value);
        }
      });
    this.addInfo(c_rotX, 'rotationSpeedX');

    const c_rotY = animationFolder
      .add(this.params, 'rotationSpeedY', -2.0, 2.0, 0.01)
      .name('Rotation Speed Y')
      .onChange((value) => {
        if (this.callbacks.onRotationSpeedChange) {
          this.callbacks.onRotationSpeedChange('y', value);
        }
      });
    this.addInfo(c_rotY, 'rotationSpeedY');

    const c_rotZ = animationFolder
      .add(this.params, 'rotationSpeedZ', -2.0, 2.0, 0.01)
      .name('Rotation Speed Z')
      .onChange((value) => {
        if (this.callbacks.onRotationSpeedChange) {
          this.callbacks.onRotationSpeedChange('z', value);
        }
      });
    this.addInfo(c_rotZ, 'rotationSpeedZ');

    // Button to rotate fractal to face the current camera
    animationFolder
      .add(
        {
          faceCamera: () => {
            if (this.callbacks.faceCamera) this.callbacks.faceCamera();
          },
        },
        'faceCamera'
      )
      .name('↦ Face Camera');

    // Button to reset current fractal rotation angles to (0,0,0)
    animationFolder
      .add(
        {
          resetRotation: () => {
            if (this.callbacks.resetRotation) this.callbacks.resetRotation();
          },
        },
        'resetRotation'
      )
      .name('↺ Reset Rotation');

    // Reset for Animation (bottom of drawer)
    animationFolder
      .add(
        {
          reset: () =>
            resetSection(['animateRotation', 'rotationSpeedX', 'rotationSpeedY', 'rotationSpeedZ']),
        },
        'reset'
      )
      .name('↺ Reset Animation');

    // Camera Controls Folder
    const cameraFolder = this.gui.addFolder('Camera');
    cameraFolder.close();

    const c_moveSpeed = cameraFolder
      .add(this.params, 'movementSpeed', 1.0, 200.0, 1.0)
      .name('Movement Speed')
      .onChange((value) => {
        if (this.callbacks.onSpeedChange) {
          this.callbacks.onSpeedChange(value);
        }
      });
    this.addInfo(c_moveSpeed, 'movementSpeed');

    // Camera info overlay removed; details are shown in the Debug Overlay

    const c_reticle = cameraFolder
      .add(this.params, 'reticleEnabled')
      .name('Show Reticle')
      .onChange((v) => {
        if (this.callbacks.onReticleToggle) this.callbacks.onReticleToggle(!!v);
      });
    this._INFO.reticleEnabled = [
      'Show Reticle',
      'Displays a small crosshair at the center of the screen for precise aiming and alignment.',
    ];
    this.addInfo(c_reticle, 'reticleEnabled');

    const c_fly = cameraFolder
      .add(this.params, 'flyMode')
      .name('Fly Mode (Pitch Forward)')
      .onChange((v) => {
        if (this.callbacks.onFlyModeToggle) this.callbacks.onFlyModeToggle(!!v);
      });
    this.addInfo(c_fly, 'flyMode');

    const c_fov = cameraFolder
      .add(this.params, 'fov', 30, 120, 1)
      .name('FOV')
      .onChange((value) => {
        this.camera.fov = value;
        this.camera.updateProjectionMatrix();
        this.uniforms.u_fov.value = value;
      });
    this.addInfo(c_fov, 'fov');

    cameraFolder.add(this.params, 'resetCamera').name('Reset Position');
    cameraFolder
      .add(
        {
          reset: () => {
            resetSection(['movementSpeed', 'fov', 'reticleEnabled', 'flyMode']);
            if (this.callbacks.resetCamera) this.callbacks.resetCamera();
            if (this.callbacks.onReticleToggle)
              this.callbacks.onReticleToggle(!!this.params.reticleEnabled);
            if (this.callbacks.onFlyModeToggle)
              this.callbacks.onFlyModeToggle(!!this.params.flyMode);
          },
        },
        'reset'
      )
      .name('↺ Reset Camera');

    // Lighting Controls Folder (collapsed by default)
    const lightingFolder = this.gui.addFolder('Lighting');
    lightingFolder.close();

    const c_lx = lightingFolder
      .add(this.params, 'lightPosX', -20, 20, 0.5)
      .name('Light X')
      .onChange((value) => {
        if (this.uniforms.u_lightPos) {
          this.uniforms.u_lightPos.value.x = value;
        }
      });
    this.addInfo(c_lx, 'lightPosX');

    const c_ly = lightingFolder
      .add(this.params, 'lightPosY', -20, 20, 0.5)
      .name('Light Y')
      .onChange((value) => {
        if (this.uniforms.u_lightPos) {
          this.uniforms.u_lightPos.value.y = value;
        }
      });
    this.addInfo(c_ly, 'lightPosY');

    const c_lz = lightingFolder
      .add(this.params, 'lightPosZ', -20, 20, 0.5)
      .name('Light Z')
      .onChange((value) => {
        if (this.uniforms.u_lightPos) {
          this.uniforms.u_lightPos.value.z = value;
        }
      });
    this.addInfo(c_lz, 'lightPosZ');

    const c_amb = lightingFolder
      .add(this.params, 'ambientStrength', 0, 1, 0.01)
      .name('Ambient')
      .onChange((value) => {
        if (this.uniforms.u_ambientStrength) {
          this.uniforms.u_ambientStrength.value = value;
        }
      });
    this.addInfo(c_amb, 'ambientStrength');

    const c_diff = lightingFolder
      .add(this.params, 'diffuseStrength', 0, 1, 0.01)
      .name('Diffuse')
      .onChange((value) => {
        if (this.uniforms.u_diffuseStrength) {
          this.uniforms.u_diffuseStrength.value = value;
        }
      });
    this.addInfo(c_diff, 'diffuseStrength');

    const c_spec = lightingFolder
      .add(this.params, 'specularStrength', 0, 1, 0.01)
      .name('Specular')
      .onChange((value) => {
        if (this.uniforms.u_specularStrength) {
          this.uniforms.u_specularStrength.value = value;
        }
      });
    this.addInfo(c_spec, 'specularStrength');

    const c_shiny = lightingFolder
      .add(this.params, 'shininess', 1, 128, 1)
      .name('Shininess')
      .onChange((value) => {
        if (this.uniforms.u_shininess) {
          this.uniforms.u_shininess.value = value;
        }
      });
    this.addInfo(c_shiny, 'shininess');

    const c_lightColor = lightingFolder
      .addColor(this.params, 'lightColor')
      .name('Light Color')
      .onChange((value) => {
        if (this.uniforms.u_lightColor) {
          const c = new THREE.Color(value);
          this.uniforms.u_lightColor.value.copy(c);
        }
      });
    this.addInfo(c_lightColor, 'lightColor');

    // Toggle whether light color tints diffuse or only specular
    this.params.tintDiffuse = false;
    const c_tintDiff = lightingFolder
      .add(this.params, 'tintDiffuse')
      .name('Tint Diffuse With Light')
      .onChange((v) => {
        if (this.uniforms.u_tintDiffuse) this.uniforms.u_tintDiffuse.value = v;
      });
    this.addInfo(c_tintDiff, 'tintDiffuse');

    const c_ao = lightingFolder
      .add(this.params, 'aoEnabled')
      .name('Ambient Occlusion')
      .onChange((value) => {
        if (this.uniforms.u_aoEnabled) {
          this.uniforms.u_aoEnabled.value = value;
          // Save AO preference
          localStorage.setItem('fractalExplorer_aoEnabled', JSON.stringify(value));
        }
      });
    this.addInfo(c_ao, 'aoEnabled');

    // AO Fallback strength (when AO disabled)
    this.params.aoFallbackStrength = DEFAULTS.aoFallbackStrength || 0.5;
    const c_aoFb = lightingFolder
      .add(this.params, 'aoFallbackStrength', 0.0, 1.0, 0.05)
      .name('AO Fallback Strength')
      .onChange((v) => {
        if (this.uniforms.u_aoFallbackStrength) this.uniforms.u_aoFallbackStrength.value = v;
      });
    this.addInfo(c_aoFb, 'aoFallbackStrength');

    // AO max samples (near)
    this.params.aoMaxSamples = DEFAULTS.aoMaxSamples || 4;
    const c_aoMax = lightingFolder
      .add(this.params, 'aoMaxSamples', 1, 6, 1)
      .name('AO Max Samples (Near)')
      .onChange((v) => {
        if (this.uniforms.u_aoMaxSamples) this.uniforms.u_aoMaxSamples.value = v | 0;
      });
    this.addInfo(c_aoMax, 'aoMinSamples');

    const c_soft = lightingFolder
      .add(this.params, 'softShadowsEnabled')
      .name('Soft Shadows')
      .onChange((value) => {
        if (this.uniforms.u_softShadowsEnabled) {
          this.uniforms.u_softShadowsEnabled.value = value;
          // Save soft shadows preference
          localStorage.setItem('fractalExplorer_softShadowsEnabled', JSON.stringify(value));
        }
      });
    this.addInfo(c_soft, 'softShadowsEnabled');

    const c_softSteps = lightingFolder
      .add(this.params, 'softShadowSteps', 8, 64, 1)
      .name('Shadow Quality')
      .onChange((value) => {
        if (this.uniforms.u_softShadowSteps) {
          this.uniforms.u_softShadowSteps.value = value;
        }
      });
    this.addInfo(c_softSteps, 'softShadowSteps');

    // Shadow early-exit and step clamp
    this.params.shadowEarlyExit = DEFAULTS.shadowEarlyExit || 0.0;
    const c_shEarly = lightingFolder
      .add(this.params, 'shadowEarlyExit', 0.0, 0.6, 0.01)
      .name('Shadow Early Exit')
      .onChange((v) => {
        if (this.uniforms.u_shadowEarlyExit) this.uniforms.u_shadowEarlyExit.value = v;
      });
    this.addInfo(c_shEarly, 'shadowEarlyExit');

    this.params.shadowStepClamp = DEFAULTS.shadowStepClamp || 0.0;
    const c_shClamp = lightingFolder
      .add(this.params, 'shadowStepClamp', 0.0, 0.3, 0.01)
      .name('Shadow Step Clamp')
      .onChange((v) => {
        if (this.uniforms.u_shadowStepClamp) this.uniforms.u_shadowStepClamp.value = v;
      });
    this.addInfo(c_shClamp, 'shadowStepClamp');

    // Shadow bias (to reduce self-shadowing bands)
    this.params.shadowBiasBase = DEFAULTS.shadowBiasBase || 0.0015;
    this.params.shadowBiasSlope = DEFAULTS.shadowBiasSlope || 0.0005;
    const c_shBias = lightingFolder
      .add(this.params, 'shadowBiasBase', 0.0, 0.01, 0.0001)
      .name('Shadow Bias Base')
      .onChange((v) => {
        if (this.uniforms.u_shadowBiasBase) this.uniforms.u_shadowBiasBase.value = v;
      });
    this.addInfo(c_shBias, 'shadowBiasBase');
    const c_shBiasSlope = lightingFolder
      .add(this.params, 'shadowBiasSlope', 0.0, 0.005, 0.0001)
      .name('Shadow Bias Slope')
      .onChange((v) => {
        if (this.uniforms.u_shadowBiasSlope) this.uniforms.u_shadowBiasSlope.value = v;
      });
    this.addInfo(c_shBiasSlope, 'shadowBiasSlope');

    this.params.shadowBiasAngle = DEFAULTS.shadowBiasAngle || 0.002;
    const c_shBiasAngle = lightingFolder
      .add(this.params, 'shadowBiasAngle', 0.0, 0.01, 0.0005)
      .name('Shadow Bias Angle')
      .onChange((v) => {
        if (this.uniforms.u_shadowBiasAngle) this.uniforms.u_shadowBiasAngle.value = v;
      });
    this.addInfo(c_shBiasAngle, 'shadowBiasAngle');

    // Plane bias and optional shadow dither
    this.params.shadowPlaneBias = DEFAULTS.shadowPlaneBias || 0.02;
    const c_shPlane = lightingFolder
      .add(this.params, 'shadowPlaneBias', 0.0, 0.05, 0.001)
      .name('Shadow Plane Bias')
      .onChange((v) => {
        if (this.uniforms.u_shadowPlaneBias) this.uniforms.u_shadowPlaneBias.value = v;
      });
    this.addInfo(c_shPlane, 'shadowPlaneBias');

    this.params.shadowDitherStrength = DEFAULTS.shadowDitherStrength || 0.0;
    const c_shDith = lightingFolder
      .add(this.params, 'shadowDitherStrength', 0.0, 1.0, 0.05)
      .name('Shadow Dither Strength')
      .onChange((v) => {
        if (this.uniforms.u_shadowDitherStrength) this.uniforms.u_shadowDitherStrength.value = v;
      });
    this.addInfo(c_shDith, 'shadowDitherStrength');

    // Integrator plane clamp radius (stabilize floor for Sphere integrator)

    const c_sharp = lightingFolder
      .add(this.params, 'shadowSharpness', 1.0, 32.0, 0.5)
      .name('Shadow Sharpness')
      .onChange((value) => {
        if (this.uniforms.u_shadowSharpness) {
          this.uniforms.u_shadowSharpness.value = value;
        }
      });
    this.addInfo(c_sharp, 'shadowSharpness');

    // Mirror of Budget LOD's "Shadow Min Steps" for convenience
    const c_shMinLighting = lightingFolder
      .add(this.params, 'softShadowMinSteps', 4, 32, 1)
      .name('Shadow Min Steps (Far)')
      .onChange((value) => {
        if (this.uniforms.u_softShadowMinSteps) {
          this.uniforms.u_softShadowMinSteps.value = value;
        }
      });
    this.addInfo(c_shMinLighting, 'softShadowMinSteps');

    const c_normEps = lightingFolder
      .add(this.params, 'normalEpsilon', 0.00001, 0.0001, 0.00001)
      .name('Normal Precision')
      .onChange((value) => {
        if (this.uniforms.u_normalEpsilon) {
          this.uniforms.u_normalEpsilon.value = value;
        }
      });
    this.addInfo(c_normEps, 'normalEpsilon');
    lightingFolder
      .add(
        {
          reset: () =>
            resetSection([
              'lightPosX',
              'lightPosY',
              'lightPosZ',
              'lightColor',
              'ambientStrength',
              'diffuseStrength',
              'specularStrength',
              'shininess',
              'aoEnabled',
              'aoMaxSamples',
              'softShadowsEnabled',
              'softShadowSteps',
              'shadowSharpness',
              'softShadowMinSteps',
              'shadowEarlyExit',
              'shadowStepClamp',
              'shadowBiasBase',
              'shadowBiasSlope',
              'shadowBiasAngle',
              'shadowPlaneBias',
              'shadowDitherStrength',
              'aoFallbackStrength',
              'normalEpsilon',
              'lightColor',
              'tintDiffuse',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Lighting');

    // Color System Folder
    const colorFolder = this.gui.addFolder('Color');
    colorFolder.open(); // Open by default to showcase new feature

    const c_colorMode = colorFolder
      .add(this.params, 'colorMode', {
        Material: 0,
        'Orbit Trap': 1,
        Distance: 2,
        Normal: 3,
        Texture: 4,
      })
      .name('Color Mode')
      .onChange((value) => {
        if (this.uniforms.u_colorMode) {
          this.uniforms.u_colorMode.value = value;
        }
      });
    this.addInfo(c_colorMode, 'colorMode');
    const texColorFolder = colorFolder.addFolder('Texture Colors');
    const c_texBase = texColorFolder
      .addColor(this.params, 'texColorBase')
      .name('Base Color')
      .onChange((v) => {
        if (this.uniforms.u_texColorBase) {
          const c = new THREE.Color(v);
          this.uniforms.u_texColorBase.value.copy(c);
        }
      });
    const c_texAccent = texColorFolder
      .addColor(this.params, 'texColorAccent')
      .name('Accent Color')
      .onChange((v) => {
        if (this.uniforms.u_texColorAccent) {
          const c2 = new THREE.Color(v);
          this.uniforms.u_texColorAccent.value.copy(c2);
        }
      });
    this._INFO.texColorBase = [
      'Base Color',
      'Primary material color for “Texture” color mode (e.g., stone base).',
    ];
    this._INFO.texColorAccent = [
      'Accent Color',
      'Secondary color mixed by the procedural texture value (e.g., marble veins).',
    ];
    this.addInfo(c_texBase, 'texColorBase');
    this.addInfo(c_texAccent, 'texColorAccent');

    // Keep a label->value map so we can reliably translate DOM <select> values
    const paletteOptions = {
      'Deep Ocean': 0,
      'Molten Lava': 1,
      Electric: 2,
      Organic: 3,
      Monochrome: 4,
      'Deep Abyss': 5,
      'Tropical Sea': 6,
      'Custom (Editor)': -1,
    };
    const c_palette = colorFolder
      .add(this.params, 'palette', paletteOptions)
      .name('Palette')
      .onChange((value) => {
        if (this._paletteUpdating) return;
        this._paletteUpdating = true;
        const v = Number(value) | 0;
        // Sync params and uniforms immediately
        this.params.palette = v;
        if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = v;
        if (this.uniforms.u_useCustomPalette)
          this.uniforms.u_useCustomPalette.value = v < 0 ? 1 : 0;
        if (v >= 0) this._lastBuiltInPaletteId = v;
        // Pack custom palette data when needed
        try {
          const mgr = this.callbacks && this.callbacks.paletteManager;
          if (mgr && v < 0) {
            mgr.packToUniforms(this.uniforms);
          }
        } catch (_) {}
        // Redraw preview and force shader refresh
        try {
          if (typeof this._requestPreview === 'function') this._requestPreview();
          else if (typeof this._renderPreview === 'function') this._renderPreview();
        } catch (_) {}
        if (this.callbacks && this.callbacks.requestShaderRefresh) {
          this.callbacks.requestShaderRefresh();
        }
        // Ensure controller UI shows the correct label/value
        try {
          c_palette.setValue(v);
          c_palette.updateDisplay();
        } catch (_) {}
        this._paletteUpdating = false;
      });
    this.addInfo(c_palette, 'palette');
    // No per-frame fallback; updates occur immediately via GUI events

    // Re‑install a lightweight DOM hook on the underlying <select> to ensure
    // palette changes are caught even if lil‑gui's onChange chain is skipped.
    try {
      const installPaletteDomHook = () => {
        const row = c_palette && c_palette.domElement;
        if (!row) return;
        const sel = row.querySelector('select');
        if (!sel || sel.__parHooked) return;
        // Normalize option values to numeric ids so sel.value is reliable
        try {
          const opts = sel.querySelectorAll('option');
          opts.forEach((opt) => {
            const label = (opt.textContent || '').trim();
            if (Object.prototype.hasOwnProperty.call(paletteOptions, label)) {
              opt.value = String(paletteOptions[label]);
            }
          });
        } catch (_) {}
        sel.__parHooked = true;
        const handler = () => {
          if (this._paletteUpdating) return;
          this._paletteUpdating = true;
          const parsed = parseInt(sel.value, 10);
          const v = Number.isFinite(parsed) ? parsed : 0;
          try {
            sel.value = String(v);
          } catch (_) {}
          this.params.palette = v;
          if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = v;
          if (this.uniforms.u_useCustomPalette)
            this.uniforms.u_useCustomPalette.value = v < 0 ? 1 : 0;
          if (v >= 0) this._lastBuiltInPaletteId = v;
          const mgr2 = this.callbacks && this.callbacks.paletteManager;
          if (mgr2 && v < 0) {
            try {
              mgr2.packToUniforms(this.uniforms);
            } catch (_) {}
          }
          try {
            if (typeof this._renderPreview === 'function') this._renderPreview();
          } catch (_) {}
          if (this.callbacks && this.callbacks.requestShaderRefresh)
            this.callbacks.requestShaderRefresh();
          try {
            c_palette.setValue(v);
            c_palette.updateDisplay();
          } catch (_) {}
          this._paletteUpdating = false;
        };
        sel.addEventListener('change', handler, true);
        sel.addEventListener('input', handler, true);
      };
      // Install now and after a microtask (in case GUI mutates DOM soon after)
      installPaletteDomHook();
      setTimeout(installPaletteDomHook, 0);
      // Observe future DOM changes under this controller row
      const row2 = c_palette && c_palette.domElement;
      if (row2 && window.MutationObserver) {
        const mo = new MutationObserver(() => installPaletteDomHook());
        mo.observe(row2, { childList: true, subtree: true });
      }
    } catch (_) {}

    // Removed: manual force-refresh button (no longer needed)

    const c_colInt = colorFolder
      .add(this.params, 'colorIntensity', 0.1, 2.0, 0.1)
      .name('Intensity')
      .onChange((value) => {
        if (this.uniforms.u_colorIntensity) {
          this.uniforms.u_colorIntensity.value = value;
        }
      });
    this.addInfo(c_colInt, 'colorIntensity');

    // --- Custom Palette Editor ---
    const mgr = this.callbacks && this.callbacks.paletteManager;
    const customFolder = colorFolder.addFolder('Custom Palette');
    // Keep closed until user selects Custom
    customFolder.close();
    const refreshFolderOpenState = () => {
      try {
        const isCustom = Number(this.params.palette) < 0;
        if (isCustom) customFolder.open();
        else customFolder.close();
      } catch (_) {}
    };
    refreshFolderOpenState();

    // Debounce rebuild to avoid duplicate groups when slider updates quickly
    let _rebuildTimer = null;
    const scheduleRebuild = () => {
      clearTimeout(_rebuildTimer);
      _rebuildTimer = setTimeout(() => {
        rebuildStopsUI();
        this._requestPreview ? this._requestPreview() : renderPreview();
      }, 0);
    };

    const model = {
      // lightweight model reflecting current palette
      activeName: mgr ? mgr.currentName : 'Custom Gradient',
      renameTo: '',
      stopsCount: 0,
      interpolation:
        mgr && mgr.getCurrent() ? mgr.getCurrent().interpolation || 'linear' : 'linear',
      wrap: mgr && mgr.getCurrent() ? mgr.getCurrent().wrap || 'clamp' : 'clamp',
    };

    // Gradient preview canvas
    const previewEl = document.createElement('div');
    previewEl.style.padding = '6px 4px 2px';
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 220;
    previewCanvas.height = 14;
    previewCanvas.style.width = '220px';
    previewCanvas.style.height = '14px';
    previewCanvas.style.border = '1px solid #333';
    previewCanvas.style.borderRadius = '2px';
    previewCanvas.style.display = 'block';
    previewEl.appendChild(previewCanvas);
    // Inject preview into folder DOM
    try {
      customFolder.domElement.appendChild(previewEl);
    } catch (_) {}

    const renderPreview = () => {
      if (!mgr) return;
      const p = mgr.getCurrent();
      const paletteId =
        this.params && typeof this.params.palette !== 'undefined' ? this.params.palette | 0 : -1;
      const ctx = previewCanvas.getContext('2d');
      const w = previewCanvas.width,
        h = previewCanvas.height;
      const img = ctx.createImageData(w, h);
      // If built-in selected, preview that; otherwise preview current custom
      let stops, interp, wrap;
      const toRGB = (hex) => {
        const c = new THREE.Color(hex);
        return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
      };
      const gradient5 = (c1, c2, c3, c4, c5) => [
        { pos: 0.0, color: c1 },
        { pos: 0.25, color: c2 },
        { pos: 0.5, color: c3 },
        { pos: 0.75, color: c4 },
        { pos: 1.0, color: c5 },
      ];
      const cosSample = (a, b, c, d, t) => {
        // emulate IQ's cosine palette in JS (approximate)
        const twoPi = Math.PI * 2.0;
        const comp = (ai, bi, ci, di) => ai + bi * Math.cos(twoPi * (ci * t + di));
        const A = new THREE.Color(a),
          B = new THREE.Color(b),
          C = new THREE.Color(c),
          D = new THREE.Color(d);
        const rr = comp(A.r, B.r, C.r, D.r),
          gg = comp(A.g, B.g, C.g, D.g),
          bb = comp(A.b, B.b, C.b, D.b);
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const col = new THREE.Color(clamp01(rr), clamp01(gg), clamp01(bb));
        return `#${col.getHexString()}`;
      };
      const cosStops = (a, b, c, d, samples = 8) => {
        const out = [];
        for (let i = 0; i < samples; i++) {
          const t = i / (samples - 1);
          out.push({ pos: t, color: cosSample(a, b, c, d, t) });
        }
        return out;
      };
      if (paletteId >= 0) {
        // Built-ins mapping (approximate colors)
        if (paletteId === 0) {
          stops = gradient5('#071020', '#0f2959', '#155a95', '#1aa6a6', '#d9f2fa');
          interp = 'linear';
          wrap = 'repeat';
        } else if (paletteId === 1) {
          stops = cosStops('#805033', '#805033', '#ffff80', '#cc3300');
          interp = 'cosine';
          wrap = 'repeat';
        } else if (paletteId === 2) {
          stops = cosStops('#808080', '#808080', '#ffffff', '#0055aa');
          interp = 'cosine';
          wrap = 'repeat';
        } else if (paletteId === 3) {
          stops = cosStops('#66804d', '#4d6653', '#ffff80', '#336600');
          interp = 'cosine';
          wrap = 'repeat';
        } else if (paletteId === 4) {
          stops = cosStops('#4d4d4d', '#666680', '#ffffff', '#00004d');
          interp = 'cosine';
          wrap = 'repeat';
        } else if (paletteId === 5) {
          stops = gradient5('#03050a', '#05101c', '#071f2e', '#0d3838', '#4da0bf');
          interp = 'linear';
          wrap = 'repeat';
        } else if (paletteId === 6) {
          stops = gradient5('#053126', '#0c7390', '#0cbfbf', '#73e6bf', '#fafae8');
          interp = 'linear';
          wrap = 'repeat';
        } else {
          stops = gradient5('#000000', '#222222', '#555555', '#aaaaaa', '#ffffff');
          interp = 'linear';
          wrap = 'clamp';
        }
      } else {
        if (!p) return;
        stops = mgr.normalizeStops(p.stops);
        interp = String(p.interpolation || 'linear');
        wrap = String(p.wrap || 'clamp');
      }
      const sample = (t) => {
        // wrap
        let x = t;
        if (wrap === 'repeat') x = x - Math.floor(x);
        else if (wrap === 'mirror') {
          const f = x - Math.floor(x);
          x = 1 - Math.abs(1 - 2 * f);
        }
        // clamp
        if (x < 0) x = 0;
        if (x > 1) x = 1;
        // find segment
        let idx = 0;
        for (let j = 1; j < stops.length; j++) {
          if (x < stops[j].pos) {
            idx = j - 1;
            break;
          }
          idx = Math.max(0, stops.length - 2);
        }
        const t0 = stops[idx].pos,
          t1 = stops[idx + 1].pos;
        const c0 = toRGB(stops[idx].color),
          c1 = toRGB(stops[idx + 1].color);
        let f = t1 > t0 ? (x - t0) / (t1 - t0) : 0;
        if (interp === 'cosine') {
          f = 0.5 - 0.5 * Math.cos(Math.PI * f);
        }
        const mix = (a, b) => Math.round(a + (b - a) * f);
        return [mix(c0[0], c1[0]), mix(c0[1], c1[1]), mix(c0[2], c1[2])];
      };
      for (let x = 0; x < w; x++) {
        const t = x / (w - 1);
        const [r, g, b] = sample(t);
        for (let y = 0; y < h; y++) {
          const idx = (y * w + x) * 4;
          img.data[idx] = r;
          img.data[idx + 1] = g;
          img.data[idx + 2] = b;
          img.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    // Throttled preview requests to reduce repaints during drags
    let _previewTimer = null;
    let _lastPreviewMs = 0;
    const requestPreview = () => {
      try {
        clearTimeout(_previewTimer);
      } catch (_) {}
      const now =
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const since = now - _lastPreviewMs;
      const delay = since < 50 ? 50 - since : 0;
      _previewTimer = setTimeout(() => {
        renderPreview();
        _lastPreviewMs = performance.now ? performance.now() : Date.now();
      }, delay);
    };
    this._renderPreview = renderPreview;
    this._requestPreview = requestPreview;
    // Expose to instance for force-refresh from outside
    this._renderPreview = renderPreview;

    const rebuildStopsUI = () => {
      // Clear previous controllers
      if (!customFolder._stopControllers) customFolder._stopControllers = [];
      customFolder._stopControllers.forEach((c) => {
        try {
          c.destroy();
        } catch (_) {
          try {
            customFolder.remove(c);
          } catch (_) {}
        }
      });
      customFolder._stopControllers = [];
      if (!mgr) return;
      const p = mgr.getCurrent();
      if (!p) return;
      const stops = mgr.normalizeStops(p.stops);
      model.stopsCount = stops.length;
      // Build controllers per stop
      stops.forEach((s, i) => {
        const colorKey = `stop_${i}_color`;
        const posKey = `stop_${i}_pos`;
        // Attach to params so lil-gui can bind
        if (!this.params._custom) this.params._custom = {};
        this.params._custom[colorKey] = s.color;
        this.params._custom[posKey] = s.pos;
        const cc = customFolder
          .addColor(this.params._custom, colorKey)
          .name(`Stop ${i + 1} Color`)
          .onChange((val) => {
            const cur = mgr.getCurrent();
            const list = mgr.normalizeStops(cur.stops);
            list[i].color = val;
            mgr.updateStops(cur.name, list);
            mgr.packToUniforms(this.uniforms);
            // Do NOT rebuild on color change to avoid closing the popover
            if (this._requestPreview) this._requestPreview();
            else renderPreview();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          });
        const cp = customFolder
          .add(this.params._custom, posKey, 0.0, 1.0, 0.001)
          .name(`Stop ${i + 1} Pos`)
          .onChange((val) => {
            const cur = mgr.getCurrent();
            const list = mgr.normalizeStops(cur.stops);
            list[i].pos = parseFloat(val);
            mgr.updateStops(cur.name, list);
            mgr.packToUniforms(this.uniforms);
            // Live update uniforms during drag; rebuild after release only
            if (this._requestPreview) this._requestPreview();
            else renderPreview();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          });
        if (typeof cp.onFinishChange === 'function') {
          cp.onFinishChange(() => scheduleRebuild());
        }
        customFolder._stopControllers.push(cc, cp);
      });
    };

    // Active palette selector
    const namesObj = () => {
      const o = {};
      (mgr ? mgr.listNames() : []).forEach((n) => {
        o[n] = n;
      });
      return o;
    };
    const c_active = customFolder
      .add(model, 'activeName', namesObj())
      .name('Active')
      .onChange((name) => {
        if (!mgr) return;
        mgr.setCurrent(name);
        mgr.packToUniforms(this.uniforms);
        // Ensure using custom palette
        if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 1;
        if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = -1;
        this.params.palette = -1;
        if (this.gui && this.gui.controllersRecursive)
          this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
        rebuildStopsUI();
        // sync interpolation/wrap model and controllers
        try {
          const cur = mgr.getCurrent();
          model.interpolation = cur.interpolation || 'linear';
          model.wrap = cur.wrap || 'clamp';
          interpCtl.updateDisplay();
          wrapCtl.updateDisplay();
        } catch (_) {}
        if (this._requestPreview) this._requestPreview();
        else renderPreview();
      });

    // Rename field + action
    const c_rename = customFolder.add(model, 'renameTo').name('Rename To');
    customFolder
      .add(
        {
          rename: () => {
            if (!mgr || !model.renameTo) return;
            const ok = mgr.renamePalette(mgr.currentName, model.renameTo);
            if (ok) {
              model.activeName = model.renameTo;
              c_active.options(namesObj());
              c_active.setValue(model.activeName);
              model.renameTo = '';
              c_rename.updateDisplay();
            }
          },
        },
        'rename'
      )
      .name('Apply Rename');

    // Interpolation & wrap
    const interpCtl = customFolder
      .add(model, 'interpolation', { Linear: 'linear', Cosine: 'cosine' })
      .name('Interpolation')
      .onChange((val) => {
        if (!mgr) return;
        const cur = mgr.getCurrent();
        cur.interpolation = val;
        mgr.saveAll();
        mgr.packToUniforms(this.uniforms);
        if (this._requestPreview) this._requestPreview();
        else renderPreview();
      });
    const wrapCtl = customFolder
      .add(model, 'wrap', { Clamp: 'clamp', Repeat: 'repeat', Mirror: 'mirror' })
      .name('Wrap Mode')
      .onChange((val) => {
        if (!mgr) return;
        const cur = mgr.getCurrent();
        cur.wrap = val;
        mgr.saveAll();
        mgr.packToUniforms(this.uniforms);
        if (this._requestPreview) this._requestPreview();
        else renderPreview();
      });

    // Duplicate from built-in
    customFolder
      .add(
        {
          duplicate: () => {
            if (!mgr) return;
            const builtInId = this.params.palette | 0;
            if (builtInId < 0) return; // already custom
            const rec = mgr.duplicateFromBuiltIn(builtInId);
            if (!rec) return;
            model.activeName = rec.name;
            // Switch to custom mode
            if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 1;
            if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = -1;
            this.params.palette = -1;
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
            c_active.options(namesObj());
            c_active.setValue(model.activeName);
            rebuildStopsUI();
            mgr.packToUniforms(this.uniforms);
            if (this._requestPreview) this._requestPreview();
            else renderPreview();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          },
        },
        'duplicate'
      )
      .name('Duplicate from Built‑in');

    // Duplicate current custom
    customFolder
      .add(
        {
          duplicateCurrent: () => {
            if (!mgr) return;
            const rec = mgr.duplicatePalette(mgr.currentName);
            if (!rec) return;
            model.activeName = rec.name;
            // Ensure custom mode
            if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 1;
            if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = -1;
            this.params.palette = -1;
            c_active.options(namesObj());
            c_active.setValue(model.activeName);
            rebuildStopsUI();
            mgr.packToUniforms(this.uniforms);
            if (this._requestPreview) this._requestPreview();
            else renderPreview();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          },
        },
        'duplicateCurrent'
      )
      .name('Duplicate Current');

    // Reset back to last built-in selection
    customFolder
      .add(
        {
          resetToBuiltIn: () => {
            const id = this._lastBuiltInPaletteId | 0;
            this.params.palette = id;
            if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = id;
            if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 0;
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          },
        },
        'resetToBuiltIn'
      )
      .name('Reset to Built‑in');

    // Add/Remove stops
    customFolder
      .add(
        {
          addStop: () => {
            if (!mgr) return;
            const cur = mgr.getCurrent();
            const list = mgr.normalizeStops(cur.stops);
            if (list.length >= 8) return; // MAX_PALETTE_STOPS
            const a = list[Math.max(0, list.length - 2)].pos;
            const b = list[list.length - 1].pos;
            const mid = (a + b) * 0.5;
            list.push({ pos: clamp(mid, 0.0, 1.0), color: list[list.length - 1].color });
            mgr.updateStops(cur.name, list);
            mgr.packToUniforms(this.uniforms);
            rebuildStopsUI();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          },
        },
        'addStop'
      )
      .name('+ Add Stop');
    customFolder
      .add(
        {
          removeStop: () => {
            if (!mgr) return;
            const cur = mgr.getCurrent();
            let list = mgr.normalizeStops(cur.stops);
            if (list.length <= 2) return;
            list = list.slice(0, -1);
            mgr.updateStops(cur.name, list);
            mgr.packToUniforms(this.uniforms);
            rebuildStopsUI();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          },
        },
        'removeStop'
      )
      .name('− Remove Last');

    // New/Delete
    customFolder
      .add(
        {
          new: () => {
            if (!mgr) return;
            const p = mgr.newPalette('Custom Gradient');
            model.activeName = p.name;
            c_active.options(namesObj());
            c_active.setValue(model.activeName);
            mgr.packToUniforms(this.uniforms);
            // Ensure custom active
            if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 1;
            if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = -1;
            this.params.palette = -1;
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
            rebuildStopsUI();
            if (this.callbacks && this.callbacks.requestShaderRefresh)
              this.callbacks.requestShaderRefresh();
          },
        },
        'new'
      )
      .name('New Palette');
    customFolder
      .add(
        {
          delete: () => {
            if (!mgr) return;
            const name = mgr.currentName;
            const ok = mgr.deletePalette(name);
            if (ok) {
              c_active.options(namesObj());
              c_active.setValue(mgr.currentName);
              mgr.packToUniforms(this.uniforms);
              rebuildStopsUI();
              if (this.callbacks && this.callbacks.requestShaderRefresh)
                this.callbacks.requestShaderRefresh();
            }
          },
        },
        'delete'
      )
      .name('Delete Palette');

    // Import/Export
    customFolder
      .add(
        {
          export: () => {
            if (mgr) mgr.exportPalette(mgr.currentName, true);
          },
        },
        'export'
      )
      .name('Export JSON');
    customFolder
      .add(
        {
          import: () => {
            if (!mgr) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.onchange = async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              try {
                await mgr.importPaletteFromFile(file);
                model.activeName = mgr.currentName;
                c_active.options(namesObj());
                c_active.setValue(model.activeName);
                mgr.packToUniforms(this.uniforms);
                // Ensure custom active
                if (this.uniforms.u_useCustomPalette) this.uniforms.u_useCustomPalette.value = 1;
                if (this.uniforms.u_paletteId) this.uniforms.u_paletteId.value = -1;
                this.params.palette = -1;
                if (this.gui && this.gui.controllersRecursive)
                  this.gui
                    .controllersRecursive()
                    .forEach((c) => c.updateDisplay && c.updateDisplay());
                rebuildStopsUI();
                if (this.callbacks && this.callbacks.requestShaderRefresh)
                  this.callbacks.requestShaderRefresh();
              } catch (err) {
                console.warn('Import failed:', err);
              }
            };
            input.click();
          },
        },
        'import'
      )
      .name('Import JSON');

    // Helper clamp function in UI scope
    function clamp(x, a, b) {
      return Math.max(a, Math.min(b, x));
    }

    // Initial build
    if (mgr) {
      rebuildStopsUI();
      if (this._requestPreview) this._requestPreview();
      else renderPreview();
    }
    // Make sure folder toggles when user flips palette mode
    c_palette.onChange(refreshFolderOpenState);

    const c_otScale = colorFolder
      .add(this.params, 'orbitTrapScale', 0.1, 5.0, 0.1)
      .name('Orbit Trap Scale')
      .onChange((value) => {
        if (this.uniforms.u_orbitTrapScale) {
          this.uniforms.u_orbitTrapScale.value = value;
        }
      });
    this.addInfo(c_otScale, 'orbitTrapScale');

    const c_matColor = colorFolder
      .addColor(this.params, 'materialColor')
      .name('Material Color')
      .onChange((value) => {
        if (this.uniforms.u_materialColor) {
          // Convert hex string to THREE.Color
          const color = new THREE.Color(value);
          this.uniforms.u_materialColor.value.copy(color);
        }
      });
    this.addInfo(c_matColor, 'materialColor');
    colorFolder
      .add(
        {
          reset: () =>
            resetSection([
              'colorMode',
              'palette',
              'colorIntensity',
              'orbitTrapScale',
              'materialColor',
              'texColorBase',
              'texColorAccent',
              'texAColorBase',
              'texAColorAccent',
              'texBColorBase',
              'texBColorAccent',
              'texLayerColoring',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Color');

    // Environment Controls Folder
    const envFolder = this.gui.addFolder('Environment');
    envFolder.close();

    const c_fog = envFolder
      .add(this.params, 'fogEnabled')
      .name('Fog Enabled')
      .onChange((value) => {
        if (this.uniforms.u_fogEnabled) {
          this.uniforms.u_fogEnabled.value = value;
        }
      });
    this.addInfo(c_fog, 'fogEnabled');

    const c_fogType = envFolder
      .add(this.params, 'fogType', {
        Exponential: 0,
        'Exponential Squared': 1,
        Linear: 2,
      })
      .name('Fog Type')
      .onChange((value) => {
        if (this.uniforms.u_fogType) {
          this.uniforms.u_fogType.value = value;
        }
      });
    this.addInfo(c_fogType, 'fogType');

    const c_fogDen = envFolder
      .add(this.params, 'fogDensity', 0, 0.1, 0.001)
      .name('Fog Density (Exp)')
      .onChange((value) => {
        if (this.uniforms.u_fogDensity) {
          this.uniforms.u_fogDensity.value = value;
        }
      });
    this.addInfo(c_fogDen, 'fogDensity');

    const c_fogNear = envFolder
      .add(this.params, 'fogNear', 0.1, 100, 0.1)
      .name('Fog Near (Linear)')
      .onChange((value) => {
        if (this.uniforms.u_fogNear) {
          this.uniforms.u_fogNear.value = value;
        }
      });
    this.addInfo(c_fogNear, 'fogNear');

    const c_fogFar = envFolder
      .add(this.params, 'fogFar', 1, 200, 1)
      .name('Fog Far (Linear)')
      .onChange((value) => {
        if (this.uniforms.u_fogFar) {
          this.uniforms.u_fogFar.value = value;
        }
      });
    this.addInfo(c_fogFar, 'fogFar');

    const c_fogCol = envFolder
      .addColor(this.params, 'fogColor')
      .name('Fog Color')
      .onChange((value) => {
        if (this.uniforms.u_fogColor) {
          const color = new THREE.Color(value);
          this.uniforms.u_fogColor.value.copy(color);
        }
      });
    this.addInfo(c_fogCol, 'fogColor');

    const c_bg = envFolder
      .addColor(this.params, 'backgroundColor')
      .name('Background')
      .onChange((value) => {
        if (this.uniforms.u_backgroundColor) {
          const bg = new THREE.Color(value);
          this.uniforms.u_backgroundColor.value.copy(bg);
        }
        if (this.callbacks.onBackgroundChange) {
          this.callbacks.onBackgroundChange(value);
        }
      });
    this.addInfo(c_bg, 'backgroundColor');

    // Post Processing Folder
    const postFolder = this.gui.addFolder('Post Processing');
    const c_postExp = postFolder
      .add(this.params, 'postExposure', 0.0, 3.0, 0.01)
      .name('Exposure')
      .onChange((v) => {
        if (this.uniforms.u_postExposure) this.uniforms.u_postExposure.value = v;
      });
    const c_postCon = postFolder
      .add(this.params, 'postContrast', 0.5, 1.8, 0.01)
      .name('Contrast')
      .onChange((v) => {
        if (this.uniforms.u_postContrast) this.uniforms.u_postContrast.value = v;
      });
    const c_postSat = postFolder
      .add(this.params, 'postSaturation', 0.0, 2.0, 0.01)
      .name('Saturation')
      .onChange((v) => {
        if (this.uniforms.u_postSaturation) this.uniforms.u_postSaturation.value = v;
      });
    const c_postGamma = postFolder
      .add(this.params, 'postGamma', 0.5, 2.4, 0.01)
      .name('Gamma')
      .onChange((v) => {
        if (this.uniforms.u_postGamma) this.uniforms.u_postGamma.value = v;
      });
    const c_vigStr = postFolder
      .add(this.params, 'vignetteStrength', 0.0, 1.0, 0.01)
      .name('Vignette Strength')
      .onChange((v) => {
        if (this.uniforms.u_vignetteStrength) this.uniforms.u_vignetteStrength.value = v;
      });
    const c_vigSoft = postFolder
      .add(this.params, 'vignetteSoftness', 0.0, 1.0, 0.01)
      .name('Vignette Softness')
      .onChange((v) => {
        if (this.uniforms.u_vignetteSoftness) this.uniforms.u_vignetteSoftness.value = v;
      });
    const toneOptions = { None: 0, ACES: 1, Filmic: 2 };
    const c_tone = postFolder
      .add(this.params, 'toneMapper', toneOptions)
      .name('Tone Mapper')
      .onChange((v) => {
        if (this.uniforms.u_toneMapper) this.uniforms.u_toneMapper.value = Number(v) | 0;
      });
    this.addInfo(c_postExp, 'postExposure');
    this.addInfo(c_postCon, 'postContrast');
    this.addInfo(c_postSat, 'postSaturation');
    this.addInfo(c_postGamma, 'postGamma');
    this.addInfo(c_vigStr, 'vignetteStrength');
    this.addInfo(c_vigSoft, 'vignetteSoftness');
    this.addInfo(c_tone, 'toneMapper');
    // Bloom controls
    const bloomFolder = postFolder.addFolder('Bloom');
    this.params.bloomEnabled = false;
    this.params.bloomThreshold = 1.0;
    this.params.bloomStrength = 0.0;
    this.params.bloomRadius = 1.0;
    const c_bloomOn = bloomFolder
      .add(this.params, 'bloomEnabled')
      .name('Enable Bloom')
      .onChange((v) => {
        if (this.uniforms.u_bloomEnabled) this.uniforms.u_bloomEnabled.value = !!v;
      });
    const c_bloomTh = bloomFolder
      .add(this.params, 'bloomThreshold', 0.0, 2.0, 0.01)
      .name('Threshold')
      .onChange((v) => {
        if (this.uniforms.u_bloomThreshold) this.uniforms.u_bloomThreshold.value = v;
      });
    const c_bloomStr = bloomFolder
      .add(this.params, 'bloomStrength', 0.0, 3.0, 0.01)
      .name('Strength')
      .onChange((v) => {
        if (this.uniforms.u_bloomStrength) this.uniforms.u_bloomStrength.value = v;
      });
    const c_bloomRad = bloomFolder
      .add(this.params, 'bloomRadius', 0.5, 8.0, 0.1)
      .name('Radius(px)')
      .onChange((v) => {
        if (this.uniforms.u_bloomRadius) this.uniforms.u_bloomRadius.value = v;
      });
    this.addInfo(c_bloomOn, 'bloomEnabled');
    this.addInfo(c_bloomTh, 'bloomThreshold');
    this.addInfo(c_bloomStr, 'bloomStrength');
    this.addInfo(c_bloomRad, 'bloomRadius');

    // LUT controls
    const lutFolder = postFolder.addFolder('Color LUT');
    this.params.lutEnabled = false;
    this.params.lutIntensity = 1.0;
    this.params.lutSize = 32;
    const c_lutOn = lutFolder
      .add(this.params, 'lutEnabled')
      .name('Enable LUT')
      .onChange((v) => {
        if (this.uniforms.u_lutEnabled) this.uniforms.u_lutEnabled.value = !!v;
      });
    const c_lutInt = lutFolder
      .add(this.params, 'lutIntensity', 0.0, 1.0, 0.01)
      .name('Intensity')
      .onChange((v) => {
        if (this.uniforms.u_lutIntensity) this.uniforms.u_lutIntensity.value = v;
      });
    this.addInfo(c_lutOn, 'lutEnabled');
    this.addInfo(c_lutInt, 'lutIntensity');
    // Import LUT PNG laid out as 2D strip (size x size*size)
    lutFolder.add({ import: () => this.importLUT() }, 'import').name('⬆️ Import LUT (PNG)');
    lutFolder
      .add(
        {
          clear: () => {
            if (this.uniforms.u_lutTex) this.uniforms.u_lutTex.value = null;
            this.params.lutEnabled = false;
            if (this.uniforms.u_lutEnabled) this.uniforms.u_lutEnabled.value = false;
          },
        },
        'clear'
      )
      .name('✖ Clear LUT');

    postFolder
      .add(
        {
          reset: () =>
            resetSection([
              'postExposure',
              'postContrast',
              'postSaturation',
              'postGamma',
              'vignetteStrength',
              'vignetteSoftness',
              'toneMapper',
              'bloomEnabled',
              'bloomThreshold',
              'bloomStrength',
              'bloomRadius',
              'lutEnabled',
              'lutIntensity',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Post');

    // Floor controls
    const c_floorEn = envFolder
      .add(this.params, 'floorEnabled')
      .name('Floor Enabled')
      .onChange((value) => {
        if (this.uniforms.u_floorEnabled) this.uniforms.u_floorEnabled.value = value;
      });
    this.addInfo(c_floorEn, 'floorEnabled');
    const c_floorA = envFolder
      .addColor(this.params, 'floorColorA')
      .name('Floor Color A')
      .onChange((value) => {
        if (this.uniforms.u_floorColorA) {
          const c = new THREE.Color(value);
          this.uniforms.u_floorColorA.value.copy(c);
        }
      });
    this.addInfo(c_floorA, 'floorColorA');
    const c_floorB = envFolder
      .addColor(this.params, 'floorColorB')
      .name('Floor Color B')
      .onChange((value) => {
        if (this.uniforms.u_floorColorB) {
          const c = new THREE.Color(value);
          this.uniforms.u_floorColorB.value.copy(c);
        }
      });
    this.addInfo(c_floorB, 'floorColorB');

    // Floor receives shadows
    this.params.floorReceiveShadows = DEFAULTS.floorReceiveShadows === true;
    const c_floorSh = envFolder
      .add(this.params, 'floorReceiveShadows')
      .name('Floor Receives Shadows')
      .onChange((v) => {
        if (this.uniforms.u_floorReceiveShadows) this.uniforms.u_floorReceiveShadows.value = !!v;
      });
    this.addInfo(c_floorSh, 'softShadowsEnabled');

    // (second bias block removed — already added above)
    envFolder
      .add(
        {
          reset: () =>
            resetSection([
              'fogEnabled',
              'fogType',
              'fogDensity',
              'fogNear',
              'fogFar',
              'fogColor',
              'backgroundColor',
              'floorEnabled',
              'floorColorA',
              'floorColorB',
              'floorReceiveShadows',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Environment');

    // Performance Controls Folder
    const perfFolder = this.gui.addFolder('Performance');

    this.qualityController = perfFolder
      .add(this.params, 'quality', ['Low', 'Medium', 'High', 'Ultra'])
      .name('Quality Preset')
      .onChange((value) => {
        this.applyQualityPreset(value);
      });
    this.addInfo(this.qualityController, 'quality');

    // Shaders are always specialized per fractal (compile-time FRAC_TYPE)

    // Mark as initialized after setup
    this.isInitialized = false;

    this.maxStepsController = perfFolder
      .add(this.params, 'maxSteps', 50, 300, 10)
      .name('Max Ray Steps')
      .onChange((value) => {
        if (this.uniforms.u_maxSteps) {
          this.uniforms.u_maxSteps.value = value;
        }
        this.updateBudgetEstimate();
      });
    this.addInfo(this.maxStepsController, 'maxSteps');

    // Integrator preset dropdown (quick switch)
    const applyIntegratorPreset = (key) => {
      if (key === 'segment') {
        this.params.useSegmentTracing = true;
        this.params.integratorAuto = false;
        if (this.params.segmentFraction === undefined || this.params.segmentFraction <= 0)
          this.params.segmentFraction = 0.55;
        if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = true;
        if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
        if (this.uniforms.u_segmentFraction) this.uniforms.u_segmentFraction.value = 0.55;
      } else if (key === 'sphereHybrid') {
        this.params.useSegmentTracing = false;
        this.params.integratorAuto = true;
        this.params.integratorSwitchDist = 2.6;
        if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = false;
        if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = true;
        if (this.uniforms.u_integratorSwitchDist) this.uniforms.u_integratorSwitchDist.value = 2.6;
      } else if (key === 'spherePlain') {
        this.params.useSegmentTracing = false;
        this.params.integratorAuto = false;
        if (this.uniforms.u_useSegmentTracing) this.uniforms.u_useSegmentTracing.value = false;
        if (this.uniforms.u_integratorAuto) this.uniforms.u_integratorAuto.value = false;
      }
      // Refresh GUI + persist
      if (this.gui && this.gui.controllersRecursive)
        this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
      this.schedulePersist();
    };
    const integratorPresetOptions = {
      'Segment (Robust)': 'segment',
      'Sphere (Plain)': 'spherePlain',
      'Sphere (Hybrid)': 'sphereHybrid',
    };
    const initialPreset = this.params.useSegmentTracing
      ? 'segment'
      : this.params.integratorAuto
        ? 'sphereHybrid'
        : 'spherePlain';
    const integratorPresetProxy = { preset: initialPreset };
    const c_intPreset = perfFolder
      .add(integratorPresetProxy, 'preset', integratorPresetOptions)
      .name('Integrator Preset')
      .onChange((v) => applyIntegratorPreset(v));
    this.addInfo(c_intPreset, 'integratorPreset');

    // Auto Resolution Toggle
    const c_autoRes = perfFolder
      .add(this.params, 'autoResolutionEnabled')
      .name('Auto Resolution (FPS)')
      .onChange((value) => {
        if (this.callbacks.onAutoResolutionToggle) {
          this.callbacks.onAutoResolutionToggle(value);
        }
      });
    this.addInfo(c_autoRes, 'autoResolutionEnabled');

    // Auto Resolution tuning subfolder (shown only when enabled)
    const autoResFolder = perfFolder.addFolder('Auto Resolution Tuning');
    autoResFolder.close();
    const setAutoResFolderVisible = (on) => {
      try {
        const el = autoResFolder.domElement;
        if (el) el.style.display = on ? '' : 'none';
      } catch (_) {}
    };
    const c_hold = autoResFolder
      .add(this.params, 'autoResHoldFrames', 30, 300, 10)
      .name('Hold Frames (min)');
    this.addInfo(c_hold, 'autoResHoldFrames');
    const c_sustainLow = autoResFolder
      .add(this.params, 'autoResSustainLow', 1, 5, 1)
      .name('Sustain Low (down)');
    this.addInfo(c_sustainLow, 'autoResSustainLow');
    const c_sustainHigh = autoResFolder
      .add(this.params, 'autoResSustainHigh', 1, 8, 1)
      .name('Sustain High (up)');
    this.addInfo(c_sustainHigh, 'autoResSustainHigh');
    // Initialize visibility based on current toggle
    setAutoResFolderVisible(this.params.autoResolutionEnabled === true);
    // Update visibility when the toggle changes
    c_autoRes.onChange((value) => setAutoResFolderVisible(!!value));

    const c_stepRelax = perfFolder
      .add(this.params, 'stepRelaxation', 0.1, 1.0, 0.01)
      .name('Step Size (Fixed)')
      .onChange((value) => {
        if (this.uniforms.u_stepRelaxation) {
          this.uniforms.u_stepRelaxation.value = value;
        }
      });
    this.addInfo(c_stepRelax, 'stepRelaxation');

    // Fast shading toggles (shader-level shortcuts)
    this.params.fastNormals = false;
    this.params.fastShadows = false;
    this.params.fastAO = false;
    const c_fastN = perfFolder
      .add(this.params, 'fastNormals')
      .name('Fast Normals (3-tap)')
      .onChange((v) => {
        if (this.uniforms.u_fastNormals) this.uniforms.u_fastNormals.value = v;
      });
    this.addInfo(c_fastN, 'normalEpsilon');
    const c_fastS = perfFolder
      .add(this.params, 'fastShadows')
      .name('Fast Shadows (cap)')
      .onChange((v) => {
        if (this.uniforms.u_fastShadows) this.uniforms.u_fastShadows.value = v;
      });
    this.addInfo(c_fastS, 'softShadowMinSteps');
    const c_fastAO = perfFolder
      .add(this.params, 'fastAO')
      .name('Fast AO (Truchet)')
      .onChange((v) => {
        if (this.uniforms.u_fastAO) this.uniforms.u_fastAO.value = v;
      });
    this.addInfo(c_fastAO, 'aoMinSamples');
    perfFolder
      .add(
        {
          reset: () =>
            resetSection([
              'quality',
              'maxSteps',
              'autoResolutionEnabled',
              'autoResHoldFrames',
              'autoResSustainLow',
              'autoResSustainHigh',
              'stepRelaxation',
              'showStats',
              'showDebugOverlay',
              'fastNormals',
              'fastShadows',
              'fastAO',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Performance');

    // Advanced Ray Marching Optimizations
    const advancedFolder = perfFolder.addFolder('Advanced Optimizations');

    // Subfolders to organize many controls
    const integratorFolder = advancedFolder.addFolder('Integrator');
    const relaxFolder = advancedFolder.addFolder('Relaxation');
    const curvatureFolder = advancedFolder.addFolder('Curvature');
    const ditheringFolder = advancedFolder.addFolder('Dithering');
    const lodFolder = advancedFolder.addFolder('LOD');
    const budgetFolder = advancedFolder.addFolder('Budget LOD');
    const safetyFolder = advancedFolder.addFolder('Safeties');

    // Integrator & Normals
    const c_useSeg = integratorFolder
      .add(this.params, 'useSegmentTracing')
      .name('Use Segment Tracing')
      .onChange((value) => {
        if (this.uniforms.u_useSegmentTracing) {
          this.uniforms.u_useSegmentTracing.value = value;
        }
      });
    this.addInfo(c_useSeg, 'useSegmentTracing');

    const c_segFrac = integratorFolder
      .add(this.params, 'segmentFraction', 0.1, 0.9, 0.05)
      .name('Segment Fraction')
      .onChange((value) => {
        if (this.uniforms.u_segmentFraction) {
          this.uniforms.u_segmentFraction.value = value;
        }
      });
    this.addInfo(c_segFrac, 'segmentFraction');

    const c_intAuto = integratorFolder
      .add(this.params, 'integratorAuto')
      .name('Integrator Auto (Hybrid)')
      .onChange((value) => {
        if (this.uniforms.u_integratorAuto) {
          this.uniforms.u_integratorAuto.value = value;
        }
      });
    this.addInfo(c_intAuto, 'integratorAuto');

    const c_intSwitch = integratorFolder
      .add(this.params, 'integratorSwitchDist', 1.0, 6.0, 0.1)
      .name('Integrator Switch Dist')
      .onChange((value) => {
        if (this.uniforms.u_integratorSwitchDist) {
          this.uniforms.u_integratorSwitchDist.value = value;
        }
      });
    this.addInfo(c_intSwitch, 'integratorSwitchDist');

    const c_analytic = integratorFolder
      .add(this.params, 'useAnalyticNormals')
      .name('Mandelbulb DE Normals')
      .onChange((value) => {
        if (this.uniforms.u_useAnalyticNormals) {
          this.uniforms.u_useAnalyticNormals.value = value;
        }
      });
    this.addInfo(c_analytic, 'useAnalyticNormals');

    // Reset for Integrator (bottom of subfolder)
    integratorFolder
      .add(
        {
          reset: () =>
            resetSection([
              'useSegmentTracing',
              'segmentFraction',
              'integratorAuto',
              'integratorSwitchDist',
              'useAnalyticNormals',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Integrator');

    // Truchet fast path toggle (conservative)
    this.params.truchetPortalFast = DEFAULTS.truchetPortalFast === true;
    const c_trFast = safetyFolder
      .add(this.params, 'truchetPortalFast')
      .name('Truchet Portal Fast')
      .onChange((v) => {
        if (this.uniforms.u_truchetPortalFast) this.uniforms.u_truchetPortalFast.value = !!v;
      });
    this._INFO.truchetPortalFast = [
      'Truchet Portal Fast',
      'Conservative early-out for Truchet pipes: approximates tube SDF with a safety margin to skip band/portal details when far. Safe, improves speed in most views.',
    ];
    this.addInfo(c_trFast, 'truchetPortalFast');

    // Tunables for the fast path
    this.params.truchetFastMargin = DEFAULTS.truchetFastMargin;
    const c_trFastM = safetyFolder
      .add(this.params, 'truchetFastMargin', 0.015, 0.06, 0.001)
      .name('Fast Margin')
      .onChange((v) => {
        if (this.uniforms.u_truchetFastMargin) this.uniforms.u_truchetFastMargin.value = v;
      });
    this._INFO.truchetFastMargin = [
      'Fast Margin',
      'Safety pad subtracted from quick tube SDF (meters in unit-truchet space). Higher = safer but smaller steps; default 0.035.',
    ];
    this.addInfo(c_trFastM, 'truchetFastMargin');

    this.params.truchetFastK = DEFAULTS.truchetFastK;
    const c_trFastK = safetyFolder
      .add(this.params, 'truchetFastK', 1.0, 8.0, 0.5)
      .name('Fast Threshold (×margin)')
      .onChange((v) => {
        if (this.uniforms.u_truchetFastK) this.uniforms.u_truchetFastK.value = v;
      });
    this._INFO.truchetFastK = [
      'Fast Threshold',
      'Use quick SDF only when distance > margin × K (default 3.5). Higher K reduces risk of over-conservative steps near the surface.',
    ];
    this.addInfo(c_trFastK, 'truchetFastK');

    this.params.truchetFastMinDist = DEFAULTS.truchetFastMinDist;
    const c_trFastMin = safetyFolder
      .add(this.params, 'truchetFastMinDist', 0.0, 20.0, 0.5)
      .name('Fast Min Dist (world)')
      .onChange((v) => {
        if (this.uniforms.u_truchetFastMinDist) this.uniforms.u_truchetFastMinDist.value = v;
      });
    this._INFO.truchetFastMinDist = [
      'Fast Min Dist',
      'Allow fast path only beyond this camera distance (world units). Prevents step shrinkage in close, dense views.',
    ];
    this.addInfo(c_trFastMin, 'truchetFastMinDist');

    // Budget LOD quick presets
    const budgetPresetOptions = {
      Balanced: 'Balanced',
      Aggressive: 'Aggressive',
      Quality: 'Quality',
      Custom: 'Custom',
    };
    this.budgetPresetController = budgetFolder
      .add(this.params, 'budgetPreset', budgetPresetOptions)
      .name('Budget Preset')
      .onChange((value) => {
        if (value !== 'Custom') this.applyBudgetPreset(value);
      });

    const c_adapt = relaxFolder
      .add(this.params, 'adaptiveRelaxation')
      .name('Adaptive Step Size')
      .onChange((value) => {
        if (this.uniforms.u_adaptiveRelaxation) {
          this.uniforms.u_adaptiveRelaxation.value = value;
        }
      });
    this.addInfo(c_adapt, 'adaptiveRelaxation');

    const c_relMin = relaxFolder
      .add(this.params, 'relaxationMin', 0.1, 1.5, 0.05)
      .name('Min Relaxation')
      .onChange((value) => {
        if (this.uniforms.u_relaxationMin) {
          this.uniforms.u_relaxationMin.value = value;
        }
      });
    this.addInfo(c_relMin, 'relaxationMin');

    const c_relMax = relaxFolder
      .add(this.params, 'relaxationMax', 1.0, 2.0, 0.05)
      .name('Max Relaxation')
      .onChange((value) => {
        if (this.uniforms.u_relaxationMax) {
          this.uniforms.u_relaxationMax.value = value;
        }
      });
    this.addInfo(c_relMax, 'relaxationMax');

    // Reset for Relaxation (bottom of subfolder)
    relaxFolder
      .add(
        { reset: () => resetSection(['adaptiveRelaxation', 'relaxationMin', 'relaxationMax']) },
        'reset'
      )
      .name('↺ Reset Relaxation');

    const c_dither = ditheringFolder
      .add(this.params, 'enableDithering')
      .name('Enable Dithering')
      .onChange((value) => {
        if (this.uniforms.u_enableDithering) {
          this.uniforms.u_enableDithering.value = value;
        }
        if (this.ditheringStrengthController) {
          const row = this.ditheringStrengthController.domElement.closest('li, .controller');
          if (row) row.style.display = value ? '' : 'none';
        }
        // Blue-noise options only apply when dithering is enabled
        try {
          if (this._setBlueOptionsVisibility)
            this._setBlueOptionsVisibility(!!value && !!this.params.useBlueNoise);
        } catch (_) {}
      });
    this.addInfo(c_dither, 'enableDithering');
    // Dithering strength placed directly under the checkbox
    this.ditheringStrengthController = ditheringFolder
      .add(this.params, 'ditheringStrength', 0.0, 1.0, 0.05)
      .name('Dithering Strength')
      .onChange((value) => {
        if (this.uniforms.u_ditheringStrength) {
          this.uniforms.u_ditheringStrength.value = value;
        }
      });
    this.addInfo(this.ditheringStrengthController, 'ditheringStrength');

    // Blue-noise options
    const c_blue = ditheringFolder
      .add(this.params, 'useBlueNoise')
      .name('Blue-Noise Mode')
      .onChange((value) => {
        if (this.uniforms.u_useBlueNoise) {
          this.uniforms.u_useBlueNoise.value = value;
        }
        // Toggle visibility of blue-noise-only options
        try {
          if (this._setBlueOptionsVisibility) this._setBlueOptionsVisibility(!!value);
        } catch (_) {}
      });
    this.addInfo(c_blue, 'useBlueNoise');

    // Dither Fog toggle
    const c_dFog = ditheringFolder
      .add(this.params, 'ditherFog')
      .name('Dither Fog')
      .onChange((v) => {
        if (this.uniforms.u_ditherFog) this.uniforms.u_ditherFog.value = !!v;
      });
    this.addInfo(c_dFog, 'ditherFog');

    const c_blueScale = ditheringFolder
      .add(this.params, 'blueNoiseScale', 1.0, 8.0, 1.0)
      .name('Blue-Noise Scale')
      .onChange((value) => {
        if (this.uniforms.u_blueNoiseScale) {
          this.uniforms.u_blueNoiseScale.value = value;
        }
      });
    this.addInfo(c_blueScale, 'blueNoiseScale');

    // Curvature-aware relaxation controls
    curvatureFolder
      .add(this.params, 'curvatureAwareRelaxation')
      .name('Curvature-Aware Relax')
      .onChange((value) => {
        if (this.uniforms.u_curvatureAwareRelaxation) {
          this.uniforms.u_curvatureAwareRelaxation.value = value;
        }
      });

    // Curvature sample rate removed from UI and shader (new logic does not use it)

    curvatureFolder
      .add(this.params, 'curvatureNearOnly')
      .name('Curv Near-Surface Only')
      .onChange((value) => {
        if (this.uniforms.u_curvatureNearOnly) {
          this.uniforms.u_curvatureNearOnly.value = value;
        }
      });

    curvatureFolder
      .add(this.params, 'curvatureNearK', 8, 64, 1)
      .name('Curv Near K')
      .onChange((value) => {
        if (this.uniforms.u_curvatureNearK) {
          this.uniforms.u_curvatureNearK.value = value;
        }
      });

    // Reset for Curvature (bottom of subfolder)
    curvatureFolder
      .add(
        {
          reset: () =>
            resetSection(['curvatureAwareRelaxation', 'curvatureNearOnly', 'curvatureNearK']),
        },
        'reset'
      )
      .name('↺ Reset Curvature');

    // Initialize dithering strength row visibility
    if (this.ditheringStrengthController && !this.params.enableDithering) {
      const row = this.ditheringStrengthController.domElement.closest('li, .controller');
      if (row) row.style.display = 'none';
    }

    // Add temporal jitter toggle
    const c_blueJitt = ditheringFolder
      .add(this.params, 'blueNoiseTemporalJitter')
      .name('Blue-Noise Jitter (Temporal)')
      .onChange((value) => {
        if (this.uniforms.u_blueNoiseTemporalJitter) {
          this.uniforms.u_blueNoiseTemporalJitter.value = value;
        }
      });
    this.addInfo(c_blueJitt, 'blueNoiseTemporalJitter');

    // Hide blue-noise configuration when Blue-Noise Mode is not selected
    this._setBlueOptionsVisibility = (on) => {
      try {
        const rowScale =
          c_blueScale &&
          c_blueScale.domElement &&
          c_blueScale.domElement.closest('li, .controller');
        const rowJitt =
          c_blueJitt && c_blueJitt.domElement && c_blueJitt.domElement.closest('li, .controller');
        if (rowScale) rowScale.style.display = on ? '' : 'none';
        if (rowJitt) rowJitt.style.display = on ? '' : 'none';
      } catch (_) {}
    };
    this._setBlueOptionsVisibility(!!this.params.enableDithering && !!this.params.useBlueNoise);

    // Reset for Dithering (bottom of subfolder)
    ditheringFolder
      .add(
        {
          reset: () =>
            resetSection([
              'enableDithering',
              'ditheringStrength',
              'useBlueNoise',
              'blueNoiseScale',
              'blueNoiseTemporalJitter',
              'ditherFog',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Dithering');

    const c_cull = lodFolder
      .add(this.params, 'enableBoundsCulling')
      .name('Bounds Culling')
      .onChange((value) => {
        if (this.uniforms.u_enableBoundsCulling) {
          this.uniforms.u_enableBoundsCulling.value = value;
        }
      });
    this.addInfo(c_cull, 'enableBoundsCulling');
    const c_cullMode = lodFolder
      .add(this.params, 'cullingMode', {
        'Plane Only': 0,
        'Union (Legacy)': 1,
      })
      .name('Culling Mode')
      .onChange((value) => {
        if (this.uniforms.u_cullMode) this.uniforms.u_cullMode.value = value;
      });
    this.addInfo(c_cullMode, 'cullingMode');
    lodFolder
      .add(this.params, 'boundsCullMargin', 0.5, 4.0, 0.1)
      .name('Bounds Margin')
      .onChange((value) => {
        if (this.uniforms.u_boundsCullMargin) {
          this.uniforms.u_boundsCullMargin.value = value;
        }
      });

    // Frustum-aware budget drop (CPU-side)
    const c_drop = lodFolder
      .add(this.params, 'frustumBudgetDropEnabled')
      .name('Frustum Budget Drop');
    this.addInfo(c_drop, 'frustumBudgetDropEnabled');
    const c_dropF = lodFolder
      .add(this.params, 'frustumBudgetDropFactor', 0.3, 0.9, 0.05)
      .name('Drop Factor (Steps)');
    this.addInfo(c_dropF, 'frustumBudgetDropFactor');
    const c_dropAO = lodFolder.add(this.params, 'frustumBudgetAOMin', 0, 5, 1).name('AOMin (Drop)');
    this.addInfo(c_dropAO, 'frustumBudgetAOMin');
    const c_dropSh = lodFolder
      .add(this.params, 'frustumBudgetShadowMin', 4, 32, 1)
      .name('ShadowMin (Drop)');
    this.addInfo(c_dropSh, 'frustumBudgetShadowMin');
    const c_dropH = lodFolder
      .add(this.params, 'frustumDropHysteresisFrames', 4, 60, 1)
      .name('Drop Hysteresis (frames)');
    this.addInfo(c_dropH, 'frustumDropHysteresisFrames');

    const c_distLOD = lodFolder
      .add(this.params, 'enableDistanceLOD')
      .name('Distance LOD')
      .onChange((value) => {
        if (this.uniforms.u_enableDistanceLOD) {
          this.uniforms.u_enableDistanceLOD.value = value;
        }
      });
    this.addInfo(c_distLOD, 'enableDistanceLOD');

    const c_budget = budgetFolder
      .add(this.params, 'enableBudgetLOD')
      .name('Budget LOD (steps/AO/shadows)')
      .onChange((value) => {
        if (this.uniforms.u_enableBudgetLOD) {
          this.uniforms.u_enableBudgetLOD.value = value;
        }
        this.updateBudgetEstimate();
      });
    this.addInfo(c_budget, 'enableBudgetLOD');

    const c_lodNear = lodFolder
      .add(this.params, 'lodNear', 5.0, 20.0, 0.5)
      .name('LOD Near Distance')
      .onChange((value) => {
        if (this.uniforms.u_lodNear) {
          this.uniforms.u_lodNear.value = value;
        }
      });
    this.addInfo(c_lodNear, 'lodNear');

    const c_lodFar = lodFolder
      .add(this.params, 'lodFar', 20.0, 100.0, 1.0)
      .name('LOD Far Distance')
      .onChange((value) => {
        if (this.uniforms.u_lodFar) {
          this.uniforms.u_lodFar.value = value;
        }
        this.updateBudgetEstimate();
      });
    this.addInfo(c_lodFar, 'lodFar');

    // Reset for LOD/Bounds (bottom of subfolder)
    lodFolder
      .add(
        {
          reset: () =>
            resetSection([
              'enableBoundsCulling',
              'boundsCullMargin',
              'frustumBudgetDropEnabled',
              'frustumBudgetDropFactor',
              'frustumBudgetAOMin',
              'frustumBudgetShadowMin',
              'frustumDropHysteresisFrames',
              'enableDistanceLOD',
              'lodNear',
              'lodFar',
            ]),
        },
        'reset'
      )
      .name('↺ Reset LOD/Bounds');

    const c_budgetSteps = budgetFolder
      .add(this.params, 'budgetStepsFarFactor', 0.3, 1.0, 0.01)
      .name('Step Cap Far Factor')
      .onChange((value) => {
        if (this.uniforms.u_budgetStepsFarFactor) {
          this.uniforms.u_budgetStepsFarFactor.value = value;
        }
        this.params.budgetPreset = 'Custom';
        if (this.budgetPresetController) this.budgetPresetController.updateDisplay();
        this.updateBudgetEstimate();
      });
    this.addInfo(c_budgetSteps, 'budgetStepsFarFactor');

    const c_shadowSkip = budgetFolder
      .add(this.params, 'farShadowSkipFactor', 1.0, 3.0, 0.1)
      .name('Shadow Far Skip Factor')
      .onChange((value) => {
        if (this.uniforms.u_farShadowSkipFactor) {
          this.uniforms.u_farShadowSkipFactor.value = value;
        }
        this.params.budgetPreset = 'Custom';
        if (this.budgetPresetController) this.budgetPresetController.updateDisplay();
        this.updateBudgetEstimate();
      });
    this.addInfo(c_shadowSkip, 'farShadowSkipFactor');

    const c_aoMin = budgetFolder
      .add(this.params, 'aoMinSamples', 1, 5, 1)
      .name('AO Min Samples')
      .onChange((value) => {
        if (this.uniforms.u_aoMinSamples) {
          this.uniforms.u_aoMinSamples.value = value;
        }
        this.params.budgetPreset = 'Custom';
        if (this.budgetPresetController) this.budgetPresetController.updateDisplay();
        this.updateBudgetEstimate();
      });
    this.addInfo(c_aoMin, 'aoMinSamples');

    const c_shMin = budgetFolder
      .add(this.params, 'softShadowMinSteps', 4, 32, 1)
      .name('Shadow Min Steps')
      .onChange((value) => {
        if (this.uniforms.u_softShadowMinSteps) {
          this.uniforms.u_softShadowMinSteps.value = value;
        }
        this.params.budgetPreset = 'Custom';
        if (this.budgetPresetController) this.budgetPresetController.updateDisplay();
        this.updateBudgetEstimate();
      });
    this.addInfo(c_shMin, 'softShadowMinSteps');

    // Read-only estimate label
    budgetFolder.add(this.params, 'budgetEstimate').name('Estimate').listen();

    // Reset for Budget LOD
    budgetFolder
      .add(
        {
          reset: () => {
            resetSection([
              'enableBudgetLOD',
              'budgetStepsFarFactor',
              'farShadowSkipFactor',
              'aoMinSamples',
              'softShadowMinSteps',
            ]);
            this.params.budgetPreset = 'Quality';
            if (this.budgetPresetController) this.budgetPresetController.updateDisplay();
            this.updateBudgetEstimate();
            this.schedulePersist();
          },
        },
        'reset'
      )
      .name('↺ Reset Budget LOD');

    // Step Safety (global)
    const c_stepSafety = safetyFolder
      .add(this.params, 'stepSafety', 0.7, 1.0, 0.01)
      .name('Step Safety Scale')
      .onChange((value) => {
        if (this.uniforms.u_stepSafety) {
          this.uniforms.u_stepSafety.value = value;
        }
      });
    this.addInfo(c_stepSafety, 'stepSafety');

    const c_safetyAuto = safetyFolder
      .add(this.params, 'stepSafetyAuto')
      .name('Step Safety Auto')
      .onChange((value) => {
        if (this.uniforms.u_stepSafetyAuto) {
          this.uniforms.u_stepSafetyAuto.value = value;
        }
      });
    this.addInfo(c_safetyAuto, 'stepSafetyAuto');

    // Auto safety bounds and band
    const c_safetyMin = safetyFolder
      .add(this.params, 'stepSafetyMin', 0.7, 0.95, 0.01)
      .name('Safety Min (Auto)')
      .onChange((value) => {
        if (this.uniforms.u_stepSafetyMin) {
          this.uniforms.u_stepSafetyMin.value = value;
        }
      });
    this.addInfo(c_safetyMin, 'stepSafetyMin');

    const c_safetyMax = safetyFolder
      .add(this.params, 'stepSafetyMax', 0.85, 1.0, 0.01)
      .name('Safety Max (Auto)')
      .onChange((value) => {
        if (this.uniforms.u_stepSafetyMax) {
          this.uniforms.u_stepSafetyMax.value = value;
        }
      });
    this.addInfo(c_safetyMax, 'stepSafetyMax');

    const c_safetyNear = safetyFolder
      .add(this.params, 'stepSafetyBandNear', 0.5, 6.0, 0.1)
      .name('Safety Band Near')
      .onChange((value) => {
        if (this.uniforms.u_stepSafetyBandNear) {
          this.uniforms.u_stepSafetyBandNear.value = value;
        }
      });
    this.addInfo(c_safetyNear, 'stepSafetyBandNear');

    const c_safetyFar = safetyFolder
      .add(this.params, 'stepSafetyBandFar', 1.0, 10.0, 0.1)
      .name('Safety Band Far')
      .onChange((value) => {
        if (this.uniforms.u_stepSafetyBandFar) {
          this.uniforms.u_stepSafetyBandFar.value = value;
        }
      });
    this.addInfo(c_safetyFar, 'stepSafetyBandFar');

    const c_consHits = safetyFolder
      .add(this.params, 'conservativeHits')
      .name('Conservative Hits')
      .onChange((value) => {
        if (this.uniforms.u_conservativeHits) this.uniforms.u_conservativeHits.value = value;
      });
    this.addInfo(c_consHits, 'conservativeHits');

    const c_ringClamp = safetyFolder
      .add(this.params, 'ringSafeClamp')
      .name('Ring-Safe Clamp (Menger)');
    this.addInfo(c_ringClamp, 'ringSafeClamp');

    const c_ringClampMax = safetyFolder
      .add(this.params, 'ringSafeClampMax', 0.8, 0.98, 0.01)
      .name('Ring-Safe Max Safety')
      .onChange((value) => {
        // If active on Menger with curvature, apply immediately
        const type = this.params.fractalType | 0;
        if (this.params.ringSafeClamp && type === 1 && this.params.curvatureAwareRelaxation) {
          const maxSafe = Math.min(0.98, Math.max(0.7, value));
          if (this.params.stepSafety > maxSafe) {
            this.params.stepSafety = maxSafe;
            if (this.uniforms.u_stepSafety) this.uniforms.u_stepSafety.value = maxSafe;
            if (this.gui && this.gui.controllersRecursive)
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          }
        }
      });
    this.addInfo(c_ringClampMax, 'ringSafeClampMax');

    // Reset for Safeties
    safetyFolder
      .add(
        {
          reset: () =>
            resetSection([
              'stepSafety',
              'stepSafetyAuto',
              'stepSafetyMin',
              'stepSafetyMax',
              'stepSafetyBandNear',
              'stepSafetyBandFar',
              'conservativeHits',
              'ringSafeClamp',
              'ringSafeClampMax',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Safeties');

    advancedFolder
      .add(
        {
          reset: () =>
            resetSection([
              'useSegmentTracing',
              'segmentFraction',
              'integratorAuto',
              'integratorSwitchDist',
              'useAnalyticNormals',
              'budgetPreset',
              'adaptiveRelaxation',
              'relaxationMin',
              'relaxationMax',
              'enableDithering',
              'ditheringStrength',
              'curvatureAwareRelaxation',
              'curvatureNearOnly',
              'curvatureNearK',
              'enableDistanceLOD',
              'enableBudgetLOD',
              'lodNear',
              'lodFar',
              'budgetStepsFarFactor',
              'farShadowSkipFactor',
              'aoMinSamples',
              'softShadowMinSteps',
              'stepSafety',
              'stepSafetyAuto',
              'stepSafetyMin',
              'stepSafetyMax',
              'stepSafetyBandNear',
              'stepSafetyBandFar',
            ]),
        },
        'reset'
      )
      .name('↺ Reset Advanced');

    advancedFolder.open(); // Start expanded to show new optimizations
    // Track folders for persistence
    this._folders = {
      Fractal: fractalFolder,
      'DEC Preview': decFolder,
      World: worldFolder,
      WorldTexture: texFolder,
      Debug: debugFolder,
      Animation: animationFolder,
      Camera: cameraFolder,
      Morph: morphFolder,
      Lighting: lightingFolder,
      Color: colorFolder,
      Environment: envFolder,
      Performance: perfFolder,
      Advanced: advancedFolder,
      Integrator: integratorFolder,
      Relaxation: relaxFolder,
      Curvature: curvatureFolder,
      Dithering: ditheringFolder,
      LOD: lodFolder,
      BudgetLOD: budgetFolder,
      Safeties: safetyFolder,
      AutoResTuning: autoResFolder,
      Post: postFolder,
      Bloom: bloomFolder,
      LUT: lutFolder,
    };

    // Initial estimate
    this.updateBudgetEstimate();

    const c_showStats = perfFolder
      .add(this.params, 'showStats')
      .name('Show Stats')
      .onChange((value) => {
        if (this.callbacks.onStatsToggle) {
          this.callbacks.onStatsToggle(value);
        }
      });
    this.addInfo(c_showStats, 'showStats');

    const c_showDbg = perfFolder
      .add(this.params, 'showDebugOverlay')
      .name('Show Debug Overlay')
      .onChange((value) => {
        if (this.callbacks.onDebugOverlayToggle) {
          this.callbacks.onDebugOverlayToggle(value);
        }
      });
    this.addInfo(c_showDbg, 'showDebugOverlay');

    // Profiling helpers — buttons that call the built-in runProfile/getOverlayText
    const profilingFolder = perfFolder.addFolder('Profiling');
    profilingFolder.close();
    const runBtn = {
      run: async () => {
        try {
          const rp = window.runProfile;
          if (typeof rp !== 'function') {
            console.warn('runProfile helper not available');
            return;
          }
          await rp('profile_current', 15);
          try {
            if (typeof window.getOverlayText === 'function') window.getOverlayText();
          } catch (_) {}
        } catch (e) {
          console.warn('Profile failed:', e);
        }
      },
    };
    profilingFolder.add(runBtn, 'run').name('Run 15s (current)');

    const runBatchBtn = {
      run: async () => {
        try {
          if (typeof window.runProfileBatch !== 'function') {
            console.warn('runProfileBatch helper not available');
            return;
          }
          await window.runProfileBatch('profile_batch', 15, 3);
        } catch (e) {
          console.warn('Batch profile failed:', e);
        }
      },
    };
    profilingFolder.add(runBatchBtn, 'run').name('Run 3×15s (batch)');

    const copyBtn = {
      copy: async () => {
        try {
          if (typeof window.copyLastProfile !== 'function') {
            console.warn('copyLastProfile helper not available');
            return;
          }
          const ok = await window.copyLastProfile();
          if (!ok) console.warn('No profile copied');
        } catch (e) {
          console.warn('Copy failed:', e);
        }
      },
    };
    profilingFolder.add(copyBtn, 'copy').name('Copy Last Result');

    // Copy environment info (screen/canvas/UA/GPU)
    const copyEnv = {
      copy: async () => {
        try {
          if (typeof window.copyEnvInfo !== 'function') {
            console.warn('copyEnvInfo helper not available');
            return;
          }
          await window.copyEnvInfo();
        } catch (e) {
          console.warn('Env copy failed:', e);
        }
      },
    };
    profilingFolder.add(copyEnv, 'copy').name('Copy Env Info');

    // Quick-apply the benchmarking preset
    const applyTest = {
      apply: () => {
        try {
          this.applyPreset('Test Settings');
          // Ensure key uniforms reflect preset immediately (belt-and-suspenders)
          try {
            if (
              this.uniforms.u_softShadowSteps &&
              typeof this.params.softShadowSteps === 'number'
            ) {
              this.uniforms.u_softShadowSteps.value = this.params.softShadowSteps;
            }
            if (this.uniforms.u_enableBoundsCulling)
              this.uniforms.u_enableBoundsCulling.value = !!this.params.enableBoundsCulling;
            if (
              this.uniforms.u_truchetPortalFast !== undefined &&
              this.uniforms.u_truchetPortalFast
            )
              this.uniforms.u_truchetPortalFast.value = !!this.params.truchetPortalFast;
            if (this.uniforms.u_budgetStepsFarFactor)
              this.uniforms.u_budgetStepsFarFactor.value = this.params.budgetStepsFarFactor;
            if (this.uniforms.u_farShadowSkipFactor)
              this.uniforms.u_farShadowSkipFactor.value = this.params.farShadowSkipFactor;
            if (this.uniforms.u_aoMinSamples)
              this.uniforms.u_aoMinSamples.value = this.params.aoMinSamples;
            if (this.uniforms.u_softShadowMinSteps)
              this.uniforms.u_softShadowMinSteps.value = this.params.softShadowMinSteps;
          } catch (_) {}
          if (this.gui && this.gui.controllersRecursive)
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          this.schedulePersist();
          try {
            console.log('✅ Applied preset: Test Settings');
          } catch (_) {}
        } catch (e) {
          console.warn('Failed to apply Test Settings preset:', e);
        }
      },
    };
    profilingFolder.add(applyTest, 'apply').name('Apply Test Settings');

    // Quick-apply tuned interior preset
    const applyInterior = {
      apply: () => {
        try {
          this.applyPreset('Truchet Interior (Perf)');
          if (this.gui && this.gui.controllersRecursive)
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          this.schedulePersist();
          try {
            console.log('✅ Applied preset: Truchet Interior (Perf)');
          } catch (_) {}
        } catch (e) {
          console.warn('Failed to apply Truchet Interior (Perf) preset:', e);
        }
      },
    };
    profilingFolder.add(applyInterior, 'apply').name('Apply Interior Perf');

    // Apply Catacombs Baseline (textures ON) for perf baselines
    const applyCatacombs = {
      apply: () => {
        try {
          this.applyPreset('Pipe Catacombs (Baseline Tex)');
          if (this.gui && this.gui.controllersRecursive)
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          this.schedulePersist();
          try {
            console.log('✅ Applied preset: Pipe Catacombs (Baseline Tex)');
          } catch (_) {}
        } catch (e) {
          console.warn('Failed to apply Pipe Catacombs (Baseline Tex) preset:', e);
        }
      },
    };
    profilingFolder.add(applyCatacombs, 'apply').name('Apply Catacombs Baseline');

    // Texture tuning (fast staged sweep)
    const tuneFast = {
      run: async () => {
        try {
          if (typeof window.tuneTexture !== 'function') {
            console.warn('tuneTexture helper not available');
            return;
          }
          await window.tuneTexture('fast');
        } catch (e) {
          console.warn('Texture tune failed:', e);
        }
      },
    };
    profilingFolder.add(tuneFast, 'run').name('Tune Texture (fast)');

    // Quick-apply tuned exterior preset
    const applyExterior = {
      apply: () => {
        try {
          this.applyPreset('Truchet Exterior (Fast)');
          if (this.gui && this.gui.controllersRecursive)
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          this.schedulePersist();
          try {
            console.log('✅ Applied preset: Truchet Exterior (Fast)');
          } catch (_) {}
        } catch (e) {
          console.warn('Failed to apply Truchet Exterior (Fast) preset:', e);
        }
      },
    };
    profilingFolder.add(applyExterior, 'apply').name('Apply Exterior (Fast)');

    // Force near shadow steps to 16 (helps if a stale uniform overrides preset)
    const forceSh16 = {
      apply: () => {
        try {
          this.params.softShadowSteps = 16;
          if (this.uniforms.u_softShadowSteps) this.uniforms.u_softShadowSteps.value = 16;
          if (this.gui && this.gui.controllersRecursive)
            this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
          this.schedulePersist();
          try {
            console.log('✅ Forced Shadow Quality (near) to 16');
          } catch (_) {}
        } catch (e) {
          console.warn('Failed to set near shadow steps:', e);
        }
      },
    };
    profilingFolder.add(forceSh16, 'apply').name('Force Shadow Near = 16');

    // Register profiling folder for open/close persistence
    try {
      this._folders = this._folders || {};
      this._folders.Profiling = profilingFolder;
      if (this.refreshFolderPersistenceStates) this.refreshFolderPersistenceStates();
    } catch (_) {}

    // Removed Saved Quality management buttons for cleaner UI

    // Screenshot Export
    this.gui
      .add(
        {
          screenshot: () => {
            if (this.callbacks.captureScreenshot) {
              this.callbacks.captureScreenshot();
            }
          },
        },
        'screenshot'
      )
      .name('📸 Take Screenshot');

    // Import a preset JSON (minimal overrides or full param map)
    this.gui
      .add(
        {
          importPreset: () => this.importPresetJSON(),
        },
        'importPreset'
      )
      .name('⬆️ Import Preset (JSON)');

    // Export current configuration as minimal JSON overrides
    this.gui
      .add(
        {
          exportPreset: () => this.exportPresetJSON(),
        },
        'exportPreset'
      )
      .name('⬇️ Export Preset (JSON)');

    // Bottom-level Reset All button
    this.gui
      .add(
        {
          resetAll: () => this.resetAllSettings(),
        },
        'resetAll'
      )
      .name('⟲ Reset All Settings');
  }

  // Reset every configurable setting back to DEFAULTS and clear overrides/prefs.
  resetAllSettings() {
    // Defaults for every key we own
    Object.keys(DEFAULTS).forEach((k) => {
      this.params[k] = DEFAULTS[k];
    });

    // GUI-only/aux params
    this.params.preset = 'None';
    this.params.budgetPreset = 'Quality';
    this.params.quality = this.callbacks?.initialQuality || 'High';
    this.params.softShadowSteps = DEFAULTS.softShadowMinSteps;
    this.params.shadowSharpness = DEFAULTS.shadowSharpness;

    // Persist legacy flags and fractal type for consistency
    try {
      // Clear per-key legacy prefs so reload uses true defaults
      localStorage.removeItem('fractalExplorer_aoEnabled');
      localStorage.removeItem('fractalExplorer_softShadowsEnabled');
      localStorage.removeItem('fractalExplorer_fractalType');
      localStorage.removeItem('fractalExplorer_visualPreset');
      localStorage.removeItem('fractalExplorer_quality');
      localStorage.removeItem('fractalExplorer_cameraPosition');
      // Clear GUI folder open/close persistence to raw defaults
      localStorage.removeItem('fractalExplorer_guiFolders_v1');
      // Clear first-visit help overlay flag
      localStorage.removeItem('fractalExplorer_hasVisited');
    } catch (_) {}

    // Reset camera to default baseline (position/lookAt/FOV)
    try {
      if (this.callbacks && this.callbacks.resetCamera) this.callbacks.resetCamera();
      if (this.camera) {
        // Restore default FOV
        const fov = typeof DEFAULTS.fov === 'number' ? DEFAULTS.fov : this.camera.fov;
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
        this.params.fov = fov;
        if (this.uniforms && this.uniforms.u_fov) this.uniforms.u_fov.value = fov;
      }
    } catch (_) {}

    // Apply quality preset so label and budgets match
    this.applyQualityPreset(this.params.quality);

    // Reset DEC Preview panel explicitly
    try {
      this.params.decPreviewEnabled = false;
      if (this.callbacks && this.callbacks.onDecPreviewToggle)
        this.callbacks.onDecPreviewToggle(false);
      // Reset selection to first entry if available
      const decOpts = this.gui.__folders && this.gui.__folders['DEC Preview'];
      if (decOpts) {
        const entryController = Object.values(decOpts.__controllers || {}).find(
          (ctrl) => (ctrl._name || ctrl.property) === 'Entry'
        );
        const first =
          entryController &&
          entryController.__select &&
          entryController.__select.options &&
          entryController.__select.options[0];
        if (first && first.value) {
          this.params.decEntry = first.value;
          if (this.callbacks && this.callbacks.onDecPreviewSelect)
            this.callbacks.onDecPreviewSelect(this.params.decEntry);
        }
      }
      // Reset placement helpers (assist sphere removed)
      this.params.decOffsetX = 0.0;
      this.params.decOffsetY = 0.0;
      this.params.decOffsetZ = 0.0;
      if (this.uniforms && this.uniforms.u_decOffset) this.uniforms.u_decOffset.value.set(0, 0, 0);
    } catch (_) {}

    // Push to uniforms and GUI
    this.syncAllUniforms();
    if (this.gui && this.gui.controllersRecursive) {
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
    }
    // Ensure shader branch matches current type after reset
    if (this.callbacks && this.callbacks.requestShaderRefresh) {
      this.callbacks.requestShaderRefresh();
    }
    // Mirror fly mode state to runtime after reset
    if (this.callbacks && this.callbacks.onFlyModeToggle) {
      try {
        this.callbacks.onFlyModeToggle(!!this.params.flyMode);
      } catch (_) {}
    }
    this.updateBudgetEstimate();
    if (this.budgetPresetController) this.budgetPresetController.updateDisplay();

    // Clear overrides storage completely (no diffs persisted on reset)
    try {
      saveOverridesToStorage({});
    } catch (_) {}
  }

  // Build minimal overrides vs DEFAULTS and trigger a JSON download
  exportPresetJSON() {
    try {
      const overrides = buildOverrides(this.params, DEFAULTS);
      // Camera snapshot (position + forward direction)
      let camera = null;
      try {
        if (this.camera) {
          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          camera = {
            position: {
              x: this.camera.position.x,
              y: this.camera.position.y,
              z: this.camera.position.z,
            },
            direction: { x: dir.x, y: dir.y, z: dir.z },
            fov: typeof this.camera.fov === 'number' ? this.camera.fov : undefined,
            flyMode: !!this.params.flyMode,
          };
        }
      } catch (_) {}
      const payload = {
        name: 'Custom Preset',
        createdAt: new Date().toISOString(),
        overrides,
        camera,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `fractal-preset-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to export preset JSON:', e);
    }
  }

  // Load a preset JSON file and apply its overrides
  importPresetJSON() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.style.display = 'none';
      input.addEventListener(
        'change',
        async () => {
          const file = input.files && input.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            let overrides = null;

            if (data && typeof data === 'object') {
              if (data.overrides && typeof data.overrides === 'object') {
                overrides = data.overrides;
              } else {
                // Allow raw map form as well
                overrides = data;
              }
            }

            if (!overrides || typeof overrides !== 'object') {
              console.warn('Import failed: no overrides object in JSON');
              return;
            }

            // Apply to params, tolerating unknown or legacy keys
            applyOverrides(this.params, overrides, DEFAULTS);

            // Persist fractal type explicitly if provided
            try {
              if (typeof this.params.fractalType === 'number') {
                localStorage.setItem(
                  'fractalExplorer_fractalType',
                  String(this.params.fractalType)
                );
              }
            } catch (_) {}

            // Apply camera pose if provided (position + forward direction + FOV + fly mode)
            try {
              const cam = data && data.camera;
              if (cam && this.camera && cam.position && typeof cam.position.x === 'number') {
                const p = cam.position;
                this.camera.position.set(p.x, p.y, p.z);
                if (cam.direction && typeof cam.direction.x === 'number') {
                  const d = cam.direction;
                  const target = new THREE.Vector3(p.x + d.x, p.y + d.y, p.z + d.z);
                  this.camera.lookAt(target);
                }
                if (typeof cam.fov === 'number') {
                  this.camera.fov = cam.fov;
                  this.params.fov = cam.fov;
                  if (this.uniforms.u_fov) this.uniforms.u_fov.value = cam.fov;
                  this.camera.updateProjectionMatrix();
                }
                if (typeof cam.flyMode === 'boolean') {
                  this.params.flyMode = !!cam.flyMode;
                  if (this.callbacks && this.callbacks.onFlyModeToggle)
                    this.callbacks.onFlyModeToggle(!!cam.flyMode);
                }
                this.camera.updateMatrixWorld();
              }
            } catch (_) {}

            // Push to uniforms/GUI and save minimal overrides
            this.syncAllUniforms();
            if (this.gui && this.gui.controllersRecursive) {
              this.gui.controllersRecursive().forEach((c) => c.updateDisplay && c.updateDisplay());
            }
            this.updateBudgetEstimate();
            this.schedulePersist();
            console.log('✅ Imported preset overrides from', file.name);
          } catch (e) {
            console.warn('Failed to import preset JSON:', e);
          } finally {
            // Cleanup
            input.value = '';
            if (input.parentElement) input.parentElement.removeChild(input);
          }
        },
        { once: true }
      );
      document.body.appendChild(input);
      input.click();
    } catch (e) {
      console.warn('Import preset failed to initialize:', e);
    }
  }

  applyQualityPreset(quality) {
    const presets = {
      Low: {
        maxSteps: 64,
        iterations: 4,
      },
      Medium: {
        maxSteps: 96,
        iterations: 6,
      },
      High: {
        maxSteps: 128,
        iterations: 8,
      },
      Ultra: {
        maxSteps: 200,
        iterations: 12,
      },
    };

    const preset = presets[quality];
    if (preset) {
      this.params.maxSteps = preset.maxSteps;
      this.params.iterations = preset.iterations;

      if (this.uniforms.u_maxSteps) {
        this.uniforms.u_maxSteps.value = preset.maxSteps;
      }
      this.uniforms.u_iterations.value = preset.iterations;

      // Save quality preference if user manually changed it
      if (this.isInitialized && this.callbacks.onQualityChange) {
        this.callbacks.onQualityChange(quality, preset.maxSteps, preset.iterations);
      }

      // Update the specific controllers that changed
      if (this.maxStepsController) {
        this.maxStepsController.updateDisplay();
      }
      if (this.iterationsController) {
        this.iterationsController.updateDisplay();
      }
      this.updateBudgetEstimate();
      this.schedulePersist();
    }
  }

  applyBudgetPreset(preset) {
    const presets = {
      Balanced: {
        enableBudgetLOD: true,
        budgetStepsFarFactor: 0.6,
        farShadowSkipFactor: 1.5,
        aoMinSamples: 2,
        softShadowMinSteps: 8,
      },
      Aggressive: {
        enableBudgetLOD: true,
        budgetStepsFarFactor: 0.45,
        farShadowSkipFactor: 1.2,
        aoMinSamples: 1,
        softShadowMinSteps: 6,
      },
      Quality: {
        enableBudgetLOD: true,
        budgetStepsFarFactor: 0.8,
        farShadowSkipFactor: 2.5,
        aoMinSamples: 3,
        softShadowMinSteps: 16,
      },
    };

    const p = presets[preset];
    if (!p) return;
    Object.assign(this.params, p, { budgetPreset: preset });

    // Push to uniforms
    if (this.uniforms.u_enableBudgetLOD)
      this.uniforms.u_enableBudgetLOD.value = this.params.enableBudgetLOD;
    if (this.uniforms.u_budgetStepsFarFactor)
      this.uniforms.u_budgetStepsFarFactor.value = this.params.budgetStepsFarFactor;
    if (this.uniforms.u_farShadowSkipFactor)
      this.uniforms.u_farShadowSkipFactor.value = this.params.farShadowSkipFactor;
    if (this.uniforms.u_aoMinSamples) this.uniforms.u_aoMinSamples.value = this.params.aoMinSamples;
    if (this.uniforms.u_softShadowMinSteps)
      this.uniforms.u_softShadowMinSteps.value = this.params.softShadowMinSteps;

    // Refresh controllers
    if (this.budgetPresetController) this.budgetPresetController.updateDisplay();
    this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
    this.updateBudgetEstimate();
    this.schedulePersist();
  }

  updateBudgetEstimate() {
    if (!this.params.enableBudgetLOD) {
      this.params.budgetEstimate = 'Disabled';
      return;
    }
    const nearSteps = this.params.maxSteps;
    const farSteps = Math.max(
      16,
      Math.floor(this.params.maxSteps * this.params.budgetStepsFarFactor)
    );
    const aoNear = 5;
    const aoFar = this.params.aoMinSamples;
    const shNear = this.params.softShadowSteps;
    const shFar = this.params.softShadowMinSteps;
    const skipAt = Math.round(this.params.lodFar * this.params.farShadowSkipFactor);
    this.params.budgetEstimate = `Steps ${nearSteps}\u2192${farSteps} • AO ${aoNear}\u2192${aoFar} • Shadow ${shNear}\u2192${shFar} • Skip>${skipAt}`;
  }

  update() {
    // Sync params with uniforms if needed
    this.params.fractalType = this.uniforms.u_fractalType.value;
    this.params.iterations = this.uniforms.u_iterations.value;
  }

  syncAllParams() {
    // Sync all GUI params with current uniform values
    this.params.maxSteps = this.uniforms.u_maxSteps
      ? this.uniforms.u_maxSteps.value
      : this.params.maxSteps;
    this.params.iterations = this.uniforms.u_iterations.value;

    // Update GUI display
    this.gui.controllers.forEach((controller) => {
      controller.updateDisplay();
    });

    // Mark as initialized so onChange handlers know this isn't initial setup
    this.isInitialized = true;
  }

  destroy() {
    this.gui.destroy();
  }
}
