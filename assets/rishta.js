/* ---------- Yeh Rishta Kya Kehlata Hai? ----------
   Pick any two people on the board. The shortest chain between them is pinned through 3D space, read out as one
   sentence ("Deepika is Alia's spouse's ex"), and every hop carries its receipt. Everyone they touch floats around them. */
(function(){
const G=window.__G||[],SRC=window.__GSRC||{},GF=window.__GFILMS||{},MV=new Map((window.MOVIES||[]).map(m=>[m[0],m]));
const ph=n=>(typeof PH!=='undefined'&&PH[n])||null;
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const enc=encodeURIComponent,$=s=>document.querySelector(s);
const ADJ={};G.forEach((e,i)=>{(ADJ[e[0]]??=[]).push([e[1],i]);(ADJ[e[1]]??=[]).push([e[0],i])});
const NAMES=Object.keys(ADJ).sort((a,b)=>a.localeCompare(b));
const DEG=Object.fromEntries(NAMES.map(n=>[n,ADJ[n].length]));
// strongest ties: family, marriage and real co-starring cost the least; cameos, songs and rumors cost more
const WT={m:1,d:1,f:1,e:1.1,x:1.1,b:1.2,v:1.4,k:1.6,g:2.2,s:2,o:1.3,q:1.7,r:1.6};
function cost(i,o){if(o.fast)return 1;const e=G[i],t=e[2];
  if(t==='c'){if((GF[i]||[]).length>1)return .8;if(!SRC[i])return 1.2;const d=e[3]||'';return /\(writer/.test(d)?1.2:/\(producer/.test(d)?1.1:1}
  return WT[t]||2}
const COL={o:'#9C8F7C',q:'#B0186B',m:'#6B1E5A',d:'#8C5A7E',e:'#4A3B6E',x:'#4A3B6E',r:'#A8740F',c:'#7E7262',f:'#15110E',b:'#2E7D6B',v:'#C8261C',k:'#D94A6E',g:'#1F5F8B',s:'#B05A00'};
const KIND={o:'cameo in the same film',q:'song appearance in the same film',m:'married',d:'married, then split',e:'engaged',x:'dated',r:'rumored',c:'worked together',f:'family',b:'friends',v:'feud',k:'on-screen kiss',g:'glam team',s:'replaced in a film'};
const STAMP={t:['RECEIPT ✓','v-true'],a:['ALLEGED ?','v-alleged'],r:['RUMOR ~','v-rumor'],c:['FAUX ✕','v-cap']};
const first=n=>({'Shah Rukh Khan':'SRK'})[n]||n.split(' ')[0];

/* ---------- what is this rishta called? one role per hop, read from the first person outward ---------- */
function role(i){const e=G[i],t=e[2],d=(e[3]||'').toLowerCase();
  if(t==='f'){if(/sibling|brother|sister/.test(d))return 'sibling';if(/cousin/.test(d))return 'cousin';if(/uncle|aunt|niece|nephew/.test(d))return 'relative';return 'family'}
  if(t==='c')return SRC[i]?(/\((director|producer)/.test(e[3]||'')?'collaborator':'co-star'):'collaborator';
  return {o:'cameo co-star',q:'song co-star',m:'spouse',d:'ex-spouse',e:'ex-fiancé(e)',x:'ex',r:'rumored flame',b:'friend',v:'rival',k:'on-screen kiss',g:'glam team',s:'casting replacement'}[t]||'link'}
function sentence(a,b,p){if(!p.length)return '';const rs=p.map(([,i])=>role(i));
  if(rs.length===1)return `${esc(first(b))} is ${esc(first(a))}'s ${rs[0]}.`;
  if(rs.length<=6)return `${esc(first(b))} is ${esc(first(a))}'s ${rs.map(esc).join("'s ")}.`;
  return `${esc(first(a))} → ${rs.map(esc).join(' → ')} → ${esc(first(b))}.`}
const CLOSE=['Same person','Seedha rishta: directly linked','Ghar ki baat: two steps','Mohalle ka rishta: three steps','Door ke rishtedaar: four steps','Bahut door ka rishta: five steps','Six degrees, exactly','Seven: the edge of the board'];

/* ---------- routes: weighted shortest chain, with filters and alternates ---------- */
function route(a,b,o={},ban=new Set(),banE=new Set()){const dist={[a]:0},prev={},done=new Set();
  while(true){let u=null,best=Infinity;for(const k in dist)if(!done.has(k)&&dist[k]<best){best=dist[k];u=k}
    if(u===null)return null;if(u===b)break;done.add(u);
    for(const [v,i] of ADJ[u]){if(ban.has(v)&&v!==b)continue;if(banE.has(i))continue;const e=G[i];
      if(o.fam&&!'fmd'.includes(e[2]))continue;if(o.clean&&(e[5]!=='t'||e[2]==='r'))continue;if(o.nofilm&&SRC[i])continue;
      if(!o.rum&&(e[2]==='r'||e[5]==='r'||e[5]==='c'))continue;
      const nd=dist[u]+cost(i,o);if(dist[v]===undefined||nd<dist[v]){dist[v]=nd;prev[v]=[u,i]}}}
  const out=[];let c=b;while(c!==a){const [p,i]=prev[c];out.unshift([p,i,c]);c=p}return out}
function routes(a,b,o){const best=route(a,b,o);if(!best)return [];const all=[best],sig=r=>r.map(x=>x[2]).join('>');const seen=new Set([sig(best)]);
  best.slice(0,-1).forEach(([,,mid])=>{const r=route(a,b,o,new Set([mid]));if(r&&!seen.has(sig(r))){seen.add(sig(r));all.push(r)}});
  // directly linked? then also show the long way round, through somebody else
  if(best.length===1){const r=route(a,b,o,new Set(),new Set(ADJ[a].filter(([v])=>v===b).map(([,i])=>i)));if(r)all.push(r)}
  return all.sort((x,y)=>x.length-y.length).slice(0,3)}

/* ---------- picker: a face-search combobox ---------- */
function picker(root,slot,onPick){const inp=root.querySelector('input'),list=root.querySelector('ul'),face=root.querySelector('.rp-face');let opts=[],act=-1;
  const show=n=>{face.innerHTML=n?(ph(n)?`<img src="${esc(ph(n))}" alt="">`:`<span>${esc(n.slice(0,2))}</span>`):'<span>?</span>'};
  const close=()=>{list.hidden=true;inp.setAttribute('aria-expanded','false');act=-1};
  const draw=()=>{const q=inp.value.trim().toLowerCase();opts=(q?NAMES.filter(n=>n.toLowerCase().includes(q)).sort((x,y)=>(y.toLowerCase().startsWith(q)-x.toLowerCase().startsWith(q))||DEG[y]-DEG[x]):NAMES.slice().sort((x,y)=>DEG[y]-DEG[x])).slice(0,8);
    list.innerHTML=opts.length?opts.map((n,i)=>`<li role="option" id="${slot}-o${i}" aria-selected="${i===act}" data-n="${esc(n)}">${ph(n)?`<img src="${esc(ph(n))}" alt="" loading="lazy">`:`<span class="ini">${esc(n.slice(0,2))}</span>`}<b>${esc(n)}</b><i>${DEG[n]} rishtas</i></li>`).join(''):'<li class="none">No one by that name on the board yet</li>';
    list.hidden=false;inp.setAttribute('aria-expanded','true');inp.setAttribute('aria-activedescendant',act>=0?`${slot}-o${act}`:'')};
  inp.addEventListener('input',()=>{act=-1;draw()});inp.addEventListener('focus',()=>{inp.select();draw()});
  inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){act=Math.min(opts.length-1,act+1);draw();e.preventDefault()}else if(e.key==='ArrowUp'){act=Math.max(0,act-1);draw();e.preventDefault()}
    else if(e.key==='Enter'){e.preventDefault();const n=opts[act>=0?act:0];if(n){set(n);onPick()}}else if(e.key==='Escape')close()});
  list.addEventListener('mousedown',e=>{const li=e.target.closest('li[data-n]');if(!li)return;e.preventDefault();set(li.dataset.n);onPick()});
  document.addEventListener('click',e=>{if(!root.contains(e.target))close()});
  const set=n=>{inp.value=n;show(n);close()};
  return {get:()=>NAMES.find(n=>n===inp.value)||NAMES.find(n=>n.toLowerCase()===inp.value.trim().toLowerCase())||null,set}}

/* ---------- the 3D web ---------- */
const box=$('#rw3d');let needFit=false,Graph=null,data={nodes:[],links:[]},onPath=new Set(),pathLinks=new Set(),touring=false;
const texCache=new Map();
function faceTex(n,big){const key=n+'|'+big;if(texCache.has(key))return texCache.get(key);const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d');
  const paint=img=>{x.clearRect(0,0,160,160);x.save();x.beginPath();x.arc(80,80,70,0,7);x.closePath();x.clip();x.fillStyle='#E6D8BF';x.fillRect(0,0,160,160);
    if(img){const r=Math.max(160/img.width,160/img.height),w=img.width*r,h=img.height*r;x.drawImage(img,(160-w)/2,Math.min(0,(160-h)*.15),w,h)}
    else{x.fillStyle='#15110E';x.font='700 54px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.fillText(n.split(' ').map(w=>w[0]).slice(0,2).join(''),80,84)}
    x.restore();x.lineWidth=big?10:7;x.strokeStyle=big?'#C8261C':'#FBF6EC';x.beginPath();x.arc(80,80,72,0,7);x.stroke();x.lineWidth=2;x.strokeStyle='#15110E';x.beginPath();x.arc(80,80,77,0,7);x.stroke();t.needsUpdate=true};
  const t=new THREE.CanvasTexture(c);paint(null);const u=ph(n);if(u){const im=new Image();im.crossOrigin='anonymous';im.onload=()=>paint(im);im.src=u}texCache.set(key,t);return t}
function nodeObj(n){const g=new THREE.Group(),big=onPath.has(n.id),sz=big?(n.end?22:17):7;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:faceTex(n.id,big),transparent:true,depthWrite:false,opacity:big?1:.82}));sp.scale.set(sz,sz,1);g.add(sp);
  if(big||n.label){const l=new SpriteText(n.id,big?3.6:2.1,'#15110E');l.fontFace='"Bodoni Moda", Didot, Georgia, serif';l.fontWeight='700';l.backgroundColor=big?'rgba(251,246,236,.95)':'rgba(251,246,236,.75)';l.padding=big?1.6:1;l.borderRadius=2;l.position.set(0,-(sz/2)-(big?4:2.6),0);g.add(l)}
  return g}
