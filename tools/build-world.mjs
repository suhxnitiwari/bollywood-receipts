// The Guest List, laid out once, offline. The browser never runs physics: it reads assets/world.json.
// Personal rishtas (family, marriage, romance, friendship, feud) pull hard; shared films barely pull,
// so the map shows khandaans and circles instead of one ball of co-stars.
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import fa2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadData } from './load-data.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { G, GSRC, GFILMS, NAMES, PH, FAMS } = loadData();
const slug = n => n.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// seeded random, so a rebuild with the same data gives the same map
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- khandaans: who belongs to which house, and which generation ----------
const house = {}, gen = {};
FAMS.forEach(f => {
  const walk = (node, g) => {
    node.p.forEach((n, i) => {
      if (!NAMES.includes(n)) return;
      // the first name in a couple is the bloodline; spouses only join a house nobody else claimed
      if (i === 0 && (!house[n] || house[n].spouse)) { house[n] = { k: f.k }; gen[n] = g; }
      else if (!house[n]) { house[n] = { k: f.k, spouse: true }; gen[n] = g; }
    });
    node.k.forEach(c => walk(c, g + 1));
  };
  f.r.forEach(r => walk(r, 0));
});

// ---------- weights: how hard each kind of rishta pulls two people together ----------
const PULL = { m: 6, d: 4, e: 3, f: 7, x: 2.5, r: 1.2, b: 2, v: 1, k: .4, g: .5, s: .3, c: .2, o: .04, q: .03 };
const graph = new Graph({ type: 'undirected' });
NAMES.forEach(n => graph.addNode(n));
const personal = {}, films = {};
NAMES.forEach(n => { personal[n] = 0; films[n] = new Set(); });
G.forEach((e, i) => {
  const [a, b, t] = e; if (a === b) return;
  const film = !!GSRC[i];
  if (film) (GFILMS[i] || []).forEach(f => { films[a].add(f); films[b].add(f); });
  else { personal[a]++; personal[b]++; }
  // repeat collaborators count for more, up to a point
  const w = film ? PULL[t] * Math.min(4, (GFILMS[i] || [1]).length) : PULL[t];
  if (graph.hasEdge(a, b)) graph.updateEdgeAttribute(a, b, 'weight', x => x + w);
  else graph.addEdge(a, b, { weight: w });
});

// ---------- first year on the scene: earliest dated rishta; family with no dates inherit their relatives' ----------
const first = {};
G.forEach(e => { if (e[4] && e[4] >= 1930) for (const n of [e[0], e[1]]) first[n] = Math.min(first[n] ?? 9999, e[4]); });
for (let pass = 0; pass < 3; pass++) NAMES.forEach(n => {
  if (first[n]) return;
  const ys = graph.neighbors(n).map(o => first[o]).filter(Boolean);
  if (ys.length) first[n] = Math.min(...ys);
});

// ---------- gravity: who holds Bollywood together. Gossip counts more than filmographies ----------
const score = {};
NAMES.forEach(n => { score[n] = personal[n] * 2 + Math.sqrt(films[n].size) * 3 + (PH[n] ? 4 : 0); });
const ranked = [...NAMES].sort((a, b) => score[b] - score[a]);
const tier = {}; ranked.forEach((n, i) => { tier[n] = i < 24 ? 0 : i < 130 ? 1 : 2; });

// ---------- circles: Louvain on the weighted graph ----------
const comm = louvain(graph, { getEdgeWeight: 'weight', resolution: 1.1, rng: rnd });

// ---------- seat everyone: houses start at their own tables, then the forces settle the room ----------
const keys = FAMS.map(f => f.k);
const anchor = {};
keys.forEach((k, i) => { const a = i * 2.39996, r = 150 * Math.sqrt(i + 1); anchor[k] = [Math.cos(a) * r, Math.sin(a) * r]; });
graph.forEachNode(n => {
  const h = house[n] && anchor[house[n].k];
  const [x, y] = h ? h : [(rnd() - .5) * 1600, (rnd() - .5) * 1600];
  graph.mergeNodeAttributes(n, { x: x + (rnd() - .5) * 120, y: y + (rnd() - .5) * 120, size: 4 + (2 - tier[n]) * 5 });
});
fa2.assign(graph, { iterations: 1600, getEdgeWeight: 'weight', settings: { linLogMode: true, gravity: 1, scalingRatio: 5, barnesHutOptimize: true, edgeWeightInfluence: .9, slowDown: 4 } });
noverlap.assign(graph, { maxIterations: 300, settings: { margin: 3, ratio: 1.1 } });

