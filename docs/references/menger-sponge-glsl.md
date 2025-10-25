# Menger Sponge GLSL Implementation

**Source**: https://www.geeks3d.com/20140201/glsl-menger-sponge-raymarching-code-samples-updated/

## Overview

Complete GLSL fragment shader for ray marching a Menger Sponge fractal. Based on IQ's article about Menger sponge fractals.

## Key Functions

### Helper Functions

```glsl
float maxcomp(vec3 p) {
    float m1 = max(p.x, p.y);
    return max(m1, p.z);
}
```

### Box SDF with Size Parameter

```glsl
vec2 obj_box_s(vec3 p, vec3 b) {
    vec3  di = abs(p) - b;
    float mc = maxcomp(di);
    float d = min(mc, length(max(di, 0.0)));
    return vec2(d, 1);
}
```

### Basic Box (4x4x4)

```glsl
vec2 obj_box(vec3 p) {
    vec3 b = vec3(4.0, 4.0, 4.0);
    return obj_box_s(p, b);
}
```

### Cross Pattern (for subtraction)

```glsl
vec2 obj_cross(in vec3 p) {
    float inf = 100;
    vec2 da = obj_box_s(p.xyz, vec3(inf, 2.0, 2.0));
    vec2 db = obj_box_s(p.yzx, vec3(2.0, inf, 2.0));
    vec2 dc = obj_box_s(p.zxy, vec3(2.0, 2.0, inf));
    return vec2(min(da.x, min(db.x, dc.x)), 1);
}
```

### Simple Menger (Single Iteration)

```glsl
vec2 obj_menger_simple(in vec3 p) {
    vec2 d1 = obj_box(p);
    vec2 d2 = obj_cross(p/3.0);
    float d = max(d1.x, -d2.x);  // Subtract cross from box
    return vec2(d, 1.0);
}
```

### Full Menger Sponge (Iterative)

```glsl
vec2 obj_menger(in vec3 p) {
    vec2 d2 = obj_box(p);
    float s = 1.0;

    for (int m = 0; m < 3; m++) {
        vec3 a = mod(p*s, 2.0) - 1.0;
        s *= 3.0;
        vec3 r = 1.0 - 4.0*abs(a);
        vec2 c = obj_cross(r)/s;
        d2.x = max(d2.x, c.x);
    }

    return d2;
}
```

## Complete Ray Marching Shader

```glsl
#version 120
uniform vec3 cam_pos;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

float PI = 3.14159265;

// ... (include all helper functions above)

vec2 obj_union(in vec2 obj0, in vec2 obj1) {
    if (obj0.x < obj1.x)
        return obj0;
    else
        return obj1;
}

// Floor
vec2 obj_floor(in vec3 p) {
    return vec2(p.y + 10.0, 0);
}

// Floor checkerboard pattern
vec3 floor_color(in vec3 p) {
    if (fract(p.x*0.2) > 0.2) {
        if (fract(p.z*0.2) > 0.2)
            return vec3(0, 0.1, 0.2);
        else
            return vec3(1, 1, 1);
    } else {
        if (fract(p.z*0.2) > 0.2)
            return vec3(1, 1, 1);
        else
            return vec3(0.3, 0, 0);
    }
}

vec3 prim_c(in vec3 p) {
    return vec3(0.6, 0.6, 0.8);
}

// Scene: union of floor and menger sponge
vec2 distance_to_obj(in vec3 p) {
    return obj_union(obj_floor(p), obj_menger(p));
}

void main(void) {
    vec2 q = gl_TexCoord[0].xy;
    vec2 vPos = -1.0 + 2.0 * q;

    // Camera setup
    vec3 vuv = vec3(0, 1, 0);  // Up vector
    vec3 vrp = vec3(0, 0, 0);  // Look at point
    vec3 prp = cam_pos;        // Camera position

    vec3 vpn = normalize(vrp - prp);
    vec3 u = normalize(cross(vuv, vpn));
    vec3 v = cross(vpn, u);
    vec3 vcv = (prp + vpn);
    float aspect = (resolution.x / resolution.y);
    vec3 scrCoord = vcv + vPos.x*u*aspect + vPos.y*v;
    vec3 scp = normalize(scrCoord - prp);

    // Raymarching
    const vec3 e = vec3(0.02, 0, 0);
    const float maxd = 100.0;  // Max depth
    vec2 d = vec2(0.02, 0.0);
    vec3 c, p, n;

    float f = 1.0;
    for(int i = 0; i < 256; i++) {
        if ((abs(d.x) < .001) || (f > maxd))
            break;

        f += d.x;
        p = prp + scp*f;
        d = distance_to_obj(p);
    }

    if (f < maxd) {
        // Hit something
        if (d.y == 0)  // Floor
            c = floor_color(p);
        else           // Menger sponge
            c = prim_c(p);

        // Calculate normal using gradient
        n = normalize(vec3(
            d.x - distance_to_obj(p - e.xyy).x,
            d.x - distance_to_obj(p - e.yxy).x,
            d.x - distance_to_obj(p - e.yyx).x
        ));

        // Simple lighting
        float b = dot(n, normalize(prp - p));
        gl_FragColor = vec4((b*c + pow(b, 60.0))*(1.0 - f*.01), 1.0);
    } else {
        // Background
        gl_FragColor = vec4(0, 0, 0, 1);
    }
}
```

## Key Concepts

### Iterative Folding
The Menger sponge uses iterative space folding:
1. Start with a box
2. For each iteration:
   - Fold space using `mod(p*s, 2.0) - 1.0`
   - Scale up by 3
   - Subtract cross pattern
   - Divide by scale factor

### Material ID
The second component of `vec2` return value is material ID:
- `0` = floor
- `1` = menger sponge

### Normal Calculation
Uses gradient method with small epsilon offset:
```glsl
vec3 eps = vec3(0.02, 0, 0);
normal.x = sdf(p) - sdf(p - eps.xyy);
normal.y = sdf(p) - sdf(p - eps.yxy);
normal.z = sdf(p) - sdf(p - eps.yyx);
```

### Performance Notes
- 3 iterations: Fast, good structure
- 4+ iterations: More detail, slower
- Max 256 ray march steps
- Early termination when distance < 0.001

## Variations

### Menger Journey
Shadertoy: https://www.shadertoy.com/view/Mdf3z7

### Menger Tower
Shadertoy: https://www.shadertoy.com/view/4sX3Rn

---

**Fetched**: October 4, 2025
**License**: Educational use for fractal-explorer project
