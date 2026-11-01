# Repaginação do site NEW Válvulas — Design

Data: 2026-10-30

## Objetivo

Gerar interesse e surpreender pela qualidade do site, sem perder as informações
técnicas que o comprador/engenheiro precisa para pedir orçamento.

## Decisões do cliente

- Remover toda menção à parceria W.Burger (não existe mais).
- Direção visual: "Engenharia de precisão", alinhada ao boletim técnico DT-VB150-001.
- Cor de destaque: verde da marca (não magenta).
- WhatsApp do site: (16) 99722-3976. Não exibir o 99709-4211.
- Dados técnicos: o boletim DT-VB150-001 prevalece sobre o texto atual do site.
- Fotos: usar só as de bom enquadramento; liberdade para descartar ou recortar.

## Direção visual

- Base grafite escuro; seções técnicas em fundo claro para leitura.
- Cor de destaque: verde escuro da marca (logo e boletim), com variação mais clara
  para contraste sobre fundo escuro. O magenta aparece só nas fotos.
- Logo real extraído do boletim (triângulo + válvula + "NEW"), substituindo o SVG genérico.
- Tipografia: títulos grandes; números e especificações em fonte mono.
- Detalhes de desenho técnico (linhas de cota, numeração de seção).
- Ícones em SVG próprios, sem emojis.
- Animações discretas de entrada ao rolar, respeitando `prefers-reduced-motion`.
  O conteúdo deve ficar visível mesmo se o JS falhar.

## Estrutura (uma página)

1. Header fixo: logo, navegação, botão "Pedir orçamento".
2. Hero: foto real em destaque, título, CTAs "Pedir orçamento" e "Ver válvulas",
   faixa com fatos verificáveis (atendimento nacional, 5 segmentos, Sertãozinho/SP).
3. Quem somos: texto curto + foto.
4. Produtos: cartões com foto e especificações.
   Clique abre ficha completa; "Orçar este item" preenche o formulário.
   Bi-excêntrica Classe 150 ganha seção técnica completa a partir do boletim:
   destaques (2"–48", ASME 150, semi-lug, até 250 °C contínuo, API 609 Cat. B),
   desenho dimensional, tabela dimensional 2"–48", curva P×T por material,
   normas, configuração construtiva, aplicações sucroenergético/etanol de milho
   (com status indicada/restrição/não recomendada) e download do PDF.
   Demais produtos mantêm os dados atuais do site, corrigindo o que conflitar.
5. Serviços: manutenção em etapas (recebimento → diagnóstico → reparo → entrega),
   montagens industriais, fabricação de componentes.
6. Segmentos atendidos.
7. Estrutura e estoque: mosaico de fotos com ampliação + vídeo.
8. Contato: formulário que abre o WhatsApp (5516997223976) com a mensagem montada;
   e-mail comercial@newequipamentos.ind.br; botão flutuante de WhatsApp.
9. Rodapé: razão social New Service Equipamentos Industriais Ltda, CNPJ
   50.582.366/0001-94, CREA-SP 2619052, Rua Argentina Grillo Badia, 960 ·
   Distrito Industrial · Sertãozinho/SP · CEP 14176-113.

## Fotos

Descartar: imagens com barras pretas, desfocadas ou com peças oxidadas pré-reforma.
Gerar versões otimizadas (WebP + JPEG, largura máx. ~1600px, qualidade ~78) em
`img/opt/`, mantendo os originais.

## Restrições

- HTML/CSS/JS puros, sem build, hospedável em qualquer servidor estático.
- Não inventar números (anos de mercado, quantidades) não fornecidos pelo cliente.
- Responsivo de 360px a 1920px, sem rolagem horizontal.
- Acessibilidade: contraste AA, foco visível, textos alternativos nas fotos.

## Verificação

Screenshots com Playwright em 390px e 1440px; revisão de qualidade com as skills
taste-skill e impeccable; checar formulário gerando o link do WhatsApp correto.
