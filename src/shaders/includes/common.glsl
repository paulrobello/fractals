/**
 * Common Utilities and Constants
 * Shared GLSL functions and definitions for ray marching
 */

// Ray marching constants
const int MAX_STEPS = 128;
const float MIN_DIST = 0.001;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;

// Math constants
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float PHI = 1.61803398875;

/**
 * Rotation matrix around X axis
 */
mat3 matRotateX(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, -s,
    0.0, s, c
  );
}

/**
 * Rotation matrix around Y axis
 */
mat3 matRotateY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    c, 0.0, s,
    0.0, 1.0, 0.0,
    -s, 0.0, c
  );
}

/**
 * Rotation matrix around Z axis
 */
mat3 matRotateZ(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    c, -s, 0.0,
    s, c, 0.0,
    0.0, 0.0, 1.0
  );
}

/**
 * Generate camera ray direction from UV coordinates
 * Based on camera position and field of view
 */
vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 lookAt, float fov) {
  vec3 forward = normalize(lookAt - camPos);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);

  float fovScale = tan(fov * 0.5 * PI / 180.0);
  vec3 rayDir = normalize(forward + fovScale * uv.x * right + fovScale * uv.y * up);

  return rayDir;
}

/**
 * Smooth minimum function (exponential)
 * Smoothly blends two distance fields
 */
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

/**
 * Smooth maximum function
 */
float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
}

/**
 * Polynomial smooth minimum
 * Faster than exponential smin
 */
float sminPoly(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

/**
 * Map a value from one range to another
 */
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

/**
 * Modulo operation that works for negative numbers
 */
float modulo(float x, float y) {
  return x - y * floor(x / y);
}

// Vector overload for modulo (component-wise)
vec3 modulo(vec3 x, vec3 y) {
  return x - y * floor(x / y);
}

/**
 * Repeats space in all directions
 */
vec3 opRepeat(vec3 p, vec3 c) {
  return modulo(p + 0.5 * c, c) - 0.5 * c;
}

/**
 * Limits repetition to a finite domain
 */
vec3 opRepeatLimited(vec3 p, vec3 c, vec3 l) {
  return p - c * clamp(round(p / c), -l, l);
}

// Rotation that aligns vector 'from' to vector 'to' (both assumed non-zero)
// Based on Rodrigues' rotation formula. For most cases (not opposite vectors)
// this is stable and fast. If vectors are opposite, it falls back to a 180°
// rotation around an arbitrary perpendicular axis.
mat3 rotationAlign(vec3 from, vec3 to) {
  vec3 a = normalize(from);
  vec3 b = normalize(to);
  float c = dot(a, b);
  // If almost identical, return identity
  if (c > 0.9999) {
    return mat3(1.0);
  }
  // If almost opposite, rotate 180° around any perpendicular axis
  if (c < -0.9999) {
    vec3 axis = normalize(abs(a.x) > 0.1 ? cross(a, vec3(0.0,1.0,0.0)) : cross(a, vec3(1.0,0.0,0.0)));
    float x = axis.x, y = axis.y, z = axis.z;
    // 180° rotation matrix around 'axis'
    return mat3(
      -1.0 + 2.0*x*x, 2.0*x*y,       2.0*x*z,
      2.0*y*x,       -1.0 + 2.0*y*y, 2.0*y*z,
      2.0*z*x,        2.0*z*y,      -1.0 + 2.0*z*z
    );
  }
  vec3 v = cross(a, b);
  float k = 1.0 / (1.0 + c);
  // Skew-symmetric cross-product matrix components baked into mat3
  return mat3(
    v.x*v.x*k + c,     v.x*v.y*k - v.z,  v.x*v.z*k + v.y,
    v.y*v.x*k + v.z,   v.y*v.y*k + c,    v.y*v.z*k - v.x,
    v.z*v.x*k - v.y,   v.z*v.y*k + v.x,  v.z*v.z*k + c
  );
}
