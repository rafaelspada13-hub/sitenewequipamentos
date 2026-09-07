# Instruções para o Claude neste projeto

## Site institucional — NEW Válvulas e Equipamentos Industriais

Site estático (HTML/CSS/JS puro, sem framework/build step) em `index.html`,
`css/style.css`, `js/main.js`, imagens em `img/`.

## Comportamento esperado (pedido explícito do usuário)

Quando o usuário pedir referência visual, template ou inspiração de design
("faz igual a um site que eu vi", "acha um template bom", etc.):

- **Pesquisar sozinho primeiro**, usando WebSearch e, se necessário,
  `add_repo` para clonar e inspecionar repositórios reais do GitHub.
- **Não ficar pedindo para o usuário caçar/mandar links.** Só perguntar
  depois de já ter tentado buscar e não ter achado nada razoável, ou quando
  a dúvida for sobre gosto/preferência que só o usuário pode decidir
  (ex.: qual de duas opções ele prefere).
- Links soltos que o usuário manda (posts de rede social, páginas de busca
  do GitHub como `github.com/topics/...`) geralmente não são o repositório
  em si — vale a pena investigar e, se não servir, já procurar uma
  alternativa por conta própria em vez de simplesmente devolver a pergunta.
