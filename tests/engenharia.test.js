// Regras do simulador e do configurador (js/engenharia.js), com dados do boletim DT-VB150-001.
const assert = require('assert');
const E = require('../js/engenharia.js');

const tests = {
  'pressão admissível interpola a curva P×T do boletim': () => {
    assert.strictEqual(E.pressaoAdmissivel('WCB', 38), 20.0);
    assert.strictEqual(E.pressaoAdmissivel('CF8M', 250), 12.3);
    assert.ok(Math.abs(E.pressaoAdmissivel('WCB', 125) - 17.05) < 0.01);
    assert.strictEqual(E.pressaoAdmissivel('WCB', 20), 20.0, 'abaixo de 38 °C vale o valor de 38 °C');
    assert.strictEqual(E.pressaoAdmissivel('WCB', 320), null, 'acima de 300 °C não há valor');
  },
  'vapor saturado dentro da faixa do boletim é indicado': () => {
    const r = E.avaliarAplicacao({ fluido: 'vapor', temperatura: 180, pressao: 10 });
    assert.strictEqual(r.status, 'indicada');
    assert.ok(r.materiais.includes('WCB'));
  },
  'vapor acima de ≈14 kgf/cm² ou 195 °C não é recomendado': () => {
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'vapor', temperatura: 210, pressao: 12 }).status, 'nao');
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'vapor', temperatura: 150, pressao: 15 }).status, 'nao');
  },
  'óleo térmico fica com restrição (fire-safe)': () => {
    const r = E.avaliarAplicacao({ fluido: 'oleo', temperatura: 220, pressao: 8 });
    assert.strictEqual(r.status, 'restricao');
    assert.ok(r.motivos.join(' ').includes('fire-safe'));
  },
  'ácido sulfâmico só em inox e até ≈60 °C': () => {
    const r = E.avaliarAplicacao({ fluido: 'sulfamico', temperatura: 50, pressao: 5 });
    assert.strictEqual(r.status, 'indicada');
    assert.deepStrictEqual(r.materiais.sort(), ['CF3', 'CF3M', 'CF8', 'CF8M']);
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'sulfamico', temperatura: 70, pressao: 5 }).status, 'nao');
  },
  'soda cáustica acima de ≈90 °C não é recomendada': () => {
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'soda', temperatura: 80, pressao: 5 }).status, 'indicada');
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'soda', temperatura: 120, pressao: 5 }).status, 'nao');
  },
  'acima de 250 °C contínuo a sede RPTFE não é recomendada': () => {
    const r = E.avaliarAplicacao({ fluido: 'etanol', temperatura: 270, pressao: 5 });
    assert.strictEqual(r.status, 'nao');
    assert.ok(r.motivos.join(' ').includes('250'));
  },
  'pressão acima da curva P×T não é recomendada e cita o limite': () => {
    const r = E.avaliarAplicacao({ fluido: 'xarope', temperatura: 200, pressao: 15 });
    assert.strictEqual(r.status, 'nao');
    assert.ok(r.motivos.join(' ').includes('14'));
  },
  'abrasivos e fire-safe certificado não são recomendados': () => {
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'abrasivo', temperatura: 40, pressao: 3 }).status, 'nao');
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'firesafe', temperatura: 40, pressao: 3 }).status, 'nao');
  },
  'material só entra se a pressão couber na curva dele': () => {
    // a 100 °C: WCB 18,0 · CF8M/CF3M 16,5 · CF8/CF3 16,0
    const r = E.avaliarAplicacao({ fluido: 'etanol', temperatura: 100, pressao: 16.3 });
    assert.strictEqual(r.status, 'indicada');
    assert.deepStrictEqual(r.materiais.sort(), ['CF3M', 'CF8M', 'WCB']);
  },
  // correções de 18/11/2026 (CORRECOES_SIMULADOR_SITE.md, tabela de testes)
  'CIP alternado tem o teto da soda (≈90 °C) e aceita CF3M': () => {
    const av = (t) => E.avaliarAplicacao({ fluido: 'cip', temperatura: t, pressao: 10 });
    assert.strictEqual(av(200).status, 'nao');
    assert.strictEqual(av(80).status, 'indicada');
    assert.deepStrictEqual(av(80).materiais.sort(), ['CF3', 'CF3M', 'CF8M']);
  },
  'ácido nítrico tem teto provisório de ≈90 °C': () => {
    const av = (t) => E.avaliarAplicacao({ fluido: 'nitrico', temperatura: t, pressao: 10 });
    assert.strictEqual(av(240).status, 'nao');
    assert.strictEqual(av(60).status, 'indicada');
    assert.deepStrictEqual(av(60).materiais.sort(), ['CF3', 'CF3M', 'CF8', 'CF8M']);
  },
  'vapor saturado avisa que temperatura e pressão andam juntas': () => {
    const r = E.avaliarAplicacao({ fluido: 'vapor', temperatura: 180, pressao: 10 });
    assert.strictEqual(r.status, 'indicada');
    assert.ok(r.motivos.join(' ').includes('andam juntas'));
    const topo = E.avaliarAplicacao({ fluido: 'vapor', temperatura: 195, pressao: 14 });
    assert.strictEqual(topo.status, 'indicada');
    assert.deepStrictEqual(topo.materiais.sort(), ['CF3M', 'CF8M', 'WCB']);
  },
  'demais casos da tabela: soda, vinhaça e óleo térmico': () => {
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'soda', temperatura: 95, pressao: 5 }).status, 'nao');
    const v = E.avaliarAplicacao({ fluido: 'vinhaca', temperatura: 100, pressao: 10 });
    assert.strictEqual(v.status, 'indicada');
    assert.deepStrictEqual(v.materiais.sort(), ['CF3', 'CF3M', 'CF8', 'CF8M']);
    assert.strictEqual(E.avaliarAplicacao({ fluido: 'oleo', temperatura: 250, pressao: 12.3 }).status, 'restricao');
    assert.strictEqual(E.pressaoAdmissivel('CF3M', 100), E.pressaoAdmissivel('CF8M', 100));
  },
  'configurador lista as válvulas do catálogo': () => {
    const ids = E.TIPOS.map((t) => t.id);
    for (const id of ['bi', 'concentrica', 'retencao', 'gaveta', 'pressureseal', 'esfera', 'guilhotina']) assert.ok(ids.includes(id), id);
  },
  'bitolas de cada tipo respeitam a faixa do catálogo': () => {
    const bi = E.TIPOS.find((t) => t.id === 'bi');
    assert.strictEqual(bi.bitolas[0], '2"');
    assert.strictEqual(bi.bitolas[bi.bitolas.length - 1], '48"');
    const conc = E.TIPOS.find((t) => t.id === 'concentrica');
    assert.deepStrictEqual(conc.classes, ['150#'], 'borboleta é Classe 150');
    const gui = E.TIPOS.find((t) => t.id === 'guilhotina');
    assert.strictEqual(gui.bitolas[gui.bitolas.length - 1], '30"');
    const gav = E.TIPOS.find((t) => t.id === 'gaveta');
    assert.deepStrictEqual(gav.classes, ['150#', '300#', '600#', '900#', '1.500#']);
  },
  'resumo da configuração vira mensagem de orçamento': () => {
    const txt = E.resumoConfiguracao({ tipo: 'bi', bitola: '8"', classe: '150#', material: 'CF8M', acionamento: 'Caixa redutora com volante' });
    assert.ok(txt.includes('Borboleta bi-excêntrica'));
    assert.ok(txt.includes('8"') && txt.includes('CF8M') && txt.includes('Caixa redutora'));
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n')[0]); }
}
console.log(failed ? `${failed} falha(s)` : 'engenharia: todos passaram');
process.exit(failed ? 1 : 0);
