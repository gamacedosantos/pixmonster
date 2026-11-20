// Montanha 2 (identidade visual v2, rocha e neve), ao norte da Montanha e ao sul da Vila do Vento: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W4 do PLANO-fases.md).
// Mais alta: chao claro azulado (neve), arvores brancas, lago congelado no meio, rochas; trilha em zigue-zague do sul ate uma clareira ao norte, de onde segue para a Vila do Vento; 4 treinadores.
// Legenda: . neve/grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · v saida para a Montanha (sul) · ^ saida para a Vila do Vento (norte)
window.PixmonMundo15 = window.PixmonBase.criar({
  id: 'montanha2', nome: 'Montanha 2', W: 60, H: 110, bioma: 'montanha', elemento: 'ar', nvMais: 3, densidade: 0.2, vaoSul: [28, 30], vaoNorte: [28, 30], semAleatorios: true,
  tinta: { trilha: [0.85, 0.85, 0.9], agua: [1.1, 1.15, 1.3], grama: { lum: [1.05, 1.12, 1.25] } }, camada: 'rgba(200,220,255,0.14)', recolorir: { arvore_b: 'neve', arvore_d: 'neve' },
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(14, 64, 44, 90);
    ret(29, 96, 30, 109, ','); ret(8, 94, 30, 95, ','); ret(8, 58, 9, 95, ','); ret(8, 58, 50, 59, ','); ret(49, 28, 50, 59, ','); ret(18, 28, 50, 29, ','); ret(18, 10, 19, 29, ','); ret(18, 10, 40, 11, ','); ret(29, 0, 30, 11, ','); ret(22, 4, 38, 9, ',');
    mato(3, 62, 6, 92); mato(12, 96, 28, 106); mato(32, 96, 56, 106); mato(46, 62, 57, 92); mato(3, 30, 16, 56); mato(22, 32, 46, 56); mato(3, 12, 15, 26); mato(42, 12, 57, 26);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(29, 108, 30, 109, ','); grade[109][29] = grade[109][30] = 'v';
    ret(29, 0, 30, 1, ','); grade[0][29] = grade[0][30] = '^';
  },
  props: ({ pr, grade }) => {
    pr('placa', 32, 104);
    for (let k = 0; k < 90; k++) { const c = 3 + (k * 37) % 54, r = 3 + (k * 53) % 104; if (grade[r][c] === '.' && grade[r][c + 1] === '.') pr('pedra', c, r); } // rochas espalhadas pelo chao
  },
  npcs: [
    { id: 'elis', nome: 'Elis', pele: '#f6d3bb', c: 20, r: 95, dir: 'cima', vis: 3, cor: '#7a3a1a', camisa: '#bfe0f0', cab: '#ffffff' },
    { id: 'maru', nome: 'Maru', pele: '#e8c090', c: 9, r: 78, dir: 'esq', vis: 3, cor: '#1b1410', camisa: '#8a8a98', cab: '#c8508a' },
    { id: 'dino', nome: 'Dino', pele: '#d8a878', c: 30, r: 59, dir: 'cima', vis: 3, cor: '#0e0e12', camisa: '#4a67b8', cab: '#fff2a0' },
    { id: 'ney', nome: 'Ney', pele: '#c89a70', c: 50, r: 44, dir: 'esq', vis: 3, cor: '#3a2a18', camisa: '#6fd6ff', cab: '#ffd35a' },
  ],
  portais: { v: { area: 'montanha', c: 29, r: 2 }, '^': { area: 'vilavento', c: 29, r: 106 } },
});
