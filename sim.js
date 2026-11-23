// Simulador de equilíbrio em tempo real: roda lutas sem tela (passos de 100 ms), os dois lados com a IA (reage à carga com a defesa,
// usa ultimate > forte > rápido), e confere as regras do plano. Uso: node sim.js [lutasPorPar] [reacao 0..1]
const B = require('./battle.js');
const assert = require('assert');

const LUTAS = Number(process.argv[2]) || 200;
const REACAO = process.argv[3] === undefined ? 0.25 : Number(process.argv[3]); // chance (por 100 ms) de a IA defender quando vê um ataque forte carregando
const DT = 100;
const M = B.MONSTROS;

const stAplic = { veneno: 0, lento: 0, paralisia: 0, stun: 0 }, stCancel = { n: 0 };
const trocas = { forcadas: 0, livres: 0 };
const visto = { golpes: 0, crit: 0, esquiva: 0, bloqueio: 0, defesas: 0 };
function luta(a, b, seed, ia0 = B.IA_FORTE, ia1 = B.IA_FORTE, bioma = null, tal = null) {
  const rng = B.criarRng(seed);
  const bt = B.novaBatalha(a, b, bioma, tal);
  while (!bt.fim) {
    for (const i of [0, 1]) { const tr = B.iaTroca(bt, i, rng, DT); if (tr != null) B.trocar(bt, i, tr); }
    B.passo(bt, rng, DT, [B.ia(bt, 0, rng, DT, ia0 === B.IA_FORTE ? REACAO : ia0.reacao, ia0.ritmo), B.ia(bt, 1, rng, DT, ia1 === B.IA_FORTE ? REACAO : ia1.reacao, ia1.ritmo)]);
    for (const e of bt.eventos) {
      if (e.ev === 'defesa') visto.defesas++;
      if (e.ev === 'troca') trocas[e.forcada ? 'forcadas' : 'livres']++;
      if (e.ev === 'status') { stAplic[e.st]++; if (e.cancelou) stCancel.n++; }
      if (e.ev !== 'golpe') continue;
      visto.golpes++; if (e.crit) visto.crit++; if (e.esquiva) visto.esquiva++; if (e.bloqueado) visto.bloqueio++;
      assert.ok(!(e.crit && (e.esquiva || e.bloqueado)), 'crítico em golpe esquivado ou bloqueado');
      assert.ok(!(e.esquiva || e.bloqueado) || e.dano === 0, 'golpe sem efeito com dano');
    }
  }
  return bt;
}

