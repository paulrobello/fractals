// DEC SDF: vec4 fold1(vec4 z) {
// Category: composed | Author: unconed
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/vec4-fold1-vec4-z.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 p = z.xyz;
    p = p - 2.0 * clamp(p, -1.0, 1.0);
    return vec4(p, z.w);
  }
  vec4 fold2(vec4 z) {
    vec3 p = z.xyz;
    p = p - 2.0 * clamp(p, -1.0, 1.0);
    return vec4(p * 2.0, 2.0 * z.w);
  }
  vec4 invertRadius(vec4 z, float radius2, float limit) {
    float r2 = dot(z.xyz, z.xyz);
    float f = clamp(radius2 / r2, 1., limit);
    return z * f;
  }
  vec4 affine(vec4 z, float factor, vec3 offset) {
    z.xyz *= factor;
    z.xyz += offset;
    z.w *= abs(factor);
    return z;
  }
  vec4 mandel(vec4 z, vec3 offset) {
    float x = z.x;
    float y = z.y;
    z.w = 2. * length(z.xy) * z.w + 1.;
    z.x = x*x - y*y + offset.x;
    z.y = 2.*x*y + offset.y;
    return z;
  }
  vec4 invert(vec4 z, float factor) {
    float r2 = dot(z.xyz, z.xyz);
    float f = factor / r2;
    return z * f;
  }
  vec4 rotateXY(vec4 z, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat2 m = mat2(c, s, -s, c);
    return vec4(m * z.xy, z.zw);
  }
  vec4 rotateXZ(vec4 z, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat2 m = mat2(c, s, -s, c);
    vec2 r = m * z.xz;
    return vec4(r.x, z.y, r.y, z.w);
  }
  vec4 shiftXY(vec4 z, float angle, float radius) {
    float c = cos(angle);
    float s = sin(angle);
    return vec4(vec2(c, s) * radius + z.xy, z.zw);
  }
  float de(vec3 p) {
    vec4 z = vec4(p, 1.0);
    float t = 344. * .2; // change this number for different shapes
    vec3 vo1 = vec3(sin(t * .1), cos(t * .0961), sin(t * .017)) * 1.1;
    vec3 vo2 = vec3(cos(t * .07), sin(t * .0533), sin(t * .138)) * 1.1;
    vec3 vo3 = vec3(sin(t * .031), sin(t * .0449), cos(t * .201)) * 1.1;

    z = invertRadius_73(z, 10.0, 1.5);
    z = invertRadius_73(z, 10.0*10.0, 2.0);
    z = rotateXY(z, t);
    z = fold1(z);
    z = rotateXZ(z, t * 1.112);
    z.xyz += vo3;
    z = fold2(z);
    z.xyz += vo1;
    z = affine(z, -1.5, p);
    z = invertRadius(z, 4.0*4.0, 2.0);
    z = affine(z, -1.5, p);
    z = rotateXY(z, t * .881);
    z = fold1(z);
    z = rotateXZ(z, t * .783);
    z = fold1(z);
    z = affine_73(z, -1.5, p);
    z = invertRadius(z, 10.0*10.0, 3.0);
    z = fold1(z);
    z = fold1(z);
    z = affine(z, -1.5, p);
    z = invertRadius(z, 10.0*10.0, 2.0);

    vec3 po = vec3(0.0, 0.0, 0.0);
    vec3 box = abs(z.xyz);
    float d1 = (max(box.x - 2.0, max(box.y - 2.0, box.z - 10.0))) / z.w;
    float d2 = (max(box.x - 20.0, max(box.y - .5, box.z - .5))) / z.w;
    float d3 = min(d1, d2);
    return d3;
  }
