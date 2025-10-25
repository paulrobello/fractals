// DEC SDF: float de(vec3 p){
// Category: fractal | Author: Unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-140.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float s = 1.;
    escape = 0.;
    float t = 999.;
    for(int i = 0; i < 12; i++){
      p=abs(p);
      p.yz = (p.y > p.z)?p.zy:p.yz;
      p.xz = (p.x > p.z)?p.zx:p.xz;
      p.yx = (p.y > p.x)?p.xy:p.yx;
      s *= 4.0/clamp(dot(p,p),0., 11.);
      p *= 4.0/clamp(dot(p,p), 0., 11.);
      p = vec3(2.,4.,2.)-abs(p-vec3(2.,4.,2.));
      t = min(t, (abs(p.x)/s)*0.76);
      escape += exp(-0.4*dot(p,p));
    }
    return t;
  }
