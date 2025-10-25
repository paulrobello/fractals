# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A high-performance WebGL fractal explorer using Three.js and GPU-based ray marching. Renders stunning 3D fractals (Menger Sponge, Mandelbulb, Sierpinski Tetrahedron, Mandelbox) in real-time with advanced lighting and coloring systems.

## Development Commands

```bash
# Start development server (opens at http://localhost:3333)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture & Critical Concepts

### Shader-Based Ray Marching Architecture

The core rendering uses **GPU ray marching** via GLSL fragment shaders, not traditional Three.js meshes:

1. **Full-screen quad** (`src/main.js:257-260`) - A simple plane that fills the screen
2. **Fragment shader** (`src/shaders/fractal.frag.glsl`) - Does ALL rendering work:
   - Ray marching loop finds surface intersections
   - Signed Distance Functions (SDFs) define fractal geometry
   - Lighting calculations (Phong, AO, soft shadows)
   - Color palette system with orbit traps
3. **Uniforms** - JavaScript passes parameters to shader (camera position, fractal type, lighting, etc.)

**Key insight:** Editing fractal appearance means editing GLSL shader code, not Three.js objects.

### Shader Module System

Shaders use **Vite GLSL imports** (`vite-plugin-glsl`) to organize code:

- `fractal.frag.glsl` - Main fragment shader (imports all modules)
- `fractal.vert.glsl` - Simple vertex shader (pass-through)
- `includes/` directory - Modular shader functions:
  - `common.glsl` - Constants and utilities
  - `sdf-primitives.glsl` - Basic shapes (sphere, box, plane)
  - `sdf-operations.glsl` - Boolean operations (union, subtraction)
  - `sdf-menger.glsl`, `sdf-mandelbulb.glsl`, etc. - Fractal implementations
  - `ray-marching.glsl` - Ray marching algorithm
  - `lighting.glsl` - Phong shading, AO, soft shadows
  - `coloring.glsl` - Color palettes and orbit trap coloring

Changes to shader includes require **hot reload** (Vite handles automatically).

### State Management Pattern

```javascript
// Main state lives in FractalExplorer class (src/main.js)
this.uniforms = {
  u_time: { value: 0.0 },
  u_cameraPos: { value: new THREE.Vector3() },
  u_fractalType: { value: 1 }, // 0=primitives, 1=Menger, 2=Mandelbulb, etc.
  u_iterations: { value: 6 },
  // ... 40+ parameters
};

// GUI (src/ui/GUIManager.js) creates controls that modify uniforms
this.params = {
  fractalType: 1,
  iterations: 6,
  // ... mirrors uniforms
};

