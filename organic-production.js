(()=>{
 const stages=['Preparação','Impressão','BOPP','Corte','Acabamento','Pronto'];
 const normalizeStage=s=>stages.includes(s)?s:(s==='Arte'?'Preparação':'Preparação');
 function ensureBranches(order){
  if(order._branchesReady)return;
  order.items.forEach((item,index)=>{item.branchId='main';item.status=normalizeStage(item.status)});
  order.branches=[{id:'main',label:'Principal',stage:'Preparação'}];
  order._branchesReady=true;
 }
 function branchItems(order,branchId){return order.items.filter(i=>i.branchId===branchId)}
 function getBranch(order,branchId){ensureBranches(order);return order.branches.find(b=>b.id===branchId)}
 function nextBranchId(order){let n=1;while(order.branches.some(b=>b.id==='parte'+n))n++;return 'parte'+n}
 function cardProducts(items){return items.map(i=>`<div class="summary-product"><span>${i.product}</span><b>${i.qty} un.</b></div>`).join('')}
 function branchCard(order,branch){const items=branchItems(order,branch.id);return `<article class="compact-order-card branch-card" draggable="true" data-order="${order.id}" data-branch="${branch.id}"><div class="compact-order-heading"><div><b>${order.id}${branch.id==='main'?'':' · '+branch.label}</b><small>${order.client}</small></div><span>›</span></div><div class="compact-product-list">${cardProducts(items)}</div>${order.branches.length>1?`<small class="split-badge">${order.branches.length} partes do mesmo pedido</small>`:''}</article>`}
 function renderProduction(){
  orders.forEach(ensureBranches);
  const board=document.getElementById('productionBoard');if(!board)return;
  board.className='production-board organic-flow-board';
  board.innerHTML=`<div class="flow-sequence-head">${stages.map((s,i)=>`<div><span>${i+1}</span><b>${s}</b>${i<stages.length-1?'<i>→</i>':''}</div>`).join('')}</div><div class="flow-columns">${stages.map(stage=>`<section class="process-column organic-col" data-stage="${stage}"><div class="process-col-head"><b>${stage}</b><span>${orders.reduce((n,o)=>n+o.branches.filter(b=>b.stage===stage).length,0)}</span></div><div class="organic-drop">${orders.flatMap(o=>o.branches.filter(b=>b.stage===stage).map(b=>branchCard(o,b))).join('')||'<div class="stage-empty">Sem pedidos nesta etapa</div>'}</div></section>`).join('')}</div>`;
  board.querySelectorAll('.branch-card').forEach(card=>{
   card.addEventListener('click',()=>openBranch(card.dataset.order,card.dataset.branch));
   card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',`${card.dataset.order}|${card.dataset.branch}`));
  });
  board.querySelectorAll('.organic-col').forEach(col=>{col.addEventListener('dragover',e=>e.preventDefault());col.addEventListener('drop',e=>{e.preventDefault();const [oid,bid]=(e.dataTransfer.getData('text/plain')||'|').split('|'),o=orders.find(x=>x.id===oid),b=o&&getBranch(o,bid);if(b){b.stage=col.dataset.stage;branchItems(o,b.id).forEach(i=>i.status=b.stage);renderProduction()}})})
 }
 function renderPopup(order,focusBranch){
  const dlg=document.getElementById('orderDetailsDialog');document.getElementById('orderDetailsTitle').textContent=`${order.id} · ${order.client}`;
  document.getElementById('orderDetailsSummary').innerHTML=`<div class="order-popup-headline"><span class="status">${order.branches.length} parte${order.branches.length>1?'s':''} ativa${order.branches.length>1?'s':''}</span><b>Prazo ${order.due}</b></div>`;
  document.getElementById('orderSplitHint').innerHTML='<div class="organic-hint"><b>Divisão real do pedido</b><span>O pedido começa como um único card. Ao separar um produto, nasce uma nova parte do mesmo pedido, que pode ficar em outra etapa e avançar de forma independente.</span></div>';
  const container=document.getElementById('orderDetailsProducts');
  container.innerHTML=order.branches.map(branch=>`<section class="branch-popup ${branch.id===focusBranch?'focused-branch':''}" data-branch="${branch.id}"><div class="branch-popup-head"><div><span class="tag">${branch.id==='main'?'PEDIDO PRINCIPAL':branch.label.toUpperCase()}</span><h3>${branch.stage}</h3></div><div class="branch-step-actions"><button type="button" data-branch-action="back" ${stages.indexOf(branch.stage)<=0?'disabled':''}>← Voltar</button><button type="button" data-branch-action="next" ${stages.indexOf(branch.stage)>=stages.length-1?'disabled':''}>Concluir etapa →</button></div></div>${branchItems(order,branch.id).map((item,index)=>{const p=productByName(item.product);return `<article class="popup-product-card branch-product" data-item-index="${order.items.indexOf(item)}"><img src="${p.image}" alt="${p.name}"><div class="popup-product-content"><span class="tag">${p.id}</span><h3>${p.name}</h3><p>${p.description}</p><div class="popup-product-stats"><span>Quantidade<b>${item.qty}</b></span><span>Boas<b>${item.done}</b></span><span>Erradas<b>${item.waste}</b></span><span>Etapa<b>${branch.stage}</b></span></div><div class="flow-actions">${branchItems(order,branch.id).length>1?'<button type="button" data-item-action="split">Separar em nova parte</button>':''}${order.branches.length>1?'<button type="button" data-item-action="move">Mover para outra parte</button>':''}</div></div></article>`}).join('')}</section>`).join('');
  container.querySelectorAll('.branch-popup').forEach(sec=>{const branch=getBranch(order,sec.dataset.branch);sec.querySelectorAll('[data-branch-action]').forEach(btn=>btn.onclick=()=>{const idx=stages.indexOf(branch.stage);if(btn.dataset.branchAction==='next'&&idx<stages.length-1)branch.stage=stages[idx+1];if(btn.dataset.branchAction==='back'&&idx>0)branch.stage=stages[idx-1];branchItems(order,branch.id).forEach(i=>i.status=branch.stage);renderProduction();renderPopup(order,branch.id)})});
  container.querySelectorAll('.branch-product').forEach(card=>{const item=order.items[+card.dataset.itemIndex],current=getBranch(order,item.branchId);card.querySelectorAll('[data-item-action]').forEach(btn=>btn.onclick=()=>{if(btn.dataset.itemAction==='split'){const id=nextBranchId(order),label=`Parte ${order.branches.length+1}`;order.branches.push({id,label,stage:current.stage});item.branchId=id;renderProduction();renderPopup(order,id)}else if(btn.dataset.itemAction==='move'){const targets=order.branches.filter(b=>b.id!==current.id);if(!targets.length)return;const target=targets[0];item.branchId=target.id;item.status=target.stage;if(branchItems(order,current.id).length===0)order.branches=order.branches.filter(b=>b.id!==current.id);renderProduction();renderPopup(order,target.id)}})});
  dlg.showModal();
 }
 function openBranch(orderId,branchId){const o=orders.find(x=>x.id===orderId);if(!o)return;ensureBranches(o);renderPopup(o,branchId)}
 window.renderProductionOrders=renderProduction;window.openProductionFlow=openBranch;
 setTimeout(renderProduction,0);
})();