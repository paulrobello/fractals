// DEC SDF: float sdVerticalCapsule( vec3 p, float h, float r ) {
// Category: composed | Author: theepicsnail
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-sdverticalcapsule-vec3-p-float-h-float-r.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}
vec2 rotate(vec2 v, float angle) {
  return cos(angle)*v+sin(angle)*vec2(v.y,-v.x);
}
float rand( vec2 co ) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
float de( vec3 ro ) {
  float d = 100.0;
  d = min( d, ro.y );
  float r = rand(floor(ro.xz/10.0-.5));
  ro.xz = fract(ro.xz/10.0-.5)*10.0-5.0;
  for(float len = 1.0; len > 0.0 ; len -= .1) {
    ro.xz = rotate(ro.xz, 1.4);
    d = min(d, sdVerticalCapsule(ro, len, .1));
    ro.x = abs(ro.x);
    ro -= vec3(0.0,len,0.0);
    ro = reflect(ro, normalize(vec3(rotate(vec2(0.0,1.0),1.7+ r*.1), 0)));
    d = min( d, sdVerticalCapsule(ro, len, .1));
  }
  d = min(d, length(ro)-.2);
  return d;
}