function linkObj(l){if(!pathLinks.has(l))return null;const s=new SpriteText((KIND[l.t]||'')+(l.y?' · '+l.y:''),2.6,COL[l.t]==='#15110E'?'#15110E':COL[l.t]);s.fontFace='"IBM Plex Mono", monospace';s.fontWeight='600';s.backgroundColor='rgba(251,246,236,.95)';s.padding=1.2;s.borderRadius=1.5;s.borderWidth=.3;s.borderColor='#15110E';return s}
function ensureGraph(){if(Graph||typeof ForceGraph3D==='undefined')return Graph;
  try{Graph=ForceGraph3D({controlType:'orbit'})(box).backgroundColor('rgba(0,0,0,0)').showNavInfo(false).nodeId('id')
    .nodeThreeObject(nodeObj).nodeLabel(n=>`${n.id} · ${DEG[n.id]} rishtas`)
    .linkColor(l=>pathLinks.has(l)?COL[l.t]:'rgba(94,84,74,.28)').linkWidth(l=>pathLinks.has(l)?2.6:0).linkOpacity(.75)
    .linkDirectionalParticles(l=>pathLinks.has(l)?3:0).linkDirectionalParticleWidth(2.2).linkDirectionalParticleSpeed(.008).linkDirectionalParticleColor(()=>'#C8261C')
    .linkThreeObjectExtend(true).linkThreeObject(linkObj).linkPositionUpdate((sp,{start,end})=>{if(!sp)return;sp.position.set((start.x+end.x)/2,(start.y+end.y)/2+3,(start.z+end.z)/2)})
    .onNodeClick(n=>menu(n)).onBackgroundClick(()=>{$('#rmenu').hidden=true}).onEngineStop(()=>{if(needFit&&!touring){needFit=false;frame(900)}}).cooldownTicks(140).warmupTicks(40);
    Graph.d3Force('charge').strength(-45);Graph.d3Force('link').distance(l=>pathLinks.has(l)?40:16);
    new ResizeObserver(()=>Graph.width(box.clientWidth).height(box.clientHeight)).observe(box);
  }catch(err){Graph=null;box.innerHTML='<p class="rw-err">Your browser can\'t draw the 3D web (WebGL is off). The chain is spelled out below.</p>'}
  return Graph}
