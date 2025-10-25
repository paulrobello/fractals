// Dual 3D Truchet Pipes (torus + straight variants)
// Adapted to project SDF style and uniforms.
// Returns a signed distance for the combined decorated tube network.

// --- Parameters (uniforms are declared in the main fragment shader) ---
// Uses u_worldTile as the world tile period (size of 1 cube cell)
// uniform float u_truchetRadius;   // tube radius (~0.07..0.12 looks good)
// uniform int   u_truchetShape;    // 0=round,1=square,2=rounded-square,3=octagon
// uniform int   u_truchetVariant;  // 0=dual,1=torus only,2=straight only

// Helpers ---------------------------------------------------------------
mat2 tr_rot2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// 2D box SDF (IQ’s correct box formula)
float sdBox2(vec2 p, float b){
  vec2 d = abs(p) - vec2(b);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// Tube cross-section: round/square/rounded-square/octagon
float tr_tube(vec2 p, float sc, float rad){
  vec2 a = abs(p);
  if (u_truchetShape == 0) {
    return length(a) - rad; // round
  } else if (u_truchetShape == 1) {
    return sdBox2(a, rad);  // square
  } else if (u_truchetShape == 2) {
    // rounded square via smooth max
    return smax(a.x, a.y, 0.015) - rad;
  } else {
    // octagon-ish
    return max(max(a.x, a.y), (a.x + a.y) * sc) - rad; // sc≈0.707 for octagon
  }
}

// Decorated toroidal tube (quarter torus with sleeves/holes)
// Returns: (mainTube, bandSleeve, innerHint, segId)
vec4 tr_torTube(vec3 p, float rad){
  const float scOct = 0.7071; // for octagon cross option

  float tb = tr_tube(abs(vec2(length(p.xy) - 0.5, p.z)), 0.75, rad);

  // Segment decorations -------------------------------------------------
  float innerTb = 1e5; // inner glow hint
  const float aNum = 12.0; // 8 groups of 3 in original; 12 works well

  // Align segments
  p.xy = tr_rot2(PI * 0.5) * p.xy; // 90° so bands don’t line up with axis
  float a = atan(p.y, p.x);
  float ia = floor(a / TAU * aNum) + 0.5; // center of cell
  p.xy = tr_rot2(ia * TAU / aNum) * p.xy;
  p.x -= 0.5; // radius to align with torus radius
  vec3 q = abs(p);

  // Bands (sleeves) and pegs for portals
  float sleeveK = clamp(u_truchetSleeveScale, 0.5, 1.2);
  float band = max(tr_tube(q.xz, 0.75, rad + 0.0075 * sleeveK), q.y - (0.06 * sleeveK));
  vec2 peg = vec2(tr_tube(q.xy, 0.64, 0.0425), tr_tube(q.yz, 0.64, 0.0425));

  if (mod(ia + 1.0, 3.0) > 2.0) {
    // Thicker alternating sleeves
    band = min(band, max(tr_tube(q.xz, 0.6, rad + 0.015 * sleeveK), q.y - (0.04 * sleeveK)));
    band = min(band, max(tr_tube(q.xz, 0.6, rad + 0.025 * sleeveK), q.y - (0.0133 * sleeveK)));
  } else {
    // Portal holes on alternate cells
    float hole = min(peg.x, peg.y);
    float lipBase = (u_truchetShape == 3 ? 0.0075 : 0.02);
    float lip = rad + lipBase * clamp(u_truchetLipScale, 0.5, 1.5);
    band = min(band, min(max(peg.x, q.z - lip), max(peg.y, q.x - lip)));
    band = max(band, -(hole + 0.015));
    tb   = max(tb,   -(hole + 0.015)); // bore holes through the main tube
    innerTb = length(q) - rad + 0.01;   // inner hint (used for trap/coloring)
  }

  return vec4(tb, band, innerTb, ia);
}

// Decorated straight tube (with periodic sleeves/holes along Z)
vec4 tr_straightTube(vec3 p, float rad){
  float sleeveK = clamp(u_truchetSleeveScale, 0.5, 1.2);
  float tb = tr_tube(abs(p.xy), 0.75, rad);
  float innerTb = 1e5;

  const float aNum = 1.0; // keep consistent with original formula structure
  float ia = floor(p.z * 3.0 * aNum);
  float opz = mod(p.z + 1.0 / aNum / 3.0, 1.0 / aNum);
  p.z = mod(p.z, 1.0 / aNum / 3.0) - 0.5 / aNum / 3.0;
  vec3 q = abs(p);

  float band = max(tb - (0.0075 * sleeveK), q.z - (0.06 * sleeveK));
  vec2 peg = vec2(tr_tube(q.xz, 0.64, 0.0425), tr_tube(q.yz, 0.64, 0.0425));

  if (opz > 2.0 / aNum / 3.0) {
    band = min(band, max(tr_tube(q.xy, 0.6, rad + 0.015 * sleeveK), q.z - (0.04 * sleeveK)));
    band = min(band, max(tr_tube(q.xy, 0.6, rad + 0.025 * sleeveK), q.z - (0.0133 * sleeveK)));
  } else {
    float hole = min(peg.x, peg.y);
    float lipBase = (u_truchetShape == 3 ? 0.0075 : 0.02);
    float lip = rad + lipBase * clamp(u_truchetLipScale, 0.5, 1.5);
    band = min(band, min(max(peg.x, q.y - lip), max(peg.y, q.x - lip)));
    band = max(band, -(hole + 0.015));
    tb   = max(tb,   -(hole + 0.015));
    innerTb = length(q) - rad + 0.01;
  }

  return vec4(tb, band, innerTb, float(ia));
}

// Fast tests to choose which decorated tube to evaluate in detail
vec4 tr_torTubeTest(vec3 p){
  vec2 v = vec2(length(p.xy) - 0.5, p.z);
  return vec4(p, dot(v, v));
}
vec4 tr_straightTubeTest(vec3 p){
  vec2 v = p.xy;
  return vec4(p, dot(v, v));
}

// Core map for Truchet block at unit scale
// Returns signed distance and writes a simple orbit-like trap value
float deTruchetPipesUnit(vec3 p, out float trap, bool allowFast){
  // Random ID per grid cube (keep constants stable)
  float rnd = fract(sin(dot(floor(p + vec3(111.0, 73.0, 27.0)), vec3(7.63, 157.31, 113.97))) * 43758.5453);
  float rnd2 = fract(rnd * 41739.7613 + 0.131);

  // Partition into unit cell centered at origin
  vec3 q = fract(p) - 0.5;

  // Randomly pick orientation by swizzling coordinates
  if (rnd > 0.833) q = q.xzy; else if (rnd > 0.666) q = q.yxz; else if (rnd > 0.5) q = q.yzx; else if (rnd > 0.333) q = q.zxy; else if (rnd > 0.166) q = q.zyx;

  // Decide which basic tubes occupy the tile
  vec4 tb1 = tr_torTubeTest(vec3(q.xy + 0.5, q.z));
  vec4 tb2, tb3;
  if (rnd2 > 0.66 || u_truchetVariant == 1) {
    tb2 = tr_torTubeTest(vec3(q.yz - 0.5, q.x));
    tb3 = tr_torTubeTest(vec3(q.xz - vec2(0.5, -0.5), q.y));
  } else if (u_truchetVariant == 2) {
    // straight only variant
    tb2 = tr_straightTubeTest(vec3(q.xy - 0.5, q.z));
    tb3 = tr_straightTubeTest(q);
  } else {
    tb2 = tr_torTubeTest(vec3(q.xy - 0.5, q.z));
    tb3 = tr_straightTubeTest(q);
  }

  // Choose nearest oriented point
  vec3 op = (tb1.w < tb2.w && tb1.w < tb3.w) ? tb1.xyz : (tb2.w < tb3.w ? tb2.xyz : tb3.xyz);

  // Evaluate decorated detail only for the nearest segment
  float rad = clamp(u_truchetRadius, 0.03, 0.16);

  // Optional conservative fast path: approximate the main tube SDF and subtract a
  // safety margin to account for bands/sleeves protrusions. This guarantees a value
  // <= true SDF (safe for sphere tracing). Only used when sufficiently far from
  // decorations & the surface to avoid needlessly conservative steps near hits.
  if (allowFast && u_truchetPortalFast) {
    float tbQuick;
    bool useStraight = ((rnd2 <= 0.66 && tb3.w < tb1.w && tb3.w < tb2.w) || u_truchetVariant == 2);
    if (useStraight) {
      tbQuick = tr_tube(abs(op.xy), 0.75, rad);
    } else {
      tbQuick = tr_tube(abs(vec2(length(op.xy) - 0.5, op.z)), 0.75, rad);
    }
    // Safety margin approximates max outward sleeve thickness (~0.025) plus pad
    float margin = clamp(u_truchetFastMargin, 0.015, 0.06);
    float kGate = clamp(u_truchetFastK, 1.0, 8.0);
    // Early-out when far enough from decorations and surface
    if (tbQuick > margin * kGate) {
      trap = fract(rnd * 3.17); // lightweight trap hint for palette flow
      return tbQuick - margin;
    }
  }

  // Masked detail evaluation: cheaply decide if decorative bands/holes can
  // influence the SDF. If clearly outside their local regions, skip the heavy
  // decoration evaluation and use the main tube SDF directly. The masks and
  // thresholds are conservative so we never overestimate the true SDF.
  bool chooseStraight = ((rnd2 <= 0.66 && tb3.w < tb1.w && tb3.w < tb2.w) || u_truchetVariant == 2);
  float tbMain = chooseStraight
    ? tr_tube(abs(op.xy), 0.75, rad)
    : tr_tube(abs(vec2(length(op.xy) - 0.5, op.z)), 0.75, rad);

  bool detailLikely = true;
  if (chooseStraight) {
    // Straight tube: bands/holes are confined near |z| <= ~0.06 and around
    // the cross-section rim. If we're well outside both, band/peg cannot be
    // closer than the main tube.
    float zAbs = abs(op.z);
    float rimDev = abs(length(op.xy) - rad);
    detailLikely = (zAbs < 0.18) || (rimDev < 0.10);
  } else {
    // Toroidal segment: decorations live near the ring locus and around the
    // minor axis. If we're away from both, main tube dominates.
    float minorAbs = abs(op.z);
    float ringDev = abs(length(op.xy) - 0.5);
    detailLikely = (minorAbs < 0.16) || (ringDev < (rad + 0.11));
  }

  if (!detailLikely) {
    // Outside decoration influence; safe to return main tube.
    trap = fract(rnd * 3.17);
    return tbMain;
  }

  vec4 dec = chooseStraight ? tr_straightTube(op, rad) : tr_torTube(op, rad);
  float d;
  float dMain;
  {
    // Combine chosen segment: main tube + sleeve with optional smoothing
    if (u_truchetSmooth) {
      float kScale = clamp(u_truchetSmoothK, 0.0, 0.5);
      float smK = clamp(rad * (0.02 + kScale), 0.003, 0.06);
      float tbBand = smin(dec.x, dec.y, smK);
      dMain = min(tbBand, dec.z);
    } else {
      dMain = min(min(dec.x, dec.y), dec.z);
    }
  }

  // Optional cheap symmetric join band (analytic ring around join loci)
  if (u_truchetJoinRing) {
    float k = clamp(u_truchetJoinRingK, 0.5, 1.8);
    // Pick nearest torus test and straight test OPs
    vec3 opT = (tb1.w < tb2.w) ? tb1.xyz : tb2.xyz;
    vec3 opS = tb3.xyz;
    // Torus ring: around ring radius 0.5 in XY, with small height in Z
    float rrT = abs(length(opT.xy) - 0.5);
    float wRT = 0.035 * k;   // radial half-width
    float hZT = 0.030 * k;   // z half-height
    float dT = 1e5;
    if (rrT < (wRT + 0.12)) {
      dT = max(rrT - wRT, abs(opT.z) - hZT);
    }
    // Straight ring: around tube radius in XY, with small height around z≈0
    float rS = abs(length(opS.xy) - clamp(u_truchetRadius, 0.03, 0.16));
    float wRS = max(0.020 * k, 0.75 * wRT);
    float hZS = 0.028 * k;
    float dS = 1e5;
    if (abs(opS.z) < (hZS + 0.12)) {
      dS = max(rS - wRS, abs(opS.z) - hZS);
    }
    float dRing = min(dT, dS);
    d = min(dMain, dRing);
  } else {
    d = dMain;
  }

  // Trap: blend segment id and local decoration — keeps nice palette bands
  float seg = abs(dec.w);
  trap = fract(seg * 0.173 + rnd * 3.17);
  return d;
}

// World wrapper with tiling and scaling
float deTruchetPipesWorld(vec3 p, out float trap){
  float tile = max(0.5, u_worldTile);
  // Rotate as with other worlds to honor u_rotation
  vec3 q = rotate3D(p, u_rotation);
  // Scale world space into unit-truchet space
  q /= tile;
  // Gating: only allow fast path beyond a minimum world-space distance from camera
  bool allowFast = (length(p - u_cameraPos) > max(0.0, u_truchetFastMinDist));
  float d = deTruchetPipesUnit(q, trap, allowFast);
  // Apply global DE safety scaling shared with other world types
  return d * tile * clamp(u_worldDeScale, 0.5, 1.0);
}

// Shadow-only simplified unit map: always use main tube with conservative margin
float deTruchetPipesUnitShadow(vec3 p, out float trap){
  // Random ID per grid cube
  float rnd = fract(sin(dot(floor(p + vec3(111.0, 73.0, 27.0)), vec3(7.63, 157.31, 113.97))) * 43758.5453);
  float rnd2 = fract(rnd * 41739.7613 + 0.131);
  vec3 q = fract(p) - 0.5;
  if (rnd > 0.833) q = q.xzy; else if (rnd > 0.666) q = q.yxz; else if (rnd > 0.5) q = q.yzx; else if (rnd > 0.333) q = q.zxy; else if (rnd > 0.166) q = q.zyx;
  vec4 tb1 = tr_torTubeTest(vec3(q.xy + 0.5, q.z));
  vec4 tb2, tb3;
  if (rnd2 > 0.66 || u_truchetVariant == 1) {
    tb2 = tr_torTubeTest(vec3(q.yz - 0.5, q.x));
    tb3 = tr_torTubeTest(vec3(q.xz - vec2(0.5, -0.5), q.y));
  } else if (u_truchetVariant == 2) {
    tb2 = tr_straightTubeTest(vec3(q.xy - 0.5, q.z));
    tb3 = tr_straightTubeTest(q);
  } else {
    tb2 = tr_torTubeTest(vec3(q.xy - 0.5, q.z));
    tb3 = tr_straightTubeTest(q);
  }
  vec3 op = (tb1.w < tb2.w && tb1.w < tb3.w) ? tb1.xyz : (tb2.w < tb3.w ? tb2.xyz : tb3.xyz);
  float rad = clamp(u_truchetRadius, 0.03, 0.16);
  bool chooseStraight = ((rnd2 <= 0.66 && tb3.w < tb1.w && tb3.w < tb2.w) || u_truchetVariant == 2);
  float tbQuick = chooseStraight ? tr_tube(abs(op.xy), 0.75, rad)
                                : tr_tube(abs(vec2(length(op.xy) - 0.5, op.z)), 0.75, rad);
  // Region-aware conservative margin: larger near sleeves/portals to avoid
  // under-shading from simplified shadow SDF.
  float base = clamp(u_truchetFastMargin * 1.35, 0.025, 0.09);
  float extra = 0.0;
  if (chooseStraight) {
    float zAbs = abs(op.z);
    float rimDev = abs(length(op.xy) - rad);
    extra = (step(zAbs, 0.18) + step(rimDev, 0.10)) * 0.0075; // up to +0.015
  } else {
    float minorAbs = abs(op.z);
    float ringDev = abs(length(op.xy) - 0.5);
    extra = (step(minorAbs, 0.16) + step(ringDev, rad + 0.11)) * 0.0075;
  }
  float margin = min(0.10, base + extra + rad * 0.06);
  trap = fract(rnd * 3.17);
  return tbQuick - margin;
}

// Shadow variant: forces conservative fast-path ON regardless of camera distance.
// Used to speed up soft-shadow SDF evaluations; kept conservative via the
// same margin (u_truchetFastMargin) so it does not over-shorten penumbrae.
float deTruchetPipesWorldShadow(vec3 p, out float trap){
  float tile = max(0.5, u_worldTile);
  vec3 q = rotate3D(p, u_rotation) / tile;
  float d = deTruchetPipesUnitShadow(q, trap);
  return d * tile * clamp(u_worldDeScale, 0.5, 1.0);
}
