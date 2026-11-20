// Castelo (identidade visual v2, bioma novo: pedra), ao norte do Bosque norte: so os dados; o desenho vem do construtor mundo-base.js (muros de pedra e glifos). 60 x 110 tiles (W5 do PLANO-fases.md).
// Tres patios em fila separados por muros com portao, e o salao do trono ao norte, dividido em duas alas: a oeste o BAU (C), a leste a CHAVE (guardada pelo Vlad). Ao centro do salao, o TELEPORTE (X) leva a Vila do Raio; na parede norte, uma PORTA trancada (D) que a chave ainda nao abre: a passagem sera pensada depois.
// Legenda: , piso de pedra · R muro · C bau · K chave · D porta trancada · X teleporte · v saida para o Bosque norte (sul)
window.PixmonMundo17 = window.PixmonBase.criar({
  id: 'castelo', nome: 'Castelo', W: 60, H: 110, bioma: 'montanha', elemento: null, nvMais: 3, densidade: 0, semAleatorios: true, muros: true, glifos: true,
  tinta: { trilha: { lum: [0.82, 0.84, 0.96] }, agua: [1, 1, 1], grama: { lum: [0.7, 0.72, 0.84] } }, camada: 'rgba(30,30,60,0.12)',
  imagens: { fonte: 'fonte.png', poste: 'prop_poste.png' },
  eventos: { C: 'bau', K: 'chave', D: 'porta' },
  terreno: ({ ret, grade }) => {
    ret(2, 2, 57, 107, ',');                                              // piso de pedra em todo o castelo
    ret(0, 0, 59, 1, 'R'); ret(0, 108, 59, 109, 'R'); ret(0, 0, 1, 109, 'R'); ret(58, 0, 59, 109, 'R'); // muralha externa
    ret(29, 108, 30, 109, ','); grade[109][29] = grade[109][30] = 'v';   // portao sul
    ret(2, 70, 57, 71, 'R'); ret(29, 70, 30, 71, ',');                    // muro do patio 1 (portao no centro)
    ret(2, 38, 57, 39, 'R'); ret(29, 38, 30, 39, ',');                    // muro do patio 2 (portao no centro)
    ret(29, 4, 30, 30, 'R');                                              // parede que divide o salao do trono em ala oeste e ala leste
    grade[6][6] = 'C'; grade[6][52] = 'K';                                // bau a oeste, chave a leste
    grade[0][29] = grade[0][30] = grade[1][29] = grade[1][30] = 'D';      // porta trancada na parede norte
    grade[34][29] = grade[34][30] = 'X';                                  // teleporte
  },
  predios: [['fonte', 28, 90, 4, 3]],
  props: ({ pr }) => { [76, 84, 96, 102, 46, 54, 62].forEach((r) => { pr('poste', 24, r); pr('poste', 35, r); }); },
  npcs: [
    { id: 'odin', nome: 'Odin', pele: '#e8c090', c: 26, r: 98, dir: 'dir', vis: 4, cor: '#6a6a78', camisa: '#8a8ea8', cab: '#d8b878' },
    { id: 'kira', nome: 'Kira', pele: '#f0c8a0', c: 35, r: 60, dir: 'esq', vis: 6, cor: '#1b1410', camisa: '#c8508a', cab: '#ffd35a' },
    { id: 'hans', nome: 'Hans', pele: '#d8a878', c: 31, r: 40, dir: 'esq', vis: 2, cor: '#3a2a18', camisa: '#4a67b8', cab: '#f0d048' },
    { id: 'vlad', nome: 'Vlad', pele: '#f6d3bb', c: 52, r: 9, dir: 'cima', vis: 3, cor: '#0e0e12', camisa: '#7a2a2a', cab: '#1b1020' },
  ],
  portais: { v: { area: 'bosquen', c: 29, r: 2 }, X: { area: 'vilaraio', c: 29, r: 100 } },
});
