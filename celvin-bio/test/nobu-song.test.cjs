const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedNobuSong}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('mild NOBU upgrades the old edit once, preserves quieter volume and renders native audio',async()=>{
 const config={profile_theme:'grunge-emo',username:'keep',password:'keep-hash',_soundtrack_bass_intro_v3:'applied',_soundtrack_nobu_start_63_v1:'applied',audio_url:'/profile/nobu-start-63-overdrive-v1.mp3',audio_title:'negatiiv OG — NOBU',audio_volume:.35,bg_video_url:'/profile/pinterest-background.mp4',discord_user_id:'200470371881844737'};
 const snapshots=[];let released=0;
 const client={async query(sql,args){
  if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
  if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
  if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
  return {rows:[]};
 },release(){released++;}};
 await applyRequestedNobuSong({connect:async()=>client});
 assert.equal(config.audio_url,'/profile/nobu-start-64-soft-v2.mp3');assert.equal(config.audio_title,'negatiiv OG — NOBU');
 assert.equal(config.youtube_url,'');assert.equal(config.audio_volume,.35);assert.equal(config.audio_loop,true);
 assert.equal(config.username,'keep');assert.equal(config.password,'keep-hash');
 assert.equal(config.bg_video_url,'/profile/pinterest-background.mp4');assert.equal(config.discord_user_id,'200470371881844737');
 assert.equal(snapshots[0].audio_url,'/profile/nobu-start-63-overdrive-v1.mp3');assert.equal(snapshots[0].audio_volume,.35);
 assert.equal(config._soundtrack_nobu_start_64_soft_v2,'applied');
 const harness=createHarness();Object.assign(harness.state.config,config);
 const response=await harness.request('GET','/');assert.equal(response.status,200);
 assert.match(response.body,/<audio preload="auto" loop src="\/profile\/nobu-start-64-soft-v2\.mp3"><\/audio>/);
 assert.match(response.body,/negatiiv OG — NOBU/);assert.match(response.body,/id="musicVolume"[^>]+value="35"/);
 config.audio_url='/later.mp3';config.audio_volume=.2;await applyRequestedNobuSong({connect:async()=>client});
 assert.equal(config.audio_url,'/later.mp3');assert.equal(config.audio_volume,.2);assert.equal(snapshots.length,1);assert.equal(released,2);
});

test('failed NOBU update rolls back and releases its transaction',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedNobuSong({connect:async()=>client}),/database unavailable/);
 assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});
