import { useEffect, useRef, useState } from 'react';
import { content } from './content.js';
import { CONTENT_TOP, WORD_CY, WORD_BAND } from './deckLayout.js';

// The Projects panel: a reel of three live strips (one per project) that fills
// the content area under the swarm word. Hovering a strip widens it; clicking
// opens that project as a full page — its texture goes full-bleed and the swarm
// morphs to spell the project's name (App drives the morph). Return via the
// "← all projects" pill, clicking the swarm word itself, or the 3-dot rail
// (which also hops between projects).
//
// Must be rendered inside a positioned, full-viewport-height container: every
// layer here is absolutely positioned against it.

// Each project's screen recording, with the project's colour tint washed over it
// so the reel keeps its palette. Playback is gated: videos pause whenever their
// layer isn't the one on screen, so at most three (the reel) decode at once.
function Recording({ src, tint, playing }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing]);
  return (
    <>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 50% 30%, ${tint}, transparent 70%)` }}
      />
    </>
  );
}

export function ProjectsSection({ open, onOpen, onClose, active = true }) {
  const [hover, setHover] = useState(0);
  // On phones the reel stacks vertically and hover doesn't exist: strips stay
  // equal-height, every caption is visible, and a tap opens the project.
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setMobile(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const projects = content.projects;
  const isOpen = open >= 0;

  // Mobile full-screen demo viewer, opened from a project page. Closes itself
  // whenever the open project changes (including closing the page).
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(false), [open]);

  return (
    <>
      {/* Full-bleed recording behind the open project page. */}
      {projects.map((p, i) => (
        <div
          key={p.name}
          aria-hidden={!(isOpen && open === i)}
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{ opacity: isOpen && open === i ? 1 : 0 }}
        >
          <Recording src={p.video} tint={p.tint} playing={active && isOpen && open === i} />
          {/* On phones the recording is heavily dimmed — it's ambience behind the
              text there, and the "watch demo" viewer is the way to actually watch. */}
          <div
            className="absolute inset-0"
            style={{
              background: mobile
                ? 'linear-gradient(180deg, rgba(6,7,11,0.72), rgba(6,7,11,0.9))'
                : 'linear-gradient(180deg, rgba(6,7,11,0.35), rgba(6,7,11,0.72))',
            }}
          />
        </div>
      ))}

      {/* The reel: three strips sharing the content area under the word. */}
      <div
        className="absolute flex flex-col gap-2.5 transition-opacity duration-500 md:flex-row"
        style={{
          left: 'var(--pad)',
          right: 'var(--pad)',
          // Single-line word on phones ends ~30vh, so the reel can start higher
          // there (taller strips); desktop keeps the shared CONTENT_TOP.
          top: mobile ? '34vh' : `${CONTENT_TOP * 100}vh`,
          bottom: '72px',
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
      >
        {projects.map((p, i) => {
          const active = i === hover;
          const showCaption = mobile || active;
          return (
            <button
              key={p.name}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => onOpen(i)}
              className="relative cursor-pointer overflow-hidden border border-white/[0.08] text-left"
              style={{
                flex: !mobile && active ? '2.9 1 0%' : '1 1 0%',
                transition: 'flex .55s cubic-bezier(.22,.9,.3,1)',
              }}
            >
              <Recording src={p.video} tint={p.tint} playing={(mobile || active) && !isOpen} />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(6,7,11,0.2), rgba(6,7,11,0.88))' }}
              />
              <div className="absolute inset-x-4 bottom-3.5 flex flex-col gap-1.5 sm:inset-x-7 sm:bottom-6 sm:gap-3">
                <div className="flex items-baseline gap-3.5">
                  <span className="font-mono text-[11px] tracking-[1px] text-primary">0{i + 1}</span>
                  <span className="font-mono text-base font-medium sm:text-lg">{p.name}</span>
                </div>
                <div
                  className="max-w-[560px]"
                  style={{
                    opacity: showCaption ? 1 : 0,
                    transform: showCaption ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity .45s .12s, transform .45s .12s',
                  }}
                >
                  <p className="mb-1 text-[13px] leading-[1.6] text-[#c6ccda] [text-wrap:pretty] sm:mb-2.5 sm:text-sm sm:leading-[1.7]">
                    {p.line}
                  </p>
                  <span className="font-mono text-[11px] tracking-[1px] text-faint">
                    {mobile ? 'tap to open →' : 'click to open →'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* One full page per project. */}
      {projects.map((p, i) => {
        const shown = isOpen && open === i;
        return (
          <div
            key={p.name}
            aria-hidden={!shown}
            className="absolute inset-0"
            style={{
              opacity: shown ? 1 : 0,
              pointerEvents: shown ? 'auto' : 'none',
              transform: shown ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity .5s, transform .5s',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-[96px] inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[0.14] bg-background/50 px-4 py-[7px] font-mono text-xs tracking-[1px] text-muted-foreground backdrop-blur-[4px] transition-colors hover:border-white/35 hover:text-foreground"
              style={{ left: 'var(--pad)' }}
            >
              ← all projects
            </button>
            <div
              className="absolute left-1/2 flex -translate-x-1/2 flex-col gap-3.5"
              style={{ bottom: '110px', width: 'min(var(--maxw), calc(100% - 2 * var(--pad)))' }}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-xs tracking-[2px] text-primary">0{i + 1} / 0{projects.length}</span>
                <span className="font-mono text-[13px] tracking-[1px] text-muted-foreground">{p.line}</span>
              </div>
              {/* Tall bodies (small phones) scroll inside the block instead of
                  colliding with the swarm word; the deck hands the gesture over
                  via data-deck-scroll. Desktop bodies fit — no scrollbar. */}
              <p
                data-deck-scroll
                className="max-h-[min(32vh,340px)] max-w-[660px] overflow-y-auto overscroll-contain pr-1 text-[clamp(13.5px,1.6vw,15.5px)] leading-[1.75] text-[#c6ccda] [text-wrap:pretty]"
              >
                {p.body}
              </p>
              {mobile ? (
                <button
                  type="button"
                  onClick={() => setDemo(true)}
                  className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs tracking-[1px] text-primary transition-colors hover:bg-primary/20"
                >
                  ▶ watch demo (silent)
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* The swarm word itself is a way back to the reel. */}
      {isOpen ? (
        <button
          type="button"
          aria-label="back to all projects"
          title="back to all projects"
          onClick={onClose}
          className="absolute inset-x-[13%] z-[4] cursor-pointer"
          style={{ top: `${(WORD_CY - WORD_BAND / 2) * 100}vh`, height: `${WORD_BAND * 100}vh` }}
        />
      ) : null}

      {/* When a project is open, the deck's dot rail hands off to this one:
          dots hop between projects; the active dot closes. */}
      {isOpen ? (
        <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2.5">
          <span className="px-4 text-center font-mono text-[10px] tracking-[1px] text-faint sm:text-[11px]">
            dots hop between projects · active dot closes
          </span>
          <div className="flex gap-2">
            {projects.map((p, j) => (
              <button
                key={p.name}
                type="button"
                aria-label={open === j ? 'close project' : `Open ${p.name}`}
                onClick={() => (open === j ? onClose() : onOpen(j))}
                className={`h-1.5 cursor-pointer rounded-full transition-all hover:brightness-110 ${
                  open === j ? 'w-6 bg-primary' : 'w-1.5 bg-white/25 hover:bg-white/35'
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Full-screen demo viewer (mobile): the recording, undimmed, over
          everything. Fixed so it escapes the panel's transform/stacking. */}
      {demo && isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
          <video
            key={projects[open].video}
            src={projects[open].video}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setDemo(false)}
            className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/[0.2] bg-background/60 px-4 py-2 font-mono text-xs tracking-[1px] text-foreground backdrop-blur-[4px]"
          >
            ✕ close
          </button>
        </div>
      ) : null}
    </>
  );
}
