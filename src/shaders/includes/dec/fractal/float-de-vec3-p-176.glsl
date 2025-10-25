// DEC SDF: float de ( vec3 p ){
// Category: fractal | Author: yonatan
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-176.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float v = 2., e = 0.0, g = 0.0;
  p = abs(fract(p)-.5)+.12;
  
  if( p.x>p.y )
    p.xy=p.yx;
  
  if( p.y<p.z )
    p.yz=p.zy;
  
  for(int j=0;j++<16;p=abs(p)/e-.25)
    p.y-=3.5-g*.4,
    v/=e=min(dot(p,p)+.1,.5);
  return g+=e=length(p)/v;
}
