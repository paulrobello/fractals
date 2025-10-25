// DEC SDF: // modification of above
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/modification-of-above.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define PI 3.14159265
mat2 Rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}
float sdTorus(vec3 p, float smallRadius, float largeRadius) {
  return length(vec2(length(p.xz) - largeRadius, p.y)) - smallRadius;
}
float de(vec3 p) {
  float t = time;
  p.y -= 1.5;
  float scale = 0.7;
  float torus = sdTorus(p, .4, 1.5);
  for (int i = 0; i < 9; i++) {
    p.xz = abs(p.xz);
    p.xz -= 1.;
    p /= scale;
    p.yz *= Rot(PI / 2.);
    p.xy *= Rot(PI / 4.);
    float newTorus = sdTorus(p, .4, 1.5) * pow(scale, float(i+1));
    torus = min( torus, newTorus );
  }
  return torus;
}

