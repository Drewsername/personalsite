// paints.js — paint callbacks that define the swarm's target. A paint draws
// white-on-transparent in screen coordinates; buildField turns it into a Field.
// Anything you can draw to a 2D context can be revealed by the swarm.

// A single full-screen target: a headline and a button laid out vertically.
// Returns the button's hit rect so the swarm can be clicked. This is the whole
// "render" — one field, balls drift across all of it.
export function scenePaint({
  name,
  button,
  fontFamily = '"JetBrains Mono", monospace',
  nameY = 0.43,
  buttonY = 0.72,
  nameWFrac = 0.78,
  nameHFrac = 0.2,
} = {}) {
  return (ctx, W, H) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Headline, auto-fit, filled. Small dense balls resolve the glyphs.
    const base = 120;
    const ls = 0.06;
    ctx.font = `700 ${base}px ${fontFamily}`;
    ctx.letterSpacing = `${base * ls}px`;
    const m = ctx.measureText(name);
    const asc = m.actualBoundingBoxAscent || base * 0.8;
    const desc = m.actualBoundingBoxDescent || base * 0.2;
    const fs = Math.min((nameWFrac * W) / m.width, (nameHFrac * H) / (asc + desc)) * base;
    ctx.font = `700 ${fs}px ${fontFamily}`;
    ctx.letterSpacing = `${fs * ls}px`;
    ctx.fillText(name, W / 2, H * nameY);

    // Button: outline + label, centered on buttonY.
    let bfs = Math.min(W * 0.028, 38);
    ctx.font = `600 ${bfs}px ${fontFamily}`;
    ctx.letterSpacing = `${bfs * 0.14}px`;
    const lw = ctx.measureText(button).width;
    const padX = bfs * 1.5;
    const padY = bfs * 0.7;
    const innerW = lw + padX * 2;
    const innerH = bfs + padY * 2;
    const bx = (W - innerW) / 2;
    const by = H * buttonY - innerH / 2;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(2.5, bfs * 0.08);
    roundRectPath(ctx, bx, by, innerW, innerH, innerH * 0.32);
    ctx.stroke();
    ctx.fillText(button, W / 2, by + innerH / 2);

    return { hit: { x: bx, y: by, w: innerW, h: innerH } };
  };
}

// Fit a word to a max width / max glyph-height; returns the font size in px.
function fitFontSize(ctx, text, maxW, maxH, fontFamily) {
  const base = 120;
  ctx.font = `700 ${base}px ${fontFamily}`;
  ctx.letterSpacing = `${base * 0.04}px`;
  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || base * 0.8;
  const desc = m.actualBoundingBoxDescent || base * 0.2;
  return Math.min(maxW / m.width, maxH / (asc + desc)) * base;
}

// Draw one word (possibly several stacked lines) centred at cy. All lines share
// the font size that makes the WIDEST line fit, so they stay aligned.
function drawStacked(ctx, lines, W, cy, wFrac, hPx, fontFamily, render) {
  let fs = Infinity;
  for (const ln of lines) fs = Math.min(fs, fitFontSize(ctx, ln, wFrac * W, hPx, fontFamily));
  ctx.font = `700 ${fs}px ${fontFamily}`;
  ctx.letterSpacing = `${fs * 0.04}px`;
  const lh = fs * 1.08;
  const n = lines.length;
  for (let i = 0; i < n; i++) {
    render(lines[i], W / 2, cy + (i - (n - 1) / 2) * lh, fs);
  }
}

// Draw words at absolute document positions onto a document-tall mask canvas.
// Each word: { lines: [..], cy } (cy = vertical centre in px). FILLED → the
// swarm's mask; the renderer slides it by scrollY so each word sits at its page
// position and scrolls off like normal text.
export function tallMaskPaint(words, { fontFamily = '"JetBrains Mono", monospace', wFrac = 0.74, hPx = 170 } = {}) {
  return (ctx, W) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const w of words) {
      drawStacked(ctx, w.lines || [w.text], W, w.cy, wFrac, hPx, fontFamily, (t, x, y) => ctx.fillText(t, x, y));
    }
  };
}

