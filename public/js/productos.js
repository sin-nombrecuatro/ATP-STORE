(async function () {
  await ATP.ready;
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const f = { q: document.getElementById('q'), sort: document.getElementById('sort'), max: document.getElementById('max') };
  const chips = document.getElementById('chips');
  const params = new URLSearchParams(location.search);
  let category = params.get('category') || '';
  f.q.value = params.get('q') || '';

  function paintChips() {
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === category));
  }

  let timer;
  async function load() {
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    if (f.q.value.trim()) qs.set('q', f.q.value.trim());
    if (f.sort.value) qs.set('sort', f.sort.value);
    if (f.max.value) qs.set('max', f.max.value);
    grid.setAttribute('aria-busy', 'true');
    try {
      const { products } = await ATP.api('/products?' + qs);
      count.textContent = products.length + (products.length === 1 ? ' producto' : ' productos');
      if (!products.length) grid.innerHTML = '<p class="empty" style="grid-column:1/-1">No encontramos productos con esos filtros. Prueba con otros o pregúntale a nuestro asesor 💬</p>';
      else grid.replaceChildren(...products.map(ATP.productCard));
    } catch (e) {
      grid.innerHTML = `<p class="empty" style="grid-column:1/-1">${ATP.esc(e.message)}</p>`;
    }
    grid.removeAttribute('aria-busy');
  }

  chips.addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c) return;
    category = c.dataset.cat; paintChips(); load();
  });
  f.q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
  f.sort.addEventListener('change', load);
  f.max.addEventListener('change', load);
  paintChips(); load();
})();
