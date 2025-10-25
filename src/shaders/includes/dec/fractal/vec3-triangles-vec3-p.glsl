// DEC SDF: vec3 triangles ( vec3 p ) {
// Category: fractal | Author: krakel
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-triangles-vec3-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

const float sqrt3 = sqrt( 3.0 );
  float zm = 1.;
  p.x = p.x-sqrt3*(p.y+.5)/3.;
  p = vec3( mod( p.x + sqrt3 / 2.0, sqrt3 ) - sqrt3 / 2.0, mod( p.y + 0.5, 1.5 ) - 0.5, mod( p.z + 0.5 * zm, zm ) - 0.5 * zm );
  p = vec3( p.x / sqrt3, ( p.y + 0.5 ) * 2.0 / 3.0 - 0.5, p.z );
  p = p.y > -p.x ? vec3( -p.y, -p.x , p.z ) : p;
  p = vec3( p.x * sqrt3, ( p.y + 0.5 ) * 3.0 / 2.0 - 0.5, p.z );
  return vec3( p.x + sqrt3 * ( p.y + 0.5 ) / 3.0, p.y , p.z );
}
float de ( vec3 p ) {
  float scale = 1.0;
  float s = 1.0 / 3.0;
  for ( int i = 0; i < 10; i++ ) {
    p = triangles( p );
    float r2 = dot( p, p );
    float k = s / r2;
    p = p * k;
    scale=scale * k;
  }
  return 0.3 * length( p ) / scale - 0.001 / sqrt( scale );
}

