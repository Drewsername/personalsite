import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SwarmBackground } from './swarm/SwarmBackground.jsx';
import { content } from './site/content.js';
import { Nav } from './site/Nav.jsx';
import { HeroPanel } from './site/Hero.jsx';
import { UnderConstruction } from './site/Stub.jsx';
import { useScrollDeck } from './site/useScrollDeck.js';
import { CONTENT_TOP } from './site/deckLayout.js';

// One panel per word. The swarm spells `word`; the foreground is the home cards
// (top) or a section header (everything else).
const PANELS = [
  { id: 'top', word: content.name },
  { id: 'projects', word: content.sections.projects.word },
  { id: 'advisory', word: content.sections.advisory.word },
  { id: 'opinions', word: content.sections.opinions.word },
  { id: 'contact', word: content.sections.contact.word },
];
const WORDS = PANELS.map((p) => p.word);
const indexOfId = (id) => PANELS.findIndex((p) => p.id === id);

function hasWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

// The dark loader overlay (a centered loading line, painted from index.html before
// the bundle even runs) covers the page until both the webfonts are ready and the
// swarm has painted its first frame — then it fades out, revealing a page that's
// already fully styled and lit. No white flash, no font swap, no pop-in. Returns
// the swarm's first-frame callback. A hard cap fades the loader regardless, so a
// stalled font load or a failed WebGL init can never leave it stuck.
function useRevealOnReady() {
  const swarmPaintedRef = useRef(false);
  const recheckRef = useRef(null);

  useEffect(() => {
    let fontsReady = false;
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      const loader = document.getElementById('loader');
      if (!loader) return;
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    };
    const maybe = () => {
      if (fontsReady && swarmPaintedRef.current) reveal();
    };
    recheckRef.current = maybe;

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      fontsReady = true;
      maybe();
    });
    const cap = setTimeout(reveal, 1200);

    return () => {
      clearTimeout(cap);
      recheckRef.current = null;
    };
  }, []);

  return useCallback(() => {
    swarmPaintedRef.current = true;
    recheckRef.current?.();
  }, []);
}

export default function App() {
  const swarmRef = useRef(null);

  // Scroll-jacking is the headline interaction, but it hijacks native scroll —
  // so fall back to a normal scrolling page when motion is reduced or WebGL2
  // (the swarm itself) is unavailable.
  const enabled = useMemo(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return !reduce && hasWebGL2();
  }, []);

  const config = useMemo(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 600;
    return {
      density: 0.045,
      maxCount: 130000,
      speed: 11,
      // Bump the dots 20% larger on mobile (the renderer shrinks them with screen
      // width, so this is on top of that scaling).
      ballRadius: mobile ? [6, 14.4] : [5, 12],
      omega: 1.0,
      beta: 1.2,
      base: mobile ? 0.085 : 0.07, // a touch brighter words on mobile
      bgDark: 0.18, // darker background → more word contrast
      mono: 0.85,
      dim: 0.52,
      speedScale: reduce ? 0 : 0.5,
      omegaScale: reduce ? 0 : 0.5,
    };
  }, []);

  const onFirstFrame = useRevealOnReady();

  return enabled ? (
    <DeckMode swarmRef={swarmRef} config={config} onFirstFrame={onFirstFrame} />
  ) : (
    <FlowMode swarmRef={swarmRef} config={config} onFirstFrame={onFirstFrame} />
  );
}

