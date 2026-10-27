const {renderPresence}=require('./discord-presence');
const {renderDiscordBadges}=require('./discord-badges');
const {youtubePlayer}=require('./profile-theme');
const {renderProfileMeta}=require('./profile-meta');

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

function renderReferenceProfile(c,{links='',badges='',publicOrigin='https://celvin.rip'}={}){
  const name=esc(c.username||'celvin');
  const bio=esc(c.bio||'');
  const avatar=c.avatar_type==='image'&&c.avatar_url
    ? '<img src="'+esc(c.avatar_url)+'" width="96" height="96" alt="Profilbild von '+name+'">'
    : '<span class="avatar-emoji" aria-hidden="true">'+esc(c.avatar_emoji||'✦')+'</span>';
  const entry=c.entry_enabled!==false;
  const presence=renderPresence(c);
  const music=youtubePlayer(c).replace('?playsinline=1','?enablejsapi=1&playsinline=1');
  const audio=!music&&c.audio_url
    ? '<audio preload="auto" '+(c.audio_loop?'loop ':'')+'src="'+esc(c.audio_url.startsWith('data:')?'/audio':c.audio_url)+'"></audio>'
    : '';
  const player=(music||audio)?[
    '<section class="soundtrack" aria-label="Musik-Player">',
    '<button type="button" class="music-toggle" aria-label="Musik abspielen" aria-pressed="false"><span class="play-symbol" aria-hidden="true">▶</span><span class="pause-symbol" aria-hidden="true">Ⅱ</span></button>',
    '<div class="song-copy"><strong>'+esc(c.audio_title||'Mein Soundtrack')+'</strong><span data-player-state>Bereit</span></div>',
    '<div class="seek-row"><span data-current-time>0:00</span><label class="sr-only" for="musicSeek">Wiedergabeposition</label><input id="musicSeek" type="range" min="0" max="100" step="0.1" value="0" disabled><span data-duration>–:––</span></div>',
    '<label class="volume-control" for="musicVolume"><span class="sr-only">Lautstärke</span><span aria-hidden="true">◖</span><input id="musicVolume" type="range" min="0" max="100" value="'+Math.round(Math.max(0,Math.min(1,Number(c.audio_volume??.5)))*100)+'"></label>',
    '<div class="soundtrack-player">'+(music||audio)+'</div>',
    '</section>'
  ].join(''):'';
  const socialCount=Array.isArray(c.links)?c.links.length:0;
  const favicon=esc(c.favicon_url||'/profile/bunny-tab.jpg?v=tab-2');
  return [
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>'+esc(c.meta_title||'celvin.rip')+'</title><link rel="icon" href="'+favicon+'">'+renderProfileMeta(c,publicOrigin),
    '<link rel="preload" href="/profile/ink-hands-v1.webp" as="image">',
    '<link rel="stylesheet" href="/profile/discord-badges.css?v=badges-12"><link rel="stylesheet" href="/profile/discord-presence.css?v=discord-live-15"><link rel="stylesheet" href="/profile/reference.css?v=7"></head>',
    '<body class="reference-profile grunge-emo'+(entry?' entry-pending':'')+'">',
    entry?'<button type="button" id="enterProfile" class="entry-screen" aria-label="Profil öffnen und Musik starten" disabled><span class="boot-lines"><span>[ OK ] Initializing celvin.rip</span><span>[ OK ] Loading visual subsystem</span><span>[ OK ] Mounting profile module</span><span>[ OK ] Establishing cursor connection</span><span>[ OK ] Background process running</span><span>[ OK ] System ready</span><span class="boot-proceed"><span>[ click to proceed ]</span></span></span><span class="boot-corner">celvin.rip // 01</span></button>':'',
    '<div class="ambient" aria-hidden="true"></div><div class="paper-grain" aria-hidden="true"></div>',
    '<div class="profile-stage">',
    '<header class="topline"><span class="page-count">01 — 01</span><h1>celvin.rip</h1><span class="online-mark">[ online ]</span></header>',
    '<aside class="side-note side-left">archive / 01</aside><aside class="side-note side-right">signal / 2026</aside>',
    '<main class="scene"><p class="scene-kicker">cursor / presence</p><button type="button" class="profile-orbit" id="openProfile" aria-haspopup="dialog" aria-controls="profileDialog" aria-label="Profil von '+name+' öffnen"><span class="orbit-dot"></span><span class="orbit-ring"></span><span class="portrait">'+avatar+'</span><strong>'+name+'</strong><span class="handle">@'+name+'</span><small>PROFILE / SIGNAL</small></button><p class="scene-caption">NOT A PLACE BUT YOU FOUND IT</p></main>',
    '<footer class="taskbar"><div class="tab-group"><button type="button" class="tab-label" id="tabToggle" aria-expanded="false" aria-controls="tabMenu"><strong>Tabs</strong><small>2 links</small></button><div class="tab-menu" id="tabMenu" hidden><button type="button" data-open="profile">profile</button><button type="button" data-open="contact">contact</button></div></div><span class="system-status"><i></i> system online</span><div class="taskbar-spacer"></div><span class="taskbar-domain">celvin.rip © 2026</span><time id="systemClock" class="clock"></time></footer>',
    '<div class="music-dock">'+player+'</div>',
    '<div class="dialog-backdrop" id="dialogBackdrop" hidden></div>',
    '<section class="dialog-panel" id="profileDialog" role="dialog" aria-modal="true" aria-labelledby="profileTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">[ close ]</button><p class="dialog-eyebrow">CELVIN.RIP / PROFILE</p><div class="dialog-profile-head"><span class="dialog-avatar">'+avatar+'</span><div><h2 id="profileTitle">'+name+'</h2><p>@'+name+'</p></div></div><p class="dialog-bio">'+bio+'</p><div class="dialog-badges">'+badges+renderDiscordBadges(c.discord_badges)+'</div>'+presence+'<button type="button" class="dialog-action" data-open="contact">open channels ↗</button></section>',
    '<section class="dialog-panel" id="contactDialog" role="dialog" aria-modal="true" aria-labelledby="contactTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">[ close ]</button><p class="dialog-eyebrow">CELVIN.RIP / CONTACT</p><h2 id="contactTitle">open channels</h2><p class="dialog-summary">'+socialCount+' '+(socialCount===1?'link':'links')+'</p><nav class="socials" aria-label="Social Links">'+links+'</nav></section>',
    '<div id="copyStatus" role="status" aria-live="polite"></div>',
    '</div>',
    '<script src="/profile/clean.js?v=beat-2"></script><script src="/profile/discord-presence.js?v=discord-live-15"></script><script src="/profile/reference.js?v=2"></script>',
    '<noscript><style>.entry-screen{display:none!important}.profile-stage{visibility:visible!important}</style></noscript>',
    '</body></html>'
  ].join('');
}

module.exports={renderReferenceProfile};
