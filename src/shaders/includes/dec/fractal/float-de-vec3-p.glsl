// DEC SDF: float de( vec3 p ){
// Category: fractal | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float scale = 1.0;
    float orb = 10000.0;
    for( int i=0; i<6; i++ ){
      p = -1.0 + 2.0*fract(0.5*p+0.5);
      p -= sign(p)*0.04; // trick
      float r2 = dot(p,p);
      float k = 0.95/r2;
      p  *= k;  scale *= k;
      orb = min( orb, r2);
    }

    float d1 = sqrt( min( min( dot(p.xy,p.xy),
      dot(p.yz,p.yz) ), dot(p.zx,p.zx) ) ) - 0.02;
    float d2 = abs(p.y);
    float dmi = d2;
    if( d1 < d2 ) dmi = d1;
    return 0.5*dmi/scale;
  }
