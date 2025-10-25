// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float hash(float x){
    return fract(sin(x*234.123+156.2));
  }
  float lpNorm(vec3 p, float n){
    p = pow(abs(p), vec3(n));
    return pow(p.x+p.y+p.z, 1.0/n);
  }
  float de(vec3 p){
    vec2 id=floor(p.xz);
    p.xz=mod(p.xz,1.)-.5;
    p.y=abs(p.y)-.5;
    p.y=abs(p.y)-.5;
    p.xy*=rot(hash(dot(id,vec2(12.3,46.7))));
    p.yz*=rot(hash(dot(id,vec2(32.9,76.2))));
    float s = 1.;
    for(int i = 0; i < 6; i++) {
      float r2=1.2/pow(lpNorm(p.xyz, 5.0),1.5);
      p-=.1; p*=r2; s*=r2; p=p-2.*round(p/2.);
    }
    return .6*dot(abs(p),normalize(vec3(1.0,2.0,3.0)))/s-.002;
  }
