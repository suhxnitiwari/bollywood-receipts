/* ---------- The Guest List: all of Bollywood in one room ----------
   One full-screen canvas. Seats come from tools/build-world.mjs (assets/world-data.js); rishtas, receipts and the
   shortest-path search come from site.js, so this page and the paper always agree.
   Complexity is discovered, never dumped: the room shows faces and khandaans, and threads only appear for whoever you touch. */
(function(){
'use strict';
const WD=window.WORLD,GG=window.__G,ADJ0=window.__ADJ,GSRC=window.__GSRC||{},GFILMS=window.__GFILMS||{};
const cv=document.getElementById('room');
if(!WD||!GG||!cv)return;
const g=cv.getContext('2d');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const NUM=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const first=n=>n.split(' ')[0];
const initials=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();

/* ---------- the guests ---------- */
const HOUSES=(typeof FAMS!=='undefined'?FAMS:[]),HT={};HOUSES.forEach(f=>HT[f.k]=f.t);
const HC=['#EFA068','#E0703A','#D96B84','#CF4A5A','#F2B88E','#B8566E','#E88A5C','#E6A0B2','#D4573F','#C98A7A','#F0C69E','#A8506A','#E57A6E','#CC6F4A','#F2A3A0','#B86A5C','#E6B07A','#C77C99','#DA8F6E','#9E4A5E','#F0B8B0'];
const houseCol=k=>HC[Math.max(0,HOUSES.findIndex(f=>f.k===k))%HC.length];
const ERA={1940:'#7A3A44',1950:'#94404A',1960:'#B04A48',1970:'#C9583F',1980:'#E0703A',1990:'#EB915A',2000:'#EFA97E',2010:'#E2829A',2020:'#D96B84'};
const eraCol=y=>y?ERA[clamp(Math.floor(y/10)*10,1940,2020)]:'#A08A86';
const NEUTRAL='#CDB1AA';
// what each guest does in the industry: actors, directors, producers, singers, crew; the rest are family & circle
const ROLE_ORDER=['actor','director','producer','singer','crew'];
const ROLE={actor:{c:'#EFA068',k:'Actor'},director:{c:'#D96B84',k:'Director'},producer:{c:'#9DB89A',k:'Producer'},singer:{c:'#A890C2',k:'Singer'},crew:{c:'#7FB3C4',k:'Behind the scenes'},circle:{c:'#8A7470',k:'Family & circle'}};
const CREW_AS={director:'director',producer:'producer','playback singer':'singer',composer:'singer',writer:'crew','assistant director':'crew',creator:'crew',choreographer:'crew'};

const P=WD.people.map((p,i)=>({...p,i,sc:p.s,wx:p.x,wy:p.y,ph:(hash(p.n)%6283)/1000,
  k3:p.t===0?1:p.t===1?.985:.955,                 // parallax: the back of the room moves a touch slower than the front
  a:0,ta:0,m:1,tm:1,s:{x:0,y:0,r:0},arrive:0}));
const BY=new Map(P.map(p=>[p.n,p]));
{const give=(n,r)=>{const p=BY.get(n)||(typeof who==='function'&&BY.get(who(n)));if(p&&r)(p.roles??=new Set()).add(r)};
  (window.MOVIES||[]).forEach(([,,,d])=>{if(!d)return;(d.cast||[]).forEach(n=>give(n,'actor'));(d.special||[]).forEach(n=>give(n,'cameo'));(d.crew||[]).forEach(([n,r])=>give(n,CREW_AS[r]||(/presenter/.test(r)?'producer':'crew')))});
  Object.entries(window.ROLES||{}).forEach(([r,ns])=>ns.forEach(n=>give(n,r)));
  // a cameo or an assistant's credit only counts when it's the whole story
  P.forEach(p=>{const h=p.roles||new Set(),main=['actor','director','producer','singer'].filter(r=>h.has(r));
    p.roles=main.length?main:h.has('cameo')?['actor']:h.has('crew')?['crew']:[];p.works=p.roles.length>0})}
const roleCols=p=>p.works?p.roles.map(r=>ROLE[r].c):[ROLE.circle.c];
const smax=Math.max(...P.map(p=>p.sc)),fmax=Math.max(1,...P.map(p=>p.fd));

/* ---------- the rishtas ---------- */
const ST={   // how each kind of rishta looks: colour, line style, its name in the key and in a sentence
  f:{c:'#F3DCD2',st:'solid',w:1,k:'Family',grp:['family']},
  m:{c:'#EFA068',st:'double',w:1,k:'Married',v:'married',grp:['family','love']},
  d:{c:'#D08A55',st:'break',w:1.2,k:'Married, later split',v:'was married to',grp:['family','love']},
  e:{c:'#EFA068',st:'dash',dash:[5,4],w:1.2,k:'Engaged',v:'was engaged to',grp:['love']},
  x:{c:'#D7363F',st:'break',w:1.5,k:'Dated',v:'dated',grp:['love']},
  r:{c:'#D7363F',st:'dash',dash:[1.5,4.5],w:1.6,k:'Linked (rumoured)',v:'was linked to',grp:['love']},
  k:{c:'#D96B84',st:'dash',dash:[3,4],w:1.2,k:'Kissed on screen',v:'kissed',grp:['love']},
  b:{c:'#9DB89A',st:'solid',w:1.3,k:'Friends',v:'is friends with',grp:['friends']},
  v:{c:'#F2703A',st:'jag',w:1.3,k:'Feud',v:'feuded with',grp:['feuds']},
  g:{c:'#A890C2',st:'dash',dash:[6,3],w:1,k:'Glam team',v:'shares a glam team with',grp:['films']},
  s:{c:'#E8B07A',st:'dash',dash:[8,3,2,3],w:1,k:'Replaced in a film',v:'was swapped with',grp:['films']},
  c:{c:'#C9AFA8',st:'solid',w:.8,k:'Worked together',v:'worked with',grp:['films']},
  w:{c:'#D9B46A',st:'dash',dash:[9,2.5],w:.9,k:'Directed',v:'directed',grp:['films']},
  p:{c:'#EBDDC6',st:'dash',dash:[2.5,2.5],w:.8,k:'Sang for',v:'sang for',grp:['films']},
  o:{c:'#C9AFA8',st:'solid',w:.7,k:'Cameo',v:'shared a cameo with',grp:['films']},
  q:{c:'#C9AFA8',st:'solid',w:.7,k:'Song',v:'shared a song with',grp:['films']}};
const TAG={f:'FAMILY',m:'MARRIED',d:'MARRIED · SPLIT',e:'ENGAGED',x:'DATED',r:'LINKED',k:'ON-SCREEN KISS',b:'FRIENDS',v:'FEUD',g:'GLAM TEAM',s:'REPLACED',c:'WORKED TOGETHER',w:'DIRECTED',p:'SANG FOR',o:'CAMEO',q:'SONG'};
const E=GG.map((e,i)=>({i,a:BY.get(e[0]),b:BY.get(e[1]),t:e[2],d:e[3]||'',y:e[4],v:e[5]||'t',film:!!GSRC[i],bow:((hash(e[0]+e[1])%2)?1:-1)*(.06+(hash(e[1]+e[0])%60)/1000)})).filter(e=>e.a&&e.b&&e.a!==e.b);
P.forEach(p=>{p.E=[];});E.forEach(e=>{e.a.E.push(e);e.b.E.push(e)});
const other=(e,p)=>e.a===p?e.b:e.a;
const personal=e=>!e.film&&!'oqwp'.includes(e.t);
const MOV=new Map((window.MOVIES||[]).map(([id,title,year])=>['film:'+id,[title,year]]));
// "1999–2002; she later alleged…" → "1999–2002". Films answer with their title and year.
function when(e){if(e.film){const f=(GFILMS[e.i]||[]).map(id=>MOV.get(id)).filter(Boolean);if(f.length>1)return `${f.length} films together`;return f.length?`${f[0][0]}, ${f[0][1]}`:(e.y?String(e.y):'')}
  const d=e.d.split(';')[0].trim();if(/\d{4}/.test(d)&&d.length<=30)return d;if(e.t==='f'&&d&&d.length<=30)return d;return e.y?String(e.y):''}

/* ---------- state ---------- */
const S={mode:'room',sel:null,path:null,hover:null,filter:'all',verified:false,color:'role',size:'gossip',stateAt:0};
const shown=e=>(S.filter==='all'||ST[e.t].grp.includes(S.filter))&&(!S.verified||(e.v==='t'&&e.t!=='r'));

/* ---------- portraits: circular, cached, loaded as the camera reaches them ---------- */
const FACE=new Map();
function face(p){if(!p.f)return null;let f=FACE.get(p.n);if(f)return f.ready?f.cv:null;
  f={ready:false};FACE.set(p.n,f);const im=new Image();im.decoding='async';
  im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.beginPath();x.arc(64,64,64,0,7);x.clip();
    x.filter='saturate(.9) contrast(1.06)';x.drawImage(im,0,0,128,128);x.filter='none';
    const v=x.createRadialGradient(64,64,40,64,64,64);v.addColorStop(0,'rgba(22,7,11,0)');v.addColorStop(1,'rgba(22,7,11,.45)');x.fillStyle=v;x.fillRect(0,0,128,128);
    f.cv=c;f.ready=true};
  im.src='assets/faces/'+p.f+'.webp';return null}
const MONO=new Map();
function mono(p,col){const key=p.n+col;let c=MONO.get(key);if(c)return c;c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');
  x.fillStyle='#33111A';x.beginPath();x.arc(48,48,48,0,7);x.fill();x.fillStyle=col;x.textAlign='center';x.textBaseline='middle';
  x.font='italic 500 38px "Bodoni Moda",Georgia,serif';x.fillText(initials(p.n),48,51);MONO.set(key,c);return c}
const GLOW=new Map();
function glow(col){let s=GLOW.get(col);if(s)return s;s=document.createElement('canvas');s.width=s.height=64;const x=s.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,col);gr.addColorStop(.25,col+'AA');gr.addColorStop(.6,col+'22');gr.addColorStop(1,col+'00');x.fillStyle=gr;x.fillRect(0,0,64,64);GLOW.set(col,s);return s}
const GRAIN=(()=>{const c=document.createElement('canvas');c.width=c.height=180;const x=c.getContext('2d'),d=x.createImageData(180,180);
  for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.random()<.5?18:0}x.putImageData(d,0,0);return c})();
