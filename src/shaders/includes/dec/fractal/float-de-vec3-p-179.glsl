// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-179.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e,v,u;
  e = v = 2;
  for(int j=0;j++<12;j>3?e=min(e,length(p.xz+length(p)/u*.55)/v-.006),p.xz=abs(p.xz)-.7,p:p=abs(p)-.86)
    v /= u = dot( p, p ),
    p /= u,
    p.y = 1.7 - p.y;
  return e;
}
