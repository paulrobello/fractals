// Mandelbulb Distance Estimation
// Reference: https://iquilezles.org/articles/mandelbulb/
// Uses distance estimation with derivative tracking for accurate rendering

// Standard Mandelbulb with power 8
// p: Point in 3D space
// iterations: Number of iterations (8-16 recommended)
// power: Power parameter (typically 8.0)
// Returns: Distance estimate to the surface
float sdMandelbulb(vec3 p, int iterations, float power) {
    vec3 z = p;
    float dr = 1.0;
    float r = 0.0;

    for(int i = 0; i < iterations; i++) {
        r = length(z);

        // Early bailout if point escapes
        if(r > 2.0) break;

        // Convert to polar coordinates
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);

        // Scale and track derivative
        dr = pow(r, power - 1.0) * power * dr + 1.0;

        // Scale and rotate the point
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;

        // Convert back to cartesian coordinates
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(phi) * sin(theta),
            cos(theta)
        );

        // Add original point (Mandelbulb iteration)
        z += p;
    }

    // Distance estimation
    r = max(r, 1e-6); // prevent log(0)
    return 0.5 * log(r) * r / dr;
}

// REMOVED: Optimized Mandelbulb using polynomial expansion
// The previous polynomial implementation had incorrect math that produced wrong fractal shapes.
// For power-8 Mandelbulb, use the standard trigonometric version above (sdMandelbulb with power=8.0).
// While slightly slower, it produces correct results. Future optimization should use verified formulas.
//
// Note: Correct polynomial expansions for Mandelbulb are extremely complex and error-prone.
// See: https://iquilezles.org/articles/mandelbulb/ for reference implementations.

// Mandelbulb with configurable parameters from uniforms
float sdMandelbulbUniform(vec3 p, int maxIterations, float power) {
    return sdMandelbulb(p, maxIterations, power);
}

// Animated Mandelbulb with rotation
float sdMandelbulbAnimated(vec3 p, int iterations, float power, float time) {
    // Slow rotation for better viewing
    p = rotateY(p, time * 0.1);
    p = rotateX(p, sin(time * 0.05) * 0.3);

    return sdMandelbulb(p, iterations, power);
}

// Mandelbulb with scale control
float sdMandelbulbScaled(vec3 p, int iterations, float power, float scale) {
    // Scale the input position
    p /= scale;

    // Calculate distance and scale back
    return sdMandelbulb(p, iterations, power) * scale;
}

// Julia set variant (quaternion Julia)
// c: Julia set parameter
float sdJulia(vec3 p, vec4 c, int iterations) {
    vec4 z = vec4(p, 0.0);
    float dr = 1.0;
    float r = 0.0;

    for(int i = 0; i < iterations; i++) {
        r = length(z);
        if(r > 2.0) break;

        // Quaternion multiplication: z = z^2 + c
        dr = 2.0 * r * dr + 1.0;

        // z^2 in quaternion form
        z = vec4(
            z.x*z.x - z.y*z.y - z.z*z.z - z.w*z.w,
            2.0*z.x*z.y,
            2.0*z.x*z.z,
            2.0*z.x*z.w
        ) + c;
    }

    r = max(r, 1e-6); // prevent log(0)
    return 0.5 * log(r) * r / dr;
}
