(()=>{
  let ctx=null;
  const getCtx=()=>ctx||(ctx=new (window.AudioContext||window.webkitAudioContext)());
  const now=()=>getCtx().currentTime;
  function puff(base=180,dur=.12,gain=.025){
    const c=getCtx(),t=now(),o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type='sine';o.frequency.setValueAtTime(base,t);o.frequency.exponentialRampToValueAtTime(Math.max(90,base*.72),t+dur);
    f.type='lowpass';f.frequency.setValueAtTime(650,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(f);f.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.02);
  }
  function hop(dir=1){
    const c=getCtx(),t=now();
    [0,.055].forEach((off,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';const f=dir>0?(i?220:170):(i?150:205);o.frequency.setValueAtTime(f,t+off);g.gain.setValueAtTime(.0001,t+off);g.gain.exponentialRampToValueAtTime(.022,t+off+.012);g.gain.exponentialRampToValueAtTime(.0001,t+off+.09);o.connect(g);g.connect(c.destination);o.start(t+off);o.stop(t+off+.1)});
  }
  function openSoft(){puff(155,.15,.022);setTimeout(()=>puff(205,.1,.014),45)}
  function success(){const c=getCtx(),t=now();[145,185,230].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,t+i*.045);g.gain.setValueAtTime(.0001,t+i*.045);g.gain.exponentialRampToValueAtTime(.016,t+i*.045+.01);g.gain.exponentialRampToValueAtTime(.0001,t+i*.045+.085);o.connect(g);g.connect(c.destination);o.start(t+i*.045);o.stop(t+i*.045+.1)})}
  function play(kind){try{const c=getCtx();if(c.state==='suspended')c.resume();if(kind==='next')hop(1);else if(kind==='back')hop(-1);else if(kind==='open')openSoft();else if(kind==='success')success();else puff()}catch(e){}}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.matches('[data-product-move="next"],[data-group-move="next"],[data-card-move="next"]'))play('next');
    else if(b.matches('[data-product-move="back"],[data-group-move="back"],[data-card-move="back"]'))play('back');
    else if(b.matches('.compact-order-card,.flow-order-card,.open-split,.nav'))play('open');
    else if(b.matches('.primary,#checkAvailability,#calcQuote'))play('success');
    else play('soft');
  },true);
  window.BennieSounds={play};
})();