const {youtubePlayer}=require('./profile-theme');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderCleanProfile(c,{links,badges}){
 const name=esc(c.username||'username');
 const avatar=c.avatar_type==='image'&&c.avatar_url?`<img src="${esc(c.avatar_url)}" alt="Profilbild von ${name}">`:`<span>${esc(c.avatar_emoji||'♡')}</span>`;
 const status={online:'Online',idle:'Abwesend',dnd:'Nicht stören',offline:'Offline'}[c.status]||'Offline';
 const background=c.bg_type==='image'&&c.bg_image_url?`<img src="${esc(c.bg_image_url)}" alt="">`:c.bg_type==='video'&&c.bg_video_url?`<video src="${esc(c.bg_video_url)}" autoplay muted loop playsinline></video>`:'';
 const music=youtubePlayer(c);
 const audio=!music&&c.audio_url?`<audio controls ${c.audio_loop?'loop':''} src="${esc(c.audio_url.startsWith('data:')?'/audio':c.audio_url)}"></audio>`:'';
 return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090c"><title>${name} · celvin.rip</title><meta name="description" content="${esc(c.bio)}"><meta property="og:title" content="${name} · celvin.rip"><meta property="og:description" content="${esc(c.bio)}"><link rel="stylesheet" href="/profile/clean.css?v=studio-2"></head>
 <body class="clean-profile grunge-emo"><div class="ambient" aria-hidden="true">${background}<div></div><div></div></div>
 <header class="site-bar"><a href="/" class="wordmark">celvin<span>.rip</span></a><button id="shareProfile" class="quiet-button" aria-label="Profil-Link kopieren">Link kopieren <span>↗</span></button></header>
 <main class="profile-stage"><article class="identity-card"><div class="card-topline"><span>PERSONAL SPACE</span><span class="status"><i data-status="${esc(c.status||'offline')}"></i>${status}</span></div>
 <div class="identity"><div class="portrait">${avatar}</div><div class="identity-copy"><div class="name-line"><h1>${name}</h1></div>${c.pronouns?`<p class="pronouns">${esc(c.pronouns)}</p>`:''}<p class="bio">${esc(c.bio||'').replace(/\n/g,'<br>')}</p><div class="badges">${badges}</div></div></div>
 ${links?`<div class="connections"><div class="section-label">FIND ME ONLINE <span>↗</span></div><div class="socials">${links}</div></div>`:''}
 ${music||audio?`<details class="soundtrack"><summary><span class="record" aria-hidden="true">♫</span><span class="song-copy"><small>ON REPEAT</small><strong>${esc(c.audio_title||'Mein Soundtrack')}</strong></span><span class="listen">Anhören <span>↗</span></span></summary><div class="soundtrack-player">${music||audio}</div></details>`:''}
 <footer class="card-footer"><span>@${name}</span><span>stay a little longer.</span></footer></article></main>
 <footer class="site-footer"><span>ONE SPACE. ALL OF ME.</span><span>celvin.rip</span></footer><div id="copyStatus" role="status" aria-live="polite"></div><script src="/profile/clean.js?v=studio-2"></script></body></html>`;
}
module.exports={renderCleanProfile};
