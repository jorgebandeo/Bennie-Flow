(()=>{
 const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const state={
  materials:[
   {id:'vinil',name:'Vinil adesivo',unit:'m²',stock:84,min:20,cost:12.8},
   {id:'bopp',name:'BOPP brilho',unit:'m²',stock:42,min:15,cost:7.4},
   {id:'papel',name:'Papel couchê 250g',unit:'folhas',stock:680,min:200,cost:.62},
   {id:'tinta',name:'Tinta impressão',unit:'ml',stock:4200,min:1000,cost:.09}
  ],
  machines:[
   {id:'printer',name:'Impressora principal',process:'Impressão',capacity:480,unit:'un/h'},
   {id:'laminator',name:'Laminadora BOPP',process:'BOPP',capacity:300,unit:'un/h'},
   {id:'cutter',name:'Plotter de corte',process:'Corte',capacity:360,unit:'un/h'}
  ],
  products:[]
 };
 function seed(){
  if(typeof products==='undefined')return;
  state.products=products.map((p,i)=>({id:p.id||`P${i+1}`,name:p.name,image:p.image,description:p.description||'',price:p.price||[2.4,4.8,8.9][i%3],bom:[{material:state.materials[i%state.materials.length].id,qty:i%2?.08:.04}],route:['Impressão','BOPP','Corte']}));
 }
 const mat=id=>state.materials.find(m=>m.id===id);
 const product=id=>state.products.find(p=>p.id===id)||state.products.find(p=>p.name===id);
 const unitCost=p=>p.bom.reduce((s,b)=>s+(mat(b.material)?.cost||0)*b.qty,0);
 const selectProducts=(selected='')=>state.products.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${p.name}</option>`).join('');
 const selectMaterials=(selected='')=>state.materials.map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${m.name}</option>`).join('');
 function renderCatalog(){
  const bom=document.getElementById('bomBuilder'),materials=document.getElementById('materialsAdmin'),machines=document.getElementById('machinesAdmin');if(!bom)return;
  bom.innerHTML=`<div class="management-grid">${state.products.map(p=>`<article class="manage-card product-manage"><img src="${p.image}" alt=""><div><span class="tag">${p.id}</span><h3>${p.name}</h3><p>${p.description}</p><div class="price-line"><span>Custo BOM <b>${money(unitCost(p))}</b></span><label>Preço venda<input type="number" step="0.01" value="${p.price}" data-price="${p.id}"></label></div><h4>Estrutura / BOM</h4><div class="bom-lines">${p.bom.map((b,n)=>`<div><select data-bom-material="${p.id}|${n}">${selectMaterials(b.material)}</select><input type="number" step="0.001" value="${b.qty}" data-bom-qty="${p.id}|${n}"><span>${mat(b.material)?.unit||''}/un</span></div>`).join('')}</div><button class="ghost2" data-add-bom="${p.id}">＋ Matéria no BOM</button><small>Roteiro: ${p.route.join(' → ')}</small></div></article>`).join('')}</div>`;
  materials.innerHTML=`<div class="management-grid">${state.materials.map(m=>`<article class="manage-card"><span class="tag">MATÉRIA-PRIMA</span><h3>${m.name}</h3><div class="stock-big">${m.stock} <small>${m.unit}</small></div><label>Estoque<input type="number" step="0.01" value="${m.stock}" data-stock="${m.id}"></label><label>Estoque mínimo<input type="number" step="0.01" value="${m.min}" data-min="${m.id}"></label><label>Custo por ${m.unit}<input type="number" step="0.01" value="${m.cost}" data-mat-cost="${m.id}"></label><div class="stock-meter"><i style="width:${Math.min(100,m.stock/Math.max(m.min,1)*35)}%"></i></div></article>`).join('')}</div>`;
  machines.innerHTML=`<div class="management-grid">${state.machines.map(m=>`<article class="manage-card"><span class="tag">${m.process}</span><h3>${m.name}</h3><label>Capacidade<input type="number" value="${m.capacity}" data-capacity="${m.id}"></label><small>${m.unit} · 8h úteis/dia</small></article>`).join('')}</div>`;
  bindCatalog();
 }
 function bindCatalog(){
  document.querySelectorAll('[data-price]').forEach(x=>x.onchange=()=>{product(x.dataset.price).price=+x.value;renderCatalog()});
  document.querySelectorAll('[data-stock]').forEach(x=>x.onchange=()=>{mat(x.dataset.stock).stock=+x.value;renderCatalog()});
  document.querySelectorAll('[data-min]').forEach(x=>x.onchange=()=>{mat(x.dataset.min).min=+x.value;renderCatalog()});
  document.querySelectorAll('[data-mat-cost]').forEach(x=>x.onchange=()=>{mat(x.dataset.matCost).cost=+x.value;renderCatalog()});
  document.querySelectorAll('[data-capacity]').forEach(x=>x.onchange=()=>{state.machines.find(m=>m.id===x.dataset.capacity).capacity=+x.value});
  document.querySelectorAll('[data-bom-material]').forEach(x=>x.onchange=()=>{const [pid,n]=x.dataset.bomMaterial.split('|');product(pid).bom[+n].material=x.value;renderCatalog()});
  document.querySelectorAll('[data-bom-qty]').forEach(x=>x.onchange=()=>{const [pid,n]=x.dataset.bomQty.split('|');product(pid).bom[+n].qty=+x.value;renderCatalog()});
  document.querySelectorAll('[data-add-bom]').forEach(x=>x.onclick=()=>{product(x.dataset.addBom).bom.push({material:state.materials[0].id,qty:1});renderCatalog()});
 }
 function setupTabs(){document.querySelectorAll('[data-catalog]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-catalog]').forEach(b=>b.classList.toggle('active',b===btn));['bom','materials','machines'].forEach(k=>document.getElementById(k==='bom'?'bomBuilder':k==='materials'?'materialsAdmin':'machinesAdmin').classList.toggle('hidden',k!==btn.dataset.catalog))}))}
 function quoteRow(){return `<div class="multi-quote-row"><select data-q-product>${selectProducts()}</select><input type="number" min="1" value="100" data-q-qty><button type="button" class="ghost2" data-q-remove>×</button></div>`}
 function setupQuotes(){
  const form=document.querySelector('.quote-form');if(!form)return;
  form.innerHTML=`<span class="tag">ITENS DA COTAÇÃO</span><div id="quoteItems">${quoteRow()}</div><button type="button" id="addQuoteItem" class="ghost2 wide">＋ Adicionar produto</button><label>Data desejada<input id="quoteDate" type="date"></label><button id="calcQuote" class="primary wide">Calcular cotação completa</button>`;
  const list=document.getElementById('quoteItems');document.getElementById('addQuoteItem').onclick=()=>{list.insertAdjacentHTML('beforeend',quoteRow());bindQuoteRows()};
  function bindQuoteRows(){list.querySelectorAll('[data-q-remove]').forEach(b=>b.onclick=()=>{if(list.children.length>1)b.parentElement.remove()})}bindQuoteRows();
  document.getElementById('calcQuote').onclick=()=>{
   const rows=[...list.querySelectorAll('.multi-quote-row')].map(r=>({p:product(r.querySelector('[data-q-product]').value),qty:+r.querySelector('[data-q-qty]').value||1}));
   let total=0,cost=0;const needs={};rows.forEach(({p,qty})=>{total+=p.price*qty;cost+=unitCost(p)*qty;p.bom.forEach(b=>needs[b.material]=(needs[b.material]||0)+b.qty*qty)});
   const stockOk=Object.entries(needs).every(([id,q])=>mat(id).stock>=q);
   document.getElementById('quoteResult').innerHTML=`<span class="tag">COTAÇÃO</span><h2>${money(total)}</h2><p>${rows.length} produto${rows.length>1?'s':''} · ${rows.reduce((s,r)=>s+r.qty,0)} unidades</p><div class="quote-breakdown">${rows.map(r=>`<div><span>${r.p.name} × ${r.qty}</span><b>${money(r.p.price*r.qty)}</b></div>`).join('')}</div><div class="quote-breakdown"><div><span>Custo estimado de materiais</span><b>${money(cost)}</b></div><div><span>Margem bruta estimada</span><b>${money(total-cost)}</b></div></div><div class="safe-date ${stockOk?'':'danger'}"><span>${stockOk?'✓':'!'}</span><div><b>${stockOk?'Materiais disponíveis':'Reposição necessária'}</b><small>${Object.entries(needs).map(([id,q])=>`${mat(id).name}: ${q.toFixed(2)} ${mat(id).unit}`).join(' · ')}</small></div></div>`;
  }
 }
 function setupOrderImages(){
  const root=document.getElementById('orderItems');if(!root)return;
  const decorate=()=>root.querySelectorAll('.order-item').forEach((row,i)=>{if(row.querySelector('.order-image-field'))return;const box=document.createElement('label');box.className='order-image-field';box.innerHTML=`Imagem / referência do produto<input type="file" accept="image/*" data-order-image="${i}"><span>＋ adicionar imagem</span><img alt="Prévia">`;row.appendChild(box);box.querySelector('input').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);box.querySelector('img').src=url;box.classList.add('has-image')}});
  new MutationObserver(decorate).observe(root,{childList:true,subtree:true});decorate();
 }
 seed();renderCatalog();setupTabs();setupQuotes();setupOrderImages();
 document.getElementById('addMaterial')?.addEventListener('click',()=>{state.materials.push({id:'mat'+Date.now(),name:'Nova matéria-prima',unit:'un',stock:0,min:0,cost:0});renderCatalog()});
 document.getElementById('addMachine')?.addEventListener('click',()=>{state.machines.push({id:'maq'+Date.now(),name:'Novo recurso',process:'Produção',capacity:100,unit:'un/h'});renderCatalog()});
 document.getElementById('addProduct')?.addEventListener('click',()=>{state.products.push({id:'P'+(state.products.length+1),name:'Novo produto',image:state.products[0]?.image||'',description:'Edite a estrutura e o preço.',price:0,bom:[],route:['Impressão','Corte']});renderCatalog()});
 window.BennieManagement=state;
})();