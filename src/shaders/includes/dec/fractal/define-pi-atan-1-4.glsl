// DEC SDF: #define PI (atan(1.)*4.)
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-pi-atan-1-4.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
float de(vec3 p){
  p.yz *= rot(-time);
  p.xz *= rot(-time);
  float s = 1.;
  float d, dPrev, dPrePrev;
  for(int i = 0; i++ < 5;) {
    dPrePrev = dPrev;
    dPrev = d;
    p.xz *= rot(time-3.14/6. + float(i));
    p.yz *= rot(time+3.14/6. + float(i));
    p = abs(p);
    p -= .4;
    p *= 2.;
    s *= 2.;
    d = (length(vec2(length(p)-.9, p.z))-.4)/s;
  }
  return (length(vec2(d, dPrePrev))-.01)*.5;
}

