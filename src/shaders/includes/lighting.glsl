/**
 * Lighting Models
 * Various lighting and shading techniques for ray marching
 */

/**
 * Phong lighting model
 * Classic ambient + diffuse + specular lighting
 *
 * @param p Surface position
 * @param n Surface normal (normalized)
 * @param lightPos Light position
 * @param viewDir View direction (normalized)
 * @param lightColor Light color
 * @param ambient Ambient strength (0-1)
 * @param diffuse Diffuse strength (0-1)
 * @param specular Specular strength (0-1)
 * @param shininess Specular shininess (1-128)
 * @return Final color
 */
vec3 phongLighting(
  vec3 p,
  vec3 n,
  vec3 lightPos,
  vec3 viewDir,
  vec3 lightColor,
  float ambient,
  float diffuse,
  float specular,
  float shininess
) {
  // Ambient
  vec3 ambientColor = ambient * lightColor;

  // Diffuse
  vec3 lightDir = normalize(lightPos - p);
  float diff = max(dot(n, lightDir), 0.0);
  vec3 diffuseColor = diffuse * diff * lightColor;

  // Specular (Phong)
  vec3 reflectDir = reflect(-lightDir, n);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specularColor = specular * spec * lightColor;

  return ambientColor + diffuseColor + specularColor;
}

/**
 * Blinn-Phong lighting model
 * More efficient specular calculation
 *
 * @param p Surface position
 * @param n Surface normal (normalized)
 * @param lightPos Light position
 * @param viewDir View direction (normalized)
 * @param lightColor Light color
 * @param ambient Ambient strength
 * @param diffuse Diffuse strength
 * @param specular Specular strength
 * @param shininess Specular shininess
 * @return Final color
 */
vec3 blinnPhongLighting(
  vec3 p,
  vec3 n,
  vec3 lightPos,
  vec3 viewDir,
  vec3 lightColor,
  float ambient,
  float diffuse,
  float specular,
  float shininess
) {
  // Ambient
  vec3 ambientColor = ambient * lightColor;

  // Diffuse
  vec3 lightDir = normalize(lightPos - p);
  float diff = max(dot(n, lightDir), 0.0);
  vec3 diffuseColor = diffuse * diff * lightColor;

  // Specular (Blinn-Phong)
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(n, halfwayDir), 0.0), shininess);
  vec3 specularColor = specular * spec * lightColor;

  return ambientColor + diffuseColor + specularColor;
}

/**
 * Lambert diffuse lighting
 * Simple diffuse-only lighting
 */
vec3 lambertLighting(vec3 p, vec3 n, vec3 lightPos, vec3 lightColor) {
  vec3 lightDir = normalize(lightPos - p);
  float diff = max(dot(n, lightDir), 0.0);
  return diff * lightColor;
}

/**
 * Fresnel effect
 * Rim lighting based on viewing angle
 *
 * @param n Surface normal
 * @param v View direction
 * @param power Fresnel power (typically 3-5)
 * @return Fresnel factor (0-1)
 */
float fresnel(vec3 n, vec3 v, float power) {
  return pow(1.0 - max(dot(n, v), 0.0), power);
}

/**
 * Schlick's approximation for Fresnel
 * More physically accurate
 */
float fresnelSchlick(vec3 n, vec3 v, float f0) {
  float cosTheta = max(dot(n, v), 0.0);
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

/**
 * Rim lighting
 * Highlights edges based on viewing angle
 */
vec3 rimLighting(vec3 n, vec3 v, vec3 rimColor, float rimPower, float rimIntensity) {
  float rim = fresnel(n, v, rimPower);
  return rim * rimIntensity * rimColor;
}

/**
 * Subsurface scattering approximation
 * Fake SSS using thickness estimation
 *
 * @param n Surface normal
 * @param l Light direction
 * @param v View direction
 * @param thickness Estimated thickness
 * @param sssColor SSS color
 * @return SSS contribution
 */
vec3 subsurfaceScattering(vec3 n, vec3 l, vec3 v, float thickness, vec3 sssColor) {
  vec3 h = normalize(l + n * 0.5);
  float sss = pow(clamp(dot(v, -h), 0.0, 1.0), 3.0) * thickness;
  return sss * sssColor;
}

/**
 * Hemisphere lighting
 * Simple two-tone lighting (sky + ground)
 */
vec3 hemisphereLight(vec3 n, vec3 skyColor, vec3 groundColor) {
  float factor = n.y * 0.5 + 0.5;
  return mix(groundColor, skyColor, factor);
}

/**
 * Cel shading (toon shading)
 * Discrete lighting bands
 */
vec3 celShading(vec3 p, vec3 n, vec3 lightPos, vec3 lightColor, int bands) {
  vec3 lightDir = normalize(lightPos - p);
  float diff = max(dot(n, lightDir), 0.0);

  // Quantize to discrete bands
  float bandSize = 1.0 / float(bands);
  diff = floor(diff / bandSize) * bandSize;

  return diff * lightColor;
}

/**
 * God rays / volumetric lighting approximation
 */
float volumetricLight(vec3 ro, vec3 rd, vec3 lightPos, float density, int steps) {
  float scatter = 0.0;
  float stepSize = 1.0;

  for (int i = 0; i < steps; i++) {
    vec3 p = ro + rd * (float(i) * stepSize);
    vec3 toLight = lightPos - p;
    float dist = length(toLight);
    scatter += density / (1.0 + dist * dist);
  }

  return scatter / float(steps);
}

/**
 * Apply fog based on distance
 *
 * @param color Original color
 * @param dist Distance from camera
 * @param fogColor Fog color
 * @param density Fog density
 * @return Color with fog applied
 */
vec3 applyFog(vec3 color, float dist, vec3 fogColor, float density) {
  float fogFactor = 1.0 - exp(-dist * density);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(color, fogColor, fogFactor);
}

/**
 * Height-based fog
 * Fog density increases at lower altitudes
 */
vec3 applyHeightFog(vec3 color, vec3 pos, float height, vec3 fogColor, float density) {
  float heightFactor = clamp((height - pos.y) / height, 0.0, 1.0);
  float fogFactor = 1.0 - exp(-heightFactor * density);
  return mix(color, fogColor, fogFactor);
}

/**
 * Distance-based glow effect
 */
vec3 applyGlow(vec3 color, float steps, vec3 glowColor, float intensity) {
  float glow = float(steps) / float(MAX_STEPS);
  glow = pow(glow, 2.0) * intensity;
  return color + glow * glowColor;
}
