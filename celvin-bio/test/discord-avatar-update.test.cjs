const {test}=require('node:test');
const assert=require('node:assert/strict');
const {applyRequestedDiscordAvatar}=require('../discord-avatar-update');
test('avatar update saves the previous config and preserves later avatar choices',async()=>{
  const config={avatar_url:'/old.png',audio_volume:.08,username:'c'};
  const snapshots=[];
  const client={async query(sql,args){
    if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};
    if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));
    if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));
    return {rows:[]};
  },release(){}};
  const pool={connect:async()=>client};
  await applyRequestedDiscordAvatar(pool);
  assert.equal(config.avatar_url,'/profile/celvin-discord-v1.png');
  assert.equal(config.avatar_type,'image');
  assert.equal(config.audio_volume,.08);
  assert.equal(config.username,'c');
  assert.equal(snapshots[0].avatar_url,'/old.png');
  config.avatar_url='/later.png';
  await applyRequestedDiscordAvatar(pool);
  assert.equal(config.avatar_url,'/later.png');
  assert.equal(snapshots.length,1);
});
