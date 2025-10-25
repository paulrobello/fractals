# 3D SDF Primitives - Inigo Quilez

**Source**: https://iquilezles.org/articles/distfunctions/

## Introduction

Distance functions for basic primitives, formulas for combining them, and distortion functions for shaping objects. Useful for raymarching distance fields.

## Important Concepts

### Exact vs Bound SDFs

- **"exact"**: True SDF in Euclidean space - measures distance exactly, gradient has unit length
- **"bound"**: Returns lower bound to real SDF - can still be useful but lower quality

**Prefer "exact" SDFs** - work better with algorithms, produce higher quality results. Some primitives (ellipsoid) or operators (smooth minimum) cannot be "exact" mathematically.

### Helper Functions

```glsl
float dot2(in vec2 v) { return dot(v,v); }
float dot2(in vec3 v) { return dot(v,v); }
float ndot(in vec2 a, in vec2 b) { return a.x*b.x - a.y*b.y; }
```

## Core Primitives

### Sphere - exact
```glsl
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}
```

### Box - exact
```glsl
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
```

### Round Box - exact
```glsl
float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b + r;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}
```

### Torus - exact
```glsl
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}
```

### Plane - exact
```glsl
float sdPlane(vec3 p, vec3 n, float h) {
    // n must be normalized
    return dot(p,n) + h;
}
```

### Cylinder - exact
```glsl
float sdCylinder(vec3 p, vec3 c) {
    return length(p.xz-c.xy)-c.z;
}
```

### Capsule - exact
```glsl
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    return length(pa - ba*h) - r;
}
```

### Cone - exact
```glsl
float sdCone(vec3 p, vec2 c, float h) {
    // c is the sin/cos of the angle, h is height
    vec2 q = h*vec2(c.x/c.y,-1.0);
    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q*clamp(dot(w,q)/dot(q,q), 0.0, 1.0);
    vec2 b = w - q*vec2(clamp(w.x/q.x, 0.0, 1.0), 1.0);
    float k = sign(q.y);
    float d = min(dot(a, a),dot(b, b));
    float s = max(k*(w.x*q.y-w.y*q.x),k*(w.y-q.y));
    return sqrt(d)*sign(s);
}
```

## Boolean Operations

### Union - exact
```glsl
float opUnion(float d1, float d2) {
    return min(d1, d2);
}
```

### Subtraction - exact
```glsl
float opSubtraction(float d1, float d2) {
    return max(-d1, d2);
}
```

### Intersection - exact
```glsl
float opIntersection(float d1, float d2) {
    return max(d1, d2);
}
```

### Smooth Union - bound (polynomial)
```glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}
```

### Smooth Subtraction - bound
```glsl
float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5*(d2+d1)/k, 0.0, 1.0);
    return mix(d2, -d1, h) + k*h*(1.0-h);
}
```

### Smooth Intersection - bound
```glsl
float opSmoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) + k*h*(1.0-h);
}
```

## Domain Operations

### Repetition (Infinite Pattern)
```glsl
vec3 opRep(vec3 p, vec3 c) {
    return mod(p+0.5*c,c)-0.5*c;
}
```

### Limited Repetition
```glsl
vec3 opRepLim(vec3 p, float c, vec3 l) {
    return p-c*clamp(round(p/c),-l,l);
}
```

## Transformations

### Position/Rotation/Scale
All primitives are centered at origin. Transform the point **before** evaluating SDF:

```glsl
// Translation
vec3 p_translated = p - offset;

// Rotation (use rotation matrix)
vec3 p_rotated = rotationMatrix * p;

// Scale (must divide result by scale factor)
float d = sdPrimitive(p / scale) * scale;
```

## Distortions

### Displacement
```glsl
float opDisplace(vec3 p) {
    float d1 = sdPrimitive(p);
    float d2 = displacement(p);  // e.g., sin(p.x)*sin(p.y)*sin(p.z)
    return d1 + d2;
}
```

### Twist
```glsl
vec3 opTwist(vec3 p, float k) {
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}
```

### Bend
```glsl
vec3 opCheapBend(vec3 p, float k) {
    float c = cos(k*p.x);
    float s = sin(k*p.x);
    mat2  m = mat2(c,-s,s,c);
    return vec3(m*p.xy,p.z);
}
```

## Working Examples

- Complete primitive library: https://www.shadertoy.com/playlist/43cXRl
- Single demo with all primitives: https://www.shadertoy.com/view/Xds3zN

## Additional Resources

- [Menger Sponge](https://iquilezles.org/articles/menger)
- [Fractals](https://iquilezles.org/articles/mandelbulb)
- [Mesh SDFs](https://iquilezles.org/articles/sdfbounding)
- [2D SDFs](https://iquilezles.org/articles/distfunctions2d)
- [Video Tutorials](https://iquilezles.org/live)

---

**Fetched**: October 4, 2025
**License**: Educational use for fractal-explorer project