// CRT scanlines for the projection-room console
const SCAN=(()=>{const c=document.createElement('canvas');c.width=4;c.height=4;const x=c.getContext('2d');x.fillStyle='rgba(0,0,0,.22)';x.fillRect(0,0,4,1);return c})();let SPAT=null;
// a four-point filmi sparkle
function sparkle(x,y,R,col){g.fillStyle=col;g.beginPath();g.moveTo(x,y-R);g.quadraticCurveTo(x,y,x+R,y);g.quadraticCurveTo(x,y,x,y+R);g.quadraticCurveTo(x,y,x-R,y);g.quadraticCurveTo(x,y,x,y-R);g.fill()}
const diamond=(x,y,R)=>{g.beginPath();g.moveTo(x,y-R);g.lineTo(x+R,y);g.lineTo(x,y+R);g.lineTo(x-R,y);g.closePath()};

/* ---------- camera ---------- */
let W=0,H=0,dpr=1,dprCap=1.5,fitZ=1;
const cam={x:0,y:0,z:1},goal={x:0,y:0,z:1};let rate=5,vel=null;
const stage=()=>W>760?{x:W/2+70,y:H/2+10}:{x:W/2,y:H/2-70};
function toScreen(p){const c=stage(),k=p.k3??1;return {x:c.x+(p.wx-cam.x)*cam.z*k,y:c.y+(p.wy-cam.y)*cam.z*k}}
function toWorld(sx,sy){const c=stage();return {x:cam.x+(sx-c.x)/cam.z,y:cam.y+(sy-c.y)/cam.z}}
function size(){if(!innerWidth||!innerHeight)return;   // a hidden window reports 0 × 0; fitting to that would zero the camera
  W=innerWidth;H=innerHeight;dpr=Math.min(dprCap,devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const prev=fitZ;fitZ=Math.min((W>760?W-640:W)/1900,(H-(W>760?60:200))/1900)*1.12;fitZ=Math.max(fitZ,Math.min(W,H)/2600);
  if(prev!==1&&prev){cam.z*=fitZ/prev;goal.z*=fitZ/prev}BG=null}
const zmin=()=>fitZ*.35,zmax=()=>fitZ*10;
function flyTo(x,y,z,r=5,lo=zmin()){goal.x=x;goal.y=y;goal.z=clamp(z,lo,zmax());rate=r;vel=null}
// the open part of the screen, clear of the panels and the captions: framed shots land here
function frameBox(){const path=S.mode==='path';
  if(document.body.classList.contains('gl-demo'))return {x0:W*.14,x1:W*.86,y0:H*.2,y1:H*.8};
  const box=el=>el&&!el.hidden&&el.getClientRects().length?el.getBoundingClientRect():null;
  if(W>760){const key=box(document.getElementById('key')),bar=box(document.querySelector('.gl-show'));
    return {x0:430,x1:Math.min(W-(S.mode==='person'?350:290),key?key.left-36:W),y0:path?250:110,y1:Math.min(H-(path?110:90),bar?bar.top-40:H)}}
  // phones: measure the real gap between the title and whichever card is open
  const hb=box(document.querySelector('.gl-brand')),cb=box(document.getElementById('spotted'))||box(document.getElementById('dossier'))||box(document.querySelector('.gl-ask'));
  const y0=Math.max(path?170:120,hb?hb.bottom+36:0),y1=Math.min(H*(S.mode==='room'?.6:.62),cb?cb.top-30:H);
  return {x0:24,x1:W-24,y0,y1:Math.max(y1,y0+140)}}
function fitPeople(ps,pad=1){if(!ps||!ps.length)return;const xs=ps.map(p=>p.wx),ys=ps.map(p=>p.wy);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),B=frameBox();
  const demo=document.body.classList.contains('gl-demo'),z=clamp(Math.min((B.x1-B.x0)/Math.max(demo?40:80,x1-x0),(B.y1-B.y0)/Math.max(demo?40:80,y1-y0))*pad,fitZ*.12,Math.min(zmax(),fitZ*(demo?10:4.5))),c=stage();
  flyTo((x0+x1)/2-((B.x0+B.x1)/2-c.x)/z,(y0+y1)/2-((B.y0+B.y1)/2-c.y)/z,z,5,fitZ*.12)}
const home=()=>flyTo(0,0,fitZ,3.2);

/* ---------- how big and how bright each guest is right now ---------- */
function baseR(p){const k=p.works?1:.45;if(S.size==='equal')return 7*(p.works?1:.7);const v=S.size==='films'?p.fd/fmax:p.sc/smax;return (3.2+33*Math.pow(v,.72))*k}
function colOf(p){return S.color==='role'?roleCols(p)[0]:S.color==='house'?(p.k?houseCol(p.k):NEUTRAL):S.color==='era'?eraCol(p.yr):NEUTRAL}
const TIERA=[1,.8,.4];
function targets(){const m=S.mode,hv=S.hover;
  const lit=new Set();if(S.filter!=='all'||S.verified){E.forEach(e=>{if(shown(e)&&(S.filter!=='films'||!S.verified)){lit.add(e.a);lit.add(e.b)}})}
  P.forEach(p=>{p.tm=1;
    if(m==='room'){p.ta=TIERA[p.t];if(lit.size&&!lit.has(p))p.ta*=.22}
    else if(m==='person'){p.ta=.055}
    else p.ta=.045});
  if(m==='person'){const s=S.sel;s.ta=1;s.tm=1.9;s.E.forEach(e=>{if(!shown(e))return;const o=other(e,s);if(personal(e)){o.ta=1;o.tm=Math.max(o.tm,1.12)}else o.ta=Math.max(o.ta,.32)})}
  if(m==='path'){const R=S.path;R.ids.forEach((p,i)=>{if(R.reached.has(p)){p.ta=1;p.tm=1.75;p.E.forEach(e=>{if(personal(e)){const o=other(e,p);if(!R.ids.includes(o))o.ta=Math.max(o.ta,.2)}})}})}
  if(hv&&!(m==='path'&&S.seq)){hv.ta=1;hv.tm*=1.22;hv.E.forEach(e=>{if(shown(e)){const o=other(e,hv);o.ta=Math.max(o.ta,personal(e)?.95:.5)}})}}
function setMode(m){S.mode=m;S.stateAt=performance.now();targets()}

/* ---------- drawing ---------- */
let BG=null;
function background(){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#12050C');gr.addColorStop(.45,'#22070F');gr.addColorStop(.78,'#3A0B14');gr.addColorStop(1,'#561318');x.fillStyle=gr;x.fillRect(0,0,W,H);
  // the sun has just gone under: a low glow of blood orange, rose above it
  gr=x.createRadialGradient(W*.5,H*1.12,0,W*.5,H*1.12,Math.max(W,H)*.7);gr.addColorStop(0,'rgba(232,112,58,.42)');gr.addColorStop(.35,'rgba(200,48,52,.22)');gr.addColorStop(.7,'rgba(160,48,84,.08)');gr.addColorStop(1,'rgba(160,48,84,0)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  gr=x.createRadialGradient(W*.82,H*.08,0,W*.82,H*.08,W*.45);gr.addColorStop(0,'rgba(150,40,80,.16)');gr.addColorStop(1,'rgba(150,40,80,0)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  gr=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.4,W/2,H/2,Math.max(W,H)*.8);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(8,2,4,.5)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  return c}
function quad(e){const A=e.a.s,B=e.b.s,dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,k=(S.mode==='path'&&e.pb!=null?e.pb:e.bow)*L;
  return {ax:A.x,ay:A.y,bx:B.x,by:B.y,cx:(A.x+B.x)/2+nx*k,cy:(A.y+B.y)/2+ny*k,nx,ny,L}}
