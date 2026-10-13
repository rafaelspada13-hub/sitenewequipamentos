// NEW Válvulas — comportamento do site
(function () {
  const WHATS = '5516997223976';

  // Ano no rodapé
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // Menu celular
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto');
      btn.setAttribute('aria-expanded', String(aberto));
      btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('aberto');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menu');
    }));
  }

  // Marca no menu a seção visível
  const links = [...document.querySelectorAll('.menu a')];
  const secoes = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secoes.length) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.toggle('ativo', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(s => obs.observe(s));
  }

  // Botões que já escolhem o assunto do formulário
  const assunto = document.getElementById('assunto');
  document.querySelectorAll('[data-assunto]').forEach(a => {
    a.addEventListener('click', () => { if (assunto) assunto.value = a.dataset.assunto; });
  });

  // Formulário de orçamento
  // Envia por e-mail (FormSubmit) para comercial@newequipamentos.ind.br.
  // Fora do Netlify (ou se o envio falhar) abre o WhatsApp com a mensagem pronta.
  const form = document.getElementById('form');
  if (!form) return;
  const erro = document.getElementById('fErro');
  const ok = document.getElementById('fOk');
  const enviar = document.getElementById('fBtn');

  function textoWhats(d) {
    return [
      'Pedido de orçamento pelo site',
      'Nome: ' + d.get('nome'),
      d.get('empresa') ? 'Empresa: ' + d.get('empresa') : null,
      'Telefone: ' + d.get('telefone'),
      d.get('email') ? 'E-mail: ' + d.get('email') : null,
      'Assunto: ' + d.get('assunto'),
      '',
      d.get('mensagem')
    ].filter(l => l !== null).join('\n');
  }

  form.querySelectorAll('input, textarea').forEach(el =>
    el.addEventListener('input', () => el.classList.remove('erro')));

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    erro.hidden = true; ok.hidden = true;

    const faltando = [...form.querySelectorAll('[required]')].filter(c => !c.value.trim());
    faltando.forEach(c => c.classList.add('erro'));
    if (faltando.length) {
      erro.textContent = 'Preencha nome, telefone e o que você precisa para enviarmos o orçamento.';
      erro.hidden = false;
      faltando[0].focus();
      return;
    }

    const dados = new FormData(form);
    enviar.disabled = true;
    enviar.textContent = 'Enviando...';

    let enviado = false;
    if (location.protocol !== 'file:') {
      try {
        const corpo = Object.fromEntries(dados.entries());
        delete corpo['bot-field']; delete corpo['form-name'];
        corpo._subject = 'Pedido de orçamento pelo site - ' + (corpo.assunto || '');
        corpo._template = 'table';
        const r = await fetch('https://formsubmit.co/ajax/comercial@newequipamentos.ind.br', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(corpo)
        });
        const j = await r.json().catch(() => ({}));
        enviado = r.ok && String(j.success) === 'true';
      } catch (_) { enviado = false; }
    }

    enviar.disabled = false;
    enviar.textContent = 'Enviar pedido de orçamento';

    if (enviado) {
      form.reset();
      ok.textContent = 'Pedido enviado. Vamos responder pelo WhatsApp ou e-mail informado.';
      ok.hidden = false;
    } else {
      window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(textoWhats(dados)), '_blank', 'noopener');
      ok.textContent = 'Abrimos o WhatsApp com o seu pedido pronto. É só tocar em enviar.';
      ok.hidden = false;
    }
  });
})();
