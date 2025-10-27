import * as THREE from 'three';
import { DEFAULTS } from '../config/defaults.js';
import vertexShader from '../shaders/fractal.vert.glsl';
import screenVertex from '../shaders/screen.vert.glsl';
import fragmentSource from '../shaders/fractal.frag.glsl';
import postFragment from '../shaders/post.frag.glsl';
// Manual include resolution for GLSL chunks used by the fragment shader
import commonGLSL from '../shaders/includes/common.glsl';
import sdfPrimitivesGLSL from '../shaders/includes/sdf-primitives.glsl';
import sdfOperationsGLSL from '../shaders/includes/sdf-operations.glsl';
import sdfMengerGLSL from '../shaders/includes/sdf-menger.glsl';
import sdfMandelbulbGLSL from '../shaders/includes/sdf-mandelbulb.glsl';
import sdfMandelboxGLSL from '../shaders/includes/sdf-mandelbox.glsl';
import sdfSierpinskiGLSL from '../shaders/includes/sdf-sierpinski.glsl';
import sdfAmazingSurfGLSL from '../shaders/includes/sdf-amazing-surf.glsl';
import sdfTruchetPipesGLSL from '../shaders/includes/sdf-truchet-pipes.glsl';
import proceduralTexturesGLSL from '../shaders/includes/procedural-textures.glsl';
import decUtilsGLSL from '../shaders/includes/dec/dec-utils.glsl';
import decStub from '../shaders/includes/dec/__user__.glsl';
import coloringGLSL from '../shaders/includes/coloring.glsl';
import { PaletteManager, MAX_PALETTE_STOPS } from '../core/PaletteManager.js';
// Eagerly import all DEC GLSL modules for preview injection
// Keys are file paths relative to this file (src/app/ShaderManager.js)
const DEC_MODULES = import.meta.glob('../shaders/includes/dec/**/*.glsl', { eager: true });

export class ShaderManager {
  constructor(app, renderer) {
    this.app = app;
    this.renderer = renderer;
    this.uniforms = {};
    this.material = null;
    this.postMaterial = null;
    this.rtScene = null;
    this.quad = null;
    this.baseFragmentShader = null;
    this.decMaterialCache = new Map();
    // DEC preview (kept for API compatibility; minimal/no-op by default)
    this.decPreview = { enabled: false, includePath: null };
  }

