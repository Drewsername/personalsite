import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { eyebrowCls, fieldCls, price } from './format.js';
import { Btn, Field, Notice, PageShell, StatusPill } from './ui.jsx';

// The public listing. Anyone with the link can browse and respond; nothing here
// requires an account, and nothing here reveals who else has responded.

const RESPONDED_KEY = 'moveout:responded';

function loadResponded() {
  try {
    return new Set(JSON.parse(localStorage.getItem(RESPONDED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function rememberResponded(id) {
  try {
    const all = loadResponded();
    all.add(id);
    localStorage.setItem(RESPONDED_KEY, JSON.stringify([...all]));
  } catch {
    // Private browsing, storage disabled — the reminder is a nicety, not a gate.
  }
}

export function PublicListing() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [responded, setResponded] = useState(loadResponded);

  useEffect(() => {
    api
      .items()
      .then((d) => setItems(d.items))
      .catch((err) => setError(err.message));
  }, []);

  // Sold items sink to the bottom; everything else keeps the order Drew set.
  const ordered = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => (a.status === 'sold' ? 1 : 0) - (b.status === 'sold' ? 1 : 0));
  }, [items]);

  const open = ordered.find((i) => i.id === openId) || null;

  return (
    <PageShell>
      <header className="border-b border-border pb-10">
        <p className={eyebrowCls}>Moving out</p>
        <h1 className="mt-4 text-[clamp(30px,6vw,44px)] font-semibold tracking-[-0.025em] text-foreground">
          Everything must go
        </h1>
        <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground">
          I&apos;m clearing out the apartment. Claim something at the asking price or make me an
          offer — whichever you like. Leave an email address or a phone number and I&apos;ll get back
          to you to sort out pickup. Only I see your contact details.
        </p>
      </header>

      {error ? <p className="mt-10 text-sm text-destructive">{error}</p> : null}
      {items === null && !error ? <p className="mt-10 text-sm text-faint">Loading…</p> : null}
      {items && ordered.length === 0 ? (
        <p className="mt-10 text-[15px] text-muted-foreground">
          Nothing listed right now. Check back in a day or two.
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {ordered.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            responded={responded.has(item.id)}
            onOpen={() => setOpenId(item.id)}
          />
        ))}
      </div>

      {open ? (
        <ItemDetail
          item={open}
          responded={responded.has(open.id)}
          onClose={() => setOpenId(null)}
          onResponded={() => {
            rememberResponded(open.id);
            setResponded(loadResponded());
          }}
        />
      ) : null}
    </PageShell>
  );
}

function ItemCard({ item, responded, onOpen }) {
  const sold = item.status === 'sold';
  const asking = price(item.price);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-foreground/20 ${sold ? 'opacity-60' : ''}`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
        {item.photos?.[0] ? (
          <img
            src={item.photos[0]}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-faint">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-medium leading-snug text-foreground">{item.title}</h2>
          <StatusPill status={item.status} />
        </div>
        <p className="text-[15px] font-medium text-foreground">{asking || 'Make an offer'}</p>
        {item.description ? (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        ) : null}
        {responded ? (
          <p className="mt-auto pt-1 text-xs text-faint">You&apos;ve responded to this</p>
        ) : null}
      </div>
    </button>
  );
}

function ItemDetail({ item, responded, onClose, onResponded }) {
  const [photo, setPhoto] = useState(0);

  // Close on Escape, and keep the page behind from scrolling under the sheet.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const asking = price(item.price);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-foreground/25 p-0 backdrop-blur-[2px] sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-auto w-full max-w-[560px] border-border bg-popover shadow-xl sm:rounded-xl sm:border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className={eyebrowCls}>Item</p>
          <Btn variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Btn>
        </div>

        {item.photos?.length ? (
          <div>
            <img
              src={item.photos[photo]}
              alt={item.title}
              className="max-h-[60vh] w-full bg-surface object-contain"
            />
            {item.photos.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-3">
                {item.photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setPhoto(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border transition ${i === photo ? 'border-foreground' : 'border-border hover:border-foreground/30'}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold leading-snug tracking-[-0.015em] text-foreground">
              {item.title}
            </h2>
            <StatusPill status={item.status} />
          </div>
          <p className="mt-2 text-lg font-medium text-foreground">{asking || 'Make an offer'}</p>
          {item.description ? (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          {item.notes ? <p className="mt-3 text-sm leading-relaxed text-faint">{item.notes}</p> : null}
          {item.status === 'pending' ? (
            <p className="mt-5 rounded-md border border-amber-500/25 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Someone&apos;s in line for this one — but deals fall through. Offer anyway and
              you&apos;re next up.
            </p>
          ) : null}

          <div className="mt-8 border-t border-border pt-6">
            {item.status === 'sold' ? (
              <p className="text-sm text-muted-foreground">This one&apos;s gone. Sorry!</p>
            ) : (
              <ResponseForm item={item} responded={responded} onDone={onResponded} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResponseForm({ item, responded, onDone }) {
  const [kind, setKind] = useState(null); // null → not chosen yet
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const asking = price(item.price);

  if (sent) {
    return (
      <div>
        <p className="text-[15px] font-medium text-foreground">Got it — thanks!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          I&apos;ll be in touch at {contact} to sort out pickup.
        </p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.submit({
        itemId: item.id,
        kind,
        amount: kind === 'offer' ? amount : undefined,
        name,
        contact,
        note,
        website,
      });
      setSent(true);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!kind) {
    return (
      <div>
        {responded ? (
          <p className="mb-3 text-xs text-faint">
            You&apos;ve already responded to this one — sending another is fine.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {asking ? (
            <Btn variant="primary" onClick={() => setKind('claim')}>
              Claim it — {asking}
            </Btn>
          ) : null}
          <Btn variant={asking ? 'outline' : 'primary'} onClick={() => setKind('offer')}>
            {asking ? 'Make a different offer' : 'Make an offer'}
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {kind === 'claim' ? `Claiming at ${asking}` : 'Making an offer'}{' '}
        <button
          type="button"
          onClick={() => setKind(null)}
          className="ml-1 underline underline-offset-4 hover:text-foreground"
        >
          change
        </button>
      </p>

      {kind === 'offer' ? (
        <Field label="Your offer">
          <input
            type="number"
            required
            min="0"
            max="100000"
            step="1"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={asking ? asking.replace('$', '') : '0'}
            className={fieldCls}
          />
        </Field>
      ) : null}

      <Field label="Your name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="optional"
          autoComplete="name"
          className={fieldCls}
        />
      </Field>

      <Field label="Email or phone" hint="Only I see this. It isn't shown anywhere on the page.">
        <input
          type="text"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com or 555-123-4567"
          className={fieldCls}
        />
      </Field>

      <Field label="Note">
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="When you could pick it up, questions, anything else"
          className={fieldCls}
        />
      </Field>

      {/* Honeypot: hidden from people, catnip to naive bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <Notice>{error}</Notice>
      <Btn type="submit" variant="primary" disabled={busy}>
        {busy ? 'Sending…' : 'Send'}
      </Btn>
    </form>
  );
}
