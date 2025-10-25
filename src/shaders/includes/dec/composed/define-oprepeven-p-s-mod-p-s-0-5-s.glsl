// DEC SDF: #define opRepEven(p,s) mod(p,s)-0.5*s
// Category: composed | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/define-oprepeven-p-s-mod-p-s-0-5-s.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define opRepOdd(p,s) p-s*round(p/s)
  #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
  float lpNorm_83(vec3 p, float n){
  	p = pow(abs(p), vec3(n));
  	return pow(p.x+p.y+p.z, 1.0/n);
  }
  vec2 pSFold_83(vec2 p,float n){
    float h=floor(log2(n)),a =6.2831*exp2(h)/n;
    for(float i=0.0; i < h+2.0; i++){
      vec2 v = vec2(-cos(a),sin(a));
      float g= dot(p,v);
      p-= (g - sqrt(g * g + 5e-3))*v;
      a*=0.5;
    }
    return p;
  }
  vec2 sFold45_83(vec2 p, float k){
    vec2 v = vec2(-1.0,1.0)*0.7071;
    float g= dot(p,v);
    return p-(g-sqrt(g*g+k))*v;
  }
  float frameBox_83(vec3 p, vec3 s, float r){
    p = abs(p)-s;
    p.yz=sFold45_83(p.yz, 1e-3);
    p.xy=sFold45_83(p.xy, 1e-3);
    p.x = max(0.0,p.x);
    return lpNorm_83(p,5.0)-r;
  }
  float sdRoundBox_83( vec3 p, vec3 b, float r ){
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
  }
  float deObj_83(vec3 p){
    return min(sdRoundBox_83(p,vec3(0.3),0.05),frameBox_83(p,vec3(0.8),0.1));
  }
  float de(vec3 p){
    float de=1.0;
    // p.z-=iTime*1.1;
    vec3 q= p;
    p.xy=pSFold_83(-p.xy,3.0);
    p.y-=8.5;
    p.xz=opRepEven(p.xz,8.5);
    float de1=length(p.yz)-1.;
    de=min(de,de1);
    p.xz=pSFold_83(p.xz,8.0);
    p.z-=2.0;
    float rate=0.5;
    float s=1.0;
    for(int i=0;i<3;i++){
      p.xy=abs(p.xy)-.8;
      p.xz=abs(p.xz)-0.5;
      p.xy*=rot(0.2);
      p.xz*=rot(-0.9);
      s*=rate;
      p*=rate;
      de=min(de,deObj_83(p/s));
    }
    q.z=opRepOdd(q.z,8.5);
    float de0=length(q)-1.5;
    de=min(de,de0);
    return de;
  }
