/* ============================================================
   Hue & You — sprites.js
   Procedural canvas drawing for the player, guardians and
   crystals. No image assets needed.
   ============================================================ */

const SPR = {};

/* Desaturate an [r,g,b] color toward gray. sat: 0 = fully gray, 1 = full color.
   The gray world is also slightly dimmer, so color "lights up" when restored. */
SPR.tint = function (rgb, sat, alpha) {
  const l = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
  const dim = 0.86 + 0.14 * sat;
  const r = Math.round((l + (rgb[0] - l) * sat) * dim);
  const g = Math.round((l + (rgb[1] - l) * sat) * dim);
  const b = Math.round((l + (rgb[2] - l) * sat) * dim);
  if (alpha !== undefined) return `rgba(${r},${g},${b},${alpha})`;
  return `rgb(${r},${g},${b})`;
};

/* Darken (amt<0) or lighten (amt>0) a hex color. */
SPR.shade = function (hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
};

SPR.starPath = function (ctx, cx, cy, outer, points) {
  const inner = outer * 0.45;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

/* ----------------------------------------------------------
   PLAYER — a small colorful hero. (x, y) = center of the feet.
   look: { hair, hairColor, outfit, accessory }
   frame: walk cycle phase (0..1), moving: bool
---------------------------------------------------------- */
SPR.drawPlayer = function (ctx, x, y, look, frame, moving, scale) {
  const s = scale || 1;
  const skin = "#f5cfa0";
  const outfit = look.outfit;
  const outline = "rgba(35,28,42,.85)";
  const legSwing = moving ? Math.sin(frame * Math.PI * 2) * 3 * s : 0;
  const bob = moving ? Math.abs(Math.sin(frame * Math.PI * 2)) * 1.4 * s : 0;

  ctx.save();
  ctx.translate(x, y - bob);
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = outline;

  // cape (behind everything)
  if (look.accessory === "cape") {
    const sway = Math.sin(frame * Math.PI * 2) * 2 * s;
    ctx.fillStyle = SPR.shade(outfit, -55);
    ctx.beginPath();
    ctx.moveTo(-7 * s, -20 * s);
    ctx.quadraticCurveTo(-11 * s + sway, -8 * s, -9 * s + sway, -1 * s);
    ctx.lineTo(9 * s + sway, -1 * s);
    ctx.quadraticCurveTo(11 * s + sway, -8 * s, 7 * s, -20 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // legs
  ctx.fillStyle = SPR.shade(outfit, -70);
  ctx.fillRect(-5.5 * s, -7 * s + Math.max(0, legSwing), 4.5 * s, 7 * s - Math.max(0, legSwing));
  ctx.fillRect(1 * s, -7 * s + Math.max(0, -legSwing), 4.5 * s, 7 * s - Math.max(0, -legSwing));

  // body
  ctx.fillStyle = outfit;
  rounded(ctx, -8 * s, -20 * s, 16 * s, 14 * s, 5 * s);
  ctx.fill();
  ctx.stroke();

  // arms
  ctx.fillStyle = outfit;
  rounded(ctx, -11 * s, -19 * s, 4 * s, 9 * s, 2 * s);
  ctx.fill(); ctx.stroke();
  rounded(ctx, 7 * s, -19 * s, 4 * s, 9 * s, 2 * s);
  ctx.fill(); ctx.stroke();

  // star badge
  if (look.accessory === "star") {
    ctx.fillStyle = "#ffe14d";
    SPR.starPath(ctx, 0, -14 * s, 4 * s, 5);
    ctx.fill();
    ctx.stroke();
  }

  // scarf
  if (look.accessory === "scarf") {
    ctx.fillStyle = "#e84a4a";
    rounded(ctx, -7 * s, -22 * s, 14 * s, 4.5 * s, 2 * s);
    ctx.fill(); ctx.stroke();
    rounded(ctx, 1 * s, -20 * s, 4.5 * s, 9 * s, 2 * s);
    ctx.fill(); ctx.stroke();
  }

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -28 * s, 8.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // hair
  ctx.fillStyle = look.hairColor;
  const hy = -28 * s;
  if (look.hair === "short") {
    ctx.beginPath();
    ctx.arc(0, hy, 8.5 * s, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (look.hair === "spiky") {
    ctx.beginPath();
    ctx.arc(0, hy, 8.5 * s, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.42;
      const bx = Math.cos(a) * 7.6 * s, by = hy + Math.sin(a) * 7.6 * s;
      const tx = Math.cos(a) * 13.5 * s, ty = hy + Math.sin(a) * 13.5 * s;
      ctx.beginPath();
      ctx.moveTo(bx - 2.4 * s, by);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx + 2.4 * s, by);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  } else if (look.hair === "long") {
    ctx.beginPath();
    ctx.arc(0, hy, 8.5 * s, Math.PI * 1.0, Math.PI * 2.0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    rounded(ctx, -10 * s, hy - 2 * s, 4.5 * s, 16 * s, 2.5 * s);
    ctx.fill(); ctx.stroke();
    rounded(ctx, 5.5 * s, hy - 2 * s, 4.5 * s, 16 * s, 2.5 * s);
    ctx.fill(); ctx.stroke();
  } else { // curly
    for (const [cx, cy, r] of [[-6, -5, 4.2], [0, -7.5, 4.6], [6, -5, 4.2], [-8.5, 0, 3.4], [8.5, 0, 3.4], [-3, -7, 4], [3, -7, 4]]) {
      ctx.beginPath();
      ctx.arc(cx * s, hy + cy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, hy - 4 * s, 8 * s, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // party hat
  if (look.accessory === "hat") {
    ctx.fillStyle = "#ff5e7e";
    ctx.beginPath();
    ctx.moveTo(-6 * s, hy - 6.5 * s);
    ctx.lineTo(0, hy - 19 * s);
    ctx.lineTo(6 * s, hy - 6.5 * s);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffe14d";
    ctx.beginPath();
    ctx.arc(0, hy - 19 * s, 2.4 * s, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  // face
  ctx.fillStyle = "#2b2433";
  ctx.beginPath(); ctx.arc(-3 * s, -28 * s, 1.3 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3 * s, -28 * s, 1.3 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -25.5 * s, 2.6 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 1.2 * s;
  ctx.stroke();

  // glasses
  if (look.accessory === "glasses") {
    ctx.lineWidth = 1.4 * s;
    ctx.strokeStyle = "#2b2433";
    ctx.beginPath(); ctx.arc(-3 * s, -28 * s, 3.2 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(3 * s, -28 * s, 3.2 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.4 * s, -28.6 * s); ctx.lineTo(0.4 * s, -28.6 * s); ctx.stroke();
  }

  ctx.restore();
};

/* ----------------------------------------------------------
   GUARDIANS — gray until their crystal is earned (sat 0→1).
   (x, y) = center of the base. t = time in seconds for idle bob.
---------------------------------------------------------- */
SPR.drawGuardian = function (ctx, sprite, x, y, t, sat, scale) {
  const s = scale || 1;
  const bob = Math.sin(t * 2.2) * 1.6 * s;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = "rgba(35,28,42,.85)";
  const T = (rgb) => SPR.tint(rgb, sat);

  if (sprite === "owl") {
    // body
    ctx.fillStyle = T([138, 90, 43]);
    ellipse(ctx, 0, -14 * s, 12 * s, 14 * s); ctx.fill(); ctx.stroke();
    // belly
    ctx.fillStyle = T([233, 207, 160]);
    ellipse(ctx, 0, -11 * s, 7.5 * s, 9 * s); ctx.fill();
    // wings
    ctx.fillStyle = T([110, 70, 32]);
    ellipse(ctx, -11 * s, -13 * s, 4 * s, 9 * s); ctx.fill(); ctx.stroke();
    ellipse(ctx, 11 * s, -13 * s, 4 * s, 9 * s); ctx.fill(); ctx.stroke();
    // ear tufts
    ctx.fillStyle = T([138, 90, 43]);
    tri(ctx, -8 * s, -26 * s, -4 * s, -23 * s, -10 * s, -20 * s); ctx.fill(); ctx.stroke();
    tri(ctx, 8 * s, -26 * s, 4 * s, -23 * s, 10 * s, -20 * s); ctx.fill(); ctx.stroke();
    // eyes + round glasses
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-4.5 * s, -20 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.5 * s, -20 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2b2433";
    ctx.beginPath(); ctx.arc(-4.5 * s, -20 * s, 1.8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.5 * s, -20 * s, 1.8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = T([60, 50, 70]);
    ctx.beginPath(); ctx.arc(-4.5 * s, -20 * s, 4.6 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(4.5 * s, -20 * s, 4.6 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(35,28,42,.85)";
    // beak
    ctx.fillStyle = T([240, 160, 60]);
    tri(ctx, 0, -17.5 * s, -2.2 * s, -15 * s, 2.2 * s, -15 * s); ctx.fill(); ctx.stroke();
    // feet
    ctx.fillStyle = T([240, 160, 60]);
    ellipse(ctx, -4 * s, -0.8 * s, 3 * s, 1.6 * s); ctx.fill();
    ellipse(ctx, 4 * s, -0.8 * s, 3 * s, 1.6 * s); ctx.fill();

  } else if (sprite === "cat") {
    // tail (curled high — cheshire style)
    ctx.strokeStyle = T([176, 107, 255]);
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(9 * s, -6 * s);
    ctx.quadraticCurveTo(19 * s, -10 * s, 16 * s, -20 * s);
    ctx.quadraticCurveTo(14.5 * s, -25 * s, 11 * s, -23 * s);
    ctx.stroke();
    ctx.lineWidth = 1.5 * s;
    ctx.strokeStyle = "rgba(35,28,42,.85)";
    // body (sitting)
    ctx.fillStyle = T([176, 107, 255]);
    ellipse(ctx, 0, -10 * s, 10 * s, 11 * s); ctx.fill(); ctx.stroke();
    // stripes
    ctx.fillStyle = T([232, 74, 138]);
    rounded(ctx, -8 * s, -12 * s, 16 * s, 2.6 * s, 1.3 * s); ctx.fill();
    rounded(ctx, -7 * s, -7 * s, 14 * s, 2.6 * s, 1.3 * s); ctx.fill();
    // head
    ctx.fillStyle = T([176, 107, 255]);
    ctx.beginPath(); ctx.arc(0, -25 * s, 9 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // ears
    tri(ctx, -8.5 * s, -33 * s, -2.5 * s, -31 * s, -9.5 * s, -26 * s); ctx.fill(); ctx.stroke();
    tri(ctx, 8.5 * s, -33 * s, 2.5 * s, -31 * s, 9.5 * s, -26 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = T([232, 74, 138]);
    tri(ctx, -7.5 * s, -31.5 * s, -4 * s, -30 * s, -8 * s, -27.5 * s); ctx.fill();
    tri(ctx, 7.5 * s, -31.5 * s, 4 * s, -30 * s, 8 * s, -27.5 * s); ctx.fill();
    // eyes
    ctx.fillStyle = T([120, 230, 130]);
    ellipse(ctx, -3.5 * s, -26 * s, 2 * s, 2.6 * s); ctx.fill();
    ellipse(ctx, 3.5 * s, -26 * s, 2 * s, 2.6 * s); ctx.fill();
    ctx.fillStyle = "#2b2433";
    ellipse(ctx, -3.5 * s, -26 * s, 0.8 * s, 2 * s); ctx.fill();
    ellipse(ctx, 3.5 * s, -26 * s, 0.8 * s, 2 * s); ctx.fill();
    // big grin
    ctx.strokeStyle = "#2b2433";
    ctx.lineWidth = 1.3 * s;
    ctx.beginPath();
    ctx.arc(0, -23.5 * s, 5.5 * s, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const a = 0.12 * Math.PI + (0.76 * Math.PI * i) / 5;
      const gx = Math.cos(a) * 5.5 * s, gy = -23.5 * s + Math.sin(a) * 5.5 * s;
      ctx.moveTo(gx, gy - 1.6 * s); ctx.lineTo(gx, gy);
    }
    ctx.stroke();

  } else if (sprite === "bird") {
    // body
    ctx.fillStyle = T([77, 163, 255]);
    ellipse(ctx, 0, -10 * s, 9.5 * s, 10 * s); ctx.fill(); ctx.stroke();
    // chest
    ctx.fillStyle = T([245, 212, 66]);
    ellipse(ctx, 0, -7.5 * s, 6 * s, 6.5 * s); ctx.fill();
    // wing
    ctx.fillStyle = T([50, 120, 210]);
    const flap = Math.sin(t * 6) * 2 * s;
    ellipse(ctx, -8 * s, -11 * s + flap * 0.3, 4 * s, 6 * s); ctx.fill(); ctx.stroke();
    ellipse(ctx, 8 * s, -11 * s + flap * 0.3, 4 * s, 6 * s); ctx.fill(); ctx.stroke();
    // head
    ctx.fillStyle = T([77, 163, 255]);
    ctx.beginPath(); ctx.arc(0, -21 * s, 7 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // crest feathers
    ctx.strokeStyle = T([50, 120, 210]);
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(0, -27 * s); ctx.quadraticCurveTo(1.5 * s, -32 * s, 4 * s, -30.5 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1 * s, -27 * s); ctx.quadraticCurveTo(-2.5 * s, -31 * s, -5 * s, -29.5 * s); ctx.stroke();
    ctx.lineWidth = 1.5 * s;
    ctx.strokeStyle = "rgba(35,28,42,.85)";
    // eyes
    ctx.fillStyle = "#2b2433";
    ctx.beginPath(); ctx.arc(-2.6 * s, -22 * s, 1.4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.6 * s, -22 * s, 1.4 * s, 0, Math.PI * 2); ctx.fill();
    // beak
    ctx.fillStyle = T([240, 160, 60]);
    tri(ctx, 0, -20.5 * s, -2.4 * s, -18.6 * s, 2.4 * s, -18.6 * s); ctx.fill(); ctx.stroke();
    // feet
    ctx.strokeStyle = T([240, 160, 60]);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(-3 * s, 0); ctx.lineTo(-3 * s, -2.5 * s); ctx.moveTo(3 * s, 0); ctx.lineTo(3 * s, -2.5 * s); ctx.stroke();
    // a floating music note once the garden sings again
    if (sat > 0.5) {
      ctx.fillStyle = SPR.tint([90, 70, 160], sat, 0.5 + 0.4 * Math.sin(t * 3));
      ctx.font = `${10 * s}px Georgia`;
      ctx.fillText("♪", 9 * s, -26 * s - Math.sin(t * 3) * 3 * s);
    }

  } else if (sprite === "chameleon") {
    // when fully restored, Chroma slowly cycles through every hue
    const cycle = sat > 0.95 ? `hsl(${(t * 50) % 360}, 65%, 52%)` : T([86, 182, 95]);
    // curled tail
    ctx.strokeStyle = cycle;
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.moveTo(10 * s, -6 * s);
    ctx.quadraticCurveTo(18 * s, -6 * s, 17 * s, -12 * s);
    ctx.quadraticCurveTo(16 * s, -16 * s, 13 * s, -13.5 * s);
    ctx.stroke();
    ctx.lineWidth = 1.5 * s;
    ctx.strokeStyle = "rgba(35,28,42,.85)";
    // body
    ctx.fillStyle = cycle;
    ellipse(ctx, 0, -9 * s, 11 * s, 8.5 * s); ctx.fill(); ctx.stroke();
    // belly stripe
    ctx.fillStyle = SPR.tint([230, 240, 200], Math.max(sat, 0.2));
    ellipse(ctx, 0, -6.5 * s, 7 * s, 4 * s); ctx.fill();
    // head
    ctx.fillStyle = cycle;
    ctx.beginPath(); ctx.arc(-2 * s, -19 * s, 7.5 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // casque (head crest)
    tri(ctx, -2 * s, -30 * s, -7.5 * s, -22 * s, 3.5 * s, -22 * s); ctx.fill(); ctx.stroke();
    // beret
    ctx.fillStyle = T([232, 74, 74]);
    ellipse(ctx, -5 * s, -27.5 * s, 6 * s, 3 * s); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-5 * s, -30.5 * s, 1.4 * s, 0, Math.PI * 2); ctx.fill();
    // big round eye
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-3.5 * s, -19 * s, 3.4 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2b2433";
    ctx.beginPath(); ctx.arc(-3 * s, -19 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
    // smile
    ctx.strokeStyle = "#2b2433";
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.arc(-4 * s, -15.5 * s, 3.4 * s, 0.15 * Math.PI, 0.6 * Math.PI); ctx.stroke();
    ctx.lineWidth = 1.5 * s;
    // paintbrush held up
    ctx.strokeStyle = T([140, 100, 60]);
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(8 * s, -14 * s); ctx.lineTo(13 * s, -24 * s); ctx.stroke();
    ctx.lineWidth = 1.5 * s;
    ctx.strokeStyle = "rgba(35,28,42,.85)";
    ctx.fillStyle = sat > 0.95 ? `hsl(${(t * 50 + 120) % 360}, 75%, 60%)` : T([232, 74, 138]);
    ellipse(ctx, 13.6 * s, -25.5 * s, 2 * s, 3 * s); ctx.fill(); ctx.stroke();
    // legs
    ctx.fillStyle = cycle;
    rounded(ctx, -8 * s, -3 * s, 4 * s, 3 * s, 1.5 * s); ctx.fill(); ctx.stroke();
    rounded(ctx, 4 * s, -3 * s, 4 * s, 3 * s, 1.5 * s); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
};

/* ----------------------------------------------------------
   CRYSTAL — always vivid; a beacon of color in the gray world.
   (x, y) = center. rgb: crystal color.
---------------------------------------------------------- */
SPR.drawCrystal = function (ctx, x, y, rgb, t, scale) {
  const s = scale || 1;
  const bob = Math.sin(t * 2.6) * 3 * s;
  const pulse = 0.65 + 0.35 * Math.sin(t * 3.2);
  const col = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  ctx.save();
  ctx.translate(x, y + bob);

  // glow
  const g = ctx.createRadialGradient(0, 0, 2 * s, 0, 0, 18 * s);
  g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.55 * pulse})`);
  g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 18 * s, 0, Math.PI * 2); ctx.fill();

  // gem body
  ctx.beginPath();
  ctx.moveTo(0, -11 * s);
  ctx.lineTo(7 * s, -2 * s);
  ctx.lineTo(0, 11 * s);
  ctx.lineTo(-7 * s, -2 * s);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 1.4 * s;
  ctx.stroke();

  // facets
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(0, -11 * s); ctx.lineTo(0, 11 * s);
  ctx.moveTo(-7 * s, -2 * s); ctx.lineTo(7 * s, -2 * s);
  ctx.stroke();

  // sparkle
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 5)})`;
  SPR.starPath(ctx, 3.4 * s, -6 * s, 2.2 * s, 4);
  ctx.fill();

  ctx.restore();
};

/* ---------- tiny path helpers ---------- */
function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}
function tri(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath();
}
