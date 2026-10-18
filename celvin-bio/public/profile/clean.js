(()=>{
 const button=document.getElementById('shareProfile'),status=document.getElementById('copyStatus');let timer;
 button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);status.textContent='Link kopiert';}catch{status.textContent=location.origin+location.pathname;}status.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>status.classList.remove('visible'),2500);});
 const details=document.querySelector('.soundtrack');if(!details)return;
 const summary=details.querySelector('summary');let animation=null,expanded=details.open;
 function stopPlayback(){details.querySelectorAll('audio,video').forEach(media=>media.pause());const frame=details.querySelector('iframe');if(frame)frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube-nocookie.com');}
 summary.addEventListener('click',event=>{
  event.preventDefault();expanded=!expanded;if(!expanded)stopPlayback();
  const start=details.getBoundingClientRect().height;
  if(animation){animation.cancel();animation=null;}
  details.open=true;
  const end=expanded?details.getBoundingClientRect().height:summary.getBoundingClientRect().height;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){details.open=expanded;return;}
  animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
  animation.onfinish=()=>{details.open=expanded;animation=null;};
 });
})();
