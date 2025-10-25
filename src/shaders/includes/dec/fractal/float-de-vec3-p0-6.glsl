// DEC SDF: float de(vec3 p0){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p0-6.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec4 p = vec4(p0/10., 1.);
    escape = 0.; p=abs(p);
    if(p.x < p.z)p.xz = p.zx;
    if(p.z < p.y)p.zy = p.yz;
    if(p.y < p.x)p.yx = p.xy;
    for(int i = 0; i < 6; i++){
      if(p.x < p.z)p.xz = p.zx;
      if(p.z < p.y)p.zy = p.yz;
      if(p.y < p.x)p.yx = p.xy;
      p = abs(p);
      p*=(2./clamp(dot(p.xyz,p.xyz),0.1,1.));
      p.xyz-=vec3(0.9,1.9,0.9);
    }
    float m = 1.5;
    p.xyz-=clamp(p.xyz,-m,m);
    return (length(p.xyz)/p.w)*10.;
  }
