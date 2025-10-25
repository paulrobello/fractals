// DEC SDF: float de(vec3 p0){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p0-15.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p0 = mod(p0, 2.)-1.;
    vec4 p = vec4(p0, 1.);
    //escape = 0.;
    p=abs(p);
    for(int i = 0; i < 8; i++){
      if(p.x > p.z)p.xz = p.zx;
      if(p.z > p.y)p.zy = p.yz;
      if(p.y > p.x)p.yx = p.xy;
      p*=(1.4/clamp(dot(p.xyz,p.xyz),0.1,1.));
      p.xyz = vec3(2.,4.,2.)-(abs(p.xyz - vec3(2.,4.,1.)));
      //escape += exp(-0.2*dot(p.xyz,p.xyz));
    }
    float m = 1.5;
    p.xyz-=clamp(p.xyz,-m,m);
    return length(p.xyz)/p.w;
  }
