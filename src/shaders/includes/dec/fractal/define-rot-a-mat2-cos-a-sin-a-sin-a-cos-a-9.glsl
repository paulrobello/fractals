// DEC SDF: #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: illus0r
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-9.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define tn (time/(120.*.017))
#define PI 3.1415
#define STEP PI/8.
vec2 decartToPolar(vec2 decart) {
    float alpha = atan(decart.x, decart.y);
    float R = length(decart);
    return vec2(alpha, R);
}
float c=3.1415/16.;
float r=.1;
#define cohesion r*.2 
float de(vec3 p){
  float i, s=1.;
  vec2 pol;
  p.xy*=rot(PI*.5);
  for(int j=0;j<3;j++){
    p.zx*=rot(time*.05*s*s*s);
    p*=2.5;
    s*=2.5;
    pol = decartToPolar(p.xz);
    i = mod(p.y - pol.x*STEP/PI, STEP*2.)-STEP*1.;
    p.xyz = vec3(i, pol.x, pol.y-.5);
  }
  return (length(p.xz)-.3)/s/3.;
}
