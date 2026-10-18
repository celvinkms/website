(function () {
  'use strict';
  const sections = [
    ['profile','Profil','Name, Bio, Avatar und Badges für dein öffentliches Profil.','Deine Seite'],
    ['discord-badges','Discord-Badges','Discord-Symbole auswählen und ihre Reihenfolge festlegen.'],
    ['links','Links & Socials','Verwalte deine Plattformen und die Reihenfolge deiner Links.'],
    ['design','Design','Farben, Schrift und Kartenstil deiner Seite.'],
    ['entry','Startbildschirm','Eintritt aktivieren, Text und Farben ändern oder ein eigenes Bild hochladen.'],
    ['entry-background','Start-Hintergrund','Transparenz und Unschärfe des Eintritts sowie GIFs und MP4s einstellen.'],
    ['background','Hintergrund','GIFs, MP4s, Bilder und Hintergrundfarben.'],
    ['effects','Musik & Effekte','Audio und visuelle Effekte gezielt einstellen.'],
    ['templates','Vorlagen','Wähle einen Look als Ausgangspunkt. Erst Speichern veröffentlicht ihn.'],
    ['v4studio','Inhaltsblöcke','Zusätzliche Texte, Hinweise, Statistiken und Buttons.','Extras'],
    ['v5lab','Profil-Module','Galerie, FAQ, Reaktionen und weitere Inhaltsmodule.'],
    ['featurelab','Effekt-Bibliothek','Suche und aktiviere einzelne Effekte für dein Profil.'],
    ['v5forge','Theme-Werkzeuge','Weitere Farbvorlagen und Werkzeuge für deine Seite.'],
    ['analytics','Statistiken','Aufrufe und Link-Klicks im Überblick.','Verwalten'],
    ['sharekit','Teilen & Backups','Vorschaubilder, Exporte und gespeicherte Snapshots.'],
    ['automation','Ideen & Presets','Starthilfen für Inhalte und Einstellungen.'],
    ['advanced','SEO & Code','Suchmaschinen, Social Preview und eigener Code.'],
    ['security','Sicherheit','Ändere dein Admin-Passwort unabhängig von deinem Profil.']
  ];
  function boot() {
    document.body.classList.add('admin-editor');
    const overlayField=document.getElementById('bg_overlay_opacity').closest('.fi');
    document.getElementById('sec-background').append(overlayField);
    document.getElementById('bg_type').addEventListener('change',()=>{document.getElementById('bg_use_avatar').checked=false;});
    const side = document.querySelector('.sidebar');
    const footer = side.querySelector('.sf');
    sections.forEach(([id,label,note,group]) => {
      const button = side.querySelector('[data-section="'+id+'"]');
      if (!button) return;
      if (group) { const heading = document.createElement('div'); heading.className='editor-label'; heading.textContent=group; side.insertBefore(heading,footer); }
      const icon = button.querySelector('svg');
      button.replaceChildren(); if (icon) button.append(icon);
      button.append(document.createTextNode(label));
      side.insertBefore(button,footer);
      const section=document.getElementById('sec-'+id);
      if (section) { const p=document.createElement('p'); p.className='editor-section-note'; p.textContent=note; section.prepend(p); }
    });
    const more=document.createElement('details');more.className='editor-more';
    const summary=document.createElement('summary');summary.textContent='Weitere Werkzeuge';more.append(summary);
    const advancedIds=['v4studio','v5lab','featurelab','v5forge','sharekit','automation','advanced'];
    advancedIds.forEach(id=>{const button=side.querySelector('[data-section="'+id+'"]');if(button)more.append(button);});
    side.insertBefore(more,footer);
    side.querySelectorAll('.editor-label').forEach(label=>{if(label.textContent==='Extras')label.remove();});
    const mobileNav=document.createElement('select');mobileNav.className='editor-mobile-nav';mobileNav.setAttribute('aria-label','Bereich auswählen');
    sections.forEach(([id,label])=>{const option=document.createElement('option');option.value=id;option.textContent=label;mobileNav.append(option);});
    document.querySelector('.editor-topline').after(mobileNav);
    mobileNav.addEventListener('change',()=>navTo(mobileNav.value));
    document.body.classList.add('studio-v2');
    const intro=document.querySelector('.editor-intro');
    intro.querySelector('.eyebrow').textContent='PROFILE EDITOR';
    intro.querySelector('h2').textContent='Dein Profil.';
    intro.querySelector('p').textContent='Alles, was dich ausmacht. An einem Ort.';
    const profile=document.getElementById('sec-profile');
    const layout=document.createElement('div');layout.className='profile-layout';
    let panel=null, index=0;
    [...profile.children].forEach(child=>{
      if(child.classList.contains('editor-section-note'))return;
      if(child.classList.contains('st')){
        index++;
        panel=document.createElement(index>2?'details':'section');panel.className='studio-panel';
        const title=document.createElement(index>2?'summary':'h2');title.textContent=child.textContent;
        panel.append(title);layout.append(panel);child.remove();
      }else if(panel)panel.append(child);
    });profile.append(layout);
    const note=profile.querySelector('.editor-section-note');if(note)note.remove();
    const banner=document.createElement('div');banner.className='studio-profile-bar';
    const bannerImage=document.createElement('img');bannerImage.alt='';bannerImage.src=document.getElementById('avatar_url').value;
    const bannerText=document.createElement('div');const bannerTitle=document.createElement('strong');bannerTitle.textContent='Deine öffentliche Seite';
    const bannerLink=document.createElement('a');bannerLink.href='/';bannerLink.target='_blank';bannerLink.rel='noopener';bannerLink.textContent='celvin.rip ↗';bannerText.append(bannerTitle,bannerLink);
    const bannerNote=document.createElement('span');bannerNote.textContent='Änderungen werden mit Speichern veröffentlicht.';banner.append(bannerImage,bannerText,bannerNote);intro.after(banner);
    const mediaStatus=document.getElementById('entry_media_status');
    const mediaInput=document.getElementById('entry_media_file');
    function updateEntryVideo(){const video=document.getElementById('entry_video_preview');video.src=document.getElementById('entry_bg_video').value;video.style.display=video.getAttribute('src')?'block':'none';}
    document.getElementById('entry_bg_video').addEventListener('input',()=>{document.getElementById('entry_bg_type').value='video';updateEntryVideo();});
    document.getElementById('entry_bg_image_text').addEventListener('input',()=>{document.getElementById('entry_bg_type').value='image';});
    document.getElementById('entry_clear_media').addEventListener('click',()=>{
      ['entry_bg_video','entry_bg_image','entry_bg_image_text'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('entry_bg_preview').style.display='none';updateEntryVideo();document.getElementById('entry_bg_type').value='inherit';mediaStatus.textContent='Eigene Medien entfernt. Änderungen speichern.';markDirty();
    });
    mediaInput.addEventListener('change',async()=>{
      const file=mediaInput.files[0];if(!file)return;
      if(file.size>25*1024*1024){mediaStatus.textContent='Bitte eine Datei unter 25 MB wählen.';return;}
      mediaInput.disabled=true;mediaStatus.textContent='Wird hochgeladen …';
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),90000);
      try{
        const response=await fetch('/admin/upload-entry-media',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file,signal:controller.signal});
        const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Upload fehlgeschlagen.');
        document.getElementById('entry_bg_type').value=result.kind;
        if(result.kind==='video'){document.getElementById('entry_bg_video').value=result.url;updateEntryVideo();}
        else{document.getElementById('entry_bg_image').value=result.url;document.getElementById('entry_bg_image_text').value=result.url;const preview=document.getElementById('entry_bg_preview');preview.src=result.url;preview.style.display='block';}
        mediaStatus.textContent=file.name+' hochgeladen. Änderungen speichern, um zu veröffentlichen.';markDirty();
      }catch(error){mediaStatus.textContent=error.name==='AbortError'?'Upload dauert zu lange. Bitte erneut versuchen.':error.message;}
      finally{clearTimeout(timeout);mediaInput.disabled=false;mediaInput.value='';}
    });
    const profileMediaInput=document.getElementById('profile_media_file');
    const profileMediaStatus=document.getElementById('profile_media_status');
    function applyProfileMedia(url,kind){
      document.getElementById('bg_type').value=kind;
      document.getElementById('bg_use_avatar').checked=false;
      if(kind==='video'){
        document.getElementById('bg_video_url').value=url;syncBgVideoPreview(url);
      }else{
        document.getElementById('bg_image_url').value=url;document.getElementById('bg_url_text').value=url;
        const image=document.getElementById('bg_preview');image.src=url;image.style.display='block';
        document.getElementById('bg_filename').textContent='Bild / GIF gesetzt';
      }
      document.getElementById('profile_media_url').value=url;updBg();markDirty();
    }
    profileMediaInput.addEventListener('change',async()=>{
      const file=profileMediaInput.files[0];if(!file)return;
      if(file.size>25*1024*1024){profileMediaStatus.textContent='Bitte eine Datei unter 25 MB wählen. Größere Videos kannst du unten unter Video hochladen.';return;}
      profileMediaInput.disabled=true;profileMediaStatus.textContent='Wird hochgeladen …';
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),90000);
      try{
        const response=await fetch('/admin/upload-entry-media',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file,signal:controller.signal});
        const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Upload fehlgeschlagen.');
        applyProfileMedia(result.url,result.kind);profileMediaStatus.textContent=file.name+' gesetzt. Änderungen speichern, um zu veröffentlichen.';
      }catch(error){profileMediaStatus.textContent=error.name==='AbortError'?'Upload dauert zu lange. Bitte erneut versuchen.':error.message;}
      finally{clearTimeout(timeout);profileMediaInput.disabled=false;profileMediaInput.value='';}
    });
    document.getElementById('profile_media_apply').addEventListener('click',()=>{
      const value=document.getElementById('profile_media_url').value.trim();
      try{
        const url=new URL(value,location.origin);
        if(!['http:','https:'].includes(url.protocol)||!value)throw new Error('invalid');
        const kind=/\.(mp4|webm|ogg)(?:$|[?#])/i.test(url.href)?'video':/\.(gif|png|jpe?g|webp)(?:$|[?#])/i.test(url.href)?'image':document.getElementById('bg_type').value==='video'?'video':'image';
        applyProfileMedia(value,kind);profileMediaStatus.textContent='URL übernommen. Änderungen speichern, um zu veröffentlichen.';
      }catch{profileMediaStatus.textContent='Bitte eine gültige Datei-URL eingeben.';}
    });
    const badgeInput=document.getElementById('discord_badges');
    let discordSelection=JSON.parse(badgeInput.value);
    const badgeOptions=[...document.querySelectorAll('[data-discord-badge]')];
    const selectedBadgeList=document.getElementById('selectedDiscordBadges');
    function renderDiscordSelection(){
      badgeInput.value=JSON.stringify(discordSelection);document.getElementById('discordBadgeCount').textContent=discordSelection.length;
      selectedBadgeList.replaceChildren();
      badgeOptions.forEach(input=>input.checked=discordSelection.includes(input.dataset.discordBadge));
      if(!discordSelection.length){const empty=document.createElement('p');empty.className='td';empty.textContent='Noch keine Discord-Badges ausgewählt.';selectedBadgeList.append(empty);}
      discordSelection.forEach((id,index)=>{
        const option=badgeOptions.find(input=>input.dataset.discordBadge===id).closest('label');
        const item=document.createElement('div');item.className='discord-selected-item';
        const image=option.querySelector('img').cloneNode();image.width=26;image.height=26;
        const name=document.createElement('span');name.textContent=option.querySelector('span').firstChild.textContent;
        item.append(image,name);
        [['↑',-1,'Nach vorne'],['↓',1,'Nach hinten'],['×',0,'Entfernen']].forEach(([text,delta,label])=>{
          const button=document.createElement('button');button.type='button';button.className='bab';button.textContent=text;button.setAttribute('aria-label',name.textContent+': '+label);
          button.disabled=delta<0&&index===0||delta>0&&index===discordSelection.length-1;
          button.addEventListener('click',()=>{if(delta){[discordSelection[index],discordSelection[index+delta]]=[discordSelection[index+delta],discordSelection[index]];}else discordSelection.splice(index,1);renderDiscordSelection();markDirty();});item.append(button);
        });selectedBadgeList.append(item);
      });
    }
    badgeOptions.forEach(input=>input.addEventListener('change',()=>{const id=input.dataset.discordBadge;if(input.checked)discordSelection.push(id);else discordSelection=discordSelection.filter(value=>value!==id);renderDiscordSelection();markDirty();}));
    document.getElementById('clearDiscordBadges').addEventListener('click',()=>{discordSelection=[];renderDiscordSelection();markDirty();});
    document.getElementById('discordBadgeSearch').addEventListener('input',event=>{
      const query=event.target.value.trim().toLocaleLowerCase('de');let count=0;
      document.querySelectorAll('.discord-catalog-card').forEach(card=>{card.hidden=!card.dataset.search.toLocaleLowerCase('de').includes(query);if(!card.hidden)count++;});
      document.querySelectorAll('.discord-catalog-group').forEach(group=>group.hidden=![...group.querySelectorAll('.discord-catalog-card')].some(card=>!card.hidden));
      document.getElementById('discordBadgeResults').textContent=query?count+' Badges gefunden':'';
    });renderDiscordSelection();
    const originalNav = window.navTo;
    window.navTo = function(id) {
      if (!document.getElementById('sec-'+id)) return;
      originalNav(id);
      mobileNav.value=id;
      if(advancedIds.includes(id))more.open=true;
      const item=sections.find(x=>x[0]===id);
      document.getElementById('pt').textContent=item?item[1]:id;
      document.querySelectorAll('.ni[data-section]').forEach(button=>button.setAttribute('aria-current',button.dataset.section===id?'page':'false'));
      history.replaceState(null,'','#'+id);
    };
    document.querySelectorAll('.fi').forEach(field => {
      const label=field.querySelector('label'); const input=field.querySelector('input:not([type=hidden]),textarea,select');
      if (label&&input&&input.id) label.htmlFor=input.id;
    });
    document.querySelectorAll('.sw input').forEach(input=>{
      if (input.labels && [...input.labels].some(label=>label.textContent.trim())) return;
      const row=input.closest('.tr,.feature-item,.v5-toggle');
      if(row) input.setAttribute('aria-label',(row.querySelector('.tl,span')||row).textContent.trim());
    });
    document.querySelectorAll('.tpl-card').forEach(card=>{
      card.tabIndex=0; card.setAttribute('role','button');
      card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click();}});
      card.addEventListener('click',()=>{document.querySelectorAll('.tpl-card').forEach(c=>c.classList.remove('selected'));card.classList.add('selected');});
    });
    const originalApply=window.applyTemplate;
    window.applyTemplate=function(key){originalApply(key);markDirty();};
    ['setLS','setAB','addB','editB','rmB','addSocial','rmSocial'].forEach(name=>{
      const original=window[name];
      window[name]=function(...args){const result=original.apply(this,args);markDirty();return result;};
    });
    const search=document.getElementById('editorSearch');
    search.addEventListener('input',()=>{
      const query=search.value.trim().toLocaleLowerCase('de'); let count=0;
      if(query)more.open=true;
      sections.forEach(([id,label,note])=>{const button=side.querySelector('[data-section="'+id+'"]');if(!button)return;button.hidden=!!query&&!(label+' '+note).toLocaleLowerCase('de').includes(query);if(!button.hidden)count++;});
      document.getElementById('searchResults').classList.toggle('sr-only',!query);
      document.getElementById('searchResults').textContent=query?(count+' Bereiche gefunden'):'';
    });
    search.addEventListener('keydown',event=>{
      if(event.key==='Escape'){search.value='';search.dispatchEvent(new Event('input'));}
      if(event.key==='Enter'){const first=side.querySelector('.ni[data-section]:not([hidden])');if(first){navTo(first.dataset.section);search.blur();}}
    });
    // Delegation also covers fields added later by existing module editors.
    function changed(event){if(event.target.closest('.sec')&&!event.target.closest('#sec-security'))markDirty();}
    document.addEventListener('input',changed);document.addEventListener('change',changed);
    window.addEventListener('beforeunload',event=>{if(window.editorDirty){event.preventDefault();event.returnValue='';}});
    document.getElementById('passwordForm').addEventListener('submit',changePassword);
    const hash=location.hash.slice(1); navTo(sections.some(x=>x[0]===hash)?hash:'profile');
    document.querySelectorAll('.cmdItem').forEach(item=>item.tabIndex=0);
  }
  window.togglePreviewDock=function(){
    const mobile=window.matchMedia('(max-width:1190px)').matches;
    if(mobile){document.body.classList.toggle('preview-open');document.getElementById('previewDock').classList.remove('hidden');}
    else{document.body.classList.toggle('preview-hidden');document.getElementById('previewDock').classList.toggle('hidden');}
  };
  async function changePassword(event) {
    event.preventDefault();
    const form=event.currentTarget, status=document.getElementById('passwordStatus');
    const button=form.querySelector('button[type=submit]');
    if(button.disabled)return;
    status.classList.remove('error');
    const current=document.getElementById('currentPassword').value;
    const password=document.getElementById('newPassword').value;
    const confirmation=document.getElementById('confirmPassword').value;
    if(password!==confirmation){status.textContent='Die neuen Passwörter stimmen nicht überein.';status.classList.add('error');document.getElementById('confirmPassword').focus();return;}
    button.disabled=true;status.textContent='Passwort wird geändert …';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
    try{
      const response=await fetch('/admin/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:current,newPassword:password,confirmPassword:confirmation}),signal:controller.signal});
      if(response.status===401)throw new Error('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||'Passwort konnte nicht geändert werden.');
      form.reset();status.textContent='Dein Passwort wurde geändert.';
    }catch(error){status.classList.add('error');status.textContent=error.name==='AbortError'?'Zeitüberschreitung. Prüfe die Verbindung und versuche es erneut.':error.message;}
    finally{clearTimeout(timeout);button.disabled=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
