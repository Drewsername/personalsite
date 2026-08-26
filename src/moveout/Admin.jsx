import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { resizeToDataUrl } from './photos.js';
import { fieldCls, price, statusLabel } from './format.js';
import { Btn, Field, Notice, PageShell } from './ui.jsx';

// The owner-only console: edit the listing, read who responded. Everything here
// is behind the session cookie — the server enforces it, this just keeps the UI
// honest about what it can show.

const BLANK = { title: '', price: '', description: '', notes: '', status: 'available', photos: [] };

export function Admin() {
  const [auth, setAuth] = useState(null); // null → still checking
  const [tab, setTab] = useState('items');

  const refreshAuth = useCallback(
    () =>
      api
        .me()
        .then(setAuth)
        .catch(() => setAuth({ authed: false })),
    []
  );

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  if (auth === null) {
    return (
      <PageShell>
        <p className="font-mono text-sm text-faint">Checking…</p>
      </PageShell>
    );
  }

  if (!auth.authed) return <SignIn onDone={refreshAuth} />;
  if (auth.mustChange) return <ForcePasswordChange onDone={refreshAuth} />;

  return (
    <PageShell>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-primary">Moveout admin</p>
          <h1 className="mt-2 font-mono text-2xl">Signed in as {auth.username}</h1>
        </div>
        <div className="flex gap-2">
          <a href="/moveout">
            <Btn variant="ghost">View public page</Btn>
          </a>
          <Btn
            variant="ghost"
            onClick={() =>
              api
                .logout()
                .then(refreshAuth)
                .catch(() => refreshAuth())
            }
          >
            Log out
          </Btn>
        </div>
      </header>

      <nav className="mt-6 flex gap-2">
        {['items', 'responses'].map((id) => (
          <Btn key={id} variant={tab === id ? 'primary' : 'outline'} onClick={() => setTab(id)}>
            {id === 'items' ? 'Items' : 'Responses'}
          </Btn>
        ))}
      </nav>

      <div className="mt-6">{tab === 'items' ? <ItemsTab /> : <ResponsesTab />}</div>
    </PageShell>
  );
}

// ── sign in ───────────────────────────────────────────────────────────────────

function SignIn({ onDone }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.login(username, password);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-[360px]">
        <h1 className="font-mono text-xl">Moveout admin</h1>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field label="Username">
            <input
              className={fieldCls}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <input
              className={fieldCls}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Notice>{error}</Notice>
          <Btn type="submit" variant="primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Btn>
        </form>
      </div>
    </PageShell>
  );
}

function ForcePasswordChange({ onDone }) {
  return (
    <PageShell>
      <div className="mx-auto max-w-[420px]">
        <h1 className="font-mono text-xl">Choose a new password</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You&apos;re signed in with the handoff password. Nothing else will open until it&apos;s
          replaced.
        </p>
        <div className="mt-6">
          <ChangePasswordForm currentKnown="password" onDone={onDone} />
        </div>
      </div>
    </PageShell>
  );
}

export function ChangePasswordForm({ currentKnown, onDone }) {
  const [current, setCurrent] = useState(currentKnown || '');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('The two new passwords don’t match.');
    setBusy(true);
    try {
      await api.changePassword(current, next);
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Current password">
        <input
          className={fieldCls}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </Field>
      <Field label="New password" hint="At least 10 characters.">
        <input
          className={fieldCls}
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
      </Field>
      <Field label="New password again">
        <input
          className={fieldCls}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </Field>
      <Notice>{error}</Notice>
      <Btn type="submit" variant="primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save password'}
      </Btn>
    </form>
  );
}

// ── items ─────────────────────────────────────────────────────────────────────

function ItemsTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(
    () =>
      api
        .adminItems()
        .then((d) => setItems(d.items))
        .catch((err) => setError(err.message)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    setError('');
    try {
      const d = await fn();
      if (d?.items) setItems(d.items);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[13px] text-muted-foreground">
          {items ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'Loading…'}
        </p>
        <Btn variant="primary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Add item'}
        </Btn>
      </div>

      <Notice>{error}</Notice>

      {adding ? (
        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <ItemForm
            initial={BLANK}
            submitLabel="Add item"
            onCancel={() => setAdding(false)}
            onSave={async (value) => {
              const d = await api.createItem(value);
              setItems(d.items);
              setAdding(false);
            }}
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4">
        {items?.map((item, i) => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4">
            {editing === item.id ? (
              <ItemForm
                initial={{ ...item, price: item.price ?? '' }}
                submitLabel="Save changes"
                onCancel={() => setEditing(null)}
                onSave={async (value) => {
                  const d = await api.updateItem(item.id, value);
                  setItems(d.items);
                  setEditing(null);
                }}
              />
            ) : (
              <div className="flex gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                  {item.photos?.[0] ? (
                    <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-mono text-[15px]">{item.title}</h3>
                    <span className="font-mono text-[13px] text-primary">
                      {price(item.price) || 'no price'}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[1px] text-faint">
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Btn onClick={() => setEditing(item.id)}>Edit</Btn>
                    {['available', 'pending', 'sold']
                      .filter((s) => s !== item.status)
                      .map((s) => (
                        <Btn
                          key={s}
                          onClick={() => run(() => api.updateItem(item.id, { status: s }))}
                        >
                          Mark {s}
                        </Btn>
                      ))}
                    <Btn
                      disabled={i === 0}
                      onClick={() => run(() => api.moveItem(item.id, 'up'))}
                      aria-label="Move up"
                    >
                      ↑
                    </Btn>
                    <Btn
                      disabled={i === items.length - 1}
                      onClick={() => run(() => api.moveItem(item.id, 'down'))}
                      aria-label="Move down"
                    >
                      ↓
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => {
                        if (confirm(`Delete "${item.title}"? Its photos go too.`)) {
                          run(() => api.deleteItem(item.id));
                        }
                      }}
                    >
                      Delete
                    </Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {items && items.length === 0 && !adding ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No items yet. Add the first one and it shows up at /moveout right away.
        </p>
      ) : null}
    </div>
  );
}

function ItemForm({ initial, submitLabel, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => setValue((v) => ({ ...v, [key]: e.target.value }));

  const addPhotos = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setError('');
    setUploading(true);
    // Uploads land one after another, so track the running list locally rather
    // than reading `value.photos`, which is a stale snapshot inside this loop.
    let photos = value.photos;
    try {
      for (const file of files) {
        if (photos.length >= 6) {
          setError('Six photos is the limit for one item.');
          break;
        }
        const dataUrl = await resizeToDataUrl(file);
        const { url } = await api.uploadPhoto(dataUrl);
        photos = [...photos, url];
        setValue((v) => ({ ...v, photos }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Title">
        <input className={fieldCls} value={value.title} onChange={set('title')} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asking price" hint="Leave blank for offers only.">
          <input
            className={fieldCls}
            type="number"
            min="0"
            max="100000"
            step="1"
            inputMode="decimal"
            value={value.price}
            onChange={set('price')}
          />
        </Field>
        <Field label="Status">
          <select className={fieldCls} value={value.status} onChange={set('status')}>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea className={fieldCls} rows={3} value={value.description} onChange={set('description')} />
      </Field>

      <Field label="Condition / dimensions" hint="e.g. IKEA Malm, small scratch on top, 63×22in">
        <input className={fieldCls} value={value.notes} onChange={set('notes')} />
      </Field>

      <div>
        <span className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted-foreground">
          Photos
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {value.photos.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setValue((v) => ({ ...v, photos: v.photos.filter((p) => p !== url) }))}
                className="absolute right-0 top-0 bg-black/70 px-1.5 font-mono text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border font-mono text-xs text-faint hover:border-white/30">
            {uploading ? '…' : '+ add'}
            <input type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-faint">
          Resized to 1600px in your browser before upload — camera location data is stripped.
        </p>
      </div>

      <Notice>{error}</Notice>
      <div className="flex gap-2">
        <Btn type="submit" variant="primary" disabled={busy || uploading}>
          {busy ? 'Saving…' : submitLabel}
        </Btn>
        <Btn type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Btn>
      </div>
    </form>
  );
}

// ── responses ─────────────────────────────────────────────────────────────────

function ResponsesTab() {
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .submissions()
      .then((d) => setSubmissions(d.submissions))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Notice>{error}</Notice>;
  if (!submissions) return <p className="font-mono text-sm text-faint">Loading…</p>;
  if (!submissions.length) {
    return <p className="text-sm text-muted-foreground">Nobody has responded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[15px]">{s.name || 'Someone'}</span>
            <span className="font-mono text-[13px] text-primary">
              {s.kind === 'offer' ? `offered ${price(s.amount)}` : `claimed at ${price(s.amount) || 'asking'}`}
            </span>
            <span className="text-sm text-muted-foreground">for {s.itemTitle}</span>
          </div>
          <p className="mt-2 font-mono text-[13px]">
            <a
              href={s.contactKind === 'email' ? `mailto:${s.contact}` : `tel:${s.contact}`}
              className="text-primary underline underline-offset-4"
            >
              {s.contact}
            </a>
          </p>
          {s.note ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{s.note}</p>
          ) : null}
          <p className="mt-2 font-mono text-[11px] text-faint">
            {new Date(s.at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
