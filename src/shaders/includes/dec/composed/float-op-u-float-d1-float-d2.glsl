// DEC SDF: float op_u(float d1, float d2){
// Category: composed | Author: raziel
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/composed/float-op-u-float-d1-float-d2.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

return (d1 < d2) ? d1 : d2;
  }
  void sphere_fold(inout vec3 p, inout float dr, float m_rad_sq, float f_rad_sq, float m_rad_sq_inv){
    float r_sq = dot(p, p);
    if (r_sq < m_rad_sq){
      float t = f_rad_sq * m_rad_sq_inv;
      p *= t;
      dr *= t;
    }
    else if (r_sq < f_rad_sq){
      float t = f_rad_sq / r_sq;
      p *= t;
      dr *= t;
    }
  }
  void box_fold(inout vec3 p, float fold_limit){
    p = clamp(p, -fold_limit, fold_limit) * 2.0 - p;
  }
  // estimators return (dist, mat_id, custom_value)
  float estimator_mandelbox(vec3 p, float scale, float m_rad_sq, float f_rad_sq, float fold_limit){
    vec3 off = p;
    float dr = 1.0;
    float mrs_inv = 1.0 / m_rad_sq;
    for (int i = 0; i < 10; ++i){
      box_fold(p, fold_limit);
      sphere_fold(p, dr, m_rad_sq, f_rad_sq, mrs_inv);

      p = scale * p + off;
      dr = dr * abs(scale) + 1.0;
      vec3 ot = p - vec3(0.5);
    }
    return length(p) / abs(dr);
  }
  vec3 mod_pos(vec3 p, float a, float b){
    p.zx = mod(p.zx, a) - b;
    return p;
  }
  float de(vec3 p){
    vec3 p_mb = mod_pos_77(p, 4.4, 2.2);
    float res_mb = estimator_mandelbox(p, -2.5, 0.1, 2.5, 1.0);
    vec3 p_pl = p;
    p_pl.y += 4.0;
    p_pl = mod_pos(p_pl, 2.0, 1.0);
    float res_pl = estimator_mandelbox(p_pl, -1.5, 0.3, 2.9, 1.0);

    return op_u(res_mb, res_pl);
  }
