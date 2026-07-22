import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SwarmBackground } from './swarm/SwarmBackground.jsx';
import { content } from './site/content.js';
import { Nav } from './site/Nav.jsx';
import { HeroPanel } from './site/Hero.jsx';
import { UnderConstruction } from './site/Stub.jsx';
import { BookSection } from './site/Book.jsx';
import { ContactSection } from './site/Contact.jsx';
import { LoginSection } from './site/Login.jsx';
import { ProjectsSection } from './site/Projects.jsx';
import { useScrollDeck } from './site/useScrollDeck.js';

// One panel per word. The swarm spells `word`; the foreground is the home cards
// (top) or a section header (everything else).
const PANELS = [
  { id: 'top', word: content.name },
  { id: 'projects', word: content.sections.projects.word },
  { id: 'book', word: content.sections.book.word },
  { id: 'contact', word: content.sections.contact.word },
  { id: 'resume', word: content.sections.resume.word },
  { id: 'login', word: content.sections.login.word },
];
// The swarm's word list is the panel words plus one word per project: when a
// project is opened from the Projects panel, the swarm morphs from "Projects"
// to that project's name. PROJECT_WORD_BASE is the index of the first one.
const WORDS = [...PANELS.map((p) => p.word), ...content.projects.map((p) => p.name)];
const PROJECT_WORD_BASE = PANELS.length;
const indexOfId = (id) => PANELS.findIndex((p) => p.id === id);
const PROJECTS_PANEL = indexOfId('projects');

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Shared open/close state for the Projects reel. Returns the open index, the
// open/close/hop handlers, and `wordFor` — the panel-index → word-index map the
// deck's morphs are routed through, so leaving the Projects panel with a
// project open morphs from that project's NAME, not from "Projects".
function useProjectPages(swarmRef, { tween = true } = {}) {
  const [openProject, setOpenProject] = useState(-1);
  const openRef = useRef(-1);
  const animRef = useRef(false);

  const wordFor = useCallback(
    (panel) => (panel === PROJECTS_PANEL && openRef.current >= 0 ? PROJECT_WORD_BASE + openRef.current : panel),
    []
  );

  // Morph the swarm between two word indices with the deck's easing. Under
  // reduced motion / flow mode the word just snaps.
  const morphWord = useCallback(
    (fromW, toW, done) => {
      if (!tween) {
        swarmRef.current?.setMorph(toW, toW, 0);
        done?.();
        return;
      }
      animRef.current = true;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 850);
        swarmRef.current?.setMorph(fromW, toW, easeInOutCubic(p));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          swarmRef.current?.setMorph(toW, toW, 0);
          animRef.current = false;
          done?.();
        }
      };
      requestAnimationFrame(step);
    },
    [swarmRef, tween]
  );

  const openProjectAt = useCallback(
    (i) => {
      if (animRef.current || i === openRef.current) return;
      const fromW = wordFor(PROJECTS_PANEL);
      openRef.current = i;
      setOpenProject(i);
      morphWord(fromW, PROJECT_WORD_BASE + i);
    },
    [morphWord, wordFor]
  );

  const closeProject = useCallback(() => {
    if (animRef.current || openRef.current < 0) return;
    const fromW = PROJECT_WORD_BASE + openRef.current;
    setOpenProject(-1);
    morphWord(fromW, PROJECTS_PANEL, () => {
      openRef.current = -1;
    });
  }, [morphWord]);

  // Silent reset (no morph) once the deck has settled on another panel — the
  // departing morph already carried the word away.
  const resetProject = useCallback(() => {
    openRef.current = -1;
    setOpenProject(-1);
  }, []);

  return { openProject, openProjectAt, closeProject, resetProject, wordFor };
}

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
  const { openProject, openProjectAt, closeProject, resetProject, wordFor } =
    useProjectPages(swarmRef);

  // The deck drives morphs by PANEL index; route them through `wordFor` so the
  // Projects panel spells the open project's name.
  const deckSwarmRef = useRef(null);
  deckSwarmRef.current = {
    setMorph: (a, b, t) => swarmRef.current?.setMorph(wordFor(a), wordFor(b), t),
  };
  const { index, phase, goTo } = useScrollDeck(PANELS.length, deckSwarmRef, { duration: 850 });

  // Once the deck settles on another panel, quietly forget the open project.
  useEffect(() => {
    if (index !== PROJECTS_PANEL) resetProject();
  }, [index, resetProject]);

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
    if (i < 0) return;
    // Clicking "Projects" while a project page is open returns to the reel.
    if (i === PROJECTS_PANEL && index === PROJECTS_PANEL && openProject >= 0) closeProject();
    else goTo(i);
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
            {p.id === 'projects' ? (
              // The Projects reel lays itself out in absolute layers (it needs
              // full-bleed project pages), so it skips the shared scaffolding.
              <ProjectsSection
                open={openProject}
                onOpen={openProjectAt}
                onClose={closeProject}
                active={index === PROJECTS_PANEL}
              />
            ) : (
              <>
                {/* Reserve room for the swarm word so content never overlaps it.
                    On phones a single-line section word is width-limited (~30vh
                    bottom edge), so sections start at 34vh there — only the hero's
                    two-line name needs the full 42vh (= CONTENT_TOP) band. */}
                <div
                  className={`shrink-0 ${p.id === 'top' ? 'h-[42vh]' : 'h-[34vh] md:h-[42vh]'}`}
                  aria-hidden="true"
                />
                {/* Content gets the leftover viewport: min-h-0 stops this flex child
                    from growing to its natural height. A section taller than the
                    budget scrolls natively inside the deck — the scroll-jack hands
                    wheel/touch gestures over via data-deck-scroll. Content is
                    top-aligned so sections start right under the word band. */}
                <div data-deck-scroll className="flex min-h-0 flex-1 overflow-y-auto overscroll-contain pb-14 md:pb-16">
                  <div className="mx-auto w-full max-w-[var(--maxw)]">
                    <PanelContent id={p.id} onNavigate={onNavigate} />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </main>
      {/* With a project page open, the reel's own dot rail takes over. */}
      {openProject < 0 || index !== PROJECTS_PANEL ? (
        <DeckHint index={index} total={PANELS.length} onNavigate={onNavigate} />
      ) : null}
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
  const { openProject, openProjectAt, closeProject, wordFor } = useProjectPages(swarmRef, {
    tween: false,
  });

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
      const w = wordFor(cur);
      swarmRef.current?.setMorph(w, w, 0);
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
  }, [swarmRef, wordFor, openProject]);

  return (
    <>
      <SwarmBackground words={WORDS} config={config} controlRef={swarmRef} onFirstFrame={onFirstFrame} />
      <Nav active={PANELS[index].id} />
      <main>
        {PANELS.map((p) =>
          p.id === 'projects' ? (
            // The reel positions itself absolutely, so its section needs a fixed
            // height (its content is out of flow) — one viewport, like the deck.
            <section key={p.id} id={p.id} className="relative z-[1] h-screen overflow-hidden">
              <ProjectsSection open={openProject} onOpen={openProjectAt} onClose={closeProject} />
            </section>
          ) : (
            <section
              key={p.id}
              id={p.id}
              className="relative z-[1] flex min-h-screen flex-col px-[var(--pad)]"
            >
              {/* Reserve room for the swarm word (see DeckMode: hero needs the full
                  band; single-line section words free ~8vh on phones). */}
              <div
                className={`shrink-0 ${p.id === 'top' ? 'h-[42vh]' : 'h-[34vh] md:h-[42vh]'}`}
                aria-hidden="true"
              />
              <div className="flex-1 pb-24">
                <div className="mx-auto w-full max-w-[var(--maxw)]">
                  <PanelContent id={p.id} />
                </div>
              </div>
            </section>
          )
        )}
      </main>
    </>
  );
}

// The foreground content for a given panel id. The big background word is the
// swarm; this is everything that sits on top of it.
function PanelContent({ id, onNavigate }) {
  if (id === 'top') return <HeroPanel onNavigate={onNavigate} />;
  if (id === 'book') return <BookSection />;
  if (id === 'contact') return <ContactSection />;
  if (id === 'login') return <LoginSection />;
  const s = content.sections[id];
  return s ? <UnderConstruction label={s.label} heading={s.heading} /> : null;
}
