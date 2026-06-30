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
//
// The word the swarm spells is defined by a SIGNED DISTANCE FIELD, not a bitmap.
// Two SDFs (the word we're leaving and the word we're heading to) are sampled
// every frame and blended by u_morphT. Because the in-between of two distance
// fields is itself a smooth shape, the lit region grows/shrinks/travels from one
// word into the next — and since the ball field keeps drifting underneath, it
// reads as the swarm physically flowing into the next word.

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
  // The field drifts within the fixed viewport and wraps at the edges; the word
  // is anchored by the fragment sampling the SDF at this ball's screen position,
  // independent of how the balls themselves drift.
  vec2 c = vec2(wrapf(mx, R, u_res.x - R), wrapf(my, R, u_res.y - R));
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
uniform sampler2D u_sdfA; // signed distance field of the word we're leaving
uniform sampler2D u_sdfB; // signed distance field of the word we're entering
uniform float u_morphT;   // 0 = fully word A, 1 = fully word B
uniform float u_edge;     // half-width of the soft glyph edge in SDF units

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

  // Sample BOTH distance fields at this ball's screen position and blend them.
  // Each field stores 0.5 at the glyph edge, <0.5 inside, >0.5 outside; the
  // blend of two distance fields is itself a valid in-between shape, so the
  // glyphs of word A morph into the glyphs of word B as u_morphT goes 0→1.
  vec2 muv = v_center / u_res;
  float dA = texture(u_sdfA, muv).r;
  float dB = texture(u_sdfB, muv).r;
  float dd = mix(dA, dB, u_morphT);
  float g = smoothstep(0.5 + u_edge, 0.5 - u_edge, dd); // 1 inside the word

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
      radiusRefWidth: 1920, // ball size + motion scale relative to this width
      radiusRefHeight: 945, // reference height for the scale-invariant count
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
      sdfA: gl.getUniformLocation(prog, 'u_sdfA'),
      sdfB: gl.getUniformLocation(prog, 'u_sdfB'),
      morphT: gl.getUniformLocation(prog, 'u_morphT'),
      edge: gl.getUniformLocation(prog, 'u_edge'),
    };

    this.vbo = gl.createBuffer();
    this.vao = gl.createVertexArray();
    this.fallbackTex = this._blankTex(); // bound when a word index is missing
    this.sdfTexs = []; // one signed-distance-field texture per word

    // Morph state: which word we're leaving (from), heading to (to), and how far
    // along (t ∈ [0,1]). Settled on a word ⇒ from === to.
    this.morph = { from: 0, to: 0, t: 0 };
    this.edge = 0.06; // soft glyph edge half-width in SDF units (0.5 = at edge)

    this.count = 0;
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
  }

  _newTex() {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  // A 1×1 fully-outside field (value 1.0) used when a word slot is empty so the
  // shader always has a valid texture bound to both samplers.
  _blankTex() {
    const gl = this.gl;
    const tex = this._newTex();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]));
    return tex;
  }

  // Upload one SDF-encoded canvas per word. Replaces any previous set.
  setSDFs(canvases) {
    const gl = this.gl;
    for (const t of this.sdfTexs) gl.deleteTexture(t);
    this.sdfTexs = canvases.map((cnv) => {
      const tex = this._newTex();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cnv);
      return tex;
    });
  }

  // Set the soft glyph edge half-width (SDF units). Smaller = crisper.
  setEdge(e) {
    this.edge = e;
  }

  // Blend between word `from` and word `to`, fraction `t` of the way across.
  setMorph(from, to, t) {
    const n = this.sdfTexs.length;
    this.morph.from = n ? Math.max(0, Math.min(n - 1, from | 0)) : 0;
    this.morph.to = n ? Math.max(0, Math.min(n - 1, to | 0)) : 0;
    this.morph.t = Math.max(0, Math.min(1, t));
  }

  build(W, H, dpr) {
    const gl = this.gl;
    this.W = W;
    this.H = H;
    this.dpr = dpr;

    // Scale ball size + motion with screen width so the swarm is a shrunk-down
    // copy of itself on narrow screens (same look on mobile). Hold the COUNT
    // constant (based on the reference resolution, not the actual area) so the
    // word stays just as dense instead of getting sparse as the screen shrinks.
    const refW = this.cfg.radiusRefWidth;
    const refH = this.cfg.radiusRefHeight;
    const s = Math.min(1, Math.max(0.25, W / refW));

    let count = Math.round(this.cfg.density * refW * refH);
    count = Math.max(200, Math.min(this.cfg.maxCount, count));
    this.count = count;

    const rMin = this.cfg.ballRadius[0] * s;
    const rMax = this.cfg.ballRadius[1] * s;
    const data = new Float32Array(count * FLOATS);
    for (let i = 0; i < count; i++) {
      const o = i * FLOATS;
      const depth = Math.pow(Math.random(), 1.4);
      const R = rMin + (rMax - rMin) * depth;
      const ang = Math.random() * Math.PI * 2;
      // Motion is absolute (not scaled by screen width) so the dots float just
      // as lively on mobile; only their SIZE scales with the screen.
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
  }

  _texForWord(i) {
    return this.sdfTexs[i] || this.fallbackTex;
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
    gl.uniform1f(this.u.morphT, this.morph.t);
    gl.uniform1f(this.u.edge, this.edge);

    gl.uniform1i(this.u.sdfA, 0);
    gl.uniform1i(this.u.sdfB, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texForWord(this.morph.from));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._texForWord(this.morph.to));

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
    for (const t of this.sdfTexs) gl.deleteTexture(t);
    gl.deleteTexture(this.fallbackTex);
    gl.deleteProgram(this.prog);
  }
}
