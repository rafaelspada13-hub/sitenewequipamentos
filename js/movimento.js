// Camada de movimento com a biblioteca Motion (js/vendor/motion-14.3.0.min.js).
// 1. Abertura: a válvula entra, a luz de estúdio passa e as etiquetas técnicas aparecem.
// 2. Entradas: títulos sobem linha a linha; listas entram em cascata curta; números contam.
// 3. Microinterações: cartões de produto inclinam com o mouse; botões e chips reagem ao toque.
// Sem a biblioteca, o site fica como está: todo o conteúdo visível e parado.
(function () {
  var M = window.Motion;
  var root = document.documentElement;
  if (!M || !root.classList.contains('motion-on')) return;
  window.__movimentoReady = true;

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var SAIDA = [0.2, 0.7, 0.2, 1];
  var mola = { type: 'spring', stiffness: 420, damping: 26 };

  /* ---------- 1. Abertura ---------- */
  var palco = document.querySelector('.hero-palco picture');
  var luz = document.querySelector('.hero-luz');
  var anots = $$('.anot');
  var rotulos = $$('.anot-rotulo');

  if (reduz) {
    root.classList.add('motion-pronto');
  } else {
    if (palco) M.animate(palco, { scale: [1.03, 1], filter: ['brightness(0.92)', 'brightness(1)'] }, { duration: 1.1, ease: SAIDA });
    if (luz) {
      M.animate(luz, { opacity: [0, 1, 1, 0], backgroundPosition: ['160% 0', '-60% 0'] },
        { duration: 1.7, delay: 0.5, ease: 'easeInOut' });
    }
    anots.forEach(function (g, i) {
      var atraso = 1.2 + i * 0.32;
      M.animate(g.querySelector('circle'), { scale: [0, 1] }, Object.assign({ delay: atraso }, mola));
      M.animate(g.querySelector('path'), { strokeDashoffset: [1, 0] }, { duration: 0.6, delay: atraso + 0.08, ease: SAIDA });
      var r = rotulos[i];
      if (r) M.animate(Array.prototype.slice.call(r.children), { opacity: [0, 1], x: [-12, 0] }, { duration: 0.5, delay: M.stagger(0.07, { startDelay: atraso + 0.35 }), ease: SAIDA });
    });
    // trava: ao fim da sequência tudo fica no estado final, aconteça o que acontecer
    window.setTimeout(function () { root.classList.add('motion-pronto'); }, (1.2 + anots.length * 0.32 + 1.2) * 1000);
  }

  /* ---------- 2. Entradas ---------- */
  // Blocos dentro de seções recolhidas (<details>) não entram animados: ficariam presos ao abrir.
  $$('details .reveal').forEach(function (el) { el.classList.remove('reveal'); });
  // Títulos: cada palavra sobe de trás de uma máscara; palavras da mesma linha juntas.
  $$('.section-title').forEach(function (h) {
    if (h.closest('#inicio')) return;
    h.classList.remove('reveal');
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
    if (reduz) return;
    var internos = $$('.m-palavra > span', h);
    M.inView(h, function () {
      var topos = internos.map(function (s) { return s.parentNode.offsetTop; });
      var linhas = topos.filter(function (t, i) { return topos.indexOf(t) === i; });
      internos.forEach(function (s, i) {
        M.animate(s, { y: ['110%', '0%'] }, { duration: 0.7, delay: linhas.indexOf(topos[i]) * 0.11, ease: SAIDA });
      });
    }, { amount: 0.6 });
  });

  // Listas: os itens entram em cascata curta (atraso total limitado a 0,5 s).
  var LISTAS = ['.produtos-grid', '.clients-grid', '.segments-list', '.etapas', '.gallery-grid', '.contato-card', '.regioes'];
  $$(LISTAS.join(',')).forEach(function (lista) {
    var itens = Array.prototype.slice.call(lista.children);
    itens.forEach(function (el) { el.classList.remove('reveal'); });
    if (reduz) return;
    M.inView(lista, function () {
      M.animate(itens, { opacity: [0, 1], y: [24, 0] },
        { duration: 0.55, ease: SAIDA, delay: M.stagger(Math.min(0.07, 0.5 / itens.length)) });
    }, { amount: 0.15 });
  });

  // Demais blocos: sobem e aparecem uma vez ao entrar na tela.
  $$('.reveal').forEach(function (el) {
    if (reduz) return;
    M.inView(el, function () {
      M.animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, ease: SAIDA });
    }, { amount: 0.2 });
  });

  // Números: contam até o valor real com desaceleração no fim.
  $$('.stat-num[data-count]').forEach(function (el) {
    var alvo = Number(el.dataset.count);
    var escrever = function (v) {
      el.textContent = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (el.dataset.suffix || '');
    };
    if (reduz) return escrever(alvo);
    escrever(0);
    M.inView(el, function () {
      M.animate(0, alvo, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: escrever });
    }, { amount: 0.6 });
  });

  /* ---------- 3. Microinterações ---------- */
  if (reduz) return;

  // Cartões de produto: inclinação 3D leve seguindo o mouse (só com mouse de verdade).
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.produto').forEach(function (card) {
      var quadro = 0;
      card.addEventListener('pointermove', function (e) {
        if (quadro) return;
        quadro = window.requestAnimationFrame(function () {
          quadro = 0;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          M.animate(card, { rotateY: px * 8, rotateX: -py * 8 }, { type: 'spring', stiffness: 260, damping: 22 });
        });
      });
      card.addEventListener('pointerleave', function () {
        M.animate(card, { rotateY: 0, rotateX: 0 }, { type: 'spring', stiffness: 200, damping: 18 });
      });
    });
  }

  // Botões e chips: afundam ao pressionar e voltam com mola.
  var apertar = function (alvo) {
    return function () {
      M.animate(alvo, { scale: 0.95 }, { duration: 0.1 });
      return function () { M.animate(alvo, { scale: 1 }, { type: 'spring', stiffness: 700, damping: 14 }); };
    };
  };
  $$('.btn, .nav-cta, .nav-whatsapp, .whatsapp-float').forEach(function (b) { M.press(b, apertar(b)); });
  $$('.chip').forEach(function (c) { M.press(c, apertar(c.querySelector('span'))); });
})();
