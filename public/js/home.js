(async function () {
  await ATP.ready;
  const grid = document.getElementById('featured');
  try {
    const { products } = await ATP.api('/products?featured=true');
    grid.replaceChildren(...products.slice(0, 8).map(ATP.productCard));
  } catch (e) {
    grid.innerHTML = `<p class="empty">No pudimos cargar los productos. ${ATP.esc(e.message)}</p>`;
  }
  const open = document.getElementById('open-advisor');
  if (open) open.addEventListener('click', () => window.ATPAdvisor && window.ATPAdvisor.open());
})();
