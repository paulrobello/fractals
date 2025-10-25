// DEC SDF: mat2 rot( float a ) {
// Category: fractal | Author: leon
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/mat2-rot-float-a-2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float c = cos( a ),s = sin( a );
    return mat2( c, -s, s, c );
}

float de( vec3 p ) {
    float dist = 100.;

    float t = 196. + time;
    float a = 1.;

    for (float i = 0.; i < 8.; ++i) {
        vec3 e = vec3(.2+.2*sin(i+time),.0,0);
        p.xz = abs(p.xz)-.5*a;
        p.xz *= rot(t*a);
        p.yz *= rot(t*a);
        p = p - clamp(p, -e, e);
        dist = min(dist, length(p)-.01);
        a /= 1.8;
    }

    return dist;
}

