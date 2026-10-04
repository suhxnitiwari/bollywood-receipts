// Runs the site's own data scripts in a headless DOM and hands back the graph they build,
// so the offline build always sees exactly what the browser sees.
import { JSDOM } from 'jsdom';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function loadData() {
  const dom = new JSDOM(`<!doctype html><body data-page="world"><div id="top"></div><dialog id="rx"><article id="rxin"></article></dialog></body>`,
    { runScripts: 'outside-only', url: 'http://localhost/' });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  w.HTMLCanvasElement.prototype.getContext = () => null;
  const ctx = dom.getInternalVMContext(), run = src => new vm.Script(src).runInContext(ctx);   // real scripts, so top-level consts are shared like in a browser
  for (const f of ['casefiles.js', 'files.js', 'movies.js', 'site.js']) {
    try { run(readFileSync(ROOT + 'assets/' + f, 'utf8')); }
    catch (e) { if (f !== 'site.js' || !w.__G) throw e; }   // late DOM code in site.js may trip; the graph is built by then
  }
  return JSON.parse(run(`JSON.stringify({G:window.__G,GSRC:window.__GSRC,GFILMS:window.__GFILMS,NAMES:window.__NAMES,PH,FAMS})`));
}
