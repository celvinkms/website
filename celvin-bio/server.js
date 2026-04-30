const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bio_config (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'
    );
  `);
  const { rows } = await pool.query("SELECT id FROM bio_config LIMIT 1");
  if (rows.length === 0) {
    const defaultData = {
      username: "username",
      emoji: "🖤",
      bio: "your bio goes here.\nmake it short. make it yours.",
      badges: ["online", "de / erfurt", "since 2024"],
      accent: "#c8ff00",
      discord: "https://discord.gg/yourinvite",
      instagram: "https://instagram.com/yourusername",
      twitter: "https://x.com/yourusername",
      password: await bcrypt.hash("admin123", 10)
    };
    await pool.query("INSERT INTO bio_config (data) VALUES ($1)", [defaultData]);
  }
}

async function getConfig() {
  const { rows } = await pool.query("SELECT data FROM bio_config LIMIT 1");
  return rows[0]?.data || {};
}

async function saveConfig(data) {
  await pool.query("UPDATE bio_config SET data = $1", [data]);
}

function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect("/admin");
}

// Bio page
app.get("/", async (req, res) => {
  const c = await getConfig();
  const bioLines = (c.bio || "").split("\n").map(l => `<p>${l}</p>`).join("");
  const badges = (c.badges || []).map((b, i) =>
    `<span class="badge ${i === 0 ? 'accent' : ''}">${b}</span>`
  ).join("");
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.username || "bio"}</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0a; --surface: #111; --border: #1e1e1e; --border-glow: #2a2a2a;
    --text: #e8e8e8; --muted: #555; --accent: ${c.accent || "#c8ff00"};
    --accent-dim: color-mix(in srgb, var(--accent) 8%, transparent);
    --accent-dim2: color-mix(in srgb, var(--accent) 4%, transparent);
  }
  body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; }
  body::before { content: ''; position: fixed; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(ellipse at 50% 20%, color-mix(in srgb, var(--accent) 3%, transparent) 0%, transparent 60%); pointer-events: none; z-index: 0; }
  .card { position: relative; z-index: 1; width: 100%; max-width: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 2.5rem 2rem 2rem; animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .avatar-wrap { display: flex; justify-content: center; margin-bottom: 1.2rem; }
  .avatar { width: 88px; height: 88px; border-radius: 50%; border: 2px solid var(--border-glow); background: linear-gradient(135deg, #1a1a1a, #222); display: flex; align-items: center; justify-content: center; font-size: 2rem; position: relative; transition: border-color 0.3s; }
  .avatar:hover { border-color: var(--accent); }
  .avatar-status { position: absolute; bottom: 4px; right: 4px; width: 14px; height: 14px; background: #22c55e; border-radius: 50%; border: 2px solid var(--surface); }
  .username { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; color: var(--text); text-align: center; margin-bottom: 0.5rem; }
  .username span { color: var(--accent); }
  .badge-row { display: flex; justify-content: center; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; }
  .badge { font-family: 'Space Mono', monospace; font-size: 10px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border-glow); color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; }
  .badge.accent { border-color: color-mix(in srgb, var(--accent) 30%, transparent); color: var(--accent); background: var(--accent-dim2); }
  .bio { text-align: center; font-size: 0.88rem; color: var(--muted); line-height: 1.65; margin-bottom: 1.8rem; font-family: 'Space Mono', monospace; }
  .bio p { margin: 0; }
  .divider { height: 1px; background: var(--border); margin-bottom: 1.5rem; }
  .links { display: flex; flex-direction: column; gap: 10px; }
  .link-btn { display: flex; align-items: center; gap: 14px; padding: 13px 16px; background: transparent; border: 1px solid var(--border); border-radius: 12px; color: var(--text); text-decoration: none; font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; transition: border-color 0.2s, background 0.2s, transform 0.15s; }
  .link-btn::after { content: '↗'; margin-left: auto; font-size: 0.75rem; color: var(--muted); transition: color 0.2s; }
  .link-btn:hover { border-color: var(--accent); background: var(--accent-dim); transform: translateX(3px); }
  .link-btn:hover::after { color: var(--accent); }
  .link-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .link-icon svg { width: 18px; height: 18px; }
  .icon-discord { background: rgba(88,101,242,.15); border: 1px solid rgba(88,101,242,.25); }
  .icon-instagram { background: rgba(225,48,108,.12); border: 1px solid rgba(225,48,108,.25); }
  .icon-twitter { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
  .footer { position: relative; z-index: 1; margin-top: 1.5rem; font-family: 'Space Mono', monospace; font-size: 10px; color: #333; letter-spacing: 0.05em; }
</style>
</head>
<body>
<div class="card">
  <div class="avatar-wrap"><div class="avatar">${c.emoji || "🖤"}<div class="avatar-status"></div></div></div>
  <h1 class="username">@<span>${c.username || "username"}</span></h1>
  <div class="badge-row">${badges}</div>
  <div class="bio">${bioLines}</div>
  <div class="divider"></div>
  <div class="links">
    ${c.discord ? `<a href="${c.discord}" target="_blank" class="link-btn"><span class="link-icon icon-discord"><svg viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.077.077 0 0 0 .033.056 19.9 19.9 0 0 0 5.993 3.03.079.079 0 0 0 .085-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" fill="#5865F2"/></svg></span>Discord</a>` : ""}
    ${c.instagram ? `<a href="${c.instagram}" target="_blank" class="link-btn"><span class="link-icon icon-instagram"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" fill="#E1306C"/></svg></span>Instagram</a>` : ""}
    ${c.twitter ? `<a href="${c.twitter}" target="_blank" class="link-btn"><span class="link-icon icon-twitter"><svg viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#e8e8e8"/></svg></span>Twitter / X</a>` : ""}
  </div>
