// Pure pixel math shared by the worker and synchronous fallback.
const EDT_INF = 1e20;
function edt1d(f, n, scratch) {
  const { d, v, z } = scratch;
  v[0] = 0;
  z[0] = -EDT_INF;
  z[1] = EDT_INF;
  let k = 0;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = EDT_INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
  }
  for (let q = 0; q < n; q++) f[q] = d[q];
}

// Full 2-D squared Euclidean distance transform, in place over `grid` (W×H).
function edt2d(grid, W, H) {
  const m = Math.max(W, H);
  const scratch = { d: new Float64Array(m), v: new Int32Array(m), z: new Float64Array(m + 1) };
  const col = new Float64Array(H);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) col[y] = grid[y * W + x];
    edt1d(col, H, scratch);
    for (let y = 0; y < H; y++) grid[y * W + x] = col[y];
  }
  const row = new Float64Array(W);
  for (let y = 0; y < H; y++) {
    const off = y * W;
    for (let x = 0; x < W; x++) row[x] = grid[off + x];
    edt1d(row, W, scratch);
    for (let x = 0; x < W; x++) grid[off + x] = row[x];
  }
}

export function buildSDFPixels(src, W, H, spread) {
  const N = W * H;

  // Distance from outside pixels to the nearest inside pixel, and vice versa.
  const outer = new Float64Array(N);
  const inner = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const inside = src[i * 4 + 3] > 127; // alpha
    outer[i] = inside ? 0 : EDT_INF;
    inner[i] = inside ? EDT_INF : 0;
  }
  edt2d(outer, W, H);
  edt2d(inner, W, H);

  const out = new Uint8ClampedArray(N * 4);
  const inv = 1 / (2 * spread);
  for (let i = 0; i < N; i++) {
    const signed = Math.sqrt(outer[i]) - Math.sqrt(inner[i]); // >0 outside, <0 inside
    let v = 0.5 + signed * inv;
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    const b = v * 255;
    const o = i * 4;
    out[o] = b;
    out[o + 1] = b;
    out[o + 2] = b;
    out[o + 3] = 255;
  }
  return out;
}
