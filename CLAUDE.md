# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A high-performance WebGL fractal explorer using Three.js and GPU-based ray marching. Renders 8+ fractals (Menger Sponge, Mandelbulb, Sierpinski, Mandelbox, World/Gyroid, Truchet Pipes, DEC preview, primitives) in real-time with advanced lighting, procedural textures, custom palettes, and production-grade performance tuning.

## Development Commands

```bash
# Start development server (opens at http://localhost:3333)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Code quality
npm run lint          # Check code style
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Architecture & Critical Concepts

### Modular Class Architecture (2025 Refactor)

The codebase is organized into focused classes instead of a monolithic main.js:

**Entry Point Flow:**
```
src/main.js (3 lines)
  └─> FractalExplorer (coordinator)
       ├─> Renderer (Three.js setup, camera, scene)
       ├─> ShaderManager (shaders, uniforms, materials)
       ├─> Controls (PointerLockControls, keyboard)
       ├─> UI (Stats, loading, toasts, help overlay)
       └─> GUIManager (lil-gui controls)
```

**Key Classes:**

- **`FractalExplorer`** (`src/app/FractalExplorer.js`) - Main coordinator
  - Owns the animation loop
  - Manages camera movement and rotation
  - Handles init sequence (shader compilation → benchmark → GUI setup)
  - Exposes `this.uniforms` (alias to ShaderManager.uniforms for compatibility)

- **`Renderer`** (`src/app/Renderer.js`) - Three.js initialization
  - Creates WebGLRenderer with high-performance settings
  - Sets up camera (PerspectiveCamera with configurable FOV)
  - Creates scene (simple black background, no lights needed)
  - Installs GL compile/link hooks for shader error reporting
  - Handles window resize events

- **`ShaderManager`** (`src/app/ShaderManager.js`) - Shader system (CRITICAL)
  - **Owns all uniforms** - canonical source of shader state
  - Compiles shaders with Vite GLSL imports
  - **Shader specialization**: Compile-time `FRAC_TYPE` constant for performance
  - **Two-pass rendering**: Fractal render → post-processing (optional)
  - **DEC preview**: Hot-swaps SDF functions from `dec/` directory
  - Material caching and prewarming to avoid stutter
  - Render targets for post-processing pipeline

- **`Controls`** (`src/app/Controls.js`) - User input
  - PointerLockControls for first-person camera
  - Keyboard event handlers (WASD, E/Q, Shift, number keys)
  - Movement state flags (moveForward, moveBackward, etc.)
  - Camera position auto-save to localStorage (every 1 second)

- **`UI`** (`src/app/UI.js`) - Visual feedback
  - Stats.js FPS counter (top-left)
  - Loading screen with progress bar
  - Toast notifications (bottom-right)
  - Help overlay (H key to toggle)
  - Debug overlay (shader/performance stats)

- **`GUIManager`** (`src/ui/GUIManager.js`) - lil-gui controls
  - 100+ parameters organized into folders
  - Syncs `params` → `uniforms` via onChange callbacks
  - Preset system integration
  - Custom palette editor (add/remove/edit stops)
  - DEC preview controls
  - Performance profiling tools

- **`PaletteManager`** (`src/core/PaletteManager.js`) - Custom palettes
  - Create/edit/delete palettes (up to 8 color stops)
  - Linear or cosine interpolation modes
  - Wrap modes: clamp, repeat, mirror
  - Import/export JSON
  - Persists to localStorage (`fractalExplorer_palettes_v1`)

- **`PerformanceTest`** (`src/core/PerformanceTest.js`) - Auto-benchmarking
  - Runs on first launch (no modal, inline during loading)
  - Measures real FPS using requestAnimationFrame
  - Detects quality tier (Ultra/High/Medium/Low)
  - Caches results to localStorage
  - Sets `u_maxSteps` and `u_iterations` based on GPU capability

### Shader-Based Ray Marching Architecture

The core rendering uses **GPU ray marching** via GLSL fragment shaders, not traditional Three.js meshes:

1. **Full-screen quad** - A simple plane that fills the viewport (created in ShaderManager)
2. **Fragment shader** (`src/shaders/fractal.frag.glsl`) - Does ALL rendering work:
   - Ray marching loop finds surface intersections
   - Signed Distance Functions (SDFs) define fractal geometry
   - Lighting calculations (Phong, AO, soft shadows)
   - Procedural textures (triplanar mapping with LOD)
   - Color palette system with orbit traps
   - Floor/plane rendering with analytic ray-plane intersection
3. **Uniforms** - JavaScript passes parameters to shader (camera, fractal type, lighting, etc.)
4. **Post-processing pass** (optional) - Tone mapping, exposure, vignette, color grading

**Key insight:** Editing fractal appearance means editing GLSL shader code, not Three.js objects.

### Shader Module System

Shaders use **Vite GLSL imports** (`vite-plugin-glsl`) to organize code:

**Main Shaders:**
- `fractal.frag.glsl` - Main fragment shader (imports all modules)
- `fractal.vert.glsl` - Simple vertex shader (pass-through)
- `post.frag.glsl` - Post-processing fragment shader
- `screen.vert.glsl` - Screen-space vertex shader for post pass

**Include Modules (`src/shaders/includes/`):**
- `common.glsl` - Constants, utilities, rotation matrices
- `sdf-primitives.glsl` - Basic shapes (sphere, box, plane, torus)
- `sdf-operations.glsl` - Boolean operations (union, subtraction, smooth blend)
- `sdf-menger.glsl` - Menger Sponge fractal
- `sdf-mandelbulb.glsl` - Mandelbulb fractal (configurable power)
- `sdf-sierpinski.glsl` - Sierpinski Tetrahedron
- `sdf-mandelbox.glsl` - Mandelbox fractal
- `sdf-amazing-surf.glsl` - World/Gyroid fractal (Amazing Surf)
- `sdf-truchet-pipes.glsl` - Truchet Pipes world
- `procedural-textures.glsl` - FBM noise, triplanar mapping, texture LOD
- `ray-marching.glsl` - Ray marching algorithm with adaptive relaxation
- `lighting.glsl` - Phong shading, AO, soft shadows, normal calculation
- `coloring.glsl` - Color palettes, orbit trap coloring, palette interpolation
- `dec/` - DEC (Distance Estimated Catalog) preview system

**DEC Preview System:**
- `dec/__user__.glsl` - Default stub (gets replaced with selected SDF)
- `dec/manifest.json` - Index of all available DEC entries
- `dec/primitive/`, `dec/fractal/`, `dec/operator/` - Categorized SDFs
- Hot-swappable: GUI dropdown switches active SDF without page reload

Changes to shader includes trigger **Vite hot reload** (instant update, no page refresh).

### State Management Pattern

```javascript
// State lives in ShaderManager.uniforms (canonical source)
class ShaderManager {
  setupShader() {
    this.uniforms = {
      u_time: { value: 0.0 },
      u_cameraPos: { value: new THREE.Vector3() },
      u_fractalType: { value: 1 }, // 0=primitives, 1=Menger, 2=Mandelbulb, ...
      u_iterations: { value: 6 },
      // ... 100+ parameters
    };
  }
}

