// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-162.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 P=p, Q, b=vec3( 4.0, 2.8, 15.0 );
    float i, d=1., a;
    Q = mod( P, b ) - b * 0.5;
    d = P.z - 6.0;
    a = 1.3;
    for( int j = 0; j++ < 11; )
      d = min( d, length( max( abs( Q ) - b.zyy / 13.0, 0.0 ) ) / a ),
      Q = vec3( Q.y, abs( Q.x ) - 1.0, Q.z + 0.3 ) * 1.4,
      a *= 1.4;
    return d;
  }
