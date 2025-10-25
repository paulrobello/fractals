// Utility helpers for config defaults and minimal override persistence
// Build a compact overrides object by diffing current values against DEFAULTS.

function isNumber(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

function approxEqual(a, b, eps = 1e-6) {
  if (isNumber(a) && isNumber(b)) return Math.abs(a - b) <= eps;
  return a === b;
}

// Returns a shallow overrides object containing only keys that differ from defaults.
export function buildOverrides(current, defaults, { epsilon = 1e-6 } = {}) {
  const out = {};
  if (!current || !defaults) return out;
  for (const key of Object.keys(defaults)) {
    const dv = defaults[key];
    // Only consider primitive and plain JSON-serializable values.
    const cv = current[key];
    if (cv === undefined) continue;
    if (!approxEqual(cv, dv, epsilon)) {
      out[key] = cv;
    }
  }
  return out;
}

// Apply overrides onto a target object. Only keys present in overrides are set.
// Map of legacy → current key names (extend as needed)
const DEFAULT_ALIASES = {
  stepSize: 'stepRelaxation',
  enableDither: 'enableDithering',
  blueNoiseEnabled: 'useBlueNoise',
  paletteId: 'palette',
  aoMin: 'aoMinSamples',
  shadowMin: 'softShadowMinSteps',
  budgetFarFactor: 'budgetStepsFarFactor',
  frustumHysteresisFrames: 'frustumDropHysteresisFrames',
  lightX: 'lightPosX',
  lightY: 'lightPosY',
  lightZ: 'lightPosZ',
};

export function sanitizeOverrides(overrides, defaults, aliases = DEFAULT_ALIASES) {
  if (!overrides || !defaults) return {};
  const out = {};
  const unknown = [];
  for (const rawKey of Object.keys(overrides)) {
    const key = aliases[rawKey] || rawKey;
    if (!(key in defaults)) {
      unknown.push(rawKey);
      continue;
    }
    const dv = defaults[key];
    let v = overrides[rawKey];
    // Type-safe coercion where reasonable
    if (typeof dv === 'number') {
      if (typeof v === 'string') {
        const n = parseFloat(v);
        if (!Number.isNaN(n)) v = n;
        else continue;
      } else if (typeof v === 'boolean') {
        v = v ? 1 : 0;
      }
      if (!Number.isFinite(v)) continue;
    } else if (typeof dv === 'boolean') {
      if (typeof v === 'string') {
        v = v.toLowerCase() === 'true' || v === '1';
      } else {
        v = !!v;
      }
    } else if (typeof dv === 'string') {
      v = String(v);
    }
    out[key] = v;
  }
  if (unknown.length) {
    try {
      console.info('Ignoring unknown override keys:', unknown);
    } catch (_) {}
  }
  return out;
}

// Apply overrides onto a target object. If `defaults` is provided,
// unknown keys are ignored and values are coerced to default types.
export function applyOverrides(target, overrides, defaults) {
  if (!target || !overrides) return target;
  const src = defaults ? sanitizeOverrides(overrides, defaults) : overrides;
  for (const key of Object.keys(src)) {
    target[key] = src[key];
  }
  return target;
}

// Storage helpers
const STORAGE_KEY = 'fractalExplorer_overrides_v1';

export function loadOverridesFromStorage(storage = window?.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') return obj;
  } catch (_) {}
  return null;
}

export function saveOverridesToStorage(overrides, storage = window?.localStorage) {
  try {
    if (!overrides || Object.keys(overrides).length === 0) {
      storage.removeItem(STORAGE_KEY);
    } else {
      storage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }
  } catch (_) {}
}

export function hasOverridesInStorage(storage = window?.localStorage) {
  try {
    return !!storage.getItem(STORAGE_KEY);
  } catch (_) {
    return false;
  }
}

export const OVERRIDES_STORAGE_KEY = STORAGE_KEY;
