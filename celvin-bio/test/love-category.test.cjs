const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {renderReferenceProfile}=require('../reference-profile');

test('love category gives celvin and mey separate adjacent panels',()=>{
  const html=renderReferenceProfile({username:'celvin',avatar_type:'image',avatar_url:'/profile/profile-2026-10-27.jpg'});
  const love=html.slice(html.indexOf('<section class="love-category"'),html.indexOf('data-open="atakan"'));
  assert.match(love,/id="loveTitle">love<\/h2>/);
  assert.match(love,/<section class="love-person" aria-labelledby="celvinCategory"><h3 id="celvinCategory">01 \/ celvin<\/h3>/);
  assert.match(love,/<section class="love-person" aria-labelledby="meyCategory"><h3 id="meyCategory">02 \/ mey<\/h3>/);
  assert.ok(love.indexOf('data-open="profile"')<love.indexOf('data-open="mey"'));
  assert.match(love,/mey-profile-v2\.png/);
  assert.ok(!love.includes('data-open="marlo"'));
  assert.ok(!love.includes('data-open="atakan"'));
  assert.doesNotMatch(html,/mysme|510575054275346462/);
  assert.ok(fs.statSync(path.join(__dirname,'../public/profile/mey-profile-v2.png')).size>0);
  assert.match(html,/cat-background-v1\.png/);
  assert.ok(fs.statSync(path.join(__dirname,'../public/profile/cat-background-v1.png')).size>0);
  const css=fs.readFileSync(path.join(__dirname,'../public/profile/reference.css'),'utf8');
  assert.match(css,/\.ambient\{background:linear-gradient[^}]+cat-background-v1\.png/);
});
