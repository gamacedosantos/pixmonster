// Rota 1 (identidade visual v2): tiles de 16 px, camera reta, grama lisa, trilha de areia em S, mato alto (encontros) em manchas, lagoinha animada, arvores B e D.
// Mapa de 30 x 64 tiles, canvas de 240 x 427. Usado pelo mundo.js: PixmonMundo3.area. Legenda: . grama · , trilha · " mato alto · ~ agua · T arvore (muro) · ^ saida ao Bosque (norte) · v saida para a Vila (sul)
(function () {
  const T = 16, W = 30, H = 64, RES = [240, 427], D = 'ui/mundo/v2/';
  const grade = Array.from({ length: H }, () => Array(W).fill('.'));
  const ret = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grade[r][c] = ch; };
  const bloq = new Set(), cel = (c, r) => c + ',' + r, bloquear = (c, r, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bloq.add(cel(c + i, r + j)); };

  // ---- terreno ----
  const agua = new Set(); for (let r = 28; r <= 33; r++) for (let c = 3; c <= 7; c++) agua.add(cel(c, r)); // lagoinha
  ret(13, 56, 14, 63, ','); ret(6, 54, 14, 55, ','); ret(6, 40, 7, 55, ','); ret(6, 38, 22, 39, ','); ret(21, 22, 22, 39, ','); ret(13, 20, 22, 21, ','); ret(13, 0, 14, 21, ','); // trilha em S, da Vila (sul) ao Bosque (norte)
  const mato = (c0, r0, c1, r1) => { ret(c0, r0, c1, r1, '"'); [[c0, r0], [c1, r0], [c0, r1], [c1, r1]].forEach(([c, r]) => { grade[r][c] = '.'; }); }; // cantos arredondados
  mato(3, 57, 11, 61); mato(16, 57, 26, 61); mato(2, 42, 5, 53); mato(9, 42, 17, 52); mato(9, 28, 18, 35); mato(24, 24, 27, 37); mato(4, 10, 11, 19); mato(16, 8, 25, 17);
  for (const k of agua) { const [c, r] = k.split(',').map(Number); grade[r][c] = '~'; }
  ret(0, 0, 29, 1, 'T'); ret(0, 62, 29, 63, 'T'); ret(0, 0, 1, 63, 'T'); ret(28, 0, 29, 63, 'T');
  ret(13, 0, 14, 1, ','); ret(13, 62, 14, 63, ',');
  grade[0][13] = grade[0][14] = '^'; grade[63][13] = grade[63][14] = 'v';

  // ---- arvores e props ----
  const arvB = [[3, 4], [22, 4], [24, 20], [3, 22], [3, 36], [24, 46], [19, 43], [26, 52], [8, 24]];
  const arvD = [[9, 4], [17, 4], [10, 22], [24, 40], [3, 55], [26, 54], [18, 54], [16, 36], [4, 8], [11, 50], [20, 12], [8, 13]].filter(([c, r]) => !((c >= 16 && c <= 25 && r >= 8 && r <= 17) || (c >= 4 && c <= 11 && r >= 10 && r <= 19)));
  arvB.forEach(([c, r]) => { ret(c, r, c + 1, r + 1, 'T'); });
  arvD.forEach(([c, r]) => bloquear(c, r, 2, 1));
  const props = []; const pr = (k, c, r, w = 1) => { props.push([k, c, r, w]); bloquear(c, r, w, 1); };
  pr('placa', 12, 59); [[11, 56], [23, 38], [5, 36], [16, 24], [12, 6], [25, 6]].forEach(([c, r]) => pr('pedra', c, r));
  const mapa = grade.map((l) => l.join(''));

  // ---- imagens ----
  const IM = {}; let pronto = false, chao = null; const brilhos = [];
  const arqs = { arvore_b: 'arvore_b.png', arvore_d: 'arvore_d.png', placa: 'prop_placa.png', pedra: 'prop_pedra.png', chao_suave: 'chao_suave.png', agua_grama: 'agua_grama.png' };
  const carregar = (k) => new Promise((ok) => { const im = new Image(); im.onload = () => { IM[k] = im; ok(); }; im.onerror = ok; im.src = D + arqs[k]; });
  const tabela = (meta) => { const t = {}; meta.tileset_data.tiles.forEach((x) => { t[x.corners.NW[0] + x.corners.NE[0] + x.corners.SW[0] + x.corners.SE[0]] = x.bounding_box; }); return t; };
  // mato alto: tile de 16 px em 2 quadros (as pontas das folhas balancam 1 px)
  // Tufos de folhas soltos (nao presos ao tile): grande no miolo e pequeno na borda, em favo de mel ralo; as pontas balancam entre 2 quadros.
  const PALT = [{ h: '#99a334', l: '#407327', m: '#23822a', d: '#064f30', o: '#00261c' }, { h: '#cfd263', l: '#8a9d30', m: '#5f8f28', d: '#2f5f1f', o: '#00261c' }, { h: '#7fd0a0', l: '#2f8a60', m: '#1d7a52', d: '#0b4a3a', o: '#00261c' }, { h: '#7ea334', l: '#2f6a2a', m: '#1a5a28', d: '#063d24', o: '#00261c' }]; // padrao, verde-amarelo, verde-azulado e verde profundo (analogas)
  const FORMAS = { g: [['....h....', '..h.m.h..', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..'], ['.....h...', '...h.m.h.', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..']],
    p: [['...h...', '.h.m.h.', '.lmmmm.', 'dmmdmmd', '.ooooo.'], ['....h..', '.h.m..h', '.lmmmm.', 'dmmdmmd', '.ooooo.']] };
  function tufo(forma, f, v) {
    const L = FORMAS[forma][f], c = document.createElement('canvas'); c.width = L[0].length; c.height = L.length + 1; const g = c.getContext('2d');
    g.fillStyle = 'rgba(35,130,42,.16)'; g.fillRect(1, L.length - 2, L[0].length - 2, 2); // sombra suave embaixo
    L.forEach((l, j) => [...l].forEach((ch, i) => { if (ch === '.') return; g.fillStyle = PALT[v][ch]; g.fillRect(i, j, 1, 1); }));
    return c;
  }
  let TUFO = null; const tufos = [];
  Promise.all([Promise.all(Object.keys(arqs).map(carregar)), fetch(D + 'chao_grama_caminho.json').then((r) => r.json()), fetch(D + 'agua_grama.json').then((r) => r.json())]).then(([, mc, ma]) => {
    TUFO = { g: PALT.map((_, v) => [tufo('g', 0, v), tufo('g', 1, v)]), p: PALT.map((_, v) => [tufo('p', 0, v), tufo('p', 1, v)]) };
    const tc = tabela(mc), ta = tabela(ma), c = document.createElement('canvas'); c.width = W * T; c.height = H * T; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const cl = (x, y) => [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
    const vert = (f) => (vx, vy) => [[vx - 1, vy - 1], [vx, vy - 1], [vx - 1, vy], [vx, vy]].some(([x, y]) => { const [a, b] = cl(x, y); return f(a, b); });
    const vA = vert((x, y) => agua.has(cel(x, y))), vS = vert((x, y) => ',^v'.includes(mapa[y][x])), k = (v) => (v ? 'l' : 'u');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ka = k(vA(x, y)) + k(vA(x + 1, y)) + k(vA(x, y + 1)) + k(vA(x + 1, y + 1));
      if (ka === 'llll') brilhos.push([x, y]);
      if (ka !== 'uuuu') { const b = ta[ka]; g.drawImage(IM.agua_grama, b.x, b.y, 16, 16, x * T, y * T, 16, 16); continue; }
      const kc = k(vS(x, y)) + k(vS(x + 1, y)) + k(vS(x, y + 1)) + k(vS(x + 1, y + 1)), b = tc[kc] || tc.uuuu; g.drawImage(IM.chao_suave, b.x, b.y, 16, 16, x * T, y * T, 16, 16);
    }
    // posicoes dos tufos: grade em favo de mel (10 x 8 px) com sorteio; fora do mato so entram tufos pequenos colados na borda, para a mancha ter contorno irregular
    const OK = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H && (mapa[cy][cx] === '.' || mapa[cy][cx] === '"') && !bloq.has(cel(cx, cy)), livreTufo = (x, y) => { const cx0 = Math.floor(x / T), cy0 = Math.floor(y / T); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const cx = cx0 + i, cy = cy0 + j; if (cx < 0 || cy < 0 || cx >= W || cy >= H) return false; const ch = mapa[cy][cx], dx = Math.max(cx * T - (x + 5), (x - 5) - (cx + 1) * T, 0), dy = Math.max(cy * T - y, (y - 8) - (cy + 1) * T, 0), d = Math.hypot(dx, dy); if (',^v'.includes(ch) && d < 10) return false; if (ch !== '.' && ch !== '"' && d < 1) return false; if (bloq.has(cel(cx, cy)) && d < 1) return false; } return true; };
    const hh = (x, y, kk) => (((x * 73856093) ^ (y * 19349663) ^ (kk * 83492791)) >>> 0) % 1000, ehMato = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H && mapa[cy][cx] === '"';
    for (let gy = 0; gy < H * 2; gy++) for (let gx = 0; gx < W * 1.7; gx++) {
      const x = gx * 10 + (gy % 2) * 5 + (hh(gx, gy, 20) % 5) - 2, y = gy * 8 + (hh(gx, gy, 21) % 4), cx = Math.floor(x / T), cy = Math.floor(y / T);
      if (ehMato(cx, cy)) { const borda = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a2, b2]) => !ehMato(cx + a2, cy + b2)); if (hh(gx, gy, 22) < (borda ? 380 : 560) && livreTufo(x, y)) tufos.push([x, y, borda ? 'p' : 'g', hh(gx, gy, 23)]); }
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => ehMato(cx + a2, cy + b2)) && hh(gx, gy, 24) < 120 && livreTufo(x, y)) tufos.push([x, y, 'p', hh(gx, gy, 25)]);
    }
    tufos.sort((p, q) => p[1] - q[1]);
    // florzinhas sutis na grama lisa
    const FLORES = ['#f0e9ca', '#f0e9ca', '#ffc80e', '#de595a', '#a79fc0'], hsh = (x, y, kk) => (((x * 73856093) ^ (y * 19349663) ^ (kk * 83492791)) >>> 0) % 1000;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (mapa[y][x] !== '.' || bloq.has(cel(x, y)) || hsh(x, y, 0) > 240) continue;
      if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => !vA(x + a, y + b) && !vS(x + a, y + b))) continue;
      const n = 1 + (hsh(x, y, 1) > 650 ? 1 : 0);
      for (let i = 0; i < n; i++) { const px = x * T + 2 + hsh(x, y, 2 + i) % 12, py = y * T + 2 + hsh(x, y, 5 + i) % 12; g.fillStyle = FLORES[hsh(x, y, 8 + i) % FLORES.length]; g.fillRect(px, py, 1, 1); if (hsh(x, y, 11 + i) > 700) g.fillRect(px + 1, py, 1, 1); }
    }
    // sujeira da trilha: pontinhos de areia mais escura e marrom, sutis, so em tiles de caminho (',')
    const SUJO = ['#c8b77d', '#c8b77d', '#b49a64', '#a88c5c'];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (mapa[y][x] !== ',' || hsh(x, y, 40) > 260) continue;
      const n = 1 + (hsh(x, y, 41) > 720 ? 1 : 0);
      for (let i = 0; i < n; i++) { g.fillStyle = SUJO[hsh(x, y, 42 + i) % SUJO.length]; g.fillRect(x * T + 2 + hsh(x, y, 45 + i) % 12, y * T + 2 + hsh(x, y, 48 + i) % 12, 1, 1); }
    }
    chao = c; pronto = true;
  });

  // ---- desenho ----
  const SETA = { '^': [0, -1], v: [0, 1] };
  function desenhar(g, cx, cy, extras) {
    g.fillStyle = '#9fd68a'; g.fillRect(0, 0, RES[0], RES[1]);
    if (!pronto) return;
    const t = performance.now();
    g.save(); g.translate(-cx, -cy); g.drawImage(chao, 0, 0);
    for (const [x, y, f, h] of tufos) { if (y < cy - 12 || y > cy + RES[1] + 12) continue; const im = TUFO[f][h % 4][((t / 420) + h * 0.013) % 2 < 1 ? 0 : 1]; g.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height + 3)); }
    for (const [x, y] of brilhos) { if (y * T < cy - 16 || y * T > cy + RES[1]) continue; const h = (x * 7 + y * 13) % 16, o = (x * 5 + y * 11) % 3;
      g.fillStyle = 'rgba(190,225,250,.55)'; g.fillRect(x * T + ((h + t / 160) % 16 | 0) % 14, y * T + 3 + o * 5, 4, 1); g.fillRect(x * T + ((h * 3 + 9 + t / 200) % 16 | 0) % 14, y * T + 9 + o * 2, 3, 1);
      g.fillStyle = 'rgba(30,70,140,.3)'; g.fillRect(x * T + ((h + 5 + t / 240) % 16 | 0) % 14, y * T + 6 + o * 3, 5, 1); }
    const objs = extras.slice(), img = (k, x, y) => g.drawImage(IM[k], Math.round(x), Math.round(y)), visivel = (y) => y > cy - 60 && y < cy + RES[1] + 90;
    for (let c = 0; c < W; c += 2) { if (![12, 14].includes(c)) { objs.push({ y: 32, f: () => img('arvore_b', c * T, 32 - 40) }); objs.push({ y: H * T, f: () => img('arvore_b', c * T, H * T - 40) }); } }
    for (let r = 2; r < H - 2; r += 2) { objs.push({ y: (r + 2) * T, f: () => img('arvore_b', 0, (r + 2) * T - 40) }); objs.push({ y: (r + 2) * T, f: () => img('arvore_b', (W - 2) * T, (r + 2) * T - 40) }); }
    arvB.forEach(([c, r]) => objs.push({ y: (r + 2) * T, f: () => img('arvore_b', c * T, (r + 2) * T - 40) }));
    arvD.forEach(([c, r]) => objs.push({ y: (r + 1) * T, f: () => img('arvore_d', c * T, (r + 1) * T - 48) }));
    props.forEach(([k, c, r, w]) => objs.push({ y: (r + 1) * T, f: () => { const im = IM[k]; if (im) g.drawImage(im, Math.round((c + w / 2) * T - im.width / 2), (r + 1) * T - im.height); } }));
    mapa.forEach((l, r) => [...l].forEach((ch, c) => { if (!SETA[ch]) return; objs.push({ y: -1, f: () => {
      const [dx, dy] = SETA[ch], o = Math.sin(performance.now() / 180) * 2, x = c * T + 8 + dx * o, y = r * T + 8 + dy * o;
      const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
      tri(6, 4, '#1b1020'); tri(4, 2.5, '#ffd35a'); } }); }));
    objs.filter((o) => visivel(o.y)).sort((a, b) => a.y - b.y).forEach((o) => o.f());
    g.restore();
  }

  window.PixmonMundo3 = {
    desenhar, RES,
    area: { nome: 'Rota 1', largura: W, bioma: 'campo', elemento: null, v2: true, T, res: RES, mapa, bloq, desenhar,
      npcs: [
        { id: 'bruno', nome: 'Zico', pele: '#c98a5e', matiz: 100, c: 10, r: 53, dir: 'baixo', vis: 2, cor: '#34231b', camisa: '#6a8a3a', cab: '#2a1a10' },
        { id: 'isis', nome: 'Iris', pele: '#f6d3bb', matiz: 200, c: 19, r: 30, dir: 'dir', vis: 2, cor: '#34231b', camisa: '#285a9a', cab: '#d8a63a' },
        { id: 'lucia', nome: 'Luh', pele: '#8a5a3a', matiz: 50, c: 11, r: 6, dir: 'dir', vis: 2, cor: '#34231b', camisa: '#e8cc40', cab: '#5a3a20' },
      ],
      portais: { v: { area: 'vila', c: 6, r: 2 }, '^': { area: 'bosque', c: 17, r: 61 } } },
  };
})();
