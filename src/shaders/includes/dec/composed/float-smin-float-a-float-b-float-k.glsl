// DEC SDF: float smin( float a, float b, float k ){
// Category: composed | Author: glkt
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-smin-float-a-float-b-float-k.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
  }
  float noise(vec3 p){
    vec3 np = normalize(p);

    float a = 0.1*snoise2D(np.xy*10.);
    float b = 0.1*snoise2D(0.77+np.yz*10.);

    a = mix(a,.5,abs(np.x));
    b = mix(b,.5,abs(np.z));
    return mix(a+b-.4,.5,abs(np.y)/2.);
  }
  float de(vec3 p){
    float d = (-1.*length(p)+3.)+1.5*noise(p);
    d = min(d, (length(p)-1.5)+1.5*noise(p) );
    float m = 1.5; float s = .03;
    d = smin(d, max( abs(p.x)-s, abs(p.y+p.z*.2)-.07 ) , m);
    d = smin(d, max( abs(p.z)-s, abs(p.x+p.y/2.)-.07 ), m );
    d = smin(d, max( abs(p.z-p.y*.4)-s, abs(p.x-p.y*.2)-.07 ), m );
    d = smin(d, max( abs(p.z*.2-p.y)-s, abs(p.x+p.z)-.07 ), m );
    d = smin(d, max( abs(p.z*-.2+p.y)-s, abs(-p.x+p.z)-.07 ), m );
    return d;
  }
