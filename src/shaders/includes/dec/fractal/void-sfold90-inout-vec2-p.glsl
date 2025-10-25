// DEC SDF: void sFold90( inout vec2 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-sfold90-inout-vec2-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec2 v=normalize(vec2(1.0,-1.0));
    float g=dot(p,v);
    p-=(g-sqrt(g*g+1e-1))*v;
  }

  float de( vec3 p ){
  #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
    p=abs(p)-1.8;
    sFold90(p.zy);
    sFold90(p.xy);
    sFold90(p.zx);
    float s=2.;
    vec3  offset=p*.5;
    for(int i=0;i<8;i++){
      p=1.-abs(p-1.);
      float r=-1.3*max(1.5/dot(p,p),1.5);
      s*=r; p*=r; p+=offset;
      p.zx*=rot(-1.2);
    }
    s=abs(s); float a=8.5;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
