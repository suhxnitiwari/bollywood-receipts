/* ---------- 3D webs: the connector board and the case-file maps, pinned to a detective's corkboard ----------
   Canvas 2D with a hand-rolled camera (yaw spins, pitch tilts, perspective divides), the same trick as the listening galaxy.
   People are pinned polaroids, links are string coloured by relationship, and every thread carries a paper tag. */
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAPER={board:'#E9DDC7',ink:'#15110E',red:'#C8261C',tag:'#FBF6EC'};
const COL={wed:'#C8261C',ex:'#4A3B6E',co:'#9A6A0C',fr:'#9A6A0C',kid:'#15110E',fd:'#7A1610',rep:'#C8261C',weak:'#7E7262',rum:'#9A6A0C',link:'#5E544A'};
const DASH={ex:[7,7],fd:[2,6],rep:[9,6],weak:[2,6],rum:[8,6]};
const NAME={wed:'married',ex:'exes',co:'worked together',fr:'friends',kid:'family',fd:'feud',rep:'reported',weak:'denied',rum:'rumored',link:'linked'};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
const rng=seed=>{let a=hash(seed);return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sprites=new Map();
function glow(c){let s=sprites.get(c);if(s)return s;s=document.createElement('canvas');s.width=s.height=64;const x=s.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'#ffffff');g.addColorStop(.16,c);g.addColorStop(.42,c+'66');g.addColorStop(1,c+'00');x.fillStyle=g;x.fillRect(0,0,64,64);sprites.set(c,s);return s}
const imgs=new Map();
function photo(u){if(!u)return null;let i=imgs.get(u);if(!i){i=new Image();i.decoding='async';i.onerror=()=>{i.bad=1};i.src=u;imgs.set(u,i)}return i.complete&&!i.bad&&i.naturalWidth?i:null}
const inits=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const webs=[];let raf=0,last=0;
function loop(now){raf=0;const dt=Math.min(64,now-(last||now));last=now;let any=false;
  const vh=innerHeight;for(const w of webs){const r=w.cv.getBoundingClientRect();w.vis=r.bottom>-80&&r.top<vh+80&&r.width>0;if(w.vis){draw(w,now,dt);any=true}}
  if(any&&!RM)raf=requestAnimationFrame(loop);else last=0}
let asked=0;const kick=()=>{const n=performance.now();if(!raf||n-asked>400){asked=n;raf=requestAnimationFrame(loop)}};
addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});

