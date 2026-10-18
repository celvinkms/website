(()=>{
 const button=document.getElementById('shareProfile'),status=document.getElementById('copyStatus');let timer;
 const entry=document.getElementById('enterProfile'),stage=document.querySelector('.profile-stage');
 if(entry){
  stage.inert=true;
  entry.addEventListener('click',()=>{
   if(!document.body.classList.contains('entry-pending'))return;
   stage.inert=false;document.body.classList.remove('entry-pending');
   entry.classList.add('leaving');entry.disabled=true;
   window.dispatchEvent(new Event('profile:enter'));
   const heading=stage.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});
   setTimeout(()=>{entry.hidden=true;entry.querySelectorAll('video').forEach(video=>video.pause());},matchMedia('(prefers-reduced-motion: reduce)').matches?0:450);
  });
 }

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
 const summary=details.querySelector('.music-toggle');let expanded=false;
 const frame=details.querySelector('iframe'),audio=details.querySelector('audio');
 const feedback=document.createElement('p');feedback.className='music-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;
 details.querySelector('.soundtrack-player').prepend(feedback);
 const fallback=details.querySelector('.profile-music>a')?.cloneNode(true);
 if(fallback){fallback.className='music-fallback';fallback.hidden=true;feedback.after(fallback);}
 let player=null,ready=false,loadTimer=null;
 function message(text){feedback.textContent=text;feedback.hidden=!text;if(fallback)fallback.hidden=!/nicht|erlaubt|konnte|block|erneut/i.test(text);}

 function play(){
  if(audio){audio.controls=false;const result=audio.play();if(result&&result.catch)result.catch(()=>message('Klicke erneut auf die Musikzeile, um den Song zu starten.'));return;}
  if(player&&ready){message('');player.playVideo();}
  else if(frame)message('Song wird geladen …');
 }
 function stopPlayback(){
  if(audio)audio.pause();
  if(player&&ready)player.pauseVideo();
 }
 if(frame){
  frame.id='profileYouTubePlayer';frame.loading='eager';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');
  const source=new URL(frame.src);source.searchParams.set('enablejsapi','1');source.searchParams.set('origin',location.origin);frame.src=source.href;
  function initPlayer(){
   if(player||!window.YT||!window.YT.Player)return;
   player=new window.YT.Player(frame.id,{events:{
    onReady(){ready=true;clearTimeout(loadTimer);if(expanded)play();},
    onStateChange(event){if(event.data===1){message('');setState(true);}else if(event.data===2||event.data===0)setState(false);},
    onAutoplayBlocked(){setState(false);if(expanded)message('Klicke erneut auf die Musikzeile, um den Song zu starten.');},
    onError(event){clearTimeout(loadTimer);const restricted=[100,101,150].includes(event.data);message(restricted?'YouTube erlaubt diesen Song hier nicht. Öffne ihn über den YouTube-Link unten.':'Der YouTube-Player konnte nicht starten. Nutze den YouTube-Link unten.');}
   }});
  }
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){if(typeof previous==='function')previous();initPlayer();};
  if(window.YT&&window.YT.Player)initPlayer();
  else{const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>message('YouTube konnte nicht geladen werden. Nutze den YouTube-Link unten.');document.head.append(script);}
  loadTimer=setTimeout(()=>{if(!ready)message('YouTube lädt nicht. Prüfe deinen Inhaltsblocker oder öffne den Song über den Link unten.');},15000);
 }
 function setState(playing){
  summary.setAttribute('aria-pressed',String(playing));
  summary.setAttribute('aria-label',playing?'Musik pausieren':'Musik abspielen');
  details.classList.toggle('playing',playing);
 }
 if(audio){audio.addEventListener('playing',()=>setState(true));audio.addEventListener('pause',()=>setState(false));}
 function setExpanded(open){
  expanded=open;
  if(open)play();else{stopPlayback();setState(false);}
 }
 window.addEventListener('profile:enter',()=>setExpanded(true));
 summary.addEventListener('click',()=>setExpanded(!expanded||summary.getAttribute('aria-pressed')!=='true'));
})();
