// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: adapted from code by jorge2017a1
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-133.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3  di = abs(p) - vec3(1.);
    float mc = max(di.x, max(di.y, di.z));
    float d =  min(mc,length(max(di,0.0)));
    vec4 res = vec4( d, 1.0, 0.0, 0.0 );

    const mat3 ma = mat3( 0.60, 0.00,  0.80,
                          0.00, 1.00,  0.00,
                          -0.20, 0.00,  0.30 );
    float off = 0.0005;
    float s = 1.0;
    for( int m=0; m<4; m++ ){
      p = ma*(p+off);
      vec3 a = mod( p*s, 2.0 )-1.0;
      s *= 3.0;
      vec3 r = abs(1.0 - 3.0*abs(a));
      float da = max(r.x,r.y);
      float db = max(r.y,r.z);
      float dc = max(r.z,r.x);
      float c = (min(da,min(db,dc))-1.0)/s;
      if( c > d )
        d = c;
    }
    return d;
  }
