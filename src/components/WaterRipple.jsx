import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function WaterRipple({ active, onPeakDistortion, onComplete }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const ripplesRef = useRef([]);
  const startTimeRef = useRef(null);
  const lastDropRef = useRef(0);
  const turbulenceRef = useRef(null);
  const displacementRef = useRef(null);
  const peakFiredRef = useRef(false);

  // Timing: ramp up → peak (swap happens here) → ramp down (new layout revealed)
  const RAMP_UP = 2500;
  const PEAK_HOLD = 400;
  const RAMP_DOWN = 1000;
  const TOTAL = RAMP_UP + PEAK_HOLD + RAMP_DOWN;

  const MAX_SCALE = 55;
  const MAX_FREQ = 0.02;

  const createRipple = useCallback((canvas) => {
    ripplesRef.current.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0,
      maxRadius: 60 + Math.random() * 140,
      opacity: 0.5 + Math.random() * 0.5,
      speed: 1.2 + Math.random() * 2.5,
      lineWidth: 0.5 + Math.random() * 2,
    });
  }, []);

  useEffect(() => {
    if (!active) {
      // Reset filter when not active
      if (displacementRef.current) displacementRef.current.setAttribute("scale", "0");
      if (turbulenceRef.current) turbulenceRef.current.setAttribute("baseFrequency", "0 0");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    startTimeRef.current = performance.now();
    lastDropRef.current = 0;
    peakFiredRef.current = false;
    ripplesRef.current = [];

    const animate = (time) => {
      const elapsed = time - startTimeRef.current;

      if (elapsed > TOTAL) {
        if (displacementRef.current) displacementRef.current.setAttribute("scale", "0");
        if (turbulenceRef.current) turbulenceRef.current.setAttribute("baseFrequency", "0 0");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      // Calculate distortion intensity with easing
      let intensity;
      if (elapsed < RAMP_UP) {
        const t = elapsed / RAMP_UP;
        // Slow start, accelerating (cubic ease-in)
        intensity = t * t * t;
      } else if (elapsed < RAMP_UP + PEAK_HOLD) {
        intensity = 1;
        if (!peakFiredRef.current) {
          peakFiredRef.current = true;
          onPeakDistortion?.();
        }
      } else {
        const t = (elapsed - RAMP_UP - PEAK_HOLD) / RAMP_DOWN;
        // Fast ease-out — water settles quickly
        intensity = Math.max(0, (1 - t) * (1 - t) * (1 - t));
      }

      // Update SVG displacement filter — this distorts the actual DOM content
      const scale = intensity * MAX_SCALE;
      const freq = 0.003 + intensity * MAX_FREQ;

      if (turbulenceRef.current) {
        turbulenceRef.current.setAttribute("baseFrequency", `${freq} ${freq * 0.7}`);
      }
      if (displacementRef.current) {
        displacementRef.current.setAttribute("scale", String(scale));
      }

      // Canvas: draw visual ripple rings on top
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only spawn new drops during ramp-up and peak
      if (elapsed < RAMP_UP + PEAK_HOLD) {
        const progress = Math.min(elapsed / RAMP_UP, 1);
        const interval = 500 - progress * 420;

        if (time - lastDropRef.current > interval) {
          createRipple(canvas);
          if (progress > 0.4) createRipple(canvas);
          if (progress > 0.7) {
            createRipple(canvas);
            createRipple(canvas);
          }
          lastDropRef.current = time;
        }
      }

      // Fade ripple visuals during ramp-down
      const rippleAlpha =
        elapsed > RAMP_UP + PEAK_HOLD
          ? Math.max(0, 1 - (elapsed - RAMP_UP - PEAK_HOLD) / (RAMP_DOWN * 0.6))
          : 1;

      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += ripple.speed;
        const rp = ripple.radius / ripple.maxRadius;
        const alpha = ripple.opacity * (1 - rp) * rippleAlpha;

        if (alpha <= 0.005) return false;

        // Radial glow that travels with the ring
        if (rp < 0.5) {
          const glowGrad = ctx.createRadialGradient(
            ripple.x, ripple.y, ripple.radius * 0.8,
            ripple.x, ripple.y, ripple.radius * 1.2
          );
          glowGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
          glowGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.12})`);
          glowGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Outer ring
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = ripple.lineWidth * 1.5;
        ctx.stroke();

        // Mid ring
        if (ripple.radius > 6) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
          ctx.lineWidth = ripple.lineWidth * 0.8;
          ctx.stroke();
        }

        // Inner ring
        if (ripple.radius > 18) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.12})`;
          ctx.lineWidth = ripple.lineWidth * 0.5;
          ctx.stroke();
        }

        // Impact flash — bright burst at drop point
        if (rp < 0.1) {
          const flashAlpha = (1 - rp / 0.1) * alpha;
          const flashGrad = ctx.createRadialGradient(
            ripple.x, ripple.y, 0,
            ripple.x, ripple.y, 8
          );
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha * 0.9})`);
          flashGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = flashGrad;
          ctx.fill();
        }

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (displacementRef.current) displacementRef.current.setAttribute("scale", "0");
      if (turbulenceRef.current) turbulenceRef.current.setAttribute("baseFrequency", "0 0");
    };
  }, [active, onComplete, onPeakDistortion, createRipple]);

  return (
    <>
      {/* SVG filter: feTurbulence generates noise, feDisplacementMap warps content */}
      <svg
        style={{ position: "absolute", width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="water-distort" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0 0"
              numOctaves="2"
              seed="3"
              result="turbulence"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="turbulence"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      {/* Canvas overlay for visual ripple rings */}
      {active && (
        <motion.canvas
          ref={canvasRef}
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </>
  );
}