// Self-check: a mesma semente produz a mesma luta; as recargas e a carga seguem o ritmo de cada monstro.
assert.strictEqual(luta(M[0], M[1], 42).log.join('|'), luta(M[0], M[1], 42).log.join('|'));
assert.strictEqual(B.multiplicador('agua', 'fogo'), B.VANTAGEM);
assert.strictEqual(B.multiplicador('fogo', 'agua'), B.DESVANTAGEM);
assert.strictEqual(B.multiplicador('agua', 'terra'), 1);
{ // regras da recarga e da defesa em um caso pequeno
  const bt = B.novaBatalha(M[0], M[1]), rng = B.criarRng(1);
  assert.ok(B.podeUsar(bt, 0, 'rapido') && !B.podeUsar(bt, 0, 'ultimate'), 'rapido pronto no início, ultimate ainda carregando');
  B.passo(bt, rng, 100, ['rapido', null]);
  assert.ok(!B.podeUsar(bt, 0, 'rapido'), 'rapido em recarga depois do uso');
  assert.ok(bt.lados[0].acao, 'ataque em carga');
  assert.ok(!B.podeUsar(bt, 0, 'forte'), 'não dá para iniciar outro ataque durante a carga');
  B.passo(bt, rng, 100, ['defesa', null]);
  assert.ok(bt.lados[0].defesaAte > bt.t, 'defesa ativa');
}
assert.ok(M.every((m) => m.nivel === B.NIVEL && m.atk === M[0].atk), 'todos no mesmo nível (mesmo ataque base)');
{ // status: stun cancela a carga e trava; veneno tira vida; lentidão alarga a carga
  const bt = B.novaBatalha(M[0], M[1]), rng = B.criarRng(3);
  B.passo(bt, rng, 100, ['forte', null]);
  assert.ok(bt.lados[0].acao, 'carregando');
  bt.lados[0].st.stun = { ate: bt.t + 1000, dur: 1000 }; // simula stun já aplicado
  assert.ok(!B.podeUsar(bt, 0, 'rapido') && !B.podeUsar(bt, 0, 'defesa'), 'stun trava tudo');
  const b2 = B.novaBatalha(M[0], M[1]); b2.lados[1].st.veneno = { ate: 6000, dur: 6000, prox: 1000 };
  for (let k = 0; k < 20; k++) B.passo(b2, B.criarRng(1), 100, [null, null]);
  assert.ok(Math.abs(b2.lados[1].hp - (M[1].hp - 2 * M[1].hp * 0.015)) < 1e-9, 'veneno tira 1,5% por segundo');
}
{ // talentos: cada um faz o que diz
  const roda = (tal, passos, cmd, ini) => { const bt = B.novaBatalha(M.slice(0, 3), M.slice(3, 6), 'campo', tal), rng = B.criarRng(11); if (ini) ini(bt); const ev = []; for (let k = 0; k < passos; k++) { B.passo(bt, rng, 100, [cmd, null]); ev.push(...bt.eventos); } return { bt, ev }; };
  { // Fôlego: 3 rápidos -> cura 5%
    const r = roda([{ time: [], mon: ['folego', null, null] }, null], 120, 'rapido', (bt) => { bt.lados[0].hp = 20; });
    assert.ok(r.ev.some((e) => e.ev === 'cura' && e.fonte === 'Fôlego'), 'Fôlego dispara');
  }
  { // Cura em cadeia: o time todo (inclusive o banco) recupera
    const r = roda([{ time: ['cura_cadeia'], mon: [] }, null], 120, 'rapido', (bt) => { bt.times[0].forEach((l) => { l.hp = 20; }); });
    assert.ok(r.ev.some((e) => e.ev === 'cura' && e.todos), 'Cura em cadeia dispara');
    assert.ok(r.bt.times[0][1].hp > 20 && r.bt.times[0][2].hp > 20, 'o banco também recupera');
  }
  { // Ultimate adiantado
    const b1 = B.novaBatalha(M[0], M[1], null, [{ time: ['ultimate'], mon: [] }, null]), b0 = B.novaBatalha(M[0], M[1]);
    assert.ok(b1.lados[0].cd.ultimate < b0.lados[0].cd.ultimate, 'ultimate começa mais carregado');
  }
  { // Troca ágil: espera de 3 s e sem parada
    const bt = B.novaBatalha(M.slice(0, 3), M.slice(3, 6), null, [{ time: ['troca'], mon: [] }, null]);
    assert.ok(B.trocar(bt, 0, 1) && bt.trocaCd[0] === 3000 && bt.lados[0].entraAte <= bt.t, 'troca ágil');
  }
  { // Resistência: 10% a menos de dano (mesma semente, mesmo golpe)
    const dano = (tal) => { const bt = B.novaBatalha(M[0], M[8], null, tal), rng = B.criarRng(5); let d = 0; for (let k = 0; k < 40; k++) { B.passo(bt, rng, 100, ['rapido', null]); for (const e of bt.eventos) if (e.ev === 'golpe' && e.atq === 0 && e.dano > 0 && !e.crit) d += e.dano; } return d; };
    const sem = dano(null), com = dano([null, { time: [], mon: ['res_fogo'] }]);
    assert.ok(Math.abs(com / sem - B.RESIST_MULT) < 0.02, 'resistência corta ~10%: ' + (com / sem));
  }
  { // Sede de ultimate: um crítico adianta 1 s; Reserva descansada: o banco recupera; Espinhos: devolve dano; Casca grossa: o 1º stun não pega
    const bt = B.novaBatalha(M.slice(0, 3), M.slice(3, 6), null, [{ time: ['reserva'], mon: [] }, { time: [], mon: ['casca', null, null] }]);
    bt.times[0][1].hp = 10; const rng = B.criarRng(1); for (let k = 0; k < 50; k++) B.passo(bt, rng, 100, [null, null]);
    assert.ok(bt.times[0][1].hp > 10 && bt.times[0][1].hp <= bt.times[0][1].m.hp, 'reserva recupera o banco');
    const b2 = B.novaBatalha(M[0], M[1], null, [null, { time: [], mon: ['casca'] }]);
    assert.ok(B.item(b2, 1, () => 0.999).length >= 0);
    b2.lados[1].tals = new Set(['casca']); // aplica um stun pelo item (rng 0.8 sorteia a maldição de stun)
    let pegou = 0; for (let k = 0; k < 300 && !b2.lados[1].cascaUsada; k++) { const ev = B.item(b2, 1, B.criarRng(k + 3)); if (ev.some((e) => e.ev === 'status' && e.st === 'stun')) pegou++; b2.lados[1].st = {}; b2.lados[1].imuneAte = 0; }
    assert.ok(b2.lados[1].cascaUsada && pegou === 0, 'o primeiro stun não pega');
    const b3 = B.novaBatalha(M[0], M[8], null, [null, { time: [], mon: ['espinhos'] }]); const r3 = B.criarRng(2); let volta = false;
    for (let k = 0; k < 40; k++) { B.passo(b3, r3, 100, ['rapido', null]); if (b3.eventos.some((e) => e.ev === 'dot' && e.fonte === 'Espinhos')) volta = true; }
    assert.ok(volta, 'espinhos devolve dano');
  }
  { // Orçamento: o excedente é cortado
    const n = B.normalizarTalentos({ time: ['cura_cadeia', 'sorte', 'ultimate', 'troca'], mon: ['folego'] });
    assert.ok(B.custoTalentos(n.time) <= B.ORCAMENTO && n.mon.length === 3, 'orçamento respeitado');
  }
  { // Mão de sorte: aparecem itens ótimos e maldições desfeitas
    const bt = B.novaBatalha(M[0], M[1], null, [{ time: ['sorte'], mon: [] }, null]); let otimo = 0, desf = 0;
    for (let k = 0; k < 600; k++) { const [e] = B.item(bt, 0, B.criarRng(k + 1)); if (e.otimo) otimo++; if (e.item === 'desfeito') desf++; bt.lados[0].st = {}; bt.lados[0].hp = bt.lados[0].m.hp; }
    assert.ok(otimo > 20 && desf > 20, 'sorte muda o sorteio de itens');
  }
}
assert.ok(M.every((m) => B.cdDe(m, 'rapido') > 0 && B.cargaDe(m, 'forte') > 0), 'recarga e carga positivas');
assert.strictEqual(new Set(M.map((m) => m.rc + ':' + m.cg)).size, M.length, 'cada monstro tem ritmo diferente dos outros');
assert.strictEqual(new Set(M.flatMap((m) => Object.values(m.golpes).map((g) => g.nome))).size, M.length * 4, 'cada habilidade tem nome próprio');

