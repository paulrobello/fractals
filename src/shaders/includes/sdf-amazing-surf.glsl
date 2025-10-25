// Amazing Surf / Gyroid-style world (approximate DE)
// Creates a tunnel/arch network using a periodic implicit surface.

// Repeat space by a period (centered repeat)
vec3 repeatCentered(vec3 p, float period) {
  return mod(p + period * 0.5, period) - period * 0.5;
}
vec2 repeatCentered(vec2 p, float period) { // overload for 2D
  return mod(p + period * 0.5, period) - period * 0.5;
}

// Domain warp to break strict periodicity
vec3 warpDomain(vec3 p, float warp) {
  if (warp <= 0.0) return p;
  vec3 s1 = sin(p.zxy * 1.37);
  vec3 s2 = sin(p.yzx * 2.11);
  return p + warp * (s1 * 0.6 + s2 * 0.4);
}

// Gyroid-style implicit function and gradient
// f(p) = sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)
// DE ≈ (abs(f) - thickness) / |∇f|
float gyroidDE(vec3 p, float thickness) {
  float sx = sin(p.x), cx = cos(p.x);
  float sy = sin(p.y), cy = cos(p.y);
  float sz = sin(p.z), cz = cos(p.z);

  float f = sx * cy + sy * cz + sz * cx;
  // gradient
  vec3 g;
  g.x = cx * cy - sz * sx;          // df/dx
  g.y = -sx * sy + cy * cz;          // df/dy
  g.z = -sy * sz + cz * cx;          // df/dz
  // Conservative clamp: larger minimum gradient => smaller steps (safer)
  float gl = max(0.60, length(g));   // was 0.35
  float d = (abs(f) - thickness) / gl;
  return d;
}

// World distance estimator with tiling and warp
// Returns signed distance (approx) and writes an orbit trap proxy to trapOut
float deAmazingSurf(vec3 p, float tile, float thickness, float warp, float scale, out float trapOut) {
  // Centered repeat in X/Z; leave Y to keep vertical variation
  vec3 q = p;
  q.xz = repeatCentered(q.xz, tile);
  q = warpDomain(q, warp);
  q /= max(0.0001, scale);

  float d = gyroidDE(q, thickness);

  // Simple orbit-like trap using |f| and height
  float sx = sin(q.x), cx = cos(q.x);
  float sy = sin(q.y), cy = cos(q.y);
  float sz = sin(q.z), cz = cos(q.z);
  float f = abs(sx * cy + sy * cz + sz * cx);
  trapOut = clamp(f * 0.8 + abs(q.y) * 0.1, 0.0, 2.0);

  return d * scale; // additional de safety scaling applied in fragment via u_worldDeScale
}

// Generic, reusable procedural textures
#include "./procedural-textures.glsl"
