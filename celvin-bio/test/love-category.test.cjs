const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {renderReferenceProfile}=require('../reference-profile');

test('love and friends are separate groups with the requested people',()=>{
  const html=renderReferenceProfile({username:'celvin',avatar_type:'image',avatar_url:'/profile/profile-2026-10-27.jpg'});
  const loveStart=html.indexOf('<section class="love-category"');
  const friendsStart=html.indexOf('<section class="friends-category"');
  const mainEnd=html.indexOf('</main>',friendsStart);
  assert.ok(loveStart>=0&&friendsStart>loveStart&&mainEnd>friendsStart);
  const love=html.slice(loveStart,friendsStart);
  const friends=html.slice(friendsStart,mainEnd);
  assert.match(love,/aria-labelledby="loveTitle"/);
  assert.match(love,/<h2\b[^>]*\bid="loveTitle"[^>]*>\s*love\s*<\/h2>/);
  assert.deepEqual([...love.matchAll(/data-open="([^"]+)"/g)].map(match=>match[1]),['profile','mey']);
  assert.match(love,/mey-profile-v2\.png/);
  assert.match(friends,/aria-labelledby="friendsTitle"/);
  assert.match(friends,/<h2\b[^>]*\bid="friendsTitle"[^>]*>\s*friends\s*<\/h2>/);
  assert.deepEqual([...friends.matchAll(/data-open="([^"]+)"/g)].map(match=>match[1]),['marlo','atakan']);
  assert.doesNotMatch(html,/mysme|510575054275346462/);
  assert.ok(fs.statSync(path.join(__dirname,'../public/profile/mey-profile-v2.png')).size>0);
  assert.match(html,/cat-background-v1\.png/);
  assert.ok(fs.statSync(path.join(__dirname,'../public/profile/cat-background-v1.png')).size>0);
});