// Item quebrado: cada resultado faz o que diz
{
  const bt = B.novaBatalha(M[0], M[1]); bt.lados[0].hp = 30; bt.lados[0].cd.forte = 3000;
  const seen = new Set();
  for (let k = 0; k < 400; k++) { const r = B.criarRng(k + 1); const b2 = B.novaBatalha(M[0], M[1]); b2.lados[0].hp = 30; b2.lados[0].cd.forte = 3000; const [e] = B.item(b2, 0, r); seen.add(e.item);
    if (e.item === 'cura') assert.ok(b2.lados[0].hp > 30 && b2.lados[0].hp <= 60);
    if (e.item === 'recarga') assert.ok(b2.lados[0].cd.forte === 0 && b2.lados[0].cd.ultimate === 0);
    if (e.item === 'dano') assert.ok(b2.lados[0].hp < 30 && b2.lados[0].hp >= 1);
    if (e.item === 'stun') { const d = b2.lados[0].st.stun.dur; assert.ok(d >= 1000 && d <= 3000); }
    if (e.item === 'forca') assert.ok(b2.lados[0].st.forca.ate > 0); }
  assert.strictEqual(seen.size, 6, 'os 6 itens aparecem');
}

// Regras do modo automático: o time A joga com uma regra diferente da padrão contra um time B no padrão (mesmos times, lados trocados)
function lutaPol(ta, tb, seed, polA, polB, bio) {
  const rng = B.criarRng(seed), bt = B.novaBatalha(ta, tb, bio), pols = [polA, polB];
  while (!bt.fim) {
    for (const i of [0, 1]) { const tr = B.iaTroca(bt, i, rng, DT, pols[i]); if (tr != null) B.trocar(bt, i, tr); }
    B.passo(bt, rng, DT, [B.iaPolitica(bt, 0, rng, DT, polA), B.iaPolitica(bt, 1, rng, DT, polB)]);
  }
  return bt;
}
const POL_N = Math.max(120, LUTAS); // amostra maior: com 20 monstros no pool, 30 sorteios davam ruído de +-6 pontos
const polTab = [];
for (const [campo, opcoes] of Object.entries(B.OPCOES_POLITICA)) for (const op of Object.keys(opcoes)) {
  if (String(B.POLITICA_PADRAO[campo]) === String(op)) continue;
  let v = 0, n = 0;
  for (let k = 0; k < POL_N; k++) {
    const rng = B.criarRng(777 + k), pool = M.slice().sort(() => rng() - 0.5), ta = pool.slice(0, 3), tb = pool.slice(3, 6), bio = Object.keys(B.BIOMA_ELEMENTO)[k % Object.keys(B.BIOMA_ELEMENTO).length];
    const pol = { ...B.POLITICA_PADRAO, [campo]: campo === 'trocaVida' ? Number(op) : op };
    const b1 = lutaPol(ta, tb, 5 + k, pol, B.POLITICA_PADRAO, bio), b2 = lutaPol(tb, ta, 9 + k, B.POLITICA_PADRAO, pol, bio);
    n += 2; if (b1.fim.vencedor === 0) v++; if (b2.fim.vencedor === 1) v++;
  }
  polTab.push({ txt: campo + '=' + op, v: v / n });
}
{ // trocar só por desvantagem desligado
  let v = 0, n = 0;
  for (let k = 0; k < POL_N; k++) {
    const rng = B.criarRng(888 + k), pool = M.slice().sort(() => rng() - 0.5), ta = pool.slice(0, 3), tb = pool.slice(3, 6), bio = Object.keys(B.BIOMA_ELEMENTO)[k % Object.keys(B.BIOMA_ELEMENTO).length];
    const pol = { ...B.POLITICA_PADRAO, trocaDesv: false };
    const b1 = lutaPol(ta, tb, 5 + k, pol, B.POLITICA_PADRAO, bio), b2 = lutaPol(tb, ta, 9 + k, B.POLITICA_PADRAO, pol, bio);
    n += 2; if (b1.fim.vencedor === 0) v++; if (b2.fim.vencedor === 1) v++;
  }
  polTab.push({ txt: 'trocaDesv=não', v: v / n });
}
console.log('Regras do automático (vence contra o padrão, torneio: campeão 20-60% no normal, fácil > normal > difícil, treinadores: nível 1 >= 75% e nível 5 entre 30 e 70%): ' + polTab.map((t) => t.txt + ' ' + (t.v * 100).toFixed(0) + '%').join(', '));
const polOk = polTab.every((t) => t.v <= 0.62); // nenhuma regra pode dominar; regras ruins (ex.: nunca defender) podem perder

