/**
 * Orbit Trap Coloring and Distance-Based Coloring
 *
 * Orbit traps track points during fractal iteration and use their proximity
 * to various geometric objects to generate colors.
 */

// Color palette utilities
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    // Cosine palette function (from IQ)
    // Creates smooth color gradients
    return a + b * cos(6.28318 * (c * t + d));
}

// --- Gradient helpers (moved up so they are visible to palette functions) ---
// Three-color gradient
vec3 gradientMap(float t, vec3 color1, vec3 color2, vec3 color3) {
    if (t < 0.5) {
        return mix(color1, color2, t * 2.0);
    } else {
        return mix(color2, color3, (t - 0.5) * 2.0);
    }
}

// Five-color gradient
vec3 gradientMap5(float t, vec3 c1, vec3 c2, vec3 c3, vec3 c4, vec3 c5) {
    t = clamp(t, 0.0, 1.0);
    if (t < 0.25) {
        return mix(c1, c2, t * 4.0);
    } else if (t < 0.5) {
        return mix(c2, c3, (t - 0.25) * 4.0);
    } else if (t < 0.75) {
        return mix(c3, c4, (t - 0.5) * 4.0);
    } else {
        return mix(c4, c5, (t - 0.75) * 4.0);
    }
}

// Predefined color palettes
vec3 paletteDeepOcean(float t) {
    // High-contrast ocean gradient: deep navy → blue → teal → aqua foam
    t = clamp(t, 0.0, 1.0);
    // emphasize mid-tones to avoid muddy center
    t = smoothstep(0.05, 0.95, t);
    vec3 c1 = vec3(0.03, 0.06, 0.12); // deep navy
    vec3 c2 = vec3(0.06, 0.16, 0.35); // deep blue
    vec3 c3 = vec3(0.08, 0.35, 0.58); // blue-cyan
    vec3 c4 = vec3(0.10, 0.65, 0.65); // teal
    vec3 c5 = vec3(0.85, 0.95, 0.98); // foam highlights
    vec3 col = gradientMap5(t, c1, c2, c3, c4, c5);
    // slight gamma lift for richer mids
    col = pow(col, vec3(0.9));
    return col;
}

vec3 paletteMoltenLava(float t) {
    return palette(t,
        vec3(0.5, 0.3, 0.2),  // base - oranges/reds
        vec3(0.5, 0.3, 0.2),  // amplitude
        vec3(1.0, 1.0, 0.5),  // frequency
        vec3(0.8, 0.2, 0.0)   // phase
    );
}

vec3 paletteElectric(float t) {
    return palette(t,
        vec3(0.5, 0.5, 0.5),  // base
        vec3(0.5, 0.5, 0.5),  // amplitude
        vec3(1.0, 1.0, 1.0),  // frequency
        vec3(0.0, 0.33, 0.67) // phase - cyan/magenta/purple
    );
}

vec3 paletteOrganic(float t) {
    return palette(t,
        vec3(0.4, 0.5, 0.3),  // base - greens
        vec3(0.3, 0.4, 0.2),  // amplitude
        vec3(1.0, 1.0, 0.5),  // frequency
        vec3(0.2, 0.4, 0.0)   // phase
    );
}

vec3 paletteMonochrome(float t) {
    return palette(t,
        vec3(0.3, 0.3, 0.3),  // base - grays
        vec3(0.4, 0.4, 0.5),  // amplitude - with blue accent
        vec3(1.0, 1.0, 1.0),  // frequency
        vec3(0.0, 0.0, 0.3)   // phase
    );
}

// Deep Abyss - darker, moody ocean gradient with subtle green lows
vec3 paletteDeepAbyss(float t) {
    t = clamp(t, 0.0, 1.0);
    t = smoothstep(0.02, 0.98, t);
    vec3 c1 = vec3(0.010, 0.018, 0.030); // near-black navy
    vec3 c2 = vec3(0.020, 0.060, 0.110); // abyss blue
    vec3 c3 = vec3(0.030, 0.120, 0.180); // deep blue
    vec3 c4 = vec3(0.050, 0.220, 0.220); // blue‑green hint
    vec3 c5 = vec3(0.300, 0.600, 0.750); // dim surface light
    vec3 col = gradientMap5(t, c1, c2, c3, c4, c5);
    col = pow(col, vec3(0.95));
    return col;
}

