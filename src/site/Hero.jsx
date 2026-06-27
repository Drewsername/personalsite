import { content } from './content.js';

// The name itself is rendered by the swarm background (centered in the viewport)
// with its crisp outline overlay. This section supplies the tagline + scroll cue.
export function Hero() {
  return (
    <section id="top" style={{ position: 'relative', zIndex: 1, height: '100vh', minHeight: 560 }}>
      <p
        className="mono"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '60%',
          textAlign: 'center',
          margin: 0,
          padding: '0 var(--pad)',
          fontSize: 'clamp(12px, 1.7vw, 15px)',
          letterSpacing: '2px',
          color: 'var(--muted)',
        }}
      >
        {content.tagline}
      </p>
      <a
        href="#consulting"
        className="mono"
        style={{ position: 'absolute', left: 0, right: 0, bottom: '6%', textAlign: 'center', fontSize: 12, color: 'var(--faint)' }}
      >
        scroll ↓
      </a>
    </section>
  );
}
