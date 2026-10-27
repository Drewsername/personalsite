import { content } from './content.js';
import { Button } from '@/components/ui/button';

export function Nav({ active, onNavigate }) {
  // In deck mode the nav drives the scroll-jack controller; in the flow fallback
  // `onNavigate` is absent and the links behave as ordinary anchors.
  const jump = (id) => (e) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(id);
  };
  return (
    <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-[var(--pad)] py-3.5 backdrop-blur-xs backdrop-saturate-[1.3]">
      <a
        href="#top"
        onClick={jump('top')}
        className="flex items-center gap-2.5 font-mono text-[13px] sm:text-[15px] font-medium tracking-[0.4px]"
      >
        {content.name}
      </a>
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="nav-links flex gap-[clamp(14px,2.4vw,28px)]">
          {content.nav.filter((n) => n.id !== 'contact').map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={jump(n.id)}
              className={`font-mono text-[13px] transition-colors ${
                active === n.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {n.label}
            </a>
          ))}
        </div>
        <a href="#contact" onClick={jump('contact')} className={`font-mono text-[12px] sm:text-[13px] ${active === 'contact' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Contact</a>
        {/* The CTA is a deck panel like everything else — the swarm morphs to
            spell "Login" and the panel holds the form. */}
        <Button asChild variant="outline" className="h-auto cursor-pointer rounded-none px-3 py-1.5 font-mono text-[12px] sm:px-4 sm:text-[13px]">
          <a href="#login" onClick={jump('login')}>{content.cta.label}</a>
        </Button>
      </div>
    </nav>
  );
}