const qpt=(q,u)=>{const v=1-u;return [v*v*q.ax+2*v*u*q.cx+u*u*q.bx,v*v*q.ay+2*v*u*q.cy+u*u*q.by]};
// trace an edge from one face's rim to the other's; prog < 1 draws only the first part, starting from `from`
function trace(e,q,prog=1,from=e.a,off=0,jag=0){const ra=(e.a.s.r+2)/q.L,rb=(e.b.s.r+2)/q.L;if(ra+rb>=.98)return false;
  const fwd=from===e.a,u0=fwd?ra:1-rb,u1=fwd?1-rb:ra,end=u0+(u1-u0)*prog,n=Math.max(6,Math.min(28,Math.round(q.L*Math.abs(end-u0)/10)));
  g.beginPath();for(let i=0;i<=n;i++){const u=u0+(end-u0)*i/n,[x,y]=qpt(q,u),j=jag&&i>0&&i<n?(i%2?jag:-jag):0;const ox=q.nx*(off+j),oy=q.ny*(off+j);i?g.lineTo(x+ox,y+oy):g.moveTo(x+ox,y+oy)}return true}
function drawEdge(e,alpha,wmul=1,prog=1,from=e.a){if(alpha<.01)return;const st=ST[e.t],q=quad(e);if(q.L<3)return;
  g.globalAlpha=alpha;g.strokeStyle=st.c;g.lineWidth=st.w*wmul;g.setLineDash([]);
  if(prog<1){if(trace(e,q,prog,from)){g.lineWidth=2.2*wmul;g.stroke()}return}
  if(st.st==='double'){g.lineWidth=st.w*wmul*.9;if(trace(e,q,1,from,1.6*wmul))g.stroke();if(trace(e,q,1,from,-1.6*wmul))g.stroke();return}
  if(st.st==='jag'){if(trace(e,q,1,from,0,2.4*wmul))g.stroke();return}
  if(st.st==='dash')g.setLineDash(st.dash.map(v=>v*Math.max(1,wmul*.8)));
  if(st.st==='break'){const span=q.L*1.02;g.setLineDash([span*.46,span*.06,span])}
  if(trace(e,q,1,from))g.stroke();g.setLineDash([])}
function edgeTip(e,prog,from){const q=quad(e),ra=(e.a.s.r+2)/q.L,rb=(e.b.s.r+2)/q.L,fwd=from===e.a,u0=fwd?ra:1-rb,u1=fwd?1-rb:ra;return qpt(q,u0+(u1-u0)*prog)}

const FLASH=[];let GPAT=null;
function flash(p){if(!RM)FLASH.push({p,t:performance.now()})}
const setSpacing=(v)=>{if('letterSpacing' in g)g.letterSpacing=v};

function draw(now,dt){
  // camera: a critically damped glide toward the goal, plus the coast after a fling
  if(vel&&!drag){goal.x-=vel.x*dt/1000/cam.z;goal.y-=vel.y*dt/1000/cam.z;cam.x=goal.x;cam.y=goal.y;const f=Math.pow(.04,dt/1000);vel.x*=f;vel.y*=f;if(Math.hypot(vel.x,vel.y)<8)vel=null}
  const k=1-Math.exp(-dt/1000*rate);cam.x+=(goal.x-cam.x)*k;cam.y+=(goal.y-cam.y)*k;cam.z=Math.exp(Math.log(cam.z)+(Math.log(goal.z)-Math.log(cam.z))*k);
  if(S.seq)S.seq.tick(now);
  if(!W){size();if(!W)return}
  g.setTransform(dpr,0,0,dpr,0,0);if(!BG)BG=background();g.globalAlpha=1;g.drawImage(BG,0,0,W,H);
  const t=now/1000,zr=cam.z/fitZ,focus=S.mode!=='room';
  // the studio-logo sunburst: deco rays turning slowly behind the whole room
  {const o=toScreen({wx:0,wy:0}),R=Math.hypot(W,H)*1.2,n=40,rot=RM?0:t*.012;g.globalAlpha=.016;g.fillStyle='#F2A070';g.beginPath();
    for(let i=0;i<n;i++){const a0=rot+i*2*Math.PI/n,a1=a0+Math.PI/n*.4;g.moveTo(o.x,o.y);g.lineTo(o.x+Math.cos(a0)*R,o.y+Math.sin(a0)*R);g.lineTo(o.x+Math.cos(a1)*R,o.y+Math.sin(a1)*R);g.closePath()}g.fill();
  // console range rings with tick marks, anchored to the room
    g.strokeStyle='#EFA068';g.lineWidth=.8;for(const [k,rr] of [[0,520],[1,1000],[2,1480]]){const rad=rr*cam.z;if(rad<40)continue;g.globalAlpha=.09;g.beginPath();g.arc(o.x,o.y,rad,0,7);g.stroke();
      g.globalAlpha=.16;g.beginPath();const step=rad>600?1:rad>250?2:5;for(let d=0;d<360;d+=step){const a=d*Math.PI/180-rot*2*(k%2?-1:1),L=d%30===0?9:d%10===0?5:2.5;
        g.moveTo(o.x+Math.cos(a)*rad,o.y+Math.sin(a)*rad);g.lineTo(o.x+Math.cos(a)*(rad-L),o.y+Math.sin(a)*(rad-L))}g.stroke()}}
  // khandaan tables: a warm pool of light under each house, and its name above it
  const tableA=focus?.25:clamp(1.25-zr*.18,.25,1);
  WD.khandaans.forEach(h=>{const s=toScreen({wx:h.x,wy:h.y}),r=Math.max(40,(h.r+70)*cam.z),col=houseCol(h.k);
    if(s.x<-r||s.x>W+r||s.y<-r||s.y>H+r)return;
    const rr=Math.max(26,(h.r+46)*cam.z);g.globalAlpha=tableA*.35;g.strokeStyle=col;g.lineWidth=1;g.setLineDash([2,5]);g.beginPath();g.arc(s.x,s.y,rr,0,7);g.stroke();g.setLineDash([]);
    g.globalAlpha=tableA*.18;g.beginPath();g.arc(s.x,s.y,rr+5,0,7);g.stroke();
    g.globalAlpha=tableA*.6;g.fillStyle=col;for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;diamond(s.x+Math.cos(a)*(rr+2.5),s.y+Math.sin(a)*(rr+2.5),3);g.fill()}});
  // where everyone sits this frame
  const drift=RM?0:1.4;
  for(const p of P){const s=toScreen(p);p.s.x=s.x+Math.sin(t*.6+p.ph)*drift;p.s.y=s.y+Math.cos(t*.5+p.ph*1.3)*drift;
    const kk=1-Math.exp(-dt/1000*(S.seq?9:6));p.a+=(p.ta*p.arrive-p.a)*kk;p.m+=(p.tm-p.m)*kk;
    p.s.r=baseR(p)*Math.pow(cam.z,.8)*p.m*(.85+.15*p.arrive)}
  spread(dt);
  g.lineCap='round';g.lineJoin='round';
  // ---------- threads ----------
  if(S.mode==='room'){
    if(S.filter==='all'&&!S.verified){g.globalAlpha=.07;g.strokeStyle='#EFA068';g.lineWidth=.7;g.beginPath();   // the barest hint of who married whom
      for(const e of E)if((e.t==='m'||e.t==='f')&&e.a.a>.3&&e.b.a>.3){g.moveTo(e.a.s.x,e.a.s.y);g.lineTo(e.b.s.x,e.b.s.y)}g.stroke()}
    else if(S.filter==='films'){g.globalAlpha=.05;g.strokeStyle='#F0D6CC';g.lineWidth=.5;g.beginPath();for(const e of E)if(shown(e)){g.moveTo(e.a.s.x,e.a.s.y);g.lineTo(e.b.s.x,e.b.s.y)}g.stroke()}
    else for(const e of E)if(shown(e))drawEdge(e,.42,1)}
  if(S.mode==='person'){const s=S.sel,fade=clamp((now-S.stateAt)/450,0,1);
    g.globalAlpha=.1*fade;g.strokeStyle='#F0D6CC';g.lineWidth=.6;g.beginPath();for(const e of s.E)if(!personal(e)&&shown(e)){g.moveTo(e.a.s.x,e.a.s.y);g.lineTo(e.b.s.x,e.b.s.y)}g.stroke();
    for(const e of s.E)if(personal(e)&&shown(e))drawEdge(e,.95*fade,1.25)}
  if(S.mode==='path'){const R=S.path;
    R.ids.forEach(p=>{if(!R.reached.has(p))return;for(const e of p.E)if(personal(e)&&!R.es.includes(e))drawEdge(e,.12,.8)});
    R.es.forEach((e,i)=>{const pr=R.prog[i];if(pr<=0)return;
      // the thread itself, with a soft underglow so it reads against the dark
      g.save();if(!RM){g.shadowColor=ST[e.t].c;g.shadowBlur=12}drawEdge(e,1,2,pr,R.ids[i]);g.restore();
      if(pr<1){const [x,y]=edgeTip(e,pr,R.ids[i]);g.globalAlpha=.35;g.drawImage(glow('#F2703A'),x-12,y-12,24,24);g.globalAlpha=1;sparkle(x,y,9,'#FFE2CC');sparkle(x,y,4,'#FFFFFF')}})}
  if(S.hover&&!(S.mode==='path'&&S.seq)){const h=S.hover;for(const e of h.E)if(shown(e)&&!(S.mode==='person'&&(h===S.sel)))drawEdge(e,personal(e)?.6:.14,personal(e)?1:.6)}
  // ---------- faces ----------
  const order=P.filter(p=>p.a>.012).sort((a,b)=>a.m-b.m||b.t-a.t);
  for(const p of order){const {x,y,r}=p.s;if(x<-r-20||x>W+r+20||y<-r-20||y>H+r+20)continue;const col=colOf(p);
    if(r<4.6){const br=Math.max(1.6,r*.8);g.globalAlpha=p.a;g.fillStyle='#12050A';diamond(x,y,br+1.2);g.fill();g.fillStyle=col;g.globalAlpha=p.a*.85;diamond(x,y,br);g.fill();continue}
    const img=face(p);g.globalAlpha=p.a;
    if(img)g.drawImage(img,x-r,y-r,2*r,2*r);else if(r>=9)g.drawImage(mono(p,col),x-r,y-r,2*r,2*r);else{g.fillStyle=col;g.beginPath();g.arc(x,y,r*.55,0,7);g.fill()}
    if(S.color==='role'){const cs=roleCols(p),n=cs.length,gap=n>1?.12:0;g.lineWidth=p.m>1.6?2.6:r>14?2:1.4;
      cs.forEach((c,k)=>{const a0=-Math.PI/2+k*2*Math.PI/n+gap/2;g.strokeStyle=c;g.beginPath();g.arc(x,y,r+.8,a0,a0+2*Math.PI/n-gap);g.stroke()})}
    else{g.strokeStyle=p.m>1.6?'#F2703A':col;g.lineWidth=p.m>1.6?2.2:r>14?1.4:1;g.beginPath();g.arc(x,y,r+.5,0,7);g.stroke()}
    if(r>13){g.globalAlpha=p.a*.55;g.strokeStyle='#EFA068';g.lineWidth=.8;g.beginPath();g.arc(x,y,r+4,0,7);g.stroke();g.globalAlpha=p.a}
    if(p.m>1.6||p===S.hover){const n=Math.max(14,Math.round(r*.95)),br=r+(r>13?9:6),star=p.m>1.6;
      // marquee bulbs chasing round the frame
      for(let i=0;i<n;i++){const a=i/n*2*Math.PI-Math.PI/2,on=RM?1:.35+.65*(.5+.5*Math.sin(t*5-i*1.3)),bx=x+Math.cos(a)*br,by=y+Math.sin(a)*br;
        g.globalAlpha=p.a*(star?on:on*.6);g.fillStyle=star?'#FFD9A8':'#F3DCD2';g.beginPath();g.arc(bx,by,star?1.9:1.4,0,7);g.fill()}
      // and a slow console reticle around the ones on the thread
      if(star){const rr=br+8,rot=RM?0:t*.6;g.globalAlpha=p.a*.7;g.strokeStyle='#F2703A';g.lineWidth=1.2;
        for(let k=0;k<4;k++){const a0=rot+k*Math.PI/2;g.beginPath();g.arc(x,y,rr,a0,a0+.55);g.stroke()}
        g.globalAlpha=p.a*.5;g.beginPath();for(let k=0;k<4;k++){const a=k*Math.PI/2;g.moveTo(x+Math.cos(a)*(rr+3),y+Math.sin(a)*(rr+3));g.lineTo(x+Math.cos(a)*(rr+9),y+Math.sin(a)*(rr+9))}g.stroke()}
      g.globalAlpha=p.a}}
  // paparazzi: a white bloom and a ring when someone is found
  for(let i=FLASH.length-1;i>=0;i--){const f=FLASH[i],u=(now-f.t)/650;if(u>1){FLASH.splice(i,1);continue}const {x,y,r}=f.p.s;
    g.globalAlpha=(1-u)*.85;const gs=r*(3+u*5);g.drawImage(glow('#FFFFFF'),x-gs/2,y-gs/2,gs,gs);g.globalAlpha=(1-u)*.7;g.strokeStyle='#FFEEE6';g.lineWidth=1.5;g.beginPath();g.arc(x,y,r+4+u*30,0,7);g.stroke()}
  drawLabels(now,zr);
  // dust in the projector beam, then grain over everything
  g.globalAlpha=.35;g.fillStyle=SPAT||(SPAT=g.createPattern(SCAN,'repeat'));g.fillRect(0,0,W,H);
  if(!RM){if(Math.sin(t*1.7)>.97){const sx=W*(.15+.7*((Math.sin(t*13.1)+1)/2));g.globalAlpha=.08;g.fillStyle='#FFE2CC';g.fillRect(sx,0,1,H)}
    g.globalAlpha=.55;const ox=-(Math.floor(t*14)%7)*23%180,oy=-(Math.floor(t*14)%5)*37%180;g.fillStyle=GPAT||(GPAT=g.createPattern(GRAIN,'repeat'));g.save();g.translate(ox,oy);g.fillRect(-ox,-oy,W,H);g.restore()}
  g.globalAlpha=1}

