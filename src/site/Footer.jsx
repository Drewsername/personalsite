import { content } from './content.js';

// The name re-forms in the swarm behind this section; the footer itself is a
// quiet sign-off.
export function Footer() {
  return (
    <footer
      id="footer"
      style={{ position: 'relative', zIndex: 1, padding: 'clamp(80px, 18vh, 180px) var(--pad) 56px', textAlign: 'center' }}
    >
      <div style={{ height: '20vh' }} />
      <div className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>
        © 2026 {content.name}
      </div>
    </footer>
  );
}
