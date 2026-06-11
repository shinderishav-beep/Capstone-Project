/* ============================================================
   Hue & You — challenges.js
   The four "be yourself" challenges. Each builds its UI inside
   the challenge modal and calls done() when the player succeeds.
   Every answer feeds the personality profile ("what person you are").
   ============================================================ */

const Challenges = {};

/* ---------- deterministic RNG for the maze ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addTrait(game, trait, pts) {
  game.profile.traits[trait] = (game.profile.traits[trait] || 0) + pts;
}

/* ============================================================
   1) ORIN — "Choose YOUR favorite color" (not the popular one)
   ============================================================ */
Challenges.color = {
  title: "Paint the Village Door",
  desc: "Orin hands you a brush. Eight pots of paint sit on the library steps. Which color is YOUR favorite? (One of them is what almost everyone picks…)",

  build(body, game, done) {
    let selected = null;
    let askedAboutPopular = false;

    const grid = document.createElement("div");
    grid.className = "swatch-grid";

    const actions = document.createElement("div");
    actions.className = "challenge-actions";
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "challenge-btn primary";
    confirmBtn.textContent = "Paint it!";
    confirmBtn.disabled = true;
    actions.appendChild(confirmBtn);

    const noteHolder = document.createElement("div");

    DATA.colors.forEach((c) => {
      const b = document.createElement("button");
      b.className = "swatch";
      b.style.background = c.hex;
      b.innerHTML = `<span class="swatch-name">${c.name}</span>` +
        (c.popular ? `<span class="popular-tag">★ 87% pick this</span>` : "");
      b.addEventListener("click", () => {
        grid.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
        b.classList.add("selected");
        selected = c;
        confirmBtn.disabled = false;
        noteHolder.innerHTML = "";
        askedAboutPopular = false;
        game.sfx("click");
      });
      grid.appendChild(b);
    });

    function finish(genuinePopular) {
      addTrait(game, selected.trait, 2);
      if (genuinePopular) addTrait(game, "bold", 1); // standing by your choice under peer pressure
      game.profile.answers.color = { name: selected.name, hex: selected.hex, popular: !!selected.popular, genuinePopular: !!genuinePopular };
      done();
    }

    confirmBtn.addEventListener("click", () => {
      if (!selected) return;
      game.sfx("click");
      if (selected.popular && !askedAboutPopular) {
        askedAboutPopular = true;
        noteHolder.innerHTML = "";
        const note = document.createElement("div");
        note.className = "gentle-note";
        note.innerHTML = `<b>Orin tilts his head:</b> "Hoo… ${selected.name} is what almost everyone picks.
          Did you choose it because <em>you</em> truly love it — or because everyone else does?"`;
        const row = document.createElement("div");
        row.className = "challenge-actions";
        const yes = document.createElement("button");
        yes.className = "challenge-btn primary";
        yes.textContent = "It's truly MY favorite 💙";
        yes.addEventListener("click", () => { game.sfx("click"); finish(true); });
        const again = document.createElement("button");
        again.className = "challenge-btn";
        again.textContent = "Hmm… let me look again";
        again.addEventListener("click", () => {
          game.sfx("click");
          noteHolder.innerHTML = "";
          grid.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
          selected = null;
          confirmBtn.disabled = true;
          askedAboutPopular = false;
        });
        row.appendChild(again);
        row.appendChild(yes);
        note.appendChild(row);
        noteHolder.appendChild(note);
        return;
      }
      finish(false);
    });

    body.appendChild(grid);
    body.appendChild(noteHolder);
    body.appendChild(actions);
  }
};

/* ============================================================
   2) MIRA — the hedge maze with many valid paths
   ============================================================ */
