// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-182.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e,s;
  e=s=2.;
  for(int i=0;i++<6;s*=2.,p*=2.)
    p=.1-abs(abs(p)-.2),
    p=p.x<p.y?p.zxy:p.zyx,
    e=min(e,(length(vec2(length(p.xy)-1.,p.z)))/s+5e-4);
  return e;
}

