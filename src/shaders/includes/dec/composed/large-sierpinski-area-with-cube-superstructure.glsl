// DEC SDF: Large Sierpinski area with cube superstructure
// Category: composed | Author: butadiene
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/large-sierpinski-area-with-cube-superstructure.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

mat2 rot(float r){
    vec2 s = vec2(cos(r),sin(r));
    return mat2(s.x,s.y,-s.y,s.x);
  }
  float cube(vec3 p,vec3 s){
    vec3 q = abs(p);
    vec3 m = max(s-q,0.);
    return length(max(q-s,0.))-min(min(m.x,m.y),m.z);
  }
  float tetcol(vec3 p,vec3 offset,float scale,vec3 col){
    vec4 z = vec4(p,1.);
    for(int i = 0;i<12;i++){
      if(z.x+z.y<0.0)z.xy = -z.yx,col.z+=1.;
      if(z.x+z.z<0.0)z.xz = -z.zx,col.y+=1.;
      if(z.z+z.y<0.0)z.zy = -z.yz,col.x+=1.;
      z *= scale;
      z.xyz += offset*(1.0-scale);
    }
    return (cube(z.xyz,vec3(1.5)))/z.w;
  }
  float de(vec3 p){
    float s = 1.;
    p = abs(p)-4.*s;
    p = abs(p)-2.*s;
    p = abs(p)-1.*s;
    return tetcol(p,vec3(1.0),1.8,vec3(0.));
  }
