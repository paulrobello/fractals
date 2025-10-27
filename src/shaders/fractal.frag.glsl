// Fragment Shader (GLSL 3.00 ES) — Three.js injects #version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;

// Forward declare vector rotation helpers for includes that reference them
vec3 rotateX(vec3 p, float angle);
vec3 rotateY(vec3 p, float angle);
vec3 rotateZ(vec3 p, float angle);
vec3 rotate3D(vec3 p, vec3 angles);
vec3 rotate3DInv(vec3 p, vec3 angles);
// Forward declare local helpers used before definition
float mapFractalOnly(vec3 p);
// Forward declare Mandelbulb with orbit trap (used by shared include before definition)
vec2 sdMandelbulbWithTrap(vec3 p, int iterations, float power);

// Includes (via vite-plugin-glsl)
#include "./includes/common.glsl"
#include "./includes/sdf-primitives.glsl"
#include "./includes/sdf-operations.glsl"
#include "./includes/sdf-menger.glsl"
#include "./includes/sdf-mandelbulb.glsl"
#include "./includes/sdf-mandelbox.glsl"
#include "./includes/sdf-sierpinski.glsl"
#include "./includes/coloring.glsl"
// DEC shared constants and GDF plane set for preview snippets
#include "./includes/dec/dec-utils.glsl"

// --- Optional DEC Preview injection -----------------------------------------
// The include below is resolved at build time by our manual include resolver.
// When the preview is disabled, it expands to an empty string. When enabled,
// it injects a user-selected SDF snippet while remapping `de` -> `decUserDE`.
// See ShaderManager for runtime toggling and injection.
#include "./includes/dec/__user__.glsl"
// Fallback if injection didn't define a DEC function
#ifndef DEC_USER_DEFINED
// Fallback visible shape for DEC preview: box (not a sphere),
// so it's obvious when the user snippet wasn't applied.
float decUserDE(vec3 p) { return sdBox(p, vec3(1.0)); }
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_cameraPos;
uniform vec3 u_cameraTarget;
uniform float u_fov;
// Camera basis (world space). Right/Up provided by CPU to avoid ambiguity.
uniform vec3 u_camRight;
uniform vec3 u_camUp;

// Fractal parameters
#ifdef FRAC_TYPE
// When specialized, replace the uniform with a compile-time constant so the
// compiler can fold switches/branches and strip dead code.
const int u_fractalType = FRAC_TYPE; // 0..6
#else
uniform int u_fractalType; // 0=primitives, 1=Menger, 2=Mandelbulb, 3=Sierpinski, 4=Mandelbox, 5=World(AmazingSurf)
#endif
uniform int u_iterations;
uniform float u_fractalPower; // For Mandelbulb
uniform float u_fractalScale;
uniform vec3 u_rotation; // Per-axis rotation angles

// Additional uniforms from GUI
uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
uniform bool u_tintDiffuse; // when true, multiply diffuse by light color
uniform float u_ambientStrength;
uniform float u_diffuseStrength;
uniform float u_specularStrength;
uniform float u_shininess;
uniform bool u_fogEnabled;
uniform int u_fogType; // 0=exp, 1=exp2, 2=linear
uniform float u_fogDensity;
uniform float u_fogNear;
uniform float u_fogFar;
uniform vec3 u_fogColor;
uniform vec3 u_backgroundColor;
uniform int u_maxSteps;
uniform float u_stepRelaxation;
uniform bool u_aoEnabled;
uniform bool u_softShadowsEnabled;
uniform int u_softShadowSteps;
uniform float u_shadowSharpness;
// Soft shadow bias to avoid self-shadow banding
uniform float u_shadowBiasBase;   // base bias added to each shadow sample
uniform float u_shadowBiasSlope;  // bias grows slightly with distance (per unit t)
uniform float u_shadowBiasAngle;  // extra bias at grazing angles (vs light)
uniform float u_shadowPlaneBias;  // additional clamp near ground plane
uniform float u_shadowDitherStrength; // independent shadow jitter strength (0..1)
uniform float u_normalEpsilon;

// Advanced ray marching controls
uniform bool u_adaptiveRelaxation; // Enable adaptive step sizing
uniform float u_relaxationMin; // Minimum relaxation factor (conservative)
uniform float u_relaxationMax; // Maximum relaxation factor (aggressive)
uniform bool u_enableDithering; // Enable dithering to reduce banding
uniform float u_ditheringStrength; // Dithering intensity (0.0-1.0)
uniform bool u_useBlueNoise; // Use blue-noise style hash instead of interleaved pattern
uniform float u_blueNoiseScale; // Blue-noise tiling scale (>=1)
uniform bool u_blueNoiseTemporalJitter; // Add subtle temporal jitter (default OFF)
uniform bool u_ditherFog; // Apply dithering to fog blend (optional)
uniform bool u_enableDistanceLOD; // Enable distance-based LOD (epsilon)
uniform bool u_enableBudgetLOD;   // Enable distance-based budgets (steps, AO, shadows)
uniform float u_lodNear; // Near distance for LOD
uniform float u_lodFar; // Far distance for LOD
uniform float u_budgetStepsFarFactor; // Fraction of base steps when far (0.0-1.0)
uniform float u_farShadowSkipFactor;  // Multiplier for LOD far distance to skip shadows
uniform int u_aoMinSamples; // Minimum AO samples when far
uniform int u_softShadowMinSteps; // Minimum soft shadow steps when far
// Bounds culling
uniform bool u_enableBoundsCulling; // Enable coarse bounds early-out
uniform float u_boundsCullMargin;   // Margin threshold for culling
// Floor controls
uniform bool u_floorEnabled;
uniform vec3 u_floorColorA;
uniform vec3 u_floorColorB;
uniform bool u_floorReceiveShadows; // allow floor to receive soft shadows
uniform int u_cullMode;             // 0=PlaneOnly, 1=Union
// Procedural texture application target: 0=Fractal, 1=Floor, 2=Both
uniform int u_texApplyTarget;
// Floor texture mode: 0=Fast 2D (single projection), 1=Full Triplanar
uniform int u_floorTexMode;
// Floor-specific performance knobs
uniform bool  u_floorIgnoreWarp; // skip global domain warp on floor sampling
uniform float u_floorBumpScale;  // 0..1 scales bump delta on floor
uniform float u_floorSpecScale;  // 0..1 scales specular modulation on floor
// Floor distance LOD
uniform float u_floorTexDisableDist; // >0 disables floor textures beyond this distance
uniform bool  u_floorTexAutoDisable; // when true, derives disable dist from u_lodFar
uniform float u_floorTexAutoMul;     // disable at ~ u_lodFar * mul (>=1)
uniform float u_floorFadeNear;       // optional near distance to start fading bump/spec
uniform float u_floorFadeFar;        // far distance to end fading bump/spec
// Curvature-aware relaxation
uniform bool u_curvatureAwareRelaxation; // Enable curvature term in relaxation
// Integrator selection and options
uniform bool u_useSegmentTracing;   // Use segment tracing integrator
uniform float u_segmentFraction;    // Fraction of remaining distance per step (0..1)
// Normal calculation options
uniform bool u_useAnalyticNormals;  // Use specialized normal path where available
// Safety and curvature gating
uniform float u_stepSafety;               // Multiplier on step length (0.7..1.0)
uniform bool u_curvatureNearOnly;         // Apply curvature only near surface
uniform float u_curvatureNearK;           // d < adaptiveEpsilon * K
// Auto safety controls
uniform bool u_stepSafetyAuto;            // Enable auto step safety
uniform float u_stepSafetyMin;            // Lower bound for auto safety
uniform float u_stepSafetyMax;            // Upper bound for auto safety
uniform float u_stepSafetyBandNear;       // Distance band start for extra safety
uniform float u_stepSafetyBandFar;        // Distance band end for extra safety
// Hit/plane safeties
uniform bool u_conservativeHits;          // Require stricter hit threshold
// (removed) plane-aware step safeties; floor is resolved analytically post-march
// Auto integrator controls
uniform bool u_integratorAuto;            // Auto switch to segment tracing by distance
uniform float u_integratorSwitchDist;     // Switch distance for auto integrator

// Color system controls
#define MAX_PALETTE_STOPS 8
uniform int u_colorMode; // 0=material, 1=orbit trap, 2=distance, 3=normal
uniform int u_paletteId; // 0=Deep Ocean, 1=Molten Lava, 2=Electric, 3=Organic, 4=Monochrome, 5=Deep Abyss, 6=Tropical Sea
uniform float u_colorIntensity; // Color brightness multiplier
uniform float u_orbitTrapScale; // Orbit trap scaling factor
uniform vec3 u_materialColor; // Custom color for material mode
// Procedural texture color mapping (for Texture color mode)
uniform vec3 u_texColorBase;   // base color (e.g., stone)
uniform vec3 u_texColorAccent; // accent/vein color
// Per-layer texture color mapping (advanced, for Texture color mode)
uniform bool u_texLayerColoring; // when true, color A and B separately then blend
uniform vec3 u_texA_colorBase;
uniform vec3 u_texA_colorAccent;
uniform vec3 u_texB_colorBase;
uniform vec3 u_texB_colorAccent;
// Custom palette uniforms (active when u_useCustomPalette is true or paletteId < 0)
uniform int u_useCustomPalette; // 0=no, 1=yes
uniform int  u_paletteStopCount; // 2..MAX_PALETTE_STOPS
uniform float u_paletteStops[MAX_PALETTE_STOPS]; // ascending 0..1
uniform vec3 u_paletteColors[MAX_PALETTE_STOPS];
// Interpolation / wrap
// u_paletteInterpMode: 0=linear, 1=cosine
// u_paletteWrapMode: 0=clamp, 1=repeat, 2=mirror
uniform int u_paletteInterpMode;
uniform int u_paletteWrapMode;
// CPU-driven skip when scene is known empty
uniform bool u_skipWhenEmpty;
// Debugging
uniform bool u_debugEnabled;
uniform int u_debugMode; // 0=Off, 1=Steps, 2=Distance, 3=OrbitTrap, 4=Normal(hit), 5=Map@Hit
uniform bool u_dbgBypassSierpinskiAlign;
uniform bool u_dbgBypassFractalRotation;
// Sierpinski tuning
uniform float u_sierpinskiBase;
// World (Amazing Surf) controls
uniform float u_worldTile;       // period for XZ tiling
uniform float u_worldThickness;  // thickness of gyroid shell
uniform float u_worldWarp;       // domain warp strength
uniform float u_worldDeScale;    // de safety scale (<1 = safer)
uniform float u_worldSegClamp;   // segment step clamp for world (<=1)
uniform float u_worldDetailStrength; // 0..1 subtle color modulation
uniform float u_worldDetailScale;    // detail texel scale
uniform int   u_worldTexType;        // 0=None,1=FBM,2=Noise,3=Truchet,4=HexTruchet
uniform float u_worldTexScale;
uniform float u_worldTexColorStrength;
uniform float u_worldTexBumpStrength;
uniform float u_worldTexSpecStrength;
// Texture B + blend
uniform int   u_worldTexTypeB;
uniform float u_worldTexScaleB;
uniform float u_worldTexColorStrengthB;
uniform float u_worldTexBumpStrengthB;
uniform float u_worldTexSpecStrengthB;
uniform int   u_worldTexBlendMode;   // 0=mix,1=multiply,2=add
uniform float u_worldTexBlendAlphaColor; // 0..1 when mix (color)
uniform float u_worldTexBlendAlphaBump;  // 0..1 when mix (bump)
uniform float u_worldTexBlendAlphaSpec;  // 0..1 when mix (spec)
// FBM controls
uniform int   u_worldFbmOctaves;     // 1..8
uniform float u_worldFbmLacunarity;  // ~2.0
uniform float u_worldFbmGain;        // ~0.5
uniform float u_worldFbmSeed;        // seed offset
// Texture AA / attenuation
uniform float u_worldTexAAStrength;  // 0..1
// DEC-as-World toggle: when true, FT_WORLD uses decUserDE shell instead of Amazing Surf
uniform bool  u_worldUseDEC;
uniform bool  u_worldTexAutoAtten;   // reduce bump/spec at extreme scales
// Global domain warp for procedural textures
uniform float u_texWarpStrength; // 0..2
uniform float u_texWarpScale;    // >=0.05
uniform int   u_texWarpOctaves;  // 1..6
uniform int   u_texWarpType;     // 0=None, 1=FBM, 2=Ridged
// Texture anisotropy (directional stretch)
uniform float u_texAnisoFactor;  // 0.05..4.0 (1 = none)
uniform int   u_texAnisoAxis;    // 0=X,1=Y,2=Z
// Texture LOD controls (derivative-based)
uniform bool  u_texLODEnabled;   // Enable texture LOD coupling
uniform int   u_texDerivOctDrop; // Max octaves to drop for FBM at far
uniform int   u_texDerivMinOct;  // Minimum FBM octaves
uniform int   u_texWarpOctDrop;  // Max warp octaves to drop at far
uniform float u_texLODBumpFactor; // Bump scale at far (0..1)
uniform float u_texLODSpecFactor; // Spec scale at far (0..1)
// Texture perf toggles
uniform bool  u_texTop2;         // Use top-2 triplanar projections
uniform bool  u_texFastBump;     // Use 3-tap bump gradient on dominant layer
uniform float u_texTriMinWeight; // Min weight to keep third projection (0..0.2)
uniform float u_texTriHyst;      // Soft hysteresis band for Top-2 threshold (0..0.05)
// Phase B controls
uniform float u_texDerivAggression; // scales octave drop aggressiveness
uniform float u_texBumpDerivFade;   // extra bump fade by derivatives (0..1)
uniform float u_texSpecDerivFade;   // extra spec fade by derivatives (0..1)
uniform float u_texRoughFadeK;      // curvature-based fade factor (0=off)

