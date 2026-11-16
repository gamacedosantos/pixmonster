// Ícones de pixel art (12x12, feitos em código) dos talentos: aparecem nos cards da escolha. Cada letra é uma cor da paleta abaixo; "." é transparente.
(function () {
  const PAL = {
    k: '#1b1020', r: '#e0453a', R: '#8a2430', p: '#ff9aa8', y: '#ffd35a', Y: '#c8941a', g: '#55c860', G: '#2f7a3a', b: '#4a9de8', B: '#285a9a',
    c: '#a8e0f8', w: '#ffffff', n: '#b07a3a', N: '#5a3a20', o: '#ff9a3a', v: '#a070e8', V: '#5a3a8a', e: '#b8c0d0', E: '#5a6070', t: '#e8cc90',
  };
  const ELEM = { fogo: '#ff9a3a', agua: '#4a9de8', terra: '#b07a3a', ar: '#d8f0f4', eletrico: '#ffe84a' };
  const ESCUDO = [
    '............',
    '.kkkkkkkkkk.',
    '.keeeeeeeEk.',
    '.keeXXXXeEk.',
    '.keXXXXXXEk.',
    '.keXXXXXXEk.',
    '.keeXXXXeEk.',
    '..keeeeeEk..',
    '..keeeeEEk..',
    '...keeEEk...',
    '....kEEk....',
    '.....kk.....',
  ];
  const MAPAS = {
    cura_cadeia: ['............', '.kkk....kkk.', 'kpprkk..krrk', 'kpprrkkkrrRk', 'krrrrrrrrrRk', 'krrrrrrrrRRk', '.krrrrrrrRk.', '..krrrrrRk..', '...krrrRk...', '....krRk....', '.....kk.....', '............'],
    sorte: ['............', '...kk..kk...', '..kggkkggk..', '..kgGggGgk..', '...kggggk...', '.kkkgGGgkkk.', 'kggggGGggggk', 'kgGggGGggGgk', '.kkgggggggk.', '...kkGGkk...', '.....nk.....', '.....nk.....'],
    ultimate: ['............', '......kkk...', '.....kyyk...', '....kyyk....', '...kyyk.....', '..kyyyyyk...', '..kkkyyyk...', '.....kyyk...', '....kyyk....', '....kyk.....', '...kYk......', '....k.......'],
    troca: ['............', '.......k....', '.kkkkkkbk...', '.kbbbbbbbk..', '.kkkkkkbk...', '.......k....', '....k.......', '...kbkkkkkk.', '..kbbbbbbbk.', '...kbkkkkkk.', '....k.......', '............'],
    abertura: ['..........kk', '.........kwk', '........kwek', '.......kwek.', '......kwek..', '.k...kwek...', '.kk.kwek....', '..kkwek.....', '...kek......', '..knnk......', '.knNk.k.....', 'knk..kk.....'],
    dupla: ['............', '..kkk.......', '.kbbbk.kkk..', 'kbcbbbkkrrk.', 'kbbbbbkkrrrk', 'kbbbbbkrrprk', '.kbbbkkrrrrk', '..kkk.kkrrk.', '......kkkk..', '............', '............', '............'],
    arco: ['............', '............', '...kkkkkk...', '..krrrrrrk..', '.krooooorrk.', 'krooyyyyoork', 'krygggggyork', 'kyggbbbbggyk', 'kggbbvvbbggk', 'kgbbv..vbbgk', 'kkkk....kkkk', '............'],
    reserva: ['............', '..kkkkkk....', '..kvvvvk....', '....kvk.....', '...kvk......', '..kvvvvk....', '..kkkkkk.kk.', '.......kvvvk', '........kvk.', '.......kvvk.', '.......kkkk.', '............'],
    sede: ['............', '.kkkkkkkkkk.', '.kwwwwwwwwk.', '..kttttttk..', '...kttttk...', '....kttk....', '.....kk.....', '....kyyk....', '...kyyyyk...', '..kyyyyyyk..', '.kkkkkkkkkk.', '............'],
    demolidor: ['............', '..kkkkkkk...', '.keeeeeeek..', '.keEEEEEek..', '.keeeeeeek..', '..kkkNkkk...', '.....kNk....', '.....knNk...', '.....knNk...', '.....knNk...', '.....kNNk...', '......kk....'],
    pe: ['............', '.......kk...', '......kwwk..', '.....kwwwwk.', '....kwewewk.', '...kEeEeEek.', '..keEeEeEEek', '.kGggGgggGgk', 'kGgggggGgggk', 'kGGggGgggGGk', '.kkkkkkkkkk.', '............'],
    folego: ['............', '..kkkkkkk...', '.kcccccwck..', '.kkkkkkkkck.', '.........kck', '.kkkkkk..kck', 'kcccwcck.kk.', 'kkkkkkkk....', '..kkkkkkkk..', '.kcccccwck..', '.kkkkkkkk...', '............'],
    ultimo: ['............', '..kkkkkkkk..', '.kwwwwwwwwk.', 'kwwwwwwwwwwk', 'kwwkkwwkkwwk', 'kwkkkwwkkkwk', 'kwwkkwwkkwwk', '.kwwwkkwwwk.', '..kwwwwwwk..', '..kwkwkwkk..', '...kkkkkk...', '............'],
    espinhos: ['.....k......', '.k...k...k..', '..k.kek.k...', '...kkeekk...', '.kkkEeeEkkk.', 'kEeEeeEeeEek', '.kkkEeeEkkk.', '...kkeekk...', '..k.kek.k...', '.k...k...k..', '.....k......', '............'],
    casca: ['............', '...kkkkkk...', '..knnNnnk...', '.knnNnnNnk..', '.knNnnnnNk..', 'knnnnNNnnnk.', 'knNnnnnnNnk.', 'knnnNnnNnnk.', '.knnnnnnnk..', '..kkNNNNkk..', '....kkkk....', '............'],
    corpo: ['............', '.kkkkkkkkkk.', '.kbbbbbbbBk.', '.kbbbbbbwBk.', '.kbbbbbwwBk.', '.kbwbbwwbBk.', '.kbwwwwbbBk.', '..kbwwbbBk..', '..kbbbbBBk..', '...kbbBBk...', '....kBBk....', '.....kk.....'],
    veneno_pot: ['............', '.....kk.....', '....kggk....', '....kgGk....', '...kgGGgk...', '..kggwGGgk..', '..kgwgGGgk..', '..kggGGGgk..', '..kgGGGGGk..', '...kggGGk...', '....kkkk....', '............'],
    sem_lento: ['............', '..kkkk......', '.kNNNNk.....', '.kNnnNk.....', '.kNnnNkkkk..', '.kNnnnnnNnk.', '.kNnnnnnnNk.', '.kNnnnnnnNk.', 'kkNNNNNNNNk.', 'kEEEEEEEEEk.', '.kkkkkkkkkk.', '............'],
  };
  const cache = {};
  function desenhar(mapa, subst) {
    const c = document.createElement('canvas'); c.width = c.height = 12; const x = c.getContext('2d');
    mapa.forEach((lin, j) => { for (let i = 0; i < 12; i++) { const ch = lin[i]; if (ch === '.' || ch === ' ') continue; x.fillStyle = (subst && subst[ch]) || PAL[ch] || '#ff00ff'; x.fillRect(i, j, 1, 1); } });
    return c.toDataURL();
  }
  // id do talento -> imagem (data URL de 12x12, para mostrar ampliada com image-rendering: pixelated)
  function talento(id) {
    if (cache[id]) return cache[id];
    if (id.startsWith('res_')) cache[id] = desenhar(ESCUDO, { X: ELEM[id.slice(4)] || '#ffffff' });
    else if (MAPAS[id]) cache[id] = desenhar(MAPAS[id]);
    else cache[id] = desenhar(ESCUDO, { X: '#ffffff' });
    return cache[id];
  }
  window.PixmonIcones = { talento, MAPAS, ESCUDO };
})();