// GUIManager creates controls that modify uniforms
class GUIManager {
  constructor(uniforms, camera, callbacks) {
    this.uniforms = uniforms; // Reference to ShaderManager.uniforms
    this.params = {
      fractalType: 1,
      iterations: 6,
      // ... mirrors uniforms for GUI binding
    };
  }
}

// FractalExplorer exposes uniforms for backward compatibility
class FractalExplorer {
  init() {
    this.shaderManager.setupShader();
    this.uniforms = this.shaderManager.uniforms; // Alias for legacy code
  }
}

// Changes flow: GUI → params → uniforms → shader (every frame)
```

**Critical:** Always sync `params` → `uniforms` when GUI changes. GUIManager handles this in `.onChange()` callbacks.

### Shader Specialization System

**Performance optimization via compile-time constants:**

```javascript
// ShaderManager compiles specialized shaders per fractal type
applyMaterialSpecializationIfNeeded(force = false) {
  const fractalType = this.uniforms.u_fractalType.value;
  const cacheKey = `specialized_${fractalType}`;

  if (!this.decMaterialCache.has(cacheKey)) {
    // Inject #define FRAC_TYPE {fractalType} into shader
    // Allows GLSL compiler to optimize out unused branches
    this.decMaterialCache.set(cacheKey, compiledMaterial);
  }

  this.material = this.decMaterialCache.get(cacheKey);
}
```

**Why this matters:**
- 20-40% performance gain by eliminating runtime branches
- Shaders prewarmed on startup to avoid first-switch stutter
- Automatic cache invalidation when shader source changes

### Camera System

Uses **PointerLockControls** for first-person flight:

- WASD movement, mouse look, E/Q for up/down
- Shift to boost speed (2x multiplier)
- Smooth acceleration/deceleration (exponential lerp)
- **Fly Mode** toggle: pitch-forward movement vs. ground-constrained
- Camera position/rotation auto-saved to localStorage every 1 second
- `u_cameraPos` and `u_cameraTarget` uniforms update shader ray origins

**Important:** Shader uses camera for ray marching, not for rendering a mesh. Moving camera = changing ray starting points.

**Camera persistence keys:**
- `fractalExplorer_cameraPosition` - JSON with position, rotation, timestamp

### Color System Architecture

Four distinct color modes (controlled by `u_colorMode` uniform):

1. **Material Mode** (0) - Simple solid colors
   - Fractal: `u_materialColor`
   - Floor: Checkerboard pattern with `u_floorColorA` / `u_floorColorB`

2. **Orbit Trap Mode** (1) - Colors based on fractal iteration geometry
   - Tracks minimum distance to geometric features during iteration
   - Maps orbit trap value → palette color
   - `u_orbitTrapScale` controls color frequency/banding
   - Supports custom palettes (up to 8 stops)

3. **Distance Mode** (2) - Colors based on ray travel distance
   - Uses palette to map distance → color
   - Good for fog-like effects

4. **Normal Mode** (3) - Matcap-style visualization (normals → RGB)
   - Useful for debugging geometry

**Custom Palette System:**
- Built-in palettes: Deep Ocean, Molten Lava, Electric, Organic, Monochrome
- Create custom palettes: GUI → Color → Custom Palettes
- Interpolation modes: Linear (smooth gradients) or Cosine (IQ technique)
- Wrap modes: Clamp (solid at edges), Repeat (tile), Mirror (reflect)
- Import/export JSON format for sharing
- Live preview in GUI with gradient bar

### Procedural Texture System

**World fractals (Gyroid, Truchet) support procedural textures:**

**Texture Types:**
- FBM Noise - Multi-octave Perlin-like noise
- Voronoi - Cellular patterns
- Truchet - Pipe-based patterns
- Checkerboard - Classic grid

**Dual-Layer Blending:**
- Texture A (primary) + Texture B (secondary)
- Blend modes: Mix, Add, Multiply, Overlay
- Separate alpha controls for Color/Bump/Specular

**Triplanar Mapping:**
- Projects texture from 3 axes, blends by normal
- Eliminates UV seams on arbitrary geometry
- **Top-2 optimization**: Only evaluate 2 strongest projections
  - 30-50% speedup vs. full triplanar
  - Min weight threshold and hysteresis to prevent flicker

**Texture LOD System:**
- Derivative-based octave reduction (mimics GPU mipmaps)
- Distance-based fade for bump and specular
- Per-channel LOD controls (aggression, bump fade, spec fade)
- **Texture Quality Presets**: Performance / Balanced / Crisp
- Fast auto-tuner: GUI → Performance → Profiling → "Tune Texture (fast)"

**Advanced Features:**
- Domain warp: Noise-based distortion of texture coordinates
- FBM controls: Octaves, lacunarity, gain, seed
- Anisotropic anti-aliasing: Smooths texture at grazing angles
- Auto-attenuation: Fades texture on distant/small features
- Attribute gating: Skip gradient calculations when strength is zero

### Performance Optimization System

**Quality Presets:**
- Ultra: 256 steps, 16 iterations, all effects enabled
- High: 180 steps, 12 iterations, full quality
- Medium: 128 steps, 8 iterations, reduced shadow quality
- Low: 64 steps, 6 iterations, minimal effects

Auto-detected on startup, cached to localStorage (`fractalExplorer_quality`).

**Advanced Optimizations (GUI → Performance → Advanced Optimizations):**

- **Adaptive Step Size** - Distance-based relaxation (0.6-2.0 range)
  - Larger steps far from surfaces, smaller near details
  - Controlled by `u_stepRelaxation`

- **Epsilon LOD** - Distance-based precision reduction
  - Near epsilon (0.0001) for close surfaces
  - Far epsilon (0.001+) for distant surfaces
  - 40-60% speedup on complex scenes

- **Budget LOD** - Dynamic quality scaling based on distance
  - Step cap (reduce max steps for distant pixels)
  - AO/Shadow floor (skip expensive effects beyond threshold)
  - Far-shadow skip (disable shadows at distance)
  - Budget presets: Quality, Balanced, Performance

- **Dithering** - Film-grain noise to reduce color banding
  - Controlled by `u_enableDithering` and `u_ditherStrength`

- **Fast Toggles** (for World/Truchet fractals)
  - Fast Normals: Cheaper gradient calculation
  - Fast Shadows: Reduced shadow quality
  - Fast AO: Simplified ambient occlusion

**Frustum Budget Drop:**
- Detects when camera is inside/very close to fractal
- Temporarily reduces budgets to maintain FPS
- Hysteresis prevents flickering
- Auto-restores when camera moves away

**Debug Overlay:**
- Press D to toggle
- Shows: FPS, budget states, texture optimizations, LOD settings
- Self-describing screenshots (include settings in image)

### Visual Preset System

Complete scene configurations (`src/config/presets.js`):

**Fractal Presets:**
- Deep Ocean Menger
- Molten Mandelbulb
- Electric Sierpinski
- Organic Mandelbox
- Performance Mode
- Monochrome Dreams

**World Presets:**
- Bridges (World, Segment) - Fast fly-through
- Cathedral (World, Sphere) - Beauty shot
- Cathedral Cavern (World) - Sphere baseline
- Truchet Interior (Perf) - Performance-tuned interior
- Pipe Catacombs (Baseline Tex) - Textured baseline

Each preset defines:
- Fractal type and iterations
- Colors, palette, color mode
- Lighting (position, strengths, shininess)
- Camera position and orientation
- Animation speeds
- Fog and environment settings
- Performance budgets (for specialized presets)

Applied via dropdown in GUI (top of panel). Presets overwrite current settings completely.

## Critical File Locations

```
src/
├── main.js                          # Entry point (3 lines)
├── app/                             # Core application classes
│   ├── FractalExplorer.js           # Main coordinator, animation loop
│   ├── Renderer.js                  # Three.js setup, camera, scene
│   ├── ShaderManager.js             # Shaders, uniforms, materials (CRITICAL)
│   ├── Controls.js                  # PointerLockControls, keyboard
│   └── UI.js                        # Stats, loading, toasts
├── shaders/
│   ├── fractal.frag.glsl            # Main fragment shader
│   ├── fractal.vert.glsl            # Vertex shader
│   ├── post.frag.glsl               # Post-processing fragment
│   ├── screen.vert.glsl             # Post-processing vertex
│   └── includes/                    # Shader modules
│       ├── common.glsl
│       ├── sdf-*.glsl               # Fractal SDFs
│       ├── ray-marching.glsl
│       ├── lighting.glsl
│       ├── coloring.glsl
│       ├── procedural-textures.glsl
│       └── dec/                     # DEC preview catalog
│           ├── manifest.json
│           ├── __user__.glsl
│           ├── primitive/
│           ├── fractal/
│           └── operator/
├── ui/
│   └── GUIManager.js                # lil-gui controls (100+ parameters)
├── core/
│   ├── PerformanceTest.js           # GPU benchmarking
│   └── PaletteManager.js            # Custom palette system
├── config/
│   ├── defaults.js                  # All default values (single source)
│   ├── presets.js                   # Visual preset configurations
│   └── utils.js                     # Preset override utilities
└── controls/
    └── FlyControls.js               # (deprecated - using PointerLockControls)
