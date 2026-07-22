import { useState } from 'react';
import { content } from './content.js';
import { Label, Heading } from './Section.jsx';
import { Button } from '@/components/ui/button';

const inputCls =
  'h-9 w-full min-w-0 rounded-full border border-input bg-white/[0.04] px-4 font-mono text-[13px] text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

// Contact: a LinkedIn link plus a message form. The form relays through
// /api/contact on the production server, which knows the destination address —
// nothing about it is exposed client-side.
export function ContactSection() {
  const c = content.contact;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState('idle'); // idle | sending | done | error

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="max-w-[640px]">
      <Label>{content.sections.contact.label}</Label>
      <Heading>{content.sections.contact.heading}</Heading>

      <div className="mt-5 flex items-center gap-3">
        <a
          href={c.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="Drew Bermudez on LinkedIn"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-input bg-white/[0.04] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          {/* Inline LinkedIn glyph — lucide-react no longer ships brand icons. */}
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
          </svg>
        </a>
        <p className="text-sm text-muted-foreground">{c.blurb}</p>
      </div>

      {state === 'done' ? (
        <p className="mt-6 font-mono text-sm text-primary">{c.thanks}</p>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-2.5">
          <div className="flex max-w-[560px] flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Your name"
              aria-label="Your name"
              className={inputCls}
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="you@email.com"
              aria-label="Your email"
              className={inputCls}
            />
          </div>
          <textarea
            required
            value={form.message}
            onChange={set('message')}
            placeholder="Your message"
            aria-label="Your message"
            rows={4}
            className="max-w-[560px] resize-none rounded-2xl border border-input bg-white/[0.04] px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          />
          <div>
            <Button
              type="submit"
              variant="outline"
              disabled={state === 'sending'}
              className="h-9 rounded-full px-5 font-mono text-[13px]"
            >
              {state === 'sending' ? 'Sending…' : 'Send message'}
            </Button>
          </div>
          {state === 'error' ? (
            <p className="font-mono text-xs text-destructive">
              Couldn’t send right now — try LinkedIn instead.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
