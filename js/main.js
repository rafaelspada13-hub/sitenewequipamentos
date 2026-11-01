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

  /* ---------- Abertura: a válvula abre, a câmera mergulha no furo e o site abre ---------- */
  var heroEl = document.getElementById('inicio');
  var pin = heroEl.querySelector('.hero-pin');
  var stage = heroEl.querySelector('.hero-stage');
  var valveEl = document.getElementById('valvula');
  var boreEl = valveEl.querySelector('.valve-bore');
  var pctOut = document.getElementById('valvula-abertura');
  var angOut = document.getElementById('valvula-angulo');
  var canvas = document.getElementById('valvula-fluxo');
  var ABRE_ATE = 0.55;   // fração da rolagem em que o disco termina de girar
  var MERGULHO = 0.6;    // a partir daqui a câmera entra pelo furo
  var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };
  var suave = function (t) { return t * t * (3 - 2 * t); };
  var estado = { r: 1, z: 0 };
  var centroBase = null;

  // Centro do furo na tela, medido com a válvula sem ampliação (o palco fica fixo enquanto rola).
  function medirCentro() {
    var prev = valveEl.style.transform;
    valveEl.style.transform = 'none';
    var b = boreEl.getBoundingClientRect();
    var st = stage.getBoundingClientRect();
    centroBase = { x: b.left + b.width / 2 - st.left, y: b.top + b.height / 2 - st.top };
    valveEl.style.transform = prev;
  }

  // Posição do palco: no computador a válvula fica à direita do texto; no celular/tablet,
  // embaixo dele e centralizada, com a altura ajustada ao espaço livre.
  var copyEl = heroEl.querySelector('.hero-copy');
  var RAZAO = 3600 / 1400, CENTRO = 0.50083, TOPO_VALVULA = 0.229;
  function ajustarPalco() {
    var w = stage.clientWidth, alturaPalco = stage.clientHeight, h, cx;
    if (window.innerWidth > 900) {
      h = alturaPalco;
      var fimTexto = copyEl.offsetLeft + copyEl.offsetWidth;
      cx = Math.max(w * 0.7, fimTexto + h * 0.3);
    } else {
      var baseTexto = copyEl.offsetTop + copyEl.offsetHeight + 12;
      h = Math.max(220, Math.min(alturaPalco * 0.62, (alturaPalco - baseTexto) / (1 - TOPO_VALVULA)));
      cx = w / 2;
    }
    valveEl.style.height = h + 'px';
    valveEl.style.left = (cx - h * RAZAO * CENTRO) + 'px';
  }

  function abrirSite() {
    if (root.classList.contains('site-aberto')) return;
    root.classList.add('site-aberto');
    // "Quem somos" entra sozinho, em sequência, sem esperar a rolagem.
    document.querySelectorAll('#sobre .reveal').forEach(function (el, i) {
      el.style.setProperty('--delay', (150 + i * 140) + 'ms');
      el.classList.add('is-in');
    });
  }

  function updateValve() {
    var run = pin.offsetHeight - window.innerHeight;
    var p = reduceMotion || run <= 0 ? 1 : clamp01((window.scrollY - pin.offsetTop) / run);
    var r = reduceMotion ? 1 : clamp01(p / ABRE_ATE);
    var z = reduceMotion ? 0 : clamp01((p - MERGULHO) / (1 - MERGULHO));
    estado.r = r; estado.z = z;
    var angle = r * 90;
    heroEl.style.setProperty('--p', r.toFixed(3));
    heroEl.style.setProperty('--z', z.toFixed(3));
    heroEl.style.setProperty('--sx', Math.max(0.02, Math.cos(angle * Math.PI / 180)).toFixed(3));
    // clarão curto: sobe até 90% do mergulho e se desfaz até o fim
    heroEl.style.setProperty('--flash', (suave(clamp01(1 - Math.abs(z - 0.9) / 0.1)) * 0.9).toFixed(3));
    if (pctOut) pctOut.textContent = Math.round(r * 100) + '%';
    if (angOut) angOut.textContent = Math.round(angle) + '°';
    canvas.style.opacity = clamp01(r * 1.25 - 0.08).toFixed(3);

    if (z > 0) {
      if (!centroBase) medirCentro();
      var ez = suave(z);
      var escala = 1 + Math.pow(z, 2.2) * 16;
      var st = stage.getBoundingClientRect();
      var tx = (st.width / 2 - centroBase.x) * ez;
      var ty = (st.height / 2 - centroBase.y) * ez;
      valveEl.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + escala.toFixed(3) + ')';
    } else {
      valveEl.style.transform = '';
      centroBase = null;
    }
    if (window.scrollY > pin.offsetTop + run - 2 && !reduceMotion) abrirSite();
  }

  /* Fluxo pelo furo: vapor em WebGL (js/vapor.js); sem WebGL, partículas em 2D.
     Fica preso à elipse do furo; no mergulho, a elipse cresce e o fluxo toma a tela inteira. */
  var vapor = !reduceMotion && window.NEW && window.NEW.criarVapor ? window.NEW.criarVapor(canvas) : null;
  var ctx = !vapor && canvas.getContext ? canvas.getContext('2d') : null;
  canvas.dataset.modo = vapor ? 'vapor' : 'particulas';
  var particulas = [];
  var ultimoQuadro = 0;
  var tempo = 0;
  var ativo = false;

  function redimensionar() {
    if (vapor) return vapor.redimensionar(stage.clientWidth, stage.clientHeight);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function geometriaDoFuro() {
    var b = boreEl.getBoundingClientRect(), st = stage.getBoundingClientRect();
    return {
      cx: b.left + b.width / 2 - st.left, cy: b.top + b.height / 2 - st.top,
      rx: b.width / 2, ry: b.height / 2, w: st.width, h: st.height,
    };
  }

  function desenharParticulas(geo, dt, r, z) {
    ctx.clearRect(0, 0, geo.w, geo.h);
    if (r <= 0.02) { particulas.length = 0; return; }
    var vel = 0.35 + r * 0.55 + z * 2.6;          // raios por segundo
    var nascem = Math.round((r * 3 + z * 10) * (60 * dt));
    for (var n = 0; n < nascem && particulas.length < 900; n++) {
      particulas.push({ a: Math.random() * Math.PI * 2, d: Math.random() * 0.08, v: 0.6 + Math.random() * 0.8, t: Math.random(), luz: Math.random() < 0.3 });
    }
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(geo.cx, geo.cy, geo.rx, geo.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineCap = 'round';
    for (var i = particulas.length - 1; i >= 0; i--) {
      var q = particulas[i];
      var d0 = q.d;
      q.d += q.v * vel * dt * (0.4 + q.d * 1.6);  // acelera ao se aproximar, como perspectiva
      if (q.d > 1.15) { particulas.splice(i, 1); continue; }
      var cos = Math.cos(q.a), sin = Math.sin(q.a);
      var cauda = Math.max(d0, q.d - (0.02 + z * 0.12 + q.d * 0.05));
      ctx.globalAlpha = Math.min(1, q.d * 2.2) * (0.55 + q.t * 0.45);
      ctx.strokeStyle = q.luz ? '#f2fff7' : '#4ac480';
      ctx.lineWidth = (0.8 + q.d * 2.6) * (1 + z * 0.8);
      ctx.beginPath();
      ctx.moveTo(geo.cx + cos * cauda * geo.rx, geo.cy + sin * cauda * geo.ry);
      ctx.lineTo(geo.cx + cos * q.d * geo.rx, geo.cy + sin * q.d * geo.ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  function quadro(agora) {
    if (!ativo) return;
    var dt = Math.min(0.05, (agora - (ultimoQuadro || agora)) / 1000);
    ultimoQuadro = agora;
    if (!root.classList.contains('motion-paused')) {
      tempo += dt;
      var geo = geometriaDoFuro();
      if (vapor) vapor.desenhar(geo, tempo, Math.min(1, estado.r * 1.3), estado.z);
      else desenharParticulas(geo, dt, estado.r, estado.z);
    }
    window.requestAnimationFrame(quadro);
  }

  if ((vapor || ctx) && !reduceMotion) {
    redimensionar();
    new IntersectionObserver(function (entries) {
      var visivel = entries[0].isIntersecting;
      if (visivel && !ativo) { ativo = true; ultimoQuadro = 0; window.requestAnimationFrame(quadro); }
      if (!visivel) ativo = false;
    }).observe(stage);
  }

  window.addEventListener('scroll', function () { window.requestAnimationFrame(updateValve); }, { passive: true });
  window.addEventListener('resize', function () { centroBase = null; ajustarPalco(); redimensionar(); updateValve(); });
  ajustarPalco();
  updateValve();

  /* ---------- Cabeçalho, menu e botão flutuante ---------- */
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('menuToggle');
  var floatBtn = document.querySelector('.whatsapp-float');
  var hero = document.getElementById('inicio');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fechar' : 'Menu';
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

    var show = function (index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      img.src = link.getAttribute('href');
      img.alt = link.getAttribute('data-alt') || '';
      caption.textContent = (current + 1) + ' de ' + links.length + ' · ' + img.alt;
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
  var video = document.querySelector('.frame--video video');
  var motionToggle = document.getElementById('motionToggle');
  var motionPaused = reduceMotion;

  var setMotion = function (paused) {
    motionPaused = paused;
    root.classList.toggle('motion-paused', paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.textContent = paused ? 'Retomar animação' : 'Pausar animação';
    if (paused && video) video.pause();
  };
  motionToggle.addEventListener('click', function () { setMotion(!motionPaused); });
  if (reduceMotion) setMotion(true);

  if (video && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !motionPaused) video.play().catch(function () {});
        else if (!entry.isIntersecting) video.pause();
      });
    }, { threshold: 0.4 }).observe(video);
  }
})();
