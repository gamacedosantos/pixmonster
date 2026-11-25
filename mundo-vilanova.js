// "Vila nova" (TESTE do mapa em imagem): o chão inteiro é uma imagem do PixelLab; prédios, fontes e árvores são sprites recortados da mesma imagem,
// desenhados por cima na ordem de profundidade (o Pix passa atrás do telhado e da copa). Os dados (peças, bloqueios, saídas) vêm de
// mundo-vilanova-dados.js, gerado por `node montar-mapa.mjs mapas/vilanova.mjs`; ?debugmapa mostra os bloqueios. Só se chega pelo botão de teste.
(function () {
  const D = window.PixmonDados.vilanova, T = D.T, RES = [240, 427], bloq = new Set(D.bloq);
  const IM = {}, DEBUG = /debugmapa/.test(location.search);
  const carregar = (k, f) => { const im = new Image(); im.onload = () => { IM[k] = im; }; im.src = f; };
  carregar('chao', D.chao); D.pecas.forEach(([k, , , , anim]) => { carregar(k, D.pasta + k + '.png'); if (anim) carregar(k + '_anim', D.pasta + k + '_anim.png'); }); // _anim = tira de 8 quadros lado a lado (PixelLab)

  const SETA = { '^': [0, -1], v: [0, 1], '<': [-1, 0], '>': [1, 0] };
  function desenhar(g, cx, cy, extras) {
    g.fillStyle = '#1f3a22'; g.fillRect(0, 0, RES[0], RES[1]);
    if (!IM.chao) return;
    g.save(); g.translate(-cx, -cy); g.drawImage(IM.chao, 0, 0);
    const objs = extras.slice();
    const q = Math.floor(performance.now() / 130) % 8;
    for (const [c0, r0, c1, r1] of D.agua || []) for (let r = Math.max(r0, Math.floor(cy / T) - 1); r <= Math.min(r1, Math.ceil((cy + RES[1]) / T)); r++) for (let c = c0; c <= c1; c++) { // ondinhas deslizando no rio
      const h = (c * 7 + r * 13) % 16, o = (c * 5 + r * 11) % 3, t = performance.now();
      g.fillStyle = 'rgba(190,225,250,.45)'; g.fillRect(c * T + ((h + t / 160) % 16 | 0) % 14, r * T + 3 + o * 5, 4, 1); g.fillRect(c * T + ((h * 3 + 9 + t / 200) % 16 | 0) % 14, r * T + 9 + o * 2, 3, 1);
      g.fillStyle = 'rgba(30,70,140,.25)'; g.fillRect(c * T + ((h + 5 + t / 240) % 16 | 0) % 14, r * T + 6 + o * 3, 5, 1); }
    D.pecas.forEach(([k, x, y, base]) => { const im = IM[k], an = IM[k + '_anim']; if (!im || y >= cy + RES[1] || y + im.height <= cy) return;
      objs.push({ y: base, f: () => { if (an) { const w = an.width / 8; g.drawImage(an, q * w, 0, w, an.height, x, y, w, an.height); } else g.drawImage(im, x, y); } }); });
    D.mapa.forEach((l, r) => { if (r * T < cy - T || r * T > cy + RES[1]) return; [...l].forEach((ch, c) => { if (!SETA[ch]) return; objs.push({ y: -1, f: () => { // seta amarela pulsando nas saídas
      const [dx, dy] = SETA[ch], o = Math.sin(performance.now() / 180) * 2, x = c * T + 8 + dx * o, y = r * T + 8 + dy * o;
      const tri = (a, b, cor) => { g.fillStyle = cor; g.beginPath(); g.moveTo(x + dx * a, y + dy * a); g.lineTo(x - dx * b - dy * a, y - dy * b + dx * a); g.lineTo(x - dx * b + dy * a, y - dy * b - dx * a); g.fill(); };
      tri(6, 4, '#1b1020'); tri(4, 2.5, '#ffd35a'); } }); }); });
    objs.sort((a, b) => a.y - b.y).forEach((o) => o.f());
    for (const [texto, x, y] of D.marcas || []) { // plaquinha flutuante sobre a porta (ginásio e mercado)
      g.font = '700 9px "Pixelify Sans", sans-serif'; const w = Math.ceil(g.measureText(texto).width) + 10, b = Math.sin(performance.now() / 320) * 1.5;
      g.fillStyle = 'rgba(27,16,32,.9)'; g.fillRect(Math.round(x - w / 2), Math.round(y + b), w, 13); g.strokeStyle = '#ffd35a'; g.lineWidth = 1; g.strokeRect(Math.round(x - w / 2) + .5, Math.round(y + b) + .5, w - 1, 12);
      g.fillStyle = '#fff6d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, x, Math.round(y + b) + 7);
    }
    if (DEBUG) { g.fillStyle = 'rgba(255,0,0,.35)'; bloq.forEach((k) => { const [c, r] = k.split(',').map(Number); g.fillRect(c * T, r * T, T, T); }); }
    g.restore();
  }

  (window.PixmonAreasExtra = window.PixmonAreasExtra || {}).vilanova = {
    nome: 'Vila nova', largura: D.W, bioma: 'vila', elemento: null, v2: true, T, res: RES, mapa: D.mapa, bloq, desenhar, npcs: [],
    ginasios: { G: 'dan' },
    portais: { '^': { area: 'rota1', c: 13, r: 61 }, '<': { area: 'lago', c: 33, r: 26 }, '>': { area: 'fazenda', c: 2, r: 22 }, v: { area: 'vila', c: 19, r: 36 } },
  };
})();
