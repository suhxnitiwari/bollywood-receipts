/* ---------- Case files and actor pages, drawn from data ----------
   A case file (assets/files.js) or an actor's filmography (assets/movies.js) becomes a spec of nodes and threads,
   gets a force layout, and is pinned to a 3D corkboard. Modes hide or light parts of it; tapping opens a dossier. */
(function(){
const W3=window.W3D;if(!W3)return;
const {Web,COL,NAME,rng}=W3;
const CF=window.CASEFILES||[],MV=window.MOVIES||[],AP=window.ACTORPAGES||{};
const MVI=new Map(MV.map(m=>[m[0],m]));
MV.forEach(([,,,x])=>{x._role={};const more=[...(x.voice||[]).map(p=>[p,'voice']),...(x.child||[]).map(p=>[p,'child appearance']),...(x.song?x.song[1].map(p=>[p,'song: '+x.song[0]]):[])];
  if(more.length){x.special=[...(x.special||[])];more.forEach(([p,r])=>{if(!x.special.includes(p)&&!(x.cast||[]).includes(p))x.special.push(p);x._role[p]=r})}});
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const enc=encodeURIComponent;
const SHORT={'Shah Rukh Khan':'SRK','NTR Jr.':'NTR','Kunal Kapoor (actor)':'Kunal Kapoor','Tripti Dimri':'Triptii','Roshan Lal Nagrath':'Roshan','J. Om Prakash':'J. Om Prakash','Mansoor Ali Khan Pataudi':'Tiger Pataudi','Harivansh Rai Bachchan':'Harivansh Rai','Sandeep Reddy Vanga':'Vanga','Sanjay Leela Bhansali':'Bhansali','Navya Naveli Nanda':'Navya'};
const STAMP={t:['RECEIPT ✓','v-true'],a:['ALLEGED ?','v-alleged'],r:['RUMOR ~','v-rumor'],c:['CAP ✕','v-cap']};
const ph=n=>(typeof PH!=='undefined'&&PH[n])||null;
const isP=id=>!/^(film|char|evt|exit):/.test(id);
function labels(ids){const out={},first={};ids.filter(isP).forEach(n=>{const f=n.split(' ')[0];(first[f]??=[]).push(n)});
  ids.filter(isP).forEach(n=>{out[n]=SHORT[n]||(first[n.split(' ')[0]].length>1?n:n.split(' ')[0])});return out}
const yearOf=s=>{const m=String(s||'').match(/\b(19|20)\d{2}\b/);return m?+m[0]:null};

/* ---------- spec from a case file ---------- */
function specFromFile(f){const nodes=new Map(),edges=[];
  const node=(id,o={})=>{if(!nodes.has(id))nodes.set(id,{id,kind:isP(id)?'person':id.split(':')[0],...o});return nodes.get(id)};
  const edge=(a,b,t,lab='',ev='t',note='')=>{node(a);node(b);edges.push({a,b,t,lab,ev,note})};
  (f.films||[]).forEach(([id,title,year,x])=>{node('film:'+id,{label:title,year});
    (x.cast||[]).forEach(p=>edge(p,'film:'+id,'cast',title));(x.special||[]).forEach(p=>edge(p,'film:'+id,'cast','special appearance','t'));
    (x.crew||[]).forEach(([p,r])=>edge(p,'film:'+id,'crew',r))});
  (f.chars||[]).forEach(([c,actor,films])=>{node('char:'+c,{label:c});edge(actor,'char:'+c,'plays','plays '+c);films.forEach(fi=>edge('char:'+c,'film:'+fi,'cast',''))});
  (f.threads||[]).forEach(([a,b,t,lab,ev,note])=>edge(a,b,t,lab,ev,note));
  (f.events||[]).forEach(([id,lab,ppl,note])=>{node('evt:'+id,{label:lab,note});ppl.forEach(p=>edge(p,'evt:'+id,'evt','',(f.id==='genzh'&&id==='koffee')?'t':'t',note))});
  (f.exits||[]).forEach(([p,to,lab])=>{node('exit:'+to,{label:lab,to});edge(p,'exit:'+to,'exit','')});
  (f.lead||[]).forEach(p=>{node(p).lead=true});
  return {nodes:[...nodes.values()],edges,spine:f.spine}}

/* ---------- spec for anyone: their films plus their direct relationships ---------- */
let spec_shadow=[];
function specForPerson(name){const nodes=new Map(),edges=[];
  const node=(id,o={})=>{if(!nodes.has(id))nodes.set(id,{id,kind:isP(id)?'person':id.split(':')[0],...o});return nodes.get(id)};
  const edge=(a,b,t,lab='',ev='t',note='')=>{node(a);node(b);edges.push({a,b,t,lab,ev,note})};
  const films=MV.filter(m=>{const x=m[3];return (x.cast||[]).includes(name)||(x.special||[]).includes(name)||(x.crew||[]).some(c=>c[0]===name)}).sort((a,b)=>a[2]-b[2]);
  const shadow=MV.filter(m=>(m[3].exited||[]).some(e=>e[0]===name));
  const shared={};
  films.forEach(([id,title,year,x])=>{const fid='film:'+id;node(fid,{label:title+(x.upcoming?' (upcoming)':''),year,upcoming:!!x.upcoming});
    const role=(x.crew||[]).filter(c=>c[0]===name).map(c=>c[1]),acted=(x.cast||[]).includes(name),sp=(x.special||[]).includes(name);
    if(acted)edge(name,fid,'cast',x.upcoming?'upcoming':title);if(sp)edge(name,fid,'cast',x._role?.[name]||'special appearance');role.forEach(r=>edge(name,fid,'crew',r));
    if(!acted&&!sp&&!role.length)return;
    const behind=!acted&&!sp;
    [...(x.cast||[]),...(x.special||[])].forEach(p=>{if(p===name)return;edge(p,fid,'cast',(x.special||[]).includes(p)?(x._role?.[p]||'special appearance'):title);if(!behind&&!x.upcoming&&!x._role?.[p]&&!x._role?.[name])(shared[p]??=[]).push(title)});
    (x.crew||[]).forEach(([p,r])=>{if(p===name||!/director|producer/.test(r)||/assistant/.test(r))return;edge(p,fid,'crew',r);if(!behind&&!x.upcoming)(shared[p]??=[]).push(title)})});
  shadow.forEach(([id,title,year,x])=>{const fid='film:'+id;node(fid,{label:title+' (left)',year,shadow:true});const ex=x.exited.find(e=>e[0]===name);edge(name,fid,'shadow',ex[1],ex[2]);
    (x.cast||[]).forEach(p=>edge(p,fid,'cast',title));(x.crew||[]).forEach(([p,r])=>edge(p,fid,'crew',r));(x.successor||[]).forEach(([a,b,n,ev])=>{if(b===name)edge(a,name,'succ','replaced '+(SHORT[name]||name.split(' ')[0])+' · '+title,ev,n)})});
  spec_shadow=shadow;
  (AP[name]?.events||[]).forEach(([id,lab,ppl,note])=>{node('evt:'+id,{label:lab,note});(ppl||[]).forEach(p=>edge(p,'evt:'+id,'evt','','t',note))});
  // direct relationships: the curated extras first, then whatever the board knows about this person
  (AP[name]?.extra||[]).forEach(([a,b,t,lab,ev,note])=>{if(nodes.has(a)||a===name||b===name||nodes.has(b))edge(a,b,t,lab,ev,note)});
  const TYF={m:'wed',d:'div',e:'ex',x:'ex',r:'rom',f:'fam',b:'fr',v:'fd',k:'kiss',g:'glam',s:'succ'};
  const G0=window.__G||[],SRC=window.__GSRC||{};
  G0.forEach((e,i)=>{if(SRC[i]||e[2]==='c')return;const t=TYF[e[2]];if(!t)return;const evm={t:'t',a:'a',r:'r',c:'c'}[e[5]]||'t';
    const lab=(e[3]||'').split(';')[0].slice(0,40)||NAME[t];
    if(e[0]===name||e[1]===name){if(!edges.some(x=>x.t===t&&((x.a===e[0]&&x.b===e[1])||(x.a===e[1]&&x.b===e[0]))))edge(e[0],e[1],t,lab+(e[4]&&!/\d{4}/.test(lab)?' · '+e[4]:''),evm)}
    else if(nodes.has(e[0])&&nodes.has(e[1])&&!['r','b'].includes(e[2])){if(!edges.some(x=>x.t===t&&((x.a===e[0]&&x.b===e[1])||(x.a===e[1]&&x.b===e[0]))))edge(e[0],e[1],t,lab,evm)}});
  node(name).lead=true;
  // repeat collaborators get a thick direct work line naming every shared film
  Object.entries(shared).forEach(([p,ts])=>{if(ts.length>1)edges.push({a:name,b:p,t:'work',lab:ts.length+' films',ev:'t',note:ts.join(' · '),w:Math.min(2.6,.9+.35*ts.length),cap:ts.length>2});node(p).repeat=ts.length});
  const people=[...nodes.values()].filter(n=>n.kind==='person');
  people.forEach(n=>{if(n.id!==name&&!n.repeat&&!edges.some(e=>((e.a===n.id&&e.b===name)||(e.b===n.id&&e.a===name))&&!['cast','crew'].includes(e.t)))n.size=.72});
  return {nodes:[...nodes.values()],edges,spine:1,actor:name,shared,films,shadow:spec_shadow}}

/* ---------- layout: springs and repulsion in 2D, a little depth, parallel threads bowed apart ---------- */
function layout(spec,seed,aspect){const r=rng(seed),N=spec.nodes,idx=new Map(N.map((n,i)=>[n.id,i]));
  if(spec.actor)return layoutTimeline(spec,r,idx,aspect);
  const films=N.filter(n=>n.kind==='film').sort((a,b)=>(a.year||0)-(b.year||0));
  N.forEach(n=>{n.x=(r()*2-1)*.8;n.y=(r()*2-1)*.5;if(n.lead){n.x*=.3;n.y*=.3}});
  if(spec.spine&&films.length>1)films.forEach((f,i)=>{f.pin=true;f.x=-.92+1.84*i/(films.length-1);f.y=films.length>6?(i%2?-.08:.08):0});
  const RL={shadow:.34,succ:.3,glam:.3,fam:.22,wed:.2,ptr:.2,div:.24,ex:.26,rom:.3,kiss:.28,fic:.3,work:.32,fr:.26,fd:.32,cast:.34,crew:.36,plays:.18,evt:.24,exit:.22};
  const E=spec.edges.map(e=>[idx.get(e.a),idx.get(e.b),RL[e.t]||.3]);const n=N.length,k=Math.min(.22,1.1/Math.sqrt(n+1));
  for(let it=0;it<320;it++){const T=.09*(1-it/320)+.003,d=N.map(()=>[0,0]);
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){let dx=N[i].x-N[j].x,dy=N[i].y-N[j].y,d2=dx*dx+dy*dy+1e-4;const f=k*k/d2*.6;d[i][0]+=dx*f;d[i][1]+=dy*f;d[j][0]-=dx*f;d[j][1]-=dy*f}
    for(const [a,b,L] of E){const A=N[a],B=N[b],dx=A.x-B.x,dy=A.y-B.y,dd=Math.sqrt(dx*dx+dy*dy)+1e-4,f=(dd-L)/dd*.35;d[a][0]-=dx*f;d[a][1]-=dy*f;d[b][0]+=dx*f;d[b][1]+=dy*f}
    N.forEach((p,i)=>{if(p.pin){p.y+=(-p.y+(spec.spine?(p.y>0?.08:p.y<0?-.08:0):0))*0;return}d[i][0]-=p.x*.05;d[i][1]-=p.y*(spec.spine?.03:.07);const l=Math.hypot(d[i][0],d[i][1])||1,m=Math.min(l,T);p.x+=d[i][0]/l*m;p.y+=d[i][1]/l*m})}
  // fit: x into [-1,1], y into the canvas's aspect
  const xs=N.map(p=>p.x),ys=N.map(p=>p.y),mx=(Math.min(...xs)+Math.max(...xs))/2,my=(Math.min(...ys)+Math.max(...ys))/2;
  const sx=(Math.max(...xs)-Math.min(...xs))/2||1,sy=(Math.max(...ys)-Math.min(...ys))/2||1,yr=Math.min(.95,1.9/aspect),s=Math.min(.92/sx,yr*.92/sy);
  N.forEach(p=>{p.x=(p.x-mx)*s;p.y=(p.y-my)*s;p.z=p.kind==='film'?0:(r()-.5)*(p.lead?.12:.45);p.ph=r()*6.28;p.big=!(p.kind==='person'&&p.size<1);if(!p.big){p.col='#5E544A';p.deg=3}});
  // parallel threads between the same two nodes bow apart so every one is readable
  const groups={};spec.edges.forEach((e,i)=>{e.i=i;e.ph=r();const key=[e.a,e.b].sort().join('|');(groups[key]??=[]).push(e)});
  Object.values(groups).forEach(g=>{if(g.length<2)return;g.forEach((e,k)=>{const A=N[idx.get(e.a)],B=N[idx.get(e.b)],off=(k-(g.length-1)/2)*.11,dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy)||1;
    e.c=[(A.x+B.x)/2-dy/l*off,(A.y+B.y)/2+dx/l*off,(A.z+B.z)/2]})});
  spec.edges.forEach(e=>{e.a=idx.get(e.a);e.b=idx.get(e.b)});
  const L=labels(N.map(p=>p.id));N.forEach(p=>{if(p.kind==='person'){p.label=L[p.id];p.photo=ph(p.id)}});
  return spec}

