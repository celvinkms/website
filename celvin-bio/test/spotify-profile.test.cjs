const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedCountMyBandz,applyRequestedLocalCountMyBandz}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('new picture and Spotify track replace the old music once',async()=>{
  const original={profile_theme:'grunge-emo',username:'c',password:'keep-hash',avatar_type:'image',avatar_url:'/profile/halftone-avatar-v1.png',audio_url:'/profile/nobu-start-64-soft-v2.mp3',audio_title:'negatiiv OG — NOBU',audio_volume:.3,discord_user_id:'200470371881844737'};
  const config=structuredClone(original),snapshots=[];
  const client={async query(sql,args){
    if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
    if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
    if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
    return {rows:[]};
  },release(){}};
  await applyRequestedCountMyBandz({connect:async()=>client});
  assert.equal(config.avatar_url,'/profile/profile-2026-10-27.jpg');
  assert.equal(config.spotify_url,'https://open.spotify.com/track/3aZcNxiTgOOtyIw5aRxXik');
  assert.equal(config.audio_url,'');
  assert.equal(config.youtube_url,'');
  assert.equal(config.audio_volume,.3);
  assert.equal(config.password,'keep-hash');
  assert.deepEqual(snapshots,[original]);
  config.avatar_url='/later-avatar.jpg';config.spotify_url='';
  await applyRequestedCountMyBandz({connect:async()=>client});
  assert.equal(config.avatar_url,'/later-avatar.jpg');
  assert.equal(config.spotify_url,'');
  assert.equal(snapshots.length,1);
});

test('supplied chorus clip replaces the Spotify card and preserves later edits',async()=>{
  const original={profile_theme:'grunge-emo',username:'c',password:'keep-hash',avatar_type:'image',avatar_url:'/profile/profile-2026-10-27.jpg',spotify_url:'https://open.spotify.com/track/3aZcNxiTgOOtyIw5aRxXik',audio_url:'',audio_title:'Rich Amiri — COUNT MY BANDZ',audio_volume:.3,discord_user_id:'200470371881844737'};
  const config=structuredClone(original),snapshots=[];
  const client={async query(sql,args){
    if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
    if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
    if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
    return {rows:[]};
  },release(){}};
  await applyRequestedLocalCountMyBandz({connect:async()=>client});
  assert.equal(config.spotify_url,'');
  assert.equal(config.audio_url,'/profile/count-my-bandz-hook-v1.mp3');
  assert.equal(config.audio_volume,.3);
  assert.equal(config.avatar_url,original.avatar_url);
  assert.equal(config.password,'keep-hash');
  assert.deepEqual(snapshots,[original]);
  const harness=createHarness();Object.assign(harness.state.config,config);
  const response=await harness.request('GET','/');
  assert.equal(response.status,200);
  assert.match(response.body,/<audio preload="auto" loop src="\/profile\/count-my-bandz-hook-v1\.mp3"><\/audio>/);
  assert.doesNotMatch(response.body,/spotify-dock|open\.spotify\.com\/embed/);
  config.audio_url='/later-audio.mp3';
  await applyRequestedLocalCountMyBandz({connect:async()=>client});
  assert.equal(config.audio_url,'/later-audio.mp3');
  assert.equal(snapshots.length,1);
});
