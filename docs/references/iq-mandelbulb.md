# Mandelbulb Fractal - Inigo Quilez

**Source**: https://iquilezles.org/articles/mandelbulb/

## The Idea

The Mandelbulb became the fractal of 2009, representing another attempt at creating a 3D fractal as iconic as the 2D Mandelbrot set. Unlike 4D Julia sets which arise from quaternions, all efforts to produce a satisfactory 4D Mandelbrot set have been futile.

### Geometric Approach

The Mandelbulb takes a different approach than algebraic methods:
- Think of the 2D Mandelbrot as a **geometric process**
- Iterate points by:
  1. Squaring their distance to origin
  2. Rotating by angle with positive x-axis
  3. Translating by c

This geometric process extends to 3D **regardless of algebraic correctness**.

### Key Insight

**The Mandelbulb formula is algebraically wrong and incoherent**, but produces beautiful images. This suggests algebraic correctness isn't always what we want. Most proto-Mandelbulb images were produced with buggy code - wrong geometric transformations, incorrect derivatives - yet looked just right.

The lesson: **duplicating lengths and angles makes sense**, even without algebraic or geometric interpretation.

## The Algorithm

### Basic Formulation

Extract polar coordinates of 3D point, double angles, square length. Generalize to power of 8 (higher powers → more symmetric shapes):

```glsl
// Extract polar coordinates
float wr = sqrt(dot(w,w));
float wo = acos(w.y/wr);
float wi = atan(w.x,w.z);

// Scale and rotate the point
wr = pow(wr, 8.0);
wo = wo * 8.0;
wi = wi * 8.0;

// Convert back to cartesian coordinates
w.x = wr * sin(wo)*sin(wi);
w.y = wr * cos(wo);
w.z = wr * sin(wo)*cos(wi);
```

Then add **c** to **w** and iterate.

## Optimizing

### Eliminating Transcendental Functions

Get rid of slow trigonometric functions using basic identities. Apply cosine/sine doubling formulas three times, resulting in polynomial with no trig functions:

```glsl
float x = w.x; float x2 = x*x; float x4 = x2*x2;
float y = w.y; float y2 = y*y; float y4 = y2*y2;
float z = w.z; float z2 = z*z; float z4 = z2*z2;

float k3 = x2 + z2;
float k2 = inversesqrt(k3*k3*k3*k3*k3*k3*k3);
float k1 = x4 + y4 + z4 - 6.0*y2*z2 - 6.0*x2*y2 + 2.0*z2*x2;
float k4 = x2 - y2 + z2;

w.x = 64.0*x*y*z*(x2-z2)*k4*(x4-6.0*x2*z2+z4)*k1*k2;
w.y = -16.0*y2*k3*k4*k4 + k1*k1;
w.z = -8.0*y*k4*(x4*x4 - 28.0*x4*x2*z2 + 70.0*x4*z4 - 28.0*x2*z2*z4 + z4*z4)*k1*k2;
```

**Performance gain**: ~5x faster on CPU (less benefit on GPU with fast trig).

Realtime implementation: https://www.shadertoy.com/view/ltfSWn

## Coloring

Most 3D fractals use basic coloring (constant, normal-based, or noise). IQ uses **orbit traps** method in 3D:

### Orbit Trap Setup
1. Origin trap (point at 0,0,0)
2. Three plane traps (x=0, y=0, z=0)

**Usage**:
- Plane traps → mix surface color with three other colors
- Origin trap → multiplicative factor (simulates ambient occlusion)

**Advantage**: Orbit trap behavior follows fractal structure, creating meaningful color patterns instead of generic noise.

## Rendering

### Distance Field Raymarching

Runs realtime on modern GPUs for 720p with shadows (no AA). Takes couple seconds on CPU.

### Distance Estimation

Based on Hubbard-Douady potential theory for polynomial of degree 8:

**Distance approximation**:
```
d(c) ≈ 0.5 * |G(c)| * log|G(c)| / |G'(c)|
```

Where:
- `G(c)` is Hubbard-Douady potential
- `G'(c)` is gradient (computed analytically during iteration)
- Can also be used as shading normal

More info: https://iquilezles.org/articles/distancefractals

## Experiments

IQ created videos showing:
1. Close zoom to surface
2. Morphing of associated Julia sets

## Code Reference

Shadertoy implementation: https://www.shadertoy.com/view/ltfSWn

---

**Fetched**: October 4, 2025
**License**: Educational use for fractal-explorer project
