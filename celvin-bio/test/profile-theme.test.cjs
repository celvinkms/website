const {test}=require('node:test');
const assert=require('node:assert/strict');
const {GRUNGE_PRESET,applyRequestedTheme,youtubeVideoId,youtubePlayer}=require('../profile-theme');
const {createHarness}=require('./harness.cjs');

test('only supported YouTube video URLs produce an embed ID',()=>{
 for(const url of ['https://www.youtube.com/watch?v=8V8s9bg5jok&list=RD8V8s9bg5jok','https://youtu.be/8V8s9bg5jok','https://m.youtube.com/shorts/8V8s9bg5jok'])assert.equal(youtubeVideoId(url),'8V8s9bg5jok');
 for(const url of ['https://youtube.com.evil.test/watch?v=8V8s9bg5jok','javascript:alert(1)','https://example.com/8V8s9bg5jok','https://youtube.com/watch?v=invalid',''])assert.equal(youtubeVideoId(url),'');
 const html=youtubePlayer(GRUNGE_PRESET);assert.match(html,/youtube-nocookie.com\/embed\/8V8s9bg5jok/);assert.match(html,/autoplay=0/);assert.match(html,/playlist=8V8s9bg5jok/);assert.equal(youtubePlayer({youtube_url:'bad'}),'');
});

test('requested theme is backed up, applied once, and keeps identity and later edits',async()=>{
 let config={username:'keep-me',password:'keep-hash',links:[{platform:'discord',username:'keep-link'}]};
 const snapshots=[];const statements=[];let releases=0;
 const client={async query(sql,args){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:structuredClone(config)}]};if(sql.startsWith('INSERT'))snapshots.push(structuredClone(args[1]));if(sql.startsWith('UPDATE'))Object.assign(config,JSON.parse(args[0]));return {rows:[]};},release(){releases++;}};
 const pool={connect:async()=>client};
 await applyRequestedTheme(pool);
 assert.equal(snapshots.length,1);assert.equal(snapshots[0].profile_theme,undefined);assert.equal(config.username,'keep-me');assert.equal(config.password,'keep-hash');assert.equal(config.links[0].username,'keep-link');assert.equal(config.avatar_url,'/profile/grunge-avatar.jpg');
 config.accent='#123456';await applyRequestedTheme(pool);assert.equal(config.accent,'#123456');assert.equal(snapshots.length,1);assert.equal(releases,2);assert.equal(statements.filter(s=>s==='COMMIT').length,2);
});

test('failed theme application rolls back and releases the connection',async()=>{
 const statements=[];let released=false;
 const client={async query(sql){statements.push(sql);if(sql.startsWith('SELECT'))return {rows:[{id:1,data:{}}]};if(sql.startsWith('UPDATE'))throw new Error('simulated failure');return {rows:[]};},release(){released=true;}};
 await assert.rejects(applyRequestedTheme({connect:async()=>client}),/simulated failure/);assert.equal(statements.at(-1),'ROLLBACK');assert.equal(released,true);
});

test('admin saves validate YouTube links and retain the selected theme',async()=>{
 const {request,state}=createHarness();
 assert.equal((await request('POST','/admin/save',{youtube_url:'https://evil.test/watch?v=8V8s9bg5jok'})).status,400);
 assert.equal((await request('POST','/admin/save',{profile_theme:'unknown'})).status,400);
 assert.equal(state.writes,0);
 const saved=await request('POST','/admin/save',{youtube_url:'https://youtu.be/8V8s9bg5jok',profile_theme:'grunge-emo'});assert.equal(saved.status,200);assert.equal(state.config.youtube_url,GRUNGE_PRESET.youtube_url);
 const page=await request('GET','/');assert.match(page.body,/grunge-emo/);assert.match(page.body,/youtube-nocookie.com\/embed\/8V8s9bg5jok/);
 const admin=await request('GET','/admin/dashboard');assert.match(admin.body,/id="youtube_url"/);assert.match(admin.body,/id="profile_theme"/);
});
