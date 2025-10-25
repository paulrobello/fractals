/**
 * SDF Boolean Operations
 * Operations for combining and modifying signed distance fields
 * Based on IQ's distance functions and modeling techniques
 */

/**
 * Union - Combines two shapes
 * Returns the minimum distance (closer surface)
 */
float opUnion(float d1, float d2) {
  return min(d1, d2);
}

/**
 * Subtraction - Subtracts d2 from d1
 * Removes the second shape from the first
 */
float opSubtraction(float d1, float d2) {
  return max(-d2, d1);
}

/**
 * Intersection - Intersection of two shapes
 * Returns only the overlapping volume
 */
float opIntersection(float d1, float d2) {
  return max(d1, d2);
}

/**
 * Smooth Union - Smoothly blends two shapes
 * @param k Smoothness factor (larger = smoother)
 */
float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

/**
 * Smooth Subtraction
 */
float opSmoothSubtraction(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
  return mix(d1, -d2, h) + k * h * (1.0 - h);
}

/**
 * Smooth Intersection
 */
float opSmoothIntersection(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) + k * h * (1.0 - h);
}

/**
 * Elongation - Stretches a shape along an axis
 */
vec3 opElongate(vec3 p, vec3 h) {
  return p - clamp(p, -h, h);
}

/**
 * Rounding - Rounds the edges of a shape
 * @param d Distance field
 * @param r Rounding radius
 */
float opRound(float d, float r) {
  return d - r;
}

/**
 * Onion - Creates a shell/hollow version of a shape
 * @param d Distance field
 * @param thickness Shell thickness
 */
float opOnion(float d, float thickness) {
  return abs(d) - thickness;
}

/**
 * Extrusion - Extrudes a 2D shape into 3D
 */
float opExtrusion(vec3 p, float sdf2d, float h) {
  vec2 w = vec2(sdf2d, abs(p.z) - h);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}

/**
 * Revolution - Revolves a 2D shape around Y axis
 */
float opRevolution(vec3 p, float sdf2d, float offset) {
  vec2 q = vec2(length(p.xz) - offset, p.y);
  return sdf2d;
}

/**
 * Twist - Twists a shape around Y axis
 */
vec3 opTwist(vec3 p, float k) {
  float c = cos(k * p.y);
  float s = sin(k * p.y);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * p.xz, p.y);
}

/**
 * Bend - Bends a shape
 */
vec3 opBend(vec3 p, float k) {
  float c = cos(k * p.x);
  float s = sin(k * p.x);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * p.xy, p.z);
}

/**
 * Repetition - Repeats space in all directions
 */
vec3 opRep(vec3 p, vec3 c) {
  return mod(p + 0.5 * c, c) - 0.5 * c;
}

/**
 * Limited Repetition - Repeats within bounds
 */
vec3 opRepLim(vec3 p, vec3 c, vec3 l) {
  return p - c * clamp(round(p / c), -l, l);
}

/**
 * Scale - Scales a distance field
 * Note: Must divide the result by the scale factor
 */
vec3 opScale(vec3 p, float s) {
  return p / s;
}

/**
 * Symmetry - Mirrors across a plane
 */
vec3 opSymX(vec3 p) {
  p.x = abs(p.x);
  return p;
}

vec3 opSymY(vec3 p) {
  p.y = abs(p.y);
  return p;
}

vec3 opSymZ(vec3 p) {
  p.z = abs(p.z);
  return p;
}

vec3 opSymXYZ(vec3 p) {
  return abs(p);
}
