// DEC SDF: float de(vec3 p){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-96.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return (length(vec2((length(vec2(length(p.xy)-1.3,
      length(p.zy)-1.3))-.5), dot(cos(p*12.),sin(p.zxy*12.))*.1))-.02)*.3;
  }
