import { content } from './content.js';

export function Nav({ active }) {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px var(--pad)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'linear-gradient(to bottom, rgba(6,7,11,0.72), rgba(6,7,11,0))',
      }}
    >
      <a href="#top" className="mono" style={{ fontWeight: 500, letterSpacing: '0.4px', fontSize: 15 }}>
        {content.name}
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2.4vw, 28px)' }}>
        <div className="nav-links" style={{ display: 'flex', gap: 'clamp(14px, 2.4vw, 28px)' }}>
          {content.nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="mono"
              style={{ fontSize: 13, color: active === n.id ? 'var(--accent)' : 'var(--muted)', transition: 'color 0.2s' }}
            >
              {n.label}
            </a>
          ))}
        </div>
        <a
          href={content.consulting.cta.href}
          className="mono"
          style={{
            fontSize: 13,
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: 999,
            padding: '7px 15px',
            whiteSpace: 'nowrap',
          }}
        >
          Book a consult
        </a>
      </div>
    </nav>
  );
}
