const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const crypto = require("crypto");

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

  aurora:    { name: "Aurora Glass",     accent: "#7c3aed", bg_type: "gradient", bg_color: "#030712", bg_gradient_from: "#020617", bg_gradient_to: "#312e81", bg_gradient_angle: "145", bg_image_url: "", bg_pattern: "none", bg_animated: true,  card_style: "glass", card_blur: true,  font: "Space Grotesk", text_color: "#f8fafc", link_style: "pill",    avatar_border: "circle", avatar_glow: true  },
  vampire:   { name: "Vampire Red",      accent: "#ff003c", bg_type: "gradient", bg_color: "#090006", bg_gradient_from: "#090006", bg_gradient_to: "#220008", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "lines", bg_animated: false, card_style: "dark",  card_blur: false, font: "Playfair Display", text_color: "#ffe4ec", link_style: "neon", avatar_border: "circle", avatar_glow: true },
  ice:       { name: "Ice Blue",         accent: "#67e8f9", bg_type: "gradient", bg_color: "#06111f", bg_gradient_from: "#06111f", bg_gradient_to: "#0f2747", bg_gradient_angle: "155", bg_image_url: "", bg_pattern: "grid", bg_animated: true,  card_style: "glass", card_blur: true,  font: "Outfit", text_color: "#ecfeff", link_style: "filled", avatar_border: "rounded", avatar_glow: false },
  gold:      { name: "Luxury Gold",      accent: "#fbbf24", bg_type: "solid",    bg_color: "#080604", bg_gradient_from: "#080604", bg_gradient_to: "#1f1300", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "dots", bg_animated: false, card_style: "dark",  card_blur: false, font: "Abril Fatface", text_color: "#fff7ed", link_style: "pill", avatar_border: "circle", avatar_glow: true },
  venom:     { name: "Venom Lime",       accent: "#a3ff12", bg_type: "solid",    bg_color: "#020403", bg_gradient_from: "#020403", bg_gradient_to: "#071006", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "grid", bg_animated: false, card_style: "dark",  card_blur: false, font: "Rajdhani", text_color: "#f7ffe8", link_style: "neon", avatar_border: "square", avatar_glow: true },
  vapor:     { name: "Vaporwave",        accent: "#ff71ce", bg_type: "gradient", bg_color: "#12002a", bg_gradient_from: "#12002a", bg_gradient_to: "#01cdfe", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "grid", bg_animated: true,  card_style: "glass", card_blur: true,  font: "Oxanium", text_color: "#fff0ff", link_style: "neon", avatar_border: "rounded", avatar_glow: true },
  void:      { name: "Void Black",       accent: "#ffffff", bg_type: "solid",    bg_color: "#000000", bg_gradient_from: "#000000", bg_gradient_to: "#050505", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "none", bg_animated: false, card_style: "dark",  card_blur: false, font: "Inter", text_color: "#f8f8f8", link_style: "minimal", avatar_border: "circle", avatar_glow: false },
  candy:     { name: "Candy Pop",        accent: "#fb7185", bg_type: "gradient", bg_color: "#fff1f2", bg_gradient_from: "#fff1f2", bg_gradient_to: "#dbeafe", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "dots", bg_animated: true,  card_style: "light", card_blur: false, font: "Quicksand", text_color: "#111827", link_style: "filled", avatar_border: "circle", avatar_glow: false },
  terminal:  { name: "Terminal Pro",     accent: "#39ff14", bg_type: "solid",    bg_color: "#010501", bg_gradient_from: "#010501", bg_gradient_to: "#010501", bg_gradient_angle: "135", bg_image_url: "", bg_pattern: "lines", bg_animated: false, card_style: "dark",  card_blur: false, font: "Fira Code", text_color: "#b6ffb6", link_style: "minimal", avatar_border: "none", avatar_glow: true },
  midnight:  { name: "Midnight Purple",  accent: "#c084fc", bg_type: "gradient", bg_color: "#020617", bg_gradient_from: "#020617", bg_gradient_to: "#1e1b4b", bg_gradient_angle: "150", bg_image_url: "", bg_pattern: "none", bg_animated: true,  card_style: "glass", card_blur: true, font: "Montserrat", text_color: "#ede9fe", link_style: "pill", avatar_border: "circle", avatar_glow: true },
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
  spotify_url: "", audio_url: "", audio_autoplay: false, audio_loop: true, audio_volume: 0.5, audio_title: "", bg_video_url: "", bg_overlay_opacity: 0.3, bg_blur_amount: 0, card_shadow: true, show_song_widget: false, custom_css: "", meta_title: "", meta_description: "", favicon_url: "", custom_head: "", custom_js: "", badge_style: "pill", profile_layout: "center", page_width: "440", card_radius: "24", avatar_size: "90", feature_flags: {}, views: 0,
  analytics_enabled: true, click_tracking: true, announcement_enabled: false, announcement_text: "", announcement_url: "",
  enter_screen_enabled: false, enter_screen_text: "click to enter", share_bar_enabled: true, copy_button_enabled: true, theme_toggle_enabled: false,
  profile_title: "", hero_subtitle: "", quote_enabled: false, quote_text: "", cta_enabled: false, cta_label: "", cta_url: "",
  stats_enabled: false, stats_items: "", gear_enabled: false, gear_items: "", timeline_enabled: false, timeline_items: "",
  availability_enabled: false, availability_text: "", footer_note: "", watermark_enabled: false,
  disable_right_click: false, disable_selection: false, analytics_public_badge: false,
  pwa_name: "Bio Page", pwa_color: "#c8ff00", seo_keywords: "", canonical_url: "",
  password: ""
};

async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS bio_config (id SERIAL PRIMARY KEY, data JSONB NOT NULL DEFAULT '{}')`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bio_events (id SERIAL PRIMARY KEY, type TEXT NOT NULL, path TEXT, link_index INTEGER, link_platform TEXT, link_label TEXT, referrer TEXT, user_agent TEXT, ip_hash TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bio_snapshots (id SERIAL PRIMARY KEY, label TEXT, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bio_assets (asset_key TEXT PRIMARY KEY, filename TEXT, content_type TEXT NOT NULL, data BYTEA NOT NULL, size_bytes INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now())`);
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
  data.badges = normalizeBadges(data.badges);
  if (!data.feature_flags || typeof data.feature_flags !== "object") data.feature_flags = {};
  // Alte Browser-crashende Base64/Data-URL Videos nicht mehr direkt ins HTML rendern.
  // Videos werden ab jetzt als DB-Asset über /asset/bg-video gestreamt.
  if (typeof data.bg_video_url === "string" && data.bg_video_url.startsWith("data:video")) {
    data.bg_video_url = "";
    if (data.bg_type === "video") data.bg_type = "solid";
  }
  return data;
}
async function saveConfig(data) { await pool.query("UPDATE bio_config SET data = $1", [data]); }
function requireAuth(req, res, next) { if (req.session.authenticated) return next(); res.redirect("/admin"); }
function safeFileName(v) { return String(v || "video").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "video"; }
function parseRange(rangeHeader, total) {
  if (!rangeHeader || !/^bytes=/.test(rangeHeader)) return null;
  const [startRaw, endRaw] = rangeHeader.replace(/bytes=/, "").split("-");
  const start = startRaw === "" ? 0 : parseInt(startRaw, 10);
  const end = endRaw ? parseInt(endRaw, 10) : total - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start || start >= total) return null;
  return { start, end: Math.min(end, total - 1) };
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function safeJson(v) {
  return JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
function safeColor(v, fallback = "") {
  const x = String(v || "").trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(x) ? x : fallback;
}
function normalizeBadges(input) {
  if (!Array.isArray(input)) return [];
  return input.map((b) => {
    if (typeof b === "string") return { text: b, icon: "", icon_url: "", color: "", style: "pill" };
    return {
      text: String(b?.text ?? b?.name ?? b?.label ?? "badge").slice(0, 40),
      icon: String(b?.icon ?? "").slice(0, 8),
      icon_url: String(b?.icon_url ?? b?.image ?? "").slice(0, 2000),
      color: safeColor(b?.color, ""),
      style: ["pill", "soft", "outline", "solid", "glass", "neon"].includes(b?.style) ? b.style : "pill"
    };
  }).filter(b => b.text || b.icon || b.icon_url).slice(0, 40);
}
function renderBadge(b, i = 0, fallbackAccent = "#c8ff00") {
  const color = safeColor(b.color, i === 0 ? fallbackAccent : "");
  const style = b.style || "pill";
  const icon = b.icon_url
    ? '<img class="badge-img" src="' + esc(b.icon_url) + '" alt="">'
    : b.icon ? '<span class="badge-ico">' + esc(b.icon) + '</span>' : "";
  const extra = color ? ' style="--bc:' + esc(color) + '"' : "";
  return '<span class="badge badge-' + esc(style) + (i === 0 ? " accent" : "") + '"' + extra + '>' + icon + '<span>' + esc(b.text) + '</span></span>';
}
function featureCatalog() {
  const items = [
    "card-hover-raise",
    "card-hover-scale",
    "card-floating",
    "card-border-glow",
    "card-double-border",
    "card-shadow-soft",
    "card-shadow-neon",
    "card-glass-max",
    "card-dark-matte",
    "card-light-frost",
    "card-gradient-surface",
    "card-noise-overlay",
    "card-inner-grid",
    "card-corner-dots",
    "card-compact-padding",
    "avatar-pulse",
    "avatar-ring-spin",
    "avatar-neon-ring",
    "avatar-double-ring",
    "avatar-square-hard",
    "avatar-soft-shadow",
    "avatar-grayscale",
    "avatar-saturate",
    "avatar-tilt-hover",
    "avatar-bounce-in",
    "avatar-online-ping",
    "avatar-status-hidden",
    "avatar-status-big",
    "avatar-status-square",
    "avatar-mirror",
    "type-name-gradient",
    "type-name-glow",
    "type-name-outline",
    "type-name-uppercase",
    "type-name-lowercase",
    "type-name-spaced",
    "type-bio-mono",
    "type-bio-large",
    "type-bio-small",
    "type-bio-muted",
    "type-bio-bright",
    "type-bio-centered",
    "type-bio-left",
    "type-pronouns-pill",
    "type-hide-pronouns",
    "link-lift",
    "link-shine",
    "link-compact",
    "link-wide",
    "link-left-accent",
    "link-icon-box",
    "link-rounded-pill",
    "link-square",
    "link-neon-glow",
    "link-text-big",
    "link-platform-hide",
    "link-username-uppercase",
    "link-stagger",
    "link-hover-slide",
    "link-hover-fill",
    "badge-glow",
    "badge-solid-all",
    "badge-outline-all",
    "badge-glass-all",
    "badge-neon-all",
    "badge-large",
    "badge-small",
    "badge-rounded-square",
    "badge-icons-round",
    "badge-uppercase-off",
    "badge-center-compact",
    "badge-spread",
    "badge-gradient",
    "badge-shadow",
    "badge-pulse-first",
    "bg-vignette",
    "bg-scanlines",
    "bg-noise",
    "bg-orbs",
    "bg-stars",
    "bg-radial-center",
    "bg-radial-corner",
    "bg-contrast",
    "bg-darken",
    "bg-lighten",
    "bg-blur",
    "bg-saturate",
    "bg-grid-strong",
    "bg-dots-strong",
    "bg-animated-slow",
    "motion-slow",
    "motion-fast",
    "motion-fade-card",
    "motion-slide-card",
    "motion-zoom-card",
    "motion-link-cascade",
    "motion-badge-cascade",
    "motion-avatar-pop",
    "motion-background-shift",
    "motion-hover-tilt",
    "motion-no-animations",
    "motion-smooth-scroll",
    "motion-cursor-soft",
    "motion-cursor-big",
    "motion-attention-pulse",
    "layout-wide",
    "layout-narrow",
    "layout-left",
    "layout-right",
    "layout-top",
    "layout-bottom",
    "layout-card-left",
    "layout-card-right",
    "layout-no-divider",
    "layout-divider-glow",
    "layout-extra-gap",
    "layout-no-gap",
    "layout-mobile-compact",
    "layout-safe-area",
    "layout-minimal",
    "media-spotify-shadow",
    "media-spotify-hide",
    "media-audio-left",
    "media-audio-center",
    "media-audio-minimal",
    "media-audio-glass",
    "media-views-pill",
    "media-views-hide",
    "media-video-cover-dark",
    "media-video-cover-light",
    "media-audio-bars-neon",
    "media-volume-hide",
    "media-widget-big",
    "media-widget-small",
    "media-widget-bottom-center",
    "extra-cyber-corners",
    "extra-terminal-lines",
    "extra-heart-cursor",
    "extra-profile-grid",
    "extra-no-link-arrows",
    "extra-link-arrows-large",
    "extra-card-separator",
    "extra-hologram",
    "extra-glitch-name",
    "extra-rainbow-accent",
    "extra-soft-focus",
    "extra-high-contrast",
    "extra-low-contrast",
    "extra-print-clean",
    "extra-dev-mode"
  ];
  const labels = {"card-hover-raise": "Card hover raise", "card-hover-scale": "Card hover scale", "card-floating": "Card floating idle", "card-border-glow": "Card border glow", "card-double-border": "Card double border", "card-shadow-soft": "Card soft shadow", "card-shadow-neon": "Card neon shadow", "card-glass-max": "Card max glass", "card-dark-matte": "Card matte dark", "card-light-frost": "Card frost light", "card-gradient-surface": "Card gradient surface", "card-noise-overlay": "Card noise overlay", "card-inner-grid": "Card inner grid", "card-corner-dots": "Card corner dots", "card-compact-padding": "Card compact padding", "avatar-pulse": "Avatar pulse", "avatar-ring-spin": "Avatar ring spin", "avatar-neon-ring": "Avatar neon ring", "avatar-double-ring": "Avatar double ring", "avatar-square-hard": "Avatar hard square", "avatar-soft-shadow": "Avatar soft shadow", "avatar-grayscale": "Avatar grayscale", "avatar-saturate": "Avatar saturate", "avatar-tilt-hover": "Avatar tilt hover", "avatar-bounce-in": "Avatar bounce in", "avatar-online-ping": "Avatar status ping", "avatar-status-hidden": "Hide status dot", "avatar-status-big": "Big status dot", "avatar-status-square": "Square status dot", "avatar-mirror": "Avatar mirror", "type-name-gradient": "Name gradient", "type-name-glow": "Name glow", "type-name-outline": "Name outline", "type-name-uppercase": "Name uppercase", "type-name-lowercase": "Name lowercase", "type-name-spaced": "Name letter spacing", "type-bio-mono": "Bio mono", "type-bio-large": "Bio large", "type-bio-small": "Bio small", "type-bio-muted": "Bio muted", "type-bio-bright": "Bio bright", "type-bio-centered": "Bio centered", "type-bio-left": "Bio left align", "type-pronouns-pill": "Pronouns pill", "type-hide-pronouns": "Hide pronouns", "link-lift": "Links lift", "link-shine": "Links shine", "link-compact": "Links compact", "link-wide": "Links wide", "link-left-accent": "Left accent bar", "link-icon-box": "Icon boxes", "link-rounded-pill": "Links pill", "link-square": "Links squared", "link-neon-glow": "Links neon glow", "link-text-big": "Links big text", "link-platform-hide": "Hide platform labels", "link-username-uppercase": "Usernames uppercase", "link-stagger": "Staggered link stack", "link-hover-slide": "Hover slide", "link-hover-fill": "Hover fill", "badge-glow": "Badge glow", "badge-solid-all": "Solid badges", "badge-outline-all": "Outline badges", "badge-glass-all": "Glass badges", "badge-neon-all": "Neon badges", "badge-large": "Large badges", "badge-small": "Small badges", "badge-rounded-square": "Square badges", "badge-icons-round": "Round badge icons", "badge-uppercase-off": "No badge uppercase", "badge-center-compact": "Compact badge row", "badge-spread": "Spread badges", "badge-gradient": "Gradient badges", "badge-shadow": "Badge shadow", "badge-pulse-first": "First badge pulse", "bg-vignette": "Background vignette", "bg-scanlines": "CRT scanlines", "bg-noise": "Background noise", "bg-orbs": "Floating orbs", "bg-stars": "Star field", "bg-radial-center": "Radial center glow", "bg-radial-corner": "Radial corner glow", "bg-contrast": "More contrast", "bg-darken": "Dark overlay", "bg-lighten": "Light overlay", "bg-blur": "Blur background", "bg-saturate": "Saturate background", "bg-grid-strong": "Strong grid", "bg-dots-strong": "Strong dots", "bg-animated-slow": "Slow bg animation", "motion-slow": "Slow animations", "motion-fast": "Fast animations", "motion-fade-card": "Card fade in", "motion-slide-card": "Card slide in", "motion-zoom-card": "Card zoom in", "motion-link-cascade": "Link cascade", "motion-badge-cascade": "Badge cascade", "motion-avatar-pop": "Avatar pop", "motion-background-shift": "Background shift", "motion-hover-tilt": "Hover tilt", "motion-no-animations": "No animations", "motion-smooth-scroll": "Smooth scroll", "motion-cursor-soft": "Soft cursor glow", "motion-cursor-big": "Big cursor glow", "motion-attention-pulse": "Attention pulse", "layout-wide": "Wide card", "layout-narrow": "Narrow card", "layout-left": "Page left", "layout-right": "Page right", "layout-top": "Page top", "layout-bottom": "Page bottom", "layout-card-left": "Card text left", "layout-card-right": "Card text right", "layout-no-divider": "Hide divider", "layout-divider-glow": "Divider glow", "layout-extra-gap": "Extra spacing", "layout-no-gap": "Tight spacing", "layout-mobile-compact": "Mobile compact", "layout-safe-area": "Safe area padding", "layout-minimal": "Minimal layout", "media-spotify-shadow": "Spotify shadow", "media-spotify-hide": "Hide Spotify", "media-audio-left": "Audio left", "media-audio-center": "Audio center", "media-audio-minimal": "Audio minimal", "media-audio-glass": "Audio glass", "media-views-pill": "Views pill", "media-views-hide": "Hide views", "media-video-cover-dark": "Dark video cover", "media-video-cover-light": "Light video cover", "media-audio-bars-neon": "Audio bars neon", "media-volume-hide": "Hide volume", "media-widget-big": "Big audio widget", "media-widget-small": "Small audio widget", "media-widget-bottom-center": "Audio bottom center", "extra-cyber-corners": "Cyber corner marks", "extra-terminal-lines": "Terminal lines", "extra-heart-cursor": "Heart cursor", "extra-profile-grid": "Profile grid feel", "extra-no-link-arrows": "Hide link arrows", "extra-link-arrows-large": "Large link arrows", "extra-card-separator": "Card separators", "extra-hologram": "Hologram card", "extra-glitch-name": "Glitch name", "extra-rainbow-accent": "Rainbow accent", "extra-soft-focus": "Soft focus", "extra-high-contrast": "High contrast", "extra-low-contrast": "Low contrast", "extra-print-clean": "Print clean", "extra-dev-mode": "Dev mode labels"};
  return items.map((key, i) => ({ key, label: labels[key] || key.replace(/-/g, " "), group: key.split("-")[0], index: i + 1 }));
}
function enabledFeatureClasses(flags) {
  if (!flags || typeof flags !== "object") return "";
  return Object.keys(flags).filter(k => flags[k]).map(k => "fx-" + k.replace(/[^a-z0-9_-]/gi, "")).join(" ");
}

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

/* ===== V4 ULTRA HELPERS: analytics, public modules, safe mini CMS ===== */
function cleanLines(input, max = 20) {
  return String(input || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, max);
}
function parseKVLines(input, max = 12) {
  return cleanLines(input, max).map((line) => {
    const parts = line.split(/[:|—-]/);
    if (parts.length >= 2) return { k: parts.shift().trim(), v: parts.join("-").trim() };
    return { k: line, v: "" };
  });
}
function publicUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}
function hashIp(req) {
  const raw = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  const salt = process.env.ANALYTICS_SALT || process.env.SESSION_SECRET || "bio-analytics";
  return crypto.createHash("sha256").update(raw + salt).digest("hex").slice(0, 20);
}
async function trackEvent(req, type, extra = {}) {
  try {
    const c = extra.config || await getConfig();
    if (c.analytics_enabled === false) return;
    await pool.query(`INSERT INTO bio_events(type,path,link_index,link_platform,link_label,referrer,user_agent,ip_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [
      type,
      req.originalUrl || req.url || "",
      Number.isFinite(extra.link_index) ? extra.link_index : null,
      extra.link_platform || null,
      extra.link_label || null,
      String(req.headers.referer || req.headers.referrer || "").slice(0, 500),
      String(req.headers["user-agent"] || "").slice(0, 500),
      hashIp(req)
    ]);
  } catch (e) { console.warn("analytics skipped:", e.message); }
}
function v4PublicCSS(c) {
  return `
/* ===== V4 ULTRA PUBLIC MODULES ===== */
.ux-announcement{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:50;max-width:min(720px,calc(100vw - 24px));display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid color-mix(in srgb,var(--a) 38%,transparent);border-radius:999px;background:rgba(8,8,10,.72);backdrop-filter:blur(18px);box-shadow:0 18px 70px rgba(0,0,0,.28);font-family:'Space Mono',monospace;font-size:11px;color:var(--t);text-decoration:none}.ux-announcement b{color:var(--a)}
.ux-section{margin-top:12px;border:1px solid color-mix(in srgb,var(--t) 9%,transparent);border-radius:16px;padding:12px 14px;background:color-mix(in srgb,var(--t) 3%,transparent);font-family:'Space Mono',monospace}.ux-section h2{font-family:inherit;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--a);margin-bottom:8px}.ux-section p,.ux-section li{font-size:11px;line-height:1.6;color:var(--m)}.ux-list{display:grid;gap:7px;list-style:none}.ux-kv{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed color-mix(in srgb,var(--t) 9%,transparent);padding-bottom:5px}.ux-kv:last-child{border-bottom:0;padding-bottom:0}.ux-kv strong{color:var(--t);font-weight:700}.ux-cta{display:flex;justify-content:center;margin-top:12px}.ux-cta a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;background:var(--a);color:#050505;border-radius:999px;padding:10px 15px;font-weight:800;font-size:12px}.ux-footer{margin-top:14px;text-align:center;font-family:'Space Mono',monospace;font-size:10px;color:color-mix(in srgb,var(--t) 28%,transparent)}
.ux-share-dock{position:fixed;right:18px;top:50%;transform:translateY(-50%);z-index:80;display:flex;flex-direction:column;gap:8px}.ux-share-dock button,.ux-theme-toggle{width:42px;height:42px;border-radius:14px;border:1px solid color-mix(in srgb,var(--a) 32%,transparent);background:rgba(8,8,10,.72);color:var(--a);backdrop-filter:blur(16px);cursor:pointer;font-weight:900}.ux-copy-toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%) translateY(10px);opacity:0;z-index:90;background:var(--a);color:#050505;border-radius:999px;padding:9px 16px;font-family:'Space Mono',monospace;font-size:11px;transition:.2s}.ux-copy-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.ux-enter{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.82);backdrop-filter:blur(18px);cursor:pointer;transition:.35s}.ux-enter.hidden{opacity:0;pointer-events:none}.ux-enter span{font-family:'Space Mono',monospace;color:var(--a);border:1px solid color-mix(in srgb,var(--a) 36%,transparent);border-radius:999px;padding:12px 18px;animation:pulse 2s infinite}.ux-watermark{position:fixed;left:14px;bottom:12px;font-family:'Space Mono',monospace;font-size:10px;color:color-mix(in srgb,var(--t) 20%,transparent);z-index:60}.ux-analytics-pill{position:fixed;left:14px;top:14px;font-family:'Space Mono',monospace;font-size:10px;color:var(--a);border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:999px;padding:6px 10px;background:rgba(0,0,0,.45);z-index:60}
body.ux-light-mode{filter:invert(1) hue-rotate(180deg)}body.ux-light-mode img,body.ux-light-mode video,body.ux-light-mode iframe{filter:invert(1) hue-rotate(180deg)}
@media(max-width:760px){.ux-share-dock{right:12px;top:auto;bottom:14px;transform:none;flex-direction:row}.ux-announcement{top:8px}.ux-section{padding:10px 12px}}
${c.disable_selection ? "body{user-select:none;-webkit-user-select:none}" : ""}
`;
}
function v4PublicTopLayers(c) {
  const ann = c.announcement_enabled && c.announcement_text ? (c.announcement_url ? `<a class="ux-announcement" href="${esc(c.announcement_url)}" target="_blank"><b>update</b><span>${esc(c.announcement_text)}</span></a>` : `<div class="ux-announcement"><b>update</b><span>${esc(c.announcement_text)}</span></div>`) : "";
  const enter = c.enter_screen_enabled ? `<div class="ux-enter" id="uxEnter"><span>${esc(c.enter_screen_text || "click to enter")}</span></div>` : "";
  const dock = (c.share_bar_enabled || c.copy_button_enabled || c.theme_toggle_enabled) ? `<div class="ux-share-dock">${c.copy_button_enabled?`<button type="button" onclick="uxCopyLink()" title="Link kopieren">⛓</button>`:""}${c.share_bar_enabled?`<button type="button" onclick="uxNativeShare()" title="Teilen">↗</button>`:""}${c.theme_toggle_enabled?`<button class="ux-theme-toggle" type="button" onclick="uxToggleTheme()" title="Theme">◐</button>`:""}</div><div class="ux-copy-toast" id="uxCopyToast">kopiert</div>` : "";
  const wm = c.watermark_enabled ? `<div class="ux-watermark">made with bio control</div>` : "";
  const analytics = c.analytics_public_badge ? `<div class="ux-analytics-pill">${Number(c.views||0)} views</div>` : "";
  return ann + enter + dock + wm + analytics;
}
function v4PublicSections(c) {
  let html = "";
  if (c.profile_title || c.hero_subtitle) html += `<div class="ux-section"><h2>${esc(c.profile_title || "profile")}</h2><p>${esc(c.hero_subtitle || "")}</p></div>`;
  if (c.quote_enabled && c.quote_text) html += `<div class="ux-section"><h2>quote</h2><p>“${esc(c.quote_text)}”</p></div>`;
  if (c.availability_enabled && c.availability_text) html += `<div class="ux-section"><h2>status</h2><p>${esc(c.availability_text)}</p></div>`;
  if (c.stats_enabled && c.stats_items) html += `<div class="ux-section"><h2>stats</h2><div class="ux-list">` + parseKVLines(c.stats_items, 8).map(x => `<div class="ux-kv"><strong>${esc(x.k)}</strong><span>${esc(x.v)}</span></div>`).join("") + `</div></div>`;
  if (c.gear_enabled && c.gear_items) html += `<div class="ux-section"><h2>setup</h2><ul class="ux-list">` + cleanLines(c.gear_items, 12).map(x => `<li>${esc(x)}</li>`).join("") + `</ul></div>`;
  if (c.timeline_enabled && c.timeline_items) html += `<div class="ux-section"><h2>timeline</h2><ul class="ux-list">` + cleanLines(c.timeline_items, 10).map(x => `<li>${esc(x)}</li>`).join("") + `</ul></div>`;
  if (c.cta_enabled && c.cta_label && c.cta_url) html += `<div class="ux-cta"><a href="${esc(c.cta_url)}" target="_blank">${esc(c.cta_label)} ↗</a></div>`;
  if (c.footer_note) html += `<div class="ux-footer">${esc(c.footer_note)}</div>`;
  return html;
}
function v4PublicScripts(c) {
  return `<script>
(function(){
  var enter=document.getElementById('uxEnter'); if(enter){enter.addEventListener('click',function(){enter.classList.add('hidden');setTimeout(function(){enter.remove()},400);});}
  window.uxCopyLink=function(){navigator.clipboard&&navigator.clipboard.writeText(location.href).catch(function(){});var t=document.getElementById('uxCopyToast');if(t){t.classList.add('show');setTimeout(function(){t.classList.remove('show')},1300)}};
  window.uxNativeShare=function(){if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){});}else{uxCopyLink();}};
  window.uxToggleTheme=function(){document.body.classList.toggle('ux-light-mode');try{localStorage.setItem('uxLight',document.body.classList.contains('ux-light-mode')?'1':'0')}catch(e){}};
  try{if(localStorage.getItem('uxLight')==='1')document.body.classList.add('ux-light-mode')}catch(e){}
  ${c.disable_right_click ? "document.addEventListener('contextmenu',function(e){e.preventDefault()});" : ""}
})();
<\/script>`;
}

function getLinkUrl(link) {
  const p = PLATFORMS[link.platform] || PLATFORMS.link;
  if (link.custom_url) return link.custom_url;
  if (!p.url) return null;
  return p.url.replace("{u}", link.username || "");
}


/* ===== V5 EXTREME HELPERS: component engine, public command menu, reactions ===== */
function v5Bool(v){ return v === true || v === "true" || v === "on" || v === 1 || v === "1"; }
function v5Rows(input, max = 20, keys = ["title","value","extra"]) {
  return cleanLines(input, max).map((line) => {
    const parts = line.split("|").map(x => x.trim());
    const row = {}; keys.forEach((k,i)=>row[k]=parts[i]||""); return row;
  });
}
function v5PublicCSS(c){
  const a = safeColor(c.accent, "#c8ff00") || "#c8ff00";
  return `