// ── Scroll-jacked full-screen panel deck ──────────────────────────────────────
function DeckMode({ swarmRef, config, onFirstFrame }) {
  const { index, phase, goTo } = useScrollDeck(PANELS.length, swarmRef, { duration: 850 });

  // Lock the document so only the panel cross-fade moves.
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.overflow;
    el.style.overflow = 'hidden';
    return () => {
      el.style.overflow = prev;
    };
  }, []);

  const onNavigate = (id) => {
    const i = indexOfId(id);
    if (i >= 0) goTo(i);
  };

  // Per-panel opacity + drift, derived from the live morph phase.
  const settled = phase.from === phase.to;
  const panelStyle = (i) => {
    let opacity = 0;
    let dy = 0;
    if (settled) {
      opacity = i === index ? 1 : 0;
    } else if (i === phase.to) {
      opacity = phase.t;
      dy = (1 - phase.t) * 30; // rises into place from below
    } else if (i === phase.from) {
      opacity = 1 - phase.t;
      dy = -phase.t * 30; // lifts away upward
    }
    return {
      opacity,
      transform: `translateY(${dy}px)`,
      pointerEvents: opacity > 0.5 ? 'auto' : 'none',
      visibility: opacity <= 0.001 ? 'hidden' : 'visible',
    };
  };

  return (
    <>
      <SwarmBackground words={WORDS} config={config} controlRef={swarmRef} onFirstFrame={onFirstFrame} />
      <Nav active={PANELS[index].id} onNavigate={onNavigate} />
      <main>
        {PANELS.map((p, i) => (
          <div
            key={p.id}
            className="fixed inset-0 z-[1] flex flex-col overflow-hidden px-[var(--pad)]"
            style={panelStyle(i)}
            aria-hidden={i !== index}
          >
            {/* Reserve the top-third band for the swarm word so content never overlaps it. */}
            <div className="shrink-0" style={{ height: `${CONTENT_TOP * 100}vh` }} aria-hidden="true" />
            {/* Content is capped to the leftover viewport: min-h-0 stops this flex
                child from growing to its natural height, and overflow-hidden means a
                too-tall section is clipped (a design signal) — never a scrollbar.
                Section budget ≈ (1 - CONTENT_TOP) of the viewport height. */}
            <div className="flex min-h-0 flex-1 items-center overflow-hidden pb-16">
              <div className="mx-auto w-full max-w-[var(--maxw)]">
                <PanelContent id={p.id} onNavigate={onNavigate} />
              </div>
            </div>
          </div>
        ))}
      </main>
      <DeckHint index={index} total={PANELS.length} onNavigate={onNavigate} />
    </>
  );
}

// A small progress rail + scroll cue so the jacked navigation is discoverable.
function DeckHint({ index, total, onNavigate }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3">
      {index === 0 ? (
        <div className="font-mono text-xs text-faint">scroll ↓</div>
      ) : null}
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${PANELS[i].word}`}
            onClick={() => onNavigate(PANELS[i].id)}
            className={`pointer-events-auto h-1.5 rounded-full transition-all hover:brightness-110 ${
              i === index ? 'w-6 bg-primary' : 'w-1.5 bg-white/25 hover:bg-white/35'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Reduced-motion / no-WebGL fallback: a normal scrolling page ───────────────
function FlowMode({ swarmRef, config, onFirstFrame }) {
  const [index, setIndex] = useState(0);

  // Scroll-spy: set the swarm word to whichever panel is centred. No morph tween
  // — just snap the field to the active word.
  useEffect(() => {
    const ids = PANELS.map((p) => p.id);
    let ticking = false;
    const pick = () => {
      const refY = window.innerHeight * 0.5;
      let cur = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= refY) cur = i;
      });
      swarmRef.current?.setMorph(cur, cur, 0);
      setIndex((p) => (p !== cur ? cur : p));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        pick();
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const t = setTimeout(pick, 150);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  }, [swarmRef]);

  return (
    <>
      <SwarmBackground words={WORDS} config={config} controlRef={swarmRef} onFirstFrame={onFirstFrame} />
      <Nav active={PANELS[index].id} />
      <main>
        {PANELS.map((p) => (
          <section
            key={p.id}
            id={p.id}
            className="relative z-[1] flex min-h-screen flex-col px-[var(--pad)]"
          >
            {/* Reserve the top-third band for the swarm word so content never overlaps it. */}
            <div className="shrink-0" style={{ height: `${CONTENT_TOP * 100}vh` }} aria-hidden="true" />
            <div className="flex-1 pb-24">
              <div className="mx-auto w-full max-w-[var(--maxw)]">
                <PanelContent id={p.id} />
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

// The foreground content for a given panel id. The big background word is the
// swarm; this is everything that sits on top of it.
function PanelContent({ id, onNavigate }) {
  if (id === 'top') return <HeroPanel onNavigate={onNavigate} />;
  const s = content.sections[id];
  return s ? <UnderConstruction label={s.label} heading={s.heading} /> : null;
}