  setupShader() {
    // Store original fragment source for DEC rebuilds (before Vite resolves includes)
    // Since Vite already resolved includes in fragmentSource import, we need to
    // manually reconstruct or store the template. For now, store the resolved version
    // and use string replacement for DEC section updates.
    this.originalFragmentSource = fragmentSource;

    // 1) Build uniforms
    this.uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_cameraPos: { value: new THREE.Vector3() },
      u_cameraTarget: { value: new THREE.Vector3() },
      u_fov: { value: DEFAULTS.fov },
      u_camRight: { value: new THREE.Vector3(1, 0, 0) },
      u_camUp: { value: new THREE.Vector3(0, 1, 0) },

      // Fractal
      u_fractalType: { value: DEFAULTS.fractalType },
      u_iterations: { value: DEFAULTS.iterations },
      u_fractalPower: { value: DEFAULTS.power },
      u_fractalScale: { value: DEFAULTS.scale },
      u_rotation: { value: new THREE.Vector3(0, 0, 0) },

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

      // Post
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
      u_texApplyTarget: { value: DEFAULTS.textureApplyTarget | 0 },
      u_floorTexMode: { value: DEFAULTS.floorTextureMode | 0 },
      u_floorIgnoreWarp: { value: !!DEFAULTS.floorIgnoreWarp },
      u_floorBumpScale: { value: DEFAULTS.floorBumpScale },
      u_floorSpecScale: { value: DEFAULTS.floorSpecScale },
      u_floorTexDisableDist: { value: DEFAULTS.floorTexDisableDist },
      u_floorTexAutoDisable: { value: !!DEFAULTS.floorTexAutoDisable },
      u_floorTexAutoMul: { value: DEFAULTS.floorTexAutoMul },
      u_floorFadeNear: { value: DEFAULTS.floorFadeNear },
      u_floorFadeFar: { value: DEFAULTS.floorFadeFar },

      // Performance
      u_maxSteps: { value: DEFAULTS.maxSteps },
      u_stepRelaxation: { value: DEFAULTS.stepRelaxation },
      u_aoEnabled: { value: DEFAULTS.aoEnabled ?? true },
      u_softShadowsEnabled: { value: DEFAULTS.softShadowsEnabled ?? true },
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

      // Normals / debug
      u_normalEpsilon: { value: DEFAULTS.normalEpsilon },
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

      // Advanced marching / LOD
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
      u_curvatureAwareRelaxation: { value: DEFAULTS.curvatureAwareRelaxation },
      u_curvatureNearOnly: { value: DEFAULTS.curvatureNearOnly },
      u_curvatureNearK: { value: DEFAULTS.curvatureNearK },
      u_enableBoundsCulling: { value: DEFAULTS.enableBoundsCulling },
      u_boundsCullMargin: { value: DEFAULTS.boundsCullMargin },
      u_cullMode: { value: DEFAULTS.cullingMode },
      u_useSegmentTracing: { value: DEFAULTS.useSegmentTracing },
      u_segmentFraction: { value: DEFAULTS.segmentFraction },
      u_useAnalyticNormals: { value: DEFAULTS.useAnalyticNormals },
      u_stepSafety: { value: DEFAULTS.stepSafety },
      u_stepSafetyAuto: { value: DEFAULTS.stepSafetyAuto },
      u_stepSafetyMin: { value: DEFAULTS.stepSafetyMin },
      u_stepSafetyMax: { value: DEFAULTS.stepSafetyMax },
      u_stepSafetyBandNear: { value: DEFAULTS.stepSafetyBandNear },
      u_stepSafetyBandFar: { value: DEFAULTS.stepSafetyBandFar },
      u_conservativeHits: { value: DEFAULTS.conservativeHits },
      u_integratorAuto: { value: DEFAULTS.integratorAuto },
      u_integratorSwitchDist: { value: DEFAULTS.integratorSwitchDist },

      // Color system
      u_colorMode: { value: DEFAULTS.colorMode },
      u_paletteId: { value: DEFAULTS.palette },
      u_colorIntensity: { value: DEFAULTS.colorIntensity },
      u_orbitTrapScale: { value: DEFAULTS.orbitTrapScale },
      u_materialColor: { value: new THREE.Color(0.8, 0.4, 0.2) },
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
      u_texColorBase: { value: new THREE.Color(DEFAULTS.texColorBase || '#bfbfbf') },
      u_texColorAccent: { value: new THREE.Color(DEFAULTS.texColorAccent || '#303030') },
      u_texLayerColoring: { value: DEFAULTS.texLayerColoring === true },
      u_texA_colorBase: { value: new THREE.Color(DEFAULTS.texAColorBase || '#d0cdc6') },
      u_texA_colorAccent: { value: new THREE.Color(DEFAULTS.texAColorAccent || '#2f2c2a') },
      u_texB_colorBase: { value: new THREE.Color(DEFAULTS.texBColorBase || '#e8e4dc') },
      u_texB_colorAccent: { value: new THREE.Color(DEFAULTS.texBColorAccent || '#5a504a') },
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
      u_worldTexTypeB: { value: DEFAULTS.worldTexTypeB },
      u_worldTexScaleB: { value: DEFAULTS.worldTexScaleB },
      u_worldTexColorStrengthB: { value: DEFAULTS.worldTexColorStrengthB },
      u_worldTexBumpStrengthB: { value: DEFAULTS.worldTexBumpStrengthB },
      u_worldTexSpecStrengthB: { value: DEFAULTS.worldTexSpecStrengthB },
      u_worldTexBlendMode: { value: DEFAULTS.worldTexBlendMode },
      u_worldTexBlendAlphaColor: { value: DEFAULTS.worldTexBlendAlphaColor },
      u_worldTexBlendAlphaBump: { value: DEFAULTS.worldTexBlendAlphaBump },
      u_worldTexBlendAlphaSpec: { value: DEFAULTS.worldTexBlendAlphaSpec },
      u_worldFbmOctaves: { value: DEFAULTS.worldFbmOctaves },
      u_worldFbmLacunarity: { value: DEFAULTS.worldFbmLacunarity },
      u_worldFbmGain: { value: DEFAULTS.worldFbmGain },
      u_worldFbmSeed: { value: DEFAULTS.worldFbmSeed },
      u_worldTexAAStrength: { value: DEFAULTS.worldTexAAStrength },
      u_worldTexAutoAtten: { value: DEFAULTS.worldTexAutoAtten },
      u_texSpaceMode: { value: DEFAULTS.texSpaceMode | 0 },
      u_texDerivAggression: { value: DEFAULTS.texDerivAggression ?? 1.0 },
      u_texBumpDerivFade: { value: DEFAULTS.texBumpDerivFade ?? 0.0 },
      u_texSpecDerivFade: { value: DEFAULTS.texSpecDerivFade ?? 0.0 },
      u_texRoughFadeK: { value: DEFAULTS.texRoughFadeK ?? 0.0 },
      u_texFadeNear: { value: DEFAULTS.texFadeNear ?? 0.0 },
      u_texFadeFar: { value: DEFAULTS.texFadeFar ?? 0.0 },
      u_worldTruchetRotate: { value: DEFAULTS.worldTruchetRotate ? 1 : 0 },
      u_worldTruchetWidth: { value: DEFAULTS.worldTruchetWidth },
      u_worldTruchetDensity: { value: DEFAULTS.worldTruchetDensity },
      u_hexFoldFreq: { value: DEFAULTS.hexFoldFreq },
      u_hexContrast: { value: DEFAULTS.hexContrast },
      u_hexSeed: { value: DEFAULTS.hexSeed },
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
      u_texWarpStrength: { value: DEFAULTS.texWarpStrength ?? 0.0 },
      u_texWarpScale: { value: DEFAULTS.texWarpScale ?? 1.0 },
      u_texWarpOctaves: { value: DEFAULTS.texWarpOctaves ?? 3 },
      u_texWarpType: { value: DEFAULTS.texWarpType ?? 1 },
      u_texTop2: { value: DEFAULTS.texTop2 === true },
      u_texFastBump: { value: DEFAULTS.texFastBump === true },
      u_texTriMinWeight: { value: DEFAULTS.texTriMinWeight },
      u_texTriHyst: { value: DEFAULTS.texTriHyst ?? 0.0 },
      u_texAnisoFactor: { value: DEFAULTS.texAnisoFactor ?? 1.0 },
      u_texAnisoAxis: { value: DEFAULTS.texAnisoAxis ?? 1 },
      u_texLODEnabled: { value: DEFAULTS.texLODEnabled === true },
      u_texDerivOctDrop: { value: DEFAULTS.texDerivOctDrop | 0 },
      u_texDerivMinOct: { value: DEFAULTS.texDerivMinOct | 0 },
      u_texWarpOctDrop: { value: DEFAULTS.texWarpOctDrop | 0 },
      u_texLODBumpFactor: { value: DEFAULTS.texLODBumpFactor },
      u_texLODSpecFactor: { value: DEFAULTS.texLODSpecFactor },
    };
    this.uniforms.u_icoUseIQ = {
      value: DEFAULTS.icoUseIQ !== undefined ? !!DEFAULTS.icoUseIQ : true,
    };

