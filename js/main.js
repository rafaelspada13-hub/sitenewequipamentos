/* New Equipamentos — main.js */

// Navbar: efeito de scroll (o menu mobile já é resolvido pelo Bootstrap Collapse)
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('navbar-scrolled', window.scrollY > 40);
});

// Fecha o menu mobile ao clicar em um link (usa a API do Bootstrap)
const navLinksEl = document.getElementById('navLinks');
if (navLinksEl && window.bootstrap) {
  const collapseInstance = window.bootstrap.Collapse.getOrCreateInstance(navLinksEl, { toggle: false });
  navLinksEl.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinksEl.classList.contains('show')) collapseInstance.hide();
    });
  });
}

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], header[id]');
const links = document.querySelectorAll('.navbar-nav .nav-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.navbar-nav .nav-link[href="#${e.target.id}"]`);
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

document.querySelectorAll('.produto-card, .card-info, .anim-fade').forEach(el => {
  el.classList.add('anim-fade');
  animObserver.observe(el);
});

// Contact form
const form = document.getElementById('contatoForm');
const formSuccess = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  form.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('is-invalid');
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      valid = false;
    }
  });

  if (!valid) return;

  // Simulate sending (replace with real backend/emailjs/formspree)
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  setTimeout(() => {
    form.reset();
    btn.disabled = false;
    btn.textContent = 'Enviar Mensagem';
    formSuccess.classList.add('show');
    setTimeout(() => formSuccess.classList.remove('show'), 5000);
  }, 1200);
});

// Remove error class on input
form.querySelectorAll('input, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('is-invalid'));
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
