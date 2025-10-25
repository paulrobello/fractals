// DEC SDF: #define D (dot(sin(Q),cos(Q.yzx))+1.3)
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-d-dot-sin-q-cos-q-yzx-1-3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
  	vec3 Q;
  	float i,d=1.;
  	Q=p, d=D, Q.x+=M_PI, d=min(d,D);
  	Q.y+=M_PI;
    d=min(d,D);
  	Q*=30.;
  	d=max(abs(d),(abs(D-1.3)-.5)/30.);
  	return d*.6;
  }
