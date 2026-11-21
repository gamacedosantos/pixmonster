// Ginasio da Pedra (identidade visual v2), ao norte do Farol: so os dados; o desenho vem do construtor mundo-base.js (estilo de vila). 60 x 110 tiles (W6 do PLANO-fases.md).
// Pedreira: patio de pedra com muitas rochas, trilha do sul ate o ginasio no norte (telhado cinza; a porta G chama o lider Guto, 4o ginasio, sem loja); 2 treinadores no caminho.
// Legenda: . pedra · , trilha/patio · " mato alto · ~ agua · T arvore (muro) · G porta do ginasio · v saida para o Farol (sul)
window.PixmonMundo20 = window.PixmonBase.criar({
  id: 'pedra', nome: 'Ginásio da Pedra', W: 60, H: 110, bioma: 'montanha', elemento: 'terra', nvMais: 3, densidade: 0.1, semAleatorios: true, vaoSul: [8],
  tinta: { trilha: [0.8, 0.78, 0.78], agua: [1, 1, 1], grama: { lum: [0.95, 0.9, 0.85] } }, recolorir: { ginasio_f: 'cinza' },
  imagens: { ginasio_f: 'ginasio_f.png', poste: 'prop_poste.png' },
  terreno: ({ ret, mato, grade }) => {
    ret(8, 98, 9, 109, ','); ret(8, 98, 30, 99, ','); ret(29, 19, 30, 99, ','); ret(18, 20, 41, 30, ',');
    mato(3, 40, 24, 96); mato(36, 40, 57, 96); mato(3, 8, 15, 36); mato(44, 8, 57, 36); mato(12, 102, 57, 106);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(8, 108, 9, 109, ','); grade[109][8] = grade[109][9] = 'v';
    grade[19][29] = grade[19][30] = 'G';
  },
  predios: [['ginasio_f', 26, 14, 8, 5]],
  props: ({ pr, grade }) => {
    [24, 36, 50, 64, 78, 92].forEach((r) => { pr('poste', 28, r); pr('poste', 31, r); }); pr('placa', 31, 21);
    for (let k = 0; k < 130; k++) { const c = 3 + (k * 37) % 54, r = 3 + (k * 53) % 104; if (grade[r][c] === '.' && grade[r][c + 1] === '.') pr('pedra', c, r); } // rochas espalhadas
  },
  npcs: [
    { id: 'ivan', nome: 'Ivan', pele: '#d8a878', c: 20, r: 99, dir: 'cima', vis: 3, cor: '#3a2a18', camisa: '#8a5a2b', cab: '#a8793f' },
    { id: 'olga', nome: 'Olga', pele: '#f6d3bb', c: 30, r: 70, dir: 'esq', vis: 3, cor: '#6a6a78', camisa: '#6a4a2a', cab: '#1b1410' },
  ],
  ginasios: { G: 'guto' },
  portais: { v: { area: 'farol', c: 8, r: 2 } },
});
