# Ray Marching Distance Fields - Inigo Quilez

**Source**: https://iquilezles.org/articles/raymarchingdf/

## Overview

Raymarching SDFs (Signed Distance Fields) is slowly getting popular, because it's a simple, elegant and powerful way to represent 3D objects and even render 3D scenes. The technique has been around since the beginning of computer graphics, with papers from 1972 by A.Ricci and by B.Wyvill and G.Wyvill in 1989.

The first mention of raymarched SDFs was by Sandin, Hart and Kauffman, which used it for rendering 3D fractals. In 1995 C.Hart documented the raymarching technique again, but unfortunately miscalled it "Sphere Tracing" (the raymarcher traces only rays when point sampling and cones when filtering, but definitely not spheres).

## Key Concepts

### Distance Field Raymarching
- Uses signed distance functions to represent geometry
- More memory efficient than voxel-based approaches on modern GPUs
- Excellent for procedural content generation
- Great for fractals and mathematical shapes

### Core Algorithm
1. Cast ray from camera through each pixel
2. March along ray in steps based on distance field
3. If distance < threshold, we hit surface
4. Calculate lighting and shading

### Important Techniques
- **Soft Shadows**: Using penumbra from distance field
- **Smooth Blending**: Combining shapes with smooth minimum
- **Domain Repetition**: Infinite patterns using mod operations
- **Ambient Occlusion**: Sampling nearby points for self-shadowing

## Historical Context

IQ's work on SDFs starting in 2007-2008 showed that non-trivial content could be created:
- Soft shadows
- Smooth blending
- Domain repetition
- All running in real-time

This work was inspired by:
- Alex Evans' work (2006)
- Keenan Crane's work (2005)

## Evolution

Over time, SDFs proved they could be:
- Art directed (not just mathematical curiosities)
- Used for complex modeling
- Properly shaded and filtered
- Lit realistically
- Animated convincingly

Eventually academia and industry noticed, leading to professional SDF modeling tools.

## Key Resources

- Articles on Raymarching: https://iquilezles.org/articles/
- Video tutorials: https://iquilezles.org/live
- Shadertoy examples: https://www.shadertoy.com/user/iq
- "Rendering Worlds with Two Triangles" lecture (2008)

## Example Projects by IQ

### Sea Creature (2022)
- KIFS recursive fractal schema
- Smooth-minimum and smooth-abs for organic shapes
- Volumetric rendering with transparencies

### Selfie Girl (2020)
- Second human SDF
- First attempt at facial animation
- Only 32 primitives for entire scene

### Sphere Gears (2019)
- Optimization exercise using symmetry
- Only 4 gear pieces evaluated instead of 18
- Single tooth evaluated instead of 12

### Happy Jumping (2019)
- Character animation
- Simple character design
- 3-light rig (key, fill, bounce)

### Fractal Cave (2016)
- Menger sponge fractal with variations
- Heavy domain distortion
- Path-traced raymarching

---

**Fetched**: October 4, 2025
**License**: Educational use for fractal-explorer project