Challenges.maze = {
  title: "The Maze of Many Ways",
  desc: "Reach the glowing crystal gate on the far side. The maze has several ways through — wander, hunt the golden sparks, or beeline straight for it. However YOU move is the right way.",

  build(body, game, done) {
    const COLS = 13, ROWS = 9, CELL = 34;
    const grid = genMaze(COLS, ROWS, 20260611);
    const exit = { x: COLS - 1, y: ROWS - 2 };
    grid[exit.y][exit.x] = 0;

    const sparks = [
      { x: 11, y: 1, got: false },
      { x: 1, y: 7, got: false },
      { x: 7, y: 5, got: false }
    ].filter((sp) => grid[sp.y][sp.x] === 0 && !(sp.x === 1 && sp.y === 1));

    let openCount = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === 0) openCount++;

    const pos = { x: 1, y: 1 };
    const visited = new Set(["1,1"]);
    let won = false;

    const cv = document.createElement("canvas");
    cv.id = "mazeCanvas";
    cv.width = COLS * CELL;
    cv.height = ROWS * CELL;
    const mctx = cv.getContext("2d");

    const hint = document.createElement("p");
    hint.className = "maze-hint";
    const updateHint = () => {
      const got = sparks.filter((s) => s.got).length;
      hint.innerHTML = `Arrow keys / WASD to move · Golden sparks found: <b>${got} / ${sparks.length}</b> (optional!)`;
    };
    updateHint();

    const touch = document.createElement("div");
    touch.className = "maze-touch";
    [["◀", -1, 0], ["▲", 0, -1], ["▼", 0, 1], ["▶", 1, 0]].forEach(([label, dx, dy]) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.addEventListener("click", () => move(dx, dy));
      touch.appendChild(b);
    });

    body.appendChild(cv);
    body.appendChild(hint);
    body.appendChild(touch);

    const ac = new AbortController();
    document.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      let dx = 0, dy = 0;
      if (k === "arrowup" || k === "w") dy = -1;
      else if (k === "arrowdown" || k === "s") dy = 1;
      else if (k === "arrowleft" || k === "a") dx = -1;
      else if (k === "arrowright" || k === "d") dx = 1;
      else return;
      e.preventDefault();
      move(dx, dy);
    }, { signal: ac.signal });

    function move(dx, dy) {
      if (won) return;
      const nx = pos.x + dx, ny = pos.y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || grid[ny][nx] === 1) return;
      pos.x = nx; pos.y = ny;
      visited.add(nx + "," + ny);
      game.sfx("step");
      for (const sp of sparks) {
        if (!sp.got && sp.x === nx && sp.y === ny) {
          sp.got = true;
          game.sfx("spark");
          updateHint();
        }
      }
      if (nx === exit.x && ny === exit.y) win();
    }

    function win() {
      won = true;
      game.sfx("chime");
      const gotSparks = sparks.filter((s) => s.got).length;
      const ratio = visited.size / openCount;
      let styleKey;
      if (gotSparks >= 2) styleKey = "explorer";
      else if (ratio < 0.42) styleKey = "direct";
      else styleKey = "steady";
      addTrait(game, DATA.mazeStyles[styleKey].trait, 2);
      game.profile.answers.maze = styleKey;
      hint.innerHTML = "<b>You found YOUR way through! 🌟</b>";
      setTimeout(() => { ac.abort(); cancelAnimationFrame(raf); done(); }, 1000);
    }

    /* --- render loop --- */
    let raf;
    const t0 = performance.now();
    function draw(now) {
      const t = (now - t0) / 1000;
      mctx.clearRect(0, 0, cv.width, cv.height);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (grid[y][x] === 1) {
            // hedge wall
            mctx.fillStyle = "#454060";
            mctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            mctx.fillStyle = "#555077";
            mctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 10);
          } else {
            mctx.fillStyle = (x + y) % 2 === 0 ? "#d9d5c9" : "#d2cec1";
            mctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            if (visited.has(x + "," + y)) {
              // the player's own colorful trail
              mctx.fillStyle = "rgba(124,77,255,.22)";
              mctx.beginPath();
              mctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 5, 0, Math.PI * 2);
              mctx.fill();
            }
          }
        }
      }
      // sparks
      for (const sp of sparks) {
        if (sp.got) continue;
        mctx.fillStyle = `rgba(255,200,60,${0.7 + 0.3 * Math.sin(t * 4 + sp.x)})`;
        SPR.starPath(mctx, sp.x * CELL + CELL / 2, sp.y * CELL + CELL / 2, 8 + Math.sin(t * 4 + sp.x), 5);
        mctx.fill();
      }
      // exit crystal gate
      SPR.drawCrystal(mctx, exit.x * CELL + CELL / 2, exit.y * CELL + CELL / 2, [94, 201, 106], t, 1.1);
      // player
      const px = pos.x * CELL + CELL / 2, py = pos.y * CELL + CELL / 2;
      mctx.fillStyle = game.player.look.outfit;
      mctx.beginPath(); mctx.arc(px, py, 10, 0, Math.PI * 2); mctx.fill();
      mctx.strokeStyle = "#2b2433"; mctx.lineWidth = 2; mctx.stroke();
      mctx.fillStyle = "#2b2433";
      mctx.beginPath(); mctx.arc(px - 3, py - 2, 1.6, 0, Math.PI * 2); mctx.fill();
      mctx.beginPath(); mctx.arc(px + 3, py - 2, 1.6, 0, Math.PI * 2); mctx.fill();
      mctx.beginPath(); mctx.arc(px, py + 1.5, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); mctx.lineWidth = 1.5; mctx.stroke();

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
  }
};

