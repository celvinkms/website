# celvin.rip — Bio Backend

## Admin-Editor

Unter `/admin/dashboard` stehen Profil, Links, Design und zusätzliche Module in
getrennten Bereichen. Die Suche filtert die Navigation; Enter öffnet den ersten
Treffer. Strg/Cmd+S speichert das Profil, Strg/Cmd+K öffnet die Befehlssuche.
Die Vorschau zeigt den zuletzt **gespeicherten** Stand. Auf kleinen Bildschirmen
öffnet der Vorschau-Button die Vorschau als separates Panel.

Profil-Speichern ignoriert Passwortfelder, auch wenn der Browser sie automatisch
ausfüllt. Unter **Sicherheit** lässt sich das Passwort separat mit dem aktuellen
Passwort und zweimaliger Eingabe des neuen Passworts ändern. Fehler beim Speichern
werden angezeigt; Eingaben bleiben erhalten.

### Render

- Root Directory: `celvin-bio`
- Build Command: `npm install`
- Start Command: `npm start`
- `DATABASE_URL`: aktuelle Internal Database URL einer aktiven Render-Postgres-
  Datenbank im selben Account und derselben Region.
- `SESSION_SECRET`: einen langen zufälligen Wert als Environment Variable setzen.

Für diese Änderung ist keine Datenbank-Migration nötig. Nach dem Merge neu deployen;
der Ordner `admin/` wird zusammen mit `server.js` bereitgestellt. Die alte Datei
`server.js` im Repository-Hauptverzeichnis ist nicht der hier gepflegte Render-Service.

### Tests

`npm test` prüft die Admin-Routen und die erzeugten Inline-Skripte ohne echte
Datenbank. Die Tests simulieren PostgreSQL und bcrypt; eine echte Render-Verbindung
wird dadurch nicht geprüft.

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
