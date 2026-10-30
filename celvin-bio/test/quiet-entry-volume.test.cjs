const {test}=require('node:test');
const assert=require('node:assert/strict');
const {applyRequestedQuietEntryVolume}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('first entry starts at 8% and later volume choices survive restarts',async()=>{
  const config={audio_volume:.3,audio_url:'/profile/count-my-bandz-hook-v1.mp3',username:'celvin'};
  const snapshots=[];
  const client={
    async query(sql,args){
      if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
      if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
      if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
      return {rows:[]};
    },
    release(){}
  };
  const pool={connect:async()=>client};
  await applyRequestedQuietEntryVolume(pool);
  assert.equal(config.audio_volume,.08);
  assert.equal(config.audio_url,'/profile/count-my-bandz-hook-v1.mp3');
  assert.equal(snapshots[0].audio_volume,.3);

  const {request,state}=createHarness();
  Object.assign(state.config,config,{profile_theme:'grunge-emo'});
  const page=await request('GET','/');
  assert.match(page.body,/id="musicVolume"[^>]+value="8"/);

  config.audio_volume=.16;
  await applyRequestedQuietEntryVolume(pool);
  assert.equal(config.audio_volume,.16);
  assert.equal(snapshots.length,1);
});

test('an existing quieter setting stays quieter',async()=>{
  const config={audio_volume:.04};
  const client={async query(sql,args){if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));return {rows:[]};},release(){}};
  await applyRequestedQuietEntryVolume({connect:async()=>client});
  assert.equal(config.audio_volume,.04);
});
