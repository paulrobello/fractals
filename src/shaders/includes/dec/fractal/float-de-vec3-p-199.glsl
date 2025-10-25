// DEC SDF: float de(vec3 p) {
// Category: fractal | Author: i_dianov
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-199.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float ss=1.;
  for(float j=0.;j++<4.;){
    float scale = 1.0/dot(p,p);
    float r1=.77, r2=1.;
    scale = clamp(scale, 1./(r2*r2), 1./(r1*r1));
    p *= scale;
    ss *= scale;
    p *= 3.;
    ss *= 3.;
    p=p-(1.6)*clamp(p,-1.,1.);
  }
  float si=.9;
  p-=clamp(p,-si,si);
  return abs(length(p)-.001)/ss;
}

