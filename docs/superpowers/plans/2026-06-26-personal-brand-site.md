# Personal-brand site implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the standalone swarm demo into a crisp, navigable, dark-editorial personal-brand one-pager (legal consulting + creative work) with the swarm as an understated background that morphs its formation per section.

**Architecture:** One fixed full-viewport WebGL swarm layer sits behind a normal scrolling React page. A scroll/section controller cross-fades the swarm's target formation (name → Consulting → Work → logo) as sections enter. All copy lives in one content config; sections are plain components rendered over the swarm with scrims for guaranteed contrast.

**Tech Stack:** React 19, Vite 7, the existing `src/swarm` WebGL2 engine, plain CSS (no UI framework). Fonts: JetBrains Mono + Inter (already linked).

## Global Constraints

- Dark only (no light mode) for v1. Canvas near-black `#06070b`.
- Swarm is understated: dimmed (~25% of hero brightness), near-monochrome (white/silver), slowed drift/tumble. A single accent hue `--accent` (default electric cyan `#35E0FF`) for links, active nav, CTA, focus rings, morph leading edge.
- Typography: JetBrains Mono for wordmark/nav/labels; Inter for body. Sentence case. Strong hierarchy.
- Respect `prefers-reduced-motion`: freeze swarm to a static formation, disable morph animation + smooth scroll.
- Text contrast guaranteed everywhere (scrim/surfaces behind body copy).
- No CMS/blog/backend/routing. Contact = `mailto:` + external calendar link. Content morphs limited to text/logo.
- Per-task verification: `npm run lint` (0 errors) + `npm run build` (succeeds) + browser screenshot confirms the deliverable. Commit per task on a feature branch (branch off `main` first).

---

### Task 1: Feature branch

**Files:** none (git only).

- [ ] **Step 1:** `git checkout -b feat/personal-brand-site`
- [ ] **Step 2:** Confirm `git status` is on the new branch.

---

### Task 2: Swarm — understated mode (dim / monochrome / slow)

Add config knobs so the same engine can render the loud hero demo OR a calm background. No new mechanism, just scalars.

**Files:**
- Modify: `src/swarm/glswarm.js` (cfg defaults + a few shader uniforms/multipliers)

**Interfaces:**
- Produces: `GLSwarm` config accepts `mono` (0–1, desaturation toward white), `dim` (overall brightness multiplier), `speedScale`, `omegaScale`. Defaults keep current look (`mono:0, dim:1, speedScale:1, omegaScale:1`).

- [ ] **Step 1:** Add `mono`, `dim`, `speedScale`, `omegaScale` to `this.cfg` defaults; apply `speedScale`/`omegaScale` to per-ball velocity/`v_omega`; add `u_mono`/`u_dim` uniforms; in the fragment, `col = mix(col, vec3(1.0), u_mono)` and final `w *= u_dim`.
- [ ] **Step 2:** Temporarily set `App` swarm config to `{ mono: 0.8, dim: 0.28, speedScale: 0.5, omegaScale: 0.5 }`.
- [ ] **Step 3:** `npm run lint && npm run build`.
- [ ] **Step 4:** Browser: confirm the field is dim, near-white/silver, slow; text still legible. Screenshot.
- [ ] **Step 5:** Commit.

---

### Task 3: Swarm — morphable target with cross-fade

Let the running swarm switch which mask it forms, blending old→new over a duration. The mask is currently uploaded once in `build`; add an imperative setter that animates a blend between two mask textures.

**Files:**
- Modify: `src/swarm/glswarm.js` (second mask texture + `u_morph` blend uniform; `setTarget(canvas2d, durationMs)`; advance blend in `render`)

**Interfaces:**
- Produces: `swarm.setTarget(maskCanvas, durationMs = 800)` — cross-fades the sampled mask from current to `maskCanvas` over the duration. `render(t)` advances the blend.