</div>
<p class="footer">celvin.rip</p>
</body></html>`);
});

// Admin login page
app.get("/admin", (req, res) => {
  if (req.session.authenticated) return res.redirect("/admin/dashboard");
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Login</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #e8e8e8; font-family: 'Syne', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .card { width: 100%; max-width: 380px; background: #111; border: 1px solid #1e1e1e; border-radius: 20px; padding: 2.5rem 2rem; }
  h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
  h1 span { color: #c8ff00; }
  p { font-family: 'Space Mono', monospace; font-size: 12px; color: #555; margin-bottom: 2rem; }
  input { width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 10px; color: #e8e8e8; font-family: 'Space Mono', monospace; font-size: 14px; padding: 12px 14px; outline: none; transition: border-color 0.2s; }
  input:focus { border-color: #c8ff00; }
  button { width: 100%; margin-top: 12px; background: #c8ff00; border: none; border-radius: 10px; color: #0a0a0a; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; padding: 13px; cursor: pointer; transition: opacity 0.2s; }
  button:hover { opacity: 0.85; }
  .error { font-family: 'Space Mono', monospace; font-size: 12px; color: #ff4444; margin-top: 10px; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <h1>admin <span>login</span></h1>
  <p>nur für dich.</p>
  <form method="POST" action="/admin/login">
    <input type="password" name="password" placeholder="passwort" autofocus required>
    <button type="submit">einloggen →</button>
    ${req.query.error ? '<p class="error">falsches passwort.</p>' : ""}
  </form>
</div>
</body></html>`);
});

// Admin login POST
app.post("/admin/login", async (req, res) => {
  const config = await getConfig();
  const valid = await bcrypt.compare(req.body.password, config.password);
  if (valid) { req.session.authenticated = true; return res.redirect("/admin/dashboard"); }
  res.redirect("/admin?error=1");
});

