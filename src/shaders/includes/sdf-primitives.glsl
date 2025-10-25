/**
 * SDF Primitive Shapes
 * Signed Distance Field functions for basic geometric shapes
 * Based on Inigo Quilez's distance functions:
 * https://iquilezles.org/articles/distfunctions/
 */

/**
 * Sphere - Exact distance
 * @param p Point in space
 * @param r Radius
 */
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

/**
 * Box - Exact distance
 * @param p Point in space
 * @param b Box dimensions (half extents)
 */
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/**
 * Plane - Exact distance
 * @param p Point in space
 * @param n Normal vector (should be normalized)
 * @param h Height offset
 */
float sdPlane(vec3 p, vec3 n, float h) {
  return dot(p, n) + h;
}

/**
 * Infinite plane (XZ plane at y=0)
 */
float sdPlaneXZ(vec3 p) {
  return p.y;
}

/**
 * Torus - Exact distance
 * @param p Point in space
 * @param t vec2(major radius, minor radius)
 */
float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

/**
 * Cylinder - Exact distance (infinite in Y)
 * @param p Point in space
 * @param r Radius
 */
float sdCylinder(vec3 p, float r) {
  return length(p.xz) - r;
}

/**
 * Capped Cylinder - Exact distance
 * @param p Point in space
 * @param h Height
 * @param r Radius
 */
float sdCappedCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

/**
 * Cone - Exact distance
 * @param p Point in space
 * @param c vec2(sin(angle), cos(angle))
 * @param h Height
 */
float sdCone(vec3 p, vec2 c, float h) {
  vec2 q = h * vec2(c.x / c.y, -1.0);
  vec2 w = vec2(length(p.xz), p.y);
  vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
  vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
  float k = sign(q.y);
  float d = min(dot(a, a), dot(b, b));
  float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
  return sqrt(d) * sign(s);
}

/**
 * Octahedron - Exact distance
 * @param p Point in space
 * @param s Size
 */
float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  float m = p.x + p.y + p.z - s;
  vec3 q;
  if (3.0 * p.x < m) q = p.xyz;
  else if (3.0 * p.y < m) q = p.yzx;
  else if (3.0 * p.z < m) q = p.zxy;
  else return m * 0.57735027;

  float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
  return length(vec3(q.x, q.y - s + k, q.z - k));
}

/**
 * Capsule - Exact distance
 * @param p Point in space
 * @param a First endpoint
 * @param b Second endpoint
 * @param r Radius
 */
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

/**
 * Tetrahedron - Exact distance (IQ variant)
 * @param p Point in space
 * @param s Size (edge-related)
 */
float sdTetrahedron(vec3 p, float s) {
  const float k = 0.57735026919; // 1/sqrt(3)
  p = abs(p);
  float m = p.x + p.y + p.z - s;
  vec3 q;
  if (3.0 * p.x < m) q = p.xyz;
  else if (3.0 * p.y < m) q = p.yzx;
  else if (3.0 * p.z < m) q = p.zxy;
  else return m * k;
  float k2 = clamp(0.5 * (q.z - q.y + s), 0.0, s);
  return length(vec3(q.x, q.y - s + k2, q.z - k2));
}
