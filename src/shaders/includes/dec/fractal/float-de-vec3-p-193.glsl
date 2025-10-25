// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: catzpaw
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-193.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float e=2.,s;
  vec3 c=vec3(4.0,.1,1.5);
  p.y+=1.4;
  for(int j=0;++j<7;p=abs(p)-1.5,e/=s=min(dot(p,p),.4),p/=s);
  return (p.x+p.z)/e;
}
