async function applyRequestedDiscordAvatar(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const {rows}=await client.query('SELECT id, data FROM bio_config ORDER BY id LIMIT 1 FOR UPDATE');
    const current=rows[0];
    if(current&&current.data._discord_avatar_20261108!=='applied'){
      await client.query('INSERT INTO bio_snapshots(label,data) VALUES($1,$2)',['Vor originalem Discord-Profilbild',current.data]);
      await client.query('UPDATE bio_config SET data = data || $1::jsonb WHERE id = $2',[JSON.stringify({
        _discord_avatar_20261108:'applied',avatar_type:'image',avatar_url:'/profile/celvin-discord-v1.png'
      }),current.id]);
    }
    await client.query('COMMIT');
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {client.release();}
}
module.exports={applyRequestedDiscordAvatar};
