#!/usr/bin/env node
// Extracts DEC SDF snippets into GLSL include files under src/shaders/includes/dec/
// Does not modify existing shaders; purely generates include files for future use.
import fs from 'fs';
import path from 'path';

const SRC_JSON = 'docs/research/raw/DECentries.json';
const OUT_ROOT = 'src/shaders/includes/dec';
const PAGE_URL = 'https://jbaker.graphics/writings/DEC.html';
const RETRIEVED = new Date().toISOString().slice(0, 10);

function readJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/--+/g, '-');
}

function sanitizeCode(code) {
  if (!code) return '';
  // Normalize line endings and strip leading/trailing blank lines
  let s = code.replace(/\r\n?/g, '\n');
  // Some entries have stray non-ASCII or BOMs; remove control chars except tabs/newlines
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  // Ensure a trailing newline for POSIX-friendly files
  if (!s.endsWith('\n')) s += '\n';
  return s;
}

function makeHeader({ title, author, category, sourcePath }) {
  return (
    `// DEC SDF: ${title}\n` +
    `// Category: ${category} | Author: ${author}\n` +
    `// Source: Distance Estimator Compendium (DEC) — ${PAGE_URL}\n` +
    `// License: CC BY-NC-SA 3.0 (see DEC page)\n` +
    `// Retrieved: ${RETRIEVED}\n` +
    `// File: ${sourcePath}\n` +
    `// Note: This snippet may require adaptation for GLSL 3.00 ES.\n` +
    `// It is not included in any shader by default.\n\n`
  );
}

function writeIfChanged(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    const prev = fs.readFileSync(filePath, 'utf8');
    if (prev === contents) return false;
  }
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

function buildFilePath(category, title, used) {
  const base = slugify(title) || 'unnamed';
  const cat = slugify(category) || 'misc';
  let name = base;
  let idx = 2;
  while (used.has(`${cat}/${name}.glsl`)) {
    name = `${base}-${idx++}`;
  }
  const rel = path.join('dec', cat, `${name}.glsl`);
  used.add(`${cat}/${name}.glsl`);
  return rel; // relative to includes root
}

function splitTitleAndBody(entryCode) {
  const raw = entryCode || '';
  const norm = raw.replace(/\r\n?/g, '\n');
  const firstNl = norm.indexOf('\n');
  if (firstNl === -1) return { title: norm.trim(), body: '' };
  const title = norm.slice(0, firstNl).trim();
  const body = norm.slice(firstNl + 1).trimStart();
  return { title, body };
}

function main() {
  const src = readJson(SRC_JSON);
  const entries = Array.isArray(src.entries) ? src.entries : [];
  const outRootAbs = path.resolve(OUT_ROOT);
  fs.mkdirSync(outRootAbs, { recursive: true });

  const used = new Set();
  const manifest = [];
  let written = 0;

  for (const e of entries) {
    const category = e.category || 'misc';
    const { title, body } = splitTitleAndBody(e.code || '');
    const fileRel = buildFilePath(category, title, used); // dec/<cat>/<slug>.glsl
    const includeRelFromIncludes = `./includes/${fileRel}`; // how it would be referenced
    const outAbs = path.join('src/shaders/includes', fileRel);

    const header = makeHeader({
      title,
      author: e.author || 'Unknown',
      category,
      sourcePath: includeRelFromIncludes,
    });
    const content = header + sanitizeCode(body);
    const changed = writeIfChanged(outAbs, content);
    if (changed) written++;

    manifest.push({
      title,
      author: e.author || 'Unknown',
      category,
      include: includeRelFromIncludes,
      image: e.image || '',
    });
  }

  // Write a small manifest for later browsing (not used by runtime unless imported explicitly)
  const manifestPath = path.resolve('src/shaders/includes/dec/manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      { page: PAGE_URL, retrieved: RETRIEVED, count: manifest.length, entries: manifest },
      null,
      2
    )
  );

  console.error(
    `Wrote/updated ${written} GLSL includes to ${OUT_ROOT} (total entries: ${manifest.length}).`
  );
}

main();
