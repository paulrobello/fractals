// DEC SDF: float de(vec3 p){
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-156.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 Q;
    float d=1.,a;
    Q=mod(p,8.)-4.;
    Q.y+=1.5;
    d=a=2.;
    for(int j=0;j++<15;)
      Q.x=abs(Q.x),
      d=min(d,length(max(abs(Q)-.5,0.))/a),
      Q.xy=(Q.xy-vec2(.5,1.0))*rotate2D(-.785),
      Q*=1.41,
      a*=1.41;
    return d;
  }
