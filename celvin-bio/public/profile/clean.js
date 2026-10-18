(()=>{
 const button=document.getElementById('shareProfile'),status=document.getElementById('copyStatus');let timer;
 button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);status.textContent='Link kopiert';}catch{status.textContent=location.origin+location.pathname;}status.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>status.classList.remove('visible'),2500);});
 document.querySelectorAll('.socials .link-btn').forEach(link=>{
  if(link.tagName==='A')return;
  const copy=document.createElement('button');copy.type='button';copy.className=link.className;
  const username=link.querySelector('.link-username')?.textContent.trim()||'';
  const platform=link.querySelector('.link-platform')?.textContent.trim()||'Kontakt';
  copy.setAttribute('aria-label',platform+': '+username+' kopieren');copy.title=username+' kopieren';
  copy.replaceChildren(...link.childNodes);link.replaceWith(copy);
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(username);status.textContent=platform+' kopiert';}catch{status.textContent=username;}status.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>status.classList.remove('visible'),2500);});
 });
 const details=document.querySelector('.soundtrack');if(!details)return;
 const summary=details.querySelector('summary');let animation=null,expanded=details.open;
 const frame=details.querySelector('iframe'),audio=details.querySelector('audio');
 const feedback=document.createElement('p');feedback.className='music-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;
 details.querySelector('.soundtrack-player').prepend(feedback);
 let player=null,ready=false,loadTimer=null;
 function message(text){feedback.textContent=text;feedback.hidden=!text;}
 function play(){
  if(audio){const result=audio.play();if(result&&result.catch)result.catch(()=>message('Tippe auf Play im Player, um den Song zu starten.'));return;}
  if(player&&ready){message('');player.playVideo();}
  else if(frame)message('Song wird geladen …');
 }
 function stopPlayback(){
  if(audio)audio.pause();
  if(player&&ready)player.pauseVideo();
 }
 if(frame){
  frame.id='profileYouTubePlayer';frame.loading='eager';
  const source=new URL(frame.src);source.searchParams.set('enablejsapi','1');source.searchParams.set('origin',location.origin);frame.src=source.href;
  function initPlayer(){
   if(player||!window.YT||!window.YT.Player)return;
   player=new window.YT.Player(frame.id,{events:{
    onReady(){ready=true;clearTimeout(loadTimer);if(expanded)play();},
    onStateChange(event){if(event.data===1)message('');},
    onAutoplayBlocked(){if(expanded)message('Tippe auf Play im Video, um den Song zu starten.');},
    onError(event){clearTimeout(loadTimer);const restricted=[100,101,150].includes(event.data);message(restricted?'YouTube erlaubt diesen Song hier nicht. Öffne ihn über den YouTube-Link unten.':'Der YouTube-Player konnte nicht starten. Nutze den YouTube-Link unten.');}
   }});
  }
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){if(typeof previous==='function')previous();initPlayer();};
  if(window.YT&&window.YT.Player)initPlayer();
  else{const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>message('YouTube konnte nicht geladen werden. Nutze den YouTube-Link unten.');document.head.append(script);}
  loadTimer=setTimeout(()=>{if(!ready)message('YouTube lädt nicht. Prüfe deinen Inhaltsblocker oder öffne den Song über den Link unten.');},15000);
 }
 summary.addEventListener('click',event=>{
  event.preventDefault();expanded=!expanded;
  const start=details.getBoundingClientRect().height;
  if(animation){animation.cancel();animation=null;}
  details.open=true;
  if(expanded)play();else stopPlayback();
  const end=expanded?details.getBoundingClientRect().height:summary.getBoundingClientRect().height;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){details.open=expanded;return;}
  animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
  animation.onfinish=()=>{details.open=expanded;animation=null;};
 });
})();
