// renderer.js — paints the swarm as matte, shaded spheres.
//
// Two sprites are baked once: a DARK shaded sphere and a WHITE shaded sphere,
// lit from the same direction. Each ball draws the dark sphere, then — where it
// has a painted cap — draws the white sphere clipped to the cap ellipse. Because
// both sprites share the same lighting and footprint, the white reads as paint
// on the very same ball (a moon-phase terminator), never an emissive "eye".

const SIZE = 128;
const LIGHT = { x: -0.4, y: -0.46 }; // screen-space light offset (upper-left)

function shadedSphere(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d');
  const cx = SIZE / 2;
  const r = SIZE / 2 - 2;
  const hx = cx + LIGHT.x * r;
  const hy = cx + LIGHT.y * r;
  const g = ctx.createRadialGradient(hx, hy, r * 0.04, cx, cx, r);
  for (const [at, col] of stops) g.addColorStop(at, col);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

export class SwarmRenderer {
  constructor() {
    // Dark drifting sphere: subtle highlight, near-black body.
    this.dark = shadedSphere([
      [0.0, '#3a4151'],
      [0.32, '#222734'],
      [0.7, '#12151d'],
      [1.0, '#080a10'],
    ]);
    // White-painted sphere: bright highlight → shaded toward the terminator.
    this.light = shadedSphere([
      [0.0, '#ffffff'],
      [0.3, '#eef2f8'],
      [0.66, '#c2cbd9'],
      [1.0, '#7c8696'],
    ]);
    this.order = [];
  }

  render(ctx, list, { W, H }) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // Far → near so nearer balls (and their paint) overlap farther ones.
    if (this.order.length !== list.length) this.order = list.map((_, i) => i);
    this.order.sort((a, b) => list[a].depth - list[b].depth);

    for (const i of this.order) {
      const s = list[i];
      if (!(s.R > 0.5)) continue;
      const fog = 0.45 + 0.55 * s.depth;
      const D = s.R * 2;

      // Dark sphere body.
      ctx.globalAlpha = fog;
      ctx.drawImage(this.dark, s.x - s.R, s.y - s.R, D, D);

      // White painted cap, clipped to its (foreshortened) ellipse. The white
      // sprite's own circular falloff handles the sphere silhouette, so the
      // result is a clean moon-phase patch.
      const cap = s.cap;
      if (cap && cap.alpha > 0.01 && cap.rx > 0.15 && cap.ry > 0.15) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cap.sx, cap.sy, cap.rx, cap.ry, cap.rot, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = fog * cap.alpha;
        ctx.drawImage(this.light, s.x - s.R, s.y - s.R, D, D);
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
  }
}
