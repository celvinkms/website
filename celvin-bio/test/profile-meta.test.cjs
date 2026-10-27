const test=require('node:test'),assert=require('node:assert/strict');
const {renderProfileMeta}=require('../profile-meta');
const {createHarness}=require('./harness.cjs');

test('Discord crawler gets a compact image preview for the current profile',async()=>{
 const harness=createHarness();Object.assign(harness.state.config,{profile_theme:'grunge-emo',username:'suffer',pronouns:'my',bio:'obsession',entry_enabled:true});
 const response=await harness.request('GET','/',{},false,{headers:{host:'celvin.rip','x-forwarded-proto':'https','user-agent':'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'}});
 assert.equal(response.status,200);
 const head=response.body.split('</head>')[0];
 for(const fragment of ['property="og:type" content="website"','property="og:title" content="suffer"','property="og:description" content="my / obsession"','property="og:url" content="https://celvin.rip/"','property="og:image" content="https://celvin.rip/profile/profile-2026-10-27.jpg?v=compact-1"','property="og:image:type" content="image/jpeg"','property="og:image:width" content="736"','property="og:image:height" content="736"','name="twitter:card" content="summary"','name="theme-color" content="#8a74b8"'])assert.ok(head.includes(fragment),fragment);
 assert.equal((head.match(/property="og:image"/g)||[]).length,1);
 assert.equal((head.match(/name="theme-color"/g)||[]).length,1);
 assert.ok(response.body.includes('id="enterProfile"'));
 assert.equal(harness.state.config.username,'suffer');
});

test('preview metadata respects Admin text, canonical domain and safely escapes attributes',()=>{
 const html=renderProfileMeta({username:'fallback',bio:'fallback',meta_title:'a "title" <3',meta_description:'line one\nline two & more',canonical_url:'https://example.com/profile#section'});
 assert.ok(html.includes('og:title" content="a &quot;title&quot; &lt;3"'));
 assert.ok(html.includes('og:description" content="line one line two &amp; more"'));
 assert.ok(html.includes('og:url" content="https://example.com/profile"'));
 assert.ok(html.includes('og:image" content="https://example.com/profile/social-preview-v1.png"'));
 assert.ok(!html.includes('#section'));
 const fallback=renderProfileMeta({canonical_url:'javascript:alert(1)'},'https://preview.example.org');
 assert.ok(fallback.includes('og:url" content="https://preview.example.org/"'));
 assert.ok(!fallback.includes('javascript:'));
});
