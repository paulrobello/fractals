// DEC SDF: float hash13(vec3 p3){
// Category: fractal | Author: noby
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-hash13-vec3-p3.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

p3 = fract((p3)*0.1031);
  p3 += dot(p3, p3.yzx  + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}
float de( vec3 p ){
  vec3 po = p;
  p = -p;
  
  float k=1.;
  for(int i = 0; i < 8; ++i) {
    vec3 ss = vec3(-.54,0.84,1.22);
    p = 2.0*clamp(p,-ss,ss)-p;
    float f = max(0.7/dot(p,p),0.75);
    p *= f;
    k *= f*1.05;
  }

  float res = max(length(p.xz)-.9,length(p.xz)*abs(p.y)/length(p))/k;
  p = -p;

  // crumbly
  res += (-1.0+2.0*hash13( floor(p*10.0) ))*0.005 * (1.0-step(0.01, po.y));

  // blast
  const float ang = 0.04;
  const mat2 rot = mat2(cos(ang),sin(ang),-sin(ang),cos(ang));
  vec3 tpo = po-vec3(0.0,0.12,-1.5);
  tpo.xy *= rot;
  float blast = pow(smoothstep(-1.6, 0.35,po.x)-smoothstep(0.4,0.48,po.x), 3.0);
  res = min(res, length( (tpo).yz )-0.02*blast);
  return res;
}
