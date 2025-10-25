// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-90.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float i,j,e,g,h,s;
    p.y-=p.z*.5;
    for(j=s=h=.01;j++<9.;s+=s)
      p.xz*=rotate2D(2.),
      h+=abs(sin(p.x*s)*sin(p.z*s))/s;
    return max(0.,p.y+h);
  }
