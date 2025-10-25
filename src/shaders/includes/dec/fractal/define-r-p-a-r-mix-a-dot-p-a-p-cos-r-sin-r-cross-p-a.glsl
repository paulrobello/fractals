// DEC SDF: #define R(p,a,r)mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-r-p-a-r-mix-a-dot-p-a-p-cos-r-sin-r-cross-p-a.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

#define H(h)cos((h)*6.3+vec3(0.0,23.0,21.0))*.5+.5
  float deee(vec3 p){
    float i=0.,g=0.,e,s,a;
    p=R(p,vec3(1.0),1.2);
    p=mod(p,2.)-1.;
    p.xy=vec2(dot(p.xy,p.xy),length(p.xy)-1.); // interesting
    s=3.;
    for(int i=0;i++<5;){
        p=vec3(10.0,2.0,1.0)-abs(p-vec3(10.0,5.0,1.0));
        s*=e=12./clamp(dot(p,p),.2,8.);
        p=abs(p)*e;
    }
    return min(length(p.xz),p.y)/s+.001;
  }
