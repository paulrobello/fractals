// PaletteManager - manages built-in and user-defined palettes
// - Holds current editable palette
// - Validates + normalizes stops
// - Persists to localStorage
// - Imports/exports JSON

import * as THREE from 'three';

const STORAGE_KEY = 'fractalExplorer_palettes_v1';
export const MAX_PALETTE_STOPS = 8; // Keep in sync with shader

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function toThreeColor(value) {
  if (value instanceof THREE.Color) return value;
  try {
    return new THREE.Color(value);
  } catch (_) {
    return new THREE.Color(1, 1, 1);
  }
}

export class PaletteManager {
  constructor() {
    this.customPalettes = this.loadAll();
    // Create a default editable palette if none exist
    if (Object.keys(this.customPalettes).length === 0) {
      const def = {
        name: 'Custom Gradient',
        stops: [
          { pos: 0.0, color: '#00334d' },
          { pos: 0.5, color: '#00c2c7' },
          { pos: 1.0, color: '#f2fbfa' },
        ],
        interpolation: 'linear', // 'linear' | 'cosine'
        wrap: 'clamp', // 'clamp' | 'repeat' | 'mirror'
        version: 1,
      };
      this.customPalettes[def.name] = def;
      this.saveAll();
    }
    // Select first palette as current
    this.currentName = Object.keys(this.customPalettes)[0];
  }

