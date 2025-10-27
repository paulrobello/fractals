# View-Centered Zoom Implementation

## Problem Statement

The current zoom implementation is **origin-centered**: when you increase `u_fractalScale`, the fractal always zooms toward its local origin (0,0,0), regardless of camera orientation.

```glsl
// Current transformation (origin-centered)
vec3 fp = rotate3D(p, u_rotation) / u_fractalScale;
fractal = sdMenger(fp, u_iterations) * u_fractalScale;
```

**Desired behavior:** Zoom should be **view-centered** - when the camera points at a specific feature (e.g., a tiny hole), zooming in should make that feature grow larger, like zooming into a Mandelbrot set.

## Mathematical Foundation

### Coordinate Transformation

For view-centered zoom, we need to scale the world around a **zoom center point** `zc`, not around the origin:

```
Traditional scaling (origin-centered):
    p' = p / scale

View-centered scaling (around point zc):
    p' = (p - zc) / scale + zc
       = (p - zc) / scale + zc * (1 - 1/scale)  [factored form]
```

However, for **distance field rendering**, we typically evaluate the SDF in its local coordinate system and then scale the result:

```glsl
// View-centered transformation for SDFs:
vec3 localPos = (p - zoomCenter) / scale;
float distance = sdFractal(localPos) * scale;
```

### Why This Works

1. **Shift world by zoom center**: `p - zoomCenter` moves the zoom center to the origin
2. **Scale down**: Division by `scale` makes the local space smaller (fractal appears bigger)
3. **Evaluate SDF**: Compute distance in fractal's local coordinate system
4. **Scale distance back**: Multiply by `scale` to correct distance for ray marching

### Distance Estimation Correctness

**Critical:** When you scale a signed distance field uniformly by factor `s`, you must also scale the distance result by `s`:

```glsl
// Correct:
float d = sdFractal(p / s) * s;

// Incorrect (distance estimation breaks):
float d = sdFractal(p / s);
```

This maintains the **Lipschitz continuity** property required for ray marching (distance underestimates actual distance, preventing overshooting).

### Handling Rotation

The full transformation pipeline becomes:

```glsl
vec3 fp = (p - u_zoomCenter) / u_fractalScale;  // Translate and scale
fp = rotate3D(fp, u_rotation);                  // Apply rotation
float d = sdFractal(fp) * u_fractalScale;       // Evaluate and scale back
```

**Or equivalently** (rotate first, then translate/scale):

```glsl
vec3 rotated = rotate3D(p, u_rotation);
vec3 fp = (rotated - u_zoomCenter) / u_fractalScale;
float d = sdFractal(fp) * u_fractalScale;
```

We'll use the second approach for consistency with existing code.

## Implementation Strategy

### 1. Add `u_zoomCenter` Uniform

Add a new uniform to control where zoom is centered:

```glsl
uniform vec3 u_zoomCenter;  // World-space point to zoom toward
```

**Default value:** `vec3(0.0, 0.0, 0.0)` (origin) for backward compatibility

### 2. Modify Space Transform Functions

Update `space-transforms.glsl` to use view-centered scaling:

```glsl
// Menger Sponge (example)
vec3 mgToLocal(vec3 p) {
  vec3 rotated = rotate3D(p, u_rotation);
  return (rotated - u_zoomCenter) / u_fractalScale;
}
```

Apply to all fractals:
- `mgToLocal()` - Menger Sponge
- `mbToLocal()` - Mandelbulb
- `spToLocal()` - Sierpinski
- `mbxToLocal()` - Mandelbox
- DEC preview transformations
- World/Truchet transformations

### 3. Compute Zoom Center in ZoomController

The zoom center should be a point **along the camera's view ray** at a distance `d` from the camera:

```javascript
// In ZoomController.update()
const cam = this.app.renderer.camera;
const forward = new THREE.Vector3(0, 0, -1)
  .applyQuaternion(cam.quaternion)
  .normalize();

// Zoom center at distance d along view ray
const zoomDistance = 5.0;  // Configurable
const zoomCenter = cam.position.clone().addScaledVector(forward, zoomDistance);

this.app.uniforms.u_zoomCenter.value.copy(zoomCenter);
```

**Alternative:** Use `u_cameraTarget` directly (already computed in `FractalExplorer.animate()`):

```javascript
// u_cameraTarget = cameraPos + lookDirection (distance = 1.0)
// Scale up for deeper zoom center:
const dir = this.app.uniforms.u_cameraTarget.value.clone()
  .sub(this.app.uniforms.u_cameraPos.value)
  .multiplyScalar(5.0);  // Scale to desired distance

const zoomCenter = this.app.uniforms.u_cameraPos.value.clone().add(dir);
this.app.uniforms.u_zoomCenter.value.copy(zoomCenter);
```

