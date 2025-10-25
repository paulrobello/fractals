// DEC SDF: // very compact menger sponge expression
// Category: fractal | Author: kamoshika
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/very-compact-menger-sponge-expression.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float a=1.;
    for(int i=0;i<5;i++){ // adjust iteration count here
      p=abs(p)-1./3.;
      if(p.y>p.x)p.xy=p.yx;
      if(p.z>p.y)p.yz=p.zy;
      p.z=abs(p.z);
      p*=3.;
      p-=1.;
      a*=3.;
    }
    return length(max(abs(p)-1.,0.))/a;
  }
