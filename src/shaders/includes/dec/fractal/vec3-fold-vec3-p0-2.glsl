// DEC SDF: vec3 fold(vec3 p0){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-fold-vec3-p0-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 p = p0;
    if(length(p) > 2.)return p;
    p = mod(p,2.)-1.;
    return p;
  }

  float de( vec3 p0 ){
    vec4 p = vec4(p0, 1.);
    escape = 0.;
    if(p.x > p.z)p.xz = p.zx;
    if(p.z > p.y)p.zy = p.yz;
    if(p.y > p.x)p.yx = p.xy;
    p = abs(p);
    for(int i = 0; i < 8; i++){
      p.xyz = fold(p.xyz);
      p.xyz = fract(p.xyz*0.5 - 1.)*2.-1.0;
      p*=(1.1/clamp(dot(p.xyz,p.xyz),-0.1,1.));
    }
    p/=p.w;
    return abs(p.x)*0.25;
  }
