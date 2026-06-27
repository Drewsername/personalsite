# Drew Bermudez — personal-brand site design

## Overview

A single-page personal-brand site for Drew Bermudez presenting two equal pillars —
**legal consulting** and **creative work** — under one cohesive identity. It must
land for two audiences at once: a buttoned-up prospective legal client (needs
trust, clarity, an obvious way to make contact) and a creative/professional peer
(needs taste and craft). The existing swarm renderer becomes the brand's
signature, used as a fluid, understated thread that morphs between sections —
spectacle at the edges of perception, words always crisp.

## Goals & success criteria

- A first-time visitor understands "who Drew is and what he offers" within ~5
  seconds, and can self-select (consulting vs. work) in one click.
- A legal client always has an obvious, low-friction path to "book a consult."
- The swarm reads as a distinctive signature, never as noise that blocks reading.
- Crisp, fast, fully navigable; text contrast is guaranteed everywhere.

## Audience & positioning

Equal pillars, framed as one personal brand (Drew the person; law and creative
are facets of the same identity). Primary visitors: both legal clients and
creative peers, weighted equally.

## Information architecture

One scrolling page, sticky nav, smooth-scroll anchors:

1. **Nav** (sticky) — `Drew Bermudez` mono wordmark (left); `Consulting · Work ·
   About · Contact` + a `Book a consult` button (right). Collapses to a menu on
   mobile.
2. **Hero** (full viewport) — swarm forms `Drew Bermudez`; one-line positioning
   (default copy: "legal consulting × creative engineering"); scroll cue.
3. **Pillars** — two equal cards directly under the hero: *Legal consulting* and
   *Creative work*, each a one-line value prop + anchor link, for instant
   self-selection.
4. **Consulting** — what I do (services list), approach/credentials, a clear
   `Book a consult` CTA.
5. **Creative work** — a responsive grid of selected projects (the swarm itself is
   project #1); each card links out or opens detail.
6. **About** — short bio bridging law + creative.
7. **Contact** — email, calendar link, socials.
8. **Footer** — the swarm re-forms the `Drew Bermudez` logo; minimal links.

## The morph swarm engine

One fixed, full-viewport swarm canvas sits **behind** all content (z-index below
content, above the page background). The swarm's target mask is **morphable**:

- Each section declares a target *formation* (a `paint` callback → mask): the
  hero's name, the word `Consulting`, the word `Work`, the footer logo, etc.
- A scroll observer tracks the active section. On change, the mask **cross-fades**
  from the current formation to the next over ~0.8s (render both into the mask
  canvas with an animated blend; the free-floating balls re-form the new shape).
- The crisp stroked **outline overlay** cross-fades in lockstep, so the readable
  shape and the swarm stay aligned through the morph.

"Understated" is enforced structurally, not by hoping:

- **Dimmed** — swarm brightness reduced (~25% of the standalone hero level).
- **Near-monochrome** — hue desaturated toward white/silver; the single accent
  hue is reserved for the morph's leading edge and UI, not the whole field.
- **Slowed** — drift/tumble rates reduced for a calm, weightless feel.
- **Scrim** — a subtle dark gradient scrim between swarm and text guarantees
  contrast; body content also sits on near-opaque surfaces where needed.

## Visual language

- **Canvas**: near-black (`#06070b`-ish), dark editorial.
- **Swarm**: near-monochrome (white/silver), dimmed, slow.
- **Accent**: a single signature hue — default electric cyan (`#35E0FF`), used
  for links, active nav, the `Book a consult` CTA, focus rings, and the morph
  leading edge. Swappable via one token.
- **Typography**: JetBrains Mono for the wordmark, nav, and section labels (the
  "signature" voice); a clean sans (Inter) for body. Strong hierarchy, sentence
  case, generous whitespace.
- **Motion**: smooth-scroll; the morph is the only large motion; micro-hover
  states on cards/links. Respect `prefers-reduced-motion` (freeze the swarm to a
  static formation, disable morph animation).

## Navigation & interaction

- Sticky nav with anchor links; active section highlighted in the accent.
- Pillar cards give one-click self-selection near the top.
- `Book a consult` is persistent (nav + consulting section) → mailto or calendar
  link.
- Mobile: nav collapses to a menu; grid columns reflow; swarm density reduced for
  performance.

## Technical approach

- **Reuse** the existing `src/swarm` WebGL engine. Extend it with: (a) a
  dimmed/monochrome render mode (config: brightness, saturation, speed scales);
  (b) a **morphable target** — `setTarget(paint)` that cross-fades the mask over a
  duration; (c) the outline overlay accepts the same morph.
- **One swarm instance** mounted as a fixed background layer in `App`, driven by a
  scroll/section controller that calls `setTarget` per active section.
- **Content as config** — sections, services, projects, bio, contact live in a
  single `content.js` (or similar) so copy is editable in one place; no CMS.
- **Sections** are plain React components reading from that config, laid out over
  the swarm with scrims/surfaces for contrast.
- **Contact** is `mailto:` + an external calendar link; no backend.

## Content needed (placeholders until provided)

Scaffold with clearly-marked placeholder copy; Drew provides: consulting services
+ one-line bio, 3–6 creative projects (title, blurb, image/link), and contact
details (email, calendar URL, socials). Placeholders are explicit, not silent.

## Out of scope (YAGNI)

No CMS, no blog, no backend/auth, no analytics dashboard, no multi-page routing,
no light-mode toggle (dark only) for v1. The swarm morph is limited to text/logo
formations (no arbitrary image morphing) in v1.
