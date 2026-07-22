import { useState } from 'react';
import { Label } from './Section.jsx';
import { Button } from '@/components/ui/button';

const inputCls =
  'h-9 w-full min-w-0 rounded-full border border-input bg-white/[0.04] px-4 font-mono text-[13px] text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

// The Login panel — the swarm spells "Login" above; this is just the form.
// Intentionally non-functional for now: nothing is sent anywhere — every
// submit "fails" with a generic invalid-credentials message.
export function LoginSection() {
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError(true);
  };

  return (
    <div className="max-w-[360px]">
      <Label>Account</Label>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-2.5">
        <input
          type="text"
          required
          autoComplete="username"
          placeholder="username"
          aria-label="Username"
          className={inputCls}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="password"
          aria-label="Password"
          className={inputCls}
        />
        {error ? (
          <p className="font-mono text-xs text-destructive">Invalid username or password.</p>
        ) : null}
        <Button type="submit" variant="outline" className="h-9 rounded-full font-mono text-[13px]">
          Log in
        </Button>
      </form>
    </div>
  );
}
