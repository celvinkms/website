const {youtubePlayer}=require('./profile-theme');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderCleanProfile(c,{links,badges}){
 const name=esc(c.username||'username');
 const avatar=c.avatar_type==='image'&&c.avatar_url?`<img src="${esc(c.avatar_url)}" alt="Profilbild von ${name}">`:`<span>${esc(c.avatar_emoji||'♡')}</span>`;
 const status={online:'Online',idle:'Abwesend',dnd:'Nicht stören',offline:'Offline'}[c.status]||'Offline';
 const background=c.bg_type==='image'&&c.bg_image_url?`<img src="${esc(c.bg_image_url)}" alt="">`:c.bg_type==='video'&&c.bg_video_url?`<video src="${esc(c.bg_video_url)}" autoplay muted loop playsinline></video>`:`<img src="${esc(c.avatar_url||'/profile/grunge-avatar.jpg')}" alt="">`;
 const music=youtubePlayer(c).replace("?playsinline=1", "?enablejsapi=1&playsinline=1");
 const audio=!music&&c.audio_url?`<audio controls ${c.audio_loop?'loop':''} src="${esc(c.audio_url.startsWith('data:')?'/audio':c.audio_url)}"></audio>`:'';
 return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#08090c"><title>${name} · celvin.rip</title><meta name="description" content="${esc(c.bio)}"><meta property="og:title" content="${name} · celvin.rip"><meta property="og:description" content="${esc(c.bio)}"><link rel="stylesheet" href="/profile/clean.css?v=noir-4"></head>
 <body class="clean-profile grunge-emo"><div class="ambient" aria-hidden="true">${background}<div></div><div></div></div>
 <main class="profile-stage"><article class="identity-card"><div class="card-topline"><span class="status"><i data-status="${esc(c.status||'offline')}"></i>${status}</span><button id="shareProfile" class="quiet-button" aria-label="Profil-Link kopieren" title="Profil-Link kopieren"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button></div>
 <div class="identity"><div class="portrait">${avatar}</div><div class="identity-copy"><div class="name-line"><h1>${name}</h1></div>${c.pronouns?`<p class="pronouns">${esc(c.pronouns)}</p>`:''}<p class="bio">${esc(c.bio||'').replace(/\n/g,'<br>')}</p><div class="badges">${badges}</div></div></div>
 ${links?`<div class="connections"><div class="socials">${links}</div></div>`:''}
 ${music||audio?`<details class="soundtrack"><summary><span class="record" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="17" rx="3" ry="2.5"/><ellipse cx="17" cy="15" rx="3" ry="2.5"/></svg></span><span class="song-copy"><strong>${esc(c.audio_title||'Mein Soundtrack')}</strong></span><span class="listen" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m8 10 4 4 4-4"/></svg></span></summary><div class="soundtrack-player">${music||audio}</div></details>`:''}
 </article></main>
 <div id="copyStatus" role="status" aria-live="polite"></div><script src="/profile/clean.js?v=noir-4"></script></body></html>`;
}
module.exports={renderCleanProfile};
