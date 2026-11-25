// F6 Batalha visual: cenários por área e por ginásio, e a cena de pré-batalha (VS). Tudo desenhado em código (360x640).
// Não toca no battle.js: o bioma de jogo (bônus de elemento) continua o de sempre; aqui é só o visual por cima do fundo da arena.
// Usado pelo arena.js: PixmonCenarios.area(g, id, sem), .ginasio(g, id, icone), .pre(g, info, ms, desenhaMon).
(function () {
  const { px, PAL } = PixelDraw;
  const W = 360, H = 640;
  const rnd = (s) => { let x = (s >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const tom = (g, cor, a) => { g.globalAlpha = a; g.fillStyle = cor; g.fillRect(0, 0, W, H); g.globalAlpha = 1; };
  const alfa = (g, a, fn) => { g.globalAlpha = a; fn(); g.globalAlpha = 1; };
  // pontos espalhados fora do miolo da arena (centro 180,338, raio ~140), para o cenário não cobrir quem luta
  const fora = (R, n, rmin = 150, y0 = 40, y1 = 600) => { const o = []; for (let t = 0; o.length < n && t < n * 40; t++) { const x = 6 + Math.floor(R() * (W - 12)), y = y0 + Math.floor(R() * (y1 - y0)); if (Math.hypot(x - 180, (y - 338) * 0.8) >= rmin) o.push([x, y]); } return o; };

  const chama = (g, x, y, t) => { const f = Math.floor(t / 110) % 3; px(g, x - 3, y - 2, 6, 5, '#b04a22'); px(g, x - 2, y - 5 - f, 4, 6, '#e0703a'); px(g, x - 1, y - 7 - f, 2, 5, '#ffd35a'); };
  const tocha = (g, x, y) => { px(g, x - 1, y, 3, 12, PAL.outline); px(g, x, y, 1, 11, '#74502c'); px(g, x - 3, y - 2, 7, 3, '#3a3a44'); chama(g, x, y - 3, 0); };
  const neve = (g, R, n) => fora(R, n, 140).forEach(([x, y]) => { px(g, x, y, 9, 3, '#f4f9fc'); px(g, x + 2, y - 2, 5, 2, '#f4f9fc'); px(g, x + 1, y + 3, 7, 1, '#bfe0f0'); });
  const cerca = (g, x0, x1, y) => { for (let x = x0; x < x1; x += 22) { px(g, x, y - 12, 4, 16, PAL.outline); px(g, x + 1, y - 11, 2, 14, '#a8793f'); } px(g, x0, y - 8, x1 - x0, 3, PAL.outline); px(g, x0, y - 7, x1 - x0, 1, '#d8b878'); px(g, x0, y - 1, x1 - x0, 3, PAL.outline); px(g, x0, y, x1 - x0, 1, '#d8b878'); };
  const raios = (g, a) => alfa(g, a, () => { g.fillStyle = '#fff6b0'; for (const x of [40, 120, 210, 290]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 26, 0); g.lineTo(x + 130, 560); g.lineTo(x + 60, 560); g.fill(); } });
  const vagalumes = (g, R, n, cor) => fora(R, n, 100).forEach(([x, y]) => { px(g, x, y, 2, 2, cor); alfa(g, 0.3, () => px(g, x - 1, y - 1, 4, 4, cor)); });
  const nevoa = (g, y0, y1, a) => { for (let y = y0; y < y1; y += 4) alfa(g, a * (1 - Math.abs((y - (y0 + y1) / 2) / ((y1 - y0) / 2))), () => px(g, 0, y, W, 4, '#e8eef4')); };
  const vento = (g, R, n) => fora(R, n, 150).forEach(([x, y]) => { alfa(g, 0.55, () => { px(g, x, y, 22, 1, '#f4f9fc'); px(g, x + 22, y + 1, 6, 1, '#f4f9fc'); px(g, x + 28, y + 2, 3, 1, '#f4f9fc'); px(g, x + 5, y + 4, 14, 1, '#f4f9fc'); }); });
  const pedregulho = (g, x, y, s = 1) => { px(g, x, y, 14 * s, 9 * s, PAL.outline); px(g, x + 1, y + 1, 12 * s, 7 * s, '#8a8070'); px(g, x + 2, y + 1, 5 * s, 2 * s, '#b0a690'); px(g, x + 1, y + 6 * s, 12 * s, 2 * s, '#5e5648'); };
  const lava = (g, R, n) => fora(R, n, 150, 60, 590).forEach(([x, y]) => { const w = 14 + Math.floor(R() * 16); px(g, x, y, w, 3, '#5a1f10'); px(g, x + 1, y + 1, w - 2, 1, '#ff8a2a'); px(g, x + 3, y, 3, 1, '#ffd35a'); px(g, x + (w >> 1), y + 3, 2, 6, '#5a1f10'); px(g, x + (w >> 1), y + 4, 1, 4, '#e0703a'); });
  const poca = (g, x, y, w) => { px(g, x + 2, y, w - 4, 1, PAL.outline); px(g, x, y + 1, w, 7, PAL.outline); px(g, x + 2, y + 8, w - 4, 1, PAL.outline); px(g, x + 1, y + 1, w - 2, 7, '#4aa3d8'); px(g, x + 3, y + 2, w - 6, 2, '#8ccdf0'); px(g, x + 4, y + 2, 4, 1, '#f4f1e6'); px(g, x + 2, y + 6, w - 4, 1, '#2f78a8'); };

  // ---------- cenários por área (CENARIO_DA_AREA): o bioma de receita vem do jogo; aqui entram o tom e os detalhes próprios ----------
  // id = chave da área em PixmonMundo.AREAS. tom = [cor, alfa]; deco(g, R) pinta os detalhes (R = gerador com a semente da luta).
  const CENARIO_DA_AREA = {
    vila:       { nome: 'Vila',             tom: ['#ffb060', 0.12], deco: () => {} },
    rota1:      { nome: 'Rota 1',           tom: ['#d8c070', 0.14], deco: () => {} },
    fazenda:    { nome: 'Fazenda',          tom: ['#e8c860', 0.07], deco: () => {} },
    lago:       { nome: 'Lago',             tom: ['#6ab0e8', 0.06], deco: (g, R) => { fora(R, 8, 150).forEach(([x, y]) => alfa(g, 0.5, () => { px(g, x, y, 12, 1, '#f4f1e6'); px(g, x + 3, y + 2, 7, 1, '#f4f1e6'); })); } },
    bosque:     { nome: 'Bosque',           tom: ['#1c4a2a', 0.2],  deco: (g, R) => { raios(g, 0.07); vagalumes(g, R, 10, '#d8f070'); } },
    oculta:     { nome: 'Floresta Oculta',  tom: ['#3a1c5a', 0.34], deco: (g, R) => { vagalumes(g, R, 26, '#b8f0ff'); fora(R, 8, 150).forEach(([x, y]) => { px(g, x, y, 7, 4, '#7a4ac0'); px(g, x + 1, y - 2, 5, 2, '#c890ff'); px(g, x + 3, y + 4, 1, 3, '#d8c0f0'); }); } },
    escondida:  { nome: 'Floresta Escondida', tom: ['#2a5a3a', 0.26], deco: (g, R) => { raios(g, 0.05); vagalumes(g, R, 14, '#fff2a0'); nevoa(g, 420, 560, 0.1); } },
    lago2:      { nome: 'Lago 2',           tom: ['#2a78b8', 0.14], deco: (g, R) => { fora(R, 10, 150).forEach(([x, y]) => alfa(g, 0.5, () => { px(g, x, y, 14, 1, '#bfe8ff'); px(g, x + 3, y + 2, 8, 1, '#bfe8ff'); })); } },
    vilaagua:   { nome: 'Vila da Água',     tom: ['#4aa3d8', 0.1],  deco: () => {} },
    bosquel:    { nome: 'Bosque leste',     tom: ['#e08030', 0.16], deco: (g, R) => { fora(R, 28, 140).forEach(([x, y]) => px(g, x, y, 3, 2, R() < 0.5 ? '#e0703a' : '#f2c050')); } },
    bosquen:    { nome: 'Bosque norte',     tom: ['#5a6a7a', 0.22], deco: (g) => nevoa(g, 380, 620, 0.2) },
    vilavento:  { nome: 'Vila do Vento',    tom: ['#d8f0ff', 0.1],  deco: (g, R) => vento(g, R, 12) },
    vilaraio:   { nome: 'Vila do Raio',     tom: ['#403000', 0.22], deco: (g, R) => { fora(R, 7, 150).forEach(([x, y]) => { const s = [[0, 0], [3, 4], [-2, 8], [2, 12], [0, 16]]; s.forEach(([dx, dy], i) => i && px(g, x + dx, y + dy, 2, 5, '#fff2a0')); }); px(g, 330, 440, 4, 60, '#3a3a44'); px(g, 322, 440, 20, 3, '#3a3a44'); px(g, 328, 434, 8, 6, '#f0d048'); } },
    montanha:   { nome: 'Montanha',         tom: ['#8aa0c0', 0.12], deco: (g, R) => neve(g, R, 14) },
    montanha2:  { nome: 'Montanha 2',       tom: ['#c0d4e8', 0.2],  deco: (g, R) => { neve(g, R, 26); nevoa(g, 520, 640, 0.18); } },
    castelo:    { nome: 'Castelo',          tom: ['#2a2040', 0.48],  deco: (g, R) => { for (const y of [150, 330, 520]) { tocha(g, 14, y); tocha(g, 346, y); } for (const x of [30, 300]) { px(g, x, 8, 28, 40, PAL.outline); px(g, x + 2, 10, 24, 34, '#7a1c3a'); px(g, x + 2, 36, 24, 3, '#f2c050'); px(g, x + 11, 18, 6, 8, '#f2c050'); } } },
    praia:      { nome: 'Praia',            tom: ['#f0d890', 0.42],  deco: (g, R) => { px(g, 0, 0, W, 100, '#4aa3d8'); px(g, 0, 70, W, 24, '#8ccdf0'); for (let x = 0; x < W; x += 12) { px(g, x, 94 + ((x / 12) & 1) * 2, 10, 3, '#f4f1e6'); } px(g, 0, 100, W, 4, '#c8a860'); fora(R, 10, 150, 70, 600).forEach(([x, y]) => { px(g, x, y, 5, 3, '#f0a0a0'); px(g, x + 1, y - 1, 3, 1, '#f8d0d0'); }); fora(R, 4, 150, 70, 600).forEach(([x, y]) => { px(g, x, y, 7, 7, PAL.outline); px(g, x + 1, y + 1, 5, 5, '#e0703a'); px(g, x + 2, y + 3, 3, 1, '#ffd35a'); }); } },
    farol:      { nome: 'Farol',            tom: ['#0a1840', 0.5],  deco: (g, R) => { alfa(g, 0.12, () => { g.fillStyle = '#fff6b0'; g.beginPath(); g.moveTo(300, 40); g.lineTo(0, 200); g.lineTo(0, 330); g.fill(); }); px(g, 290, 20, 22, 62, PAL.outline); px(g, 292, 22, 18, 58, '#e8e0d0'); for (const y of [34, 58]) px(g, 292, y, 18, 8, '#c8383a'); px(g, 292, 8, 18, 14, '#f0d048'); px(g, 288, 6, 26, 3, PAL.outline); vagalumes(g, R, 12, '#fff6b0'); } },
    pedra:      { nome: 'Ginásio da Pedra', tom: ['#6a6256', 0.16], deco: (g, R) => fora(R, 7, 150).forEach(([x, y]) => pedregulho(g, x, y, 1 + (R() < 0.4 ? 1 : 0))) },
  };

  // ---------- cenários por ginásio: a quadra de pedra pintada na cor do elemento, com detalhes do líder ----------
  const CENARIO_GINASIO = {
    tati:  { nome: 'Ginásio da Maré',  el: 'agua',     tom: ['#5aa8f0', 0.4], deco: (g, R) => { poca(g, 24, 120, 46); poca(g, 290, 140, 46); poca(g, 20, 500, 52); poca(g, 288, 520, 52); for (let y = 90; y < 600; y += 40) alfa(g, 0.35, () => { px(g, 70, y, 8, 1, '#bfe8ff'); px(g, 280, y + 12, 8, 1, '#bfe8ff'); }); } },
    laura: { nome: 'Ginásio da Brisa', el: 'ar',       tom: ['#7fb8e8', 0.46], deco: (g, R) => { vento(g, R, 10); for (const [x, y] of [[20, 110], [300, 150], [16, 480], [296, 540]]) alfa(g, 0.85, () => { px(g, x, y + 6, 40, 8, '#f4f9fc'); px(g, x + 6, y, 26, 8, '#f4f9fc'); px(g, x + 12, y - 4, 14, 6, '#f4f9fc'); px(g, x, y + 12, 40, 2, '#bfe0f0'); }); } },
    du:    { nome: 'Ginásio da Faísca', el: 'eletrico', tom: ['#f0d048', 0.2], keep: true, deco: (g, R) => { fora(R, 9, 140, 60, 590).forEach(([x, y]) => { [[0, 0], [4, 5], [-2, 10], [3, 15]].forEach(([dx, dy], i) => i && px(g, x + dx, y + dy, 2, 6, '#fff2a0')); px(g, x + 1, y + 2, 1, 2, '#f0d048'); }); for (const x of [8, 340]) { px(g, x, 280, 12, 100, '#3a3a44'); px(g, x + 3, 270, 6, 12, '#6fd6ff'); } } },
    guto:  { nome: 'Ginásio da Rocha', el: 'terra',    tom: ['#a07038', 0.4], deco: (g, R) => { fora(R, 8, 150, 60, 590).forEach(([x, y]) => pedregulho(g, x, y, 1 + (R() < 0.4 ? 1 : 0))); fora(R, 6, 140, 60, 590).forEach(([x, y]) => { px(g, x, y, 22, 1, '#2a2218'); px(g, x + 9, y + 1, 1, 8, '#2a2218'); px(g, x + 3, y + 2, 5, 1, '#8dbb55'); }); } },
    dan:   { nome: 'Ginásio da Brasa', el: 'fogo',     tom: ['#e0501a', 0.42], deco: (g, R) => { lava(g, R, 8); for (const y of [150, 330, 520]) { tocha(g, 16, y); tocha(g, 344, y); } } },
  };

  function area(g, id, semente) {
    const c = CENARIO_DA_AREA[id];
    if (!c) return false; // área desconhecida: fica o fundo comum
    g.save(); g.imageSmoothingEnabled = false;
    tom(g, c.tom[0], c.tom[1]); c.deco(g, rnd((semente | 0) * 7 + 3));
    g.restore(); return true;
  }

  function ginasio(g, id, icone) { // chamado depois que a quadra (arena_ginasio.png) já foi desenhada
    const c = CENARIO_GINASIO[id];
    if (!c) return false;
    g.save(); g.imageSmoothingEnabled = false;
    g.globalCompositeOperation = 'multiply'; tom(g, c.tom[0], c.tom[1] + 0.1); g.globalCompositeOperation = 'source-over';
    tom(g, c.tom[0], c.tom[1] * 0.4);
    if (!c.keep) { // troca o raio do Du pelo emblema do elemento
      g.fillStyle = '#4a4238'; g.beginPath(); g.arc(180, 368, 28, 0, Math.PI * 2); g.fill();
      const ic = icone(c.el); g.drawImage(ic, Math.round(180 - ic.width * 1.5), Math.round(368 - ic.height * 1.5), ic.width * 3, ic.height * 3);
    }
    c.deco(g, rnd(id.length * 977 + id.charCodeAt(0)));
    const cor = { agua: '#4aa3d8', ar: '#bfe0f0', eletrico: '#f0d048', terra: '#a8793f', fogo: '#e0703a' }[c.el]; // faixas do elemento no teto
    for (const x of [58, 296]) { px(g, x, 6, 8, 26, PAL.outline); px(g, x + 1, 7, 6, 22, cor); px(g, x + 1, 26, 6, 3, '#ffffff'); }
    g.restore(); return true;
  }

  // ---------- pré-batalha ----------
  const DUR_PRE = 1800, DUR_PRE_SELVAGEM = 1000;
  const PELE = '#f0c8a0';
  function treinador(g, x, y, roupa, chapeu, flip, esc) { // 12x20 px de boneco, base em (x, y)
    g.save(); g.translate(x, y); g.scale(flip ? -esc : esc, esc);
    px(g, -5, -20, 10, 7, PAL.outline); px(g, -4, -19, 8, 5, chapeu); px(g, -4, -14, 8, 6, PAL.outline); px(g, -3, -14, 6, 5, PELE); px(g, 1, -13, 1, 2, PAL.outline);
    px(g, -5, -8, 10, 10, PAL.outline); px(g, -4, -8, 8, 8, roupa); px(g, -1, -8, 2, 8, '#ffffff');
    px(g, -4, 2, 4, 5, PAL.outline); px(g, -3, 2, 2, 4, '#3a3a50'); px(g, 0, 2, 4, 5, PAL.outline); px(g, 1, 2, 2, 4, '#3a3a50');
    g.restore();
  }
  const COR_EL = { agua: '#4aa3d8', fogo: '#e0703a', terra: '#a8793f', ar: '#8fb8d0', eletrico: '#d8b82a' };
  function texto(g, t, x, y, tam, cor) { g.font = '700 ' + tam + 'px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = PAL.outline; g.strokeText(t, x, y); g.fillStyle = cor; g.fillText(t, x, y); }
  // info = { a: {m, nome, el}, b: {m, nome, el, lider}, selvagem, icone(el) }; ms desde o início; desenhaMon(m, x, y, flip, esc)
  function pre(g, info, ms, desenhaMon) {
    const dur = info.selvagem ? DUR_PRE_SELVAGEM : DUR_PRE, q = Math.min(1, ms / dur);
    const ent = Math.min(1, ms / 380), e = 1 - Math.pow(1 - ent, 3), sai = q > 0.88 ? (q - 0.88) / 0.12 : 0;
    g.save(); g.imageSmoothingEnabled = false;
    alfa(g, 0.62 * (1 - sai), () => { g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H); });
    const ca = COR_EL[info.a.el] || '#4aa3d8', cb = COR_EL[info.b.el] || '#c8383a';
    if (!info.selvagem) { // duas faixas em diagonal entrando dos lados, uma em cada cor de elemento
      g.globalAlpha = 0.85 * (1 - sai);
      g.fillStyle = ca; g.beginPath(); g.moveTo(-360 + 360 * e, 640); g.lineTo(-360 + 360 * e, 400); g.lineTo(360 * e + 0, 300); g.lineTo(360 * e + 0, 640); g.fill();
      g.fillStyle = cb; g.beginPath(); g.moveTo(720 - 360 * e, 0); g.lineTo(720 - 360 * e, 250); g.lineTo(360 - 360 * e, 340); g.lineTo(360 - 360 * e, 0); g.fill();
      g.globalAlpha = 1;
    }
    const o = (1 - e) * 220, sc = 2.4, S = info.selvagem ? 1.6 : 2;
    g.globalAlpha = 1 - sai;
    if (info.selvagem) { // só o bicho, menor, com o nome embaixo
      const y = 360 + (1 - e) * 40;
      g.save(); g.translate(180, y); g.scale(S, S); desenhaMon(info.b.m, 0, 0, true, 1); g.restore();
      texto(g, info.b.nome, 180, y + 30, 18, '#ffffff');
      texto(g, 'selvagem', 180, y + 52, 11, '#ffd35a');
      const ic = info.icone(info.b.el); g.drawImage(ic, 180 - Math.round(ic.width / 2), y + 62);
    } else {
      treinador(g, 52 - o, 572, '#2f78a8', '#c8383a', false, sc); g.save(); g.translate(150 - o, 560); g.scale(S, S); desenhaMon(info.a.m, 0, 0, false, 1); g.restore();
      treinador(g, 308 + o, 262, info.b.lider ? cb : '#7a4a2a', info.b.lider ? '#ffd35a' : '#5c9a3c', true, sc); g.save(); g.translate(212 + o, 276); g.scale(S, S); desenhaMon(info.b.m, 0, 0, true, 1); g.restore();
      texto(g, info.a.nome, 52 - o, 592, 14, '#ffffff'); texto(g, info.a.m.nome, 150 - o, 608, 11, '#cfe0ff');
      texto(g, info.b.nome, 260 + o, 198, 14, info.b.lider ? '#ffd35a' : '#ffffff'); texto(g, info.b.m.nome, 212 + o, 300, 11, '#cfe0ff');
      for (const [l, x, y] of [[info.a, 150 - o, 512], [info.b, 212 + o, 226]]) {
        const ic = info.icone(l.el), n = info.rotuloEl(l.el, l.fam);
        g.font = '700 10px "Pixelify Sans", monospace'; const w = Math.round(g.measureText(n).width) + 24;
        g.fillStyle = PAL.outline; g.fillRect(Math.round(x - w / 2) - 1, y - 8, w + 2, 18); g.fillStyle = COR_EL[l.el] || '#555'; g.fillRect(Math.round(x - w / 2), y - 7, w, 16);
        g.drawImage(ic, Math.round(x - w / 2) + 4, y - Math.round(ic.height / 2) + 1); texto(g, n, x + 8, y + 1, 10, '#ffffff');
      }
      // VS no centro: entra grande e treme
      const vs = ms < 380 ? 0 : Math.min(1, (ms - 380) / 160), tr = ms > 380 && ms < 700 ? Math.round(Math.sin(ms / 25) * 3) : 0, vsE = 1 + (1 - vs) * 1.2;
      if (vs > 0) { g.save(); g.translate(180 + tr, 402); g.scale(vsE, vsE); g.globalAlpha = vs * (1 - sai); g.font = '34px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = PAL.outline; g.strokeText('VS', 0, 0); g.fillStyle = '#ffd35a'; g.fillText('VS', 0, 0); g.restore(); }
      if (info.area) texto(g, info.area, 180, 456, 10, '#bcd0e8');
    }
    texto(g, 'toque para pular', 180, 632, 8, '#8a90a8');
    g.restore();
    return q >= 1;
  }

  window.PixmonCenarios = { CENARIO_DA_AREA, CENARIO_GINASIO, area, ginasio, pre, DUR_PRE, DUR_PRE_SELVAGEM };
})();
