const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || "celvin-secret-2024", resave: false, saveUninitialized: false, cookie: { maxAge: 86400000 } }));

const TEMPLATES = {
  dark: { name: "Dark Classic", accent: "#c8ff00", bg_type: "solid", bg_color: "#0a0a0a", bg_gradient_from: "#0a0a0a", bg_gradient_to: "#111827", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none", bg_animated: false, card_style: "dark", card_blur: false, font: "Syne", text_color: "#e8e8e8", link_style: "default", avatar_border: "circle", avatar_glow: false, layout: "centered" },
  cyberpunk: { name: "Cyberpunk", accent: "#ff0090", bg_type: "solid", bg_color: "#0a0010", bg_gradient_from: "#0a0010", bg_gradient_to: "#0a0010", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "grid", bg_animated: false, card_style: "glass", card_blur: true, font: "Oxanium", text_color: "#f0e6ff", link_style: "neon", avatar_border: "square", avatar_glow: true, layout: "centered" },
  hacker: { name: "Hacker", accent: "#00ff41", bg_type: "solid", bg_color: "#000000", bg_gradient_from: "#000000", bg_gradient_to: "#000000", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "dots", bg_animated: false, card_style: "dark", card_blur: false, font: "Share Tech Mono", text_color: "#00ff41", link_style: "minimal", avatar_border: "none", avatar_glow: true, layout: "centered" },
  ocean: { name: "Ocean", accent: "#00d4ff", bg_type: "gradient", bg_color: "#020b18", bg_gradient_from: "#020b18", bg_gradient_to: "#0a1628", bg_gradient_angle: "160", bg_image_url: "", bg_pattern: "none", bg_animated: true, card_style: "glass", card_blur: true, font: "Outfit", text_color: "#e0f4ff", link_style: "filled", avatar_border: "circle", avatar_glow: false, layout: "centered" },
  sunset: { name: "Sunset", accent: "#ff6b35", bg_type: "gradient", bg_color: "#1a0a00", bg_gradient_from: "#1a0510", bg_gradient_to: "#0d0a1a", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none", bg_animated: true, card_style: "glass", card_blur: true, font: "Syne", text_color: "#ffe8d6", link_style: "filled", avatar_border: "circle", avatar_glow: false, layout: "centered" },
  minimal: { name: "Minimal", accent: "#6366f1", bg_type: "solid", bg_color: "#fafafa", bg_gradient_from: "#fafafa", bg_gradient_to: "#f0f0f0", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none", bg_animated: false, card_style: "light", card_blur: false, font: "DM Sans", text_color: "#111111", link_style: "default", avatar_border: "circle", avatar_glow: false, layout: "centered" },
  neon: { name: "Neon Pink", accent: "#ff2d78", bg_type: "solid", bg_color: "#070010", bg_gradient_from: "#070010", bg_gradient_to: "#070010", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "dots", bg_animated: false, card_style: "dark", card_blur: false, font: "Rajdhani", text_color: "#ffe0ee", link_style: "neon", avatar_border: "circle", avatar_glow: true, layout: "centered" },
  glass: { name: "Glassmorphism", accent: "#ffffff", bg_type: "gradient", bg_color: "#1a1a2e", bg_gradient_from: "#1a1a2e", bg_gradient_to: "#16213e", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none", bg_animated: true, card_style: "glass", card_blur: true, font: "Inter", text_color: "#ffffff", link_style: "pill", avatar_border: "circle", avatar_glow: false, layout: "centered" }
};

const DEFAULT_CONFIG = {
  username: "username", pronouns: "", avatar_type: "emoji", avatar_emoji: "🖤", avatar_url: "",
  bio: "your bio goes here.\nmake it short. make it yours.",
  badges: ["online", "de", "since 2024"], status: "online",
  ...TEMPLATES.dark,
  links: [
    { label: "Discord", url: "https://discord.gg/yourinvite", icon: "discord", color: "#5865F2" },
    { label: "Instagram", url: "https://instagram.com/yourusername", icon: "instagram", color: "#E1306C" },
    { label: "Twitter / X", url: "https://x.com/yourusername", icon: "twitter", color: "#ffffff" }
  ],
  spotify_url: "", custom_css: "", meta_title: "", meta_description: "", views: 0, password: ""
};

async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS bio_config (id SERIAL PRIMARY KEY, data JSONB NOT NULL DEFAULT '{}')`);
  const { rows } = await pool.query("SELECT id FROM bio_config LIMIT 1");
  if (rows.length === 0) {
    const d = { ...DEFAULT_CONFIG, password: await bcrypt.hash("admin123", 10) };
    await pool.query("INSERT INTO bio_config (data) VALUES ($1)", [d]);
  }
}
async function getConfig() { const { rows } = await pool.query("SELECT data FROM bio_config LIMIT 1"); return { ...DEFAULT_CONFIG, ...rows[0]?.data } || DEFAULT_CONFIG; }
async function saveConfig(data) { await pool.query("UPDATE bio_config SET data = $1", [data]); }
function requireAuth(req, res, next) { if (req.session.authenticated) return next(); res.redirect("/admin"); }

const ICONS = {
  discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.077.077 0 0 0 .033.056 19.9 19.9 0 0 0 5.993 3.03.079.079 0 0 0 .085-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  steam: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
};

function renderBioPage(c) {
  const bg = c.bg_type === "gradient"
    ? `linear-gradient(${c.bg_gradient_angle||135}deg, ${c.bg_gradient_from}, ${c.bg_gradient_to})`
    : c.bg_type === "image" ? `url('${c.bg_image_url}') center/cover no-repeat fixed` : (c.bg_color||"#0a0a0a");

  const cardBg = c.card_style==="glass" ? "rgba(255,255,255,0.06)" : c.card_style==="light" ? "rgba(255,255,255,0.96)" : "rgba(17,17,17,0.95)";
  const cardBorder = c.card_style==="glass" ? "rgba(255,255,255,0.12)" : c.card_style==="light" ? "rgba(0,0,0,0.08)" : "#1e1e1e";
  const cardBlur = c.card_blur ? "backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);" : "";

  const avatarRadius = c.avatar_border==="square" ? "10px" : c.avatar_border==="rounded" ? "30px" : c.avatar_border==="none" ? "8px" : "50%";
  const avatarGlow = c.avatar_glow ? `box-shadow:0 0 20px color-mix(in srgb,${c.accent||"#c8ff00"} 50%,transparent),0 0 40px color-mix(in srgb,${c.accent||"#c8ff00"} 20%,transparent);` : "";
  const avatar = c.avatar_type==="image" && c.avatar_url
    ? `<img src="${c.avatar_url}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span style="font-size:2.2rem">${c.avatar_emoji||"🖤"}</span>`;

  const statusColors = {online:"#22c55e",idle:"#f59e0b",dnd:"#ef4444",offline:"#6b7280"};
  const badges = (c.badges||[]).map((b,i)=>`<span class="badge ${i===0?"accent":""}">${b}</span>`).join("");
  const bioLines = (c.bio||"").split("\n").map(l=>`<span>${l}</span>`).join("<br>");

  const linkStyle = c.link_style || "default";
  const links = (c.links||[]).map(l => {
    let style = "";
    if(linkStyle==="filled") style = `background:${l.color||c.accent};border-color:${l.color||c.accent};color:#000;`;
    if(linkStyle==="neon") style = `border-color:${l.color||c.accent};box-shadow:0 0 10px color-mix(in srgb,${l.color||c.accent} 30%,transparent);`;
    if(linkStyle==="pill") style = `border-radius:999px;`;
    if(linkStyle==="minimal") style = `border-color:transparent;`;
    return `<a href="${l.url}" target="_blank" class="link-btn ls-${linkStyle}" style="--lc:${l.color||c.accent};${style}">
      <span class="li" style="color:${linkStyle==="filled"?"#000":l.color||c.accent}">${ICONS[l.icon]||ICONS.link}</span>
      <span>${l.label}</span><span class="arr">↗</span>
    </a>`;
  }).join("");

  const spotify = c.spotify_url ? `<div style="margin-top:1rem"><iframe src="${c.spotify_url.replace("open.spotify.com/track","open.spotify.com/embed/track").replace("open.spotify.com/playlist","open.spotify.com/embed/playlist")}" width="100%" height="80" frameborder="0" allow="encrypted-media" style="border-radius:12px;"></iframe></div>` : "";

  const patternCSS = c.bg_pattern === "dots" ? `body::after{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,${c.accent||"#c8ff00"}15 1px,transparent 1px);background-size:24px 24px;pointer-events:none;z-index:0;}`
    : c.bg_pattern === "grid" ? `body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(${c.accent||"#c8ff00"}0f 1px,transparent 1px),linear-gradient(90deg,${c.accent||"#c8ff00"}0f 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}`
    : c.bg_pattern === "lines" ? `body::after{content:'';position:fixed;inset:0;background-image:repeating-linear-gradient(0deg,${c.accent||"#c8ff00"}08 0px,${c.accent||"#c8ff00"}08 1px,transparent 1px,transparent 40px);pointer-events:none;z-index:0;}` : "";

  const animBg = c.bg_animated && c.bg_type==="gradient" ? `
    @keyframes bgShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    body{background-size:300% 300%!important;animation:bgShift 8s ease infinite;}` : "";

  const particles = c.show_particles ? `<canvas id="pc" style="position:fixed;inset:0;pointer-events:none;z-index:0;"></canvas><script>(function(){const c=document.getElementById("pc"),x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;const p=Array.from({length:60},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.5+.5,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3}));function d(){x.clearRect(0,0,c.width,c.height);p.forEach(i=>{i.x+=i.vx;i.y+=i.vy;if(i.x<0||i.x>c.width)i.vx*=-1;if(i.y<0||i.y>c.height)i.vy*=-1;x.beginPath();x.arc(i.x,i.y,i.r,0,Math.PI*2);x.fillStyle="${c.accent||"#c8ff00"}55";x.fill()});requestAnimationFrame(d)}d();window.addEventListener("resize",()=>{c.width=innerWidth;c.height=innerHeight})})()<\/script>` : "";

  const glow = c.cursor_glow ? `<div id="gl" style="position:fixed;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${c.accent||"#c8ff00"}0d 0%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);left:-999px;top:-999px;transition:left .05s,top .05s;"></div><script>document.addEventListener("mousemove",e=>{const g=document.getElementById("gl");g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";})<\/script>` : "";

  const views = c.show_views ? `<p style="font-family:'Space Mono',monospace;font-size:10px;color:color-mix(in srgb,${c.text_color||"#e8e8e8"} 25%,transparent);margin-top:1rem;text-align:center;">${c.views||0} views</p>` : "";

  const customCSS = c.custom_css ? `<style>${c.custom_css}</style>` : "";

  const metaTitle = c.meta_title || c.username || "bio";
  const metaDesc = c.meta_description || (c.bio||"").split("\n")[0] || "";

  return `<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${metaTitle}</title>
<meta name="description" content="${metaDesc}">
<meta property="og:title" content="${metaTitle}">
<meta property="og:description" content="${metaDesc}">
${c.avatar_url ? `<meta property="og:image" content="${c.avatar_url}">` : ""}
<link href="https://fonts.googleapis.com/css2?family=${(c.font||"Syne").replace(/ /g,"+")}:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--a:${c.accent||"#c8ff00"};--t:${c.text_color||"#e8e8e8"};--m:color-mix(in srgb,var(--t) 35%,transparent)}
body{background:${bg};color:var(--t);font-family:'${c.font||"Syne"}',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1rem;overflow-x:hidden;position:relative;}
${patternCSS}${animBg}
.card{position:relative;z-index:1;width:100%;max-width:440px;background:${cardBg};border:1px solid ${cardBorder};border-radius:24px;padding:2.5rem 2rem 2rem;${cardBlur}animation:fu .6s cubic-bezier(.16,1,.3,1) both}
@keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.av{display:flex;justify-content:center;margin-bottom:1.2rem}
.avi{width:90px;height:90px;border-radius:${avatarRadius};border:2px solid color-mix(in srgb,var(--a) 40%,transparent);background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;transition:border-color .3s;${avatarGlow}}
.avi:hover{border-color:var(--a)}
.st{position:absolute;bottom:4px;right:4px;width:14px;height:14px;background:${statusColors[c.status]||"#22c55e"};border-radius:50%;border:2px solid ${cardBg}}
.name{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;text-align:center}.name span{color:var(--a)}
.pron{font-family:'Space Mono',monospace;font-size:11px;color:var(--m);text-align:center;margin-bottom:.8rem}
.br{display:flex;justify-content:center;gap:6px;margin-bottom:1rem;flex-wrap:wrap}
.badge{font-family:'Space Mono',monospace;font-size:10px;padding:3px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--t) 12%,transparent);color:var(--m);letter-spacing:.05em;text-transform:uppercase}
.badge.accent{border-color:color-mix(in srgb,var(--a) 35%,transparent);color:var(--a);background:color-mix(in srgb,var(--a) 5%,transparent)}
.bio{text-align:center;font-size:.875rem;color:var(--m);line-height:1.7;margin-bottom:1.8rem;font-family:'Space Mono',monospace}
.dv{height:1px;background:color-mix(in srgb,var(--t) 8%,transparent);margin-bottom:1.5rem}
.lks{display:flex;flex-direction:column;gap:8px}
.link-btn{display:flex;align-items:center;gap:12px;padding:12px 16px;background:transparent;border:1px solid color-mix(in srgb,var(--t) 10%,transparent);border-radius:14px;color:var(--t);text-decoration:none;font-family:'${c.font||"Syne"}',sans-serif;font-size:.875rem;font-weight:700;transition:all .2s;}
.link-btn:hover{border-color:var(--lc,var(--a));background:color-mix(in srgb,var(--lc,var(--a)) 8%,transparent);transform:translateX(4px)}
.ls-neon:hover{box-shadow:0 0 15px color-mix(in srgb,var(--lc,var(--a)) 40%,transparent)}
.ls-filled:hover{opacity:.85;transform:translateX(4px)}
.ls-minimal{border-color:transparent!important;background:transparent!important}
.ls-minimal:hover{background:color-mix(in srgb,var(--lc,var(--a)) 8%,transparent)!important}
.li{width:20px;height:20px;flex-shrink:0}.li svg{width:100%;height:100%}
.arr{margin-left:auto;font-size:.75rem;color:var(--m);transition:color .2s}
.link-btn:hover .arr{color:var(--lc,var(--a))}
</style>
${customCSS}
</head><body>
${particles}${glow}
<div class="card">
  <div class="av"><div class="avi">${avatar}<div class="st"></div></div></div>
  <h1 class="name">@<span>${c.username||"username"}</span></h1>
  ${c.pronouns?`<p class="pron">${c.pronouns}</p>`:""}
  <div class="br">${badges}</div>
  <p class="bio">${bioLines}</p>
  <div class="dv"></div>
  <div class="lks">${links}</div>
  ${spotify}
</div>
${views}
</body></html>`;
}

app.get("/", async (req, res) => {
  const c = await getConfig();
  if (c.show_views) { c.views = (c.views||0)+1; await saveConfig(c); }
  res.send(renderBioPage(c));
});

app.get("/admin", (req, res) => {
  if (req.session.authenticated) return res.redirect("/admin/dashboard");
  res.send(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono&display=swap" rel="stylesheet">
<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#080808;color:#e8e8e8;font-family:'Syne',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}.card{width:100%;max-width:360px;background:#0f0f0f;border:1px solid #1a1a1a;border-radius:24px;padding:2.5rem 2rem}h1{font-size:1.6rem;font-weight:800;margin-bottom:.3rem}h1 span{color:#c8ff00}p{font-family:'Space Mono',monospace;font-size:11px;color:#444;margin-bottom:2rem}input{width:100%;background:#080808;border:1px solid #222;border-radius:12px;color:#e8e8e8;font-family:'Space Mono',monospace;font-size:14px;padding:13px 16px;outline:none;transition:border-color .2s;margin-bottom:10px}input:focus{border-color:#c8ff00}button{width:100%;background:#c8ff00;border:none;border-radius:12px;color:#080808;font-family:'Syne',sans-serif;font-size:.95rem;font-weight:800;padding:14px;cursor:pointer;transition:opacity .15s}button:hover{opacity:.85}.err{font-family:'Space Mono',monospace;font-size:11px;color:#ff4444;text-align:center;margin-top:10px}</style></head>
<body><div class="card"><h1>admin <span>login</span></h1><p>nur für dich.</p>
<form method="POST" action="/admin/login"><input type="password" name="password" placeholder="passwort" autofocus required><button type="submit">einloggen →</button></form>
${req.query.error?'<p class="err">falsches passwort.</p>':""}</div></body></html>`);
});

app.post("/admin/login", async (req, res) => {
  const c = await getConfig();
  if (await bcrypt.compare(req.body.password, c.password)) { req.session.authenticated = true; return res.redirect("/admin/dashboard"); }
  res.redirect("/admin?error=1");
});

app.get("/admin/dashboard", requireAuth, async (req, res) => {
  const c = await getConfig();

  const templateCards = Object.entries(TEMPLATES).map(([key, t]) => `
    <div class="tpl-card" onclick="applyTemplate('${key}')" title="${t.name}">
      <div class="tpl-preview" style="background:${t.bg_type==="gradient"?`linear-gradient(135deg,${t.bg_gradient_from},${t.bg_gradient_to})`:t.bg_color};">
        <div class="tpl-card-inner" style="background:${t.card_style==="glass"?"rgba(255,255,255,0.08)":t.card_style==="light"?"rgba(255,255,255,0.95)":"rgba(17,17,17,0.9)"};border:1px solid ${t.card_style==="glass"?"rgba(255,255,255,0.15)":"#2a2a2a"};">
          <div class="tpl-dot" style="background:${t.accent};${t.avatar_border==="square"?"border-radius:4px":t.avatar_border==="none"?"border-radius:2px":"border-radius:50%"};${t.avatar_glow?`box-shadow:0 0 6px ${t.accent}`:""}"></div>
          <div class="tpl-line" style="background:${t.accent};width:40px;"></div>
          <div class="tpl-line" style="background:color-mix(in srgb,${t.text_color} 30%,transparent);width:55px;"></div>
          <div class="tpl-btn" style="border-color:${t.link_style==="filled"?t.accent:t.link_style==="neon"?t.accent:"rgba(255,255,255,0.15)"};background:${t.link_style==="filled"?t.accent:"transparent"};border-radius:${t.link_style==="pill"?"999px":"6px"};${t.link_style==="neon"?`box-shadow:0 0 4px ${t.accent}`:""};"></div>
          <div class="tpl-btn" style="border-color:${t.link_style==="filled"?t.accent:t.link_style==="neon"?t.accent:"rgba(255,255,255,0.15)"};background:${t.link_style==="filled"?t.accent:"transparent"};border-radius:${t.link_style==="pill"?"999px":"6px"};"></div>
        </div>
      </div>
      <span>${t.name}</span>
    </div>`).join("");

  res.send(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#080808;--s:#0f0f0f;--s2:#141414;--b:#1a1a1a;--b2:#222;--t:#e8e8e8;--m:#555;--a:#c8ff00}
body{background:var(--bg);color:var(--t);font-family:'Syne',sans-serif;min-height:100vh;display:flex;}
.sidebar{width:220px;min-height:100vh;background:var(--s);border-right:1px solid var(--b);padding:1.5rem 1rem;display:flex;flex-direction:column;gap:2px;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;}
.logo{font-size:1.1rem;font-weight:800;padding:.5rem .75rem 1.5rem}.logo span{color:var(--a)}
.ni{display:flex;align-items:center;gap:10px;padding:.6rem .75rem;border-radius:10px;cursor:pointer;font-size:.85rem;font-weight:700;color:var(--m);transition:background .15s,color .15s;border:none;background:none;width:100%;text-align:left;}
.ni:hover{background:var(--s2);color:var(--t)}.ni.active{background:color-mix(in srgb,var(--a) 10%,transparent);color:var(--a)}
.ni svg{width:15px;height:15px;opacity:.7;flex-shrink:0}.ni.active svg{opacity:1}
.ni-divider{height:1px;background:var(--b);margin:8px 0;}
.sf{margin-top:auto}
.lb{display:flex;align-items:center;gap:10px;padding:.6rem .75rem;border-radius:10px;cursor:pointer;font-size:.85rem;font-weight:700;color:var(--m);transition:color .15s;border:none;background:none;width:100%;text-align:left;text-decoration:none;}
.lb:hover{color:#ef4444}
.main{flex:1;padding:2rem;overflow-y:auto;max-width:800px;}
.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem}
.pt{font-size:1.3rem;font-weight:800}
.pbtns{display:flex;gap:8px;}
.pb{font-family:'Space Mono',monospace;font-size:11px;color:var(--a);text-decoration:none;padding:6px 14px;border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:8px;transition:background .15s;cursor:pointer;background:none;}
.pb:hover{background:color-mix(in srgb,var(--a) 10%,transparent)}
.sec{background:var(--s);border:1px solid var(--b);border-radius:18px;padding:1.5rem;margin-bottom:1rem;display:none}
.sec.active{display:block}
.st{font-family:'Space Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--m);margin-bottom:1rem;margin-top:1.5rem}
.st:first-child{margin-top:0}
.fi{margin-bottom:1rem}.fi:last-child{margin-bottom:0}
.fi label{display:block;font-size:12px;color:var(--m);font-family:'Space Mono',monospace;margin-bottom:6px}
input[type=text],input[type=url],input[type=password],textarea,select{width:100%;background:var(--bg);border:1px solid var(--b2);border-radius:10px;color:var(--t);font-family:'Space Mono',monospace;font-size:13px;padding:10px 14px;outline:none;transition:border-color .2s;}
input:focus,textarea:focus,select:focus{border-color:var(--a)}
select option{background:var(--bg)}
textarea{resize:vertical;min-height:80px;line-height:1.6}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.tr{display:flex;align-items:center;justify-content:space-between;padding:.75rem 0}
.tr+.tr{border-top:1px solid var(--b)}
.tl{font-size:.875rem;font-weight:700}.td{font-size:11px;color:var(--m);font-family:'Space Mono',monospace}
.sw{position:relative;width:40px;height:22px;flex-shrink:0}
.sw input{opacity:0;width:0;height:0}
.sl{position:absolute;inset:0;background:#222;border-radius:999px;transition:background .2s;cursor:pointer}
.sl::before{content:'';position:absolute;height:16px;width:16px;left:3px;top:3px;background:#555;border-radius:50%;transition:transform .2s,background .2s}
input:checked+.sl{background:color-mix(in srgb,var(--a) 20%,transparent)}
input:checked+.sl::before{transform:translateX(18px);background:var(--a)}
.cf{display:flex;align-items:center;gap:10px}
.cs{width:40px;height:40px;border-radius:10px;border:1px solid var(--b2);cursor:pointer;overflow:hidden;flex-shrink:0}
.cs input[type=color]{width:200%;height:200%;margin:-25%;border:none;cursor:pointer;background:none}
.ll{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.li2{background:var(--bg);border:1px solid var(--b2);border-radius:12px;padding:12px}
.lr1{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center;margin-bottom:8px}
.lr2{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
.db{width:36px;height:36px;background:transparent;border:1px solid #2a2a2a;border-radius:8px;color:var(--m);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .15s,border-color .15s;flex-shrink:0}
.db:hover{color:#ef4444;border-color:#ef4444}
.alb{width:100%;background:transparent;border:1px dashed var(--b2);border-radius:12px;color:var(--m);font-family:'Syne',sans-serif;font-size:.875rem;font-weight:700;padding:12px;cursor:pointer;transition:border-color .2s,color .2s}
.alb:hover{border-color:var(--a);color:var(--a)}
.lcs{width:36px;height:36px;border-radius:8px;border:1px solid var(--b2);overflow:hidden;flex-shrink:0}
.lcs input[type=color]{width:200%;height:200%;margin:-25%;border:none;cursor:pointer}
.sbtn{width:100%;background:var(--a);border:none;border-radius:14px;color:#080808;font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;padding:15px;cursor:pointer;margin-top:1.5rem;transition:opacity .15s}
.sbtn:hover{opacity:.85}
.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--a);color:#080808;font-family:'Space Mono',monospace;font-size:12px;font-weight:700;padding:10px 22px;border-radius:999px;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none}
.toast.show{opacity:1}
.bw{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.bt{display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg);border:1px solid var(--b2);border-radius:999px;font-size:12px;font-family:'Space Mono',monospace}
.bt button{background:none;border:none;color:var(--m);cursor:pointer;font-size:14px;padding:0;line-height:1;transition:color .15s}
.bt button:hover{color:#ef4444}
.bar{display:flex;gap:8px}.bar input{flex:1}
.bab{background:transparent;border:1px solid var(--b2);border-radius:10px;color:var(--m);font-family:'Syne',sans-serif;font-weight:700;font-size:13px;padding:10px 16px;cursor:pointer;transition:border-color .2s,color .2s;white-space:nowrap}
.bab:hover{border-color:var(--a);color:var(--a)}
.bgp{height:60px;border-radius:12px;border:1px solid var(--b2);margin-bottom:12px;transition:background .3s}
/* Templates */
.tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-bottom:8px}
.tpl-card{cursor:pointer;border-radius:12px;overflow:hidden;border:2px solid var(--b2);transition:border-color .2s,transform .15s;font-size:11px;font-family:'Space Mono',monospace;color:var(--m);}
.tpl-card:hover{border-color:var(--a);transform:translateY(-2px);color:var(--t)}
.tpl-card.active-tpl{border-color:var(--a);color:var(--a)}
.tpl-preview{height:90px;padding:10px;display:flex;align-items:center;justify-content:center;}
.tpl-card-inner{border-radius:8px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;width:70px;}
.tpl-dot{width:18px;height:18px;margin-bottom:2px;}
.tpl-line{height:3px;border-radius:999px;}
.tpl-btn{width:100%;height:8px;border:1px solid;border-radius:4px;}
.tpl-card span{display:block;text-align:center;padding:6px 4px;}
/* Link styles preview */
.ls-preview{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.ls-opt{padding:8px 14px;border-radius:8px;border:1px solid var(--b2);font-size:12px;font-family:'Space Mono',monospace;cursor:pointer;transition:all .15s;color:var(--m);background:transparent;}
.ls-opt:hover{border-color:var(--a);color:var(--t)}
.ls-opt.active{border-color:var(--a);color:var(--a);background:color-mix(in srgb,var(--a) 10%,transparent)}
/* Avatar border preview */
.ab-preview{display:flex;gap:10px;margin-top:8px}
.ab-opt{width:44px;height:44px;background:var(--b2);display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;transition:border-color .15s;font-size:18px}
.ab-opt:hover{border-color:var(--a)}
.ab-opt.active{border-color:var(--a)}
/* Custom CSS editor */
#custom_css{font-family:'Space Mono',monospace;font-size:12px;min-height:120px;line-height:1.6}
</style>
</head><body>
<nav class="sidebar">
  <div class="logo">cel<span>vin</span>.rip</div>
  <button class="ni active" onclick="show('templates',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Templates</button>
  <button class="ni" onclick="show('profile',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Profil</button>
  <button class="ni" onclick="show('design',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>Design</button>
  <button class="ni" onclick="show('background',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>Hintergrund</button>
  <button class="ni" onclick="show('links',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Links</button>
  <button class="ni" onclick="show('effects',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Effekte</button>
  <div class="ni-divider"></div>
  <button class="ni" onclick="show('advanced',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Erweitert</button>
  <button class="ni" onclick="show('security',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Sicherheit</button>
  <div class="sf"><a href="/admin/logout" class="lb"><svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</a></div>
</nav>

<main class="main">
  <div class="ph">
    <h1 class="pt" id="pt">Templates</h1>
    <div class="pbtns">
      <a href="/" target="_blank" class="pb">→ Vorschau</a>
      <button class="pb" onclick="save()">✓ Speichern</button>
    </div>
  </div>

  <!-- TEMPLATES -->
  <div class="sec active" id="sec-templates">
    <p class="st" style="margin-top:0">Fertige Designs – klick zum Anwenden</p>
    <div class="tpl-grid" id="tplGrid">${templateCards}</div>
    <p style="font-family:'Space Mono',monospace;font-size:11px;color:var(--m);margin-top:8px;">Templates überschreiben Design-Einstellungen, nicht Profil & Links.</p>
  </div>

  <!-- PROFIL -->
  <div class="sec" id="sec-profile">
    <p class="st" style="margin-top:0">Identität</p>
    <div class="r2">
      <div class="fi"><label>Username</label><input type="text" id="username" value="${c.username||""}"></div>
      <div class="fi"><label>Pronomen</label><input type="text" id="pronouns" value="${c.pronouns||""}" placeholder="er/ihm, ..."></div>
    </div>
    <div class="fi"><label>Status</label><select id="status">
      <option value="online" ${c.status==="online"?"selected":""}>🟢 Online</option>
      <option value="idle" ${c.status==="idle"?"selected":""}>🟡 Idle</option>
      <option value="dnd" ${c.status==="dnd"?"selected":""}>🔴 Do Not Disturb</option>
      <option value="offline" ${c.status==="offline"?"selected":""}>⚫ Offline</option>
    </select></div>
    <div class="fi"><label>Bio</label><textarea id="bio" rows="4">${c.bio||""}</textarea></div>

    <p class="st">Avatar</p>
    <div class="r2">
      <div class="fi"><label>Typ</label><select id="avatar_type" onchange="toggleAv()">
        <option value="emoji" ${c.avatar_type==="emoji"?"selected":""}>Emoji</option>
        <option value="image" ${c.avatar_type==="image"?"selected":""}>Bild URL</option>
      </select></div>
      <div class="fi" id="ef" style="${c.avatar_type==="image"?"display:none":""}"><label>Emoji</label><input type="text" id="avatar_emoji" value="${c.avatar_emoji||"🖤"}"></div>
      <div class="fi" id="uf" style="${c.avatar_type!=="image"?"display:none":""}"><label>Bild URL</label><input type="url" id="avatar_url" value="${c.avatar_url||""}" placeholder="https://..."></div>
    </div>

    <p class="st">Avatar Rahmen</p>
    <div class="ab-preview" id="abPreview">
      <div class="ab-opt ${c.avatar_border==="circle"?"active":""}" style="border-radius:50%" onclick="setAB('circle')">😊</div>
      <div class="ab-opt ${c.avatar_border==="rounded"?"active":""}" style="border-radius:30%" onclick="setAB('rounded')">😊</div>
      <div class="ab-opt ${c.avatar_border==="square"?"active":""}" style="border-radius:8px" onclick="setAB('square')">😊</div>
      <div class="ab-opt ${c.avatar_border==="none"?"active":""}" style="border-radius:0" onclick="setAB('none')">😊</div>
    </div>
    <input type="hidden" id="avatar_border" value="${c.avatar_border||"circle"}">

    <div class="tr" style="margin-top:12px"><div><div class="tl">Avatar Glow</div><div class="td">Leuchtendes Glühen um das Profilbild</div></div><label class="sw"><input type="checkbox" id="avatar_glow" ${c.avatar_glow?"checked":""}><span class="sl"></span></label></div>

    <p class="st">Badges</p>
    <div class="bw" id="bw"></div>
    <div class="bar"><input type="text" id="bi" placeholder="neuer badge..." onkeydown="if(event.key==='Enter'){event.preventDefault();addB()}"><button class="bab" onclick="addB()">+ Add</button></div>

    <p class="st">Musik</p>
    <div class="fi"><label>Spotify URL (optional)</label><input type="url" id="spotify_url" value="${c.spotify_url||""}" placeholder="https://open.spotify.com/track/..."></div>
  </div>

  <!-- DESIGN -->
  <div class="sec" id="sec-design">
    <p class="st" style="margin-top:0">Farben & Schrift</p>
    <div class="r2">
      <div class="fi"><label>Accent-Farbe</label><div class="cf"><div class="cs"><input type="color" id="accent" value="${c.accent||"#c8ff00"}" oninput="syncH('accent')"></div><input type="text" id="accent_h" value="${c.accent||"#c8ff00"}" oninput="document.getElementById('accent').value=this.value"></div></div>
      <div class="fi"><label>Textfarbe</label><div class="cf"><div class="cs"><input type="color" id="text_color" value="${c.text_color||"#e8e8e8"}" oninput="syncH('text_color')"></div><input type="text" id="text_color_h" value="${c.text_color||"#e8e8e8"}" oninput="document.getElementById('text_color').value=this.value"></div></div>
    </div>
    <div class="r2">
      <div class="fi"><label>Font</label><select id="font">
        <option value="Syne" ${c.font==="Syne"?"selected":""}>Syne</option>
        <option value="Inter" ${c.font==="Inter"?"selected":""}>Inter</option>
        <option value="Outfit" ${c.font==="Outfit"?"selected":""}>Outfit</option>
        <option value="DM Sans" ${c.font==="DM Sans"?"selected":""}>DM Sans</option>
        <option value="Rajdhani" ${c.font==="Rajdhani"?"selected":""}>Rajdhani</option>
        <option value="Oxanium" ${c.font==="Oxanium"?"selected":""}>Oxanium</option>
        <option value="Share Tech Mono" ${c.font==="Share Tech Mono"?"selected":""}>Share Tech Mono</option>
      </select></div>
      <div class="fi"><label>Karten-Style</label><select id="card_style">
        <option value="dark" ${c.card_style==="dark"?"selected":""}>Dark</option>
        <option value="glass" ${c.card_style==="glass"?"selected":""}>Glassmorphism</option>
        <option value="light" ${c.card_style==="light"?"selected":""}>Light</option>
      </select></div>
    </div>
    <div class="tr"><div><div class="tl">Backdrop Blur</div><div class="td">Unschärfe hinter der Karte (Glassmorphism)</div></div><label class="sw"><input type="checkbox" id="card_blur" ${c.card_blur?"checked":""}><span class="sl"></span></label></div>

    <p class="st">Link Button Style</p>
    <div class="ls-preview" id="lsPreview">
      ${["default","filled","pill","minimal","neon"].map(s=>`<div class="ls-opt ${(c.link_style||"default")===s?"active":""}" onclick="setLS('${s}')">${s}</div>`).join("")}
    </div>
    <input type="hidden" id="link_style" value="${c.link_style||"default"}">
  </div>

  <!-- HINTERGRUND -->
  <div class="sec" id="sec-background">
    <p class="st" style="margin-top:0">Hintergrund</p>
    <div id="bgp" class="bgp"></div>
    <div class="fi"><label>Typ</label><select id="bg_type" onchange="updBg()">
      <option value="solid" ${c.bg_type==="solid"?"selected":""}>Einfarbig</option>
      <option value="gradient" ${c.bg_type==="gradient"?"selected":""}>Gradient</option>
      <option value="image" ${c.bg_type==="image"?"selected":""}>Bild URL</option>
    </select></div>
    <div id="bgf-solid" style="${c.bg_type!=="solid"?"display:none":""}">
      <div class="fi"><label>Farbe</label><div class="cf"><div class="cs"><input type="color" id="bg_color" value="${c.bg_color||"#0a0a0a"}" oninput="syncH('bg_color');updBg()"></div><input type="text" id="bg_color_h" value="${c.bg_color||"#0a0a0a"}" oninput="document.getElementById('bg_color').value=this.value;updBg()"></div></div>
    </div>
    <div id="bgf-gradient" style="${c.bg_type!=="gradient"?"display:none":""}">
      <div class="r3">
        <div class="fi"><label>Von</label><div class="cf"><div class="cs"><input type="color" id="bg_gradient_from" value="${c.bg_gradient_from||"#0a0a0a"}" oninput="syncH('bg_gradient_from');updBg()"></div><input type="text" id="bg_gradient_from_h" value="${c.bg_gradient_from||"#0a0a0a"}" oninput="document.getElementById('bg_gradient_from').value=this.value;updBg()"></div></div>
        <div class="fi"><label>Nach</label><div class="cf"><div class="cs"><input type="color" id="bg_gradient_to" value="${c.bg_gradient_to||"#111827"}" oninput="syncH('bg_gradient_to');updBg()"></div><input type="text" id="bg_gradient_to_h" value="${c.bg_gradient_to||"#111827"}" oninput="document.getElementById('bg_gradient_to').value=this.value;updBg()"></div></div>
        <div class="fi"><label>Winkel (°)</label><input type="text" id="bg_gradient_angle" value="${c.bg_gradient_angle||135}" oninput="updBg()"></div>
      </div>
    </div>
    <div id="bgf-image" style="${c.bg_type!=="image"?"display:none":""}">
      <div class="fi"><label>Bild URL</label><input type="url" id="bg_image_url" value="${c.bg_image_url||""}" placeholder="https://..."></div>
    </div>

    <p class="st">Muster</p>
    <div class="fi"><label>Hintergrund-Muster</label><select id="bg_pattern">
      <option value="none" ${(c.bg_pattern||"none")==="none"?"selected":""}>Keins</option>
      <option value="dots" ${c.bg_pattern==="dots"?"selected":""}>Punkte</option>
      <option value="grid" ${c.bg_pattern==="grid"?"selected":""}>Gitter</option>
      <option value="lines" ${c.bg_pattern==="lines"?"selected":""}>Linien</option>
    </select></div>
    <div class="tr"><div><div class="tl">Animierter Gradient</div><div class="td">Hintergrund bewegt sich langsam (nur bei Gradient)</div></div><label class="sw"><input type="checkbox" id="bg_animated" ${c.bg_animated?"checked":""}><span class="sl"></span></label></div>
  </div>

  <!-- LINKS -->
  <div class="sec" id="sec-links">
    <p class="st" style="margin-top:0">Deine Links</p>
    <div class="ll" id="ll"></div>
    <button class="alb" onclick="addL()">+ Link hinzufügen</button>
  </div>

  <!-- EFFEKTE -->
  <div class="sec" id="sec-effects">
    <p class="st" style="margin-top:0">Visuelle Effekte</p>
    <div class="tr"><div><div class="tl">Partikel-Hintergrund</div><div class="td">Schwebende Punkte im Hintergrund</div></div><label class="sw"><input type="checkbox" id="show_particles" ${c.show_particles?"checked":""}><span class="sl"></span></label></div>
    <div class="tr"><div><div class="tl">Cursor Glow</div><div class="td">Leuchtendes Licht folgt dem Mauszeiger</div></div><label class="sw"><input type="checkbox" id="cursor_glow" ${c.cursor_glow?"checked":""}><span class="sl"></span></label></div>
    <div class="tr"><div><div class="tl">Besucherzähler</div><div class="td">Zeigt Seitenaufrufe unten an</div></div><label class="sw"><input type="checkbox" id="show_views" ${c.show_views?"checked":""}><span class="sl"></span></label></div>
  </div>

  <!-- ERWEITERT -->
  <div class="sec" id="sec-advanced">
    <p class="st" style="margin-top:0">SEO & Social Preview</p>
    <div class="fi"><label>Seitentitel (Browser-Tab)</label><input type="text" id="meta_title" value="${c.meta_title||""}" placeholder="${c.username||"username"} — bio"></div>
    <div class="fi"><label>Beschreibung (für Link-Previews)</label><input type="text" id="meta_description" value="${c.meta_description||""}" placeholder="deine kurze bio..."></div>
    <p class="st">Custom CSS</p>
    <p style="font-family:'Space Mono',monospace;font-size:11px;color:var(--m);margin-bottom:10px;">Eigenes CSS direkt in die Bio-Seite injizieren. Für Fortgeschrittene.</p>
    <div class="fi"><textarea id="custom_css" rows="6" placeholder="/* z.B. */&#10;.card { border-color: red !important; }&#10;.name { text-shadow: 0 0 20px var(--a); }">${c.custom_css||""}</textarea></div>
  </div>

  <!-- SICHERHEIT -->
  <div class="sec" id="sec-security">
    <p class="st" style="margin-top:0">Passwort ändern</p>
    <div class="fi"><label>Neues Passwort</label><input type="password" id="newPassword" placeholder="leer lassen = nicht ändern"></div>
    <div class="fi"><label>Bestätigen</label><input type="password" id="confirmPassword" placeholder="wiederholen"></div>
  </div>

  <button class="sbtn" onclick="save()">Speichern & live schalten ✓</button>
</main>
<div class="toast" id="toast">Gespeichert! ✓</div>

<script>
let badges=${JSON.stringify(c.badges||[])};
let links=${JSON.stringify(c.links||[])};
let currentLS="${c.link_style||"default"}";
let currentAB="${c.avatar_border||"circle"}";
const IL=["discord","instagram","twitter","youtube","twitch","tiktok","github","steam","link"];
const titles={templates:"Templates",profile:"Profil",design:"Design",background:"Hintergrund",links:"Links",effects:"Effekte",advanced:"Erweitert",security:"Sicherheit"};
const TEMPLATES=${JSON.stringify(TEMPLATES)};

function show(id,btn){
  document.querySelectorAll(".sec").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".ni").forEach(b=>b.classList.remove("active"));
  document.getElementById("sec-"+id).classList.add("active");
  btn.classList.add("active");
  document.getElementById("pt").textContent=titles[id]||id;
}

function applyTemplate(key){
  const t=TEMPLATES[key];
  if(!t)return;
  // Apply all template fields to form
  document.getElementById("accent").value=t.accent;document.getElementById("accent_h").value=t.accent;
  document.getElementById("text_color").value=t.text_color;document.getElementById("text_color_h").value=t.text_color;
  document.getElementById("font").value=t.font;
  document.getElementById("card_style").value=t.card_style;
  document.getElementById("card_blur").checked=t.card_blur;
  document.getElementById("bg_type").value=t.bg_type;
  document.getElementById("bg_color").value=t.bg_color;document.getElementById("bg_color_h").value=t.bg_color;
  document.getElementById("bg_gradient_from").value=t.bg_gradient_from;document.getElementById("bg_gradient_from_h").value=t.bg_gradient_from;
  document.getElementById("bg_gradient_to").value=t.bg_gradient_to;document.getElementById("bg_gradient_to_h").value=t.bg_gradient_to;
  document.getElementById("bg_gradient_angle").value=t.bg_gradient_angle;
  document.getElementById("bg_pattern").value=t.bg_pattern;
  document.getElementById("bg_animated").checked=t.bg_animated;
  document.getElementById("avatar_glow").checked=t.avatar_glow;
  setLS(t.link_style);setAB(t.avatar_border);
  updBg();
  document.querySelectorAll(".tpl-card").forEach((el,i)=>el.classList.toggle("active-tpl",Object.keys(TEMPLATES)[i]===key));
  // Flash feedback
  const t2=document.getElementById("toast");
  t2.textContent="Template angewendet! ✓";t2.classList.add("show");
  setTimeout(()=>{t2.classList.remove("show");t2.textContent="Gespeichert! ✓"},2000);
}

function setLS(s){
  currentLS=s;document.getElementById("link_style").value=s;
  document.querySelectorAll(".ls-opt").forEach(el=>el.classList.toggle("active",el.textContent===s));
}
function setAB(s){
  currentAB=s;document.getElementById("avatar_border").value=s;
  document.querySelectorAll(".ab-opt").forEach((el,i)=>el.classList.toggle("active",["circle","rounded","square","none"][i]===s));
}
function toggleAv(){const t=document.getElementById("avatar_type").value;document.getElementById("ef").style.display=t==="emoji"?"":"none";document.getElementById("uf").style.display=t==="image"?"":"none"}
function syncH(id){document.getElementById(id+"_h").value=document.getElementById(id).value}
function updBg(){
  const t=document.getElementById("bg_type").value;
  ["bgf-solid","bgf-gradient","bgf-image"].forEach(f=>document.getElementById(f).style.display="none");
  document.getElementById("bgf-"+t).style.display="";
  const p=document.getElementById("bgp");
  if(t==="solid"){const v=document.getElementById("bg_color").value;document.getElementById("bg_color_h").value=v;p.style.background=v;}
  else if(t==="gradient"){const f=document.getElementById("bg_gradient_from").value,to=document.getElementById("bg_gradient_to").value,a=document.getElementById("bg_gradient_angle").value||135;document.getElementById("bg_gradient_from_h").value=f;document.getElementById("bg_gradient_to_h").value=to;p.style.background="linear-gradient("+a+"deg,"+f+","+to+")";}
  else{p.style.background="#1a1a1a";}
}
function renderB(){document.getElementById("bw").innerHTML=badges.map((b,i)=>'<span class="bt">'+b+'<button onclick="rmB('+i+')" title="×">×</button></span>').join("")}
function addB(){const i=document.getElementById("bi"),v=i.value.trim();if(!v)return;badges.push(v);i.value="";renderB()}
function rmB(i){badges.splice(i,1);renderB()}
function renderL(){
  document.getElementById("ll").innerHTML=links.map((l,i)=>`
    <div class="li2">
      <div class="lr1">
        <input type="text" placeholder="Label" value="${"${l.label||""}"}" onchange="links[${i}].label=this.value">
        <select onchange="links[${i}].icon=this.value">${IL.map(ic=>'<option value="'+ic+'" '+(l.icon===ic?'selected':'')+'>'+ic+'</option>').join("")}</select>
        <button class="db" onclick="rmL(${i})">×</button>
      </div>
      <div class="lr2">
        <input type="url" placeholder="https://..." value="${"${l.url||""}"}" onchange="links[${i}].url=this.value">
        <div class="lcs"><input type="color" value="${"${l.color||"#ffffff"}"}" oninput="links[${i}].color=this.value" title="Farbe"></div>
      </div>
    </div>`).join("")
}
function addL(){links.push({label:"Neuer Link",url:"",icon:"link",color:"#ffffff"});renderL()}
function rmL(i){links.splice(i,1);renderL()}
async function save(){
  const pw=document.getElementById("newPassword").value,pw2=document.getElementById("confirmPassword").value;
  if(pw&&pw!==pw2){alert("Passwörter stimmen nicht überein!");return}
  const data={
    username:document.getElementById("username").value,
    pronouns:document.getElementById("pronouns").value,
    avatar_type:document.getElementById("avatar_type").value,
    avatar_emoji:document.getElementById("avatar_emoji").value,
    avatar_url:document.getElementById("avatar_url").value,
    avatar_border:document.getElementById("avatar_border").value,
    avatar_glow:document.getElementById("avatar_glow").checked,
    bio:document.getElementById("bio").value,
    badges,status:document.getElementById("status").value,
    accent:document.getElementById("accent").value,
    text_color:document.getElementById("text_color").value,
    font:document.getElementById("font").value,
    card_style:document.getElementById("card_style").value,
    card_blur:document.getElementById("card_blur").checked,
    link_style:document.getElementById("link_style").value,
    bg_type:document.getElementById("bg_type").value,
    bg_color:document.getElementById("bg_color").value,
    bg_gradient_from:document.getElementById("bg_gradient_from").value,
    bg_gradient_to:document.getElementById("bg_gradient_to").value,
    bg_gradient_angle:document.getElementById("bg_gradient_angle").value,
    bg_image_url:document.getElementById("bg_image_url").value,
    bg_pattern:document.getElementById("bg_pattern").value,
    bg_animated:document.getElementById("bg_animated").checked,
    show_particles:document.getElementById("show_particles").checked,
    cursor_glow:document.getElementById("cursor_glow").checked,
    show_views:document.getElementById("show_views").checked,
    spotify_url:document.getElementById("spotify_url").value,
    meta_title:document.getElementById("meta_title").value,
    meta_description:document.getElementById("meta_description").value,
    custom_css:document.getElementById("custom_css").value,
    links,newPassword:pw
  };
  const r=await fetch("/admin/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  if(r.ok){const t=document.getElementById("toast");t.textContent="Gespeichert! ✓";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
}
updBg();renderB();renderL();
</script>
</body></html>`);
});

app.post("/admin/save", requireAuth, async (req, res) => {
  const current = await getConfig();
  const { newPassword, ...fields } = req.body;
  const updated = { ...current, ...fields, password: newPassword ? await bcrypt.hash(newPassword, 10) : current.password };
  await saveConfig(updated);
  res.json({ ok: true });
});

app.get("/admin/logout", (req, res) => { req.session.destroy(); res.redirect("/admin"); });

initDB().then(() => app.listen(PORT, () => console.log("Server läuft auf Port", PORT))).catch(err => { console.error("DB Init Fehler:", err); process.exit(1); });
