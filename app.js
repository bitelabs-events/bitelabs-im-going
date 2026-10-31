(function(){
'use strict';
const CAPTION="I'll be in Houston! 🎉 On Wednesday 2 December I'll be at the @BiteLabs Digital Health and Innovation Summit at TMC Innovation Factory, meeting clinicians, founders and health-system leaders building the future of healthcare technology. Coming too? Come and say hi, and bring a colleague: https://luma.com/g5q7vct1";
const $=id=>document.getElementById(id);
const canvas=$('card'), st={name:'',org:'',speaker:false,img:null,focus:[0.5,0.45],zoom:1};
let ok=false, pending=false, objURL=null;
$('caption').textContent=CAPTION;
function render(){ if(!ok) return; if(pending) return; pending=true;
  requestAnimationFrame(()=>{pending=false; BLCard.draw(canvas,st);}); }
function renderNow(){ if(ok) BLCard.draw(canvas,st); }
function setStatus(t){ $('status').textContent=t; if(t) setTimeout(()=>{ if($('status').textContent===t) $('status').textContent=''; },4000); }
function photoUI(){ const has=!!st.img; $('zoomRow').hidden=!has; $('removePhoto').hidden=!has; $('noPhoto').hidden=has; canvas.classList.toggle('has-photo',has);
  $('hint').textContent=has?'Drag the photo to reposition it. Use the zoom slider to frame your face.':'Your card updates as you type.'; }
function setImage(img){ st.img=img; st.zoom=1; st.focus=[0.5,0.45]; $('zoom').value='1'; photoUI(); render(); }
$('photo').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0]; if(!f) return;
  if(objURL) URL.revokeObjectURL(objURL); objURL=URL.createObjectURL(f);
  const img=new Image(); img.onload=()=>{ setImage(img); if(window.innerWidth<820) canvas.scrollIntoView({behavior:'smooth',block:'center'}); }; img.onerror=()=>setStatus("Sorry, that file couldn't be read. Please try a JPG or PNG."); img.src=objURL;
});
$('removePhoto').addEventListener('click',()=>{ st.img=null; $('photo').value=''; photoUI(); render(); });
$('zoom').addEventListener('input',e=>{ st.zoom=parseFloat(e.target.value)||1; clampFocus(); render(); });
$('name').addEventListener('input',e=>{ st.name=e.target.value; render(); });
$('org').addEventListener('input',e=>{ st.org=e.target.value; render(); });
document.querySelectorAll('input[name=badge]').forEach(r=>r.addEventListener('change',()=>{ st.speaker=document.querySelector('input[name=badge]:checked').value==='speaker'; render(); }));
function clampFocus(){ if(!st.img) return; const b=BLCard.cropBox(st.img,st.focus,st.zoom); st.focus=[(b.cx+b.side/2)/b.iw,(b.cy+b.side/2)/b.ih]; }
// drag to reposition
let drag=null;
canvas.addEventListener('pointerdown',e=>{ if(!st.img) return; drag={x:e.clientX,y:e.clientY,f:st.focus.slice()}; canvas.setPointerCapture(e.pointerId); canvas.classList.add('dragging'); });
canvas.addEventListener('pointermove',e=>{ if(!drag) return;
  const scale=BLCard.W/canvas.getBoundingClientRect().width; const b=BLCard.cropBox(st.img,drag.f,st.zoom);
  const k=scale*b.side/BLCard.P; // source pixels per screen pixel inside the photo box
  st.focus=[drag.f[0]-(e.clientX-drag.x)*k/b.iw, drag.f[1]-(e.clientY-drag.y)*k/b.ih]; clampFocus(); render(); });
const end=()=>{ drag=null; canvas.classList.remove('dragging'); };
canvas.addEventListener('pointerup',end); canvas.addEventListener('pointercancel',end);
function slug(n){ return n.toLowerCase().replace(/\./g,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
$('download').addEventListener('click',()=>{
  if(!st.name.trim()){ setStatus('Add your name first, then download.'); $('name').focus(); return; }
  renderNow();
  canvas.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='im-going-'+(slug(st.name)||'card')+'.png';
    document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},1500); setStatus('Card downloaded.'); },'image/png');
});
$('copy').addEventListener('click',async()=>{
  try{ await navigator.clipboard.writeText(CAPTION); setStatus('Caption copied. Paste it into your LinkedIn post.'); }
  catch(_){ const t=document.createElement('textarea'); t.value=CAPTION; t.style.position='fixed'; t.style.opacity='0'; document.body.appendChild(t); t.select();
    try{ document.execCommand('copy'); setStatus('Caption copied. Paste it into your LinkedIn post.'); }catch(e){ setStatus('Please select the caption below and copy it.'); } t.remove(); }
});
// hooks used by the automated tests
window.cardMaker={state:st, render:renderNow, setImage:(img,focus,zoom)=>{ setImage(img); if(focus) st.focus=focus; if(zoom){ st.zoom=zoom; $('zoom').value=String(zoom);} renderNow(); }, caption:CAPTION, slug};
BLCard.ready().then(()=>{ ok=true; renderNow(); document.documentElement.dataset.ready='1'; }).catch(e=>{ console.error(e); setStatus('Sorry, something failed to load. Please refresh the page.'); });
})();
