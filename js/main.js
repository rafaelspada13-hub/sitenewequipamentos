// Interações do site: entradas ao rolar, menu, orçamento por WhatsApp, galeria e vídeo.
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Entradas ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');
  reveals.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains('reveal');
    });
    el.style.setProperty('--delay', siblings.indexOf(el) * 80 + 'ms');
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
  window.__newReady = true;

  /* ---------- Abertura: a bi-excêntrica no palco de estúdio ---------- */
  // No computador a válvula fica à direita do texto; no celular/tablet, embaixo dele e
  // centralizada, com a altura ajustada ao espaço livre.
  var heroEl = document.getElementById('inicio');
  var stage = heroEl.querySelector('.hero-stage');
  var palco = document.getElementById('valvula');
  var copyEl = heroEl.querySelector('.hero-copy');
  var RAZAO = 3600 / 1400, CENTRO = 0.50083, TOPO_VALVULA = 0.229;
  function ajustarPalco() {
    var w = stage.clientWidth, alturaPalco = stage.clientHeight, h, cx;
    if (window.innerWidth > 900) {
      h = alturaPalco;
      cx = Math.max(w * 0.7, copyEl.offsetLeft + copyEl.offsetWidth + h * 0.3);
    } else {
      var baseTexto = copyEl.offsetTop + copyEl.offsetHeight + 12;
      h = Math.max(220, Math.min(alturaPalco * 0.62, (alturaPalco - baseTexto) / (1 - TOPO_VALVULA)));
      cx = w / 2;
    }
    palco.style.height = h + 'px';
    palco.style.width = h * RAZAO + 'px';
    palco.style.left = (cx - h * RAZAO * CENTRO) + 'px';
    // etiquetas técnicas só quando cabem inteiras na tela (some entre ~900 e ~1100 px)
    root.classList.remove('anot-sem-espaco');
    var limite = window.innerWidth - 16;
    var vazam = Array.prototype.some.call(heroEl.querySelectorAll('.anot-rotulo'), function (r) {
      return r.getBoundingClientRect().right > limite;
    });
    root.classList.toggle('anot-sem-espaco', vazam);
  }
  window.addEventListener('resize', ajustarPalco);
  ajustarPalco();

  /* ---------- Cabeçalho, menu e botão flutuante ---------- */
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('menuToggle');
  var floatBtn = document.querySelector('.whatsapp-float');
  var hero = document.getElementById('inicio');

  var fundo = [document.querySelector('main'), document.querySelector('footer'), floatBtn];
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fechar' : 'Menu';
    root.classList.toggle('menu-aberto', open);
    // com o menu aberto, o Tab fica no menu: o resto da página sai do caminho
    fundo.forEach(function (el) { if (el) el.inert = open; });
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    var pastHero = y > hero.offsetHeight - window.innerHeight * 0.5;
    floatBtn.classList.toggle('is-visible', pastHero);
    var menuOpen = nav.classList.contains('is-open');
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Orçamento ---------- */
  var form = document.getElementById('orcamentoForm');
  // Sem JavaScript o formulário cai no e-mail (action mailto); com ele, a validação é nossa.
  form.noValidate = true;
  var formError = document.getElementById('formError');
  var produto = document.getElementById('produto');
  var submitBtn = form.querySelector('button[type="submit"]');

  document.querySelectorAll('.js-orcar').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nome = btn.closest('[data-produto]').getAttribute('data-produto');
      var hasOption = Array.prototype.some.call(produto.options, function (o) { return o.value === nome; });
      if (hasOption) produto.value = nome;
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      document.getElementById('nome').focus({ preventScroll: true });
    });
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) {
      e.target.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var invalid = [];
    form.querySelectorAll('[required], [type="email"]').forEach(function (field) {
      var empty = field.hasAttribute('required') && !field.value.trim();
      var ok = !empty && field.checkValidity();
      if (ok) field.removeAttribute('aria-invalid');
      else { field.setAttribute('aria-invalid', 'true'); invalid.push(field); }
    });

    if (invalid.length) {
      var message = 'Preencha nome, um e-mail válido e a mensagem para enviar.';
      if (formError.hidden) {
        formError.textContent = message;
        formError.hidden = false;
      } else {
        // Já visível: limpa e reescreve para o leitor de tela anunciar de novo.
        formError.textContent = '';
        setTimeout(function () { formError.textContent = message; }, 50);
      }
      invalid[0].focus();
      return;
    }

    formError.hidden = true;
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value); });
    var url = window.NEW && window.NEW.buildWhatsAppUrl
      ? window.NEW.buildWhatsAppUrl(data)
      : 'https://wa.me/5516997223976';
    window.open(url, '_blank', 'noopener');

    var label = submitBtn.textContent;
    submitBtn.textContent = 'Abrindo o WhatsApp…';
    setTimeout(function () { submitBtn.textContent = label; }, 3000);
  });

  /* ---------- Galeria ampliada ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('a.js-lightbox'));
  if (links.length && typeof HTMLDialogElement === 'function') {
    var dialog, img, caption;
    var current = 0;
    var opener = null;

    // A foto nova é decodificada antes de entrar, e troca com um cruzamento curto.
    var show = function (index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      var alt = link.getAttribute('data-alt') || '';
      var proxima = new Image();
      proxima.src = link.getAttribute('href');
      var trocar = function () {
        img.src = proxima.src;
        img.alt = alt;
        caption.textContent = (current + 1) + ' de ' + links.length + ' · ' + alt;
        img.classList.remove('is-trocando');
      };
      img.classList.add('is-trocando');
      (proxima.decode ? proxima.decode() : Promise.resolve()).then(trocar, trocar);
    };

    // A janela é criada no primeiro clique, para não deixar uma imagem vazia na página.
    var buildDialog = function () {
      dialog = document.createElement('dialog');
      dialog.className = 'lightbox';
      dialog.setAttribute('aria-label', 'Foto ampliada');
      dialog.innerHTML =
        '<img />' +
        '<div class="lightbox-bar"><p></p><div>' +
        '<button type="button" data-step="-1" aria-label="Foto anterior">←</button>' +
        '<button type="button" data-step="1" aria-label="Próxima foto">→</button>' +
        '<button type="button" data-close>Fechar</button>' +
        '</div></div>';
      document.body.appendChild(dialog);
      img = dialog.querySelector('img');
      caption = dialog.querySelector('p');

      dialog.addEventListener('click', function (e) {
        var step = e.target.getAttribute('data-step');
        if (step) show(current + Number(step));
        else if (e.target.hasAttribute('data-close') || e.target === dialog) dialog.close();
      });
      dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show(current + 1);
        if (e.key === 'ArrowLeft') show(current - 1);
      });
      dialog.addEventListener('close', function () {
        if (opener) opener.focus();
      });
    };

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (!dialog) buildDialog();
        opener = link;
        show(i);
        dialog.showModal();
        dialog.querySelector('[data-close]').focus();
      });
    });
  }

  /* ---------- Seletor de bitola (lê a tabela dimensional) ---------- */
  var range = document.getElementById('bitola');
  var dimTable = document.getElementById('tabela-dimensional');
  if (range && dimTable) {
    var outputs = ['bx-bitola', 'bx-DN', 'bx-A', 'bx-B', 'bx-C', 'bx-D', 'bx-E', 'bx-F', 'bx-furos', 'bx-iso']
      .map(function (id) { return document.getElementById(id); });
    var dimRows = dimTable.querySelectorAll('tbody tr');

    var update = function () {
      var row = dimRows[Number(range.value)];
      row.querySelectorAll('th, td').forEach(function (cell, i) {
        outputs[i].textContent = cell.textContent.trim();
      });
      range.setAttribute('aria-valuetext', outputs[0].textContent);
      dimRows.forEach(function (r) { r.classList.toggle('is-current', r === row); });
    };
    range.max = String(dimRows.length - 1);
    range.addEventListener('input', update);
    update();
  }

  /* ---------- Vídeo do barracão: toca só quando visível ---------- */
  // Sem a barra do navegador: um botão discreto pausa e retoma (e toca, com movimento reduzido).
  var video = document.querySelector('.frame--video video');
  var videoBtn = document.querySelector('.video-toggle');
  if (video && videoBtn) {
    video.removeAttribute('controls');
    videoBtn.hidden = false;
    var pausadoPeloUsuario = reduceMotion;
    var marcar = function () {
      var tocando = !video.paused;
      videoBtn.setAttribute('aria-pressed', String(!tocando));
      videoBtn.setAttribute('aria-label', tocando ? 'Pausar vídeo' : 'Tocar vídeo');
      videoBtn.classList.toggle('is-pausado', !tocando);
    };
    video.addEventListener('play', marcar);
    video.addEventListener('pause', marcar);
    videoBtn.addEventListener('click', function () {
      if (video.paused) { pausadoPeloUsuario = false; video.play().catch(function () {}); }
      else { pausadoPeloUsuario = true; video.pause(); }
    });
    marcar();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !pausadoPeloUsuario) video.play().catch(function () {});
          else if (!entry.isIntersecting) video.pause();
        });
      }, { threshold: 0.4 }).observe(video);
    }
  }
})();
