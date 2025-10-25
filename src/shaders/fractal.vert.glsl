// Vertex Shader (GLSL 3.00 ES) — Three.js injects #version 300 es
precision highp float;
precision highp int;

void main() {
  gl_Position = vec4(position, 1.0);
}
