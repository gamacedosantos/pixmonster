// Lógica pura da batalha em TEMPO REAL: sem tela, sem aleatoriedade fora do rng recebido (testável e repetível).
// Cada lado tem 4 habilidades (rápido, forte, defesa, ultimate), cada uma com a sua recarga (CD). Atacar exige apertar o botão:
// o ataque tem um tempo de carga (a "preparação", visível para o adversário reagir com a defesa) e só então acerta.
// Cada monstro tem o seu ritmo: rc multiplica as recargas e cg multiplica o tempo de carga.
(function (raiz) {
  // Roda de elementos: cada um vence o seguinte (água > fogo > ar > terra > eletricidade > água).
  const VENCE = { agua: 'fogo', fogo: 'ar', ar: 'terra', terra: 'eletrico', eletrico: 'agua' };
  // Força de cada elemento (de propósito desiguais, para a escolha do time importar): dano e vida em relação ao padrão.
  const EL = { fogo: { dano: 1.12, hp: 0.92 }, agua: { dano: 1.0, hp: 1.05 }, terra: { dano: 0.9, hp: 1.2 }, ar: { dano: 1.0, hp: 0.9 }, eletrico: { dano: 1.1, hp: 0.88 } };
  // Cada cenário favorece um elemento: os monstros desse elemento causam mais dano lá.
  const BIOMA_ELEMENTO = { campo: 'ar', floresta: 'terra', lago: 'agua', montanha: 'eletrico', vila: 'fogo' };
  const BONUS_BIOMA = 1.25;
  const NOCAUTE_MS = 1500;  // tempo entre o nocaute e o próximo monstro entrar
  const TROCA_CD = 6000;    // espera entre duas trocas voluntárias do mesmo lado
  const ENTRA_MS = 600;     // o monstro que entra fica 0,6 s sem agir
  const VANTAGEM = 1.4, DESVANTAGEM = 0.75; // suaves: em tempo real o dano por segundo já separa muito os pares
  const MAX_MS = 240000;   // luta que passa disso decide por vida restante
  const DIVISOR = 4.6;     // escala do dano: IA contra IA dura ~28 s; quem joga à mão aperta menos que a IA, então fica um pouco acima
  const NIVEL = 10;        // todos no mesmo nível: mesma vida e mesmo ataque; o que muda é o elemento, o ritmo (rc, cg) e os nomes
  const RITMO_EXP = 1.5;   // 1 = dano por segundo igual para todos (golpe lento bate proporcionalmente mais forte); ajustado no simulador  // quanto a recarga lenta compensa em dano (golpe lento bate mais forte); ajustado no simulador
  const CRIT_CHANCE = 0.12, CRIT_MULT = 1.8; // crítico: o golpe causa 1,8x
  const ESQUIVA_CHANCE = 0.1;                // esquiva: o alvo desvia e não leva dano
  const SLOTS = ['rapido', 'forte', 'defesa', 'ultimate'];
  const IDX = { rapido: 0, forte: 1, ultimate: 2 }; // 0 investida curta, 1 projétil, 2 investida longa com efeito grande
  // cd = recarga (ms) ; carga = tempo de preparação (ms) ; pow = poder ; dur = quanto a defesa fica de pé (ms)
  const BASE = {
    rapido: { cd: 1000, carga: 220, pow: 7 },
    forte: { cd: 3500, carga: 550, pow: 22 },
    defesa: { cd: 9000, carga: 0, dur: 1800 },
    ultimate: { cd: 15000, carga: 1100, pow: 55 },
  };
  // Status: cada golpe tem chance de aplicar um efeito no alvo (só se o golpe acertar). O ultimate usa a linha do forte com 60%.
  //  veneno: perde vida a cada segundo | lento: recargas 30% mais devagar e cargas 30% mais longas
  //  paralisia: não pode atacar nem defender (a carga em andamento termina) | stun: cancela a carga e trava tudo
  const EFEITO = {
    fogo: { rapido: ['veneno', 0.1], forte: ['veneno', 0.25] }, agua: { rapido: ['lento', 0.2], forte: ['lento', 0.3] },
    terra: { rapido: ['veneno', 0.15], forte: ['stun', 0.25] }, ar: { rapido: ['lento', 0.2], forte: ['stun', 0.25] },
    eletrico: { rapido: ['paralisia', 0.35], forte: ['paralisia', 0.5] },
  };
  const DURACAO = { veneno: 6000, lento: 5000, paralisia: 2200, stun: 1000 };
  const VENENO_PCT = 0.015;        // da vida máxima por segundo
  const IMUNE_MS = 3000;          // depois de paralisia/stun o alvo fica imune a travar de novo por um tempo
  const ULT_STATUS_CHANCE = 0.6;
  // ---------- Talentos (antes da luta): o time gasta ORCAMENTO pontos em talentos do time, e cada monstro leva 1 talento próprio (grátis).
  const ORCAMENTO = 8;
  const NOME_EL = { fogo: 'fogo', agua: 'água', terra: 'terra', ar: 'ar', eletrico: 'eletricidade' };
  const CADEIA_PCT = 0.022, FOLEGO_PCT = 0.03, ULT_TAL_INICIO = 0.25, ABERTURA_MULT = 1.2, ULTIMO_MULT = 1.15, ULTIMO_LIMITE = 0.25, RESIST_MULT = 0.9;
  const DUPLA_MULT = 1.1, ARCO_MULT = 0.94, RESERVA_PCT = 0.008, SEDE_MS = 1000, PE_BONUS = 1.35, ESPINHOS_PCT = 0.05, CORPO_CH = 0.25, VENENO_EXTRA = 2000;
  // B5: talentos novos da árvore (PLANO-balanceamento.md seção 6)
  const COMBO_MULT = 1.25, FOCO_MULT = 1.08, ESCUDO_MULT = 0.85, ESCUDO_MS = 5000, MURALHA_MULT = 0.7, MURALHA_MS = 5000, RECARGA_MULT = 0.85, ULT_PODER_DANO = 1.12, ULT_PODER_CD = 1.15, ULT_DUPLA_PCT = 0.10;
  // T2: traço de cada família (todo membro tem) e sinergias de time. Números iniciais, calibrados no sim.js.
  const TRACO = { fera: 0.05, ave: 0.04, inseto: 1.08, planta: 0.0025, pedra: { dano: 0.94, cd: 1.06 }, dragao: { forte: 0.9, ult: 1.08 }, psiquico: 0.65, aquatico: 1.05 };
  const LACOS_MULT = 1.08, MISTO_MULT = 0.95;
  const PELE_GROSSA = 1.08, CRIT_FINO = 0.05, PESADO_DANO = 1.16, PESADO_CD = 1.10, PARALISIA_EXTRA = 1500;
  const SORTE_OTIMO = 0.3, SORTE_DESFAZ = 0.5, TROCA_AGIL_CD = 3000;
  const TAL_TIME = {
    cura_cadeia: { nome: 'Cura em cadeia', custo: 3, desc: 'a cada 3 ataques rápidos de quem está em campo, o time todo recupera ' + Math.round(CADEIA_PCT * 100) + '% da vida' },
    sorte: { nome: 'Mão de sorte', custo: 3, desc: 'item quebrado: ' + Math.round(SORTE_OTIMO * 100) + '% de chance de buff ótimo (dobrado) e ' + Math.round(SORTE_DESFAZ * 100) + '% de a maldição se desfazer' },
    ultimate: { nome: 'Ultimate adiantado', custo: 2, desc: 'o ultimate de cada monstro começa 75% carregado (em vez de 50%)' },
    troca: { nome: 'Troca ágil', custo: 2, desc: 'a espera de troca cai de 6 s para 3 s e quem entra não fica parado' },
    dupla: { nome: 'Dupla elemental', custo: 2, desc: 'monstros do time que têm um parceiro do mesmo elemento causam +' + Math.round((DUPLA_MULT - 1) * 100) + '% de dano' },
    arco: { nome: 'Arco-íris', custo: 2, desc: 'com 3 elementos diferentes no time, o time recebe ' + Math.round((1 - ARCO_MULT) * 100) + '% menos dano' },
    reserva: { nome: 'Reserva descansada', custo: 2, desc: 'quem está no banco recupera ' + (RESERVA_PCT * 100).toFixed(1).replace('.', ',') + '% da vida por segundo' },
    sede: { nome: 'Sede de ultimate', custo: 2, desc: 'cada golpe crítico adianta o ultimate em ' + (SEDE_MS / 1000) + ' s' },
    demolidor: { nome: 'Demolidor', custo: 1, desc: 'investidas, projéteis e impactos quebram objetos de mais longe (50% a mais)' },
    pe: { nome: 'Pé no chão', custo: 1, desc: 'o bônus do cenário para os monstros do elemento favorecido sobe de +' + Math.round((BONUS_BIOMA - 1) * 100) + '% para +' + Math.round((PE_BONUS - 1) * 100) + '%' },
    combo: { nome: 'Combo', custo: 3, desc: '3 ataques rápidos seguidos do mesmo monstro dão +' + Math.round((COMBO_MULT - 1) * 100) + '% de dano no próximo golpe forte' },
    foco: { nome: 'Foco', custo: 3, desc: '+' + Math.round((FOCO_MULT - 1) * 100) + '% de dano contra um alvo com menos de 50% de vida' },
    escudo_ini: { nome: 'Escudo inicial', custo: 2, desc: 'o time recebe ' + Math.round((1 - ESCUDO_MULT) * 100) + '% menos dano nos primeiros ' + ESCUDO_MS / 1000 + ' s da luta' },
    muralha: { nome: 'Muralha', custo: 3, desc: 'quem entra no lugar de um caído recebe ' + Math.round((1 - MURALHA_MULT) * 100) + '% menos dano por ' + MURALHA_MS / 1000 + ' s' },
    recarga: { nome: 'Recarga rápida', custo: 2, desc: 'a recarga do ultimate cai ' + Math.round((1 - RECARGA_MULT) * 100) + '%' },
    ult_dupla: { nome: 'Ult em dupla', custo: 3, desc: 'cada ultimate que um monstro solta adianta em ' + Math.round(ULT_DUPLA_PCT * 100) + '% o ultimate dos outros do time' },
    ult_poder: { nome: 'Ult poderoso', custo: 3, desc: 'o ultimate causa +' + Math.round((ULT_PODER_DANO - 1) * 100) + '% de dano, mas leva +' + Math.round((ULT_PODER_CD - 1) * 100) + '% de recarga' },
    lacos: { nome: 'Laços de família', custo: 2, desc: 'monstros do time que têm um parceiro da mesma família causam +' + Math.round((LACOS_MULT - 1) * 100) + '% de dano' },
    misto: { nome: 'Time misto', custo: 2, desc: 'com 3 famílias diferentes no time, o time recebe ' + Math.round((1 - MISTO_MULT) * 100) + '% menos dano' },
    abertura: { nome: 'Abertura', custo: 2, desc: 'o primeiro golpe de cada monstro causa +' + Math.round((ABERTURA_MULT - 1) * 100) + '% de dano' },
  };
  const TAL_MON = {
    folego: { nome: 'Fôlego', desc: 'a cada 3 ataques rápidos, recupera ' + Math.round(FOLEGO_PCT * 100) + '% da vida' },
    espinhos: { nome: 'Espinhos', desc: 'devolve ' + Math.round(ESPINHOS_PCT * 100) + '% do dano que recebe a quem atacou' },
    casca: { nome: 'Casca grossa', desc: 'o primeiro stun ou paralisia da luta não pega' },
    corpo: { nome: 'Corpo fechado', desc: Math.round(CORPO_CH * 100) + '% de chance de ignorar um status que ia pegar' },
    pele_grossa: { nome: 'Pele grossa', desc: '+' + Math.round((PELE_GROSSA - 1) * 100) + '% de vida' },
    critico: { nome: 'Crítico fino', desc: '+' + Math.round(CRIT_FINO * 100) + ' pontos de chance de crítico' },
    golpe_pesado: { nome: 'Golpe pesado', desc: 'o golpe forte causa +' + Math.round((PESADO_DANO - 1) * 100) + '% de dano e leva +' + Math.round((PESADO_CD - 1) * 100) + '% de recarga' },
    paralisia_longa: { nome: 'Paralisia longa', desc: 'a paralisia que ele aplica dura ' + PARALISIA_EXTRA / 1000 + ' s a mais' },
    antidoto: { nome: 'Antídoto', desc: 'imune a veneno' },
    veneno_pot: { nome: 'Veneno potente', desc: 'o veneno que ele aplica dura ' + (VENENO_EXTRA / 1000) + ' s a mais' },
    sem_lento: { nome: 'Pés firmes', desc: 'imune a lentidão' },
    ultimo: { nome: 'Último suspiro', desc: 'com menos de ' + Math.round(ULTIMO_LIMITE * 100) + '% de vida, +' + Math.round((ULTIMO_MULT - 1) * 100) + '% de dano' },
  };
  Object.keys(EL).forEach((t) => { TAL_MON['res_' + t] = { nome: 'Pele contra ' + NOME_EL[t], desc: 'recebe ' + Math.round((1 - RESIST_MULT) * 100) + '% menos dano de golpes de ' + NOME_EL[t] }; });
  // B5: a ÁRVORE de talentos (PLANO-balanceamento.md seção 6). Cada nó: arvore ('time' | 'mon'), ramo, degrau (1 a 3), pre (todos exigidos), preAlg (basta um), ou (escolhe um dos dois: não vale ter os dois).
  // Time: o degrau 3 exige um nó do degrau 2 do ramo. Monstro: o degrau libera pelo nível do monstro (NV_DEGRAU). Os talentos continuam em TAL_TIME / TAL_MON; aqui só a estrutura.
  const NV_DEGRAU = [5, 10, 16];
  const ARVORE = {
    abertura: { arvore: 'time', ramo: 'ataque', degrau: 1 }, dupla: { arvore: 'time', ramo: 'ataque', degrau: 2, pre: ['abertura'] }, sede: { arvore: 'time', ramo: 'ataque', degrau: 2, pre: ['abertura'] },
    combo: { arvore: 'time', ramo: 'ataque', degrau: 3, preAlg: ['dupla', 'sede'], ou: 'foco' }, foco: { arvore: 'time', ramo: 'ataque', degrau: 3, preAlg: ['dupla', 'sede'], ou: 'combo' },
    arco: { arvore: 'time', ramo: 'defesa', degrau: 1 }, reserva: { arvore: 'time', ramo: 'defesa', degrau: 2, pre: ['arco'] }, cura_cadeia: { arvore: 'time', ramo: 'defesa', degrau: 2, pre: ['arco'] },
    escudo_ini: { arvore: 'time', ramo: 'defesa', degrau: 3, preAlg: ['reserva', 'cura_cadeia'], ou: 'muralha' }, muralha: { arvore: 'time', ramo: 'defesa', degrau: 3, preAlg: ['reserva', 'cura_cadeia'], ou: 'escudo_ini' },
    ultimate: { arvore: 'time', ramo: 'ultimate', degrau: 1 }, recarga: { arvore: 'time', ramo: 'ultimate', degrau: 2, pre: ['ultimate'] },
    ult_dupla: { arvore: 'time', ramo: 'ultimate', degrau: 3, pre: ['recarga'], ou: 'ult_poder' }, ult_poder: { arvore: 'time', ramo: 'ultimate', degrau: 3, pre: ['recarga'], ou: 'ult_dupla' },
    demolidor: { arvore: 'time', ramo: 'mundo', degrau: 1 }, pe: { arvore: 'time', ramo: 'mundo', degrau: 1 }, sorte: { arvore: 'time', ramo: 'mundo', degrau: 2, preAlg: ['demolidor', 'pe'] }, troca: { arvore: 'time', ramo: 'mundo', degrau: 2, preAlg: ['demolidor', 'pe'] },
    pele_grossa: { arvore: 'mon', ramo: 'corpo', degrau: 1 }, folego: { arvore: 'mon', ramo: 'corpo', degrau: 1 }, casca: { arvore: 'mon', ramo: 'corpo', degrau: 2 }, corpo: { arvore: 'mon', ramo: 'corpo', degrau: 2 },
    critico: { arvore: 'mon', ramo: 'ataque', degrau: 1 }, ultimo: { arvore: 'mon', ramo: 'ataque', degrau: 2 }, espinhos: { arvore: 'mon', ramo: 'ataque', degrau: 2 }, golpe_pesado: { arvore: 'mon', ramo: 'ataque', degrau: 3 },
    veneno_pot: { arvore: 'mon', ramo: 'status', degrau: 1 }, sem_lento: { arvore: 'mon', ramo: 'status', degrau: 1 }, antidoto: { arvore: 'mon', ramo: 'status', degrau: 2 }, paralisia_longa: { arvore: 'mon', ramo: 'status', degrau: 2 },
  };
  // B7: a árvore TÁTICA. Cada talento destrava opções das regras de luta (POLITICA); sem nenhum, o time luta no padrão da tática (TATICA_BASE).
  const TAL_TATICA = {
    t_estilo: { nome: 'Estilo de luta', custo: 1, desc: 'destrava os estilos agressivo e defensivo', libera: { estilo: ['agressivo', 'defensivo'] } },
    t_defesa: { nome: 'Defender na hora certa', custo: 1, desc: 'destrava "defender só do ultimate" e "nunca defender"', libera: { defesa: ['ultimate', 'nunca'] } },
    t_ult: { nome: 'Ultimate esperto', custo: 2, desc: 'destrava soltar o ultimate só com vantagem de elemento ou adversário abaixo de 50%', libera: { ultimate: ['vantagem'] } },
    t_troca: { nome: 'Troca por vantagem', custo: 2, desc: 'destrava trocar de monstro quando o adversário tem vantagem de elemento', libera: { trocaDesv: ['true'] } },
    t_final: { nome: 'Finalizador', custo: 3, desc: 'destrava guardar o ultimate para quando o adversário estiver abaixo de 50%', libera: { ultimate: ['finalizar'] } },
    t_vida: { nome: 'Troca por vida', custo: 3, desc: 'destrava trocar de monstro com a vida baixa (20, 30 ou 40%)', libera: { trocaVida: ['20', '30', '40'] } },
    t_rotacao: { nome: 'Rotação', custo: 2, desc: 'destrava escolher quem entra depois de um nocaute: na ordem ou o com mais vida', libera: { proximo: ['ordem', 'vida'] } },
  };
  const TATICA_BASE = { estilo: 'equilibrado', defesa: 'forte', ultimate: 'pronto', trocaDesv: false, trocaVida: 0, proximo: 'melhor' };
  Object.assign(ARVORE, {
    t_estilo: { arvore: 'tatica', ramo: 'tatica', degrau: 1 }, t_defesa: { arvore: 'tatica', ramo: 'tatica', degrau: 1 },
    t_ult: { arvore: 'tatica', ramo: 'tatica', degrau: 2, preAlg: ['t_estilo', 't_defesa'] }, t_troca: { arvore: 'tatica', ramo: 'tatica', degrau: 2, preAlg: ['t_estilo', 't_defesa'] },
    t_final: { arvore: 'tatica', ramo: 'tatica', degrau: 3, pre: ['t_ult'] }, t_vida: { arvore: 'tatica', ramo: 'tatica', degrau: 3, pre: ['t_troca'] }, t_rotacao: { arvore: 'tatica', ramo: 'tatica', degrau: 3, pre: ['t_troca'] },
  });
  // A regra escolhida só vale se o talento dela foi comprado; senão volta ao padrão da tática. ids = talentos táticos que valem.
  function politicaEfetiva(pol, ids) {
    const out = { ...pol };
    for (const campo of Object.keys(TATICA_BASE)) {
      const v = String(pol[campo]); if (v === String(TATICA_BASE[campo])) continue;
      if (!ids.some((id) => TAL_TATICA[id] && (TAL_TATICA[id].libera[campo] || []).includes(v))) out[campo] = TATICA_BASE[campo];
    }
    return out;
  }
  // Táticos que cabem no orçamento depois dos talentos do time (ordem de compra; o que passa do orçamento fica de fora).
  function taticaNoOrcamento(timeIds, taticaIds, orc) {
    let gasto = custoTalentos(normalizarTalentos({ time: timeIds }, 3, orc).time); const out = [];
    for (const id of taticaIds) { const t = TAL_TATICA[id]; if (t && gasto + t.custo <= orc) { out.push(id); gasto += t.custo; } }
    return out;
  }
  Object.assign(ARVORE, { lacos: { arvore: 'time', ramo: 'ataque', degrau: 2, pre: ['abertura'] }, misto: { arvore: 'time', ramo: 'defesa', degrau: 2, pre: ['arco'] } });
  Object.keys(EL).forEach((t) => { ARVORE['res_' + t] = { arvore: 'mon', ramo: 'corpo', degrau: 2 }; });
  const custoNo = (id) => (TAL_TIME[id] ? TAL_TIME[id].custo : TAL_TATICA[id] ? TAL_TATICA[id].custo : ARVORE[id] ? ARVORE[id].degrau : 0); // time: custo do talento; monstro: custo = degrau
  // Confere uma escolha na árvore. tipo 'time': ids do time; tipo 'mon': ids de UM monstro, com o nível dele. Devolve a lista de problemas (vazia = válida).
  function validarArvore(tipo, ids, nivel = 99) {
    const erros = [], tem = new Set(ids);
    for (const id of ids) {
      const n = ARVORE[id]; if (!n || n.arvore !== tipo) { erros.push(id + ': não existe na árvore ' + tipo); continue; }
      if ((n.pre || []).some((p) => !tem.has(p))) erros.push(id + ': falta ' + n.pre.filter((p) => !tem.has(p)).join(', '));
      if (n.preAlg && !n.preAlg.some((p) => tem.has(p))) erros.push(id + ': falta um de ' + n.preAlg.join(', '));
      if (n.ou && tem.has(n.ou)) erros.push(id + ': escolha só um entre ' + id + ' e ' + n.ou);
      if (tipo === 'mon' && nivel < NV_DEGRAU[n.degrau - 1]) erros.push(id + ': pede nível ' + NV_DEGRAU[n.degrau - 1]);
    }
    if (tipo === 'mon') for (const d of [1, 2, 3]) { const k = ids.filter((id) => ARVORE[id] && ARVORE[id].degrau === d); if (k.length > 1) erros.push('degrau ' + d + ': só um talento (' + k.join(', ') + ')'); }
    return erros;
  }
  // Pontos de talento (decisão do George: crescem com o jogo): 4 no começo, +1 a cada 5 batalhas com treinadores (até +12), +2 por insígnia de líder (até 5).
  const pontosTalento = (lutas = 0, insignias = 0) => 4 + Math.min(12, Math.floor(lutas / 5)) + 2 * Math.min(5, insignias);
  // Migração do save antigo (pixmon-tal: { time: [ids], mon: { idMonstro: 'talento' } }) para o formato da árvore (monstro com lista; tatica vem na B7).
  const migrarTal = (v) => ({ time: Array.isArray(v && v.time) ? v.time.slice() : [], mon: Object.fromEntries(Object.entries((v && v.mon) || {}).map(([k, x]) => [k, Array.isArray(x) ? x.slice() : x ? [x] : []])), tatica: Array.isArray(v && v.tatica) ? v.tatica.slice() : [] });
  const custoTalentos = (ids) => ids.reduce((a, id) => a + (TAL_TIME[id] ? TAL_TIME[id].custo : 0), 0);
  // Limpa uma escolha: só ids válidos, sem repetir, dentro do orçamento (corta do fim); mon sempre com n posições (null = sem talento)
  function normalizarTalentos(t, n = 3, orc = ORCAMENTO) {
    const time = []; for (const id of (t && t.time) || []) if (TAL_TIME[id] && !time.includes(id) && custoTalentos([...time, id]) <= orc) time.push(id);
    const mon = []; for (let k = 0; k < n; k++) { const v = t && t.mon && t.mon[k]; mon.push(Array.isArray(v) ? [...new Set(v.filter((x) => TAL_MON[x]))] : TAL_MON[v] ? v : null); }
    return { time, mon };
  }
  // Escolha aleatória válida (para o adversário e para o simulador): talentos do time até estourar o orçamento e 1 talento por monstro
  function sortearTalentos(rng, n = 3, orc = ORCAMENTO) {
    const ids = Object.keys(TAL_TIME).sort(() => rng() - 0.5), time = [];
    for (const id of ids) if (custoTalentos([...time, id]) <= orc && rng() < 0.8) time.push(id);
    const mons = Object.keys(TAL_MON);
    return { time, mon: Array.from({ length: n }, () => mons[Math.floor(rng() * mons.length)]) };
  }
  const ULT_INICIO = 0.5; // o ultimate começa com metade da recarga já corrida

  // Habilidades de cada monstro: cada uma com nome próprio. rapido/forte/defesa são do elemento do monstro;
  // o ultimate é um golpe de outro elemento (cobre a fraqueza: vence quem vence o monstro).
  const h = (rapido, forte, defesa, ultimate, tUlt) => ({
    rapido: { nome: rapido[0], tipo: rapido[1] }, forte: { nome: forte[0], tipo: forte[1] },
    defesa: { nome: defesa, tipo: rapido[1] }, ultimate: { nome: ultimate, tipo: tUlt },
  });
  const MONSTROS = [
    { id: 'fagulhao', nome: 'Fagulhão', tipo: 'fogo', nivel: NIVEL, hp: 60, atk: 10, rc: 0.95, cg: 0.9, golpes: h(['Faísca', 'fogo'], ['Labareda', 'fogo'], 'Manto de Brasas', 'Tempestade de Brasas', 'eletrico') },
    { id: 'chamuscao', nome: 'Chamuscão', tipo: 'fogo', nivel: NIVEL, hp: 60, atk: 10, rc: 1.05, cg: 1.15, golpes: h(['Brasa Curta', 'fogo'], ['Cinza Quente', 'fogo'], 'Muralha de Cinzas', 'Tormenta Roxa', 'eletrico') },
    { id: 'mareal', nome: 'Mareal', tipo: 'agua', nivel: NIVEL, hp: 60, atk: 10, rc: 1.0, cg: 1.0, golpes: h(['Jato', 'agua'], ['Onda Funda', 'agua'], 'Bolha Protetora', 'Esfera da Maré', 'terra') },
    { id: 'pingolino', nome: 'Pingolino', tipo: 'agua', nivel: NIVEL, hp: 60, atk: 10, rc: 0.89, cg: 0.84, golpes: h(['Borrifo', 'agua'], ['Redemoinho', 'agua'], 'Escudo de Névoa', 'Maré de Lama', 'terra') },
    { id: 'brotinho', nome: 'Brotinho', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.05, cg: 1.1, golpes: h(['Espinho', 'terra'], ['Pedregulho', 'terra'], 'Casca Dura', 'Chuva de Fagulhas', 'fogo') },
    { id: 'musgarra', nome: 'Musgarra', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.15, cg: 1.25, golpes: h(['Rocha Baixa', 'terra'], ['Deslizamento', 'terra'], 'Muralha de Musgo', 'Erupção Surda', 'fogo') },
    { id: 'ventinho', nome: 'Ventinho', tipo: 'ar', nivel: NIVEL, hp: 60, atk: 10, rc: 0.8, cg: 0.75, golpes: h(['Sopro', 'ar'], ['Rajada', 'ar'], 'Bolha de Vento', 'Aguaceiro Furioso', 'agua') },
    { id: 'nuvelino', nome: 'Nuvelino', tipo: 'ar', nivel: NIVEL, hp: 60, atk: 10, rc: 1.1, cg: 1.15, golpes: h(['Brisa', 'ar'], ['Ciclone', 'ar'], 'Nevoeiro', 'Esfera da Tormenta', 'agua') },
    { id: 'faiscao', nome: 'Faiscão', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 0.85, cg: 0.7, golpes: h(['Choquinho', 'eletrico'], ['Relâmpago', 'eletrico'], 'Gaiola Elétrica', 'Furacão de Raios', 'ar') },
    { id: 'trovinho', nome: 'Trovinho', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 1.15, cg: 1.3, golpes: h(['Faísca Azul', 'eletrico'], ['Trovão', 'eletrico'], 'Campo de Estática', 'Esfera Trovejante', 'ar') },
    { id: 'brasinha', nome: 'Brasinha', tipo: 'fogo', nivel: NIVEL, hp: 60, atk: 10, rc: 0.9, cg: 0.85, raridade: 'rara', golpes: h(['Cuspe de Brasa', 'fogo'], ['Rabada Ardente', 'fogo'], 'Escama Quente', 'Trovão de Cinzas', 'eletrico') },
    { id: 'vulcanejo', nome: 'Vulcanejo', tipo: 'fogo', nivel: NIVEL, hp: 60, atk: 10, rc: 1.1, cg: 1.2, raridade: 'rara', golpes: h(['Pedra Quente', 'fogo'], ['Rolada de Lava', 'fogo'], 'Casco Vulcânico', 'Descarga de Magma', 'eletrico') },
    { id: 'algazinho', nome: 'Algazinho', tipo: 'agua', nivel: NIVEL, hp: 60, atk: 10, rc: 0.92, cg: 0.95, raridade: 'comum', golpes: h(['Gosma', 'agua'], ['Chicote de Alga', 'agua'], 'Véu de Limo', 'Pedras do Fundo', 'terra') },
    { id: 'coraline', nome: 'Coraline', tipo: 'agua', nivel: NIVEL, hp: 60, atk: 10, rc: 1.08, cg: 1.12, raridade: 'rara', golpes: h(['Bolha Rosa', 'agua'], ['Galhada de Coral', 'agua'], 'Recife Vivo', 'Esfera do Recife', 'terra') },
    { id: 'pedrinho', nome: 'Pedrinho', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.12, cg: 1.18, raridade: 'comum', golpes: h(['Cascalho', 'terra'], ['Rolamento', 'terra'], 'Pele de Pedra', 'Brasa de Rocha', 'fogo') },
    { id: 'tatufungo', nome: 'Tatufungo', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1, cg: 1.05, raridade: 'rara', golpes: h(['Esporo', 'terra'], ['Cabeçada do Chapéu', 'terra'], 'Escudo de Cogumelo', 'Nuvem Ardente de Esporos', 'fogo') },
    { id: 'plumelho', nome: 'Plumelho', tipo: 'ar', nivel: NIVEL, hp: 60, atk: 10, rc: 0.82, cg: 0.78, raridade: 'comum', golpes: h(['Bicada', 'ar'], ['Mergulho Veloz', 'ar'], 'Penas Fofas', 'Chuva de Orvalho', 'agua') },
    { id: 'redemoinha', nome: 'Redemoinha', tipo: 'ar', nivel: NIVEL, hp: 60, atk: 10, rc: 1.02, cg: 1.08, raridade: 'rara', golpes: h(['Sopro Giratório', 'ar'], ['Tornado Miúdo', 'ar'], 'Giro Protetor', 'Tempestade de Água', 'agua') },
    { id: 'zapinho', nome: 'Zapinho', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 0.8, cg: 0.7, raridade: 'comum', golpes: h(['Faísca Miúda', 'eletrico'], ['Descarga', 'eletrico'], 'Pelo Eriçado', 'Ventania Elétrica', 'ar') },
    { id: 'raiomante', nome: 'Raiomante', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 1.1, cg: 1.25, raridade: 'lendaria', golpes: h(['Raio Curto', 'eletrico'], ['Tempestade Alada', 'eletrico'], 'Asas de Estática', 'Rajada da Noite', 'ar') },
    { id: 'pavio', nome: 'Pavio', tipo: 'fogo', nivel: NIVEL, hp: 60, atk: 10, rc: 0.93, cg: 0.88, raridade: 'comum', golpes: h(['Pavio Aceso', 'fogo'], ['Estouro de Faísca', 'fogo'], 'Cera Derretida', 'Raio do Rastilho', 'eletrico') },
    { id: 'bolhudo', nome: 'Bolhudo', tipo: 'agua', nivel: NIVEL, hp: 60, atk: 10, rc: 1.05, cg: 1.0, raridade: 'comum', golpes: h(['Bolhinha', 'agua'], ['Inchaço Líquido', 'agua'], 'Barriga de Bolhas', 'Mergulho de Pedra', 'terra') },
    { id: 'taupino', nome: 'Taupino', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.1, cg: 1.12, raridade: 'comum', golpes: h(['Cavada', 'terra'], ['Garra Barrenta', 'terra'], 'Toca Funda', 'Lava da Toca', 'fogo') },
    { id: 'pipinha', nome: 'Pipinha', tipo: 'ar', nivel: NIVEL, hp: 60, atk: 10, rc: 0.88, cg: 0.85, raridade: 'rara', golpes: h(['Rabiola', 'ar'], ['Puxão de Vento', 'ar'], 'Fita Balançante', 'Garoa Súbita', 'agua') },
    { id: 'lampiro', nome: 'Lampiro', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 0.83, cg: 0.75, raridade: 'rara', golpes: h(['Pisca-Pisca', 'eletrico'], ['Luz Cegante', 'eletrico'], 'Brilho de Escudo', 'Ventania de Asas', 'ar') },
    { id: 'brasoleta', nome: 'Brasoleta', tipo: 'fogo', nivel: NIVEL, hp: 60, atk: 10, rc: 0.87, cg: 0.82, raridade: 'comum', golpes: h(['Faísca Alada', 'fogo'], ['Rasante Ardente', 'fogo'], 'Asas de Brasa', 'Enxame de Centelhas', 'eletrico') },
    { id: 'besourao', nome: 'Besourão', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.13, cg: 1.22, raridade: 'comum', golpes: h(['Chifrada Curta', 'terra'], ['Investida de Chifre', 'terra'], 'Carapaça Dura', 'Chifre Incandescente', 'fogo') },
    { id: 'casulucia', nome: 'Casulúcia', tipo: 'ar', nivel: NIVEL, hp: 60, atk: 10, rc: 0.91, cg: 0.9, raridade: 'incomum', golpes: h(['Pó de Asa', 'ar'], ['Vendaval de Asas', 'ar'], 'Casulo de Seda', 'Chuva de Pólen', 'agua') },
    { id: 'tesloura', nome: 'Tesloura', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 0.84, cg: 0.78, raridade: 'incomum', golpes: h(['Pinça Elétrica', 'eletrico'], ['Tesoura Relâmpago', 'eletrico'], 'Casco Condutor', 'Ciclone das Pinças', 'ar') },
    { id: 'rochilo', nome: 'Rochilo', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.06, cg: 1.14, raridade: 'comum', golpes: h(['Arranhão de Pedra', 'terra'], ['Queda de Gárgula', 'terra'], 'Pele de Granito', 'Cinzas de Rocha', 'fogo') },
    { id: 'cristalino', nome: 'Cristalino', tipo: 'eletrico', nivel: NIVEL, hp: 60, atk: 10, rc: 0.96, cg: 0.92, raridade: 'incomum', golpes: h(['Estilhaço', 'eletrico'], ['Prisma Trovejante', 'eletrico'], 'Cristal Refletor', 'Tempestade de Cristais', 'ar') },
    { id: 'texugao', nome: 'Texugão', tipo: 'terra', nivel: NIVEL, hp: 60, atk: 10, rc: 1.09, cg: 1.1, raridade: 'comum', golpes: h(['Unhada', 'terra'], ['Escavada Furiosa', 'terra'], 'Toca Rápida', 'Fogueira do Texugo', 'fogo') },
    { id: 'lontrinha', nome: 'Lontrinha', tipo: 'agua', nivel: NIVEL, hp: 60, atk: 10, rc: 0.89, cg: 0.87, raridade: 'comum', golpes: h(['Respingo', 'agua'], ['Mergulho da Lontra', 'agua'], 'Concha Protetora', 'Pedra do Rio', 'terra') },
  ];

  // Poder do ultimate (PLANO-poderes.md): regra própria na luta, mais um visual próprio na arena. Sem poder = o ultimate padrão (golpe grande).
  //   feixe = Lightbeam, raio contínuo (só visual) | frenesi = não causa dano: buff de dano e ritmo por um tempo, que custa vida
  // Evoluções herdam pelo spread de `golpes`.
  const PODER_DE = {
    feixe: ['raiomante', 'pavio', 'chamuscao', 'faiscao'],
    frenesi: ['fagulhao', 'brasinha', 'zapinho', 'plumelho', 'pipinha', 'tesloura'],
    pulo: ['taupino', 'pedrinho', 'musgarra', 'bolhudo', 'besourao', 'texugao', 'pingolino'],
    nova: ['lampiro', 'tatufungo', 'brotinho', 'vulcanejo', 'rochilo', 'brasoleta', 'lontrinha'],
    esfera: ['mareal', 'nuvelino', 'coraline', 'trovinho', 'cristalino'],
    disco: ['ventinho', 'redemoinha', 'algazinho', 'casulucia'],
  };
  Object.keys(PODER_DE).forEach((p) => PODER_DE[p].forEach((id) => { const m = MONSTROS.find((x) => x.id === id); m.golpes.ultimate.poder = p; if (p === 'esfera') m.golpes.ultimate.tipo = m.tipo; })); // a esfera gigante é do elemento do próprio monstro (sem cobrir a fraqueza como o ultimate comum), senão o golpe enorme vira o jogo contra quem tem vantagem
  // frenesi: dur = ms de efeito; dano e ritmo = multiplicadores (ritmo acelera recarga e carga); custo = fração da vida máxima perdida por segundo (nunca mata)
  // pulo (super pulo): a carga é o salto; depois de `subida` (fração da carga) o monstro fica no ar e intocável (ataques que o alcançam erram), e cai em área:
  // não pode ser esquivado e deixa o alvo atordoado por `stun` ms (se não for bloqueado). dano = multiplicador sobre o ultimate padrão.
  const PODERES = { frenesi: { dur: 10000, dano: 1.35, ritmo: 1.5, custo: 0.01 }, pulo: { subida: 0.4, dano: 0.7, stun: 500 }, nova: { dano: 0.9, atravessa: 0.5 }, esfera: { carga: 2.4, cd: 1.5, dano: 2, atravessa: 0.5 }, disco: { dano: 0.56, volta: 700 } };
  // disco (Kienzan): o disco acerta duas vezes, na ida e na volta (`volta` ms depois); cada acerto sorteia crítico e esquiva e tem `dano` do ultimate; o status só entra no segundo.
  // esfera (esfera gigante): carga bem longa (o monstro fica parado e é vulnerável: stun e paralisia cancelam) e recarga maior; em troca, dano muito maior. A defesa ainda bloqueia.
  // nova (supernova): explosão em volta do atacante: não pode ser esquivada, atravessa a defesa do alvo (que se parte e deixa passar `atravessa` do dano) e derruba os buffs do alvo (força e frenesi).
  // Forma visual do golpe forte (só arena.js lê): 'proj' (projétil, padrão), 'onda' (arco de energia que varre até o alvo) ou 'area' (marca no chão do alvo e explosão). Evoluções herdam pelo spread de `golpes`.
  const FX_FORTE = {
    onda: ['brasinha', 'mareal', 'algazinho', 'musgarra', 'pedrinho', 'ventinho', 'pipinha', 'raiomante', 'lontrinha', 'casulucia'],
    area: ['chamuscao', 'vulcanejo', 'pavio', 'pingolino', 'coraline', 'tatufungo', 'taupino', 'nuvelino', 'redemoinha', 'trovinho', 'lampiro', 'cristalino', 'rochilo', 'tesloura', 'brasoleta', 'texugao'],
  };
  // Forma do golpe rápido: investida (padrão), 'garra' (investida e arranhões no alvo) ou 'rajada' (fica parado e dispara 3 tiros miúdos)
  const FX_RAPIDO = {
    garra: ['musgarra', 'taupino', 'brasinha', 'vulcanejo', 'pedrinho', 'tatufungo', 'besourao', 'texugao', 'rochilo', 'lontrinha'],
    rajada: ['faiscao', 'zapinho', 'lampiro', 'ventinho', 'pipinha', 'mareal', 'pingolino', 'bolhudo', 'algazinho', 'brasoleta', 'tesloura', 'casulucia'],
  };
  Object.keys(FX_RAPIDO).forEach((fx) => FX_RAPIDO[fx].forEach((id) => { MONSTROS.find((m) => m.id === id).golpes.rapido.fx = fx; }));
  Object.keys(FX_FORTE).forEach((fx) => FX_FORTE[fx].forEach((id) => { MONSTROS.find((m) => m.id === id).golpes.forte.fx = fx; }));
  MONSTROS.forEach((m) => { m.hp =Math.round(60 * EL[m.tipo].hp); m.dano = EL[m.tipo].dano; m.raridade = m.raridade || 'comum'; });
  ['chamuscao', 'pingolino', 'musgarra', 'nuvelino', 'trovinho'].forEach((id) => { MONSTROS.find((m) => m.id === id).raridade = 'incomum'; }); // (as espécies novas já trazem a raridade nos dados) // B1: o segundo de cada elemento é incomum
  // T1 (PLANO-tipos-e-novos-pixmon.md): FAMÍLIA = o que o pixmon é (o elemento diz como ele luta). Não muda o dano; os traços e sinergias vêm na T2.
  const FAMILIAS = {
    fera: { nome: 'Fera', cor: '#e0a060' }, ave: { nome: 'Ave', cor: '#9fd0f0' }, inseto: { nome: 'Inseto', cor: '#b8d848' }, planta: { nome: 'Planta', cor: '#6fd66f' },
    pedra: { nome: 'Pedra', cor: '#a8a8b0' }, dragao: { nome: 'Dragão', cor: '#c860d8' }, psiquico: { nome: 'Psíquico', cor: '#e890c8' }, aquatico: { nome: 'Aquático', cor: '#60b8e8' },
  };
  Object.assign(FAMILIAS.fera, { traco: 'Garras: +' + Math.round(TRACO.fera * 100) + ' pontos de chance de crítico' }); Object.assign(FAMILIAS.ave, { traco: 'Voo: +' + Math.round(TRACO.ave * 100) + ' pontos de chance de esquiva' });
  Object.assign(FAMILIAS.inseto, { traco: 'Enxame: o ataque rápido causa +' + Math.round((TRACO.inseto - 1) * 100) + '% de dano' }); Object.assign(FAMILIAS.planta, { traco: 'Raízes: recupera ' + String(+(TRACO.planta * 100).toFixed(2)).replace('.', ',') + '% da vida por segundo' });
  Object.assign(FAMILIAS.pedra, { traco: 'Casca: ' + Math.round((1 - TRACO.pedra.dano) * 100) + '% menos dano recebido e ' + Math.round((TRACO.pedra.cd - 1) * 100) + '% mais recarga' }); Object.assign(FAMILIAS.dragao, { traco: 'Escamas: ' + Math.round((1 - TRACO.dragao.forte) * 100) + '% menos dano de golpes fortes e +' + Math.round((TRACO.dragao.ult - 1) * 100) + '% no ultimate' });
  Object.assign(FAMILIAS.psiquico, { traco: 'Mente: os status duram ' + Math.round((1 - TRACO.psiquico) * 100) + '% menos nele' }); Object.assign(FAMILIAS.aquatico, { traco: 'Fluido: +' + Math.round((TRACO.aquatico - 1) * 100) + '% de vida' });
  const FAMILIA_DE = {
    fera: ['fagulhao', 'chamuscao', 'faiscao', 'trovinho', 'zapinho', 'pavio', 'taupino', 'texugao', 'lontrinha'], ave: ['ventinho', 'plumelho', 'raiomante'], inseto: ['lampiro', 'brasoleta', 'besourao', 'casulucia', 'tesloura'], planta: ['brotinho', 'musgarra', 'algazinho', 'tatufungo'],
    pedra: ['vulcanejo', 'pedrinho', 'rochilo', 'cristalino'], dragao: ['brasinha'], psiquico: ['nuvelino', 'redemoinha', 'pipinha'], aquatico: ['mareal', 'pingolino', 'coraline', 'bolhudo'],
  };
  Object.entries(FAMILIA_DE).forEach(([f, ids]) => ids.forEach((id) => { MONSTROS.find((m) => m.id === id).familia = f; })); // as formas evoluídas herdam (evoluida copia o monstro)
  const PESO_RARIDADE = { comum: 1, incomum: 0.6, rara: 0.3, lendaria: 0.05 }; // chance relativa de aparecer como selvagem no mundo
  const CAPTURA_RARIDADE = { comum: 1, incomum: 0.9, rara: 0.75, lendaria: 0.5 }; // multiplica a chance da esfera
  // B1 (PLANO-balanceamento.md): cada área pertence a uma região; o selvagem sai de um pool por região, não de "tudo, com o elemento 3x".
  // Pool: 72% do elemento da região (comuns e incomuns), 22% de um elemento vizinho, 3% de raros da região e 3% dos outros elementos. 'inicio' = só comuns e incomuns, todos os elementos; 'andarilhos' = tudo, só aqui sai o lendário.
  const REGIOES = {
    inicio: { nome: 'Sem clã' }, andarilhos: { nome: 'Andarilhos', todos: true, fam: ['dragao', 'psiquico'], camisas: ['#6a6a78', '#7a4ab8'] },
    brasa: { nome: 'Brasa', el: 'fogo', viz: 'terra', fam: ['fera', 'dragao'], raros: ['vulcanejo', 'brasinha'], camisas: ['#c0392b', '#e0503a'] }, mare: { nome: 'Maré', el: 'agua', viz: 'ar', fam: ['aquatico', 'planta'], raros: ['coraline'], camisas: ['#2f78a8', '#4aa3d8'] },
    brisa: { nome: 'Brisa', el: 'ar', viz: 'agua', fam: ['ave', 'inseto'], raros: ['redemoinha', 'pipinha'], camisas: ['#d8ecf6', '#6fd6ff'] },
    rocha: { nome: 'Rocha', el: 'terra', viz: 'fogo', fam: ['planta', 'pedra', 'inseto'], raros: ['tatufungo'], camisas: ['#8a5a2b', '#6a4a2a'] }, faisca: { nome: 'Faísca', el: 'eletrico', viz: 'ar', fam: ['pedra', 'inseto'], raros: ['lampiro'], camisas: ['#f0d048', '#e8b830'] }, // B3: cada região é um clã; o uniforme é a cor da camisa (2 tons)
  };
  // B4: nível FIXO do treinador por área (não depende mais do nível do jogador): base da área + ajuste do posto; líderes têm nível próprio.
  // O posto vem do `nivel` do treinador (1 aprendiz, 2 membro, 3 veterano, 4 e 5 elite); os cinco líderes são sempre 'lider'.
  const NIVEL_AREA = { vila: 5, rota1: 5, fazenda: 6, lago: 7, bosque: 7, lago2: 9, vilaagua: 10, escondida: 10, praia: 11, bosquel: 11, vilavento: 13, farol: 13, montanha: 14, vilaraio: 15, montanha2: 16, bosquen: 16, pedra: 18, castelo: 20, oculta: 22 };
  const OFFSET_POSTO = { aprendiz: -1, membro: 0, veterano: 1, elite: 2, lider: 3 };
  const NIVEL_LIDER = { tati: 13, laura: 16, du: 16, guto: 22, dan: 25 };
  const POSTOS = ['aprendiz', 'membro', 'veterano', 'elite', 'elite'];
  const postoDe = (t) => (NIVEL_LIDER[t.id] ? 'lider' : POSTOS[t.nivel - 1] || 'membro');
  const nivelNoMundo = (t, area) => NIVEL_LIDER[t.id] || Math.max(2, Math.min(30, (NIVEL_AREA[area] || 5) + OFFSET_POSTO[postoDe(t)]));
  const REGIAO_DA_AREA = { vila: 'inicio', rota1: 'inicio', fazenda: 'brasa', lago: 'mare', lago2: 'mare', vilaagua: 'mare', praia: 'mare', bosque: 'brisa', bosquel: 'brisa', vilavento: 'brisa', farol: 'brisa', montanha2: 'brisa', escondida: 'rocha', bosquen: 'rocha', pedra: 'rocha', vilaraio: 'faisca', montanha: 'faisca', oculta: 'andarilhos', castelo: 'andarilhos' };
  function pesosSelvagem(area, soEvo) { // pesos (somam 1) na ordem de MONSTROS; soEvo: só espécies que têm evolução
    const g = REGIOES[REGIAO_DA_AREA[area]] || REGIOES.inicio, cm = (m) => m.raridade === 'comum' || m.raridade === 'incomum';
    const sel = (f) => MONSTROS.map((m) => (soEvo && !EVOLUI(m.id) ? 0 : f(m) ? PESO_RARIDADE[m.raridade] * (g.fam && g.fam.includes(m.familia) ? 2 : 1) : 0)); // T3: a região favorece (2x) as famílias dela
    const norm = (v, alvo) => { const s = v.reduce((a, b) => a + b, 0); return v.map((x) => (s ? (x / s) * alvo : 0)); };
    const partes = g.todos ? [norm(sel(() => true), 1)] : !g.el ? [norm(sel(cm), 1)] : [norm(sel((m) => cm(m) && m.tipo === g.el), 0.72), norm(sel((m) => g.raros.includes(m.id)), 0.03), norm(sel((m) => cm(m) && m.tipo === g.viz), 0.22), norm(sel((m) => cm(m) && m.tipo !== g.el && m.tipo !== g.viz), 0.03)];
    const w = MONSTROS.map((_, i) => partes.reduce((a, p) => a + p[i], 0)), s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / s); // grupo vazio (soEvo) devolve a sua parte aos outros
  }

  const cdDe = (m, slot) => BASE[slot].cd * m.rc * (slot === 'ultimate' && m.golpes.ultimate.poder === 'esfera' ? PODERES.esfera.cd : 1);          // recarga efetiva (ms)
  const cargaDe = (m, slot) => BASE[slot].carga * m.cg * (slot === 'ultimate' && m.golpes.ultimate.poder === 'esfera' ? PODERES.esfera.carga : 1);    // tempo de carga efetivo (ms)
  const danoBase = (m, slot) => BASE[slot].pow * (m.atk / 10) * (m.dano || 1) * Math.pow(m.rc, RITMO_EXP) / DIVISOR; // dano médio sem elemento, sorte ou crítico

  function criarRng(seed) { // mulberry32: mesma semente, mesma luta
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function multiplicador(tipoGolpe, tipoAlvo) {
    if (VENCE[tipoGolpe] === tipoAlvo) return VANTAGEM;
    if (VENCE[tipoAlvo] === tipoGolpe) return DESVANTAGEM;
    return 1;
  }

  function novoLado(m, tal = null, tt = new Set(), hpFrac = 1) {
    const tals = new Set([].concat(tal || [])), cdTotal = {}, cd = {};
    if (tals.has('pele_grossa') || m.familia === 'aquatico') m = { ...m, hp: Math.round(m.hp * (tals.has('pele_grossa') ? PELE_GROSSA : 1) * (m.familia === 'aquatico' ? TRACO.aquatico : 1)) };
    for (const s of SLOTS) { cdTotal[s] = cdDe(m, s) * (m.familia === 'pedra' ? TRACO.pedra.cd : 1) * (s === 'ultimate' ? (tt.has('recarga') ? RECARGA_MULT : 1) * (tt.has('ult_poder') ? ULT_PODER_CD : 1) : s === 'forte' && tals.has('golpe_pesado') ? PESADO_CD : 1); cd[s] = s === 'ultimate' ? cdTotal[s] * (tt.has('ultimate') ? ULT_TAL_INICIO : ULT_INICIO) : 0; }
    return { m, tals, combo: 0, protAte: 0, rapidos: 0, abriu: false, hp: Math.max(0, m.hp * hpFrac), cd, cdTotal, acao: null, defesaAte: 0, st: {}, imuneAte: 0, entraAte: 0 }; // cd = ms que faltam; acao = ataque em carga; defesaAte = ms (relógio da luta)
  }
  // a e b: um monstro ou um time (lista de 1 a 3). bt.lados[i] é sempre o monstro em campo do lado i (aponta para bt.times[i][ativo[i]]).
  // tal: [talentos do lado 0, do lado 1], cada um { time: [ids], mon: [id por monstro do time] } (opcional)
  // hp0: [fracs da vida do time A, fracs do time B] (opcional, 0 a 1 por monstro; o torneio leva a vida de uma luta para a outra)
  function novaBatalha(a, b, bioma = null, tal = null, hp0 = null) {
    const lista = [a, b].map((t) => (Array.isArray(t) ? t : [t]));
    const talentos = lista.map((t, i) => normalizarTalentos(tal && tal[i], t.length)), tt = talentos.map((x) => new Set(x.time));
    const times = lista.map((t, i) => t.map((m, k) => novoLado(m, talentos[i].mon[k], tt[i], hp0 && hp0[i] && hp0[i][k] != null ? hp0[i][k] : 1)));
    const sin = lista.map((t) => { const n = {}, f = {}; t.forEach((m) => { n[m.tipo] = (n[m.tipo] || 0) + 1; f[m.familia] = (f[m.familia] || 0) + 1; }); return { dupla: new Set(Object.keys(n).filter((e) => n[e] >= 2)), arco: Object.keys(n).length === 3, fam: new Set(Object.keys(f).filter((e) => f[e] >= 2)), misto: Object.keys(f).length === 3 }; });
    return {
      t: 0, // relógio da luta, em ms
      bioma, times, talentos, tt, sin, agenda: [], ativo: times.map((t) => Math.max(0, t.findIndex((l) => l.hp > 0))), lados: times.map((t) => t[Math.max(0, t.findIndex((l) => l.hp > 0))]), trocaCd: [0, 0], pendente: [null, null], regra: [null, null], // regra: texto da regra do modo automático que causou a próxima ação (para a tela)
      pre: [], // pre: eventos de trocas feitas entre dois passos
     
      fim: null, // { vencedor: 0|1|null, motivo }
      log: [],
      eventos: [],
    };
  }

  // Dá para usar a habilidade agora? A defesa vale a qualquer hora; os ataques esperam a carga do ataque atual acabar.
  const ativo = (bt, l, n) => !!(l.st[n] && l.st[n].ate > bt.t);
  const travado = (bt, l) => ativo(bt, l, 'stun') || ativo(bt, l, 'paralisia');
  function podeUsar(bt, i, slot) {
    const l = bt.lados[i];
    if (bt.fim || l.hp <= 0 || bt.t < l.entraAte || l.cd[slot] > 0 || travado(bt, l)) return false;
    if (slot === 'defesa') return l.defesaAte <= bt.t;
    return !l.acao;
  }

  function usar(bt, i, slot) {
    if (!podeUsar(bt, i, slot)) return;
    const l = bt.lados[i], g = l.m.golpes[slot];
    l.cd[slot] = l.cdTotal[slot];
    if (slot === 'defesa') {
      l.defesaAte = bt.t + BASE.defesa.dur;
      bt.log.push(`${l.m.nome} usa ${g.nome}`);
      bt.eventos.push({ ev: 'defesa', i, slot, golpe: g.nome, tipo: g.tipo, dur: BASE.defesa.dur, regra: bt.regra[i] }); bt.regra[i] = null;
      return;
    }
    const carga = cargaDe(l.m, slot) * (ativo(bt, l, 'lento') ? 1.3 : 1) / (ativo(bt, l, 'frenesi') ? PODERES.frenesi.ritmo : 1);
    l.acao = { slot, inicio: bt.t, fim: bt.t + carga, dur: carga };
    bt.eventos.push({ ev: 'carga', atq: i, def: 1 - i, slot, idx: IDX[slot], golpe: g.nome, tipo: g.tipo, poder: g.poder || null, dur: carga, regra: bt.regra[i] }); bt.regra[i] = null;
  }

  // Aplica um status em um lado (refresca se já tem). Paralisia e stun respeitam a imunidade; stun cancela a carga em andamento.
  function aplicar(bt, i, nome, tipo, durFixa) {
    const l = bt.lados[i];
    if ((nome === 'paralisia' || nome === 'stun') && (travado(bt, l) || bt.t < l.imuneAte)) return null;
    if (nome === 'lento' && l.tals.has('sem_lento')) return null;
    if (nome === 'veneno' && l.tals.has('antidoto')) return null;
    if ((nome === 'paralisia' || nome === 'stun') && l.tals.has('casca') && !l.cascaUsada) { l.cascaUsada = true; aviso(bt, i, 'Casca grossa'); return null; }
    const dur = (durFixa || DURACAO[nome]) * (l.m.familia === 'psiquico' ? TRACO.psiquico : 1);
    l.st[nome] = { ate: bt.t + dur, dur, prox: bt.t + 1000 };
    if (nome === 'paralisia' || nome === 'stun') l.imuneAte = bt.t + dur + IMUNE_MS;
    let cancelou = false;
    if (nome === 'stun' && l.acao) { l.acao = null; cancelou = true; }
    bt.log.push(`${l.m.nome} fica ${nome}`);
    bt.eventos.push({ ev: 'status', i, st: nome, dur, tipo, cancelou });
    return { st: nome, dur };
  }

  const aviso = (bt, i, nome) => bt.eventos.push({ ev: 'talento', i, nome });
  // cura os monstros alvos (índices do time do lado i) em pct da vida máxima de cada um
  function curar(bt, i, alvos, pct, fonte) {
    for (const k of alvos) { const l = bt.times[i][k]; if (l.hp > 0) l.hp = Math.min(l.m.hp, l.hp + l.m.hp * pct); }
    bt.eventos.push({ ev: 'cura', i, fonte, todos: alvos.length > 1, hpApos: bt.lados[i].hp });
  }

  function resolver(bt, rng, i, a) {
    const at = bt.lados[i], df = bt.lados[1 - i], g = at.m.golpes[a.slot];
    if (g.poder === 'frenesi') { // buff: sem alvo, sem dano
      const P = PODERES.frenesi; at.st.frenesi = { ate: bt.t + P.dur, dur: P.dur, prox: bt.t + 1000 };
      bt.log.push(`${at.m.nome} usa ${g.nome}`); bt.eventos.push({ ev: 'buff', i, poder: 'frenesi', golpe: g.nome, tipo: g.tipo, dur: P.dur });
      return;
    }
    if (df.hp <= 0) return; // o alvo já caiu: o golpe se perde
    const mult = multiplicador(g.tipo, df.m.tipo);
    // sempre 3 sorteios por golpe: a mesma semente repete a luta
    const aereo = !!(df.acao && df.acao.slot === 'ultimate' && df.m.golpes.ultimate.poder === 'pulo' && bt.t - df.acao.inicio >= df.acao.dur * PODERES.pulo.subida); // o alvo está no ar (super pulo): o golpe erra
    const variacao = 0.85 + 0.3 * rng(), critico = rng() < CRIT_CHANCE + (at.tals.has('critico') ? CRIT_FINO : 0) + (at.m.familia === 'fera' ? TRACO.fera : 0), esquiva = (rng() < ESQUIVA_CHANCE + (df.m.familia === 'ave' ? TRACO.ave : 0) && g.poder !== 'pulo' && g.poder !== 'nova') || aereo, sorteioSt = rng();
    let dano = danoBase(at.m, a.slot) * mult * variacao * (critico ? CRIT_MULT : 1) * (ativo(bt, at, 'forca') ? FORCA_MULT : 1) * (ativo(bt, at, 'frenesi') ? PODERES.frenesi.dano : 1) * (g.poder === 'pulo' ? PODERES.pulo.dano : 1) * (g.poder === 'nova' ? PODERES.nova.dano : 1) * (g.poder === 'esfera' ? PODERES.esfera.dano : 1) * (g.poder === 'disco' ? PODERES.disco.dano : 1) * (bt.bioma && BIOMA_ELEMENTO[bt.bioma] === at.m.tipo ? (bt.tt[i].has('pe') ? PE_BONUS : BONUS_BIOMA) : 1)
      * (bt.tt[i].has('dupla') && bt.sin[i].dupla.has(at.m.tipo) ? DUPLA_MULT : 1) * (bt.tt[1 - i].has('arco') && bt.sin[1 - i].arco ? ARCO_MULT : 1)
      * (bt.tt[i].has('abertura') && !at.abriu ? ABERTURA_MULT : 1) * (at.tals.has('ultimo') && at.hp < at.m.hp * ULTIMO_LIMITE ? ULTIMO_MULT : 1) * (df.tals.has('res_' + g.tipo) ? RESIST_MULT : 1)
      * (bt.tt[i].has('foco') && df.hp < df.m.hp * 0.5 ? FOCO_MULT : 1) * (a.slot === 'forte' && bt.tt[i].has('combo') && at.combo >= 3 ? COMBO_MULT : 1) * (a.slot === 'ultimate' && bt.tt[i].has('ult_poder') ? ULT_PODER_DANO : 1) * (a.slot === 'forte' && at.tals.has('golpe_pesado') ? PESADO_DANO : 1)
      * (bt.tt[1 - i].has('escudo_ini') && bt.t < ESCUDO_MS ? ESCUDO_MULT : 1) * (bt.tt[1 - i].has('muralha') && df.protAte > bt.t ? MURALHA_MULT : 1)
      * (df.m.familia === 'pedra' ? TRACO.pedra.dano : 1) * (df.m.familia === 'dragao' && a.slot === 'forte' ? TRACO.dragao.forte : 1) * (at.m.familia === 'dragao' && a.slot === 'ultimate' ? TRACO.dragao.ult : 1) * (at.m.familia === 'inseto' && a.slot === 'rapido' ? TRACO.inseto : 1)
      * (bt.tt[i].has('lacos') && bt.sin[i].fam.has(at.m.familia) ? LACOS_MULT : 1) * (bt.tt[1 - i].has('misto') && bt.sin[1 - i].misto ? MISTO_MULT : 1);
    if (a.slot === 'rapido') at.combo++; else if (a.slot === 'forte') at.combo = 0;
    if (a.slot === 'ultimate' && bt.tt[i].has('ult_dupla')) bt.times[i].forEach((l) => { if (l !== at && l.hp > 0) l.cd.ultimate = Math.max(0, l.cd.ultimate - l.cdTotal.ultimate * ULT_DUPLA_PCT); });
    if (bt.tt[i].has('abertura') && !at.abriu) aviso(bt, i, 'Abertura');
    if (at.tals.has('ultimo') && at.hp < at.m.hp * ULTIMO_LIMITE && !at.ultAvisou) { at.ultAvisou = true; aviso(bt, i, 'Último suspiro'); }
    at.abriu = true;
    const atravessou = (g.poder === 'nova' || g.poder === 'esfera') && df.defesaAte > bt.t; // a supernova e a esfera gigante partem a defesa e deixam passar parte do dano
    const bloqueado = df.defesaAte > bt.t && !atravessou; // a defesa evita este ataque e se desfaz
    if (atravessou) { df.defesaAte = 0; dano *= PODERES[g.poder].atravessa; }
    if (bloqueado) { df.defesaAte = 0; dano = 0; } else if (esquiva) dano = 0;
    df.hp -= dano;
    let status = null;
    if (g.poder === 'nova' && dano > 0 && (df.st.forca || df.st.frenesi)) { delete df.st.forca; delete df.st.frenesi; aviso(bt, 1 - i, 'Buffs derrubados'); } // a supernova limpa os buffs do alvo
    if (g.poder === 'pulo') { if (dano > 0 && df.hp > 0) status = aplicar(bt, 1 - i, 'stun', g.tipo, PODERES.pulo.stun); } // o super pulo sempre atordoa
    else if (dano > 0 && df.hp > 0 && !(g.poder === 'disco' && !a.parte)) { // acertou: talvez aplique um status (o disco só no segundo acerto)
      const ef = (EFEITO[g.tipo] || {})[a.slot === 'ultimate' ? 'forte' : a.slot], chance = a.slot === 'ultimate' ? ULT_STATUS_CHANCE : ef && ef[1];
      if (ef && sorteioSt < chance) {
        if (df.tals.has('corpo') && rng() < CORPO_CH) aviso(bt, 1 - i, 'Corpo fechado');
        else status = aplicar(bt, 1 - i, ef[0], g.tipo, ef[0] === 'veneno' && at.tals.has('veneno_pot') ? DURACAO.veneno + VENENO_EXTRA : ef[0] === 'paralisia' && at.tals.has('paralisia_longa') ? DURACAO.paralisia + PARALISIA_EXTRA : undefined);
      }
    }
    if (dano > 0 && critico && bt.tt[i].has('sede')) { at.cd.ultimate = Math.max(0, at.cd.ultimate - SEDE_MS); aviso(bt, i, 'Sede de ultimate'); }
    if (dano > 0 && df.tals.has('espinhos')) { const volta = dano * ESPINHOS_PCT; at.hp -= volta; bt.eventos.push({ ev: 'dot', i, dano: volta, hpApos: Math.max(0, at.hp), fonte: 'Espinhos' }); }
    if (a.slot === 'rapido' && ++at.rapidos % 3 === 0 && at.hp > 0) { // a cada 3 ataques rápidos
      if (at.tals.has('folego')) curar(bt, i, [bt.ativo[i]], FOLEGO_PCT, 'Fôlego');
      if (bt.tt[i].has('cura_cadeia')) curar(bt, i, bt.times[i].map((l, k) => k).filter((k) => bt.times[i][k].hp > 0), CADEIA_PCT, 'Cura em cadeia');
    }
    if (g.poder === 'disco' && !a.parte) bt.agenda.push({ t: bt.t + PODERES.disco.volta, i, lado: at, acao: { slot: 'ultimate', parte: 2 } });
    bt.log.push(`${at.m.nome} usa ${g.nome} (${bloqueado ? 'bloqueado' : esquiva ? 'esquivou' : dano.toFixed(1) + (critico ? ' crítico' : '')})`);
    bt.eventos.push({
      ev: 'golpe', atq: i, def: 1 - i, slot: a.slot, idx: IDX[a.slot], dano, tipo: g.tipo, golpe: g.nome, poder: g.poder || null, fx: g.fx || 'proj', aereo, atravessou, parte: a.parte || 1, mult,
      crit: critico && !esquiva && !bloqueado, esquiva: esquiva && !bloqueado, bloqueado, hpApos: Math.max(0, df.hp), status,
    });
  }

  // Melhor reserva viva do lado i: a que tem vantagem sobre o adversário em campo; senão a primeira viva.
  function melhorReserva(bt, i) {
    const o = bt.lados[1 - i];
    const vivos = bt.times[i].map((l, k) => [l, k]).filter(([l, k]) => k !== bt.ativo[i] && l.hp > 0);
    const v = vivos.find(([l]) => VENCE[l.m.tipo] === o.m.tipo) || vivos[0];
    return v ? v[1] : -1;
  }
  // Troca o monstro em campo do lado i pelo de índice idx. Voluntária: precisa estar livre, com a espera de troca zerada; forçada
  // (depois de um nocaute): vale sempre. Cancela a carga em andamento e a defesa; o que entra fica 0,6 s sem agir.
  function trocar(bt, i, idx) {
    const l = bt.lados[i], novo = bt.times[i][idx], forcada = !!bt.pendente[i];
    if (bt.fim || !novo || novo.hp <= 0 || idx === bt.ativo[i]) return false;
    if (!forcada && (l.hp <= 0 || bt.trocaCd[i] > 0 || travado(bt, l))) return false;
    const de = bt.ativo[i];
    l.acao = null; l.defesaAte = 0;
    bt.ativo[i] = idx; bt.lados[i] = novo; bt.pendente[i] = null; bt.trocaCd[i] = forcada ? Math.min(bt.trocaCd[i], 2000) : (bt.tt[i].has('troca') ? TROCA_AGIL_CD : TROCA_CD);
    novo.entraAte = bt.t + (bt.tt[i].has('troca') ? 0 : ENTRA_MS); if (forcada) novo.protAte = bt.t + MURALHA_MS;
    bt.log.push(`${novo.m.nome} entra no lugar de ${l.m.nome}`);
    bt.pre.push({ ev: 'troca', i, de, para: idx, forcada, regra: bt.regra[i] }); bt.regra[i] = null;
    return true;
  }

  // Avança a luta dt ms. cmds: [habilidade do lado 0, habilidade do lado 1] (ou null): o que cada lado tenta usar neste passo.
  function passo(bt, rng, dt, cmds) {
    if (bt.fim) return bt;
    bt.eventos = []; // o que aconteceu neste passo, para a tela animar
    bt.t += dt;
    bt.trocaCd = bt.trocaCd.map((v) => Math.max(0, v - dt));
    for (const i of [0, 1]) { const l = bt.lados[i]; if (l.hp > 0 && l.m.familia === 'planta') l.hp = Math.min(l.m.hp, l.hp + l.m.hp * TRACO.planta * dt / 1000); } // traço da Planta: Raízes
    for (const i of [0, 1]) if (bt.tt[i].has('reserva')) bt.times[i].forEach((l, k) => { if (k !== bt.ativo[i] && l.hp > 0) l.hp = Math.min(l.m.hp, l.hp + l.m.hp * RESERVA_PCT * dt / 1000); });
    for (const l of bt.lados) {
      const v = (ativo(bt, l, 'lento') ? 0.7 : 1) * (ativo(bt, l, 'frenesi') ? PODERES.frenesi.ritmo : 1);
      for (const s of SLOTS) l.cd[s] = Math.max(0, l.cd[s] - dt * v);
      const fr = l.st.frenesi;
      if (fr) while (fr.prox <= bt.t && fr.prox <= fr.ate && l.hp > 1) { // custo do frenesi: um tique por segundo, sem deixar a vida abaixo de 1
        const dano = Math.min(l.hp - 1, l.m.hp * PODERES.frenesi.custo); l.hp -= dano; fr.prox += 1000;
        bt.eventos.push({ ev: 'dot', i: bt.lados.indexOf(l), dano, hpApos: Math.max(0, l.hp), fonte: 'Frenesi' });
      }
      const ve = l.st.veneno;
      if (ve && ve.ate > ve.prox - 1000) while (ve.prox <= bt.t && ve.prox <= ve.ate) { // um tique por segundo
        const dano = l.m.hp * VENENO_PCT; l.hp -= dano; ve.prox += 1000;
        bt.eventos.push({ ev: 'dot', i: bt.lados.indexOf(l), dano, hpApos: Math.max(0, l.hp) });
      }
    }
    if (cmds) cmds.forEach((s, i) => { if (s) usar(bt, i, s); });
    // os ataques que terminam a carga neste passo acertam juntos: ninguém ganha por acertar primeiro
    const prontos = [0, 1].filter((i) => bt.lados[i].acao && bt.t >= bt.lados[i].acao.fim).map((i) => [i, bt.lados[i].acao]);
    for (const [i, a] of prontos) { bt.lados[i].acao = null; resolver(bt, rng, i, a); } // o stun de um golpe não desfaz o outro que já terminou a carga
    while (bt.agenda.length && bt.agenda[0].t <= bt.t) { const x = bt.agenda.shift(); if (!bt.fim && x.lado === bt.lados[x.i] && x.lado.hp > 0) resolver(bt, rng, x.i, x.acao); } // golpes agendados (a volta do disco)
    // nocaute do monstro em campo: com reserva viva, o próximo entra depois de um tempo; sem reserva, o time caiu
    for (const i of [0, 1]) {
      const l = bt.lados[i];
      if (l.hp <= 0 && !bt.pendente[i] && bt.times[i].some((x) => x.hp > 0)) {
        bt.pendente[i] = { ate: bt.t + NOCAUTE_MS }; l.acao = null;
        bt.eventos.push({ ev: 'nocaute', i, idx: bt.ativo[i] });
      }
      if (bt.pendente[i] && bt.t >= bt.pendente[i].ate) trocar(bt, i, melhorReserva(bt, i));
    }
    bt.eventos.push(...bt.pre.splice(0)); // as trocas entram na lista deste passo
    const vivo = [0, 1].map((i) => bt.times[i].some((x) => x.hp > 0));
    const frac = (i) => bt.times[i].reduce((a, x) => a + Math.max(0, x.hp), 0) / bt.times[i].reduce((a, x) => a + x.m.hp, 0);
    if (!vivo[0] || !vivo[1]) bt.fim = { vencedor: vivo[0] === vivo[1] ? null : vivo[0] ? 0 : 1, motivo: 'K.O.' };
    else if (bt.t >= (bt.maxMs || MAX_MS)) bt.fim = { vencedor: frac(0) === frac(1) ? null : frac(0) > frac(1) ? 0 : 1, motivo: 'tempo' };
    return bt;
  }

  // IA do adversário (e do simulador): reage à carga de ataque forte com a defesa e usa o que estiver pronto, do mais forte ao mais fraco,
  // com um pequeno atraso de "reação" para não ser perfeita. p(x) = chance x por 100 ms.
  function ia(bt, i, rng, dt, reacao = 0.25, ritmo = 0.6) {
    const l = bt.lados[i], o = bt.lados[1 - i];
    const p = (x) => rng() < 1 - Math.pow(1 - x, dt / 100);
    if (podeUsar(bt, i, 'defesa') && o.acao && o.acao.slot !== 'rapido' && o.acao.fim - bt.t < 500 && p(reacao)) return 'defesa';
    if (l.acao || !p(ritmo)) return null;
    for (const s of ['ultimate', 'forte', 'rapido']) if (l.cd[s] <= 0) return s;
    return null;
  }

  // ---------- Torneio: 5 lutas em sequência contra adversários cada vez melhores (IA mais esperta e mais talentos); 2 vidas.
  // Os talentos começam travados (só os iniciais) e cada vitória deixa escolher 1 de 3 prêmios (um talento novo ou +1 ponto de orçamento).
  const TORNEIO = {
    fases: 5, vidas: 2, orcBase: 4, bonusMax: 4, iniciais: { time: ['abertura'], mon: ['folego', 'ultimo'] },
    curaEntre: 0.6, revive: 0.5, // entre as lutas: cada monstro vivo recupera 35% da vida; os caídos voltam com 25%
    // dificuldade: multiplica a reação/ritmo do adversário, soma pontos de talento e muda as vidas
    dificuldades: { facil: { nome: 'Fácil', ia: 0.7, orc: -1, vidas: 3 }, normal: { nome: 'Normal', ia: 1, orc: 0, vidas: 2 }, dificil: { nome: 'Difícil', ia: 1.3, orc: 1, vidas: 1 } },
    // cada fase: um adversário com nome, frase e jeito de jogar (as regras do automático), IA base e pontos de talento; o chefe tem talentos fixos
    adv: [
      { nome: 'Bia', titulo: 'a Aprendiz', frase: 'Vai com calma comigo!', ia: { reacao: 0.02, ritmo: 0.09 }, orc: 2, pol: { estilo: 'equilibrado', defesa: 'forte', ultimate: 'pronto', trocaDesv: true, trocaVida: 0, proximo: 'melhor' } },
      { nome: 'Caio', titulo: 'Pavio Curto', frase: 'Quem precisa de defesa?', ia: { reacao: 0.03, ritmo: 0.10 }, orc: 3, pol: { estilo: 'agressivo', defesa: 'nunca', ultimate: 'pronto', trocaDesv: false, trocaVida: 0, proximo: 'ordem' } },
      { nome: 'Dona Mara', titulo: 'a Muralha', frase: 'Paciência vence tudo.', ia: { reacao: 0.03, ritmo: 0.11 }, orc: 3, pol: { estilo: 'defensivo', defesa: 'forte', ultimate: 'vantagem', trocaDesv: true, trocaVida: 30, proximo: 'melhor' } },
      { nome: 'Rex', titulo: 'o Caçador', frase: 'Já sei o seu ponto fraco.', ia: { reacao: 0.04, ritmo: 0.12 }, orc: 4, pol: { estilo: 'agressivo', defesa: 'forte', ultimate: 'finalizar', trocaDesv: true, trocaVida: 20, proximo: 'melhor' } },
      { nome: 'Zéfira', titulo: 'Rainha das Tempestades', frase: 'Ajoelhe-se diante da tormenta!', ia: { reacao: 0.05, ritmo: 0.14 }, orc: 2, chefe: true, fixos: { time: ['arco', 'ultimate'], mon: ['espinhos', 'corpo', 'folego'] }, pol: { estilo: 'equilibrado', defesa: 'forte', ultimate: 'vantagem', trocaDesv: true, trocaVida: 30, proximo: 'melhor' } },
    ],
  };
  // Talentos do adversário da fase: sorteados no orçamento (mais a dificuldade) e, no chefe, somados aos talentos fixos dele
  function talentosAdversario(rng, fase, dif = 'normal', n = 3) {
    const cfg = TORNEIO.adv[fase - 1], d = TORNEIO.dificuldades[dif] || TORNEIO.dificuldades.normal;
    const t = sortearTalentos(rng, n, Math.max(0, cfg.orc + d.orc));
    if (cfg.fixos) { cfg.fixos.time.forEach((id) => { if (!t.time.includes(id)) t.time.push(id); }); cfg.fixos.mon.forEach((id, k) => { if (k < n) t.mon[k] = id; }); }
    return t;
  }
  // IA base do adversário da fase na dificuldade escolhida
  function iaAdversario(fase, dif = 'normal') {
    const cfg = TORNEIO.adv[fase - 1], d = TORNEIO.dificuldades[dif] || TORNEIO.dificuldades.normal;
    return { reacao: Math.min(1, cfg.ia.reacao * d.ia), ritmo: Math.min(1, cfg.ia.ritmo * d.ia) };
  }
  // ---------- Treinadores: 15 adversários fixos (nome, time, jeito de jogar e talentos), em 5 níveis. Vencer dá pontos; os pontos compram
  // insígnias; cada insígnia libera o nível seguinte. Os 3 primeiros (nível 1) estão sempre liberados.
  const INSIGNIAS = [
    { id: 'bronze', nome: 'Insígnia de Bronze', custo: 20, libera: 2 }, { id: 'prata', nome: 'Insígnia de Prata', custo: 50, libera: 3 },
    { id: 'ouro', nome: 'Insígnia de Ouro', custo: 90, libera: 4 }, { id: 'platina', nome: 'Insígnia de Platina', custo: 140, libera: 5 },
  ];
  // Evolução (Fase D): ao chegar no nível indicado, a forma base vira a evoluída (mesmos golpes, mais vida e ataque). Só 4 linhas por enquanto.
  const EVOLUCOES = {
    fagulhao: { id: 'labaredo', nome: 'Labaredo', nv: 16 }, mareal: { id: 'oceanico', nome: 'Oceânico', nv: 16 },
    brotinho: { id: 'carvalhinho', nome: 'Carvalhinho', nv: 16 }, faiscao: { id: 'faiscante', nome: 'Faiscante', nv: 16 },
    chamuscao: { id: 'carvaoreal', nome: 'Carvão Real', nv: 16 }, pingolino: { id: 'pingueiroimperial', nome: 'Pingueiro Imperial', nv: 16 }, musgarra: { id: 'musgarrao', nome: 'Musgarrão', nv: 16 },
    ventinho: { id: 'vendaval', nome: 'Vendaval', nv: 16 }, nuvelino: { id: 'cumulonio', nome: 'Cumulônio', nv: 16 }, trovinho: { id: 'trovaodourado', nome: 'Trovão Dourado', nv: 16 },
    brasinha: { id: 'brasalisco', nome: 'Brasalisco', nv: 16 }, vulcanejo: { id: 'magmadilo', nome: 'Magmadilo', nv: 16 }, algazinho: { id: 'algamar', nome: 'Algamar', nv: 16 }, coraline: { id: 'recifante', nome: 'Recifante', nv: 16 }, pedrinho: { id: 'rochedao', nome: 'Rochedão', nv: 16 }, tatufungo: { id: 'esporao', nome: 'Esporão', nv: 16 }, plumelho: { id: 'plumareu', nome: 'Plumaréu', nv: 16 }, redemoinha: { id: 'ciclonara', nome: 'Ciclonara', nv: 16 }, zapinho: { id: 'zapotrao', nome: 'Zapotrão', nv: 16 }, raiomante: { id: 'tempestauro', nome: 'Tempestauro', nv: 16 },
    brasoleta: { id: 'brasadeira', nome: 'Brasadeira', nv: 16 }, besourao: { id: 'besourei', nome: 'Besourei', nv: 16 }, casulucia: { id: 'lagartucia', nome: 'Lagartúcia', nv: 10 }, lagartucia: { id: 'papelucia', nome: 'Papelúcia', nv: 20 }, // linha de 3 estágios: Casulúcia, Lagartúcia, Papelúcia (a forma final é a borboleta)
     tesloura: { id: 'teslorrao', nome: 'Teslorrão', nv: 16 },
    rochilo: { id: 'gargolo', nome: 'Gárgolo', nv: 16 }, cristalino: { id: 'cristalao', nome: 'Cristalão', nv: 16 }, texugao: { id: 'texugarra', nome: 'Texugarra', nv: 16 }, lontrinha: { id: 'lontrao', nome: 'Lontrão', nv: 16 },
  };
  const BONUS_EVO = { hp: 1.25, atk: 1.15 };
  // B2: a forma evoluída destas espécies é só do líder (o jogador captura a base, mas ela não evolui)
  const EVO_EXCLUSIVA = { vulcanejo: 'dan', coraline: 'tati', redemoinha: 'laura', raiomante: 'du', tatufungo: 'guto' };
  const EVOLUI = (id) => !!EVOLUCOES[id] && !EVO_EXCLUSIVA[id]; // o jogador pode evoluir?
  const evoluidaN = (m, n) => { let x = m; for (let i = 0; i < n; i++) x = evoluida(x); return x; }; // n estágios de evolução (a linha da borboleta tem 2; as outras, 1)
  const evoluida = (m) => { const e = EVOLUCOES[m.id]; return e ? { ...m, id: e.id, nome: e.nome, hp: Math.round(m.hp * BONUS_EVO.hp), atk: +(m.atk * BONUS_EVO.atk).toFixed(2) } : m; };
  const PONTOS_TREINADOR = { primeira: (nivel) => 10 * nivel, revanche: 3 }; // primeira vitória: 10 x nível; repetir a vitória: 3 pontos
  const NIVEL_TREINADOR = [{ ia: { reacao: 0.03, ritmo: 0.10 } }, { ia: { reacao: 0.05, ritmo: 0.15 } }, { ia: { reacao: 0.09, ritmo: 0.22 } }, { ia: { reacao: 0.11, ritmo: 0.27 } }, { ia: { reacao: 0.15, ritmo: 0.35 } }];
  const POL = (estilo, defesa = 'forte', ultimate = 'pronto', trocaDesv = true, trocaVida = 0, proximo = 'melhor') => ({ estilo, defesa, ultimate, trocaDesv, trocaVida, proximo });
  const TREINADORES = [
    { id: 'isis', nome: 'Treinadora Iris', nivel: 1, time: ['pingolino', 'mareal', 'nuvelino'], frase: 'A água sempre encontra o caminho.', pol: POL('equilibrado'), tal: { time: [], mon: ['folego', null, null] } },
    { id: 'bruno', nome: 'Treinador Zico', nivel: 1, time: ['brotinho', 'musgarra', 'fagulhao'], frase: 'Firme como uma rocha!', pol: POL('agressivo', 'forte', 'pronto', false), tal: { time: [], mon: [null, 'casca', null] } },
    { id: 'lucia', nome: 'Treinadora Luh', nivel: 1, time: ['ventinho', 'nuvelino', 'faiscao'], frase: 'Rápido demais para você!', pol: POL('equilibrado'), tal: { time: ['abertura'], mon: [] } },
    { id: 'tomas', nome: 'Treinador Tomy', nivel: 2, time: ['fagulhao', 'chamuscao', 'brotinho'], frase: 'Vou queimar a sua estratégia.', pol: POL('agressivo', 'forte', 'pronto', true), tal: { time: ['abertura'], mon: ['veneno_pot', null, null] } },
    { id: 'nina', nome: 'Treinadora Nina', nivel: 2, time: ['faiscao', 'trovinho', 'mareal'], frase: 'Sinta a corrente!', pol: POL('equilibrado', 'forte', 'vantagem'), tal: { time: ['ultimate'], mon: [] } },
    { id: 'otto', nome: 'Treinador Otto', nivel: 2, time: ['chamuscao', 'fagulhao', 'trovinho'], frase: 'Quem espera, vence.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['abertura'], mon: [null, null, 'ultimo'] } },
    { id: 'vera', nome: 'Treinadora Bia', nivel: 3, time: ['mareal', 'pingolino', 'chamuscao'], frase: 'A maré virou.', pol: POL('equilibrado', 'forte', 'vantagem', true, 20), tal: { time: ['arco'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'davi', nome: 'Treinador Iuri', nivel: 3, time: ['ventinho', 'nuvelino', 'musgarra'], frase: 'Nem me viu passar.', pol: POL('agressivo', 'nunca', 'pronto', true), tal: { time: ['troca'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'agata', nome: 'Treinadora Mel', nivel: 3, time: ['chamuscao', 'fagulhao', 'ventinho'], frase: 'Cinzas é o que sobra.', pol: POL('agressivo', 'forte', 'finalizar'), tal: { time: ['abertura', 'dupla'], mon: [] } },
    { id: 'felix', nome: 'Treinador Félix', nivel: 4, time: ['trovinho', 'faiscao', 'nuvelino'], frase: 'Prepare-se para o choque.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['ultimate', 'sede'], mon: [] } },
    { id: 'selma', nome: 'Treinadora Selma', nivel: 4, time: ['musgarra', 'brotinho', 'pingolino'], frase: 'Raízes fundas, vitória certa.', pol: POL('defensivo', 'forte', 'finalizar', true, 30), tal: { time: ['reserva'], mon: [] } },
    { id: 'hugo', nome: 'Treinador Hugo', nivel: 4, time: ['pingolino', 'mareal', 'trovinho'], frase: 'Mergulhe fundo.', pol: POL('equilibrado', 'forte', 'vantagem', true, 20), tal: { time: ['arco'], mon: ['corpo', null, null] } },
    { id: 'yara', nome: 'Treinadora Yara', nivel: 5, time: ['ventinho', 'nuvelino', 'chamuscao'], frase: 'O vento decide.', pol: POL('agressivo', 'forte', 'vantagem', true, 20), tal: { time: ['ultimate', 'abertura'], mon: ['folego', null, null] } },
    { id: 'magno', nome: 'Treinador Magno', nivel: 5, time: ['chamuscao', 'fagulhao', 'musgarra'], frase: 'Eu sou a erupção.', pol: POL('agressivo', 'forte', 'finalizar', true, 20), tal: { time: ['dupla', 'sede'], mon: ['espinhos', null, null] } },
    // W1 (PLANO-fases.md, aprovados pelo George): Lago 2, Vila da Água e a líder do 1º ginásio (Tati). Nomes de até 5 letras.
    { id: 'caio', nome: 'Treinador Caio', nivel: 2, time: ['mareal', 'pingolino', 'nuvelino'], frase: 'Quem pesca, tem paciência.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['arco'], mon: [null, null, 'folego'] } },
    { id: 'duda', nome: 'Treinadora Duda', nivel: 2, time: ['pingolino', 'ventinho', 'mareal'], frase: 'Mergulha comigo!', pol: POL('equilibrado'), tal: { time: ['arco'], mon: [null, null, 'folego'] } },
    { id: 'nico', nome: 'Treinador Nico', nivel: 2, time: ['algazinho', 'trovinho', 'pingolino'], frase: 'Choque na água é perigoso!', pol: POL('agressivo', 'forte', 'pronto', false), tal: { time: ['arco'], mon: [null, null, 'folego'] } },
    { id: 'bela', nome: 'Treinadora Bela', nivel: 3, time: ['bolhudo', 'musgarra', 'mareal'], frase: 'Raiz firme na margem.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['arco'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'rafa', nome: 'Treinador Rafa', nivel: 3, time: ['mareal', 'bolhudo', 'chamuscao'], frase: 'Pega a onda!', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['arco'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'lia', nome: 'Treinadora Lia', nivel: 3, time: ['algazinho', 'nuvelino', 'pingolino'], frase: 'O vento sopra a favor.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['arco'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'beto', nome: 'Treinador Beto', nivel: 3, time: ['pingolino', 'mareal', 'brotinho'], frase: 'A Tati não perde para quem tem pressa.', pol: POL('equilibrado', 'forte', 'vantagem', true, 20), tal: { time: ['arco'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'tati', nome: 'Líder Tati', nivel: 3, evo: ['coraline'], time: ['mareal', 'algazinho', 'coraline'], frase: 'A maré leva quem hesita.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: [], mon: [null, null, null] } },
    // W2 (PLANO-fases.md; PROPOSTOS, o George ainda pode trocar nomes, times e falas): Floresta Escondida e Bosque leste. Nomes de até 5 letras.
    { id: 'dora', nome: 'Treinadora Dora', nivel: 2, time: ['brotinho', 'musgarra', 'ventinho'], frase: 'A mata guarda segredos.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['pe'], mon: [null, null, 'espinhos'] } },
    { id: 'kaio', nome: 'Treinador Kaio', nivel: 2, time: ['taupino', 'nuvelino', 'brotinho'], frase: 'Rápido como o vento!', pol: POL('agressivo', 'forte', 'pronto', false), tal: { time: ['pe'], mon: [null, null, 'espinhos'] } },
    { id: 'maya', nome: 'Treinadora Maya', nivel: 3, time: ['musgarra', 'brotinho', 'nuvelino'], frase: 'Cada folha é um sinal.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'zeca', nome: 'Treinador Zeca', nivel: 3, time: ['brotinho', 'faiscao', 'musgarra'], frase: 'Silêncio... eles ouvem.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'gabi', nome: 'Treinadora Gabi', nivel: 3, time: ['ventinho', 'nuvelino', 'faiscao'], frase: 'Segura que o vento vem forte!', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'toni', nome: 'Treinador Toni', nivel: 3, time: ['nuvelino', 'plumelho', 'chamuscao'], frase: 'Tronco forte, raiz profunda.', pol: POL('defensivo', 'forte', 'finalizar', true, 30), tal: { time: ['troca'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'cris', nome: 'Treinadora Cris', nivel: 4, time: ['nuvelino', 'ventinho', 'trovinho'], frase: 'Tempestade a caminho!', pol: POL('agressivo', 'forte', 'vantagem', true, 20), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'joca', nome: 'Treinador Joca', nivel: 4, time: ['nuvelino', 'plumelho', 'faiscao'], frase: 'Quem não arrisca, não petisca.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'fabi', nome: 'Treinadora Fabi', nivel: 3, time: ['nuvelino', 'ventinho', 'musgarra'], frase: 'Não me subestime.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca'], mon: [null, 'critico', 'sem_lento'] } },
    // W3 (PLANO-fases.md; PROPOSTOS, o George ainda pode trocar nomes, times e falas): Vila do Vento (Laura, 2º ginásio) e Vila do Raio (Du, 3º ginásio). Nomes de até 5 letras.
    { id: 'rui', nome: 'Treinador Rui', nivel: 3, time: ['ventinho', 'plumelho', 'bolhudo'], frase: 'Aqui o vento nunca para.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['troca'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'nana', nome: 'Treinadora Nana', nivel: 3, time: ['pipinha', 'ventinho', 'brotinho'], frase: 'Solte a pipa, solte o medo!', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'laura', nome: 'Líder Laura', nivel: 4, evo: ['redemoinha'], time: ['ventinho', 'nuvelino', 'redemoinha'], frase: 'O vento escolhe quem sobe.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['troca', 'abertura', 'recarga'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'pedro', nome: 'Treinador Pedro', nivel: 4, time: ['faiscao', 'zapinho', 'ventinho'], frase: 'Choque de realidade!', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['ultimate', 'sede'], mon: [null, 'veneno_pot', 'paralisia_longa'] } },
    { id: 'lara', nome: 'Treinadora Lara', nivel: 4, time: ['trovinho', 'faiscao', 'pipinha'], frase: 'Já sentiu um raio cair?', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['ultimate', 'sede'], mon: [null, 'veneno_pot', 'paralisia_longa'] } },
    { id: 'du', nome: 'Líder Du', nivel: 4, evo: ['raiomante'], time: ['zapinho', 'trovinho', 'raiomante'], frase: 'Sente a corrente?', pol: POL('agressivo', 'forte', 'vantagem', true, 20), tal: { time: ['ultimate', 'sede'], mon: ['veneno_pot', 'paralisia_longa', 'critico'] } },
    // W4 (PLANO-fases.md; PROPOSTOS, o George ainda pode trocar nomes, times e falas): Montanha, Montanha 2 e Bosque norte. Nomes de até 5 letras.
    { id: 'tito', nome: 'Treinador Tito', nivel: 3, time: ['trovinho', 'faiscao', 'taupino'], frase: 'Pedra sobre pedra.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['ultimate'], mon: [null, 'veneno_pot', 'paralisia_longa'] } },
    { id: 'leo', nome: 'Treinador Leo', nivel: 3, time: ['faiscao', 'pedrinho', 'zapinho'], frase: 'Quer ver faísca?', pol: POL('agressivo', 'forte', 'pronto', false), tal: { time: ['ultimate'], mon: [null, 'veneno_pot', 'paralisia_longa'] } },
    { id: 'sofi', nome: 'Treinadora Sofi', nivel: 4, time: ['lampiro', 'trovinho', 'musgarra'], frase: 'Cuidado onde pisa.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['ultimate', 'sede'], mon: [null, 'veneno_pot', 'paralisia_longa'] } },
    { id: 'gil', nome: 'Treinador Gil', nivel: 4, time: ['trovinho', 'lampiro', 'pedrinho'], frase: 'Cavei fundo para te achar.', pol: POL('equilibrado', 'forte', 'vantagem', true, 20), tal: { time: ['ultimate', 'sede'], mon: [null, 'veneno_pot', 'paralisia_longa'] } },
    { id: 'elis', nome: 'Treinadora Elis', nivel: 4, time: ['pipinha', 'plumelho', 'mareal'], frase: 'Aqui em cima o ar é fino.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'maru', nome: 'Treinadora Maru', nivel: 4, time: ['nuvelino', 'tatufungo', 'pipinha'], frase: 'Firme como a rocha.', pol: POL('defensivo', 'forte', 'finalizar', true, 30), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'dino', nome: 'Treinador Dino', nivel: 4, time: ['nuvelino', 'zapinho', 'redemoinha'], frase: 'A tempestade chegou.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'ney', nome: 'Treinador Ney', nivel: 4, time: ['nuvelino', 'lampiro', 'plumelho'], frase: 'Não olhe para baixo.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'alex', nome: 'Treinador Alex', nivel: 4, time: ['pedrinho', 'brotinho', 'brasinha'], frase: 'Fogo na mata!', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'vini', nome: 'Treinador Vini', nivel: 4, time: ['brotinho', 'coraline', 'tatufungo'], frase: 'A mata bebe a chuva.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'cida', nome: 'Treinadora Cida', nivel: 4, time: ['taupino', 'tatufungo', 'vulcanejo'], frase: 'Quem entra na mata não sai igual.', pol: POL('equilibrado', 'forte', 'vantagem', true, 20), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'raul', nome: 'Treinador Raul', nivel: 4, time: ['brotinho', 'musgarra', 'pavio'], frase: 'Quem avisa, amigo é.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    // W5 (PLANO-fases.md; PROPOSTOS): Castelo. Vlad guarda a chave e tem o time inteiro evoluído (como Ryu e Lee). Nomes de até 5 letras.
    { id: 'odin', nome: 'Treinador Odin', nivel: 4, time: ['coraline', 'tatufungo', 'lampiro'], frase: 'Ninguém entra sem se anunciar.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['abertura', 'ultimate'], mon: [null, 'corpo', 'ultimo'] } },
    { id: 'kira', nome: 'Treinadora Kira', nivel: 4, time: ['redemoinha', 'pavio', 'pedrinho'], frase: 'A guarda não dorme.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['abertura', 'ultimate'], mon: [null, 'corpo', 'ultimo'] } },
    { id: 'hans', nome: 'Treinador Hans', nivel: 5, time: ['raiomante', 'zapinho', 'taupino'], frase: 'O portão se fecha atrás de você.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['abertura', 'ultimate'], mon: [null, 'corpo', 'ultimo'] } },
    { id: 'vlad', nome: 'Treinador Vlad', nivel: 5, evo: true, time: ['fagulhao', 'mareal', 'brotinho'], frase: 'A chave tem dono.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['abertura', 'ultimate'], mon: [null, 'corpo', 'ultimo'] } },
    // W6 (PLANO-fases.md; PROPOSTOS): Praia, Farol e Ginásio da Pedra (Guto, 4º ginásio). Nomes de até 5 letras.
    { id: 'dani', nome: 'Treinadora Dani', nivel: 4, time: ['bolhudo', 'algazinho', 'pipinha'], frase: 'O mar traz de tudo.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['arco', 'reserva'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'lipe', nome: 'Treinador Lipe', nivel: 4, time: ['coraline', 'pingolino', 'plumelho'], frase: 'Pega onda ou pega areia.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['arco', 'reserva'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'rosa', nome: 'Treinadora Rosa', nivel: 4, time: ['mareal', 'taupino', 'bolhudo'], frase: 'Cuidado com os caranguejos.', pol: POL('defensivo', 'forte', 'vantagem', true, 30), tal: { time: ['arco'], mon: [null, null, 'folego'] } },
    { id: 'edu', nome: 'Treinador Edu', nivel: 4, time: ['coraline', 'mareal', 'pedrinho'], frase: 'Maré cheia!', pol: POL('equilibrado', 'forte', 'pronto', true, 0), tal: { time: ['arco', 'reserva'], mon: [null, 'folego', 'pele_grossa'] } },
    { id: 'jair', nome: 'Treinador Jair', nivel: 4, time: ['ventinho', 'nuvelino', 'algazinho'], frase: 'Sou o guardião da luz.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'moa', nome: 'Treinadora Moa', nivel: 5, time: ['nuvelino', 'redemoinha', 'lampiro'], frase: 'A luz guia os perdidos.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'teo', nome: 'Treinador Teo', nivel: 4, time: ['plumelho', 'nuvelino', 'pedrinho'], frase: 'Quem acende, apaga.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['troca', 'abertura'], mon: [null, 'critico', 'sem_lento'] } },
    { id: 'olga', nome: 'Treinadora Olga', nivel: 5, time: ['pedrinho', 'tatufungo', 'chamuscao'], frase: 'Pedra que rola não cria limo.', pol: POL('defensivo', 'forte', 'finalizar', true, 30), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'ivan', nome: 'Treinador Ivan', nivel: 5, time: ['taupino', 'pedrinho', 'trovinho'], frase: 'Na pedra se aprende.', pol: POL('equilibrado', 'forte', 'vantagem', true, 20), tal: { time: ['pe', 'arco'], mon: [null, 'espinhos', 'casca'] } },
    { id: 'guto', nome: 'Líder Guto', nivel: 5, evo: ['tatufungo'], time: ['pedrinho', 'brotinho', 'tatufungo'], frase: 'Aqui, quem cai não levanta.', pol: POL('equilibrado', 'forte', 'vantagem', false, 0), tal: { time: [], mon: [null, null, null] } },
    // Floresta Oculta: andam pela clareira, times só de evoluídos (por isso nível 5 e dois talentos de time)
    { id: 'dan', nome: 'Líder Dan', nivel: 5, evo: true, time: ['fagulhao', 'chamuscao', 'vulcanejo'], frase: 'O fogo não perdoa quem chega até aqui.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['abertura', 'dupla', 'escudo_ini', 'recarga'], mon: ['ultimo', 'pele_grossa', 'espinhos'] } },
    { id: 'ryu', nome: 'Treinador Ryu', nivel: 5, evo: true, time: ['fagulhao', 'ventinho', 'trovinho'], frase: 'O punho encontra o caminho.', pol: POL('agressivo', 'forte', 'pronto', true, 20), tal: { time: ['abertura', 'ultimate'], mon: [null, 'corpo', 'ultimo'] } },
    { id: 'lee', nome: 'Treinador Lee', nivel: 5, evo: true, time: ['mareal', 'brotinho', 'nuvelino'], frase: 'Seja água, meu amigo.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['abertura', 'ultimate'], mon: [null, 'corpo', 'ultimo'] } },
    { id: 'aurora', nome: 'Mestra Aurora', nivel: 5, time: ['faiscao', 'mareal', 'brotinho'], frase: 'Mostre o que aprendeu.', pol: POL('equilibrado', 'forte', 'vantagem', true, 30), tal: { time: ['arco', 'ultimate'], mon: ['espinhos', 'corpo', 'folego'] } },
  ];
  const treinadorPorId = (id) => TREINADORES.find((t) => t.id === id);
  const timeDoTreinador = (t) => t.time.map((id) => { const m = MONSTROS.find((x) => x.id === id); return t.evo === true || (Array.isArray(t.evo) && t.evo.includes(id)) ? evoluida(m) : m; }); // evo: true = o time inteiro já vem evoluído; lista = só esses monstros
  const talentosTreinador = (t) => normalizarTalentos(t.tal, t.time.length);
  const iaTreinador = (t) => NIVEL_TREINADOR[t.nivel - 1].ia;

  // Adversários da fase (3 monstros que não estão no seu time). Da fase 4 em diante, cada vaga tem 20% de chance de ser o melhor contra um monstro seu.
  function adversariosTorneio(rng, meuTime, fase) {
    const resto = MONSTROS.filter((m) => !meuTime.includes(m)), adv = [];
    while (adv.length < meuTime.length) {
      let k = Math.floor(rng() * resto.length);
      if (fase >= 4 && rng() < 0.2) { const alvo = meuTime[adv.length % meuTime.length], c = resto.findIndex((m) => VENCE[m.tipo] === alvo.tipo); if (c >= 0) k = c; }
      adv.push(resto.splice(k, 1)[0]);
    }
    return adv;
  }

  // ---------- Regras do modo automático ("política"): o jogador configura como o time joga sozinho.
  //  estilo: ritmo de apertar e rapidez de reagir | defesa: quando defender | ultimate: quando soltar | trocaDesv: trocar quando o adversário
  //  tem vantagem | trocaVida: trocar abaixo de X% de vida (0 = nunca) | proximo: quem entra depois de um nocaute
  const POLITICA_PADRAO = { estilo: 'equilibrado', defesa: 'forte', ultimate: 'pronto', trocaDesv: true, trocaVida: 0, proximo: 'melhor' };
  const ESTILOS = { equilibrado: { reacao: 1, ritmo: 1, nome: 'Equilibrado' }, agressivo: { reacao: 0.6, ritmo: 1.4, nome: 'Agressivo' }, defensivo: { reacao: 1.8, ritmo: 0.75, nome: 'Defensivo' } };
  const OPCOES_POLITICA = {
    estilo: { equilibrado: 'Equilibrado', agressivo: 'Agressivo: aperta mais, defende menos', defensivo: 'Defensivo: defende mais, aperta menos' },
    defesa: { forte: 'Defender de ataques fortes e ultimates', ultimate: 'Defender só do ultimate', nunca: 'Nunca defender' },
    ultimate: { pronto: 'Soltar assim que ficar pronto', vantagem: 'Só com vantagem de elemento ou adversário abaixo de 50%', finalizar: 'Só quando o adversário estiver abaixo de 50%' },
    trocaVida: { 0: 'Não trocar por vida baixa', 20: 'Trocar abaixo de 20% de vida', 30: 'Trocar abaixo de 30% de vida', 40: 'Trocar abaixo de 40% de vida' },
    proximo: { melhor: 'O melhor contra o adversário', ordem: 'Na ordem do time', vida: 'O com mais vida' },
  };
  function iaPolitica(bt, i, rng, dt, pol = POLITICA_PADRAO, base = IA_HUMANO) {
    const e = ESTILOS[pol.estilo] || ESTILOS.equilibrado, reacao = Math.min(1, base.reacao * e.reacao), ritmo = Math.min(1, base.ritmo * e.ritmo);
    const l = bt.lados[i], o = bt.lados[1 - i], p = (x) => rng() < 1 - Math.pow(1 - x, dt / 100);
    const quer = pol.defesa === 'nunca' ? false : pol.defesa === 'ultimate' ? o.acao && o.acao.slot === 'ultimate' : o.acao && o.acao.slot !== 'rapido';
    if (quer && podeUsar(bt, i, 'defesa') && o.acao.fim - bt.t < 500 && p(reacao)) { bt.regra[i] = 'defender'; return 'defesa'; }
    if (l.acao || !p(ritmo)) return null;
    const fo = o.hp / o.m.hp, vant = VENCE[l.m.tipo] === o.m.tipo;
    const buffUlt = l.m.golpes.ultimate.poder === 'frenesi'; // poder de buff: vale pela hora, não pelo elemento do alvo, então ignora as regras vantagem/finalizar
    const ultOk = buffUlt || pol.ultimate === 'pronto' || (pol.ultimate === 'vantagem' && (vant || fo < 0.5)) || (pol.ultimate === 'finalizar' && fo < 0.5);
    for (const sl of ['ultimate', 'forte', 'rapido']) {
      if (sl === 'ultimate' && !ultOk) continue;
      if (l.cd[sl] <= 0) { if (sl === 'ultimate' && !buffUlt && pol.ultimate !== 'pronto') bt.regra[i] = 'ultimate: ' + (pol.ultimate === 'vantagem' ? 'vantagem' : 'finalizar'); return sl; }
    }
    return null;
  }

  // IA de troca: sem política (adversário do jogo), troca só quando está em desvantagem e há reserva com vantagem; com política, segue as regras.
  // Depois de um nocaute escolhe o próximo (pelo melhor contra o adversário ou pela regra "proximo").
  function iaTroca(bt, i, rng, dt, pol = null) {
    if (bt.fim) return null;
    const l = bt.lados[i], o = bt.lados[1 - i], p = (x) => rng() < 1 - Math.pow(1 - x, dt / 100);
    if (bt.pendente[i]) {
      if (!p(0.2)) return null;
      const vivos = bt.times[i].map((x, k) => [x, k]).filter(([x, k]) => k !== bt.ativo[i] && x.hp > 0);
      if (!vivos.length) return null;
      if (pol && pol.proximo === 'ordem') { bt.regra[i] = 'próximo: ordem'; return vivos[0][1]; }
      if (pol && pol.proximo === 'vida') { bt.regra[i] = 'próximo: mais vida'; return vivos.sort((a, b) => b[0].hp / b[0].m.hp - a[0].hp / a[0].m.hp)[0][1]; }
      return melhorReserva(bt, i);
    }
    if (bt.trocaCd[i] > 0 || l.acao || travado(bt, l) || bt.t < l.entraAte) return null;
    let alt = -1, regra = null;
    if ((!pol || pol.trocaDesv) && VENCE[o.m.tipo] === l.m.tipo) { alt = bt.times[i].findIndex((x, k) => k !== bt.ativo[i] && x.hp > 0 && VENCE[x.m.tipo] === o.m.tipo); regra = 'desvantagem'; }
    if (alt < 0 && pol && pol.trocaVida > 0 && l.hp / l.m.hp < pol.trocaVida / 100) {
      const c = bt.times[i].map((x, k) => [x, k]).filter(([x, k]) => k !== bt.ativo[i] && x.hp / x.m.hp > 0.5).sort((a, b) => b[0].hp / b[0].m.hp - a[0].hp / a[0].m.hp)[0];
      if (c) { alt = c[1]; regra = 'vida baixa'; }
    }
    if (alt >= 0 && p(pol ? 0.12 : 0.05)) { bt.regra[i] = regra; return alt; }
    return null;
  }

  // Níveis de IA: o adversário do jogo é fácil (reage devagar e demora a apertar), o que o simulador usa por padrão é o forte.
  const IA_FORTE = { reacao: 0.25, ritmo: 0.6 }, IA_FACIL = { reacao: 0.03, ritmo: 0.12 }, IA_HUMANO = { reacao: 0.12, ritmo: 0.3 };

  // Itens que saem dos objetos quebrados: benção (cura, força, recarga) ou maldição (dano, stun de 1 a 3 s, veneno).
  // Devolve os eventos para a tela (um 'item' e, se for o caso, um 'status'). rng() decide o sorteio.
  const ITENS = [['cura', 22], ['forca', 18], ['recarga', 20], ['dano', 14], ['stun', 14], ['veneno', 12]];
  const CURA_PCT = 0.15, DANO_ITEM_PCT = 0.1, FORCA_MULT = 1.35, FORCA_MS = 8000;
  function item(bt, i, rng) {
    if (bt.fim) return [];
    const l = bt.lados[i], ev0 = bt.eventos; bt.eventos = [];
    let r = rng() * ITENS.reduce((a, b) => a + b[1], 0), nome = ITENS[0][0];
    for (const [n, w] of ITENS) { if (r < w) { nome = n; break; } r -= w; }
    const sorte = bt.tt[i].has('sorte'), maldicao = ['dano', 'stun', 'veneno'].includes(nome);
    const desfeita = sorte && maldicao && rng() < SORTE_DESFAZ, otimo = sorte && !maldicao && rng() < SORTE_OTIMO, x = otimo ? 2 : 1;
    const e = { ev: 'item', i, item: desfeita ? 'desfeito' : nome, maldicao: maldicao && !desfeita, otimo, hpApos: l.hp };
    if (desfeita) { /* a maldição se desfaz */ }
    else if (nome === 'cura') { l.hp = Math.min(l.m.hp, l.hp + l.m.hp * CURA_PCT * x); e.hpApos = l.hp; }
    else if (nome === 'forca') l.st.forca = { ate: bt.t + FORCA_MS * x, dur: FORCA_MS * x };
    else if (nome === 'recarga') { for (const sl of SLOTS) l.cd[sl] = 0; if (otimo) { l.hp = Math.min(l.m.hp, l.hp + l.m.hp * 0.1); e.hpApos = l.hp; } }
    else if (nome === 'dano') { l.hp = Math.max(1, l.hp - l.m.hp * DANO_ITEM_PCT); e.hpApos = l.hp; }
    else if (nome === 'stun') aplicar(bt, i, 'stun', null, 1000 + Math.round(rng() * 2000));
    else aplicar(bt, i, 'veneno', null);
    bt.log.push(`${l.m.nome} quebra um item: ${nome}`);
    const out = [e, ...bt.eventos]; bt.eventos = ev0;
    return out;
  }

  const api = {
    EVOLUCOES, BONUS_EVO, evoluida, evoluidaN, FAMILIAS, TRACO, TAL_TATICA, TATICA_BASE, politicaEfetiva, taticaNoOrcamento, ARVORE, NV_DEGRAU, custoNo, validarArvore, pontosTalento, migrarTal, NIVEL_AREA, NIVEL_LIDER, OFFSET_POSTO, postoDe, nivelNoMundo, EVO_EXCLUSIVA, EVOLUI, PESO_RARIDADE, CAPTURA_RARIDADE, REGIOES, REGIAO_DA_AREA, pesosSelvagem, TREINADORES, INSIGNIAS, PONTOS_TREINADOR, treinadorPorId, timeDoTreinador, talentosTreinador, iaTreinador,
    TORNEIO, adversariosTorneio, talentosAdversario, iaAdversario,
    POLITICA_PADRAO, ESTILOS, OPCOES_POLITICA, iaPolitica,
    TAL_TIME, TAL_MON, ORCAMENTO, custoTalentos, normalizarTalentos, sortearTalentos, ABERTURA_MULT, RESIST_MULT,
    EL, BIOMA_ELEMENTO, BONUS_BIOMA, TROCA_CD, trocar, iaTroca, melhorReserva,
    IA_FORTE, IA_FACIL, IA_HUMANO, item, FORCA_MULT, PODERES,
    MONSTROS, VENCE, VANTAGEM, DESVANTAGEM, MAX_MS, NIVEL, EFEITO, DURACAO, CRIT_CHANCE, CRIT_MULT, ESQUIVA_CHANCE, SLOTS, BASE, IDX, DIVISOR,
    cdDe, cargaDe, danoBase, criarRng, multiplicador, novaBatalha, podeUsar, passo, ia,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.PixmonBatalha = api;
})(typeof window !== 'undefined' ? window : globalThis);
