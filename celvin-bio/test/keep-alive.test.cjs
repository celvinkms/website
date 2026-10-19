const test=require('node:test'),assert=require('node:assert/strict');
const {createKeepAlive}=require('../keep-alive');
const logger={log(){},warn(){}};
const healthy=()=>({ok:true,json:async()=>({ok:true,service:'bio'})});
function timerHarness(){
 let callback,delay,unref=0,cleared=0;
 return {schedule(fn,ms){callback=fn;delay=ms;return {unref(){unref++;}};},unschedule(){cleared++;},tick:()=>callback(),read:()=>({delay,unref,cleared})};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('Render self-check hits only public health immediately and on the five-minute timer',async()=>{
 const timer=timerHarness(),requests=[];let clock=new Date('2026-10-19T08:00:00Z');
 const monitor=createKeepAlive({env:{RENDER:'true',RENDER_EXTERNAL_URL:'https://site.onrender.com'},...timer,logger,now:()=>clock,fetchImpl:async(url,options)=>{requests.push({url,options});return healthy();}});
 assert.equal(monitor.status().running,false);assert.equal(requests.length,0);
 assert.equal(await monitor.start(),true);
 assert.equal(timer.read().delay,300000);assert.equal(timer.read().unref,1);
 assert.equal(new URL(requests[0].url).pathname,'/healthz');assert.equal(new URL(requests[0].url).origin,'https://site.onrender.com');
 assert.equal(requests[0].options.cache,'no-store');assert.equal(requests[0].options.redirect,'error');assert.ok(requests[0].options.signal instanceof AbortSignal);
 clock=new Date('2026-10-19T08:05:00Z');timer.tick();await settle();
 assert.equal(requests.length,2);assert.notEqual(requests[0].url,requests[1].url);
 assert.equal(monitor.status().lastSuccessAt,clock.toISOString());
 const status=monitor.status();status.lastSuccessAt='changed';assert.notEqual(monitor.status().lastSuccessAt,'changed');
 assert.equal(await monitor.start(),false);assert.equal(requests.length,2);
 monitor.stop();assert.equal(timer.read().cleared,1);assert.equal(monitor.status().running,false);
});

test('slow requests cannot overlap and failures recover on the next interval',async()=>{
 const timer=timerHarness();let resolveFirst,calls=0;
 const monitor=createKeepAlive({env:{RENDER:'true'},...timer,logger,fetchImpl:async()=>{calls++;if(calls===1)return new Promise(resolve=>{resolveFirst=resolve;});return healthy();}});
 const first=monitor.start();timer.tick();assert.equal(calls,1);
 resolveFirst({ok:false,status:503});assert.equal(await first,false);
 assert.equal(monitor.status().consecutiveFailures,1);assert.equal(monitor.status().lastError,'http-503');
 timer.tick();await settle();assert.equal(calls,2);
 assert.equal(monitor.status().lastError,null);assert.equal(monitor.status().consecutiveFailures,0);monitor.stop();
});

test('local development, disabled switches and preview instances make no requests',async()=>{
 for(const env of [{},{RENDER:'true',KEEP_ALIVE_ENABLED:'false'},{RENDER:'true',IS_PULL_REQUEST:'true'},{RENDER:'true',KEEP_ALIVE_URL:'http://localhost:3000'},{RENDER:'true',KEEP_ALIVE_URL:'https://user:secret@example.com'}]){
  let calls=0;const monitor=createKeepAlive({env,logger,fetchImpl:async()=>{calls++;return healthy();},schedule(){throw Error('must not schedule');}});
  assert.equal(await monitor.start(),false);assert.equal(monitor.status().enabled,false);assert.equal(calls,0);
  assert.ok(!JSON.stringify(monitor.status()).includes('secret'));
 }
});

test('non-health responses are failures and shutdown aborts the active request',async()=>{
 const timer=timerHarness();let call=0,signal;
 const monitor=createKeepAlive({env:{RENDER:'true'},...timer,logger,fetchImpl:async(url,options)=>{
  if(++call===1)return {ok:true,json:async()=>({ok:true,service:'different'})};
  signal=options.signal;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('stopped')),{once:true}));
 }});
 assert.equal(await monitor.start(),false);assert.equal(monitor.status().lastError,'invalid-health-response');
 timer.tick();assert.equal(signal.aborted,false);monitor.stop();await settle();
 assert.equal(signal.aborted,true);assert.equal(monitor.status().running,false);
 assert.equal(monitor.status().consecutiveFailures,1);
});
