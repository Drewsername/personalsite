// Shared section scaffolding + small typographic primitives.

// An empty band that reserves open space for a section's background swarm word,
// so the word sits clear of the content below it (the swarm anchors to this id).
export function WordSlot({ id }) {
  return <div id={id} aria-hidden="true" className="pointer-events-none h-[clamp(200px,32vh,380px)]" />;
}

export function Label({ children }) {
  return <div className="font-mono text-xs uppercase tracking-[2px] text-primary">{children}</div>;
}

export function Heading({ children }) {
  return (
    <h2 className="mt-3 font-mono text-[clamp(28px,5vw,44px)] font-medium tracking-[-0.5px]">{children}</h2>
  );
}

export function Section({ id, children, className = '', style }) {
  return (
    <section
      id={id}
      className={`relative z-[1] mx-auto max-w-[var(--maxw)] px-[var(--pad)] py-[clamp(72px,13vh,150px)] ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}
