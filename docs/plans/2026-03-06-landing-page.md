# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal landing page that loads as plain text, reveals water ripples, then transforms into a polished glassmorphic layout.

**Architecture:** Single-page React app with 3 phases: plain text render, canvas water ripple overlay, Framer Motion layout transformation. State machine drives phase transitions. All monochrome.

**Tech Stack:** React, Framer Motion, Canvas 2D (ripple shader), Tailwind CSS v4

---

### Task 1: Google Font + Base Styles

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

**Step 1: Add JetBrains Mono font to index.html**

Add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

**Step 2: Add base styles to index.css**

```css
@import "tailwindcss";

@theme {
  --font-mono: "JetBrains Mono", monospace;
  --font-sans: "Inter", sans-serif;
}

html {
  background-color: #000;
  color: #e5e5e5;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

**Step 3: Verify dev server runs**

Run: `npm run dev`
Expected: Page loads with black background

**Step 4: Commit**

```bash
git add index.html src/index.css
git commit -m "feat: add fonts and base dark styles"
```

---

### Task 2: Plain Text Layout (Phase 1)

**Files:**
- Create: `src/components/PlainText.jsx`
- Modify: `src/App.jsx`

**Step 1: Create PlainText component**

This is the "boring" plain text state. Monospaced, left-aligned, minimal. Looks like a ~user page.

```jsx
import { motion } from "framer-motion";

const sections = [
  { id: "blog", label: "blog", desc: "writing about things" },
  { id: "book", label: "book", desc: "putting words in order" },
  { id: "built", label: "built", desc: "things i've made" },
  { id: "building", label: "building", desc: "things i'm making" },
];