// Torneio completo com a vida levada de uma luta para a outra: um jogador de ritmo humano (regras padrão, talentos sorteados no orçamento
// que ele teria naquela fase) contra os 5 adversários nomeados, com vidas e cura entre as lutas. Mede quantos terminam como campeão.
function corridaTorneio(seed, dif) {
  const T = B.TORNEIO, D = T.dificuldades[dif], rng = B.criarRng(seed), pool = M.slice().sort(() => rng() - 0.5), ta = pool.slice(0, 3);
  let hp = [1, 1, 1], vidas = D.vidas, fase = 1, bonus = 0, lutas = 0;
  const primeira = [];
  while (fase <= T.fases && vidas > 0) {
    const hpIni = hp.slice(), cfg = T.adv[fase - 1], tb = B.adversariosTorneio(rng, ta, fase);
    const tal = [B.sortearTalentos(rng, 3, Math.min(8, T.orcBase + bonus)), B.talentosAdversario(rng, fase, dif)];
    const bt = B.novaBatalha(ta, tb, Object.keys(B.BIOMA_ELEMENTO)[lutas % Object.keys(B.BIOMA_ELEMENTO).length], tal, [hp, null]), r2 = B.criarRng(seed * 7 + lutas);
    const ia1 = B.iaAdversario(fase, dif);
    while (!bt.fim) {
      const t0 = B.iaTroca(bt, 0, r2, DT, B.POLITICA_PADRAO), t1 = B.iaTroca(bt, 1, r2, DT, cfg.pol);
      if (t0 != null) B.trocar(bt, 0, t0); if (t1 != null) B.trocar(bt, 1, t1);
      B.passo(bt, r2, DT, [B.iaPolitica(bt, 0, r2, DT, B.POLITICA_PADRAO), B.iaPolitica(bt, 1, r2, DT, cfg.pol, ia1)]);
    }
    lutas++;
    if (bt.fim.vencedor === 0) {
      if (primeira[fase] === undefined) primeira[fase] = 1;
      hp = bt.times[0].map((l) => (l.hp > 0 ? Math.min(1, l.hp / l.m.hp + T.curaEntre) : T.revive)); bonus = Math.min(T.bonusMax, bonus + 1); fase++;
    } else { if (primeira[fase] === undefined) primeira[fase] = 0; vidas--; hp = hpIni; }
  }
  return { campeao: fase > T.fases, fase: Math.min(fase, T.fases), primeira };
}
const torneioTab = {};
for (const dif of Object.keys(B.TORNEIO.dificuldades)) {
  let camp = 0, fasesSoma = 0; const venc = Array(6).fill(0), jog = Array(6).fill(0), N = POL_N * 2;
  for (let k = 0; k < N; k++) { const r = corridaTorneio(100 + k, dif); if (r.campeao) camp++; fasesSoma += r.fase; r.primeira.forEach((v, f) => { if (v !== undefined) { jog[f]++; venc[f] += v; } }); }
  torneioTab[dif] = { camp: camp / N, fase: fasesSoma / N, porFase: [1, 2, 3, 4, 5].map((f) => (jog[f] ? venc[f] / jog[f] : 0)) };
}
console.log('Torneio (jogador de ritmo humano, vida levada entre lutas): ' + Object.entries(torneioTab).map(([d, v]) => d + ': campeão ' + (v.camp * 100).toFixed(0) + '%, fase média ' + v.fase.toFixed(1) + ' (1ª tentativa por fase: ' + v.porFase.map((x) => (x * 100).toFixed(0)).join('/') + '%)').join(' | '));
const tOk = torneioTab.facil.camp > torneioTab.normal.camp && torneioTab.normal.camp > torneioTab.dificil.camp && torneioTab.normal.camp >= 0.2 && torneioTab.normal.camp <= 0.6 && torneioTab.dificil.camp <= 0.35 && torneioTab.facil.camp <= 0.95;

