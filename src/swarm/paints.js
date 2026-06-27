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

// Draw words at absolute document positions onto a document-tall mask canvas.
// Each word: { text, cy } where cy is the vertical centre in px. FILLED → the
// swarm's mask; the renderer slides it by scrollY so each word sits at its page
// position and scrolls off like normal text.
export function tallMaskPaint(words, { fontFamily = '"JetBrains Mono", monospace', wFrac = 0.74, hPx = 170 } = {}) {
  return (ctx, W) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const w of words) {
      const fs = fitFontSize(ctx, w.text, wFrac * W, hPx, fontFamily);
      ctx.font = `700 ${fs}px ${fontFamily}`;
      ctx.letterSpacing = `${fs * 0.04}px`;
      ctx.fillText(w.text, W / 2, w.cy);
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
      const fs = fitFontSize(ctx, w.text, wFrac * W, hPx, fontFamily);
      ctx.font = `700 ${fs}px ${fontFamily}`;
      ctx.letterSpacing = `${fs * 0.04}px`;
      ctx.lineWidth = Math.max(1.5, fs * 0.02);
      ctx.strokeText(w.text, W / 2, w.cy);
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
