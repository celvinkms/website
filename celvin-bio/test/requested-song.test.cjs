const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedSong}=require('../profile-theme');
test('requested song is backed up once, preserves volume and identity, and allows later changes',async()=>{
 const config={username:'keep',password:'keep-hash',youtube_url:'https://youtu.be/8V8s9bg5jok',audio_title:'previous song',audio_volume:.3,bg_video_url:'/profile/pinterest-background.mp4',discord_user_id:'200470371881844737'};const snapshots=[];let released=0;
 const client={async query(sql,args){if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));return {rows:[]};},release(){released++;}};
 await applyRequestedSong({connect:async()=>client});assert.equal(config.youtube_url,'https://www.youtube.com/watch?v=wPhs_tPENDQ');assert.equal(config.audio_title,'Future — Too Comfortable');assert.equal(config.audio_volume,.3);assert.equal(config.username,'keep');assert.equal(config.password,'keep-hash');assert.equal(config.bg_video_url,'/profile/pinterest-background.mp4');assert.equal(config.discord_user_id,'200470371881844737');assert.equal(snapshots[0].audio_title,'previous song');
 config.youtube_url='https://youtu.be/later-choice';await applyRequestedSong({connect:async()=>client});assert.equal(config.youtube_url,'https://youtu.be/later-choice');assert.equal(snapshots.length,1);assert.equal(released,2);
});
test('failed song update rolls back and releases its transaction',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedSong({connect:async()=>client}),/database unavailable/);assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});
