(()=>{
  const monthNames=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const weekdays=['D','S','T','Q','Q','S','S'];
  const iso=d=>`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  function monthCalendar(year,month,firstAvailable){
    const first=new Date(Date.UTC(year,month,1)),last=new Date(Date.UTC(year,month+1,0)),offset=first.getUTCDay(),cells=[];
    for(let i=0;i<offset;i++)cells.push('<span class="client-calendar-day outside"></span>');
    for(let day=1;day<=last.getUTCDate();day++){
      const d=new Date(Date.UTC(year,month,day)),closed=d<firstAvailable,firstDay=iso(d)===iso(firstAvailable);
      cells.push(`<button type="button" class="client-calendar-day ${closed?'closed':'open'} ${firstDay?'first':''}" ${closed?'disabled':''} data-date="${iso(d)}" title="${closed?'Data fechada para novos pedidos':'Disponível para consulta'}">${day}</button>`);
    }
    return `<div class="client-calendar-month">${monthNames[month]} ${year}</div><div class="client-calendar-weekdays">${weekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="client-calendar-grid">${cells.join('')}</div>`;
  }
  window.renderAvailabilityCalendar=function(firstAvailable){
    return `<div class="client-calendar-simple"><div class="client-calendar-title"><b>Calendário de disponibilidade</b><span>Novos pedidos a partir de ${fmt(firstAvailable)}</span></div>${monthCalendar(2026,7,firstAvailable)}${monthCalendar(2026,8,firstAvailable)}<div class="client-calendar-legend"><span><i class="legend-line"></i> fechado para novos pedidos</span><span><i class="legend-first"></i> primeira data disponível</span></div></div>`;
  };
})();