function build(a,b,p){onPath=new Set([a,...p.map(x=>x[2])]);const nodes=new Map(),links=[];pathLinks=new Set();
  const L=p.length,chain=[a,...p.map(x=>x[2])];
  // the chain is pinned on a slow 3D arc so it reads left to right however you spin it
  // wide screens: a shallow arc left to right; tall screens: a spiral staircase top to bottom
  const tall=box.clientWidth/Math.max(1,box.clientHeight)<1.15,R=Math.max(26,L*9);
  chain.forEach((n,k)=>{const u=L?k/L:.5,ang=(u-.5)*Math.PI*.9,tw=u*Math.PI*1.6;
    const pos=tall?{fx:Math.sin(tw)*R,fy:(.5-u)*Math.max(50,L*40),fz:Math.cos(tw)*R}:{fx:Math.sin(ang)*Math.max(60,L*34),fy:Math.sin(u*Math.PI*2)*14,fz:-Math.cos(ang)*Math.max(30,L*14)+Math.max(30,L*14)};
    nodes.set(n,{id:n,end:k===0||k===L,...pos})});
  p.forEach(([u,i,v])=>{const e=G[i];const l={source:u,target:v,t:e[2],y:e[4],i};links.push(l);pathLinks.add(l)});
  // everyone each of them touches floats around them: strongest ties first, films last
  chain.forEach(n=>{const ns=ADJ[n].filter(([o])=>!onPath.has(o)).sort((x,y)=>(!!SRC[x[1]])-(!!SRC[y[1]])||(WT[G[x[1]][2]]||2)-(WT[G[y[1]][2]]||2)||DEG[y[0]]-DEG[x[0]]);const seenN=new Set();
    ns.forEach(([o,i])=>{if(seenN.has(o)||seenN.size>=(chain.length>4?5:8))return;seenN.add(o);if(!nodes.has(o))nodes.set(o,{id:o});links.push({source:n,target:o,t:G[i][2],y:G[i][4],i})})});
  // any other direct ties between people on the chain, so double rishtas show up
  for(let x=0;x<chain.length;x++)for(let y=x+1;y<chain.length;y++)ADJ[chain[x]].forEach(([o,i])=>{if(o===chain[y]&&!p.some(q=>q[1]===i)&&!links.some(l=>l.i===i))links.push({source:chain[x],target:o,t:G[i][2],y:G[i][4],i})});
  data={nodes:[...nodes.values()],links};
  if(!ensureGraph())return;Graph.graphData(data);texCache.forEach((t,k)=>{});
  needFit=true;setTimeout(()=>frame(),300)}
