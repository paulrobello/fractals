#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = 'src/shaders/includes/dec';

function readAllGLSL(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...readAllGLSL(p));
    else if (entry.isFile() && entry.name.endsWith('.glsl')) out.push(p);
  }
  return out;
}

function findAll(re, text) {
  const m = [];
  let x;
  while ((x = re.exec(text))) {
    m.push(x);
  }
  return m;
}

function analyze(file) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  const issues = [];

  const deDefs = findAll(/\bfloat\s+de\s*\(\s*vec3\b/g, src);
  if (deDefs.length > 1)
    issues.push({ code: 'DUP_DE', msg: `${deDefs.length} de(vec3) definitions` });

  // Missing semicolon after vec constructor before comment
  lines.forEach((ln, i) => {
    if (/\bvec[2-4]\s+[A-Za-z_]\w*\s*=\s*vec[2-4]\([^;\n]*\)\s*\/\//.test(ln)) {
      issues.push({
        line: i + 1,
        code: 'MISSING_SEMI_VEC',
        msg: 'Missing semicolon after vec constructor before comment',
      });
    }
  });

  // int literal in float contexts inside vec constructors
  const vecCtorInts = findAll(/\bvec([2-4])\s*\(([^)]*)\)/g, src).filter((m) =>
    /(^|[,(\s])\d+(?=($|[,)\s]))/.test(m[2])
  );
  if (vecCtorInts.length)
    issues.push({
      code: 'INT_IN_VEC',
      msg: `Integer literals in vec constructor (${vecCtorInts.length} match)`,
    });

  // float md = min(d, vec3(0)) pattern
  if (/float\s+md\s*=\s*min\(\s*\w+\s*,\s*vec[23]\(0\)\s*\)/.test(src)) {
    issues.push({
      code: 'MD_TYPE',
      msg: 'float md = min(d, vecN(0)) should be vecN md = min(d, vecN(0.0))',
    });
  }

  // min(p, vec2(0)) while p likely vec3
  if (/min\(\s*p\s*,\s*vec2\(/.test(src)) {
    issues.push({ code: 'MIN_DIM', msg: 'min(p, vec2(...)) but p is vec3; use p.xy or vec3' });
  }

  // Field out of range: map simple var decls
  const vec2Vars = findAll(/\bvec2\s+([A-Za-z_]\w*)/g, src).map((m) => m[1]);
  vec2Vars.forEach((v) => {
    if (new RegExp(`\\b${v}\\.z\\b`).test(src))
      issues.push({ code: 'FIELD_RANGE', msg: `vec2 ${v} used with .z` });
  });

  return issues;
}

const files = readAllGLSL(root);
const report = [];
for (const f of files) {
  const issues = analyze(f);
  if (issues.length) report.push({ file: f, issues });
}

if (!report.length) {
  console.log('DEC review: no obvious syntax/type issues found.');
  process.exit(0);
}
console.log('DEC review findings:');
for (const r of report) {
  console.log(`\n- ${r.file}`);
  for (const it of r.issues) {
    console.log(`  * ${it.code}${it.line ? `@${it.line}` : ''}: ${it.msg}`);
  }
}
