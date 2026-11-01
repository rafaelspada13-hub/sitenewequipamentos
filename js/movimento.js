// Camada de movimento com a biblioteca Motion (js/vendor/motion-14.3.0.min.js).
// Poucos gestos, todos com função:
// 1. Abertura: título sobe por trás de uma máscara, o texto chega em seguida e as etiquetas
//    técnicas se desenham da peça até o nome (o gesto da marca).
// 2. Títulos de seção sobem palavra a palavra; produtos aparecem em cascata curta; os demais
//    blocos só ganham opacidade. Listas de dados (clientes, regiões, contato) ficam paradas.
// 3. O simulador desenha a curva P×T ao entrar e marca a troca de status; o configurador
//    troca a foto com um cruzamento curto e acende o resumo.
// Durações: 120, 240, 400 e 700 ms; duas curvas; sem ultrapassagem.
// Sem a biblioteca, ou com movimento reduzido, tudo fica visível e parado.
(function () {
  var M = window.Motion;
  var root = document.documentElement;
  if (!M || !root.classList.contains('motion-on')) return;
  window.__movimentoReady = true;

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var SAIDA = [0.2, 0.7, 0.2, 1];      // entradas
  var TROCA = [0.45, 0, 0.2, 1];       // trocas de estado

  // Quebra um título em palavras mascaradas (usado na abertura e nas seções).
  var mascarar = function (h) {
    var palavras = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    palavras.forEach(function (p, i) {
      var caixa = document.createElement('span');
      caixa.className = 'm-palavra';
      var dentro = document.createElement('span');
      dentro.textContent = p;
      caixa.appendChild(dentro);
      h.appendChild(caixa);
      if (i < palavras.length - 1) h.appendChild(document.createTextNode(' '));
    });
    return $$('.m-palavra > span', h);
  };
  // Palavras da mesma linha sobem juntas; cada linha 110 ms depois da anterior.
  var subirLinhas = function (internos, atrasoBase, duracao) {
    var topos = internos.map(function (s) { return s.parentNode.offsetTop; });
    var linhas = topos.filter(function (t, i) { return topos.indexOf(t) === i; });
    internos.forEach(function (s, i) {
      M.animate(s, { y: ['110%', '0%'] }, { duration: duracao, delay: atrasoBase + linhas.indexOf(topos[i]) * 0.11, ease: SAIDA });
    });
  };

  /* ---------- 1. Abertura ---------- */
  var titulo = document.querySelector('.hero-title');
  var copia = $$('.hero-lead, .hero-fact, .hero-actions, .hero-spec');
  var anots = $$('.anot');
  var rotulos = $$('.anot-rotulo');

  if (reduz) {
    root.classList.add('motion-pronto');
  } else {
    var internosTitulo = titulo ? mascarar(titulo) : [];
    copia.forEach(function (el) { el.style.opacity = '0'; });
    // Começa quando a fonte do título chegou (no máximo 600 ms): nada pula no meio da entrada.
    var fonte = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var teto = new Promise(function (ok) { setTimeout(ok, 600); });
    Promise.race([fonte, teto]).then(function () {
      root.classList.add('abertura-viva');
      subirLinhas(internosTitulo, 0, 0.6);
      M.animate(copia, { opacity: [0, 1], y: [12, 0] }, { duration: 0.4, ease: SAIDA, delay: M.stagger(0.06, { startDelay: 0.2 }) });
      anots.forEach(function (g, i) {
        var atraso = 0.7 + i * 0.18;
        M.animate(g.querySelector('circle'), { scale: [0.4, 1], opacity: [0, 1] }, { duration: 0.24, delay: atraso, ease: SAIDA });
        M.animate(g.querySelector('path'), { strokeDashoffset: [1, 0] }, { duration: 0.4, delay: atraso + 0.08, ease: SAIDA });
        var r = rotulos[i];
        if (r) M.animate(Array.prototype.slice.call(r.children), { opacity: [0, 1], x: [-8, 0] }, { duration: 0.24, delay: M.stagger(0.06, { startDelay: atraso + 0.3 }), ease: SAIDA });
      });
      // trava: ao fim da sequência tudo fica no estado final, aconteça o que acontecer
      setTimeout(function () {
        root.classList.add('motion-pronto');
        copia.forEach(function (el) { el.style.opacity = ''; });
      }, (0.7 + anots.length * 0.18 + 0.8) * 1000);
    });
  }

  /* ---------- 2. Entradas ---------- */
  // Blocos dentro de seções recolhidas (<details>) não entram animados: ficariam presos ao abrir.
  $$('details .reveal').forEach(function (el) { el.classList.remove('reveal'); });

  $$('.section-title').forEach(function (h) {
    if (h.closest('#inicio')) return;
    h.classList.remove('reveal');
    var internos = mascarar(h);
    if (reduz) return;
    M.inView(h, function () { subirLinhas(internos, 0, 0.7); }, { amount: 0.6 });
  });

  // Só a grade de produtos entra em cascata, e só com opacidade (40 ms entre cartões).
  $$('.produtos-grid').forEach(function (lista) {
    var itens = Array.prototype.slice.call(lista.children);
    itens.forEach(function (el) { el.classList.remove('reveal'); });
    if (reduz) return;
    M.inView(lista, function () {
      M.animate(itens, { opacity: [0, 1] }, { duration: 0.4, ease: SAIDA, delay: M.stagger(0.04) });
    }, { amount: 0.1 });
  });
  // Listas de dados aparecem paradas, junto com o bloco em que estão.
  $$('.clients-grid, .segments-list, .etapas, .gallery-grid, .contato-card, .regioes').forEach(function (lista) {
    Array.prototype.forEach.call(lista.children, function (el) { el.classList.remove('reveal'); });
  });

  // Demais blocos: só opacidade, uma vez, ao entrar na tela.
  // Blocos mais altos que meia tela (etapas + logística no celular) ficam parados: um fade
  // num bloco desse tamanho parece um buraco para quem rola rápido.
  $$('.reveal').forEach(function (el) {
    if (el.offsetHeight > window.innerHeight * 0.5) { el.classList.remove('reveal'); return; }
    if (reduz) return;
    M.inView(el, function () {
      M.animate(el, { opacity: [0, 1] }, { duration: 0.4, ease: SAIDA });
    }, { amount: 0.2 });
  });

  if (reduz) return;

  /* ---------- 3. Peças interativas ---------- */
  // Simulador: as curvas P×T se desenham ao entrar; um anel marca cada troca de status.
  var sim = document.getElementById('simulador');
  if (sim) {
    var curvas = $$('.pt-line', sim);
    curvas.forEach(function (c) { c.setAttribute('pathLength', '1'); c.style.strokeDasharray = '1'; c.style.strokeDashoffset = '1'; });
    M.inView(sim.querySelector('.sim-chart') || sim, function () {
      M.animate(curvas, { strokeDashoffset: [1, 0] }, { duration: 0.7, ease: SAIDA, delay: M.stagger(0.12) });
    }, { amount: 0.4 });
    var ponto = document.getElementById('sim-ponto');
    var status = document.getElementById('sim-status');
    sim.addEventListener('sim:status', function () {
      if (status) M.animate(status, { opacity: [0.35, 1], y: [6, 0] }, { duration: 0.24, ease: TROCA });
      if (ponto) M.animate(ponto, { r: [9, 16, 9] }, { duration: 0.4, ease: TROCA });
    });
  }

  // Configurador: a foto troca com um cruzamento curto; o resumo acende e apaga.
  var cfg = document.getElementById('configurador');
  if (cfg) {
    var foto = document.getElementById('cfg-img');
    var resumo = document.getElementById('cfg-resumo');
    var ultimaFoto = foto ? foto.getAttribute('src') : '';
    cfg.addEventListener('cfg:mudou', function () {
      if (foto && foto.getAttribute('src') !== ultimaFoto) {
        ultimaFoto = foto.getAttribute('src');
        M.animate(foto, { opacity: [0, 1] }, { duration: 0.24, ease: TROCA });
      }
      if (resumo) M.animate(resumo, { backgroundColor: ['rgba(74, 196, 128, 0.16)', 'rgba(74, 196, 128, 0)'] }, { duration: 0.6, ease: TROCA });
    });
  }

  // Botões: afundam um pouco ao pressionar e voltam sem quicar.
  var apertar = function (alvo) {
    return function () {
      M.animate(alvo, { scale: 0.97 }, { duration: 0.08 });
      return function () { M.animate(alvo, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 30 }); };
    };
  };
  $$('.btn, .nav-cta').forEach(function (b) { M.press(b, apertar(b)); });
})();
