# celvin.rip

Celvins persönliche Bio. Profil und Links stehen in `public/index.html`. Design, Schriften und Profilbild liegen in `public/assets/`.

## Lokal starten

Mit Node.js 20.3 oder neuer in diesem Ordner:

```sh
npm start
npm test
```

Die Seite ist unter http://127.0.0.1:3000 verfügbar. Alternativ startet `node server.js` im Repository-Hauptverzeichnis denselben Server.

## Render

- Root Directory: `celvin-bio`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/healthz`

Die Bio benötigt weder eine Datenbank noch einen Admin-Login. Änderungen an Text und Links werden über Git veröffentlicht. Die GitHub-Verfügbarkeitsprüfung verwendet weiterhin `/healthz`.

Barlow Condensed und Manrope werden lokal eingebunden. Die Lizenztexte liegen bei den Schriften.
