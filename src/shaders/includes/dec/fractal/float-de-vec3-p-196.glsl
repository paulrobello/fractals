// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-196.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s=2., e, g, l;
  p=abs(mod(p-1.,2.)-1.)-1.;
  for(int j=0;j<8;j++)
    p=1.-abs(p-1.),
    p=p*(l=-1./dot(p,p))-vec3(.1,.3,.1),
    s*=abs(l);
    g+=e=length(p.xz)/s;
  return e;
}

