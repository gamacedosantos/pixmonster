// Bosque norte (identidade visual v2, mesmo estilo do Bosque), ao norte da Vila do Vento: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W4 do PLANO-fases.md).
// Entra pelo sul (vindo da Vila do Vento), trilha em zigue-zague, lagoa no meio e uma clareira ao norte; 4 treinadores. · ^ saida para o Castelo (norte).
// Legenda: . grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · v saida para a Vila do Vento (sul)
window.PixmonMundo16 = window.PixmonBase.criar({
  id: 'bosquen', nome: 'Bosque norte', W: 60, H: 110, bioma: 'floresta', elemento: 'terra', nvMais: 3, vaoSul: [28, 30], vaoNorte: [28, 30],
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(20, 62, 40, 84);
    ret(29, 90, 30, 109, ','); ret(12, 88, 47, 89, ','); ret(12, 60, 13, 89, ','); ret(12, 58, 47, 59, ','); ret(46, 30, 47, 59, ','); ret(12, 28, 47, 29, ','); ret(29, 20, 30, 29, ','); ret(16, 8, 44, 20, ',');
    mato(3, 62, 9, 92); mato(16, 92, 28, 106); mato(32, 92, 56, 106); mato(50, 60, 57, 88); mato(3, 30, 40, 56); mato(3, 8, 12, 26); mato(48, 8, 57, 26); mato(16, 62, 18, 86);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(29, 108, 30, 109, ','); grade[109][29] = grade[109][30] = 'v';
    ret(29, 0, 30, 7, ','); grade[0][29] = grade[0][30] = '^'; // saida norte para o Castelo
  },
  props: ({ pr }) => { pr('placa', 32, 104); pr('tronco_reto', 20, 94, 2); pr('tronco_reto', 42, 50, 2); pr('tronco_reto', 6, 50, 2); pr('monolito', 29, 12, 2); },
  npcs: [
    { id: 'alex', nome: 'Alex', pele: '#e8c090', c: 20, r: 89, dir: 'cima', vis: 3, cor: '#2a1a10', camisa: '#e0703a', cab: '#ffd35a' },
    { id: 'vini', nome: 'Vini', pele: '#f0c8a0', c: 13, r: 75, dir: 'esq', vis: 3, cor: '#1b1410', camisa: '#4aa3d8', cab: '#f4f9fc' },
    { id: 'cida', nome: 'Cida', pele: '#c89a70', c: 30, r: 59, dir: 'cima', vis: 3, cor: '#0e0e12', camisa: '#a8793f', cab: '#3a9a4a' },
    { id: 'raul', nome: 'Raul', pele: '#d8a878', c: 47, r: 45, dir: 'esq', vis: 3, cor: '#7a3a1a', camisa: '#5a8a3a', cab: '#ffffff' },
  ],
  portais: { v: { area: 'vilavento', c: 46, r: 2 }, '^': { area: 'castelo', c: 29, r: 106 } },
});
