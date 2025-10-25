// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-184.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s,e;
  vec3 q=p*2.;
  s=3.;
  for(int j=0;j++<8;s*=e)
    p=sign(p)*(1.-abs(abs(p-2.)-1.)),
    p=p*(e=6./min(dot(p,p)+.3,3.))+q-vec3(3.0,1.0,12.0);
  return length(p)/s;
}
