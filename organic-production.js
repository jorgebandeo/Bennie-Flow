(()=>{
 const stages=['Preparação','Impressão','BOPP','Corte','Acabamento','Pronto'];
 const normalizeStage=s=>stages.includes(s)?s:(s==='Arte'?'Preparação':'Preparação');
 function ensureBranches(order){
  if(order._branchesReady)return;
  order.items.forEach(item=>{item.branchId='main';item.status='Preparação'});
  order.branches=[{id:'main',label:'Principal',stage:'Preparação'}];
  order._branchesReady=true;
 }
 function branchItems(order,branchId){return order.items.filter(i=>i.branchId===branchId)}
 function getBranch(order,branchId){ensureBranches(order);return order.branches.find(b=>b.id===branchId)}
 function nextBranchId(order){let n=2;while(order.branches.some(b=>b.id==='parte'+n))n++;return 'parte'+n}
 function reindexLabels(order){order.branches.forEach((b,i)=>{b.label=i===0?'Principal':`Parte ${i+1}`})}
 function autoMerge(order){
  ensureBranches(order);
  const byStage={};
  order.branches.forEach(b=>(byStage[b.stage]??=[]).push(b));
  Object.values(byStage).forEach(list=>{
   if(list.length<2)return;
   const target=list[0];
   list.slice(1).forEach(source=>{branchItems(order,source.id).forEach(item=>{item.branchId=target.id;item.status=target.stage});order.branches=order.branches.filter(b=>b.id!==source.id)})
  });
  reindexLabels(order);
 }
 function moveWholeBranch(order,branch,dir){
  const idx=stages.indexOf(branch.stage),next=idx+dir;if(next<0||next>=stages.length)return;
  branch.stage=stages[next];branchItems(order,branch.id).forEach(i=>i.status=branch.stage);autoMerge(order)
 }
 function moveSingleItem(order,item,dir){
  const current=getBranch(order,item.branchId),idx=stages.indexOf(current.stage),next=idx+dir;if(next<0||next>=stages.length)return;
  const targetStage=stages[next];
  const existing=order.branches.find(b=>b.stage===targetStage);
  if(existing){item.branchId=existing.id;item.status=existing.stage}
  else if(branchItems(order,current.id).length===1){current.stage=targetStage;item.status=targetStage}
  else {const id=nextBranchId(order);order.branches.push({id,label:`Parte ${order.branches.length+1}`,stage:targetStage});item.branchId=id;item.status=targetStage}
  if(branchItems(order,current.id).length===0)order.branches=order.branches.filter(b=>b.id!==current.id);
  autoMerge(order)
 }
 function cardProducts(items){return items.map(i=>`<div class="summary-product"><span>${i.product}</span><b>${i.qty} un.</b></div>`).join('')}
 function branchCard(order,branch){const items=branchItems(order,branch.id);return `<article class="compact-order-card branch-card" draggable="true" data-order="${order.id}" data-branch="${branch.id}"><div class="compact-order-heading"><div><b>${order.id}${order.branches.length>1?' · '+branch.label:''}</b><small>${order.client}</small></div><span>›</span></div><div class="compact-product-list">${cardProducts(items)}</div>${order.branches.length>1?`<small class="split-badge">${order.branches.length} partes do mesmo pedido</small>`:''}</article>`}
 function renderProduction(){
  orders.forEach(o=>{ensureBranches(o);autoMerge(o)});
  const board=document.getElementById('productionBoard');if(!board)return;
  board.className='production-board organic-flow-board';
  board.innerHTML=`<div class="flow-sequence-head">${stages.map((s,i)=>`<div><span>${i+1}</span><b>${s}</b>${i<stages.length-1?'<i>→</i>':''}</div>`).join('')}</div><div class="flow-columns">${stages.map(stage=>`<section class="process-column organic-col" data-stage="${stage}"><div class="process-col-head"><b>${stage}</b><span>${orders.reduce((n,o)=>n+o.branches.filter(b=>b.stage===stage).length,0)}</span></div><div class="organic-drop">${orders.flatMap(o=>o.branches.filter(b=>b.stage===stage).map(b=>branchCard(o,b))).join('')||'<div class="stage-empty">Sem pedidos nesta etapa</div>'}</div></section>`).join('')}</div>`;
  board.querySelectorAll('.branch-card').forEach(card=>{
   card.addEventListener('click',()=>openBranch(card.dataset.order,card.dataset.branch));
   card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',`${card.dataset.order}|${card.dataset.branch}`));
  });
  board.querySelectorAll('.organic-col').forEach(col=>{col.addEventListener('dragover',e=>e.preventDefault());col.addEventListener('drop',e=>{e.preventDefault();const [oid,bid]=(e.dataTransfer.getData('text/plain')||'|').split('|'),o=orders.find(x=>x.id===oid),b=o&&getBranch(o,bid);if(b){b.stage=col.dataset.stage;branchItems(o,b.id).forEach(i=>i.status=b.stage);autoMerge(o);renderProduction()}})})
 }
 function renderPopup(order,focusBranch){
  autoMerge(order);
  const dlg=document.getElementById('orderDetailsDialog');document.getElementById('orderDetailsTitle').textContent=`${order.id} · ${order.client}`;
  document.getElementById('orderDetailsSummary').innerHTML=`<div class="order-popup-headline"><span class="status">${order.branches.length} parte${order.branches.length>1?'s':''}</span><b>Prazo ${order.due}</b></div>`;
  document.getElementById('orderSplitHint').innerHTML='<div class="organic-hint"><b>Separação automática</b><span>Mova a parte inteira ou apenas um produto. Se um produto sair sozinho, nasce outra parte. Se duas partes chegarem à mesma etapa, elas se juntam automaticamente.</span></div>';
  const container=document.getElementById('orderDetailsProducts');
  container.innerHTML=order.branches.map(branch=>`<section class="branch-popup ${branch.id===focusBranch?'focused-branch':''}" data-branch="${branch.id}"><div class="branch-popup-head"><div><span class="tag">${order.branches.length===1?'PEDIDO INTEIRO':branch.label.toUpperCase()}</span><h3>${branch.stage}</h3></div><div class="branch-step-actions"><button type="button" data-branch-action="back" ${stages.indexOf(branch.stage)<=0?'disabled':''}>← Tudo</button><button type="button" data-branch-action="next" ${stages.indexOf(branch.stage)>=stages.length-1?'disabled':''}>Tudo →</button></div></div>${branchItems(order,branch.id).map(item=>{const p=productByName(item.product),idx=stages.indexOf(branch.stage);return `<article class="popup-product-card branch-product" data-item-index="${order.items.indexOf(item)}"><img src="${p.image}" alt="${p.name}"><div class="popup-product-content"><span class="tag">${p.id}</span><h3>${p.name}</h3><p>${p.description}</p><div class="popup-product-stats"><span>Quantidade<b>${item.qty}</b></span><span>Boas<b>${item.done}</b></span><span>Erradas<b>${item.waste}</b></span><span>Etapa<b>${branch.stage}</b></span></div><div class="flow-actions item-move-actions"><button type="button" data-item-action="back" ${idx<=0?'disabled':''}>← Este produto</button><button type="button" data-item-action="next" ${idx>=stages.length-1?'disabled':''}>Este produto →</button></div></div></article>`}).join('')}</section>`).join('');
  container.querySelectorAll('.branch-popup').forEach(sec=>{const branch=getBranch(order,sec.dataset.branch);sec.querySelectorAll('[data-branch-action]').forEach(btn=>btn.onclick=()=>{moveWholeBranch(order,branch,btn.dataset.branchAction==='next'?1:-1);renderProduction();renderPopup(order,branch.id)})});
  container.querySelectorAll('.branch-product').forEach(card=>{const item=order.items[+card.dataset.itemIndex];card.querySelectorAll('[data-item-action]').forEach(btn=>btn.onclick=()=>{const before=item.branchId;moveSingleItem(order,item,btn.dataset.itemAction==='next'?1:-1);renderProduction();renderPopup(order,item.branchId||before)})});
  dlg.showModal();
 }
 function openBranch(orderId,branchId){const o=orders.find(x=>x.id===orderId);if(!o)return;ensureBranches(o);renderPopup(o,branchId)}
 window.renderProductionOrders=renderProduction;window.openProductionFlow=openBranch;
 setTimeout(renderProduction,0);
})();