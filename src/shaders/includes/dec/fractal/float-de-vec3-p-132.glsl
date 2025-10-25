// DEC SDF: float de(vec3 p){
// Category: fractal | Author: adapted from code by marvelousbilly
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/float-de-vec3-p-132.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

mat3 r = rotate3D(3.14159, vec3(0.,1.,0.));
    float scale= 2.;
    int Iterations = 10;
    int i;
    vec3 C = vec3(1.,5.4,10.+10.*sin(0.5));
    for(i = 0; i < Iterations; i++){
      p = r * (p);
      float x = p.x; float y = p.y; float z = p.z; float x1 = x; float y1 = y;

      x=abs(x);y = abs(y);
      if(x-y<0.){x1=y;y=x;x=x1;}
      if(x-z<0.){x1=z;z=x;x=x1;}
      if(y-z<0.){y1=z;z=y;y=y1;}

      z-=0.5*C.z*(scale-1.)/scale;
      z=-abs(-z);
      z+=0.5*C.z*(scale-1.)/scale;

      p = vec3(x,y,z);
      r = rotate3D(31.4159/4.+5.60,vec3(1.,0.5,0.6));
      p = r * (p);
      x = p.x; y = p.y; z = p.z;

      x=scale*x-C.y*(scale-1.);
      y=scale*y-C.y*(scale-1.);
      z=scale*z;

      p = vec3(x,y,z);
    }
    return (length(p) - 2.) * pow(scale,float(-i));
  }
