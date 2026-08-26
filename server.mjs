import express from 'express';
import { appendFile, mkdir } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuth } from './server/auth.mjs';
import { createMoveout } from './server/moveout.mjs';
import { sendMail, CONTACT_TO } from './server/mail.mjs';

const PORT = process.env.PORT || 8080;

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const index = path.join(dist, 'index.html');
// Signups append here as JSONL. NOTE: without a mounted volume, Railway's disk
// is ephemeral — point DATA_DIR at a volume to keep signups across deploys.
const dataDir = process.env.DATA_DIR || path.join(root, 'data');

const app = express();

// Railway terminates TLS at its edge, so the client's real address and the
// https-ness of the request both arrive as X-Forwarded-* headers. Without this
// every request looks like it came from the proxy — which would collapse the
// per-IP rate limits into one shared bucket.
app.set('trust proxy', 1);

const auth = createAuth(dataDir);
const moveout = createMoveout(dataDir, { requireAuth: auth.requireAuth });

app.use(auth.session);
// These routers bring their own body parsers (the photo upload route needs
// megabytes), so they mount ahead of the 10kb parser the older routes use.
app.use('/api/auth', auth.router);
app.use('/api/moveout', moveout.router);
// Uploaded listing photos live on the data volume, outside the built bundle.
app.use('/moveout-media', express.static(moveout.mediaDir, { maxAge: '30d', fallthrough: true }));

app.use(express.json({ limit: '10kb' }));

app.post('/api/notify', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const list = String(req.body?.list || 'book');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'invalid email' });
  }
  try {
    await mkdir(dataDir, { recursive: true });
    const line = JSON.stringify({ email, list, at: new Date().toISOString() });
    await appendFile(path.join(dataDir, 'signups.jsonl'), line + '\n');
    res.json({ ok: true });
  } catch (err) {
    console.error('signup write failed:', err);
    res.status(500).json({ error: 'write failed' });
  }
});

// Contact-form relay. The destination address lives only in server/mail.mjs
// (env-overridable), never in the client bundle. Messages always land in the
// JSONL log; email delivery additionally requires a transport to be configured.
app.post('/api/contact', async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 200);
  const email = String(req.body?.email || '').trim();
  const message = String(req.body?.message || '').trim().slice(0, 5000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'invalid input' });
  }
  try {
    await mkdir(dataDir, { recursive: true });
    const line = JSON.stringify({ name, email, message, at: new Date().toISOString() });
    await appendFile(path.join(dataDir, 'messages.jsonl'), line + '\n');
  } catch (err) {
    console.error('contact write failed:', err);
    return res.status(500).json({ error: 'write failed' });
  }
  // The message is already persisted, so a send failure never fails the request.
  await sendMail({
    fromName: `${name} via drewbermudez.com`,
    replyTo: `${name} <${email}>`,
    subject: `drewbermudez.com contact: ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
  res.json({ ok: true });
});

// The moveout page is unlisted: no link to it anywhere on the site, and no
// crawler should index it either.
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /moveout\n');
});

app.use(express.static(dist));

app.get(/.*/, (req, res, next) => {
  if (!existsSync(index)) return next();
  createReadStream(index).pipe(res.type('html'));
});

// Express identifies error handlers by their arity, so the fourth parameter
// has to stay even though nothing here calls it.
app.use((err, req, res, _next) => {
  console.error('request failed:', req.method, req.path, err);
  res.status(500).json({ error: 'something went wrong' });
});

app.listen(PORT, () => {
  console.log(`drewbermudez.com server listening on ${PORT} (contact → ${CONTACT_TO})`);
});
