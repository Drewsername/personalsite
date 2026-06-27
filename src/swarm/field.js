// field.js — the "rendered" target the swarm reveals.
//
// A target (text, a button, any drawing) is rasterized once into a low-res
// coverage buffer. Each frame, every drifting sphere samples this field at its
// current screen position to decide how much of its white face to show. The
// field is the ONLY thing that knows what's being drawn — give it a different
// paint() and the same swarm reveals something else.

export class Field {
  constructor(data, w, h, q) {
    this.d = data; // Float32, coverage ∈ [0,1], row-major
    this.w = w;
    this.h = h;
    this.q = q; // screen px per field texel (downsample factor)
  }

  // Bilinear sample at SCREEN-space (CSS px) coordinates. Outside ⇒ 0.
  sample(sx, sy) {
    const x = sx / this.q;
    const y = sy / this.q;
    if (x < 0 || y < 0 || x > this.w - 1 || y > this.h - 1) return 0;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i = y0 * this.w + x0;
    const right = x0 < this.w - 1 ? 1 : 0;
    const down = y0 < this.h - 1 ? this.w : 0;
    const a = this.d[i];
    const b = this.d[i + right];
    const c = this.d[i + down];
    const e = this.d[i + down + right];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
  }
}

// Separable box blur (two-pass), radius r in texels — softens the field so a
// ball "rotates" its face in/out gradually as it crosses an edge.
function boxBlur(src, w, h, r) {
  if (r < 1) return src;
  const norm = 1 / (2 * r + 1);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const clamp = (v, hi) => (v < 0 ? 0 : v > hi ? hi : v);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[row + clamp(k, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc * norm;
      acc += src[row + clamp(x + r + 1, w - 1)] - src[row + clamp(x - r, w - 1)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[clamp(k, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc * norm;
      acc += tmp[clamp(y + r + 1, h - 1) * w + x] - tmp[clamp(y - r, h - 1) * w + x];
    }
  }
  return out;
}

// Rasterize a paint() callback into a Field. paint(ctx, W, H) draws white on
// transparent in SCREEN coordinates and may return { hit } (e.g. a button's
// clickable rect). q downsamples; blurR softens edges (texels).
export function buildField(paint, W, H, { q = 2, blurR = 4 } = {}) {
  const fw = Math.max(1, Math.ceil(W / q));
  const fh = Math.max(1, Math.ceil(H / q));
  const c = document.createElement('canvas');
  c.width = fw;
  c.height = fh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(1 / q, 0, 0, 1 / q, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const meta = paint(ctx, W, H) || {};
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const img = ctx.getImageData(0, 0, fw, fh).data;
  let f = new Float32Array(fw * fh);
  for (let p = 0, i = 0; p < img.length; p += 4, i++) {
    const alpha = img[p + 3] / 255;
    const lum = (0.299 * img[p] + 0.587 * img[p + 1] + 0.114 * img[p + 2]) / 255;
    f[i] = alpha * lum;
  }
  if (blurR >= 1) f = boxBlur(f, fw, fh, Math.round(blurR));

  return { field: new Field(f, fw, fh, q), hit: meta.hit || null };
}
