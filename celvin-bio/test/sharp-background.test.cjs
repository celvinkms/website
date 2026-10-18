const test=require('node:test'),assert=require('node:assert/strict');
const {applyRequestedSharpBackground}=require('../profile-theme');
test('sharp-background setup resets only blur once and preserves later Admin choices',async()=>{
 const config={bg_blur_amount:8,entry_bg_blur:4,bg_image_url:'/original.gif',bg_video_url:'/original.mp4',username:'keep',password:'keep-hash'};
 const snapshots=[];let releases=0;
 const client={async query(sql,args){if(sql.startsWith('SELECT'))return {rows:[{id:7,data:structuredClone(config)}]};if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));return {rows:[]};},release(){releases++;}};
 await applyRequestedSharpBackground({connect:async()=>client});
 assert.equal(config.bg_blur_amount,0);assert.equal(config.entry_bg_blur,0);assert.equal(config.bg_image_url,'/original.gif');assert.equal(config.bg_video_url,'/original.mp4');assert.equal(config.username,'keep');assert.equal(config.password,'keep-hash');assert.equal(snapshots[0].bg_blur_amount,8);
 config.entry_bg_blur=2;await applyRequestedSharpBackground({connect:async()=>client});assert.equal(config.entry_bg_blur,2);assert.equal(snapshots.length,1);assert.equal(releases,2);
});
test('failed sharp-background setup rolls back its settings and releases the client',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw Error('database unavailable');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedSharpBackground({connect:async()=>client}),/database unavailable/);assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});
