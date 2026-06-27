import { content } from './content.js';
import { Section } from './Section.jsx';

export function Pillars() {
  return (
    <Section id="pillars" style={{ paddingTop: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {content.pillars.map((p, i) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '26px 28px',
            }}
          >
            <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', letterSpacing: '1px' }}>0{i + 1}</div>
            <div style={{ fontSize: 21, fontWeight: 500, marginTop: 12 }}>{p.title}</div>
            <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: 15 }}>{p.blurb}</div>
            <div className="mono" style={{ marginTop: 16, fontSize: 13, color: 'var(--accent)' }}>Explore →</div>
          </a>
        ))}
      </div>
    </Section>
  );
}
