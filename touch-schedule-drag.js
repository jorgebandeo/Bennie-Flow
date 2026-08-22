(()=>{
  if(!window.matchMedia?.('(pointer: coarse)').matches)return;
  const HOLD_MS=450, MOVE_CANCEL=10;
  let holdTimer=null, active=null, startX=0, startY=0, dragging=false, ghost=null;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const snap=n=>Math.round(n/30)*30;
  function usefulToClock(min){min=clamp(min,0,480);const clock=min<=240?480+min:570+min;return `${String(Math.floor(clock/60)).padStart(2,'0')}:${String(clock%60).padStart(2,'0')}`}
  function cleanup(){clearTimeout(holdTimer);holdTimer=null;document.body.classList.remove('schedule-touch-dragging');active?.classList.remove('touch-held');ghost?.remove();ghost=null;active=null;dragging=false}
  function makeGhost(card,x,y){ghost=card.cloneNode(true);ghost.classList.add('touch-drag-ghost');ghost.removeAttribute('style');ghost.style.width=Math.max(120,card.getBoundingClientRect().width)+'px';document.body.appendChild(ghost);moveGhost(x,y)}
  function moveGhost(x,y){if(!ghost)return;ghost.style.left=(x-ghost.offsetWidth/2)+'px';ghost.style.top=(y-ghost.offsetHeight/2)+'px'}
  function startDrag(card,e){dragging=true;active=card;card.classList.add('touch-held');document.body.classList.add('schedule-touch-dragging');makeGhost(card,e.clientX,e.clientY);if(navigator.vibrate)navigator.vibrate(18)}
  function targetAt(x,y){ghost?.style.setProperty('pointer-events','none');const el=document.elementFromPoint(x,y);return el?.closest('.parallel-track')||null}
  function applyDrop(card,track,x,y){
    const day=track.closest('.parallel-day');if(!day)return;
    const rect=track.getBoundingClientRect(),rx=clamp(x-rect.left,0,rect.width-1),ry=clamp(y-rect.top,0,rect.height);
    const laneIndex=Math.min(3,Math.floor(rx/(rect.width/4))), lane=['print','bopp','cut','manual'][laneIndex];
    const start=clamp(snap(ry/rect.height*480),0,450);
    card.click();
    requestAnimationFrame(()=>{
      const dlg=document.getElementById('scheduleTaskDialog');if(!dlg?.open)return;
      const date=document.getElementById('taskEditDate'),laneSel=document.getElementById('taskEditLane'),time=document.getElementById('taskEditStart'),save=document.getElementById('saveTaskEdit');
      if(date)date.value=day.dataset.date;if(laneSel)laneSel.value=lane;if(time)time.value=usefulToClock(start);save?.click();
    });
  }
  function bindCard(card){
    if(card.dataset.touchDragBound)return;card.dataset.touchDragBound='1';
    card.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse')return;startX=e.clientX;startY=e.clientY;active=card;dragging=false;
      holdTimer=setTimeout(()=>startDrag(card,e),HOLD_MS);
    },{passive:true});
    card.addEventListener('pointermove',e=>{
      if(active!==card)return;
      if(!dragging&&Math.hypot(e.clientX-startX,e.clientY-startY)>MOVE_CANCEL){clearTimeout(holdTimer);holdTimer=null;active=null;return}
      if(dragging){e.preventDefault();moveGhost(e.clientX,e.clientY);document.querySelectorAll('.parallel-track.touch-drop-target').forEach(x=>x.classList.remove('touch-drop-target'));targetAt(e.clientX,e.clientY)?.classList.add('touch-drop-target')}
    },{passive:false});
    const finish=e=>{
      if(active!==card)return;clearTimeout(holdTimer);holdTimer=null;
      if(dragging){e.preventDefault();e.stopPropagation();const track=targetAt(e.clientX,e.clientY);document.querySelectorAll('.parallel-track.touch-drop-target').forEach(x=>x.classList.remove('touch-drop-target'));if(track)applyDrop(card,track,e.clientX,e.clientY);setTimeout(cleanup,0)}else active=null;
    };
    card.addEventListener('pointerup',finish,{passive:false});card.addEventListener('pointercancel',cleanup);
  }
  function bindAll(){document.querySelectorAll('.parallel-task').forEach(bindCard)}
  new MutationObserver(bindAll).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindAll);else bindAll();
})();