// actor pages: films on a spine by year, the actor above, co-stars hung near the films they share
function layoutTimeline(spec,r,idx,aspect){const N=spec.nodes,yr=Math.min(.95,1.9/aspect);
  const films=N.filter(n=>n.kind==='film').sort((a,b)=>(a.year||0)-(b.year||0)||(a.shadow?1:0)-(b.shadow?1:0));
  films.forEach((f,i)=>{f.x=films.length>1?-.95+1.9*i/(films.length-1):0;f.y=(films.length>8?((i%3)-1)*.13:(i%2?.05:-.05))*yr});
  const fx=new Map(films.map(f=>[f.id,f.x])),me=N.find(n=>n.id===spec.actor);
  N.forEach(n=>{if(n.kind==='film')return;if(n===me){n.x=0;n.y=-.92*yr;return}
    const xs=spec.edges.filter(e=>(e.a===n.id||e.b===n.id)&&(e.t==='cast'||e.t==='crew'||e.t==='shadow')).map(e=>fx.get(e.a===n.id?e.b:e.a)).filter(v=>v!=null);
    const big=!(n.size<1),side=r()<(big?.35:.5)?-1:1;n.x=xs.length?xs.reduce((a,b)=>a+b,0)/xs.length+(r()-.5)*.08:(r()*2-1)*.9;
    n.y=side*(big?.32+r()*.3:.2+r()*.7)*yr;if(!xs.length)n.y=-.55*yr+(r()-.5)*.2});
  // nudge overlapping polaroids apart, keeping everyone near their anchor
  const P=N.filter(n=>n!==me&&n.kind!=='film'),ax=P.map(n=>n.x),ay=P.map(n=>n.y);
  for(let it=0;it<140;it++)for(let i=0;i<P.length;i++){const a=P[i],ra=a.size<1?.035:.085;for(let j=i+1;j<P.length;j++){const b=P[j],rb=b.size<1?.035:.085,dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1e-3,m=ra+rb;
    if(d<m){const f=(m-d)/2/d;a.x+=dx*f;a.y+=dy*f;b.x-=dx*f;b.y-=dy*f}}a.x+=(ax[i]-a.x)*.04;a.y+=(ay[i]-a.y)*.04}
  N.forEach(p=>{p.x=Math.max(-.98,Math.min(.98,p.x));p.y=Math.max(-yr,Math.min(yr,p.y));p.z=p.kind==='film'?0:(r()-.5)*(p===me?0:.25);p.ph=r()*6.28;p.big=!(p.kind==='person'&&p.size<1);if(!p.big){p.col='#5E544A';p.deg=3}});
  spec.edges.forEach((e,i)=>{e.i=i;e.ph=r();e.c=null});
  const groups={};spec.edges.forEach(e=>{const key=[e.a,e.b].sort().join('|');(groups[key]??=[]).push(e)});
  Object.values(groups).forEach(g=>{if(g.length<2)return;g.forEach((e,k)=>{const A=N[idx.get(e.a)],B=N[idx.get(e.b)],off=(k-(g.length-1)/2)*.08,dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy)||1;e.c=[(A.x+B.x)/2-dy/l*off,(A.y+B.y)/2+dx/l*off,(A.z+B.z)/2]})});
  spec.edges.forEach(e=>{e.a=idx.get(e.a);e.b=idx.get(e.b)});
  const L=labels(N.map(p=>p.id));N.forEach(p=>{if(p.kind==='person'){p.label=L[p.id];p.photo=ph(p.id)}});
  return spec}

