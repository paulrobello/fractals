// DEC SDF: Capped Cone
// Category: primitive | Author: iq
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/primitive/capped-cone.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float de(vec3 p){   // located at origin
      float h = 1.;   // height
      float r1 = 0.5; // radius at bottom
      float r2 = 0.2; // radius at top

      vec2 q = vec2( length(p.xz), p.y );

      vec2 k1 = vec2(r2,h);
      vec2 k2 = vec2(r2-r1,2.0*h);
      vec2 ca = vec2(q.x-min(q.x,(q.y < 0.0)?r1:r2), abs(q.y)-h);
      vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot(k2,k2), 0.0, 1.0 );
      float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
      return s*sqrt( min(dot(ca,ca),dot(cb,cb)) );
  }


  float de(vec3 p){   // between two points a and b
      vec3 a = vec3(0.0,0.0,0.0); // point a
      vec3 b = vec3(0.0,1.0,0.0); // point b
      float ra = .5; // radius at a
      float rb = .2; // radius at b

      float rba  = rb-ra;
      float baba = dot(b-a,b-a);
      float papa = dot(p-a,p-a);
      float paba = dot(p-a,b-a)/baba;

      float x = sqrt( papa - paba*paba*baba );

      float cax = max(0.0,x-((paba<0.5)?ra:rb));
      float cay = abs(paba-0.5)-0.5;

      float k = rba*rba + baba;
      float f = clamp( (rba*(x-ra)+paba*baba)/k, 0.0, 1.0 );

      float cbx = x-ra - f*rba;
      float cby = paba - f;

      float s = (cbx < 0.0 && cay < 0.0) ? -1.0 : 1.0;

      return s*sqrt( min(cax*cax + cay*cay*baba,
                         cbx*cbx + cby*cby*baba) );
  }
