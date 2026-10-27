import { content } from './content.js';
import { HomeAbout } from './HomeAbout.jsx';

export function HeroPanel({ onNavigate }) {
  return (
    <div className="mx-auto max-w-[740px]">
    <nav aria-label="Explore" className="mx-auto flex w-fit flex-wrap justify-center gap-x-8 gap-y-4 border-y border-border py-5 sm:gap-x-12 sm:px-8">
      {content.cards.map((c) => (
        <a key={c.id} href={`#${c.id}`}
          onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(c.id); } }}
          className="group inline-flex items-center gap-3 text-base transition-colors hover:text-muted-foreground">
          {c.label}<span aria-hidden="true" className="text-sm text-faint transition-transform group-hover:translate-x-1">→</span>
        </a>
      ))}
    </nav>
    <HomeAbout />
    </div>
  );
}