```

## Common Development Tasks

### Adding a New Fractal

1. **Create SDF function** in `src/shaders/includes/sdf-newfractal.glsl`:

   ```glsl
   float sdNewFractal(vec3 p, int iterations) {
     vec3 z = p;
     float dr = 1.0;

     for (int i = 0; i < 20; i++) {
       if (i >= iterations) break;

       // Your fractal transformation
       z = yourTransform(z);
       dr *= derivativeScale;
     }

     return length(z) / dr;
   }
   ```

2. **Import in ShaderManager** (`src/app/ShaderManager.js`):

   ```javascript
   import sdfNewFractalGLSL from '../shaders/includes/sdf-newfractal.glsl';
   ```

3. **Add to fractal selector** in `fractal.frag.glsl` `map()` function:

   ```glsl
   else if (u_fractalType == 8) {
     vec3 fp = rotate3D(p, u_rotation);
     fp /= u_fractalScale;
     fractal = sdNewFractal(fp, u_iterations) * u_fractalScale;
   }
   ```

4. **Update GUI** in `GUIManager.js`:

   ```javascript
   const fractalTypeOptions = {
     // ... existing
     'New Fractal': 8
   };
   ```

5. **Add keyboard shortcut** in `Controls.js` (optional):

   ```javascript
   case 'Digit8':
     this.app.uniforms.u_fractalType.value = 8;
     this.app.shaderManager.applyMaterialSpecializationIfNeeded();
   ```

6. **Add to specialization** in `ShaderManager.js`:

   ```javascript
   // Add to prewarmSpecializedMaterials call in FractalExplorer.init()
   await this.shaderManager.prewarmSpecializedMaterials([0, 1, 2, 3, 4, 5, 6, 7, 8]);
   ```

### Modifying Lighting

All lighting happens in shader (`fractal.frag.glsl` main function):

**Lighting Components:**
- **Phong model:** ambient + diffuse + specular
- **Ambient Occlusion:** `calcAO()` function (configurable steps)
- **Soft Shadows:** `calcSoftShadow()` function (configurable steps and sharpness)
- **Normal calculation:** `calcNormalEnhanced()` or `calcNormalFast()` (tetrahedron method)

**GUI parameters → uniforms → shader:**

```javascript
// Lighting strength
u_ambientStrength, u_diffuseStrength, u_specularStrength, u_shininess