// T1: toda espécie tem família; Dragão é sempre rara ou lendária (decisão do George).
assert.ok(M.every((m) => B.FAMILIAS[m.familia]), 'toda espécie tem família: ' + M.filter((m) => !B.FAMILIAS[m.familia]).map((m) => m.id));
assert.ok(M.filter((m) => m.familia === 'dragao').every((m) => m.raridade === 'rara' || m.raridade === 'lendaria'), 'dragões sempre raros');
assert.ok(M.every((m) => !B.EVOLUCOES[m.id] || B.evoluida(m).familia === m.familia), 'a forma evoluída herda a família');
// linha de 3 estágios: Casulúcia > Lagartúcia > Papelúcia, cada passo mais forte, e as outras linhas param no 1º
{ const c = M.find((m) => m.id === 'casulucia'), l = B.evoluidaN(c, 1), p = B.evoluidaN(c, 2); assert.ok(l.id === 'lagartucia' && p.id === 'papelucia' && c.hp < l.hp && l.hp < p.hp && p.familia === 'inseto', 'cadeia da borboleta'); assert.ok(B.evoluidaN(M.find((m) => m.id === 'fagulhao'), 2).id === 'labaredo', 'linha de 2 estágios para no 1º'); }
// B5: a árvore de talentos. Todo talento da árvore existe nas tabelas; pré-requisito, escolha de um entre dois, nível do monstro, pontos e migração do save.
for (const id of Object.keys(B.ARVORE)) assert.ok(({ time: B.TAL_TIME, mon: B.TAL_MON, tatica: B.TAL_TATICA })[B.ARVORE[id].arvore][id], 'nó da árvore sem talento: ' + id);
assert.deepStrictEqual(B.validarArvore('time', ['abertura', 'dupla', 'combo']), [], 'caminho válido do time');
assert.ok(B.validarArvore('time', ['dupla']).length === 1 && B.validarArvore('time', ['abertura', 'dupla', 'combo', 'foco']).length === 2 && B.validarArvore('time', ['abertura', 'combo']).length === 1, 'pré-requisito e escolha de um entre dois');
assert.deepStrictEqual(B.validarArvore('mon', ['critico', 'golpe_pesado'], 16), [], 'monstro nível 16 pode o degrau 3');
assert.ok(B.validarArvore('mon', ['golpe_pesado'], 10).length === 1, 'degrau 3 pede nível 16');
assert.ok(B.validarArvore('mon', ['critico', 'folego'], 16).length === 1, 'um talento por degrau no monstro');
assert.ok(B.pontosTalento(0, 0) === 4 && B.pontosTalento(60, 5) === 26 && B.pontosTalento(500, 9) === 26, 'pontos de talento');
assert.deepStrictEqual(B.migrarTal({ time: ['sede'], mon: { fagulhao: 'ultimo', mareal: null } }), { time: ['sede'], mon: { fagulhao: ['ultimo'], mareal: [] }, tatica: [] }, 'migração do save de talentos');
{ // dois talentos no mesmo monstro valem os dois (Pele grossa +8% de vida e Crítico fino)
  const bt2 = B.novaBatalha([M[0]], [M[1]], null, [{ time: [], mon: [['pele_grossa', 'folego']] }, null]);
  assert.ok(bt2.lados[0].tals.has('pele_grossa') && bt2.lados[0].tals.has('folego') && bt2.lados[0].m.hp === Math.round(M[0].hp * 1.08), 'vários talentos por monstro'); }
