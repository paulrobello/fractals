// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    for(int j=0;++j<8;)
      p.z-=.3,
      p.xz=abs(p.xz),
      p.xz=(p.z>p.x)?p.zx:p.xz,
      p.xy=(p.y>p.x)?p.yx:p.xy,
      p.z=1.-abs(p.z-1.),
      p=p*3.-vec3(10.0,4.0,2.0);

    return length(p)/6e3-.001;
  }
