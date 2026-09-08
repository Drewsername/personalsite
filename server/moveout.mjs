// The /moveout listing page: a public catalogue of things for sale plus an
// owner-only console for editing it and reading who responded.
//
// Two rules shape the whole file:
//   * contact details never leave the admin side. Public responses carry only
//     the item fields; the submissions log is behind requireAuth.
//   * a submission is persisted before the notification email is attempted, so
//     a mail outage loses nothing.
import express from 'express';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { appendFile, mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { readJson, updateJson } from './store.mjs';
import { sendMail } from './mail.mjs';

const EMPTY = { items: [] };

// Photos arrive as base64 data URLs already resized by the browser to ~1600px
// JPEG. This cap is the backstop for anything that skips the client.
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_PHOTOS_PER_ITEM = 6;

const SUBMIT_WINDOW = 10 * 60000;
const SUBMIT_LIMIT = 5;
const submits = new Map();

const STATUSES = ['available', 'pending', 'sold'];

// View tracking keeps a per-day tally of page loads and item opens, plus a
// set of visitor fingerprints per day so "unique" means something. The
// fingerprint is a salted hash of ip + user agent — enough to dedupe one
// person's refreshes, not enough to identify them later. The salt is per
// process, so a deploy mid-day can count a returning visitor twice — close
// enough for "is anyone looking". Days older than the retention window are
// dropped on write.
const EMPTY_VIEWS = { days: {}, items: {} };
const VIEW_RETENTION_DAYS = 90;
const FINGERPRINT_SALT = randomUUID();

const today = () => new Date().toISOString().slice(0, 10);

function fingerprint(req) {
  return createHash('sha256')
    .update(`${FINGERPRINT_SALT}|${req.ip}|${req.headers['user-agent'] || ''}`)
    .digest('base64url')
    .slice(0, 16);
}

function pruneDays(days) {
  const cutoff = new Date(Date.now() - VIEW_RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
  return Object.fromEntries(Object.entries(days).filter(([day]) => day >= cutoff));
}

const money = (n) => `$${Number(n).toFixed(2).replace(/\.00$/, '')}`;

function rateLimited(ip) {
  const recent = (submits.get(ip) || []).filter((t) => Date.now() - t < SUBMIT_WINDOW);
  if (recent.length >= SUBMIT_LIMIT) {
    submits.set(ip, recent);
    return true;
  }
  recent.push(Date.now());
  submits.set(ip, recent);
  return false;
}

// One contact field that accepts either form: an email address, or a phone
// number of at least 10 digits. Returns null when it is neither.
function parseContact(raw) {
  const value = String(raw || '').trim().slice(0, 200);
  if (!value) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { contact: value, contactKind: 'email' };
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) return { contact: value, contactKind: 'phone' };
  return null;
}

function cleanItemInput(body, existing = {}) {
  const title = String(body?.title ?? existing.title ?? '').trim().slice(0, 120);
  if (!title) return { error: 'Title is required.' };

  const rawPrice = body?.price ?? existing.price;
  const price = rawPrice === '' || rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000)) {
    return { error: 'Price must be a number between 0 and 100000.' };
  }

  const status = String(body?.status ?? existing.status ?? 'available');
  if (!STATUSES.includes(status)) return { error: 'Unknown status.' };

  const photos = Array.isArray(body?.photos) ? body.photos : existing.photos || [];
  if (photos.length > MAX_PHOTOS_PER_ITEM) return { error: `At most ${MAX_PHOTOS_PER_ITEM} photos.` };

  return {
    value: {
      title,
      price,
      status,
      description: String(body?.description ?? existing.description ?? '').trim().slice(0, 2000),
      notes: String(body?.notes ?? existing.notes ?? '').trim().slice(0, 400),
      photos: photos.filter((p) => typeof p === 'string' && p.startsWith('/moveout-media/')).slice(0, MAX_PHOTOS_PER_ITEM),
    },
  };
}