function Web(box,o){
  const cv=document.createElement('canvas');cv.className='w3d-cv';cv.setAttribute('role','img');cv.setAttribute('aria-label',o.label||'Relationship web');
  box.classList.add('w3d');box.prepend(cv);
  const w={box,cv,g:cv.getContext('2d'),o,nodes:[],edges:[],free:[],yaw:o.yaw||0,pitch:o.pitch||.18,base:{yaw:o.yaw||0,pitch:o.pitch||.18},
    cam:{z:1,x:0,y:0,zz:0},goal:{z:1,x:0,y:0,zz:0},hover:-1,focus:null,t0:performance.now(),vis:false,dust:[],W:0,H:0};
  const r=rng((o.seed||'web')+'dust');for(let i=0;i<(o.dust??160);i++){const u=r()*2-1,th=r()*Math.PI*2,rad=1.1+r()*1.6;
    w.dust.push({x:Math.sqrt(1-u*u)*Math.cos(th)*rad,y:u*rad*.8,z:Math.sqrt(1-u*u)*Math.sin(th)*rad,s:.4+r()*1.1,ph:r()*6.28,c:r()<.18?'#FF2E88':r()<.3?'#E7C47E':'#F7EFF6'})}
  const size=()=>{const W=box.clientWidth,H=Math.round(o.aspect?W/o.aspect:box.clientHeight);const d=Math.min(2,devicePixelRatio||1);if(!W||!H||(W===w.W&&H===w.H&&d===w.dpr))return;
    cv.width=Math.round(W*d);cv.height=Math.round(H*d);cv.style.height=H+'px';w.W=W;w.H=H;w.dpr=d;w.S=o.fit==='board'?Math.min(W,H)*.44:Math.min(W*.43,H*.9);w.bg=null;kick()};
  new ResizeObserver(size).observe(box);size();
  // drag to spin, pinch / ctrl-scroll to zoom, double-click to reset, click a star
  let drag=null;
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:w.base.yaw,pitch:w.base.pitch,moved:0};cv.setPointerCapture(e.pointerId);w.touched=performance.now()});
  cv.addEventListener('pointermove',e=>{const b=cv.getBoundingClientRect(),mx=e.clientX-b.left,my=e.clientY-b.top;
    if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.abs(dx)+Math.abs(dy));
      w.base.yaw=drag.yaw+dx*.0065;w.base.pitch=clamp(drag.pitch+dy*.005,-1.3,1.3);w.touched=performance.now();kick();return}
    const h=hit(w,mx,my);if(h!==w.hover){w.hover=h;cv.style.cursor=h>=0?'pointer':'grab';kick()}});
  const end=e=>{if(!drag)return;const click=drag.moved<6;drag=null;if(click){const b=cv.getBoundingClientRect();const h=hit(w,e.clientX-b.left,e.clientY-b.top);
      if(h>=0&&o.onPick)o.onPick(w.nodes[h].id);else if(h>=0){w.hover=h===w.hover?-1:h;kick()}}};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',()=>{drag=null});
  cv.addEventListener('pointerleave',()=>{if(!drag&&w.hover>=0){w.hover=-1;kick()}});
  cv.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();w.goal.z=clamp(w.goal.z*Math.exp(-e.deltaY*.01),.5,5);kick()},{passive:false});
  cv.addEventListener('dblclick',()=>{w.base.yaw=o.yaw||0;w.base.pitch=o.pitch||.18;if(w.fit)w.fit();else Object.assign(w.goal,{z:1,x:0,y:0,zz:0});kick()});
  webs.push(w);kick();return w}

function hit(w,mx,my){let best=-1,bd=1e9;w.nodes.forEach((n,i)=>{const p=n.p;if(!p||!n.show)return;const r=Math.max(10,n.r||0)+4,d=Math.hypot(p.x-mx,p.y-my);if(d<r&&d<bd){bd=d;best=i}});return best}

function background(w){const c=document.createElement('canvas');c.width=w.W;c.height=w.H;const x=c.getContext('2d');
  x.fillStyle=PAPER.board;x.fillRect(0,0,w.W,w.H);
  // corkboard grain: fine flecks plus a soft pin-board dot grid
  const r=rng('bg'+w.W);for(let i=0;i<w.W*w.H/90;i++){x.globalAlpha=.04+r()*.08;x.fillStyle=r()<.5?'#5A3E1E':'#FFF8EA';x.fillRect(r()*w.W,r()*w.H,1,1)}
  x.globalAlpha=.10;x.fillStyle='#5A3E1E';for(let y=10;y<w.H;y+=14)for(let X=(y/14%2)*7+6;X<w.W;X+=14)x.fillRect(X,y,1.2,1.2);
  x.globalAlpha=1;const v=x.createRadialGradient(w.W/2,w.H/2,Math.min(w.W,w.H)*.4,w.W/2,w.H/2,Math.max(w.W,w.H)*.8);v.addColorStop(0,'rgba(90,62,30,0)');v.addColorStop(1,'rgba(90,62,30,.22)');x.fillStyle=v;x.fillRect(0,0,w.W,w.H);
  return c}