    // 2) Resolve GLSL includes into the fragment shader
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
      './includes/dec/__user__.glsl': decStub,
      './includes/dec/dec-utils.glsl': decUtilsGLSL,
    };
    const resolveIncludes = (src) => {
      let out = src;
      const re = /#include\s+"([^"]+)"/g;
      let guard = 0;
      while (guard++ < 12) {
        let changed = false;
        out = out.replace(re, (_, path) => {
          const chunk = this.includeMap[path];
          changed = true;
          return chunk
            ? `\n// BEGIN include ${path}\n${chunk}\n// END include ${path}\n`
            : `\n// (include ${path} omitted)\n`;
        });
        if (!changed) break;
      }
      return out;
    };

    const fragmentShader = resolveIncludes(fragmentSource);
    this.baseFragmentShader = fragmentShader;

    // 3) Palette manager packs custom palette uniforms
    this.paletteManager = new PaletteManager();
    this.paletteManager.packToUniforms(this.uniforms);

    // 4) Create materials and quad
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    this.material.glslVersion = THREE.GLSL3;

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);
    this.quad.frustumCulled = false;
    this.renderer.scene.add(this.quad);

    // Post-processing material shares uniforms
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
      side: THREE.DoubleSide,
    });
    this.postMaterial.glslVersion = THREE.GLSL3;

    // Offscreen RT
    this.rtScene = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // Attempt precompile to surface shader errors early (non-fatal)
    try {
      this.renderer.renderer.compile(this.renderer.scene, this.renderer.camera);
    } catch (e) {
      console.warn('Precompile warning:', e);
    }
  }

  // Material specialization by fractal type using defines
  getSpecializedMaterialForType(typeId) {
    const key = String(typeId);
    if (this.decMaterialCache.has(key)) return this.decMaterialCache.get(key);
    const m = this.material.clone();
    m.defines = { FRAC_TYPE: key };
    // CRITICAL: Use the same uniforms reference, not a clone
    m.uniforms = this.uniforms;
    m.needsUpdate = true;
    this.decMaterialCache.set(key, m);
    return m;
  }

  applyMaterialSpecializationIfNeeded(force = false) {
    if (!this.quad || !this.quad.material) return;
    const current = String(this.uniforms.u_fractalType.value);
    const active =
      this.quad.material.defines &&
      (this.quad.material.defines.FRAC_TYPE || this.quad.material.defines.FRACTAL_TYPE);
    if (!force && active === current) return;
    this.quad.material = this.getSpecializedMaterialForType(current);
    // CRITICAL: Ensure needsUpdate is set when applying material to quad
    // This forces Three.js to recompile the shader program
    this.quad.material.needsUpdate = true;
  }

  clearSpecializationCache() {
    this.decMaterialCache.forEach((m) => m.dispose && m.dispose());
    this.decMaterialCache.clear();
  }

  async prewarmSpecializedMaterials(types = []) {
    for (const t of types) this.getSpecializedMaterialForType(t);
  }

  // DEC mapping hook for GUI (no-op minimal implementation)
  applyDecMappingAndRebuild() {
    // 1) Decide what to inject based on preview state
    let injected = '';
    if (this.decPreview && this.decPreview.enabled) {
      let key = this.resolveDecKey(this.decPreview.includePath);
      if (key && DEC_MODULES[key]) {
        // Older vite-plugin-glsl versions export default; newer may export string
        const mod = DEC_MODULES[key];
        const src = typeof mod === 'string' ? mod : mod.default || '';
        injected = this.buildDecInjectedBlock(src);
      } else {
        // Safe default: a simple rounded box as visible placeholder
        injected = `#define DEC_USER_DEFINED 1\nfloat decUserDE(vec3 p){ return sdRoundBox(p, vec3(0.6), 0.2); }`;
      }
    } else {
      injected = '';
    }

    // 2) Since Vite's vite-plugin-glsl already resolved all #include directives at build time,
    // we can't use includeMap to dynamically update the shader. Instead, we need to use
    // string replacement to update the DEC section directly in the compiled shader.

    // Find and replace the DEC user section in the current base shader
    let newFrag = this.baseFragmentShader || this.originalFragmentSource;

    // The pattern to find: the DEC_USER_DEFINED section between #ifndef and #endif
    // Match the fallback decUserDE function definition (multiline with comments)
    const decSectionPattern = /#ifndef DEC_USER_DEFINED[\s\S]*?#endif/;

    if (injected) {
      // Replace the fallback with the injected code
      const replacement = injected + '\n';
      newFrag = newFrag.replace(decSectionPattern, replacement);
    } else {
      // Restore the fallback
      const fallback = `#ifndef DEC_USER_DEFINED\n// Fallback visible shape for DEC preview: box (not a sphere),\n// so it's obvious when the user snippet wasn't applied.\nfloat decUserDE(vec3 p) { return sdBox(p, vec3(1.0)); }\n#endif`;
      newFrag = newFrag.replace(decSectionPattern, fallback);
    }

    // 3) Update material fragment sources
    this.baseFragmentShader = newFrag;
    if (this.material) {
      this.material.fragmentShader = newFrag;
      this.material.needsUpdate = true;
    }

    // 4) Clear specialized cache and re-apply current specialization
    this.clearSpecializationCache();
    this.applyMaterialSpecializationIfNeeded(true);
  }

  // Resolve a GUI-provided DEC path to our import.meta.glob key
  resolveDecKey(spec) {
    const wanted = String(spec || '').trim();
    if (!wanted) return null;
    // Try exact
    if (DEC_MODULES[wanted]) return wanted;
    // Try adjusting common relative prefixes between UI (./shaders) and app (../shaders)
    let k = wanted;
    if (k.startsWith('./shaders/')) k = '../' + k.slice('./'.length);
    if (DEC_MODULES[k]) return k;
    // If provided is absolute-ish path containing '/includes/dec/', suffix‑match
    const idx = wanted.indexOf('/includes/dec/');
    const suffix = idx >= 0 ? wanted.slice(idx) : wanted.split('/').pop();
    if (suffix) {
      const found = Object.keys(DEC_MODULES).find((p) => p.endsWith(suffix));
      if (found) return found;
    }
    // Last chance: try basename only
    const base = wanted.split('/').pop();
    if (base) {
      const found2 = Object.keys(DEC_MODULES).find((p) => p.endsWith('/' + base));
      if (found2) return found2;
    }
    return null;
  }

  // Transform a DEC snippet into a safe block that defines only decUserDE(vec3)
  buildDecInjectedBlock(srcIn) {
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
    src = src.replace(
      /(^|[^A-Za-z0-9_])pi([^A-Za-z0-9_]|$)/g,
      (m, pre, post) => `${pre}DEC_PI${post}`
    );
    // Map free-floating time/u_time to a local constant
    src = src.replace(
      /(^|[^A-Za-z0-9_])time([^A-Za-z0-9_]|$)/g,
      (m, pre, post) => `${pre}dec_time${post}`
    );
    src = src.replace(
      /(^|[^A-Za-z0-9_])u_time([^A-Za-z0-9_]|$)/g,
      (m, pre, post) => `${pre}dec_time${post}`
    );

    // Alias GDFVectors[...] to DEC_GDF[...] and capture count for prelude
    let prelude = '';
    const mVecs = src.match(/const\s+vec3\s+GDFVectors\s*\[\s*(\d+)\s*\]/);
    if (mVecs) {
      const cnt = mVecs[1];
      prelude += `#ifndef DEC_GDF_COUNT\n#define DEC_GDF_COUNT ${cnt}\n#endif\n`;
      src = src.replace(
        /const\s+vec3\s+GDFVectors\s*\[\s*\d+\s*\]/,
        'const vec3 DEC_GDF[DEC_GDF_COUNT]'
      );
      src = src.replace(/\bGDFVectors\b/g, 'DEC_GDF');
    }
    const mDec = src.match(/const\s+vec3\s+DEC_GDF\s*\[\s*(\d+)\s*\]/);
    if (mDec) {
      const cnt = mDec[1];
      prelude += `#ifndef DEC_GDF_COUNT\n#define DEC_GDF_COUNT ${cnt}\n#endif\n`;
    }
    // Remove accidental DEC_* redefinitions
    src = src.replace(/\s*const\s+float\s+DEC_PHI\s*=\s*[^;]+;\s*/g, '');
    src = src.replace(/\s*const\s+float\s+DEC_PI\s*=\s*[^;]+;\s*/g, '');

    // Attempt to synthesize function header from leading comment proto
    try {
      const proto = src.match(
        /^[ \t]*\/\/\s*DEC SDF:\s*([A-Za-z0-9_]+)\s+([A-Za-z_][\w]*)\s*\(\s*([^)]*?)\s*\)\s*(?:\{\s*)?$/m
      );
      if (proto) {
        const retType = proto[1];
        const fnName = proto[2];
        const argList = proto[3];
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
          // If param list contains identifier equal to function name, rename function to avoid GLSL conflict
          const params = String(argList || '')
            .split(',')
            .map((s) => s.trim());
          let needsFnRename = false;
          for (const seg of params) {
            const cleaned = seg.replace(/\b(in|out|inout)\b/g, '').trim();
            const toks = cleaned.split(/\s+/);
            const pname = toks[toks.length - 1];
            if (pname === fnName) {
              needsFnRename = true;
              break;
            }
          }
          const header = `${retType} ${needsFnRename ? fnName + '_fn' : fnName}(${argList}) {`;
          lines.splice(insertAt, 0, header);
          src = lines.join('\n');
          if (needsFnRename)
            src = src.replace(new RegExp(`\\b${fnName}\\s*\\(`, 'g'), fnName + '_fn(');
        }
      }
    } catch (_) {}

    // Now adapt a synthesized/real function named de(vec3) into decUserDE(vec3)
    // Prefer replacing a standalone `float de(vec3 p)` pattern.
    let body = src;
    body = body.replace(
      /(^|\n)\s*float\s+de\s*\(\s*vec3\s+([A-Za-z_][\w]*)\s*\)\s*\{/,
      (m, pre, param) => `${pre}float decUserDE(vec3 ${param}){`
    );
    // If no exact signature, fallback: replace `\bde\s*\(` calls with `decUserDE(` and define a wrapper if needed
    if (!/decUserDE\s*\(/.test(body)) {
      const replaced = body.replace(/\bde\s*\(/g, 'decUserDE(');
      if (replaced !== body) body = replaced;
    }

    // Prelude ensures DEC utils + time constant
    const pre = [
      '#define DEC_USER_DEFINED 1',
      '// Injected DEC snippet (sanitized) — see dec-utils for DEC_PI/PHI and DEC_GDF',
      'const float dec_time = 0.0; // remapped from time/u_time if referenced',
      prelude.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    return `${pre}\n${body}`;
  }

  // --- Per-frame render path (direct) ---
  // Updates resolution uniform, swaps specialization by FRAC_TYPE, and renders.
  renderDirectFrame() {
    const r = this.renderer.renderer;
    const scene = this.renderer.scene;
    const camera = this.renderer.camera;

    // Sync resolution to current drawing buffer
    try {
      const gl = r.getContext();
      const w = gl.drawingBufferWidth || r.domElement.width;
      const h = gl.drawingBufferHeight || r.domElement.height;
      if (this.uniforms.u_resolution) this.uniforms.u_resolution.value.set(w, h);
    } catch (_) {}

    // Ensure specialized material matches selection
    this.applyMaterialSpecializationIfNeeded();

    // Render directly (post disabled for now)
    r.setRenderTarget(null);
    r.render(scene, camera);
  }

  // --- Per-frame render path (two-pass with post) ---
  // First pass renders fractal into rtScene; second pass runs postMaterial
  // using u_sceneTex. Resolution uniform is updated per pass.
  renderFrame() {
    const r = this.renderer.renderer;
    const scene = this.renderer.scene;
    const camera = this.renderer.camera;

    const wantBloom = !!(this.uniforms.u_bloomEnabled && this.uniforms.u_bloomEnabled.value);
    const wantLUT = !!(this.uniforms.u_lutEnabled && this.uniforms.u_lutEnabled.value);
    const wantPost = wantBloom || wantLUT;

    // Select specialized fractal material for pass 1
    this.applyMaterialSpecializationIfNeeded();

    if (wantPost && this.rtScene) {
      // Pass 1: fractal to RT at RT resolution
      try {
        const w = this.rtScene.width,
          h = this.rtScene.height;
        if (this.uniforms.u_resolution) this.uniforms.u_resolution.value.set(w, h);
      } catch (_) {}
      r.setRenderTarget(this.rtScene);
      r.render(scene, camera);
      r.setRenderTarget(null);

      // Pass 2: post to screen at drawing buffer size
      try {
        const gl = r.getContext();
        const w2 = gl.drawingBufferWidth || r.domElement.width;
        const h2 = gl.drawingBufferHeight || r.domElement.height;
        if (this.uniforms.u_resolution) this.uniforms.u_resolution.value.set(w2, h2);
      } catch (_) {}
      if (this.quad && this.postMaterial) this.quad.material = this.postMaterial;
      if (this.uniforms.u_sceneTex) this.uniforms.u_sceneTex.value = this.rtScene.texture;
      r.render(scene, camera);

      // Restore fractal material for the next frame’s first pass
      this.applyMaterialSpecializationIfNeeded(true);
    } else {
      // Direct render fallback
      this.renderDirectFrame();
    }
  }
}
