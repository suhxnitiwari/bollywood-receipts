/* ---------- the opening titles: night over Bombay, every face a city light, then the title ---------- */
(()=>{
const q=new URLSearchParams(location.search),force=q.has('intro'),freeze=parseFloat(q.get('intro'));
/* it plays on every visit and every reload of the front page; Skip is always there */
const seen=false;
const home=document.body.classList.contains('inviting')||document.body.dataset.page==='front';
if(!force&&(seen||!home||matchMedia('(prefers-reduced-motion: reduce)').matches))return;

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
  while(x<W+20){const f=x/W,zone=f>.09&&f<.45?.06:f>.57&&f<.68?.1:f>.71?.12:1;
    const w=rnd(18,56)*(W/1400+.4),tall=zone===1&&Math.random()<.18,h=Math.min((tall?rnd(.32,.52):rnd(.08,.26))*H*(1-Math.abs(f-.55)*.6),zone*H+rnd(0,.03)*H);
    const wins=[];const cs=Math.max(5,w/6),rs=7;for(let yy=base-h+8;yy<base-6;yy+=rs)for(let xx=x+4;xx<x+w-4;xx+=cs)if(Math.random()<.22)wins.push([xx,yy,Math.random()]);
    city.push({x,w,h,tall,wins,shade:rnd(.0,.06)});x+=w+rnd(-4,6)}
  sky=g.createLinearGradient(0,0,0,base);sky.addColorStop(0,'#0B0306');sky.addColorStop(.55,'#1C070D');sky.addColorStop(.86,'#4A0F1A');sky.addColorStop(1,'#8A2A22');

  /* the title, measured, then cut into a mosaic of tiles */
  const two=W/H<1.9||W<900,lines=two?['the bandra','bulletin']:['the bandra bulletin'];
  const m=document.createElement('canvas').getContext('2d');m.font=`700 100px ${FONT}`;
  const widest=Math.max(...lines.map(l=>m.measureText(l).width));
  const fs=Math.min((W*.88)/widest*100,H*(two?.27:.34)),lh=fs*1.02,top=H*.47-(lines.length*lh)/2+fs*.78;
  const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d');o.font=`700 ${fs}px ${FONT}`;o.textAlign='center';o.fillStyle='#fff';
  title={fs,lh,top,lines};lines.forEach((l,i)=>o.fillText(l,W/2,top+i*lh));
  /* the descender of the p in receipts: Gossip Girl's line, dropped to the floor */
  const last=lines[lines.length-1],pi=last.lastIndexOf('i');o.font=`700 ${fs}px ${FONT}`;
  const lw=o.measureText(last).width,px=W/2-lw/2+o.measureText(last.slice(0,pi)).width+o.measureText('i').width/2;
  title.px=px;title.py=top+(lines.length-1)*lh-fs*.3;
  const data=o.getImageData(0,0,W,H).data;
  /* find the p's real stem in the rendered letters, so the line comes out of its centre, from the very bottom of the descender */
  {const A=(x,y)=>data[(Math.round(y)*W+Math.round(x))*4+3]>140,y0=Math.round(title.py+fs*.06);let a=-1,b=-1;
    for(let x=Math.round(px-fs*.35);x<px+fs*.35;x++){if(A(x,y0)){if(a<0)a=x;b=x}else if(a>=0)break}
    if(a>=0){title.px=(a+b)/2;title.sw=b-a;let y=y0;while(y<H-1&&A(title.px,y))y++;title.py=y}}
  let step=Math.max(6,Math.round(fs*.05));const pts=[];
  const grab=s=>{pts.length=0;for(let y=s/2;y<H;y+=s)for(let xx=s/2;xx<W;xx+=s)if(data[(Math.round(y)*W+Math.round(xx))*4+3]>140)pts.push([xx,y])};
  grab(step);while(pts.length>2400){step++;grab(step)}
  tiles=pts.map(([tx,ty],i)=>{const b=city[Math.floor(Math.random()*city.length)],w=b.wins.length?b.wins[Math.floor(Math.random()*b.wins.length)]:[b.x+b.w/2,base-b.h/2];
    /* the title writes itself left to right: each guest's turn comes with its letter */
    return {tx,ty,sx:w[0],sy:w[1],i:i%stars.length,d:clamp(tx/W*.8+rnd(0,.2)),tw:rnd(0,6.28)}});
  /* every one of the faces gets at least one seat */
  tiles.sort(()=>Math.random()-.5);tiles.forEach((t,k)=>{t.i=k%stars.length});
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
  landmarks(t,title.base);
  g.restore();
  /* the sea and the Queen's Necklace */
  const sea=g.createLinearGradient(0,title.base,0,H);sea.addColorStop(0,'#2A0A10');sea.addColorStop(1,'#07020A');g.fillStyle=sea;g.fillRect(0,title.base,W,H-title.base);
  for(let k=0;k<70;k++){const u=k/69,x=u*W*1.1-W*.05,y=title.base+6+Math.sin(u*Math.PI)*H*.07;
    const a=.55+.35*Math.sin(t*2+k);g.fillStyle=`rgba(239,160,104,${a})`;g.beginPath();g.arc(x,y,1.6,0,7);g.fill();
    g.fillStyle=`rgba(239,160,104,${a*.12})`;g.fillRect(x-.6,y+4,1.2,rnd(8,18))}}


/* Bombay's own silhouettes, so nobody mistakes it for any other skyline: the Gateway, the Taj, Rajabai, Antilia and the Sea Link */
function landmarks(t,base){
  const u=Math.min(W/1150,H/700),c='#0E0407',lit='rgba(248,200,140,';
  g.save();g.shadowColor='rgba(226,90,60,.55)';g.shadowBlur=14*u;
  const at=f=>W*f;
  g.fillStyle=c;
  /* Gateway of India: the great arch with its four turrets */
  {const x=at(.11),w=150*u,h=118*u,y=base-h;
    g.beginPath();g.moveTo(x,base);g.lineTo(x,y+18*u);g.lineTo(x+w,y+18*u);g.lineTo(x+w,base);
    g.lineTo(x+w*.66,base);g.lineTo(x+w*.66,y+62*u);g.quadraticCurveTo(x+w/2,y+28*u,x+w*.34,y+62*u);g.lineTo(x+w*.34,base);g.closePath();g.fill();
    for(const f of [.06,.3,.7,.94]){const cx=x+w*f;g.fillRect(cx-9*u,y,18*u,20*u);g.beginPath();g.arc(cx,y,9*u,Math.PI,0);g.fill();g.fillRect(cx-1*u,y-16*u,2*u,8*u)}}
  /* the Taj Mahal Palace: a long front, corner towers, the great central dome */
  {const x=at(.2),w=300*u,h=120*u,y=base-h;
    g.fillRect(x,y,w,h);
    for(const f of [0,.97]){g.fillRect(x+w*f-6*u,y-26*u,22*u,26*u);g.beginPath();g.arc(x+w*f+5*u,y-26*u,11*u,Math.PI,0);g.fill()}
    const cx=x+w/2;g.fillRect(cx-34*u,y-30*u,68*u,30*u);g.beginPath();g.moveTo(cx-38*u,y-30*u);g.quadraticCurveTo(cx-40*u,y-92*u,cx,y-104*u);g.quadraticCurveTo(cx+40*u,y-92*u,cx+38*u,y-30*u);g.closePath();g.fill();
    g.fillRect(cx-1.5*u,y-120*u,3*u,18*u);
    for(let r=0;r<5;r++)for(let k=0;k<22;k++){const on=(Math.sin(k*7.1+r*3.3+t*.6)+1)/2;if(on<.55)continue;g.fillStyle=lit+(.25+on*.35)+')';g.fillRect(x+10*u+k*13*u,y+12*u+r*20*u,4*u,6*u)}g.fillStyle=c}
  /* Rajabai Clock Tower: a slim Gothic shaft with its lit clock */
  {const x=at(.405),w=34*u,y=base-260*u;
    g.fillRect(x,y,w,260*u);g.fillRect(x-6*u,y+40*u,w+12*u,8*u);g.fillRect(x+4*u,y-40*u,w-8*u,40*u);
    g.beginPath();g.moveTo(x+2*u,y-40*u);g.lineTo(x+w/2,y-110*u);g.lineTo(x+w-2*u,y-40*u);g.closePath();g.fill();
    g.fillStyle='rgba(255,226,184,.85)';g.beginPath();g.arc(x+w/2,y-18*u,7*u,0,7);g.fill();g.fillStyle=c}
  /* Antilia: twenty-seven storeys of cantilevered blocks */
  {const x=at(.6),y0=base;let y=y0;const blocks=[[0,46,28],[-8,58,34],[6,44,26],[-12,64,30],[4,50,28],[-6,58,24],[10,40,26],[-4,54,30],[2,48,22]];
    for(const [dx,w,h] of blocks){y-=h*u;g.fillRect(x+dx*u,y,w*u,h*u+1);g.fillStyle=lit+'.18)';g.fillRect(x+dx*u+3*u,y+h*u-6*u,(w-6)*u,2*u);g.fillStyle=c}}
  /* the Bandra–Worli Sea Link, low over the water: two pylons, fans of cable, the deck lit end to end */
  {const x0=at(.72),x1=W+40,dy=base+H*.035;
    g.fillRect(x0,dy,x1-x0,5*u);
    for(const pf of [.32,.68]){const px=x0+(x1-x0)*pf,ph=170*u;
      g.beginPath();g.moveTo(px-14*u,dy);g.lineTo(px-3*u,dy-ph);g.lineTo(px+3*u,dy-ph);g.lineTo(px+14*u,dy);g.closePath();g.fill();
      g.strokeStyle='rgba(239,160,104,.45)';g.lineWidth=Math.max(.6,.8*u);
      for(let k=1;k<=9;k++){const top=dy-ph*(.45+k*.05);g.beginPath();g.moveTo(px,top);g.lineTo(px-k*16*u,dy);g.moveTo(px,top);g.lineTo(px+k*16*u,dy);g.stroke()}}
    for(let x=x0;x<x1;x+=14*u){const a=.5+.4*Math.sin(t*2.2+x*.05);g.fillStyle=`rgba(239,160,104,${a})`;g.fillRect(x,dy-2*u,2*u,2*u)}
    g.fillStyle=c}
  g.restore();
}

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

  /* every guest leaves a lit window and flies straight to a seat in the title, small and in order, no pile-up */
  const s=title.step;
  for(const p of tiles){const sp=sprites[p.i];
    const m=ease(seg(t,2.4+p.d*1.8,3.6+p.d*1.8));
    if(m<=0){const tw=clamp(seg(t,.6+p.d*1.4,1.2+p.d*1.4));if(tw>0){g.fillStyle=`rgba(255,214,160,${tw*(.6+.4*Math.sin(t*3+p.tw))})`;g.beginPath();g.arc(p.sx,p.sy,1.4,0,7);g.fill()}continue}
    const x=p.sx+(p.tx-p.sx)*m,y=p.sy+(p.ty-p.sy)*m-Math.sin(m*Math.PI)*H*.1;
    const r=1.4+(s*.56-1.4)*m;
    if(m<1){g.globalAlpha=.5*(1-m);g.fillStyle=GOLD;g.beginPath();g.arc(x,y+r*1.2,r*.5,0,7);g.fill()}
    g.globalAlpha=Math.min(1,m*2.5);
    if(sp)g.drawImage(sp,x-r,y-r,r*2,r*2);else{g.fillStyle=GOLD;g.beginPath();g.arc(x,y,r,0,7);g.fill()}}
  g.globalAlpha=1;

  /* the gilt: the letters light up like neon, flicker once, then hold */
  const gild=seg(t,6.0,7.0);
  if(gild>0){const flick=t<7.2&&Math.sin(t*61)>.55?.3:1;g.globalAlpha=gild*flick;g.drawImage(title.neon,0,0,W,H);
    /* the line falls out of the p */
    const drop=easeOut(seg(t,6.6,8.0));if(drop>0){const y0=title.py-1,y1=y0+(H-y0)*drop,lw=Math.max(1.6,title.fs*.012);g.lineCap='round';
      const fade=(a)=>{const gr=g.createLinearGradient(0,y0,0,H);gr.addColorStop(0,`rgba(239,160,104,${a})`);gr.addColorStop(.7,`rgba(239,160,104,${a*.55})`);gr.addColorStop(1,'rgba(239,160,104,0)');return gr};
      g.save();g.shadowColor=GOLD;g.shadowBlur=title.fs*.3;g.globalAlpha=.45;g.strokeStyle=fade(1);g.lineWidth=title.fs*.03;g.beginPath();g.moveTo(title.px,y0);g.lineTo(title.px,y1);g.stroke();
      g.shadowBlur=title.fs*.07;g.globalAlpha=.9;g.lineWidth=title.fs*.012;g.beginPath();g.moveTo(title.px,y0);g.lineTo(title.px,y1);g.stroke();
      g.shadowBlur=0;g.globalAlpha=1;const core=g.createLinearGradient(0,y0,0,H);core.addColorStop(0,'#FFE2B8');core.addColorStop(.75,'rgba(255,226,184,.5)');core.addColorStop(1,'rgba(255,226,184,0)');
      g.strokeStyle=core;g.lineWidth=1.4;g.beginPath();g.moveTo(title.px,y0);g.lineTo(title.px,y1);g.stroke();g.restore()}
    g.globalAlpha=1}

  /* the sign-off */
  const tag=seg(t,7.6,8.6);if(tag>0){g.globalAlpha=tag*(1-seg(t,10.4,10.9));g.textAlign='center';g.fillStyle='rgba(248,230,220,.82)';
    const fz=Math.max(11,Math.min(22,W*.0105));g.font=`500 ${fz}px "IBM Plex Mono",monospace`;
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

let onResize=()=>{if(innerWidth&&innerHeight)layout()};
/* the skyline needs no portraits, so it starts as soon as the title font is in; faces drop into place as they arrive */
Promise.race([document.fonts.load(`700 100px Quicksand`).catch(()=>{}),new Promise(r=>setTimeout(r,900))]).then(()=>{
  if(done)return;if(!innerWidth||!innerHeight)return finish();layout();addEventListener('resize',onResize);raf=requestAnimationFrame(frame)});
})();