// Effects
u_aoEnabled, u_aoSteps, u_aoIntensity, u_aoDistance
u_softShadowsEnabled, u_softShadowSteps, u_shadowSharpness

// Normal precision
u_normalEpsilon  // Lower = sharper but may show artifacts

// Fast toggles (World/Truchet only)
u_fastNormals, u_fastShadows, u_fastAO
```

**Floor-specific lighting:**
- `u_floorReceiveShadows` - Toggle floor shadows (analytic plane)
- Floor uses separate logic (no AO, optional shadows)

### Adding GUI Controls

Pattern in `GUIManager.js`:

```javascript
// 1. Add to params object (constructor)
this.params = {
  myNewParam: 1.0
}

// 2. Add uniform to ShaderManager.setupShader()
this.uniforms = {
  u_myNewParam: { value: 1.0 }
}

// 3. Create controller in GUIManager
const myFolder = this.gui.addFolder('My Folder');
myFolder.add(this.params, 'myNewParam', 0, 10, 0.1)
  .name('My Parameter')
  .onChange(value => {
    this.uniforms.u_myNewParam.value = value;
  });

// 4. Use in shader (fractal.frag.glsl)
uniform float u_myNewParam;

void main() {
  // ... use u_myNewParam
}
```

**Important:** For persistence, add to `DEFAULTS` in `src/config/defaults.js`.

### Debugging Shader Issues

**Black screen or shader error panel?**

1. Check shader error panel (red border, click "Copy InfoLog")
2. Check browser console for GLSL compile/link errors
3. Verify all uniforms match between JS and shader
4. Test with simpler fractal (primitives mode)
5. Check for typos in `#include` directives
6. Ensure Vite bundled shader includes correctly

