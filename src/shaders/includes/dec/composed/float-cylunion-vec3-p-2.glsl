// DEC SDF: float cylUnion(vec3 p){
// Category: composed | Author: russ
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-cylunion-vec3-p-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float xy = dot(p.xy,p.xy);
    float xz = dot(p.xz,p.xz);
    float yz = dot(p.yz,p.yz);
    return sqrt(min(xy,min(xz,yz))) - 1.;
  }

  float cylIntersection(vec3 p){
    float xy = dot(p.xy,p.xy);
    float xz = dot(p.xz,p.xz);
    float yz = dot(p.yz,p.yz);
    return sqrt(max(xy,max(xz,yz))) - 1.;
  }

  float DE(vec3 p){
    float d = cylIntersection(p);
    float s = 1.;
    for(int i = 0;i<5;i++){
      p *= 3.; s*=3.;
      float d2 = cylUnion(p) / s;
      d = max(d,d2);
      p = mod(p+1. , 2.) - 1.;
    }
    return d;
  }
