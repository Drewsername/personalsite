import { useState } from 'react';
import { content } from './content.js';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo.jsx';
import { LoginModal } from './Login.jsx';

export function Nav({ active, onNavigate }) {
  const [loginOpen, setLoginOpen] = useState(false);
  // In deck mode the nav drives the scroll-jack controller; in the flow fallback
  // `onNavigate` is absent and the links behave as ordinary anchors.
  const jump = (id) => (e) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(id);
  };
  return (
    <nav className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-white/[0.04] px-[var(--pad)] py-3.5 backdrop-blur-xs backdrop-saturate-[1.3]">
      <a
        href="#top"
        onClick={jump('top')}
        className="flex items-center gap-2.5 font-mono text-[15px] font-medium tracking-[0.4px]"
      >
        <Logo className="h-10 w-auto text-muted-foreground sm:h-[52px]" />
        {content.name}
      </a>
      <div className="flex items-center gap-[clamp(14px,2.4vw,28px)]">
        <div className="nav-links flex gap-[clamp(14px,2.4vw,28px)]">
          {content.nav.map((n) => (
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
        <Button
          variant="outline"
          onClick={() => setLoginOpen(true)}
          className="h-auto cursor-pointer rounded-full px-4 py-1.5 font-mono text-[13px]"
        >
          {content.cta.label}
        </Button>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </nav>
  );
}
