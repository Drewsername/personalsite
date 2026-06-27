// Swarm.jsx — React surface for the swarm renderer.
//   <Swarm paint={(ctx,W,H)=>{…}} />   low-level: reveal anything you can draw
//   <SwarmText>Drew Bermudez</…>       text → swarm
//   <SwarmButton onClick>Enter</…>     interactive button → swarm

import { useRef } from 'react';
import { textPaint, buttonPaint } from './paints.js';
import { useSwarm } from './useSwarm.js';

const fill = { position: 'relative', width: '100%', height: '100%' };
const canvasStyle = { display: 'block', width: '100%', height: '100%' };

export function Swarm({ paint, config, interactive, fieldQ, fieldBlur, className, style }) {
  const ref = useRef(null);
  useSwarm(ref, { paint, config, interactive, fieldQ, fieldBlur });
  return (
    <div className={className} style={{ ...fill, ...style }}>
      <canvas ref={ref} style={canvasStyle} />
    </div>
  );
}

export function SwarmText({
  children,
  fontWeight = 700,
  letterSpacing = 2,
  wFrac = 0.84,
  hFrac = 0.5,
  config,
  className,
  style,
}) {
  const ref = useRef(null);
  const text = String(children);
  useSwarm(ref, {
    paint: textPaint(text, { fontWeight, letterSpacing, wFrac, hFrac }),
    config: {
      ballRadius: [9, 26],
      density: 0.0013,
      maxCount: 2600,
      speed: 22,
      capFrac: 0.86,
      spin: [0.2, 0.9],
      ...config,
    },
  });
  return (
    <div className={className} style={{ ...fill, ...style }} aria-label={text} role="img">
      <canvas ref={ref} style={canvasStyle} />
    </div>
  );
}

export function SwarmButton({
  children,
  onClick,
  width = 360,
  height = 140,
  letterSpacing = 3,
  config,
  className,
  style,
}) {
  const ref = useRef(null);
  const label = String(children);
  useSwarm(ref, {
    paint: buttonPaint(label, { letterSpacing }),
    interactive: { onClick, hoverIntensity: 2, hoverCapScale: 1.3 },
    config: {
      ballRadius: [4, 12],
      density: 0.004,
      maxCount: 700,
      speed: 15,
      capFrac: 0.85,
      spin: [0.3, 1.2],
      ...config,
    },
  });
  return (
    <div
      className={className}
      style={{ position: 'relative', width, height, ...style }}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
    >
      <canvas ref={ref} style={canvasStyle} />
    </div>
  );
}
