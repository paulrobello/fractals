// DEC SDF: float de( vec3 pos ) {
// Category: fractal | Author: unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-pos.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define SCALE 2.8
    #define MINRAD2 .25
    #define scale (vec4(SCALE, SCALE, SCALE, abs(SCALE)) / minRad2)
    float minRad2 = clamp(MINRAD2, 1.0e-9, 1.0);
    float absScalem1 = abs(SCALE - 1.0);
    float AbsScale = pow(abs(SCALE), float(1-10));
    vec4 p = vec4(pos,1.0);
    vec4 p0 = p;
    for (int i = 0; i < 9; i++)
    {
      p.xyz = clamp(p.xyz, -1.0, 1.0) * 2.0 - p.xyz;
      float r2 = dot(p.xyz, p.xyz);
      p *= clamp(max(minRad2/r2, minRad2), 0.0, 1.0);
      p = p*scale + p0;
    }
    return ((length(p.xyz) - absScalem1) / p.w - AbsScale);
  }
