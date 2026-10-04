// Portraits for the Guest List: every photo on file, cropped square around the face and shrunk to 192px WebP,
// so the map never pulls multi-megabyte originals from Wikimedia. Skips faces already built.
import sharp from 'sharp';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadData } from './load-data.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = ROOT + 'assets/faces/';
mkdirSync(OUT, { recursive: true });
const slug = n => n.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const { PH } = loadData();
const todo = Object.entries(PH).filter(([n]) => !existsSync(OUT + slug(n) + '.webp'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url) {
  if (!/^https?:/.test(url)) return readFileSync(ROOT + url);
  for (let t = 0; t < 4; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'BollywoodReceiptsBuild/1.0 (portfolio project; static thumbnails)' } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (t + 1)); continue; }
    throw new Error(r.status + ' ' + url);
  }
  throw new Error('gave up ' + url);
}

let ok = 0; const bad = [];
for (let i = 0; i < todo.length; i += 3) {
  await Promise.all(todo.slice(i, i + 3).map(async ([n, url]) => {
    try {
      const buf = await get(url);
      // portraits put the face in the upper part of the frame: crop a square from the top third, not the middle
      const img = sharp(buf).rotate(), m = await img.metadata();
      const s = Math.min(m.width, m.height), top = m.height > m.width ? Math.round((m.height - s) * .18) : 0, left = Math.round((m.width - s) / 2);
      await img.extract({ left, top, width: s, height: s }).resize(192, 192).webp({ quality: 78 }).toFile(OUT + slug(n) + '.webp');
      ok++;
    } catch (e) { bad.push(n + ': ' + e.message); }
  }));
  await sleep(250);
}
console.log(`${ok} built, ${Object.keys(PH).length - todo.length} already there, ${bad.length} failed`);
bad.forEach(b => console.log('  ✕', b));
