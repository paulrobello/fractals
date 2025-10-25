// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-174.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p = asin( sin( p ) ) - vec3( 2., -3., 0. );
  float e=0., s=2.;
  for(int i=0;i++<8;p=p*e-vec3(1.0,3.0,7.0))
    p=abs(p),
    p=p.x<p.y?p.zxy:p.zyx,
    s*=e=2./clamp(dot(p,p),.2,1.);
  return e=abs(length(p-clamp(p,-5.,5.))-5.)/s+1e-5;
}
