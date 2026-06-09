/* New Equipamentos — main.js */

// LGPD banner
const lgpdBanner = document.getElementById('lgpdBanner');
const lgpdAccept = document.getElementById('lgpdAccept');
if (lgpdBanner && !localStorage.getItem('lgpd_ok')) {
  lgpdBanner.classList.remove('hide');
} else if (lgpdBanner) {
  lgpdBanner.style.display = 'none';
}
lgpdAccept?.addEventListener('click', () => {
  localStorage.setItem('lgpd_ok', '1');
  lgpdBanner.classList.add('hide');
  setTimeout(() => lgpdBanner.style.display = 'none', 500);
});

// Navbar: scroll effect + mobile menu
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const links = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

// Animate elements on scroll
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      animObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.produto-card, .sobre-card, .contato-item').forEach(el => {
  el.classList.add('anim-fade');
  animObserver.observe(el);
});

// ── Seletor técnico de válvulas ──────────────────────────────────────────────
const selState = { fluido: null, pressao: null, temp: null, funcao: null };

document.querySelectorAll('.sel-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.closest('[data-group]').dataset.group;
    btn.closest('[data-group]').querySelectorAll('.sel-btn').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    selState[group] = btn.dataset.value;
    renderResultado();
  });
});

function renderResultado() {
  const { fluido, pressao, temp, funcao } = selState;
  if (!fluido || !pressao || !temp || !funcao) return;
  const res = recomendarValvula(fluido, pressao, temp, funcao);
  const wa  = gerarMsgWA(res, fluido, pressao, temp, funcao);
  document.getElementById('selResult').innerHTML = `
    <div class="result-content">
      <p class="result-label">✅ Recomendação técnica</p>
      <p class="result-nome">${res.nome}</p>
      <p class="result-sede">Sede recomendada: <strong>${res.sede}</strong></p>
      <p class="result-motivo">${res.motivo}</p>
      <div class="result-tags">${res.tags.map(t => `<span class="result-tag">${t}</span>`).join('')}</div>
      <div class="result-cta">
        <a href="${wa}" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:.86rem;padding:10px 18px;">
          Solicitar orçamento via WhatsApp →
        </a>
        <a href="#contato" class="btn-outline-green">Formulário</a>
      </div>
    </div>`;
}

function recomendarValvula(fluido, pressao, temp, funcao) {
  if (funcao === 'retencao') return {
    nome: 'Válvula de Retenção',
    sede: 'EPDM / Buna / Viton / Metal',
    tags: ['Anti-retorno', 'Wafer', 'Qualquer fluido'],
    motivo: 'Projetada para prevenir refluxo em sistemas de bombeamento e processo. Disponível em múltiplos materiais para cada fluido.'
  };
  if (temp === 'alta') return {
    nome: 'Válvula Bi-excêntrica',
    sede: 'RPTFE',
    tags: ['Alta Temp. >200°C', 'Serviço Crítico', 'RPTFE'],
    motivo: 'Acima de 200°C, a geometria bi-excêntrica elimina o contato sede-disco fora do fechamento, garantindo vida útil superior e estanqueidade Classe VI.'
  };
  if (fluido === 'vapor' && pressao !== 'baixa') return {
    nome: 'Válvula Bi-excêntrica',
    sede: 'RPTFE',
    tags: ['Vapor', 'Pressão Média/Alta', 'RPTFE'],
    motivo: 'Vapor a média/alta pressão exige a geometria bi-excêntrica para resistir à erosão e manter estanqueidade nos ciclos térmicos repetidos.'
  };
  if (fluido === 'quimico') return {
    nome: 'Válvula Bi-excêntrica',
    sede: 'RPTFE / Viton',
    tags: ['Químicos', 'Alta Resistência', 'RPTFE/Viton'],
    motivo: 'RPTFE e Viton oferecem resistência superior a ácidos, bases e solventes. A geometria bi-excêntrica reduz desgaste da sede em fluidos agressivos.'
  };
  if (fluido === 'oleo' && pressao === 'alta') return {
    nome: 'Válvula Bi-excêntrica',
    sede: 'Viton / RPTFE',
    tags: ['Óleo', 'Alta Pressão', 'Viton'],
    motivo: 'Óleo a alta pressão exige bi-excêntrica para garantir estanqueidade e evitar extrusão do elastômero sob alta pressão diferencial.'
  };
  if (fluido === 'gas' && pressao === 'alta') return {
    nome: 'Válvula Bi-excêntrica',
    sede: 'RPTFE',
    tags: ['Gás', 'Alta Pressão', 'Classe VI'],
    motivo: 'Para gás a alta pressão, a bi-excêntrica com sede RPTFE garante estanqueidade Classe VI mesmo após milhares de ciclos de operação.'
  };
  if (fluido === 'polpa') return {
    nome: 'Válvula Borboleta',
    sede: 'EPDM reforçado',
    tags: ['Polpa', 'Sólidos em Suspensão', 'Bore Liso'],
    motivo: 'O bore completamente desobstruído evita acúmulo de fibras. O EPDM reforçado resiste ao atrito de partículas abrasivas em suspensão.'
  };
  if (fluido === 'oleo') return {
    nome: 'Válvula Borboleta',
    sede: 'Viton',
    tags: ['Óleo', 'Pressão Moderada', 'Viton'],
    motivo: 'Para óleos a pressão moderada, a borboleta wafer com sede Viton oferece excelente custo-benefício e resistência a hidrocarbonetos.'
  };
  if (fluido === 'gas') return {
    nome: 'Válvula Borboleta',
    sede: 'EPDM / Buna-N',
    tags: ['Gás', 'Ar Comprimido', 'Compacta'],
    motivo: 'Para gás e ar comprimido a pressão moderada, a borboleta wafer é a solução mais compacta, econômica e com menor perda de carga.'
  };
  return {
    nome: 'Válvula Borboleta',
    sede: 'EPDM',
    tags: ['Água / Neutro', 'Alta Durabilidade', 'Custo-eficiente'],
    motivo: 'Para água e líquidos neutros, a borboleta wafer com sede EPDM é a escolha ideal: alta durabilidade, baixa manutenção e melhor custo por bitola.'
  };
}

