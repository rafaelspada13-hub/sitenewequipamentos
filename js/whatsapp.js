// Monta o link de orçamento que abre o WhatsApp da NEW com a mensagem pronta.
(function (global) {
  var WHATSAPP_NUMBER = '5516997223976';
  var FIELDS = [
    ['nome', 'Nome'],
    ['empresa', 'Empresa'],
    ['email', 'E-mail'],
    ['telefone', 'Telefone'],
    ['produto', 'Produto'],
  ];

  function buildWhatsAppUrl(data) {
    var lines = ['Olá, NEW! Gostaria de um orçamento.', ''];
    FIELDS.forEach(function (field) {
      var value = (data[field[0]] || '').trim();
      if (value) lines.push(field[1] + ': ' + value);
    });
    var mensagem = (data.mensagem || '').trim();
    if (mensagem) lines.push('', mensagem);
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  global.NEW = global.NEW || {};
  global.NEW.buildWhatsAppUrl = buildWhatsAppUrl;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildWhatsAppUrl: buildWhatsAppUrl };
})(typeof window !== 'undefined' ? window : globalThis);
