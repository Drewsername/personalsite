import { useMemo } from 'react';
import { SwarmBackground } from './swarm/SwarmBackground.jsx';
import { content } from './site/content.js';
import { Nav } from './site/Nav.jsx';
import { Hero } from './site/Hero.jsx';
import { Pillars } from './site/Pillars.jsx';
import { Consulting } from './site/Consulting.jsx';
import { Work } from './site/Work.jsx';
import { About } from './site/About.jsx';
import { Contact } from './site/Contact.jsx';
import { Footer } from './site/Footer.jsx';
import { useActiveSection } from './site/useActiveSection.js';

// Each section's background word, anchored to that section's page position.
const WORDS = [
  { id: 'top', text: content.name },
  { id: 'slot-consulting', text: 'Consulting' },
  { id: 'slot-work', text: 'Work' },
  { id: 'slot-about', text: 'About' },
  { id: 'slot-contact', text: 'Contact' },
  { id: 'footer', text: content.name },
];
// Only the hero name gets the crisp outline; sections rely on their DOM heading.
const OUTLINE_WORDS = [{ id: 'top', text: content.name }];

export default function App() {
  const active = useActiveSection();

  // Respect reduced-motion (freeze drift/spin). The ball count is held
  // scale-invariant in the renderer (same count, smaller balls on narrow
  // screens) so the swarm looks the same on mobile.
  const config = useMemo(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return {
      density: 0.045,
      maxCount: 130000,
      speed: 11,
      ballRadius: [5, 12],
      omega: 1.0,
      beta: 1.2,
      base: 0.07,
      mono: 0.85,
      dim: 0.42,
      speedScale: reduce ? 0 : 0.5,
      omegaScale: reduce ? 0 : 0.5,
    };
  }, []);

  return (
    <>
      <SwarmBackground words={WORDS} outlineWords={OUTLINE_WORDS} blur={1} config={config} />
      <Nav active={active} />
      <main>
        <Hero />
        <Pillars />
        <Consulting />
        <Work />
        <About />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
