/**
 * museum.js — the grain engine for the Museum of Said Things.
 *
 * Same instrument as the landing page's Hall of Dust, rebuilt around a single
 * idea: every exhibit in this wing is a *sentence*, so the dust assembles into
 * the punctuation the sentence hides behind — and, for the overture, into the
 * case's own emblem.
 *
 * Shapes are sampled the way the landing page samples them: rasterise the form
 * into an off-screen canvas, keep the filled pixels, hand the grains normalised
 * targets. Two things are new here.
 *
 *   1. Shapes are drawn parametrically rather than typed. A glyph is a font's
 *      opinion; on some platforms "🍆" renders as a colour emoji the sampler
 *      reads as a solid rectangle, and on others it does not render at all.
 *      The eggplant is therefore a path — body, calyx, stem — which also means
 *      it is the same eggplant on every machine.
 *
 *   2. Points carry a group. The calyx and stem sample separately from the
 *      body, so those grains can be drawn in amber against the bone of the
 *      fruit. Without that the silhouette reads as an ovoid blob; with it, it
 *      reads as what it is from across the room.
 *
 * Exported: window.Museum.{ mount, retarget, shapeCount }
 */

(function (root) {
  "use strict";

  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var BONE = [239, 231, 214];
  var AMBER = [215, 157, 74];

  /* ============================================================
     SHAPE SAMPLING
     ============================================================ */
  var S = 480;                  // sampling box, square
  var cache = {};

  function sampleFrom(key, draw) {
    if (cache[key]) return cache[key];
    var oc = document.createElement("canvas");
    oc.width = oc.height = S;
    var o = oc.getContext("2d");
    var pts = [];

    // Each group is rasterised on its own so a grain can remember which part of
    // the form it belongs to. Clearing between groups keeps overlap honest —
    // the calyx sits on top of the body, and those pixels should read as calyx.
    var groups = draw(o, S);
    for (var gi = groups.length - 1; gi >= 0; gi--) {
      o.clearRect(0, 0, S, S);
      o.fillStyle = "#000";
      groups[gi]();
      var d = o.getImageData(0, 0, S, S).data;
      for (var y = 0; y < S; y += 3) {
        for (var x = 0; x < S; x += 3) {
          if (d[(y * S + x) * 4 + 3] > 120) pts.push([x / S, y / S, gi]);
        }
      }
    }
    cache[key] = pts;
    return pts;
  }

  /* ---------- the eggplant ----------
     Body is a symmetric ovoid, heaviest low. The calyx is five leaves swept
     back over the shoulders, and the stem leans, because a stem that stands
     straight up reads as a lightbulb. */
  function eggplant(o) {
    var body = function () {
      o.beginPath();
      o.moveTo(240, 186);
      o.bezierCurveTo(303, 196, 336, 274, 333, 356);
      o.bezierCurveTo(330, 428, 294, 458, 240, 458);
      o.bezierCurveTo(186, 458, 150, 428, 147, 356);
      o.bezierCurveTo(144, 274, 177, 196, 240, 186);
      o.closePath();
      o.fill();
    };

    var crown = function () {
      // five leaves, angle measured from straight down (canvas +y)
      var LEAF = [[-1.34, 88], [-0.74, 78], [0, 62], [0.74, 78], [1.34, 88]];
      var bx = 240, by = 192;
      LEAF.forEach(function (L) {
        var a = L[0], len = L[1];
        var dx = Math.sin(a), dy = Math.cos(a);
        var px = -dy, py = dx;              // perpendicular
        var w = 17;
        o.beginPath();
        o.moveTo(bx + px * w, by + py * w);
        o.quadraticCurveTo(bx + dx * len * 0.62 + px * w * 0.95,
                           by + dy * len * 0.62 + py * w * 0.95,
                           bx + dx * len, by + dy * len);
        o.quadraticCurveTo(bx + dx * len * 0.62 - px * w * 0.95,
                           by + dy * len * 0.62 - py * w * 0.95,
                           bx - px * w, by - py * w);
        o.closePath();
        o.fill();
      });
      // stem
      o.beginPath();
      o.moveTo(223, 200);
      o.lineTo(257, 197);
      o.lineTo(264, 118);
      o.lineTo(247, 110);
      o.closePath();
      o.fill();
    };

    return [body, crown];   // group 0 = body (bone), group 1 = crown (amber)
  }

  /* ---------- typographic exhibits ---------- */
  function glyph(ch, px) {
    return function (o) {
      return [function () {
        o.textAlign = "center";
        o.textBaseline = "middle";
        o.font = "900 " + px + "px Fraunces, Georgia, serif";
        o.fillText(ch, 240, 252);
      }];
    };
  }

  var SHAPES = {
    eggplant: eggplant,
    quote:    glyph("“", 470),
    question: glyph("?", 400),
    bang:     glyph("!", 400),
    amp:      glyph("&", 380),
    ellipsis: glyph("…", 400),
  };

  /* ============================================================
     ENGINE
     ============================================================ */
  function mount(opts) {
    var cv = document.getElementById(opts.canvas || "ink");
    if (!cv) return null;
    var cx = cv.getContext("2d");

    var W = 0, H = 0, DPR = 1;
    var N = innerWidth < 760 ? 1500 : 3200;
    var grains = [];
    for (var i = 0; i < N; i++) {
      grains.push({
        x: Math.random(), y: Math.random(), vx: 0, vy: 0,
        tx: 0, ty: 0, len: 3 + Math.random() * 6,
        ang: Math.random() * Math.PI,
        delay: Math.random(), inShape: false, accent: false, lit: false,
      });
    }

    var scene = null, stageFor = opts.stageFor || function () { return null; };
    var region = { x: 0, y: 0, w: 0, h: 0, lastTop: 0 };
    var lastCount = 0;

    function size() {
      DPR = Math.min(devicePixelRatio || 1, 1.75);
      W = cv.width = innerWidth * DPR;
      H = cv.height = innerHeight * DPR;
      cv.style.width = "100%";
      cv.style.height = "100%";
      grains.forEach(function (g) { g.x = Math.random() * W; g.y = Math.random() * H; });
      retarget(scene, true);
    }

    function rectOf(el, pad) {
      var r = el.getBoundingClientRect();
      pad = pad || 0;
      return { x: (r.left + pad) * DPR, y: r.top * DPR, w: (r.width - 2 * pad) * DPR, h: r.height * DPR };
    }

    function assignShape(pts, reg, scale) {
      /* Dense forms out-sample the grain pool. Taking the first N points keeps
         only the top scan rows — that is how the landing page's heart lost its
         tip. Stride-downsample so coverage spans the whole shape. */
      if (pts.length > grains.length) {
        var step = pts.length / grains.length, ds = [];
        for (var i = 0; i < grains.length; i++) ds.push(pts[(i * step) | 0]);
        pts = ds;
      }
      var s = Math.min(reg.w, reg.h) * (scale || 1);
      var offX = reg.x + (reg.w - s) / 2, offY = reg.y + (reg.h - s) / 2;
      grains.forEach(function (g, i) {
        if (i < pts.length) {
          var p = pts[i];
          g.tx = offX + p[0] * s + (Math.random() - 0.5) * 3 * DPR;
          g.ty = offY + p[1] * s + (Math.random() - 0.5) * 3 * DPR;
          g.inShape = true;
          g.accent = p[2] === 1;
          g.lit = Math.random() < 0.13;
        } else {
          g.tx = Math.random() * W;
          g.ty = Math.random() * H;
          g.inShape = false; g.accent = false; g.lit = false;
        }
      });
      lastCount = Math.min(pts.length, grains.length);
    }

    function assignMargins() {
      grains.forEach(function (g) {
        g.inShape = false; g.accent = false; g.lit = false;
        var side = Math.random();
        if (side < 0.5) {
          g.tx = (side < 0.25 ? Math.random() * 0.06 : 0.94 + Math.random() * 0.06) * W;
          g.ty = Math.random() * H;
        } else {
          g.tx = Math.random() * W;
          g.ty = (side < 0.75 ? Math.random() * 0.08 : 0.92 + Math.random() * 0.08) * H;
        }
      });
      lastCount = 0;
    }

    function retarget(name, force) {
      if (name === scene && !force) return;
      scene = name;
      var host = name && stageFor(name);
      var maker = name && SHAPES[name];
      if (host && maker) {
        var reg = rectOf(host, 8);
        region = reg; region.lastTop = reg.y;
        assignShape(sampleFrom(name, maker), reg, name === "eggplant" ? 1.02 : 1.35);
      } else {
        assignMargins();
      }
      grains.forEach(function (g) { g.delay = Math.random() * 0.5; });
      if (typeof opts.onRetarget === "function") opts.onRetarget(name, lastCount);
    }

    /* ---------- pointer: carve, and hold to focus ---------- */
    var ptr = { x: -9999, y: -9999 };
    var focusing = false;
    var ring = document.getElementById("focusring");

    addEventListener("pointermove", function (e) {
      ptr.x = e.clientX * DPR; ptr.y = e.clientY * DPR;
      if (focusing && ring) { ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px"; }
    }, { passive: true });

    addEventListener("pointerdown", function (e) {
      if (RM || !scene || !SHAPES[scene]) return;
      var host = stageFor(scene);
      if (!host) return;
      var s = host.getBoundingClientRect();
      if (e.clientX >= s.left && e.clientX <= s.right && e.clientY >= s.top && e.clientY <= s.bottom) {
        focusing = true;
        if (ring) { ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px"; ring.classList.add("on"); }
        if (typeof opts.onFocus === "function") opts.onFocus(true);
      }
    });

    addEventListener("pointerup", function () {
      if (!focusing) return;
      focusing = false;
      if (ring) ring.classList.remove("on");
      if (typeof opts.onFocus === "function") opts.onFocus(false);
    });

    /* ---------- loop ---------- */
    var t0 = performance.now();
    function frame(now) {
      var dt = clamp((now - t0) / 16.7, 0.4, 2.2); t0 = now;

      // glue targets to the scrolling stage
      var host = scene && stageFor(scene);
      if (host && region.w) {
        var r = rectOf(host, 8);
        var dy = r.y - region.lastTop;
        if (dy) {
          grains.forEach(function (g) { g.ty += dy; });
          region.lastTop = r.y;
        }
      }

      cx.clearRect(0, 0, W, H);
      var k = (focusing ? 0.16 : 0.055) * dt;
      var jit = focusing ? 0.12 : 1;
      var R = 90 * DPR, R2 = R * R;

      for (var i = 0; i < grains.length; i++) {
        var g = grains[i];
        var ax = (g.tx - g.x) * k, ay = (g.ty - g.y) * k;
        var dx = g.x - ptr.x, dy2 = g.y - ptr.y, d2 = dx * dx + dy2 * dy2;
        if (d2 < R2 && d2 > 1 && !RM) {
          var f = (1 - d2 / R2) * 4.2 * dt, inv = 1 / Math.sqrt(d2);
          ax += dx * inv * f * DPR; ay += dy2 * inv * f * DPR;
        }
        g.vx = (g.vx + ax) * 0.86; g.vy = (g.vy + ay) * 0.86;
        g.x += g.vx * dt + Math.sin(now / 900 + g.delay * 40) * 0.12 * jit;
        g.y += g.vy * dt + Math.cos(now / 1100 + g.delay * 60) * 0.12 * jit;
      }

      draw();
      requestAnimationFrame(frame);
    }

    /* Three bone buckets for the body, one amber pass for the crown, one bright
       pass for lit strands — five stroke() calls per frame regardless of N. */
    function draw() {
      for (var b = 0; b < 3; b++) {
        var path = new Path2D();
        for (var i = b; i < grains.length; i += 3) {
          var g = grains[i];
          if (g.accent) continue;
          var dx = Math.cos(g.ang) * g.len * DPR * 0.5, dy = Math.sin(g.ang) * g.len * DPR * 0.5;
          path.moveTo(g.x - dx, g.y - dy); path.lineTo(g.x + dx, g.y + dy);
        }
        cx.strokeStyle = "rgba(" + BONE[0] + "," + BONE[1] + "," + BONE[2] + "," + (0.35 + b * 0.22) + ")";
        cx.lineWidth = (0.9 + b * 0.35) * DPR;
        cx.stroke(path);
      }

      var ap = new Path2D(), any = false;
      for (var j = 0; j < grains.length; j++) {
        var a = grains[j];
        if (!a.accent) continue;
        var adx = Math.cos(a.ang) * a.len * DPR * 0.6, ady = Math.sin(a.ang) * a.len * DPR * 0.6;
        ap.moveTo(a.x - adx, a.y - ady); ap.lineTo(a.x + adx, a.y + ady);
        any = true;
      }
      if (any) {
        cx.strokeStyle = "rgba(" + AMBER[0] + "," + AMBER[1] + "," + AMBER[2] + ",0.92)";
        cx.lineWidth = 1.25 * DPR;
        cx.stroke(ap);
      }

      var lp = new Path2D();
      for (var m = 0; m < grains.length; m++) {
        var l = grains[m];
        if (!l.lit || l.accent) continue;
        var ldx = Math.cos(l.ang) * l.len * DPR * 0.8, ldy = Math.sin(l.ang) * l.len * DPR * 0.8;
        lp.moveTo(l.x - ldx, l.y - ldy); lp.lineTo(l.x + ldx, l.y + ldy);
      }
      cx.strokeStyle = "rgba(255, 251, 240, 0.9)";
      cx.lineWidth = 1.1 * DPR;
      cx.stroke(lp);
    }

    function boot() {
      size();
      addEventListener("resize", size);
      if (RM) {
        // settle instantly and repaint only on scene change — the museum still
        // assembles, it just doesn't fly
        grains.forEach(function (g) { g.x = g.tx; g.y = g.ty; });
        (function still() {
          grains.forEach(function (g) { g.x = lerp(g.x, g.tx, 0.5); g.y = lerp(g.y, g.ty, 0.5); });
          cx.clearRect(0, 0, W, H);
          draw();
          setTimeout(function () { requestAnimationFrame(still); }, 250);
        })();
      } else {
        requestAnimationFrame(frame);
      }
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else boot();

    return { retarget: retarget, shapeCount: function () { return lastCount; }, reduced: RM };
  }

  root.Museum = { mount: mount, SHAPES: SHAPES };
})(window);
