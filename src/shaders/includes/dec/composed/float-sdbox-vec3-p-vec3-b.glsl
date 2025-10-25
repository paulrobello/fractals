// DEC SDF: float sdBox( vec3 p, vec3 b ){
// Category: composed | Author: plento
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-sdbox-vec3-p-vec3-b.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
  }

  vec2 rotate(vec2 k,float t){
    return vec2(cos(t) * k.x - sin(t) * k.y, sin(t) * k.x + cos(t) * k.y);
  }

  float de(vec3 pos){
    vec3 b = vec3(0.9 , 4.5, 0.70);
    float p = sin(pos.z * 0.1) * 2.0;

    pos = vec3(rotate(pos.xy, p), pos.z);
    pos.y += 1.2;
    pos = mod(pos, b) -0.5 * b;
    pos.x *= sin(length(pos * 1.8) * 2.0) * 1.4;

    return sdBox(pos - vec3(0.0, 0.0, 0.0), vec3(0.4));
  }
