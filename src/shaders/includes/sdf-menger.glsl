// Menger Sponge Distance Field
// Reference: https://iquilezles.org/articles/menger/
// Uses box folding technique for efficient fractal generation

// Menger Sponge SDF with configurable iterations
// iterations: Number of subdivision levels (3-8 recommended)
// Returns: Distance to the surface
float sdMenger(vec3 p, int iterations) {
    // Initial bounding box
    float d = sdBox(p, vec3(1.0));

    // Scale factor for each iteration
    float s = 1.0;

    for(int i = 0; i < iterations; i++) {
        // Box folding - create 3x3x3 grid of holes
        vec3 a = mod(p * s, 2.0) - 1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0 * abs(a));

        // Create the cross-shaped hole pattern
        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc)) - 1.0) / s;

        // Subtract holes from the box
        d = max(d, c);
    }

    return d;
}

// Menger Sponge with uniform-controlled iterations
// u_iterations: Passed from main shader
float sdMengerUniform(vec3 p, int maxIterations) {
    return sdMenger(p, maxIterations);
}

// Animated Menger Sponge with rotation
float sdMengerAnimated(vec3 p, int iterations, float time) {
    // Apply rotation
    p = rotateY(p, time * 0.2);
    p = rotateX(p, time * 0.15);

    return sdMenger(p, iterations);
}

// Menger Sponge with scale control
float sdMengerScaled(vec3 p, int iterations, float scale) {
    // Scale the input position
    p /= scale;

    // Calculate distance and scale back
    return sdMenger(p, iterations) * scale;
}
