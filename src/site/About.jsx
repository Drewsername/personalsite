import { content } from './content.js';
import { Section, Label, Heading, WordSlot } from './Section.jsx';
import { ui } from './styles.js';

export function About() {
  return (
    <Section id="about">
      <WordSlot id="slot-about" />
      <Label>About</Label>
      <Heading>{content.name}</Heading>
      <p style={ui.lead}>{content.about.body}</p>
    </Section>
  );
}
