(()=>{
 const root=document.querySelector('[data-discord-presence]');if(!root)return;
 document.body.classList.add('discord-live-enabled');
 const node=name=>root.querySelector('[data-discord-'+name+']');const spotify=root.querySelector('[data-discord-spotify]');let refreshing=false,timer=null,lastSpotify=null;
 const statuses={online:'Online',idle:'Abwesend',dnd:'Nicht stören',offline:'Offline / unsichtbar',unknown:'Status nicht verfügbar'};
 function text(target,value){target.textContent=value||'';}
 function unavailable(){text(node('state'),'Live-Status nicht verfügbar');node('dot').hidden=true;node('custom').hidden=true;node('activities').replaceChildren();spotify.hidden=true;text(node('updated'),'');lastSpotify=null;}
 function show(profile){
  text(node('name'),profile.username);node('name').title=profile.display_name||profile.username;root.querySelector('[data-discord-profile]').href=profile.profile_url;
  const avatar=node('avatar');if(profile.avatar_url){avatar.src=profile.avatar_url;avatar.hidden=false;node('placeholder').hidden=true;}else{avatar.hidden=true;node('placeholder').hidden=false;}
  const hasStatus=typeof profile.status==='string';node('dot').hidden=!hasStatus;if(hasStatus)node('dot').dataset.status=profile.status;
  text(node('state'),hasStatus?(statuses[profile.status]||statuses.unknown):'Discord-Profil');
  text(node('custom'),profile.custom_status);node('custom').hidden=!profile.custom_status;
  node('activities').replaceChildren();
  (profile.activities||[]).forEach(activity=>{const item=document.createElement('div');item.className='discord-activity';const label=document.createElement('small');label.textContent=({0:'SPIELT',1:'STREAMT',2:'HÖRT',3:'SCHAUT',5:'AKTIVITÄT'})[activity.type]||'AKTIVITÄT';const title=document.createElement('strong');title.textContent=activity.name;item.append(label,title);if(activity.details||activity.state){const details=document.createElement('p');details.textContent=[activity.details,activity.state].filter(Boolean).join(' · ');item.append(details);}node('activities').append(item);});
  lastSpotify=profile.spotify||null;spotify.hidden=!lastSpotify;
  if(lastSpotify){text(root.querySelector('[data-spotify-song]'),lastSpotify.song);text(root.querySelector('[data-spotify-artist]'),lastSpotify.artist);spotify.href=lastSpotify.url||'https://open.spotify.com/';const art=root.querySelector('[data-spotify-art]');art.hidden=!lastSpotify.album_art_url;if(lastSpotify.album_art_url)art.src=lastSpotify.album_art_url;progress();}
  text(node('updated'),'Live · aktualisiert '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));
 }
 function progress(){if(!lastSpotify)return;const bar=root.querySelector('[data-spotify-progress]');const total=lastSpotify.end-lastSpotify.start;bar.hidden=total<=0;if(total>0)bar.value=Math.max(0,Math.min(1,(Date.now()-lastSpotify.start)/total));}
 async function refresh(){if(refreshing||document.hidden)return;refreshing=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);try{const response=await fetch('/api/discord-presence',{signal:controller.signal,cache:'no-store'});const result=await response.json();if(!response.ok||!result.connected||!result.available)unavailable();else show(result.profile);}catch{unavailable();}finally{clearTimeout(timeout);refreshing=false;}}
 function schedule(){clearInterval(timer);if(!document.hidden){refresh();timer=setInterval(refresh,20000);}}
 document.addEventListener('visibilitychange',schedule);window.addEventListener('pagehide',()=>clearInterval(timer));window.addEventListener('pageshow',schedule);schedule();setInterval(()=>{if(!document.hidden)progress();},1000);
})();
