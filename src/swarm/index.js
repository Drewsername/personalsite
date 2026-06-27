// Public surface of the swarm rendering system.
export { GLSwarmView } from './GLSwarmView.jsx';
export { GLSwarm } from './glswarm.js';
export { textPaint, buttonPaint, scenePaint, colorScenePaint } from './paints.js';

// Canvas-2D fallback engine (kept for reference / non-WebGL use).
export { Swarm, SwarmText, SwarmButton } from './Swarm.jsx';
export { useSwarm } from './useSwarm.js';
export { SwarmEngine } from './engine.js';
export { SwarmRenderer } from './renderer.js';
export { Field, buildField } from './field.js';
