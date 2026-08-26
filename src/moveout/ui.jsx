import { eyebrowCls, statusLabel } from './format.js';

// Plain form and layout primitives for the moveout pages.
//
// The rest of the site is a dark WebGL scroll deck; this page is deliberately
// none of that. It is a light, quiet document — ink on white, one accent-free
// palette, generous whitespace — that loads fast on a neighbour's phone and is
// obvious to someone who has never seen the site before. Weight and spacing
// carry the hierarchy; there is no brand colour doing it for them.

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className={eyebrowCls}>{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-faint">{hint}</p> : null}
    </label>
  );
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40';

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:opacity-85',
  outline: 'border border-input bg-background text-foreground hover:bg-secondary',
  ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  danger: 'border border-destructive/30 text-destructive hover:bg-destructive/[0.06]',
};

export function Btn({ variant = 'outline', className = '', ...props }) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

const statusStyles = {
  available: 'border-emerald-600/25 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-500/30 bg-amber-50 text-amber-700',
  sold: 'border-border bg-secondary text-muted-foreground',
};

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] whitespace-nowrap ${statusStyles[status] || statusStyles.available}`}
    >
      {statusLabel[status] || status}
    </span>
  );
}

export function Notice({ tone = 'error', children }) {
  if (!children) return null;
  const cls = tone === 'error' ? 'text-destructive' : 'text-muted-foreground';
  return <p className={`text-sm ${cls}`}>{children}</p>;
}

export function PageShell({ children }) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[880px] px-5 py-12 sm:px-8 sm:py-20">{children}</div>
    </div>
  );
}
