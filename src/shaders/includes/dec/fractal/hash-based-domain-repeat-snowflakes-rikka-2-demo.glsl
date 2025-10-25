// DEC SDF: // Hash based domain repeat snowflakes - Rikka 2 demo
// Category: fractal | Author: Catzpaw
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/hash-based-domain-repeat-snowflakes-rikka-2-demo.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float hash(float v){return fract(sin(v*22.9)*67.);}
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}
vec2 hexFold(vec2 p){return abs(abs(abs(p)*mat2(.866,.5,-.5,.866))*mat2(.5,-.866,.866,.5));}
float sdHex(vec3 p){p=abs(p);return max(p.z-.02,max((p.x*.5+p.y*.866),p.x)-.015);}
float de(vec3 p){
  float h=hash(floor(p.x)+floor(p.y)*133.3+floor(p.z)*166.6),o=13.0,s=1.+h;
  p=fract(p)-.5;
  p.y+=h*.4-.2;
  p.xz*=rot(time*(h+.8));
  p.yz*=rot(time+h*5.);
  h=hash(h);p.x+=h*.15;
  float l=dot(p,p);
  if(l>.1)return l*2.;
  for(int i=0;i<5;i++){
    p.xy=hexFold(p.xy);
    p.xy*=mat2(.866,-.5,.5,.866);
    p.x*=(s-h);
    h=hash(h);p.y-=h*.065-.015;p.y*=.8;
    p.z*=1.2;
    h=hash(h);p*=1.+h*.3;
    o=min(o,sdHex(p));
    h=hash(h);s=1.+h*2.;
  }
  return o;
}
