// Mundo andável (Fase A): mapa em tiles de 32 px, câmera que segue o jogador, colisão, mato alto com encontros e portais entre áreas.
// Separado de battle.js e arena.js: a batalha só é avisada por cb.encontro() e devolve o controle com PixmonMundo.retomar().
(function () {
  let W = 360, H = 640, T = 32; const PASSO = 3; // tela lógica, tamanho do tile (a Vila v2 usa 240 x 427 e tiles de 16), px por quadro ao andar num tile de 32
  const CHANCE = 0.12; // chance de encontro por passo no mato alto
  const SALVO = 'pixmon-mundo';

  // Legenda do mapa (um caractere por tile de 32 px):
  //   . grama · , caminho · " mato alto (encontros) · ~ água · n água com vitória-régia · P píer (anda por cima da água) · j junco (enfeite, não bloqueia)
  //   T árvore (tipo pela lista da área) · R pedra · b arbusto · W poço · m cogumelo · k toco · e espantalho · L porta da loja
  //   ^ v < > portais (a abertura pode ter 2 tiles: o destino mantém o deslocamento dentro da abertura)
  // objs: construções e enfeites com sprite. c, r = canto de cima/esquerda da base (tiles que bloqueiam); l x a = tamanho da base;
  //   s = escala da sprite; deco = não bloqueia; chao = desenhado por baixo de tudo (píer); nome = placa em cima.
  const AREAS = {
    vila: {
      nome: 'Vila', largura: 20, bioma: 'vila', elemento: null,
      mapa: [
        'TTTTTTTTT^^TTTTTTTTT',
        'T........,,........T',
        'T........,,........T',
        'T........,,........T',
        'T.L,,,,,,,,,,,,,,..T',
        'T........,,.....,..T',
        'T........,,.....,..T',
        'T........,,.....,..T',
        'T........,,.....,..T',
        '<,,,,,,,,,,,,,,,,,,>',
        '<,,,,,,,,,,,,,,,,,,>',
        'T........,,........T',
        'T....W...,,........T',
        'T........,,........T',
        'T..,,,,,,,,,,,,,...T',
        'T..,...........,...T',
        'T..,...........,...T',
        'T..,...........,...T',
        'T.......~~~~~......T',
        'T......~~~n~~~..b..T',
        'T......~~~~~n~.....T',
        'T.R.....~~~~~......T',
        'T..................T',
        'TTTTTTTTTTTTTTTTTTTT',
      ],
      objs: [
        { k: 'casa', c: 2, r: 2, l: 3, a: 2, s: 0.9, nome: 'MERCADO' }, { k: 'casa_azul', c: 12, r: 2, l: 3, a: 2, s: 0.85 },
        { k: 'ginasio', c: 2, r: 6, l: 4, a: 3, s: 0.85, nome: 'GINÁSIO' }, { k: 'cabana', c: 12, r: 6, l: 3, a: 2, s: 0.85 },
        { k: 'casa', c: 12, r: 11, l: 3, a: 2, s: 0.9 },
      ],
      npcs: [{ id: 'tomas', matiz: 270, c: 6, r: 8, dir: 'dir', vis: 4, cor: '#2f7a3a', cab: '#1b1020' }],
      portais: { '^': { area: 'rota1', c: 13, r: 61 }, '<': { area: 'lago', c: 18, r: 9 }, '>': { area: 'fazenda', c: 1, r: 9 } },
    },
    rota1: {
      nome: 'Rota 1', largura: 14, bioma: 'campo', elemento: null,
      mapa: [
        'TTTTTTTT^^TTTT',
        'T"""""......RT',
        'T"""""..,,..bT',
        'T"""""..,,...T',
        'T.......,,..""',
        'T..T....,,..""',
        'T.......,,..""',
        'T..""",,,,...T',
        'T..""",,.....T',
        'T..""",,.bb..T',
        'T.....,,.....T',
        'T..~~.,,..T..T',
        'T..~~.,,,,...T',
        'T.....,,.,...T',
        'T.""""..,,..RT',
        'T.""""..,,""..',
        'T.""""..,,""..',
        'T.......,,""..',
        'T..b....,,....',
        'T.......,,""""',
        'T..~~~..,,..bb',
        'T..~~~..,,....',
        'T.......,,.TT.',
        'T.""""..,,....',
        'T.""""..,,....',
        'T.""""..,,..""',
        'T.......,,..""',
        'T.R.....,,..""',
        'T.......,,....',
        'T..""...,,....',
        'T..""...,,..b.',
        'T.......,,....',
        'T.......,,....',
        'TTTTTTvvTTTTTT',
      ],
      objs: [],
      npcs: [{ id: 'bruno', matiz: 100, c: 4, r: 4, dir: 'dir', vis: 4, cor: '#4a6a2a', cab: '#2a1a10' }, { id: 'isis', matiz: 200, c: 11, r: 12, dir: 'esq', vis: 3, cor: '#285a9a', cab: '#c8941a' }, { id: 'lucia', matiz: 50, c: 6, r: 22, dir: 'dir', vis: 3, cor: '#e8cc40', cab: '#5a3a20' }],
      portais: { v: { area: 'vila', c: 6, r: 2 }, '^': { area: 'bosque', c: 9, r: 26 } },
    },
    fazenda: {
      nome: 'Fazenda', largura: 20, bioma: 'campo', elemento: 'terra',
      mapa: [
        'TTTTTTTTTTTTTTTTTTTT',
        'T..................T',
        'T..................T',
        'T..................T',
        'T....,,,,,,,,,,....T',
        'T....,........,....T',
        'T....,........,....T',
        'T....,........,....T',
        'T....,........,....T',
        '<,,,,,,,,,,,,,,,...T',
        '<,,,,,,,,,,,,,,,...T',
        'T....,........,....T',
        'T....,........,....T',
        'T.."""........."""bT',
        'T.."""........."""bT',
        'T.."""........."""..',
        'T..................T',
        'T..................T',
        'T.......e..........T',
        'T.."""""....""""...T',
        'T.."""""....""""...T',
        'TTTTTTTTTTTTTTTTTTTT',
      ],
      objs: [
        { k: 'celeiro', c: 1, r: 2, l: 3, a: 2, s: 0.95 }, { k: 'cabana', c: 15, r: 1, l: 3, a: 2, s: 0.85 }, { k: 'moinho', c: 16, r: 5, l: 2, a: 2, s: 0.85 },
        { k: 'plantacao', c: 6, r: 5, l: 3, a: 2, s: 0.75 }, { k: 'plantacao', c: 10, r: 5, l: 3, a: 2, s: 0.75 },
        { k: 'plantacao', c: 6, r: 7, l: 3, a: 2, s: 0.75 }, { k: 'plantacao', c: 10, r: 7, l: 3, a: 2, s: 0.75 },
        { k: 'feno', c: 16, r: 11, l: 2, a: 1, s: 0.8 },
        { k: 'cerca', c: 3, r: 16, l: 2, a: 1, s: 1.6 }, { k: 'cerca', c: 5, r: 16, l: 2, a: 1, s: 1.6 }, { k: 'cerca', c: 7, r: 16, l: 2, a: 1, s: 1.6 },
        { k: 'cerca', c: 11, r: 16, l: 2, a: 1, s: 1.6 }, { k: 'cerca', c: 13, r: 16, l: 2, a: 1, s: 1.6 }, { k: 'cerca', c: 15, r: 16, l: 2, a: 1, s: 1.6 },
      ],
      npcs: [{ id: 'otto', nome: 'Otto', matiz: 30, c: 9, r: 8, dir: 'baixo', vis: 2, cor: '#8a5a2a', cab: '#3a2a1a' }],
      portais: { '<': { area: 'vila', c: 37, r: 34 } },
    },
    lago: {
      nome: 'Lago', largura: 20, bioma: 'lago', elemento: 'agua',
      mapa: [
        'TTTTTTTTTTTTTTTTTTTT',
        'T..j...~~~~~~~~....T',
        'T.....~~~~~~~~~~...T',
        'T....~~~n~~~~~~~~..T',
        'T...~~~~~~~~~n~~~..T',
        'T...~~~~~~P~~~~~~..T',
        'T...~~~n~~P~~~~~...T',
        'T....~~~~~P~~~~~...T',
        'T.....~~~~P~~~~j...T',
        'T"".....j.,,,,,,,,,>',
        'T"".......,,,,,,,,,>',
        'T""".......,.......T',
        'T.........,....b...T',
        'T..b......,........T',
        'T.........,,,,,,...T',
        'T...""".......,....T',
        'T...""".......,....T',
        'T...""".......,....T',
        'T.............,....T',
        'T..~~~.....""".....T',
        'T..~n~j....""".....T',
        'T..~~~.....""".....T',
        'T..................T',
        'TTTTTTTTTTTTTTTTTTTT',
      ],
      objs: [
        { k: 'pier', c: 10, r: 5, l: 1, a: 4, chao: true }, { k: 'barco', c: 13, r: 6, l: 2, a: 1, s: 0.8, deco: true },
        { k: 'casa_azul', c: 15, r: 15, l: 3, a: 2, s: 0.85 },
      ],
      npcs: [{ id: 'vera', nome: 'Bia', matiz: 180, c: 10, r: 5, dir: 'baixo', vis: 3, cor: '#3a8ac8', cab: '#1b1020' }],
      portais: { '>': { area: 'vila', c: 2, r: 34 } },
    },
    bosque: {
      nome: 'Bosque', largura: 20, bioma: 'floresta', elemento: 'ar', arvores: ['escura', 'escura2', 'carvalho3', 'salgueiro', 'luminosa'],
      mapa: [
        'TTTTTTTTTTTTTTTTTTTT',
        'TT"""TTTTTTTTT"""TTT',
        'T"""""..m.....""""TT',
        'T""".....,,,,....""T',
        'TT......,,..,,.....T',
        'TTT..k..,....,..m.TT',
        'TT.....,,....,,....T',
        'T..m...,......,..TTT',
        'T......,......,....T',
        'T......,......,....T',
        'T""""..,......,""""T',
        'T""""..,,,,,,,,""".T',
        'TT..........,......T',
        'TTT..m......,...k..T',
        'TT.....TTT..,.....TT',
        'T......TTT..,,,....T',
        'T..k..........,..TTT',
        'T""""....m....,""""T',
        'T""""...,,,,,,,""""T',
        'TT"""...,.......""TT',
        'TT......,....m....TT',
        'T...k...,.........TT',
        'T.......,,,.......TT',
        'TT.........,...k..TT',
        'TTT...m....,.....TTT',
        'TT.........,......TT',
        'T........,,,......TT',
        'TTTTTTTTTvvTTTTTTTTT',
      ],
      objs: [{ k: 'idolo', c: 10, r: 8, l: 2, a: 2, s: 0.9 }],
      npcs: [{ id: 'davi', nome: 'Iuri', matiz: 300, c: 12, r: 11, dir: 'esq', vis: 4, cor: '#6a3aa8', cab: '#ffd35a' }],
      portais: { v: { area: 'rota1', c: 13, r: 2 } },
    },
  };
  AREAS.vila = window.PixmonMundo2.area; // a Vila usa a identidade visual v2 (mundo2.js)
  AREAS.rota1 = window.PixmonMundo3.area; // a Rota 1 tambem (mundo3.js)
  AREAS.bosque = window.PixmonMundo4.area; // e o Bosque (mundo4.js)
  AREAS.lago = window.PixmonMundo5.area; // e o Lago (mundo5.js)
  AREAS.fazenda = window.PixmonMundo6.area; // e a Fazenda (mundo6.js)
  Object.values(AREAS).forEach((A) => { A.mapa = A.mapa.map((l) => l.padEnd(A.largura, 'T').slice(0, A.largura)); });
  const BLOQUEIA = new Set(['T', 'R', 'b', 'W', 'B', '~', 'n', 'm', 'k', 'e']);
  // tiles ocupados pela base das construções (deco e chao não bloqueiam)
  const BLOQ_OBJ = {};
  Object.keys(AREAS).forEach((a) => { BLOQ_OBJ[a] = AREAS[a].bloq || new Set(); (AREAS[a].objs || []).forEach((o) => { if (o.deco || o.chao) return; for (let j = 0; j < o.a; j++) for (let i = 0; i < o.l; i++) BLOQ_OBJ[a].add((o.c + i) + ',' + (o.r + j)); }); });

  // ---------- imagens ----------
  const IM = {};
  const ARQ = {
   
    tufo: 'sprites-pixellab/grama-tufo-teste.png', flores: 'sprites-pixellab/flores-teste.png',
    terra: 'sprites-pixellab/chao/tileset-grama-terra.png', agua: 'sprites-pixellab/chao/tileset-agua-areia.png',
   
    junco: 'sprites-pixellab/junco-teste.png', nenufar: 'sprites-pixellab/nenufar-teste.png',
    casa_azul: 'ui/mundo/novo/casa_azul.png', cabana: 'ui/mundo/novo/cabana.png', celeiro: 'ui/mundo/novo/celeiro.png', plantacao: 'ui/mundo/novo/plantacao.png', moinho: 'ui/mundo/novo/moinho.png',
    pier: 'ui/mundo/novo/pier.png', barco: 'ui/mundo/novo/barco.png', ginasio: 'ui/mundo/novo/ginasio.png', feno: 'ui/mundo/novo/feno.png', cerca: 'ui/mundo/novo/cerca.png',
  };
  Object.keys(ARQ).forEach((k) => { const im = new Image(); im.onload = () => { IM[k] = im; fundos = {}; }; im.src = ARQ[k]; });

  // tiles mais "puros" (um terreno só) da folha Wang: 'l' = miolo, 'u' = em volta (mesmo método do arena.js)
  function puros(im) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const media = (px, py) => { const s = [0, 0, 0]; for (let b = 0; b < 8; b++) for (let a = 0; a < 8; a++) for (let k = 0; k < 3; k++) s[k] += d[((py + b) * c.width + px + a) * 4 + k] / 64; return s; };
    const dentro = media(c.width / 2 - 4, c.height / 2 - 4), fora = media(0, 0);
    const dist = (i, m) => (d[i] - m[0]) ** 2 + (d[i + 1] - m[1]) ** 2 + (d[i + 2] - m[2]) ** 2;
    const lista = [];
    for (let cy = 0; cy < im.height; cy += T) for (let cx = 0; cx < im.width; cx += T) {
      let n = 0;
      for (let b = 0; b < T; b++) for (let a = 0; a < T; a++) { const i = ((cy + b) * c.width + cx + a) * 4; if (dist(i, dentro) <= dist(i, fora)) n++; }
      lista.push({ f: n / (T * T), img: x.getImageData(cx, cy, T, T) });
    }
    lista.sort((p, q) => q.f - p.f);
    const cv = (p) => { const t = document.createElement('canvas'); t.width = t.height = T; t.getContext('2d').putImageData(p.img, 0, 0); return t; };
    return { l: lista.slice(0, 2).map(cv), u: lista.slice(-2).map(cv) };
  }
  const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177); h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

  // ---------- chão pré-desenhado por área ----------
  let fundos = {};
  function fundoDe(id) {
    if (fundos[id]) return fundos[id];
    if (!IM.terra || !IM.agua) return null;
    const A = AREAS[id], tt = puros(IM.terra), ta = puros(IM.agua);
    const c = document.createElement('canvas'); c.width = A.largura * T; c.height = A.mapa.length * T;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const pick = (lista, x, y) => lista[Math.floor(hash(x, y, 3) * lista.length)];
    A.mapa.forEach((lin, r) => [...lin].forEach((ch, col) => {
      const x = col * T, y = r * T;
      if (ch === '~' || ch === 'n' || ch === 'P') g.drawImage(pick(ta.u, col, r), x, y);
      else if (',^v<>L'.includes(ch)) g.drawImage(pick(tt.u, col, r), x, y);
      else g.drawImage(pick(tt.l, col, r), x, y);
      if (ch === '"' && IM.tufo) { // mato alto: dois tufos por tile, em posições fixas
        g.drawImage(IM.tufo, x - 6, y - 8); g.drawImage(IM.tufo, x + 8, y + 6);
      }
      if (ch === 'n' && IM.nenufar) g.drawImage(IM.nenufar, x, y);
      if (ch === 'j' && IM.junco) g.drawImage(IM.junco, x, y - 6);
    }));
    return (fundos[id] = c);
  }

  // ---------- treinador do PixelLab (sprites-pixellab/treinador/, 68x68, 4 direções). Sem quadros de andar ainda: balança de leve. ----------
  const TREI = {}, DIR_TREI = { baixo: 'south', cima: 'north', esq: 'west', dir: 'east' }; let ESC_TREI = 0.6; // escala da sprite do treinador (a Vila v2 usa 0.42)
  Object.values(DIR_TREI).forEach((d) => { const im = new Image(); im.onload = () => { TREI[d] = im; }; im.src = 'sprites-pixellab/treinador/' + d + '.png'; });
  // Quadros de andar (6 por direção, andar-<dir>-<n>.png). O gerador refez a faixa amarela no leste: aqui ela é pintada com a cor vizinha (cabelo/pele).
  const ANDA = { south: [], north: [], east: [], west: [] };
  function semFaixa(im) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const img = x.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width;
    const am = (i, j) => { const o = (j * w + i) * 4; return d[o + 3] > 10 && d[o] > 170 && d[o + 1] > 130 && d[o + 2] < 120 && j < 30; };
    const alvo = []; for (let j = 0; j < 30; j++) for (let i = 0; i < w; i++) if (am(i, j)) alvo.push([i, j]);
    const novos = alvo.map(([i, j]) => { for (let r = 1; r < 6; r++) { let melhor = null, bd = 99; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.abs(di) + Math.abs(dj) !== r) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= w || b >= c.height) continue; const o = (b * w + a) * 4; if (d[o + 3] < 10 || am(a, b)) continue; const pen = r + (dj > 0 ? 0.5 : 0); if (pen < bd) { bd = pen; melhor = [d[o], d[o + 1], d[o + 2]]; } } if (melhor) return melhor; } return null; });
    alvo.forEach(([i, j], k) => { if (!novos[k]) return; const o = (j * w + i) * 4; d[o] = novos[k][0]; d[o + 1] = novos[k][1]; d[o + 2] = novos[k][2]; });
    x.putImageData(img, 0, 0); return c;
  }
  Object.keys(ANDA).forEach((d) => { for (let k = 0; k < 6; k++) { const im = new Image(); im.onload = () => { ANDA[d][k] = d === 'east' ? semFaixa(im) : im; }; im.src = 'sprites-pixellab/treinador/andar-' + d + '-' + k + '.png'; } });
  // Parado por mais de 5 s: vira de frente e se espreguiça (9 quadros, canvas de 76 px: pés em (38, 59)), de novo a cada ~4 s de pausa.
  const ESPRE = []; for (let k = 0; k < 9; k++) { const im = new Image(); im.onload = () => { ESPRE[k] = im; }; im.src = 'sprites-pixellab/treinador/espreguicar-' + k + '.png'; }
  const ESPERA = 5000, QUADRO_ESPRE = 130, PAUSA_ESPRE = 4000;
  // Personagem novo (PixelLab v3 + ajustes, 32x32, sem quadros de andar ainda): só na Vila v2, para o jogador e os treinadores. Âncora = base e centro da silhueta.
  const PERS = {}; Object.values(DIR_TREI).forEach((d) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const dt = x.getImageData(0, 0, 32, 32).data; let a = 32, b = 0, f = 0; for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if (dt[(j * 32 + i) * 4 + 3]) { a = Math.min(a, i); b = Math.max(b, i); f = Math.max(f, j); } PERS[d] = { im, cx: Math.round((a + b) / 2), fy: f + 1 }; }; im.src = 'sprites-pixellab/personagem-ref/fix_' + d + '.png'; });
  const PERSV = {}; Object.values(DIR_TREI).forEach((d) => { const im = new Image(); im.onload = () => { PERSV[d] = im; }; im.src = 'sprites-pixellab/personagem-roupas/vestido_' + d + '.png'; }); // jogador vestido (camisa, calça, tênis); os NPCs usam o corpo nu recolorido
  // Troca de cores por paleta (sem girar o matiz): pele (+sombra 0.82), cabelo (+tom escuro 0.75) e roupa (short). Só para NPCs (P.cor); o jogador fica com as cores originais.
  const CORES = { '#e29f73': 'pele', '#c3805c': 'peleS', '#5b3a23': 'cab', '#432c1e': 'cabS', '#34231b': 'cor' }, cacheCor = new Map();
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), esc = (c, f) => c.map((v) => Math.round(v * f));
  const CAMISA = {}; Object.values(DIR_TREI).forEach((d) => { const im = new Image(); im.onload = () => { CAMISA[d] = im; }; im.src = 'sprites-pixellab/personagem-roupas/camisa_' + d + '.png'; }); // camada de camisa (azul) recolorida por NPC
  const CAMISA_ANDA = { south: [], east: [], north: [], west: [] }; Object.keys(CAMISA_ANDA).forEach((d) => { for (let k = 0; k < 2; k++) { const im = new Image(); im.onload = () => { CAMISA_ANDA[d][k] = im; }; im.src = 'sprites-pixellab/personagem-roupas/camisa_andar_' + d + '_' + k + '.png'; } });
  const PERS_ANDA_NU = { south: [], east: [], north: [], west: [] }; Object.keys(PERS_ANDA_NU).forEach((d) => { for (let k = 0; k < 2; k++) { const im = new Image(); im.onload = () => { PERS_ANDA_NU[d][k] = im; }; im.src = 'sprites-pixellab/personagem-ref/andar_' + d + '_' + k + '.png'; } }); // corpo nu andando (os NPCs recolorem pele, cabelo, short e camisa)
  function recolorir(im, P, dk, cam) {
    if (!P.cor) return im;
    const camL = cam || CAMISA[dk], k = im.src + P.pele + P.cab + P.cor + P.camisa + (camL ? camL.src : ''); if (cacheCor.has(k)) return cacheCor.get(k);
    const pele = rgb(P.pele || '#e29f73'), cab = rgb(P.cab || '#5b3a23'), novo = { pele, peleS: esc(pele, 0.82), cab, cabS: esc(cab, 0.75), cor: rgb(P.cor) };
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let o = 0; o < d.length; o += 4) { if (!d[o + 3]) continue; const t = CORES['#' + [0, 1, 2].map((j) => d[o + j].toString(16).padStart(2, '0')).join('')]; if (t) { d[o] = novo[t][0]; d[o + 1] = novo[t][1]; d[o + 2] = novo[t][2]; } }
    x.putImageData(img, 0, 0);
    if (P.camisa && camL) { const l = document.createElement('canvas'); l.width = l.height = 32; const lx = l.getContext('2d'); lx.drawImage(camL, 0, 0); const li = lx.getImageData(0, 0, 32, 32), dd = li.data, cm = rgb(P.camisa), cs = esc(cm, 0.78); for (let o = 0; o < dd.length; o += 4) { if (!dd[o + 3]) continue; const sombra = dd[o] === 0x2f; const q = sombra ? cs : cm; dd[o] = q[0]; dd[o + 1] = q[1]; dd[o + 2] = q[2]; } lx.putImageData(li, 0, 0); x.drawImage(l, 0, 0); }
    cacheCor.set(k, c); return c;
  }
  const PERS_ANDA = { south: [], east: [], north: [], west: [] }; Object.keys(PERS_ANDA).forEach((d) => { for (let k = 0; k < 2; k++) { const im = new Image(); im.onload = () => { PERS_ANDA[d][k] = im; }; im.src = 'sprites-pixellab/personagem-roupas/vestido_andar_' + d + '_' + k + '.png'; } });
  function spritePers(g, x, y, dir, quadro, andando, P) {
    const p = PERS[DIR_TREI[dir]]; if (!p) return false;
    const dk = DIR_TREI[dir], fr = (P.cor ? PERS_ANDA_NU : PERS_ANDA)[dk]; let base = !P.cor && PERSV[dk] || p.im, alto = 0, cam = null;
    if (andando && fr.filter(Boolean).length === 2) { // 1a metade do tile: passo (A ou C, alternando); 2a: parado com o corpo 1 px mais alto
      const f0 = P.frac != null ? P.frac : prog / T, par = P.passo != null ? P.passo : passos;
      if (f0 < 0.5) { base = fr[par % 2]; cam = P.cor ? CAMISA_ANDA[dk][par % 2] : null; } else alto = 1;
    }
    const im = recolorir(base, P, dk, cam);
    g.save(); g.imageSmoothingEnabled = false;
    const ox = Math.round(x - p.cx), oy = Math.round(y - p.fy);
    if (!andando && !P.nome) { // parado: respira, só a parte de cima (até a linha 24) sobe 1 px e os pés ficam no chão; ciclo de 1,2 s
      const sobe = performance.now() % 1200 < 600 ? 0 : 1;
      g.drawImage(im, 0, 24, 32, 8, ox, oy + 24, 32, 8); g.drawImage(im, 0, 0, 32, 25, ox, oy - sobe, 32, 25);
    } else g.drawImage(im, ox, oy - alto);
    g.restore(); return true;
  }
  function spriteTreinador(g, x, y, dir, quadro, andando, P) {
    if (AREAS[area].v2 && spritePers(g, x, y, dir, quadro, andando, P)) return true;
    if (!andando && !P.cor && parado > ESPERA && ESPRE.filter(Boolean).length === 9) {
      const t = (parado - ESPERA) % (9 * QUADRO_ESPRE + PAUSA_ESPRE), k = Math.min(8, Math.floor(t / QUADRO_ESPRE)), im = ESPRE[t < 9 * QUADRO_ESPRE ? k : 0];
      g.save(); g.imageSmoothingEnabled = true;
      g.drawImage(im, Math.round(x - 38 * ESC_TREI), Math.round(y - 59 * ESC_TREI), im.width * ESC_TREI, im.height * ESC_TREI);
      g.restore(); return true;
    } // pés da sprite ficam em (34, 55) do quadro de 68 px
    let im = TREI[DIR_TREI[dir]], salto = 0; if (!im) return false;
    const quadros = ANDA[DIR_TREI[dir]], jogador = !P.cor; // só o jogador anda (NPCs ficam parados ou andam até ele)
    if (andando && jogador && quadros.filter(Boolean).length === 6) im = quadros[Math.min(5, Math.floor(prog / T * 6))];
    else if (andando) salto = quadro % 2 ? -2 : 0;
    const w = im.width * ESC_TREI, h = im.height * ESC_TREI;
    g.save(); g.imageSmoothingEnabled = true; if (P.matiz) g.filter = 'hue-rotate(' + P.matiz + 'deg)';
    g.drawImage(im, Math.round(x - 34 * ESC_TREI), Math.round(y - 55 * ESC_TREI) + salto, w, h);
    g.restore(); return true;
  }
  // Nome do NPC acima da cabeca (padrao da serie, estilo MMO): vai para uma fila e e desenhado por pintarRotulos() numa camada sobre o canvas, na resolucao da tela (nitido),
  // em Pixelify Sans 700 de 12 px, texto claro sobre uma plaquinha escura de cantos arredondados. Nomes de ate 5 letras. (x, y) em coordenadas do mundo: x = centro, y = base do texto.
  const rotulos = []; let ovl = null;
  function etiqueta(g, x, y, nome) { if (nome) rotulos.push([x, y, nome]); }
  function pintarRotulos(cx, cy) {
    if (!cv) { rotulos.length = 0; return; }
    if (!ovl) { ovl = document.getElementById('mundoNomes') || document.createElement('canvas'); ovl.id = 'mundoNomes'; ovl.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none'; if (!ovl.parentNode) cv.parentNode.insertBefore(ovl, cv.nextSibling); }
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (ovl.width !== w || ovl.height !== h) { ovl.width = w; ovl.height = h; }
    const o = ovl.getContext('2d'); o.clearRect(0, 0, w, h); const esc = w / W;
    o.font = '700 ' + Math.round(13 * dpr) + 'px "Pixelify Sans", sans-serif'; o.textAlign = 'center'; o.textBaseline = 'middle';
    for (const [x, y, nome] of rotulos) {
      const sx = (x - cx) * esc, sy = (y - cy) * esc, tw = o.measureText(nome).width, pw = tw + 12 * dpr, ph = 18 * dpr, px0 = sx - pw / 2, py0 = sy - ph;
      if (sx < -40 || sx > w + 40 || sy < -20 || sy > h + 20) continue;
      o.fillStyle = 'rgba(27,16,32,.82)'; o.beginPath(); o.roundRect(px0, py0, pw, ph, 4 * dpr); o.fill();
      o.strokeStyle = 'rgba(255,211,90,.9)'; o.lineWidth = Math.max(1, dpr); o.stroke();
      o.fillStyle = '#fff6d8'; o.fillText(nome, sx, py0 + ph / 2 + dpr * 0.5);
    }
    rotulos.length = 0;
  }
  // ---------- jogador (desenhado em código: 12x14 px ampliados 2x) ----------
  function jogador(g, x, y, dir, quadro, andando, pal) {
    const P = pal || {};
    const u = 2, ox = Math.round(x - 6 * u), oy = Math.round(y - 14 * u) - (andando && quadro % 2 ? 1 : 0);
    const R = (cx, cy, w, h, cor) => { g.fillStyle = cor; g.fillRect(ox + cx * u, oy + cy * u, w * u, h * u); };
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y - 1, 8, 3, 0, 0, 7); g.fill();
    if (spriteTreinador(g, x, y, dir, quadro, andando, P)) return;
    const perna = andando ? (quadro % 2 ? 1 : 0) : 0;
    R(3, 11, 2, 3 - perna, '#2b2f6b'); R(7, 11, 2, 2 + perna, '#2b2f6b'); // pernas
    R(2, 6, 8, 5, P.cor || '#d8483c'); R(2, 6, 8, 1, 'rgba(0,0,0,.25)'); // camisa
    if (dir === 'esq' || dir === 'dir') { R(dir === 'esq' ? 1 : 9, 7, 2, 3, '#f0c8a0'); }
    else { R(1, 7, 1, 3, '#f0c8a0'); R(10, 7, 1, 3, '#f0c8a0'); }
    R(3, 1, 6, 5, '#f0c8a0'); // rosto
    const cab = P.cab || '#5a3a20'; R(2, 0, 8, 2, cab); // cabelo
    if (dir === 'cima') R(3, 1, 6, 4, cab);
    else if (dir === 'baixo') { R(4, 3, 1, 1, '#1b1020'); R(7, 3, 1, 1, '#1b1020'); }
    else { R(dir === 'esq' ? 3 : 8, 3, 1, 1, '#1b1020'); R(dir === 'esq' ? 3 : 4, 2, 5, 1, cab); }
    if (!pal) R(3, 0, 6, 1, '#ffd35a'); // faixa na testa (só o jogador)
  }

  // ---------- estado ----------
  let cv, g, cb, rodando = false, pausado = false, area = 'vila', col = 19, lin = 36, px = 0, py = 0, dir = 'baixo', alvo = null, prog = 0, passos = 0, quadro = 0, tQuadro = 0;
  let parado = 0, flash = 0, aviso = null, avisoT = 0, ultimo = 0;
  const teclas = new Set();
  const npcPos = {}; let des = null; // des: desafio em andamento { id, fase: 'ex' | 'anda', t }
  Object.values(AREAS).forEach((A) => (A.npcs || []).forEach((p) => { npcPos[p.id] = { c: p.c, r: p.r, dir: p.dir }; }));
  const npcEm = (a, c, r) => (AREAS[a].npcs || []).some((p) => npcPos[p.id].c === c && npcPos[p.id].r === r);
  const pressionados = new Set(); // vindo do D-pad
  const livre = (a, c, r) => { const m = AREAS[a].mapa; return r >= 0 && r < m.length && c >= 0 && c < AREAS[a].largura && !BLOQUEIA.has(m[r][c]) && !BLOQ_OBJ[a].has(c + ',' + r) && !npcEm(a, c, r); };
  const terreno = (a, c, r) => AREAS[a].mapa[r][c];
  function salvar() { try { localStorage.setItem(SALVO, JSON.stringify({ area, col, lin })); } catch (e) { /* sem save */ } }
  function carregar() { try { const s = JSON.parse(localStorage.getItem(SALVO)); if (s && AREAS[s.area] && livre(s.area, s.col, s.lin)) { area = s.area; col = s.col; lin = s.lin; } } catch (e) { /* começa do início */ } }
  function mostrarAviso(t) { aviso = t; avisoT = 2200; }

  // ajusta tile, resolução do canvas e escala da sprite à área atual
  function usarArea() {
    const A = AREAS[area]; T = A.T || 32; const r = A.res || [360, 640]; W = r[0]; H = r[1]; ESC_TREI = A.v2 ? 0.42 : 0.6;
    if (cv && (cv.width !== W || cv.height !== H)) { cv.width = W; cv.height = H; }
  }
  function iniciar(canvas, callbacks, novo) {
    cv = canvas; g = cv.getContext('2d'); cb = callbacks || {};
    if (novo) { area = 'vila'; col = 19; lin = 36; } else carregar();
    usarArea(); g = cv.getContext('2d');
    px = col * T + T / 2; py = lin * T + T; alvo = null; pausado = false; flash = 0; dir = 'baixo';
    if (cb.area) cb.area(area);
    mostrarAviso(AREAS[area].nome);
    if (!rodando) { rodando = true; ultimo = performance.now(); requestAnimationFrame(laco); }
  }
  function parar() { rodando = false; }
  function pausar() { pausado = true; }
  function retomar() { parado = 0; pausado = false; flash = 0; ultimo = performance.now(); }

  function direcaoPedida() {
    const t = (n) => teclas.has(n) || pressionados.has(n);
    if (t('cima')) return 'cima'; if (t('baixo')) return 'baixo'; if (t('esq')) return 'esq'; if (t('dir')) return 'dir';
    return null;
  }
  const DELTA = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] };

  function vigiar() { // treinador que ainda não perdeu e enxerga o jogador na linha de visão vem desafiar
    for (const n of AREAS[area].npcs || []) {
      if (cb.vencido && cb.vencido(n.id)) continue;
      const p = npcPos[n.id], [dx, dy] = DELTA[p.dir];
      for (let k = 1; k <= n.vis; k++) {
        const c = p.c + dx * k, r = p.r + dy * k;
        if (r < 0 || r >= AREAS[area].mapa.length || c < 0 || c >= AREAS[area].largura || BLOQUEIA.has(AREAS[area].mapa[r][c]) || BLOQ_OBJ[area].has(c + ',' + r)) break;
        if (c === col && r === lin) { des = { id: n.id, fase: 'ex', t: 0 }; return true; }
      }
    }
    return false;
  }
  // Figurantes: seguem n.paradas (lista de { c, r, espera: [min, max] em ms }). Ficam parados no ponto; depois vao ao proximo por um caminho achado em BFS, um tile por vez, com movimento suave
  // (npcMov guarda de onde vem e o quanto ja andou) e a animacao de passo. Esperam se o proximo tile estiver ocupado. Nao desafiam (vis: 0).
  const figs = {}, npcMov = {}, DUR_PASSO = 420;
  const DIRDE = { '1,0': 'dir', '-1,0': 'esq', '0,1': 'baixo', '0,-1': 'cima' };
  const sorteia = (e) => { const [x, y] = e || [800, 1500]; return x + Math.random() * (y - x); };
  function caminhoAte(a, c0, r0, c1, r1) { // BFS em 4 direcoes pelos tiles livres do mapa (sem contar NPCs nem o jogador)
    const A = AREAS[a], mp = A.mapa, ok = (c, r) => r >= 0 && r < mp.length && c >= 0 && c < A.largura && !BLOQUEIA.has(mp[r][c]) && !BLOQ_OBJ[a].has(c + ',' + r);
    const ant = new Map([[c0 + ',' + r0, null]]), fila = [[c0, r0]];
    while (fila.length) { const [c, r] = fila.shift(); if (c === c1 && r === r1) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = c + dx, y = r + dy, k = x + ',' + y; if (ant.has(k) || !ok(x, y)) continue; ant.set(k, c + ',' + r); fila.push([x, y]); } }
    const out = []; let k = c1 + ',' + r1; if (!ant.has(k)) return out; while (k !== c0 + ',' + r0) { const [x, y] = k.split(',').map(Number); out.unshift([x, y]); k = ant.get(k); } return out;
  }
  function andarFiguras(dt) {
    for (const n of AREAS[area].npcs || []) {
      if (!n.paradas || !n.paradas.length) continue;
      const p = npcPos[n.id], f = figs[n.id] || (figs[n.id] = { parada: 0, t: 0, espera: sorteia(n.paradas[0].espera), caminho: [], bloq: 0, passo: 0 }), mv = npcMov[n.id];
      if (mv) { mv.t += dt; if (mv.t < DUR_PASSO) continue; delete npcMov[n.id]; }
      if (f.caminho.length) {
        const [pc, pr] = f.caminho[0];
        if (!livre(area, pc, pr) || (pc === col && pr === lin)) { f.bloq += dt; if (f.bloq > 2500) { const d = n.paradas[f.parada]; f.caminho = caminhoAte(area, p.c, p.r, d.c, d.r); f.bloq = 0; } continue; }
        f.bloq = 0; f.caminho.shift(); npcMov[n.id] = { fc: p.c, fr: p.r, t: 0, passo: f.passo++ }; npcPos[n.id] = { c: pc, r: pr, dir: DIRDE[(pc - p.c) + ',' + (pr - p.r)] || p.dir };
      } else {
        f.t += dt;
        if (f.t >= f.espera) { f.parada = (f.parada + 1) % n.paradas.length; const d = n.paradas[f.parada]; f.caminho = caminhoAte(area, p.c, p.r, d.c, d.r); f.t = 0; f.espera = sorteia(d.espera); f.bloq = 0; }
      }
    }
  }
  function atualizar(dt) { andarFiguras(dt);
    if (des) {
      des.t += dt; const p = npcPos[des.id];
      if (des.fase === 'ex') { if (des.t > 700) { des.fase = 'anda'; des.t = 0; } return; }
      if (des.t > 170) {
        des.t = 0; const dc = col - p.c, dr = lin - p.r;
        if (Math.abs(dc) + Math.abs(dr) <= 1) { const id = des.id; des = null; pausado = true; dir = dc ? (dc > 0 ? 'esq' : 'dir') : (dr > 0 ? 'cima' : 'baixo'); cb.desafio(id); return; }
        if (dc) { p.c += Math.sign(dc); p.dir = dc > 0 ? 'dir' : 'esq'; } else { p.r += Math.sign(dr); p.dir = dr > 0 ? 'baixo' : 'cima'; }
      }
      return;
    }
    if (avisoT > 0) avisoT -= dt;
    if (flash > 0) { flash -= dt; if (flash <= 0 && cb.encontro) { pausado = true; cb.encontro(area); } return; }
    tQuadro += dt; if (tQuadro > 120) { tQuadro = 0; quadro++; }
    parado = alvo || direcaoPedida() ? 0 : parado + dt;
    if (parado > ESPERA && parado - dt <= ESPERA) dir = 'baixo'; // vira de frente para se espreguiçar
    if (!alvo) {
      const d = direcaoPedida();
      if (d) {
        dir = d;
        const [dx, dy] = DELTA[d];
        if (livre(area, col + dx, lin + dy)) { alvo = { c: col + dx, r: lin + dy }; prog = 0; }
      }
    }
    if (alvo) {
      const passo = Math.min(PASSO * (T / 32) * dt / 16.7, T - prog); prog += passo;
      const [dx, dy] = DELTA[dir];
      px += dx * passo; py += dy * passo;
      if (prog >= T - 0.01) {
        col = alvo.c; lin = alvo.r; px = col * T + T / 2; py = lin * T + T; alvo = null; passos++;
        const ch = terreno(area, col, lin);
        if (AREAS[area].portais[ch]) { // portal: troca de área; numa abertura de 2 tiles, entra pelo tile correspondente
          const p = AREAS[area].portais[ch], m = AREAS[area].mapa, vert = ch === '^' || ch === 'v';
          const off = vert ? col - m[lin].indexOf(ch) : lin - m.findIndex((l) => l[col] === ch);
          area = p.area; usarArea(); col = p.c + (vert ? off : 0); lin = p.r + (vert ? 0 : off);
          if (!livre(area, col, lin)) { col = p.c; lin = p.r; }
          px = col * T + T / 2; py = lin * T + T; mostrarAviso(AREAS[area].nome); salvar(); vigiar(); if (cb.area) cb.area(area);
        } else if (ch === '"' && Math.random() < CHANCE) { flash = 700; salvar(); }
        else if (ch === 'L' && cb.loja) { salvar(); pausado = true; cb.loja(); }
        else { if (passos % 5 === 0) salvar(); vigiar(); }
      }
    }
  }

  // desenho da Vila v2: o mundo2.js pinta chão, árvores, prédios e props; aqui entram o jogador e os treinadores na ordenação por profundidade
  function desenharV2(A) {
    const mw = A.largura * T, mh = A.mapa.length * T;
    const cx = Math.round(Math.max(0, Math.min(mw - W, px - W / 2))), cy = Math.round(Math.max(0, Math.min(mh - H, py - T / 2 - H / 2)));
    const extras = [];
    (A.npcs || []).forEach((n) => { const p = npcPos[n.id]; extras.push({ y: (p.r + 1) * T, f: () => {
      const mv = npcMov[n.id], q = mv ? Math.min(1, mv.t / DUR_PASSO) : 0; let nx = p.c * T + T / 2, ny = (p.r + 1) * T - 1;
      if (mv) { nx = mv.fc * T + T / 2 + (p.c - mv.fc) * T * q; ny = (mv.fr + 1) * T - 1 + (p.r - mv.fr) * T * q; }
      jogador(g, nx, ny, p.dir, 0, !!mv, { cor: n.cor, cab: n.cab, pele: n.pele, camisa: n.camisa, matiz: n.matiz, frac: mv ? q : null, passo: mv ? mv.passo : 0 });
      etiqueta(g, nx, ny - 30, n.nome);
      if (des && des.id === n.id && des.fase === 'ex') { g.fillStyle = '#1b1020'; g.fillRect(p.c * T + 4, p.r * T - 20, 8, 12); g.fillStyle = '#ffd35a'; g.font = '8px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText('!', p.c * T + 8, p.r * T - 10); }
    } }); });
    extras.push({ y: py, f: () => jogador(g, px, py - 1, dir, quadro, !!alvo) });
    g.imageSmoothingEnabled = false; A.desenhar(g, cx, cy, extras); pintarRotulos(cx, cy);
    if (avisoT > 0) { g.globalAlpha = Math.min(1, avisoT / 400); g.fillStyle = '#1b1020'; g.fillRect(W / 2 - 55, 12, 110, 20); g.strokeStyle = '#ffd35a'; g.lineWidth = 1; g.strokeRect(W / 2 - 55, 12, 110, 20); g.fillStyle = '#ffd35a'; g.font = '8px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText(aviso, W / 2, 26); g.globalAlpha = 1; }
    if (flash > 0) { const n = Math.floor((700 - flash) / 100); g.fillStyle = n % 2 === 0 ? '#fff' : '#1b1020'; g.globalAlpha = 0.85; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  }
  function desenhar() {
    const A = AREAS[area]; if (A.v2) { desenharV2(A); return; }
    const fundo = fundoDe(area);
    g.imageSmoothingEnabled = false; g.fillStyle = '#1b1020'; g.fillRect(0, 0, W, H);
    const mw = A.largura * T, mh = A.mapa.length * T;
    const cx = Math.round(Math.max(0, Math.min(mw - W, px - W / 2))), cy = Math.round(Math.max(0, Math.min(mh - H, py - T / 2 - H / 2)));
    g.save(); g.translate(-cx, -cy);
    if (fundo) g.drawImage(fundo, 0, 0); else { g.fillStyle = '#4a8a3a'; g.fillRect(0, 0, mw, mh); }
    // objetos ordenados pela base (y)
    const objs = [];
    const lista = A.arvores || ['macieira', 'carvalho', 'escura'];
    const arv = (ch, c, r) => {
      const k = lista[Math.floor(hash(c, r, 7) * lista.length)], im = IM[k]; if (!im) return;
      const s = (k === 'luminosa' ? 76 : 64) / im.height; // todas as árvores com altura parecida
      objs.push({ y: (r + 1) * T, f: () => g.drawImage(im, Math.round(c * T + T / 2 - im.width * s / 2), Math.round((r + 1) * T - im.height * s + 4), Math.round(im.width * s), Math.round(im.height * s)) });
    };
    const peq = (k, c, r, s) => { const im = IM[k]; if (im) objs.push({ y: (r + 1) * T, f: () => g.drawImage(im, Math.round(c * T + T / 2 - im.width * s / 2), Math.round((r + 1) * T - im.height * s), Math.round(im.width * s), Math.round(im.height * s)) }); };
    A.mapa.forEach((l, r) => [...l].forEach((ch, c) => {
      if (ch === 'T') { if (r < cy / T - 3 || r > (cy + H) / T + 1) return; arv(ch, c, r); }
      else if (ch === 'R') peq('rocha', c, r, 0.8);
      else if (ch === 'b') peq('arbusto', c, r, 0.75);
      else if (ch === 'W') peq('poco', c, r, 0.9);
      else if (ch === 'm') peq('cogumelo', c, r, 0.8);
      else if (ch === 'k') peq('toco', c, r, 0.9);
      else if (ch === 'e') peq('espantalho', c, r, 0.8);
    }));
    (A.objs || []).forEach((o) => {
      const im = IM[o.k]; if (!im) return;
      const sc = o.s || 1, w = im.width * sc, hh = im.height * sc, x = Math.round((o.c + o.l / 2) * T - w / 2);
      if (o.chao) { objs.push({ y: -5, f: () => g.drawImage(im, x, o.r * T, Math.round(w), Math.round(hh)) }); return; }
      const base = (o.r + o.a) * T, y = Math.round(base - hh + (o.deco ? 0 : 6));
      objs.push({ y: base, f: () => g.drawImage(im, x, y, Math.round(w), Math.round(hh)) });
      if (o.nome) objs.push({ y: 9999, f: () => { g.font = '8px "Press Start 2P", monospace'; g.textAlign = 'center'; const tx = (o.c + o.l / 2) * T, ty = Math.max(12, y + 4); const tw = g.measureText(o.nome).width + 12; g.fillStyle = '#1b1020'; g.fillRect(tx - tw / 2, ty - 11, tw, 16); g.fillStyle = '#ffd35a'; g.fillText(o.nome, tx, ty); } });
    });
    A.mapa.forEach((l, r) => [...l].forEach((ch, c) => { // seta pulsando nas saídas
      const DIRS = { '^': [0, -1], v: [0, 1], '<': [-1, 0], '>': [1, 0] }; if (!DIRS[ch]) return;
      objs.push({ y: -1, f: () => {
        const [dx, dy] = DIRS[ch], o = Math.sin(performance.now() / 180) * 3, x = c * T + T / 2 + dx * o, y = r * T + T / 2 + dy * o;
        const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
        tri(11, 7, '#1b1020'); tri(8, 5, '#ffd35a');
      } });
    }));
    (A.npcs || []).forEach((n) => { const p = npcPos[n.id]; objs.push({ y: (p.r + 1) * T, f: () => {
      jogador(g, p.c * T + T / 2, (p.r + 1) * T - 2, p.dir, 0, false, { cor: n.cor, cab: n.cab, matiz: n.matiz });
      etiqueta(g, p.c * T + T / 2, (p.r + 1) * T - 50, n.nome);
      if (des && des.id === n.id && des.fase === 'ex') { g.fillStyle = '#1b1020'; g.fillRect(p.c * T + 10, p.r * T - 22, 12, 18); g.fillStyle = '#ffd35a'; g.font = '14px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText('!', p.c * T + 16, p.r * T - 7); }
    } }); });
    objs.push({ y: py, f: () => jogador(g, px, py - 2, dir, quadro, !!alvo) });
    objs.sort((p, q) => p.y - q.y).forEach((o) => o.f());
    g.restore(); pintarRotulos(cx, cy);
    if (avisoT > 0) { // nome da área
      const a = Math.min(1, avisoT / 400);
      g.globalAlpha = a; g.fillStyle = '#1b1020'; g.fillRect(W / 2 - 80, 18, 160, 28); g.strokeStyle = '#ffd35a'; g.lineWidth = 2; g.strokeRect(W / 2 - 80, 18, 160, 28);
      g.fillStyle = '#ffd35a'; g.font = '10px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText(aviso, W / 2, 37); g.globalAlpha = 1;
    }
    if (flash > 0) { // pisca de encontro, estilo Game Boy
      const n = Math.floor((700 - flash) / 100);
      g.fillStyle = n % 2 === 0 ? '#fff' : '#1b1020'; g.globalAlpha = 0.85; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    }
  }

  function laco(t) {
    if (!rodando) return;
    const dt = Math.min(100, t - ultimo); ultimo = t;
    try { if (!pausado) atualizar(dt); desenhar(); } catch (e) { console.error(e); }
    requestAnimationFrame(laco);
  }

  // teclado (setas e WASD) e D-pad
  const MAPA_TECLAS = { ArrowUp: 'cima', w: 'cima', W: 'cima', ArrowDown: 'baixo', s: 'baixo', S: 'baixo', ArrowLeft: 'esq', a: 'esq', A: 'esq', ArrowRight: 'dir', d: 'dir', D: 'dir' };
  document.addEventListener('keydown', (e) => { const d = MAPA_TECLAS[e.key]; if (d && rodando) { teclas.add(d); e.preventDefault(); } });
  document.addEventListener('keyup', (e) => { const d = MAPA_TECLAS[e.key]; if (d) teclas.delete(d); });
  window.addEventListener('blur', () => { teclas.clear(); pressionados.clear(); });
  function ligarDpad(el) {
    el.querySelectorAll('[data-d]').forEach((b) => {
      const d = b.dataset.d;
      b.addEventListener('pointerdown', (e) => { pressionados.add(d); b.setPointerCapture(e.pointerId); e.preventDefault(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, () => pressionados.delete(d)));
    });
  }

  window.PixmonMundo = { BLOQUEIA, BLOQ_OBJ, iniciar, parar, pausar, retomar, ligarDpad, esperar: (ms) => { parado = ms; }, ir: (a, c, r) => { area = a; usarArea(); col = c; lin = r; px = c * T + T / 2; py = r * T + T; alvo = null; }, npcPosEst: () => JSON.stringify(npcPos), estado: () => ({ parado, dir, area, col, lin, passos, flash, pausado, rodando, alvo, tec: [...teclas] }), AREAS };
})();