**The shader error panel provides:**
- Full GLSL source with line numbers
- Compiler InfoLog (errors/warnings)
- Linker InfoLog
- Copy buttons for InfoLog and Sources
- Press Esc to dismiss

**Performance issues?**

1. Lower `u_maxSteps` (64-128 for debugging)
2. Reduce `u_iterations` (4-8 for complex fractals)
3. Disable AO and soft shadows temporarily
4. Turn off procedural textures
5. Check Stats.js panel (top-left, FPS/MS)
6. Enable Debug Overlay (D key) to see budget states
7. Check GPU usage in browser task manager
8. Test with shader specialization disabled (if issues persist)

**Color banding?**

1. Enable dithering (`u_enableDithering: true`, strength 1.5+)
2. Adjust `u_orbitTrapScale` (try 0.5-5.0 range)
3. Increase `u_colorIntensity`
4. Try different palette interpolation mode (linear vs. cosine)
5. Increase palette stops (more granular gradients)

**Lighting artifacts (bright corners, dark edges)?**

1. Increase `u_normalEpsilon` (0.0001 → 0.001)
2. Enable soft shadows with higher step count
3. Reduce `u_stepRelaxation` (0.9 → 0.7)
4. Check AO intensity (may be too strong)
5. Adjust light position (avoid grazing angles)

