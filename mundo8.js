// Lago 2 (identidade visual v2), a oeste do Lago: so os dados; o desenho vem do construtor mundo-base.js. Area de 60 x 110 tiles (3x em area, W1 do PLANO-fases.md).
// Lagao no meio, cercado por uma trilha em anel (sul, oeste, leste e norte), clareira grande ao norte, lagoa no sul e mato alto nas margens. Selvagens de agua (3x) e +1 nivel; 5 treinadores.
// Legenda: . grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · > saida para o Lago (leste). < saida para a Vila da Agua (oeste) · ^ saida para a Floresta Escondida (norte).
window.PixmonMundo8 = window.PixmonBase.criar({
  id: 'lago2', nome: 'Lago 2', W: 60, H: 110, bioma: 'lago', elemento: 'agua', nvMais: 1,
  tinta: { trilha: [0.85, 0.8, 0.75], agua: [1, 1, 1], grama: [0.9, 0.95, 0.9] }, vaoLeste: [96, 98], vaoOeste: [60, 62], vaoNorte: [28, 30],
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(14, 42, 44, 88); aguaRet(10, 50, 48, 78); aguaRet(18, 38, 40, 92); aguaRet(36, 100, 48, 106); // lagao do meio e lagoa do sul
    ret(6, 96, 59, 97, ','); ret(6, 34, 7, 97, ','); ret(52, 34, 53, 97, ','); ret(6, 34, 53, 35, ','); // anel de trilhas em volta do lagao
    ret(14, 14, 44, 31, ','); ret(29, 2, 30, 13, ',');                                               // clareira do norte e a trilha que sobe
    ret(29, 30, 30, 35, ',');                                                                          // liga a clareira ao anel
    mato(3, 8, 12, 28); mato(46, 8, 57, 28); mato(2, 40, 5, 92); mato(54, 40, 57, 92); mato(9, 99, 33, 106); mato(50, 99, 57, 106); mato(14, 5, 27, 11); mato(32, 5, 45, 11);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(54, 96, 59, 97, ','); grade[96][59] = grade[97][59] = '>';
    ret(0, 60, 7, 61, ','); grade[60][0] = grade[61][0] = '<'; // saida oeste para a Vila da Agua
    ret(29, 0, 30, 1, ','); grade[0][29] = grade[0][30] = '^'; // saida norte para a Floresta Escondida
  },
  props: ({ pr }) => { pr('placa', 55, 94); pr('tronco_reto', 20, 94, 2); pr('tronco_reto', 40, 36, 2); pr('tronco_reto', 8, 30, 2); pr('tronco_reto', 50, 30, 2); },
  npcs: [
    { id: 'caio', nome: 'Caio', pele: '#e8c090', c: 36, r: 97, dir: 'cima', vis: 3, cor: '#3a2a18', camisa: '#2f78a8', cab: '#f4f0e8' },
    { id: 'duda', nome: 'Duda', pele: '#f0c8a0', c: 53, r: 60, dir: 'esq', vis: 3, cor: '#1b1410', camisa: '#4aa3d8', cab: '#ffd35a' },
    { id: 'nico', nome: 'Nico', pele: '#c89a70', c: 7, r: 70, dir: 'esq', vis: 3, cor: '#0e0e12', camisa: '#2f78a8', cab: '#6fd6ff' },
    { id: 'bela', nome: 'Bela', pele: '#f6d3bb', c: 22, r: 22, dir: 'baixo', vis: 4, cor: '#7a3a1a', camisa: '#4aa3d8', cab: '#a8793f' },
    { id: 'rafa', nome: 'Rafa', pele: '#e8c090', c: 36, r: 18, dir: 'esq', vis: 4, cor: '#2a1a10', camisa: '#2f78a8', cab: '#ffffff',
      paradas: [{ c: 36, r: 18, espera: [900, 2200] }, { c: 36, r: 28, espera: [900, 2200] }, { c: 20, r: 28, espera: [900, 2200] }, { c: 20, r: 18, espera: [900, 2200] }] },
  ],
  portais: { '>': { area: 'lago', c: 2, r: 26 }, '<': { area: 'vilaagua', c: 57, r: 60 }, '^': { area: 'escondida', c: 29, r: 106 } },
});
