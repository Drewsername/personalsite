// useSwarm.js — wires a <canvas> to the swarm engine + renderer.
//
// Waits for fonts, sizes the canvas for the device pixel ratio, rasterizes the
// target paint() into a Field, runs the rAF loop (passing real dt), rebuilds on
// resize, and routes pointer hover/click for interactive swarms.

import { useEffect, useRef } from 'react';
import { SwarmEngine } from './engine.js';
import { SwarmRenderer } from './renderer.js';
import { buildField } from './field.js';

async function fontsReady() {
  if (!document.fonts) return;
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('700 200px "JetBrains Mono"'),
      document.fonts.load('600 44px "JetBrains Mono"'),
    ]);
  } catch {
    /* fall back to whatever is available */
  }
}

export function useSwarm(canvasRef, options) {
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const renderer = new SwarmRenderer();
    let raf = 0;
    let cancelled = false;
    let start = 0;
    let last = 0;
    let engine = null;
    let dims = { W: 0, H: 0 };
    let hover = { target: 0, value: 0 };
    let hitScreen = null;

    const o = () => optsRef.current;

    function buildScene() {
      const parent = canvas.parentElement;
      const W = Math.max(1, Math.floor(parent.clientWidth));
      const H = Math.max(1, Math.floor(parent.clientHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dims = { W, H };

      const opts = o();
      const cfg = opts.config ?? {};
      const avgR = ((cfg.ballRadius?.[0] ?? 9) + (cfg.ballRadius?.[1] ?? 26)) / 2;
      const q = opts.fieldQ ?? 2;
      const blurR = opts.fieldBlur ?? Math.max(1, Math.round((avgR * 0.55) / q));

      const built = buildField(opts.paint, W, H, { q, blurR });
      engine = new SwarmEngine(built.field, { W, H }, cfg);
      hitScreen = opts.interactive ? built.hit : null;
      start = 0;
      last = 0;
    }

    function frame(now) {
      if (cancelled) return;
      if (!start) {
        start = now;
        last = now;
      }
      const t = (now - start) / 1000;
      const dt = (now - last) / 1000;
      last = now;

      const opts = o();
      if (opts.interactive) {
        hover.value += (hover.target - hover.value) * 0.12;
        engine.hotRect = hitScreen;
        engine.hotBoost = hover.value * ((opts.interactive.hoverIntensity ?? 1.8) - 1);
        engine.capScale = 1 + hover.value * ((opts.interactive.hoverCapScale ?? 1.25) - 1);
      }

      renderer.render(ctx, engine.update(t, dt), dims);
      raf = requestAnimationFrame(frame);
    }

    function pointInHit(e) {
      if (!hitScreen) return false;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return x >= hitScreen.x && x <= hitScreen.x + hitScreen.w && y >= hitScreen.y && y <= hitScreen.y + hitScreen.h;
    }
    function onMove(e) {
      const inside = pointInHit(e);
      hover.target = inside ? 1 : 0;
      canvas.style.cursor = inside ? 'pointer' : 'default';
    }
    function onLeave() {
      hover.target = 0;
      canvas.style.cursor = 'default';
    }
    function onClick(e) {
      if (pointInHit(e)) o().interactive?.onClick?.(e);
    }

    let ro = null;
    let resizeTimer = 0;

    (async () => {
      await fontsReady();
      if (cancelled) return;
      buildScene();
      raf = requestAnimationFrame(frame);

      ro = new ResizeObserver(() => {
        const parent = canvas.parentElement;
        const W = Math.floor(parent.clientWidth);
        const H = Math.floor(parent.clientHeight);
        if (Math.abs(W - dims.W) < 2 && Math.abs(H - dims.H) < 2) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (!cancelled) buildScene();
        }, 120);
      });
      ro.observe(canvas.parentElement);

      if (o().interactive) {
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerleave', onLeave);
        canvas.addEventListener('click', onClick);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      if (ro) ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [canvasRef]);
}
