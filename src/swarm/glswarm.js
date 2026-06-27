// glswarm.js — WebGL2 additive swarm, ONE pass, every ball identical.
//
// Every ball is the same: a rainbow sphere, slowly tumbling, floating through
// space at the same pace as every other ball, drawn every frame (no gating, no
// flicker, no density difference). Additive blending sums overlapping colours.
//
// The text is NOT a separate object — it is made of these same balls. The only
// thing that varies with the text mask is whether a ball's hue is its OWN
// decorrelated rotation colour (i.i.d. → many overlapping ones additively sum to
// WHITE — the text) or a locally-shared colour (correlated → they sum to a vivid
// hue — the background "noise"). Same balls, same motion, same brightness; only
// the colour outcome differs.

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos0;
layout(location=1) in vec2 a_vel;
layout(location=2) in float a_radius;
layout(location=3) in float a_psi;
layout(location=4) in float a_seed;

uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform float u_beta;
uniform float u_omega;
uniform float u_speed;       // motion-rate scale (1 = full, <1 = calmer)
uniform float u_omegascale;  // tumble-rate scale
uniform float u_scroll;      // page scroll (px) — translates the field upward

out vec2 v_center;
out vec3 v_axis;
out float v_omega;
out float v_seed;

float wrapf(float v, float lo, float hi) {
  float L = hi - lo;
  if (L <= 0.0) return lo;
  return lo + mod(v - lo, L);
}

void main() {
  float R = a_radius;
  // Floating: slow linear drift + organic low-frequency sway, wrapped at the
  // edges (no hard bounce). Identical treatment for every ball.
  float ts = u_time * u_speed;
  float fa = 0.6 + 0.7 * a_seed;
  float SW = 24.0;
  float mx = a_pos0.x + a_vel.x * ts
           + SW * sin(0.5 * fa * ts + a_seed * 6.2831)
           + 0.5 * SW * sin(0.83 * fa * ts + a_psi);
  float my = a_pos0.y + a_vel.y * ts
           + SW * cos(0.43 * fa * ts + a_psi)
           + 0.5 * SW * cos(0.71 * fa * ts + a_seed * 6.2831);
  // Move the field up with the page scroll, but at LESS than 1:1 so it flows
  // relative to the page (and the word) instead of scrolling rigidly with it —
  // a rigid 1:1 lock reads as a frozen image during the scroll gesture. The
  // word stays anchored because the fragment samples the mask at the true
  // document row under each ball (v_center.y + u_scroll), independent of how
  // fast the balls themselves drift. Wrapping recycles balls off the top.
  float sy = my - u_scroll * 0.5;
  vec2 c = vec2(wrapf(mx, R, u_res.x - R), wrapf(sy, R, u_res.y - R));
  v_center = c;

  float sb = sin(u_beta), cb = cos(u_beta);
  v_axis = vec3(sb * cos(a_psi), sb * sin(a_psi), cb);
  v_omega = u_omega * (0.55 + 0.9 * a_seed) * u_omegascale;
  v_seed = a_seed;

  vec2 clip = (c / u_res) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = 2.0 * R * u_dpr;
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_center;
in vec3 v_axis;
in float v_omega;
in float v_seed;

uniform vec2 u_res;
uniform float u_time;
uniform float u_base;
uniform float u_fade;
uniform float u_bgdark;   // brightness of balls NOT in the text (≤1)
uniform float u_mono;     // 0 = full rainbow, 1 = white/silver
uniform float u_dim;      // overall brightness multiplier
uniform sampler2D u_target; // document-tall mask
uniform float u_scroll;     // current page scroll (px) — slides the mask up
uniform float u_maskh;      // tall mask height (px) = document height
uniform float u_namefade;   // 0 = hero name visible, 1 = faded into the field
uniform float u_heroend;    // document Y (px) where the hero band ends
uniform vec4 u_hot;
uniform float u_hotk;

out vec4 frag;

vec3 hsv2rgb(float h, float s, float v) {
  vec3 p = abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s);
}
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  d.y = -d.y;
  float r2 = dot(d, d);
  if (r2 > 1.0) discard;
  float z = sqrt(1.0 - r2);
  vec3 N = vec3(d, z);

  // Genuine tumble.
  float a = v_omega * u_time;
  float ca = cos(a), sa = sin(a);
  vec3 k = v_axis;
  vec3 b = N * ca + cross(k, N) * sa + k * dot(k, N) * (1.0 - ca);

  // This ball's OWN decorrelated rainbow (i.i.d. → overlaps sum to white).
  float rainHue = fract(atan(b.y, b.x) * 0.15915494 + b.z * 0.25 + v_seed);

  // Locally-shared hue (domain-warped organic noise → vivid background, no grid).
  vec2 np = v_center * 0.04;
  vec2 warp = vec2(vnoise(np + vec2(2.3, 7.1)), vnoise(np + vec2(5.7, 1.9)));
  np += (warp - 0.5) * 4.5 + vec2(u_time * 0.04, u_time * -0.03);
  float noiseHue = fract(vnoise(np) + 0.5 * vnoise(np * 2.0));

  // Sample the document-tall mask: x in viewport, y shifted by scroll so the
  // word sits at its real page position and slides up as you scroll.
  vec2 muv = vec2(v_center.x / u_res.x, (v_center.y + u_scroll) / u_maskh);
  float g = texture(u_target, muv).r;
  if (u_hot.z > 0.0 && v_center.x >= u_hot.x && v_center.x <= u_hot.x + u_hot.z &&
      v_center.y >= u_hot.y && v_center.y <= u_hot.y + u_hot.w) {
    g = clamp(g * (1.0 + u_hotk), 0.0, 1.0);
  }

  // Fade the hero name out with scroll: weaken its text mask within the hero
  // band so its letters dissolve back into the field as you scroll down.
  float docY = v_center.y + u_scroll;
  float heroBand = 1.0 - smoothstep(u_heroend * 0.7, u_heroend, docY);
  g *= 1.0 - u_namefade * heroBand;

  // Over text → own colour (decorrelated → white); off text → shared (→ vivid).
  float hue = mix(noiseHue, rainHue, g);
  vec3 col = hsv2rgb(hue, 0.95, 1.0);
  col = mix(col, vec3(1.0), u_mono); // desaturate toward white/silver

  float fill = 1.0 - smoothstep(0.84, 1.0, r2); // plain colour disc

  // Darken everything that is NOT in the text so the glyphs stand out.
  float bright = mix(u_bgdark, 1.0, g);
  float w = u_base * fill * bright * u_fade * u_dim;
  frag = vec4(col * w, 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error('shader: ' + gl.getShaderInfoLog(sh));
  }
  return sh;
}