/* ---------- modes ---------- */
function stage(spec,m){const N=spec.nodes,E=spec.edges;
  N.forEach(n=>{if(n.ox==null){n.ox=n.x;n.oy=n.y;n.oz=n.z}});E.forEach(e=>{if(e.t0==null){e.t0=e.t;e.lab0=e.lab;e.c0=e.c}e.t=e.t0;e.lab=e.lab0;e.c=e.c0});
  const pull=m&&m.pull?m.pull.filter(id=>N.some(n=>n.id===id)):null;
  if(pull){const ring=pull.filter(id=>id!==m.center),R=new Map(ring.map((id,i)=>[id,i/ring.length*6.283]));
    N.forEach(n=>{if(n.id===m.center){n.tx=0;n.ty=0;n.tz=0}else if(R.has(n.id)){n.tx=Math.cos(R.get(n.id))*.5;n.ty=Math.sin(R.get(n.id))*.36;n.tz=0}else{n.tx=Math.max(-1.15,Math.min(1.15,n.ox*1.5));n.ty=n.oy*1.4;n.tz=n.oz}});
    const moved=new Set([...pull,m.center]);E.forEach(e=>{if(moved.has(N[e.a].id)||moved.has(N[e.b].id))e.c=null})}
  else N.forEach(n=>{n.tx=n.ox;n.ty=n.oy;n.tz=n.oz});
  (m&&m.restyle||[]).forEach(([from,to,lab])=>E.forEach(e=>{if(e.t0===from){e.t=to;if(lab)e.lab=lab}}))}