/* perfect maze via iterative backtracker + extra openings for multiple routes */
function genMaze(cols, rows, seed) {
  const rng = mulberry32(seed);
  const g = Array.from({ length: rows }, () => Array(cols).fill(1));
  const stack = [[1, 1]];
  g[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && g[ny][nx] === 1;
    });
    if (!dirs.length) { stack.pop(); continue; }
    const [dx, dy] = dirs[Math.floor(rng() * dirs.length)];
    g[y + dy / 2][x + dx / 2] = 0;
    g[y + dy][x + dx] = 0;
    stack.push([x + dx, y + dy]);
  }
  // knock out a few walls so there is more than one way through
  const cand = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (g[y][x] !== 1) continue;
      if ((g[y][x - 1] === 0 && g[y][x + 1] === 0) || (g[y - 1][x] === 0 && g[y + 1][x] === 0)) {
        cand.push([x, y]);
      }
    }
  }
  for (let i = cand.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cand[i], cand[j]] = [cand[j], cand[i]];
  }
  for (let i = 0; i < Math.min(5, cand.length); i++) g[cand[i][1]][cand[i][0]] = 0;
  return g;
}

/* ============================================================
   3) CHROMA — design your own look
   ============================================================ */
Challenges.style = {
  title: "The Easel of You",
  desc: "Mix and match until the hero in the mirror feels like YOU. There is no wrong look — only your look.",

  build(body, game, done) {
    const look = Object.assign({}, game.player.look); // working copy

    const layout = document.createElement("div");
    layout.className = "style-layout";

    const cv = document.createElement("canvas");
    cv.id = "stylePreview";
    cv.width = 190; cv.height = 210;
    const pctx = cv.getContext("2d");

    const opts = document.createElement("div");
    opts.className = "style-options";

    /* hair style */
    opts.appendChild(group("Hair style", chipRow(DATA.hairStyles.map((h) => ({
      label: h.label, value: h.id, selected: look.hair === h.id
    })), (v) => { look.hair = v; game.sfx("click"); })));

    /* hair color */
    opts.appendChild(group("Hair color", dotRow(DATA.hairColors, look.hairColor, (v) => { look.hairColor = v; game.sfx("click"); })));

    /* outfit color */
    opts.appendChild(group("Outfit color", dotRow(DATA.outfitColors, look.outfit, (v) => { look.outfit = v; game.sfx("click"); })));

    /* accessory */
    opts.appendChild(group("Finishing touch", chipRow(DATA.accessories.map((a) => ({
      label: a.label, value: a.id, selected: look.accessory === a.id
    })), (v) => { look.accessory = v; game.sfx("click"); })));

    const actions = document.createElement("div");
    actions.className = "challenge-actions";
    const ok = document.createElement("button");
    ok.className = "challenge-btn primary";
    ok.textContent = "✨ This is me!";
    ok.addEventListener("click", () => {
      game.sfx("click");
      cancelAnimationFrame(raf);
      Object.assign(game.player.look, look);
      addTrait(game, "creative", 2);
      const acc = DATA.accessories.find((a) => a.id === look.accessory);
      if (acc) addTrait(game, acc.trait, 1);
      const hairLabel = DATA.hairStyles.find((h) => h.id === look.hair).label.toLowerCase();
      game.profile.answers.look = {
        hair: hairLabel,
        accessory: acc ? acc.label.toLowerCase() : "no accessory"
      };
      done();
    });
    actions.appendChild(ok);

    layout.appendChild(cv);
    layout.appendChild(opts);
    body.appendChild(layout);
    body.appendChild(actions);

    /* live preview */
    let raf;
    const t0 = performance.now();
    function draw(now) {
      const t = (now - t0) / 1000;
      pctx.clearRect(0, 0, cv.width, cv.height);
      // spotlight
      const gr = pctx.createRadialGradient(95, 150, 10, 95, 150, 95);
      gr.addColorStop(0, "rgba(255,250,220,.85)");
      gr.addColorStop(1, "rgba(255,250,220,0)");
      pctx.fillStyle = gr;
      pctx.fillRect(0, 0, cv.width, cv.height);
      pctx.fillStyle = "rgba(43,36,51,.18)";
      pctx.beginPath(); pctx.ellipse(95, 178, 46, 10, 0, 0, Math.PI * 2); pctx.fill();
      SPR.drawPlayer(pctx, 95, 178, look, t * 0.4, true, 4);
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    /* helpers */
    function group(label, content) {
      const g = document.createElement("div");
      g.className = "style-group";
      const l = document.createElement("div");
      l.className = "group-label";
      l.textContent = label;
      g.appendChild(l);
      g.appendChild(content);
      return g;
    }
    function chipRow(items, onPick) {
      const row = document.createElement("div");
      row.className = "chip-row";
      items.forEach((it) => {
        const c = document.createElement("button");
        c.className = "chip" + (it.selected ? " selected" : "");
        c.textContent = it.label;
        c.addEventListener("click", () => {
          row.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
          c.classList.add("selected");
          onPick(it.value);
        });
        row.appendChild(c);
      });
      return row;
    }
    function dotRow(colors, current, onPick) {
      const row = document.createElement("div");
      row.className = "dot-row";
      colors.forEach((hex) => {
        const d = document.createElement("button");
        d.className = "color-dot" + (hex === current ? " selected" : "");
        d.style.background = hex;
        d.setAttribute("aria-label", hex);
        d.addEventListener("click", () => {
          row.querySelectorAll(".color-dot").forEach((x) => x.classList.remove("selected"));
          d.classList.add("selected");
          onPick(hex);
        });
        row.appendChild(d);
      });
      return row;
    }
  }
};

/* ============================================================
   4) PIP — honest questions about interests & strengths
   ============================================================ */
Challenges.quiz = {
  title: "Sing Your Own Song",
  desc: "Pip hops closer, listening with his whole heart. Answer with YOUR truth — not what sounds impressive.",

  build(body, game, done) {
    let idx = 0;
    game.profile.answers.interests = [];

    function render() {
      body.innerHTML = "";
      const q = DATA.quiz[idx];

      const prog = document.createElement("div");
      prog.className = "quiz-progress";
      prog.textContent = `Question ${idx + 1} of ${DATA.quiz.length}`;
      body.appendChild(prog);

      const qEl = document.createElement("div");
      qEl.className = "quiz-question";
      qEl.textContent = q.q;
      body.appendChild(qEl);

      const optWrap = document.createElement("div");
      optWrap.className = "quiz-options";
      q.options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "quiz-option";
        b.textContent = o.text;
        b.addEventListener("click", () => {
          game.sfx("click");
          addTrait(game, o.trait, 2);
          game.profile.answers.interests.push(o.tag);
          if (idx === 1) game.profile.answers.strength = o.tag;
          idx++;
          if (idx < DATA.quiz.length) render();
          else done();
        });
        optWrap.appendChild(b);
      });
      body.appendChild(optWrap);
    }
    render();
  }
};

/* ============================================================
   Personality result — "what person you are"
   ============================================================ */
Challenges.computeArchetype = function (profile) {
  const order = ["creative", "bold", "curious", "kind", "joyful", "thoughtful"];
  let best = order[0], bestPts = -1;
  for (const k of order) {
    const pts = profile.traits[k] || 0;
    if (pts > bestPts) { best = k; bestPts = pts; }
  }
  return { key: best, ...DATA.archetypes[best] };
};
