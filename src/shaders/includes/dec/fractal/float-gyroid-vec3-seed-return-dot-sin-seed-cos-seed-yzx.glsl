// DEC SDF: float gyroid (vec3 seed) { return dot(sin(seed),cos(seed.yzx)); }
// Category: fractal | Author: leon
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-gyroid-vec3-seed-return-dot-sin-seed-cos-seed-yzx.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float fbm (vec3 seed) {
  float result = 0.;
  float a = .5;
  for (int i = 0; i < 5; ++i) {
    result += gyroid(seed/a+result/a)*a;
    a /= 2.;
  }
  return result;
}
float de(vec3 p){
  // spicy fbm cyclic gyroid noise
  float details = sin(time*.2-fbm(p)+length(p));
  return max(abs(details*.05), p.z+2.);
}

