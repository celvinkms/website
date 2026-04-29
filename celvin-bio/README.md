# celvin.rip — Bio Backend

## Lokaler Test (optional)
```bash
npm install
# .env Datei erstellen mit deinen Werten (siehe unten)
node server.js
```

## Deployment auf Railway

### 1. GitHub Repo erstellen
- Geh auf github.com → "New repository" → Name z.B. `celvin-bio`
- Alle Dateien hochladen (oder mit Git pushen)

### 2. Railway Projekt erstellen
- Geh auf railway.app → "New Project"
- "Deploy from GitHub repo" → dein Repo auswählen

### 3. PostgreSQL hinzufügen
- Im Railway Projekt: "+ New" → "Database" → "PostgreSQL"
- Railway verbindet die DB automatisch

### 4. Environment Variables setzen
Im Railway Projekt → dein Service → "Variables":
```
SESSION_SECRET=irgendein-langer-zufaelliger-string-hier
```
(DATABASE_URL wird von Railway automatisch gesetzt)

### 5. Domain verbinden
- Railway Service → "Settings" → "Domains" → "Custom Domain"
- `celvin.rip` eintragen
- Den CNAME bei Nicenic auf deinen Railway-Service zeigen lassen

## Standard Login
- URL: celvin.rip/admin
- Passwort: `admin123`
- **Sofort im Dashboard ändern!**

## Dateien
- `server.js` — der komplette Server
- `package.json` — dependencies
