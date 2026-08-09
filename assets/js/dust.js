/**
 * dust.js — the ambient dust of the hall, shared by every page.
 *
 * The landing page has a heavy particle engine: it rasterises glyphs and
 * shapes off-screen, samples them, and flies thousands of grains between
 * targets. That is the centrepiece and it earns its cost. The consoles are
 * working surfaces — people read and type in them — so what they need is the
 * *air* of the same room, not its choreography: slow motes catching a light
 * source high on the wall, drifting, with a faint parallax as the pointer
 * moves.
 *
 * Cost control, in order of how much each one bought:
 *   - Density scales with viewport area and hard-caps at 220 motes.
 *   - DPR is capped at 1.5. Beyond that the motes are sub-pixel anyway.
 *   - Motes are batched into a handful of alpha buckets and drawn as arcs on
 *     one path per bucket, so the fill/globalAlpha churn is O(buckets), not
 *     O(motes).
 *   - The loop parks itself when the tab is hidden.
 *   - prefers-reduced-motion draws one static field and stops. The room still
 *     has dust in it; the dust just doesn't move.
 *
 * Usage: include after hall.css. It mounts itself into #dust, creating that
 * canvas if the page hasn't already declared one.
 */

(function (root) {
  "use strict";

  var MAX_MOTES = 220;
  var DENSITY = 1 / 11000;   // motes per CSS pixel of viewport area
  var reduce = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function mount() {
    var cv = document.getElementById("dust");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.id = "dust";
      cv.setAttribute("aria-hidden", "true");
      document.body.insertBefore(cv, document.body.firstChild);
    }
    var ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    var W = 0, H = 0, dpr = 1;
    var motes = [];
    var px = 0.5, py = 0.35;      // pointer, normalised — drives parallax
    var tx = 0.5, ty = 0.35;      // eased target
    var raf = 0, last = 0;

    function seed() {
      var want = Math.min(MAX_MOTES, Math.round(W * H * DENSITY));
      motes.length = 0;
      for (var i = 0; i < want; i++) {
        // depth 0 = far (small, dim, slow), 1 = near (bigger, brighter, faster)
        var depth = Math.pow(Math.random(), 1.6);
        motes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.4 + depth * 1.5,
          a: 0.05 + depth * 0.28,
          vx: (Math.random() - 0.5) * (4 + depth * 10),
          vy: -(2 + depth * 9) - Math.random() * 4,   // dust rises through the beam
          drift: Math.random() * Math.PI * 2,
          dspd: 0.15 + Math.random() * 0.4,
          depth: depth
        });
      }
    }

    function resize() {
      dpr = Math.min(root.devicePixelRatio || 1, 1.5);
      W = root.innerWidth;
      H = root.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduce) draw(0);
    }

    /* Alpha buckets: every mote lands in one of six, and each bucket is a
       single path. Six fills per frame instead of two hundred. */
    var BUCKETS = 6;

    function draw(shiftX, shiftY) {
      shiftX = shiftX || 0;
      shiftY = shiftY || 0;
      ctx.clearRect(0, 0, W, H);

      for (var b = 0; b < BUCKETS; b++) {
        var lo = b / BUCKETS, hi = (b + 1) / BUCKETS;
        var any = false;
        ctx.beginPath();
        for (var i = 0; i < motes.length; i++) {
          var m = motes[i];
          var norm = m.a / 0.33;
          if (norm < lo || norm >= hi) continue;
          var wob = Math.sin(m.drift) * 6 * m.depth;
          var x = m.x + wob + shiftX * (0.3 + m.depth * 1.4) * 26;
          var y = m.y + shiftY * (0.3 + m.depth * 1.4) * 18;
          ctx.moveTo(x + m.r, y);
          ctx.arc(x, y, m.r, 0, Math.PI * 2);
          any = true;
        }
        if (!any) continue;
        // Motes closer to the light read amber; the far field stays bone.
        var warm = (lo + hi) / 2;
        ctx.fillStyle = warm > 0.55
          ? "rgba(215, 157, 74, " + ((lo + hi) / 2 * 0.33).toFixed(3) + ")"
          : "rgba(239, 231, 214, " + ((lo + hi) / 2 * 0.22).toFixed(3) + ")";
        ctx.fill();
      }
    }

    function step(now) {
      raf = requestAnimationFrame(step);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      tx += (px - tx) * 0.045;
      ty += (py - ty) * 0.045;

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.drift += m.dspd * dt;
        if (m.y < -8) { m.y = H + 8; m.x = Math.random() * W; }
        if (m.x < -12) m.x = W + 12;
        else if (m.x > W + 12) m.x = -12;
      }
      draw(tx - 0.5, ty - 0.5);
    }

    function start() {
      if (reduce || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
    function stop() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    root.addEventListener("resize", resize, { passive: true });
    root.addEventListener("pointermove", function (e) {
      px = e.clientX / root.innerWidth;
      py = e.clientY / root.innerHeight;
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    resize();
    start();

    root.Dust = { stop: stop, start: start, count: function () { return motes.length; } };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
