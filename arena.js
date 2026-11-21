// Cena e animação da batalha, em tempo real. Reusa o desenho do Pixelândia (pixel.js = remotion/src/pixel/draw.ts empacotado).
// Canvas lógico 360x640; posições inteiras; contorno #1c1c28.
(function () {
  const { PAL, hash, px, ellipse, drawGround, drawTree, sprite } = PixelDraw;
  const W = 360, H = 640, OUT = PAL.outline;
  const som = (...a) => window.PixmonSom && window.PixmonSom.tocar(...a);
  const B = window.PixmonBatalha;

  // Folhas do pixelfx (fx/*.png + .json, geradas por fx/gerar.mjs). Enquanto não carregam, o desenho antigo fica.
  const FX = {};
  const PROJ_FX = { fogo: 'fogo-bola', agua: 'agua-orbe', eletrico: 'eletrico-bola', ar: 'ar-folhas' };
  const IMPACTO_FX = { fogo: 'fogo-impacto', agua: 'agua-impacto', eletrico: 'eletrico-impacto', terra: 'terra-impacto', ar: 'ar-impacto' };
  const ESCALA_FX = { 'fogo-bola': 0.5, 'agua-orbe': 0.5, 'eletrico-bola': 0.5, 'ar-folhas': 0.5, 'fogo-impacto': 0.4, 'agua-impacto': 0.5, 'eletrico-impacto': 0.5, 'terra-impacto': 0.5, 'ar-impacto': 0.4 };
  function carregarFx(nome) {
    FX[nome] = null;
    fetch('fx/' + nome + '.json').then((r) => r.json()).then((j) => {
      if (!j.meta.pixelfx) j.meta.pixelfx = { fps: 1000 / j.frames[0].duration, loop: (nome.startsWith('escudo-') && nome !== 'escudo-quebra') || nome === 'frenesi-aura' || nome === 'feixe-arcano' || nome === 'carga-arcana', pivot: [j.meta.anchor.x, j.meta.anchor.y] };
      const im = new Image();
      im.onload = () => { FX[nome] = { j, im }; };
      im.src = 'fx/' + nome + '.png';
    }).catch(() => { /* sem a folha: segue com o desenho de código */ });
  }
  // Efeitos do vfx_workbench do PixelLab (fx/*.png + .json): sem meta.pixelfx, então o loader monta fps, loop e pivô a partir do json.
  const FX_PL = { 'terra-rachadura': 1, 'terra-espinhos': 0.9, 'fogo-explosao': 1.2, 'agua-splash': 1.2, 'eletrico-raio': 0.9, 'ar-corte': 1, 'critico': 1, 'escudo-quebra': 0.9, 'fumaca': 0.8, 'escudo-fogo': 0.9, 'escudo-agua': 0.9, 'escudo-terra': 0.9, 'escudo-ar': 0.9, 'escudo-eletrico': 0.9, 'garra': 1.5, 'area-fogo': 0.9, 'area-agua': 0.9, 'area-terra': 0.9, 'area-ar': 0.9, 'area-eletrico': 0.9, 'frenesi-aura': 1.3, 'feixe-arcano': 1, 'carga-arcana': 1 };
  Object.keys(FX_PL).forEach((n) => { ESCALA_FX[n] = FX_PL[n]; });
  Object.keys(ESCALA_FX).forEach(carregarFx);

  // Sprites do PixelLab (sprites-pixellab/, geradas por IA): são o visual padrão de monstros, árvores e chão em todos os cenários.
  // ?codigo volta ao desenho feito em código (conferência e plano B se os PNGs não carregarem).
  const USA_PL = !location.search.includes('codigo');
  const PL = {};
  const PL_ARQ = { casa: 'ui/mundo/v2/casa_1_f.png', fagulhao: 'fagulhao-teste.png', mareal: 'mareal-teste.png', musgarra: 'musgarra-teste.png', chamuscao: 'chamuscao-teste.png', pingolino: 'pingolino-teste.png', brotinho: 'brotinho-teste.png', ventinho: 'ventinho-teste.png', nuvelino: 'nuvelino-teste.png', faiscao: 'faiscao-teste.png', trovinho: 'trovinho-teste.png', carvalho: 'arvore-carvalho-teste.png', pinheiro: 'arvore-pinheiro-teste.png', grama: 'grama-tufo-teste.png', pedra: 'pedra-pequena-teste.png', pedramusgo: 'pedra-musgo-teste.png', pedras: 'pedras-grupo-teste.png', arbusto: 'arbusto-teste.png', flores: 'flores-teste.png', toco: 'toco-teste.png', junco: 'junco-teste.png', nenufar: 'nenufar-teste.png', rochedo: 'rochedo-teste.png', betula: 'arvore-betula-teste.png', frutinhas: 'arbusto-frutinhas-teste.png', floresazuis: 'flores-azuis-teste.png', barril: 'barril-teste.png', caixote: 'caixote-teste.png', jarro: 'jarro-teste.png' };
  const ALT_MON = 32; // monstros 25% menores (eram 50 px) e mais 15% (era 38)
  const ALT_PL = { fagulhao: ALT_MON, mareal: ALT_MON, musgarra: ALT_MON, chamuscao: ALT_MON, pingolino: ALT_MON, brotinho: ALT_MON, ventinho: ALT_MON, nuvelino: ALT_MON, faiscao: ALT_MON, trovinho: ALT_MON, carvalho: 84, pinheiro: 84, grama: 16, pedra: 16, pedramusgo: 26, pedras: 14, arbusto: 22, flores: 14, toco: 18, junco: 22, nenufar: 14, rochedo: 46, casa: 1.4, betula: 84, outono: 84, rosa: 84, frutinhas: 22, floresazuis: 15, barril: 22, caixote: 22, jarro: 20 }; // altura alvo na tela, em px
  // Formas evoluídas (Fase D): um pouco maiores que a forma base
  Object.assign(PL_ARQ, { brasalisco: 'brasalisco-teste.png', magmadilo: 'magmadilo-teste.png', algamar: 'algamar-teste.png', recifante: 'recifante-teste.png', rochedao: 'rochedao-teste.png', esporao: 'esporao-teste.png', plumareu: 'plumareu-teste.png', ciclonara: 'ciclonara-teste.png', zapotrao: 'zapotrao-teste.png', tempestauro: 'tempestauro-teste.png', carvaoreal: 'carvaoreal-teste.png', pingueiroimperial: 'pingueiroimperial-teste.png', musgarrao: 'musgarrao-teste.png', vendaval: 'vendaval-teste.png', cumulonio: 'cumulonio-teste.png', trovaodourado: 'trovaodourado-teste.png', brasinha: 'brasinha-teste.png', vulcanejo: 'vulcanejo-teste.png', algazinho: 'algazinho-teste.png', coraline: 'coraline-teste.png', pedrinho: 'pedrinho-teste.png', tatufungo: 'tatufungo-teste.png', plumelho: 'plumelho-teste.png', redemoinha: 'redemoinha-teste.png', zapinho: 'zapinho-teste.png', raiomante: 'raiomante-teste.png', labaredo: 'labaredo-teste.png', oceanico: 'oceanico-teste.png', carvalhinho: 'carvalhinho-teste.png', faiscante: 'faiscante-teste.png' });
  Object.assign(ALT_PL, { brasalisco: 38, magmadilo: 38, algamar: 38, recifante: 38, rochedao: 38, esporao: 38, plumareu: 38, ciclonara: 38, zapotrao: 38, tempestauro: 38, carvaoreal: 38, pingueiroimperial: 38, musgarrao: 38, vendaval: 38, cumulonio: 38, trovaodourado: 38, brasinha: ALT_MON, vulcanejo: ALT_MON, algazinho: ALT_MON, coraline: ALT_MON, pedrinho: ALT_MON, tatufungo: ALT_MON, plumelho: ALT_MON, redemoinha: ALT_MON, zapinho: ALT_MON, raiomante: ALT_MON, labaredo: 38, oceanico: 38, carvalhinho: 38, faiscante: 38 });
  // Mais 5 espécies (2026-11-19): uma de cada elemento
  Object.assign(PL_ARQ, { pavio: 'pavio-teste.png', bolhudo: 'bolhudo-teste.png', taupino: 'taupino-teste.png', pipinha: 'pipinha-teste.png', lampiro: 'lampiro-teste.png' });
  Object.assign(ALT_PL, { pavio: ALT_MON, bolhudo: ALT_MON, taupino: ALT_MON, pipinha: ALT_MON, lampiro: ALT_MON });
  // T3 (onda 1): 8 espécies novas (inseto, pedra, fera) e as formas evoluídas delas
  const T3 = { brasoleta: 'brasadeira', besourao: 'besourei', tesloura: 'teslorrao', rochilo: 'gargolo', cristalino: 'cristalao', texugao: 'texugarra', lontrinha: 'lontrao' };
  Object.entries(T3).forEach(([base, evo]) => { PL_ARQ[base] = base + '-teste.png'; ALT_PL[base] = ALT_MON; PL_ARQ[evo] = evo + '-teste.png'; ALT_PL[evo] = 38; });
  // linha da borboleta (3 estágios): casulo, lagarta e a borboleta final
  Object.assign(PL_ARQ, { casulucia: 'casulucia-teste.png', lagartucia: 'lagartucia-teste.png', papelucia: 'papelucia-teste.png' }); Object.assign(ALT_PL, { casulucia: ALT_MON, lagartucia: 36, papelucia: 40 });
  // Recorta a silhueta (pixels com alfa) para a sprite ser centralizada pela base
  function plCaixa(im) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, x1 = -1, y0 = c.height, y1 = -1;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 0) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
    return { im, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  if (USA_PL) Object.keys(PL_ARQ).forEach((k) => {
    const im = new Image();
    im.onload = () => {
      PL[k] = plCaixa(im); fundo = null; // o fundo com árvores e grama é refeito com os PNGs
      if (k === 'carvalho') [['outono', 'hue-rotate(-80deg) saturate(1.35)'], ['rosa', 'hue-rotate(200deg) saturate(1.1) brightness(1.1)']].forEach(([nome, filtro]) => {
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const x = c.getContext('2d'); x.filter = filtro; x.drawImage(im, 0, 0); PL[nome] = plCaixa(c);
      });
    };
    im.src = (PL_ARQ[k].includes('/') ? '' : 'sprites-pixellab/') + PL_ARQ[k]; // os dos pacotes ficam em ui/mundo/
  });
  // Chão do PixelLab. As folhas Wang 4x4 (32 px) do PixelLab não trazem os 16 tiles de transição distintos (têm repetidos e faltam
  // combinações), então só usamos os tiles PUROS delas (um terreno inteiro) e desenhamos as bordas por ruído, no nível do pixel,
  // com um contorno de 1 px. Em todas as folhas 'l' é o terreno do miolo (upper_description) e 'u' o terreno em volta.
  // Terrenos: g grama, d terra, f chão de floresta, a areia, w água, r pedra.
  const FOLHAS = {
    terra: 'tileset-grama-terra.png', floresta: 'tileset-grama-floresta.png', aguaareia: 'tileset-agua-areia.png',
    areiagrama: 'tileset-areia-grama.png', pedragrama: 'tileset-pedra-grama.png',
  };
  // cada bioma: de qual folha (e de qual lado dela, l ou u) sai a textura de cada terreno
  const RECEITA = {
    campo: { g: ['terra', 'l'], d: ['terra', 'u'] },
    floresta: { g: ['floresta', 'l'], f: ['floresta', 'u'] },
    lago: { g: ['areiagrama', 'l'], a: ['areiagrama', 'u'], w: ['aguaareia', 'u'] },
    montanha: { g: ['pedragrama', 'l'], r: ['pedragrama', 'u'] },
    vila: { g: ['terra', 'l'], d: ['terra', 'u'] },
  };
  const BORDA = { d: '#74502c', f: '#2f5a2e', a: '#d8b878', w: '#8ccdf0', r: '#5e5648' }; // contorno de 1 px na beira de cada terreno
  const PL_PURO = {}; // por folha: { l: [ImageData 32x32...], u: [...] }, os tiles mais puros de cada terreno
  let semente = 11, bioma = 'campo', mapa = null, biomaPedido = null; // sorteados a cada luta em montarFundo; mapa = terreno (letra) de cada pixel
  const T_CHAO = 32;
  function purosDaFolha(im) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const media = (px, py) => { const s = [0, 0, 0]; for (let b = 0; b < 8; b++) for (let a = 0; a < 8; a++) for (let k = 0; k < 3; k++) s[k] += d[((py + b) * c.width + px + a) * 4 + k] / 64; return s; };
    const dentro = media(c.width / 2 - 4, c.height / 2 - 4), fora = media(0, 0); // centro da folha = 'l'; canto = 'u'
    const dist = (i, m) => (d[i] - m[0]) ** 2 + (d[i + 1] - m[1]) ** 2 + (d[i + 2] - m[2]) ** 2;
    const T = T_CHAO, achados = [];
    for (let cy = 0; cy < im.height; cy += T) for (let cx = 0; cx < im.width; cx += T) {
      let n = 0;
      for (let b = 0; b < T; b++) for (let a = 0; a < T; a++) { const i = ((cy + b) * c.width + cx + a) * 4; if (dist(i, dentro) <= dist(i, fora)) n++; }
      achados.push({ f: n / (T * T), img: x.getImageData(cx, cy, T, T) });
    }
    achados.sort((p, q) => q.f - p.f); // do mais 'l' ao mais 'u'; os 2 extremos de cada lado são os tiles mais puros
    return { l: achados.slice(0, 2).map((p) => p.img), u: achados.slice(-2).map((p) => p.img) };
  }
  if (USA_PL) Object.keys(FOLHAS).forEach((k) => {
    const im = new Image();
    im.onload = () => { PL_PURO[k] = purosDaFolha(im); fundo = null; };
    im.src = 'sprites-pixellab/chao/' + FOLHAS[k];
  });
  // A folha tem dezenas de detalhes pequenos (tufos de grama e manchas de terra). Em vez de recortar à mão, acho os blocos conectados
  // (com 2 px de folga) quando a imagem carrega; o que está na metade de cima é terra, o de baixo é grama.
  let DET = null, detIm = null;
  if (USA_PL) {
    detIm = new Image();
    detIm.onload = () => {
      const w = detIm.width, h = detIm.height, c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.drawImage(detIm, 0, 0);
      const d = x.getImageData(0, 0, w, h).data, R = 2, op = new Uint8Array(w * h), dil = new Uint8Array(w * h), lab = new Int32Array(w * h), comps = [];
      for (let i = 0; i < w * h; i++) op[i] = d[i * 4 + 3] > 20 ? 1 : 0;
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) if (op[y * w + xx]) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const ny = y + dy, nx = xx + dx; if (ny >= 0 && ny < h && nx >= 0 && nx < w) dil[ny * w + nx] = 1; }
      let n = 0;
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
        if (!dil[y * w + xx] || lab[y * w + xx]) continue;
        n++; const st = [[xx, y]]; lab[y * w + xx] = n; let x0 = xx, x1 = xx, y0 = y, y1 = y;
        while (st.length) { const [cx, cy] = st.pop(); for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + ax, ny = cy + ay; if (nx < 0 || ny < 0 || nx >= w || ny >= h || !dil[ny * w + nx] || lab[ny * w + nx]) continue; lab[ny * w + nx] = n; st.push([nx, ny]); x0 = Math.min(x0, nx); x1 = Math.max(x1, nx); y0 = Math.min(y0, ny); y1 = Math.max(y1, ny); } }
        comps.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
      }
      DET = { verde: comps.filter((k) => k.y >= 140 && k.w >= 7 && k.w <= 40 && k.h <= 40), marrom: comps.filter((k) => k.y < 140 && k.w >= 5 && k.w <= 40 && k.h <= 40) };
      fundo = null;
    };
    // (sem detalhes de chão: o arquivo era do CraftPix, removido)
  }
  // o hash do pixel.js mistura pouco os bits e deixa listras em diagonal no ruído; este mistura mais (0..1)
  function hashPL(a, b, c) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function ruidoPL(x, y, seed) { // ruído de valor suave, 0..1
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sm = (q) => q * q * (3 - 2 * q);
    const a = hashPL(ix, iy, seed), b = hashPL(ix + 1, iy, seed), c = hashPL(ix, iy + 1, seed), d = hashPL(ix + 1, iy + 1, seed);
    return a * (1 - sm(fx)) * (1 - sm(fy)) + b * sm(fx) * (1 - sm(fy)) + c * (1 - sm(fx)) * sm(fy) + d * sm(fx) * sm(fy);
  }
  const terrenoEm = (x, y) => (mapa ? mapa[Math.max(0, Math.min(H - 1, Math.round(y))) * W + Math.max(0, Math.min(W - 1, Math.round(x)))] : 'g');
  // Monta o chão do bioma sorteado: classe de terreno por pixel (ruído suave), textura dos tiles puros e contorno de 1 px.
  // O miolo da arena é sempre grama; no lago e na montanha há uma mancha grande de um lado (água com faixa de areia, ou pedra).
  function montarChao(gg) {
    const R = RECEITA[bioma], tex = {};
    for (const t of Object.keys(R)) tex[t] = PL_PURO[R[t][0]][R[t][1]];
    const lado = [[180, -30], [180, 670], [-50, 330], [410, 330]][Math.floor(hashPL(1, 2, semente) * 4)];
    mapa = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dc = Math.hypot(x - 180, y - 338), miolo = Math.max(0, (150 - dc) / 40);
      const n = ruidoPL(x / 90, y / 90, semente) * 0.7 + ruidoPL(x / 28, y / 28, semente + 1) * 0.3;
      let t = 'g';
      if (bioma === 'campo' || bioma === 'floresta' || bioma === 'vila') { if (n + miolo < 0.38) t = bioma === 'floresta' ? 'f' : 'd'; }
      else {
        const f = Math.hypot(x - lado[0], y - lado[1]) - (bioma === 'lago' ? 210 : 230) + (n - 0.5) * 140 + miolo * 120;
        if (f < 0) t = bioma === 'lago' ? 'w' : 'r';
        else if (bioma === 'lago' && f < 40) t = 'a';
        else if (bioma === 'montanha' && n + miolo < 0.2) t = 'r';
      }
      mapa[y * W + x] = t;
    }
    const img = gg.createImageData(W, H), d = img.data;
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = mapa[y * W + x], v = tex[t], tile = v[Math.floor(hashPL(x >> 5, y >> 5, 5) * v.length)];
      const o = (y * W + x) * 4, s = (((y & 31) * T_CHAO) + (x & 31)) * 4;
      const borda = t !== 'g' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { // vizinho de outro terreno (dentro da tela)
        const nx = x + a, ny = y + b;
        return nx >= 0 && nx < W && ny >= 0 && ny < H && mapa[ny * W + nx] !== t;
      });
      if (borda) { const c = hex(BORDA[t]); d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; } else { d[o] = tile.data[s]; d[o + 1] = tile.data[s + 1]; d[o + 2] = tile.data[s + 2]; }
      d[o + 3] = 255;
    }
    gg.putImageData(img, 0, 0);
  }
  // Quadros de andar e ataque (sprites-pixellab/animacoes/), 4 por pose; a escala é a da sprite parada
  const PL_ANIM = {};
  if (USA_PL) ['fagulhao', 'mareal', 'musgarra'].forEach((id) => {
    PL_ANIM[id] = { andar: [], ataque: [] };
    ['andar', 'ataque'].forEach((pose) => {
      for (let n = 1; n <= 4; n++) {
        const im = new Image();
        im.onload = () => { PL_ANIM[id][pose][n - 1] = plCaixa(im); };
        im.src = 'sprites-pixellab/animacoes/' + id + '-' + pose + '-' + n + '.png';
      }
    });
  });
  // Desenha a sprite com a base em (x, y), centralizada; espelha se flip. p é o quadro (padrão: a sprite parada)
  // Silhueta de uma sprite numa cor só (cache na própria sprite): base do brilho do frenesi
  function silueta(p, cor) {
    p['_s' + cor] = p['_s' + cor] || (() => { const t = document.createElement('canvas'); t.width = p.w; t.height = p.h; const tc = t.getContext('2d'); tc.drawImage(p.im, p.x0, p.y0, p.w, p.h, 0, 0, p.w, p.h); tc.globalCompositeOperation = 'source-atop'; tc.fillStyle = cor; tc.fillRect(0, 0, p.w, p.h); return t; })();
    return p['_s' + cor];
  }
  function desenharPL(gg, k, x, y, flip, alfa, p = PL[k], branco = false, forma = null) {
    const s = ALT_PL[k] < 10 ? ALT_PL[k] : ALT_PL[k] / PL[k].h, w = p.w * s, h = p.h * s;
    gg.save(); gg.imageSmoothingEnabled = false; gg.globalAlpha = alfa;
    gg.translate(Math.round(x), Math.round(y));
    if (forma) { gg.rotate(forma.rot); gg.scale(forma.sx, forma.sy); } // squash/stretch e inclinação, com o pivô nos pés (antes do espelho: a inclinação não inverte)
    if (flip) gg.scale(-1, 1);
    let im = p.im, sx = p.x0, sy = p.y0, sw = p.w, sh = p.h;
    if (branco) { // piscada de dano: a silhueta da sprite toda branca (source-atop pinta só onde há pixel)
      const t = document.createElement('canvas'); t.width = sw; t.height = sh;
      const tc = t.getContext('2d'); tc.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
      tc.globalCompositeOperation = 'source-atop'; tc.fillStyle = '#ffffff'; tc.fillRect(0, 0, sw, sh);
      im = t; sx = 0; sy = 0;
    }
    const dx0 = Math.round(-w / 2), dy0 = Math.round(-h), ww = Math.round(w), hh = Math.round(h);
    const fren = forma && forma.frenesi && !branco, pulso = fren ? Math.sin(forma.t / 90) : 0;
    if (fren) { const sil = silueta(p, '#ff3a1a'); gg.globalAlpha = alfa * (0.4 + 0.15 * pulso); for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) gg.drawImage(sil, 0, 0, sw, sh, dx0 + ox, dy0 + oy, ww, hh); gg.globalAlpha = alfa; } // brilho: contorno vermelho atrás
    gg.drawImage(im, sx, sy, sw, sh, dx0, dy0, ww, hh);
    if (fren) { gg.globalAlpha = alfa * (0.22 + 0.12 * pulso); gg.drawImage(silueta(p, '#ff3a1a'), 0, 0, sw, sh, dx0, dy0, ww, hh); } // e um tom avermelhado por cima
    gg.restore();
  }

  // Desenha um quadro de uma folha com o pivô em (x, y). Devolve false quando um efeito de uma vez já acabou.
  function drawFx(nome, x, y, ms, o = {}) {
    const f = FX[nome];
    if (!f) return false;
    const pf = f.j.meta.pixelfx, n = f.j.frames.length, q = Math.floor((ms / 1000) * pf.fps);
    if (!pf.loop && q >= n) return false;
    const fr = f.j.frames[pf.loop ? q % n : q].frame, s = (o.escala || ESCALA_FX[nome] || 1) * 0.8; // efeitos 20% menores, junto com os monstros
    g.save(); g.imageSmoothingEnabled = false;
    if (o.flip) { // espelha em volta do pivô
      g.translate(Math.round(x), Math.round(y)); g.scale(-1, 1);
      g.drawImage(f.im, fr.x, fr.y, fr.w, fr.h, -Math.round(pf.pivot[0] * s), -Math.round(pf.pivot[1] * s), Math.round(fr.w * s), Math.round(fr.h * s));
    } else {
      g.drawImage(f.im, fr.x, fr.y, fr.w, fr.h, Math.round(x - pf.pivot[0] * s), Math.round(y - pf.pivot[1] * s), Math.round(fr.w * s), Math.round(fr.h * s));
    }
    g.restore();
    return true;
  }

  const CORES = {
    fogo: { c: '#e0703a', d: '#b04a22', l: '#f2a050', a: '#ffd35a' },
    agua: { c: '#4aa3d8', d: '#2f78a8', l: '#8ccdf0', a: '#f4f1e6' },
    terra: { c: '#a8793f', d: '#74502c', l: '#d8b878', a: '#8dbb55' },
    ar: { c: '#bfe0f0', d: '#8fb8d0', l: '#f4f9fc', a: '#7fd0e8' },
    eletrico: { c: '#f0d048', d: '#b8962a', l: '#fff2a0', a: '#6fd6ff' },
  };
  // Partículas de impacto por elemento: cores e gravidade (fogo sobe, água e terra caem)
  const ESTILO = {
    fogo: { grav: -0.04, cores: ['#ffd35a', '#e0703a', '#b04a22'] },
    agua: { grav: 0.1, cores: ['#8ccdf0', '#4aa3d8', '#f4f1e6'] },
    terra: { grav: 0.14, cores: ['#a8793f', '#74502c', '#d8b878'] },
    ar: { grav: -0.01, cores: ['#f4f9fc', '#bfe0f0', '#7fd0e8'] },
    eletrico: { grav: 0, cores: ['#fff2a0', '#f0d048', '#6fd6ff'] },
  };

  // ---------- ícones dos elementos (sprites de texto) ----------
  const ICONES = {
    fogo: { map: { a: '#e0703a', b: '#ffd35a', o: OUT }, rows: ['....o....', '...oao...', '..oaaao.o', '.oaabaaoo', '.oabbbaao', 'oaabbbbao', 'oaabbbbao', 'oaaabbaao', '.oaaaaao.', '..ooooo..'] },
    agua: { map: { a: '#4aa3d8', b: '#bfe8ff', o: OUT }, rows: ['....o....', '...oao...', '...oao...', '..oaaao..', '..oabaao.', '.oaabaaao', '.oaabaaao', '.oaaaaaao', '..oaaaao.', '...oooo..'] },
    terra: { map: { a: '#a8793f', b: '#d8b878', c: '#74502c', o: OUT }, rows: ['....o....', '...oao...', '..oabao..', '.oabbbao.', '.oaabbaao', 'oaaaaaaao', 'oaacaaaao', 'ooooooooo'] },
    ar: { map: { a: '#bfe0f0', b: '#ffffff', o: OUT }, rows: ['...ooo.....', '..oaaaoo...', '.oaaaaaaoo.', 'oaabbaaaaao', 'oaaaaaaaaao', '.ooooooooo.'] },
    eletrico: { map: { a: '#f0d048', o: OUT }, rows: ['....ooo', '...oaao', '..oaao.', '.oaaaoo', 'oaaaaao', 'ooooaao', '...oao.', '..oaao.', '..oao..', '..oo...'] },
  };
  const cacheIcone = {};
  function iconeCanvas(el) {
    if (!cacheIcone[el]) {
      const d = ICONES[el], c = document.createElement('canvas');
      c.width = d.rows[0].length; c.height = d.rows.length;
      sprite(c.getContext('2d'), d.rows, d.map, 0, 0);
      cacheIcone[el] = c;
    }
    return cacheIcone[el];
  }
  // dataURL do ícone ampliado (inteiro), para as cartas HTML
  function icone(el, esc) {
    const o = iconeCanvas(el), c = document.createElement('canvas');
    c.width = o.width * esc; c.height = o.height * esc;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(o, 0, 0, c.width, c.height);
    return c.toDataURL();
  }
  const desenharIcone = (g, el, cx, cy) => { const o = iconeCanvas(el); g.drawImage(o, Math.round(cx - o.width / 2), Math.round(cy - o.height / 2)); };

  // [dx, dy, rx, ry] a partir do pé; o sprite olha para a direita
  const FORMAS = {
    fagulhao: { corpo: [0, -8, 9, 6], cabeca: [7, -14, 7, 6], cauda: [-13, -9, 6, 4], extra: 'chama', orelhas: 'ponta' },
    chamuscao: { corpo: [0, -10, 12, 9], cabeca: [8, -17, 7, 6], cauda: [-14, -9, 4, 3], extra: 'brasas', orelhas: 'redonda' },
    mareal: { corpo: [0, -9, 11, 7], cabeca: [7, -12, 8, 7], cauda: [-14, -9, 5, 4], extra: 'nadadeira', boca: true },
    pingolino: { corpo: [0, -12, 8, 11], cabeca: [3, -24, 6, 5], cauda: [-9, -7, 3, 3], extra: 'gota' },
    brotinho: { corpo: [0, -8, 8, 6], cabeca: [6, -14, 6, 6], cauda: [-11, -6, 3, 2], extra: 'broto' },
    musgarra: { corpo: [0, -11, 13, 10], cabeca: [11, -9, 5, 4], cauda: [-14, -5, 3, 2], extra: 'casco' },
    ventinho: { corpo: [0, -13, 8, 7], cabeca: [5, -20, 5, 5], cauda: [-10, -11, 4, 2], extra: 'asas' },
    nuvelino: { corpo: [0, -10, 12, 8], cabeca: [9, -12, 6, 5], cauda: [-13, -10, 5, 3], extra: 'nuvem' },
    faiscao: { corpo: [0, -8, 8, 6], cabeca: [7, -14, 6, 6], cauda: [-11, -8, 2, 2], extra: 'raio', orelhas: 'ponta' },
    trovinho: { corpo: [0, -10, 10, 8], cabeca: [6, -16, 6, 5], cauda: [-12, -8, 3, 2], extra: 'espinhos', orelhas: 'redonda' },
  };
  const TUFO = [
    '..l....l..l.',
    '..gl..lg.lg.',
    '.gdgl.gdlgd.',
    '.gdgdlgdgdg.',
    '..gdgdgdgd..',
    '...dgdgdg...',
    '....ddgd....',
  ];
  const TUFO_MAP = { l: '#8dbb55', g: '#5c9a3c', d: '#2f5a2e' };

  function mato(g, x, y, cols, rows) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const tx = x + c * 13 + (r % 2) * 6, ty = y + r * 7;
      if (USA_PL && PL.grama) desenharPL(g, 'grama', tx + 6, ty + 7, false, 1);
      else sprite(g, TUFO, TUFO_MAP, tx, ty);
    }
  }

  const PROPS_PL = ['carvalho', 'pinheiro', 'pedra', 'pedramusgo', 'pedras', 'grama', 'arbusto', 'flores', 'toco', 'junco', 'nenufar', 'rochedo'];
  // Cenário do PixelLab por bioma: props sorteados pela semente da luta (só onde o terreno deixa), fora do miolo da arena;
  // tufos rente ao chão e o resto ordenado por profundidade. Os mesmos sprites servem a vários biomas.
  function cenarioPL(gg) {
    const al = (t, c) => hashPL(t, c, semente);
    const perto = (x, y, t) => [-1, 0, 1].some((b) => [-1, 0, 1].some((a) => terrenoEm(x + a * T_CHAO, y + b * T_CHAO) === t));
    const espalhar = (n, rmin, cod, ok, exige) => { // n pontos em terreno de `ok` (e perto do terreno `exige`, se pedido)
      const out = [];
      for (let t = 0; out.length < n && t < n * 60; t++) {
        const x = Math.round(8 + al(t, cod) * (W - 16)), y = Math.round(30 + al(t, cod + 50) * (H - 60));
        if (Math.hypot(x - 180, y - 338) >= rmin && ok.includes(terrenoEm(x, y)) && (!exige || perto(x, y, exige))) out.push([x, y]);
      }
      return out;
    };
    let itens = [];
    const mais = (n, rmin, cod, ok, k, exige) => espalhar(n, rmin, cod, ok, exige).forEach(([x, y], i) => itens.push([x, y, typeof k === 'function' ? k(i) : k]));
    const K = (...ks) => ks.filter((k) => PL[k]), pick = (lista, cod = 640) => (i) => lista[Math.floor(al(i, cod) * lista.length) % lista.length];
    const arbustoK = (i) => (PL.frutinhas && al(i, 610) < 0.45 ? 'frutinhas' : 'arbusto'), florK = (i) => (PL.floresazuis && al(i, 620) < 0.5 ? 'floresazuis' : 'flores');
    const pedras = (i) => ['pedra', 'pedramusgo', 'pedras'][Math.floor(al(i, 600) * 3)];
    fumacaCasa = null; casaCaixa = null;
    if (DET) { // detalhes rentes ao chão: tufos de grama sobre a grama e manchas de terra onde há terra, areia ou pedra
      const solta = (n, cod, ok, lista) => espalhar(n, 0, cod, ok).forEach(([x, y], i) => { const r = lista[Math.floor(al(i, cod + 7) * lista.length) % lista.length]; gg.drawImage(detIm, r.x, r.y, r.w, r.h, Math.round(x - r.w / 2), Math.round(y - r.h), r.w, r.h); });
      solta(bioma === 'montanha' ? 50 : 90, 950, 'g', DET.verde);
      solta(bioma === 'floresta' ? 30 : 22, 960, bioma === 'floresta' ? 'f' : 'd', DET.marrom);
      if (bioma === 'lago') solta(18, 970, 'a', DET.marrom); else if (bioma === 'montanha') solta(26, 970, 'r', DET.marrom);
    }
    espalhar(bioma === 'lago' ? 24 : bioma === 'montanha' ? 12 : 30, 150, 100, 'g').forEach(([x, y]) => desenharPL(gg, 'grama', x, y, false, 1));
    if (bioma === 'lago') {
      mais(10, 140, 200, 'w', 'nenufar'); mais(16, 140, 210, 'a', 'junco', 'w'); mais(5, 150, 220, 'ag', pedras);
      mais(11, 152, 230, 'g', florK); mais(8, 160, 240, 'g', arbustoK);
      if (K('salgueiro1', 'salgueiro3').length) mais(5, 150, 250, 'g', pick(K('salgueiro1', 'salgueiro3')), 'a'); // salgueiros perto da água
    } else if (bioma === 'montanha') {
      mais(7, 150, 200, 'r', 'rochedo'); mais(12, 150, 210, 'rg', pedras);
      mais(4, 152, 220, 'g', florK); mais(4, 160, 230, 'g', arbustoK);
      if (K('rocha_a').length) mais(7, 150, 260, 'rg', pick(K('rocha_a', 'rocha_b', 'rocha_p1', 'rocha_p2', 'pedra_azul')));
    } else if (bioma === 'vila') {
      mais(12, 152, 200, 'gd', florK); mais(8, 160, 210, 'gd', arbustoK); mais(5, 158, 230, 'gd', pedras);
      if (K('caixas', 'poco', 'espantalho').length) { mais(3, 165, 270, 'gd', pick(K('caixas', 'toco_a', 'toco_b'), 641)); mais(1, 170, 275, 'gd', 'poco'); mais(1, 170, 280, 'gd', 'espantalho'); mais(3, 160, 285, 'gd', pick(K('cogumelos_verm', 'cerca_longa'), 642)); }
      if (PL.casa) { // a casa num canto de cima, com a fumaça da chaminé e algumas pedras do caminho até a porta
        const esq = al(1, 900) < 0.5, cx = esq ? 100 : 260, base = 236, porta = cx + 31, sinal = esq ? 1 : -1;
        itens = itens.filter(([x, y]) => !(x > cx - 74 && x < cx + 74 && y > base - 140 && y < base + 70)); // nada em cima da casa
        itens.push([cx, base, 'casa']);
        if (PL.pedrisco) [[0, 42], [sinal * 12, 62], [sinal * 26, 82], [sinal * 44, 100]].forEach(([dx, dy]) => itens.push([porta + dx, base + dy, 'pedrisco'])); // a pedra tem ~31 px de altura e é desenhada de baixo para cima: começa 42 px abaixo da base para não subir sobre a parede
        casaCaixa = { x0: cx - 66, x1: cx + 66, y0: base - 136, y1: base + 14 }; // área da casa (os objetos quebráveis e o resto não entram aqui)
        fumacaCasa = { x: cx - 58 + 2, y: base - 128 - 16 }; // canto do quadro de 48x48 da fumaça
      }
    } else {
      mais(14, 152, 200, 'gdf', florK); mais(10, 160, 210, 'gdf', arbustoK);
      mais(2, 165, 220, 'gdf', 'toco'); mais(8, 158, 230, 'gdf', pedras);
      if (bioma === 'floresta' && K('cogumelo_br').length) { mais(9, 155, 270, 'gdf', pick(K('cogumelo_br', 'cogumelo_br2', 'laranja', 'cogumelos_verm', 'cogumelo_bege'))); mais(5, 158, 275, 'gdf', pick(K('samambaia', 'toco_raiz'), 643)); }
      if (bioma === 'campo' && K('toco_a').length) mais(4, 160, 265, 'gdf', pick(K('toco_a', 'toco_b', 'cogumelos_verm'), 644));
    }
    const arvOk = bioma === 'lago' ? 'g' : 'gdfr';
    const LISTAS = {
      montanha: ['pinheiro', 'pinheiro', 'pinheiro', 'branca2', 'branca1', 'carvalho'],
      lago: ['carvalho', 'betula', 'rosa', 'macieira', 'salgueiro3'],
      floresta: ['pinheiro', 'carvalho', 'betula', 'arvore_escura', 'arvore_escura2', 'luminosa3', 'bolas_azuis', 'espiral', 'curva'],
      vila: ['macieira', 'macieira2', 'carvalho_grande', 'carvalho3', 'betula', 'carvalho'],
      campo: ['pinheiro', 'carvalho', 'betula', 'outono', 'rosa', 'macieira', 'carvalho_grande'],
    };
    const arvore = (x, y, u) => { if (!arvOk.includes(terrenoEm(x, y))) return; const kinds = K(...(LISTAS[bioma] || LISTAS.campo)); itens.push([x, y, kinds[Math.floor(u * kinds.length) % kinds.length]]); };
    for (let i = 0; i < 6; i++) for (const y of [44, 74, 598, 632]) arvore(Math.round(20 + i * 62 + al(i + y, 700) * 14), y + Math.round(al(i + y, 701) * 8 - 4), al(i + y, 702)); // mata em cima e embaixo
    [[12, 150], [348, 190], [8, 270], [352, 330], [12, 420], [348, 470], [10, 540], [350, 90]].forEach(([x, y], i) => arvore(x, y + Math.round(al(i, 800) * 20 - 10), al(i, 801))); // laterais
    if (bioma === 'vila' && fumacaCasa) { const hx = fumacaCasa.x + 56, hy = fumacaCasa.y + 144; itens = itens.filter(([x, y, k]) => k === 'casa' || k === 'pedrisco' || !(x > hx - 74 && x < hx + 74 && y > hy - 140 && y < hy + 20)); } // árvores das bordas também não cobrem a casa
    itens.sort((a, b) => a[1] - b[1]).forEach(([x, y, k]) => desenharPL(gg, k, x, y + 2, false, 1));
  }

  // Fumaça da chaminé da casa da vila (Smoke_animation.png: 6 quadros de 48x48), desenhada por cima do fundo estático
  let fumacaCasa = null, fumacaIm = null, casaCaixa = null;
  function desenharFumaca(agora) {
    if (!fumacaCasa) return;
    if (!fumacaIm) { fumacaIm = new Image(); /* sem fumaça: o arquivo era do CraftPix, removido */ }
    if (!fumacaIm.complete || !fumacaIm.naturalWidth) return;
    const q = Math.floor(agora / 130) % 6;
    g.imageSmoothingEnabled = false;
    g.drawImage(fumacaIm, q * 48, 0, 48, 48, Math.round(fumacaCasa.x), Math.round(fumacaCasa.y), 48, 48);
  }

  function montarFundo() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (biomaPedido === 'ginasio' && GINASIO) { // quadra pronta + anel branco do círculo central em volta do emblema
      bioma = 'ginasio'; mapa = null; g.drawImage(GINASIO, 0, 0, W, H);
      g.strokeStyle = '#e8e0d0'; g.lineWidth = 3; g.beginPath(); g.arc(180, 368, 33, 0, Math.PI * 2); g.stroke();
      return c;
    }
    const disponiveis = USA_PL ? Object.keys(RECEITA).filter((b) => Object.values(RECEITA[b]).every(([k]) => PL_PURO[k])) : [];
    if (disponiveis.length && PROPS_PL.every((k) => PL[k])) { // um bioma sorteado por luta: campo, floresta, lago ou montanha
      semente = Math.floor(Math.random() * 1e4);
      const fixo = biomaPedido || (location.search.match(/bioma=(\w+)/) || [])[1]; // cenário escolhido na tela, ou ?bioma=lago para conferência
      bioma = disponiveis.includes(fixo) ? fixo : disponiveis[Math.floor(Math.random() * disponiveis.length)];
      montarChao(g); cenarioPL(g);
      return c;
    }
    drawGround(g, W, H);
    mato(g, 250, 128, 3, 2); mato(g, -6, 282, 2, 3); mato(g, 40, 520, 3, 2); mato(g, 318, 392, 2, 3);
    const arvores = [[40, 200], [318, 480]];
    for (let i = 0; i < 5; i++) arvores.push([20 + i * 70, 44], [55 + i * 70, 74], [55 + i * 70, 598], [20 + i * 70, 632]);
    arvores.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => drawTree(g, x, y));
    return c;
  }

  const S = 1.15; // escala da geometria dos monstros (era 1.8: 25% menores); contorno e pixels continuam de 1 px
  const r = (n) => Math.round(n * S);

  function monstro(g, m, x, y, t, flip, flash, alpha, prog, pulo = 0, forma = null) { // prog: 0..1 durante a investida, null fora dela; pulo: px acima do chão
    const f = FORMAS[m.id], k = CORES[m.tipo];
    const col = (c) => (flash ? '#ffffff' : c);
    const sx = (dx, w = 0) => x + (flip ? -(r(dx) + r(w)) : r(dx));
    const P = (dx, dy, w, h, c) => px(g, sx(dx, w), y + r(dy), Math.max(1, r(w)), Math.max(1, r(h)), c);
    y += Math.floor(t / 350) % 2 ? -1 : 0; // respiração
    g.globalAlpha = alpha;
    ellipse(g, x, y + 1, r(12) * Math.max(0.25, 1 - pulo / 40), r(4) * Math.max(0.25, 1 - pulo / 40), 'rgba(20,40,20,0.35)'); // a sombra encolhe no pulo
    y -= pulo;
    if (USA_PL && PL[m.id]) {
      const an = PL_ANIM[m.id], parado = prog == null; // sem quadros de animação, fica a sprite parada
      const quadros = an && (parado ? an.andar : an.ataque), i = parado ? Math.floor(t / 250) % 4 : Math.min(3, Math.floor(prog * 4));
      desenharPL(g, m.id, x, y + 2, flip, alpha, (quadros && quadros[i]) || PL[m.id], flash, forma);
      g.globalAlpha = 1; return;
    }
    const blob = (dx, dy, rx, ry, c) => {
      ellipse(g, x + (flip ? -r(dx) : r(dx)), y + r(dy), r(rx) + 1, r(ry) + 1, OUT);
      ellipse(g, x + (flip ? -r(dx) : r(dx)), y + r(dy), r(rx), r(ry), col(c));
    };
    if (!f) { g.globalAlpha = 1; return; } // espécie só com PNG (PixelLab) e o PNG ainda não carregou: não há desenho em código
    const [cdx, cdy, crx, cry] = f.cauda;
    const [bx, by, brx, bry] = f.corpo;
    const [hx, hy, hrx, hry] = f.cabeca;
    const topo = by - bry;
    if (f.extra === 'asas') { const b = Math.floor(t / 130) % 2; blob(bx - 3, by - 4 - (b ? 5 : 0), 7, 3, k.l); } // asa de trás
    if (f.extra === 'raio') { // cauda em zigue-zague
      P(cdx - 1, cdy + 4, 5, 2, OUT); P(cdx - 4, cdy + 2, 4, 3, col(k.d)); P(cdx - 1, cdy - 1, 5, 3, col(k.c)); P(cdx - 4, cdy - 4, 4, 3, col(k.a)); P(cdx - 6, cdy - 7, 3, 3, col(k.l));
    } else blob(cdx, cdy, crx, cry, k.d);
    if (f.extra === 'chama') {
      const fl = Math.floor(t / 120) % 2;
      blob(cdx - 3, cdy - 6 - fl, 2, 4, k.a);
      blob(cdx - 3, cdy - 5 - fl, 1, 2, k.l);
    }
    blob(bx, by, brx, bry, k.c);
    ellipse(g, x + (flip ? -r(bx + 2) : r(bx + 2)), y + r(by + 2), Math.round(r(brx) * 0.5), Math.round(r(bry) * 0.45), col(k.l));
    for (const dx of [-6, 3]) { P(dx, -2, 4, 3, OUT); P(dx + 1, -2, 2, 2, col(k.d)); } // pés
    blob(hx, hy, hrx, hry, k.c);
    if (f.orelhas === 'ponta') for (const d of [-4, 2]) blob(hx + d, hy - 7, 2, 3, k.c);
    if (f.orelhas === 'redonda') for (const d of [-4, 3]) blob(hx + d, hy - 5, 2, 2, k.c);
    P(hx + 2, hy - 1, 2, 2, '#ffffff'); // olho
    P(hx + 3, hy - 1, 1, 2, OUT);
    if (f.boca) P(hx + 4, hy + 2, 3, 1, OUT);
    if (f.extra === 'asas') { const b = Math.floor(t / 130) % 2; blob(bx + 1, by - 2 - (b ? 0 : 5), 7, 3, k.l); } // asa da frente
    if (f.extra === 'nuvem') { blob(bx - 5, topo + 1, 5, 4, k.l); blob(bx + 3, topo - 1, 6, 5, k.l); }
    if (f.extra === 'brasas') for (let i = 0; i < 3; i++) if ((Math.floor(t / 200) + i) % 3) P(-6 + i * 5, topo - 1, 2, 2, col(k.a));
    if (f.extra === 'nadadeira') { P(-2, topo - 3, 6, 3, OUT); P(-1, topo - 2, 4, 2, col(k.l)); }
    if (f.extra === 'gota') blob(hx, hy - hry - 3, 2, 3, '#8ccdf0');
    if (f.extra === 'broto') { blob(hx - 3, hy - hry - 3, 3, 2, '#5c9a3c'); blob(hx + 3, hy - hry - 5, 3, 2, '#8dbb55'); }
    if (f.extra === 'casco') { P(-7, topo + 3, 4, 2, col(k.l)); P(1, topo + 1, 3, 2, col(k.l)); P(-2, topo, 2, 2, col(k.a)); }
    if (f.extra === 'espinhos') {
      const pisca = Math.floor(t / 110) % 2;
      for (let i = 0; i < 3; i++) { P(-6 + i * 5, topo - 5 - (i === 1 ? 2 : 0), 2, 5, OUT); P(-6 + i * 5, topo - 4 - (i === 1 ? 2 : 0), 2, 4, col(k.a)); }
      if (pisca) P(7, topo - 1, 3, 1, col(k.l));
    }
    g.globalAlpha = 1;
  }

  // ---------- HUD ----------
  const chanfro = (g, x, y, w, h, c) => { px(g, x + 2, y, w - 4, h, c); px(g, x, y + 2, w, h - 4, c); px(g, x + 1, y + 1, w - 2, h - 2, c); };
  function seta(g, x, y, cima, c) { // seta 5x4
    if (cima) { px(g, x + 2, y, 1, 1, c); px(g, x + 1, y + 1, 3, 1, c); px(g, x, y + 2, 5, 2, c); }
    else { px(g, x, y, 5, 2, c); px(g, x + 1, y + 2, 3, 1, c); px(g, x + 2, y + 3, 1, 1, c); }
  }
  // Cores e rótulos dos status (a lógica manda em bt.lados[i].st: { veneno|lento|paralisia|stun: { ate, dur } })
  const STATUS = { veneno: { c: '#5cc84a', l: 'V' }, lento: { c: '#5ab0ff', l: 'L' }, paralisia: { c: '#ffd35a', l: 'P' }, stun: { c: '#ff6a5a', l: '*' }, forca: { c: '#ff9a3a', l: 'F' } };
  const mistura = (c1, c2, t) => { const f = (c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16)); const A = f(c1), Bc = f(c2); return '#' + A.map((v, k) => Math.round(v + (Bc[k] - v) * t).toString(16).padStart(2, '0')).join(''); };
  // foto do monstro dentro de uma moldura (sprite do PixelLab ou, com ?codigo, o desenho em código), olhando para o centro da arena
  function retrato(g, m, x, y, lado, flip, agora, dano) {
    const k = CORES[m.tipo];
    chanfro(g, x, y, lado, lado, PAL.uiWood);
    px(g, x + 2, y + 2, lado - 4, lado - 4, k.d); px(g, x + 2, y + 2, lado - 4, (lado - 4) >> 1, k.c);
    g.save(); g.beginPath(); g.rect(x + 2, y + 2, lado - 4, lado - 4); g.clip();
    const bob = Math.round(Math.sin(agora / 260 + x) * 1), p = USA_PL && PL[m.id];
    if (p) {
      const e = (lado - 6) / Math.max(p.w, p.h), w = Math.round(p.w * e), h = Math.round(p.h * e), cx = x + lado / 2, by = y + lado - 3 + bob;
      g.save(); g.imageSmoothingEnabled = false; g.translate(cx, 0); if (flip) g.scale(-1, 1);
      g.drawImage(p.im, p.x0, p.y0, p.w, p.h, -w / 2, by - h, w, h); g.restore();
    } else monstro(g, m, Math.round(x + lado / 2), y + lado - 4 + bob, agora, flip, false, 1, null);
    if (dano > 0) { g.globalAlpha = 0.55 * dano; g.fillStyle = '#ff3a2a'; g.fillRect(x, y, lado, lado); }
    g.restore();
  }
  // hp = vida animada, lag = faixa que mostra o dano recente; dano (0..1) = quão recente foi o golpe (treme, brilha e fica vermelho)
  function painel(g, x, y, w, i, m, hp, lag, agora, dano, pronto = false) {
    const k = CORES[m.tipo], rh = Math.max(0, hp) / m.hp, rl = Math.max(0, lag) / m.hp, baixa = rh < 0.25 && rh > 0;
    if (dano > 0) { x += Math.round((Math.random() - 0.5) * 4 * dano); y += Math.round((Math.random() - 0.5) * 2 * dano); }
    const pulso = baixa && Math.floor(agora / 220) % 2;
    const br = pronto ? 0.5 + 0.5 * Math.sin(agora / 180) : 0; // ultimate carregado: brilho dourado pulsando em volta do painel e borda mais clara
    if (pronto) for (let d = 6; d >= 1; d--) { g.globalAlpha = (0.22 + 0.3 * br) * (7 - d) / 6; px(g, x - d, y - d, w + 2 * d, 52 + 2 * d, d > 3 ? '#ffb02a' : '#ffe27a'); } g.globalAlpha = 1;
    chanfro(g, x, y, w, 52, pulso ? '#c8383a' : pronto ? (br > 0.5 ? '#fff0a0' : '#ffd35a') : PAL.gold);
    chanfro(g, x + 2, y + 2, w - 4, 48, PAL.parchment);
    retrato(g, m, x + 5, y + 5, 34, i === 1, agora, dano);
    chanfro(g, x + 29, y + 29, 14, 14, PAL.uiWood); px(g, x + 31, y + 31, 10, 10, k.d); desenharIcone(g, m.tipo, x + 36, y + 36); // medalhão do elemento no canto da foto
    g.font = '700 11px "Pixelify Sans", monospace'; g.textBaseline = 'top'; g.fillStyle = '#3b2616';
    g.textAlign = 'left'; g.fillText(m.nome, x + 46, y + 5);
    g.font = '700 9px "Pixelify Sans", monospace'; g.fillStyle = '#8a6a3a'; g.fillText('Nv ' + (m.nivel || 10) + (B.FAMILIAS[m.familia] ? ' · ' + B.FAMILIAS[m.familia].nome : ''), x + 46, y + 17);
    g.font = '700 11px "Pixelify Sans", monospace'; g.fillStyle = baixa && pulso ? '#c8383a' : '#3b2616';
    g.textAlign = 'right'; g.fillText(Math.max(0, Math.round(hp)) + '/' + m.hp, x + w - 7, y + 5);
    // barra de vida: cor que desliza de verde a vermelho, faixa de dano, brilho que corre, piscada no golpe e pulso quando está no fim
    const bx = x + 46, by = y + 27, bw = w - 54, bh = 10;
    px(g, bx - 1, by - 1, bw + 2, bh + 2, '#3b2616'); px(g, bx, by, bw, bh, '#241810');
    px(g, bx, by, Math.round(bw * rl), bh, '#ff9a6a');
    const cor = rh > 0.5 ? mistura('#e0c040', '#6fd66f', (rh - 0.5) * 2) : mistura('#c8383a', '#e0c040', rh * 2), fw = Math.round(bw * rh);
    px(g, bx, by, fw, bh, dano > 0.6 ? '#ffffff' : baixa && pulso ? '#ff8a8a' : cor);
    px(g, bx, by, fw, 3, 'rgba(255,255,255,0.35)'); px(g, bx, by + bh - 2, fw, 2, 'rgba(0,0,0,0.2)');
    if (fw > 6) { const gx = bx + ((agora / 14) % (bw + 24)) - 12; g.save(); g.beginPath(); g.rect(bx, by, fw, bh); g.clip(); g.globalAlpha = 0.5; px(g, gx, by, 4, bh, '#ffffff'); g.restore(); }
    for (let t = 1; t < 10; t++) px(g, bx + Math.round((bw * t) / 10), by, 1, bh, 'rgba(20,12,8,0.35)');
    // status ativos (chip com a letra e a barrinha do tempo que falta) e, à direita, forte contra (▲) e fraco contra (▼)
    const st = bt.lados[i].st || {}; let cx = bx;
    for (const n of Object.keys(STATUS)) {
      const e = st[n]; if (!e || e.ate <= bt.t) continue;
      const S2 = STATUS[n], resta = Math.min(1, (e.ate - bt.t) / (e.dur || 1));
      px(g, cx, y + 40, 11, 9, '#3b2616'); px(g, cx + 1, y + 41, 9, 7, S2.c);
      g.font = '700 8px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.fillStyle = '#1b1020'; g.fillText(S2.l, cx + 5.5, y + 40);
      px(g, cx + 1, y + 48, Math.max(1, Math.round(9 * resta)), 1, '#3b2616'); cx += 13;
    }
    const forte = B.VENCE[m.tipo], fraco = Object.keys(B.VENCE).find((e) => B.VENCE[e] === m.tipo);
    seta(g, x + w - 38, y + 40, true, '#3aa84a'); desenharIcone(g, forte, x + w - 28, y + 43);
    seta(g, x + w - 20, y + 40, false, '#c8383a'); desenharIcone(g, fraco, x + w - 10, y + 43);
  }

  // Pips do time embaixo de cada painel (cor do elemento; caído = escuro com X; em campo = borda branca) e o aviso do cenário
  const NOME_BIOMA = { campo: 'Campo', floresta: 'Floresta', lago: 'Lago', montanha: 'Montanha', vila: 'Vila', ginasio: 'Ginásio' }, NOME_EL = { fogo: 'Fogo', agua: 'Água', terra: 'Terra', ar: 'Ar', eletrico: 'Eletricidade' };
  function desenharTimes(g, agora) {
    for (const i of [0, 1]) {
      const time = bt.times[i], x0 = i === 0 ? 8 : 352 - time.length * 12;
      time.forEach((l, k) => {
        const x = x0 + k * 12, y = 62, c = CORES[l.m.tipo], vivo = l.hp > 0, ativo = bt.ativo[i] === k;
        px(g, x - 1, y - 1, 10, 10, ativo ? '#ffffff' : PAL.outline); px(g, x, y, 8, 8, vivo ? c.a : '#3a3a44');
        if (!vivo) { px(g, x + 1, y + 1, 1, 1, '#c8383a'); px(g, x + 2, y + 2, 1, 1, '#c8383a'); px(g, x + 3, y + 3, 2, 2, '#c8383a'); px(g, x + 5, y + 5, 1, 1, '#c8383a'); px(g, x + 6, y + 6, 1, 1, '#c8383a'); px(g, x + 6, y + 1, 1, 1, '#c8383a'); px(g, x + 1, y + 6, 1, 1, '#c8383a'); }
      });
    }
    if (bt.bioma && B.BIOMA_ELEMENTO[bt.bioma]) { // "Floresta · Terra +25%" no meio, discreto
      const el = B.BIOMA_ELEMENTO[bt.bioma], txt = NOME_BIOMA[bt.bioma] + ': ' + NOME_EL[el] + ' +' + Math.round((B.BONUS_BIOMA - 1) * 100) + '%';
      g.font = '700 9px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const w = g.measureText(txt).width + 22; g.globalAlpha = 0.6; px(g, 180 - w / 2, 59, w, 14, '#10101a'); g.globalAlpha = 1;
      desenharIcone(g, el, 180 - w / 2 + 8, 66); g.lineWidth = 3; g.strokeStyle = OUT; g.strokeText(txt, 180 + 8, 66); g.fillStyle = '#ffe9a8'; g.fillText(txt, 180 + 8, 66);
    }
  }

  // ---------- estado e animação (tempo real) ----------
  // O relógio do jogo (relogio) para durante o hit-stop; tremor e congelada usam o relógio real.
  const CENTRO = { x: 180, y: 340 };
  let hudHit = [-9999, -9999], kos = [null, null], entrou = [null, null]; // kos: monstro caído esperando o próximo; entrou: o que acabou de entrar
  let cv, g, fundo, bt, hpVis, hpLag, hpAlvo, acoes, relogio, ultimoReal, congelaAte;
  let discos, esferas, novas, pop, lance, recuo, acerto, aura, ko, tremor, proj, nums, parts, ondas, raios, feixes, rotulos, fantasmas, fxs, onos, esquiva, clarao, escudo, koAgendado;

  // ---------- objetos demolíveis: barris, caixotes e jarros que quebram quando uma investida, um projétil ou um impacto passa perto ----------
  let objetos = [], restos = [];
  const OBJ_COR = { barril: ['#6b4a2a', '#a07c4f', '#3a3a44'], caixote: ['#7a5a34', '#b8945a', '#4a3320'], jarro: ['#b8542a', '#e08a4a', '#7a3418'] };
  let GINASIO = null; { const im = new Image(); im.onload = () => { GINASIO = im; fundo = null; }; im.src = 'ui/mundo/novo/arena_ginasio.png'; }
  function criarObjetos() {
    objetos = []; restos = [];
    if (!USA_PL || bioma === 'ginasio') return; // no ginásio não há barris nem caixotes
    const tipos = ['barril', 'caixote', 'jarro'];
    for (let t = 0; objetos.length < 8 && t < 400; t++) {
      const a = hash(t, semente + 5) * Math.PI * 2, r = 60 + hash(t, semente + 6) * 120;
      const x = Math.round(CENTRO.x + Math.cos(a) * r * 0.95), y = Math.round(CENTRO.y + Math.sin(a) * r * 1.25);
      if (x < 30 || x > W - 30 || y < 110 || y > H - 120 || !'gdfa'.includes(terrenoEm(x, y))) continue;
      if (casaCaixa && x > casaCaixa.x0 - 16 && x < casaCaixa.x1 + 16 && y > casaCaixa.y0 && y < casaCaixa.y1 + 90) continue; // nem em cima da casa nem no caminho da porta
      if (objetos.some((o) => Math.hypot(o.x - x, o.y - y) < 40)) continue;
      objetos.push({ x, y, k: tipos[objetos.length % 3], vivo: true });
    }
  }
  function quebrar(o, quem) { // quem = lado que quebrou (leva o item, bom ou ruim); null se ninguém
    if (!o.vivo) return; o.vivo = false;
    const c = OBJ_COR[o.k];
    for (let k = 0; k < 12; k++) {
      const an = (k / 12) * Math.PI * 2 + hash(k, o.x) * 0.5, v = 1 + hash(k, 3) * 2;
      parts.push({ x: o.x, y: o.y - 8, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 1.6, g: 0.12, t0: relogio, vida: 700, c: c[k % 3], tam: 2 + (k % 2) });
    }
    nuvem(o.x, o.y - 4, 'poeira', 6, { anel: true, r0: 3, r1: 9 });
    ondas.push({ x: o.x, y: o.y - 8, t0: relogio, cor: c[1], grande: false });
    if (hash(o.x, o.y) < 0.05) ono(o.x, o.y - 18, o.k === 'jarro' ? 'CRAC!' : 'CRASH!', '#e0c48a', 6, 600);
    restos.push({ x: o.x, y: o.y, k: o.k });
    som('quebra', Math.max(-1, Math.min(1, (o.x - 180) / 140)) * 0.85);
    if (quem != null && B.item) agendar(120, () => B.item(bt, quem, Math.random).forEach(itemEv));
  }
  // quem passa perto no meio de uma investida, o projétil e o impacto do golpe quebram o que estiver no caminho
  function colideObjetos(agora) {
    for (const o of objetos) {
      if (!o.vivo) continue;
      for (const i of [0, 1]) { const l = lance[i]; if (l && agora - l.t0 < l.dur) { const p = pos(i, agora); if (Math.hypot(p.x - o.x, p.y - o.y) < (bt.tt[i].has('demolidor') ? 30 : 20)) { quebrar(o, i); break; } } }
    }
  }
  const quebraPerto = (x, y, r, quem) => objetos.forEach((o) => { if (o.vivo && Math.hypot(o.x - x, o.y - y) < r * (quem != null && bt.tt[quem].has('demolidor') ? 1.5 : 1)) quebrar(o, quem); });
  function desenharRestos() { for (const r of restos) { const c = OBJ_COR[r.k]; px(g, r.x - 7, r.y - 1, 4, 2, c[2]); px(g, r.x - 1, r.y, 5, 2, c[0]); px(g, r.x + 5, r.y - 1, 3, 2, c[1]); px(g, r.x - 3, r.y + 2, 3, 1, c[2]); } }

  function iniciar(canvas, batalha, cena) {
    biomaPedido = cena || null; // cenário escolhido na tela de escolha; sem ele, sorteia
    cv = canvas; g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    if (USA_PL) fundo = null; // cenário novo (bioma e props) a cada luta
    fundo = fundo || montarFundo();
    criarObjetos();
    bt = batalha;
    hpVis = bt.lados.map((l) => l.hp); hpLag = hpVis.slice(); hpAlvo = hpVis.slice();
    acoes = []; relogio = 0; ultimoReal = performance.now(); congelaAte = 0;
    discos = []; esferas = []; novas = []; pop = [null, null]; lance = [null, null]; recuo = [null, null]; acerto = [null, null]; aura = [null, null];
    hudHit = [-9999, -9999]; kos = [null, null]; entrou = [null, null]; ko = null; tremor = null; proj = []; nums = []; parts = []; ondas = []; nuvens = []; rachas = []; raios = []; feixes = []; rotulos = []; fantasmas = []; fxs = [];
    onos = []; esquiva = [null, null]; clarao = null; escudo = [null, null]; koAgendado = false;
    if (window.PixmonSom) { window.PixmonSom.ambiente(bioma); window.PixmonSom.intensidade(0); } // ambiência do bioma sorteado
  }

  const agendar = (ms, fn) => acoes.push({ quando: relogio + ms, fn });

  // Movimento agressivo: o par gira rápido em torno de um centro que anda bastante, aproxima e afasta (distância 52 a 96 px),
  // e cada monstro ainda se joga para os lados o tempo todo. Nunca fica parado.
  function base(i) {
    const t = relogio / 1000;
    const cx = CENTRO.x + 52 * Math.sin(t * 1.1), cy = CENTRO.y + 70 * Math.sin(t * 0.8 + 1);
    const ang = 2.2 + 2.6 * t + 1.2 * Math.sin(t * 1.3);
    const dist = 52 + 44 * (0.5 + 0.5 * Math.sin(t * 2.6));
    const s = i === 0 ? 1 : -1;
    return {
      x: cx + s * (dist / 2) * Math.cos(ang) + 14 * Math.sin(t * 5.2 + i * 2),
      y: cy + s * (dist / 2) * 0.95 * Math.sin(ang) + 14 * Math.cos(t * 4.6 + i),
    };
  }
  function dirPara(i) {
    const a = base(i), b = base(1 - i), dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l, l };
  }
  function pos(i, agora) {
    const b = base(i), d = dirPara(i);
    let m = 0, lado = 0;
    const l = lance[i], rc = recuo[i], a = acerto[i], es = esquiva[i];
    if (l && agora - l.t0 < l.dur) { const u = (agora - l.t0) / l.dur, w = (u - 0.5) * 2, c = u < 0.5 ? Math.pow(u * 2, 2.2) : 1 - w * w * (3 - 2 * w) + 0.06 * Math.sin(w * Math.PI * 2) * (1 - w); m += c * Math.min(l.dist, d.l - 40); } // vai acelerando, encosta no meio e volta suave // para no contato: os sprites se tocam, não se sobrepõem
    if (rc && agora - rc.t0 < rc.dur) m -= Math.sin(Math.PI * ((agora - rc.t0) / rc.dur)) * 9;
    if (a && agora - a.t0 < a.dur) m -= a.forca * (1 - (agora - a.t0) / a.dur); // empurrado para longe do atacante
    if (es && agora - es.t0 < es.dur) lado = Math.sin(Math.PI * ((agora - es.t0) / es.dur)) * 30 * es.lado; // esquiva: um salto de lado
    return { x: b.x + d.x * m - d.y * lado, y: b.y + d.y * m + d.x * lado };
  }

  const corDe = (tipo) => CORES[tipo] || CORES.agua;
  const panDe = (i) => Math.max(-1, Math.min(1, (pos(i, relogio).x - 180) / 140)) * 0.85; // posição na arena -> estéreo

  // Onomatopeias por elemento e poder (0 básico, 1 especial, 2 forte); a de carga e a de esquiva são fixas
  const ONO = {
    fogo: [['PUF!', 'CHIU!', 'PAF!'], ['FUUSH!', 'BLAZ!', 'FWOOM!'], ['BUUM!', 'KABOOM!', 'FLAAAM!']],
    agua: [['PLOP!', 'SPLISH!', 'PLAF!'], ['SPLASH!', 'SPLOSH!', 'BLUB!'], ['SPLAAASH!', 'GLUB!', 'SPLOOSH!']],
    terra: [['TUM!', 'THUD!', 'POC!'], ['CRASH!', 'TRAK!', 'BONK!'], ['KABUUM!', 'RUMBLE!', 'BAAM!']],
    ar: [['FIU!', 'SWISH!', 'ZIP!'], ['WHOOSH!', 'FWOOSH!', 'SSHHH!'], ['WHUUUM!', 'ZUUUM!', 'KRSSH!']],
    eletrico: [['ZAP!', 'BZT!', 'ZIP!'], ['BZZT!', 'CRACK!', 'ZAAP!'], ['KRAKA-BOOM!', 'ZZZAP!', 'BZZZT!']],
  };
  const ONO_CARGA = { fogo: 'FUUUUU...', agua: 'BLUB BLUB...', terra: 'RRRRR...', ar: 'FIUUUU...', eletrico: 'ZZZZT...' };
  const ONO_LANCE = ['ZUUUM!', 'ZOOOM!', 'VRUUM!'], ONO_ESQ = ['WHUSH!', 'SWISH!', 'ZIP!'];
  const ONO_COR = { fogo: '#ffd35a', agua: '#8ccdf0', terra: '#d8b878', ar: '#f4f9fc', eletrico: '#fff2a0' };
  // Poeira, fumaça e rachaduras no chão (desenhadas em código, animadas pelo tempo de vida de cada uma)
  let nuvens = [], rachas = [], hopAnt = [-1, -1];
  const NUVEM = { poeira: ['#d8c19a', 0.55], fumaca: ['#5d5d6b', 0.6], vapor: ['#e8f0f6', 0.5] };
  // n nuvens em x,y; anel: abrem para os lados (poeira do impacto); senão sobem (fumaça)
  function nuvem(x, y, tipo, n, o = {}) {
    for (let k = 0; k < n; k++) {
      const an = o.anel ? (k / n) * Math.PI * 2 + hash(k, Math.round(x)) * 0.5 : -Math.PI / 2 + (hash(k, Math.round(y)) - 0.5) * 1.2, v = (o.anel ? 0.55 : 0.3) * (o.vel || 1) * (0.7 + hash(k, 9) * 0.6);
      nuvens.push({ x, y, tipo, t0: relogio, vida: o.vida || 650, vx: Math.cos(an) * v, vy: o.anel ? Math.sin(an) * v * 0.45 : Math.sin(an) * v, r0: o.r0 || 3, r1: o.r1 || 8 });
    }
  }
  function racha(x, y, grande) { rachas.push({ x, y, t0: relogio, vida: 1500, raio: grande ? 30 : 20, sem: Math.round(x * 7 + y) }); }
  function desenharChaoFx(agora) {
    rachas = rachas.filter((c) => agora - c.t0 < c.vida);
    for (const c of rachas) {
      const q = (agora - c.t0) / c.vida, ab = Math.min(1, (agora - c.t0) / 140); // abre rápido, some devagar
      g.globalAlpha = q > 0.6 ? 1 - (q - 0.6) / 0.4 : 1;
      for (let k = 0; k < 7; k++) {
        let an = (k / 7) * Math.PI * 2 + hash(c.sem, k) * 0.6, x = c.x, y = c.y + 4;
        const n = Math.round(c.raio * ab / 4);
        for (let j = 0; j < n; j++) {
          an += (hash(c.sem + j, k) - 0.5) * 1.1;
          x += Math.cos(an) * 4; y += Math.sin(an) * 2;
          px(g, Math.round(x), Math.round(y), 2, 2, '#2b1c10'); px(g, Math.round(x), Math.round(y) + 2, 2, 1, '#8a6a42');
        }
      }
      g.globalAlpha = 1;
    }
  }
  function desenharNuvens(agora) {
    nuvens = nuvens.filter((n) => agora - n.t0 < n.vida);
    for (const n of nuvens) {
      const q = (agora - n.t0) / n.vida, r = Math.round((n.r0 + (n.r1 - n.r0) * q) / 2) * 2, [cor, a0] = NUVEM[n.tipo], t = (agora - n.t0) / 16;
      g.globalAlpha = a0 * (1 - q) * (1 - q * 0.3);
      ellipse(g, Math.round(n.x + n.vx * t), Math.round(n.y + n.vy * t), r, Math.round(r * 0.8), cor);
      ellipse(g, Math.round(n.x + n.vx * t) - 1, Math.round(n.y + n.vy * t) - 1, Math.max(1, r - 3), Math.max(1, Math.round(r * 0.8) - 3), n.tipo === 'poeira' ? '#ecdcbc' : n.tipo === 'fumaca' ? '#7d7d8c' : '#ffffff');
      g.globalAlpha = 1;
    }
  }
  const FEIXE_ARCANO = true; // teste (2026-11-20): o Lightbeam usa a folha do pixelfx arcane-beam (fx/feixe-arcano, roxa) em vez do feixe desenhado em código; false volta ao antigo
  const NOME_GOLPE_LIGADO = false; // teste do George (2026-11-19): sem o nome do golpe sobre o monstro; true volta
  const ONO_LIGADAS = false; // teste do George (2026-11-19): sem onomatopeias; só os números de dano e o rótulo de crítico. true volta as raras e pequenas
  // Onomatopeias: raras e pequenas (no máximo 1 na tela, tamanho 55%) para não poluir a luta; só o impacto do ultimate e o crítico têm a sua
  function ono(x, y, txt, cor, tam, vida = 650) { if (!ONO_LIGADAS || onos.length >= 1) return; tam = Math.max(5, Math.round(tam * 0.55)); onos.push({ x, y, txt, cor, tam, t0: relogio, vida, rot: (hash(Math.round(x), Math.round(y)) - 0.5) * 0.5 }); }

  // Evento 'carga': o monstro começa a preparar o ataque (a carga dura e.dur ms, vista no anel que fecha em volta dele):
  // nome da habilidade, aura, som e a onomatopeia de carga nos ataques maiores. É o aviso para o adversário usar a defesa.
  // Visual de cada poder do ultimate (battle.js: PODER_DE). carga: som da carga | lanca: o ataque sai (substitui a investida) | buff: o poder é ativado (evento 'buff')
  const CORES_FRENESI = { c: '#c8261a', d: '#7a1010', l: '#ff6a4a', a: '#ffd890' };
  const PODERES_VIS = {
    feixe: {
      carga: (e, pa) => som('feixeCarga', e.tipo, e.dur / 1000, pa),
      lanca: (e, a, d, pa, pp) => { // Lightbeam: o monstro fica parado e dispara um raio contínuo; o impacto vem logo depois da abertura do feixe
        som('feixe', e.tipo, pa);
        feixes.push({ a, d, t0: relogio, dur: 620, tipo: e.tipo, fixo: e.esquiva ? pos(d, relogio) : null });
        ondas.push({ x: pp.x, y: pp.y - 14, t0: relogio, cor: corDe(e.tipo).a, grande: true });
        clarao = { t0: performance.now(), dur: 120 };
        if (e.esquiva) agendar(60, () => esquivar(e));
        agendar(150, () => impacto(e));
      },
    },
    disco: {
      lanca: (e, a, d, pa, pp) => { // Kienzan: o primeiro acerto lança o disco (vai, passa pelo alvo, curva e volta, acertando de novo); o segundo evento só dispara o impacto da volta
        if (e.parte === 2) { if (e.esquiva) esquivar(e); impacto(e); return; }
        som('disco', e.tipo, pa);
        discos.push({ a, d, t0: relogio, tipo: e.tipo, x0: pp.x, y0: pp.y - 14, trail: [], lado: hash(bt.t, a + 17) < 0.5 ? -1 : 1 });
        if (e.esquiva) agendar(240, () => esquivar(e));
        agendar(350, () => impacto(e));
      },
    },
    esfera: {
      carga: (e, pa) => som('supernovaCarga', e.dur / 1000, pa),
      lanca: (e, a, d, pa, pp) => { // Esfera gigante: a esfera que cresceu sobre o monstro é arremessada no alvo
        som('lance', e.tipo, pa);
        esferas.push({ a, d, e, t0: relogio, dur: 650, x0: pp.x, y0: pp.y - 64, tipo: e.tipo, trail: [], fixo: null });
        const ag = performance.now(); clarao = { t0: ag, dur: 140 }; tremor = { t0: ag, dur: 300, mag: 3 };
      },
    },
    nova: {
      carga: (e, pa) => som('supernovaCarga', e.dur / 1000, pa),
      lanca: (e, a, d, pa, pp) => { // Supernova: o monstro explode em luz; três anéis varrem a arena, quebram os objetos (sem dar item) e o impacto chega no alvo quando o primeiro anel o alcança
        const pd = pos(d, relogio), dist = Math.hypot(pd.x - pp.x, pd.y - pp.y), atraso = Math.max(150, Math.min(380, dist / 0.55));
        novas.push({ a, x: pp.x, y: pp.y, t0: relogio, dur: 700, tipo: e.tipo });
        som('supernova', pa);
        const ag = performance.now(); clarao = { t0: ag, dur: 220 }; tremor = { t0: ag, dur: 650, mag: 5 };
        ondas.push({ x: pp.x, y: pp.y - 12, t0: relogio, cor: '#ffffff', grande: true });
        for (const [t, r] of [[120, 120], [260, 260], [420, 460]]) agendar(t, () => quebraPerto(pp.x, pp.y, r, null)); // os objetos quebram conforme o anel passa; sem item para ninguém
        agendar(atraso, () => impacto(e));
      },
    },
    frenesi: {
      carga: (e, pa) => som('ultimate', pa),
      buff: (e) => { // o monstro explode em poder: ondas vermelhas, grito, brasas subindo e o brilho fica enquanto durar (desenharMonstro)
        const p = pos(e.i, relogio), pa = panDe(e.i);
        rotulos.push({ i: e.i, txt: 'FRENESI!', t0: relogio, cor: '#ff5a3a', tam: 14, dy: -66, vida: 1000 });
        ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor: '#ff5a3a', grande: true }); agendar(120, () => ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor: '#ffd890', grande: true }));
        for (let k = 0; k < 18; k++) parts.push({ x: p.x + (hash(k, 3) - 0.5) * 24, y: p.y - 4, vx: (hash(k, 5) - 0.5) * 1.2, vy: -1 - hash(k, 7) * 1.6, g: 0, t0: relogio, vida: 700, c: ['#ffd890', '#ff6a4a', '#c8261a'][k % 3], tam: 2 });
        nuvem(p.x, p.y, 'poeira', 8, { anel: true, r0: 3, r1: 11 });
        const ag = performance.now(); clarao = { t0: ag, dur: 160 }; tremor = { t0: ag, dur: 320, mag: 4 };
        som('frenesi', pa);
      },
    },
  };
  function buff(e) { const pv = PODERES_VIS[e.poder]; if (pv && pv.buff) pv.buff(e); } // poder desconhecido: ignora
  const rotRegra = (i, txt) => rotulos.push({ i, txt: '⚙ ' + txt, t0: relogio, cor: '#9fd0ff', tam: 9, dy: -30, vida: 900 });
  function carga(e) {
    if (e.regra) rotRegra(e.atq, e.regra);
    const a = e.atq, pa = panDe(a), pp = pos(a, relogio);
    rotulos.push({ i: a, txt: e.golpe, t0: relogio, tipo: e.tipo, cor: e.idx === 2 ? '#ffd35a' : PAL.gold, tam: e.idx === 2 ? 12 : 11, dy: -44, vida: Math.max(800, e.dur + 400) });
    aura[a] = { t0: relogio, cor: corDe(e.tipo).a };
    recuo[a] = { t0: relogio, dur: Math.max(200, e.dur) }; // um passo atrás para tomar impulso
    const pv = PODERES_VIS[e.poder] || {}; // cada poder do ultimate tem o seu som de carga (se não, o padrão do elemento)
    if (pv.carga) pv.carga(e, pa);
    if (e.idx >= 1) { if (!pv.carga) som('carga', e.tipo, pa); }
    if (e.idx === 2 && !pv.carga) som('ultimate', pa);
  }

  // Um talento disparou (Abertura, Último suspiro, Sede de ultimate, Casca grossa, Corpo fechado): rótulo dourado curto
  function talento(e) {
    const p = pos(e.i, relogio);
    rotulos.push({ i: e.i, txt: '★ ' + e.nome, t0: relogio, cor: '#ffe9a8', tam: 10, dy: -78, vida: 900 });
    for (let k = 0; k < 5; k++) parts.push({ x: p.x + (k - 2) * 5, y: p.y - 30, vx: 0, vy: -0.4, g: 0, t0: relogio, vida: 450, c: k % 2 ? '#ffd35a' : '#ffffff', tam: 2 });
  }
  // Talento de cura (Fôlego, Cura em cadeia): a barra sobe, partículas verdes sobem e um rótulo diz de onde veio
  function cura(e) {
    const p = pos(e.i, relogio);
    hpAlvo[e.i] = e.hpApos;
    rotulos.push({ i: e.i, txt: e.fonte + (e.todos ? ' (time)' : '') + ' +', t0: relogio, cor: '#6fd66f', tam: 11, dy: -50, vida: 1000 });
    for (let k = 0; k < 8; k++) parts.push({ x: p.x + (k - 3.5) * 4, y: p.y - 6, vx: 0, vy: -0.5 - (k % 3) * 0.15, g: 0, t0: relogio, vida: 600, c: k % 2 ? '#6fd66f' : '#ffffff', tam: 2 });
    som('cura', panDe(e.i));
  }

  // Um monstro do time caiu (o time ainda tem reserva): tomba e some, sem o banner de K.O. da luta toda
  function nocaute(e) {
    agendar(450, () => {
      if (bt.ativo[e.i] !== e.idx) return; // quem escolheu o próximo antes disso já trocou: sem animação de queda no monstro novo
      const p = pos(e.i, relogio), ag = performance.now();
      kos[e.i] = { t0: relogio }; escudo[e.i] = null; aura[e.i] = null;
      rotulos.push({ i: e.i, txt: 'NOCAUTE!', t0: relogio, cor: '#ff6a5a', tam: 13, dy: -58, vida: 1100 });
      ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor: '#ffffff', grande: true });
      if (FX['critico']) fxs.push({ nome: 'critico', x: p.x, y: p.y - 14, t0: relogio, escala: ESCALA_FX['critico'] * 1.4 });
      nuvem(p.x, p.y, 'poeira', 6, { anel: true, r0: 3, r1: 9 });
      tremor = { t0: ag, dur: 260, mag: 3 }; som('nocaute', panDe(e.i));
    });
  }
  // O próximo monstro entra em campo: cai do alto com uma nuvem e um rótulo com o nome
  function troca(e) {
    const m = bt.lados[e.i].m;
    if (e.regra) agendar(250, () => rotRegra(e.i, 'troca: ' + e.regra));
    kos[e.i] = null; entrou[e.i] = { t0: relogio };
    lance[e.i] = recuo[e.i] = acerto[e.i] = esquiva[e.i] = aura[e.i] = escudo[e.i] = null;
    hpVis[e.i] = hpLag[e.i] = hpAlvo[e.i] = bt.lados[e.i].hp; hudHit[e.i] = -9999;
    const p = pos(e.i, relogio);
    if (FX['fumaca']) fxs.push({ nome: 'fumaca', x: p.x, y: p.y - 8, t0: relogio, escala: ESCALA_FX['fumaca'] * 1.1 }); else nuvem(p.x, p.y - 6, 'fumaca', 4, { r0: 3, r1: 9, vida: 700 });
    ondas.push({ x: p.x, y: p.y - 10, t0: relogio, cor: corDe(m.tipo).a, grande: true });
    rotulos.push({ i: e.i, txt: m.nome + '!', t0: relogio, cor: '#ffd35a', tam: 13, dy: -58, vida: 1100 });
    som('troca', panDe(e.i));
  }

  // Status: rótulo, som e (no stun) a carga em andamento que se desfaz; o visual contínuo sai de bt.lados[i].st em desenharMonstro.
  const ROT_ST = { veneno: ['ENVENENADO!', '#5cc84a'], lento: ['LENTO...', '#5ab0ff'], paralisia: ['PARALISADO!', '#ffd35a'], stun: ['ATORDOADO!', '#ff6a5a'] };
  function statusAplicado(e) {
    const p = pos(e.i, relogio), [txt, cor] = ROT_ST[e.st];
    agendar(260, () => { rotulos.push({ i: e.i, txt, t0: relogio, cor, tam: 12, dy: -70, vida: 1100 }); som('status', e.st, panDe(e.i)); });
    if (e.cancelou) { aura[e.i] = null; }
  }
  // Item de um objeto quebrado: rótulo e partículas no monstro que o pegou (benção em dourado, maldição em roxo)
  const ROT_ITEM = { cura: ['+VIDA', '#6fd66f'], forca: ['FORÇA!', '#ff9a3a'], recarga: ['RECARGA!', '#7ad0ff'], desfeito: ['DESFEITA!', '#9fd0ff'], dano: ['MALDIÇÃO!', '#c07aff'], stun: ['MALDIÇÃO!', '#c07aff'], veneno: ['MALDIÇÃO!', '#c07aff'] };
  function itemEv(e) {
    if (e.ev === 'status') { statusAplicado(e); return; }
    if (e.ev === 'talento') { talento(e); return; } // ex.: Casca grossa barrou o stun do item
    if (e.ev !== 'item') return;
    const p = pos(e.i, relogio), [txt0, cor] = ROT_ITEM[e.item], txt = e.otimo ? 'ÓTIMO! ' + txt0 : txt0;
    rotulos.push({ i: e.i, txt, t0: relogio, cor, tam: 13, dy: -58, vida: 1100 });
    if (e.item === 'cura' || e.item === 'dano' || (e.item === 'recarga' && e.otimo)) { hpAlvo[e.i] = e.hpApos; if (e.item === 'dano') hudHit[e.i] = performance.now(); nums.push({ x: p.x, y: p.y - 34, txt: (e.item === 'cura' ? '+' : '-') + Math.round(Math.abs(e.hpApos - hpVis[e.i])), t0: relogio, tam: 14, cor }); }
    for (let k = 0; k < 14; k++) { const an = (k / 14) * Math.PI * 2, v = 0.8 + hash(k, 8); parts.push({ x: p.x, y: p.y - 14, vx: Math.cos(an) * v, vy: Math.sin(an) * v - (e.maldicao ? -0.3 : 0.6), g: e.maldicao ? 0.05 : -0.02, t0: relogio, vida: 700, c: e.maldicao ? ['#c07aff', '#5a2a7a', '#1b1020'][k % 3] : [cor, '#ffffff', '#ffd35a'][k % 3], tam: 2 }); }
    ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor, grande: true });
    som(e.maldicao ? 'fraco' : 'super', panDe(e.i));
  }
  function dot(e) { // um tique de veneno
    const p = pos(e.i, relogio);
    hpAlvo[e.i] = e.hpApos; hudHit[e.i] = performance.now() - 200;
    const fr = e.fonte === 'Frenesi'; // o custo do frenesi aparece em vermelho e sem o som de veneno
    nums.push({ x: p.x + 8, y: p.y - 30, txt: '-' + Math.max(1, Math.round(e.dano)), t0: relogio, tam: fr ? 9 : 11, cor: fr ? '#ff6a4a' : '#5cc84a' });
    for (let k = 0; k < 3; k++) parts.push({ x: p.x + (k - 1) * 6, y: p.y - 14, vx: 0, vy: -0.4 - k * 0.1, g: 0, t0: relogio, vida: 450, c: fr ? '#ff6a4a' : '#5cc84a', tam: 2 });
    if (!fr) som('dot', panDe(e.i));
  }

  // Evento 'defesa': o escudo sobe e fica até a duração acabar ou até bloquear um ataque.
  function defender(e) {
    if (e.regra) rotRegra(e.i, e.regra);
    const i = e.i, p = pos(i, relogio);
    escudo[i] = { t0: relogio, ate: relogio + e.dur, tipo: e.tipo };
    rotulos.push({ i, txt: e.golpe, t0: relogio, tipo: e.tipo, cor: '#9fd0ff', tam: 11, dy: -44, vida: 800 });
    ondas.push({ x: p.x, y: p.y - 14, t0: relogio, cor: corDe(e.tipo).a, grande: false });
    nuvem(p.x, p.y, 'poeira', 8, { anel: true, r0: 2, r1: 6, vida: 500 });
    som('defesa', panDe(i));
  }

  // Evento 'golpe': a carga acabou e o ataque sai (o dano já foi decidido pela lógica; a barra de vida desce no impacto).
  function lanca(e) {
    const a = e.atq, d = e.def, pa = panDe(a), pp = pos(a, relogio);
    pop[a] = { t0: relogio }; // solta a carga: estica e balança até assentar
    if (e.idx === 1) { // forte: projétil do elemento
      som('projetil', e.tipo, pa);
      if (e.tipo === 'fogo') nuvem(pp.x, pp.y - 8, 'fumaca', 3, { r0: 2, r1: 7, vida: 700 });
      proj.push({ d, t0: relogio, dur: e.fx === 'area' ? 430 : e.fx === 'onda' ? 440 : 380, x0: pp.x, y0: pp.y - 12, tipo: e.tipo, e, trail: [], forma: e.fx || 'proj' });
      ondas.push({ x: pp.x, y: pp.y - 12, t0: relogio, cor: corDe(e.tipo).a, grande: false });
    } else if (PODERES_VIS[e.poder] && PODERES_VIS[e.poder].lanca) {
      PODERES_VIS[e.poder].lanca(e, a, d, pa, pp);
    } else if (e.fx === 'rajada' && e.idx === 0) { // rápido em rajada: fica parado e dispara 3 tiros miúdos; o dano entra no último
      som('projetil', e.tipo, pa);
      for (let k = 0; k < 3; k++) agendar(k * 70, () => { const q0 = pos(a, relogio); proj.push({ d, t0: relogio, dur: 230, x0: q0.x, y0: q0.y - 12 + (k - 1) * 6, tipo: e.tipo, e, trail: [], forma: 'mini', parcial: k < 2 }); });
    } else { // rápido: investida curta; ultimate (idx 2): investida longa com rastro do elemento e efeito grande
      som('lance', e.tipo, pa);
      const dur = e.idx === 2 ? 440 : 280;
      nuvem(pp.x, pp.y, 'poeira', e.idx === 2 ? 6 : 3, { anel: true, r0: 2, r1: 6, vida: 450 });
      lance[a] = { t0: relogio, dur, dist: e.idx === 2 ? 170 : 130, forte: e.idx === 2, tipo: e.tipo, pulo: e.poder === 'pulo' };
      if (e.esquiva) agendar(Math.max(0, dur * 0.5 - 110), () => esquivar(e)); // o alvo salta de lado um pouco antes do contato
      agendar(dur * 0.5, () => impacto(e));
    }
  }

  // O alvo desvia: salto de lado, sombra onde estava, aviso e som. Chamado antes do contato (investida) ou com o projétil perto.
  function esquivar(e) {
    const d = e.def;
    if (e.aereo) { if (!esquiva[d] || relogio - esquiva[d].t0 > 320) { esquiva[d] = { t0: relogio, dur: 1, lado: 0 }; rotulos.push({ i: d, txt: 'NO AR!', t0: relogio, cor: '#ffffff', tam: 11, dy: -58, vida: 700 }); } return; } // super pulo: o alvo está no ar, sem salto de lado
    if (esquiva[d] && relogio - esquiva[d].t0 < 320) return;
    const p = pos(d, relogio);
    esquiva[d] = { t0: relogio, dur: 300, lado: hash(bt.t, d + 3) < 0.5 ? -1 : 1 };
    fantasmas.push({ i: d, x: p.x, y: p.y, flip: pos(1 - d, relogio).x < p.x, t0: relogio });
    rotulos.push({ i: d, txt: 'ESQUIVOU!', t0: relogio, cor: '#ffffff', tam: 11, dy: -58, vida: 700 });
    nuvem(p.x, p.y, 'poeira', 5, { anel: true, r0: 2, r1: 6, vida: 450 });
    som('esquiva', panDe(d));
  }

  const idxForte = (e) => e.idx >= 1;
  function impacto(e) {
    const d = e.def, p = pos(d, relogio), forte = Math.min(1, e.dano / 8), agoraReal = performance.now();
    const est = ESTILO[e.tipo], cor = corDe(e.tipo), pa = panDe(d), ult = e.idx === 2 && (e.poder !== 'disco' || e.parte === 2);
    if (e.atravessou) { // supernova: a defesa se parte mas deixa passar parte do dano
      escudo[d] = null; if (FX['escudo-quebra']) fxs.push({ nome: 'escudo-quebra', x: p.x, y: p.y - 15, t0: relogio, escala: ESCALA_FX['escudo-quebra'] });
      rotulos.push({ i: d, txt: 'ESCUDO PARTIDO!', t0: relogio, cor: '#9fd0ff', tam: 10, dy: -80, vida: 800 });
    }
    if (e.bloqueado) { // a defesa segurou: o escudo se parte em faíscas, sem dano
      escudo[d] = null;
      fxs.push({ nome: 'escudo-quebra', x: p.x, y: p.y - 15, t0: relogio, escala: ESCALA_FX['escudo-quebra'] });
      ondas.push({ x: p.x, y: p.y - 14, t0: relogio, cor: '#9fd0ff', grande: true });
      for (let k = 0; k < 14; k++) {
        const an = (k / 14) * Math.PI * 2 + hash(k, 11) * 0.5, v = 1.4 + hash(k, 13) * 1.8;
        parts.push({ x: p.x, y: p.y - 14, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 0.4, g: 0.05, t0: relogio, vida: 420, c: ['#ffffff', '#9fd0ff', '#ffd35a'][k % 3], tam: 2 });
      }
      nuvem(p.x, p.y, 'poeira', 6, { anel: true, r0: 2, r1: 6, vida: 450 });
      rotulos.push({ i: d, txt: 'BLOQUEOU!', t0: relogio, cor: '#9fd0ff', tam: 12, dy: -58, vida: 800 });
      tremor = { t0: agoraReal, dur: 140, mag: 2 };
      congelaAte = Math.max(congelaAte, agoraReal + 60);
      som('bloqueio', pa);
      return;
    }
    if (e.esquiva) { // errou: só o vento do golpe e a onomatopeia
      ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor: '#ffffff', grande: false });
      return;
    }
    const super_ = e.mult > 1, fraco = e.mult < 1, crit = e.crit;
    acerto[d] = { t0: relogio, dur: 260, forca: 6 + 10 * forte + (super_ ? 6 : 0) + (crit ? 10 : 0) + (ult ? 8 : 0) };
    hpAlvo[d] = e.hpApos; hudHit[d] = agoraReal;
    tremor = { t0: agoraReal, dur: 160 + 140 * forte + (crit ? 120 : 0) + (ult ? 160 : 0), mag: 2 + Math.round(3 * forte) + (super_ ? 2 : 0) + (crit ? 4 : 0) + (ult ? 3 : 0) };
    congelaAte = Math.max(congelaAte, agoraReal + 50 + 80 * forte + (super_ ? 40 : 0) + (crit ? 90 : 0) + (ult ? 70 : 0) + (e.hpApos <= 0 ? 150 : 0)); // hit-stop
    if (crit) clarao = { t0: agoraReal, dur: 140 };
    nums.push({ x: p.x, y: p.y - 32, txt: '-' + Math.round(e.dano) + (crit ? '!' : ''), t0: relogio, tam: 9 + Math.round(5 * forte) + (super_ ? 2 : 0) + (crit ? 5 : 0), cor: crit ? '#ff5a3a' : super_ ? '#ffd35a' : fraco ? '#9fb4c8' : '#ffffff' });
    if (crit) rotulos.push({ i: d, txt: 'CRÍTICO!', t0: relogio, cor: '#ff5a3a', tam: 14, dy: -66, vida: 900 });
    if (super_) rotulos.push({ i: d, txt: 'SUPER!', t0: relogio, cor: '#ffd35a', tam: 13, dy: crit ? -80 : -58, vida: 700 });
    if (fraco) rotulos.push({ i: d, txt: 'fraco...', t0: relogio, cor: '#9fb4c8', tam: 10, dy: crit ? -80 : -58, vida: 700 });
    // onomatopeia só no ultimate, no crítico e em ~1 de cada 3 golpes rápidos/fortes (senão polui a tela); vermelha no crítico
    if (ult || crit) ono(p.x + (hash(bt.t, d + 9) - 0.5) * 16, p.y - 20, ONO[e.tipo][e.idx][Math.floor(hash(bt.t, d + 7 * e.idx) * 3)], crit ? '#ff5a3a' : ONO_COR[e.tipo], [6, 7, 9][e.idx] + (crit ? 2 : 0), crit ? 800 : 650);
    const area = e.fx === 'area';
    ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor: cor.a, grande: ult || super_ || crit || area });
    const n = 10 + Math.round(10 * forte) + (crit ? 12 : 0) + (ult ? 16 : 0) + (area ? 10 : 0);
    for (let k = 0; k < n; k++) {
      const an = (k / n) * Math.PI * 2 + hash(k, 3) * 0.6, v = 1.2 + hash(k, 5) * 1.6 + forte + (crit ? 0.8 : 0) + (ult ? 0.8 : 0);
      parts.push({ x: p.x, y: p.y - 12, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 0.6, g: est.grav, t0: relogio, vida: 460, c: est.cores[k % 3], tam: e.tipo === 'terra' ? 3 : 2 });
    }
    quebraPerto(p.x, p.y, ult ? 44 : 28, e.atq);
    const empilha = (nome, dx, dy, k = 1, flip = false) => { if (FX[nome]) fxs.push({ nome, x: p.x + dx, y: p.y + dy, t0: relogio, escala: ESCALA_FX[nome] * k, flip }); return !!FX[nome]; };
    if (crit) empilha('critico', 0, -14);
    if (ult && e.tipo === 'terra') empilha('terra-espinhos', 0, 4); else if (e.tipo === 'terra' || ult || crit) empilha('terra-rachadura', 0, 4, ult ? 1.2 : 0.9);
    if (ult && e.tipo === 'fogo') empilha('fogo-explosao', 0, -6);
    if (ult && e.tipo === 'agua') empilha('agua-splash', 0, 4);
    if (ult && e.tipo === 'eletrico') empilha('eletrico-raio', 0, 4);
    if (ult && e.tipo === 'ar') { const dir = pos(e.atq, relogio).x > p.x; empilha('ar-corte', dir ? 28 : -28, -14, 1, dir); }
    if (e.poder === 'esfera') { // esfera gigante: explosão que enche a tela, anéis largos, quebra tudo e deixa cratera
      novas.push({ a: e.atq, x: p.x, y: p.y, t0: relogio, dur: 900, tipo: e.tipo });
      som('supernova', pa); racha(p.x, p.y, true); racha(p.x - 12, p.y + 4, true);
      for (const [t, r] of [[80, 90], [220, 220], [380, 420]]) agendar(t, () => quebraPerto(p.x, p.y, r, null));
      nuvem(p.x, p.y, 'poeira', 16, { anel: true, r0: 4, r1: 16, vida: 800 });
      ondas.push({ x: p.x, y: p.y - 12, t0: relogio, cor: '#ffffff', grande: true });
      const ag = performance.now(); clarao = { t0: ag, dur: 380 }; tremor = { t0: ag, dur: 900, mag: 9 };
    }
    if (e.poder === 'pulo') { // super pulo: cratera dupla, anel de choque largo, detritos, tremor forte e quebra tudo em volta
      racha(p.x, p.y, true); racha(p.x + 10, p.y + 4, true); quebraPerto(p.x, p.y, 80, e.atq);
      nuvem(p.x, p.y, 'poeira', 14, { anel: true, r0: 4, r1: 14, vida: 700 });
      ondas.push({ x: p.x, y: p.y, t0: relogio, cor: '#ffffff', grande: true }); agendar(90, () => ondas.push({ x: p.x, y: p.y, t0: relogio, cor: cor.a, grande: true }));
      for (let k = 0; k < 14; k++) parts.push({ x: p.x, y: p.y - 4, vx: (hash(k, 21) - 0.5) * 4.5, vy: -1.5 - hash(k, 23) * 2.2, g: 0.14, t0: relogio, vida: 600, c: ['#74502c', '#a8793f', '#d8b878'][k % 3], tam: 3 });
      tremor = { t0: agoraReal, dur: 520, mag: 7 };
    }
    if (ult || crit || e.tipo === 'terra') { racha(p.x, p.y, ult || crit); nuvem(p.x, p.y, 'poeira', ult ? 10 : 6, { anel: true, r0: 3, r1: ult ? 11 : 8 }); }
    else if (idxForte(e)) nuvem(p.x, p.y, 'poeira', area ? 8 : 4, { anel: true, r1: area ? 10 : 8, vida: 500 });
    if (e.tipo === 'fogo' && !empilha('fumaca', 0, -12, ult ? 1.3 : 0.8)) nuvem(p.x, p.y - 8, 'fumaca', ult ? 6 : 3, { r0: 3, r1: 9, vida: 900 });
    if (e.tipo === 'agua' || e.tipo === 'ar') nuvem(p.x, p.y - 6, 'vapor', ult ? 5 : 2, { r0: 3, r1: 8, vida: 600 });
    if (e.tipo === 'eletrico') raios.push({ x: p.x, y: p.y - 12, t0: relogio });
    if (e.fx === 'garra' && e.idx === 0 && FX['garra']) fxs.push({ nome: 'garra', x: p.x, y: p.y - 14, t0: relogio, escala: ESCALA_FX['garra'], flip: pos(e.atq, relogio).x > p.x });
    const nomeImp = IMPACTO_FX[e.tipo];
    if (nomeImp && FX[nomeImp] && !(area && FX['area-' + e.tipo])) fxs.push({ nome: nomeImp, x: p.x, y: p.y - 3, t0: relogio, escala: ult ? ESCALA_FX[nomeImp] * 1.8 : crit || area ? ESCALA_FX[nomeImp] * 1.4 : ESCALA_FX[nomeImp] });
    som('golpe', e.tipo, e.dano, e.idx, pa);
    if (ult) som('ultimateImpacto', pa);
    if (crit) som('critico', pa);
    if (super_) som('super', pa);
    if (fraco) som('fraco', pa);
    const menor = Math.min(...bt.lados.map((l, k) => hpAlvo[k] / l.m.hp)); // a música ganha camadas conforme a luta esquenta
    if (window.PixmonSom) window.PixmonSom.intensidade(menor < 0.25 ? 3 : menor < 0.5 ? 2 : menor < 0.8 ? 1 : 0);
  }

  // Eventos da lógica em tempo real: 'carga' (começa a preparar), 'golpe' (sai o ataque) e 'defesa' (o escudo sobe).
  function eventos(evs) {
    for (const e of evs) { if (e.ev === 'carga') carga(e); else if (e.ev === 'defesa') defender(e); else if (e.ev === 'status') statusAplicado(e); else if (e.ev === 'dot') dot(e); else if (e.ev === 'nocaute') nocaute(e); else if (e.ev === 'cura') cura(e); else if (e.ev === 'talento') talento(e); else if (e.ev === 'troca') troca(e); else if (e.ev === 'buff') buff(e); else lanca(e); }
    if (bt.fim && bt.fim.vencedor != null && !koAgendado) { // o K.O. espera o impacto final aparecer
      koAgendado = true;
      agendar(900, () => {
        const perd = 1 - bt.fim.vencedor, pp = pos(perd, relogio), ag = performance.now();
        ko = { t0: relogio, perdedor: perd, real0: ag }; som('ko', panDe(perd));
        clarao = { t0: ag, dur: 260 }; tremor = { t0: ag, dur: 500, mag: 7 };
        ondas.push({ x: pp.x, y: pp.y - 12, t0: relogio, cor: '#ffffff', grande: true });
        if (FX['critico']) fxs.push({ nome: 'critico', x: pp.x, y: pp.y - 16, t0: relogio, escala: ESCALA_FX['critico'] * 2.2 });
        nuvem(pp.x, pp.y, 'poeira', 10, { anel: true, r0: 3, r1: 11 });
      });
    }
  }


  function anel(x, y, rr, cor, alfa, passo) {
    g.globalAlpha = Math.max(0, alfa); g.fillStyle = cor;
    for (let a = 0; a < 360; a += passo) {
      const rad = (a * Math.PI) / 180;
      g.fillRect(Math.round(x + rr * Math.cos(rad)), Math.round(y + rr * Math.sin(rad) * 0.8), 2, 2);
    }
    g.globalAlpha = 1;
  }

  // linha em pixels para raios e rastros
  function linha(x0, y0, x1, y1, c, e) {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    g.fillStyle = c;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), e, e);
  }
  function raioZig(x0, y0, x1, y1, semente, pedacos) {
    let ax = x0, ay = y0;
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    for (let k = 1; k <= pedacos; k++) {
      const q = k / pedacos, desv = k === pedacos ? 0 : (hash(semente, k) - 0.5) * 16;
      const bx = x0 + dx * q + nx * desv, by = y0 + dy * q + ny * desv;
      linha(ax, ay, bx, by, '#6fd6ff', 4); linha(ax, ay, bx, by, '#fff2a0', 2); linha(ax, ay, bx, by, '#ffffff', 1);
      ax = bx; ay = by;
    }
  }

  // Golpe forte em 'onda': arco de energia (meia-lua) que varre até o alvo, com rastro de arcos mais fracos
  function arco(cx, cy, ang, R, esc, alfa, c) {
    g.globalAlpha = alfa;
    for (let a = -75; a <= 75; a += 7) {
      const an = ang + (a * Math.PI) / 180, X = Math.round(cx - Math.cos(ang) * R * 0.6 + Math.cos(an) * R), Y = Math.round(cy - Math.sin(ang) * R * 0.6 + Math.sin(an) * R * 0.9), s = Math.max(1, Math.round((6 * (1 - Math.abs(a) / 95)) * esc));
      px(g, X - Math.floor((s + 2) / 2), Y - Math.floor((s + 2) / 2), s + 2, s + 2, c.c); px(g, X - Math.floor(s / 2), Y - Math.floor(s / 2), s, s, c.l);
      if (s > 2) px(g, X - Math.floor((s - 2) / 2), Y - Math.floor((s - 2) / 2), s - 2, s - 2, '#ffffff');
    }
    g.globalAlpha = 1;
  }
  // Golpe forte em 'area': círculo no chão do alvo que fecha e se enche de luz; sobe a coluna do elemento perto do fim (a explosão vem no impacto)
  function marcaArea(q, x, y, agora) {
    const c = corDe(q.tipo), p = Math.min(1, (agora - q.t0) / q.dur), gy = y + 12, rr = Math.round(28 - 14 * p);
    g.globalAlpha = 0.15 + 0.35 * p; ellipse(g, x, gy, rr, Math.round(rr * 0.5), c.l); g.globalAlpha = 1;
    anel(x, gy, rr + 2, c.a, 0.9, 12); anel(x, gy, Math.round(rr * 0.6), '#ffffff', 0.6 * p, 16);
    const cores = ESTILO[q.tipo].cores;
    for (let k = 0; k < 7; k++) { const h = hash(k, Math.round(x)), sob = ((agora / 500 + h) % 1) * 24 * p; px(g, Math.round(x + (h - 0.5) * 2 * rr * 0.8), Math.round(gy - 2 - sob), 2, 2, cores[k % 3]); }
    if (p > 0.8) { g.globalAlpha = (p - 0.8) * 5; px(g, x - 3, gy - 40, 7, 40, c.l); px(g, x - 1, gy - 40, 3, 40, '#ffffff'); g.globalAlpha = 1; if (q.tipo === 'eletrico') raioZig(x, gy - 60, x, gy, Math.floor(agora / 40), 4); }
  }

  function desenharProjetil(q, x, y, agora) {
    const c = corDe(q.tipo);
    x = Math.round(x); y = Math.round(y);
    if (q.forma === 'mini') { q.trail.forEach((t, k) => px(g, Math.round(t.x) - 1, Math.round(t.y) - 1, 2, 2, k % 2 ? c.l : c.c)); ellipse(g, x, y, 3, 3, c.c); ellipse(g, x, y, 2, 2, c.l); px(g, x - 1, y - 1, 2, 2, '#ffffff'); return; }
    if (q.forma === 'area') { if (FX['area-' + q.tipo]) drawFx('area-' + q.tipo, x, (q.fixo || pos(q.d, agora)).y, agora - q.t0, { escala: ESCALA_FX['area-' + q.tipo] }); else marcaArea(q, x, y, agora); return; }
    if (q.forma === 'onda') {
      const al = q.fixo || pos(q.d, agora), ang = Math.atan2(al.y - 12 - q.y0, al.x - q.x0);
      q.trail.forEach((t, k) => { if (k % 2 === 0) arco(t.x, t.y, ang, 14, 0.7, 0.15 + 0.1 * k, c); }); // rastro de arcos mais fracos
      arco(x, y, ang, 17, 1, 1, c);
      return;
    }
    const f = Math.floor(agora / 60) % 2;
    const nomeFx = PROJ_FX[q.tipo];
    if (nomeFx && FX[nomeFx]) {
      q.trail.forEach((t, k) => { // rastro simples atrás do projétil
        const tam = Math.max(1, Math.round(((k + 1) / q.trail.length) * 4));
        ellipse(g, Math.round(t.x), Math.round(t.y), tam, tam, k % 2 ? c.l : c.c);
      });
      const alvoX = pos(q.d, agora).x;
      drawFx(nomeFx, x, y, agora - q.t0, { flip: alvoX < x });
      return;
    }
    if (q.tipo === 'eletrico') { // relâmpago do atacante até a cabeça do projétil, tremendo
      raioZig(q.x0, q.y0, x, y, Math.floor(agora / 45), 5);
      ellipse(g, x, y, 6, 6, 'rgba(111,214,255,0.5)'); ellipse(g, x, y, 3, 3, '#ffffff');
      return;
    }
    q.trail.forEach((t, k) => {
      const tam = Math.max(1, Math.round(((k + 1) / q.trail.length) * (q.tipo === 'ar' ? 3 : 6)));
      ellipse(g, Math.round(t.x), Math.round(t.y + (q.tipo === 'fogo' ? -k * 0.4 : 0)), tam, tam, k % 2 ? c.l : c.c);
    });
    if (q.tipo === 'fogo') { // bola de fogo com língua, brasas e fumaça
      ellipse(g, x - 6, y - 3 - f, 4, 5, c.d); // chama de trás
      ellipse(g, x, y, 10 + f, 10 + f, OUT); ellipse(g, x, y, 9 + f, 9 + f, c.c); ellipse(g, x, y, 6, 6, c.a); ellipse(g, x, y, 2, 2, '#ffffff');
      for (let k = 0; k < 3; k++) px(g, x - 10 + k * 3 + (f ? 1 : 0), y - 8 - k * 3, 2, 2, k % 2 ? c.a : c.c);
    } else if (q.tipo === 'agua') { // esfera d'água com anéis e gotas
      const rr = 8 + f;
      ellipse(g, x, y, rr + 1, rr + 1, OUT); ellipse(g, x, y, rr, rr, c.c); ellipse(g, x, y, 5, 5, c.l); px(g, x - 4, y - 4, 3, 3, '#ffffff');
      anel(x, y, 12 + f * 2, c.l, 0.7, 20);
      px(g, x + 8, y - 6 + f * 2, 2, 3, c.l); px(g, x - 9, y + 4 - f * 2, 2, 3, c.l);
    } else if (q.tipo === 'terra') { // pedras girando e poeira
      for (let k = 0; k < 3; k++) {
        const a = agora / 90 + k * 2.09, rx = x + Math.cos(a) * 9, ry = y + Math.sin(a) * 9;
        px(g, rx - 3, ry - 3, 7, 7, OUT); px(g, rx - 2, ry - 2, 5, 5, k % 2 ? c.l : c.c); px(g, rx - 2, ry - 2, 2, 2, c.l);
      }
      ellipse(g, x, y, 4, 4, c.d);
      for (let k = 1; k < 4; k++) px(g, x - k * 6 + (f ? 1 : 0), y + 8 + k, 3, 2, 'rgba(168,121,63,0.6)');
    } else { // ar: lâmina de vento (meia-lua girando) com riscos de velocidade
      const a = agora / 70;
      for (let k = 0; k < 14; k++) {
        const th = a + (k / 14) * Math.PI * 1.2;
        px(g, x + Math.cos(th) * 11, y + Math.sin(th) * 11, 3, 3, k > 8 ? '#ffffff' : c.c);
        px(g, x + Math.cos(th) * 8, y + Math.sin(th) * 8, 2, 2, c.a);
      }
      for (let k = 1; k < 4; k++) linha(x - k * 8 - 4, y - 7 + k * 4, x - k * 8 - 12, y - 7 + k * 4, '#ffffff', 1);
    }
  }

  // Respiração de cada elemento: [período em ms, esticar em x, esticar em y] (fogo tremula, água ondula, terra pesa, ar flutua, elétrico vibra)
  const IDLE = { fogo: [110, 0.02, 0.04], agua: [380, 0.04, -0.04], terra: [800, 0.015, 0.02], ar: [520, -0.02, 0.035], eletrico: [70, 0.02, 0.02] };
  // squash/stretch do monstro em campo: respiração do elemento, agachar na carga, esticar ao soltar o golpe e achatar/inclinar ao levar dano (molas amortecidas)
  function formaDe(i, m, agora) {
    const [per, ax, ay] = IDLE[m.tipo] || IDLE.fogo, ws = Math.sin((agora + i * 200) / per);
    let sx = 1 + ax * ws, sy = 1 + ay * ws, rot = 0;
    const ac = bt.lados[i].acao;
    if (ac && !bt.fim && ac.slot !== 'defesa') { const pr = Math.max(0, Math.min(1, 1 - (ac.fim - bt.t) / ac.dur)), k = ac.slot === 'ultimate' ? 0.16 : ac.slot === 'forte' ? 0.1 : 0.05; sy -= k * pr; sx += k * 0.8 * pr; }
    const po = pop[i], qp = po ? (agora - po.t0) / 450 : 1;
    if (qp < 1) { const dev = Math.exp(-4 * qp) * Math.cos(qp * 13); sy += 0.16 * dev; sx -= 0.12 * dev; }
    const ah = acerto[i], qh = ah ? (agora - ah.t0) / 420 : 1;
    if (qh < 1) { const fz = Math.min(1, ah.forca / 20), dev = Math.exp(-5 * qh) * Math.cos(qh * 14); sx -= 0.14 * fz * dev; sy += 0.1 * fz * dev; rot = -dirPara(i).x * 0.2 * fz * Math.exp(-5 * qh); }
    const fr = bt.lados[i].st.frenesi;
    return { sx, sy, rot, frenesi: !!(fr && fr.ate > bt.t), t: agora };
  }
  const ultFan = [0, 0];
  function desenharMonstro(i, p, agora) {
    const m = bt.lados[i].m, outro = pos(1 - i, agora);
    const flip = outro.x < p.x; // sempre de frente para o adversário
    const a = acerto[i];
    const flash = a && agora - a.t0 < 280 && Math.floor((agora - a.t0) / 70) % 2 === 0; // pisca branco 2 vezes ao levar o golpe
    const ph = ((agora + i * 330) % 640) / 640, eq = esquiva[i], el = eq && agora - eq.t0 < eq.dur ? Math.sin(Math.PI * ((agora - eq.t0) / eq.dur)) : 0;
    const ciclo = Math.floor((agora + i * 330) / 640);
    if (hopAnt[i] !== ciclo) { if (hopAnt[i] >= 0) nuvem(p.x, p.y, 'poeira', 2, { anel: true, r0: 1, r1: 4, vida: 380, vel: 0.5 }); hopAnt[i] = ciclo; } // poeirinha ao pousar
    const pulo = (ph < 0.5 ? 6 * Math.sin(Math.PI * ph * 2) : 0) + 9 * el; // saltinhos ao se mover; salto maior na esquiva
    const kd = kos[i] || (ko && ko.perdedor === i ? ko : null), en = entrou[i] && agora - entrou[i].t0 < 450 ? (agora - entrou[i].t0) / 450 : 1;
    const alpha = kd ? Math.max(0, 1 - (agora - kd.t0) / 900) : Math.min(1, en * 1.6);
    p = { x: p.x, y: p.y - (1 - Math.pow(en, 0.5)) * 34 }; // quem entra cai do alto
    const l = lance[i];
    if (l && agora - l.t0 < l.dur) {
      if (l.forte) fantasmas.push({ i, x: p.x, y: p.y, flip, t0: agora });
      const est = ESTILO[l.tipo]; // rastro do elemento durante a investida
      parts.push({ x: p.x + (hash(Math.floor(agora), i) - 0.5) * 8, y: p.y - 6, vx: 0, vy: est.grav * 10 - 0.2, g: 0, t0: agora, vida: 300, c: est.cores[Math.floor(agora / 40) % 3], tam: 2 });
    }
    const stv = bt.lados[i].st || {}, on = (n) => stv[n] && stv[n].ate > bt.t, perd = !!kd, venc = ko && ko.perdedor === 1 - i;
    const prog = l && agora - l.t0 < l.dur ? (agora - l.t0) / l.dur : null;
    const acT = bt.lados[i].acao, vib = acT && !bt.fim && acT.slot !== 'defesa' && 1 - (acT.fim - bt.t) / acT.dur > 0.7; // vibra no fim da carga
    const treme = on('paralisia') ? Math.round(Math.sin(agora / 25) * 1.5) : vib ? Math.round(Math.sin(agora / 22) * (acT.slot === 'ultimate' ? 1.5 : 1)) : 0, tomb = perd ? Math.min(1, (agora - kd.t0) / 500) : 0; // paralisia treme; o derrotado tomba
    const frA = bt.lados[i].st.frenesi && bt.lados[i].st.frenesi.ate > bt.t && !perd; // frenesi ativo: aura de chamas atrás, rastro de imagens e brasas
    if (frA) {
      if (FX['frenesi-aura']) { g.globalAlpha = 0.8; drawFx('frenesi-aura', p.x, p.y + 3, agora, { escala: ESCALA_FX['frenesi-aura'] }); g.globalAlpha = 1; }
      if (!ultFan[i] || agora - ultFan[i] > 110) { ultFan[i] = agora; fantasmas.push({ i, x: p.x, y: p.y, flip, t0: agora }); }
      if (hash(Math.floor(agora / 40), i + 9) < 0.5) parts.push({ x: p.x + (hash(Math.floor(agora / 40), i) - 0.5) * 18, y: p.y - 6, vx: 0, vy: -0.9, g: 0, t0: agora, vida: 500, c: hash(Math.floor(agora / 40), i + 2) < 0.5 ? '#ff6a4a' : '#ffd890', tam: 2 });
    }
    // super pulo: agacha na carga, sobe (e some do chão) e desce sobre o alvo; no chão do alvo cresce uma sombra com anel
    let alt = 0;
    const acP = bt.lados[i].acao, poderP = m.golpes.ultimate.poder === 'pulo';
    if (poderP && !perd) {
      const lP = lance[i], uP = lP && lP.pulo && agora - lP.t0 < lP.dur ? (agora - lP.t0) / lP.dur : null;
      let q = 0;
      if (acP && !bt.fim && acP.slot === 'ultimate') { const pr = Math.max(0, Math.min(1, 1 - (acP.fim - bt.t) / acP.dur)); q = Math.max(0, (pr - 0.4) / 0.6); alt = 95 * Math.sin(Math.min(1, q / 0.5) * Math.PI / 2); }
      else if (uP != null) { q = 1; alt = uP < 0.5 ? 95 * Math.pow(1 - uP / 0.5, 2) : 0; }
      if (q > 0) { const t = pos(1 - i, agora), cc = corDe(m.golpes.ultimate.tipo); g.globalAlpha = 0.18 + 0.3 * q; ellipse(g, Math.round(t.x), Math.round(t.y + 2), Math.round(8 + 16 * q), Math.round(4 + 8 * q), '#000000'); g.globalAlpha = 1; anel(t.x, t.y + 2, 10 + 16 * q, cc.a, 0.85, 14); }
    }
    if (alpha > 0) {
      g.save();
      if (perd) { g.translate(Math.round(p.x), Math.round(p.y)); g.rotate((flip ? 1 : -1) * 1.4 * tomb); g.translate(-Math.round(p.x), -Math.round(p.y) + Math.round(8 * tomb)); }
      monstro(g, m, Math.round(p.x) + treme, Math.round(p.y), agora * 1.8 + i * 170, flip, flash, alpha, prog, (on('stun') || perd ? 0 : venc ? 8 * Math.abs(Math.sin(agora / 140)) : pulo) + alt, perd ? null : formaDe(i, m, agora));
      g.restore();
    }
    if (on('veneno')) for (let k = 0; k < 4; k++) { const ph = (agora / 900 + k / 4) % 1; g.globalAlpha = 1 - ph; ellipse(g, Math.round(p.x + (hash(k, i) - 0.5) * 20), Math.round(p.y - 8 - ph * 28), ph < 0.8 ? 2 : 1, ph < 0.8 ? 2 : 1, '#5cc84a'); g.globalAlpha = 1; }
    if (on('lento')) for (let k = 0; k < 3; k++) { const ph = (agora / 1100 + k / 3) % 1; g.globalAlpha = 0.9 - ph * 0.6; seta(g, Math.round(p.x - 2 + (k - 1) * 8), Math.round(p.y - 42 + ph * 10), false, '#5ab0ff'); g.globalAlpha = 1; }
    if (on('paralisia')) { const q = Math.floor(agora / 80) + i; raioZig(p.x - 9, p.y - 26, p.x + 7, p.y - 6, q, 3); raioZig(p.x + 9, p.y - 24, p.x - 6, p.y - 5, q + 9, 3); }
    if (on('stun')) for (let k = 0; k < 3; k++) { const an = agora / 180 + (k * Math.PI * 2) / 3, sx = Math.round(p.x + Math.cos(an) * 10), sy = Math.round(p.y - 40 + Math.sin(an) * 3); px(g, sx - 1, sy, 3, 1, '#ffe84a'); px(g, sx, sy - 1, 1, 3, '#ffe84a'); }
    const au = aura[i];
    if (au && agora - au.t0 < 600) { const q = (agora - au.t0) / 600; anel(p.x, p.y - 11, 15 + q * 8, au.cor, 1 - q, 15); }
    // escudo da defesa: bolha do elemento que pisca perto do fim
    const es = escudo[i];
    if (es && agora < es.ate) {
      const q = Math.min(1, (agora - es.t0) / 150), r = 22 * (0.4 + 0.6 * q), resta = es.ate - agora, pisca = resta < 450 && Math.floor(agora / 70) % 2;
      if (FX['escudo-' + es.tipo]) { if (!pisca) { g.globalAlpha = 0.55 + 0.45 * q; drawFx('escudo-' + es.tipo, p.x, p.y - 15, agora - es.t0, { escala: ESCALA_FX['escudo-' + es.tipo] * (0.5 + 0.5 * q) }); g.globalAlpha = 1; } }
      else {
      g.globalAlpha = pisca ? 0.12 : 0.28; ellipse(g, p.x, p.y - 15, r, r * 0.95, corDe(es.tipo).l); g.globalAlpha = 1;
      anel(p.x, p.y - 15, r, pisca ? '#ffffff' : corDe(es.tipo).a, pisca ? 0.5 : 0.95, 10);
      }
    }
    // Carga de poder (some sozinha se a carga for cancelada). Ultimate (e Lightbeam): luz sugada, orbe na boca, coluna de luz, anéis e tremor crescente.
    // Forte: esfera do elemento com faíscas orbitando. Rápido: brilho curto na boca.
    const acF = bt.lados[i].acao;
    if (acF && !bt.fim && acF.slot === 'ultimate') {
      const poderE = bt.lados[i].m.golpes.ultimate.poder === 'esfera', poderN = bt.lados[i].m.golpes.ultimate.poder === 'nova', poderF = bt.lados[i].m.golpes.ultimate.poder === 'frenesi', pr = Math.max(0, Math.min(1, 1 - (acF.fim - bt.t) / acF.dur)), cc = poderF ? CORES_FRENESI : corDe(bt.lados[i].m.golpes.ultimate.tipo), fac = poderN ? 0 : flip ? -1 : 1; // na supernova a luz se concentra no corpo, não na boca
      // Lightbeam: a carga usa a folha arcane/spell-charge do pixelfx (esfera na mão, motes em espiral, anéis e arcos), crescendo com a carga; sem a folha, o desenho em código
      const arcC = FEIXE_ARCANO && bt.lados[i].m.golpes.ultimate.poder === 'feixe' && FX['carga-arcana'];
      if (arcC) {
        const nq = arcC.j.frames.length, fr = arcC.j.frames[Math.floor((agora / 1000) * 30) % nq].frame, es = 0.7 + 0.7 * pr;
        g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(p.x + fac * 14), Math.round(p.y - 14)); if (fac < 0) g.scale(-1, 1); g.scale(es, es);
        g.drawImage(arcC.im, fr.x, fr.y, fr.w, fr.h, -59, -58, fr.w, fr.h); g.restore();
      } else {
      g.globalAlpha = 0.2 + 0.4 * pr; ellipse(g, Math.round(p.x), Math.round(p.y), Math.round(10 + 16 * pr), Math.round(4 + 6 * pr), cc.l); g.globalAlpha = 1;
      if (pr > 0.5 && !poderE) { g.globalAlpha = (pr - 0.5) * 1.2; const ap = Math.floor(agora / 60) % 2; px(g, Math.round(p.x) - 4 - ap, Math.round(p.y) - 46, 2, 46, cc.l); px(g, Math.round(p.x) + 3 + ap, Math.round(p.y) - 46, 2, 46, cc.l); g.globalAlpha = 1; }
      const cxo = poderE ? p.x : p.x + fac * 12, cyo = poderE ? p.y - 40 - 24 * pr : p.y - 14, RR = poderE ? 90 : 34; // na esfera gigante a luz é sugada para a esfera acima do monstro, de bem mais longe
      for (let k = 0; k < (poderE ? 20 : 12); k++) { // partículas entram em espiral e aceleram ao chegar
        const ph = ((agora / (700 - 300 * pr) + k / 12) % 1), an = k * 2.4 + ph * 2, r = 4 + RR * (1 - ph) * (1 - ph);
        g.globalAlpha = Math.min(1, ph * 3);
        px(g, Math.round(cxo + Math.cos(an) * r), Math.round(cyo + Math.sin(an) * r * 0.8), ph > 0.8 ? 3 : 2, ph > 0.8 ? 3 : 2, k % 3 === 0 ? '#ffffff' : k % 3 === 1 ? cc.l : cc.c);
      }
      g.globalAlpha = 1;
      const ro = Math.round(2 + (poderE ? 31 : poderN ? 15 : 9) * pr + Math.sin(agora / 40) * (1 + 2 * pr)), ox = Math.round(p.x + fac * 14), oy = Math.round(poderE ? p.y - 40 - 24 * pr : p.y - 14);
      if (poderE && pr > 0.2) { anel(ox, oy, ro + 6 + Math.sin(agora / 70) * 2, cc.l, 0.6, Math.max(2, 200 / (ro + 6))); g.globalAlpha = 0.18 * pr; ellipse(g, ox, oy, ro + 14, Math.round((ro + 14) * 0.8), cc.l); g.globalAlpha = 1; } // halo
      if (!poderF) { ellipse(g, ox, oy, ro + 2, ro + 2, cc.c); ellipse(g, ox, oy, ro, ro, cc.l); ellipse(g, ox, oy, Math.max(1, ro - 3), Math.max(1, ro - 3), '#ffffff'); } // o frenesi não tem orbe: o poder fica no corpo
      if (pr > 0.3) { anel(p.x, p.y - 12, 8 + 22 * pr, cc.l, 0.5 * pr, 14); anel(p.x, p.y - 12, 4 + 12 * pr, '#ffffff', 0.4 * pr, 18); }
      }
      const agoraReal = performance.now(); if (pr > 0.5 && (!tremor || agoraReal - tremor.t0 >= tremor.dur)) tremor = { t0: agoraReal, dur: 90, mag: pr > 0.85 ? 2 : 1 }; // o chão treme mais perto do disparo
    } else if (acF && !bt.fim && (acF.slot === 'forte' || acF.slot === 'rapido')) {
      const pr = Math.max(0, Math.min(1, 1 - (acF.fim - bt.t) / acF.dur)), cc = corDe(bt.lados[i].m.golpes[acF.slot].tipo), fac = flip ? -1 : 1, ox = Math.round(p.x + fac * 13), oy = Math.round(p.y - 13);
      if (acF.slot === 'forte') {
        const ro = Math.round(2 + 6 * pr + Math.sin(agora / 50) * pr);
        for (let k = 0; k < 5; k++) { const an = agora / 150 + (k * Math.PI * 2) / 5; px(g, Math.round(ox + Math.cos(an) * (ro + 6)), Math.round(oy + Math.sin(an) * (ro + 6) * 0.8), 2, 2, ESTILO[bt.lados[i].m.golpes.forte.tipo].cores[k % 3]); }
        ellipse(g, ox, oy, ro + 1, ro + 1, cc.c); ellipse(g, ox, oy, ro, ro, cc.l); ellipse(g, ox, oy, Math.max(1, ro - 2), Math.max(1, ro - 2), '#ffffff');
      } else {
        const ro = Math.round(1 + 3 * pr); ellipse(g, ox, oy, ro + 1, ro + 1, cc.l); ellipse(g, ox, oy, ro, ro, '#ffffff');
        if (Math.floor(agora / 60) % 2) px(g, ox + Math.round((hash(Math.floor(agora / 60), i) - 0.5) * 10), oy + Math.round((hash(Math.floor(agora / 60), i + 4) - 0.5) * 8), 2, 2, cc.a);
      }
    }
    // ultimate pronto: aro dourado pulsando no chão (aviso de que vem um golpe grande, de qualquer lado)
    // aro de recarga do ultimate: enche no chão em volta do monstro; cheio, pulsa dourado (de qualquer lado)
    const Ls = bt.lados[i];
    if (!bt.fim && !Ls.acao && !(kos[i] || (ko && ko.perdedor === i))) {
      if (Ls.cd.ultimate <= 0) { const q = (agora / 700 + i * 0.4) % 1; anel(p.x, p.y + 2, 11 + 4 * q, '#ffd35a', 0.55 * (1 - q), 24); anel(p.x, p.y + 2, 11, '#ffd35a', 0.8, 24); }
      else { const fr = 1 - Ls.cd.ultimate / Ls.cdTotal.ultimate; g.globalAlpha = i === 0 ? 0.85 : 0.5; for (let a = 0; a < fr * 360; a += 12) { const rad = ((a - 90) * Math.PI) / 180; px(g, Math.round(p.x + 11 * Math.cos(rad)), Math.round(p.y + 2 + 11 * 0.4 * Math.sin(rad)), 2, 2, '#ffd35a'); } g.globalAlpha = 1; }
    }
    // aviso de ataque carregando: o anel fecha em volta do atacante; nos ataques fortes do adversário aparece também um "!"
    const ac = bt.lados[i].acao;
    if (ac && !bt.fim) {
      const pr = 1 - (ac.fim - bt.t) / ac.dur, cc = corDe(bt.lados[i].m.golpes[ac.slot].tipo);
      anel(p.x, p.y - 14, 34 - 22 * pr, cc.a, 0.3 + 0.6 * pr, 14);
      if (i === 1 && ac.slot !== 'rapido' && pr > 0.15 && Math.floor(agora / 110) % 2) {
        g.font = '12px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4;
        g.strokeStyle = OUT; g.strokeText('!', Math.round(p.x), Math.round(p.y - 46)); g.fillStyle = '#ff5a3a'; g.fillText('!', Math.round(p.x), Math.round(p.y - 46));
      }
    }
  }

  function quadro(agoraReal) {
    if (!bt) return;
    const dt = Math.min(50, agoraReal - ultimoReal);
    ultimoReal = agoraReal;
    if (agoraReal >= congelaAte) relogio += dt;
    const agora = relogio;
    const prontas = acoes.filter((x) => x.quando <= agora);
    acoes = acoes.filter((x) => x.quando > agora);
    prontas.forEach((x) => x.fn());

    g.save();
    if (tremor && agoraReal - tremor.t0 < tremor.dur) {
      const m = Math.round(tremor.mag * (1 - (agoraReal - tremor.t0) / tremor.dur));
      g.translate(Math.round((Math.random() - 0.5) * 2 * m), Math.round((Math.random() - 0.5) * 2 * m));
    }
    if (!fundo) { fundo = montarFundo(); criarObjetos(); } // um sprite que terminou de carregar no meio da luta refaz o fundo e os objetos juntos
    g.drawImage(fundo, 0, 0);

    desenharChaoFx(agora);
    colideObjetos(agora); desenharRestos(); desenharFumaca(agora);
    const ps = [0, 1].map((i) => ({ y: pos(i, agora).y, fn: () => desenharMonstro(i, pos(i, agora), agora) }))
      .concat(objetos.filter((o) => o.vivo && PL[o.k]).map((o) => ({ y: o.y, fn: () => { ellipse(g, o.x, o.y + 1, 9, 3, 'rgba(20,40,20,0.35)'); desenharPL(g, o.k, o.x, o.y + 2, false, 1); } })))
      .sort((a, b) => a.y - b.y);
    ps.forEach((it) => it.fn());
    fantasmas = fantasmas.filter((f) => agora - f.t0 < 170); // rastro da investida forte (translúcido)
    for (const f of fantasmas) monstro(g, bt.lados[f.i].m, Math.round(f.x), Math.round(f.y), agora * 1.8, f.flip, false, 0.35 * (1 - (agora - f.t0) / 170));

    proj = proj.filter((q) => {
      const p = Math.min(1, (agora - q.t0) / q.dur);
      if (q.e.esquiva && !q.fixo && p >= 0.7) { q.fixo = pos(q.d, agora); esquivar(q.e); } // o alvo desvia e o projétil segue para onde ele estava
      const alvo = q.fixo || pos(q.d, agora);
      let x = q.x0 + (alvo.x - q.x0) * p, y = q.y0 + (alvo.y - 12 - q.y0) * p - Math.sin(Math.PI * p) * 10;
      if (q.forma === 'area') { x = alvo.x; y = alvo.y - 12; } // área: a marca fica no alvo (segue até travar na esquiva)
      q.trail.push({ x, y }); if (q.trail.length > 8) q.trail.shift();
      quebraPerto(x, y, 14, q.e.atq); desenharProjetil(q, x, y, agora);
      if (p >= 1) {
        if (q.parcial) { ondas.push({ x: alvo.x, y: alvo.y - 12, t0: relogio, cor: corDe(q.tipo).a, grande: false }); }
        else { if (q.forma === 'area' && FX['area-' + q.tipo]) fxs.push({ nome: 'area-' + q.tipo, x: alvo.x, y: alvo.y, t0: q.t0, escala: ESCALA_FX['area-' + q.tipo] }); impacto(q.e); } // a folha da área continua tocando depois do impacto
        return false;
      }
      return true;
    });

    feixes = feixes.filter((b) => { // Lightbeam: três camadas (borda, meio, núcleo) com ondulação por quadro, flare na boca e no alvo
      const t = agora - b.t0; if (t >= b.dur) return false;
      const o = pos(b.a, agora), fac = pos(b.d, agora).x < o.x ? -1 : 1, al = b.fixo || pos(b.d, agora), cc = corDe(b.tipo);
      const x0 = o.x + fac * 14, y0 = o.y - 14, x1 = al.x, y1 = al.y - 12;
      const w = (t < 100 ? t / 100 : t > b.dur - 180 ? (b.dur - t) / 180 : 1) * (1 + 0.08 * Math.sin(t / 35));
      const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1, N = 14;
      const camadas = [[Math.max(2, Math.round(12 * w)), cc.c, 0.7], [Math.max(2, Math.round(8 * w)), cc.l, 1], [Math.max(1, Math.round(4 * w)), '#ffffff', 1]];
      const arc = FEIXE_ARCANO && FX['feixe-arcano'];
      if (arc) { // a folha tem o feixe de 168 px saindo da mão em (41, 60): gira para o alvo e estica no comprimento; a espessura abre e fecha com w
        const nq = arc.j.frames.length, fr = arc.j.frames[Math.floor((t / 1000) * 30) % nq].frame, dist = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0), sx = dist / 168;
        g.save(); g.imageSmoothingEnabled = false; g.translate(Math.round(x0), Math.round(y0)); g.rotate(ang); g.scale(sx, Math.max(0.5, Math.min(1.05, sx)) * Math.min(1, w));
        g.drawImage(arc.im, fr.x, fr.y, fr.w, fr.h, -41, -60, fr.w, fr.h); g.restore();
      } else for (const [e, cor, alfa] of camadas) {
        g.globalAlpha = alfa;
        let ax = x0, ay = y0;
        for (let k = 1; k <= N; k++) {
          const f = k / N, on = k === N ? 0 : Math.sin(t / 45 + k * 1.4) * 2 * w;
          const bx = Math.round(x0 + (x1 - x0) * f + (nx / nl) * on), by = Math.round(y0 + (y1 - y0) * f + (ny / nl) * on);
          linha(ax - e / 2, ay - e / 2, bx - e / 2, by - e / 2, cor, e); ax = bx; ay = by;
        }
      }
      g.globalAlpha = 1;
      if (!arc) for (const [x, y, r] of [[x0, y0, 7], [x1, y1, 10]]) { const rr = Math.round(r * w + Math.sin(t / 30) * 1.5); if (rr > 1) { ellipse(g, Math.round(x), Math.round(y), rr + 2, rr + 2, cc.c); ellipse(g, Math.round(x), Math.round(y), rr, rr, cc.l); ellipse(g, Math.round(x), Math.round(y), Math.max(1, rr - 3), Math.max(1, rr - 3), '#ffffff'); } }
      if (t > 100) for (let k = 0; k < 2; k++) { // faíscas saltando do ponto de impacto
        const an = hash(Math.floor(t / 16), k + 3) * Math.PI * 2;
        parts.push({ x: x1, y: y1, vx: Math.cos(an) * 1.8, vy: Math.sin(an) * 1.8 - 0.8, g: 0.06, t0: agora, vida: 320, c: ESTILO[b.tipo].cores[k % 3], tam: 2 });
      }
      return true;
    });

    discos = discos.filter((q) => { // disco girando: 0-350 vai até o alvo, 350-700 passa, curva e volta a ele, 700-1050 volta ao dono
      const t = agora - q.t0; if (t >= 1050) return false;
      const T = pos(q.d, agora), O = pos(q.a, agora), ox = O.x, oy = O.y - 14, tx = T.x, ty = T.y - 12;
      const dx = tx - ox, dy = ty - oy, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, nx = -uy * q.lado, ny = ux * q.lado;
      const bx = tx + ux * 55 + nx * 34, by = ty + uy * 55 + ny * 34; // ponto de curva, além do alvo e de lado
      let x, y;
      const e1 = (u) => u * u * (3 - 2 * u);
      if (t < 350) { const u = t / 350; x = q.x0 + (tx - q.x0) * u; y = q.y0 + (ty - q.y0) * u; }
      else if (t < 525) { const u = e1((t - 350) / 175); x = tx + (bx - tx) * u; y = ty + (by - ty) * u; }
      else if (t < 700) { const u = e1((t - 525) / 175); x = bx + (tx - bx) * u; y = by + (ty - by) * u; }
      else { const u = e1((t - 700) / 350); x = tx + (ox - tx) * u; y = ty + (oy - ty) * u; }
      x = Math.round(x); y = Math.round(y);
      q.trail.push({ x, y }); if (q.trail.length > 7) q.trail.shift();
      const cc = corDe(q.tipo), ang = agora / 45;
      q.trail.forEach((p, j) => { g.globalAlpha = (j + 1) / q.trail.length * 0.4; ellipse(g, Math.round(p.x), Math.round(p.y), 8, 8, cc.c); }); g.globalAlpha = 1;
      for (let k = 0; k < 6; k++) { const an = ang + (k * Math.PI) / 3; px(g, Math.round(x + Math.cos(an) * 13) - 1, Math.round(y + Math.sin(an) * 13) - 1, 3, 3, k % 2 ? '#ffffff' : cc.l); } // dentes girando
      ellipse(g, x, y, 11, 11, cc.c); ellipse(g, x, y, 9, 9, cc.l); ellipse(g, x, y, 5, 5, cc.c); ellipse(g, x, y, 3, 3, '#ffffff');
      anel(x, y, 12, '#ffffff', 0.5, 20);
      return true;
    });

    esferas = esferas.filter((bq) => { // esfera gigante arremessada: acelera até o alvo, deixando rastro; esquiva trava o alvo antes do contato
      const p = Math.min(1, (agora - bq.t0) / bq.dur);
      if (bq.e.esquiva && !bq.fixo && p >= 0.7) { bq.fixo = pos(bq.d, agora); esquivar(bq.e); }
      const al = bq.fixo || pos(bq.d, agora), k = Math.pow(p, 1.7), x = Math.round(bq.x0 + (al.x - bq.x0) * k), y = Math.round(bq.y0 + (al.y - 12 - bq.y0) * k), cc = corDe(bq.tipo), ro = 32 + Math.round(5 * p) + Math.round(Math.sin(agora / 40) * 2);
      bq.trail.push({ x, y }); if (bq.trail.length > 8) bq.trail.shift();
      bq.trail.forEach((t, j) => { g.globalAlpha = (j + 1) / bq.trail.length * 0.5; ellipse(g, Math.round(t.x), Math.round(t.y), Math.round(ro * (j + 1) / bq.trail.length), Math.round(ro * (j + 1) / bq.trail.length * 0.9), cc.c); }); g.globalAlpha = 1;
      anel(x, y, ro + 5, cc.l, 0.7, 4); ellipse(g, x, y, ro + 2, ro + 2, cc.c); ellipse(g, x, y, ro, ro, cc.l); ellipse(g, x, y, Math.max(1, ro - 8), Math.max(1, ro - 8), '#ffffff');
      quebraPerto(x, y, 30, bq.e.atq);
      if (p >= 1) { impacto(bq.e); return false; }
      return true;
    });

    novas = novas.filter((n) => { // Supernova: disco de luz que some e três anéis largos saindo do atacante
      const t = agora - n.t0; if (t >= n.dur) return false;
      const q = t / n.dur, cc = corDe(n.tipo);
      g.globalAlpha = 0.22 * (1 - q); const R = Math.round(430 * Math.pow(q, 0.6)); ellipse(g, Math.round(n.x), Math.round(n.y - 12), R, Math.round(R * 0.8), '#ffffff'); g.globalAlpha = 1;
      [['#ffffff', 0], [cc.l, 70], [cc.c, 140]].forEach(([cor, atraso]) => { const qq = (t - atraso) / (n.dur - 140); if (qq <= 0 || qq >= 1) return; const rr = 430 * Math.pow(qq, 0.6); for (let w = 0; w < 3; w++) anel(n.x, n.y - 12, rr - w * 2, cor, 1 - qq, Math.max(0.6, 340 / Math.max(rr, 20))); });
      return true;
    });

    ondas = ondas.filter((w) => agora - w.t0 < 260);
    for (const w of ondas) {
      const q = (agora - w.t0) / 260;
      anel(w.x, w.y, 4 + q * (w.grande ? 36 : 24), w.cor, 1 - q, 12);
      for (let k = 0; k < 8; k++) { const an = (k * Math.PI) / 4, d = 6 + q * 22; px(g, w.x + Math.cos(an) * d, w.y + Math.sin(an) * d, 2, 2, '#ffffff'); }
    }
    raios = raios.filter((w) => agora - w.t0 < 240); // descarga elétrica no ponto do impacto
    for (const w of raios) for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2 + hash(Math.floor(agora / 50), k); raioZig(w.x, w.y, w.x + Math.cos(an) * 26, w.y + Math.sin(an) * 22, Math.floor(agora / 50) + k, 3); }
    desenharNuvens(agora);
    fxs = fxs.filter((f) => drawFx(f.nome, f.x, f.y, agora - f.t0, { escala: f.escala, flip: f.flip }));
    parts = parts.filter((p) => agora - p.t0 < p.vida);
    for (const p of parts) { const t = (agora - p.t0) / 16; px(g, p.x + p.vx * t, p.y + p.vy * t + p.g * t * t, p.tam, p.tam, p.c); }

    if (clarao && agoraReal - clarao.t0 < clarao.dur) { // crítico: clarão branco rápido sobre o campo
      g.globalAlpha = 0.45 * (1 - (agoraReal - clarao.t0) / clarao.dur); g.fillStyle = '#ffffff'; g.fillRect(-8, -8, W + 16, H + 16); g.globalAlpha = 1;
    }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 4;
    rotulos = rotulos.filter((o) => agora - o.t0 < o.vida);
    for (const o of rotulos) {
      if (o.tipo && !NOME_GOLPE_LIGADO) continue; // rótulo com o nome do golpe (ícone do elemento + nome): desligado no teste
      const p = pos(o.i, agora), y = Math.round(p.y + o.dy - ((agora - o.t0) / o.vida) * 10), x = Math.round(p.x);
      g.font = '700 ' + o.tam + 'px "Pixelify Sans", monospace';
      if (o.tipo) { // golpe usado: ícone do elemento + nome
        const w = g.measureText(o.txt).width; desenharIcone(g, o.tipo, x - w / 2 - 8, y);
        g.strokeStyle = OUT; g.strokeText(o.txt, x + 6, y); g.fillStyle = o.cor; g.fillText(o.txt, x + 6, y);
      } else { g.strokeStyle = OUT; g.strokeText(o.txt, x, y); g.fillStyle = o.cor; g.fillText(o.txt, x, y); }
    }
    onos = onos.filter((o) => agora - o.t0 < o.vida); // onomatopeias: entram "estourando" (escala 0,5 -> 1,4 -> 1,1), sobem, giram um pouco e somem
    for (const o of onos) {
      const q = (agora - o.t0) / o.vida, esc = q < 0.15 ? 0.5 + (q / 0.15) * 0.6 : q < 0.3 ? 1.1 - ((q - 0.15) / 0.15) * 0.15 : 0.95 + (q - 0.3) * 0.1;
      g.save(); g.globalAlpha = q > 0.75 ? Math.max(0, (1 - q) / 0.25) : 1;
      g.translate(Math.round(o.x), Math.round(o.y - q * 12)); g.rotate(o.rot); g.scale(esc, esc);
      g.font = o.tam + 'px "Press Start 2P", monospace';
      g.strokeStyle = OUT; g.lineWidth = 4; g.strokeText(o.txt, 0, 0); g.fillStyle = o.cor; g.fillText(o.txt, 0, 0);
      g.restore();
    }
    nums = nums.filter((n) => agora - n.t0 < 800);
    for (const n of nums) {
      g.font = '700 ' + n.tam + 'px "Pixelify Sans", monospace';
      const y = Math.round(n.y - ((agora - n.t0) / 800) * 22);
      g.strokeStyle = OUT; g.strokeText(n.txt, Math.round(n.x), y); g.fillStyle = n.cor; g.fillText(n.txt, Math.round(n.x), y);
    }

    for (let i = 0; i < 2; i++) { hpVis[i] += (hpAlvo[i] - hpVis[i]) * 0.3; hpLag[i] += (hpAlvo[i] - hpLag[i]) * 0.05; }
    const dn = (i) => Math.max(0, 1 - (agoraReal - hudHit[i]) / 320); // 1 no golpe, cai a 0 em 320 ms
    desenharTimes(g, agoraReal);
    painel(g, 6, 8, 172, 0, bt.lados[0].m, hpVis[0], hpLag[0], agoraReal, dn(0), !bt.fim && bt.lados[0].hp > 0 && bt.lados[0].cd.ultimate <= 0);   // você, à esquerda
    painel(g, 182, 8, 172, 1, bt.lados[1].m, hpVis[1], hpLag[1], agoraReal, dn(1)); // adversário, à direita
    if (ko) { // escurece o campo no fim da luta (o cartão de resultado entra no centro, sem banner de K.O.)
      const q = Math.min(1, (agora - ko.t0) / 400);
      g.globalAlpha = 0.4 * q; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    }
    g.restore();
  }

  window.PixmonArena = { iniciar, eventos, quadro, monstro, icone, CORES }; // monstro e CORES expostos para a folha de conferência (?folha)
})();
