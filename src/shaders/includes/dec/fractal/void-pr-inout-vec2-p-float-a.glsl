// DEC SDF: void pR(inout vec2 p, float a) {
// Category: fractal | Author: macbooktall
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-pr-inout-vec2-p-float-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
  }

  float de(vec3 p){
    const int iterations = 20;
    float d = -2.; // vary this parameter, range is like -20 to 20
    p=p.yxz;
    pR(p.yz, 1.570795);
    p.x += 6.5;
    p.yz = mod(abs(p.yz)-.0, 20.) - 10.;
    float scale = 1.25;
    p.xy /= (1.+d*d*0.0005);

    float l = 0.;
    for (int i=0; i < iterations; i++) {
      p.xy = abs(p.xy);
      p = p*scale + vec3(-3. + d*0.0095,-1.5,-.5);
      pR(p.xy,0.35-d*0.015);
      pR(p.yz,0.5+d*0.02);
      vec3 p6 = p*p*p; p6=p6*p6;
      l =pow(p6.x + p6.y + p6.z, 1./6.);
    }
    return l*pow(scale, -float(iterations))-.15;
  }