- [ ] **Step 1:** Add `texB` + `u_morph` (0→1). In the vertex mask sample, sample both `u_target` and `u_targetB` and `mix` by `u_morph`. `setTarget` uploads the new mask into `texB`, swaps roles when blend completes, drives `u_morph` from a start time.
- [ ] **Step 2:** In `GLSwarmView`/test harness, call `setTarget` to a second formation after 2s.
- [ ] **Step 3:** `npm run lint && npm run build`.
- [ ] **Step 4:** Browser: confirm the swarm smoothly re-forms the new text. Screenshot before/after.
- [ ] **Step 5:** Commit.

---

### Task 4: SwarmBackground component (fixed layer + morph API)

Repackage `GLSwarmView` as a fixed full-viewport background that exposes an imperative `morphTo(paint)` and `setHot(rect)`, decoupled from per-section mounting. Keep the stroked outline overlay, also morphable.

**Files:**
- Create: `src/swarm/SwarmBackground.jsx` (fixed canvas layer; `forwardRef` exposing `morphTo(paint, outlinePaint)`)
- Modify: `src/swarm/index.js` (export it)

**Interfaces:**
- Produces: `<SwarmBackground ref={r} initial={paint} initialOutline={outlinePaint} config={...} />`; `r.current.morphTo(paint, outlinePaint)` rebuilds the mask via `buildField` + `swarm.setTarget`, and cross-fades the overlay canvas.

- [ ] **Step 1:** Build the component: fixed `position:fixed; inset:0; z-index:0`; mount swarm + overlay; rAF loop; resize rebuild; `morphTo` builds a blurred mask from the paint and calls `setTarget`, and redraws the overlay with a CSS opacity cross-fade.
- [ ] **Step 2:** Mount it in `App` with the hero name formation; verify it fills the viewport behind nothing yet.
- [ ] **Step 3:** `npm run lint && npm run build`; browser screenshot.
- [ ] **Step 4:** Commit.

---

### Task 5: Site theme + tokens

Global dark theme, typography scale, layout tokens, accent var, scrim utility, smooth scroll, reduced-motion.

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1:** Define `:root` tokens (`--bg:#06070b`, `--fg`, `--muted`, `--accent:#35E0FF`, font vars, max-width, section padding). Body dark bg, Inter; `h*`/labels mono. `html{scroll-behavior:smooth}`. `.scrim` utility (top-to-bottom dark gradient). `@media (prefers-reduced-motion)` disables smooth scroll.
- [ ] **Step 2:** `npm run lint && npm run build`; browser confirms dark canvas + fonts.
- [ ] **Step 3:** Commit.

---

### Task 6: Content config

Single source of truth for all copy (placeholders clearly marked), so the site is editable in one file.

**Files:**
- Create: `src/site/content.js`

**Interfaces:**
- Produces: `content = { name, tagline, nav:[{id,label}], consulting:{intro,services:[...],cta:{label,href}}, work:[{title,blurb,href,thumb?}], about:{body}, contact:{email,calendar,socials:[...]}, accent }`.

- [ ] **Step 1:** Write the config with explicit placeholder copy (`"[placeholder] …"`) and the real name/tagline.
- [ ] **Step 2:** `npm run lint && npm run build`.
- [ ] **Step 3:** Commit.

---

### Task 7: Section wrapper + Nav

**Files:**
- Create: `src/site/Section.jsx` (id anchor, max-width, padding, optional scrim)
- Create: `src/site/Nav.jsx` (sticky; wordmark; anchor links from `content.nav`; active-section highlight; `Book a consult` button; mobile menu)
- Modify: `src/App.jsx` (render `SwarmBackground` + `Nav` + a content wrapper at `z-index:1`)

- [ ] **Step 1:** Build `Section` + `Nav`; wire anchors (smooth scroll); active link via `IntersectionObserver`.
- [ ] **Step 2:** `npm run lint && npm run build`; browser: nav sticky, links scroll, active state in accent. Screenshot.
- [ ] **Step 3:** Commit.

