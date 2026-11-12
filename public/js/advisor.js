/* Asesor IA de ATP Store: widget flotante disponible en todas las páginas */
(function () {
  const SS = 'atp_advisor_history';
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(SS)) || []; } catch {}
  let busy = false;

  const fab = document.createElement('button');
  fab.id = 'adv-fab'; fab.type = 'button'; fab.textContent = '✨ Asesor IA';
  fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'adv-panel');

  const panel = document.createElement('section');
  panel.id = 'adv-panel'; panel.setAttribute('aria-label', 'Asesor de moda');
  panel.innerHTML = `
    <div class="adv-head"><div><b>Asesor ATP</b><small>Te ayudo a armar tu outfit</small></div><button type="button" id="adv-close" aria-label="Cerrar asesor">&times;</button></div>
    <div class="adv-log" id="adv-log" aria-live="polite"></div>
    <div class="adv-chips" id="adv-chips"></div>
    <form class="adv-form" id="adv-form"><input id="adv-input" maxlength="500" placeholder="Ej: outfit para una fiesta, hasta 150 mil" aria-label="Tu mensaje" autocomplete="off"><button class="btn small" type="submit">Enviar</button></form>`;

  const log = () => panel.querySelector('#adv-log');
  const input = () => panel.querySelector('#adv-input');

  function addBubble(role, text) {
    const b = document.createElement('div');
    b.className = 'bubble ' + (role === 'user' ? 'me' : 'bot');
    b.textContent = text;
    log().appendChild(b); log().scrollTop = log().scrollHeight;
    return b;
  }
  function addProducts(products) {
    if (!products || !products.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'adv-prods';
    products.forEach((p) => {
      const m = document.createElement('button');
      m.type = 'button'; m.className = 'mini';
      m.innerHTML = `<img src="${ATP.esc(p.image)}" alt=""><div><b>${ATP.esc(p.name)}</b><span>${ATP.fmt(p.price)}</span></div>`;
      m.addEventListener('click', () => ATP.openProduct(p));
      wrap.appendChild(m);
    });
    log().appendChild(wrap); log().scrollTop = log().scrollHeight;
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    addBubble('user', text);
    const typing = document.createElement('div');
    typing.className = 'bubble bot'; typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    log().appendChild(typing); log().scrollTop = log().scrollHeight;
    try {
      const data = await ATP.api('/advisor/chat', { method: 'POST', body: { message: text, history } });
      typing.remove();
      addBubble('assistant', data.reply);
      addProducts(data.products);
      history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply });
      history = history.slice(-12);
      try { sessionStorage.setItem(SS, JSON.stringify(history)); } catch {}
    } catch (e) {
      typing.remove();
      addBubble('assistant', e.message || 'No pude responder ahora. Intenta de nuevo.');
    }
    busy = false;
  }

  function open() {
    panel.classList.add('open'); fab.setAttribute('aria-expanded', 'true');
    if (!log().children.length) {
      addBubble('assistant', '¡Hola! 👋 Soy el asesor de ATP Store. Dime la ocasión, tu presupuesto o el estilo que buscas y te recomiendo prendas del catálogo.');
      const chips = panel.querySelector('#adv-chips');
      ['Outfit para una fiesta', 'Algo fresco para la playa', 'Ropa de oficina hasta 150 mil', 'Regalo para un hombre'].forEach((t) => {
        const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.textContent = t;
        c.addEventListener('click', () => { chips.remove(); send(t); });
        chips.appendChild(c);
      });
    }
    input().focus();
  }
  function close() { panel.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

  fab.addEventListener('click', () => (panel.classList.contains('open') ? close() : open()));
  panel.querySelector('#adv-close').addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  panel.querySelector('#adv-form').addEventListener('submit', (e) => { e.preventDefault(); const v = input().value; input().value = ''; send(v); });

  document.body.append(fab, panel);
  window.ATPAdvisor = { open };

  // Reconstruye la conversación guardada en esta pestaña
  history.forEach((m) => addBubble(m.role, m.content));
})();
