// DEC SDF: mat2 rot( float r ){
// Category: fractal | Author: i_dianov
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rot-float-r.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return mat2(cos(r), sin(r), -sin(r), cos(r));
}
float de ( vec3 p ) {
  p.z+=.6;
  p.xz*=rot(3.141*2.*time/(19.));
  p*=3.;
  p=vec3(atan(p.x,p.z)*3.025,p.y,length(p.xz)-4.);
  p.yx*=rot(3.141/2.);
  p=vec3(atan(p.x,p.z)*3.025,p.y,length(p.xz)-5.);
  p.z+=2.;
  p.xy = mod(p.xy,1.)-.5;
  return .2*(length(p)-1.);
}