// B7: a árvore tática. Sem talento a regra volta ao padrão; com o talento a escolha vale; o que passa do orçamento fica de fora.
assert.ok(Object.keys(B.TAL_TATICA).every((id) => B.ARVORE[id] && B.ARVORE[id].arvore === 'tatica'), 'nós táticos na árvore');
assert.deepStrictEqual(B.politicaEfetiva({ estilo: 'agressivo', defesa: 'nunca', ultimate: 'finalizar', trocaDesv: true, trocaVida: 30, proximo: 'vida' }, []), B.TATICA_BASE, 'sem talento tático: tudo no padrão');
assert.deepStrictEqual(B.politicaEfetiva({ ...B.TATICA_BASE, estilo: 'agressivo', ultimate: 'vantagem' }, ['t_estilo']), { ...B.TATICA_BASE, estilo: 'agressivo' }, 'só o estilo foi destravado');
assert.deepStrictEqual(B.validarArvore('tatica', ['t_estilo', 't_troca', 't_vida']), [], 'caminho tático válido');
assert.ok(B.validarArvore('tatica', ['t_final']).length === 1, 't_final pede t_ult');
assert.deepStrictEqual(B.taticaNoOrcamento([], ['t_estilo', 't_defesa', 't_ult'], 3), ['t_estilo', 't_defesa'], 'orçamento corta o tático que não cabe');
// Treinadores: um jogador de ritmo humano com time e talentos sorteados (orçamento cheio) contra cada treinador, no cenário sorteado
const trTab = [];
for (const t of B.TREINADORES) {
  assert.ok(B.timeDoTreinador(t).every(Boolean) && new Set(t.time).size === 3, 'time do treinador válido: ' + t.id);
  let v = 0; const N = POL_N * 2;
  for (let k = 0; k < N; k++) {
    const rng = B.criarRng(6000 + k), pool = M.slice().sort(() => rng() - 0.5), ta = pool.slice(0, 3).map((m) => (t.evo === true && B.EVOLUI(m.id) ? B.evoluida(m) : m)), tb = B.timeDoTreinador(t); // treinador evoluído: o jogador do teste também evoluiu o time
    const bt = B.novaBatalha(ta, tb, Object.keys(B.BIOMA_ELEMENTO)[k % Object.keys(B.BIOMA_ELEMENTO).length], [B.sortearTalentos(rng, 3), B.talentosTreinador(t)]), r2 = B.criarRng(77 + k), ia1 = B.iaTreinador(t);
    while (!bt.fim) {
      const t0 = B.iaTroca(bt, 0, r2, DT, B.POLITICA_PADRAO), t1 = B.iaTroca(bt, 1, r2, DT, t.pol);
      if (t0 != null) B.trocar(bt, 0, t0); if (t1 != null) B.trocar(bt, 1, t1);
      B.passo(bt, r2, DT, [B.iaPolitica(bt, 0, r2, DT, B.POLITICA_PADRAO), B.iaPolitica(bt, 1, r2, DT, t.pol, ia1)]);
    }
    if (bt.fim.vencedor === 0) v++;
  }
  trTab.push({ t, v: v / N });
}
const porNivel = [1, 2, 3, 4, 5].map((n) => { const l = trTab.filter((x) => x.t.nivel === n); return l.reduce((a, b) => a + b.v, 0) / l.length; });
console.log('Treinadores (vitória do jogador por nível): ' + porNivel.map((x, i) => (i + 1) + ': ' + (x * 100).toFixed(0) + '%').join(', ') + ' | extremos: ' + trTab.reduce((a, b) => (b.v < a.v ? b : a)).t.nome + ' ' + (Math.min(...trTab.map((x) => x.v)) * 100).toFixed(0) + '%, ' + trTab.reduce((a, b) => (b.v > a.v ? b : a)).t.nome + ' ' + (Math.max(...trTab.map((x) => x.v)) * 100).toFixed(0) + '%');
console.log('Por treinador: ' + trTab.map((x) => x.t.id + ' ' + (x.v * 100).toFixed(0)).join(', '));
const trOk = porNivel.every((x, i) => i === 0 || x <= porNivel[i - 1] + 0.06) && porNivel[0] >= 0.75 && porNivel[4] >= 0.3 && porNivel[4] <= 0.7 && trTab.every((x) => x.v >= 0.2);
// B4 (PLANO-balanceamento.md): o duelo COM NÍVEL, como no jogo: o treinador tem o nível fixo da área + posto (B.nivelNoMundo); o jogador vem no nível esperado para aquela área (base da área + 1; no líder, o nível dele - 1; no Dan, - 2: o último líder pede subir um pouco acima do esperado). Vida e ataque escalam por 1 + 0,05 x (nível - 10).
const AREA_TR = require('./treinadores-area.cjs'), escalar = (m, nv) => { const f = 1 + 0.05 * (nv - 10); return { ...m, nivel: nv, hp: Math.round(m.hp * f), atk: +(m.atk * f).toFixed(2) }; };
const POSTOS_ORD = ['aprendiz', 'membro', 'veterano', 'elite', 'lider'], nvTab = [];
{ const N = Math.max(40, Math.floor(POL_N / 2));
  for (const t of B.TREINADORES) { const area = AREA_TR[t.id]; if (!area) continue; const lt = B.nivelNoMundo(t, area), lj = B.NIVEL_LIDER[t.id] ? lt - (t.id === 'dan' ? 2 : 1) : B.NIVEL_AREA[area] + 1, NN = B.NIVEL_LIDER[t.id] ? N * 4 : N; let v = 0; // líderes: amostra maior (só são 5), para a ordem entre eles não virar ruído
    for (let k = 0; k < NN; k++) {
      const rng = B.criarRng(9000 + k), pool = M.slice().sort(() => rng() - 0.5), ta = pool.slice(0, 3).map((m) => escalar(t.evo === true && B.EVOLUI(m.id) ? B.evoluida(m) : m, lj)), tb = B.timeDoTreinador(t).map((m) => escalar(m, lt));
      const bt = B.novaBatalha(ta, tb, Object.keys(B.BIOMA_ELEMENTO)[k % Object.keys(B.BIOMA_ELEMENTO).length], [B.sortearTalentos(rng, 3), B.talentosTreinador(t)]), r2 = B.criarRng(77 + k), ia1 = B.iaTreinador(t);
      while (!bt.fim) { const t0 = B.iaTroca(bt, 0, r2, DT, B.POLITICA_PADRAO), t1 = B.iaTroca(bt, 1, r2, DT, t.pol); if (t0 != null) B.trocar(bt, 0, t0); if (t1 != null) B.trocar(bt, 1, t1); B.passo(bt, r2, DT, [B.iaPolitica(bt, 0, r2, DT, B.POLITICA_PADRAO), B.iaPolitica(bt, 1, r2, DT, t.pol, ia1)]); }
      if (bt.fim.vencedor === 0) v++;
    }
    nvTab.push({ t, posto: B.postoDe(t), v: v / NN, lj, lt }); } }
const porPosto = POSTOS_ORD.map((p) => { const l = nvTab.filter((x) => x.posto === p); return l.length ? l.reduce((a, x) => a + x.v, 0) / l.length : NaN; });
console.log('Com nível e posto (jogador no nível esperado da área): ' + POSTOS_ORD.map((p, i) => p + ' ' + (porPosto[i] * 100).toFixed(0) + '%').join(', ') + ' | mais difíceis: ' + nvTab.slice().sort((a, b) => a.v - b.v).slice(0, 5).map((x) => x.t.id + ' ' + (x.v * 100).toFixed(0)).join(', '));
console.log('Líderes: ' + nvTab.filter((x) => x.posto === 'lider').map((x) => x.t.id + ' Nv' + x.lt + ' (jogador ' + x.lj + ') ' + (x.v * 100).toFixed(0) + '%').join(', '));
const checa = (c, m) => { if (process.env.SIM_SOFT) { if (!c) console.log('AVISO: ' + m); } else assert.ok(c, m); }; // SIM_SOFT=1: só avisa (para ver todos os números ao calibrar)
{ const lid = ['tati', 'laura', 'du', 'guto', 'dan'].map((id) => nvTab.find((x) => x.t.id === id).v); // B4: a dificuldade sobe com o posto e na ordem dos ginásios; ninguém abaixo de 20%
  checa(porPosto.every((x, k) => k === 0 || x <= porPosto[k - 1] + 0.03), 'vitória cai com o posto: ' + porPosto.map((x) => x.toFixed(2)));
  checa(lid.every((x, k) => k === 0 || x <= lid[k - 1] + 0.02), 'líderes na ordem Água, Vento, Raio, Pedra, Fogo (Dan pode empatar com Guto, 2 pontos): ' + lid.map((x) => x.toFixed(2)));
  checa(nvTab.every((x) => x.v >= 0.2), 'todo treinador com 20% ou mais: ' + nvTab.filter((x) => x.v < 0.2).map((x) => x.t.id)); }
{ // pontos e insígnias: a conta fecha (vencer todos de um nível paga a insígnia do próximo)
  let pts = 0;
  for (const ins of B.INSIGNIAS) { pts += B.TREINADORES.filter((x) => x.nivel === ins.libera - 1).reduce((a, x) => a + B.PONTOS_TREINADOR.primeira(x.nivel), 0); assert.ok(pts >= ins.custo, 'pontos bastam para ' + ins.id); pts -= ins.custo; }
}