// Changes flow: GUI → params → uniforms → shader (every frame)
```

**Critical:** Always sync `params` → `uniforms` when GUI changes. See `GUIManager.syncAllParams()`.

### Camera System

Uses **PointerLockControls** for first-person flight:

- WASD movement, mouse look, E/Q for up/down
- Camera position/rotation auto-saved to localStorage every 1 second
- `u_cameraPos` and `u_cameraTarget` uniforms update shader ray origins

**Important:** Shader uses camera for ray marching, not for rendering a mesh. Moving camera = changing ray starting points.

### Color System Architecture

Four distinct color modes (controlled by `u_colorMode` uniform):

1. **Material Mode** (0) - Simple solid colors, checker pattern for ground
2. **Orbit Trap Mode** (1) - Colors based on fractal iteration geometry:
   - Tracks minimum distance to geometric features during iteration
   - Maps orbit trap value → palette color using cosine gradients
   - `u_orbitTrapScale` controls color frequency/banding
3. **Distance Mode** (2) - Colors based on ray travel distance
4. **Normal Mode** (3) - Matcap-style visualization (normals → RGB)

**5 Color Palettes** (Inigo Quilez cosine palette technique):

- Deep Ocean (blues), Molten Lava (reds), Electric (cyan/magenta), Organic (greens), Monochrome

### Performance Optimization System

**Three-tier quality system:**

- `u_maxSteps` - Maximum ray marching iterations (64-256)
- `u_iterations` - Fractal detail level (4-16)
- Auto-detected on startup, cached to localStorage

**Advanced optimizations** (Phase 5, all enabled by default):

- **Adaptive relaxation** - Distance-based step sizing (0.6-2.0 range)
- **Dithering** - Film-grain noise to reduce color banding
- **Distance LOD** - Reduce precision for distant surfaces (40-60% speedup)

Located in: Performance → Advanced Optimizations (GUI folder)

### Visual Preset System

6 complete scene configurations (`src/config/presets.js`):

- Deep Ocean Menger, Molten Mandelbulb, Electric Sierpinski, Organic Mandelbox, Performance Mode, Monochrome Dreams
- Each preset defines: fractal type, iterations, colors, lighting, camera position, animation speeds
- Applied via dropdown in GUI (top of panel)

## Critical File Locations

```
src/
├── main.js                    # Entry point, FractalExplorer class, animation loop
├── shaders/
│   ├── fractal.frag.glsl      # Main fragment shader (ALL rendering logic)
│   ├── fractal.vert.glsl      # Vertex shader (simple pass-through)
│   └── includes/              # Shader modules (imported by main shader)
├── ui/
│   └── GUIManager.js          # lil-gui controls, 40+ parameters
├── config/
│   └── presets.js             # 6 visual preset configurations
├── controls/
│   └── FlyControls.js         # (deprecated - using PointerLockControls)
└── core/
    └── PerformanceTest.js     # GPU benchmarking on startup
```

## Common Development Tasks

### Adding a New Fractal

1. **Create SDF function** in `src/shaders/includes/sdf-newfractal.glsl`:

   ```glsl
   float sdNewFractal(vec3 p, int iterations) {
     // Your fractal math here
     return distance;
   }
   ```

2. **Import in main shader** (`fractal.frag.glsl`):

   ```glsl
   // Add #include directive at top
   ```

3. **Add to fractal selector** in `map()` function:

   ```glsl
   else if (u_fractalType == 5) {
     vec3 fp = rotate3D(p, u_rotation);
     fp /= u_fractalScale;
     fractal = sdNewFractal(fp, u_iterations) * u_fractalScale;
   }
   ```

4. **Update GUI** in `GUIManager.js`:

   ```javascript
   fractalTypeOptions: {
     // ... existing
     'New Fractal': 5
   }
   ```

5. **Add keyboard shortcut** in `main.js` (optional):
   ```javascript
   case 'Digit6':
     this.uniforms.u_fractalType.value = 5;
   ```

### Modifying Lighting

All lighting happens in shader (`fractal.frag.glsl` main function):

- **Phong model:** ambient + diffuse + specular
- **Ambient Occlusion:** `calcAO()` function (5-step trace)
- **Soft Shadows:** `calcSoftShadow()` function (configurable steps)
- **Normal calculation:** `calcNormalEnhanced()` (tetrahedron method)

GUI parameters → uniforms → shader:

```javascript
(u_ambientStrength, u_diffuseStrength, u_specularStrength, u_shininess);
(u_aoEnabled, u_softShadowsEnabled, u_softShadowSteps, u_shadowSharpness);
```

### Adding GUI Controls

Pattern in `GUIManager.js`:

```javascript
// 1. Add to params object
this.params = {
  myNewParam: 1.0
}

// 2. Create controller
const myFolder = this.gui.addFolder('My Folder');
myFolder.add(this.params, 'myNewParam', 0, 10, 0.1)
  .name('My Parameter')
  .onChange(value => {
    this.uniforms.u_myNewParam.value = value;
  });

// 3. Add uniform to main.js
this.uniforms = {
  u_myNewParam: { value: 1.0 }
}

