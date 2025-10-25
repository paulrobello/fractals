// DEC SDF: float mandelbulb(vec3 p)
// Category: composed | Author: neozhaoliang
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-mandelbulb-vec3-p.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

{
    p /= 1.192;
    p.xyz = p.xzy;
    vec3 z = p;
    vec3 dz = vec3(0.0);
    float dr = 1.0;
    float power = 8.0;
    float r, theta, phi;
    for (int i = 0; i < 7; i++)
    {
      r = length(z);
      if (r > 2.0)
          break;
      float theta = atan(z.y / z.x);
      float phi = asin(z.z / r);
      dr = pow(r, power - 1.0) * power * dr + 1.0;
      r = pow(r, power);
      theta = theta * power;
      phi = phi * power;
      z = r * vec3(cos(theta) * cos(phi), cos(phi) * sin(theta), sin(phi)) + p;
    }
    return 0.5 * log(r) * r / dr;
  }

  float sdSponge(vec3 z)
  {
    for(int i = 0; i < 9; i++)
    {
      z = abs(z);
      z.xy = (z.x < z.y) ? z.yx : z.xy;
      z.xz = (z.x < z.z) ? z.zx : z.xz;
      z.zy = (z.y < z.z) ? z.yz : z.zy;
      z = z * 3.0 - 2.0;
      z.z += (z.z < -1.0) ? 2.0 : 0.0;
    }
    z = abs(z) - vec3(1.0);
    float dis = min(max(z.x, max(z.y, z.z)), 0.0) + length(max(z, 0.0));
    return dis * 0.6 * pow(3.0, -float(9));
  }

  float de(vec3 p)
  {
    float d1 = mandelbulb(p);
    float d2 = sdSponge(p);
    return max(d1, d2);
  }
