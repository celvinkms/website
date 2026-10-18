const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedPinterestBackground}=require('../profile-theme');
test('selected Pinterest video is backed up and applied once without changing identity or music',async()=>{
 const config={username:'keep',password:'keep-hash',bg_type:'image',bg_image_url:'/previous.gif',youtube_url:'keep-song',discord_user_id:'200470371881844737'};const snapshots=[];let released=0;
 const client={async query(sql,args){if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));return {rows:[]};},release(){released++;}};
 await applyRequestedPinterestBackground({connect:async()=>client});assert.equal(config.bg_type,'video');assert.equal(config.bg_video_url,'/profile/pinterest-background.mp4');assert.equal(config.bg_blur_amount,0);assert.equal(config.entry_bg_type,'inherit');assert.equal(config.username,'keep');assert.equal(config.password,'keep-hash');assert.equal(config.youtube_url,'keep-song');assert.equal(config.discord_user_id,'200470371881844737');assert.equal(snapshots[0].bg_image_url,'/previous.gif');
 config.bg_video_url='/my-later-video.mp4';await applyRequestedPinterestBackground({connect:async()=>client});assert.equal(config.bg_video_url,'/my-later-video.mp4');assert.equal(snapshots.length,1);assert.equal(released,2);
});
test('failed Pinterest setup rolls back and releases its transaction',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedPinterestBackground({connect:async()=>client}),/database unavailable/);assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});
