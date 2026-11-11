const R=document.documentElement,files=document.getElementById('files'),doc=document.getElementById('doc'),toc=document.getElementById('toc'),meta=document.getElementById('meta'),status=document.getElementById('status'),ed=document.getElementById('ed'),blinks=document.getElementById('blinks'),tip=document.getElementById('tip'),modal=document.getElementById('modal'),mbody=document.getElementById('mbody'),med=document.getElementById('med'),mmsg=document.getElementById('mmsg');
let all=[];let cur={path:'',markdown:''},mode='read',graph={nodes:[],edges:[]},byKey={},gpos={},gsim=null;
function showTip(id){const n=graph.nodes.find(n=>n.id===id);if(!n){hideTip();return;}const f=all.find(x=>x.path===id);const nb=graph.edges.filter(e=>e.to===id).length;tip.innerHTML='<b>'+esc(n.title||id)+'</b><div class="tt">'+esc(id)+(f&&f.tags&&f.tags.length?' · '+f.tags.map(t=>'#'+esc(t)).join(' '):'')+'</div>'+(f&&f.excerpt?'<div class="tx">'+esc(f.excerpt)+'</div>':'')+(nb?'<div class="tt" style="margin-top:.2rem">🔗 cité par '+nb+'</div>':'');tip.hidden=false;moveTip();}
let tipXY=[0,0];
function moveTip(){const w=Math.max(tip.offsetWidth,260),h=tip.offsetHeight||90;let x=tipXY[0]+16,y=tipXY[1]+16;if(x+w>innerWidth-8)x=tipXY[0]-w-16;if(y+h>innerHeight-8)y=Math.max(8,tipXY[1]-h-16);tip.style.left=Math.max(8,x)+'px';tip.style.top=y+'px';}
function hideTip(){tip.hidden=true;}
function apply(){if(!localStorage.th)localStorage.th='dark';R.style.setProperty('--fs',(localStorage.fs||20)+'px');R.dataset.th=localStorage.th;R.style.setProperty('--lh',localStorage.lh||1.7);document.getElementById('th').value=localStorage.th;document.getElementById('lh').value=localStorage.lh||1.7;}
apply();
document.getElementById('pm').onclick=()=>{localStorage.fs=Math.min(34,+(localStorage.fs||20)+1);apply();};
document.getElementById('dm').onclick=()=>{localStorage.fs=Math.max(14,+(localStorage.fs||20)-1);apply();};
document.getElementById('th').onchange=e=>{localStorage.th=e.target.value;apply();};
document.getElementById('lh').onchange=e=>{localStorage.lh=e.target.value;apply();};
function sbOpen(){return localStorage.sb==='1';}
function setSb(o){localStorage.sb=o?'1':'0';document.getElementById('lay').classList.toggle('folded',!o);}
setSb(sbOpen());
document.getElementById('m').onclick=()=>setSb(!sbOpen());
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function stripFront(md){const m=md.match(/^---\n([\s\S]*?)\n---\n?/);if(!m)return{body:md,tags:[]};const tags=[...m[1].matchAll(/tags:\s*\[([^\]]*)\]|tags:\s*(.+)/g)].flatMap(x=>(x[1]||x[2]||'').split(/[, ]+/)).filter(Boolean);return{body:md.slice(m[0].length),tags};}
function lightEnhance(root){root.querySelectorAll('blockquote').forEach(b=>{const t=b.textContent.match(/^\s*\[!(note|warning|tip|important|caution)\]\s*(.*)$/s);if(t){const d=document.createElement('div');d.className='callout';d.innerHTML='<b>'+esc(t[1].toUpperCase())+'</b>'+esc(t[2]).slice(0,400);b.replaceWith(d);}});
  root.querySelectorAll('pre code').forEach(c=>{const m=c.className.match(/language-(\w+)/);if(m&&!c.previousSibling){const l=document.createElement('div');l.style.cssText='font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.72rem;opacity:.6;margin-bottom:.4em';l.textContent=m[1];c.parentElement.prepend(l);}});}
