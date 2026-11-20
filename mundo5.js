// Lago (identidade visual v2): tiles de 16 px, camera reta. Lago grande de ponta a ponta com pier vertical, barco, vitorias-regias e juncos que balancam, laguinho no canto, cabana do pescador,
// trilha de terra ate o pier, mato alto nas margens, arvores com zona segura e florzinhas. Mapa de 36 x 52 tiles, canvas de 240 x 427. Usado pelo mundo.js: PixmonMundo5.area.
// Legenda: . grama · , trilha · " mato alto · ~ agua · P pier (anda por cima da agua) · T arvore (muro) · > saida para a Vila (leste) · < saida para o Lago 2 (oeste)
(function () {
  const T = 16, W = 36, H = 52, RES = [240, 427], D = 'ui/mundo/v2/';
  const grade = Array.from({ length: H }, () => Array(W).fill('.'));
  const ret = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grade[r][c] = ch; };
  const bloq = new Set(), cel = (c, r) => c + ',' + r, bloquear = (c, r, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bloq.add(cel(c + i, r + j)); };
  const hsh = (x, y, k) => (((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0) % 1000;

  // ---- agua: lago grande (elipse com borda irregular) e laguinho no canto sudoeste ----
  const agua = new Set();
  for (let r = 3; r <= 23; r++) for (let c = 3; c <= 30; c++) { const dx = (c - 16) / 12.5, dy = (r - 13) / 9.5; if (dx * dx + dy * dy <= 1 + ((hsh(c, r, 200) % 3) - 1) * 0.07) agua.add(cel(c, r)); }
  for (let r = 32; r <= 37; r++) for (let c = 4; c <= 10; c++) { const dx = (c - 7) / 3.2, dy = (r - 34.5) / 2.6; if (dx * dx + dy * dy <= 1 + ((hsh(c, r, 201) % 3) - 1) * 0.06) agua.add(cel(c, r)); }
  // ---- trilha de terra: da saida leste ate o pier, com o caminho da cabana e a ligacao ao pier ----
  ret(4, 26, 35, 27, ','); ret(31, 18, 32, 25, ','); ret(15, 23, 16, 25, ',');
  const mato = (c0, r0, c1, r1) => { ret(c0, r0, c1, r1, '"'); [[c0, r0], [c1, r0], [c0, r1], [c1, r1]].forEach(([c, r]) => { grade[r][c] = '.'; }); };
  mato(11, 29, 24, 36); mato(28, 29, 33, 36); mato(5, 40, 16, 47); mato(20, 40, 31, 47); mato(30, 5, 33, 12);
  for (const k of agua) { const [c, r] = k.split(',').map(Number); grade[r][c] = '~'; }
  ret(0, 0, 35, 1, 'T'); ret(0, 50, 35, 51, 'T'); ret(0, 0, 1, 51, 'T'); ret(34, 0, 35, 51, 'T');
  ret(34, 26, 35, 27, ','); grade[26][35] = grade[27][35] = '>';
  ret(0, 26, 3, 27, ','); grade[26][0] = grade[27][0] = '<'; // saida oeste para o Lago 2
  ret(15, 12, 16, 24, 'P');                                           // pier vertical por cima da agua (anda)

  // ---- cabana do pescador (a base bloqueia) ----
  const predios = [['casa_3_f', 29, 15, 6, 3]];
  predios.forEach(([, c, r, w, h]) => bloquear(c, r, w, h));

  // ---- arvores geradas em grade com sorteio, sempre longe de trilha, pier, agua e cabana (a copa nunca cai na trilha) ----
  const arvB = [], arvD = [];
  const perigo = (ch, tolMato) => ',~^v<>P'.includes(ch) || (!tolMato && ch === '"');
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
  for (let r = 2; r < H - 3; r += 2) for (let c = 2; c < W - 3; c += 2) tentar(c, r, 60, 500, 700);
  for (let r = 3; r < H - 3; r += 2) for (let c = 3; c < W - 3; c += 2) tentar(c, r, 63, 440, 660);

  // ---- props, juncos e vitorias-regias ----
  const props = []; const pr = (k, c, r, w = 1) => { props.push([k, c, r, w]); bloquear(c, r, w, 1); };
  pr('placa', 33, 24);
  const juncos = [], lirios = [];
  const vizAgua = (c, r) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => agua.has(cel(c + a, r + b)));
  for (let r = 3; r < H - 4; r++) for (let c = 3; c < W - 4; c++) {
    if (grade[r][c] !== '.' || bloq.has(cel(c, r))) continue;
    if (vizAgua(c, r)) { const p = hsh(c, r, 71); if (p < 55) pr('pedra', c, r); else if (p < 640) juncos.push([c * T + 3 + hsh(c, r, 72) % 8, (r + 1) * T - 1, hsh(c, r, 73)]); continue; }
    if (hsh(c, r, 74) < 22 && margemLivre(c - 1, r - 1, c + 1, r + 1)) pr(hsh(c, r, 75) < 500 ? 'arbusto' : 'pedra', c, r);
  }
  for (const k of agua) { const [c, r] = k.split(',').map(Number); if (c >= 15 && c <= 16 && r >= 12) continue; if (![[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].every(([a, b]) => agua.has(cel(c + a, r + b)))) continue; if (hsh(c, r, 76) < 110) lirios.push([c * T + 2 + hsh(c, r, 77) % 5, r * T + 4 + hsh(c, r, 78) % 5, hsh(c, r, 79)]); }
  const mapa = grade.map((l) => l.join(''));

  // ---- imagens ----
  const IM = {}; let pronto = false, chao = null; const brilhos = [], tufos = [];
  const arqs = { arvore_b: 'arvore_b.png', arvore_d: 'arvore_d.png', placa: 'prop_placa.png', pedra: 'prop_pedra.png', arbusto: 'arbusto.png', casa_3_f: 'casa_3_f.png', cais: 'cais.png', barco: 'barco.png', lirio: 'lirio.png', junco_0: 'junco_0.png', junco_1: 'junco_1.png', chao_suave: 'chao_suave.png', agua_grama: 'agua_grama.png' };
  const carregar = (k) => new Promise((ok) => { const im = new Image(); im.onload = () => { IM[k] = im; ok(); }; im.onerror = ok; im.src = D + arqs[k]; });
  const tabela = (meta) => { const t = {}; meta.tileset_data.tiles.forEach((x) => { t[x.corners.NW[0] + x.corners.NE[0] + x.corners.SW[0] + x.corners.SE[0]] = x.bounding_box; }); return t; };
  // mato alto: tufos soltos (as mesmas 4 paletas analogas da Rota 1)
  const PALT = [{ h: '#99a334', l: '#407327', m: '#23822a', d: '#064f30', o: '#00261c' }, { h: '#cfd263', l: '#8a9d30', m: '#5f8f28', d: '#2f5f1f', o: '#00261c' }, { h: '#7fd0a0', l: '#2f8a60', m: '#1d7a52', d: '#0b4a3a', o: '#00261c' }, { h: '#7ea334', l: '#2f6a2a', m: '#1a5a28', d: '#063d24', o: '#00261c' }];
  const FORMAS = { g: [['....h....', '..h.m.h..', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..'], ['.....h...', '...h.m.h.', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..']],
    p: [['...h...', '.h.m.h.', '.lmmmm.', 'dmmdmmd', '.ooooo.'], ['....h..', '.h.m..h', '.lmmmm.', 'dmmdmmd', '.ooooo.']] };
  function tufo(forma, f, v) {
    const L = FORMAS[forma][f], c = document.createElement('canvas'); c.width = L[0].length; c.height = L.length + 1; const g = c.getContext('2d');
    g.fillStyle = 'rgba(35,130,42,.16)'; g.fillRect(1, L.length - 2, L[0].length - 2, 2);
    L.forEach((l, j) => [...l].forEach((ch, i) => { if (ch === '.') return; g.fillStyle = PALT[v][ch]; g.fillRect(i, j, 1, 1); }));
    return c;
  }
  let TUFO = null;
  Promise.all([Promise.all(Object.keys(arqs).map(carregar)), fetch(D + 'chao_grama_caminho.json').then((r) => r.json()), fetch(D + 'agua_grama.json').then((r) => r.json())]).then(([, mc, ma]) => {
    TUFO = { g: PALT.map((_, v) => [tufo('g', 0, v), tufo('g', 1, v)]), p: PALT.map((_, v) => [tufo('p', 0, v), tufo('p', 1, v)]) };
    const tc = tabela(mc), ta = tabela(ma), c = document.createElement('canvas'); c.width = W * T; c.height = H * T; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const cl = (x, y) => [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
    const vert = (f) => (vx, vy) => [[vx - 1, vy - 1], [vx, vy - 1], [vx - 1, vy], [vx, vy]].some(([x, y]) => { const [a, b] = cl(x, y); return f(a, b); });
    const vA = vert((x, y) => agua.has(cel(x, y))), vS = vert((x, y) => ',>^v<'.includes(mapa[y][x])), k = (v) => (v ? 'l' : 'u');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ka = k(vA(x, y)) + k(vA(x + 1, y)) + k(vA(x, y + 1)) + k(vA(x + 1, y + 1));
      if (ka === 'llll') brilhos.push([x, y]);
      if (ka !== 'uuuu') { const b = ta[ka]; g.drawImage(IM.agua_grama, b.x, b.y, 16, 16, x * T, y * T, 16, 16); continue; }
      const kc = k(vS(x, y)) + k(vS(x + 1, y)) + k(vS(x, y + 1)) + k(vS(x + 1, y + 1)), b = tc[kc] || tc.uuuu; g.drawImage(IM.chao_suave, b.x, b.y, 16, 16, x * T, y * T, 16, 16);
    }
    // sujeira sutil na trilha e florzinhas na grama lisa
    const SUJO = ['#c8b77d', '#c8b77d', '#b49a64', '#a88c5c'], FLORES = ['#f0e9ca', '#f0e9ca', '#ffc80e', '#de595a', '#a79fc0'];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (mapa[y][x] === ',') { if (hsh(x, y, 40) > 260) continue; const n = 1 + (hsh(x, y, 41) > 720 ? 1 : 0); for (let i = 0; i < n; i++) { g.fillStyle = SUJO[hsh(x, y, 42 + i) % SUJO.length]; g.fillRect(x * T + 2 + hsh(x, y, 45 + i) % 12, y * T + 2 + hsh(x, y, 48 + i) % 12, 1, 1); } continue; }
      if (mapa[y][x] !== '.' || bloq.has(cel(x, y)) || hsh(x, y, 0) > 240) continue;
      if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => !vA(x + a, y + b) && !vS(x + a, y + b))) continue;
      const n = 1 + (hsh(x, y, 1) > 650 ? 1 : 0);
      for (let i = 0; i < n; i++) { const px = x * T + 2 + hsh(x, y, 2 + i) % 12, py = y * T + 2 + hsh(x, y, 5 + i) % 12; g.fillStyle = FLORES[hsh(x, y, 8 + i) % FLORES.length]; g.fillRect(px, py, 1, 1); if (hsh(x, y, 11 + i) > 700) g.fillRect(px + 1, py, 1, 1); }
    }
    // tufos do mato alto (favo de mel ralo, borda irregular, zona segura de 10 px em volta da trilha)
    const ehMato = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H && mapa[cy][cx] === '"';
    const livreTufo = (x, y) => { const cx0 = Math.floor(x / T), cy0 = Math.floor(y / T); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const cx = cx0 + i, cy = cy0 + j; if (cx < 0 || cy < 0 || cx >= W || cy >= H) return false; const ch = mapa[cy][cx], dx = Math.max(cx * T - (x + 5), (x - 5) - (cx + 1) * T, 0), dy = Math.max(cy * T - y, (y - 8) - (cy + 1) * T, 0), d = Math.hypot(dx, dy); if (',>^v'.includes(ch) && d < 10) return false; if (ch !== '.' && ch !== '"' && d < 1) return false; if (bloq.has(cel(cx, cy)) && d < 1) return false; } return true; };
    for (let gy = 0; gy < H * 2; gy++) for (let gx = 0; gx < W * 1.7; gx++) {
      const x = gx * 10 + (gy % 2) * 5 + (hsh(gx, gy, 20) % 5) - 2, y = gy * 8 + (hsh(gx, gy, 21) % 4), cx = Math.floor(x / T), cy = Math.floor(y / T);
      if (ehMato(cx, cy)) { const borda = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a2, b2]) => !ehMato(cx + a2, cy + b2)); if (hsh(gx, gy, 22) < (borda ? 380 : 560) && livreTufo(x, y)) tufos.push([x, y, borda ? 'p' : 'g', hsh(gx, gy, 23)]); }
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => ehMato(cx + a2, cy + b2)) && hsh(gx, gy, 24) < 120 && livreTufo(x, y)) tufos.push([x, y, 'p', hsh(gx, gy, 25)]);
    }
    tufos.sort((p, q) => p[1] - q[1]);
    chao = c; pronto = true;
  });

  // ---- desenho ----
  const SETA = { '>': [1, 0], '<': [-1, 0] };
  function desenhar(g, cx, cy, extras) {
    g.fillStyle = '#9fd68a'; g.fillRect(0, 0, RES[0], RES[1]);
    if (!pronto) return;
    const t = performance.now();
    g.save(); g.translate(-cx, -cy); g.drawImage(chao, 0, 0);
    for (const [x, y, f, h] of tufos) { if (y < cy - 12 || y > cy + RES[1] + 12) continue; const im = TUFO[f][h % 4][((t / 420) + h * 0.013) % 2 < 1 ? 0 : 1]; g.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height + 3)); }
    for (const [x, y] of brilhos) { if (y * T < cy - 16 || y * T > cy + RES[1]) continue; const h = (x * 7 + y * 13) % 16, o = (x * 5 + y * 11) % 3;
      g.fillStyle = 'rgba(190,225,250,.55)'; g.fillRect(x * T + ((h + t / 160) % 16 | 0) % 14, y * T + 3 + o * 5, 4, 1); g.fillRect(x * T + ((h * 3 + 9 + t / 200) % 16 | 0) % 14, y * T + 9 + o * 2, 3, 1);
      g.fillStyle = 'rgba(30,70,140,.3)'; g.fillRect(x * T + ((h + 5 + t / 240) % 16 | 0) % 14, y * T + 6 + o * 3, 5, 1); }
    // vitorias-regias boiando (sobem e descem 1 px, defasadas)
    for (const [x, y, ph] of lirios) { if (y < cy - 12 || y > cy + RES[1] + 12) continue; g.drawImage(IM.lirio, x, Math.round(y + Math.sin(t / 700 + ph) * 1)); }
    const objs = extras.slice(), img = (k, x, y) => g.drawImage(IM[k], Math.round(x), Math.round(y)), visivel = (y) => y > cy - 60 && y < cy + RES[1] + 90;
    for (let c = 0; c < W; c += 2) { objs.push({ y: 32, f: () => img('arvore_b', c * T, 32 - 40) }); objs.push({ y: H * T, f: () => img('arvore_b', c * T, H * T - 40) }); }
    for (let r = 2; r < H - 2; r += 2) { if ([26, 28].includes(r)) continue; objs.push({ y: (r + 2) * T, f: () => img('arvore_b', 0, (r + 2) * T - 40) }); objs.push({ y: (r + 2) * T, f: () => img('arvore_b', (W - 2) * T, (r + 2) * T - 40) }); }
    arvB.forEach(([c, r]) => objs.push({ y: (r + 2) * T, f: () => img('arvore_b', c * T, (r + 2) * T - 40) }));
    arvD.forEach(([c, r]) => objs.push({ y: (r + 1) * T, f: () => img('arvore_d', c * T, (r + 1) * T - 48) }));
    predios.forEach(([k, c, r, w, h]) => objs.push({ y: (r + h) * T, f: () => img(k, (c + w / 2) * T - IM[k].width / 2, (r + h) * T - IM[k].height + 1) }));
    props.forEach(([k, c, r, w]) => objs.push({ y: (r + 1) * T, f: () => { const im = IM[k]; if (im) g.drawImage(im, Math.round((c + w / 2) * T - im.width / 2), (r + 1) * T - im.height); } }));
    for (const [x, y, ph] of juncos) objs.push({ y, f: () => { const im = IM['junco_' + (((t / 520) + ph * 0.011) % 2 < 1 ? 0 : 1)]; if (im) g.drawImage(im, Math.round(x - 4), Math.round(y - 15)); } });
    objs.push({ y: 12 * T, f: () => img('cais', 15 * T, 12 * T) });                                                   // pier (abaixo de quem anda nele)
    objs.push({ y: 20 * T, f: () => img('barco', 17.6 * T, 18.2 * T + Math.sin(t / 900) * 1.2) });                    // barco amarrado ao lado do pier, balancando
    mapa.forEach((l, r) => [...l].forEach((ch, c) => { if (!SETA[ch]) return; objs.push({ y: -1, f: () => {
      const [dx, dy] = SETA[ch], o = Math.sin(performance.now() / 180) * 2, x = c * T + 8 + dx * o, y = r * T + 8 + dy * o;
      const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
      tri(6, 4, '#1b1020'); tri(4, 2.5, '#ffd35a'); } }); }));
    objs.filter((o) => visivel(o.y)).sort((a, b) => a.y - b.y).forEach((o) => o.f());
    g.restore();
  }

  window.PixmonMundo5 = {
    desenhar, RES,
    area: { nome: 'Lago', largura: W, bioma: 'lago', elemento: 'agua', v2: true, T, res: RES, mapa, bloq, desenhar,
      npcs: [{ id: 'vera', nome: 'Bia', pele: '#e0ac84', c: 15, r: 12, dir: 'baixo', vis: 3, cor: '#34231b', camisa: '#3a8ac8', cab: '#1b1020' }],
      portais: { '>': { area: 'vila', c: 2, r: 34 }, '<': { area: 'lago2', c: 57, r: 96 } } },
  };
})();
