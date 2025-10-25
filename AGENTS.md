# Repository Guidelines

## Project Structure & Module Organization

- `src/main.js` – app entry (Three.js setup, uniforms, GUI, RAF loop).
- `src/shaders/` – GLSL sources. Main: `fractal.vert.glsl`, `fractal.frag.glsl`; shared chunks in `src/shaders/includes/*.glsl`.
- `src/ui/` – UI and GUI controls (`GUIManager.js`).
- `src/core/` – core utilities (`PerformanceTest.js`).
- `src/controls/` – input controls (`FlyControls.js`).
- `src/config/` – presets and defaults.
- `index.html`, `vite.config.js`, `docs/` – app shell, build config, background notes.

## Build, Test, and Development Commands

- `npm install` – install dependencies.
- `npm run dev` – start Vite dev server (default port 3333) with hot reload.
- `npm run build` – production build with sourcemaps.
- `npm run preview` – serve the production build locally.

Manual QA (no unit tests yet):

- Load the dev server, confirm shader compiles (loading bar hides; no error panel).
- Toggle help overlay (press `H`) and pointer lock; fly with `WASD/E/Q`.
- Switch fractals (`1`–`5`), adjust iterations `[`, `]`, verify FPS overlay and LOD text.

## Coding Style & Naming Conventions

- JavaScript: 2-space indent, semicolons, single quotes, ES modules.
- Classes: `PascalCase` (e.g., `GUIManager`); functions/variables: `camelCase`.
- Files: JS modules `UpperCamelCase.js` for classes, otherwise `camelCase.js`; GLSL chunks use `kebab-case.glsl` under `includes/`.
- Keep uniforms centralized in `src/main.js` and mirror any new ones in the GUI.
- Shaders target GLSL 3.00 ES; prefer small, composable includes and document with `// BEGIN include …` blocks as used in `main.js`.

## Testing Guidelines

- Framework: not configured. Prefer adding Vitest later; until then, rely on manual QA above.
- Repro steps in issues: include GPU/OS/Browser, Vite mode (dev/build), and console logs. Attach screenshots via the in-app “Capture Screenshot”.

## Commit & Pull Request Guidelines

- Commit style: adopt Conventional Commits (e.g., `feat(ui): add orbit-trap palette`).
- PRs must include: purpose, screenshots (before/after), performance notes (FPS deltas), and linked issues.
- For shader changes: explain visual impact and any iteration/step budget changes (`u_maxSteps`, AO/shadow params).

## Security & Configuration Tips

- Port and GLSL handling are set in `vite.config.js`; update there rather than ad‑hoc scripts.
- Avoid introducing network calls; app is static. Guard new features behind GUI toggles.
