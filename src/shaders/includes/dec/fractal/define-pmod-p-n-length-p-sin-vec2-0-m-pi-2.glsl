// DEC SDF: #define pmod(p,n)length(p)*sin(vec2(0.,M_PI/2.)\
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-pmod-p-n-length-p-sin-vec2-0-m-pi-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

+mod(atan(p.y,p.x),2.*M_PI/n)-M_PI/n)
  #define fold(p,v)p-2.*min(0.,dot(p,v))*v;

  float de( vec3 p ){
    float s = 1.0;
    p.z=fract(p.z)-.5;
    for(int i=0;i<20;i++){ // expensive
      p.y += .15;
      p.xz = abs(p.xz);
      for(int j=0;j<2;j++){
        p.xy = pmod(p.xy,8.);
        p.y -= .18;
      }
      p.xy = fold(p.xy,normalize(vec2(1.0,-.8)));
      p.y = -abs(p.y);
      p.y += .4;
      p.yz = fold(p.yz,normalize(vec2(3.0,-1.0)));
      p.x -= .47;
      p.yz = fold(p.yz,normalize(vec2(2.0,-7.0)));
      p -= vec3(1.7,.4,0.0);
      float r2= 3.58/dot(p,p);
      p *= r2;
      p += vec3(1.8,.7,.0);
      s *= r2;
    }
    return length(p)/s;
  }
