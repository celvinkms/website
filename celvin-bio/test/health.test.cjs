const test=require('node:test'),assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
test('public health check bypasses the database and never records a visitor',async()=>{
 const {request,state}=createHarness();state.config.views=42;state.fail=true;
 const result=await request('GET','/healthz',{},false);
 assert.equal(result.status,200);assert.equal(result.body.ok,true);assert.equal(result.body.service,'bio');
 assert.equal(result.headers['Cache-Control'],'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
 assert.equal(result.headers['Cloudflare-CDN-Cache-Control'],'no-store');
 assert.equal(typeof result.body.uptimeSeconds,'number');
 assert.equal(result.body.keepAlive.intervalSeconds,300);assert.equal(result.body.keepAlive.running,false);
 assert.equal(result.body.keepAlive.lastAttemptAt,null);
 assert.equal(state.config.views,42);assert.equal(state.writes,0);
});