// Admin dashboard
app.get("/admin/dashboard", requireAuth, async (req, res) => {
  const c = await getConfig();
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #e8e8e8; font-family: 'Syne', sans-serif; min-height: 100vh; padding: 2rem 1rem; }
  .wrap { max-width: 600px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
  h1 { font-size: 1.5rem; font-weight: 800; }
  h1 span { color: #c8ff00; }
  .logout { font-family: 'Space Mono', monospace; font-size: 11px; color: #555; text-decoration: none; padding: 6px 12px; border: 1px solid #2a2a2a; border-radius: 8px; transition: color 0.2s, border-color 0.2s; }
  .logout:hover { color: #e8e8e8; border-color: #555; }
  .section { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem; }
  .section h2 { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #555; margin-bottom: 1rem; font-family: 'Space Mono', monospace; }
  label { display: block; font-size: 12px; color: #666; font-family: 'Space Mono', monospace; margin-bottom: 6px; margin-top: 14px; }
  label:first-of-type { margin-top: 0; }
  input[type="text"], input[type="password"], input[type="url"], input[type="color"], textarea {
    width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 10px;
    color: #e8e8e8; font-family: 'Space Mono', monospace; font-size: 13px; padding: 10px 14px;
    outline: none; transition: border-color 0.2s; resize: vertical;
  }
  input:focus, textarea:focus { border-color: #c8ff00; }
  input[type="color"] { height: 44px; padding: 4px 8px; cursor: pointer; }
  .color-row { display: flex; align-items: center; gap: 12px; }
  .color-row span { font-family: 'Space Mono', monospace; font-size: 12px; color: #555; }
  .btn-save { width: 100%; background: #c8ff00; border: none; border-radius: 12px; color: #0a0a0a; font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; padding: 14px; cursor: pointer; margin-top: 1.5rem; transition: opacity 0.2s; }
  .btn-save:hover { opacity: 0.85; }
  .toast { display: none; position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: #c8ff00; color: #0a0a0a; font-family: 'Space Mono', monospace; font-size: 12px; padding: 10px 20px; border-radius: 999px; font-weight: 700; z-index: 100; }
  .preview-link { font-family: 'Space Mono', monospace; font-size: 11px; color: #c8ff00; text-decoration: none; display: inline-block; margin-top: 0.5rem; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>dash<span>board</span></h1>
    <a href="/admin/logout" class="logout">logout →</a>
  </header>

  <form id="bioForm">
    <div class="section">
      <h2>profil</h2>
      <label>username</label>
      <input type="text" name="username" value="${c.username || ""}" placeholder="dein username">
      <label>avatar emoji</label>
      <input type="text" name="emoji" value="${c.emoji || "🖤"}" placeholder="🖤" style="max-width: 80px;">
      <label>bio text (eine zeile = eine zeile)</label>
      <textarea name="bio" rows="3" placeholder="dein bio text">${c.bio || ""}</textarea>
      <label>badges (komma-getrennt)</label>
      <input type="text" name="badges" value="${(c.badges || []).join(", ")}" placeholder="online, de, since 2024">
    </div>

    <div class="section">
      <h2>farbe</h2>
      <label>accent farbe</label>
      <div class="color-row">
        <input type="color" name="accent" id="accentPicker" value="${c.accent || "#c8ff00"}" style="width:60px;">
        <span id="accentHex">${c.accent || "#c8ff00"}</span>
      </div>
    </div>

    <div class="section">
      <h2>links</h2>
      <label>discord</label>
      <input type="url" name="discord" value="${c.discord || ""}" placeholder="https://discord.gg/...">
      <label>instagram</label>
      <input type="url" name="instagram" value="${c.instagram || ""}" placeholder="https://instagram.com/...">
      <label>twitter / x</label>
      <input type="url" name="twitter" value="${c.twitter || ""}" placeholder="https://x.com/...">
    </div>

    <div class="section">
      <h2>passwort ändern</h2>
      <label>neues passwort (leer lassen = nicht ändern)</label>
      <input type="password" name="newPassword" placeholder="neues passwort">
    </div>

    <button type="submit" class="btn-save">speichern & live schalten ✓</button>
    <a href="/" target="_blank" class="preview-link">→ seite ansehen</a>
  </form>
</div>
<div class="toast" id="toast">gespeichert! ✓</div>

<script>
document.getElementById("accentPicker").addEventListener("input", function() {
  document.getElementById("accentHex").textContent = this.value;
});

document.getElementById("bioForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const data = Object.fromEntries(form);
  const res = await fetch("/admin/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    const t = document.getElementById("toast");
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 2500);
  }
});
</script>
</body></html>`);
});

// Save config
app.post("/admin/save", requireAuth, async (req, res) => {
  const current = await getConfig();
  const { username, emoji, bio, badges, accent, discord, instagram, twitter, newPassword } = req.body;
  const updated = {
    ...current,
    username, emoji, bio,
    badges: badges.split(",").map(b => b.trim()).filter(Boolean),
    accent, discord, instagram, twitter,
    password: newPassword ? await bcrypt.hash(newPassword, 10) : current.password
  };
  await saveConfig(updated);
  res.json({ ok: true });
});

// Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
}).catch(err => {
  console.error("DB Init Fehler:", err);
  process.exit(1);
});
