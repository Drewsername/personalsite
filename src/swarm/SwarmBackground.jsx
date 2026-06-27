// SwarmBackground — the swarm as a fixed, full-viewport background layer for the
// site. Exposes an imperative API so a scroll controller can re-form it per
// section. The crisp outline overlay shows the hero name and is faded out (by
// the controller) as you scroll into content where real DOM headings take over.

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { GLSwarm } from './glswarm.js';

function blurredMask(paint, W, H, blurPx) {
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

export const SwarmBackground = forwardRef(function SwarmBackground(
  { initial, initialOutline, config, blur = 1 },
  ref,
) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const swarmRef = useRef(null);
  const st = useRef({ W: 0, H: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    let swarm;
    try {
      swarm = new GLSwarm(canvas, config);
    } catch (e) {
      console.error('GLSwarm init failed:', e);
      return;
    }
    swarmRef.current = swarm;
    let raf = 0;
    let start = 0;
    let cancelled = false;
    let timer = 0;

    function size() {
      const W = Math.max(1, Math.floor(window.innerWidth));
      const H = Math.max(1, Math.floor(window.innerHeight));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      st.current = { W, H, dpr };
      return st.current;
    }

    function drawOutline() {
      const ov = overlayRef.current;
      const { W, H, dpr } = st.current;
      ov.width = Math.floor(W * dpr);
      ov.height = Math.floor(H * dpr);
      ov.style.width = `${W}px`;
      ov.style.height = `${H}px`;
      const octx = ov.getContext('2d');
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, W, H);
      if (initialOutline) initialOutline(octx, W, H);
    }

    function build() {
      const { W, H, dpr } = size();
      swarm.build(W, H, dpr, blurredMask(initial, W, H, blur));
      drawOutline();
    }

    function frame(now) {
      if (cancelled) return;
      if (!start) start = now;
      swarm.render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }

    build();
    raf = requestAnimationFrame(frame);
    // Guard against a mount-time race where the viewport isn't final yet and
    // the balls distribute short. Only rebuild if the size actually changed, so
    // a normal load doesn't re-randomise every ball (which would visibly pop).
    const settleTimer = setTimeout(() => {
      if (cancelled) return;
      const W = Math.floor(window.innerWidth);
      const H = Math.floor(window.innerHeight);
      if (W !== st.current.W || H !== st.current.H) build();
    }, 250);
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(build, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearTimeout(settleTimer);
      window.removeEventListener('resize', onResize);
      swarm.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    morphTo(maskPaint, durMs = 850) {
      const swarm = swarmRef.current;
      if (!swarm) return;
      const { W, H } = st.current;
      swarm.setTarget(blurredMask(maskPaint, W, H, blur), durMs);
    },
    setOutlineOpacity(v) {
      if (overlayRef.current) overlayRef.current.style.opacity = String(v);
    },
  }));

  const layer = { position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%' };
  return (
    <>
      <canvas ref={canvasRef} style={layer} />
      <canvas
        ref={overlayRef}
        style={{ ...layer, pointerEvents: 'none', mixBlendMode: 'overlay', transition: 'opacity 0.5s ease' }}
      />
    </>
  );
});
