"use strict";
var PixelDraw = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/pixel/draw.ts
  var draw_exports = {};
  __export(draw_exports, {
    GALAXY_TARGET: () => GALAXY_TARGET,
    PAL: () => PAL,
    drawCabin: () => drawCabin,
    drawCapybara: () => drawCapybara,
    drawClouds: () => drawClouds,
    drawDust: () => drawDust,
    drawGalaxy: () => drawGalaxy,
    drawGhost: () => drawGhost,
    drawGhostPerson: () => drawGhostPerson,
    drawGround: () => drawGround,
    drawLog: () => drawLog,
    drawPix: () => drawPix,
    drawPlanet: () => drawPlanet,
    drawPlank: () => drawPlank,
    drawStump: () => drawStump,
    drawTree: () => drawTree,
    drawZzz: () => drawZzz,
    ellipse: () => ellipse,
    hash: () => hash,
    px: () => px,
    sprite: () => sprite
  });
  var PAL = {
    grass: ["#7fa84a", "#6b9a3f", "#8dbb55"],
    grassShadow: "#4f7a35",
    leafDark: "#2f5a2e",
    leafDarker: "#1f4226",
    leafLight: "#5c9a3c",
    dirt: ["#d8b878", "#c49a5b", "#a8793f"],
    stone: ["#b8aa94", "#8f8576"],
    wood: ["#a06a35", "#8a5a2b", "#5e3b1b"],
    plaster: "#e8dcc0",
    outline: "#1c1c28",
    gold: "#e0b040",
    parchment: "#efe0b8",
    uiWood: "#2a1c12",
    skin: "#f0c090",
    shirt: "#c8383a",
    shirtDark: "#9a2a2c",
    hair: "#6b3e1f",
    pants: "#4a3a2a",
    boots: "#3a2616",
    capy: "#9a6a3c",
    capyDark: "#74502c",
    capyLight: "#b8844e",
    smoke: "#d9d4cc"
  };
  var hash = (a, b = 0, c = 0) => {
    let h = a * 374761393 + b * 668265263 + c * 2147483647 | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };
  var px = (ctx, x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  var ellipse = (ctx, cx, cy, rx, ry, c) => {
    ctx.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry))));
      ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
    }
  };
  var sprite = (ctx, rows, map, x, y, flip = false) => {
    const w = rows[0].length;
    rows.forEach((row, j) => {
      if (row.length !== w) throw new Error(`sprite: linha ${j} tem ${row.length} colunas, esperado ${w}`);
      for (let i = 0; i < w; i++) {
        const ch = row[flip ? w - 1 - i : i];
        if (ch === "." || !map[ch]) continue;
        ctx.fillStyle = map[ch];
        ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
      }
    });
  };
  var vnoise = (x, y, cell, seed) => {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const fx = x / cell - gx;
    const fy = y / cell - gy;
    const sm = (t) => t * t * (3 - 2 * t);
    const a = hash(gx, gy, seed), b = hash(gx + 1, gy, seed), c = hash(gx, gy + 1, seed), d = hash(gx + 1, gy + 1, seed);
    const u = sm(fx), v = sm(fy);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };
  var hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  var drawGround = (ctx, W, H) => {
    const img = ctx.createImageData(W, H);
    const base = hex(PAL.grass[0]), dark = hex(PAL.grass[1]), light = hex(PAL.grass[2]);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = vnoise(x, y, 46, 1) * 0.75 + vnoise(x, y, 13, 2) * 0.25;
        const c = n < 0.36 ? dark : n > 0.66 ? light : base;
        const i = (y * W + x) * 4;
        img.data[i] = c[0];
        img.data[i + 1] = c[1];
        img.data[i + 2] = c[2];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 520; i++) {
      const x = Math.floor(hash(i, 1) * W);
      const y = Math.floor(hash(i, 2) * H);
      const k = hash(i, 3);
      if (k < 0.6) {
        px(ctx, x, y, 1, 2, PAL.grassShadow);
        px(ctx, x + 2, y + 1, 1, 2, PAL.grassShadow);
        px(ctx, x + 1, y - 1, 1, 2, PAL.grass[2]);
      } else if (k < 0.8) {
        px(ctx, x, y, 2, 2, "#f4f1e6");
        px(ctx, x, y, 1, 1, "#ffffff");
      } else if (k < 0.9) {
        px(ctx, x, y, 2, 2, "#e8c84a");
      } else {
        px(ctx, x, y, 3, 2, PAL.stone[1]);
        px(ctx, x, y, 2, 1, PAL.stone[0]);
      }
    }
  };
  var blob = (ctx, cx, cy, r, c) => ellipse(ctx, cx, cy, r, Math.round(r * 0.85), c);
  var drawTree = (ctx, x, y, lean = 0) => {
    if (lean >= 1) return;
    const off = Math.round(lean * lean * 34);
    const drop = Math.round(lean * lean * 14);
    ellipse(ctx, x, y + 1, 18, 5, "rgba(20,40,20,0.35)");
    px(ctx, x - 7, y - 2, 4, 2, PAL.wood[2]);
    px(ctx, x + 3, y - 2, 4, 2, PAL.wood[2]);
    for (let j = 0; j < 22; j++) {
      const s = Math.round(off * j / 22);
      px(ctx, x - 3 + off - s, y - 22 + j + Math.round(drop * (22 - j) / 22), 6, 1, j % 4 === 0 ? PAL.wood[2] : PAL.wood[1]);
    }
    const cx = x + off;
    const cy = y - 36 + drop;
    blob(ctx, cx, cy + 3, 22, PAL.leafDarker);
    blob(ctx, cx - 9, cy - 2, 14, PAL.leafDark);
    blob(ctx, cx + 9, cy - 1, 14, PAL.leafDark);
    blob(ctx, cx, cy - 8, 13, PAL.leafDark);
    blob(ctx, cx - 5, cy - 9, 8, PAL.leafLight);
    blob(ctx, cx + 7, cy - 4, 6, PAL.leafLight);
    for (let i = 0; i < 14; i++) {
      px(ctx, cx - 16 + Math.floor(hash(i, 7) * 32), cy - 16 + Math.floor(hash(i, 8) * 28), 2, 1, "#79b04a");
    }
  };
  var drawLog = (ctx, x, y) => {
    ellipse(ctx, x + 22, y + 3, 24, 4, "rgba(20,40,20,0.3)");
    px(ctx, x, y - 4, 44, 6, PAL.wood[1]);
    px(ctx, x, y - 4, 44, 1, PAL.wood[0]);
    px(ctx, x, y + 1, 44, 1, PAL.wood[2]);
    px(ctx, x + 44, y - 4, 4, 6, "#e0b878");
    px(ctx, x + 45, y - 3, 2, 4, "#c49a5b");
    blob(ctx, x - 6, y - 4, 9, PAL.leafDark);
    blob(ctx, x - 8, y - 6, 5, PAL.leafLight);
  };
  var drawStump = (ctx, x, y) => {
    ellipse(ctx, x, y + 1, 9, 3, "rgba(20,40,20,0.35)");
    px(ctx, x - 7, y - 2, 4, 2, PAL.wood[2]);
    px(ctx, x + 3, y - 2, 4, 2, PAL.wood[2]);
    px(ctx, x - 4, y - 7, 8, 6, PAL.wood[1]);
    ellipse(ctx, x, y - 7, 4, 1, "#e0b878");
    px(ctx, x - 1, y - 7, 2, 1, "#c49a5b");
  };
  var PIX_MAP = {
    o: PAL.outline,
    h: PAL.hair,
    s: PAL.skin,
    e: PAL.outline,
    r: PAL.shirt,
    d: PAL.shirtDark,
    p: PAL.pants,
    b: PAL.boots
  };
  var PIX_TOP = [
    "...oooooo...",
    "..ohhhhhho..",
    ".ohhhhhhhho.",
    ".ohssssssho.",
    ".osesssseso.",
    ".ossssssssO.",
    "..oossssoo..",
    ".orrrrrrrro.",
    "osrrrrrrrrso",
    "osrrddddrrso",
    "osrrrrrrrrso",
    ".oorrrrrroo.",
    "..oppppppo.."
  ].map((r) => r.replace(/O/g, "o"));
  var LEGS_A = ["..oppooppo..", "..oppooppo..", "..obboobbo..", "..oooooooo.."];
  var LEGS_B = ["..oppo.oppo.", "..oppo.oppo.", ".obbo..obbo.", ".oooo..oooo."];
  var drawPix = (ctx, x, y, frame, pose, flip = false) => {
    const bob = pose === "idle" ? Math.floor(frame / 15) % 2 : pose === "walk" ? Math.floor(frame / 4) % 2 : 0;
    const legs = pose === "walk" && Math.floor(frame / 4) % 2 ? LEGS_B : LEGS_A;
    const sx = Math.round(x - 6);
    const sy = Math.round(y - 17 - bob);
    ellipse(ctx, x, y, 6, 2, "rgba(20,40,20,0.35)");
    sprite(ctx, legs, PIX_MAP, sx, sy + 13 + bob, flip);
    sprite(ctx, PIX_TOP, PIX_MAP, sx, sy, flip);
    const dir = flip ? -1 : 1;
    if (pose === "chopUp") {
      px(ctx, sx + (flip ? -1 : 11), sy - 6, 2, 12, PAL.wood[1]);
      px(ctx, sx + (flip ? -4 : 11), sy - 8, 5, 4, "#9aa4b0");
      px(ctx, sx + (flip ? -4 : 11), sy - 8, 5, 1, "#d0d8e0");
    } else if (pose === "chopDown") {
      px(ctx, sx + 6 + dir * 6, sy + 9, dir * 9, 2, PAL.wood[1]);
      px(ctx, sx + 6 + dir * 14, sy + 6, dir * 4, 6, "#9aa4b0");
    }
    if (pose === "surprised") {
      px(ctx, sx + 3, sy + 4, 2, 2, "#ffffff");
      px(ctx, sx + 7, sy + 4, 2, 2, "#ffffff");
      px(ctx, sx + 4, sy + 4, 1, 1, PAL.outline);
      px(ctx, sx + 8, sy + 4, 1, 1, PAL.outline);
      px(ctx, sx + 5, sy + 6, 2, 1, PAL.outline);
    }
  };
  var drawCapybara = (ctx, x, y, frame, awake = 0, flip = false) => {
    const d = flip ? -1 : 1;
    const breath = awake < 0.5 ? Math.round((Math.sin(frame / 10) + 1) * 0.6) : 0;
    ellipse(ctx, x, y, 22, 4, "rgba(20,40,20,0.35)");
    if (awake >= 0.5) {
      for (const ox of [-12, -5, 6, 12]) px(ctx, x + ox * d - 2, y - 5, 4, 5, PAL.capyDark);
    }
    ellipse(ctx, x, y - 12 - breath, 20, 10 + breath, PAL.outline);
    ellipse(ctx, x, y - 12 - breath, 19, 9 + breath, PAL.capy);
    ellipse(ctx, x - 2 * d, y - 16 - breath, 14, 4, PAL.capyLight);
    for (let i = 0; i < 10; i++) px(ctx, x - 14 + Math.floor(hash(i, 21) * 28), y - 18 + Math.floor(hash(i, 22) * 10), 2, 1, PAL.capyDark);
    const hx = x + 17 * d;
    const hy = y - 15 - breath + (awake < 0.5 ? 4 : 0);
    ellipse(ctx, hx, hy, 9, 7, PAL.outline);
    ellipse(ctx, hx, hy, 8, 6, PAL.capy);
    px(ctx, hx + 5 * d - (d < 0 ? 4 : 0), hy - 2, 4, 6, PAL.capyLight);
    px(ctx, hx + 7 * d - (d < 0 ? 1 : 0), hy - 1, 1, 2, PAL.outline);
    px(ctx, hx - 6 * d - 1, hy - 8, 3, 3, PAL.capyDark);
    if (awake < 0.5) {
      px(ctx, hx - 1, hy - 2, 3, 1, PAL.outline);
    } else {
      px(ctx, hx - 1, hy - 3, 2, 2, PAL.outline);
      px(ctx, hx - 1, hy - 3, 1, 1, "#ffffff");
    }
  };
  var drawZzz = (ctx, x, y, frame) => {
    for (let k = 0; k < 3; k++) {
      const t = (frame + k * 20) % 60 / 60;
      const zx = Math.round(x + t * 10 + k * 3);
      const zy = Math.round(y - t * 22);
      const s = k === 2 ? 4 : 3;
      ctx.globalAlpha = 1 - t;
      px(ctx, zx, zy, s, 1, "#ffffff");
      px(ctx, zx + s - 2, zy + 1, 1, 1, "#ffffff");
      px(ctx, zx + 1, zy + 2, 1, 1, "#ffffff");
      px(ctx, zx, zy + s - 1, s, 1, "#ffffff");
      ctx.globalAlpha = 1;
    }
  };
  var drawCabin = (ctx, x, y, frame, progress, doorOpen = 0) => {
    const W = 64;
    const wallH = 28;
    const left = x - W / 2;
    ellipse(ctx, x, y + 2, 36, 5, "rgba(20,40,20,0.35)");
    if (progress < 1) {
      px(ctx, left - 2, y - 2, W + 4, 4, PAL.dirt[1]);
    }
    const rows = Math.floor(Math.min(1, progress / 0.6) * 7);
    for (let i = 0; i < rows; i++) {
      const ry = y - 4 - i * 4;
      px(ctx, left, ry, W, 4, i % 2 ? PAL.wood[0] : PAL.wood[1]);
      px(ctx, left, ry + 3, W, 1, PAL.wood[2]);
      px(ctx, left - 2, ry, 3, 4, "#c49a5b");
      px(ctx, left + W - 1, ry, 3, 4, "#c49a5b");
    }
    if (rows >= 5) {
      const dw = Math.round(12 * (1 - doorOpen));
      px(ctx, x - 7, y - 19, 14, 19, PAL.outline);
      px(ctx, x - 6, y - 18, 12, 18, "#2a1a0e");
      px(ctx, x - 6, y - 18, Math.max(0, dw), 18, PAL.wood[2]);
      if (dw > 3) px(ctx, x - 6 + dw - 3, y - 9, 2, 2, PAL.gold);
      px(ctx, left + 8, y - 22, 12, 9, PAL.outline);
      px(ctx, left + 9, y - 21, 10, 7, "#f2d47a");
      px(ctx, left + 13, y - 21, 1, 7, PAL.wood[2]);
    }
    if (progress > 0.6) {
      const rp = Math.min(1, (progress - 0.6) / 0.3);
      const roofRows = Math.floor(rp * 12);
      for (let j = 0; j < roofRows; j++) {
        const ry = y - 4 - wallH - j * 2;
        const inset = j * 3;
        px(ctx, left - 6 + inset, ry, W + 12 - inset * 2, 2, j % 2 ? "#6e4423" : "#5e3b1b");
        px(ctx, left - 6 + inset, ry + 1, W + 12 - inset * 2, 1, "#4a2e14");
      }
    }
    if (progress >= 0.95) {
      px(ctx, x + 14, y - 58, 8, 14, PAL.stone[1]);
      px(ctx, x + 14, y - 58, 8, 2, PAL.stone[0]);
      for (let k = 0; k < 4; k++) {
        const t = (frame + k * 12) % 48 / 48;
        ctx.globalAlpha = 0.85 * (1 - t);
        ellipse(ctx, Math.round(x + 18 + t * 8 + Math.sin(t * 6 + k) * 2), Math.round(y - 62 - t * 26), 2 + Math.round(t * 3), 2 + Math.round(t * 2), PAL.smoke);
        ctx.globalAlpha = 1;
      }
    }
    if (progress > 0 && progress < 1) {
      for (const ax of [left - 6, left + W + 4]) px(ctx, ax, y - 48, 2, 48, "#8a5a2b");
      for (let k = 0; k < 4; k++) px(ctx, left - 6, y - 10 - k * 12, W + 12, 2, "#a06a35");
    }
  };
  var drawGhost = (ctx, x, y, w, h, alpha) => {
    ctx.globalAlpha = alpha;
    for (let i = 0; i < w; i += 4) {
      px(ctx, x + i, y, 2, 2, "#ffffff");
      px(ctx, x + i, y + h, 2, 2, "#ffffff");
    }
    for (let j = 0; j < h; j += 4) {
      px(ctx, x, y + j, 2, 2, "#ffffff");
      px(ctx, x + w, y + j, 2, 2, "#ffffff");
    }
    for (let k = 0; k <= w / 2; k += 4) {
      px(ctx, x + k, y - Math.round(k * 0.5), 2, 2, "#ffffff");
      px(ctx, x + w - k, y - Math.round(k * 0.5), 2, 2, "#ffffff");
    }
    ctx.globalAlpha = 1;
  };
  var drawGhostPerson = (ctx, x, y, alpha) => {
    ctx.globalAlpha = alpha;
    ellipse(ctx, x, y - 14, 3, 3, "#ffffff");
    px(ctx, x - 4, y - 10, 8, 8, "#ffffff");
    px(ctx, x - 3, y - 2, 2, 2, "#ffffff");
    px(ctx, x + 1, y - 2, 2, 2, "#ffffff");
    ctx.globalAlpha = 1;
  };
  var drawDust = (ctx, x, y, t, seed, n = 14, spread = 26) => {
    if (t <= 0 || t >= 1) return;
    for (let i = 0; i < n; i++) {
      const a = hash(seed, i) * Math.PI * 2;
      const sp = 0.4 + hash(seed, i, 1) * 0.6;
      const dx = Math.cos(a) * spread * sp * t;
      const dy = -Math.abs(Math.sin(a)) * spread * 0.6 * sp * t;
      ctx.globalAlpha = 0.9 * (1 - t);
      const r = 1 + Math.round(hash(seed, i, 2) * 3 * (1 - t * 0.5));
      ellipse(ctx, Math.round(x + dx), Math.round(y + dy), r, r, i % 2 ? "#e6d6b0" : "#cbb88e");
      ctx.globalAlpha = 1;
    }
  };
  var drawPlank = (ctx, x, y) => {
    px(ctx, x - 7, y - 1, 14, 3, PAL.outline);
    px(ctx, x - 6, y, 12, 1, PAL.wood[0]);
  };
  var STAR = ["#ffffff", "#cfe0ff", "#ffe9b0", "#b8c8ff"];
  var starfield = (ctx, W, H, seed, n) => {
    px(ctx, 0, 0, W, H, "#06061a");
    for (let i = 0; i < n; i++) {
      const x = Math.floor(hash(i, seed) * W);
      const y = Math.floor(hash(i, seed + 1) * H);
      const k = hash(i, seed + 2);
      px(ctx, x, y, 1, 1, STAR[Math.floor(k * 4)]);
      if (k > 0.97) {
        px(ctx, x - 1, y, 3, 1, "#8fa8ff");
        px(ctx, x, y - 1, 1, 3, "#8fa8ff");
        px(ctx, x, y, 1, 1, "#ffffff");
      }
    }
  };
  var GALAXY_TARGET = { x: 214, y: 300 };
  var drawGalaxy = (ctx, W, H) => {
    starfield(ctx, W, H, 40, 900);
    const cx = 180, cy = 320;
    const cols = ["#3a2a7a", "#5a3aa8", "#7a5ad8", "#a88cff", "#d8c8ff"];
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 2600; i++) {
        const t = hash(i, 50 + arm) * 4.2;
        const r = 6 + t * 34;
        const th = t * 1.55 + arm * Math.PI + (hash(i, 60 + arm) - 0.5) * 0.55;
        const x = Math.round(cx + Math.cos(th) * r + (hash(i, 70) - 0.5) * 8);
        const y = Math.round(cy + Math.sin(th) * r * 0.62 + (hash(i, 71) - 0.5) * 6);
        const c = cols[Math.min(4, Math.floor((1 - t / 4.2) * 4 + hash(i, 72) * 1.5))];
        px(ctx, x, y, 1, 1, c);
      }
    }
    ellipse(ctx, cx, cy, 22, 13, "#8a6ad8");
    ellipse(ctx, cx, cy, 14, 8, "#e8d8ff");
    ellipse(ctx, cx, cy, 7, 4, "#fff6d8");
    const g = GALAXY_TARGET;
    px(ctx, g.x - 2, g.y, 5, 1, "#fff2a8");
    px(ctx, g.x, g.y - 2, 1, 5, "#fff2a8");
    px(ctx, g.x, g.y, 1, 1, "#ffffff");
  };
  var drawPlanet = (ctx, W, H) => {
    starfield(ctx, W, H, 80, 700);
    const cx = W / 2, cy = H / 2, R = 8;
    ellipse(ctx, cx, cy, R + 1, R + 1, "#8ccdf0");
    ellipse(ctx, cx, cy, R, R, "#2f6fb8");
    for (let y = -R; y <= R; y++) {
      for (let x = -R; x <= R; x++) {
        if (x * x + y * y > R * R) continue;
        const n = hash(Math.floor((x + 20) / 2), Math.floor((y + 20) / 2), 9);
        if (n > 0.52) px(ctx, cx + x, cy + y, 1, 1, n > 0.8 ? "#8dbb55" : "#6b9a3f");
        else if (n < 0.12) px(ctx, cx + x, cy + y, 1, 1, "#ffffff");
      }
    }
    for (let y = -R; y <= R; y++) {
      for (let x = -R; x <= R; x++) {
        if (x * x + y * y <= R * R && x + y * 0.4 > R * 0.45) px(ctx, cx + x, cy + y, 1, 1, "rgba(6,6,26,0.55)");
      }
    }
  };
  var drawClouds = (ctx, t) => {
    if (t >= 1) return;
    for (let i = 0; i < 22; i++) {
      const a = hash(i, 90) * Math.PI * 2;
      const d0 = hash(i, 91) * 140;
      const d = d0 + t * t * 520;
      const x = 180 + Math.cos(a) * d;
      const y = 320 + Math.sin(a) * d * 1.4;
      const r = 34 + Math.floor(hash(i, 92) * 30);
      ellipse(ctx, x, y + 6, r, Math.round(r * 0.55), "#c9d6e6");
      ellipse(ctx, x, y, r, Math.round(r * 0.55), "#ffffff");
      ellipse(ctx, x - r * 0.4, y - r * 0.3, Math.round(r * 0.55), Math.round(r * 0.4), "#ffffff");
    }
  };
  return __toCommonJS(draw_exports);
})();
