/* Tab title: use the Admin's page title, falling back to the profile name. */
(()=>{
 'use strict';
 const fullTitle=document.title;
 if(!fullTitle.trim())return;
 const letters=Array.from(fullTitle),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let timer=null,index=0,direction=1;
 function stop(){clearTimeout(timer);timer=null;document.title=fullTitle;}
 function step(){
  if(document.hidden||motion.matches){stop();return;}
  index+=direction;
  document.title=letters.slice(0,index).join('')||'▏';
  let delay=direction===1?190:110;
  if(index===letters.length){direction=-1;delay=2400;}
  else if(index===0){direction=1;delay=550;}
  timer=setTimeout(step,delay);
 }
 function start(){stop();index=0;direction=1;if(!document.hidden&&!motion.matches)timer=setTimeout(step,1100);}
 document.addEventListener('visibilitychange',start);
 motion.addEventListener('change',start);
 window.addEventListener('pagehide',stop);
 window.addEventListener('pageshow',start);
 start();
})();
