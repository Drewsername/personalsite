// SwarmBackground — the swarm as a fixed, full-viewport ball field whose mask is
// a document-tall canvas. Each section's word is drawn at its real page position
// and the renderer slides the mask by scrollY, so words scroll up and clip off
// like normal text. A crisp outline overlay (the hero name) scrolls in normal
// document flow so it stays locked to the mask word.

import { useEffect, useRef } from 'react';
import { GLSwarm } from './glswarm.js';
import { tallMaskPaint, tallOutlinePaint } from './paints.js';

function paintCanvas(W, H, blurPx, paint) {
  const tc = document.createElement('canvas');
  tc.width = W;
  tc.height = H;
  const ctx = tc.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  paint(ctx, W, H);
  if (!blurPx) return tc;
  const soft = document.createElement('canvas');
  soft.width = W;
  soft.height = H;
  const sctx = soft.getContext('2d');
  sctx.filter = `blur(${blurPx}px)`;
  sctx.drawImage(tc, 0, 0);
  return soft;
}

export function SwarmBackground({ words = [], outlineWords = [], config, blur = 1 }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    let swarm;
    try {
      swarm = new GLSwarm(canvas, config);
    } catch (e) {
      console.error('GLSwarm init failed:', e);
      return;
    }
    let raf = 0;
    let start = 0;
    let cancelled = false;
    let rTimer = 0;
    const last = { W: 0, H: 0, heroH: 0 };

    // Measure the viewport + each word's centre in document coordinates.
    function measure() {
      // clientWidth excludes the vertical scrollbar — using innerWidth would
      // make the absolute overlay overflow and add a horizontal scrollbar.
      const W = Math.max(1, Math.floor(document.documentElement.clientWidth));
      const H = Math.max(1, Math.floor(window.innerHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const docH = Math.max(H, Math.ceil(document.documentElement.scrollHeight));
      // On narrow screens use more width, and break multi-word names onto
      // separate lines so each line is bigger and more legible.
      const mobile = W < 600;
      const wFrac = mobile ? 0.86 : 0.74;
      const hPx = Math.round(H * 0.18);
      const toLines = (t) => (mobile && t.trim().includes(' ') ? t.trim().split(/\s+/) : [t]);
      const place = (list) =>
        list
          .map((w) => {
            const el = document.getElementById(w.id);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { lines: toLines(w.text), cy: r.top + window.scrollY + r.height / 2 };
          })
          .filter(Boolean);
      // Hero band: the #top section. The name fades out across its height.
      const topEl = document.getElementById('top');
      const tr = topEl && topEl.getBoundingClientRect();
      const heroH = tr ? tr.height : H;
      const heroEnd = tr ? tr.top + window.scrollY + tr.height : H;
      return { W, H, dpr, docH, hPx, wFrac, heroH, heroEnd, words: place(words), outWords: place(outlineWords) };
    }

    function maskFor(m) {
      return paintCanvas(m.W, m.docH, blur, tallMaskPaint(m.words, { hPx: m.hPx, wFrac: m.wFrac }));
    }

    function drawOverlay(m) {
      const ov = overlayRef.current;
      if (!ov) return;
      const oh = m.outWords.length
        ? Math.min(m.docH, Math.ceil(Math.max(...m.outWords.map((w) => w.cy)) + m.hPx * 1.4))
        : 1;
      ov.width = m.W;
      ov.height = Math.max(1, oh);
      ov.style.width = `${m.W}px`;
      ov.style.height = `${oh}px`;
      const octx = ov.getContext('2d');
      octx.clearRect(0, 0, ov.width, ov.height);
      if (m.outWords.length) {
        // Soft, blurred outline: adds shape/contrast to the name without a hard,
        // obviously-drawn stroke — it melts into the swarm field behind it.
        octx.filter = `blur(${Math.max(0, Math.round(m.hPx * 0.016))}px)`;
        tallOutlinePaint(m.outWords, { hPx: m.hPx, wFrac: m.wFrac, opacity: 0.44 })(octx, m.W);
        octx.filter = 'none';
      }
    }

    function buildAll() {
      const m = measure();
      last.W = m.W;
      last.H = m.H;
      last.heroH = m.heroH;
      swarm.heroEnd = m.heroEnd;
      canvas.width = Math.floor(m.W * m.dpr);
      canvas.height = Math.floor(m.H * m.dpr);
      canvas.style.width = `${m.W}px`;
      canvas.style.height = `${m.H}px`;
      swarm.build(m.W, m.H, m.dpr, maskFor(m), m.docH);
      drawOverlay(m);
    }

    // Re-place the words without re-seeding the balls (used when only the page
    // height changed, e.g. fonts/images settling — avoids a visible ball pop).
    function remask() {
      const m = measure();
      last.heroH = m.heroH;
      swarm.heroEnd = m.heroEnd;
      swarm.setMask(maskFor(m), m.docH);
      drawOverlay(m);
    }

    function frame(now) {
      if (cancelled) return;
      if (!start) start = now;
      const sc = window.scrollY || window.pageYOffset || 0;
      swarm.setScroll(sc);
      // Fade the hero name out over ~70% of the hero's height.
      const fade = last.heroH ? Math.min(1, sc / (last.heroH * 0.7)) : 0;
      swarm.setNameFade(fade);
      if (overlayRef.current) overlayRef.current.style.opacity = String(1 - fade);
      swarm.render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }

    buildAll();
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        if (!cancelled) buildAll();
      }, 150);
    };
    window.addEventListener('resize', onResize);

    // Content reflow (fonts/images) changes section positions → re-place words.
    const ro = new ResizeObserver(() => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        if (cancelled) return;
        const W = Math.floor(document.documentElement.clientWidth);
        const H = Math.floor(window.innerHeight);
        if (W !== last.W || H !== last.H) buildAll();
        else remask();
      }, 150);
    });
    ro.observe(document.body);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(rTimer);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      swarm.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%' }} />
      <canvas
        ref={overlayRef}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none', mixBlendMode: 'overlay' }}
      />
    </>
  );
}
