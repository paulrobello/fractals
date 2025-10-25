/**
 * Mandelbox - Distance Estimation
 *
 * The Mandelbox is a fractal that uses conditional folding operations
 * combined with spherical inversion to create complex 3D structures.
 *
 * Reference: http://www.fractalforums.com/3d-fractal-generation/amazing-fractal/
 * Reference: https://sites.google.com/site/mandelbox/what-is-a-mandelbox
 */

// Box fold operation
// Reflects coordinates back into a central box
vec3 boxFold(vec3 z, float foldingLimit) {
    return clamp(z, -foldingLimit, foldingLimit) * 2.0 - z;
}

// Sphere fold operation (spherical inversion)
// Inverts space through a sphere, creating self-similar structures
vec3 sphereFold(vec3 z, float minRadius, float fixedRadius, out float factor) {
    float r2 = dot(z, z);
    float minRadius2 = minRadius * minRadius;
    float fixedRadius2 = fixedRadius * fixedRadius;

    if (r2 < minRadius2) {
        // Linear inner scaling
        factor = fixedRadius2 / minRadius2;
        return z * factor;
    } else if (r2 < fixedRadius2) {
        // Spherical inversion
        factor = fixedRadius2 / r2;
        return z * factor;
    } else {
        // No scaling in outer region
        factor = 1.0;
        return z;
    }
}

// Standard Mandelbox distance estimator
// @param p - point in space
// @param iterations - number of iterations (4-10 recommended)
// @param scale - scaling factor (typically -1.5 to -2.0, or positive 2.0-3.0)
// @param foldingLimit - box folding threshold (typically 1.0)
// @param minRadius - minimum radius for sphere fold (typically 0.5)
// @param fixedRadius - fixed radius for sphere fold (typically 1.0)
float sdMandelbox(vec3 p, int iterations, float scale, float foldingLimit, float minRadius, float fixedRadius) {
    vec3 z = p;
    float dr = 1.0; // Derivative for distance estimation
    float r = length(z);

    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;

        // Box fold
        z = boxFold(z, foldingLimit);

        // Sphere fold
        float factor;
        z = sphereFold(z, minRadius, fixedRadius, factor);
        dr = dr * abs(factor);

        // Scale and translate
        z = z * scale + p;
        dr = dr * abs(scale) + 1.0;

        r = length(z);
        if (r > 10.0) break;
    }

    // Standard DE is stable without a hard subtraction term here.
    // Over-aggressive subtraction causes distance-dependent morphing.
    return r / abs(dr);
}

// Simplified Mandelbox with default parameters
float sdMandelboxSimple(vec3 p, int iterations, float scale) {
    return sdMandelbox(p, iterations, scale, 1.0, 0.5, 1.0);
}

// Mandelbox with variable folding parameters
float sdMandelboxVariable(vec3 p, int iterations, float scale, float foldingLimit, float minRadius) {
    vec3 z = p;
    float dr = 1.0;
    float fixedRadius = 1.0;
    float minRadius2 = minRadius * minRadius;
    float fixedRadius2 = fixedRadius * fixedRadius;

    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;

        // Box fold
        z = boxFold(z, foldingLimit);

        // Sphere fold
        float r2 = dot(z, z);
        if (r2 < minRadius2) {
            float factor = fixedRadius2 / minRadius2;
            z *= factor;
            dr *= factor;
        } else if (r2 < fixedRadius2) {
            float factor = fixedRadius2 / r2;
            z *= factor;
            dr *= factor;
        }

        // Scale and translate
        z = z * scale + p;
        dr = dr * abs(scale) + 1.0;
    }

    return length(z) / abs(dr);
}

// Colorful Mandelbox - returns distance and orbit trap value
struct MandelboxResult {
    float dist;
    float orbitTrap;
    float sphereFolds; // Count of sphere folds (for coloring)
};

MandelboxResult sdMandelboxColored(vec3 p, int iterations, float scale) {
    vec3 z = p;
    float dr = 1.0;
    float minDist = 1000.0;
    float sphereFoldCount = 0.0;

    float foldingLimit = 1.0;
    float minRadius = 0.5;
    float fixedRadius = 1.0;
    float minRadius2 = minRadius * minRadius;
    float fixedRadius2 = fixedRadius * fixedRadius;

    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;

        // Box fold
        z = boxFold(z, foldingLimit);

        // Sphere fold with counting
        float r2 = dot(z, z);
        if (r2 < minRadius2) {
            float factor = fixedRadius2 / minRadius2;
            z *= factor;
            dr *= factor;
            sphereFoldCount += 1.0;
        } else if (r2 < fixedRadius2) {
            float factor = fixedRadius2 / r2;
            z *= factor;
            dr *= factor;
            sphereFoldCount += 0.5;
        }

        // Scale and translate
        z = z * scale + p;
        dr = dr * abs(scale) + 1.0;

        // Track minimum distance (orbit trap)
        minDist = min(minDist, length(z));
    }

    MandelboxResult result;
    result.dist = length(z) / abs(dr);
    result.orbitTrap = minDist;
    result.sphereFolds = sphereFoldCount;

    return result;
}

// Mandelbox with animation-friendly parameters
float sdMandelboxAnimated(vec3 p, int iterations, float scale, float time) {
    // Animate folding parameters
    float foldingLimit = 1.0 + 0.2 * sin(time * 0.5);
    float minRadius = 0.5 + 0.1 * cos(time * 0.7);

    return sdMandelbox(p, iterations, scale, foldingLimit, minRadius, 1.0);
}
