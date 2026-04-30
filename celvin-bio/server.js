const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use(session({ secret: process.env.SESSION_SECRET || "celvin-secret-2024", resave: false, saveUninitialized: false, cookie: { maxAge: 86400000 } }));

const PLATFORMS = {
  discord:   { name: "Discord",     color: "#5865F2", placeholder: "username (z.B. snowtulip)", url: "", clickable: false },
  instagram: { name: "Instagram",   color: "#E1306C", placeholder: "username",        url: "https://instagram.com/{u}" },
  twitter:   { name: "Twitter / X", color: "#e8e8e8", placeholder: "username",        url: "https://x.com/{u}" },
  youtube:   { name: "YouTube",     color: "#FF0000", placeholder: "Kanalname",       url: "https://youtube.com/@{u}" },
  twitch:    { name: "Twitch",      color: "#9146FF", placeholder: "username",        url: "https://twitch.tv/{u}" },
  tiktok:    { name: "TikTok",      color: "#ff0050", placeholder: "username",        url: "https://tiktok.com/@{u}" },
  github:    { name: "GitHub",      color: "#c9d1d9", placeholder: "username",        url: "https://github.com/{u}" },
  steam:     { name: "Steam",       color: "#66c0f4", placeholder: "username",        url: "https://steamcommunity.com/id/{u}" },
  spotify:   { name: "Spotify",     color: "#1DB954", placeholder: "username",        url: "https://open.spotify.com/user/{u}" },
  snapchat:  { name: "Snapchat",    color: "#FFFC00", placeholder: "username",        url: "https://snapchat.com/add/{u}" },
  reddit:    { name: "Reddit",      color: "#FF4500", placeholder: "username",        url: "https://reddit.com/u/{u}" },
  link:      { name: "Custom Link", color: "#888888", placeholder: "https://...",     url: "{u}" },
};