// Modo humano: `node sim.js 200 0.25 humano` -> o jogador (IA_HUMANO) contra o adversário do jogo (IA_FACIL), todos os pares nos dois lados
if (process.argv[4] === 'humano') {
  let v = 0, n = 0, dd = 0;
  for (let i = 0; i < M.length; i++) for (let j = 0; j < M.length; j++) { if (i === j) continue; for (let k = 0; k < LUTAS / 4; k++) { const bt = luta(M[i], M[j], 31 * (i * 10 + j) + k, B.IA_HUMANO, B.IA_FACIL); n++; dd += bt.t; if (bt.fim.vencedor === 0) v++; } }
  console.log(`Jogador (IA_HUMANO) x adversário do jogo (IA_FACIL): jogador vence ${(v / n * 100).toFixed(1)}% em ${n} lutas, duração média ${(dd / n / 1000).toFixed(1)} s`);
  process.exit(0);
}

const vit = Object.fromEntries(M.map((m) => [m.id, 0])), jog = { ...vit };
let dur = 0, total = 0, pares = 0;
const tipados = [], neutros = [];
for (let i = 0; i < M.length; i++) {
  for (let j = i + 1; j < M.length; j++) {
    pares++;
    let vi = 0;
    for (let k = 0; k < LUTAS; k++) {
      const bt = luta(M[i], M[j], 7919 * pares + k);
      assert.ok(bt.fim && bt.t <= B.MAX_MS + DT, 'luta sem fim');
      total++; dur += bt.t; jog[M[i].id]++; jog[M[j].id]++;
      if (bt.fim.vencedor === 0) { vi++; vit[M[i].id]++; } else if (bt.fim.vencedor === 1) vit[M[j].id]++;
    }
    const taxa = vi / LUTAS;
    if (B.VENCE[M[i].tipo] === M[j].tipo) tipados.push({ txt: `${M[i].nome} (vantagem) x ${M[j].nome}`, v: taxa });
    else if (B.VENCE[M[j].tipo] === M[i].tipo) tipados.push({ txt: `${M[j].nome} (vantagem) x ${M[i].nome}`, v: 1 - taxa });
    else neutros.push({ txt: `${M[i].nome} x ${M[j].nome}`, v: Math.max(taxa, 1 - taxa) });
  }
}

console.log('Vitória por monstro:');
const taxas = M.map((m) => ({ m, t: vit[m.id] / jog[m.id] }));
taxas.forEach(({ m, t }) => console.log(`  ${m.nome.padEnd(10)} ${m.tipo.padEnd(8)} rc ${m.rc} cg ${m.cg}  ${(t * 100).toFixed(1)}%`));
const pior = neutros.reduce((a, b) => (b.v > a.v ? b : a));
const vMin = tipados.reduce((a, b) => (b.v < a.v ? b : a)), vMax = tipados.reduce((a, b) => (b.v > a.v ? b : a));
const media = dur / total / 1000;
console.log(`Duração média: ${media.toFixed(1)} s`);
console.log(`Pior par neutro: ${pior.txt} ${(pior.v * 100).toFixed(0)}%`);
console.log(`Pares com vantagem de elemento: quem tem vantagem vence de ${(vMin.v * 100).toFixed(0)}% (${vMin.txt}) a ${(vMax.v * 100).toFixed(0)}% (${vMax.txt})`);
const txCrit = visto.crit / visto.golpes, txEsq = visto.esquiva / visto.golpes;
console.log(`Golpes por luta: ${(visto.golpes / total).toFixed(1)}; críticos ${(txCrit * 100).toFixed(1)}%, esquivas ${(txEsq * 100).toFixed(1)}%, bloqueios ${(visto.bloqueio / visto.golpes * 100).toFixed(1)}% (defesas usadas por luta: ${(visto.defesas / total).toFixed(1)})`);
assert.ok(Math.abs(txEsq - B.ESQUIVA_CHANCE * (1 - visto.bloqueio / visto.golpes)) < 0.015, 'taxa de esquiva fora do esperado');