---

### Task 8: Hero + Pillars

**Files:**
- Create: `src/site/Hero.jsx` (name formation lives in the swarm; tagline; scroll cue), `src/site/Pillars.jsx` (two cards from a small local list linking to `#consulting`/`#work`)
- Modify: `src/App.jsx`

- [ ] **Step 1:** Build Hero (full viewport, content over swarm, scrim for the tagline) + Pillars (2-col grid, mono labels, hover states).
- [ ] **Step 2:** `npm run lint && npm run build`; browser screenshot of hero + pillars.
- [ ] **Step 3:** Commit.

---

### Task 9: Consulting, Work, About, Contact, Footer

**Files:**
- Create: `src/site/Consulting.jsx`, `src/site/Work.jsx`, `src/site/About.jsx`, `src/site/Contact.jsx`, `src/site/Footer.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1:** Build each from `content`: Consulting (services list + CTA), Work (`auto-fit` project grid, hover), About (bio), Contact (mailto + calendar + socials), Footer (logo formation + links). Scrims/surfaces behind body copy.
- [ ] **Step 2:** `npm run lint && npm run build`; browser screenshot of each section.
- [ ] **Step 3:** Commit.

---

### Task 10: Wire the morph to scroll

Drive `SwarmBackground.morphTo` from the active section.

**Files:**
- Create: `src/site/useSectionMorph.js` (maps active section id → `{paint, outline}` and calls `morphTo`, debounced)
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `SwarmBackground` ref `morphTo`; per-section formations (hero name, `Consulting`, `Work`, footer logo; About/Contact reuse the name or a neutral mark).

- [ ] **Step 1:** Build the hook: `IntersectionObserver` on sections → on active change, `ref.morphTo(formationFor(id))`. Throttle so fast scrolls don't thrash.
- [ ] **Step 2:** `npm run lint && npm run build`; browser: scroll through, confirm the swarm re-forms per section. Screenshots at 2–3 sections.
- [ ] **Step 3:** Commit.

---

### Task 11: Responsive, reduced-motion, performance

**Files:**
- Modify: `src/index.css` (breakpoints), `src/swarm/SwarmBackground.jsx` (lower density on small screens; honor reduced-motion by freezing/disabling morph), section components (reflow).

- [ ] **Step 1:** Mobile reflow (nav menu, single-column grids); reduce swarm density/DPR on small/highDPR; `prefers-reduced-motion` freezes swarm + disables morph.
- [ ] **Step 2:** `npm run lint && npm run build`; browser at mobile + desktop presets; screenshots.
- [ ] **Step 3:** Commit.

---

### Task 12: Final pass

**Files:** as needed.

- [ ] **Step 1:** Full read-through in browser: legibility over every section, contrast, morph smoothness, nav, CTAs. Fix nits.
- [ ] **Step 2:** Remove dead code from the swarm exploration that's now unused (old `Swarm.jsx`/`useSwarm.js`/`engine.js`/`renderer.js`/`field.js`/`projection`-era files if not referenced); keep `glswarm.js`, `SwarmBackground.jsx`, `paints.js`.
- [ ] **Step 3:** `npm run lint && npm run build`; final screenshots.
- [ ] **Step 4:** Commit.

## Self-Review

- **Spec coverage:** IA (Tasks 7–9), morph engine (2,3,4,10), understated rules (2,5), visual language (5,8), nav/interaction (7), content-as-config (6), responsive/reduced-motion (11), YAGNI (no CMS/backend — Task 9 contact is mailto/calendar). Covered.
- **Placeholders:** content placeholders are an explicit, marked deliverable (Task 6), not silent gaps.
- **Type consistency:** `morphTo(paint, outlinePaint)` and `setTarget(maskCanvas, durationMs)` used consistently across Tasks 3/4/10.
