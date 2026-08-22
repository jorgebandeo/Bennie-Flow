(()=>{
 const $=id=>document.getElementById(id);
 const A4={w:210,h:297},GRID=.7,ALPHA=22;
 let artUrl='',artName='',ratio=48/32,maskSource=null,previewUrls=[],editingDim=false,lastResult=null,bestMemory=new Map();
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const sleep=()=>new Promise(r=>requestAnimationFrame(r));
 function cfg(){return{w:+$('nestW').value||48,h:+$('nestH').value||32,qty:Math.max(1,+$('nestQty').value||1),gap:Math.max(0,+$('nestGap').value||2),mx:Math.max(0,+$('safeX').value||14),my:Math.max(0,+$('safeY').value||18),rotate:$('nestRotate').checked}}
 function key(c){return[artName,c.w.toFixed(2),c.h.toFixed(2),c.gap,c.mx,c.my,c.rotate].join('|')}
 function loadImage(url){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url})}
 function rotatedCanvas(src,q){q=((q%4)+4)%4;if(!q)return src;const c=document.createElement('canvas'),odd=q%2;c.width=odd?src.height:src.width;c.height=odd?src.width:src.height;const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(q*Math.PI/2);x.drawImage(src,-src.width/2,-src.height/2);return c}
 async function buildSourceMask(){
  if(!artUrl){maskSource=null;previewUrls=[];return}
  const im=await loadImage(artUrl),max=260,scale=Math.min(1,max/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height)),cw=Math.max(16,Math.round((im.naturalWidth||im.width)*scale)),ch=Math.max(16,Math.round((im.naturalHeight||im.height)*scale));
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,cw,ch);ctx.drawImage(im,0,0,cw,ch);const d=ctx.getImageData(0,0,cw,ch),pix=d.data;let minX=cw,minY=ch,maxX=-1,maxY=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(pix[(y*cw+x)*4+3]>ALPHA){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
  if(maxX<0){maskSource=null;return}
  const w=maxX-minX+1,h=maxY-minY+1,crop=new Uint8Array(w*h),trim=document.createElement('canvas');trim.width=w;trim.height=h;trim.getContext('2d').drawImage(cv,minX,minY,w,h,0,0,w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)crop[y*w+x]=pix[((y+minY)*cw+(x+minX))*4+3]>ALPHA?1:0;
  maskSource={w,h,data:crop};ratio=w/h;previewUrls=[0,1,2,3].map(q=>rotatedCanvas(trim,q).toDataURL('image/png'));editingDim=true;$('nestW').value=(+$('nestH').value*ratio).toFixed(1);editingDim=false;bestMemory.clear();
 }
 function rotateMask(src,q){q=((q%4)+4)%4;if(!q)return src;let cur=src;for(let k=0;k<q;k++){const nw=cur.h,nh=cur.w,out=new Uint8Array(nw*nh);for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++)out[x*nw+(nw-1-y)]=cur.data[y*cur.w+x];cur={w:nw,h:nh,data:out}}return cur}
 function makeVariant(src,wMm,hMm,gapMm,q){
  const gw=Math.max(1,Math.round(wMm/GRID)),gh=Math.max(1,Math.round(hMm/GRID)),r=Math.max(0,Math.ceil((gapMm/2)/GRID)),raw=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const sx=Math.min(src.w-1,Math.floor(x/gw*src.w)),sy=Math.min(src.h-1,Math.floor(y/gh*src.h));raw[y*gw+x]=src.data[sy*src.w+sx]}
  const W=gw+r*2,H=gh+r*2,inf=new Uint8Array(W*H);let rawCount=0;
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(raw[y*gw+x]){rawCount++;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r)continue;const nx=x+r+dx,ny=y+r+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H)inf[ny*W+nx]=1}}
  const rows=new Array(H).fill(0n);let protectedCount=0;for(let y=0;y<H;y++){let bits=0n;for(let x=0;x<W;x++)if(inf[y*W+x]){bits|=1n<<BigInt(x);protectedCount++}rows[y]=bits}
  return{q,wMm,hMm,gw,gh,pad:r,w:W,h:H,rows,rawCount,protectedCount};
 }
 function variants(c){const src=maskSource||{w:100,h:Math.max(1,Math.round(100/ratio)),data:new Uint8Array(100*Math.max(1,Math.round(100/ratio))).fill(1)},qs=c.rotate?[0,1,2,3]:[0];return qs.map(q=>{const rs=rotateMask(src,q),odd=q%2,w=odd?c.h:c.w,h=odd?c.w:c.h;return makeVariant(rs,w,h,c.gap,q)})}
 function fits(occ,W,H,v,x,y){if(x<0||y<0||x+v.w>W||y+v.h>H)return false;const sh=BigInt(x);for(let r=0;r<v.h;r++){const bits=v.rows[r];if(bits&&(occ[y+r]&(bits<<sh)))return false}return true}
 function stamp(occ,v,x,y){const sh=BigInt(x);for(let r=0;r<v.h;r++)if(v.rows[r])occ[y+r]|=v.rows[r]<<sh}
 function placement(v,x,y){return{maskX:x,maskY:y,x:(x+v.pad)*GRID,y:(y+v.pad)*GRID,w:v.wMm,h:v.hMm,q:v.q,rawCount:v.rawCount,protectedCount:v.protectedCount}}
 function validateCandidate(c,r,vs){const W=Math.floor((A4.w-c.mx*2)/GRID),H=Math.floor((A4.h-c.my*2)/GRID),occ=new Array(H).fill(0n);for(const p of r.placed){const v=vs.find(x=>x.q===p.q);if(!v||!fits(occ,W,H,v,p.maskX,p.maskY))return false;stamp(occ,v,p.maskX,p.maskY)}return true}
 function better(a,b){return!b||a.placed.length>b.placed.length||(a.placed.length===b.placed.length&&a.bbox<b.bbox)}
 function exhaustiveGreedy(c,mode,vs){
  const W=Math.floor((A4.w-c.mx*2)/GRID),H=Math.floor((A4.h-c.my*2)/GRID),occ=new Array(H).fill(0n),placed=[];let maxX=0,maxY=0;
  for(let n=0;n<c.qty;n++){
   let best=null;
   for(const v of vs){for(let y=0;y<=H-v.h;y++){for(let x=0;x<=W-v.w;x++){if(!fits(occ,W,H,v,x,y))continue;const nx=Math.max(maxX,x+v.w),ny=Math.max(maxY,y+v.h),area=nx*ny,contact=(x===0?6:0)+(y===0?6:0)+(x+v.w===W?2:0)+(y+v.h===H?2:0);let s;if(mode===0)s=area*100+ny*8+nx-contact*60;else if(mode===1)s=ny*100000+area*30+nx-contact*50;else if(mode===2)s=area*80+nx*6+ny-contact*80;else s=area*100+Math.abs((x+v.w/2)-W/2)*4+ny-contact*60;if(!best||s<best.s)best={x,y,v,s};}}
   }
   if(!best)break;stamp(occ,best.v,best.x,best.y);maxX=Math.max(maxX,best.x+best.v.w);maxY=Math.max(maxY,best.y+best.v.h);placed.push(placement(best.v,best.x,best.y));
  }
  return{placed,W:W*GRID,H:H*GRID,bbox:maxX*maxY*GRID*GRID,family:'compactação livre',mode};
 }
 function pairCompatible(v1,v2,dx,dy){const minX=Math.min(0,dx),minY=Math.min(0,dy),maxX=Math.max(v1.w,dx+v2.w),maxY=Math.max(v1.h,dy+v2.h),W=maxX-minX,H=maxY-minY,occ=new Array(H).fill(0n),x1=-minX,y1=-minY,x2=dx-minX,y2=dy-minY;if(!fits(occ,W,H,v1,x1,y1))return false;stamp(occ,v1,x1,y1);return fits(occ,W,H,v2,x2,y2)}
 function minHorizontalPitch(v){for(let dx=1;dx<=v.w;dx++)if(pairCompatible(v,v,dx,0))return dx;return v.w}
 function latticeSearch(c,vs){
  const W=Math.floor((A4.w-c.mx*2)/GRID),H=Math.floor((A4.h-c.my*2)/GRID);let best=null;
  for(const v of vs){const dx=minHorizontalPitch(v),dyStart=Math.max(1,Math.floor(v.h*.35));for(let dy=dyStart;dy<=v.h;dy++){for(let shift=0;shift<dx;shift++){
    if(!pairCompatible(v,v,shift,dy)&&!pairCompatible(v,v,shift-dx,dy))continue;
    const occ=new Array(H).fill(0n),placed=[];let row=0,maxX=0,maxY=0;
    for(let y=0;y<=H-v.h&&placed.length<c.qty;y+=dy,row++){const off=(row%2)?shift:0;for(let x=-off;x<=W-v.w;x+=dx){if(x<0)continue;if(fits(occ,W,H,v,x,y)){stamp(occ,v,x,y);placed.push(placement(v,x,y));maxX=Math.max(maxX,x+v.w);maxY=Math.max(maxY,y+v.h);if(placed.length>=c.qty)break}}}
    const r={placed,W:W*GRID,H:H*GRID,bbox:maxX*maxY*GRID*GRID,family:'padrão repetitivo',mode:`q${v.q}/dx${dx}/dy${dy}/s${shift}`};if(better(r,best))best=r;
  }}}
  return best||{placed:[],W:W*GRID,H:H*GRID,bbox:Infinity,family:'padrão repetitivo',mode:'—'};
 }
 function edgeFill(c,base,vs){
  const W=Math.floor((A4.w-c.mx*2)/GRID),H=Math.floor((A4.h-c.my*2)/GRID),occ=new Array(H).fill(0n),placed=[];for(const p of base.placed){const v=vs.find(x=>x.q===p.q);if(v&&fits(occ,W,H,v,p.maskX,p.maskY)){stamp(occ,v,p.maskX,p.maskY);placed.push({...p})}}
  while(placed.length<c.qty){let best=null;for(const v of vs){for(let y=0;y<=H-v.h;y++){for(let x=0;x<=W-v.w;x++){if(!fits(occ,W,H,v,x,y))continue;let contacts=0;const probes=[[x-1,y],[x+v.w,y],[x,y-1],[x,y+v.h]];contacts+=(x===0||x+v.w===W?4:0)+(y===0||y+v.h===H?4:0);for(const [px,py] of probes)if(px>=0&&py>=0&&px<W&&py<H&&occ[py]&&(occ[py]&(1n<<BigInt(px))))contacts+=3;const s=y*1000+x-contacts*120;if(!best||s<best.s)best={x,y,v,s}}}}
   if(!best)break;stamp(occ,best.v,best.x,best.y);placed.push(placement(best.v,best.x,best.y));
  }
  let maxX=0,maxY=0;placed.forEach(p=>{const v=vs.find(x=>x.q===p.q);maxX=Math.max(maxX,p.maskX+v.w);maxY=Math.max(maxY,p.maskY+v.h)});return{placed,W:W*GRID,H:H*GRID,bbox:maxX*maxY*GRID*GRID,family:base.family+' + preenchimento',mode:base.mode};
 }
 async function pack(c){
  const started=performance.now(),vs=variants(c),candidates=[];
  for(let mode=0;mode<4;mode++){candidates.push(exhaustiveGreedy(c,mode,vs));await sleep()}
  const lattice=latticeSearch(c,vs);candidates.push(lattice,edgeFill(c,lattice,vs));await sleep();
  const previous=bestMemory.get(key(c));if(previous)candidates.push(previous);
  let best=null;for(const r of candidates)if(r&&validateCandidate(c,r,vs)&&better(r,best))best=r;
  best={...(best||candidates[0]),ms:performance.now()-started,tested:candidates.length};bestMemory.set(key(c),best);return best;
 }
 function previewFor(q){return previewUrls[q]||artUrl}
 function renderResult(c,r){
  lastResult=r;const safe=$('nestSafe');safe.style.left=(c.mx/A4.w*100)+'%';safe.style.top=(c.my/A4.h*100)+'%';safe.style.width=(r.W/A4.w*100)+'%';safe.style.height=(r.H/A4.h*100)+'%';
  safe.innerHTML=r.placed.map((a,i)=>`<div class="nest-item" style="left:${a.x/r.W*100}%;top:${a.y/r.H*100}%;width:${a.w/r.W*100}%;height:${a.h/r.H*100}%">${artUrl?`<img src="${previewFor(a.q)}" alt="Peça ${i+1}">`:'<b>♡</b>'}<span>${i+1}</span></div>`).join('')+(r.placed.length?'':`<div class="nesting-empty">A arte não cabe na área útil com estas medidas.</div>`);
  const safeArea=r.W*r.H,maskArea=r.placed.reduce((s,a)=>s+a.rawCount*GRID*GRID,0),protectedArea=r.placed.reduce((s,a)=>s+a.protectedCount*GRID*GRID,0),eff=safeArea?Math.min(100,protectedArea/safeArea*100):0,sheets=Math.ceil(c.qty/Math.max(1,r.placed.length));
  $('nestPlaced').textContent=r.placed.length;$('nestEfficiency').textContent=eff.toFixed(1)+'%';$('nestSheets').textContent=sheets;$('nestWaste').textContent=(100-eff).toFixed(1)+'%';
  $('nestDetails').innerHTML=`<div><span>Área útil</span><b>${r.W.toFixed(1)} × ${r.H.toFixed(1)} mm</b></div><div><span>Peça proporcional</span><b>${c.w.toFixed(1)} × ${c.h.toFixed(1)} mm</b></div><div><span>Máscara real impressa</span><b>${maskArea.toFixed(0)} mm²/folha</b></div><div><span>Área protegida + separação</span><b>${protectedArea.toFixed(0)} mm²/folha</b></div><div><span>Família vencedora</span><b>${r.family}</b></div><div><span>Busca validada</span><b>${r.tested} candidatos · ${r.ms.toFixed(0)} ms</b></div><div><span>Arquivo</span><b>${artName||'Demonstração'}</b></div>`;
 }
 async function run(){const btn=$('runNesting');if(btn){btn.disabled=true;btn.textContent='Otimizando…'}try{const c=cfg(),r=await pack(c);renderResult(c,r)}finally{if(btn){btn.disabled=false;btn.textContent='Otimizar arranjo'}}}
 function lockRatio(){const w=$('nestW'),h=$('nestH');w.addEventListener('input',()=>{if(editingDim)return;editingDim=true;h.value=(+w.value/ratio).toFixed(1);editingDim=false});h.addEventListener('input',()=>{if(editingDim)return;editingDim=true;w.value=(+h.value*ratio).toFixed(1);editingDim=false})}
 async function init(){
  if(!$('nestPaper'))return;document.querySelector('#nesting .page-title .tag').textContent='NESTING POR MÁSCARA · V4';document.querySelector('#nesting .page-title h2').textContent='A4 · busca compacta + padrões repetitivos';const note=document.querySelector('.nesting-note');if(note)note.textContent='O V4 compara compactação livre e padrões repetitivos deslocados, valida todas as colisões pela máscara com a separação configurada e preserva o melhor resultado encontrado para a mesma configuração. Assim uma nova tentativa nunca substitui um layout melhor por outro pior.';
  lockRatio();$('nestFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(!/image\/(png|svg\+xml)/.test(f.type)){alert('Use um arquivo PNG ou SVG.');return}if(artUrl)URL.revokeObjectURL(artUrl);artUrl=URL.createObjectURL(f);artName=f.name;await buildSourceMask();await run()};
  ['nestQty','nestGap','safeX','safeY','nestRotate'].forEach(id=>$(id).addEventListener('change',run));$('nestW').addEventListener('change',()=>{bestMemory.clear();run()});$('nestH').addEventListener('change',()=>{bestMemory.clear();run()});$('runNesting').onclick=run;$('resetNesting').onclick=()=>{$('nestW').value=48;$('nestH').value=(48/ratio).toFixed(1);$('nestQty').value=100;$('nestGap').value=2;$('safeX').value=14;$('safeY').value=18;$('nestRotate').checked=true;bestMemory.clear();run()};await run();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();