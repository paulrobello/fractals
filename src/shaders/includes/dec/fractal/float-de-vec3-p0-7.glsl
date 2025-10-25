// DEC SDF: float de(vec3 p0){
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p0-7.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p0=p0/10.;
    p0 = mod(p0, 2.)-1.;
    vec4 p = vec4(p0, 1.);
    p=abs(p);
    if(p.x < p.z)p.xz = p.zx;
    if(p.z < p.y)p.zy = p.yz;
    if(p.y < p.x)p.yx = p.xy;
    for(int i = 0; i < 8; i++){
      if(p.x < p.z)p.xz = p.zx;
      if(p.z < p.y)p.zy = p.yz;
      if(p.y < p.x)p.yx = p.xy;
      p.xyz = abs(p.xyz);
      p*=(1.6/clamp(dot(p.xyz,p.xyz),0.6,1.));
      p.xyz-=vec3(0.7,1.8,0.5);
      p*=1.2;
    }
    float m = 1.5;
    p.xyz-=clamp(p.xyz,-m,m);
    return (length(p.xyz)/p.w)*10.;
  }
