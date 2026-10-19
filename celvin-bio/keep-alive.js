// One small public HTTP request every five minutes. No fake visitors or assets.
// This can maintain activity while the process runs; it cannot revive a stopped
// instance. Keep the independent external check as a fallback.
const INTERVAL_MS=5*60*1000;

function createKeepAlive({env=process.env,fetchImpl=globalThis.fetch,schedule=setInterval,unschedule=clearInterval,now=()=>new Date(),logger=console}={}){
 const requested=env.KEEP_ALIVE_ENABLED;
 const wanted=requested==='true'||(requested!=='false'&&env.RENDER==='true'&&env.IS_PULL_REQUEST!=='true');
 let target=null;
 if(wanted){
  try{
   const url=new URL(env.KEEP_ALIVE_URL||env.RENDER_EXTERNAL_URL||'https://celvin.rip');
   if(url.protocol==='https:'&&!url.username&&!url.password)target=new URL('/healthz',url);
  }catch{/* Invalid configuration must not crash the website. */}
 }
 const state={enabled:Boolean(target),running:false,intervalSeconds:INTERVAL_MS/1000,lastAttemptAt:null,lastSuccessAt:null,consecutiveFailures:0,lastError:null};
 if(wanted&&!target)state.lastError='invalid-https-url';
 let timer=null,inFlight=false,controller=null;

 async function ping(){
  if(!state.running||inFlight)return false;
  inFlight=true;controller=new AbortController();
  state.lastAttemptAt=now().toISOString();
  const url=new URL(target);url.searchParams.set('check','self-'+state.lastAttemptAt);
  try{
   const response=await fetchImpl(url.href,{
    headers:{'Cache-Control':'no-cache','User-Agent':'celvin-keep-alive/1.0'},
    cache:'no-store',redirect:'error',
    signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])
   });
   if(!response.ok)throw new Error('http-'+response.status);
   const health=await response.json();
   if(health.ok!==true||health.service!=='bio')throw new Error('invalid-health-response');
   state.lastSuccessAt=now().toISOString();state.consecutiveFailures=0;state.lastError=null;
   return true;
  }catch(error){
   if(!state.running)return false;
   state.consecutiveFailures++;
   state.lastError=/^(?:http-\d{3}|invalid-health-response)$/.test(error.message)?error.message:(error.name==='TimeoutError'?'timeout':'network-error');
   logger.warn('[keep-alive] Request failed:',state.lastError);
   return false;
  }finally{inFlight=false;controller=null;}
 }
 function start(){
  if(!state.enabled||state.running)return Promise.resolve(false);
  state.running=true;
  timer=schedule(()=>{void ping();},INTERVAL_MS);timer.unref?.();
  logger.log('[keep-alive] Public health request enabled every five minutes.');
  return ping();
 }
 function stop(){
  state.running=false;
  if(timer!==null)unschedule(timer);
  timer=null;controller?.abort();
 }
 return {start,stop,status:()=>({...state})};
}
module.exports={createKeepAlive};
