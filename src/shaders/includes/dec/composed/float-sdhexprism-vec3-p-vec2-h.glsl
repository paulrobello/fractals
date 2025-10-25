// DEC SDF: float sdHexPrism( vec3 p, vec2 h ){
// Category: composed | Author: russ
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-sdhexprism-vec3-p-vec2-h.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
         length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
         p.z-h.y );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
  }

  float sdCrossHex( in vec3 p ){
    float sdh1= sdHexPrism(  p-vec3(0.0), vec2(1.0,1.0) );
    float sdh2= sdHexPrism(  p-vec3(0.0), vec2(0.5,1.5) );
    float sdh3= sdHexPrism(  p.xzy-vec3(0.0), vec2(0.5,1.1) );
    float sdh4= sdHexPrism(  p.yzx-vec3(0.0), vec2(0.5,1.5) );
    return max( max( max(sdh1, -sdh2), -sdh3),-sdh4);
  }

  float sdCrossRep(vec3 p) {
    vec3 q = mod(p + 1.0, 2.0) - 1.0;
    return sdCrossHex(q);
  }

  float sdCrossRepScale(vec3 p, float s) {
    return sdCrossRep(p * s) / s;
  }

  float de(vec3 p) {
    float scale = 3.025;
    float dist= sdHexPrism(p, vec2(1.0,2.0) );
    for (int i = 0; i < 5; i++) {
      dist = max(dist, -sdCrossRepScale(p, scale));
      scale *= 3.0;
    }
    return dist;
  }
