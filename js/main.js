// NEW Válvulas — interações do site
(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.add('js');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ano no rodapé
  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // Aparecer ao rolar
  var revela = $$('.revela');
  if ('IntersectionObserver' in window && !calmo) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revela.forEach(function (el) { io.observe(el); });
  } else {
    revela.forEach(function (el) { el.classList.add('visto'); });
  }

  // Barra de progresso e letreiro andam com a rolagem
  var raiz = d.documentElement, letreiro = $('.letreiro'), marcado = false;
  function rola() {
    marcado = false;
    var max = raiz.scrollHeight - window.innerHeight;
    raiz.style.setProperty('--rolou', max > 0 ? window.scrollY / max : 0);
    if (letreiro && !calmo) letreiro.style.setProperty('--anda', window.scrollY * 0.45);
  }
  window.addEventListener('scroll', function () { if (!marcado) { marcado = true; requestAnimationFrame(rola); } }, { passive: true });
  rola();

  // Cursor que acompanha o mouse
  var cursor = $('.cursor');
  if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !calmo) {
    var cx = 0, cy = 0, tx = 0, ty = 0, rodando = false;
    var segue = function () {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3) requestAnimationFrame(segue); else rodando = false;
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!cursor.classList.contains('vivo')) { cx = tx; cy = ty; cursor.classList.add('vivo'); }
      cursor.classList.toggle('sobre', !!e.target.closest('a, button, input, .compara'));
      if (!rodando) { rodando = true; requestAnimationFrame(segue); }
    }, { passive: true });
    d.addEventListener('mouseleave', function () { cursor.classList.remove('vivo'); });
  }

  // WhatsApp flutuante só depois de passar do topo
  var flut = $('.zap-flutuante');
  if (flut) {
    var ve = function () { flut.classList.toggle('aparece', window.scrollY > 500); };
    window.addEventListener('scroll', ve, { passive: true }); ve();
  }

  // Abas de serviços
  var abas = $$('.serv-aba');
  function abre(i, foco) {
    abas.forEach(function (a, n) {
      var on = n === i;
      a.classList.toggle('ativo', on);
      a.setAttribute('aria-selected', on);
      a.tabIndex = on ? 0 : -1;
      $('#' + a.getAttribute('aria-controls')).classList.toggle('ativo', on);
    });
    if (foco) abas[i].focus();
  }
  abas.forEach(function (a, i) {
    a.addEventListener('click', function () { abre(i); });
    a.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); abre((i + 1) % abas.length, true); }
      if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); abre((i + abas.length - 1) % abas.length, true); }
    });
  });

  // Antes e depois
  $$('.compara').forEach(function (c) {
    var r = $('input', c);
    r.addEventListener('input', function () { c.style.setProperty('--pos', r.value + '%'); });
  });

  // Monte seu pedido
  var ITENS = {
    'Manutenção': ['Manual', 'Controladora', 'Redutora de pressão', 'Condicionadora de vapor', 'Segurança e alívio', 'Atuador'],
    'Fabricação': ['Borboleta bicêntrica', 'Borboleta monobloco'],
    'Peças e automação': ['Atuador pneumático', 'Posicionador', 'Solenoide NAMUR', 'Caixa redutora', 'Válvula de retenção']
  };
  var BITOLAS = ['2', '2.1/2', '3', '4', '5', '6', '8', '10', '12', '14', '16', '18', '20', '24', '28', '30', '32', '36', '40', '42', '48'];
  var pedido = { servico: 'Manutenção', tipo: '', material: '' };
  var gServico = $('[data-grupo=servico]');
  if (gServico) {
    var gTipo = $('[data-grupo=tipo]'), gMat = $('[data-grupo=material]');
    var bitola = $('#bitola'), bitolaTxt = $('#bitola-txt'), qtd = $('#qtd');
    var msg = $('#mensagem'), zap = $('#enviar-zap'), mail = $('#enviar-email');
    var flange = $('.v-flange'), corpo = $('.v-corpo'), disco = $('.v-disco'), vol = $('.v-volante');
    var giroV = 0;

    function marca(grupo, valor) {
      $$('.chip', grupo).forEach(function (b) {
        var on = b.textContent === valor;
        b.classList.toggle('ativo', on);
        b.setAttribute('aria-pressed', on);
      });
    }
    function montaTipos() {
      gTipo.innerHTML = '';
      ITENS[pedido.servico].forEach(function (t) {
        var b = d.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = t; b.setAttribute('aria-pressed', 'false');
        gTipo.appendChild(b);
      });
      pedido.tipo = '';
      $('#campo-material').hidden = pedido.servico !== 'Fabricação';
      $('#campo-bitola').hidden = pedido.servico === 'Peças e automação';
      if (pedido.servico !== 'Fabricação') { pedido.material = ''; marca(gMat, ''); }
    }
    function atualiza() {
      var i = +bitola.value, pol = BITOLAS[i] + '"';
      bitolaTxt.textContent = pol;
      bitola.style.setProperty('--pct', (i / (BITOLAS.length - 1) * 100) + '%');
      // a válvula do desenho cresce com a bitola e o disco abre
      var raio = 42 + (i / (BITOLAS.length - 1)) * 46;
      flange.setAttribute('r', raio + 8); corpo.setAttribute('r', raio);
      disco.setAttribute('ry', raio - 4);
      disco.setAttribute('rx', Math.max(4, (raio - 4) * (1 - i / (BITOLAS.length - 1) * 0.86)));
      vol.style.setProperty('--giro-v', giroV + 'deg');

      var n = Math.max(1, Math.min(999, parseInt(qtd.value, 10) || 1));
      var l = ['Olá, vim pelo site da NEW.', 'Preciso de: ' + pedido.servico];
      if (pedido.tipo) l.push('Item: ' + pedido.tipo);
      if (pedido.material) l.push('Material: ' + pedido.material);
      if (pedido.servico !== 'Peças e automação') l.push('Bitola: ' + pol);
      l.push('Quantidade: ' + n);
      var texto = l.join('\n');
      msg.textContent = texto;
      zap.href = 'https://wa.me/5516997223976?text=' + encodeURIComponent(texto);
      mail.href = 'mailto:comercial@newequipamentos.ind.br?subject=' + encodeURIComponent('Pedido de cotação: ' + pedido.servico) + '&body=' + encodeURIComponent(texto);
    }
    function escolheServico(s) { pedido.servico = s; marca(gServico, s); montaTipos(); atualiza(); }

    gServico.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) escolheServico(b.textContent); });
    gTipo.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      pedido.tipo = pedido.tipo === b.textContent ? '' : b.textContent; marca(gTipo, pedido.tipo); atualiza();
    });
    gMat.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      pedido.material = pedido.material === b.textContent ? '' : b.textContent; marca(gMat, pedido.material); atualiza();
    });
    bitola.max = BITOLAS.length - 1;
    bitola.addEventListener('input', function () { giroV = bitola.value * 40; atualiza(); });
    qtd.addEventListener('input', atualiza);
    qtd.addEventListener('blur', function () { qtd.value = Math.max(1, Math.min(999, parseInt(qtd.value, 10) || 1)); atualiza(); });
    $('#menos').addEventListener('click', function () { qtd.value = Math.max(1, (parseInt(qtd.value, 10) || 1) - 1); atualiza(); });
    $('#mais').addEventListener('click', function () { qtd.value = Math.min(999, (parseInt(qtd.value, 10) || 0) + 1); atualiza(); });
    $$('[data-servico]').forEach(function (a) { a.addEventListener('click', function () { escolheServico(a.dataset.servico); }); });
    montaTipos(); atualiza();
  }

  // Galeria: setas, arrastar com o mouse e foto ampliada
  var trilho = $('#trilho-fotos');
  if (trilho) {
    var passo = function () { var f = $('figure', trilho); return f ? f.offsetWidth + 16 : 320; };
    $('#foto-ant').addEventListener('click', function () { trilho.scrollBy({ left: -passo() * 2, behavior: 'smooth' }); });
    $('#foto-prox').addEventListener('click', function () { trilho.scrollBy({ left: passo() * 2, behavior: 'smooth' }); });

    var x0 = 0, s0 = 0, baixo = false, moveu = false;
    trilho.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      baixo = true; moveu = false; x0 = e.clientX; s0 = trilho.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!baixo) return;
      var dx = e.clientX - x0;
      if (Math.abs(dx) > 6) { moveu = true; trilho.classList.add('arrastando'); }
      if (moveu) trilho.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () { baixo = false; trilho.classList.remove('arrastando'); });

    var dlg = $('#ampliada'), botoes = $$('.foto-btn', trilho), atual = 0;
    function mostra(i) {
      atual = (i + botoes.length) % botoes.length;
      var img = $('img', botoes[atual]);
      var alvo = $('img', dlg);
      alvo.src = img.currentSrc || img.src; alvo.alt = img.alt;
      $('figcaption', dlg).textContent = botoes[atual].parentNode.querySelector('figcaption').textContent.replace(/^\s*\d+\s*/, '');
    }
    botoes.forEach(function (b, i) {
      b.addEventListener('click', function (e) {
        if (moveu) { e.preventDefault(); moveu = false; return; }
        if (!dlg.showModal) return;
        mostra(i); dlg.showModal();
      });
    });
    $('.amp-fechar', dlg).addEventListener('click', function () { dlg.close(); });
    $('.amp-ant', dlg).addEventListener('click', function () { mostra(atual - 1); });
    $('.amp-prox', dlg).addEventListener('click', function () { mostra(atual + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostra(atual - 1);
      if (e.key === 'ArrowRight') mostra(atual + 1);
    });
  }
})();
