const test=require('node:test'),assert=require('node:assert/strict');
const {renderCleanProfile}=require('../clean-profile');
test('clean renderer isolates legacy effects and escapes profile text',()=>{const html=renderCleanProfile({username:'<script>bad</script>',bio:'<img src=x>',profile_theme:'grunge-emo',youtube_url:'https://youtu.be/8V8s9bg5jok'},{links:'',badges:''});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>bad'));assert.ok(html.includes('class="soundtrack"'));assert.ok(html.includes('youtube-nocookie.com/embed/8V8s9bg5jok'));assert.ok(!html.includes('renderV5'));assert.ok(html.includes('/profile/clean.css'));});
test('clean renderer includes configured background without inline script injection',()=>{const html=renderCleanProfile({bg_type:'image',bg_image_url:'https://example.com/a.jpg" onerror="bad()'},{links:'',badges:''});assert.ok(html.includes('a.jpg&quot; onerror=&quot;bad()'));assert.ok(!html.includes('src="https://example.com/a.jpg" onerror='));});

test('entry and background settings render saved values safely',()=>{
 const html=renderCleanProfile({entry_text:'enter <3',entry_text_size:28,entry_bg_color:'#112233',entry_text_color:'#abcdef',entry_bg_image:'https://example.com/entry.jpg',bg_use_avatar:false,bg_type:'gradient',bg_gradient_from:'#123456',bg_gradient_to:'#654321',bg_gradient_angle:90,bg_overlay_opacity:0,bg_blur_amount:0},{links:'',badges:''});
 assert.ok(html.includes('enter &lt;3'));assert.ok(html.includes('--entry-rgb:17,34,51'));assert.ok(html.includes('--entry-size:28px'));assert.ok(html.includes('--scene-bg:linear-gradient(90deg,#123456,#654321)'));assert.ok(html.includes('--scene-dim:0;--scene-blur:0px'));assert.ok(!html.includes('src="/profile/grunge-avatar.jpg"'));
 const disabled=renderCleanProfile({entry_enabled:false},{links:'',badges:''});assert.ok(!disabled.includes('id="enterProfile"'));
});

test('entry media supports GIFs, muted inline MP4 and transparent blur',()=>{
 const html=renderCleanProfile({entry_bg_type:'video',entry_bg_video:'/asset/entry-background/entry_bg_123456789012345678901234',entry_bg_opacity:0,entry_bg_blur:6},{links:'',badges:''});assert.ok(html.includes('class="entry-media"'));assert.ok(html.includes('autoplay muted loop playsinline'));assert.ok(html.includes('--entry-opacity:0;--entry-blur:6px'));
 const gif=renderCleanProfile({entry_bg_type:'image',entry_bg_image:'https://example.com/a.gif'},{links:'',badges:''});assert.ok(gif.includes('class="entry-media" src="https://example.com/a.gif"'));
});
