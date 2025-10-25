// DEC SDF: #define rot(a)mat2(cos(a),sin(a),-sin(a),cos(a))
// Category: fractal | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/define-rot-a-mat2-cos-a-sin-a-sin-a-cos-a-4.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float lpNorm(vec3 p, float n){
  	p = pow(abs(p), vec3(n));
  	return pow(p.x+p.y+p.z, 1.0/max(n,0.001));
  }
  float map(vec3 p){
    vec3 q=p;
  	float s = 2.5;
  	for(int i = 0; i < 10; i++) {
      p=mod(p-1.,2.)-1.;
  	float r2=1.1/max(pow(lpNorm(abs(p),2.+q.y*10.),1.75), 0.001);
    	p*=r2;
    	s*=r2;
      p.xy*=rot(.001);
    }
    return q.y>1.3?length(p)/max(s,0.001):abs(p.y)/max(s,0.001);
  }