### 4. Add GUI Controls

Add new controls in `GUIManager.js`:

```javascript
// Zoom settings
this.params.zoomCenterMode = 'view';  // 'origin' or 'view'
this.params.zoomCenterDistance = 5.0; // Distance along view ray

zoomFolder.add(this.params, 'zoomCenterMode', ['origin', 'view'])
  .name('Zoom Center Mode')
  .onChange(value => {
    if (value === 'origin') {
      this.uniforms.u_zoomCenter.value.set(0, 0, 0);
    }
    // 'view' mode updates dynamically in ZoomController
  });

zoomFolder.add(this.params, 'zoomCenterDistance', 0.1, 20.0, 0.1)
  .name('Zoom Distance')
  .onChange(value => {
    // Update ZoomController config
  });
```

## Edge Cases & Considerations

### 1. Rotation Interaction

**Question:** Should rotation be relative to zoom center or origin?

**Answer:** For most intuitive behavior, keep rotation around the fractal's local origin (current behavior). The zoom center only affects scaling, not rotation.

### 2. Floor Rendering

The analytic floor plane (`y = u_floorY`) is in **world space**, independent of fractal transformations. View-centered zoom won't affect floor positioning directly, but may change relative distances.

**Solution:** No changes needed. Floor ray-plane intersection is already separate from fractal SDF.

### 3. Procedural Textures

Textures are evaluated in **local fractal space**. As long as we maintain correct `*ToLocal()` transformations, textures will follow the fractal.

**Solution:** No changes needed beyond updating `*ToLocal()` functions.

### 4. Bounding Volume Culling

`boundsDistanceWorld()` uses local-space transformations for early ray rejection. Must update to use view-centered scaling:

```glsl
float boundsDistanceWorld(vec3 p) {
  if (u_fractalType == 1) {  // Menger
    vec3 q = mgToLocal(p);   // Now includes zoom center offset
    return sdBox(q, vec3(1.1)) * u_fractalScale;  // Scale back to world space
  }
  // ...
}
```

### 5. Camera Movement During Zoom

If the camera moves **while zooming**, the zoom center moves with it (since it's computed from camera position/direction). This is the desired behavior for interactive exploration.

For **cinematic zoom** (camera stationary, only scale changes), the zoom center remains fixed.

### 6. Performance Impact

**Minimal:** One additional `vec3` subtraction per fractal evaluation. No branching or expensive operations.

## Testing Checklist

- [ ] Menger Sponge: Zoom into small cube features
- [ ] Mandelbulb: Zoom into surface details
- [ ] Sierpinski: Zoom into tetrahedral gaps
- [ ] Mandelbox: Zoom into box-folded structures
- [ ] DEC Preview: Zoom into custom SDFs
- [ ] Verify distance estimation (no artifacts, no overshooting)
- [ ] Verify rotation still works correctly
- [ ] Verify floor rendering unaffected
- [ ] Verify procedural textures follow geometry
- [ ] Test with camera movement during zoom
- [ ] Test with auto-rotation during zoom
- [ ] Verify bounding volume culling still works

## Fallback & Debugging

**Debug visualization:** Add a GUI toggle to show zoom center as a small sphere:

```glsl
// In debug mode, show zoom center
if (u_debugShowZoomCenter) {
  float centerDist = length(p - u_zoomCenter) - 0.1;
  if (centerDist < fractal) {
    return centerDist;  // Override fractal with debug sphere
  }
}
```

**Safety mode:** Always allow fallback to origin-centered zoom:

```glsl
vec3 zoomCenter = u_zoomCenterMode == 0 ? vec3(0.0) : u_zoomCenter;
vec3 fp = (rotate3D(p, u_rotation) - zoomCenter) / u_fractalScale;
```

## Expected Outcome

**Before (origin-centered):**
- Point camera at small hole → Zoom in → Fractal grows, but hole moves toward screen edge
- Frustrating to explore specific features

**After (view-centered):**
- Point camera at small hole → Zoom in → Hole stays centered, grows larger
- Intuitive "zoom into what you're looking at" behavior
- Mandelbrot-set-like exploration experience

## References

- **Inigo Quilez - Ray Marching Distance Fields:**
  https://iquilezles.org/articles/distfunctions/

- **SDF Transformations:**
  https://iquilezles.org/articles/sdfbounding/

- **Distance Estimation Theory:**
  https://www.iquilezles.org/www/articles/raymarchingdf/raymarchingdf.htm
