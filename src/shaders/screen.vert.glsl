// Fullscreen Quad Vertex Shader (GLSL 3.00 ES)
precision highp float;
precision highp int;
out vec2 vUv;

void main() {
  // position is provided by Three.js (PlaneGeometry in NDC: [-1,1])
  vUv = (position.xy * 0.5) + 0.5;
  gl_Position = vec4(position, 1.0);
}

