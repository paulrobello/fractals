// Space transform and DE/bounds helpers for all fractals
// Requires: rotate3D(), rotate3DInv(), rotationAlign(), uniforms

// Mandelbox normalization scale (kept consistent project-wide)
const float MB_NORM = 0.25;

// --- Local-space transforms ---

// Mandelbulb
vec3 mbToLocal(vec3 p) {
  vec3 rotated = rotate3D(p, u_rotation);
  return (rotated - u_zoomCenter) / u_fractalScale;
}
vec3 mbNormalToWorld(vec3 nLocal) {
  return rotate3DInv(nLocal, u_rotation);
}

// Menger
vec3 mgToLocal(vec3 p) {
  vec3 rotated = rotate3D(p, u_rotation);
  return (rotated - u_zoomCenter) / u_fractalScale;
}
vec3 mgNormalToWorld(vec3 nLocal) {
  return rotate3DInv(nLocal, u_rotation);
}

// Mandelbox
vec3 mbxToLocal(vec3 p) {
  vec3 rotated = rotate3D(p, u_rotation);
  return (rotated - u_zoomCenter) / (u_fractalScale * MB_NORM);
}
vec3 mbxNormalToWorld(vec3 nLocal) {
  return rotate3DInv(nLocal, u_rotation);
}

// Sierpinski (align apex→+Y, then apply user rotation, then scale)
mat3 sierpAlignFwd() { return rotationAlign(vec3(1.0, 1.0, 1.0), vec3(0.0, 1.0, 0.0)); }
mat3 sierpAlignInv() { return rotationAlign(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0)); }

vec3 spToLocal(vec3 p) {
  vec3 q = p;
  if (!u_dbgBypassSierpinskiAlign) q = sierpAlignFwd() * q;
  if (!u_dbgBypassFractalRotation) q = rotate3D(q, u_rotation);
  return (q - u_zoomCenter) / u_fractalScale;
}
vec3 spDirWorldToLocal(vec3 v) {
  vec3 q = v;
  if (!u_dbgBypassSierpinskiAlign) q = sierpAlignFwd() * q;
  q = rotate3D(q, u_rotation);
  return q;
}

// --- World-space DE wrappers (apply proper local transform + rescale) ---

// Forward declaration for orbit trap helper used in World→DEC branch
float orbitTrapBoxy(vec3 fp);

float deMengerWorld(vec3 p) {
  vec3 fp = mgToLocal(p);
  return sdMenger(fp, u_iterations) * u_fractalScale;
}

float deMandelbulbWorld(vec3 p) {
  vec3 fp = mbToLocal(p);
  return sdMandelbulb(fp, u_iterations, u_fractalPower) * u_fractalScale;
}

vec2 deMandelbulbWorldWithTrap(vec3 p) {
  vec3 fp = mbToLocal(p);
  vec2 r = sdMandelbulbWithTrap(fp, u_iterations, u_fractalPower);
  return vec2(r.x * u_fractalScale, r.y);
}

float deSierpinskiWorld(vec3 p) {
  vec3 fp = spToLocal(p);
  return sdSierpinskiWithBase(fp, u_iterations, 2.0, max(0.2, u_sierpinskiBase)) * u_fractalScale;
}

float deMandelboxWorld(vec3 p) {
  vec3 fp = mbxToLocal(p);
  return sdMandelboxSimple(fp, u_iterations, -1.5) * (u_fractalScale * MB_NORM);
}

// --- World (Amazing Surf) wrapper ---
float deAmazingSurfWorld(vec3 p, out float trap) {
  vec3 fp = rotate3D(p, u_rotation);
  if (u_worldUseDEC) {
    // Use injected DEC distance directly as world surface (optional shell via worldThickness)
    float s = max(0.2, u_fractalScale);
    vec3 rotated = rotate3D(p - u_decOffset, u_rotation);
    vec3 pl = (rotated - u_zoomCenter) / s;
    float d0 = decUserDE(pl) * s;
    float d;
    if (u_worldThickness <= 0.001) {
      // Exact DEC surface
      d = d0;
    } else {
      // Shell around the DEC zero-set
      d = abs(d0) - clamp(u_worldThickness, 0.0, 0.6);
    }
    // Generic DEC orbit trap: boxy + radial
    float trapBox = orbitTrapBoxy(pl);
    float trapRad = length(pl) * 0.5;
    trap = mix(trapBox, trapRad, 0.35);
    return d * clamp(u_worldDeScale, 0.5, 1.0);
  } else {
    float d = deAmazingSurf(fp,
                            max(2.0, u_worldTile),
                            clamp(u_worldThickness, 0.02, 0.8),
                            clamp(u_worldWarp, 0.0, 2.0),
                            max(0.2, u_fractalScale),
                            trap) * clamp(u_worldDeScale, 0.5, 1.0);
    return d;
  }
}

// Shared orbit-trap blend for boxy fractals (Menger, Sierpinski, Mandelbox)
float orbitTrapBoxy(vec3 fp) {
  float t1 = abs(fp.x);
  float t2 = abs(fp.y);
  float t3 = abs(fp.z);
  float t4 = length(fp.xy);
  float t5 = length(fp.yz);
  return (t1 + t2 + t3 + 0.5 * (t4 + t5)) / 4.0;
}

// --- Conservative local bounds in world space (for culling) ---
float boundsDistanceWorld(vec3 p) {
  if (u_fractalType == 0) {
    return length(p) - 4.0;
  }
  if (u_fractalType == 1) {
    vec3 q = mgToLocal(p);
    return sdBox(q, vec3(1.1)) * u_fractalScale;
  }
  if (u_fractalType == 2) {
    vec3 q = mbToLocal(p);
    return (length(q) - 2.2) * u_fractalScale;
  }
  if (u_fractalType == 4) {
    vec3 q = mbxToLocal(p);
    const float MB_PAD = 0.6;
    return (sdBox(q, vec3(2.2)) - MB_PAD) * (u_fractalScale * MB_NORM);
  }
  if (u_fractalType == 5) {
    // Rotate and scale similarly to SDF call; use deAmazingSurf params conservatively.
    vec3 rotated = rotate3D(p, u_rotation);
    vec3 q = (rotated - u_zoomCenter) / max(0.5, u_fractalScale);
    float rad = max(2.0, u_worldTile * 0.9);
    return (length(q) - rad) * max(0.5, u_fractalScale);
  }
  if (u_fractalType == 6) {
    // Truchet pipes: conservative spherical bound in local truchet space
    vec3 rotated = rotate3D(p, u_rotation);
    vec3 q = (rotated - u_zoomCenter) / max(0.5, u_worldTile);
    // Tighter radius near the cell neighborhood; decorations are contained inside ~1.05
    // in unit Truchet space (coarse but safe). Further reduced for better culling.
    return (length(q) - 1.05) * max(0.5, u_worldTile);
  }
  // Default spherical bound in local scale
  vec3 rotated = rotate3D(p, u_rotation);
  vec3 q = (rotated - u_zoomCenter) / u_fractalScale;
  return (length(q) - 2.6) * u_fractalScale;
}
