const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const text=(value,max)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
function websiteUrl(value){
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url:null;}catch{return null;}
}

// Texts stay editable in Admin > Erweitert (Seitentitel / Beschreibung).
// Replace this versioned PNG when updating the share-banner artwork.
function renderProfileMeta(config,publicOrigin='https://celvin.rip'){
 const origin=websiteUrl(publicOrigin)||new URL('https://celvin.rip');
 const canonical=websiteUrl(config.canonical_url)||new URL('/',origin);
 canonical.hash='';
 const title=text(config.meta_title||config.username||'suffer',100);
 const description=text(config.meta_description||[config.pronouns,config.bio].filter(Boolean).join(' / ')||'WORLD',180);
 const image=new URL('/profile/social-preview-v1.png',canonical).href;
 const alt='Schwarzweiß-Porträt und suffer-Schriftzug auf dunklem Hintergrund';
 const property=(name,value)=>'<meta property="'+name+'" content="'+esc(value)+'">';
 const meta=(name,value)=>'<meta name="'+name+'" content="'+esc(value)+'">';
 return [
  '<link rel="canonical" href="'+esc(canonical.href)+'">',
  meta('description',description),meta('theme-color','#9d5868'),
  property('og:type','website'),property('og:locale','de_DE'),
  property('og:site_name',canonical.hostname),property('og:url',canonical.href),
  property('og:title',title),property('og:description',description),
  property('og:image',image),...(image.startsWith('https:')?[property('og:image:secure_url',image)]:[]),
  property('og:image:type','image/png'),property('og:image:width','1200'),property('og:image:height','630'),property('og:image:alt',alt),
  meta('twitter:card','summary_large_image'),meta('twitter:title',title),meta('twitter:description',description),meta('twitter:image',image),meta('twitter:image:alt',alt)
 ].join('');
}
module.exports={renderProfileMeta};
