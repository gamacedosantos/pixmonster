// Construtor de areas do PixMonster (W0 do PLANO-fases.md). Monta uma area de floresta/lago no estilo do Bosque (identidade visual v2: tiles de 16 px, camera reta, arvores B e D, mato alto,
// agua animada, trilha, props sorteados) a partir de um arquivo de dados `spec` (ver mundo7.js, a Floresta Oculta, como exemplo). O `spec` traz o tamanho (W x H tiles), o terreno (callback com
// ret/mato/aguaRet), predios ([imagem, col, lin, larg, alt] em tiles; a base bloqueia), props fixos, imagens extras, recolorir (troca de canais, ex.: { ginasio_f: 'rb' }), densidade das arvores, portas L (loja) e G (ginasio), as saidas sem arvore (vaoSul/vaoNorte: colunas pares; vaoOeste/vaoLeste: linhas pares R e R+2 para um portal nas linhas R e R+1), a tinta do chao, a camada de cor e os vagalumes, os NPCs e os portais. Registra a area em window.PixmonAreasExtra[spec.id],
// que o mundo.js carrega. Tamanho de referencia das areas novas: ~60x110 tiles (3x em area).
(function () {
  function criar(spec) {
  const T = 16, W = spec.W, H = spec.H, RES = [240, 427], D = 'ui/mundo/v2/';
  const grade = Array.from({ length: H }, () => Array(W).fill('.'));
  const ret = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grade[r][c] = ch; };
  const bloq = new Set(), cel = (c, r) => c + ',' + r, bloquear = (c, r, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bloq.add(cel(c + i, r + j)); };
  const hsh = (x, y, k) => (((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0) % 1000;

  // ---- terreno: vem do spec (trilhas, matos, agua e bordas); a agua e pintada depois, para nunca cobrir a borda ----
  const agua = new Set();
  const aguaRet = (c0, r0, c1, r1) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) agua.add(cel(c, r)); [[c0, r0], [c1, r0], [c0, r1], [c1, r1]].forEach(([c, r]) => agua.delete(cel(c, r))); };
  const mato = (c0, r0, c1, r1) => { ret(c0, r0, c1, r1, '"'); [[c0, r0], [c1, r0], [c0, r1], [c1, r1]].forEach(([c, r]) => { grade[r][c] = '.'; }); };
  spec.terreno({ grade, ret, mato, aguaRet, cel, W, H });
  for (const k of agua) { const [c, r] = k.split(',').map(Number); grade[r][c] = '~'; }
  const predios = spec.predios || []; predios.forEach(([, c, r, w, h]) => bloquear(c, r, w, h)); // a base inteira bloqueia (e as arvores sorteadas ficam longe)
  const DENS = spec.densidade == null ? 1 : spec.densidade;

  // ---- arvores geradas em grade com sorteio: sempre longe de trilha, clareira, agua e mato alto (a copa nunca cai na trilha) ----
  const arvB = [], arvD = [];
  const perigo = (ch, tolMato) => ',~^vP<>LG'.includes(ch) || (!tolMato && ch === '"');
  const margemLivre = (c0, r0, c1, r1, tolMato = false) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { if (c < 0 || r < 0 || c >= W || r >= H) return false; if (perigo(grade[r][c], tolMato)) return false; } return true; };
  const tentar = (c, r, sem, pB, pD) => { // sorteia uma arvore B (2x2) ou D (2x1, copa 2 tiles acima) perto de (c, r); so entra se a base e a margem estiverem livres
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
  for (let r = 2; r < H - 3; r += 2) for (let c = 2; c < W - 3; c += 2) tentar(c, r, 60, 640 * DENS, 840 * DENS);   // 1a passada
  for (let r = 3; r < H - 3; r += 2) for (let c = 3; c < W - 3; c += 2) tentar(c, r, 63, 560 * DENS, 800 * DENS);   // 2a passada, deslocada: enche os vazios (floresta densa)

  // ---- props: placa, monolito, troncos e sorteio de arbustos, tocos, cogumelos e pedras (so na grama, longe da trilha) ----
  const props = []; const pr = (k, c, r, w = 1) => { props.push([k, c, r, w]); bloquear(c, r, w, 1); };
  if (spec.props) spec.props({ pr, cel, bloquear, grade, W, H });
  if (!spec.semAleatorios) for (let r = 3; r < H - 4; r++) for (let c = 3; c < W - 4; c++) { // arbustos, tocos, cogumelos e pedras sorteados (a vila liga semAleatorios)
    if (grade[r][c] !== '.' || bloq.has(cel(c, r)) || !margemLivre(c - 1, r - 1, c + 1, r + 1)) continue;
    const p = hsh(c, r, 70); if (p >= 95) continue;
    pr(p < 38 ? 'arbusto' : p < 58 ? 'toco' : p < 76 ? 'cogumelo' : 'pedra', c, r);
  }
  const mapa = grade.map((l) => l.join(''));

  // ---- imagens ----
  const IM = {}; let pronto = false, chao = null; const brilhos = [], tufos = [];
  const arqs = Object.assign({ arvore_b: 'arvore_b.png', arvore_d: 'arvore_d.png', placa: 'prop_placa.png', pedra: 'prop_pedra.png', tronco_reto: 'prop_tronco_reto.png', arbusto: 'arbusto.png', toco: 'toco.png', cogumelo: 'cogumelo.png', monolito: 'monolito.png', chao_suave: 'chao_suave.png', agua_grama: 'agua_grama.png' }, spec.imagens || {}); // spec.imagens: imagens extras (prédios e props de vila)
  const carregar = (k) => new Promise((ok) => { const im = new Image(); im.onload = () => { IM[k] = im; ok(); }; im.onerror = ok; im.src = D + arqs[k]; });
  const tabela = (meta) => { const t = {}; meta.tileset_data.tiles.forEach((x) => { t[x.corners.NW[0] + x.corners.NE[0] + x.corners.SW[0] + x.corners.SE[0]] = x.bounding_box; }); return t; };
  // mato alto escuro (tufos soltos em 2 quadros de balanco), paletas analogas mais fechadas que as da Rota 1
  const PALT = [{ h: '#6f9a3a', l: '#2f6a2a', m: '#1a5a28', d: '#063d24', o: '#00261c' }, { h: '#9aa83a', l: '#5a7a2a', m: '#2f6a2a', d: '#0b4a2a', o: '#00261c' }, { h: '#5fb08a', l: '#2a7a58', m: '#16634a', d: '#0b4a3a', o: '#00261c' }, { h: '#7a9a3a', l: '#2a5a28', m: '#14481f', d: '#04301c', o: '#00261c' }];
  const FORMAS = { g: [['....h....', '..h.m.h..', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..'], ['.....h...', '...h.m.h.', '..lm.m.m.', '.lmm.mmm.', '.lmmmmmmm', 'dmmmdmmmd', '.ddddddd.', '..ooooo..']],
    p: [['...h...', '.h.m.h.', '.lmmmm.', 'dmmdmmd', '.ooooo.'], ['....h..', '.h.m..h', '.lmmmm.', 'dmmdmmd', '.ooooo.']] };
  function tufo(forma, f, v) {
    const L = FORMAS[forma][f], c = document.createElement('canvas'); c.width = L[0].length; c.height = L.length + 1; const g = c.getContext('2d');
    g.fillStyle = 'rgba(10,50,25,.18)'; g.fillRect(1, L.length - 2, L[0].length - 2, 2);
    L.forEach((l, j) => [...l].forEach((ch, i) => { if (ch === '.') return; g.fillStyle = PALT[v][ch]; g.fillRect(i, j, 1, 1); }));
    return c;
  }
  let TUFO = null;
  Promise.all([Promise.all(Object.keys(arqs).map(carregar)).then(() => { for (const [k, modo] of Object.entries(spec.recolorir || {})) { const im = IM[k]; if (!im) continue; const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), p = d.data; if (modo === 'rb') for (let i = 0; i < p.length; i += 4) { const r = p[i]; p[i] = p[i + 2]; p[i + 2] = r; } x.putImageData(d, 0, 0); IM[k] = c; } }), fetch(D + 'chao_grama_caminho.json').then((r) => r.json()), fetch(D + 'agua_grama.json').then((r) => r.json())]).then(([, mc, ma]) => {
    TUFO = { g: PALT.map((_, v) => [tufo('g', 0, v), tufo('g', 1, v)]), p: PALT.map((_, v) => [tufo('p', 0, v), tufo('p', 1, v)]) };
    const tc = tabela(mc), ta = tabela(ma), c = document.createElement('canvas'); c.width = W * T; c.height = H * T; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const cl = (x, y) => [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
    const vert = (f) => (vx, vy) => [[vx - 1, vy - 1], [vx, vy - 1], [vx - 1, vy], [vx, vy]].some(([x, y]) => { const [a, b] = cl(x, y); return f(a, b); });
    const vA = vert((x, y) => agua.has(cel(x, y))), vS = vert((x, y) => ',^v<>LG'.includes(mapa[y][x])), k = (v) => (v ? 'l' : 'u');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ka = k(vA(x, y)) + k(vA(x + 1, y)) + k(vA(x, y + 1)) + k(vA(x + 1, y + 1));
      if (ka === 'llll') brilhos.push([x, y]);
      if (ka !== 'uuuu') { const b = ta[ka]; g.drawImage(IM.agua_grama, b.x, b.y, 16, 16, x * T, y * T, 16, 16); continue; }
      const kc = k(vS(x, y)) + k(vS(x + 1, y)) + k(vS(x, y + 1)) + k(vS(x + 1, y + 1)), b = tc[kc] || tc.uuuu; g.drawImage(IM.chao_suave, b.x, b.y, 16, 16, x * T, y * T, 16, 16);
    }
    // escurece o chao: areia (trilha) vira terra suja e a grama fica mais fechada; a agua escurece pouco
    { const im = g.getImageData(0, 0, W * T, H * T), d = im.data;
      const TI = spec.tinta || { trilha: [0.72, 0.67, 0.6], agua: [0.82, 0.85, 0.9], grama: [0.72, 0.8, 0.74] }; // multiplicadores de r, g, b por tipo de chao
      for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], b = d[i + 2]; if (!d[i + 3]) continue;
        if (r > 190 && r - b > 45) { d[i] = r * TI.trilha[0]; d[i + 1] = gg * TI.trilha[1]; d[i + 2] = b * TI.trilha[2]; }
        else if (b > r + 20 && b > gg) { d[i] = r * TI.agua[0]; d[i + 1] = gg * TI.agua[1]; d[i + 2] = b * TI.agua[2]; }
        else { d[i] = r * TI.grama[0]; d[i + 1] = gg * TI.grama[1]; d[i + 2] = b * TI.grama[2]; } }
      g.putImageData(im, 0, 0); }
    // textura suja: pontinhos analogos na grama (mais densos que na Rota 1) e na trilha (terra escura, folhas e pedrinhas)
    const GRAMA = ['#2c5f35', '#356d3e', '#27562f', '#7bb868', '#a6bd70', '#4a7030'], TERRA = ['#6b5336', '#7d6240', '#5a452c', '#8f7650', '#4a3a26'];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = mapa[y][x];
      if (ch === ',') { if (hsh(x, y, 80) > 700) continue; const n = 1 + (hsh(x, y, 81) > 500 ? 1 : 0) + (hsh(x, y, 82) > 850 ? 1 : 0);
        for (let i = 0; i < n; i++) { g.fillStyle = TERRA[hsh(x, y, 83 + i) % TERRA.length]; const px = x * T + 1 + hsh(x, y, 86 + i) % 14, py = y * T + 1 + hsh(x, y, 89 + i) % 14; g.fillRect(px, py, 1, 1); if (hsh(x, y, 92 + i) > 820) g.fillRect(px + 1, py, 1, 1); }
        if (hsh(x, y, 95) > 940) { g.fillStyle = '#8a8478'; const px = x * T + 2 + hsh(x, y, 96) % 11, py = y * T + 2 + hsh(x, y, 97) % 11; g.fillRect(px, py, 2, 1); g.fillStyle = '#5a5648'; g.fillRect(px, py + 1, 2, 1); } // pedrinha
        continue; }
      if (ch !== '.' || bloq.has(cel(x, y))) continue;
      if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => !vA(x + a, y + b) && !vS(x + a, y + b))) continue;
      if (hsh(x, y, 100) > 880) continue; const n = 2 + (hsh(x, y, 101) > 450 ? 1 : 0) + (hsh(x, y, 102) > 700 ? 1 : 0) + (hsh(x, y, 103) > 880 ? 1 : 0);
      for (let i = 0; i < n; i++) { g.fillStyle = GRAMA[hsh(x, y, 104 + i) % GRAMA.length]; const px = x * T + 1 + hsh(x, y, 108 + i) % 14, py = y * T + 1 + hsh(x, y, 112 + i) % 14; g.fillRect(px, py, 1, 1); if (hsh(x, y, 116 + i) > 600) g.fillRect(px + 1, py, 1, 1); if (hsh(x, y, 120 + i) > 880) g.fillRect(px, py - 1, 1, 1); }
    }
    // posicoes dos tufos de mato alto (favo de mel ralo, bordas irregulares, zona segura de 10 px em volta da trilha)
    const ehMato = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H && mapa[cy][cx] === '"';
    const livreTufo = (x, y) => { const cx0 = Math.floor(x / T), cy0 = Math.floor(y / T); for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const cx = cx0 + i, cy = cy0 + j; if (cx < 0 || cy < 0 || cx >= W || cy >= H) return false; const ch = mapa[cy][cx], dx = Math.max(cx * T - (x + 5), (x - 5) - (cx + 1) * T, 0), dy = Math.max(cy * T - y, (y - 8) - (cy + 1) * T, 0), d = Math.hypot(dx, dy); if (',^v<>LG'.includes(ch) && d < 10) return false; if (ch !== '.' && ch !== '"' && d < 1) return false; if (bloq.has(cel(cx, cy)) && d < 1) return false; } return true; };
    for (let gy = 0; gy < H * 2; gy++) for (let gx = 0; gx < W * 1.7; gx++) {
      const x = gx * 10 + (gy % 2) * 5 + (hsh(gx, gy, 20) % 5) - 2, y = gy * 8 + (hsh(gx, gy, 21) % 4), cx = Math.floor(x / T), cy = Math.floor(y / T);
      if (ehMato(cx, cy)) { const borda = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a2, b2]) => !ehMato(cx + a2, cy + b2)); if (hsh(gx, gy, 22) < (borda ? 400 : 580) && livreTufo(x, y)) tufos.push([x, y, borda ? 'p' : 'g', hsh(gx, gy, 23)]); }
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => ehMato(cx + a2, cy + b2)) && hsh(gx, gy, 24) < 120 && livreTufo(x, y)) tufos.push([x, y, 'p', hsh(gx, gy, 25)]);
    }
    tufos.sort((p, q) => p[1] - q[1]);
    chao = c; pronto = true;
  });

  // ---- desenho ----
  const SETA = { v: [0, 1], '^': [0, -1], '<': [-1, 0], '>': [1, 0] };
  function desenhar(g, cx, cy, extras) {
    g.fillStyle = '#5f8f55'; g.fillRect(0, 0, RES[0], RES[1]);
    if (!pronto) return;
    const t = performance.now();
    g.save(); g.translate(-cx, -cy); g.drawImage(chao, 0, 0);
    for (const [x, y, f, h] of tufos) { if (y < cy - 12 || y > cy + RES[1] + 12) continue; const im = TUFO[f][h % 4][((t / 420) + h * 0.013) % 2 < 1 ? 0 : 1]; g.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height + 3)); }
    for (const [x, y] of brilhos) { if (y * T < cy - 16 || y * T > cy + RES[1]) continue; const h = (x * 7 + y * 13) % 16, o = (x * 5 + y * 11) % 3;
      g.fillStyle = 'rgba(190,225,250,.5)'; g.fillRect(x * T + ((h + t / 160) % 16 | 0) % 14, y * T + 3 + o * 5, 4, 1); g.fillRect(x * T + ((h * 3 + 9 + t / 200) % 16 | 0) % 14, y * T + 9 + o * 2, 3, 1);
      g.fillStyle = 'rgba(20,50,100,.3)'; g.fillRect(x * T + ((h + 5 + t / 240) % 16 | 0) % 14, y * T + 6 + o * 3, 5, 1); }
    const objs = extras.slice(), img = (k, x, y) => g.drawImage(IM[k], Math.round(x), Math.round(y)), visivel = (y) => y > cy - 60 && y < cy + RES[1] + 90;
    for (let c = 0; c < W; c += 2) { if (!(spec.vaoNorte || []).includes(c)) objs.push({ y: 32, f: () => img('arvore_b', c * T, 32 - 40) }); if (!(spec.vaoSul || []).includes(c)) objs.push({ y: H * T, f: () => img('arvore_b', c * T, H * T - 40) }); }
    for (let r = 2; r < H - 2; r += 2) { if (!(spec.vaoOeste || []).includes(r)) objs.push({ y: (r + 2) * T, f: () => img('arvore_b', 0, (r + 2) * T - 40) }); if (!(spec.vaoLeste || []).includes(r)) objs.push({ y: (r + 2) * T, f: () => img('arvore_b', (W - 2) * T, (r + 2) * T - 40) }); }
    arvB.forEach(([c, r]) => objs.push({ y: (r + 2) * T, f: () => img('arvore_b', c * T, (r + 2) * T - 40) }));
    arvD.forEach(([c, r]) => objs.push({ y: (r + 1) * T, f: () => img('arvore_d', c * T, (r + 1) * T - 48) }));
    predios.forEach(([k, c, r, w, h]) => objs.push({ y: (r + h) * T, f: () => { const im = IM[k]; if (im) g.drawImage(im, Math.round((c + w / 2) * T - im.width / 2), Math.round((r + h) * T - im.height + 1)); } }));
    props.forEach(([k, c, r, w]) => objs.push({ y: (r + 1) * T, f: () => { const im = IM[k]; if (im) g.drawImage(im, Math.round((c + w / 2) * T - im.width / 2), (r + 1) * T - im.height); } }));
    mapa.forEach((l, r) => [...l].forEach((ch, c) => { if (!SETA[ch]) return; objs.push({ y: -1, f: () => {
      const [dx, dy] = SETA[ch], o = Math.sin(performance.now() / 180) * 2, x = c * T + 8 + dx * o, y = r * T + 8 + dy * o;
      const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
      tri(6, 4, '#1b1020'); tri(4, 2.5, '#ffd35a'); } }); }));
    objs.filter((o) => visivel(o.y)).sort((a, b) => a.y - b.y).forEach((o) => o.f());
    for (let k = 0; k < (spec.vagalumes || 0); k++) { // vagalumes: pontos de luz que flutuam e piscam
      const x = ((hsh(k, 1, 5) / 1000) * W * T) + Math.sin(t / 1700 + k) * 7, y = ((hsh(k, 2, 5) / 1000) * H * T) + Math.cos(t / 1300 + k * 1.7) * 6;
      if (y < cy - 6 || y > cy + RES[1] + 6) continue;
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(t / 380 + k * 2.3)); g.fillStyle = 'rgba(190,230,255,' + a.toFixed(2) + ')'; g.fillRect(Math.round(x), Math.round(y), 2, 2);
      g.fillStyle = 'rgba(120,160,255,' + (a * 0.35).toFixed(2) + ')'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 4, 4);
    }
    g.restore();
    if (spec.camada) { g.fillStyle = spec.camada; g.fillRect(0, 0, RES[0], RES[1]); } // camada de cor por cima de tudo (ex.: roxa de noite magica)
  }

  const out = { desenhar, RES,
    area: { nome: spec.nome, largura: W, bioma: spec.bioma || 'floresta', elemento: spec.elemento || null, soEvo: spec.soEvo, nvMais: spec.nvMais, v2: true, T, res: RES, mapa, bloq, desenhar, npcs: spec.npcs || [], portais: spec.portais || {}, ginasios: spec.ginasios || null } };
  if (spec.id) (window.PixmonAreasExtra = window.PixmonAreasExtra || {})[spec.id] = out.area;
  return out;
  }
  window.PixmonBase = { criar };
})();
