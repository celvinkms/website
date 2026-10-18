/* ATMOSPHERE. Adjust the palette and intensity in the :root CSS variables. */
(()=>{
 'use strict';
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const canvas=document.getElementById('ashCanvas'),ctx=canvas?.getContext('2d');
 const glow=document.getElementById('cursorGlow'),card=document.querySelector('.discord-presence');
 const type=document.querySelector('.typewriter'),fullText=type?.textContent||'';
 let animation=0,typing=0,started=false,width=0,height=0,ash=[],last=0,tilt=null,pointer=null,glowVisible=false;
 function resize(){if(!canvas||!ctx)return;width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);ash=Array.from({length:width<700?15:30},()=>({x:Math.random()*width,y:Math.random()*height,r:.3+Math.random()*.9,s:4+Math.random()*12,a:.08+Math.random()*.23,phase:Math.random()*6.28}));}
 function resetTilt(){tilt=null;if(card){card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');card.style.removeProperty('--lift');}}
 function tick(now){
  if(motion.matches||document.hidden){animation=0;return;}
  const dt=Math.min((now-last)/1000||.016,.05);last=now;
  if(ctx){ctx.clearRect(0,0,width,height);for(const p of ash){p.y-=p.s*dt;p.x+=Math.sin(now/6000+p.phase)*dt*2;if(p.y< -3){p.y=height+3;p.x=Math.random()*width;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(200,191,204,'+p.a+')';ctx.fill();}}
  if(pointer&&fine.matches&&glow){glow.style.transform='translate3d('+(pointer.x-190)+'px,'+(pointer.y-190)+'px,0)';if(!glowVisible){glow.style.opacity='1';glowVisible=true;}pointer=null;}
  if(tilt&&card){card.style.setProperty('--tilt-x',tilt.x+'deg');card.style.setProperty('--tilt-y',tilt.y+'deg');card.style.setProperty('--lift','-3px');tilt=null;}
  animation=requestAnimationFrame(tick);
 }
 function startFrame(){if(!animation&&!document.hidden&&!motion.matches){last=performance.now();animation=requestAnimationFrame(tick);}}
 function typewriter(){clearTimeout(typing);if(!type)return;if(motion.matches||!fullText){type.textContent=fullText;type.classList.remove('typing');return;}let index=0;type.textContent='';type.classList.add('typing');function next(){type.textContent=fullText.slice(0,++index);if(index<fullText.length)typing=setTimeout(next,70);else type.classList.remove('typing');}typing=setTimeout(next,420);}
 function enter(){if(started)return;started=true;typewriter();}
 if(document.body.classList.contains('entry-pending'))window.addEventListener('profile:enter',enter,{once:true});else enter();
 document.addEventListener('pointermove',event=>{if(!fine.matches||motion.matches)return;pointer={x:event.clientX,y:event.clientY};},{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{if(glow)glow.style.opacity='0';glowVisible=false;resetTilt();});
 card?.addEventListener('pointermove',event=>{if(!fine.matches||motion.matches)return;const rect=card.getBoundingClientRect();tilt={x:-(event.clientY-rect.top-rect.height/2)/rect.height*5,y:(event.clientX-rect.left-rect.width/2)/rect.width*5};},{passive:true});
 card?.addEventListener('pointerleave',resetTilt);
 function visibility(){cancelAnimationFrame(animation);animation=0;document.body.classList.toggle('effects-paused',document.hidden);if(document.hidden){clearTimeout(typing);if(type){type.textContent=fullText;type.classList.remove('typing');}}else startFrame();}
 function preference(){resetTilt();clearTimeout(typing);if(type){type.textContent=fullText;type.classList.remove('typing');}cancelAnimationFrame(animation);animation=0;if(ctx)ctx.clearRect(0,0,width,height);if(!motion.matches)startFrame();document.querySelectorAll('.ambient video,.entry-media').forEach(v=>{if(v.tagName!=='VIDEO')return;if(motion.matches)v.pause();else if(!v.closest('.entry-screen[hidden]'))v.play().catch(()=>{});});}
 window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',()=>{cancelAnimationFrame(animation);animation=0;clearTimeout(typing);});window.addEventListener('pageshow',startFrame);motion.addEventListener('change',preference);resize();preference();if(started&&!motion.matches)typewriter();
})();