// the chain's positions are pinned, so the frame is computed from them directly: whole chain in view at any screen shape
function frame(ms=1200){if(!Graph)return;const P=data.nodes.filter(n=>onPath.has(n.id));if(!P.length)return;
  const xs=P.map(n=>n.fx),ys=P.map(n=>n.fy),zs=P.map(n=>n.fz),c={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,z:(Math.min(...zs)+Math.max(...zs))/2};
  const cam=Graph.camera(),vf=(cam.fov||40)*Math.PI/180,asp=box.clientWidth/Math.max(1,box.clientHeight),hf=2*Math.atan(Math.tan(vf/2)*asp);
  const sx=Math.max(...xs)-Math.min(...xs)+50,sy=Math.max(...ys)-Math.min(...ys)+70,sz=Math.max(...zs)-Math.min(...zs);
  const d=Math.max(sx/2/Math.tan(hf/2),sy/2/Math.tan(vf/2),60)+sz/2+20;Graph.cameraPosition({x:c.x,y:c.y+d*.18,z:c.z+d},c,ms)}
function flyTo(id,ms=1500){const n=data.nodes.find(x=>x.id===id);if(!n||!Graph)return;const x=n.fx??n.x??0,y=n.fy??n.y??0,z=n.fz??n.z??0;const k=innerWidth<720?120:95;Graph.cameraPosition({x:x+18,y:y+16,z:z+k},{x,y,z},ms)}

