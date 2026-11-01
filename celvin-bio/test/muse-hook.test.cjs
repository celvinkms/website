const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedMuseHook}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('supplied MUSE song starts at the requested line and retains the quiet volume',async()=>{
  const original={profile_theme:'grunge-emo',username:'c',password:'keep-hash',avatar_url:'/profile/profile-2026-10-27.jpg',audio_url:'/profile/count-my-bandz-hook-v1.mp3',audio_title:'Rich Amiri — COUNT MY BANDZ',audio_volume:.08,discord_user_id:'200470371881844737'};
  const config=structuredClone(original),snapshots=[];
  const client={async query(sql,args){
    if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
    if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
    if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
    return {rows:[]};
  },release(){}};
  await applyRequestedMuseHook({connect:async()=>client});
  assert.equal(config.audio_url,'/profile/muse-keep-it-under-covers-v1.mp3');
  assert.equal(config.audio_title,'whatsaheart — MUSE');
  assert.equal(config.audio_loop,true);
  assert.equal(config.audio_volume,.08);
  assert.equal(config.avatar_url,original.avatar_url);
  assert.equal(config.password,'keep-hash');
  assert.deepEqual(snapshots,[original]);
  const harness=createHarness();Object.assign(harness.state.config,config);
  const response=await harness.request('GET','/');
  assert.equal(response.status,200);
  assert.match(response.body,/<audio preload="auto" loop src="\/profile\/muse-keep-it-under-covers-v1\.mp3"><\/audio>/);
  config.audio_url='/later-audio.mp3';
  await applyRequestedMuseHook({connect:async()=>client});
  assert.equal(config.audio_url,'/later-audio.mp3');
  assert.equal(snapshots.length,1);
});