// Optional distance-based fade for procedural bump/spec on fractal surfaces
// Scales bump/spec toward 0 as distance increases from Near→Far
uniform float u_texFadeNear;  // 0 disables when Far<=Near
uniform float u_texFadeFar;
// World (Truchet Pipes)
uniform float u_truchetRadius;   // tube radius
uniform int   u_truchetShape;    // 0..3 (round/square/rounded/octagonal)
uniform int   u_truchetVariant;  // 0=dual,1=torus only,2=straight only
uniform bool  u_truchetSmooth;   // smooth-union bands with tube to reduce kinks
uniform float u_truchetSmoothK;  // smoothing scale factor relative to radius (0..0.5)
// Truchet fast-path (portal/sleeve aware) — conservative early-out
uniform bool  u_truchetPortalFast;
uniform float u_truchetFastMargin; // 0.015..0.06 safety margin
uniform float u_truchetFastK;      // 1..8 gating multiplier
uniform float u_truchetFastMinDist; // world-space min distance to allow fast path
// Mirror join decoration on both adjoining segments when close (dual variant)
uniform bool  u_truchetMirrorJoins;
// Join shaping controls
uniform float u_truchetSleeveScale; // scales sleeve thickness/height (0.5..1.2)
uniform float u_truchetLipScale;    // scales portal lip offset (0.5..1.5)
// Cheap symmetric join band
uniform bool  u_truchetJoinRing;
uniform float u_truchetJoinRingK;
// Truchet variants
uniform int   u_worldTruchetRotate;  // 0/1 random 90° flips
uniform float u_worldTruchetWidth;   // 0.05..0.5 band width
uniform float u_worldTruchetDensity; // 0..2 pattern density
// Hex Truchet advanced controls
uniform float u_hexFoldFreq;         // frequency multiplier for hex fold (1.0 = default)
uniform float u_hexContrast;         // contrast scale for hex fold (1.0 = default)
// Apply procedural textures to non‑World fractals
uniform bool  u_texturesEnabled;
uniform int   u_texSpaceMode; // 0=world, 1=local
// AO/Shadow performance controls
uniform int   u_aoMaxSamples;      // Near AO samples (default 4-5)
uniform float u_shadowEarlyExit;   // Early-exit threshold for soft shadows
uniform float u_shadowStepClamp;   // Max per-step clamp in shadow march
// Performance toggles
uniform bool u_fastNormals;        // Use cheaper forward-diff normals
uniform bool u_fastShadows;        // Cap soft-shadow steps aggressively
uniform bool u_fastAO;             // Use simplified SDF for AO on Truchet
// AO fallbacks
uniform float u_aoFallbackStrength; // strength of cheap AO when AO disabled (0..1)

// DEC Preview controls
uniform vec3  u_decOffset;      // world-space offset before rotation/scale

// Post processing (applies to all fractals)
uniform float u_postExposure;   // 0..3 (multiplier)
uniform float u_postContrast;   // 0.5..1.8 (1=neutral)
uniform float u_postSaturation; // 0..2 (1=neutral)
uniform float u_postGamma;      // 0.5..2.4 (1=neutral)
uniform float u_vignetteStrength; // 0..1
uniform float u_vignetteSoftness; // 0..1
uniform int   u_toneMapper;     // 0=None, 1=ACES, 2=Filmic

// No varyings used; working in screen space (gl_FragCoord)

// World texture and world DE helpers (declared after uniforms so uniforms are visible)
// Fractal type tags for readability
#define FT_PRIMITIVES 0
#define FT_MENGER     1
#define FT_BULB       2
#define FT_SIERPINSKI 3
#define FT_MANDELBOX  4
#define FT_WORLD      5
#define FT_TRUCHET    6
#define FT_DEC        7
#include "./includes/sdf-amazing-surf.glsl"
// Truchet pipes SDF
#include "./includes/sdf-truchet-pipes.glsl"

// (Removed legacy preview stub; global fallback defined above if needed)

// Dithering and noise functions to reduce banding
float hash(vec2 p) {
  // Simple hash function for random-looking values
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float hash3D(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
}

// Interleaved gradient noise (low discrepancy dithering)
// This produces temporally stable dithering
float interleavedGradientNoise(vec2 screenPos) {
  vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(screenPos, magic.xy)));
}