/* families sit at one table, so close that once the camera leans in on a thread they land in each other's laps:
   the faces in focus are nudged apart on screen (frames, bulbs and reticles included), and drift home when the focus goes */
function spread(dt){const F=S.mode==='room'?[]:P.filter(p=>p.ta>=.9&&p.a>.2),halo=p=>p.m>1.6?20:p===S.hover?10:6;
  for(const p of P){p.tx=0;p.ty=0}
  for(let it=0;it<10;it++)for(let i=0;i<F.length;i++)for(let j=i+1;j<F.length;j++){const a=F[i],b=F[j];
    let dx=(b.s.x+b.tx)-(a.s.x+a.tx),dy=(b.s.y+b.ty)-(a.s.y+a.ty),d=Math.hypot(dx,dy);const need=a.s.r+b.s.r+halo(a)+halo(b)+22+(d>.5?34*Math.abs(dy)/d:0);   // stacked faces also need room for the name between them
    if(d>=need)continue;if(d<.5){const ang=a.ph+b.ph;dx=Math.cos(ang);dy=Math.sin(ang);d=1}
    const push=(need-d)/2/d;a.tx-=dx*push;a.ty-=dy*push;b.tx+=dx*push;b.ty+=dy*push}
  const k=1-Math.exp(-dt/1000*7);
  for(const p of P){p.ox=(p.ox||0)+(p.tx-(p.ox||0))*k;p.oy=(p.oy||0)+(p.ty-(p.oy||0))*k;p.s.x+=p.ox;p.s.y+=p.oy}}

