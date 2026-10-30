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
    var pastHero = y > hero.offsetHeight * 0.75;
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
      formError.hidden = false;
      invalid[0].focus();
      return;
    }

    formError.hidden = true;
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value); });
    window.open(window.NEW.buildWhatsAppUrl(data), '_blank', 'noopener');

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

  /* ---------- Vídeo do barracão: toca só quando visível ---------- */
  var video = document.querySelector('.frame--video video');
  if (video) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      video.controls = true;
    } else {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play().catch(function () { video.controls = true; });
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.4 }).observe(video);
    }
  }
})();
