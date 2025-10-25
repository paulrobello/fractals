// DEC SDF: vec3 Rotate(vec3 z,float AngPFXY,float AngPFYZ,float AngPFXZ) {
// Category: fractal | Author: scaprendering
// Source: Distance Estimator Compendium (DEC) — https://jbaker.graphics/writings/DEC.html
// License: CC BY-NC-SA 3.0 (see DEC page)
// Retrieved: 2025-10-17
// File: ./includes/dec/fractal/vec3-rotate-vec3-z-float-angpfxy-float-angpfyz-float-angpfxz.glsl
// Note: This snippet may require adaptation for GLSL 3.00 ES.
// It is not included in any shader by default.

float sPFXY = sin(radians(AngPFXY)); float cPFXY = cos(radians(AngPFXY));
        float sPFYZ = sin(radians(AngPFYZ)); float cPFYZ = cos(radians(AngPFYZ));
        float sPFXZ = sin(radians(AngPFXZ)); float cPFXZ = cos(radians(AngPFXZ));

        float zx = z.x; float zy = z.y; float zz = z.z; float t;

        // rotate BACK
        t = zx; // XY
        zx = cPFXY * t - sPFXY * zy; zy = sPFXY * t + cPFXY * zy;
        t = zx; // XZ
        zx = cPFXZ * t + sPFXZ * zz; zz = -sPFXZ * t + cPFXZ * zz;
        t = zy; // YZ
        zy = cPFYZ * t - sPFYZ * zz; zz = sPFYZ * t + cPFYZ * zz;
        return vec3(zx,zy,zz);
}


float de( vec3 p ) {
    float Scale = 1.34f;
    float FoldY = 1.025709f;
    float FoldX = 1.025709f;
    float FoldZ = 0.035271f;
    float JuliaX = -1.763517f;
    float JuliaY = 0.392486f;
    float JuliaZ = -1.734913f;
    float AngX = -51.080209f;
    float AngY = 0.0f;
    float AngZ = -29.096322f;
    float Offset = -3.036726f;
    int EnableOffset = 1;
    int Iterations = 80;
    float Precision = 1.0f;
    // output _sdf c = _SDFDEF)

    vec4 OrbitTrap = vec4(1.0,1.0,1.0,1.0);
    float u2 = 1;
    float v2 = 1;
    if(EnableOffset)p = Offset+abs(vec3(p.x,p.y,p.z));

    vec3 p0 = vec3(JuliaX,JuliaY,JuliaZ);
    float l = 0.0;
    int i=0;
    for (i=0; i<Iterations; i++) {
        p = Rotate(p,AngX,AngY,AngZ);
        p.x=abs(p.x+FoldX)-FoldX;
        p.y=abs(p.y+FoldY)-FoldY;
        p.z=abs(p.z+FoldZ)-FoldZ;
        p=p*Scale+p0;
        l=length(p);
        float rr = dot(p,p);
    }
    return Precision*(l)*pow(Scale, -float(i));
}
