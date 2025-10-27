// Centralized defaults for uniforms and GUI params
export const DEFAULTS = {
  fractalType: 1,
  iterations: 10,
  power: 8.0,
  scale: 1.0,

  // Animation
  animateRotation: false,
  rotationSpeedX: 0.2,
  rotationSpeedY: 0.15,
  rotationSpeedZ: 0.1,

  // Camera
  movementSpeed: 5.0,
  fov: 45.0,
  flyMode: false,

  // Lighting
  lightPosX: 10.0,
  lightPosY: 10.0,
  lightPosZ: 10.0,
  lightColor: '#ffffff',
  ambientStrength: 0.3,
  diffuseStrength: 0.7,
  specularStrength: 0.5,
  shininess: 32.0,

  // Environment
  fogEnabled: true,
  fogType: 0,
  fogDensity: 0.02,
  fogNear: 1.0,
  fogFar: 50.0,
  fogColor: '#1a1a26',
  backgroundColor: '#4a525e',

  // Floor
  floorEnabled: true,
  floorColorA: '#2b2f36',
  floorColorB: '#4a525e',
  floorReceiveShadows: true,

  // Safeties helpers
  ringSafeClamp: true,
  ringSafeClampMax: 0.87,
  // Optional per-fractal safety tweaks (off to keep true DEFAULTS after reset)
  enablePerFractalSafetyTweaks: false,

  // AO & Shadows toggles
  aoEnabled: true,
  softShadowsEnabled: true,
  shadowSharpness: 2.5,

  // Performance
  maxSteps: 128,
  stepRelaxation: 0.7,
  adaptiveRelaxation: true,
  relaxationMin: 0.5,
  relaxationMax: 1.4,

  // Integrator & Normals
  useSegmentTracing: false,
  segmentFraction: 0.5,
  integratorAuto: false,
  integratorSwitchDist: 2.4,
  useAnalyticNormals: true,

  // Dithering
  enableDithering: false,
  ditheringStrength: 0.15,
  useBlueNoise: false,
  blueNoiseScale: 2.0,
  blueNoiseTemporalJitter: false,
  ditherFog: false,
  // Fast shading toggles (UI-only helpers under Performance)
  fastNormals: false,
  fastShadows: false,
  fastAO: false,

  // LOD & Bounds
  enableBoundsCulling: true,
  boundsCullMargin: 1.5,
  cullingMode: 0, // 0=PlaneOnly, 1=Union
  enableDistanceLOD: true,
  enableBudgetLOD: true,
  lodNear: 10.0,
  lodFar: 40.0,

  // Budget LOD
  budgetStepsFarFactor: 0.95,
  farShadowSkipFactor: 2.5,
  aoMinSamples: 3,
  softShadowMinSteps: 20,
  // UI convenience mirror for reset buttons (drives u_softShadowSteps)
  softShadowSteps: 20,

  // Curvature relax
  curvatureAwareRelaxation: true,
  curvatureNearOnly: true,
  curvatureNearK: 24.0,

  // Safeties
  stepSafety: 0.88,
  stepSafetyAuto: false,
  stepSafetyMin: 0.82,
  stepSafetyMax: 0.95,
  stepSafetyBandNear: 2.2,
  stepSafetyBandFar: 3.6,

  // Hit Safeties
  conservativeHits: false,

  // Frustum budget drop
  frustumBudgetDropEnabled: true,
  frustumBudgetDropFactor: 0.5,
  frustumBudgetAOMin: 1,
  frustumBudgetShadowMin: 6,
  frustumDropHysteresisFrames: 12,

  // Auto-resolution tuning
  autoResolutionEnabled: false,
  autoResHoldFrames: 120, // frames to hold after a change (~2s)
  autoResSustainLow: 1, // consecutive checks below low to downscale
  autoResSustainHigh: 3, // consecutive checks above high to upscale

  // Color
  colorMode: 1,
  palette: 2,
  colorIntensity: 1.0,
  orbitTrapScale: 1.0,
  materialColor: '#cc6633',
  // Texture color mapping (for Texture color mode)
  texColorBase: '#cfcfcf',
  texColorAccent: '#303030',
  texLayerColoring: false,
  texAColorBase: '#d0cdc6',
  texAColorAccent: '#2f2c2a',
  texBColorBase: '#e8e4dc',
  texBColorAccent: '#5a504a',
  // Post Processing (global)
  postExposure: 1.0, // multiplier (0.0–3.0)
  postContrast: 1.0, // 1.0 = neutral (0.5–1.8)
  postSaturation: 1.0, // 1.0 = neutral (0.0–2.0)
  postGamma: 1.0, // 1.0 = neutral (0.5–2.4)
  vignetteStrength: 0.0, // 0..1 (0=off)
  vignetteSoftness: 0.4, // 0..1 (edge softness)
  toneMapper: 0, // 0=None, 1=ACES, 2=Filmic
  // Bloom
  bloomEnabled: false,
  bloomThreshold: 1.0,
  bloomStrength: 0.0,
  bloomRadius: 1.0,
  // LUT
  lutEnabled: false,
  lutIntensity: 1.0,
  lutSize: 32,
  // Sierpinski tuning
  sierpinskiBase: 1.85,
  // World (Amazing Surf)
  worldTile: 14.0,
  worldThickness: 0.18,
  worldWarp: 0.35,
  worldDeScale: 0.85,
  worldSegClamp: 0.8,
  worldUseDEC: false,
  worldDetailStrength: 0.1,
  worldDetailScale: 0.8,
  worldFogAuto: true,
  worldAutoIntegrator: true,
  // World Procedural Texture (prototype)
  worldTexType: 2, // A: Noise
  worldTexScale: 12.0,
  worldTexColorStrength: 0.16,
  worldTexBumpStrength: 0.25,
  worldTexSpecStrength: 0.18,
  // Texture B layer + blend
  worldTexTypeB: 1, // B: FBM
  worldTexScaleB: 4.0,
  worldTexColorStrengthB: 0.08,
  worldTexBumpStrengthB: 0.12,
  worldTexSpecStrengthB: 0.1,
  worldTexBlendMode: 0, // Mix
  worldTexBlendAlphaColor: 0.45,
  worldTexBlendAlphaBump: 0.45,
  worldTexBlendAlphaSpec: 0.45,
  // FBM controls (for FBM type)
  worldFbmOctaves: 5,
  worldFbmLacunarity: 2.1,
  worldFbmGain: 0.52,
  worldFbmSeed: 7.0,
  // Anti-aliasing & auto attenuation
  worldTexAAStrength: 0.7, // stronger AA for very high scales
  worldTexAutoAtten: true, // reduce bump/spec at extreme scales
  // Scale link (A→B)
  texScaleLinkEnabled: false,
  texScaleLinkK: 1.0,
  // Strength links (A→B)
  texColorLinkEnabled: false,
  texColorLinkK: 1.0,
  texBumpLinkEnabled: false,
  texBumpLinkK: 1.0,
  texSpecLinkEnabled: false,
  texSpecLinkK: 1.0,
  // Texture domain warp (global)
  texWarpStrength: 0.0,
  texWarpScale: 2.0,
  texWarpOctaves: 3,
  texWarpType: 0, // 0=None, 1=FBM, 2=Ridged
  // Texture anisotropy
  texAnisoFactor: 1.0,
  texAnisoAxis: 1,
  // Texture LOD (derivative-based)
  texLODEnabled: true,
  texDerivOctDrop: 3,
  texDerivMinOct: 2,
  texWarpOctDrop: 2,
  texLODBumpFactor: 0.4,
  texLODSpecFactor: 0.5,
  // Texture perf toggles
  texTop2: false, // Use top-2 triplanar projections
  texFastBump: false, // Use 3-tap bump gradient on dominant layer
  texTriMinWeight: 0.08, // Min weight to keep third projection (0..0.2)
  texTriHyst: 0.0, // Soft hysteresis band for Top-2 threshold (0..0.05)
  // Phase B controls (derivative-driven)
  texDerivAggression: 1.0, // scales octave drop (1.0 = current)
  texBumpDerivFade: 0.0, // extra bump fade by derivatives (0..1)
  texSpecDerivFade: 0.0, // extra spec fade by derivatives (0..1)
  texRoughFadeK: 0.0, // curvature-based additional fade (0=off)
  // Optional distance-based fade for procedural bump/spec on fractal surfaces
  texFadeNear: 0.0,
  texFadeFar: 0.0,
  // Texture Quality macro preset
  textureQuality: 'Balanced', // 'Performance' | 'Balanced' | 'Crisp'
  // Truchet variants
  worldTruchetRotate: true,
  worldTruchetWidth: 0.12, // slightly thinner lines
  worldTruchetDensity: 1.0, // baseline density
  // Hex Truchet advanced
  hexFoldFreq: 1.0,
  hexContrast: 1.0,
  hexSeed: 7.0,
  truchetRadius: 0.075,
  truchetShape: 3,
  truchetVariant: 0,
  truchetSmooth: false,
  truchetSmoothK: 0.18,
  truchetSleeveScale: 1.0,
  truchetLipScale: 1.0,
  // Truchet performance
  truchetPortalFast: true,
  truchetFastMargin: 0.035,
  truchetFastK: 3.5,
  truchetFastMinDist: 6.0,
  truchetMirrorJoins: false,
  // Join ring (cheap symmetric band at junctions)
  truchetJoinRing: false,
  truchetJoinRingK: 1.0,
  // Procedural textures reuse
  applyProceduralTextures: false,
  // Where to apply the procedural textures: 0=Fractal,1=Floor,2=Both
  textureApplyTarget: 0,
  // Floor texture mode: 0=Fast 2D, 1=Full Triplanar
  floorTextureMode: 0,
  floorIgnoreWarp: false,
  floorBumpScale: 1.0,
  floorSpecScale: 1.0,
  // Floor LOD
  floorTexDisableDist: 0.0,
  floorTexAutoDisable: false,
  floorTexAutoMul: 1.5,
  floorFadeNear: 0.0,
  floorFadeFar: 0.0,
  texSpaceMode: 0, // 0=World space, 1=Local (object) space
  // AO/Shadow performance
  aoMaxSamples: 4,
  shadowEarlyExit: 0.0,
  shadowStepClamp: 0.0,
  shadowBiasBase: 0.002,
  shadowBiasSlope: 0.0005,
  shadowBiasAngle: 0.0025,
  shadowPlaneBias: 0.02,
  shadowDitherStrength: 1.0,

  aoFallbackStrength: 1.0,

  // Normals
  normalEpsilon: 0.00001,
  // Camera UI
  reticleEnabled: false,
  // Morph animation (parameter cycling)
  morphEnabled: false,
  morphSpeed: 0.15, // cycles per second
  morphFractalScaleAmp: 0.15,
  morphFractalPowerAmp: 0.0,
  morphWorldThicknessAmp: 0.04,
  morphWorldWarpAmp: 0.15,
  morphWorldTileAmp: 0.0,
  morphTexWarpStrengthAmp: 0.2,
  morphTruchetRadiusAmp: 0.02,
  // Debug
  debugEnabled: false,
  debugMode: 0, // 0=Off,1=Steps,2=Distance,3=OrbitTrap,4=Normal,5=Map@Hit
  dbgBypassSierpinskiAlign: false,
  dbgBypassFractalRotation: false,

  // Icosahedron mapping (DEC Preview): true=IQ SDF, false=GDF sharp
  icoUseIQ: true,
};
