const http = require('node:http');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createKeepAlive } = require('./keep-alive');

const publicDir = join(__dirname, 'public');
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/assets/bio.css', ['assets/bio.css', 'text/css; charset=utf-8']],
  ['/assets/bio.js', ['assets/bio.js', 'text/javascript; charset=utf-8']],
  ['/assets/celvin.png', ['assets/celvin.png', 'image/png']],
  ['/assets/favicon.png', ['assets/favicon.png', 'image/png']],
  ['/assets/barlow-condensed-800.woff2', ['assets/barlow-condensed-800.woff2', 'font/woff2']],
  ['/assets/manrope-latin.woff2', ['assets/manrope-latin.woff2', 'font/woff2']],
  ['/assets/BarlowCondensed-OFL.txt', ['assets/BarlowCondensed-OFL.txt', 'text/plain; charset=utf-8']],
  ['/assets/Manrope-OFL.txt', ['assets/Manrope-OFL.txt', 'text/plain; charset=utf-8']],
].map(([url, [file, type]]) => [url, { body: readFileSync(join(publicDir, file)), type }]));

const keepAlive = createKeepAlive();
const server = http.createServer((req, res) => {
  const isHead = req.method === 'HEAD';
  const pathname = req.url.split('?', 1)[0];

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  );

  function send(status, body, type, cache = 'no-cache') {
    res.writeHead(status, {
      'Content-Type': type,
      'Content-Length': Buffer.byteLength(body),
      'Cache-Control': cache,
    });
    res.end(isHead ? undefined : body);
  }

  if (req.method !== 'GET' && !isHead) {
    res.setHeader('Allow', 'GET, HEAD');
    return send(405, 'Method not allowed', 'text/plain; charset=utf-8');
  }

  if (pathname === '/healthz') {
    const health = {
      ok: true,
      service: 'bio',
      time: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      keepAlive: keepAlive.status(),
    };
    return send(200, JSON.stringify(health), 'application/json; charset=utf-8', 'no-store');
  }

  const route = routes.get(pathname);
  if (route) {
    const cache = pathname === '/' ? 'no-cache' : 'public, max-age=3600';
    return send(200, route.body, route.type, cache);
  }

  return send(404, 'Seite nicht gefunden.', 'text/plain; charset=utf-8');
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => {
  console.log('Bio preview: http://127.0.0.1:' + server.address().port);
  void keepAlive.start();
});

server.on('close', () => keepAlive.stop());