/* names: the room only labels who matters at this zoom, placed so no two names collide */
function drawLabels(now,zr){const boxes=[],R=S.path,focus=S.mode!=='room';
  // the title block, the key, the pills, the zoom and any open card are no-go zones for names and tags
  for(const el of [document.querySelector('.gl-brand'),document.getElementById('spotted'),document.getElementById('dossier'),document.getElementById('key'),document.querySelector('.gl-show'),document.querySelector('.gl-zoom'),skipBtn])
    if(el&&!el.hidden&&el.getClientRects().length){const b=el.getBoundingClientRect();boxes.push([b.left-6,b.top-6,b.right+6,b.bottom+6])}
  const fits=(x0,y0,x1,y1)=>{for(const b of boxes)if(x0<b[2]&&x1>b[0]&&y0<b[3]&&y1>b[1])return false;boxes.push([x0,y0,x1,y1]);return true};
  g.textAlign='center';g.textBaseline='top';
  // khandaan names first, in the open space above each table
  const hA=focus?.14:clamp(1.15-zr*.22,0,.6);
  if(hA>.02){g.font='italic 500 12.5px "Bodoni Moda",Georgia,serif';setSpacing('2.5px');
    WD.khandaans.forEach(h=>{const s=toScreen({wx:h.x,wy:h.y-h.r-30}),txt=h.t.toUpperCase(),w=g.measureText(txt).width;
      if(!fits(s.x-w/2,s.y,s.x+w/2,s.y+16))return;g.globalAlpha=hA;g.fillStyle=houseCol(h.k);g.fillText(txt,s.x,s.y)});setSpacing('0px')}
  if(focus)P.forEach(p=>{if(p.ta>=.9&&p.a>.2){const {x,y,r}=p.s;boxes.push([x-r-2,y-r-2,x+r+2,y+r+2])}});
  const want=[];
  if(S.mode==='path')R.ids.forEach((p,i)=>{if(R.reached.has(p))want.push([p,3])});
  if(S.mode==='person'){want.push([S.sel,3]);S.sel.E.forEach(e=>{const o=other(e,S.sel);if(personal(e)&&shown(e))want.push([o,1])})}
  if(S.hover)want.push([S.hover,2]);
  if(!focus)P.forEach(p=>{if(p.a>.35&&(p.t===0||p.s.r>=13))want.push([p,0])});
  else P.forEach(p=>{if(p.a>.5&&p.s.r>=16&&S.mode!=='path')want.push([p,0])});
  const seen=new Set();
  want.sort((a,b)=>b[1]-a[1]||b[0].s.r-a[0].s.r).forEach(([p,lvl])=>{if(seen.has(p))return;seen.add(p);const {x,y,r}=p.s;if(x<-50||x>W+50||y<-20||y>H+20)return;
    const big=lvl>=2,txt=p.n.toUpperCase();g.font=big?'600 13.5px "Bodoni Moda",Georgia,serif':'500 10px "IBM Plex Mono",monospace';setSpacing(big?'1.5px':'1.2px');
    const w=g.measureText(txt).width,hgt=big?15:12,gap=big?7:5;let lx=x,ly=y+r+gap;
    if(!fits(lx-w/2-3,ly,lx+w/2+3,ly+hgt)){if(lvl<3)return;
      // someone on the thread always gets a name: try above, beside, then further out
      const tries=[[x,y-r-gap-hgt],[x+r+gap+w/2,y-hgt/2],[x-r-gap-w/2,y-hgt/2],[x,y+r+gap+hgt+4],[x,y-r-gap-2*hgt-4],[x+r+gap+w/2,y+hgt/2+3],[x-r-gap-w/2,y+hgt/2+3],[x+r+gap+w/2,y-hgt*1.5-3],[x-r-gap-w/2,y-hgt*1.5-3]];
      let done=false;for(const [tx,ty] of tries)if(fits(tx-w/2-3,ty,tx+w/2+3,ty+hgt)){lx=tx;ly=ty;done=true;break}
      if(!done)boxes.push([lx-w/2-3,ly,lx+w/2+3,ly+hgt])}
    g.globalAlpha=Math.min(1,p.a*(lvl?1.1:.95));
    g.fillStyle=lvl===3?'#FFF0E8':lvl===2?'#FCEAE0':'rgba(248,230,220,.82)';g.shadowColor='#000';g.shadowBlur=6;g.fillText(txt,lx,ly);g.shadowBlur=0;
    if(lvl===3&&S.mode==='person'&&p===S.sel&&p.k){g.font='500 9px "IBM Plex Mono",monospace';setSpacing('2px');g.fillStyle='#EFA068';g.fillText((HT[p.k]||'').toUpperCase(),x,ly+18)}});
  setSpacing('0px');
  // receipts tags on the thread: what the rishta is called and when
  const clear=(x0,y0,x1,y1)=>{for(const b of boxes)if(x0<b[2]&&x1>b[0]&&y0<b[3]&&y1>b[1])return false;return true};
  if(S.mode==='path')R.es.forEach((e,i)=>{if(R.prog[i]<1)return;const q=quad(e),a=clamp((now-(R.doneAt[i]||0))/300,0,1);
    const top=TAG[e.t],sub=when(e);g.font='600 10px "IBM Plex Mono",monospace';setSpacing('2px');const w1=g.measureText(top).width;g.font='italic 400 12.5px "Bodoni Moda",Georgia,serif';setSpacing('0px');
    const w2=sub?g.measureText(sub).width:0,w=Math.max(w1,w2)+26,h=sub?40:24;
    // slide along the thread first; if it's too short, step off to the side on a leader line
    let mx,my,lead=null;const ok=(px,py)=>px-w/2>=6&&px+w/2<=W-6&&py-h/2>=6&&py+h/2<=H-6&&clear(px-w/2,py-h/2,px+w/2,py+h/2);
    for(const t of [.5,.38,.62,.28,.72,.2,.8]){const [px,py]=qpt(q,t);if(ok(px,py)){mx=px;my=py;break}}
    if(mx===undefined){const [cx,cy]=qpt(q,.5),[ax,ay]=qpt(q,.45),[bx,by]=qpt(q,.55);let nx=ay-by,ny=bx-ax;const L=Math.hypot(nx,ny)||1;nx/=L;ny/=L;
      out:for(const d of [w/2+18,w/2+48,w+40,w+90])for(const sd of [1,-1]){const px=cx+nx*d*sd,py=cy+ny*d*sd;if(ok(px,py)){mx=px;my=py;lead=[cx,cy];break out}}
      if(mx===undefined){mx=cx;my=cy}}
    boxes.push([mx-w/2,my-h/2,mx+w/2,my+h/2]);
    if(lead){g.globalAlpha=.6*a;g.strokeStyle=ST[e.t].c;g.lineWidth=1;g.beginPath();g.moveTo(lead[0],lead[1]);g.lineTo(mx,my);g.stroke()}
    g.globalAlpha=.94*a;g.fillStyle='#1C070D';g.strokeStyle=ST[e.t].c;g.lineWidth=1;g.fillRect(mx-w/2,my-h/2,w,h);g.strokeRect(mx-w/2+.5,my-h/2+.5,w-1,h-1);
    g.globalAlpha=.45*a;g.strokeRect(mx-w/2+3.5,my-h/2+3.5,w-7,h-7);g.globalAlpha=a;g.fillStyle=ST[e.t].c;for(const [cx,cy] of [[mx-w/2,my],[mx+w/2,my]]){diamond(cx,cy,3.2);g.fill()}
    g.globalAlpha=a;g.textBaseline='middle';g.font='600 10px "IBM Plex Mono",monospace';setSpacing('2px');g.fillStyle=ST[e.t].c;g.fillText(top,mx,my-(sub?8:0));setSpacing('0px');
    if(sub){g.font='italic 400 12.5px "Bodoni Moda",Georgia,serif';g.fillStyle='#F8E6DC';g.fillText(sub,mx,my+8)}g.textBaseline='top'});
  setSpacing('0px')}

/* ---------- the loop ---------- */
let last=0,ema=16;
function frame(now){const dt=Math.min(64,now-(last||now));last=now;ema=ema*.95+dt*.05;
  if(ema>26&&dprCap>1){dprCap=1;size()}            // slow machine: draw at 1×
  draw(now,dt);requestAnimationFrame(frame)}   // browsers already pause rAF in background tabs

/* ---------- arriving: hubs first, then the rest of the room fills in ---------- */
function arrive(){const t0=performance.now();
  if(RM){P.forEach(p=>p.arrive=1);targets();return}
  cam.z=fitZ*1.35;goal.z=fitZ;rate=1.6;
  const step=now=>{const u=(now-t0)/1000;let more=false;P.forEach(p=>{const start=[0,.35,.7][p.t]+(p.ph/6.283)*.6;const k=clamp((u-start)/.6,0,1);p.arrive=k;if(k<1)more=true});
    if(more)requestAnimationFrame(step)};requestAnimationFrame(step);targets()}

/* ---------- pointer: drag with inertia, wheel and pinch to zoom, hover, click ---------- */
let drag=null;const pts=new Map();
function hitPerson(mx,my){let best=null,bd=1e9;for(const p of P){if(p.a<.2)continue;const d=Math.hypot(p.s.x-mx,p.s.y-my),r=Math.max(p.s.r,6)+3;if(d<r&&d<bd){bd=d;best=p}}return best}
function hitEdge(mx,my){const cand=S.mode==='path'?S.path.es.filter((e,i)=>S.path.prog[i]>=1):S.mode==='person'?S.sel.E.filter(e=>personal(e)&&shown(e)):[];
  let best=null,bd=9;for(const e of cand){const q=quad(e);for(let i=1;i<20;i++){const [x,y]=qpt(q,i/20),d=Math.hypot(x-mx,y-my);if(d<bd){bd=d;best=e}}}return best}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});vel=null;
  if(pts.size===2){const [a,b]=[...pts.values()];drag={pinch:Math.hypot(a.x-b.x,a.y-b.y),z:goal.z,moved:99};return}
  drag={x:e.clientX,y:e.clientY,cx:goal.x,cy:goal.y,moved:0,hist:[[performance.now(),e.clientX,e.clientY]]};cv.classList.add('grabbing')});
cv.addEventListener('pointermove',e=>{const mx=e.clientX,my=e.clientY;
  if(pts.has(e.pointerId))pts.set(e.pointerId,{x:mx,y:my});
  if(drag&&drag.pinch&&pts.size===2){const [a,b]=[...pts.values()];goal.z=cam.z=clamp(drag.z*Math.hypot(a.x-b.x,a.y-b.y)/drag.pinch,zmin(),zmax());return}
  if(drag){const dx=mx-drag.x,dy=my-drag.y;drag.moved=Math.max(drag.moved,Math.abs(dx)+Math.abs(dy));
    if(drag.moved>4){goal.x=cam.x=drag.cx-dx/cam.z;goal.y=cam.y=drag.cy-dy/cam.z;drag.hist.push([performance.now(),mx,my]);if(drag.hist.length>6)drag.hist.shift();hideTip()}return}
  const h=hitPerson(mx,my);setHover(h,mx,my);cv.classList.toggle('pointing',!!h||!!hitEdge(mx,my))});
function endDrag(e){pts.delete(e.pointerId);if(!drag)return;const d=drag;drag=null;cv.classList.remove('grabbing');
  if(d.pinch)return;
  if(d.moved<=4){click(e.clientX,e.clientY);return}
  const h=d.hist,a=h[0],b=h[h.length-1],ms=b[0]-a[0];if(ms>0&&ms<160&&!RM)vel={x:(b[1]-a[1])/ms*1000,y:(b[2]-a[2])/ms*1000}}
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);drag=null;cv.classList.remove('grabbing')});
cv.addEventListener('pointerleave',()=>{if(!drag)setHover(null)});
cv.addEventListener('wheel',e=>{e.preventDefault();const f=Math.exp(-e.deltaY*(e.ctrlKey?.012:.0016)),before=toWorld(e.clientX,e.clientY);
  const z=clamp(goal.z*f,zmin(),zmax());cam.z=goal.z=z;const after=toWorld(e.clientX,e.clientY);cam.x=goal.x+=before.x-after.x;cam.y=goal.y+=before.y-after.y;goal.x=cam.x;goal.y=cam.y;vel=null},{passive:false});
