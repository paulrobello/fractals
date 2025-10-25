// DEC SDF: float periodic(float x,float period,float dutycycle){
// Category: composed | Author: WAHa_06x36
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-periodic-float-x-float-period-float-dutycycle.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

x/=period;
    x=abs(x-floor(x)-0.5)-dutycycle*0.5;
    return x*period;
  }
  float de(vec3 pos){
    vec3 gridpos=pos-floor(pos)-0.5;
    float r=length(pos.xy);
    float a=atan(pos.y,pos.x);
    a+=12.*0.3*sin(floor(r/3.0)+1.0)*sin(floor(pos.z)*13.73);
    return min(max(max(
    periodic(r,3.0,0.2),
    periodic(pos.z,1.0,0.7+0.3*cos(4.))),
    periodic(a*r,3.141592*2.0/6.0*r,0.7+0.3*cos(4.))),0.25);
  }
