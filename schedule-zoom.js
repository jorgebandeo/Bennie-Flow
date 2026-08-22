(()=>{
  const e=id=>document.getElementById(id);
  const workDays=[
    ['Seg · 24 ago','2026-08-24'],['Ter · 25 ago','2026-08-25'],['Qua · 26 ago','2026-08-26'],['Qui · 27 ago','2026-08-27'],['Sex · 28 ago','2026-08-28'],
    ['Seg · 31 ago','2026-08-31'],['Ter · 01 set','2026-09-01'],['Qua · 02 set','2026-09-02'],['Qui · 03 set','2026-09-03'],['Sex · 04 set','2026-09-04'],
    ['Seg · 07 set','2026-09-07'],['Ter · 08 set','2026-09-08'],['Qua · 09 set','2026-09-09'],['Qui · 10 set','2026-09-10'],['Sex · 11 set','2026-09-11'],
    ['Seg · 14 set','2026-09-14'],['Ter · 15 set','2026-09-15'],['Qua · 16 set','2026-09-16'],['Qui · 17 set','2026-09-17'],['Sex · 18 set','2026-09-18'],
    ['Seg · 21 set','2026-09-21'],['Ter · 22 set','2026-09-22'],['Qua · 23 set','2026-09-23'],['Qui · 24 set','2026-09-24'],['Sex · 25 set','2026-09-25'],
    ['Seg · 28 set','2026-09-28'],['Ter · 29 set','2026-09-29'],['Qua · 30 set','2026-09-30']
  ];
  const views={today:{title:'Próximo dia útil · segunda, 24 de agosto',summary:'Agenda de execução do próximo dia útil',count:1},'3days':{title:'Próximos 3 dias úteis',summary:'Planejamento de segunda a quarta',count:3},week:{title:'Semana útil · 24 a 28 de agosto',summary:'40 horas úteis distribuídas em 5 dias',count:5},'30days':{title:'Próximos 30 dias',summary:'Somente segunda a sexta',count:15},'60days':{title:'Horizonte até 30 de setembro',summary:'Capacidade útil de segunda a sexta',count:28}};
  const lanes=[{id:'print',label:'Impressão'},{id:'bopp',label:'BOPP / Laminação'},{id:'cut',label:'Corte'},{id:'manual',label:'Acabamento'}];
  const tasks=[
    {id:'t1',date:'2026-08-24',lane:'print',start:0,duration:120,kind:'impressao',label:'Imprimir adesivos',order:'#1048',detail:'250 un · Luna Papelaria'},
    {id:'t2',date:'2026-08-24',lane:'bopp',start:60,duration:90,kind:'laminacao',label:'Aplicar BOPP',order:'#1047',detail:'300 un · Mimo & Co.'},
    {id:'t3',date:'2026-08-24',lane:'cut',start:60,duration:120,kind:'corte',label:'Cortar chaveiros',order:'#1046',detail:'120 un · Clara Studio'},
    {id:'t4',date:'2026-08-24',lane:'manual',start:300,duration:90,kind:'acabamento',label:'Conferir e montar',order:'#1048',detail:'Print A5 · 80 un'},
    {id:'t5',date:'2026-08-25',lane:'print',start:30,duration:90,kind:'impressao',label:'Imprimir prints',order:'#1046',detail:'60 un · Clara Studio'},
    {id:'t6',date:'2026-08-25',lane:'cut',start:30,duration:100,kind:'corte',label:'Corte adesivos',order:'#1047',detail:'300 un · Mimo & Co.'},
    {id:'t7',date:'2026-08-25',lane:'bopp',start:180,duration:80,kind:'laminacao',label:'BOPP adesivos',order:'#1048',detail:'Luna Papelaria'},
    {id:'t8',date:'2026-08-26',lane:'print',start:0,duration:120,kind:'impressao',label:'Imprimir adesivos',order:'#1045',detail:'400 un · Ateliê Nuvem'},
    {id:'t9',date:'2026-08-26',lane:'manual',start:270,duration:120,kind:'acabamento',label:'Finalizar pedido',order:'#1047',detail:'Mimo & Co.'},
    {id:'t10',date:'2026-08-27',lane:'cut',start:240,duration:120,kind:'corte',label:'Cortar chaveiros',order:'#1045',detail:'50 un · Ateliê Nuvem'},
    {id:'t11',date:'2026-08-28',lane:'manual',start:90,duration:90,kind:'acabamento',label:'Embalagem e conferência',order:'#1046',detail:'Clara Studio'},
    {id:'t12',date:'2026-08-31',lane:'print',start:60,duration:150,kind:'impressao',label:'Imprimir prints',order:'#1044',detail:'Mori Shop'},
    {id:'t13',date:'2026-09-02',lane:'bopp',start:30,duration:120,kind:'laminacao',label:'Aplicar BOPP',order:'#1043',detail:'Casa Lótus'},
    {id:'t14',date:'2026-09-04',lane:'cut',start:240,duration:150,kind:'corte',label:'Corte lote',order:'#1044',detail:'Mori Shop'},
    {id:'t15',date:'2026-09-08',lane:'print',start:60,duration:180,kind:'impressao',label:'Impressão principal',order:'#1043',detail:'Casa Lótus'},
    {id:'t16',date:'2026-09-16',lane:'cut',start:30,duration:150,kind:'corte',label:'Corte lote',order:'#1043',detail:'Casa Lótus'},
    {id:'t17',date:'2026-09-22',lane:'manual',start:60,duration:120,kind:'acabamento',label:'Finalização',order:'#1044',detail:'Mori Shop'},
    {id:'t18',date:'2026-09-28',lane:'manual',start:270,duration:90,kind:'acabamento',label:'Finalização',order:'#1043',detail:'Casa Lótus'}
  ];
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const snap=n=>Math.round(n/30)*30;
  function usefulToClock(min){min=clamp(min,0,480);const h=min<240?480+min:570+min;return `${String(Math.floor(h/60)).padStart(2,'0')}:${String(h%60).padStart(2,'0')}`}
  function visibleDays(v){return workDays.slice(0,views[v].count)}
  function summary(v){const s=e('scheduleFocusSummary');const next=tasks.find(t=>t.date==='2026-08-24');s.innerHTML=`<div class="focus-card urgent"><span>PRÓXIMO DIA ÚTIL</span><strong>${next.label} ${next.order}</strong><small>${usefulToClock(next.start)}–${usefulToClock(next.start+next.duration)}</small></div><div class="focus-card"><span>PARALELISMO</span><strong>Impressão + BOPP + corte</strong><small>Podem ocupar faixas diferentes no mesmo horário.</small></div><div class="focus-card"><span>CAPACIDADE</span><strong>8h úteis/dia</strong><small>Seg–sex · almoço não consome capacidade.</small></div>`}
  function render(v){
    const d=views[v],days=visibleDays(v),grid=e('productionGrid');e('scheduleRangeTitle').textContent=d.title;summary(v);e('capacitySummary').innerHTML='';grid.className='production-grid parallel-calendar zoom-'+v;
    grid.innerHTML=`<div class="parallel-legend">${lanes.map(l=>`<span><i class="lane-dot lane-${l.id}"></i>${l.label}</span>`).join('')}<small>Arraste uma tarefa para outro horário, dia ou faixa.</small></div><div class="parallel-scroll"><div class="parallel-time"><div class="parallel-time-spacer"></div>${[0,60,120,180,240,300,360,420,480].map(m=>`<span style="top:${m/480*100}%">${usefulToClock(m)}</span>`).join('')}</div><div class="parallel-days">${days.map(([label,date])=>`<section class="parallel-day"><header><b>${label}</b><small>8h úteis</small></header><div class="lane-heads">${lanes.map(l=>`<span>${l.label}</span>`).join('')}</div><div class="parallel-track">${lanes.map((l,idx)=>`<div class="lane-bg" style="left:${idx*25}%"></div>`).join('')}<div class="lunch-mark"><span>12:00–13:30 almoço</span></div>${tasks.filter(t=>t.date===date).map(t=>taskHtml(t)).join('')}</div></section>`).join('')}</div></div>`;
    bindDrag(grid,days);
  }
  function taskHtml(t){const laneIndex=lanes.findIndex(l=>l.id===t.lane);return `<article class="parallel-task task-${t.kind}" draggable="true" data-task="${t.id}" style="--lane:${laneIndex};--top:${t.start/480};--height:${t.duration/480}"><b>${t.label}</b><span>${t.order}</span><small>${usefulToClock(t.start)}–${usefulToClock(t.start+t.duration)}</small><em>${t.detail}</em></article>`}
  function bindDrag(grid,days){
    grid.querySelectorAll('.parallel-task').forEach(card=>card.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/plain',card.dataset.task);ev.dataTransfer.effectAllowed='move'}));
    grid.querySelectorAll('.parallel-track').forEach((track,dayIndex)=>{
      track.addEventListener('dragover',ev=>{ev.preventDefault();track.classList.add('drag-target')});track.addEventListener('dragleave',()=>track.classList.remove('drag-target'));
      track.addEventListener('drop',ev=>{ev.preventDefault();track.classList.remove('drag-target');const id=ev.dataTransfer.getData('text/plain'),task=tasks.find(t=>t.id===id);if(!task)return;const rect=track.getBoundingClientRect(),x=clamp(ev.clientX-rect.left,0,rect.width-1),y=clamp(ev.clientY-rect.top,0,rect.height);task.date=days[dayIndex][1];task.lane=lanes[Math.min(3,Math.floor(x/(rect.width/4)))].id;task.start=clamp(snap(y/rect.height*480),0,480-task.duration);render(document.querySelector('.zoom-btn.active')?.dataset.zoom||'today')})
    });
  }
  function init(){document.querySelectorAll('.zoom-btn').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.zoom-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.zoom)}));const active=document.querySelector('.zoom-btn.active');if(active)active.classList.remove('active');const today=document.querySelector('.zoom-btn[data-zoom="today"]');if(today)today.classList.add('active');render('today')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();