function applyMode(w,spec,m,box){const N=spec.nodes,E=spec.edges;box.querySelector('.cfnote2')?.remove();stage(spec,m);
  if(m&&m.note)box.insertAdjacentHTML('beforeend',`<p class="cfnote2 cfstamp">${m.note}</p>`);
  if(!m||(m.pull&&!m.types&&!m.ids&&!m.ev)){w.show=null;w.focus=null;W3.kick();return}
  let es=E.filter(e=>{const a=N[e.a],b=N[e.b];
    if(m.noFilms&&(a.kind==='film'||b.kind==='film'||e.t==='cast'||e.t==='crew'))return false;
    if(m.noFilms&&(a.kind==='char'||b.kind==='char'))return false;
    if(m.noChars&&(a.kind==='char'||b.kind==='char'))return false;
    if(m.chars)return a.kind==='char'||b.kind==='char'||(e.t==='cast'&&(a.kind==='char'||b.kind==='char'));
    if(m.hide&&(m.hide.includes(a.id)||m.hide.includes(b.id)))return false;
    if(m.types)return m.types.includes(e.t)||(m.events&&e.t==='evt');
    if(m.ev)return m.ev.includes(e.ev)&&!['cast','crew','plays','evt','exit'].includes(e.t);
    if(m.ids)return m.ids.includes(a.id)&&m.ids.includes(b.id);
    if(m.events&&e.t==='evt')return true;
    return !m.types&&!m.ev&&!m.ids&&!m.chars});
  if(m.chars){const cs=new Set(N.filter(n=>n.kind==='char').map(n=>n.id));es=E.filter(e=>cs.has(N[e.a].id)||cs.has(N[e.b].id))}
  const ns=new Set();es.forEach(e=>{ns.add(N[e.a].id);ns.add(N[e.b].id)});(m.ids||[]).forEach(i=>ns.add(i));
  if(m.hide)m.hide.forEach(h=>ns.delete(h));
  w.show={nodes:ns,edges:new Set(es.map(e=>e.i))};w.focus=null;W3.kick();
  if((m.noFilms||m.hide)&&!m.note)box.insertAdjacentHTML('beforeend',`<p class="cfnote2">${stillConnected(spec,m)}</p>`)}

// would these people still be connected without the movies (or without the person)?
function stillConnected(spec,m){const ppl=spec.nodes.filter(n=>n.kind==='person'&&!(m.hide||[]).includes(n.id)).map(n=>n.id);
  const ADJ=window.__ADJ||{},G0=window.__G||[],SRC=window.__GSRC||{},skip=new Set(m.hide||[]);
  const useFilms=!!m.hide;const ok=(i)=>useFilms||!SRC[i];
  const set=new Set(ppl);const seen=new Map();let comps=[];
  for(const p of ppl){if(seen.has(p))continue;const comp=[],q=[p];seen.set(p,comps.length);
    while(q.length){const u=q.shift();if(set.has(u))comp.push(u);for(const [v,i] of ADJ[u]||[]){if(skip.has(v)||!ok(i)||seen.has(v))continue;seen.set(v,comps.length);q.push(v)}}
    comps.push(comp)}
  comps=comps.filter(c=>c.length).sort((a,b)=>b.length-a.length);const big=comps[0]||[];
  const who=m.hide?`without ${spec.nodes.find(n=>n.id===m.hide[0])?.label||'them'}`:'without any of these films';
  if(big.length===ppl.length)return `<b>Still connected.</b> ${who[0].toUpperCase()+who.slice(1)}, all ${ppl.length} people here still reach each other through family, marriages, exes, friendships${useFilms?' and other films':''}.`;
  return `<b>Mostly connected.</b> ${who[0].toUpperCase()+who.slice(1)}, ${big.length} of ${ppl.length} people still form one web. Cut loose: ${ppl.filter(p=>!big.includes(p)).slice(0,6).map(p=>spec.nodes.find(n=>n.id===p)?.label).join(', ')}${ppl.length-big.length>6?'…':''}.`}

/* ---------- dossier ---------- */
function dossier(el,spec,id){const N=spec.nodes,n=N.find(x=>x.id===id);if(!n)return;
  const mine=spec.edges.filter(e=>N[e.a].id===id||N[e.b].id===id);
  const row=e=>{const o=N[e.a].id===id?N[e.b]:N[e.a];const st=STAMP[e.ev]||STAMP.t;const kind=e.t==='cast'?(n.kind==='film'?'cast':'in'):NAME[e.t]||e.t;
    return `<li><span class="dk ${e.t}">${esc(kind)}</span> <b>${esc(o.label||o.id)}</b>${e.lab&&e.lab!==o.label?` <span class="dl">${esc(e.lab)}</span>`:''}${['cast','crew','plays','evt','exit'].includes(e.t)?'':` <span class="stmp ${st[1]}">${st[0]}</span>`}${e.note?`<br><span class="dn">${esc(e.note)}</span>`:''}</li>`};
  const ADJ=window.__ADJ||{},d1=(ADJ[id]||[]).length;let d2=0;if(n.kind==='person'){const s=new Set([id]);(ADJ[id]||[]).forEach(([v])=>s.add(v));const s2=new Set(s);(ADJ[id]||[]).forEach(([v])=>(ADJ[v]||[]).forEach(([w])=>s2.add(w)));d2=s2.size-s.size}
  const order={wed:0,ptr:0,div:1,ex:1,rom:2,kiss:3,fam:4,fr:5,fd:6,work:7,fic:8,plays:9,crew:10,cast:11,evt:12,exit:13};
  el.innerHTML=`<div class="dhd">${n.kind==='person'?(ph(id)?`<img src="${ph(id)}" alt="">`:`<span class="ini">${esc((n.label||'').slice(0,2))}</span>`):''}<div><p class="eyebrow">${n.kind==='person'?'Dossier':n.kind==='film'?'Film'+(n.year?' · '+n.year:''):n.kind==='char'?'Character':n.kind==='evt'?'Event':'Exit'}</p><h3>${esc(n.kind==='person'?id:n.label)}</h3>
    ${n.kind==='person'?`<p class="dstat">${d1} direct links on the whole board · ${d2} more within two steps</p><p class="dlinks"><a href="people.html?p=${enc(id)}#actor">Open their page →</a> <a href="receipts.html?q=${enc(id)}">Their receipts →</a></p>`:n.note?`<p class="dn">${esc(n.note)}</p>`:''}</div></div>
    <ul class="dlist">${mine.sort((a,b)=>(order[a.t]??9)-(order[b.t]??9)).map(row).join('')}</ul>`}