const FLOATS = 7; // x0,y0,vx,vy,R,psi,seed

export class GLSwarm {
  constructor(canvas, config = {}) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.canvas = canvas;
    this.cfg = {
      density: 0.05,
      maxCount: 150000,
      speed: 11,
      ballRadius: [5, 12],
      omega: 1.0,
      beta: 1.2,
      base: 0.07,
      bgDark: 0.4, // brightness of non-text balls
      mono: 0, // 0 = rainbow, 1 = white/silver
      dim: 1, // overall brightness multiplier
      speedScale: 1, // motion-rate scale
      omegaScale: 1, // tumble-rate scale
      fadeIn: 0,
      ...config,
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('link: ' + gl.getProgramInfoLog(prog));
    }
    this.prog = prog;
    this.u = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      dpr: gl.getUniformLocation(prog, 'u_dpr'),
      beta: gl.getUniformLocation(prog, 'u_beta'),
      omega: gl.getUniformLocation(prog, 'u_omega'),
      speed: gl.getUniformLocation(prog, 'u_speed'),
      omegascale: gl.getUniformLocation(prog, 'u_omegascale'),
      mono: gl.getUniformLocation(prog, 'u_mono'),
      dim: gl.getUniformLocation(prog, 'u_dim'),
      base: gl.getUniformLocation(prog, 'u_base'),
      fade: gl.getUniformLocation(prog, 'u_fade'),
      bgdark: gl.getUniformLocation(prog, 'u_bgdark'),
      target: gl.getUniformLocation(prog, 'u_target'),
      scroll: gl.getUniformLocation(prog, 'u_scroll'),
      maskh: gl.getUniformLocation(prog, 'u_maskh'),
      namefade: gl.getUniformLocation(prog, 'u_namefade'),
      heroend: gl.getUniformLocation(prog, 'u_heroend'),
      hot: gl.getUniformLocation(prog, 'u_hot'),
      hotk: gl.getUniformLocation(prog, 'u_hotk'),
    };

    this.vbo = gl.createBuffer();
    this.vao = gl.createVertexArray();
    this.tex = this._maskTex();
    this.scroll = 0; // page scroll offset (px)
    this.maskH = 0; // tall mask height (px)
    this.nameFade = 0; // 0 = hero name visible, 1 = faded
    this.heroEnd = 1e9; // document Y where the hero band ends

    this.count = 0;
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.hot = [0, 0, 0, 0];
    this.hotk = 0;
  }

  _maskTex() {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  _uploadMask(tex, canvas) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  // Slide the tall mask to the current page scroll position (px).
  setScroll(px) {
    this.scroll = px;
  }

  // Fade the hero name (0 = visible, 1 = dissolved); end = doc Y of hero band.
  setNameFade(v, end) {
    this.nameFade = v;
    if (end !== undefined) this.heroEnd = end;
  }

  // Swap in a new tall mask (e.g. after a resize/reflow) without rebuilding balls.
  setMask(targetCanvas, maskH) {
    this._uploadMask(this.tex, targetCanvas);
    this.maskH = maskH || this.H;
  }

  build(W, H, dpr, targetCanvas, maskH) {
    const gl = this.gl;
    this.W = W;
    this.H = H;
    this.dpr = dpr;

    let count = Math.round(this.cfg.density * W * H);
    count = Math.max(200, Math.min(this.cfg.maxCount, count));
    this.count = count;

    const [rMin, rMax] = this.cfg.ballRadius;
    const data = new Float32Array(count * FLOATS);
    for (let i = 0; i < count; i++) {
      const o = i * FLOATS;
      const depth = Math.pow(Math.random(), 1.4);
      const R = rMin + (rMax - rMin) * depth;
      const ang = Math.random() * Math.PI * 2;
      const sp = this.cfg.speed * (0.5 + 0.9 * depth);
      data[o] = R + Math.random() * Math.max(1, W - 2 * R);
      data[o + 1] = R + Math.random() * Math.max(1, H - 2 * R);
      data[o + 2] = Math.cos(ang) * sp;
      data[o + 3] = Math.sin(ang) * sp;
      data[o + 4] = R;
      data[o + 5] = Math.random() * Math.PI * 2;
      data[o + 6] = Math.random();
    }

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const stride = FLOATS * 4;
    const set = (loc, size, off) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4);
    };
    set(0, 2, 0);
    set(1, 2, 2);
    set(2, 1, 4);
    set(3, 1, 5);
    set(4, 1, 6);
    gl.bindVertexArray(null);

    this._uploadMask(this.tex, targetCanvas);
    this.maskH = maskH || H;
  }

  setHot(rect, k) {
    this.hot = rect ? [rect.x, rect.y, rect.w, rect.h] : [0, 0, 0, 0];
    this.hotk = k;
  }

  render(t) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(this.prog);
    gl.uniform2f(this.u.res, this.W, this.H);
    gl.uniform1f(this.u.time, t);
    gl.uniform1f(this.u.dpr, this.dpr);
    gl.uniform1f(this.u.beta, this.cfg.beta);
    gl.uniform1f(this.u.omega, this.cfg.omega);
    gl.uniform1f(this.u.speed, this.cfg.speedScale);
    gl.uniform1f(this.u.omegascale, this.cfg.omegaScale);
    gl.uniform1f(this.u.mono, this.cfg.mono);
    gl.uniform1f(this.u.dim, this.cfg.dim);
    gl.uniform1f(this.u.base, this.cfg.base);
    gl.uniform1f(this.u.fade, this.cfg.fadeIn > 0 ? Math.min(1, t / this.cfg.fadeIn) : 1);
    gl.uniform1f(this.u.bgdark, this.cfg.bgDark);
    gl.uniform1i(this.u.target, 0);
    gl.uniform1f(this.u.scroll, this.scroll);
    gl.uniform1f(this.u.maskh, this.maskH || this.H);
    gl.uniform1f(this.u.namefade, this.nameFade);
    gl.uniform1f(this.u.heroend, this.heroEnd);
    gl.uniform4f(this.u.hot, this.hot[0], this.hot[1], this.hot[2], this.hot[3]);
    gl.uniform1f(this.u.hotk, this.hotk);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.tex);
    gl.deleteProgram(this.prog);
  }
}
