// Vila do Raio (identidade visual v2), ao norte da Floresta Oculta (e, no futuro, destino do teleporte do Castelo): so os dados; o desenho vem do construtor mundo-base.js (estilo de vila). 60 x 110 tiles (W3 do PLANO-fases.md).
// Vila de montanha eletrica: entra pelo sul, avenida norte-sul com o ginasio no topo (telhado amarelo; a porta G chama o lider Du), praca com a loja (porta L), rua das casas e muito mato alto nas bordas.
// Legenda: . grama · , rua/praca · " mato alto · ~ agua · T arvore (muro) · L porta da loja · G porta do ginasio · v saida para a Floresta Oculta (sul)
window.PixmonMundo13 = window.PixmonBase.criar({
  id: 'vilaraio', nome: 'Vila do Raio', W: 60, H: 110, bioma: 'montanha', elemento: 'eletrico', nvMais: 3, densidade: 0.3, semAleatorios: true, vaoSul: [28, 30],
  tinta: { trilha: [0.8, 0.8, 0.9], agua: [1, 1, 1], grama: [0.85, 0.95, 0.95] }, camada: 'rgba(40,60,120,0.10)',
  recolorir: { ginasio_f: 'amarelo' }, // telhado vermelho vira amarelo
  imagens: { casa_1_f: 'casa_1_f.png', casa_2_f: 'casa_2_f.png', casa_3_f: 'casa_3_f.png', loja_f: 'loja_f.png', ginasio_f: 'ginasio_f.png', fonte: 'fonte.png', flores: 'flores.png',
    poste: 'prop_poste.png', correio_manual: 'prop_correio_manual.png', banco_reto: 'prop_banco_reto.png' },
  terreno: ({ ret, mato, grade }) => {
    ret(29, 19, 30, 109, ','); ret(20, 56, 39, 72, ','); ret(8, 88, 51, 89, ',');       // avenida, praca e a rua das casas
    mato(3, 8, 20, 30); mato(40, 8, 57, 30); mato(3, 40, 15, 80); mato(44, 40, 57, 80); mato(3, 96, 24, 106); mato(35, 96, 57, 106);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(29, 108, 30, 109, ','); grade[109][29] = grade[109][30] = 'v';
    grade[19][29] = grade[19][30] = 'G'; grade[61][24] = grade[61][25] = 'L';
    grade[49][20] = grade[49][21] = 'H';                                                 // F3: porta do hospital (a casa em cima)
  },
  predios: [['ginasio_f', 26, 14, 8, 5], ['loja_f', 22, 58, 6, 3], ['fonte', 28, 64, 4, 3],
    ['casa_1_f', 18, 36, 6, 3], ['casa_3_f', 38, 36, 6, 3], ['casa_2_f', 18, 46, 6, 3], ['casa_1_f', 38, 46, 6, 3],
    ['casa_3_f', 10, 85, 6, 3], ['casa_2_f', 20, 85, 6, 3], ['casa_1_f', 38, 85, 6, 3], ['casa_3_f', 46, 85, 6, 3],
    ['casa_2_f', 10, 92, 6, 3], ['casa_1_f', 20, 92, 6, 3], ['casa_3_f', 38, 92, 6, 3], ['casa_2_f', 46, 92, 6, 3]],
  props: ({ pr }) => {
    [24, 32, 42, 52, 76, 82, 96, 104].forEach((r) => { pr('poste', 28, r); pr('poste', 31, r); });
    pr('placa', 31, 21); [[22, 68], [36, 68], [22, 70], [36, 70]].forEach(([c, r]) => pr('banco_reto', c, r)); [[21, 57], [38, 57]].forEach(([c, r]) => pr('flores', c, r, 2));
    [[10, 36], [44, 38], [8, 50], [50, 52], [10, 70], [48, 70]].forEach(([c, r]) => pr('pedra', c, r));
    [[17, 39], [44, 39], [17, 49], [44, 49]].forEach(([c, r]) => pr('correio_manual', c, r));
  },
  eventos: { H: 'hospital' }, correios: [{ c: 17, r: 49, msg: 'Hospital' }], // tratados em index.html (cb.evento)
  npcs: [
    window.PixmonLessi('lessi4', 23, 50),
    { id: 'vovo4', nome: 'Vovô', sprite: 'vovo', servico: 'loja', c: 26, r: 62, vis: 0, cor: '#5a3a20', dir: 'baixo', paradas: [{ c: 26, r: 62, espera: [6000, 11000] }, { c: 27, r: 62, espera: [2500, 4000] }, { c: 27, r: 63, espera: [2500, 4000] }] }, 
    { id: 'pedro', nome: 'Pedro', pele: '#e8c090', c: 14, r: 89, dir: 'cima', vis: 3, cor: '#2a1a10', camisa: '#f0d048', cab: '#6fd6ff' },
    { id: 'lara', nome: 'Lara', pele: '#f0c8a0', c: 30, r: 48, dir: 'esq', vis: 3, cor: '#0e0e12', camisa: '#e8b830', cab: '#fff2a0' },
  ],
  ginasios: { G: 'du' },
  portais: { v: { area: 'oculta', c: 12, r: 2 } },
});
