// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: i_dianov
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-195.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 I=p;
  float e=9.0;
  float d=0.0;
  vec2 uv = p.xy / 2.0;
  for(float j=0;j<PI;j+=PI/3.)
    p=I,
    p.x+=j*4.,
    p.y+=sin(p.x*.5),
    p.z+=sin(p.x)*.5,
    e=min(e,(length(p.yz)-length(uv)/4.)*.8);
    d+=e;
  return d;
}
