(()=>{
  function summarizeProducts(order){
    return order.items.map(item=>`<div class="summary-product"><span>${item.product}</span><b>${item.qty} un.</b></div>`).join('');
  }

  function openCompactOrder(order){
    const dlg=document.getElementById('orderDetailsDialog');
    document.getElementById('orderDetailsTitle').textContent=`${order.id} · ${order.client}`;
    document.getElementById('orderDetailsSummary').innerHTML=`<div class="order-popup-headline"><span class="status">${order.status}</span><b>Prazo ${order.due}</b></div>`;
    document.getElementById('orderDetailsProducts').innerHTML=order.items.map(item=>{
      const product=productByName(item.product);
      return `<article class="popup-product-card">
        <img src="${product.image}" alt="${product.name}">
        <div class="popup-product-content">
          <span class="tag">${product.id}</span>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="popup-product-stats">
            <span>Quantidade <b>${item.qty}</b></span>
            <span>Produzidos <b>${item.done}</b></span>
            <span>Errados <b>${item.waste}</b></span>
            <span>Etapa <b>${item.status}</b></span>
          </div>
          <div class="popup-product-decoration">
            <b>Características</b>
            <small>${product.materials.map(m=>m[0]).join(' · ')}</small>
          </div>
        </div>
      </article>`;
    }).join('');
    dlg.showModal();
  }

  window.renderOrders=function(){
    const board=document.getElementById('ordersBoard');
    board.innerHTML=['Entrada','Preparação','Produção','Finalização'].map(group=>`
      <div class="kanban-col compact-order-column">
        <h3>${group}</h3>
        ${orders.filter(order=>order.status===group).map(order=>`
          <button type="button" class="compact-order-card" data-order="${order.id}" aria-label="Abrir detalhes do pedido ${order.id}">
            <div class="compact-order-heading">
              <div><b>${order.id}</b><small>${order.client}</small></div>
              <span>›</span>
            </div>
            <div class="compact-product-list">${summarizeProducts(order)}</div>
          </button>
        `).join('')}
      </div>
    `).join('');
    board.querySelectorAll('.compact-order-card').forEach(card=>{
      card.addEventListener('click',()=>openCompactOrder(orders.find(order=>order.id===card.dataset.order)));
    });
  };

  const close=document.getElementById('closeOrderDetails');
  if(close) close.onclick=()=>document.getElementById('orderDetailsDialog').close();
  window.renderOrders();
})();