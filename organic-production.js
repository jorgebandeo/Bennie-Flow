(()=>{
 const stages=['Preparação','Impressão','BOPP','Corte','Acabamento','Pronto'];
 function ensureState(order){
  if(order._flowReady)return;
  order.items.forEach(item=>{item.status='Preparação'});
  order._flowReady=true;
 }
 const itemsAt=(order,stage)=>order.items.filter(i=>i.status===stage);
 const stageIndex=stage=>stages.indexOf(stage);
 function moveProduct(item,dir){
  const at=stageIndex(item.status),to=at+dir;
  if(to<0||to>=stages.length)return;
  item.status=stages[to];
 }
 function moveCard(order,stage,dir){
  const at=stageIndex(stage),to=at+dir;
  if(to<0||to>=stages.length)return;
  const next=stages[to];
  itemsAt(order,stage).forEach(item=>{item.status=next});
 }
 function productsSummary(items){return items.map(i=>`<div class="summary-product"><span>${i.product}</span><b>${i.qty} un.</b></div>`).join('')}
 function cardHtml(order,stage){
  const items=itemsAt(order,stage),at=stageIndex(stage);
  return `<article class="compact-order-card flow-order-card" draggable="true" data-order="${order.id}" data-stage="${stage}"><div class="compact-order-heading"><div><b>${order.id}</b><small>${order.client}</small></div><span>›</span></div><div class="compact-product-list">${productsSummary(items)}</div><div class="card-flow-actions"><button type="button" data-card-move="back" ${at<=0?'disabled':''}>←</button><small>${items.length} produto${items.length>1?'s':''}</small><button type="button" data-card-move="next" ${at>=stages.length-1?'disabled':''}>→</button></div></article>`;
 }
 function renderProduction(){
  orders.forEach(ensureState);
  const board=document.getElementById('productionBoard');if(!board)return;
  board.className='production-board organic-flow-board';
  board.innerHTML=`<div class="flow-sequence-head">${stages.map((s,i)=>`<div><span>${i+1}</span><b>${s}</b>${i<stages.length-1?'<i>→</i>':''}</div>`).join('')}</div><div class="flow-columns">${stages.map(stage=>`<section class="process-column organic-col" data-stage="${stage}"><div class="process-col-head"><b>${stage}</b><span>${orders.reduce((n,o)=>n+(itemsAt(o,stage).length?1:0),0)}</span></div><div class="organic-drop">${orders.filter(o=>itemsAt(o,stage).length).map(o=>cardHtml(o,stage)).join('')||'<div class="stage-empty">Sem pedidos nesta etapa</div>'}</div></section>`).join('')}</div>`;
  board.querySelectorAll('.flow-order-card').forEach(card=>{
   card.addEventListener('click',e=>{if(e.target.closest('button'))return;openFlow(card.dataset.order,card.dataset.stage)});
   card.querySelectorAll('[data-card-move]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const order=orders.find(o=>o.id===card.dataset.order);if(!order)return;moveCard(order,card.dataset.stage,btn.dataset.cardMove==='next'?1:-1);renderProduction()});
   card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',`${card.dataset.order}|${card.dataset.stage}`));
  });
  board.querySelectorAll('.organic-col').forEach(col=>{
   col.addEventListener('dragover',e=>e.preventDefault());
   col.addEventListener('drop',e=>{e.preventDefault();const [oid,fromStage]=(e.dataTransfer.getData('text/plain')||'|').split('|'),order=orders.find(o=>o.id===oid);if(!order)return;itemsAt(order,fromStage).forEach(item=>{item.status=col.dataset.stage});renderProduction()});
  });
 }
 function renderPopup(order,focusStage){
  const dlg=document.getElementById('orderDetailsDialog');
  document.getElementById('orderDetailsTitle').textContent=`${order.id} · ${order.client}`;
  const activeStages=stages.filter(stage=>itemsAt(order,stage).length);
  document.getElementById('orderDetailsSummary').innerHTML=`<div class="order-popup-headline"><b>Prazo ${order.due}</b><small>${order.items.length} produtos no pedido</small></div>`;
  document.getElementById('orderSplitHint').innerHTML='<div class="organic-hint"><b>Fluxo por produto</b><span>Cada produto avança ou recua sozinho. Produtos do mesmo pedido que estiverem na mesma etapa aparecem automaticamente no mesmo card.</span></div>';
  const container=document.getElementById('orderDetailsProducts');
  container.innerHTML=activeStages.map(stage=>{const at=stageIndex(stage);return `<section class="branch-popup ${stage===focusStage?'focused-branch':''}" data-stage="${stage}"><div class="branch-popup-head"><div><span class="tag">${itemsAt(order,stage).length} PRODUTO${itemsAt(order,stage).length>1?'S':''}</span><h3>${stage}</h3></div><div class="branch-step-actions"><button type="button" data-card-action="back" ${at<=0?'disabled':''}>← Recuar card</button><button type="button" data-card-action="next" ${at>=stages.length-1?'disabled':''}>Avançar card →</button></div></div>${itemsAt(order,stage).map(item=>{const p=productByName(item.product);return `<article class="popup-product-card branch-product" data-item-index="${order.items.indexOf(item)}"><img src="${p.image}" alt="${p.name}"><div class="popup-product-content"><span class="tag">${p.id}</span><h3>${p.name}</h3><p>${p.description}</p><div class="popup-product-stats"><span>Quantidade<b>${item.qty}</b></span><span>Boas<b>${item.done}</b></span><span>Erradas<b>${item.waste}</b></span></div><div class="flow-actions item-move-actions"><button type="button" data-product-move="back" ${at<=0?'disabled':''}>← Recuar</button><button type="button" data-product-move="next" ${at>=stages.length-1?'disabled':''}>Avançar →</button></div></div></article>`}).join('')}</section>`}).join('');
  container.querySelectorAll('.branch-popup').forEach(sec=>{sec.querySelectorAll('[data-card-action]').forEach(btn=>btn.onclick=()=>{const from=sec.dataset.stage,dir=btn.dataset.cardAction==='next'?1:-1,to=stages[stageIndex(from)+dir];moveCard(order,from,dir);renderProduction();renderPopup(order,to)})});
  container.querySelectorAll('.branch-product').forEach(card=>{const item=order.items[+card.dataset.itemIndex];card.querySelectorAll('[data-product-move]').forEach(btn=>btn.onclick=()=>{const dir=btn.dataset.productMove==='next'?1:-1;moveProduct(item,dir);renderProduction();renderPopup(order,item.status)})});
  dlg.showModal();
 }
 function openFlow(orderId,stage){const order=orders.find(o=>o.id===orderId);if(!order)return;ensureState(order);renderPopup(order,stage)}
 window.renderProductionOrders=renderProduction;window.openProductionFlow=openFlow;
 setTimeout(renderProduction,0);
})();