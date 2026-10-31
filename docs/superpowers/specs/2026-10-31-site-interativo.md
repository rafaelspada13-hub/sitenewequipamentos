# Site interativo NEW — escopo da segunda fase

Data: 2026-10-31. Aprovado pelo cliente em conversa ("segue", sem antes/depois).

## Objetivo

Trocar leitura passiva por ferramentas que o comprador usa, todas com dados reais da NEW.

## Peças

1. **Simulador de aplicação (bi-excêntrica Classe 150).** Entradas: fluido, temperatura
   (20–320 °C) e pressão (0–22 kgf/cm²). Saída: status (Indicada / Com restrição /
   Não recomendada), materiais que atendem, motivos e ponto sobre a curva P×T.
   Regras e números exclusivamente do boletim DT-VB150-001 (seções 5, 6, 7 e 8).
   Botão "Orçar esta aplicação" preenche o formulário.
2. **Monte sua válvula.** Tipo → bitola → classe → material → acionamento, com opções
   de cada tipo tiradas do catálogo de apresentação e do boletim. Onde o catálogo não
   informa a faixa, a opção é "sob consulta". Resumo + "Orçar esta configuração".
3. **Linha de válvulas que desliza.** Seção fixa em que os cartões dos produtos passam
   na horizontal com a rolagem; cada cartão leva à ficha no catálogo.
4. **Mapa de logística.** Esquema em radar centrado em Sertãozinho, com as regiões de
   entrega posicionadas pelas coordenadas reais e anéis de 100/200/300 km.
5. **Números que contam:** 24 anos de experiência, 18 clientes, até 72", até 1.500#.

## Restrições

- Lógica pura em `js/engenharia.js`, testável em Node; interface em `js/interativo.js`.
- Sem JS: simulador e configurador mostram texto e a tabela de aplicações; a linha de
  válvulas vira lista rolável; números aparecem com o valor final.
- `prefers-reduced-motion`: sem fixação/rolagem horizontal, sem contagem animada.
- Sem rolagem horizontal da página de 360 a 2560 px.
- Fora de escopo: antes/depois da manutenção (cliente não tem as fotos).
