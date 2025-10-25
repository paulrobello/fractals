// DEC SDF: vec2 cmul( vec2 a, vec2 b ) {
// Category: fractal | Author: athibaul
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec2-cmul-vec2-a-vec2-b.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x);
}

vec2 cpow( vec2 a, float p ) {
  float rho = pow(length(a), p), theta = atan(a.y, a.x)*p;
  return rho * vec2(cos(theta), sin(theta));
}

float juliaDistance( vec2 c, vec2 z ) {
  const int iterations = 200;
  vec2 dz = vec2(1.);
  float m2 = 1.0;
  int i;
  for(i=0;i<iterations;i++) {
    // z = z*z + c except * is complex multiplication
    dz = 2.*cmul(z,dz);
    z = cmul(z,z) + c;
    m2 = dot(z,z);
    if(m2>1e10) break;
  }
  if(i >= iterations) return 0.;
  float lz = sqrt(m2);
  float d = lz*log(lz) / length(dz);
  return d;
}

float de( vec3 p ) {
  vec2 c = vec2(0.28,-0.49); // julia set parameters
  float d = juliaDistance(c, p.xz) * 0.5;
  d = max(d, p.y ); // Cut extruded julia at y = 0
  d = min(d, p.y + 1.); // Back plane at y = -1
  return d;
}

