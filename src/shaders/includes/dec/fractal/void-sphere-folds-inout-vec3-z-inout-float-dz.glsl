// DEC SDF: void sphere_folds(inout vec3 z, inout float dz) {
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-sphere-folds-inout-vec3-z-inout-float-dz.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float fixed_radius2 = 1.9;
    float min_radius2 = 0.1;
    float r2 = dot(z, z);
    if(r2 < min_radius2) {
      float temp = (fixed_radius2 / min_radius2);
      z *= temp; dz *= temp;
    }else if(r2 < fixed_radius2) {
      float temp = (fixed_radius2 / r2);
      z *= temp; dz *= temp;
    }
  }

  float de(vec3 p0){
    vec4 p = vec4(p0, 1.);
    escape = 0.;
    if(p.x < p.z)p.xz = p.zx;
    if(p.z > p.y)p.zy = p.yz;
    if(p.y > p.x)p.yx = p.xy;

    for(int i = 0; i < 12; i++){
      if(p.z > p.y)p.zy = p.yz;
      if(p.y > p.x)p.yx = p.xy;
      sphere_folds(p.xyz,p.w);
      uint seed = uint(p.x+p.y+p.z);
      p*=(3.1/min(dot(p.xyz,p.xyz),1.9));
      p.xyz=abs(p.xyz)-vec3(0.5,2.7,6.2);
      p.yz -= sin(float(i)*2.)*0.7;
      escape += exp(-0.2*dot(p.xyz,p.xyz));
    }
    float m = 3.5;
    p.xyz-=clamp(p.xyz,-m,m);
    return length(p.xyz)/p.w;
  }
