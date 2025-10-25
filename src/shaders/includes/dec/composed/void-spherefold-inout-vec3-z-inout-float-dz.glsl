// DEC SDF: void sphereFold(inout vec3 z, inout float dz){
// Category: composed | Author: lewiz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/void-spherefold-inout-vec3-z-inout-float-dz.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float r2 = dot(z,z);
    if (r2 < 0.5){
      float temp = 2.0;
      z *= temp;
      dz*= temp;
    }else if (r2 < 1.0){
      float temp = 1.0 / r2;
      z *= temp; dz*= temp;
    }
  }
  void boxFold(inout vec3 z, inout float dz){
    z = clamp(z, -1.0, 1.0) * 2.0 - z;
  }
  float de(vec3 z){
    float scale = 2.0;
    vec3 offset = z;
    float dr = 1.0;
    for (int n = 0; n < 10; n++){
      boxFold(z,dr);
      sphereFold(z,dr);
      z = scale * z + offset;
      dr = dr * abs(scale) + 1.0;
    }
    float r = length(z);
    return r / abs(dr);
  }
