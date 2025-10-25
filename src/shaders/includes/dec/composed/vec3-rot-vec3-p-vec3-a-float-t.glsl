// DEC SDF: vec3 rot(vec3 p,vec3 a,float t){
// Category: composed | Author: gaziya5 aka gaz
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/vec3-rot-vec3-p-vec3-a-float-t.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

a=normalize(a);
  	vec3 v = cross(a,p),u = cross(v,a);
  	return u * cos(t) + v * sin(t) + a * dot(p, a);
  }
  float lpNorm(vec2 p, float n){
  	p = pow(abs(p), vec2(n));
  	return pow(p.x+p.y, 1.0/n);
  }
  float sdTorus( vec3 p, vec2 t ){
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
  }
  float smin( float a, float b, float k ) {
    float h = clamp(.5+.5*(b-a)/k, 0., 1.);
    return mix(b, a, h) - k*h*(1.-h);
  }
  float deTetra(vec3 p){
  	vec2 g=vec2(-1.0,1.0)*0.577;
  	return pow(
  		pow(max(0.0,dot(p,g.xxx)),8.0)
  		+pow(max(0.0,dot(p,g.xyy)),8.0)
  		+pow(max(0.0,dot(p,g.yxy)),8.0)
  		+pow(max(0.0,dot(p,g.yyx)),8.0),
  		0.125);
  }
  float deStella(vec3 p){
    p=rot(p,vec3(1.0,2.0,3.0),time*3.0);
  	return smin(deTetra_85(p)-1.0,deTetra(-p)-1.0,0.05);
  }
  #define Circle 2.2
  vec2 hash2( vec2 p ){
    p = mod(p, Circle*2.0);
  	return fract(sin(vec2(
          dot(p,vec2(127.1,311.7)),
          dot(p,vec2(269.5,183.3))
      ))*43758.5453);
  }
  vec3 voronoi(vec2 x){
    x*=Circle;
    vec2 n = floor(x);
    vec2 f = fract(x);
    vec2 mg, mr;
    float md = 8.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ ){
      vec2 g = vec2(float(i),float(j));
      vec2 o = hash2( n + g );
      o = 0.5 + 0.5*sin( time*0.3 + 6.2831*o );
      vec2 r = g + o - f;
      float d = dot(r,r);
      if( d < md ){
        md = d;
        mr = r;
        mg = g;
      }
    }
    md = 8.0;
    for( int j=-2; j <= 2; j++ )
    for( int i=-2; i <= 2; i++ ){
      vec2 g = mg + vec2(float(i),float(j));
      vec2 o = hash2( n + g );
      o = 0.5 + 0.5*sin( time*0.3 + 6.2831*o );
      vec2 r = g + o - f;
      if( dot(mr-r,mr-r)>0.00001 )
        md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
    }
    return vec3( md, mr );
  }
  float voronoiTorus(vec3 p){
    vec2 size = vec2(12.0,5.0);
    vec2 q = vec2(length(p.xz) - size.x, p.y);
    vec2 uv=vec2(atan(p.z, p.x),atan(q.y, q.x))/3.1415;
    vec3 vr=voronoi(uv*vec2(20.0,8.0));
    vec2 p2=vec2(lpNorm(vr.yz,12.0)-0.5, sdTorus(p,size));
    return lpNorm(p2,5.0)-0.1;
  }
  float fractal(vec3 p)
  {
    vec3 offset = vec3(6.0,0.0,0.0);
    float de = min(voronoiTorus(p-offset),voronoiTorus(p.xzy+offset));
    vec3 co = vec3(cos(time),0,sin(time))*10.0;
    float s1= abs(sin(time))*3.0+2.0;
    float deSG = min(deStella((p-co-offset)/s1),deStella((p-(co-offset).xzy)/s1))*s1;
    float deS = min(deStella(p-co-offset),deStella(p-(co-offset).xzy));
    de=min(de,deS);
    return de;
  }