function draw(w,now,dt){const {g,W,H,o}=w;if(!W)return;const t=now-w.t0,c=w.cam,G=w.goal;
  for(const k in G)c[k]+=(G[k]-c[k])*Math.min(1,dt*.006);
  const idle=!RM&&now-(w.touched||0)>2500;
  const sway=o.fit!=='board'||w.focus;if(!sway&&idle)w.base.yaw+=dt*.00009;
  w.yaw=w.base.yaw+(idle&&sway?(W<560&&w.focus?.12:.3)*Math.sin(t*.00021):0);w.pitch=w.base.pitch+(idle?.08*Math.sin(t*.00016):0);
  const cy=Math.cos(w.yaw),sy=Math.sin(w.yaw),cp=Math.cos(w.pitch),sp=Math.sin(w.pitch),D=3.4,S=w.S*c.z;
  const P=(x,y,z)=>{x-=c.x;y-=c.y;z-=c.zz;const x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cp-z1*sp,z2=y*sp+z1*cp,s=D/(D+z2);return {x:W/2+x1*s*S,y:H/2+y1*s*S,s,z:z2}};
  g.setTransform(w.dpr,0,0,w.dpr,0,0);if(!w.bg)w.bg=background(w);g.drawImage(w.bg,0,0,W,H);
  const fogA=z=>clamp(1.05-z*.42,.22,1);
  w.nodes.forEach(n=>{if(n.tx!=null){const k=RM?1:Math.min(1,dt*.005);n.x+=(n.tx-n.x)*k;n.y+=(n.ty-n.y)*k;n.z+=(n.tz-n.z)*k}n.p=P(n.x,n.y+(RM?0:Math.sin(t*.0009+n.ph)*.012),n.z)});
  const F=w.focus,hov=w.hover>=0?w.nodes[w.hover]:null;
  const lit=e=>F?F.edges.has(e.i):hov?(e.a===w.hover||e.b===w.hover):true;
  // string: the whole board in faint pencil, then the lit threads as taut red string with a soft shadow
  const ctrl=e=>{if(!e.c)return null;return P(e.c[0],e.c[1],e.c[2])};
  const stroke=(e,width,alpha,dash,dx=0,dy=0)=>{const A=w.nodes[e.a].p,B=w.nodes[e.b].p,C=ctrl(e);g.globalAlpha=alpha;g.lineWidth=width;g.setLineDash(dash||[]);g.beginPath();g.moveTo(A.x+dx,A.y+dy);C?g.quadraticCurveTo(C.x+dx,C.y+dy,B.x+dx,B.y+dy):g.lineTo(B.x+dx,B.y+dy);g.stroke()};
  g.lineCap='round';
  for(const e of w.edges){if(lit(e))continue;const A=w.nodes[e.a].p,B=w.nodes[e.b].p;g.strokeStyle=F?'#5A4632':COL[e.t]||COL.link;stroke(e,.8,(F?.13:.22)*fogA((A.z+B.z)/2),F?null:DASH[e.t])}
  for(const e of w.edges){if(!lit(e))continue;const A=w.nodes[e.a].p,B=w.nodes[e.b].p,f=fogA((A.z+B.z)/2),col=COL[e.t]||COL.link;
    const wd=(F?2.4:1.8)*clamp((A.s+B.s)/2,.6,1.4);g.strokeStyle='#3A2A18';stroke(e,wd,.16*f,DASH[e.t],1.5,3);g.strokeStyle=col;stroke(e,wd,.95*f,DASH[e.t])}
  g.setLineDash([]);
  // a red marker runs along the chain, in order, for the connector
  if(!RM&&F&&F.chain.length){const pt=(e,u)=>{const A=w.nodes[e.a].p,B=w.nodes[e.b].p,C=ctrl(e);if(!C)return {x:A.x+(B.x-A.x)*u,y:A.y+(B.y-A.y)*u};const v=1-u;return {x:v*v*A.x+2*v*u*C.x+u*u*B.x,y:v*v*A.y+2*v*u*C.y+u*u*B.y}};
    const L=F.chain.length,T=(t*.00042)%(L+.8);const k=Math.floor(T),u=T-k;if(k<L){const [ei,fw]=F.chain[k],e=w.edges[ei],q=pt(e,fw?u:1-u);g.globalAlpha=.9;g.fillStyle=PAPER.red;g.beginPath();g.arc(q.x,q.y,4.5,0,7);g.fill();g.globalAlpha=.25;g.beginPath();g.arc(q.x,q.y,10,0,7);g.fill()}}
  // everyone else on the board: map pins
  for(const n of w.nodes){if(n.big)continue;const p=n.p;if(p.s<=0)continue;n.show=true;const near=F&&F.near.has(n.id);const s=(1.4+Math.sqrt(n.deg||1)*.9)*p.s*(near?1.3:1)*(n===hov?1.8:1);
    g.globalAlpha=(F?(near?.75:.32):.6)*fogA(p.z);g.fillStyle=n===hov?PAPER.red:n.col;g.beginPath();g.arc(p.x,p.y,s,0,7);g.fill();n.r=Math.max(s,5)}
  g.globalAlpha=1;
  // thread captions: little paper tags
  const capFont=Math.round(clamp(W/80,9.5,12));
  g.font=`600 ${capFont}px "IBM Plex Mono",ui-monospace,monospace`;g.textAlign='center';g.textBaseline='middle';
  for(const e of w.edges){if(!e.lab||!lit(e))continue;if(!F&&!hov&&!o.alwaysCaptions)continue;const A=w.nodes[e.a].p,B=w.nodes[e.b].p,C=ctrl(e);
    const m=C?{x:.25*A.x+.5*C.x+.25*B.x,y:.25*A.y+.5*C.y+.25*B.y}:{x:(A.x+B.x)/2,y:(A.y+B.y)/2};const f=fogA((A.z+B.z)/2);
    const tw=g.measureText(e.lab).width+12;g.globalAlpha=.95*f;g.fillStyle=PAPER.tag;g.fillRect(m.x-tw/2,m.y-capFont*.8,tw,capFont*1.6);g.strokeStyle=PAPER.ink;g.lineWidth=.8;g.strokeRect(m.x-tw/2,m.y-capFont*.8,tw,capFont*1.6);
    g.globalAlpha=f;g.fillStyle=COL[e.t]===COL.kid?PAPER.ink:COL[e.t]||PAPER.ink;g.fillText(e.lab,m.x,m.y)}
  // polaroids, back to front, each pinned at a slight angle
  const big=w.nodes.filter(n=>n.big&&n.p.s>0).sort((a,b)=>b.p.z-a.p.z);
  const R0=clamp(W/34,15,o.fit==='board'?30:27);
  for(const n of big){const p=n.p,f=fogA(p.z),dim=hov&&hov!==n&&!w.edges.some(e=>lit(e)&&(w.nodes[e.a]===n||w.nodes[e.b]===n));
    const r=R0*p.s*(n.lead?1.18:1)*(n===hov?1.1:1);n.r=r*1.2;n.show=true;const a=(dim?.4:1)*f,fr=Math.max(3,r*.14),rot=(n.ph-3.14)*.025;
    g.save();g.translate(p.x,p.y);g.rotate(rot);g.globalAlpha=a;
    g.shadowColor='rgba(40,25,10,.45)';g.shadowBlur=8;g.shadowOffsetY=4;g.fillStyle='#FFFDF7';g.fillRect(-r-fr,-r-fr,2*r+2*fr,2*r+fr*4);g.shadowColor='transparent';
    const im=photo(n.photo);g.save();g.beginPath();g.rect(-r,-r,2*r,2*r);g.clip();
    if(im){const k=Math.max(2*r/im.naturalWidth,2*r/im.naturalHeight),iw=im.naturalWidth*k,ih=im.naturalHeight*k;g.filter='sepia(.18) contrast(1.05)';g.drawImage(im,-iw/2,-r-(ih-2*r)*.12,iw,ih);g.filter='none'}
    else{g.fillStyle='#2A231D';g.fillRect(-r,-r,2*r,2*r);g.fillStyle='#F3EADB';g.textAlign='center';g.textBaseline='middle';g.font=`700 ${Math.round(r*.75)}px "Bodoni Moda",Georgia,serif`;g.fillText(inits(n.label),0,1)}
    g.restore();
    if(n.lead){g.lineWidth=2.5;g.strokeStyle=PAPER.red;g.strokeRect(-r-fr,-r-fr,2*r+2*fr,2*r+fr*4)}
    g.fillStyle=n.lead?PAPER.red:'#3A2A18';g.beginPath();g.arc(0,-r-fr*.3,Math.max(2.5,r*.12),0,7);g.fill();
    g.restore();
    const fs=Math.round(clamp(r*.58,11,17));g.font=`${n.lead?'800':'700'} ${fs}px "Bodoni Moda",Georgia,serif`;g.textAlign='center';g.textBaseline='top';g.globalAlpha=a;
    const ly=p.y+r+fr*3+4,lw=g.measureText(n.label).width;g.fillStyle='rgba(243,234,219,.85)';g.fillRect(p.x-lw/2-4,ly-1,lw+8,fs+4);
    g.fillStyle=n.lead?PAPER.red:PAPER.ink;g.fillText(n.label,p.x,ly);g.textBaseline='middle'}
  // hover tag for a pin
  if(hov&&!hov.big){const p=hov.p;g.font=`700 14px "Bodoni Moda",Georgia,serif`;const txt=hov.label,tw=g.measureText(txt).width;
    g.globalAlpha=1;g.fillStyle=PAPER.tag;g.fillRect(p.x-tw/2-9,p.y-34,tw+18,24);g.strokeStyle=PAPER.ink;g.lineWidth=1;g.strokeRect(p.x-tw/2-9,p.y-34,tw+18,24);
    g.fillStyle=PAPER.ink;g.textAlign='center';g.fillText(txt,p.x,p.y-22)}
  g.globalAlpha=1}

