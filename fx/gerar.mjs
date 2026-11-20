#!/usr/bin/env node
// Gera as folhas de sprite de efeitos do pixelfx usadas no protótipo Pixmon (MIT, patch-gg/pixelfx).
// Usa a biblioteca já vendorizada em remotion/vendor/pixelfx (mesma que a série usa).
//   node fx/gerar.mjs            gera todas
//   node fx/gerar.mjs fogo-bola  gera só uma
// Saída: fx/<nome>.png (quadros em grade, fundo transparente) + fx/<nome>.json (retângulos, fps, loop, pivô).
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEffect, renderFrames, spriteSheet, save } from "../../../remotion/vendor/pixelfx/tools/lib/fxlib.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));

// Paletas: rampa do escuro ao claro, como o pixelfx espera
const PAL = {
  fogo: ["#3a1a0a", "#8a3e22", "#c8683a", "#e0703a", "#ffd35a", "#fff6c8", "#ffffff"],
  agua: ["#13283f", "#1c3a5a", "#2f6a9a", "#4aa3d8", "#8ccdf0", "#e8f8ff", "#ffffff"],
  eletrico: ["#0b1a2e", "#1e4a7a", "#2f78a8", "#6fd6ff", "#fff2a0", "#ffffff"],
  ar: ["#2a3a4a", "#4a6a80", "#7fb0c8", "#bfe0f0", "#f4f9fc", "#ffffff"],
  terra: ["#2a1c12", "#5e3b1b", "#8a5a2b", "#a8793f", "#d8b878", "#f4e6c4"],
};

// nome da folha -> efeito do pixelfx, paleta e quantos quadros manter (null = todos)
const CATALOGO = {
  // projéteis (loop, a posição é movida pelo jogo)
  "fogo-bola": { id: "fire/fireball", opts: { palette: PAL.fogo }, quadros: null },
  "agua-orbe": { id: "water/water-orb", opts: { palette: PAL.agua }, quadros: null },
  "eletrico-bola": { id: "lightning/ball-lightning", opts: { palette: PAL.eletrico }, quadros: null },
  "ar-folhas": { id: "nature/leaf-storm", opts: { palette: PAL.ar }, quadros: null },
  // Lightbeam (teste): feixe arcano de 168 px saindo da mão, com chama na origem e no fim; a arena estica e gira conforme a distância
  "feixe-arcano": { id: "arcane/arcane-beam", opts: {}, quadros: null },
  // carga do Lightbeam (teste): energia em espiral numa esfera na mão (120x86, mão em 59,58), 1,6 s em loop
  "carga-arcana": { id: "arcane/spell-charge", opts: {}, quadros: null },
  // impactos (uma vez)
  "fogo-impacto": { id: "fire/meteor", opts: { palette: PAL.fogo }, quadros: 24 },
  "agua-impacto": { id: "water/splash", opts: { palette: PAL.agua }, quadros: 30 },
  "eletrico-impacto": { id: "lightning/zap-hit", opts: { palette: PAL.eletrico }, quadros: 24 },
  "terra-impacto": { id: "nature/earth-spike", opts: { palette: PAL.terra }, quadros: 30 },
  "ar-impacto": { id: "nature/tornado", opts: { palette: PAL.ar }, quadros: 30 },
};

const pedidos = process.argv.slice(2);
const nomes = pedidos.length ? pedidos : Object.keys(CATALOGO);
let falhou = 0;
for (const nome of nomes) {
  const e = CATALOGO[nome];
  if (!e) { console.error(`${nome}: fora do catálogo`); falhou++; continue; }
  try {
    const fx = await loadEffect(e.id);
    const r = renderFrames(fx, { bg: "none", actor: false, options: e.opts });
    if (e.quadros && e.quadros < r.frames.length) { r.frames = r.frames.slice(0, e.quadros); r.n = r.frames.length; }
    const s = spriteSheet(fx, r, nome);
    save(join(AQUI, `${nome}.png`), s.png);
    save(join(AQUI, `${nome}.json`), JSON.stringify(s.json, null, 1));
    const m = s.json.meta.pixelfx;
    console.log(`${nome.padEnd(18)} ${e.id.padEnd(28)} ${String(m.frames).padStart(3)} quadros  ${m.frameSize.join("x")}  fps ${m.fps}  loop ${m.loop}  pivô ${m.pivot.join(",")}`);
  } catch (err) {
    falhou++;
    console.error(`${nome}  FALHOU: ${err.stack ?? err}`);
  }
}
process.exit(falhou ? 1 : 0);
