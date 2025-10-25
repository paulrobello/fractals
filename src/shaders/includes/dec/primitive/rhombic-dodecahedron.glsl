// DEC SDF: // Rhombic Dodecahedron
// Category: primitive | Author: yx
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/rhombic-dodecahedron.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ){
  p = abs( p );
  p += p.yzx;
  return ( max( max( p.x, p.y ), p.z ) - 1.0 ) * sqrt( 0.5 );
}