/* ---------- exhibits: lift each hand-drawn SVG into 3D, keeping its layout as the front view ---------- */
function fromSvg(svg){const vb=svg.viewBox.baseVal,hw=vb.width/2,hh=vb.height/2,r=rng(svg.getAttribute('aria-label')||'svg');
  const nodes=[...svg.querySelectorAll('g.n')].map(gn=>{const R=gn.querySelector('rect'),T=gn.querySelector('text');const x=+R.getAttribute('x'),y=+R.getAttribute('y'),wd=+R.getAttribute('width'),h=+R.getAttribute('height');
    const label=T.textContent.trim(),ctx=svg.getAttribute('aria-label')||'',full=typeof whoIn==='function'?whoIn(label,ctx):label;
    return {id:label,label,photo:(window.PH||{})[full]||PH[full],lead:gn.classList.contains('c'),big:true,x0:x,y0:y,x1:x+wd,y1:y+h,x:(x+wd/2-vb.x-hw)/hw,y:(y+h/2-vb.y-hh)/hw,z:0,ph:r()*6.28}});
  nodes.forEach(n=>{n.z=n.lead?(r()-.5)*.15:(r()-.5)*.75});
  const near=(px,py)=>{let b=-1,bd=1e9;nodes.forEach((n,i)=>{const dx=Math.max(n.x0-px,0,px-n.x1),dy=Math.max(n.y0-py,0,py-n.y1),d=dx*dx+dy*dy;if(d<bd){bd=d;b=i}});return b};
  const edges=[];[...svg.querySelectorAll('line,path,polyline')].forEach(el=>{if(el.closest('g.n'))return;let L;try{L=el.getTotalLength()}catch(e){return}if(!L)return;
    const p0=el.getPointAtLength(0),p1=el.getPointAtLength(L),pm=el.getPointAtLength(L/2);const a=near(p0.x,p0.y),b=near(p1.x,p1.y);if(a<0||b<0||a===b)return;
    const t=[...el.classList].find(c=>COL[c])||'link';const A=nodes[a],B=nodes[b];
    const mx=(pm.x-vb.x-hw)/hw,my=(pm.y-vb.y-hh)/hw,straight=Math.hypot(mx-(A.x+B.x)/2,my-(A.y+B.y)/2)<.04;
    edges.push({a,b,t,i:edges.length,ph:r(),mid:[pm.x,pm.y],c:straight?null:[2*mx-(A.x+B.x)/2,2*my-(A.y+B.y)/2,(A.z+B.z)/2+.3],lab:''})});
  [...svg.querySelectorAll('text.lbl')].forEach(tx=>{const x=+tx.getAttribute('x'),y=+tx.getAttribute('y');let b=-1,bd=1e9;edges.forEach((e,i)=>{const d=Math.hypot(e.mid[0]-x,e.mid[1]-y);if(d<bd){bd=d;b=i}});
    if(b>=0&&bd<140){const e=edges[b];e.lab=e.lab?e.lab+' · '+tx.textContent.trim():tx.textContent.trim()}});
  edges.forEach(e=>{if(!e.lab)e.lab=NAME[e.t]||''});
  return {nodes,edges,aspect:vb.width/(vb.height*1.08)}}

