import { statusLabel } from './format.js';

// Plain form and layout primitives for the moveout pages.
//
// The rest of the site is a WebGL scroll deck; this page is deliberately none
// of that. It has to load fast on a neighbour's phone and be obvious to someone
// who has never seen the site before, so it is a normal scrolling page built
// from normal controls — just wearing the site's dark palette.

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1 text-xs leading-snug text-faint">{hint}</p> : null}
    </label>
  );
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-mono text-[13px] transition disabled:cursor-not-allowed disabled:opacity-50';

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:brightness-110',
  outline: 'border border-border bg-white/[0.03] text-foreground hover:bg-white/[0.07]',
  ghost: 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
  danger: 'border border-destructive/50 text-destructive hover:bg-destructive/10',
};

export function Btn({ variant = 'outline', className = '', ...props }) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

const statusStyles = {
  available: 'border-primary/40 text-primary',
  pending: 'border-amber-400/50 text-amber-300',
  sold: 'border-white/15 text-faint',
};

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[1px] ${statusStyles[status] || statusStyles.available}`}
    >
      {statusLabel[status] || status}
    </span>
  );
}

export function Notice({ tone = 'error', children }) {
  if (!children) return null;
  const cls = tone === 'error' ? 'text-destructive' : 'text-primary';
  return <p className={`font-mono text-xs ${cls}`}>{children}</p>;
}

export function PageShell({ children }) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8 sm:py-14">{children}</div>
    </div>
  );
}
