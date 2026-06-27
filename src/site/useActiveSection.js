import { useEffect, useState } from 'react';
import { content } from './content.js';

const NAV_IDS = content.nav.map((n) => n.id);

// Standard scroll-spy: the active nav id is the last section whose top has
// passed the 40%-down reference line. Returns null over the hero.
export function useActiveSection() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    function pick() {
      const refY = window.innerHeight * 0.4;
      let current = null;
      for (const id of NAV_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= refY) current = id;
      }
      setActive((prev) => (prev !== current ? current : prev));
    }
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        pick();
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const t = setTimeout(pick, 120);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  }, []);

  return active;
}
