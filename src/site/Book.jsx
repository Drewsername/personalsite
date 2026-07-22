import { useState } from 'react';
import { content } from './content.js';
import { Label, Heading } from './Section.jsx';
import { Button } from '@/components/ui/button';

// The Ripples: teaser synopsis + a notify-me email form. The form posts to the
// production server's /api/notify (see server.mjs); under `vite dev` there is no
// API, so failures fall back to a mailto link rather than a dead end.
export function BookSection() {
  const b = content.book;
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, list: 'book' }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="max-w-[640px]">
      <Label>{content.sections.book.label}</Label>
      <Heading>{content.sections.book.heading}</Heading>
      <p className="mt-2 font-mono text-xs tracking-[1px] text-faint">{b.status}</p>
      <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{b.synopsis}</p>

      {state === 'done' ? (
        <p className="mt-7 font-mono text-sm text-primary">{b.thanks}</p>
      ) : (
        <form onSubmit={submit} className="mt-7">
          <label htmlFor="book-email" className="font-mono text-xs tracking-[1px] text-faint">
            {b.formLabel}
          </label>
          <div className="mt-2.5 flex max-w-[420px] gap-2.5">
            <input
              id="book-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={b.placeholder}
              className="h-9 w-full min-w-0 rounded-full border border-input bg-white/[0.04] px-4 font-mono text-[13px] text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={state === 'sending'}
              className="h-9 shrink-0 rounded-full px-4 font-mono text-[13px]"
            >
              {state === 'sending' ? '…' : b.cta}
            </Button>
          </div>
          {state === 'error' ? (
            <p className="mt-3 font-mono text-xs text-destructive">
              Couldn’t sign you up — email{' '}
              <a className="underline" href={`mailto:drewtbermudez@gmail.com?subject=${encodeURIComponent('Keep me posted — The Ripples')}`}>
                drewtbermudez@gmail.com
              </a>{' '}
              instead.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
