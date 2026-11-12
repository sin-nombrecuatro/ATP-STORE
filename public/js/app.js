/* ATP Store - núcleo compartido por todas las páginas */
(function () {
  const ATP = (window.ATP = {});

  /* ---------- Utilidades ---------- */
  ATP.fmt = (n) => '$' + Math.round(n).toLocaleString('es-CO');
  ATP.esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  ATP.api = async function (path, { method = 'GET', body } = {}) {
    const res = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    let data = {};
    try { data = await res.json(); } catch { /* respuesta vacía */ }
    if (!res.ok) {
      const err = new Error(data.error || 'Error de conexión con el servidor.');
      err.status = res.status;
      throw err;
    }
    return data;
  };

  let toastTimer;
  ATP.toast = function (text) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  };

  /* ---------- Carrito (localStorage; el servidor recalcula precios al comprar) ---------- */
  const KEY = 'atp_cart';
  const cart = {
    get() { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } },
    save(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage lleno/bloqueado */ } updateBadge(); },
    count() { return this.get().reduce((a, i) => a + i.quantity, 0); },
    add(p, size, color, quantity = 1) {
      const items = this.get();
      const found = items.find((i) => i.productId === p._id && i.size === size && i.color === color);
      if (found) found.quantity = Math.min(20, found.quantity + quantity);
      else items.push({ productId: p._id, name: p.name, price: p.price, image: p.image, size, color, quantity });
      this.save(items);
    },
    setQty(idx, q) { const items = this.get(); if (!items[idx]) return; items[idx].quantity = Math.max(1, Math.min(20, q)); this.save(items); },
    remove(idx) { const items = this.get(); items.splice(idx, 1); this.save(items); },
    clear() { this.save([]); }
  };
  ATP.cart = cart;

  function updateBadge() {
    const b = document.getElementById('cart-badge');
    if (!b) return;
    const n = cart.count();
    b.textContent = n;
    b.hidden = n === 0;
  }

  /* ---------- Layout: header + footer ---------- */
  ATP.user = null;

  function renderHeader() {
    const page = document.body.dataset.page || '';
    const link = (href, id, text) => `<a href="${href}" class="${page === id ? 'active' : ''}">${text}</a>`;
    const u = ATP.user;
    const account = u
      ? `${link('/cuenta', 'cuenta', 'Hola, ' + ATP.esc(u.name.split(' ')[0]))}<button class="linklike" id="logout-btn" type="button">Salir</button>`
      : link('/login', 'login', 'Ingresar');
    document.getElementById('site-header').innerHTML = `
      <header class="site"><div class="container header-in">
        <a class="Brand" href="/" aria-label="ATP Store - inicio"><img src="/img/logo.png" alt="Logo de ATP Store" class="logo"><h1>ATP store</h1></a>
        <button class="menu-btn" id="menu-btn" aria-label="Abrir menú" aria-expanded="false">&#9776;</button>
        <nav class="main" id="main-nav">
          ${link('/', 'inicio', 'Inicio')}${link('/productos', 'productos', 'Productos')}${link('/contacto', 'contacto', 'Contacto')}
          ${account}
          <a href="/carrito" class="cart-link ${page === 'carrito' ? 'active' : ''}" aria-label="Carrito">🛒<span class="cart-txt"> Carrito</span><span class="badge" id="cart-badge" hidden>0</span></a>
        </nav>
      </div></header>`;
    document.getElementById('menu-btn').addEventListener('click', (e) => {
      const open = document.getElementById('main-nav').classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    });
    const lo = document.getElementById('logout-btn');
    if (lo) lo.addEventListener('click', async () => { try { await ATP.api('/auth/logout', { method: 'POST' }); } catch {} location.href = '/'; });
    updateBadge();
  }

  function renderFooter() {
    document.getElementById('site-footer').innerHTML = `
      <footer class="site"><div class="container in">
        <div><strong>ATP store</strong><br>Moda con asesoría inteligente.</div>
        <div>¿Dudas? <a href="/contacto">Contáctanos</a><br>© ${new Date().getFullYear()} ATP Store</div>
      </div></footer>`;
  }

  /* ---------- Tarjeta y modal de producto ---------- */
  ATP.productCard = function (p) {
    const el = document.createElement('article');
    el.className = 'card';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Ver ${p.name}`);
    el.innerHTML = `<div class="ph"><img src="${ATP.esc(p.image)}" alt="${ATP.esc(p.name)}" loading="lazy"></div>
      <div class="info"><span class="cat">${ATP.esc(p.category)}</span><h3>${ATP.esc(p.name)}</h3><div class="price">${ATP.fmt(p.price)}</div></div>`;
    const open = () => ATP.openProduct(p);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    return el;
  };

  ATP.openProduct = function (p) {
    let dlg = document.getElementById('product-dialog');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'product-dialog'; document.body.appendChild(dlg); }
    let size = p.sizes[0], color = p.colors[0], qty = 1;
    const sizeOpts = p.sizes.map((s, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-size="${ATP.esc(s)}">${ATP.esc(s)}</button>`).join('');
    const colorOpts = p.colors.map((c, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-color="${ATP.esc(c)}">${ATP.esc(c)}</button>`).join('');
    dlg.innerHTML = `<div class="pm">
      <div class="ph"><img src="${ATP.esc(p.image)}" alt="${ATP.esc(p.name)}"></div>
      <div class="body">
        <button class="close" type="button" aria-label="Cerrar">&times;</button>
        <span class="cat" style="color:var(--muted);font-size:.8rem;text-transform:uppercase">${ATP.esc(p.category)}</span>
        <h2>${ATP.esc(p.name)}</h2><div class="price">${ATP.fmt(p.price)}</div>
        <p>${ATP.esc(p.description)}</p>
        <label>Talla</label><div class="opts" id="pm-sizes">${sizeOpts}</div>
        <label>Color</label><div class="opts" id="pm-colors">${colorOpts}</div>
        <label>Cantidad</label>
        <div class="qty"><button type="button" id="q-" aria-label="Menos">−</button><strong id="q">1</strong><button type="button" id="q+" aria-label="Más">+</button></div>
        <p style="margin-top:20px"><button class="btn" id="pm-add" type="button" ${p.stock < 1 ? 'disabled' : ''}>${p.stock < 1 ? 'Agotado' : 'Agregar al carrito'}</button></p>
      </div></div>`;
    const pick = (sel, attr, set) => dlg.querySelector(sel).addEventListener('click', (e) => {
      const b = e.target.closest('.opt'); if (!b) return;
      dlg.querySelectorAll(sel + ' .opt').forEach((x) => x.classList.remove('on'));
      b.classList.add('on'); set(b.dataset[attr]);
    });
    pick('#pm-sizes', 'size', (v) => (size = v));
    pick('#pm-colors', 'color', (v) => (color = v));
    dlg.querySelector('#q-').addEventListener('click', () => { qty = Math.max(1, qty - 1); dlg.querySelector('#q').textContent = qty; });
    dlg.querySelector('#q\\+').addEventListener('click', () => { qty = Math.min(Math.min(20, p.stock), qty + 1); dlg.querySelector('#q').textContent = qty; });
    dlg.querySelector('.close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }, { once: true });
    dlg.querySelector('#pm-add').addEventListener('click', () => { cart.add(p, size, color, qty); dlg.close(); ATP.toast('Agregado al carrito ✓'); });
    dlg.showModal();
  };

  /* ---------- Inicio ---------- */
  ATP.ready = (async function () {
    try { ATP.user = (await ATP.api('/auth/me')).user; } catch { ATP.user = null; }
    renderHeader();
    renderFooter();
  })();
})();
