import { useCallback, useEffect, useState } from 'react';
import { Label } from './Section.jsx';
import { Button } from '@/components/ui/button';

const inputCls =
  'h-9 w-full min-w-0 rounded-full border border-input bg-white/[0.04] px-4 font-mono text-[13px] text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

const btnCls = 'h-9 rounded-full font-mono text-[13px]';

// The Login panel. There is exactly one account — the owner's — and signing in
// here is what opens the moveout console. The panel has three states: the form,
// a forced password change while the handoff password is still in place, and
// the signed-in state.
//
// The auth endpoints live in server/auth.mjs; this panel deliberately keeps its
// own small fetch calls rather than importing the moveout API module, so the
// deck bundle stays free of the moveout page.

async function authFetch(url, body) {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload;
}

export function LoginSection() {
  const [state, setState] = useState(null); // null → still checking

  const refresh = useCallback(
    () =>
      authFetch('/api/auth/me')
        .then(setState)
        .catch(() => setState({ authed: false })),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="max-w-[360px]">
      <Label>Account</Label>
      {state === null ? (
        <p className="mt-5 font-mono text-xs text-faint">Checking…</p>
      ) : !state.authed ? (
        <SignInForm onDone={refresh} />
      ) : state.mustChange ? (
        <ChangePassword onDone={refresh} />
      ) : (
        <SignedIn username={state.username} onDone={refresh} />
      )}
    </div>
  );
}

function SignInForm({ onDone }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authFetch('/api/auth/login', { username, password });
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-2.5">
      <input
        type="text"
        required
        autoComplete="username"
        placeholder="username"
        aria-label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={inputCls}
      />
      <input
        type="password"
        required
        autoComplete="current-password"
        placeholder="password"
        aria-label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls}
      />
      {error ? <p className="font-mono text-xs text-destructive">{error}</p> : null}
      <Button type="submit" variant="outline" className={btnCls} disabled={busy}>
        {busy ? 'Signing in…' : 'Log in'}
      </Button>
    </form>
  );
}

function ChangePassword({ onDone }) {
  const [current, setCurrent] = useState('');
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
      await authFetch('/api/auth/password', { current, next });
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        You&apos;re signed in with the handoff password. Pick a real one — nothing else opens until
        you do.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2.5">
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="current password"
          aria-label="Current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="new password (10+ characters)"
          aria-label="New password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputCls}
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="new password again"
          aria-label="New password again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
        {error ? <p className="font-mono text-xs text-destructive">{error}</p> : null}
        <Button type="submit" variant="outline" className={btnCls} disabled={busy}>
          {busy ? 'Saving…' : 'Set password'}
        </Button>
      </form>
    </div>
  );
}

function SignedIn({ username, onDone }) {
  return (
    <div className="mt-5">
      <p className="font-mono text-[13px] text-muted-foreground">
        Signed in as <span className="text-foreground">{username}</span>.
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <a href="/moveout/admin">
          <Button variant="outline" className={btnCls}>
            Moveout console
          </Button>
        </a>
        <Button
          variant="ghost"
          className={btnCls}
          onClick={() => authFetch('/api/auth/logout', {}).finally(onDone)}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
