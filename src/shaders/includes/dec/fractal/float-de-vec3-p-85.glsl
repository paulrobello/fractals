// DEC SDF: float de(vec3 p){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-85.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define M(a)mat2(cos(a+vec4(0.0,2.0,5.0,0.0)))
    #define F1(a)for(int j=0;j<5;j++)p.a=abs(p.a*M(3.));(p.a).y-=3.
    float t = 0.96;
    p.z-=9.;
    p.xz*=M(t);
    F1(xy);
    F1(zy);
    return dot(abs(p),vec3(.3))-.5;
  }
