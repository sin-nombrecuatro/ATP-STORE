// ============================================================
//  NÚMERO PARA COORDINAR EL PAGO
//  Escribe aquí el teléfono/WhatsApp de la tienda, por ejemplo: '3001234567'
//  Mientras tenga letras (como 3XX), la ventana muestra el espacio vacío
//  y el botón de WhatsApp no aparece.
// ============================================================
const TELEFONO_PAGO = '313 7839116 o 305 3211858';

(async function () {
  await ATP.ready;
  const list = document.getElementById('cart-list');
  const summary = document.getElementById('summary');
  const checkout = document.getElementById('checkout');
  const done = document.getElementById('done');
  let cfg = { freeShippingFrom: 200000, shippingCost: 12000 };
  try { cfg = await ATP.api('/config'); } catch {}

  // Sincroniza precios/nombres con el catálogo actual y descarta productos que ya no existen
  try {
    const { products } = await ATP.api('/products');
    const map = new Map(products.map((p) => [p._id, p]));
    const items = ATP.cart.get().filter((i) => map.has(i.productId)).map((i) => {
      const p = map.get(i.productId);
      return { ...i, name: p.name, price: p.price, image: p.image };
    });
    ATP.cart.save(items);
  } catch {}

  function render() {
    const items = ATP.cart.get();
    if (!items.length) {
      list.innerHTML = '<p class="empty">Tu carrito está vacío. <a href="/productos">Ir a la tienda</a></p>';
      summary.hidden = true; checkout.hidden = true;
      return;
    }
    summary.hidden = false;
    list.innerHTML = '';
    items.forEach((i, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `<img src="${ATP.esc(i.image)}" alt="">
        <div><strong>${ATP.esc(i.name)}</strong>
          <div class="meta">Talla ${ATP.esc(i.size)} · ${ATP.esc(i.color)} · ${ATP.fmt(i.price)} c/u</div>
          <div class="qty" style="margin-top:6px"><button type="button" data-a="dec" aria-label="Menos">−</button><strong>${i.quantity}</strong><button type="button" data-a="inc" aria-label="Más">+</button>
          <button type="button" class="link-del" data-a="del">🗑️</button></div></div>
        <strong>${ATP.fmt(i.price * i.quantity)}</strong>`;
      row.addEventListener('click', (e) => {
        const a = e.target.dataset.a; if (!a) return;
        if (a === 'del') ATP.cart.remove(idx);
        else ATP.cart.setQty(idx, i.quantity + (a === 'inc' ? 1 : -1));
        render();
      });
      list.appendChild(row);
    });
    const sub = items.reduce((a, i) => a + i.price * i.quantity, 0);
    const ship = sub >= cfg.freeShippingFrom ? 0 : cfg.shippingCost;
    summary.innerHTML = `<h3 style="margin-top:0">Resumen</h3>
      <div class="sum-line"><span>Subtotal</span><span>${ATP.fmt(sub)}</span></div>
      <div class="sum-line"><span>Envío</span><span>${ship ? ATP.fmt(ship) : 'Gratis'}</span></div>
      ${ship ? `<small style="color:var(--muted)">Envío gratis desde ${ATP.fmt(cfg.freeShippingFrom)}</small>` : ''}
      <div class="sum-line total"><span>Total</span><span>${ATP.fmt(sub + ship)}</span></div>`;
    checkout.hidden = !ATP.user;
    document.getElementById('login-hint').hidden = !!ATP.user;
  }
  render();


  // Ventana flotante con las instrucciones de pago
  function showPayDialog(order) {
    const code = String(order._id).slice(-6).toUpperCase();
    const raw = String(TELEFONO_PAGO).trim();
    const configured = /^[\d\s+\-()]+$/.test(raw) && raw.replace(/\D/g, '').length >= 10;
    const digits = raw.replace(/\D/g, '');
    const wa = configured ? (digits.length === 10 ? '57' + digits : digits) : '';
    const text = `Hola, quiero pagar mi pedido #${code} por ${ATP.fmt(order.total)}.`;

    let dlg = document.getElementById('pay-dialog');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'pay-dialog'; dlg.style.width = 'min(480px, 92vw)'; document.body.appendChild(dlg); }
    dlg.innerHTML = `<div style="position:relative;padding:30px 28px;text-align:center">
        <button class="close" type="button" aria-label="Cerrar">&times;</button>
        <h2 class="section-title" style="font-size:2.2rem">¡Pedido registrado!</h2>
        <p>Para confirmar tu compra, <strong>escríbenos al número:</strong></p>
        <p style="font-size:1.8rem;font-weight:700;color:var(--brand-dark);margin:8px 0">${ATP.esc(raw)}</p>
        <p style="color:var(--muted);font-size:.92rem">Indícanos tu pedido <strong>#${ATP.esc(code)}</strong> por <strong>${ATP.fmt(order.total)}</strong> y te enviaremos los datos para pagar.</p>
        <p style="margin-top:20px">${wa ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(text)}">Escribir por WhatsApp</a> ` : ''}<button class="btn light" id="pay-ok" type="button">Entendido</button></p>
      </div>`;
    dlg.querySelector('.close').addEventListener('click', () => dlg.close());
    dlg.querySelector('#pay-ok').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.showModal();
  }

  const form = document.getElementById('ship-form');
  const msg = document.getElementById('msg');
  if (ATP.user) form.elements.fullName.value = ATP.user.name;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; msg.hidden = true;
    const d = new FormData(form);
    try {
      const { order } = await ATP.api('/orders', {
        method: 'POST',
        body: {
          items: ATP.cart.get().map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
          shipping: { fullName: d.get('fullName'), phone: d.get('phone'), address: d.get('address'), city: d.get('city') }
        }
      });
      ATP.cart.clear();
      document.getElementById('cart-area').hidden = true;
      done.hidden = false;
      done.innerHTML = `<div class="panel wide" style="text-align:center"><h2 class="section-title">¡Gracias por tu compra!</h2>
        <p>Tu pedido <strong>#${ATP.esc(String(order._id).slice(-6).toUpperCase())}</strong> por <strong>${ATP.fmt(order.total)}</strong> quedó registrado como <em>pendiente de pago</em>.</p>
        <p><button class="btn" id="pay-info" type="button">Ver cómo pagar</button> <a class="btn ghost" href="/cuenta">Ver mis pedidos</a></p></div>`;
      done.querySelector('#pay-info').addEventListener('click', () => showPayDialog(order));
      showPayDialog(order);
    } catch (err) {
      msg.textContent = err.message; msg.className = 'msg error'; msg.hidden = false; btn.disabled = false;
    }
  });
})();
aaaa