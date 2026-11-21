// Bosque leste (identidade visual v2, mesmo estilo do Bosque), a leste da Fazenda: so os dados; o desenho vem do construtor mundo-base.js. 60 x 110 tiles (W2 do PLANO-fases.md).
// Entra pela Fazenda (oeste), trilha em S ate uma clareira grande no canto nordeste, um ramal ao sul e uma lagoa; 5 treinadores. A saida leste leva a Montanha (W4).
// Legenda: . grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · < saida para a Fazenda (oeste)
window.PixmonMundo11 = window.PixmonBase.criar({
  id: 'bosquel', nome: 'Bosque leste', W: 60, H: 110, bioma: 'floresta', elemento: 'ar', nvMais: 2, vaoOeste: [60, 62], vaoLeste: [30, 32],
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(36, 70, 52, 88);
    ret(0, 60, 30, 61, ','); ret(30, 30, 31, 61, ','); ret(30, 30, 56, 31, ','); ret(56, 8, 57, 31, ','); ret(38, 6, 58, 20, ','); ret(14, 60, 15, 100, ','); ret(14, 98, 56, 99, ',');
    mato(3, 8, 28, 28); mato(33, 34, 54, 56); mato(18, 64, 32, 94); mato(3, 64, 12, 100); mato(18, 102, 56, 106); mato(54, 64, 57, 96); mato(3, 34, 26, 56);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(0, 60, 7, 61, ','); grade[60][0] = grade[61][0] = '<';
    ret(54, 30, 59, 31, ','); grade[30][59] = grade[31][59] = '>'; // saida leste para a Montanha
  },
  props: ({ pr }) => { pr('placa', 4, 58); pr('tronco_reto', 24, 58, 2); pr('tronco_reto', 44, 58, 2); pr('tronco_reto', 40, 92, 2); },
  npcs: [
    { id: 'gabi', nome: 'Gabi', pele: '#f6d3bb', c: 24, r: 61, dir: 'cima', vis: 3, cor: '#1b1410', camisa: '#d8ecf6', cab: '#d83a2a' },
    { id: 'toni', nome: 'Toni', pele: '#d8a878', c: 31, r: 45, dir: 'esq', vis: 3, cor: '#3a2a18', camisa: '#6fd6ff', cab: '#5a3a1a' },
    { id: 'cris', nome: 'Cris', pele: '#e8c090', c: 44, r: 31, dir: 'cima', vis: 3, cor: '#6a3a1a', camisa: '#d8ecf6', cab: '#f0d048' },
    { id: 'joca', nome: 'Joca', pele: '#c89a70', c: 48, r: 14, dir: 'baixo', vis: 4, cor: '#0e0e12', camisa: '#6fd6ff', cab: '#ffffff',
      paradas: [{ c: 48, r: 14, espera: [900, 2200] }, { c: 54, r: 14, espera: [900, 2200] }, { c: 54, r: 8, espera: [900, 2200] }, { c: 42, r: 8, espera: [900, 2200] }] },
    { id: 'fabi', nome: 'Fabi', pele: '#f0c8a0', c: 15, r: 80, dir: 'esq', vis: 3, cor: '#7a3a1a', camisa: '#d8ecf6', cab: '#2f78a8' },
  ],
  portais: { '<': { area: 'fazenda', c: 37, r: 22 }, '>': { area: 'montanha', c: 2, r: 90 } },
});
