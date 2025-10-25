// DEC SDF: vec2 Rot2D(vec2 q, float a)
// Category: composed | Author: dr2
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/vec2-rot2d-vec2-q-float-a-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

{
    vec2 cs;
    cs = sin (a + vec2(0.5 * M_PI, 0.));
    return vec2(dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
  }
  float PrBoxDf(vec3 p, vec3 b)
  {
    vec3 d;
    d = abs (p) - b;
    return min (max (d.x, max (d.y, d.z)), 0.) + length (max (d, 0.));
  }
  float de(vec3 p)
  {
    vec3 b;
    float r, a;
    const float nIt = 5., sclFac = 2.4;
    b = (sclFac - 1.) * vec3(1., 1.125, 0.625);
    r = length (p.xz);
    a = (r > 0.) ? atan (p.z, - p.x) / (2. * M_PI) : 0.;
    p.x = mod (16. * a + 1., 2.) - 1.;
    p.z = r - 32. / (2. * M_PI);
    p.yz = Rot2D (p.yz, M_PI * a);
    for (float n = 0.; n < nIt; n ++) {
      p = abs (p);
      p.xy = (p.x > p.y) ? p.xy : p.yx;
      p.xz = (p.x > p.z) ? p.xz : p.zx;
      p.yz = (p.y > p.z) ? p.yz : p.zy;
      p = sclFac * p - b;
      p.z += b.z * step (p.z, -0.5 * b.z);
    }
    return 0.8 * PrBoxDf (p, vec3(1.)) / pow (sclFac, nIt);
  }
