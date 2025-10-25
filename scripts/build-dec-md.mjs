#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const basePageUrl = 'https://jbaker.graphics/writings/DEC.html';
const baseUrl = new URL(basePageUrl);

const htmlPath = path.resolve('docs/research/raw/DEC.html');
const jsonPath = path.resolve('docs/research/raw/DECentries.json');
const outPath = path.resolve('docs/research/DEC.md');
const assetsDir = path.resolve('docs/research/DEC_assets');

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function absolutizeHref(href) {
  try {
    return new URL(href, basePageUrl).href;
  } catch {
    return href; // leave as-is if invalid
  }
}

function htmlToInlineMd(html) {
  if (!html) return '';
  // links
  html = html.replace(/<a\s+href="([^"]+)">([\s\S]*?)<\/a>/g, (_, href, text) => {
    return `[${decodeEntities(text).trim()}](${absolutizeHref(href)})`;
  });
  // inline code
  html = html.replace(/<code>([\s\S]*?)<\/code>/g, (_, code) => {
    const clean = decodeEntities(code).replace(/`/g, '\\`');
    return '`' + clean + '`';
  });
  // basic tag removals
  html = html.replace(/<\/?p>/g, '').replace(/<br\s*\/?>(\n)?/g, '\n');
  // strip any remaining tags
  html = html.replace(/<[^>]+>/g, '');
  return decodeEntities(html).replace(/\s+\n/g, '\n').trim();
}

function extractBetween(html, startRe, endRe) {
  const start = html.search(startRe);
  if (start === -1) return '';
  const after = html.slice(start);
  const endIdx = endRe ? after.search(endRe) : -1;
  const chunk = endIdx !== -1 ? after.slice(0, endIdx) : after;
  return chunk;
}

function extractIntro(html) {
  // capture the div with margin 25px following the Introduction header, up to the next nested 30px div
  const block = extractBetween(
    html,
    /<a id="introduction"><\/a><h2>Introduction<\/h2>[\s\S]*?<div style='margin: 0px 0px 0px 25px'>/,
    /<div style='margin: 0px 0px 0px 30px'>/
  );
  const paras = [...block.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((m) => htmlToInlineMd(m[1]))
    .filter(Boolean);
  return paras.join('\n\n');
}

function extractLicensing(html) {
  const block = extractBetween(
    html,
    /<a id="licensing"><\/a><h2>Licensing<\/h2>[\s\S]*?<div style='margin: 0px 0px 0px 25px'>/,
    /<\/div>\s*<\/div>\s*<\/div>/
  );
  const paras = [...block.matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((m) => htmlToInlineMd(m[1]))
    .filter(Boolean);
  return paras.join('\n\n');
}

function extractLastUpdated(html) {
  const m = html.match(/Last updated\s*([0-9/]+)/i);
  return m ? m[1] : null;
}

function groupEntries(entries) {
  const groups = { primitive: [], operator: [], fractal: [], composed: [] };
  for (const e of entries) {
    if (groups[e.category]) groups[e.category].push(e);
  }
  // stable sort by title then author
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const aTitle = (a.code.split('\n')[0] || '').toLowerCase();
      const bTitle = (b.code.split('\n')[0] || '').toLowerCase();
      if (aTitle !== bTitle) return aTitle < bTitle ? -1 : 1;
      const aAuth = (a.author || '').toLowerCase();
      const bAuth = (b.author || '').toLowerCase();
      return aAuth < bAuth ? -1 : aAuth > bAuth ? 1 : 0;
    });
  }
  return groups;
}

function toImageUrl(rel) {
  if (!rel) return '';
  try {
    return new URL(rel, baseUrl).href;
  } catch {
    return rel;
  }
}

function buildCategorySection(title, entries, options = {}) {
  const { useLocalImages = false, imageMap = new Map() } = options;
  const count = entries.length;
  let md = `\n\n## ${title} (${count} entries)`;
  for (const e of entries) {
    const lines = (e.code || '').split('\n');
    const entryTitle = (lines.shift() || '').trim();
    const body = lines.join('\n').trim();
    const absoluteUrl = toImageUrl(e.image || '');
    const imageUrl =
      useLocalImages && imageMap.get(absoluteUrl) ? imageMap.get(absoluteUrl).rel : absoluteUrl;
    md += `\n\n### ${entryTitle} — ${e.author || 'Unknown'}`;
    if (imageUrl) {
      md += `\n\n![${entryTitle}](${imageUrl})`;
    }
    if (body) {
      // prefer glsl highlighting
      md += `\n\n\`\`\`glsl\n${body}\n\`\`\``;
    }
  }
  return md;
}

