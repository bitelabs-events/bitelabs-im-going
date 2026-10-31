/* BiteLabs "I'm going" card renderer. A port of style A (v9) in im_going_cards.py.
   Fixed layers (background, logos, tilted headline, ticket, date and pill) come from
   assets/card-base.png, rendered by the same Python code. Only the photo and the
   badge, name and organisation are drawn here, with the same layout rules. */
(function(){
'use strict';
const W=1080,H=1350;
const ROYAL='rgb(18,38,110)', MINT='rgb(52,211,153)', INK='rgb(12,27,51)', GREY='rgb(110,120,148)';
const PX=96, PY=790, P=340, PR=36;           // photo box on the card
const NX=476, MAXW=508, TOP=790, HEIGHT=340;  // identity block
const OFF={badge:9, initials:46, aff32:31, aff29:29, aff26:26}; // PIL anchor to baseline offsets
const F={name:s=>`${s}px "BL Sora 700"`, badge:'23px "BL Inter 800"', aff:s=>`${s}px "BL Inter 500"`};
const ELL='\u2026';

function loadImg(src){return new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=bad;i.src=src;});}
let base=null, iniBg=null;
async function ready(){
  const faces=[['BL Sora 700','Sora-700.woff'],['BL Inter 500','Inter14-500.woff'],['BL Inter 800','Inter14-800.woff']];
  await Promise.all(faces.map(async([fam,file])=>{const f=new FontFace(fam,`url(assets/${file})`);await f.load();document.fonts.add(f);}));
  [base,iniBg]=await Promise.all([loadImg('assets/card-base.png'),loadImg('assets/initials-bg.png')]);
}
function tl(ctx,t,f){ctx.font=f;return ctx.measureText(t).width;}
function wrapLines(ctx,text,f,maxw,maxl=2){
  const words=text.split(/\s+/).filter(Boolean); let lines=[],cur='';
  for(const w of words){const t=(cur+' '+w).trim(); if(tl(ctx,t,f)<=maxw||!cur) cur=t; else {lines.push(cur);cur=w;}}
  lines.push(cur);
  if(lines.length>maxl){lines=lines.slice(0,maxl); let last=lines[maxl-1];
    while(tl(ctx,last+ELL,f)>maxw && last.includes(' ')) last=last.slice(0,last.lastIndexOf(' '));
    lines[maxl-1]=last.replace(/[,;:]+$/,'')+ELL;}
  return lines;
}
function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function initialsOf(name){
  const parts=name.replace('Dr ','').split(/\s+/).filter(p=>/^\p{L}/u.test(p));
  if(!parts.length) return 'B';
  return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();
}
/* Crop maths copied from a8_photo: square side = min side / zoom, centred on focus, clamped. */
function cropBox(img,focus,zoom){
  const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
  const side=Math.trunc(Math.min(ih,iw)/zoom);
  const cx=Math.min(Math.max(Math.trunc(focus[0]*iw-side/2),0),iw-side);
  const cy=Math.min(Math.max(Math.trunc(focus[1]*ih-side/2),0),ih-side);
  return {cx,cy,side,iw,ih};
}
function scaledPhoto(img,box){
  // step down by halves for a smooth result, then to 340 x 340
  let src=document.createElement('canvas'); let s=box.side; src.width=src.height=s;
  let c=src.getContext('2d'); c.imageSmoothingQuality='high'; c.drawImage(img,box.cx,box.cy,s,s,0,0,s,s);
  while(s/2>=P*1.5){const n=document.createElement('canvas'); const ns=Math.round(s/2); n.width=n.height=ns;
    const nc=n.getContext('2d'); nc.imageSmoothingQuality='high'; nc.drawImage(src,0,0,s,s,0,0,ns,ns); src=n; s=ns;}
  return {src,s};
}
function draw(canvas,st){
  const ctx=canvas.getContext('2d'); canvas.width=W; canvas.height=H;
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(base,0,0);
  const name=(st.name||'').trim()||'Your Name';
  // photo or initials
  ctx.save(); rrect(ctx,PX,PY,P,P,PR); ctx.clip();
  if(st.img){const box=cropBox(st.img,st.focus,st.zoom); const {src,s}=scaledPhoto(st.img,box); ctx.drawImage(src,0,0,s,s,PX,PY,P,P);}
  else {ctx.drawImage(iniBg,PX,PY,P,P); const ini=initialsOf(name); const f=F.name(136); ctx.font=f; ctx.fillStyle='#fff';
    ctx.textBaseline='alphabetic'; ctx.fillText(ini,PX+P/2-tl(ctx,ini,f)/2,PY+P/2+OFF.initials);}
  ctx.restore();
  // identity block (a8_identity)
  ctx.textBaseline='alphabetic';
  const parts=name.split(/\s+/).filter(Boolean); let sz=64; let lines=[name];
  if(tl(ctx,name,F.name(Math.trunc(64*0.86)))>MAXW && parts.length>1){
    let best=null,bw=1e9;
    for(let k=1;k<parts.length;k++){const ls=[parts.slice(0,k).join(' '),parts.slice(k).join(' ')];
      const m=Math.max(...ls.map(l=>tl(ctx,l,F.name(64)))); if(m<bw){bw=m;best=ls;}}
    lines=best;
  }
  const widest=s=>Math.max(...lines.map(l=>tl(ctx,l,F.name(s))));
  while(widest(sz)>MAXW && sz>34) sz-=2;
  while(widest(sz)>MAXW && sz>18) sz-=1;      // beyond the Python floor, only so nothing is clipped
  const lh=Math.trunc(sz*1.12);
  const aff=(st.org||'').trim(); let al=[], asz=32;
  for(asz of [32,29,26]){al=aff?wrapLines(ctx,aff,F.aff(asz),MAXW):[]; if(!al.length||!al[al.length-1].endsWith(ELL)) break;}
  while(al.some(l=>tl(ctx,l,F.aff(asz))>MAXW) && asz>16){asz-=1; al=wrapLines(ctx,aff,F.aff(asz),MAXW);} // very long single words
  const alh=Math.trunc(asz*1.25);
  const block=46+26+lines.length*lh+(al.length?14+al.length*alh:0);
  let y=TOP+(HEIGHT-block)/2;
  // badge
  const bt=st.speaker?'SPEAKER':'ATTENDEE'; const bwid=tl(ctx,bt,F.badge)+44;
  ctx.fillStyle=MINT; rrect(ctx,NX,y,bwid+1,47,23); ctx.fill();
  ctx.fillStyle=ROYAL; ctx.font=F.badge; ctx.fillText(bt,NX+bwid/2-tl(ctx,bt,F.badge)/2,y+23+1+OFF.badge);
  y+=46+26;
  ctx.fillStyle=INK; ctx.font=F.name(sz);
  lines.forEach((l,i)=>ctx.fillText(l,NX,y+(i+1)*lh-Math.trunc(sz*0.22)));
  y+=lines.length*lh+14;
  const ao=OFF['aff'+asz]!=null?OFF['aff'+asz]:Math.round(asz*0.97);
  ctx.fillStyle=GREY; ctx.font=F.aff(asz);
  al.forEach((l,i)=>ctx.fillText(l,NX,y+i*alh+ao));
}
window.BLCard={W,H,PX,PY,P,ready,draw,cropBox};
})();
