// Montanha (identidade visual v2, bioma novo: rocha), a leste do Bosque leste: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W4 do PLANO-fases.md).
// Mesma arte do Bosque com o chao pintado por luminosidade (cinza-azulado), arvores mais frias e muitas rochas. Trilha em zigue-zague que sobe do oeste (vindo do Bosque leste) ate uma clareira ao norte, de onde sai a trilha para a Montanha 2; tarn no meio; 4 treinadores.
// Legenda: . pedra/grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · < saida para o Bosque leste (oeste) · ^ saida para a Montanha 2 (norte)
window.PixmonMundo14 = window.PixmonBase.criar({
  id: 'montanha', nome: 'Montanha', W: 60, H: 110, bioma: 'montanha', elemento: 'eletrico', nvMais: 2, densidade: 0.25, vaoOeste: [90, 92], vaoNorte: [28, 30], semAleatorios: true,
  tinta: { trilha: [0.75, 0.72, 0.72], agua: [0.9, 1, 1.15], grama: { lum: [0.78, 0.82, 0.9] } }, recolorir: { arvore_b: 'frio', arvore_d: 'frio' },
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(20, 52, 36, 66);
    ret(0, 90, 40, 91, ','); ret(40, 70, 41, 91, ','); ret(14, 70, 41, 71, ','); ret(14, 50, 15, 71, ','); ret(14, 48, 46, 49, ','); ret(45, 26, 46, 49, ','); ret(14, 26, 46, 27, ','); ret(29, 0, 30, 27, ','); ret(18, 6, 42, 16, ',');
    mato(3, 74, 12, 88); mato(3, 94, 12, 106); mato(18, 74, 38, 88); mato(44, 74, 57, 100); mato(3, 30, 12, 66); mato(38, 52, 43, 66); mato(18, 30, 42, 46); mato(48, 30, 57, 60); mato(3, 8, 15, 24);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(0, 90, 7, 91, ','); grade[90][0] = grade[91][0] = '<';
    ret(29, 0, 30, 1, ','); grade[0][29] = grade[0][30] = '^';
  },
  props: ({ pr, grade }) => {
    pr('placa', 4, 88);
    for (let k = 0; k < 90; k++) { const c = 3 + (k * 37) % 54, r = 3 + (k * 53) % 104; if (grade[r][c] === '.' && grade[r][c + 1] === '.') pr('pedra', c, r); } // rochas espalhadas pelo chao
  },
  npcs: [
    { id: 'tito', nome: 'Tito', pele: '#d8a878', c: 20, r: 91, dir: 'cima', vis: 3, cor: '#3a2a18', camisa: '#f0d048', cab: '#f0d048' },
    { id: 'leo', nome: 'Leo', pele: '#f0c8a0', c: 41, r: 80, dir: 'esq', vis: 3, cor: '#1b1410', camisa: '#e8b830', cab: '#6fd6ff' },
    { id: 'sofi', nome: 'Sofi', pele: '#f6d3bb', c: 30, r: 71, dir: 'cima', vis: 3, cor: '#7a3a1a', camisa: '#f0d048', cab: '#ffffff' },
    { id: 'gil', nome: 'Gil', pele: '#c89a70', c: 46, r: 38, dir: 'esq', vis: 3, cor: '#0e0e12', camisa: '#e8b830', cab: '#e0703a' },
  ],
  portais: { '<': { area: 'bosquel', c: 57, r: 30 }, '^': { area: 'montanha2', c: 29, r: 106 } },
});
