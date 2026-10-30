const GRUNGE_PRESET = {
  _grunge_setup_v1: 'applied', profile_theme: 'grunge-emo',
  avatar_type: 'image', avatar_url: '/profile/grunge-avatar.jpg', avatar_border: 'square', avatar_glow: false,
  youtube_url: 'https://www.youtube.com/watch?v=8V8s9bg5jok',
  audio_url: '', audio_title: 'whatsaheart — lovesick', spotify_url: '', audio_autoplay: false, audio_loop: true,
  accent: '#9d6678', text_color: '#ded8d7', font: 'Space Grotesk',
  bg_type: 'gradient', bg_color: '#09090b', bg_gradient_from: '#09090b', bg_gradient_to: '#21151b', bg_gradient_angle: '155',
  bg_image_url: '', bg_video_url: '', bg_pattern: 'none', bg_animated: false,
  card_style: 'dark', card_blur: false, card_shadow: true, link_style: 'minimal',
  show_particles: false, cursor_glow: false, feature_flags: {},
  v6_visual_off: true, v5_enabled: false, enter_screen_enabled: false
};

// Apply the explicitly requested setup once. Subsequent admin edits survive restarts.
async function applyRequestedTheme(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current = rows[0];
    if (current && current.data._grunge_setup_v1 !== 'applied') {
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)', ['Vor Grunge-/Emo-Gestaltung', current.data]);
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2', [JSON.stringify(GRUNGE_PRESET), current.id]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

// Apply the owner's sharp-background request once; later Admin edits still win.
async function applyRequestedSharpBackground(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._sharp_background_v1!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor scharfem Hintergrund',current.data]);
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify({_sharp_background_v1:'applied',bg_blur_amount:0,entry_bg_blur:0}),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Use the downloaded, user-selected pin once; preserve subsequent Admin edits.
async function applyRequestedPinterestBackground(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._pinterest_background_1111685489282313182!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor Pinterest-Hintergrund',current.data]);
      const update={_pinterest_background_1111685489282313182:'applied',bg_type:'video',bg_video_url:'/profile/pinterest-background.mp4',bg_use_avatar:false,bg_blur_amount:0,entry_bg_type:'inherit',entry_bg_blur:0};
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

function youtubeVideoId(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    const host = url.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts)\//.test(url.pathname) ? url.pathname.split('/')[2] : '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : '';
  } catch { return ''; }
}

// Switch to the explicitly selected song once; later Admin choices remain intact.
async function applyRequestedSong(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._soundtrack_wPhs_tPENDQ!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor Future – Too Comfortable',current.data]);
      const update={_soundtrack_wPhs_tPENDQ:'applied',youtube_url:'https://www.youtube.com/watch?v=wPhs_tPENDQ',audio_title:'Future — Too Comfortable',audio_url:'',audio_loop:true};
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Apply the stronger bass edit and reduce output volume once; later admin edits win.
async function applyRequestedBassEdit(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._soundtrack_bass_intro_v3!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor stärkerem Beat und leiserer Wiedergabe',current.data]);
      const previousVolume=Number(current.data.audio_volume??.5);
      const quieterVolume=Math.round(Math.max(0,Math.min(1,Number.isFinite(previousVolume)?previousVolume:.5))*70)/100;
      const update={_soundtrack_bass_intro_v3:'applied',youtube_url:'',audio_url:'/profile/future-too-comfortable-bass-intro-v3.mp3',audio_title:'Future — Too Comfortable',audio_loop:true,audio_volume:quieterVolume};
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Switch to the owner's replacement track once, retaining the quieter volume.
async function applyRequestedNobuSong(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._soundtrack_nobu_start_64_soft_v2!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor NOBU ab 1:04 mit milder Sättigung',current.data]);
      const update={_soundtrack_nobu_start_64_soft_v2:'applied',youtube_url:'',audio_url:'/profile/nobu-start-64-soft-v2.mp3',audio_title:'negatiiv OG — NOBU',audio_loop:true};
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Lower playback slightly once; keep the selected song and later Admin edits.
async function applyRequestedBeatPlayback(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._beat_playback_v1!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor leiserem Beat-Sync',current.data]);
      const previous=Number(current.data.audio_volume??.35);
      const volume=Math.round(Math.max(0,Math.min(1,Number.isFinite(previous)?previous:.35))*85)/100;
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify({_beat_playback_v1:'applied',audio_volume:volume}),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Set the owner's uploaded profile image once; later Admin choices survive restarts.
async function applyRequestedProfileImage(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._profile_image_halftone_v1!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor neuem Schwarzweiß-Profilbild',current.data]);
      const update={_profile_image_halftone_v1:'applied',avatar_type:'image',avatar_url:'/profile/halftone-avatar-v1.png'};
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Apply the owner's new picture and Spotify track once, without changing later Admin edits.
async function applyRequestedCountMyBandz(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._profile_count_my_bandz_20261027!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor neuem Profilbild und Spotify-Track',current.data]);
      const update={
        _profile_count_my_bandz_20261027:'applied',
        avatar_type:'image',
        avatar_url:'/profile/profile-2026-10-27.jpg',
        spotify_url:'https://open.spotify.com/track/3aZcNxiTgOOtyIw5aRxXik',
        youtube_url:'',
        audio_url:'',
        audio_title:'Rich Amiri — COUNT MY BANDZ'
      };
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Replace the temporary Spotify embed with the owner's supplied chorus clip once.
async function applyRequestedLocalCountMyBandz(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._count_my_bandz_hook_v1!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor lokalem COUNT MY BANDZ Refrain',current.data]);
      const update={
        _count_my_bandz_hook_v1:'applied',
        spotify_url:'',
        youtube_url:'',
        audio_url:'/profile/count-my-bandz-hook-v1.mp3',
        audio_title:'Rich Amiri — COUNT MY BANDZ',
        audio_loop:true
      };
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify(update),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

// Lower the initial playback level once without raising an already quieter setting.
async function applyRequestedQuietEntryVolume(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._quiet_entry_volume_20261030!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor leiserer Startlautstärke',current.data]);
      const saved=Number(current.data.audio_volume??.5);
      const volume=Math.min(.08,Math.max(0,Math.min(1,Number.isFinite(saved)?saved:.5)));
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify({_quiet_entry_volume_20261030:'applied',audio_volume:volume}),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}

function youtubePlayer(config) {
  const id = youtubeVideoId(config.youtube_url);
  if (!id) return '';
  const repeat = config.audio_loop !== false ? '&loop=1&playlist='+id : '';
  const title = String(config.audio_title || 'ON REPEAT').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  return `<section class="profile-music" aria-label="Profil-Song"><div class="profile-music-label"><span>${title}</span><span>♫</span></div><iframe title="Profil-Song auf YouTube" src="https://www.youtube-nocookie.com/embed/${id}?playsinline=1&autoplay=0&rel=0${repeat}" width="100%" height="240" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">Auf YouTube öffnen ↗</a></section>`;
}

module.exports = { GRUNGE_PRESET, applyRequestedTheme, applyRequestedSharpBackground, applyRequestedPinterestBackground, applyRequestedSong, applyRequestedBassEdit, applyRequestedNobuSong, applyRequestedBeatPlayback, applyRequestedProfileImage, applyRequestedCountMyBandz, applyRequestedLocalCountMyBandz, applyRequestedQuietEntryVolume, youtubeVideoId, youtubePlayer };
