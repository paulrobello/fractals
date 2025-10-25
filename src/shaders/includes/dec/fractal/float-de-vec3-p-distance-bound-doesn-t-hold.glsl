// DEC SDF: float de(vec3 p){  (distance bound doesn't hold)
// Category: fractal | Author: catzpaw
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-distance-bound-doesn-t-hold.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 v=vec3(0.0,1.5,6.3);
    return min(6.-length((p-v).xy+sin(p.yx)),
      dot(cos(p),sin(p.yzx)))+sin(sin(p.z*3.5)+v.z)*.1+1.;
  }
