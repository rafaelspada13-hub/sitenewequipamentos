// Monta o link de orçamento que abre o WhatsApp da NEW com a mensagem pronta.
(function (global) {
  var WHATSAPP_NUMBER = '5516997223976';
  var EMAIL = 'comercial@newequipamentos.ind.br';
  var FIELDS = [
    ['nome', 'Nome'],
    ['empresa', 'Empresa'],
    ['email', 'E-mail'],
    ['telefone', 'Telefone'],
    ['produto', 'Produto'],
  ];

  function linhasDoPedido(data) {
    var lines = ['Olá, NEW! Gostaria de um orçamento.', ''];
    FIELDS.forEach(function (field) {
      var value = (data[field[0]] || '').trim();
      if (value) lines.push(field[1] + ': ' + value);
    });
    var mensagem = (data.mensagem || '').trim();
    if (mensagem) lines.push('', mensagem);
    return lines;
  }

  function buildWhatsAppUrl(data) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(linhasDoPedido(data).join('\n'));
  }

  // O mesmo pedido, como e-mail pronto para o comercial (para quem precisa da cotação por escrito).
  function buildEmailUrl(data) {
    var produto = (data.produto || '').trim();
    var assunto = 'Pedido de orçamento' + (produto ? ': ' + produto : '');
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(assunto) +
      '&body=' + encodeURIComponent(linhasDoPedido(data).join('\r\n'));
  }

  global.NEW = global.NEW || {};
  global.NEW.buildWhatsAppUrl = buildWhatsAppUrl;
  global.NEW.buildEmailUrl = buildEmailUrl;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildWhatsAppUrl: buildWhatsAppUrl, buildEmailUrl: buildEmailUrl };
})(typeof window !== 'undefined' ? window : globalThis);
