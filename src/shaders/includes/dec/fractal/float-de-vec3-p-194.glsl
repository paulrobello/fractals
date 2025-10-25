// DEC SDF: float de ( vec3 p ) {
// Category: fractal | Author: gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-194.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define R(p,a,t) mix(a*dot(p,a),p,cos(t))+sin(t)*cross(p,a)
#define H(h) (cos((h)*6.3+vec3(0.0,23.0,21.0))*.5+.5)
  
  float i=0., s, e, g=0.0;
  float t = time;
  vec4 pp=vec4(p,.07);
  pp.z-=0.5;
  pp.xyz=R(pp.xyz,normalize(H(t*.1)),t*.2);
  s=2.0;
  for(int j=0;j++<6;)
    pp=.02-abs(pp-.1),
    s*=e=max(1./dot(pp,pp),1.3),
    pp=abs(pp.x<pp.y?pp.wzxy:pp.wzyx)*e-1.3;
    g+=e=abs(length(pp.xz*pp.wy)-.02)/s+1e-4;
  return g;
#undef R
#undef H
}

