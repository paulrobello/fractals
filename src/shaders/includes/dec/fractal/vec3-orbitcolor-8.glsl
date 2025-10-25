// DEC SDF: vec3 orbitColor;
// Category: fractal | Author: michael0884
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-orbitcolor-8.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de( vec3 p ) {
  //The Sponge
  float scale = 1.88f;
  float angle1 = 1.52f;
  float angle2 = 4.91f;
  vec3 shift = vec3( -4.54f, -1.26f, 0.1f );
  vec3 color = vec3( -1.0f, 0.3f, -0.43f );
  vec2 a1 = vec2(sin(angle1), cos(angle1));
  vec2 a2 = vec2(sin(angle2), cos(angle2));
  mat2 rmZ = mat2(a1.y, a1.x, -a1.x, a1.y);
  mat2 rmX = mat2(a2.y, a2.x, -a2.x, a2.y);
  float s = 1.0;
  orbitColor = vec3( 0.0f );
  for (int i = 0; i <11; ++i) {
    p.xyz = abs(p.xyz);
    p.xy *= rmZ;
    p.xy += min( p.x - p.y, 0.0 ) * vec2( -1., 1. );
    p.xz += min( p.x - p.z, 0.0 ) * vec2( -1., 1. );
    p.yz += min( p.y - p.z, 0.0 ) * vec2( -1., 1. );
    p.yz *= rmX;
    p *= scale;
    s *= scale;
    p.xyz += shift;
    orbitColor = max( orbitColor, p.xyz * color);
  }
  vec3 d = abs( p ) - vec3( 6.0f );
  return ( min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) ) ) / s;
}
