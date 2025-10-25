// DEC SDF: vec3 fold( vec3 p0 ){
// Category: fractal | Author: unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-fold-vec3-p0.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 p = p0;
    if(length(p) > 1.2) return p;
    p = mod(p,2.)-1.;
    return p;
  }

  float de( vec3 p0 ){
    vec4 p = vec4(p0, 1.);
    for(int i = 0; i < 12; i++){
      if(p.x > p.z)p.xz = p.zx;
      if(p.z > p.y)p.zy = p.yz;
      p = abs(p);
      p.xyz = fold(p.xyz);
      p.xyz = mod(p.xyz-1., 2.)-1.;
      p*=(1.2/dot(p.xyz,p.xyz));
    }
    p/=p.w;
    return abs(p.x)*0.25;
  }
