// DEC SDF: // European 4 in 1 Chain Maille Pattern
// Category: composed | Author: athibaul
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/european-4-in-1-chain-maille-pattern.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define R(th) mat2(cos(th),sin(th),-sin(th),cos(th))
float dTorus( vec3 p, float r_large, float r_small ) {
  float h = length( p.xy ) - r_large;
  float d = sqrt( h * h + p.z * p.z ) - r_small;
  return d;
}

float torusGrid( vec3 p, float r_small, float r_large, float angle, vec2 sep ) {
  // Create a grid of tori through domain repetition
  vec3 q = p - vec3( round( p.xy / sep ) * sep, 0 ) - vec3( 0.0, sep.y / 2., 0.0 );
  q.yz *= R( angle );
  float d = dTorus( q, r_large, r_small );
  q = p - vec3( round( p.xy / sep ) * sep, 0 ) - vec3( 0.0, -sep.y / 2., 0.0 );
  q.yz *= R( angle );
  d = min( d, dTorus( q, r_large, r_small ) );
  return d;
}

float material = 0.;
float de( vec3 p ) {
  float angle = 0.3;
  vec2 sep = vec2(1.0,0.8);
  float d = torusGrid(p, 0.07, 0.4, angle, sep);
  d = min(d, torusGrid(p-vec3(sep/2.,0.0), 0.07, 0.4, -angle, sep));
  // vec3 p2 = 12.3*p // displaced plane background;
  // p2.yz *= R(0.7);
  // p2.xz *= R(-0.7);
  // vec2 q = p2.xy-round(p2.xy);
  // float bump = dot(q,q) * 0.005;
  // float d2 = p.z+0.15+bump;
  // d = min(d, d2);
  return d;
}

