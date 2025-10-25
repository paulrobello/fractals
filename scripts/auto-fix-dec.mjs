#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = 'src/shaders/includes/dec';

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.glsl')) out.push(p);
  }
  return out;
}

function fixVecCtorInts(text) {
  return text.replace(/\bvec([2-4])\s*\(([^)]*)\)/g, (m, dim, args) => {
    const fixed = args.replace(
      /(^|[,(\s])(-?\d+)(?=($|[,)\s]))/g,
      (mm, pre, num) => `${pre}${num}.0`
    );
    return `vec${dim}(${fixed})`;
  });
}

function fixMissingSemicolonAfterVec(text) {
  return text.replace(
    /(vec[2-4]\s+[A-Za-z_]\w*\s*=\s*vec[2-4]\([^;\n]*\))\s*(\/\/[^\n]*)?$/gm,
    (m, stmt, comment) => `${stmt}; ${comment || ''}`
  );
}

function fixMdType(text) {
  return text.replace(
    /float\s+md\s*=\s*min\(\s*d\s*,\s*vec([23])\(0\.0\)\s*\)\s*;/g,
    (m, n) => `vec${n} md = min(d, vec${n}(0.0));`
  );
}

function fixMinDimP(text) {
  // min(p, vec2(...)) -> min(p.xy, vec2(...)) when p likely vec3
  return text.replace(/min\(\s*p\s*,\s*vec2\(/g, 'min(p.xy, vec2(');
}

function fix(text) {
  let t = text;
  const before = t;
  t = fixVecCtorInts(t);
  t = fixMissingSemicolonAfterVec(t);
  t = fixMdType(t);
  t = fixMinDimP(t);
  return t === before ? null : t;
}

const files = walk(root);
let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const out = fix(src);
  if (out != null) {
    fs.writeFileSync(f, out, 'utf8');
    changed++;
  }
}
console.log(`Auto-fix complete. Files changed: ${changed}`);
