// Fazenda (identidade visual v2): tiles de 16 px, camera reta. Celeiro, cabana, moinho com as pas girando, tres plantacoes cercadas (trigo que balanca, horta, abobora), pasto com vacas e galinhas animadas,
// poco, feno, espantalho, trilha de terra, mato alto, arvores com zona segura e florzinhas. Mapa de 40 x 48 tiles, canvas de 240 x 427. Usado pelo mundo.js: PixmonMundo6.area.
// Legenda: . grama · , trilha · " mato alto · T arvore (muro) · < saida para a Vila (oeste)
(function () {
  const T = 16, W = 40, H = 48, RES = [240, 427], D = 'ui/mundo/v2/';
  const grade = Array.from({ length: H }, () => Array(W).fill('.'));
  const ret = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grade[r][c] = ch; };
  const bloq = new Set(), cel = (c, r) => c + ',' + r, bloquear = (c, r, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bloq.add(cel(c + i, r + j)); };
  const hsh = (x, y, k) => (((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0) % 1000;

  // ---- terreno: trilha leste-oeste com ramais ate o celeiro e a cabana ----
  ret(0, 22, 33, 23, ','); ret(6, 11, 7, 21, ','); ret(29, 11, 30, 21, ',');
  const mato = (c0, r0, c1, r1) => { ret(c0, r0, c1, r1, '"'); [[c0, r0], [c1, r0], [c0, r1], [c1, r1]].forEach(([c, r]) => { grade[r][c] = '.'; }); };
  mato(12, 14, 25, 19); mato(13, 3, 24, 8); mato(24, 38, 36, 45);
  ret(0, 0, 39, 1, 'T'); ret(0, 46, 39, 47, 'T'); ret(0, 0, 1, 47, 'T'); ret(38, 0, 39, 47, 'T');
  ret(0, 22, 1, 23, ','); grade[22][0] = grade[23][0] = '<';

  // ---- construcoes (a base inteira bloqueia): celeiro, cabana e a torre do moinho ----
  const predios = [['celeiro_f', 3, 8, 8, 3], ['casa_2_f', 27, 8, 6, 3], ['moinho_torre', 35, 14, 3, 2]];
  predios.forEach(([, c, r, w, h]) => bloquear(c, r, w, h));

  // ---- plantacoes (interior bloqueado, cerca em volta) e pasto ----
  const campos = [{ c0: 5, r0: 27, c1: 14, r1: 33, t: 'trigo' }, { c0: 17, r0: 27, c1: 26, r1: 33, t: 'horta' }, { c0: 29, r0: 27, c1: 34, r1: 33, t: 'abobora' }];
  campos.forEach((f) => bloquear(f.c0, f.r0, f.c1 - f.c0 + 1, f.r1 - f.r0 + 1));
  const props = []; const pr = (k, c, r, w = 1) => { props.push([k, c, r, w]); bloquear(c, r, w, 1); };
  const cerca = (c0, r0, c1, r1, gap) => { // anel de cerca um tile fora dos limites; gap = [colIni, colFim] sem cerca na linha de cima (portao)
    for (let c = c0 - 1; c <= c1 + 1; c++) { if (!(gap && c >= gap[0] && c <= gap[1])) pr('cerca_h', c, r0 - 1); pr('cerca_h', c, r1 + 1); }
    for (let r = r0; r <= r1; r++) { pr('cerca_v', c0 - 1, r); pr('cerca_v', c1 + 1, r); }
  };
  campos.forEach((f) => cerca(f.c0, f.r0, f.c1, f.r1));
  const pasto = { c0: 5, r0: 38, c1: 20, r1: 45 }; cerca(pasto.c0, pasto.r0, pasto.c1, pasto.r1, [12, 13]);
  const vacas = [[8, 40, 0.2], [14, 42, 0.6], [10, 44, 0.9]], galinhas = [[7, 41, 0.1], [17, 39, 0.5], [12, 43, 0.8], [19, 44, 0.3]];
  vacas.forEach(([c, r]) => bloquear(c, r, 2, 1));
  pr('cocho', 17, 41, 2);
  pr('feno', 9, 13); pr('feno', 10, 12); pr('feno', 11, 13); pr('poco', 10, 20); pr('placa', 3, 21);
  props.push(['espantalho', 9, 30, 1]);

  // ---- arvores geradas em grade com sorteio, sempre longe da trilha e das construcoes (a copa nunca cai na trilha) ----
  const arvB = [], arvD = [];
  const perigo = (ch, tolMato) => ',<>^vP'.includes(ch) || (!tolMato && ch === '"');
  const margemLivre = (c0, r0, c1, r1, tolMato = false) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { if (c < 0 || r < 0 || c >= W || r >= H) return false; if (perigo(grade[r][c], tolMato) || bloq.has(cel(c, r))) return false; } return true; };
  const tentar = (c, r, sem, pB, pD) => {
    const cc = c + (hsh(c, r, sem) % 2), rr = r + (hsh(c, r, sem + 1) % 2), p = hsh(c, r, sem + 2);
    if (p < pB) {
      if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => cc + a < W - 2 && rr + b < H - 2 && grade[rr + b][cc + a] === '.' && !bloq.has(cel(cc + a, rr + b)))) return;
      if (!margemLivre(cc - 1, rr - 1, cc + 2, rr + 2, true)) return;
      arvB.push([cc, rr]); ret(cc, rr, cc + 1, rr + 1, 'T');
    } else if (p < pD) {
      const dr = rr + 1; if (dr >= H - 3) return;
      if (![[0, 0], [1, 0]].every(([a]) => grade[dr][cc + a] === '.' && !bloq.has(cel(cc + a, dr)))) return;
      if (!margemLivre(cc - 1, dr - 3, cc + 2, dr + 1, true)) return;
      arvD.push([cc, dr]); bloquear(cc, dr, 2, 1);
    }
  };
  for (let r = 2; r < H - 3; r += 2) for (let c = 2; c < W - 3; c += 2) tentar(c, r, 60, 330, 520);
  for (let r = 3; r < H - 3; r += 2) for (let c = 3; c < W - 3; c += 2) tentar(c, r, 63, 270, 470);
  for (let r = 3; r < H - 4; r++) for (let c = 3; c < W - 4; c++) { if (grade[r][c] !== '.' || bloq.has(cel(c, r)) || hsh(c, r, 74) >= 16 || !margemLivre(c - 1, r - 1, c + 1, r + 1)) continue; pr(hsh(c, r, 75) < 500 ? 'arbusto' : 'pedra', c, r); }
  const mapa = grade.map((l) => l.join(''));

  // ---- imagens ----
  const IM = {}; let pronto = false, chao = null; const tufos = [];
  const arqs = { arvore_b: 'arvore_b.png', arvore_d: 'arvore_d.png', placa: 'prop_placa.png', pedra: 'prop_pedra.png', arbusto: 'arbusto.png', casa_2_f: 'casa_2_f.png', celeiro_f: 'celeiro_f.png', moinho_torre: 'moinho_torre.png', espantalho: 'espantalho.png', feno: 'feno.png', poco: 'poco.png', cocho: 'cocho.png', vaca_0: 'vaca_0.png', vaca_1: 'vaca_1.png', galinha_0: 'galinha_0.png', galinha_1: 'galinha_1.png', cerca_h: 'cerca_h.png', cerca_v: 'cerca_v.png', chao_suave: 'chao_suave.png', agua_grama: 'agua_grama.png' };
  const carregar = (k) => new Promise((ok) => { const im = new Image(); im.onload = () => { IM[k] = im; ok(); }; im.onerror = ok; im.src = D + arqs[k]; });
  const tabela = (meta) => { const t = {}; meta.tileset_data.tiles.forEach((x) => { t[x.corners.NW[0] + x.corners.NE[0] + x.corners.SW[0] + x.corners.SE[0]] = x.bounding_box; }); return t; };
  // mato alto: tufos soltos (as 4 paletas analogas da Rota 1)
  const PALT = [{ h: '#99a334', l: '#407327', m: '#23822a', d: '#064f30', o: '#00261c' }, { h: '#cfd263', l: '#8a9d30', m: '#5f8f28', d: '#2f5f1f', o: '#00261c' }, { h: '#7fd0a0', l: '#2f8a60', m: '#1d7a52', d: '#0b4a3a', o: '#00261c' }, { h: '#7ea334', l: '#2f6a2a', m: '#1a5a28', d: '#063d24', o: '#00261c' }];
  const FORMAS = { g: [['....h....', '..h.m.h..', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..'], ['.....h...', '...h.m.h.', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..']],
    p: [['...h...', '.h.m.h.', '.lmmmm.', 'dmmdmmd', '.ooooo.'], ['....h..', '.h.m..h', '.lmmmm.', 'dmmdmmd', '.ooooo.']] };
  function tufo(forma, f, v) {
    const L = FORMAS[forma][f], c = document.createElement('canvas'); c.width = L[0].length; c.height = L.length + 1; const g = c.getContext('2d');
    g.fillStyle = 'rgba(35,130,42,.16)'; g.fillRect(1, L.length - 2, L[0].length - 2, 2);
    L.forEach((l, j) => [...l].forEach((ch, i) => { if (ch === '.') return; g.fillStyle = PALT[v][ch]; g.fillRect(i, j, 1, 1); }));
    return c;
  }
  // tiles de plantacao (16 x 16): terra com trigo (2 quadros de balanco), repolhos verdes/roxos e aboboras
  const px1 = (g, x, y, cor, w = 1, h = 1) => { g.fillStyle = cor; g.fillRect(x, y, w, h); };
  function solo(g) { g.fillStyle = '#6b4a2e'; g.fillRect(0, 0, 16, 16); for (let y = 2; y < 16; y += 5) px1(g, 0, y, '#5a3a22', 16, 1); for (const [x, y] of [[2, 1], [9, 4], [13, 8], [4, 11], [11, 14]]) px1(g, x, y, '#8a6a46'); }
  function tileTrigo(f) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); solo(g);
    for (let i = 0; i < 4; i++) { const x = 1 + i * 4, topo = 2 + (i * 5) % 3, dx = f ? 1 : 0; for (let y = 15; y > topo + 3; y--) px1(g, x + (y < 9 ? dx : 0), y, y > 11 ? '#9a7a20' : '#d4a020'); px1(g, x + dx, topo + 1, '#f0d060', 1, 3); px1(g, x + dx + 1, topo + 2, '#d4a020', 1, 2); px1(g, x + dx - 1, topo + 3, '#d4a020'); px1(g, x + dx, topo, '#f5e08a'); }
    return c; }
  function tileHorta(roxo) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); solo(g);
    const cor = roxo ? ['#4d3b6a', '#756995', '#a79fc0'] : ['#23822a', '#407327', '#99a334'];
    for (let y = 3; y <= 14; y++) for (let x = 3; x <= 12; x++) { const dx = (x - 7.5) / 4.8, dy = (y - 8.5) / 5.4; if (dx * dx + dy * dy > 1) continue; px1(g, x, y, dy > 0.3 ? cor[0] : dx * dx + dy * dy < 0.35 ? cor[2] : cor[1]); }
    px1(g, 6, 7, cor[2]); px1(g, 8, 10, cor[0]); px1(g, 5, 12, '#064f30', 6, 1); return c; }
  function tileAbobora() { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); solo(g);
    for (let y = 4; y <= 14; y++) for (let x = 2; x <= 13; x++) { const dx = (x - 7.5) / 6, dy = (y - 9.5) / 5; if (dx * dx + dy * dy > 1) continue; px1(g, x, y, (x === 7 || x === 8) ? '#bf6937' : dx < -0.3 && dy < 0 ? '#f5a86a' : '#e1894c'); }
    px1(g, 7, 3, '#407327', 2, 2); px1(g, 9, 3, '#23822a', 3, 1); px1(g, 3, 12, '#9b3f33', 10, 1); return c; }
  // pas do moinho: 12 quadros de rotacao (cada um gira ate 90 graus), desenhadas ponto a ponto para ficar em pixel art
  function pasFrame(k) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), a0 = (k / 12) * (Math.PI / 2);
    const lamina = (larg, ci, s0, s1) => { for (let b = 0; b < 4; b++) { const a = a0 + b * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); for (let s = s0; s <= s1; s += 0.5) for (let w = -larg; w <= larg; w++) { const x = 32 + s * ca - w * sa, y = 32 + s * sa + w * ca; g.fillStyle = typeof ci === 'string' ? ci : (Math.abs(w) === larg - 1 && larg > 2 ? ci[0] : (w === 0 ? ci[2] : ci[1])); g.fillRect(Math.round(x), Math.round(y), 1, 1); } } };
    lamina(4, '#000000', 2, 30); lamina(3, ['#865201', '#f0e9ca', '#c29363'], 4, 28); g.fillStyle = '#000000'; g.fillRect(29, 29, 7, 7); g.fillStyle = '#5c2e01'; g.fillRect(30, 30, 5, 5); g.fillStyle = '#c29363'; g.fillRect(31, 31, 2, 2); return c; }
  let TUFO = null, CROP = null, PAS = null;
  Promise.all([Promise.all(Object.keys(arqs).map(carregar)), fetch(D + 'chao_grama_caminho.json').then((r) => r.json()), fetch(D + 'agua_grama.json').then((r) => r.json())]).then(([, mc]) => {
    TUFO = { g: PALT.map((_, v) => [tufo('g', 0, v), tufo('g', 1, v)]), p: PALT.map((_, v) => [tufo('p', 0, v), tufo('p', 1, v)]) };
    CROP = { trigo: [tileTrigo(0), tileTrigo(1)], horta: [tileHorta(false), tileHorta(true)], abobora: [tileAbobora()] };
    PAS = Array.from({ length: 12 }, (_, k) => pasFrame(k));
    const tc = tabela(mc), c = document.createElement('canvas'); c.width = W * T; c.height = H * T; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const cl = (x, y) => [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
    const vert = (f) => (vx, vy) => [[vx - 1, vy - 1], [vx, vy - 1], [vx - 1, vy], [vx, vy]].some(([x, y]) => { const [a, b] = cl(x, y); return f(a, b); });
    const vS = vert((x, y) => ',<>^v'.includes(mapa[y][x])), k = (v) => (v ? 'l' : 'u');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const kc = k(vS(x, y)) + k(vS(x + 1, y)) + k(vS(x, y + 1)) + k(vS(x + 1, y + 1)), b = tc[kc] || tc.uuuu; g.drawImage(IM.chao_suave, b.x, b.y, 16, 16, x * T, y * T, 16, 16); }
    // sujeira sutil na trilha e florzinhas na grama lisa
    const SUJO = ['#c8b77d', '#c8b77d', '#b49a64', '#a88c5c'], FLORES = ['#f0e9ca', '#f0e9ca', '#ffc80e', '#ffc80e', '#de595a', '#a79fc0'];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (mapa[y][x] === ',') { if (hsh(x, y, 40) > 260) continue; const n = 1 + (hsh(x, y, 41) > 720 ? 1 : 0); for (let i = 0; i < n; i++) { g.fillStyle = SUJO[hsh(x, y, 42 + i) % SUJO.length]; g.fillRect(x * T + 2 + hsh(x, y, 45 + i) % 12, y * T + 2 + hsh(x, y, 48 + i) % 12, 1, 1); } continue; }
      if (mapa[y][x] !== '.' || bloq.has(cel(x, y)) || hsh(x, y, 0) > 280) continue;
      if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => !vS(x + a, y + b))) continue;
      const n = 1 + (hsh(x, y, 1) > 600 ? 1 : 0);
      for (let i = 0; i < n; i++) { const px = x * T + 2 + hsh(x, y, 2 + i) % 12, py = y * T + 2 + hsh(x, y, 5 + i) % 12; g.fillStyle = FLORES[hsh(x, y, 8 + i) % FLORES.length]; g.fillRect(px, py, 1, 1); if (hsh(x, y, 11 + i) > 700) g.fillRect(px + 1, py, 1, 1); }
    }
    // tufos do mato alto (favo de mel ralo, borda irregular, zona segura de 10 px em volta da trilha)
    const ehMato = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H && mapa[cy][cx] === '"';
    const livreTufo = (x, y) => { const cx0 = Math.floor(x / T), cy0 = Math.floor(y / T); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const cx = cx0 + i, cy = cy0 + j; if (cx < 0 || cy < 0 || cx >= W || cy >= H) return false; const ch = mapa[cy][cx], dx = Math.max(cx * T - (x + 5), (x - 5) - (cx + 1) * T, 0), dy = Math.max(cy * T - y, (y - 8) - (cy + 1) * T, 0), d = Math.hypot(dx, dy); if (',<>^v'.includes(ch) && d < 10) return false; if (ch !== '.' && ch !== '"' && d < 1) return false; if (bloq.has(cel(cx, cy)) && d < 1) return false; } return true; };
    for (let gy = 0; gy < H * 2; gy++) for (let gx = 0; gx < W * 1.7; gx++) {
      const x = gx * 10 + (gy % 2) * 5 + (hsh(gx, gy, 20) % 5) - 2, y = gy * 8 + (hsh(gx, gy, 21) % 4), cx = Math.floor(x / T), cy = Math.floor(y / T);
      if (ehMato(cx, cy)) { const borda = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a2, b2]) => !ehMato(cx + a2, cy + b2)); if (hsh(gx, gy, 22) < (borda ? 380 : 560) && livreTufo(x, y)) tufos.push([x, y, borda ? 'p' : 'g', hsh(gx, gy, 23)]); }
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => ehMato(cx + a2, cy + b2)) && hsh(gx, gy, 24) < 120 && livreTufo(x, y)) tufos.push([x, y, 'p', hsh(gx, gy, 25)]);
    }
    tufos.sort((p, q) => p[1] - q[1]);
    chao = c; pronto = true;
  });

  // ---- desenho ----
  const SETA = { '<': [-1, 0] };
  function desenhar(g, cx, cy, extras) {
    g.fillStyle = '#9fd68a'; g.fillRect(0, 0, RES[0], RES[1]);
    if (!pronto) return;
    const t = performance.now();
    g.save(); g.translate(-cx, -cy); g.drawImage(chao, 0, 0);
    for (const f of campos) { if ((f.r1 + 1) * T < cy - 16 || f.r0 * T > cy + RES[1]) continue; const fr = CROP[f.t]; for (let r = f.r0; r <= f.r1; r++) for (let c = f.c0; c <= f.c1; c++) g.drawImage(fr[f.t === 'trigo' ? ((t / 480) + (c * 0.37 + r * 0.53)) % 2 < 1 ? 0 : 1 : f.t === 'horta' ? (c + r) % 2 : 0], c * T, r * T); }
    for (const [x, y, f, h] of tufos) { if (y < cy - 12 || y > cy + RES[1] + 12) continue; const im = TUFO[f][h % 4][((t / 420) + h * 0.013) % 2 < 1 ? 0 : 1]; g.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height + 3)); }
    const objs = extras.slice(), img = (k, x, y) => g.drawImage(IM[k], Math.round(x), Math.round(y)), visivel = (y) => y > cy - 60 && y < cy + RES[1] + 90;
    for (let c = 0; c < W; c += 2) { objs.push({ y: 32, f: () => img('arvore_b', c * T, 32 - 40) }); objs.push({ y: H * T, f: () => img('arvore_b', c * T, H * T - 40) }); }
    for (let r = 2; r < H - 2; r += 2) { if ([22, 24].includes(r)) continue; objs.push({ y: (r + 2) * T, f: () => img('arvore_b', 0, (r + 2) * T - 40) }); objs.push({ y: (r + 2) * T, f: () => img('arvore_b', (W - 2) * T, (r + 2) * T - 40) }); }
    arvB.forEach(([c, r]) => objs.push({ y: (r + 2) * T, f: () => img('arvore_b', c * T, (r + 2) * T - 40) }));
    arvD.forEach(([c, r]) => objs.push({ y: (r + 1) * T, f: () => img('arvore_d', c * T, (r + 1) * T - 48) }));
    predios.forEach(([k, c, r, w, h]) => objs.push({ y: (r + h) * T, f: () => { const x0 = (c + w / 2) * T - IM[k].width / 2, y0 = (r + h) * T - IM[k].height + 1; img(k, x0, y0); } }));
    objs.push({ y: 16 * T + 1, f: () => { const x0 = 36.5 * T - 20, y0 = 16 * T - 71; g.drawImage(PAS[Math.floor(t / 330) % 12], Math.round(x0 + 20 - 32), Math.round(y0 + 16 - 32)); } }); // pas do moinho girando (4 s por quarto de volta)
    props.forEach(([k, c, r, w]) => objs.push({ y: (r + 1) * T, f: () => { const im = IM[k]; if (im) g.drawImage(im, Math.round((c + w / 2) * T - im.width / 2), (r + 1) * T - im.height); } }));
    vacas.forEach(([c, r, ph]) => objs.push({ y: (r + 1) * T, f: () => g.drawImage(IM['vaca_' + (((t / 1700) + ph * 2) % 2 < 1 ? 1 : 0)], Math.round((c + 1) * T - 12), (r + 1) * T - 16) }));
    galinhas.forEach(([c, r, ph]) => objs.push({ y: (r + 1) * T, f: () => g.drawImage(IM['galinha_' + (((t / 650) + ph * 7) % 2 < 1 ? 1 : 0)], Math.round(c * T + 3 + ph * 4), (r + 1) * T - 9) }));
    mapa.forEach((l, r) => [...l].forEach((ch, c) => { if (!SETA[ch]) return; objs.push({ y: -1, f: () => {
      const [dx, dy] = SETA[ch], o = Math.sin(performance.now() / 180) * 2, x = c * T + 8 + dx * o, y = r * T + 8 + dy * o;
      const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
      tri(6, 4, '#1b1020'); tri(4, 2.5, '#ffd35a'); } }); }));
    objs.filter((o) => visivel(o.y)).sort((a, b) => a.y - b.y).forEach((o) => o.f());
    g.restore();
  }

  window.PixmonMundo6 = {
    desenhar, RES,
    area: { nome: 'Fazenda', largura: W, bioma: 'campo', elemento: 'terra', v2: true, T, res: RES, mapa, bloq, desenhar,
      npcs: [{ id: 'otto', nome: 'Otto', pele: '#c98a5e', c: 13, r: 21, dir: 'baixo', vis: 2, cor: '#34231b', camisa: '#c0763a', cab: '#3a2a1a' }],
      portais: { '<': { area: 'vila', c: 37, r: 34 } } },
  };
})();
