(()=>{
  'use strict';
  const backdrop=document.getElementById('dialogBackdrop');
  const panels={profile:document.getElementById('profileDialog'),contact:document.getElementById('contactDialog')};
  const tabToggle=document.getElementById('tabToggle');
  const tabMenu=document.getElementById('tabMenu');
  let active=null;
  let returnFocus=null;

  function closeTabs(){
    tabMenu.hidden=true;
    tabToggle.setAttribute('aria-expanded','false');
  }
  function openPanel(kind){
    const panel=panels[kind];
    if(!panel)return;
    if(!active)returnFocus=document.activeElement;
    Object.values(panels).forEach(item=>item.hidden=true);
    panel.hidden=false;
    backdrop.hidden=false;
    active=panel;
    closeTabs();
    panel.querySelector('[data-close]')?.focus();
  }
  function closePanel(){
    if(!active)return;
    active.hidden=true;
    active=null;
    backdrop.hidden=true;
    returnFocus?.focus();
    returnFocus=null;
  }
  tabToggle.addEventListener('click',()=>{
    const next=tabMenu.hidden;
    tabMenu.hidden=!next;
    tabToggle.setAttribute('aria-expanded',String(next));
  });
  document.getElementById('openProfile')?.addEventListener('click',()=>openPanel('profile'));
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openPanel(button.dataset.open)));
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',closePanel));
  backdrop.addEventListener('click',closePanel);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closePanel();closeTabs();return;}
    if(event.key!=='Tab'||!active)return;
    const focusable=[...active.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(el=>el.getClientRects().length);
    if(!focusable.length)return;
    if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}
  });
  document.addEventListener('click',event=>{
    if(!tabMenu.hidden&&!event.target.closest('.tab-group'))closeTabs();
  });
  const clock=document.getElementById('systemClock');
  function updateClock(){
    clock.textContent=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date());
  }
  updateClock();
  setInterval(updateClock,30000);
})();