export function createMoveout(dataDir, { requireAuth }) {
  const itemsFile = path.join(dataDir, 'moveout.json');
  const submissionsFile = path.join(dataDir, 'moveout-submissions.jsonl');
  const mediaDir = path.join(dataDir, 'moveout-media');
  const viewsFile = path.join(dataDir, 'moveout-views.json');

  const router = express.Router();

  // The photo route needs megabytes; nothing else here needs more than a few
  // kilobytes, so the generous parser is scoped to that one route below.
  const smallJson = express.json({ limit: '16kb' });

  // ── public ──────────────────────────────────────────────────────────────────

  router.get('/items', async (_req, res, next) => {
    try {
      const { items } = await readJson(itemsFile, EMPTY);
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  // A page load (no itemId) or an item opened (with one). The owner's own
  // visits are skipped so checking the listing doesn't inflate it.
  router.post('/view', smallJson, async (req, res, next) => {
    try {
      if (req.session) return res.json({ ok: true });
      const itemId = typeof req.body?.itemId === 'string' ? req.body.itemId.slice(0, 64) : null;
      const day = today();
      const who = fingerprint(req);
      await updateJson(viewsFile, EMPTY_VIEWS, (v) => {
        const days = pruneDays(v.days);
        const d = days[day] || { views: 0, opens: 0, visitors: [] };
        if (itemId) d.opens += 1;
        else d.views += 1;
        if (!d.visitors.includes(who)) d.visitors.push(who);
        days[day] = d;
        const items = { ...v.items };
        if (itemId) items[itemId] = (items[itemId] || 0) + 1;
        return { days, items };
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.post('/submit', smallJson, async (req, res, next) => {
    try {
      // Honeypot: a field no human sees and no real submission fills in.
      if (String(req.body?.website || '')) return res.json({ ok: true });

      const ip = req.ip || 'unknown';
      if (rateLimited(ip)) {
        return res.status(429).json({ error: 'Too many submissions. Try again in a little while.' });
      }

      const kind = req.body?.kind === 'offer' ? 'offer' : 'claim';
      const contact = parseContact(req.body?.contact);
      if (!contact) return res.status(400).json({ error: 'Enter a valid email address or phone number.' });

      const { items } = await readJson(itemsFile, EMPTY);
      const item = items.find((i) => i.id === req.body?.itemId);
      if (!item) return res.status(404).json({ error: 'That item is no longer listed.' });

      let amount = item.price;
      if (kind === 'offer') {
        amount = Number(req.body?.amount);
        if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
          return res.status(400).json({ error: 'Enter an offer amount.' });
        }
      }

      const submission = {
        id: randomUUID(),
        itemId: item.id,
        itemTitle: item.title,
        kind,
        amount,
        ...contact,
        name: String(req.body?.name || '').trim().slice(0, 120),
        note: String(req.body?.note || '').trim().slice(0, 1000),
        at: new Date().toISOString(),
        ip,
      };

      await mkdir(dataDir, { recursive: true });
      await appendFile(submissionsFile, JSON.stringify(submission) + '\n');

      // Persisted — from here on, failures are logged, not returned.
      const who = submission.name || 'Someone';
      const headline =
        kind === 'offer'
          ? `${who} offered ${money(amount)} for ${item.title}`
          : `${who} claimed ${item.title}${item.price != null ? ` at ${money(item.price)}` : ''}`;
      sendMail({
        fromName: 'moveout via drewbermudez.com',
        replyTo: contact.contactKind === 'email' ? contact.contact : undefined,
        subject: `moveout: ${headline}`,
        text: [
          headline,
          '',
          `Item:    ${item.title}`,
          `Status:  ${item.status}`,
          `Asking:  ${item.price != null ? money(item.price) : '—'}`,
          `Type:    ${kind}`,
          `Amount:  ${amount != null ? money(amount) : '—'}`,
          `Contact: ${contact.contact} (${contact.contactKind})`,
          submission.note ? `\nNote:\n${submission.note}` : '',
          '',
          'Full list: https://drewbermudez.com/moveout/admin',
        ].join('\n'),
      }).catch((err) => console.error('moveout notify failed:', err));

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // ── owner only ──────────────────────────────────────────────────────────────

  const admin = express.Router();
  admin.use(requireAuth);

  admin.get('/views', async (_req, res, next) => {
    try {
      const { days, items } = await readJson(viewsFile, EMPTY_VIEWS);
      const day = today();
      const week = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const sum = (from, key) =>
        Object.entries(days)
          .filter(([d]) => d >= from)
          .reduce((n, [, d]) => n + (key === 'visitors' ? d.visitors.length : d[key]), 0);
      res.json({
        today: { views: days[day]?.views || 0, visitors: days[day]?.visitors.length || 0 },
        week: { views: sum(week, 'views'), visitors: sum(week, 'visitors') },
        total: { views: sum('', 'views'), opens: sum('', 'opens') },
        items,
      });
    } catch (err) {
      next(err);
    }
  });

  admin.get('/submissions', async (_req, res, next) => {
    try {
      let text = '';
      try {
        text = await readFile(submissionsFile, 'utf8');
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      const submissions = text
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .reverse();
      res.json({ submissions });
    } catch (err) {
      next(err);
    }
  });

  admin.post('/items', smallJson, async (req, res, next) => {
    try {
      const { value, error } = cleanItemInput(req.body);
      if (error) return res.status(400).json({ error });
      const item = { id: randomUUID(), ...value, createdAt: new Date().toISOString() };
      const state = await updateJson(itemsFile, EMPTY, (s) => ({ ...s, items: [item, ...s.items] }));
      res.json({ item, items: state.items });
    } catch (err) {
      next(err);
    }
  });

  admin.patch('/items/:id', smallJson, async (req, res, next) => {
    try {
      const { items } = await readJson(itemsFile, EMPTY);
      const existing = items.find((i) => i.id === req.params.id);
      if (!existing) return res.status(404).json({ error: 'No such item.' });
      const { value, error } = cleanItemInput(req.body, existing);
      if (error) return res.status(400).json({ error });
      const state = await updateJson(itemsFile, EMPTY, (s) => ({
        ...s,
        items: s.items.map((i) => (i.id === req.params.id ? { ...i, ...value } : i)),
      }));
      // Photos dropped from the item are dropped from disk too.
      for (const url of existing.photos || []) {
        if (!value.photos.includes(url)) await removeMedia(mediaDir, url);
      }
      res.json({ items: state.items });
    } catch (err) {
      next(err);
    }
  });

  admin.delete('/items/:id', async (req, res, next) => {
    try {
      const { items } = await readJson(itemsFile, EMPTY);
      const existing = items.find((i) => i.id === req.params.id);
      const state = await updateJson(itemsFile, EMPTY, (s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== req.params.id),
      }));
      for (const url of existing?.photos || []) await removeMedia(mediaDir, url);
      res.json({ items: state.items });
    } catch (err) {
      next(err);
    }
  });

  // Reordering is two buttons rather than drag-and-drop: it has to work with a
  // thumb, on a phone, in a half-packed apartment.
  admin.post('/items/:id/move', smallJson, async (req, res, next) => {
    try {
      const delta = req.body?.direction === 'down' ? 1 : -1;
      const state = await updateJson(itemsFile, EMPTY, (s) => {
        const from = s.items.findIndex((i) => i.id === req.params.id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= s.items.length) return s;
        const items = [...s.items];
        [items[from], items[to]] = [items[to], items[from]];
        return { ...s, items };
      });
      res.json({ items: state.items });
    } catch (err) {
      next(err);
    }
  });

  admin.post('/photos', express.json({ limit: '8mb' }), async (req, res, next) => {
    try {
      const dataUrl = String(req.body?.dataUrl || '');
      const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!match) return res.status(400).json({ error: 'Unsupported image.' });
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > MAX_PHOTO_BYTES) return res.status(413).json({ error: 'Image is too large.' });
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const name = `${randomUUID()}.${ext}`;
      await mkdir(mediaDir, { recursive: true });
      await writeFile(path.join(mediaDir, name), buffer);
      res.json({ url: `/moveout-media/${name}` });
    } catch (err) {
      next(err);
    }
  });

  router.use('/admin', admin);

  return { router, mediaDir };
}

// Deletes an uploaded photo, guarding against a stored url that tries to walk
// out of the media directory.
async function removeMedia(mediaDir, url) {
  const name = path.basename(String(url || ''));
  if (!name || name === '.' || name === '..') return;
  try {
    await unlink(path.join(mediaDir, name));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('photo delete failed:', err);
  }
}
