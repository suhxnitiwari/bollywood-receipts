/* ---------- the opening titles: night over Bombay, every face a city light, then the title ---------- */
(()=>{
const q=new URLSearchParams(location.search),force=q.has('intro'),freeze=parseFloat(q.get('intro'));
let seen=false;try{seen=sessionStorage.getItem('br-intro')==='1'}catch(e){}
if(!force&&(seen||!document.body.classList.contains('inviting')||matchMedia('(prefers-reduced-motion: reduce)').matches))return;
try{sessionStorage.setItem('br-intro','1')}catch(e){}

const W0=window.WORLD;if(!W0)return;
const stars=W0.people.filter(p=>p.f).sort((a,b)=>b.s-a.s);
const GOLD='#EFA068',FONT='"Quicksand",system-ui,sans-serif';

/* stage */
const css=document.createElement('style');css.textContent=`
.br-intro{position:fixed;inset:0;z-index:60;background:#0B0306;cursor:pointer;transition:opacity .9s ease}
.br-intro canvas{display:block;width:100%;height:100%}
.br-intro.out{opacity:0;pointer-events:none}
.br-intro-skip{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));background:none;border:1px solid rgba(239,160,104,.35);color:rgba(248,230,220,.75);
  font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase;padding:9px 13px;cursor:pointer}
.br-intro-skip:hover,.br-intro-skip:focus-visible{border-color:${GOLD};color:#F8E6DC;outline:none}
body.br-intro-on .gl-card{animation:none;opacity:0}
body.br-intro-done .gl-card{animation:brCardIn 1.1s cubic-bezier(.2,.7,.2,1) both}
@keyframes brCardIn{from{opacity:0;transform:translateY(14px) scale(.985);filter:blur(6px)}}`;
document.head.appendChild(css);
const font=document.createElement('link');font.rel='stylesheet';font.href='https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap';document.head.appendChild(font);

const root=document.createElement('div');root.className='br-intro';root.setAttribute('role','presentation');
const cv=document.createElement('canvas');const skip=document.createElement('button');skip.type='button';skip.className='br-intro-skip';skip.textContent='Skip intro';
root.append(cv,skip);document.body.appendChild(root);document.body.classList.add('br-intro-on');
const invite=document.getElementById('invite');if(invite)invite.inert=true;
const g=cv.getContext('2d');

let W,H,DPR,done=false,raf=0,t0=0,frozen=0;
function finish(){if(done)return;done=true;cancelAnimationFrame(raf);root.classList.add('out');
  document.body.classList.remove('br-intro-on');document.body.classList.add('br-intro-done');if(invite)invite.inert=false;
  removeEventListener('keydown',onKey,true);removeEventListener('resize',onResize);
  setTimeout(()=>root.remove(),950)}
const onKey=e=>{if(['Escape','Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();finish()}};
addEventListener('keydown',onKey,true);root.addEventListener('click',finish);skip.focus({preventScroll:true});

/* every face, pre-cut into a round sprite once so the frames stay cheap */
const SPR=96,sprites=[];
stars.forEach((p,i)=>new Promise(res=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=SPR;const x=c.getContext('2d');
  x.beginPath();x.arc(SPR/2,SPR/2,SPR/2,0,7);x.clip();x.drawImage(im,0,0,SPR,SPR);sprites[i]=c;res()};im.onerror=res;im.src='assets/faces/'+p.f+'.webp'}));

const rnd=(a,b)=>a+Math.random()*(b-a),clamp=v=>v<0?0:v>1?1:v;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,easeOut=t=>1-Math.pow(1-t,3);
const seg=(t,a,b)=>clamp((t-a)/(b-a));

let city,tiles,title,sky;
function layout(){
  DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;g.setTransform(DPR,0,0,DPR,0,0);
  /* the skyline: towers along the bay, windows lit, the Queen's Necklace curving along the water */
  const base=H*.8;city=[];let x=-20;
  while(x<W+20){const w=rnd(18,56)*(W/1400+.4),tall=Math.random()<.18,h=(tall?rnd(.32,.52):rnd(.08,.26))*H*(1-Math.abs(x/W-.55)*.6);
    const wins=[];const cs=Math.max(5,w/6),rs=7;for(let yy=base-h+8;yy<base-6;yy+=rs)for(let xx=x+4;xx<x+w-4;xx+=cs)if(Math.random()<.22)wins.push([xx,yy,Math.random()]);
    city.push({x,w,h,tall,wins,shade:rnd(.0,.06)});x+=w+rnd(-4,6)}
  sky=g.createLinearGradient(0,0,0,base);sky.addColorStop(0,'#0B0306');sky.addColorStop(.55,'#1C070D');sky.addColorStop(.86,'#4A0F1A');sky.addColorStop(1,'#8A2A22');

  /* the title, measured, then cut into a mosaic of tiles */
  const two=W/H<1.9||W<900,lines=two?['bollywood','receipts']:['bollywood receipts'];
  const m=document.createElement('canvas').getContext('2d');m.font=`700 100px ${FONT}`;
  const widest=Math.max(...lines.map(l=>m.measureText(l).width));
  const fs=Math.min((W*.88)/widest*100,H*(two?.27:.34)),lh=fs*1.02,top=H*.47-(lines.length*lh)/2+fs*.78;
  const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d');o.font=`700 ${fs}px ${FONT}`;o.textAlign='center';o.fillStyle='#fff';
  title={fs,lh,top,lines};lines.forEach((l,i)=>o.fillText(l,W/2,top+i*lh));
  /* the descender of the p in receipts: Gossip Girl's line, dropped to the floor */
  const last=lines[lines.length-1],pi=last.indexOf('p');o.font=`700 ${fs}px ${FONT}`;
  const lw=o.measureText(last).width,px=W/2-lw/2+o.measureText(last.slice(0,pi)).width+fs*.095;
  title.px=px;title.py=top+(lines.length-1)*lh+fs*.2;
  const data=o.getImageData(0,0,W,H).data;
  let step=Math.max(6,Math.round(fs*.05));const pts=[];
  const grab=s=>{pts.length=0;for(let y=s/2;y<H;y+=s)for(let xx=s/2;xx<W;xx+=s)if(data[(Math.round(y)*W+Math.round(xx))*4+3]>140)pts.push([xx,y])};
  grab(step);while(pts.length>2400){step++;grab(step)}
  tiles=pts.map(([tx,ty],i)=>{const b=city[Math.floor(Math.random()*city.length)],w=b.wins.length?b.wins[Math.floor(Math.random()*b.wins.length)]:[b.x+b.w/2,base-b.h/2];
    return {tx,ty,sx:w[0],sy:w[1],mx:rnd(W*.1,W*.9),my:rnd(H*.08,H*.62),i:i%stars.length,d:rnd(0,1),tw:rnd(0,6.28)}});
  /* every one of the faces gets at least one seat */
  tiles.sort(()=>Math.random()-.5);tiles.forEach((t,k)=>{t.i=k%stars.length;t.hero=k<stars.length;t.z=t.hero?rnd(.55,1):rnd(.12,.3)});
  title.step=step;title.base=base;
  /* the neon and the gold bed under the faces are painted once, not every frame */
  const paint=f=>{const c=document.createElement('canvas');c.width=W*DPR;c.height=H*DPR;const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);
    x.font=`700 ${fs}px ${FONT}`;x.textAlign='center';x.lineJoin='round';f(x);return c};
  title.under=paint(x=>{x.fillStyle='#5A1622';lines.forEach((l,i)=>x.fillText(l,W/2,top+i*lh))});
  title.neon=paint(x=>{for(const [w,b,a,c] of [[fs*.03,fs*.3,.45,GOLD],[fs*.012,fs*.07,.9,GOLD],[1.4,0,1,'#FFE2B8']]){
    x.globalAlpha=a;x.strokeStyle=c;x.lineWidth=w;x.shadowColor=GOLD;x.shadowBlur=b;lines.forEach((l,i)=>x.strokeText(l,W/2,top+i*lh))}})}

function drawCity(t,cam){
  g.fillStyle=sky;g.fillRect(0,0,W,title.base+2);
  /* sunset haze on the horizon */
  const hz=g.createRadialGradient(W*.55,title.base,0,W*.55,title.base,W*.7);hz.addColorStop(0,'rgba(226,90,60,.28)');hz.addColorStop(1,'rgba(226,90,60,0)');g.fillStyle=hz;g.fillRect(0,0,W,H);
  g.save();g.translate(W/2,title.base);g.scale(cam,cam);g.translate(-W/2,-title.base);
  for(const b of city){g.fillStyle=b.tall?'#14060A':'#1A080D';g.fillRect(b.x,title.base-b.h,b.w,b.h);
    if(b.tall){g.fillStyle='rgba(207,48,68,.85)';g.fillRect(b.x+b.w/2-1,title.base-b.h-6,2,6)}}
  g.restore();
  /* the sea and the Queen's Necklace */
  const sea=g.createLinearGradient(0,title.base,0,H);sea.addColorStop(0,'#2A0A10');sea.addColorStop(1,'#07020A');g.fillStyle=sea;g.fillRect(0,title.base,W,H-title.base);
  for(let k=0;k<70;k++){const u=k/69,x=u*W*1.1-W*.05,y=title.base+6+Math.sin(u*Math.PI)*H*.07;
    const a=.55+.35*Math.sin(t*2+k);g.fillStyle=`rgba(239,160,104,${a})`;g.beginPath();g.arc(x,y,1.6,0,7);g.fill();
    g.fillStyle=`rgba(239,160,104,${a*.12})`;g.fillRect(x-.6,y+4,1.2,rnd(8,18))}}

function windows(t,a,cam){
  if(a<=0)return;g.save();g.translate(W/2,title.base);g.scale(cam,cam);g.translate(-W/2,-title.base);
  for(const b of city)for(const w of b.wins){const on=clamp((a*1.4-w[2]*.6));if(on<=0)continue;
    g.fillStyle=`rgba(248,${190+w[2]*40|0},140,${on*(.45+.3*Math.sin(t*1.7+w[2]*9))})`;g.fillRect(w[0],w[1],2.2,3)}
  g.restore()}

function frame(now){
  if(done)return;if(!t0)t0=now;const t=isNaN(freeze)?(now-t0)/1000:freeze;
  g.globalCompositeOperation='source-over';g.globalAlpha=1;g.fillStyle='#0B0306';g.fillRect(0,0,W,H);
  const fadeIn=easeOut(seg(t,0,1.4)),cam=1+.05*easeOut(seg(t,0,6));
  g.globalAlpha=fadeIn;drawCity(t,cam);windows(t,seg(t,.4,2.2),cam);
  /* the city dims as the guests rise out of it */
  const dim=seg(t,2.6,4.6);if(dim>0){g.globalAlpha=dim*.72;g.fillStyle='#0B0306';g.fillRect(0,0,W,H)}
  g.globalAlpha=1;

  const under=seg(t,4.6,6.2);if(under>0){g.globalAlpha=under*.5;g.drawImage(title.under,0,0,W,H);g.globalAlpha=1}

  /* every guest leaves a window, swirls up big enough to know, then takes a seat in the title */
  const s=title.step,big=Math.max(26,Math.min(54,W*.035));
  for(const p of tiles){const sp=sprites[p.i];
    const lift=ease(seg(t,2.2+p.d*.9,3.5+p.d*.9)),land=ease(seg(t,3.9+p.d*1.4,5.0+p.d*1.4));
    if(lift<=0){const tw=clamp(seg(t,.6+p.d*1.4,1.2+p.d*1.4));if(tw>0){g.fillStyle=`rgba(255,214,160,${tw*(.6+.4*Math.sin(t*3+p.tw))})`;g.beginPath();g.arc(p.sx,p.sy,1.4,0,7);g.fill()}continue}
    const ax=p.sx+(p.mx-p.sx)*lift,ay=p.sy+(p.my-p.sy)*lift-Math.sin(lift*Math.PI)*H*.06;
    const x=ax+(p.tx-ax)*land,y=ay+(p.ty-ay)*land;
    const r=(2+(big*p.z-2)*lift)*(1-land)+(s*.56)*land;
    if(sp){g.globalAlpha=Math.min(1,lift*1.6);g.drawImage(sp,x-r,y-r,r*2,r*2)}else{g.fillStyle=GOLD;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
    if(p.hero&&land<1&&lift>.3){g.globalAlpha=.35*(1-land);g.strokeStyle=GOLD;g.lineWidth=1;g.beginPath();g.arc(x,y,r+.5,0,7);g.stroke()}}
  g.globalAlpha=1;

  /* the gilt: the letters light up like neon, flicker once, then hold */
  const gild=seg(t,6.0,7.0);
  if(gild>0){const flick=t<7.2&&Math.sin(t*61)>.55?.3:1;g.globalAlpha=gild*flick;g.drawImage(title.neon,0,0,W,H);
    /* the line falls out of the p */
    const drop=easeOut(seg(t,6.6,8.0));if(drop>0){const y0=title.py,y1=y0+(H-y0)*drop,lw=Math.max(2,title.fs*.016);g.lineCap='round';
      g.globalAlpha=.22;g.strokeStyle=GOLD;g.lineWidth=lw*5;g.beginPath();g.moveTo(title.px,y0);g.lineTo(title.px,y1);g.stroke();
      g.globalAlpha=1;g.strokeStyle='#FFE2B8';g.lineWidth=lw;g.beginPath();g.moveTo(title.px,y0);g.lineTo(title.px,y1);g.stroke()}
    g.globalAlpha=1}

  /* the sign-off */
  const tag=seg(t,7.6,8.6);if(tag>0){g.globalAlpha=tag*(1-seg(t,10.4,10.9));g.textAlign='center';g.fillStyle='rgba(248,230,220,.82)';
    const fz=Math.max(11,Math.min(15,W*.011));g.font=`500 ${fz}px "IBM Plex Mono",monospace`;
    const sp=c=>c.split('').join('\u200A'),k=clamp(tag*1.25),A='BOLLYWOOD HAS A LONG MEMORY.',B='WE KEPT THE RECEIPTS.';
    const ty=Math.min(H-60,title.top+(title.lines.length-1)*title.lh+title.fs*.62);
    g.font=`500 ${fz}px "IBM Plex Mono",monospace`;const wa=g.measureText(sp(A)).width,wb=g.measureText(sp(B)).width,gap=fz*1.6;
    /* either side of the falling line when there is room, otherwise stacked beside it */
    if(title.px-gap-wa>16&&title.px+gap+wb<W-16){g.textAlign='right';g.fillText(sp(A.slice(0,Math.ceil(A.length*k))),title.px-gap,ty);
      g.textAlign='left';g.fillText(sp(B.slice(0,Math.ceil(B.length*clamp(k*1.6-.6)))),title.px+gap,ty)}
    else{g.textAlign='left';const x=title.px+gap*.8;[A,B].forEach((m,i)=>{const sh=m.slice(0,Math.ceil(m.length*clamp(k*2-i)));
      sh.split(/(?<=HAS|LONG|KEPT) /).forEach((ln,j)=>g.fillText(ln,x,ty+(i*2+j)*fz*1.7))})}}
  g.globalAlpha=1;
  if(t>10.6&&isNaN(freeze))return finish();
  if(!isNaN(freeze)&&++frozen>30)return;
  raf=requestAnimationFrame(frame)}

let onResize=()=>{layout()};
/* the skyline needs no portraits, so it starts as soon as the title font is in; faces drop into place as they arrive */
Promise.race([document.fonts.load(`700 100px Quicksand`).catch(()=>{}),new Promise(r=>setTimeout(r,900))]).then(()=>{
  if(done)return;layout();addEventListener('resize',onResize);raf=requestAnimationFrame(frame)});
})();