function legendHtml(ts){return `<div class="w3d-legend" aria-hidden="true">${[...new Set(ts)].map(t=>`<span><i style="background:${COL[t]};${DASH[t]?`background:repeating-linear-gradient(90deg,${COL[t]} 0 5px,transparent 5px 9px)`:''}"></i>${NAME[t]}</span>`).join('')}</div>`}

window.initExhibitWebs=function(){document.querySelectorAll('.svgbox svg').forEach((svg,k)=>{const box=svg.closest('.svgbox');if(box.classList.contains('w3d'))return;
  let d;try{d=fromSvg(svg)}catch(e){return}if(!d.nodes.length)return;
  const w=Web(box,{seed:'ex'+k,aspect:Math.max(1.05,d.aspect),label:svg.getAttribute('aria-label'),yaw:0,pitch:.12,dust:0,alwaysCaptions:true});
  w.nodes=d.nodes;w.edges=d.edges;svg.classList.add('w3d-src');
  box.insertAdjacentHTML('beforeend',legendHtml(d.edges.map(e=>e.t))+`<span class="w3d-hint">Drag to spin · tap a face</span><span class="w3d-xo">XOXO</span>`)})};

/* ---------- the connector board: every name on the site as a star, the shortest chain lit up ---------- */
const TYK={m:'wed',d:'wed',e:'ex',x:'ex',r:'rum',c:'co',f:'kid',b:'fr',v:'fd'};
let BW=null;
function boardLayout(){const names=window.__NAMES,ADJ=window.__ADJ,N=names.length,idx=new Map(names.map((n,i)=>[n,i])),r=rng('board');
  const pos=names.map(()=>[r()*2-1,r()*2-1,r()*2-1]),E=[];G.forEach((e,i)=>{const a=idx.get(e[0]),b=idx.get(e[1]);if(a!=null&&b!=null&&a!==b)E.push([a,b,i])});
  const k=.16,disp=names.map(()=>[0,0,0]);
  for(let it=0;it<240;it++){const temp=.12*(1-it/240)+.004;disp.forEach(d=>{d[0]=d[1]=d[2]=0});
    for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const a=pos[i],b=pos[j];let dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2];let d2=dx*dx+dy*dy+dz*dz+1e-4;if(d2>1.2)continue;const f=k*k/d2;
      disp[i][0]+=dx*f;disp[i][1]+=dy*f;disp[i][2]+=dz*f;disp[j][0]-=dx*f;disp[j][1]-=dy*f;disp[j][2]-=dz*f}
    for(const [a,b] of E){const A=pos[a],B=pos[b],dx=A[0]-B[0],dy=A[1]-B[1],dz=A[2]-B[2],d=Math.sqrt(dx*dx+dy*dy+dz*dz)+1e-4,f=d/k*.9;
      disp[a][0]-=dx*f;disp[a][1]-=dy*f;disp[a][2]-=dz*f;disp[b][0]+=dx*f;disp[b][1]+=dy*f;disp[b][2]+=dz*f}
    for(let i=0;i<N;i++){const d=disp[i],p=pos[i];d[0]-=p[0]*.9;d[1]-=p[1]*.9;d[2]-=p[2]*.9;const l=Math.hypot(d[0],d[1],d[2])||1,m=Math.min(l,temp);p[0]+=d[0]/l*m;p[1]+=d[1]/l*m;p[2]+=d[2]/l*m}}
  const rs=pos.map(p=>Math.hypot(...p)).sort((a,b)=>a-b),R=rs[Math.floor(N*.92)]||1;pos.forEach(p=>{p[0]/=R;p[1]/=R*1.15;p[2]/=R});
  const cols=['#3A2A18','#5E544A','#7A1610','#4A3B6E','#6B5A3E'];
  return {nodes:names.map((n,i)=>({id:n,label:n,photo:PH[n],x:pos[i][0],y:pos[i][1],z:pos[i][2],hx:pos[i][0],hy:pos[i][1],hz:pos[i][2],tx:pos[i][0],ty:pos[i][1],tz:pos[i][2],deg:ADJ[n].length,col:cols[hash(n)%cols.length],ph:r()*6.28,big:false})),
    edges:E.map(([a,b,gi],i)=>({a,b,gi,i,t:TYK[G[gi][2]]||'link',ph:r(),c:null,lab:''})),idx}}