// normalise into a world about 2000 units across, centred on the bulk of the room
const xs = graph.mapNodes((n, a) => a.x).sort((a, b) => a - b), ys = graph.mapNodes((n, a) => a.y).sort((a, b) => a - b);
const q = (arr, p) => arr[Math.floor(arr.length * p)];
const cx = q(xs, .5), cy = q(ys, .5), span = Math.max(q(xs, .97) - q(xs, .03), q(ys, .97) - q(ys, .03));
const K = 1800 / span;
// pull the far-flung houses in a little so the room has no empty moat: radius r becomes 900·(r/900)^0.75
const pos = {}; graph.forEachNode((n, a) => {
  const x = (a.x - cx) * K, y = (a.y - cy) * K, r = Math.hypot(x, y) || 1, r2 = 900 * Math.pow(r / 900, .75);
  pos[n] = [Math.round(x / r * r2), Math.round(y / r * r2)];
});

// ---------- labels for the room: houses first, then the biggest unclaimed circles ----------
const centroid = ns => { const m = [0, 0]; ns.forEach(n => { m[0] += pos[n][0]; m[1] += pos[n][1]; }); return m.map(v => Math.round(v / ns.length)); };
const khandaans = FAMS.map(f => {
  const ns = NAMES.filter(n => house[n] && house[n].k === f.k && !house[n].spouse);
  if (ns.length < 3) return null;
  // a big house can split into branches across the room: label it at its densest knot, not its average
  const near = n => ns.filter(o => Math.hypot(pos[o][0] - pos[n][0], pos[o][1] - pos[n][1]) < 140);
  const core = near(ns.slice().sort((a, b) => near(b).length - near(a).length)[0]), c = centroid(core);
  const r = Math.round(Math.max(40, ...core.map(n => Math.hypot(pos[n][0] - c[0], pos[n][1] - c[1]))));
  return { k: f.k, t: f.t, x: c[0], y: c[1], r, n: ns.length };
}).filter(Boolean);
const byComm = {}; NAMES.forEach(n => (byComm[comm[n]] ??= []).push(n));
const circles = Object.values(byComm).filter(ns => ns.length >= 14).map(ns => {
  const houses = ns.filter(n => house[n] && !house[n].spouse).length;
  if (houses / ns.length > .25) return null;   // a house already names this corner of the room
  const lead = ns.slice().sort((a, b) => score[b] - score[a])[0];
  const yrs = ns.map(n => first[n]).filter(Boolean).sort((a, b) => a - b), med = yrs[Math.floor(yrs.length / 2)];
  return { t: `${lead.split(' ')[0]}'s circle`, era: med ? Math.floor(med / 10) * 10 : null, x: centroid(ns)[0], y: centroid(ns)[1], n: ns.length };
}).filter(Boolean);

// ---------- out ----------
const people = NAMES.map(n => {
  const face = PH[n] && existsSync(ROOT + `assets/faces/${slug(n)}.webp`) ? slug(n) : null;
  return {
    n, x: pos[n][0], y: pos[n][1], t: tier[n], s: Math.round(score[n] * 10) / 10,
    pd: personal[n], fd: films[n].size, c: comm[n],
    ...(house[n] ? { k: house[n].k, ...(house[n].spouse ? { sp: 1 } : {}), g: gen[n] } : {}),
    ...(first[n] ? { yr: first[n] } : {}), ...(face ? { f: face } : {}),
  };
});
// a plain script, not JSON, so the page also opens straight from disk with no fetch
writeFileSync(ROOT + 'assets/world-data.js', '// built by tools/build-world.mjs, do not edit by hand\nwindow.WORLD=' + JSON.stringify({ built: new Date().toISOString().slice(0, 10), people, khandaans, circles }) + ';\n');
console.log(`${people.length} people · ${people.filter(p => p.f).length} faces · ${khandaans.length} khandaans · ${circles.length} circles · ${new Set(Object.values(comm)).size} communities`);
console.log('front row:', ranked.slice(0, 24).join(', '));
