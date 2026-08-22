(()=>{
 const stages=['Preparação','Impressão','BOPP','Corte','Acabamento','Pronto'];
 function ensureState(order){
  if(order._flowReady)return;
  order.items.forEach(item=>{item.flowGroup='g1';item.status='Preparação'});
  order.flowGroups=[{id:'g1',stage:'Preparação'}];
  order._flowReady=true;
 }
 const itemsOf=(order,gid)=>order.items.filter(i=>i.flowGroup===gid);
 const groupOf=(order,gid)=>order.flowGroups.find(g=>g.id===gid);
 function newGroupId(order){let n=2;while(order.flowGroups.some(g=>g.id==='g'+n))n++;return'g'+n}
 function mergeSameStage(order){
  ensureState(order);
  stages.forEach(stage=>{
   const same=order.flowGroups.filter(g=>g.stage===stage);
   if(same.length<2)return;
   const keep=same[0];
   same.slice(1).forEach(remove=>{
    itemsOf(order,remove.id).forEach(item=>{item.flowGroup=keep.id;item.status=stage});
    order.flowGroups=order.flowGroups.filter(g=>g.id!==remove.id);
   });
  });
 }
 function moveGroup(order,group,dir){
  const at=stages.indexOf(group.stage),to=at+dir;if(to<0||to>=stages.length)return group.id;
  group.stage=stages[to];itemsOf(order,group.id).forEach(i=>i.status=group.stage);
  mergeSameStage(order);
  return (order.flowGroups.find(g=>g.stage===stages[to])||group).id;
 }
 function moveProduct(order,item,dir){
  const current=groupOf(order,item.flowGroup),at=stages.indexOf(current.stage),to=at+dir;if(to<0||to>=stages.length)return item.flowGroup;
  const targetStage=stages[to],already=order.flowGroups.find(g=>g.stage===targetStage);
  if(already){item.flowGroup=already.id;item.status=targetStage}
  else if(itemsOf(order,current.id).length===1){current.stage=targetStage;item.status=targetStage}
  else{const id=newGroupId(order);order.flowGroups.push({id,stage:targetStage});item.flowGroup=id;item.status=targetStage}
  if(itemsOf(order,current.id).length===0)order.flowGroups=order.flowGroups.filter(g=>g.id!==current.id);
  mergeSameStage(order);
  return (order.flowGroups.find(g=>g.stage===targetStage)||{}).id||item.flowGroup;
 }
 function productsSummary(items){return items.map(i=>`<div class="summary-product"><span>${i.product}</span><b>${i.qty} un.</b></div>`).join('')}
 function cardHtml(order,group){
  const at=stages.indexOf(group.stage),items=itemsOf(order,group.id);
  return `<article class="compact-order-card flow-order-card" draggable="true" data-order="${order.id}" data-group="${group.id}"><div class="compact-order-heading"><div><b>${order.id}</b><small>${order.client}</small></div><span>›</span></div><div class="compact-product-list">${productsSummary(items)}</div><div class="card-flow-actions"><button type="button" data-card-move="back" ${at<=0?'disabled':''}>←</button><small>${items.length} produto${items.length>1?'s':''}</small><button type="button" data-card-move="next" ${at>=stages.length-1?'disabled':''}>→</button></div></article>`;
 }
 function renderProduction(){
  orders.forEach(o=>{ensureState(o);mergeSameStage(o)});
  const board=document.getElementById('productionBoard');if(!board)return;
  board.className='production-board organic-flow-board';
  board.innerHTML=`<div class="flow-sequence-head">${stages.map((s,i)=>`<div><span>${i+1}</span><b>${s}</b>${i<stages.length-1?'<i>→</i>':''}</div>`).join('')}</div><div class="flow-columns">${stages.map(stage=>`<section class="process-column organic-col" data-stage="${stage}"><div class="process-col-head"><b>${stage}</b><span>${orders.reduce((n,o)=>n+o.flowGroups.filter(g=>g.stage===stage).length,0)}</span></div><div class="organic-drop">${orders.flatMap(o=>o.flowGroups.filter(g=>g.stage===stage).map(g=>cardHtml(o,g))).join('')||'<div class="stage-empty">Sem pedidos nesta etapa</div>'}</div></section>`).join('')}</div>`;
  board.querySelectorAll('.flow-order-card').forEach(card=>{
   card.addEventListener('click',e=>{if(e.target.closest('button'))return;openFlow(card.dataset.order,card.dataset.group)});
   card.querySelectorAll('[data-card-move]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const o=orders.find(x=>x.id===card.dataset.order),g=o&&groupOf(o,card.dataset.group);if(!g)return;moveGroup(o,g,btn.dataset.cardMove==='next'?1:-1);renderProduction()});
   card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',`${card.dataset.order}|${card.dataset.group}`));
  });
  board.querySelectorAll('.organic-col').forEach(col=>{col.addEventListener('dragover',e=>e.preventDefault());col.addEventListener('drop',e=>{e.preventDefault();const [oid,gid]=(e.dataTransfer.getData('text/plain')||'|').split('|'),o=orders.find(x=>x.id===oid),g=o&&groupOf(o,gid);if(!g)return;g.stage=col.dataset.stage;itemsOf(o,g.id).forEach(i=>i.status=g.stage);mergeSameStage(o);renderProduction()})});
 }
 function renderPopup(order,focusGroup){
  mergeSameStage(order);
  const dlg=document.getElementById('orderDetailsDialog');
  document.getElementById('orderDetailsTitle').textContent=`${order.id} · ${order.client}`;
  document.getElementById('orderDetailsSummary').innerHTML=`<div class="order-popup-headline"><span class="status">${order.flowGroups.length===1?'Pedido unido':order.flowGroups.length+' cards em etapas diferentes'}</span><b>Prazo ${order.due}</b></div>`;
  document.getElementById('orderSplitHint').innerHTML='<div class="organic-hint"><b>Movimento automático</b><span>Avançar um produto sozinho cria outro card. Quando produtos do mesmo pedido chegam à mesma etapa, os cards se fundem automaticamente.</span></div>';
  const container=document.getElementById('orderDetailsProducts');
  container.innerHTML=order.flowGroups.map(group=>{const at=stages.indexOf(group.stage);return `<section class="branch-popup ${group.id===focusGroup?'focused-branch':''}" data-group="${group.id}"><div class="branch-popup-head"><div><span class="tag">CARD ATUAL</span><h3>${group.stage}</h3></div><div class="branch-step-actions"><button type="button" data-group-move="back" ${at<=0?'disabled':''}>← Recuar card</button><button type="button" data-group-move="next" ${at>=stages.length-1?'disabled':''}>Avançar card →</button></div></div>${itemsOf(order,group.id).map(item=>{const p=productByName(item.product);return `<article class="popup-product-card branch-product" data-item-index="${order.items.indexOf(item)}"><img src="${p.image}" alt="${p.name}"><div class="popup-product-content"><span class="tag">${p.id}</span><h3>${p.name}</h3><p>${p.description}</p><div class="popup-product-stats"><span>Quantidade<b>${item.qty}</b></span><span>Boas<b>${item.done}</b></span><span>Erradas<b>${item.waste}</b></span><span>Etapa<b>${group.stage}</b></span></div><div class="flow-actions item-move-actions"><button type="button" data-product-move="back" ${at<=0?'disabled':''}>← Recuar</button><button type="button" data-product-move="next" ${at>=stages.length-1?'disabled':''}>Avançar →</button></div></div></article>`}).join('')}</section>`}).join('');
  container.querySelectorAll('.branch-popup').forEach(sec=>{const group=groupOf(order,sec.dataset.group);sec.querySelectorAll('[data-group-move]').forEach(btn=>btn.onclick=()=>{const gid=moveGroup(order,group,btn.dataset.groupMove==='next'?1:-1);renderProduction();renderPopup(order,gid)})});
  container.querySelectorAll('.branch-product').forEach(card=>{const item=order.items[+card.dataset.itemIndex];card.querySelectorAll('[data-product-move]').forEach(btn=>btn.onclick=()=>{const gid=moveProduct(order,item,btn.dataset.productMove==='next'?1:-1);renderProduction();renderPopup(order,gid)})});
  dlg.showModal();
 }
 function openFlow(orderId,groupId){const order=orders.find(o=>o.id===orderId);if(!order)return;ensureState(order);renderPopup(order,groupId)}
 window.renderProductionOrders=renderProduction;window.openProductionFlow=openFlow;
 setTimeout(renderProduction,0);
})();