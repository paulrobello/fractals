// DEC SDF: float sdTriPrism( vec3 p, vec2 h ){
// Category: composed | Author: russ
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-sdtriprism-vec3-p-vec2-h.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
  }

  float sdCrossHex( in vec3 p ){
    float sdfin=1000.0;
    float sdt1= sdTriPrism( p- vec3(0.0), vec2(1.0) );
    float sdt2= sdTriPrism( -p.xyz- vec3(0.0), vec2(0.5,1.2) );
    float sdt3= sdTriPrism( p.xzy- vec3(0.0), vec2(0.5,1.2) );
    sdfin =max(sdt1, -sdt2);
    sdfin =max(sdfin, -sdt3);
    return sdfin;
  }

  float sdCrossRep(vec3 p) {
  	vec3 q = mod(p + 1.0, 2.0) - 1.0;
  	return sdCrossHex(q);
  }

  float sdCrossRepScale(vec3 p, float s) {
  	return sdCrossRep(p * s) / s;
  }

  float de(vec3 p) {
    float scale = 4.0;
    float dist=sdTriPrism( p-vec3(0.0), vec2(1.0,1.0) );
  	for (int i = 0; i < 5; i++) {
  		dist = max(dist, -sdCrossRepScale(p, scale));
  		scale *= 3.0;
  	}
  	return dist;
  }
