/* ============================================================
   Hue & You — game.js
   World, movement, dialogs, color restoration and the ending.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- constants ---------------- */
  const TILE = 32, COLS = 30, ROWS = 21;
  const W = COLS * TILE, H = ROWS * TILE;

  // tile types
  const T_GRASS = 0, T_PATH = 1, T_PLAZA = 2, T_WATER = 3, T_TREE = 4, T_FLOWER = 5, T_ROCK = 6;

  const PAL = {
    grassA: [104, 186, 96], grassB: [95, 175, 90],
    path: [199, 178, 140], pathEdge: [172, 152, 116],
    plaza: [186, 178, 164], plazaEdge: [160, 152, 140],
    waterDeep: [52, 120, 200], waterLight: [88, 158, 230],
    trunk: [112, 78, 48], canopyA: [48, 130, 62], canopyB: [70, 160, 78],
    rock: [148, 144, 140],
    wall: [240, 224, 190], door: [126, 84, 52], window: [255, 222, 130],
    pedestal: [172, 166, 176],
    flowerCols: [[238, 108, 154], [245, 212, 66], [250, 246, 240], [176, 107, 255], [242, 145, 61]]
  };
  const ROOFS = [[202, 72, 72], [72, 130, 202], [62, 172, 150], [232, 142, 62]];

  /* ---------------- canvas / dom ---------------- */
  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  const portraitCv = document.getElementById("portrait");
  const portraitCtx = portraitCv.getContext("2d");

  const el = (id) => document.getElementById(id);
  const titleScreen = el("titleScreen"), gameWrap = el("gameWrap");
  const promptEl = el("prompt"), toastEl = el("toast");
  const dialogEl = el("dialog"), dialogName = el("dialogName"), dialogText = el("dialogText");
  const dialogQuote = el("dialogQuote"), quoteText = el("quoteText"), quoteSource = el("quoteSource");
  const challengeOverlay = el("challengeOverlay"), challengeTitle = el("challengeTitle"),
        challengeDesc = el("challengeDesc"), challengeBody = el("challengeBody");
  const endingScreen = el("endingScreen");

  /* ---------------- sound (tiny WebAudio synth) ---------------- */
  const S = {
    ctx: null, muted: false,
    init() {
      if (this.ctx) return;
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
    },
    tone(freq, dur, type, vol, delay, slideTo) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(vol || 0.06, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    },
    play(name) {
      if (!this.ctx || this.muted) return;
      switch (name) {
        case "click": this.tone(660, 0.05, "square", 0.04); break;
        case "blip": this.tone(520, 0.06, "sine", 0.05); break;
        case "step": this.tone(190, 0.04, "triangle", 0.015); break;
        case "spark": this.tone(1200, 0.12, "sine", 0.06, 0, 1900); break;
        case "chime":
          this.tone(659, 0.16, "sine", 0.07);
          this.tone(880, 0.16, "sine", 0.07, 0.1);
          this.tone(1318, 0.22, "sine", 0.07, 0.2);
          break;
        case "bloom": this.tone(280, 0.9, "sine", 0.06, 0, 980); break;
        case "fanfare":
          [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.07, i * 0.16));
          this.tone(1318, 0.5, "sine", 0.06, 0.66);
          break;
      }
    }
  };

  /* ---------------- game state ---------------- */
  const G = {
    state: "title",        // title | play | dialog | challenge | award | endinganim | ending
    name: "Hero",
    crystals: 0,
    zones: [{ sat: 0, target: 0 }, { sat: 0, target: 0 }, { sat: 0, target: 0 }, { sat: 0, target: 0 }],
    player: {
      x: 15.5 * TILE, y: 12 * TILE + 26,
      frame: 0, moving: false,
      look: { hair: "short", hairColor: "#3b2a20", outfit: "#e84a4a", accessory: "none" }
    },
    profile: { traits: {}, answers: {} },
    dialog: null,          // { guardian, steps, idx, onFinish }
    award: null,           // { g, phase, t, from }
    nearGuardian: null,
    particles: [],
    flash: 0,
    time: 0
  };
  // API handed to the challenge modules
  const gameAPI = { profile: G.profile, player: G.player, sfx: (n) => S.play(n) };

  function zoneOf(tx, ty) { return (tx < 15 ? 0 : 1) + (ty < 11 ? 0 : 2); }
  function avgSat() { return (G.zones[0].sat + G.zones[1].sat + G.zones[2].sat + G.zones[3].sat) / 4; }
  const ZONE_RECT = [
    { x0: 1, y0: 1, x1: 14, y1: 10 },
    { x0: 15, y0: 1, x1: 28, y1: 10 },
    { x0: 1, y0: 11, x1: 14, y1: 19 },
    { x0: 15, y0: 11, x1: 28, y1: 19 }
  ];
  const fmt = (s) => s.split("{name}").join(G.name);

  /* ---------------- world build ---------------- */
  const map = [];
  const solid = [];
  const houses = [
    { x: 18, y: 2, roof: 0 }, { x: 23, y: 2, roof: 1 },
    { x: 19, y: 6, roof: 2 }, { x: 25, y: 6, roof: 3 }
  ];
  const fountain = { x: 14, y: 8 }; // 2x2
  // guardian world placement, by DATA.guardians order (mira, orin, pip, chroma)
  const SPOTS = [
    { gx: 5, gy: 4, px: 4, py: 4 },
    { gx: 22, gy: 5, px: 23, py: 5 },
    { gx: 5, gy: 15, px: 4, py: 15 },
    { gx: 22, gy: 15, px: 23, py: 15 }
  ];

  function buildMap() {
    for (let y = 0; y < ROWS; y++) {
      map[y] = []; solid[y] = [];
      for (let x = 0; x < COLS; x++) { map[y][x] = T_GRASS; solid[y][x] = false; }
    }
    const set = (x, y, t) => { if (x >= 0 && x < COLS && y >= 0 && y < ROWS) map[y][x] = t; };

    // border forest
    for (let x = 0; x < COLS; x++) { set(x, 0, T_TREE); set(x, ROWS - 1, T_TREE); }
    for (let y = 0; y < ROWS; y++) { set(0, y, T_TREE); set(COLS - 1, y, T_TREE); }

    // main paths: one across, two branches up, two branches down
    for (let x = 1; x < COLS - 1; x++) set(x, 10, T_PATH);
    for (let y = 5; y <= 14; y++) set(5, y, T_PATH);
    for (let y = 6; y <= 14; y++) set(22, y, T_PATH);

    // central plaza (ellipse) + fountain
    for (let y = 7; y <= 13; y++) {
      for (let x = 11; x <= 18; x++) {
        const dx = (x - 14.5) / 4.2, dy = (y - 10) / 3.2;
        if (dx * dx + dy * dy <= 1) set(x, y, T_PLAZA);
      }
    }

    // garden pond (SW)
    for (let y = 13; y <= 18; y++) {
      for (let x = 8; x <= 13; x++) {
        const dx = (x - 10.5) / 2.7, dy = (y - 15.5) / 2.0;
        if (dx * dx + dy * dy <= 1) set(x, y, T_WATER);
      }
    }

    // deterministic scatter of trees & flowers
    const hash = (x, y) => (x * 7 + y * 13 + ((x * x * 31 + y * 17) % 23)) % 100;
    const nearPath = (x, y) => map[y][x] !== T_GRASS ||
      (Math.abs(x - 5) <= 1 && y >= 4 && y <= 15) ||
      (Math.abs(x - 22) <= 1 && y >= 5 && y <= 15) ||
      Math.abs(y - 10) <= 1;
    const nearSpot = (x, y) => SPOTS.some((s) => Math.abs(x - s.gx) <= 2 && Math.abs(y - s.gy) <= 2);
    const inHouse = (x, y) => houses.some((h) => x >= h.x - 1 && x <= h.x + 2 && y >= h.y - 1 && y <= h.y + 2);
    const inFountain = (x, y) => x >= fountain.x - 1 && x <= fountain.x + 2 && y >= fountain.y - 1 && y <= fountain.y + 2;

    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        if (nearPath(x, y) || nearSpot(x, y) || inHouse(x, y) || inFountain(x, y)) continue;
        const z = zoneOf(x, y), h = hash(x, y);
        if (z === 0) { // deep woods
          if (h < 34) set(x, y, T_TREE);
          else if (h < 38) set(x, y, T_ROCK);
        } else if (z === 1) { // village
          if (h < 8) set(x, y, T_TREE);
          else if (h < 12) set(x, y, T_FLOWER);
        } else if (z === 2) { // garden
          if (h < 40) set(x, y, T_FLOWER);
          else if (h < 46) set(x, y, T_TREE);
        } else { // meadow
          if (h < 14) set(x, y, T_TREE);
          else if (h < 34) set(x, y, T_FLOWER);
          else if (h < 37) set(x, y, T_ROCK);
        }
      }
    }

    // solidity
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = map[y][x];
        solid[y][x] = (t === T_TREE || t === T_WATER || t === T_ROCK);
      }
    }
    houses.forEach((h) => {
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        map[h.y + dy][h.x + dx] = T_GRASS;
        solid[h.y + dy][h.x + dx] = true;
      }
    });
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      solid[fountain.y + dy][fountain.x + dx] = true;
    }
    SPOTS.forEach((s) => {
      map[s.gy][s.gx] = T_GRASS; solid[s.gy][s.gx] = true;   // guardian
      map[s.py][s.px] = T_GRASS; solid[s.py][s.px] = true;   // pedestal
      // breathing room right around them
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const tx = s.gx + dx, ty = s.gy + dy;
        if (map[ty][tx] === T_TREE || map[ty][tx] === T_ROCK) { map[ty][tx] = T_GRASS; solid[ty][tx] = false; }
      }
    });

    DATA.guardians.forEach((g, i) => {
      g.spot = SPOTS[i];
      g.earned = false;
    });
  }

  /* ---------------- input ---------------- */
  const keys = {};
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") {
      if (G.state === "title" && e.key === "Enter") startGame();
      return;
    }
    if (G.state === "title") {
      if (e.key === "Enter") startGame();
      return;
    }
    if (G.state === "challenge" || G.state === "ending") return; // modals handle themselves

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    keys[k] = true;

    if ((k === "e" || k === " " || k === "enter") && !e.repeat) {
      if (G.state === "dialog") advanceDialog();
      else if (G.state === "play") tryTalk();
    }
  });
  document.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  // touch controls
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) document.body.classList.add("touch");
  [["dUp", "arrowup"], ["dDown", "arrowdown"], ["dLeft", "arrowleft"], ["dRight", "arrowright"]].forEach(([id, key]) => {
    const b = el(id);
    const on = (e) => { e.preventDefault(); keys[key] = true; };
    const off = (e) => { e.preventDefault(); keys[key] = false; };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off);
    b.addEventListener("pointercancel", off);
  });
  el("actionBtn").addEventListener("click", () => {
    if (G.state === "dialog") advanceDialog();
    else if (G.state === "play") tryTalk();
  });
  dialogEl.addEventListener("click", () => { if (G.state === "dialog") advanceDialog(); });

  el("muteBtn").addEventListener("click", () => {
    S.muted = !S.muted;
    el("muteBtn").textContent = S.muted ? "🔇" : "🔊";
  });

  /* ---------------- dialog system ---------------- */
  function openDialog(guardian, steps, onFinish) {
    G.state = "dialog";
    G.dialog = { guardian, steps, idx: 0, onFinish };
    dialogEl.classList.remove("hidden");
    promptEl.classList.add("hidden");
    renderDialogStep();
  }

  function renderDialogStep() {
    const d = G.dialog;
    const step = d.steps[d.idx];
    dialogName.textContent = d.guardian.name;
    if (step.quote) {
      dialogText.innerHTML = "<em>They open a small, well-worn book and read aloud…</em>";
      quoteText.textContent = step.quote.text;
      quoteSource.textContent = `— ${step.quote.book}, by ${step.quote.author}`;
      dialogQuote.classList.remove("hidden");
    } else {
      dialogText.textContent = fmt(step.say);
      dialogQuote.classList.add("hidden");
    }
    S.play("blip");
  }

  function advanceDialog() {
    const d = G.dialog;
    if (!d) return;
    d.idx++;
    if (d.idx < d.steps.length) { renderDialogStep(); return; }
    dialogEl.classList.add("hidden");
    G.dialog = null;
    const fin = d.onFinish;
    G.state = "play";
    if (fin) fin();
  }

  function tryTalk() {
    const g = G.nearGuardian;
    if (!g) return;
    if (g.earned) {
      openDialog(g, [{ say: g.doneLine }], null);
      return;
    }
    const steps = g.intro.map((s) => ({ say: s }));
    steps.push({ quote: g.quote });
    steps.push({ say: g.lessonIntro });
    openDialog(g, steps, () => startChallenge(g));
  }

  /* ---------------- challenges ---------------- */
  function startChallenge(g) {
    G.state = "challenge";
    const ch = Challenges[g.challenge];
    challengeTitle.textContent = ch.title;
    challengeDesc.textContent = ch.desc;
    challengeBody.innerHTML = "";
    challengeOverlay.classList.remove("hidden");
    ch.build(challengeBody, gameAPI, () => completeChallenge(g));
  }

  function completeChallenge(g) {
    challengeOverlay.classList.add("hidden");
    challengeBody.innerHTML = "";
    g.earned = true;
    G.crystals++;
    S.play("chime");
    G.state = "award";
    G.award = {
      g, phase: "fly", t: 0,
      from: { x: g.spot.px * TILE + TILE / 2, y: g.spot.py * TILE - 6 },
      to: { x: W / 2, y: 14 }
    };
  }

  function updateAward(dt) {
    const a = G.award;
    if (!a) return;
    a.t += dt;
    if (a.phase === "fly" && a.t >= 1.0) {
      a.phase = "bloom"; a.t = 0;
      S.play("bloom");
      const z = a.g.zone;
      G.zones[z].target = 1;
      spawnBloom(z, a.g.crystal.color);
      updateHud(a.g);
    } else if (a.phase === "bloom" && a.t >= 2.1) {
      const g = a.g;
      G.award = null;
      openDialog(g, [{ say: g.farewell }], () => {
        if (G.crystals >= 4) endingSequence();
        else {
          showToast(`✦ ${g.crystal.name} restored — ${G.crystals} of 4! ✦`, 3500);
          el("hudObjective").textContent = `Crystals: ${G.crystals}/4 — find the next Guardian!`;
        }
      });
    }
  }

  /* ---------------- particles & bloom ---------------- */
  function spawnBloom(z, crystalRgb) {
    const r = ZONE_RECT[z];
    const colors = PAL.flowerCols.concat([crystalRgb, [255, 255, 255]]);
    for (let i = 0; i < 150; i++) {
      const c = colors[(Math.random() * colors.length) | 0];
      G.particles.push({
        x: (r.x0 + Math.random() * (r.x1 - r.x0 + 1)) * TILE,
        y: (r.y0 + Math.random() * (r.y1 - r.y0 + 1)) * TILE,
        vx: (Math.random() - 0.5) * 14,
        vy: -22 - Math.random() * 40,
        g: 0,
        life: 1 + Math.random() * 1.4, max: 2.4,
        color: `rgb(${c[0]},${c[1]},${c[2]})`,
        size: 2 + Math.random() * 3,
        shape: Math.random() < 0.4 ? "star" : "dot"
      });
    }
  }

  function spawnConfetti() {
    for (let i = 0; i < 240; i++) {
      const hue = (Math.random() * 360) | 0;
      G.particles.push({
        x: Math.random() * W, y: -10 - Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 60,
        vy: 60 + Math.random() * 90,
        g: 30,
        life: 3 + Math.random() * 2, max: 5,
        color: `hsl(${hue}, 85%, 60%)`,
        size: 3 + Math.random() * 4,
        shape: Math.random() < 0.5 ? "rect" : "dot"
      });
    }
  }

  function updateParticles(dt) {
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const p = G.particles[i];
      p.life -= dt;
      if (p.life <= 0) { G.particles.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    // gentle ambient sparkles in restored zones
    for (let z = 0; z < 4; z++) {
      if (G.zones[z].sat > 0.9 && Math.random() < 0.02) {
        const r = ZONE_RECT[z];
        G.particles.push({
          x: (r.x0 + Math.random() * (r.x1 - r.x0 + 1)) * TILE,
          y: (r.y0 + Math.random() * (r.y1 - r.y0 + 1)) * TILE,
          vx: 0, vy: -10, g: 0,
          life: 1.2, max: 1.2,
          color: "rgba(255,255,255,0.9)",
          size: 1.6 + Math.random() * 1.6, shape: "star"
        });
      }
    }
  }

  /* ---------------- ending ---------------- */
  function endingSequence() {
    G.state = "endinganim";
    el("hudObjective").textContent = "The world is in color again!";
    G.flash = 1;
    S.play("fanfare");
    spawnConfetti();
    setTimeout(showEnding, 3000);
  }

  function showEnding() {
    G.state = "ending";
    const a = G.profile.answers;
    const arch = Challenges.computeArchetype(G.profile);

    el("endingHeroLine").textContent = `Well done, ${G.name} — your choices brought every color back.`;
    el("resultName").textContent = `${arch.icon} ${arch.name}`;
    el("resultDesc").textContent = arch.desc;

    const recap = [];
    if (a.color) {
      recap.push(`Your color: <b>${a.color.name}</b>` +
        (a.color.genuinePopular
          ? " — the popular pick, but you stood by it because <b>you</b> truly love it. That counts double."
          : " — picked from your heart, not the crowd."));
    }
    if (a.maze) recap.push(`Your path through the maze: <b>${DATA.mazeStyles[a.maze].label}</b>.`);
    if (a.look) recap.push(`Your look: <b>${a.look.hair}</b> with <b>${a.look.accessory}</b> — one of a kind.`);
    if (a.strength) recap.push(`Your strength, in your own words: <b>${a.strength}</b>.`);
    if (a.interests && a.interests.length) recap.push(`What lights you up: <b>${a.interests.join(", ")}</b>.`);
    el("choiceRecap").innerHTML = recap.map((r) => `<li>${r}</li>`).join("");

    el("lessonRecap").innerHTML = DATA.guardians.map((g) =>
      `<li><em>${g.quote.book}</em> (${g.quote.author}) — ${g.lesson}</li>`
    ).join("");

    endingScreen.classList.remove("hidden");
  }

  el("replayBtn").addEventListener("click", () => location.reload());

  /* ---------------- HUD / toast ---------------- */
  function updateHud(g) {
    const idx = DATA.guardians.indexOf(g);
    const slot = el("slot" + idx);
    slot.classList.add("earned");
    slot.style.setProperty("--gem-color", g.crystal.glow);
    slot.style.setProperty("--gem-glow", g.crystal.glow);
    el("colorMeterFill").style.width = (G.crystals * 25) + "%";
    el("colorMeterLabel").textContent = (G.crystals * 25) + "% color";
  }

  let toastTimer = null;
  function showToast(text, ms) {
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add("hidden"), ms || 3000);
  }

  /* ---------------- update ---------------- */
  function isSolidAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
    return solid[ty][tx];
  }
  function boxFree(cx, cy) {
    const hw = 8, top = 10, bot = 1;
    return !isSolidAt(cx - hw, cy - top) && !isSolidAt(cx + hw, cy - top) &&
           !isSolidAt(cx - hw, cy - bot) && !isSolidAt(cx + hw, cy - bot);
  }

  let stepClock = 0;
  function update(dt) {
    G.time += dt;

    // zone color tween
    for (const z of G.zones) {
      if (z.sat < z.target) z.sat = Math.min(z.target, z.sat + dt * 0.55);
    }
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 0.7);

    updateParticles(dt);
    if (G.state === "award") updateAward(dt);

    // movement
    const p = G.player;
    p.moving = false;
    if (G.state === "play") {
      let dx = 0, dy = 0;
      if (keys["arrowup"] || keys["w"]) dy -= 1;
      if (keys["arrowdown"] || keys["s"]) dy += 1;
      if (keys["arrowleft"] || keys["a"]) dx -= 1;
      if (keys["arrowright"] || keys["d"]) dx += 1;
      if (dx || dy) {
        const len = Math.hypot(dx, dy);
        const sp = 152 * dt;
        const nx = p.x + (dx / len) * sp;
        const ny = p.y + (dy / len) * sp;
        if (boxFree(nx, p.y)) p.x = nx;
        if (boxFree(p.x, ny)) p.y = ny;
        p.moving = true;
        p.frame += dt * 2.4;
        stepClock += dt;
        if (stepClock > 0.26) { stepClock = 0; S.play("step"); }
      }

      // nearest guardian
      G.nearGuardian = null;
      let best = 64;
      for (const g of DATA.guardians) {
        const gx = g.spot.gx * TILE + TILE / 2, gy = g.spot.gy * TILE + TILE / 2;
        const d = Math.hypot(p.x - gx, p.y - gy + 8);
        if (d < best) { best = d; G.nearGuardian = g; }
      }
      if (G.nearGuardian) {
        promptEl.innerHTML = `Press <b>E</b> to talk to ${G.nearGuardian.name}`;
        promptEl.classList.remove("hidden");
      } else {
        promptEl.classList.add("hidden");
      }
    } else {
      promptEl.classList.add("hidden");
    }

    // live portrait while a dialog is open
    if (G.dialog) {
      const g = G.dialog.guardian;
      portraitCtx.clearRect(0, 0, 84, 84);
      const grd = portraitCtx.createLinearGradient(0, 0, 0, 84);
      grd.addColorStop(0, "#f4ecd9"); grd.addColorStop(1, "#e3d8be");
      portraitCtx.fillStyle = grd;
      portraitCtx.fillRect(0, 0, 84, 84);
      SPR.drawGuardian(portraitCtx, g.sprite, 42, 76, G.time, G.zones[g.zone].sat, 1.7);
    }
  }

  /* ---------------- render ---------------- */
  function tileSat(tx, ty) {
    const z = zoneOf(tx, ty);
    return G.zones[z].sat;
  }

  function render() {
    const t = G.time;
    ctx.clearRect(0, 0, W, H);

    /* --- tiles --- */
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const sat = tileSat(x, y);
        const px = x * TILE, py = y * TILE;
        const type = map[y][x];

        // grass base everywhere
        const g = ((x * 7 + y * 13) % 2 === 0) ? PAL.grassA : PAL.grassB;
        ctx.fillStyle = SPR.tint(g, sat);
        ctx.fillRect(px, py, TILE, TILE);
        if ((x * 13 + y * 7) % 5 === 0) {
          ctx.fillStyle = SPR.tint([80, 150, 76], sat);
          ctx.fillRect(px + 8, py + 12, 3, 3);
          ctx.fillRect(px + 20, py + 22, 3, 3);
        }

        if (type === T_PATH || type === T_PLAZA) {
          const base = type === T_PATH ? PAL.path : PAL.plaza;
          const edge = type === T_PATH ? PAL.pathEdge : PAL.plazaEdge;
          ctx.fillStyle = SPR.tint(base, sat);
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = SPR.tint(edge, sat);
          if ((x + y) % 2 === 0) { ctx.fillRect(px + 2, py + 2, 12, 12); ctx.fillRect(px + 17, py + 17, 12, 12); }
          else { ctx.fillRect(px + 17, py + 2, 12, 12); ctx.fillRect(px + 2, py + 17, 12, 12); }
        } else if (type === T_WATER) {
          ctx.fillStyle = SPR.tint(PAL.waterDeep, sat);
          ctx.fillRect(px, py, TILE, TILE);
          const wave = Math.sin(t * 2 + x * 1.3 + y * 0.9);
          ctx.fillStyle = SPR.tint(PAL.waterLight, sat, 0.5 + 0.3 * wave);
          ctx.fillRect(px + 3, py + 6 + wave * 3, TILE - 6, 5);
          ctx.fillRect(px + 6, py + 20 - wave * 3, TILE - 12, 4);
        } else if (type === T_ROCK) {
          ctx.fillStyle = SPR.tint(PAL.rock, sat);
          ctx.beginPath();
          ctx.ellipse(px + 16, py + 19, 12, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = SPR.tint([170, 166, 162], sat);
          ctx.beginPath();
          ctx.ellipse(px + 12, py + 15, 5, 3.4, -0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === T_FLOWER) {
          const c = PAL.flowerCols[(x * 5 + y * 3) % PAL.flowerCols.length];
          const sway = Math.sin(t * 1.6 + x + y) * 1.2;
          if (sat < 0.35) {
            // a gray, sleeping bud
            ctx.strokeStyle = SPR.tint([70, 110, 70], sat);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px + 16, py + 26); ctx.lineTo(px + 16 + sway, py + 16); ctx.stroke();
            ctx.fillStyle = SPR.tint([120, 120, 120], sat);
            ctx.beginPath(); ctx.arc(px + 16 + sway, py + 14, 3.5, 0, Math.PI * 2); ctx.fill();
          } else {
            // in bloom!
            const bloom = Math.min(1, (sat - 0.35) / 0.65);
            ctx.strokeStyle = SPR.tint([60, 140, 66], sat);
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px + 16, py + 27); ctx.lineTo(px + 16 + sway, py + 15); ctx.stroke();
            const r = 2.4 + 2.6 * bloom;
            for (let i = 0; i < 5; i++) {
              const a = (Math.PI * 2 * i) / 5 + sway * 0.1;
              ctx.fillStyle = SPR.tint(c, sat);
              ctx.beginPath();
              ctx.arc(px + 16 + sway + Math.cos(a) * r, py + 13 + Math.sin(a) * r, r * 0.78, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = SPR.tint([255, 224, 110], sat);
            ctx.beginPath(); ctx.arc(px + 16 + sway, py + 13, r * 0.55, 0, Math.PI * 2); ctx.fill();
          }
        } else if (type === T_TREE) {
          const v = (x * 11 + y * 17) % 7;
          ctx.fillStyle = SPR.tint(PAL.trunk, sat);
          ctx.fillRect(px + 13, py + 16, 6, 14);
          ctx.fillStyle = SPR.tint(PAL.canopyA, sat);
          ctx.beginPath(); ctx.arc(px + 16, py + 8, 13 + (v % 3), 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = SPR.tint(PAL.canopyB, sat);
          ctx.beginPath(); ctx.arc(px + 11 - (v % 2) * 2, py + 5, 7, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px + 21, py + 9, 6.4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    /* --- houses --- */
    houses.forEach((h) => {
      const px = h.x * TILE, py = h.y * TILE;
      const sat = tileSat(h.x, h.y);
      // walls
      ctx.fillStyle = SPR.tint(PAL.wall, sat);
      ctx.fillRect(px + 2, py + 22, 60, 40);
      ctx.strokeStyle = "rgba(35,28,42,.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 22, 60, 40);
      // roof
      ctx.fillStyle = SPR.tint(ROOFS[h.roof], sat);
      ctx.beginPath();
      ctx.moveTo(px - 2, py + 24);
      ctx.lineTo(px + 32, py + 0);
      ctx.lineTo(px + 66, py + 24);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // door
      ctx.fillStyle = SPR.tint(PAL.door, sat);
      ctx.fillRect(px + 26, py + 40, 13, 22);
      ctx.strokeRect(px + 26, py + 40, 13, 22);
      // windows — they light up warmly as color returns
      ctx.fillStyle = SPR.tint(PAL.window, Math.max(sat, 0.08));
      ctx.fillRect(px + 9, py + 30, 11, 10);
      ctx.fillRect(px + 45, py + 30, 11, 10);
      ctx.strokeRect(px + 9, py + 30, 11, 10);
      ctx.strokeRect(px + 45, py + 30, 11, 10);
    });

    /* --- fountain --- */
    {
      const fx = fountain.x * TILE, fy = fountain.y * TILE;
      const sat = avgSat();
      ctx.fillStyle = SPR.tint([176, 172, 182], sat);
      ctx.beginPath(); ctx.ellipse(fx + 32, fy + 36, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(35,28,42,.5)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = SPR.tint(PAL.waterDeep, sat);
      ctx.beginPath(); ctx.ellipse(fx + 32, fy + 36, 23, 16, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const rp = ((t * 0.8 + i / 3) % 1);
        ctx.strokeStyle = SPR.tint(PAL.waterLight, sat, 0.8 * (1 - rp));
        ctx.beginPath(); ctx.ellipse(fx + 32, fy + 36, 4 + rp * 18, 3 + rp * 12, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = SPR.tint([186, 182, 192], sat);
      ctx.beginPath(); ctx.ellipse(fx + 32, fy + 24, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      // spray
      ctx.fillStyle = SPR.tint(PAL.waterLight, sat, 0.9);
      for (let i = 0; i < 5; i++) {
        const a = t * 3 + (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(fx + 32 + Math.cos(a) * 5, fy + 18 - Math.abs(Math.sin(a)) * 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* --- pedestals & crystals --- */
    DATA.guardians.forEach((g) => {
      const s = g.spot;
      const px = s.px * TILE, py = s.py * TILE;
      const sat = G.zones[g.zone].sat;
      ctx.fillStyle = SPR.tint(PAL.pedestal, sat);
      ctx.fillRect(px + 8, py + 10, 16, 18);
      ctx.fillStyle = SPR.tint([150, 144, 156], sat);
      ctx.fillRect(px + 5, py + 24, 22, 6);
      ctx.fillRect(px + 6, py + 8, 20, 5);
      ctx.strokeStyle = "rgba(35,28,42,.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 8, py + 10, 16, 18);
      // rune glow — crystals are beacons, vivid even in the gray
      const pulse = 0.45 + 0.3 * Math.sin(t * 3 + s.px);
      ctx.fillStyle = g.earned
        ? `rgba(${g.crystal.color[0]},${g.crystal.color[1]},${g.crystal.color[2]},0.25)`
        : `rgba(${g.crystal.color[0]},${g.crystal.color[1]},${g.crystal.color[2]},${pulse})`;
      ctx.beginPath(); ctx.arc(px + 16, py + 17, 5, 0, Math.PI * 2); ctx.fill();
      if (!g.earned) {
        SPR.drawCrystal(ctx, px + TILE / 2, py - 6, g.crystal.color, t, 1);
      }
    });

    /* --- entities (guardians + player), painter's order --- */
    const ents = DATA.guardians.map((g) => ({
      y: g.spot.gy * TILE + 30,
      draw: () => {
        const gx = g.spot.gx * TILE + TILE / 2, gy = g.spot.gy * TILE + 30;
        ctx.fillStyle = "rgba(35,28,42,.25)";
        ctx.beginPath(); ctx.ellipse(gx, gy, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        SPR.drawGuardian(ctx, g.sprite, gx, gy, t + g.zone, G.zones[g.zone].sat, 1);
        if (!g.earned) {
          // a soft "!" beacon over guardians you haven't helped yet
          ctx.fillStyle = `rgba(255,225,77,${0.6 + 0.4 * Math.sin(t * 3)})`;
          ctx.font = "bold 15px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("!", gx, gy - 44 - Math.sin(t * 3) * 2);
          ctx.textAlign = "left";
        }
      }
    }));
    ents.push({
      y: G.player.y,
      draw: () => {
        ctx.fillStyle = "rgba(35,28,42,.25)";
        ctx.beginPath(); ctx.ellipse(G.player.x, G.player.y, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        SPR.drawPlayer(ctx, G.player.x, G.player.y, G.player.look, G.player.frame, G.player.moving, 0.95);
      }
    });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

    /* --- award crystal flying to the HUD --- */
    if (G.award && G.award.phase === "fly") {
      const a = G.award;
      const k = Math.min(1, a.t / 1.0);
      const e = 1 - Math.pow(1 - k, 3);
      const x = a.from.x + (a.to.x - a.from.x) * e;
      const y = a.from.y + (a.to.y - a.from.y) * e - Math.sin(k * Math.PI) * 60;
      SPR.drawCrystal(ctx, x, y, a.g.crystal.color, t, 1.3 - 0.7 * k);
    }

    /* --- particles --- */
    for (const p of G.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.max * 1.6));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === "star") {
        SPR.starPath(ctx, p.x, p.y, p.size * 1.6, 4);
        ctx.fill();
      } else if (p.shape === "rect") {
        ctx.fillRect(p.x, p.y, p.size, p.size * 1.6);
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* --- gray gloom + vignette --- */
    const gloom = 1 - avgSat();
    if (gloom > 0.01) {
      ctx.fillStyle = `rgba(118,118,128,${0.17 * gloom})`;
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, "rgba(20,16,30,0)");
    vg.addColorStop(1, `rgba(20,16,30,${0.16 + 0.14 * gloom})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    /* --- celebration flash --- */
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(255,252,240,${G.flash * 0.85})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ---------------- main loop ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (G.state !== "title") {
      update(dt);
      render();
    }
    requestAnimationFrame(loop);
  }

  /* ---------------- boot ---------------- */
  function startGame() {
    S.init();
    if (S.ctx && S.ctx.state === "suspended") S.ctx.resume();
    const nm = el("nameInput").value.trim();
    G.name = nm ? nm.slice(0, 14) : "Hero";
    el("hudName").textContent = G.name;
    titleScreen.classList.add("hidden");
    gameWrap.classList.remove("hidden");
    G.state = "play";
    S.play("chime");
    showToast("Find the 4 glowing crystals! Move: WASD / Arrows · Talk: E", 5200);
  }

  el("startBtn").addEventListener("click", startGame);

  buildMap();
  requestAnimationFrame(loop);

  // debug/testing handle
  window.__HUE = { map, solid, spots: SPOTS, state: G };
})();
