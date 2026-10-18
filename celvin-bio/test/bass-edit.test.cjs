const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedBassEdit}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('stronger bass edit reduces volume once, backs up settings and preserves later admin choices',async()=>{
 const config={username:'keep',password:'keep-hash',_soundtrack_bass_intro_v2:'applied',audio_url:'/profile/future-too-comfortable-bass-intro-v2.mp3',youtube_url:'',audio_volume:.5,bg_video_url:'/profile/pinterest-background.mp4',discord_user_id:'200470371881844737'};
 const snapshots=[];let released=0;
 const client={async query(sql,args){
  if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
  if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
  if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
  return {rows:[]};
 },release(){released++;}};
 await applyRequestedBassEdit({connect:async()=>client});
 assert.equal(config.youtube_url,'');
 assert.equal(config.audio_url,'/profile/future-too-comfortable-bass-intro-v3.mp3');
 assert.equal(config.audio_loop,true);assert.equal(config.audio_volume,.35);
 assert.equal(config.username,'keep');assert.equal(config.password,'keep-hash');
 assert.equal(config.bg_video_url,'/profile/pinterest-background.mp4');assert.equal(config.discord_user_id,'200470371881844737');
 assert.equal(snapshots[0].audio_url,'/profile/future-too-comfortable-bass-intro-v2.mp3');
 assert.equal(snapshots[0].audio_volume,.5);
 assert.equal(config._soundtrack_bass_intro_v3,'applied');
 config.audio_url='/my-next-track.mp3';config.youtube_url='https://youtu.be/later-choice';config.audio_volume=.18;
 await applyRequestedBassEdit({connect:async()=>client});
 assert.equal(config.audio_url,'/my-next-track.mp3');assert.equal(config.youtube_url,'https://youtu.be/later-choice');
 assert.equal(config.audio_volume,.18);
 assert.equal(snapshots.length,1);assert.equal(released,2);
});

test('failed bass edit rolls back and releases its transaction',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedBassEdit({connect:async()=>client}),/database unavailable/);
 assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});

test('public profile renders the processed MP3, entry gate and native controls without YouTube',async()=>{
 const harness=createHarness();
 Object.assign(harness.state.config,{profile_theme:'grunge-emo',youtube_url:'',audio_url:'/profile/future-too-comfortable-bass-intro-v3.mp3',audio_title:'Future — Too Comfortable',audio_volume:.3,audio_loop:true,entry_enabled:true});
 const response=await harness.request('GET','/');
 assert.equal(response.status,200);
 assert.match(response.body,/<audio preload="auto" loop src="\/profile\/future-too-comfortable-bass-intro-v3\.mp3"><\/audio>/);
 assert.match(response.body,/id="enterProfile"/);assert.match(response.body,/id="musicVolume"[^>]+value="30"/);
 assert.doesNotMatch(response.body,/youtube-nocookie\.com\/embed\//);
});
