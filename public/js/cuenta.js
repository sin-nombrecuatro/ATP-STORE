(async function () {
  await ATP.ready;
  if (!ATP.user) { location.replace('/login?next=/cuenta'); return; }
  const u = ATP.user;
  document.getElementById('hello').textContent = `Hola, ${u.name}`;
  document.getElementById('email').textContent = u.email;

  const form = document.getElementById('pref-form');
  form.elements.style.value = u.preferences.style || '';
  form.elements.size.value = u.preferences.size || '';
  form.elements.budget.value = u.preferences.budget || '';
  const msg = document.getElementById('msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await ATP.api('/auth/preferences', { method: 'PATCH', body: { style: form.elements.style.value, size: form.elements.size.value, budget: Number(form.elements.budget.value) || 0 } });
      msg.textContent = 'Preferencias guardadas. El asesor las usará para recomendarte mejor.'; msg.className = 'msg ok';
    } catch (err) { msg.textContent = err.message; msg.className = 'msg error'; }
    msg.hidden = false;
  });

  const box = document.getElementById('orders');
  try {
    const { orders } = await ATP.api('/orders/mine');
    if (!orders.length) { box.innerHTML = '<p class="empty">Aún no tienes pedidos. <a href="/productos">Empieza a comprar</a></p>'; return; }
    box.innerHTML = orders.map((o) => `<div class="order">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>Pedido #${ATP.esc(String(o._id).slice(-6).toUpperCase())}</strong><span class="status">${ATP.esc(o.status)}</span></div>
      <small style="color:var(--muted)">${new Date(o.createdAt).toLocaleDateString('es-CO', { dateStyle: 'long' })}</small>
      <ul style="padding-left:18px;margin:8px 0">${o.items.map((i) => `<li>${i.quantity} × ${ATP.esc(i.name)} (${ATP.esc(i.size)}, ${ATP.esc(i.color)})</li>`).join('')}</ul>
      <strong>Total: ${ATP.fmt(o.total)}</strong></div>`).join('');
  } catch (e) { box.innerHTML = `<p class="empty">${ATP.esc(e.message)}</p>`; }
})();
