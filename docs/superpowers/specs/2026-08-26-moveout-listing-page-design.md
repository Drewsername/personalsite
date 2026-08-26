# Moveout listing page — design

**Date:** 2026-08-26
**Status:** implemented

An unlisted page at `drewbermudez.com/moveout` where neighbours in the
apartment building can browse things for sale and claim or bid on them, plus an
owner-only console for managing the list and reading who responded.

## Requirements

- Public listing at `/moveout`, unlisted: linked from nowhere, not indexed, but
  open to anyone with the URL. No visitor password.
- Owner-only console for adding, editing, reordering, and removing items.
- Items carry a title, asking price, description, a condition/dimensions note,
  photos, and a status of available / pending / sold. Pending items stay open to
  further offers.
- Visitors either claim at the asking price or name their own number. Either way
  they leave an email address or a phone number, visible only to the owner.
- Every submission emails the owner.
- One account, `drew`, seeded with the password `password` and forced to change
  it at first sign-in.
- The site's existing Login panel is that account's sign-in surface.

## Non-requirements

- No visitor accounts, payments, or in-app messaging. Contact happens by email
  or phone, off the site.
- No interest counts or other social proof on the public page. Status is the
  only public signal.

## Architecture

### Routing

`/moveout` is a separate page tree, not a panel in the site's scroll deck.
`src/main.jsx` branches on `location.pathname`: `/moveout*` dynamically imports
the moveout bundle, everything else imports `App`. The split is a dynamic
import, so the WebGL swarm never reaches a visitor who only sees the listing
(22kB vs 78kB gzipped-ish chunks). The moveout branch also sets a `noindex,
nofollow` meta tag and removes the deck's loading overlay, which waits on a
first swarm frame that never comes on this route. `server.mjs` already serves
`index.html` for every unmatched path, so no server routing change is needed;
it additionally serves a `robots.txt` disallowing `/moveout` for crawlers that
never run JS.

Within the moveout tree, routing is a single branch: `/moveout/admin` renders
the console, anything else renders the public listing. The two link to each
other with ordinary anchors.

### Server modules

`server.mjs` had grown to hold routing, mail transport, and validation in one
file. The work is split so each piece has one job:

- `server/store.mjs` — JSON files with atomic writes (temp file + rename) and a
  per-path promise chain so concurrent read-modify-writes serialize.
- `server/mail.mjs` — the Resend/SMTP transport, extracted from the contact
  route so both senders share it. `CONTACT_TO` lives here and never reaches the
  client bundle.
- `server/auth.mjs` — the single account and its session cookie.
- `server/moveout.mjs` — items, submissions, and photo uploads.

### Auth

The credential lives in `auth.json` on the data volume: username, a random
salt, a scrypt hash, and a `mustChange` flag. It is seeded on first read with
`drew` / `password` and `mustChange: true`. `requireAuth` refuses every
owner-only route while that flag is set, so the known handoff password opens
nothing but the password-change form.

Sessions are a signed cookie rather than server state: `username.expiry.HMAC`,
HttpOnly, SameSite=Lax, Secure whenever the request arrived over TLS, 30-day
expiry. The HMAC key comes from `SESSION_SECRET`; if it is unset the server
generates an ephemeral one and warns, which means sessions drop on every deploy.

Failed logins are throttled at 10 per IP per 15 minutes.

### Data

Three paths under `DATA_DIR`, matching the JSONL convention already in use:

- `moveout.json` — `{ items: [...] }`. Array order is display order.
- `moveout-submissions.jsonl` — append-only. Never deleted, never public.
- `moveout-media/` — uploaded JPEGs, served at `/moveout-media/<uuid>.jpg`.

**Item:** `id, title, price, description, notes, photos[], status, createdAt`.

**Submission:** `id, itemId, itemTitle, kind, amount, contact, contactKind,
name, note, at, ip`.

### API

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/auth/me` | anyone |
| POST | `/api/auth/login` | anyone |
| POST | `/api/auth/logout` | anyone |
| POST | `/api/auth/password` | session (the one thing must-change allows) |
| GET | `/api/moveout/items` | anyone |
| POST | `/api/moveout/submit` | anyone |
| GET | `/api/moveout/admin/submissions` | owner |
| POST/PATCH/DELETE | `/api/moveout/admin/items[/:id]` | owner |
| POST | `/api/moveout/admin/items/:id/move` | owner |
| POST | `/api/moveout/admin/photos` | owner |

Submissions carry no contact data into any public response — the public items
endpoint returns item fields only, and the submissions log is behind
`requireAuth`.

### Photos

The browser resizes each photo to 1600px on its long edge and re-encodes it as
JPEG at quality 0.82 before uploading it as a base64 data URL. That keeps
uploads fast on phone data, keeps the volume small, strips camera EXIF
(including GPS) as a side effect, and means the server needs no image library
and no multipart parser. The server caps decoded uploads at 3MB and items at six
photos. Photos dropped from an item, and photos on a deleted item, are unlinked
from disk.

### Email

Every submission is appended to the JSONL log *before* the notification is
attempted, so a mail outage loses nothing and a send failure is logged rather
than returned to the visitor. Subject lines read like
`moveout: Sam offered $45 for Ikea Malm dresser`; `reply_to` is set when the
visitor left an email address.

### Abuse control

The submit route has a honeypot field, a 16kB body cap, and a limit of five
submissions per IP per ten minutes. Nothing heavier — the audience is one
apartment building.

## Deployment

`SESSION_SECRET` must be set on Railway; without it every deploy signs visitors
out. `DATA_DIR` must point at the mounted volume, as it already does for
signups. `RESEND_API_KEY` is already configured for the contact form and is
reused here.

The seeded password is live from the moment this deploys. Sign in and change it.

## Testing

The repo has no test runner, and adding one for a single feature was not worth
the dependency. Verification was done end-to-end against the local server:
anonymous access rejected, wrong password rejected, seeded login blocked from
every owner route until the password changed, item CRUD and reordering, photo
upload (a 2400×1800 source arriving at 1600×1200 and 24kB) and its cleanup on
delete, public and admin payloads checked for contact leakage, both submission
kinds through the real form, the notification path exercised down to the
composed subject line, and the mobile layout checked for overflow.
