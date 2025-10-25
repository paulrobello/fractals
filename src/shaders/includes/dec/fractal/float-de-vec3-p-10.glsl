// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-10.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.xy=abs(p.xy)-2.;
    if(p.x < p.y)p.xy=p.yx;
    p.z=mod(p.z,4.)-2.;
    p.x-=3.2; p=abs(p);
    float s=2.;
    vec3 offset= p*1.5;
    for (float i=0.; i<5.; i++){
      p=1.-abs(p-1.);
      float r=-7.5*clamp(.38*max(1.2/dot(p,p),1.),0.,1.);
      s*=r; p*=r; p+=offset;
    }
    s=abs(s);
    float a=100.;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
