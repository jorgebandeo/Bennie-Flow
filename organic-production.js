(()=>{
 const stages=['Preparação','Impressão','BOPP','Corte','Acabamento','Pronto'];
 const stageOf=o=>o.flowStage||'Preparação';
 const itemStage=(o,i)=>i.status||stageOf(o);
 function summary(o,onlyAttached=false){
  const list=onlyAttached?o.items.filter(i=>!i.detached):o.items;
  return list.map(i=>`<div class="summary-product"><span>${i.product}</span><b>${i.qty} un.</b></div>`).join('')||'<small class="empty-attached">todos os produtos estão separados</small>';
 }
 function cardsForStage(stage){
  const cards=[];
  orders.forEach(o=>{
   const attached=o.items.filter(i=>!i.detached);
   if(attached.length&&stageOf(o)===stage){
    cards.push(`<article class="compact-order-card organic-order main-flow-card" draggable="true" data-order="${o.id}" data-type="order"><div class="compact-order-heading"><div><b>${o.id}</b><small>${o.client}</small></div><span>›</span></div><div class="compact-product-list">${summary(o,true)}</div>${o.items.some(i=>i.detached)?'<small class="split-badge">parte do pedido segue separada</small>':''}</article>`);
   }
   o.items.forEach((i,n)=>{
    if(i.detached&&itemStage(o,i)===stage){
     cards.push(`<article class="split-product-card" draggable="true" data-order="${o.id}" data-index="${n}" data-type="item"><div class="split-origin"><span>${o.id}</span><small>${o.client}</small></div><b>${i.product}</b><div class="split-meta"><span>${i.qty} un.</span>${i.rework?`<span class="rework-pill">↺ ${i.rework.qty} retrabalho</span>`:'<span>separado</span>'}</div><button type="button" class="open-split">Abrir produto</button></article>`);
    }
   });
  });
  return cards.join('')||'<div class="stage-empty">Sem itens nesta etapa</div>';
 }
 function renderProduction(){
  const board=document.getElementById('productionBoard');if(!board)return;
  board.className='production-board organic-flow-board';
  board.innerHTML=`<div class="flow-sequence-head">${stages.map((s,i)=>`<div><span>${i+1}</span><b>${s}</b>${i<stages.length-1?'<i>→</i>':''}</div>`).join('')}</div><div class="flow-columns">${stages.map(stage=>`<section class="process-column organic-col" data-stage="${stage}"><div class="process-col-head"><b>${stage}</b><span>${countStage(stage)}</span></div><div class="organic-drop">${cardsForStage(stage)}</div></section>`).join('')}</div>`;
  board.querySelectorAll('.organic-order').forEach(c=>{c.addEventListener('click',()=>openFlow(c.dataset.order));c.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/x-order',c.dataset.order)})});
  board.querySelectorAll('.split-product-card').forEach(c=>{c.querySelector('.open-split').onclick=e=>{e.stopPropagation();openFlow(c.dataset.order,+c.dataset.index)};c.addEventListener('click',()=>openFlow(c.dataset.order,+c.dataset.index));c.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/x-item',`${c.dataset.order}|${c.dataset.index}`)})});
  board.querySelectorAll('.organic-col').forEach(col=>{col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('flow-drop-target')});col.addEventListener('dragleave',()=>col.classList.remove('flow-drop-target'));col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('flow-drop-target');const stage=col.dataset.stage,itemData=e.dataTransfer.getData('application/x-item'),orderId=e.dataTransfer.getData('application/x-order');if(itemData){const [oid,n]=itemData.split('|'),o=orders.find(x=>x.id===oid);if(o&&o.items[+n]){o.items[+n].detached=true;o.items[+n].status=stage}}else if(orderId){const o=orders.find(x=>x.id===orderId);if(o){o.flowStage=stage;o.items.filter(i=>!i.detached).forEach(i=>i.status=stage)}}renderProduction()})})
 }
 function countStage(stage){let n=0;orders.forEach(o=>{if(o.items.some(i=>!i.detached)&&stageOf(o)===stage)n++;n+=o.items.filter(i=>i.detached&&itemStage(o,i)===stage).length});return n}
 function openFlow(id,focusIndex=null){
  const o=orders.find(x=>x.id===id),dlg=document.getElementById('orderDetailsDialog');if(!o||!dlg)return;
  document.getElementById('orderDetailsTitle').textContent=`${o.id} · ${o.client}`;
  document.getElementById('orderDetailsSummary').innerHTML=`<div class="order-popup-headline"><span class="status">Fluxo principal: ${stageOf(o)}</span><b>Prazo ${o.due}</b></div>`;
  document.getElementById('orderSplitHint').innerHTML='<div class="organic-hint"><b>Pedido unido por padrão</b><span>Separe somente o produto que precisar seguir diferente. Todos continuam visíveis no quadro e podem voltar a se juntar.</span></div>';
  const container=document.getElementById('orderDetailsProducts');
  container.innerHTML=o.items.map((i,n)=>{const p=productByName(i.product),st=itemStage(o,i),idx=stages.indexOf(st);return `<article class="popup-product-card flow-product ${i.detached?'detached':''} ${focusIndex===n?'focused-product':''}" data-index="${n}"><img src="${p.image}" alt="${p.name}"><div class="popup-product-content"><div class="product-flow-top"><span class="tag">${i.detached?'SEPARADO':'JUNTO AO PEDIDO'}</span><span class="stage-pill">${st}</span></div><h3>${p.name}</h3><p>${p.description}</p><div class="popup-product-stats"><span>Quantidade<b>${i.qty}</b></span><span>Boas<b>${i.done}</b></span><span>Erradas<b>${i.waste}</b></span><span>Faltam boas<b>${Math.max(0,i.qty-i.done)}</b></span></div><div class="flow-actions"><button type="button" data-action="back" ${idx<=0?'disabled':''}>← Etapa anterior</button><button type="button" data-action="split">${i.detached?'Juntar ao pedido':'Separar produto'}</button><button type="button" data-action="next" ${idx>=stages.length-1?'disabled':''}>Próxima etapa →</button></div><div class="rework-row"><label>Qtd. retrabalho<input type="number" min="1" max="${i.qty}" value="${Math.max(1,Math.min(i.waste||1,i.qty))}"></label><label>Retornar para<select>${['Impressão','BOPP','Corte','Acabamento'].map(s=>`<option ${s===st?'selected':''}>${s}</option>`).join('')}</select></label><button type="button" data-action="rework">Criar retrabalho</button></div>${i.rework?`<div class="rework-note">↺ ${i.rework.qty} un. em retrabalho em ${i.rework.stage}. O saldo bom continua no fluxo atual.</div>`:''}</div></article>`}).join('');
  container.querySelectorAll('.flow-product').forEach(card=>{const i=o.items[+card.dataset.index];card.querySelectorAll('[data-action]').forEach(btn=>btn.onclick=()=>{const action=btn.dataset.action,idx=stages.indexOf(itemStage(o,i));if(action==='split'){if(i.detached){i.detached=false;i.status=stageOf(o);i.rework=null}else{i.detached=true;i.status=itemStage(o,i)}}if(action==='next'&&idx<stages.length-1){i.detached=true;i.status=stages[idx+1]}if(action==='back'&&idx>0){i.detached=true;i.status=stages[idx-1]}if(action==='rework'){const qty=Math.max(1,Math.min(i.qty,+card.querySelector('.rework-row input').value||1)),stage=card.querySelector('.rework-row select').value;i.detached=true;i.rework={qty,stage};i.status=stage}syncOrder(o);renderProduction();openFlow(o.id,+card.dataset.index)})});
  dlg.showModal();if(focusIndex!==null)setTimeout(()=>container.querySelector(`[data-index="${focusIndex}"]`)?.scrollIntoView({block:'nearest'}),0)
 }
 function syncOrder(o){const attached=o.items.filter(i=>!i.detached);if(attached.length){const stagesAttached=[...new Set(attached.map(i=>itemStage(o,i)))];if(stagesAttached.length===1)o.flowStage=stagesAttached[0]}else{o.flowStage=stages[Math.min(...o.items.map(i=>stages.indexOf(itemStage(o,i))).filter(x=>x>=0))]||stageOf(o)}}
 window.renderProductionOrders=renderProduction;window.openProductionFlow=openFlow;
 setTimeout(renderProduction,0);
})();