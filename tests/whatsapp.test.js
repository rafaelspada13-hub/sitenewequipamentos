// Testa a montagem do link de orçamento para o WhatsApp (js/whatsapp.js).
const assert = require('assert');
const { buildWhatsAppUrl } = require('../js/whatsapp.js');

const PREFIX = 'https://wa.me/5516997223976?text=';
const textOf = (url) => decodeURIComponent(url.slice(PREFIX.length));
const base = {
  nome: 'José & Cia #1', empresa: '', email: 'jose@usina.com.br', telefone: '',
  produto: 'Válvula Bi-excêntrica', mensagem: 'Linha de vapor\n8" classe 150',
};

const tests = {
  'URL aponta para o WhatsApp da NEW': () => {
    assert.ok(buildWhatsAppUrl(base).startsWith(PREFIX));
  },
  'texto começa com a saudação': () => {
    assert.ok(textOf(buildWhatsAppUrl(base)).startsWith('Olá, NEW! Gostaria de um orçamento.'));
  },
  'acentos, & e # sobrevivem à codificação': () => {
    const url = buildWhatsAppUrl(base);
    assert.ok(!url.slice(PREFIX.length).includes('&'), '& não codificado');
    assert.ok(!url.slice(PREFIX.length).includes('#'), '# não codificado');
    const text = textOf(url);
    assert.ok(text.includes('Nome: José & Cia #1'));
    assert.ok(text.split('\n').includes('Produto: Válvula Bi-excêntrica'));
  },
  'quebra de linha da mensagem é preservada': () => {
    assert.ok(textOf(buildWhatsAppUrl(base)).includes('Linha de vapor\n8" classe 150'));
  },
  'campos vazios são omitidos': () => {
    const text = textOf(buildWhatsAppUrl(base));
    assert.ok(!text.includes('Empresa:'));
    assert.ok(!text.includes('Telefone:'));
  },
  'espaços em volta são ignorados': () => {
    const text = textOf(buildWhatsAppUrl({ ...base, empresa: '   ' }));
    assert.ok(!text.includes('Empresa:'));
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message); }
}
console.log(failed ? `${failed} falha(s)` : 'whatsapp: todos passaram');
process.exit(failed ? 1 : 0);
