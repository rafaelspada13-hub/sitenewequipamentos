# Repaginação do site NEW Válvulas — Design

Data: 2026-10-30

## Objetivo

Gerar interesse e surpreender pela qualidade do site, sem perder as informações
técnicas que o comprador/engenheiro precisa para pedir orçamento.

## Decisões do cliente

- Remover toda menção à parceria W.Burger (não existe mais).
- Direção visual: "Engenharia de precisão".
- Fotos: usar só as de bom enquadramento; liberdade para descartar ou recortar.

## Direção visual

- Base grafite escuro; seções técnicas em fundo claro para leitura.
- Cor de destaque: magenta dos protetores de flange presentes nas fotos.
- Verde fica restrito ao logo.
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
4. Produtos: cartões com foto e especificações (dados atuais do site).
   Clique abre ficha completa; "Orçar este item" preenche o formulário.
5. Serviços: manutenção em etapas (recebimento → diagnóstico → reparo → entrega),
   montagens industriais, fabricação de componentes.
6. Segmentos atendidos.
7. Estrutura e estoque: mosaico de fotos com ampliação + vídeo.
8. Contato: formulário que abre o WhatsApp (5516997223976) com a mensagem montada;
   e-mail comercial@newequipamentos.ind.br; botão flutuante de WhatsApp.
9. Rodapé.

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