cv.addEventListener('dblclick',e=>{const w=toWorld(e.clientX,e.clientY);flyTo(w.x,w.y,goal.z*2.2)});
function click(mx,my){if(S.seq){S.seq.skip();return}
  const p=hitPerson(mx,my);if(p){select(p);return}
  const e=hitEdge(mx,my);if(e){openReceipts([e]);return}
  if(S.mode==='person')clearAll()}

/* ---------- hover card ---------- */
const tip=$('#tip');
function setHover(p,mx,my){if(p!==S.hover){S.hover=p;targets()}
  if(!p||(S.seq)){hideTip();return}
  const pe=p.E.filter(personal),names=[...new Set(pe.map(e=>other(e,p).n))];
  tip.innerHTML=`<b>${esc(p.n)}</b><span class="h">${p.k?esc(HT[p.k]||''):p.yr?'On the scene since '+p.yr:'The Guest List'}</span><p>${names.length} rishta${names.length===1?'':'s'} · ${p.fd} film${p.fd===1?'':'s'} on file${names.length?'<br>'+names.slice(0,4).map(n=>esc(first(n))).join(' · ')+(names.length>4?'…':''):''}</p><span class="go">${p===S.sel?'You are in their world':'Click to enter their world →'}</span>`;
  tip.hidden=false;const tw=tip.offsetWidth,th=tip.offsetHeight;tip.style.left=Math.min(mx,W-tw-30)+'px';tip.style.top=Math.min(my,H-th-30)+'px'}
function hideTip(){tip.hidden=true}

/* ---------- the little black book ---------- */
const RIDX=(()=>{let m=null;return()=>{if(m)return m;m=new Map();try{ALLR.forEach(r=>{new Set(partsOf(r).map(who)).forEach(n=>{if(!m.has(n))m.set(n,[]);m.get(n).push(r)})})}catch(e){}return m}})();
const recOf=n=>RIDX().get(n)||[];
const faceUrl=p=>p&&p.f?'assets/faces/'+p.f+'.webp':null;
const chip=p=>`<button type="button" data-go="${esc(p.n)}">${faceUrl(p)?`<img src="${faceUrl(p)}" alt="">`:`<span class="mono">${initials(p.n)}</span>`}${esc(p.n)}</button>`;
const dossier=$('#dossier');
function select(p,{fly=true,push=true}={}){stopSeq();S.sel=p;S.path=null;setMode('person');hideTip();$('#spotted').hidden=true;closeDrawer();
  const groups=[['Family',['f','m','d'],'#F3DCD2'],['Love',['x','r','e','k'],'#D7363F'],['Friends',['b'],'#9DB89A'],['Feuds',['v'],'#F2703A'],['Work',['g','s','c'],'#A890C2']];
  const out=groups.map(([t,ts,c])=>{const ps=[...new Set(p.E.filter(e=>personal(e)&&ts.includes(e.t)).map(e=>other(e,p)))];if(!ps.length)return '';
    return `<div class="grp"><h4 style="color:${c}"><i style="background:${c}"></i>${t} · ${ps.length}</h4><div class="ppl">${ps.slice(0,10).map(chip).join('')}${ps.length>10?`<span class="more">+${ps.length-10}</span>`:''}</div></div>`}).join('');
  const co={};p.E.forEach(e=>{if(e.film){const o=other(e,p);co[o.n]=(co[o.n]||0)+(GFILMS[e.i]||[1]).length}});
  const costars=Object.entries(co).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n])=>BY.get(n));
  const pe=new Set(p.E.filter(personal).map(e=>other(e,p))).size,rc=recOf(p.n).length;
  dossier.innerHTML=`<button type="button" class="dx" aria-label="Close">✕</button>
    <div class="face${faceUrl(p)?'':' mono'}"${faceUrl(p)?` style="background-image:url('${faceUrl(p)}')"`:''}>${faceUrl(p)?'':initials(p.n)}</div>
    <div class="hd"><span class="kick">${p.k?esc(HT[p.k]||'')+(p.sp?' · married in':''):'The Little Black Book'}</span><h3>${esc(p.n)}</h3></div>
    <div class="stats"><div><b>${pe}</b>rishtas</div><div><b>${p.fd}</b>films on file</div><div><b>${rc}</b>receipts</div></div>
    ${out||'<div class="grp"><h4>No personal rishtas on file yet</h4></div>'}
    ${costars.length?`<div class="grp"><h4 style="color:#C9AFA8"><i style="background:#C9AFA8"></i>Most-shared films</h4><div class="ppl">${costars.map(chip).join('')}</div></div>`:''}
    <div class="acts"><button type="button" data-act="from">Connect from here</button>${rc?`<a href="receipts.html?q=${encodeURIComponent(p.n)}">All receipts →</a>`:''}</div>`;
  dossier.hidden=false;
  dossier.querySelector('.dx').onclick=clearAll;
  dossier.querySelector('[data-act="from"]').onclick=()=>{$('#pa').value=p.n;$('#pb').value='';$('#pb').focus()};
  // they take the middle of the open screen, with their world arranged around them
  if(fly){const ns=[...new Set(p.E.filter(e=>personal(e)&&shown(e)).map(e=>other(e,p)))],B=frameBox(),c=stage();
    const reach=ns.length?ns.map(o=>Math.hypot(o.wx-p.wx,o.wy-p.wy)).sort((a,b)=>a-b)[Math.floor(ns.length*.85)]:120;
    const z=clamp(Math.min(B.x1-B.x0,B.y1-B.y0)/2/Math.max(90,reach)*.92,zmin(),fitZ*4.5);
    flyTo(p.wx-((B.x0+B.x1)/2-c.x)/z,p.wy-((B.y0+B.y1)/2-c.y)/z,z)}
  flash(p);say(`${p.n}. ${pe} rishtas, ${p.fd} films on file.`);
  if(push)setUrl({p:p.n})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){const p=BY.get(b.dataset.go);if(p)select(p)}});
function clearAll(){stopSeq();S.sel=null;S.path=null;dossier.hidden=true;$('#spotted').hidden=true;closeDrawer();setMode('room');setUrl({});home()}

/* ---------- yeh rishta kya kehlata hai: the reveal ---------- */
const capEl=$('#cap'),skipBtn=$('#skip');
function caption(html){capEl.classList.remove('out');capEl.innerHTML=html}
function capOut(){capEl.classList.add('out')}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function stopSeq(){if(S.seq){S.seq.cancelled=true;S.seq=null}skipBtn.hidden=true;capOut()}
function connect(aN,bN,{instant=false}={}){stopSeq();closeDrawer();hideTip();
  const a=BY.get(aN),b=BY.get(bN);
  let pth=null;try{pth=path(aN,bN,false,S.verified)}catch(err){}
  if(!pth||!pth.length){err(`No chain between ${aN} and ${bN} on this guest list${S.verified?' using receipts alone. Try turning off “Receipts only”':''}. Yet.`);return}
  const ids=[a,...pth.map(s=>BY.get(s[2]))],es=pth.map(([u,i,v])=>E.find(e=>e.i===i));
  S.sel=null;dossier.hidden=true;$('#spotted').hidden=true;
  // a chain thread bows away from the rest of the chain, so it never seems to pass through someone it doesn't touch
  E.forEach(e=>{e.pb=null});
  es.forEach(e=>{const dx=e.b.wx-e.a.wx,dy=e.b.wy-e.a.wy,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,mx=(e.a.wx+e.b.wx)/2,my=(e.a.wy+e.b.wy)/2;
    let side=0,close=0;ids.forEach(p=>{if(p===e.a||p===e.b)return;const rx=p.wx-mx,ry=p.wy-my,perp=rx*nx+ry*ny,along=Math.abs(rx*dx+ry*dy)/L;
      side+=Math.sign(perp)/Math.max(1,Math.hypot(rx,ry)/L);if(along<L*.5&&Math.abs(perp)<L*.2)close=1});
    e.pb=(side>0?-1:1)*(close?.4:es.length>1?.18:.1)});
  S.path={ids,es,prog:es.map(()=>0),doneAt:[],reached:new Set([a])};setMode('path');setUrl({a:aN,b:bN});
  if(instant||RM){finishPath();return}
  const L=es.length,D=clamp(2100/L,380,760),PAUSE=L>3?110:240;
  const seq=S.seq={cancelled:false,follow:null,skip(){seq.cancelled=true;S.seq=null;finishPath()},
    tick(now){const f=seq.follow;if(!f)return;const u=clamp((now-f.t0)/f.ms,0,1),k=ease(u);S.path.prog[f.i]=k;
      const from=ids[f.i],to=ids[f.i+1],tx=from.wx+(to.wx-from.wx)*k,ty=from.wy+(to.wy-from.wy)*k;goal.x=tx;goal.y=ty;
      if(u>=1){seq.follow=null;S.path.doneAt[f.i]=now;f.done()}}};
  skipBtn.hidden=false;
  (async()=>{
    caption(`<span class="who">${esc(a.n)}</span><span class="line">Let’s follow the receipts.</span>`);
    const span=Math.max(...es.map(e=>Math.hypot(e.a.wx-e.b.wx,e.a.wy-e.b.wy)));
    const zStep=document.body.classList.contains('gl-demo')?clamp(Math.min(W*.7,H*.6)/Math.max(90,span*1.1),fitZ*3.5,fitZ*10):clamp(Math.min(W>760?W-760:W,H*.6)/Math.max(160,span*1.25),fitZ*1.2,fitZ*5.5);
    flyTo(a.wx,a.wy,zStep*1.15,4.5);flash(a);await wait(RM?0:820);if(seq.cancelled)return;
    for(let i=0;i<L;i++){const to=ids[i+1];goal.z=zStep;rate=6;
      await new Promise(done=>{seq.follow={i,t0:performance.now(),ms:D,done}});if(seq.cancelled)return;
      S.path.reached.add(to);targets();flash(to);
      caption(`<span class="who">${esc(to.n)}</span><span class="line">${esc(ST[es[i].t].k)}${when(es[i])?' · '+esc(when(es[i])):''}</span>`);
      await wait(PAUSE+260);if(seq.cancelled)return}
    fitPeople(ids,.85);rate=3.2;
    caption(`<span class="deg">${L===1?'Directly linked.':cap1(NUM[L]||L)+' degrees.'}</span><span class="line">Small town, this Bollywood.</span>`);
    await wait(900);if(seq.cancelled)return;
    S.seq=null;skipBtn.hidden=true;spotted();if(W<=760)fitPeople(R.ids,.85);await wait(1700);if(!S.seq&&S.mode==='path')capOut()})()}