function gerarMsgWA(res, fluido, pressao, temp, funcao) {
  const fl = { agua:'Água/Neutro', vapor:'Vapor', oleo:'Óleo/Hidrocarboneto', gas:'Gás/Ar comprimido', quimico:'Ácidos/Químicos', polpa:'Polpa/Pasta' };
  const pr = { baixa:'Baixa (até 10 bar)', media:'Média (10–40 bar)', alta:'Alta (acima de 40 bar)' };
  const tp = { amb:'Ambiente (até 80°C)', media:'Moderada (80–200°C)', alta:'Alta (acima de 200°C)' };
  const fn = { isolamento:'Isolamento', controle:'Controle de fluxo', retencao:'Anti-retorno' };
  const msg = `Olá! Usei o seletor técnico do site e recebi a seguinte recomendação:\n\n✅ ${res.nome}\n🔧 Sede: ${res.sede}\n\nCondições:\n• Fluido: ${fl[fluido]}\n• Pressão: ${pr[pressao]}\n• Temperatura: ${tp[temp]}\n• Função: ${fn[funcao]}\n\nPoderia me enviar um orçamento? Minha bitola é: `;
  return `https://wa.me/5516997223976?text=${encodeURIComponent(msg)}`;
}

// ── Busca na tabela de conversão DN ─────────────────────────────────────────
document.getElementById('convSearch')?.addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll('.conv-row').forEach(row => {
    row.classList.toggle('conv-row-hidden', q !== '' && !row.textContent.toLowerCase().includes(q));
  });
  const visible = document.querySelectorAll('.conv-row:not(.conv-row-hidden)').length;
  const noRes = document.getElementById('convNoResults');
  if (noRes) noRes.style.display = (q && visible === 0) ? 'block' : 'none';
});


// Pre-select product in contact form when clicking card CTA
document.querySelectorAll('.produto-card .btn-link').forEach(link => {
  link.addEventListener('click', () => {
    const h3 = link.closest('.produto-card')?.querySelector('h3')?.textContent?.trim();
    const select = document.getElementById('produto');
    if (!h3 || !select) return;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].text.includes(h3)) {
        select.selectedIndex = i;
        return;
      }
    }
  });
});

// Contact form — real submission via Formsubmit AJAX with validation
const form = document.getElementById('contatoForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  form.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('error');
    if (!field.value.trim()) {
      field.classList.add('error');
      valid = false;
    }
  });

  if (!valid) return;

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const data = {};
  new FormData(form).forEach((v, k) => { if (!k.startsWith('_') && k !== '_honey') data[k] = v; });

  try {
    const res = await fetch('https://formsubmit.co/ajax/comercial@newequipamentos.ind.br', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      form.reset();
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 6000);
    } else {
      form.submit();
    }
  } catch (_) {
    form.submit();
  }

  btn.disabled = false;
  btn.textContent = 'Enviar Mensagem';
});

// Remove error class on input
form.querySelectorAll('input, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
});

// Phone mask
const telefoneInput = document.getElementById('telefone');
if (telefoneInput) {
  telefoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    e.target.value = v;
  });
}
