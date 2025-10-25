// DEC SDF: float de(vec3 p){
// Category: fractal | Author: unknown
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-134.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

const float mr=0.25, mxr=1.0;
    const vec4 scale=vec4(-3.12,-3.12,-3.12,3.12),p0=vec4(0.0,1.59,-1.0,0.0);
    vec4 z = vec4(p,1.0);
    for (int n = 0; n < 3; n++) {
      z.xyz=clamp(z.xyz, -0.94, 0.94)*2.0-z.xyz;
      z*=scale/clamp(dot(z.xyz,z.xyz),mr,mxr);
      z+=p0;
    }
    z.y-=3.0*sin(3.0+floor(p.x+0.5)+floor(p.z+0.5));
    float dS=(length(max(abs(z.xyz)-vec3(1.2,49.0,1.4),0.0))-0.06)/z.w;
    return dS;
  }
