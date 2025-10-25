// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: catzpaw
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-186.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define F d=max(d,(1.2-length(sin(p*s)))/s);p+=s*=1.3
  float l=.1,d=l,s,i;
  d=0.;
  s=1.;
  F;
  F;
  l+=F;
  F*5.;
  F;
  #undef F
  return d;
}
