// Floresta Escondida (identidade visual v2, mesmo estilo do Bosque), ao norte do Lago 2 e a oeste do Bosque: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W2 do PLANO-fases.md).
// Trilha em zigue-zague do sul (vindo do Lago 2) ate uma clareira ao norte, com um ramal que sai a leste para o Bosque; lagoa no meio e mato alto nas margens. 4 treinadores.
// Legenda: . grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · v saida para o Lago 2 (sul) · > saida para o Bosque (leste)
window.PixmonMundo10 = window.PixmonBase.criar({
  id: 'escondida', nome: 'Floresta Escondida', W: 60, H: 110, bioma: 'floresta', elemento: 'terra', nvMais: 1, vaoSul: [28, 30], vaoLeste: [30, 32],
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(20, 46, 36, 62);
    ret(29, 96, 30, 109, ','); ret(10, 94, 30, 95, ','); ret(10, 70, 11, 95, ','); ret(10, 68, 48, 69, ','); ret(47, 30, 48, 69, ','); ret(14, 42, 48, 43, ','); ret(14, 18, 15, 43, ','); ret(14, 16, 44, 17, ','); ret(20, 4, 50, 15, ',');
    mato(3, 76, 9, 92); mato(14, 72, 28, 92); mato(34, 72, 56, 92); mato(3, 20, 12, 60); mato(17, 20, 45, 40); mato(50, 34, 57, 66); mato(14, 98, 28, 106); mato(32, 98, 56, 106);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(29, 108, 30, 109, ','); grade[109][29] = grade[109][30] = 'v';
    ret(54, 30, 59, 31, ','); grade[30][59] = grade[31][59] = '>';
  },
  props: ({ pr }) => { pr('placa', 32, 104); pr('tronco_reto', 20, 92, 2); pr('tronco_reto', 38, 50, 2); pr('tronco_reto', 13, 52, 2); },
  npcs: [
    { id: 'dora', nome: 'Dora', pele: '#f0c8a0', c: 20, r: 95, dir: 'cima', vis: 3, cor: '#3a2a18', camisa: '#8a5a2b', cab: '#a8793f' },
    { id: 'kaio', nome: 'Kaio', pele: '#c89a70', c: 11, r: 80, dir: 'esq', vis: 3, cor: '#0e0e12', camisa: '#6a4a2a', cab: '#f4f9fc' },
    { id: 'maya', nome: 'Maya', pele: '#e8c090', c: 40, r: 69, dir: 'cima', vis: 3, cor: '#7a3a1a', camisa: '#8a5a2b', cab: '#ffd35a' },
    { id: 'zeca', nome: 'Zeca', pele: '#f6d3bb', c: 48, r: 50, dir: 'esq', vis: 3, cor: '#2a1a10', camisa: '#6a4a2a', cab: '#3a9a4a' },
  ],
  portais: { v: { area: 'lago2', c: 29, r: 2 }, '>': { area: 'bosque', c: 2, r: 44 } },
});
