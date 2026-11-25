// Vila da Agua (identidade visual v2), a oeste do Lago 2: so os dados; o desenho vem do construtor mundo-base.js (estilo de vila). 60 x 110 tiles (3x em area, W1 do PLANO-fases.md).
// Avenida norte-sul com o ginasio no topo (a porta G chama a lider Tati), praca com fonte e loja (porta L), duas ruas de casas, lagoa do porto a oeste e outra a leste, mato alto nas bordas.
// Legenda: . grama · , rua/praca · " mato alto · ~ agua · T arvore (muro) · L porta da loja · G porta do ginasio · > saida para o Lago 2 (leste). < saida para a Praia (oeste).
window.PixmonMundo9 = window.PixmonBase.criar({
  id: 'vilaagua', nome: 'Vila da Água', W: 60, H: 110, bioma: 'lago', elemento: 'agua', nvMais: 1, densidade: 0.3, semAleatorios: true, vaoLeste: [60, 62], vaoOeste: [38, 40],
  tinta: { trilha: [0.95, 0.9, 0.85], agua: [1, 1, 1], grama: [0.95, 1, 0.95] },
  recolorir: { ginasio_f: 'rb' }, // o ginasio de agua: o telhado vermelho vira azul
  imagens: { casa_1_f: 'casa_1_f.png', casa_2_f: 'casa_2_f.png', casa_3_f: 'casa_3_f.png', loja_f: 'loja_f.png', ginasio_f: 'ginasio_f.png', fonte: 'fonte.png', horta: 'horta.png', flores: 'flores.png',
    poste: 'prop_poste.png', correio_manual: 'prop_correio_manual.png', banco_reto: 'prop_banco_reto.png', cerca_manual: 'prop_cerca_manual.png' },
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(4, 56, 14, 76); aguaRet(46, 68, 56, 82);                                   // lagoa do porto (oeste) e lagoa leste
    ret(29, 19, 30, 105, ','); ret(18, 56, 41, 76, ','); ret(41, 60, 59, 61, ',');       // avenida, praca e a rua da saida leste
    ret(8, 38, 51, 39, ','); ret(8, 86, 51, 87, ',');                                    // ruas das casas
    mato(3, 8, 20, 30); mato(40, 8, 57, 30); mato(3, 92, 26, 105); mato(33, 92, 57, 105);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(54, 60, 59, 61, ','); grade[60][59] = grade[61][59] = '>';
    ret(0, 38, 7, 39, ','); grade[38][0] = grade[39][0] = '<';                            // saida oeste para a Praia
    grade[19][29] = grade[19][30] = 'G';                                                 // porta do ginasio (embaixo do predio)
    grade[61][22] = grade[61][23] = 'L';                                                 // porta da loja
    grade[38][12] = grade[38][13] = 'H';                                                 // F3: porta do hospital (a casa em cima)
  },
  predios: [['ginasio_f', 26, 14, 8, 5], ['loja_f', 20, 58, 6, 3], ['fonte', 28, 64, 4, 3],
    ['casa_1_f', 10, 35, 6, 3], ['casa_2_f', 20, 35, 6, 3], ['casa_3_f', 38, 35, 6, 3], ['casa_1_f', 46, 35, 6, 3],
    ['casa_3_f', 10, 88, 6, 3], ['casa_1_f', 20, 88, 6, 3], ['casa_2_f', 38, 88, 6, 3], ['casa_3_f', 46, 88, 6, 3]],
  props: ({ pr }) => {
    [24, 30, 42, 48, 80, 92, 100].forEach((r) => { pr('poste', 28, r); pr('poste', 31, r); });
    pr('placa', 31, 21); [[22, 68], [36, 68], [22, 72], [36, 72]].forEach(([c, r]) => pr('banco_reto', c, r));
    [[19, 57], [38, 57], [19, 73], [38, 73]].forEach(([c, r], i) => pr(i % 2 ? 'horta' : 'flores', c, r, 2));
    [[9, 37], [36, 37], [9, 90], [36, 90]].forEach(([c, r]) => pr('correio_manual', c, r));
  },
  eventos: { H: 'hospital' }, correios: [{ c: 9, r: 37, msg: 'Hospital' }], // tratados em index.html (cb.evento)
  npcs: [
    window.PixmonLessi('lessi2', 15, 38),
    { id: 'vovo2', nome: 'Vovô', sprite: 'vovo', servico: 'loja', c: 24, r: 62, vis: 0, cor: '#5a3a20', dir: 'baixo', paradas: [{ c: 24, r: 62, espera: [6000, 11000] }, { c: 25, r: 62, espera: [2500, 4000] }, { c: 25, r: 63, espera: [2500, 4000] }] }, 
    { id: 'lia', nome: 'Lia', pele: '#f6d3bb', c: 24, r: 39, dir: 'cima', vis: 3, cor: '#6a3a1a', camisa: '#2f78a8', cab: '#ffffff' },
    { id: 'beto', nome: 'Beto', pele: '#d8a878', c: 30, r: 24, dir: 'esq', vis: 3, cor: '#1b1410', camisa: '#4aa3d8', cab: '#ffd35a' },
  ],
  ginasios: { G: 'tati' },
  portais: { '>': { area: 'lago2', c: 2, r: 60 }, '<': { area: 'praia', c: 57, r: 60 } },
});
