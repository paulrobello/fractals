// DEC SDF: Star
// Category: primitive | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/star.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    vec3 Q;
    float i,d=1.;
    Q=p;
    d=.4*M_PI;
    Q.yx*=rotate2D(floor(atan(Q.x,Q.y)/d+.5)*d);
    Q.zx=abs(Q.zx);
    return d=max(Q.z-.06,(Q.y*.325+Q.x+Q.z*1.5)/1.83-.05);
  }