**Texture issues (shimmer, flicker, banding)?**

1. **Shimmer at distance:**
   - Increase LOD aggression
   - Enable bump/spec derivative fades
   - Increase texture anti-aliasing strength

2. **Flicker when moving:**
   - Increase Top-2 hysteresis
   - Raise Min Weight threshold
   - Switch to full triplanar (disable Top-2)

3. **Banding on curved surfaces:**
   - Increase texture scale (smaller features)
   - Adjust FBM octaves
   - Try different texture type

4. **Performance drop with textures:**
   - Use "Performance" texture quality preset
   - Enable Top-2 triplanar
   - Enable Fast Bump
   - Reduce FBM octaves

**Floor seams or "black gasket"?**

The 2025-10-10 floor pipeline should eliminate seams. If you see artifacts:
1. Check `u_floorEnabled` is true
2. Verify analytic plane logic in shader (`ResolveHit` section)
3. Check adaptive epsilon is enabled
4. Ensure floor is not part of SDF union (should be separate ray-plane test)

## localStorage Keys

```javascript
// Camera
'fractalExplorer_cameraPosition'      // Camera pos + rotation (saved every 1s)

// Performance
'fractalExplorer_quality'             // Quality preset cache (maxSteps, iterations)

// UI State
'fractalExplorer_hasVisited'          // Help overlay shown flag
'fractalExplorer_aoEnabled'           // AO preference
'fractalExplorer_softShadowsEnabled'  // Soft shadows preference
'fractalExplorer_statsVisible'        // Stats panel visibility

// Fractal State
'fractalExplorer_fractalType'         // Current fractal type

// DEC Preview
'fractalExplorer_decPreviewEnabled'   // DEC preview mode
'fractalExplorer_decEntry'            // Selected DEC entry path

// Palettes
'fractalExplorer_palettes_v1'         // Custom palette definitions (JSON)

// Presets
'fractalExplorer_presetOverrides'     // User overrides to presets
```

## Key Technical Details

### Ray Marching Loop Structure

```glsl
// Simplified from fractal.frag.glsl
float rayMarch(vec3 ro, vec3 rd, float maxDist, int maxSteps) {
  float t = 0.0;

  for (int i = 0; i < maxSteps; i++) {
    vec3 p = ro + rd * t;
    float d = map(p); // Call fractal SDF

    if (d < epsilon) return t; // Hit
    if (t > maxDist) break;    // Miss

    t += d * relaxation; // Adaptive step size
  }

  return -1.0; // Miss
}
```

**Key variables:**
- `epsilon` - Hit threshold, adaptive based on distance (Epsilon LOD)
- `relaxation` - Step size multiplier (0.6-2.0 via adaptive system)
- `maxSteps` - Budget controlled by quality preset and Budget LOD

### Fractal SDF Pattern

All fractals follow this pattern:

```glsl
float sdFractal(vec3 p, int iterations) {
  vec3 z = p;
  float dr = 1.0; // Derivative for distance estimation

  for (int i = 0; i < MAX_ITERATIONS; i++) {
    if (i >= iterations) break;

    // Fractal-specific transformation
    // Example (Mandelbulb):
    // - Convert to spherical coordinates
    // - Power iteration: (r, θ, φ) → (r^n, n*θ, n*φ)
    // - Add original point c
    // - Update derivative

    z = transform(z);
    dr = derivativeUpdate(dr);

    if (length(z) > bailout) break;
  }

  return length(z) / dr; // Distance estimate
}
```

**Distance estimation:**
- `length(z) / dr` approximates surface distance
- Smaller `dr` = sharper features but may overshoot
- Bailout radius prevents infinite loops

### Shader Specialization Details

**Without specialization:**
```glsl
float map(vec3 p) {
  if (u_fractalType == 0) return sdPrimitives(p);
  else if (u_fractalType == 1) return sdMenger(p);
  else if (u_fractalType == 2) return sdMandelbulb(p);
  // ... runtime branching for each pixel, every step
}
```

