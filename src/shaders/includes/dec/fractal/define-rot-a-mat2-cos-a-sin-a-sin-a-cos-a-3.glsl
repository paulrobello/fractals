// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    p=abs(p)-3.;
    if(p.x < p.z)p.xz=p.zx;
    if(p.y < p.z)p.yz=p.zy;
    if(p.x < p.y)p.xy=p.yx;
    float s=2.; vec3 off=p*.5;
    for(int i=0;i<12;i++){
      p=1.-abs(p-1.);
      float k=-1.1*max(1.5/dot(p,p),1.5);
      s*=abs(k); p*=k; p+=off;
      p.zx*=rot(-1.2);
    }
    float a=2.5;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
