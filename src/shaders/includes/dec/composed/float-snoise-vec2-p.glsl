// DEC SDF: float snoise(vec2 p) {
// Category: composed | Author: karang
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-snoise-vec2-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec2 f = fract(p);
    p = floor(p);
    float v = p.x+p.y*1000.0;
    vec4 r = vec4(v, v+1.0, v+1000.0, v+1001.0);
    r = fract(100000.0*sin(r*.001));
    f = f*f*(3.0-2.0*f);
    return 2.0*(mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y))-1.0;
  }
  float terrain(vec2 p, int octaves) {
    float h = 0.0;
    float w = 0.5;
    float m = 0.4;
    for (int i=0; i<12; i++) {
      if (i==octaves) break;
      h += w * snoise((p * m));
      w *= 0.5;
      m *= 2.0;
    }
    return h;
  }
  float terrainSand(vec2 p, int octaves) {
    float h = 0.0;
    float f = 1.0;
    for (int i=0 ; i<12 ; i++) {
      if (i==octaves) break;
      h += abs(snoise(p*f)/f);
      f *= 2.0;
    }
    return h;
  }
  float map(vec3 p) {
    float dMin = 28.0;
    float d;
    escape = -1.0;
    int octaves = 9;
    float h = terrain(p.xz, octaves);
    h += smoothstep(0.0, 1.1, h);
    h += smoothstep(-0.1, 1.0, p.y)*0.6;
    d = p.y - h;
    if (d<dMin) { // Mountains
      dMin = d;
      escape = 0.0;
    }
    if (h<0.5) { // Sand dunes
      float s = 0.3 * terrainSand(p.xz*0.2, octaves);
      d = p.y -0.35 + s;
      if (d<dMin) {
        dMin = d;
        escape = 1.1;
      }
    }
    return dMin;
  }
