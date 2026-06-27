// engine.js — a single field of spheres drifting across the whole window.
//
// Every sphere moves in a straight line at constant velocity and carries a white
// painted CAP on its surface (the rest is dark). Each frame it samples the
// target Field at its position to get µ ∈ [0,1] = how much it's over the
// "rendered" shape. µ sets the cap's tilt toward the camera:
//   • µ→1 (over the name): cap faces us → the ball looks white-painted
//   • µ≈½ (an edge):       cap sits at mid-latitude, a moon-phase terminator
//   • µ→0 (background):    cap is on the far side → a plain dark sphere
// The cap is offset along the ball's travel direction, so as a ball drifts onto
// and off the shape the paint rolls across its surface — natural, not pulsing.
// The name is continuously "painted" by whichever balls happen to be over it.

import { makeRng } from './noise.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const DEFAULTS = {
  seed: 7,
  density: 0.0014, // spheres per screen px² (count = density·W·H, clamped)
  count: null,
  maxCount: 2800,
  speed: 20, // constant drift px/s
  ballRadius: [8, 24],
  capAngle: 1.36, // angular radius of the painted cap (~78°): nearly a hemisphere
  edge0: 0.18, // field coverage → µ ramp
  edge1: 0.62,
  gamma: 0.8,
  fadeIn: 1.3,
};

export class SwarmEngine {
  constructor(field, size, config = {}) {
    this.field = field;
    this.W = size.W;
    this.H = size.H;
    this.cfg = { ...DEFAULTS, ...config };
    this.intensity = 1;
    this.capScale = 1;
    this.hotRect = null;
    this.hotBoost = 0;

    const rng = makeRng(this.cfg.seed);
    const [rMin, rMax] = this.cfg.ballRadius;
    let count = this.cfg.count ?? Math.round(this.cfg.density * this.W * this.H);
    count = Math.max(40, Math.min(this.cfg.maxCount, count));

    this.spheres = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.pow(rng(), 1.4); // 0 far/small, 1 near/big
      const R = rMin + (rMax - rMin) * depth;
      const ang = rng() * Math.PI * 2;
      const sp = this.cfg.speed * (0.5 + 0.9 * depth);
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp;
      this.spheres.push({
        x: R + rng() * Math.max(1, this.W - 2 * R),
        y: R + rng() * Math.max(1, this.H - 2 * R),
        vx,
        vy,
        R,
        depth,
        phi: Math.atan2(vy, vx) + Math.PI, // cap trails the direction of travel
      });
    }
    this.out = new Array(this.spheres.length);
  }

  update(t, dt) {
    const { field, cfg } = this;
    const W = this.W;
    const H = this.H;
    const d = Math.min(dt || 0.016, 0.05);
    const fade = cfg.fadeIn > 0 ? clamp01(t / cfg.fadeIn) : 1;

    const alpha = cfg.capAngle;
    const sinA = Math.sin(alpha);
    const visMax = Math.PI / 2 + alpha; // beyond this the cap is entirely on the far side
    const thetaMax = visMax + 0.12;

    for (let i = 0; i < this.spheres.length; i++) {
      const s = this.spheres[i];

      // Constant-velocity drift, bouncing off the window edges (billiard).
      s.x += s.vx * d;
      s.y += s.vy * d;
      let bounced = false;
      if (s.x < s.R) { s.x = s.R; s.vx = -s.vx; bounced = true; }
      else if (s.x > W - s.R) { s.x = W - s.R; s.vx = -s.vx; bounced = true; }
      if (s.y < s.R) { s.y = s.R; s.vy = -s.vy; bounced = true; }
      else if (s.y > H - s.R) { s.y = H - s.R; s.vy = -s.vy; bounced = true; }
      if (bounced) s.phi = Math.atan2(s.vy, s.vx) + Math.PI; // re-aim the roll

      const cov = field.sample(s.x, s.y);
      const mu = clamp01(Math.pow(smoothstep(cfg.edge0, cfg.edge1, cov), cfg.gamma));

      let inten = this.intensity;
      if (this.hotBoost > 0 && this.hotRect) {
        const r = this.hotRect;
        if (s.x >= r.x && s.x <= r.x + r.w && s.y >= r.y && s.y <= r.y + r.h) {
          inten *= 1 + this.hotBoost;
        }
      }

      const theta = thetaMax * (1 - mu); // 0 = facing camera, large = hidden
      let cap = null;
      if (theta < visMax) {
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        const off = s.R * sinT; // cap center offset from the ball center on screen
        const aMaj = s.R * sinA * this.capScale; // tangential radius
        const bMin = Math.max(0.04 * s.R, s.R * sinA * Math.abs(cosT)) * this.capScale; // radial (foreshortened)
        cap = {
          sx: s.x + off * Math.cos(s.phi),
          sy: s.y + off * Math.sin(s.phi),
          rx: bMin, // along phi (radial)
          ry: aMaj, // perpendicular (tangential)
          rot: s.phi,
          alpha: clamp01(fade * inten),
        };
      }

      this.out[i] = { x: s.x, y: s.y, R: s.R, depth: s.depth, cap };
    }
    return this.out;
  }
}