// The same words, STROKED → the crisp overlay outline (absolute doc positions).
export function tallOutlinePaint(words, { fontFamily = '"JetBrains Mono", monospace', wFrac = 0.74, hPx = 170, opacity = 0.5 } = {}) {
  return (ctx, W) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
    ctx.lineJoin = 'round';
    for (const w of words) {
      drawStacked(ctx, w.lines || [w.text], W, w.cy, wFrac, hPx, fontFamily, (t, x, y, fs) => {
        ctx.lineWidth = Math.max(1.5, fs * 0.02);
        ctx.strokeText(t, x, y);
      });
    }
  };
}

// A thin stroked outline of the same scene, to overlay ON TOP of the swarm so
// the text/button read as a crisp shape. Same layout as scenePaint → aligned.
export function sceneOutlinePaint({
  name,
  button,
  fontFamily = '"JetBrains Mono", monospace',
  nameY = 0.43,
  buttonY = 0.72,
  nameWFrac = 0.78,
  nameHFrac = 0.2,
  opacity = 0.5,
} = {}) {
  return (ctx, W, H) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
    ctx.lineJoin = 'round';

    const base = 120;
    const ls = 0.06;
    ctx.font = `700 ${base}px ${fontFamily}`;
    ctx.letterSpacing = `${base * ls}px`;
    const m = ctx.measureText(name);
    const asc = m.actualBoundingBoxAscent || base * 0.8;
    const desc = m.actualBoundingBoxDescent || base * 0.2;
    const fs = Math.min((nameWFrac * W) / m.width, (nameHFrac * H) / (asc + desc)) * base;
    ctx.font = `700 ${fs}px ${fontFamily}`;
    ctx.letterSpacing = `${fs * ls}px`;
    ctx.lineWidth = Math.max(1.5, fs * 0.02);
    ctx.strokeText(name, W / 2, H * nameY);

    const bfs = Math.min(W * 0.028, 38);
    ctx.font = `600 ${bfs}px ${fontFamily}`;
    ctx.letterSpacing = `${bfs * 0.14}px`;
    const lw = ctx.measureText(button).width;
    const padX = bfs * 1.5;
    const padY = bfs * 0.7;
    const innerW = lw + padX * 2;
    const innerH = bfs + padY * 2;
    const bx = (W - innerW) / 2;
    const by = H * buttonY - innerH / 2;
    ctx.lineWidth = Math.max(1.5, bfs * 0.07);
    roundRectPath(ctx, bx, by, innerW, innerH, innerH * 0.32);
    ctx.stroke();
    ctx.strokeText(button, W / 2, by + innerH / 2);
  };
}

// Colored full-screen target for the WebGL swarm: a gradient headline + button.
// RGB here is exactly what the balls' faces show, so this is the "image" the
// swarm carries. Returns the button hit rect.
export function colorScenePaint({
  name,
  button,
  fontFamily = '"JetBrains Mono", monospace',
  nameY = 0.43,
  buttonY = 0.72,
  nameWFrac = 0.8,
  nameHFrac = 0.2,
  colors = ['#5bdcff', '#8aa2ff', '#e8b8ff', '#ffffff'],
} = {}) {
  return (ctx, W, H) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const base = 120;
    const ls = 0.04;
    ctx.font = `700 ${base}px ${fontFamily}`;
    ctx.letterSpacing = `${base * ls}px`;
    const m = ctx.measureText(name);
    const asc = m.actualBoundingBoxAscent || base * 0.8;
    const desc = m.actualBoundingBoxDescent || base * 0.2;
    const fs = Math.min((nameWFrac * W) / m.width, (nameHFrac * H) / (asc + desc)) * base;
    ctx.font = `700 ${fs}px ${fontFamily}`;
    ctx.letterSpacing = `${fs * ls}px`;

    const half = (m.width / base) * fs * 0.5;
    const grad = ctx.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillText(name, W / 2, H * nameY);

    let bfs = Math.min(W * 0.028, 38);
    ctx.font = `600 ${bfs}px ${fontFamily}`;
    ctx.letterSpacing = `${bfs * 0.14}px`;
    const lw = ctx.measureText(button).width;
    const padX = bfs * 1.5;
    const padY = bfs * 0.7;
    const innerW = lw + padX * 2;
    const innerH = bfs + padY * 2;
    const bx = (W - innerW) / 2;
    const by = H * buttonY - innerH / 2;
    ctx.strokeStyle = '#7fe9ff';
    ctx.fillStyle = '#cfeaff';
    ctx.lineWidth = Math.max(2.5, bfs * 0.08);
    roundRectPath(ctx, bx, by, innerW, innerH, innerH * 0.32);
    ctx.stroke();
    ctx.fillText(button, W / 2, by + innerH / 2);

    return { hit: { x: bx, y: by, w: innerW, h: innerH } };
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw a word (one or more stacked lines) horizontally centred in a W×H canvas
// at vertical position `cyFrac` (fraction of height) — the source art for a
// per-word signed distance field. Filled white on transparent.
export function centeredWordPaint(lines, { fontFamily = '"JetBrains Mono", monospace', wFrac = 0.74, hPx = 170, cyFrac = 0.5 } = {}) {
  return (ctx, W, H) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawStacked(ctx, lines, W, H * cyFrac, wFrac, hPx, fontFamily, (t, x, y) => ctx.fillText(t, x, y));
  };
}

