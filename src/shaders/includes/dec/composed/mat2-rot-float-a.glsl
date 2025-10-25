// DEC SDF: mat2 rot(float a) {
// Category: composed | Author: Kali
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/mat2-rot-float-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2(cos(a),sin(a),-sin(a),cos(a));
  }
  vec4 formula(vec4 p) {
    p.xz = abs(p.xz+1.)-abs(p.xz-1.)-p.xz;
    p=p*2./clamp(dot(p.xyz,p.xyz),.15,1.)-vec4(0.5,0.5,0.8,0.);
    p.xy*=rot(.5);
    return p;
  }
  float screen(vec3 p) {
    float d1=length(p.yz-vec2(.25,0.))-.5;
    float d2=length(p.yz-vec2(.25,2.))-.5;
    return min(max(d1,abs(p.x-.3)-.01),max(d2,abs(p.x+2.3)-.01));
  }
  float de(vec3 pos) {
    vec3 tpos=pos;
    tpos.z=abs(2.-mod(tpos.z,4.));
    vec4 p=vec4(tpos,1.5);
    float y=max(0.,.35-abs(pos.y-3.35))/.35;

    for (int i=0; i<8; i++) {p=formula(p);}
    float fr=max(-tpos.x-4.,(length(max(vec2(0.),p.yz-3.)))/p.w);

    float sc=screen(tpos);
    return min(sc,fr);
  }
