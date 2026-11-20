// Praia (identidade visual v2, bioma novo: areia e mar), a oeste da Vila da Agua: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W6 do PLANO-fases.md).
// Mar a oeste, faixa de areia (o chao e pintado por luminosidade, cor de areia), trilha ao longo da costa que sobe ao Farol, ramal a leste para a Vila da Agua, enseada ao sudeste e barcos; 4 treinadores.
// Legenda: . areia · , trilha · " mato alto (dunas) · ~ agua · T arvore (muro) · > saida para a Vila da Agua (leste) · ^ saida para o Farol (norte)
window.PixmonMundo18 = window.PixmonBase.criar({
  id: 'praia', nome: 'Praia', W: 60, H: 110, bioma: 'lago', elemento: 'agua', nvMais: 3, densidade: 0.08, semAleatorios: true, vaoLeste: [60, 62], vaoNorte: [34],
  tinta: { trilha: [0.95, 0.85, 0.7], agua: [1, 1.05, 1.1], grama: { lum: [1.28, 1.17, 0.86] } },
  imagens: { barco: 'barco.png' },
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(2, 2, 24, 106); aguaRet(44, 80, 56, 100);                                  // mar a oeste e enseada a sudeste
    ret(34, 6, 35, 104, ','); ret(34, 60, 59, 61, ',');                                  // trilha da costa e o ramal leste
    mato(40, 8, 57, 50); mato(40, 64, 57, 78); mato(27, 10, 32, 56); mato(27, 64, 32, 104); mato(40, 102, 57, 106);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(54, 60, 59, 61, ','); grade[60][59] = grade[61][59] = '>';
    ret(34, 0, 35, 7, ','); grade[0][34] = grade[0][35] = '^';
  },
  props: ({ pr, grade }) => {
    pr('placa', 36, 58); pr('barco', 21, 40); pr('barco', 22, 72); pr('barco', 50, 90);
    for (let k = 0; k < 60; k++) { const c = 3 + (k * 37) % 54, r = 3 + (k * 53) % 104; if (grade[r][c] === '.' && grade[r][c + 1] === '.') pr('pedra', c, r); } // rochas espalhadas
  },
  npcs: [
    { id: 'dani', nome: 'Dani', pele: '#e8c090', c: 35, r: 90, dir: 'esq', vis: 3, cor: '#1b1410', camisa: '#4aa3d8', cab: '#ffd35a' },
    { id: 'lipe', nome: 'Lipe', pele: '#c89a70', c: 35, r: 30, dir: 'esq', vis: 3, cor: '#7a3a1a', camisa: '#f0d048', cab: '#ffffff' },
    { id: 'rosa', nome: 'Rosa', pele: '#f0c8a0', c: 46, r: 61, dir: 'cima', vis: 3, cor: '#3a2a18', camisa: '#c8508a', cab: '#ffd35a' },
    { id: 'edu', nome: 'Edu', pele: '#d8a878', c: 35, r: 15, dir: 'esq', vis: 3, cor: '#0e0e12', camisa: '#2f78a8', cab: '#f4f0e8' },
  ],
  portais: { '>': { area: 'vilaagua', c: 2, r: 38 }, '^': { area: 'farol', c: 34, r: 106 } },
});
