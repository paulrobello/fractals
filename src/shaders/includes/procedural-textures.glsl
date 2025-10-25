// Reusable procedural textures: FBM, Noise, Truchet (square), Hex Truchet (triplanar), Checker
// Relies on uniforms defined in the main fragment shader:
//   u_worldFbmOctaves, u_worldFbmLacunarity, u_worldFbmGain, u_worldFbmSeed,
//   u_worldTexAAStrength, u_worldTruchetRotate, u_worldTruchetWidth, u_worldTruchetDensity

float hashT(vec3 p) {
  p += vec3(u_worldFbmSeed);
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noiseT(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hashT(i + vec3(0,0,0));
  float n100 = hashT(i + vec3(1,0,0));
  float n010 = hashT(i + vec3(0,1,0));
  float n110 = hashT(i + vec3(1,1,0));
  float n001 = hashT(i + vec3(0,0,1));
  float n101 = hashT(i + vec3(1,0,1));
  float n011 = hashT(i + vec3(0,1,1));
  float n111 = hashT(i + vec3(1,1,1));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbmT(vec3 p) {
  float gain = clamp(u_worldFbmGain, 0.1, 0.95);
  float lac  = clamp(u_worldFbmLacunarity, 1.1, 4.0);
  int   oct  = clamp(u_worldFbmOctaves, 1, 8);
  float a = 0.5;
  float s = 0.0;
  vec3 q = p;
  for (int i = 0; i < 8; ++i) {
    if (i >= oct) break;
    s += a * noiseT(q);
    q *= lac;
    a *= gain;
  }
  return s;
}

// --- Domain Warp Controls ----------------------------------------------------
// Global warp is applied to the texture coordinate prior to evaluating a layer.
//
// Uniforms declared in main fragment shader:
//   u_texWarpStrength (0..2)
//   u_texWarpScale    (>=0.05)
//   u_texWarpOctaves  (1..6)
//   u_texWarpType     (0=None, 1=FBM, 2=Ridged FBM)

float fbmOct(vec3 p, int oct, float lac, float gain) {
  float a = 0.5;
  float s = 0.0;
  vec3 q = p;
  for (int i = 0; i < 8; ++i) {
    if (i >= oct) break;
    s += a * noiseT(q);
    q *= lac;
    a *= gain;
  }
  return s;
}

float fbmRidged(vec3 p, int oct, float lac, float gain) {
  float a = 0.5;
  float s = 0.0;
  vec3 q = p;
  for (int i = 0; i < 8; ++i) {
    if (i >= oct) break;
    float n = noiseT(q);
    n = 1.0 - abs(n * 2.0 - 1.0); // ridged
    s += a * n;
    q *= lac;
    a *= gain;
  }
  return s;
}

vec3 applyTextureWarp(vec3 p) {
  #ifdef DISABLE_TEX_WARP
    return p;
  #endif
  if (u_texWarpStrength <= 0.0) return p;
  float s = max(0.05, u_texWarpScale);
  int   o = clamp(u_texWarpOctaves, 1, 6);
  float lac = 2.0;
  float gain = 0.5;
  float x, y, z;
  if (u_texWarpType == 2) {
    x = fbmRidged(p.xyz * s, o, lac, gain);
    y = fbmRidged(p.yzx * s, o, lac, gain);
    z = fbmRidged(p.zxy * s, o, lac, gain);
  } else {
    x = fbmOct(p.xyz * s, o, lac, gain);
    y = fbmOct(p.yzx * s, o, lac, gain);
    z = fbmOct(p.zxy * s, o, lac, gain);
  }
  vec3 w = vec3(x, y, z);
  // Center and scale
  w = (w - 0.5) * 2.0;
  return p + w * clamp(u_texWarpStrength, 0.0, 2.0);
}

vec3 applyTextureAnisotropy(vec3 p) {
  float f = clamp(u_texAnisoFactor, 0.05, 4.0);
  if (abs(f - 1.0) < 1e-6) return p;
  if (u_texAnisoAxis == 0) return vec3(p.x * f, p.y, p.z);
  if (u_texAnisoAxis == 1) return vec3(p.x, p.y * f, p.z);
  return vec3(p.x, p.y, p.z * f);
}

// LOD-aware warp (reduces warp octaves as derivatives grow)
vec3 applyTextureWarpLOD(vec3 p, float lodGrad) {
  #ifdef DISABLE_TEX_WARP
    return p;
  #endif
  if (u_texWarpStrength <= 0.0) return p;
  float s = max(0.05, u_texWarpScale);
  int   oBase = clamp(u_texWarpOctaves, 1, 6);
  int   oDrop = int(floor(clamp(lodGrad, 0.0, 1.0) * float(max(0, u_texWarpOctDrop))));
  int   o = max(1, oBase - oDrop);
  float lac = 2.0;
  float gain = 0.5;
  float x, y, z;
  if (u_texWarpType == 2) {
    x = fbmRidged(p.xyz * s, o, lac, gain);
    y = fbmRidged(p.yzx * s, o, lac, gain);
    z = fbmRidged(p.zxy * s, o, lac, gain);
  } else {
    x = fbmOct(p.xyz * s, o, lac, gain);
    y = fbmOct(p.yzx * s, o, lac, gain);
    z = fbmOct(p.zxy * s, o, lac, gain);
  }
  vec3 w = vec3(x, y, z);
  w = (w - 0.5) * 2.0;
  return p + w * clamp(u_texWarpStrength, 0.0, 2.0);
}

vec3 triWeights(vec3 n) {
  n = abs(n) + 1e-4;
  return n / (n.x + n.y + n.z);
}

vec3 triWeightsOpt(vec3 n) {
  vec3 a = abs(n) + 1e-4;
  vec3 w = a / (a.x + a.y + a.z);
  if (u_texTop2) {
    // Effective cutoff: raise threshold by hysteresis margin (no smoothing).
    // This preserves strict Top‑2 sampling (drop one axis entirely), which is faster
    // and avoids the cost regression seen when softly attenuating the third axis.
    float tEff = clamp(u_texTriMinWeight + max(0.0, u_texTriHyst), 0.0, 0.3);
    if (w.x < w.y && w.x < w.z && w.x < tEff) { w = vec3(0.0, w.y, w.z); }
    else if (w.y < w.x && w.y < w.z && w.y < tEff) { w = vec3(w.x, 0.0, w.z); }
    else if (w.z < w.x && w.z < w.y && w.z < tEff) { w = vec3(w.x, w.y, 0.0); }
    float s = w.x + w.y + w.z;
    if (s > 0.0) w /= s;
  }
  return w;
}

float triplanarFbmDetail(vec3 p, vec3 n, float scale) {
  vec3 w = triWeightsOpt(n);
  float s = max(0.05, scale);
  // Early-out: skip projections with very small weight to reduce cost
  const float W_EPS = 0.06;
  float acc = 0.0;
  float ww = 0.0;
  if (w.x > W_EPS) { float x = fbmT(p.yzx * s); acc += x * w.x; ww += w.x; }
  if (w.y > W_EPS) { float y = fbmT(p.zxy * s); acc += y * w.y; ww += w.y; }
  if (w.z > W_EPS) { float z = fbmT(p.xyz * s); acc += z * w.z; ww += w.z; }
  // Renormalize if we skipped some projections
  return (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
}

float hashT2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float valueNoise2D(vec2 q) {
  vec2 i = floor(q);
  vec2 f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  float n00 = hashT2(i + vec2(0.0, 0.0));
  float n10 = hashT2(i + vec2(1.0, 0.0));
  float n01 = hashT2(i + vec2(0.0, 1.0));
  float n11 = hashT2(i + vec2(1.0, 1.0));
  float nx0 = mix(n00, n10, f.x);
  float nx1 = mix(n01, n11, f.x);
  return mix(nx0, nx1, f.y);
}

float truchet2D(vec2 uv) {
  uv *= max(0.1, u_worldTruchetDensity);
  vec2 id = floor(uv);
  vec2 f = fract(uv);
  float r = step(0.5, hashT2(id + u_worldFbmSeed));
  if (u_worldTruchetRotate == 1) {
    if (r > 0.5) f = f.yx;
  }
  float d = abs(f.x - f.y);
  float w = clamp(u_worldTruchetWidth, 0.02, 0.6);
  return smoothstep(w, 0.0, d);
}

float triplanarTruchet(vec3 p, vec3 n, float scale) {
  vec3 w = triWeightsOpt(n);
  float s = max(0.05, scale);
  const float W_EPS = 0.06;
  float acc = 0.0; float ww = 0.0;
  if (w.x > W_EPS) { float x = truchet2D(p.yz * s); acc += x * w.x; ww += w.x; }
  if (w.y > W_EPS) { float y = truchet2D(p.zx * s); acc += y * w.y; ww += w.y; }
  if (w.z > W_EPS) { float z = truchet2D(p.xy * s); acc += z * w.z; ww += w.z; }
  return (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
}

// --- Hexagonal Truchet (2D) -------------------------------------------------
// Port adapted from Shadertoy references (Fabrice Neyret / mattz lineage)
// Produces a hex cell distance field, then applies cosine folding to form
// the snake-like Truchet pattern. Returns 0..1 intensity.
uniform float u_hexSeed; // seed for hex Truchet randomness (separate from FBM seed)

float hexHeightMap(vec2 p) {
  // Hex axial coords
  vec2 h = vec2(p.x + p.y * 0.57735, p.y * 1.1547);
  vec2 fh = floor(h);
  vec2 f = fract(h);
  h = fh;
  float c = fract((h.x + h.y) / 3.0);
  h = (c < 0.666) ? ((c < 0.333) ? h : h + 1.0) : (h + step(f.yx, f));

  // Local position from hex center
  p -= vec2(h.x - h.y * 0.5, h.y * 0.8660254);

  // Randomly flip some hexagons to avoid all-circles look
  c = fract(cos(dot(h, vec2(41.0, 289.0)) + u_hexSeed) * 43758.5453);
  p -= p * step(c, 0.5) * 2.0; // if (c < 0.5) p *= -1.0

  // Min squared distance to neighbors (three partitions due to flipping)
  p -= vec2(-1.0, 0.0);
  float d2 = dot(p, p);
  p -= vec2(1.5, 0.8660254);
  d2 = min(d2, dot(p, p));
  p -= vec2(0.0, -1.73205);
  d2 = min(d2, dot(p, p));

  return sqrt(d2);
}

// Advanced fold controls (uniforms declared in main fragment)
//   u_hexFoldFreq: frequency multiplier for both harmonics (default 1.0)
//   u_hexContrast: contrast scale before 0..1 clamp (default 1.0)
float hexTruchet2D(vec2 uv) {
  // Optional extra density: handled by external scale. Keep local scaling mild.
  // Folding to produce aligned wavy bands (two harmonics)
  float c = hexHeightMap(uv);
  const float TAU = 6.28318530718;
  float f = max(0.25, u_hexFoldFreq);
  // Two harmonics, frequency scaled together
  c = cos(c * TAU * f) + cos(c * TAU * 2.0 * f);
  // Contrast: 1.0 keeps prior look; higher = punchier
  float k = clamp(u_hexContrast, 0.25, 2.5);
  return clamp(c * (0.6 * k) + 0.5, 0.0, 1.0);
}

float triplanarHexTruchet(vec3 p, vec3 n, float scale) {
  vec3 w = triWeightsOpt(n);
  float s = max(0.05, scale);
  const float W_EPS = 0.06;
  float acc = 0.0; float ww = 0.0;
  if (w.x > W_EPS) { acc += hexTruchet2D(p.yz * s) * w.x; ww += w.x; }
  if (w.y > W_EPS) { acc += hexTruchet2D(p.zx * s) * w.y; ww += w.y; }
  if (w.z > W_EPS) { acc += hexTruchet2D(p.xy * s) * w.z; ww += w.z; }
  return (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
}

// --- Checker (2D) ------------------------------------------------------------
// High-contrast black/white grid; computed with sin-based pattern to avoid
// branching. Antialiasing handled by derivative-based attenuation below.
float checker2D(vec2 uv) {
  // sin(pi*x)*sin(pi*y) is positive/negative in alternating tiles
  const float PI = 3.14159265359;
  float v = sin(PI * uv.x) * sin(PI * uv.y);
  // Map sign to 0..1; add tiny epsilon to avoid exact zeros
  return 0.5 + 0.5 * sign(v + 1e-6);
}

float triplanarChecker(vec3 p, vec3 n, float scale) {
  vec3 w = triWeightsOpt(n);
  float s = max(0.05, scale);
  const float W_EPS = 0.06;
  float acc = 0.0; float ww = 0.0;
  if (w.x > W_EPS) { acc += checker2D(p.yz * s) * w.x; ww += w.x; }
  if (w.y > W_EPS) { acc += checker2D(p.zx * s) * w.y; ww += w.y; }
  if (w.z > W_EPS) { acc += checker2D(p.xy * s) * w.z; ww += w.z; }
  return (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
}

// --- 2D FBM (for floor fast path) -------------------------------------------
float fbm2D(vec2 p, int oct, float lac, float gain) {
  float a = 0.5;
  float s = 0.0;
  vec2 q = p;
  for (int i = 0; i < 8; ++i) {
    if (i >= oct) break;
    s += a * valueNoise2D(q);
    q *= lac;
    a *= gain;
  }
  return s;
}

float fbmRidged2D(vec2 p, int oct, float lac, float gain) {
  float a = 0.5;
  float s = 0.0;
  vec2 q = p;
  for (int i = 0; i < 8; ++i) {
    if (i >= oct) break;
    float n = valueNoise2D(q);
    n = 1.0 - abs(n * 2.0 - 1.0);
    s += a * n;
    q *= lac;
    a *= gain;
  }
  return s;
}

// 2D domain warp for floor fast path
vec2 applyTextureWarp2D(vec2 uv) {
  if (u_texWarpStrength <= 0.0) return uv;
  float s = max(0.05, u_texWarpScale);
  int   o = clamp(u_texWarpOctaves, 1, 6);
  float lac = 2.0;
  float gain = 0.5;
  float x, y;
  if (u_texWarpType == 2) {
    x = fbmRidged2D(uv.xy * s, o, lac, gain);
    y = fbmRidged2D(uv.yx * s, o, lac, gain);
  } else {
    x = fbm2D(uv.xy * s, o, lac, gain);
    y = fbm2D(uv.yx * s, o, lac, gain);
  }
  vec2 w = vec2(x, y);
  w = (w - 0.5) * 2.0;
  return uv + w * clamp(u_texWarpStrength, 0.0, 2.0);
}

// Fast single-projection texture for flat floor (XZ plane)
float floorTextureValue2D(vec3 p, float scale, int type) {
  float s = max(0.05, scale);
  vec2 uv = p.xz * s;
  // Apply directional anisotropy in XZ only
  if (u_texAnisoFactor != 1.0) {
    float f = clamp(u_texAnisoFactor, 0.05, 4.0);
    if (u_texAnisoAxis == 0) uv.x *= f; // X stretch
    else if (u_texAnisoAxis == 2) uv.y *= f; // Z stretch
  }
  // Domain warp (2D)
  if (!u_floorIgnoreWarp) {
    uv = applyTextureWarp2D(uv);
  }

  float aa = clamp(u_worldTexAAStrength, 0.0, 1.0);
  float fw = length(fwidth(uv));
  float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));

  if (type == 1) {
    int oct = clamp(u_worldFbmOctaves, 1, 8);
    float t = fbm2D(uv, oct, clamp(u_worldFbmLacunarity, 1.1, 4.0), clamp(u_worldFbmGain, 0.1, 0.95));
    return mix(0.5, t, atten);
  }
  if (type == 2) {
    float t = valueNoise2D(uv);
    return mix(0.5, t, atten);
  }
  if (type == 3) {
    float t = truchet2D(uv);
    return mix(0.5, t, atten);
  }
  if (type == 4) {
    float t = hexTruchet2D(uv);
    return mix(0.5, t, atten);
  }
  if (type == 5) {
    float t = checker2D(uv);
    return mix(0.5, t, atten);
  }
  return 0.0;
}

// No-warp variant of the unified triplanar value (for floor full mode when warp is disabled)
float worldTextureValueNoWarp(vec3 p, vec3 n, float scale, int type) {
  // Only anisotropy; skip global domain warp
  p = applyTextureAnisotropy(p);
  float aa = clamp(u_worldTexAAStrength, 0.0, 1.0);
  vec3 w = triWeightsOpt(n);
  const float W_EPS = 0.06;
  float s = max(0.05, scale);
  if (type == 1) {
    float acc = 0.0; float ww = 0.0;
    if (w.x > W_EPS) { acc += fbmT(p.yzx * s) * w.x; ww += w.x; }
    if (w.y > W_EPS) { acc += fbmT(p.zxy * s) * w.y; ww += w.y; }
    if (w.z > W_EPS) { acc += fbmT(p.xyz * s) * w.z; ww += w.z; }
    float t = (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 2) {
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float acc = 0.0; float ww = 0.0;
    if (w.x > W_EPS) { acc += valueNoise2D(ux) * w.x; ww += w.x; }
    if (w.y > W_EPS) { acc += valueNoise2D(uy) * w.y; ww += w.y; }
    if (w.z > W_EPS) { acc += valueNoise2D(uz) * w.z; ww += w.z; }
    float t = (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 3) {
    float t = triplanarTruchet(p, n, scale);
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 4) {
    float t = triplanarHexTruchet(p, n, scale);
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 5) {
    float t = triplanarChecker(p, n, scale);
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  return 0.0;
}

// Unified triplanar texture value: 1=FBM, 2=Noise, 3=Truchet, 4=Hex Truchet, 5=Checker
float worldTextureValue(vec3 p, vec3 n, float scale, int type) {
  // Directional anisotropy first
  p = applyTextureAnisotropy(p);
  float s = max(0.05, scale);
  // Precompute derivatives to estimate frequency; use for AA and LOD
  vec2 ux0 = p.yz * s; vec2 uy0 = p.zx * s; vec2 uz0 = p.xy * s;
  float fw0 = max(max(length(fwidth(ux0)), length(fwidth(uy0))), length(fwidth(uz0)));
  float lodGrad = (u_texLODEnabled ? smoothstep(0.6, 2.0, fw0) : 0.0);
  // Warp with LOD-aware octave drop
  if (u_texLODEnabled) p = applyTextureWarpLOD(p, lodGrad * max(0.0, u_texDerivAggression)); else p = applyTextureWarp(p);
  float aa = clamp(u_worldTexAAStrength, 0.0, 1.0);
  vec3 w = triWeightsOpt(n);
  const float W_EPS = 0.06;
  if (type == 1) {
    int oBase = clamp(u_worldFbmOctaves, 1, 8);
    int oDrop = (u_texLODEnabled ? int(floor(lodGrad * max(0.0, u_texDerivAggression) * float(max(0, u_texDerivOctDrop)))) : 0);
    int oMin  = clamp(u_texDerivMinOct, 1, 8);
    int oct   = max(oMin, oBase - oDrop);
    float lac = clamp(u_worldFbmLacunarity, 1.1, 4.0);
    float gai = clamp(u_worldFbmGain, 0.1, 0.95);
    float acc = 0.0; float ww = 0.0;
    if (w.x > W_EPS) { acc += fbmOct(p.yzx * s, oct, lac, gai) * w.x; ww += w.x; }
    if (w.y > W_EPS) { acc += fbmOct(p.zxy * s, oct, lac, gai) * w.y; ww += w.y; }
    if (w.z > W_EPS) { acc += fbmOct(p.xyz * s, oct, lac, gai) * w.z; ww += w.z; }
    float t = (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 2) {
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float acc = 0.0; float ww = 0.0;
    if (w.x > W_EPS) { acc += valueNoise2D(ux) * w.x; ww += w.x; }
    if (w.y > W_EPS) { acc += valueNoise2D(uy) * w.y; ww += w.y; }
    if (w.z > W_EPS) { acc += valueNoise2D(uz) * w.z; ww += w.z; }
    float t = (ww > 0.0) ? (acc * (1.0 / ww)) : 0.0;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 3) {
    float t = triplanarTruchet(p, n, scale);
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 4) {
    float t = triplanarHexTruchet(p, n, scale);
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  if (type == 5) {
    float t = triplanarChecker(p, n, scale);
    vec2 ux = p.yz * s; vec2 uy = p.zx * s; vec2 uz = p.xy * s;
    float fw = max(max(length(fwidth(ux)), length(fwidth(uy))), length(fwidth(uz)));
    float atten = 1.0 - smoothstep(0.6, 2.0, fw * (0.5 + 2.0 * aa));
    return mix(0.5, t, atten);
  }
  return 0.0;
}
