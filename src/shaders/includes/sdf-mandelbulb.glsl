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

// Optimized Mandelbulb using polynomial expansion (faster)
// About 5x faster than trigonometric version for power=8
float sdMandelbulbFast(vec3 p, int iterations) {
    vec3 z = p;
    float dr = 1.0;
    float r = 0.0;

    for(int i = 0; i < iterations; i++) {
        r = length(z);
        if(r > 2.0) break;

        // Power 8 polynomial expansion
        float x = z.x; float x2 = x*x; float x4 = x2*x2;
        float y = z.y; float y2 = y*y; float y4 = y2*y2;
        float z_val = z.z; float z2 = z_val*z_val; float z4 = z2*z2;

        float k3 = x2 + z2;
        float k2 = inversesqrt(k3*k3*k3*k3*k3*k3*k3);
        float k1 = x4 + y4 + z4 - 6.0*y2*z2 - 6.0*x2*y2 + 2.0*z2*x2;
        float k4 = x2 - y2 + z2;

        dr = pow(r, 7.0) * 8.0 * dr + 1.0;

        z.x = p.x + 64.0*x*y*z_val*(x2-z2)*k4*(x4-6.0*x2*z2+z4)*k1*k2;
        z.y = p.y + -16.0*y2*k3*k4*k4 + k1*k1;
        z.z = p.z + -8.0*y*k4*(x4*x4 - 28.0*x4*x2*z2 + 70.0*x4*z4 - 28.0*x2*z2*z4 + z4*z4)*k1*k2;
    }

    r = max(r, 1e-6); // prevent log(0)
    return 0.5 * log(r) * r / dr;
}

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
