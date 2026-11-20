// Vila nova (identidade visual v2): tiles de 16 px, câmera reta, sem sombras. Mapa de 40 x 60 tiles, mostrado num canvas de 240 x 427.
// Usado pelo mundo.js: PixmonMundo2.area é a definição da área (mapa em texto + bloqueios) e PixmonMundo2.desenhar(g, cx, cy, extras) pinta tudo.
// Legenda do mapa: . grama · , caminho · ~ água · P ponte · T árvore · L porta do Mercado (abre a loja) · ^ < > saídas
(function () {
  const T = 16, W = 40, H = 60, RES = [240, 427], D = 'ui/mundo/v2/';
  const grade = Array.from({ length: H }, () => Array(W).fill('.'));
  const ret = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grade[r][c] = ch; };
  const bloq = new Set(), cel = (c, r) => c + ',' + r, bloquear = (c, r, w = 1, h = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bloq.add(cel(c + i, r + j)); };

  // ---- terreno: norte (Ginásio) | rio | sul (vila: praça com a loja, 4 casas) ----
  const agua = new Set(); for (let r = 19; r <= 20; r++) for (let c = 0; c <= 39; c++) agua.add(cel(c, r)); // rio de ponta a ponta, atravessando o muro de mata (a ponte fica por cima)
  ret(6, 0, 7, 14, ','); ret(6, 13, 33, 14, ',');                     // saída norte e a rua do norte
  ret(19, 9, 20, 28, ',');                                            // rua do Ginásio, ponte e avenida até a praça
  ret(12, 29, 27, 46, ',');                                           // praça
  ret(0, 34, 39, 35, ','); ret(3, 47, 36, 48, ',');                   // ruas de leste a oeste (a 1ª leva às saídas)
  ret(6, 32, 7, 33, ','); ret(32, 32, 33, 33, ','); ret(6, 45, 7, 46, ','); ret(32, 45, 33, 46, ','); // caminhos das casas
  for (const k of agua) { const [c, r] = k.split(',').map(Number); grade[r][c] = '~'; }
  ret(19, 18, 20, 21, 'P');                                           // ponte
  ret(15, 33, 16, 33, 'L');                                           // porta da loja
  // muro de mata (2 tiles) com 3 saídas: norte, oeste e leste
  ret(0, 0, 39, 1, 'T'); ret(0, 58, 39, 59, 'T'); ret(0, 0, 1, 59, 'T'); ret(38, 0, 39, 59, 'T');
  ret(6, 0, 7, 1, ','); ret(0, 34, 1, 35, ','); ret(38, 34, 39, 35, ',');
  ret(0, 18, 1, 21, '.'); ret(38, 18, 39, 21, '.'); for (const k of agua) { const [c, r] = k.split(',').map(Number); grade[r][c] = '~'; } ret(19, 18, 20, 21, 'P'); // abre o muro para o rio passar; a ponte volta por cima da água
  grade[0][6] = grade[0][7] = '^'; grade[34][0] = grade[35][0] = '<'; grade[34][39] = grade[35][39] = '>';
  grade[9][19] = grade[9][20] = 'G'; // W7: porta do Ginásio (líder Dan), no fim da rua do Ginásio

  // ---- construções (a base inteira bloqueia): [imagem, coluna, linha, largura, altura] em tiles ----
  const predios = [
    ['ginasio_f', 16, 4, 8, 5], ['loja_f', 13, 30, 6, 3], ['fonte', 18, 38, 4, 3],
    ['casa_1_f', 4, 29, 6, 3], ['casa_3_f', 30, 29, 6, 3], ['casa_2_f', 4, 42, 6, 3], ['casa_1_f', 30, 42, 6, 3], ['casa_3_f', 30, 10, 6, 3],
  ];
  predios.forEach(([, c, r, w, h]) => bloquear(c, r, w, h));
  // árvores: B (mata) em blocos de 2x2 e D (vila) em blocos de 2x1, a base na linha r
  const arvB = [[3, 4], [35, 4], [3, 16], [35, 16], [3, 23], [35, 23], [8, 50], [29, 50], [22, 53]];
  const arvD = [[11, 6], [26, 6], [10, 17], [27, 17], [14, 24], [25, 24], [3, 38], [35, 38], [10, 52], [28, 52], [18, 55], [3, 53], [35, 53]];
  arvB.forEach(([c, r]) => { ret(c, r, c + 1, r + 1, 'T'); });
  arvD.forEach(([c, r]) => bloquear(c, r, 2, 1));
  // props (célula, largura em células): postes, placa, correios, bancos, cercas, canteiros
  const props = [];
  const pr = (k, c, r, w = 1) => { props.push([k, c, r, w]); bloquear(c, r, w, 1); };
  [[12, 31], [27, 31], [12, 38], [27, 38], [12, 44], [27, 44], [18, 28], [21, 28], [18, 22], [21, 22], [18, 9], [21, 9], [18, 16], [21, 16]].forEach(([c, r]) => pr('poste', c, r));
  pr('placa', 21, 11); [[10, 32], [29, 32], [10, 45], [29, 45], [36, 13]].forEach(([c, r]) => pr('correio_manual', c, r));
  pr('banco_reto', 14, 40); pr('banco_reto', 25, 40); pr('banco_reto', 16, 42); pr('banco_reto', 22, 42);
  [[13, 37], [25, 37], [13, 43], [25, 43]].forEach(([c, r], i) => pr(i % 2 ? 'horta' : 'flores', c, r, 2)); // canteiros da praça
  // jardins das 3 primeiras casas: canteiros atrás da cerca, com o portão aberto no caminho
  [[4, 32, 'horta'], [8, 32, 'flores'], [30, 32, 'flores'], [34, 32, 'horta'], [4, 45, 'flores'], [8, 45, 'horta']].forEach(([c, r, k]) => pr(k, c, r, 2));
  [[3, 4, 5, 8, 9, 10], [29, 30, 31, 34, 35, 36]].forEach((cs) => cs.forEach((c) => pr('cerca_manual', c, 33)));
  [3, 4, 5, 8, 9, 10].forEach((c) => pr('cerca_manual', c, 46));
  // as árvores de bloco ocupam 'T' no mapa; as D, os prédios e os props bloqueiam por 'bloq'
  const mapa = grade.map((l) => l.join(''));

  // ---- imagens ----
  const IM = {}; let pronto = false, chao = null; const brilhos = []; // brilhos: tiles de água inteiros, onde passam as ondinhas
  const arqs = { arvore_b: 'arvore_b.png', arvore_d: 'arvore_d.png', casa_a: 'casa_a.png', casa_c: 'casa_c.png', mercado_a: 'mercado_a.png', ginasio_a: 'ginasio_a.png', ginasio_f: 'ginasio_f.png', loja_f: 'loja_f.png', fonte: 'fonte.png', horta: 'horta.png', flores: 'flores.png', ponte_v: 'ponte_v.png', casa_1_f: 'casa_1_f.png', casa_2_f: 'casa_2_f.png', casa_3_f: 'casa_3_f.png', ponte_f: 'ponte_f.png', poste: 'prop_poste.png', placa: 'prop_placa.png', correio_manual: 'prop_correio_manual.png',
    banco_reto: 'prop_banco_reto.png', cerca_manual: 'prop_cerca_manual.png', tronco_reto: 'prop_tronco_reto.png', pedra: 'prop_pedra.png', ponte_cima: 'ponte_cima.png', ponte_baixo: 'ponte_baixo.png', chao_suave: 'chao_suave.png', agua_grama: 'agua_grama.png' };
  const carregar = (k) => new Promise((ok) => { const im = new Image(); im.onload = () => { IM[k] = im; ok(); }; im.onerror = ok; im.src = D + arqs[k]; });
  const tabela = (meta) => { const t = {}; meta.tileset_data.tiles.forEach((x) => { t[x.corners.NW[0] + x.corners.NE[0] + x.corners.SW[0] + x.corners.SE[0]] = x.bounding_box; }); return t; };
  Promise.all([Promise.all(Object.keys(arqs).map(carregar)), fetch(D + 'chao_grama_caminho.json').then((r) => r.json()), fetch(D + 'agua_grama.json').then((r) => r.json())]).then(([, mc, ma]) => {
    const tc = tabela(mc), ta = tabela(ma), c = document.createElement('canvas'); c.width = W * T; c.height = H * T; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const cl = (x, y) => [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
    const vert = (f) => (vx, vy) => [[vx - 1, vy - 1], [vx, vy - 1], [vx - 1, vy], [vx, vy]].some(([x, y]) => { const [a, b] = cl(x, y); return f(a, b); });
    const vA = vert((x, y) => agua.has(cel(x, y))), vS = vert((x, y) => ',L^<>P'.includes(mapa[y][x])), k = (v) => (v ? 'l' : 'u');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ka = k(vA(x, y)) + k(vA(x + 1, y)) + k(vA(x, y + 1)) + k(vA(x + 1, y + 1));
      if (ka === 'llll') brilhos.push([x, y]);
      if (ka !== 'uuuu') { const b = ta[ka]; g.drawImage(IM.agua_grama, b.x, b.y, 16, 16, x * T, y * T, 16, 16); continue; }
      const kc = k(vS(x, y)) + k(vS(x + 1, y)) + k(vS(x, y + 1)) + k(vS(x + 1, y + 1)), b = tc[kc] || tc.uuuu; g.drawImage(IM.chao_suave, b.x, b.y, 16, 16, x * T, y * T, 16, 16);
    }
    // florzinhas: pontinhos de 1-2 px espalhados só na grama lisa (sem caminho, água, prédios ou árvores), nas cores do cenário
    const FLORES = ['#f0e9ca', '#f0e9ca', '#ffc80e', '#de595a', '#a79fc0'], hsh = (x, y, k) => (((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0) % 1000;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      if (mapa[y][x] !== '.' || bloq.has(cel(x, y)) || hsh(x, y, 0) > 260) continue;
      const grama = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => !vA(x + a, y + b) && !vS(x + a, y + b)); if (!grama) continue;
      const n = 1 + (hsh(x, y, 1) > 650 ? 1 : 0);
      for (let i = 0; i < n; i++) { const px = x * T + 2 + hsh(x, y, 2 + i) % 12, py = y * T + 2 + hsh(x, y, 5 + i) % 12; g.fillStyle = FLORES[hsh(x, y, 8 + i) % FLORES.length]; g.fillRect(px, py, 1, 1); if (hsh(x, y, 11 + i) > 700) g.fillRect(px + 1, py, 1, 1); }
    }
    chao = c; pronto = true;
  });

  // ---- desenho ----
  const SETA = { '^': [0, -1], v: [0, 1], '<': [-1, 0], '>': [1, 0] };
  function desenhar(g, cx, cy, extras) {
    g.fillStyle = '#9fd68a'; g.fillRect(0, 0, RES[0], RES[1]);
    if (!pronto) return;
    g.save(); g.translate(-cx, -cy); g.drawImage(chao, 0, 0);
    { const t = performance.now(); // ondinhas: traços claros e escuros deslizando devagar na água, defasados por tile
      for (const [x, y] of brilhos) { if (y * T < cy - 16 || y * T > cy + RES[1]) continue; const h = (x * 7 + y * 13) % 16, o = (x * 5 + y * 11) % 3;
        g.fillStyle = 'rgba(190,225,250,.55)'; g.fillRect(x * T + ((h + t / 160) % 16 | 0) % 14, y * T + 3 + o * 5, 4, 1); g.fillRect(x * T + ((h * 3 + 9 + t / 200) % 16 | 0) % 14, y * T + 9 + o * 2, 3, 1);
        g.fillStyle = 'rgba(30,70,140,.3)'; g.fillRect(x * T + ((h + 5 + t / 240) % 16 | 0) % 14, y * T + 6 + o * 3, 5, 1); } }
    const objs = extras.slice(), img = (k, x, y) => g.drawImage(IM[k], Math.round(x), Math.round(y));
    const visivel = (y) => y > cy - 60 && y < cy + RES[1] + 90;
    for (let c = 0; c < W; c += 2) { if (c !== 6) { objs.push({ y: 32, f: () => img('arvore_b', c * T, 32 - 40) }); objs.push({ y: H * T, f: () => img('arvore_b', c * T, H * T - 40) }); } }
    for (let r = 2; r < H - 2; r += 2) { if (![18, 20, 34, 36].includes(r)) { objs.push({ y: (r + 2) * T, f: () => img('arvore_b', 0, (r + 2) * T - 40) }); objs.push({ y: (r + 2) * T, f: () => img('arvore_b', (W - 2) * T, (r + 2) * T - 40) }); } }
    arvB.forEach(([c, r]) => objs.push({ y: (r + 2) * T, f: () => img('arvore_b', c * T, (r + 2) * T - 40) }));
    arvD.forEach(([c, r]) => objs.push({ y: (r + 1) * T, f: () => img('arvore_d', c * T, (r + 1) * T - 48) }));
    predios.forEach(([k, c, r, w, h]) => objs.push({ y: (r + h) * T, f: () => { const x0 = (c + w / 2) * T - IM[k].width / 2, y0 = (r + h) * T - IM[k].height + 1; img(k, x0, y0);
      if (k === 'fonte') { const t = performance.now(); g.fillStyle = 'rgba(190,225,250,.8)'; for (let i = 0; i < 6; i++) g.fillRect(Math.round(x0 + 8 + ((i * 9 + t / 140) % 46)), Math.round(y0 + 33 + (i % 3) * 3), 4, 1); g.fillStyle = 'rgba(160,200,230,.9)'; const q = (t / 120) % 4 | 0; for (const xx of [16, 47]) g.fillRect(x0 + xx, y0 + 22 + q * 2, 1, 2); } } })); // base alinhada embaixo; a fonte ganha água mexendo
    props.forEach(([k, c, r, w]) => objs.push({ y: (r + 1) * T, f: () => { const im = IM[k]; if (im) g.drawImage(im, Math.round((c + w / 2) * T - im.width / 2), (r + 1) * T - im.height); } }));
    objs.push({ y: 18 * T, f: () => img('ponte_v', 19 * T, 18 * T) });
    mapa.forEach((l, r) => [...l].forEach((ch, c) => { if (!SETA[ch]) return; objs.push({ y: -1, f: () => { // seta amarela pulsando nas saídas
      const [dx, dy] = SETA[ch], o = Math.sin(performance.now() / 180) * 2, x = c * T + 8 + dx * o, y = r * T + 8 + dy * o;
      const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
      tri(6, 4, '#1b1020'); tri(4, 2.5, '#ffd35a'); } }); }));
    objs.filter((o) => visivel(o.y)).sort((a, b) => a.y - b.y).forEach((o) => o.f());
    g.restore();
  }

  window.PixmonMundo2 = {
    desenhar, RES,
    area: { nome: 'Vila', largura: W, bioma: 'vila', elemento: null, v2: true, T, res: RES, mapa, bloq, desenhar,
      npcs: [{ id: 'tomas', nome: 'Tomy', pele: '#f6d3bb', matiz: 270, c: 19, r: 24, dir: 'baixo', vis: 3, cor: '#5a3a20', camisa: '#3a9a4a', cab: '#ebebf3' }, { id: 'ivo', nome: 'Ivo', c: 20, r: 44, vis: 0, pele: '#f6d3bb', cor: '#34231b', cab: '#3a2a1a', camisa: '#c0392b', dir: 'baixo', paradas: [{ c: 20, r: 44, espera: [9000, 15000] }, { c: 15, r: 34, espera: [4000, 6000] }, { c: 7, r: 45, espera: [4000, 6000] }] }, { id: 'luki', nome: 'Luki', c: 27, r: 8, vis: 0, pele: '#c98a5e', cor: '#2f4a6a', cab: '#1b1020', camisa: '#f0b830', dir: 'baixo', paradas: [{ c: 27, r: 8, espera: [8000, 14000] }, { c: 32, r: 3, espera: [3000, 5000] }, { c: 33, r: 8, espera: [3000, 5000] }] }, { id: 'jony', nome: 'Jony', c: 4, r: 55, vis: 0, pele: '#8a5a3a', cor: '#3a5a3a', cab: '#b8501f', camisa: '#7a4ab8', dir: 'baixo', paradas: [{ c: 4, r: 55, espera: [10000, 16000] }, { c: 7, r: 56, espera: [5000, 8000] }, { c: 5, r: 51, espera: [4000, 6000] }] }],
      ginasios: { G: 'dan' },
      portais: { '^': { area: 'rota1', c: 13, r: 61 }, '<': { area: 'lago', c: 33, r: 26 }, '>': { area: 'fazenda', c: 2, r: 22 } } },
  };
})();
