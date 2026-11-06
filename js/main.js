// NEW Válvulas — comportamento do site
(function () {
  // Ano no rodapé
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