/* ===== V5 EXTREME PUBLIC ===== */
.v5-root{position:relative;z-index:4;width:100%;max-width:520px;margin-top:14px;display:grid;gap:12px}.v5-card{border:1px solid color-mix(in srgb,var(--t) 10%,transparent);border-radius:18px;background:rgba(255,255,255,.045);backdrop-filter:blur(18px);padding:14px;font-family:'Space Mono',monospace;box-shadow:0 16px 60px rgba(0,0,0,.18)}.v5-card h2{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:var(--a);margin-bottom:9px}.v5-card p,.v5-card li{font-size:11px;line-height:1.65;color:var(--m)}.v5-card strong{color:var(--t)}.v5-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v5-mini{border:1px solid color-mix(in srgb,var(--t) 10%,transparent);border-radius:14px;padding:10px;background:color-mix(in srgb,var(--t) 4%,transparent)}.v5-mini b{display:block;font-size:13px;color:var(--t);margin-bottom:2px}.v5-mini span{font-size:10px;color:var(--m)}.v5-tags{display:flex;gap:7px;flex-wrap:wrap}.v5-tag{font-size:10px;border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:999px;padding:5px 9px;color:var(--a);background:color-mix(in srgb,var(--a) 7%,transparent)}.v5-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.v5-gallery a{position:relative;overflow:hidden;border-radius:13px;min-height:76px;background:#111;border:1px solid color-mix(in srgb,var(--t) 10%,transparent)}.v5-gallery img{width:100%;height:100%;object-fit:cover;display:block;transition:.25s}.v5-gallery a:hover img{transform:scale(1.08)}.v5-gallery small{position:absolute;left:6px;bottom:6px;background:rgba(0,0,0,.55);border-radius:999px;padding:3px 7px;font-size:9px;color:#fff}.v5-feed{display:grid;gap:8px}.v5-feeditem{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:flex-start}.v5-dot{width:9px;height:9px;border-radius:99px;background:var(--a);box-shadow:0 0 14px var(--a);margin-top:4px}.v5-feeditem b{display:block;font-size:11px;color:var(--t)}.v5-feeditem span{font-size:10px;color:var(--m)}.v5-faq details{border-top:1px solid color-mix(in srgb,var(--t) 9%,transparent);padding:8px 0}.v5-faq details:first-child{border-top:0}.v5-faq summary{cursor:pointer;font-size:11px;color:var(--t);font-weight:700}.v5-faq p{margin-top:7px}.v5-count{display:flex;justify-content:space-between;gap:8px}.v5-count div{flex:1;text-align:center;border:1px solid color-mix(in srgb,var(--a) 20%,transparent);border-radius:14px;padding:9px 5px;background:color-mix(in srgb,var(--a) 5%,transparent)}.v5-count b{display:block;font-size:19px;color:var(--a)}.v5-count span{font-size:9px;color:var(--m);text-transform:uppercase}.v5-aura{height:9px;border-radius:999px;background:color-mix(in srgb,var(--t) 10%,transparent);overflow:hidden}.v5-aura i{display:block;height:100%;width:calc(var(--v5-aura,78) * 1%);background:linear-gradient(90deg,var(--a),#fff);box-shadow:0 0 18px var(--a)}.v5-services{display:grid;gap:8px}.v5-service{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid color-mix(in srgb,var(--t) 9%,transparent);border-radius:14px;padding:10px}.v5-service b{font-size:11px;color:var(--t)}.v5-service span{font-size:10px;color:var(--a)}.v5-reactions{display:flex;gap:8px;flex-wrap:wrap}.v5-react{border:1px solid color-mix(in srgb,var(--a) 24%,transparent);border-radius:999px;padding:8px 10px;background:rgba(0,0,0,.18);color:var(--t);cursor:pointer;font-size:13px;transition:.18s}.v5-react:hover{transform:translateY(-2px);border-color:var(--a)}.v5-terminal{font-family:'Space Mono',monospace;border:1px solid color-mix(in srgb,var(--a) 26%,transparent);border-radius:16px;background:rgba(0,0,0,.35);padding:12px;box-shadow:inset 0 0 24px color-mix(in srgb,var(--a) 5%,transparent)}.v5-terminal code{display:block;white-space:pre-wrap;color:var(--a);font-size:10px;line-height:1.55}.v5-playlist{display:grid;gap:8px}.v5-song{display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,var(--t) 9%,transparent);border-radius:14px;padding:9px;text-decoration:none}.v5-song i{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--a),transparent);display:block}.v5-song b{font-size:11px;color:var(--t)}.v5-song span{display:block;font-size:10px;color:var(--m)}
.v5-nav{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:120;display:flex;gap:7px;padding:8px;border:1px solid color-mix(in srgb,var(--a) 25%,transparent);border-radius:999px;background:rgba(6,6,8,.68);backdrop-filter:blur(18px);box-shadow:0 20px 80px rgba(0,0,0,.35)}.v5-nav a,.v5-nav button{border:0;background:transparent;color:var(--t);font-family:'Space Mono',monospace;font-size:10px;text-decoration:none;padding:8px 10px;border-radius:999px;cursor:pointer}.v5-nav a:hover,.v5-nav button:hover{background:color-mix(in srgb,var(--a) 12%,transparent);color:var(--a)}.v5-command{position:fixed;inset:0;z-index:9997;display:none;align-items:flex-start;justify-content:center;padding-top:12vh;background:rgba(0,0,0,.62);backdrop-filter:blur(14px)}.v5-command.show{display:flex}.v5-command-box{width:min(620px,calc(100vw - 26px));border:1px solid color-mix(in srgb,var(--a) 28%,transparent);border-radius:22px;background:#09090b;box-shadow:0 30px 100px rgba(0,0,0,.55);padding:12px}.v5-command input{width:100%;border:1px solid color-mix(in srgb,var(--t) 10%,transparent);border-radius:14px;background:#050505;color:var(--t);padding:13px 14px;font-family:'Space Mono',monospace;outline:none}.v5-command-list{display:grid;gap:6px;margin-top:10px}.v5-command-list button{display:flex;justify-content:space-between;border:0;border-radius:12px;background:transparent;color:var(--t);padding:10px 12px;font-family:'Space Mono',monospace;font-size:11px;text-align:left;cursor:pointer}.v5-command-list button:hover{background:color-mix(in srgb,var(--a) 10%,transparent);color:var(--a)}.v5-secret{display:none}.v5-secret.unlocked{display:block}.v5-orb{position:fixed;inset:auto auto 10% 8%;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,${a}22 0,transparent 68%);filter:blur(4px);pointer-events:none;z-index:0;animation:v5drift 7s ease-in-out infinite}@keyframes v5drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(28px,-18px) scale(1.1)}}.v5-spotlight{position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--a) 10%,transparent),transparent 28%)}.v5-marquee{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:70;width:min(720px,calc(100vw - 24px));overflow:hidden;white-space:nowrap;padding:8px 0}.v5-marquee span{display:inline-block;padding-left:100%;animation:v5marq 18s linear infinite}@keyframes v5marq{to{transform:translateX(-100%)}}body.v5-soft-grain:before{content:'';position:fixed;inset:0;z-index:2;pointer-events:none;opacity:.08;background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity=".55"/></svg>')}body.v5-premium-aura .card{box-shadow:0 0 0 1px color-mix(in srgb,var(--a) 28%,transparent),0 28px 120px color-mix(in srgb,var(--a) 18%,transparent),0 30px 90px rgba(0,0,0,.4)}body.v5-link-magnet .link-btn:hover{transform:translateX(8px) scale(1.015)}body.v5-badge-rainbow .badge{animation:v5hue 5s linear infinite}@keyframes v5hue{to{filter:hue-rotate(360deg)}}body.v5-tilt-avatar .avi:hover{transform:rotate(-3deg) scale(1.04)}body.v5-audio-glass .audio-widget .aw-inner{border-radius:18px;background:rgba(255,255,255,.08)!important}
@media(max-width:760px){.v5-grid,.v5-gallery{grid-template-columns:1fr 1fr}.v5-root{max-width:440px}.v5-nav{bottom:10px;max-width:calc(100vw - 18px);overflow-x:auto}.v5-count b{font-size:16px}}
`;
}
function renderV5PublicSuite(c){
  const fx = c.v5_fx || {};
  const classes=[]; if(fx.soft_grain)classes.push('v5-soft-grain'); if(fx.premium_aura)classes.push('v5-premium-aura'); if(fx.link_magnet)classes.push('v5-link-magnet'); if(fx.badge_rainbow)classes.push('v5-badge-rainbow'); if(fx.tilt_avatar)classes.push('v5-tilt-avatar'); if(fx.audio_glass)classes.push('v5-audio-glass');
  let html = `<style>${v5PublicCSS(c)}</style>`;
  if(classes.length) html += `<script>document.body.classList.add(${classes.map(x=>JSON.stringify(x)).join(',')});<\/script>`;
  if(fx.floating_orb) html += `<div class="v5-orb"></div>`;
  if(fx.mouse_spotlight) html += `<div class="v5-spotlight" id="v5Spotlight"></div>`;
  if(!v5Bool(c.v5_enabled)){ html += `<script>(function(){var s=document.getElementById('v5Spotlight');if(s)document.addEventListener('pointermove',function(e){document.documentElement.style.setProperty('--mx',e.clientX+'px');document.documentElement.style.setProperty('--my',e.clientY+'px')});})();<\/script>`; return html; }
  const sections=[];
  const aura=Math.max(0,Math.min(100,Number(c.v5_aura_score||78)));
  if(v5Bool(c.v5_aura_enabled)) sections.push(`<section class="v5-card"><h2>${esc(c.v5_aura_title||'Aura Level')}</h2><div class="v5-aura" style="--v5-aura:${aura}"><i></i></div><p style="margin-top:8px">${esc(c.v5_aura_text||(aura+'% profile energy'))}</p></section>`);
  const tags=cleanLines(c.v5_tags,36); if(tags.length) sections.push(`<section class="v5-card"><h2>${esc(c.v5_tags_title||'tags')}</h2><div class="v5-tags">${tags.map(t=>`<span class="v5-tag">${esc(t)}</span>`).join('')}</div></section>`);
  const highlights=v5Rows(c.v5_highlights,12,['title','value','extra']); if(highlights.length) sections.push(`<section class="v5-card"><h2>${esc(c.v5_highlights_title||'highlights')}</h2><div class="v5-grid">${highlights.map(x=>`<div class="v5-mini"><b>${esc(x.title)}</b><span>${esc(x.value||x.extra)}</span></div>`).join('')}</div></section>`);
  const services=v5Rows(c.v5_services,12,['title','price','desc']); if(services.length) sections.push(`<section class="v5-card"><h2>${esc(c.v5_services_title||'services')}</h2><div class="v5-services">${services.map(x=>`<div class="v5-service"><div><b>${esc(x.title)}</b><p>${esc(x.desc)}</p></div><span>${esc(x.price)}</span></div>`).join('')}</div></section>`);
  const gallery=v5Rows(c.v5_gallery,9,['label','url','href']); if(gallery.length) sections.push(`<section class="v5-card"><h2>${esc(c.v5_gallery_title||'gallery')}</h2><div class="v5-gallery">${gallery.map(x=>`<a href="${esc(x.href||x.url||'#')}" target="_blank"><img src="${esc(x.url)}" alt=""><small>${esc(x.label)}</small></a>`).join('')}</div></section>`);
  const feed=v5Rows(c.v5_feed,18,['title','text','date']); if(feed.length) sections.push(`<section class="v5-card"><h2>${esc(c.v5_feed_title||'feed')}</h2><div class="v5-feed">${feed.map(x=>`<div class="v5-feeditem"><i class="v5-dot"></i><div><b>${esc(x.title)}</b><span>${esc(x.text)} ${x.date?'· '+esc(x.date):''}</span></div></div>`).join('')}</div></section>`);
  const faq=v5Rows(c.v5_faq,12,['q','a']); if(faq.length) sections.push(`<section class="v5-card v5-faq"><h2>${esc(c.v5_faq_title||'faq')}</h2>${faq.map(x=>`<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</section>`);
  if(v5Bool(c.v5_countdown_enabled)&&c.v5_countdown_date) sections.push(`<section class="v5-card"><h2>${esc(c.v5_countdown_title||'countdown')}</h2><div class="v5-count" data-v5-countdown="${esc(c.v5_countdown_date)}"><div><b data-d>0</b><span>days</span></div><div><b data-h>0</b><span>hours</span></div><div><b data-m>0</b><span>min</span></div><div><b data-s>0</b><span>sec</span></div></div></section>`);
  const songs=v5Rows(c.v5_playlist,10,['title','artist','url']); if(songs.length) sections.push(`<section class="v5-card"><h2>${esc(c.v5_playlist_title||'playlist')}</h2><div class="v5-playlist">${songs.map(x=>`<a class="v5-song" href="${esc(x.url||'#')}" target="_blank"><i></i><div><b>${esc(x.title)}</b><span>${esc(x.artist)}</span></div></a>`).join('')}</div></section>`);
  if(v5Bool(c.v5_terminal_enabled)) sections.push(`<section class="v5-terminal"><code>${esc(c.v5_terminal_text||'> booting profile...\n> status: online\n> aura: locked in')}</code></section>`);
  if(v5Bool(c.v5_secret_enabled)) sections.push(`<section class="v5-card v5-secret" id="v5Secret"><h2>${esc(c.v5_secret_title||'secret')}</h2><p>${esc(c.v5_secret_text||'hidden section unlocked')}</p></section>`);
  if(v5Bool(c.v5_reactions_enabled)){const reacts=cleanLines(c.v5_reactions||'🔥\n🖤\n💎\n👀',10);sections.push(`<section class="v5-card"><h2>${esc(c.v5_reactions_title||'react')}</h2><div class="v5-reactions">${reacts.map(r=>`<button type="button" class="v5-react" data-reaction="${esc(r)}">${esc(r)}</button>`).join('')}</div></section>`);}
  if(c.v5_marquee_text) html += `<div class="v5-card v5-marquee"><span>${esc(c.v5_marquee_text)}</span></div>`;
  if(c.v5_nav_enabled!==false) html += `<nav class="v5-nav"><a href="#" onclick="scrollTo({top:0,behavior:'smooth'});return false">top</a>${(c.links||[]).slice(0,3).map((l,i)=>`<a href="${c.click_tracking===false?esc(getLinkUrl(l)||'#'):'/go/'+i}" target="_blank">${esc((PLATFORMS[l.platform]||PLATFORMS.link).name)}</a>`).join('')}<button type="button" onclick="v5OpenCommand()">cmd</button></nav>`;
  html += `<div class="v5-root">${sections.join('')}</div><div class="v5-command" id="v5Command"><div class="v5-command-box"><input id="v5CommandInput" placeholder="search profile commands..." autocomplete="off"><div class="v5-command-list" id="v5CommandList"></div></div></div>`;
  html += `<script>(function(){var spot=document.getElementById('v5Spotlight');if(spot)document.addEventListener('pointermove',function(e){document.documentElement.style.setProperty('--mx',e.clientX+'px');document.documentElement.style.setProperty('--my',e.clientY+'px')});document.querySelectorAll('[data-v5-countdown]').forEach(function(box){function tick(){var t=new Date(box.dataset.v5Countdown).getTime()-Date.now();if(!isFinite(t))t=0;t=Math.max(0,t);var d=Math.floor(t/86400000),h=Math.floor(t/3600000)%24,m=Math.floor(t/60000)%60,s=Math.floor(t/1000)%60;box.querySelector('[data-d]').textContent=d;box.querySelector('[data-h]').textContent=h;box.querySelector('[data-m]').textContent=m;box.querySelector('[data-s]').textContent=s}tick();setInterval(tick,1000)});document.querySelectorAll('.v5-react').forEach(function(btn){btn.onclick=function(){var r=btn.dataset.reaction||btn.textContent;btn.textContent=r+' ✓';try{fetch('/api/reaction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reaction:r})})}catch(e){}}});var secret='${esc(c.v5_secret_code||'open')}',typed='';document.addEventListener('keydown',function(e){typed=(typed+e.key).slice(-32);if(secret&&typed.toLowerCase().includes(secret.toLowerCase())){var s=document.getElementById('v5Secret');if(s)s.classList.add('unlocked')}});var cmds=[['copy link',function(){navigator.clipboard&&navigator.clipboard.writeText(location.href)}],['top',function(){scrollTo({top:0,behavior:'smooth'})}],['unlock secret',function(){var s=document.getElementById('v5Secret');if(s)s.classList.add('unlocked')}],['theme invert',function(){document.body.classList.toggle('ux-light-mode')}]];window.v5OpenCommand=function(){var el=document.getElementById('v5Command');if(el){el.classList.add('show');setTimeout(function(){var i=document.getElementById('v5CommandInput');if(i)i.focus()},20);render('')}};function close(){var el=document.getElementById('v5Command');if(el)el.classList.remove('show')}function render(q){var list=document.getElementById('v5CommandList');if(!list)return;q=(q||'').toLowerCase();var f=cmds.filter(function(c){return !q||c[0].includes(q)});list.innerHTML=f.map(function(c,i){return '<button type="button" data-i="'+i+'"><span>'+c[0]+'</span><b>enter</b></button>'}).join('');list.querySelectorAll('button').forEach(function(b){b.onclick=function(){var fn=f[Number(b.dataset.i)]&&f[Number(b.dataset.i)][1];if(fn)fn();close()}})}var input=document.getElementById('v5CommandInput');if(input)input.addEventListener('input',function(){render(this.value)});document.addEventListener('keydown',function(e){if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();v5OpenCommand()}if(e.key==='Escape')close()});var cmd=document.getElementById('v5Command');if(cmd)cmd.addEventListener('click',function(e){if(e.target===cmd)close()})})();<\/script>`;
  return html;
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
  const badges = normalizeBadges(c.badges).map((b,i)=>renderBadge(b,i,c.accent||"#c8ff00")).join("");
  const bioLines = (c.bio||"").split("\n").map(l=>`<span>${l}</span>`).join("<br>");
  const linkStyle = c.link_style || "default";

  const links = (c.links||[]).map((l, idx) => {
    const p = PLATFORMS[l.platform] || PLATFORMS.link;
    const url = getLinkUrl(l);
    const display = l.username || p.name;
    const color = p.color;
    const trackedUrl = (c.click_tracking === false) ? url : (url ? "/go/" + idx : null);
    const isLink = trackedUrl && !p.clickable;
    const tag = isLink ? "a" : "div";
    const hrefAttr = isLink ? `href="${trackedUrl}" target="_blank" rel="noopener noreferrer"` : "";
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
    ${c.audio_autoplay ? `
    <div id="click-to-enter" style="position:fixed;inset:0;background:var(--bg,#0a0a0a);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 0.4s ease;backdrop-filter:blur(10px);">
      <span style="font-family:'Space Mono',monospace;font-size:14px;color:var(--a);animation:pulse 2s infinite;">[ click anywhere ]</span>
      <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}</style>
    </div>` : ""}
    <div class="audio-widget" id="aw">
      <video id="bgAudio" playsinline ${c.audio_loop?"loop":""} preload="auto" style="position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;">
        <source src="${c.audio_url&&c.audio_url.startsWith("data:")?"/audio":c.audio_url}" type="${c.audio_url&&c.audio_url.startsWith("data:")?c.audio_url.split(";")[0].replace("data:",""):(c.audio_url||"").endsWith(".ogg")?"audio/ogg":(c.audio_url||"").endsWith(".wav")?"audio/wav":"audio/mp4"}">
      </video>
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
    var _aud = document.getElementById('bgAudio');
    var _bars = document.getElementById('awBars');
    var _overlay = document.getElementById('click-to-enter');
    _aud.volume = ${c.audio_volume||0.5};
    function _setPlaying(on){document.getElementById('awIconPlay').style.display=on?'none':'';document.getElementById('awIconPause').style.display=on?'':'none';_bars.classList.toggle('paused',!on);}
    function toggleAudio(){if(_aud.paused){_aud.play().then(function(){_setPlaying(true);}).catch(function(){});}else{_aud.pause();_setPlaying(false);}}
    _aud.addEventListener('play',function(){_setPlaying(true);});
    _aud.addEventListener('pause',function(){_setPlaying(false);});
    ${c.audio_autoplay ? `
    function startExperience(){
      if(_overlay){_overlay.style.opacity='0';setTimeout(function(){_overlay.style.display='none';},400);}
      _aud.muted=false;
      _aud.play().catch(function(e){console.log('Autoplay blockiert:',e);});
      document.removeEventListener('click',startExperience);
    }
    document.addEventListener('click',startExperience);
    ` : `
    _bars.classList.add('paused');
    `}
    </script>` : "";
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
  const favicon = c.favicon_url || c.avatar_url || "";
  const featureClasses = enabledFeatureClasses(c.feature_flags);
  const customJS = c.custom_js ? String(c.custom_js).replace(/<\/script/gi, "<\\/script") : "";

  return `<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(metaTitle)}</title>
<meta name="description" content="${esc(metaDesc)}">
<meta property="og:title" content="${esc(metaTitle)}"><meta property="og:description" content="${esc(metaDesc)}">
${c.avatar_url?`<meta property="og:image" content="${esc(c.avatar_url)}">`:""}
${favicon?`<link rel="icon" href="${esc(favicon)}"><link rel="apple-touch-icon" href="${esc(favicon)}">`:""}
${c.custom_head||""}
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
.badge{font-family:'Space Mono',monospace;font-size:10px;padding:4px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--bc,var(--t)) 18%,transparent);color:color-mix(in srgb,var(--bc,var(--t)) 78%,transparent);letter-spacing:.05em;text-transform:uppercase;display:inline-flex;align-items:center;gap:5px;line-height:1.2}
.badge.accent,.badge[style]{border-color:color-mix(in srgb,var(--bc,var(--a)) 40%,transparent);color:var(--bc,var(--a));background:color-mix(in srgb,var(--bc,var(--a)) 7%,transparent)}
.badge-solid{background:var(--bc,var(--a))!important;color:#060606!important;border-color:var(--bc,var(--a))!important}
.badge-glass{background:rgba(255,255,255,.08)!important;backdrop-filter:blur(10px)}
.badge-neon{box-shadow:0 0 14px color-mix(in srgb,var(--bc,var(--a)) 35%,transparent)}
.badge-img{width:14px;height:14px;border-radius:4px;object-fit:cover}.badge-ico{font-size:12px;line-height:1}

/* ===== 150 PUBLIC FEATURE FLAGS ===== */
.fx-card-hover-raise .card:hover{transform:translateY(-8px)}.fx-card-hover-scale .card:hover{transform:scale(1.025)}.fx-card-floating .card{animation:fu .6s cubic-bezier(.16,1,.3,1) both,floatCard 6s ease-in-out infinite}@keyframes floatCard{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}.fx-card-border-glow .card{box-shadow:0 0 0 1px var(--a),0 0 28px color-mix(in srgb,var(--a) 22%,transparent)}.fx-card-double-border .card::before{content:'';position:absolute;inset:8px;border:1px solid color-mix(in srgb,var(--a) 28%,transparent);border-radius:inherit;pointer-events:none}.fx-card-shadow-soft .card{box-shadow:0 28px 80px rgba(0,0,0,.32)}.fx-card-shadow-neon .card{box-shadow:0 0 60px color-mix(in srgb,var(--a) 18%,transparent)}.fx-card-glass-max .card{background:rgba(255,255,255,.08)!important;backdrop-filter:blur(34px) saturate(160%)}.fx-card-dark-matte .card{background:#050505!important}.fx-card-light-frost .card{background:rgba(255,255,255,.88)!important;color:#111}.fx-card-gradient-surface .card{background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.025))!important}.fx-card-noise-overlay .card::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:.18;background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,.3) 1px,transparent 0);background-size:13px 13px}.fx-card-inner-grid .card{background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:22px 22px}.fx-card-corner-dots .card::before{content:'✦';position:absolute;top:12px;right:14px;color:var(--a);opacity:.7}.fx-card-compact-padding .card{padding:1.45rem!important}
.fx-avatar-pulse .avi{animation:avPulse 2s ease-in-out infinite}@keyframes avPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--a) 30%,transparent)}50%{box-shadow:0 0 0 10px transparent}}.fx-avatar-ring-spin .avi::before{content:'';position:absolute;inset:-3px;border-radius:inherit;border:2px dashed var(--a);animation:spin 8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.fx-avatar-neon-ring .avi{border-color:var(--a);box-shadow:0 0 25px color-mix(in srgb,var(--a) 38%,transparent)}.fx-avatar-double-ring .avi{box-shadow:0 0 0 4px rgba(255,255,255,.06),0 0 0 8px color-mix(in srgb,var(--a) 18%,transparent)}.fx-avatar-square-hard .avi{border-radius:8px!important}.fx-avatar-soft-shadow .avi{box-shadow:0 20px 45px rgba(0,0,0,.35)}.fx-avatar-grayscale .avi img{filter:grayscale(1)}.fx-avatar-saturate .avi img{filter:saturate(1.7) contrast(1.08)}.fx-avatar-tilt-hover .avi:hover{transform:rotate(-3deg) scale(1.04)}.fx-avatar-bounce-in .avi{animation:avBounce .75s cubic-bezier(.34,1.56,.64,1) both}@keyframes avBounce{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}.fx-avatar-online-ping .st::after{content:'';position:absolute;inset:-5px;border-radius:inherit;border:1px solid currentColor;animation:ping 1.5s infinite}@keyframes ping{to{transform:scale(1.9);opacity:0}}.fx-avatar-status-hidden .st{display:none}.fx-avatar-status-big .st{width:20px;height:20px}.fx-avatar-status-square .st{border-radius:5px}.fx-avatar-mirror .avi img{transform:scaleX(-1)}
.fx-type-name-gradient .name span,.fx-name-gradient .name span{background:linear-gradient(90deg,var(--a),#fff,var(--a));-webkit-background-clip:text;color:transparent}.fx-type-name-glow .name{text-shadow:0 0 18px color-mix(in srgb,var(--a) 45%,transparent)}.fx-type-name-outline .name{-webkit-text-stroke:1px var(--a);color:transparent}.fx-type-name-uppercase .name,.fx-uppercase-name .name{text-transform:uppercase}.fx-type-name-lowercase .name,.fx-lowercase-name .name{text-transform:lowercase}.fx-type-name-spaced .name{letter-spacing:.08em}.fx-type-bio-mono .bio,.fx-mono-bio .bio{font-family:'Space Mono',monospace}.fx-type-bio-large .bio{font-size:1rem}.fx-type-bio-small .bio{font-size:.75rem}.fx-type-bio-muted .bio{opacity:.62}.fx-type-bio-bright .bio{color:var(--t)}.fx-type-bio-centered .bio{text-align:center}.fx-type-bio-left .bio{text-align:left}.fx-type-pronouns-pill .pron{display:inline-block;border:1px solid color-mix(in srgb,var(--a) 28%,transparent);border-radius:999px;padding:4px 10px;margin-left:50%;transform:translateX(-50%)}.fx-type-hide-pronouns .pron{display:none}
.fx-link-lift .link-btn:hover{transform:translateY(-3px) scale(1.01)}.fx-link-shine .link-btn{position:relative;overflow:hidden}.fx-link-shine .link-btn::after{content:'';position:absolute;inset:-80% auto -80% -30%;width:24px;background:rgba(255,255,255,.28);transform:rotate(25deg);transition:left .6s}.fx-link-shine .link-btn:hover::after{left:120%}.fx-link-compact .link-btn{padding:8px 12px}.fx-link-wide .lks{gap:12px}.fx-link-left-accent .link-btn{border-left:4px solid var(--lc,var(--a))}.fx-link-icon-box .li{background:color-mix(in srgb,var(--lc,var(--a)) 15%,transparent);border-radius:9px;padding:5px;width:30px;height:30px}.fx-link-rounded-pill .link-btn{border-radius:999px!important}.fx-link-square .link-btn{border-radius:5px!important}.fx-link-neon-glow .link-btn:hover{box-shadow:0 0 18px color-mix(in srgb,var(--lc,var(--a)) 45%,transparent)}.fx-link-text-big .link-username{font-size:1.05rem}.fx-link-platform-hide .link-platform{display:none}.fx-link-username-uppercase .link-username{text-transform:uppercase}.fx-link-stagger .link-btn:nth-child(even){margin-left:18px}.fx-link-hover-slide .link-btn:hover{padding-left:24px}.fx-link-hover-fill .link-btn:hover{background:var(--lc,var(--a));color:#050505}
.fx-badge-glow .badge,.fx-badges-glow .badge{box-shadow:0 0 12px color-mix(in srgb,var(--bc,var(--a)) 28%,transparent)}.fx-badge-solid-all .badge{background:var(--bc,var(--a))!important;color:#050505!important}.fx-badge-outline-all .badge{background:transparent!important;border-color:var(--bc,var(--a))!important}.fx-badge-glass-all .badge{background:rgba(255,255,255,.08)!important;backdrop-filter:blur(12px)}.fx-badge-neon-all .badge{box-shadow:0 0 16px color-mix(in srgb,var(--bc,var(--a)) 35%,transparent)}.fx-badge-large .badge{font-size:12px;padding:6px 12px}.fx-badge-small .badge{font-size:9px;padding:2px 7px}.fx-badge-rounded-square .badge{border-radius:8px}.fx-badge-icons-round .badge-img{border-radius:50%}.fx-badge-uppercase-off .badge{text-transform:none}.fx-badge-center-compact .br{gap:4px}.fx-badge-spread .br{justify-content:space-between}.fx-badge-gradient .badge{background:linear-gradient(90deg,color-mix(in srgb,var(--bc,var(--a)) 20%,transparent),transparent)!important}.fx-badge-shadow .badge{filter:drop-shadow(0 8px 14px rgba(0,0,0,.25))}.fx-badge-pulse-first .badge:first-child{animation:attention 2s infinite}@keyframes attention{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.fx-bg-vignette::before,.fx-bg-darken::before,.fx-bg-lighten::before,.fx-bg-radial-center::before,.fx-bg-radial-corner::before,.fx-media-video-cover-dark::before,.fx-media-video-cover-light::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0}.fx-bg-vignette::before{box-shadow:inset 0 0 170px rgba(0,0,0,.75)}.fx-bg-scanlines{background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px);background-size:100% 4px}.fx-bg-noise::after{opacity:.18!important}.fx-bg-orbs::before{background:radial-gradient(circle at 20% 25%,color-mix(in srgb,var(--a) 18%,transparent),transparent 28%),radial-gradient(circle at 80% 75%,rgba(255,255,255,.12),transparent 24%)}.fx-bg-stars::before{background-image:radial-gradient(#fff 1px,transparent 1px);background-size:42px 42px;opacity:.2}.fx-bg-radial-center::before{background:radial-gradient(circle at center,color-mix(in srgb,var(--a) 14%,transparent),transparent 55%)}.fx-bg-radial-corner::before{background:radial-gradient(circle at top right,color-mix(in srgb,var(--a) 20%,transparent),transparent 45%)}.fx-bg-contrast{filter:contrast(1.08)}.fx-bg-darken::before{background:rgba(0,0,0,.22)}.fx-bg-lighten::before{background:rgba(255,255,255,.08)}.fx-bg-blur{backdrop-filter:blur(2px)}.fx-bg-saturate{filter:saturate(1.25)}.fx-bg-grid-strong::after{opacity:.9!important}.fx-bg-dots-strong::after{opacity:.9!important}.fx-bg-animated-slow{animation-duration:18s!important}
.fx-motion-slow *{transition-duration:.5s!important}.fx-motion-fast *{transition-duration:.08s!important}.fx-motion-fade-card .card{animation:fadeOnly .8s both}@keyframes fadeOnly{from{opacity:0}to{opacity:1}}.fx-motion-slide-card .card{animation:slideIn .7s both}@keyframes slideIn{from{transform:translateX(-24px);opacity:0}to{transform:none;opacity:1}}.fx-motion-zoom-card .card{animation:zoomIn .55s both}@keyframes zoomIn{from{transform:scale(.94);opacity:0}to{transform:scale(1);opacity:1}}.fx-motion-link-cascade .link-btn{animation:fu .5s both}.fx-motion-link-cascade .link-btn:nth-child(2){animation-delay:.06s}.fx-motion-link-cascade .link-btn:nth-child(3){animation-delay:.12s}.fx-motion-badge-cascade .badge{animation:fu .4s both}.fx-motion-avatar-pop .avi{animation:avBounce .7s both}.fx-motion-background-shift{animation:bgShift 12s ease infinite!important}.fx-motion-hover-tilt .card:hover{transform:perspective(800px) rotateX(2deg) rotateY(-2deg)}.fx-motion-no-animations *{animation:none!important;transition:none!important}.fx-motion-smooth-scroll{scroll-behavior:smooth}.fx-motion-cursor-soft #gl{opacity:.55}.fx-motion-cursor-big #gl{width:650px!important;height:650px!important}.fx-motion-attention-pulse .card{animation:attention 4s infinite}
.fx-layout-wide .card{max-width:560px!important}.fx-layout-narrow .card{max-width:360px!important}.fx-layout-left{align-items:flex-start!important;padding-left:8vw}.fx-layout-right{align-items:flex-end!important;padding-right:8vw}.fx-layout-top{justify-content:flex-start!important}.fx-layout-bottom{justify-content:flex-end!important}.fx-layout-card-left .name,.fx-layout-card-left .bio{text-align:left}.fx-layout-card-right .name,.fx-layout-card-right .bio{text-align:right}.fx-layout-no-divider .dv{display:none}.fx-layout-divider-glow .dv{background:linear-gradient(90deg,transparent,var(--a),transparent);height:2px}.fx-layout-extra-gap .lks{gap:14px}.fx-layout-no-gap .lks{gap:3px}.fx-layout-mobile-compact .card{padding:1.4rem}.fx-layout-safe-area{padding-top:max(2rem,env(safe-area-inset-top));padding-bottom:max(2rem,env(safe-area-inset-bottom))}.fx-layout-minimal .badge,.fx-layout-minimal .pron,.fx-layout-minimal .dv{display:none}
.fx-media-spotify-shadow iframe{box-shadow:0 20px 50px rgba(0,0,0,.25)}.fx-media-spotify-hide iframe{display:none}.fx-media-audio-left .audio-widget{left:1.5rem;right:auto}.fx-media-audio-center .audio-widget{left:50%;right:auto;transform:translateX(-50%)}.fx-media-audio-minimal .aw-vol,.fx-media-volume-hide .aw-vol{display:none}.fx-media-audio-glass .aw-inner{background:rgba(255,255,255,.08)!important}.fx-media-views-pill>p:last-child{border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:999px;padding:5px 11px}.fx-media-views-hide>p:last-child{display:none}.fx-media-video-cover-dark::before{background:rgba(0,0,0,.38)}.fx-media-video-cover-light::before{background:rgba(255,255,255,.12)}.fx-media-audio-bars-neon .aw-bars span{box-shadow:0 0 8px var(--a)}.fx-media-widget-big .aw-inner{padding:12px 18px}.fx-media-widget-small .aw-inner{padding:5px 10px}.fx-media-widget-bottom-center .audio-widget{left:50%;right:auto;bottom:1rem;transform:translateX(-50%)}
.fx-extra-cyber-corners .card{clip-path:polygon(0 12px,12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)}.fx-extra-terminal-lines .bio span::before{content:'> ';color:var(--a)}.fx-extra-heart-cursor{cursor:crosshair}.fx-extra-profile-grid .card{background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:18px 18px}.fx-extra-no-link-arrows .arr{display:none}.fx-extra-link-arrows-large .arr{font-size:1.05rem}.fx-extra-card-separator .br{border-bottom:1px solid color-mix(in srgb,var(--t) 10%,transparent);padding-bottom:12px}.fx-extra-hologram .card{background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.02),rgba(255,255,255,.1))!important}.fx-extra-glitch-name .name{position:relative;text-shadow:2px 0 #ff0050,-2px 0 #00d4ff}.fx-extra-rainbow-accent .name span{background:linear-gradient(90deg,#ff0050,#fffb00,#00ff9d,#00d4ff,#bd00ff);-webkit-background-clip:text;color:transparent}.fx-extra-soft-focus .card{filter:drop-shadow(0 0 40px color-mix(in srgb,var(--a) 13%,transparent))}.fx-extra-high-contrast{--m:color-mix(in srgb,var(--t) 70%,transparent)}.fx-extra-low-contrast{opacity:.86}.fx-extra-print-clean .audio-widget,.fx-extra-print-clean #gl,.fx-extra-print-clean canvas{display:none}.fx-extra-dev-mode .card::after{content:'dev mode';position:absolute;left:12px;top:12px;color:var(--a);font-family:'Space Mono',monospace;font-size:9px;text-transform:uppercase}

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
${v4PublicCSS(c)}</style>${customCSS}
</head><body class="${featureClasses}">
${bgVideoHtml}${particles}${glow}${v4PublicTopLayers(c)}
<div class="card">
  <div class="av"><div class="avi">${avatar}<div class="st"></div></div></div>
  <h1 class="name">@<span>${c.username||"username"}</span></h1>
  ${c.pronouns?`<p class="pron">${c.pronouns}</p>`:""}
  <div class="br">${badges}</div>
  <p class="bio">${bioLines}</p>
  <div class="dv"></div>
  <div class="lks">${links}</div>
  ${spotify}${v4PublicSections(c)}
</div>
${audioWidget}${views}
${renderV6PublicSkin(c)}${customJS?`<script>${customJS}</script>`:""}${v4PublicScripts(c)}${renderV5PublicSuite(c)}
</body></html>`;
}

app.get("/", async (req, res) => {
  const c = await getConfig();
  if (c.show_views) { c.views = (c.views||0)+1; await saveConfig(c); }
  trackEvent(req, "view", { config: c }).catch(()=>{});
  res.send(renderBioPage(c));
});

// Audio-Streaming-Endpoint mit Range-Request-Support (wichtig für Safari + Autoplay)
app.get("/audio", async (req, res) => {
  const c = await getConfig();
  console.log("[audio] audio_url vorhanden:", !!c.audio_url, c.audio_url ? c.audio_url.substring(0,40) : "LEER");
  if (!c.audio_url) return res.status(404).send("no audio configured");
  if (c.audio_url.startsWith("data:")) {
    const commaIdx = c.audio_url.indexOf(",");
    const meta = c.audio_url.substring(0, commaIdx);
    const b64 = c.audio_url.substring(commaIdx + 1);
    let mimeType = meta.replace("data:","").replace(";base64","");
    if (mimeType === "video/mp4" || mimeType === "video/mpeg") mimeType = "audio/mp4";
    const buf = Buffer.from(b64, "base64");
    const total = buf.length;
    console.log("[audio] Dateigröße:", Math.round(total/1024/1024) + "MB", "MIME:", mimeType);
    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": mimeType,
      });
      return res.end(buf.slice(start, end + 1));
    }
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", total);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(buf);
  }
  res.redirect(c.audio_url);
});


app.post("/admin/upload-bg-video", requireAuth, express.raw({ type: ["video/*", "application/octet-stream"], limit: "400mb" }), async (req, res) => {
  try {
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
    if (!buf.length) return res.status(400).json({ ok: false, error: "Keine Video-Daten empfangen." });
    const contentType = req.headers["content-type"] || "application/octet-stream";
    if (!contentType.startsWith("video/") && contentType !== "application/octet-stream") return res.status(415).json({ ok: false, error: "Nur Video-Dateien sind erlaubt." });
    const filename = safeFileName(req.query.name || "background-video");
    await pool.query(
      `INSERT INTO bio_assets (asset_key, filename, content_type, data, size_bytes, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (asset_key) DO UPDATE SET filename = EXCLUDED.filename, content_type = EXCLUDED.content_type, data = EXCLUDED.data, size_bytes = EXCLUDED.size_bytes, updated_at = now()`,
      ["bg_video", filename, contentType, buf, buf.length]
    );
    const c = await getConfig();
    c.bg_type = "video";
    c.bg_video_url = `/asset/bg-video?v=${Date.now()}`;
    await saveConfig(c);
    res.json({ ok: true, url: c.bg_video_url, filename, size: buf.length, content_type: contentType });
  } catch (err) {
    console.error("[upload-bg-video]", err);
    res.status(500).json({ ok: false, error: "Video konnte nicht gespeichert werden." });
  }
});

app.post("/admin/delete-bg-video", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM bio_assets WHERE asset_key = $1", ["bg_video"]);
    const c = await getConfig();
    if (String(c.bg_video_url || "").startsWith("/asset/bg-video")) c.bg_video_url = "";
    if (c.bg_type === "video") c.bg_type = "solid";
    await saveConfig(c);
    res.json({ ok: true });
  } catch (err) {
    console.error("[delete-bg-video]", err);
    res.status(500).json({ ok: false });
  }
});

app.get("/asset/bg-video", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT filename, content_type, data, size_bytes, updated_at FROM bio_assets WHERE asset_key = $1", ["bg_video"]);
    if (!rows.length) return res.status(404).send("no background video");
    const asset = rows[0];
    const buf = Buffer.isBuffer(asset.data) ? asset.data : Buffer.from(asset.data);
    const total = buf.length;
    const contentType = asset.content_type || "video/mp4";
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName(asset.filename || "background-video")}"`);
    const range = parseRange(req.headers.range, total);
    if (range) {
      res.status(206);
      res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${total}`);
      res.setHeader("Content-Length", range.end - range.start + 1);
      return res.end(buf.slice(range.start, range.end + 1));
    }
    res.setHeader("Content-Length", total);
    res.end(buf);
  } catch (err) {
    console.error("[asset-bg-video]", err);
    res.status(500).send("video error");
  }
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

function v4AdminPlugin(c) {
  return `<style>
/* ===== V4 ULTRA ADMIN STUDIO PLUGIN ===== */
.v4badge{display:inline-flex;align-items:center;gap:7px;border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:999px;padding:5px 10px;font-family:'Space Mono',monospace;font-size:10px;color:var(--a);background:rgba(255,255,255,.035)}
.v4grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v4grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.v4panel{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:18px;padding:14px;margin-bottom:12px}.v4panel h3{font-size:13px;margin:0 0 10px;color:var(--t)}.v4small{font-family:'Space Mono',monospace;color:var(--m);font-size:10px;line-height:1.55}.v4stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}.v4stat{border:1px solid rgba(255,255,255,.08);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));padding:14px}.v4stat b{display:block;font-size:22px;color:var(--a)}.v4stat span{font-family:'Space Mono',monospace;color:var(--m);font-size:10px}.v4table{width:100%;border-collapse:collapse;font-family:'Space Mono',monospace;font-size:10px}.v4table td,.v4table th{border-bottom:1px solid rgba(255,255,255,.06);padding:8px;text-align:left;color:var(--m)}.v4table th{color:var(--a);text-transform:uppercase;letter-spacing:.08em}.v4pillrow{display:flex;gap:8px;flex-wrap:wrap}.v4ai{min-height:190px;background:#05070b;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;font-family:'Space Mono',monospace;font-size:11px;color:#9ca3af;white-space:pre-wrap}.v4featureMatrix{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;max-height:360px;overflow:auto}.v4micro{display:flex;justify-content:space-between;gap:8px;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:9px;background:rgba(0,0,0,.16)}.v4micro span{font-family:'Space Mono',monospace;font-size:10px;color:var(--m)}
@media(max-width:900px){.v4grid,.v4grid3,.v4stats{grid-template-columns:1fr}}
</style>
<script>
(function(){
const V4_CONFIG=${safeJson({
  analytics_enabled: c.analytics_enabled !== false,
  click_tracking: c.click_tracking !== false,
  announcement_enabled: !!c.announcement_enabled,
  announcement_text: c.announcement_text||"",
  announcement_url: c.announcement_url||"",
  enter_screen_enabled: !!c.enter_screen_enabled,
  enter_screen_text: c.enter_screen_text||"click to enter",
  share_bar_enabled: c.share_bar_enabled !== false,
  copy_button_enabled: c.copy_button_enabled !== false,
  theme_toggle_enabled: !!c.theme_toggle_enabled,
  profile_title: c.profile_title||"",
  hero_subtitle: c.hero_subtitle||"",
  quote_enabled: !!c.quote_enabled,
  quote_text: c.quote_text||"",
  cta_enabled: !!c.cta_enabled,
  cta_label: c.cta_label||"",
  cta_url: c.cta_url||"",
  stats_enabled: !!c.stats_enabled,
  stats_items: c.stats_items||"",
  gear_enabled: !!c.gear_enabled,
  gear_items: c.gear_items||"",
  timeline_enabled: !!c.timeline_enabled,
  timeline_items: c.timeline_items||"",
  availability_enabled: !!c.availability_enabled,
  availability_text: c.availability_text||"",
  footer_note: c.footer_note||"",
  watermark_enabled: !!c.watermark_enabled,
  disable_right_click: !!c.disable_right_click,
  disable_selection: !!c.disable_selection,
  analytics_public_badge: !!c.analytics_public_badge,
  pwa_name: c.pwa_name||"Bio Page",
  pwa_color: c.pwa_color||c.accent||"#c8ff00",
  seo_keywords: c.seo_keywords||"",
  canonical_url: c.canonical_url||""
})};
function h(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]||m})}
function field(id,label,type,placeholder){
  var v=V4_CONFIG[id];
  if(type==='checkbox') return '<div class="tr"><div><div class="tl">'+label+'</div><div class="td">v4 ultra setting</div></div><label class="sw"><input type="checkbox" id="v4_'+id+'" '+(v?'checked':'')+'><span class="sl"></span></label></div>';
  if(type==='textarea') return '<div class="fi"><label>'+label+'</label><textarea id="v4_'+id+'" rows="5" placeholder="'+h(placeholder||'')+'">'+h(v)+'</textarea></div>';
  if(type==='color') return '<div class="fi"><label>'+label+'</label><div class="cf"><div class="cs"><input type="color" id="v4_'+id+'" value="'+h(v||'#c8ff00')+'"></div><input type="text" id="v4_'+id+'_text" value="'+h(v||'')+'" oninput="document.getElementById(\'v4_'+id+'\').value=this.value"></div></div>';
  return '<div class="fi"><label>'+label+'</label><input type="'+(type||'text')+'" id="v4_'+id+'" value="'+h(v)+'" placeholder="'+h(placeholder||'')+'"></div>';
}
function collect(){var out={};Object.keys(V4_CONFIG).forEach(function(k){var el=document.getElementById('v4_'+k); if(!el)return; out[k]=el.type==='checkbox'?el.checked:el.value;});return out;}
window.v4Collect=collect;
var oldFetch=window.fetch.bind(window);
window.fetch=function(input,init){try{var url=(typeof input==='string'?input:input.url)||''; if(url==='/admin/save'&&init&&init.body){var body=JSON.parse(init.body); Object.assign(body,collect()); init.body=JSON.stringify(body);}}catch(e){} return oldFetch(input,init)};
function addNav(id,label){var target=document.querySelector('.sidebar .ndv')||document.querySelector('.sidebar'); if(!target)return; var btn=document.createElement('button');btn.className='ni';btn.setAttribute('data-section',id);btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M12 4v16"/></svg>'+label;btn.onclick=function(){navTo(id);document.querySelectorAll('.ni').forEach(function(b){b.classList.remove('active')});btn.classList.add('active')}; target.parentNode.insertBefore(btn,target.nextSibling);}
function addSection(id,title,html){var main=document.querySelector('.main');if(!main)return;var div=document.createElement('div');div.className='sec';div.id='sec-'+id;div.innerHTML='<p class="st" style="margin-top:0">'+title+' <span class="v4badge">v4 ultra</span></p>'+html;var saveBtn=main.querySelector('.sbtn');main.insertBefore(div,saveBtn||null);}
function buildStudioHtml(){
  return '<div class="v4grid"><div class="v4panel"><h3>Public Modules</h3>'+
  field('announcement_enabled','Announcement Bar','checkbox')+field('announcement_text','Announcement Text','text','new drop / update / status')+field('announcement_url','Announcement Link','url','https://...')+field('enter_screen_enabled','Click-to-enter Screen','checkbox')+field('enter_screen_text','Enter Text','text','click to enter')+
  '</div><div class="v4panel"><h3>Floating UI</h3>'+field('share_bar_enabled','Share Button','checkbox')+field('copy_button_enabled','Copy Link Button','checkbox')+field('theme_toggle_enabled','Light/Dark Toggle','checkbox')+field('watermark_enabled','Tiny Watermark','checkbox')+field('analytics_public_badge','Public View Counter Pill','checkbox')+'</div></div>'+
  '<div class="v4grid"><div class="v4panel"><h3>Profile Content Blocks</h3>'+field('profile_title','Mini Section Title','text','about me')+field('hero_subtitle','Mini Section Text','textarea','kurzer extra text')+field('quote_enabled','Quote Block','checkbox')+field('quote_text','Quote Text','text','...')+field('availability_enabled','Availability Block','checkbox')+field('availability_text','Availability Text','text','open for duos / dms / collabs')+'</div><div class="v4panel"><h3>CTA / Footer</h3>'+field('cta_enabled','Call-to-action Button','checkbox')+field('cta_label','CTA Label','text','join discord')+field('cta_url','CTA URL','url','https://...')+field('footer_note','Footer Note','text','small footer text')+'</div></div>'+
  '<div class="v4grid"><div class="v4panel"><h3>Stats / Setup</h3>'+field('stats_enabled','Stats Block','checkbox')+field('stats_items','Stats Lines','textarea','Rank: Diamond\\nSens: 6.9\\nRegion: EU')+'</div><div class="v4panel"><h3>Gear / Timeline</h3>'+field('gear_enabled','Gear Block','checkbox')+field('gear_items','Gear Lines','textarea','Mouse: ...\\nKeyboard: ...')+field('timeline_enabled','Timeline Block','checkbox')+field('timeline_items','Timeline Lines','textarea','2024 started\\n2025 upgraded')+'</div></div>'+
  '<div class="v4panel"><h3>Privacy / SEO / PWA</h3><div class="v4grid3">'+field('disable_right_click','Disable Right Click','checkbox')+field('disable_selection','Disable Text Selection','checkbox')+field('click_tracking','Click Tracking','checkbox')+field('analytics_enabled','Analytics Enabled','checkbox')+field('pwa_name','PWA Name','text','Bio Page')+field('pwa_color','PWA Color','color')+field('seo_keywords','SEO Keywords','text','bio, links, ...')+field('canonical_url','Canonical URL','url','https://domain.de')+'</div></div>';
}
function build(){
  addNav('v4studio','V4 Studio'); addNav('analytics','Analytics'); addNav('automation','Automation'); addNav('sharekit','Share Kit');
  addSection('v4studio','V4 Studio', buildStudioHtml());
  addSection('analytics','Analytics', '<div class="v4stats"><div class="v4stat"><b id="v4views">-</b><span>Views 7 Tage</span></div><div class="v4stat"><b id="v4clicks">-</b><span>Klicks 7 Tage</span></div><div class="v4stat"><b id="v4ctr">-</b><span>CTR</span></div><div class="v4stat"><b id="v4links">-</b><span>Top Links</span></div></div><div class="v4panel"><h3>Top Links</h3><table class="v4table"><thead><tr><th>Link</th><th>Klicks</th></tr></thead><tbody id="v4TopLinks"><tr><td colspan="2">lade...</td></tr></tbody></table></div><div class="v4panel"><h3>Letzte Events</h3><table class="v4table"><thead><tr><th>Zeit</th><th>Typ</th><th>Info</th></tr></thead><tbody id="v4Events"><tr><td colspan="3">lade...</td></tr></tbody></table></div><div class="feature-actions"><button class="bab" onclick="v4LoadAnalytics()">Refresh Analytics</button><button class="bab mini-danger" onclick="v4ResetAnalytics()">Analytics löschen</button></div>');
  addSection('automation','Automation Lab', '<div class="v4grid"><div class="v4panel"><h3>One-click Presets</h3><div class="v4pillrow"><button class="bab" onclick="v4Preset(\'dating\')">Dating Bio</button><button class="bab" onclick="v4Preset(\'gamer\')">Gamer Bio</button><button class="bab" onclick="v4Preset(\'vip\')">VIP Look</button><button class="bab" onclick="v4Preset(\'minimal\')">Minimal Flex</button></div><p class="v4small">Presets setzen sinnvolle Module, Texte und Feature-Kombis. Danach normal speichern.</p></div><div class="v4panel"><h3>Bio Ideas Generator</h3><div class="v4ai" id="v4IdeaBox">Klick auf generieren und du bekommst sofort Bio-Ideen basierend auf deinem aktuellen Style.</div><button class="bab" onclick="v4GenerateIdeas()">Ideen generieren</button></div></div><div class="v4panel"><h3>Quality Checklist</h3><div id="v4Checklist" class="v4featureMatrix"></div></div>');
  addSection('sharekit','Share Kit', '<div class="v4grid"><div class="v4panel"><h3>Public Endpoints</h3><p class="v4small">/manifest.webmanifest · /robots.txt · /sitemap.xml · /share-card.svg · /theme.json · /healthz</p><div class="v4pillrow"><a class="bab" href="/share-card.svg" target="_blank">Share Card</a><a class="bab" href="/manifest.webmanifest" target="_blank">Manifest</a><a class="bab" href="/theme.json" target="_blank">Theme JSON</a></div></div><div class="v4panel"><h3>Backups</h3><div class="v4pillrow"><button class="bab" onclick="v4MakeSnapshot()">Snapshot erstellen</button><button class="bab" onclick="v4ListSnapshots()">Snapshots laden</button><button class="bab" onclick="exportDraftConfig()">Draft export</button></div><div id="v4Snapshots" class="v4small" style="margin-top:10px"></div></div></div>');
  setTimeout(function(){v4LoadAnalytics();v4BuildChecklist();},250);
}
window.v4LoadAnalytics=function(){fetch('/admin/api/analytics').then(r=>r.json()).then(function(d){document.getElementById('v4views').textContent=d.views_7d||0;document.getElementById('v4clicks').textContent=d.clicks_7d||0;document.getElementById('v4ctr').textContent=(d.ctr||0)+'%';document.getElementById('v4links').textContent=(d.top_links||[]).length;document.getElementById('v4TopLinks').innerHTML=(d.top_links||[]).map(function(x){return '<tr><td>'+h(x.label||x.platform||'link')+'</td><td>'+x.clicks+'</td></tr>';}).join('')||'<tr><td colspan="2">noch keine Klicks</td></tr>';document.getElementById('v4Events').innerHTML=(d.events||[]).map(function(x){return '<tr><td>'+h(x.created_at||'')+'</td><td>'+h(x.type||'')+'</td><td>'+h(x.link_label||x.path||'')+'</td></tr>';}).join('')||'<tr><td colspan="3">noch keine Events</td></tr>';}).catch(function(e){console.warn(e);});}
window.v4ResetAnalytics=function(){if(!confirm('Analytics wirklich löschen?'))return;fetch('/admin/api/reset-analytics',{method:'POST'}).then(function(){v4LoadAnalytics();});}
window.v4MakeSnapshot=function(){fetch('/admin/api/snapshot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:'manual '+new Date().toLocaleString()})}).then(function(r){return r.json();}).then(function(){v4ListSnapshots();});}
window.v4ListSnapshots=function(){fetch('/admin/api/snapshots').then(function(r){return r.json();}).then(function(d){document.getElementById('v4Snapshots').innerHTML=(d.snapshots||[]).map(function(s){return '#'+s.id+' · '+h(s.label||'snapshot')+' · '+h(s.created_at);}).join('<br>')||'keine snapshots';});}
window.v4Preset=function(name){if(name==='gamer'){document.getElementById('v4_stats_enabled').checked=true;document.getElementById('v4_stats_items').value='Rank: Diamond\nGame: Fortnite / Valorant\nRegion: EU';document.getElementById('v4_gear_enabled').checked=true;} if(name==='dating'){document.getElementById('v4_quote_enabled').checked=true;document.getElementById('v4_quote_text').value='series, late night talks and gaming';} if(name==='vip'){document.getElementById('v4_announcement_enabled').checked=true;document.getElementById('v4_announcement_text').value='premium profile enabled';} if(name==='minimal'){document.getElementById('v4_footer_note').value='less noise more aura';} markDirty();}
window.v4GenerateIdeas=function(){var u=(document.getElementById('username')||{}).value||'username';var ideas=['@'+u+' · lowkey but not offline','series at night gaming till sunrise','not hard to find just hard to forget','vip energy private life public links','eu gamer · clean aim · colder profile'];document.getElementById('v4IdeaBox').textContent=ideas.map(function(x,i){return (i+1)+'. '+x;}).join('\n');}
window.v4BuildChecklist=function(){var items=[['Avatar gesetzt',!!(document.getElementById('avatar_url')&&document.getElementById('avatar_url').value)||!!(document.getElementById('avatar_emoji')&&document.getElementById('avatar_emoji').value)],['Bio nicht leer',!!(document.getElementById('bio')&&document.getElementById('bio').value.trim())],['Mindestens 2 Links',Array.isArray(window.links)&&window.links.length>=2],['Meta Title',!!(document.getElementById('meta_title')&&document.getElementById('meta_title').value)],['Accent gewählt',!!(document.getElementById('accent')&&document.getElementById('accent').value)],['Click Tracking aktiv',!!(document.getElementById('v4_click_tracking')&&document.getElementById('v4_click_tracking').checked)],['Share Buttons aktiv',!!(document.getElementById('v4_share_bar_enabled')&&document.getElementById('v4_share_bar_enabled').checked)],['Mobile safe',true],['Backup möglich',true],['Favicon möglich',true]];var el=document.getElementById('v4Checklist');if(el)el.innerHTML=items.map(function(x){return '<div class="v4micro"><span>'+h(x[0])+'</span><b style="color:'+(x[1]?'#22c55e':'#ef4444')+'">'+(x[1]?'ok':'fix')+'</b></div>';}).join('');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
<\/script>`;
}


/* ===== V5 EXTREME ADMIN PLUGIN: Theme Forge, Component Builder, real controls ===== */
function v5AdminPlugin(c) {
  const cfg = {
    v5_enabled: v5Bool(c.v5_enabled), v5_nav_enabled: c.v5_nav_enabled !== false,
    v5_aura_enabled: v5Bool(c.v5_aura_enabled), v5_aura_title: c.v5_aura_title || "Aura Level", v5_aura_score: c.v5_aura_score || 78, v5_aura_text: c.v5_aura_text || "premium profile energy",
    v5_tags_title: c.v5_tags_title || "tags", v5_tags: c.v5_tags || "fortnite\nvalorant\nnight talks\nseries\nlowkey",
    v5_highlights_title: c.v5_highlights_title || "highlights", v5_highlights: c.v5_highlights || "Rank|Diamond+\nRegion|EU\nMode|Competitive\nEnergy|Private but premium",
    v5_services_title: c.v5_services_title || "services", v5_services: c.v5_services || "Duo Queue|ask|fortnite / valo\nCoaching|soon|mechanics and mindset\nCustom Profile|dm|clean bio design",
    v5_gallery_title: c.v5_gallery_title || "gallery", v5_gallery: c.v5_gallery || "",
    v5_feed_title: c.v5_feed_title || "feed", v5_feed: c.v5_feed || "currently|building the cleanest profile|now\ngrinding|aim and mechanics|daily",
    v5_faq_title: c.v5_faq_title || "faq", v5_faq: c.v5_faq || "who are you?|just someone with taste\ncan i dm?|yes if it is not weird",
    v5_countdown_enabled: v5Bool(c.v5_countdown_enabled), v5_countdown_title: c.v5_countdown_title || "countdown", v5_countdown_date: c.v5_countdown_date || "",
    v5_playlist_title: c.v5_playlist_title || "playlist", v5_playlist: c.v5_playlist || "",
    v5_terminal_enabled: v5Bool(c.v5_terminal_enabled), v5_terminal_text: c.v5_terminal_text || "> booting profile...\n> status: online\n> aura: locked in",
    v5_secret_enabled: v5Bool(c.v5_secret_enabled), v5_secret_code: c.v5_secret_code || "open", v5_secret_title: c.v5_secret_title || "secret", v5_secret_text: c.v5_secret_text || "hidden section unlocked",
    v5_reactions_enabled: v5Bool(c.v5_reactions_enabled), v5_reactions_title: c.v5_reactions_title || "react", v5_reactions: c.v5_reactions || "🔥\n🖤\n💎\n👀",
    v5_marquee_text: c.v5_marquee_text || "",
    v5_fx: Object.assign({floating_orb:true,mouse_spotlight:true,soft_grain:true,premium_aura:true,link_magnet:true,badge_rainbow:false,tilt_avatar:true,audio_glass:true}, c.v5_fx || {})
  };
  return `
<style>
.v5-admin-shell{display:grid;gap:16px}.v5-hero{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--a) 24%,transparent);border-radius:24px;padding:20px;background:radial-gradient(circle at top left,color-mix(in srgb,var(--a) 18%,transparent),transparent 38%),linear-gradient(135deg,#101014,#070708);box-shadow:0 30px 120px rgba(0,0,0,.35)}.v5-hero:after{content:'';position:absolute;inset:-80px -120px auto auto;width:260px;height:260px;border-radius:50%;background:var(--a);opacity:.12;filter:blur(28px)}.v5-hero h2{font-size:1.35rem;margin-bottom:6px}.v5-hero p{font-family:'Space Mono',monospace;color:var(--m);font-size:11px}.v5-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.v5-admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.v5-admin-panel{border:1px solid var(--b);border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));padding:16px}.v5-admin-panel h3{font-size:.95rem;margin-bottom:10px}.v5-admin-panel textarea{min-height:112px}.v5-small{font-family:'Space Mono',monospace;font-size:10px;color:var(--m);line-height:1.5}.v5-switch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v5-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--b2);border-radius:14px;padding:10px;background:var(--bg)}.v5-toggle span{font-family:'Space Mono',monospace;font-size:10px;color:var(--t)}.v5-matrix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v5-preset{border:1px solid var(--b2);border-radius:16px;padding:12px;background:var(--bg);cursor:pointer}.v5-preset b{display:block;font-size:12px}.v5-preset span{font-family:'Space Mono',monospace;font-size:10px;color:var(--m)}.v5-preset:hover{border-color:var(--a);transform:translateY(-1px)}.v5-score{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.v5-score div{border:1px solid var(--b2);border-radius:16px;padding:12px;background:var(--bg)}.v5-score b{font-size:20px;color:var(--a)}.v5-score span{display:block;font-family:'Space Mono',monospace;font-size:9px;color:var(--m);text-transform:uppercase}.v5-plugin-list{display:grid;gap:8px}.v5-plugin{border:1px solid var(--b2);border-radius:14px;padding:10px;background:var(--bg);display:flex;align-items:center;justify-content:space-between;gap:10px}.v5-plugin code{font-size:10px;color:var(--a)}@media(max-width:980px){.v5-admin-grid,.v5-matrix{grid-template-columns:1fr}.v5-score{grid-template-columns:repeat(2,1fr)}}
</style>
<script>
(function(){
const V5_CFG=${safeJson(cfg)};
function h(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function field(id,label,type,help){var v=V5_CFG[id]; if(type==='check')return '<div class="tr"><div><div class="tl">'+h(label)+'</div><div class="td">'+h(help||'')+'</div></div><label class="sw"><input id="v5_'+id+'" type="checkbox" '+(v?'checked':'')+'><span class="sl"></span></label></div>'; if(type==='area')return '<div class="fi"><label>'+h(label)+'</label><textarea id="v5_'+id+'">'+h(v||'')+'</textarea><div class="v5-small">'+h(help||'')+'</div></div>'; if(type==='number')return '<div class="fi"><label>'+h(label)+'</label><input id="v5_'+id+'" type="text" inputmode="numeric" value="'+h(v||'')+'"><div class="v5-small">'+h(help||'')+'</div></div>'; return '<div class="fi"><label>'+h(label)+'</label><input id="v5_'+id+'" type="text" value="'+h(v||'')+'"><div class="v5-small">'+h(help||'')+'</div></div>';}
function fxToggle(key,label){return '<label class="v5-toggle"><span>'+h(label)+'</span><label class="sw"><input type="checkbox" data-v5fx="'+h(key)+'" '+(V5_CFG.v5_fx&&V5_CFG.v5_fx[key]?'checked':'')+'><span class="sl"></span></label></label>';}
function panel(title,body){return '<div class="v5-admin-panel"><h3>'+h(title)+'</h3>'+body+'</div>';}
function addNav(id,label){var side=document.querySelector('.sidebar .sf')||document.querySelector('.sidebar');if(!side||document.querySelector('[data-section="'+id+'"]'))return;var b=document.createElement('button');b.type='button';b.className='ni';b.dataset.section=id;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.8 6 6.2.8-4.5 4.3 1.1 6.1L12 16.1 6.4 19.2l1.1-6.1L3 8.8 9.2 8z"/></svg><span>'+label+'</span>';side.parentNode.insertBefore(b,side);b.addEventListener('click',function(){navTo(id);document.querySelectorAll('.ni').forEach(x=>x.classList.remove('active'));b.classList.add('active')});}
function addSection(id,html){var main=document.querySelector('.main form')||document.querySelector('.main');if(!main||document.getElementById('sec-'+id))return;var sec=document.createElement('section');sec.className='sec';sec.id='sec-'+id;sec.innerHTML=html;main.insertBefore(sec,main.querySelector('.sbtn')||null);}
function buildLab(){return '<div class="v5-admin-shell"><div class="v5-hero"><h2>V5 Extreme Experience</h2><p>Component engine, command menu, micro sections, reactions, secret unlocks, aura modules and cinematic profile effects.</p><div class="v5-actions"><button type="button" class="bab" onclick="v5PresetUltra()">Ultra Preset</button><button type="button" class="bab" onclick="v5PresetDating()">Dating Preset</button><button type="button" class="bab" onclick="v5PresetCreator()">Creator Preset</button><button type="button" class="bab" onclick="v5RunAudit()">Audit</button></div></div><div class="v5-score" id="v5Score"><div><b>--</b><span>score</span></div><div><b>--</b><span>modules</span></div><div><b>--</b><span>links</span></div><div><b>--</b><span>badges</span></div></div><div class="v5-admin-grid">'+panel('Core',field('v5_enabled','V5 Public Suite','check','aktiviert alle neuen public module')+field('v5_nav_enabled','Bottom Nav + CMD','check','dock unten')+field('v5_marquee_text','Top Marquee'))+panel('Aura / Tags',field('v5_aura_enabled','Aura Meter','check','visueller energy balken')+field('v5_aura_title','Aura Titel')+field('v5_aura_score','Aura Score','number','0-100')+field('v5_aura_text','Aura Text')+field('v5_tags_title','Tags Titel')+field('v5_tags','Tags','area','eine Zeile pro Tag'))+panel('Highlights / Services',field('v5_highlights_title','Highlights Titel')+field('v5_highlights','Highlights','area','Titel|Wert')+field('v5_services_title','Services Titel')+field('v5_services','Services','area','Name|Preis|Beschreibung'))+panel('Gallery / Feed',field('v5_gallery_title','Gallery Titel')+field('v5_gallery','Gallery','area','Label|BildURL|LinkURL')+field('v5_feed_title','Feed Titel')+field('v5_feed','Feed','area','Titel|Text|Datum'))+panel('FAQ / Countdown',field('v5_faq_title','FAQ Titel')+field('v5_faq','FAQ','area','Frage|Antwort')+field('v5_countdown_enabled','Countdown','check','Event Timer')+field('v5_countdown_title','Countdown Titel')+field('v5_countdown_date','Datum','text','YYYY-MM-DDTHH:MM:SS'))+panel('Playlist / Terminal',field('v5_playlist_title','Playlist Titel')+field('v5_playlist','Songs','area','Song|Artist|URL')+field('v5_terminal_enabled','Terminal','check','fake terminal')+field('v5_terminal_text','Terminal Text','area','mehrzeilig'))+panel('Secret / Reactions',field('v5_secret_enabled','Secret Section','check','per code freischaltbar')+field('v5_secret_code','Secret Code')+field('v5_secret_title','Secret Titel')+field('v5_secret_text','Secret Text','area')+field('v5_reactions_enabled','Reactions','check','Besucher können reagieren')+field('v5_reactions_title','Reaction Titel')+field('v5_reactions','Reaction Buttons','area','eine Zeile pro Emoji/Text'))+panel('Cinematic FX','<div class="v5-switch-grid">'+fxToggle('floating_orb','Floating Aura Orb')+fxToggle('mouse_spotlight','Mouse Spotlight')+fxToggle('soft_grain','Soft Film Grain')+fxToggle('premium_aura','Premium Aura Shadow')+fxToggle('link_magnet','Magnetic Links')+fxToggle('badge_rainbow','Rainbow Badges')+fxToggle('tilt_avatar','Avatar Tilt')+fxToggle('audio_glass','Glass Audio Widget')+'</div>')+'</div></div>';}
function buildForge(){return '<div class="v5-admin-grid">'+panel('One Click Theme Forge','<div class="v5-matrix"><div class="v5-preset" onclick="v5Theme(\'obsidian\')"><b>Obsidian</b><span>black luxury</span></div><div class="v5-preset" onclick="v5Theme(\'angel\')"><b>Angel</b><span>white clean</span></div><div class="v5-preset" onclick="v5Theme(\'blood\')"><b>Blood</b><span>vampire red</span></div><div class="v5-preset" onclick="v5Theme(\'ice\')"><b>Ice</b><span>blue glass</span></div><div class="v5-preset" onclick="v5Theme(\'toxic\')"><b>Toxic</b><span>green venom</span></div><div class="v5-preset" onclick="v5Theme(\'egirl\')"><b>Egirl</b><span>pink anime vibe</span></div></div>')+panel('Micro Pages','<div class="v5-plugin-list"><div class="v5-plugin"><span>Public JSON</span><code>/api/v5-profile</code></div><div class="v5-plugin"><span>Embed Card</span><code>/embed/card</code></div><div class="v5-plugin"><span>Identity SVG</span><code>/identity-card.svg</code></div><div class="v5-plugin"><span>Badge SVG</span><code>/badge.svg?text=VIP</code></div></div>')+panel('Automation','<button type="button" class="bab" onclick="v5AutoBio()">Bio füllen</button><button type="button" class="bab" onclick="v5AutoBadges()">Premium Badges</button><button type="button" class="bab" onclick="v5ListRestore()">Snapshots Restore</button><div id="v5RestoreList" class="v5-small" style="margin-top:10px"></div>')+'</div>';}
function collect(){var out={};Object.keys(V5_CFG).forEach(function(k){if(k==='v5_fx')return;var el=document.getElementById('v5_'+k);if(!el)return;out[k]=el.type==='checkbox'?el.checked:el.value});out.v5_fx={};document.querySelectorAll('[data-v5fx]').forEach(function(el){out.v5_fx[el.dataset.v5fx]=el.checked});return out;}
function mark(){try{markDirty()}catch(e){}}
function build(){addNav('v5lab','V5 Lab');addNav('v5forge','Theme Forge');addSection('v5lab',buildLab());addSection('v5forge',buildForge());document.querySelectorAll('#sec-v5lab input,#sec-v5lab textarea,#sec-v5forge input,#sec-v5forge textarea').forEach(function(el){el.addEventListener('input',mark);el.addEventListener('change',mark)});v5RunAudit();}
var oldFetch=window.fetch;window.fetch=function(input,init){try{var url=(typeof input==='string'?input:input.url)||'';if(url==='/admin/save'&&init&&init.body){var body=JSON.parse(init.body);Object.assign(body,collect());init.body=JSON.stringify(body)}}catch(e){}return oldFetch(input,init)};
window.v5RunAudit=function(){fetch('/admin/api/v5-audit').then(r=>r.json()).then(function(d){var el=document.getElementById('v5Score');if(el)el.innerHTML='<div><b>'+d.score+'</b><span>score</span></div><div><b>'+d.modules+'</b><span>modules</span></div><div><b>'+d.links+'</b><span>links</span></div><div><b>'+d.badges+'</b><span>badges</span></div>'}).catch(function(){})}
window.v5PresetUltra=function(){document.getElementById('v5_v5_enabled').checked=true;document.getElementById('v5_v5_aura_enabled').checked=true;document.getElementById('v5_v5_reactions_enabled').checked=true;document.getElementById('v5_v5_terminal_enabled').checked=true;document.getElementById('v5_v5_tags').value='premium\nrare\nnight mode\ncompetitive\nprivate';document.querySelectorAll('[data-v5fx]').forEach(x=>x.checked=true);mark()}
window.v5PresetDating=function(){document.getElementById('v5_v5_enabled').checked=true;document.getElementById('v5_v5_tags').value='vampire diaries\ngaming\nlate night talks\nloyal\nseries';document.getElementById('v5_v5_faq').value='what do you like?|series gaming and calm energy\ncan i text you?|yes if you are normal';document.getElementById('v5_v5_aura_text').value='soft but hard to forget';mark()}
window.v5PresetCreator=function(){document.getElementById('v5_v5_enabled').checked=true;document.getElementById('v5_v5_services').value='Custom Profile|dm|clean bio page setup\nGaming Duo|ask|fortnite valo minecraft\nEditing|soon|clips and visuals';document.getElementById('v5_v5_highlights').value='Projects|bio page\nFocus|design and gaming\nStatus|available';mark()}
window.v5Theme=function(name){var m={obsidian:['#ffffff','#000000','#f8fafc','Inter'],angel:['#6366f1','#fafafa','#111827','DM Sans'],blood:['#ff003c','#090006','#ffe4ec','Playfair Display'],ice:['#67e8f9','#06111f','#ecfeff','Outfit'],toxic:['#a3ff12','#020403','#f7ffe8','Rajdhani'],egirl:['#ff71ce','#12002a','#fff0ff','Quicksand']}[name];if(!m)return;['accent','bg_color','text_color','font'].forEach(function(id,i){var el=document.getElementById(id);if(el)el.value=m[i]});var ah=document.getElementById('accent_h');if(ah)ah.value=m[0];document.documentElement.style.setProperty('--a',m[0]);mark()}
window.v5AutoBio=function(){var bio=document.getElementById('bio');if(bio)bio.value='lowkey profile\ncompetitive energy\nprivate life public links';mark()}
window.v5AutoBadges=function(){try{badges=[{text:'Premium',icon:'✦',color:'#fbbf24',style:'neon'},{text:'VIP',icon:'◆',color:'#c8ff00',style:'solid'},{text:'EU',icon:'🌙',color:'#67e8f9',style:'glass'}];renderB();mark()}catch(e){}}
window.v5ListRestore=function(){fetch('/admin/api/snapshots').then(r=>r.json()).then(function(d){var el=document.getElementById('v5RestoreList');el.innerHTML=(d.snapshots||[]).map(function(s){return '<div class="v5-plugin"><span>#'+s.id+' · '+h(s.label)+' · '+h(s.created_at)+'</span><button type="button" class="bab" onclick="v5Restore('+s.id+')">restore</button></div>'}).join('')||'keine snapshots'})}
window.v5Restore=function(id){if(!confirm('Snapshot #'+id+' wirklich wiederherstellen?'))return;fetch('/admin/api/restore-snapshot/'+id,{method:'POST'}).then(r=>r.json()).then(function(d){if(d.ok){alert('restore ok');location.reload()}else alert(d.error||'restore error')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
</script>`;
}


/* ===== V6 VISUAL OVERDRIVE: radically visible admin + public skin ===== */
function renderV6PublicSkin(c){
  if (c.v6_visual_off === true) return "";
  const a = safeColor(c.accent, "#c8ff00") || "#c8ff00";
  const t = c.text_color || "#f8fafc";
  const label = esc(c.v6_site_label || "live profile");
  return `<style>
/* V6: visible by default, not hidden behind toggles */
body{isolation:isolate;background-blend-mode:screen,normal!important;perspective:1100px;}
body::before{content:'';position:fixed;inset:-20%;z-index:0;pointer-events:none;background:radial-gradient(circle at 18% 12%,${a}33,transparent 24%),radial-gradient(circle at 82% 82%,rgba(255,255,255,.12),transparent 22%),linear-gradient(135deg,rgba(255,255,255,.04),transparent 38%);filter:blur(10px);animation:v6Aurora 14s ease-in-out infinite alternate;}
body::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:52px 52px;mask-image:radial-gradient(circle at center,#000 0,transparent 72%);opacity:.42;}
@keyframes v6Aurora{0%{transform:translate3d(-2%,0,0) rotate(0deg) scale(1)}100%{transform:translate3d(2%,-2%,0) rotate(7deg) scale(1.08)}}
.card{max-width:min(560px,calc(100vw - 28px))!important;border-radius:34px!important;border:1px solid color-mix(in srgb,var(--a) 34%,rgba(255,255,255,.16))!important;background:linear-gradient(145deg,rgba(255,255,255,.115),rgba(255,255,255,.035) 46%,rgba(0,0,0,.25))!important;box-shadow:0 35px 130px rgba(0,0,0,.55),0 0 90px color-mix(in srgb,var(--a) 16%,transparent),inset 0 1px 0 rgba(255,255,255,.14)!important;backdrop-filter:blur(28px) saturate(160%)!important;transform-style:preserve-3d;}
.card::before{content:'V6';position:absolute;right:18px;top:14px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em;color:var(--a);opacity:.65;border:1px solid color-mix(in srgb,var(--a) 30%,transparent);border-radius:999px;padding:4px 8px;background:rgba(0,0,0,.22)}
.name{font-size:clamp(2rem,7vw,3.2rem)!important;line-height:.95!important;text-shadow:0 0 30px color-mix(in srgb,var(--a) 32%,transparent)}
.name span{background:linear-gradient(90deg,var(--a),#fff,var(--a));-webkit-background-clip:text;color:transparent!important;background-size:220% 100%;animation:v6Text 5s linear infinite}@keyframes v6Text{to{background-position:220% 0}}
.avi{width:112px!important;height:112px!important;border-width:3px!important;box-shadow:0 0 0 8px color-mix(in srgb,var(--a) 10%,transparent),0 0 44px color-mix(in srgb,var(--a) 32%,transparent)!important;}
.avi::after{content:'';position:absolute;inset:-8px;border-radius:inherit;border:1px dashed color-mix(in srgb,var(--a) 45%,transparent);animation:v6Spin 18s linear infinite}@keyframes v6Spin{to{transform:rotate(360deg)}}
.badge{padding:6px 11px!important;background:linear-gradient(135deg,color-mix(in srgb,var(--bc,var(--a)) 16%,transparent),rgba(255,255,255,.04))!important;box-shadow:0 10px 28px rgba(0,0,0,.18),0 0 12px color-mix(in srgb,var(--bc,var(--a)) 18%,transparent)}
.link-btn{min-height:58px!important;border-radius:20px!important;background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025))!important;border-color:color-mix(in srgb,var(--lc,var(--a)) 24%,rgba(255,255,255,.12))!important;box-shadow:0 14px 32px rgba(0,0,0,.22);position:relative;overflow:hidden;}
.link-btn::before{content:'';position:absolute;inset:-70% auto -70% -25%;width:34px;background:rgba(255,255,255,.22);transform:rotate(24deg);transition:left .75s}.link-btn:hover::before{left:125%}.link-btn:hover{transform:translateY(-4px) scale(1.012)!important;box-shadow:0 20px 50px rgba(0,0,0,.35),0 0 34px color-mix(in srgb,var(--lc,var(--a)) 22%,transparent)}
.bio{font-size:.95rem!important;line-height:1.85!important}.dv{height:2px!important;background:linear-gradient(90deg,transparent,var(--a),transparent)!important}
.v6-sitebar{position:fixed;left:50%;top:18px;z-index:90;transform:translateX(-50%);display:flex;align-items:center;gap:10px;border:1px solid color-mix(in srgb,${a} 34%,transparent);border-radius:999px;background:rgba(8,8,12,.62);backdrop-filter:blur(18px);padding:8px 12px;font-family:'Space Mono',monospace;font-size:10px;color:${esc(t)};box-shadow:0 18px 70px rgba(0,0,0,.38)}.v6-sitebar i{width:9px;height:9px;border-radius:999px;background:${a};box-shadow:0 0 18px ${a};display:block}.v6-sitebar b{color:${a};letter-spacing:.12em;text-transform:uppercase}.v6-radar{position:fixed;right:24px;bottom:24px;z-index:80;width:54px;height:54px;border-radius:50%;border:1px solid color-mix(in srgb,${a} 42%,transparent);background:radial-gradient(circle,${a}22,transparent 56%);box-shadow:0 0 44px ${a}33;pointer-events:none}.v6-radar::before,.v6-radar::after{content:'';position:absolute;inset:9px;border-radius:inherit;border:1px solid ${a}55;animation:v6Ping 2.4s infinite}.v6-radar::after{animation-delay:.8s}@keyframes v6Ping{to{transform:scale(2.2);opacity:0}}
@media(max-width:720px){.v6-sitebar{top:10px;width:calc(100vw - 22px);justify-content:center}.card{border-radius:26px!important;padding:2.2rem 1.35rem 1.6rem!important}.name{font-size:2.1rem!important}.avi{width:96px!important;height:96px!important}.v6-radar{display:none}}
</style><div class="v6-sitebar"><i></i><b>${label}</b><span>visual overdrive active</span></div><div class="v6-radar"></div><script>(function(){var c=document.querySelector('.card');if(!c)return;document.addEventListener('pointermove',function(e){var x=(e.clientX/window.innerWidth-.5)*6,y=(e.clientY/window.innerHeight-.5)*-6;c.style.transform='rotateY('+x+'deg) rotateX('+y+'deg)';},{passive:true});document.addEventListener('pointerleave',function(){c.style.transform='';});})();<\/script>`;
}

function v6AdminPlugin(c){
  return `<style>
/* V6 Admin: completely different visual layer */
body.v6-admin{--v6-bg:#05060d;--v6-panel:rgba(12,14,25,.74);--v6-panel2:rgba(255,255,255,.055);--v6-line:rgba(255,255,255,.11);--v6-soft:rgba(255,255,255,.62);background:radial-gradient(circle at 8% 10%,color-mix(in srgb,var(--a) 22%,transparent),transparent 28%),radial-gradient(circle at 92% 20%,rgba(99,102,241,.18),transparent 30%),linear-gradient(135deg,#04050a,#070711 42%,#020205)!important;display:grid!important;grid-template-columns:292px minmax(0,1fr) 430px;min-height:100vh;overflow-x:hidden;}
body.v6-admin::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(circle at 50% 20%,#000,transparent 70%);opacity:.55}
body.v6-admin::after{content:'';position:fixed;width:520px;height:520px;border-radius:50%;right:-180px;bottom:-160px;pointer-events:none;background:radial-gradient(circle,color-mix(in srgb,var(--a) 18%,transparent),transparent 66%);filter:blur(14px);animation:v6AdminOrb 9s ease-in-out infinite alternate}@keyframes v6AdminOrb{to{transform:translate(-40px,-32px) scale(1.12)}}
.v6-admin .sidebar{grid-column:1;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025))!important;border-right:1px solid var(--v6-line)!important;width:auto!important;padding:22px 16px!important;backdrop-filter:blur(26px) saturate(150%);box-shadow:18px 0 80px rgba(0,0,0,.32);z-index:3;}
.v6-admin .logo{font-size:0!important;padding:0 8px 20px!important;position:relative}.v6-admin .logo::before{content:'V6 STUDIO';display:block;font-size:23px;letter-spacing:-.04em;font-weight:900;background:linear-gradient(90deg,var(--a),#fff,var(--a));-webkit-background-clip:text;color:transparent}.v6-admin .logo::after{content:'neural control room';display:block;margin-top:6px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--v6-soft)}
.v6-admin .ni,.v6-admin .lb{border:1px solid transparent!important;border-radius:18px!important;color:rgba(255,255,255,.64)!important;background:transparent!important;margin:2px 0;padding:12px 13px!important;font-size:.9rem!important}.v6-admin .ni:hover,.v6-admin .ni.active{background:linear-gradient(135deg,color-mix(in srgb,var(--a) 16%,transparent),rgba(255,255,255,.045))!important;border-color:color-mix(in srgb,var(--a) 34%,transparent)!important;color:#fff!important;box-shadow:0 14px 38px color-mix(in srgb,var(--a) 9%,transparent)}.v6-admin .ni.active::after{content:'';margin-left:auto;width:8px;height:8px;border-radius:50%;background:var(--a);box-shadow:0 0 18px var(--a)}
.v6-admin .main{grid-column:2;max-width:none!important;width:100%;padding:34px!important;z-index:2}.v6-admin .ph{position:sticky;top:18px;z-index:12;border:1px solid var(--v6-line);border-radius:28px;padding:14px 16px;background:rgba(8,9,17,.72);backdrop-filter:blur(24px);box-shadow:0 24px 80px rgba(0,0,0,.28);}.v6-admin .pt{font-size:0!important}.v6-admin .pt::before{content:'Command Deck';font-size:26px;font-weight:900;letter-spacing:-.05em}.v6-admin .pb,.v6-admin .bab{border-radius:999px!important;background:rgba(255,255,255,.06)!important;border:1px solid color-mix(in srgb,var(--a) 28%,rgba(255,255,255,.12))!important;color:#fff!important;box-shadow:0 10px 32px rgba(0,0,0,.22)}.v6-admin .pb:hover,.v6-admin .bab:hover{background:var(--a)!important;color:#050505!important;transform:translateY(-1px)}.v6-admin .pb.dirty{background:#f97316!important;color:#050505!important;border-color:#f97316!important}
.v6-heroX{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--a) 28%,transparent);border-radius:34px;padding:26px;margin-bottom:18px;background:linear-gradient(135deg,color-mix(in srgb,var(--a) 13%,transparent),rgba(255,255,255,.055) 36%,rgba(255,255,255,.025));box-shadow:0 28px 100px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.12)}.v6-heroX::before{content:'';position:absolute;right:-80px;top:-100px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,var(--a),transparent 62%);opacity:.16;filter:blur(6px)}.v6-heroX h1{font-size:clamp(2rem,5vw,4.4rem);line-height:.92;letter-spacing:-.08em;margin:0 0 10px}.v6-heroX h1 span{color:var(--a);text-shadow:0 0 34px color-mix(in srgb,var(--a) 45%,transparent)}.v6-heroX p{font-family:'Space Mono',monospace;font-size:12px;color:var(--v6-soft);max-width:760px;line-height:1.7}.v6-heroActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.v6-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:20px}.v6-metric{border:1px solid var(--v6-line);border-radius:20px;padding:14px;background:rgba(0,0,0,.18)}.v6-metric b{display:block;font-size:22px;color:#fff}.v6-metric span{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--v6-soft)}
.v6-admin .sec{border-radius:30px!important;border:1px solid var(--v6-line)!important;background:linear-gradient(180deg,var(--v6-panel),rgba(9,10,18,.62))!important;box-shadow:0 24px 90px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(24px);padding:24px!important}.v6-admin .sec.active{animation:v6Sec .32s ease both}@keyframes v6Sec{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
.v6-admin .st{color:var(--a)!important;font-size:11px!important;letter-spacing:.18em!important}.v6-admin .fi label{color:rgba(255,255,255,.7)!important}.v6-admin input[type=text],.v6-admin input[type=url],.v6-admin input[type=password],.v6-admin textarea,.v6-admin select{border-radius:18px!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(0,0,0,.28)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045);padding:13px 15px!important}.v6-admin input:focus,.v6-admin textarea:focus,.v6-admin select:focus{border-color:var(--a)!important;box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 13%,transparent)}
.v6-admin .tr{border-radius:18px!important;padding:12px!important;border:1px solid rgba(255,255,255,.075)!important;background:rgba(255,255,255,.025);margin-bottom:8px}.v6-admin .tl{color:#fff}.v6-admin .td{color:rgba(255,255,255,.45)}.v6-admin .tpl-grid,.v6-admin .platform-picker,.v6-admin .featureGrid{gap:12px!important}.v6-admin .tpl-card,.v6-admin .pp-btn,.v6-admin .feature-item,.v6-admin .social-item,.v6-admin .bt{border-radius:20px!important;background:rgba(255,255,255,.045)!important;border-color:rgba(255,255,255,.09)!important;box-shadow:0 12px 32px rgba(0,0,0,.16)}.v6-admin .tpl-card:hover,.v6-admin .pp-btn:hover,.v6-admin .feature-item:hover{border-color:var(--a)!important;transform:translateY(-3px)}
.v6-admin .previewDock{grid-column:3;width:auto!important;min-width:0!important;padding:18px 18px 18px 0!important;z-index:2}.v6-admin .previewTop{height:58px!important;border-radius:28px 28px 0 0!important;background:rgba(8,9,17,.75)!important;backdrop-filter:blur(20px);border-color:var(--v6-line)!important}.v6-admin .previewFrame{border-radius:0 0 28px 28px!important;border-color:var(--v6-line)!important;box-shadow:0 32px 120px rgba(0,0,0,.46),0 0 70px color-mix(in srgb,var(--a) 8%,transparent)}
.v6-admin .sbtn{position:sticky;bottom:18px;z-index:20;border-radius:22px!important;box-shadow:0 20px 80px color-mix(in srgb,var(--a) 22%,transparent)!important}.v6-floatingTools{position:fixed;right:452px;bottom:22px;z-index:50;display:flex;gap:8px;padding:8px;border:1px solid var(--v6-line);border-radius:999px;background:rgba(8,9,17,.75);backdrop-filter:blur(20px)}.v6-floatingTools button{border:0;border-radius:999px;background:rgba(255,255,255,.06);color:#fff;padding:10px 12px;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer}.v6-floatingTools button:hover{background:var(--a);color:#050505}.v6-pulseDot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--a);box-shadow:0 0 18px var(--a);margin-right:8px;animation:v6Pulse 1.6s infinite}@keyframes v6Pulse{50%{transform:scale(1.35);opacity:.55}}
@media(max-width:1250px){body.v6-admin{grid-template-columns:270px minmax(0,1fr)!important}.v6-admin .previewDock{display:none!important}.v6-floatingTools{right:24px}}@media(max-width:820px){body.v6-admin{display:block!important}.v6-admin .sidebar{position:relative!important;width:auto!important;height:auto!important;min-height:0!important}.v6-admin .main{padding:16px!important}.v6-metrics{grid-template-columns:repeat(2,1fr)}.v6-heroX{border-radius:24px;padding:18px}.v6-floatingTools{left:12px;right:12px;justify-content:center}.v6-admin .ph{top:8px}}
</style><script>(function(){
function qs(s){return document.querySelector(s)}function qsa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function addHero(){var m=qs('.main');if(!m||qs('.v6-heroX'))return;var h=document.createElement('section');h.className='v6-heroX';h.innerHTML='<h1><span>V6</span> Visual Overdrive</h1><p><span class="v6-pulseDot"></span>Jetzt sieht das Panel wirklich anders aus: Command-Deck, Glass Cards, Live Preview, floating tools und ein sichtbarer Public-Skin. Der alte Look wird nicht nur um kleine Felder erweitert, sondern optisch überschrieben.</p><div class="v6-heroActions"><button type="button" class="bab" onclick="v6InsanePublicPreset()">Insane Public Preset</button><button type="button" class="bab" onclick="v6EnableEverything()">Alles aktivieren</button><button type="button" class="bab" onclick="randomAccent()">Random Accent</button><button type="button" class="bab" onclick="save()">Speichern</button></div><div class="v6-metrics"><div class="v6-metric"><b>150+</b><span>feature flags</span></div><div class="v6-metric"><b>V5</b><span>modules fixed</span></div><div class="v6-metric"><b>Live</b><span>preview dock</span></div><div class="v6-metric"><b>New</b><span>visual skin</span></div></div>';var ph=qs('.ph');m.insertBefore(h,ph||m.firstChild)}
function addTools(){if(qs('.v6-floatingTools'))return;var d=document.createElement('div');d.className='v6-floatingTools';d.innerHTML='<button type="button" onclick="openCommandPalette&&openCommandPalette()">⌘K</button><button type="button" onclick="v6InsanePublicPreset()">preset</button><button type="button" onclick="refreshPreview&&refreshPreview()">refresh</button><button type="button" onclick="save&&save()">save</button>';document.body.appendChild(d)}
window.v6InsanePublicPreset=function(){try{var set=function(id,v){var e=document.getElementById(id);if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))};set('accent','#c8ff00');set('accent_h','#c8ff00');set('bg_type','gradient');set('bg_color','#03040a');set('bg_gradient_from','#020617');set('bg_gradient_to','#201047');set('bg_gradient_angle','145');set('font','Oxanium');set('card_style','glass');set('card_blur',true);set('link_style','neon');set('avatar_glow',true);set('bg_animated',true);set('show_particles',true);set('cursor_glow',true);if(window.activateFeaturePreset){activateFeaturePreset('neon');['card-floating','link-shine','avatar-ring-spin','badge-pulse-first','layout-wide','extra-hologram','extra-rainbow-accent','media-audio-glass'].forEach(function(k){if(window.featureFlags)featureFlags[k]=true});if(window.renderFeatures)renderFeatures()}qsa('[id^="v5_"][type="checkbox"]').forEach(function(x){if(['v5_v5_enabled','v5_v5_nav_enabled','v5_v5_aura_enabled','v5_v5_reactions_enabled','v5_v5_terminal_enabled'].includes(x.id))x.checked=true});var tags=document.getElementById('v5_v5_tags');if(tags&&!tags.value)tags.value='premium\\nrare\\nnight profile\\ncompetitive\\nprivate';if(window.markDirty)markDirty();if(window.refreshPreview)setTimeout(refreshPreview,200)}catch(e){alert('V6 preset error: '+e.message)}};
window.v6EnableEverything=function(){try{if(window.toggleAllFeatures)toggleAllFeatures(true);qsa('[id^="v5_"][type="checkbox"]').forEach(function(x){x.checked=true});if(window.markDirty)markDirty();if(window.refreshPreview)setTimeout(refreshPreview,200)}catch(e){alert(e.message)}};
function boot(){document.body.classList.add('v6-admin');addHero();addTools();setTimeout(function(){try{if(window.v5RunAudit)v5RunAudit()}catch(e){}},650)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();<\/script>`;
}

app.get("/admin/dashboard", requireAuth, async (req, res) => {
  const c = await getConfig();
  const adminBadges = normalizeBadges(c.badges || []);
  const featureItems = featureCatalog();
  const featureFlags = c.feature_flags || {};

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

  const platformsJson = safeJson(PLATFORMS);

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
.badge-editor{display:grid;grid-template-columns:1fr 80px 110px 120px auto;gap:8px;align-items:center;margin-top:10px}.badge-row{display:grid;grid-template-columns:1fr 80px 90px 95px 34px;gap:8px;align-items:center;background:var(--bg);border:1px solid var(--b2);border-radius:12px;padding:10px;margin-bottom:8px}.badge-pill-preview{display:inline-flex;align-items:center;gap:5px;border:1px solid color-mix(in srgb,var(--bc,var(--a)) 35%,transparent);color:var(--bc,var(--a));border-radius:999px;padding:4px 8px;font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase}.feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;max-height:360px;overflow:auto;padding-right:4px}.feature-item{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--bg);border:1px solid var(--b2);border-radius:12px;padding:9px 10px}.feature-item span{font-family:'Space Mono',monospace;font-size:10px;color:var(--m);text-transform:uppercase;line-height:1.3}.feature-actions{display:flex;gap:8px;margin-bottom:10px}.mini-danger{border-color:#ef444455;color:#ef4444}.mini-danger:hover{border-color:#ef4444;background:#ef444411}

/* ===== ADMIN PANEL V3 CONTROL ROOM ===== */
body{background:radial-gradient(circle at top left,#172033 0,#08090d 38%,#050507 100%);gap:0;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 80% 10%,color-mix(in srgb,var(--a) 16%,transparent),transparent 28%),radial-gradient(circle at 30% 90%,#7c3aed22,transparent 32%);opacity:.9;z-index:-1}
.sidebar{width:250px;background:rgba(10,11,16,.72);backdrop-filter:blur(18px);border-right:1px solid rgba(255,255,255,.08);box-shadow:18px 0 60px rgba(0,0,0,.25);}
.logo{font-size:1.25rem;letter-spacing:-.04em}.logo::after{content:'control room';display:block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--m);margin-top:5px}
.ni{border:1px solid transparent;margin-bottom:4px;color:#7b8495}.ni:hover{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.06);color:#fff}.ni.active{background:linear-gradient(90deg,color-mix(in srgb,var(--a) 18%,transparent),rgba(255,255,255,.035));border-color:color-mix(in srgb,var(--a) 24%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--a) 8%,transparent)}
.main{max-width:980px;width:100%;padding:1.25rem 1.5rem 4rem;}.ph{position:sticky;top:0;z-index:30;margin:0 -1.5rem 1rem;padding:1rem 1.5rem;background:linear-gradient(180deg,rgba(5,6,9,.92),rgba(5,6,9,.68));backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.06)}.pt{font-size:1.55rem}.pb{background:rgba(255,255,255,.035);backdrop-filter:blur(10px)}.pb.dirty{color:#fbbf24;border-color:#fbbf24aa}.sec{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.09);box-shadow:0 24px 80px rgba(0,0,0,.25);border-radius:26px;}.sec.active{animation:adminSec .22s ease both}@keyframes adminSec{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
input[type=text],input[type=url],input[type=password],textarea,select{background:rgba(0,0,0,.28);border-color:rgba(255,255,255,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}input:focus,textarea:focus,select:focus{box-shadow:0 0 0 4px color-mix(in srgb,var(--a) 10%,transparent)}.sbtn{background:linear-gradient(135deg,var(--a),#fff);box-shadow:0 16px 44px color-mix(in srgb,var(--a) 18%,transparent)}
.adminHero{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:30px;padding:24px;margin-bottom:14px;background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.035));box-shadow:0 24px 90px rgba(0,0,0,.28)}.adminHero::after{content:'';position:absolute;right:-80px;top:-90px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--a) 26%,transparent),transparent 70%)}.eyebrow{font-family:'Space Mono',monospace;font-size:10px;color:var(--a);letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}.adminHero h2{font-size:2.25rem;line-height:1;letter-spacing:-.07em}.adminHero p{max-width:620px;color:#8a93a5;font-family:'Space Mono',monospace;font-size:12px;margin-top:8px;line-height:1.6}.heroActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.heroBtn{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.05);color:var(--t);border-radius:14px;padding:10px 14px;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer}.heroBtn.primary{background:var(--a);color:#070707;border-color:var(--a);font-weight:800}.heroBtn:hover{transform:translateY(-1px);border-color:var(--a)}
.statGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.statCard{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px}.statCard b{display:block;font-size:1.35rem}.statCard span{font-family:'Space Mono',monospace;font-size:10px;color:#788195;text-transform:uppercase;letter-spacing:.08em}.adminSearchbar{display:flex;gap:10px;margin-bottom:14px}.adminSearchbar input{height:44px}.adminSearchbar button{border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:var(--t);padding:0 13px;font-family:'Space Mono',monospace;cursor:pointer}.adminSearchbar button:hover{border-color:var(--a);color:var(--a)}
.previewDock{width:390px;min-width:390px;height:100vh;position:sticky;top:0;padding:1rem 1rem 1rem 0;display:flex;flex-direction:column}.previewDock.hidden{display:none}.previewTop{height:48px;border:1px solid rgba(255,255,255,.09);border-bottom:none;border-radius:22px 22px 0 0;background:rgba(10,11,16,.75);display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;color:#8a93a5}.previewTop button{background:transparent;border:1px solid rgba(255,255,255,.1);color:var(--t);border-radius:10px;padding:5px 8px;cursor:pointer}.previewFrame{flex:1;width:100%;border:1px solid rgba(255,255,255,.09);border-radius:0 0 22px 22px;background:#000;box-shadow:0 24px 80px rgba(0,0,0,.35)}
.tpl-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));}.tpl-card{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08);}.tpl-preview{height:110px}.platform-picker{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}.feature-grid{grid-template-columns:repeat(auto-fill,minmax(215px,1fr));max-height:520px}.feature-item{background:rgba(0,0,0,.25);border-color:rgba(255,255,255,.08)}.feature-item small{display:block;color:#5d6678;font-size:8px;margin-top:2px}.featureTools{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;margin-bottom:10px}.featureTools input{height:40px}.featureCount{font-family:'Space Mono',monospace;font-size:10px;color:var(--a);align-self:center;white-space:nowrap}.cmdOverlay{position:fixed;inset:0;background:rgba(0,0,0,.58);backdrop-filter:blur(10px);z-index:9999;display:none;align-items:flex-start;justify-content:center;padding-top:12vh}.cmdOverlay.show{display:flex}.cmdBox{width:min(560px,calc(100vw - 24px));border:1px solid rgba(255,255,255,.12);background:#090b10;border-radius:24px;box-shadow:0 30px 120px rgba(0,0,0,.55);overflow:hidden}.cmdBox input{border:none;border-bottom:1px solid rgba(255,255,255,.08);border-radius:0;height:54px;font-size:16px;background:#0c0f17}.cmdItem{display:flex;justify-content:space-between;gap:10px;padding:12px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Space Mono',monospace;font-size:12px}.cmdItem:hover{background:color-mix(in srgb,var(--a) 10%,transparent);color:var(--a)}.cmdItem kbd{color:#6b7280}.toast{bottom:1.2rem;background:linear-gradient(135deg,var(--a),#fff);box-shadow:0 12px 40px color-mix(in srgb,var(--a) 20%,transparent)}
@media(max-width:1250px){.previewDock{display:none}.main{max-width:none}}@media(max-width:760px){body{display:block}.sidebar{position:relative;width:auto;height:auto;min-height:0;display:grid;grid-template-columns:repeat(2,1fr)}.sf{display:none}.main{padding:1rem}.statGrid{grid-template-columns:repeat(2,1fr)}.adminHero h2{font-size:1.6rem}.featureTools{grid-template-columns:1fr}.badge-editor,.badge-row{grid-template-columns:1fr}}

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
  <button class="ni" data-section="featurelab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="8"/></svg>Feature Lab</button>
  <div class="ndv"></div>
  <button class="ni" data-section="advanced"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Erweitert</button>
  <button class="ni" data-section="security"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Sicherheit</button>
  <div class="sf"><a href="/admin/logout" class="lb"><svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</a></div>
</nav>

<main class="main">

  <section class="adminHero">
    <div class="eyebrow">v3 admin studio</div>
    <h2>Control Room für deine Bio Page</h2>
    <p>Neues Dashboard Design mit Live Preview, Command Palette, Quick Actions, 150 Feature-Toggles, Template Presets und saubererem Editing Workflow.</p>
    <div class="heroActions"><button class="heroBtn primary" onclick="save()">Speichern</button><button class="heroBtn" onclick="refreshPreview()">Preview refresh</button><button class="heroBtn" onclick="togglePreviewDock()">Preview an/aus</button><button class="heroBtn" onclick="openCommandPalette()">Command Palette</button><button class="heroBtn" onclick="randomAccent()">Random Accent</button><button class="heroBtn" onclick="exportDraftConfig()">Export JSON</button></div>
  </section>
  <section class="statGrid">
    <div class="statCard"><b>150</b><span>Feature Toggles</span></div>
    <div class="statCard"><b>${Object.keys(TEMPLATES).length}</b><span>Templates</span></div>
    <div class="statCard"><b>${(c.links||[]).length}</b><span>Social Links</span></div>
    <div class="statCard"><b>${c.views||0}</b><span>Views</span></div>
  </section>
  <div class="adminSearchbar"><input id="globalAdminSearch" type="text" placeholder="Suche Section / Feature / Setting... z.B. badge, audio, template"><button onclick="openCommandPalette()">⌘K</button><button onclick="navTo('featurelab')">Features</button><button onclick="navTo('advanced')">Code</button></div>
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
    <div class="badge-editor">
      <input type="text" id="bi" placeholder="Name z.B. Premium">
      <input type="text" id="bicon" placeholder="Icon">
      <input type="text" id="bcolor" placeholder="#c8ff00">
      <select id="bstyle"><option value="pill">pill</option><option value="soft">soft</option><option value="outline">outline</option><option value="solid">solid</option><option value="glass">glass</option><option value="neon">neon</option></select>
      <button class="bab" onclick="addB()">+ Add</button>
    </div>
    <div class="fi" style="margin-top:8px"><label>Custom Icon URL für nächsten Badge optional</label><input type="url" id="bicon_url" placeholder="https://.../icon.png"></div>
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
      <div class="fi"><label>Hintergrund-Video</label>
        <input type="file" id="bg_video_file" accept="video/mp4,video/webm,video/ogg,video/*" style="display:none" onchange="handleVideoUpload(this)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
          <button type="button" class="upload-btn" onclick="document.getElementById('bg_video_file').click()">🎬 Video vom PC wählen</button>
          <button type="button" class="upload-btn" onclick="clearBgVideo()">Video entfernen</button>
          <span id="bg_video_filename" style="font-family:'Space Mono',monospace;font-size:11px;color:var(--m);">${c.bg_video_url?"✓ Video gesetzt":"Keine Datei"}</span>
        </div>
        <video id="bg_video_preview" src="${c.bg_video_url||""}" muted loop playsinline controls style="width:100%;max-height:160px;object-fit:cover;border-radius:14px;border:1px solid var(--b2);background:#050505;display:${c.bg_video_url?"block":"none"}"></video>
        <p style="font-family:'Space Mono',monospace;font-size:10px;line-height:1.6;color:var(--m);margin-top:8px;">Tipp: Für Render/Postgres am besten kurze komprimierte MP4/WebM Videos nutzen. Maximal erlaubt sind 120MB, besser unter 30MB.</p>
      </div>
      <div class="fi"><label>oder externe Video URL</label><input type="url" id="bg_video_url" value="${c.bg_video_url||""}" placeholder="https://...video.mp4 oder /asset/bg-video" oninput="syncBgVideoPreview(this.value)"></div>
      <div class="fi"><label>Overlay Deckkraft (0=kein, 1=schwarz)</label>
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="range" id="bg_overlay_opacity" min="0" max="1" step="0.05" value="${c.bg_overlay_opacity||0.3}" style="flex:1;accent-color:var(--a)" oninput="this.nextElementSibling.textContent=Math.round(this.value*100)+'%';">
          <span style="font-family:monospace;font-size:12px;color:var(--m);width:38px;">${Math.round((c.bg_overlay_opacity||0.3)*100)}%</span>
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
    <div class="fi"><label>Favicon / Tab Icon URL</label><input type="url" id="favicon_url" value="${c.favicon_url||""}" placeholder="https://.../icon.png oder data:image/png;base64,..."></div>
    <p class="st">Custom Code</p>
    <div class="fi"><label>Custom CSS</label><textarea id="custom_css" rows="6" placeholder="/* eigenes CSS */">${c.custom_css||""}</textarea></div>
    <div class="fi"><label>Custom Head HTML</label><textarea id="custom_head" rows="4" placeholder="<meta ...> / font imports / analytics">${c.custom_head||""}</textarea></div>
    <div class="fi"><label>Custom JS</label><textarea id="custom_js" rows="5" placeholder="console.log('hi')">${c.custom_js||""}</textarea></div>
  </div>

  <!-- FEATURE LAB -->
  <div class="sec" id="sec-featurelab">
    <p class="st" style="margin-top:0">150 echte Feature Toggles</p>
    <div class="featureTools"><input type="text" id="featureSearch" placeholder="Feature suchen: avatar, link, badge, bg..." oninput="renderFeatures()"><button class="bab" onclick="activateFeaturePreset('clean')">Clean Preset</button><button class="bab" onclick="activateFeaturePreset('neon')">Neon Preset</button><button class="bab mini-danger" onclick="toggleAllFeatures(false)">Reset</button></div>
    <div class="feature-actions"><button class="bab" onclick="toggleAllFeatures(true)">alle 150 aktivieren</button><button class="bab" onclick="activateFeaturePreset('gamer')">Gamer Preset</button><span class="featureCount" id="featureCount">0 aktiv</span></div>
    <div class="feature-grid" id="featureGrid"></div>
    <p class="td" style="margin-top:10px">Jeder Toggle erzeugt live eine Klasse wie <b>fx-avatar-pulse</b>. Viele Effekte sind direkt implementiert, zusätzlich kannst du alles über Custom CSS weiter stylen.</p>
  </div>

  <!-- SICHERHEIT -->
  <div class="sec" id="sec-security">
    <p class="st" style="margin-top:0">Passwort ändern</p>
    <div class="fi"><label>Neues Passwort</label><input type="password" id="newPassword" placeholder="leer lassen = nicht ändern"></div>
    <div class="fi"><label>Bestätigen</label><input type="password" id="confirmPassword" placeholder="wiederholen"></div>
  </div>

  <button class="sbtn" onclick="save()">Speichern & live schalten ✓</button>

</main>
<aside class="previewDock" id="previewDock">
  <div class="previewTop"><span>Live Preview</span><div><button onclick="refreshPreview()">Reload</button><button onclick="togglePreviewDock()">Hide</button></div></div>
  <iframe class="previewFrame" id="livePreviewFrame" src="/" loading="lazy"></iframe>
</aside>
<div class="cmdOverlay" id="cmdOverlay" onclick="if(event.target.id==='cmdOverlay')closeCommandPalette()">
  <div class="cmdBox"><input id="cmdInput" placeholder="Befehl suchen..." autocomplete="off"><div id="cmdList"></div></div>
</div>
<div class="toast" id="toast">Gespeichert! ✓</div>

<script>
const PLATFORMS = ${platformsJson};
const TEMPLATES = ${safeJson(TEMPLATES)};
const ICONS_SVG = ${safeJson(Object.fromEntries(Object.entries(PLATFORMS).map(([k])=>[k,""])))};

var badges = ${safeJson(adminBadges)};
var links = (function(){ var r=${safeJson(c.links||[])}; return r.map(function(l){return l.platform?l:{platform:l.icon||"link",username:l.label||"",custom_url:l.url||""};});})();
var currentLS = ${safeJson(c.link_style||"default")};
var currentAB = ${safeJson(c.avatar_border||"circle")};
const FEATURE_ITEMS = ${safeJson(featureItems)};
var featureFlags = ${safeJson(featureFlags)};

const titles={templates:"Templates",profile:"Profil",design:"Design",background:"Hintergrund",links:"Socials",effects:"Effekte",featurelab:"Feature Lab",advanced:"Erweitert",security:"Sicherheit"};

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
  var nav=document.querySelector('.ni[data-section="'+id+'"]');
  if(nav)nav.classList.add("active");
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
  ["bgf-solid","bgf-gradient","bgf-image","bgf-video"].forEach(function(f){var el=document.getElementById(f); if(el) el.style.display="none";});
  var target=document.getElementById("bgf-"+t); if(target) target.style.display="";
  const p=document.getElementById("bgp");
  if(t==="solid"){const v=document.getElementById("bg_color").value;document.getElementById("bg_color_h").value=v;p.style.background=v;}
  else if(t==="gradient"){const f=document.getElementById("bg_gradient_from").value,to=document.getElementById("bg_gradient_to").value,a=document.getElementById("bg_gradient_angle").value||135;document.getElementById("bg_gradient_from_h").value=f;document.getElementById("bg_gradient_to_h").value=to;p.style.background="linear-gradient("+a+"deg,"+f+","+to+")";}
  else if(t==="image"){var im=document.getElementById("bg_image_url")&&document.getElementById("bg_image_url").value;p.style.background=im?"url('"+im+"') center/cover":"#1a1a1a";}
  else if(t==="video"){p.style.background="linear-gradient(135deg,#050505,#161622)";}
  else{p.style.background="#1a1a1a";}
}

function formatBytes(bytes){
  if(!bytes && bytes!==0) return "";
  var units=["B","KB","MB","GB"], i=0, n=Number(bytes)||0;
  while(n>=1024 && i<units.length-1){n/=1024;i++;}
  return (i===0?n:n.toFixed(1))+" "+units[i];
}

function syncBgVideoPreview(value){
  var preview=document.getElementById("bg_video_preview");
  var label=document.getElementById("bg_video_filename");
  if(value && String(value).startsWith("data:video")){
    alert("Base64/Data-URL Videos sind deaktiviert, weil sie den Browser crashen können. Bitte den Button Video vom PC wählen benutzen.");
    value="";
    var urlInput=document.getElementById("bg_video_url");
    if(urlInput) urlInput.value="";
  }
  if(preview){preview.src=value||"";preview.style.display=value?"block":"none";try{preview.load();}catch(e){}}
  if(label) label.textContent=value?"✓ Video gesetzt":"Keine Datei";
  try{markDirty();}catch(e){}
}

async function handleVideoUpload(input){
  var file=input && input.files && input.files[0];
  if(!file) return;
  if(file.type && !file.type.startsWith("video/")){
    alert("Bitte eine Video-Datei auswählen, z.B. MP4 oder WebM.");
    input.value="";
    return;
  }
  var max=400*1024*1024;
  if(file.size>max){
    alert("Das Video ist zu groß ("+formatBytes(file.size)+"). Bitte komprimiere es auf unter 400MB, ideal trotzdem unter 20-30MB. Sonst wird Browser/Render/Postgres zu schwer.");
    input.value="";
    return;
  }
  var label=document.getElementById("bg_video_filename");
  var btn=input.parentElement && input.parentElement.querySelector("button");
  if(label) label.textContent="Upload läuft: "+file.name+" ("+formatBytes(file.size)+") ...";
  if(btn) btn.disabled=true;
  try{
    var res=await fetch("/admin/upload-bg-video?name="+encodeURIComponent(file.name),{
      method:"POST",
      headers:{"Content-Type":file.type||"application/octet-stream"},
      body:file
    });
    var json=await res.json().catch(function(){return null;});
    if(!res.ok || !json || !json.ok) throw new Error((json && json.error) || "Upload fehlgeschlagen");
    var urlInput=document.getElementById("bg_video_url");
    var type=document.getElementById("bg_type");
    if(urlInput) urlInput.value=json.url;
    if(type) type.value="video";
    updBg();
    syncBgVideoPreview(json.url);
    if(label) label.textContent="✓ "+file.name+" ("+formatBytes(file.size)+") hochgeladen";
    try{markDirty();}catch(e){}
  }catch(err){
    alert("Video Upload fehlgeschlagen: "+(err.message||err));
    if(label) label.textContent="Upload Fehler";
  }finally{
    if(btn) btn.disabled=false;
  }
}

async function clearBgVideo(){
  var inp=document.getElementById("bg_video_file");
  var url=document.getElementById("bg_video_url");
  if(inp) inp.value="";
  if(url) url.value="";
  try{await fetch("/admin/delete-bg-video",{method:"POST"});}catch(e){}
  syncBgVideoPreview("");
  try{markDirty();}catch(e){}
}

function escClient(v){return String(v??"").replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];});}
function normBadge(b){if(typeof b==="string")return{text:b,icon:"",icon_url:"",color:"",style:"pill"};return{text:b.text||b.name||b.label||"badge",icon:b.icon||"",icon_url:b.icon_url||b.image||"",color:b.color||"",style:b.style||"pill"};}
function renderB(){badges=badges.map(normBadge);document.getElementById("bw").innerHTML=badges.map(function(b,i){var color=b.color||"var(--a)";var icon=b.icon_url?'<img src="'+escClient(b.icon_url)+'" style="width:14px;height:14px;border-radius:4px;object-fit:cover">':(b.icon?'<span>'+escClient(b.icon)+'</span>':'');return '<div class="badge-row"><span class="badge-pill-preview" style="--bc:'+escClient(color)+'">'+icon+'<span>'+escClient(b.text)+'</span></span><span style="font-family:monospace;font-size:10px;color:var(--m)">'+escClient(b.style||"pill")+'</span><span style="font-family:monospace;font-size:10px;color:var(--m)">'+escClient(b.color||"auto")+'</span><button class="bab" onclick="editB('+i+')">edit</button><button class="si-del" onclick="rmB('+i+')">×</button></div>';}).join("")}
function addB(){const name=document.getElementById("bi").value.trim();if(!name)return;badges.push({text:name,icon:document.getElementById("bicon").value.trim(),icon_url:document.getElementById("bicon_url").value.trim(),color:document.getElementById("bcolor").value.trim(),style:document.getElementById("bstyle").value});["bi","bicon","bicon_url","bcolor"].forEach(id=>document.getElementById(id).value="");renderB()}
function editB(i){var b=normBadge(badges[i]);document.getElementById("bi").value=b.text||"";document.getElementById("bicon").value=b.icon||"";document.getElementById("bicon_url").value=b.icon_url||"";document.getElementById("bcolor").value=b.color||"";document.getElementById("bstyle").value=b.style||"pill";badges.splice(i,1);renderB();}
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

function renderFeatures(){
  var grid=document.getElementById("featureGrid"); if(!grid)return;
  var q=(document.getElementById("featureSearch")&&document.getElementById("featureSearch").value||"").toLowerCase().trim();
  var items=FEATURE_ITEMS.filter(function(f){return !q || f.key.toLowerCase().includes(q) || String(f.label).toLowerCase().includes(q) || String(f.group).toLowerCase().includes(q);});
  grid.innerHTML=items.map(function(f){return '<label class="feature-item"><span>'+escClient(f.label)+'<small>'+escClient(f.group)+' · fx-'+escClient(f.key)+'</small></span><label class="sw"><input type="checkbox" data-feature="'+escClient(f.key)+'" '+(featureFlags[f.key]?'checked':'')+' onchange="featureFlags[this.dataset.feature]=this.checked;markDirty();updateFeatureCount();"><span class="sl"></span></label></label>';}).join("");
  updateFeatureCount();
}
function updateFeatureCount(){var el=document.getElementById("featureCount"); if(el){var n=Object.keys(featureFlags).filter(function(k){return featureFlags[k];}).length; el.textContent=n+" aktiv";}}
function toggleAllFeatures(on){FEATURE_ITEMS.forEach(function(f){featureFlags[f.key]=on;});markDirty();renderFeatures();}
function activateFeaturePreset(name){
  toggleAllFeatures(false);
  var presets={
    clean:["card-shadow-soft","card-glass-max","link-rounded-pill","badge-glass-all","type-bio-muted","layout-minimal","motion-slow"],
    neon:["card-border-glow","card-shadow-neon","avatar-neon-ring","type-name-gradient","type-name-glow","link-neon-glow","badge-neon-all","bg-orbs","bg-vignette","motion-background-shift"],
    gamer:["card-dark-matte","card-inner-grid","avatar-ring-spin","type-name-uppercase","link-shine","link-left-accent","bg-scanlines","bg-grid-strong","extra-glitch-name","extra-dev-mode"]
  };
  (presets[name]||[]).forEach(function(k){featureFlags[k]=true;});
  renderFeatures();markDirty();
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
    favicon_url:document.getElementById("favicon_url").value,
    custom_css:document.getElementById("custom_css").value,
    custom_head:document.getElementById("custom_head").value,
    custom_js:document.getElementById("custom_js").value,
    audio_url:document.getElementById("audio_url").value,
    audio_autoplay:document.getElementById("audio_autoplay").checked,
    audio_loop:document.getElementById("audio_loop").checked,
    audio_volume:parseFloat(document.getElementById("audio_volume").value||0.5),
    audio_title:document.getElementById("audio_title").value,
    bg_video_url:document.getElementById("bg_video_url").value,
    bg_overlay_opacity:parseFloat(document.getElementById("bg_overlay_opacity").value||0.3),
    feature_flags:featureFlags,
    links,newPassword:pw
  };
  const r=await fetch("/admin/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  if(r.ok){const t=document.getElementById("toast");t.classList.add("show");markClean();refreshPreview();setTimeout(()=>t.classList.remove("show"),2500)}
}


function refreshPreview(){var f=document.getElementById("livePreviewFrame"); if(f)f.src="/?preview="+Date.now();}
function togglePreviewDock(){var d=document.getElementById("previewDock"); if(d)d.classList.toggle("hidden");}
function markDirty(){var btn=document.querySelector(".pb[onclick='save()']"); if(btn){btn.classList.add("dirty");btn.textContent="● Ungespeichert";}}
function markClean(){var btn=document.querySelector(".pb[onclick='save()']"); if(btn){btn.classList.remove("dirty");btn.textContent="✓ Speichern";}}
function randomAccent(){var colors=["#c8ff00","#ff2d78","#00d4ff","#a78bfa","#fbbf24","#39ff14","#ff003c","#67e8f9","#fb7185","#ffffff"];var c=colors[Math.floor(Math.random()*colors.length)];document.getElementById("accent").value=c;document.getElementById("accent_h").value=c;document.documentElement.style.setProperty("--a",c);markDirty();}
var commandActions=[
  ["Templates öffnen","1",function(){navTo("templates")}],["Profil bearbeiten","2",function(){navTo("profile")}],["Design öffnen","3",function(){navTo("design")}],["Background öffnen","4",function(){navTo("background")}],["Socials öffnen","5",function(){navTo("links")}],["Effekte öffnen","6",function(){navTo("effects")}],["Feature Lab öffnen","7",function(){navTo("featurelab")}],["Advanced Code öffnen","8",function(){navTo("advanced")}],["Security öffnen","9",function(){navTo("security")}],["Speichern","Ctrl+S",function(){save()}],["Preview refresh","R",function(){refreshPreview()}],["Preview an/aus","P",function(){togglePreviewDock()}],["Random Accent","A",function(){randomAccent()}],["Neon Feature Preset","N",function(){navTo("featurelab");activateFeaturePreset("neon")}],["Clean Feature Preset","C",function(){navTo("featurelab");activateFeaturePreset("clean")}],["Export JSON","E",function(){exportDraftConfig()}]
];
function openCommandPalette(){var o=document.getElementById("cmdOverlay");var i=document.getElementById("cmdInput");if(!o)return;o.classList.add("show");renderCommands("");setTimeout(function(){i&&i.focus();},30)}
function closeCommandPalette(){var o=document.getElementById("cmdOverlay");if(o)o.classList.remove("show")}
function renderCommands(q){var list=document.getElementById("cmdList");if(!list)return;q=(q||"").toLowerCase();var filtered=commandActions.filter(function(a){return !q||a[0].toLowerCase().includes(q)});list.innerHTML=filtered.map(function(a,i){return '<div class="cmdItem" data-cmd="'+i+'"><span>'+a[0]+'</span><kbd>'+a[1]+'</kbd></div>';}).join("");list.querySelectorAll(".cmdItem").forEach(function(el){el.addEventListener("click",function(){var a=filtered[Number(el.dataset.cmd)];if(a){a[2]();closeCommandPalette();}});});}
function exportDraftConfig(){try{var obj={username:document.getElementById("username").value,bio:document.getElementById("bio").value,badges:badges,links:links,feature_flags:featureFlags,accent:document.getElementById("accent").value,font:document.getElementById("font").value,bg_type:document.getElementById("bg_type").value,exported_at:new Date().toISOString()};var blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bio-config-draft.json";a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500);}catch(e){alert("Export Fehler: "+e.message)}}
function bindAdminStudio(){
  document.querySelectorAll("input,textarea,select").forEach(function(el){el.addEventListener("input",markDirty);el.addEventListener("change",markDirty);});
  var cmd=document.getElementById("cmdInput"); if(cmd)cmd.addEventListener("input",function(){renderCommands(this.value)});
  var gs=document.getElementById("globalAdminSearch"); if(gs)gs.addEventListener("input",function(){var q=this.value.toLowerCase().trim(); if(!q)return; var map={badge:"profile",badges:"profile",avatar:"profile",audio:"effects",music:"effects",song:"effects",spotify:"profile",background:"background",bg:"background",font:"design",color:"design",farbe:"design",link:"links",social:"links",template:"templates",feature:"featurelab",css:"advanced",js:"advanced",code:"advanced",password:"security"}; Object.keys(map).some(function(k){if(q.includes(k)){navTo(map[k]);return true}return false});});
  document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommandPalette()} if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();save()} if(e.key==="Escape")closeCommandPalette();});
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
  try{renderFeatures();}catch(e){console.error(e);}
  try{bindAdminStudio();}catch(e){console.error(e);}
});
</script>${v4AdminPlugin(c)}${v5AdminPlugin(c)}${v6AdminPlugin(c)}
</body></html>`);
});

app.post("/admin/save", requireAuth, async (req, res) => {
  const current = await getConfig();
  const { newPassword, ...fields } = req.body;
  if (typeof fields.bg_video_url === "string" && fields.bg_video_url.startsWith("data:video")) {
    fields.bg_video_url = current.bg_video_url && current.bg_video_url.startsWith("/asset/bg-video") ? current.bg_video_url : "";
  }
  const updated = { ...current, ...fields, password: newPassword ? await bcrypt.hash(newPassword, 10) : current.password };
  await saveConfig(updated);
  res.json({ ok: true });
});

app.get("/go/:idx", async (req, res) => {
  const c = await getConfig();
  const idx = Number(req.params.idx);
  const link = Array.isArray(c.links) ? c.links[idx] : null;
  const url = link ? getLinkUrl(link) : null;
  if (!url) return res.redirect("/");
  const p = PLATFORMS[link.platform] || PLATFORMS.link;
  trackEvent(req, "click", { config: c, link_index: idx, link_platform: link.platform || "link", link_label: link.username || p.name }).catch(()=>{});
  res.redirect(url);
});

app.get("/healthz", (req, res) => res.json({ ok: true, service: "bio", time: new Date().toISOString() }));
app.get("/robots.txt", async (req, res) => {
  const base = publicUrl(req);
  res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});
app.get("/sitemap.xml", async (req, res) => {
  const base = publicUrl(req);
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>`);
});
app.get("/manifest.webmanifest", async (req, res) => {
  const c = await getConfig();
  res.type("application/manifest+json").send({
    name: c.pwa_name || c.meta_title || c.username || "Bio Page",
    short_name: c.username || "bio",
    start_url: "/",
    display: "standalone",
    background_color: c.bg_color || "#080808",
    theme_color: c.pwa_color || c.accent || "#c8ff00",
    icons: c.favicon_url || c.avatar_url ? [{ src: c.favicon_url || c.avatar_url, sizes: "512x512", type: "image/png" }] : []
  });
});
app.get("/theme.json", async (req, res) => {
  const c = await getConfig();
  res.json({ username: c.username, accent: c.accent, font: c.font, features: Object.keys(c.feature_flags || {}).filter(k => c.feature_flags[k]) });
});
app.get("/share-card.svg", async (req, res) => {
  const c = await getConfig();
  const title = esc(c.meta_title || c.username || "bio");
  const desc = esc(c.meta_description || String(c.bio || "").split("\n")[0] || "");
  const a = safeColor(c.accent, "#c8ff00") || "#c8ff00";
  const bgc = safeColor(c.bg_color, "#080808") || "#080808";
  res.type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bgc}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="970" cy="100" r="220" fill="${a}" opacity=".18"/><circle cx="160" cy="540" r="260" fill="${a}" opacity=".12"/><rect x="90" y="95" width="1020" height="440" rx="42" fill="rgba(255,255,255,.06)" stroke="${a}" stroke-opacity=".45"/><text x="140" y="255" fill="${a}" font-size="30" font-family="monospace">bio profile</text><text x="140" y="335" fill="#fff" font-size="78" font-family="Arial, sans-serif" font-weight="800">${title}</text><text x="140" y="410" fill="#cbd5e1" font-size="30" font-family="Arial, sans-serif">${desc}</text></svg>`);
});

app.get("/admin/api/analytics", requireAuth, async (req, res) => {
  try {
    const views = await pool.query("SELECT count(*)::int n FROM bio_events WHERE type='view' AND created_at > now() - interval '7 days'");
    const clicks = await pool.query("SELECT count(*)::int n FROM bio_events WHERE type='click' AND created_at > now() - interval '7 days'");
    const top = await pool.query("SELECT coalesce(link_label, link_platform, 'link') label, coalesce(link_platform,'link') platform, count(*)::int clicks FROM bio_events WHERE type='click' AND created_at > now() - interval '30 days' GROUP BY 1,2 ORDER BY clicks DESC LIMIT 10");
    const events = await pool.query("SELECT type,path,link_label,to_char(created_at,'YYYY-MM-DD HH24:MI') created_at FROM bio_events ORDER BY id DESC LIMIT 20");
    const v = views.rows[0]?.n || 0, cl = clicks.rows[0]?.n || 0;
    res.json({ ok:true, views_7d:v, clicks_7d:cl, ctr:v ? Math.round((cl/v)*1000)/10 : 0, top_links:top.rows, events:events.rows });
  } catch(e) { res.status(500).json({ ok:false, error:e.message }); }
});
app.post("/admin/api/reset-analytics", requireAuth, async (req, res) => { await pool.query("DELETE FROM bio_events"); res.json({ ok:true }); });
app.post("/admin/api/snapshot", requireAuth, async (req, res) => { const c = await getConfig(); await pool.query("INSERT INTO bio_snapshots(label,data) VALUES($1,$2)", [String(req.body?.label || "manual snapshot").slice(0,80), c]); res.json({ ok:true }); });
app.get("/admin/api/snapshots", requireAuth, async (req, res) => { const { rows } = await pool.query("SELECT id,label,to_char(created_at,'YYYY-MM-DD HH24:MI') created_at FROM bio_snapshots ORDER BY id DESC LIMIT 20"); res.json({ ok:true, snapshots:rows }); });
app.get("/admin/api/export", requireAuth, async (req, res) => { const c = await getConfig(); res.setHeader("Content-Disposition", "attachment; filename=bio-config-export.json"); res.json(c); });


/* ===== V5 EXTREME ROUTES ===== */
app.post("/api/reaction", async (req, res) => {
  try { await trackEvent(req, "reaction", { link_label: String(req.body?.reaction || "reaction").slice(0, 80) }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok:false, error:e.message }); }
});
app.get("/api/v5-profile", async (req, res) => {
  const c = await getConfig();
  res.json({ username: c.username, bio: c.bio, accent: c.accent, status: c.status, tags: cleanLines(c.v5_tags, 50), highlights: v5Rows(c.v5_highlights, 30, ["title","value","extra"]), links: (c.links || []).map((l, i) => ({ index:i, platform:l.platform, label:l.username || (PLATFORMS[l.platform]||PLATFORMS.link).name, url:getLinkUrl(l) })) });
});
app.get("/embed/card", async (req, res) => {
  const c = await getConfig(); const base = publicUrl(req);
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:transparent;font-family:Inter,Arial}.card{width:360px;max-width:100%;border-radius:24px;padding:24px;background:${esc(c.bg_color||"#080808")};color:${esc(c.text_color||"#fff")};border:1px solid ${esc(c.accent||"#c8ff00")};box-shadow:0 24px 90px rgba(0,0,0,.35)}h1{margin:0 0 8px;font-size:28px}p{opacity:.72;line-height:1.5}.a{color:${esc(c.accent||"#c8ff00")}}</style></head><body><a href="${base}/" target="_blank" style="text-decoration:none"><div class="card"><h1>@<span class="a">${esc(c.username||"username")}</span></h1><p>${esc(String(c.bio||"").split("\n")[0]||"")}</p></div></a></body></html>`);
});
app.get("/identity-card.svg", async (req, res) => {
  const c = await getConfig(); const a = safeColor(c.accent, "#c8ff00") || "#c8ff00"; const bg = safeColor(c.bg_color, "#080808") || "#080808"; const name = esc(c.username || "username"); const bio = esc(String(c.bio||"").split("\n")[0] || "profile");
  res.type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="900" height="500" rx="36" fill="url(#g)"/><circle cx="760" cy="90" r="170" fill="${a}" opacity=".18"/><rect x="54" y="54" width="792" height="392" rx="32" fill="rgba(255,255,255,.055)" stroke="${a}" stroke-opacity=".5"/><text x="92" y="150" fill="${a}" font-family="monospace" font-size="24">V5 IDENTITY CARD</text><text x="92" y="240" fill="#fff" font-family="Arial" font-weight="800" font-size="68">@${name}</text><text x="92" y="300" fill="#cbd5e1" font-family="Arial" font-size="26">${bio}</text><text x="92" y="385" fill="${a}" font-family="monospace" font-size="18">verified profile aesthetic</text></svg>`);
});
app.get("/badge.svg", async (req, res) => {
  const text = esc(String(req.query.text || "VIP").slice(0, 24)); const color = safeColor(req.query.color, "#c8ff00") || "#c8ff00";
  res.type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="80"><rect x="4" y="4" width="252" height="72" rx="36" fill="rgba(0,0,0,.9)" stroke="${color}"/><circle cx="42" cy="40" r="12" fill="${color}"/><text x="68" y="49" fill="${color}" font-family="monospace" font-size="24" font-weight="700">${text}</text></svg>`);
});
app.get("/admin/api/v5-audit", requireAuth, async (req, res) => {
  const c = await getConfig();
  const modules = [c.v5_enabled,c.v5_aura_enabled,c.v5_reactions_enabled,c.v5_terminal_enabled,c.v5_secret_enabled,c.v5_countdown_enabled,c.v5_nav_enabled,c.announcement_enabled,c.share_bar_enabled,c.click_tracking].filter(v5Bool).length;
  const links = Array.isArray(c.links) ? c.links.length : 0; const badges = normalizeBadges(c.badges).length;
  const score = Math.min(100, 20 + modules*7 + Math.min(links,6)*4 + Math.min(badges,8)*3 + (c.avatar_url?8:0) + (c.meta_title?5:0));
  res.json({ ok:true, score, modules, links, badges });
});
app.post("/admin/api/restore-snapshot/:id", requireAuth, async (req, res) => {
  try { const id = Number(req.params.id); const { rows } = await pool.query("SELECT data FROM bio_snapshots WHERE id=$1 LIMIT 1", [id]); if (!rows.length) return res.status(404).json({ ok:false, error:"snapshot not found" }); await saveConfig(rows[0].data); res.json({ ok:true }); }
  catch (e) { res.status(500).json({ ok:false, error:e.message }); }
});

app.get("/admin/logout", (req, res) => { req.session.destroy(); res.redirect("/admin"); });

initDB().then(() => app.listen(PORT, () => console.log("Server läuft auf Port", PORT))).catch(err => { console.error("DB Init Fehler:", err); process.exit(1); });
