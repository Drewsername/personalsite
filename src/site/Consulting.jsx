import { content } from './content.js';
import { Section, Label, Heading, WordSlot } from './Section.jsx';
import { ui } from './styles.js';

export function Consulting() {
  const c = content.consulting;
  return (
    <Section id="consulting">
      <WordSlot id="slot-consulting" />
      <Label>Consulting</Label>
      <Heading>What I do</Heading>
      <p style={ui.lead}>{c.intro}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 32 }}>
        {c.services.map((s, i) => (
          <div key={i} style={ui.card}>
            <div style={{ fontSize: 17, fontWeight: 500 }}>{s.title}</div>
            <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: 15 }}>{s.body}</div>
          </div>
        ))}
      </div>
      <a href={c.cta.href} style={ui.cta}>
        {c.cta.label} →
      </a>
    </Section>
  );
}
