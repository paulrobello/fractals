// DEC SDF: mat2 rotate2D ( float r ) {
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rotate2d-float-r-4.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2( cos( r ), sin( r ), -sin( r ), cos( r ) );
}
float de ( vec3 p ) {
  vec3 q=p;
  float d, t = 0.0; // t is time adjustment
  q.xy=fract(q.xy)-.5;
  for( int j=0; j++<9; q+=q )
    q.xy=abs(q.xy*rotate2D(q.z + t))-.15;
    d=(length(q.xy)-.2)/1e3;
  return d;
}
