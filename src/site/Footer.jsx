import { content } from './content.js';

// The name re-forms in the swarm behind this section; the footer itself is a
// quiet sign-off.
export function Footer() {
  return (
    <footer id="footer" className="relative z-[1] px-[var(--pad)] pt-[clamp(80px,18vh,180px)] pb-14 text-center">
      <div className="h-[20vh]" />
      <div className="font-mono text-xs text-faint">© 2026 {content.name}</div>
    </footer>
  );
}