// Tropical Sea - brighter, saturated cyan/teal with warm highlights
vec3 paletteTropicalSea(float t) {
    t = clamp(t, 0.0, 1.0);
    t = smoothstep(0.0, 1.0, t);
    vec3 c1 = vec3(0.020, 0.150, 0.180); // deep turquoise
    vec3 c2 = vec3(0.050, 0.450, 0.550); // cyan
    vec3 c3 = vec3(0.050, 0.750, 0.750); // teal
    vec3 c4 = vec3(0.450, 0.900, 0.750); // mint
    vec3 c5 = vec3(0.980, 0.980, 0.850); // sunlit foam
    vec3 col = gradientMap5(t, c1, c2, c3, c4, c5);
    // Slight warm bias in highlights
    col = mix(col, vec3(1.0, 0.97, 0.92), smoothstep(0.8, 1.0, t) * 0.25);
    return col;
}

// Orbit trap coloring - point trap
// Tracks minimum distance to origin during iteration
vec3 colorOrbitTrapPoint(float minDist, int paletteId) {
    float t = clamp(minDist * 0.5, 0.0, 1.0);

    if (paletteId == 0) return paletteDeepOcean(t);
    if (paletteId == 1) return paletteMoltenLava(t);
    if (paletteId == 2) return paletteElectric(t);
    if (paletteId == 3) return paletteOrganic(t);
    if (paletteId == 5) return paletteDeepAbyss(t);
    if (paletteId == 6) return paletteTropicalSea(t);
    return paletteMonochrome(t);
}

// Orbit trap coloring - plane traps
// Tracks minimum distance to coordinate planes
struct PlaneTraps {
    float x; // Distance to x=0 plane
    float y; // Distance to y=0 plane
    float z; // Distance to z=0 plane
};

vec3 colorOrbitTrapPlanes(PlaneTraps traps, int paletteId) {
    // Combine plane distances
    float minTrap = min(min(traps.x, traps.y), traps.z);
    float t = clamp(minTrap, 0.0, 1.0);

    if (paletteId == 0) return paletteDeepOcean(t);
    if (paletteId == 1) return paletteMoltenLava(t);
    if (paletteId == 2) return paletteElectric(t);
    if (paletteId == 3) return paletteOrganic(t);
    if (paletteId == 5) return paletteDeepAbyss(t);
    if (paletteId == 6) return paletteTropicalSea(t);
    return paletteMonochrome(t);
}

// Distance-based coloring
// Colors based on ray march steps or distance traveled
vec3 colorByDistance(float dist, float maxDist, int paletteId) {
    float t = clamp(dist / maxDist, 0.0, 1.0);

    if (paletteId == 0) return paletteDeepOcean(t);
    if (paletteId == 1) return paletteMoltenLava(t);
    if (paletteId == 2) return paletteElectric(t);
    if (paletteId == 3) return paletteOrganic(t);
    if (paletteId == 5) return paletteDeepAbyss(t);
    if (paletteId == 6) return paletteTropicalSea(t);
    return paletteMonochrome(t);
}

// Distance-based coloring with steps
vec3 colorBySteps(float steps, float maxSteps, int paletteId) {
    float t = clamp(steps / maxSteps, 0.0, 1.0);

    if (paletteId == 0) return paletteDeepOcean(t);
    if (paletteId == 1) return paletteMoltenLava(t);
    if (paletteId == 2) return paletteElectric(t);
    if (paletteId == 3) return paletteOrganic(t);
    if (paletteId == 5) return paletteDeepAbyss(t);
    if (paletteId == 6) return paletteTropicalSea(t);
    return paletteMonochrome(t);
}

// Normal-based coloring (matcap style)
vec3 colorByNormal(vec3 normal) {
    // Map normal components to color
    return normal * 0.5 + 0.5;
}

// Combined coloring using multiple techniques
vec3 colorCombined(float orbitTrap, float dist, vec3 normal, int paletteId) {
    // Blend orbit trap and distance-based coloring
    vec3 colorA = colorOrbitTrapPoint(orbitTrap, paletteId);
    vec3 colorB = colorByDistance(dist, 10.0, paletteId);

    // Use normal to modulate between the two
    float blend = abs(normal.y) * 0.5 + 0.5;
    return mix(colorA, colorB, blend);
}


// HSV to RGB conversion (for procedural colors)
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
