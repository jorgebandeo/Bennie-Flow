(()=>{
 const $=id=>document.getElementById(id);
 const A4={w:210,h:297},GRID=.8,ALPHA=22,STRATEGIES=7;
 let artUrl='',artName='',ratio=48/32,maskSource=null,previewUrls=[],editingDim=false,lastResult=null;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const sleep=()=>new Promise(r=>requestAnimationFrame(r));
 function cfg(){return{w:+$('nestW').value||48,h:+$('nestH').value||32,qty:Math.max(1,+$('nestQty').value||1),gap:Math.max(0,+$('nestGap').value||2),mx:Math.max(0,+$('safeX').value||14),my:Math.max(0,+$('safeY').value||18),rotate:$('nestRotate').checked}}
 function loadImage(url){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url})}
 function rotatedCanvas(src,q){q=((q%4)+4)%4;if(!q)return src;const c=document.createElement('canvas'),odd=q%2;c.width=odd?src.height:src.width;c.height=odd?src.width:src.height;const x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.rotate(q*Math.PI/2);x.drawImage(src,-src.width/2,-src.height/2);return c}
 async function buildSourceMask(){
  if(!artUrl){maskSource=null;previewUrls=[];return}
  const im=await loadImage(artUrl),max=220,scale=Math.min(1,max/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height)),cw=Math.max(12,Math.round((im.naturalWidth||im.width)*scale)),ch=Math.max(12,Math.round((im.naturalHeight||im.height)*scale));
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,cw,ch);ctx.drawImage(im,0,0,cw,ch);const d=ctx.getImageData(0,0,cw,ch),pix=d.data;let minX=cw,minY=ch,maxX=-1,maxY=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(pix[(y*cw+x)*4+3]>ALPHA){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
  if(maxX<0){maskSource=null;return}
  const w=maxX-minX+1,h=maxY-minY+1,crop=new Uint8Array(w*h),trim=document.createElement('canvas');trim.width=w;trim.height=h;trim.getContext('2d').drawImage(cv,minX,minY,w,h,0,0,w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)crop[y*w+x]=pix[((y+minY)*cw+(x+minX))*4+3]>ALPHA?1:0;
  maskSource={w,h,data:crop};ratio=w/h;previewUrls=[0,1,2,3].map(q=>rotatedCanvas(trim,q).toDataURL('image/png'));editingDim=true;$('nestW').value=(+$('nestH').value*ratio).toFixed(1);editingDim=false;
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
 function scorePlacement(strategy,x,y,v,maxX,maxY,W,H,n){const nx=Math.max(maxX,x+v.w),ny=Math.max(maxY,y+v.h),area=nx*ny,edge=Math.min(x,W-(x+v.w))+Math.min(y,H-(y+v.h));switch(strategy){case 0:return ny*100000+nx*120+area;case 1:return nx*100000+ny*120+area;case 2:return area*100+ny*4+nx;case 3:return area*100+nx*4+ny+(n%2&&v.q!==2?80:0);case 4:return ny*70000+area*60-edge*8;case 5:return area*100+Math.abs((x+v.w/2)-W/2)*3+ny;default:return area*100+((n%2)?x:W-x-v.w)*2+ny}}
 function firstFitsForY(occ,W,H,v,y,reverse=false){const out=[],max=W-v.w;if(max<0)return out;if(reverse){for(let x=max;x>=0;x--){if(fits(occ,W,H,v,x,y)){out.push(x);break}}}else{for(let x=0;x<=max;x++){if(fits(occ,W,H,v,x,y)){out.push(x);break}}}return out}
 function searchOne(c,strategy){
  const W=Math.floor((A4.w-c.mx*2)/GRID),H=Math.floor((A4.h-c.my*2)/GRID),occ=new Array(H).fill(0n),vs=variants(c),placed=[];let maxX=0,maxY=0;
  const order=strategy===3?[0,2,1,3]:strategy===6?[2,0,3,1]:[0,1,2,3];
  for(let n=0;n<c.qty;n++){
   let best=null;
   for(const qi of order){const v=vs.find(z=>z.q===qi);if(!v)continue;const yMax=Math.min(H-v.h,Math.max(v.h,Math.min(H-v.h,maxY+v.h)));for(let y=0;y<=yMax;y++){
     const dirs=strategy===1||strategy===6?[true,false]:[false,true];for(const rev of dirs){for(const x of firstFitsForY(occ,W,H,v,y,rev)){const s=scorePlacement(strategy,x,y,v,maxX,maxY,W,H,n);if(!best||s<best.s)best={x,y,v,s}}}
   }}
   if(!best)break;stamp(occ,best.v,best.x,best.y);maxX=Math.max(maxX,best.x+best.v.w);maxY=Math.max(maxY,best.y+best.v.h);placed.push({maskX:best.x,maskY:best.y,x:(best.x+best.v.pad)*GRID,y:(best.y+best.v.pad)*GRID,w:best.v.wMm,h:best.v.hMm,q:best.v.q,rawCount:best.v.rawCount,protectedCount:best.v.protectedCount});
  }
  return{placed,W:W*GRID,H:H*GRID,bbox:(maxX*GRID)*(maxY*GRID),maxX:maxX*GRID,maxY:maxY*GRID};
 }
 async function pack(c){let best=null;const started=performance.now();for(let s=0;s<STRATEGIES;s++){const r=searchOne(c,s);if(!best||r.placed.length>best.placed.length||(r.placed.length===best.placed.length&&r.bbox<best.bbox))best={...r,strategy:s};if(s===2||s===5)await sleep()}best.ms=performance.now()-started;return best}
 function previewFor(q){return previewUrls[q]||artUrl}
 function renderResult(c,r){
  lastResult=r;const safe=$('nestSafe');safe.style.left=(c.mx/A4.w*100)+'%';safe.style.top=(c.my/A4.h*100)+'%';safe.style.width=(r.W/A4.w*100)+'%';safe.style.height=(r.H/A4.h*100)+'%';
  safe.innerHTML=r.placed.map((a,i)=>`<div class="nest-item" style="left:${a.x/r.W*100}%;top:${a.y/r.H*100}%;width:${a.w/r.W*100}%;height:${a.h/r.H*100}%">${artUrl?`<img src="${previewFor(a.q)}" alt="Peça ${i+1}">`:'<b>♡</b>'}<span>${i+1}</span></div>`).join('')+(r.placed.length?'':`<div class="nesting-empty">A arte não cabe na área útil com estas medidas.</div>`);
  const safeArea=r.W*r.H,maskArea=r.placed.reduce((s,a)=>s+a.rawCount*GRID*GRID,0),protectedArea=r.placed.reduce((s,a)=>s+a.protectedCount*GRID*GRID,0),eff=safeArea?Math.min(100,protectedArea/safeArea*100):0,sheets=Math.ceil(c.qty/Math.max(1,r.placed.length));
  $('nestPlaced').textContent=r.placed.length;$('nestEfficiency').textContent=eff.toFixed(1)+'%';$('nestSheets').textContent=sheets;$('nestWaste').textContent=(100-eff).toFixed(1)+'%';
  $('nestDetails').innerHTML=`<div><span>Área útil</span><b>${r.W.toFixed(1)} × ${r.H.toFixed(1)} mm</b></div><div><span>Peça proporcional</span><b>${c.w.toFixed(1)} × ${c.h.toFixed(1)} mm</b></div><div><span>Máscara real impressa</span><b>${maskArea.toFixed(0)} mm²/folha</b></div><div><span>Área protegida + separação</span><b>${protectedArea.toFixed(0)} mm²/folha</b></div><div><span>Busca</span><b>${STRATEGIES} estratégias · ${r.ms.toFixed(0)} ms</b></div><div><span>Melhor estratégia</span><b>#${r.strategy+1}</b></div><div><span>Arquivo</span><b>${artName||'Demonstração'}</b></div>`;
 }
 async function run(){const btn=$('runNesting');if(btn){btn.disabled=true;btn.textContent='Otimizando…'}try{renderResult(cfg(),await pack(cfg()))}finally{if(btn){btn.disabled=false;btn.textContent='Otimizar arranjo'}}}
 function lockRatio(){const w=$('nestW'),h=$('nestH');w.addEventListener('input',()=>{if(editingDim)return;editingDim=true;h.value=(+w.value/ratio).toFixed(1);editingDim=false});h.addEventListener('input',()=>{if(editingDim)return;editingDim=true;w.value=(+h.value*ratio).toFixed(1);editingDim=false})}
 async function init(){
  if(!$('nestPaper'))return;document.querySelector('#nesting .page-title .tag').textContent='NESTING POR MÁSCARA · V3';document.querySelector('#nesting .page-title h2').textContent='A4 · otimização real por contorno';const note=document.querySelector('.nesting-note');if(note)note.textContent='A largura e a altura permanecem vinculadas pela proporção da arte. O V3 recorta a transparência, aplica a separação à máscara e compara várias estratégias de posição e rotação. O número principal é peças por folha; o percentual usa a área protegida real, não o retângulo transparente.';
  lockRatio();$('nestFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(!/image\/(png|svg\+xml)/.test(f.type)){alert('Use um arquivo PNG ou SVG.');return}if(artUrl)URL.revokeObjectURL(artUrl);artUrl=URL.createObjectURL(f);artName=f.name;await buildSourceMask();await run()};
  ['nestQty','nestGap','safeX','safeY','nestRotate'].forEach(id=>$(id).addEventListener('change',run));$('nestW').addEventListener('change',run);$('nestH').addEventListener('change',run);$('runNesting').onclick=run;$('resetNesting').onclick=()=>{$('nestW').value=48;$('nestH').value=(48/ratio).toFixed(1);$('nestQty').value=30;$('nestGap').value=2;$('safeX').value=14;$('safeY').value=18;$('nestRotate').checked=true;run()};await run();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();