import { content } from './content.js';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// The name itself is spelled by the swarm behind this panel. The foreground is the
// tagline plus a 2×2 grid of cards that jump into each section of the deck.
export function HeroPanel({ onNavigate }) {
  const jump = (id) => (e) => {
    if (!onNavigate) return; // flow fallback → let the anchor scroll natively
    e.preventDefault();
    onNavigate(id);
  };
  return (
    // Pull up under the swarm name so the tagline reads as its subtitle.
    <div className="-mt-6 flex flex-col items-center text-center">
      <p className="font-mono text-[clamp(15px,2.6vw,22px)] tracking-[2px] text-muted-foreground">
        {content.tagline}
      </p>
      <div className="mt-7 grid w-full max-w-[560px] grid-cols-2 gap-3 sm:gap-4">
        {content.cards.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            onClick={jump(c.id)}
            className="group block text-left transition-transform hover:-translate-y-0.5"
          >
            <Card className="h-full gap-2 py-5 transition-colors group-hover:bg-secondary group-hover:ring-foreground/20">
              <CardHeader className="gap-1.5">
                <div className="font-mono text-[11px] tracking-[1px] text-primary">0{i + 1}</div>
                <CardTitle className="text-[clamp(15px,3.4vw,19px)] font-medium leading-tight">
                  {c.label}
                </CardTitle>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
