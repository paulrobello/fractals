// DEC SDF: Wavy sphere
// Category: primitive | Author: tholzer
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/wavy-sphere.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){
    float radius = .3;    // radius of sphere
    int waves = 7;        // number of waves
    float waveSize = 0.4; // displacement of waves

    //bounding Sphere
    float d = length(p) - radius*2.2;
    if(d > 0.0) return 0.2;

    // deformation of radius
    d = waveSize * (radius*radius-(p.y*p.y));
    radius += d * cos(atan(p.x,p.z) * float(waves));
    return 0.5*(length(p) - radius);
  }
