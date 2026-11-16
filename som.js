// Efeitos sonoros, ambiência e música gerados em código (WebAudio). Sem arquivos, sem licença a registrar.
// shortcut: sons sintetizados são provisórios; trocar por gravações reais licenciadas (docs/creditos.md) se o jogo seguir.
// Imersão: cada som sai por um canal com pan (a posição na arena) e envio de reverb; tudo passa por um compressor mestre.
(function () {
  let ctx = null, mudo = false;
  try { mudo = localStorage.getItem('pixmon-mudo') === '1'; } catch (e) { /* sem armazenamento: segue sem lembrar */ }

  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ---------- cadeia mestre (uma por contexto): compressor + reverb sintética ----------
  const mestres = new WeakMap(), ruidos = new WeakMap();
  function mestre(c) {
    let m = mestres.get(c);
    if (m) return m;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.12;
    const saida = c.createGain(); saida.gain.value = 0.9; comp.connect(saida); saida.connect(c.destination);
    const n = Math.floor(c.sampleRate * 1.4), ir = c.createBuffer(2, n, c.sampleRate); // reverb: ruído com decaimento
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    const conv = c.createConvolver(); conv.buffer = ir;
    const molhado = c.createGain(); molhado.gain.value = 0.35; conv.connect(molhado); molhado.connect(comp);
    m = { dry: comp, rev: conv };
    mestres.set(c, m);
    return m;
  }
  function ruidoBuf(c) {
    let b = ruidos.get(c);
    if (!b) { const n = Math.floor(c.sampleRate * 2); b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; ruidos.set(c, b); }
    return b;
  }
  // entrada de um som: pan (-1 esquerda, 1 direita) e quanto vai para o reverb
  function canal(c, pan = 0, rev = 0.2) {
    const m = mestre(c), g = c.createGain();
    let ult = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); ult = p; }
    ult.connect(m.dry);
    if (rev > 0) { const s = c.createGain(); s.gain.value = rev; ult.connect(s); s.connect(m.rev); }
    return g;
  }

  // ---------- blocos de som (d = canal de destino; q = atraso em segundos) ----------
  function env(g, t, ata, dur, vol) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ata);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tom(c, d, tipo, f0, f1, dur, vol, q = 0, ata = 0.005) {
    const t = c.currentTime + q, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    env(g, t, ata, dur, vol); o.connect(g).connect(d); o.start(t); o.stop(t + dur + 0.02);
  }
  function sopro(c, d, filtro, f0, f1, dur, vol, q = 0, Q = 1, ata = 0.005) {
    const t = c.currentTime + q, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = ruidoBuf(c); s.loop = true;
    f.type = filtro; f.Q.value = Q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, ata, dur, vol); s.connect(f).connect(g).connect(d); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function fm(c, d, fc, razao, indice, dur, vol, q = 0) { // modulação de frequência: som metálico e elétrico
    const t = c.currentTime + q, p = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    p.frequency.setValueAtTime(fc, t); p.frequency.exponentialRampToValueAtTime(Math.max(20, fc * 0.4), t + dur);
    m.frequency.value = fc * razao; mg.gain.setValueAtTime(fc * indice, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
    m.connect(mg).connect(p.frequency); env(g, t, 0.004, dur, vol); p.connect(g).connect(d);
    p.start(t); m.start(t); p.stop(t + dur + 0.02); m.stop(t + dur + 0.02);
  }
  const alea = (a, b) => a + Math.random() * (b - a);

  // ---------- efeitos ----------
  const SONS = {
    toque: (c) => tom(c, canal(c, 0, 0.05), 'square', 520, 520, 0.08, 0.5),
    janela: (c) => { const d = canal(c, 0, 0.3); [660, 880, 1320].forEach((f, i) => tom(c, d, 'triangle', f, f, 0.2, 0.25, i * 0.07)); },

    // carga do especial: sobe por 0,3 s, com a cor do elemento
    carga: (c, tipo, pan = 0) => {
      const d = canal(c, pan, 0.25);
      if (tipo === 'fogo') { sopro(c, d, 'bandpass', 300, 2400, 0.34, 0.5, 0, 2); for (let i = 0; i < 5; i++) sopro(c, d, 'highpass', 3000, 3200, 0.03, 0.35, alea(0, 0.3)); }
      else if (tipo === 'agua') { sopro(c, d, 'bandpass', 800, 2800, 0.32, 0.6, 0, 1.5); for (let i = 0; i < 5; i++) { const f = alea(300, 800); tom(c, d, 'sine', f, f * 2.6, 0.1, 0.6, i * 0.065); } }
      else if (tipo === 'terra') { tom(c, d, 'sine', 45, 95, 0.36, 0.7); sopro(c, d, 'lowpass', 250, 700, 0.36, 0.5); }
      else if (tipo === 'ar') sopro(c, d, 'bandpass', 400, 3200, 0.3, 1.3, 0, 2.5);
      else { tom(c, d, 'sawtooth', 180, 1300, 0.34, 0.3); fm(c, d, 700, 2.01, 3, 0.34, 0.25); for (let i = 0; i < 8; i++) sopro(c, d, 'highpass', 5000, 8000, 0.02, 0.8, alea(0, 0.32)); }
    },
    // Cada elemento tem a sua assinatura sonora, bem diferente das outras, nas três fases do golpe:
    //   fogo = chama que estala (ruído grave que incha + estalinhos) | água = bolhas e respingo (tons que sobem, "blub")
    //   terra = ronco grave e rocha que racha | ar = assobio de vento que varre | eletricidade = zumbido metálico e faíscas
    // saída do ataque (investida do básico e do forte)
    lance: (c, tipo, pan = 0) => {
      const d = canal(c, pan, 0.15);
      if (tipo === 'fogo') { sopro(c, d, 'lowpass', 700, 2200, 0.28, 0.9, 0, 0.8); for (let i = 0; i < 7; i++) sopro(c, d, 'highpass', alea(2500, 4500), 3500, 0.02, 0.5, alea(0, 0.25)); }
      else if (tipo === 'agua') { sopro(c, d, 'bandpass', 1800, 3500, 0.2, 0.9, 0, 1.5); tom(c, d, 'sine', 180, 520, 0.16, 0.7); for (let i = 0; i < 5; i++) { const f = alea(500, 1100); tom(c, d, 'sine', f, f * 2.8, 0.1, 0.65, 0.03 + i * 0.045); } }
      else if (tipo === 'terra') { tom(c, d, 'sine', 120, 45, 0.3, 0.9); sopro(c, d, 'lowpass', 400, 120, 0.3, 0.8); }
      else if (tipo === 'ar') { sopro(c, d, 'bandpass', 600, 4200, 0.3, 5, 0, 3); tom(c, d, 'sine', 900, 2400, 0.3, 0.12); }
      else { fm(c, d, 1300, 2.01, 4, 0.3, 0.6); tom(c, d, 'sawtooth', 110, 110, 0.28, 0.35); sopro(c, d, 'highpass', 4500, 9000, 0.06, 1.0); for (let i = 0; i < 7; i++) sopro(c, d, 'highpass', 5500, 9000, 0.02, 0.8, i * 0.04); }
    },
    // projétil em voo
    projetil: (c, tipo, pan = 0) => {
      const d = canal(c, pan, 0.2);
      if (tipo === 'fogo') { sopro(c, d, 'lowpass', 1500, 400, 0.4, 0.9, 0, 0.8); for (let i = 0; i < 8; i++) sopro(c, d, 'highpass', alea(2500, 4500), 3500, 0.02, 0.4, alea(0, 0.36)); }
      else if (tipo === 'agua') { sopro(c, d, 'bandpass', 2200, 1200, 0.4, 0.8, 0, 1.5); tom(c, d, 'sine', 300, 700, 0.35, 0.35); for (let i = 0; i < 8; i++) { const f = alea(600, 1400); tom(c, d, 'sine', f, f * 2.4, 0.08, 0.6, i * 0.045); } }
      else if (tipo === 'terra') { tom(c, d, 'sine', 70, 45, 0.4, 0.9); sopro(c, d, 'lowpass', 500, 150, 0.4, 0.7); for (let i = 0; i < 4; i++) sopro(c, d, 'bandpass', alea(600, 1500), 500, 0.03, 0.5, i * 0.09, 3); }
      else if (tipo === 'ar') { sopro(c, d, 'bandpass', 3800, 800, 0.4, 4.5, 0, 3); tom(c, d, 'sine', 2600, 700, 0.4, 0.1); }
      else { fm(c, d, 1000, 2.01, 4, 0.4, 0.55); tom(c, d, 'sawtooth', 120, 120, 0.4, 0.3); sopro(c, d, 'highpass', 4500, 8000, 0.4, 0.6); for (let i = 0; i < 8; i++) tom(c, d, 'square', alea(1800, 4200), 400, 0.02, 0.35, i * 0.05); }
    },
    // impacto: um corpo grave curto (menor, igual para todos) e, por cima, a assinatura do elemento (maior)
    golpe: (c, tipo, dano = 6, idx = 0, pan = 0) => {
      const forca = Math.min(1, dano / 12), d = canal(c, pan, 0.2 + 0.1 * idx), v = 0.55 + 0.35 * forca, corpo = tipo === 'terra' ? 1 : 0.5;
      tom(c, d, 'sine', 170, 42, 0.2 + 0.1 * idx, v * corpo);
      sopro(c, d, 'highpass', 3000, 5000, 0.04, v * 0.4 * corpo);
      if (idx === 2) tom(c, d, 'sine', 70, 28, 0.5, v * 0.9);
      const L = 1 + 0.5 * idx; // o forte e o ultimate duram mais
      if (tipo === 'fogo') { sopro(c, d, 'lowpass', 2200, 250, 0.45 * L, v * 1.1, 0, 0.7); for (let i = 0; i < 9; i++) sopro(c, d, 'highpass', alea(2500, 4500), 3500, 0.025, v * 0.5, 0.04 + alea(0, 0.4 * L)); }
      else if (tipo === 'agua') { sopro(c, d, 'bandpass', 2400, 600, 0.4 * L, v * 1.6, 0, 1.2); sopro(c, d, 'highpass', 4500, 8000, 0.12 * L, v * 0.8); tom(c, d, 'sine', 220, 90, 0.3 * L, v * 0.9); for (let i = 0; i < 10; i++) { const f = alea(700, 2200); tom(c, d, 'sine', f, f * 2, 0.07, v * 0.7, 0.03 + alea(0, 0.35 * L)); } }
      else if (tipo === 'terra') { tom(c, d, 'sine', 80, 30, 0.5 * L, v); sopro(c, d, 'lowpass', 900, 150, 0.4 * L, v * 0.9); for (let i = 0; i < 7; i++) sopro(c, d, 'bandpass', alea(700, 2400), 600, 0.035, v * 0.6, 0.05 + alea(0, 0.35 * L), 4); }
      else if (tipo === 'ar') { sopro(c, d, 'bandpass', 5000, 900, 0.3 * L, v * 3.5, 0, 3); tom(c, d, 'sine', 2600, 800, 0.22 * L, v * 0.3); }
      else { fm(c, d, 2800, 1.41, 5, 0.3 * L, v * 1.1); tom(c, d, 'sawtooth', 100, 60, 0.3 * L, v * 0.5); sopro(c, d, 'highpass', 4000, 8500, 0.2 * L, v * 1.4); sopro(c, d, 'bandpass', 6000, 3000, 0.1, v * 1.5, 0, 2); for (let i = 0; i < 9; i++) tom(c, d, 'square', alea(1500, 4000), 300, 0.025, v * 0.4, 0.03 + i * 0.04 * L); }
    },
    // crítico: estalo seco, soco grave, anel metálico e um brilho subindo
    critico: (c, pan = 0) => {
      const d = canal(c, pan, 0.35);
      sopro(c, d, 'highpass', 5000, 9000, 0.07, 0.9);
      tom(c, d, 'sine', 120, 30, 0.35, 0.9);
      fm(c, d, 1500, 1.4, 2.5, 0.55, 0.3, 0.02);
      [880, 1175, 1568, 2093].forEach((f, i) => tom(c, d, 'triangle', f, f, 0.25, 0.22, 0.05 + i * 0.05));
    },
    // esquiva: chiado rápido de quem desvia e um "tim" curto
    esquiva: (c, pan = 0) => {
      const d = canal(c, pan, 0.2);
      sopro(c, d, 'bandpass', 3500, 900, 0.22, 0.8, 0, 2);
      tom(c, d, 'sine', 1900, 1500, 0.18, 0.18, 0.08);
    },
    super: (c, pan = 0) => { const d = canal(c, pan, 0.3); [880, 1320, 1760].forEach((f, i) => tom(c, d, 'triangle', f, f, 0.18, 0.28, i * 0.07)); }, // vantagem de elemento
    fraco: (c, pan = 0) => { const d = canal(c, pan, 0.1); tom(c, d, 'sine', 130, 70, 0.18, 0.45); sopro(c, d, 'lowpass', 500, 200, 0.14, 0.35); }, // desvantagem: baque abafado
    // defesa: o escudo sobe com um brilho que sobe de tom
    defesa: (c, pan = 0) => {
      const d = canal(c, pan, 0.4);
      [520, 780, 1040].forEach((f, i) => tom(c, d, 'triangle', f, f * 1.02, 0.28, 0.2, i * 0.06));
      sopro(c, d, 'bandpass', 800, 2400, 0.25, 0.25);
    },
    // bloqueio: o escudo segura o golpe e se parte (pancada metálica e estilhaços)
    bloqueio: (c, pan = 0) => {
      const d = canal(c, pan, 0.35);
      tom(c, d, 'sine', 220, 60, 0.18, 0.7); fm(c, d, 1800, 3.5, 3, 0.35, 0.3); sopro(c, d, 'highpass', 4500, 8000, 0.1, 0.5);
      for (let i = 0; i < 4; i++) tom(c, d, 'sine', alea(1500, 3200), alea(800, 1500), 0.12, 0.12, 0.05 + i * 0.05);
    },
    // ultimate: um rugido grave sobe durante a carga e abre um acorde no fim
    ultimate: (c, pan = 0) => {
      const d = canal(c, pan, 0.5);
      tom(c, d, 'sawtooth', 60, 220, 1.0, 0.28); tom(c, d, 'sine', 45, 110, 1.0, 0.6); sopro(c, d, 'bandpass', 200, 2600, 1.0, 0.5, 0, 2);
      [392, 523, 659].forEach((f, i) => tom(c, d, 'triangle', f, f * 1.5, 0.5, 0.15, 0.5 + i * 0.05));
    },
    // ultimate soltando: queda de sub-grave, estouro de prato que incha e um acorde aberto em oitavas (só o ultimate tem isto)
    ultimateImpacto: (c, pan = 0) => {
      const d = canal(c, pan, 0.55);
      tom(c, d, 'sine', 95, 22, 1.1, 1.0); tom(c, d, 'sawtooth', 220, 40, 0.5, 0.3);
      sopro(c, d, 'highpass', 2500, 9000, 0.9, 0.55, 0, 0.7, 0.12);
      [261.6, 392, 523.3, 784, 1046.5].forEach((f, i) => { tom(c, d, 'triangle', f, f, 0.9, 0.2, 0.02 + i * 0.02); tom(c, d, 'sine', f * 2, f * 2, 0.6, 0.08, 0.02 + i * 0.02); });
    },
    // o ultimate ficou pronto: "bi-bip" agudo
    pronto: (c) => { const d = canal(c, 0, 0.15); tom(c, d, 'square', 1320, 1320, 0.09, 0.28); tom(c, d, 'square', 1760, 1760, 0.14, 0.28, 0.12); tom(c, d, 'sine', 2640, 2640, 0.14, 0.12, 0.12); },
    ko: (c, pan = 0) => {
      const d = canal(c, pan, 0.5);
      tom(c, d, 'sawtooth', 420, 50, 0.7, 0.28); tom(c, d, 'sine', 110, 26, 1.0, 0.8, 0.04);
      sopro(c, d, 'lowpass', 1200, 90, 0.9, 0.7); sopro(c, d, 'highpass', 5000, 8000, 0.06, 0.8);
      [0.25, 0.4, 0.55].forEach((q) => tom(c, d, 'sine', 70, 40, 0.14, 0.4, q));
    },
    status: (c, nome, pan = 0) => { // um som para cada status que pega
      const d = canal(c, pan, 0.3);
      if (nome === 'veneno') { [0, 0.07, 0.14].forEach((q, i) => tom(c, d, 'sine', 300 + i * 90, 600 + i * 120, 0.12, 0.2, q)); }
      else if (nome === 'lento') { tom(c, d, 'sawtooth', 420, 110, 0.55, 0.16); tom(c, d, 'sine', 200, 70, 0.55, 0.2); }
      else if (nome === 'paralisia') { for (let i = 0; i < 6; i++) tom(c, d, 'square', 160 + (i % 2) * 90, 120, 0.05, 0.16, i * 0.045); sopro(c, d, 'highpass', 3000, 6000, 0.3, 0.2); }
      else { tom(c, d, 'triangle', 880, 330, 0.22, 0.28); [0.08, 0.16].forEach((q) => tom(c, d, 'sine', 1320, 1320, 0.1, 0.12, q)); }
    },
    dot: (c, pan = 0) => { const d = canal(c, pan, 0.2); tom(c, d, 'sine', 260, 520, 0.09, 0.14); },
    quebra: (c, pan = 0) => { const d = canal(c, pan, 0.2); tom(c, d, 'square', 220, 70, 0.09, 0.2); sopro(c, d, 'bandpass', 1400, 500, 0.18, 0.3); [0.05, 0.1, 0.16].forEach((q) => tom(c, d, 'triangle', 500 - q * 800, 200, 0.05, 0.1, q)); },
    nocaute: (c, pan = 0) => { const d = canal(c, pan, 0.4); tom(c, d, 'sawtooth', 380, 60, 0.45, 0.22); tom(c, d, 'sine', 100, 30, 0.6, 0.6); sopro(c, d, 'lowpass', 1000, 100, 0.5, 0.5); },
    troca: (c, pan = 0) => { const d = canal(c, pan, 0.3); sopro(c, d, 'bandpass', 500, 3000, 0.28, 1.0, 0, 1.5); tom(c, d, 'sine', 500, 1000, 0.14, 0.4, 0.15); tom(c, d, 'triangle', 800, 1200, 0.12, 0.25, 0.2); },
    cura: (c, pan = 0) => { const d = canal(c, pan, 0.4); [523, 659, 784, 1047].forEach((f, i) => tom(c, d, 'sine', f, f, 0.2, 0.22, i * 0.06)); },
    vitoria: (c) => { const d = canal(c, 0, 0.4); [[523, 659, 784], [587, 740, 880], [659, 784, 1047], [784, 988, 1319]].forEach((acorde, i) => acorde.forEach((f) => tom(c, d, 'triangle', f, f, 0.45, 0.17, i * 0.14))); tom(c, d, 'sine', 130, 130, 0.9, 0.3, 0.4); },
    derrota: (c) => { const d = canal(c, 0, 0.45); [392, 330, 262].forEach((f, i) => { tom(c, d, 'triangle', f, f, 0.4, 0.3, i * 0.2); tom(c, d, 'sine', f / 2, f / 2, 0.4, 0.25, i * 0.2); }); },
  };

  // ---------- música: loop de 4 compassos em lá menor, 120 bpm; camadas que crescem com a tensão da luta ----------
  // nivel 0: baixo + arpejo (a partir do 2º compasso); 1: + bumbo; 2: + chimbal e caixa; 3: + camada grave extra
  let nivel = 0;
  const BAIXOS = [110, 87.31, 98, 82.41];
  const ARPEJO = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 440, 392];
  function notas(c, g, passoIni, n, quando) {
    for (let i = 0; i < n; i++) {
      const p = passoIni + i, q = p % 8, t = quando + i * 0.25;
      if (q % 4 === 0) tom(c, g, 'triangle', BAIXOS[Math.floor(p / 8) % 4], BAIXOS[Math.floor(p / 8) % 4], 0.45, 0.6, t);
      if (p >= 8) tom(c, g, 'square', ARPEJO[q], ARPEJO[q], 0.2, 0.25, t);
      if (nivel >= 1 && q % 4 === 0) tom(c, g, 'sine', 150, 45, 0.14, 0.9, t);
      if (nivel >= 2) { sopro(c, g, 'highpass', 7000, 8000, 0.04, 0.25, t); if (q === 4) sopro(c, g, 'bandpass', 1800, 1500, 0.12, 0.6, t); }
      if (nivel >= 3 && q % 2 === 0) tom(c, g, 'sawtooth', ARPEJO[q] / 2, ARPEJO[q] / 2, 0.15, 0.12, t);
    }
  }
  // 0,15: a música toca o tempo todo, então fica bem abaixo dos efeitos
  function busMusica(c) { const g = canal(c, 0, 0.1); g.gain.value = 0.15; return g; }
  SONS.musica = (c) => notas(c, busMusica(c), 0, 36, 0); // só para medir offline

  // Trilhas de arquivo (audio/): "batalha" durante a luta, "tema" na tela de escolha. Uma toca por vez, em loop, com fade.
  const ARQ = { batalha: ['audio/battle-theme.mp3', 0.45], tema: ['audio/pixelandia-tema.mp3', 0.4] };
  const pistas = {};
  let querida = null; // trilha que deveria estar tocando (o navegador só deixa tocar depois do primeiro toque)
  function fade(el, alvo, fim) {
    clearInterval(el._f);
    el._f = setInterval(() => {
      el.volume = Math.max(0, Math.min(1, el.volume + (alvo > el.volume ? 0.05 : -0.05)));
      if (Math.abs(el.volume - alvo) < 0.05) { el.volume = alvo; clearInterval(el._f); if (fim) fim(); }
    }, 50);
  }
  function trilha(nome) { // nome: 'batalha' | 'tema' | null (silêncio)
    querida = nome;
    for (const k in pistas) if (k !== nome && !pistas[k].paused) fade(pistas[k], 0, () => { if (querida !== k) pistas[k].pause(); });
    if (!nome) { pararAmbiente(); return; }
    if (mudo) return;
    let el = pistas[nome];
    if (!el) { el = pistas[nome] = new Audio(ARQ[nome][0]); el.loop = true; el.volume = 0; }
    if (el.paused) el.play().catch(() => { /* sem toque ainda: o próximo toque tenta de novo */ });
    fade(el, ARQ[nome][1]);
    if (nome === 'batalha' && ultimoAmb) ambiente(ultimoAmb); else pararAmbiente();
  }
  document.addEventListener('pointerdown', () => { if (querida && !mudo && (!pistas[querida] || pistas[querida].paused)) trilha(querida); }, true);
  function musica(ligar) { trilha(ligar ? 'batalha' : null); nivel = 0; }
  function tema(ligar) { trilha(ligar ? 'tema' : null); }
  function intensidade(n) { nivel = Math.max(0, Math.min(3, n)); }

  // ---------- ambiência por bioma: vento filtrado em loop + sons esporádicos (pássaros, gotas, águia) ----------
  let amb = null, ultimoAmb = null;
  function pararAmbiente() {
    if (!amb) return;
    amb.ts.forEach(clearTimeout); amb.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    const a = amb; setTimeout(() => a.nos.forEach((n) => { try { n.stop(); } catch (e) { /* já parou */ } }), 1800);
    amb = null;
  }
  function ambiente(bioma) {
    ultimoAmb = bioma;
    pararAmbiente();
    if (mudo) return;
    const c = ac();
    if (!c) return;
    const g = canal(c, 0, 0.3), nos = [];
    g.gain.value = 0.0001; g.gain.setTargetAtTime(1, c.currentTime, 0.8);
    const vento = (f, Q, vol, lfoHz) => { // ruído filtrado cuja frequência oscila devagar (rajadas, ondas)
      const s = c.createBufferSource(), fi = c.createBiquadFilter(), ga = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      s.buffer = ruidoBuf(c); s.loop = true; fi.type = 'bandpass'; fi.frequency.value = f; fi.Q.value = Q; ga.gain.value = vol;
      lfo.frequency.value = lfoHz; lg.gain.value = f * 0.35; lfo.connect(lg).connect(fi.frequency);
      s.connect(fi).connect(ga).connect(g); s.start(); lfo.start(); nos.push(s, lfo);
    };
    const pio = () => { const f = alea(2200, 3600), pan = alea(-0.8, 0.8), d = canal(c, pan, 0.3); [0, 0.09, 0.18].forEach((q, i) => tom(c, d, 'sine', f, f * (i === 1 ? 1.15 : 1.3), 0.07, 0.1, q)); };
    const gota = () => { const f = alea(600, 1000), d = canal(c, alea(-0.7, 0.7), 0.4); tom(c, d, 'sine', f, f * 2, 0.09, 0.09); };
    const aguia = () => { const d = canal(c, alea(-0.8, 0.8), 0.6); tom(c, d, 'sine', 2600, 1800, 0.45, 0.07, 0, 0.06); };
    const coruja = () => { const d = canal(c, alea(-0.8, 0.8), 0.5); [0, 0.32].forEach((q) => tom(c, d, 'sine', 330, 280, 0.25, 0.08, q, 0.04)); };
    const receita = {
      campo: { v: () => vento(500, 0.7, 0.05, 0.12), ev: [[pio, 1800, 4000]] },
      floresta: { v: () => { vento(350, 0.7, 0.07, 0.1); vento(2500, 1.5, 0.012, 0.3); }, ev: [[pio, 1500, 3000], [coruja, 7000, 6000]] },
      lago: { v: () => { vento(900, 0.5, 0.06, 0.25); vento(250, 0.8, 0.04, 0.08); }, ev: [[gota, 1200, 2500], [pio, 4000, 6000]] },
      montanha: { v: () => { vento(260, 1.2, 0.11, 0.07); vento(900, 2.5, 0.04, 0.17); }, ev: [[aguia, 6000, 6000]] },
    }[bioma] || { v: () => vento(500, 0.7, 0.05, 0.12), ev: [] };
    receita.v();
    amb = { g, nos, ts: [] };
    const a = amb;
    const agenda = (fn, base, extra) => { // cada som esporádico tem o seu próprio relógio (a.ts), parado em pararAmbiente
      a.ts.push(setTimeout(() => { if (amb !== a) return; fn(); agenda(fn, base, extra); }, base + Math.random() * extra));
    };
    receita.ev.forEach(([fn, base, extra]) => agenda(fn, base, extra));
  }

  function tocar(nome, ...args) {
    if (mudo || !SONS[nome]) return;
    const c = ac();
    if (c) SONS[nome](c, ...args);
  }

  // Mede pico e energia do efeito sem tocar (não dá para ouvir; confere que não é mudo nem estoura).
  async function medir(nome, ...args) {
    const seg = nome === 'musica' ? 9 : 2;
    const c = new OfflineAudioContext(2, 44100 * seg, 44100);
    SONS[nome](c, ...args);
    const r = await c.startRendering(), d0 = r.getChannelData(0), d1 = r.getChannelData(1);
    let pico = 0, soma = 0;
    for (let i = 0; i < d0.length; i++) { pico = Math.max(pico, Math.abs(d0[i]), Math.abs(d1[i])); soma += d0[i] * d0[i] + d1[i] * d1[i]; }
    return { pico: +pico.toFixed(3), rms: +Math.sqrt(soma / (2 * d0.length)).toFixed(4) };
  }

  function alternar() {
    mudo = !mudo;
    if (mudo) for (const k in pistas) pistas[k].pause(); else if (querida) trilha(querida);
    try { localStorage.setItem('pixmon-mudo', mudo ? '1' : '0'); } catch (e) { /* ok */ }
    return mudo;
  }

  window.PixmonSom = { tocar, musica, tema, ambiente, intensidade, medir, alternar, mudo: () => mudo };
})();