// 1-D squared-distance transform (Felzenszwalb & Huttenlocher). `f` holds the
// per-cell cost; returns the squared distance to the nearest zero-cost cell.
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

// Turn a filled white-on-transparent mask canvas into a signed-distance-field
// canvas: the red channel encodes distance to the glyph edge, with 0.5 exactly
// on the edge, <0.5 inside the glyph, >0.5 outside. `spread` (px) is the range
// the ±0.5 band covers — larger spread morphs as bigger, slower-travelling
// blobs. The blend of two such fields is a smooth in-between shape.
export function buildSDFCanvas(maskCanvas, spread) {
  const W = maskCanvas.width;
  const H = maskCanvas.height;
  const src = maskCanvas.getContext('2d').getImageData(0, 0, W, H).data;
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
  const cnv = document.createElement('canvas');
  cnv.width = W;
  cnv.height = H;
  cnv.getContext('2d').putImageData(new ImageData(out, W, H), 0, 0);
  return cnv;
}

// Centered text, auto-fit to a fraction of the canvas.
export function textPaint(text, opts = {}) {
  const {
    fontFamily = '"JetBrains Mono", monospace',
    fontWeight = 700,
    letterSpacing = 0,
    wFrac = 0.84,
    hFrac = 0.5,
    align = { x: 0.5, y: 0.5 },
  } = opts;

  return (ctx, W, H) => {
    const base = 120;
    ctx.font = `${fontWeight} ${base}px ${fontFamily}`;
    if (letterSpacing) ctx.letterSpacing = `${letterSpacing}px`;
    const m = ctx.measureText(text);
    const asc = m.actualBoundingBoxAscent || base * 0.8;
    const desc = m.actualBoundingBoxDescent || base * 0.2;
    const tw = m.width;
    const th = asc + desc;
    const fs = Math.min((wFrac * W) / tw, (hFrac * H) / th) * base;

    ctx.font = `${fontWeight} ${fs}px ${fontFamily}`;
    if (letterSpacing) ctx.letterSpacing = `${(letterSpacing * fs) / base}px`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W * align.x, H * align.y);
  };
}

// Rounded-rect outline + centered label; returns the clickable hit rect.
export function buttonPaint(label, opts = {}) {
  const {
    fontFamily = '"JetBrains Mono", monospace',
    fontWeight = 600,
    letterSpacing = 3,
    fontSize = null,
    padX = 54,
    padY = 30,
    radius = 18,
    border = 3.5,
    wFrac = 0.82,
    hFrac = 0.66,
  } = opts;

  return (ctx, W, H) => {
    let fs = fontSize ?? Math.min(H * 0.32, 46);
    ctx.font = `${fontWeight} ${fs}px ${fontFamily}`;
    if (letterSpacing) ctx.letterSpacing = `${letterSpacing}px`;
    let lw = ctx.measureText(label).width;
    let innerW = lw + padX * 2;
    let innerH = fs + padY * 2;

    const sc = Math.min((wFrac * W) / innerW, (hFrac * H) / innerH, 1);
    if (sc < 1) {
      fs *= sc;
      ctx.font = `${fontWeight} ${fs}px ${fontFamily}`;
      if (letterSpacing) ctx.letterSpacing = `${letterSpacing * sc}px`;
      lw = ctx.measureText(label).width;
      innerW = lw + padX * sc * 2;
      innerH = fs + padY * sc * 2;
    }

    const x = (W - innerW) / 2;
    const y = (H - innerH) / 2;
    const k = Math.max(sc, 0.6);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = border * k;
    roundRectPath(ctx, x, y, innerW, innerH, radius * k);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, W / 2, H / 2);

    return { hit: { x, y, w: innerW, h: innerH } };
  };
}
