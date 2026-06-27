// Shared section scaffolding + small typographic primitives.

export function Label({ children }) {
  return (
    <div className="mono" style={{ fontSize: 12, letterSpacing: '2px', color: 'var(--accent)', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

export function Heading({ children }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        fontSize: 'clamp(28px, 5vw, 44px)',
        letterSpacing: '-0.5px',
        margin: '12px 0 0',
      }}
    >
      {children}
    </h2>
  );
}

export function Section({ id, children, style }) {
  return (
    <section
      id={id}
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 'var(--maxw)',
        margin: '0 auto',
        padding: 'clamp(72px, 13vh, 150px) var(--pad)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
