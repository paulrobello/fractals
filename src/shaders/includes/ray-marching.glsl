/**
 * Ray Marching Core
 * Core ray marching algorithm and utilities
 */

/**
 * Ray marching result structure
 * Contains distance, position, steps taken, and hit status
 */
struct RayMarchResult {
  float dist;      // Final distance to surface
  vec3 pos;        // Final ray position
  int steps;       // Number of steps taken
  bool hit;        // Whether we hit a surface
};

/**
 * Scene distance function - to be defined in main shader
 * This is a forward declaration
 */
float map(vec3 p);

/**
 * Core ray marching loop
 * Marches a ray through the scene until it hits a surface or max distance
 *
 * @param ro Ray origin
 * @param rd Ray direction (should be normalized)
 * @return RayMarchResult containing hit information
 */
RayMarchResult rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;  // Total distance traveled
  vec3 p = ro;    // Current position
  int i = 0;      // Step counter

  for (i = 0; i < MAX_STEPS; i++) {
    p = ro + rd * t;          // Calculate current position
    float d = map(p);         // Get distance to nearest surface

    // Check if we hit a surface
    if (d < MIN_DIST) {
      return RayMarchResult(d, p, i, true);
    }

    // Check if we exceeded max distance
    if (t > MAX_DIST) {
      return RayMarchResult(t, p, i, false);
    }

    // March forward by the safe distance
    t += d;
  }

  // Max steps reached without hit
  return RayMarchResult(t, p, i, false);
}

/**
 * Calculate surface normal using gradient method
 * Uses tetrahedron technique for better accuracy
 *
 * @param p Point on surface
 * @return Normal vector (normalized)
 */
vec3 calcNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  return normalize(
    k.xyy * map(p + k.xyy * EPSILON) +
    k.yyx * map(p + k.yyx * EPSILON) +
    k.yxy * map(p + k.yxy * EPSILON) +
    k.xxx * map(p + k.xxx * EPSILON)
  );
}

/**
 * Alternative normal calculation using centered differences
 * More accurate but requires more samples
 */
vec3 calcNormalCentered(vec3 p) {
  vec2 e = vec2(EPSILON, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

/**
 * Calculate ambient occlusion
 * Approximates how much ambient light reaches a point
 *
 * @param p Point on surface
 * @param n Surface normal
 * @param samples Number of AO samples (typically 4-8)
 * @return AO factor (0 = fully occluded, 1 = fully exposed)
 */
float calcAO(vec3 p, vec3 n, int samples) {
  float ao = 0.0;
  float weight = 1.0;
  float stepSize = 0.1;

  for (int i = 1; i <= samples; i++) {
    float dist = float(i) * stepSize;
    float sampledDist = map(p + n * dist);
    ao += weight * (dist - sampledDist);
    weight *= 0.5;
  }

  return clamp(1.0 - 3.0 * ao, 0.0, 1.0);
}

/**
 * Calculate soft shadows
 * Traces a ray toward the light to determine shadow factor
 *
 * @param ro Ray origin (surface point)
 * @param rd Ray direction (toward light, normalized)
 * @param tmin Minimum distance to start checking
 * @param tmax Maximum distance to check
 * @param k Softness factor (larger = softer shadows)
 * @return Shadow factor (0 = full shadow, 1 = no shadow)
 */
float calcSoftShadow(vec3 ro, vec3 rd, float tmin, float tmax, float k) {
  float res = 1.0;
  float t = tmin;

  for (int i = 0; i < 32; i++) {
    if (t > tmax) break;

    float h = map(ro + rd * t);

    if (h < MIN_DIST) {
      return 0.0;  // Full shadow
    }

    // Calculate penumbra
    res = min(res, k * h / t);
    t += h;
  }

  return res;
}

/**
 * Hard shadows (binary)
 * Faster but no soft shadows
 */
float calcHardShadow(vec3 ro, vec3 rd, float tmin, float tmax) {
  float t = tmin;

  for (int i = 0; i < 32; i++) {
    if (t > tmax) break;

    float h = map(ro + rd * t);

    if (h < MIN_DIST) {
      return 0.0;  // In shadow
    }

    t += h;
  }

  return 1.0;  // No shadow
}

/**
 * Get ray direction from UV coordinates and camera
 *
 * @param uv Normalized UV coordinates (-1 to 1)
 * @param ro Ray origin (camera position)
 * @param target Look-at target
 * @param fov Field of view in degrees
 * @return Ray direction (normalized)
 */
vec3 getRayDirection(vec2 uv, vec3 ro, vec3 target, float fov) {
  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);

  float fovScale = tan(fov * 0.5 * PI / 180.0);
  vec3 rd = normalize(forward + fovScale * uv.x * right + fovScale * uv.y * up);

  return rd;
}
