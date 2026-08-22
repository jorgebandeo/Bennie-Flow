(()=>{
  let ctx=null;
  const getCtx=()=>ctx||(ctx=new (window.AudioContext||window.webkitAudioContext)());
  const now=()=>getCtx().currentTime;
  function tone(freq,start,dur,gain=.055,type='sine',endFreq=null){
    const c=getCtx(),o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type=type;o.frequency.setValueAtTime(freq,start);if(endFreq)o.frequency.exponentialRampToValueAtTime(endFreq,start+dur);
    f.type='lowpass';f.frequency.setValueAtTime(1050,start);f.Q.setValueAtTime(.35,start);
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.012);g.gain.exponentialRampToValueAtTime(gain*.55,start+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,start+dur);
    o.connect(f);f.connect(g);g.connect(c.destination);o.start(start);o.stop(start+dur+.025);
  }
  function puff(base=190,dur=.15,gain=.06){
    const t=now();tone(base,t,dur,gain,'sine',base*.72);tone(base*.5,t+.006,dur*.85,gain*.28,'triangle',base*.42);
  }
  function hop(dir=1){
    const t=now();
    if(dir>0){tone(175,t,.13,.062,'sine',190);tone(235,t+.055,.14,.057,'sine',215);tone(118,t+.018,.11,.022,'triangle',105)}
    else{tone(225,t,.13,.06,'sine',205);tone(165,t+.055,.15,.058,'sine',145);tone(112,t+.02,.12,.022,'triangle',98)}
  }
  function openSoft(){const t=now();tone(150,t,.17,.058,'sine',132);tone(205,t+.045,.14,.044,'sine',188);tone(102,t+.012,.15,.02,'triangle',92)}
  function success(){const t=now();[[150,0],[190,.055],[235,.11]].forEach(([f,off],i)=>tone(f,t+off,.14,i===2?.052:.045,'sine',f*.96));tone(105,t+.025,.18,.018,'triangle',96)}
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