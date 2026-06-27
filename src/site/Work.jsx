import { content } from './content.js';
import { Section, Label, Heading, WordSlot } from './Section.jsx';

export function Work() {
  return (
    <Section id="work">
      <WordSlot id="slot-work" />
      <Label>Work</Label>
      <Heading>Selected work</Heading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 32 }}>
        {content.work.map((w, i) => (
          <a
            key={i}
            href={w.href}
            style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}
          >
            <div style={{ aspectRatio: '16 / 10', background: 'var(--surface-2)' }} />
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{w.title}</div>
              <div style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>{w.blurb}</div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
