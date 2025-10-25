// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: sxolastikos
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-183.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float d;
  p.z-=6.;
  p.yz*=rotate2D(1.57);
  for(int j=0;j++<4;)
    p=abs(fract(abs(p))-.1),
    d=dot(p.z,max(p.x,p.y))-.001,
    d-=.8*min(d,dot(p,p-vec3(-1.0)));
  return d*4.;
}