/* ---------- render a case file section ---------- */
let NUM=0;
function render(host,f,num){const spec=specFromFile(f);const box=document.createElement('section');box.className='web cf';box.id='file-'+num;box.setAttribute('aria-labelledby',f.id);
  const ppl=spec.nodes.filter(n=>n.kind==='person'),threads=spec.edges.filter(e=>!['cast','crew','plays','evt','exit'].includes(e.t));
  box.innerHTML=`<div class="casehead"><span>Case file ${num}</span><span>Updated Oct 2026</span></div>
   <div class="cfhd"><div><p class="kicker">${esc(f.kick||'')}</p><h2 id="${f.id}">${esc(f.title)}</h2><p class="cfdek">${esc(f.dek)}</p>${f.note?`<p class="cfnote">${esc(f.note)}</p>`:''}</div>
   <dl class="case"><div><dt>Subjects</dt><dd>${ppl.length}</dd></div><div><dt>Threads</dt><dd>${threads.length}</dd></div>${(f.films||[]).length?`<div><dt>Films</dt><dd>${f.films.length}</dd></div>`:''}<div><dt>On record</dt><dd>${threads.filter(e=>e.ev==='t').length}</dd></div></dl></div>
   <div class="cfmodes" role="toolbar" aria-label="Show"><button type="button" aria-pressed="true" data-m="-1">Everything</button>${(f.modes||[]).map((m,i)=>`<button type="button" aria-pressed="false" data-m="${i}">${esc(m[0])}</button>`).join('')}</div>
   <div class="cfgrid"><div class="svgbox cfbox"></div><aside class="cfdoss" aria-live="polite"></aside></div>
   ${(f.cards||[]).length?`<div class="cfcards">${f.cards.map(([t,b,ev])=>`<article class="cfcard"><span class="stmp ${(STAMP[ev]||STAMP.t)[1]}">${(STAMP[ev]||STAMP.t)[0]}</span><h4>${esc(t)}</h4><p>${esc(b)}</p></article>`).join('')}</div>`:''}`;
  host.appendChild(box);const w=mount(box,spec,f.modes||[],f.id,(f.lead||[])[0]);(window.CFWIDGETS||[]).forEach(fn=>fn(f,box,w,spec,applyMode));return spec}

function mount(sec,spec,modes,seed,lead){const cvbox=sec.querySelector('.cfbox'),doss=sec.querySelector('.cfdoss');
  const aspect=spec.actor?(innerWidth<700?.75:1.15):innerWidth<700?.92:Math.max(1.25,Math.min(1.9,1.1+spec.nodes.length/40));
  layout(spec,seed,aspect);
  const w=Web(cvbox,{seed,aspect,label:sec.querySelector('h2')?.textContent||'Web',yaw:0,pitch:.1,sway:.22,alwaysCaptions:spec.nodes.length<34,
    onPick:id=>{const n=spec.nodes.find(x=>x.id===id);if(n&&n.kind==='exit'){const to=n.to;location.href=to.startsWith('fam:')?'people.html?k='+to.slice(4)+'#trees':'the-web.html#'+to;return}dossier(doss,spec,id);w.hover=spec.nodes.indexOf(n);W3.kick()}});
  w.nodes=spec.nodes;w.edges=spec.edges;
  cvbox.insertAdjacentHTML('beforeend',W3.legendHtml([...new Set(spec.edges.map(e=>e.t))].filter(t=>!['cast','crew','evt','exit','plays'].includes(t)))+`<span class="w3d-hint">Drag to spin · tap anyone for their dossier</span>`);
  dossier(doss,spec,lead||spec.nodes.find(n=>n.lead)?.id||spec.nodes[0].id);
  sec.querySelectorAll('.cfmodes button').forEach(b=>b.onclick=()=>{sec.querySelectorAll('.cfmodes button').forEach(x=>x.setAttribute('aria-pressed',x===b));const i=+b.dataset.m;applyMode(w,spec,i<0?null:modes[i][1],sec.querySelector('.cfgrid'))});
  return w}

/* ---------- widgets that only some case files carry ---------- */
const CFW=window.CFWIDGETS=window.CFWIDGETS||[];
const LV={yes:['🟥','Yes, a real fight'],fallout:['🟧','Reported fallout'],media:['🟨','Media rivalry'],sharedex:['⬜','Shared ex ≠ feud'],mend:['🟩','Reconciled']};
// Bollywood Beef: did they ever actually fight? who started it? what starts feuds?
CFW.push((f,box,w,spec,apply)=>{if(f.id!=='beef'||!window.BEEF)return;const B=window.BEEF.filter(x=>x.fight),C=window.BEEFCAUSE;
  const tally={};window.BEEF.forEach(x=>(x.cause||[]).forEach(c=>tally[c]=(tally[c]||0)+1));const top=Object.entries(tally).sort((a,b)=>b[1]-a[1]),max=top[0][1];
  box.insertAdjacentHTML('beforeend',`<div class="fight"><h3 class="cotitle">Did they ever actually fight?</h3><div class="fpick" role="group" aria-label="Pick a feud">${B.map((x,i)=>`<button type="button" data-i="${i}">${esc((SHORT[x.a]||x.a.split(' ')[0])+' × '+(SHORT[x.b]||x.b.split(' ')[0]))}</button>`).join('')}</div><div class="fout" aria-live="polite"><p class="dn">Pick a pair. The board answers with the level of evidence, not a moral verdict.</p></div></div>
   <div class="tally"><h3 class="cotitle">What actually starts Bollywood feuds?</h3><p class="dn">Counted from every pair on this board, not decided in advance.</p>${top.map(([c,n])=>`<div class="trow"><span>${esc(C[c]||c)}</span><i style="width:${n/max*100}%"></i><b>${n}</b></div>`).join('')}</div>`);
  const out=box.querySelector('.fout');
  box.querySelectorAll('.fpick button').forEach(b=>b.onclick=()=>{box.querySelectorAll('.fpick button').forEach(x=>x.setAttribute('aria-pressed',x===b));const x=B[+b.dataset.i],lv=LV[x.fight[0]]||LV.media;
    out.innerHTML=`<p class="fverd">${lv[0]} <b>${esc(x.fight[1])}</b></p><p>${esc(x.fight[2])}</p><p class="dn"><b>Who started it?</b> Earliest documented event: ${esc(x.start||'no single starting event on record')}. ${x.note?esc(x.note):''}</p>${(x.cause||[]).length?`<p class="dn">Cause: ${x.cause.map(c=>esc(C[c]||c)).join(' · ')}</p>`:''}${x.id==='room'||x.a==='Sridevi'?`<button type="button" class="roombtn">Lock them in the room</button><p class="roomclock" aria-live="polite"></p>`:''}`;
    const ids=[x.a,x.b,...(x.between||[])].filter(id=>spec.nodes.some(n=>n.id===id));apply(w,spec,{ids},box.querySelector('.cfgrid'));
    const rb=out.querySelector('.roombtn');if(rb)rb.onclick=()=>{const clk=out.querySelector('.roomclock');rb.disabled=true;let m=0;const t=setInterval(()=>{m+=3;clk.textContent=`🚪 Door closed · ${m} min · …`;if(m>=60){clearInterval(t);clk.innerHTML='🚪 Door opened at 60 min. Opposite corners. <b>Still no talking. Reconciliation attempt failed.</b>';rb.disabled=false}},140)}})});

