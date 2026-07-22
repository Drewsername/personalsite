import express from 'express';
import { appendFile, mkdir } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 8080;

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const index = path.join(dist, 'index.html');
// Signups append here as JSONL. NOTE: without a mounted volume, Railway's disk
// is ephemeral — point DATA_DIR at a volume to keep signups across deploys.
const dataDir = process.env.DATA_DIR || path.join(root, 'data');

const app = express();

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

// Contact-form relay. The destination address lives only here (env-overridable),
// never in the client bundle. Messages always land in the JSONL log; email
// delivery additionally requires SMTP_* to be configured in the environment.
const CONTACT_TO = process.env.CONTACT_TO || 'drewtbermudez@gmail.com';

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
  if (process.env.SMTP_HOST) {
    try {
      const { default: nodemailer } = await import('nodemailer');
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: CONTACT_TO,
        replyTo: `${name} <${email}>`,
        subject: `drewbermudez.com contact: ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
    } catch (err) {
      // The message is already persisted above, so don't fail the request.
      console.error('contact email send failed:', err);
    }
  }
  res.json({ ok: true });
});

app.use(express.static(dist));

app.get(/.*/, (req, res, next) => {
  if (!existsSync(index)) return next();
  createReadStream(index).pipe(res.type('html'));
});

app.listen(PORT, () => {
  console.log(`drewbermudez.com server listening on ${PORT}`);
});
