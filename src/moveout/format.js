// Non-component values shared by the moveout pages. They live apart from
// ui.jsx so that file exports components and nothing else (which is what keeps
// fast refresh working).

export const fieldCls =
  'w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-[15px] text-foreground transition placeholder:text-faint focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/15';

// The small uppercase labels that carry structure on this page. Letter-spacing
// does the work the deck's monospace used to.
export const eyebrowCls =
  'text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

export const statusLabel = {
  available: 'Available',
  pending: 'Pending',
  sold: 'Sold',
};

// Prices are whole dollars far more often than not, so a trailing ".00" is
// noise. Items with no price at all read as "Make an offer" at the call site.
export function price(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `$${n.toFixed(2).replace(/\.00$/, '')}`;
}