  // ----- Persistence -----
  loadAll(storage = window?.localStorage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj;
    } catch (_) {}
    return {};
  }

  saveAll(storage = window?.localStorage) {
    try {
      const keys = Object.keys(this.customPalettes);
      if (keys.length === 0) {
        storage.removeItem(STORAGE_KEY);
      } else {
        storage.setItem(STORAGE_KEY, JSON.stringify(this.customPalettes));
      }
    } catch (_) {}
  }

  listNames() {
    return Object.keys(this.customPalettes);
  }

  getCurrent() {
    return this.customPalettes[this.currentName];
  }

  setCurrent(name) {
    if (this.customPalettes[name]) this.currentName = name;
  }

  newPalette(name = 'Untitled Palette') {
    let base = name;
    let idx = 1;
    while (this.customPalettes[name]) {
      name = `${base} ${++idx}`;
    }
    const p = {
      name,
      stops: [
        { pos: 0.0, color: '#000000' },
        { pos: 1.0, color: '#ffffff' },
      ],
      interpolation: 'linear',
      version: 1,
    };
    this.customPalettes[name] = p;
    this.currentName = name;
    this.saveAll();
    return p;
  }

  deletePalette(name) {
    if (!this.customPalettes[name]) return false;
    delete this.customPalettes[name];
    const names = Object.keys(this.customPalettes);
    this.currentName = names[0] || undefined;
    this.saveAll();
    return true;
  }

  renamePalette(oldName, newName) {
    if (!oldName || !newName || !this.customPalettes[oldName]) return false;
    if (this.customPalettes[newName]) return false;
    this.customPalettes[newName] = { ...this.customPalettes[oldName], name: newName };
    delete this.customPalettes[oldName];
    if (this.currentName === oldName) this.currentName = newName;
    this.saveAll();
    return true;
  }

  updateStops(name, stops) {
    const p = this.customPalettes[name];
    if (!p) return false;
    p.stops = this.normalizeStops(stops);
    this.saveAll();
    return true;
  }

  // Normalize stops: clamp, sort, ensure endpoints, cap to MAX
  normalizeStops(stops) {
    let arr = Array.isArray(stops) ? stops.slice() : [];
    arr = arr.map((s) => ({
      pos: clamp01(Number(s.pos ?? 0)),
      color: String(s.color ?? '#ffffff'),
    }));
    // sort by pos
    arr.sort((a, b) => a.pos - b.pos);
    // ensure endpoints
    if (arr.length === 0)
      arr = [
        { pos: 0, color: '#000000' },
        { pos: 1, color: '#ffffff' },
      ];
    if (arr[0].pos > 0) arr.unshift({ pos: 0, color: arr[0].color });
    if (arr[arr.length - 1].pos < 1) arr.push({ pos: 1, color: arr[arr.length - 1].color });
    // dedupe identical positions by keeping last
    const byPos = new Map();
    arr.forEach((s) => byPos.set(Number(s.pos.toFixed(4)), s));
    arr = Array.from(byPos.values()).sort((a, b) => a.pos - b.pos);
    // cap
    if (arr.length > MAX_PALETTE_STOPS) {
      // Downsample uniformly
      const out = [];
      for (let i = 0; i < MAX_PALETTE_STOPS; i++) {
        const f = i / (MAX_PALETTE_STOPS - 1);
        const t = f;
        // pick closest stop
        let best = arr[0];
        let bestD = Infinity;
        for (const s of arr) {
          const d = Math.abs(s.pos - t);
          if (d < bestD) {
            bestD = d;
            best = s;
          }
        }
        out.push({ pos: clamp01(t), color: best.color });
      }
      arr = out;
    }
    return arr;
  }

  // Pack current palette into arrays for uniforms
  packToUniforms(uniforms) {
    const p = this.getCurrent();
    if (!p) return;
    const stops = this.normalizeStops(p.stops);
    const count = Math.max(2, Math.min(MAX_PALETTE_STOPS, stops.length));
    const stopArray = new Float32Array(MAX_PALETTE_STOPS);
    const colorArray = new Array(MAX_PALETTE_STOPS).fill(0).map(() => new THREE.Vector3(1, 1, 1));
    for (let i = 0; i < count; i++) {
      stopArray[i] = stops[i].pos;
      const c = toThreeColor(stops[i].color);
      colorArray[i].set(c.r, c.g, c.b);
    }
    // fill remaining using last
    for (let i = count; i < MAX_PALETTE_STOPS; i++) {
      stopArray[i] = stopArray[count - 1];
      colorArray[i].copy(colorArray[count - 1]);
    }
    if (uniforms.u_paletteStopCount) uniforms.u_paletteStopCount.value = count;
    if (uniforms.u_paletteStops) uniforms.u_paletteStops.value = stopArray;
    if (uniforms.u_paletteColors) uniforms.u_paletteColors.value = colorArray;
    if (uniforms.u_paletteInterpMode)
      uniforms.u_paletteInterpMode.value = p.interpolation === 'cosine' ? 1 : 0;
    if (uniforms.u_paletteWrapMode) {
      const wrap = String(p.wrap || 'clamp');
      uniforms.u_paletteWrapMode.value = wrap === 'repeat' ? 1 : wrap === 'mirror' ? 2 : 0;
    }
  }

  // ----- Import/Export -----
  exportPalette(name, toFile = true) {
    const p = this.customPalettes[name];
    if (!p) return null;
    const data = JSON.stringify(
      {
        type: 'fractal-palette',
        version: 1,
        name: p.name,
        interpolation: p.interpolation || 'linear',
        stops: this.normalizeStops(p.stops),
      },
      null,
      2
    );
    if (!toFile) return data;
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.name.replace(/\s+/g, '_')}.palette.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {}
    return data;
  }

  async importPaletteFromFile(file) {
    const text = await file.text();
    return this.importPaletteFromJSON(text);
  }

  importPaletteFromJSON(json) {
    try {
      const obj = JSON.parse(json);
      if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
      if (obj.type && obj.type !== 'fractal-palette') {
        // Allow importing plain arrays without type
        throw new Error('Unsupported palette type');
      }
      const name = String(obj.name || 'Imported Palette');
      const stops = this.normalizeStops(obj.stops || []);
      const record = {
        name,
        stops,
        interpolation: obj.interpolation || 'linear',
        wrap: obj.wrap || 'clamp',
        version: 1,
      };
      // If name exists, uniquify
      let final = name;
      let i = 1;
      while (this.customPalettes[final]) final = `${name} ${++i}`;
      record.name = final;
      this.customPalettes[final] = record;
      this.currentName = final;
      this.saveAll();
      return record;
    } catch (e) {
      console.warn('Failed to import palette:', e);
      throw e;
    }
  }

  // ----- Built-in duplication -----
  // Generate a custom palette approximating a built-in paletteId (0..6)
  duplicateFromBuiltIn(paletteId) {
    const id = Number(paletteId) | 0;
    if (id < 0) return null;
    // Built-ins: 0 Deep Ocean (5 stops), 1 Molten (cos), 2 Electric (cos), 3 Organic (cos), 4 Monochrome (cos), 5 Deep Abyss (5 stops), 6 Tropical Sea (5 stops)
    let name = 'From Built-in';
    let stops = [];
    let interpolation = 'linear';
    let wrap = 'repeat';

    const asHex = (v) => {
      const c = toThreeColor(v);
      return `#${c.getHexString()}`;
    };

    const gradient5 = (c1, c2, c3, c4, c5) => [
      { pos: 0.0, color: asHex(c1) },
      { pos: 0.25, color: asHex(c2) },
      { pos: 0.5, color: asHex(c3) },
      { pos: 0.75, color: asHex(c4) },
      { pos: 1.0, color: asHex(c5) },
    ];

    const cosPalette = (a, b, c, d, samples = 8) => {
      // Match IQ cosine palette: a + b * cos(2π (c t + d))
      const out = [];
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const v = this._cosPaletteSample(a, b, c, d, t);
        out.push({ pos: t, color: asHex(v) });
      }
      return out;
    };

    switch (id) {
      case 0: // Deep Ocean
        name = 'Deep Ocean (dup)';
        stops = gradient5('#071020', '#0f2959', '#155a95', '#1aa6a6', '#d9f2fa');
        interpolation = 'linear';
        wrap = 'repeat';
        break;
      case 1: // Molten Lava
        name = 'Molten Lava (dup)';
        stops = cosPalette('#805033', '#805033', '#ffff80', '#cc3300', 8);
        interpolation = 'cosine';
        wrap = 'repeat';
        break;
      case 2: // Electric
        name = 'Electric (dup)';
        stops = cosPalette('#808080', '#808080', '#ffffff', '#0055aa', 8);
        interpolation = 'cosine';
        wrap = 'repeat';
        break;
      case 3: // Organic
        name = 'Organic (dup)';
        stops = cosPalette('#66804d', '#4d6653', '#ffff80', '#336600', 8);
        interpolation = 'cosine';
        wrap = 'repeat';
        break;
      case 4: // Monochrome
        name = 'Monochrome (dup)';
        stops = cosPalette('#4d4d4d', '#666680', '#ffffff', '#00004d', 8);
        interpolation = 'cosine';
        wrap = 'repeat';
        break;
      case 5: // Deep Abyss
        name = 'Deep Abyss (dup)';
        stops = gradient5('#03050a', '#05101c', '#071f2e', '#0d3838', '#4da0bf');
        interpolation = 'linear';
        wrap = 'repeat';
        break;
      case 6: // Tropical Sea
        name = 'Tropical Sea (dup)';
        stops = gradient5('#053126', '#0c7390', '#0cbfbf', '#73e6bf', '#fafae8');
        interpolation = 'linear';
        wrap = 'repeat';
        break;
      default:
        break;
    }

    const rec = { name, stops: this.normalizeStops(stops), interpolation, wrap, version: 1 };
    // Ensure unique name
    let final = rec.name;
    let i = 1;
    while (this.customPalettes[final]) final = `${rec.name} ${++i}`;
    rec.name = final;
    this.customPalettes[final] = rec;
    this.currentName = final;
    this.saveAll();
    return rec;
  }

  _cosPaletteSample(aHex, bHex, cHex, dHex, t) {
    const a = toThreeColor(aHex);
    const b = toThreeColor(bHex);
    const c = toThreeColor(cHex);
    const d = toThreeColor(dHex);
    const twoPi = Math.PI * 2.0;
    const r = new THREE.Color();
    // For each channel: a + b * cos(2π (c t + d))
    const comp = (ai, bi, ci, di) => ai + bi * Math.cos(twoPi * (ci * t + di));
    const rr = comp(a.r, b.r, c.r, d.r);
    const gg = comp(a.g, b.g, c.g, d.g);
    const bb = comp(a.b, b.b, c.b, d.b);
    r.setRGB(clamp01(rr), clamp01(gg), clamp01(bb));
    return r;
  }

  // ----- Generic duplication -----
  duplicatePalette(name, desiredName) {
    const src = this.customPalettes[name];
    if (!src) return null;
    let base = desiredName || `${src.name} (copy)`;
    let n = base;
    let i = 1;
    while (this.customPalettes[n]) n = `${base} ${++i}`;
    const rec = {
      name: n,
      stops: this.normalizeStops(src.stops),
      interpolation: src.interpolation || 'linear',
      wrap: src.wrap || 'clamp',
      version: 1,
    };
    this.customPalettes[n] = rec;
    this.currentName = n;
    this.saveAll();
    return rec;
  }
}
