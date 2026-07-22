import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const inputCls =
  'h-9 w-full min-w-0 rounded-full border border-input bg-white/[0.04] px-4 font-mono text-[13px] text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

// Login modal. Intentionally non-functional for now: nothing is sent anywhere —
// every submit "fails" with a generic invalid-credentials message.
export function LoginModal({ open, onClose }) {
  const [error, setError] = useState(false);
  const firstField = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError(false);
    firstField.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    setError(true);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-background/70 px-[var(--pad)] backdrop-blur-[6px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log in"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-2xl border border-white/[0.1] bg-popover p-6 shadow-2xl"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-lg font-medium tracking-[-0.3px]">Log in</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer font-mono text-sm text-faint transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <input
            ref={firstField}
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
    </div>
  );
}
