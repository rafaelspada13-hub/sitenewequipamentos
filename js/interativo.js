// Peças interativas: simulador de aplicação, configurador e números.
// Regras técnicas em js/engenharia.js; aqui só a interface.
(function () {
  var E = window.NEW && window.NEW.engenharia;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var fmt = function (n) { return String(n).replace('.', ','); };

  // Leva um pedido ao formulário de orçamento (produto + mensagem) e rola até ele.
  function levarAoOrcamento(produto, mensagem) {
    var form = document.getElementById('orcamentoForm');
    var select = document.getElementById('produto');
    if (Array.prototype.some.call(select.options, function (o) { return o.value === produto; })) select.value = produto;
    document.getElementById('mensagem').value = mensagem;
    form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('nome').focus({ preventScroll: true });
  }

  /* ---------- Simulador de aplicação ---------- */
  var STATUS = { indicada: 'Indicada', restricao: 'Com restrição', nao: 'Não recomendada' };
  var sim = $('#simulador');
  if (sim && E) {
    var temp = $('#sim-temp'), pressao = $('#sim-pressao');
    var chart = $('.sim-chart', sim);
    var esc = {
      x0: +chart.dataset.x0, x1: +chart.dataset.x1, y0: +chart.dataset.y0, y1: +chart.dataset.y1, pmax: +chart.dataset.pmax,
    };
    var px = function (t) { return esc.x0 + Math.min(t, 320) / 300 * (esc.x1 - esc.x0); };
    var py = function (p) { return esc.y0 - p / esc.pmax * (esc.y0 - esc.y1); };
    var ultimo = null;

    var atualizarSim = function () {
      var fluido = $('input[name="fluido"]:checked', sim).value;
      var t = Number(temp.value), p = Number(pressao.value);
      var r = E.avaliarAplicacao({ fluido: fluido, temperatura: t, pressao: p });
      ultimo = { fluido: E.FLUIDOS[fluido].nome, t: t, p: p, r: r };

      $('#sim-temp-out').textContent = t + ' °C';
      $('#sim-pressao-out').textContent = fmt(p) + ' kgf/cm²';
      var status = $('#sim-status');
      status.textContent = STATUS[r.status];
      sim.dataset.status = r.status;

      $('#sim-mats').innerHTML = ['WCB', 'CF8', 'CF8M', 'CF3'].map(function (m) {
        var ok = r.materiais.indexOf(m) !== -1;
        return '<li class="' + (ok ? 'ok' : 'no') + '">' + m + '<span class="visually-hidden">' + (ok ? ' atende' : ' não atende') + '</span></li>';
      }).join('');
      $('#sim-motivos').innerHTML = r.motivos.map(function (m) { return '<li>' + m + '</li>'; }).join('')
        || '<li>Dentro da curva P×T e das condições do boletim.</li>';

      var cx = px(t), cy = py(p);
      $('#sim-ponto').setAttribute('cx', cx.toFixed(1));
      $('#sim-ponto').setAttribute('cy', cy.toFixed(1));
      $('#sim-guia-x').setAttribute('x1', cx.toFixed(1));
      $('#sim-guia-x').setAttribute('x2', cx.toFixed(1));
      $('#sim-guia-y').setAttribute('y1', cy.toFixed(1));
      $('#sim-guia-y').setAttribute('y2', cy.toFixed(1));
    };

    sim.addEventListener('input', atualizarSim);
    sim.addEventListener('change', atualizarSim);
    $('#sim-orcar').addEventListener('click', function () {
      var u = ultimo;
      levarAoOrcamento('Válvula Borboleta Bi-excêntrica Classe 150',
        'Aplicação: ' + u.fluido + ', ' + u.t + ' °C, ' + fmt(u.p) + ' kgf/cm². ' +
        'Resultado do simulador: ' + STATUS[u.r.status] +
        (u.r.materiais.length ? ' (materiais: ' + u.r.materiais.join(', ') + ')' : '') + '.');
    });
    atualizarSim();
  }

  /* ---------- Monte sua válvula ---------- */
  var cfg = $('#configurador');
  if (cfg && E) {
    var IMGS = {
      bi: 'bi-excentrica', concentrica: 'concentrica', retencao: null, gaveta: 'gaveta-globo',
      pressureseal: 'pressure-seal', esfera: 'esfera', guilhotina: 'guilhotina',
    };
    var sel = {};
    var tipoAtual = function () { return E.TIPOS.filter(function (t) { return t.id === sel.tipo; })[0]; };
    var chipsHtml = function (name, valores, marcado) {
      return valores.map(function (v) {
        return '<label class="chip"><input type="radio" name="' + name + '" value="' + v.replace(/"/g, '&quot;') + '"' +
          (v === marcado ? ' checked' : '') + ' /><span>' + v + '</span></label>';
      }).join('');
    };
    var bitolaSel = $('#cfg-bitola'), bitolaLivre = $('#cfg-bitola-livre');

    $('#cfg-tipos').innerHTML = E.TIPOS.map(function (t) {
      return '<label class="chip"><input type="radio" name="cfg-tipo" value="' + t.id + '" /><span>' + t.nome + '</span></label>';
    }).join('');

    var montarTipo = function (id) {
      sel = { tipo: id };
      var t = tipoAtual();
      $('input[name="cfg-tipo"][value="' + id + '"]', cfg).checked = true;
      if (t.bitolas) {
        bitolaSel.innerHTML = t.bitolas.map(function (b) { return '<option>' + b + '</option>'; }).join('');
        bitolaSel.hidden = false; bitolaLivre.hidden = true;
        sel.bitola = t.bitolas[0];
      } else {
        bitolaSel.hidden = true; bitolaLivre.hidden = false; bitolaLivre.value = '';
        sel.bitola = '';
      }
      sel.classe = t.classes ? t.classes[0] : '';
      $('#cfg-classes').innerHTML = t.classes ? chipsHtml('cfg-classe', t.classes, sel.classe) : '<p class="cfg-consulta">Sob consulta</p>';
      sel.material = t.materiais[0];
      $('#cfg-materiais').innerHTML = chipsHtml('cfg-material', t.materiais, sel.material);
      sel.acionamento = t.acionamentos[0];
      $('#cfg-acionamentos').innerHTML = chipsHtml('cfg-acionamento', t.acionamentos, sel.acionamento);
      var img = IMGS[id];
      var el = $('#cfg-img');
      el.parentElement.hidden = !img;
      if (img) { el.src = 'img/estudio/' + img + '.jpg'; el.alt = 'Válvula ' + t.nome.toLowerCase(); }
      $('#cfg-nome').textContent = t.nome;
      resumir();
    };
    var resumir = function () { $('#cfg-resumo').textContent = E.resumoConfiguracao(sel); };

    cfg.addEventListener('change', function (e) {
      var n = e.target.name;
      if (n === 'cfg-tipo') return montarTipo(e.target.value);
      if (e.target === bitolaSel) sel.bitola = bitolaSel.value;
      if (n === 'cfg-classe') sel.classe = e.target.value;
      if (n === 'cfg-material') sel.material = e.target.value;
      if (n === 'cfg-acionamento') sel.acionamento = e.target.value;
      resumir();
    });
    bitolaLivre.addEventListener('input', function () { sel.bitola = bitolaLivre.value.trim(); resumir(); });
    $('#cfg-orcar').addEventListener('click', function () {
      levarAoOrcamento(tipoAtual().produto, E.resumoConfiguracao(sel) + '.');
    });
    montarTipo('bi');
  }

  // Links para produtos abrem a ficha dentro do cartão.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#item-"]');
    if (!a) return;
    var item = document.getElementById(a.getAttribute('href').slice(1));
    var ficha = item && (item.tagName === 'DETAILS' ? item : item.querySelector('details'));
    if (ficha) ficha.open = true;
  });

  /* ---------- Números que contam ---------- */
  var nums = $$('.stat-num[data-count]');
  var escrever = function (el, v) {
    el.textContent = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (el.dataset.suffix || '');
  };
  if (nums.length && !reduceMotion && 'IntersectionObserver' in window) {
    nums.forEach(function (el) { escrever(el, 0); });
    var contar = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        contar.unobserve(entry.target);
        var el = entry.target, alvo = Number(el.dataset.count), inicio = null;
        var passo = function (agora) {
          if (inicio === null) inicio = agora;
          var k = Math.min(1, (agora - inicio) / 1400);
          escrever(el, alvo * (1 - Math.pow(1 - k, 3)));
          if (k < 1) window.requestAnimationFrame(passo);
        };
        window.requestAnimationFrame(passo);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { contar.observe(el); });
  }
})();
