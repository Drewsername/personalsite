import express from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 8080;
const UPSTREAM = (process.env.PERSONAL_UPSTREAM || 'https://mythosbook-production.up.railway.app').replace(/\/+$/, '');
const MOUNT = '/personal';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const index = path.join(dist, 'index.html');

const app = express();

const hopByHop = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function upstreamPath(originalUrl) {
  const next = originalUrl.replace(new RegExp(`^${MOUNT}(?=/|$)`), '') || '/';
  return next.startsWith('/') ? next : `/${next}`;
}

async function proxyPersonal(req, res, next) {
  try {
    const target = new URL(upstreamPath(req.originalUrl), UPSTREAM);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || hopByHop.has(key.toLowerCase())) continue;
      if (key.toLowerCase() === 'host') continue;
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    headers.set('x-forwarded-host', req.headers.host ?? 'drewbermudez.com');
    headers.set('x-forwarded-proto', req.headers['x-forwarded-proto'] ?? 'https');
    headers.set('x-forwarded-prefix', MOUNT);

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      duplex: ['GET', 'HEAD'].includes(req.method) ? undefined : 'half',
      redirect: 'manual',
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (hopByHop.has(key.toLowerCase())) return;
      if (key.toLowerCase() === 'location' && value.startsWith('/')) {
        res.setHeader(key, `${MOUNT}${value}`);
        return;
      }
      res.setHeader(key, value);
    });

    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    next(err);
  }
}

app.use(MOUNT, proxyPersonal);

app.use(express.static(dist));

app.get(/.*/, (req, res, next) => {
  if (!existsSync(index)) return next();
  createReadStream(index).pipe(res.type('html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(502).type('text/plain').send('Personal workspace is temporarily unavailable.');
});

app.listen(PORT, () => {
  console.log(`drewbermudez.com server listening on ${PORT}`);
});
