// DEC SDF: float sdRoundBox( vec3 p, vec3 b, float r ){
// Category: composed | Author: adapted from code by sdfgeoff
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-sdroundbox-vec3-p-vec3-b-float-r.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
  }

  float df(vec3 co) {
    float rad = clamp(co.z * 0.05 + 0.45, 0.1, 0.3);
    co = mod(co, vec3(1.0)) - 0.5;
    return sdRoundBox(co, vec3(rad, rad, 0.3), 0.1);
  }

  float de(vec3 p){
    float body = 999.0;
    float scale = 0.2;
    vec3 co = p;
    mat4 m = mat4(
    vec4(0.6373087, -0.0796581,  0.7664804, 0.0),
    vec4(0.2670984,  0.9558195, -0.1227499, 0.0),
    vec4(-0.7228389,  0.2829553,  0.6304286, 0.0),
    vec4(0.1, 0.6, 0.2, 0.0));
    for (int i=0; i<3; i++) {
      co = (m * vec4(co, float(i))).xyz;
      scale *= (3.0);
      float field = df(co * scale) / scale;
      body = smin_op(body, field, 0.05);
    }
    return -body;
  }