/* ---------- tap a face ---------- */
function menu(n){const m=$('#rmenu');m.hidden=false;m.innerHTML=`<p><b>${esc(n.id)}</b> · ${DEG[n.id]} rishtas</p><button type="button" data-s="a">Make person one</button><button type="button" data-s="b">Make person two</button><a href="people.html?p=${enc(n.id)}#actor">Open their page →</a><button type="button" class="x" aria-label="Close">✕</button>`;
  m.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{(b.dataset.s==='a'?PA:PB).set(n.id);m.hidden=true;run()});m.querySelector('.x').onclick=()=>m.hidden=true;flyTo(n.id,900)}

/* ---------- the readout ---------- */
let cur=null;
function hopHtml(a,p){return `<ol class="rhops"><li class="rwho">${face(a)}<b>${esc(a)}</b></li>${p.map(([u,i,v],k)=>{const e=G[i],st=STAMP[e[5]]||STAMP.t,fs=(GF[i]||(SRC[i]?[SRC[i]]:[])).map(x=>MV.get(x.slice(5))).filter(Boolean);
  return `<li class="rhop" data-k="${k}" style="--c:${COL[e[2]]}"><span class="rk">${esc(KIND[e[2]])}${e[4]?' · '+e[4]:''}</span> <span class="stmp ${st[1]}">${st[0]}</span>${e[3]?`<p>${esc(e[3])}</p>`:''}${fs.length?`<p class="rf">🎬 ${fs.map(f=>esc(f[1])+' ('+f[2]+')').join(' · ')}${fs.length>1?' · repeat collaborators':''}</p>`:''}<p class="rrole">${esc(first(v))} is ${esc(first(u))}'s ${esc(role(i))}</p></li><li class="rwho">${face(v)}<b>${esc(v)}</b></li>`}).join('')}</ol>`}
const face=n=>ph(n)?`<img src="${esc(ph(n))}" alt="" loading="lazy">`:`<span class="ini">${esc(n.slice(0,2))}</span>`;
function show(a,b,rs,k=0){cur={a,b,rs,k};const p=rs[k],out=$('#rout');
  if(!p){out.innerHTML=`<p class="rsent">No chain between ${esc(a)} and ${esc(b)} with these filters.</p><p class="rsub">Turn a filter off, or tell us what we're missing: these two aren't linked on the board yet.</p>`;build(a,a,[]);return}
  const deg=p.length,weak=p.filter(([,i])=>G[i][5]!=='t').length;
  const dir=[...new Map(ADJ[a].filter(([v])=>v===b).map(([,i])=>[role(i),i])).values()];
  // a confirmed tie outranks the rumor of one; a film credit outranks a vaguer 'collaborator'
  {const rs=new Set(dir.map(role));const drop=new Set();if(['spouse','ex-spouse','ex','ex-fiancé(e)'].some(r=>rs.has(r)))drop.add('rumored flame');if(rs.has('co-star'))drop.add('collaborator');for(let j=dir.length-1;j>=0;j--)if(drop.has(role(dir[j])))dir.splice(j,1)}
  const sent=p.length===1&&dir.length>1?`${esc(first(b))} is ${esc(first(a))}'s ${dir.map(i=>esc(role(i))).reduce((s,r,j,arr)=>s+(j===0?'':j===arr.length-1?' and ':', ')+r,'')}.`:sentence(a,b,p);
  out.innerHTML=`<p class="rq">Yeh rishta kya kehlata hai?</p><p class="rsent">${sent}</p>
   <p class="rsub">${opts().fast?'Fewest steps (every kind of link counts the same)':'Strongest ties (family, marriage and real co-starring first; cameos, songs and rumors cost more)'}${opts().rum?'':' · rumors off'}</p>
   <p class="rsub"><span class="rdeg">${deg}</span> ${esc(CLOSE[Math.min(deg,7)])}${weak?` · <span class="stmp v-alleged">${weak} hop${weak>1?'s':''} not fully on record</span>`:' · every hop is a receipt'}</p>
   ${rs.length>1?`<div class="rroutes" role="tablist" aria-label="Routes">${rs.map((r,i)=>`<button type="button" role="tab" aria-selected="${i===k}" data-r="${i}">${i&&rs[0].length===1&&r.length>1?'The long way round':'Route '+(i+1)} · ${r.length} step${r.length>1?'s':''}</button>`).join('')}</div>`:''}
   <div class="rtour"><button type="button" id="rplay">▶ Play the rishta</button><button type="button" id="rfit">Show the whole chain</button><button type="button" id="rshare">🔗 Copy link</button></div>
   ${hopHtml(a,p)}${p.length===1&&dir.length>1?`<p class="rsub">${dir.length} direct rishtas on the board: ${dir.map(i=>esc(KIND[G[i][2]])+(G[i][3]?' ('+esc(G[i][3])+')':'')).join(' · ')}</p>`:''}`;
  out.querySelectorAll('[data-r]').forEach(x=>x.onclick=()=>show(a,b,rs,+x.dataset.r));
  out.querySelectorAll('.rhop').forEach(li=>li.onclick=()=>{const [u,,v]=p[+li.dataset.k];flyTo(v);caption(u,p[+li.dataset.k])});
  $('#rplay').onclick=()=>tour(a,p);$('#rfit').onclick=()=>{touring=false;$('#rcap').hidden=true;frame()};
  $('#rshare').onclick=()=>{navigator.clipboard?.writeText(location.href).then(()=>{$('#rshare').textContent='✓ Copied'})};
  build(a,b,p)}
function caption(u,[,i,v]){const e=G[i],st=STAMP[e[5]]||STAMP.t,c=$('#rcap');c.hidden=false;c.innerHTML=`<p><b>${esc(first(v))}</b> is <b>${esc(first(u))}</b>'s ${esc(role(i))}</p><p class="rcd">${esc(KIND[e[2]])}${e[4]?' · '+e[4]:''} <span class="stmp ${st[1]}">${st[0]}</span></p>${e[3]?`<p class="rcd">${esc(e[3])}</p>`:''}`}
async function tour(a,p){if(touring){touring=false;return}touring=true;const btn=$('#rplay');btn.textContent='❚❚ Stop';
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;flyTo(a,RM?0:1200);$('#rcap').hidden=false;$('#rcap').innerHTML=`<p>Starting with <b>${esc(a)}</b></p>`;
  for(const step of p){await new Promise(r=>setTimeout(r,RM?900:1900));if(!touring)break;flyTo(step[2],RM?0:1500);caption(step[0],step)}
  await new Promise(r=>setTimeout(r,2200));if(touring)frame();touring=false;btn.textContent='▶ Play the rishta'}

/* ---------- wiring ---------- */
const PA=picker($('#rpa'),'ra',()=>run()),PB=picker($('#rpb'),'rb',()=>run());
function opts(){return {clean:$('#rclean').checked,fam:$('#rfam').checked,nofilm:$('#rnofilm').checked,rum:$('#rrum').checked,fast:$('#rfast').checked}}
function run(){const a=PA.get(),b=PB.get();if(!a||!b)return;touring=false;$('#rcap').hidden=true;
  const o=opts(),q=new URLSearchParams({a,b});['clean','fam','nofilm','rum','fast'].forEach(k=>{if(o[k])q.set(k,1)});history.replaceState(null,'','?'+q);
  if(a===b){$('#rout').innerHTML=`<p class="rsent">Same person twice. Pick someone else for person two.</p>`;return}
  show(a,b,routes(a,b,o))}
['#rclean','#rfam','#rnofilm','#rrum','#rfast','#rstrong'].forEach(s=>$(s).onchange=run);
$('#rswap').onclick=()=>{const a=PA.get(),b=PB.get();if(a&&b){PA.set(b);PB.set(a);run()}};
$('#rrand').onclick=()=>{const pool=NAMES.filter(n=>DEG[n]>=4),r=()=>pool[Math.floor(Math.random()*pool.length)];let a=r(),b=r();while(b===a)b=r();PA.set(a);PB.set(b);run()};
document.querySelectorAll('.rpairs button').forEach(x=>x.onclick=()=>{PA.set(x.dataset.a);PB.set(x.dataset.b);run();$('#rw3d').scrollIntoView({behavior:'smooth',block:'center'})});
$('#rform').addEventListener('submit',e=>{e.preventDefault();run()});
const q=new URLSearchParams(location.search);['clean','fam','nofilm','rum','fast'].forEach(k=>{if(q.get(k))$('#r'+k).checked=true});
PA.set(NAMES.includes(q.get('a'))?q.get('a'):'Aishwarya Rai');PB.set(NAMES.includes(q.get('b'))?q.get('b'):'Katrina Kaif');
$('#rstat').textContent=`${NAMES.length} people · ${G.length.toLocaleString()} rishtas on the board`;
run();

/* ---------- the movies holding Bollywood together: computed, never crowned ----------
   score = people × family clusters joined × (1 + generational span / 20) × industries ÷ cameo dilution */
(function bombs(){const host=$('#bombs');if(!host)return;const MOV=window.MOVIES||[];
  const parent={},find=x=>{while(parent[x]&&parent[x]!==x)x=parent[x]=parent[parent[x]]||parent[x];return x};
  NAMES.forEach(n=>parent[n]=n);G.forEach(e=>{if('fmd'.includes(e[2])){const a=find(e[0]),b=find(e[1]);if(a!==b)parent[a]=b}});
  const debut={},langs={};MOV.forEach(([,,y,x])=>{if(x.upcoming)return;const ps=[...(x.cast||[]),...(x.special||[])];ps.forEach(p=>{debut[p]=Math.min(debut[p]??9999,y);(langs[p]??=new Set()).add(x.lang||'hi')})});
  const rows=MOV.filter(m=>!m[3].upcoming).map(([id,title,year,x])=>{const extra=[...(x.special||[]),...(x.voice||[]),...(x.child||[]),...(x.song?x.song[1]:[])];
    const ppl=[...new Set([...(x.cast||[]),...extra])].filter(p=>ADJ[p]);if(ppl.length<4)return null;
    const fams=new Set(ppl.map(find)).size,ds=ppl.map(p=>debut[p]).filter(v=>v<9999),span=ds.length?Math.max(...ds)-Math.min(...ds):0;
    const ind=new Set(ppl.flatMap(p=>[...(langs[p]||[])])).size,cam=new Set(extra).size,dil=1+cam/ppl.length;
    return {id,title,year,n:ppl.length,fams,span,ind,cam,dil,score:ppl.length*fams*(1+span/20)*ind/dil}}).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,15);
  host.innerHTML=`<p class="rq">The movies holding Bollywood together</p><h2>Which films bridge the most of the board?</h2>
   <p class="rsub">Computed from the board, not picked by us: people on the board × separate families they bring together × how many generations they span × how many industries ÷ how much of it is cameos and songs.</p>
   <ol class="bombs">${rows.map((r,k)=>`<li><b class="bn">${k+1}</b><div><h3>${esc(r.title)} <span>${r.year}</span></h3><p>${r.n} people · ${r.fams} families joined · ${r.span}-year generational span · ${r.ind} industr${r.ind>1?'ies':'y'}${r.cam?` · ${r.cam} cameos/songs`:''}</p><p class="bx" data-id="${r.id}"></p></div><span class="bs">${Math.round(r.score)}</span></li>`).join('')}</ol>
   <button type="button" class="rgo" id="bombtest">Run the removal test</button><p class="rsub">Deletes each film's links (the ones that exist only because of that film) and measures, across a fixed sample of 150 people, how many pairs drift farther apart.</p>`;
  $('#bombtest').onclick=()=>{const btn=$('#bombtest');btn.disabled=true;btn.textContent='Testing…';setTimeout(()=>{
    const ok=i=>{const e=G[i];return !(e[2]==='r'||e[5]==='r'||e[5]==='c')};
    const sample=NAMES.filter((n,k)=>k%Math.max(1,Math.floor(NAMES.length/150))===0).slice(0,150);
    const bfs=(src,skip)=>{const d={[src]:0},q=[src];for(let h=0;h<q.length;h++){const u=q[h];for(const [v,i] of ADJ[u]){if(d[v]!==undefined||!ok(i)||skip.has(i))continue;d[v]=d[u]+1;q.push(v)}}return d};
    const base=sample.map(s=>bfs(s,new Set()));
    rows.forEach(r=>{const only=new Set();Object.entries(GF).forEach(([i,fs])=>{if(fs.length===1&&fs[0]==='film:'+r.id)only.add(+i)});
      let farther=0,lost=0,add=0;sample.forEach((s,k)=>{const d=bfs(s,only),b0=base[k];for(const t in b0){if(d[t]===undefined){lost++;continue}if(d[t]>b0[t]){farther++;add+=d[t]-b0[t]}}});
      const el=host.querySelector(`.bx[data-id="${r.id}"]`);el.innerHTML=`Without it: <b>${farther.toLocaleString()}</b> sampled pairs drift farther apart${lost?`, <b>${lost}</b> lose their connection entirely`:''}. ${only.size} links exist only because of this film.`});
    btn.textContent='Removal test done';},30)}})();
})();
