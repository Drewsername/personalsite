import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function WaterRipple({ active, onComplete }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const ripplesRef = useRef([]);
  const startTimeRef = useRef(null);
  const lastDropRef = useRef(0);

  const DURATION = 3500;
  const DROP_INTERVAL_START = 400;
  const DROP_INTERVAL_END = 80;

  const createRipple = useCallback((canvas) => {
    ripplesRef.current.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0,
      maxRadius: 80 + Math.random() * 120,
      opacity: 0.6 + Math.random() * 0.4,
      speed: 1.5 + Math.random() * 2,
      lineWidth: 1 + Math.random() * 2,
    });
  }, []);

  useEffect(() => {
    if (!active) return;

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

    const animate = (time) => {
      const elapsed = time - startTimeRef.current;

      if (elapsed > DURATION) {
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = elapsed / DURATION;
      const interval =
        DROP_INTERVAL_START +
        (DROP_INTERVAL_END - DROP_INTERVAL_START) * progress;

      if (time - lastDropRef.current > interval) {
        createRipple(canvas);
        // Add extra ripples as intensity increases
        if (progress > 0.5) createRipple(canvas);
        if (progress > 0.8) createRipple(canvas);
        lastDropRef.current = time;
      }

      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += ripple.speed;
        const rippleProgress = ripple.radius / ripple.maxRadius;
        const alpha = ripple.opacity * (1 - rippleProgress);

        if (alpha <= 0.01) return false;

        // Outer ring
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
        ctx.lineWidth = ripple.lineWidth;
        ctx.stroke();

        // Inner ring
        if (ripple.radius > 5) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
          ctx.lineWidth = ripple.lineWidth * 0.5;
          ctx.stroke();
        }

        // Second inner ring for more detail
        if (ripple.radius > 15) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.08})`;
          ctx.lineWidth = ripple.lineWidth * 0.3;
          ctx.stroke();
        }

        // Impact dot
        if (rippleProgress < 0.08) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.fill();
        }

        return true;
      });

      // Subtle wash that builds
      const distortAlpha = progress * 0.02;
      ctx.fillStyle = `rgba(255, 255, 255, ${distortAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active, onComplete, createRipple]);

  if (!active) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    />
  );
}
