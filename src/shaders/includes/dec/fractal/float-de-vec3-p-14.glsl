// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-14.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.x-=4.;
    p=mod(p,8.)-4.;
    for(int j=0;j<3;j++){
      p.xy=abs(p.xy)-.3;
      p.yz=abs(p.yz)+.7,
      p.xz=abs(p.xz)-.2;
    }
    return length(cross(p,vec3(.5)))-.1;
  }