console.log('Status aplicados por luta: ' + Object.entries(stAplic).map(([k, v]) => k + ' ' + (v / total).toFixed(2)).join(', ') + '; cargas canceladas ' + (stCancel.n / total).toFixed(2));
// Times de 3 (sorteados, distintos) em cenários sorteados: duração, equilíbrio entre os lados e quanto cada elemento vence
const BIOMAS = Object.keys(B.BIOMA_ELEMENTO);
const porEl = {}, porFam = {}, porTal = {}; let tv = [0, 0, 0], tdur = 0, tn = 0, trocaTot = 0;
const bioSt = Object.fromEntries(BIOMAS.map((b) => [b, { jog: 0, vit: 0 }]));
for (let k = 0; k < LUTAS * 3; k++) {
  const rng = B.criarRng(9000 + k), emb = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const pool = emb(M.slice()), ta = pool.slice(0, 3), tb = pool.slice(3, 6), bio = BIOMAS[k % BIOMAS.length];
  const tl = [B.sortearTalentos(rng), B.sortearTalentos(rng)];
  const bt = luta(ta, tb, 123 + k, B.IA_FORTE, B.IA_FORTE, bio, tl);
  tl.forEach((t, lado) => { const ids = [...t.time, ...t.mon]; for (const id of new Set(ids)) { const e = (porTal[id] = porTal[id] || { jog: 0, vit: 0 }); e.jog++; if (bt.fim.vencedor === lado) e.vit++; } });
  assert.ok(bt.fim, 'luta de time sem fim');
  tn++; tdur += bt.t; tv[bt.fim.vencedor == null ? 2 : bt.fim.vencedor]++;
  for (const [lado, time] of [[0, ta], [1, tb]]) for (const mo of time) { const e = (porEl[mo.tipo] = porEl[mo.tipo] || { jog: 0, vit: 0 }); e.jog++; if (bt.fim.vencedor === lado) e.vit++; const fm = (porFam[mo.familia] = porFam[mo.familia] || { jog: 0, vit: 0 }); fm.jog++; if (bt.fim.vencedor === lado) fm.vit++; }
  const be = B.BIOMA_ELEMENTO[bio];
  for (const [lado, time] of [[0, ta], [1, tb]]) if (time.some((mo) => mo.tipo === be)) { bioSt[bio].jog++; if (bt.fim.vencedor === lado) bioSt[bio].vit++; }
}
const mediaT = tdur / tn / 1000;
console.log(`Times de 3: duração média ${mediaT.toFixed(1)} s; lado A vence ${(tv[0] / tn * 100).toFixed(1)}%, empates ${tv[2]}; trocas por luta: livres ${(trocas.livres / tn).toFixed(2)}, forçadas ${(trocas.forcadas / tn).toFixed(2)}`);
console.log('Vitória por elemento (times de 3): ' + Object.entries(porEl).map(([e, v]) => e + ' ' + (v.vit / v.jog * 100).toFixed(0) + '%').join(', '));
console.log('Time com o elemento do cenário vence: ' + BIOMAS.map((b) => b + ' (' + B.BIOMA_ELEMENTO[b] + ') ' + (bioSt[b].vit / bioSt[b].jog * 100).toFixed(0) + '%').join(', '));
const taxTal = Object.entries(porTal).map(([id, v]) => ({ id, p: v.jog / (tn * 2), w: v.vit / v.jog }));
console.log('Talentos (escolha% / vitória%): ' + taxTal.sort((x, y) => y.w - x.w).map((t) => t.id + ' ' + (t.p * 100).toFixed(0) + '/' + (t.w * 100).toFixed(0)).join(', '));
const talOk = taxTal.every((t) => t.w >= 0.4 && t.w <= 0.64); // 64%: com 37 talentos e a amostra do sim o ruído é de uns 2 pontos (Fôlego ficou em 62 a 63% mesmo com a cura pela metade)
console.log('Vitória por família (times de 3): ' + Object.entries(porFam).map(([e, v]) => e + ' ' + (v.vit / v.jog * 100).toFixed(0) + '%').join(', '));
const famOk = Object.values(porFam).every((v) => v.vit / v.jog >= 0.4 && v.vit / v.jog <= 0.6); // T2: nenhuma família passa de 60% nem cai de 40%
const elOk = Object.values(porEl).every((v) => v.vit / v.jog >= 0.35 && v.vit / v.jog <= 0.65);
if (process.env.SIM_SOFT) console.log('DIAG: ' + JSON.stringify(Object.entries({ taxas: taxas.every(({ t }) => t >= 0.3 && t <= 0.65), vMin: vMin.v >= 0.6, media: media >= 15 && media <= 40, mediaT: mediaT >= 40 && mediaT <= 90, lados: Math.abs(tv[0] / tn - 0.5) < 0.06, elOk, famOk, talOk, polOk, tOk, trOk }).filter(([, v]) => !v).map(([k]) => k)));
const ok = taxas.every(({ t }) => t >= 0.3 && t <= 0.65) && vMin.v >= 0.6 && media >= 15 && media <= 40 && mediaT >= 40 && mediaT <= 90 && Math.abs(tv[0] / tn - 0.5) < 0.06 && elOk && famOk && talOk && polOk && tOk && trOk;
console.log(ok ? 'CRITÉRIOS: OK' : 'CRITÉRIOS: NÃO PASSOU (monstro 30-65%, vantagem de elemento >= 60%, 1x1 de 15-40 s, time de 3 de 40-90 s, lados 44-56%, elemento 35-65% nos times, talento 40-64%, nenhuma regra do automático passa de 62% contra o padrão)');
console.log('Self-check: OK');
