/**
 * Visual Presets - Complete scene configurations
 * Each preset includes fractal type, iterations, colors, lighting, and camera position
 *
 * Defaults single-source: we import DEFAULTS and only override what a preset changes.
 */
import { DEFAULTS } from './defaults.js';

export const VISUAL_PRESETS = {
  'Deep Ocean Menger': {
    // Fractal settings
    fractalType: 1, // Menger Sponge
    iterations: 5,
    scale: 1.0,
    power: 8.0,

    // Animation
    animateRotation: true,
    rotationSpeedX: 0.1,
    rotationSpeedY: 0.15,
    rotationSpeedZ: 0.05,

    // Color settings
    colorMode: 1, // Orbit Trap
    palette: 0, // Deep Ocean
    colorIntensity: 1.2,
    orbitTrapScale: 2.0,

    // Lighting
    lightPosX: 15.0,
    lightPosY: 10.0,
    lightPosZ: 10.0,
    ambientStrength: 0.4,
    diffuseStrength: 0.7,
    specularStrength: 0.3,
    shininess: 16.0,

    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 24,
    shadowSharpness: 4.0,

    // Environment
    fogEnabled: true,
    floorEnabled: false,
    fogDensity: 0.015,
    fogColor: '#0a1520',
    backgroundColor: '#000510',

    // Camera (optional - can be null to keep current position)
    camera: {
      position: { x: 3.0, y: 0.5, z: 3.0 },
      rotation: { x: 0, y: 0.785, z: 0 },
    },
  },

  'Molten Mandelbulb': {
    // Fractal settings
    fractalType: 2, // Mandelbulb
    iterations: 10,
    scale: 1.0,
    power: 8.0,

    // Animation
    animateRotation: true,
    rotationSpeedX: 0.15,
    rotationSpeedY: 0.1,
    rotationSpeedZ: 0.2,

    // Color settings
    colorMode: 1, // Orbit Trap
    palette: 1, // Molten Lava
    colorIntensity: 1.5,
    orbitTrapScale: 3.0,

    // Lighting
    lightPosX: 10.0,
    lightPosY: 12.0,
    lightPosZ: 8.0,
    ambientStrength: 0.2,
    diffuseStrength: 0.9,
    specularStrength: 0.7,
    shininess: 64.0,

    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 30,
    shadowSharpness: 2.0,

    // Environment
    fogEnabled: true,
    fogDensity: 0.01,
    fogColor: '#1a0a00',
    backgroundColor: '#0a0000',

    // Camera
    camera: {
      position: { x: 2.5, y: 0.0, z: 2.5 },
      rotation: { x: 0, y: 0.785, z: 0 },
    },
  },

  'Electric Sierpinski': {
    // Fractal settings
    fractalType: 3, // Sierpinski Tetrahedron
    iterations: 10,
    scale: 1.0,
    power: 8.0,

    // Animation
    animateRotation: true,
    rotationSpeedX: 0.2,
    rotationSpeedY: 0.25,
    rotationSpeedZ: 0.15,

    // Color settings
    colorMode: 1, // Orbit Trap
    palette: 2, // Electric
    colorIntensity: 1.8,
    orbitTrapScale: 4.0,

    // Lighting
    lightPosX: 5.0,
    lightPosY: 15.0,
    lightPosZ: 5.0,
    ambientStrength: 0.15,
    diffuseStrength: 0.8,
    specularStrength: 0.9,
    shininess: 128.0,

    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 32,
    shadowSharpness: 1.5,

    // Environment
    fogEnabled: false,
    fogDensity: 0.02,
    fogColor: '#050510',
    backgroundColor: '#000000',

    // Camera
    camera: {
      position: { x: 3.5, y: 1.0, z: 3.5 },
      rotation: { x: -0.2, y: 0.785, z: 0 },
    },
  },

  'Organic Mandelbox': {
    // Fractal settings
    fractalType: 4, // Mandelbox
    iterations: 10,
    scale: 1.0,
    power: 8.0,

    // Animation
    animateRotation: true,
    rotationSpeedX: 0.08,
    rotationSpeedY: 0.12,
    rotationSpeedZ: 0.06,

    // Color settings
    colorMode: 1, // Orbit Trap
    palette: 3, // Organic
    colorIntensity: 1.3,
    orbitTrapScale: 2.5,

    // Lighting
    lightPosX: 12.0,
    lightPosY: 8.0,
    lightPosZ: 12.0,
    ambientStrength: 0.5,
    diffuseStrength: 0.6,
    specularStrength: 0.4,
    shininess: 24.0,

    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 20,
    shadowSharpness: 3.0,

    // Environment
    fogEnabled: true,
    fogDensity: 0.012,
    fogColor: '#0f1408',
    backgroundColor: '#050a00',

    // Camera
    camera: {
      position: { x: 4.0, y: 0.5, z: 4.0 },
      rotation: { x: 0, y: 0.785, z: 0 },
    },
  },

  'Performance Mode': {
    // Fractal settings - Sierpinski is fast and looks amazing
    fractalType: 3, // Sierpinski Tetrahedron (excellent performance)
    iterations: 7,
    scale: 1.0,
    power: 8.0,

    // Animation - fast and energetic
    animateRotation: true,
    rotationSpeedX: 0.4,
    rotationSpeedY: 0.35,
    rotationSpeedZ: 0.3,

    // Color settings - Electric palette is vibrant
    colorMode: 1, // Orbit Trap
    palette: 2, // Electric (cyan/magenta - looks fast!)
    colorIntensity: 1.6,
    orbitTrapScale: 3.5,

    // Lighting (simple but effective)
    lightPosX: 8.0,
    lightPosY: 12.0,
    lightPosZ: 8.0,
    ambientStrength: 0.35,
    diffuseStrength: 0.8,
    specularStrength: 0.5,
    shininess: 64.0,

    // Effects (optimized but still good looking)
    aoEnabled: false, // Disabled for max performance
    softShadowsEnabled: false, // Disabled for max performance
    softShadowSteps: 8,
    shadowSharpness: 2.5,

    // Environment - no fog for max speed
    fogEnabled: false,
    fogDensity: 0.02,
    fogColor: '#000510',
    backgroundColor: '#000000',

    // Performance optimizations - all enabled
    maxSteps: 150,
    stepRelaxation: 0.8,
    adaptiveRelaxation: true,
    relaxationMin: 0.7,
    relaxationMax: 2.0,
    enableDithering: true,
    ditheringStrength: 0.8,
    enableDistanceLOD: true,
    lodNear: 10.0,
    lodFar: 40.0,

    // Camera - dynamic angle
    camera: {
      position: { x: 3.5, y: 1.5, z: 3.5 },
      rotation: { x: -0.3, y: 0.785, z: 0 },
    },
  },

  'Monochrome Dreams': {
    // Fractal settings
    fractalType: 2, // Mandelbulb
    iterations: 10,
    scale: 1.0,
    power: 8.0,

    // Animation
    animateRotation: true,
    rotationSpeedX: 0.05,
    rotationSpeedY: 0.08,
    rotationSpeedZ: 0.03,

    // Color settings
    colorMode: 1, // Orbit Trap
    palette: 4, // Monochrome
    colorIntensity: 1.4,
    orbitTrapScale: 3.5,

    // Lighting
    lightPosX: 8.0,
    lightPosY: 12.0,
    lightPosZ: 6.0,
    ambientStrength: 0.25,
    diffuseStrength: 0.8,
    specularStrength: 0.6,
    shininess: 48.0,

    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 28,
    shadowSharpness: 2.0,

    // Environment
    fogEnabled: true,
    fogDensity: 0.018,
    fogColor: '#0a0a0f',
    backgroundColor: '#000005',

    // Camera
    camera: {
      position: { x: 3.0, y: 0.3, z: 3.0 },
      rotation: { x: 0, y: 0.785, z: 0 },
    },
  },
  Stable: {
    // Minimal overrides from DEFAULTS (safe, artifact-resistant baseline)
    fractalType: 2, // Mandelbulb
    iterations: 10, // Standard detail
    palette: DEFAULTS.palette, // Keep current palette
    relaxationMin: 0.5, // Pin to safer default even if global changes
    useAnalyticNormals: true,
    // Keep sphere-tracing integrator; no distance LOD; no budget LOD
    // Camera (optional)
    camera: {
      position: { x: 2.5, y: 0.0, z: 2.5 },
      rotation: { x: 0, y: 0.785, z: 0 },
    },
  },
  'Cathedral Cavern (World)': {
    fractalType: 5,
    scale: 1.0,
    worldTile: 16.0,
    worldThickness: 0.18,
    worldWarp: 0.35,
    // Camera
    movementSpeed: 1.0,
    // Lighting & effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 24,
    shadowSharpness: 2.6,
    // Environment
    fogEnabled: true,
    fogDensity: 0.018,
    backgroundColor: '#1a2230',
    // Color
    colorMode: 1,
    palette: 0,
    colorIntensity: 1.2,
    orbitTrapScale: 2.2,
    // Performance
    maxSteps: 180,
    // Camera (rough starting pose)
    camera: {
      position: { x: 6.0, y: 1.2, z: 6.0 },
      rotation: { x: -0.1, y: 0.8, z: 0 },
    },
  },
  'Bridges (World, Segment)': {
    fractalType: 5,
    scale: 1.2,
    worldTile: 24.0,
    worldThickness: 0.12,
    worldWarp: 0.2,
    worldDeScale: 0.82,
    worldSegClamp: 0.72,
    // Camera
    movementSpeed: 1.0,
    // Integrator: Segment, robust fly-through
    useSegmentTracing: true,
    integratorAuto: false,
    segmentFraction: 0.45,
    // Lighting & effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 20,
    shadowSharpness: 2.6,
    shadowDitherStrength: 0.25,
    // Environment
    fogEnabled: true,
    fogDensity: 0.01,
    backgroundColor: '#1a1c2a',
    // Color
    colorMode: 1,
    palette: 0,
    colorIntensity: 1.15,
    orbitTrapScale: 2.0,
    // Performance
    maxSteps: 160,
    // Camera (start a little elevated)
    camera: {
      position: { x: 8.0, y: 0.8, z: 8.0 },
      rotation: { x: -0.08, y: 0.9, z: 0 },
    },
  },
  'Cathedral (World, Sphere)': {
    fractalType: 5,
    // World params
    scale: 1.3,
    worldTile: 26.0,
    worldThickness: 0.12,
    worldWarp: 0.22,
    // Camera
    movementSpeed: 1.0,
    // Safer DE/segment settings to avoid shell artifacts
    worldDeScale: 0.85,
    worldSegClamp: 0.8,
    worldDetailStrength: 0.0,
    worldTexType: 0,
    worldTexScale: 1.0,
    worldTexColorStrength: 0.0,
    worldTexBumpStrength: 0.0,
    worldTexSpecStrength: 0.0,
    // Integrator: Sphere (Plain) with safer stepping
    useSegmentTracing: false,
    integratorAuto: false,
    // Lighting (neutral)
    lightColor: '#ffffff',
    ambientStrength: 0.3,
    diffuseStrength: 0.7,
    specularStrength: 0.5,
    shininess: 48.0,
    tintDiffuse: false,
    // Environment
    fogEnabled: true,
    fogDensity: 0.009,
    backgroundColor: '#1a1c2a',
    // Color
    colorMode: 1,
    palette: 2, // Electric
    colorIntensity: 1.15,
    orbitTrapScale: 2.0,
    // Dithering (very low; blue-noise to avoid grid patterns)
    enableDithering: true,
    ditheringStrength: 0.02,
    useBlueNoise: true,
    ditherFog: false,
    shadowDitherStrength: 0.1,
    // Disable frustum budget drop inside large interiors to avoid step undershoot
    frustumBudgetDropEnabled: false,
    // Performance / safety tuning
    maxSteps: 220,
    stepRelaxation: 0.65,
    adaptiveRelaxation: true,
    relaxationMin: 0.5,
    relaxationMax: 1.15,
    curvatureAwareRelaxation: true,
    curvatureNearOnly: true,
    curvatureNearK: 24.0,
    // Step safety
    stepSafety: 0.92,
    stepSafetyAuto: true,
    stepSafetyMin: 0.86,
    stepSafetyMax: 0.95,
    stepSafetyBandNear: 2.2,
    stepSafetyBandFar: 3.6,
    conservativeHits: true,
    // Camera: looking toward an arch
    camera: {
      position: { x: 11.8, y: 1.7, z: 12.7 },
      rotation: { x: -0.1, y: 0.85, z: 0 },
    },
    flyMode: true,
  },
  'Hex Truchet Gold': {
    // Fractal: World for broad surfaces
    fractalType: 5,
    scale: 1.0,
    worldTile: 18.0,
    worldThickness: 0.16,
    worldWarp: 0.28,
    worldDeScale: 0.9,
    worldSegClamp: 0.85,
    // Camera
    movementSpeed: 1.0,
    // Enable procedural textures and use Hex Truchet + FBM
    applyProceduralTextures: true,
    worldTexType: 4,
    worldTexScale: 9.0,
    worldTexColorStrength: 0.22,
    worldTexBumpStrength: 0.38,
    worldTexSpecStrength: 0.5,
    worldTexTypeB: 1,
    worldTexScaleB: 6.0,
    worldTexColorStrengthB: 0.1,
    worldTexBumpStrengthB: 0.18,
    worldTexSpecStrengthB: 0.25,
    worldTexBlendMode: 0,
    worldTexBlendAlphaColor: 0.45,
    worldTexBlendAlphaBump: 0.45,
    worldTexBlendAlphaSpec: 0.45,
    // Hex controls
    hexFoldFreq: 1.1,
    hexContrast: 1.35,
    hexSeed: 11.0,
    // Lighting: shiny, warm gold
    lightColor: '#ffffff',
    ambientStrength: 0.3,
    diffuseStrength: 0.7,
    specularStrength: 0.75,
    shininess: 84.0,
    tintDiffuse: false,
    // Color: use material gold base to keep hue stable
    colorMode: 0,
    materialColor: '#c8a35e',
    colorIntensity: 1.0,
    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 24,
    shadowSharpness: 2.2,
    shadowDitherStrength: 0.2,
    // Post
    postExposure: 1.15,
    postContrast: 1.05,
    postSaturation: 1.1,
    postGamma: 1.0,
    // Environment
    fogEnabled: true,
    backgroundColor: '#3a1d1c',
    // Camera
    camera: {
      position: { x: 8.0, y: 1.2, z: 9.5 },
      rotation: { x: -0.08, y: 0.95, z: 0 },
    },
    flyMode: true,
  },
  'Pipe Catacombs (Truchet)': {
    // Geometry: Truchet world with octagonal pipes and mixed variants
    fractalType: 6,
    scale: 1.0,
    // Truchet controls
    worldTile: 14.0,
    truchetRadius: 0.078,
    truchetShape: 3, // Octagon
    truchetVariant: 0, // Dual (Mixed)
    // Lighting: cool white with strong specular for metal
    lightColor: '#ffffff',
    ambientStrength: 0.28,
    diffuseStrength: 0.72,
    specularStrength: 0.75,
    shininess: 84.0,
    tintDiffuse: false,
    // Material look
    colorMode: 0, // Material
    materialColor: '#a8a2a0', // Brushed steel
    colorIntensity: 1.0,
    // Procedural textures for worn metal + paneling
    applyProceduralTextures: true,
    texSpaceMode: 0, // World space (deterministic across reload)
    worldFbmSeed: 11.0,
    worldTexType: 2, // A: Noise (broad)
    worldTexScale: 8.0,
    worldTexColorStrength: 0.18,
    worldTexBumpStrength: 0.32,
    worldTexSpecStrength: 0.45,
    worldTexTypeB: 1, // B: FBM (fine)
    worldTexScaleB: 3.5,
    worldTexColorStrengthB: 0.1,
    worldTexBumpStrengthB: 0.18,
    worldTexSpecStrengthB: 0.25,
    worldTexBlendMode: 0, // Mix
    worldTexBlendAlphaColor: 0.4,
    worldTexBlendAlphaBump: 0.5,
    worldTexBlendAlphaSpec: 0.45,
    // AA/attenuation
    worldTexAAStrength: 0.7,
    worldTexAutoAtten: true,
    // World detail FBM subtle color modulation
    worldDetailStrength: 0.1,
    worldDetailScale: 0.9,
    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 24,
    shadowSharpness: 2.4,
    shadowDitherStrength: 0.2,
    // Environment
    floorEnabled: false, // requested
    fogEnabled: true,
    fogType: 2, // Linear
    fogNear: 6.0,
    fogFar: 38.0,
    fogColor: '#1a2230',
    backgroundColor: '#1d1f2a',
    // Performance / Integrator (fixed Sphere for determinism)
    maxSteps: 180,
    useSegmentTracing: false,
    integratorAuto: false,
    worldAutoIntegrator: false,
    // Camera (starting pose aiming down an intersection)
    camera: {
      position: { x: 10.5, y: 1.2, z: 11.5 },
      rotation: { x: -0.1, y: 0.92, z: 0 },
    },
    flyMode: true,
  },
  'Pipe Catacombs (Baseline Tex)': {
    // Stress baseline with textures ON for performance tracking
    fractalType: 6,
    // Geometry
    worldTile: 14.0,
    truchetRadius: 0.078,
    truchetShape: 3,
    truchetVariant: 0,
    truchetSmooth: false,
    // Textures (same look as Catacombs)
    applyProceduralTextures: true,
    texSpaceMode: 0,
    worldFbmSeed: 11.0,
    worldTexType: 2,
    worldTexScale: 8.0,
    worldTexColorStrength: 0.18,
    worldTexBumpStrength: 0.32,
    worldTexSpecStrength: 0.45,
    worldTexTypeB: 1,
    worldTexScaleB: 3.5,
    worldTexColorStrengthB: 0.1,
    worldTexBumpStrengthB: 0.18,
    worldTexSpecStrengthB: 0.25,
    worldTexBlendMode: 0,
    worldTexBlendAlphaColor: 0.4,
    worldTexBlendAlphaBump: 0.5,
    worldTexBlendAlphaSpec: 0.45,
    worldTexAAStrength: 0.7,
    worldTexAutoAtten: true,
    worldDetailStrength: 0.1,
    worldDetailScale: 0.9,
    // Performance budgets (heavier than Perf preset)
    maxSteps: 180,
    enableDistanceLOD: true,
    enableBudgetLOD: true,
    budgetStepsFarFactor: 0.95,
    farShadowSkipFactor: 3.0,
    // Shadows / AO
    aoEnabled: true,
    aoMinSamples: 3,
    softShadowsEnabled: true,
    softShadowSteps: 24,
    softShadowMinSteps: 18,
    shadowSharpness: 2.4,
    shadowDitherStrength: 0.0,
    // Fast toggles OFF for baseline
    fastNormals: false,
    fastShadows: false,
    fastAO: false,
    // Stability
    stepSafetyAuto: true,
    stepSafety: 0.88,
    conservativeHits: true,
    // Environment
    floorEnabled: false,
    fogEnabled: true,
    worldFogAuto: true,
    backgroundColor: '#1d1f2a',
    // Lighting / material
    colorMode: 0,
    materialColor: '#a8a2a0',
    lightColor: '#ffffff',
    ambientStrength: 0.28,
    diffuseStrength: 0.72,
    specularStrength: 0.75,
    shininess: 84.0,
    // Integrator
    useSegmentTracing: false,
    integratorAuto: false,
    worldAutoIntegrator: false,
    // Culling/Fast path (off for interiors)
    enableBoundsCulling: false,
    truchetPortalFast: false,
    // Camera (same as Catacombs)
    camera: {
      position: { x: 10.5, y: 1.2, z: 11.5 },
      rotation: { x: -0.1, y: 0.92, z: 0 },
    },
    flyMode: true,
  },
  'PI Tetra (DEC World)': {
    // DEC preview world built from: ./includes/dec/fractal/float-pi-acos-1.glsl
    // Enable DEC and point at the entry key; GUI will inject + set FT_DEC
    fractalType: 7, // FT_DEC
    decPreviewEnabled: true,
    // Use Vite module path used by GUIManager's decOptions
    decEntry: './shaders/includes/dec/fractal/float-pi-acos-1.glsl',

    // Camera
    movementSpeed: 1.0,
    // Visuals — neutral, readable lighting with normal shading
    colorMode: 3, // Normal
    ambientStrength: 0.3,
    diffuseStrength: 0.8,
    specularStrength: 0.55,
    shininess: 64.0,
    lightColor: '#ffffff',
    backgroundColor: '#0c0f14',
    fogEnabled: true,
    fogType: 2, // Linear
    fogNear: 6.0,
    fogFar: 40.0,
    fogColor: '#111622',
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 22,
    shadowSharpness: 2.0,

    // Camera starting pose — slightly offset and tilted
    camera: {
      position: { x: 8.0, y: 2.2, z: 10.0 },
      rotation: { x: -0.12, y: 0.85, z: 0.0 },
    },
    flyMode: true,
  },
  'PI Tetra Surf (World)': {
    // Based on World (Amazing Surf) — tuned to echo the PI‑tetra look
    fractalType: 5,
    worldUseDEC: true,
    // Provide the DEC entry so the world uses it
    decPreviewEnabled: true,
    decEntry: './shaders/includes/dec/fractal/float-pi-acos-1.glsl',
    // Geometry
    scale: 1.0,
    worldTile: 12.0, // radial repetition period (larger = sparser)
    worldThickness: 0.0, // 0 => exact DEC surface (no shell)
    worldWarp: 0.0, // no warp to match DEC exactly
    worldDeScale: 0.95, // slight safety scale for marching
    worldSegClamp: 0.85, // conservative segment clamp
    // Camera
    movementSpeed: 1.0,
    // Lighting & material
    colorMode: 3, // Normal shading for readability
    ambientStrength: 0.28,
    diffuseStrength: 0.8,
    specularStrength: 0.55,
    shininess: 72.0,
    lightColor: '#ffffff',
    // Textures OFF to match DEC shading
    applyProceduralTextures: false,
    texSpaceMode: 0, // world space
    worldTexType: 2, // A: Noise
    worldTexScale: 7.0,
    worldTexColorStrength: 0.1,
    worldTexBumpStrength: 0.18,
    worldTexSpecStrength: 0.28,
    worldTexTypeB: 1, // B: FBM fine
    worldTexScaleB: 3.2,
    worldTexColorStrengthB: 0.06,
    worldTexBumpStrengthB: 0.12,
    worldTexSpecStrengthB: 0.2,
    worldTexBlendMode: 0, // mix
    worldTexBlendAlphaColor: 0.4,
    worldTexBlendAlphaBump: 0.45,
    worldTexBlendAlphaSpec: 0.35,
    // Detail color modulation
    worldDetailStrength: 0.08,
    worldDetailScale: 0.9,
    worldTexAAStrength: 0.7,
    worldTexAutoAtten: true,
    // Effects
    aoEnabled: true,
    softShadowsEnabled: true,
    softShadowSteps: 22,
    shadowSharpness: 2.2,
    // Environment
    fogEnabled: true,
    fogType: 2, // linear
    fogNear: 7.0,
    fogFar: 42.0,
    fogColor: '#121723',
    backgroundColor: '#0c0f14',
    // Performance
    maxSteps: 180,
    enableDistanceLOD: true,
    enableBudgetLOD: false,
    budgetStepsFarFactor: 0.9,
    farShadowSkipFactor: 3.0,
    conservativeHits: false,
    // Camera (use your saved pose or tweak)
    camera: {
      // From your overlay: Pos(-0.3, -0.4, 0.7) Rot(-32.8°, -23.3°, -14.3°)
      position: { x: -0.3, y: -0.4, z: 0.7 },
      rotation: { x: -0.57296, y: -0.40674, z: -0.24958 },
    },
    flyMode: true,
  },
  'Truchet Stability': {
    // Focused stability toggles for Truchet world
    fractalType: 6,
    worldTile: 14.0,
    truchetRadius: 0.078,
    truchetShape: 3,
    truchetVariant: 0,
    // Integrator & steps (deterministic)
    useSegmentTracing: false,
    integratorAuto: false,
    worldAutoIntegrator: false,
    maxSteps: 160,
    stepRelaxation: 0.7,
    stepSafetyAuto: true,
    stepSafety: 0.88,
    conservativeHits: true,
    // Shadows (near/far budgets)
    softShadowSteps: 16,
    softShadowMinSteps: 14,
    farShadowSkipFactor: 3.0,
    // World stability
    worldDeScale: 0.85,
    worldSegClamp: 0.75,
    truchetSmooth: false,
    truchetSmoothK: 0.18,
    // Dither/noise (prefer OFF for pipes to reduce grain/cost)
    enableDithering: false,
    ditheringStrength: 0.04,
    shadowDitherStrength: 0.0,
    // Normals
    normalEpsilon: 0.00002,
    // Lighting/material neutral
    colorMode: 0,
    materialColor: '#a8a2a0',
    lightColor: '#ffffff',
    ambientStrength: 0.28,
    diffuseStrength: 0.72,
    specularStrength: 0.7,
    shininess: 84.0,
    // Environment (auto fog will override near/far)
    floorEnabled: false,
    fogEnabled: true,
    worldFogAuto: true,
    // LOD
    enableDistanceLOD: true,
    enableBoundsCulling: false,
    // Truchet fast path (baseline vanilla = off)
    truchetPortalFast: false,
    backgroundColor: '#1d1f2a',
    // Camera
    camera: {
      position: { x: 10.0, y: 1.2, z: 11.0 },
      rotation: { x: -0.1, y: 0.9, z: 0 },
    },
    flyMode: true,
    movementSpeed: 1.0,
  },
  'Test Settings': {
    // Focused test configuration for quick benchmarking
    fractalType: 6, // Truchet
    // Geometry
    worldTile: 14.0,
    truchetRadius: 0.075,
    truchetShape: 3, // oct
    truchetVariant: 0, // dual
    truchetSmooth: false,
    truchetSmoothK: 0.18,
    truchetSleeveScale: 0.75,
    truchetLipScale: 0.7,
    truchetJoinRing: true,
    truchetJoinRingK: 1.0,
    // Integrator & budgets (match Catacombs baseline for A/B)
    useSegmentTracing: false,
    integratorAuto: false,
    worldAutoIntegrator: false,
    // March budget (baseline parity)
    maxSteps: 180,
    stepRelaxation: 0.7,
    stepSafetyAuto: true,
    stepSafety: 0.88,
    conservativeHits: true,
    // LOD / Budget
    enableDistanceLOD: true,
    enableBudgetLOD: true,
    budgetStepsFarFactor: 0.95, // baseline heavier
    softShadowSteps: 24,
    softShadowMinSteps: 18,
    aoMinSamples: 3,
    aoMaxSamples: 4, // baseline shows AO 4≥3
    farShadowSkipFactor: 3.0,
    // Shadow marcher behavior (baseline)
    shadowEarlyExit: 0.0,
    shadowStepClamp: 0.0,
    // Fast path (portal-aware)
    truchetPortalFast: false,
    truchetFastMargin: 0.035,
    truchetFastK: 4.5,
    truchetFastMinDist: 12.0,
    // Dithering / noise (prefer OFF for stability/perf here)
    enableDithering: false,
    ditherFog: false,
    shadowDitherStrength: 0.0,
    // Fast paths in shading (OFF to isolate texture perf vs baseline)
    fastNormals: false,
    fastShadows: false,
    fastAO: false,
    // Lighting/material neutral
    colorMode: 0,
    materialColor: '#a8a2a0',
    lightColor: '#ffffff',
    ambientStrength: 0.28,
    diffuseStrength: 0.72,
    specularStrength: 0.7,
    shininess: 84.0,
    // Environment
    floorEnabled: false,
    fogEnabled: true,
    worldFogAuto: true,
    backgroundColor: '#1d1f2a',
    // Procedural textures: ON to benchmark texture optimizations
    applyProceduralTextures: true,
    // Baseline texture config (close to Catacombs)
    texSpaceMode: 0,
    worldFbmSeed: 11.0,
    worldTexType: 2,
    worldTexScale: 8.0,
    worldTexColorStrength: 0.18,
    worldTexBumpStrength: 0.12,
    worldTexSpecStrength: 0.22,
    worldTexTypeB: 1,
    worldTexScaleB: 3.5,
    worldTexColorStrengthB: 0.1,
    worldTexBumpStrengthB: 0.18,
    worldTexSpecStrengthB: 0.25,
    worldTexBlendMode: 0,
    worldTexBlendAlphaColor: 0.4,
    worldTexBlendAlphaBump: 0.5,
    worldTexBlendAlphaSpec: 0.45,
    worldTexAAStrength: 0.7,
    worldTexAutoAtten: true,
    worldDetailStrength: 0.06,
    worldDetailScale: 0.9,
    // Texture perf toggles (Phase A+B) – Balanced mapping for profiling
    texLODEnabled: true,
    texTop2: true,
    texTriMinWeight: 0.12,
    texTriHyst: 0.01,
    texFastBump: true,
    texDerivAggression: 1.25,
    texBumpDerivFade: 0.8,
    texSpecDerivFade: 0.7,
    texRoughFadeK: 0.0,
    // Far scaling for bump/spec during high-derivative regions
    texLODBumpFactor: 0.65,
    texLODSpecFactor: 0.75,
    // Culling: off by default for Truchet (overhead in enclosed views)
    enableBoundsCulling: false,
    // Camera (match Catacombs baseline pose)
    camera: {
      position: { x: 10.5, y: 1.2, z: 11.5 },
      rotation: { x: -0.1, y: 0.92, z: 0 },
    },
    flyMode: true,
  },
  'Truchet Interior (Perf)': {
    // One-click tuned baseline for enclosed Truchet scenes
    fractalType: 6,
    // Geometry
    worldTile: 14.0,
    truchetRadius: 0.075,
    truchetShape: 3,
    truchetVariant: 0,
    truchetSmooth: false,
    // Performance budgets
    maxSteps: 148,
    enableDistanceLOD: true,
    enableBudgetLOD: true,
    budgetStepsFarFactor: 0.88, // ~148 -> 130
    farShadowSkipFactor: 3.5,
    // Shadows
    softShadowsEnabled: true,
    softShadowSteps: 14, // near
    softShadowMinSteps: 12, // far floor
    shadowSharpness: 2.5,
    // Shadow marcher behavior
    shadowEarlyExit: 0.72,
    shadowStepClamp: 0.25,
    // AO
    aoEnabled: true,
    aoMinSamples: 3,
    // Disable culling & fast path for interiors
    enableBoundsCulling: false,
    truchetPortalFast: false,
    // Dithering / noise
    enableDithering: false,
    shadowDitherStrength: 0.0,
    ditherFog: false,
    // Fast shading toggles
    fastNormals: true,
    fastShadows: true,
    fastAO: true,
    // Lighting / material neutral
    colorMode: 0,
    materialColor: '#a8a2a0',
    lightColor: '#ffffff',
    ambientStrength: 0.28,
    diffuseStrength: 0.72,
    specularStrength: 0.35,
    shininess: 84.0,
    // Environment
    floorEnabled: false,
    fogEnabled: true,
    worldFogAuto: true,
    backgroundColor: '#1d1f2a',
    // Camera (same as stability)
    camera: {
      position: { x: 10.0, y: 1.2, z: 11.0 },
      rotation: { x: -0.1, y: 0.9, z: 0 },
    },
    flyMode: true,
  },
  'Truchet Exterior (Fast)': {
    // One-click tuned baseline for open/exterior Truchet views
    fractalType: 6,
    // Geometry
    worldTile: 16.0,
    truchetRadius: 0.072,
    truchetShape: 3,
    truchetVariant: 0,
    truchetSmooth: false,
    // Performance budgets
    maxSteps: 160,
    enableDistanceLOD: true,
    enableBudgetLOD: true,
    budgetStepsFarFactor: 0.85, // 160 -> 136
    farShadowSkipFactor: 3.5,
    // Shadows
    softShadowsEnabled: true,
    softShadowSteps: 16, // near
    softShadowMinSteps: 12, // far floor
    shadowSharpness: 2.5,
    // AO
    aoEnabled: true,
    aoMinSamples: 3,
    // Culling + fast-path targeted for exteriors
    enableBoundsCulling: true,
    cullingMode: 1, // Union-style bounds when exterior
    truchetPortalFast: true,
    truchetFastMargin: 0.032,
    truchetFastK: 3.5,
    truchetFastMinDist: 18.0,
    // Dithering / noise
    enableDithering: false,
    shadowDitherStrength: 0.0,
    ditherFog: false,
    // Lighting / material neutral
    colorMode: 0,
    materialColor: '#a8a2a0',
    lightColor: '#ffffff',
    ambientStrength: 0.28,
    diffuseStrength: 0.72,
    specularStrength: 0.7,
    shininess: 84.0,
    // Environment (auto fog helps scale with tile size)
    floorEnabled: false,
    fogEnabled: true,
    worldFogAuto: true,
    backgroundColor: '#1d1f2a',
    // Camera (start a bit farther out)
    camera: {
      position: { x: 15.0, y: 2.0, z: 16.0 },
      rotation: { x: -0.1, y: 0.95, z: 0 },
    },
    flyMode: true,
  },
};

// Get list of preset names
export function getPresetNames() {
  return Object.keys(VISUAL_PRESETS);
}

// Get a specific preset by name
export function getPreset(name) {
  return VISUAL_PRESETS[name] || null;
}