const cap1=s=>String(s)[0].toUpperCase()+String(s).slice(1);
function finishPath(){const R=S.path;if(!R)return;const now=performance.now();R.prog=R.prog.map(()=>1);R.doneAt=R.es.map(()=>now-400);R.ids.forEach(p=>R.reached.add(p));
  targets();skipBtn.hidden=true;capOut();spotted();fitPeople(R.ids,.85)}
function sentence(e,from,to){const st=ST[e.t],A=`<button type="button" data-go="${esc(from.n)}">${esc(first(from.n))}</button>`,B=`<button type="button" data-go="${esc(to.n)}">${esc(first(to.n))}</button>`,w=when(e);
  if(e.t==='f')return `${A} and ${B} are family${e.d?`: ${esc(e.d.split(';')[0])}`:''}.`;
  // directed and sang-for read one way round: the director (or singer) is always the edge's first person
  if(e.t==='w'||e.t==='p'){const [X,Y]=e.a===from?[A,B]:[B,A],ww=w.replace(/ together$/,'');return e.t==='w'?`${X} directed ${Y}${ww?` (${esc(ww)})`:''}.`:`${X} sang for ${Y}${ww?` in ${esc(ww)}`:''}.`}
  if(e.film||e.t==='c')return `${A} worked with ${B}${w?` (${esc(w)})`:''}.`;
  return `${A} ${st.v} ${B}${w?`, ${esc(w)}`:''}.`}
function spotted(){const R=S.path;if(!R)return;const a=R.ids[0],b=R.ids[R.ids.length-1],L=R.es.length,el=$('#spotted');
  const head=L===1?`${esc(a.n)} and ${esc(b.n)} are directly linked.`:`${esc(a.n)} and ${esc(b.n)} are only ${NUM[L]||L} degrees apart.`;
  const mid=R.ids.length>2?R.ids[Math.floor(R.ids.length/2)]:b;
  el.innerHTML=`<button type="button" class="dx" aria-label="Close and see the whole room">✕</button><p class="k">Spotted<span>${L} degree${L===1?'':'s'}</span></p><h3>${head}</h3>
    <ol>${R.es.map((e,i)=>`<li><i style="background:${ST[e.t].c}"></i><span>${sentence(e,R.ids[i],R.ids[i+1])} <span class="vt ${e.v}">${{t:'RECEIPT',a:'ALLEGED',r:'RUMOR',c:'FAUX'}[e.v]||''}</span></span></li>`).join('')}</ol>
    <p class="chain">${R.ids.map((p,i)=>esc(first(p.n))+(i<R.es.length?' → '+TAG[R.es[i].t]+' → ':'')).join('')}</p>
    <div class="acts"><button type="button" data-act="rec">Show the receipts</button><button type="button" data-act="exp">Explore ${esc(first(mid.n))}</button><button type="button" data-act="new">Set me up</button></div>`;
  el.hidden=false;el.querySelector('.dx').onclick=clearAll;el.querySelector('[data-act="rec"]').onclick=()=>openReceipts(R.es,R.ids);el.querySelector('[data-act="exp"]').onclick=()=>select(mid);el.querySelector('[data-act="new"]').onclick=setMeUp;
  say(`${head} ${R.es.map((e,i)=>`${R.ids[i].n} ${ST[e.t].k.toLowerCase()} ${R.ids[i+1].n}`).join('; ')}.`)}

/* ---------- the receipt drawer ---------- */
const drawer=$('#drawer');
const STAMP={t:['RECEIPT','On the record: an interview, filing or announcement'],a:['ALLEGED','Credibly reported, but disputed or never confirmed'],r:['RUMOR','Repeated around town without real confirmation'],c:['FAUX','The evidence contradicts it']};
function openReceipts(es,ids){const blocks=es.map((e,i)=>{const A=ids?ids[i]:e.a,B=ids?ids[i+1]:e.b,films=(GFILMS[e.i]||[]).map(id=>MOV.get(id)).filter(Boolean);
    const both=recOf(A.n).filter(r=>recOf(B.n).includes(r)).slice(0,4);
    return `<div class="rcp"><p class="pair">${esc(A.n)} × ${esc(B.n)}</p><dl>
      <dt>Rishta</dt><dd>${esc(ST[e.t].k)}</dd>
      ${when(e)?`<dt>When</dt><dd>${esc(when(e))}</dd>`:''}
      ${e.d&&!e.film&&e.d!==when(e)?`<dt>On file</dt><dd>${esc(e.d)}</dd>`:''}
      ${films.length?`<dt>Films</dt><dd>${films.slice(0,6).map(([t,y])=>`${esc(t)} (${y})`).join(', ')}${films.length>6?'…':''}</dd>`:''}
      <dt>Status</dt><dd><span class="stamp ${e.v}">${STAMP[e.v][0]}</span> <span style="font-size:13px;color:#7A6A5C">${STAMP[e.v][1]}</span></dd>
      ${both.length?`<dt>Case files</dt><dd class="files">${both.map(r=>`<button type="button" data-n="${r.n}">${esc(r.h)}</button>`).join('')}</dd>`:''}</dl></div>`}).join('');
  const names=ids||[es[0].a,es[0].b];
  drawer.innerHTML=`<button type="button" class="dx">Close ✕</button><p class="k">The receipt${es.length>1?'s':''}</p><h3 id="drawerh">${esc(names[0].n)} × ${esc(names[names.length-1].n)}</h3>${blocks}
    <p class="note">Every rishta on the Guest List is stamped. ALLEGED and RUMOR mean gossip, not fact. Portraits via Wikimedia Commons. <a href="receipts.html?q=${encodeURIComponent(names[0].n)}">Open the full case →</a></p>`;
  drawer.hidden=false;drawer.querySelector('.dx').onclick=closeDrawer;drawer.querySelector('.dx').focus()}
function closeDrawer(){drawer.hidden=true}

/* ---------- the form: two names, a combobox each ---------- */
const NAMES=[...P].sort((a,b)=>b.sc-a.sc);
function suggest(q){q=q.trim().toLowerCase();if(!q)return [];const out=[];
  for(const p of NAMES){const n=p.n.toLowerCase();const r=n.startsWith(q)?0:n.split(' ').some(w=>w.startsWith(q))?1:n.includes(q)?2:-1;if(r>=0)out.push([r,p]);if(out.length>60)break}
  return out.sort((a,b)=>a[0]-b[0]).slice(0,7).map(x=>x[1])}
function combo(inp,list,next){let items=[],act=-1;
  const close=()=>{list.hidden=true;inp.setAttribute('aria-expanded','false');act=-1};
  const pick=p=>{inp.value=p.n;close()};
  const paint=()=>{list.innerHTML=items.map((p,i)=>`<li role="option" id="${list.id}-${i}" aria-selected="${i===act}" data-i="${i}">${faceUrl(p)?`<img src="${faceUrl(p)}" alt="">`:`<span class="mono">${initials(p.n)}</span>`}${esc(p.n)}${p.k?`<small>${esc((HT[p.k]||'').replace(/^The /,''))}</small>`:''}</li>`).join('');
    if(act>=0)inp.setAttribute('aria-activedescendant',`${list.id}-${act}`);else inp.removeAttribute('aria-activedescendant')};
  inp.addEventListener('input',()=>{items=suggest(inp.value);act=items.length?0:-1;paint();list.hidden=!items.length;inp.setAttribute('aria-expanded',String(!!items.length))});
  inp.addEventListener('keydown',e=>{if(list.hidden)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;paint()}
    else if(e.key==='Enter'&&act>=0){pick(items[act]);if(next&&!next.value){e.preventDefault();next.focus()}}else if(e.key==='Escape'){e.stopPropagation();close()}});
  list.addEventListener('pointerdown',e=>{const li=e.target.closest('li');if(li){e.preventDefault();pick(items[+li.dataset.i]);if(next&&!next.value)next.focus()}});
  inp.addEventListener('blur',()=>setTimeout(close,120))}
