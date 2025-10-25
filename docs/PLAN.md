# Three.js Fractal Explorer – Plan (Condensed)

## Quick Status
- 6 fractals (incl. Truchet Pipes) • GLSL 3.00 ES • Full GUI • Overlay • Screenshot export.
- Ray‑marching optimizations + shader specialization with precompile progress.
- Texture Quality presets (Performance / Balanced / Crisp) and fast auto‑tuner.

## Completed (high‑level)
- Truchet Pipes world + smooth‑union option and safety clamps.
- Procedural textures: warp, anisotropy, per‑layer mapping, links, quick presets.
- Texture optimizations: Top‑2 triplanar, Fast Bump (3‑tap), LOD v2 (derivative‑driven octave drop) + bump/spec derivative fades.
- Truchet shadow SDF (conservative) with region‑aware margins; Fast Normals/Shadows/AO toggles.
- Overlay shows Fast toggles and TexPerf (Top‑2/MinW, FastB, LOD A/B/S/R).

## Presets in Use
- Truchet Interior (Perf): MaxSteps 148, Shadows 14≥12, Fast N/S/AO On, Fog Exp.
- Pipe Catacombs (Baseline Tex): heavy textured baseline (MaxSteps 180, Shadows 24≥18).
- Test Settings: same budgets/pose as Catacombs with texture optimizations on (Top‑2, Fast Bump, LOD v2).

## Baselines (current)
- Small screen (1496×938, DPR=2): Interior (Perf) ≈ 64.9 FPS.
- Big screen (2054×1148, DPR=1): Interior (Perf) ≈ 44.8 FPS.
- Big screen (PR 1, 2054×1148, same pose):
  - Pipe Catacombs (Baseline Tex): 30.2 FPS avg (p50 30.0, p95 30.3).
  - Test Settings (Tex Opt, strict Top‑2): 32.0 FPS avg (p50 32.0, p95 32.2).
  - Net delta vs baseline: +1.8 FPS (+6%).

## How to Benchmark
1) Apply “Pipe Catacombs (Baseline Tex)” → Profiling → Run 3×15s (batch).
2) Apply “Test Settings” (Top‑2 + Fast Bump + LOD v2) → batch again. Confirm overlay lines show expected Fast/ TexPerf states.
3) For interior (non‑texture) checks use “Truchet Interior (Perf)” and batch.

## Texture Tuning Ranges
- Top‑2 Min Weight: 0.10–0.15 (PR1 start 0.12; PR2 start 0.08–0.12).
- LOD Aggression: 1.15–1.35 (PR1 start 1.25).
- Bump/Spec Deriv Fades: 0.7–0.9 / 0.6–0.8.
- Roughness Fade K: 0.0–1.0 (keep 0.0 unless reducing wall sparkle).

## Next Steps
- [Done] Strength/attribute gating in texture eval (skip dead work).
- [Done] Optional distance‑based bump/spec fade (fractal surfaces).
- [Done] “Texture Quality” preset (Perf / Balanced / Crisp) mapping.
- [Done] Top‑2 hysteresis (strict drop with raised cutoff; no soft third projection).
- TODO: Evaluate visual tradeoffs of distance fade presets and expose per‑scene toggles.

## Hand‑off Checklist (fresh session)
- Confirm precompile progress appears before GUI.
- Batch Catacombs (Baseline Tex), then Test Settings (same pose/budgets) and compare averages.
- Use overlay lines (Fast/ TexPerf) in screenshots to keep results self‑describing.

---

## Updates – 2025‑10‑13

### What shipped
- Strict Top‑2 triplanar with hysteresis as a raised cutoff (no smoothing). Preserves Top‑2 perf while dampening rare flips.
- Attribute gating in texture eval: skip gradients when a layer’s effective bump is zero.
- Optional distance‑based fade for bump/spec on fractal surfaces.
- Post‑processing link fix (ANGLE/Metal): added screen‑space vertex with `vUv` for the post pass.
- “Texture Quality” presets and a fast auto‑tuner.

### Texture Quality mappings
- Balanced (current default target)
  - Top‑2: On, MinW 0.12, Hyst 0.01, FastBump: On
  - LOD: Aggression 1.25, Bump Deriv 0.80, Spec Deriv 0.65, Roughness 0.00
  - Far scaling: Bump 0.65, Spec 0.75
- Performance
  - Top‑2: On, MinW ≈ 0.15, Hyst ≈ 0.02, FastBump: On
  - LOD: Aggression ≈ 1.35, Bump Deriv ≈ 0.85, Spec Deriv ≈ 0.75
  - Far scaling: keep ≥ baseline (Bump ≥ 0.40, Spec ≥ 0.50)
- Crisp
  - Top‑2: Off, FastBump: Off
  - LOD: Aggression ≈ 1.15, Bump Deriv ≈ 0.70, Spec Deriv ≈ 0.60
  - Far scaling: Bump ≈ 0.85, Spec ≈ 0.90

Expected overlay for Balanced Test Settings:
```
TexPerf: On  Top2:Y MinW:0.12 Hyst:0.01  FastB:Y  LOD(A:1.25 B:0.80 S:0.65 R:0.00)
```

### Auto‑tuner
- Location: GUI → Performance → Profiling → “Tune Texture (fast)”.
- Sweep sets:
  - MinW × Hyst in {0.10, 0.12, 0.15} × {0.00, 0.01, 0.02}
  - LOD triplets: (A,B,S) ∈ {(1.15,0.70,0.60), (1.25,0.80,0.65), (1.35,0.85,0.75)}
- Duration: ~1.8s per point with warmups; applies winners and persists.

### Notes
- Keep Hyst small (≈0.01) to avoid re‑admitting the 3rd projection under noise.
- If highlight shimmer is noticeable, try Spec Deriv Fade 0.70; cost impact is minimal.