**With specialization (FRAC_TYPE = 1):**
```glsl
#define FRAC_TYPE 1

float map(vec3 p) {
  #if FRAC_TYPE == 0
    return sdPrimitives(p);
  #elif FRAC_TYPE == 1
    return sdMenger(p);  // Compiler keeps only this branch
  #elif FRAC_TYPE == 2
    return sdMandelbulb(p);
  #endif
}
```

**Performance impact:**
- 20-40% FPS gain on complex fractals
- Enables better GPU instruction cache usage
- Reduces register pressure

**Trade-off:**
- Requires recompilation when switching fractals
- ~200ms delay on first switch to new fractal type
- Mitigated by prewarming all materials on startup

### Two-Pass Rendering Pipeline

**Pass 1: Fractal Rendering**
```javascript
// Render to texture (or screen if post disabled)
renderer.setRenderTarget(u_postEnabled ? renderTarget : null);
renderer.render(scene, camera);
```

**Pass 2: Post-Processing** (if enabled)
```javascript
// Render fullscreen quad with post shader
postMaterial.uniforms.u_colorTex.value = renderTarget.texture;
renderer.setRenderTarget(null);
renderer.render(postScene, postCamera);
```

**Post-processing effects:**
- Tone mapping: Linear, Reinhard, ACES, Uncharted 2
- Exposure and contrast
- Saturation adjustment
- Gamma correction
- Vignette (strength and softness)

**When to use:**
- Tone mapping for HDR-like appearance
- Vignette for cinematic look
- Exposure adjustment for bright/dark scenes

**Performance cost:** ~5-10% FPS hit, depends on screen resolution

### Floor/Plane Pipeline (2025-10-10 Update)

**Key innovation:** Analytic ray-plane intersection, not SDF union.

**Old approach (pre-2025-10-10):**
- Floor was part of SDF via `opUnion(fractal, plane)`
- Caused seam artifacts ("black gasket") at intersection
- Required bias/padding hacks

**New approach:**
```glsl
// 1. Ray march fractal (ignore floor in map())
float tFractal = rayMarch(ro, rd);

// 2. Analytic ray-plane intersection
float tPlane = rayPlaneIntersect(ro, rd, planeY);

// 3. Resolve visibility with seam tolerance
Hit hit = resolveHit(tFractal, tPlane, epsilon);

// 4. Apply lighting based on surface type
if (hit.isFloor) {
  // Floor: skip AO, optional shadows
} else {
  // Fractal: full lighting
}
```

**Benefits:**
- No seam artifacts
- No under-floor imprinting
- Simpler defaults (no floor-specific biases)
- Correct fog distance for both surfaces

### Performance Characteristics

**Target FPS by hardware:**

- Low (Intel UHD): 30 FPS @ 720p, Low quality
- Medium (GTX 1060): 60 FPS @ 1080p, Medium quality
- High (RTX 3060): 60 FPS @ 1080p, High quality
- Ultra (RTX 4080+): 90+ FPS @ 1440p, Ultra quality

**Cost hierarchy (expensive → cheap):**

1. **Procedural textures** (60-80% cost on World/Truchet)
   - Mitigated by Top-2 triplanar, Fast Bump, LOD v2
2. **Soft shadows** (30+ extra ray marches per pixel)
   - Step count matters: 24 steps = ~2x cost of 12 steps
3. **Ambient occlusion** (5-8 extra samples per pixel)
   - AO steps configurable, diminishing returns above 6
4. **High iteration count** (exponential complexity)
   - Mandelbulb/Mandelbox scale poorly above 12 iterations
5. **High max steps** (linear ray march cost)
   - Budget LOD helps by reducing far-pixel steps
6. **Specular highlights** (cheap, just dot products)

**Optimization order for slow scenes:**
1. Enable Budget LOD (Balanced or Performance preset)
2. Enable Epsilon LOD
3. Reduce soft shadow steps (24 → 12)
4. Reduce AO steps (8 → 4)
5. Lower iterations (12 → 8)
6. Enable Fast toggles (for World/Truchet)
7. Lower max steps (180 → 128)
8. Use shader specialization (should be on by default)

## Important Implementation Notes

1. **No Direct Mesh Editing:** Fractals are mathematical functions in shaders, not Three.js Mesh objects. You cannot `.add()` or `.remove()` them.

