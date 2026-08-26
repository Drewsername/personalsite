// Single-account authentication for the site owner.
//
// There is exactly one account. The credential lives in auth.json on the data
// volume as a scrypt hash + per-account salt (Node's crypto, so no bcrypt
// dependency), and is seeded on first use with the handoff password. That seed
// is deliberately weak, so `mustChange` is set alongside it and every
// authenticated route except the password-change route refuses to run until a
// real password replaces it.
//
// Sessions are a signed cookie, not server state: `username.expiry.HMAC`. That
// keeps the server stateless across restarts and needs no session store.
import express from 'express';
import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { updateJson } from './store.mjs';

const scrypt = promisify(scryptCb);

const COOKIE = 'db_session';
const SESSION_DAYS = 30;
const SEED_USERNAME = 'drew';
const SEED_PASSWORD = 'password';

// The key that signs session cookies. It has to outlive the process — a new key
// invalidates every cookie signed with the old one — so it is generated once
// and kept on the data volume beside the credential. SESSION_SECRET overrides
// it for anyone who would rather manage the key themselves. Nothing needs
// configuring either way; only a volume-less deployment signs people out on
// restart, and that would lose the account file too.
let sessionSecret = process.env.SESSION_SECRET || '';

function loadSessionSecret(dataDir) {
  if (sessionSecret) return sessionSecret;
  const file = path.join(dataDir, 'session-secret');
  try {
    sessionSecret = readFileSync(file, 'utf8').trim();
    if (sessionSecret) return sessionSecret;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  sessionSecret = randomBytes(32).toString('hex');
  try {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(file, sessionSecret, { mode: 0o600 });
  } catch (err) {
    console.warn('could not persist the session secret — logins will not survive a restart:', err);
  }
  return sessionSecret;
}

// ── credential file ───────────────────────────────────────────────────────────

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64);
  return { salt, hash: derived.toString('hex') };
}

async function verifyPassword(password, account) {
  const derived = await scrypt(password, account.salt, 64);
  const stored = Buffer.from(account.hash, 'hex');
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

// Reads the account, seeding it on first call. Concurrent first-boot requests
// funnel through updateJson, so the seed is written exactly once.
function loadAccount(authFile) {
  return updateJson(authFile, null, async (current) => {
    if (current) return current;
    const { salt, hash } = await hashPassword(SEED_PASSWORD);
    console.warn(
      `seeded the ${SEED_USERNAME} account with the handoff password — change it at first login`
    );
    return {
      username: SEED_USERNAME,
      salt,
      hash,
      mustChange: true,
      updatedAt: new Date().toISOString(),
    };
  });
}

// ── session cookie ────────────────────────────────────────────────────────────

const sign = (payload) => createHmac('sha256', sessionSecret).update(payload).digest('hex');

function makeToken(username) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const payload = `${username}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  if (typeof token !== 'string') return null;
  const at = token.lastIndexOf('.');
  if (at < 0) return null;
  const payload = token.slice(0, at);
  const mac = token.slice(at + 1);
  const expected = sign(payload);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const [username, exp] = payload.split('.');
  if (!username || !exp || Number(exp) < Date.now()) return null;
  return { username };
}

// Express 5 has no built-in cookie parser, and one dependency for one cookie
// isn't worth it.
function cookieValue(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

function setSessionCookie(req, res, token) {
  const bits = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${token ? SESSION_DAYS * 86400 : 0}`,
  ];
  // Mark Secure whenever the request itself arrived over TLS. With trust proxy
  // set, req.secure reflects Railway's X-Forwarded-Proto, so this is on in
  // production and off on plain http://localhost — where Secure would stop the
  // cookie from being stored at all.
  if (req.secure) bits.push('Secure');
  res.append('Set-Cookie', bits.join('; '));
}

// ── login throttling ──────────────────────────────────────────────────────────

const failures = new Map();
const FAIL_WINDOW = 15 * 60000;
const FAIL_LIMIT = 10;

function tooManyFailures(ip) {
  const recent = (failures.get(ip) || []).filter((t) => Date.now() - t < FAIL_WINDOW);
  failures.set(ip, recent);
  return recent.length >= FAIL_LIMIT;
}

function recordFailure(ip) {
  const recent = failures.get(ip) || [];
  recent.push(Date.now());
  failures.set(ip, recent);
}

// ── public surface ────────────────────────────────────────────────────────────

export function createAuth(dataDir) {
  const authFile = path.join(dataDir, 'auth.json');
  loadSessionSecret(dataDir);

  // Attaches req.session when the cookie checks out. Never rejects — routes
  // decide whether a session is required.
  const session = (req, _res, next) => {
    req.session = readToken(cookieValue(req, COOKIE));
    next();
  };

  // Gate for owner-only routes. Also blocks everything while the seeded
  // password is still in place, so a leaked default can't reach the console.
  const requireAuth = async (req, res, next) => {
    try {
      if (!req.session) return res.status(401).json({ error: 'not signed in' });
      const account = await loadAccount(authFile);
      if (req.session.username !== account.username) {
        return res.status(401).json({ error: 'not signed in' });
      }
      if (account.mustChange) {
        return res.status(403).json({ error: 'password change required', mustChange: true });
      }
      req.account = account;
      next();
    } catch (err) {
      next(err);
    }
  };

  const router = express.Router();
  router.use(express.json({ limit: '4kb' }));

  router.get('/me', async (req, res, next) => {
    try {
      if (!req.session) return res.json({ authed: false });
      const account = await loadAccount(authFile);
      if (req.session.username !== account.username) return res.json({ authed: false });
      res.json({ authed: true, username: account.username, mustChange: !!account.mustChange });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const ip = req.ip || 'unknown';
      if (tooManyFailures(ip)) {
        return res.status(429).json({ error: 'Too many attempts. Try again later.' });
      }

      const username = String(req.body?.username || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const account = await loadAccount(authFile);

      const ok = username === account.username && (await verifyPassword(password, account));
      if (!ok) {
        recordFailure(ip);
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      failures.delete(ip);
      setSessionCookie(req, res, makeToken(account.username));
      res.json({ ok: true, username: account.username, mustChange: !!account.mustChange });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', (req, res) => {
    setSessionCookie(req, res, '');
    res.json({ ok: true });
  });

  // Reachable with only a session (not requireAuth) — it is the one thing a
  // must-change account is allowed to do.
  router.post('/password', async (req, res, next) => {
    try {
      if (!req.session) return res.status(401).json({ error: 'not signed in' });
      const current = String(req.body?.current || '');
      const nextPassword = String(req.body?.next || '');
      if (nextPassword.length < 10) {
        return res.status(400).json({ error: 'New password must be at least 10 characters.' });
      }
      if (nextPassword.length > 200) {
        return res.status(400).json({ error: 'New password is too long.' });
      }
      if (nextPassword === SEED_PASSWORD) {
        return res.status(400).json({ error: 'Pick something other than the handoff password.' });
      }

      const existing = await loadAccount(authFile);
      if (req.session.username !== existing.username) {
        return res.status(401).json({ error: 'not signed in' });
      }
      if (!(await verifyPassword(current, existing))) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      const { salt, hash } = await hashPassword(nextPassword);
      await updateJson(authFile, existing, (account) => ({
        ...account,
        salt,
        hash,
        mustChange: false,
        updatedAt: new Date().toISOString(),
      }));
      // Rotate the cookie so the new expiry starts now.
      setSessionCookie(req, res, makeToken(existing.username));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return { router, session, requireAuth };
}
