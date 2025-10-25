// DEC SDF: float de( vec3 p ) {
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-16.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float itr=10.,r=0.1;
    p=mod(p-1.5,3.)-1.5;
    p=abs(p)-1.3;
    if(p.x < p.z)p.xz=p.zx;
    if(p.y < p.z)p.yz=p.zy;
    if(p.x < p.y)p.xy=p.yx;
    float s=1.;
    p-=vec3(.5,-.3,1.5);
  	for(float i=0.;i++ < itr;) {
  		float r2=2./clamp(dot(p,p),.1,1.);
  		p=abs(p)*r2;
  		p-=vec3(.7,.3,5.5);
  		s*=r2;
  	}
    return length(p.xy)/(s-r);
  }
