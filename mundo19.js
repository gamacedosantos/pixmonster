// Farol (identidade visual v2, costa), ao norte da Praia: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W6 do PLANO-fases.md).
// Costa de areia com mar a leste e lagoa a oeste; trilha do sul ate o FAROL (torre listrada desenhada em codigo) no nordeste e um ramal a oeste que sobe ate o Ginasio da Pedra; 3 treinadores.
// Legenda: . areia · , trilha · " mato alto (dunas) · ~ agua · T arvore (muro) · v saida para a Praia (sul) · ^ saida para o Ginasio da Pedra (norte)
window.PixmonMundo19 = window.PixmonBase.criar({
  id: 'farol', nome: 'Farol', W: 60, H: 110, bioma: 'lago', elemento: 'ar', nvMais: 3, densidade: 0.08, semAleatorios: true, vaoSul: [34], vaoNorte: [8],
  tinta: { trilha: [0.95, 0.85, 0.7], agua: [1, 1.05, 1.1], grama: { lum: [1.2, 1.12, 0.88] } },
  sprites: { farol: { w: 48, h: 96, desenhar: (g) => {
    for (let y = 24; y < 92; y++) { const t = (y - 24) / 68, half = 10 + t * 8, x0 = Math.round(24 - half), wd = Math.round(half * 2); g.fillStyle = Math.floor((y - 24) / 12) % 2 ? '#d83a2a' : '#f4f0e8'; g.fillRect(x0, y, wd, 1); g.fillStyle = '#1b1020'; g.fillRect(x0, y, 1, 1); g.fillRect(x0 + wd - 1, y, 1, 1); } // corpo listrado, afinando para cima
    g.fillStyle = '#6b6f86'; g.fillRect(8, 90, 32, 6); g.fillStyle = '#3a3c52'; g.fillRect(10, 20, 28, 4);                              // base de pedra e galeria
    g.fillStyle = '#ffe27a'; g.fillRect(16, 8, 16, 12); g.fillStyle = '#fff6c8'; g.fillRect(19, 10, 10, 8); g.fillStyle = '#1b1020'; g.fillRect(16, 8, 16, 1); g.fillRect(16, 19, 16, 1); g.fillRect(23, 8, 2, 12); // lanterna
    g.fillStyle = '#d83a2a'; g.fillRect(14, 4, 20, 4); g.fillRect(18, 1, 12, 3); g.fillRect(22, 0, 4, 2);                                  // telhado
    g.fillStyle = '#5a3a1a'; g.fillRect(20, 80, 8, 10); g.fillStyle = '#1b1020'; g.fillRect(20, 80, 8, 1);                                  // porta
  } } },
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(42, 44, 57, 104); aguaRet(12, 50, 28, 100);                                  // mar a leste e lagoa a oeste
    ret(34, 18, 35, 109, ','); ret(8, 40, 35, 41, ','); ret(8, 2, 9, 41, ','); ret(34, 18, 52, 19, ',');
    mato(36, 22, 56, 38); mato(3, 8, 7, 36); mato(11, 2, 30, 38); mato(3, 44, 10, 104); mato(30, 50, 33, 104); mato(36, 44, 40, 104);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(34, 108, 35, 109, ','); grade[109][34] = grade[109][35] = 'v';
    ret(8, 0, 9, 1, ','); grade[0][8] = grade[0][9] = '^';
  },
  predios: [['farol', 45, 12, 3, 6]],
  props: ({ pr }) => { pr('placa', 37, 104); pr('tronco_reto', 14, 20, 2); },
  npcs: [
    { id: 'jair', nome: 'Jair', pele: '#d8a878', c: 35, r: 70, dir: 'esq', vis: 3, cor: '#3a2a18', camisa: '#d8ecf6', cab: '#d83a2a' },
    { id: 'moa', nome: 'Moa', pele: '#f6d3bb', c: 48, r: 19, dir: 'cima', vis: 3, cor: '#1b1410', camisa: '#6fd6ff', cab: '#2f78a8' },
    { id: 'teo', nome: 'Teo', pele: '#c89a70', c: 20, r: 41, dir: 'cima', vis: 3, cor: '#0e0e12', camisa: '#d8ecf6', cab: '#ffd35a' },
  ],
  portais: { v: { area: 'praia', c: 34, r: 2 }, '^': { area: 'pedra', c: 8, r: 106 } },
});
