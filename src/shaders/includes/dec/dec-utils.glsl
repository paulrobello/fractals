// DEC Utils — shared constants and tiny helpers used by preview snippets
// Local constants (namespaced) to avoid collisions with app-level symbols
const float DEC_PI  = 3.14159265359;
const float DEC_TAU = 6.28318530718;
const float DEC_PHI = 1.61803398875;

// Tiny helpers
float dec_saturate(float x) { return clamp(x, 0.0, 1.0); }
float dec_length2(vec2 v) { return dot(v,v); }
float dec_length2(vec3 v) { return dot(v,v); }

// Default plane set for sharp-face polyhedra preview (safe fallback)
#ifndef DEC_GDF_COUNT
  #define DEC_GDF_COUNT 19
  const vec3 DEC_GDF[DEC_GDF_COUNT] = vec3[](
    normalize(vec3(1.0, 0.0, 0.0)),
    normalize(vec3(0.0, 1.0, 0.0)),
    normalize(vec3(0.0, 0.0, 1.0)),
    normalize(vec3(1.0, 1.0, 1.0)),
    normalize(vec3(-1.0, 1.0, 1.0)),
    normalize(vec3(1.0, -1.0, 1.0)),
    normalize(vec3(1.0, 1.0, -1.0)),
    normalize(vec3(0.0, 1.0, DEC_PHI + 1.0)),
    normalize(vec3(0.0, -1.0, DEC_PHI + 1.0)),
    normalize(vec3(DEC_PHI + 1.0, 0.0, 1.0)),
    normalize(vec3(-(DEC_PHI + 1.0), 0.0, 1.0)),
    normalize(vec3(1.0, DEC_PHI + 1.0, 0.0)),
    normalize(vec3(-1.0, DEC_PHI + 1.0, 0.0)),
    normalize(vec3(0.0, DEC_PHI, 1.0)),
    normalize(vec3(0.0, -DEC_PHI, 1.0)),
    normalize(vec3(1.0, 0.0, DEC_PHI)),
    normalize(vec3(-1.0, 0.0, DEC_PHI)),
    normalize(vec3(DEC_PHI, 1.0, 0.0)),
    normalize(vec3(-DEC_PHI, 1.0, 0.0))
  );
#endif

// Generalized distance functions using DEC_GDF plane set
#ifndef DEC_GDF_FNS
#define DEC_GDF_FNS 1
float fGDF(vec3 p, float r, float e, int begin, int end) {
  float d = 0.0;
  for (int i = 0; i < DEC_GDF_COUNT; ++i) {
    if (i >= begin && i <= end) {
      d += pow(abs(dot(p, DEC_GDF[i])), e);
    }
  }
  return pow(max(d, 1e-8), 1.0 / max(e, 1e-6)) - r;
}
float fGDF(vec3 p, float r, int begin, int end) {
  float d = 0.0;
  for (int i = 0; i < DEC_GDF_COUNT; ++i) {
    if (i >= begin && i <= end) {
      d = max(d, abs(dot(p, DEC_GDF[i])));
    }
  }
  return d - r;
}
#endif
