// DEC SDF: float de(vec3 pos){
// Category: fractal | Author: Kali
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-pos-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 tpos=pos;
    tpos.xz=abs(.5-mod(tpos.xz,1.));
    vec4 p=vec4(tpos,1.);
    float y=max(0.,.35-abs(pos.y-3.35))/.35;
    for (int i=0; i<7; i++) {
      p.xyz = abs(p.xyz)-vec3(-0.02,1.98,-0.02);
      p=p*(2.0+0.*y)/clamp(dot(p.xyz,p.xyz),.4,1.)-vec4(0.5,1.,0.4,0.);
      p.xz*=mat2(-0.416,-0.91,0.91,-0.416);
    }
    return (length(max(abs(p.xyz)-vec3(0.1,5.0,0.1),vec3(0.0)))-0.05)/p.w;
  }