function enhance(){lightEnhance(doc);
  const hs=[...doc.querySelectorAll('h1,h2,h3')];if(hs.length>2){toc.hidden=false;toc.innerHTML='<b>Sommaire</b><br>'+hs.map((h,i)=>{if(!h.id)h.id='s'+i;return `<a style="margin-left:${(h.tagName[1]-1)*1.1}em" href="#${h.id}">${esc(h.textContent.slice(0,60))}</a>`;}).join('<br>');}else toc.hidden=true;}
async function load(){try{const r=await fetch('/api/files');all=await r.json();}catch(e){files.innerHTML='<p>Serveur injoignable</p>';return;}await loadGraph();status.textContent=all.length+' notes · '+graph.edges.length+' liens · rendu '+(window.marked?'marked':'serveur');render('');const gw=document.getElementById('graphWrap');gw.hidden=false;startGraph();}
function row(x){return `<a class="f${x.path===cur.path?' act':''}" href="#" data-p="${esc(x.path)}" title="${esc(x.path)}">📄 ${esc(x.title)}</a>`;}
function closedDirs(){try{return JSON.parse(localStorage.closedDirs||'[]');}catch(e){return[];}}
function treeHTML(t,prefix){let h='';Object.keys(t).sort().forEach(k=>{if(k==='\0files')return;const full=prefix?prefix+'/'+k:k;const open=!closedDirs().includes(full);h+=`<details data-dir="${esc(full)}"${open?' open':''}><summary title="${esc(full)}">📁 ${esc(k)}</summary><div class="kids">`+treeHTML(t[k],full)+`</div></details>`;});(t['\0files']||[]).forEach(x=>{h+=row(x);});return h;}
function render(f){const q=(f||'').toLowerCase();const list=all.filter(x=>(x.path+x.title).toLowerCase().includes(q));if(!list.length){files.innerHTML='<p>Aucun .md</p>';return;}if(q){files.innerHTML=list.map(row).join('');}else{const t={};list.forEach(x=>{const p=x.path.split('/');let n=t;for(let i=0;i<p.length-1;i++){n[p[i]]=n[p[i]]||{};n=n[p[i]];}(n['\0files']=n['\0files']||[]).push(x);});files.innerHTML='<div class="tree">'+treeHTML(t,'')+'</div>';}files.querySelectorAll('a.f').forEach(a=>a.onclick=e=>{e.preventDefault();openModal(a.dataset.p);});}
files.addEventListener('toggle',e=>{const d=e.target.closest?e.target.closest('details[data-dir]'):null;if(!d||e.target!==d)return;let c=closedDirs();const dir=d.dataset.dir;if(d.open)c=c.filter(x=>x!==dir);else if(!c.includes(dir))c.push(dir);localStorage.closedDirs=JSON.stringify(c);},true);
async function loadGraph(){try{const r=await fetch('/api/graph');graph=await r.json();}catch(e){graph={nodes:[],edges:[]};}byKey={};graph.nodes.forEach(n=>{byKey[n.id.toLowerCase()]=n.id;byKey[n.id.replace(/\.md$/i,'').toLowerCase()]=n.id;byKey[n.id.split('/').pop().replace(/\.md$/i,'').toLowerCase()]=n.id;if(n.title)byKey[n.title.toLowerCase()]=n.id;});}
function wikiMd(md){return md.replace(/(!?)\[\[([^\]]+)\]\]/g,(m,emb,inner)=>{const ps=inner.split('|');const ref=(ps[0]||'').split('#')[0].trim();const alias=(ps[1]!==undefined?ps[1]:ps[0]).trim()||ref;const dst=byKey[ref.replace(/\.md$/i,'').toLowerCase()];if(emb)return dst?`<a href="#" data-wiki="${esc(dst)}" title="${esc(dst)}">⤵ ${esc(alias)}</a>`:`<span class="wb">⤵ ${esc(alias)}</span>`;return dst?`<a href="#" data-wiki="${esc(dst)}" title="${esc(dst)}">${esc(alias)}</a>`:`<span class="wb" title="note introuvable : ${esc(ref)}">${esc(alias)}</span>`;});}
function backlinksHTML(){if(!cur.path)return'';const from=[...new Set(graph.edges.filter(e=>e.to===cur.path).map(e=>e.from))];if(!from.length)return'';return '<b>🔗 Cité par ('+from.length+')</b> '+from.map(p=>{const n=graph.nodes.find(n=>n.id===p);return `<a href="#" data-wiki="${esc(p)}">${esc(n?n.title:p)}</a>`;}).join(' · ');}
[doc,blinks,mbody].forEach(el=>el.addEventListener('click',e=>{const a=e.target.closest('a[data-wiki]');if(a){e.preventDefault();openModal(a.dataset.wiki);}}));
document.getElementById('bGraph').onclick=()=>{const w=document.getElementById('graphWrap');w.hidden=!w.hidden;if(!w.hidden)startGraph();else stopGraph();};
function stopGraph(){if(gsim&&gsim.raf)cancelAnimationFrame(gsim.raf);gsim=null;hideTip();}
function startGraph(){
  stopGraph();
  const cv=document.getElementById('cv'),wrap=cv.parentElement;
  const dpr=Math.min(window.devicePixelRatio||1,2),W=wrap.clientWidth||600,H=420;
  cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';
  const N=graph.nodes.length;
  document.getElementById('gHint').textContent=N?N+' notes · '+graph.edges.length+' liens · groupés par dossier — molette = zoom · glisser le fond = déplacer · glisser un nœud · clique = ouvrir':'Aucune note. Crée des [[liens]] entre notes pour voir le graphe.';
  if(!N)return;
  const deg={};graph.edges.forEach(e=>{deg[e.from]=(deg[e.from]||0)+1;deg[e.to]=(deg[e.to]||0)+1;});
  const fold={};graph.nodes.forEach(n=>{const p=n.id.split('/');p.pop();fold[n.id]=p.join('/');});
  const folders=[...new Set(Object.values(fold))].sort();
  const fan={};folders.forEach((k,i)=>{const a=i/folders.length*2*Math.PI-Math.PI/2;const r=Math.min(W,H)*.32;fan[k]=[W/2+Math.cos(a)*r,H/2+Math.sin(a)*r];});
  const nodes=graph.nodes.map((n,i)=>{
    let x,y;
    if(gpos[n.id]){[x,y]=[gpos[n.id][0]*W,gpos[n.id][1]*H];}
    else{const fa=fan[fold[n.id]];x=fa[0]+(Math.random()-.5)*80;y=fa[1]+(Math.random()-.5)*80;}
    return{id:n.id,title:n.title,x,y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,r:3.5+Math.min(deg[n.id]||0,6)*1.4};
  });
  const byId={};nodes.forEach(n=>byId[n.id]=n);
  const pairs=graph.edges.map(e=>byId[e.from]&&byId[e.to]?[byId[e.from],byId[e.to]]:null).filter(Boolean);
  const adj={};graph.edges.forEach(e=>{(adj[e.from]=adj[e.from]||[]).push(e.to);(adj[e.to]=adj[e.to]||[]).push(e.from);});
  const S={cv,W,H,dpr,nodes,pairs,adj,cx:W/2,cy:H/2,k:1,px:0,py:0,hover:null,drag:null,pan:null,moved:false,raf:0,fold,fan,folders};
  gsim=S;
  S.w2s=(x,y)=>[S.cx+(x-S.cx-S.px)*S.k,S.cy+(y-S.cy-S.py)*S.k];
  S.s2w=(x,y)=>[(x-S.cx)/S.k+S.cx+S.px,(y-S.cy)/S.k+S.cy+S.py];
  const pos=e=>{const rc=cv.getBoundingClientRect();return[e.clientX-rc.left,e.clientY-rc.top];};
  const at=(x,y)=>{const w=S.s2w(x,y);let b=null,bd=20/S.k;S.nodes.forEach(n=>{const d=Math.hypot(n.x-w[0],n.y-w[1]);if(d<bd){bd=d;b=n;}});return b;};
  cv.onmousedown=e=>{hideTip();const p=pos(e),n=at(p[0],p[1]);S.moved=false;if(n){S.drag=n;n.vx=n.vy=0;}else{S.pan={x:p[0],y:p[1],px:S.px,py:S.py};}wake();};
  cv.onmousemove=e=>{tipXY=[e.clientX,e.clientY];const p=pos(e);if(S.drag){const w=S.s2w(p[0],p[1]);S.drag.x=w[0];S.drag.y=w[1];S.moved=true;hideTip();wake();}else if(S.pan){S.px=S.pan.px-(p[0]-S.pan.x)/S.k;S.py=S.pan.py-(p[1]-S.pan.y)/S.k;S.moved=true;hideTip();wake();}else{const n=at(p[0],p[1]),id=n?n.id:null;if(id!==S.hover){S.hover=id;if(id)showTip(id);else hideTip();wake();}else if(id)moveTip();cv.style.cursor=n?'pointer':'grab';}};
  cv.onmouseup=e=>{if(!S.moved){const p=pos(e),n=at(p[0],p[1]);if(n)openModal(n.id);}S.drag=null;S.pan=null;};
  cv.onmouseleave=()=>{S.hover=null;S.drag=null;S.pan=null;hideTip();wake();};
  cv.onwheel=e=>{e.preventDefault();hideTip();const p=pos(e),w=S.s2w(p[0],p[1]),k2=Math.max(.35,Math.min(3,S.k*Math.exp(-e.deltaY*.0012)));S.k=k2;S.px=w[0]-S.cx-(p[0]-S.cx)/k2;S.py=w[1]-S.cy-(p[1]-S.cy)/k2;wake();},{passive:false};
  wake();
}
function wake(){if(gsim&&!gsim.raf)gsim.raf=requestAnimationFrame(tick);}
function tick(){
  const S=gsim;if(!S)return;S.raf=0;
  const L=150;
  for(let i=0;i<S.nodes.length;i++){const a=S.nodes[i];
    for(let j=i+1;j<S.nodes.length;j++){const b=S.nodes[j];
      const dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+40;
      const f=Math.min(3200/d2,5),d=Math.sqrt(d2),ux=dx/d,uy=dy/d;
      a.vx+=ux*f;a.vy+=uy*f;b.vx-=ux*f;b.vy-=uy*f;}}
  S.pairs.forEach(pr=>{const a=pr[0],b=pr[1];
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=0.02*(d-L),ux=dx/d,uy=dy/d;
    a.vx+=ux*f;a.vy+=uy*f;b.vx-=ux*f;b.vy-=uy*f;});
  let e2=0;const cx=S.W/2,cy=S.H/2;
  S.nodes.forEach(n=>{if(n!==S.drag){n.vx+=(cx-n.x)*0.006;n.vy+=(cy-n.y)*0.006;
    const fa=S.fan[S.fold[n.id]];if(fa){n.vx+=(fa[0]-n.x)*0.004;n.vy+=(fa[1]-n.y)*0.004;}
    n.vx*=0.86;n.vy*=0.86;
    const s=Math.hypot(n.vx,n.vy);if(s>6){n.vx*=6/s;n.vy*=6/s;}
    n.x+=n.vx;n.y+=n.vy;
    n.x=Math.max(30,Math.min(S.W-30,n.x));n.y=Math.max(20,Math.min(S.H-20,n.y));}
    e2+=n.vx*n.vx+n.vy*n.vy;gpos[n.id]=[n.x/S.W,n.y/S.H];});
  paint(S);
  if(e2>0.02||S.drag)wake();
}
function paint(S){
  const c=S.cv.getContext('2d');
  c.setTransform(S.dpr,0,0,S.dpr,0,0);
  c.fillStyle=(R.dataset.th==='dark'||R.dataset.th==='contrast')?'#08080d':'#121219';c.fillRect(0,0,S.W,S.H);
  const st=getComputedStyle(R);
  const acc=(st.getPropertyValue('--acc')||'#b35400').trim();
  const ND='#a78bfa',NDH='#ddd0ff',LBL='#b9b9c9';
  const step=30,x0=S.cx+S.px-(S.W/2)/S.k-step,x1=S.cx+S.px+(S.W/2)/S.k+step;
  const y0=S.cy+S.py-(S.H/2)/S.k-step,y1=S.cy+S.py+(S.H/2)/S.k+step;
  c.fillStyle='rgba(255,255,255,.10)';
  for(let gx=Math.ceil(x0/step)*step;gx<x1;gx+=step)for(let gy=Math.ceil(y0/step)*step;gy<y1;gy+=step){const s=S.w2s(gx,gy);c.fillRect(s[0],s[1],1,1);}
  const hov=S.hover,hot=hov?new Set([hov].concat(S.adj[hov]||[])):null;
  if(S.folders.length>1){c.font='9px ui-monospace,Menlo,Consolas,monospace';c.fillStyle='rgba(185,185,201,.45)';
    S.folders.forEach(k=>{const a=S.fan[k],p=S.w2s(a[0],a[1]);if(p[0]>-120&&p[0]<S.W+120&&p[1]>-30&&p[1]<S.H+40){c.fillText(k||'racine',p[0],p[1]+S.k*14);}});}
  S.pairs.forEach(pr=>{const a=S.w2s(pr[0].x,pr[0].y),b=S.w2s(pr[1].x,pr[1].y);
    const isHot=hot&&(pr[0].id===hov||pr[1].id===hov);
    const alpha=isHot?1:(!hot?.5:.14),col=isHot?acc:ND;
    c.strokeStyle=col;c.globalAlpha=alpha*.22;c.lineWidth=4;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
    c.globalAlpha=alpha;c.lineWidth=isHot?1.7:1.25;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();});
  c.globalAlpha=1;c.textAlign='center';c.font='10px ui-monospace,Menlo,Consolas,monospace';
  S.nodes.forEach(n=>{
    const p=S.w2s(n.x,n.y),r=Math.max(n.r*S.k,2.5);
    const dim=hot&&!hot.has(n.id),isCur=n.id===cur.path;
    c.globalAlpha=dim?.15:1;
    if(isCur||n.id===hov){c.shadowBlur=14;c.shadowColor=isCur?acc:NDH;}else c.shadowBlur=0;
    c.beginPath();c.arc(p[0],p[1],r+(n.id===hov?2:0),0,7);
    c.fillStyle=isCur?acc:(n.id===hov?NDH:ND);c.fill();
    c.shadowBlur=0;
    if(isCur){c.beginPath();c.arc(p[0],p[1],r+6*S.k,0,7);c.strokeStyle=acc;c.globalAlpha=.5;c.stroke();c.globalAlpha=dim?.15:1;}
    if(!hot||hot.has(n.id)){c.fillStyle=LBL;c.fillText((n.title||n.id).slice(0,24),p[0],p[1]-r-5);}
  });
  c.globalAlpha=1;c.shadowBlur=0;
}
// ---------- Modale note ----------
let mpath='',mdirty=false,mmd='';
function msetMsg(t){mmsg.textContent=t;}
function renderModalBody(){const {body}=stripFront(wikiMd(mmd));if(window.marked){marked.setOptions({gfm:true,breaks:false});mbody.innerHTML=marked.parse(body);}else{mbody.innerHTML='<p>marked manquant.</p>';return;}lightEnhance(mbody);}
function renderModalMeta(){const {tags}=stripFront(mmd);const n=graph.nodes.find(n=>n.id===mpath);document.getElementById('mtitle').textContent=n?(n.title||mpath):mpath;document.getElementById('mtags').textContent=tags.map(t=>'#'+t).join(' ');}
function setMmode(e){med.hidden=!e;document.getElementById('mSave').hidden=!e;document.getElementById('mRead').disabled=!e?false:true;document.getElementById('mEdit').disabled=e;if(e){med.focus();}else{renderModalBody();}}
async function openModal(p){
  if(!document.getElementById('graphWrap').hidden)stopGraph();
  try{
    const r=await fetch('/api/raw?path='+encodeURIComponent(p));const j=await r.json();
    if(j.error)throw j.error;
    mpath=p;mmd=j.markdown;mdirty=false;med.value=mmd;msetMsg('');setMmode(false);
    renderModalMeta();
    files.querySelectorAll('a.f').forEach(a=>a.classList.toggle('act',a.dataset.p===p));
    modal.hidden=false;
  }catch(e){modal.hidden=false;msetMsg('⚠ '+e);}
}
function closeModal(force){
  if(mdirty&&!force&&!confirm('Modifications non sauvées — fermer quand même ?'))return;
  mdirty=false;modal.hidden=true;mpath='';
  const gw=document.getElementById('graphWrap');if(!gw.hidden)startGraph();
}
document.getElementById('mClose').onclick=()=>closeModal(false);
modal.addEventListener('mousedown',e=>{if(e.target===modal)closeModal(false);});
document.getElementById('mEdit').onclick=()=>setMmode(true);
document.getElementById('mRead').onclick=()=>{if(mdirty&&!confirm('Perdre les modifs ?'))return;mdirty=false;med.value=mmd;setMmode(false);};
med.addEventListener('input',()=>{mdirty=true;msetMsg('● modifié');});
document.getElementById('mSave').onclick=saveModal;
async function saveModal(){
  if(!mpath)return;msetMsg('Sauve…');
  try{
    const r=await fetch('/api/save?path='+encodeURIComponent(mpath),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:med.value});
    const j=await r.json();if(j.error)throw j.error;
    mmd=med.value;mdirty=false;msetMsg('✅ sauvé ('+j.bytes+' o, .bak créé)');
    renderModalMeta();
    const r2=await fetch('/api/files');all=await r2.json();await loadGraph();
    render(document.getElementById('q').value);
    status.textContent=all.length+' notes · '+graph.edges.length+' liens · rendu '+(window.marked?'marked':'serveur');
  }catch(e){msetMsg('❌ '+e);}
}
document.getElementById('mFull').onclick=()=>{
  if(mdirty&&!confirm('Modifications non sauvées — ouvrir en pleine page quand même ?'))return;
  const p=mpath;mdirty=false;modal.hidden=true;mpath='';open(p);
};
document.getElementById('q').oninput=e=>render(e.target.value);
async function open(p){
  files.querySelectorAll('a').forEach(a=>a.classList.toggle('act',a.dataset.p===p));
  setMsg('');setMode('read');
  document.querySelector('.atools').hidden=false;
  try{
    const r=await fetch('/api/raw?path='+encodeURIComponent(p));const j=await r.json();
    if(j.error)throw 0;
    cur={path:p,markdown:j.markdown};ed.value=j.markdown;ed.classList.remove('dirty');
    renderPreview();
    if(gsim)wake();
    window.scrollTo(0,0);
  }catch(e){doc.innerHTML='<p>Impossible de charger.</p>';}
}
function renderPreview(){
  const {body,tags}=stripFront(wikiMd(ed.value||cur.markdown||''));
  if(window.marked){marked.setOptions({gfm:true,breaks:false});doc.innerHTML=marked.parse(body);}
  else{doc.innerHTML='<p>Aperçu indisponible (marked manquant).</p>';return;}
  meta.innerHTML=(tags.length?tags.map(t=>`<span>#${esc(t)}</span>`).join(''):'')+`<span>${esc(cur.path)}</span>`+(ed.classList.contains('dirty')?'<span>● modifié</span>':'');
  enhance();
  const bh=backlinksHTML();blinks.hidden=!bh;blinks.innerHTML=bh;
}
let deb=null;
ed.addEventListener('input',()=>{ed.classList.add('dirty');setMsg('');clearTimeout(deb);deb=setTimeout(renderPreview,250);});
function setMode(m){mode=m;const e=m==='edit';ed.hidden=!e;document.getElementById('aSave').hidden=!e;document.getElementById('aRead').disabled=!e?false:true;document.getElementById('aEdit').disabled=e;if(e){renderPreview();ed.focus();}}
document.getElementById('aRead').onclick=()=>setMode('read');
document.getElementById('aEdit').onclick=()=>{if(!cur.path){setMsg('Ouvre une note d’abord');return;}setMode('edit');};
document.getElementById('aSave').onclick=save;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){closeModal(false);return;}if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();if(!modal.hidden&&mpath&&!med.hidden)saveModal();else if(mode==='edit')save();}});
function setMsg(t){document.getElementById('savemsg').textContent=t;}
async function save(){
  if(!cur.path)return;setMsg('Sauve…');
  try{
    const r=await fetch('/api/save?path='+encodeURIComponent(cur.path),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:ed.value});
    const j=await r.json();if(j.error)throw j.error;
    cur.markdown=ed.value;ed.classList.remove('dirty');setMsg('✅ sauvé ('+j.bytes+' o, .bak créé)');
    const r2=await fetch('/api/files');all=await r2.json();await loadGraph();render(document.getElementById('q').value);renderPreview();
    if(!document.getElementById('graphWrap').hidden)startGraph();
  }catch(e){setMsg('❌ '+e);}
}
load();
