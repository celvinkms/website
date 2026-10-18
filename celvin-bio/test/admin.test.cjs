const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createHarness } = require('./harness.cjs');

test('profile save ignores autofilled credentials and preserves the password', async () => {
  const { request, state }=createHarness();
  const result=await request('POST','/admin/save',{username:'updated',newPassword:'accidental',password:'overwrite',confirmPassword:'different'});
  assert.equal(result.status,200);assert.equal(result.body.ok,true);
  assert.equal(state.config.username,'updated');assert.equal(state.config.password,'hash:old-password');
  assert.equal(state.config.newPassword,undefined);
});
test('save and password endpoints reject expired sessions with JSON', async()=>{
  const { request, state }=createHarness();
  for(const url of ['/admin/save','/admin/password']){
    const result=await request('POST',url,{},false);assert.equal(result.status,401);assert.equal(result.body.ok,false);
  }
  assert.equal(state.writes,0);
});
test('database failure returns an actionable save error', async()=>{
  const { request, state }=createHarness();state.fail=true;
  const result=await request('POST','/admin/save',{username:'updated'});
  assert.equal(result.status,500);assert.match(result.body.error,/Datenbank/);assert.equal(state.writes,0);
});
test('password change validates confirmation, length, current password and bcrypt byte limit',async()=>{
  const { request, state }=createHarness();
  const body={currentPassword:'old-password',newPassword:'new-password',confirmPassword:'new-password'};
  for(const change of [{confirmPassword:'wrong'},{newPassword:'short',confirmPassword:'short'},{currentPassword:'wrong'},{newPassword:'🖤'.repeat(20),confirmPassword:'🖤'.repeat(20)}]){
    const result=await request('POST','/admin/password',{...body,...change});assert.ok(result.status>=400);
  }
  assert.equal(state.writes,0);
  const result=await request('POST','/admin/password',body);
  assert.equal(result.status,200);assert.equal(state.config.password,'hash:new-password');assert.equal(state.config.username,'celvin');
});
test('dashboard renders and every inline script parses',async()=>{
  const { request }=createHarness();const result=await request('GET','/admin/dashboard');
  assert.equal(result.status,200);assert.match(result.body,/editor\.css/);assert.match(result.body,/passwordForm/);
  assert.doesNotMatch(result.body,/V6 Visual Overdrive|v6-heroX|Control Room/);
  for(const [index,match] of [...result.body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].entries()){
    new vm.Script(match[1],{filename:'inline-'+index+'.js'});
  }
});
