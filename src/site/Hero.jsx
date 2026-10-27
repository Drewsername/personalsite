import { content } from './content.js';

export function ExploreLinks() {
  return (
    <nav aria-label="Explore" className="mx-auto flex w-fit justify-center gap-10 py-3">
      {content.cards.map((c) => (
        <a key={c.id} href={`#${c.id}`} className="group inline-flex items-center gap-3 text-base transition-colors hover:text-muted-foreground">
          {c.label}<span aria-hidden="true" className="text-sm text-faint">→</span>
        </a>
      ))}
    </nav>
  );
}
