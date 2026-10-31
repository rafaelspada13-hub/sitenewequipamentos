// Regras técnicas do simulador de aplicação e do configurador.
// Números do boletim DT-VB150-001 (bi-excêntrica Classe 150) e do catálogo de apresentação NEW.
(function (global) {
  /* ---------- Curva P×T (seção 5 do boletim), kgf/cm² ---------- */
  var TEMPERATURAS = [38, 100, 150, 200, 250, 300];
  var CURVAS = {
    WCB: [20.0, 18.0, 16.1, 14.1, 12.3, 10.4],
    CF8: [19.4, 16.0, 14.5, 13.5, 12.3, 10.4],
    CF3: [19.4, 16.0, 14.5, 13.5, 12.3, 10.4],
    CF8M: [19.4, 16.5, 15.1, 14.0, 12.3, 10.4],
  };
  var TODOS = ['WCB', 'CF8', 'CF8M', 'CF3'];
  var INOX = ['CF8', 'CF8M', 'CF3'];

  function pressaoAdmissivel(material, t) {
    var curva = CURVAS[material];
    if (!curva || t > 300) return null;
    if (t <= TEMPERATURAS[0]) return curva[0];
    for (var i = 1; i < TEMPERATURAS.length; i++) {
      if (t <= TEMPERATURAS[i]) {
        var t0 = TEMPERATURAS[i - 1], t1 = TEMPERATURAS[i];
        return Math.round((curva[i - 1] + (curva[i] - curva[i - 1]) * (t - t0) / (t1 - t0)) * 100) / 100;
      }
    }
    return curva[curva.length - 1];
  }

  /* ---------- Fluidos (seções 6, 7 e 8 do boletim) ---------- */
  var FLUIDOS = {
    vapor: { nome: 'Vapor saturado', materiais: TODOS, maxT: 195, maxP: 14,
      limite: 'Vapor saturado: o boletim indica até ≈13–14 kgf/cm² e 195 °C.' },
    caldo: { nome: 'Caldo de cana', materiais: TODOS,
      nota: 'Prefira disco em inox (CF8, CF8M ou CF3) e evite pontos com areia.' },
    xarope: { nome: 'Xarope e mel final', materiais: TODOS },
    etanol: { nome: 'Etanol e derivados', materiais: TODOS },
    oleo: { nome: 'Óleo térmico', materiais: TODOS, status: 'restricao',
      nota: 'Até 250 °C contínuo; a válvula não tem certificação fire-safe (API 607). Confirme a exigência da planta.' },
    vinhaca: { nome: 'Vinhaça concentrada (milho)', materiais: INOX },
    soda: { nome: 'Soda cáustica (CIP alcalino)', materiais: TODOS, maxT: 90,
      limite: 'Soda cáustica: indicada diluída até ≈90 °C.' },
    sulfamico: { nome: 'Ácido sulfâmico', materiais: INOX, maxT: 60,
      limite: 'Ácido sulfâmico: limitar a ≈60 °C; acima disso o produto se decompõe e fica mais agressivo.',
      nota: 'Somente inox: WCB e ferro nodular não podem ter contato com ácidos.' },
    nitrico: { nome: 'Ácido nítrico (CIP ácido)', materiais: INOX,
      nota: 'Somente inox: WCB e ferro nodular não podem ter contato com ácidos.' },
    cip: { nome: 'CIP alternado ácido e soda', materiais: ['CF8M', 'CF3'],
      nota: 'A mesma linha recebe os dois ciclos: somente CF8M ou CF3.' },
    abrasivo: { nome: 'Fluido com sólidos abrasivos', materiais: [], status: 'nao',
      nota: 'Sólidos abrasivos aceleram o desgaste da sede RPTFE.' },
    firesafe: { nome: 'Serviço fire-safe certificado', materiais: [], status: 'nao',
      nota: 'A válvula não tem certificação fire-safe (API 607).' },
  };

  var fmt = function (n) { return String(n).replace('.', ','); };

  function avaliarAplicacao(entrada) {
    var f = FLUIDOS[entrada.fluido];
    var t = Number(entrada.temperatura), p = Number(entrada.pressao);
    var motivos = [];
    var status = f.status || 'indicada';
    if (f.nota) motivos.push(f.nota);

    if (status === 'nao') return { status: status, materiais: [], motivos: motivos, limite: null };

    if (t > 300) {
      motivos.unshift('Acima de 300 °C: fora até do pico transitório da sede.');
      return { status: 'nao', materiais: [], motivos: motivos, limite: null };
    }
    if (t > 250) {
      motivos.unshift('Operação contínua acima de 250 °C: limite térmico da sede RPTFE.');
      return { status: 'nao', materiais: [], motivos: motivos, limite: null };
    }
    if ((f.maxT && t > f.maxT) || (f.maxP && p > f.maxP)) {
      motivos.unshift(f.limite);
      return { status: 'nao', materiais: [], motivos: motivos, limite: null };
    }

    var limite = Math.max.apply(null, f.materiais.map(function (m) { return pressaoAdmissivel(m, t); }));
    var materiais = f.materiais.filter(function (m) { return p <= pressaoAdmissivel(m, t); });
    if (!materiais.length) {
      motivos.unshift('Acima da curva P×T: até ' + fmt(limite) + ' kgf/cm² a ' + t + ' °C.');
      return { status: 'nao', materiais: [], motivos: motivos, limite: limite };
    }
    if (f.limite) motivos.push(f.limite);
    return { status: status, materiais: materiais, motivos: motivos, limite: limite };
  }

  /* ---------- Configurador (catálogo de apresentação) ---------- */
  var BITOLAS = ['2"', '2½"', '3"', '4"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '24"', '28"', '30"', '32"', '36"', '40"', '44"', '48"'];
  var ate = function (max) { return BITOLAS.slice(0, BITOLAS.indexOf(max) + 1); };
  var CLASSES_ALTAS = ['150#', '300#', '600#', '900#', '1.500#'];
  var FUNDIDOS = ['WCB', 'WC6', 'WC9', 'C12A', 'CA15'];
  var ACIONAMENTO_PESADO = ['Volante manual', 'Caixa de redução', 'Elétrico', 'Hidráulico'];

  var TIPOS = [
    { id: 'bi', nome: 'Borboleta bi-excêntrica', produto: 'Válvula Borboleta Bi-excêntrica Classe 150',
      bitolas: BITOLAS.filter(function (b) { return b !== '16"'; }), classes: ['150#'],
      materiais: ['WCB', 'Ferro nodular', 'CF8', 'CF8M', 'CF3'],
      acionamentos: ['Caixa redutora com volante', 'Atuador pneumático'] },
    { id: 'concentrica', nome: 'Borboleta concêntrica', produto: 'Válvula Borboleta Concêntrica',
      bitolas: ate('40"'), classes: ['150#'],
      materiais: ['Ferro nodular', 'Aço-carbono', 'Inox'],
      acionamentos: ['Caixa redutora com volante', 'Atuador pneumático'] },
    { id: 'retencao', nome: 'Retenção', produto: 'Válvula de Retenção',
      bitolas: ate('40"'), classes: CLASSES_ALTAS,
      materiais: ['Ferro fundido', 'Aço-carbono', 'Inox'],
      acionamentos: ['Automática, sem acionamento'] },
    { id: 'gaveta', nome: 'Gaveta e globo', produto: 'Válvula Gaveta e Globo',
      bitolas: null, classes: CLASSES_ALTAS, materiais: FUNDIDOS, acionamentos: ACIONAMENTO_PESADO },
    { id: 'pressureseal', nome: 'Pressure seal', produto: 'Válvula Pressure Seal',
      bitolas: null, classes: CLASSES_ALTAS, materiais: FUNDIDOS, acionamentos: ACIONAMENTO_PESADO },
    { id: 'esfera', nome: 'Esfera segmentada', produto: 'Válvula Esfera Segmentada',
      bitolas: null, classes: null, materiais: ['CF8', 'CF8M'],
      acionamentos: ['Manual', 'Pneumático', 'Diafragma', 'Elétrico'] },
    { id: 'guilhotina', nome: 'Guilhotina', produto: 'Válvula Guilhotina',
      bitolas: ate('30"'), classes: null, materiais: ['Ferro nodular', 'CF8', 'CF8M'],
      acionamentos: ['Volante manual', 'Atuador pneumático'] },
  ];

  function resumoConfiguracao(sel) {
    var tipo = TIPOS.filter(function (t) { return t.id === sel.tipo; })[0];
    var partes = ['Configuração: ' + tipo.nome];
    if (sel.bitola) partes.push('Bitola ' + sel.bitola);
    if (sel.classe) partes.push('Classe ' + sel.classe);
    if (sel.material) partes.push('Material ' + sel.material);
    if (sel.acionamento) partes.push('Acionamento ' + sel.acionamento);
    return partes.join(' · ');
  }

  var api = {
    pressaoAdmissivel: pressaoAdmissivel,
    avaliarAplicacao: avaliarAplicacao,
    FLUIDOS: FLUIDOS,
    TIPOS: TIPOS,
    resumoConfiguracao: resumoConfiguracao,
  };
  global.NEW = global.NEW || {};
  global.NEW.engenharia = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
