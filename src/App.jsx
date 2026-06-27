import { useMemo, useRef } from 'react';
import { SwarmBackground } from './swarm/SwarmBackground.jsx';
import { wordMaskPaint, wordOutlinePaint } from './swarm/paints.js';
import { content } from './site/content.js';
import { Nav } from './site/Nav.jsx';
import { Hero } from './site/Hero.jsx';
import { Pillars } from './site/Pillars.jsx';
import { Consulting } from './site/Consulting.jsx';
import { Work } from './site/Work.jsx';
import { About } from './site/About.jsx';
import { Contact } from './site/Contact.jsx';
import { Footer } from './site/Footer.jsx';
import { useSectionMorph } from './site/useSectionMorph.js';

export default function App() {
  const bgRef = useRef(null);
  const initial = useMemo(() => wordMaskPaint(content.name), []);
  const initialOutline = useMemo(() => wordOutlinePaint(content.name, { opacity: 0.5 }), []);
  const active = useSectionMorph(bgRef);

  // Respect reduced-motion (freeze drift/spin) and lighten the ball count on
  // small screens so phones stay smooth.
  const config = useMemo(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 760;
    return {
      density: 0.045,
      maxCount: small ? 45000 : 130000,
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
      <SwarmBackground ref={bgRef} initial={initial} initialOutline={initialOutline} blur={1} config={config} />
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
