// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-181.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

// added some clamping to prevent potential div by 0
  float y,s,e;
  p+=vec3(1.0);
  y=p.y*.3-.3;
  s=9.;
  for(int j=0;j++<9;p/=max(e,0.0001))
    p=mod(p-1.,2.)-1.,
    p.zx*=rotate2D(PI/4.0),
    e = dot(p,p)*(0.6+y),
    s /= max(e,0.0001);
  return e=sqrt(e)/s;
}

