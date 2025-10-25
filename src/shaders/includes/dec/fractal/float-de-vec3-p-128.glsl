// DEC SDF: float de(vec3 p){
// Category: fractal | Author: Kali
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-128.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.x = abs(p.x) - 3.3;
    p.z = mod(p.z + 2.0, 4.0) -  2.0;
    vec4 q = vec4(p, 1.0);
    q.xyz -= 1.0;
    q.xyz = q.zxy;
    for(int i = 0; i < 6; i++) {
      q.xyz = abs(q.xyz + 1.0) - 1.0;
      q /= clamp(dot(q.xyz, q.xyz), 0.25, 1.0);
      q *= 1.1;
      float s = sin(-0.35);
      float c = cos(-0.35);
      q.xy = mat2(c,s,-s,c)*q.xy;
    }
    return (length(q.xyz) - 1.5)/q.w;
  }
