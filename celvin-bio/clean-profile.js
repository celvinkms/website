const {renderPresence}=require('./discord-presence');
const {renderDiscordBadges}=require('./discord-badges');
const {youtubePlayer}=require('./profile-theme');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const color=(v,f)=>/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(v||'')?v:f;
const clamp=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
// Identity, soundtrack, links and uploaded media continue to come from the admin.
function renderCleanProfile(c,{links='',badges=''}={}){
 const name=esc(c.username||'sorrow'),presence=renderPresence(c),entry=c.entry_enabled!==false;
 const nativeBackground=Boolean((c.bg_type==='image'&&c.bg_image_url)||(c.bg_type==='video'&&c.bg_video_url));
 const atmosphere=nativeBackground?'':'<div class="moon"></div><div class="fog fog-one"></div><div class="fog fog-two"></div><div class="horizon"></div>';
 const texture=nativeBackground?'':'<div class="film-grain" aria-hidden="true"></div><div class="vignette" aria-hidden="true"></div>';
 const tabTitle=esc(c.meta_title||c.username||'sorrow');
 const customIcon=typeof c.favicon_url==='string'&&(/^(?:https?:\/\/|\/(?!\/)|data:image\/(?:png|jpeg|webp|gif|svg\+xml|x-icon)[;,])/i.test(c.favicon_url))?c.favicon_url:'';
 const favicon=esc(customIcon||'/profile/bunny-tab.jpg?v=tab-2');
 const backgroundCss=c.bg_type==='gradient'?'linear-gradient('+clamp(c.bg_gradient_angle??135,135,0,360)+'deg,'+color(c.bg_gradient_from,'#050505')+','+color(c.bg_gradient_to,'#101014')+')':color(c.bg_color,'#050505');
 const sceneStyle='--scene-bg:'+backgroundCss+';--scene-dim:'+clamp(c.bg_overlay_opacity??.3,.3,0,1)+';--scene-blur:'+clamp(c.bg_blur_amount??0,0,0,20)+'px';
 const entryHex=color(c.entry_bg_color,'#050505').slice(1);
 const entryRgb=(entryHex.length===3?[...entryHex].map(x=>x+x).join(''):entryHex).match(/../g).map(x=>parseInt(x,16)).join(',');
 const entryStyle='--entry-rgb:'+entryRgb+';--entry-opacity:'+clamp(c.entry_bg_opacity??.35,.35,0,1)+';--entry-blur:'+clamp(c.entry_bg_blur??0,0,0,20)+'px;--entry-color:'+color(c.entry_text_color,'#eeeeee')+';--entry-size:'+clamp(c.entry_text_size??22,22,14,72)+'px';
 const entryType=c.entry_bg_type||(c.entry_bg_image?'image':'inherit');
 const entryMedia=entryType==='video'&&c.entry_bg_video?'<video class="entry-media" src="'+esc(c.entry_bg_video)+'" autoplay muted loop playsinline preload="auto"></video>':entryType==='image'&&c.entry_bg_image?'<img class="entry-media" src="'+esc(c.entry_bg_image)+'" alt="">':'';
 const avatar=c.avatar_type==='image'&&c.avatar_url?'<img src="'+esc(c.avatar_url)+'" width="96" height="96" alt="Profilbild von '+name+'">':'<span aria-hidden="true">'+esc(c.avatar_emoji||'♡')+'</span>';
 const background=c.bg_type==='image'&&c.bg_image_url?'<img src="'+esc(c.bg_image_url)+'" alt="">':c.bg_type==='video'&&c.bg_video_url?'<video src="'+esc(c.bg_video_url)+'" autoplay muted loop playsinline preload="auto"></video>':c.bg_use_avatar!==false?'<img src="'+esc(c.avatar_url||'/profile/grunge-avatar.jpg')+'" alt="">':'';
 const music=youtubePlayer(c).replace('?playsinline=1','?enablejsapi=1&playsinline=1');
 const audio=!music&&c.audio_url?'<audio preload="auto" '+(c.audio_loop?'loop ':'')+'src="'+esc(c.audio_url.startsWith('data:')?'/audio':c.audio_url)+'"></audio>':'';
 const subtitle=[c.pronouns,c.bio].filter(Boolean).join(' / ')||'x / kill';
 const eye='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
 const soundIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
 const player=(music||audio)?[
  '<section class="soundtrack" aria-label="Musik-Player"><div class="player-top"><span class="player-caption">ON REPEAT</span><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>',
  '<div class="player-main"><button type="button" class="music-toggle" aria-label="Musik abspielen" aria-pressed="false"><svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7Z"/></svg><svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg></button><span class="song-copy"><strong>'+esc(c.audio_title||'Mein Soundtrack')+'</strong><span data-player-state>Bereit zum Abspielen</span></span></div>',
  '<div class="seek-row"><span data-current-time>0:00</span><label class="sr-only" for="musicSeek">Wiedergabeposition</label><input id="musicSeek" type="range" min="0" max="100" step="0.1" value="0" disabled><span data-duration>–:––</span></div>',
  '<div class="player-bottom"><span class="player-source">'+(music?'YOUTUBE AUDIO':'PROFILE AUDIO')+'</span><label class="volume-control" for="musicVolume">'+soundIcon+'<span class="sr-only">Lautstärke</span><input id="musicVolume" type="range" min="0" max="100" value="'+Math.round(clamp(c.audio_volume??.5,.5,0,1)*100)+'"></label></div><div class="soundtrack-player">'+(music||audio)+'</div></section>'
 ].join(''):'';
 return [
 '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><title>'+tabTitle+'</title><link rel="icon" href="'+favicon+'"><meta name="description" content="'+esc(c.bio)+'"><meta property="og:title" content="'+name+'"><meta property="og:description" content="'+esc(c.bio)+'"><link rel="preload" href="/profile/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/profile/fonts/grenze-gotisch-500-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/profile/fonts/pirata-one-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/profile/discord-badges.css?v=badges-12"><link rel="stylesheet" href="/profile/discord-presence.css?v=discord-live-15"><link rel="stylesheet" href="/profile/clean.css?v=title-9"></head>',
 '<body class="clean-profile grunge-emo'+(presence?' discord-live-enabled':'')+(entry?' entry-pending':'')+(nativeBackground?' native-background':'')+'">',
 entry?'<button type="button" id="enterProfile" class="entry-screen" style="'+entryStyle+'" aria-label="Profil öffnen und Musik starten">'+entryMedia+'<span>'+esc(c.entry_text||'click')+'</span></button><noscript><style>.entry-screen{display:none!important}.entry-pending .profile-stage{visibility:visible!important;opacity:1!important}.reveal{opacity:1!important;filter:none!important;transform:none!important}</style></noscript>':'',
 '<div class="ambient" style="'+sceneStyle+'" aria-hidden="true">'+background+atmosphere+'</div><canvas id="ashCanvas" aria-hidden="true"></canvas>'+texture+'<div id="cursorGlow" aria-hidden="true"></div>',
 '<header class="site-chrome"><button id="shareProfile" class="quiet-button" aria-label="Profil-Link kopieren" data-tooltip="Link kopieren"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button></header>',
 '<main class="profile-stage"><article class="identity-card"><div class="identity"><div class="portrait reveal" style="--order:0">'+avatar+'</div><div class="identity-copy"><div class="name-line reveal" style="--order:1"><h1 data-title="'+name+'">'+name+'</h1></div><p class="profile-subline reveal" style="--order:2"><span class="sr-only">'+esc(subtitle)+'</span><span class="typewriter" aria-hidden="true">'+esc(subtitle)+'</span></p><div class="badges reveal" style="--order:3">'+badges+'</div>'+(presence?'':renderDiscordBadges(c.discord_badges))+'</div></div>',
 presence?'<div class="presence-wrap reveal" style="--order:4">'+presence+'</div>':'',
 links?'<nav class="connections reveal" style="--order:5" aria-label="Social Links"><div class="socials">'+links+'</div></nav>':'',
 '<div class="player-wrap reveal" style="--order:6">'+player+'</div>',
 c.show_views!==false?'<p class="visitors reveal" style="--order:7" aria-label="'+esc(Number(c.views)||0)+' Profilaufrufe">'+eye+'<span>'+new Intl.NumberFormat('de-DE').format(Number(c.views)||0)+'</span></p>':'',
 '</article></main><footer class="site-footer"><span class="footer-mark">✦</span></footer><div id="copyStatus" role="status" aria-live="polite"></div><script src="/profile/beat-sync.js?v=beat-1"></script><script src="/profile/clean.js?v=beat-2"></script><script src="/profile/discord-presence.js?v=discord-live-15"></script><script src="/profile/nocturne.js?v=nocturne-1"></script><script src="/profile/tab-title.js?v=tab-2"></script></body></html>'
 ].join('');
}
module.exports={renderCleanProfile};
