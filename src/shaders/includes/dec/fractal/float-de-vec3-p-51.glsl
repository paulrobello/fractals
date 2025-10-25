// DEC SDF: float de(vec3 p) {
// Category: fractal | Author: Kali
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-51.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

const float width=.22;
    const float scale=4.;
    float t=0.2;
    float dotp=dot(p,p);
    p.x+=sin(t*40.)*.007;
    p=p/dotp*scale;
    p=sin(p+vec3(sin(1.+t)*2.,-t,-t*2.));
    float d=length(p.yz)-width;
    d=min(d,length(p.xz)-width);
    d=min(d,length(p.xy)-width);
    d=min(d,length(p*p*p)-width*.3);
    return d*dotp/scale;
  }
