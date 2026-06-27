// GLSwarmView.jsx — React wrapper for the WebGL swarm. Builds the colored
// target from paint(), sizes the canvas for DPR, runs the rAF loop, rebuilds on
// resize, and routes hover/click for an interactive region.

import { useEffect, useRef } from 'react';
import { GLSwarm } from './glswarm.js';

async function fontsReady() {
  if (!document.fonts) return;
  try {
    await document.fonts.ready;
    await document.fonts.load('700 200px "JetBrains Mono"');
  } catch {
    /* fall back */
  }
}

export function GLSwarmView({ paint, overlay, overlayBlend = 'overlay', config, interactive, className, style }) {
  const ref = useRef(null);
  const overlayRef = useRef(null);
  const optsRef = useRef({ paint, overlay, config, interactive });
  useEffect(() => {
    optsRef.current = { paint, overlay, config, interactive };
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let swarm;
    try {
      swarm = new GLSwarm(canvas, optsRef.current.config);
    } catch (e) {
      console.error('GLSwarm init failed:', e);
      return;
    }

    let raf = 0;
    let start = 0;
    let cancelled = false;
    let dims = { W: 0, H: 0 };
    let hover = { target: 0, value: 0 };
    let hitScreen = null;

    function buildScene() {
      const parent = canvas.parentElement;
      const W = Math.max(1, Math.floor(parent.clientWidth));
      const H = Math.max(1, Math.floor(parent.clientHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      dims = { W, H };

      const tc = document.createElement('canvas');
      tc.width = W;
      tc.height = H;
      const tctx = tc.getContext('2d');
      tctx.clearRect(0, 0, W, H);
      const meta = optsRef.current.paint(tctx, W, H) || {};
      hitScreen = optsRef.current.interactive ? meta.hit || null : null;

      // Blur the target into a smooth field so the balls' texture has no sharp
      // lines (the lineup reads from a soft brightness gradient).
      const blurPx = optsRef.current.blur ?? 7;
      const soft = document.createElement('canvas');
      soft.width = W;
      soft.height = H;
      const sctx = soft.getContext('2d');
      sctx.filter = `blur(${blurPx}px)`;
      sctx.drawImage(tc, 0, 0);

      swarm.build(W, H, dpr, soft);

      // Crisp stroked overlay on top of the swarm (aligned to the same layout).
      const ov = overlayRef.current;
      if (ov) {
        ov.width = Math.floor(W * dpr);
        ov.height = Math.floor(H * dpr);
        ov.style.width = `${W}px`;
        ov.style.height = `${H}px`;
        const octx = ov.getContext('2d');
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.clearRect(0, 0, W, H);
        if (optsRef.current.overlay) optsRef.current.overlay(octx, W, H);
      }
    }

    function frame(now) {
      if (cancelled) return;
      if (!start) start = now;
      const opts = optsRef.current;
      if (opts.interactive) {
        hover.value += (hover.target - hover.value) * 0.12;
        swarm.setHot(hitScreen, hover.value * ((opts.interactive.hoverIntensity ?? 1.8) - 1));
      }
      swarm.render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }

    function pointIn(e) {
      if (!hitScreen) return false;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return x >= hitScreen.x && x <= hitScreen.x + hitScreen.w && y >= hitScreen.y && y <= hitScreen.y + hitScreen.h;
    }
    const onMove = (e) => {
      const inside = pointIn(e);
      hover.target = inside ? 1 : 0;
      canvas.style.cursor = inside ? 'pointer' : 'default';
    };
    const onLeave = () => {
      hover.target = 0;
      canvas.style.cursor = 'default';
    };
    const onClick = (e) => {
      if (pointIn(e)) optsRef.current.interactive?.onClick?.(e);
    };

    let ro = null;
    let timer = 0;
    (async () => {
      await fontsReady();
      if (cancelled) return;
      buildScene();
      raf = requestAnimationFrame(frame);
      ro = new ResizeObserver(() => {
        const p = canvas.parentElement;
        if (Math.abs(p.clientWidth - dims.W) < 2 && Math.abs(p.clientHeight - dims.H) < 2) return;
        clearTimeout(timer);
        timer = setTimeout(() => !cancelled && buildScene(), 140);
      });
      ro.observe(canvas.parentElement);
      if (optsRef.current.interactive) {
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerleave', onLeave);
        canvas.addEventListener('click', onClick);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (ro) ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      swarm.dispose();
    };
  }, []);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} />
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          mixBlendMode: overlayBlend,
        }}
      />
    </div>
  );
}
