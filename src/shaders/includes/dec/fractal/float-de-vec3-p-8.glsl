// DEC SDF: float de( vec3 p ) {
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-8.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
    p=abs(p)-2.;
    if(p.x < p.z)p.xz=p.zx;
    if(p.y < p.z)p.yz=p.zy;
    if(p.x < p.y)p.xy=p.yx;
    float s=2.5;
    vec3 off=p*2.8;
    for (float i=0.;i<6.;i++) {
      p=-sign(p)*(abs(abs(abs(p)-2.)-1.)-1.);
      float r=-11.*clamp(.8*max(2.5/dot(p,p),.2),.3,.6);
      s*=r; p*=r; p+=off;
      p.yz*=rot(2.1);
    }
    s=abs(s);
    float a=30.;
    p-=clamp(p,-a,a);
    return length(p)/s;
  }