2. **Hot Reload Works:** Vite watches GLSL files. Shader changes apply instantly without page refresh (may see brief flicker).

3. **Uniform Updates Every Frame:** Animation loop (`FractalExplorer.animate()`) syncs JavaScript values to shader uniforms. Changes must go through uniforms, not direct shader edits.

4. **Rotation System:** `u_rotation` (vec3) applies per-axis rotations in shader using rotation matrices. Animated via `this.rotation` in FractalExplorer.

5. **State Lives in ShaderManager:** `this.shaderManager.uniforms` is canonical source. `FractalExplorer.uniforms` is an alias for compatibility.

6. **Camera Auto-Save:** Position/rotation persisted every 1 second via Controls class. Users can explore and return to same location on reload.

7. **Shader Specialization Required:** After changing `u_fractalType`, call `this.shaderManager.applyMaterialSpecializationIfNeeded()` to recompile shader.

8. **DEC Preview Modifies Shaders:** Enabling DEC preview injects SDF code into shader. Requires rebuild via `applyDecMappingAndRebuild()`.

9. **Texture System is Optional:** Only World/Truchet fractals use procedural textures. Other fractals ignore texture uniforms.

10. **Post-Processing is Optional:** Disabled by default. Enable in GUI → Post-Processing folder.

11. **Floor Shadows are Optional:** Controlled by `u_floorReceiveShadows`. Disabling saves ~10-15% cost when floor is visible.

12. **localStorage Errors are Silent:** All localStorage operations wrapped in try/catch. App works without persistence.

## Development Workflow Tips

- **Test incrementally** - Change one parameter at a time
- **Use keyboard shortcuts** - Faster than GUI for fractal switching (1-6 keys)
- **Monitor FPS** - Stats panel shows performance impact immediately
- **Use Debug Overlay** - Press D to see detailed performance stats
- **Save good camera positions** - Wait 1 second after finding interesting angle
- **Check docs/PLAN.md** - Has implementation details and baselines
- **Use profiling tools** - GUI → Performance → Profiling for batch benchmarks
- **Export presets** - GUI → Presets → Export Settings to JSON for sharing
- **Screenshot for bug reports** - Press S, includes fractal type and quality in filename

## Troubleshooting Common Issues

**Shader compilation fails on startup:**
- Check shader error panel for InfoLog
- Verify all `#include` directives resolve
- Check for syntax errors in shader files
- Clear browser cache (Ctrl+Shift+Delete)
- Check Vite console output for bundling errors

**FPS drops significantly:**
- Check Debug Overlay for budget states
- Verify Auto Resolution is disabled (can cause scaling)
- Check if Frustum Budget Drop is active (camera inside fractal)
- Disable textures temporarily to isolate issue
- Check browser background tabs aren't throttling GPU

**Palette changes don't apply:**
- Chrome/macOS may have `<select>` onChange issues
- GUI includes DOM hook to sync palette dropdown
- Force refresh: Change color mode, then back to Orbit Trap
- Check browser console for errors

**Camera movement feels sluggish:**
- Increase movement speed in GUI
- Check if FPS is below 30 (affects movement smoothness)
- Verify pointer lock is active (click canvas)
- Check browser isn't blocking pointer lock API

**Presets don't load correctly:**
- Check browser console for JSON parse errors
- Verify preset exists in `VISUAL_PRESETS` object
- Some presets require specific fractals/features
- Clear `fractalExplorer_presetOverrides` from localStorage

**Hot reload doesn't work for shaders:**
- Check Vite dev server is running
- Verify file is in `src/shaders/` directory
- Check file extension matches Vite GLSL plugin config
- Try hard refresh (Ctrl+Shift+R)

## References

- **Inigo Quilez:** https://iquilezles.org/ - Ray marching, SDF library, fractal math, rendering techniques
- **Shadertoy:** https://www.shadertoy.com/ - Live shader examples and community
- **Three.js Docs:** https://threejs.org/docs/ - WebGL framework documentation
- **Local docs:** `docs/` directory
  - `PLAN.md` - Implementation plan and phase details
  - `IMPLEMENTATION_SUMMARY.md` - Feature summary
  - `RAY_MARCHING_RESEARCH.md` - Technical references from IQ
- **lil-gui:** https://lil-gui.georgealways.com/ - GUI library documentation