// Simple blue-noise-like hash: integer pixel coords, optional temporal jitter
float blueNoiseHash(vec2 screenPos) {
  vec2 p = floor(screenPos / max(1.0, u_blueNoiseScale));
  if (u_blueNoiseTemporalJitter) {
    p += vec2(fract(u_time * 0.0719), fract(u_time * 0.0463));
  }
  return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

// Centralized dither offset near surface threshold
float ditherNearSurface(float dist, float eps) {
  if (!u_enableDithering) return 0.0;
  float n = u_useBlueNoise ? blueNoiseHash(gl_FragCoord.xy) : interleavedGradientNoise(gl_FragCoord.xy);
  float edge = 1.0 - smoothstep(eps * 2.0, eps * 8.0, dist);
  return n * u_ditheringStrength * eps * edge;
}

// 3D gradient noise for smooth randomness
float gradientNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  // Smooth interpolation
  f = f * f * (3.0 - 2.0 * f);

  // Hash corners
  float n000 = hash3D(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash3D(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash3D(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash3D(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3D(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash3D(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash3D(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash3D(i + vec3(1.0, 1.0, 1.0));

  // Trilinear interpolation
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);

  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);

  return mix(nxy0, nxy1, f.z);
}

// Palette helpers come from includes/coloring.glsl
// Custom palette sampler
vec3 sampleCustomPalette(float t) {
    float x;
    if (u_paletteWrapMode == 1) { // repeat
        x = fract(t);
    } else if (u_paletteWrapMode == 2) { // mirror
        float f = fract(t);
        x = 1.0 - abs(1.0 - 2.0 * f);
    } else { // clamp
        x = clamp(t, 0.0, 1.0);
    }
    int count = u_paletteStopCount;
    if (count <= 0) return vec3(x); // grayscale fallback
    if (count == 1) return u_paletteColors[0];

    // Find segment containing x. Loop upper bound must be constant in GLSL ES
    int idx = 0;
    for (int j = 1; j < MAX_PALETTE_STOPS; ++j) {
        if (j >= count) { idx = max(0, count - 2); break; }
        if (x < u_paletteStops[j]) { idx = j - 1; break; }
        idx = max(0, count - 2);
    }
    float t0 = u_paletteStops[idx];
    float t1 = u_paletteStops[idx + 1];
    vec3  c0 = u_paletteColors[idx];
    vec3  c1 = u_paletteColors[idx + 1];
    float f = (t1 > t0) ? clamp((x - t0) / (t1 - t0), 0.0, 1.0) : 0.0;
    if (u_paletteInterpMode == 1) {
        // cosine smooth interpolation
        f = 0.5 - 0.5 * cos(3.14159265 * f);
    }
    return mix(c0, c1, f);
}
vec3 getPaletteColor(float t, int paletteId) {
    if (u_useCustomPalette == 1 || paletteId < 0) {
        return sampleCustomPalette(t);
    }
    if (paletteId == 0) return paletteDeepOcean(t);
    if (paletteId == 1) return paletteMoltenLava(t);
    if (paletteId == 2) return paletteElectric(t);
    if (paletteId == 3) return paletteOrganic(t);
    if (paletteId == 4) return paletteMonochrome(t);
    if (paletteId == 5) return paletteDeepAbyss(t);
    if (paletteId == 6) return paletteTropicalSea(t);
    return paletteDeepOcean(t);
}

// Note: We implement dithering by offsetting the hit epsilon using
// interleavedGradientNoise() inside the ray-march loops (no post color dither).

// Primitives provided by includes/sdf-primitives.glsl

// Rotation utilities for fractals (vector versions)
vec3 rotateX(vec3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotateY(vec3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
}

vec3 rotateZ(vec3 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

// Apply all three rotations
vec3 rotate3D(vec3 p, vec3 angles) {
  p = rotateX(p, angles.x);
  p = rotateY(p, angles.y);
  p = rotateZ(p, angles.z);
  return p;
}

// Inverse rotation applying reverse order and negative angles
vec3 rotate3DInv(vec3 p, vec3 angles) {
  p = rotateZ(p, -angles.z);
  p = rotateY(p, -angles.y);
  p = rotateX(p, -angles.x);
  return p;
}

// Shared fractal space transforms and DE/bounds helpers
#include "./includes/space-transforms.glsl"

// Compute texture sampling position based on selected space
vec3 texSamplePos(vec3 p) {
  if (u_texSpaceMode == 0) {
    return p; // world space
  }
  if (u_fractalType == 1) return mgToLocal(p);
  if (u_fractalType == 2) return mbToLocal(p);
  if (u_fractalType == 3) return spToLocal(p);
  if (u_fractalType == 4) return mbxToLocal(p);
  if (u_fractalType == 5) return rotate3D(p, u_rotation) / max(0.2, u_fractalScale);
  if (u_fractalType == 6) return rotate3D(p, u_rotation) / max(0.5, u_worldTile);
  if (u_fractalType == 7) return rotate3D(p - u_decOffset, u_rotation) / max(0.2, u_fractalScale);
  return rotate3D(p, u_rotation) / max(0.2, u_fractalScale);
}

// Evaluate procedural textures: returns color factor, bump delta to add to normal, and specular scale
void evalProceduralTextures(vec3 pt, vec3 n, out float colorFactor, out vec3 bumpDelta, out float specScaleOut) {
  colorFactor = 1.0;
  bumpDelta = vec3(0.0);
  specScaleOut = 1.0;

  // Detail FBM (color only)
  if (u_worldDetailStrength > 0.0) {
    float dcol = triplanarFbmDetail(pt, n, max(0.05, u_worldDetailScale));
    float scol = clamp(u_worldDetailStrength, 0.0, 1.0);
    colorFactor *= (1.0 + (dcol - 0.5) * 0.6 * scol);
  }

  // Layers A&B
  bool hasA = (u_worldTexType > 0);
  bool hasB = (u_worldTexTypeB > 0);
  // Strengths upfront so we can skip expensive sampling if nothing contributes
  float colA = clamp(u_worldTexColorStrength, 0.0, 1.0);
  float colB = clamp(u_worldTexColorStrengthB, 0.0, 1.0);
  float bA   = clamp(u_worldTexBumpStrength, 0.0, 1.0);
  float bB   = clamp(u_worldTexBumpStrengthB, 0.0, 1.0);
  float sPA  = clamp(u_worldTexSpecStrength, 0.0, 1.0);
  float sPB  = clamp(u_worldTexSpecStrengthB, 0.0, 1.0);

  if (!(hasA || hasB)) return; // no layers selected
  if ((colA + colB + bA + bB + sPA + sPB) <= 0.0) return; // all contributions disabled

  float sA = max(0.05, u_worldTexScale);
  float sB = max(0.05, u_worldTexScaleB);
  float texA = hasA ? worldTextureValue(pt, n, sA, u_worldTexType) : 0.0;
  float texB = hasB ? worldTextureValue(pt, n, sB, u_worldTexTypeB) : 0.0;
  if (hasA || hasB) {
    float alphaC = clamp(u_worldTexBlendAlphaColor, 0.0, 1.0);
    float alphaN = clamp(u_worldTexBlendAlphaBump, 0.0, 1.0);
    float alphaS = clamp(u_worldTexBlendAlphaSpec, 0.0, 1.0);

    // Per-attribute tex mix and weights
    float texMixC, texMixS;
    float wAc=0.0, wBc=0.0, wAn=0.0, wBn=0.0, wAs=0.0, wBs=0.0;
    if (u_worldTexBlendMode == 1) {
      // Multiply
      texMixC = texA * (hasB ? texB : 1.0);
      texMixS = texMixC;
      wAc = (hasB ? texB : 1.0); wBc = texA;
      wAn = wAc; wBn = wBc;
      wAs = wAc; wBs = wBc;
    } else if (u_worldTexBlendMode == 2) {
      // Add
      texMixC = clamp(texA + (hasB ? texB : 0.0), 0.0, 1.0);
      texMixS = texMixC;
      wAc = 1.0; wBc = 1.0;
      wAn = 1.0; wBn = 1.0;
      wAs = 1.0; wBs = 1.0;
    } else {
      // Mix (separate alphas)
      texMixC = mix(texA, (hasB ? texB : texA), alphaC);
      texMixS = mix(texA, (hasB ? texB : texA), alphaS);
      wAc = 1.0 - (hasB ? alphaC : 0.0);
      wBc = (hasB ? alphaC : 0.0);
      wAn = 1.0 - (hasB ? alphaN : 0.0);
      wBn = (hasB ? alphaN : 0.0);
      wAs = 1.0 - (hasB ? alphaS : 0.0);
      wBs = (hasB ? alphaS : 0.0);
    }

    // Color factor with stronger, linear response to strength
    float colW = (u_worldTexBlendMode == 0) ? mix(colA, colB, (hasB ? alphaC : 0.0)) : clamp(colA + (hasB ? colB : 0.0), 0.0, 1.0);
    colorFactor *= (1.0 + (texMixC - 0.5) * 1.0 * colW);

    // Bump strength blended by mode (pre-calc to allow gradient skip)
    float bump = (u_worldTexBlendMode == 0) ? mix(bA, bB, (hasB ? alphaN : 0.0)) : clamp(bA + (hasB ? bB : 0.0), 0.0, 1.0);
    // Derivative-driven attenuation (LOD + optional extra fade)
    float sMax = max(sA, sB);
    vec2 ux_ = pt.yz * sMax; vec2 uy_ = pt.zx * sMax; vec2 uz_ = pt.xy * sMax;
    float fw_ = max(max(length(fwidth(ux_)), length(fwidth(uy_))), length(fwidth(uz_)));
    float lodGrad_ = (u_texLODEnabled ? smoothstep(0.6, 2.0, fw_) : 0.0);
    float bumpL = mix(1.0, clamp(u_texLODBumpFactor, 0.0, 1.0), lodGrad_);
    bump *= bumpL;
    if (u_texBumpDerivFade > 0.0) bump *= (1.0 - clamp(u_texBumpDerivFade, 0.0, 1.0) * lodGrad_);
    // Roughness fade based on normal derivatives
    if (u_texRoughFadeK > 0.0) {
      float rough = length(fwidth(n));
      float rf = clamp(rough * u_texRoughFadeK, 0.0, 1.0);
      bump *= (1.0 - rf);
    }
    // Auto attenuation by large scales
    if (u_worldTexAutoAtten) {
      float bigS = max(u_worldTexScale, u_worldTexScaleB);
      float att = 1.0 - smoothstep(18.0, 36.0, bigS) * clamp(u_worldTexAAStrength, 0.0, 1.0);
      bump *= att;
    }
    // Optional distance-based fade for bump/spec on fractal surfaces
    float distFade = 1.0;
    if (u_texFadeFar > u_texFadeNear) {
      float d = length(pt - u_cameraPos);
      distFade = 1.0 - smoothstep(u_texFadeNear, u_texFadeFar, d);
    }
    bump *= distFade;

    // Only compute gradient if bump contributes meaningfully after fades
    if (bump > 0.001) {
      float epsB = 0.01;
      vec3 gx = vec3(epsB,0,0), gy = vec3(0,epsB,0), gz = vec3(0,0,epsB);
      vec3 gradT = vec3(0.0);
      if (u_texFastBump) {
        float effA = (hasA ? (wAn * bA) : 0.0);
        float effB = (hasB ? (wBn * bB) : 0.0);
        bool useA = (effA >= effB);
        float t0 = useA ? texA : texB;
        int   tType = useA ? u_worldTexType : u_worldTexTypeB;
        float sc   = useA ? sA : sB;
        vec3 g = vec3(
          worldTextureValue(pt + gx, n, sc, tType) - t0,
          worldTextureValue(pt + gy, n, sc, tType) - t0,
          worldTextureValue(pt + gz, n, sc, tType) - t0
        ) / epsB;
        gradT = useA ? (g * wAn) : (g * wBn);
      } else {
        vec3 gradA = vec3(0.0), gradB = vec3(0.0);
        if (hasA && (wAn * bA) > 1e-5) {
          float t0 = texA;
          gradA = vec3(
            worldTextureValue(pt + gx, n, sA, u_worldTexType) - t0,
            worldTextureValue(pt + gy, n, sA, u_worldTexType) - t0,
            worldTextureValue(pt + gz, n, sA, u_worldTexType) - t0
          ) / epsB;
        }
        if (hasB && (wBn * bB) > 1e-5) {
          float t1 = texB;
          gradB = vec3(
            worldTextureValue(pt + gx, n, sB, u_worldTexTypeB) - t1,
            worldTextureValue(pt + gy, n, sB, u_worldTexTypeB) - t1,
            worldTextureValue(pt + gz, n, sB, u_worldTexTypeB) - t1
          ) / epsB;
        }
        gradT = gradA * wAn + gradB * wBn;
      }
      gradT -= n * dot(gradT, n);
      bumpDelta = gradT * (0.4 * bump);
    }

    // Specular scale modulation with blended strength
    float sp = (u_worldTexBlendMode == 0) ? mix(sPA, sPB, (hasB ? alphaS : 0.0)) : clamp(sPA + (hasB ? sPB : 0.0), 0.0, 1.0);
    if (u_texLODEnabled) {
      float sMax2 = max(sA, sB);
      vec2 ux2 = pt.yz * sMax2; vec2 uy2 = pt.zx * sMax2; vec2 uz2 = pt.xy * sMax2;
      float fw2 = max(max(length(fwidth(ux2)), length(fwidth(uy2))), length(fwidth(uz2)));
      float lodGrad2 = smoothstep(0.6, 2.0, fw2);
      float specL = mix(1.0, clamp(u_texLODSpecFactor, 0.0, 1.0), lodGrad2);
      sp *= specL;
      if (u_texSpecDerivFade > 0.0) sp *= (1.0 - clamp(u_texSpecDerivFade, 0.0, 1.0) * lodGrad2);
    }
    if (u_worldTexAutoAtten) {
      float bigS2 = max(u_worldTexScale, u_worldTexScaleB);
      float att2 = 1.0 - smoothstep(18.0, 36.0, bigS2) * clamp(u_worldTexAAStrength, 0.0, 1.0);
      sp *= att2;
    }
    // Apply optional distance fade to spec modulation as well
    sp *= distFade;
    specScaleOut = 1.0 + (texMixS - 0.5) * 0.6 * sp;
  }
}

// Menger provided by includes/sdf-menger.glsl

// Mandelbulb provided by includes/sdf-mandelbulb.glsl

// Mandelbulb with orbit trap
vec2 sdMandelbulbWithTrap(vec3 p, int iterations, float power) {
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  float orbitTrap = 1000.0; // Track minimum orbit value
  int iterCount = 0; // Count actual iterations

  for(int i = 0; i < 20; i++) {
    if(i >= iterations) break;

    r = length(z);

    // Use multiple orbit traps for more interesting coloring
    // Each trap measures distance to a different geometric feature
    float trap1 = abs(z.x);              // Distance to YZ plane
    float trap2 = abs(z.y);              // Distance to XZ plane
    float trap3 = abs(z.z);              // Distance to XY plane
    float trap4 = length(z.xy);          // Distance to Z axis
    float trap5 = abs(z.x - z.y);        // Distance to x=y diagonal

    // Take minimum of all traps for this iteration
    float minTrap = min(min(min(trap1, trap2), min(trap3, trap4)), trap5);

    // Track overall minimum across all iterations
    orbitTrap = min(orbitTrap, minTrap);
    iterCount++;

    if(r > 2.0) break;

    float theta = acos(z.z / r);
    float phi = atan(z.y, z.x);

    dr = pow(r, power - 1.0) * power * dr + 1.0;

    float zr = pow(r, power);
    theta = theta * power;
    phi = phi * power;

    z = zr * vec3(
      sin(theta) * cos(phi),
      sin(phi) * sin(theta),
      cos(theta)
    );
    z += p;
  }

  // If orbit trap wasn't set (ray escaped early), use surface position as fallback
  if (orbitTrap > 100.0 || iterCount < 2) {
    // Use initial position's geometric features for coloring
    orbitTrap = min(min(abs(p.x), abs(p.y)), abs(p.z));
  }

  r = max(r, 1e-6); // prevent log(0)
  return vec2(0.5 * log(r) * r / dr, orbitTrap);
}

// Sierpinski provided by includes/sdf-sierpinski.glsl

// Mandelbox provided by includes/sdf-mandelbox.glsl

// SDF operations provided by includes/sdf-operations.glsl

// Base scene distance without any bounds culling
float mapRaw(vec3 p) {
  float fractal = MAX_DIST;
  switch (u_fractalType) {
    case FT_PRIMITIVES: {
      vec3 spherePos = vec3(sin(u_time * 0.75) * 2.0, 0.0, 0.0);
      float sphere = sdSphere(p - spherePos, 1.0);
      vec3 boxPos = vec3(0.0, 0.0, 0.0);
      float box = sdBox(rotate3D(p - boxPos, u_rotation), vec3(0.8, 0.8, 0.8));
      fractal = opSubtraction(box, sphere);
    } break;
    case FT_MENGER: { fractal = deMengerWorld(p); } break;
    case FT_BULB: { fractal = deMandelbulbWorld(p); } break;
    case FT_SIERPINSKI: { fractal = deSierpinskiWorld(p); } break;
    case FT_MANDELBOX: { fractal = deMandelboxWorld(p); } break;
    case FT_WORLD: { float trapDummy; fractal = deAmazingSurfWorld(p, trapDummy); } break;
    case FT_TRUCHET: { float trapDummy; fractal = deTruchetPipesWorld(p, trapDummy); } break;
    case FT_DEC: {
      float s = max(0.2, u_fractalScale);
      vec3 pl = rotate3D(p - u_decOffset, u_rotation) / s;
      float d = decUserDE(pl) * s;
      fractal = d;
    } break;
  }

  // Note: do NOT modify the SDF here; clipping at the SDF level introduces
  // visible artifacts where fractal walls meet the floor. We handle occlusion
  // in the marching phase (early plane takeover) and at shading time.

  // IMPORTANT: Do not union the ground plane into the primary SDF. We shade
  // the plane via the explicit miss path to avoid a cusp seam where the
  // union(min) flips between surfaces. Returning only the fractal distance
  // here eliminates the black gasket at the contact.
  return fractal;
}

// Shadow map: allow simplified, conservative SDF for shadow rays on Truchet
float mapShadow(vec3 p) {
  if (u_fractalType == FT_TRUCHET && u_fastShadows) {
    float trapDummy;
    return deTruchetPipesWorldShadow(p, trapDummy);
  }
  return mapRaw(p);
}

// AO map: reuse shadow map for Truchet when fastAO is enabled (conservative)
float mapAO(vec3 p) {
  if (u_fractalType == FT_TRUCHET && u_fastAO) {
    return mapShadow(p);
  }
  return mapRaw(p);
}

// Primary-ray map with optional bounds culling
float mapCulled(vec3 p) {
  if (u_enableBoundsCulling) {
    if (u_fractalType == FT_DEC || (u_fractalType == FT_WORLD && u_worldUseDEC)) {
      // Skip bounds culling for DEC preview (unknown bounds)
      return mapRaw(p);
    }
    float bounds = (u_fractalType == 0) ? (length(p) - 4.0) : boundsDistanceWorld(p);
    if (bounds > u_boundsCullMargin) {
      return bounds;
    }
  }
  return mapRaw(p);
}

// Backwards-compatible wrappers
float map(vec3 p) { return mapCulled(p); }

// Scene map with orbit trap information - returns (distance, orbitTrap)
// Raw mapWithTrap without culling
vec2 mapWithTrapRaw(vec3 p) {
  float fractal = MAX_DIST;
  float orbitTrap = 0.0;

  switch (u_fractalType) {
    case FT_PRIMITIVES: {
      vec3 spherePos = vec3(sin(u_time * 0.75) * 2.0, 0.0, 0.0);
      float sphere = sdSphere(p - spherePos, 1.0);
      vec3 boxPos = vec3(0.0, 0.0, 0.0);
      float box = sdBox(rotate3D(p - boxPos, u_rotation), vec3(0.8, 0.8, 0.8));
      fractal = opSubtraction(box, sphere);
      orbitTrap = length(p);
    } break;
    case FT_MENGER: {
      fractal = deMengerWorld(p);
      vec3 fp = mgToLocal(p);
      orbitTrap = orbitTrapBoxy(fp);
    } break;
    case FT_BULB: {
      vec2 result = deMandelbulbWorldWithTrap(p);
      fractal = result.x; orbitTrap = result.y;
    } break;
    case FT_SIERPINSKI: {
      fractal = deSierpinskiWorld(p);
      vec3 fp = spToLocal(p);
      orbitTrap = orbitTrapBoxy(fp);
    } break;
    case FT_MANDELBOX: {
      fractal = deMandelboxWorld(p);
      vec3 fpl = mbxToLocal(p);
      orbitTrap = orbitTrapBoxy(fpl);
    } break;
    case FT_WORLD: {
      float trap; float d = deAmazingSurfWorld(p, trap);
      fractal = d; orbitTrap = trap;
    } break;
    case FT_TRUCHET: {
      float trapT; float d = deTruchetPipesWorld(p, trapT);
      fractal = d; orbitTrap = trapT;
    } break;
    case FT_DEC: {
      float s = max(0.2, u_fractalScale);
      vec3 pl = rotate3D(p - u_decOffset, u_rotation) / s;
      float d = decUserDE(pl) * s;
      // Generic orbit trap for DEC: boxy + radial blend (reuse boxy helper)
      float trapBox = orbitTrapBoxy(pl);
      float trapRad = length(pl) * 0.5;
      orbitTrap = mix(trapBox, trapRad, 0.35);
      fractal = d;
    } break;
  }

  // Return fractal only; floor is shaded via miss path to avoid union seam.
  return vec2(fractal, orbitTrap);
}

// mapWithTrap with optional bounds culling for primary rays
vec2 mapWithTrapCulled(vec3 p) {
  if (u_enableBoundsCulling) {
    if (u_fractalType == 3 || u_fractalType == 4 || u_fractalType == 5 || u_fractalType == 6 || u_fractalType == FT_DEC) {
      return mapWithTrapRaw(p);
    }
    float bounds;
    if (u_fractalType == 0) {
      bounds = length(p) - 4.0;
    } else {
      bounds = boundsDistanceWorld(p);
    }
    if (bounds > u_boundsCullMargin) {
      return vec2(bounds, 0.0);
    }
  }
  return mapWithTrapRaw(p);
}

// Backwards-compatible wrapper
vec2 mapWithTrap(vec3 p) { return mapWithTrapCulled(p); }

// Basic calcNormal exists in includes if needed; we use enhanced variant below

// Enhanced normal calculation with adaptive epsilon support
vec3 calcNormalCore(vec3 p, float epsilon, bool fractalOnly) {
  const vec2 k = vec2(1.0, -1.0);
  vec3 s1 = p + k.xyy * epsilon;
  vec3 s2 = p + k.yyx * epsilon;
  vec3 s3 = p + k.yxy * epsilon;
  vec3 s4 = p + k.xxx * epsilon;
  float m1 = fractalOnly ? mapFractalOnly(s1) : mapRaw(s1);
  float m2 = fractalOnly ? mapFractalOnly(s2) : mapRaw(s2);
  float m3 = fractalOnly ? mapFractalOnly(s3) : mapRaw(s3);
  float m4 = fractalOnly ? mapFractalOnly(s4) : mapRaw(s4);
  vec3 n = k.xyy * m1 + k.yyx * m2 + k.yxy * m3 + k.xxx * m4;
  return normalize(n);
}

vec3 calcNormalEnhanced(vec3 p, float epsilon) {
  return calcNormalCore(p, epsilon, false);
}

// Wrapper using default epsilon for backward compatibility
vec3 calcNormalEnhanced(vec3 p) {
  return calcNormalEnhanced(p, u_normalEpsilon);
}

// Normal using fractal-only map (ignores union with ground plane)
vec3 calcNormalEnhancedFractal(vec3 p, float epsilon) {
  return calcNormalCore(p, epsilon, true);
}

// Fast forward-difference normal (3 taps)
vec3 calcNormalFast(vec3 p, float epsilon) {
  float f0 = mapRaw(p);
  float dx = mapRaw(p + vec3(epsilon, 0.0, 0.0)) - f0;
  float dy = mapRaw(p + vec3(0.0, epsilon, 0.0)) - f0;
  float dz = mapRaw(p + vec3(0.0, 0.0, epsilon)) - f0;
  return normalize(vec3(dx, dy, dz));
}

// Ambient occlusion - adds subtle shading variation in concave areas
// This naturally reduces banding by adding soft shadow detail
float calcAOAdvanced(vec3 p, vec3 normal) {
  // Distance-aware AO budgeting (separate toggle)
  float viewDistance = length(p - u_cameraPos);
  int samples = max(1, u_aoMaxSamples); // near-camera budget (tunable)
  if (u_enableBudgetLOD) {
    float lodFactor = smoothstep(u_lodNear, u_lodFar, viewDistance);
    float s = mix(5.0, float(u_aoMinSamples), lodFactor);
    samples = max(1, int(floor(s + 0.5)));
  }
  // Truchet-specific AO cap: the dense tubular geometry produces similar
  // visual result with slightly fewer samples. Gate more aggressively by distance.
  if (u_fractalType == FT_TRUCHET) {
    float k = 0.85 - 0.25 * smoothstep(u_lodNear * 0.6, u_lodFar, viewDistance);
    samples = max(1, int(floor(float(samples) * k + 0.5)));
  }

  float occ = 0.0;
  float sca = 1.0;
  const int MAX_AO_SAMPLES = 8;
  float occExit = (u_fractalType == FT_TRUCHET && u_fastAO) ? 0.55 : 0.65;
  for(int i = 0; i < MAX_AO_SAMPLES; i++) {
    if (i >= samples) break;
    float t = float(i) / max(1.0, float(samples - 1));
    float spread = u_enableBudgetLOD ? mix(1.0, 1.4, smoothstep(u_lodNear, u_lodFar, viewDistance)) : 1.0;
    float h = (0.02 + 0.15 * t) * spread;
    float d = mapAO(p + h * normal);
    // Robustness: avoid AO banding from invalid/near-plane samples
    if (isnan(d) || isinf(d)) d = h; // neutral sample
    // When the ground plane is in the union, its distance can dominate
    // and cause staircase patterns. Clamp to a small multiple of h.
    d = clamp(d, -h, h * 4.0);
    occ += (h - d) * sca;
    sca *= 0.95;
    // Early-exit once occlusion saturates (saves ~1-2 taps/pixel typically)
    if (occ > occExit) break;
  }
  float ao = clamp(1.0 - 1.5 * occ, 0.0, 1.0);
  return ao;
}

// Soft shadow - check if point can see the light
float calcSoftShadowBudgeted(vec3 ro, vec3 rd, vec3 n0, float mint, float maxt) {
  // Skip expensive far shadows when budget LOD is enabled
  if (u_enableBudgetLOD && maxt > (u_lodFar * u_farShadowSkipFactor)) {
    return 1.0;
  }

  // Distance-aware step budget
  int stepsBudget = u_softShadowSteps;
  if (u_enableBudgetLOD) {
    float lodFactor = smoothstep(u_lodNear, u_lodFar, maxt);
    float dyn = mix(float(u_softShadowSteps), max(float(u_softShadowMinSteps), float(u_softShadowSteps) * 0.4), lodFactor);
    stepsBudget = int(floor(dyn));
  }
  // Truchet-specific shadow gating: reduce steps for grazing/backfacing lighting
  if (u_fractalType == FT_TRUCHET) {
    float nDotL = max(0.0, dot(n0, rd));
    float k = mix(0.45, 1.0, smoothstep(0.10, 0.60, nDotL));
    stepsBudget = max(int(floor(float(stepsBudget) * k + 0.5)), u_softShadowMinSteps);
  }

  float res = 1.0;
  float t = mint;
  // Small per-pixel jitter to break banding. Attenuate by grazing angle so
  // wide, front-lit surfaces don't show visible grain. This keeps dithering
  // effective only where banding is most likely (near tangents and penumbrae).
  float graze = 1.0 - max(0.0, dot(n0, rd));
  float angleAtten = smoothstep(0.2, 0.85, graze); // 0=head-on, 1=grazing
  if (u_enableDithering) {
    float j = u_useBlueNoise ? blueNoiseHash(gl_FragCoord.xy) : interleavedGradientNoise(gl_FragCoord.xy);
    t += (j - 0.5) * 0.01 * clamp(u_ditheringStrength * angleAtten, 0.0, 1.0);
  }
  if (u_shadowDitherStrength > 0.0) {
    float j2 = fract(sin(dot(gl_FragCoord.xy, vec2(127.1,311.7))) * 43758.5453);
    t += (j2 - 0.5) * 0.02 * clamp(u_shadowDitherStrength * angleAtten, 0.0, 1.0);
  }
  const int MAX_SOFT_STEPS = 64;
  for(int i = 0; i < MAX_SOFT_STEPS; i++) {
    if(i >= stepsBudget) break;
    vec3 sp = ro + rd * t;
    float h = mapShadow(sp);
    // Guard against invalid distances which can cause streaking.
    // If an invalid value appears, fall back to a tiny step instead
    // of returning full shadow. This avoids camera-centered bands.
    if (isnan(h) || isinf(h)) {
      h = 0.02;
    }
    // Apply a small, distance-aware bias to avoid self-shadowing bands
    float angleBias = u_shadowBiasAngle * (1.0 - max(0.0, dot(n0, rd)));
    // Slightly higher base bias on Truchet to avoid sleeve banding
    if (u_fractalType == FT_TRUCHET) {
      angleBias += 0.0003;
    }
    float bias = u_shadowBiasBase + u_shadowBiasSlope * t + angleBias;
    h = max(h, bias);

    // Plane-aware clamp to avoid self-shadow bands on the ground plane
    if (u_floorEnabled) {
      float dGround = sdPlaneXZ(sp + vec3(0.0, 2.0, 0.0));
      if (abs(dGround) < u_shadowPlaneBias * 4.0) {
        h = max(h, u_shadowPlaneBias + 0.5 * u_shadowBiasSlope * t);
      }
    }
    // u_shadowSharpness controls penumbra softness
    // Use smooth mapping to reduce discrete step banding
    float c = u_shadowSharpness * h / max(t, 0.001);
    c = 1.0 - exp(-max(0.0, c));
    res = min(res, c);
    // Additional guard: close to the ground plane, avoid fully black penumbrae
    if (u_floorEnabled) {
      float dG2 = sdPlaneXZ(sp + vec3(0.0, 2.0, 0.0));
      float ease2 = 1.0 - smoothstep(u_shadowPlaneBias * 0.5, u_shadowPlaneBias * 2.5, abs(dG2));
      // Lift minimum shadow slightly when hugging the plane
      res = max(res, mix(0.0, 0.35, ease2));
    }
    float stepClamp = (u_shadowStepClamp > 0.0 ? u_shadowStepClamp : (u_enableBudgetLOD ? 0.2 : 0.15));
    // Increase the minimum step gradually with distance to avoid
    // equidistant sampling bands near the camera on large planes.
    float minStep = 0.005 + 0.01 * smoothstep(0.0, maxt, t);
    t += clamp(h, minStep, stepClamp);
    if (u_shadowEarlyExit > 0.0 && res < u_shadowEarlyExit) break;
    if(h < 0.001 || t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}

// Get ray direction
vec3 getRayDirectionRobust(vec2 uv, vec3 ro, vec3 target, float fov) {
  vec3 forward = normalize(target - ro);
  // Start from CPU-provided basis (camera space), then orthonormalize
  vec3 right = normalize(u_camRight);
  // Remove any component along forward to prevent skew
  right = normalize(right - forward * dot(right, forward));
  vec3 up = normalize(cross(right, forward));

  float fovScale = tan(fov * 0.5 * PI / 180.0);
  vec3 rd = normalize(forward + fovScale * (uv.x * right + uv.y * up));
  return rd;
}

// Get adaptive epsilon based on distance (for LOD)
float getAdaptiveEpsilon(float distance) {
  // Base epsilon; make Sierpinski crisper by using a smaller base and by
  // accounting for current scale (smaller scale → smaller epsilon).
  float base = MIN_DIST;
  if (u_fractalType == 3) {
    base *= 0.25; // 4x finer threshold for small features
    base /= max(u_fractalScale, 1.0); // scale up → features larger; scale down → finer epsilon
  }
  if (!u_enableDistanceLOD) {
    return base;
  }
  float lodFactor = smoothstep(u_lodNear, u_lodFar, distance);
  return base * (1.0 + lodFactor * 1.0);
}

// Distance-aware cap for ray-march iteration count
int getAdaptiveMaxSteps(float distance) {
  int baseSteps = u_maxSteps;
  if (!u_enableBudgetLOD) return baseSteps;
  // Reduce step budget as distance increases; keep at least 16
  float lodFactor = smoothstep(u_lodNear, u_lodFar, distance);
  float farSteps = max(16.0, float(baseSteps) * clamp(u_budgetStepsFarFactor, 0.1, 1.0));
  float dynSteps = mix(float(baseSteps), farSteps, lodFactor);
  return int(floor(dynSteps));
}

// Get adaptive relaxation factor based on distance
// Pure distance-based adaptive relaxation for performance and correctness
// Note: Previous curvature calculation using fwidth(normal) was incorrect - it computed
// the rate of change of normals across screen pixels, not actual SDF curvature.
// True SDF curvature requires second derivatives which are expensive to compute.
float getAdaptiveRelaxation(float distance, vec3 normal) {
  if (!u_adaptiveRelaxation) {
    return u_stepRelaxation; // Use fixed relaxation
  }

  // Use distance-based relaxation: larger steps far away, smaller steps close to surfaces
  float distanceFactor = smoothstep(u_lodNear, u_lodFar, distance);
  return mix(u_relaxationMin, u_relaxationMax, distanceFactor);
}

// Ray march with advanced adaptive step sizing
vec3 rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  float prevT = 0.0;
  float curvFactor = 1.0; // cached curvature factor (1=flat)
  float prevD = -1.0;

  for (int i = 0; i < 300; i++) {
    int maxStepsDynamic = getAdaptiveMaxSteps(t);
    if (i >= maxStepsDynamic) break;

    vec3 p = ro + rd * t;
    float d = mapCulled(p);

    // Adaptive epsilon based on distance
    float adaptiveEpsilon = getAdaptiveEpsilon(t);
    float ditherOffset = ditherNearSurface(d, adaptiveEpsilon);

    // Check for hit with dithered threshold (no plane-specific bias)
    float hitThreshold = adaptiveEpsilon * (u_conservativeHits ? 0.75 : 1.0) + ditherOffset * (u_conservativeHits ? 0.5 : 1.0);
    if (d < hitThreshold) {
      // Refine hit
      float b = t;
      float a = prevT;
      float tHit = b;
      {
        int refine = u_conservativeHits ? 12 : 8;
        if (u_fractalType == FT_WORLD || u_fractalType == FT_TRUCHET) refine += 2;
        for (int r = 0; r < 16; r++) {
          if (r >= refine) break;
          float m = 0.5 * (a + b);
          float dm = mapFractalOnly(ro + rd * m);
          if (dm > adaptiveEpsilon) a = m; else b = m;
        }
        tHit = b;
      }
      return vec3(tHit, float(i), 1.0); // hit
    }

    if (t > MAX_DIST) {
      break;
    }

    // Adaptive relaxation factor (distance and/or curvature)
    float omega = u_stepRelaxation;

    // Curvature-aware relaxation (ray-space, smoothed)
    if (u_curvatureAwareRelaxation) {
      bool applyCurv = true;
      if (u_curvatureNearOnly) {
        float epsN = getAdaptiveEpsilon(t);
        applyCurv = (d < epsN * max(1.0, u_curvatureNearK));
      }
      if (applyCurv && prevD >= 0.0) {
        float denom = max(max(d, prevD), 0.0005);
        float kRel = abs(d - prevD) / denom; // change in SDF along ray
        float curvSample = clamp(kRel * 6.0, 0.0, 1.0); // scale factor tuned empirically
        float target = 1.0 - curvSample; // 1 = flat, 0 = high curvature
        curvFactor = mix(curvFactor, target, 0.25); // EMA smoothing to avoid rings
      }
    }
    if (u_adaptiveRelaxation && u_curvatureAwareRelaxation) {
      // Combine curvature (dominant) with distance (tempered)
      float distanceFactor = smoothstep(u_lodNear, u_lodFar, t);
      float factor = curvFactor * 0.7 + distanceFactor * 0.3;
      float dyn = mix(u_relaxationMin, u_relaxationMax, factor);
      omega = u_stepRelaxation * dyn;
    } else if (u_adaptiveRelaxation) {
      // Distance-only
      float distanceFactor = smoothstep(u_lodNear, u_lodFar, t);
      float dyn = mix(u_relaxationMin, u_relaxationMax, distanceFactor);
      omega = u_stepRelaxation * dyn;
    } else if (u_curvatureAwareRelaxation) {
    // Curvature-only mode (adaptive distance off)
      float dyn = mix(u_relaxationMin, u_relaxationMax, curvFactor);
      omega = u_stepRelaxation * dyn;
    }
  // Safety: clamp over-relaxation near surfaces (plane/fractal) to avoid halos
  {
    float adaptiveEpsilon = getAdaptiveEpsilon(t);
    // Start damping earlier and cap slightly below 1.0
    float near = smoothstep(adaptiveEpsilon * 2.0, adaptiveEpsilon * 12.0, d);
    float omegaCap = (u_fractalType == FT_TRUCHET ? 0.94 : 0.92);
    float omegaSafe = min(omega, omegaCap);
    omega = mix(omegaSafe, omega, near);
  }

    // Step forward with adaptive relaxation and safety
    float stepLen = d * omega;
    // Auto integrator: cap step by segment fraction beyond switch distance
    if (u_integratorAuto && t > u_integratorSwitchDist) {
      float remaining = MAX_DIST - t;
      float frac = clamp(u_segmentFraction, 0.1, 0.9);
      stepLen = min(stepLen, remaining * frac);
    }
    float safety = clamp(u_stepSafety, 0.5, 1.0);
    if (u_stepSafetyAuto) {
      float safetyCurv = mix(u_stepSafetyMin, u_stepSafetyMax, curvFactor);
      float w = 1.0 - smoothstep(u_stepSafetyBandNear, u_stepSafetyBandFar, t);
      float safetyDist = mix(u_stepSafetyMax, u_stepSafetyMin, w);
      safety = min(safety, min(safetyCurv, safetyDist));
    }
    prevT = t;
    prevD = d;
    t += stepLen * safety;
  }

  return vec3(t, 0.0, 0.0); // miss
}

// Ray march with orbit trap tracking - returns (distance, steps, hit, orbitTrap)
vec4 rayMarchWithTrap(vec3 ro, vec3 rd) {
  float t = 0.0;
  float prevT = 0.0;
  float orbitTrap = 0.0;
  float curvFactor = 1.0;
  float prevD = -1.0;

  for (int i = 0; i < 300; i++) {
    int maxStepsDynamic = getAdaptiveMaxSteps(t);
    if (i >= maxStepsDynamic) break;

    vec3 p = ro + rd * t;
    vec2 result = mapWithTrapCulled(p);
    float d = result.x;

    float adaptiveEpsilon = getAdaptiveEpsilon(t);
    float ditherOffset = ditherNearSurface(d, adaptiveEpsilon);

    // (removed) floor hard clip during marching — visibility handled post‑refine

    // Check for hit with dithered threshold (no plane-specific bias)
    float hitThresholdS = adaptiveEpsilon * (u_conservativeHits ? 0.75 : 1.0) + ditherOffset * (u_conservativeHits ? 0.5 : 1.0);
    if (d < hitThresholdS) {
      // Only use orbit trap from the final hit point, not minimum along ray
      orbitTrap = result.y;
      float a = prevT;
      float b = t;
      int refineS = u_conservativeHits ? 12 : 8;
      if (u_fractalType == FT_WORLD || u_fractalType == FT_TRUCHET) refineS += 2;
      for (int r = 0; r < 16; r++) {
        if (r >= refineS) break;
        float m = 0.5 * (a + b);
        float dm = mapFractalOnly(ro + rd * m);
        if (dm > adaptiveEpsilon) a = m; else b = m;
      }
      return vec4(b, float(i), 1.0, orbitTrap); // hit with orbit trap
    }

    if (t > MAX_DIST) {
      break;
    }

    // Adaptive relaxation (distance and/or curvature)
    float omega = u_stepRelaxation;
    bool autoPast = (u_integratorAuto && t > u_integratorSwitchDist);

    if (u_curvatureAwareRelaxation && !autoPast) {
      bool applyCurv = true;
      if (u_curvatureNearOnly) {
        float epsN = getAdaptiveEpsilon(t);
        applyCurv = (d < epsN * max(1.0, u_curvatureNearK));
      }
      if (applyCurv && prevD >= 0.0) {
        float denom = max(max(d, prevD), 0.0005);
        float kRel = abs(d - prevD) / denom;
        float curvSample = clamp(kRel * 6.0, 0.0, 1.0);
        float target = 1.0 - curvSample;
        curvFactor = mix(curvFactor, target, 0.25);
      }
    }

    if (!autoPast && u_adaptiveRelaxation && u_curvatureAwareRelaxation) {
      float distanceFactor = smoothstep(u_lodNear, u_lodFar, t);
      float factor = curvFactor * 0.7 + distanceFactor * 0.3;
      float dyn = mix(u_relaxationMin, u_relaxationMax, factor);
      omega = u_stepRelaxation * dyn;
    } else if (!autoPast && u_adaptiveRelaxation) {
      float distanceFactor = smoothstep(u_lodNear, u_lodFar, t);
      float dyn = mix(u_relaxationMin, u_relaxationMax, distanceFactor);
      omega = u_stepRelaxation * dyn;
    } else if (!autoPast && u_curvatureAwareRelaxation) {
      float dyn = mix(u_relaxationMin, u_relaxationMax, curvFactor);
      omega = u_stepRelaxation * dyn;
    }
    // Safety clamp near surface (same parameters as above integrator)
    {
      float adaptiveEpsilon = getAdaptiveEpsilon(t);
      float near = smoothstep(adaptiveEpsilon * 2.0, adaptiveEpsilon * 12.0, d);
      float omegaSafe = min(omega, 0.92);
      omega = mix(omegaSafe, omega, near);
    }

    // Step with safety (apply auto integrator cap beyond switch distance)
    float stepLenS = d * omega;
    if (autoPast) {
      float remainingS = MAX_DIST - t;
      float fracS = clamp(u_segmentFraction, 0.1, 0.9);
      stepLenS = remainingS * fracS;
    }
    float safetyS = clamp(u_stepSafety, 0.5, 1.0);
    if (u_stepSafetyAuto) {
      float safetyCurvS = mix(u_stepSafetyMin, u_stepSafetyMax, curvFactor);
      float wS = 1.0 - smoothstep(u_stepSafetyBandNear, u_stepSafetyBandFar, t);
      float safetyDistS = mix(u_stepSafetyMax, u_stepSafetyMin, wS);
      safetyS = min(safetyS, min(safetyCurvS, safetyDistS));
    }
    prevT = t;
    prevD = d;
    t += stepLenS * safetyS;
  }

  return vec4(t, 0.0, 0.0, orbitTrap); // miss
}

// Segment tracing variant with orbit trap tracking (experimental)
// Steps by a fixed fraction of remaining distance to max range
vec4 rayMarchWithTrap_Segment(vec3 ro, vec3 rd) {
  float t = 0.0;
  float orbitTrap = 0.0;
  const float maxDist = MAX_DIST;

  for (int i = 0; i < 300; i++) {
    int maxStepsDynamic = getAdaptiveMaxSteps(t);
    if (i >= maxStepsDynamic) break;

    vec3 p = ro + rd * t;
    vec2 result = mapWithTrap(p);
    float d = result.x;

    float adaptiveEpsilon = getAdaptiveEpsilon(t);
    float ditherOffset = ditherNearSurface(d, adaptiveEpsilon);

    if (d < adaptiveEpsilon + ditherOffset) {
      orbitTrap = result.y;
      return vec4(t, float(i), 1.0, orbitTrap);
    }

    if (t > maxDist) break;

    float remaining = maxDist - t;
    float frac = clamp(u_segmentFraction, 0.1, 0.9);
    // World types tend to alias with large segment steps on thin shells
    // Apply conservative clamps when active
    if (u_fractalType == 5 || u_fractalType == 6) {
      frac = min(frac, 0.45);
    }
    float stepSeg = min(d, remaining * frac);
    if (u_fractalType == 5 || u_fractalType == 6) {
      // Global clamp on DE step and extra near-surface shrink
      float clampK = clamp(u_worldSegClamp, 0.5, 1.0);
      // If shell is thin, tighten segment clamp a bit more
      float thin;
      if (u_fractalType == 5) {
        thin = clamp((0.16 - u_worldThickness) * 6.0, 0.0, 1.0); // 0 at 0.16+, 1 near 0.0
      } else {
        thin = clamp((0.12 - u_truchetRadius) * 8.0, 0.0, 1.0);
      }
      clampK = mix(clampK, min(clampK, 0.70), thin);
      float adaptiveEpsilon = getAdaptiveEpsilon(t);
      float nearFactor = (d < adaptiveEpsilon * 12.0) ? 0.6 : 1.0;
      stepSeg = min(stepSeg, d * clampK * nearFactor);
    }
    float safetySeg = clamp(u_stepSafety, 0.5, 1.0);
    if (u_stepSafetyAuto) {
      // Reuse last curvFactor from sphere path is not available here; estimate via distance only
      float w = 1.0 - smoothstep(u_stepSafetyBandNear, u_stepSafetyBandFar, t);
      float safetyDist = mix(u_stepSafetyMax, u_stepSafetyMin, w);
      safetySeg = min(safetySeg, safetyDist);
    }
    t += stepSeg * safetySeg;
  }

  return vec4(t, 0.0, 0.0, orbitTrap);
}

// Get material color based on fractal type (legacy material mode)
vec3 getMaterialColor(vec3 p) {
  // Use user-selected material color for all fractals
  return u_materialColor;
}

// Get color based on selected color mode
// p = surface point, normal = surface normal, distance = ray travel distance
// orbitTrap = minimum orbit value, steps = ray march steps
vec3 getColor(vec3 p, vec3 normal, float distance, float orbitTrap, float steps) {
  vec3 color;

  if (u_colorMode == 0) {
    // Material mode - use legacy material colors
    color = getMaterialColor(p);
  } else if (u_colorMode == 1) {
    // Orbit trap mode - use modulo to create repeating color bands
    // This ensures variety across the entire surface
    float scaled = orbitTrap * u_orbitTrapScale;

    // Use fract to create repeating 0-1 pattern
    float t = fract(scaled);

    // DEBUG: Show raw orbit trap value as grayscale
    // Uncomment to see what values we're getting:
    // color = vec3(orbitTrap * 10.0); // Multiply by 10 to make visible
    // return color * u_colorIntensity;

    color = getPaletteColor(t, u_paletteId);
  } else if (u_colorMode == 2) {
    // Distance-based mode - use orbit trap scale to control frequency
    float scaled = distance * u_orbitTrapScale * 0.05;
    float t = fract(scaled);
    color = getPaletteColor(t, u_paletteId);
  } else if (u_colorMode == 3) {
    // Normal-based mode (matcap style)
    color = normal * 0.5 + 0.5;
  } else if (u_colorMode == 4) {
    // Texture-based color on fractal: gate by apply-target
    if (!(u_texApplyTarget == 0 || u_texApplyTarget == 2)) {
      color = getMaterialColor(p);
    } else {
      vec3 pt = texSamplePos(p);
      // Recompute the same composite used in evalProceduralTextures
      bool hasA = (u_worldTexType > 0);
      bool hasB = (u_worldTexTypeB > 0);
      float sA = max(0.05, u_worldTexScale);
      float sB = max(0.05, u_worldTexScaleB);
      float texA = hasA ? worldTextureValue(pt, normal, sA, u_worldTexType) : 0.0;
      float texB = hasB ? worldTextureValue(pt, normal, sB, u_worldTexTypeB) : 0.0;
      float alphaC = clamp(u_worldTexBlendAlphaColor, 0.0, 1.0);
      if (u_texLayerColoring && (hasA || hasB)) {
        vec3 colA = hasA ? mix(u_texA_colorBase, u_texA_colorAccent, clamp(texA, 0.0, 1.0)) : vec3(0.0);
        vec3 colB = hasB ? mix(u_texB_colorBase, u_texB_colorAccent, clamp(texB, 0.0, 1.0)) : vec3(0.0);
        if (u_worldTexBlendMode == 1) {
          color = colA * (hasB ? colB : vec3(1.0));
        } else if (u_worldTexBlendMode == 2) {
          color = clamp(colA + (hasB ? colB : vec3(0.0)), 0.0, 1.0);
        } else {
          color = mix(colA, (hasB ? colB : colA), alphaC);
        }
      } else {
        float t;
        if (u_worldTexBlendMode == 1)      t = texA * (hasB ? texB : 1.0);
        else if (u_worldTexBlendMode == 2) t = clamp(texA + (hasB ? texB : 0.0), 0.0, 1.0);
        else                               t = mix(texA, (hasB ? texB : texA), alphaC);
        color = mix(u_texColorBase, u_texColorAccent, clamp(t, 0.0, 1.0));
      }
    }
  } else {
    // Fallback
    color = vec3(0.5);
  }

  // Apply color intensity
  return color * u_colorIntensity;
}

// Debug visualization helpers
vec3 debugColor(vec3 ro, vec3 rd, vec4 result) {
  // Common derived values
  float steps = result.y;
  float t = result.x;
  bool hit = (result.z > 0.5);
  vec3 p = ro + rd * t;

  if (u_debugMode == 1) {
    // Steps count grayscale
    float s = steps / max(1.0, float(u_maxSteps));
    return vec3(s);
  }
  if (u_debugMode == 2) {
    // Travel distance heat (closer brighter)
    float v = 1.0 - exp(-t * 0.2);
    return vec3(v);
  }
  if (u_debugMode == 3) {
    // Orbit trap value mapped to palette
    float trap = result.w;
    float n = clamp(trap * 0.5, 0.0, 1.0);
    return getPaletteColor(n, u_paletteId);
  }
  if (u_debugMode == 4) {
    // Surface normal visualization
    if (hit) {
      // Use the same normal path as main shading
      bool isFloorDbg = false;
      if (u_floorEnabled) {
        float dpl = sdPlaneXZ(p + vec3(0.0, 2.0, 0.0));
        isFloorDbg = (abs(dpl) < MIN_DIST * 2.0);
      }
      vec3 normal;
      if (isFloorDbg) normal = vec3(0.0, 1.0, 0.0);
      else normal = (u_fastNormals ? calcNormalFast(p, u_normalEpsilon) : calcNormalEnhanced(p, u_normalEpsilon));
      return normal * 0.5 + 0.5;
    }
    return vec3(0.0);
  }
  if (u_debugMode == 5) {
    // Absolute map value at hit point (should be near 0)
    float d = hit ? abs(mapRaw(p)) : 0.0;
    float v = smoothstep(0.0, 0.01, d); // black if close to surface
    return vec3(v);
  }

  if (u_debugMode == 6) {
    // Visualize local-space bounds used for culling.
    vec3 q = p;
    if (u_fractalType == 3) {
      q = spToLocal(q);
    } else if (u_fractalType == 1) {
      q = mgToLocal(q);
      float b = sdBox(q, vec3(1.1));
      float mask = 1.0 - smoothstep(0.04, 0.0, abs(b));
      return vec3(mask);
    } else if (u_fractalType == 4) {
      q = mbxToLocal(q);
    } else {
      q = rotate3D(q, u_rotation) / u_fractalScale;
    }
    float mask;
    if (u_fractalType == 4) {
      float b = sdBox(q, vec3(2.2));
      mask = 1.0 - smoothstep(0.04, 0.0, abs(b));
    } else {
      float r = length(q);
      mask = smoothstep(2.4, 2.2, r) * smoothstep(2.0, 2.2, r);
    }
    return vec3(mask);
  }

  if (u_debugMode == 7) {
    // Visualize signed distance to the fractal only (no plane union).
    float d = mapFractalOnly(p);
    // Map small distances to dark, large to bright for visibility
    float v = clamp(d * 0.5 + 0.5, 0.0, 1.0);
    return vec3(v);
  }

  if (u_debugMode == 8) {
    // Probe: show distance to a simple tetra using the same local transform
    vec3 q = p;
    if (u_fractalType == 3) {
      q = spToLocal(q);
    } else {
      q = rotate3D(q, u_rotation) / u_fractalScale;
    }
    float d = sdTetrahedron(q, 1.8);
    float v = 1.0 - smoothstep(0.0, 0.06, abs(d));
    return vec3(v);
  }

  if (u_debugMode == 9) {
    // Local Axes: visualize surface normal in fractal local space
    if (hit) {
      bool isFloorDbg = false;
    if (u_floorEnabled) {
      float dpl = sdPlaneXZ(p + vec3(0.0, 2.0, 0.0));
      isFloorDbg = (abs(dpl) < MIN_DIST * 2.0);
    }
    vec3 nWorld = isFloorDbg ? vec3(0.0, 1.0, 0.0) : calcNormalEnhancedFractal(p, u_normalEpsilon);

    // Transform the normal into the fractal's local orientation
    vec3 nLocal = nWorld;
    if (u_fractalType == 3) {
      nLocal = spDirWorldToLocal(nLocal);
    } else if (u_fractalType == 4) {
      nLocal = rotate3D(nLocal, u_rotation); // Mandelbox only rotates
    } else if (u_fractalType == 2) {
      nLocal = rotate3D(nLocal, u_rotation);
    } else if (u_fractalType == 1) {
      nLocal = rotate3D(nLocal, u_rotation);
    } else {
      nLocal = rotate3D(nLocal, u_rotation);
    }
      // Map local axes to RGB (X=R, Y=G, Z=B)
      return clamp(nLocal * 0.5 + 0.5, 0.0, 1.0);
    }
    return vec3(0.0);
  }

  // Fallback
  return vec3(0.0);
}

// Resolve visibility between fractal hit and analytic ground plane.
// Returns vec3(tHit, isFloor, hasHit) where flags are 1.0 or 0.0.
vec3 ResolveHit(vec3 ro, vec3 rd, float tF, bool hasF, float tP, bool hasP) {
  if (!hasF && !hasP) return vec3(0.0, 0.0, 0.0);
  if (!hasF && hasP)  return vec3(tP, 1.0, 1.0);
  if (hasF && !hasP)  return vec3(tF, 0.0, 1.0);

  float tStar = min(tF, tP);
  float tau = max(MIN_DIST, 2.0 * getAdaptiveEpsilon(tStar));

  if (tP < tF - tau) return vec3(tP, 1.0, 1.0);
  if (tF < tP - tau) return vec3(tF, 0.0, 1.0);

  // Seam band: sample fractal SDF at the plane intersection point; if the
  // fractal surface is present there, prefer the fractal to avoid cutting walls.
  vec3 pP = ro + rd * tP;
  float f = mapFractalOnly(pP);
  float epsN = 1.5 * getAdaptiveEpsilon(tP);
  if (abs(f) <= epsN) {
    return vec3(tF, 0.0, 1.0);
  }
  return vec3(tP, 1.0, 1.0);
}

void main() {
  if (u_skipWhenEmpty) {
    fragColor = vec4(u_backgroundColor, 1.0);
    return;
  }
  // Normalized coordinates
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;

  // Camera
  vec3 ro = u_cameraPos;
  vec3 rd = getRayDirectionRobust(uv, ro, u_cameraTarget, u_fov);

  // Choose integrator (manual, auto hybrid, or sphere)
  vec4 result;
  if (u_useSegmentTracing) {
    result = rayMarchWithTrap_Segment(ro, rd);
  } else if (u_integratorAuto) {
    // Use sphere integrator with auto step cap (handled inside rayMarchWithTrap)
    result = rayMarchWithTrap(ro, rd);
  } else {
    result = rayMarchWithTrap(ro, rd);
  }

  // Background
  vec3 color = u_backgroundColor;

  // Optional debug visualization
  if (u_debugEnabled && u_debugMode != 0) {
    color = debugColor(ro, rd, result);
    fragColor = vec4(color, 1.0);
    return;
  }

  // Compute plane candidate
  float tPlaneCand = 0.0;
  bool hasPlane = false;
  if (u_floorEnabled && rd.y < -1e-6) {
    tPlaneCand = (-2.0 - ro.y) / rd.y;
    hasPlane = (tPlaneCand > 0.0);
  }

  // Resolve hit between fractal and floor
  float tF = result.x;
  bool hasF = (result.z > 0.5);
  vec3 resolved = ResolveHit(ro, rd, tF, hasF, tPlaneCand, hasPlane);
  bool hasHit = (resolved.z > 0.5);

  if (hasHit) {
    float tHit = resolved.x;
    bool isFloor = (resolved.y > 0.5);
    vec3 p = ro + rd * tHit;
    float steps = result.y;
    float orbitTrap = result.w;

    // Normal selection: ground plane vs fractal
    vec3 normal;
    if (isFloor) {
      normal = vec3(0.0, 1.0, 0.0);
    } else if (u_useAnalyticNormals && u_fractalType == 2) {
      // Specialized Mandelbulb normal (DE-based forward differences in local space)
      // IMPORTANT: Keep transforms consistent with map() so shading tracks geometry.
      // The Mandelbulb in map() evaluates sdMandelbulb(rotate3D(p, u_rotation) / scale).
      // Do the same here when sampling the DE for the finite‑difference normal.
      vec3 fp = mbToLocal(p);
      float e = u_normalEpsilon;
      float f0 = sdMandelbulb(fp, u_iterations, u_fractalPower);
      float dx = sdMandelbulb(fp + vec3(e, 0.0, 0.0), u_iterations, u_fractalPower) - f0;
      float dy = sdMandelbulb(fp + vec3(0.0, e, 0.0), u_iterations, u_fractalPower) - f0;
      float dz = sdMandelbulb(fp + vec3(0.0, 0.0, e), u_iterations, u_fractalPower) - f0;
      vec3 nLocal = normalize(vec3(dx, dy, dz));
      // Rotate back to world space via centralized helper.
      normal = mbNormalToWorld(nLocal);
    } else {
      // Default normal (optionally fast forward-diff)
      normal = (u_fastNormals ? calcNormalFast(p, u_normalEpsilon) : calcNormalEnhancedFractal(p, u_normalEpsilon));
    }

    // Get color using new color system (or floor colors)
    // Ensure specular texture scale is available outside the floor/material branch.
    float specScaleTex = 1.0;
    vec3 matColor;
    if (isFloor) {
      // Floor base color (simple world-space checker as fallback)
      float baseChecker = mod(floor(p.x) + floor(p.z), 2.0);
      matColor = mix(u_floorColorA, u_floorColorB, baseChecker);
    } else {
      matColor = getColor(p, normal, tHit, orbitTrap, steps);
      if (u_texturesEnabled && (u_texApplyTarget == 0 || u_texApplyTarget == 2) && ((u_worldDetailStrength > 0.0) || (u_worldTexType > 0) || (u_worldTexTypeB > 0))) {
        vec3 pt = texSamplePos(p);
        float colorFactor; vec3 bumpDelta; float specOut;
        evalProceduralTextures(pt, normal, colorFactor, bumpDelta, specOut);
        if (u_colorMode != 4) {
          matColor *= colorFactor;
        }
        normal = normalize(normal + bumpDelta);
        specScaleTex = specOut;
      }
    }

    // Apply procedural textures to the floor with a fast 2D path by default
    if (isFloor && (u_texApplyTarget == 1 || u_texApplyTarget == 2) && u_texturesEnabled &&
        ((u_worldDetailStrength > 0.0) || (u_worldTexType > 0) || (u_worldTexTypeB > 0))) {
      // Floor-only LOD: optionally skip floor textures far away
      float disableDist = u_floorTexDisableDist;
      if (u_floorTexAutoDisable) {
        float mul = max(1.0, u_floorTexAutoMul);
        disableDist = u_lodFar * mul;
      }
      bool skipFloorTex = (disableDist > 0.0 && tHit > disableDist);
      if (!skipFloorTex) {
        // Compute fade factor for bump/spec
        float fadeNear = u_floorFadeNear;
        float fadeFar  = u_floorFadeFar;
        float floorFade = 1.0;
        if (fadeFar > fadeNear) {
          floorFade = 1.0 - smoothstep(fadeNear, fadeFar, tHit);
        } else if (disableDist > 0.0) {
          floorFade = 1.0 - smoothstep(disableDist * 0.6, disableDist * 0.95, tHit);
        }
      if (u_floorTexMode == 0) {
        // Fast 2D floor: single-projection sampling on XZ, cheaper gradient
        bool hasA = (u_worldTexType > 0);
        bool hasB = (u_worldTexTypeB > 0);
        float sA = max(0.05, u_worldTexScale);
        float sB = max(0.05, u_worldTexScaleB);
        float tA = hasA ? floorTextureValue2D(p, sA, u_worldTexType) : 0.0;
        float tB = hasB ? floorTextureValue2D(p, sB, u_worldTexTypeB) : 0.0;
        float alphaC = clamp(u_worldTexBlendAlphaColor, 0.0, 1.0);
        float alphaN = clamp(u_worldTexBlendAlphaBump, 0.0, 1.0);
        float alphaS = clamp(u_worldTexBlendAlphaSpec, 0.0, 1.0);

        float mixC, mixS;
        float wAc=0.0, wBc=0.0, wAn=0.0, wBn=0.0, wAs=0.0, wBs=0.0;
        if (u_worldTexBlendMode == 1) {
          mixC = tA * (hasB ? tB : 1.0);
          mixS = mixC;
          wAc = (hasB ? tB : 1.0); wBc = tA; wAn = wAc; wBn = wBc; wAs = wAc; wBs = wBc;
        } else if (u_worldTexBlendMode == 2) {
          mixC = clamp(tA + (hasB ? tB : 0.0), 0.0, 1.0);
          mixS = mixC;
          wAc = 1.0; wBc = 1.0; wAn = 1.0; wBn = 1.0; wAs = 1.0; wBs = 1.0;
        } else {
          mixC = mix(tA, (hasB ? tB : tA), alphaC);
          mixS = mix(tA, (hasB ? tB : tA), alphaS);
          wAc = 1.0 - (hasB ? alphaC : 0.0);
          wBc = (hasB ? alphaC : 0.0);
          wAn = 1.0 - (hasB ? alphaN : 0.0);
          wBn = (hasB ? alphaN : 0.0);
          wAs = 1.0 - (hasB ? alphaS : 0.0);
          wBs = (hasB ? alphaS : 0.0);
        }

        // Color mapping
        if (u_colorMode == 4) {
          if (u_texLayerColoring && (hasA || hasB)) {
            vec3 colA = hasA ? mix(u_texA_colorBase, u_texA_colorAccent, clamp(tA, 0.0, 1.0)) : vec3(0.0);
            vec3 colB = hasB ? mix(u_texB_colorBase, u_texB_colorAccent, clamp(tB, 0.0, 1.0)) : vec3(0.0);
            if (u_worldTexBlendMode == 1)      matColor = colA * (hasB ? colB : vec3(1.0));
            else if (u_worldTexBlendMode == 2) matColor = clamp(colA + (hasB ? colB : vec3(0.0)), 0.0, 1.0);
            else                                matColor = mix(colA, (hasB ? colB : colA), alphaC);
          } else {
            matColor = mix(u_texColorBase, u_texColorAccent, clamp(mixC, 0.0, 1.0));
          }
        } else {
          float colA = clamp(u_worldTexColorStrength, 0.0, 1.0);
          float colB = clamp(u_worldTexColorStrengthB, 0.0, 1.0);
          float colW = (u_worldTexBlendMode == 0) ? mix(colA, colB, (hasB ? alphaC : 0.0)) : clamp(colA + (hasB ? colB : 0.0), 0.0, 1.0);
          matColor *= (1.0 + (mixC - 0.5) * 1.0 * colW);
        }

        // Bump via two-tap 2D gradient in X and Z
        vec3 bumpDelta = vec3(0.0);
        float bA = clamp(u_worldTexBumpStrength, 0.0, 1.0);
        float bB = clamp(u_worldTexBumpStrengthB, 0.0, 1.0);
        float bump = (u_worldTexBlendMode == 0) ? mix(bA, bB, (hasB ? alphaN : 0.0)) : clamp(bA + (hasB ? bB : 0.0), 0.0, 1.0);
        if (bump > 0.0) {
          float epsB = 0.01;
          float t0 = mixC;
          // recompute composite at two shifted positions (X and Z)
          float tAx = hasA ? floorTextureValue2D(p + vec3(epsB,0,0), sA, u_worldTexType) : 0.0;
          float tBx = hasB ? floorTextureValue2D(p + vec3(epsB,0,0), sB, u_worldTexTypeB) : 0.0;
          float tAz = hasA ? floorTextureValue2D(p + vec3(0,0,epsB), sA, u_worldTexType) : 0.0;
          float tBz = hasB ? floorTextureValue2D(p + vec3(0,0,epsB), sB, u_worldTexTypeB) : 0.0;
          float mixCx, mixCz;
          if (u_worldTexBlendMode == 1) {
            mixCx = (hasA? tAx:0.0) * (hasB? tBx:1.0);
            mixCz = (hasA? tAz:0.0) * (hasB? tBz:1.0);
          } else if (u_worldTexBlendMode == 2) {
            mixCx = clamp((hasA? tAx:0.0) + (hasB? tBx:0.0), 0.0, 1.0);
            mixCz = clamp((hasA? tAz:0.0) + (hasB? tBz:0.0), 0.0, 1.0);
          } else {
            mixCx = mix((hasA? tAx:t0), (hasB? tBx:t0), alphaN);
            mixCz = mix((hasA? tAz:t0), (hasB? tBz:t0), alphaN);
          }
          vec2 g2 = (vec2(mixCx, mixCz) - vec2(t0)) / epsB;
        bumpDelta = vec3(g2.x, 0.0, g2.y) * 0.4 * bump;
        }
        // Scale floor bump effect with fade
        bumpDelta *= clamp(u_floorBumpScale, 0.0, 1.0) * clamp(floorFade, 0.0, 1.0);
        normal = normalize(normal + bumpDelta);

        // Specular modulation
        float sPA = clamp(u_worldTexSpecStrength, 0.0, 1.0);
        float sPB = clamp(u_worldTexSpecStrengthB, 0.0, 1.0);
        float sp = (u_worldTexBlendMode == 0) ? mix(sPA, sPB, (hasB ? alphaS : 0.0)) : clamp(sPA + (hasB ? sPB : 0.0), 0.0, 1.0);
        specScaleTex = 1.0 + (mixS - 0.5) * 0.6 * sp;
        // Scale specular modulation on floor with fade
        specScaleTex = 1.0 + (specScaleTex - 1.0) * clamp(u_floorSpecScale, 0.0, 1.0) * clamp(floorFade, 0.0, 1.0);
      } else {
        // Full triplanar path for floor (original behavior)
        vec3 pt = p;
        float colorFactorF; vec3 bumpDeltaF; float specOutF;
        if (u_floorIgnoreWarp) {
          // No-warp variant
          // Re-implement evalProceduralTextures with NoWarp sampling
          colorFactorF = 1.0; bumpDeltaF = vec3(0.0); specOutF = 1.0;
          if (u_worldDetailStrength > 0.0) {
            float dcol = triplanarFbmDetail(pt, normal, max(0.05, u_worldDetailScale));
            float scol = clamp(u_worldDetailStrength, 0.0, 1.0);
            colorFactorF *= (1.0 + (dcol - 0.5) * 0.6 * scol);
          }
          bool hasA = (u_worldTexType > 0);
          bool hasB = (u_worldTexTypeB > 0);
          float sA = max(0.05, u_worldTexScale);
          float sB = max(0.05, u_worldTexScaleB);
          float texA = hasA ? worldTextureValueNoWarp(pt, normal, sA, u_worldTexType) : 0.0;
          float texB = hasB ? worldTextureValueNoWarp(pt, normal, sB, u_worldTexTypeB) : 0.0;
          if (hasA || hasB) {
            float alphaC = clamp(u_worldTexBlendAlphaColor, 0.0, 1.0);
            float alphaN = clamp(u_worldTexBlendAlphaBump, 0.0, 1.0);
            float alphaS = clamp(u_worldTexBlendAlphaSpec, 0.0, 1.0);
            float texMixC, texMixS;
            float wAc=0.0, wBc=0.0, wAn=0.0, wBn=0.0, wAs=0.0, wBs=0.0;
            if (u_worldTexBlendMode == 1) {
              texMixC = texA * (hasB ? texB : 1.0);
              texMixS = texMixC;
              wAc = (hasB ? texB : 1.0); wBc = texA;
              wAn = wAc; wBn = wBc;
              wAs = wAc; wBs = wBc;
            } else if (u_worldTexBlendMode == 2) {
              texMixC = clamp(texA + (hasB ? texB : 0.0), 0.0, 1.0);
              texMixS = texMixC;
              wAc = 1.0; wBc = 1.0;
              wAn = 1.0; wBn = 1.0;
              wAs = 1.0; wBs = 1.0;
            } else {
              texMixC = mix(texA, (hasB ? texB : texA), alphaC);
              texMixS = mix(texA, (hasB ? texB : texA), alphaS);
              wAc = 1.0 - (hasB ? alphaC : 0.0);
              wBc = (hasB ? alphaC : 0.0);
              wAn = 1.0 - (hasB ? alphaN : 0.0);
              wBn = (hasB ? alphaN : 0.0);
              wAs = 1.0 - (hasB ? alphaS : 0.0);
              wBs = (hasB ? alphaS : 0.0);
            }
            float colA = clamp(u_worldTexColorStrength, 0.0, 1.0);
            float colB = clamp(u_worldTexColorStrengthB, 0.0, 1.0);
            float colW = (u_worldTexBlendMode == 0) ? mix(colA, colB, (hasB ? alphaC : 0.0)) : clamp(colA + (hasB ? colB : 0.0), 0.0, 1.0);
            colorFactorF *= (1.0 + (texMixC - 0.5) * 1.0 * colW);

            // Bump gradient (two-tap per axis is enough for floor)
            float epsB = 0.01;
            vec3 gx = vec3(epsB,0,0), gy = vec3(0,epsB,0), gz = vec3(0,0,epsB);
            vec3 gradA = vec3(0.0);
            vec3 gradB = vec3(0.0);
            if (hasA) {
              float t0 = texA;
              gradA = vec3(
                worldTextureValueNoWarp(pt + gx, normal, sA, u_worldTexType) - t0,
                worldTextureValueNoWarp(pt + gy, normal, sA, u_worldTexType) - t0,
                worldTextureValueNoWarp(pt + gz, normal, sA, u_worldTexType) - t0
              ) / epsB;
            }
            if (hasB) {
              float t1 = texB;
              gradB = vec3(
                worldTextureValueNoWarp(pt + gx, normal, sB, u_worldTexTypeB) - t1,
                worldTextureValueNoWarp(pt + gy, normal, sB, u_worldTexTypeB) - t1,
                worldTextureValueNoWarp(pt + gz, normal, sB, u_worldTexTypeB) - t1
              ) / epsB;
            }
            vec3 gradT = gradA * wAn + gradB * wBn;
            gradT -= normal * dot(gradT, normal);

            float bA = clamp(u_worldTexBumpStrength, 0.0, 1.0);
            float bB = clamp(u_worldTexBumpStrengthB, 0.0, 1.0);
            float bump = (u_worldTexBlendMode == 0) ? mix(bA, bB, (hasB ? alphaN : 0.0)) : clamp(bA + (hasB ? bB : 0.0), 0.0, 1.0);
            if (u_worldTexAutoAtten) {
              float bigS = max(u_worldTexScale, u_worldTexScaleB);
              float att = 1.0 - smoothstep(18.0, 36.0, bigS) * clamp(u_worldTexAAStrength, 0.0, 1.0);
              bump *= att;
            }
            if (bump > 0.0) bumpDeltaF = gradT * (0.4 * bump);

            float sPA = clamp(u_worldTexSpecStrength, 0.0, 1.0);
            float sPB = clamp(u_worldTexSpecStrengthB, 0.0, 1.0);
            float sp = (u_worldTexBlendMode == 0) ? mix(sPA, sPB, (hasB ? alphaS : 0.0)) : clamp(sPA + (hasB ? sPB : 0.0), 0.0, 1.0);
            if (u_worldTexAutoAtten) {
              float bigS2 = max(u_worldTexScale, u_worldTexScaleB);
              float att2 = 1.0 - smoothstep(18.0, 36.0, bigS2) * clamp(u_worldTexAAStrength, 0.0, 1.0);
              sp *= att2;
            }
            specOutF = 1.0 + (texMixS - 0.5) * 0.6 * sp;
          }
        } else {
          evalProceduralTextures(pt, normal, colorFactorF, bumpDeltaF, specOutF);
        }
        if (u_colorMode == 4) {
          bool hasA = (u_worldTexType > 0);
          bool hasB = (u_worldTexTypeB > 0);
          float sA = max(0.05, u_worldTexScale);
          float sB = max(0.05, u_worldTexScaleB);
          float texA = hasA ? worldTextureValue(pt, normal, sA, u_worldTexType) : 0.0;
          float texB = hasB ? worldTextureValue(pt, normal, sB, u_worldTexTypeB) : 0.0;
          float alphaC = clamp(u_worldTexBlendAlphaColor, 0.0, 1.0);
          if (u_texLayerColoring && (hasA || hasB)) {
            vec3 colA = hasA ? mix(u_texA_colorBase, u_texA_colorAccent, clamp(texA, 0.0, 1.0)) : vec3(0.0);
            vec3 colB = hasB ? mix(u_texB_colorBase, u_texB_colorAccent, clamp(texB, 0.0, 1.0)) : vec3(0.0);
            if (u_worldTexBlendMode == 1)      matColor = colA * (hasB ? colB : vec3(1.0));
            else if (u_worldTexBlendMode == 2) matColor = clamp(colA + (hasB ? colB : vec3(0.0)), 0.0, 1.0);
            else                                matColor = mix(colA, (hasB ? colB : colA), alphaC);
          } else {
            float tTex;
            if (u_worldTexBlendMode == 1)      tTex = texA * (hasB ? texB : 1.0);
            else if (u_worldTexBlendMode == 2) tTex = clamp(texA + (hasB ? texB : 0.0), 0.0, 1.0);
            else                                tTex = mix(texA, (hasB ? texB : texA), alphaC);
            matColor = mix(u_texColorBase, u_texColorAccent, clamp(tTex, 0.0, 1.0));
          }
        } else {
          matColor *= colorFactorF;
        }
        // Apply floor-specific bump/spec scaling with fade
        bumpDeltaF *= clamp(u_floorBumpScale, 0.0, 1.0) * clamp(floorFade, 0.0, 1.0);
        normal = normalize(normal + bumpDeltaF);
        specScaleTex = 1.0 + (specOutF - 1.0) * clamp(u_floorSpecScale, 0.0, 1.0) * clamp(floorFade, 0.0, 1.0);
      }
      }
    }

    // Enhanced lighting using uniforms
    vec3 lightDir = normalize(u_lightPos - p);
    vec3 viewDir = normalize(ro - p);
    vec3 halfDir = normalize(lightDir + viewDir);

    // Phong lighting components
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Calculate soft shadow to light (optional)
    float shadow = 1.0;
    if (u_softShadowsEnabled && (!isFloor || u_floorReceiveShadows)) {
      shadow = calcSoftShadowBudgeted(p + normal * 0.01, lightDir, normal, 0.02, length(u_lightPos - p));
      if (u_fastShadows) shadow = max(shadow, 0.7); // mild clamp to avoid over-darkening with fewer steps
      // Apply shadow to diffuse
      diffuse *= shadow;
    }

    // Ambient occlusion (optional) - adds soft shadows
    float ao = 1.0;
    if (!isFloor) {
      if (u_aoEnabled) {
        ao = calcAOAdvanced(p, normal);
      } else {
        // Cheap 2-tap cavity term along the normal to avoid washed-out look
        float e0 = 0.03;
        float e1 = 0.09;
        float d0 = mapRaw(p + normal * e0);
        float d1 = mapRaw(p + normal * e1);
        float occ0 = 1.0 - clamp((e0 - d0) * 8.0, 0.0, 1.0);
        float occ1 = 1.0 - clamp((e1 - d1) * 4.0, 0.0, 1.0);
        float occ = min(occ0, occ1);
        ao = mix(1.0, occ, clamp(u_aoFallbackStrength, 0.0, 1.0));
      }
    }

    // Only calculate specular if surface is lit and visible from light
    float specular = 0.0;
    if (u_softShadowsEnabled) {
      // Shadow handles occlusion, so we can be less strict on diffuse threshold
      if (diffuse > 0.1 && shadow > 0.1) {
        specular = pow(max(dot(normal, halfDir), 0.0), u_shininess);
        // Gentle attenuation based on lighting
        specular *= smoothstep(0.1, 0.5, diffuse);
      }
    } else {
      // Without soft shadows, require stronger diffuse to prevent bright corners
      if (diffuse > 0.3) {
        specular = pow(max(dot(normal, halfDir), 0.0), u_shininess);
        specular *= smoothstep(0.3, 0.7, diffuse);
      }
    }

    // Combine lighting with AO and tint by light color
    float ambient = u_ambientStrength * ao;
    vec3 colorFractal = matColor * ambient;
    // Diffuse (optionally) tinted by light color
    vec3 diffTint = u_tintDiffuse ? u_lightColor : vec3(1.0);
    colorFractal += matColor * (diffuse * u_diffuseStrength) * diffTint;
    // Tint specular by light color and apply AO
    // Modulate specular by procedural texture if active
    // Use specScaleTex computed in the texture pass (or 1.0 if textures disabled)
    colorFractal += u_lightColor * (specular * specScaleTex * u_specularStrength * ao);
    // Near-plane contact lift: prevent dark gasket from residual normal/precision issues
    if (u_floorEnabled) {
    float dP = abs(sdPlaneXZ(p + vec3(0.0, 2.0, 0.0)));
      float wP = 1.0 - smoothstep(0.02, 0.08, dP); // within ~2–8cm
      // Add a bit of ambient-tinted material color
      colorFractal = mix(colorFractal, colorFractal + matColor * 0.25, wP * 0.8);
    }

    color = colorFractal;

    // Fog (if enabled)
    if (u_fogEnabled) {
      float fogFactor = 0.0;

      if (u_fogType == 0) {
        // Exponential fog
        fogFactor = 1.0 - exp(-tHit * u_fogDensity);
      } else if (u_fogType == 1) {
        // Exponential squared fog (denser)
        fogFactor = 1.0 - exp(-pow(tHit * u_fogDensity, 2.0));
      } else if (u_fogType == 2) {
        // Linear fog
        fogFactor = clamp((tHit - u_fogNear) / (u_fogFar - u_fogNear), 0.0, 1.0);
      }

      // Dither fog factor slightly to reduce visible banding in wide gradients
      if (u_enableDithering && u_ditherFog) {
        float n = u_useBlueNoise ? blueNoiseHash(gl_FragCoord.xy * u_blueNoiseScale) : interleavedGradientNoise(gl_FragCoord.xy);
        float amp = u_ditheringStrength * 0.005; // very small amplitude to avoid visible bands
        fogFactor = clamp(fogFactor + (n - 0.5) * amp, 0.0, 1.0);
      }

      color = mix(color, u_fogColor, fogFactor);
    }
  } else {
    // Miss: no hit and no eligible plane -> background color already set
  }

  // --- Global post processing adjustments ---
  // Exposure (linear)
  color *= max(0.0, u_postExposure);

  // Tone mapping
  if (u_toneMapper == 1) {
    // ACES fitted (Narkowicz)
    const mat3 ACESInputMat = mat3(
      0.59719, 0.35458, 0.04823,
      0.07600, 0.90834, 0.01566,
      0.02840, 0.13383, 0.83777
    );
    const mat3 ACESOutputMat = mat3(
      1.60475,-0.53108,-0.07367,
     -0.10208, 1.10813,-0.00605,
     -0.00327,-0.07276, 1.07602
    );
    vec3 x = ACESInputMat * color;
    vec3 a = x * (x + 0.0245786) - 0.000090537;
    vec3 b = x * (0.983729 * x + 0.4329510) + 0.238081;
    color = ACESOutputMat * (a / b);
  } else if (u_toneMapper == 2) {
    // Filmic (smooth curve)
    vec3 x = max(vec3(0.0), color - 0.004);
    color = (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
  }

  // Saturation
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, clamp(u_postSaturation, 0.0, 2.0));
  // Contrast around mid gray
  color = (color - 0.5) * clamp(u_postContrast, 0.0, 4.0) + 0.5;
  // Vignette
  {
    vec2 uv01 = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv01 - 0.5) * vec2(aspect, 1.0);
    float r = length(p) * 1.2; // slight overscan
    float soft = clamp(u_vignetteSoftness, 0.0, 1.0);
    float v = smoothstep(max(0.0, 1.0 - soft), 1.0, r);
    color *= (1.0 - clamp(u_vignetteStrength, 0.0, 1.0) * v);
  }
  // Gamma
  float g = max(0.01, u_postGamma);
  color = pow(max(color, 0.0), vec3(1.0 / g));
  // Final clamp
  color = clamp(color, 0.0, 1.0);

  fragColor = vec4(color, 1.0);
}
// Map that returns only the fractal (no floor/union), for debugging
float mapFractalOnly(vec3 p) {
  float fractal = MAX_DIST;
  switch (u_fractalType) {
    case FT_PRIMITIVES: {
      vec3 spherePos = vec3(sin(u_time * 0.75) * 2.0, 0.0, 0.0);
      float sphere = sdSphere(p - spherePos, 1.0);
      vec3 boxPos = vec3(0.0, 0.0, 0.0);
      float box = sdBox(rotate3D(p - boxPos, u_rotation), vec3(0.8, 0.8, 0.8));
      fractal = opSubtraction(box, sphere);
    } break;
    case FT_MENGER: {
      vec3 fp = mgToLocal(p);
      fractal = sdMenger(fp, u_iterations) * u_fractalScale;
    } break;
    case FT_BULB: {
      vec3 fp = mbToLocal(p);
      fractal = sdMandelbulb(fp, u_iterations, u_fractalPower) * u_fractalScale;
    } break;
    case FT_SIERPINSKI: {
      vec3 fp = spToLocal(p);
      fractal = sdSierpinskiWithBase(fp, u_iterations, 2.0, max(0.2, u_sierpinskiBase)) * u_fractalScale;
    } break;
    case FT_MANDELBOX: {
      vec3 fp = mbxToLocal(p);
      fractal = sdMandelboxSimple(fp, u_iterations, -1.5) * (u_fractalScale * MB_NORM);
    } break;
    case FT_WORLD: {
      float trapDummy; fractal = deAmazingSurfWorld(p, trapDummy);
    } break;
    case FT_TRUCHET: {
      float trapDummy; fractal = deTruchetPipesWorld(p, trapDummy);
    } break;
    case FT_DEC: {
      float s = max(0.2, u_fractalScale);
      vec3 pl = rotate3D(p - u_decOffset, u_rotation) / s;
      float d = decUserDE(pl) * s;
      fractal = d;
    } break;
  }
  return fractal;
}
