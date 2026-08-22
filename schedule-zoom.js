(()=>{
  const e=id=>document.getElementById(id);
  const views={
    today:{title:'Hoje · sábado, 22 de agosto',summary:'5 tarefas programadas hoje',days:['Hoje · 22 ago']},
    '3days':{title:'Hoje + próximos 3 dias',summary:'8 tarefas até terça-feira',days:['Hoje · 22 ago','Seg · 24 ago','Ter · 25 ago']},
    week:{title:'Semana operacional · 22 a 28 de agosto',summary:'12 tarefas com prazo nesta semana',days:['Sáb · 22','Seg · 24','Ter · 25','Qua · 26','Qui · 27','Sex · 28']},
    '30days':{title:'Próximos 30 dias',summary:'Agenda operacional até 20 de setembro',days:['22 ago','24 ago','25 ago','26 ago','27 ago','28 ago','31 ago','02 set','04 set','08 set','12 set','16 set','20 set']},
    '60days':{title:'Próximos 60 dias',summary:'Agenda operacional até o fim de setembro',days:['22 ago','24 ago','25 ago','26 ago','27 ago','28 ago','31 ago','02 set','04 set','08 set','12 set','16 set','20 set','22 set','25 set','28 set','30 set']}
  };

  const tasks=[
    {day:'Hoje · 22 ago',start:'08:00',end:'09:15',kind:'arte',label:'Arte',order:'#1046',text:'Print A5 · Clara Studio'},
    {day:'Hoje · 22 ago',start:'09:00',end:'10:40',kind:'impressao',label:'Impressão',order:'#1048',text:'Adesivos · Luna Papelaria'},
    {day:'Hoje · 22 ago',start:'10:20',end:'12:00',kind:'corte',label:'Corte',order:'#1046',text:'Chaveiros · Clara Studio'},
    {day:'Hoje · 22 ago',start:'13:30',end:'15:00',kind:'acabamento',label:'Acabamento',order:'#1048',text:'Print A5 · Luna Papelaria'},
    {day:'Hoje · 22 ago',start:'15:10',end:'16:20',kind:'laminacao',label:'Laminação',order:'#1047',text:'Adesivos · Mimo & Co.'},
    {day:'Seg · 24 ago',start:'08:00',end:'09:20',kind:'arte',label:'Arte',order:'#1045',text:'Adesivos · Ateliê Nuvem'},
    {day:'Seg · 24 ago',start:'09:30',end:'11:30',kind:'impressao',label:'Impressão',order:'#1047',text:'Prints · Mimo & Co.'},
    {day:'Seg · 24 ago',start:'13:30',end:'15:40',kind:'corte',label:'Corte',order:'#1047',text:'Adesivos · Mimo & Co.'},
    {day:'Ter · 25 ago',start:'08:30',end:'10:00',kind:'impressao',label:'Impressão',order:'#1046',text:'Prints · Clara Studio'},
    {day:'Ter · 25 ago',start:'10:20',end:'12:00',kind:'acabamento',label:'Acabamento',order:'#1048',text:'Fechamento do pedido'},
    {day:'Qua · 26',start:'09:00',end:'11:00',kind:'impressao',label:'Impressão',order:'#1045',text:'Adesivos · Ateliê Nuvem'},
    {day:'Qui · 27',start:'13:30',end:'15:30',kind:'corte',label:'Corte',order:'#1045',text:'Chaveiros · Ateliê Nuvem'},
    {day:'Sex · 28',start:'10:00',end:'12:00',kind:'acabamento',label:'Acabamento',order:'#1047',text:'Finalização · Mimo & Co.'},
    {day:'31 ago',start:'09:00',end:'11:30',kind:'impressao',label:'Impressão',order:'#1044',text:'Prints · Mori Shop'},
    {day:'02 set',start:'08:00',end:'10:00',kind:'arte',label:'Arte',order:'#1043',text:'Casa Lótus'},
    {day:'04 set',start:'13:30',end:'16:00',kind:'corte',label:'Corte',order:'#1044',text:'Adesivos · Mori Shop'},
    {day:'08 set',start:'09:00',end:'12:00',kind:'impressao',label:'Impressão',order:'#1043',text:'Adesivos · Casa Lótus'},
    {day:'12 set',start:'10:00',end:'12:00',kind:'acabamento',label:'Acabamento',order:'#1045',text:'Entrega Ateliê Nuvem'},
    {day:'16 set',start:'08:30',end:'11:00',kind:'corte',label:'Corte',order:'#1043',text:'Casa Lótus'},
    {day:'20 set',start:'13:30',end:'15:30',kind:'acabamento',label:'Acabamento',order:'#1044',text:'Mori Shop'},
    {day:'22 set',start:'09:00',end:'11:00',kind:'acabamento',label:'Acabamento',order:'#1044',text:'Entrega Mori Shop'},
    {day:'25 set',start:'08:00',end:'10:00',kind:'impressao',label:'Impressão',order:'#1043',text:'Prints · Casa Lótus'},
    {day:'28 set',start:'13:30',end:'15:00',kind:'acabamento',label:'Acabamento',order:'#1043',text:'Finalização'},
    {day:'30 set',start:'09:00',end:'10:00',kind:'entrega',label:'Pronto',order:'#1043',text:'Entrega Casa Lótus'}
  ];

  const aliases={
    'Sáb · 22':'Hoje · 22 ago','Seg · 24':'Seg · 24 ago','Ter · 25':'Ter · 25 ago',
    '22 ago':'Hoje · 22 ago','24 ago':'Seg · 24 ago','25 ago':'Ter · 25 ago','26 ago':'Qua · 26','27 ago':'Qui · 27','28 ago':'Sex · 28'
  };

  const hours=['08:00','09:00','10:00','11:00','12:00','13:30','14:30','15:30','16:30','17:30'];
  const toMinutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
  const dayTasks=d=>tasks.filter(t=>t.day===(aliases[d]||d));

  function summary(v){
    const s=e('scheduleFocusSummary');
    if(v==='today'){
      s.innerHTML=`<div class="focus-card urgent"><span>AGORA</span><strong>Impressão #1048</strong><small>09:00–10:40 · terminar até 10:40.</small></div><div class="focus-card"><span>PRÓXIMO</span><strong>Corte #1046</strong><small>10:20–12:00</small></div><div class="focus-card"><span>ÚLTIMO DE HOJE</span><strong>Laminação #1047</strong><small>Termina às 16:20.</small></div>`;
    }else{
      s.innerHTML=`<div class="focus-card"><span>HORIZONTE</span><strong>${views[v].summary}</strong><small>Cada bloco mostra somente tarefa, pedido e horário.</small></div>`;
    }
  }

  function render(v){
    const d=views[v];
    e('scheduleRangeTitle').textContent=d.title;
    summary(v);
    e('capacitySummary').innerHTML='';
    const grid=e('productionGrid');
    grid.className='production-grid calendar-horizon zoom-'+v;

    const start=toMinutes('08:00');
    const end=toMinutes('17:30');
    const span=end-start;
    const rows=hours.map(h=>`<div class="time-label" style="--time:${(toMinutes(h)-start)/span}">${h}</div>`).join('');

    grid.innerHTML=`<div class="time-axis">${rows}</div><div class="day-columns">${d.days.map(day=>{
      const items=dayTasks(day).map(t=>{
        const top=((toMinutes(t.start)-start)/span)*100;
        const height=Math.max(7,((toMinutes(t.end)-toMinutes(t.start))/span)*100);
        return `<article class="calendar-task task-${t.kind}" style="top:${top}%;height:${height}%"><span>${t.label}</span><strong>${t.order}</strong><small>${t.start}–${t.end}</small></article>`;
      }).join('');
      return `<section class="day-column"><header><b>${day}</b><small>${dayTasks(day).length} tarefa${dayTasks(day).length===1?'':'s'}</small></header><div class="day-track">${items||'<div class="free-day">livre</div>'}</div></section>`;
    }).join('')}</div>`;
  }

  function init(){
    document.querySelectorAll('.zoom-btn').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.zoom-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      render(b.dataset.zoom);
    }));
    render('today');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();