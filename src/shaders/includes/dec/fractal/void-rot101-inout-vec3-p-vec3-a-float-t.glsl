// DEC SDF: void rot101(inout vec3 p,vec3 a,float t){
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/void-rot101-inout-vec3-p-vec3-a-float-t.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

a=normalize(a);
  	vec3 u=cross(a,p),v=cross(a,u);
  	p=u*sin(t)+v*cos(t)+a*dot(a,p);
  }
  #define G dot(p,vec2(1.0,-1.0)*.707)
  #define V v=vec2(1.0,-1.0)*.707
  void sfold101(inout vec2 p){
    vec2 v=vec2(1.0,-1.0)*.707;
    float g=dot(p,v);
    p-=(G-sqrt(G*G+.01))*v;
  }
  float de(vec3 p){
    float k=.01;
    for(int i=0;i<8;i++){
      p=abs(p)-1.;
      sfold101(p.xz);
      sfold101(p.yz);
      sfold101(p.xy);
      rot101(p,vec3(1.0,2.0,2.0),.6);
      p*=2.;
    }
    return length(p.xy)/exp2(8.)-.01;
  }