// 4. Use in shader
uniform float u_myNewParam;
```

### Debugging Shader Issues

**Black screen?**

1. Check browser console for GLSL compile errors
2. Verify all uniforms match between JS and shader
3. Test with simpler fractal (primitives mode)

**Performance issues?**

1. Lower `u_maxSteps` (64-128 for debugging)
2. Reduce `u_iterations` (4-8 for complex fractals)
3. Disable AO and soft shadows temporarily
4. Check Stats.js panel (top-left, FPS/MS)

**Color banding?**

1. Enable dithering (`u_enableDithering: true`, strength 1.0+)
2. Adjust `u_orbitTrapScale` (try 0.5-5.0 range)
3. Increase `u_colorIntensity`

**Lighting artifacts (bright corners)?**

1. Increase `u_normalEpsilon` (0.0001 → 0.001)
2. Enable soft shadows with higher step count
3. Reduce `u_stepRelaxation` (0.9 → 0.7)

## localStorage Keys

```javascript
'fractalExplorer_cameraPosition'; // Camera pos + rotation (saved every 1s)
'fractalExplorer_quality'; // Quality preset cache
'fractalExplorer_hasVisited'; // Help overlay shown flag
```

## Key Technical Details

### Ray Marching Loop Structure

```glsl
// Pseudocode from fractal.frag.glsl
for (int i = 0; i < MAX_STEPS; i++) {
  vec3 p = rayOrigin + rayDirection * t;
  float distance = map(p); // Call fractal SDF

  if (distance < EPSILON) return HIT;
  if (t > MAX_DIST) break;

  t += distance * relaxation; // Step forward
}
return MISS;
```

### Fractal SDF Pattern

All fractals follow this pattern:

```glsl
float sdFractal(vec3 p, int iterations) {
  vec3 z = p;
  float scale = 1.0;

  for (int i = 0; i < 20; i++) {
    if (i >= iterations) break;

    // Fractal transformation
    z = transform(z);
    scale *= scaleFactor;
  }

  return estimateDistance(z) / scale;
}
```

### Performance Characteristics

**Target FPS by hardware:**

- Low (Intel UHD): 30 FPS @ 720p, Low quality
- Medium (GTX 1060): 60 FPS @ 1080p, Medium quality
- High (RTX 3060): 60 FPS @ 1080p, High quality
- Ultra (RTX 4080+): 120 FPS @ 1440p+, Ultra quality

**Cost hierarchy (expensive → cheap):**

1. Soft shadows (30+ extra ray marches per pixel)
2. Ambient occlusion (5 extra samples per pixel)
3. High iteration count (exponential complexity)
4. High max steps (linear ray march cost)
5. Specular highlights (cheap, just dot products)

## Important Implementation Notes

1. **No Direct Mesh Editing:** Fractals are mathematical functions in shaders, not Three.js Mesh objects. You cannot `.add()` or `.remove()` them.

2. **Hot Reload Works:** Vite watches GLSL files. Shader changes apply instantly without page refresh.

3. **Uniform Updates Every Frame:** Animation loop (`animate()`) copies JavaScript values to shader uniforms. Changes must go through uniforms, not direct shader edits.

4. **Rotation System:** `u_rotation` (vec3) applies per-axis rotations in shader using rotation matrices. Animated via `this.rotation` in main.js.

5. **Ground Plane Always Visible:** `map()` function always includes ground plane (`sdPlaneXZ`) via `opUnion()`. Prevents empty scenes.

6. **Camera Auto-Save:** Position/rotation persisted every 1 second. Users can explore and return to same location on reload.

## Development Workflow Tips

- **Test incrementally** - Change one parameter at a time
- **Use keyboard shortcuts** - Faster than GUI for fractal switching (1-5 keys)
- **Monitor FPS** - Stats panel shows performance impact immediately
- **Save good camera positions** - Wait 1 second after finding interesting angle
- **Check docs/** - PLAN.md has phase-by-phase implementation details
- **Reference research** - RAY_MARCHING_RESEARCH.md for SDF techniques

## References

- **Inigo Quilez:** https://iquilezles.org/ - Ray marching, SDF library, fractal math
- **Shadertoy:** https://www.shadertoy.com/ - Live shader examples
- **Three.js Docs:** https://threejs.org/docs/ - WebGL framework
- **Local docs:** `docs/references/` - IQ articles on ray marching, Mandelbulb, SDFs
