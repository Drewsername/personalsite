#!/usr/bin/env node
// Bulk-add items to the /moveout listing from a JSON manifest.
//
//   MOVEOUT_USER=drew MOVEOUT_PASS=… node scripts/moveout-import.mjs manifest.json [https://drewbermudez.com]
//
// The manifest is an array of items shaped like the admin form's payload, with
// `photos` given as local file paths instead of uploaded URLs:
//
//   [{ "title": "…", "price": 40, "status": "available",
//      "description": "…", "notes": "…", "photos": ["./a.jpg", "./b.jpg"] }]
//
// Relative photo paths resolve against the manifest's own directory. Photos are
// sent as-is — resize them to ~1600px first, the way the browser uploader does,
// or the server will reject anything over 3MB.
//
// It signs in the same way the admin page does and walks the same endpoints, so
// anything the console accepts, this accepts. Items are created in manifest
// order; each new item lands at the top of the list, so the last entry in the
// manifest ends up first on the page.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const [manifestPath, origin = 'https://drewbermudez.com'] = process.argv.slice(2);
const username = process.env.MOVEOUT_USER;
const password = process.env.MOVEOUT_PASS;

if (!manifestPath || !username || !password) {
  console.error('usage: MOVEOUT_USER=… MOVEOUT_PASS=… node scripts/moveout-import.mjs manifest.json [origin]');
  process.exit(2);
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

let cookie = '';

async function call(route, { method = 'POST', body } = {}) {
  const res = await fetch(origin + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status}: ${payload?.error || 'request failed'}`);
  // The session arrives as a Set-Cookie on login; keep just the name=value.
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  return payload;
}

async function uploadPhoto(file) {
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`${file}: not a jpg/png/webp`);
  const dataUrl = `data:${type};base64,${(await readFile(file)).toString('base64')}`;
  const { url } = await call('/api/moveout/admin/photos', { body: { dataUrl } });
  return url;
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const baseDir = path.dirname(path.resolve(manifestPath));

const me = await call('/api/auth/login', { body: { username, password } });
if (me.mustChange) {
  console.error('The account is still on the handoff password — change it in the admin page first.');
  process.exit(1);
}

for (const item of manifest) {
  const photos = [];
  for (const p of item.photos || []) photos.push(await uploadPhoto(path.resolve(baseDir, p)));
  const { item: created } = await call('/api/moveout/admin/items', { body: { ...item, photos } });
  console.log(`added  ${created.title}${created.price != null ? `  $${created.price}` : ''}  (${photos.length} photo${photos.length === 1 ? '' : 's'})`);
}

console.log(`\n${manifest.length} item${manifest.length === 1 ? '' : 's'} listed at ${origin}/moveout`);
