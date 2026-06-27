import { content } from './content.js';
import { Section, Label, Heading } from './Section.jsx';
import { ui } from './styles.js';

export function Contact() {
  const c = content.contact;
  return (
    <Section id="contact">
      <Label>Contact</Label>
      <Heading>Let&apos;s talk</Heading>
      <p style={ui.lead}>Whether it&apos;s a legal question or a project, I&apos;d love to hear from you.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 30, alignItems: 'center' }}>
        <a href={`mailto:${c.email}`} style={ui.cta}>
          {c.email} →
        </a>
        {c.calendar ? (
          <a href={c.calendar} className="mono" style={{ fontSize: 14, color: 'var(--muted)' }}>
            Book a time →
          </a>
        ) : null}
        {c.socials.map((s) => (
          <a key={s.label} href={s.href} className="mono" style={{ fontSize: 14, color: 'var(--muted)' }}>
            {s.label} →
          </a>
        ))}
      </div>
    </Section>
  );
}
