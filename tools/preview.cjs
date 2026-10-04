// dev aid: draws assets/world.json to a PNG so the layout can be judged without the site
const vm=require('vm'),fs=require('fs'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/../assets/world-data.js','utf8'),ctx);const W=ctx.window.WORLD,sharp=require('sharp');const ks=[...new Set(W.people.map(p=>p.k).filter(Boolean))];
const col=k=>k?'hsl('+(ks.indexOf(k)*360/ks.length)+',70%,55%)':'#666';
let s='<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="-1300 -1300 2600 2600"><rect x="-1300" y="-1300" width="2600" height="2600" fill="#120807"/>';
W.people.forEach(p=>s+=`<circle cx="${p.x}" cy="${p.y}" r="${p.t==0?14:p.t==1?7:3.5}" fill="${col(p.k)}"/>`+(p.t==0?`<text x="${p.x}" y="${p.y-18}" fill="#fff" font-size="22" text-anchor="middle">${p.n}</text>`:''));
W.khandaans.forEach(k=>s+=`<text x="${k.x}" y="${k.y}" fill="${col(k.k)}" font-size="36" font-weight="bold" text-anchor="middle" opacity=".8">${k.t}</text>`);
sharp(Buffer.from(s+'</svg>')).png().toFile(process.argv[2]).then(()=>console.log('ok'));
