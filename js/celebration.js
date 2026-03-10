(() => {
  // Vivid multi-color palette used by all animation variants
  const PALETTE = [
    "#ff4d6d", // red-pink
    "#ff9500", // orange
    "#ffcc02", // yellow
    "#34c759", // green
    "#007aff", // blue
    "#af52de", // purple
    "#ff375f", // crimson
    "#30d158", // mint
  ];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }


  function randFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------------------------------------------------------------------------
  // CONFETTI — colorful rectangular pieces falling from above
  // ---------------------------------------------------------------------------
  function createConfetti(canvas) {
    const count = 100;
    const pieces = [];

    for (let i = 0; i < count; i++) {
      const above = i < count * 0.55;
      pieces.push({
        x: rand(-20, canvas.width + 20),
        y: above ? rand(-280, -10) : rand(0, canvas.height * 0.65),
        vx: rand(-1.2, 1.2),
        vy: above ? rand(2, 5) : rand(1.2, 3.5),
        rotation: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.07, 0.07),
        w: rand(7, 15),
        h: rand(4, 9),
        color: randFrom(PALETTE),
      });
    }

    return function draw(ctx, _elapsed) {
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.vx += (Math.random() - 0.5) * 0.04;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height + 30) {
          p.y = rand(-280, -20);
          p.x = rand(-20, canvas.width + 20);
          p.vy = rand(2, 5);
          p.vx = rand(-1.2, 1.2);
        }

        if (p.x < -40) p.x = canvas.width + 20;
        if (p.x > canvas.width + 40) p.x = -20;

        ctx.save();
        ctx.globalAlpha = 0.88;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
    };
  }

  // ---------------------------------------------------------------------------
  // BURSTS — firework-style explosions at staggered times and random positions
  // ---------------------------------------------------------------------------
  function createBursts(canvas) {
    const particles = [];
    let lastSpawn = -999;
    const spawnInterval = 260;

    function spawnBurst() {
      const centerX = rand(canvas.width * 0.12, canvas.width * 0.88);
      const centerY = rand(canvas.height * 0.08, canvas.height * 0.52);
      const count = Math.floor(rand(22, 34));

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.16, 0.16);
        const speed = rand(2.6, 6.2);
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(3, 7),
          color: randFrom(PALETTE),
          life: 1,
        });
      }
    }

    return function draw(ctx, elapsed) {
      if (elapsed - lastSpawn >= spawnInterval) {
        spawnBurst();
        lastSpawn = elapsed;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
  }

  // ---------------------------------------------------------------------------
  // STREAMERS — wavy ribbon pieces drifting downward
  // ---------------------------------------------------------------------------
  function createStreamers(canvas) {
    const count = 22;
    const pieces = [];

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: rand(-10, canvas.width + 10),
        y: rand(-180, -20),
        vx: rand(-0.8, 0.8),
        vy: rand(1.5, 3.5),
        phase: rand(0, Math.PI * 2),
        amp: rand(12, 28),
        segLength: rand(50, 100),
        color: randFrom(PALETTE),
        lineWidth: rand(2, 5),
        delay: rand(0, 500),
      });
    }

    return function draw(ctx, elapsed) {
      pieces.forEach((p) => {
        if (elapsed < p.delay) return;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.phase += 0.07;

        if (p.y > canvas.height + p.segLength + 20) {
          p.y = rand(-200, -30);
          p.x = rand(-10, canvas.width + 10);
          p.vy = rand(1.5, 3.5);
          p.vx = rand(-0.8, 0.8);
          p.phase = rand(0, Math.PI * 2);
        }

        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        const segs = 10;
        for (let s = 0; s <= segs; s++) {
          const t = s / segs;
          const sx = p.x + Math.sin(p.phase + t * 3.5) * p.amp * (1 - t * 0.25);
          const sy = p.y + t * p.segLength;
          s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      });
    };
  }

  // ---------------------------------------------------------------------------
  // SPARKLES — pulsing star shapes rising upward
  // ---------------------------------------------------------------------------
  function drawStar(ctx, cx, cy, size, rot, points) {
    const outer = size;
    const inner = size * 0.38;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (points * 2)) * Math.PI * 2 + rot;
      i === 0
        ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function createSparkles(canvas) {
    const count = 60;
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, canvas.width),
        y: rand(canvas.height * 0.25, canvas.height + 80),
        vx: rand(-0.9, 0.9),
        vy: rand(-3.2, -1.2),
        size: rand(5, 14),
        rotation: rand(0, Math.PI),
        rotSpeed: rand(-0.05, 0.05),
        pulse: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.1, 0.2),
        color: randFrom(PALETTE),
        delay: rand(0, 500),
        points: Math.random() < 0.4 ? 6 : 4,
      });
    }

    return function draw(ctx, elapsed) {
      particles.forEach((p) => {
        if (elapsed < p.delay) return;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.pulse += p.pulseSpeed;

        if (p.y < -40 || p.x < -60 || p.x > canvas.width + 60) {
          p.x = rand(0, canvas.width);
          p.y = rand(canvas.height * 0.75, canvas.height + 60);
          p.vx = rand(-0.9, 0.9);
          p.vy = rand(-3.2, -1.2);
          p.size = rand(5, 14);
          p.color = randFrom(PALETTE);
          p.points = Math.random() < 0.4 ? 6 : 4;
        }

        const pulseScale = 0.75 + 0.25 * Math.sin(p.pulse);
        const alpha = 0.9;

        ctx.save();
        ctx.globalAlpha = alpha * 0.9 * pulseScale;
        ctx.fillStyle = p.color;
        drawStar(ctx, p.x, p.y, p.size * pulseScale, p.rotation, p.points);
        ctx.restore();
      });
    };
  }

  // ---------------------------------------------------------------------------
  // Variant registry — add new variants here to have them appear everywhere
  // ---------------------------------------------------------------------------
  const VARIANT_FACTORIES = {
    confetti: createConfetti,
    bursts: createBursts,
    streamers: createStreamers,
    sparkles: createSparkles,
  };

  const VARIANT_KEYS = Object.keys(VARIANT_FACTORIES);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function show(winnerNames, forcedVariant) {
    const names = Array.isArray(winnerNames)
      ? winnerNames.map((n) => String(n || "").trim()).filter(Boolean)
      : [];
    const uniqueNames = [...new Set(names)];
    if (!uniqueNames.length) {
      return Promise.resolve();
    }

    const winnersText =
      uniqueNames.length === 1 ? uniqueNames[0] : `Tie: ${uniqueNames.join(" & ")}`;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "winner-celebration";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-label", "Winner celebration");
      backdrop.innerHTML = `
        <div class="winner-celebration-card">
          <p class="winner-celebration-label">Winner</p>
          <h2 class="winner-celebration-name">${escapeHtml(winnersText)}</h2>
          <button type="button" class="winner-celebration-close">Continue</button>
        </div>
      `;

      let animationId = null;

      if (!prefersReducedMotion) {
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "position:absolute;inset:0;pointer-events:none;";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        backdrop.insertBefore(canvas, backdrop.firstChild);

        const ctx = canvas.getContext("2d");
        const selectedKey = VARIANT_FACTORIES[forcedVariant]
          ? forcedVariant
          : VARIANT_KEYS[Math.floor(Math.random() * VARIANT_KEYS.length)];

        const drawFrame = VARIANT_FACTORIES[selectedKey](canvas);
        const startTime = performance.now();

        function animate(now) {
          const elapsed = now - startTime;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawFrame(ctx, elapsed);
          animationId = requestAnimationFrame(animate);
        }

        animationId = requestAnimationFrame(animate);
      }

      document.body.appendChild(backdrop);

      const closeButton = backdrop.querySelector(".winner-celebration-close");
      let isClosed = false;

      function closeCelebration() {
        if (isClosed) return;
        isClosed = true;
        if (animationId) cancelAnimationFrame(animationId);
        backdrop.classList.add("winner-celebration--closing");
        window.setTimeout(() => {
          backdrop.remove();
          resolve();
        }, 220);
      }

      closeButton?.addEventListener("click", closeCelebration);
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeCelebration();
      });
      document.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") closeCelebration();
        },
        { once: true },
      );
    });
  }

  window.ScorekeeperCelebration = { show, variants: VARIANT_KEYS };
})();
