/* New Equipamentos — main.js */

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
