// Vila do Vento (identidade visual v2), a leste do Bosque leste (vem da Montanha 2, ao sul; o Bosque norte fica ao norte): so os dados; o desenho vem do construtor mundo-base.js (estilo de vila). 60 x 110 tiles (W3 do PLANO-fases.md).
// Campo aberto e ventoso: avenida norte-sul com o ginasio no topo (telhado verde; a porta G chama a lider Laura), avenida leste-oeste, praca com a loja (porta L), casas espalhadas, feno e espantalhos.
// Legenda: . grama · , rua/praca · " mato alto · ~ agua · T arvore (muro) · L porta da loja · G porta do ginasio · v saida para a Montanha 2 (sul) · ^ saida para o Bosque norte (norte).
window.PixmonMundo12 = window.PixmonBase.criar({
  id: 'vilavento', nome: 'Vila do Vento', W: 60, H: 110, bioma: 'campo', elemento: 'ar', nvMais: 2, densidade: 0.15, semAleatorios: true, vaoSul: [28, 30], vaoNorte: [46],
  tinta: { trilha: [0.95, 0.9, 0.85], agua: [1, 1, 1], grama: [0.95, 1, 0.95] },
  recolorir: { ginasio_f: 'rg' }, // telhado vermelho vira verde
  imagens: { casa_1_f: 'casa_1_f.png', casa_2_f: 'casa_2_f.png', casa_3_f: 'casa_3_f.png', loja_f: 'loja_f.png', ginasio_f: 'ginasio_f.png', fonte: 'fonte.png', horta: 'horta.png', flores: 'flores.png',
    poste: 'prop_poste.png', correio_manual: 'prop_correio_manual.png', banco_reto: 'prop_banco_reto.png', feno: 'feno.png', espantalho: 'espantalho.png' },
  terreno: ({ ret, mato, aguaRet, grade }) => {
    aguaRet(48, 80, 56, 92);
    ret(29, 19, 30, 109, ','); ret(0, 54, 50, 55, ','); ret(22, 46, 37, 63, ',');       // avenida norte-sul, avenida leste-oeste e a praca
    mato(3, 8, 20, 30); mato(49, 8, 57, 30); mato(3, 70, 15, 100); mato(44, 94, 57, 106);
    ret(0, 0, 59, 1, 'T'); ret(0, 108, 59, 109, 'T'); ret(0, 0, 1, 109, 'T'); ret(58, 0, 59, 109, 'T');
    ret(29, 108, 30, 109, ','); grade[109][29] = grade[109][30] = 'v';                    // saida sul para a Montanha 2
    ret(46, 2, 47, 53, ','); ret(46, 0, 47, 1, ','); grade[0][46] = grade[0][47] = '^';   // saida norte para o Bosque norte
    grade[19][29] = grade[19][30] = 'G'; grade[51][26] = grade[51][27] = 'L';             // portas do ginasio e da loja
  },
  predios: [['ginasio_f', 26, 14, 8, 5], ['loja_f', 24, 48, 6, 3], ['casa_2_f', 18, 30, 6, 3], ['casa_1_f', 38, 30, 6, 3], ['casa_3_f', 18, 40, 6, 3], ['casa_2_f', 38, 40, 6, 3],
    ['casa_1_f', 18, 70, 6, 3], ['casa_3_f', 38, 70, 6, 3], ['casa_2_f', 18, 82, 6, 3], ['casa_1_f', 38, 82, 6, 3]],
  props: ({ pr }) => {
    [24, 36, 44, 66, 76, 88, 100].forEach((r) => { pr('poste', 28, r); pr('poste', 31, r); });
    pr('placa', 31, 21); [[28, 58], [30, 58]].forEach(([c, r]) => pr('banco_reto', c, r));
    [[10, 60], [14, 62], [44, 60], [48, 64], [8, 34], [52, 36], [12, 96], [46, 100]].forEach(([c, r]) => pr('feno', c, r));
    [[12, 50], [44, 50], [8, 76], [50, 76]].forEach(([c, r]) => pr('espantalho', c, r));
    [[17, 33], [44, 33], [17, 43], [44, 43]].forEach(([c, r]) => pr('correio_manual', c, r));
  },
  npcs: [
    { id: 'rui', nome: 'Rui', pele: '#d8a878', c: 12, r: 55, dir: 'cima', vis: 3, cor: '#1b1410', camisa: '#d8ecf6', cab: '#ffffff' },
    { id: 'nana', nome: 'Nana', pele: '#f6d3bb', c: 30, r: 90, dir: 'esq', vis: 3, cor: '#7a3a1a', camisa: '#6fd6ff', cab: '#bfe0f0' },
  ],
  ginasios: { G: 'laura' },
  portais: { v: { area: 'montanha2', c: 29, r: 2 }, '^': { area: 'bosquen', c: 29, r: 106 } },
});
