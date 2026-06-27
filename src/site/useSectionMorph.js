import { useEffect, useState } from 'react';
import { wordMaskPaint } from '../swarm/paints.js';
import { content } from './content.js';

// Which swarm formation each section morphs to. Name sections keep the brand;
// Consulting/Work/Contact form their word.
const FORMATION = {
  top: content.name,
  pillars: content.name,
  consulting: 'Consulting',
  work: 'Work',
  about: content.name,
  contact: 'Contact',
  footer: content.name,
};
const NAV_IDS = new Set(content.nav.map((n) => n.id));

// Drives the background's morph + outline fade from the section nearest the
// viewport centre, and returns the active nav id for highlighting.
export function useSectionMorph(bgRef) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const ids = Object.keys(FORMATION);
    const masks = {};
    const maskFor = (id) => masks[id] || (masks[id] = wordMaskPaint(FORMATION[id]));
    let current = 'top';

    function pick() {
      const cy = window.innerHeight / 2;
      let bestId = 'top';
      let bestDist = Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - cy);
        if (d < bestDist) {
          bestDist = d;
          bestId = id;
        }
      }
      if (bestId !== current) {
        current = bestId;
        bgRef.current?.setOutlineOpacity(bestId === 'top' ? 1 : 0);
        bgRef.current?.morphTo(maskFor(bestId));
        setActive(NAV_IDS.has(bestId) ? bestId : null);
      }
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
  }, [bgRef]);

  return active;
}
