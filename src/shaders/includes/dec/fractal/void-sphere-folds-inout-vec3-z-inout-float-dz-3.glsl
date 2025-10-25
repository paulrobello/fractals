// DEC SDF: void sphere_folds(inout vec3 z, inout float dz) {
// Category: fractal | Author: Nameless
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-sphere-folds-inout-vec3-z-inout-float-dz-3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float fixed_radius2 = 1.9;
    float min_radius2 = 0.1;
    float r2 = dot(z, z);
    if(r2 < min_radius2) {
      float temp = (fixed_radius2 / min_radius2);
      z *= temp; dz *= temp;
    }else if(r2 < fixed_radius2) {
      float temp = (fixed_radius2 / r2);
      z *= temp; dz *= temp;
    }
  }
  void box_folds(inout vec3 z, inout float dz) {
    float folding_limit = 1.0;
    z = clamp(z, -folding_limit, folding_limit) * 2.0 - z;
  }
  float de(vec3 z) {
    vec3 offset = z;
    float scale = -2.8;
    float dr = 1.0;
    escape = 0.;
    for(int n = 0; n < 15; ++n) {
      box_folds(z, dr);
      sphere_folds(z, dr);
      z = scale * z + offset;
      dr = dr * abs(scale) + 1.0;
      escape += exp(-0.2*dot(z.xyz,z.xyz));
    }
    float r = length(z);
    return r / abs(dr);
  }
