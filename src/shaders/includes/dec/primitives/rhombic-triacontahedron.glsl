// DEC SDF: // Rhombic Triacontahedron
// Category: primitives | Author: yx
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitives/rhombic-triacontahedron.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ) {
  const float phi = ( 1.0 + sqrt( 5.0 ) ) * 0.5;
  const float l = phi*2.;
  p = abs( p );
  float a = max( max( p.x, p.y ), p.z );
  p += ( p + p.yzx ) * phi + p.zxy;
  return max( a, max( p.x, max( p.y, p.z ) ) / l ) - 1.0;
}
