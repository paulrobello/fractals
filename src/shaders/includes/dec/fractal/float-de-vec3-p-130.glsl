// DEC SDF: float de(vec3 p){
// Category: fractal | Author: shane
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-130.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

const vec3 offs = vec3(1.0, .75, .5); // Offset point.
    const vec2 a = sin(vec2(0.0, 1.57079632) + 1.57/2.);
    const mat2 m = mat2(a.y, -a.x, a);
    const vec2 a2 = sin(vec2(0.0, 1.57079632) + 1.57/4.);
    const mat2 m2 = mat2(a2.y, -a2.x, a2);
    const float s = 5.; // Scale factor.
    float d = 1e5; // Distance.
    p  = abs(fract(p*.5)*2. - 1.);
    float amp = 1./s;
    for(int i=0; i<2; i++){
      p.xy = m*p.xy;
      p.yz = m2*p.yz;
      p = abs(p);
      p.xy += step(p.x, p.y)*(p.yx - p.xy);
      p.xz += step(p.x, p.z)*(p.zx - p.xz);
      p.yz += step(p.y, p.z)*(p.zy - p.yz);
      p = p*s + offs*(1. - s);
      p.z -= step(p.z, offs.z*(1. - s)*.5)*offs.z*(1. - s);
      p=abs(p);
      d = min(d, max(max(p.x, p.y), p.z)*amp);
      amp /= s;
    }
    return d - .035;
  }
