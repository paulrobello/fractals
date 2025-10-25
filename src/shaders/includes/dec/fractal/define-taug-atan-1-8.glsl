// DEC SDF: #define TAUg atan(1.)*8.
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-taug-atan-1-8.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec2 pmodg(vec2 p, float n){
    float a=mod(atan(p.y, p.x),TAUg/n)-.5 *TAUg/n;
    return length(p)*vec2(sin(a),cos(a));
  }

  float de( vec3 p ){
    for(int i=0;i<4;i++){
      p.xy = pmodg(p.xy,10.);  p.y-=2.;
      p.yz = pmodg(p.yz, 12.); p.z-=10.;
    }
    return dot(abs(p),normalize(vec3(13.0,1.0,7.0)))-.7;
  }
