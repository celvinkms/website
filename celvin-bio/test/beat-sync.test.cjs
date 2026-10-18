const test=require('node:test'),assert=require('node:assert/strict');
const {BassPulse,createProfileBeatSync}=require('../public/profile/beat-sync');
const {applyRequestedBeatPlayback}=require('../profile-theme');

test('steady audio has no artificial beat timer',()=>{
 const pulse=new BassPulse();
 for(let t=0;t<2000;t+=16)assert.equal(pulse.update(.02,t),0);
});
test('a bass onset pulses smoothly and decays without retriggering sustained sound',()=>{
 const pulse=new BassPulse();for(let t=0;t<400;t+=16)pulse.update(.004,t);
 const levels=[];for(let t=400;t<1300;t+=16)levels.push(pulse.update(.08,t));
 assert.ok(Math.max(...levels)>.3);assert.ok(Math.max(...levels)<=1);assert.ok(levels.at(-1)<.01);
 pulse.reset();assert.equal(pulse.update(.08,2000),0);
});
test('beat strength follows relative bass attacks at different playback levels',()=>{
 const quiet=new BassPulse(),loud=new BassPulse();
 for(let t=0;t<1200;t+=16){const value=t<400?.006:t<600?.06:.006;assert.ok(Math.abs(quiet.update(value*.3,t)-loud.update(value,t))<.001);}
});
test('missing Web Audio support leaves native audio alone',()=>{
 assert.equal(createProfileBeatSync({},{}),null);
});
test('quieter playback is backed up once without changing the song or later volume edits',async()=>{
 const config={audio_volume:.35,audio_url:'/profile/nobu-start-64-soft-v2.mp3',username:'keep',bg_video_url:'/profile/pinterest-background.mp4'};
 const snapshots=[];let released=0;
 const client={async query(sql,args){if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));return {rows:[]};},release(){released++;}};
 await applyRequestedBeatPlayback({connect:async()=>client});
 assert.equal(config.audio_volume,.3);assert.equal(snapshots[0].audio_volume,.35);
 assert.equal(config.audio_url,'/profile/nobu-start-64-soft-v2.mp3');assert.equal(config.username,'keep');assert.equal(config.bg_video_url,'/profile/pinterest-background.mp4');
 config.audio_volume=.12;await applyRequestedBeatPlayback({connect:async()=>client});
 assert.equal(config.audio_volume,.12);assert.equal(snapshots.length,1);assert.equal(released,2);
});
test('a failed volume update rolls back and releases its transaction',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedBeatPlayback({connect:async()=>client}),/database unavailable/);
 assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});