// How Bollywood builds a star: where are they now, and what did they have before their first movie?
CFW.push((f,box,w,spec,apply)=>{if(f.id!=='starmaker'||!window.STARMAKERS)return;const {L,PAR,ACCESS}=window.STARMAKERS;
  const studioOf=m=>{const c=(m[3].crew||[]).filter(x=>!/assistant|singer/.test(x[1])).map(x=>x[0]);return c.includes('Karan Johar')?'Karan Johar':c.includes('Aditya Chopra')||c.includes('Yash Chopra')?'Aditya Chopra':null};
  const rows=L.filter(x=>x[2]!=='dirdeb').map(([p,s,t,how,orbit])=>{const y=+((how.match(/\b(19|20)\d{2}\b/)||[])[0]||0);
    const fs=MV.filter(m=>!m[3].upcoming&&((m[3].cast||[]).includes(p)||(m[3].special||[]).includes(p)));const after=fs.filter(m=>m[2]>y);const own=after.filter(m=>studioOf(m)===s);
    const last=fs.filter(m=>studioOf(m)===s).reduce((a,m)=>Math.max(a,m[2]),0);return {p,s,y,orbit,n:fs.length,own:own.length,other:after.length-own.length,last}});
  const yr=2026;
  box.insertAdjacentHTML('beforeend',`<div class="ledger"><h3 class="cotitle">Where are they now?</h3><p class="dn">Counted from the films in this archive, not complete filmographies. "Studio" means Dharma for Karan\'s list and YRF for Aditya\'s.</p>
   <table><thead><tr><th>Star</th><th>Studio</th><th>Launched</th><th>Studio films since</th><th>Elsewhere since</th><th>Years since last studio film</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a href="people.html?p=${enc(r.p)}#actor">${esc(r.p)}</a></td><td>${r.s==='Karan Johar'?'Dharma':'YRF'}</td><td>${r.y||'–'}</td><td>${r.own}</td><td>${r.other}</td><td>${r.last?yr-r.last:'–'}</td><td class="orb">${esc(r.orbit)}</td></tr>`).join('')}</tbody></table></div>
   <div class="heads"><h3 class="cotitle">What did you have before your first movie?</h3><p class="dn">Tick what counts as a head start. The board lights everyone who had at least one, and their families if you tick film family.</p><div class="hopts">${Object.entries(ACCESS).map(([k,l])=>`<label><input type="checkbox" value="${k}"> ${esc(l)}</label>`).join('')}</div><p class="hout" aria-live="polite"></p></div>`);
  const hout=box.querySelector('.hout');
  box.querySelectorAll('.hopts input').forEach(c=>c.onchange=()=>{const on=[...box.querySelectorAll('.hopts input:checked')].map(x=>x.value);if(!on.length){hout.textContent='';apply(w,spec,null,box.querySelector('.cfgrid'));return}
    const who=L.filter(x=>x[5].some(a=>on.includes(a))).map(x=>x[0]),none=L.filter(x=>x[2]!=='dirdeb'&&!x[5].some(a=>on.includes(a))).map(x=>x[0]);
    const fam=on.includes('family')||on.includes('relative')?PAR.filter(p=>who.includes(p[0])).map(p=>p[1]):[];
    apply(w,spec,{ids:['Karan Johar','Aditya Chopra',...who,...fam]},box.querySelector('.cfgrid'));
    hout.innerHTML=`<b>${who.length}</b> of ${L.filter(x=>x[2]!=='dirdeb').length} had at least one. Without any of these: ${none.map(esc).join(', ')||'nobody'}.`})});

// loops are computed, never improvised: every closed circuit of 3–5 people through the seeds, mixing at least two kinds of thread
CFW.push((f,box,w,spec)=>{if(!f.loops)return;const E=spec.edges,N=spec.nodes,adj=new Map();
  const link=(a,b,k)=>{if(a===b)return;[[a,b],[b,a]].forEach(([x,y])=>{if(!adj.has(x))adj.set(x,new Map());const m=adj.get(x);if(!m.has(y))m.set(y,k)})};
  E.forEach(e=>{const a=N[e.a],b=N[e.b];if(e.ev==='c'||e.t==='myth')return;if(a.kind==='person'&&b.kind==='person')link(a.id,b.id,NAME[e.t]||e.t)});
  N.filter(n=>n.kind==='film').forEach(fm=>{const i=N.indexOf(fm),cast=E.filter(e=>(e.a===i||e.b===i)&&e.t==='cast').map(e=>N[e.a===i?e.b:e.a]).filter(n=>n.kind==='person').map(n=>n.id);
    for(let x=0;x<cast.length;x++)for(let y=x+1;y<cast.length;y++)link(cast[x],cast[y],fm.label)});
  const found=[],seen=new Set();
  const FAMK=new Set([NAME.fam,NAME.wed,NAME.div,NAME.kid]);
  f.loops.forEach(seed=>{let per=0;const walk=(path)=>{if(per>=3)return;const u=path[path.length-1];for(const [v] of adj.get(u)||[]){
    if(v===seed&&path.length>=3){const ks=path.map((p,i)=>adj.get(p).get(path[(i+1)%path.length]));const key=[...path].sort().join('|');if(new Set(ks).size>1&&ks.some(k=>!FAMK.has(k))&&ks.filter(k=>!FAMK.has(k)).length>=2&&!seen.has(key)){seen.add(key);found.push({path,ks});per++}continue}
    if(path.includes(v)||path.length>=5)continue;walk([...path,v])}};walk([seed])});
  found.sort((a,b)=>a.path.length-b.path.length);
  if(found.length)box.insertAdjacentHTML('beforeend',`<div class="loops"><h3 class="cotitle">Loops detected</h3><p class="dn">Found by the code: closed circuits through ${f.loops.map(esc).join(', ')} that mix at least two kinds of thread.</p><ol>${found.slice(0,9).map(l=>`<li><span class="stmp v-true">LOOP · ${l.path.length} EDGES</span> ${l.path.map((p,i)=>`<b>${esc(p)}</b> <i>— ${esc(l.ks[i])} →</i>`).join(' ')} <b>${esc(l.path[0])}</b></li>`).join('')}</ol></div>`)});

/* ---------- public ---------- */
window.renderCaseFiles=function(host){if(!host)return;let k=0;const legacy={web3h:1,maheshh:1};
  const order=['webh','rani','web2h','web3h','web4h','web5h','maheshh','genzh','hrithik','znmd','yjhd','animal','ddlj','soty','housefull','cops','spy','deepika','karan','starmaker','nepoverse','beef','saba','soha','deol','glam'];
  order.forEach(id=>{k++;const num=String(k).padStart(3,'0');
    if(legacy[id]){const s=document.querySelector(`section.web[aria-labelledby="${id}"]`);if(s){host.appendChild(s);s.id='file-'+num;s.dataset.num=num}return}
    const f=CF.find(x=>x.id===id);if(f)render(host,f,num)});
  const toc=document.getElementById('filetoc');if(toc)toc.innerHTML=order.map((id,i)=>{const f=CF.find(x=>x.id===id),t=f?f.title:(document.getElementById(id)?.textContent||id);return `<a href="#${id}"><span class="fno">File ${String(i+1).padStart(3,'0')}</span>${esc(t)}</a>`}).join('')};

window.renderActorPage=function(host,name){if(!host||!name)return;const spec=specForPerson(name),cfg=AP[name]||{};
  const first=name.split(' ')[0],films=spec.films,released=films.filter(m=>!m[3].upcoming);
  const rows=Object.entries(spec.shared).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]));
  const behind=films.filter(m=>(m[3].crew||[]).some(c=>c[0]===name&&/assistant/.test(c[1]))&&!(m[3].cast||[]).includes(name));
  const repeat=rows.filter(r=>r[1].length>1).map(r=>r[0]);
  const modes=[['Who came back?',{ids:[name,...repeat,...films.filter(m=>repeat.some(p=>[...(m[3].cast||[]),...(m[3].special||[])].includes(p))).map(m=>'film:'+m[0])]}],
    ['Delete the movies',{noFilms:1}],['Delete '+(SHORT[name]||first),{hide:[name]}],['Love & family',{types:['wed','ptr','div','ex','rom','fam']}]];
  if(spec.edges.some(e=>e.t==='glam'))modes.push(['Who made '+(/^(Shah Rukh|Ranbir|Ranveer|Tiger|Hrithik|Akshay|Salman|Aamir|Varun|Sidharth|Vicky|Kartik|Shahid|Saif|Amitabh|Abhishek|Ajay|Arjun|Ishaan)/.test(name)?'him':'her')+'?',{types:['glam']}]);
  if(spec.shadow.length)modes.push(['The movies '+(/^(Shah Rukh|Ranbir|Ranveer|Tiger|Hrithik|Akshay|Salman|Aamir|Varun|Sidharth|Vicky|Kartik|Shahid|Saif|Amitabh)/.test(name)?'he':'she')+" didn't make",{ids:[name,...spec.shadow.flatMap(m=>['film:'+m[0],...(m[3].cast||[]),...(m[3].crew||[]).map(c=>c[0]),...(m[3].successor||[]).map(x=>x[0])])]}]);
  modes.push(...(cfg.modes||[]));
  if(behind.length)modes.push(['Before the camera',{ids:[name,...behind.map(m=>'film:'+m[0])]}]);
  host.innerHTML=`<section class="web cf actor"><div class="casehead"><span>Dossier</span><span>${released.length} films on file${films.length>released.length?` · ${films.length-released.length} upcoming`:''}</span></div>
   <div class="cfhd"><div><p class="kicker">${esc(name)} ${passport(name).map(l=>`<span class="pass">${LANG[l]}</span>`).join('')}</p><h2 id="actorh">${esc(cfg.q||(SHORT[name]||first)+'. How much of Bollywood?')}</h2>
   <p class="cfdek">${cfg.dek?esc(cfg.dek)+' ':''}${films.length?`${released.length} films. ${rows.length} co-stars and filmmakers. ${repeat.length} came back. Tap a film or a face; press <i>Delete the movies</i> to see who still knows whom.`:'No films on file yet, so this is their web of relationships from the board.'}</p></div>
   <dl class="case"><div><dt>Films</dt><dd>${released.length}</dd></div><div><dt>Co-stars</dt><dd>${rows.length}</dd></div><div><dt>Repeat</dt><dd>${repeat.length}</dd></div></dl></div>
   <div class="cfmodes" role="toolbar" aria-label="Show"><button type="button" aria-pressed="true" data-m="-1">Everything</button>${modes.map((m,i)=>`<button type="button" aria-pressed="false" data-m="${i}">${esc(m[0])}</button>`).join('')}</div>
   <div class="cfgrid"><div class="svgbox cfbox"></div><aside class="cfdoss" aria-live="polite"></aside></div>
   ${(cfg.cards||[]).length?`<div class="cfcards">${cfg.cards.map(([t,b,ev])=>`<article class="cfcard"><span class="stmp ${(STAMP[ev]||STAMP.t)[1]}">${(STAMP[ev]||STAMP.t)[0]}</span><h4>${esc(t)}</h4><p>${esc(b)}</p></article>`).join('')}</div>`:''}
   ${rows.length?`<h3 class="cotitle">Every co-star, and which films</h3><ol class="costars">${rows.map(([p,ts])=>`<li class="${ts.length>1?'rep':''}"><a href="people.html?p=${enc(p)}#actor">${esc(p)}</a><span>${ts.map(esc).join(' · ')}</span></li>`).join('')}</ol>`:''}
   ${escapeHtml(name)}
   ${behind.length?`<p class="cfnote">Behind the camera, before acting: ${behind.map(m=>esc(m[1])).join(', ')}.</p>`:''}</section>`;
  mount(host.querySelector('section'),spec,modes,'actor'+name,name)};

/* ---------- passports: stamps only for industries where they themselves acted ---------- */
const LANG={hi:'🇮🇳 Hindi',te:'🇮🇳 Telugu',ta:'🇮🇳 Tamil',kn:'🇮🇳 Kannada',ml:'🇮🇳 Malayalam',en:'🌎 English',pk:'🇵🇰 Pakistani'};
const acted=(m,n)=>!m[3].upcoming&&((m[3].cast||[]).includes(n)||(m[3].special||[]).includes(n));
function passport(name){const s=new Set();MV.forEach(m=>{if(acted(m,name))s.add(m[3].lang||'hi')});return [...s]}
// shortest real route from a person to a film in each other industry: people ↔ films they acted in, plus relationships
function escapeRoutes(name){const G0=window.__G||[],SRC=window.__GSRC||{},rel={};
  G0.forEach((e,i)=>{if(SRC[i]||e[2]==='c'||e[2]==='g')return;(rel[e[0]]??=[]).push([e[1],e]);(rel[e[1]]??=[]).push([e[0],e])});
  const byP={};MV.forEach(m=>{if(m[3].upcoming)return;[...(m[3].cast||[]),...(m[3].special||[])].forEach(p=>(byP[p]??=[]).push(m))});
  const prev=new Map([[name,null]]),q=[name],found={};
  while(q.length){const u=q.shift();const depth=(()=>{let d=0,x=u;while(prev.get(x)){x=prev.get(x).from;d++}return d})();if(depth>6)break;
    if(u.startsWith('film:')){const m=MVI.get(u.slice(5)),l=m[3].lang||'hi';if(l!=='hi'&&!found[l])found[l]=u;
      [...(m[3].cast||[]),...(m[3].special||[])].forEach(p=>{if(!prev.has(p)){prev.set(p,{from:u,how:m[1]});q.push(p)}})}
    else{(byP[u]||[]).forEach(m=>{const id='film:'+m[0];if(!prev.has(id)){prev.set(id,{from:u,how:'in'});q.push(id)}});
      (rel[u]||[]).forEach(([v,e])=>{if(!prev.has(v)){prev.set(v,{from:u,how:(TY_[e[2]]||'linked')});q.push(v)}})}}
  const out={};Object.entries(found).forEach(([l,id])=>{const path=[];let x=id;while(x){path.unshift(x);const pv=prev.get(x);x=pv&&pv.from}out[l]=path});return out}
const TY_={m:'married',d:'married, later split',x:'dated',e:'engaged',r:'linked',f:'family',b:'friends',v:'feud',k:'💋 on screen',g:'glam team'};
const lab=id=>id.startsWith('film:')?(MVI.get(id.slice(5))||[])[1]:id;
function escapeHtml(name){const r=escapeRoutes(name),ls=Object.keys(r);if(!ls.length)return '';
  return `<div class="escape"><h3 class="cotitle">Escape Bollywood</h3><p class="cfnote">The shortest real route out of Hindi cinema, computed from the graph: films they acted in, then family, marriages, exes and friendships.</p>
   <ul>${ls.map(l=>{const p=r[l],hops=p.filter(x=>!x.startsWith('film:')).length-1;return `<li><span class="pass">${LANG[l]}</span> ${hops===0?'<b>She doesn\'t even need a connector.</b> ':''}${p.map(x=>x.startsWith('film:')?`<i>${esc(lab(x))}</i>`:`<a href="people.html?p=${enc(x)}#actor">${esc(x)}</a>`).join(' → ')}</li>`}).join('')}</ul></div>`}

/* ---------- the biggest bridges: betweenness centrality over the whole graph (Brandes, unweighted) ---------- */
function betweenness(){const ADJ=window.__ADJ||{},V=Object.keys(ADJ),idx=new Map(V.map((v,i)=>[v,i])),N=V.length,adj=V.map(v=>[...new Set((ADJ[v]||[]).map(([w])=>idx.get(w)))]);
  const CB=new Float64Array(N),S=new Int32Array(N),sigma=new Float64Array(N),d=new Int32Array(N),delta=new Float64Array(N),Q=new Int32Array(N);
  for(let s0=0;s0<N;s0++){let top=0,qh=0,qt=0;const P=Array.from({length:N},()=>[]);sigma.fill(0);d.fill(-1);sigma[s0]=1;d[s0]=0;Q[qt++]=s0;
    while(qh<qt){const v=Q[qh++];S[top++]=v;for(const w of adj[v]){if(d[w]<0){d[w]=d[v]+1;Q[qt++]=w}if(d[w]===d[v]+1){sigma[w]+=sigma[v];P[w].push(v)}}}
    delta.fill(0);while(top>0){const w=S[--top];for(const v of P[w])delta[v]+=sigma[v]/sigma[w]*(1+delta[w]);if(w!==s0)CB[w]+=delta[w]}}
  const norm=(N-1)*(N-2);return V.map((v,i)=>[v,CB[i]/norm]).sort((a,b)=>b[1]-a[1])}
window.renderBridges=function(el){const t0=performance.now(),B=betweenness(),top=B.slice(0,15),max=top[0][1];
  el.innerHTML=top.map(([n,b],i)=>`<li><a href="people.html?p=${enc(n)}#actor">${ph(n)?`<img src="${ph(n)}" alt="" loading="lazy">`:`<span class="ini">${esc(n.split(' ').map(w=>w[0]).join('').slice(0,2))}</span>`}<span class="bn">${esc(n)}</span><span class="bar"><i style="width:${(b/max*100).toFixed(1)}%"></i></span><span class="bs">${(b*100).toFixed(1)}%</span></a></li>`).join('');
  el.insertAdjacentHTML('afterend',`<p class="cfnote">Share of all shortest paths between two other people that pass through each name. ${Object.keys(window.__ADJ||{}).length} people on the board.</p>`)};

/* ---------- start ---------- */
const host=document.getElementById('casefiles');if(host)window.renderCaseFiles(host);
const ap=document.getElementById('actor'),pp=new URLSearchParams(location.search).get('p');if(ap&&pp){window.renderActorPage(ap,pp)}
const bl=document.getElementById('bridgelist');if(bl)setTimeout(()=>window.renderBridges(bl),400);
if(location.hash&&(host||ap)){const t=document.getElementById(location.hash.slice(1));if(t)setTimeout(()=>t.scrollIntoView(),60)}
})();
