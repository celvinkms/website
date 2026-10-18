/* Bass-driven background. CSS --beat-zoom / --beat-light control the intensity. */
(function(root){
 'use strict';
 class BassPulse {
  constructor(){this.reset();}
  reset(){this.time=null;this.average=0;this.previous=0;this.lastHit=-Infinity;this.pulse=0;this.level=0;}
  update(energy,now){
   if(this.time===null){this.time=now;this.average=energy;this.previous=energy;return 0;}
   const dt=Math.max(1,Math.min(100,now-this.time));this.time=now;
   const rise=(energy-this.previous)/Math.max(this.average,.0005);
   if(energy>.0008&&rise>.32&&now-this.lastHit>190){
    this.pulse=Math.min(1,Math.max(.25,rise*.7));this.lastHit=now;
   }
   this.average+=(energy-this.average)*(1-Math.exp(-dt/650));this.previous=energy;
   this.pulse*=Math.exp(-dt/140);
   this.level+=(this.pulse-this.level)*(1-Math.exp(-dt/(this.pulse>this.level?18:110)));
   return this.level;
  }
 }
 function createProfileBeatSync(audio,scene){
  const Context=root.AudioContext||root.webkitAudioContext;
  if(!audio||!scene||!Context)return null;
  // Foreign audio without CORS must keep its native playback path.
  try{const url=new URL(audio.currentSrc||audio.src,root.location.href);if(url.origin!==root.location.origin&&!['data:','blob:'].includes(url.protocol))return null;}catch{return null;}
  const motion=root.matchMedia('(prefers-reduced-motion: reduce)'),detector=new BassPulse();
  let context=null,source=null,analyser=null,bins=null,frame=0,failed=false,leaving=false;
  function stop(){
   root.cancelAnimationFrame(frame);frame=0;detector.reset();
   scene.classList.remove('beat-reactive');scene.style.removeProperty('--beat-strength');
  }
  function available(){return !failed&&!leaving&&!root.document.hidden&&!motion.matches&&!audio.paused&&!audio.ended&&!audio.seeking&&!audio.muted&&audio.volume>0&&source&&context.state==='running';}
  function tick(now){
   frame=0;if(!available()){stop();return;}
   try{
    analyser.getFloatFrequencyData(bins);
    const first=Math.max(1,Math.floor(35*analyser.fftSize/context.sampleRate));
    const last=Math.min(bins.length-1,Math.ceil(180*analyser.fftSize/context.sampleRate));
    let power=0;for(let i=first;i<=last;i++)if(Number.isFinite(bins[i]))power+=Math.pow(10,bins[i]/10);
    const strength=detector.update(Math.sqrt(power/(last-first+1)),now);
    scene.style.setProperty('--beat-strength',strength.toFixed(4));
    frame=root.requestAnimationFrame(tick);
   }catch{failed=true;stop();}
  }
  function start(){if(available()&&!frame){scene.classList.add('beat-reactive');frame=root.requestAnimationFrame(tick);}}
  function attach(){
   if(failed||motion.matches||context.state!=='running')return;
   if(!source){
    try{
     analyser=context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.12;
     bins=new Float32Array(analyser.frequencyBinCount);
     source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination);
    }catch{
     // Analysis must never silence an otherwise playable song.
     if(source){try{source.disconnect();source.connect(context.destination);}catch{}}
     failed=true;stop();return;
    }
   }
   start();
  }
  function unlock(){
   if(failed||motion.matches)return;
   try{
    if(!context){context=new Context();context.addEventListener('statechange',()=>{if(context.state==='running')start();else stop();});}
    // Route audio only after resume succeeds, preserving native autoplay fallback.
    if(context.state==='running')attach();else context.resume().then(attach).catch(()=>{});
   }catch{failed=true;stop();}
  }
  audio.addEventListener('playing',start);
  for(const event of ['pause','ended','waiting','seeking','emptied','error'])audio.addEventListener(event,stop);
  audio.addEventListener('seeked',start);
  audio.addEventListener('volumechange',()=>{if(audio.muted||audio.volume===0)stop();else start();});
  root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)stop();else start();});
  motion.addEventListener('change',()=>{stop();if(!motion.matches&&!audio.paused)unlock();});
  root.addEventListener('pagehide',()=>{leaving=true;stop();});
  root.addEventListener('pageshow',()=>{leaving=false;start();});
  return {unlock};
 }
 if(typeof module==='object'&&module.exports)module.exports={BassPulse,createProfileBeatSync};
 else root.createProfileBeatSync=createProfileBeatSync;
})(typeof window==='object'?window:globalThis);
