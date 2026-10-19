const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedProfileImage}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('profile image changes once, snapshots the previous config and preserves later Admin choices',async()=>{
 const original={profile_theme:'grunge-emo',username:'suffer',password:'keep-hash',avatar_type:'image',avatar_url:'/profile/grunge-avatar.jpg',audio_url:'/profile/nobu-start-64-soft-v2.mp3',audio_volume:.3,bg_type:'video',bg_video_url:'/profile/pinterest-background.mp4',discord_user_id:'200470371881844737',discord_badges:['nitro']};
 const config=structuredClone(original),snapshots=[];let released=0;
 const client={async query(sql,args){
  if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
  if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
  if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
  return {rows:[]};
 },release(){released++;}};
 await applyRequestedProfileImage({connect:async()=>client});
 assert.deepEqual(config,{...original,_profile_image_halftone_v1:'applied',avatar_type:'image',avatar_url:'/profile/halftone-avatar-v1.png'});
 assert.deepEqual(snapshots,[original]);
 const harness=createHarness();Object.assign(harness.state.config,config);
 const response=await harness.request('GET','/');assert.equal(response.status,200);
 assert.match(response.body,/<img src="\/profile\/halftone-avatar-v1\.png" width="96" height="96" alt="Profilbild von suffer">/);
 config.avatar_url='/later-avatar.jpg';await applyRequestedProfileImage({connect:async()=>client});
 assert.equal(config.avatar_url,'/later-avatar.jpg');assert.equal(snapshots.length,1);assert.equal(released,2);
});

test('failed profile image update rolls back and releases its transaction',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedProfileImage({connect:async()=>client}),/database unavailable/);
 assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});
