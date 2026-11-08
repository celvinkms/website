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
  const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
  const heart='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const profileCard=(kind,label,picture,caption,badge='')=>'<button type="button" class="profile-orbit" data-open="'+kind+'" aria-haspopup="dialog" aria-controls="'+kind+'Dialog" aria-label="Profil von '+label+' öffnen"><span class="portrait">'+picture+'</span><span class="card-copy"><span class="name-with-badge"><strong>'+label+'</strong>'+badge+'</span><span class="handle">'+caption+'</span></span><span class="card-arrow">'+arrow+'</span></button>';
  const avatar=c.avatar_type==='image'&&c.avatar_url
    ? '<img src="'+esc(c.avatar_url)+'" width="96" height="96" alt="Profilbild von '+name+'">'
    : '<span class="avatar-emoji" aria-hidden="true">'+esc(c.avatar_emoji||'✦')+'</span>';
  const celvinCard=profileCard('profile',name,avatar,'@'+name);
  const marloId='1436267677126627411';
  const marloAvatar='<img src="/profile/marlo-profile.png" width="188" height="188" alt="Profilbild von marlo">';
  const marloDiscord='https://discord.com/users/'+marloId;
  const marloCard=profileCard('marlo','marlo',marloAvatar,'discord / marlo');
  const atakanAvatar='<img src="/profile/atakan-profile.png" width="188" height="188" alt="Profilbild von atakan">';
  const atakanId='436187876770709505';
  const atakanDiscord='https://discord.com/users/'+atakanId;
  const atakanNitro=renderDiscordBadges(['nitro']);
  const atakanCard=profileCard('atakan','atakan',atakanAvatar,'discord / 42 atakan','<img src="/profile/discord-badges/nitro.png" width="18" height="18" alt="Nitro-Badge">');
  const meyAvatar='<img src="/profile/mey-profile-v2.png" width="188" height="188" alt="Profilbild von mey">';
  const meyCard=profileCard('mey','mey',meyAvatar,'my favorite person');
  const entry=c.entry_enabled!==false;
  const presence=renderPresence(c);
  const music=youtubePlayer(c).replace('?playsinline=1','?enablejsapi=1&playsinline=1');
  const audio=!music&&c.audio_url
    ? '<audio preload="auto" '+(c.audio_loop?'loop ':'')+'src="'+esc(c.audio_url.startsWith('data:')?'/audio':c.audio_url)+'"></audio>'
    : '';
  const player=(music||audio)?[
    '<section class="soundtrack" aria-label="Musik-Player">',
    '<button type="button" class="music-toggle" aria-label="Musik abspielen" aria-pressed="false"><span class="play-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7Z"/></svg></span><span class="pause-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM14 5h4v14h-4z"/></svg></span></button>',
    '<div class="song-copy"><strong>'+esc(c.audio_title||'Mein Soundtrack')+'</strong><span data-player-state>Bereit</span></div>',
    '<div class="seek-row"><span data-current-time>0:00</span><label class="sr-only" for="musicSeek">Wiedergabeposition</label><input id="musicSeek" type="range" min="0" max="100" step="0.1" value="0" disabled><span data-duration>–:––</span></div>',
    '<label class="volume-control" for="musicVolume"><span class="sr-only">Lautstärke</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg><input id="musicVolume" type="range" min="0" max="100" value="'+Math.round(Math.max(0,Math.min(1,Number(c.audio_volume??.08)))*100)+'"></label>',
    '<div class="soundtrack-player">'+(music||audio)+'</div>',
    '</section>'
  ].join(''):'';
  const socialCount=Array.isArray(c.links)?c.links.length:0;
  const favicon=esc(c.favicon_url||'/profile/bunny-tab.jpg?v=tab-2');
  return [
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>'+esc(c.meta_title||'celvin.rip')+'</title><link rel="icon" href="'+favicon+'">'+renderProfileMeta(c,publicOrigin,{compact:true}),
    '<link rel="preload" href="/profile/cat-background-v1.png" as="image">',
    '<link rel="preload" href="/profile/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="stylesheet" href="/profile/discord-badges.css?v=badges-12"><link rel="stylesheet" href="/profile/discord-presence.css?v=discord-live-15"><link rel="stylesheet" href="/profile/modern.css?v=1"></head>',
    '<body class="reference-profile grunge-emo'+(entry?' entry-pending':'')+'">',
    entry?'<button type="button" id="enterProfile" class="entry-screen" aria-label="Profil öffnen und Musik starten" disabled><span class="entry-brand">celvin.rip<span>✦</span></span><span class="entry-title">come on <em>in.</em></span><span class="boot-lines"><span>a little music.</span><span>a few favorite people.</span><span>a place to stay.</span><span class="boot-proceed"><span>click to proceed '+arrow+'</span></span></span><span class="boot-corner">made for the moments in between.</span></button>':'',
    '<div class="ambient" aria-hidden="true"></div>',
    '<div class="profile-stage">',
    '<header class="topline"><h1 class="site-title"><a class="wordmark" href="/" aria-label="celvin.rip Startseite">celvin.rip<span aria-hidden="true">✦</span></a></h1><nav class="page-nav" aria-label="Bereiche"><a href="#loveTitle">love</a><a href="#friendsTitle">friends</a><button type="button" data-open="contact">links '+arrow+'</button></nav></header>',
    '<main class="scene"><div class="profile-gallery"><section class="love-category" aria-labelledby="loveTitle"><div class="section-heading"><h2 id="loveTitle">love</h2><span>just us two '+heart+'</span></div><div class="love-pair"><section class="love-person" aria-label="'+name+'">'+celvinCard+'</section><section class="love-person" aria-label="mey">'+meyCard+'</section></div></section><section class="friends-category" aria-labelledby="friendsTitle"><div class="section-heading"><h2 id="friendsTitle">friends</h2><span>the inner circle</span></div><div class="friends-pair">'+marloCard+atakanCard+'</div></section></div></main>',
    '<footer class="taskbar"><span class="taskbar-domain">celvin.rip <span>© 2026</span></span><div class="tab-group"><button type="button" class="tab-label" id="tabToggle" aria-expanded="false" aria-controls="tabMenu">profiles <span aria-hidden="true">↗</span></button><div class="tab-menu" id="tabMenu" hidden><button type="button" data-open="profile">'+name+'</button><button type="button" data-open="mey">mey</button><button type="button" data-open="marlo">marlo</button><button type="button" data-open="atakan">atakan</button><button type="button" data-open="contact">links</button></div></div><span class="footer-time">local time <time id="systemClock" class="clock"></time></span></footer>',
    '<div class="music-dock">'+player+'</div>',
    '<div class="dialog-backdrop" id="dialogBackdrop" hidden></div>',
    '<section class="dialog-panel" id="profileDialog" role="dialog" aria-modal="true" aria-labelledby="profileTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">×</button><p class="dialog-eyebrow">CELVIN.RIP / PROFILE</p><div class="dialog-profile-head"><span class="dialog-avatar">'+avatar+'</span><div><h2 id="profileTitle">'+name+'</h2><p>@'+name+'</p></div></div><p class="dialog-bio">'+bio+'</p><div class="dialog-badges">'+badges+renderDiscordBadges(c.discord_badges)+'</div>'+presence+'<button type="button" class="dialog-action" data-open="contact">open channels ↗</button></section>',
    '<section class="dialog-panel" id="marloDialog" role="dialog" aria-modal="true" aria-labelledby="marloTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">×</button><p class="dialog-eyebrow">CELVIN.RIP / PROFILE</p><div class="dialog-profile-head"><span class="dialog-avatar">'+marloAvatar+'</span><div><h2 id="marloTitle">marlo</h2><p>discord / marlo</p></div></div><a class="dialog-action" href="'+marloDiscord+'" target="_blank" rel="noopener noreferrer">open discord ↗</a></section>',
    '<section class="dialog-panel" id="atakanDialog" role="dialog" aria-modal="true" aria-labelledby="atakanTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">×</button><p class="dialog-eyebrow">CELVIN.RIP / PROFILE</p><div class="dialog-profile-head"><span class="dialog-avatar">'+atakanAvatar+'</span><div><h2 id="atakanTitle">atakan</h2><p>discord / 42 atakan</p></div></div><div class="dialog-badges">'+atakanNitro+'<span class="badge-caption">nitro</span></div><a class="dialog-action" href="'+atakanDiscord+'" target="_blank" rel="noopener noreferrer">open discord ↗</a></section>',
    '<section class="dialog-panel" id="meyDialog" role="dialog" aria-modal="true" aria-labelledby="meyTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">×</button><p class="dialog-eyebrow">CELVIN.RIP / LOVE</p><div class="dialog-profile-head"><span class="dialog-avatar">'+meyAvatar+'</span><div><h2 id="meyTitle">mey</h2><p>love</p></div></div></section>',
    '<section class="dialog-panel" id="contactDialog" role="dialog" aria-modal="true" aria-labelledby="contactTitle" hidden><button type="button" class="dialog-close" data-close aria-label="Schließen">×</button><p class="dialog-eyebrow">CELVIN.RIP / CONTACT</p><h2 id="contactTitle">open channels</h2><p class="dialog-summary">'+socialCount+' '+(socialCount===1?'link':'links')+'</p><nav class="socials" aria-label="Social Links">'+links+'</nav></section>',
    '<div id="copyStatus" role="status" aria-live="polite"></div>',
    '</div>',
    '<script src="/profile/clean.js?v=quiet-entry-1"></script><script src="/profile/discord-presence.js?v=discord-live-15"></script><script src="/profile/reference.js?v=modern-1"></script>',
    '<noscript><style>body.entry-pending{overflow:auto}.entry-screen{display:none!important}.profile-stage{visibility:visible!important}</style></noscript>',
    '</body></html>'
  ].join('');
}

module.exports={renderReferenceProfile};