import https from 'https';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return resolve('cached');
      ensureDir(path.dirname(dest));
      const file = fs.createWriteStream(dest);
      https
        .get(url, (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            // follow one redirect
            https.get(res.headers.location, (r2) => r2.pipe(file)).on('error', reject);
            file.on('finish', () => file.close(() => resolve('ok')));
            return;
          }
          if ((res.statusCode || 0) >= 400) {
            file.close(() =>
              fs.unlink(dest, () => reject(new Error(`HTTP ${res.statusCode} for ${url}`)))
            );
            return;
          }
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve('ok')));
        })
        .on('error', (err) => {
          file.close(() => fs.unlink(dest, () => reject(err)));
        });
    } catch (e) {
      reject(e);
    }
  });
}

async function mirrorImages(entries) {
  const imageMap = new Map();
  const jobs = [];
  for (const e of entries) {
    const absoluteUrl = toImageUrl(e.image || '');
    if (!absoluteUrl) continue;
    try {
      const urlObj = new URL(absoluteUrl);
      // keep path after '/writings/' if present, else whole pathname
      const ix = urlObj.pathname.indexOf('/writings/');
      const sub =
        ix >= 0
          ? urlObj.pathname.slice(ix + '/writings/'.length)
          : urlObj.pathname.replace(/^\/+/, '');
      const localPath = path.join(assetsDir, sub);
      const rel = path.relative(path.dirname(outPath), localPath).split(path.sep).join('/');
      imageMap.set(absoluteUrl, { localPath, rel });
      jobs.push({ url: absoluteUrl, dest: localPath });
    } catch {
      /* ignore invalid urls */
    }
  }

  // limit concurrency
  const concurrency = 10;
  let idx = 0;
  async function worker() {
    while (idx < jobs.length) {
      const j = jobs[idx++];
      try {
        await downloadFile(j.url, j.dest);
        process.stderr.write(`downloaded: ${j.url}\n`);
      } catch (e) {
        process.stderr.write(`failed: ${j.url} -> ${e.message}\n`);
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, worker);
  await Promise.all(workers);
  return imageMap;
}

async function main() {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const srcJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const entries = Array.isArray(srcJson.entries) ? srcJson.entries : [];

  const intro = extractIntro(html);
  const licensing = extractLicensing(html);
  const lastUpdated = extractLastUpdated(html);
  const retrieved = new Date().toISOString().slice(0, 10);

  const groups = groupEntries(entries);

  const args = process.argv.slice(2);
  const useLocalImages = args.includes('--mirror-images') || args.includes('--mirror');
  let imageMap = new Map();
  if (useLocalImages) {
    ensureDir(assetsDir);
    imageMap = await mirrorImages(entries);
  }

  let md = '';
  md += `# Distance Estimator Compendium (DEC)\n`;
  md += `\n- Source: ${basePageUrl}`;
  if (lastUpdated) md += `\n- Page last updated: ${lastUpdated}`;
  md += `\n- Retrieved: ${retrieved}`;
  if (useLocalImages) md += `\n- Assets: ./${path.basename(assetsDir)}`;

  if (intro) {
    md += `\n\n## Introduction\n\n${intro}`;
  }

  md += `\n\n## Contents\n`;
  md += `\n- [Primitives](#primitives-${groups.primitive.length}-entries)`;
  md += `\n- [Operators](#operators-${groups.operator.length}-entries)`;
  md += `\n- [Fractals](#fractals-${groups.fractal.length}-entries)`;
  md += `\n- [Composed Shapes](#composed-shapes-${groups.composed.length}-entries)`;

  const sectOpts = { useLocalImages, imageMap };
  md += buildCategorySection('Primitives', groups.primitive, sectOpts);
  md += buildCategorySection('Operators', groups.operator, sectOpts);
  md += buildCategorySection('Fractals', groups.fractal, sectOpts);
  md += buildCategorySection('Composed Shapes', groups.composed, sectOpts);

  if (licensing) {
    md += `\n\n## Licensing\n\n${licensing}`;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, 'utf8');
  console.error(`Wrote ${outPath}`);
}

main();