const TEMPLATES = {
  dark:      { name: "Dark Classic",     accent: "#c8ff00", bg_type: "solid",    bg_color: "#0a0a0a", bg_gradient_from: "#0a0a0a", bg_gradient_to: "#111827", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none",  bg_animated: false, card_style: "dark",  card_blur: false, font: "Syne",           text_color: "#e8e8e8", link_style: "default", avatar_border: "circle", avatar_glow: false },
  cyberpunk: { name: "Cyberpunk",        accent: "#ff0090", bg_type: "solid",    bg_color: "#0a0010", bg_gradient_from: "#0a0010", bg_gradient_to: "#0a0010", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "grid",  bg_animated: false, card_style: "glass", card_blur: true,  font: "Oxanium",        text_color: "#f0e6ff", link_style: "neon",    avatar_border: "square", avatar_glow: true  },
  hacker:    { name: "Hacker",           accent: "#00ff41", bg_type: "solid",    bg_color: "#000000", bg_gradient_from: "#000000", bg_gradient_to: "#000000", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "dots",  bg_animated: false, card_style: "dark",  card_blur: false, font: "Share Tech Mono",text_color: "#00ff41", link_style: "minimal", avatar_border: "none",   avatar_glow: true  },
  ocean:     { name: "Ocean",            accent: "#00d4ff", bg_type: "gradient", bg_color: "#020b18", bg_gradient_from: "#020b18", bg_gradient_to: "#0a1628", bg_gradient_angle: "160", bg_image_url: "", bg_pattern: "none",  bg_animated: true,  card_style: "glass", card_blur: true,  font: "Outfit",         text_color: "#e0f4ff", link_style: "filled",  avatar_border: "circle", avatar_glow: false },
  sunset:    { name: "Sunset",           accent: "#ff6b35", bg_type: "gradient", bg_color: "#1a0a00", bg_gradient_from: "#1a0510", bg_gradient_to: "#0d0a1a", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none",  bg_animated: true,  card_style: "glass", card_blur: true,  font: "Syne",           text_color: "#ffe8d6", link_style: "filled",  avatar_border: "circle", avatar_glow: false },
  minimal:   { name: "Minimal",          accent: "#6366f1", bg_type: "solid",    bg_color: "#fafafa", bg_gradient_from: "#fafafa", bg_gradient_to: "#f0f0f0", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none",  bg_animated: false, card_style: "light", card_blur: false, font: "DM Sans",        text_color: "#111111", link_style: "default", avatar_border: "circle", avatar_glow: false },
  neon:      { name: "Neon Pink",        accent: "#ff2d78", bg_type: "solid",    bg_color: "#070010", bg_gradient_from: "#070010", bg_gradient_to: "#070010", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "dots",  bg_animated: false, card_style: "dark",  card_blur: false, font: "Rajdhani",       text_color: "#ffe0ee", link_style: "neon",    avatar_border: "circle", avatar_glow: true  },
  glass:     { name: "Glassmorphism",    accent: "#ffffff", bg_type: "gradient", bg_color: "#1a1a2e", bg_gradient_from: "#1a1a2e", bg_gradient_to: "#16213e", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none",  bg_animated: true,  card_style: "glass", card_blur: true,  font: "Inter",          text_color: "#ffffff", link_style: "pill",    avatar_border: "circle", avatar_glow: false },
};

const DEFAULT_CONFIG = {
  username: "username", pronouns: "", avatar_type: "emoji", avatar_emoji: "🖤", avatar_url: "",
  bio: "your bio goes here.\nmake it short. make it yours.",
  badges: ["online", "de", "since 2024"], status: "online",
  ...TEMPLATES.dark,
  links: [
    { platform: "discord",   username: "yourinvite",  custom_url: "" },
    { platform: "instagram", username: "yourusername",custom_url: "" },
    { platform: "twitter",   username: "yourusername",custom_url: "" },
  ],
  spotify_url: "", audio_url: "", audio_autoplay: false, audio_loop: true, audio_volume: 0.5, audio_title: "", bg_video_url: "", bg_overlay_opacity: 0.3, bg_blur_amount: 0, card_shadow: true, show_song_widget: false, custom_css: "", meta_title: "", meta_description: "", views: 0, password: ""
};

async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS bio_config (id SERIAL PRIMARY KEY, data JSONB NOT NULL DEFAULT '{}')`);
  const { rows } = await pool.query("SELECT id FROM bio_config LIMIT 1");
  if (rows.length === 0) {
    const d = { ...DEFAULT_CONFIG, password: await bcrypt.hash("admin123", 10) };
    await pool.query("INSERT INTO bio_config (data) VALUES ($1)", [d]);
  }
}
async function getConfig() {
  const { rows } = await pool.query("SELECT data FROM bio_config LIMIT 1");
  const data = { ...DEFAULT_CONFIG, ...(rows[0]?.data || {}) };
  if (Array.isArray(data.links)) {
    data.links = data.links.map(l => l.platform ? l : { platform: l.icon||"link", username: l.label||"", custom_url: l.url||"" });
  }
  return data;
}
async function saveConfig(data) { await pool.query("UPDATE bio_config SET data = $1", [data]); }
function requireAuth(req, res, next) { if (req.session.authenticated) return next(); res.redirect("/admin"); }

const ICONS = {
  discord:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.077.077 0 0 0 .033.056 19.9 19.9 0 0 0 5.993 3.03.079.079 0 0 0 .085-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  twitter:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  youtube:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  twitch:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
  tiktok:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  github:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  steam:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/></svg>`,
  spotify:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
  snapchat:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.045-.134-.045-.209.015-.24.195-.449.45-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.031-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>`,
  reddit:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
  link:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
};

function getLinkUrl(link) {
  const p = PLATFORMS[link.platform] || PLATFORMS.link;
  if (link.custom_url) return link.custom_url;
  if (!p.url) return null;
  return p.url.replace("{u}", link.username || "");
}

function renderBioPage(c) {
  const bg = c.bg_type === "gradient"
    ? `linear-gradient(${c.bg_gradient_angle||135}deg, ${c.bg_gradient_from}, ${c.bg_gradient_to})`
    : c.bg_type === "image" ? `url('${c.bg_image_url}') center/cover no-repeat fixed`
    : c.bg_type === "video" ? "transparent"
    : (c.bg_color||"#0a0a0a");
  const bgVideoHtml = c.bg_type === "video" && c.bg_video_url ? `<video autoplay loop muted playsinline style="position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;"><source src="${c.bg_video_url}"></video><div style="position:fixed;inset:0;background:rgba(0,0,0,${c.bg_overlay_opacity||0.3});z-index:-1;"></div>` : "";
  const cardBg = c.card_style==="glass" ? "rgba(255,255,255,0.06)" : c.card_style==="light" ? "rgba(255,255,255,0.96)" : "rgba(17,17,17,0.95)";
  const cardBorder = c.card_style==="glass" ? "rgba(255,255,255,0.12)" : c.card_style==="light" ? "rgba(0,0,0,0.08)" : "#1e1e1e";
  const cardBlur = c.card_blur ? "backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);" : "";
  const avatarRadius = c.avatar_border==="square" ? "10px" : c.avatar_border==="rounded" ? "30px" : c.avatar_border==="none" ? "8px" : "50%";
  const avatarGlow = c.avatar_glow ? `box-shadow:0 0 20px color-mix(in srgb,${c.accent||"#c8ff00"} 50%,transparent),0 0 40px color-mix(in srgb,${c.accent||"#c8ff00"} 20%,transparent);` : "";
  const avatar = c.avatar_type==="image" && c.avatar_url ? `<img src="${c.avatar_url}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:2.2rem">${c.avatar_emoji||"🖤"}</span>`;
  const statusColors = {online:"#22c55e",idle:"#f59e0b",dnd:"#ef4444",offline:"#6b7280"};
  const badges = (c.badges||[]).map((b,i)=>`<span class="badge ${i===0?"accent":""}">${b}</span>`).join("");
  const bioLines = (c.bio||"").split("\n").map(l=>`<span>${l}</span>`).join("<br>");
  const linkStyle = c.link_style || "default";

  const links = (c.links||[]).map(l => {
    const p = PLATFORMS[l.platform] || PLATFORMS.link;
    const url = getLinkUrl(l);
    const display = l.username || p.name;
    const color = p.color;
    const isLink = url && !p.clickable;
    const tag = isLink ? "a" : "div";
    const hrefAttr = isLink ? `href="${url}" target="_blank"` : "";
    let style = isLink ? "" : "cursor:default;";
    if(isLink && linkStyle==="filled") style += `background:${color};border-color:${color};color:#000;`;
    if(isLink && linkStyle==="neon") style += `border-color:${color};box-shadow:0 0 10px color-mix(in srgb,${color} 30%,transparent);`;
    if(linkStyle==="pill") style += `border-radius:999px;`;
    if(linkStyle==="minimal") style += `border-color:transparent;`;
    const arrowHtml = isLink ? `<span class="arr">↗</span>` : "";
    return `<${tag} ${hrefAttr} class="link-btn ls-${linkStyle}" style="--lc:${color};${style}">
      <span class="li" style="color:${isLink&&linkStyle==="filled"?"#000":color}">${ICONS[l.platform]||ICONS.link}</span>
      <span class="link-label">
        <span class="link-platform">${p.name}</span>
        <span class="link-username">${display}</span>
      </span>
      ${arrowHtml}
    </${tag}>`;
  }).join("");

  const spotify = c.spotify_url ? `<div style="margin-top:1rem"><iframe src="${c.spotify_url.replace("open.spotify.com/track","open.spotify.com/embed/track").replace("open.spotify.com/playlist","open.spotify.com/embed/playlist")}" width="100%" height="80" frameborder="0" allow="encrypted-media" style="border-radius:12px;"></iframe></div>` : "";
  const audioWidget = c.audio_url ? `
    <div class="audio-widget" id="aw">
      <audio id="bgAudio" ${c.audio_autoplay?"autoplay":""} ${c.audio_loop?"loop":""} preload="none">
        <source src="${c.audio_url}" type="${c.audio_url&&c.audio_url.startsWith("data:")?c.audio_url.split(";")[0].replace("data:",""):(c.audio_url||"").endsWith(".ogg")?"audio/ogg":(c.audio_url||"").endsWith(".wav")?"audio/wav":"audio/mpeg"}">
      </audio>
      <div class="aw-inner">
        <button class="aw-play" id="awPlay" onclick="toggleAudio()">
          <svg id="awIconPlay" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
          <svg id="awIconPause" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <div class="aw-info">
          <span class="aw-title">${c.audio_title || "♫ now playing"}</span>
          <div class="aw-bars" id="awBars">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="aw-vol">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <input type="range" id="awVol" min="0" max="1" step="0.05" value="${c.audio_volume||0.5}" oninput="document.getElementById('bgAudio').volume=this.value" style="width:90px;accent-color:var(--a)">
        </div>
      </div>
    </div>
    <style>
    .audio-widget{position:fixed;bottom:1.5rem;right:1.5rem;z-index:100;animation:fu .6s cubic-bezier(.16,1,.3,1) both .3s;}
    .aw-inner{display:flex;align-items:center;gap:10px;background:color-mix(in srgb,var(--bg,#0a0a0a) 80%,transparent);backdrop-filter:blur(12px);border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:999px;padding:8px 14px;}
    .aw-play{background:none;border:none;color:var(--a);cursor:pointer;display:flex;align-items:center;padding:0;flex-shrink:0;}
    .aw-info{display:flex;flex-direction:column;gap:3px;}
    .aw-title{font-family:'Space Mono',monospace;font-size:9px;color:var(--t);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;}
    .aw-bars{display:flex;align-items:flex-end;gap:2px;height:12px;}
    .aw-bars span{width:2px;background:var(--a);border-radius:1px;animation:bar 0.8s ease-in-out infinite;opacity:0.7;}
    .aw-bars span:nth-child(1){height:4px;animation-delay:0s;}
    .aw-bars span:nth-child(2){height:10px;animation-delay:.1s;}
    .aw-bars span:nth-child(3){height:7px;animation-delay:.2s;}
    .aw-bars span:nth-child(4){height:12px;animation-delay:.3s;}
    .aw-bars span:nth-child(5){height:5px;animation-delay:.4s;}
    @keyframes bar{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}
    .aw-bars.paused span{animation-play-state:paused;}
    .aw-vol{display:flex;align-items:center;gap:4px;color:var(--m);}
    input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:color-mix(in srgb,var(--t) 20%,transparent);outline:none;}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border-radius:50%;background:var(--a);cursor:pointer;}
    </style>
    <script>
    var _aud=document.getElementById('bgAudio');
    var _bars=document.getElementById('awBars');
    _aud.volume=${c.audio_volume||0.5};
    function _setPlaying(on){document.getElementById('awIconPlay').style.display=on?'none':'';document.getElementById('awIconPause').style.display=on?'':'none';_bars.classList.toggle('paused',!on);}
    function toggleAudio(){if(_aud.paused){_aud.play().then(function(){_setPlaying(true);}).catch(function(){});}else{_aud.pause();_setPlaying(false);}}
    _aud.addEventListener('play',function(){_setPlaying(true);});
    _aud.addEventListener('pause',function(){_setPlaying(false);});
    function _tryPlay(){_aud.play().then(function(){_setPlaying(true);}).catch(function(){function _oi(){_aud.play().then(function(){_setPlaying(true);});document.removeEventListener('click',_oi);document.removeEventListener('touchstart',_oi);}document.addEventListener('click',_oi,{once:true});document.addEventListener('touchstart',_oi,{once:true});});}
    if(document.readyState==='complete'){_tryPlay();}else{window.addEventListener('load',_tryPlay);}
    <\/script>` : "";
  const patternCSS = c.bg_pattern==="dots" ? `body::after{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,${c.accent||"#c8ff00"}15 1px,transparent 1px);background-size:24px 24px;pointer-events:none;z-index:0;}`
    : c.bg_pattern==="grid" ? `body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(${c.accent||"#c8ff00"}0f 1px,transparent 1px),linear-gradient(90deg,${c.accent||"#c8ff00"}0f 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}`
    : c.bg_pattern==="lines" ? `body::after{content:'';position:fixed;inset:0;background-image:repeating-linear-gradient(0deg,${c.accent||"#c8ff00"}08 0px,${c.accent||"#c8ff00"}08 1px,transparent 1px,transparent 40px);pointer-events:none;z-index:0;}` : "";
  const animBg = c.bg_animated && c.bg_type==="gradient" ? `@keyframes bgShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}body{background-size:300% 300%!important;animation:bgShift 8s ease infinite;}` : "";
  const particles = c.show_particles ? `<canvas id="pc" style="position:fixed;inset:0;pointer-events:none;z-index:0;"></canvas><script>(function(){const c=document.getElementById("pc"),x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;const p=Array.from({length:60},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.5+.5,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3}));function d(){x.clearRect(0,0,c.width,c.height);p.forEach(i=>{i.x+=i.vx;i.y+=i.vy;if(i.x<0||i.x>c.width)i.vx*=-1;if(i.y<0||i.y>c.height)i.vy*=-1;x.beginPath();x.arc(i.x,i.y,i.r,0,Math.PI*2);x.fillStyle="${c.accent||"#c8ff00"}55";x.fill()});requestAnimationFrame(d)}d();window.addEventListener("resize",()=>{c.width=innerWidth;c.height=innerHeight})})()<\/script>` : "";
  const glow = c.cursor_glow ? `<div id="gl" style="position:fixed;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${c.accent||"#c8ff00"}0d 0%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);left:-999px;top:-999px;"></div><script>document.addEventListener("mousemove",e=>{const g=document.getElementById("gl");g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";})<\/script>` : "";
  const views = c.show_views ? `<p style="font-family:'Space Mono',monospace;font-size:10px;color:color-mix(in srgb,${c.text_color||"#e8e8e8"} 25%,transparent);margin-top:1rem;text-align:center;">${c.views||0} views</p>` : "";
  const customCSS = c.custom_css ? `<style>${c.custom_css}</style>` : "";
  const metaTitle = c.meta_title || c.username || "bio";
  const metaDesc = c.meta_description || (c.bio||"").split("\n")[0] || "";

  return `<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${metaTitle}</title>
<meta name="description" content="${metaDesc}">
<meta property="og:title" content="${metaTitle}"><meta property="og:description" content="${metaDesc}">
${c.avatar_url?`<meta property="og:image" content="${c.avatar_url}">`:""}
<link href="https://fonts.googleapis.com/css2?family=${(c.font||"Syne").replace(/ /g,"+")}:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--a:${c.accent||"#c8ff00"};--t:${c.text_color||"#e8e8e8"};--m:color-mix(in srgb,var(--t) 35%,transparent)}
body{background:${bg};color:var(--t);font-family:'${c.font||"Syne"}',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1rem;overflow-x:hidden;position:relative;}
${patternCSS}${animBg}
.card{position:relative;z-index:1;width:100%;max-width:440px;background:${cardBg};border:1px solid ${cardBorder};border-radius:24px;padding:2.5rem 2rem 2rem;${cardBlur}animation:fu .6s cubic-bezier(.16,1,.3,1) both}
@keyframes fu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.av{display:flex;justify-content:center;margin-bottom:1.2rem}
.avi{width:90px;height:90px;border-radius:${avatarRadius};border:2px solid color-mix(in srgb,var(--a) 40%,transparent);background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;${avatarGlow}}
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
.ls-minimal{border-color:transparent!important}
.ls-minimal:hover{background:color-mix(in srgb,var(--lc,var(--a)) 8%,transparent)!important}
.li{width:20px;height:20px;flex-shrink:0}.li svg{width:100%;height:100%}
.link-label{display:flex;flex-direction:column;gap:1px;min-width:0;}
.link-platform{font-size:10px;font-weight:400;color:var(--m);font-family:'Space Mono',monospace;letter-spacing:.03em;text-transform:uppercase;}
.link-username{font-size:.9rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.arr{margin-left:auto;font-size:.75rem;color:var(--m);transition:color .2s;flex-shrink:0}
.link-btn:hover .arr{color:var(--lc,var(--a))}
</style>${customCSS}
</head><body>
${bgVideoHtml}${particles}${glow}
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
${audioWidget}${views}
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
        <div class="tpl-ci" style="background:${t.card_style==="glass"?"rgba(255,255,255,0.08)":t.card_style==="light"?"rgba(255,255,255,0.95)":"rgba(17,17,17,0.9)"};border:1px solid ${t.card_style==="glass"?"rgba(255,255,255,0.15)":"#2a2a2a"};">
          <div class="tpl-dot" style="background:${t.accent};${t.avatar_border==="square"?"border-radius:4px":t.avatar_border==="none"?"border-radius:2px":"border-radius:50%"};${t.avatar_glow?`box-shadow:0 0 6px ${t.accent}`:""}"></div>
          <div class="tpl-line" style="background:${t.accent};width:40px;"></div>
          <div class="tpl-line" style="background:color-mix(in srgb,${t.text_color} 30%,transparent);width:55px;"></div>
          <div class="tpl-btn" style="border-color:${t.link_style==="filled"?t.accent:t.link_style==="neon"?t.accent:"rgba(255,255,255,0.15)"};background:${t.link_style==="filled"?t.accent:"transparent"};border-radius:${t.link_style==="pill"?"999px":"6px"};${t.link_style==="neon"?`box-shadow:0 0 4px ${t.accent}`:""}"></div>
          <div class="tpl-btn" style="border-color:${t.link_style==="filled"?t.accent:t.link_style==="neon"?t.accent:"rgba(255,255,255,0.15)"};background:${t.link_style==="filled"?t.accent:"transparent"};border-radius:${t.link_style==="pill"?"999px":"6px"}"></div>
        </div>
      </div>
      <span>${t.name}</span>
    </div>`).join("");

  const platformsJson = JSON.stringify(PLATFORMS);

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
.ndv{height:1px;background:var(--b);margin:8px 0;}
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
.upload-btn{background:var(--s2);border:1px solid var(--b2);border-radius:10px;color:var(--t);font-family:'Space Mono',monospace;font-size:12px;padding:8px 14px;cursor:pointer;transition:border-color .2s;white-space:nowrap;}
.upload-btn:hover{border-color:var(--a);}
/* Templates */
.tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-bottom:8px}
.tpl-card{cursor:pointer;border-radius:12px;overflow:hidden;border:2px solid var(--b2);transition:border-color .2s,transform .15s;font-size:11px;font-family:'Space Mono',monospace;color:var(--m);}
.tpl-card:hover{border-color:var(--a);transform:translateY(-2px);color:var(--t)}
.tpl-preview{height:80px;padding:8px;display:flex;align-items:center;justify-content:center;}
.tpl-ci{border-radius:8px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;width:64px;}
.tpl-dot{width:16px;height:16px;margin-bottom:2px;}
.tpl-line{height:3px;border-radius:999px;}
.tpl-btn{width:100%;height:7px;border:1px solid;border-radius:4px;}
.tpl-card span{display:block;text-align:center;padding:5px 4px;}
/* Link styles */
.ls-preview{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.ls-opt{padding:8px 14px;border-radius:8px;border:1px solid var(--b2);font-size:12px;font-family:'Space Mono',monospace;cursor:pointer;transition:all .15s;color:var(--m);background:transparent;}
.ls-opt:hover,.ls-opt.active{border-color:var(--a);color:var(--a);background:color-mix(in srgb,var(--a) 10%,transparent)}
/* Avatar */
.ab-preview{display:flex;gap:10px;margin-top:8px}
.ab-opt{width:44px;height:44px;background:var(--b2);display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;transition:border-color .15s;font-size:18px}
.ab-opt:hover,.ab-opt.active{border-color:var(--a)}

/* ===== SOCIALS SECTION ===== */
.platform-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
.pp-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;background:var(--bg);border:1px solid var(--b2);border-radius:12px;cursor:pointer;transition:all .15s;font-family:'Space Mono',monospace;font-size:10px;color:var(--m);}
.pp-btn:hover{border-color:var(--a);color:var(--t);transform:translateY(-1px);}
.pp-btn svg{width:22px;height:22px;}
.social-list{display:flex;flex-direction:column;gap:10px;}
.social-item{background:var(--bg);border:1px solid var(--b2);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;transition:border-color .15s;}
.social-item:hover{border-color:var(--b2)}
.si-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.si-icon svg{width:20px;height:20px;}
.si-body{flex:1;min-width:0;}
.si-platform{font-family:'Space Mono',monospace;font-size:10px;color:var(--m);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;}
.si-input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--b2);border-radius:0;color:var(--t);font-family:'Syne',sans-serif;font-size:.9rem;font-weight:700;padding:4px 0;outline:none;transition:border-color .2s;}
.si-input:focus{border-color:var(--a);}
.si-del{width:32px;height:32px;background:transparent;border:1px solid var(--b2);border-radius:8px;color:var(--m);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;}
.si-del:hover{color:#ef4444;border-color:#ef4444;}
.si-extra{margin-top:8px;display:none;}
.si-extra.show{display:block;}
.si-extra input{font-size:12px;padding:6px 10px;}
</style>
</head><body>
<nav class="sidebar">
  <div class="logo">cel<span>vin</span>.rip</div>
  <button class="ni active" data-section="templates"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Templates</button>
  <button class="ni" data-section="profile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>Profil</button>
  <button class="ni" data-section="design"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>Design</button>
  <button class="ni" data-section="background"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>Hintergrund</button>
  <button class="ni" data-section="links"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Socials</button>
  <button class="ni" data-section="effects"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Effekte</button>
  <div class="ndv"></div>
  <button class="ni" data-section="advanced"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Erweitert</button>
  <button class="ni" data-section="security"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Sicherheit</button>
  <div class="sf"><a href="/admin/logout" class="lb"><svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</a></div>
</nav>

<main class="main">
  <div class="ph"><h1 class="pt" id="pt">Templates</h1><div class="pbtns"><a href="/" target="_blank" class="pb">→ Vorschau</a><button class="pb" onclick="save()">✓ Speichern</button></div></div>

  <!-- TEMPLATES -->
  <div class="sec active" id="sec-templates">
    <p class="st" style="margin-top:0">Fertige Designs – klick zum Anwenden</p>
    <div class="tpl-grid">${templateCards}</div>
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
        <option value="image" ${c.avatar_type==="image"?"selected":""}>Bild</option>
      </select></div>
      <div class="fi" id="ef" style="${c.avatar_type==="image"?"display:none":""}"><label>Emoji</label><input type="text" id="avatar_emoji" value="${c.avatar_emoji||"🖤"}"></div>
      <div class="fi" id="uf" style="${c.avatar_type!=="image"?"display:none":""}">
        <label>Profilbild</label>
        <input type="file" id="avatar_file" accept="image/*" style="display:none" onchange="handleImgUpload(this,'avatar_url','avatar_preview','avatar_filename')">
        <div style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="upload-btn" onclick="document.getElementById('avatar_file').click()">📁 Datei wählen</button>
          <span id="avatar_filename" style="font-family:'Space Mono',monospace;font-size:11px;color:var(--m);">${c.avatar_url?"✓ Bild gesetzt":"Keine Datei"}</span>
        </div>
        <img id="avatar_preview" src="${c.avatar_url||""}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-top:10px;border:2px solid var(--b2);display:${c.avatar_url?"block":"none"}">
        <input type="hidden" id="avatar_url" value="${c.avatar_url||""}">
        <div style="margin-top:8px;"><label style="margin-bottom:4px;display:block;">oder URL eingeben</label><input type="url" id="avatar_url_text" placeholder="https://..." value="${c.avatar_url&&!c.avatar_url.startsWith("data:")?c.avatar_url:""}" oninput="document.getElementById('avatar_url').value=this.value;document.getElementById('avatar_preview').src=this.value;document.getElementById('avatar_preview').style.display=this.value?'block':'none';" style="width:100%;"></div>
      </div>
    </div>
    <p class="st">Avatar Rahmen</p>
    <div class="ab-preview">
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
        <optgroup label="Modern">
        <option value="Syne" ${c.font==="Syne"?"selected":""}>Syne</option>
        <option value="Inter" ${c.font==="Inter"?"selected":""}>Inter</option>
        <option value="Outfit" ${c.font==="Outfit"?"selected":""}>Outfit</option>
        <option value="DM Sans" ${c.font==="DM Sans"?"selected":""}>DM Sans</option>
        <option value="Poppins" ${c.font==="Poppins"?"selected":""}>Poppins</option>
        <option value="Montserrat" ${c.font==="Montserrat"?"selected":""}>Montserrat</option>
        <option value="Space Grotesk" ${c.font==="Space Grotesk"?"selected":""}>Space Grotesk</option>
        </optgroup>
        <optgroup label="Display">
        <option value="Bebas Neue" ${c.font==="Bebas Neue"?"selected":""}>Bebas Neue</option>
        <option value="Abril Fatface" ${c.font==="Abril Fatface"?"selected":""}>Abril Fatface</option>
        <option value="Playfair Display" ${c.font==="Playfair Display"?"selected":""}>Playfair Display</option>
        <option value="Rajdhani" ${c.font==="Rajdhani"?"selected":""}>Rajdhani</option>
        <option value="Oxanium" ${c.font==="Oxanium"?"selected":""}>Oxanium</option>
        <option value="Exo 2" ${c.font==="Exo 2"?"selected":""}>Exo 2</option>
        <option value="Orbitron" ${c.font==="Orbitron"?"selected":""}>Orbitron</option>
        </optgroup>
        <optgroup label="Mono / Code">
        <option value="Share Tech Mono" ${c.font==="Share Tech Mono"?"selected":""}>Share Tech Mono</option>
        <option value="Space Mono" ${c.font==="Space Mono"?"selected":""}>Space Mono</option>
        <option value="Fira Code" ${c.font==="Fira Code"?"selected":""}>Fira Code</option>
        <option value="Press Start 2P" ${c.font==="Press Start 2P"?"selected":""}>Press Start 2P</option>
        </optgroup>
        <optgroup label="Friendly">
        <option value="Comfortaa" ${c.font==="Comfortaa"?"selected":""}>Comfortaa</option>
        <option value="Nunito" ${c.font==="Nunito"?"selected":""}>Nunito</option>
        <option value="Quicksand" ${c.font==="Quicksand"?"selected":""}>Quicksand</option>
        </optgroup>
      </select></div>
      <div class="fi"><label>Karten-Style</label><select id="card_style">
        <option value="dark" ${c.card_style==="dark"?"selected":""}>Dark</option>
        <option value="glass" ${c.card_style==="glass"?"selected":""}>Glassmorphism</option>
        <option value="light" ${c.card_style==="light"?"selected":""}>Light</option>
      </select></div>
    </div>
    <div class="tr"><div><div class="tl">Backdrop Blur</div><div class="td">Glassmorphism-Effekt auf der Karte</div></div><label class="sw"><input type="checkbox" id="card_blur" ${c.card_blur?"checked":""}><span class="sl"></span></label></div>
    <p class="st">Link Button Style</p>
    <div class="ls-preview">
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
      <option value="image" ${c.bg_type==="image"?"selected":""}>Bild</option>
      <option value="video" ${c.bg_type==="video"?"selected":""}>Video URL</option>
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
    <div id="bgf-video" style="${c.bg_type!=="video"?"display:none":""}">
      <div class="fi"><label>Video URL (mp4, webm)</label><input type="url" id="bg_video_url" value="${c.bg_video_url||""}" placeholder="https://...video.mp4"></div>
      <div class="fi"><label>Overlay Deckkraft (0=kein, 1=schwarz)</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="range" id="bg_overlay_opacity" min="0" max="1" step="0.05" value="${c.bg_overlay_opacity||0.3}" style="flex:1;accent-color:var(--a)">
          <span style="font-family:monospace;font-size:12px;color:var(--m);width:30px;">${Math.round((c.bg_overlay_opacity||0.3)*100)}%</span>
        </div>
      </div>
    </div>
    <div id="bgf-image" style="${c.bg_type!=="image"?"display:none":""}">
      <div class="fi"><label>Hintergrundbild</label>
        <input type="file" id="bg_file" accept="image/*" style="display:none" onchange="handleImgUpload(this,'bg_image_url','bg_preview','bg_filename')">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <button type="button" class="upload-btn" onclick="document.getElementById('bg_file').click()">📁 Datei wählen</button>
          <span id="bg_filename" style="font-family:'Space Mono',monospace;font-size:11px;color:var(--m);">${c.bg_image_url?"✓ Bild gesetzt":"Keine Datei"}</span>
        </div>
        <img id="bg_preview" src="${c.bg_image_url||""}" style="width:100%;height:80px;object-fit:cover;border-radius:10px;border:1px solid var(--b2);display:${c.bg_image_url?"block":"none"}">
        <input type="hidden" id="bg_image_url" value="${c.bg_image_url||""}">
        <div style="margin-top:8px;"><label style="margin-bottom:4px;display:block;">oder URL eingeben</label><input type="url" id="bg_url_text" placeholder="https://..." value="${c.bg_image_url&&!c.bg_image_url.startsWith("data:")?c.bg_image_url:""}" oninput="document.getElementById('bg_image_url').value=this.value;document.getElementById('bg_preview').src=this.value;document.getElementById('bg_preview').style.display=this.value?'block':'none';"></div>
      </div>
    </div>
    <p class="st">Muster & Effekte</p>
    <div class="fi"><label>Hintergrund-Muster</label><select id="bg_pattern">
      <option value="none" ${(c.bg_pattern||"none")==="none"?"selected":""}>Keins</option>
      <option value="dots" ${c.bg_pattern==="dots"?"selected":""}>Punkte</option>
      <option value="grid" ${c.bg_pattern==="grid"?"selected":""}>Gitter</option>
      <option value="lines" ${c.bg_pattern==="lines"?"selected":""}>Linien</option>
    </select></div>
    <div class="tr"><div><div class="tl">Animierter Gradient</div><div class="td">Hintergrund bewegt sich (nur bei Gradient)</div></div><label class="sw"><input type="checkbox" id="bg_animated" ${c.bg_animated?"checked":""}><span class="sl"></span></label></div>
  </div>

  <!-- SOCIALS / LINKS -->
  <div class="sec" id="sec-links">
    <p class="st" style="margin-top:0">Platform auswählen</p>
    <div class="platform-picker" id="platformPicker"></div>
    <p class="st">Deine Links</p>
    <div class="social-list" id="socialList"></div>
  </div>

  <!-- EFFEKTE -->
  <div class="sec" id="sec-effects">
    <p class="st" style="margin-top:0">Visuelle Effekte</p>
    <div class="tr"><div><div class="tl">Partikel-Hintergrund</div><div class="td">Schwebende Punkte im Hintergrund</div></div><label class="sw"><input type="checkbox" id="show_particles" ${c.show_particles?"checked":""}><span class="sl"></span></label></div>
    <div class="tr"><div><div class="tl">Cursor Glow</div><div class="td">Leuchtendes Licht folgt dem Mauszeiger</div></div><label class="sw"><input type="checkbox" id="cursor_glow" ${c.cursor_glow?"checked":""}><span class="sl"></span></label></div>
    <div class="tr"><div><div class="tl">Besucherzähler</div><div class="td">Zeigt Seitenaufrufe unten an</div></div><label class="sw"><input type="checkbox" id="show_views" ${c.show_views?"checked":""}><span class="sl"></span></label></div>
    <p class="st">🎵 Hintergrund-Musik</p>
    <div class="fi"><label>Audio URL (mp3, ogg, wav)</label>
      <input type="file" id="audio_file" accept=".mp3,.ogg,.wav,audio/*" style="display:none" onchange="handleAudioUpload(this)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <button type="button" class="upload-btn" onclick="document.getElementById('audio_file').click()">📁 Datei wählen</button>
        <span id="audio_filename" style="font-family:'Space Mono',monospace;font-size:11px;color:var(--m);">${c.audio_url&&c.audio_url.startsWith("data:")?"✓ Datei gesetzt":"Keine Datei gewählt"}</span>
      </div>
      <input type="hidden" id="audio_url" value="${c.audio_url||""}">
      <div style="margin-top:4px;"><label style="margin-bottom:4px;display:block;font-size:11px;opacity:0.6;">oder direkt URL eingeben</label>
      <input type="url" id="audio_url_text" placeholder="https://...song.mp3" value="${c.audio_url&&!c.audio_url.startsWith("data:")?c.audio_url:""}" oninput="document.getElementById('audio_url').value=this.value;document.getElementById('audio_filename').textContent=this.value?'✓ URL gesetzt':'Keine Datei gewählt';" style="width:100%;"></div>
    </div>
    <div class="fi"><label>Song Name (wird angezeigt)</label><input type="text" id="audio_title" value="${c.audio_title||""}" placeholder="♫ Song - Artist"></div>
    <div class="fi"><label>Standard-Lautstärke (0–1)</label>
      <div style="display:flex;align-items:center;gap:10px;">
        <input type="range" id="audio_volume" min="0" max="1" step="0.05" value="${c.audio_volume||0.5}" style="flex:1;accent-color:var(--a)">
        <span style="font-family:monospace;font-size:12px;color:var(--m);width:30px;">${Math.round((c.audio_volume||0.5)*100)}%</span>
      </div>
    </div>
    <div class="tr"><div><div class="tl">Autoplay</div><div class="td">Startet automatisch (Browser blockieren das oft)</div></div><label class="sw"><input type="checkbox" id="audio_autoplay" ${c.audio_autoplay?"checked":""}><span class="sl"></span></label></div>
    <div class="tr"><div><div class="tl">Loop</div><div class="td">Song wiederholt sich</div></div><label class="sw"><input type="checkbox" id="audio_loop" ${c.audio_loop!==false?"checked":""}><span class="sl"></span></label></div>
  </div>

  <!-- ERWEITERT -->
  <div class="sec" id="sec-advanced">
    <p class="st" style="margin-top:0">SEO & Social Preview</p>
    <div class="fi"><label>Seitentitel</label><input type="text" id="meta_title" value="${c.meta_title||""}" placeholder="${c.username||"username"} — bio"></div>
    <div class="fi"><label>Beschreibung</label><input type="text" id="meta_description" value="${c.meta_description||""}"></div>
    <p class="st">Custom CSS</p>
    <div class="fi"><textarea id="custom_css" rows="6" placeholder="/* eigenes CSS */">${c.custom_css||""}</textarea></div>
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
const PLATFORMS = ${platformsJson};
const TEMPLATES = ${JSON.stringify(TEMPLATES)};
const ICONS_SVG = ${JSON.stringify(Object.fromEntries(Object.entries(PLATFORMS).map(([k])=>[k,""])))};

var badges = ${JSON.stringify(c.badges||[])};
var links = (function(){ var r=${JSON.stringify(c.links||[])}; return r.map(function(l){return l.platform?l:{platform:l.icon||"link",username:l.label||"",custom_url:l.url||""};});})()
var currentLS = "${c.link_style||"default"}";
var currentAB = "${c.avatar_border||"circle"}";

const titles={templates:"Templates",profile:"Profil",design:"Design",background:"Hintergrund",links:"Socials",effects:"Effekte",advanced:"Erweitert",security:"Sicherheit"};

// Platform icon SVGs inline
const PICONS = {
  discord:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.077.077 0 0 0 .033.056 19.9 19.9 0 0 0 5.993 3.03.079.079 0 0 0 .085-.026c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>',
  twitter:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  youtube:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  twitch:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>',
  tiktok:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  steam:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/></svg>',
  spotify:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
  snapchat:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.045-.134-.045-.209.015-.24.195-.449.45-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.031-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>',
  reddit:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
};

function navTo(id){
  document.querySelectorAll(".sec").forEach(function(s){s.classList.remove("active");});
  document.querySelectorAll(".ni").forEach(function(b){b.classList.remove("active");});
  var sec=document.getElementById("sec-"+id);
  if(sec)sec.classList.add("active");
  document.getElementById("pt").textContent=titles[id]||id;
}

function applyTemplate(key){
  const t=TEMPLATES[key];if(!t)return;
  const fields=["accent","text_color","font","card_style","bg_type","bg_color","bg_gradient_from","bg_gradient_to","bg_gradient_angle","bg_pattern"];
  fields.forEach(f=>{const el=document.getElementById(f);if(el)el.value=t[f]||"";const h=document.getElementById(f+"_h");if(h)h.value=t[f]||"";});
  document.getElementById("card_blur").checked=t.card_blur;
  document.getElementById("bg_animated").checked=t.bg_animated;
  document.getElementById("avatar_glow").checked=t.avatar_glow;
  setLS(t.link_style);setAB(t.avatar_border);updBg();
  const toast=document.getElementById("toast");
  toast.textContent="Template angewendet! ✓";toast.classList.add("show");
  setTimeout(()=>{toast.classList.remove("show");toast.textContent="Gespeichert! ✓"},2000);
}

function setLS(s){currentLS=s;document.getElementById("link_style").value=s;document.querySelectorAll(".ls-opt").forEach(el=>el.classList.toggle("active",el.textContent===s));}
function setAB(s){currentAB=s;document.getElementById("avatar_border").value=s;document.querySelectorAll(".ab-opt").forEach((el,i)=>el.classList.toggle("active",["circle","rounded","square","none"][i]===s));}
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
function addB(){const inp=document.getElementById("bi"),v=inp.value.trim();if(!v)return;badges.push(v);inp.value="";renderB()}
function rmB(i){badges.splice(i,1);renderB()}

// Platform picker
function renderPlatformPicker(){
  var container = document.getElementById("platformPicker");
  if(!container) return;
  container.innerHTML = "";
  Object.entries(PLATFORMS).forEach(function(entry){
    var key = entry[0], p = entry[1];
    var btn = document.createElement("button");
    btn.className = "pp-btn";
    btn.setAttribute("data-platform", key);
    btn.style.color = p.color;
    btn.innerHTML = (PICONS[key]||"") + '<span style="color:var(--m)">' + p.name + '</span>';
    btn.addEventListener("click", function(){ addSocial(key); });
    container.appendChild(btn);
  });
}

function renderSocialList(){
  var container = document.getElementById("socialList");
  if(!container) return;
  container.innerHTML = "";
  links.forEach(function(l, i){
    var p = PLATFORMS[l.platform] || PLATFORMS.link;
    var div = document.createElement("div");
    div.className = "social-item";
    var iconWrap = document.createElement("div");
    iconWrap.className = "si-icon";
    iconWrap.style.background = "color-mix(in srgb," + p.color + " 15%,transparent)";
    iconWrap.innerHTML = '<span style="color:' + p.color + '">' + (PICONS[l.platform]||PICONS.link) + '</span>';
    div.appendChild(iconWrap);
    var body = document.createElement("div");
    body.className = "si-body";
    var platformLabel = document.createElement("div");
    platformLabel.className = "si-platform";
    platformLabel.textContent = p.name;
    body.appendChild(platformLabel);
    var inp = document.createElement("input");
    inp.className = "si-input";
    inp.type = "text";
    inp.placeholder = p.placeholder;
    inp.value = l.username || "";
    (function(idx){ inp.addEventListener("input", function(){ links[idx].username = this.value; }); })(i);
    body.appendChild(inp);
    var extraDiv = document.createElement("div");
    extraDiv.className = "si-extra";
    extraDiv.id = "extra-" + i;
    var cu = document.createElement("input");
    cu.type = "url";
    cu.placeholder = "Custom URL (optional)";
    cu.value = l.custom_url || "";
    cu.style.marginTop = "6px";
    (function(idx){ cu.addEventListener("input", function(){ links[idx].custom_url = this.value; }); })(i);
    extraDiv.appendChild(cu);
    body.appendChild(extraDiv);
    var tog = document.createElement("button");
    tog.textContent = "⚙ custom url";
    tog.style.cssText = "background:none;border:none;color:var(--m);font-family:monospace;font-size:10px;cursor:pointer;padding:4px 0;margin-top:4px;";
    (function(idx){ tog.addEventListener("click", function(){ var el=document.getElementById("extra-"+idx); if(el)el.classList.toggle("show"); }); })(i);
    body.appendChild(tog);
    div.appendChild(body);
    var del = document.createElement("button");
    del.className = "si-del";
    del.textContent = "×";
    (function(idx){ del.addEventListener("click", function(){ rmSocial(idx); }); })(i);
    div.appendChild(del);
    container.appendChild(div);
  });
}


function addSocial(platform){
  links.push({platform,username:"",custom_url:""});
  renderSocialList();
  // scroll to bottom of list
  const list=document.getElementById("socialList");
  list.lastElementChild&&list.lastElementChild.scrollIntoView({behavior:"smooth",block:"nearest"});
  // focus the input
  setTimeout(()=>{
    const inputs=list.querySelectorAll(".si-input");
    if(inputs.length)inputs[inputs.length-1].focus();
  },50);
}

function rmSocial(i){links.splice(i,1);renderSocialList();}

function handleAudioUpload(input){
  const file=input.files[0];if(!file)return;
  if(file.size>1024*1024*1024){alert("Datei zu groß! Maximal 1 GB.");return;}
  const reader=new FileReader();
  reader.onload=function(e){
    document.getElementById("audio_url").value=e.target.result;
    document.getElementById("audio_url_text").value="";
    document.getElementById("audio_filename").textContent="✓ "+file.name;
  };
  reader.readAsDataURL(file);
}

function handleImgUpload(input,hiddenId,previewId,filenameId){
  const file=input.files[0];if(!file)return;
  const maxW=hiddenId==="avatar_url"?400:1920,maxH=hiddenId==="avatar_url"?400:1080;
  const reader=new FileReader();
  reader.onload=function(e){
    const img=new Image();
    img.onload=function(){
      const canvas=document.createElement("canvas");
      let w=img.width,h=img.height;
      if(w>maxW||h>maxH){const ratio=Math.min(maxW/w,maxH/h);w=Math.round(w*ratio);h=Math.round(h*ratio);}
      canvas.width=w;canvas.height=h;
      canvas.getContext("2d").drawImage(img,0,0,w,h);
      const b64=canvas.toDataURL("image/jpeg",0.85);
      document.getElementById(hiddenId).value=b64;
      const prev=document.getElementById(previewId);
      if(prev){prev.src=b64;prev.style.display="block";}
      const fn=document.getElementById(filenameId);
      if(fn)fn.textContent="✓ "+file.name;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

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
    audio_url:document.getElementById("audio_url").value,
    audio_autoplay:document.getElementById("audio_autoplay").checked,
    audio_loop:document.getElementById("audio_loop").checked,
    audio_volume:parseFloat(document.getElementById("audio_volume").value||0.5),
    audio_title:document.getElementById("audio_title").value,
    bg_video_url:document.getElementById("bg_video_url").value,
    bg_overlay_opacity:parseFloat(document.getElementById("bg_overlay_opacity").value||0.3),
    links,newPassword:pw
  };
  const r=await fetch("/admin/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  if(r.ok){const t=document.getElementById("toast");t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
}

// Migrate old format links
links=links.map(function(l){if(l.platform)return l;return{platform:l.icon||"link",username:l.label||"",custom_url:l.url||""};});

// Navigation via event delegation
document.addEventListener("DOMContentLoaded",function(){
  document.querySelectorAll(".ni[data-section]").forEach(function(btn){
    btn.addEventListener("click",function(){
      var id=btn.getAttribute("data-section");
      navTo(id);
      document.querySelectorAll(".ni").forEach(function(b){b.classList.remove("active");});
      btn.classList.add("active");
    });
  });
  try{updBg();}catch(e){}
  try{renderB();}catch(e){}
  try{renderPlatformPicker();}catch(e){}
  try{renderSocialList();}catch(e){console.error(e);}
});
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
