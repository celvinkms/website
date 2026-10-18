/* Vanilla interactions. No inline handlers, eval or HTML string insertion. */
(()=>{
 'use strict';
 const entry=document.getElementById('enterProfile'),stage=document.querySelector('.profile-stage');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const notice=document.getElementById('copyStatus');let noticeTimer;
 function notify(text){notice.textContent=text;notice.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.classList.remove('visible'),2500);}
 async function copy(value){try{await navigator.clipboard.writeText(value);notify('Link kopiert');}catch{notify(value);}}
 document.getElementById('shareProfile')?.addEventListener('click',()=>copy(location.origin+location.pathname));
 if(entry&&stage){
  stage.inert=true;
  entry.addEventListener('click',()=>{
   if(!document.body.classList.contains('entry-pending'))return;
   stage.inert=false;document.body.classList.remove('entry-pending');entry.classList.add('leaving');entry.disabled=true;
   window.dispatchEvent(new Event('profile:enter'));
   const heading=stage.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});
   setTimeout(()=>{entry.hidden=true;entry.querySelectorAll('video').forEach(v=>v.pause());},reduced.matches?0:650);
  });
 }
 /* Keep the configured destinations and tracking routes, present only the icons. */
 document.querySelectorAll('.socials .link-btn').forEach(original=>{
  const platform=original.querySelector('.link-platform')?.textContent.trim()||'Kontakt';
  const username=original.querySelector('.link-username')?.textContent.trim()||'';
  let link=original;
  if(original.tagName!=='A'){
   const discord=platform.toLowerCase()==='discord'?document.querySelector('[data-discord-profile]'):null;
   link=document.createElement(discord?'a':'button');link.className=original.className;
   if(discord){link.href=discord.href;link.target='_blank';link.rel='noopener noreferrer';}
   else{link.type='button';link.addEventListener('click',()=>copy(username));}
   link.replaceChildren(...original.childNodes);original.replaceWith(link);
  }
  link.setAttribute('aria-label',platform+(username?' · '+username:''));link.dataset.tooltip=platform;link.removeAttribute('title');
  if(platform.toLowerCase()==='discord'){
   link.classList.add('discord-link');const path=link.querySelector('.li svg path');
   if(path){path.setAttribute('fill-rule','evenodd');path.setAttribute('d',path.getAttribute('d')+' M9.4 12.5 a1.35 1.65 0 1 0 -2.7 0 a1.35 1.65 0 1 0 2.7 0 Z M17.3 12.5 a1.35 1.65 0 1 0 -2.7 0 a1.35 1.65 0 1 0 2.7 0 Z');}
  }
 });
 /* Player state is driven by the actual media provider, never by the animation. */
 const card=document.querySelector('.soundtrack');if(!card)return;
 const toggle=card.querySelector('.music-toggle'),frame=card.querySelector('iframe'),audio=card.querySelector('audio');
 const beatSync=audio?window.createProfileBeatSync?.(audio,document.querySelector('.ambient')):null;
 const seek=card.querySelector('#musicSeek'),volume=card.querySelector('#musicVolume');
 const stateLabel=card.querySelector('[data-player-state]');
 const feedback=document.createElement('p');feedback.className='music-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;card.querySelector('.soundtrack-player').prepend(feedback);
 const fallback=card.querySelector('.profile-music>a')?.cloneNode(true);if(fallback){fallback.className='music-fallback';fallback.hidden=true;feedback.after(fallback);}
 let player=null,ready=false,requested=false,playing=false,loadTimer=null,scrubbing=false,clock=null;
 function message(text){feedback.textContent=text;feedback.hidden=!text;if(fallback)fallback.hidden=!text||text.includes('geladen');}
 function setState(value){playing=value;card.classList.toggle('playing',value);toggle.setAttribute('aria-pressed',String(value));toggle.setAttribute('aria-label',value?'Musik pausieren':'Musik abspielen');stateLabel.textContent=value?'Wird abgespielt':requested?'Song wird geladen …':'Pausiert';}
 function setVolume(){const value=Math.max(0,Math.min(100,Number(volume.value)));volume.style.setProperty('--progress',value+'%');if(audio)audio.volume=value/100;if(player&&ready)player.setVolume?.(value);}
 function time(value){const seconds=Math.max(0,Math.floor(Number(value)||0));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');}
 function update(){
  if(document.hidden)return;
  const duration=audio?audio.duration:ready?player.getDuration?.():0,current=audio?audio.currentTime:ready?player.getCurrentTime?.():0;
  const valid=Number.isFinite(duration)&&duration>0;seek.disabled=!valid;
  card.querySelector('[data-duration]').textContent=valid?time(duration):'–:––';
  card.querySelector('[data-current-time]').textContent=time(current);
  if(valid&&!scrubbing){seek.value=String(current/duration*100);seek.style.setProperty('--progress',seek.value+'%');}
 }
 function play(){
  requested=true;message('');
  if(audio){beatSync?.unlock();setVolume();const promise=audio.play();promise?.catch(()=>{requested=false;setState(false);message('Tippe auf Play, um die Musik zu starten.');});}
  else if(player&&ready)player.playVideo();
  else stateLabel.textContent='Song wird geladen …';
 }
 function pause(){requested=false;audio?.pause();if(player&&ready)player.pauseVideo();setState(false);message('');}
 toggle.addEventListener('click',()=>{if(playing||requested)pause();else play();});
 window.addEventListener('profile:enter',play);
 volume.addEventListener('input',setVolume);setVolume();
 seek.addEventListener('input',()=>{scrubbing=true;seek.style.setProperty('--progress',seek.value+'%');const d=audio?audio.duration:player?.getDuration?.();card.querySelector('[data-current-time]').textContent=time(d*Number(seek.value)/100);});
 seek.addEventListener('change',()=>{const d=audio?audio.duration:player?.getDuration?.();const target=d*Number(seek.value)/100;if(Number.isFinite(target)){if(audio)audio.currentTime=target;else if(ready)player.seekTo?.(target,true);}scrubbing=false;update();});
 if(audio){audio.addEventListener('playing',()=>{requested=true;message('');setState(true);});audio.addEventListener('pause',()=>setState(false));audio.addEventListener('ended',()=>{requested=false;setState(false);});audio.addEventListener('loadedmetadata',update);audio.addEventListener('error',()=>{requested=false;setState(false);message('Die Audiodatei konnte nicht geladen werden.');});}
 if(frame){
  frame.id='profileYouTubePlayer';frame.loading='eager';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');
  const source=new URL(frame.src);source.searchParams.set('enablejsapi','1');source.searchParams.set('origin',location.origin);frame.src=source.href;
  function init(){if(player||!window.YT?.Player)return;player=new window.YT.Player(frame.id,{events:{
   onReady(){ready=true;clearTimeout(loadTimer);setVolume();update();if(requested)play();},
   onStateChange(event){if(event.data===1){message('');requested=true;setState(true);}else if(event.data===2||event.data===0){requested=false;setState(false);}update();},
   onAutoplayBlocked(){requested=false;setState(false);message('Tippe auf Play, um die Musik zu starten.');},
   onError(){clearTimeout(loadTimer);requested=false;setState(false);message('Dieser Song ist hier gerade nicht verfügbar. Auf YouTube öffnen.');}
  }});}
  const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')previous();init();};
  if(window.YT?.Player)init();else{const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.addEventListener('error',()=>message('YouTube konnte nicht geladen werden. Auf YouTube öffnen.'));document.head.append(script);}
  loadTimer=setTimeout(()=>{if(!ready){requested=false;setState(false);message('YouTube lädt nicht. Prüfe deinen Inhaltsblocker oder öffne den Song auf YouTube.');}},15000);
 }
 function schedule(){clearInterval(clock);if(!document.hidden){update();clock=setInterval(update,700);}}
 document.addEventListener('visibilitychange',schedule);window.addEventListener('pagehide',()=>clearInterval(clock));window.addEventListener('pageshow',schedule);schedule();
})();
