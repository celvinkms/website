const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {renderReferenceProfile}=require('../reference-profile');

test('love category keeps celvin beside mey and hides Mey Discord details',()=>{
  const html=renderReferenceProfile({username:'celvin',avatar_type:'image',avatar_url:'/profile/profile-2026-10-27.jpg'});
  const love=html.slice(html.indexOf('<section class="love-category"'),html.indexOf('</section>',html.indexOf('<section class="love-category"')));
  assert.match(love,/id="loveTitle">love<\/h2>/);
  assert.ok(love.indexOf('data-open="profile"')<love.indexOf('data-open="mey"'));
  assert.match(love,/mey-profile-v2\.png/);
  assert.ok(!love.includes('data-open="marlo"'));
  assert.ok(!love.includes('data-open="atakan"'));
  assert.doesNotMatch(html,/mysme|510575054275346462/);
  assert.ok(fs.statSync(path.join(__dirname,'../public/profile/mey-profile-v2.png')).size>0);
});
