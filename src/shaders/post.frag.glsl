// Post Processing Fragment Shader (GLSL 3.00 ES)
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_sceneTex;
uniform vec2 u_resolution;

// Bloom
uniform bool  u_bloomEnabled;
uniform float u_bloomThreshold;
uniform float u_bloomStrength;
uniform float u_bloomRadius; // pixels (approx)

// LUT (2D strip)
uniform bool  u_lutEnabled;
uniform sampler2D u_lutTex;
uniform int   u_lutSize;    // e.g., 16/32/64
uniform float u_lutIntensity; // 0..1

vec3 sampleScene(vec2 uv) {
  return texture(u_sceneTex, uv).rgb;
}

// Simple 9-tap bloom blur around the pixel (approx Gaussian)
vec3 bloom9(vec2 uv) {
  // Convert pixel radius to UV offsets
  float r = max(0.5, u_bloomRadius);
  vec2 px = r / u_resolution; // isotropic
  vec3 col = vec3(0.0);
  float w0 = 0.227027; // center
  float w1 = 0.194594;
  float w2 = 0.121621;
  float w3 = 0.054054;
  vec3 c0 = sampleScene(uv);
  vec3 c1 = sampleScene(uv + vec2( px.x, 0.0));
  vec3 c2 = sampleScene(uv - vec2( px.x, 0.0));
  vec3 c3 = sampleScene(uv + vec2( 0.0, px.y));
  vec3 c4 = sampleScene(uv - vec2( 0.0, px.y));
  vec3 c5 = sampleScene(uv + vec2( px.x, px.y));
  vec3 c6 = sampleScene(uv + vec2(-px.x, px.y));
  vec3 c7 = sampleScene(uv + vec2( px.x,-px.y));
  vec3 c8 = sampleScene(uv + vec2(-px.x,-px.y));
  col = w0*c0 + w1*(c1+c2+c3+c4) + w2*(c5+c6+c7+c8);
  return col;
}

// Helper to compute UV into a 2D strip LUT (tiles per row = size)
vec2 lutUvFor(float s, float xf, float yf, float size, float tileW, vec2 invTexSize) {
  float tileX = mod(s, tileW);
  float tileY = floor(s / tileW);
  vec2 base = vec2(tileX * size + xf, tileY * size + yf);
  return (base + 0.5) * invTexSize;
}

// Sample 2D strip LUT of size N: image width = N*N, height = N
vec3 applyLUT(vec3 color) {
  int N = max(u_lutSize, 2);
  float size = float(N);
  float slice = clamp(color.b * (size - 1.0), 0.0, size - 1.0);
  float sliceIdx = floor(slice);
  float sliceFrac = slice - sliceIdx;
  float x = color.r * (size - 1.0);
  float y = color.g * (size - 1.0);

  float tileW = size; // tiles per row
  vec2 texSize = vec2(size * size, size);
  vec2 invTexSize = 1.0 / texSize;

  vec3 c0 = texture(u_lutTex, lutUvFor(sliceIdx, x, y, size, tileW, invTexSize)).rgb;
  vec3 c1 = texture(u_lutTex, lutUvFor(min(sliceIdx + 1.0, size - 1.0), x, y, size, tileW, invTexSize)).rgb;
  return mix(c0, c1, sliceFrac);
}

void main() {
  vec2 uv = vUv;
  vec3 base = sampleScene(uv);
  vec3 col = base;

  if (u_bloomEnabled) {
    // threshold bright areas
    vec3 bright = max(col - vec3(u_bloomThreshold), vec3(0.0));
    // blur sampled from scene for softness
    vec3 blur = bloom9(uv);
    // Scale blur by bright average to limit to highlights
    float b = clamp((bright.r + bright.g + bright.b) / 3.0, 0.0, 1.0);
    col += blur * b * clamp(u_bloomStrength, 0.0, 3.0);
  }

  if (u_lutEnabled) {
    vec3 graded = applyLUT(clamp(col, 0.0, 1.0));
    col = mix(col, graded, clamp(u_lutIntensity, 0.0, 1.0));
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
