/**
 * Sierpinski Tetrahedron (Tetrix) - Distance Estimation
 *
 * The Sierpinski tetrahedron is created through iterative folding operations
 * that reflect the space across tetrahedral symmetry planes.
 *
 * Reference: http://blog.hvidtfeldts.net/index.php/2011/08/distance-estimated-3d-fractals-iii-folding-space/
 */

// Tetrahedral fold - reflect across tetrahedral symmetry planes
vec3 tetrahedralFold(vec3 z) {
    // Fold across the four planes of tetrahedral symmetry
    // These planes are oriented at 109.47 degrees apart

    // First fold: across xy plane (z > 0)
    if (z.x + z.y < 0.0) z.xy = -z.yx;

    // Second fold: across xz plane
    if (z.x + z.z < 0.0) z.xz = -z.zx;

    // Third fold: across yz plane
    if (z.y + z.z < 0.0) z.zy = -z.yz;

    return z;
}

// Alternative tetrahedral fold (more accurate)
vec3 tetrahedralFoldAccurate(vec3 z) {
    // Tetrahedral symmetry using normal vectors
    vec3 n1 = normalize(vec3( 1.0,  1.0,  1.0));
    vec3 n2 = normalize(vec3(-1.0, -1.0,  1.0));
    vec3 n3 = normalize(vec3( 1.0, -1.0, -1.0));
    vec3 n4 = normalize(vec3(-1.0,  1.0, -1.0));

    // Reflect across planes if on wrong side
    z -= 2.0 * min(0.0, dot(z, n1)) * n1;
    z -= 2.0 * min(0.0, dot(z, n2)) * n2;
    z -= 2.0 * min(0.0, dot(z, n3)) * n3;
    z -= 2.0 * min(0.0, dot(z, n4)) * n4;

    return z;
}

// Sierpinski Tetrahedron distance estimator
// @param p - point in space
// @param iterations - number of folding iterations (4-12 recommended)
// @param scale - scaling factor (typically 2.0)
float sdSierpinskiWithBase(vec3 p, int iterations, float scale, float baseSize) {
    vec3 z = p;
    float s = 1.0;
    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;
        z = tetrahedralFold(z);
        z = z * scale - vec3(scale - 1.0);
        s *= scale;
    }
    return sdTetrahedron(z, baseSize) / max(1.0, s);
}

// Backwards-compatible default base size
float sdSierpinski(vec3 p, int iterations, float scale) {
    return sdSierpinskiWithBase(p, iterations, scale, 0.6);
}

// Alternative Sierpinski using simpler geometry
// Creates a more "classic" Sierpinski look
float sdSierpinskiSimple(vec3 p, int iterations, float scale) {
    vec3 z = p;
    float dist = 0.0;

    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;

        // Classic fold
        z = tetrahedralFold(z);

        // Scale
        z *= scale;
        z -= vec3(scale - 1.0);
    }

    // Distance to tetrahedron at current scale
    // Approximate using distance to origin minus size
    return (length(z) - 2.0) / pow(scale, float(iterations));
}

// Sierpinski with custom offset control
float sdSierpinskiCustom(vec3 p, int iterations, float scale, vec3 offset) {
    vec3 z = p;
    float r = length(z);
    float dr = 1.0;

    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;

        z = tetrahedralFold(z);
        z = z * scale - offset * (scale - 1.0);
        dr = dr * scale;
        r = length(z);
    }

    return (r - 2.0) / dr * 0.25;
}

// Colorful Sierpinski - returns distance and orbit trap value
struct SierpinskiResult {
    float dist;
    float orbitTrap;
};

SierpinskiResult sdSierpinskiColored(vec3 p, int iterations, float scale) {
    vec3 z = p;
    float r = length(z);
    float dr = 1.0;
    float minDist = 1000.0; // For orbit trapping

    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;

        z = tetrahedralFold(z);
        z = z * scale - vec3(scale - 1.0);
        dr = dr * scale;
        r = length(z);

        // Track minimum distance to origin (orbit trap)
        minDist = min(minDist, r);
    }

    SierpinskiResult result;
    result.dist = (r - 2.0) / dr * 0.25;
    result.orbitTrap = minDist;

    return result;
}
