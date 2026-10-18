(function () {
  'use strict';
  const sections = [
    ['profile','Profil','Name, Bio, Avatar und Badges für dein öffentliches Profil.','Deine Seite'],
    ['links','Links & Socials','Verwalte deine Plattformen und die Reihenfolge deiner Links.'],
    ['design','Design','Farben, Schrift und Kartenstil deiner Seite.'],
    ['background','Hintergrund','Bilder, Videos und Hintergrundfarben.'],
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