combo($('#pa'),$('#pal'),$('#pb'));combo($('#pb'),$('#pbl'));combo($('#ia'),$('#ial'),$('#ib'));combo($('#ib'),$('#ibl'));
const resolve=q=>{q=(q||'').trim();if(!q)return null;if(BY.has(q))return q;const s=suggest(q);if(s.length)return s[0].n;try{return resolveName(q)}catch(e){return null}};
const errEl=$('#askerr');function err(m){errEl.textContent=m;errEl.hidden=!m}
$('#askf').addEventListener('submit',e=>{e.preventDefault();err('');
  const ia=$('#pa'),ib=$('#pb');const a=resolve(ia.value||ia.placeholder),b=resolve(ib.value||ib.placeholder);
  if(!a)return err(`No one called “${ia.value}” on the guest list yet.`);if(!b)return err(`No one called “${ib.value}” on the guest list yet.`);
  if(a===b)return err('Pick two different people.');ia.value=a;ib.value=b;connect(a,b)});
$('#swap').onclick=()=>{const ia=$('#pa'),ib=$('#pb');[ia.value,ib.value]=[ib.value,ia.value]};
function setMeUp(){const pool=P.filter(p=>p.t<2);for(let k=0;k<40;k++){const a=pool[Math.floor(Math.random()*pool.length)],b=pool[Math.floor(Math.random()*pool.length)];
    if(a===b)continue;let pth=null;try{pth=path(a.n,b.n,false,S.verified)}catch(e){}if(pth&&pth.length>=2&&pth.length<=4){$('#pa').value=a.n;$('#pb').value=b.n;err('');connect(a.n,b.n);return}}}
$('#setup').onclick=setMeUp;

/* ---------- the front door: the invitation, then the room ---------- */
const inviting=()=>document.body.classList.contains('inviting');
function walkIn(){document.body.classList.remove('inviting');$('#invite').setAttribute('aria-hidden','true');$('#invite').inert=true}
const invErr=$('#inverr');
$('#invf').addEventListener('submit',e=>{e.preventDefault();invErr.hidden=true;
  const ia=$('#ia'),ib=$('#ib');const a=resolve(ia.value||ia.placeholder),b=resolve(ib.value||ib.placeholder);
  const bad=m=>{invErr.textContent=m;invErr.hidden=false};
  if(!a)return bad(`No one called “${ia.value}” on the guest list yet.`);if(!b)return bad(`No one called “${ib.value}” on the guest list yet.`);
  if(a===b)return bad('Pick two different people.');$('#pa').value=a;$('#pb').value=b;walkIn();setTimeout(()=>connect(a,b),RM?0:550)});
$('#iswap').onclick=()=>{const ia=$('#ia'),ib=$('#ib');[ia.value,ib.value]=[ib.value,ia.value]};
$('#isurprise').onclick=()=>{walkIn();setTimeout(setMeUp,RM?0:550)};
$('#iwalk').onclick=()=>{walkIn();setTimeout(()=>$('#pa').focus({preventScroll:true}),400)};
$('#invfaces').innerHTML=NAMES.filter(p=>faceUrl(p)).slice(0,9).map(p=>`<img src="${faceUrl(p)}" alt="" title="${esc(p.n)}">`).join('');

/* ---------- show me: filter pills, receipts only, the key ---------- */
document.querySelectorAll('.gl-pills button').forEach(b=>b.onclick=()=>{S.filter=b.dataset.f;document.querySelectorAll('.gl-pills button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));targets()});
$('#verified').onclick=e=>{S.verified=!S.verified;e.currentTarget.setAttribute('aria-pressed',String(S.verified));targets();if(S.mode==='path'&&!S.seq){const R=S.path;connect(R.ids[0].n,R.ids[R.ids.length-1].n,{instant:true})}};
document.querySelectorAll('.gl-seg').forEach(seg=>seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S[seg.dataset.set]=b.dataset.v;
  seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#eras').hidden=S.color!=='era';$('#roles').hidden=S.color!=='role'}));
$('#roles').innerHTML=[...ROLE_ORDER,'circle'].map(r=>`<span><i style="border-color:${ROLE[r].c}"></i>${ROLE[r].k}</span>`).join('');
$('#eras').innerHTML=Object.entries(ERA).map(([y,c])=>`<span style="--c:${c}">${String(y).slice(2)}s</span>`).join('');
const sw=(t)=>{const st=ST[t],d=st.st==='dash'?`stroke-dasharray="${st.dash.join(' ')}"`:st.st==='break'?'stroke-dasharray="11 4 30"':'';
  if(st.st==='double')return `<svg width="26" height="8" aria-hidden="true"><path d="M1 2.4H25M1 5.6H25" stroke="${st.c}" stroke-width="1.1"/></svg>`;
  if(st.st==='jag')return `<svg width="26" height="8" aria-hidden="true"><path d="M1 4L4 1.5L7 6.5L10 1.5L13 6.5L16 1.5L19 6.5L22 1.5L25 4" fill="none" stroke="${st.c}" stroke-width="1.2"/></svg>`;
  return `<svg width="26" height="8" aria-hidden="true"><path d="M1 4H25" stroke="${st.c}" stroke-width="${Math.max(1.2,st.w)}" stroke-linecap="round" ${d}/></svg>`};
$('#legend').innerHTML=['f','m','d','x','r','b','v','c','w','p'].map(t=>`<li>${sw(t)}${ST[t].k}</li>`).join('');
$('#keyfold').onclick=e=>{const b=e.currentTarget,open=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!open));$('#keybody').hidden=open;b.querySelector('span').textContent=open?'+':'–'};
$('#zin').onclick=()=>flyTo(goal.x,goal.y,goal.z*1.6,5);$('#zout').onclick=()=>flyTo(goal.x,goal.y,goal.z/1.6,5);$('#zfit').onclick=()=>{if(S.mode==='path')fitPeople(S.path.ids,.85);else home()};
skipBtn.onclick=()=>S.seq&&S.seq.skip();
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(document.querySelector('#rx[open]'))return;if(inviting()){walkIn();return}
  if(S.seq){S.seq.skip();return}if(!drawer.hidden){closeDrawer();return}if(S.mode!=='room')clearAll()});

/* ---------- the address bar remembers the rishta ---------- */
function setUrl(o){const u=new URL(location.href);['a','b','p'].forEach(k=>u.searchParams.delete(k));Object.entries(o).forEach(([k,v])=>u.searchParams.set(k,v));history.replaceState(null,'',u)}
const sayEl=$('#say');function say(t){sayEl.textContent=t}

/* ---------- go ---------- */
const pe=E.filter(personal).length,fe=E.length-pe;
$('#glmeta').textContent=`${P.length} guests, ${pe.toLocaleString()} rishtas, ${fe.toLocaleString()} co-star links and ${WD.khandaans.length} khandaans. Nobody is more than seven steps from anybody.`;
addEventListener('resize',()=>{size();targets()});size();home();cam.x=goal.x;cam.y=goal.y;arrive();requestAnimationFrame(frame);
if(document.fonts)document.fonts.ready.then(()=>MONO.clear());
// preload the front row's faces so the opening view is already portraits
P.filter(p=>p.t<2).forEach(face);
const qs=new URLSearchParams(location.search),qa=qs.get('a'),qb=qs.get('b'),qp=qs.get('p');
if(qa&&qb){const a=resolve(qa),b=resolve(qb);if(a&&b&&a!==b){walkIn();$('#pa').value=a;$('#pb').value=b;setTimeout(()=>connect(a,b),RM?0:1500)}}
else if(qp){const p=BY.get(resolve(qp));if(p)walkIn();if(p)setTimeout(()=>select(p,{push:false}),RM?0:1300)}
window.__guest={S,P,E,BY,connect,select,cam,goal};
/* demo mode, for the front page's live window: no panels, the room pulls famous threads on its own */
if(qs.has('demo')){document.body.classList.add('gl-demo');walkIn();
  const PAIRS=[['Shah Rukh Khan','Kangana Ranaut'],['Alia Bhatt','Deepika Padukone'],['Aishwarya Rai','Salman Khan'],['Ranveer Singh','Sonam Kapoor'],['Amitabh Bachchan','Ananya Panday'],['Katrina Kaif','Vicky Kaushal'],['Rekha','Kareena Kapoor'],['Akshay Kumar','Shilpa Shetty']].map(([a,b])=>[resolve(a),resolve(b)]).filter(([a,b])=>a&&b);
  let k=0;const next=()=>{const [a,b]=PAIRS[k++%PAIRS.length];connect(a,b);try{parent.postMessage({gl:'pair',a,b},'*')}catch(e){}};
  setTimeout(next,RM?0:900);setInterval(next,9000)}
})();
