// Floresta Oculta (identidade visual v2, versao noite magica), ao norte do Bosque: so os dados; o desenho vem do construtor mundo-base.js.
// Mesma arte do Bosque, chao e verde mais escuros e azulados, camada roxa e vagalumes. So tem monstros evoluidos (soEvo) e +4 niveis (nvMais) e dois treinadores que andam pela clareira (Ryu e Lee).
// Mapa de 36 x 64 tiles. Legenda: . grama · , trilha/clareira · " mato alto · ~ agua · T arvore (muro) · v saida para o Bosque (sul) · ^ saida para a Vila do Raio (norte)
window.PixmonMundo7 = window.PixmonBase.criar({
  id: 'oculta', nome: 'Floresta Oculta', W: 36, H: 64, bioma: 'floresta', elemento: null, soEvo: true, nvMais: 4,
  tinta: { trilha: [0.55, 0.5, 0.62], agua: [0.6, 0.7, 0.95], grama: [0.5, 0.68, 0.78] }, camada: 'rgba(50,20,100,0.30)', vagalumes: 90, vaoSul: [12], vaoNorte: [12],
  // trilha em S do sul ate uma clareira grande ao norte (onde Ryu e Lee andam); laguinho a leste
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(29, 38, 33, 45);
    ret(12, 54, 13, 63, ','); ret(12, 50, 26, 53, ','); ret(25, 36, 26, 51, ','); ret(9, 34, 26, 35, ','); ret(9, 22, 10, 35, ','); ret(6, 8, 29, 21, ',');
    mato(3, 55, 10, 61); mato(16, 55, 24, 61); mato(14, 38, 22, 48); mato(2, 24, 7, 32); mato(14, 24, 22, 32); mato(28, 48, 32, 53);
    ret(0, 0, 35, 1, 'T'); ret(0, 62, 35, 63, 'T'); ret(0, 0, 1, 63, 'T'); ret(34, 0, 35, 63, 'T');
    ret(12, 62, 13, 63, ','); grade[63][12] = grade[63][13] = 'v';
    ret(12, 0, 13, 7, ','); grade[0][12] = grade[0][13] = '^'; // saida norte para a Vila do Raio
  },
  props: ({ pr }) => { pr('placa', 14, 58); pr('monolito', 17, 12, 2); pr('tronco_reto', 14, 30, 2); pr('tronco_reto', 20, 44, 2); pr('tronco_reto', 3, 40, 2); },
  npcs: [
    { id: 'ryu', nome: 'Ryu', pele: '#f0c8a0', c: 8, r: 10, dir: 'baixo', vis: 4, cor: '#1b1410', camisa: '#f4f0e8', cab: '#d83a2a',
      paradas: [{ c: 8, r: 10, espera: [900, 2200] }, { c: 20, r: 10, espera: [900, 2200] }, { c: 20, r: 18, espera: [900, 2200] }, { c: 8, r: 18, espera: [900, 2200] }] },
    { id: 'lee', nome: 'Lee', pele: '#e8c090', c: 27, r: 12, dir: 'esq', vis: 4, cor: '#0e0e12', camisa: '#ffd35a', cab: '#1b1410',
      paradas: [{ c: 27, r: 12, espera: [800, 2000] }, { c: 13, r: 15, espera: [800, 2000] }, { c: 27, r: 19, espera: [800, 2000] }, { c: 11, r: 10, espera: [800, 2000] }] },
  ],
  portais: { v: { area: 'bosque', c: 12, r: 2 }, '^': { area: 'vilaraio', c: 29, r: 106 } },
});
