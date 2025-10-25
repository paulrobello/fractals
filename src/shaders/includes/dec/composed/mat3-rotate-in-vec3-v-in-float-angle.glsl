// DEC SDF: mat3 rotate( in vec3 v, in float angle) {
// Category: composed | Author: XT95
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/mat3-rotate-in-vec3-v-in-float-angle.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float c = cos(angle); float s = sin(angle);
    return mat3(c + (1.0 - c) * v.x * v.x, (1.0 - c) * v.x * v.y - s * v.z, (1.0 - c) * v.x * v.z + s * v.y,
      (1.0 - c) * v.x * v.y + s * v.z, c + (1.0 - c) * v.y * v.y, (1.0 - c) * v.y * v.z - s * v.x,
      (1.0 - c) * v.x * v.z - s * v.y, (1.0 - c) * v.y * v.z + s * v.x, c + (1.0 - c) * v.z * v.z);
  }
  float box( in vec3 p, in vec3 data ){ return max(max(abs(p.x)-data.x,abs(p.y)-data.y),abs(p.z)-data.z); }
  float arch( vec3 p ) { 
    if(p.y<40.1) p.y += 3.3;
    vec3 a = vec3( fract(p.x/45.5-.5)-.5, -p.y+40., fract(p.z/32.9-.5)-.5 );
    float d = -sqrt( a.y*a.y + min(a.x*a.x,a.z*a.z)*2000.)+19.5;
    if (abs(p.x)<28.) d -= 1.;
    d = max(d, a.y);
    d = max(d, -a.y-24.);
    return d*.8;
  }
  float column1( vec3 p ) {
    vec3 pp = p;
    pp.z = mod(p.z, 32.9)-32.9/2.;
    pp.x = mod(p.x-44., 44.0)-44.0/2.;
    float d = length(pp.xz) - 4.;
    d = min(d, box(pp-vec3(0.,40.,0.), vec3(6.,2.,6.)));
    d = max(d, abs(p.x)-50.);
    d = max(d, p.y-40.);
    d = min(d, arch(p));
    return d;
  }
  float column2( vec3 p ) {
    float yy = pow(p.y-13., .5)*1.2;
    vec3 pp = p;
    pp.z = mod(p.z-32.9/2., 65.8)-65.8/2.;
    pp.x = mod(p.x-44., 44.0)-44.0/2.;
    float d = length(pp.xz) - 3. + sin(p.y*p.y*.004+3.8)*.3;
    pp.z = mod(p.z+32.9/2., 65.8)-65.8/2.;
    d = min(d, max(abs(pp.x), abs(pp.z)) - 3.);
    pp.z = mod(p.z, 32.9)-32.9/2.;
    float y = pow(p.y-40., .5)*1.;
    d = min(d, box(pp-vec3(0.,40.,0.), vec3(6.-y,3.,6.-y))*.8);d = min(d, box(pp-vec3(0.,12.,0.), vec3(4.5,3.,4.5))*.8);
    d = max(d, abs(p.x)-50.);
    d = max(d, p.y-40.);
    d = min(d, arch(p));
    return d;
  }
  float stings( in vec3 p ) {
    vec3 pp = p;
    pp.z = mod(p.z, 32.9)-32.9/2.;
    vec3 ppp = pp;
    pp = rotate(vec3(0.,0.,1.), .4*-sign(p.x)) * pp; 
    float d = length(pp.zy-vec2(0.,120.))-1.4;
    d = max(d, -abs(ppp.x)+16.5);
    d = min(d, length(pp.zy-vec2(0.,120.))-.3);
    d = max(d, abs(p.x)-30.);
    d = max(d, -abs(p.x)+3.);
    d = max(d, abs(p.z)-60.);
    return d;
  }
  float map( in vec3 p ) {
    const vec3 dim = vec3(66.2, 77.75, 142.0);
    const vec3 dim2 = vec3(dim.x-49., 80., dim.z-32.);
    float d = -box(p-vec3(0.,dim.y, 0.), dim );
    d = min(d, column1(p));  d = min(d, column2(p-vec3(0.,60.,0.)));
    d = min(d, box(p-vec3(0., 67., 0.),vec3(dim2.x+10.,5.,dim2.z+10.)));
    d = min(d, box(p-vec3(0., 72., 0.),vec3(dim2.x+10.4,.5,dim2.z+10.4)));
    d = min(d, -p.y+120.);  d = max(d, -box(p-vec3(0.,186.,0.), dim2+vec3(-1.,100.,0.)));    
    d = max(d, p.y-dim2.y-100.);
    vec3 pp = p;    // windows on the top
    pp.z = mod(p.z-32.9/2., 65.8)-65.8/2.;
    d = max(d, -box(pp-vec3(0.,140.,0.), vec3(dim.x,5.,5.) ) );
    pp.z = mod(p.z+32.9/2., 65.8)-65.8/2.;
    d = max(d, -length(pp.zy-vec2(0.,160.))+4. );
    d = min(d, stings(p));
    return d;
  }
