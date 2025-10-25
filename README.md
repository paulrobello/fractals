# Fractal Explorer (Three.js)

<!-- Pages badge owner set to @paulrobello -->

[![Pages](https://img.shields.io/github/actions/workflow/status/paulrobello/fractals/pages.yml?branch=main&label=pages&logo=github)](https://github.com/paulrobello/fractals/actions/workflows/pages.yml)

Real‑time GPU ray‑marched fractals (Menger, Mandelbulb, Sierpinski, Mandelbox) with flight controls, full GUI, and production‑grade performance tuning.

## Features

- Real‑time ray marching with AO and soft shadows
- 5 fractal scenes + 6 visual presets (one‑click looks)
- Custom palettes (import/export JSON, up to 8 stops, linear/cosine interpolation, clamp/repeat/mirror wrap) with live preview
- Full color system (Material / Orbit Trap / Distance / Normal) + palettes
- Performance suite: Adaptive relaxation, epsilon LOD, Budget LOD (steps/AO/shadows) with far‑shadow skip, Debug Overlay, live budget Estimate
- Robust floor/plane pipeline (2025‑10‑10): analytic ground plane with post‑refine visibility resolve — no SDF union, no seam “gasket”; floor shadows optional
- Help overlay, screenshot export, camera state auto‑save
- Auto GPU benchmark (no modal): measures on‑screen FPS and picks Ultra/High/…

## Quick Start

- Requirements: Node 18+ (Node 20 recommended), npm
- Install: `npm ci` (or `npm install`)
- Dev: `npm run dev` → opens http://localhost:3333/
- Build: `npm run build`
- Preview: `npm run preview` (use `-- --port 3333` to match dev port)

## New: World Fractal + Presets

World (Amazing Surf) adds a gyroid‑style world you can fly through.

- Pick it: GUI → Fractal → Type → “World (Amazing Surf)”.
- Controls (GUI → Fractal → World):
  - Tile Period (bigger = larger rooms)
  - Shell Thickness (smaller = more open)
  - Domain Warp (adds organic variation)
  - Advanced: DE Safety (stability), Segment Clamp (segment step limit)
- Fly Mode (Camera → “Fly Mode (Pitch Forward)”) makes W/S move along camera forward (pitch). Enabled automatically for World.

Presets to try

- Bridges (World, Segment) — fast fly‑through (Segment tuned)
- Cathedral (World, Sphere) — beauty shot (Sphere Plain, Electric palette)
- Cathedral Cavern (World) — sphere baseline

Tip: Segment is faster; if you see banded “shelves” far away on thin shells, lower Segment Clamp and/or increase DE Safety.

### Chrome/macOS note: Palette dropdown

On Chrome for macOS, the native `<select>` used by lil‑gui can occasionally skip `onChange`. The app includes a tiny DOM hook (Palette control only) to keep the dropdown label and shader uniforms in sync. You can disable this hook for diagnostics in DevTools, then reload:

```
window.__paletteDomHook = false
```

First run auto‑benchmarks if no quality is cached, then applies the result.

## Controls

- Click canvas to lock pointer (first‑person look)
- Move: `W/A/S/D`, Up `E`, Down `Q`
- Speed boost: `Shift`
- Reset camera: `O`
- Toggle auto-rotate: `R`
- Toggle morph: `M`
- Fractal: `1..5`
- Iterations: `[` and `]`
- Toggle help: `H`

## GUI Overview (lil‑gui)

- Fractal: type, iterations, power (Mandelbulb), scale
- Animation: auto‑rotate, per‑axis speeds
- Camera: movement speed, FOV, reset
- Lighting: light position, ambient/diffuse/specular, shininess, AO, soft shadows, shadow quality/sharpness, normal precision
- Environment: fog (exp/exp2/linear), density/near/far, background color, Floor Receives Shadows
- Color: color mode, palette, intensity, orbit‑trap scale, material color
- Performance: Quality Preset (Low/Medium/High/Ultra), Max Steps, Step Size
  - Note: Shaders are specialized per fractal (compile-time FRAC_TYPE) by default.
- Advanced Optimizations: Adaptive step size, Epsilon LOD (near/far), Budget LOD (step cap, AO/Shadow floors, far‑shadow skip), Budget Presets, Estimate label, Debug Overlay toggle
- Presets: visual preset selector (top‑level)

## Auto GPU Benchmark

- Runs automatically when `fractalExplorer_quality` is not in localStorage
- Measures real delivered FPS using requestAnimationFrame (on‑screen)
- Ultra is measured first with your current settings; other tiers derive from Ultra
- Caches `{ quality, maxSteps, iterations }` and applies on subsequent loads
- Clear cache to re‑run: `localStorage.removeItem('fractalExplorer_quality')`

## Troubleshooting

- Shader error modal: If shaders fail, a red panel appears and the loading screen stays visible. Click “Copy Log” and check DevTools console for full GLSL sources and driver logs (we capture both compile and link logs).
- Clear cached quality: See command above if you want to re‑benchmark.
- Reset camera: `R`. Camera pose auto‑saves every second to `fractalExplorer_cameraPosition`.
- If dev reload looks stale: enable “Disable cache” in DevTools Network tab and hard‑reload.

## Project Structure

```
fractal-explorer/
├─ src/
│  ├─ main.js                 # Entry & render loop
│  ├─ core/                   # PerformanceTest
│  ├─ shaders/                # fractal.vert/frag + includes/
│  ├─ controls/               # Fly/Pointer lock
│  ├─ ui/                     # GUIManager, Stats wiring
│  └─ config/                 # presets.js, defaults
├─ public/                    # static assets copied to root (e.g., CNAME)
├─ .github/
│  └─ workflows/
│     └─ pages.yml            # GitHub Pages deployment
├─ docs/
│  ├─ PLAN.md                 # Plan & status
│  ├─ IMPLEMENTATION_SUMMARY.md
│  └─ RAY_MARCHING_RESEARCH.md
└─ vite.config.js
```

## Performance Tips

- Start with Quality preset = “Quality” Budget LOD for best visuals at speed
- If FPS dips: lower Max Steps or raise Step Cap Far Factor (fewer far steps)
- Use Debug Overlay to confirm LOD ranges and budgets match expectations

## 2025‑10‑10: Floor/Plane Pipeline

- The ground plane is now an analytic ray–plane candidate, not part of the SDF.
- A single ResolveHit step compares the fractal hit vs. plane t and resolves visibility with a seam‑tolerant rule based on adaptive epsilon.
- Floor pixels: AO is skipped (AO=1), shadows only when “Floor Receives Shadows” is ON.
- Fog uses the final resolved distance tHit for both surfaces.
- Result: no “black gasket” at the floor seam, no under‑floor imprinting, and simpler defaults (no floor‑specific biases/pads/clips).

## Deployment

### GitHub Pages (via Actions)

This repo includes a Pages workflow at `.github/workflows/pages.yml` that builds with Vite and deploys `dist/` on pushes to `main`.

1. Push to `main` (or run the workflow manually from the Actions tab).
2. In GitHub → Settings → Pages:
   - Build and deployment → Source: GitHub Actions
   - Custom domain: `fractals.pardev.net`
   - Enforce HTTPS: ON
3. DNS: create a CNAME record for `fractals.pardev.net` pointing to `<your-user-or-org>.github.io`.

Notes

- `public/CNAME` is committed so the domain is tracked in-repo.
- With a custom domain, Vite `base` can remain the default (`/`). No extra config is needed.

### Static Hosts

- Build locally with `npm run build` (outputs `dist/`).
- Ensure your host serves `.glsl` files; `text/plain` or `text/x-glsl` is fine. Includes are bundled via `vite-plugin-glsl`.
- Netlify/Vercel: deploy the `dist/` directory.

## License

MIT

**Status:** Core complete • **Last Updated:** 2025‑10‑25