export default function PlainText({ transformed }) {
  return (
    <motion.div
      layout
      className={`min-h-screen flex items-center transition-colors duration-1000 ${
        transformed ? "bg-[#0a0a0a]" : "bg-black"
      }`}
    >
      <div className={`w-full ${transformed ? "max-w-5xl mx-auto px-8" : "max-w-2xl mx-auto px-6"}`}>
        <motion.div layout className="mb-12">
          <motion.h1
            layout
            className={`font-mono font-bold ${
              transformed
                ? "text-5xl md:text-7xl font-sans tracking-tight text-white"
                : "text-lg text-neutral-400"
            }`}
            style={{ lineHeight: 1.1 }}
          >
            drew bermudez
          </motion.h1>
          <motion.p
            layout
            className={`font-mono mt-2 ${
              transformed
                ? "text-lg font-sans text-neutral-400 mt-4 max-w-md"
                : "text-sm text-neutral-600"
            }`}
          >
            software engineer & builder
          </motion.p>
        </motion.div>

        <motion.div
          layout
          className={
            transformed
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "flex flex-col gap-1"
          }
        >
          {sections.map((section, i) => (
            <SectionItem
              key={section.id}
              section={section}
              index={i}
              transformed={transformed}
            />
          ))}
        </motion.div>

        {!transformed && (
          <motion.p
            className="font-mono text-xs text-neutral-700 mt-8"
            exit={{ opacity: 0 }}
          >
            last updated 2026
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

function SectionItem({ section, index, transformed }) {
  if (transformed) {
    return (
      <motion.a
        layout
        href={`#${section.id}`}
        className="group block rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 20 }}
        whileHover={{ y: -2, scale: 1.01 }}
      >
        <h2 className="font-sans text-xl font-medium text-white mb-1">
          {section.label}
        </h2>
        <p className="font-sans text-sm text-neutral-500">{section.desc}</p>
      </motion.a>
    );
  }

  return (
    <motion.div layout className="font-mono text-sm">
      <span className="text-neutral-600">- </span>
      <a href={`#${section.id}`} className="text-neutral-400 hover:text-neutral-300">
        {section.label}
      </a>
    </motion.div>
  );
}
```

**Step 2: Wire up App.jsx with phase state machine**

```jsx
import { useState, useEffect } from "react";
import { LayoutGroup } from "framer-motion";
import PlainText from "./components/PlainText";

function App() {
  const [phase, setPhase] = useState("plain"); // plain -> ripple -> transform

  return (
    <LayoutGroup>
      <PlainText transformed={phase === "transform"} />
    </LayoutGroup>
  );
}

export default App;
```

**Step 3: Verify plain text state renders**

Run: `npm run dev`
Expected: Black page with monospace "drew bermudez" and text links

**Step 4: Commit**

```bash
git add src/components/PlainText.jsx src/App.jsx
git commit -m "feat: plain text landing page layout"
```

---

### Task 3: Water Ripple Canvas Effect

**Files:**
- Create: `src/components/WaterRipple.jsx`

**Step 1: Create the water ripple canvas overlay**

This uses Canvas 2D to simulate raindrops hitting a water surface, distorting what's behind it.

```jsx
import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function WaterRipple({ active, onComplete }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const ripplesRef = useRef([]);
  const startTimeRef = useRef(null);

  const DURATION = 3500; // total ripple phase duration in ms
  const DROP_INTERVAL_START = 400;
  const DROP_INTERVAL_END = 100;

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
    let lastDrop = 0;

    const animate = (time) => {
      const elapsed = time - startTimeRef.current;

      if (elapsed > DURATION) {
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Increase drop frequency over time
      const progress = elapsed / DURATION;
      const interval =
        DROP_INTERVAL_START +
        (DROP_INTERVAL_END - DROP_INTERVAL_START) * progress;

      if (time - lastDrop > interval) {
        createRipple(canvas);
        lastDrop = time;
      }

      // Draw ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += ripple.speed;
        const rippleProgress = ripple.radius / ripple.maxRadius;
        const alpha = ripple.opacity * (1 - rippleProgress);

        if (alpha <= 0.01) return false;

        // Outer ring
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
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

        // Highlight dot at impact
        if (rippleProgress < 0.1) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.fill();
        }

        return true;
      });

      // Subtle overall distortion overlay that increases
      const distortAlpha = progress * 0.03;
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
```

**Step 2: Commit**

```bash
git add src/components/WaterRipple.jsx
git commit -m "feat: water ripple canvas overlay effect"
```

---

### Task 4: Phase State Machine + Integration

**Files:**
- Modify: `src/App.jsx`

**Step 1: Wire up the full phase state machine**

```jsx
import { useState, useEffect, useCallback } from "react";
import { LayoutGroup, AnimatePresence } from "framer-motion";
import PlainText from "./components/PlainText";
import WaterRipple from "./components/WaterRipple";

function App() {
  const [phase, setPhase] = useState("plain");

  useEffect(() => {
    if (phase !== "plain") return;
    const timer = setTimeout(() => setPhase("ripple"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleRippleComplete = useCallback(() => {
    setPhase("transform");
  }, []);

  return (
    <>
      <LayoutGroup>
        <PlainText transformed={phase === "transform"} />
      </LayoutGroup>
      <AnimatePresence>
        {phase === "ripple" && (
          <WaterRipple active={true} onComplete={handleRippleComplete} />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
```

**Step 2: Verify full flow**

Run: `npm run dev`
Expected: Plain text (2s) -> ripples appear and intensify (3.5s) -> layout transforms with spring animations

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: phase state machine connecting ripple to transformation"
```

---

### Task 5: Hover Tilt Effect on Cards

**Files:**
- Create: `src/components/TiltCard.jsx`
- Modify: `src/components/PlainText.jsx`

**Step 1: Create TiltCard wrapper with magnetic 3D perspective**

```jsx
import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function TiltCard({ children, className }) {
  const ref = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRotateX((y - 0.5) * -10);
    setRotateY((x - 0.5) * 10);
    setGlarePos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
        }}
      />
    </motion.div>
  );
}
```

**Step 2: Wrap the transformed cards in PlainText.jsx with TiltCard**

In the `SectionItem` component, wrap the transformed card `<motion.a>` with `<TiltCard>`.

**Step 3: Commit**

```bash
git add src/components/TiltCard.jsx src/components/PlainText.jsx
git commit -m "feat: 3D tilt hover effect on section cards"
```

---

### Task 6: Polish + Smooth Scroll Fade

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/PlainText.jsx`

**Step 1: Add a cursor blink animation to plain text state**

Add a blinking cursor `_` after the name in the plain text state to sell the terminal aesthetic.

**Step 2: Add a subtle footer in the transformed state**

A minimal "drew bermudez -- 2026" footer that fades in.

**Step 3: Final CSS polish**

Ensure smooth transitions, no layout jumps, proper overflow handling.

**Step 4: Verify full experience end to end**

Run: `npm run dev`
Expected: Complete flow — plain text with blinking cursor -> ripples -> dramatic spring transformation -> tilt cards on hover

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish landing page with cursor blink and footer"
```

---
