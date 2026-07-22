import { useEffect, useRef, useState } from 'react';

// Scroll-jacked panel deck. One decisive gesture (wheel tick / swipe / arrow /
// PageUp·Down / Home·End / nav jump) advances exactly one panel and is locked
// out until the morph finishes. Each step drives an eased tween that the swarm
// reads through `swarmRef.current.setMorph(from, to, t)`, so the background word
// reshapes in lockstep with the content cross-fade.
//
// `index`  — the settled panel (updates only when a morph completes).
// `phase`  — { from, to, t }: the live morph, for fading panel content.
// `goTo(i)`— jump to any panel (used by the nav).
//
// When `enabled` is false (reduced-motion / no WebGL) nothing is intercepted;
// the page scrolls natively and a scroll-spy elsewhere sets the word.

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// A gesture that starts inside an overflowing [data-deck-scroll] region should
// scroll that region natively (e.g. the Book synopsis on a phone) instead of
// advancing the deck.
const scrollRegion = (target) => {
  const el = target instanceof Element ? target.closest('[data-deck-scroll]') : null;
  return el && el.scrollHeight > el.clientHeight + 1 ? el : null;
};
const canScroll = (el, dy) =>
  dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;

export function useScrollDeck(count, swarmRef, { duration = 800, enabled = true } = {}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState({ from: 0, to: 0, t: 1 });
  // Mutable mirror so listeners/RAF read fresh values without re-subscribing.
  const ctrl = useRef({ index: 0, animating: false, goTo: null });

  useEffect(() => {
    if (!enabled) return;
    const st = ctrl.current;
    let raf = 0;

    function animateTo(target) {
      target = Math.max(0, Math.min(count - 1, target));
      if (st.animating || target === st.index) return;
      const from = st.index;
      st.animating = true;
      const t0 = performance.now();

      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const e = easeInOutCubic(p);
        swarmRef.current?.setMorph(from, target, e);
        setPhase({ from, to: target, t: e });
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          st.index = target;
          st.animating = false;
          swarmRef.current?.setMorph(target, target, 0);
          setIndex(target);
          setPhase({ from: target, to: target, t: 1 });
        }
      };
      raf = requestAnimationFrame(step);
    }
    st.goTo = animateTo;
    const go = (dir) => animateTo(st.index + dir);

    // Wheel: collapse a burst of events (trackpad inertia) into one step.
    let wheelCooldown = false;
    const onWheel = (e) => {
      const region = scrollRegion(e.target);
      if (region && canScroll(region, e.deltaY)) return; // native scroll inside the region
      e.preventDefault();
      if (st.animating || wheelCooldown || Math.abs(e.deltaY) < 6) return;
      wheelCooldown = true;
      setTimeout(() => (wheelCooldown = false), duration * 0.65);
      go(e.deltaY > 0 ? 1 : -1);
    };

    const onKey = (e) => {
      // Keys typed into a form field belong to the field, not the deck.
      const t = e.target;
      if (t instanceof Element && (t.matches('input, textarea, select') || t.isContentEditable)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        animateTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        animateTo(count - 1);
      }
    };

    let touchY = null;
    let touchRegion = null;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
      touchRegion = scrollRegion(e.target);
    };
    const onTouchMove = (e) => {
      // Swipes inside a scrollable region pan it natively; everywhere else,
      // suppress native rubber-banding so the swipe reads as a deck step.
      if (touchY !== null && !touchRegion) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      if (touchY === null) return;
      const dy = e.changedTouches[0].clientY - touchY;
      touchY = null;
      if (touchRegion) {
        touchRegion = null; // the region consumed the gesture
        return;
      }
      if (Math.abs(dy) > 45) go(dy < 0 ? 1 : -1);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      st.goTo = null;
    };
  }, [count, duration, enabled, swarmRef]);

  const goTo = (i) => ctrl.current.goTo?.(i);
  return { index, phase, goTo };
}