window.cxWebShow=function(a,b,pth){const box=document.getElementById('cxweb');if(!box||!window.__NAMES)return;
  if(!BW){const L=boardLayout();BW=Web(box,{seed:'board',fit:'board',label:'The whole board as a 3D web',yaw:-.4,pitch:.22,dust:0,
      onPick:id=>{const ib=document.getElementById('cxb'),ia=document.getElementById('cxa');if(id===ia.value)return;ib.value=id;document.getElementById('cxf').requestSubmit()}});
    BW.nodes=L.nodes;BW.edges=L.edges;BW.idx=L.idx;
    box.insertAdjacentHTML('beforeend',legendHtml(['wed','ex','rum','co','kid','fr','fd'])+`<span class="w3d-hint">Drag to spin · tap any pin to make them person two</span><p class="w3d-blast" id="cxblast"></p>`)}
  const w=BW,I=w.idx,chainIds=[a];BW.nodes.forEach(n=>{n.big=false;n.lead=false});
  const F={edges:new Set(),chain:[],near:new Set()};
  if(pth)pth.forEach(([p,gi,c])=>{chainIds.push(c);const e=w.edges.find(e=>e.gi===gi);if(e){F.edges.add(e.i);F.chain.push([e.i,w.nodes[e.a].id===p]);
    const ge=G[gi],d=(ge[3]||'').split(';')[0].trim();e.lab=ge[2]==='f'&&d&&d.length<=24?d:(({m:'married',d:'married, split',e:'engaged',x:'dated',r:'linked',c:'worked together',f:'family',b:'friends',v:'feud'})[ge[2]]||'')+(ge[4]?' '+ge[4]:'')}});
  else chainIds.push(b);
  chainIds.forEach((id,i)=>{const n=w.nodes[I.get(id)];if(!n)return;n.big=true;n.lead=i===0||i===chainIds.length-1;(window.__ADJ[id]||[]).forEach(([o])=>F.near.add(o))});
  w.focus=F;
  // fan the chain out into an even arc around where it lives on the board, so every face and caption has room
  w.nodes.forEach(n=>{n.tx=n.hx;n.ty=n.hy;n.tz=n.hz});
  const ps=chainIds.map(id=>w.nodes[I.get(id)]).filter(Boolean),L=ps.length;
  const cx=ps.reduce((s,n)=>s+n.hx,0)/L,cy=ps.reduce((s,n)=>s+n.hy,0)/L,cz=ps.reduce((s,n)=>s+n.hz,0)/L;
  let dx=ps[L-1].hx-ps[0].hx,dz=ps[L-1].hz-ps[0].hz;const dl=Math.hypot(dx,dz);if(dl<.05){dx=1;dz=0}else{dx/=dl;dz/=dl}
  const gap=w.W<560?.46:.36;ps.forEach((n,i)=>{const u=i-(L-1)/2;n.tx=cx+dx*u*gap;n.tz=cz+dz*u*gap;const zig=w.W<560?.2:.06;n.ty=cy-(L>2&&w.W>=560?Math.sin(Math.PI*i/(L-1))*.16:0)+(i%2?zig:-zig)*(L>3||w.W<560)});
  w.fit=()=>{const span=Math.max(.5,(L-1)*gap+.3);w.base.yaw=-Math.atan2(dz,dx);w.base.pitch=.18;Object.assign(w.goal,{x:cx,y:cy-.04,zz:cz,z:clamp((w.W<560?.86:.74)*w.W/(w.S*span),.9,4)})};w.fit();w.touched=performance.now();
  const blast=document.getElementById('cxblast');if(blast)blast.innerHTML=pth?`<b>Spotted:</b> ${a} and ${b}, ${pth.length===1?'directly linked':pth.length+' degrees apart'}. Small town, this Bollywood. <span>XOXO</span>`:`<b>Spotted:</b> no chain between ${a} and ${b}. Yet. <span>XOXO</span>`;
  kick()};
})();
